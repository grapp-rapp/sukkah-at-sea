// ---------------------------------------------------------------- boot, cameras, rain, gulls, sound, loop
const clock = new THREE.Clock();
let composer, bloomPass, fxaaPass, controls, camMode = 'orbit';
const LOOK = { yaw: 0, pitch: 0, pos: new THREE.Vector3(0, 0, 4), drag: false };

async function buildTextures() {
  TEX.wood = genWood(true);
  TEX.weave = genWeave();
  await loadStep(0.2, tt('Weaving the canvas', 'אורגים את הבד'));
  try { await document.fonts.load('900 60px "Frank Ruhl Libre"'); await document.fonts.load('700 30px "Assistant"'); } catch (e) {}
  TEX.panels = [genPanelTex(0), genPanelTex(1), genPanelTex(2), genPanelTex(3)];
}
function buildPost() {
  const w = window.innerWidth, h = window.innerHeight;
  composer = new EffectComposer(renderer); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); if (any(isnan(c.rgb)) || any(isinf(c.rgb))) c.rgb = vec3(0.0); gl_FragColor = vec4(min(c.rgb, vec3(64.0)), 1.0); }' }));
  bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.2, 0.5, 2.0); composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
  fxaaPass = new ShaderPass(FXAAShader); composer.addPass(fxaaPass);
  fxaaPass.material.uniforms.resolution.value.set(1 / (w * renderer.getPixelRatio()), 1 / (h * renderer.getPixelRatio()));
}

// ---- rain (streaks around the camera, slanted by the wind)
const RAIN = { mesh: null, n: 4000, pos: null };
function buildRain() {
  const g = new THREE.BufferGeometry(); const p = new Float32Array(RAIN.n * 6);
  for (let i = 0; i < RAIN.n; i++) { const x = rr(-25, 25), y = rr(0, 22), z = rr(-25, 25); p.set([x, y, z, x, y - 0.4, z], i * 6); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); RAIN.pos = p;
  RAIN.mesh = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xaab8c4, transparent: true, opacity: 0.35 }));
  RAIN.mesh.frustumCulled = false; scene.add(RAIN.mesh);
}
function updateRain(dt) {
  const k = CFG.rain / 100; RAIN.mesh.visible = k > 0.01;
  if (!RAIN.mesh.visible) return;
  const count = Math.floor(RAIN.n * k); RAIN.mesh.geometry.setDrawRange(0, count * 2);
  const p = RAIN.pos, wx = CFG.wind / 30 * 0.25;
  for (let i = 0; i < count; i++) {
    const o = i * 6; let y = p[o + 1] - dt * 11;
    let x = p[o] + wx * dt * 11;
    if (y < -1) { y = 22; x = rr(-25, 25); p[o + 2] = rr(-25, 25); }
    if (x > 25) x -= 50;
    p[o] = x; p[o + 1] = y; p[o + 3] = x - wx * 0.4; p[o + 4] = y - 0.45; p[o + 5] = p[o + 2];
  }
  RAIN.mesh.geometry.attributes.position.needsUpdate = true;
  RAIN.mesh.position.set(camera.position.x, camera.position.y - 8, camera.position.z);
  RAIN.mesh.material.opacity = 0.18 + k * 0.25;
}

// ---- seagulls circling the ship
const GULLS = [];
function buildGulls() {
  const m = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group(); scene.add(g);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.25, 4, 8), m); body.rotation.x = Math.PI / 2; g.add(body);
    const wings = [];
    for (const s of [-1, 1]) { const wgeo = new THREE.PlaneGeometry(0.55, 0.16); wgeo.translate(s * 0.28, 0, 0); const w = new THREE.Mesh(wgeo, m); g.add(w); wings.push(w); }
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 6), new THREE.MeshStandardMaterial({ color: 0xe0a020 })); tip.rotation.x = -Math.PI / 2; tip.position.z = -0.2; g.add(tip);
    GULLS.push({ g, wings, r: 14 + rand() * 16, h: 8 + rand() * 8, sp: 0.15 + rand() * 0.1, ph: rand() * TAU, cx: rr(-8, 8), cz: rr(-10, 10) });
  }
}
function updateGulls(t) {
  for (const b of GULLS) {
    const a = b.ph + t * b.sp * (CFG.wind > 45 ? 1.6 : 1);
    b.g.position.set(b.cx + Math.cos(a) * b.r, b.h + Math.sin(t * 0.7 + b.ph) * 1.2, b.cz + Math.sin(a) * b.r);
    b.g.rotation.set(0, -a, 0.4);
    const f = Math.sin(t * 7 + b.ph) * 0.5; b.wings[0].rotation.z = f; b.wings[1].rotation.z = -f;
  }
}

