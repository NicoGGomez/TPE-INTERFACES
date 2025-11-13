// ------------------- Pantallas y botones (igual que antes) -------------------
const btnPlay = document.getElementById('btn-play');
const pantallaJuegoInactivo = document.getElementById('pantalla-juego');
const pantallaJuegoActivo = document.getElementById('pantalla-juego-principal');

btnPlay && btnPlay.addEventListener('click', () => {
    pantallaJuegoInactivo.style.display = 'none';
    pantallaJuegoActivo.style.display = 'flex';
});

const btnJugarSolo = document.getElementById('solo');
const btnMultijugador = document.getElementById('multijugador');
const btnInstrucciones = document.getElementById('instrucciones');
const pantallaMultijugador = document.getElementById('pantalla-multijugador');
const pantallaInstrucciones = document.getElementById('pantalla-instrucciones');
const pantallaElegirPj = document.getElementById('solitario-piezas');
const pantallaJuego = document.getElementById('juego-pantalla');
const btnSalir = document.getElementById('salir');

btnInstrucciones && btnInstrucciones.addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'none';
    pantallaInstrucciones.style.display = 'flex';
});
const volverInstrucciones = document.getElementById('volver-instrucciones');
volverInstrucciones && volverInstrucciones.addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'flex';
    pantallaInstrucciones.style.display = 'none';
});

btnMultijugador && btnMultijugador.addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'none';
    pantallaMultijugador.style.display = 'flex';
});
const volverMultijugador = document.getElementById('volver-multijugador');
volverMultijugador && volverMultijugador.addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'flex';
    pantallaMultijugador.style.display = 'none';
});

btnJugarSolo && btnJugarSolo.addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'none';
    pantallaElegirPj.style.display = 'flex';
});

btnSalir && btnSalir.addEventListener('click', () => {
    pantallaJuego.style.display = 'none';
    pantallaJuegoActivo.style.display = 'flex';
    clearInterval(timerInterval);
    timerEl.textContent = "⏱️ Tiempo: 120s";
});

const panel = document.getElementById('panel');
panel.addEventListener('submit', async (e) => {
    e.preventDefault();

    const selected = panel.querySelector('input[name="pieza"]:checked');
    // ocultar pantalla de selección
    pantallaElegirPj.style.display = 'none';
    pantallaJuego.style.display = 'flex';

    // asignar el personaje seleccionado a las assets
    const peg = new PegSolitaireGame();
 
    if(selected.value === "ficha") 
        peg.assets.urls.ficha = "https://i.postimg.cc/G3YB35w3/personaje1.jpg";
    else if(selected.value === "ficha2") 
        peg.assets.urls.ficha = "https://i.postimg.cc/KvQQQNGw/personaje2.jpg";
    else if(selected.value === "ficha3")
        peg.assets.urls.ficha = "https://i.postimg.cc/63GxFJMK/Untitled-Project-6.jpg";

    await peg.startGame(); // startGame ya carga la imagen y arranca el tablero
});

// ------------------- Peg Solitaire - POO + Drag & Drop -------------------

class Assets {
    constructor() {
        this.images = {
            ficha: null,
            ficha2: null,
            ficha3: null
        };
        this.urls = {
            ficha: 'https://i.postimg.cc/G3YB35w3/personaje1.jpg',
            ficha2: 'https://i.postimg.cc/KvQQQNGw/personaje2.jpg',
            ficha3: 'https://i.postimg.cc/63GxFJMK/Untitled-Project-6.jpg'
        };
    }

    preloadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    async preloadAll() {
        const [ficha, ficha2] = await Promise.all([
            this.preloadImage(this.urls.ficha).catch(() => null),
            this.preloadImage(this.urls.ficha2).catch(() => null)
        ]);
        this.images.ficha = ficha;
        this.images.ficha2 = ficha2;
    }
}


/* =========================
   Temporizador regresivo
   ========================= */
class GameTimer {
    constructor(displayEl, initialSeconds = 120, onExpire = () => {}) {
        this.displayEl = displayEl;
        this.initialSeconds = initialSeconds;
        this.seconds = initialSeconds;
        this.interval = null;
        this.onExpire = onExpire;
    }

