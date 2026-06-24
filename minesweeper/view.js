/* plugins/minesweeper/view.js — классический сапёр.
 *
 * Управление:
 *   - Тап/клик по клетке — открыть
 *   - Длинный тап / правый клик — поставить флажок
 * Счёт = (открыто клеток) × 10. Рекорд по счёту.
 */
window.KioskViews = window.KioskViews || {};

window.KioskViews['minesweeper'] = (() => {
  'use strict';

  const DIFFICULTIES = {
    easy:   { rows: 9,  cols: 9,  mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard:   { rows: 16, cols: 22, mines: 70 }
  };

  function getSettings() {
    const s = (window.KioskPlugins && window.KioskPlugins.minesweeper
      ? window.KioskPlugins.minesweeper.settings : {}) || {};
    return { difficulty: s.difficulty || 'medium' };
  }

  let state = null;
  let cellSize = 32;

  function initState() {
    const cfg = getSettings();
    const diff = DIFFICULTIES[cfg.difficulty] || DIFFICULTIES.medium;
    return {
      rows: diff.rows,
      cols: diff.cols,
      mineCount: diff.mines,
      // 0-8 — число мин вокруг; -1 — мина; null — неоткрыто.
      grid: [],
      revealed: [],
      flagged: [],
      gameOver: false,
      won: false,
      score: 0,
      started: false,
      firstClick: true
    };
  }

  function placeMines(excludeR, excludeC) {
    // Расставляем мины, исключая первую клетку и её соседей.
    const exclude = new Set();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        exclude.add(`${excludeR + dr},${excludeC + dc}`);
      }
    }
    let placed = 0;
    while (placed < state.mineCount) {
      const r = Math.floor(Math.random() * state.rows);
      const c = Math.floor(Math.random() * state.cols);
      if (exclude.has(`${r},${c}`)) continue;
      if (state.grid[r][c] === -1) continue;
      state.grid[r][c] = -1;
      placed++;
    }
    // Считаем числа вокруг.
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        if (state.grid[r][c] === -1) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < state.rows && nc >= 0 && nc < state.cols) {
              if (state.grid[nr][nc] === -1) count++;
            }
          }
        }
        state.grid[r][c] = count;
      }
    }
  }

  function reveal(r, c) {
    if (r < 0 || r >= state.rows || c < 0 || c >= state.cols) return;
    if (state.revealed[r][c] || state.flagged[r][c]) return;
    state.revealed[r][c] = true;

    if (state.grid[r][c] === -1) {
      // Бум!
      state.gameOver = true;
      // Открываем все мины.
      for (let i = 0; i < state.rows; i++) {
        for (let j = 0; j < state.cols; j++) {
          if (state.grid[i][j] === -1) state.revealed[i][j] = true;
        }
      }
      onGameOver();
      return;
    }

    state.score += 10;

    // Если 0 — открываем соседей рекурсивно.
    if (state.grid[r][c] === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          reveal(r + dr, c + dc);
        }
      }
    }

    checkWin();
  }

  function checkWin() {
    let unrevealed = 0;
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        if (!state.revealed[r][c] && state.grid[r][c] !== -1) unrevealed++;
      }
    }
    if (unrevealed === 0) {
      state.won = true;
      state.gameOver = true;
      // Бонус за победу.
      state.score += 500;
      onGameOver();
    }
  }

  function toggleFlag(r, c) {
    if (state.gameOver) return;
    if (state.revealed[r][c]) return;
    state.flagged[r][c] = !state.flagged[r][c];
    draw();
  }

  function onGameOver() {
    draw();
    updateScore();
    if (state.score > 0 && window.Leaderboard) {
      setTimeout(() => {
        window.Leaderboard.open('minesweeper', {
          title: '💣 Сапёр — Таблица рекордов',
          score: state.score
        });
      }, 800);
    }
  }

  function numColor(n) {
    const colors = ['', '#3a9fff', '#4caf50', '#ff6b6b', '#9c27b0',
                    '#e8a04a', '#00bcd4', '#fff', '#888'];
    return colors[n] || '#fff';
  }

  function draw() {
    const grid = document.getElementById('ms-grid');
    if (!grid) return;
    grid.style.gridTemplateColumns = `repeat(${state.cols}, ${cellSize}px)`;
    grid.innerHTML = '';
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'ms-cell';
        cell.style.width = cellSize + 'px';
        cell.style.height = cellSize + 'px';
        cell.dataset.r = r;
        cell.dataset.c = c;

        if (state.revealed[r][c]) {
          cell.classList.add('ms-revealed');
          const val = state.grid[r][c];
          if (val === -1) {
            cell.classList.add('ms-mine');
            cell.textContent = '💣';
          } else if (val > 0) {
            cell.textContent = val;
            cell.style.color = numColor(val);
          }
        } else if (state.flagged[r][c]) {
          cell.classList.add('ms-flagged');
          cell.textContent = '🚩';
        }

        // Клик — открыть.
        cell.addEventListener('click', () => onCellClick(r, c));
        // Правый клик — флажок.
        cell.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          toggleFlag(r, c);
        });
        // Длинный тап — флажок.
        let touchTimer = null;
        cell.addEventListener('touchstart', (e) => {
          touchTimer = setTimeout(() => {
            touchTimer = null;
            toggleFlag(r, c);
          }, 500);
        }, { passive: true });
        cell.addEventListener('touchend', (e) => {
          if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
            // Короткий тап — открыть.
            onCellClick(r, c);
            e.preventDefault();
          }
        });
        cell.addEventListener('touchmove', () => {
          if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
        }, { passive: true });

        grid.appendChild(cell);
      }
    }
  }

  function onCellClick(r, c) {
    if (state.gameOver) return;
    if (state.flagged[r][c]) return;
    if (state.revealed[r][c]) return;

    if (state.firstClick) {
      state.firstClick = false;
      placeMines(r, c);
    }

    reveal(r, c);
    draw();
    updateScore();
  }

  function updateScore() {
    const el = document.getElementById('ms-score');
    if (el) el.textContent = String(state.score);
    const minesEl = document.getElementById('ms-mines');
    if (minesEl) {
      let flagged = 0;
      for (let r = 0; r < state.rows; r++)
        for (let c = 0; c < state.cols; c++)
          if (state.flagged[r][c]) flagged++;
      minesEl.textContent = String(state.mineCount - flagged);
    }
  }

  function startGame() {
    state = initState();
    state.started = true;
    // Пустая сетка — мины расставятся при первом клике.
    state.grid = Array(state.rows).fill(null).map(() => Array(state.cols).fill(0));
    state.revealed = Array(state.rows).fill(null).map(() => Array(state.cols).fill(false));
    state.flagged = Array(state.rows).fill(null).map(() => Array(state.cols).fill(false));

    // Подбираем размер клетки под экран.
    const maxW = window.innerWidth - 80;
    const maxH = window.innerHeight - 300;
    cellSize = Math.min(
      Math.floor(maxW / state.cols),
      Math.floor(maxH / state.rows),
      40
    );
    cellSize = Math.max(20, cellSize);

    const overlay = document.getElementById('ms-overlay');
    if (overlay) overlay.style.display = 'none';
    draw();
    updateScore();
  }

  function render($el) {
    const cfg = getSettings();
    const diff = DIFFICULTIES[cfg.difficulty] || DIFFICULTIES.medium;
    $el.innerHTML = `
      <div class="view">
        <div class="view-header">
          <div>
            <div class="view-title">💣 Сапёр</div>
            <div class="view-subtitle">Тап — открыть • Длинный тап/правый клик — флажок</div>
          </div>
        </div>
        <div class="ms-game">
          <div class="ms-stats">
            <div class="ms-stat"><span>Счёт:</span> <strong id="ms-score">0</strong></div>
            <div class="ms-stat"><span>Мин:</span> <strong id="ms-mines">${diff.mines}</strong></div>
          </div>
          <div class="ms-grid-wrap">
            <div class="ms-grid" id="ms-grid"></div>
            <div class="ms-overlay" id="ms-overlay">
              <div class="ms-overlay-content">
                <div class="ms-overlay-msg" id="ms-overlay-msg">Сложность: ${cfg.difficulty} (${diff.rows}×${diff.cols}, ${diff.mines} мин)</div>
                <button class="ms-start-btn" id="ms-start-btn">▶ Старт</button>
              </div>
            </div>
          </div>
          <div class="ms-controls">
            <button class="header-btn" id="ms-restart-btn" style="width:auto;padding:8px 20px;">🔄 Заново</button>
            <button class="header-btn" id="ms-leaderboard-btn" style="width:auto;padding:8px 20px;">🏆 Рекорды</button>
          </div>
        </div>
      </div>
    `;
    state = initState();
    state.grid = Array(state.rows).fill(null).map(() => Array(state.cols).fill(0));
    state.revealed = Array(state.rows).fill(null).map(() => Array(state.cols).fill(false));
    state.flagged = Array(state.rows).fill(null).map(() => Array(state.cols).fill(false));
    const maxW = window.innerWidth - 80;
    const maxH = window.innerHeight - 300;
    cellSize = Math.min(Math.floor(maxW / state.cols), Math.floor(maxH / state.rows), 40);
    cellSize = Math.max(20, cellSize);
    draw();

    document.getElementById('ms-start-btn')?.addEventListener('click', startGame);
    document.getElementById('ms-restart-btn')?.addEventListener('click', startGame);
    document.getElementById('ms-leaderboard-btn')?.addEventListener('click', () => {
      if (window.Leaderboard) window.Leaderboard.open('minesweeper', { title: '💣 Сапёр — Таблица рекордов' });
    });
  }

  return {
    async mount($el) { render($el); },
    unmount() { state = null; }
  };
})();
