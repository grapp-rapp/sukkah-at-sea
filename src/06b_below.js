// ---------------------------------------------------------------- below deck: companionway, passenger lounge, bunk cabins, engine room
// boat-local coordinates; the main deck is at y = BOAT.deckY, the lower floor at BELOW.y
const BELOW = { root: null, y: 0.12, fy: 0.12 - 2.1, x: 4.0, z0: -9.0, z1: 15.8, engines: [], lights: [] };
const STAIRWELL = { x0: -3.85, x1: -2.8, z0: -6.2, z1: -3.4, n: 10 };
const inStairwell = (x, z) => x > STAIRWELL.x0 && x < STAIRWELL.x1 && z > STAIRWELL.z0 && z < STAIRWELL.z1;

function buildBelowDeck() {
  const D = BOAT.deckY, Y = BELOW.y, CEIL = D - 0.1, H = CEIL - Y; // headroom ~1.88 m (feet on the deck above poke a little into the plate)
  const G = new THREE.Group(); BOAT.root.add(G); BELOW.root = G;
  const X = BELOW.x, Z0 = BELOW.z0, Z1 = BELOW.z1;
  const paint = new THREE.MeshStandardMaterial({ color: 0xe9e6de, roughness: 0.7 });
  const floorTex = TEX.wood.map.clone(); floorTex.needsUpdate = true; floorTex.repeat.set(3, 12);
  const floorM = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, map: floorTex, roughness: 0.7 });
  const steelFloor = new THREE.MeshStandardMaterial({ color: 0x6d7478, roughness: 0.6, metalness: 0.5 });
  const add = (geo, mat, x, y, z, parent = G) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.receiveShadow = true; parent.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, parent) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
  // floor (wood in the lounge + cabins, steel in the engine room)
  box(2 * X, 0.06, 9.5 - Z0, floorM, 0, Y - 0.03, (Z0 + 9.5) / 2);
  box(2 * X, 0.06, Z1 - 9.5, steelFloor, 0, Y - 0.03, (9.5 + Z1) / 2);
  // ceiling under the deck, with the stairwell hole; it casts the deck's shadow down here
  const cs = new THREE.Shape(); cs.moveTo(-X, Z0); cs.lineTo(X, Z0); cs.lineTo(X, Z1); cs.lineTo(-X, Z1); cs.lineTo(-X, Z0);
  const hole = new THREE.Path(); hole.moveTo(STAIRWELL.x0 - 0.05, STAIRWELL.z0); hole.lineTo(STAIRWELL.x0 - 0.05, STAIRWELL.z1 + 0.15); hole.lineTo(STAIRWELL.x1 + 0.05, STAIRWELL.z1 + 0.15); hole.lineTo(STAIRWELL.x1 + 0.05, STAIRWELL.z0); cs.holes.push(hole);
  const cg = new THREE.ShapeGeometry(cs); cg.rotateX(Math.PI / 2);
  const ceil = add(cg, new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.8, shadowSide: THREE.DoubleSide }), 0, CEIL, 0);
  ceil.castShadow = true;
  // hull lining, front and back bulkheads
  for (const s of [-1, 1]) { const w = add(new THREE.PlaneGeometry(Z1 - Z0, H), paint, s * X, Y + H / 2, (Z0 + Z1) / 2); w.rotation.y = -s * Math.PI / 2; }
  add(new THREE.PlaneGeometry(2 * X, H), paint, 0, Y + H / 2, Z0);
  const bk = add(new THREE.PlaneGeometry(2 * X, H), paint, 0, Y + H / 2, Z1); bk.rotation.y = Math.PI;
  // portholes: bright sea-and-sky discs on the lining, dark glass on the hull outside
  const portIn = new THREE.MeshBasicMaterial({ map: paintTex(64, 64, (g) => { const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#d9ecf7'); gr.addColorStop(0.55, '#a8cde4'); gr.addColorStop(0.56, '#2d6f93'); gr.addColorStop(1, '#174a6a'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }) });
  const rimM = new THREE.MeshStandardMaterial({ color: 0xb8a060, metalness: 1, roughness: 0.3 });
  const portOut = new THREE.MeshStandardMaterial({ color: 0x0c1a24, roughness: 0.05, metalness: 0.8 });
  for (let z = Z0 + 1.2; z < Z1 - 0.5; z += 2.2) for (const s of [-1, 1]) {
    const p = add(new THREE.CircleGeometry(0.17, 20), portIn, s * (X - 0.01), 1.5, z); p.rotation.y = -s * Math.PI / 2;
    const r = add(new THREE.TorusGeometry(0.18, 0.025, 6, 20), rimM, s * (X - 0.02), 1.5, z); r.rotation.y = Math.PI / 2;
    const o = new THREE.Mesh(new THREE.CircleGeometry(0.17, 20), portOut); o.position.set(s * (HULL_W(z) + 0.01), 1.5, z); o.rotation.y = s * Math.PI / 2; BOAT.root.add(o);
  }
  // ceiling lights
  const lamp = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff0d6, emissiveIntensity: 1.4 });
  for (let z = Z0 + 1.5; z < Z1; z += 3) for (const x of [-2, 2]) box(0.9, 0.03, 0.25, lamp, x, CEIL - 0.02, z);
  // --- companionway housing on the main deck + the stairs down
  const house = new THREE.Group(); BOAT.root.add(house); BELOW.house = house;
  const hy = D, hh = 2.1;
  const white = new THREE.MeshStandardMaterial({ color: 0xeceee9, roughness: 0.5, metalness: 0.2 });
  box(0.08, hh, 3.0, white, -3.91, hy + hh / 2, -4.7, house); box(0.08, hh, 3.0, white, -2.74, hy + hh / 2, -4.7, house);
  box(1.25, hh, 0.08, white, -3.33, hy + hh / 2, -6.2, house);
  box(1.25, 0.08, 3.1, white, -3.33, hy + hh + 0.04, -4.7, house);
  box(0.15, hh, 0.08, white, -3.84, hy + hh / 2, -3.2, house); box(0.12, hh, 0.08, white, -2.8, hy + hh / 2, -3.2, house);
  box(1.25, 0.15, 0.08, white, -3.33, hy + hh - 0.075, -3.2, house);
  const sign = add(new THREE.PlaneGeometry(0.9, 0.22), new THREE.MeshStandardMaterial({ map: paintTex(256, 64, (g) => { g.fillStyle = '#1d3a5c'; g.fillRect(0, 0, 256, 64); g.fillStyle = '#fff'; g.font = '700 26px Assistant'; g.textAlign = 'center'; g.fillText('▼ טרקלין · LOUNGE', 128, 42); }) }), -3.33, hy + hh - 0.25, -3.14, house);
  const stepM = new THREE.MeshStandardMaterial({ color: 0x8b9398, roughness: 0.5, metalness: 0.6 });
  const n = STAIRWELL.n, run = (STAIRWELL.z1 - STAIRWELL.z0) / n, rise = (D - Y) / n;
  for (let i = 0; i < n; i++) box(STAIRWELL.x1 - STAIRWELL.x0, 0.05, run + 0.02, stepM, (STAIRWELL.x0 + STAIRWELL.x1) / 2, D - (i + 1) * rise - 0.025, STAIRWELL.z1 - (i + 0.5) * run, G);
  const railM = new THREE.MeshStandardMaterial({ color: 0xd9dcd9, roughness: 0.3, metalness: 0.8 });
  { const hr = add(new THREE.CylinderGeometry(0.02, 0.02, Math.hypot(D - Y, STAIRWELL.z1 - STAIRWELL.z0), 6), railM, STAIRWELL.x1 + 0.02, (D + Y) / 2 + 0.9, (STAIRWELL.z0 + STAIRWELL.z1) / 2); hr.rotation.x = Math.atan2(STAIRWELL.z1 - STAIRWELL.z0, D - Y); }

  // --- passenger lounge: snack bar, tables with benches, a quiet corner with siddurim
  const counterM = new THREE.MeshStandardMaterial({ color: 0x2d5f8a, roughness: 0.5 });
  box(3.0, 1.0, 0.6, counterM, 0, Y + 0.5, Z0 + 0.65);
  box(3.0, 0.05, 0.7, new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.4 }), 0, Y + 1.02, Z0 + 0.65);
  const fridge = box(0.8, 1.8, 0.5, new THREE.MeshStandardMaterial({ color: 0xdfe6ea, roughness: 0.2, metalness: 0.4, emissive: 0xaad8ff, emissiveIntensity: 0.25 }), -1.9, Y + 0.9, Z0 + 0.3);
  const kiosk = add(new THREE.PlaneGeometry(2.4, 0.45), new THREE.MeshBasicMaterial({ map: paintTex(512, 96, (g) => { g.fillStyle = '#b3261e'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#fff'; g.font = '800 44px Assistant'; g.textAlign = 'center'; g.fillText('קפטריה · CAFETERIA', 256, 64); }) }), 0, Y + 1.7, Z0 + 0.02);
  for (let i = 0; i < 6; i++) box(0.07, 0.2, 0.07, new THREE.MeshStandardMaterial({ color: [0xd8352a, 0x2a8ad8, 0xf0b52f][i % 3], roughness: 0.3 }), -1.1 + i * 0.25, Y + 1.15, Z0 + 0.55); // drinks on the counter
  const tableM = new THREE.MeshStandardMaterial({ color: 0xc9b08a, roughness: 0.5 });
  const benchM = new THREE.MeshStandardMaterial({ color: 0x3b4f73, roughness: 0.8 });
  BELOW.tables = [[2.6, -5.0], [2.6, -1.5], [-1.2, -5.2]];
  for (const [x, z] of BELOW.tables) {
    box(1.0, 0.04, 0.8, tableM, x, Y + 0.75, z); box(0.08, 0.73, 0.08, railM, x, Y + 0.37, z);
    for (const s of [-1, 1]) box(1.0, 0.45, 0.4, benchM, x, Y + 0.225, z + s * 0.72);
  }
  // shesh-besh (backgammon) board on the middle table
  const board = paintTex(256, 128, (g) => { g.fillStyle = '#6b3f1f'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#e8d3a6'; g.fillRect(8, 8, 116, 112); g.fillRect(132, 8, 116, 112); for (let i = 0; i < 12; i++) { const x = (i < 6 ? 8 : 132) + (i % 6) * 19.3; g.fillStyle = i & 1 ? '#8a1f1a' : '#1d3a5c'; g.beginPath(); g.moveTo(x, 8); g.lineTo(x + 9.6, 60); g.lineTo(x + 19.3, 8); g.fill(); g.beginPath(); g.moveTo(x, 120); g.lineTo(x + 9.6, 68); g.lineTo(x + 19.3, 120); g.fill(); } });
  const bd = add(new THREE.BoxGeometry(0.5, 0.03, 0.3), new THREE.MeshStandardMaterial({ map: board, roughness: 0.6 }), 2.6, Y + 0.785, -1.5);
  for (let i = 0; i < 14; i++) { const c = add(new THREE.CylinderGeometry(0.014, 0.014, 0.008, 12), new THREE.MeshStandardMaterial({ color: i & 1 ? 0xf5f1e6 : 0x1a1a1a, roughness: 0.4 }), 2.4 + (i % 7) * 0.05, Y + 0.806, -1.6 + (i < 7 ? 0 : 0.2)); }
  // quiet corner: bookshelf of siddurim + a shtender
  box(0.3, 1.4, 1.1, new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.7 }), -X + 0.18, Y + 0.7, 0.9);
  for (let i = 0; i < 16; i++) box(0.18, 0.2, 0.04, new THREE.MeshStandardMaterial({ color: [0x1d3a5c, 0x6b1f1c, 0x2f4a2a][i % 3], roughness: 0.8 }), -X + 0.2, Y + 0.45 + Math.floor(i / 8) * 0.45, 0.45 + (i % 8) * 0.12);
  const sh = box(0.45, 0.06, 0.4, new THREE.MeshStandardMaterial({ color: 0x6b4526, roughness: 0.6 }), -2.55, Y + 1.1, 0.2); sh.rotation.z = 0.35;
  box(0.06, 1.05, 0.3, sh.material, -2.5, Y + 0.53, 0.2);
  const sid = box(0.14, 0.02, 0.2, new THREE.MeshStandardMaterial({ color: 0x1d3a5c }), -2.58, Y + 1.15, 0.2); sid.rotation.z = 0.35;

  // --- cabins: a corridor with bunk rooms either side
  const wallM = new THREE.MeshStandardMaterial({ color: 0xdcd6c8, roughness: 0.8 });
  const CZ0 = 3.5, CZ1 = 9.5, doorZ0 = 5.9, doorZ1 = 6.7;
  for (const s of [-1, 1]) {
    box(X - 0.6, H, 0.06, wallM, s * (0.6 + (X - 0.6) / 2), Y + H / 2, CZ0);
    box(0.06, H, doorZ0 - CZ0, wallM, s * 0.6, Y + H / 2, (CZ0 + doorZ0) / 2);
    box(0.06, H, CZ1 - doorZ1, wallM, s * 0.6, Y + H / 2, (doorZ1 + CZ1) / 2);
    box(0.06, H - 1.95, doorZ1 - doorZ0, wallM, s * 0.6, Y + 1.95 + (H - 1.95) / 2, (doorZ0 + doorZ1) / 2);
    // bunk beds against the hull
    for (const bz of [4.6, 8.2]) {
      for (const by of [0.35, 1.25]) {
        box(0.85, 0.12, 1.95, new THREE.MeshStandardMaterial({ color: 0x3f6fa8, roughness: 0.9 }), s * (X - 0.5), Y + by, bz);
        box(0.5, 0.1, 0.3, new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 1 }), s * (X - 0.5), Y + by + 0.1, bz - 0.75);
      }
      for (const dz of [-0.98, 0.98]) box(0.05, 1.55, 0.05, railM, s * (X - 0.95), Y + 0.78, bz + dz);
      box(0.04, 0.04, 1.95, railM, s * (X - 0.95), Y + 1.55, bz);
    }
  }
  // --- engine room behind a bulkhead
  box(X - 0.5, H, 0.08, paint, -(0.5 + (X - 0.5) / 2), Y + H / 2, 9.5); box(X - 0.5, H, 0.08, paint, 0.5 + (X - 0.5) / 2, Y + H / 2, 9.5);
  box(1.0, H - 1.95, 0.08, paint, 0, Y + 1.95 + (H - 1.95) / 2, 9.5);
  const engM = new THREE.MeshStandardMaterial({ color: 0x3f7a55, roughness: 0.45, metalness: 0.5 });
  const darkM = new THREE.MeshStandardMaterial({ color: 0x2a2d30, roughness: 0.5, metalness: 0.6 });
  const redM = new THREE.MeshStandardMaterial({ color: 0xb8231c, roughness: 0.4, metalness: 0.4 });
  for (const s of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(s * 1.75, Y, 12.6); G.add(e); BELOW.engines.push(e);
    box(1.1, 0.3, 3.2, darkM, 0, 0.15, 0, e);
    box(1.0, 0.8, 2.8, engM, 0, 0.7, 0, e);
    for (let k = 0; k < 6; k++) box(0.34, 0.26, 0.34, engM, 0, 1.22, -1.1 + k * 0.44, e);
    const ex = add(new THREE.CylinderGeometry(0.1, 0.1, H - 1.2, 12), darkM, s * -0.35, 1.2 + (H - 1.2) / 2, 1.2, e);
    const fw = add(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 24), redM, 0, 0.55, -1.5, e); fw.rotation.x = Math.PI / 2;
    add(new THREE.BoxGeometry(0.6, 0.3, 0.02), new THREE.MeshStandardMaterial({ map: paintTex(128, 64, (g) => { g.fillStyle = '#ddd'; g.fillRect(0, 0, 128, 64); g.fillStyle = '#111'; g.font = '700 22px Assistant'; g.textAlign = 'center'; g.fillText('DIESEL 800 HP', 64, 40); }) }), 0, 0.75, 1.41, e);
  }
  // pipes along the engine room ceiling + control panel with gauges
  const pipeM = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 0.9 });
  for (const [x, c] of [[-1.6, pipeM], [-1.85, redM], [1.75, engM], [-3.2, pipeM]]) { const p = add(new THREE.CylinderGeometry(0.05, 0.05, Z1 - 9.6, 10), c, x, CEIL - 0.08, (9.6 + Z1) / 2); p.rotation.x = Math.PI / 2; }
  box(2.2, 1.3, 0.25, darkM, 0, Y + 1.0, Z1 - 0.2);
  const gaugeM = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, emissive: 0xfff2d0, emissiveIntensity: 0.5 });
  for (let i = 0; i < 5; i++) { const g = add(new THREE.CircleGeometry(0.1, 20), gaugeM, -0.8 + i * 0.4, Y + 1.3, Z1 - 0.34); g.rotation.y = Math.PI; }
  for (let i = 0; i < 8; i++) { const l = add(new THREE.CircleGeometry(0.025, 10), new THREE.MeshStandardMaterial({ color: 0x1aff4a, emissive: i === 5 ? 0xff3a1a : 0x1aff4a, emissiveIntensity: 1.5 }), -0.7 + i * 0.2, Y + 0.9, Z1 - 0.34); l.rotation.y = Math.PI; }
  add(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12), redM, X - 0.2, Y + 0.3, 10.2); // extinguisher
  G.traverse((o) => { if (o.isMesh && o !== ceil) o.castShadow = false; });
}

