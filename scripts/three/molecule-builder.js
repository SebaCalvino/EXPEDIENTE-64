/* globals: THREE (loaded via CDN UMD build) */
window.E64 = window.E64 || {};

window.E64.MoleculeBuilder = (function() {
  var ATOM_COLORS = { S: 0xF5C518, O: 0xC9302C, H: 0xFAFAF7, LP: 0xFFFFFF };
  var ATOM_RADIUS = { S: 0.55, O: 0.42, H: 0.28, LP: 0.10 };

  function createAtom(symbol, opts) {
    opts = opts || {};
    var color  = opts.color  !== undefined ? opts.color  : (ATOM_COLORS[symbol] || 0xffffff);
    var radius = opts.radius !== undefined ? opts.radius : (ATOM_RADIUS[symbol] || 0.4);
    var geom = new THREE.SphereGeometry(radius, 32, 32);
    var mat  = new THREE.MeshStandardMaterial({
      color: color, metalness: 0.15, roughness: 0.4,
      emissive: color,
      emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 0.15,
      transparent: opts.transparent || false,
      opacity: opts.opacity !== undefined ? opts.opacity : 1
    });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.symbol = symbol;
    return mesh;
  }

  /* Build a cylinder from point A to point B */
  function buildCylinder(a, b, radius, matOpts) {
    var dir = new THREE.Vector3().subVectors(b, a);
    var len = dir.length();
    if (len < 0.001) return null;

    var geom = new THREE.CylinderGeometry(radius, radius, len, 20, 1);
    var mat  = new THREE.MeshStandardMaterial({
      color:             matOpts.color             !== undefined ? matOpts.color             : 0xCCCCCC,
      metalness:         0.5,
      roughness:         0.3,
      emissive:          matOpts.emissive          || 0x222222,
      emissiveIntensity: matOpts.emissiveIntensity !== undefined ? matOpts.emissiveIntensity : 0.15
    });

    var cyl = new THREE.Mesh(geom, mat);
    cyl.castShadow = true;

    /* Orient cylinder: CylinderGeometry is aligned along Y.
       Translate to midpoint, then rotate Y→dir */
    var mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    cyl.position.copy(mid);

    var norm = dir.clone().normalize();
    var yAxis = new THREE.Vector3(0, 1, 0);
    /* Handle degenerate anti-parallel case */
    if (norm.dot(yAxis) < -0.9999) {
      cyl.rotation.set(Math.PI, 0, 0);
    } else {
      var quat = new THREE.Quaternion().setFromUnitVectors(yAxis, norm);
      cyl.quaternion.copy(quat);
    }
    return cyl;
  }

  function createBond(start, end, type, opts) {
    type = type || 'single'; opts = opts || {};
    var group = new THREE.Group();
    var dir   = new THREE.Vector3().subVectors(end, start);
    var BOND_R = 0.10;

    var matOpts = {
      color:             opts.color             !== undefined ? opts.color             : 0xBBBBBB,
      emissive:          opts.emissive          || 0x111111,
      emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 0.10
    };

    if (type === 'single') {
      var c = buildCylinder(start, end, BOND_R, matOpts);
      if (c) group.add(c);
    } else if (type === 'double') {
      /* Offset two cylinders perpendicularly */
      var perp = new THREE.Vector3();
      var absX = Math.abs(dir.x), absY = Math.abs(dir.y), absZ = Math.abs(dir.z);
      /* Pick axis least aligned with dir to form cross product */
      if (absX <= absY && absX <= absZ) perp.set(1, 0, 0);
      else if (absY <= absZ)            perp.set(0, 1, 0);
      else                              perp.set(0, 0, 1);
      perp.crossVectors(dir, perp).normalize().multiplyScalar(0.14);

      var aOff1 = start.clone().add(perp),   bOff1 = end.clone().add(perp);
      var aOff2 = start.clone().sub(perp),   bOff2 = end.clone().sub(perp);
      var c1 = buildCylinder(aOff1, bOff1, BOND_R * 0.85, matOpts);
      var c2 = buildCylinder(aOff2, bOff2, BOND_R * 0.85, matOpts);
      if (c1) group.add(c1);
      if (c2) group.add(c2);
    }
    group.userData.bondType = type;
    return group;
  }

  function addLonePair(parent, position, direction) {
    direction = direction || new THREE.Vector3(0, 1, 0);
    var lp     = new THREE.Group();
    var offset = direction.clone().normalize().multiplyScalar(0.22);
    var perp   = new THREE.Vector3();
    var d = direction.clone().normalize();
    if (Math.abs(d.x) <= Math.abs(d.y) && Math.abs(d.x) <= Math.abs(d.z))
      perp.set(1, 0, 0);
    else if (Math.abs(d.y) <= Math.abs(d.z))
      perp.set(0, 1, 0);
    else
      perp.set(0, 0, 1);
    perp.crossVectors(d, perp).normalize().multiplyScalar(0.18);

    [1, -1].forEach(function(sign) {
      var e = createAtom('LP', {
        color: 0xFFFFFF, radius: 0.09, emissiveIntensity: 0.6,
        transparent: true, opacity: 0.75
      });
      e.position.copy(position).add(offset).add(perp.clone().multiplyScalar(sign));
      lp.add(e);
    });
    parent.add(lp);
    return lp;
  }

  function createSO2(opts) {
    opts = opts || {};
    var broken  = opts.broken      || false;
    var scale   = opts.scale       || 1;
    var withLP  = opts.withLonePair !== false;
    var emBoost = opts.emissiveBoost || 0;

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
      /* Bent geometry ~119°: compute from half-angle 59.5° */
      var halfAngle = 59.5 * Math.PI / 180;
      var r = 1.48;
      leftPos  = new THREE.Vector3(-Math.sin(halfAngle) * r, -Math.cos(halfAngle) * r, 0);
      rightPos = new THREE.Vector3( Math.sin(halfAngle) * r, -Math.cos(halfAngle) * r, 0);
      leftBType  = 'double';
      rightBType = 'single';
    }

    var bColor = broken ? 0xC9302C : 0x9CA3AF;
    var bEmis  = broken ? 0xC9302C : 0x111111;
    var bEI    = broken ? 0.4 : 0.05;

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
      group.add(O3);
      group.add(createBond(S.position, upPos, 'single', { color: bColor, emissive: bEmis, emissiveIntensity: bEI }));
    } else if (withLP) {
      addLonePair(group, S.position, new THREE.Vector3(0, 1, 0));
    }

    /* Center group so its visual centroid is at local origin */
    var box = new THREE.Box3().setFromObject(group);
    var center = new THREE.Vector3();
    box.getCenter(center);
    group.children.forEach(function(child) {
      child.position.sub(center);
    });

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
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    var key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(5, 6, 4);
    key.castShadow = true;
    scene.add(key);

    var rim = new THREE.DirectionalLight(0xF5C518, 0.6);
    rim.position.set(-4, -2, -3);
    scene.add(rim);

    var fill = new THREE.PointLight(0xC9302C, 0.5, 20);
    fill.position.set(-3, 3, 2);
    scene.add(fill);

    /* Ensure canvas receives pointer events for OrbitControls */
    canvas.style.touchAction = 'none';

    return { scene: scene, renderer: renderer, camera: camera };
  }

  function fitCamera(camera, renderer, canvas) {
    var w = canvas.clientWidth  || canvas.width  || 400;
    var h = canvas.clientHeight || canvas.height || 400;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  return { createAtom: createAtom, createBond: createBond, addLonePair: addLonePair,
           createSO2: createSO2, createScene: createScene, fitCamera: fitCamera };
})();
