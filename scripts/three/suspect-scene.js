window.E64 = window.E64 || {};

window.E64.initSuspectScene = function(canvas) {
  var MB = window.E64.MoleculeBuilder;
  var s  = MB.createScene(canvas, true);
  s.camera.position.set(0, 0.6, 5);

  var molecule = MB.createSO2({ scale: 1.1, withLonePair: true });
  s.scene.add(molecule);

  var controls = null;
  if (THREE.OrbitControls) {
    controls = new THREE.OrbitControls(s.camera, canvas);
    controls.enableDamping   = true;
    controls.dampingFactor   = 0.08;
    controls.autoRotate      = true;
    controls.autoRotateSpeed = 1.0;
    controls.enablePan       = false;
    controls.minDistance     = 3;
    controls.maxDistance     = 10;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) controls.autoRotate = false;
  }

  var isVisible = false;
  var rafId = null;
  var ro = new ResizeObserver(function() { MB.fitCamera(s.camera, s.renderer, canvas); });
  ro.observe(canvas);
  MB.fitCamera(s.camera, s.renderer, canvas);

  function animate() {
    if (!isVisible) { rafId = null; return; }
    if (!controls) molecule.rotation.y += 0.008;
    if (controls) controls.update();
    s.renderer.render(s.scene, s.camera);
    rafId = requestAnimationFrame(animate);
  }

  if (window.IntersectionObserver) {
    new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        isVisible = e.isIntersecting;
        if (isVisible && !rafId) animate();
      });
    }, { threshold: 0.1 }).observe(canvas);
  } else {
    isVisible = true; animate();
  }
};

window.E64.initAmbientBackgroundScene = function(canvas) {
  var MB = window.E64.MoleculeBuilder;
  var s  = MB.createScene(canvas, true);
  s.camera.position.set(0, 0, 7);

  var molecule = MB.createSO2({ scale: 2.2, withLonePair: true });
  molecule.traverse(function(o) {
    if (o.material) { o.material.transparent = true; o.material.opacity = 0.18; }
  });
  s.scene.add(molecule);

  var isVisible = false;
  var rafId = null;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ro = new ResizeObserver(function() { MB.fitCamera(s.camera, s.renderer, canvas); });
  ro.observe(canvas);
  MB.fitCamera(s.camera, s.renderer, canvas);

  function animate() {
    if (!isVisible) { rafId = null; return; }
    if (!reduce) { molecule.rotation.y += 0.003; molecule.rotation.x += 0.001; }
    s.renderer.render(s.scene, s.camera);
    rafId = requestAnimationFrame(animate);
  }

  if (window.IntersectionObserver) {
    new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        isVisible = e.isIntersecting;
        if (isVisible && !rafId) animate();
      });
    }).observe(canvas);
  } else {
    isVisible = true; animate();
  }
};