// walkable layout below deck (y relative to the main deck, like the rest of WALK)
function belowDeckColliders(box) {
  const fy = BELOW.fy, top = 0;
  const X = BELOW.x;
  // companionway housing walls on the main deck (door on its +z side)
  box(-3.95, -3.87, -6.2, -3.2, 0, 2.1); box(-2.78, -2.7, -6.2, -3.2, 0, 2.1); box(-3.95, -2.7, -6.25, -6.15, 0, 2.1);
  box(-3.95, -3.8, -3.25, -3.15, 0, 2.1); box(-2.85, -2.7, -3.25, -3.15, 0, 2.1);
  // the stairs: one box per step, each only as long as its own tread
  const n = STAIRWELL.n, run = (STAIRWELL.z1 - STAIRWELL.z0) / n, rise = -fy / n;
  for (let i = 0; i < n; i++) box(STAIRWELL.x0, STAIRWELL.x1, STAIRWELL.z1 - (i + 1) * run, STAIRWELL.z1 - i * run, fy, -(i + 1) * rise, 'stairs');
  // lounge
  box(-1.5, 1.5, BELOW.z0, BELOW.z0 + 0.95, fy, fy + 1.05); box(-2.3, -1.5, BELOW.z0, BELOW.z0 + 0.55, fy, fy + 1.8);
  for (const [x, z] of BELOW.tables) { box(x - 0.5, x + 0.5, z - 0.4, z + 0.4, fy, fy + 0.77); for (const s of [-1, 1]) box(x - 0.5, x + 0.5, z + s * 0.72 - 0.2, z + s * 0.72 + 0.2, fy, fy + 0.45); }
  box(-X, -X + 0.33, 0.35, 1.45, fy, fy + 1.4); box(-2.8, -2.4, 0.0, 0.4, fy, fy + 1.15);
  // cabins
  for (const s of [-1, 1]) {
    const a = s * 0.6, b = s * X;
    box(Math.min(a, b), Math.max(a, b), 3.47, 3.53, fy, top);
    box(s * 0.57, s * 0.63, 3.5, 5.9, fy, top); box(s * 0.57, s * 0.63, 6.7, 9.5, fy, top);
    for (const bz of [4.6, 8.2]) box(s * (X - 0.93), s * (X - 0.05), bz - 1.0, bz + 1.0, fy, fy + 1.6);
  }
  // engine room bulkhead (door in the middle) + engines + panel
  box(-X, -0.5, 9.46, 9.54, fy, top); box(0.5, X, 9.46, 9.54, fy, top);
  for (const s of [-1, 1]) box(s * 1.75 - 0.6, s * 1.75 + 0.6, 11.0, 14.2, fy, fy + 1.4);
  box(-1.1, 1.1, BELOW.z1 - 0.35, BELOW.z1, fy, fy + 1.65);
}
function whereBelow(p) {
  if (p.z > 9.5) return tt('Engine room', 'חדר המכונות');
  if (p.z > 3.5) return tt('Cabins, below deck', 'תאי שינה, מתחת לסיפון');
  return tt('Passenger lounge, below deck', 'טרקלין הנוסעים, מתחת לסיפון');
}
