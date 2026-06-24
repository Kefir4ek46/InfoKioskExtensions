/* plugins/wordle/view.js — игра «Вордли» (Wordle по-русски).
 *
 * Угадай слово из 5 букв за 6 попыток.
 * Зелёная буква — на своём месте.
 * Жёлтая буква — есть в слове, но в другом месте.
 * Серая буква — нет в слове.
 *
 * Словарь: ~200 существительных, 5 букв.
 * Счёт = (6 - использовано попыток) × 100, при угадывании. Рекорд по счёту.
 */
window.KioskViews = window.KioskViews || {};

window.KioskViews['wordle'] = (() => {
  'use strict';

  const WORD_LENGTH = 5;
  const MAX_ATTEMPTS = 6;

  // Словарь существительных, 5 букв (русские).
  const WORDS = [
    'АВТОР','АРЕНА','БАЙТА','БАЛКА','БАЛОН','БАНКА','БАРКА','БЕЙТС','БЕТОН','БИЛЕТ',
    'БОЛЕЗ','БОЛОТ','БРЕВН','БУКВА','БУМАГА','БУТОН','ВАГОН','ВАЗА','ВЕДРО','ВЕКТОР',
    'ВЕЛОС','ВЕНЕЦ','ВЕСНА','ВЕТКА','ВЕЧЕР','ВИЛКА','ВИТРИ','ВЛАСТЬ','ВНИМАН','ВОДА',
    'ВОЖДЬ','ВОЙНА','ВОКЗАЛ','ВОЛНА','ВОЛКЕ','ВОРОТ','ВОСК','ВРАГ','ВРАЧ','ВРЕМЯ',
    'ВТОРНИК','ВЫБОР','ВЯЗАНИЕ','ГАРАЖ','ГЕНИЙ','ГЕРОЙ','ГИРЯ','ГЛАВА','ГЛАЗ','ГЛИНА',
    'ГЛОБУС','ГНЕВ','ГОЛОД','ГОЛУБЬ','ГОРА','ГОРОД','ГРАДУС','ГРИБ','ГРОМ','ГРУППА',
    'ГРЯЗЬ','ГУБА','ДАВЛЕНИЕ','ДАТА','ДВЕРЬ','ДЕЛО','ДЕТСТВО','ДИАМЕТР','ДИВАН','ДЛИНА',
    'ДНЕВНИК','ДНО','ДОЖДЬ','ДОКУМЕНТ','ДОМ','ДОРОГА','ДОСКА','ДРОЗД','ДУБ','ДЫМ',
    'ДЯТЕЛ','ЖЕЛЕЗО','ЖЕЛУДЬ','ЖЕНЩИНА','ЖИВОТНОЕ','ЖИЗНЬ','ЖУК','ЗАБОР','ЗАГАДКА','ЗАДАЧА',
    'ЗАКАТ','ЗАМОК','ЗАПОС','ЗАЯЦ','ЗВЕЗДА','ЗВЕРЬ','ЗЕМЛЯ','ЗЕРНО','ЗИМА','ЗНАК',
    'ЗНАНИЕ','ЗОЛОТО','ЗОНТ','ИГЛА','ИГРУШКА','ИДЕЯ','ИЗБА','ИЗВЕСТИЕ','ИЗЮМ','ИЙОТА',
    'ИМЕНИЕ','ИНДЕКС','ИНЖИР','ИНОСТРАНЕЦ','ИНСТИТУТ','ИСКУССТВО','ИСТОРИЯ','ИЮНЬ','ИЮЛЬ','КАБАН',
    'КАБИНЕТ','КАДР','КАЗАХ','КАМЕНЬ','КАНАЛ','КАНЕЙ','КАПЛЯ','КАПУСТА','КАРАНДАШ','КАРМАН',
    'КАРТА','КАССА','КАСТРЮЛЯ','КАТЕК','КАЧЕЛИ','КВЕРХУ','КЕГЛЯ','КЕДР','КИДЖА','КИЛОГРАММ',
    'КИЛОМЕТР','КИНО','КИСЛОТА','КЛЕЙ','КЛЕТКА','КЛИМАТ','КЛИНИКА','КЛОУН','КЛУБ','КЛЮЧ',
    'КНИГА','КНОПКА','КОБРА','КОВЕР','КОЖА','КОЗА','КОЛЕНО','КОЛЕСО','КОЛИЧЕСТВО','КОЛОВОРО',
    'КОЛОДЕЦ','КОЛОКОЛ','КОЛХОЗ','КОМАР','КОМНАТА','КОМПЬЮТЕР','КОНВЕРТ','КОНДИЦИЯ','КОНЕЦ','КОНИКА',
    'КОНКУРС','КОНТРОЛЬ','КОНЦЕРТ','КОПЕЙКА','КОРЗИНА','КОРЕНЬ','КОРОБКА','КОРОЛЕВА','КОРОЛЬ','КОРТИК',
    'КОСТЬ','КОТЛЕТА','КОФЕ','КРАЙ','КРАН','КРАСНА','КРЕСЛО','КРЕСТ','КРИК','КРОЛИК',
    'КРОСС','КРУГ','КРУПА','КРЫША','КСТАТИ','КУВШИН','КУЗНЕЦ','КУКЛА','КУКУРУЗА','КУЛИ',
    'КУРС','КУРТКА','КУХНЯ','ЛАЙТЕР','ЛАМПА','ЛАСТИК','ЛАДОШЬ','ЛЕБЕДЬ','ЛЕВ','ЛЕД',
    'ЛЕС','ЛЕСТНИЦА','ЛЕТО','ЛИДИЯ','ЛИЗА','ЛИМОН','ЛИНЕЙКА','ЛИСТ','ЛИТЕРА','ЛИЦО',
    'ЛОБ','ЛОДКА','ЛОЖКА','ЛОКОТЬ','ЛОШАДЬ','ЛУЖА','ЛУНА','ЛУЧ','ЛЫЖА','ЛЬВОВ',
    'МАГАЗИН','МАГНИТ','МАЙОНЕЗ','МАК','МАКЕТ','МАЛИНА','МАРТ','МАСКА','МАТЕРИАЛ','МАШИНА',
    'МЕБЕЛЬ','МЕДВЕДЬ','МЕДЬ','МЕЖА','МЕЛ','МЕНЮ','МЕСЯЦ','МЕТЕЛЬ','МЕТОД','МЕЧТА',
    'МИГ','МИЛЛИОН','МИНУТА','МИР','МЛАДЕНЕЦ','МНОЖЕСТВО','МОДЕЛЬ','МОЛОКО','МОЛОТОК','МОЛОЧНО',
    'МОНЕТКА','МОРКОВЬ','МОРОЗ','МОРСКАЯ','МОСТ','МОТОР','МОХ','МУЖЧИНА','МУЗЕЙ','МУЗЫКА',
    'МЫЛО','МЫШЬ','МЯЧ','НАБОР','НАДЕЖДА','НАЗВАНИЕ','НАРЯД','НАСЕКОМОЕ','НАСТРОЕНИЕ','НАУКА',
    'НЕБО','НЕВЕСТА','НЕДЕЛЯ','НЕЙТРОН','НЕРВ','НЕТЕРПЕНИЕ','НИТЬ','НОВОСТЬ','НОЖ','НОМЕР',
    'НОРМА','НОС','НОСОРОГ','НОЧЬ','НУМЕРАЦИЯ','ОБЕД','ОБЛАКО','ОБРАЗЕЦ','ОБРУЧ','ОБЩЕСТВО',
    'ОБЪЕКТ','ОБЯЗАННОСТЬ','ОГОРОД','ОДЕЖДА','ОЗЕРО','ОКНО','ОКРАС','ОКРУГ','ОКТАВА','ОЛИМПИАДА',
    'ОНЛАЙН','ОПЕРА','ОПИСАНИЕ','ОПЫТ','ОРБИТА','ОРГАН','ОРУЖИЕ','ОСЕНЬ','ОСНОВА','ОСОБАЯ',
    'ОСТРОВ','ОТВЕТ','ОТДЫХ','ОТКРЫТИЕ','ОТНОШЕНИЕ','ОТРЕЗОК','ОТЦОВ','ОФИС','ОХОТА','ОЧКИ',
    'ПАЛЕЦ','ПАМЯТНИК','ПАМЯТЬ','ПАНЕЛЬ','ПАРК','ПАРОВОЗ','ПАСПОРТ','ПАУК','ПЕЙЗАЖ','ПЕНА',
    'ПЕНСИЯ','ПЕРВЫЙ','ПЕРЕГОРОДКА','ПЕРЕЦ','ПЕРО','ПЕСНЯ','ПЕСОК','ПЕЧАЛЬ','ПЕЧАТЬ','ПЕЧЕНЬЕ',
    'ПИВОВАР','ПИЕС','ПИКНИК','ПИЛОТ','ПИНГВИН','ПИОНЕР','ПИСЬМО','ПИЦЦА','ПЛАМЯ','ПЛАНЕТ',
    'ПЛАНЕТА','ПЛАТОК','ПЛЕЧЕ','ПЛОЩАДЬ','ПЛЮС','ПОВАР','ПОГОДА','ПОДВИГ','ПОДЪЕЗД','ПОЕЗД',
    'ПОЖАР','ПОЛЕ','ПОЛИЦЕЙСКИЙ','ПОЛИЦИЯ','ПОЛКА','ПОЛОТЕНЦЕ','ПОЛОТНО','ПОЛТОРА','ПОЛУЧИТЬ','ПОМЕЩЕНИЕ',
    'ПОМНОЖИТЬ','ПОНЕДЕЛЬНИК','ПОПУГАЙ','ПОРОГ','ПОРТРЕТ','ПОРТФЕЛЬ','ПОРЯДОК','ПОСЕЛОК','ПОСЛЕДСТВИЕ','ПОСТАВКА',
    'ПОТОЛОК','ПОТОК','ПОХОД','ПОЧТА','ПОЭЗИЯ','ПРАВИЛО','ПРАЗДНИК','ПРЕВРАЩЕНИЕ','ПРЕДЕЛ','ПРЕИМУЩЕСТВО',
    'ПРЕКРАСНО','ПРЕПОДАВАТЕЛЬ','ПРЕПЯТСТВИЕ','ПРИБОР','ПРИВЕТСТВИЕ','ПРИГОРОД','ПРИЗНАК','ПРИКАЗ','ПРИМЕР','ПРИНЦИП',
    'ПРИРОДА','ПРИЧИНА','ПРОВЕРКА','ПРОГРАММА','ПРОДАВЕЦ','ПРОЕКТ','ПРОИЗВЕДЕНИЕ','ПРОИСШЕСТВИЕ','ПРОКЛЯТЬЕ','ПРОМЕЖУТОК',
    'ПРОПУСК','ПРОСЬБА','ПРОТИВНИК','ПРОФЕССИЯ','ПРОХОД','ПРОЦЕСС','ПРУД','ПРЯНИК','ПСИХОЛОГИЯ','ПТИЦА',
    'ПУГОВИЦА','ПУЗЫРЬ','ПУЛЬТ','ПУНКТ','ПУСТЫНЯ','ПУТЬ','ПШЕНИЦА','ПЫЛЬ','ПЯТНО','ПЯТНИЦА',
    'РАБОТА','РАБОТНИК','РАВЕНСТВО','РАДИАТОР','РАДИО','РАЗВИТИЕ','РАЗГОВОР','РАЗДЕЛ','РАЗМЕР','РАЗНИЦА',
    'РАЗРЕШЕНИЕ','РАЙОН','РАКЕТА','РАМА','РАНЕЦ','РАННЯЯ','РАСПИСАНИЕ','РАССКАЗ','РАСТВОР','РАСТЕНИЕ',
    'РАСХОД','РЕБРО','РЕБЯТА','РЕВИЗИЯ','РЕЗУЛЬТАТ','РЕКА','РЕКЛАМА','РЕМЕНЬ','РЕМОНТ','РЕПЕТИТОР',
    'РЕПУТАЦИЯ','РЕСНИЦА','РЕСТОРАН','РЕЦЕПТ','РИСУНОК','РОВ','РОДИНА','РОДИТЕЛЬ','РОДНИК','РОЗЕТКА',
    'РОЛИК','РОМАН','РОССИЯ','РОТ','РУБАШКА','РУБЛЬ','РУКАВ','РУКОВОДСТВО','РУКОПИСЬ','РУССКИЙ',
    'РУЧКА','РЫБА','РЫНОК','РЯД'
  ].filter(w => w.length === WORD_LENGTH);

  let state = null;

  function pickWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
  }

  function initState() {
    return {
      answer: pickWord(),
      guesses: [],     // массив строк
      current: '',     // текущий ввод
      gameOver: false,
      won: false,
      rowIndex: 0
    };
  }

  // Проверка: какие буквы в guess совпадают с answer.
  // Возвращает массив из WORD_LENGTH элементов:
  //   'correct' (зелёный), 'present' (жёлтый), 'absent' (серый).
  function evaluate(guess, answer) {
    const result = Array(WORD_LENGTH).fill('absent');
    const answerArr = answer.split('');
    const guessArr = guess.split('');

    // Сначала отмечаем правильные.
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessArr[i] === answerArr[i]) {
        result[i] = 'correct';
        answerArr[i] = null;
        guessArr[i] = null;
      }
    }
    // Потом присутствующие, но не на месте.
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessArr[i] === null) continue;
      const idx = answerArr.indexOf(guessArr[i]);
      if (idx >= 0) {
        result[i] = 'present';
        answerArr[idx] = null;
      }
    }
    return result;
  }

  function submitGuess() {
    if (state.current.length !== WORD_LENGTH) return;
    // Проверяем, есть ли слово в словаре (опционально — можно убрать).
    // const valid = WORDS.includes(state.current);
    // if (!valid) { shake(); return; }

    const guess = state.current;
    state.guesses.push(guess);
    const result = evaluate(guess, state.answer);
    state.rowIndex++;

    if (guess === state.answer) {
      state.gameOver = true;
      state.won = true;
    } else if (state.rowIndex >= MAX_ATTEMPTS) {
      state.gameOver = true;
    }

    draw();
    state.current = '';

    if (state.gameOver) {
      const score = state.won ? (MAX_ATTEMPTS - state.rowIndex + 1) * 100 : 0;
      setTimeout(() => {
        if (score > 0 && window.Leaderboard) {
          window.Leaderboard.open('wordle', {
            title: '🔤 Вордли — Таблица рекордов',
            score
          });
        }
      }, 1000);
    }
  }

  function draw() {
    const grid = document.getElementById('wordle-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (let r = 0; r < MAX_ATTEMPTS; r++) {
      const row = document.createElement('div');
      row.className = 'wordle-row';
      const guess = state.guesses[r];
      const isCurrent = r === state.rowIndex && !state.gameOver;
      const currentLetters = isCurrent ? state.current : '';

      for (let c = 0; c < WORD_LENGTH; c++) {
        const cell = document.createElement('div');
        cell.className = 'wordle-cell';
        if (guess) {
          cell.textContent = guess[c];
          const result = evaluate(guess, state.answer)[c];
          cell.classList.add('wordle-' + result);
        } else if (isCurrent && currentLetters[c]) {
          cell.textContent = currentLetters[c];
          cell.classList.add('wordle-typing');
        }
        row.appendChild(cell);
      }
      grid.appendChild(row);
    }

    // Клавиатура.
    drawKeyboard();

    // Статус.
    const status = document.getElementById('wordle-status');
    if (status) {
      if (state.gameOver) {
        status.textContent = state.won
          ? `🎉 Победа! Слово: ${state.answer} (попыток: ${state.rowIndex})`
          : `😢 Не угадали. Слово: ${state.answer}`;
      } else {
        status.textContent = `Попытка ${state.rowIndex + 1} из ${MAX_ATTEMPTS}`;
      }
    }
  }

  function drawKeyboard() {
    const kb = document.getElementById('wordle-keyboard');
    if (!kb) return;
    const rows = ['ЙЦУКЕНГШЩЗХЪ', 'ФЫВАПРОЛДЖЭ', 'ЯЧСМИТЬБЮ'];
    // Собираем использованные буквы и их статусы.
    const letterStatus = {};
    state.guesses.forEach(g => {
      const res = evaluate(g, state.answer);
      for (let i = 0; i < WORD_LENGTH; i++) {
        const l = g[i];
        const s = res[i];
        // correct > present > absent.
        if (s === 'correct' || !letterStatus[l] ||
            (s === 'present' && letterStatus[l] === 'absent')) {
          letterStatus[l] = s;
        }
      }
    });

    kb.innerHTML = '';
    rows.forEach(rowStr => {
      const rowEl = document.createElement('div');
      rowEl.className = 'wordle-kb-row';
      for (const l of rowStr) {
        const btn = document.createElement('button');
        btn.className = 'wordle-key';
        btn.textContent = l;
        if (letterStatus[l]) btn.classList.add('wordle-' + letterStatus[l]);
        btn.addEventListener('click', () => typeLetter(l));
        rowEl.appendChild(btn);
      }
      kb.appendChild(rowEl);
    });

    // Кнопки Enter и Backspace.
    const actionRow = document.createElement('div');
    actionRow.className = 'wordle-kb-row';
    const enterBtn = document.createElement('button');
    enterBtn.className = 'wordle-key wordle-key-wide';
    enterBtn.textContent = 'ВВОД';
    enterBtn.addEventListener('click', submitGuess);
    const backBtn = document.createElement('button');
    backBtn.className = 'wordle-key wordle-key-wide';
    backBtn.textContent = '⌫';
    backBtn.addEventListener('click', backspace);
    actionRow.appendChild(enterBtn);
    actionRow.appendChild(backBtn);
    kb.appendChild(actionRow);
  }

  function typeLetter(l) {
    if (state.gameOver) return;
    if (state.current.length < WORD_LENGTH) {
      state.current += l;
      draw();
    }
  }

  function backspace() {
    if (state.gameOver) return;
    state.current = state.current.slice(0, -1);
    draw();
  }

  function onKeyDown(e) {
    if (state && state.gameOver) return;
    const key = e.key.toUpperCase();
    if (key === 'ENTER') { e.preventDefault(); submitGuess(); }
    else if (key === 'BACKSPACE') { e.preventDefault(); backspace(); }
    else if (/^[А-ЯЁ]$/.test(key) && state.current.length < WORD_LENGTH) {
      e.preventDefault();
      typeLetter(key);
    }
  }

  function startGame() {
    state = initState();
    const overlay = document.getElementById('wordle-overlay');
    if (overlay) overlay.style.display = 'none';
    draw();
  }

  function render($el) {
    $el.innerHTML = `
      <div class="view">
        <div class="view-header">
          <div>
            <div class="view-title">🔤 Вордли</div>
            <div class="view-subtitle">Угадайте слово за 6 попыток. 🟩 — на месте, 🟨 — не на месте.</div>
          </div>
        </div>
        <div class="wordle-game">
          <div class="wordle-status" id="wordle-status">Попытка 1 из 6</div>
          <div class="wordle-grid" id="wordle-grid"></div>
          <div class="wordle-keyboard" id="wordle-keyboard"></div>
          <div class="wordle-controls">
            <button class="header-btn" id="wordle-restart-btn" style="width:auto;padding:8px 20px;">🔄 Новое слово</button>
            <button class="header-btn" id="wordle-leaderboard-btn" style="width:auto;padding:8px 20px;">🏆 Рекорды</button>
          </div>
          <div class="wordle-overlay" id="wordle-overlay">
            <div class="wordle-overlay-content">
              <div class="wordle-overlay-msg">Угадайте слово из 5 букв за 6 попыток!</div>
              <button class="wordle-start-btn" id="wordle-start-btn">▶ Начать</button>
            </div>
          </div>
        </div>
      </div>
    `;
    state = initState();
    document.getElementById('wordle-start-btn')?.addEventListener('click', startGame);
    document.getElementById('wordle-restart-btn')?.addEventListener('click', startGame);
    document.getElementById('wordle-leaderboard-btn')?.addEventListener('click', () => {
      if (window.Leaderboard) window.Leaderboard.open('wordle', { title: '🔤 Вордли — Таблица рекордов' });
    });
    document.addEventListener('keydown', onKeyDown);
  }

  return {
    async mount($el) { render($el); },
    unmount() {
      document.removeEventListener('keydown', onKeyDown);
      state = null;
    }
  };
})();
