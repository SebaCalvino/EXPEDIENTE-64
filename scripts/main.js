/* Main — sin módulos ES6, funciona desde file:// */
window.E64 = window.E64 || {};

window.addEventListener('DOMContentLoaded', function() {
  // Loader: CSS animation ya lo descarta; JS lo cierra también para mayor compatibilidad
  setTimeout(function() {
    var loader = document.getElementById('loader');
    if (loader) loader.classList.add('gone');
  }, 2500);

  window.E64.initCursor();
  window.E64.initParallax();
  window.E64.initReveal();
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
  if (window.lucide) window.lucide.createIcons();
});

/* ---- Navigation ---- */
function initNavigation() {
  var nav    = document.querySelector('.nav');
  var links  = document.querySelector('.nav-links');
  var burger = document.querySelector('.hamburger');
  if (burger) {
    burger.addEventListener('click', function() {
      burger.classList.toggle('open');
      links.classList.toggle('open');
    });
  }
  if (links) {
    links.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        burger && burger.classList.remove('open');
        links.classList.remove('open');
      });
    });
  }
  var lastY = 0;
  window.addEventListener('scroll', function() {
    var y = window.scrollY;
    if (y > 100 && y > lastY) nav.classList.add('hidden');
    else nav.classList.remove('hidden');
    lastY = y;
  }, { passive: true });
}

/* ---- Typewriter slogan ---- */
function initSlogan() {
  var el   = document.getElementById('slogan-text');
  if (!el) return;
  var text = 'Pruebas, no prejuicios.';
  var i    = 0;
  setTimeout(function() {
    var iv = setInterval(function() {
      el.textContent = text.slice(0, i);
      i++;
      if (i > text.length) {
        clearInterval(iv);
        var cur = document.createElement('span');
        cur.className = 'cursor'; cur.textContent = '|';
        el.appendChild(cur);
      }
    }, 80);
  }, 900);
}

/* ---- Hero 3D ---- */
function initHero() {
  var c = document.getElementById('hero-canvas');
  if (c && window.E64.initHeroScene) window.E64.initHeroScene(c);
}

/* ---- Suspect 3D + Glossary ---- */
function initSuspect() {
  var c = document.getElementById('suspect-canvas');
  if (c && window.E64.initSuspectScene) window.E64.initSuspectScene(c);

  var GL = window.E64.GLOSSARY || {};
  document.querySelectorAll('.gloss').forEach(function(el) {
    var term = el.dataset.term || el.textContent.toLowerCase().trim();
    var def  = GL[term];
    if (def) el.setAttribute('data-tip', def);
    el.setAttribute('tabindex', '0');
  });
}

/* ---- Generic tabs (suspect section) ---- */
function initTabs() {
  document.querySelectorAll('.tabs').forEach(function(group) {
    var btns   = group.querySelectorAll('.tab-btn');
    var panels = group.querySelectorAll('.tab-panel');
    btns.forEach(function(b) {
      b.addEventListener('click', function() {
        btns.forEach(function(x) { x.setAttribute('aria-selected','false'); });
        panels.forEach(function(p) { p.classList.remove('active'); });
        b.setAttribute('aria-selected','true');
        var target = group.querySelector('#'+b.dataset.target);
        if (target) target.classList.add('active');
      });
    });
  });
}

/* ---- Timeline ---- */
function initTimeline() {
  var track  = document.getElementById('timeline-track');
  var events = window.E64.TIMELINE_EVENTS || [];
  if (!track) return;
  events.forEach(function(ev) {
    var item = document.createElement('div');
    item.className = 'timeline-item reveal';
    item.innerHTML =
      '<div class="polaroid">' +
        '<div class="polaroid-img">' + ev.icon + '</div>' +
        '<div class="polaroid-year">' + ev.year + '</div>' +
        '<div class="polaroid-title">' + ev.title + '</div>' +
        '<p class="polaroid-desc">' + ev.description + '</p>' +
        '<span class="polaroid-tag">' + ev.tag + '</span>' +
      '</div>' +
      '<div class="timeline-pin"></div>' +
      '<div class="timeline-spacer"></div>';
    track.appendChild(item);
  });
  window.E64.initReveal();
}

