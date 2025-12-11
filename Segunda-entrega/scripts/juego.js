// ------------------- Pantallas y botones -------------------
// Botón principal "Jugar" y pantallas de inicio/juego
const btnPlay = document.getElementById('btn-play');
const pantallaJuegoInactivo = document.getElementById('pantalla-juego');
const pantallaJuegoActivo = document.getElementById('pantalla-juego-principal');

// Cuando se hace click en "Jugar", oculta la pantalla inicial y muestra el menú principal
btnPlay.addEventListener('click', () => {
    pantallaJuegoInactivo.style.display = 'none';
    pantallaJuegoActivo.style.display = 'flex';
});

// ------------------- Botones principales -------------------
const btnJugarSolo = document.getElementById('solo');
const btnMultijugador = document.getElementById('multijugador');
const btnInstrucciones = document.getElementById('instrucciones');
const btnVolverAtras = document.getElementById('btn-volver');
const btnImgVolverAtras = document.getElementById('btn-img-volver');
const btnSalir = document.getElementById('salir');
const btnMezclar = document.getElementById('mezclar');
const botonAyuda = document.getElementById('ayuda');


// Botón "Mezclar" vuelve a cargar la imagen seleccionada
btnMezclar.addEventListener('click', () => {
    game.loadImage(url);
}); 

// Botón "Salir" vuelve a la pantalla de selección de modo
btnSalir.addEventListener('click', () => {
    game.endGame();
    pantallaSolo.style.display = 'flex';
    pantallaJuego.style.display = 'none';
});

botonAyuda.addEventListener("click", () => {
    if (botonAyuda.disabled) return;

            game.showHelp();

            // deshabilitar
            botonAyuda.disabled = true;
            botonAyuda.classList.add('disabled-hint');

            // volver a habilitar en 10 segundos
            setTimeout(() => {
                botonAyuda.disabled = false;
                botonAyuda.classList.remove('disabled-hint');
            }, 10000);
});


// ------------------- Pantallas -------------------
const pantallaSolo = document.getElementById('solitario');
const pantallaMultijugador = document.getElementById('pantalla-multijugador');
const pantallaInstrucciones = document.getElementById('pantalla-instrucciones');
const pantallaJuego = document.getElementById('juego-pantalla');

// ------------------- Instrucciones -------------------
// Muestra la pantalla de instrucciones y botón para volver
btnInstrucciones.addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'none';
    pantallaInstrucciones.style.display = 'flex';
    document.getElementById('volver-instrucciones').addEventListener('click', () => {
        pantallaJuegoActivo.style.display = 'flex';
        pantallaInstrucciones.style.display = 'none';
    });
});

// ------------------- Multijugador -------------------
// Muestra pantalla multijugador y botón para volver
btnMultijugador.addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'none';
    pantallaMultijugador.style.display = 'flex';
    document.getElementById('volver-multijugador').addEventListener('click', () => {
        pantallaJuegoActivo.style.display = 'flex';
        pantallaMultijugador.style.display = 'none';
    });
});

// ------------------- Solitario -------------------
// Muestra pantalla de selección de imagen
btnJugarSolo.addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'none';
    pantallaSolo.style.display = 'flex';
});

// ------------------- Selección de imagen -------------------
const imag1 = document.getElementById('imagen1');
const imag2 = document.getElementById('imagen2');
const imag3 = document.getElementById('imagen3');
const imag4 = document.getElementById('imagen4');
const imag5 = document.getElementById('imagen5');
const imag6 = document.getElementById('imagen6');

// Botón "volver" desde la selección de imagen al menú principal
btnImgVolverAtras.addEventListener('click', () => {
    pantallaSolo.style.display = 'none';
    pantallaJuegoActivo.style.display = 'flex';
});

let url = null;

// Asigna un evento a cada miniatura de imagen
// Al hacer clic, guarda la URL y muestra el formulario para elegir tamaño
[imag1, imag2, imag3, imag4, imag5, imag6].forEach((img, index) => {
    const urls = [
        'https://i.postimg.cc/YSVB7sLm/1.jpg',
        'https://i.postimg.cc/0N31vBKK/2.jpg',
        'https://i.postimg.cc/cJjGWbtn/3.jpg',
        'https://i.postimg.cc/ZqgzmMvC/4.jpg',
        'https://i.postimg.cc/MGTCpPXH/img5.jpg',
        'https://i.postimg.cc/k540g1Dg/img6.jpg'
    ];
    img.addEventListener('click', () => {
        url = urls[index];
        game.isActive = true;
        pantallaSolo.style.display = 'none';
        document.getElementById('panel-piezas').style.display = 'flex';
    });
});

