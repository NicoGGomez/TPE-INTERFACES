// ------------------- Pantallas y botones (igual que antes) -------------------
const btnPlay = document.getElementById('btn-play');
const pantallaJuegoInactivo = document.getElementById('pantalla-juego');
const pantallaJuegoActivo = document.getElementById('pantalla-juego-principal');

btnPlay && btnPlay.addEventListener('click', () => {
    pantallaJuegoInactivo.style.display = 'none';
    pantallaJuegoActivo.style.display = 'flex';

    if (currentGame.menuMusic.paused) {
        currentGame.menuMusic.play().catch(() => {
            console.log("Requiere interacción del usuario para reproducir música");
        });
    }
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
    currentGame.optionMusic.pause();
    currentGame.optionMusic.currentTime = 0;
    currentGame.optionMusic.play();
});
const volverInstrucciones = document.getElementById('volver-instrucciones');
volverInstrucciones && volverInstrucciones.addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'flex';
    pantallaInstrucciones.style.display = 'none';
    currentGame.optionMusic.pause();
    currentGame.optionMusic.currentTime = 0;
    currentGame.optionMusic.play();
});

btnMultijugador && btnMultijugador.addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'none';
    pantallaMultijugador.style.display = 'flex';
    currentGame.optionMusic.pause();
    currentGame.optionMusic.currentTime = 0;
    currentGame.optionMusic.play();
});
const volverMultijugador = document.getElementById('volver-multijugador');
volverMultijugador && volverMultijugador.addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'flex';
    pantallaMultijugador.style.display = 'none';
    currentGame.optionMusic.pause();
    currentGame.optionMusic.currentTime = 0;
    currentGame.optionMusic.play();
});

btnJugarSolo && btnJugarSolo.addEventListener('click', () => {
    pantallaJuegoActivo.style.display = 'none';
    pantallaJuego.style.display = 'flex';
    currentGame.optionMusic.pause();
    currentGame.optionMusic.currentTime = 0;
    currentGame.optionMusic.play();
});

// btnSalir && btnSalir.addEventListener('click', () => {
//     pantallaJuego.style.display = 'none';
//     pantallaJuegoActivo.style.display = 'flex';
//     clearInterval(timerInterval);
//     timerEl.textContent = "⏱️ Tiempo: 120s";
// });

btnSalir && btnSalir.addEventListener('click', () => {
    currentGame.running = false;
    pantallaJuego.style.display = 'none';
    pantallaJuegoActivo.style.display = 'flex';
    clearInterval(timerInterval);
    timerEl.textContent = "⏱️ Tiempo: 120s";
});

const btnPause = document.getElementById('btn-pause');
btnPause.addEventListener('click', () => {
    currentGame._togglePause();
});

const quitarPausa = document.getElementById('continuar');
quitarPausa.addEventListener('click', () => {
    currentGame._togglePause();
});


class GameAssets {
    constructor() {
        this.images = {};
        this.urls = {
            bg_far: "https://i.postimg.cc/fTnR2R3V/bg-far.jpg",       // capa 4 (más lejos)
            bg_mid2: "https://i.postimg.cc/Fs5HWHfj/bg-mid3.png",     // capa 3
            bg_mid1: "https://i.postimg.cc/pXbLGL9p/bg-mid2.png",     // capa 2
            bg_front: "https://i.postimg.cc/RNsW-5Byg/Generated-Image-November-16-2025-9-22PM-removebg-preview.png",   // capa 1 (más cerca)
            ship_sprites: "https://i.postimg.cc/qMVvbvtt/ship-sprites.png", ship_activate_sprites: "https://i.postimg.cc/w1y5MRTk/descarga.png", // sprite: flame frames + ship
            explosion_sprites: "https://i.postimg.cc/R6gc3S7n/cc572ebb-fb41-4e70-aeff-e309b344893d-removebg-preview.png",
            enemy_sprite: "https://i.postimg.cc/pmbrQmBN/descarga-(1).png",
            cloud_sprite: "https://i.postimg.cc/p5thWkLh/Generated-Image-November-16-2025-7-51PM-removebg-preview.png",
            bonus_sprite: "https://i.postimg.cc/3kPs078r/bonus-sprite-removebg-preview.png"
        };
    }

