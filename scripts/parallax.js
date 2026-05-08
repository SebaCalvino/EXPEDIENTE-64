window.E64 = window.E64 || {};

window.E64.initParallax = function() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var layers = document.querySelectorAll('[data-parallax]');
  if (!layers.length) return;
  var ticking = false;
  function update() {
    var scrollY = window.scrollY;
    layers.forEach(function(layer) {
      var speed  = parseFloat(layer.dataset.parallax) || 0.3;
      var parent = layer.parentElement;
      var offset = (scrollY - parent.offsetTop) * speed;
      layer.style.transform = 'translate3d(0,' + offset + 'px,0)';
    });
    ticking = false;
  }
  window.addEventListener('scroll', function() {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
};

window.E64.initReveal = function() {
  var els = document.querySelectorAll('.reveal');
  if (!window.IntersectionObserver) {
    els.forEach(function(el) { el.classList.add('visible'); });
    return;
  }
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(function(el) { io.observe(el); });
};
