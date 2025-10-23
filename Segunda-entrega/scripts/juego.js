
// ========================================================================

// ------------------- Pantallas y botones -------------------
const btnPlay = document.getElementById('btn-play');
const pantallaJuegoInactivo = document.getElementById('pantalla-juego');
const pantallaJuegoActivo = document.getElementById('pantalla-juego-principal');

btnPlay.addEventListener('click', () => {
    pantallaJuegoInactivo.style.display = 'none';
    pantallaJuegoActivo.style.display = 'flex';
});

// botones principales
const btnJugarSolo = document.getElementById('solo');
const btnMultijugador = document.getElementById('multijugador');
const btnVolverAtras = document.getElementById('btn-volver');
const btnImgVolverAtras = document.getElementById('btn-img-volver');
const btnSalir = document.getElementById('salir');
const btnMezclar = document.getElementById('mezclar');

btnMezclar.addEventListener('click', () => {
    game.loadImage(url);
}); 

btnSalir.addEventListener('click', () => {
    pantallaSolo.style.display = 'flex';
    pantallaJuego.style.display = 'none';
});

// pantallas
const pantallaSolo = document.getElementById('solitario');
const pantallaMultijugador = document.getElementById('pantalla-multijugador');
const pantallaJuego = document.getElementById('juego-pantalla');

// jugar multijugador
btnMultijugador.addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'none';
    pantallaMultijugador.style.display = 'flex';
});

// jugar solitario
btnJugarSolo.addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'none';
    pantallaSolo.style.display = 'flex';
});

// selección de imagen
const imag1 = document.getElementById('imagen1');
const imag2 = document.getElementById('imagen2');
const imag3 = document.getElementById('imagen3');
const imag4 = document.getElementById('imagen4');

btnImgVolverAtras.addEventListener('click', () => {
    pantallaSolo.style.display = 'none';
    pantallaJuegoActivo.style.display = 'flex';
});

let url = null;

[imag1, imag2, imag3, imag4].forEach((img, index) => {
    const urls = [
        'https://i.postimg.cc/YSVB7sLm/1.jpg',
        'https://i.postimg.cc/0N31vBKK/2.jpg',
        'https://i.postimg.cc/cJjGWbtn/3.jpg',
        'https://i.postimg.cc/ZqgzmMvC/4.jpg'
    ];
    img.addEventListener('click', () => {
        url = urls[index];
        pantallaSolo.style.display = 'none';
        document.getElementById('panel-piezas').style.display = 'flex';
    });
});

// formulario de tamaño
const panelPiezas = document.getElementById('panel-piezas');
panelPiezas.addEventListener('submit', function (e) {
    e.preventDefault();
    panelPiezas.style.display = 'none';
    pantallaJuego.style.display = 'flex';
    const grid = parseInt(new FormData(panelPiezas).get("size"));
    game.gridSize = grid;
    game.loadImage(url);
});

// ------------------- Clase PuzzleGame con rotación y movimiento -------------------
class PuzzleGame {
    constructor(canvas, messageEl) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.messageEl = messageEl;
        this.size = canvas.width;
        this.gridSize = 2;
        this.image = null;
        this.pieces = [];
        this.draggedPiece = null;
        this.offset = { x: 0, y: 0 };
        this.startTime = null;
        this.timerInterval = null;
        this.currentLevel = 1;
        this.maxLevels = 3;

