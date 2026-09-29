// ---------------------------------------------------------------- vehicles: double-cab pickup ("sukkah-mobile") and a sedan with a roof rack
function paintMat(color) { return new THREE.MeshPhysicalMaterial({ color, roughness: 0.32, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.08 }); }
const CARGLASS = new THREE.MeshStandardMaterial({ color: 0x10181e, roughness: 0.04, metalness: 0.9 });
const TYRE = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.85 });
const RIM = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.25, metalness: 0.95 });
const TRIM = new THREE.MeshStandardMaterial({ color: 0x1c1d1f, roughness: 0.55 });
const CHROME = new THREE.MeshStandardMaterial({ color: 0xe8ecef, roughness: 0.12, metalness: 1 });
function plateTex(txt) {
  return paintTex(256, 56, (g) => { g.fillStyle = '#f2c81b'; g.fillRect(0, 0, 256, 56); g.strokeStyle = '#111'; g.lineWidth = 4; g.strokeRect(2, 2, 252, 52); g.fillStyle = '#1b3fa0'; g.fillRect(4, 4, 30, 48); g.fillStyle = '#fff'; g.font = '700 13px Assistant'; g.fillText('IL', 10, 46); g.fillStyle = '#111'; g.font = '700 38px Assistant, sans-serif'; g.textAlign = 'center'; g.fillText(txt, 145, 43); });
}
function rbox(w, h, d, r, mat, x, y, z, parent) { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
function wheel(parent, x, y, z, r = 0.38) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const tyre = new THREE.Mesh(new THREE.TorusGeometry(r * 0.72, r * 0.3, 12, 28), TYRE); tyre.rotation.y = Math.PI / 2; tyre.scale.set(1, 1, 1.25); g.add(tyre);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.56, r * 0.56, 0.2, 20), RIM); rim.rotation.z = Math.PI / 2; g.add(rim);
  for (let k = 0; k < 6; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.03, r * 0.95, 0.06), RIM); sp.rotation.x = k * Math.PI / 6; sp.position.x = Math.sign(x) * 0.11; g.add(sp); }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.24, 12), CHROME); hub.rotation.z = Math.PI / 2; g.add(hub);
  shadowed(g); return g;
}
function lamps(parent, zFront, zBack, yF, yB, xs) {
  const head = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2d8, emissiveIntensity: 0.2, roughness: 0.1, metalness: 0.5 });
  const tail = new THREE.MeshStandardMaterial({ color: 0x8a0d0d, emissive: 0xff1a1a, emissiveIntensity: 0.3, roughness: 0.2 });
  for (const s of [-1, 1]) { addMesh(new THREE.BoxGeometry(0.34, 0.12, 0.06), head, s * xs, yF, zFront, parent, false); addMesh(new THREE.BoxGeometry(0.1, 0.3, 0.06), tail, s * (xs + 0.08), yB, zBack, parent, false); }
  return { head, tail };
}

