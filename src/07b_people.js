// ---------------------------------------------------------------- people (procedural, jointed) — ported from the courtyard RPG
const NPCS = {};
const NPC_LIST = [];

let _fineWeave;
function fabricMat(color, rough = 0.85) {
  if (!_fineWeave) { _fineWeave = TEX.weave.normalMap.clone(); _fineWeave.needsUpdate = true; _fineWeave.repeat.set(10, 10); }
  return new THREE.MeshStandardMaterial({ color, roughness: rough, normalMap: _fineWeave, normalScale: new THREE.Vector2(0.15, 0.15) });
}
function limb(r, len, mat, parent, y = 0) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len - 2 * r), 6, 12), mat);
  m.position.y = -len / 2 + y; m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function joint(parent, x, y, z) { const j = new THREE.Group(); j.position.set(x, y, z); parent.add(j); return j; }

function makePerson(o) {
  const H = o.height || 1.75, k = H / 1.75;
  const skin = new THREE.MeshStandardMaterial({ color: o.skin || 0xd9a47e, roughness: 0.55 });
  const shirt = fabricMat(o.shirt || 0xffffff);
  const pants = fabricMat(o.pants || 0x22262e);
  const shoe = new THREE.MeshStandardMaterial({ color: o.shoes || 0x1d1712, roughness: 0.45 });
  const hairM = new THREE.MeshStandardMaterial({ color: o.hair || 0x2a1d14, roughness: 0.75 });
  const root = new THREE.Group();
  const P = { root, H, joints: {}, o };
  const J = P.joints;
  const legLen = 0.47 * H;
  J.hips = joint(root, 0, legLen, 0);
  // pelvis
  const pel = new THREE.Mesh(new THREE.SphereGeometry(0.16 * k, 16, 12), o.skirt ? fabricMat(o.skirt) : pants); pel.scale.set(1, 0.62, 0.72) ; pel.castShadow = true; J.hips.add(pel);
  // torso
  J.spine = joint(J.hips, 0, 0.05 * k, 0);
  const torsoH = 0.3 * H * (o.torsoMul || 1);
  const belly = o.belly || 0;
  const tp = [[0.0, 0], [0.15, 0], [0.16 + belly * 0.05, 0.08], [0.165 + belly * 0.07, 0.2], [0.17 + belly * 0.02, 0.36], [0.18, 0.44], [0.16, 0.5], [0.08, 0.53], [0.06, 0.54]].map(([x, y]) => new THREE.Vector2(x * k, y * k * (torsoH / (0.3 * 1.75)) * 0.98));
  const torso = new THREE.Mesh(new THREE.LatheGeometry(tp, 20), o.top ? fabricMat(o.top) : shirt); torso.scale.z = 0.66 + belly * 0.15; torso.castShadow = true; torso.receiveShadow = true; J.spine.add(torso);
  const tTop = tp[tp.length - 1].y;
  // neck + head
  J.neck = joint(J.spine, 0, tTop - 0.01 * k, 0.005);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045 * k, 0.055 * k, 0.09 * k, 12), skin); neck.position.y = 0.035 * k; neck.castShadow = true; J.neck.add(neck);
  J.head = joint(J.neck, 0, 0.035 * k, 0.015 * k);
  buildHead(P, J.head, k, skin, hairM);
  // arms
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R';
    const sh = joint(J.spine, s * 0.19 * k, tTop - 0.07 * k, 0);
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.047 * k, 12, 10), o.top ? fabricMat(o.top) : shirt); shoulder.castShadow = true; sh.add(shoulder);
    const upper = sh; limb(0.047 * k, 0.29 * k, o.sleeve === 'short' ? skin : (o.top ? fabricMat(o.top) : shirt), upper);
    if (o.sleeve === 'short') { const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.056 * k, 0.052 * k, 0.12 * k, 12), o.top ? fabricMat(o.top) : shirt); sl.position.y = -0.05 * k; sl.castShadow = true; sh.add(sl); }
    const el = joint(sh, 0, -0.29 * k, 0);
    limb(0.04 * k, 0.26 * k, o.sleeve === 'short' || o.sleeve === 'rolled' ? skin : (o.top ? fabricMat(o.top) : shirt), el);
    if (o.sleeve === 'rolled') { const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.048 * k, 0.048 * k, 0.05 * k, 12), shirt); cuff.position.y = -0.02 * k; el.add(cuff); }
    const wr = joint(el, 0, -0.26 * k, 0);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.042 * k, 10, 8), skin); hand.scale.set(0.75, 1.25, 0.5); hand.position.y = -0.045 * k; hand.castShadow = true; wr.add(hand);
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.012 * k, 0.03 * k, 3, 6), skin); thumb.position.set(-s * 0.02 * k, -0.03 * k, 0.02 * k); thumb.rotation.z = s * 0.5; wr.add(thumb);
    J['shoulder' + side] = sh; J['elbow' + side] = el; J['wrist' + side] = wr;
    sh.rotation.z = s * 0.08;
  }
  // legs
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R';
    const hip = joint(J.hips, s * 0.09 * k, -0.02 * k, 0);
    limb(0.07 * k, 0.245 * H, pants, hip);
    const kn = joint(hip, 0, -0.245 * H, 0);
    limb(0.055 * k, 0.23 * H, o.skirt ? skin : pants, kn);
    const an = joint(kn, 0, -0.23 * H, 0);
    const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.045 * k, 0.14 * k, 4, 8), shoe); foot.rotation.x = Math.PI / 2; foot.scale.set(1, 1, 0.75); foot.position.set(0, -0.025 * k, 0.05 * k); foot.castShadow = true; an.add(foot);
    J['hip' + side] = hip; J['knee' + side] = kn; J['ankle' + side] = an;
  }
  // long skirt over legs
  if (o.skirt) {
    const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.17 * k, 0.29 * k, o.skirtLen || 0.72 * k, 20, 4, true), new THREE.MeshStandardMaterial({ color: o.skirt, roughness: 0.9, side: THREE.DoubleSide }));
    const sp = sk.geometry.attributes.position; for (let i = 0; i < sp.count; i++) { const a = Math.atan2(sp.getZ(i), sp.getX(i)); const f = (0.5 - sp.getY(i) / (o.skirtLen || 0.72 * k)); const r = 1 + Math.sin(a * 9) * 0.035 * f; sp.setX(i, sp.getX(i) * r); sp.setZ(i, sp.getZ(i) * r * 0.9); }
    sk.geometry.computeVertexNormals();
    sk.position.y = -(o.skirtLen || 0.72 * k) / 2 + 0.05; sk.castShadow = true; J.hips.add(sk); P.skirt = sk;
  }
  // tzitzit strings hanging at the hips
  if (o.tzitzit) {
    const tm = new THREE.MeshStandardMaterial({ color: 0xf6f4ee, roughness: 0.9 });
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.3 * k, 3), tm); t.position.set(s * (0.15 + i * 0.006) * k, -0.12 * k, (i - 1.5) * 0.01); t.rotation.z = s * 0.05; J.hips.add(t); }
  }
  if (o.epaulettes) for (const s of [-1, 1]) { const ep = new THREE.Mesh(new THREE.BoxGeometry(0.1 * k, 0.012, 0.06 * k), new THREE.MeshStandardMaterial({ color: 0x1b2a44 })); ep.position.set(s * 0.15 * k, tTop - 0.035 * k, 0); J.spine.add(ep); for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1 * k, 0.004, 0.008), new THREE.MeshStandardMaterial({ color: 0xe0b44a, metalness: 1, roughness: 0.3 })); b.position.set(s * 0.15 * k, tTop - 0.028 * k, -0.02 + i * 0.015); J.spine.add(b); } }
  if (o.vest) { const v = new THREE.Mesh(new THREE.LatheGeometry(tp.slice(1, 7).map((p) => new THREE.Vector2(p.x * 1.05, p.y)), 20), new THREE.MeshStandardMaterial({ color: o.vest, roughness: 0.6, emissive: o.vest, emissiveIntensity: 0.12 })); v.scale.z = 0.72; J.spine.add(v); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.172 * k, 0.172 * k, 0.03 * k, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xdfe6ea, metalness: 0.6, roughness: 0.2, side: THREE.DoubleSide })); st.scale.z = 0.72; st.position.y = tp[3].y; J.spine.add(st); }
  if (o.apron) { const ap = new THREE.Mesh(new THREE.PlaneGeometry(0.34 * k, 0.55 * k), new THREE.MeshStandardMaterial({ color: o.apron, roughness: 0.9, side: THREE.DoubleSide })); ap.position.set(0, 0.05 * k, 0.13 * k + belly * 0.03); J.spine.add(ap); }
  P.state = 'idle'; P.walkT = 0; P.blink = 2 + rand() * 3; P.look = 0; P.lookP = 0; P.gesture = 0; P.sitK = 0; P.pose = null;
  P.speed = o.speed || 1.25; P.path = []; P.onArrive = null;
  P.pos = root.position; P.heading = 0;
  return P;
}

