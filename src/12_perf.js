// ---------------------------------------------------------------- performance: merge static parts, and freeze far-away people into one mesh
// merge the static meshes under `root` by material, baked into root's space
function mergeUnder(root, skip) {
  const dyn = new Set();
  for (const r of skip) if (r) r.traverse((c) => dyn.add(c));
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map();
  const visibleTo = (o) => { for (let p = o; p && p !== root; p = p.parent) if (!p.visible) return false; return true; };
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || dyn.has(o) || Array.isArray(o.material) || !visibleTo(o)) return;
    const m = o.material;
    if (o.customDepthMaterial || m.isShaderMaterial || m.transparent || m.userData.amp || o.frustumCulled === false) return;
    const key = m.uuid + '|' + o.castShadow + '|' + o.receiveShadow;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  });
  let removed = 0;
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const mat = list[0].material, geos = [];
    for (const o of list) {
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(n)) g.deleteAttribute(n);
      if (!mat.vertexColors && g.attributes.color) g.deleteAttribute('color');
      if (!g.attributes.normal) g.computeVertexNormals();
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      g.morphAttributes = {};
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      geos.push(fixNormals(g));
    }
    let merged; try { merged = mergeGeometries(geos); } catch (e) { merged = null; }
    if (!merged) continue;
    const mm = new THREE.Mesh(merged, mat); mm.castShadow = list[0].castShadow; mm.receiveShadow = list[0].receiveShadow;
    root.add(mm);
    for (const o of list) { o.parent.remove(o); removed++; }
  }
  return removed;
}

// a person far from the camera becomes one vertex-coloured mesh in their current pose
const FROZEN_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 });
const _fc = new THREE.Color();
function freezePerson(P) {
  P.root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(P.root.matrixWorld).invert();
  const geos = [];
  P.joints.hips.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone());
    for (const n of Object.keys(g.attributes)) if (!['position', 'normal'].includes(n)) g.deleteAttribute(n);
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    const m = o.material; _fc.copy(m.color || _fc.set(0xffffff));
    if (m.map && _fc.getHex() === 0xffffff) _fc.set(0x2a3550); // textured bits (a knitted kippah) → a plain dark tone
    const n = g.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = _fc.r; col[i * 3 + 1] = _fc.g; col[i * 3 + 2] = _fc.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geos.push(fixNormals(g));
  });
  const merged = mergeGeometries(geos);
  const f = new THREE.Mesh(merged, FROZEN_MAT); f.castShadow = !MOBILE; f.receiveShadow = true;
  P.root.add(f); P.frozen = f; f.visible = false;
}
// switch each (non-walking) person between the animated rig (close) and the frozen copy (far)
const _pw = new THREE.Vector3();
function updatePeopleLOD(t) {
  for (const P of CREW) {
    if (P.route || P.loop) continue;
    if (!P.frozen) { if (t > 2.5) freezePerson(P); continue; }
    P.root.getWorldPosition(_pw);
    const far = _pw.distanceTo(camera.position) > 7.5;
    P.far = far; P.frozen.visible = far; P.joints.hips.visible = !far;
  }
}
// merge the ship, the lower deck and the truck once everything is built
function optimizeScene() {
  const skip = [...CREW.map((p) => p.root), SUK.vehicle, BELOW.root, BOAT.flag, BOAT.radar, BOAT.awning, ...BELOW.engines];
  const a = mergeUnder(BOAT.root, skip);
  const b = mergeUnder(BELOW.root, [...BELOW.engines, ...CREW.map((p) => p.root)]);
  console.log('merged static meshes', a, b);
}
// the truck (not its sukkah) and the sukkah's static parts, after every rebuild
function optimizeSukkah() {
  if (!SUK.vehicle.userData.merged) { mergeUnder(SUK.vehicle, [SUK.root]); SUK.vehicle.userData.merged = true; }
  mergeUnder(SUK.root, [...SUK.panels, ...(SUK.pendants || []).map((p) => p.piv), ...SUK.lights, SUK.guest && SUK.guest.root]);
}
