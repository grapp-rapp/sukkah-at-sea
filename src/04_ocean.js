// ---------------------------------------------------------------- open sea: Gerstner waves (GPU + matching CPU sampler for the boat)
const SEA = { mesh: null, far: null, mat: null, flow: new THREE.Vector2(), waves: [], strength: 0.5, speed: 0 };
// [dirX, dirZ, steepness, wavelength]; the wind blows from the west (off the sea), so waves travel east (+x)
const WAVE_BASE = [
  [1.0, 0.25, 0.16, 62], [0.85, -0.5, 0.13, 37], [0.95, 0.55, 0.12, 21], [0.6, -0.8, 0.09, 11], [1.0, 0.1, 0.07, 6.5],
];
const SEA_U = {
  uWaves: { value: WAVE_BASE.map(() => new THREE.Vector4()) },
  uBoatInv: { value: new THREE.Matrix4() },
  uFlow: { value: SEA.flow }, uFoam: { value: 0.3 }, uSail: { value: 0 }, uTime: U.time,
};
function setSeaState(windKmh, sailing) {
  const k = clamp(windKmh / 45, 0.08, 1.15);
  SEA.strength = k;
  WAVE_BASE.forEach((w, i) => {
    const d = new THREE.Vector2(w[0], w[1]).normalize();
    SEA_U.uWaves.value[i].set(d.x, d.y, w[2] * (i < 2 ? k * k * 0.55 + 0.04 : k * 0.7 + 0.05), w[3] * (0.55 + 0.35 * k));
  });
  SEA_U.uFoam.value = smooth(20, 60, windKmh);
  SEA_U.uSail.value = sailing ? 1 : 0;
}
// CPU height of the sea surface at (x,z) — matches the shader closely enough to float a boat
function seaHeight(x, z, t) {
  let y = 0;
  const px = x + SEA.flow.x, pz = z + SEA.flow.y;
  for (const w of SEA_U.uWaves.value) {
    const k = TAU / w.w, c = Math.sqrt(9.8 / k), a = w.z / k;
    const f = k * (w.x * px + w.y * pz - c * t);
    y += a * Math.sin(f);
  }
  return y;
}

function makeRippleNormal() {
  // tileable ripple normal map (small capillary waves)
  const set = genPBR(256, 256, (u, v) => {
    const h = fbm(noiseA, u * 8, v * 8, 4) * 0.6 + fbm(noiseB, u * 16 + 3, v * 16, 3) * 0.4;
    return { h, r: 0, g: 0, b: 0, ro: 0.1 };
  }, 4.0);
  const n = set.normalMap; n.wrapS = n.wrapT = THREE.RepeatWrapping;
  return n;
}