// sculpted head: a sphere pushed into a skull + jaw + chin, with brow, cheekbones, eye sockets and nose bridge
const gauss = (dx, dy, s) => Math.exp(-(dx * dx + dy * dy) / (s * s));
function makeHeadGeo(hs, o = {}) {
  const g = new THREE.SphereGeometry(1, MOBILE ? 32 : 44, MOBILE ? 24 : 32);
  const p = g.attributes.position;
  const jawW = o.jawW || 1, chin = o.chin || 1;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const front = Math.max(0, z);
    // skull proportions
    x *= 0.8; y *= 1.02; z *= 0.95;
    if (z < 0) z *= 1.08; // occiput
    // jaw narrows towards the chin
    if (y < 0.05) { const t = Math.min(1, (0.05 - y) / 1.0); x *= 1 - 0.36 * Math.pow(t, 1.4) * jawW; z *= 1 - 0.12 * t; if (front > 0.2) z += 0.07 * chin * smooth(0.45, 0.95, -y) * front; }
    // flatter sides of the head
    x *= 1 - 0.06 * Math.pow(Math.abs(p.getX(i)), 3);
    // brow ridge, cheekbones, nose bridge, eye sockets, under-lip dip
    if (front > 0.3) {
      z += 0.035 * gauss(x, y - 0.22, 0.28) * front;
      z += 0.05 * gauss(Math.abs(x) - 0.38, y + 0.12, 0.16) * front;
      z += 0.07 * gauss(x * 2.2, y + 0.05, 0.22) * front;
      z -= 0.055 * gauss(Math.abs(x) - 0.27, y - 0.06, 0.12) * front;
      z -= 0.025 * gauss(x * 1.6, y + 0.52, 0.18) * front;
    }
    p.setXYZ(i, x * hs, y * hs, z * hs);
  }
  g.computeVertexNormals();
  return g;
}
// copy the triangles of a head geometry whose centroid passes keep(x,y,z) (normalised), pushed out along the normal
function shellOf(geo, hs, scale, keep) {
  const src = geo.index ? geo.toNonIndexed() : geo;
  const P = src.attributes.position, N = src.attributes.normal;
  const pos = [], nor = [];
  for (let t = 0; t < P.count; t += 3) {
    const cx = (P.getX(t) + P.getX(t + 1) + P.getX(t + 2)) / 3 / hs, cy = (P.getY(t) + P.getY(t + 1) + P.getY(t + 2)) / 3 / hs, cz = (P.getZ(t) + P.getZ(t + 1) + P.getZ(t + 2)) / 3 / hs;
    if (!keep(cx, cy, cz)) continue;
    for (let k = 0; k < 3; k++) {
      const nx = N.getX(t + k), ny = N.getY(t + k), nz = N.getZ(t + k);
      const s = typeof scale === 'function' ? scale(P.getX(t + k) / hs, P.getY(t + k) / hs, P.getZ(t + k) / hs) : scale;
      pos.push(P.getX(t + k) + nx * s * hs, P.getY(t + k) + ny * s * hs, P.getZ(t + k) + nz * s * hs); nor.push(nx, ny, nz);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}

function buildHead(P, headJ, k, skin, hairM) {
  const o = P.o;
  const hs = 0.112 * k * (o.headMul || 1);
  const head = joint(headJ, 0, hs * 0.9, 0);
  const geo = makeHeadGeo(hs, { jawW: o.female ? 1.15 : 1, chin: o.female ? 0.7 : 1 });
  const skull = new THREE.Mesh(geo, skin); skull.castShadow = true; skull.receiveShadow = true; head.add(skull);
  // approx face surface z at normalised x,y
  const fz = (x, y) => Math.sqrt(Math.max(0, 1 - x * x - y * y)) * 0.95 * hs;
  // eyes: small, set into the sockets, with lids
  const white = new THREE.MeshStandardMaterial({ color: 0xeee8e0, roughness: 0.25 });
  const iris = new THREE.MeshStandardMaterial({ color: o.eyes || 0x3b2a1c, roughness: 0.2 });
  const pupil = new THREE.MeshStandardMaterial({ color: 0x080606, roughness: 0.1 });
  const lidM = new THREE.MeshStandardMaterial({ color: new THREE.Color(o.skin || 0xd9a47e).multiplyScalar(0.9), roughness: 0.6 });
  P.eyes = [];
  for (const s of [-1, 1]) {
    const ex = s * 0.28, ey = 0.06;
    const e = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.1, 16, 12), white); e.position.set(ex * hs, ey * hs, fz(ex / 0.8, ey) - hs * 0.09); e.scale.set(1, 0.85, 1); head.add(e);
    const ir = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.052, 14, 10), iris); ir.position.set(0, 0, hs * 0.07); ir.scale.z = 0.5; e.add(ir);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.024, 10, 8), pupil); pu.position.set(0, 0, hs * 0.094); pu.scale.z = 0.4; e.add(pu);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.108, 16, 8, 0, TAU, 0, Math.PI * 0.3), lidM); lid.position.copy(e.position); lid.rotation.x = -0.1; head.add(lid);
    const low = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.105, 16, 6, 0, TAU, Math.PI * 0.7, Math.PI * 0.3), lidM); low.position.copy(e.position); head.add(low);
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(hs * 0.028, hs * 0.2, 4, 8), new THREE.MeshStandardMaterial({ color: o.brows || o.hair || 0x2a1d14, roughness: 0.95 }));
    brow.rotation.z = Math.PI / 2 - s * 0.12; brow.position.set(s * 0.29 * hs, 0.24 * hs, fz(0.36, 0.24) + hs * 0.01); head.add(brow);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.2, 12, 10), skin); ear.scale.set(0.28, 1, 0.62); ear.position.set(s * hs * 0.8, hs * 0.02, -hs * 0.05); ear.rotation.y = s * 0.3; head.add(ear);
    P.eyes.push(e, lid);
  }
  // nose: bridge + tip + wings
  const nose = new THREE.Mesh(new THREE.CapsuleGeometry(hs * 0.055, hs * 0.2, 4, 10), skin); nose.position.set(0, -0.12 * hs, fz(0, -0.12) + hs * 0.04); nose.rotation.x = 0.35; nose.scale.set(1, 1, 0.9); head.add(nose);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.075, 12, 10), skin); tip.position.set(0, -0.25 * hs, fz(0, -0.25) + hs * 0.085); head.add(tip);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.055, 10, 8), skin); w.position.set(s * hs * 0.08, -0.28 * hs, fz(0.1, -0.28) + hs * 0.035); head.add(w); }
  // lips
  const lipM = new THREE.MeshStandardMaterial({ color: new THREE.Color(o.skin || 0xd9a47e).lerp(new THREE.Color(o.female ? 0xb04a4a : 0x9a5a50), 0.45), roughness: 0.45 });
  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(hs * 0.032, hs * 0.2, 4, 10), lipM); upper.rotation.z = Math.PI / 2; upper.position.set(0, -0.42 * hs, fz(0, -0.42) + hs * 0.005); upper.scale.set(1, 1, 0.7); head.add(upper);
  const lower = new THREE.Mesh(new THREE.CapsuleGeometry(hs * 0.036, hs * 0.17, 4, 10), lipM); lower.rotation.z = Math.PI / 2; lower.position.set(0, -0.5 * hs, fz(0, -0.5)); lower.scale.set(1, 1, 0.7); head.add(lower);
  P.mouth = lower; P.mouthBase = lower.position.y;
  // hair: a shell over the scalp with a hairline, fuller at the back
  if (!o.bald) {
    const hl = o.longHair ? -0.6 : -0.25;
    const hair = new THREE.Mesh(shellOf(geo, hs, (x, y, z) => 0.05 + (z < 0 ? 0.03 : 0) + Math.max(0, y) * 0.03, (x, y, z) => (y > 0.38 - Math.max(0, -z) * 0.2 && !(z > 0.55 && y < 0.62)) || (z < -0.1 && y > hl) || (Math.abs(x) > 0.62 && y > 0.05 && z < 0.3)), hairM);
    head.add(hair);
  }
  if (o.ponytail) {
    const pt = new THREE.Mesh(new THREE.CapsuleGeometry(hs * 0.16, hs * 0.75, 4, 10), hairM); pt.position.set(0, hs * 0.15, -hs * 1.05); pt.rotation.x = 0.35; head.add(pt); P.ponytail = pt;
    const tie = new THREE.Mesh(new THREE.TorusGeometry(hs * 0.14, hs * 0.04, 6, 12), new THREE.MeshStandardMaterial({ color: 0xe0407a })); tie.position.set(0, hs * 0.5, -hs * 0.95); tie.rotation.x = 1.2; head.add(tie);
  }
  if (o.beard) {
    const bm = new THREE.MeshStandardMaterial({ color: o.beard, roughness: 1 });
    // full beard on jaw, chin and lower cheeks, leaving the lips clear
    const b = new THREE.Mesh(shellOf(geo, hs, (x, y, z) => 0.045 + Math.max(0, -y - 0.45) * 0.25, (x, y, z) => y < -0.12 - Math.max(0, z - 0.4) * 0.1 && z > -0.45 && !(Math.abs(x) < 0.2 && y > -0.62 && y < -0.33 && z > 0.6)), bm);
    head.add(b);
    const mus = new THREE.Mesh(new THREE.CapsuleGeometry(hs * 0.04, hs * 0.26, 4, 8), bm); mus.rotation.z = Math.PI / 2; mus.position.set(0, -0.35 * hs, fz(0, -0.35) + hs * 0.04); head.add(mus);
  }
  if (o.mustache) { const mus = new THREE.Mesh(new THREE.CapsuleGeometry(hs * 0.045, hs * 0.3, 4, 8), new THREE.MeshStandardMaterial({ color: o.mustache, roughness: 0.95 })); mus.rotation.z = Math.PI / 2; mus.position.set(0, -0.35 * hs, fz(0, -0.35) + hs * 0.045); head.add(mus); }
  if (o.kippah) {
    // knitted kippah: a small shallow cap on the crown, towards the back
    const kp = new THREE.Mesh(new THREE.SphereGeometry(hs * 1.08, 24, 6, 0, TAU, 0, 0.42), new THREE.MeshStandardMaterial({ map: TEX.kippah, roughness: 0.95 }));
    kp.position.set(0, -hs * 0.06, -hs * 0.05); kp.rotation.x = -0.42; head.add(kp);
  }
  if (o.tichel) {
    // head scarf over the hair, gathered into a knot at the nape
    const tm = fabricMat(o.tichel, 0.9);
    const t = new THREE.Mesh(shellOf(geo, hs, (x, y, z) => 0.07 + Math.max(0, -z) * 0.08 + Math.max(0, y) * 0.03, (x, y, z) => (y > 0.36) || (z < 0.25 && y > -0.45) || (Math.abs(x) > 0.55 && y > -0.2 && z < 0.45)), tm);
    head.add(t);
    const knot = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.42, 14, 10), tm); knot.position.set(0, -hs * 0.1, -hs * 1.02); knot.scale.set(1.15, 0.85, 0.75); head.add(knot);
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(hs * 0.14, hs * 0.5, 4, 8), tm); tail.position.set(hs * 0.1, -hs * 0.5, -hs * 1.0); tail.rotation.z = 0.2; head.add(tail);
  }
  if (o.captainHat) {
    const white = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.6 }), black = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(hs * 0.86, hs * 0.84, hs * 0.3, 24), black); band.position.set(0, hs * 0.62, -hs * 0.05); head.add(band);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(hs * 1.05, hs * 0.86, hs * 0.26, 24), white); crown.position.set(0, hs * 0.88, -hs * 0.08); crown.rotation.x = -0.08; head.add(crown);
    const peak = new THREE.Mesh(new THREE.CylinderGeometry(hs * 0.7, hs * 0.7, hs * 0.04, 20, 1, false, -Math.PI / 2, Math.PI), black); peak.position.set(0, hs * 0.5, hs * 0.55); peak.rotation.x = 0.35; head.add(peak);
    const badge = new THREE.Mesh(new THREE.SphereGeometry(hs * 0.12, 10, 6), new THREE.MeshStandardMaterial({ color: 0xe0b44a, metalness: 1, roughness: 0.3 })); badge.scale.z = 0.3; badge.position.set(0, hs * 0.68, hs * 0.84); head.add(badge);
  }
  if (o.fedora) {
    const fm = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.7 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(hs * 1.55, hs * 1.55, hs * 0.05, 28), fm); brim.position.set(0, hs * 0.55, -hs * 0.02); brim.rotation.x = -0.06; head.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(hs * 0.82, hs * 0.95, hs * 0.72, 24), fm); crown.position.set(0, hs * 0.92, -hs * 0.04); head.add(crown);
    const rib = new THREE.Mesh(new THREE.CylinderGeometry(hs * 0.955, hs * 0.955, hs * 0.14, 24), new THREE.MeshStandardMaterial({ color: 0x050505 })); rib.position.set(0, hs * 0.66, -hs * 0.04); head.add(rib);
  }
  if (o.hardHat) {
    const hh = new THREE.Mesh(new THREE.SphereGeometry(hs * 1.12, 20, 10, 0, TAU, 0, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: o.hardHat, roughness: 0.4 })); hh.position.set(0, hs * 0.4, -hs * 0.03); head.add(hh);
    const lip = new THREE.Mesh(new THREE.CylinderGeometry(hs * 1.22, hs * 1.22, hs * 0.04, 20), hh.material); lip.position.set(0, hs * 0.42, hs * 0.02); head.add(lip);
  }
  if (o.cap) {
    const cm = new THREE.MeshStandardMaterial({ color: o.cap, roughness: 0.95 });
    const c = new THREE.Mesh(shellOf(geo, hs, 0.07, (x, y, z) => y > 0.32 - Math.max(0, -z) * 0.25), cm); head.add(c);
    const peak = new THREE.Mesh(new THREE.CylinderGeometry(hs * 0.62, hs * 0.62, hs * 0.04, 20, 1, false, -Math.PI / 2, Math.PI), cm); peak.position.set(0, hs * 0.52, hs * 0.62); peak.rotation.x = 0.25; head.add(peak);
  }
  if (o.glasses) {
    const gm = new THREE.MeshStandardMaterial({ color: 0x6a5238, metalness: 0.5, roughness: 0.3 });
    for (const s of [-1, 1]) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(hs * 0.15, hs * 0.015, 6, 20), gm); r.position.set(s * hs * 0.28, hs * 0.06, fz(0.35, 0.06) + hs * 0.05); head.add(r);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(hs * 0.015, hs * 0.015, hs * 0.8), gm); arm.position.set(s * hs * 0.74, hs * 0.08, -hs * 0.2); head.add(arm);
    }
    const br = new THREE.Mesh(new THREE.BoxGeometry(hs * 0.12, hs * 0.018, hs * 0.018), gm); br.position.set(0, hs * 0.1, fz(0, 0.1) + hs * 0.07); head.add(br);
  }
  head.traverse((m) => { if (m.isMesh) m.castShadow = true; });
}