    preloadImage(key, url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => { this.images[key] = img; resolve(img); };
            img.onerror = () => { console.warn("Error cargando:", url); resolve(null); };
            img.src = url;
        });
    }
    async preloadAll() {
        const promises = Object.entries(this.urls).map(([k, url]) => this.preloadImage(k, url));
        await Promise.all(promises);
    }
}

/* --------- Parallax Layer --------- */

class ParallaxLayer {
    constructor(img, speed, width=null, height=null) {
        this.img = img;
        this.speed = speed;
        this.x = 0;
        this.width = width;   // si null, usa ancho natural
        this.height = height; // si null, usa alto del canvas
    }

    update(dt) {
        this.x -= this.speed * dt;
        if (this.img) {
            const w = this.width ?? this.img.width;
            if (this.x <= -w) this.x += w;
            if (this.x >= w) this.x -= w;
        }
    }

    draw(ctx, canvas) {
        if (!this.img) {
            ctx.fillStyle = "#87CEEB";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const w = this.width ?? this.img.width;
        const h = this.height ?? canvas.height;
        let startX = Math.floor(this.x);

        for (let sx = startX; sx < canvas.width; sx += w) {
            ctx.drawImage(this.img, sx, 0, w, h);
        }
        for (let sx = startX - w; sx > -w; sx -= w) {
            ctx.drawImage(this.img, sx, 0, w, h);
        }
    }
}


/* --------- Ship (jugador) --------- */
class Ship {
    constructor(imgSprites, activateSprites) {
        this.sprite = imgSprites; // spritesheet
        this.activateSprites = activateSprites
        this.x = 120;
        this.y = 200;
        this.vy = 0;
        this.width = 100; // 64
        this.height = 100; //48
        this.gravity = 1200; // px/s^2
        this.flapStrength = -350; // impulso
        this.maxFallSpeed = 800;
        this.alive = true;
        this.lives = 3;
        this.score = 0;

        this.hasBonus = false; // indica si tiene borde amarillo

        // animación de propulsores (supongamos 4 frames horizontales)
        this.flameFrames = 1;
        this.flameFrameTime = 0.06;
        this.flameTimer = 0;
        this.flameIndex = 0;

        // explosión state
        this.exploding = false;
        this.explosionTimer = 0;

        // efecto rojo
        this.redSprite = null; // versión de la nave en rojo
        this.damageTimer = 0;
        this.damageDuration = 0.1;

        this._prepareRedSprite(); // precalcular versión roja
    }

    _prepareRedSprite() {
        const temp = document.createElement('canvas');
        temp.width = this.width;
        temp.height = this.height;
        const tctx = temp.getContext('2d');

        // dibujar sprite original escalado
        tctx.drawImage(this.sprite, 0, 0, this.width, this.height);

        // aplicar rojo sobre los píxeles visibles
        tctx.fillStyle = 'red';
        tctx.globalCompositeOperation = 'source-in';
        tctx.fillRect(0, 0, this.width, this.height);

        this.redSprite = new Image();
        this.redSprite.src = temp.toDataURL();
    }

    flap() {
        if (!this.alive) return;
        this.vy = this.flapStrength;
        // encender propulsores (reset anim)
        this.flameTimer = 0;
        this.flameIndex = 0;
    }

    update(dt) {
        if (!this.alive) return;
        // física vertical
        this.vy += this.gravity * dt;
        if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;
        this.y += this.vy * dt;

        // reducir timer de daño
        if (this.damageTimer > 0) this.damageTimer -= dt;

        // Limite superior
        if (this.y < 10) { 
            this.y = 10; 
            this.vy = 0; 
        }

        // Limite inferior
        const canvasHeight = 600; // o pasalo como parámetro si querés más dinámico
        if (this.y + this.height/2 > canvasHeight) { 
            this.y = canvasHeight - this.height/2; 
            // this.vy = 0; 
            this.vy = -700;                           // empuja hacia arriba
            this.hit();   
        }

        // anim flame
        this.flameTimer += dt;
        if (this.flameTimer >= this.flameFrameTime) {
            this.flameTimer -= this.flameFrameTime;
            this.flameIndex = (this.flameIndex + 1) % this.flameFrames;
        }
    }