    start() {
        this.stop();
        this.seconds = this.initialSeconds;
        this._render();
        this.interval = setInterval(() => {
            this.seconds--;
            this._render();
            if (this.seconds <= 0) {
                this.stop();
                this.onExpire();
            }
        }, 1000);
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
        this.interval = null;
    }

    _render() {
        if (this.displayEl) this.displayEl.textContent = `⏱️ Tiempo: ${this.seconds}s`;
    }

    getRemaining() {
        return this.seconds;
    }
}


/* =========================
   Tablero y lógica de juego
   ========================= */
class PegBoard {
    constructor(canvas, assets, cellSize = 50) {
        this.canvas = canvas;
        this.ctx = canvas ? canvas.getContext('2d') : null;
        this.assets = assets;
        this.cellSize = cellSize;
        this.board = [];
        this.selected = null;
        this.dragging = null;
        this.dragOffset = { x: 0, y: 0 };
        this.hints = [];
        this.hintAnimation = 0;
        this.animRunning = false;

        this.offsetX = 0;
        this.offsetY = 0;
    }

    initBoard() {
        this.board = [];
        for (let y = 0; y < 7; y++) {
            this.board[y] = [];
            for (let x = 0; x < 7; x++) {
                if ((x < 2 && y < 2) || (x > 4 && y < 2) || (x < 2 && y > 4) || (x > 4 && y > 4))
                    this.board[y][x] = null;
                else this.board[y][x] = 1;
            }
        }
        this.board[3][3] = 0;
        this.selected = null;
        this.hints = [];
    }

    resizeCanvasTo(w = 400, h = 400) {
        const ratio = window.devicePixelRatio || 1;
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;
        this.canvas.width = Math.floor(w * ratio);
        this.canvas.height = Math.floor(h * ratio);
        this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        this.offsetX = (this.canvas.clientWidth - 7 * this.cellSize) / 2;
        this.offsetY = (this.canvas.clientHeight - 7 * this.cellSize) / 2;
    }

    getCellFromCoords(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = clientX - rect.left;
        const my = clientY - rect.top;
        const x = Math.floor((mx - this.offsetX) / this.cellSize);
        const y = Math.floor((my - this.offsetY) / this.cellSize);
        if (x >= 0 && x < 7 && y >= 0 && y < 7 && this.board[y][x] !== null) return { x, y };
        return null;
    }

    // VERIFICACION DEL MOVIMIENTO ANTES DE LA REVISION

    // isValidMove(from, to) {
    //     if (!from || !to) return false;
    //     if (this.board[to.y][to.x] !== 0) return false;
    //     const dx = to.x - from.x;
    //     const dy = to.y - from.y;
    //     if (Math.abs(dx) === 2 && dy === 0) return this.board[from.y][from.x + dx / 2] === 1;
    //     if (Math.abs(dy) === 2 && dx === 0) return this.board[from.y + dy / 2][from.x] === 1;
    //     return false;
    // }

    isValidMove(from, to) {
        if (!from || !to) return false;
        if (this.board[to.y][to.x] !== 0) return false;

        const dx = to.x - from.x;
        const dy = to.y - from.y;

        // salto de una ficha
        if (Math.abs(dx) === 2 && dy === 0)
            return this.board[from.y][from.x + dx / 2] === 1;
        if (Math.abs(dy) === 2 && dx === 0)
            return this.board[from.y + dy / 2][from.x] === 1;

        // salto de dos fichas seguidas (3 espacios)
        if (Math.abs(dx) === 3 && dy === 0)
            return this.board[from.y][from.x + dx / 3] === 1 &&
                this.board[from.y][from.x + (2 * dx) / 3] === 1;
        if (Math.abs(dy) === 3 && dx === 0)
            return this.board[from.y + dy / 3][from.x] === 1 &&
                this.board[from.y + (2 * dy) / 3][from.x] === 1;

        return false;
    }

    // MOVIMIENTO ANTES DE LA REVISION

    // makeMove(from, to) {
    //     const dx = to.x - from.x;
    //     const dy = to.y - from.y;
    //     this.board[from.y][from.x] = 0;
    //     this.board[to.y][to.x] = 1;
    //     this.board[from.y + dy / 2][from.x + dx / 2] = 0;
    // }

