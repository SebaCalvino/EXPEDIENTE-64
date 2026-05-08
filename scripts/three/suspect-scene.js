window.E64 = window.E64 || {};

window.E64.initSuspectScene = function(canvas) {
  var MB = window.E64.MoleculeBuilder;
  var s  = MB.createScene(canvas, true);
  s.camera.position.set(0, 0, 5.5);
  s.camera.lookAt(0, 0, 0);

  var molecule = MB.createSO2({ scale: 1.15, withLonePair: true });
  s.scene.add(molecule);

  var controls = null;
  if (typeof THREE !== 'undefined' && THREE.OrbitControls) {
    controls = new THREE.OrbitControls(s.camera, s.renderer.domElement);
    controls.enableDamping   = true;
    controls.dampingFactor   = 0.08;
    controls.autoRotate      = true;
    controls.autoRotateSpeed = 0.8;
    controls.enablePan       = false;
    controls.minDistance     = 3;
    controls.maxDistance     = 12;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      controls.autoRotate = false;
    }

    /* Pause autoRotate on interaction, resume after 3s */
    var resumeTimer = null;
    controls.addEventListener('start', function() {
      controls.autoRotate = false;
      if (resumeTimer) clearTimeout(resumeTimer);
    });
    controls.addEventListener('end', function() {
      resumeTimer = setTimeout(function() {
        controls.autoRotate = true;
      }, 3000);
    });
  }

  var isVisible = false;
  var rafId = null;
  var ro = new ResizeObserver(function() { MB.fitCamera(s.camera, s.renderer, canvas); });
  ro.observe(canvas);
  MB.fitCamera(s.camera, s.renderer, canvas);

  function animate() {
    if (!isVisible) { rafId = null; return; }
    if (controls) {
      controls.update();
    } else {
      molecule.rotation.y += 0.008;
    }
    s.renderer.render(s.scene, s.camera);
    rafId = requestAnimationFrame(animate);
  }

  if (window.IntersectionObserver) {
    new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        isVisible = e.isIntersecting;
        if (isVisible && !rafId) animate();
      });
    }, { threshold: 0.05 }).observe(canvas);
  } else {
    isVisible = true; animate();
  }
};

window.E64.initAmbientBackgroundScene = function(canvas) {
  var MB = window.E64.MoleculeBuilder;
  var s  = MB.createScene(canvas, true);
  s.camera.position.set(0, 0, 7);
  s.camera.lookAt(0, 0, 0);

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
