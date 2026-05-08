import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { createSO2, createScene, fitCameraToCanvas } from './molecule-builder.js';

export function initBrokenScene(canvas) {
  const { scene, renderer, camera } = createScene({ canvas, transparent: true });
  camera.position.set(0, 0, 6);

  const molecule = createSO2({ broken: true, scale: 1.1, withLonePair: false, emissiveBoost: 0.15 });
  scene.add(molecule);

  let rafId = null;
  let isVisible = true;
  let pulse = 0;

  const resize = () => fitCameraToCanvas(camera, renderer, canvas);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const animate = () => {
    if (!isVisible) { rafId = null; return; }
    pulse += 0.05;
    const intensity = 0.25 + Math.sin(pulse) * 0.15;
    molecule.traverse(o => {
      if (o.material && o.material.emissive) {
        o.material.emissiveIntensity = intensity;
      }
    });
    molecule.rotation.y += 0.005;
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  };
  animate();

  const dispose = () => {
    isVisible = false;
    ro.disconnect();
    renderer.dispose();
  };

  return { scene, renderer, camera, molecule, dispose };
}

export function initCorrectScene(canvas) {
  const { scene, renderer, camera } = createScene({ canvas, transparent: true });
  camera.position.set(0, 0.5, 5.5);

  const molecule = createSO2({ scale: 1.1, withLonePair: true });
  molecule.scale.setScalar(0.01);
  scene.add(molecule);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.5;
  controls.enablePan = false;

  // Sparkles
  const sparkGeom = new THREE.BufferGeometry();
  const sparkCount = 80;
  const positions = new Float32Array(sparkCount * 3);
  for (let i = 0; i < sparkCount; i++) {
    const r = 2 + Math.random() * 2;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    positions[i*3] = r * Math.sin(p) * Math.cos(t);
    positions[i*3+1] = r * Math.sin(p) * Math.sin(t);
    positions[i*3+2] = r * Math.cos(p);
  }
  sparkGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const sparkMat = new THREE.PointsMaterial({
    color: 0xF5C518,
    size: 0.08,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });
  const sparkles = new THREE.Points(sparkGeom, sparkMat);
  scene.add(sparkles);

  let rafId = null;
  let isVisible = true;
  let t0 = performance.now();

  const resize = () => fitCameraToCanvas(camera, renderer, canvas);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const animate = () => {
    if (!isVisible) { rafId = null; return; }
    const t = (performance.now() - t0) / 1000;
    const target = Math.min(1, t / 1.2);
    const eased = 1 - Math.pow(1 - target, 3);
    molecule.scale.setScalar(eased * 1.1);
    sparkles.rotation.y += 0.01;
    sparkMat.opacity = Math.max(0, 0.9 - t * 0.3);
    controls.update();
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  };
  animate();

  return { scene, renderer, camera, molecule, controls };
}