// ------------------- Formulario de tamaño -------------------
// Toma el tamaño seleccionado, inicia el juego y carga el nivel
const panelPiezas = document.getElementById('panel-piezas');
panelPiezas.addEventListener('submit', function (e) {
    e.preventDefault();
    panelPiezas.style.display = 'none';
    pantallaJuego.style.display = 'flex';
    const grid = parseInt(new FormData(panelPiezas).get("size"));
    game.gridSize = grid;
    game.currentLevel = 1;
    game.baseGridSize = null;
    game.isActive = true;
    game.loadLevel();
});

// ------------------- Clase PuzzleGame -------------------
// Maneja toda la lógica del rompecabezas
class PuzzleGame {
    constructor(canvas, messageEl) {
        this.isActive = true;
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
        this.rotatePiezaSound = new Audio('https://www.myinstants.com/media/sounds/bloqueee.mp3');
        this.rotatePiezaSound.volume = 1;
        this.rotatePiezaSound = new Audio('https://www.myinstants.com/media/sounds/mezclar-40052.mp3');


        // Banco de imágenes disponibles
        this.imageBank = [
            "https://i.postimg.cc/YSVB7sLm/1.jpg",
            "https://i.postimg.cc/0N31vBKK/2.jpg",
            "https://i.postimg.cc/cJjGWbtn/3.jpg",
            "https://i.postimg.cc/ZqgzmMvC/4.jpg",
            "https://i.postimg.cc/MGTCpPXH/img5.jpg",
            "https://i.postimg.cc/k540g1Dg/img6.jpg"
        ];

        this.bindEvents(); // Enlaza eventos del mouse
    }

    showHelp() {
        if (!this.isActive) return;

        // mostrar en color
        this.draw(true);

        // cancelar si ya hay un timeout
        clearTimeout(this.helpTimeout);

        // volver al modo normal después de 5s
        this.helpTimeout = setTimeout(() => {
            this.draw(false);
        }, 3000);
    }


    // Asocia eventos de arrastre y rotación de piezas
    bindEvents() {
        this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
        this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
        this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
        this.canvas.addEventListener("contextmenu", e => {
            e.preventDefault();
            this.rotatePiece(e, 90); // clic derecho rota la pieza
            this.rotatePiezaSound.play()
        });
    }

    // Carga un nivel según el tamaño base y nivel actual
    loadLevel() {
        this.isActive = true; 
        this.stopTimer();

        // Guarda el tamaño base al iniciar
        if (!this.baseGridSize) this.baseGridSize = this.gridSize;

        // Aumenta dificultad (más piezas por nivel)
        if (this.baseGridSize === 4) {
            if (this.currentLevel === 2) this.gridSize = 5;
        } else if (this.baseGridSize === 5) {
            if (this.currentLevel === 2) this.gridSize = 6;
        } else if (this.baseGridSize === 6) {
            if (this.currentLevel === 2) this.gridSize = 7;
        }

        // Carga la imagen elegida o una aleatoria
        if (this.currentLevel === 1 && url) this.loadImage(url);
        else this.loadImage(this.getRandomImage());
    }

