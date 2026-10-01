// ---------------------------------------------------------------- walking on the ship: collision boxes in boat space (y measured from the deck)
const JOY = { x: 0, y: 0, id: null };
const WALK = { pos: new THREE.Vector3(-2.2, 0, -2.5), vy: 0, onGround: true, boxes: [], bob: 0 };
const STEP = 0.43, RADIUS = 0.28, EYE = 1.64;

function box(x0, x1, z0, z1, y0, y1, tag) { WALK.boxes.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), y0, y1, tag }); }
function rebuildWalkColliders() {
  WALK.boxes = [];
  for (const b of BOAT.obstacles) box(...b);
  // wheelhouse cabin (world z 11.6 .. 17.0), doorway at x -0.5..0.5
  box(-3.7, -0.5, 11.55, 11.65, 0, 2.6); box(0.5, 3.7, 11.55, 11.65, 0, 2.6);
  box(-3.7, 3.7, 16.95, 17.05, 0, 2.6); box(-3.75, -3.65, 11.6, 17, 0, 2.6); box(3.65, 3.75, 11.6, 17, 0, 2.6);
  box(-0.5, 0.5, 11.55, 11.65, 1.95, 2.6); // lintel over the door
  box(0.8, 3.4, 11.65, 12.15, 0, 1.0, 'helm'); box(1.75, 2.25, 13.15, 13.7, 0, 1.2); // console, chair
  box(-3.6, -1.6, 11.65, 12.15, 0, 0.9); // galley
  box(-3.4, -0.4, 16.45, 16.95, 0, 0.48); box(-2.4, -1.4, 15.67, 16.23, 0, 0.77); // bench, table
  box(3.0, 3.6, 16.45, 16.95, 0, 1.2); // life jackets
  // upper deck floor + rails + bridge + pillars
  box(-4.4, 4.4, 7.6, 16.8, 2.72, 2.83, 'upper');
  box(-4.4, 3.75, 7.55, 7.65, 2.83, 3.95); box(4.3, 4.45, 8.5, 16.8, 2.83, 3.95); box(-4.45, -4.3, 7.6, 16.8, 2.83, 3.95); box(-4.4, 4.4, 16.72, 16.85, 2.83, 3.95);
  box(-2.3, 2.3, 13.2, 16.4, 2.83, 5.1);
  box(-3.7, -3.5, 7.8, 8.0, 0, 2.72); box(3.5, 3.7, 7.8, 8.0, 0, 2.72);
  // stairs up the starboard side (world z 3.9 .. 7.6)
  for (let i = 0; i < 14; i++) box(3.85, 4.4, 3.9 + i * 0.264, 7.62, 0, (i + 1) * 0.2, 'stairs');
  belowDeckColliders(box);
  // people who stand still
  for (const P of CREW) { if (P.route || P.loop || P.id === 'guest') continue; const below = P.root.parent === BELOW.root; const y0 = below ? BELOW.fy : P.root.position.y - BOAT.deckY; const x = P.root.position.x, z = P.root.position.z; box(x - 0.22, x + 0.22, z - 0.22, z + 0.22, y0, y0 + 1.7); }
  // bollards, the other car
  for (const [x, z] of [[-3.8, -11], [3.8, -11], [-4, 15.5], [4, 15.5]]) box(x - 0.16, x + 0.16, z - 0.16, z + 0.16, 0, 0.45);
  box(-0.9, 0.9, -10.5, -5.95, 0, 1.5);
  if (BOAT.awning.visible) for (const [x, z] of [[-3.2, -1.4], [3.2, -1.4], [-3.2, 6.8], [3.2, 6.8]]) box(x - 0.05, x + 0.05, z - 0.05, z + 0.05, 0, 4.2);
  // the vehicle
  const vz = SUK.vehicle.position.z, m = SUK.vehicle.userData.mount;
  if (CFG.vehicle === 'pickup') {
    box(-0.93, 0.93, vz - 2.75, vz + 0.75, 0, 1.86, 'car');
    box(-0.92, 0.92, vz + 0.75, vz + 2.6, 0, 0.84, 'bed');
    box(0.78, 0.93, vz + 0.75, vz + 2.6, 0.84, 1.32); box(-0.93, -0.78, vz + 0.75, vz + 2.6, 0.84, 1.32);
    box(-0.92, 0.92, vz + 2.6, vz + 3.07, 0.5, 0.84, 'bed');
    box(-0.25, 0.25, vz + 3.27, vz + 3.63, 0, 0.42, 'stool');
  } else if (CFG.vehicle === 'sedan') box(-0.9, 0.9, vz - 2.28, vz + 2.28, 0, 1.46, 'car');
  // the sukkah's walls and posts (it rides on the vehicle)
  const fy = CFG.vehicle === 'deck' ? 0 : m.y, cx = m.x, cz = vz + m.z;
  const W = CFG.w / 100, D = CFG.d / 100, H = CFG.h / 100;
  const y0 = fy + CFG.wallGap / 100, y1 = fy + Math.min(H, CFG.wallGap / 100 + CFG.wallH / 100);
  const T = 0.05;
  for (const [x, z] of [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]]) box(cx + x - 0.04, cx + x + 0.04, cz + z - 0.04, cz + z + 0.04, fy, fy + H);
  const list = CFG.walls === '4' ? ['front', 'left', 'right', 'back'] : CFG.walls === '3' ? ['front', 'left', 'right'] : ['front', 'left'];
  for (const n of list) {
    if (n === 'front') box(cx - W / 2, cx + W / 2, cz - D / 2 - T, cz - D / 2 + T, y0, y1);
    if (n === 'left') box(cx - W / 2 - T, cx - W / 2 + T, cz - D / 2, cz + D / 2, y0, y1);
    if (n === 'right') box(cx + W / 2 - T, cx + W / 2 + T, cz - D / 2, cz + D / 2, y0, y1);
    if (n === 'back') { const door = W > 1 ? Math.min(0.65, W * 0.45) : 0; box(cx - W / 2, cx - door / 2, cz + D / 2 - T, cz + D / 2 + T, y0, y1); box(cx + door / 2, cx + W / 2, cz + D / 2 - T, cz + D / 2 + T, y0, y1); }
  }
  if (CFG.walls === '2t') box(cx + W / 2 - T, cx + W / 2 + T, cz - D / 2, cz - D / 2 + tefachM() * 1.05, y0, y1);
  // the table inside, if there is one
  if (W >= 1.15 && D >= 1.4 && H >= 1.3) { const tw = Math.min(0.8, W - 0.45), td = Math.min(0.6, D - 0.9); box(cx - tw / 2, cx + tw / 2, cz + 0.05 - td / 2, cz + 0.05 + td / 2, fy, fy + 0.74); }
  WALK.sukkah = { x0: cx - W / 2, x1: cx + W / 2, z0: cz - D / 2, z1: cz + D / 2, fy, top: fy + H };
}

