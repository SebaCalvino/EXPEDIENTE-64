import { initCursor } from './cursor.js';
import { initParallax, initReveal } from './parallax.js';
import { initHeroScene } from './three/hero-scene.js';
import { initSuspectScene, initAmbientBackgroundScene } from './three/suspect-scene.js';
import { GLOSSARY } from './data/glossary.js';
import { TIMELINE_EVENTS } from './data/timeline-events.js';

import { buildLewisGame } from './games/lewis-builder.js';
import { buildSulfusnake } from './games/sulfusnake.js';
import { buildAcidDefense } from './games/acid-defense.js';
import { buildMemotest } from './games/memotest.js';
import { buildQuiz } from './games/quiz.js';

window.addEventListener('DOMContentLoaded', init);

function init() {
  // --- Loading screen ---
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('gone');
  }, 2400);

  initCursor();
  initParallax();
  initReveal();
  initNavigation();
  initSlogan();
  initHero();
  initSuspect();
  initTabs();
  initTimeline();
  initFolder();
  initVideos();
  initMap();
  initVoting();
  initClosing();
  initGames();
  initEasterEggs();
  initLucide();
}

function initLucide() {
  if (window.lucide) window.lucide.createIcons();
}

function initNavigation() {
  const nav = document.querySelector('.nav');
  const links = document.querySelector('.nav-links');
  const burger = document.querySelector('.hamburger');
  burger?.addEventListener('click', () => {
    burger.classList.toggle('open');
    links.classList.toggle('open');
  });
  links?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burger?.classList.remove('open');
    links.classList.remove('open');
  }));

  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 100 && y > lastY) nav.classList.add('hidden');
    else nav.classList.remove('hidden');
    lastY = y;
  }, { passive: true });
}

function initSlogan() {
  const el = document.getElementById('slogan-text');
  if (!el) return;
  const text = 'Pruebas, no prejuicios.';
  let i = 0;
  setTimeout(() => {
    const interval = setInterval(() => {
      el.textContent = text.slice(0, i);
      i++;
      if (i > text.length) {
        clearInterval(interval);
        el.insertAdjacentHTML('beforeend', '<span class="cursor">|</span>');
      }
    }, 80);
  }, 800);
}

function initHero() {
  const c = document.getElementById('hero-canvas');
  if (c) initHeroScene(c);
}

function initSuspect() {
  const c = document.getElementById('suspect-canvas');
  if (c) initSuspectScene(c);

  // glossary tooltips
  document.querySelectorAll('.gloss').forEach(el => {
    const term = el.dataset.term || el.textContent.toLowerCase().trim();
    const def = GLOSSARY[term];
    if (def) el.setAttribute('data-tip', def);
    el.setAttribute('tabindex', '0');
  });
}

function initTabs() {
  document.querySelectorAll('.tabs').forEach(group => {
    const btns = group.querySelectorAll('.tab-btn');
    const panels = group.querySelectorAll('.tab-panel');
    btns.forEach(b => b.addEventListener('click', () => {
      btns.forEach(x => x.setAttribute('aria-selected', 'false'));
      panels.forEach(p => p.classList.remove('active'));
      b.setAttribute('aria-selected', 'true');
      const panel = group.querySelector(`#${b.dataset.target}`);
      panel?.classList.add('active');
    }));
  });
}

function initTimeline() {
  const track = document.getElementById('timeline-track');
  if (!track) return;
  TIMELINE_EVENTS.forEach((ev, i) => {
    const item = document.createElement('div');
    item.className = 'timeline-item reveal';
    item.innerHTML = `
      <div class="polaroid">
        <div class="polaroid-img">${ev.icon}</div>
        <div class="polaroid-year">${ev.year}</div>
        <div class="polaroid-title">${ev.title}</div>
        <p class="polaroid-desc">${ev.description}</p>
        <span class="polaroid-tag">${ev.tag}</span>
      </div>
      <div class="timeline-pin"></div>
      <div class="timeline-spacer"></div>
    `;
    track.appendChild(item);
  });
  // re-init reveal for new items
  initReveal();
}

