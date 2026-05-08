window.E64 = window.E64 || {};
window.E64.buildMemotest = function(container) {
  var PAIRS = [
    {id:'angular',a:'Geometría angular',b:'Mol. angular ~119°'},
    {id:'polar',a:'Polar',b:'μ = 1,63 D ↗'},
    {id:'so2',a:'SO₂',b:'Fórmula del Caso 64'},
    {id:'h2so3',a:'H₂SO₃',b:'🌧️ Lluvia ácida'},
    {id:'volcano',a:'Volcán',b:'🌋 20 Mt SO₂'},
    {id:'lewis',a:'Lewis',b:':  S  :\n  ↑↑'},
    {id:'fgd',a:'FGD / Scrubber',b:'🏭 + 🛡️ &gt;95%'},
    {id:'e220',a:'E220',b:'🍷 Conservante'}
  ];
  container.innerHTML = '<div class="game-shell"><h2>Memotest Químico</h2><p class="game-tag">Encontrá los 8 pares del SO₂.</p><div class="game-area"><div class="game-hud"><span>Movs: <b id="memo-moves">0</b></span><span>Tiempo: <b id="memo-time">0s</b></span><span>Mejor: <b id="memo-best">—</b></span></div><div class="memo-board" id="memo-board"></div><div class="game-controls"><button class="btn" id="memo-restart">↺ Reiniciar</button></div></div></div>';

  var board   = container.querySelector('#memo-board');
  var movesEl = container.querySelector('#memo-moves');
  var timeEl  = container.querySelector('#memo-time');
  var bestEl  = container.querySelector('#memo-best');
  bestEl.textContent = localStorage.getItem('memotest_best')||'—';
  var moves, matched, first, lock, startTime, timer;

  function shuffle(arr) {
    var a=[].concat(arr);
    for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=a[i];a[i]=a[j];a[j]=tmp;}
    return a;
  }
  function reset() {
    moves=0;matched=0;first=null;lock=false;movesEl.textContent=0;
    var cards=[];
    PAIRS.forEach(function(p){cards.push({id:p.id,html:p.a});cards.push({id:p.id,html:p.b});});
    var shuffled=shuffle(cards);
    board.innerHTML='';
    shuffled.forEach(function(c){
      var card=document.createElement('div');
      card.className='memo-card';
      card.dataset.id=c.id;
      card.innerHTML='<div class="memo-inner"><div class="memo-face front">?</div><div class="memo-face back">'+c.html+'</div></div>';
      card.addEventListener('click',function(){flip(card);});
      board.appendChild(card);
    });
    startTime=performance.now();
    if(timer)clearInterval(timer);
    timer=setInterval(function(){timeEl.textContent=Math.floor((performance.now()-startTime)/1000)+'s';},250);
  }
  function flip(card) {
    if(lock||card.classList.contains('flipped')||card.classList.contains('matched'))return;
    card.classList.add('flipped');
    if(!first){first=card;return;}
    moves++;movesEl.textContent=moves;
    if(first.dataset.id===card.dataset.id&&first!==card){
      first.classList.add('matched');card.classList.add('matched');matched++;first=null;
      if(matched===PAIRS.length)win();
    } else {
      lock=true;var a=first,b=card;
      setTimeout(function(){a.classList.remove('flipped');b.classList.remove('flipped');first=null;lock=false;},800);
    }
  }
  function win() {
    clearInterval(timer);
    var sec=Math.floor((performance.now()-startTime)/1000);
    var score=moves+'m/'+sec+'s';
    var best=localStorage.getItem('memotest_best');
    if(!best||moves<parseInt((best||'999m').split('m')[0],10)){localStorage.setItem('memotest_best',score);bestEl.textContent=score+' ★';}
    setTimeout(function(){alert('¡Caso resuelto! '+moves+' movimientos en '+sec+'s.');},300);
  }
  container.querySelector('#memo-restart').onclick=reset;
  reset();
  container._cleanup=function(){if(timer)clearInterval(timer);};
};
