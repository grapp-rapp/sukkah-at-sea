// ---------------------------------------------------------------- the boat: a small car ferry (bow = -z, heading north)
const BOAT = {
  root: new THREE.Group(), deckY: 2.1, len: 34, beam: 9.2,
  pitch: 0, roll: 0, heave: 0, navLights: [], deckLights: [], flag: null, awning: null, upper: null,
};
const HULL_W = (z) => { // half-beam along the hull
  const L = 17; if (z < -L) return 0;
  if (z < -9) { const t = (z + L) / 8; return BOAT.beam / 2 * Math.sin(t * Math.PI / 2) ** 0.8; }
  return BOAT.beam / 2 * (z > 15 ? 0.97 : 1);
};
function buildHull() {
  // lofted hull: sections along z, each from deck edge down to the keel
  const secs = 40, ring = [[1, 2.2], [1.0, 1.2], [0.97, 0.2], [0.85, -0.5], [0.55, -1.0], [0.0, -1.2]];
  const pos = [], col = [], idx = [];
  const white = new THREE.Color(0xf1f1ec), navy = new THREE.Color(0x1d3a5c), red = new THREE.Color(0x8e2a24), stripe = new THREE.Color(0xd8a13a);
  const cols = ring.length * 2 - 1; // mirrored
  for (let s = 0; s <= secs; s++) {
    const z = -17 + (s / secs) * 34;
    const hw = Math.max(0.02, HULL_W(z));
    const bowLift = z < -10 ? (z + 10) * -0.06 : 0; // sheer rises at the bow
    const pts = [];
    for (let i = 0; i < ring.length; i++) pts.push([ring[i][0] * hw, ring[i][1] + (i === 0 ? bowLift : 0)]);
    const full = [...pts.map(([x, y]) => [x, y]), ...pts.slice(0, -1).reverse().map(([x, y]) => [-x, y])];
    for (const [x, y] of full) {
      pos.push(x, y, z);
      const c = y > 1.05 ? white : y > 0.9 ? stripe : y > 0.05 ? navy : red;
      col.push(c.r, c.g, c.b);
    }
  }
  for (let s = 0; s < secs; s++) for (let i = 0; i < cols - 1; i++) {
    const a = s * cols + i, b = a + 1, c = a + cols, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  // stern transom
  const base = pos.length / 3; const zS = 17;
  for (let i = 0; i < cols; i++) { pos.push(pos[(secs * cols + i) * 3], pos[(secs * cols + i) * 3 + 1], zS); col.push(0.12, 0.23, 0.36); }
  pos.push(0, 1.0, zS); col.push(0.12, 0.23, 0.36);
  for (let i = 0; i < cols - 1; i++) idx.push(base + i, base + i + 1, base + cols);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.2, side: THREE.DoubleSide }));
  m.castShadow = true; m.receiveShadow = true; BOAT.root.add(m);
  // name on the bow
  const name = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.5), new THREE.MeshBasicMaterial({ transparent: true, map: paintTex(512, 80, (c) => { c.fillStyle = '#1d3a5c'; c.font = '700 54px "Frank Ruhl Libre", serif'; c.textAlign = 'center'; c.fillText('רבי עקיבא · RABBI AKIVA', 256, 58); }) }));
  for (const s of [-1, 1]) { const n = name.clone(); n.position.set(s * (HULL_W(-8) + 0.02), 1.65, -8); n.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; BOAT.root.add(n); }
}
function deckTexture() {
  return genPBR(512, 512, (u, v) => {
    // diamond anti-slip steel plate
    const X = u * 48, Y = v * 48; const cx = Math.floor(X), cy = Math.floor(Y); const fx = X - cx - 0.5, fy = Y - cy - 0.5;
    const dia = (cx + cy) & 1 ? Math.abs(fx * 0.4 + fy) : Math.abs(fx * 0.4 - fy);
    const bump = smooth(0.12, 0.03, dia) * smooth(0.45, 0.3, Math.abs(fx));
    const rust = smooth(0.35, 0.7, fbm(noiseA, u * 6, v * 6, 4)) * 0.25;
    const plate = (Math.abs(((u * 4) % 1) - 0.5) > 0.495 || Math.abs(((v * 2) % 1) - 0.5) > 0.497) ? -0.3 : 0;
    const c = 0.42 + bump * 0.08 + plate * 0.2;
    return { h: bump * 0.6 + plate, r: c + rust * 0.25, g: c + rust * 0.08, b: c * 1.03 - rust * 0.05, ro: 0.55 + rust * 0.4 - bump * 0.1 };
  }, 3.0);
}
function buildBoat() {
  scene.add(BOAT.root);
  buildHull();
  const D = BOAT.deckY;
  // deck
  const dset = deckTexture(); for (const k of ['map', 'normalMap', 'roughnessMap']) dset[k].repeat.set(2, 7);
  const deckMat = new THREE.MeshStandardMaterial({ ...dset, metalness: 0.25, color: 0x9ea79c });
  const shape = new THREE.Shape(); const hw0 = (z) => HULL_W(z) - 0.05;
  shape.moveTo(0, 16.6); for (let z = -16; z <= 17; z += 1) shape.lineTo(hw0(z), -z); for (let z = 17; z >= -16; z -= 1) shape.lineTo(-hw0(z), -z);
  { const h = new THREE.Path(); const x0 = STAIRWELL.x0 - 0.05, x1 = STAIRWELL.x1 + 0.05, z0 = STAIRWELL.z0, z1 = STAIRWELL.z1 + 0.15; h.moveTo(x0, -z0); h.lineTo(x1, -z0); h.lineTo(x1, -z1); h.lineTo(x0, -z1); h.lineTo(x0, -z0); shape.holes.push(h); }
  const dg = new THREE.ShapeGeometry(shape); dg.rotateX(-Math.PI / 2);
  const uv = dg.attributes.uv, dp = dg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, dp.getX(i) / 9.2, dp.getZ(i) / 34);
  const deck = new THREE.Mesh(dg, deckMat); deck.position.y = D; deck.receiveShadow = true; BOAT.root.add(deck);
  // yellow safety lines + parking bay lines
  const yl = new THREE.MeshStandardMaterial({ color: 0xe8b61c, roughness: 0.7 });
  for (const x of [-3.9, 3.9]) addMesh(new THREE.BoxGeometry(0.1, 0.005, 24), yl, x, D + 0.003, 3, BOAT.root, false);
  for (const z of [-3.6, 7.2]) addMesh(new THREE.BoxGeometry(3.2, 0.005, 0.1), yl, 0, D + 0.003, z, BOAT.root, false);
  // bulwark + railing
  const steel = new THREE.MeshStandardMaterial({ color: 0xe9ebe8, roughness: 0.5, metalness: 0.3 });
  const railM = new THREE.MeshStandardMaterial({ color: 0xd9dcd9, roughness: 0.35, metalness: 0.7 });
  for (const s of [-1, 1]) {
    for (let z = -12; z <= 16.5; z += 1.5) {
      addMesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 6), railM, s * (hw0(z) - 0.05), D + 0.5, z, BOAT.root);
    }
    for (const y of [0.5, 1.0]) {
      const pts = []; for (let z = -12; z <= 16.5; z += 0.5) pts.push(new THREE.Vector3(s * (hw0(z) - 0.05), D + y, z));
      BOAT.root.add(shadowed(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.022, 6), railM)));
    }
    // lifebuoys
    for (const z of [-4, 10]) { const lb = addMesh(new THREE.TorusGeometry(0.33, 0.08, 10, 24), new THREE.MeshStandardMaterial({ color: 0xf06a1e, roughness: 0.6 }), s * (hw0(z) - 0.12), D + 0.8, z, BOAT.root); lb.rotation.y = Math.PI / 2; }
  }
  // bow ramp (landing-craft style ferry) raised
  const ramp = new THREE.Group(); ramp.position.set(0, D, -12.5); ramp.rotation.x = -1.35; BOAT.root.add(ramp);
  addMesh(new THREE.BoxGeometry(6.4, 4.6, 0.18), steel, 0, 2.3, 0, ramp);
  for (let k = 0; k < 8; k++) addMesh(new THREE.BoxGeometry(6.2, 0.06, 0.1), steel, 0, 0.4 + k * 0.55, 0.12, ramp);
  // bollards
  for (const [x, z] of [[-3.8, -11], [3.8, -11], [-4, 15.5], [4, 15.5]]) addMesh(new THREE.CylinderGeometry(0.14, 0.16, 0.45, 12), MAT_BLACK(), x, D + 0.22, z, BOAT.root);
  // wheelhouse at the stern, with an upper deck overhang reaching forward
  const wh = new THREE.Group(); wh.position.set(0, D, 13); BOAT.root.add(wh);
  const glassM = new THREE.MeshStandardMaterial({ color: 0x0e1b24, roughness: 0.05, metalness: 0.9, emissive: 0xffd6a0, emissiveIntensity: 0 });
  BOAT.cabinGlass = glassM;
  buildCabin(wh, steel, railM);
  const upper = new THREE.Group(); wh.add(upper); BOAT.upper = upper;
  addMesh(new THREE.BoxGeometry(8.8, 0.22, 9.2), steel, 0, 2.72, -0.8, upper); // upper deck extends forward over the car bay
  for (const x of [-3.6, 3.6]) addMesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 10), steel, x, 1.3, -5.1, upper);
  // railings round the upper deck (open at the top of the stairs)
  const uRail = (pts) => upper.add(shadowed(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0), pts.length * 8, 0.025, 6), railM)));
  for (const y of [3.3, 3.85]) uRail([new THREE.Vector3(3.8, y, -5.4), new THREE.Vector3(-4.35, y, -5.4), new THREE.Vector3(-4.35, y, 3.75), new THREE.Vector3(4.35, y, 3.75), new THREE.Vector3(4.35, y, -4.9)]);
  for (const [x, z] of [[3.8, -5.4], [0, -5.4], [-4.35, -5.4], [-4.35, -1], [-4.35, 3.75], [4.35, 3.75], [4.35, -1], [4.35, -4.9]]) addMesh(new THREE.CylinderGeometry(0.025, 0.025, 1.05, 6), railM, x, 3.35, z, upper);
  // outside stairs up to the upper deck, starboard side
  const stairs = new THREE.Group(); wh.add(stairs);
  for (let i = 0; i < 14; i++) addMesh(new THREE.BoxGeometry(0.55, 0.05, 0.3), steel, 4.125, (i + 1) * 0.2 - 0.025, -9.1 + i * 0.264 + 0.13, stairs);
  for (const x of [3.86, 4.39]) { const st = addMesh(new THREE.BoxGeometry(0.03, 0.2, 4.4), steel, x, 1.4, -7.25, stairs); st.rotation.x = -Math.atan2(2.8, 3.7); }
  { const hr = addMesh(new THREE.CylinderGeometry(0.02, 0.02, 4.7, 6), railM, 4.42, 2.25, -7.25, stairs); hr.rotation.x = Math.PI / 2 - Math.atan2(2.8, 3.7); }
  addMesh(new THREE.BoxGeometry(4.6, 2.2, 3.2), steel, 0, 3.93, 1.8, upper); // bridge
  addMesh(new THREE.BoxGeometry(4.4, 0.8, 0.05), glassM, 0, 4.3, 0.18, upper, false);
  // mast + radar + masthead light
  addMesh(new THREE.CylinderGeometry(0.07, 0.09, 4, 8), steel, 0, 7, 2.3, upper);
  const radar = addMesh(new THREE.BoxGeometry(2.2, 0.12, 0.25), MAT_BLACK(), 0, 7.4, 2.3, upper); BOAT.radar = radar;
  // flagstaff at the stern: Israeli flag
  addMesh(new THREE.CylinderGeometry(0.03, 0.03, 3.4, 6), railM, 0, D + 1.7, 16.7, BOAT.root);
  const flagTex = paintTex(256, 180, (g) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 180); g.fillStyle = '#0038b8'; g.fillRect(0, 20, 256, 26); g.fillRect(0, 134, 256, 26);
    g.strokeStyle = '#0038b8'; g.lineWidth = 8; const cx = 128, cy = 90, r = 34;
    for (const o of [0, Math.PI]) { g.beginPath(); for (let i = 0; i < 3; i++) { const a = o - Math.PI / 2 + i * TAU / 3; g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.stroke(); }
  });
  const fg = new THREE.PlaneGeometry(1.4, 1.0, 16, 8); fg.translate(0.7, 0, 0);
  const flag = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.8 }));
  flag.position.set(0.03, D + 2.9, 16.7); flag.rotation.y = -Math.PI / 2; flag.castShadow = true; BOAT.root.add(flag); BOAT.flag = flag; BOAT.flagBase = fg.attributes.position.array.slice();
  // deck awning over the car bay (optional, toggled by CFG.overhead)
  const aw = new THREE.Group(); BOAT.root.add(aw); BOAT.awning = aw;
  const awM = new THREE.MeshStandardMaterial({ color: 0xe9e0c8, roughness: 0.9, side: THREE.DoubleSide });
  const ag = new THREE.PlaneGeometry(6.4, 8.4, 20, 20); ag.rotateX(-Math.PI / 2);
  const ap = ag.attributes.position; for (let i = 0; i < ap.count; i++) ap.setY(i, -Math.cos(ap.getX(i) / 6.4 * Math.PI) * 0.25 + 0.25);
  ag.computeVertexNormals();
  addMesh(ag, awM, 0, D + 4.2, 1.5, aw);
  for (const [x, z] of [[-3.2, -2.6], [3.2, -2.6], [-3.2, 5.6], [3.2, 5.6]]) addMesh(new THREE.CylinderGeometry(0.04, 0.04, 4.2, 8), railM, x, D + 2.1, z, aw);
  // navigation lights: port red, starboard green, masthead white, stern white
  const nav = (col, x, y, z, parent) => { const m = addMesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0 }), x, y, z, parent, false); BOAT.navLights.push(m.material); };
  nav(0xff2a1a, -2.35, 4.2, 0.2, upper); nav(0x1aff4a, 2.35, 4.2, 0.2, upper); nav(0xffffff, 0, 8.2, 2.3, upper); nav(0xffffff, 0, D + 3.5, 16.7, BOAT.root);
  // deck floodlight (one real light at night)
  const fl = new THREE.SpotLight(0xffe2b8, 0, 26, 0.7, 0.7, 1.3); fl.position.set(0, D + 4.9, 7.5); fl.target.position.set(0, D, 1.5); BOAT.root.add(fl, fl.target); BOAT.deckLights.push(fl);
  // a second car parked behind for scale
  const other = makeSedan(0x2f4f7a); other.position.set(0, D, -8.2); BOAT.root.add(other);
  shadowed(BOAT.root);
  deck.castShadow = false;
}
let _black;
function MAT_BLACK() { return _black || (_black = new THREE.MeshStandardMaterial({ color: 0x1b1d1f, roughness: 0.6, metalness: 0.3 })); }

