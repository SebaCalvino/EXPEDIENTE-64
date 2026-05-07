import { QUIZ_QUESTIONS } from '../data/quiz-questions.js';
import { fireConfetti } from '../main.js';

export function buildQuiz(container) {
  container.innerHTML = `
    <div class="game-shell quiz-shell">
      <h2>¿Cuánto sabés del SO₂?</h2>
      <p class="game-tag">10 preguntas · 15 segundos cada una.</p>
      <div id="quiz-body"></div>
    </div>
  `;
  const body = container.querySelector('#quiz-body');

  let current = 0;
  let correct = 0;
  let timer = null;
  let timeLeft = 15;

  function renderQuestion() {
    const q = QUIZ_QUESTIONS[current];
    const progress = ((current) / QUIZ_QUESTIONS.length) * 100;
    body.innerHTML = `
      <div class="quiz-progress"><div class="quiz-progress-fill" style="width:${progress}%"></div></div>
      <div class="quiz-meta">
        <span>Pregunta ${current + 1} / ${QUIZ_QUESTIONS.length}</span>
        <span>⏱ <b id="quiz-time">${timeLeft}</b>s</span>
      </div>
      <h3 class="quiz-question">${q.q}</h3>
      <div class="quiz-options">
        ${q.options.map((o, i) => `<button class="quiz-option" data-i="${i}">${o}</button>`).join('')}
      </div>
      <p class="quiz-feedback" id="quiz-fb"></p>
    `;
    body.querySelectorAll('.quiz-option').forEach(btn => {
      btn.onclick = () => answer(parseInt(btn.dataset.i, 10));
    });
    timeLeft = 15;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      timeLeft--;
      const t = body.querySelector('#quiz-time');
      if (t) t.textContent = timeLeft;
      if (timeLeft <= 0) answer(-1);
    }, 1000);
  }

  function answer(i) {
    clearInterval(timer);
    const q = QUIZ_QUESTIONS[current];
    const opts = body.querySelectorAll('.quiz-option');
    opts.forEach((o, idx) => {
      o.disabled = true;
      if (idx === q.correct) o.classList.add('correct');
      if (idx === i && i !== q.correct) o.classList.add('wrong');
    });
    if (i === q.correct) correct++;
    body.querySelector('#quiz-fb').textContent = q.explanation;
    setTimeout(() => {
      current++;
      if (current >= QUIZ_QUESTIONS.length) showResult();
      else renderQuestion();
    }, 1800);
  }

  function showResult() {
    let rank;
    if (correct <= 3) rank = 'Pasante';
    else if (correct <= 6) rank = 'Detective junior';
    else if (correct <= 9) rank = 'Investigador senior';
    else rank = 'Jefe del Expediente 64';

    body.innerHTML = `
      <div class="quiz-result">
        <p class="quiz-meta" style="justify-content:center;">RANGO ASIGNADO</p>
        <div class="rank">${rank}</div>
        <p class="score">${correct} / ${QUIZ_QUESTIONS.length} correctas</p>
        <div class="puzzle-actions">
          <button class="btn" id="quiz-retry">↺ Volver a investigar</button>
          <button class="btn dark" id="quiz-share">Compartir resultado</button>
        </div>
      </div>
    `;
    fireConfetti();
    body.querySelector('#quiz-retry').onclick = () => { current = 0; correct = 0; renderQuestion(); };
    body.querySelector('#quiz-share').onclick = () => {
      const text = `Soy ${rank} en el Expediente 64. ${correct}/${QUIZ_QUESTIONS.length}`;
      if (navigator.share) navigator.share({ title: 'EXPEDIENTE 64', text });
      else { navigator.clipboard?.writeText(text); alert('Copiado: ' + text); }
    };
  }

  renderQuestion();
  container._cleanup = () => { if (timer) clearInterval(timer); };
}
