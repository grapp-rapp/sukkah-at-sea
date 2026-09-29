// ---------------------------------------------------------------- parametric sukkah (all sizes in cm in CFG, metres in 3D)
const CFG = {
  shiur: 'naeh', day: 'first', hour: 17.4, boat: 'anchored', wind: 16, rain: 0, seasick: false,
  vehicle: 'pickup', strapped: true, driving: false,
  w: 150, d: 175, h: 190, wallH: 185, wallGap: 4,
  walls: '4', wallType: 'canvas', tied: true,
  schach: 'palm', amount: 70, avir: 0, supports: 'wood', overhead: 'none',
  order: 'walls', old: false, renewed: false, permission: true, decor: true,
};
const SUK = { root: null, vehicle: null, vehicleKind: null, panels: [], lights: [], bulbMat: null, grid: null, GW: 128, GH: 128, shade: 0, avirMax: 0, pieces: 0, wobble: 0 };

// ---- canvas / sheet walls with wind billow (edges tied or free hanging)
function makeWallMaterial(tex, uScale, kind) {
  const t = tex.clone(); t.needsUpdate = true; t.repeat.set(uScale, 1);
  const wv = TEX.weave.normalMap.clone(); wv.needsUpdate = true; wv.repeat.set(uScale * 50, 25);
  const m = new THREE.MeshStandardMaterial({ map: t, normalMap: wv, normalScale: new THREE.Vector2(0.45, 0.45), roughness: 0.93, side: THREE.DoubleSide });
  m.userData.amp = { value: 0 }; m.userData.tied = { value: 1 }; m.userData.seed = { value: rand() * 10 };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.time; sh.uniforms.uAmp = m.userData.amp; sh.uniforms.uTied = m.userData.tied; sh.uniforms.uSeed = m.userData.seed;
    sh.vertexShader = 'uniform float uTime, uAmp, uTied, uSeed;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float hang = 1.0 - uv.y;
      float prof = mix(sin(uv.x * 3.14159) * (0.2 + 0.8 * hang), sin(uv.x * 3.14159) * sin(uv.y * 3.14159), uTied);
      float ph = uTime * (1.4 + uAmp * 0.8) + uSeed;
      float wave = sin(ph + uv.x * 4.0) * 0.6 + sin(ph * 2.3 + uv.x * 11.0 + uv.y * 5.0) * 0.3 + sin(ph * 0.5 + uSeed) * 0.6;
      transformed.z += prof * wave * uAmp + sin(uv.x * 70.0) * 0.004 * (1.0 - uTied * 0.6);
      transformed.y += (1.0 - uTied) * hang * abs(wave) * uAmp * 0.25;`);
  };
  return m;
}
function sheetTex() {
  return paintTex(512, 256, (g, W, H) => {
    g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { const x = (i * 97) % W, y = (i * 53) % H; g.fillStyle = ['#e7a3b6', '#a9c7e8', '#f2d27a'][i % 3]; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + Math.cos(k * 1.26) * 6, y + Math.sin(k * 1.26) * 6, 5, 3, k * 1.26, 0, TAU); g.fill(); } g.fillStyle = '#e9c24a'; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); }
  });
}
function plyTex() { return TEX.wood.map; }

const M = {};
function sukkahMaterials() {
  M.wood = new THREE.MeshStandardMaterial({ ...TEX.wood, roughness: 1 });
  M.alu = new THREE.MeshStandardMaterial({ color: 0xc9ced2, metalness: 0.9, roughness: 0.35 });
  M.bamboo = new THREE.MeshStandardMaterial({ color: 0xc4ad6c, roughness: 0.55 });
  M.bambooDark = new THREE.MeshStandardMaterial({ color: 0xa88f52, roughness: 0.6 });
  M.board = new THREE.MeshStandardMaterial({ ...TEX.wood, roughness: 0.95, color: 0xe6d2b0 });
  M.tarp = new THREE.MeshStandardMaterial({ color: 0x2d62b8, roughness: 0.6, side: THREE.DoubleSide });
  M.metal = new THREE.MeshStandardMaterial({ color: 0xa4aaae, metalness: 0.85, roughness: 0.4, side: THREE.DoubleSide });
  M.cob = new THREE.MeshStandardMaterial({ color: 0xe8c23a, roughness: 0.6 });
  M.husk = new THREE.MeshStandardMaterial({ color: 0x9fb45a, roughness: 0.8, side: THREE.DoubleSide });
  M.strap = new THREE.MeshStandardMaterial({ color: 0xf0b21a, roughness: 0.7 });
  M.ply = new THREE.MeshStandardMaterial({ ...TEX.wood, roughness: 0.9, color: 0xf0dcc0 });
  M.pine = windify(new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8, color: 0x7a9a6a }), 0.03, 1.2, 'length(position) * 0.1');
  M.sheetTex = sheetTex();
  M.chain = new THREE.MeshStandardMaterial({ roughness: 0.85, side: THREE.DoubleSide });
  M.pom = new THREE.MeshStandardMaterial({ color: 0xa6231e, roughness: 0.45 });
  M.bulb = new THREE.MeshStandardMaterial({ color: 0xfff3dc, emissive: 0xffa84a, emissiveIntensity: 0.1, roughness: 0.2 });
  M.white = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.42 });
}

// place / replace the vehicle on the deck
function placeVehicle() {
  if (SUK.vehicleKind !== CFG.vehicle) {
    if (SUK.vehicle) BOAT.root.remove(SUK.vehicle);
    SUK.vehicle = CFG.vehicle === 'pickup' ? makePickup() : CFG.vehicle === 'sedan' ? makeSedan(0xe8e6e0) : new THREE.Group();
    if (CFG.vehicle === 'deck') SUK.vehicle.userData = { mount: new THREE.Vector3(0, 0.005, 0), foot: [4, 4], hooks: [[-1.6, 0.05, -1.6], [1.6, 0.05, -1.6], [-1.6, 0.05, 1.6], [1.6, 0.05, 1.6]], kind: 'deck' };
    BOAT.root.add(SUK.vehicle); SUK.vehicleKind = CFG.vehicle;
  }
  const z = CFG.overhead === 'upper' ? (CFG.vehicle === 'deck' ? 10.2 : 8.6) : 1.2;
  SUK.vehicle.position.set(0, BOAT.deckY, z);
  BOAT.awning.visible = CFG.overhead === 'awning';
}

const _inv = new THREE.Matrix4(), _mm = new THREE.Matrix4();
function buildSukkah() {
  placeVehicle();
  if (SUK.root) { SUK.root.parent.remove(SUK.root); SUK.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.userData && o.material.userData.amp) o.material.dispose(); }); }
  const R = new THREE.Group(); SUK.root = R; SUK.panels = []; SUK.lights = []; SUK.rects = []; SUK.triMeshes = [];
  rand = mulberry32(77);
  const mount = SUK.vehicle.userData.mount; R.position.copy(mount); SUK.vehicle.add(R);
  const W = CFG.w / 100, D = CFG.d / 100, H = CFG.h / 100;
  const post = CFG.supports === 'metal' ? M.alu : M.wood;
  const ps = 0.045;
  // --- frame
  const corners = [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]];
  for (const [x, z] of corners) addMesh(CFG.supports === 'metal' ? new THREE.CylinderGeometry(0.022, 0.022, H + 0.04, 10) : new THREE.BoxGeometry(ps, H + 0.04, ps), post, x, (H + 0.04) / 2, z, R);
  for (const z of [-D / 2, D / 2]) addMesh(new THREE.BoxGeometry(W + ps, 0.07, ps), post, 0, H - 0.035, z, R);
  for (const x of [-W / 2, W / 2]) addMesh(new THREE.BoxGeometry(ps, 0.07, D + ps), post, x, H - 0.035, 0, R);
  // schach supports (ma'amid) across the width
  const nSup = Math.max(2, Math.round(D / 0.45));
  for (let i = 0; i <= nSup; i++) {
    const z = -D / 2 + (i / nSup) * D;
    const m = CFG.supports === 'metal' ? addMesh(new THREE.CylinderGeometry(0.014, 0.014, W + 0.1, 8), M.alu, 0, H + 0.014, z, R) : addMesh(new THREE.BoxGeometry(W + 0.1, 0.03, 0.04), M.wood, 0, H + 0.015, z, R);
    if (CFG.supports === 'metal') m.rotation.z = Math.PI / 2;
  }
  // --- tie-down straps from the top corners to the vehicle's hooks
  if (CFG.strapped) {
    const hooks = SUK.vehicle.userData.hooks;
    corners.forEach(([x, z], i) => {
      const hk = hooks[i]; const a = new THREE.Vector3(x, H - 0.05, z), b = new THREE.Vector3(hk[0] - mount.x, hk[1] - mount.y, hk[2] - mount.z);
      if (CFG.vehicle === 'deck') b.set(x * 1.6, 0.02, z * 1.6);
      const len = a.distanceTo(b); const s = addMesh(new THREE.BoxGeometry(0.035, len, 0.004), M.strap, 0, 0, 0, R, false);
      s.position.copy(a).add(b).multiplyScalar(0.5); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      const rat = addMesh(new THREE.BoxGeometry(0.06, 0.1, 0.04), M.alu, 0, 0, 0, R); rat.position.copy(a).lerp(b, 0.7);
    });
  }
  // --- walls
  const y0 = CFG.wallGap / 100, wh = Math.max(0.05, Math.min(CFG.wallH / 100, H - y0));
  const tefach = tefachM();
  const sides = { front: [0, -D / 2, W, 0], back: [0, D / 2, W, Math.PI], left: [-W / 2, 0, D, Math.PI / 2], right: [W / 2, 0, D, -Math.PI / 2] };
  const list = CFG.walls === '4' ? ['front', 'left', 'right', 'back'] : CFG.walls === '3' ? ['front', 'left', 'right'] : ['front', 'left'];
  const addWall = (name, x, z, len, ry, off = 0) => {
    let mesh;
    if (CFG.wallType === 'wood') {
      mesh = addMesh(new THREE.BoxGeometry(len, wh, 0.018), M.ply, 0, 0, 0, R);
      mesh.position.set(x + Math.cos(ry) * off, y0 + wh / 2, z - Math.sin(ry) * off); mesh.rotation.y = ry;
    } else {
      const tex = CFG.wallType === 'sheet' ? M.sheetTex : TEX.panels[{ front: 0, left: 2, right: 1, back: 3 }[name] ?? 3];
      const g = new THREE.PlaneGeometry(len, wh, 30, 14); g.translate(0, -wh / 2, 0);
      const mat = makeWallMaterial(tex, CFG.wallType === 'sheet' ? len / 1.2 : len / 4, CFG.wallType);
      mesh = new THREE.Mesh(g, mat); mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
      mesh.position.set(x + Math.cos(ry) * off, y0 + wh, z - Math.sin(ry) * off); mesh.rotation.y = ry; R.add(mesh);
      SUK.panels.push(mesh);
    }
    return mesh;
  };
  for (const name of list) {
    const [x, z, len, ry] = sides[name];
    const inset = 0.03;
    const px = x + (name === 'left' ? -inset : name === 'right' ? inset : 0), pz = z + (name === 'front' ? -inset : name === 'back' ? inset : 0);
    if (name === 'back' && W > 1.0) {
      // doorway in the back wall
      const door = Math.min(0.65, W * 0.45), seg = (W - door) / 2;
      addWall(name, -W / 2 + seg / 2, pz, seg, ry); addWall(name, W / 2 - seg / 2, pz, seg, ry);
    } else addWall(name, px, pz, len, ry);
  }
  if (CFG.walls === '2t') {
    // a wall of just over a tefach on the third side, plus the tzurat hapetach (post + lintel) along it
    const tw = tefach * 1.05;
    addWall('right', W / 2 + 0.03, -D / 2 + tw / 2, tw, -Math.PI / 2);
  }
  // --- schach
  buildSchach(R, W, D, H);
  // --- decorations: string lights, paper chain, pomegranates
  if (CFG.decor && W >= 0.8 && D >= 0.8) buildDecor(R, W, D, H);
  // --- a small table and chairs, if there's room
  if (W >= 1.15 && D >= 1.4 && H >= 1.3) buildFurniture(R, W, D);
  shadowed(R);
  for (const p of SUK.panels) { p.castShadow = true; }
  measureShade(R, W, D);
  updateWallMotion(0, true);
  rebuildWalkColliders();
}

function tefachM() { return (CFG.shiur === 'naeh' ? 8 : 9.6) / 100; }

function buildSchach(R, W, D, H) {
  const S = new THREE.Group(); R.add(S);
  const y = H + 0.035;
  const amt = CFG.amount / 100;
  const avir = CFG.avir / 100;
  const inAvir = (z, half) => avir > 0 && Math.abs(z) - half < avir / 2;
  const rect = (x0, x1, z0, z1) => SUK.rects.push([x0, x1, z0, z1]);
  const T = CFG.schach;
  const spread = (spacing) => { const n = Math.max(0, Math.round((D / spacing) * amt)); const out = []; for (let i = 0; i < n; i++) out.push(-D / 2 + (i + 0.5) * D / n); return out; };
  if (T === 'palm' || T === 'branches') {
    const zs = spread(T === 'palm' ? 0.2 : 0.16);
    zs.forEach((z, i) => {
      if (inAvir(z, 0.12)) return;
      const len = W + 0.45;
      const geo = T === 'palm' ? makeFrondGeometry(len, 300 + i * 7, { dry: 0.15 + rand() * 0.2, droop: 0.02, spread: 1.0, leafW: 1.1, leafLen: 0.42 * Math.min(1.6, 1.8 / len + 0.4) })
        : makeFrondGeometry(len, 500 + i * 5, { dry: 0.0, droop: 0.05, spread: 0.75, leafW: 0.45, leafLen: 0.22 });
      if (T === 'branches') { const c = geo.attributes.color; for (let k = 0; k < c.count; k++) c.setXYZ(k, c.getX(k) * 0.55, c.getY(k) * 0.8, c.getZ(k) * 0.55); }
      fixNormals(geo);
      const m = new THREE.Mesh(geo, T === 'palm' ? frondMaterial() : M.pine);
      const h = new THREE.Group(); h.position.set(i & 1 ? W / 2 + 0.2 : -W / 2 - 0.2, y + (i % 3) * 0.018, z); h.rotation.y = (i & 1 ? Math.PI : 0) + (rand() - 0.5) * 0.1; h.add(m); S.add(h);
      SUK.triMeshes.push(m);
    });
  } else if (T === 'bamboo') {
    spread(0.034).forEach((z) => { if (inAvir(z, 0.016)) return; const m = addMesh(new THREE.CylinderGeometry(0.016, 0.017, W + 0.25, 8), rand() < 0.5 ? M.bamboo : M.bambooDark, 0, y + 0.017, z, S); m.rotation.z = Math.PI / 2; rect(-W / 2, W / 2, z - 0.016, z + 0.016); });
  } else if (T === 'mats') {
    // bamboo-slat mats made for schach: slats 1.2cm with ~0.4cm gaps
    const matW = 0.9; const nMats = Math.ceil((D * amt) / matW);
    const slats = [];
    for (let k = 0; k < nMats; k++) { const z0 = -D / 2 + k * matW; for (let z = z0; z < Math.min(D / 2, z0 + matW); z += 0.016) if (!inAvir(z, 0.006)) slats.push(z); }
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(W + 0.1, 0.006, 0.012), M.bamboo, Math.max(1, slats.length));
    slats.forEach((z, i) => { tmpM.makeTranslation(0, y + 0.004, z); im.setMatrixAt(i, tmpM); rect(-W / 2, W / 2, z - 0.006, z + 0.006); });
    im.count = slats.length; S.add(im);
    for (let k = 0; k < nMats; k++) for (const x of [-W / 3, 0, W / 3]) { const z0 = -D / 2 + k * matW; const t = addMesh(new THREE.BoxGeometry(0.004, 0.009, Math.min(matW, D / 2 - z0)), M.bambooDark, x, y + 0.008, z0 + Math.min(matW, D / 2 - z0) / 2, S); }
  } else if (T === 'boards' || T === 'wideboards') {
    const bw = T === 'boards' ? 0.08 : 0.4;
    spread(T === 'boards' ? 0.11 : 0.45).forEach((z) => { if (inAvir(z, bw / 2)) return; addMesh(new THREE.BoxGeometry(W + 0.2, 0.02, bw - 0.004), M.board, 0, y + 0.01, z, S); rect(-W / 2, W / 2, z - bw / 2, z + bw / 2); });
  } else if (T === 'tarp') {
    const cover = D * amt; const z0 = -D / 2, z1 = -D / 2 + cover;
    const g = new THREE.PlaneGeometry(W + 0.3, cover + 0.05, 20, 10); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, Math.sin(p.getX(i) * 7) * 0.01 + Math.cos(p.getZ(i) * 5) * 0.012);
    g.computeVertexNormals(); const t = addMesh(g, M.tarp, 0, y + 0.02, (z0 + z1) / 2, S); rect(-W / 2, W / 2, z0, z1);
  } else if (T === 'metal') {
    const cover = D * amt; const g = new THREE.PlaneGeometry(W + 0.2, cover, 60, 1); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, Math.sin(p.getX(i) * 50) * 0.012);
    g.computeVertexNormals(); addMesh(g, M.metal, 0, y + 0.015, -D / 2 + cover / 2, S); rect(-W / 2, W / 2, -D / 2, -D / 2 + cover);
  } else if (T === 'corn') {
    spread(0.075).forEach((z, i) => {
      if (inAvir(z, 0.03)) return;
      for (let x = -W / 2 + 0.12; x < W / 2; x += 0.24) { const c = addMesh(new THREE.CapsuleGeometry(0.025, 0.14, 4, 8), M.cob, x + (rand() - 0.5) * 0.05, y + 0.03, z + (rand() - 0.5) * 0.03, S); c.rotation.z = Math.PI / 2; c.rotation.y = (rand() - 0.5) * 0.4; }
      const leaf = addMesh(new THREE.PlaneGeometry(W + 0.2, 0.05), M.husk, 0, y + 0.012, z, S); leaf.rotation.x = -Math.PI / 2; rect(-W / 2, W / 2, z - 0.03, z + 0.03);
    });
  }
  SUK.schachGroup = S;
}

function buildDecor(R, W, D, H) {
  const h = H - 0.08;
  // string lights around the inside perimeter
  const pts = [];
  const c = [[-W / 2 + 0.05, -D / 2 + 0.05], [W / 2 - 0.05, -D / 2 + 0.05], [W / 2 - 0.05, D / 2 - 0.05], [-W / 2 + 0.05, D / 2 - 0.05]];
  for (let s = 0; s < 4; s++) { const a = c[s], b = c[(s + 1) % 4]; const len = Math.hypot(b[0] - a[0], b[1] - a[1]); const n = Math.max(2, Math.round(len / 0.22)); for (let i = 0; i < n; i++) { const t = i / n; pts.push(new THREE.Vector3(lerp(a[0], b[0], t), h - Math.sin(t * Math.PI) * 0.08, lerp(a[1], b[1], t))); } }
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.02, 8, 6), M.bulb, pts.length);
  pts.forEach((p, i) => { tmpM.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(i, tmpM); }); R.add(im); SUK.bulbs = im;
  const light = new THREE.PointLight(0xffb468, 0, 6, 1.6); light.position.set(0, h - 0.25, 0); light.visible = false; R.add(light); SUK.lights.push(light);
  // paper chain across the diagonal
  const a = new THREE.Vector3(-W / 2 + 0.06, h, -D / 2 + 0.06), b = new THREE.Vector3(W / 2 - 0.06, h, D / 2 - 0.06);
  const curve = new THREE.QuadraticBezierCurve3(a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, -0.25, 0)), b);
  const L = curve.getLength(), n = Math.floor(L / 0.045);
  const chain = new THREE.InstancedMesh(new THREE.TorusGeometry(0.025, 0.004, 4, 10), M.chain, n);
  const cols = [0xd9463a, 0xf0b52f, 0x3f8f4e, 0x2f67b2, 0xe07aa8];
  for (let i = 0; i < n; i++) { const p = curve.getPointAt(i / n), t = curve.getTangentAt(i / n); tmpQ.setFromUnitVectors(new THREE.Vector3(0, 1, 0), t); if (i & 1) tmpQ.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)); tmpM.compose(p, tmpQ, tmpS.set(1, 1.6, 1)); chain.setMatrixAt(i, tmpM); chain.setColorAt(i, tmpC.setHex(cols[i % cols.length])); }
  R.add(chain);
  // hanging pomegranates
  SUK.pendants = [];
  for (const [fx, fz] of [[-0.25, -0.2], [0.25, 0.25], [0.05, -0.35]]) {
    const piv = new THREE.Group(); piv.position.set(fx * W, H, fz * D); R.add(piv);
    const len = 0.25 + rand() * 0.2; addMesh(new THREE.CylinderGeometry(0.002, 0.002, len, 3), MAT_BLACK(), 0, -len / 2, 0, piv, false);
    addMesh(new THREE.SphereGeometry(0.045, 12, 10), M.pom, 0, -len - 0.04, 0, piv);
    SUK.pendants.push({ piv, ph: rand() * 6 });
  }
}
function buildFurniture(R, W, D) {
  const t = new THREE.Group(); t.position.set(0, 0, 0.05); R.add(t);
  const tw = Math.min(0.8, W - 0.45), td = Math.min(0.6, D - 0.9);
  addMesh(new THREE.BoxGeometry(tw, 0.03, td), M.white, 0, 0.7, 0, t);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) addMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 6), MAT_BLACK(), x * (tw / 2 - 0.05), 0.35, z * (td / 2 - 0.05), t);
  // white tablecloth, two candlesticks, kiddush cup, challah under a cover
  addMesh(new THREE.BoxGeometry(tw + 0.06, 0.005, td + 0.06), new THREE.MeshStandardMaterial({ color: 0xf7f5ef, roughness: 0.9 }), 0, 0.718, 0, t);
  const silver = new THREE.MeshStandardMaterial({ color: 0xe6e6e6, metalness: 1, roughness: 0.18 });
  for (const s of [-1, 1]) { addMesh(new THREE.CylinderGeometry(0.012, 0.03, 0.2, 12), silver, s * 0.08, 0.82, -td / 2 + 0.1, t); addMesh(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8), M.white, s * 0.08, 0.97, -td / 2 + 0.1, t); }
  addMesh(new THREE.CylinderGeometry(0.035, 0.015, 0.1, 16), silver, tw / 2 - 0.12, 0.77, 0.05, t);
  addMesh(new THREE.BoxGeometry(0.3, 0.08, 0.2), new THREE.MeshStandardMaterial({ color: 0x1f3552, roughness: 0.8 }), 0, 0.76, 0.04, t);
  // monobloc chairs on the long sides
  for (const s of [-1, 1]) {
    if (D < 1.6) continue;
    const c = new THREE.Group(); c.position.set(0, 0, s * (td / 2 + 0.28)); c.rotation.y = s > 0 ? 0 : Math.PI; R.add(c);
    addMesh(new THREE.BoxGeometry(0.42, 0.035, 0.4), M.white, 0, 0.44, 0, c);
    for (const [x, z] of [[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]]) addMesh(new THREE.BoxGeometry(0.04, 0.44, 0.05), M.white, x, 0.22, z, c);
    const bk = addMesh(new THREE.BoxGeometry(0.42, 0.42, 0.03), M.white, 0, 0.68, 0.2, c); bk.rotation.x = -0.18;
  }
}

// ---- measure the real shade and the widest air gap by rasterising the schach seen from below
function measureShade(R, W, D) {
  const GW = SUK.GW, GH = SUK.GH; const grid = SUK.grid = new Uint8Array(GW * GH);
  const cw = W / GW, ch = D / GH;
  R.updateWorldMatrix(true, true);
  _inv.copy(R.matrixWorld).invert();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (const m of SUK.triMeshes) {
    _mm.multiplyMatrices(_inv, m.matrixWorld);
    const pos = m.geometry.attributes.position, idx = m.geometry.index.array;
    for (let t = 0; t < idx.length; t += 3) {
      a.fromBufferAttribute(pos, idx[t]).applyMatrix4(_mm); b.fromBufferAttribute(pos, idx[t + 1]).applyMatrix4(_mm); c.fromBufferAttribute(pos, idx[t + 2]).applyMatrix4(_mm);
      const ax = (a.x + W / 2) / cw, az = (a.z + D / 2) / ch, bx = (b.x + W / 2) / cw, bz = (b.z + D / 2) / ch, cx = (c.x + W / 2) / cw, cz = (c.z + D / 2) / ch;
      const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx))), maxX = Math.min(GW - 1, Math.ceil(Math.max(ax, bx, cx)));
      const minZ = Math.max(0, Math.floor(Math.min(az, bz, cz))), maxZ = Math.min(GH - 1, Math.ceil(Math.max(az, bz, cz)));
      const area = (bx - ax) * (cz - az) - (cx - ax) * (bz - az); if (Math.abs(area) < 1e-6) continue;
      for (let z = minZ; z <= maxZ; z++) for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5, pz = z + 0.5;
        const w0 = ((bx - px) * (cz - pz) - (cx - px) * (bz - pz)) / area, w1 = ((cx - px) * (az - pz) - (ax - px) * (cz - pz)) / area, w2 = 1 - w0 - w1;
        if (w0 >= -0.04 && w1 >= -0.04 && w2 >= -0.04) grid[z * GW + x] = 1;
      }
    }
  }
  for (const [x0, x1, z0, z1] of SUK.rects) {
    const gx0 = Math.max(0, Math.floor((x0 + W / 2) / cw)), gx1 = Math.min(GW - 1, Math.ceil((x1 + W / 2) / cw) - 1);
    const gz0 = Math.max(0, Math.floor((z0 + D / 2) / ch + 0.5)), gz1 = Math.min(GH - 1, Math.ceil((z1 + D / 2) / ch - 0.5) - 1);
    for (let z = gz0; z <= gz1; z++) for (let x = gx0; x <= gx1; x++) grid[z * GW + x] = 1;
  }
  let s = 0; for (let i = 0; i < grid.length; i++) s += grid[i];
  SUK.shade = s / grid.length;
  // widest band of open air running all the way across (rows) or along (columns)
  let best = 0, run = 0;
  for (let z = 0; z < GH; z++) { let empty = true; for (let x = 0; x < GW; x++) if (grid[z * GW + x]) { empty = false; break; } run = empty ? run + 1 : 0; best = Math.max(best, run * ch); }
  run = 0; let bestC = 0;
  for (let x = 0; x < GW; x++) { let empty = true; for (let z = 0; z < GH; z++) if (grid[z * GW + x]) { empty = false; break; } run = empty ? run + 1 : 0; bestC = Math.max(bestC, run * cw); }
  SUK.avirRow = best * 100; SUK.avirCol = bestC * 100; SUK.avirMax = Math.max(SUK.avirRow, SUK.avirCol);
  // split the roof at every air gap of 3 tefachim or more; the largest remaining part may still be a sukkah
  const lim = tefachM() * 3; let seg = 0, bestSeg = 0, gap = 0;
  for (let z = 0; z < GH; z++) {
    let empty = true; for (let x = 0; x < GW; x++) if (grid[z * GW + x]) { empty = false; break; }
    if (empty) { gap += ch; if (gap >= lim) { bestSeg = Math.max(bestSeg, seg); seg = 0; } }
    else { if (gap < lim) seg += gap; gap = 0; seg += ch; }
  }
  SUK.bestSegment = Math.max(bestSeg, seg) * 100;
}

// wall motion follows the wind: loose canvas billows, tied canvas only trembles
function updateWallMotion(dt, force) {
  const wind = CFG.wind / 30 * (0.75 + 0.25 * Math.sin(U.time.value * 0.3));
  const loose = CFG.tied ? 0 : 1;
  for (const p of SUK.panels) {
    const a = (CFG.wallType === 'sheet' ? 1.3 : 1) * (loose ? 0.12 : 0.012) * (0.25 + wind);
    p.material.userData.amp.value = force ? a : damp(p.material.userData.amp.value, a, 2, dt);
    p.material.userData.tied.value = CFG.tied ? 1 : 0;
  }
}
