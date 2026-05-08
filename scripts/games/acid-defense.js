window.E64 = window.E64 || {};
window.E64.buildAcidDefense = function(container) {
  container.innerHTML = '<div class="game-shell"><h2>Ácido Defense</h2><p class="game-tag">Atrapá las gotas ácidas. Salvá los árboles.</p><div class="game-area"><div class="acid-meta"><span>Score: <b id="acid-score">0</b></span><span>Árboles: <b id="acid-trees">10</b></span><span>Mejor: <b id="acid-best">0</b></span></div><div style="position:relative"><canvas id="acid-canvas" class="game-canvas" width="600" height="500"></canvas><div class="game-overlay" id="acid-over"><h3>BOSQUE DEVASTADO</h3><p id="acid-msg">La lluvia ácida arrasó todo.</p><button class="btn" id="acid-restart">Reintentar</button></div></div></div></div>';

  var canvas  = container.querySelector('#acid-canvas');
  var ctx     = canvas.getContext('2d');
  var W=canvas.width, H=canvas.height, TREES=10, treeW=W/TREES;
  var umbrellaX, drops, trees, score, alive, lastSpawn, spawnRate, fallSpeed, raf;
  var scoreEl = container.querySelector('#acid-score');
  var treesEl = container.querySelector('#acid-trees');
  var bestEl  = container.querySelector('#acid-best');
  var overlay = container.querySelector('#acid-over');
  var msgEl   = container.querySelector('#acid-msg');
  bestEl.textContent = localStorage.getItem('acid_best')||'0';

  function reset() {
    umbrellaX=W/2; drops=[]; trees=new Array(TREES).fill(true);
    score=0; alive=true; lastSpawn=0; spawnRate=900; fallSpeed=2.4;
    overlay.classList.remove('show');
  }
  function spawn() {
    var r=Math.random(), type=r<0.55?'acid':r<0.85?'clear':'fert';
    drops.push({x:30+Math.random()*(W-60),y:-20,type:type,r:12});
  }
  function loop(t) {
    if(!alive) return;
    if(t-lastSpawn>spawnRate){spawn();lastSpawn=t;spawnRate=Math.max(300,spawnRate*0.99);fallSpeed=Math.min(7,fallSpeed+0.012);}
    ctx.fillStyle='#0F1419';ctx.fillRect(0,0,W,H);
    var g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(201,48,44,0.1)');g.addColorStop(1,'rgba(15,20,25,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    drops=drops.filter(function(d){
      d.y+=fallSpeed;
      var hitGround=d.y>H-50;
      var inUmbrella=Math.abs(d.x-umbrellaX)<50&&d.y>H-90&&d.y<H-60;
      if(inUmbrella){if(d.type==='acid')score+=10;else if(d.type==='fert')score=Math.max(0,score-5);return false;}
      if(hitGround){
        if(d.type==='acid'){var idx=Math.floor(d.x/treeW);for(var i=0;i<TREES;i++){var p=(idx+i)%TREES;if(trees[p]){trees[p]=false;break;}}if(!trees.some(Boolean))endGame();}
        return false;
      }
      var col=d.type==='acid'?'#C9302C':d.type==='fert'?'#84CC16':'rgba(180,200,220,0.6)';
      ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(d.x,d.y,d.r*0.7,d.r,0,0,Math.PI*2);ctx.fill();
      return true;
    });
    for(var i=0;i<TREES;i++){var x=i*treeW+treeW/2,y=H-25;ctx.fillStyle=trees[i]?'#2F4F2F':'#5C3A1E';ctx.beginPath();ctx.arc(x,y-14,14,0,Math.PI*2);ctx.fill();ctx.fillStyle=trees[i]?'#1F3A1F':'#3F2810';ctx.fillRect(x-2,y,4,18);}
    ctx.fillStyle='#1a1410';ctx.fillRect(0,H-6,W,6);
    ctx.fillStyle='#F5C518';ctx.beginPath();ctx.arc(umbrellaX,H-70,50,Math.PI,Math.PI*2);ctx.fill();
    ctx.fillStyle='#0F1419';ctx.fillRect(umbrellaX-2,H-70,4,30);
    ctx.strokeStyle='#0F1419';ctx.lineWidth=2;ctx.beginPath();ctx.arc(umbrellaX,H-70,50,Math.PI,Math.PI*2);ctx.stroke();
    scoreEl.textContent=score;treesEl.textContent=trees.filter(Boolean).length;
    raf=requestAnimationFrame(loop);
  }
  function endGame(){alive=false;overlay.classList.add('show');msgEl.textContent='Score final: '+score;var b=parseInt(localStorage.getItem('acid_best')||'0',10);if(score>b){localStorage.setItem('acid_best',score);bestEl.textContent=score;}}
  var onMove=function(e){var rect=canvas.getBoundingClientRect();var cx=(e.clientX||(e.touches&&e.touches[0].clientX)||0)-rect.left;umbrellaX=Math.max(50,Math.min(W-50,cx*(W/rect.width)));};
  canvas.addEventListener('mousemove',onMove);
  canvas.addEventListener('touchmove',function(e){e.preventDefault();onMove(e.touches[0]);},{passive:false});
  var onKey=function(e){if(e.key==='ArrowLeft')umbrellaX=Math.max(50,umbrellaX-30);else if(e.key==='ArrowRight')umbrellaX=Math.min(W-50,umbrellaX+30);};
  document.addEventListener('keydown',onKey);
  container.querySelector('#acid-restart').onclick=function(){reset();raf=requestAnimationFrame(loop);};
  reset(); raf=requestAnimationFrame(loop);
  container._cleanup=function(){alive=false;cancelAnimationFrame(raf);document.removeEventListener('keydown',onKey);};
};
