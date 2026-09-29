// ---------------------------------------------------------------- sky, sun & (full) moon over Jerusalem
const SKY = {
  time: 14.5,           // hours, local
  rate: 1 / 100,        // game hours per real second
  maxTime: 17.75,       // story clamps time until the evening chapter
  dayK: 1, nightK: 0, low: 0,
  moonDir: new THREE.Vector3(),
  envTimer: 99, lastEnvSun: new THREE.Vector3(),
};
let sky, skyEnv, skyScene, sunLight, hemi, pmrem, envRT = null;

function patchSkyShader(mat, sunVis) {
  mat.uniforms.skyGain = { value: 1 };
  mat.uniforms.sunDiskVis = { value: sunVis };
  mat.uniforms.nightK = { value: 0 };
  mat.uniforms.fogCol = { value: new THREE.Color() };
  mat.uniforms.horizonFog = { value: 0.7 };
  mat.uniforms.moonDir = { value: SKY.moonDir };
  mat.uniforms.uT = U.time;
  mat.fragmentShader = `uniform float skyGain; uniform float sunDiskVis; uniform float nightK; uniform vec3 fogCol; uniform float horizonFog; uniform vec3 moonDir; uniform float uT;
float hash13(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
` + mat.fragmentShader
    .replace('L0 += ( vSunE * 19000.0 * Fex ) * sundisk;', 'L0 += ( vSunE * 19000.0 * Fex ) * sundisk * sunDiskVis;')
    .replace('vec3 retColor = pow( texColor, vec3( 1.0 / ( 1.2 + ( 1.2 * vSunfade ) ) ) );', 'vec3 retColor = pow( texColor, vec3( 0.9 ) );')
    .replace('gl_FragColor = vec4( retColor, 1.0 );', /* glsl */`
      retColor *= skyGain;
      float up01 = clamp(direction.y, 0.0, 1.0);
      vec3 night = mix(vec3(0.030, 0.040, 0.075), vec3(0.006, 0.010, 0.026), pow(up01, 0.5));
      vec3 q = direction * 380.0; vec3 cid = floor(q); float h = hash13(cid);
      float star = 0.0;
      if (h > 0.9962) { vec3 f = fract(q) - 0.5; star = smoothstep(0.3, 0.0, length(f)) * (h - 0.9962) / 0.0038; star *= 0.65 + 0.35 * sin(uT * (2.0 + h * 5.0) + h * 91.0); }
      // city light pollution washes out faint stars near the horizon
      star *= smoothstep(0.08, 0.5, direction.y) * 0.6;
      night += vec3(0.9, 0.93, 1.0) * star * 1.6;
      night += vec3(0.16, 0.10, 0.05) * (1.0 - smoothstep(0.0, 0.3, direction.y)) * 0.45;
      float md = dot(direction, moonDir);
      float disc = smoothstep(0.99985, 0.99989, md);
      float maria = 0.8 + 0.2 * sin(direction.x * 1900.0) * sin(direction.z * 1700.0 + direction.y * 1300.0);
      night += vec3(1.0, 0.97, 0.88) * disc * 6.0 * maria;
      night += vec3(0.35, 0.42, 0.6) * pow(max(md, 0.0), 80.0) * 0.25;
      retColor += night * nightK;
      retColor = mix(retColor, fogCol, horizonFog * (1.0 - smoothstep(-0.02, 0.12, direction.y)));
      gl_FragColor = vec4( retColor, 1.0 );`);
}

function buildSky() {
  sky = new Sky(); sky.scale.setScalar(8000);
  const su = sky.material.uniforms;
  su.turbidity.value = 4.5; su.rayleigh.value = 1.6; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.84;
  patchSkyShader(sky.material, 1);
  sky.material.fog = false;
  scene.add(sky);

  skyScene = new THREE.Scene();
  skyEnv = new Sky(); skyEnv.scale.setScalar(8000);
  skyEnv.material.uniforms = Object.assign({}, su);
  patchSkyShader(skyEnv.material, 0);
  for (const k of ['skyGain', 'nightK', 'fogCol']) skyEnv.material.uniforms[k] = su[k];
  skyEnv.material.uniforms.horizonFog = { value: 0.5 };
  skyScene.add(skyEnv);
  // warm stone "ground" so the env map gets a bounce from below, like a stone courtyard
  const ground = new THREE.Mesh(new THREE.SphereGeometry(4000, 32, 16, 0, TAU, Math.PI / 2 + 0.02, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x6d5c47, side: THREE.BackSide }));
  ground.name = 'envGround';
  skyScene.add(ground);
  pmrem = new THREE.PMREMGenerator(renderer);

  sunLight = new THREE.DirectionalLight(0xffffff, 3);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(Q.shadow, Q.shadow);
  const S = 28, sc = sunLight.shadow.camera;
  sc.left = -S; sc.right = S; sc.top = S; sc.bottom = -S; sc.near = 1; sc.far = 160;
  sunLight.shadow.bias = -0.0002; sunLight.shadow.normalBias = 0.025;
  sunLight.shadow.radius = 3; sunLight.shadow.blurSamples = 12;
  sunLight.target.position.set(3, 0, 1.5);
  scene.add(sunLight, sunLight.target);

  hemi = new THREE.HemisphereLight(0xbfd6ff, 0x8a7258, 0.3);
  scene.add(hemi);
}

