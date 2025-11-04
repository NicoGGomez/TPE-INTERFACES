// Asigna un evento a cada miniatura de imagen
// Al hacer clic, guarda la URL y muestra el formulario para elegir tamaño
[imag1, imag2, imag3, imag4, imag5, imag6].forEach((img, index) => { // Recorre el array de miniaturas con su índice
    const urls = [ // Array con las URL de las imágenes correspondientes a las miniaturas
        'https://i.postimg.cc/YSVB7sLm/1.jpg',
        'https://i.postimg.cc/0N31vBKK/2.jpg',
        'https://i.postimg.cc/cJjGWbtn/3.jpg',
        'https://i.postimg.cc/ZqgzmMvC/4.jpg',
        'https://i.postimg.cc/MGTCpPXH/img5.jpg',
        'https://i.postimg.cc/k540g1Dg/img6.jpg'
    ];
    img.addEventListener('click', () => { // Añade listener click a cada miniatura
        url = urls[index]; // Guarda la URL correspondiente en la variable url
        pantallaSolo.style.display = 'none'; // Oculta la pantalla de selección de imagen
        document.getElementById('panel-piezas').style.display = 'flex'; // Muestra el panel/formulario para elegir el tamaño (panel-piezas)
    });
});

// ------------------- Formulario de tamaño -------------------
// Toma el tamaño seleccionado, inicia el juego y carga el nivel
const panelPiezas = document.getElementById('panel-piezas'); // Obtiene el formulario/panel donde eliges el tamaño de la cuadrícula
panelPiezas.addEventListener('submit', function (e) { // Añade listener al submit del formulario panel-piezas
    e.preventDefault(); // Evita que el formulario haga submit y recargue la página
    panelPiezas.style.display = 'none'; // Oculta el panel de selección de piezas
    pantallaJuego.style.display = 'flex'; // Muestra la pantalla de juego
    const grid = parseInt(new FormData(panelPiezas).get("size")); // Extrae y parsea el tamaño seleccionado del formulario
    game.gridSize = grid; // Asigna el tamaño de la cuadrícula al objeto game
    game.currentLevel = 1; // Reinicia/establece el nivel actual en 1
    game.baseGridSize = null; // Resetea el tamaño base guardado para permitir recalcular dificultad
    game.loadLevel(); // Llama al método loadLevel para cargar el nivel con la imagen/tamaño seleccionados
});

// ------------------- Clase PuzzleGame -------------------
// Maneja toda la lógica del rompecabezas
class PuzzleGame { // Declaración de la clase que contiene la lógica del juego
    constructor(canvas, messageEl) { // Constructor que recibe el canvas donde dibujar y un elemento para mensajes
        this.isActive = true; // Estado que indica si el juego está activo (se puede interactuar)
        this.canvas = canvas; // Guarda la referencia al canvas
        this.ctx = canvas.getContext("2d"); // Obtiene el contexto 2D del canvas para dibujar
        this.messageEl = messageEl; // Guarda el elemento de mensajes (no usado extensamente aquí pero disponible)
        this.size = canvas.width; // Tamaño del área de dibujo, tomado del ancho del canvas
        this.gridSize = 2; // Tamaño por defecto de la cuadrícula (2x2)
        this.image = null; // Contenedor para la imagen cargada
        this.pieces = []; // Array que contendrá las piezas del puzzle
        this.draggedPiece = null; // Referencia a la pieza actualmente arrastrada
        this.offset = { x: 0, y: 0 }; // Offset para arrastre (diferencia entre cursor y esquina de la pieza)
        this.startTime = null; // Marca temporal de inicio para temporizador
        this.timerInterval = null; // Referencia al interval del temporizador
        this.currentLevel = 1; // Nivel actual del juego
        this.maxLevels = 3; // Número máximo de niveles

        // Banco de imágenes disponibles
        this.imageBank = [ // Array con imágenes aleatorias disponibles para cuando no haya una seleccionada
            "https://i.postimg.cc/YSVB7sLm/1.jpg",
            "https://i.postimg.cc/0N31vBKK/2.jpg",
            "https://i.postimg.cc/cJjGWbtn/3.jpg",
            "https://i.postimg.cc/ZqgzmMvC/4.jpg",
            "https://i.postimg.cc/MGTCpPXH/img5.jpg",
            "https://i.postimg.cc/k540g1Dg/img6.jpg"
        ];

        this.bindEvents(); // Enlaza eventos del mouse al canvas llamando al método bindEvents
    }

