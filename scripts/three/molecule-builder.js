/* globals: THREE (loaded via CDN UMD build) */
window.E64 = window.E64 || {};

window.E64.MoleculeBuilder = (function() {
  const ATOM_COLORS = { S: 0xF5C518, O: 0xC9302C, H: 0xFAFAF7, LP: 0xFFFFFF };
  const ATOM_RADIUS = { S: 0.55, O: 0.42, H: 0.28, LP: 0.10 };

  function createAtom(symbol, opts) {
    opts = opts || {};
    const color  = opts.color  !== undefined ? opts.color  : (ATOM_COLORS[symbol] || 0xffffff);
    const radius = opts.radius !== undefined ? opts.radius : (ATOM_RADIUS[symbol] || 0.4);
    const geom = new THREE.SphereGeometry(radius, 32, 32);
    const mat  = new THREE.MeshStandardMaterial({
      color: color, metalness: 0.15, roughness: 0.4,
      emissive: color,
      emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 0.15,
      transparent: opts.transparent || false,
      opacity: opts.opacity !== undefined ? opts.opacity : 1
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.symbol = symbol;
    return mesh;
  }

  function createBond(start, end, type, opts) {
    type = type || 'single'; opts = opts || {};
    const group = new THREE.Group();
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    function buildCyl(offset) {
      const geom = new THREE.CylinderGeometry(0.11, 0.11, len, 20);
      const mat  = new THREE.MeshStandardMaterial({
        color: opts.color !== undefined ? opts.color : 0xCCCCCC,
        metalness: 0.5, roughness: 0.3,
        emissive: opts.emissive || 0x222222,
        emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 0.15
      });
      const cyl = new THREE.Mesh(geom, mat);
      cyl.castShadow = true;
      const pos = mid.clone();
      if (offset) pos.add(offset);
      cyl.position.copy(pos);
      cyl.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize()
      );
      return cyl;
    }

    if (type === 'single') {
      group.add(buildCyl());
    } else if (type === 'double') {
      let perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize().multiplyScalar(0.18);
      if (perp.lengthSq() < 0.001) perp.set(0.18, 0, 0);
      group.add(buildCyl(perp));
      group.add(buildCyl(perp.clone().negate()));
    }
    group.userData.bondType = type;
    return group;
  }

  function addLonePair(parent, position, direction) {
    direction = direction || new THREE.Vector3(0, 1, 0);
    const lp     = new THREE.Group();
    const offset = direction.clone().normalize().multiplyScalar(0.18);
    let perp = new THREE.Vector3(-direction.y, direction.x, 0).normalize().multiplyScalar(0.18);
    if (perp.lengthSq() < 0.001) perp.set(0.18, 0, 0);
    [1, -1].forEach(function(sign) {
      const e = createAtom('LP', {
        color: 0xFFFFFF, radius: 0.09, emissiveIntensity: 0.6,
        transparent: true, opacity: 0.8
      });
      e.position.copy(position).add(offset).add(perp.clone().multiplyScalar(sign));
      lp.add(e);
    });
    parent.add(lp);
    return lp;
  }

  function createSO2(opts) {
    opts = opts || {};
    var broken      = opts.broken || false;
    var scale       = opts.scale  || 1;
    var withLP      = opts.withLonePair !== false;
    var emBoost     = opts.emissiveBoost || 0;

    var group = new THREE.Group();

    var S = createAtom('S', { emissiveIntensity: 0.2 + emBoost });
    S.position.set(0, 0, 0);
    group.add(S);

    var leftPos, rightPos, leftBType, rightBType;
    if (broken) {
      leftPos    = new THREE.Vector3(-1.6, 0, 0);
      rightPos   = new THREE.Vector3( 1.6, 0, 0);
      leftBType  = 'single';
      rightBType = 'single';
    } else {
      var ang = (180 - 119) * Math.PI / 360;
      var r   = 1.52;
      leftPos  = new THREE.Vector3(-Math.sin(ang) * r, -Math.cos(ang) * r * 0.4, 0);
      rightPos = new THREE.Vector3( Math.sin(ang) * r, -Math.cos(ang) * r * 0.4, 0);
      leftBType  = 'double';
      rightBType = 'single';
    }

    var bColor = broken ? 0xC9302C : 0x9CA3AF;
    var bEmis  = broken ? 0xC9302C : 0x000000;
    var bEI    = broken ? 0.4 : 0;

    var O1 = createAtom('O', { emissiveIntensity: 0.18 + emBoost });
    O1.position.copy(leftPos);
    group.add(O1);

    var O2 = createAtom('O', { emissiveIntensity: 0.18 + emBoost });
    O2.position.copy(rightPos);
    group.add(O2);

    group.add(createBond(S.position, leftPos,  leftBType,  { color: bColor, emissive: bEmis, emissiveIntensity: bEI }));
    group.add(createBond(S.position, rightPos, rightBType, { color: bColor, emissive: bEmis, emissiveIntensity: bEI }));

    if (broken) {
      var upPos = new THREE.Vector3(0, 1.5, 0);
      var O3 = createAtom('O', { emissiveIntensity: 0.18 });
      O3.position.copy(upPos);
      group.add(createBond(S.position, upPos, 'single', { color: bColor, emissive: bEmis, emissiveIntensity: bEI }));
      group.add(O3);
    } else if (withLP) {
      addLonePair(group, S.position, new THREE.Vector3(0, 1, 0));
    }

    group.scale.setScalar(scale);
    return group;
  }

  function createScene(canvas, transparent) {
    transparent = transparent !== false;
    var scene    = new THREE.Scene();
    if (!transparent) scene.background = new THREE.Color(0x0F1419);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: transparent });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    var key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(5, 6, 4);
    key.castShadow = true;
    scene.add(key);

    var rim = new THREE.DirectionalLight(0xF5C518, 0.5);
    rim.position.set(-4, -2, -3);
    scene.add(rim);

    var fill = new THREE.PointLight(0xC9302C, 0.4, 20);
    fill.position.set(-3, 3, 2);
    scene.add(fill);

    return { scene: scene, renderer: renderer, camera: camera };
  }

  function fitCamera(camera, renderer, canvas) {
    var w = canvas.clientWidth  || 1;
    var h = canvas.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  return { createAtom, createBond, addLonePair, createSO2, createScene, fitCamera };
})();
