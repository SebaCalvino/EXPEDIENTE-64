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
     SCREAMER — terrifying multi-layered sound
  ────────────────────────────────────────── */
  function playScreamer(intensity) {
    if (!ensureCtx()) return;
    if (muted) return;
    intensity = intensity || 1;
    var now = ctx.currentTime;

    /* Layer 1 — descending sawtooth scream (the classic horror hit) */
    var s1 = ctx.createOscillator();
    var g1 = ctx.createGain();
    s1.type = 'sawtooth';
    s1.frequency.setValueAtTime(1400, now);
    s1.frequency.exponentialRampToValueAtTime(45, now + 1.5);
    g1.gain.setValueAtTime(0.0001, now);
    g1.gain.exponentialRampToValueAtTime(0.5 * intensity, now + 0.05);
    g1.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
    s1.connect(g1); g1.connect(sfxGain);
    s1.start(now); s1.stop(now + 1.7);

    /* Layer 2 — detuned square (dissonance) */
    var s2 = ctx.createOscillator();
    var g2 = ctx.createGain();
    s2.type = 'square';
    s2.frequency.setValueAtTime(220, now);
    s2.frequency.exponentialRampToValueAtTime(60, now + 1.2);
    s2.detune.value = 30;
    g2.gain.setValueAtTime(0.0001, now);
    g2.gain.exponentialRampToValueAtTime(0.18 * intensity, now + 0.08);
    g2.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    s2.connect(g2); g2.connect(sfxGain);
    s2.start(now); s2.stop(now + 1.5);

    /* Layer 3 — white noise burst (impact) */
    var bufLen = ctx.sampleRate * 0.6;
    var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
    var noise = ctx.createBufferSource();
    noise.buffer = buf;
    var nFilt = ctx.createBiquadFilter();
    nFilt.type = 'highpass'; nFilt.frequency.value = 1500;
    var nGain = ctx.createGain();
    nGain.gain.value = 0.45 * intensity;
    noise.connect(nFilt); nFilt.connect(nGain); nGain.connect(sfxGain);
    noise.start(now);

    /* Layer 4 — sub bass thump */
    var sub = ctx.createOscillator();
    var subG = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(80, now);
    sub.frequency.exponentialRampToValueAtTime(25, now + 0.4);
    subG.gain.setValueAtTime(0.0001, now);
    subG.gain.exponentialRampToValueAtTime(0.7 * intensity, now + 0.02);
    subG.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    sub.connect(subG); subG.connect(sfxGain);
    sub.start(now); sub.stop(now + 1);

    /* Layer 5 — distorted "voice" (FM-modulated for unsettling timbre) */
    var v = ctx.createOscillator();
    var vMod = ctx.createOscillator();
    var vModG = ctx.createGain();
    var vG = ctx.createGain();
    v.type = 'triangle';
    v.frequency.value = 120;
    vMod.frequency.value = 17;
    vModG.gain.value = 80;
    vMod.connect(vModG); vModG.connect(v.frequency);
    vG.gain.setValueAtTime(0.0001, now + 0.1);
    vG.gain.exponentialRampToValueAtTime(0.22 * intensity, now + 0.3);
    vG.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
    v.connect(vG); vG.connect(sfxGain);
    vMod.start(now); v.start(now); vMod.stop(now + 1.6); v.stop(now + 1.6);
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
    unlock:        unlockOnGesture,
    playScreamer:  playScreamer,
    playClick:     playClick,
    playUnlock:    playUnlock,
    playStamp:     playStamp,
    playGlitch:    playGlitch,
    playPaper:     playPaper,
    playRumble:    playRumble,
    setMuted:      setMuted,
    toggleMuted:   toggleMuted,
    isMuted:       isMuted
  };

})();