// float the boat on the CPU sea
function updateBoat(dt, t) {
  const L = 13, W = 3.6;
  const hb = seaHeight(0, -L, t), hs = seaHeight(0, L, t), hp = seaHeight(-W, 0, t), hsb = seaHeight(W, 0, t), hc = seaHeight(0, 0, t);
  const heave = (hb + hs + hp + hsb + hc * 2) / 6 * 0.95;
  const pitch = Math.atan2(hb - hs, 2 * L) * 0.8;
  const roll = Math.atan2(hp - hsb, 2 * W) * 0.55 + CFG.wind / 60 * 0.03; // a little heel from the wind
  BOAT.heave = damp(BOAT.heave, heave, 3, dt); BOAT.pitch = damp(BOAT.pitch, pitch, 2.5, dt); BOAT.roll = damp(BOAT.roll, roll, 2.5, dt);
  BOAT.root.position.y = BOAT.heave - 0.1;
  BOAT.root.rotation.set(BOAT.pitch, 0, BOAT.roll);
  // flag flutter
  const f = BOAT.flag.geometry.attributes.position, b = BOAT.flagBase, w = 0.4 + CFG.wind / 30;
  for (let i = 0; i < f.count; i++) { const x = b[i * 3]; f.setZ(i, Math.sin(x * 6 - t * (4 + w * 3)) * 0.08 * x * Math.min(1.5, w)); }
  f.needsUpdate = true; BOAT.flag.geometry.computeVertexNormals();
  BOAT.radar.rotation.y = t * 2;
  const night = SKY.nightK;
  for (const m of BOAT.navLights) m.emissiveIntensity = 0.3 + night * 5;
  BOAT.cabinGlass.emissiveIntensity = night * 1.2; if (BOAT.cabinWindows) BOAT.cabinWindows.emissiveIntensity = night * 0.35;
  for (const l of BOAT.deckLights) { l.intensity = night * 22; l.visible = night > 0.05; }
  if (COAST.glass) COAST.glass.emissiveIntensity = night * 1.5;
}