    draw(ctx) {
        if (this.exploding) return;

        if (this.damageTimer > 0) {
            // canvas temporal
            const temp = document.createElement('canvas');
            temp.width = this.width;
            temp.height = this.height;
            const tctx = temp.getContext('2d');

            // dibujar nave normal
            tctx.drawImage(this.sprite, 0, 0, this.width, this.height);

            // dibujar flame si corresponde
            if (this.vy < 0 || this.flameIndex !== 0) {
                tctx.drawImage(this.activateSprites, 0, 0, this.width, this.height);
            }

            // aplicar rojo solo a los píxeles visibles
            currentGame.hitSound.currentTime = 1;
            currentGame.hitSound.play();

            tctx.fillStyle = 'red';
            tctx.globalAlpha = 0.6;
            tctx.globalCompositeOperation = 'source-in';
            tctx.fillRect(0, 0, this.width, this.height);

            // dibujar en canvas principal
            ctx.drawImage(temp, this.x - this.width/2, this.y - this.height/2);
        } else {
            // dibujar normal
            ctx.drawImage(this.sprite, this.x - this.width/2, this.y - this.height/2, this.width, this.height);

            if (this.hasBonus) {
            // canvas temporal
            const temp = document.createElement('canvas');
            temp.width = this.width;
            temp.height = this.height;
            const tctx = temp.getContext('2d');

            // dibujar nave normal
            tctx.drawImage(this.sprite, 0, 0, this.width, this.height);

            // dibujar flame si corresponde
            if (this.vy < 0 || this.flameIndex !== 0) {
                tctx.drawImage(this.activateSprites, 0, 0, this.width, this.height);
            }

            // aplicar rojo solo a los píxeles visibles
            tctx.fillStyle = 'yellow';
            tctx.globalAlpha = 0.6;
            tctx.globalCompositeOperation = 'source-in';
            tctx.fillRect(0, 0, this.width, this.height);

            // dibujar en canvas principal
            ctx.drawImage(temp, this.x - this.width/2, this.y - this.height/2);
            }

            if (this.vy < 0 || this.flameIndex !== 0) {
                ctx.drawImage(this.activateSprites, this.x - this.width/2, this.y - this.height/2, this.width, this.height);
            }
        }
    }

    grabBonus() {
        this.hasBonus = true;

        // Quitar el borde después de 1 segundo
        setTimeout(() => {
            this.hasBonus = false;
        }, 1000);
    }

    getBounds() {
        return { x: this.x - this.width/2, y: this.y - this.height/2, w: this.width, h: this.height };
    }

