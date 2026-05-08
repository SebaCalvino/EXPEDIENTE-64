window.E64 = window.E64 || {};

window.E64.initBrokenScene = function(canvas) {
  var MB = window.E64.MoleculeBuilder;
  var s  = MB.createScene(canvas, true);
  s.camera.position.set(0, 0, 6);

  var molecule = MB.createSO2({ broken: true, scale: 1.1, emissiveBoost: 0.15 });
  s.scene.add(molecule);

  var ro = new ResizeObserver(function() { MB.fitCamera(s.camera, s.renderer, canvas); });
  ro.observe(canvas);
  MB.fitCamera(s.camera, s.renderer, canvas);

  var pulse = 0;
  var rafId = null;

  function animate() {
    pulse += 0.05;
    var intensity = 0.25 + Math.sin(pulse) * 0.15;
    molecule.traverse(function(o) {
      if (o.material && o.material.emissive) o.material.emissiveIntensity = intensity;
    });
    molecule.rotation.y += 0.006;
    s.renderer.render(s.scene, s.camera);
    rafId = requestAnimationFrame(animate);
  }
  animate();

  return {
    scene: s.scene, renderer: s.renderer, camera: s.camera, molecule: molecule,
    dispose: function() { cancelAnimationFrame(rafId); ro.disconnect(); s.renderer.dispose(); }
  };
};

window.E64.initCorrectScene = function(canvas) {
  var MB = window.E64.MoleculeBuilder;
  var s  = MB.createScene(canvas, true);
  s.camera.position.set(0, 0.5, 5.5);

  var molecule = MB.createSO2({ scale: 1.1, withLonePair: true });
  molecule.scale.setScalar(0.01);
  s.scene.add(molecule);

  var controls = null;
  if (THREE.OrbitControls) {
    controls = new THREE.OrbitControls(s.camera, canvas);
    controls.enableDamping   = true;
    controls.dampingFactor   = 0.08;
    controls.autoRotate      = true;
    controls.autoRotateSpeed = 1.5;
    controls.enablePan       = false;
  }

  // Sparkles
  var sparkCount = 80;
  var positions  = new Float32Array(sparkCount * 3);
  for (var i = 0; i < sparkCount; i++) {
    var r  = 2 + Math.random() * 2;
    var t  = Math.random() * Math.PI * 2;
    var p  = Math.acos(2 * Math.random() - 1);
    positions[i*3]   = r * Math.sin(p) * Math.cos(t);
    positions[i*3+1] = r * Math.sin(p) * Math.sin(t);
    positions[i*3+2] = r * Math.cos(p);
  }
  var sparkGeom = new THREE.BufferGeometry();
  sparkGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var sparkMat  = new THREE.PointsMaterial({ color: 0xF5C518, size: 0.08, transparent: true, opacity: 0.9 });
  var sparkles  = new THREE.Points(sparkGeom, sparkMat);
  s.scene.add(sparkles);

  var ro = new ResizeObserver(function() { MB.fitCamera(s.camera, s.renderer, canvas); });
  ro.observe(canvas);
  MB.fitCamera(s.camera, s.renderer, canvas);

  var t0 = performance.now();

  function animate() {
    var elapsed = (performance.now() - t0) / 1000;
    var target  = Math.min(1, elapsed / 1.2);
    var eased   = 1 - Math.pow(1 - target, 3);
    molecule.scale.setScalar(eased * 1.1);
    sparkles.rotation.y += 0.01;
    sparkMat.opacity = Math.max(0, 0.9 - elapsed * 0.3);
    if (controls) controls.update();
    s.renderer.render(s.scene, s.camera);
    requestAnimationFrame(animate);
  }
  animate();

  return { scene: s.scene, renderer: s.renderer, camera: s.camera, molecule: molecule };
};