// Jerusalem ~31.8N, early autumn (declination ~ -3 deg), IDT (solar noon ~12:38)
function sunDirection(hours, out) {
  const lat = 31.78 * DEG, dec = -3.0 * DEG;
  const H = (hours - 12.63) * 15 * DEG;
  const el = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat)); // from south, +west
  // x = east, -z = north
  out.set(-Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  return out;
}

const _sunCol = new THREE.Color(), _fog = new THREE.Color(), _moonCol = new THREE.Color(0.62, 0.72, 1.0);
function updateSky(dt) {
  const sd = sunDirection(SKY.time, U.sunDir.value);
  // 15 Tishrei: full moon, opposite the sun, a little south
  sunDirection(SKY.time - 12.1, SKY.moonDir); SKY.moonDir.y = SKY.moonDir.y * 0.95 + 0.02; SKY.moonDir.normalize();
  const el = sd.y;
  SKY.dayK = smooth(-0.1, 0.06, el);
  SKY.nightK = 1 - smooth(-0.2, -0.02, el);
  SKY.low = 1 - smooth(0.05, 0.4, el);

  const su = sky.material.uniforms;
  su.sunPosition.value.copy(sd).multiplyScalar(1000);
  skyEnv.material.uniforms.sunPosition.value.copy(su.sunPosition.value);
  su.rayleigh.value = lerp(1.6, 2.8, SKY.low);
  su.turbidity.value = lerp(4.5, 7.5, SKY.low);
  su.skyGain.value = lerp(0.02, 1.0, SKY.dayK);
  su.nightK.value = SKY.nightK;

  // sun colour: warm towards the horizon, deep amber at sunset
  const warm = SKY.low;
  _sunCol.setRGB(1.0, lerp(0.96, 0.62, warm), lerp(0.9, 0.34, warm));
  const moonUp = smooth(-0.02, 0.15, SKY.moonDir.y);
  if (el > -0.02) {
    sunLight.position.copy(sd).multiplyScalar(80).add(sunLight.target.position);
    sunLight.color.copy(_sunCol);
    sunLight.intensity = 4.6 * smooth(-0.02, 0.1, el) * (1 - warm * 0.2);
  } else {
    // moonlight takes over the same shadow light
    sunLight.position.copy(SKY.moonDir).multiplyScalar(80).add(sunLight.target.position);
    sunLight.color.copy(_moonCol);
    sunLight.intensity = 0.55 * moonUp * SKY.nightK;
  }
  hemi.intensity = lerp(0.14, 0.22, SKY.dayK);
  hemi.color.setRGB(lerp(0.35, 0.75, SKY.dayK), lerp(0.4, 0.84, SKY.dayK), lerp(0.7, 1.0, SKY.dayK));
  hemi.groundColor.setRGB(lerp(0.12, 0.55, SKY.dayK) * lerp(1, 1.1, warm), lerp(0.1, 0.45, SKY.dayK), lerp(0.08, 0.34, SKY.dayK));

  // fog/horizon haze
  _fog.setRGB(lerp(0.035, lerp(0.82, 0.95, warm), SKY.dayK), lerp(0.04, lerp(0.8, 0.66, warm), SKY.dayK), lerp(0.07, lerp(0.78, 0.5, warm), SKY.dayK));
  scene.fog.color.copy(_fog);
  su.fogCol.value.copy(_fog);
  scene.environmentIntensity = lerp(0.45, 0.55, SKY.dayK);
  renderer.toneMappingExposure = lerp(1.55, 0.74, SKY.dayK) * (1 + SKY.low * SKY.dayK * 0.15);

  // refresh image-based lighting when the sun has moved
  SKY.envTimer += dt;
  if (SKY.envTimer > 1.0 && (SKY.lastEnvSun.distanceToSquared(sd) > 0.00025 || !envRT)) {
    SKY.envTimer = 0; SKY.lastEnvSun.copy(sd);
    skyScene.getObjectByName('envGround').material.color.setRGB(lerp(0.03, 0.42, SKY.dayK), lerp(0.028, 0.35, SKY.dayK), lerp(0.03, 0.27, SKY.dayK));
    const old = envRT;
    envRT = pmrem.fromScene(skyScene, 0, 1, 9000);
    scene.environment = envRT.texture;
    if (old) old.dispose();
  }
}
function clockText(h) { const hh = Math.floor(h) % 24, mm = Math.floor((h % 1) * 60); return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); }