    hit() {
        this.lives--;
        this.damageTimer = this.damageDuration; // activar efecto rojo
        if (this.lives <= 0) {
            this.alive = false;
            this.exploding = true;
            this.explosionTimer = 0;
        }
    }
}

/* --------- Obstáculos, enemies y bonuses --------- */
class Obstacle {
    constructor(x, y, w, h, type = "pipe") {
        this.x = x; this.y = y;
        this.w = w; this.h = h;
        this.type = type; // pipe, enemy, bonus
        this.dead = false;
        this.speed = 200;
        this.animTimer = 0;
    }
    update(dt, playerSpeed) {
        this.x -= this.speed * playerSpeed * dt;
        // simple anim
        this.animTimer += dt;
    }
    draw(ctx, assets) {
        if (this.type === "pipe") {
            ctx.fillStyle = "#2E8B57";
            ctx.fillRect(this.x, this.y, this.w, this.h);
            // rim edge
            ctx.strokeStyle = "#124";
            ctx.strokeRect(this.x, this.y, this.w, this.h);
        } else if (this.type === "enemy") {
            const img = assets.images.enemy_sprite;
            if (img) ctx.drawImage(img, this.x, this.y, this.w, this.h);
            else {
                ctx.fillStyle = "red";
                ctx.fillRect(this.x, this.y, this.w, this.h);
            }
        } else if (this.type === "bonus") {
            const img = assets.images.bonus_sprite;
            if (img) ctx.drawImage(img, this.x, this.y, this.w, this.h);
            else {
                ctx.fillStyle = "gold";
                ctx.fillRect(this.x, this.y, this.w, this.h);
            }
        }
    }
    getBounds() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}

/* --------- Manager de Obstáculos --------- */
// class ObstacleManager {
//     constructor(canvas, assets) {
//         this.canvas = canvas;
//         this.assets = assets;
//         this.obstacles = [];
//         this.spawnTimer = 0;
//         this.spawnInterval = 1.4;
//         this.speedMultiplier = 1;
//     }

//     update(dt) {
//         this.spawnTimer += dt;
//         if (this.spawnTimer >= this.spawnInterval) {
//             this.spawnTimer -= this.spawnInterval;
//             this._spawnPair();
//         }
//         // update existing
//         for (const o of this.obstacles) o.update(dt, this.speedMultiplier);
//         // limpiar fuera de pantalla o muertos
//         this.obstacles = this.obstacles.filter(o => (o.x + o.w > -50) && !o.dead);
//     }

//     _spawnPair() {
//         const pipeW = 72;
//         const gap = 200;              
//         const minH = 120;                
//         const maxH = this.canvas.height - gap - 300;

//         // Generar topH con variación
//         const prevY = this.lastY ?? (this.canvas.height / 2);
//         const maxDesvio = 60;
//         let topH = prevY + (Math.random() * 2 - 1) * maxDesvio;
//         topH = Math.max(minH, Math.min(maxH, topH));
//         this.lastY = topH;

//         const xPos = this.canvas.width + 80;

//         // crear tubos
//         this.obstacles.push(new Obstacle(xPos, 0, pipeW, topH, "pipe"));
//         this.obstacles.push(new Obstacle(xPos, topH + gap, pipeW, this.canvas.height - (topH + gap), "pipe"));

//         // margen dentro del gap para enemigos
//         if (Math.random() < 0.3) {
//             const enemySize = 100; // tamaño del enemigo
//             const safeTop = topH + 10;                  // margen superior
//             const safeBottom = topH + gap - enemySize - 10; // margen inferior considerando tamaño del enemy

//             const ey = safeTop + Math.random() * (safeBottom - safeTop);
//             this.obstacles.push(new Obstacle(this.canvas.width + 120, ey, enemySize, enemySize, "enemy"));
//         }

//         // bonus centrado en la abertura
//         if (Math.random() < 0.2) {
//             const by = topH + gap / 2 - 18; 
//             this.obstacles.push(new Obstacle(this.canvas.width + 200, by, 36, 36, "bonus"));
//         }
//     }


//     draw(ctx) {
//         for (const o of this.obstacles) o.draw(ctx, this.assets);
//     }

//     checkCollisions(ship) {
//         const s = ship.getBounds();
//         for (const o of this.obstacles) {
//             const b = o.getBounds();
//             if (this._intersectRect(s, b)) {
//                 return o;
//             }
//         }
//         return null;
//     }

//     _intersectRect(a, b) {
//         return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
//     }

//     shoot(x, y) {
//         // simple: buscar primer obstáculo en línea de tiro y marcar dead
//         for (const o of this.obstacles) {
//             if (o.x < x + 300 && o.x > x && Math.abs((o.y + o.h/2) - y) < 60 && o.type !== "bonus") {
//                 o.dead = true;
//                 return true;
//             }
//         }
//         return false;
//     }
// }

class ObstacleManager {
    constructor(canvas, assets) {
        this.canvas = canvas;
        this.assets = assets;
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.4;
        this.speedMultiplier = 1;
    }

    update(dt) {
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer -= this.spawnInterval;
            this._spawnPair();
        }

        for (const o of this.obstacles) {
        // enemigos con animación vertical
        if (o.type === "enemy" && o.targetY !== undefined) {
            // mover horizontal siempre
            o.x -= 200 * dt * this.speedMultiplier;

            // activar animación vertical solo cuando esté visible
            if (!o.animating && o.x + o.w < this.canvas.width - 50) {
                o.animating = true;
            }


            if (o.animating) {
                const diff = o.targetY - o.y;
                const speed = 300;
                if (Math.abs(diff) < 1) {
                    o.y = o.targetY;
                    delete o.targetY;
                    delete o.animating;
                } else {
                    o.y += Math.sign(diff) * Math.min(speed * dt, Math.abs(diff));
                }
            }
        } else {
            // objetos normales
            o.update(dt, this.speedMultiplier);
        }
    }
        this.obstacles = this.obstacles.filter(o => (o.x + o.w > -50) && !o.dead);
    }

