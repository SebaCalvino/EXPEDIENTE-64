export function buildSulfusnake(container) {
  container.innerHTML = `
    <div class="game-shell">
      <h2>Sulfusnake</h2>
      <p class="game-tag">Capturá oxígenos para formar SO₂. Evitá agua y la sobreoxidación.</p>
      <div class="game-area">
        <div class="game-hud snake-meta">
          <span>Score: <b id="snake-score">0</b></span>
          <span>SO₂: <b id="snake-mol">0</b></span>
          <span>Mejor: <b id="snake-best">0</b></span>
        </div>
        <div style="position: relative;">
          <canvas id="snake-canvas" class="game-canvas" width="500" height="500"></canvas>
          <div class="game-overlay" id="snake-over">
            <h3 id="snake-title">GAME OVER</h3>
            <p id="snake-msg">Caso cerrado.</p>
            <button class="btn" id="snake-restart">Reintentar</button>
          </div>
        </div>
        <div class="touch-pad">
          <button class="up" data-dir="up">▲</button>
          <button class="left" data-dir="left">◀</button>
          <button class="right" data-dir="right">▶</button>
          <button class="down" data-dir="down">▼</button>
        </div>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#snake-canvas');
  const ctx = canvas.getContext('2d');
  const SIZE = 20;
  const CELL = canvas.width / SIZE;

  let snake, dir, nextDir, food, score, oxygenStreak, mols, alive, doublePoints, doubleEnd;
  const overlay = container.querySelector('#snake-over');
  const scoreEl = container.querySelector('#snake-score');
  const molEl = container.querySelector('#snake-mol');
  const bestEl = container.querySelector('#snake-best');
  const titleEl = container.querySelector('#snake-title');
  const msgEl = container.querySelector('#snake-msg');

  bestEl.textContent = localStorage.getItem('sulfusnake_best') || '0';

  function reset() {
    snake = [{x: 10, y: 10}, {x: 9, y: 10}, {x: 8, y: 10}];
    dir = {x: 1, y: 0};
    nextDir = dir;
    score = 0;
    oxygenStreak = 0;
    mols = 0;
    alive = true;
    doublePoints = false;
    doubleEnd = 0;
    spawnFood();
    overlay.classList.remove('show');
    updateHud();
  }

  function spawnFood() {
    const r = Math.random();
    let type;
    if (r < 0.05) type = 'water';
    else if (r < 0.12) type = 'vanadium';
    else type = 'oxygen';
    let x, y, ok;
    do {
      x = Math.floor(Math.random() * SIZE);
      y = Math.floor(Math.random() * SIZE);
      ok = !snake.some(s => s.x === x && s.y === y);
    } while (!ok);
    food = { x, y, type };
  }

  function updateHud() {
    scoreEl.textContent = score;
    molEl.textContent = mols;
  }

  function endGame(msg, title='GAME OVER') {
    alive = false;
    titleEl.textContent = title;
    msgEl.textContent = msg;
    overlay.classList.add('show');
    const best = parseInt(localStorage.getItem('sulfusnake_best') || '0', 10);
    if (score > best) {
      localStorage.setItem('sulfusnake_best', score);
      bestEl.textContent = score;
    }
  }

  function step() {
    if (!alive) return;
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.x >= SIZE || head.y < 0 || head.y >= SIZE) {
      return endGame('Te chocaste contra el muro.');
    }
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      return endGame('Te comiste la cola — autocombustión.');
    }
    snake.unshift(head);
    if (food && head.x === food.x && head.y === food.y) {
      if (food.type === 'water') {
        return endGame('Atrapado por H₂O — formaste H₂SO₃');
      }
      if (food.type === 'oxygen') {
        oxygenStreak++;
        const mult = doublePoints && performance.now() < doubleEnd ? 2 : 1;
        if (oxygenStreak === 2) {
          score += 10 * mult;
          mols++;
          oxygenStreak = 0;
        } else if (oxygenStreak === 3) {
          return endGame('Sobreoxidación a SO₃');
        } else {
          score += 2 * mult;
        }
      } else if (food.type === 'vanadium') {
        doublePoints = true;
        doubleEnd = performance.now() + 5000;
      }
      spawnFood();
    } else {
      snake.pop();
    }
    updateHud();
    draw();
  }

  function draw() {
    ctx.fillStyle = '#0F1419';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // grid
    ctx.strokeStyle = 'rgba(245,197,24,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i*CELL, 0); ctx.lineTo(i*CELL, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i*CELL); ctx.lineTo(canvas.width, i*CELL); ctx.stroke();
    }
    // food
    if (food) {
      const fx = food.x*CELL + CELL/2;
      const fy = food.y*CELL + CELL/2;
      let color, label;
      if (food.type === 'oxygen') { color = '#C9302C'; label = 'O'; }
      else if (food.type === 'water') { color = '#3B82F6'; label = 'H₂O'; }
      else { color = '#84CC16'; label = '★'; }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(fx, fy, CELL/2 - 2, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, fx, fy);
    }
    // snake
    snake.forEach((s, i) => {
      const x = s.x*CELL, y = s.y*CELL;
      if (i === 0) {
        ctx.fillStyle = '#F5C518';
        ctx.shadowColor = '#F5C518';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(x + CELL/2, y + CELL/2, CELL/2 - 2, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0F1419';
        ctx.font = 'bold 13px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', x + CELL/2, y + CELL/2);
      } else {
        ctx.fillStyle = '#D4A810';
        ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
      }
    });
  }

  // controls
  const turnTo = d => {
    const map = { up: {x:0,y:-1}, down: {x:0,y:1}, left: {x:-1,y:0}, right: {x:1,y:0} };
    const n = map[d];
    if (!n) return;
    if (n.x === -dir.x && n.y === -dir.y) return;
    nextDir = n;
  };

  const onKey = e => {
    const k = e.key.toLowerCase();
    if (['arrowup','w'].includes(k)) turnTo('up');
    else if (['arrowdown','s'].includes(k)) turnTo('down');
    else if (['arrowleft','a'].includes(k)) turnTo('left');
    else if (['arrowright','d'].includes(k)) turnTo('right');
  };
  document.addEventListener('keydown', onKey);

  container.querySelectorAll('.touch-pad button').forEach(b => {
    b.addEventListener('click', () => turnTo(b.dataset.dir));
    b.addEventListener('touchstart', e => { e.preventDefault(); turnTo(b.dataset.dir); });
  });

  container.querySelector('#snake-restart').onclick = () => reset();

  let interval = setInterval(step, 110);
  reset();
  draw();

  // cleanup hook
  container._cleanup = () => {
    clearInterval(interval);
    document.removeEventListener('keydown', onKey);
  };
}
