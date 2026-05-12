/* rami.js — Secret page script */
(function() {

  /* ── Access check — usa sessionStorage (válido sólo en la misma sesión) ── */
  if (sessionStorage.getItem('rami_all_unlocked') !== '1') {
    showAccessDenied();
    return;
  }

  /* ── Loader ── */
  var loader = document.getElementById('rami-loader');
  var bar    = document.getElementById('loader-bar');
  var pct    = 0;
  var iv = setInterval(function() {
    pct += Math.random() * 8 + 2;
    if (pct >= 100) { pct = 100; clearInterval(iv); finishLoad(); }
    if (bar) bar.style.width = pct + '%';
  }, 80);

  function finishLoad() {
    setTimeout(function() {
      if (loader) { loader.style.opacity = '0'; loader.style.transition = 'opacity 0.6s'; }
      setTimeout(function() {
        if (loader) loader.style.display = 'none';
        var page = document.getElementById('rami-page');
        if (page) page.classList.add('visible');
        initDrone();
        startSubliminalsTimer();
      }, 600);
    }, 300);
  }

  /* ── Custom cursor ── */
  var cursor = document.getElementById('rami-cursor');
  if (cursor) {
    document.addEventListener('mousemove', function(e) {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    });
  }

  /* ── Drone audio ── */
  var droneCtx = null, droneGain = null, droneRunning = false;
  var muted = false;

  function initDrone() {
    try {
      droneCtx  = new (window.AudioContext || window.webkitAudioContext)();
      droneGain = droneCtx.createGain();
      droneGain.gain.value = 0.08;
      droneGain.connect(droneCtx.destination);

      /* 60Hz fundamental */
      function makeOsc(freq, type, gainVal) {
        var o = droneCtx.createOscillator();
        var g = droneCtx.createGain();
        o.type = type || 'sine';
        o.frequency.value = freq;
        g.gain.value = gainVal || 0.4;
        o.connect(g);
        g.connect(droneGain);
        o.start();
        return o;
      }
      makeOsc(60, 'sine', 0.5);
      makeOsc(120, 'sine', 0.2);
      makeOsc(180, 'sine', 0.1);

      /* Pink noise */
      var bufLen = droneCtx.sampleRate * 2;
      var buf    = droneCtx.createBuffer(1, bufLen, droneCtx.sampleRate);
      var data   = buf.getChannelData(0);
      var b0=0,b1=0,b2=0,b3=0,b4=0,b5=0;
      for (var i = 0; i < bufLen; i++) {
        var wn = Math.random() * 2 - 1;
        b0=0.99886*b0+wn*0.0555179; b1=0.99332*b1+wn*0.0750759;
        b2=0.96900*b2+wn*0.1538520; b3=0.86650*b3+wn*0.3104856;
        b4=0.55000*b4+wn*0.5329522; b5=-0.7616*b5-wn*0.0168980;
        data[i] = (b0+b1+b2+b3+b4+b5+wn*0.5362)*0.11;
      }
      var noiseSrc = droneCtx.createBufferSource();
      noiseSrc.buffer = buf;
      noiseSrc.loop = true;
      var nGain = droneCtx.createGain();
      nGain.gain.value = 0.08;
      noiseSrc.connect(nGain);
      nGain.connect(droneGain);
      noiseSrc.start();

      droneRunning = true;
    } catch(e) {}
  }

  var muteBtn = document.getElementById('mute-btn');
  if (muteBtn) {
    muteBtn.addEventListener('click', function() {
      muted = !muted;
      if (droneGain) droneGain.gain.value = muted ? 0 : 0.08;
      muteBtn.textContent = muted ? '🔇 SIN AUDIO' : '🔊 AUDIO: ON';
    });
    /* Drone needs user gesture to start */
    document.addEventListener('click', function() {
      if (droneCtx && droneCtx.state === 'suspended') droneCtx.resume();
    }, { once: true });
  }

  /* ── Subliminal flashes every 30-60s ── */
  function startSubliminalsTimer() {
    function scheduleNext() {
      var delay = 30000 + Math.random() * 30000;
      setTimeout(function() {
        triggerSubliminale();
        scheduleNext();
      }, delay);
    }
    scheduleNext();
  }

  var ramiPhotos = ['assets/img/goldenRamiFrente.jpg','assets/img/ramapita2.png','assets/img/ramapita3.png'];
  function triggerSubliminale() {
    var flash = document.getElementById('subliminal-flash');
    if (!flash) return;
    var img = flash.querySelector('img');
    if (!img) { img = document.createElement('img'); flash.appendChild(img); }
    img.src = ramiPhotos[Math.floor(Math.random()*ramiPhotos.length)];
    flash.style.opacity = '0.9';
    setTimeout(function() { flash.style.opacity = '0'; flash.style.transition = 'opacity 60ms'; }, 80);
    flash.style.transition = 'none';
  }

  /* ── Dynamic "today" in sightings ── */
  var todayEl = document.getElementById('rami-today');
  if (todayEl) {
    var d = new Date();
    todayEl.textContent = d.toLocaleDateString('es-AR', { day:'numeric', month:'long', year:'numeric' });
  }

  /* ── Access denied screen ── */
  function showAccessDenied() {
    var denied = document.getElementById('access-denied');
    if (!denied) return;
    denied.style.display = 'flex';

    var count = 5;
    var countEl = document.getElementById('access-count');
    if (countEl) countEl.textContent = count;
    var iv2 = setInterval(function() {
      count--;
      if (countEl) countEl.textContent = count;
      if (count <= 0) {
        clearInterval(iv2);
        window.location.href = 'index.html';
      }
    }, 1000);
  }

})();
