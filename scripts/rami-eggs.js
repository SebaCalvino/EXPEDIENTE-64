window.E64 = window.E64 || {};

(function() {
  var EGGS = [
    'rami_egg_snake',
    'rami_egg_konami',
    'rami_egg_stamp',
    'rami_egg_timeline',
    'rami_egg_quiz',
    'rami_egg_map',
    'rami_egg_lewis',
    'rami_egg_console',
    'rami_egg_idle'
  ];

  /* In-memory only — resets on every page load, no localStorage */
  var unlockedSet = {};

  /* Also wipe any stale localStorage entries so old data never leaks */
  EGGS.forEach(function(egg) { localStorage.removeItem(egg); });

  function countUnlocked() {
    return Object.keys(unlockedSet).length;
  }

  function isUnlocked(egg) {
    return !!unlockedSet[egg];
  }

  function unlockEgg(egg, silentNotifSounds) {
    if (isUnlocked(egg)) return;
    unlockedSet[egg] = true;
    var n = countUnlocked();
    showEggNotification(n, !!silentNotifSounds);
    updateRamiCard(n);
    if (n >= EGGS.length) revealRamiCard();
  }

  function showEggNotification(n, silentNotifSounds) {
    var existing = document.getElementById('rami-egg-notif');
    if (existing) existing.parentNode.removeChild(existing);

    var el = document.createElement('div');
    el.id = 'rami-egg-notif';
    el.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%) scale(0.7)',
      'z-index:99998',
      'background:#0a0a0a',
      'border:2px solid #C9302C',
      'color:#C9302C',
      'font-family:"Special Elite",monospace',
      'font-size:1.1rem',
      'letter-spacing:0.15em',
      'padding:28px 40px',
      'max-width:380px',
      'width:90vw',
      'text-align:center',
      'box-shadow:0 0 60px rgba(201,48,44,0.7), 0 0 120px rgba(201,48,44,0.3)',
      'opacity:0',
      'transition:opacity 0.3s, transform 0.3s'
    ].join(';');

    el.innerHTML = '<div style="color:#888;font-size:0.75em;margin-bottom:10px;letter-spacing:0.3em">⚠ PRUEBA RECUPERADA ⚠</div>' +
                   '<div style="font-size:1.6rem;margin-bottom:8px">' + n + ' / 9</div>' +
                   '<div style="font-size:0.7em;color:#666;letter-spacing:0.2em">REGISTROS DESBLOQUEADOS</div>';
    document.body.appendChild(el);

    /* Glitch + unlock sound (omitir si ya suena GoldenSound u otro screamer) */
    if (!silentNotifSounds) {
      if (window.E64.audio) {
        window.E64.audio.playGlitch();
        setTimeout(function() { window.E64.audio.playUnlock(); }, 80);
      } else {
        playGlitch();
      }
    }

    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        el.style.opacity = '1';
        el.style.transform = 'translate(-50%,-50%) scale(1)';
      });
    });
    setTimeout(function() {
      el.style.opacity = '0';
      el.style.transform = 'translate(-50%,-50%) scale(0.8)';
      setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
    }, 4000);
  }

  function playGlitch() {
    try {
      var ac = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ac.createOscillator(), g = ac.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, ac.currentTime);
      osc.frequency.setValueAtTime(80, ac.currentTime + 0.05);
      osc.frequency.setValueAtTime(160, ac.currentTime + 0.1);
      g.gain.setValueAtTime(0.04, ac.currentTime);
      g.gain.setValueAtTime(0, ac.currentTime + 0.15);
      osc.connect(g); g.connect(ac.destination);
      osc.start(); osc.stop(ac.currentTime + 0.15);
    } catch(e) {}
  }

  /* Update the Rami card pie-reveal overlay */
  function updateRamiCard(n) {
    var overlay = document.getElementById('rami-card-overlay');
    if (!overlay) return;
    /* Keep the photo fully hidden until all eggs are unlocked */
    overlay.style.background = '#000';
    overlay.style.opacity = '1';
    /* Update "?" count indicator */
    var indicator = document.getElementById('rami-egg-count');
    if (indicator) indicator.textContent = n + '/9';
  }

  function revealRamiCard() {
    window.E64.ramiUnlocked = true;
    sessionStorage.setItem('rami_all_unlocked', '1');
    var card = document.querySelector('.agent-card[data-agent="rami"]');
    if (!card) return;

    /* Hide the censor overlay */
    var overlay = document.getElementById('rami-card-overlay');
    if (overlay) overlay.style.display = 'none';

    /* Deciphering animation on censored lines */
    card.classList.add('rami-revealed');
    var bars = card.querySelectorAll('.rami-bar');
    bars.forEach(function(bar, idx) {
      setTimeout(function() {
        matrixReveal(bar, bar.dataset.reveal || '');
      }, idx * 200);
    });

    /* Show unlock button */
    var btn = document.getElementById('rami-unlock-btn');
    if (btn) {
      btn.style.display = 'block';
      btn.style.animation = 'blink 0.8s step-end infinite';
    }
  }

  function matrixReveal(el, finalText) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789█▓▒░';
    var i = 0;
    var iv = setInterval(function() {
      var scrambled = '';
      for (var c = 0; c < finalText.length; c++) {
        if (c < i) scrambled += finalText[c];
        else scrambled += chars[Math.floor(Math.random()*chars.length)];
      }
      el.textContent = scrambled;
      i++;
      if (i > finalText.length) { el.textContent = finalText; clearInterval(iv); }
    }, 60);
  }

  /* Public API */
  window.E64.unlockEgg     = unlockEgg;
  window.E64.isEggUnlocked = isUnlocked;
  window.E64.countEggs     = countUnlocked;
  window.E64.revealRamiCard = revealRamiCard;
  /* Flag para rami.html — se setea en sessionStorage cuando se completan todos */
  window.E64.ramiUnlocked  = false;

  /* Init: always start locked (n=0 on fresh load) */
  window.addEventListener('DOMContentLoaded', function() {
    updateRamiCard(0);
  });

  /* ── Idle egg: 2 min without interaction ── */
  var idleTimer = null;
  var IDLE_MS = 120000;
  function resetIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(function() {
      triggerIdleEgg();
    }, IDLE_MS);
  }
  function triggerIdleEgg() {
    /* Flash */
    var flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;z-index:99997;pointer-events:none;opacity:0;background:#000;transition:opacity 100ms;';
    document.body.appendChild(flash);
    if (window.E64.audio && window.E64.audio.playGoldenSound) {
      window.E64.audio.playGoldenSound(0.4, 2200);
    }
    requestAnimationFrame(function() { flash.style.opacity = '1'; });
    setTimeout(function() {
      /* Show Rami for 0.2s */
      if (document.querySelector('img[src*="ramapita"]') || true) {
        var img = document.createElement('img');
        img.src = 'assets/img/goldenRamiFrente.jpg';
        img.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;z-index:99998;pointer-events:none;filter:contrast(1.3) brightness(0.9);';
        document.body.appendChild(img);
        setTimeout(function() {
          flash.style.opacity = '0';
          if (img.parentNode) img.parentNode.removeChild(img);
          setTimeout(function() {
            if (flash.parentNode) flash.parentNode.removeChild(flash);
          }, 200);
        }, 200);
      }
    }, 100);
    window.E64.unlockEgg('rami_egg_idle', true);
    resetIdle();
  }
  ['click','keydown'].forEach(function(ev) {
    document.addEventListener(ev, resetIdle, { passive: true });
  });
  resetIdle();

  /* ── Console egg: type "rami" globally; "rami egg" = testing mode ── */
  var consoleBuffer = '';
  var ramiPending = null;

  function unlockAll(label) {
    EGGS.forEach(function(egg) { unlockedSet[egg] = true; });
    updateRamiCard(EGGS.length);
    revealRamiCard();
    setTimeout(triggerMegaUnlock, 400);
  }

  document.addEventListener('keydown', function(e) {
    /* Capture printable chars regardless of focus target — listener is on document */
    if (!e.key || e.key.length !== 1) return;
    consoleBuffer += e.key.toLowerCase();
    if (consoleBuffer.length > 30) consoleBuffer = consoleBuffer.slice(-30);

    /* Cheat 1: "pita completo" → desbloquea TODO + mega-unlock */
    if (consoleBuffer.includes('pita completo')) {
      consoleBuffer = '';
      if (ramiPending) { clearTimeout(ramiPending); ramiPending = null; }
      unlockAll();
      return;
    }

    /* Cheat 2: "rami egg" → testing mode, desbloquea TODO sin sonido */
    if (consoleBuffer.includes('rami egg')) {
      consoleBuffer = '';
      if (ramiPending) { clearTimeout(ramiPending); ramiPending = null; }
      unlockAll();
      return;
    }

    /* Console egg: type "rami" alone (debounce so "rami egg" can override) */
    if (consoleBuffer.includes('rami') && !isUnlocked('rami_egg_console')) {
      if (ramiPending) clearTimeout(ramiPending);
      ramiPending = setTimeout(function() {
        ramiPending = null;
        if (isUnlocked('rami_egg_console')) return;
        consoleBuffer = '';
        if (window.E64.audio && window.E64.audio.playGoldenSound) {
          window.E64.audio.playGoldenSound(0.9, 5200);
        }
        window.E64.unlockEgg('rami_egg_console', true);
      }, 700);
    }
  });

  /* ── Cross-egg hints system ── */
  /* After each unlock, show a cryptic hint pointing to the next egg */
  var EGG_HINTS = {
    'rami_egg_snake':    '▸ "El tiempo transforma el veneno en algo comestible. Buscá en la línea del tiempo, 1991."',
    'rami_egg_timeline': '▸ "Los registros mienten. Pero el mapa no. Dock Sud guarda algo. Hacé clic 5 veces."',
    'rami_egg_map':      '▸ "Hay un código que abre puertas. Arriba, arriba, abajo, abajo... recordás?"',
    'rami_egg_konami':   '▸ "El sello del expediente fue estampado 10 veces esa noche. Buscá el sello."',
    'rami_egg_stamp':    '▸ "Construí la molécula correcta. Hay un error en el Lewis. Encontralo."',
    'rami_egg_lewis':    '▸ "El quiz tiene una pregunta que no tiene respuesta correcta. O sí la tiene."',
    'rami_egg_quiz':     '▸ "Dejá de moverte. Esperá. Él aparece cuando nadie lo busca."',
    'rami_egg_idle':     '▸ "Abrí la consola del navegador. Escribí su nombre."',
    'rami_egg_console':  '▸ "Ya casi. Una prueba más. La serpiente esconde su cara."'
  };

  var _origUnlockEgg = window.E64.unlockEgg;
  window.E64.unlockEgg = function(egg, silentNotifSounds) {
    var wasUnlocked = isUnlocked(egg);
    _origUnlockEgg(egg, silentNotifSounds);
    if (!wasUnlocked && EGG_HINTS[egg]) {
      setTimeout(function() {
        showCrossHint(EGG_HINTS[egg]);
      }, 4500); /* after the main notification fades */
    }
    /* Check if all unlocked → trigger mega animation */
    if (countUnlocked() >= EGGS.length) {
      setTimeout(triggerMegaUnlock, 1000);
    }
  };

  function showCrossHint(text) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'left:50%',
      'transform:translateX(-50%) translateY(20px)',
      'z-index:99997',
      'background:#0a0a0a',
      'border:1px solid rgba(201,48,44,0.4)',
      'color:rgba(201,48,44,0.7)',
      'font-family:"Special Elite",monospace',
      'font-size:0.78rem',
      'letter-spacing:0.12em',
      'padding:10px 20px',
      'max-width:500px',
      'width:90vw',
      'text-align:center',
      'opacity:0',
      'transition:opacity 0.5s, transform 0.5s'
    ].join(';');
    el.innerHTML = '<span style="color:#555;font-size:0.65em;display:block;margin-bottom:4px">PISTA INTERCEPTADA</span>' + text;
    document.body.appendChild(el);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        el.style.opacity = '1';
        el.style.transform = 'translateX(-50%) translateY(0)';
      });
    });
    setTimeout(function() {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 600);
    }, 6000);
  }

  /* ── MEGA UNLOCK ANIMATION — all eggs collected ── */
  function triggerMegaUnlock() {
    if (window.E64._megaUnlockDone) return;
    window.E64._megaUnlockDone = true;

    var FADE_MS = 4000;
    var HOLD_MS = 10000;
    var totalMs = FADE_MS + HOLD_MS + FADE_MS;

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#000;opacity:0;overflow:hidden;';
    document.body.appendChild(overlay);

    var img = document.createElement('img');
    img.src = 'assets/img/RamiFrente.png';
    img.draggable = false;
    img.alt = '';
    img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;opacity:0;filter:brightness(0.26) contrast(1.35);';
    overlay.appendChild(img);

    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        var s = (FADE_MS / 1000) + 's';
        overlay.style.transition = 'opacity ' + s + ' ease-in-out';
        img.style.transition = 'opacity ' + s + ' ease-in-out';
        overlay.style.opacity = '1';
        img.style.opacity = '1';
      });
    });

    setTimeout(function() {
      overlay.style.opacity = '0';
      img.style.opacity = '0';
    }, FADE_MS + HOLD_MS);

    setTimeout(function() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (window.E64.revealRamiCard) window.E64.revealRamiCard();
      var btn = document.getElementById('rami-unlock-btn');
      if (btn) { btn.style.display = 'block'; btn.style.animation = 'blink 0.8s step-end infinite'; }
      var ramiCard = document.querySelector('.agent-card[data-agent="rami"]');
      if (ramiCard) ramiCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, totalMs);
  }

})();