    // Asocia eventos de arrastre y rotación de piezas
    bindEvents() { // Método que agrega listeners relacionados con interacción de mouse en el canvas
        this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this)); // Listener para empezar arrastre al presionar mouse
        this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this)); // Listener para mover la pieza mientras se arrastra
        this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this)); // Listener para soltar la pieza al levantar el mouse
        this.canvas.addEventListener("contextmenu", e => { // Listener para clic derecho (contextmenu) sobre el canvas
            e.preventDefault(); // Previene el menú contextual por defecto del navegador
            this.rotatePiece(e, 90); // Llama a rotatePiece con ángulo 90° al hacer clic derecho (rota la pieza)
        });
    }

    // Carga un nivel según el tamaño base y nivel actual
    loadLevel() { // Método para configurar y cargar el nivel actual
        this.isActive = true;  // Marca el juego como activo para permitir interacción
        this.stopTimer(); // Detiene cualquier temporizador previo

        // Guarda el tamaño base al iniciar
        if (!this.baseGridSize) this.baseGridSize = this.gridSize; // Si no hay baseGridSize, la establece con gridSize actual

        // Aumenta dificultad (más piezas por nivel)
        if (this.baseGridSize === 4) { // Si el tamaño base es 4
            if (this.currentLevel === 2) this.gridSize = 5; // En el nivel 2 aumenta a 5
        } else if (this.baseGridSize === 5) { // Si el tamaño base es 5
            if (this.currentLevel === 2) this.gridSize = 6; // En el nivel 2 aumenta a 6
        } else if (this.baseGridSize === 6) { // Si el tamaño base es 6
            if (this.currentLevel === 2) this.gridSize = 7; // En el nivel 2 aumenta a 7
        }

        // Carga la imagen elegida o una aleatoria
        if (this.currentLevel === 1 && url) this.loadImage(url); // Si es nivel 1 y hay url seleccionada, carga esa imagen
        else this.loadImage(this.getRandomImage()); // Si no, carga una imagen aleatoria del banco
    }

    // Carga la imagen seleccionada y crea el puzzle
    async loadImage(url) { // Método asíncrono para cargar la imagen desde URL
        const img = new Image(); // Crea un nuevo objeto Image
        img.crossOrigin = "anonymous"; // Establece crossOrigin para evitar problemas con canvas y CORS
        img.src = url; // Asigna la fuente (URL) a la imagen
        await img.decode(); // Espera que la imagen se decodifique completamente (promesa)
        this.image = img; // Guarda la imagen en la propiedad this.image
        this.createPieces(); // Crea las piezas del puzzle en base al tamaño actual
        this.shuffleRotations(); // Mezcla posiciones y asigna rotaciones aleatorias
        this.draw(); // Dibuja el puzzle en pantalla
        this.startTimer(); // Inicia el temporizador del nivel
    }

    // Crea las piezas del puzzle según el tamaño
    createPieces() { // Método que genera el array de piezas según gridSize y tamaño del canvas
        const step = this.size / this.gridSize; // Calcula el tamaño (ancho/alto) de cada pieza
        this.pieces = []; // Reinicia/limpia el array de piezas
        for (let y = 0; y < this.gridSize; y++) { // Recorre filas
            for (let x = 0; x < this.gridSize; x++) { // Recorre columnas
                this.pieces.push({ // Añade un objeto pieza con sus propiedades
                    sx: x * step, // Coordenada x fuente dentro de la imagen original
                    sy: y * step, // Coordenada y fuente dentro de la imagen original
                    x: x * step, // Posición x actual en el canvas
                    y: y * step, // Posición y actual en el canvas
                    correctX: x * step, // Posición x correcta donde debería estar la pieza
                    correctY: y * step, // Posición y correcta donde debería estar la pieza
                    size: step, // Tamaño de la pieza
                    rotation: 0 // Rotación inicial (se asignará luego)
                });
            }
        }
    }

    // Mezcla posiciones y rotaciones iniciales
    shuffleRotations() { // Método que mezcla posiciones de piezas y les asigna rotaciones aleatorias
        for (let i = this.pieces.length - 1; i > 0; i--) { // Algoritmo tipo Fisher-Yates para mezclar posiciones (parcial)
            const j = Math.floor(Math.random() * (i + 1)); // Índice aleatorio desde 0 hasta i
            [this.pieces[i].x, this.pieces[j].x] = [this.pieces[j].x, this.pieces[i].x]; // Intercambia las coordenadas x entre dos piezas
            [this.pieces[i].y, this.pieces[j].y] = [this.pieces[j].y, this.pieces[i].y]; // Intercambia las coordenadas y entre dos piezas
        }
        this.pieces.forEach(p => { // Para cada pieza
            const rotations = [0, 90, 180, 270]; // Posibles rotaciones (en grados)
            p.rotation = rotations[Math.floor(Math.random() * 4)]; // Asigna una rotación aleatoria
        });
    }

    // Dibuja el puzzle con filtros según el nivel
    draw(showColor = false) { // Método para dibujar todas las piezas en el canvas; showColor fuerza color completo
        this.ctx.clearRect(0, 0, this.size, this.size); // Limpia el canvas antes de dibujar
        if (!showColor) { // Si no se pide mostrar a color
            if (this.currentLevel === 1) this.ctx.filter = "grayscale(100%)"; // Nivel 1: escala de grises completa
            else if (this.currentLevel === 2) this.ctx.filter = "grayscale(100%) brightness(1.3)"; // Nivel 2: gris + brillo
            else this.ctx.filter = "grayscale(60%) brightness(1.2) contrast(1.1) invert(0.4)"; // Nivel >=3: mezcla de filtros
        } else this.ctx.filter = "none"; // Si showColor es true, no aplica filtros

        for (const p of this.pieces) { // Recorre cada pieza y la dibuja
            this.ctx.save(); // Guarda el estado del contexto (transformaciones, etc.)
            this.ctx.translate(p.x + p.size / 2, p.y + p.size / 2); // Traslada el origen al centro de la pieza
            this.ctx.rotate((p.rotation * Math.PI) / 180); // Rota el contexto según la rotación de la pieza (de grados a radianes)
            this.ctx.drawImage(this.image, p.sx, p.sy, p.size, p.size, -p.size / 2, -p.size / 2, p.size, p.size); // Dibuja la porción de la imagen correspondiente a la pieza
            this.ctx.restore(); // Restaura el contexto al estado previo a la transformación
            this.ctx.strokeRect(p.x, p.y, p.size, p.size); // Dibuja el borde de la pieza (rectángulo) para que se vea la grilla
        }
        this.ctx.filter = "none"; // Resetea filtro del contexto a 'none' para evitar afectarlo después
    }

    // Inicia arrastre
    onMouseDown(e) { // Manejador para el evento mousedown en canvas
        if (!this.isActive) return; // Si el juego no está activo, no hace nada
        const { offsetX, offsetY } = e; // Extrae las coordenadas del mouse relativo al canvas
        for (const p of [...this.pieces].reverse()) { // Recorre las piezas de arriba hacia abajo (para seleccionar la pieza superior)
            if (offsetX > p.x && offsetX < p.x + p.size && offsetY > p.y && offsetY < p.y + p.size) { // Si el click cae dentro de una pieza
                this.draggedPiece = p; // Marca esa pieza como la que se arrastra
                this.offset.x = offsetX - p.x; // Calcula offset horizontal entre cursor y esquina de la pieza
                this.offset.y = offsetY - p.y; // Calcula offset vertical entre cursor y esquina de la pieza
                break; // Sale del bucle porque ya encontró la pieza a arrastrar
            }
        }
    }

    // Mueve la pieza
    onMouseMove(e) { // Manejador para mousemove en canvas
        if (!this.isActive || !this.draggedPiece) return; // Si no hay pieza arrastrada o juego inactivo, no hace nada
        const { offsetX, offsetY } = e; // Obtiene coordenadas del cursor
        this.draggedPiece.x = offsetX - this.offset.x; // Actualiza posición x de la pieza según el cursor y el offset
        this.draggedPiece.y = offsetY - this.offset.y; // Actualiza posición y de la pieza según el cursor y el offset
        this.draw(); // Redibuja el tablero con la pieza en la nueva posición
    }

    // Suelta y verifica posición
    onMouseUp() { // Manejador para mouseup en canvas (cuando se suelta la pieza)
        if (!this.isActive || !this.draggedPiece) return; // Si no hay pieza arrastrada o juego inactivo, no hace nada
        const nearest = this.pieces.reduce((a, b) => { // Busca la pieza cuya posición actual esté más cercana a la pieza arrastrada
            const da = Math.hypot(a.x - this.draggedPiece.x, a.y - this.draggedPiece.y); // Distancia a la pieza a
            const db = Math.hypot(b.x - this.draggedPiece.x, b.y - this.draggedPiece.y); // Distancia a la pieza b
            return da < db ? a : b; // Retorna la más cercana
        });
        [this.draggedPiece.x, nearest.x] = [nearest.x, this.draggedPiece.x]; // Intercambia las coordenadas x entre la pieza arrastrada y la más cercana (snap)
        [this.draggedPiece.y, nearest.y] = [nearest.y, this.draggedPiece.y]; // Intercambia las coordenadas y entre la pieza arrastrada y la más cercana
        this.draggedPiece = null; // Limpia la referencia a la pieza arrastrada (ya se soltó)
        this.draw(); // Redibuja el tablero con las piezas en nuevas posiciones
        this.checkWin(); // Llama a la verificación de victoria para comprobar si se completó el puzzle
    }

    // Rota pieza con clic derecho
    rotatePiece(e, angle) { // Método que rota la pieza bajo el cursor con un ángulo dado
        if (!this.isActive) return; // Si el juego no está activo, no hace nada
        const { offsetX, offsetY } = e; // Obtiene coordenadas del evento
        for (const p of this.pieces) { // Recorre todas las piezas
            if (offsetX > p.x && offsetX < p.x + p.size && offsetY > p.y && offsetY < p.y + p.size) { // Si el cursor está sobre una pieza
                p.rotation = (p.rotation + angle + 360) % 360; // Suma el ángulo a la rotación actual y normaliza entre 0-359
                break; // Sale porque ya rotó la pieza correspondiente
            }
        }
        this.draw(); // Redibuja el tablero mostrando la rotación
        this.checkWin(); // Verifica si la rotación dejó el puzzle completo
    }

    // Comprueba si el puzzle está completo
    checkWin() { // Método para comprobar condición de victoria
        const complete = this.pieces.every(p => p.rotation === 0) && // Verifica que todas las piezas tengan rotación 0
            this.pieces.every(p => Math.abs(p.x - p.correctX) < 8 && Math.abs(p.y - p.correctY) < 8); // Y que estén cerca de su posición correcta (tolerancia 8px)

        if (complete) { // Si la condición es true, se ha completado el puzzle
            this.isActive = false; // Desactiva interacciones
            this.stopTimer(); // Detiene el temporizador
            const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1); // Calcula tiempo transcurrido en segundos con un decimal

            // Muestra imagen a color y luego cartel de victoria
            this.draw(true); // Dibuja el puzzle a color (showColor = true)
            setTimeout(() => { // Espera 2 segundos antes de mostrar cartel de victoria
                const ganador = document.getElementById('ganador'); // Obtiene el elemento que muestra la pantalla de ganador
                const miDiv = document.getElementById('miDiv'); // Obtiene el div donde se coloca el texto del ganador
                miDiv.innerHTML = `<p>¡Nivel ${this.currentLevel}/3 completado! Tiempo: ${elapsed}s</p>`; // Inserta mensaje con nivel y tiempo
                ganador.style.display = 'flex'; // Muestra la pantalla de ganador
                pantallaJuego.style.display = 'none'; // Oculta la pantalla de juego

                // Botón volver al menú
                btnVolverAtras.onclick = () => { // Asigna handler al botón volver del cartel de ganador
                    ganador.style.display = 'none'; // Oculta el cartel de ganador
                    pantallaJuego.style.display = 'none'; // Asegura que la pantalla de juego esté oculta
                    pantallaSolo.style.display = 'flex'; // Muestra la pantalla de selección de imagen/solitario
                };

                // Avanza al siguiente nivel o vuelve al menú
                setTimeout(() => { // Después de 2.5 segundos avanza o finaliza
                    ganador.style.display = 'none'; // Oculta el cartel de ganador
                    pantallaJuego.style.display = 'flex'; // Muestra nuevamente la pantalla de juego
                    if (this.currentLevel < this.maxLevels) { // Si aún quedan niveles por jugar
                        this.currentLevel++; // Incrementa el nivel actual
                        this.ctx.clearRect(0, 0, this.size, this.size); // Limpia el canvas
                        this.loadLevel(); // Carga el siguiente nivel
                    } else { // Si se alcanzó el último nivel
                        pantallaJuego.style.display = 'none'; // Oculta la pantalla de juego
                        pantallaSolo.style.display = 'flex'; // Vuelve a la selección de imagen/menú
                        this.ctx.clearRect(0, 0, this.size, this.size); // Limpia el canvas final
                    }
                }, 2500);
            }, 2000);
        }
    }

    // Inicia temporizador
    startTimer() { // Método para iniciar el temporizador del nivel
        this.startTime = Date.now(); // Guarda la marca de tiempo de inicio
        const timerEl = document.getElementById("timer"); // Obtiene el elemento donde se mostrará el tiempo
        this.timerInterval = setInterval(() => { // Crea un intervalo que actualiza el tiempo regularmente
            const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1); // Calcula tiempo transcurrido en segundos
            timerEl.textContent = `⏱️ Tiempo: ${elapsed}s`; // Actualiza el texto del elemento timer con el tiempo transcurrido
        }, 100); // Intervalo cada 100 ms (cada 0.1s)
    }

    // Detiene temporizador
    stopTimer() { // Método para detener el temporizador
        clearInterval(this.timerInterval); // Limpia el intervalo almacenado en this.timerInterval
    }

    // Devuelve imagen aleatoria del banco
    getRandomImage() { // Método que retorna una URL aleatoria del banco de imágenes
        return this.imageBank[Math.floor(Math.random() * this.imageBank.length)]; // Selecciona y devuelve una URL aleatoria
    }
}

// ------------------- Inicialización del juego -------------------
const canvas = document.getElementById("canvas"); // Obtiene el elemento canvas del DOM
const messageEl = document.getElementById("message"); // Obtiene el elemento de mensajes (por si se usa)
const form = document.getElementById("panel"); // Obtiene el formulario/panel para ingresar URL y tamaño manual
const game = new PuzzleGame(canvas, messageEl); // Crea una instancia de PuzzleGame pasando canvas y elemento de mensajes

// Formulario para ingresar URL y tamaño manual
form.addEventListener("submit", e => { // Añade listener al submit del formulario "panel"
    e.preventDefault(); // Previene recarga de página por submit
    const urlForm = document.getElementById("imgUrl").value.trim(); // Obtiene y limpia la URL ingresada por el usuario
    const grid = parseInt(new FormData(form).get("size")); // Obtiene y parsea el tamaño seleccionado desde el formulario
    game.gridSize = grid; // Asigna el tamaño al juego
    game.currentLevel = 1; // Reinicia el nivel a 1
    game.loadLevel(); // Carga el nivel con la URL (si el código de loadLevel detecta url o imagen aleatoria según lógica)
});