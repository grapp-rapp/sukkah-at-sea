// ---------------------------------------------------------------- procedural textures
const TEX = {};

function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function toTex(c, { srgb = true, repeat = null, mips = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = Math.min(8, maxAniso);
  if (repeat) t.repeat.set(repeat[0], repeat[1]);
  if (!mips) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  return t;
}
// Build colour / normal / roughness maps from per-pixel callbacks.
// fn(u, v) -> { h, r, g, b, ro } (h: height 0..1, rgb 0..1, ro: roughness 0..1)
function genPBR(w, h, fn, normalStrength = 2.0) {
  const H = new Float32Array(w * h);
  const col = mkCanvas(w, h), nrm = mkCanvas(w, h), rgh = mkCanvas(w, h);
  const cc = col.getContext('2d'), nc = nrm.getContext('2d'), rc = rgh.getContext('2d');
  const ci = cc.createImageData(w, h), ni = nc.createImageData(w, h), ri = rc.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = fn(x / w, y / h);
    const i = y * w + x, j = i * 4;
    H[i] = s.h;
    ci.data[j] = clamp(s.r, 0, 1) * 255; ci.data[j + 1] = clamp(s.g, 0, 1) * 255; ci.data[j + 2] = clamp(s.b, 0, 1) * 255; ci.data[j + 3] = 255;
    const ro = clamp(s.ro ?? 0.8, 0, 1) * 255;
    ri.data[j] = ro; ri.data[j + 1] = ro; ri.data[j + 2] = ro; ri.data[j + 3] = 255;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const xl = (x - 1 + w) % w, xr = (x + 1) % w, yu = (y - 1 + h) % h, yd = (y + 1) % h;
    const dx = (H[y * w + xr] - H[y * w + xl]) * normalStrength;
    const dy = (H[yd * w + x] - H[yu * w + x]) * normalStrength;
    const l = Math.hypot(dx, dy, 1);
    const j = (y * w + x) * 4;
    ni.data[j] = (-dx / l * 0.5 + 0.5) * 255; ni.data[j + 1] = (dy / l * 0.5 + 0.5) * 255; ni.data[j + 2] = (1 / l * 0.5 + 0.5) * 255; ni.data[j + 3] = 255;
  }
  cc.putImageData(ci, 0, 0); nc.putImageData(ni, 0, 0); rc.putImageData(ri, 0, 0);
  return { map: toTex(col), normalMap: toTex(nrm, { srgb: false }), roughnessMap: toTex(rgh, { srgb: false }) };
}
function setRepeat(set, x, y) { for (const k of ['map', 'normalMap', 'roughnessMap']) if (set[k]) set[k].repeat.set(x, y); return set; }
function cloneSet(set) { const o = {}; for (const k of ['map', 'normalMap', 'roughnessMap']) if (set[k]) { o[k] = set[k].clone(); o[k].needsUpdate = true; } return o; }

// ---- ashlar / slab layout shared by wall stone and paving
function genWood(light = true) {
  // grain runs along v (texture height = length)
  const base = light ? [0.80, 0.63, 0.43] : [0.52, 0.36, 0.22];
  return genPBR(256, 1024, (u, v) => {
    const warp = fbm(noiseA, u * 3, v * 1.5, 3) * 3.0;
    const ring = Math.sin((u * 18 + warp) * Math.PI);
    const grain = Math.pow(Math.abs(ring), 0.35);
    const fine = noiseB(u * 180, v * 8) * 0.5 + 0.5;
    const knot = Math.max(0, 1 - Math.hypot((u - 0.55) * 3, (v - 0.37) * 12)) + Math.max(0, 1 - Math.hypot((u - 0.2) * 3.4, (v - 0.83) * 14));
    const d = 0.18 * (1 - grain) + fine * 0.06 + knot * 0.35;
    return { h: grain * 0.3 + fine * 0.1 - knot * 0.2, r: base[0] * (1 - d), g: base[1] * (1 - d * 1.1), b: base[2] * (1 - d * 1.2), ro: 0.72 + fine * 0.1 };
  }, 1.2);
}

function genWeave() {
  // tiny canvas weave; repeated densely
  return genPBR(128, 128, (u, v) => {
    const X = u * 32, Y = v * 32;
    const cx = Math.floor(X), cy = Math.floor(Y);
    const over = (cx + cy) & 1;
    const fx = X - cx, fy = Y - cy;
    const warp = Math.sin(fx * Math.PI) * (over ? 1 : 0.6);
    const weft = Math.sin(fy * Math.PI) * (over ? 0.6 : 1);
    const h = Math.max(warp * (over ? 1 : 0.5), weft * (over ? 0.5 : 1));
    const n = noiseA(u * 90, v * 90) * 0.05;
    const c = 0.92 + h * 0.06 + n;
    return { h, r: c, g: c, b: c, ro: 0.95 };
  }, 1.6);
}

function paintTex(w, h, draw, opts) { const c = mkCanvas(w, h); draw(c.getContext('2d'), w, h); return toTex(c, opts); }

