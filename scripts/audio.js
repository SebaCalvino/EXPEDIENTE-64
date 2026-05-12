/* audio.js — Ambient + sound effects via WebAudio (no external files needed) */
window.E64 = window.E64 || {};

(function() {

  var ctx = null;
  var masterGain = null;
  var ambientGain = null;
  var sfxGain = null;
  var muted = false;
  var ambientStarted = false;
  var ambientNodes = [];
  var unlocked = false;

  function ensureCtx() {
    if (ctx) return ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.7;
      masterGain.connect(ctx.destination);

      ambientGain = ctx.createGain();
      ambientGain.gain.value = 0.0; /* fade in */
      ambientGain.connect(masterGain);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.9;
      sfxGain.connect(masterGain);
    } catch(e) { ctx = null; }
    return ctx;
  }

  /* Resume AudioContext on first user gesture (browser autoplay policy) */
  function unlockOnGesture() {
    if (unlocked) return;
    unlocked = true;
    ensureCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (!ambientStarted) startAmbient();
  }
  ['click','touchstart','keydown','pointerdown'].forEach(function(ev) {
    document.addEventListener(ev, unlockOnGesture, { once: true, passive: true });
  });

  /* ──────────────────────────────────────────
     AMBIENT — slow industrial drone + wind
  ────────────────────────────────────────── */
  function startAmbient() {
    if (!ensureCtx() || ambientStarted) return;
    ambientStarted = true;

    /* Low drone (factory hum 50–60Hz with harmonics) */
    function osc(freq, type, gainVal) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.value = gainVal;
      o.connect(g); g.connect(ambientGain);
      o.start();
      ambientNodes.push(o);
      /* slow LFO for organic movement */
      var lfo = ctx.createOscillator();
      var lfoGain = ctx.createGain();
      lfo.frequency.value = 0.07 + Math.random() * 0.1;
      lfoGain.gain.value = freq * 0.005;
      lfo.connect(lfoGain);
      lfoGain.connect(o.frequency);
      lfo.start();
      ambientNodes.push(lfo);
      return g;
    }
    osc(55,  'sine',     0.18);
    osc(82,  'sine',     0.06);
    osc(110, 'triangle', 0.04);
    osc(165, 'sine',     0.02);

    /* Pink noise wind */
    var bufLen = ctx.sampleRate * 4;
    var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    var data = buf.getChannelData(0);
    var b0=0,b1=0,b2=0,b3=0,b4=0,b5=0;
    for (var i = 0; i < bufLen; i++) {
      var w = Math.random() * 2 - 1;
      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
      b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
      b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
      data[i] = (b0+b1+b2+b3+b4+b5+w*0.5362)*0.11;
    }
    var noise = ctx.createBufferSource();
    noise.buffer = buf; noise.loop = true;
    var nFilt = ctx.createBiquadFilter();
    nFilt.type = 'lowpass';
    nFilt.frequency.value = 600;
    var nGain = ctx.createGain();
    nGain.gain.value = 0.08;
    noise.connect(nFilt); nFilt.connect(nGain); nGain.connect(ambientGain);
    noise.start();
    ambientNodes.push(noise);

    /* Slow filter sweep on the wind */
    var sweep = ctx.createOscillator();
    sweep.frequency.value = 0.04;
    var sweepGain = ctx.createGain();
    sweepGain.gain.value = 400;
    sweep.connect(sweepGain);
    sweepGain.connect(nFilt.frequency);
    sweep.start();
    ambientNodes.push(sweep);

    /* Fade in ambient over 3s */
    ambientGain.gain.setValueAtTime(0, ctx.currentTime);
    ambientGain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 3);

    /* Random distant rumbles */
    scheduleRumble();
  }

  function scheduleRumble() {
    if (!ctx) return;
    setTimeout(function() {
      if (!muted) playRumble();
      scheduleRumble();
    }, 12000 + Math.random() * 18000);
  }

  function playRumble() {
    if (!ctx || muted) return;
    var now = ctx.currentTime;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(40, now);
    o.frequency.exponentialRampToValueAtTime(18, now + 4);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.18, now + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 4);
    var f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 200;
    o.connect(f); f.connect(g); g.connect(sfxGain);
    o.start(now); o.stop(now + 4.2);
  }

  /* ──────────────────────────────────────────
     SCREAMER — Golden Freddy MP3 + Golden Sound MP4
  ────────────────────────────────────────── */
  var screamerAudio = null;
  var goldenAudio = null;
  (function() {
    try {
      screamerAudio = new Audio('assets/audio/screamer.mp3');
      screamerAudio.preload = 'auto';
    } catch(e) {}
    try {
      goldenAudio = new Audio('assets/audio/GoldenSound.mp4');
      goldenAudio.preload = 'auto';
    } catch(e) {}
  })();

  function showISeeYou() {
    var old = document.getElementById('e64-isee-overlay');
    if (old) old.parentNode.removeChild(old);

    var overlay = document.createElement('div');
    overlay.id = 'e64-isee-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;background:#000;opacity:0;transition:opacity 40ms;';
    document.body.appendChild(overlay);

    var img = document.createElement('img');
    img.src = 'assets/img/goldenRamiFrente.jpg';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;object-position:center top;filter:contrast(1.3) brightness(0.9);';
    overlay.appendChild(img);

    requestAnimationFrame(function() { overlay.style.opacity = '1'; });

    setTimeout(function() {
      overlay.style.transition = 'opacity 0.5s';
      overlay.style.opacity = '0';
      setTimeout(function() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 600);
    }, 2400);
  }

  function playScreamerSound(intensity) {
    if (muted) return;
    intensity = intensity || 1;
    if (screamerAudio) {
      try {
        screamerAudio.pause();
        screamerAudio.currentTime = 0;
        screamerAudio.volume = Math.min(1, 0.9 * intensity);
        screamerAudio.play().catch(function() {});
        setTimeout(function() {
          if (screamerAudio && !screamerAudio.paused) {
            screamerAudio.pause();
            screamerAudio.currentTime = 0;
          }
        }, 4000);
      } catch(e) {}
    }
  }

  /* Golden Sound — para konami, rami input, y captura en escape-rami */
  function playGoldenSound(intensity) {
    if (muted) return;
    intensity = intensity || 1;
    if (goldenAudio) {
      try {
        goldenAudio.pause();
        goldenAudio.currentTime = 0;
        goldenAudio.volume = Math.min(1, 0.95 * intensity);
        goldenAudio.play().catch(function() {});
        setTimeout(function() {
          if (goldenAudio && !goldenAudio.paused) {
            goldenAudio.pause();
            goldenAudio.currentTime = 0;
          }
        }, 4000);
      } catch(e) {}
    }
  }

  function playScreamer(intensity) {
    if (muted) return;
    playScreamerSound(intensity);
    /* "I SEE YOU" text overlay — 3 seconds, black bg, no image */
    showISeeYou();
  }

  /* ──────────────────────────────────────────
     UI / EVENT SOUNDS
  ────────────────────────────────────────── */
  function blip(freq, dur, type) {
    if (!ensureCtx() || muted) return;
    var now = ctx.currentTime;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.15, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(sfxGain);
    o.start(now); o.stop(now + dur + 0.05);
  }

  function playClick()    { blip(880, 0.06, 'square'); }
  function playUnlock()   { blip(523, 0.08, 'triangle'); setTimeout(function(){ blip(784, 0.18, 'triangle'); }, 80); }
  function playStamp()    { blip(120, 0.18, 'sawtooth'); }
  function playGlitch()   {
    if (!ensureCtx() || muted) return;
    var now = ctx.currentTime;
    var bufLen = ctx.sampleRate * 0.15;
    var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    var n = ctx.createBufferSource(); n.buffer = buf;
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 8;
    var g = ctx.createGain(); g.gain.value = 0.25;
    n.connect(f); f.connect(g); g.connect(sfxGain);
    n.start(now);
  }
  function playPaper()    { blip(1200, 0.04, 'square'); setTimeout(function(){ blip(800, 0.05, 'square'); }, 30); }

  /* ── Extra SFX ── */
  function playHeartbeat() {
    if (!ensureCtx() || muted) return;
    var now = ctx.currentTime;
    function thump(t, vol) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 55;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g); g.connect(sfxGain);
      o.start(t); o.stop(t + 0.25);
    }
    thump(now, 0.4);
    thump(now + 0.22, 0.25);
  }

  function playStaticBurst() {
    if (!ensureCtx() || muted) return;
    var now = ctx.currentTime;
    var bufLen = ctx.sampleRate * 0.08;
    var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
    var n = ctx.createBufferSource(); n.buffer = buf;
    var f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000;
    var g = ctx.createGain(); g.gain.value = 0.3;
    n.connect(f); f.connect(g); g.connect(sfxGain);
    n.start(now);
  }

  function playDrip() {
    if (!ensureCtx() || muted) return;
    var now = ctx.currentTime;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(1200, now);
    o.frequency.exponentialRampToValueAtTime(400, now + 0.15);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    o.connect(g); g.connect(sfxGain);
    o.start(now); o.stop(now + 0.25);
  }

  function playEerie() {
    if (!ensureCtx() || muted) return;
    var now = ctx.currentTime;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(220, now);
    o.frequency.linearRampToValueAtTime(180, now + 2);
    o.frequency.linearRampToValueAtTime(200, now + 4);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.06, now + 0.5);
    g.gain.linearRampToValueAtTime(0.04, now + 3.5);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
    o.connect(g); g.connect(sfxGain);
    o.start(now); o.stop(now + 5);
  }

  /* Schedule random eerie sounds */
  function scheduleEerie() {
    setTimeout(function() {
      if (!muted) playEerie();
      scheduleEerie();
    }, 25000 + Math.random() * 35000);
  }
  scheduleEerie();

  /* ──────────────────────────────────────────
     MUTE
  ────────────────────────────────────────── */
  function setMuted(v) {
    muted = !!v;
    if (masterGain) masterGain.gain.value = muted ? 0 : 0.7;
  }
  function toggleMuted() { setMuted(!muted); return muted; }
  function isMuted() { return muted; }

  /* Public API */
  window.E64.audio = {
    unlock:          unlockOnGesture,
    playScreamer:    playScreamer,
    playScreamerSound: playScreamerSound,
    playGoldenSound: playGoldenSound,
    showISeeYou:     showISeeYou,
    playClick:       playClick,
    playUnlock:      playUnlock,
    playStamp:       playStamp,
    playGlitch:      playGlitch,
    playPaper:       playPaper,
    playRumble:      playRumble,
    playHeartbeat:   playHeartbeat,
    playStaticBurst: playStaticBurst,
    playDrip:        playDrip,
    playEerie:       playEerie,
    setMuted:        setMuted,
    toggleMuted:     toggleMuted,
    isMuted:         isMuted
  };

})();
