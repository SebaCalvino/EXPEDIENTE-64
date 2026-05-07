import { initBrokenScene, initCorrectScene } from '../three/lewis-scenes.js';
import { fireConfetti } from '../main.js';

const HINTS = [
  'El azufre tiene 1 par libre que apunta hacia arriba.',
  'Uno de los enlaces es doble (=) y el otro es simple (–).',
  'Los átomos laterales son ambos oxígeno (O).'
];

export function buildLewisGame(container) {
  container.innerHTML = `
    <div class="game-shell lewis-shell">
      <h2>Prueba pericial · Estructura de Lewis</h2>
      <p class="game-tag">Reconstruí la verdadera identidad del SO₂.</p>

      <!-- PHASE 1 -->
      <div class="lewis-phase active" data-phase="1">
        <div class="lewis-3d" id="lewis-broken-3d" role="button" tabindex="0" aria-label="Estructura incorrecta — clic para corregir">
          <canvas id="lewis-broken-canvas"></canvas>
          <div class="lewis-3d-label">❗ ESTRUCTURA INCORRECTA</div>
        </div>
        <p class="lewis-3d-caption">Esta estructura es incorrecta. Tocala para corregirla.</p>
      </div>

      <!-- PHASE 2 -->
      <div class="lewis-phase" data-phase="2">
        <p class="lewis-3d-caption" style="margin-bottom:14px;">
          Arrastrá los tokens correctos a sus lugares. Recordá: 1 par libre, 2 oxígenos, 1 enlace doble + 1 simple (resonancia).
        </p>
        <div class="puzzle-board" id="puzzle-board">
          <div class="puzzle-slot atom-slot slot-S" data-slot="S">S</div>
          <div class="puzzle-slot atom-slot slot-O-left" data-slot="O-left" data-accept="O">O?</div>
          <div class="puzzle-slot atom-slot slot-O-right" data-slot="O-right" data-accept="O">O?</div>
          <div class="puzzle-slot bond-slot slot-bond-left" data-slot="bond-left" data-accept="=,–">?</div>
          <div class="puzzle-slot bond-slot slot-bond-right" data-slot="bond-right" data-accept="=,–">?</div>
          <div class="puzzle-slot lp-slot slot-LP" data-slot="LP" data-accept="lp">:?</div>
        </div>
        <div class="puzzle-pool" id="puzzle-pool">
          <div class="token O" data-type="O" draggable="true">O</div>
          <div class="token O" data-type="O" draggable="true">O</div>
          <div class="token bond" data-type="=" draggable="true">=</div>
          <div class="token bond" data-type="–" draggable="true">–</div>
          <div class="token lp" data-type="lp" draggable="true">··</div>
          <div class="token distractor" data-type="H" draggable="true">H</div>
          <div class="token distractor" data-type="N" draggable="true">N</div>
          <div class="token distractor bond" data-type="–" draggable="true">–</div>
        </div>
        <p class="puzzle-hint" id="puzzle-hint"></p>
        <div class="puzzle-actions">
          <button class="btn dark" id="hint-btn">💡 Pista (<span id="hints-left">3</span>)</button>
          <button class="btn" id="validate-btn">✓ Validar</button>
          <button class="btn outline" id="reset-btn">↺ Reiniciar</button>
        </div>
      </div>

      <!-- PHASE 3 -->
      <div class="lewis-phase" data-phase="3">
        <h3 class="lewis-win-banner">✓ ESTRUCTURA VALIDADA</h3>
        <p class="win-stats" id="win-stats">Tiempo: 0s</p>
        <div class="lewis-3d" style="cursor: grab;">
          <canvas id="lewis-correct-canvas"></canvas>
        </div>
        <div class="puzzle-actions">
          <button class="btn outline" id="replay-btn">↺ Volver a jugar</button>
          <button class="btn" id="continue-btn">📂 Continuar al expediente</button>
        </div>
      </div>
    </div>
  `;

  let brokenScene = null;
  let correctScene = null;
  let startTime = 0;
  let hintsUsed = 0;
  const slotState = {};

  // PHASE 1 — broken 3D
  const brokenCanvas = container.querySelector('#lewis-broken-canvas');
  brokenScene = initBrokenScene(brokenCanvas);

  const broken3D = container.querySelector('#lewis-broken-3d');
  const goPhase2 = () => {
    startTime = performance.now();
    transitionPhase(container, 1, 2);
    setupPuzzle();
  };
  broken3D.addEventListener('click', goPhase2);
  broken3D.addEventListener('keypress', e => {
    if (e.key === 'Enter' || e.key === ' ') goPhase2();
  });

  function setupPuzzle() {
    const pool = container.querySelector('#puzzle-pool');
    const slots = container.querySelectorAll('.puzzle-slot[data-accept]');
    const tokens = container.querySelectorAll('.token');

    tokens.forEach(t => attachDrag(t, slots));

    container.querySelector('#hint-btn').onclick = () => useHint();
    container.querySelector('#validate-btn').onclick = () => validate();
    container.querySelector('#reset-btn').onclick = () => resetPuzzle();
  }

  function attachDrag(token, slots) {
    let active = false;
    let offsetX = 0, offsetY = 0;
    let originalParent = token.parentElement;
    let originalNext = token.nextSibling;

    const start = (clientX, clientY) => {
      if (token.classList.contains('placed')) return;
      active = true;
      const rect = token.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
      token.classList.add('dragging');
      token.style.left = (clientX - offsetX) + 'px';
      token.style.top = (clientY - offsetY) + 'px';
      document.body.appendChild(token);
    };

    const move = (clientX, clientY) => {
      if (!active) return;
      token.style.left = (clientX - offsetX) + 'px';
      token.style.top = (clientY - offsetY) + 'px';
    };

    const end = (clientX, clientY) => {
      if (!active) return;
      active = false;
      token.classList.remove('dragging');
      token.style.left = '';
      token.style.top = '';

      // find closest slot within snap range
      let target = null;
      let bestDist = Infinity;
      slots.forEach(slot => {
        if (slot.classList.contains('correct')) return;
        const r = slot.getBoundingClientRect();
        const cx = r.left + r.width/2;
        const cy = r.top + r.height/2;
        const d = Math.hypot(clientX - cx, clientY - cy);
        if (d < bestDist && d < 80) { bestDist = d; target = slot; }
      });

      if (target) {
        const accept = target.dataset.accept.split(',');
        const type = token.dataset.type;
        if (accept.includes(type)) {
          // accept
          target.textContent = token.textContent;
          target.classList.add('filled', 'correct');
          slotState[target.dataset.slot] = type;
          token.classList.add('placed');
          token.style.visibility = 'hidden';
        } else {
          target.classList.add('wrong');
          setTimeout(() => target.classList.remove('wrong'), 500);
          returnToken();
        }
      } else {
        returnToken();
      }
    };

    function returnToken() {
      if (originalNext && originalNext.parentElement === originalParent) {
        originalParent.insertBefore(token, originalNext);
      } else {
        originalParent.appendChild(token);
      }
    }

    token.addEventListener('mousedown', e => {
      e.preventDefault();
      start(e.clientX, e.clientY);
    });
    document.addEventListener('mousemove', e => move(e.clientX, e.clientY));
    document.addEventListener('mouseup', e => end(e.clientX, e.clientY));

    token.addEventListener('touchstart', e => {
      const t = e.touches[0];
      start(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchmove', e => {
      if (!active) return;
      const t = e.touches[0];
      move(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchend', e => {
      const t = (e.changedTouches && e.changedTouches[0]) || { clientX: 0, clientY: 0 };
      end(t.clientX, t.clientY);
    });

    token.addEventListener('dragstart', e => e.preventDefault());
  }

  function validate() {
    const hint = container.querySelector('#puzzle-hint');
    // requirements: O-left = O, O-right = O, LP = lp, bonds = one '=' and one '–'
    const ok =
      slotState['O-left'] === 'O' &&
      slotState['O-right'] === 'O' &&
      slotState['LP'] === 'lp' &&
      ((slotState['bond-left'] === '=' && slotState['bond-right'] === '–') ||
       (slotState['bond-left'] === '–' && slotState['bond-right'] === '='));

    if (ok) {
      hint.textContent = '¡Estructura correcta! Cargando modelo 3D…';
      hint.style.color = 'var(--acid-green)';
      setTimeout(() => goWin(), 800);
    } else {
      hint.textContent = 'Pista: el azufre tiene un par libre y forma una resonancia entre enlace simple y doble.';
      hint.style.color = 'var(--confidential)';
      const board = container.querySelector('#puzzle-board');
      board.classList.add('wrong');
      playBuzz();
      setTimeout(() => board.classList.remove('wrong'), 500);
    }
  }

  function useHint() {
    if (hintsUsed >= 3) return;
    const hintEl = container.querySelector('#puzzle-hint');
    hintEl.textContent = HINTS[hintsUsed];
    hintEl.style.color = 'var(--sulfur)';
    hintsUsed++;
    container.querySelector('#hints-left').textContent = 3 - hintsUsed;
    if (hintsUsed >= 3) container.querySelector('#hint-btn').disabled = true;
  }

  function resetPuzzle() {
    Object.keys(slotState).forEach(k => delete slotState[k]);
    const slots = container.querySelectorAll('.puzzle-slot[data-accept]');
    slots.forEach(s => {
      s.classList.remove('filled', 'correct', 'wrong');
      const accept = s.dataset.accept;
      if (accept === 'O') s.textContent = 'O?';
      else if (accept === 'lp') s.textContent = ':?';
      else s.textContent = '?';
    });
    const tokens = container.querySelectorAll('.token');
    const pool = container.querySelector('#puzzle-pool');
    tokens.forEach(t => {
      t.classList.remove('placed');
      t.style.visibility = '';
      pool.appendChild(t);
    });
    container.querySelector('#puzzle-hint').textContent = '';
  }

  function goWin() {
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    transitionPhase(container, 2, 3);
    container.querySelector('#win-stats').textContent =
      `Tiempo: ${elapsed}s · Pistas usadas: ${hintsUsed}/3`;

    // best time
    const best = parseFloat(localStorage.getItem('lewis_best_time') || '9999');
    if (parseFloat(elapsed) < best) {
      localStorage.setItem('lewis_best_time', elapsed);
      container.querySelector('#win-stats').textContent += ` · ¡Nuevo récord!`;
    }

    fireConfetti();

    // init correct 3D scene
    setTimeout(() => {
      const canvas = container.querySelector('#lewis-correct-canvas');
      correctScene = initCorrectScene(canvas);
    }, 50);

    container.querySelector('#replay-btn').onclick = () => {
      hintsUsed = 0;
      container.querySelector('#hints-left').textContent = '3';
      container.querySelector('#hint-btn').disabled = false;
      resetPuzzle();
      transitionPhase(container, 3, 1);
    };
    container.querySelector('#continue-btn').onclick = () => {
      const closeBtn = document.querySelector('.modal-backdrop.open .modal-close');
      if (closeBtn) closeBtn.click();
      document.getElementById('expediente')?.scrollIntoView({ behavior: 'smooth' });
    };
  }
}

function transitionPhase(container, from, to) {
  const f = container.querySelector(`.lewis-phase[data-phase="${from}"]`);
  const t = container.querySelector(`.lewis-phase[data-phase="${to}"]`);
  if (window.gsap) {
    window.gsap.to(f, {
      opacity: 0, scale: 0.96, duration: 0.4,
      onComplete: () => {
        f.classList.remove('active');
        f.style = '';
        t.classList.add('active');
        window.gsap.fromTo(t, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.5 });
      }
    });
  } else {
    f.classList.remove('active');
    t.classList.add('active');
  }
}

function playBuzz() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 110;
    gain.gain.value = 0.06;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch (e) {}
}
