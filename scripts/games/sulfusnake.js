window.E64 = window.E64 || {};
window.E64.buildSulfusnake = function(container) {
  container.innerHTML = [
    '<div class="game-shell">',
      '<h2>Sulfusnake</h2>',
      '<p class="game-tag">Capturá oxígenos para formar SO₂. Cuidado con el agua y la sobreoxidación.</p>',
      '<div class="game-area">',
        '<div class="game-hud snake-meta">',
          '<span>Score: <b id="snake-score">0</b></span>',
          '<span>SO₂: <b id="snake-mol">0</b></span>',
          '<span>Mejor: <b id="snake-best">0</b></span>',
        '</div>',
        '<div style="position:relative">',
          '<canvas id="snake-canvas" class="game-canvas" width="500" height="500"></canvas>',
          '<div class="game-overlay" id="snake-over">',
            '<h3 id="snake-title">GAME OVER</h3>',
            '<p id="snake-msg">Caso cerrado.</p>',
            '<button class="btn" id="snake-restart">Reintentar</button>',
          '</div>',
        '</div>',
        '<div class="touch-pad">',
          '<button class="up" data-dir="up">▲</button>',
          '<button class="left" data-dir="left">◀</button>',
          '<button class="right" data-dir="right">▶</button>',
          '<button class="down" data-dir="down">▼</button>',
        '</div>',
      '</div>',
    '</div>'
  ].join('');

  var canvas   = container.querySelector('#snake-canvas');
  var ctx      = canvas.getContext('2d');
  var SIZE     = 20, CELL = canvas.width / SIZE;
  var snake, dir, nextDir, food, score, oxygenStreak, mols, alive;
  var overlay  = container.querySelector('#snake-over');
  var scoreEl  = container.querySelector('#snake-score');
  var molEl    = container.querySelector('#snake-mol');
  var bestEl   = container.querySelector('#snake-best');
  var titleEl  = container.querySelector('#snake-title');
  var msgEl    = container.querySelector('#snake-msg');
  bestEl.textContent = localStorage.getItem('sulfusnake_best') || '0';

  /* AudioContext — unlocked on first interaction */
  var audioCtx = null;
  function getAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return audioCtx;
  }

  /* Rami image */
  var ramiImg = null;
  (function() {
    var img = new Image();
    img.onload = function() { ramiImg = img; };
    img.src = 'assets/img/sebastiancalvino.png';
  })();

  function reset() {
    snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    dir = {x:1,y:0}; nextDir = {x:1,y:0};
    score = 0; oxygenStreak = 0; mols = 0; alive = true;
    spawnFood();
    overlay.classList.remove('show');
    overlay.style.background = '';
    titleEl.style.color = '';
    msgEl.style.color = '';
    updateHud();
  }

  function spawnFood() {
    var r = Math.random();
    /* 5% chance of Rami spawn */
    var type;
    if (r < 0.05) {
      type = 'rami';
    } else if (r < 0.05 + 0.05) {
      type = 'water';
    } else if (r < 0.12 + 0.05) {
      type = 'vanadium';
    } else {
      type = 'oxygen';
    }
    var x, y, ok;
    do {
      x = Math.floor(Math.random()*SIZE);
      y = Math.floor(Math.random()*SIZE);
      ok = !snake.some(function(s){return s.x===x&&s.y===y;});
    } while(!ok);
    food = {x:x, y:y, type:type};
  }

  function updateHud() { scoreEl.textContent=score; molEl.textContent=mols; }

  function endGame(msg, title, isRami) {
    alive = false;
    titleEl.textContent = title || 'GAME OVER';
    msgEl.textContent   = msg;
    if (isRami) {
      overlay.style.background = 'rgba(60,0,0,0.97)';
      titleEl.style.color = '#C9302C';
      msgEl.style.color   = '#ff4444';
    }
    overlay.classList.add('show');
    var best = parseInt(localStorage.getItem('sulfusnake_best')||'0',10);
    if (score > best) { localStorage.setItem('sulfusnake_best', score); bestEl.textContent = score; }
  }

  function triggerRamiScreamer() {
    alive = false;

    /* 1. Unlock easter egg */
    if (window.E64.unlockEgg) window.E64.unlockEgg('rami_egg_snake');

    /* 2. Screamer audio — usa el sistema central si está disponible */
    if (window.E64.audio && window.E64.audio.playScreamer) {
      window.E64.audio.playScreamer(1.2);
    } else {
      playScreamer();
    }

    /* 3. Black overlay */
    var overlay2 = document.createElement('div');
    overlay2.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#000;opacity:0;transition:opacity 80ms;display:flex;align-items:center;justify-content:center;overflow:hidden;';
    document.body.appendChild(overlay2);

    requestAnimationFrame(function() {
      overlay2.style.opacity = '1';
    });

    /* 4. Rami full-screen image */
    setTimeout(function() {
      if (ramiImg) {
        var img = document.createElement('img');
        img.src = ramiImg.src;
        img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:contrast(1.4) saturate(0.3) hue-rotate(-10deg);';
        overlay2.appendChild(img);
      } else {
        overlay2.style.background = '#8B0000';
        var txt = document.createElement('div');
        txt.textContent = 'R.P.';
        txt.style.cssText = 'font-size:25vw;color:#C9302C;font-family:serif;font-weight:bold;';
        overlay2.appendChild(txt);
      }
      /* Screen shake */
      overlay2.style.animation = 'ramiShake 0.15s linear infinite';
    }, 50);

    /* 5. End screamer after 1.2s */
    setTimeout(function() {
      overlay2.style.opacity = '0';
      setTimeout(function() {
        if (overlay2.parentNode) overlay2.parentNode.removeChild(overlay2);
        /* Game over modal */
        endGame(
          'Te comiste a Rami Pita. No deberías haber hecho eso. Algo se despertó.',
          'GAME OVER',
          true
        );
      }, 300);
    }, 1200);
  }

  function playScreamer() {
    var ctx2 = getAudio();
    if (!ctx2) return;
    try {
      var osc  = ctx2.createOscillator();
      var gain = ctx2.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx2.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx2.currentTime + 0.7);
      gain.gain.setValueAtTime(0.35, ctx2.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(ctx2.destination);
      osc.start();
      osc.stop(ctx2.currentTime + 0.7);

      /* Also a noise burst */
      var bufLen = ctx2.sampleRate * 0.4;
      var buf    = ctx2.createBuffer(1, bufLen, ctx2.sampleRate);
      var data   = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.2;
      var ns = ctx2.createBufferSource();
      ns.buffer = buf;
      var ng = ctx2.createGain();
      ng.gain.setValueAtTime(0.3, ctx2.currentTime);
      ng.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.4);
      ns.connect(ng);
      ng.connect(ctx2.destination);
      ns.start();
    } catch(e) {}
  }

  function step() {
    if (!alive) return;
    dir = nextDir;
    var head = {x:snake[0].x+dir.x, y:snake[0].y+dir.y};
    if (head.x<0||head.x>=SIZE||head.y<0||head.y>=SIZE) return endGame('Chocaste contra el muro.','GAME OVER',false);
    if (snake.some(function(s){return s.x===head.x&&s.y===head.y;})) return endGame('Te comiste la cola.','GAME OVER',false);
    snake.unshift(head);

    if (food && head.x===food.x && head.y===food.y) {
      var t = food.type;
      if (t === 'rami') {
        snake.pop();
        draw();
        triggerRamiScreamer();
        return;
      }
      if (t === 'water') return endGame('Atrapado por H₂O — formaste H₂SO₃','GAME OVER',false);
      if (t === 'oxygen') {
        oxygenStreak++;
        if (oxygenStreak === 2) { score += 10; mols++; oxygenStreak = 0; }
        else if (oxygenStreak === 3) return endGame('Sobreoxidación a SO₃','GAME OVER',false);
        else score += 2;
      }
      if (t === 'vanadium') { score += 5; }
      spawnFood();
    } else {
      snake.pop();
    }
    updateHud(); draw();
  }

  function draw() {
    ctx.fillStyle = '#0F1419';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* Grid */
    ctx.strokeStyle = 'rgba(245,197,24,0.04)';
    ctx.lineWidth = 0.5;
    for (var i = 0; i <= SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i*CELL,0); ctx.lineTo(i*CELL,canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i*CELL); ctx.lineTo(canvas.width,i*CELL); ctx.stroke();
    }

    /* Food */
    if (food) {
      var fx = food.x*CELL+CELL/2, fy = food.y*CELL+CELL/2;
      if (food.type === 'rami' && ramiImg) {
        /* Circular clipped Rami face */
        ctx.save();
        ctx.shadowColor = 'rgba(201,48,44,0.9)';
        ctx.shadowBlur  = 14;
        ctx.beginPath();
        ctx.arc(fx, fy, CELL/2-1, 0, Math.PI*2);
        ctx.clip();
        ctx.drawImage(ramiImg, fx-CELL/2+1, fy-CELL/2+1, CELL-2, CELL-2);
        ctx.restore();
        /* Red glow ring */
        ctx.save();
        ctx.strokeStyle = 'rgba(201,48,44,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx, fy, CELL/2+2, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
      } else {
        var col = food.type==='oxygen' ? '#C9302C' : food.type==='water' ? '#3B82F6' : food.type==='vanadium' ? '#84CC16' : '#C9302C';
        var lbl = food.type==='oxygen' ? 'O' : food.type==='water' ? 'H₂O' : food.type==='vanadium' ? '★' : '?';
        ctx.fillStyle = col;
        ctx.shadowColor = col; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(fx,fy,CELL/2-2,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px JetBrains Mono';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(lbl, fx, fy);
      }
    }

    /* Snake */
    snake.forEach(function(s, i) {
      var x=s.x*CELL, y=s.y*CELL;
      if (i === 0) {
        ctx.fillStyle = '#F5C518'; ctx.shadowColor = '#F5C518'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(x+CELL/2,y+CELL/2,CELL/2-2,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0F1419'; ctx.font = 'bold 13px JetBrains Mono';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('S', x+CELL/2, y+CELL/2);
      } else {
        ctx.fillStyle = '#D4A810'; ctx.fillRect(x+2,y+2,CELL-4,CELL-4);
      }
    });
  }

  function turnTo(d) {
    var map = {up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
    var n = map[d]; if (!n) return;
    if (n.x===-dir.x&&n.y===-dir.y) return;
    nextDir = n;
  }

  /* Inject ramiShake keyframe once */
  if (!document.getElementById('rami-shake-style')) {
    var style = document.createElement('style');
    style.id = 'rami-shake-style';
    style.textContent = '@keyframes ramiShake{0%{transform:translate(0)}25%{transform:translate(-8px,4px) rotate(0.5deg)}50%{transform:translate(8px,-4px) rotate(-0.5deg)}75%{transform:translate(-6px,6px)}100%{transform:translate(0)}}';
    document.head.appendChild(style);
  }

  var onKey = function(e) {
    /* Unlock audio on any key */
    getAudio();
    var k = e.key.toLowerCase();
    if (k==='arrowup'||k==='w')    turnTo('up');
    else if (k==='arrowdown'||k==='s')  turnTo('down');
    else if (k==='arrowleft'||k==='a')  turnTo('left');
    else if (k==='arrowright'||k==='d') turnTo('right');
  };
  document.addEventListener('keydown', onKey);

  /* Touch pad + restart */
  container.querySelectorAll('.touch-pad button').forEach(function(b) {
    b.addEventListener('click', function() { getAudio(); turnTo(b.dataset.dir); });
  });
  container.querySelector('#snake-restart').onclick = function() { getAudio(); reset(); };

  var interval = setInterval(step, 110);
  reset(); draw();

  container._cleanup = function() {
    clearInterval(interval);
    document.removeEventListener('keydown', onKey);
  };
};
