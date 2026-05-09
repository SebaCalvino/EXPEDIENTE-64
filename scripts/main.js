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

/* ---- Map constellation renderer ---- */
var MAP_DATA = {
  china:     { name:'China',            emisiones:'~10 Mt/año (2020)', quote:'El mayor emisor mundial; sus regulaciones desde 2010 redujeron casi 70% del SO₂ urbano.' },
  india:     { name:'India',            emisiones:'~8 Mt/año',         quote:'Lidera hoy las emisiones por quema de carbón. La OMS estima 1,7M muertes prematuras anuales.' },
  usa:       { name:'EE.UU.',           emisiones:'~2 Mt/año',         quote:'Las emisiones cayeron 95% desde 1980 gracias al Clean Air Act. Donde hay regulación, el SO₂ no es problema.' },
  europe:    { name:'Europa',           emisiones:'~2 Mt/año',         quote:'Reducción del 90% desde los 90. La Selva Negra alemana se está recuperando lentamente.' },
  argentina: { name:'Argentina · Dock Sud', emisiones:'Polo petroquímico crítico', quote:'Estudios de la UBA documentan impactos respiratorios sostenidos en barrios cercanos a Dock Sud y las refinerías de La Plata.' }
};
/* Hotspot positions in 0-1000 / 0-500 space */
var HOTSPOT_POS = {
  usa:       [195, 175],
  europe:    [548, 125],
  china:     [820, 185],
  india:     [705, 248],
  argentina: [295, 438]
};
function initMap() {
  var canvas = document.getElementById('map-canvas');
  if (!canvas) return;
  var wrap = canvas.parentElement;
  var W = 1000, H = 500;

  /* Build adjacency once, then triangulate (find all triangles in graph) */
  var trianglesCache = null;
  function computeTriangles(pts, edges) {
    if (trianglesCache) return trianglesCache;
    var adj = {};
    edges.forEach(function(e) {
      var a = e[0], b = e[1];
      (adj[a] = adj[a] || {})[b] = 1;
      (adj[b] = adj[b] || {})[a] = 1;
    });
    var tris = [];
    edges.forEach(function(e) {
      var a = e[0], b = e[1];
      if (!adj[a] || !adj[b]) return;
      Object.keys(adj[a]).forEach(function(c) {
        c = +c;
        if (c <= b) return;
        if (adj[b][c]) tris.push([a, b, c]);
      });
    });
    trianglesCache = tris;
    return tris;
  }

  function drawMap() {
    var cw = canvas.clientWidth || wrap.clientWidth || 800;
    var ch = Math.round(cw * H / W);
    canvas.width  = cw;
    canvas.height = ch;
    var scaleX = cw / W, scaleY = ch / H;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);

    var world = window.E64.LOWPOLY_WORLD;
    if (!world) return;
    var pts = world.pts, edges = world.edges;
    var tris = computeTriangles(pts, edges);

    /* Filled triangles — gold glow */
    for (var i = 0; i < tris.length; i++) {
      var t = tris[i];
      var p0 = pts[t[0]], p1 = pts[t[1]], p2 = pts[t[2]];
      ctx.beginPath();
      ctx.moveTo(p0[0]*scaleX, p0[1]*scaleY);
      ctx.lineTo(p1[0]*scaleX, p1[1]*scaleY);
      ctx.lineTo(p2[0]*scaleX, p2[1]*scaleY);
      ctx.closePath();
      /* Slight color variation per triangle for low-poly look */
      var v = (t[0] * 13 + t[1] * 7 + t[2] * 3) % 100;
      var alpha = 0.05 + (v / 100) * 0.08;
      ctx.fillStyle = 'rgba(245,197,24,' + alpha.toFixed(3) + ')';
      ctx.fill();
    }

    /* Edges — bright gold lines */
    ctx.strokeStyle = 'rgba(245,197,24,0.55)';
    ctx.lineWidth   = 1.0;
    ctx.lineCap     = 'round';
    edges.forEach(function(e) {
      var a = pts[e[0]], b = pts[e[1]];
      ctx.beginPath();
      ctx.moveTo(a[0]*scaleX, a[1]*scaleY);
      ctx.lineTo(b[0]*scaleX, b[1]*scaleY);
      ctx.stroke();
    });

    /* Nodes — bright gold dots with halo */
    pts.forEach(function(p) {
      var x = p[0]*scaleX, y = p[1]*scaleY;
      /* halo */
      var grad = ctx.createRadialGradient(x, y, 0, x, y, 5);
      grad.addColorStop(0, 'rgba(255,210,80,0.9)');
      grad.addColorStop(1, 'rgba(245,197,24,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI*2);
      ctx.fill();
      /* core */
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,225,140,0.95)';
      ctx.fill();
    });

    /* Update hotspot button positions */
    document.querySelectorAll('.map-hotspot').forEach(function(btn) {
      var region = btn.dataset.region;
      var pos    = HOTSPOT_POS[region];
      if (!pos) return;
      btn.style.left = Math.round(pos[0] * scaleX) + 'px';
      btn.style.top  = Math.round(pos[1] * scaleY) + 'px';
    });
  }

  drawMap();
  window.addEventListener('resize', drawMap, { passive: true });

  /* Hotspot clicks */
  var dockSudClicks = 0;
  document.querySelectorAll('.map-hotspot').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var region = btn.dataset.region;
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
function openRamiMapModal() {
  if (window.E64.unlockEgg) window.E64.unlockEgg('rami_egg_map');
  openModal('<div class="hotspot-info rami-modal-dark"><p style="font-family:var(--font-mono);font-size:0.8rem;letter-spacing:0.12em;color:#C9302C;margin-bottom:12px">COORDENADAS: -34.6533, -58.3508</p><h4 style="color:#C9302C">Refinería YPF — Sector 7</h4><p style="margin:8px 0;color:#aaa">Última inspección: <strong style="color:#fff">23/10/1991</strong></p><p style="margin:8px 0;color:#aaa">Personal desaparecido: <strong style="color:#C9302C">1</strong></p><p style="margin:8px 0;color:#888;font-style:italic">Causa oficial: "fuga menor sin víctimas"</p><p style="margin-top:20px;color:#C9302C;font-family:var(--font-mono);letter-spacing:0.15em;font-size:1.1rem">LO ESTÁN MINTIENDO.</p></div>', true);
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
    img.src = 'assets/img/sebastiancalvino.png';
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
  imgEl.innerHTML = '<img src="assets/img/ramapita2.png" style="width:100%;height:100%;object-fit:cover;filter:contrast(1.2) saturate(0.2) blur(1px) sepia(0.4);">';
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
