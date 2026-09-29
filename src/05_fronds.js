// ---------------------------------------------------------------- plants: palm fronds (also schach), olive, lemon, date palm, bougainvillea
const SWAY = []; // {obj, amp, speed, phase, base}

// Wind sway in the vertex shader for foliage materials
function windify(mat, amp = 0.06, freq = 1.3, weight = 'max(position.y, 0.0) * 0.25') {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.time; sh.uniforms.uWind = U.wind;
    sh.vertexShader = 'uniform float uTime; uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 wpW = modelMatrix * vec4(position, 1.0);
      #ifdef USE_INSTANCING
        wpW = modelMatrix * instanceMatrix * vec4(position, 1.0);
      #endif
      float sw = sin(uTime * ${freq.toFixed(2)} + wpW.x * 0.6 + wpW.z * 0.4) + 0.5 * sin(uTime * ${(freq * 2.7).toFixed(2)} + wpW.x * 1.7);
      float fl = sin(uTime * 7.0 + wpW.x * 9.0 + wpW.y * 7.0) * 0.25;
      transformed.x += (sw + fl) * ${amp.toFixed(3)} * uWind * (${weight});
      transformed.z += (sw * 0.6 - fl) * ${amp.toFixed(3)} * uWind * (${weight});`);
  };
  return mat;
}

// A date-palm frond: arched rachis with V-folded leaflets. Returns merged geometry with vertex colours.
// Frond lies along +x, base at origin, leaflets fan in +/-z.
function makeFrondGeometry(len, seed, { dry = 0, droop = 0.35, spread = 0.55, leafW = 1, leafLen = 1 } = {}) {
  const R = mulberry32(seed);
  const pos = [], nor = [], col = [], idx = [];
  const base = new THREE.Color().setHSL(0.2 - dry * 0.08, 0.42 - dry * 0.1, 0.24 + dry * 0.16);
  const tip = new THREE.Color().setHSL(0.18 - dry * 0.07, 0.35, 0.34 + dry * 0.14);
  const rach = new THREE.Color().setHSL(0.13, 0.35, 0.42 + dry * 0.1);
  const pt = (t) => { // rachis curve
    const x = t * len, y = Math.sin(t * Math.PI * 0.5) * len * 0.08 - t * t * len * droop;
    return new THREE.Vector3(x, y, Math.sin(t * 5 + seed) * 0.02 * len);
  };
  const tan = (t) => pt(Math.min(1, t + 0.01)).sub(pt(Math.max(0, t - 0.01))).normalize();
  let vi = 0;
  const addQuad = (a, b, c, d, n, ca, cb) => {
    for (const [p, cc] of [[a, ca], [b, ca], [c, cb], [d, cb]]) { pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); col.push(cc.r, cc.g, cc.b); }
    idx.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3); vi += 4;
  };
  // rachis: flat tapered strip (two faces) — seen mostly from below/above
  const steps = 18;
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps, t1 = (i + 1) / steps;
    const w0 = lerp(0.035, 0.006, t0) * len / 2.5, w1 = lerp(0.035, 0.006, t1) * len / 2.5;
    const p0 = pt(t0), p1 = pt(t1);
    const up = new THREE.Vector3(0, 1, 0);
    addQuad(p0.clone().add(new THREE.Vector3(0, 0, -w0)), p0.clone().add(new THREE.Vector3(0, 0, w0)), p1.clone().add(new THREE.Vector3(0, 0, w1)), p1.clone().add(new THREE.Vector3(0, 0, -w1)), up, rach, rach);
    const side = new THREE.Vector3(0, 0, 1);
    addQuad(p0.clone().add(new THREE.Vector3(0, -w0, 0)), p0.clone().add(new THREE.Vector3(0, w0 * 0.3, 0)), p1.clone().add(new THREE.Vector3(0, w1 * 0.3, 0)), p1.clone().add(new THREE.Vector3(0, -w1, 0)), side, rach, rach);
  }
  // leaflets
  const n = Math.floor(52 + R() * 14);
  for (let i = 0; i < n; i++) {
    const t = 0.12 + (i / n) * 0.86;
    const p = pt(t), tg = tan(t);
    const L = len * (0.22 + 0.2 * Math.sin(Math.min(1, t * 1.25) * Math.PI)) * (0.85 + R() * 0.3) * (t > 0.92 ? 0.6 : 1) * leafLen;
    const W = 0.022 * len / 2.5 * (0.8 + R() * 0.4) * leafW;
    for (const s of [-1, 1]) {
      // leaflet direction: out to the side, swept toward the tip, raised into a V
      const ang = spread + R() * 0.2;
      const dir = new THREE.Vector3(tg.x * Math.cos(ang), 0.35 + R() * 0.25 - t * 0.2, s * Math.sin(ang)).normalize();
      const mid = new THREE.Vector3(0, 1, 0).cross(dir).normalize().multiplyScalar(s);
      const segs = 3;
      let prevA = null, prevB = null;
      const cA = new THREE.Color().copy(base).lerp(tip, t).offsetHSL((R() - 0.5) * 0.02, 0, (R() - 0.5) * 0.05);
      if (R() < 0.08 + dry * 0.3) cA.lerp(new THREE.Color(0.55, 0.45, 0.22), 0.6); // browned leaflet
      for (let k = 0; k <= segs; k++) {
        const f = k / segs;
        const c = p.clone().addScaledVector(dir, L * f);
        c.y -= f * f * L * 0.35; // leaflets droop at the ends
        const w = W * Math.sin(Math.max(0.15, f) * Math.PI) * (1 - f * 0.4);
        // V fold: two edges raised along the midrib
        const a = c.clone().addScaledVector(mid, w).add(new THREE.Vector3(0, w * 0.6, 0));
        const b = c.clone().addScaledVector(mid, -w).add(new THREE.Vector3(0, w * 0.6, 0));
        if (prevA) {
          const nn = new THREE.Vector3().subVectors(a, prevA).cross(new THREE.Vector3().subVectors(b, a)).normalize();
          if (!(nn.lengthSq() > 1e-10)) nn.set(0, 1, 0);
          if (nn.y < 0) nn.negate();
          const c2 = cA.clone().multiplyScalar(0.85 + f * 0.2);
          addQuad(prevA, prevB, b, a, nn, cA, c2);
        }
        prevA = a; prevB = b;
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}
let FROND_MAT;
function frondMaterial() {
  if (!FROND_MAT) FROND_MAT = windify(new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.78, metalness: 0 }), 0.05, 1.1, 'length(position) * 0.12');
  return FROND_MAT;
}

// ---- trunks
