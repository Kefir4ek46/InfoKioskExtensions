/* plugins/snake/view.js — классическая «Змейка» с D-pad и свайпами.
 *
 * Управление:
 *   - D-pad (крестовина) на экране
 *   - Свайпы по canvas
 *   - Стрелки/WASD на клавиатуре
 * Рекорд сохраняется в localStorage + таблица рекордов.
 */
window.KioskViews = window.KioskViews || {};

window.KioskViews['snake'] = (() => {
  'use strict';

  function getSettings() {
    const s = (window.KioskPlugins && window.KioskPlugins.snake
      ? window.KioskPlugins.snake.settings : {}) || {};
    return {
      speed: Number(s.speed) || 150,
      fieldSize: parseInt(s.fieldSize, 10) || 20
    };
  }

  let game = null;
  let timer = null;
  let canvas, ctx;
  let cellSize = 20;
  let dpad = null;

  function initState() {
    const cfg = getSettings();
    return {
      snake: [{ x: Math.floor(cfg.fieldSize / 2), y: Math.floor(cfg.fieldSize / 2) }],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: null,
      score: 0,
      gameOver: false,
      paused: false,
      speed: cfg.speed,
      fieldSize: cfg.fieldSize,
      started: false
    };
  }

  function spawnFood() {
    const occupied = new Set(game.snake.map(s => `${s.x},${s.y}`));
    const free = [];
    for (let x = 0; x < game.fieldSize; x++) {
      for (let y = 0; y < game.fieldSize; y++) {
        if (!occupied.has(`${x},${y}`)) free.push({ x, y });
      }
    }
    if (!free.length) {
      game.gameOver = true;
      return null;
    }
    return free[Math.floor(Math.random() * free.length)];
  }

  // Обработка направления от D-pad, свайпа или клавиатуры.
  // dir: 'up' | 'down' | 'left' | 'right'
  function handleDirection(dir) {
    if (!game || game.gameOver || game.paused) return;
    const cur = game.dir;
    if (dir === 'up' && cur.y !== 1)         game.nextDir = { x: 0, y: -1 };
    else if (dir === 'down' && cur.y !== -1) game.nextDir = { x: 0, y: 1 };
    else if (dir === 'left' && cur.x !== 1)  game.nextDir = { x: -1, y: 0 };
    else if (dir === 'right' && cur.x !== -1) game.nextDir = { x: 1, y: 0 };
  }

  function step() {
    if (!game || game.gameOver || game.paused) return;
    if (game.nextDir.x !== -game.dir.x || game.nextDir.y !== -game.dir.y) {
      game.dir = game.nextDir;
    }
    const head = game.snake[0];
    const newHead = { x: head.x + game.dir.x, y: head.y + game.dir.y };
    if (newHead.x < 0 || newHead.x >= game.fieldSize ||
        newHead.y < 0 || newHead.y >= game.fieldSize) {
      game.gameOver = true;
      onGameOver();
      return;
    }
    if (game.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      game.gameOver = true;
      onGameOver();
      return;
    }
    game.snake.unshift(newHead);
    if (game.food && newHead.x === game.food.x && newHead.y === game.food.y) {
      game.score += 10;
      game.food = spawnFood();
      if (game.score % 50 === 0 && game.speed > 60) {
        game.speed = Math.max(60, game.speed - 10);
        restartTimer();
      }
    } else {
      game.snake.pop();
    }
    draw();
    updateScore();
  }

  function restartTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(step, game.speed);
  }

  function draw() {
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#0f131c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(58, 159, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= game.fieldSize; i++) {
      const p = i * cellSize;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(w, p); ctx.stroke();
    }
    if (game.food) {
      ctx.fillStyle = '#ff6b6b';
      const fx = game.food.x * cellSize, fy = game.food.y * cellSize;
      ctx.beginPath();
      ctx.arc(fx + cellSize / 2, fy + cellSize / 2, cellSize / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    }
    game.snake.forEach((s, i) => {
      if (i === 0) ctx.fillStyle = '#4caf50';
      else {
        const alpha = Math.max(0.4, 1 - i * 0.03);
        ctx.fillStyle = `rgba(76, 175, 80, ${alpha})`;
      }
      ctx.fillRect(s.x * cellSize + 1, s.y * cellSize + 1, cellSize - 2, cellSize - 2);
    });
  }

  function updateScore() {
    const scoreEl = document.getElementById('snake-score');
    if (scoreEl) scoreEl.textContent = String(game.score);
    const highEl = document.getElementById('snake-high');
    if (highEl) {
      const high = parseInt(localStorage.getItem('snake-high-score') || '0', 10);
      highEl.textContent = String(high);
    }
  }

  function onGameOver() {
    if (timer) clearInterval(timer);
    timer = null;
    const high = parseInt(localStorage.getItem('snake-high-score') || '0', 10);
    if (game.score > high) localStorage.setItem('snake-high-score', String(game.score));
    const overlay = document.getElementById('snake-overlay');
    if (overlay) {
      overlay.style.display = '';
      const msg = document.getElementById('snake-overlay-msg');
      if (msg) msg.textContent = `Игра окончена! Счёт: ${game.score}`;
    }
    draw();
    updateScore();
    if (game.score > 0 && window.Leaderboard) {
      setTimeout(() => {
        window.Leaderboard.open('snake', {
          title: '🐍 Змейка — Таблица рекордов',
          score: game.score
        });
      }, 600);
    }
  }

  function startGame() {
    game = initState();
    game.food = spawnFood();
    game.started = true;
    const overlay = document.getElementById('snake-overlay');
    if (overlay) overlay.style.display = 'none';
    const maxSize = Math.min(window.innerWidth - 80, window.innerHeight - 380, 500);
    cellSize = Math.floor(maxSize / game.fieldSize);
    canvas.width = cellSize * game.fieldSize;
    canvas.height = cellSize * game.fieldSize;
    draw();
    updateScore();
    restartTimer();
  }

  function togglePause() {
    if (!game || game.gameOver) return;
    game.paused = !game.paused;
    const overlay = document.getElementById('snake-overlay');
    if (overlay) {
      overlay.style.display = game.paused ? '' : 'none';
      const msg = document.getElementById('snake-overlay-msg');
      if (msg && game.paused) msg.textContent = 'Пауза';
    }
  }

  // Свайпы по canvas.
  let touchStart = null;
  function onTouchStart(e) {
    if (e.touches.length === 1) {
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }
  function onTouchEnd(e) {
    if (!touchStart || !game) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 30) return;
    if (absDx > absDy) handleDirection(dx > 0 ? 'right' : 'left');
    else handleDirection(dy > 0 ? 'down' : 'up');
    touchStart = null;
  }

  function render($el) {
    const high = parseInt(localStorage.getItem('snake-high-score') || '0', 10);
    $el.innerHTML = `
      <div class="view">
        <div class="view-header">
          <div>
            <div class="view-title">🐍 Змейка</div>
            <div class="view-subtitle">Управление: крестовина, свайпы или стрелки</div>
          </div>
        </div>
        <div class="snake-game-layout">
          <div class="snake-game-left">
            <div class="snake-stats">
              <div class="snake-stat"><span>Счёт:</span> <strong id="snake-score">0</strong></div>
              <div class="snake-stat"><span>Рекорд:</span> <strong id="snake-high">${high}</strong></div>
            </div>
            <div class="snake-canvas-wrap">
              <canvas id="snake-canvas" width="400" height="400"></canvas>
              <div class="snake-overlay" id="snake-overlay">
                <div class="snake-overlay-content">
                  <div class="snake-overlay-msg" id="snake-overlay-msg">Нажмите «Старт», чтобы начать</div>
                  <button class="snake-start-btn" id="snake-start-btn">▶ Старт</button>
                </div>
              </div>
            </div>
          </div>
          <div class="snake-game-right">
            <div id="snake-dpad"></div>
            <div class="snake-controls">
              <button class="header-btn" id="snake-pause-btn" style="width:auto;padding:8px 16px;">⏸ Пауза</button>
              <button class="header-btn" id="snake-restart-btn" style="width:auto;padding:8px 16px;">🔄 Заново</button>
              <button class="header-btn" id="snake-leaderboard-btn" style="width:auto;padding:8px 16px;">🏆</button>
            </div>
          </div>
        </div>
      </div>
    `;

    canvas = document.getElementById('snake-canvas');
    ctx = canvas.getContext('2d');

    // D-pad.
    dpad = new window.DPad({
      container: document.getElementById('snake-dpad'),
      onDirection: handleDirection,
      size: 180
    });
    dpad.mount();
    dpad.enableKeyboard();

    // Стартовая отрисовка пустого поля.
    const cfg = getSettings();
    const maxSize = Math.min(window.innerWidth - 80, window.innerHeight - 380, 500);
    cellSize = Math.floor(maxSize / cfg.fieldSize);
    canvas.width = cellSize * cfg.fieldSize;
    canvas.height = cellSize * cfg.fieldSize;
    if (!game) game = initState();
    draw();

    document.getElementById('snake-start-btn')?.addEventListener('click', startGame);
    document.getElementById('snake-pause-btn')?.addEventListener('click', togglePause);
    document.getElementById('snake-restart-btn')?.addEventListener('click', startGame);
    document.getElementById('snake-leaderboard-btn')?.addEventListener('click', () => {
      if (window.Leaderboard) window.Leaderboard.open('snake', { title: '🐍 Змейка — Таблица рекордов' });
    });

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  return {
    async mount($el) { render($el); },
    unmount() {
      if (timer) clearInterval(timer);
      timer = null;
      if (dpad) dpad.destroy();
      dpad = null;
      game = null;
    }
  };
})();