function drawPomegranate(g, x, y, s, a = 0) {
  g.save(); g.translate(x, y); g.rotate(a);
  const gr = g.createRadialGradient(-s * 0.3, -s * 0.3, s * 0.1, 0, 0, s);
  gr.addColorStop(0, '#e2553f'); gr.addColorStop(1, '#8a1a1c');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, s, 0, TAU); g.fill();
  g.fillStyle = '#7a1718';
  g.beginPath(); g.moveTo(-s * 0.3, -s * 0.9); for (let i = 0; i <= 6; i++) { const ax = -s * 0.3 + i * s * 0.1; g.lineTo(ax, -s * (i & 1 ? 1.25 : 1.1)); } g.lineTo(s * 0.3, -s * 0.9); g.fill();
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-s * 0.35, -s * 0.35, s * 0.18, s * 0.1, -0.7, 0, TAU); g.fill();
  g.restore();
}
function drawGrapes(g, x, y, s) {
  for (let r = 0; r < 5; r++) for (let i = 0; i <= 4 - r; i++) {
    const gx = x + (i - (4 - r) / 2) * s * 0.9, gy = y + r * s * 0.8;
    const gr = g.createRadialGradient(gx - s * 0.2, gy - s * 0.2, 1, gx, gy, s * 0.5);
    gr.addColorStop(0, '#9b6fb8'); gr.addColorStop(1, '#3d1f55');
    g.fillStyle = gr; g.beginPath(); g.arc(gx, gy, s * 0.48, 0, TAU); g.fill();
  }
  g.fillStyle = '#4f7a2b'; g.beginPath(); g.ellipse(x + s * 1.2, y - s * 0.6, s * 1.1, s * 0.6, -0.4, 0, TAU); g.fill();
}
function drawOliveBranch(g, x, y, len, a) {
  g.save(); g.translate(x, y); g.rotate(a);
  g.strokeStyle = '#6b5a3a'; g.lineWidth = len * 0.02; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, -len * 0.08, len, 0); g.stroke();
  for (let i = 1; i < 9; i++) {
    const t = i / 9, px = len * t, py = -len * 0.08 * Math.sin(t * Math.PI);
    for (const sgn of [-1, 1]) {
      g.save(); g.translate(px, py); g.rotate(sgn * 0.7);
      g.fillStyle = sgn > 0 ? '#7d8f55' : '#a6b184';
      g.beginPath(); g.ellipse(len * 0.07, 0, len * 0.08, len * 0.018, 0, 0, TAU); g.fill(); g.restore();
    }
  }
  g.restore();
}
function drawSkyline(g, x0, y0, w, h, col) {
  // Old City walls + Tower of David + Dome silhouette
  g.fillStyle = col; g.beginPath(); g.moveTo(x0, y0 + h);
  const pts = [[0, 0.62], [0.06, 0.62], [0.06, 0.5], [0.1, 0.5], [0.1, 0.62], [0.2, 0.62], [0.2, 0.2], [0.215, 0.2], [0.215, 0.1], [0.23, 0.02], [0.245, 0.1], [0.245, 0.2], [0.26, 0.2], [0.26, 0.62],
    [0.38, 0.62], [0.38, 0.45], [0.42, 0.45], [0.42, 0.62], [0.5, 0.62]];
  for (const [px, py] of pts) g.lineTo(x0 + px * w, y0 + py * h);
  // dome
  g.lineTo(x0 + 0.55 * w, y0 + 0.62 * h); g.lineTo(x0 + 0.55 * w, y0 + 0.45 * h);
  g.arc(x0 + 0.6 * w, y0 + 0.45 * h, 0.05 * w, Math.PI, 0);
  g.lineTo(x0 + 0.65 * w, y0 + 0.62 * h);
  const pts2 = [[0.72, 0.62], [0.72, 0.52], [0.76, 0.52], [0.76, 0.62], [0.86, 0.62], [0.86, 0.3], [0.875, 0.22], [0.89, 0.3], [0.89, 0.62], [1, 0.62], [1, 1]];
  for (const [px, py] of pts2) g.lineTo(x0 + px * w, y0 + py * h);
  g.closePath(); g.fill();
  // crenellations
  for (let i = 0; i < 48; i++) { const px = x0 + (i / 48) * w; g.fillRect(px, y0 + 0.62 * h - h * 0.03, w / 110, h * 0.03); }
}

