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
                   '<div>' + n + '/' + EGGS.length + ' registros desbloqueados</div>';
    document.body.appendChild(el);

    /* Glitch + unlock sound */
    if (window.E64.audio) {
      window.E64.audio.playGlitch();
      setTimeout(function() { window.E64.audio.playUnlock(); }, 80);
    } else {
      playGlitch();
    }

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
    // Removed check for active input to allow typing "rami" anywhere
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