// ---- the wheelhouse cabin you can walk into (local to the wheelhouse group at z = 13)
function buildCabin(wh, steel, railM) {
  const C = new THREE.Group(); wh.add(C); BOAT.cabin = C;
  const Z0 = -1.4, Z1 = 4.0, X = 3.7, H = 2.6, t = 0.08, WB0 = 1.05, WB1 = 1.95;
  const glass = new THREE.MeshStandardMaterial({ color: 0x9fc3d6, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false, emissive: 0xffd6a0, emissiveIntensity: 0 });
  BOAT.cabinWindows = glass;
  const inner = new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.8 });
  const wall = (w, h, d, x, y, z) => addMesh(new THREE.BoxGeometry(w, h, d), steel, x, y, z, C);
  // front wall with a doorway (x -0.5..0.5) and a window band
  for (const [a, b] of [[-X, -0.5], [0.5, X]]) { wall(b - a, WB0, t, (a + b) / 2, WB0 / 2, Z0); }
  wall(2 * X, H - WB1, t, 0, (WB1 + H) / 2, Z0);
  for (const x of [-X, -2.6, -1.5, -0.5, 0.5, 1.5, 2.6, X]) wall(0.08, WB1 - WB0, t, x, (WB0 + WB1) / 2, Z0);
  for (const [a, b] of [[-X, -2.6], [-2.6, -1.5], [-1.5, -0.5], [0.5, 1.5], [1.5, 2.6], [2.6, X]]) addMesh(new THREE.PlaneGeometry(b - a - 0.08, WB1 - WB0), glass, (a + b) / 2, (WB0 + WB1) / 2, Z0, C, false, false);
  // door leaf swung open against the outside of the front wall
  const doorM = new THREE.MeshStandardMaterial({ color: 0xdcdcd4, roughness: 0.5, metalness: 0.3 });
  addMesh(new THREE.BoxGeometry(0.95, 1.9, 0.05), doorM, -1.0, 0.97, Z0 - 0.07, C);
  addMesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16), glass, -1.0, 1.45, Z0 - 0.1, C, false).rotation.x = Math.PI / 2;
  // back wall and side walls with windows
  wall(2 * X, H, t, 0, H / 2, Z1);
  for (const s of [-1, 1]) {
    wall(t, WB0, Z1 - Z0, s * X, WB0 / 2, (Z0 + Z1) / 2); wall(t, H - WB1, Z1 - Z0, s * X, (WB1 + H) / 2, (Z0 + Z1) / 2);
    for (const z of [Z0, 0.4, 2.2, Z1]) wall(t, WB1 - WB0, 0.08, s * X, (WB0 + WB1) / 2, z);
    for (const [a, b] of [[Z0, 0.4], [0.4, 2.2], [2.2, Z1]]) { const g = addMesh(new THREE.PlaneGeometry(b - a - 0.08, WB1 - WB0), glass, s * X, (WB0 + WB1) / 2, (a + b) / 2, C, false, false); g.rotation.y = Math.PI / 2; }
  }
  // inner lining + wooden floor + ceiling light
  for (const s of [-1, 1]) addMesh(new THREE.PlaneGeometry(Z1 - Z0, WB0 - 0.02), inner, s * (X - 0.045), WB0 / 2, (Z0 + Z1) / 2, C, false).rotation.y = -s * Math.PI / 2;
  addMesh(new THREE.PlaneGeometry(2 * X - 0.1, H - 0.02), inner, 0, H / 2, Z1 - 0.045, C, false).rotation.y = Math.PI;
  const floorTex = TEX.wood.map.clone(); floorTex.needsUpdate = true; floorTex.repeat.set(10, 2); floorTex.rotation = Math.PI / 2;
  addMesh(new THREE.BoxGeometry(2 * X - 0.1, 0.04, Z1 - Z0 - 0.1), new THREE.MeshStandardMaterial({ map: floorTex, color: 0xc49a6c, roughness: 0.6 }), 0, 0.02, (Z0 + Z1) / 2, C);
  addMesh(new THREE.BoxGeometry(1.4, 0.03, 0.5), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff1d8, emissiveIntensity: 1.2 }), 0, H - 0.03, 1.3, C, false);
  // --- helm: console, screens, ship's wheel, throttles, captain's chair
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b3036, roughness: 0.5, metalness: 0.4 });
  addMesh(new THREE.BoxGeometry(2.6, 1.0, 0.5), dark, 2.1, 0.5, Z0 + 0.3, C);
  const scr = (draw, x) => { const m = addMesh(new THREE.PlaneGeometry(0.55, 0.38), new THREE.MeshStandardMaterial({ map: paintTex(256, 176, draw), emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0.9, roughness: 0.3 }), x, 1.08, Z0 + 0.22, C, false); m.material.emissiveMap = m.material.map; m.rotation.x = -0.7; };
  scr((g) => { g.fillStyle = '#021a0c'; g.fillRect(0, 0, 256, 176); g.strokeStyle = '#1fe07a'; g.lineWidth = 2; for (let r = 20; r < 90; r += 22) { g.beginPath(); g.arc(128, 88, r, 0, TAU); g.stroke(); } g.beginPath(); g.moveTo(128, 88); g.lineTo(200, 40); g.stroke(); g.fillStyle = '#6fff9e'; for (let i = 0; i < 9; i++) g.fillRect(40 + (i * 57) % 180, 30 + (i * 37) % 120, 4, 4); }, 1.35);
  scr((g) => { g.fillStyle = '#0b2a4a'; g.fillRect(0, 0, 256, 176); g.fillStyle = '#d9c28c'; g.beginPath(); g.moveTo(190, 0); g.lineTo(256, 0); g.lineTo(256, 176); g.lineTo(215, 176); g.bezierCurveTo(205, 120, 200, 60, 190, 0); g.fill(); g.fillStyle = '#fff'; g.font = '700 14px Assistant'; g.fillText('TEL AVIV–YAFO', 110, 90); g.fillStyle = '#ff4a3a'; g.beginPath(); g.arc(120, 120, 5, 0, TAU); g.fill(); g.fillStyle = '#9fd0ff'; g.font = '12px Assistant'; g.fillText('SOG 6.2 kn  HDG 000°', 12, 165); }, 2.0);
  scr((g) => { g.fillStyle = '#111'; g.fillRect(0, 0, 256, 176); g.fillStyle = '#ffb347'; g.font = '700 34px Assistant'; g.fillText('1,450 rpm', 30, 70); g.fillStyle = '#7fd08a'; g.font = '20px Assistant'; g.fillText('ENGINE OK   FUEL 72%', 22, 120); }, 2.65);
  const wheel = new THREE.Group(); wheel.position.set(2.0, 1.15, Z0 + 0.62); C.add(wheel); BOAT.helm = wheel;
  const woodM = new THREE.MeshStandardMaterial({ color: 0x7a4a24, roughness: 0.45 });
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 32), woodM));
  for (let k = 0; k < 8; k++) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.78, 6), woodM); sp.rotation.z = k * Math.PI / 8; wheel.add(sp); }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12), new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 1, roughness: 0.3 })); hub.rotation.x = Math.PI / 2; wheel.add(hub);
  addMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), dark, 2.0, 1.15, Z0 + 0.52, C).rotation.x = Math.PI / 2;
  for (const x of [3.0, 3.12]) { const lev = addMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 6), railM, x, 1.1, Z0 + 0.35, C); lev.rotation.x = -0.4; addMesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshStandardMaterial({ color: 0xc8231c }), x, 1.22, Z0 + 0.4, C); }
  const seatM = new THREE.MeshStandardMaterial({ color: 0x23324a, roughness: 0.7 });
  addMesh(new THREE.CylinderGeometry(0.05, 0.2, 0.5, 12), dark, 2.0, 0.25, 0.1 + 0.3, C);
  addMesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), seatM, 2.0, 0.55, 0.4, C);
  addMesh(new THREE.BoxGeometry(0.5, 0.6, 0.08), seatM, 2.0, 0.9, 0.66, C);
  // --- galley counter with a kettle, port side front
  addMesh(new THREE.BoxGeometry(2.0, 0.9, 0.5), new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.6 }), -2.6, 0.45, Z0 + 0.3, C);
  addMesh(new THREE.CylinderGeometry(0.08, 0.1, 0.2, 14), railM, -2.2, 1.0, Z0 + 0.3, C);
  // --- bench, table, life-jacket locker, fire extinguisher
  addMesh(new THREE.BoxGeometry(3.0, 0.4, 0.5), steel, -1.9, 0.2, Z1 - 0.3, C);
  addMesh(new THREE.BoxGeometry(3.0, 0.08, 0.5), new THREE.MeshStandardMaterial({ color: 0x2d5f8a, roughness: 0.9 }), -1.9, 0.44, Z1 - 0.3, C);
  addMesh(new THREE.BoxGeometry(1.0, 0.04, 0.55), woodM, -1.9, 0.75, Z1 - 1.05, C);
  addMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.73, 8), railM, -1.9, 0.37, Z1 - 1.05, C);
  const lock = addMesh(new THREE.BoxGeometry(0.6, 1.2, 0.5), new THREE.MeshStandardMaterial({ color: 0xf06a1e, roughness: 0.6 }), 3.3, 0.6, Z1 - 0.3, C);
  const lbl = addMesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshStandardMaterial({ map: paintTex(256, 128, (g) => { g.fillStyle = '#f06a1e'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#fff'; g.font = '700 30px Assistant'; g.textAlign = 'center'; g.fillText('חגורות הצלה', 128, 52); g.font = '700 24px Assistant'; g.fillText('LIFE JACKETS', 128, 96); }) }), 3.3, 0.9, Z1 - 0.56, C, false); lbl.rotation.y = Math.PI;
  addMesh(new THREE.CylinderGeometry(0.07, 0.07, 0.45, 12), new THREE.MeshStandardMaterial({ color: 0xc8231c, roughness: 0.4 }), -X + 0.15, 0.3, 0.3, C);
  // a picture of Jerusalem on the wall
  const pic = addMesh(new THREE.PlaneGeometry(0.9, 0.45), new THREE.MeshStandardMaterial({ map: TEX.panels[0], roughness: 0.6 }), -X + 0.06, 1.55, 2.0, C, false); pic.rotation.y = Math.PI / 2;
  shadowed(C); C.traverse((o) => { if (o.material === glass) { o.castShadow = false; o.receiveShadow = false; } });
}