/* ---- Folder tabs ---- */
function initFolder() {
  var tabs   = document.querySelectorAll('.folder-tab');
  var panels = document.querySelectorAll('.folder-panel');
  tabs.forEach(function(t) {
    t.addEventListener('click', function() {
      tabs.forEach(function(x)   { x.setAttribute('aria-selected','false'); });
      panels.forEach(function(p) { p.classList.remove('active'); });
      t.setAttribute('aria-selected','true');
      var panel = document.getElementById(t.dataset.target);
      if (panel) panel.classList.add('active');
    });
  });
  // activate first tab
  if (tabs[0]) { tabs[0].setAttribute('aria-selected','true'); }
  var first = document.querySelector('.folder-panel');
  if (first) first.classList.add('active');
}

/* ---- CCTV / Videos tabs ---- */
function initVideos() {
  var tabs   = document.querySelectorAll('.cctv-tab');
  var panels = document.querySelectorAll('.cctv-panel');
  tabs.forEach(function(t) {
    t.addEventListener('click', function() {
      tabs.forEach(function(x)   { x.setAttribute('aria-selected','false'); });
      panels.forEach(function(p) { p.classList.remove('active'); });
      t.setAttribute('aria-selected','true');
      var panel = document.getElementById(t.dataset.target);
      if (panel) panel.classList.add('active');
    });
  });
}

/* ---- Map hotspots ---- */
var MAP_DATA = {
  china:     { name:'China',            emisiones:'~10 Mt/año (2020)', quote:'El mayor emisor mundial; sus regulaciones desde 2010 redujeron casi 70% del SO₂ urbano.' },
  india:     { name:'India',            emisiones:'~8 Mt/año',         quote:'Lidera hoy las emisiones por quema de carbón. La OMS estima 1,7M muertes prematuras anuales.' },
  usa:       { name:'EE.UU.',           emisiones:'~2 Mt/año',         quote:'Las emisiones cayeron 95% desde 1980 gracias al Clean Air Act. Donde hay regulación, el SO₂ no es problema.' },
  europe:    { name:'Europa',           emisiones:'~2 Mt/año',         quote:'Reducción del 90% desde los 90. La Selva Negra alemana se está recuperando lentamente.' },
  argentina: { name:'Argentina · Dock Sud', emisiones:'Polo petroquímico crítico', quote:'Estudios de la UBA documentan impactos respiratorios sostenidos en barrios cercanos a Dock Sud y las refinerías de La Plata.' }
};
function initMap() {
  document.querySelectorAll('.hotspot').forEach(function(h) {
    h.addEventListener('click', function() { openHotspot(h.dataset.region); });
    h.addEventListener('keypress', function(e) { if (e.key==='Enter') openHotspot(h.dataset.region); });
  });
}
function openHotspot(region) {
  var d = MAP_DATA[region]; if (!d) return;
  openModal('<div class="hotspot-info"><h4>'+d.name+'</h4><p><strong>Emisiones:</strong> '+d.emisiones+'</p><blockquote>'+d.quote+'</blockquote></div>', false);
}

/* ---- Voting ---- */
function initVoting() {
  var guilty   = document.getElementById('vote-guilty');
  var innocent = document.getElementById('vote-innocent');
  var stats    = document.getElementById('vote-stats');
  var fillI    = document.getElementById('vote-fill-innocent');
  var fillG    = document.getElementById('vote-fill-guilty');
  if (!guilty || !innocent) return;

  if (!localStorage.getItem('vote_guilty') && !localStorage.getItem('vote_innocent')) {
    localStorage.setItem('vote_guilty',  '34');
    localStorage.setItem('vote_innocent','52');
  }

  function update() {
    var g = parseInt(localStorage.getItem('vote_guilty')  || '0', 10);
    var i = parseInt(localStorage.getItem('vote_innocent')|| '0', 10);
    var total = (g + i) || 1;
    var gp = Math.round((g/total)*100), ip = 100 - gp;
    stats.innerHTML = '<b style="color:var(--acid-green)">' + ip + '% Inocente</b> · <b style="color:var(--confidential)">' + gp + '% Culpable</b> · ' + (g+i) + ' votos';
    if (fillI) fillI.style.width = ip + '%';
    if (fillG) fillG.style.width = gp + '%';
  }

  guilty.addEventListener('click', function() {
    if (localStorage.getItem('voted')) return;
    localStorage.setItem('vote_guilty', parseInt(localStorage.getItem('vote_guilty')||'0',10) + 1);
    localStorage.setItem('voted','guilty'); update();
  });
  innocent.addEventListener('click', function() {
    if (localStorage.getItem('voted')) return;
    localStorage.setItem('vote_innocent', parseInt(localStorage.getItem('vote_innocent')||'0',10) + 1);
    localStorage.setItem('voted','innocent'); update();
    window.E64.fireConfetti();
  });
  update();
}

