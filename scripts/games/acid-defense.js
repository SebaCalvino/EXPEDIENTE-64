window.E64 = window.E64 || {};
window.E64.buildAcidDefense = function(container) {
  container.innerHTML = [
    '<div class="game-shell">',
      '<h2>Ácido Defense</h2>',
      '<p class="game-tag">Atrapá las gotas ácidas con el paraguas. Salvá los 10 árboles del bosque.</p>',
      '<div class="game-area">',
        '<div class="acid-meta">',
          '<span>Score: <b id="acid-score">0</b></span>',
          '<span>Árboles: <b id="acid-trees">10</b></span>',
          '<span>Mejor: <b id="acid-best">0</b></span>',
        '</div>',
        '<div style="position:relative">',
          '<canvas id="acid-canvas" class="game-canvas" width="600" height="500"></canvas>',
          '<div class="game-overlay" id="acid-over">',
            '<h3 id="acid-over-title">BOSQUE DEVASTADO</h3>',
            '<p id="acid-msg">La lluvia ácida arrasó todo.</p>',
            '<button class="btn" id="acid-restart">Reintentar</button>',
          '</div>',
        '</div>',
        '<div class="touch-pad">',
          '<button class="left" data-dir="left">◀</button>',
          '<button class="right" data-dir="right">▶</button>',
        '</div>',
      '</div>',
    '</div>'
  ].join('');

  var canvas  = container.querySelector('#acid-canvas');
  var ctx     = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var TREES = 10, treeW = W / TREES;
  var umbrellaX, drops, trees, score, alive, lastSpawn, spawnRate, fallSpeed, raf;
  var scoreEl   = container.querySelector('#acid-score');
  var treesEl   = container.querySelector('#acid-trees');
  var bestEl    = container.querySelector('#acid-best');
  var overlay   = container.querySelector('#acid-over');
  var titleEl   = container.querySelector('#acid-over-title');
  var msgEl     = container.querySelector('#acid-msg');
  bestEl.textContent = localStorage.getItem('acid_best') || '0';

  /* AudioContext */
  var audioCtx = null;
  function getAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return audioCtx;
  }

  function playDropCatch() {
    var ac = getAudio(); if (!ac) return;
    try {
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = 660;
      g.gain.setValueAtTime(0.15, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
      o.connect(g); g.connect(ac.destination);
      o.start(); o.stop(ac.currentTime + 0.15);
    } catch(e) {}
  }

  function playTreeDie() {
    var ac = getAudio(); if (!ac) return;
    try {
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(200, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.4);
      g.gain.setValueAtTime(0.2, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
      o.connect(g); g.connect(ac.destination);
      o.start(); o.stop(ac.currentTime + 0.55);
    } catch(e) {}
  }

  function playFertilizer() {
    var ac = getAudio(); if (!ac) return;
    try {
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle'; o.frequency.value = 440;
      g.gain.setValueAtTime(0.1, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
      o.connect(g); g.connect(ac.destination);
      o.start(); o.stop(ac.currentTime + 0.25);
    } catch(e) {}
  }

  /* Tree health: 0=dead, 1=damaged, 2=healthy */
  function reset() {
    umbrellaX = W / 2;
    drops = [];
    trees = new Array(TREES).fill(2); /* all healthy */
    score = 0; alive = true; lastSpawn = 0; spawnRate = 900; fallSpeed = 2.4;
    overlay.classList.remove('show');
    titleEl.textContent = 'BOSQUE DEVASTADO';
  }

  function spawn() {
    var r = Math.random();
    var type = r < 0.55 ? 'acid' : r < 0.80 ? 'clear' : 'fert';
    drops.push({ x: 30 + Math.random() * (W - 60), y: -20, type: type, r: 12 });
  }

  /* Draw a proper tree at (cx, groundY) with health 0/1/2 */
  function drawTree(cx, groundY, health) {
    var trunkH = 28, trunkW = 8;
    var trunkX = cx - trunkW / 2;
    var trunkY = groundY - trunkH;

    if (health === 0) {
      /* Dead tree — bare trunk + broken branches */
      ctx.fillStyle = '#4a2a0a';
      ctx.fillRect(trunkX, trunkY, trunkW, trunkH);
      /* Broken branches */
      ctx.strokeStyle = '#3a1a00';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, trunkY + 8); ctx.lineTo(cx - 12, trunkY - 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, trunkY + 14); ctx.lineTo(cx + 10, trunkY + 6); ctx.stroke();
      /* Skull emoji */
      ctx.font = '14px serif';
      ctx.textAlign = 'center';
      ctx.fillText('💀', cx, trunkY - 4);
    } else if (health === 1) {
      /* Damaged tree — brown trunk, sparse yellow-brown canopy */
      ctx.fillStyle = '#5c3a1e';
      ctx.fillRect(trunkX, trunkY, trunkW, trunkH);
      /* Sparse canopy — 3 small circles */
      var canopyColors = ['#6b7c2a', '#7a8a30', '#5a6a20'];
      var offsets = [[-8, -22], [8, -26], [0, -32]];
      offsets.forEach(function(o, i) {
        ctx.fillStyle = canopyColors[i];
        ctx.beginPath();
        ctx.arc(cx + o[0], trunkY + o[1], 10, 0, Math.PI * 2);
        ctx.fill();
      });
      /* Acid drip effect */
      ctx.fillStyle = 'rgba(201,48,44,0.4)';
      ctx.beginPath();
      ctx.arc(cx, trunkY - 10, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      /* Healthy tree — brown trunk, lush green layered canopy */
      /* Trunk */
      ctx.fillStyle = '#6b3a1e';
      ctx.fillRect(trunkX, trunkY, trunkW, trunkH);
      /* Trunk texture */
      ctx.strokeStyle = '#4a2a0a';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - 1, trunkY + 5); ctx.lineTo(cx - 1, trunkY + trunkH - 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 2, trunkY + 8); ctx.lineTo(cx + 2, trunkY + trunkH - 8); ctx.stroke();

      /* Layered canopy — 3 tiers */
      var tiers = [
        { y: trunkY - 8,  r: 18, color: '#2d6a2d' },
        { y: trunkY - 20, r: 15, color: '#3a8a3a' },
        { y: trunkY - 30, r: 11, color: '#4aaa4a' }
      ];
      tiers.forEach(function(t) {
        /* Shadow */
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(cx + 2, t.y + 3, t.r, t.r * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        /* Main circle */
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(cx, t.y, t.r, 0, Math.PI * 2);
        ctx.fill();
        /* Highlight */
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.arc(cx - t.r * 0.3, t.y - t.r * 0.3, t.r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  /* Draw umbrella */
  function drawUmbrella(x, y) {
    /* Handle */
    ctx.strokeStyle = '#8B5E3C';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 28);
    ctx.quadraticCurveTo(x + 10, y + 36, x + 14, y + 30);
    ctx.stroke();

    /* Canopy */
    var grad = ctx.createRadialGradient(x, y - 10, 2, x, y - 10, 52);
    grad.addColorStop(0, '#F5C518');
    grad.addColorStop(0.6, '#D4A810');
    grad.addColorStop(1, '#B8900A');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 52, Math.PI, Math.PI * 2);
    ctx.fill();

    /* Ribs */
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    var ribAngles = [-0.85, -0.5, -0.15, 0.15, 0.5, 0.85];
    ribAngles.forEach(function(a) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(Math.PI + a) * 52, y + Math.sin(Math.PI + a) * 52);
      ctx.stroke();
    });

    /* Tip */
    ctx.fillStyle = '#F5C518';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    /* Border */
    ctx.strokeStyle = '#B8900A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 52, Math.PI, Math.PI * 2);
    ctx.stroke();
  }

  /* Draw a raindrop */
  function drawDrop(d) {
    var x = d.x, y = d.y;
    if (d.type === 'acid') {
      /* Acid drop — red/green toxic */
      var grad = ctx.createRadialGradient(x - 2, y - 3, 1, x, y, d.r);
      grad.addColorStop(0, '#ff6666');
      grad.addColorStop(0.5, '#C9302C');
      grad.addColorStop(1, 'rgba(139,0,0,0.3)');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#C9302C';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(x, y - d.r * 1.4);
      ctx.bezierCurveTo(x + d.r, y - d.r * 0.5, x + d.r, y + d.r * 0.5, x, y + d.r);
      ctx.bezierCurveTo(x - d.r, y + d.r * 0.5, x - d.r, y - d.r * 0.5, x, y - d.r * 1.4);
      ctx.fill();
      ctx.shadowBlur = 0;
      /* SO₂ label */
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 7px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SO\u2082', x, y);
    } else if (d.type === 'fert') {
      /* Fertilizer — green sparkle */
      ctx.fillStyle = '#84CC16';
      ctx.shadowColor = '#84CC16';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x, y, d.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', x, y);
    } else {
      /* Clear water — blue transparent */
      ctx.fillStyle = 'rgba(147,197,253,0.7)';
      ctx.strokeStyle = 'rgba(96,165,250,0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y - d.r * 1.3);
      ctx.bezierCurveTo(x + d.r * 0.8, y - d.r * 0.4, x + d.r * 0.8, y + d.r * 0.4, x, y + d.r);
      ctx.bezierCurveTo(x - d.r * 0.8, y + d.r * 0.4, x - d.r * 0.8, y - d.r * 0.4, x, y - d.r * 1.3);
      ctx.fill();
      ctx.stroke();
    }
  }

  function loop(t) {
    if (!alive) return;
    if (t - lastSpawn > spawnRate) {
      spawn();
      lastSpawn = t;
      spawnRate = Math.max(280, spawnRate * 0.992);
      fallSpeed = Math.min(7, fallSpeed + 0.01);
    }

    /* Sky gradient */
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1a0a0a');
    sky.addColorStop(0.5, '#2a1010');
    sky.addColorStop(1, '#1a1a0a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    /* Acid rain atmosphere overlay */
    var atm = ctx.createLinearGradient(0, 0, 0, H * 0.6);
    atm.addColorStop(0, 'rgba(201,48,44,0.08)');
    atm.addColorStop(1, 'rgba(15,20,25,0)');
    ctx.fillStyle = atm;
    ctx.fillRect(0, 0, W, H);

    /* Ground */
    var groundY = H - 55;
    var groundGrad = ctx.createLinearGradient(0, groundY, 0, H);
    groundGrad.addColorStop(0, '#2a1a0a');
    groundGrad.addColorStop(0.3, '#1a1005');
    groundGrad.addColorStop(1, '#0a0800');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, W, H - groundY);

    /* Ground line */
    ctx.strokeStyle = 'rgba(245,197,24,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    /* Trees */
    for (var i = 0; i < TREES; i++) {
      var tx = i * treeW + treeW / 2;
      drawTree(tx, groundY, trees[i]);
    }

    /* Drops */
    drops = drops.filter(function(d) {
      d.y += fallSpeed;
      var hitGround = d.y > groundY - 10;
      var inUmbrella = Math.abs(d.x - umbrellaX) < 54 && d.y > H - 95 && d.y < H - 60;

      if (inUmbrella) {
        if (d.type === 'acid') {
          score += 10;
          playDropCatch();
          /* Splash effect */
          spawnSplash(d.x, H - 75, '#C9302C');
        } else if (d.type === 'fert') {
          score = Math.max(0, score - 5);
          playFertilizer();
        } else {
          score += 1;
          playDropCatch();
        }
        return false;
      }

      if (hitGround) {
        if (d.type === 'acid') {
          /* Kill nearest alive tree */
          var idx = Math.floor(d.x / treeW);
          var killed = false;
          for (var k = 0; k < TREES && !killed; k++) {
            var p = (idx + k) % TREES;
            if (trees[p] > 0) {
              trees[p]--;
              killed = true;
              playTreeDie();
              spawnSplash(d.x, groundY, '#C9302C');
            }
          }
          if (!trees.some(function(t) { return t > 0; })) endGame();
        }
        return false;
      }

      drawDrop(d);
      return true;
    });

    /* Draw splashes */
    splashes = splashes.filter(function(s) {
      s.life -= 0.06;
      if (s.life <= 0) return false;
      ctx.save();
      ctx.globalAlpha = s.life;
      ctx.fillStyle = s.color;
      s.particles.forEach(function(p) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * s.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      return true;
    });

    /* Umbrella */
    drawUmbrella(umbrellaX, H - 70);

    /* HUD */
    scoreEl.textContent = score;
    treesEl.textContent = trees.filter(function(t) { return t > 0; }).length;

    raf = requestAnimationFrame(loop);
  }

  /* Splash particles */
  var splashes = [];
  function spawnSplash(x, y, color) {
    var particles = [];
    for (var i = 0; i < 8; i++) {
      var angle = (Math.PI * 2 / 8) * i - Math.PI / 2;
      particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * (1 + Math.random() * 2),
        vy: Math.sin(angle) * (1 + Math.random() * 2) - 1,
        r: 2 + Math.random() * 2
      });
    }
    splashes.push({ particles: particles, life: 1, color: color });
  }

  function endGame() {
    alive = false;
    overlay.classList.add('show');
    msgEl.textContent = 'Score final: ' + score;
    var b = parseInt(localStorage.getItem('acid_best') || '0', 10);
    if (score > b) { localStorage.setItem('acid_best', score); bestEl.textContent = score; }
    if (window.E64.audio) window.E64.audio.playScreamer(0.5);
  }

  var onMove = function(e) {
    var rect = canvas.getBoundingClientRect();
    var cx = (e.clientX || (e.touches && e.touches[0].clientX) || 0) - rect.left;
    umbrellaX = Math.max(54, Math.min(W - 54, cx * (W / rect.width)));
  };
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('touchmove', function(e) { e.preventDefault(); onMove(e.touches[0]); }, { passive: false });

  var onKey = function(e) {
    getAudio();
    if (e.key === 'ArrowLeft' || e.key === 'a') umbrellaX = Math.max(54, umbrellaX - 30);
    else if (e.key === 'ArrowRight' || e.key === 'd') umbrellaX = Math.min(W - 54, umbrellaX + 30);
  };
  document.addEventListener('keydown', onKey);

  container.querySelectorAll('.touch-pad button').forEach(function(b) {
    b.addEventListener('click', function() {
      getAudio();
      if (b.dataset.dir === 'left') umbrellaX = Math.max(54, umbrellaX - 40);
      else umbrellaX = Math.min(W - 54, umbrellaX + 40);
    });
  });

  container.querySelector('#acid-restart').onclick = function() {
    getAudio();
    splashes = [];
    reset();
    raf = requestAnimationFrame(loop);
  };

  reset();
  raf = requestAnimationFrame(loop);

  container._cleanup = function() {
    alive = false;
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', onKey);
  };
};