    makeMove(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;

        this.board[from.y][from.x] = 0;
        this.board[to.y][to.x] = 1;

        // salto de una ficha
        if (Math.abs(dx) === 2 && dy === 0)
            this.board[from.y][from.x + dx / 2] = 0;
        else if (Math.abs(dy) === 2 && dx === 0)
            this.board[from.y + dy / 2][from.x] = 0;

        // salto de dos fichas seguidas
        else if (Math.abs(dx) === 3 && dy === 0) {
            this.board[from.y][from.x + dx / 3] = 0;
            this.board[from.y][from.x + (2 * dx) / 3] = 0;
        } else if (Math.abs(dy) === 3 && dx === 0) {
            this.board[from.y + dy / 3][from.x] = 0;
            this.board[from.y + (2 * dy) / 3][from.x] = 0;
        }
    }

    checkWin() {
        let count = 0;
        for (let y = 0; y < 7; y++)
            for (let x = 0; x < 7; x++)
                if (this.board[y][x] === 1) count++;
        return count === 1 && this.board[3][3] === 1;
    }

    // SHOWHINTS ANTES DE LA REVISION

    // showHints(from) {
    //     this.hints = [];
    //     if (!from) return;
    //     const dirs = [
    //         { dx: 2, dy: 0 },
    //         { dx: -2, dy: 0 },
    //         { dx: 0, dy: 2 },
    //         { dx: 0, dy: -2 },
    //     ];
    //     dirs.forEach(dir => {
    //         const to = { x: from.x + dir.dx, y: from.y + dir.dy };
    //         if (to.x >= 0 && to.x < 7 && to.y >= 0 && to.y < 7 && this.isValidMove(from, to))
    //             this.hints.push(to);
    //     });
    // }

    showHints(from) {
        this.hints = [];
        if (!from) return;

        const dirs = [
            { dx: 2, dy: 0 },
            { dx: -2, dy: 0 },
            { dx: 0, dy: 2 },
            { dx: 0, dy: -2 },
            { dx: 3, dy: 0 },  // salto doble horizontal
            { dx: -3, dy: 0 },
            { dx: 0, dy: 3 },  // salto doble vertical
            { dx: 0, dy: -3 }
        ];

        dirs.forEach(dir => {
            const to = { x: from.x + dir.dx, y: from.y + dir.dy };
            if (
                to.x >= 0 && to.x < 7 &&
                to.y >= 0 && to.y < 7 &&
                this.isValidMove(from, to)
            ) {
                this.hints.push(to);
            }
        });
    }


    _drawHoles() {
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
            if (this.board[y][x] !== null) { // todas las celdas válidas
                const px = this.offsetX + x * this.cellSize + this.cellSize / 2;
                const py = this.offsetY + y * this.cellSize + this.cellSize / 2;
                const radius = (this.cellSize - 10) / 2;

                this.ctx.beginPath();
                this.ctx.fillStyle = "#0F3A50"; // color del agujero
                this.ctx.arc(px, py, radius, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.strokeStyle = "#15394eff"; // borde del agujero
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        }
    }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
        this.offsetX = (this.canvas.clientWidth - 7 * this.cellSize) / 2;
        this.offsetY = (this.canvas.clientHeight - 7 * this.cellSize) / 2;

        this.ctx.fillStyle = "#1E5474";
        this.ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);

        // celdas
        for (let y = 0; y < 7; y++) {
            for (let x = 0; x < 7; x++) {
                if (this.board[y][x] !== null) {
                    this.ctx.strokeStyle = "#1E5474";
                    this.ctx.strokeRect(
                        this.offsetX + x * this.cellSize,
                        this.offsetY + y * this.cellSize,
                        this.cellSize,
                        this.cellSize
                    );
                }
            }
        }

        // dibujar "agujeros" en celdas vacías
        this._drawHoles();

        // fichas
        for (let y = 0; y < 7; y++) {
            for (let x = 0; x < 7; x++) {
                if (this.board[y][x] === 1) {
                    if (this.dragging && this.dragging.from.x === x && this.dragging.from.y === y)
                        continue; 
                    this._drawPiece(x, y);
                }
            }
        }

