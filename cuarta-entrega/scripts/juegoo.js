// ------------------- Pantallas y botones -------------------
const btnPlay = document.getElementById('btn-play');
const pantallaJuegoInactivo = document.getElementById('pantalla-juego');
const pantallaJuegoActivo = document.getElementById('pantalla-juego-principal');

btnPlay.addEventListener('click', () => {
    pantallaJuegoInactivo.style.display = 'none';
    pantallaJuegoActivo.style.display = 'flex';
});

// ------------------- Botones principales -------------------
const btnJugarSolo = document.getElementById('solo');
const btnMultijugador = document.getElementById('multijugador');
const btnInstrucciones = document.getElementById('instrucciones');
const pantallaMultijugador = document.getElementById('pantalla-multijugador');
const pantallaInstrucciones = document.getElementById('pantalla-instrucciones');
const pantallaElegirPj = document.getElementById('solitario-piezas');
const pantallaJuego = document.getElementById('juego-pantalla');

// ---- Pantallas ----
btnInstrucciones.addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'none';
    pantallaInstrucciones.style.display = 'flex';
});
document.getElementById('volver-instrucciones').addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'flex';
    pantallaInstrucciones.style.display = 'none';
});

btnMultijugador.addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'none';
    pantallaMultijugador.style.display = 'flex';
});
document.getElementById('volver-multijugador').addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'flex';
    pantallaMultijugador.style.display = 'none';
});

btnJugarSolo.addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'none';
    pantallaElegirPj.style.display = 'flex';
});

const btnListo = document.getElementById('btn-listo-para-jugar');
btnListo.addEventListener('click', (e) => {
    e.preventDefault();
    pantallaElegirPj.style.display = 'none';
    pantallaJuego.style.display = 'flex';
    startGame();
});

btnSalir.addEventListener('click', () => {
    pantallaJuego.style.display = 'none';
    pantallaJuegoActivo.style.display = 'flex';
    clearInterval(timerInterval);
    timerEl.textContent = "⏱️ Tiempo: 0s";
});

// ------------------- Config y elementos DOM -------------------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const timerEl = document.getElementById('timer');
const btnSalir = document.getElementById('salir');
const btnReiniciar = document.getElementById('reiniciar'); // Asegurate de tener un boton con id "reiniciar"

canvas.width = 700; // 7 celdas * 100 por ejemplo -> ajusta segun cellSize
canvas.height = 700;

// Assets (coloca los archivos en /assets/ o cambia rutas)
const boardImage = new Image();
boardImage.src = 'assets/board.png'; // imagen del tablero (fondo)
const pieceImage = new Image();
pieceImage.src = 'assets/piece.png'; // imagen de la ficha
const arrowImage = new Image();
arrowImage.src = 'assets/arrow.png'; // flecha para hints (opcional). Si no existe, se dibujan flechas con canvas.

// ------------------- Variables del juego -------------------
let cellSize = 90; // tamaño de celda en px
let offsetX = 0;
let offsetY = 0;
let board = [];
let selected = null; // celda seleccionada {x,y}
let dragging = null; // {x,y,offsetMouseX,offsetMouseY,startX,startY}
let timer = 0;
let timerInterval = null;
let timeLimitSeconds = 300; // limite del juego (cambia si queres)
let countdownInterval = null;
let gameOver = false;
let hintPulse = 0; // animacion

// ------------------- Tablero e inicializacion -------------------
function initBoard() {
    board = [];
    for (let y = 0; y < 7; y++) {
        board[y] = [];
        for (let x = 0; x < 7; x++) {
            if ((x < 2 && y < 2) || (x > 4 && y < 2) || (x < 2 && y > 4) || (x > 4 && y > 4)) {
                board[y][x] = null; // fuera
            } else {
                board[y][x] = 1; // ficha
            }
        }
    }
    board[3][3] = 0; // centro vacio
    selected = null;
    dragging = null;
    gameOver = false;
}

function resizeParams() {
    // calcula offsets para centrar
    offsetX = (canvas.width - 7 * cellSize) / 2;
    offsetY = (canvas.height - 7 * cellSize) / 2;
}