function makePickup(color = 0xf2f2ef) {
  const G = new THREE.Group(); const paint = paintMat(color);
  // chassis + bumpers
  rbox(1.72, 0.25, 5.1, 0.06, TRIM, 0, 0.5, 0, G);
  rbox(1.86, 0.2, 0.2, 0.06, CHROME, 0, 0.55, -2.62, G); rbox(1.86, 0.18, 0.18, 0.05, CHROME, 0, 0.62, 2.62, G);
  // hood + front
  rbox(1.84, 0.55, 1.45, 0.12, paint, 0, 0.88, -1.95, G);
  rbox(1.2, 0.26, 0.05, 0.03, TRIM, 0, 0.9, -2.68, G); // grille
  // cab
  rbox(1.84, 0.62, 2.0, 0.12, paint, 0, 0.93, -0.3, G);
  rbox(1.72, 0.66, 1.75, 0.16, paint, 0, 1.52, -0.18, G);
  // glass: windshield (raked), side windows, rear window
  const ws = addMesh(new THREE.PlaneGeometry(1.52, 0.72), CARGLASS, 0, 1.5, -1.14, G, false); ws.rotation.x = -0.58;
  for (const s of [-1, 1]) { const sw = addMesh(new THREE.PlaneGeometry(1.5, 0.46), CARGLASS, s * 0.865, 1.55, -0.2, G, false); sw.rotation.y = s * Math.PI / 2; }
  addMesh(new THREE.PlaneGeometry(1.4, 0.4), CARGLASS, 0, 1.55, 0.7, G, false);
  // pillars
  for (const s of [-1, 1]) { addMesh(new THREE.BoxGeometry(0.06, 0.52, 0.08), paint, s * 0.83, 1.55, -0.2, G); }
  // mirrors, handles
  for (const s of [-1, 1]) { rbox(0.22, 0.14, 0.08, 0.03, TRIM, s * 1.0, 1.28, -0.98, G); addMesh(new THREE.BoxGeometry(0.02, 0.03, 0.14), TRIM, s * 0.925, 1.1, -0.55, G); addMesh(new THREE.BoxGeometry(0.02, 0.03, 0.14), TRIM, s * 0.925, 1.1, 0.25, G); addMesh(new THREE.BoxGeometry(0.005, 0.6, 0.01), TRIM, s * 0.923, 0.95, -0.1, G); }
  // bed: floor + sides + tailgate
  const BZ0 = 0.75, BZ1 = 2.6, BY = 0.82;
  rbox(1.84, 0.1, BZ1 - BZ0, 0.02, paint, 0, BY - 0.05, (BZ0 + BZ1) / 2, G);
  const bedLiner = new THREE.MeshStandardMaterial({ color: 0x232426, roughness: 0.9 });
  const liner = addMesh(new THREE.BoxGeometry(1.52, 0.02, BZ1 - BZ0 - 0.1), bedLiner, 0, BY + 0.01, (BZ0 + BZ1) / 2, G);
  for (const s of [-1, 1]) rbox(0.14, 0.5, BZ1 - BZ0, 0.04, paint, s * 0.85, BY + 0.24, (BZ0 + BZ1) / 2, G);
  rbox(1.84, 0.5, 0.1, 0.03, paint, 0, BY + 0.24, BZ0 + 0.05, G); rbox(1.84, 0.06, 0.5, 0.02, paint, 0, BY - 0.02, BZ1 + 0.22, G); // tailgate folded down
  for (const s of [-1, 1]) { const ch = addMesh(new THREE.CylinderGeometry(0.006, 0.006, 0.55, 4), CHROME, s * 0.86, BY + 0.2, BZ1 + 0.2, G); ch.rotation.x = 1.0; }
  // plastic step stool behind the truck
  const stool = new THREE.MeshStandardMaterial({ color: 0x2f77c8, roughness: 0.5 });
  rbox(0.5, 0.06, 0.36, 0.02, stool, 0, 0.39, BZ1 + 0.85, G);
  for (const [x, z] of [[-0.2, -0.13], [0.2, -0.13], [-0.2, 0.13], [0.2, 0.13]]) addMesh(new THREE.BoxGeometry(0.05, 0.37, 0.05), stool, x, 0.18, BZ1 + 0.85 + z, G);
  // wheel arches + wheels
  for (const s of [-1, 1]) for (const z of [-1.75, 1.6]) { const arch = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.06, 6, 16, Math.PI), TRIM); arch.position.set(s * 0.93, 0.62, z); arch.rotation.y = Math.PI / 2; G.add(arch); wheel(G, s * 0.8, 0.38, z); }
  lamps(G, -2.66, 2.63, 0.98, 1.0, 0.62);
  // plates
  const pm = new THREE.MeshStandardMaterial({ map: plateTex('71-532-80'), roughness: 0.4 });
  addMesh(new THREE.PlaneGeometry(0.52, 0.11), pm, 0, 0.62, 2.73, G, false);
  const fp = addMesh(new THREE.PlaneGeometry(0.52, 0.11), pm, 0, 0.55, -2.73, G, false); fp.rotation.y = Math.PI;
  // tie-down hooks in the bed corners
  for (const s of [-1, 1]) for (const z of [BZ0 + 0.15, BZ1 - 0.15]) addMesh(new THREE.TorusGeometry(0.03, 0.008, 6, 10), CHROME, s * 0.74, BY + 0.06, z, G);
  G.userData = { mount: new THREE.Vector3(0, BY + 0.02, (BZ0 + BZ1) / 2), foot: [1.52, 1.75], hooks: [[-0.74, BY + 0.06, BZ0 + 0.15], [0.74, BY + 0.06, BZ0 + 0.15], [-0.74, BY + 0.06, BZ1 - 0.15], [0.74, BY + 0.06, BZ1 - 0.15]], kind: 'pickup' };
  return G;
}

function makeSedan(color = 0xb9bec4) {
  const G = new THREE.Group(); const paint = paintMat(color);
  rbox(1.76, 0.5, 4.5, 0.18, paint, 0, 0.62, 0, G);
  rbox(1.6, 0.5, 2.2, 0.22, paint, 0, 1.1, 0.05, G);
  const ws = addMesh(new THREE.PlaneGeometry(1.4, 0.56), CARGLASS, 0, 1.12, -1.05, G, false); ws.rotation.x = -0.9;
  const rw = addMesh(new THREE.PlaneGeometry(1.36, 0.5), CARGLASS, 0, 1.1, 1.18, G, false); rw.rotation.x = Math.PI + 0.9;
  for (const s of [-1, 1]) { const sw = addMesh(new THREE.PlaneGeometry(1.9, 0.34), CARGLASS, s * 0.805, 1.14, 0.05, G, false); sw.rotation.y = s * Math.PI / 2; }
  for (const s of [-1, 1]) for (const z of [-1.4, 1.35]) wheel(G, s * 0.78, 0.33, z, 0.33);
  lamps(G, -2.24, 2.24, 0.72, 0.8, 0.6);
  const pm = new THREE.MeshStandardMaterial({ map: plateTex('38-117-64'), roughness: 0.4 });
  addMesh(new THREE.PlaneGeometry(0.52, 0.11), pm, 0, 0.55, 2.26, G, false);
  // roof rack rails + crossbars
  for (const s of [-1, 1]) addMesh(new THREE.BoxGeometry(0.04, 0.05, 1.7), TRIM, s * 0.66, 1.4, 0.05, G);
  for (const z of [-0.6, 0.7]) addMesh(new THREE.BoxGeometry(1.45, 0.04, 0.05), TRIM, 0, 1.43, z, G);
  for (const s of [-1, 1]) rbox(0.2, 0.12, 0.08, 0.03, TRIM, s * 0.95, 0.98, -0.85, G);
  G.userData = { mount: new THREE.Vector3(0, 1.455, 0.05), foot: [1.3, 1.5], hooks: [[-0.66, 1.4, -0.7], [0.66, 1.4, -0.7], [-0.66, 1.4, 0.8], [0.66, 1.4, 0.8]], kind: 'sedan' };
  shadowed(G);
  return G;
}