        // ficha arrastrada
        if (this.dragging) {
            const img = this.assets.images.ficha;
            const px = this.dragging.x - this.dragOffset.x;
            const py = this.dragging.y - this.dragOffset.y;
            const size = this.cellSize - 10;
            const radius = 50;

            if (img) {
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.roundRect(px + 5, py + 5, size, size, radius);
                this.ctx.clip();
                this.ctx.drawImage(img, px + 5, py + 5, size, size);
                this.ctx.restore();
            } else {
                this.ctx.beginPath();
                this.ctx.fillStyle = "#DF9430";
                this.ctx.arc(px + this.cellSize / 2, py + this.cellSize / 2, size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // hints
        this._drawHints();
    }

    _drawPiece(x, y) {
    const px = this.offsetX + x * this.cellSize;
    const py = this.offsetY + y * this.cellSize;
    const img = this.assets.images.ficha;
    const size = this.cellSize - 10;
    const radius = 50;

    if (img) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.roundRect(px + 5, py + 5, size, size, radius);
        this.ctx.clip();
        this.ctx.drawImage(img, px + 5, py + 5, size, size);
        this.ctx.restore();
    } else {
        this.ctx.beginPath();
        this.ctx.fillStyle = "#DF9430";
        this.ctx.arc(px + this.cellSize / 2, py + this.cellSize / 2, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    }


    _drawHints() {
        this.hintAnimation += 0.12;
        for (const h of this.hints) {
            const px = this.offsetX + h.x * this.cellSize + this.cellSize / 2;
            const py = this.offsetY + h.y * this.cellSize + this.cellSize / 2 + 8 * Math.sin(this.hintAnimation);
            this.ctx.beginPath();
            this.ctx.fillStyle = "rgba(72, 255, 31, 0.8)";
            this.ctx.arc(px, py - 8, 8 + 2 * Math.sin(this.hintAnimation), 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    startAnimationLoop() {
        if (this.animRunning) return;
        this.animRunning = true;
        const loop = () => {
            if (!this.animRunning) return;
            this.draw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    stopAnimationLoop() {
        this.animRunning = false;
    }

    onMouseDown(clientX, clientY) {
    const cell = this.getCellFromCoords(clientX, clientY);
    if (!cell) return;

    if (this.board[cell.y][cell.x] === 1) {
        this.dragging = {
            from: { x: cell.x, y: cell.y },
            x: clientX - this.canvas.getBoundingClientRect().left,
            y: clientY - this.canvas.getBoundingClientRect().top
        };
        this.dragOffset.x = this.cellSize / 2;
        this.dragOffset.y = this.cellSize / 2;

        // <-- ACA agregamos esto
        this.showHints(cell);
    }
    }


    onMouseMove(clientX, clientY) {
        if (!this.dragging) return;
        const rect = this.canvas.getBoundingClientRect();
        this.dragging.x = clientX - rect.left;
        this.dragging.y = clientY - rect.top;
    }

    onMouseUp(clientX, clientY, onMoveMade = () => {}) {
    if (!this.dragging) return;
    const from = this.dragging.from;
    const cell = this.getCellFromCoords(clientX, clientY);
    if (cell && this.isValidMove(from, cell)) {
        this.makeMove(from, cell);
        onMoveMade();
    }
    this.dragging = null;
    this.hints = []; // <-- limpia los hints
    }

    hasMovesLeft() {
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
            if (this.board[y][x] === 1) {
                const from = { x, y };
                const dirs = [
                    { dx: 2, dy: 0 },
                    { dx: -2, dy: 0 },
                    { dx: 0, dy: 2 },
                    { dx: 0, dy: -2 }
                ];
                for (const dir of dirs) {
                    const to = { x: x + dir.dx, y: y + dir.dy };
                    if (to.x >= 0 && to.x < 7 && to.y >= 0 && to.y < 7 && this.isValidMove(from, to)) {
                        return true; // hay al menos un movimiento
                    }
                }
            }
        }
    }
    return false; // no hay movimientos
    }


}

/* =========================
   Clase principal
   ========================= */
class PegSolitaireGame {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.timerEl = document.getElementById('timer');
        this.pantallaJuego = document.getElementById('juego-pantalla');
        this.pantallaMenu = document.getElementById('pantalla-juego-principal');
        this.btnPlay = document.getElementById('btn-play');
        this.btnReiniciar = document.getElementById('reiniciar');
        this.btnSalir = document.getElementById('salir');

        this.img = ''
        this.assets = new Assets();
        this.board = new PegBoard(this.canvas, this.assets, 50);
        this.timer = new GameTimer(this.timerEl, 120, this.onTimeUp.bind(this));

        this._bindUI();
        this._bindCanvasEvents();
    }

    _bindUI() {
        this.btnReiniciar?.addEventListener('click', () => {
            this.startGame();
        });
        this.btnSalir?.addEventListener('click', () => {
            this.pantallaJuego.style.display = 'none';
            this.pantallaMenu.style.display = 'flex';
            this.stopGame();
        });
    }

    _bindCanvasEvents() {
        let isDown = false;

        this.canvas.addEventListener('mousedown', (e) => {
            isDown = true;
            this.board.onMouseDown(e.clientX, e.clientY);
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (isDown) this.board.onMouseMove(e.clientX, e.clientY);
        });
        this.canvas.addEventListener('mouseup', (e) => {
            isDown = false;
            this.board.onMouseUp(e.clientX, e.clientY, () => {
                if (this.board.checkWin()) {
                    this.onWin();
                } else if (!this.board.hasMovesLeft()) {
                    this.onLose();
                }
            });
        });

        // soporte táctil
        this.canvas.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            this.board.onMouseDown(t.clientX, t.clientY);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            this.board.onMouseMove(t.clientX, t.clientY);
        });
        this.canvas.addEventListener('touchend', (e) => {
            const t = e.changedTouches[0];
            this.board.onMouseUp(t.clientX, t.clientY, () => {
                if (this.board.checkWin()) {
                    this.onWin();
                } else if (!this.board.hasMovesLeft()) {
                    this.onLose();
                }
            });
        });
    
    }

    async startGame() {
        await this.assets.preloadAll();
        this.board.resizeCanvasTo(400, 400);
        this.board.initBoard();
        this.timer.start();
        this.board.startAnimationLoop();
    }

    stopGame() {
        this.timer.stop();
        this.board.stopAnimationLoop();
    }

    onTimeUp() {
        this.stopGame();
        const perdedor = document.getElementById('perdedor'); // Obtiene el elemento que muestra la pantalla de perdedor
        const miDiv = document.getElementById('miDivPer');
        this.stopGame();
        miDiv.innerHTML = `<p>No quedan más tiempo. ¡Perdiste!</p>`;
        this.pantallaJuego.style.display = 'none';
        perdedor.style.display = 'flex';
        document.getElementById('btn-volver-per').addEventListener('click', () => {
            perdedor.style.display = 'none';
            this.pantallaMenu.style.display = 'flex'; 
        })
    }

    onWin() {
        this.timer.stop();
        // alert(`🎉 ¡Ganaste con ${this.timer.getRemaining()}s restantes!`);
        // this.stopGame();
        const ganador = document.getElementById('ganador'); // Obtiene el elemento que muestra la pantalla de ganador
        const miDiv = document.getElementById('miDivGa');
        miDiv.innerHTML = `<¡Ganaste con ${this.timer.getRemaining()}s restantes!`;
        this.pantallaJuego.style.display = 'none';
        ganador.style.display = 'flex';
        document.getElementById('btn-volver-ga').addEventListener('click', () => {
            ganador.style.display = 'none';
            this.pantallaMenu.style.display = 'flex'; 
        })
    }

    onLose() {
        this.timer.stop();
        // alert("💀 No quedan más movimientos. ¡Perdiste!");
        const perdedor = document.getElementById('perdedor'); // Obtiene el elemento que muestra la pantalla de perdedor
        const miDiv = document.getElementById('miDivPer');
        this.stopGame();
        miDiv.innerHTML = `<p>No quedan más movimientos. ¡Perdiste!</p>`;
        this.pantallaJuego.style.display = 'none';
        perdedor.style.display = 'flex';
        document.getElementById('btn-volver-per').addEventListener('click', () => {
            perdedor.style.display = 'none';
            this.pantallaMenu.style.display = 'flex'; 
        })
    }

}
