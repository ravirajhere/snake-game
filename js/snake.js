/* ==========================================================================
   SNAKE — NOKIA EDITION
   Vanilla JS · Canvas · No frameworks
   Handles: game loop · input (keyboard + touch) · scoring · sound · pause
   ========================================================================== */

(function () {
    'use strict';

    /* ======================================================================
       1. CONSTANTS
       ====================================================================== */
    var GRID = 20;               // 20x20 cells
    var CELL = 20;               // 20px per cell
    var CANVAS_SIZE = GRID * CELL;
    var MIN_SPEED = 60;
    var MAX_SPEED = 200;
    var SPEED_STEP = 5;          // speed up every 5 points
    var START_LENGTH = 3;

    var COLORS = {
        lcd: '#9bbc0f',
        lcdDark: '#8bac0f',
        pixel: '#0f380f',
        pixelSoft: '#306230',
        food: '#0f380f',
        foodAccent: '#306230'
    };

    /* ======================================================================
       2. STATE
       ====================================================================== */
    var state = {
        snake: [],
        dir: { x: 1, y: 0 },
        nextDir: { x: 1, y: 0 },
        food: { x: 0, y: 0 },
        score: 0,
        highScore: 0,
        level: 1,
        speed: 120,
        baseSpeed: 120,
        running: false,
        paused: false,
        gameOver: false,
        lastTick: 0,
        accumulator: 0,
        flashUntil: 0
    };

    /* ======================================================================
       3. DOM
       ====================================================================== */
    var canvas = document.getElementById('gameCanvas');
    var ctx = canvas.getContext('2d');
    var scoreEl = document.getElementById('score');
    var highScoreEl = document.getElementById('highScore');
    var levelEl = document.getElementById('level');
    var startOverlay = document.getElementById('startOverlay');
    var pauseOverlay = document.getElementById('pauseOverlay');
    var gameOverOverlay = document.getElementById('gameOverOverlay');
    var finalScoreEl = document.getElementById('finalScore');
    var finalBestEl = document.getElementById('finalBest');
    var startBtn = document.getElementById('startBtn');
    var resumeBtn = document.getElementById('resumeBtn');
    var restartBtn = document.getElementById('restartBtn');
    var diffBtns = document.querySelectorAll('.diff-btn');
    var touchControls = document.getElementById('touchControls');

    /* Set canvas size to match grid exactly */
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    /* ======================================================================
       4. STORAGE
       ====================================================================== */
    function loadHighScore() {
        try {
            var v = localStorage.getItem('snake-high-score');
            return v ? parseInt(v, 10) : 0;
        } catch (e) {
            return 0;
        }
    }

    function saveHighScore(v) {
        try {
            localStorage.setItem('snake-high-score', String(v));
        } catch (e) {}
    }

    state.highScore = loadHighScore();

    /* ======================================================================
       5. SOUND (Web Audio API)
       ====================================================================== */
    var audioCtx = null;

    function initAudio() {
        if (audioCtx) return;
        try {
            var Ctx = window.AudioContext || window.webkitAudioContext;
            if (Ctx) audioCtx = new Ctx();
        } catch (e) {}
    }

    function beep(freq, duration, type) {
        if (!audioCtx) return;
        try {
            var osc = audioCtx.createOscillator();
            var gain = audioCtx.createGain();
            osc.type = type || 'square';
            osc.frequency.value = freq;
            gain.gain.value = 0.04;
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            var now = audioCtx.currentTime;
            osc.start(now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);
            osc.stop(now + duration / 1000);
        } catch (e) {}
    }

    function soundEat() {
        beep(880, 60, 'square');
    }

    function soundGameOver() {
        beep(220, 200, 'square');
        setTimeout(function () { beep(165, 300, 'square'); }, 120);
    }

    function soundLevelUp() {
        beep(660, 40, 'square');
        setTimeout(function () { beep(880, 40, 'square'); }, 60);
        setTimeout(function () { beep(1100, 80, 'square'); }, 120);
    }

    /* ======================================================================
       6. GAME LOGIC
       ====================================================================== */
    function resetGame() {
        state.snake = [];
        var startX = Math.floor(GRID / 2) - Math.floor(START_LENGTH / 2);
        var startY = Math.floor(GRID / 2);
        for (var i = 0; i < START_LENGTH; i++) {
            state.snake.push({ x: startX + i, y: startY });
        }
        state.dir = { x: 1, y: 0 };
        state.nextDir = { x: 1, y: 0 };
        state.score = 0;
        state.level = 1;
        state.speed = state.baseSpeed;
        state.running = false;
        state.paused = false;
        state.gameOver = false;
        state.accumulator = 0;
        state.lastTick = 0;
        spawnFood();
        updateHUD();
    }

    function spawnFood() {
        var attempts = 0;
        while (attempts < 500) {
            var fx = Math.floor(Math.random() * GRID);
            var fy = Math.floor(Math.random() * GRID);
            if (!isSnakeAt(fx, fy)) {
                state.food = { x: fx, y: fy };
                return;
            }
            attempts++;
        }
        // Fallback: scan grid
        for (var y = 0; y < GRID; y++) {
            for (var x = 0; x < GRID; x++) {
                if (!isSnakeAt(x, y)) {
                    state.food = { x: x, y: y };
                    return;
                }
            }
        }
    }

    function isSnakeAt(x, y) {
        for (var i = 0; i < state.snake.length; i++) {
            if (state.snake[i].x === x && state.snake[i].y === y) return true;
        }
        return false;
    }

    function update(dt) {
        if (!state.running || state.paused || state.gameOver) return;

        state.accumulator += dt;
        if (state.accumulator < state.speed) return;
        state.accumulator = 0;

        // Apply queued direction
        state.dir = state.nextDir;

        var head = state.snake[state.snake.length - 1];
        var newHead = { x: head.x + state.dir.x, y: head.y + state.dir.y };

        // Wall collision
        if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
            endGame();
            return;
        }

        // Self collision (ignore tail since it will move)
        for (var i = 0; i < state.snake.length - 1; i++) {
            if (state.snake[i].x === newHead.x && state.snake[i].y === newHead.y) {
                endGame();
                return;
            }
        }

        // Move
        state.snake.push(newHead);

        // Eat
        if (newHead.x === state.food.x && newHead.y === state.food.y) {
            state.score++;
            soundEat();
            bumpScore();
            spawnFood();

            // Speed up every SPEED_STEP points
            if (state.score % SPEED_STEP === 0) {
                var newSpeed = Math.max(MIN_SPEED, state.speed - 10);
                if (newSpeed !== state.speed) {
                    state.speed = newSpeed;
                    state.level++;
                    soundLevelUp();
                }
            }
            updateHUD();
        } else {
            state.snake.shift();
        }
    }

    function endGame() {
        state.running = false;
        state.gameOver = true;
        soundGameOver();

        var isNewBest = state.score > state.highScore;
        if (isNewBest) {
            state.highScore = state.score;
            saveHighScore(state.highScore);
        }

        finalScoreEl.textContent = String(state.score);
        if (isNewBest) {
            finalBestEl.textContent = '★ NEW BEST!';
            finalBestEl.classList.add('is-new');
        } else {
            finalBestEl.textContent = 'Best: ' + state.highScore;
            finalBestEl.classList.remove('is-new');
        }

        gameOverOverlay.hidden = false;
        updateHUD();
    }

    function updateHUD() {
        scoreEl.textContent = String(state.score);
        highScoreEl.textContent = String(state.highScore);
        levelEl.textContent = String(state.level);
    }

    function bumpScore() {
        scoreEl.classList.remove('is-bump');
        void scoreEl.offsetWidth;
        scoreEl.classList.add('is-bump');
    }

    /* ======================================================================
       7. RENDER
       ====================================================================== */
    function render() {
        // Background
        ctx.fillStyle = COLORS.lcd;
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Subtle grid
        ctx.strokeStyle = 'rgba(15, 56, 15, 0.08)';
        ctx.lineWidth = 1;
        for (var i = 0; i <= GRID; i++) {
            var p = i * CELL + 0.5;
            ctx.beginPath();
            ctx.moveTo(p, 0);
            ctx.lineTo(p, CANVAS_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, p);
            ctx.lineTo(CANVAS_SIZE, p);
            ctx.stroke();
        }

        // Snake body
        for (var s = 0; s < state.snake.length; s++) {
            var seg = state.snake[s];
            var isHead = s === state.snake.length - 1;
            ctx.fillStyle = isHead ? COLORS.pixel : COLORS.pixelSoft;
            ctx.fillRect(
                seg.x * CELL + 1,
                seg.y * CELL + 1,
                CELL - 2,
                CELL - 2
            );
            if (isHead) {
                // Head "eye" pixel
                ctx.fillStyle = COLORS.lcd;
                var eyeSize = Math.max(2, Math.floor(CELL / 6));
                ctx.fillRect(
                    seg.x * CELL + CELL - eyeSize - 2,
                    seg.y * CELL + eyeSize,
                    eyeSize,
                    eyeSize
                );
            }
        }

        // Food (apple as 4-pixel cross)
        var fx = state.food.x * CELL;
        var fy = state.food.y * CELL;
        ctx.fillStyle = COLORS.pixel;
        var pad = 3;
        var size = CELL - pad * 2;
        // Center block
        ctx.fillRect(fx + pad, fy + pad, size, size);
        // Inner highlight
        ctx.fillStyle = COLORS.lcd;
        ctx.fillRect(fx + pad + 2, fy + pad + 2, size - 4, size - 4);
        // Center dot
        ctx.fillStyle = COLORS.pixel;
        ctx.fillRect(fx + Math.floor(CELL / 2) - 2, fy + Math.floor(CELL / 2) - 2, 4, 4);
    }

    /* ======================================================================
       8. GAME LOOP
       ====================================================================== */
    function loop(timestamp) {
        if (!state.lastTick) state.lastTick = timestamp;
        var dt = timestamp - state.lastTick;
        state.lastTick = timestamp;

        update(dt);
        render();

        requestAnimationFrame(loop);
    }

    /* ======================================================================
       9. INPUT — KEYBOARD
       ====================================================================== */
    var KEY_MAP = {
        'ArrowUp':    { x: 0, y: -1 },
        'ArrowDown':  { x: 0, y: 1 },
        'ArrowLeft':  { x: -1, y: 0 },
        'ArrowRight': { x: 1, y: 0 },
        'w':          { x: 0, y: -1 },
        'W':          { x: 0, y: -1 },
        's':          { x: 0, y: 1 },
        'S':          { x: 0, y: 1 },
        'a':          { x: -1, y: 0 },
        'A':          { x: -1, y: 0 },
        'd':          { x: 1, y: 0 },
        'D':          { x: 1, y: 0 }
    };

    function setDirection(dir) {
        if (!dir) return;
        // Prevent reversing into self
        if (dir.x === -state.dir.x && dir.y === -state.dir.y) return;
        state.nextDir = dir;
    }

    document.addEventListener('keydown', function (e) {
        // Pause
        if (e.key === ' ' || e.key === 'Escape') {
            e.preventDefault();
            if (state.running && !state.gameOver) togglePause();
            return;
        }
        // Restart
        if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            if (state.gameOver) startGame();
            return;
        }
        // Start
        if (e.key === 'Enter') {
            if (!state.running && !state.gameOver) {
                e.preventDefault();
                startGame();
                return;
            }
            if (state.gameOver) {
                e.preventDefault();
                startGame();
                return;
            }
        }

        var dir = KEY_MAP[e.key];
        if (dir) {
            e.preventDefault();
            setDirection(dir);
        }
    });

    /* ======================================================================
       10. INPUT — TOUCH (swipe + dpad)
       ====================================================================== */
    var touchStart = null;
    var SWIPE_THRESHOLD = 24;

    canvas.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1) return;
        var t = e.touches[0];
        touchStart = { x: t.clientX, y: t.clientY };
    }, { passive: true });

    canvas.addEventListener('touchmove', function (e) {
        if (!touchStart || e.touches.length !== 1) return;
        e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', function (e) {
        if (!touchStart) return;
        var t = e.changedTouches[0];
        var dx = t.clientX - touchStart.x;
        var dy = t.clientY - touchStart.y;
        var absX = Math.abs(dx);
        var absY = Math.abs(dy);

        if (Math.max(absX, absY) < SWIPE_THRESHOLD) {
            touchStart = null;
            return;
        }

        if (absX > absY) {
            setDirection(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
        } else {
            setDirection(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
        }
        touchStart = null;
    }, { passive: true });

    // D-pad buttons
    if (touchControls) {
        touchControls.addEventListener('click', function (e) {
            var btn = e.target.closest('.dpad-btn');
            if (!btn) return;
            var dir = btn.getAttribute('data-dir');
            var map = {
                up:    { x: 0, y: -1 },
                down:  { x: 0, y: 1 },
                left:  { x: -1, y: 0 },
                right: { x: 1, y: 0 }
            };
            setDirection(map[dir]);
        });

        // Prevent double-tap zoom on dpad
        touchControls.addEventListener('touchstart', function (e) {
            if (e.target.closest('.dpad-btn')) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    /* ======================================================================
       11. CONTROLS — START / PAUSE / RESTART
       ====================================================================== */
    function startGame() {
        initAudio();
        resetGame();
        state.running = true;
        startOverlay.hidden = true;
        pauseOverlay.hidden = true;
        gameOverOverlay.hidden = true;
        diffBtns.forEach(function (b) { b.disabled = true; });
    }

    function togglePause() {
        if (!state.running || state.gameOver) return;
        state.paused = !state.paused;
        pauseOverlay.hidden = !state.paused;
    }

    if (startBtn) startBtn.addEventListener('click', startGame);
    if (resumeBtn) resumeBtn.addEventListener('click', function () {
        state.paused = false;
        pauseOverlay.hidden = true;
    });
    if (restartBtn) restartBtn.addEventListener('click', startGame);

    diffBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (state.running) return;
            var speed = parseInt(btn.getAttribute('data-speed'), 10);
            if (!speed) return;
            state.baseSpeed = speed;
            state.speed = speed;
            diffBtns.forEach(function (b) { b.classList.remove('is-active'); });
            btn.classList.add('is-active');
        });
    });

    /* ======================================================================
       12. VISIBILITY — auto-pause on tab switch
       ====================================================================== */
    document.addEventListener('visibilitychange', function () {
        if (document.hidden && state.running && !state.paused && !state.gameOver) {
            state.paused = true;
            pauseOverlay.hidden = false;
        }
    });

    /* ======================================================================
       13. INIT
       ====================================================================== */
    resetGame();
    render();
    requestAnimationFrame(loop);

    console.log('🐍 Snake loaded — press ENTER or tap START to play');

})();