        this.bindEvents();
    }

    bindEvents() {
        // mover piezas (click izquierdo)
        this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
        this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
        this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));

        // rotar piezas (click derecho)
        this.canvas.addEventListener("contextmenu", e => {
            e.preventDefault();
            this.rotatePiece(e, 90);
        });
    }

    onMouseDown(e) {
        if (e.button !== 0) return; // solo click izquierdo
        const { offsetX, offsetY } = e;
        for (const p of [...this.pieces].reverse()) {
            if (offsetX > p.x && offsetX < p.x + p.size &&
                offsetY > p.y && offsetY < p.y + p.size) {
                this.draggedPiece = p;
                this.offset.x = offsetX - p.x;
                this.offset.y = offsetY - p.y;
                break;
            }
        }
    }

    onMouseMove(e) {
        if (!this.draggedPiece) return;
        const { offsetX, offsetY } = e;
        this.draggedPiece.x = offsetX - this.offset.x;
        this.draggedPiece.y = offsetY - this.offset.y;
        this.draw();
    }

    onMouseUp() {
        if (!this.draggedPiece) return;

        // Ajuste a la posición más cercana
        const nearest = this.pieces.reduce((a, b) => {
            const da = Math.hypot(a.x - this.draggedPiece.x, a.y - this.draggedPiece.y);
            const db = Math.hypot(b.x - this.draggedPiece.x, b.y - this.draggedPiece.y);
            return da < db ? a : b;
        });

        [this.draggedPiece.x, nearest.x] = [nearest.x, this.draggedPiece.x];
        [this.draggedPiece.y, nearest.y] = [nearest.y, this.draggedPiece.y];
        this.draggedPiece = null;

        this.draw();
        this.checkWin();
    }

    rotatePiece(e, angle) {
        const { offsetX, offsetY } = e;
        for (const p of this.pieces) {
            if (offsetX > p.x && offsetX < p.x + p.size &&
                offsetY > p.y && offsetY < p.y + p.size) {
                p.rotation = (p.rotation + angle + 360) % 360;
                break;
            }
        }
        this.draw();
        this.checkWin();
    }

    async loadImage(url) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url || this.getRandomImage();
        await img.decode();
        this.image = img;
        this.createPieces();
        this.shuffleRotations();
        this.draw();
        this.startTimer();
    }

    createPieces() {
        const step = this.size / this.gridSize;
        this.pieces = [];
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                this.pieces.push({
                    sx: x * step,
                    sy: y * step,
                    x: x * step,
                    y: y * step,
                    correctX: x * step,
                    correctY: y * step,
                    size: step,
                    rotation: 0
                });
            }
        }
    }

    shuffleRotations()  {
    for (let i = this.pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        
        // Intercambiar posiciones
        [this.pieces[i].x, this.pieces[j].x] = [this.pieces[j].x, this.pieces[i].x];
        [this.pieces[i].y, this.pieces[j].y] = [this.pieces[j].y, this.pieces[i].y];
    }

    // Asignar rotaciones aleatorias
    this.pieces.forEach(p => {
        const rotations = [0, 90, 180, 270];
        p.rotation = rotations[Math.floor(Math.random() * 4)];
    });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.size, this.size);
        for (const p of this.pieces) {
            this.ctx.save();
            this.ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.drawImage(
                this.image,
                p.sx, p.sy, p.size, p.size,
                -p.size / 2, -p.size / 2, p.size, p.size
            );
            this.ctx.restore();
            this.ctx.strokeStyle = "#000";
            this.ctx.strokeRect(p.x, p.y, p.size, p.size);
        }
    }

    checkWin() {
        const complete = this.pieces.every(p => p.rotation === 0) && this.pieces.every(p => Math.abs(p.x - p.correctX) < 8 && Math.abs(p.y - p.correctY) < 8)
        if (complete) {
            this.stopTimer();
            const ganador = document.getElementById('ganador')
            ganador.style.display = 'flex'
            const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
            document.getElementById('miDiv').innerHTML = `<p>¡Nivel completado! Tiempo: ${elapsed} segundos</p>`;
            pantallaJuego.style.display = 'none'
            btnVolverAtras.addEventListener('click', () => {
            pantallaSolo.style.display = 'flex'
            ganador.style.display = 'none'
      })
        }
    }

    startTimer() {
        this.startTime = Date.now();
        const timerEl = document.getElementById("timer");
        this.timerInterval = setInterval(() => {
            const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
            timerEl.textContent = `⏱️ Tiempo: ${elapsed}s`;
        }, 100);
        return elapsed
    }

    stopTimer() {
        clearInterval(this.timerInterval);
    }

    getRandomImage() {
        const imgs = [
            "https://i.postimg.cc/YSVB7sLm/1.jpg",
            "https://i.postimg.cc/0N31vBKK/2.jpg",
            "https://i.postimg.cc/cJjGWbtn/3.jpg",
            "https://i.postimg.cc/ZqgzmMvC/4.jpg",
        ];
        return imgs[Math.floor(Math.random() * imgs.length)];
    }
}

// ------------------- Inicialización -------------------
const canvas = document.getElementById("canvas");
const messageEl = document.getElementById("message");
const form = document.getElementById("panel");
const game = new PuzzleGame(canvas, messageEl);

// formulario de URL y tamaño
form.addEventListener("submit", e => {
    e.preventDefault();
    const urlForm = document.getElementById("imgUrl").value.trim();
    const grid = parseInt(new FormData(form).get("size"));
    game.gridSize = grid;
    game.loadImage(urlForm || url);
});