function initFolder() {
  const tabs = document.querySelectorAll('.folder-tab');
  const panels = document.querySelectorAll('.folder-panel');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.setAttribute('aria-selected', 'false'));
    panels.forEach(p => p.classList.remove('active'));
    t.setAttribute('aria-selected', 'true');
    const panel = document.getElementById(t.dataset.target);
    panel?.classList.add('active');
    if (window.gsap) {
      window.gsap.fromTo(panel, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 });
    }
  }));
}

function initVideos() {
  const tabs = document.querySelectorAll('.cctv-tab');
  const panels = document.querySelectorAll('.cctv-panel');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.setAttribute('aria-selected', 'false'));
    panels.forEach(p => p.classList.remove('active'));
    t.setAttribute('aria-selected', 'true');
    document.getElementById(t.dataset.target)?.classList.add('active');
  }));
}

const MAP_DATA = {
  china: { name: 'China', emisiones: '~10 Mt/año (2020)', quote: 'El mayor emisor mundial; sus regulaciones desde 2010 redujeron casi 70% del SO₂ urbano.' },
  india: { name: 'India', emisiones: '~8 Mt/año', quote: 'Lidera hoy las emisiones por quema de carbón. La OMS estima 1,7M muertes prematuras anuales.' },
  usa: { name: 'EE.UU.', emisiones: '~2 Mt/año', quote: 'Las emisiones cayeron 95% desde 1980 gracias al Clean Air Act. Demuestra que la regulación funciona.' },
  europe: { name: 'Europa', emisiones: '~2 Mt/año', quote: 'Reducción del 90% desde los 90. La Selva Negra alemana se está recuperando lentamente.' },
  argentina: { name: 'Argentina · Dock Sud', emisiones: 'Polo petroquímico crítico', quote: '"Una de las mayores concentraciones urbanas de SO₂ del país; estudios de la UBA documentan impactos respiratorios sostenidos en barrios cercanos."' }
};

function initMap() {
  document.querySelectorAll('.hotspot').forEach(h => {
    h.addEventListener('click', () => openHotspot(h.dataset.region));
  });
}

function openHotspot(region) {
  const data = MAP_DATA[region];
  if (!data) return;
  const html = `
    <div class="hotspot-info">
      <h4>${data.name}</h4>
      <p><strong>Emisiones:</strong> ${data.emisiones}</p>
      <blockquote>${data.quote}</blockquote>
    </div>
  `;
  openModal(html, false);
}

function initVoting() {
  const guilty = document.getElementById('vote-guilty');
  const innocent = document.getElementById('vote-innocent');
  const stats = document.getElementById('vote-stats');
  const fillI = document.getElementById('vote-fill-innocent');
  const fillG = document.getElementById('vote-fill-guilty');
  if (!guilty || !innocent) return;

  const update = () => {
    const g = parseInt(localStorage.getItem('vote_guilty') || '0', 10);
    const i = parseInt(localStorage.getItem('vote_innocent') || '0', 10);
    const total = g + i || 1;
    const gp = Math.round((g / total) * 100);
    const ip = 100 - gp;
    stats.innerHTML = `<b style="color:var(--acid-green)">${ip}% Inocente</b> · <b style="color:var(--confidential)">${gp}% Culpable</b> · ${g + i} votos`;
    fillI.style.width = ip + '%';
    fillG.style.width = gp + '%';
  };
  guilty.addEventListener('click', () => {
    if (localStorage.getItem('voted')) return;
    localStorage.setItem('vote_guilty', (parseInt(localStorage.getItem('vote_guilty') || '0', 10) + 1));
    localStorage.setItem('voted', 'guilty');
    update();
  });
  innocent.addEventListener('click', () => {
    if (localStorage.getItem('voted')) return;
    localStorage.setItem('vote_innocent', (parseInt(localStorage.getItem('vote_innocent') || '0', 10) + 1));
    localStorage.setItem('voted', 'innocent');
    update();
    fireConfetti();
  });
  // seed initial
  if (!localStorage.getItem('vote_guilty') && !localStorage.getItem('vote_innocent')) {
    localStorage.setItem('vote_guilty', '34');
    localStorage.setItem('vote_innocent', '52');
  }
  update();
}

