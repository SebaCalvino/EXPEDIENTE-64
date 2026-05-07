import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { createSO2, createScene, fitCameraToCanvas } from './molecule-builder.js';

export function initSuspectScene(canvas) {
  const { scene, renderer, camera } = createScene({ canvas, transparent: true });
  camera.position.set(0, 0.6, 5);

  const molecule = createSO2({ scale: 1.1, withLonePair: true });
  scene.add(molecule);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.0;
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 10;

  let isVisible = false;
  let rafId = null;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) controls.autoRotate = false;

  const resize = () => fitCameraToCanvas(camera, renderer, canvas);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const animate = () => {
    if (!isVisible) { rafId = null; return; }
    controls.update();
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  };

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      isVisible = e.isIntersecting;
      if (isVisible && !rafId) animate();
    });
  }, { threshold: 0.1 });
  io.observe(canvas);

  return { scene, renderer, camera, molecule, controls };
}

export function initAmbientBackgroundScene(canvas) {
  const { scene, renderer, camera } = createScene({ canvas, transparent: true });
  camera.position.set(0, 0, 7);

  const molecule = createSO2({ scale: 2.2, withLonePair: true });
  molecule.traverse(o => {
    if (o.material) {
      o.material.transparent = true;
      o.material.opacity = 0.18;
    }
  });
  scene.add(molecule);

  let isVisible = false;
  let rafId = null;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const resize = () => fitCameraToCanvas(camera, renderer, canvas);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const animate = () => {
    if (!isVisible) { rafId = null; return; }
    if (!reduce) {
      molecule.rotation.y += 0.003;
      molecule.rotation.x += 0.001;
    }
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  };

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      isVisible = e.isIntersecting;
      if (isVisible && !rafId) animate();
    });
  });
  io.observe(canvas);

  return { scene, renderer, camera };
}