    // Carga la imagen seleccionada y crea el puzzle
    async loadImage(url) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        await img.decode();
        this.image = img;
        this.createPieces();
        this.shuffleRotations();
        this.draw();
        this.startTimer();
    }

    // Crea las piezas del puzzle según el tamaño
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

    // Mezcla posiciones y rotaciones iniciales
    shuffleRotations() {
        for (let i = this.pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.pieces[i].x, this.pieces[j].x] = [this.pieces[j].x, this.pieces[i].x];
            [this.pieces[i].y, this.pieces[j].y] = [this.pieces[j].y, this.pieces[i].y];
        }
        this.pieces.forEach(p => {
            const rotations = [0, 90, 180, 270];
            p.rotation = rotations[Math.floor(Math.random() * 4)];
        });
    }

    // Dibuja el puzzle con filtros según el nivel
    draw(showColor = false) {
        this.ctx.clearRect(0, 0, this.size, this.size);
        if (!showColor) {
            if (this.currentLevel === 1) this.ctx.filter = "grayscale(100%)";
            else if (this.currentLevel === 2) this.ctx.filter = "grayscale(100%) brightness(1.3)";
            else this.ctx.filter = "grayscale(60%) brightness(1.2) contrast(1.1) invert(0.4)";
        } else this.ctx.filter = "none";

        for (const p of this.pieces) {
            this.ctx.save();
            this.ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.drawImage(this.image, p.sx, p.sy, p.size, p.size, -p.size / 2, -p.size / 2, p.size, p.size);
            this.ctx.restore();
            this.ctx.strokeRect(p.x, p.y, p.size, p.size);
        }
        this.ctx.filter = "none";
    }

    // Inicia arrastre
    onMouseDown(e) {
        if (!this.isActive) return;
        const { offsetX, offsetY } = e;
        for (const p of [...this.pieces].reverse()) {
            if (offsetX > p.x && offsetX < p.x + p.size && offsetY > p.y && offsetY < p.y + p.size) {
                this.draggedPiece = p;
                this.offset.x = offsetX - p.x;
                this.offset.y = offsetY - p.y;
                break;
            }
        }
    }

    // Mueve la pieza
    onMouseMove(e) {
        if (!this.isActive || !this.draggedPiece) return;
        const { offsetX, offsetY } = e;
        this.draggedPiece.x = offsetX - this.offset.x;
        this.draggedPiece.y = offsetY - this.offset.y;
        this.draw();
    }

    // Suelta y verifica posición
    onMouseUp() {
        if (!this.isActive || !this.draggedPiece) return;
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

    // Rota pieza con clic derecho
    rotatePiece(e, angle) {
        if (!this.isActive) return;
        const { offsetX, offsetY } = e;
        for (const p of this.pieces) {
            if (offsetX > p.x && offsetX < p.x + p.size && offsetY > p.y && offsetY < p.y + p.size) {
                p.rotation = (p.rotation + angle + 360) % 360;
                break;
            }
        }
        this.rotatePiezaSound.play()
        this.draw();
        this.checkWin();
    }

    checkWin() {

    if (!this.isActive) return;
    const complete =
        this.pieces.every(p => p.rotation === 0) &&
        this.pieces.every(
            p =>
                Math.abs(p.x - p.correctX) < 8 &&
                Math.abs(p.y - p.correctY) < 8
        );

    if (!complete) return;

    this.isActive = false;
    this.stopTimer();

    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);

    // ❌ cancelar timeouts anteriores (si los hay)
    clearTimeout(this.timeout1);
    clearTimeout(this.timeout2);

    // mostrar el puzzle en color
    this.draw(true);

    // --- TIMEOUT 1 ---
    this.timeout1 = setTimeout(() => {
        const ganador = document.getElementById('ganador');
        const miDiv = document.getElementById('miDiv');

        miDiv.innerHTML = `<p>¡Nivel ${this.currentLevel}/3 completado! Tiempo: ${elapsed}s</p>`;
        ganador.style.display = 'flex';
        pantallaJuego.style.display = 'none';

        // botón para volver atrás
        btnVolverAtras.onclick = () => {
            ganador.style.display = 'none';
            pantallaJuego.style.display = 'none';
            pantallaSolo.style.display = 'flex';
            this.endGame()
        };

        // --- TIMEOUT 2 ---
        this.timeout2 = setTimeout(() => {
            ganador.style.display = 'none';
            this.stopTimer();

            // 🔥 SOLUCIÓN CLAVE 🔥  
            pantallaJuego.style.display = 'flex';  // ← VOLVEMOS A MOSTRAR EL CANVAS

            if (this.currentLevel < this.maxLevels) {
                this.currentLevel++;
                this.ctx.clearRect(0, 0, this.size, this.size);
                this.isActive = true;     // ← REACTIVA EL JUEGO
                this.loadLevel();
            } else {
                pantallaJuego.style.display = 'none';
                pantallaSolo.style.display = 'flex';
                this.ctx.clearRect(0, 0, this.size, this.size);
            }

        }, 2500);


    }, 2000);
    }


    // Inicia temporizador
    startTimer() {
        this.startTime = Date.now();
        const timerEl = document.getElementById("timer");
        this.timerInterval = setInterval(() => {
            const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
            timerEl.textContent = `⏱️ Tiempo: ${elapsed}s`;
        }, 100);
    }

    // Detiene temporizador
    stopTimer() {
        clearInterval(this.timerInterval);
    }

    // Devuelve imagen aleatoria del banco
    getRandomImage() {
        return this.imageBank[Math.floor(Math.random() * this.imageBank.length)];
    }

    endGame() {
    this.isActive = false;
    this.stopTimer();       
    clearTimeout(this.timeout1);
    clearTimeout(this.timeout2);
    this.ctx.clearRect(0, 0, this.size, this.size); 
    }
}

// ------------------- Inicialización del juego -------------------
const canvas = document.getElementById("canvas");
const messageEl = document.getElementById("message");
const form = document.getElementById("panel");
const game = new PuzzleGame(canvas, messageEl);

// Formulario para ingresar URL y tamaño manual
form.addEventListener("submit", e => {
    e.preventDefault();
    const urlForm = document.getElementById("imgUrl").value.trim();
    const grid = parseInt(new FormData(form).get("size"));
    game.gridSize = grid;
    game.currentLevel = 1;
    game.loadLevel();
});