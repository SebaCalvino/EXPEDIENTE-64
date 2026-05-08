window.E64 = window.E64 || {};

window.E64.buildLewisGame = function(container) {

  var DIFFICULTIES = {
    easy: {
      label: 'Detective Junior',
      hints: 3,
      pool: [
        {type:'O',  label:'O',   cls:'O'},
        {type:'O',  label:'O',   cls:'O'},
        {type:'=',  label:'=',   cls:'bond'},
        {type:'–',  label:'–',   cls:'bond'},
        {type:'lp', label:'··',  cls:'lp'},
        {type:'H',  label:'H',   cls:'distractor'},
        {type:'N',  label:'N',   cls:'distractor'},
        {type:'–',  label:'–',   cls:'bond distractor'}
      ]
    },
    medium: {
      label: 'Investigador',
      hints: 2,
      pool: [
        {type:'O',  label:'O',   cls:'O'},
        {type:'O',  label:'O',   cls:'O'},
        {type:'=',  label:'=',   cls:'bond'},
        {type:'–',  label:'–',   cls:'bond'},
        {type:'lp', label:'··',  cls:'lp'},
        {type:'H',  label:'H',   cls:'distractor'},
        {type:'N',  label:'N',   cls:'distractor'},
        {type:'C',  label:'C',   cls:'distractor'},
        {type:'≡',  label:'≡',   cls:'bond distractor'},
        {type:'=',  label:'=',   cls:'bond distractor'},
        {type:'lp', label:'··',  cls:'lp distractor'},
        {type:'–',  label:'–',   cls:'bond distractor'}
      ]
    },
    hard: {
      label: 'Jefe del Expediente',
      hints: 1,
      timerVisible: true,
      pool: [
        {type:'O',  label:'O',   cls:'O'},
        {type:'O',  label:'O',   cls:'O'},
        {type:'=',  label:'=',   cls:'bond'},
        {type:'–',  label:'–',   cls:'bond'},
        {type:'lp', label:'··',  cls:'lp'},
        {type:'H',  label:'H',   cls:'distractor'},
        {type:'N',  label:'N',   cls:'distractor'},
        {type:'C',  label:'C',   cls:'distractor'},
        {type:'F',  label:'F',   cls:'distractor'},
        {type:'Cl', label:'Cl',  cls:'distractor'},
        {type:'≡',  label:'≡',   cls:'bond distractor'},
        {type:'=',  label:'=',   cls:'bond distractor'},
        {type:'=',  label:'=',   cls:'bond distractor'},
        {type:'lp', label:'··',  cls:'lp distractor'},
        {type:'lp', label:'··',  cls:'lp distractor'},
        {type:'–',  label:'–',   cls:'bond distractor'}
      ]
    }
  };

  var HINTS = [
    'Regla del octeto: el átomo central necesita 8 e⁻ — contá enlaces y pares no enlazantes.',
    'El SO₂ tiene 18 electrones de valencia. ¿Cuántos forman enlaces y cuántos quedan como pares libres?',
    'La geometría angular (~119°) implica 3 dominios electrónicos sobre el S: 2 enlazantes y 1 par libre.'
  ];

  var currentDiff = 'medium';
  var slotState   = {};
  var hintsUsed   = 0;
  var startTime   = 0;
  var brokenCtrl  = null;
  var timerIv     = null;
  var elapsed     = 0;

  /* ── HTML ── */
  container.innerHTML = [
    '<div class="game-shell lewis-shell">',
    '<h2>Prueba pericial · Estructura de Lewis</h2>',
    '<p class="game-tag">Reconstruí la verdadera identidad del SO₂.</p>',

    '<!-- difficulty selector -->',
    '<div class="lewis-diff-bar">',
      '<span class="lewis-diff-label">Dificultad:</span>',
      '<button class="lewis-diff-btn" data-diff="easy">Detective Junior</button>',
      '<button class="lewis-diff-btn active" data-diff="medium">Investigador</button>',
      '<button class="lewis-diff-btn" data-diff="hard">Jefe del Expediente</button>',
    '</div>',

    '<!-- PHASE 1 -->',
    '<div class="lewis-phase active" data-phase="1">',
      '<div class="lewis-3d" id="lewis-broken-3d" role="button" tabindex="0" aria-label="Estructura incorrecta, clic para corregir">',
        '<canvas id="lewis-broken-canvas"></canvas>',
        '<div class="lewis-3d-label">❗ ESTRUCTURA INCORRECTA</div>',
      '</div>',
      '<p class="lewis-3d-caption">Esta estructura es incorrecta. Tocala para comenzar a reconstruirla.</p>',
    '</div>',

    '<!-- PHASE 2 -->',
    '<div class="lewis-phase" data-phase="2">',
      '<p class="lewis-3d-caption" style="margin-bottom:10px">Arrastrá los tokens al lugar correcto. Slots: 2×O · 1 doble + 1 simple · 1 par libre.</p>',
      '<div id="lewis-timer" class="lewis-timer" style="display:none">⏱ <span id="timer-display">0</span>s</div>',
      '<div class="puzzle-board" id="puzzle-board">',
        '<div class="puzzle-slot atom-slot slot-S" data-slot="S">S</div>',
        '<div class="puzzle-slot atom-slot slot-O-left"  data-slot="O-left"  data-accept="O">O?</div>',
        '<div class="puzzle-slot atom-slot slot-O-right" data-slot="O-right" data-accept="O">O?</div>',
        '<div class="puzzle-slot bond-slot slot-bond-left"  data-slot="bond-left"  data-accept="=,–">?</div>',
        '<div class="puzzle-slot bond-slot slot-bond-right" data-slot="bond-right" data-accept="=,–">?</div>',
        '<div class="puzzle-slot lp-slot   slot-LP"       data-slot="LP"       data-accept="lp">:?</div>',
      '</div>',
      '<div class="puzzle-pool" id="puzzle-pool"></div>',
      '<p class="puzzle-hint" id="puzzle-hint"></p>',
      '<div class="puzzle-actions">',
        '<button class="btn dark" id="hint-btn">💡 Pista (<span id="hints-left">2</span>)</button>',
        '<button class="btn"      id="validate-btn">✓ Validar</button>',
        '<button class="btn outline" id="reset-btn">↺ Reiniciar</button>',
      '</div>',
    '</div>',

    '<!-- PHASE 3 -->',
    '<div class="lewis-phase" data-phase="3">',
      '<h3 class="lewis-win-banner">✓ ESTRUCTURA VALIDADA</h3>',
      '<p class="win-stats" id="win-stats">Tiempo: 0s</p>',
      '<div class="lewis-3d"><canvas id="lewis-correct-canvas"></canvas></div>',
      '<div class="puzzle-actions">',
        '<button class="btn outline" id="replay-btn">↺ Volver a jugar</button>',
        '<button class="btn"         id="continue-btn">📂 Continuar</button>',
      '</div>',
    '</div>',
    '</div>'
  ].join('');

  /* ── Difficulty bar ── */
  container.querySelectorAll('.lewis-diff-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      container.querySelectorAll('.lewis-diff-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentDiff = btn.dataset.diff;
    });
  });

  /* ── Phase 1 ── */
  var brokenCanvas = container.querySelector('#lewis-broken-canvas');
  brokenCtrl = window.E64.initBrokenScene(brokenCanvas);

  function goPhase2() {
    startTime = performance.now();
    elapsed   = 0;
    if (brokenCtrl && brokenCtrl.dispose) brokenCtrl.dispose();
    transitionPhase(1, 2);
    buildPool();
    setupPuzzle();

    var diff = DIFFICULTIES[currentDiff];
    container.querySelector('#hints-left').textContent = diff.hints;
    hintsUsed = 0;
    container.querySelector('#hint-btn').disabled = false;

    /* Timer for hard mode */
    if (diff.timerVisible) {
      var timerEl   = container.querySelector('#lewis-timer');
      var displayEl = container.querySelector('#timer-display');
      timerEl.style.display = 'block';
      timerIv = setInterval(function() {
        elapsed = ((performance.now() - startTime) / 1000) | 0;
        displayEl.textContent = elapsed;
      }, 500);
    }
  }

  var broken3D = container.querySelector('#lewis-broken-3d');
  broken3D.addEventListener('click', goPhase2);
  broken3D.addEventListener('keypress', function(e) { if (e.key==='Enter'||e.key===' ') goPhase2(); });

  /* ── Build pool tokens from difficulty config ── */
  function buildPool() {
    var pool   = container.querySelector('#puzzle-pool');
    pool.innerHTML = '';
    var config = DIFFICULTIES[currentDiff];
    /* Shuffle */
    var items = config.pool.slice().sort(function() { return Math.random()-0.5; });
    items.forEach(function(item) {
      var t = document.createElement('div');
      t.className   = 'token ' + item.cls;
      t.dataset.type = item.type;
      t.textContent  = item.label;
      pool.appendChild(t);
    });
  }

  function setupPuzzle() {
    slotState = {};
    var slots  = container.querySelectorAll('.puzzle-slot[data-accept]');
    var tokens = container.querySelectorAll('.token');

    /* Reset slot display */
    slots.forEach(function(slot) {
      slot.classList.remove('filled','correct','wrong','shaking');
      var a = slot.dataset.accept;
      slot.textContent = a==='O' ? 'O?' : a==='lp' ? ':?' : '?';
    });

    tokens.forEach(function(t) { attachDrag(t, slots); });

    /* Click-to-remove on filled slots */
    slots.forEach(function(slot) {
      slot.addEventListener('click', function() {
        if (!slot.classList.contains('filled')) return;
        returnSlotToken(slot);
      });
    });

    container.querySelector('#hint-btn').onclick     = useHint;
    container.querySelector('#validate-btn').onclick = validate;
    container.querySelector('#reset-btn').onclick    = resetPuzzle;
    container.querySelector('#puzzle-hint').textContent = '';
  }

  function returnSlotToken(slot) {
    var slotId = slot.dataset.slot;
    var typeUsed = slotState[slotId];
    if (!typeUsed) return;
    delete slotState[slotId];
    slot.classList.remove('filled','correct','wrong','shaking');
    var a = slot.dataset.accept;
    slot.textContent = a==='O' ? 'O?' : a==='lp' ? ':?' : '?';
    var pool = container.querySelector('#puzzle-pool');
    var allTokens = pool.querySelectorAll('.token.placed');
    for (var i = 0; i < allTokens.length; i++) {
      if (allTokens[i].dataset.type === typeUsed) {
        allTokens[i].classList.remove('placed');
        allTokens[i].style.visibility = '';
        break;
      }
    }
  }

  function attachDrag(token, slots) {
    var active = false, offX = 0, offY = 0;
    var origParent = token.parentElement;

    function startDrag(cx, cy) {
      if (token.classList.contains('placed')) return;
      active = true;
      var r = token.getBoundingClientRect();
      offX = cx - r.left; offY = cy - r.top;
      token.classList.add('dragging');
      token.style.left = (cx - offX) + 'px';
      token.style.top  = (cy - offY) + 'px';
      document.body.appendChild(token);
    }
    function moveDrag(cx, cy) {
      if (!active) return;
      token.style.left = (cx - offX) + 'px';
      token.style.top  = (cy - offY) + 'px';
    }
    function endDrag(cx, cy) {
      if (!active) return;
      active = false;
      token.classList.remove('dragging');
      token.style.left = ''; token.style.top = '';

      var target = null, bestD = Infinity;
      slots.forEach(function(slot) {
        if (slot.classList.contains('filled')) return;
        var r = slot.getBoundingClientRect();
        var d = Math.hypot(cx - (r.left + r.width/2), cy - (r.top + r.height/2));
        if (d < bestD && d < 90) { bestD = d; target = slot; }
      });

      if (target) {
        var accepts = target.dataset.accept.split(',');
        if (accepts.indexOf(token.dataset.type) !== -1) {
          target.textContent = token.textContent;
          target.classList.add('filled');
          slotState[target.dataset.slot] = token.dataset.type;
          token.classList.add('placed');
          token.style.visibility = 'hidden';
          origParent.appendChild(token);
        } else {
          /* Wrong type dropped in slot — flash but don't place */
          target.classList.add('shaking');
          setTimeout(function() { target.classList.remove('shaking'); }, 400);
          origParent.appendChild(token);
        }
      } else {
        origParent.appendChild(token);
      }
    }

    token.addEventListener('mousedown', function(e) { e.preventDefault(); startDrag(e.clientX, e.clientY); });
    document.addEventListener('mousemove', function(e) { moveDrag(e.clientX, e.clientY); });
    document.addEventListener('mouseup',   function(e) { endDrag(e.clientX, e.clientY); });

    token.addEventListener('touchstart', function(e) {
      var t = e.touches[0]; startDrag(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchmove', function(e) {
      if (!active) return;
      var t = e.touches[0]; moveDrag(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchend', function(e) {
      var t = e.changedTouches ? e.changedTouches[0] : {clientX:0,clientY:0};
      endDrag(t.clientX, t.clientY);
    });
  }

  function validate() {
    var hintEl = container.querySelector('#puzzle-hint');

    var allFilled = ['O-left','O-right','LP','bond-left','bond-right'].every(function(k) {
      return slotState[k] !== undefined;
    });
    if (!allFilled) {
      hintEl.textContent = '⚠ Faltan piezas — completá todos los espacios antes de validar.';
      hintEl.style.color = 'var(--confidential)';
      shakeEmptySlots();
      playBuzz();
      return;
    }

    var wrongSlots = [];
    var msgs       = [];

    if (slotState['O-left'] !== 'O') {
      wrongSlots.push('O-left');
      msgs.push('Pista: el SO₂ es solo azufre y oxígeno.');
    }
    if (slotState['O-right'] !== 'O') {
      wrongSlots.push('O-right');
      msgs.push('Pista: el SO₂ es solo azufre y oxígeno.');
    }
    if (slotState['LP'] !== 'lp') {
      wrongSlots.push('LP');
      msgs.push('Pista: el azufre tiene UN solo par libre en la estructura de Lewis.');
    }
    var bondsOK = (slotState['bond-left']==='=' && slotState['bond-right']==='–') ||
                  (slotState['bond-left']==='–' && slotState['bond-right']==='=');
    if (!bondsOK) {
      wrongSlots.push('bond-left'); wrongSlots.push('bond-right');
      msgs.push('Pista: pensá en la resonancia entre enlace simple y doble.');
    }

    if (wrongSlots.length === 0) {
      hintEl.textContent = '¡Estructura correcta! Construyendo modelo 3D…';
      hintEl.style.color = 'var(--acid-green)';
      setTimeout(goWin, 700);
      return;
    }

    /* Show first specific hint message */
    hintEl.textContent = '✗ Estructura inválida. ' + msgs[0];
    hintEl.style.color = 'var(--confidential)';
    playBuzz();

    /* Shake only wrong slots */
    wrongSlots.forEach(function(slotId) {
      var s = container.querySelector('.puzzle-slot[data-slot="' + slotId + '"]');
      if (s) s.classList.add('shaking');
    });

    /* Auto-clear wrong slots after animation */
    setTimeout(function() {
      wrongSlots.forEach(function(slotId) {
        var s = container.querySelector('.puzzle-slot[data-slot="' + slotId + '"]');
        if (s) {
          s.classList.remove('shaking');
          returnSlotToken(s);
        }
      });
    }, 650);
  }

  function shakeEmptySlots() {
    var slots = container.querySelectorAll('.puzzle-slot[data-accept]');
    slots.forEach(function(s) {
      if (!s.classList.contains('filled')) s.classList.add('shaking');
    });
    setTimeout(function() {
      slots.forEach(function(s) { s.classList.remove('shaking'); });
    }, 500);
  }

  function useHint() {
    var diff = DIFFICULTIES[currentDiff];
    if (hintsUsed >= diff.hints) return;
    var hintEl = container.querySelector('#puzzle-hint');
    hintEl.textContent = HINTS[hintsUsed];
    hintEl.style.color = 'var(--sulfur)';
    hintsUsed++;
    var left = diff.hints - hintsUsed;
    container.querySelector('#hints-left').textContent = left;
    if (left <= 0) container.querySelector('#hint-btn').disabled = true;
  }

  function resetPuzzle() {
    container.querySelectorAll('.puzzle-slot[data-accept]').forEach(function(s) {
      returnSlotToken(s);
    });
    container.querySelector('#puzzle-hint').textContent = '';
  }

  function goWin() {
    if (timerIv) { clearInterval(timerIv); timerIv = null; }
    var secs = ((performance.now() - startTime) / 1000).toFixed(1);
    transitionPhase(2, 3);
    var stats = container.querySelector('#win-stats');
    stats.textContent = 'Tiempo: ' + secs + 's · Pistas: ' + hintsUsed + ' · Nivel: ' + DIFFICULTIES[currentDiff].label;

    /* Best time for hard mode */
    if (currentDiff === 'hard') {
      var best = parseFloat(localStorage.getItem('lewis_best_hard') || '9999');
      if (parseFloat(secs) < best) {
        localStorage.setItem('lewis_best_hard', secs);
        stats.textContent += ' · ¡Nuevo récord difícil!';
      }
      /* Easter egg: hard mode solved in < 15s */
      if (parseFloat(secs) < 15 && window.E64.unlockEgg) {
        window.E64.unlockEgg('rami_egg_lewis');
      }
    } else {
      var bestN = parseFloat(localStorage.getItem('lewis_best_time') || '9999');
      if (parseFloat(secs) < bestN) {
        localStorage.setItem('lewis_best_time', secs);
        stats.textContent += ' · ¡Nuevo récord!';
      }
      if (parseFloat(secs) < 15 && window.E64.unlockEgg) {
        window.E64.unlockEgg('rami_egg_lewis');
      }
    }

    if (window.E64.fireConfetti) window.E64.fireConfetti();
    setTimeout(function() {
      var c = container.querySelector('#lewis-correct-canvas');
      if (c) window.E64.initCorrectScene(c);
    }, 60);

    container.querySelector('#replay-btn').onclick = function() {
      hintsUsed = 0;
      transitionPhase(3, 1);
      setTimeout(function() {
        var bc = container.querySelector('#lewis-broken-canvas');
        if (bc) brokenCtrl = window.E64.initBrokenScene(bc);
      }, 60);
    };
    container.querySelector('#continue-btn').onclick = function() {
      var btn = document.querySelector('.modal-backdrop.open .modal-close');
      if (btn) btn.click();
    };
  }

  function transitionPhase(from, to) {
    var f = container.querySelector('.lewis-phase[data-phase="' + from + '"]');
    var t = container.querySelector('.lewis-phase[data-phase="' + to + '"]');
    if (f) f.classList.remove('active');
    if (t) t.classList.add('active');
  }

  function playBuzz() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'square'; osc.frequency.value = 110; gain.gain.value = 0.05;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.18);
    } catch(e) {}
  }
};
