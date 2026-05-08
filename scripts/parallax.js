export function initParallax() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const layers = document.querySelectorAll('[data-parallax]');
  if (!layers.length) return;

  let ticking = false;

  const update = () => {
    const scrollY = window.scrollY;
    layers.forEach(layer => {
      const speed = parseFloat(layer.dataset.parallax) || 0.3;
      const rect = layer.parentElement.getBoundingClientRect();
      const offset = (scrollY - layer.parentElement.offsetTop) * speed;
      layer.style.transform = `translate3d(0, ${offset}px, 0)`;
    });
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  update();
}

export function initReveal() {
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}
