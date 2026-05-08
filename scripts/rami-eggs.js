window.E64 = window.E64 || {};

(function() {
  var EGGS = [
    'rami_egg_snake',    /* Comer a Rami en Sulfusnake */
    'rami_egg_konami',   /* Código Konami */
    'rami_egg_stamp',    /* 10 clicks al sello CONFIDENCIAL */
    'rami_egg_timeline', /* 7 clicks en "1991" en la timeline */
    'rami_egg_quiz',     /* Sacar 0/10 en el quiz */
    'rami_egg_map',      /* 5 clicks sobre Dock Sud */
    'rami_egg_lewis',    /* Resolver Lewis en menos de 15s */
    'rami_egg_console',  /* Escribir "rami" en consola */
    'rami_egg_idle',     /* 3 minutos sin tocar nada */
    'rami_egg_voting'    /* Votar CULPABLE 6 veces seguidas */
  ];

  function getUnlocked() {
    var unlocked = [];
    EGGS.forEach(function(egg) {
      if (localStorage.getItem(egg) === 'true') unlocked.push(egg);
    });
    return unlocked;
  }

  function countUnlocked() {
    return getUnlocked().length;
  }

  function isUnlocked(egg) {
    return localStorage.getItem(egg) === 'true';
  }

  function unlockEgg(egg) {
    if (isUnlocked(egg)) return; /* Already unlocked */
    localStorage.setItem(egg, 'true');
    var n = countUnlocked();
    showEggNotification(n);
    updateRamiCard(n);
    if (n >= 10) revealRamiCard();
  }

  function showEggNotification(n) {
    var existing = document.getElementById('rami-egg-notif');
    if (existing) existing.parentNode.removeChild(existing);

    var el = document.createElement('div');
    el.id = 'rami-egg-notif';
    el.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'right:24px',
      'z-index:9998',
      'background:#0a0a0a',
      'border:1px solid #C9302C',
      'color:#C9302C',
      'font-family:"Special Elite",monospace',
      'font-size:0.82rem',
      'letter-spacing:0.15em',
      'padding:12px 18px',
      'max-width:280px',
      'box-shadow:0 0 20px rgba(201,48,44,0.4)',
      'opacity:0',
      'transition:opacity 0.4s'
    ].join(';');

    el.innerHTML = '<div style="color:#888;font-size:0.7em;margin-bottom:4px">PRUEBA RECUPERADA</div>' +
                   '<div>' + n + '/10 registros desbloqueados</div>';
    document.body.appendChild(el);

    /* Glitch sound */
    playGlitch();

    requestAnimationFrame(function() {
      requestAnimationFrame(function() { el.style.opacity = '1'; });
    });
    setTimeout(function() {
      el.style.opacity = '0';
      setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
    }, 3500);
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
    var degrees = Math.min(n * 36, 360);
    /* Use conic-gradient to reveal progressively */
    if (degrees >= 360) {
      overlay.style.opacity = '0';
    } else {
      overlay.style.background = 'conic-gradient(transparent ' + degrees + 'deg, rgba(0,0,0,0.95) ' + degrees + 'deg)';
    }
    /* Update "?" count indicator */
    var indicator = document.getElementById('rami-egg-count');
    if (indicator) indicator.textContent = n + '/10';
  }

  function revealRamiCard() {
    var card = document.querySelector('.agent-card[data-agent="rami"]');
    if (!card) return;

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
  window.E64.unlockEgg    = unlockEgg;
  window.E64.isEggUnlocked = isUnlocked;
  window.E64.countEggs    = countUnlocked;
  window.E64.refreshRamiCard = function() { updateRamiCard(countUnlocked()); };

  /* Init: refresh card state on load */
  window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      var n = countUnlocked();
      updateRamiCard(n);
      if (n >= 10) revealRamiCard();
    }, 500);
  });

  /* ── Idle egg: 3 min without interaction ── */
  var idleTimer = null;
  var IDLE_MS = 180000;
  function resetIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(function() {
      triggerIdleEgg();
    }, IDLE_MS);
  }
  function triggerIdleEgg() {
    if (isUnlocked('rami_egg_idle')) return;
    /* Flash */
    var flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;z-index:99997;pointer-events:none;opacity:0;background:#000;transition:opacity 100ms;';
    document.body.appendChild(flash);
    requestAnimationFrame(function() { flash.style.opacity = '1'; });
    setTimeout(function() {
      /* Show Rami for 0.2s */
      if (document.querySelector('img[src*="ramapita"]') || true) {
        var img = document.createElement('img');
        img.src = 'assets/img/ramapita1.png';
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
  ['mousemove','click','keydown','scroll','touchstart'].forEach(function(ev) {
    document.addEventListener(ev, resetIdle, { passive: true });
  });
  resetIdle();

  /* ── Console egg: type "rami" globally ── */
  var consoleBuffer = '';
  document.addEventListener('keydown', function(e) {
    if (document.activeElement && document.activeElement.tagName.match(/INPUT|TEXTAREA|SELECT/)) return;
    if (e.key && e.key.length === 1) {
      consoleBuffer += e.key.toLowerCase();
      if (consoleBuffer.length > 10) consoleBuffer = consoleBuffer.slice(-10);
      if (consoleBuffer.includes('rami') && !isUnlocked('rami_egg_console')) {
        consoleBuffer = '';
        unlockEgg('rami_egg_console');
        console.log('%c ██████╗  █████╗ ███╗   ███╗██╗\n██╔══██╗██╔══██╗████╗ ████║██║\n██████╔╝███████║██╔████╔██║██║\n██╔══██╗██╔══██║██║╚██╔╝██║██║\n██║  ██║██║  ██║██║ ╚═╝ ██║██║\n╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝', 'color:#C9302C;font-size:10px');
        console.warn('Te oigo escribirme. — R.P.');
      }
    }
  });

})();