// ------------------- Dibujo -------------------
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // dibujar fondo: si boardImage cargada, la estiramos a area del tablero
    if (boardImage.complete) {
        ctx.drawImage(boardImage, offsetX, offsetY, 7 * cellSize, 7 * cellSize);
    } else {
        // fallback: rejilla
        ctx.fillStyle = '#f7f3ea';
        ctx.fillRect(offsetX, offsetY, 7 * cellSize, 7 * cellSize);
    }

    // dibujar celdas y bordes (opcional)
    ctx.strokeStyle = '#00000033';
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
            if (board[y][x] !== null) {
                const px = offsetX + x * cellSize;
                const py = offsetY + y * cellSize;
                ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
            }
        }
    }

    // Dibujar hints animados si hay selected o dragging
    const hintTargets = (dragging || selected) ? getValidTargetsForSelected(dragging ? { x: dragging.startX, y: dragging.startY } : selected) : [];
    drawHints(hintTargets);

    // dibujar fichas
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
            if (board[y][x] === 1) {
                // si estamos arrastrando esta ficha, la dibujamos despues para que este arriba
                if (dragging && dragging.startX === x && dragging.startY === y) continue;
                drawPieceAtCell(x, y, (selected && selected.x === x && selected.y === y));
            }
        }
    }

    // dibujar ficha arrastrada encima si aplica
    if (dragging) {
        drawDraggingPiece();
    }
}

function drawPieceAtCell(x, y, highlight = false) {
    const px = offsetX + x * cellSize;
    const py = offsetY + y * cellSize;
    const margin = cellSize * 0.08;
    const size = cellSize - margin * 2;
    if (pieceImage.complete) {
        ctx.drawImage(pieceImage, px + margin, py + margin, size, size);
    } else {
        // fallback: circulo
        ctx.beginPath();
        ctx.arc(px + cellSize / 2, py + cellSize / 2, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#0f0';
        ctx.fill();
    }

    if (highlight) {
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 3;
        ctx.strokeRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
    }
}

function drawDraggingPiece() {
    const { x, y, offsetMouseX, offsetMouseY } = dragging;
    const size = cellSize - cellSize * 0.16;
    const drawX = dragging.pageX - offsetMouseX;
    const drawY = dragging.pageY - offsetMouseY;
    ctx.save();
    ctx.globalAlpha = 0.95;
    if (pieceImage.complete) ctx.drawImage(pieceImage, drawX, drawY, size, size);
    else {
        ctx.beginPath();
        ctx.arc(drawX + size / 2, drawY + size / 2, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#0f0';
        ctx.fill();
    }
    ctx.restore();
}

function drawHints(targets) {
    hintPulse += 0.05;
    const pulse = (Math.sin(hintPulse) + 1) / 2; // 0..1
    for (const t of targets) {
        const px = offsetX + t.x * cellSize + cellSize / 2;
        const py = offsetY + t.y * cellSize + cellSize * 0.18;
        // si arrowImage disponible, dibujarla con opacidad pulse
        if (arrowImage.complete) {
            const w = 32;
            const h = 32;
            ctx.save();
            ctx.globalAlpha = 0.35 + 0.6 * pulse;
            ctx.drawImage(arrowImage, px - w / 2, py - h / 2, w, h);
            ctx.restore();
        } else {
            // dibujar triángulo hacia abajo
            ctx.save();
            ctx.globalAlpha = 0.35 + 0.6 * pulse;
            ctx.beginPath();
            ctx.moveTo(px - 12, py - 2);
            ctx.lineTo(px + 12, py - 2);
            ctx.lineTo(px, py + 14);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 64, 64, 0.9)';
            ctx.fill();
            ctx.restore();
        }
    }
}

// ------------------- Colisiones y utilidades -------------------
function getCellFromCoords(mx, my) {
    const x = Math.floor((mx - offsetX) / cellSize);
    const y = Math.floor((my - offsetY) / cellSize);
    if (x >= 0 && x < 7 && y >= 0 && y < 7 && board[y][x] !== null) return { x, y };
    return null;
}

function isValidMove(from, to) {
    if (!from || !to) return false;
    if (board[to.y][to.x] !== 0) return false;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.abs(dx) === 2 && dy === 0) {
        return board[from.y][from.x + dx / 2] === 1;
    }
    if (Math.abs(dy) === 2 && dx === 0) {
        return board[from.y + dy / 2][from.x] === 1;
    }
    return false;
}

function makeMove(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    board[from.y][from.x] = 0;
    board[to.y][to.x] = 1;
    board[from.y + dy / 2][from.x + dx / 2] = 0;
}

function getValidTargetsForSelected(cell) {
    if (!cell) return [];
    const targets = [];
    const dirs = [ {dx:2,dy:0},{dx:-2,dy:0},{dx:0,dy:2},{dx:0,dy:-2} ];
    for (const d of dirs) {
        const to = { x: cell.x + d.dx, y: cell.y + d.dy };
        if (to.x >= 0 && to.x < 7 && to.y >= 0 && to.y < 7 && board[to.y][to.x] !== null) {
            if (isValidMove(cell, to)) targets.push(to);
        }
    }
    return targets;
}

