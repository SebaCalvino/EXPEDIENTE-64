export function buildAcidDefense(container) {
  container.innerHTML = `
    <div class="game-shell">
      <h2>Ácido Defense</h2>
      <p class="game-tag">Atrapá las gotas ácidas con el paraguas. Salvá los árboles.</p>
      <div class="game-area">
        <div class="acid-meta">
          <span>Score: <b id="acid-score">0</b></span>
          <span>Árboles: <b id="acid-trees">10</b></span>
          <span>Mejor: <b id="acid-best">0</b></span>
        </div>
        <div style="position: relative;">
          <canvas id="acid-canvas" class="game-canvas" width="600" height="500"></canvas>
          <div class="game-overlay" id="acid-over">
            <h3>BOSQUE DEVASTADO</h3>
            <p id="acid-msg">La lluvia ácida arrasó todo.</p>
            <button class="btn" id="acid-restart">Reintentar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#acid-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const TREES = 10;
  const treeW = W / TREES;

  let umbrellaX, drops, trees, score, alive, lastSpawn, spawnRate, fallSpeed, raf;
  const scoreEl = container.querySelector('#acid-score');
  const treesEl = container.querySelector('#acid-trees');
  const bestEl = container.querySelector('#acid-best');
  const overlay = container.querySelector('#acid-over');
  const msgEl = container.querySelector('#acid-msg');

  bestEl.textContent = localStorage.getItem('acid_best') || '0';

  function reset() {
    umbrellaX = W/2;
    drops = [];
    trees = Array(TREES).fill(true);
    score = 0;
    alive = true;
    lastSpawn = 0;
    spawnRate = 900;
    fallSpeed = 2.4;
    overlay.classList.remove('show');
    update();
  }

  function spawn() {
    const r = Math.random();
    let type;
    if (r < 0.55) type = 'acid';
    else if (r < 0.85) type = 'clear';
    else type = 'fert';
    drops.push({
      x: 30 + Math.random() * (W - 60),
      y: -20,
      type,
      r: 12
    });
  }

  function loop(t) {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    update(t);
  }

  function update(t = performance.now()) {
    ctx.fillStyle = '#0F1419';
    ctx.fillRect(0, 0, W, H);
    // sky tint
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, 'rgba(201,48,44,0.1)');
    grad.addColorStop(1, 'rgba(15,20,25,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);

    // spawn
    if (t - lastSpawn > spawnRate) {
      spawn();
      lastSpawn = t;
      spawnRate = Math.max(300, spawnRate * 0.99);
      fallSpeed = Math.min(7, fallSpeed + 0.012);
    }

    // drops
    drops = drops.filter(d => {
      d.y += fallSpeed;
      // catch?
      const hitGround = d.y > H - 50;
      const inUmbrella = Math.abs(d.x - umbrellaX) < 50 && d.y > H - 90 && d.y < H - 60;
      if (inUmbrella) {
        if (d.type === 'acid') { score += 10; }
        else if (d.type === 'fert') { score = Math.max(0, score - 5); }
        // clear: nothing
        return false;
      }
      if (hitGround) {
        if (d.type === 'acid') {
          // kill nearest tree
          const idx = Math.floor(d.x / treeW);
          for (let i = 0; i < TREES; i++) {
            const probe = (idx + i) % TREES;
            if (trees[probe]) { trees[probe] = false; break; }
          }
          if (!trees.some(t => t)) endGame();
        }
        return false;
      }
      // draw
      let color;
      if (d.type === 'acid') color = '#C9302C';
      else if (d.type === 'fert') color = '#84CC16';
      else color = 'rgba(180,200,220,0.6)';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.r * 0.7, d.r, 0, 0, Math.PI*2);
      ctx.fill();
      return true;
    });

    // trees
    for (let i = 0; i < TREES; i++) {
      const x = i * treeW + treeW/2;
      const y = H - 25;
      ctx.fillStyle = trees[i] ? '#2F4F2F' : '#5C3A1E';
      ctx.beginPath();
      ctx.arc(x, y - 14, 14, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = trees[i] ? '#1F3A1F' : '#3F2810';
      ctx.fillRect(x - 2, y, 4, 18);
    }
    // ground
    ctx.fillStyle = '#1a1410';
    ctx.fillRect(0, H - 6, W, 6);

    // umbrella
    ctx.fillStyle = '#F5C518';
    ctx.beginPath();
    ctx.arc(umbrellaX, H - 70, 50, Math.PI, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#0F1419';
    ctx.fillRect(umbrellaX - 2, H - 70, 4, 30);
    ctx.beginPath();
    ctx.arc(umbrellaX, H - 70, 50, Math.PI, Math.PI*2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0F1419';
    ctx.stroke();

    scoreEl.textContent = score;
    treesEl.textContent = trees.filter(Boolean).length;
  }

  function endGame() {
    alive = false;
    overlay.classList.add('show');
    msgEl.textContent = `Score final: ${score}`;
    const best = parseInt(localStorage.getItem('acid_best') || '0', 10);
    if (score > best) {
      localStorage.setItem('acid_best', score);
      bestEl.textContent = score;
    }
  }

  // controls
  const onMove = e => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX) || 0) - rect.left;
    umbrellaX = Math.max(50, Math.min(W - 50, x * (W/rect.width)));
  };
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('touchmove', e => { e.preventDefault(); onMove(e.touches[0]); }, { passive: false });

  const onKey = e => {
    if (e.key === 'ArrowLeft') umbrellaX = Math.max(50, umbrellaX - 30);
    else if (e.key === 'ArrowRight') umbrellaX = Math.min(W - 50, umbrellaX + 30);
  };
  document.addEventListener('keydown', onKey);

  container.querySelector('#acid-restart').onclick = () => { reset(); raf = requestAnimationFrame(loop); };

  reset();
  raf = requestAnimationFrame(loop);

  container._cleanup = () => {
    alive = false;
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', onKey);
  };
}