    _spawnPair() {
        const pipeW = 72;
        const gap = 200;
        const minH = 120;
        const maxH = this.canvas.height - gap - 300;

        const prevY = this.lastY ?? (this.canvas.height / 2);
        const maxDesvio = 60;
        let topH = prevY + (Math.random() * 2 - 1) * maxDesvio;
        topH = Math.max(minH, Math.min(maxH, topH));
        this.lastY = topH;

        const xPos = this.canvas.width + 80;

        // crear tubos
        this.obstacles.push(new Obstacle(xPos, 0, pipeW, topH, "pipe"));
        this.obstacles.push(new Obstacle(xPos, topH + gap, pipeW, this.canvas.height - (topH + gap), "pipe"));

        // enemigos dentro del gap
        if (Math.random() < 0.3) {
            const enemySize = 100;
            const safeTop = topH + 10;
            const safeBottom = topH + gap - enemySize - 10;
            const ey = safeTop + Math.random() * (safeBottom - safeTop);

            // enemigo empieza abajo del canvas y sube al target
            const enemy = new Obstacle(this.canvas.width + 120, this.canvas.height + enemySize, enemySize, enemySize, "enemy");
            enemy.targetY = ey;  // posición final
            this.obstacles.push(enemy);
        }

        // bonus centrado en la abertura
        if (Math.random() < 0.2) {
            const by = topH + gap / 2 - 18; 
            this.obstacles.push(new Obstacle(this.canvas.width + 200, by, 36, 36, "bonus"));
        }
    }

    draw(ctx) {
    for (const o of this.obstacles) {
        // Solo dibujar si visible
        if (o.x + o.w > 0 && o.x < this.canvas.width) {
            o.draw(ctx, this.assets);
        }
    }
}

    checkCollisions(ship) {
        const s = ship.getBounds();
        for (const o of this.obstacles) {
            const b = o.getBounds();
            if (this._intersectRect(s, b)) return o;
        }
        return null;
    }

    _intersectRect(a, b) {
        return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
    }

    shoot(x, y) {
        for (const o of this.obstacles) {
            if (o.x < x + 300 && o.x > x && Math.abs((o.y + o.h/2) - y) < 60 && o.type !== "bonus") {
                o.dead = true;
                return true;
            }
        }
        return false;
    }
}




/* --------- Game principal --------- */

/* --------- Temporizador del juego --------- */
class GameTimer {
    constructor(domElement, duration, onFinish) {
        this.domElement = domElement;     // elemento donde se muestra el tiempo
        this.duration = duration;         // duración total en segundos
        this.remaining = duration;        // tiempo restante
        this.onFinish = onFinish;         // callback cuando termina
        this.interval = null;
    }

