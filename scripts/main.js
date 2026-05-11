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
  initClosing();
  initGames();
  initEasterEggs();
  initAudioToggle();
  initOpenFileButton();
  initUIClickSounds();
  if (window.lucide) window.lucide.createIcons();
});

/* ---- Global UI click sounds ---- */
function initUIClickSounds() {
  document.addEventListener('click', function(e) {
    if (!window.E64.audio) return;
    var t = e.target;
    if (t.closest('.btn, .tab-btn, .map-hotspot, .nav-links a, .audio-toggle, .vote-btn')) {
      window.E64.audio.playClick();
    }
  }, true);
}

/* ---- Audio mute toggle ---- */
function initAudioToggle() {
  var btn = document.getElementById('audio-toggle');
  if (!btn) return;
  /* Restore prior state */
  var saved = localStorage.getItem('e64_muted') === '1';
  if (saved && window.E64.audio) window.E64.audio.setMuted(true);
  if (saved) { btn.classList.add('muted'); btn.textContent = '🔇'; }
  btn.addEventListener('click', function() {
    if (!window.E64.audio) return;
    var nowMuted = window.E64.audio.toggleMuted();
    btn.classList.toggle('muted', nowMuted);
    btn.textContent = nowMuted ? '🔇' : '🔊';
    localStorage.setItem('e64_muted', nowMuted ? '1' : '0');
  });
}