// Printed sukkah wall panel, one of several designs (tex covers 4m x 2m at 2048x1024)
function genPanelTex(kind) {
  return paintTex(2048, 1024, (g, W, H) => {
    // canvas cloth base
    g.fillStyle = '#f1e8d6'; g.fillRect(0, 0, W, H);
    const bandCol = kind === 1 ? '#2d4f7c' : kind === 2 ? '#7b2f2a' : '#315a3d';
    // top / bottom bands
    g.fillStyle = bandCol; g.fillRect(0, 0, W, 120); g.fillRect(0, H - 110, W, 110);
    g.fillStyle = '#d6a64d'; g.fillRect(0, 120, W, 10); g.fillRect(0, H - 120, W, 10);
    for (let x = 30; x < W; x += 140) { drawPomegranate(g, x + 40, 64, 26, 0.2); drawGrapes(g, x + 105, 26, 12); }
    for (let x = 0; x < W; x += 180) drawOliveBranch(g, x + 20, H - 55, 150, -0.05);
    // centre
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (kind === 0) {
      // welcome panel with Jerusalem skyline
      const sky = g.createLinearGradient(0, 180, 0, 760); sky.addColorStop(0, '#f6dca0'); sky.addColorStop(1, '#f1e8d6');
      g.fillStyle = sky; g.fillRect(260, 180, W - 520, 560);
      g.fillStyle = '#e9b75f'; g.beginPath(); g.arc(W / 2 + 300, 330, 70, 0, TAU); g.fill();
      drawSkyline(g, 260, 380, W - 520, 360, '#c79a54');
      drawSkyline(g, 360, 470, W - 720, 280, '#8f6a36');
      g.strokeStyle = '#d6a64d'; g.lineWidth = 8; g.strokeRect(260, 180, W - 520, 560);
      g.fillStyle = bandCol; g.font = '900 110px "Frank Ruhl Libre", serif';
      g.direction = 'rtl'; g.fillText('ברוכים הבאים לסוכה', W / 2, 820);
    } else if (kind === 1) {
      // "and you shall rejoice in your festival" with ushpizin arches
      g.fillStyle = bandCol; g.font = '900 120px "Frank Ruhl Libre", serif'; g.direction = 'rtl';
      g.fillText('וְשָׂמַחְתָּ בְּחַגֶּךָ', W / 2, 250);
      const names = ['אברהם', 'יצחק', 'יעקב', 'משה', 'אהרן', 'יוסף', 'דוד'];
      for (let i = 0; i < 7; i++) {
        const cx = 220 + i * (W - 440) / 6, top = 380;
        g.fillStyle = '#e8d3a6'; g.beginPath(); g.moveTo(cx - 95, 820); g.lineTo(cx - 95, top + 95); g.arc(cx, top + 95, 95, Math.PI, 0); g.lineTo(cx + 95, 820); g.closePath(); g.fill();
        g.strokeStyle = '#b8863a'; g.lineWidth = 6; g.stroke();
        g.fillStyle = bandCol; g.font = '700 54px "Frank Ruhl Libre", serif'; g.fillText(names[6 - i], cx, 560);
        drawPomegranate(g, cx, 700, 30);
      }
    } else if (kind === 2) {
      // seven species
      g.fillStyle = bandCol; g.font = '900 100px "Frank Ruhl Libre", serif'; g.direction = 'rtl';
      g.fillText('חַג הַסֻּכּוֹת', W / 2, 230);
      g.font = '500 44px "Frank Ruhl Libre", serif'; g.fillStyle = '#6b4a24';
      g.fillText('זְמַן שִׂמְחָתֵנוּ', W / 2, 320);
      // wheat, grapes, figs, pomegranates, olives, dates
      for (let i = 0; i < 12; i++) {
        const x = 200 + i * 150;
        g.strokeStyle = '#c9a24a'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, 860); g.quadraticCurveTo(x + 20, 640, x + 10, 480); g.stroke();
        for (let k = 0; k < 7; k++) { g.fillStyle = '#d9b35c'; g.beginPath(); g.ellipse(x + 10 + (k & 1 ? 12 : -12), 500 + k * 22, 11, 20, (k & 1 ? 0.4 : -0.4), 0, TAU); g.fill(); }
        if (i % 3 === 0) drawGrapes(g, x + 70, 620, 18);
        if (i % 3 === 1) drawPomegranate(g, x + 70, 700, 34);
        if (i % 3 === 2) drawOliveBranch(g, x + 30, 600, 120, 0.3);
      }
    } else {
      // plain canvas with a subtle stripe near the top
      g.fillStyle = bandCol; g.fillRect(0, 150, W, 6);
    }
    // fabric fading + light soiling at bottom
    const fade = g.createLinearGradient(0, 0, 0, H); fade.addColorStop(0, 'rgba(255,255,255,0.05)'); fade.addColorStop(0.85, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(90,70,40,0.18)');
    g.fillStyle = fade; g.fillRect(0, 0, W, H);
    // grommets at top
    for (let x = 60; x < W; x += 170) { g.fillStyle = '#b8b2a4'; g.beginPath(); g.arc(x, 24, 11, 0, TAU); g.fill(); g.fillStyle = '#2a2520'; g.beginPath(); g.arc(x, 24, 6, 0, TAU); g.fill(); }
  });
}

function genKippah() {
  return paintTex(256, 256, (g, W, H) => {
    g.fillStyle = '#1d2b4a'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 4) { g.fillStyle = y % 8 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.12)'; g.fillRect(0, y, W, 2); }
    g.fillStyle = '#e2b460'; for (let x = 0; x < W; x += 16) { g.fillRect(x, H * 0.7, 8, 8); g.fillRect(x + 8, H * 0.7 + 8, 8, 8); }
    g.fillStyle = '#ffffff'; g.fillRect(0, H * 0.84, W, 5);
  });
}