/* ---- Closing background ---- */
function initClosing() {
  var c = document.getElementById('closing-canvas');
  if (c && window.E64.initAmbientBackgroundScene) window.E64.initAmbientBackgroundScene(c);
}

/* ---- Games ---- */
var GAME_MAP = {
  lewis: 'buildLewisGame',
  snake: 'buildSulfusnake',
  acid:  'buildAcidDefense',
  memo:  'buildMemotest',
  quiz:  'buildQuiz'
};
function initGames() {
  document.querySelectorAll('[data-game]').forEach(function(card) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function() {
      var id  = card.dataset.game;
      var fn  = window.E64[GAME_MAP[id]];
      if (!fn) return;
      var root = document.createElement('div');
      fn(root);
      openModal(root, id === 'lewis');
    });
    card.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') card.click();
    });
  });
}

/* ---- Modal ---- */
var _activeCleanup = null;
function openModal(content, dark) {
  var backdrop = document.getElementById('modal-backdrop');
  var win      = document.getElementById('modal-window');
  win.innerHTML = '<button class="modal-close" aria-label="Cerrar">✕</button>';
  win.classList.toggle('dark', !!dark);
  if (typeof content === 'string') {
    var wrap = document.createElement('div');
    wrap.style.padding = '40px';
    wrap.innerHTML = content;
    win.appendChild(wrap);
  } else {
    win.appendChild(content);
    _activeCleanup = content._cleanup || null;
  }
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  var backdrop = document.getElementById('modal-backdrop');
  backdrop.classList.remove('open');
  document.body.style.overflow = '';
  if (_activeCleanup) { try { _activeCleanup(); } catch(e) {} _activeCleanup = null; }
}
document.addEventListener('click', function(e) {
  if (e.target && (e.target.classList.contains('modal-close') || e.target.id==='modal-backdrop')) closeModal();
});
document.addEventListener('keydown', function(e) { if (e.key==='Escape') closeModal(); });

/* ---- Confetti ---- */
window.E64.fireConfetti = function(count, colors) {
  count  = count  || 80;
  colors = colors || ['#F5C518','#C9302C','#84CC16','#FAFAF7'];
  var canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  var parts = [];
  for (var i=0; i<count; i++) {
    parts.push({
      x: Math.random()*canvas.width, y: -20-Math.random()*100,
      vx: (Math.random()-0.5)*6, vy: 3+Math.random()*5,
      size: 6+Math.random()*8,
      color: colors[Math.floor(Math.random()*colors.length)],
      rot: Math.random()*Math.PI, vrot: (Math.random()-0.5)*0.3
    });
  }
  var frame = 0;
  (function tick() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    parts.forEach(function(p) {
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.12; p.rot+=p.vrot;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.fillStyle=p.color; ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*0.5);
      ctx.restore();
    });
    frame++;
    if (frame<200) requestAnimationFrame(tick);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  })();
};

/* ---- Easter eggs ---- */
function initEasterEggs() {
  var code = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  var pos  = 0;
  document.addEventListener('keydown', function(e) {
    var k = e.key.length===1 ? e.key.toLowerCase() : e.key;
    if (k === code[pos]) { pos++; if (pos===code.length) { showDeclassified(); pos=0; } }
    else pos = (k===code[0]) ? 1 : 0;
  });
  var stampClicks = 0;
  document.querySelectorAll('[data-stamp-egg]').forEach(function(s) {
    s.addEventListener('click', function() {
      stampClicks++;
      if (stampClicks >= 10) { showSecretEnvelope(); stampClicks=0; }
    });
  });
}
function showDeclassified() {
  var o = document.getElementById('declass-overlay');
  if (o) o.classList.add('show');
  window.E64.fireConfetti(120);
  var btn = o && o.querySelector('button');
  if (btn) btn.onclick = function() { o.classList.remove('show'); };
}
function showSecretEnvelope() {
  var e = document.getElementById('secret-envelope');
  if (e) e.classList.add('show');
  window.E64.fireConfetti(50, ['#F5C518','#F5C518','#FAFAF7']);
  var btn = e && e.querySelector('.close-secret');
  if (btn) btn.onclick = function() { e.classList.remove('show'); };
}