// ---- sound: waves, wind, rain, flapping canvas, engine
const SND = { ctx: null };
function audioInit() {
  if (SND.ctx) { if (SND.ctx.state === 'suspended') SND.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const ctx = new AC(); SND.ctx = ctx;
  const out = ctx.createGain(); out.gain.value = 0.6; out.connect(ctx.destination);
  const nb = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate); const d = nb.getChannelData(0); let b = 0;
  for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = (b + 0.02 * w) / 1.02; d[i] = w * 0.5 + b * 3; }
  const loop = (type, freq, q) => { const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true; s.playbackRate.value = 0.7 + Math.random() * 0.5; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ctx.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(out); s.start(); return { f, g }; };
  SND.waves = loop('lowpass', 420, 0.5); SND.wind = loop('bandpass', 600, 0.7); SND.rain = loop('highpass', 2500, 0.3); SND.flap = loop('bandpass', 1400, 1.2);
  const eng = ctx.createOscillator(); eng.type = 'sawtooth'; eng.frequency.value = 42; const ef = ctx.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 160; const eg = ctx.createGain(); eg.gain.value = 0; eng.connect(ef); ef.connect(eg); eg.connect(out); eng.start(); SND.engine = eg;
}
function updateSound(t) {
  if (!SND.ctx) return;
  const swell = 0.5 + 0.5 * Math.sin(t * 0.55) * Math.sin(t * 0.21 + 1);
  SND.waves.g.gain.value = (0.12 + SEA.strength * 0.25) * (0.6 + swell * 0.6);
  SND.waves.f.frequency.value = 300 + swell * 400;
  SND.wind.g.gain.value = CFG.wind / 70 * 0.28 * (0.7 + 0.3 * Math.sin(t * 0.9));
  SND.wind.f.frequency.value = 400 + CFG.wind * 12;
  SND.rain.g.gain.value = CFG.rain / 100 * 0.25;
  const flap = CFG.tied || CFG.wallType === 'wood' ? 0 : CFG.wind / 70;
  SND.flap.g.gain.value = flap * 0.3 * Math.max(0, Math.sin(t * (6 + CFG.wind * 0.1)));
  SND.engine.gain.value = CFG.boat === 'sailing' ? 0.05 : 0;
}

// ---- cameras
function sukkahWorldCenter(out) { const H = CFG.h / 100; return SUK.root.localToWorld(out.set(0, H * 0.55, 0)); }
function frameOrbit() {
  sukkahWorldCenter(controls.target);
  const off = new THREE.Vector3(-5.5, 3.2, -6.5).multiplyScalar(0.8 + Math.max(CFG.w, CFG.d) / 400);
  camera.position.copy(controls.target).add(off);
}
function setCam(mode) {
  camMode = mode; document.querySelectorAll('#cam button').forEach((b) => b.classList.toggle('on', b.dataset.c === mode));
  controls.enabled = mode === 'orbit' || mode === 'sea';
  if (mode === 'orbit') frameOrbit();
  if (mode === 'sea') { controls.target.set(0, 3, 0); camera.position.set(-38, 7, -26); }
  if (mode === 'inside') { LOOK.yaw = 0; LOOK.pitch = 0.35; }
  if (mode === 'deck') { LOOK.yaw = Math.PI * 1.25; LOOK.pitch = 0.05; }
  $('hint').textContent = tr(HINTS[mode]);
  $('hud-walk').hidden = $('where').hidden = mode !== 'deck';
}
const _prevT = new THREE.Vector3();
function updateCamera(dt) {
  if (camMode === 'orbit') {
    // follow the sukkah as the ship rocks
    _prevT.copy(controls.target); sukkahWorldCenter(tmpV);
    controls.target.lerp(tmpV, 1 - Math.exp(-dt * 4)); camera.position.add(tmpV2.subVectors(controls.target, _prevT));
    controls.update();
  } else if (camMode === 'sea') { controls.update(); camera.position.y = Math.max(camera.position.y, 1.5); }
  else {
    // first person, riding with the ship
    let local;
    if (camMode === 'inside') local = SUK.root.localToWorld(tmpV.set(0, Math.min(1.05, CFG.h / 100 - 0.12), (CFG.d / 100) * 0.28));
    else {
      updateWalk(dt);
      local = BOAT.root.localToWorld(walkCameraLocal(tmpV));
    }
    camera.position.copy(local);
    tmpQ.setFromEuler(tmpE.set(LOOK.pitch, LOOK.yaw, 0, 'YXZ'));
    camera.quaternion.copy(BOAT.root.quaternion).multiply(tmpQ);
  }
}
const KEYS = {};
addEventListener('keydown', (e) => { if ((e.target.tagName === 'INPUT' && e.target.type !== 'range' && e.target.type !== 'checkbox') || e.target.tagName === 'SELECT') return; KEYS[e.code] = true; if (camMode === 'deck' && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) { e.preventDefault(); if (e.target.blur) e.target.blur(); } });
addEventListener('keyup', (e) => { KEYS[e.code] = false; });
canvas.addEventListener('pointerdown', (e) => { audioInit(); if (camMode === 'inside' || camMode === 'deck') { LOOK.drag = true; canvas.setPointerCapture(e.pointerId); } });
canvas.addEventListener('pointerup', () => { LOOK.drag = false; });
canvas.addEventListener('pointermove', (e) => { if (!LOOK.drag) return; LOOK.yaw -= e.movementX * 0.004; LOOK.pitch = clamp(LOOK.pitch - e.movementY * 0.004, -1.2, 1.4); });
document.addEventListener('click', () => audioInit(), { once: true });

