import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { createSO2, createScene, fitCameraToCanvas } from './molecule-builder.js';

export function initHeroScene(canvas) {
  const { scene, renderer, camera } = createScene({ canvas, transparent: true });
  camera.position.set(0, 0, 12);

  const molecules = [];
  const N = window.innerWidth < 768 ? 4 : 6;

  for (let i = 0; i < N; i++) {
    const m = createSO2({ scale: 0.45 + Math.random() * 0.35, withLonePair: true });
    m.position.set(
      (Math.random() - 0.5) * 14,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 6 - 2
    );
    m.userData.driftSpeed = 0.05 + Math.random() * 0.1;
    m.userData.rotSpeed = (Math.random() - 0.5) * 0.6;
    m.userData.phase = Math.random() * Math.PI * 2;
    scene.add(m);
    molecules.push(m);
  }

  let isVisible = true;
  let rafId = null;
  const clock = new THREE.Clock();

  const resize = () => fitCameraToCanvas(camera, renderer, canvas);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const animate = () => {
    if (!isVisible) { rafId = null; return; }
    const t = clock.getElapsedTime();
    const dt = clock.getDelta();
    molecules.forEach((m, i) => {
      m.rotation.y += dt * m.userData.rotSpeed * 0.5;
      m.rotation.x += dt * m.userData.rotSpeed * 0.2;
      m.position.y += Math.sin(t * m.userData.driftSpeed + m.userData.phase) * 0.003;
      m.position.x += Math.cos(t * m.userData.driftSpeed * 0.7 + m.userData.phase) * 0.002;
    });
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
  animate();

  return { scene, renderer, camera, molecules };
}
