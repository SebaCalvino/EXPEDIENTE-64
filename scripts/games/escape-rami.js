window.E64 = window.E64 || {};
window.E64.buildEscapeRami = function(container) {
  container.innerHTML = [
    '<div class="game-shell" style="background:#000;color:#aaa;">',
      '<h2 style="color:#C9302C;font-family:\'Special Elite\',serif">Escapar de Rami</h2>',
      '<p class="game-tag" style="color:#666">Encontrá la salida. No te atrape.</p>',
      '<div class="game-area">',
        '<div class="game-hud snake-meta" style="background:#0a0a0a;border-color:#C9302C">',
          '<span style="color:#C9302C">Tiempo: <b id="esc-time">0</b>s</span>',
          '<span style="color:#C9302C">Mejor: <b id="esc-best">--</b>s</span>',
          '<span id="esc-status" style="color:#888">BUSCÁ LA SALIDA</span>',
        '</div>',
        '<div style="position:relative">',
          '<canvas id="esc-canvas" class="game-canvas" width="500" height="500"></canvas>',
          '<div class="game-overlay" id="esc-over" style="background:rgba(60,0,0,0.97)">',
            '<h3 id="esc-title" style="color:#C9302C">TE ATRAPÓ</h3>',
            '<p id="esc-msg" style="color:#ff4444">Rami Pita te encontró.</p>',
            '<button class="btn" id="esc-restart" style="border-color:#C9302C;color:#C9302C">Intentar de nuevo</button>',
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

  var canvas = container.querySelector('#esc-canvas');
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var CELL = 20, COLS = W / CELL, ROWS = H / CELL;

  var overlay = container.querySelector('#esc-over');
  var titleEl = container.querySelector('#esc-title');
  var msgEl   = container.querySelector('#esc-msg');
  var timeEl  = container.querySelector('#esc-time');
  var bestEl  = container.querySelector('#esc-best');
  var statusEl = container.querySelector('#esc-status');
  bestEl.textContent = localStorage.getItem('escape_best') || '--';

  var player, rami, maze, exit, alive, startTime, elapsed, raf;
  var ramiImg = null;
  (function() {
    var img = new Image();
    img.onload = function() { ramiImg = img; };
    img.src = 'assets/img/sebastiancalvino.png';
  })();

  /* AudioContext */
  var audioCtx = null;
  function getAudio() {
    if (!audioCtx) try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    return audioCtx;
  }

  function playFootstep() {
    var ac = getAudio(); if (!ac) return;
    try {
      var bufLen = ac.sampleRate * 0.05;
      var buf = ac.createBuffer(1, bufLen, ac.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen) * 0.3;
      var n = ac.createBufferSource(); n.buffer = buf;
      var f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
      var g = ac.createGain(); g.gain.value = 0.15;
      n.connect(f); f.connect(g); g.connect(ac.destination);
      n.start();
    } catch(e) {}
  }

  function playHeartbeat() {
    var ac = getAudio(); if (!ac) return;
    try {
      var now = ac.currentTime;
      function thump(t, vol) {
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = 50;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.connect(g); g.connect(ac.destination);
        o.start(t); o.stop(t + 0.25);
      }
      thump(now, 0.5);
      thump(now + 0.25, 0.3);
    } catch(e) {}
  }

  /* Maze generation — recursive backtracker */
  function generateMaze() {
    var grid = [];
    for (var r = 0; r < ROWS; r++) {
      grid[r] = [];
      for (var c = 0; c < COLS; c++) {
        grid[r][c] = { walls: [true, true, true, true], visited: false }; /* N E S W */
      }
    }

    function carve(r, c) {
      grid[r][c].visited = true;
      var dirs = [[0,-1,0,2],[1,0,1,3],[0,1,2,0],[- 1,0,3,1]];
      /* shuffle */
      dirs = [[0,-1,0,2],[1,0,1,3],[0,1,2,0],[-1,0,3,1]];
      for (var i = dirs.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = dirs[i]; dirs[i] = dirs[j]; dirs[j] = tmp;
      }
      dirs.forEach(function(d) {
        var nr = r + d[0], nc = c + d[1];
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !grid[nr][nc].visited) {
          grid[r][c].walls[d[2]] = false;
          grid[nr][nc].walls[d[3]] = false;
          carve(nr, nc);
        }
      });
    }
    carve(0, 0);
    return grid;
  }

  function reset() {
    maze = generateMaze();
    player = { r: 1, c: 1 };
    exit = { r: ROWS - 2, c: COLS - 2 };
    /* Rami starts far from player */
    rami = { r: Math.floor(ROWS / 2), c: Math.floor(COLS / 2), fr: Math.floor(ROWS / 2), fc: Math.floor(COLS / 2) };
    alive = true;
    startTime = Date.now();
    elapsed = 0;
    overlay.classList.remove('show');
    statusEl.textContent = 'BUSCÁ LA SALIDA';
  }

  /* BFS pathfinding for Rami */
  function bfsPath(fromR, fromC, toR, toC) {
    var queue = [[fromR, fromC]];
    var prev = {};
    prev[fromR + ',' + fromC] = null;
    var dirs = [[-1,0,0],[0,1,1],[1,0,2],[0,-1,3]]; /* N E S W */
    while (queue.length) {
      var cur = queue.shift();
      var r = cur[0], c = cur[1];
      if (r === toR && c === toC) {
        /* Reconstruct path */
        var path = [];
        var key = toR + ',' + toC;
        while (prev[key] !== null && prev[key] !== undefined) {
          path.unshift(prev[key]);
          key = prev[key][0] + ',' + prev[key][1];
        }
        return path;
      }
      dirs.forEach(function(d) {
        var nr = r + d[0], nc = c + d[1];
        var key = nr + ',' + nc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS &&
            !maze[r][c].walls[d[2]] && !(key in prev)) {
          prev[key] = [r, c];
          queue.push([nr, nc]);
        }
      });
    }
    return [];
  }

  var ramiMoveTimer = 0;
  var RAMI_SPEED = 600; /* ms between moves */
  var heartbeatTimer = 0;

  function loop(t) {
    if (!alive) return;
    elapsed = Math.floor((Date.now() - startTime) / 1000);
    timeEl.textContent = elapsed;

    /* Rami moves toward player */
    if (t - ramiMoveTimer > RAMI_SPEED) {
      ramiMoveTimer = t;
      var path = bfsPath(rami.r, rami.c, player.r, player.c);
      if (path.length > 0) {
        rami.r = path[0][0];
        rami.c = path[0][1];
      }
      /* Speed up over time */
      RAMI_SPEED = Math.max(200, 600 - elapsed * 4);
    }

    /* Heartbeat when Rami is close */
    var dist = Math.abs(rami.r - player.r) + Math.abs(rami.c - player.c);
    if (dist < 5 && t - heartbeatTimer > 800) {
      heartbeatTimer = t;
      playHeartbeat();
      statusEl.textContent = dist < 3 ? '⚠ ESTÁ MUY CERCA' : '⚠ SE ACERCA';
      statusEl.style.color = '#C9302C';
    } else if (dist >= 5) {
      statusEl.textContent = 'BUSCÁ LA SALIDA';
      statusEl.style.color = '#888';
    }

    /* Check catch */
    if (rami.r === player.r && rami.c === player.c) {
      triggerCaught();
      return;
    }

    /* Check exit */
    if (player.r === exit.r && player.c === exit.c) {
      triggerEscape();
      return;
    }

    draw();
    raf = requestAnimationFrame(loop);
  }

  function draw() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    /* Maze walls */
    ctx.strokeStyle = 'rgba(201,48,44,0.5)';
    ctx.lineWidth = 1.5;
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var x = c * CELL, y = r * CELL;
        var cell = maze[r][c];
        if (cell.walls[0]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + CELL, y); ctx.stroke(); }
        if (cell.walls[1]) { ctx.beginPath(); ctx.moveTo(x + CELL, y); ctx.lineTo(x + CELL, y + CELL); ctx.stroke(); }
        if (cell.walls[2]) { ctx.beginPath(); ctx.moveTo(x, y + CELL); ctx.lineTo(x + CELL, y + CELL); ctx.stroke(); }
        if (cell.walls[3]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + CELL); ctx.stroke(); }
      }
    }

    /* Exit */
    var ex = exit.c * CELL + CELL / 2, ey = exit.r * CELL + CELL / 2;
    ctx.fillStyle = '#84CC16';
    ctx.shadowColor = '#84CC16'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(ex, ey, CELL / 2 - 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px JetBrains Mono';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', ex, ey);

    /* Rami */
    var rx = rami.c * CELL + CELL / 2, ry = rami.r * CELL + CELL / 2;
    var dist = Math.abs(rami.r - player.r) + Math.abs(rami.c - player.c);
    if (ramiImg) {
      ctx.save();
      ctx.shadowColor = 'rgba(201,48,44,' + Math.max(0.3, 1 - dist * 0.08) + ')';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(rx, ry, CELL / 2 - 1, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(ramiImg, rx - CELL / 2 + 1, ry - CELL / 2 + 1, CELL - 2, CELL - 2);
      ctx.restore();
    } else {
      ctx.fillStyle = '#C9302C';
      ctx.beginPath(); ctx.arc(rx, ry, CELL / 2 - 2, 0, Math.PI * 2); ctx.fill();
    }

    /* Player */
    var px = player.c * CELL + CELL / 2, py = player.r * CELL + CELL / 2;
    ctx.fillStyle = '#F5C518';
    ctx.shadowColor = '#F5C518'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(px, py, CELL / 2 - 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0a0a0a'; ctx.font = 'bold 10px JetBrains Mono';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('S', px, py);

    /* Fog of war — darken cells far from player */
    for (var fr = 0; fr < ROWS; fr++) {
      for (var fc = 0; fc < COLS; fc++) {
        var d = Math.abs(fr - player.r) + Math.abs(fc - player.c);
        if (d > 6) {
          var alpha = Math.min(0.85, (d - 6) * 0.12);
          ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
          ctx.fillRect(fc * CELL, fr * CELL, CELL, CELL);
        }
      }
    }
  }

  function triggerCaught() {
    alive = false;

    /* Screamer overlay — Rama primero, luego I SEE YOU */
    var scr = document.createElement('div');
    scr.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#000;opacity:0;transition:opacity 60ms;display:flex;align-items:center;justify-content:center;overflow:hidden;';
    document.body.appendChild(scr);

    /* Sonido INMEDIATO */
    if (window.E64.audio) {
      window.E64.audio.playScreamer(1.2);
    } else {
      try {
        var ac2 = new (window.AudioContext || window.webkitAudioContext)();
        var o2 = ac2.createOscillator(), g2 = ac2.createGain();
        o2.type = 'sawtooth';
        o2.frequency.setValueAtTime(1200, ac2.currentTime);
        o2.frequency.exponentialRampToValueAtTime(60, ac2.currentTime + 1.2);
        g2.gain.setValueAtTime(0.5, ac2.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.001, ac2.currentTime + 1.3);
        o2.connect(g2); g2.connect(ac2.destination);
        o2.start(); o2.stop(ac2.currentTime + 1.4);
      } catch(e2) {}
    }

    /* Fade in negro */
    requestAnimationFrame(function() { scr.style.opacity = '1'; });

    /* Paso 1 (50ms): mostrar foto de Rama a pantalla completa */
    setTimeout(function() {
      var img = document.createElement('img');
      img.src = 'assets/img/sebastiancalvino.png';
      img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:contrast(1.6) saturate(0.2) sepia(0.3);animation:ramiShake 0.12s linear infinite;';
      scr.appendChild(img);
    }, 50);

    /* Paso 2 (600ms): mostrar "I SEE YOU" encima de la foto */
    setTimeout(function() {
      var txt = document.createElement('div');
      txt.textContent = 'I SEE YOU';
      txt.style.cssText = 'position:absolute;z-index:2;color:#C9302C;font-family:"Special Elite",serif;font-size:clamp(3rem,10vw,6rem);letter-spacing:0.2em;text-align:center;text-shadow:0 0 40px #C9302C,0 0 80px rgba(201,48,44,0.5);animation:ramiShake 0.15s linear infinite;';
      scr.appendChild(txt);
    }, 600);

    /* Paso 3 (1800ms): fade out y mostrar game over */
    setTimeout(function() {
      scr.style.transition = 'opacity 0.4s';
      scr.style.opacity = '0';
      setTimeout(function() {
        if (scr.parentNode) scr.parentNode.removeChild(scr);
        titleEl.textContent = 'TE ATRAPÓ';
        msgEl.textContent = 'Rami Pita te encontró. Tiempo: ' + elapsed + 's';
        overlay.classList.add('show');
      }, 400);
    }, 1800);
  }

  function triggerEscape() {
    alive = false;
    titleEl.textContent = '¡ESCAPASTE!';
    titleEl.style.color = '#84CC16';
    msgEl.textContent = 'Tiempo: ' + elapsed + 's. Rami sigue buscándote.';
    msgEl.style.color = '#84CC16';
    overlay.style.background = 'rgba(0,40,0,0.97)';
    overlay.classList.add('show');
    var best = localStorage.getItem('escape_best');
    if (!best || elapsed < parseInt(best, 10)) {
      localStorage.setItem('escape_best', elapsed);
      bestEl.textContent = elapsed;
    }
    if (window.E64.unlockEgg) window.E64.unlockEgg('rami_egg_snake'); /* bonus unlock */
    if (window.E64.audio) {
      window.E64.audio.playUnlock();
    }
  }

  function movePlayer(dr, dc) {
    if (!alive) return;
    var r = player.r, c = player.c;
    var dirIdx = dr === -1 ? 0 : dc === 1 ? 1 : dr === 1 ? 2 : 3;
    if (!maze[r][c].walls[dirIdx]) {
      player.r += dr;
      player.c += dc;
      playFootstep();
    }
  }

  var onKey = function(e) {
    getAudio();
    if (e.key === 'ArrowUp'    || e.key === 'w') movePlayer(-1, 0);
    else if (e.key === 'ArrowDown'  || e.key === 's') movePlayer(1, 0);
    else if (e.key === 'ArrowLeft'  || e.key === 'a') movePlayer(0, -1);
    else if (e.key === 'ArrowRight' || e.key === 'd') movePlayer(0, 1);
  };
  document.addEventListener('keydown', onKey);

  container.querySelectorAll('.touch-pad button').forEach(function(b) {
    b.addEventListener('click', function() {
      getAudio();
      var d = b.dataset.dir;
      if (d === 'up') movePlayer(-1, 0);
      else if (d === 'down') movePlayer(1, 0);
      else if (d === 'left') movePlayer(0, -1);
      else if (d === 'right') movePlayer(0, 1);
    });
  });

  container.querySelector('#esc-restart').onclick = function() {
    getAudio();
    RAMI_SPEED = 600;
    overlay.style.background = 'rgba(60,0,0,0.97)';
    titleEl.style.color = '#C9302C';
    msgEl.style.color = '#ff4444';
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
