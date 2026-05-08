window.E64 = window.E64 || {};

window.E64.initHeroScene = function(canvas) {
  var MB = window.E64.MoleculeBuilder;
  var s  = MB.createScene(canvas, true);
  s.camera.position.set(0, 0, 12);

  var N = window.innerWidth < 768 ? 4 : 6;
  var molecules = [];
  for (var i = 0; i < N; i++) {
    var m = MB.createSO2({ scale: 0.45 + Math.random() * 0.35, withLonePair: true });
    m.position.set(
      (Math.random() - 0.5) * 14,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 6 - 2
    );
    m.userData.driftSpeed = 0.05 + Math.random() * 0.1;
    m.userData.rotSpeed   = (Math.random() - 0.5) * 0.6;
    m.userData.phase      = Math.random() * Math.PI * 2;
    s.scene.add(m);
    molecules.push(m);
  }

  var isVisible = true;
  var rafId = null;
  var lastT = 0;

  var ro = new ResizeObserver(function() { MB.fitCamera(s.camera, s.renderer, canvas); });
  ro.observe(canvas);
  MB.fitCamera(s.camera, s.renderer, canvas);

  function animate(t) {
    if (!isVisible) { rafId = null; return; }
    var dt = (t - lastT) / 1000; lastT = t;
    if (dt > 0.1) dt = 0.1;
    molecules.forEach(function(m) {
      m.rotation.y += dt * m.userData.rotSpeed * 0.5;
      m.rotation.x += dt * m.userData.rotSpeed * 0.2;
      m.position.y += Math.sin(t * 0.001 * m.userData.driftSpeed + m.userData.phase) * 0.003;
      m.position.x += Math.cos(t * 0.0007 * m.userData.driftSpeed + m.userData.phase) * 0.002;
    });
    s.renderer.render(s.scene, s.camera);
    rafId = requestAnimationFrame(animate);
  }

  if (window.IntersectionObserver) {
    new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        isVisible = e.isIntersecting;
        if (isVisible && !rafId) rafId = requestAnimationFrame(animate);
      });
    }).observe(canvas);
  }
  rafId = requestAnimationFrame(animate);
};
