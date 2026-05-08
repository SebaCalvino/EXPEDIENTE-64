import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const ATOM_COLORS = {
  S: 0xF5C518,
  O: 0xC9302C,
  H: 0xFAFAF7,
  LP: 0xFAFAF7
};

const ATOM_RADIUS = {
  S: 0.55,
  O: 0.42,
  H: 0.28,
  LP: 0.10
};

export function createAtom(symbol, opts = {}) {
  const color = opts.color ?? ATOM_COLORS[symbol] ?? 0xffffff;
  const radius = opts.radius ?? ATOM_RADIUS[symbol] ?? 0.4;
  const geom = new THREE.SphereGeometry(radius, 48, 48);
  const mat = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.1,
    roughness: 0.35,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
    emissive: color,
    emissiveIntensity: opts.emissiveIntensity ?? 0.15,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.symbol = symbol;
  return mesh;
}

export function createBond(start, end, type = 'single', opts = {}) {
  const group = new THREE.Group();
  const dir = new THREE.Vector3().subVectors(end, start);
  const len = dir.length();
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  const buildCyl = (offset) => {
    const geom = new THREE.CylinderGeometry(0.08, 0.08, len, 24, 1, false);
    const mat = new THREE.MeshStandardMaterial({
      color: opts.color ?? 0x9CA3AF,
      metalness: 0.4,
      roughness: 0.4,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissiveIntensity ?? 0
    });
    const cyl = new THREE.Mesh(geom, mat);
    cyl.castShadow = true;
    cyl.position.copy(mid);
    if (offset) cyl.position.add(offset);
    cyl.lookAt(end.clone().add(offset || new THREE.Vector3()));
    cyl.rotateX(Math.PI / 2);
    return cyl;
  };

  if (type === 'single') {
    group.add(buildCyl());
  } else if (type === 'double') {
    const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize().multiplyScalar(0.13);
    if (perp.lengthSq() < 0.01) perp.set(0.13, 0, 0);
    group.add(buildCyl(perp));
    group.add(buildCyl(perp.clone().negate()));
  } else if (type === 'triple') {
    const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize().multiplyScalar(0.16);
    group.add(buildCyl());
    group.add(buildCyl(perp));
    group.add(buildCyl(perp.clone().negate()));
  }

  group.userData.bondType = type;
  return group;
}

export function addLonePair(parent, position, direction = new THREE.Vector3(0, 1, 0)) {
  const lp = new THREE.Group();
  const offset = direction.clone().normalize().multiplyScalar(0.18);
  const perp = new THREE.Vector3(direction.y, -direction.x, 0).normalize().multiplyScalar(0.18);
  if (perp.lengthSq() < 0.01) perp.set(0.18, 0, 0);

  for (const sign of [1, -1]) {
    const e = createAtom('LP', {
      color: 0xFFFFFF,
      radius: 0.10,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85
    });
    e.position.copy(position).add(offset).add(perp.clone().multiplyScalar(sign));
    lp.add(e);
  }
  parent.add(lp);
  return lp;
}

export function createSO2({
  broken = false,
  scale = 1,
  withLonePair = true,
  emissiveBoost = 0
} = {}) {
  const group = new THREE.Group();

  const S = createAtom('S', { emissiveIntensity: 0.2 + emissiveBoost });
  S.position.set(0, 0, 0);
  group.add(S);

  let leftPos, rightPos;
  let leftBondType, rightBondType;

  if (broken) {
    leftPos = new THREE.Vector3(-1.6, 0, 0);
    rightPos = new THREE.Vector3(1.6, 0, 0);
    leftBondType = 'single';
    rightBondType = 'single';
  } else {
    const angle = (180 - 119) * Math.PI / 360;
    const r = 1.55;
    leftPos = new THREE.Vector3(-Math.sin(angle) * r, -Math.cos(angle) * r * 0.3, 0);
    rightPos = new THREE.Vector3(Math.sin(angle) * r, -Math.cos(angle) * r * 0.3, 0);
    leftBondType = 'double';
    rightBondType = 'single';
  }

  const O1 = createAtom('O', { emissiveIntensity: 0.18 + emissiveBoost });
  O1.position.copy(leftPos);
  group.add(O1);

  const O2 = createAtom('O', { emissiveIntensity: 0.18 + emissiveBoost });
  O2.position.copy(rightPos);
  group.add(O2);

  const bondColor = broken ? 0xC9302C : 0x9CA3AF;
  const bondEmissive = broken ? 0xC9302C : 0x000000;
  const bondEmissiveIntensity = broken ? 0.4 : 0;

  const b1 = createBond(S.position, leftPos, leftBondType, {
    color: bondColor, emissive: bondEmissive, emissiveIntensity: bondEmissiveIntensity
  });
  const b2 = createBond(S.position, rightPos, rightBondType, {
    color: bondColor, emissive: bondEmissive, emissiveIntensity: bondEmissiveIntensity
  });
  group.add(b1, b2);

  if (broken) {
    const b3 = createBond(S.position, new THREE.Vector3(0, 1.5, 0), 'single', {
      color: bondColor, emissive: bondEmissive, emissiveIntensity: bondEmissiveIntensity
    });
    const O3 = createAtom('O', { emissiveIntensity: 0.18 });
    O3.position.set(0, 1.5, 0);
    group.add(b3, O3);
    group.userData.O3 = O3;
    group.userData.b3 = b3;
  } else if (withLonePair) {
    addLonePair(group, S.position, new THREE.Vector3(0, 1, 0));
  }

  group.userData.atoms = { S, O1, O2 };
  group.userData.bonds = { b1, b2 };
  group.userData.broken = broken;
  group.scale.setScalar(scale);

  return group;
}

export function createScene({ canvas, transparent = true, antialias = true } = {}) {
  const scene = new THREE.Scene();
  if (!transparent) {
    scene.background = new THREE.Color(0x0F1419);
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias, alpha: transparent });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(5, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xF5C518, 0.5);
  rim.position.set(-4, -2, -3);
  scene.add(rim);

  const fill = new THREE.PointLight(0xC9302C, 0.4, 20);
  fill.position.set(-3, 3, 2);
  scene.add(fill);

  return { scene, renderer, camera };
}

export function fitCameraToCanvas(camera, renderer, canvas) {
  const w = canvas.clientWidth || 1;
  const h = canvas.clientHeight || 1;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