    start() {
        this.stop(); // por si había uno corriendo
        this.remaining = this.duration;

        this.interval = setInterval(() => {
            this.remaining--;
            if (this.domElement) {
                this.domElement.textContent = this.remaining + "s";
            }
            if (this.remaining <= 0) {
                this.stop();
                if (this.onFinish) this.onFinish();
            }
        }, 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    getRemaining() {
        return this.remaining;
    }
}



class SpaceGame {
    constructor() {
        // referencias UI (las tuyas ya existentes)
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.timerEl = document.getElementById('timer');
        this.pantallaJuego = document.getElementById('juego-pantalla');
        this.pantallaMenu = document.getElementById('pantalla-juego-principal');
        this.btnReiniciar = document.getElementById('reiniciar');
        this.btnSalir = document.getElementById('salir');
        document.getElementById('menu-pausa').style.display = 'none'

        // botón disparo (puede estar en HTML)
        this.btnShoot = document.getElementById('btn-shoot');
        this.shots = []; // x, y, timer
        this.shotSpeed = 600; 

        this.assets = new GameAssets();
        this.layers = [];
        this.ship = null;
        this.obManager = null;
        this._explosionPlayed = false;

        // control
        this.lastTime = 0;
        this.running = false;

        // UI scoreboard
        this.scoreEl = document.getElementById('score') || null;
        this.livesEl = document.getElementById('lives') || null;

        // tiempo (si querés mantener GameTimer)
        this.gameTimer = new GameTimer(this.timerEl, 120, this.onTimeUp.bind(this));

        // sonidos
        this.shootSound = new Audio('https://www.myinstants.com/media/sounds/laser.mp3');
        this.shootSound.volume = 0.3;
        this.explosionSound = new Audio('https://www.myinstants.com/media/sounds/explosion.mp3'); 
        this.explosionSound.volume = 0.3;
        this.bonusSound = new Audio('https://www.myinstants.com/media/sounds/coin.mp3'); // bonus recogido
        this.bonusSound.volume = 0.4;

        this.enemyDestroySound = new Audio('https://www.myinstants.com/media/sounds/explosion.mp3'); // enemigo destruido
        this.enemyDestroySound.volume = 0.2;

        this.hitSound = new Audio('https://www.myinstants.com/media/sounds/danio.mp3'); // daño al chocar
        this.hitSound.volume = 0.4;

        // música
        this.menuMusic = new Audio('/quinta-entrega/sounds/sonido-extraterrestre.mp3');
        this.menuMusic.loop = true;
        this.menuMusic.volume = 0.5;

        this.gameMusic = new Audio('/quinta-entrega/sounds/musica-juego.mp3');
        this.gameMusic.loop = true;
        this.gameMusic.volume = 0.1;

        this.optionMusic = new Audio('https://www.myinstants.com/media/sounds/botonui.mp3');
        this.gameMusic.loop = true;
        this.gameMusic.volume = 0.2;

        this._bindUI();
        this._bindInput();
    }

    _bindUI() {
        this.btnReiniciar?.addEventListener('click', () => {
            this.start()
            this.optionMusic.pause();
            this.optionMusic.currentTime = 0;
            this.optionMusic.play();
        });
        this.btnSalir?.addEventListener('click', () => {
            this.stop();
            this.pantallaJuego.style.display = 'none';
            this.pantallaMenu.style.display = 'flex';

            if (this.menuMusic.paused) {
                this.menuMusic.play().catch(() => {
                    console.log("Requiere interacción del usuario para reproducir música");
                });
            }

            this.gameMusic.pause();
            this.gameMusic.currentTime = 0;

            this.optionMusic.pause();
            this.optionMusic.currentTime = 0;
            this.optionMusic.play();
        });
        this.btnShoot?.addEventListener('click', () => {
            this._shoot();
        });
    }

    _bindInput() {
        window.addEventListener('keydown', (e) => {
            if (!this.running) return; 
            if (e.code === 'Space') { e.preventDefault(); this._flap(); }
            if (e.code === 'KeyF') this._shoot();
            if (e.code === 'Escape') {        // <--- nueva línea
                e.preventDefault();
                this._togglePause();
            }
        });
        // click / touch to flap
        this.canvas.addEventListener('mousedown', (e) => { this._flap(); });
        this.canvas.addEventListener('touchstart', (e) => { this._flap(); });
    }

    _stopAllSounds() {
        const sounds = [
            this.shootSound,
            this.explosionSound,
            this.bonusSound,
            this.enemyDestroySound,
            this.hitSound,
            this.gameMusic,
            // this.menuMusic
        ];

        sounds.forEach(s => {
            s.pause();
            s.currentTime = 0;
        });
    }

    async start() {
        document.getElementById('menu-pausa').style.display = 'none';
        await this.assets.preloadAll();
        this._setupWorld();

        // detener música del menú y reproducir música del juego
        this.menuMusic.pause();
        this.menuMusic.currentTime = 0;
        this.gameMusic.play();

        this.ship.alive = true;
        this._explosionPlayed = false;
        this.explosionSound.pause();
        this.explosionSound.currentTime = 0;
        this.ship.lives = 3;
        this.ship.explosionTimer = 0;

        this.gameTimer.start();
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this._loop.bind(this));
    }

    _togglePause() {
    this.running = !this.running;
    this.optionMusic.pause();
    this.optionMusic.currentTime = 0;
    this.optionMusic.play();
    if (!this.running) {
        // mostrar botones de reiniciar y salir
        document.getElementById('menu-pausa').style.display = 'flex'
    } else {
        // ocultar botones
        document.getElementById('menu-pausa').style.display = 'none'
        // reinicia loop
        this.lastTime = performance.now();
        requestAnimationFrame(this._loop.bind(this));
    }
    }

    stop() {
        this.running = false;
        this.gameTimer.stop();
    }

    _setupWorld() {

    // dimensionar canvas
    const ratio = window.devicePixelRatio || 1;
    const w = 1200;
    const h = 600;
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
    this.canvas.width = Math.floor(w * ratio);
    this.canvas.height = Math.floor(h * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    this.layers = [
    new ParallaxLayer(this.assets.images.bg_far,   30, 1200, 600),
    new ParallaxLayer(this.assets.images.bg_mid2,  60, 600, 600),
    new ParallaxLayer(this.assets.images.bg_mid1,  80, 1200, 600),
    // new ParallaxLayer(this.assets.images.bg_front,200, 400, 600)
    ];


    // nubes independientes
    this.clouds = [];
    for (let i = 0; i < 5; i++) {
        this.clouds.push({
            x: Math.random() * this.canvas.width,
            y: 40 + Math.random() * 200,
            w: 200,
            h: 200,
            speed: 40 + Math.random() * 60
        });
    }

    this.ship = new Ship(this.assets.images.ship_sprites, this.assets.images.ship_activate_sprites);
    this.obManager = new ObstacleManager(this.canvas, this.assets);


    // UI
    if (this.scoreEl) this.scoreEl.textContent = `Score: 0`;
    if (this.livesEl) this.livesEl.textContent = `Lives: ${this.ship.lives}`;
    }

    _loop(ts) {
    if (!this.running) return;
    const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;

    // si la nave está explotando, detenemos el timer
    if (this.ship.exploding && this.gameTimer.interval !== null) {
        this.gameTimer.stop();
    }

    for (let i = this.shots.length - 1; i >= 0; i--) {
    const s = this.shots[i];
        s.x += this.shotSpeed * dt;
        // colisiones con enemigos
        for (let j = 0; j < this.obManager.obstacles.length; j++) {
            const o = this.obManager.obstacles[j];
            const b = o.getBounds();
            if (!o.dead && o.type === "enemy" &&
                s.x + s.w > b.x && s.x < b.x + b.w &&
                s.y + s.h/2 > b.y && s.y - s.h/2 < b.y + b.h) {
                
                o.dead = true;
                this.ship.score += 2;

                // sonido de enemigo destruido
                this.enemyDestroySound.currentTime = 0;
                this.enemyDestroySound.play();
            }
        }
        if (s.x > this.canvas.width) this.shots.splice(i, 1);
    }


    // actualizar mundo
    this.layers.forEach(l => l.update(dt));
    this.ship.update(dt);
    this.obManager.update(dt);

    const hitObs = this.obManager.checkCollisions(this.ship);
    if (hitObs && !this.ship.exploding) {
        if (hitObs.type === "bonus") {
            hitObs.dead = true;
            this.ship.score += 10;
            this.bonusSound.currentTime = 0;
            this.bonusSound.play();
            this.ship.grabBonus();
        } else {
            hitObs.dead = true;
            this.ship.hit();

            if (!this.ship.alive) {  // justo murió
                this.gameTimer.stop(); 
            }
        }
        this._updateUI();
    }

    // puntuación
    for (const o of this.obManager.obstacles) {
        if (!o._scored && o.x + o.w < this.ship.x) {
            o._scored = true;
            if (o.type === "pipe") this.ship.score += 1;
        }
    }

    // animación explosión
    if (this.ship.exploding) {

        if (!this._explosionPlayed) {
        this.explosionSound.play();
        this.explosionSound.currentTime = 0;

        this._explosionPlayed = true;
        }

        this.ship.explosionTimer += dt;
        if (this.ship.explosionTimer > 1.2) {
            this._gameOver();
            return;
        }
    }

    this._draw();

    if (this.gameTimer.getRemaining() <= 0 && this.running) {
        this.running = false;
        this._gameOver();
        return;
    }

    requestAnimationFrame(this._loop.bind(this));
}


    _draw() {
    // limpiar
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // dibujar todas las capas de fondo (parallax)

    for (const l of this.layers) l.draw(this.ctx, this.canvas);

    // dibujar nubes difuminadas
    const cloudImg = this.assets.images.cloud_sprite;
    if (cloudImg) {
        this.clouds.forEach(c => {
            c.x -= c.speed * 0.016; // dt aproximado
            if (c.x + c.w < 0) c.x = this.canvas.width;

            this.ctx.save();
            this.ctx.globalAlpha = 0.5;      // semitransparente
            this.ctx.filter = 'blur(2px)';   // difuminado
            this.ctx.drawImage(cloudImg, c.x, c.y, c.w, c.h);
            this.ctx.restore();
        });
    }

    // dibujar obstáculos
    this.obManager.draw(this.ctx);

    // dibujar nave
    this.ship.draw(this.ctx);

    // dibujar explosión si corresponde
    if (this.ship.exploding && this.assets.images.explosion_sprites) {
        const exp = this.assets.images.explosion_sprites;
        const frames = 5;
        const t = this.ship.explosionTimer;
        const idx = Math.floor((t / 1.2) * frames);
        const fw = exp.width / frames;
        const fh = exp.height;
        this.ctx.drawImage(exp, Math.min(idx, frames-1) * fw, 0, fw, fh,
                           this.ship.x - 6, this.ship.y - 60, 100, 100);
    }

    // dibujar disparos
    for (const s of this.shots) {
        this.ctx.fillStyle = "yellow";
        this.ctx.fillRect(s.x, s.y - s.h/2, s.w, s.h);
    }

    this.ctx.fillStyle = "white";
    this.ctx.font = "20px Arial";
    this.ctx.fillText("Dispara con [F]", 10, 590);

    // HUD
    this.ctx.fillStyle = "white";
    this.ctx.font = "18px Arial";
    this.ctx.fillText(`Score: ${this.ship.score}`, 18, 26);
    this.ctx.fillText(`Lives: ${this.ship.lives}`, 18, 48);
    this.ctx.fillText(`Time: ${this.gameTimer.getRemaining()}s`, 18, 70);
    }


    _flap() {
        if (!this.running) return;
        this.ship.flap();
    }

    _shoot() {
    if (!this.running) return;
    const sx = this.ship.x + 30;
    const sy = this.ship.y;
    this.shots.push({ x: sx, y: sy, w: 6, h: 2 }); // crear disparo
    // reproducir sonido
    this.shootSound.currentTime = 0; // reinicia si estaba reproduciéndose
    this.shootSound.play();
    }

    _flashShot(x, y) {
        // simple trazo que desaparece
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.ship.x + 12, this.ship.y);
        ctx.lineTo(x + 300, y);
        ctx.stroke();
        ctx.restore();
    }

    _updateUI() {
        if (this.scoreEl) this.scoreEl.textContent = `Score: ${this.ship.score}`;
        if (this.livesEl) this.livesEl.textContent = `Lives: ${this.ship.lives}`;
    }

    _gameOver() {
        this._stopAllSounds();

        this.menuMusic.play();
        // parar timer
        this.running = false;
        this.gameTimer.stop();
        this._updateUI();   
        
        const perdedor = document.getElementById('perdedor');
        const ganador = document.getElementById('ganador');
        if (this.ship.lives === 0) {
            const miDiv = document.getElementById('miDivPer');
            miDiv.innerHTML = `<p>Juego terminado. Puntaje: ${this.ship.score}</p>`;
            this.pantallaJuego.style.display = 'none';
            perdedor.style.display = 'flex';
            document.getElementById('btn-volver-per')?.addEventListener('click', () => {
                this.optionMusic.pause();
                this.optionMusic.currentTime = 0;
                this.optionMusic.play();
                perdedor.style.display = 'none';
                this.pantallaMenu.style.display = 'flex';
            });
        } else {
            const miDiv = document.getElementById('miDivGa');
            miDiv.innerHTML = `<p>Ganaste! Puntaje: ${this.ship.score}</p>`;
            this.pantallaJuego.style.display = 'none';
            ganador.style.display = 'flex';
            document.getElementById('btn-volver-ga')?.addEventListener('click', () => {
                this.optionMusic.pause();
                this.optionMusic.currentTime = 0;
                this.optionMusic.play();
                ganador.style.display = 'none';
                this.pantallaMenu.style.display = 'flex';
            });
        }
    }

    onTimeUp() {
        this.running = false;
        this._gameOver();
    }
}

/* --------- Inicialización (reemplaza la creación anterior) --------- */
let currentGame = null;

document.addEventListener('DOMContentLoaded', () => {
    currentGame = new SpaceGame();

    const btnPlay = document.getElementById('btn-play');

    btnPlay.addEventListener('click', () => {
        const pantallaJuegoActivo = document.getElementById('pantalla-juego-principal');
        pantallaJuegoActivo.style.display = 'flex';

        // reproducir música del menú
        currentGame.menuMusic.play().catch(() => {
            console.log("Requiere interacción del usuario para reproducir música");
        });
    });

    const btnJugarSolo = document.getElementById('solo');
    btnJugarSolo?.addEventListener('click', () => {
        // ocultar menú
        document.getElementById('pantalla-juego-principal').style.display = 'none';
        document.getElementById('juego-pantalla').style.display = 'flex';

        // pausa música del menú
        currentGame.menuMusic.pause();
        currentGame.menuMusic.currentTime = 0;

        // reproducir música del juego
        currentGame.gameMusic.play();

        currentGame.start();
    });
});