// merge each joint's static child meshes by material (fewer draw calls, same animation)
function mergeRig(root, keep) {
  const groups = []; root.traverse((o) => { if (!o.isMesh) groups.push(o); });
  for (const g of groups) {
    const by = new Map();
    for (const c of g.children) {
      if (!c.isMesh || keep.has(c) || c.children.length || Array.isArray(c.material)) continue;
      const key = c.material.uuid + (c.castShadow ? 1 : 0);
      if (!by.has(key)) by.set(key, []); by.get(key).push(c);
    }
    for (const list of by.values()) {
      if (list.length < 2) continue;
      const geos = list.map((c) => { c.updateMatrix(); let q = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone(); for (const n of Object.keys(q.attributes)) if (!['position', 'normal', 'uv'].includes(n)) q.deleteAttribute(n); if (!q.attributes.uv) q.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(q.attributes.position.count * 2), 2)); q.applyMatrix4(c.matrix); return fixNormals(q); });
      const m = new THREE.Mesh(mergeGeometries(geos), list[0].material); m.receiveShadow = true;
      g.add(m); for (const c of list) g.remove(c);
    }
  }
}

// ---- animation
const _look = new THREE.Vector3();
function animatePerson(P, dt, t) {
  const J = P.joints;
  const moving = P.path.length > 0;
  // walking along a path
  if (moving) {
    const tgt = P.path[0];
    const dx = tgt.x - P.pos.x, dz = tgt.z - P.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.08) { P.path.shift(); if (!P.path.length) { const cb = P.onArrive; P.onArrive = null; if (P.faceAfter != null) { P.targetHeading = P.faceAfter; P.faceAfter = null; } if (cb) cb(); } }
    else {
      const h = Math.atan2(dx, dz);
      P.targetHeading = h;
      const sp = Math.min(P.speed, d * 3 + 0.3);
      P.pos.x += dx / d * sp * dt; P.pos.z += dz / d * sp * dt;
      P.walkT += dt * sp * 5.2;
    }
  }
  if (P.targetHeading != null) {
    let dh = P.targetHeading - P.heading; while (dh > Math.PI) dh -= TAU; while (dh < -Math.PI) dh += TAU;
    P.heading += dh * (1 - Math.exp(-dt * 8));
  }
  P.root.rotation.y = P.heading;
  const walkK = moving ? 1 : 0;
  P.walkBlend = damp(P.walkBlend || 0, walkK, 8, dt);
  P.sitK = damp(P.sitK, P.state === 'sit' ? 1 : 0, 5, dt);
  const wb = P.walkBlend, sw = Math.sin(P.walkT), sw2 = Math.cos(P.walkT);
  const breathe = Math.sin(t * 1.6 + P.H * 10) * 0.012;
  const legLen = 0.47 * P.H;
  // hips height: bob while walking, drop when sitting
  J.hips.position.y = lerp(legLen + Math.abs(sw2) * 0.025 * wb - 0.012 * wb, 0.47 * (P.H / 1.75) + 0.02, P.sitK);
  J.hips.rotation.y = sw * 0.08 * wb;
  const bend = P.pose === 'daven' || P.pose === 'siddur' ? 0.08 + Math.max(0, Math.sin(t * 3.4)) * 0.16 : P.pose === 'lean' ? 0.3 : P.pose === 'sick' ? 0.85 + Math.sin(t * 1.3) * 0.05 : P.pose === 'rope' || P.pose === 'wrench' ? 0.35 : 0;
  J.spine.rotation.x = 0.03 * wb + breathe * 0.4 - P.sitK * 0.04 + (P.o.stoop || 0) + bend;
  J.spine.rotation.y = -sw * 0.1 * wb;
  J.spine.scale.set(1, 1 + breathe * 0.3, 1 + breathe);
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R';
    const ph = s < 0 ? sw : -sw;
    J['hip' + side].rotation.x = lerp(ph * 0.5 * wb, -1.5, P.sitK);
    const kneeBend = Math.max(0, -Math.sin(P.walkT + (s < 0 ? 0 : Math.PI) - 0.8)) * 0.9 * wb + 0.05;
    J['knee' + side].rotation.x = lerp(kneeBend, 1.5, P.sitK);
    J['ankle' + side].rotation.x = lerp(-ph * 0.2 * wb, 0.05, P.sitK);
    J['hip' + side].rotation.z = lerp(0, s * -0.08, P.sitK);
    // arms swing opposite the legs
    const sh = J['shoulder' + side], el = J['elbow' + side];
    let ax = -ph * 0.45 * wb + breathe * 0.5, az = s * (0.08 + Math.abs(breathe) * 0.5), ex = -0.15 - 0.25 * wb;
    if (P.sitK > 0.01) { ax = lerp(ax, -0.5, P.sitK); ex = lerp(ex, -0.9, P.sitK); }
    // talking gestures
    if (P.gesture > 0 && s > 0) { ax += -0.6 - Math.sin(t * 3.1) * 0.2; ex += -0.8 + Math.sin(t * 4.3) * 0.2; }
    if (P.gesture > 0 && s < 0) { ax += -0.2 + Math.sin(t * 2.3 + 1) * 0.1; }
    // special poses
    if (P.pose === 'kiddush' && s > 0) { ax = -1.2; ex = -1.3; az = 0.2; }
    if (P.pose === 'candles') { ax = -1.25 + Math.sin(t * 2) * 0.15; ex = -1.0; az = s * (0.25 + Math.sin(t * 2) * 0.25); }
    if (P.pose === 'shake') { ax = -1.1 + Math.sin(t * 9) * 0.25 * (s > 0 ? 1 : 0.5); ex = -1.0; az = s * 0.1; }
    if (P.pose === 'hammer' && s > 0) { ax = -1.7 + Math.abs(Math.sin(t * 5)) * 0.9; ex = -0.9; }
    if (P.pose === 'wave' && s > 0) { ax = -2.8; az = 0.2 + Math.sin(t * 9) * 0.3; ex = -0.3; }
    if (P.pose === 'helm') { ax = -1.0 + Math.sin(t * 0.7 + s) * 0.06; ex = -0.55; az = s * 0.18; }
    if (P.pose === 'lean') { ax = -1.0; ex = -0.25; az = s * 0.12; }
    if (P.pose === 'sick') { ax = -1.25; ex = -0.2; az = s * 0.2; }
    if (P.pose === 'photo') { ax = -1.45; ex = -1.55; az = s * 0.35; }
    if (P.pose === 'tea' && s > 0) { ax = -0.55 + Math.max(0, Math.sin(t * 0.6)) * -0.5; ex = -1.75; }
    if (P.pose === 'lulav') { if (s > 0) { ax = -0.95 + Math.sin(t * 1.3) * 0.05; ex = -0.9; } else { ax = -0.5; ex = -1.2; az = -0.25; } }
    if (P.pose === 'rope') { ax = -0.75 + Math.sin(t * 2.2 + s) * 0.25; ex = -0.6 + Math.cos(t * 2.2) * 0.2; az = s * 0.15; }
    if (P.pose === 'dice' && s > 0) { ax = -0.7 + Math.max(0, Math.sin(t * 1.7)) * -0.3; ex = -1.1; }
    if (P.pose === 'siddur') { ax = -0.75; ex = -1.25; az = s * 0.22; }
    if (P.pose === 'wrench' && s > 0) { ax = -1.1 + Math.sin(t * 3) * 0.2; ex = -0.7; }
    sh.rotation.x = damp(sh.rotation.x, ax, 12, dt); sh.rotation.z = damp(sh.rotation.z, az, 12, dt); el.rotation.x = damp(el.rotation.x, ex, 12, dt);
  }
  // head: look at the player when close
  if (P.root.parent) P.root.parent.worldToLocal(_look.copy(camera.position));
  const dx = _look.x - P.pos.x, dz = _look.z - P.pos.z, dist = Math.hypot(dx, dz);
  let want = 0, wantP = 0;
  if (dist < 5 && !P.noLook) {
    let rel = Math.atan2(dx, dz) - P.heading; while (rel > Math.PI) rel -= TAU; while (rel < -Math.PI) rel += TAU;
    if (Math.abs(rel) < 1.9) { want = clamp(rel, -1.1, 1.1); wantP = -Math.atan2(_look.y - (P.pos.y + P.H * 0.93), dist) * 0.7; }
  }
  P.look = damp(P.look, want, 4, dt); P.lookP = damp(P.lookP, clamp(wantP, -0.5, 0.4), 4, dt);
  J.neck.rotation.y = P.look * 0.4; J.head.rotation.y = P.look * 0.6;
  J.head.rotation.x = P.lookP + Math.sin(t * 0.7 + P.H) * 0.02 + (P.gesture > 0 ? Math.sin(t * 5) * 0.03 : 0);
  // blink
  P.blink -= dt;
  const bl = P.blink < 0.12 ? 0.1 : 1; if (P.blink < 0) P.blink = 2 + rand() * 4;
  for (let i = 0; i < P.eyes.length; i += 2) { P.eyes[i].scale.y = 0.85 * bl; P.eyes[i + 1].rotation.x = bl < 1 ? 0.9 : -0.1; }
  // mouth moves while talking
  if (P.mouth) P.mouth.position.y = P.mouthBase - (P.gesture > 0 ? Math.abs(Math.sin(t * 13)) * 0.006 : 0);
  if (P.ponytail) P.ponytail.rotation.x = 0.5 + sw * 0.2 * wb;
  P.gesture = Math.max(0, P.gesture - dt);
}

function walkPath(P, pts, onArrive, faceAfter = null) { P.path = pts.map((p) => new THREE.Vector3(p[0], 0, p[1])); P.onArrive = onArrive || null; P.faceAfter = faceAfter; P.state = 'idle'; }
function placeNPC(P, x, z, heading) { P.pos.set(x, 0, z); P.heading = heading; P.targetHeading = heading; P.path = []; }
function faceTowards(P, x, z) { P.targetHeading = Math.atan2(x - P.pos.x, z - P.pos.z); }

// big parts cast shadows, small face details don't
function trimShadows(root) { root.traverse((o) => { if (!o.isMesh) return; o.geometry.computeBoundingSphere(); o.castShadow = !MOBILE && o.geometry.boundingSphere.radius > 0.07; }); }
