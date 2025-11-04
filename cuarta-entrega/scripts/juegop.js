// ------------------- Pantallas y botones -------------------
const btnPlay = document.getElementById('btn-play');
const pantallaJuegoInactivo = document.getElementById('pantalla-juego');
const pantallaJuegoActivo = document.getElementById('pantalla-juego-principal');
const btnJugarSolo = document.getElementById('solo');
const pantallaElegirPj = document.getElementById('solitario-piezas');
const pantallaJuego = document.getElementById('juego-pantalla');
const btnListo = document.getElementById('btn-listo-para-jugar');
const btnSalir = document.getElementById('salir');

btnPlay.addEventListener('click', () => {
    pantallaJuegoInactivo.style.display = 'none';
    pantallaJuegoActivo.style.display = 'flex';
});

btnJugarSolo.addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'none';
    pantallaElegirPj.style.display = 'flex';
});

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
});

// ------------------- Juego Peg Solitaire -------------------
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const timerEl = document.getElementById("timer");
const btnReiniciar = document.getElementById("reiniciar");

let cellSize = 70;
let board = [];
let selected = null;
let dragging = false;
let dragPos = null;
let hints = [];
let timer = 0;
let timerLimit = 180; // 3 minutos
let timerInterval;

// ---- Cargar imágenes ----
const fondo = new Image();
fondo.src = "../imgs/fondo-juego.jpg";

const fichaAzul = new Image();
fichaAzul.src = "../imgs/personaje1.jpg";

const fichaRoja = new Image();
fichaRoja.src = "../imgs/personaje2.jpg";

const flechaHint = new Image();
flechaHint.src = "../imgs/pista.png";

// ---- Inicializar tablero clásico ----
function initBoard() {
    board = [];
    for (let y = 0; y < 7; y++) {
        board[y] = [];
        for (let x = 0; x < 7; x++) {
            if ((x < 2 && y < 2) || (x > 4 && y < 2) || (x < 2 && y > 4) || (x > 4 && y > 4))
                board[y][x] = null;
            else
                board[y][x] = Math.random() < 0.5 ? 1 : 2; // 1: azul, 2: roja
        }
    }
    board[3][3] = 0; // centro vacío
    selected = null;
}

// ---- Dibujo ----
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);

    const offsetX = (canvas.width - 7 * cellSize) / 2;
    const offsetY = (canvas.height - 7 * cellSize) / 2;

    // Dibujar fichas
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
            if (board[y][x] !== null && board[y][x] !== 0) {
                const px = offsetX + x * cellSize;
                const py = offsetY + y * cellSize;
                const img = board[y][x] === 1 ? fichaAzul : fichaRoja;

                if (selected && selected.x === x && selected.y === y && dragging && dragPos) {
                    continue; // se dibuja después para seguir el mouse
                } else {
                    ctx.drawImage(img, px + 5, py + 5, cellSize - 10, cellSize - 10);
                }
            }
        }
    }

    // Dibujar ficha arrastrada
    if (dragging && selected && dragPos) {
        const img = board[selected.y][selected.x] === 1 ? fichaAzul : fichaRoja;
        ctx.globalAlpha = 0.8;
        ctx.drawImage(img, dragPos.x - cellSize / 2, dragPos.y - cellSize / 2, cellSize - 10, cellSize - 10);
        ctx.globalAlpha = 1.0;
    }

    // Dibujar hints animados
    drawHints();
}

let hintAnimation = 0;
function drawHints() {
    hintAnimation += 0.1;
    hints.forEach(h => {
        const offsetX = (canvas.width - 7 * cellSize) / 2;
        const offsetY = (canvas.height - 7 * cellSize) / 2;
        const px = offsetX + h.x * cellSize + cellSize / 2;
        const py = offsetY + h.y * cellSize + 10 * Math.sin(hintAnimation);
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.drawImage(flechaHint, px - 12, py - 40, 25, 25);
        ctx.restore();
    });
}

// ---- Lógica de movimiento ----
function getCellFromCoords(mx, my) {
    const offsetX = (canvas.width - 7 * cellSize) / 2;
    const offsetY = (canvas.height - 7 * cellSize) / 2;
    const x = Math.floor((mx - offsetX) / cellSize);
    const y = Math.floor((my - offsetY) / cellSize);
    if (x >= 0 && x < 7 && y >= 0 && y < 7 && board[y][x] !== null) {
        return { x, y };
    }
    return null;
}

function isValidMove(from, to) {
    if (board[to.y][to.x] !== 0) return false;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.abs(dx) === 2 && dy === 0) return board[from.y][from.x + dx / 2] !== 0 && board[from.y][from.x + dx / 2] !== null;
    if (Math.abs(dy) === 2 && dx === 0) return board[from.y + dy / 2][from.x] !== 0 && board[from.y + dy / 2][from.x] !== null;
    return false;
}

function makeMove(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    board[to.y][to.x] = board[from.y][from.x];
    board[from.y][from.x] = 0;
    board[from.y + dy / 2][from.x + dx / 2] = 0;
}

// ---- Hints ----
function showHints(from) {
    hints = [];
    const directions = [
        { dx: 2, dy: 0 },
        { dx: -2, dy: 0 },
        { dx: 0, dy: 2 },
        { dx: 0, dy: -2 },
    ];
    directions.forEach(dir => {
        const to = { x: from.x + dir.dx, y: from.y + dir.dy };
        if (to.x >= 0 && to.x < 7 && to.y >= 0 && to.y < 7 && isValidMove(from, to)) {
            hints.push(to);
        }
    });
}

// ---- Fin del juego ----
function hasValidMoves() {
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
            if (board[y][x] !== null && board[y][x] !== 0) {
                const from = { x, y };
                if (isValidMove(from, { x: x + 2, y })) return true;
                if (isValidMove(from, { x: x - 2, y })) return true;
                if (isValidMove(from, { x, y: y + 2 })) return true;
                if (isValidMove(from, { x, y: y - 2 })) return true;
            }
        }
    }
    return false;
}

// ---- Drag & Drop ----
canvas.addEventListener("mousedown", (e) => {
    const cell = getCellFromCoords(e.offsetX, e.offsetY);
    if (cell && board[cell.y][cell.x] !== 0) {
        selected = cell;
        dragging = true;
        dragPos = { x: e.offsetX, y: e.offsetY };
        showHints(selected);
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (dragging) {
        dragPos = { x: e.offsetX, y: e.offsetY };
    }
});

canvas.addEventListener("mouseup", (e) => {
    if (dragging && selected) {
        const cell = getCellFromCoords(e.offsetX, e.offsetY);
        if (cell && isValidMove(selected, cell)) {
            makeMove(selected, cell);
            if (!hasValidMoves()) {
                clearInterval(timerInterval);
                setTimeout(() => alert("¡Fin del juego! No hay más movimientos."), 400);
            }
        }
    }
    dragging = false;
    selected = null;
    hints = [];
});

// ---- Timer ----
function startTimer() {
    timer = timerLimit;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer--;
        timerEl.textContent = `⏱️ Tiempo: ${timer}s`;
        if (timer <= 0) {
            clearInterval(timerInterval);
            alert("⏰ ¡Se acabó el tiempo!");
        }
    }, 1000);
}

// ---- Reinicio ----
btnReiniciar?.addEventListener("click", () => startGame());

// ---- Bucle de animación ----
function gameLoop() {
    drawBoard();
    requestAnimationFrame(gameLoop);
}

// ---- Iniciar partida ----
function startGame() {
    initBoard();
    startTimer();
    gameLoop();
}