function buildOcean() {
  const ripple = makeRippleNormal();
  const mat = new THREE.MeshStandardMaterial({ color: 0x0b3346, roughness: 0.07, metalness: 0.0, normalMap: ripple, normalScale: new THREE.Vector2(0.35, 0.35), envMapIntensity: 1.1 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, SEA_U);
    sh.vertexShader = `uniform vec4 uWaves[5]; uniform vec2 uFlow; uniform float uTime; varying vec3 vSeaW; varying float vCrest;
      vec3 gerstner(vec4 w, vec2 p, inout vec3 tan, inout vec3 bin) {
        float k = 6.2831853 / w.w; float c = sqrt(9.8 / k); vec2 d = w.xy; float s = w.z;
        float f = k * (dot(d, p) - c * uTime); float a = s / k;
        tan += vec3(-d.x * d.x * s * sin(f), d.x * s * cos(f), -d.x * d.y * s * sin(f));
        bin += vec3(-d.x * d.y * s * sin(f), d.y * s * cos(f), -d.y * d.y * s * sin(f));
        return vec3(d.x * a * cos(f), a * sin(f), d.y * a * cos(f));
      }
` + sh.vertexShader
      .replace('#include <beginnormal_vertex>', `
        vec4 wp0 = modelMatrix * vec4(position, 1.0);
        float edge = 1.0 - smoothstep(420.0, 580.0, length(wp0.xz));
        vec2 pp = wp0.xz + uFlow;
        vec3 tan = vec3(1.0, 0.0, 0.0), bin = vec3(0.0, 0.0, 1.0), disp = vec3(0.0);
        for (int i = 0; i < 5; i++) disp += gerstner(uWaves[i], pp, tan, bin);
        disp *= edge; tan = mix(vec3(1.0, 0.0, 0.0), tan, edge); bin = mix(vec3(0.0, 0.0, 1.0), bin, edge);
        vec3 objectNormal = normalize(cross(bin, tan));
        vCrest = disp.y;
        #ifdef USE_TANGENT
          vec3 objectTangent = tan;
        #endif`)
      .replace('#include <begin_vertex>', `vec3 transformed = position + disp;`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vSeaW = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    sh.fragmentShader = `uniform float uFoam, uSail, uTime; uniform vec2 uFlow; uniform mat4 uBoatInv; varying vec3 vSeaW; varying float vCrest;
      float hullW(float z){ if (z < -17.0 || z > 17.0) return 0.0; if (z < -9.0) return 4.6 * pow(sin((z + 17.0) / 8.0 * 1.5708), 0.8); return 4.6; }
      float sh12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      float svn(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f); return mix(mix(sh12(i), sh12(i+vec2(1,0)), u.x), mix(sh12(i+vec2(0,1)), sh12(i+vec2(1,1)), u.x), u.y); }
      float foamN(vec2 p){ return svn(p) * 0.6 + svn(p * 2.3 + 7.1) * 0.4; }
` + sh.fragmentShader
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        vec3 inBoat = (uBoatInv * vec4(vSeaW, 1.0)).xyz;
        if (abs(inBoat.x) < hullW(inBoat.z) - 0.1 && inBoat.y < 2.0) discard;`)
      .replace('#include <normal_fragment_maps>', `
        #ifdef USE_NORMALMAP
          vec2 ruv = (vSeaW.xz + uFlow) * 0.045 + vec2(uTime * 0.012, uTime * 0.007);
          vec2 ruv2 = (vSeaW.xz + uFlow) * 0.11 - vec2(uTime * 0.02, -uTime * 0.013);
          vec3 mapN = (texture2D(normalMap, ruv).xyz * 2.0 - 1.0) + (texture2D(normalMap, ruv2).xyz * 2.0 - 1.0);
          mapN.xy *= normalScale; mapN = normalize(mapN);
          normal = normalize(tbn * mapN);
        #endif`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        // light scattering through the crests + whitecaps + wake
        float crest = smoothstep(0.2, 1.6, vCrest);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.06, 0.34, 0.36), crest * 0.55);
        vec2 fp = vSeaW.xz + uFlow;
        float fn = foamN(fp * 0.35 + uTime * 0.05);
        float fn2 = foamN(fp * 1.7 - uTime * 0.08);
        float caps = smoothstep(0.72, 1.0, crest * 0.75 + fn * 0.35 + fn2 * 0.2) * uFoam * 0.85;
        // hull wake: V behind the stern (boat heads north, stern at z = +22) and bow spray
        float wz = vSeaW.z - 21.0; float half_ = 5.6 + max(wz, 0.0) * 0.32;
        float wake = uSail * step(0.0, wz) * smoothstep(half_, half_ * 0.55, abs(vSeaW.x)) * exp(-wz * 0.012) * smoothstep(0.35, 0.75, foamN(fp * 0.6 + vec2(0.0, uTime * 0.4)));
        float hull = smoothstep(7.4, 6.0, length(vec2(vSeaW.x, (vSeaW.z + 2.0) * 0.25))) * (0.3 + uSail * 0.6) * smoothstep(0.45, 0.85, foamN(fp * 1.3 + uTime * 0.6));
        float foam = clamp(caps + wake + hull, 0.0, 1.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.95, 0.96), foam);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.85, foam);`);
  };
  SEA.mat = mat;
  const geo = new THREE.PlaneGeometry(1200, 1200, MOBILE ? 170 : 300, MOBILE ? 170 : 300); geo.rotateX(-Math.PI / 2);
  // denser in the middle where the boat is: squash vertices toward the centre
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) / 600, z = p.getZ(i) / 600; const r = Math.max(Math.abs(x), Math.abs(z)); const s = r > 0 ? Math.pow(r, 1.7) / r : 0; p.setX(i, x * s * 600); p.setZ(i, z * s * 600); }
  geo.computeBoundingSphere();
  const sea = new THREE.Mesh(geo, mat); sea.receiveShadow = true; sea.frustumCulled = false; scene.add(sea); SEA.mesh = sea;
  // far water to the horizon (flat, same material) — a frame around the near patch
  const far = new THREE.Group(); scene.add(far); SEA.far = far;
  for (const [x, z, w, d] of [[0, -3300, 7200, 6000], [0, 3300, 7200, 6000], [-3300, 0, 6000, 1200], [3300, 0, 6000, 1200]]) {
    const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, mat); m.position.set(x, -0.05, z); m.receiveShadow = false; far.add(m);
  }
}

// ---- the coast of Tel Aviv–Jaffa on the eastern horizon
function buildCoast() {
  const R = mulberry32(8);
  const g = new THREE.Group(); scene.add(g);
  const mat = new THREE.MeshStandardMaterial({ color: 0xcfc7b8, roughness: 0.9 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x8aa0b0, roughness: 0.2, metalness: 0.6, emissive: 0xffc27a, emissiveIntensity: 0 });
  const box = new THREE.BoxGeometry(1, 1, 1);
  const N = 170;
  const a = new THREE.InstancedMesh(box, mat, N), b = new THREE.InstancedMesh(box, glass, 40);
  let bi = 0;
  for (let i = 0; i < N; i++) {
    const z = -1800 + R() * 3600, x = 2600 + R() * 500 + Math.abs(z) * 0.08;
    const tower = R() < 0.18 && Math.abs(z) < 900;
    const h = tower ? 90 + R() * 150 : 12 + R() * 35;
    tmpM.compose(tmpV.set(x, h / 2, z), tmpQ.identity(), tmpS.set(20 + R() * 40, h, 20 + R() * 40));
    if (tower && bi < 40) { b.setMatrixAt(bi++, tmpM); } else a.setMatrixAt(i, tmpM);
  }
  b.count = bi;
  g.add(a, b); COAST.glass = glass;
  // sandy beach + low ridge
  const beach = new THREE.Mesh(new THREE.BoxGeometry(160, 6, 5000), new THREE.MeshStandardMaterial({ color: 0xd8c7a2, roughness: 1 })); beach.position.set(2520, 1, 0); g.add(beach);
  const hills = new THREE.Mesh(new THREE.BoxGeometry(900, 40, 6000), new THREE.MeshStandardMaterial({ color: 0x9aa088, roughness: 1 })); hills.position.set(3500, 10, 0); g.add(hills);
}
const COAST = { glass: null };
