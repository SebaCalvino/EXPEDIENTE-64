window.E64 = window.E64 || {};

window.E64.buildLewisGame = function(container) {
  var HINTS = [
    'Recordá la regla del octeto: el átomo central debe completar 8 e⁻ contando enlaces y pares no enlazantes.',
    'El SO₂ tiene 18 electrones de valencia. Distribuilos pensando: ¿cuántos forman enlaces y cuántos quedan como pares?',
    'La geometría angular (~119°) sugiere 3 dominios electrónicos sobre el átomo central. ¿Cuáles?'
  ];
  container.innerHTML = [
    '<div class="game-shell lewis-shell">',
    '<h2>Prueba pericial · Estructura de Lewis</h2>',
    '<p class="game-tag">Reconstruí la verdadera identidad del SO₂.</p>',

    '<!-- PHASE 1 -->',
    '<div class="lewis-phase active" data-phase="1">',
      '<div class="lewis-3d" id="lewis-broken-3d" role="button" tabindex="0" aria-label="Estructura incorrecta, clic para corregir">',
        '<canvas id="lewis-broken-canvas"></canvas>',
        '<div class="lewis-3d-label">❗ ESTRUCTURA INCORRECTA</div>',
      '</div>',
      '<p class="lewis-3d-caption">Esta estructura es incorrecta. Tocala para corregirla.</p>',
    '</div>',

    '<!-- PHASE 2 -->',
    '<div class="lewis-phase" data-phase="2">',
      '<p class="lewis-3d-caption" style="margin-bottom:12px">Arrastrá los tokens al lugar correcto. 1 par libre · 2 oxígenos · 1 enlace doble + 1 simple.</p>',
      '<div class="puzzle-board" id="puzzle-board">',
        '<div class="puzzle-slot atom-slot slot-S" data-slot="S">S</div>',
        '<div class="puzzle-slot atom-slot slot-O-left"  data-slot="O-left"  data-accept="O">O?</div>',
        '<div class="puzzle-slot atom-slot slot-O-right" data-slot="O-right" data-accept="O">O?</div>',
        '<div class="puzzle-slot bond-slot slot-bond-left"  data-slot="bond-left"  data-accept="=,–">?</div>',
        '<div class="puzzle-slot bond-slot slot-bond-right" data-slot="bond-right" data-accept="=,–">?</div>',
        '<div class="puzzle-slot lp-slot   slot-LP"       data-slot="LP"       data-accept="lp">:?</div>',
      '</div>',
      '<div class="puzzle-pool" id="puzzle-pool">',
        '<div class="token O"         data-type="O"  >O</div>',
        '<div class="token O"         data-type="O"  >O</div>',
        '<div class="token bond"      data-type="="  >=</div>',
        '<div class="token bond"      data-type="–"  >–</div>',
        '<div class="token lp"        data-type="lp" >··</div>',
        '<div class="token distractor" data-type="H" >H</div>',
        '<div class="token distractor" data-type="N" >N</div>',
        '<div class="token distractor bond" data-type="–">–</div>',
      '</div>',
      '<p class="puzzle-hint" id="puzzle-hint"></p>',
      '<div class="puzzle-actions">',
        '<button class="btn dark" id="hint-btn">💡 Pista (<span id="hints-left">3</span>)</button>',
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

  var slotState   = {};
  var hintsUsed   = 0;
  var startTime   = 0;
  var brokenCtrl  = null;

  // Phase 1 — broken 3D
  var brokenCanvas = container.querySelector('#lewis-broken-canvas');
  brokenCtrl = window.E64.initBrokenScene(brokenCanvas);

  function goPhase2() {
    startTime = performance.now();
    if (brokenCtrl && brokenCtrl.dispose) brokenCtrl.dispose();
    transitionPhase(1, 2);
    setupPuzzle();
  }

  var broken3D = container.querySelector('#lewis-broken-3d');
  broken3D.addEventListener('click', goPhase2);
  broken3D.addEventListener('keypress', function(e) { if (e.key==='Enter'||e.key===' ') goPhase2(); });

  function setupPuzzle() {
    var slots  = container.querySelectorAll('.puzzle-slot[data-accept]');
    var tokens = container.querySelectorAll('.token');
    tokens.forEach(function(t) { attachDrag(t, slots); });
    slots.forEach(function(slot) {
      slot.addEventListener('click', function() {
        if (!slot.classList.contains('filled')) return;
        // return token to pool
        var slotId = slot.dataset.slot;
        var typeUsed = slotState[slotId];
        delete slotState[slotId];
        slot.classList.remove('filled', 'correct', 'wrong', 'shaking');
        var a = slot.dataset.accept;
        slot.textContent = a==='O' ? 'O?' : a==='lp' ? ':?' : '?';
        // return first matching hidden token
        var pool = container.querySelector('#puzzle-pool');
        var allTokens = pool.querySelectorAll('.token.placed');
        for (var i = 0; i < allTokens.length; i++) {
          if (allTokens[i].dataset.type === typeUsed) {
            allTokens[i].classList.remove('placed');
            allTokens[i].style.visibility = '';
            break;
          }
        }
      });
    });
    container.querySelector('#hint-btn').onclick     = useHint;
    container.querySelector('#validate-btn').onclick = validate;
    container.querySelector('#reset-btn').onclick    = resetPuzzle;
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
        if (slot.classList.contains('correct')) return;
        var r = slot.getBoundingClientRect();
        var d = Math.hypot(cx - (r.left + r.width/2), cy - (r.top + r.height/2));
        if (d < bestD && d < 80) { bestD = d; target = slot; }
      });

      if (target) {
        var accepts = target.dataset.accept.split(',');
        if (accepts.indexOf(token.dataset.type) !== -1) {
          target.textContent = token.textContent;
          target.classList.add('filled', 'correct');
          slotState[target.dataset.slot] = token.dataset.type;
          token.classList.add('placed');
          token.style.visibility = 'hidden';
          origParent.appendChild(token);
        } else {
          target.classList.add('wrong');
          setTimeout(function() { target.classList.remove('wrong'); }, 500);
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
    var board  = container.querySelector('#puzzle-board');

    // Check each requirement and identify wrong slots
    var problems = [];
    var wrongSlots = [];
    var slots = container.querySelectorAll('.puzzle-slot[data-accept]');

    var allFilled = ['O-left','O-right','LP','bond-left','bond-right'].every(function(k) {
      return slotState[k] !== undefined;
    });

    if (!allFilled) {
      hintEl.textContent = '⚠ Faltan piezas. Completá todos los espacios antes de validar.';
      hintEl.style.color = 'var(--confidential)';
      board.classList.add('wrong');
      playBuzz();
      slots.forEach(function(s) { if (!s.classList.contains('filled')) s.classList.add('shaking'); });
      setTimeout(function() {
        board.classList.remove('wrong');
        slots.forEach(function(s) { s.classList.remove('shaking'); });
      }, 600);
      return;
    }

    if (slotState['O-left'] !== 'O') { problems.push('lateral izquierdo'); wrongSlots.push('O-left'); }
    if (slotState['O-right'] !== 'O') { problems.push('lateral derecho'); wrongSlots.push('O-right'); }
    if (slotState['LP'] !== 'lp') { problems.push('par libre'); wrongSlots.push('LP'); }

    var bondsOK = (slotState['bond-left']==='=' && slotState['bond-right']==='–') ||
                  (slotState['bond-left']==='–' && slotState['bond-right']==='=');
    if (!bondsOK) {
      problems.push('combinación de enlaces');
      wrongSlots.push('bond-left'); wrongSlots.push('bond-right');
    }

    if (problems.length === 0) {
      hintEl.textContent = '¡Estructura correcta! Construyendo modelo 3D…';
      hintEl.style.color = 'var(--acid-green)';
      setTimeout(goWin, 700);
      return;
    }

    // WRONG state
    hintEl.textContent = '✗ Estructura inválida. Revisá: ' + problems.join(', ') + '. Tocá una pieza para retirarla.';
    hintEl.style.color = 'var(--confidential)';
    board.classList.add('wrong');
    playBuzz();
    wrongSlots.forEach(function(slotId) {
      var s = container.querySelector('.puzzle-slot[data-slot="' + slotId + '"]');
      if (s) s.classList.add('shaking');
    });
    setTimeout(function() {
      board.classList.remove('wrong');
      wrongSlots.forEach(function(slotId) {
        var s = container.querySelector('.puzzle-slot[data-slot="' + slotId + '"]');
        if (s) {
          s.classList.remove('shaking');
          // auto-clear wrong slots so user can retry
          if (slotState[slotId] !== undefined) {
            var typeUsed = slotState[slotId];
            delete slotState[slotId];
            s.classList.remove('filled', 'correct');
            var a = s.dataset.accept;
            s.textContent = a==='O' ? 'O?' : a==='lp' ? ':?' : '?';
            // return token
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
        }
      });
    }, 700);
  }

  function useHint() {
    if (hintsUsed >= 3) return;
    var hintEl = container.querySelector('#puzzle-hint');
    hintEl.textContent = HINTS[hintsUsed];
    hintEl.style.color = 'var(--sulfur)';
    hintsUsed++;
    container.querySelector('#hints-left').textContent = 3 - hintsUsed;
    if (hintsUsed >= 3) container.querySelector('#hint-btn').disabled = true;
  }

  function resetPuzzle() {
    Object.keys(slotState).forEach(function(k) { delete slotState[k]; });
    container.querySelectorAll('.puzzle-slot[data-accept]').forEach(function(s) {
      s.classList.remove('filled','correct','wrong');
      var a = s.dataset.accept;
      s.textContent = a==='O' ? 'O?' : a==='lp' ? ':?' : '?';
    });
    var pool = container.querySelector('#puzzle-pool');
    container.querySelectorAll('.token').forEach(function(t) {
      t.classList.remove('placed'); t.style.visibility = '';
      pool.appendChild(t);
    });
    container.querySelector('#puzzle-hint').textContent = '';
  }

  function goWin() {
    var elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    transitionPhase(2, 3);
    var stats = container.querySelector('#win-stats');
    stats.textContent = 'Tiempo: ' + elapsed + 's · Pistas usadas: ' + hintsUsed + '/3';
    var best = parseFloat(localStorage.getItem('lewis_best_time') || '9999');
    if (parseFloat(elapsed) < best) {
      localStorage.setItem('lewis_best_time', elapsed);
      stats.textContent += ' · ¡Nuevo récord!';
    }
    if (window.E64.fireConfetti) window.E64.fireConfetti();
    setTimeout(function() {
      var c = container.querySelector('#lewis-correct-canvas');
      if (c) window.E64.initCorrectScene(c);
    }, 60);
    container.querySelector('#replay-btn').onclick = function() {
      hintsUsed = 0;
      container.querySelector('#hints-left').textContent = '3';
      container.querySelector('#hint-btn').disabled = false;
      resetPuzzle();
      transitionPhase(3, 1);
      setTimeout(function() {
        var bc = container.querySelector('#lewis-broken-canvas');
        if (bc) brokenCtrl = window.E64.initBrokenScene(bc);
      }, 60);
    };
    container.querySelector('#continue-btn').onclick = function() {
      var btn = document.querySelector('.modal-backdrop.open .modal-close');
      if (btn) btn.click();
      var sec = document.getElementById('expediente');
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    };
  }

  function transitionPhase(from, to) {
    var f = container.querySelector('.lewis-phase[data-phase="' + from + '"]');
    var t = container.querySelector('.lewis-phase[data-phase="' + to + '"]');
    f.classList.remove('active');
    t.classList.add('active');
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
