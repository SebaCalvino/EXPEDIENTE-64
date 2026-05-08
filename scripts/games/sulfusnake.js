window.E64 = window.E64 || {};
window.E64.buildSulfusnake = function(container) {
  container.innerHTML = '<div class="game-shell"><h2>Sulfusnake</h2><p class="game-tag">Capturá oxígenos para formar SO₂. Cuidado con el agua y la sobreoxidación.</p><div class="game-area"><div class="game-hud snake-meta"><span>Score: <b id="snake-score">0</b></span><span>SO₂: <b id="snake-mol">0</b></span><span>Mejor: <b id="snake-best">0</b></span></div><div style="position:relative"><canvas id="snake-canvas" class="game-canvas" width="500" height="500"></canvas><div class="game-overlay" id="snake-over"><h3 id="snake-title">GAME OVER</h3><p id="snake-msg">Caso cerrado.</p><button class="btn" id="snake-restart">Reintentar</button></div></div><div class="touch-pad"><button class="up" data-dir="up">▲</button><button class="left" data-dir="left">◀</button><button class="right" data-dir="right">▶</button><button class="down" data-dir="down">▼</button></div></div></div>';

  var canvas = container.querySelector('#snake-canvas');
  var ctx    = canvas.getContext('2d');
  var SIZE   = 20, CELL = canvas.width / SIZE;
  var snake, dir, nextDir, food, score, oxygenStreak, mols, alive;
  var overlay   = container.querySelector('#snake-over');
  var scoreEl   = container.querySelector('#snake-score');
  var molEl     = container.querySelector('#snake-mol');
  var bestEl    = container.querySelector('#snake-best');
  var titleEl   = container.querySelector('#snake-title');
  var msgEl     = container.querySelector('#snake-msg');
  bestEl.textContent = localStorage.getItem('sulfusnake_best') || '0';

  function reset() {
    snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    dir = {x:1,y:0}; nextDir = {x:1,y:0};
    score = 0; oxygenStreak = 0; mols = 0; alive = true;
    spawnFood(); overlay.classList.remove('show'); updateHud();
  }
  function spawnFood() {
    var r = Math.random(), type = r < 0.05 ? 'water' : r < 0.12 ? 'vanadium' : 'oxygen';
    var x, y, ok;
    do { x = Math.floor(Math.random()*SIZE); y = Math.floor(Math.random()*SIZE);
         ok = !snake.some(function(s){return s.x===x&&s.y===y;}); } while(!ok);
    food = {x:x,y:y,type:type};
  }
  function updateHud() { scoreEl.textContent=score; molEl.textContent=mols; }
  function endGame(msg, title) {
    alive=false; titleEl.textContent=title||'GAME OVER'; msgEl.textContent=msg;
    overlay.classList.add('show');
    var best = parseInt(localStorage.getItem('sulfusnake_best')||'0',10);
    if (score>best) { localStorage.setItem('sulfusnake_best',score); bestEl.textContent=score; }
  }
  function step() {
    if (!alive) return;
    dir = nextDir;
    var head = {x:snake[0].x+dir.x, y:snake[0].y+dir.y};
    if (head.x<0||head.x>=SIZE||head.y<0||head.y>=SIZE) return endGame('Chocaste contra el muro.');
    if (snake.some(function(s){return s.x===head.x&&s.y===head.y;})) return endGame('Te comiste la cola.');
    snake.unshift(head);
    if (food && head.x===food.x && head.y===food.y) {
      if (food.type==='water') return endGame('Atrapado por H₂O — formaste H₂SO₃');
      if (food.type==='oxygen') {
        oxygenStreak++;
        if (oxygenStreak===2) { score+=10; mols++; oxygenStreak=0; }
        else if (oxygenStreak===3) return endGame('Sobreoxidación a SO₃');
        else score+=2;
      }
      spawnFood();
    } else snake.pop();
    updateHud(); draw();
  }
  function draw() {
    ctx.fillStyle='#0F1419'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle='rgba(245,197,24,0.05)'; ctx.lineWidth=1;
    for(var i=0;i<=SIZE;i++){ctx.beginPath();ctx.moveTo(i*CELL,0);ctx.lineTo(i*CELL,canvas.height);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*CELL);ctx.lineTo(canvas.width,i*CELL);ctx.stroke();}
    if(food){
      var fx=food.x*CELL+CELL/2,fy=food.y*CELL+CELL/2;
      var col=food.type==='oxygen'?'#C9302C':food.type==='water'?'#3B82F6':'#84CC16';
      var lbl=food.type==='oxygen'?'O':food.type==='water'?'H₂O':'★';
      ctx.fillStyle=col;ctx.beginPath();ctx.arc(fx,fy,CELL/2-2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.font='bold 12px JetBrains Mono';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(lbl,fx,fy);
    }
    snake.forEach(function(s,i){
      var x=s.x*CELL,y=s.y*CELL;
      if(i===0){ctx.fillStyle='#F5C518';ctx.shadowColor='#F5C518';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(x+CELL/2,y+CELL/2,CELL/2-2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#0F1419';ctx.font='bold 13px JetBrains Mono';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('S',x+CELL/2,y+CELL/2);}
      else{ctx.fillStyle='#D4A810';ctx.fillRect(x+2,y+2,CELL-4,CELL-4);}
    });
  }
  function turnTo(d) {
    var map={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
    var n=map[d]; if(!n) return;
    if(n.x===-dir.x&&n.y===-dir.y) return;
    nextDir=n;
  }
  var onKey=function(e){
    var k=e.key.toLowerCase();
    if(k==='arrowup'||k==='w') turnTo('up');
    else if(k==='arrowdown'||k==='s') turnTo('down');
    else if(k==='arrowleft'||k==='a') turnTo('left');
    else if(k==='arrowright'||k==='d') turnTo('right');
  };
  document.addEventListener('keydown',onKey);
  container.querySelectorAll('.touch-pad button').forEach(function(b){
    b.addEventListener('click',function(){turnTo(b.dataset.dir);});
  });
  container.querySelector('#snake-restart').onclick=function(){reset();};
  var interval=setInterval(step,110);
  reset(); draw();
  container._cleanup=function(){clearInterval(interval);document.removeEventListener('keydown',onKey);};
};
