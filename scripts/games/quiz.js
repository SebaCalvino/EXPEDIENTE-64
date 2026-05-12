window.E64 = window.E64 || {};
window.E64.buildQuiz = function(container) {
  container.innerHTML = '<div class="game-shell quiz-shell"><h2>¿Cuánto sabés del SO₂?</h2><p class="game-tag">10 preguntas · 15 segundos cada una.</p><div id="quiz-body"></div></div>';
  var body = container.querySelector('#quiz-body');
  var QS   = window.E64.QUIZ_QUESTIONS;
  var current=0, correct=0, timer=null, timeLeft=15;
  /* Índice correcto tras barajar opciones en cada pregunta */
  var quizShuffledCorrect = 0;

  function renderQuestion() {
    var q=QS[current];
    var order = [0, 1, 2, 3];
    for (var si = order.length - 1; si > 0; si--) {
      var sj = Math.floor(Math.random() * (si + 1));
      var swap = order[si]; order[si] = order[sj]; order[sj] = swap;
    }
    var shuffledOpts = order.map(function(oi) { return q.options[oi]; });
    quizShuffledCorrect = order.indexOf(q.correct);

    var pct=(current/QS.length)*100;
    body.innerHTML='<div class="quiz-progress"><div class="quiz-progress-fill" style="width:'+pct+'%"></div></div><div class="quiz-meta"><span>Pregunta '+(current+1)+' / '+QS.length+'</span><span>⏱ <b id="quiz-time">'+timeLeft+'</b>s</span></div><h3 class="quiz-question">'+q.q+'</h3><div class="quiz-options">'+shuffledOpts.map(function(o,i){return '<button class="quiz-option" data-i="'+i+'">'+o+'</button>';}).join('')+'</div><p class="quiz-feedback" id="quiz-fb"></p>';
    body.querySelectorAll('.quiz-option').forEach(function(btn){btn.onclick=function(){answer(parseInt(btn.dataset.i,10));};});
    timeLeft=15;
    if(timer)clearInterval(timer);
    timer=setInterval(function(){timeLeft--;var t=body.querySelector('#quiz-time');if(t)t.textContent=timeLeft;if(timeLeft<=0)answer(-1);},1000);
  }
  function answer(i) {
    clearInterval(timer);
    var q=QS[current];
    body.querySelectorAll('.quiz-option').forEach(function(o,idx){o.disabled=true;if(idx===quizShuffledCorrect)o.classList.add('correct');if(idx===i&&i!==quizShuffledCorrect)o.classList.add('wrong');});
    if(i===quizShuffledCorrect)correct++;
    body.querySelector('#quiz-fb').textContent=q.explanation;
    setTimeout(function(){current++;if(current>=QS.length)showResult();else renderQuestion();},1800);
  }
  function showQuizScreamer(onDone) {
    /* screamer.mp3 + overlay parpadeante (GoldenRamiManos + I SEE YOU) — ver playScreamerSound en audio.js */
    if (window.E64.audio && window.E64.audio.playScreamerSound) {
      window.E64.audio.playScreamerSound(0.9, onDone);
    } else {
      onDone();
    }
  }

  function showResult() {
    /* Easter egg: 0/10 → screamer breve, después resultado normal */
    if (correct === 0 && window.E64.unlockEgg) {
      window.E64.unlockEgg('rami_egg_quiz', true);
      showQuizScreamer(function() { renderNormalResult(); });
      return;
    }
    renderNormalResult();
  }

  function renderNormalResult() {
    var rank=correct<=3?'Pasante':correct<=6?'Detective junior':correct<=9?'Investigador senior':'Jefe del Expediente 64';
    body.innerHTML='<div class="quiz-result"><p class="quiz-meta" style="justify-content:center">RANGO ASIGNADO</p><div class="rank">'+rank+'</div><p class="score">'+correct+' / '+QS.length+' correctas</p><div class="puzzle-actions"><button class="btn" id="quiz-retry">↺ Reintentar</button><button class="btn dark" id="quiz-share">Compartir</button></div></div>';
    if(window.E64.fireConfetti) window.E64.fireConfetti();
    body.querySelector('#quiz-retry').onclick=function(){current=0;correct=0;renderQuestion();};
    body.querySelector('#quiz-share').onclick=function(){var txt='Soy '+rank+' en el Expediente 64. '+correct+'/'+QS.length;if(navigator.share)navigator.share({title:'EXPEDIENTE 64',text:txt});else{if(navigator.clipboard)navigator.clipboard.writeText(txt);alert('Copiado: '+txt);}};
  }
  renderQuestion();
  container._cleanup=function(){if(timer)clearInterval(timer);};
};