function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
  if (!composer) return;
  composer.setSize(w, h); fxaaPass.material.uniforms.resolution.value.set(1 / (w * renderer.getPixelRatio()), 1 / (h * renderer.getPixelRatio()));
}
addEventListener('resize', onResize);

async function boot() {
  try { const s = JSON.parse(store.get('cfg')); if (s) Object.assign(CFG, s); } catch (e) {}
  document.documentElement.dir = HE() ? 'rtl' : 'ltr';
  await loadStep(0.05, tt('Mixing the paint', 'מערבבים צבע'));
  await buildTextures();
  buildSky();
  sunLight.shadow.camera.left = -14; sunLight.shadow.camera.right = 14; sunLight.shadow.camera.top = 14; sunLight.shadow.camera.bottom = -14;
  sunLight.target.position.set(0, 2, 2);
  await loadStep(0.4, tt('Filling the Mediterranean', 'ממלאים את הים התיכון'));
  buildOcean(); buildCoast(); setSeaState(CFG.wind, CFG.boat === 'sailing');
  await loadStep(0.6, tt('Launching the ferry', 'משיקים את המעבורת'));
  sukkahMaterials();
  buildBoat();
  await loadStep(0.75, tt('Parking the pickup', 'מחנים את הטנדר'));
  buildSukkah();
  buildRain(); buildGulls();
  buildPost();
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.minDistance = 2; controls.maxDistance = 90; controls.maxPolarAngle = Math.PI * 0.49;
  buildControls();
  $('lang').onclick = toggleLang;
  applyLang();
  $('cam').querySelectorAll('button').forEach((b) => b.onclick = () => setCam(b.dataset.c));
  SKY.time = CFG.hour; updateSky(0);
  setCam('orbit');
  renderHalacha();
  await loadStep(1, tt('Chag sameach', 'חג שמח'));
  $('loading').hidden = true;
  requestAnimationFrame(loop);
}
function frame(dt) {
  U.time.value += dt; const t = U.time.value;
  SKY.time = damp(SKY.time, CFG.hour, 3, dt);
  U.wind.value = CFG.wind / 25 * (0.7 + 0.3 * Math.sin(t * 0.4));
  if (CFG.boat === 'sailing') SEA.flow.y -= dt * 6;
  updateSky(dt);
  updateBoat(dt, t);
  // an unstrapped frame shudders and leans as the ship rolls
  if (SUK.root) {
    const loose = CFG.strapped ? 0 : 1;
    const k = loose * (0.3 + CFG.wind / 40);
    SUK.root.rotation.z = damp(SUK.root.rotation.z, BOAT.roll * 1.5 * loose + Math.sin(t * 5.3) * 0.006 * k, 6, dt);
    SUK.root.rotation.x = damp(SUK.root.rotation.x, BOAT.pitch * loose + Math.sin(t * 4.1) * 0.005 * k, 6, dt);
    if (CFG.driving && CFG.vehicle !== 'deck') SUK.vehicle.position.y = BOAT.deckY + Math.sin(t * 17) * 0.004;
  }
  updateWallMotion(dt);
  if (SUK.pendants) for (const p of SUK.pendants) { p.piv.rotation.x = Math.sin(t * 1.6 + p.ph) * 0.08 * U.wind.value - BOAT.pitch; p.piv.rotation.z = Math.sin(t * 1.1 + p.ph) * 0.06 * U.wind.value - BOAT.roll; }
  const dusk = SKY.nightK;
  M.bulb.emissiveIntensity = 0.1 + dusk * 3.5;
  for (const l of SUK.lights) { l.intensity = dusk * 1.1; l.visible = dusk > 0.05; }
  updateRain(dt); updateGulls(t);
  updateCamera(dt);
  updateSound(t);
  bloomPass.strength = 0.16 + SKY.nightK * 0.3; bloomPass.threshold = lerp(2.2, 1.35, SKY.nightK);
}
function loop() { requestAnimationFrame(loop); frame(Math.min(0.05, clock.getDelta())); composer.render(); }

// debug handle for testing from the console
window.SEA_SIM = { THREE, scene, camera, renderer, CFG, SUK, SKY, BOAT, WALK, KEYS, LOOK, toggleLang, updateWalk, applyPreset, evaluateHalacha, setCam, frame, get composer() { return composer; },
  tick(n = 30) { for (let i = 0; i < n; i++) frame(1 / 30); },
  shot(n = 'shot') { composer.render(); return fetch('/__shot?n=' + n, { method: 'POST', body: renderer.domElement.toDataURL('image/jpeg', 0.85) }).then((r) => r.text()); },
  ready() { return new Promise((r) => { const i = setInterval(() => { if ($('loading').hidden) { clearInterval(i); r(); } }, 200); }); } };

boot().catch((e) => { console.error(e); $('lstep').textContent = 'Something went wrong: ' + e.message; });
