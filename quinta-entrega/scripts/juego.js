// ---------- Reemplazo: Juego de Nave (Flappy + Shooter) ----------

/* --------- Assets --------- */
class GameAssets {
    constructor() {
        this.images = {};
        this.urls = {
            bg_far: "https://i.postimg.cc/fTnR2R3V/bg-far.jpg",       // capa 4 (más lejos)
            bg_mid2: "https://i.postimg.cc/Fs5HWHfj/bg-mid3.png",     // capa 3
            bg_mid1: "https://i.postimg.cc/pXbLGL9p/bg-mid2.png",     // capa 2
            bg_front: "https://i.postimg.cc/s2Q9kJ6y/bg_front.png",   // capa 1 (más cerca)
            ship_sprites: "https://i.postimg.cc/qMVvbvtt/ship-sprites.png", // sprite: flame frames + ship
            explosion_sprites: "https://i.postimg.cc/7P6kTQ2v/explosion.png",
            enemy_sprite: "https://i.postimg.cc/9f2t1K6n/enemy.png",
            cloud_sprite: "https://i.postimg.cc/W4sYv3gF/cloud.png",
            bonus_sprite: "https://i.postimg.cc/ZR6yqk4v/bonus.png"
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
    constructor(img, speed) {
        this.img = img;
        this.speed = speed;
        this.x = 0;
    }
    update(dt, playerSpeed) {
        // avanza relativo al jugador
        this.x -= this.speed * playerSpeed * dt;
        // loop
        if (this.img) {
            const w = this.img.width;
            if (this.x <= -w) this.x += w;
            if (this.x >= w) this.x -= w;
        }
    }
    draw(ctx, canvas) {
        if (!this.img) {
            // fondo de respaldo
            ctx.fillStyle = "#87CEEB";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            return;
        }
        const w = this.img.width;
        let startX = Math.floor(this.x);
        // dibujar suficientes veces para cubrir pantalla
        for (let sx = startX; sx < canvas.width; sx += w) {
            ctx.drawImage(this.img, sx, 0, w, canvas.height);
        }
        // también una imagen a la izquierda por si queda espacio
        for (let sx = startX - w; sx > -w; sx -= w) {
            ctx.drawImage(this.img, sx, 0, w, canvas.height);
        }
    }
}

/* --------- Ship (jugador) --------- */
class Ship {
    constructor(imgSprites) {
        this.sprite = imgSprites; // spritesheet
        this.x = 120;
        this.y = 200;
        this.vy = 0;
        this.width = 64;
        this.height = 48;
        this.gravity = 1200; // px/s^2
        this.flapStrength = -420; // impulso
        this.maxFallSpeed = 800;
        this.alive = true;
        this.lives = 3;
        this.score = 0;

        // animación de propulsores (supongamos 4 frames horizontales)
        this.flameFrames = 4;
        this.flameFrameTime = 0.06;
        this.flameTimer = 0;
        this.flameIndex = 0;

        // explosión state
        this.exploding = false;
        this.explosionTimer = 0;
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

        // límites pantalla
        if (this.y < 10) { this.y = 10; this.vy = 0; }
        // anim flame
        this.flameTimer += dt;
        if (this.flameTimer >= this.flameFrameTime) {
            this.flameTimer -= this.flameFrameTime;
            this.flameIndex = (this.flameIndex + 1) % this.flameFrames;
        }
    }

    draw(ctx) {
        if (this.exploding) {
            // no dibujar nave, explosion manejada por Game.explosionDraw
            return;
        }
        if (this.sprite) {
            // suponemos: sprite ancho = (flameFrames + 1) * frameW
            const frameW = this.sprite.width / (this.flameFrames + 1);
            const frameH = this.sprite.height;
            // dibujar nave (último frame)
            const shipFrameIndex = this.flameFrames; // último frame es la nave quieta
            ctx.drawImage(this.sprite, shipFrameIndex * frameW, 0, frameW, frameH,
                          this.x - this.width/2, this.y - this.height/2, this.width, this.height);
            // dibujar flame debajo si está flap (si vy < 0 o se acaba de flapear)
            if (this.vy < 0 || this.flameIndex !== 0) {
                const fx = this.flameIndex * frameW;
                ctx.drawImage(this.sprite, fx, 0, frameW, frameH,
                              this.x - this.width/2 - 6, this.y - this.height/2 + 10, this.width * 0.9, this.height * 0.9);
            }
        } else {
            // fallback: rectángulo
            ctx.fillStyle = "#FFD700";
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        }
    }

    getBounds() {
        return { x: this.x - this.width/2, y: this.y - this.height/2, w: this.width, h: this.height };
    }

    hit() {
        this.lives--;
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
        // update existing
        for (const o of this.obstacles) o.update(dt, this.speedMultiplier);
        // limpiar fuera de pantalla o muertos
        this.obstacles = this.obstacles.filter(o => (o.x + o.w > -50) && !o.dead);
    }

    _spawnPair() {
        const gap = 140; // gap vertical
        const minH = 60;
        const maxH = this.canvas.height - gap - 120;
        const topH = minH + Math.random() * (maxH - minH);
        const pipeW = 72;
        // top pipe
        this.obstacles.push(new Obstacle(this.canvas.width + 40, 0, pipeW, topH, "pipe"));
        // bottom pipe
        this.obstacles.push(new Obstacle(this.canvas.width + 40, topH + gap, pipeW, this.canvas.height - (topH + gap), "pipe"));
        // small chance spawn enemy
        if (Math.random() < 0.3) {
            const ey = 40 + Math.random() * (this.canvas.height - 80);
            this.obstacles.push(new Obstacle(this.canvas.width + 120, ey, 48, 36, "enemy"));
        }
        // small chance bonus
        if (Math.random() < 0.2) {
            const by = 40 + Math.random() * (this.canvas.height - 80);
            this.obstacles.push(new Obstacle(this.canvas.width + 200, by, 36, 36, "bonus"));
        }
    }

    draw(ctx) {
        for (const o of this.obstacles) o.draw(ctx, this.assets);
    }

    checkCollisions(ship) {
        const s = ship.getBounds();
        for (const o of this.obstacles) {
            const b = o.getBounds();
            if (this._intersectRect(s, b)) {
                return o;
            }
        }
        return null;
    }

    _intersectRect(a, b) {
        return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
    }

    shoot(x, y) {
        // simple: buscar primer obstáculo en línea de tiro y marcar dead
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

        // botón disparo (puede estar en HTML)
        this.btnShoot = document.getElementById('btn-shoot');

        this.assets = new GameAssets();
        this.layers = [];
        this.ship = null;
        this.obManager = null;

        // control
        this.lastTime = 0;
        this.running = false;

        // UI scoreboard
        this.scoreEl = document.getElementById('score') || null;
        this.livesEl = document.getElementById('lives') || null;

        // tiempo (si querés mantener GameTimer)
        this.gameTimer = new GameTimer(this.timerEl, 120, this.onTimeUp.bind(this));

        this._bindUI();
        this._bindInput();
    }

    _bindUI() {
        this.btnReiniciar?.addEventListener('click', () => this.start());
        this.btnSalir?.addEventListener('click', () => {
            this.stop();
            this.pantallaJuego.style.display = 'none';
            this.pantallaMenu.style.display = 'flex';
        });
        this.btnShoot?.addEventListener('click', () => {
            this._shoot();
        });
    }

    _bindInput() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') { e.preventDefault(); this._flap(); }
            if (e.code === 'KeyF') this._shoot();
        });
        // click / touch to flap
        this.canvas.addEventListener('mousedown', (e) => { this._flap(); });
        this.canvas.addEventListener('touchstart', (e) => { this._flap(); });
    }

    async start() {
        await this.assets.preloadAll();
        this._setupWorld();
        this.gameTimer.start();
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this._loop.bind(this));
    }

    stop() {
        this.running = false;
        this.gameTimer.stop();
    }

    _setupWorld() {
        // dimensionar canvas
        const ratio = window.devicePixelRatio || 1;
        const w = 800;
        const h = 480;
        this.canvas.style.width = w + "px";
        this.canvas.style.height = h + "px";
        this.canvas.width = Math.floor(w * ratio);
        this.canvas.height = Math.floor(h * ratio);
        this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

        // parallax 4 capas (más lejos -> más lento)
        this.layers = [
            new ParallaxLayer(this.assets.images.bg_far, 0.15),
            new ParallaxLayer(this.assets.images.bg_mid2, 0.4),
            new ParallaxLayer(this.assets.images.bg_mid1, 0.75),
            new ParallaxLayer(this.assets.images.bg_front, 1.2)
        ];

        this.ship = new Ship(this.assets.images.ship_sprites);
        this.obManager = new ObstacleManager(this.canvas, this.assets);

        // UI
        if (this.scoreEl) this.scoreEl.textContent = `Score: 0`;
        if (this.livesEl) this.livesEl.textContent = `Lives: ${this.ship.lives}`;
    }

    _loop(ts) {
        if (!this.running) return;
        const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
        this.lastTime = ts;

        // update world
        const playerSpeed = 1; // factor
        this.layers.forEach(l => l.update(dt, playerSpeed));
        this.ship.update(dt);
        this.obManager.update(dt);

        // colisiones
        const hitObs = this.obManager.checkCollisions(this.ship);
        if (hitObs) {
            if (hitObs.type === "bonus") {
                hitObs.dead = true;
                this.ship.score += 10;
            } else {
                // daño
                hitObs.dead = true;
                this.ship.hit();
            }
            this._updateUI();
        }

        // update puntuación por pasar obstáculos (simple heuristic)
        for (const o of this.obManager.obstacles) {
            if (!o._scored && o.x + o.w < this.ship.x) {
                o._scored = true;
                if (o.type === "pipe") this.ship.score += 1;
            }
        }

        // limpiar explosion y terminar si muerto
        if (this.ship.exploding) {
            this.ship.explosionTimer += dt;
            if (this.ship.explosionTimer > 1.2) {
                // Game over
                this.running = false;
                this._gameOver();
                return;
            }
        }

        // draw
        this._draw();

        // win/lose timeouts
        if (this.gameTimer.getRemaining() <= 0) {
            this.running = false;
            this._gameOver();
            return;
        }

        requestAnimationFrame(this._loop.bind(this));
    }

    _draw() {
        // limpiar
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // dibujar parallax
        for (const l of this.layers) l.draw(this.ctx, this.canvas);

        // dibujar obstáculos
        this.obManager.draw(this.ctx);

        // dibujar objetos animados extra (nubes)
        const cloud = this.assets.images.cloud_sprite;
        if (cloud) {
            // mostrar algunas nubes
            this.ctx.globalAlpha = 0.8;
            this.ctx.drawImage(cloud, (this.layers[1].x % this.canvas.width + 200) % this.canvas.width, 40, 120, 48);
            this.ctx.globalAlpha = 1;
        }

        // dibujar nave
        this.ship.draw(this.ctx);

        // dibujar explosion si corresponde
        if (this.ship.exploding && this.assets.images.explosion_sprites) {
            const exp = this.assets.images.explosion_sprites;
            const frames = 6;
            const t = this.ship.explosionTimer;
            const idx = Math.floor((t / 1.2) * frames);
            const fw = exp.width / frames;
            const fh = exp.height;
            this.ctx.drawImage(exp, Math.min(idx, frames-1) * fw, 0, fw, fh,
                               this.ship.x - 48, this.ship.y - 48, 96, 96);
        }

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
        // efecto visual rápido (línea) y llamar manager
        const sx = this.ship.x + 30;
        const sy = this.ship.y;
        const success = this.obManager.shoot(sx, sy);
        if (success) {
            // sumar puntaje por destruir
            this.ship.score += 2;
            this._flashShot(sx, sy);
            this._updateUI();
        }
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
        // parar timer
        this.gameTimer.stop();
        // mostrar pantalla perdida (reusar tus nodos de gan/lose si existen)
        const perdedor = document.getElementById('perdedor');
        const ganador = document.getElementById('ganador');
        if (perdedor) {
            const miDiv = document.getElementById('miDivPer');
            miDiv.innerHTML = `<p>Juego terminado. Puntaje: ${this.ship.score}</p>`;
            this.pantallaJuego.style.display = 'none';
            perdedor.style.display = 'flex';
            document.getElementById('btn-volver-per')?.addEventListener('click', () => {
                perdedor.style.display = 'none';
                this.pantallaMenu.style.display = 'flex';
            });
        } else {
            alert(`Juego terminado. Puntaje: ${this.ship.score}`);
            this.pantallaMenu.style.display = 'flex';
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
    // si ya tenías lógica de selección de personaje: la ignoramos aquí.
    currentGame = new SpaceGame();

    // arrancar desde tu botón "Play"
    const btnPlay = document.getElementById('btn-play');
    btnPlay?.addEventListener('click', () => {
        document.getElementById('pantalla-juego')?.style.display = 'none';
        document.getElementById('pantalla-juego-principal')?.style.display = 'none';
        document.getElementById('juego-pantalla')?.style.display = 'flex';
        currentGame.start();
    });
});