function blocked(x, z, feet) {
  for (const b of WALK.boxes) {
    if (b.y1 <= feet + STEP || b.y0 >= feet + 1.75) continue;
    if (x + RADIUS > b.x0 && x - RADIUS < b.x1 && z + RADIUS > b.z0 && z - RADIUS < b.z1) return true;
  }
  // stay aboard: the hull railings on the main deck, the bow ramp, the stern
  if (feet < -1) { if (Math.abs(x) > BELOW.x - 0.3 || z < BELOW.z0 + 0.3 || z > BELOW.z1 - 0.3) return true; }
  else if (feet < 2) {
    if (z < -21.9 || z > BOAT.stern - 0.5) return true;
    if (Math.abs(x) > HULL_W(z) - 0.42) return true;
  }
  return false;
}
function groundUnder(x, z, feet) {
  let g = inStairwell(x, z) || feet < -1 ? BELOW.fy : 0;
  for (const b of WALK.boxes) {
    if (b.y1 > feet + STEP) continue;
    if (x + RADIUS * 0.5 > b.x0 && x - RADIUS * 0.5 < b.x1 && z + RADIUS * 0.5 > b.z0 && z - RADIUS * 0.5 < b.z1) g = Math.max(g, b.y1);
  }
  return g;
}
function updateWalk(dt) {
  const p = WALK.pos;
  // keyboard plus the on-screen joystick (analog)
  const f = (KEYS.KeyW || KEYS.ArrowUp ? 1 : 0) - (KEYS.KeyS || KEYS.ArrowDown ? 1 : 0) - JOY.y, s = (KEYS.KeyD || KEYS.ArrowRight ? 1 : 0) - (KEYS.KeyA || KEYS.ArrowLeft ? 1 : 0) + JOY.x;
  const push = Math.min(1, Math.hypot(f, s));
  const sp = (KEYS.ShiftLeft || KEYS.ShiftRight || Math.hypot(JOY.x, JOY.y) > 0.92 ? 3.8 : 1.9) * push;
  let dx = (-Math.sin(LOOK.yaw) * f + Math.cos(LOOK.yaw) * s), dz = (-Math.cos(LOOK.yaw) * f - Math.sin(LOOK.yaw) * s);
  const l = Math.hypot(dx, dz); if (l > 0) { dx = dx / l * sp * dt; dz = dz / l * sp * dt; }
  // the deck tilts: you slide a touch downhill as the ship rolls
  dx += -BOAT.roll * 0.35 * dt; dz += BOAT.pitch * 0.35 * dt;
  if (!blocked(p.x + dx, p.z, p.y)) p.x += dx;
  if (!blocked(p.x, p.z + dz, p.y)) p.z += dz;
  if (KEYS.Space && WALK.onGround) { WALK.vy = 4.3; WALK.onGround = false; }
  const feet0 = p.y;
  WALK.vy -= 9.8 * dt; p.y += WALK.vy * dt;
  const g = groundUnder(p.x, p.z, Math.max(p.y, feet0));
  if (p.y <= g) { p.y = WALK.onGround ? damp(p.y, g, 18, dt) : g; if (p.y < g) p.y = g; WALK.vy = 0; WALK.onGround = true; }
  else if (p.y > g + 0.05) WALK.onGround = false;
  if (WALK.onGround && g > p.y) p.y = g;
  WALK.bob += dt * (l > 0 && WALK.onGround ? sp * 2.4 : 0);
  // where am I?
  const S = WALK.sukkah; let where;
  if (p.y < -1) where = whereBelow(p);
  else if (S && p.x > S.x0 && p.x < S.x1 && p.z > S.z0 && p.z < S.z1 && Math.abs(p.y - S.fy) < 0.3) where = tt('In the sukkah', 'בתוך הסוכה');
  else if (p.z > 11.65 && p.z < 16.95 && Math.abs(p.x) < 3.65 && p.y < 1.5) where = tt('In the wheelhouse cabin', 'בתא ההגה');
  else if (p.y > 2.6) where = tt('On the upper deck', 'על הסיפון העליון');
  else if (p.y > 0.3 && CFG.vehicle === 'pickup' && p.z > SUK.vehicle.position.z + 0.6) where = tt('On the truck bed', 'בארגז הטנדר');
  else where = tt('On deck', 'על הסיפון');
  $('where').textContent = where + (MOBILE ? '' : tt(' · Space to jump', ' · רווח לקפיצה'));
}
function walkCameraLocal(out) { return out.set(WALK.pos.x, BOAT.deckY + WALK.pos.y + EYE + Math.abs(Math.sin(WALK.bob)) * 0.03, WALK.pos.z); }
