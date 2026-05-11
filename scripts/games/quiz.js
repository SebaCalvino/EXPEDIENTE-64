window.E64 = window.E64 || {};
window.E64.buildQuiz = function(container) {
  container.innerHTML = '<div class="game-shell quiz-shell"><h2>¿Cuánto sabés del SO₂?</h2><p class="game-tag">10 preguntas · 15 segundos cada una.</p><div id="quiz-body"></div></div>';
  var body = container.querySelector('#quiz-body');
  var QS   = window.E64.QUIZ_QUESTIONS;
  var current=0, correct=0, timer=null, timeLeft=15;

  function renderQuestion() {
    var q=QS[current];
    var pct=(current/QS.length)*100;
    body.innerHTML='<div class="quiz-progress"><div class="quiz-progress-fill" style="width:'+pct+'%"></div></div><div class="quiz-meta"><span>Pregunta '+(current+1)+' / '+QS.length+'</span><span>⏱ <b id="quiz-time">'+timeLeft+'</b>s</span></div><h3 class="quiz-question">'+q.q+'</h3><div class="quiz-options">'+q.options.map(function(o,i){return '<button class="quiz-option" data-i="'+i+'">'+o+'</button>';}).join('')+'</div><p class="quiz-feedback" id="quiz-fb"></p>';
    body.querySelectorAll('.quiz-option').forEach(function(btn){btn.onclick=function(){answer(parseInt(btn.dataset.i,10));};});
    timeLeft=15;
    if(timer)clearInterval(timer);
    timer=setInterval(function(){timeLeft--;var t=body.querySelector('#quiz-time');if(t)t.textContent=timeLeft;if(timeLeft<=0)answer(-1);},1000);
  }
  function answer(i) {
    clearInterval(timer);
    var q=QS[current];
    body.querySelectorAll('.quiz-option').forEach(function(o,idx){o.disabled=true;if(idx===q.correct)o.classList.add('correct');if(idx===i&&i!==q.correct)o.classList.add('wrong');});
    if(i===q.correct)correct++;
    body.querySelector('#quiz-fb').textContent=q.explanation;
    setTimeout(function(){current++;if(current>=QS.length)showResult();else renderQuestion();},1800);
  }
  function showQuizScreamer(onDone) {
    /* Overlay fullscreen: "I SEE YOU" + foto Rami circular, 3s, luego sigue normal */
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;opacity:0;transition:opacity 80ms;pointer-events:none;';
    ov.innerHTML =
      '<div style="font-family:\'Special Elite\',serif;font-size:clamp(2.5rem,9vw,6rem);letter-spacing:0.25em;color:#C9302C;text-shadow:0 0 40px #C9302C;line-height:1;">I SEE YOU</div>' +
      '<img src="assets/img/ramiropita.png" style="width:min(45vw,260px);height:min(45vw,260px);object-fit:cover;border-radius:50%;filter:contrast(1.4) saturate(0.3);border:2px solid #C9302C;box-shadow:0 0 50px rgba(201,48,44,0.6);">';
    document.body.appendChild(ov);
    if (window.E64.audio && window.E64.audio.playScreamerSound) window.E64.audio.playScreamerSound(0.9);
    requestAnimationFrame(function() { ov.style.opacity = '1'; });
    setTimeout(function() {
      ov.style.transition = 'opacity 0.6s';
      ov.style.opacity = '0';
      setTimeout(function() {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
        onDone();
      }, 700);
    }, 2300);
  }

  function showResult() {
    /* Easter egg: 0/10 → screamer breve, después resultado normal */
    if (correct === 0 && window.E64.unlockEgg) {
      window.E64.unlockEgg('rami_egg_quiz');
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
