/* audio.js — Ambient + sound effects via WebAudio (no external files needed) */
window.E64 = window.E64 || {};
/* Tiempo que la cara golden permanece a pantalla completa antes del fade (ms) */
window.E64.GOLDEN_SCREAMER_HOLD_MS = 10000;

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
     SCREAMER — screamer.mp3 (genérico) + GoldenSound.mp4 (goldenRamiFrente)
  ────────────────────────────────────────── */
  var screamerAudio = null;
  var goldenAudio = null;
  var goldenStopTimer = null;
  var screamerJumpscareHandT = null;
  var screamerJumpscareTextT = null;
  var screamerJumpscareDeadlineT = null;
  var screamerJumpscareSafety = null;
  var screamerJumpscareRoot = null;
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

  function tearDownScreamerJumpscare() {
    if (screamerJumpscareHandT) {
      clearTimeout(screamerJumpscareHandT);
      screamerJumpscareHandT = null;
    }
    if (screamerJumpscareTextT) {
      clearTimeout(screamerJumpscareTextT);
      screamerJumpscareTextT = null;
    }
    if (screamerJumpscareDeadlineT) {
      clearTimeout(screamerJumpscareDeadlineT);
      screamerJumpscareDeadlineT = null;
    }
    if (screamerJumpscareSafety) {
      clearTimeout(screamerJumpscareSafety);
      screamerJumpscareSafety = null;
    }
    if (screamerJumpscareRoot && screamerJumpscareRoot.parentNode) {
      screamerJumpscareRoot.parentNode.removeChild(screamerJumpscareRoot);
      screamerJumpscareRoot = null;
    }
  }

  /* Overlay screamer.mp3: 3 flashes de imagen alternando con "I SEE YOU", total ~4s. */
  var SCREAMER_JUMPSCARE_MS = 4500;

  function startScreamerJumpscareVisual() {
    tearDownScreamerJumpscare();

    var stale = document.getElementById('e64-screamer-jumpscare');
    if (stale && stale.parentNode) stale.parentNode.removeChild(stale);

    var root = document.createElement('div');
    root.id = 'e64-screamer-jumpscare';
    root.setAttribute('aria-hidden', 'true');
    root.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:100000',
      'pointer-events:none',
      'overflow:hidden',
      'background:#000'
    ].join(';');
    document.body.appendChild(root);
    screamerJumpscareRoot = root;

    var imgWrap = document.createElement('div');
    imgWrap.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;';
    var hands = document.createElement('img');
    hands.src = 'assets/img/GoldenRamiManos.png';
    hands.alt = '';
    hands.draggable = false;
    hands.style.cssText = [
      'width:min(88vw,88vh)',
      'height:min(88vw,88vh)',
      'object-fit:contain',
      'filter:contrast(1.2) brightness(0.88)',
      'opacity:0',
      'transition:opacity 0.07s linear',
      'pointer-events:none'
    ].join(';');
    imgWrap.appendChild(hands);
    root.appendChild(imgWrap);

    var isee = document.createElement('div');
    isee.textContent = 'I SEE YOU';
    isee.style.cssText = [
      'position:absolute',
      'font-family:Impact,Haettenschweiler,sans-serif',
      'font-weight:900',
      'font-size:clamp(1.4rem,5vw,3.2rem)',
      'letter-spacing:0.14em',
      'color:rgba(210,45,45,0.95)',
      'text-shadow:0 0 10px #000,0 0 28px rgba(201,48,44,0.8)',
      'white-space:nowrap',
      'opacity:0',
      'transition:opacity 0.06s linear',
      'pointer-events:none',
      'max-width:90vw'
    ].join(';');
    root.appendChild(isee);

    function isJumpscareLive() {
      return !!screamerJumpscareRoot && screamerJumpscareRoot === root && document.body.contains(root);
    }

    /* Deterministic sequence: image × 3 alternating with "I SEE YOU" × 3 */
    /* [type, startMs, durationMs] */
    var seq = [
      ['img',  0,    750],
      ['text', 900,  380],
      ['img',  1380, 750],
      ['text', 2250, 380],
      ['img',  2730, 750],
      ['text', 3600, 400]
    ];

    seq.forEach(function(step) {
      var type = step[0], start = step[1], dur = step[2];
      var positions = [
        [8, 10], [55, 10], [8, 72], [55, 72], [28, 40]
      ];
      var pos = positions[Math.floor(Math.random() * positions.length)];

      screamerJumpscareHandT = setTimeout(function() {
        if (!isJumpscareLive()) return;
        if (type === 'img') {
          hands.style.opacity = '1';
        } else {
          isee.style.left  = pos[0] + '%';
          isee.style.top   = pos[1] + '%';
          isee.style.transform = 'rotate(' + (Math.random() * 14 - 7) + 'deg)';
          isee.style.opacity = '1';
        }
        screamerJumpscareTextT = setTimeout(function() {
          if (!isJumpscareLive()) return;
          if (type === 'img') hands.style.opacity = '0';
          else isee.style.opacity = '0';
        }, dur);
      }, start);
    });
  }

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

    var holdMs = (window.E64 && window.E64.GOLDEN_SCREAMER_HOLD_MS) || 10000;
    setTimeout(function() {
      overlay.style.transition = 'opacity 0.5s';
      overlay.style.opacity = '0';
      setTimeout(function() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 600);
    }, holdMs);
  }

  function playScreamerSound(intensity, onEnded) {
    var doneOnce = false;
    function fireDoneOnce() {
      if (doneOnce) return;
      doneOnce = true;
      if (typeof onEnded === 'function') {
        try { onEnded(); } catch(cbErr) {}
      }
    }

    if (muted) {
      fireDoneOnce();
      return;
    }
    intensity = intensity || 1;
    if (!screamerAudio) {
      fireDoneOnce();
      return;
    }
    try {
      screamerAudio.onended = null;
      screamerAudio.pause();
      screamerAudio.currentTime = 0;
      screamerAudio.volume = Math.min(1, 0.9 * intensity);

      startScreamerJumpscareVisual();

      screamerJumpscareDeadlineT = setTimeout(function() {
        screamerJumpscareDeadlineT = null;
        screamerAudio.onended = null;
        if (screamerJumpscareSafety) {
          clearTimeout(screamerJumpscareSafety);
          screamerJumpscareSafety = null;
        }
        tearDownScreamerJumpscare();
        try {
          screamerAudio.pause();
          screamerAudio.currentTime = 0;
        } catch(ed) {}
        fireDoneOnce();
      }, SCREAMER_JUMPSCARE_MS);

      screamerAudio.onended = function() {
        screamerAudio.onended = null;
        if (screamerJumpscareDeadlineT) {
          clearTimeout(screamerJumpscareDeadlineT);
          screamerJumpscareDeadlineT = null;
        }
        if (screamerJumpscareSafety) {
          clearTimeout(screamerJumpscareSafety);
          screamerJumpscareSafety = null;
        }
        tearDownScreamerJumpscare();
        try {
          screamerAudio.pause();
          screamerAudio.currentTime = 0;
        } catch(e2) {}
        fireDoneOnce();
      };

      screamerJumpscareSafety = setTimeout(function() {
        screamerJumpscareSafety = null;
        screamerAudio.onended = null;
        if (screamerJumpscareDeadlineT) {
          clearTimeout(screamerJumpscareDeadlineT);
          screamerJumpscareDeadlineT = null;
        }
        if (screamerAudio && !screamerAudio.ended) {
          try {
            screamerAudio.pause();
            screamerAudio.currentTime = 0;
          } catch(e3) {}
        }
        tearDownScreamerJumpscare();
        fireDoneOnce();
      }, 45000);

      screamerAudio.play().catch(function() {
        screamerAudio.onended = null;
        if (screamerJumpscareDeadlineT) {
          clearTimeout(screamerJumpscareDeadlineT);
          screamerJumpscareDeadlineT = null;
        }
        if (screamerJumpscareSafety) {
          clearTimeout(screamerJumpscareSafety);
          screamerJumpscareSafety = null;
        }
        tearDownScreamerJumpscare();
        fireDoneOnce();
      });
    } catch(e) {
      tearDownScreamerJumpscare();
      fireDoneOnce();
    }
  }

  /* Golden Sound (mp4) — dura lo mismo que el overlay golden (por defecto GOLDEN_SCREAMER_HOLD_MS + fade). */
  function playGoldenSound(intensity, durationMs) {
    if (muted) return;
    intensity = intensity || 1;
    if (!goldenAudio) return;
    if (goldenStopTimer) {
      clearTimeout(goldenStopTimer);
      goldenStopTimer = null;
    }
    goldenAudio.onended = null;
    goldenAudio.loop = false;

    var ms;
    if (typeof durationMs === 'number' && durationMs > 0) {
      ms = durationMs;
    } else if (durationMs === false) {
      try {
        goldenAudio.pause();
        goldenAudio.currentTime = 0;
        goldenAudio.volume = Math.min(1, 0.95 * intensity);
        goldenAudio.onended = function() {
          goldenAudio.onended = null;
          try {
            goldenAudio.pause();
            goldenAudio.currentTime = 0;
          } catch(e2) {}
        };
        goldenAudio.play().catch(function() { goldenAudio.onended = null; });
      } catch(e) {}
      return;
    } else {
      var hold = (window.E64 && window.E64.GOLDEN_SCREAMER_HOLD_MS) || 10000;
      ms = hold + 800;
    }

    try {
      goldenAudio.pause();
      goldenAudio.currentTime = 0;
      goldenAudio.loop = true;
      goldenAudio.volume = Math.min(1, 0.95 * intensity);
      goldenAudio.play().catch(function() {
        if (goldenStopTimer) {
          clearTimeout(goldenStopTimer);
          goldenStopTimer = null;
        }
      });
      goldenStopTimer = setTimeout(function() {
        goldenStopTimer = null;
        goldenAudio.loop = false;
        try {
          goldenAudio.pause();
          goldenAudio.currentTime = 0;
        } catch(e3) {}
      }, ms);
    } catch(e) {}
  }

  function playScreamer(intensity) {
    if (muted) return;
    /* Overlay usa goldenRamiFrente — mismo audio que el resto de screamers golden */
    playGoldenSound(intensity);
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