function hasAnyMoves() {
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
            if (board[y][x] === 1) {
                const targets = getValidTargetsForSelected({ x, y });
                if (targets.length > 0) return true;
            }
        }
    }
    return false;
}

// ------------------- Eventos de mouse (drag & drop) -------------------
canvas.addEventListener('mousedown', (e) => {
    if (gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cell = getCellFromCoords(mx, my);
    if (!cell) return;
    if (board[cell.y][cell.x] !== 1) return;

    // seleccionar y comenzar drag
    selected = cell;
    dragging = {
        startX: cell.x,
        startY: cell.y,
        pageX: mx,
        pageY: my,
        offsetMouseX: mx - (offsetX + cell.x * cellSize + cellSize * 0.08),
        offsetMouseY: my - (offsetY + cell.y * cellSize + cellSize * 0.08),
        x: cell.x,
        y: cell.y
    };
    drawBoard();
});

canvas.addEventListener('mousemove', (e) => {
    if (dragging) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        dragging.pageX = mx;
        dragging.pageY = my;
        drawBoard();
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dropCell = getCellFromCoords(mx, my);

    const from = { x: dragging.startX, y: dragging.startY };
    if (dropCell && isValidMove(from, dropCell)) {
        makeMove(from, dropCell);
        // despues de mover, chequear fin
        if (!hasAnyMoves()) {
            endGame(false, 'No quedan movimientos.');
        }
        // check win (1 pieza en centro)
        checkWin();
    }
    // limpiar dragging
    dragging = null;
    selected = null;
    drawBoard();
});

// Si el mouse sale del canvas durante drag, cancelar y snapback
canvas.addEventListener('mouseleave', (e) => {
    if (dragging) {
        dragging = null;
        selected = null;
        drawBoard();
    }
});

// También soportar click (seleccionar sin arrastrar) y doble click para mover? Mantendremos click select
canvas.addEventListener('click', (e) => {
    // si hay seleccionado y no dragging (click simple), permitir seleccionar otra ficha o deseleccionar
    if (dragging) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cell = getCellFromCoords(mx, my);
    if (!cell) return;
    if (board[cell.y][cell.x] === 1) {
        // seleccionar ficha
        selected = cell;
    } else if (selected && isValidMove(selected, cell)) {
        makeMove(selected, cell);
        selected = null;
        if (!hasAnyMoves()) endGame(false, 'No quedan movimientos.');
        checkWin();
    } else selected = null;
    drawBoard();
});

// ------------------- Timer -------------------
function startTimer() {
    clearInterval(timerInterval);
    clearInterval(countdownInterval);
    timer = 0;
    let remaining = timeLimitSeconds;

    timerInterval = setInterval(() => {
        timer++;
        // no mostrar el cronometro de subida si queres mostrar solo cuenta regresiva
    }, 1000);

    countdownInterval = setInterval(() => {
        remaining--;
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        timerEl.textContent = `⏱️ ${mins}:${secs.toString().padStart(2,'0')}`;
        if (remaining <= 0) {
            endGame(true, 'Se acabó el tiempo.');
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    clearInterval(countdownInterval);
}

// ------------------- Comprobaciones y fin de juego -------------------
function checkWin() {
    let count = 0;
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) if (board[y][x] === 1) count++;
    if (count === 1 && board[3][3] === 1) {
        endGame(false, `¡Ganaste en ${timer}s!`);
    }
}

function endGame(timeOut = false, message = '') {
    stopTimer();
    gameOver = true;
    setTimeout(() => {
        alert(message || (timeOut ? 'Se acabó el tiempo.' : 'Juego terminado'));
    }, 200);
}

// ------------------- Reinicio y utilidades publicas -------------------
function startGame() {
    initBoard();
    resizeParams();
    startTimer();
    drawBoard();
}

function restartGame() {
    stopTimer();
    initBoard();
    startTimer();
    drawBoard();
}

// ------------------- Botones -------------------
if (btnReiniciar) btnReiniciar.addEventListener('click', () => restartGame());
if (btnSalir) btnSalir.addEventListener('click', () => { stopTimer(); /* oculta pantalla juego si corresponde */ });

// resize canvas handling
window.addEventListener('resize', () => {
    // opcional: ajustar canvas al contenedor
    // canvas.width = Math.min(700, window.innerWidth - 40);
    // canvas.height = canvas.width;
    resizeParams();
    drawBoard();
});

// iniciar loop de animacion ligera para hints
function animationLoop() {
    if (!gameOver) drawBoard();
    requestAnimationFrame(animationLoop);
}

// iniciar por defecto
initBoard();
resizeParams();
animationLoop();

// export para pruebas (si se usa bundler)
window.PegSolitaire = {
    startGame,
    restartGame,
    board
};