function initClosing() {
  const c = document.getElementById('closing-canvas');
  if (c) initAmbientBackgroundScene(c);
}

const GAMES = {
  lewis: { title: 'Lewis Builder', build: buildLewisGame },
  snake: { title: 'Sulfusnake', build: buildSulfusnake },
  acid: { title: 'Ácido Defense', build: buildAcidDefense },
  memo: { title: 'Memotest', build: buildMemotest },
  quiz: { title: 'Quiz', build: buildQuiz }
};

function initGames() {
  document.querySelectorAll('[data-game]').forEach(card => {
    card.addEventListener('click', () => {
      const g = card.dataset.game;
      if (!GAMES[g]) return;
      const root = document.createElement('div');
      GAMES[g].build(root);
      openModal(root, g === 'lewis');
    });
  });
}

// === Modal ===
let activeCleanup = null;
export function openModal(content, dark = false) {
  const backdrop = document.getElementById('modal-backdrop');
  const win = document.getElementById('modal-window');
  win.innerHTML = '<button class="modal-close" aria-label="Cerrar">✕</button>';
  win.classList.toggle('dark', dark);
  if (typeof content === 'string') {
    const wrap = document.createElement('div');
    wrap.style.padding = '40px';
    wrap.innerHTML = content;
    win.appendChild(wrap);
  } else {
    win.appendChild(content);
    activeCleanup = content._cleanup;
  }
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  const backdrop = document.getElementById('modal-backdrop');
  backdrop.classList.remove('open');
  document.body.style.overflow = '';
  if (activeCleanup) { try { activeCleanup(); } catch (e) {} activeCleanup = null; }
}
document.addEventListener('click', e => {
  if (e.target.classList?.contains('modal-close')) closeModal();
  if (e.target.id === 'modal-backdrop') closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// === Confetti ===
export function fireConfetti(count = 80, colors = ['#F5C518', '#C9302C', '#84CC16', '#FAFAF7']) {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const parts = [];
  for (let i = 0; i < count; i++) {
    parts.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 6,
      vy: 3 + Math.random() * 5,
      size: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3
    });
  }
  let t = 0;
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.rot += p.vrot;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.5);
      ctx.restore();
    });
    t++;
    if (t < 200) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  tick();
}

// === Easter eggs ===
function initEasterEggs() {
  // Konami
  const code = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let pos = 0;
  document.addEventListener('keydown', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === code[pos]) {
      pos++;
      if (pos === code.length) {
        showDeclassified();
        pos = 0;
      }
    } else {
      pos = (k === code[0]) ? 1 : 0;
    }
  });

  // 10x stamp click
  let stampClicks = 0;
  document.querySelectorAll('[data-stamp-egg]').forEach(s => {
    s.addEventListener('click', () => {
      stampClicks++;
      if (stampClicks >= 10) {
        showSecretEnvelope();
        stampClicks = 0;
      }
    });
  });
}

function showDeclassified() {
  const overlay = document.getElementById('declass-overlay');
  overlay?.classList.add('show');
  fireConfetti(120);
  overlay?.querySelector('button')?.addEventListener('click', () => overlay.classList.remove('show'), { once: true });
}

function showSecretEnvelope() {
  const env = document.getElementById('secret-envelope');
  env?.classList.add('show');
  fireConfetti(50, ['#F5C518', '#F5C518', '#FAFAF7']);
  env?.querySelector('.close-secret')?.addEventListener('click', () => env.classList.remove('show'), { once: true });
}
