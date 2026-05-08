const PAIRS = [
  { id: 'angular', a: 'Geometría angular', b: '<svg viewBox="0 0 60 60" width="42" height="42"><circle cx="30" cy="20" r="8" fill="#F5C518"/><circle cx="14" cy="40" r="6" fill="#C9302C"/><circle cx="46" cy="40" r="6" fill="#C9302C"/><line x1="30" y1="20" x2="14" y2="40" stroke="#0F1419" stroke-width="2"/><line x1="30" y1="20" x2="46" y2="40" stroke="#0F1419" stroke-width="2"/></svg>' },
  { id: 'polar', a: 'Polar', b: '<svg viewBox="0 0 60 30" width="50" height="28"><line x1="6" y1="15" x2="50" y2="15" stroke="#C9302C" stroke-width="3" marker-end="url(#a)"/><defs><marker id="a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#C9302C"/></marker></defs><text x="30" y="10" font-size="8" fill="#0F1419" text-anchor="middle">μ</text></svg>' },
  { id: 'so2', a: 'SO₂', b: 'Fórmula del<br>caso 64' },
  { id: 'h2so3', a: 'H₂SO₃', b: '🌧️ Lluvia ácida' },
  { id: 'volcano', a: 'Volcán', b: '🌋' },
  { id: 'lewis', a: 'Lewis', b: ': : :<br>: S :<br>: : :' },
  { id: 'fgd', a: 'FGD / Scrubber', b: '🏭 + 🛡️' },
  { id: 'e220', a: 'E220', b: '🍷' }
];

export function buildMemotest(container) {
  container.innerHTML = `
    <div class="game-shell">
      <h2>Memotest Químico</h2>
      <p class="game-tag">Encontrá los 8 pares vinculados al SO₂.</p>
      <div class="game-area">
        <div class="game-hud">
          <span>Movs: <b id="memo-moves">0</b></span>
          <span>Tiempo: <b id="memo-time">0s</b></span>
          <span>Mejor: <b id="memo-best">—</b></span>
        </div>
        <div class="memo-board" id="memo-board"></div>
        <div class="game-controls">
          <button class="btn" id="memo-restart">↺ Reiniciar</button>
        </div>
      </div>
    </div>
  `;

  const board = container.querySelector('#memo-board');
  const movesEl = container.querySelector('#memo-moves');
  const timeEl = container.querySelector('#memo-time');
  const bestEl = container.querySelector('#memo-best');

  bestEl.textContent = localStorage.getItem('memotest_best') || '—';

  let moves, matched, first, lock, startTime, timer;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function reset() {
    moves = 0; matched = 0; first = null; lock = false;
    movesEl.textContent = 0;
    const cards = [];
    PAIRS.forEach(p => {
      cards.push({ id: p.id, side: 'a', html: p.a });
      cards.push({ id: p.id, side: 'b', html: p.b });
    });
    const shuffled = shuffle(cards);
    board.innerHTML = '';
    shuffled.forEach(c => {
      const card = document.createElement('div');
      card.className = 'memo-card';
      card.dataset.id = c.id;
      card.innerHTML = `
        <div class="memo-inner">
          <div class="memo-face front">?</div>
          <div class="memo-face back">${c.html}</div>
        </div>
      `;
      card.addEventListener('click', () => flip(card));
      board.appendChild(card);
    });
    startTime = performance.now();
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      const sec = Math.floor((performance.now() - startTime) / 1000);
      timeEl.textContent = sec + 's';
    }, 250);
  }

  function flip(card) {
    if (lock) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    card.classList.add('flipped');
    if (!first) {
      first = card;
      return;
    }
    moves++;
    movesEl.textContent = moves;
    if (first.dataset.id === card.dataset.id && first !== card) {
      first.classList.add('matched');
      card.classList.add('matched');
      matched++;
      first = null;
      if (matched === PAIRS.length) win();
    } else {
      lock = true;
      const a = first, b = card;
      setTimeout(() => {
        a.classList.remove('flipped');
        b.classList.remove('flipped');
        first = null;
        lock = false;
      }, 800);
    }
  }

  function win() {
    clearInterval(timer);
    const sec = Math.floor((performance.now() - startTime) / 1000);
    const score = `${moves}m / ${sec}s`;
    const best = localStorage.getItem('memotest_best');
    if (!best || moves < parseInt(best.split('m')[0], 10)) {
      localStorage.setItem('memotest_best', score);
      bestEl.textContent = score + ' ★';
    }
    setTimeout(() => alert(`¡Caso resuelto! ${moves} movimientos en ${sec}s.`), 300);
  }

  container.querySelector('#memo-restart').onclick = reset;
  reset();

  container._cleanup = () => clearInterval(timer);
}
