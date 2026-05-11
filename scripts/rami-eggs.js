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

  function unlockEgg(egg) {
    if (isUnlocked(egg)) return;
    unlockedSet[egg] = true;
    var n = countUnlocked();
    showEggNotification(n);
    updateRamiCard(n);
    if (n >= EGGS.length) revealRamiCard();
  }

  function showEggNotification(n) {
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

    /* Glitch + unlock sound */
    if (window.E64.audio) {
      window.E64.audio.playGlitch();
      setTimeout(function() { window.E64.audio.playUnlock(); }, 80);
    } else {
      playGlitch();
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
    if (window.E64.audio && window.E64.audio.playScreamer) {
      window.E64.audio.playScreamer(0.4);
    }
    requestAnimationFrame(function() { flash.style.opacity = '1'; });
    setTimeout(function() {
      /* Show Rami for 0.2s */
      if (document.querySelector('img[src*="ramapita"]') || true) {
        var img = document.createElement('img');
        img.src = 'assets/img/sebastiancalvino.png';
        img.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:99998;pointer-events:none;filter:contrast(1.4) saturate(0.3) hue-rotate(-10deg);';
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
    unlockEgg('rami_egg_idle');
    resetIdle();
  }
  ['click','keydown'].forEach(function(ev) {
    document.addEventListener(ev, resetIdle, { passive: true });
  });
  resetIdle();

  /* ── Console egg: type "rami" globally ── */
  var consoleBuffer = '';
  document.addEventListener('keydown', function(e) {
    if (e.key && e.key.length === 1) {
      consoleBuffer += e.key.toLowerCase();
      if (consoleBuffer.length > 20) consoleBuffer = consoleBuffer.slice(-20);

      /* Cheat: "pita completo" → desbloquea todos los easter eggs */
      if (consoleBuffer.includes('pita completo')) {
        consoleBuffer = '';
        EGGS.forEach(function(egg) { unlockEgg(egg); });
        console.log('%cPITA COMPLETO — todos los registros desbloqueados.', 'color:#C9302C;font-size:12px;font-weight:bold');
        return;
      }

      if (consoleBuffer.includes('rami') && !isUnlocked('rami_egg_console')) {
        consoleBuffer = '';
        unlockEgg('rami_egg_console');
        console.log('%c ██████╗  █████╗ ███╗   ███╗██╗\n██╔══██╗██╔══██╗████╗ ████║██║\n██████╔╝███████║██╔████╔██║██║\n██╔══██╗██╔══██║██║╚██╔╝██║██║\n██║  ██║██║  ██║██║ ╚═╝ ██║██║\n╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝', 'color:#C9302C;font-size:10px');
        console.warn('Te oigo escribirme. — R.P.');
      }
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
  window.E64.unlockEgg = function(egg) {
    var wasUnlocked = isUnlocked(egg);
    _origUnlockEgg(egg);
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
    /* Already triggered? */
    if (window.E64._megaUnlockDone) return;
    window.E64._megaUnlockDone = true;

    /* 1. Screamer sound */
    if (window.E64.audio) {
      window.E64.audio.playScreamer(1.5);
    }

    /* 2. Full-screen terror overlay */
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#000;opacity:0;transition:opacity 0.3s;overflow:hidden;';
    document.body.appendChild(overlay);

    requestAnimationFrame(function() { overlay.style.opacity = '1'; });

    /* 3. Distortion CSS injected */
    var style = document.createElement('style');
    style.id = 'mega-unlock-style';
    style.textContent = [
      '@keyframes terrorDistort {',
      '  0%   { filter: none; }',
      '  10%  { filter: hue-rotate(180deg) saturate(3) contrast(2); }',
      '  20%  { filter: invert(1) hue-rotate(90deg); }',
      '  30%  { filter: saturate(0) contrast(3) brightness(0.3); }',
      '  40%  { filter: hue-rotate(-90deg) saturate(5); }',
      '  50%  { filter: invert(0.8) sepia(1) hue-rotate(200deg); }',
      '  60%  { filter: contrast(4) brightness(0.2); }',
      '  70%  { filter: hue-rotate(270deg) saturate(2); }',
      '  80%  { filter: invert(1); }',
      '  90%  { filter: saturate(0) brightness(0.1); }',
      '  100% { filter: none; }',
      '}',
      '@keyframes terrorShake {',
      '  0%,100% { transform: translate(0); }',
      '  10% { transform: translate(-15px, 8px) rotate(1deg); }',
      '  20% { transform: translate(12px, -10px) rotate(-1.5deg); }',
      '  30% { transform: translate(-8px, 15px) rotate(0.5deg); }',
      '  40% { transform: translate(18px, -5px) rotate(-2deg); }',
      '  50% { transform: translate(-12px, 12px) rotate(1deg); }',
      '  60% { transform: translate(8px, -8px) rotate(-0.5deg); }',
      '  70% { transform: translate(-18px, 5px) rotate(2deg); }',
      '  80% { transform: translate(10px, -12px) rotate(-1deg); }',
      '  90% { transform: translate(-5px, 8px) rotate(0.5deg); }',
      '}'
    ].join('\n');
    document.head.appendChild(style);

    /* 4. Show Rami face filling screen */
    setTimeout(function() {
      var img = document.createElement('img');
      img.src = 'assets/img/sebastiancalvino.png';
      img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:contrast(2) saturate(0) sepia(0.8) hue-rotate(-10deg);animation:terrorShake 0.1s linear infinite;';
      overlay.appendChild(img);

      /* Red text overlay */
      var txt = document.createElement('div');
      txt.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:20px;z-index:2;';
      txt.innerHTML = [
        '<div style="font-family:\'Special Elite\',serif;font-size:clamp(2rem,8vw,5rem);color:#C9302C;text-shadow:0 0 40px #C9302C;letter-spacing:0.1em;text-align:center;animation:terrorShake 0.15s linear infinite">EXPEDIENTE COMPLETO</div>',
        '<div style="font-family:\'Special Elite\',serif;font-size:clamp(0.8rem,2vw,1.2rem);color:#fff;letter-spacing:0.3em;text-align:center;opacity:0.8">ÉL LO SABE. VOS LO SABÉS.</div>'
      ].join('');
      overlay.appendChild(txt);

      /* Apply distortion to the whole page behind */
      document.body.style.animation = 'terrorDistort 0.5s linear 3';
    }, 300);

    /* 5. After 3s, fade out and redirect to rami.html */
    setTimeout(function() {
      overlay.style.transition = 'opacity 1s';
      overlay.style.opacity = '0';
      document.body.style.animation = '';
      setTimeout(function() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        /* Show unlock button / redirect */
        var btn = document.getElementById('rami-unlock-btn');
        if (btn) {
          btn.style.display = 'block';
          btn.style.animation = 'blink 0.8s step-end infinite';
          btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        /* Also trigger the card reveal */
        if (window.E64.revealRamiCard) window.E64.revealRamiCard();
      }, 1000);
    }, 3500);
  }

})();