/* ---- "ABRIR EXPEDIENTE" button — stamp slam transition ---- */
function initOpenFileButton() {
  var btn = document.querySelector('.hero-cta .btn');
  if (!btn) return;
  /* Build overlay nodes once */
  var flash = document.createElement('div');
  flash.className = 'open-file-flash';
  document.body.appendChild(flash);
  var stamp = document.createElement('div');
  stamp.className = 'open-file-stamp';
  stamp.innerHTML = '<div class="stamp">EXPEDIENTE ABIERTO</div>';
  document.body.appendChild(stamp);

  btn.addEventListener('click', function(e) {
    e.preventDefault();
    var target = document.querySelector(btn.getAttribute('href') || '#sospechosa');
    btn.classList.remove('btn-pressed');
    void btn.offsetWidth;
    btn.classList.add('btn-pressed');
    if (window.E64.audio) {
      window.E64.audio.playStamp();
      setTimeout(function() { window.E64.audio.playPaper(); }, 180);
    }
    flash.classList.add('active');
    setTimeout(function() { flash.classList.remove('active'); }, 180);
    stamp.classList.remove('active'); void stamp.offsetWidth; stamp.classList.add('active');
    setTimeout(function() {
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 280);
    setTimeout(function() { stamp.classList.remove('active'); }, 900);
  });
}

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

/* ---- Map SVG renderer ---- */
var MAP_DATA = {
  china:     { name:'China',            emisiones:'~10 Mt/año (2020)', quote:'El mayor emisor mundial; sus regulaciones desde 2010 redujeron casi 70% del SO₂ urbano.' },
  india:     { name:'India',            emisiones:'~8 Mt/año',         quote:'Lidera hoy las emisiones por quema de carbón. La OMS estima 1,7M muertes prematuras anuales.' },
  usa:       { name:'EE.UU.',           emisiones:'~2 Mt/año',         quote:'Las emisiones cayeron 95% desde 1980 gracias al Clean Air Act. Donde hay regulación, el SO₂ no es problema.' },
  europe:    { name:'Europa',           emisiones:'~2 Mt/año',         quote:'Reducción del 90% desde los 90. La Selva Negra alemana se está recuperando lentamente.' },
  argentina: { name:'Argentina · Dock Sud', emisiones:'Polo petroquímico crítico', quote:'Estudios de la UBA documentan impactos respiratorios sostenidos en barrios cercanos a Dock Sud y las refinerías de La Plata.' }
};
/* Hotspot positions as [longitude, latitude] */
var HOTSPOT_POS = {
  usa:       [-100,  40],
  europe:    [  15,  50],
  china:     [ 105,  35],
  india:     [  78,  22],
  argentina: [ -58, -34]
};

function buildHotspotSVG(region, x, y) {
  return [
    '<g data-region="' + region + '" class="map-hotspot-svg" style="cursor:pointer">',
    '  <circle cx="' + x + '" cy="' + y + '" r="18" fill="url(#hotspot-grad)" opacity="0.5">',
    '    <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite"/>',
    '    <animate attributeName="opacity" values="0.5;0.15;0.5" dur="2s" repeatCount="indefinite"/>',
    '  </circle>',
    '  <circle cx="' + x + '" cy="' + y + '" r="6" fill="#C9302C" stroke="#ff6666" stroke-width="1.5"/>',
    '  <circle cx="' + x + '" cy="' + y + '" r="3" fill="#fff"/>',
    '</g>'
  ].join('\n');
}

function initMap() {
  var wrap = document.getElementById('world-map-svg-wrap');
  if (!wrap) return;

  var svgParts = [
    '<svg id="world-map-svg" viewBox="0 0 1000 507" xmlns="http://www.w3.org/2000/svg"',
    '  style="width:100%;height:auto;display:block;background:#0a0e14;border:1px solid rgba(245,197,24,0.15);">',
    '  <defs>',
    '    <filter id="map-glow">',
    '      <feGaussianBlur stdDeviation="1.5" result="blur"/>',
    '      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>',
    '    </filter>',
    '    <radialGradient id="hotspot-grad" cx="50%" cy="50%" r="50%">',
    '      <stop offset="0%" stop-color="#C9302C" stop-opacity="0.9"/>',
    '      <stop offset="100%" stop-color="#C9302C" stop-opacity="0"/>',
    '    </radialGradient>',
    '  </defs>',
    '  <rect width="1000" height="507" fill="#0a0e14"/>',
    '  <g stroke="rgba(245,197,24,0.06)" stroke-width="0.5">',
    '    <line x1="0" y1="126" x2="1000" y2="126"/>',
    '    <line x1="0" y1="253" x2="1000" y2="253"/>',
    '    <line x1="0" y1="380" x2="1000" y2="380"/>',
    '    <line x1="250" y1="0" x2="250" y2="507"/>',
    '    <line x1="500" y1="0" x2="500" y2="507"/>',
    '    <line x1="750" y1="0" x2="750" y2="507"/>',
    '  </g>',
    '  <g fill="rgba(245,197,24,0.22)" stroke="rgba(245,197,24,0.65)" stroke-width="0.8" filter="url(#map-glow)">',
    '    <path d="M155,55 L170,50 L195,55 L215,60 L230,70 L240,85 L245,100 L240,115 L230,125 L220,135 L210,145 L205,160 L200,175 L195,185 L185,195 L175,200 L165,205 L155,210 L145,215 L135,220 L125,225 L115,230 L105,235 L100,245 L95,255 L90,265 L85,270 L80,265 L75,255 L70,245 L65,235 L60,225 L55,215 L50,205 L45,195 L40,185 L38,175 L40,165 L45,155 L50,145 L55,135 L60,125 L65,115 L70,105 L75,95 L80,85 L85,75 L90,65 L95,58 L105,52 L120,50 L135,52 Z"/>',
    '    <path d="M310,30 L330,25 L350,28 L360,38 L355,50 L340,58 L320,60 L305,55 L300,45 Z"/>',
    '    <path d="M155,210 L160,220 L165,230 L162,240 L155,245 L148,240 L145,230 L148,220 Z"/>',
    '    <path d="M200,245 L215,240 L230,245 L245,255 L255,270 L260,285 L258,300 L252,315 L245,330 L238,345 L230,360 L220,375 L210,385 L200,390 L190,385 L180,375 L172,360 L168,345 L165,330 L163,315 L162,300 L163,285 L167,270 L173,258 L182,250 Z"/>',
    '    <path d="M455,80 L470,75 L490,72 L510,75 L525,82 L535,90 L540,100 L535,110 L525,118 L510,122 L495,125 L480,122 L465,118 L455,110 L450,100 L452,90 Z"/>',
    '    <path d="M490,55 L505,48 L520,50 L530,60 L525,72 L510,75 L495,72 L485,65 Z"/>',
    '    <path d="M448,82 L455,78 L460,85 L455,92 L448,90 Z"/>',
    '    <path d="M455,155 L475,148 L500,145 L525,148 L545,158 L558,172 L565,190 L568,210 L565,230 L558,250 L548,268 L535,282 L520,292 L505,298 L490,298 L475,292 L462,282 L452,268 L445,250 L440,230 L438,210 L440,190 L445,172 Z"/>',
    '    <path d="M578,255 L585,248 L592,255 L590,270 L582,275 L575,268 Z"/>',
    '    <path d="M530,55 L560,48 L600,42 L650,38 L700,35 L750,33 L800,35 L840,40 L870,48 L890,58 L895,70 L880,80 L850,88 L810,92 L770,90 L730,88 L690,88 L650,90 L610,92 L575,90 L550,85 L535,75 Z"/>',
    '    <path d="M545,148 L565,142 L585,140 L605,145 L618,158 L620,172 L612,182 L598,188 L580,188 L562,182 L550,170 Z"/>',
    '    <path d="M635,165 L655,158 L672,162 L682,175 L685,192 L680,208 L668,220 L652,225 L638,220 L628,208 L625,192 L628,175 Z"/>',
    '    <path d="M720,155 L745,148 L768,152 L782,165 L785,180 L778,192 L762,198 L745,198 L728,192 L718,180 Z"/>',
    '    <path d="M680,100 L720,88 L760,85 L795,90 L820,100 L835,115 L835,132 L820,145 L798,155 L772,158 L745,155 L720,148 L698,138 L682,125 L678,112 Z"/>',
    '    <path d="M845,115 L855,108 L865,112 L868,122 L860,130 L850,128 Z"/>',
    '    <path d="M820,118 L830,112 L838,118 L835,128 L825,130 Z"/>',
    '    <path d="M740,310 L775,302 L810,300 L840,305 L862,318 L872,335 L870,355 L858,372 L838,382 L812,388 L785,388 L758,382 L735,368 L720,350 L715,330 L720,315 Z"/>',
    '    <path d="M730,248 L755,242 L778,245 L792,255 L790,265 L775,270 L752,268 L735,260 Z"/>',
    '  </g>',
    '  <g id="map-hotspots">',
    buildHotspotSVG('usa',       185, 167),
    buildHotspotSVG('europe',    515, 100),
    buildHotspotSVG('china',     780, 120),
    buildHotspotSVG('india',     660, 190),
    buildHotspotSVG('argentina', 225, 330),
    '  </g>',
    '</svg>'
  ];

  wrap.innerHTML = svgParts.join('\n');

  /* Attach click handlers */
  var dockSudClicks = 0;
  wrap.querySelectorAll('[data-region]').forEach(function(el) {
    el.addEventListener('click', function() {
      var region = el.dataset.region;
      if (region === 'argentina') {
        dockSudClicks++;
        if (dockSudClicks >= 5) {
          openRamiMapModal();
          dockSudClicks = 0;
          return;
        }
      }
      openHotspot(region);
    });
  });
}

/* ---- Map hotspot modal ---- */
function openHotspot(region) {
  var d = MAP_DATA[region];
  if (!d) return;
  var html = [
    '<div style="padding:32px;max-width:480px;font-family:\'Special Elite\',serif;">',
    '<div style="font-size:0.7rem;letter-spacing:0.3em;color:#888;margin-bottom:8px">LEGAJO REGIONAL</div>',
    '<h2 style="font-size:1.6rem;color:#C9A84C;margin:0 0 6px">' + d.name + '</h2>',
    '<div style="font-size:0.8rem;color:#C9302C;letter-spacing:0.15em;margin-bottom:20px">EMISIONES: ' + d.emisiones + '</div>',
    '<p style="color:#ccc;line-height:1.7;font-family:\'Inter\',sans-serif;font-size:0.95rem">' + d.quote + '</p>',
    '</div>'
  ].join('');
  openModal(html, true);
  if (window.E64.audio) window.E64.audio.playClick();
  if (region === 'argentina' && window.E64.unlockEgg) window.E64.unlockEgg('rami_egg_map');
}

function openRamiMapModal() {
  if (window.E64.unlockEgg) window.E64.unlockEgg('rami_egg_map');
  var html = [
    '<div style="padding:32px;max-width:480px;font-family:\'Special Elite\',serif;text-align:center;">',
    '<div style="font-size:3rem;margin-bottom:12px">⚠</div>',
    '<h2 style="color:#C9302C;font-size:1.4rem;letter-spacing:0.2em">ACCESO RESTRINGIDO</h2>',
    '<p style="color:#888;margin:16px 0;font-family:\'Special Elite\',serif;font-size:1rem;line-height:1.7">',
    'Dock Sud, 23/10/1991.<br>Sector 7 fue clausurado.<br><br>',
    '<em style="color:rgba(201,48,44,0.7)">El legajo fue bloqueado por orden superior.<br>Hay pruebas que no deben circular.</em>',
    '</p>',
    '<div style="font-size:0.65rem;color:#444;letter-spacing:0.2em;margin-top:20px">— R.P.</div>',
    '</div>'
  ].join('');
  openModal(html, true);
  if (window.E64.audio) window.E64.audio.playScreamer(0.6);
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
  lewis:  'buildLewisGame',
  snake:  'buildSulfusnake',
  acid:   'buildAcidDefense',
  memo:   'buildMemotest',
  quiz:   'buildQuiz',
  escape: 'buildEscapeRami'
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
  /* Konami → Rami dark flash */
  var code = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  var pos  = 0;
  document.addEventListener('keydown', function(e) {
    var k = e.key.length===1 ? e.key.toLowerCase() : e.key;
    if (k === code[pos]) { pos++; if (pos===code.length) { showRamiKonami(); pos=0; } }
    else pos = (k===code[0]) ? 1 : 0;
  });

  /* 10 clicks on stamp → cursed note */
  var stampClicks = 0;
  document.querySelectorAll('[data-stamp-egg]').forEach(function(s) {
    s.addEventListener('click', function() {
      stampClicks++;
      if (stampClicks >= 10) { showCursedNote(); stampClicks = 0; }
    });
  });

  /* Timeline 1991 clicks → 7× */
  initTimelineEgg();
}

function showRamiKonami() {
  if (window.E64.unlockEgg) window.E64.unlockEgg('rami_egg_konami');
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99990;background:#000;display:flex;align-items:center;justify-content:center;flex-direction:column;';
  var txt = document.createElement('p');
  txt.textContent = 'I SEE YOU';
  txt.style.cssText = 'color:#C9302C;font-family:"Special Elite",serif;font-size:clamp(2rem,6vw,4rem);letter-spacing:0.2em;text-align:center;animation:shake 0.3s infinite;';
  overlay.appendChild(txt);
  document.body.appendChild(overlay);
  if (window.E64.audio) window.E64.audio.playRumble();

  /* Subliminal Rami at 2s */
  setTimeout(function() {
    var img = document.createElement('img');
    img.src = 'assets/img/ramiropita.png';
    img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:contrast(1.4) saturate(0.3) hue-rotate(-10deg);opacity:0;transition:opacity 40ms;';
    overlay.appendChild(img);
    requestAnimationFrame(function() { img.style.opacity = '1'; });
    if (window.E64.audio) window.E64.audio.playScreamer(0.9);
    setTimeout(function() { img.style.opacity = '0'; }, 300);
  }, 1800);

  setTimeout(function() {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }, 4000);
}

function showCursedNote() {
  if (window.E64.unlockEgg) window.E64.unlockEgg('rami_egg_stamp');
  var e = document.getElementById('secret-envelope');
  if (!e) return;
  e.innerHTML = [
    '<button class="close-secret" aria-label="Cerrar">✕</button>',
    '<div style="font-family:\'Caveat\',cursive,\'Special Elite\',serif;font-size:1.1rem;line-height:1.7;color:#3a1a0a;padding:10px 4px;">',
    '<p>Si estás leyendo esto, ya es tarde.</p>',
    '<p>R.P. nunca se fue de la refinería.</p>',
    '<p>Mirá los registros del 23/10/91.</p>',
    '<p style="margin-top:16px;text-align:right">— M.</p>',
    '</div>'
  ].join('');
  e.style.background = '#f5e6d5';
  e.style.borderColor = '#C9302C';
  e.classList.add('show');
  var btn = e.querySelector('.close-secret');
  if (btn) btn.onclick = function() { e.classList.remove('show'); };
}

function initTimelineEgg() {
  var clicks1991 = 0;
  /* Delegate: any click on a timeline element containing "1991" */
  document.addEventListener('click', function(e) {
    var el = e.target.closest('.polaroid');
    if (!el) return;
    var yearEl = el.querySelector('.polaroid-year');
    if (yearEl && yearEl.textContent.trim() === '1991') {
      clicks1991++;
      if (clicks1991 >= 7) {
        clicks1991 = 0;
        triggerTimeline1991Egg(el);
      }
    }
  });
}

function triggerTimeline1991Egg(polaroid) {
  if (window.E64.unlockEgg) window.E64.unlockEgg('rami_egg_timeline');
  var imgEl = polaroid.querySelector('.polaroid-img');
  if (!imgEl) return;
  var orig = imgEl.innerHTML;
  /* Replace with Rami image briefly */
  imgEl.innerHTML = '<img src="assets/img/ramiropita.png" style="width:100%;height:100%;object-fit:cover;filter:contrast(1.4) saturate(0.15) brightness(0.6) sepia(0.5);">';
  if (window.E64.audio) window.E64.audio.playGlitch();
  var caption = polaroid.querySelector('.polaroid-title');
  var origTitle = caption ? caption.textContent : '';
  if (caption) caption.textContent = '23/10/1991 — Dock Sud, no Pinatubo.';
  setTimeout(function() {
    imgEl.innerHTML = orig;
    if (caption) caption.textContent = origTitle;
  }, 2800);
}


function triggerVotingEgg() {
  if (window.E64.unlockEgg) window.E64.unlockEgg('rami_egg_voting');
  var msg = document.createElement('div');
  msg.style.cssText = 'position:fixed;inset:0;z-index:99989;background:#000;display:flex;align-items:center;justify-content:center;';
  var txt = document.createElement('p');
  txt.style.cssText = 'color:#C9302C;font-family:"Special Elite",serif;font-size:clamp(1rem,3vw,1.8rem);text-align:center;max-width:600px;padding:40px;line-height:1.6;';
  txt.textContent = 'Vos también lo querés muerto. Como ellos.';
  msg.appendChild(txt);
  document.body.appendChild(msg);
  if (window.E64.audio) window.E64.audio.playScreamer(0.7);
  setTimeout(function() { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 2500);
}
