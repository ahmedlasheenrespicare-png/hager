/* ============================================================
   فلوج هاجر — 12s vertical TikTok-style 3D vlog
   Choreography: walk forward -> turn to camera -> energetic
   smile + signature hands-near-chin pose. Handheld shake.
   Deterministic renderFrame(t) for offline frame capture.
   ============================================================ */
import * as THREE from "three";

const params = new URLSearchParams(location.search);
const CAPTURE = params.has("capture");
const W = parseInt(params.get("w") || "720", 10);
const H = parseInt(params.get("h") || "1280", 10);
export const FPS = 30;
export const DUR = 12;

if (CAPTURE) document.body.classList.add("capture");

/* ---------------- Renderer / Scene / Camera ---------------- */
const phone = document.getElementById("phone");
const canvas = document.getElementById("stage");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

function sizeRenderer() {
  const w = CAPTURE ? W : phone.clientWidth;
  const h = CAPTURE ? H : phone.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf2d8c4, 14, 34);

const camera = new THREE.PerspectiveCamera(36, 9 / 16, 0.1, 100);

/* ---------------- Palette / textures / materials ---------------- */
const C = {
  hijab: 0xe3d2b8, hijabDeep: 0xd8c5a8, skin: 0xf5cbaa, skinSoft: 0xeec09e,
  cardigan: 0x7e2f40, cardiganDeep: 0x6d2737, top: 0xf7f2e9, pants: 0xe7d8bf,
  shoe: 0xf6f3ee, belt: 0x271c17, lips: 0xc96f5e, lipsLine: 0xa4543f,
  brow: 0x3a2a20, iris: 0x6b452a, blush: 0xf09a80, gold: 0xd8b25a,
  silver: 0xd6d9de, wood: 0x9a7350,
};

function makeCanvas(w, h, draw) {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  draw(cv.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
function gradientBackground(top, bottom) {
  return makeCanvas(32, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}
const marbleTex = makeCanvas(512, 512, (ctx, w, h) => {
  ctx.fillStyle = "#f7f2ea"; ctx.fillRect(0, 0, w, h);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 22; i++) {
    ctx.strokeStyle = `rgba(178,168,158,${0.08 + rnd() * 0.18})`;
    ctx.lineWidth = 0.6 + rnd() * 2.2;
    ctx.beginPath();
    let x = rnd() * w, y = rnd() * h;
    ctx.moveTo(x, y);
    for (let s = 0; s < 5; s++) {
      const nx = x + (rnd() - 0.5) * 220, ny = y + (rnd() - 0.5) * 220;
      ctx.quadraticCurveTo(x + (rnd() - 0.5) * 120, y + (rnd() - 0.5) * 120, nx, ny);
      x = nx; y = ny;
    }
    ctx.stroke();
  }
});
const knitBump = makeCanvas(128, 128, (ctx, w, h) => {
  ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 16) for (let y = 0; y < h; y += 12) {
    ctx.strokeStyle = "#9c9c9c"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + 2, y); ctx.lineTo(x + 8, y + 9); ctx.lineTo(x + 14, y); ctx.stroke();
    ctx.strokeStyle = "#6a6a6a"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x + 2, y + 3); ctx.lineTo(x + 8, y + 12); ctx.lineTo(x + 14, y + 3); ctx.stroke();
  }
});
knitBump.colorSpace = THREE.NoColorSpace;
knitBump.wrapS = knitBump.wrapT = THREE.RepeatWrapping;
knitBump.repeat.set(7, 4);
const ribBump = makeCanvas(64, 64, (ctx, w, h) => {
  for (let x = 0; x < w; x += 8) { ctx.fillStyle = x % 16 === 0 ? "#8c8c8c" : "#747474"; ctx.fillRect(x, 0, 8, h); }
});
ribBump.colorSpace = THREE.NoColorSpace;
ribBump.wrapS = ribBump.wrapT = THREE.RepeatWrapping;
ribBump.repeat.set(10, 1);
const bokehSprite = makeCanvas(128, 128, (ctx) => {
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
});
const plaqueTex = makeCanvas(512, 160, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "#e9cd82"); g.addColorStop(0.35, "#c9a24b");
  g.addColorStop(0.65, "#f2dfa6"); g.addColorStop(1, "#b8912f");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(90,60,20,0.55)"; ctx.lineWidth = 6; ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.fillStyle = "#4a2f14";
  ctx.font = "italic 700 78px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("Hager", w / 2, h / 2 + 6);
});

const M = {
  skin: new THREE.MeshStandardMaterial({ color: C.skin, roughness: 0.62 }),
  skinSoft: new THREE.MeshStandardMaterial({ color: C.skinSoft, roughness: 0.62 }),
  hijab: new THREE.MeshPhysicalMaterial({ color: C.hijab, roughness: 0.88, sheen: 0.6, sheenColor: new THREE.Color(0xfff2dd) }),
  hijabDeep: new THREE.MeshPhysicalMaterial({ color: C.hijabDeep, roughness: 0.9, sheen: 0.5, sheenColor: new THREE.Color(0xfff2dd) }),
  cardigan: new THREE.MeshPhysicalMaterial({ color: C.cardigan, roughness: 0.95, sheen: 0.4, sheenColor: new THREE.Color(0xb06070), bumpMap: knitBump, bumpScale: 0.6, side: THREE.DoubleSide }),
  cardiganSolid: new THREE.MeshStandardMaterial({ color: C.cardigan, roughness: 0.95, bumpMap: knitBump, bumpScale: 0.6 }),
  cardiganDeep: new THREE.MeshStandardMaterial({ color: C.cardiganDeep, roughness: 0.95, bumpMap: knitBump, bumpScale: 0.6 }),
  top: new THREE.MeshStandardMaterial({ color: C.top, roughness: 0.85, bumpMap: ribBump, bumpScale: 0.35 }),
  pants: new THREE.MeshStandardMaterial({ color: C.pants, roughness: 0.88 }),
  shoe: new THREE.MeshStandardMaterial({ color: C.shoe, roughness: 0.5 }),
  belt: new THREE.MeshStandardMaterial({ color: C.belt, roughness: 0.45 }),
  gold: new THREE.MeshStandardMaterial({ color: C.gold, metalness: 1, roughness: 0.28 }),
  silver: new THREE.MeshStandardMaterial({ color: C.silver, metalness: 1, roughness: 0.25 }),
  marble: new THREE.MeshPhysicalMaterial({ map: marbleTex, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
  eyeWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 }),
  iris: new THREE.MeshStandardMaterial({ color: C.iris, roughness: 0.3 }),
  pupil: new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.2 }),
  glint: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  dark: new THREE.MeshStandardMaterial({ color: C.brow, roughness: 0.6 }),
  lips: new THREE.MeshStandardMaterial({ color: C.lips, roughness: 0.45 }),
  lipsLine: new THREE.MeshStandardMaterial({ color: C.lipsLine, roughness: 0.5 }),
  blush: new THREE.MeshStandardMaterial({ color: C.blush, roughness: 1, transparent: true, opacity: 0.55 }),
  wood: new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.8 }),
};

function mesh(geo, material, parent, pos, rot, scale) {
  const m = new THREE.Mesh(geo, material);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  if (scale) m.scale.set(...scale);
  if (parent) parent.add(m);
  return m;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
function limb(parent, a, b, r, material) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.02, len), 6, 16), material);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  parent.add(m);
  return m;
}
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

/* ---------------- Lights ---------------- */
scene.add(new THREE.HemisphereLight(0xfff3e4, 0xd9a68f, 0.85));
const key = new THREE.DirectionalLight(0xffe9d2, 2.4);
key.position.set(4.5, 7.5, 5.5);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -8; key.shadow.camera.right = 8;
key.shadow.camera.top = 10; key.shadow.camera.bottom = -5;
key.shadow.camera.near = 1; key.shadow.camera.far = 30;
key.shadow.bias = -0.0005;
key.target.position.set(0, 1.5, -2);
scene.add(key, key.target);
const rim = new THREE.DirectionalLight(0xffd2b8, 1.1);
rim.position.set(-5, 4.5, -5);
scene.add(rim);
const fill = new THREE.DirectionalLight(0xffffff, 0.45);
fill.position.set(-3, 2.5, 6);
scene.add(fill);

/* ---------------- Environment ---------------- */
scene.background = gradientBackground("#f6ddc9", "#fdf3e7");

/* procedural warm studio environment -> real reflections on metals */
const envTex = makeCanvas(256, 128, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#fff6e8"); g.addColorStop(0.5, "#f3d9c8"); g.addColorStop(1, "#c9a08c");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const r = ctx.createRadialGradient(180, 30, 2, 180, 30, 46);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = r; ctx.fillRect(0, 0, w, h);
  const r2 = ctx.createRadialGradient(60, 50, 2, 60, 50, 30);
  r2.addColorStop(0, "rgba(255,230,200,0.8)"); r2.addColorStop(1, "rgba(255,230,200,0)");
  ctx.fillStyle = r2; ctx.fillRect(0, 0, w, h);
});
envTex.mapping = THREE.EquirectangularReflectionMapping;
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromEquirectangular(envTex).texture;
scene.environmentIntensity = 0.55;
pmrem.dispose();
const floor = mesh(new THREE.CircleGeometry(40, 64), new THREE.MeshStandardMaterial({ color: 0xe9cdb9, roughness: 0.95 }), scene, [0, 0, 0], [-Math.PI / 2, 0, 0]);
floor.receiveShadow = true;

/* pedestal + easel stay in the background (she walks away from them) */
const PED_H = 0.55;
const pedestal = new THREE.Group();
pedestal.position.set(0.4, 0, -7.5);
scene.add(pedestal);
mesh(new THREE.CylinderGeometry(1.45, 1.58, PED_H, 48), M.marble, pedestal, [0, PED_H / 2, 0]);
mesh(new THREE.TorusGeometry(1.455, 0.035, 10, 56), M.gold, pedestal, [0, PED_H - 0.02, 0], [Math.PI / 2, 0, 0]);
mesh(new THREE.TorusGeometry(1.565, 0.035, 10, 56), M.gold, pedestal, [0, 0.045, 0], [Math.PI / 2, 0, 0]);
mesh(new THREE.BoxGeometry(0.92, 0.28, 0.06), new THREE.MeshStandardMaterial({ map: plaqueTex, metalness: 0.55, roughness: 0.4 }), pedestal, [0, 0.27, 1.5], [-0.06, 0, 0]);
pedestal.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

const easel = new THREE.Group();
easel.position.set(-2.6, 0, -8.7);
easel.rotation.y = 0.55;
scene.add(easel);
limb(easel, V(-0.45, 0, 0.18), V(-0.22, 2.4, -0.06), 0.032, M.wood);
limb(easel, V(0.45, 0, 0.18), V(0.22, 2.4, -0.06), 0.032, M.wood);
limb(easel, V(0, 0, -0.55), V(0, 2.3, -0.1), 0.032, M.wood);
mesh(new THREE.BoxGeometry(0.9, 0.05, 0.12), M.wood, easel, [0, 1.02, 0.14]);
const frame = new THREE.Group();
frame.position.set(0, 1.78, 0.05);
frame.rotation.x = -0.07;
easel.add(frame);
mesh(new THREE.BoxGeometry(1.25, 1.55, 0.07), M.gold, frame);
mesh(new THREE.BoxGeometry(1.13, 1.43, 0.075), new THREE.MeshStandardMaterial({ color: 0xfff8ee, roughness: 0.9 }), frame, [0, 0, 0.002]);
const photoTex = new THREE.TextureLoader().load("./assets/photo.jpg", (t) => {
  t.colorSpace = THREE.SRGBColorSpace;
  const ia = t.image.width / t.image.height, pa = 1.06 / 1.36;
  if (ia > pa) { t.repeat.set(pa / ia, 1); t.offset.set((1 - t.repeat.x) / 2, 0); }
  else { t.repeat.set(1, ia / pa); t.offset.set(0, (1 - t.repeat.y) / 2); }
  t.needsUpdate = true;
});
mesh(new THREE.PlaneGeometry(1.06, 1.36), new THREE.MeshStandardMaterial({ map: photoTex, roughness: 0.85 }), frame, [0, 0, 0.045]);
easel.traverse((o) => { if (o.isMesh) o.castShadow = true; });

/* bokeh + sparkles */
function makePoints(count, rMin, rMax, yMin, yMax, size, opacity, color, seed) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2, r = rMin + rnd() * (rMax - rMin);
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = yMin + rnd() * (yMax - yMin);
    pos[i * 3 + 2] = Math.sin(a) * r - 3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ size, map: bokehSprite, transparent: true, opacity, color, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return pts;
}
const bokeh = makePoints(110, 5, 15, 0.3, 8, 0.65, 0.28, 0xffe7c9, 11);
const sparkles = makePoints(80, 1.6, 4.5, 0.6, 5.2, 0.14, 0.8, 0xfff1d6, 29);

/* ---------------- Articulated character ---------------- */
const root = new THREE.Group();
scene.add(root);
const body = new THREE.Group();
root.add(body);
const torso = new THREE.Group();
body.add(torso);

/* legs (pivot at hips) */
const legs = [];
for (const s of [-1, 1]) {
  const leg = new THREE.Group();
  leg.position.set(s * 0.2, 1.62, 0);
  body.add(leg);
  mesh(new THREE.CylinderGeometry(0.17, 0.235, 1.5, 24), M.pants, leg, [0, -0.77, 0]);
  mesh(new THREE.SphereGeometry(0.13, 20, 14), M.shoe, leg, [0, -1.54, 0.06], null, [1.1, 0.62, 1.7]);
  mesh(new THREE.BoxGeometry(0.24, 0.05, 0.4), M.shoe, leg, [0, -1.595, 0.05]);
  legs.push(leg);
}

/* hips / belt / top */
mesh(new THREE.CylinderGeometry(0.37, 0.34, 0.42, 28), M.pants, body, [0, 1.7, 0]);
mesh(new THREE.SphereGeometry(0.36, 24, 18), M.pants, body, [0, 1.62, 0], null, [1, 0.55, 0.92]);
mesh(new THREE.CylinderGeometry(0.375, 0.375, 0.085, 28), M.belt, torso, [0, 1.9, 0]);
mesh(new THREE.BoxGeometry(0.11, 0.075, 0.035), M.gold, torso, [0, 1.9, 0.372]);
mesh(new THREE.CylinderGeometry(0.33, 0.355, 0.78, 28), M.top, torso, [0, 2.32, 0]);
mesh(new THREE.SphereGeometry(0.335, 24, 18), M.top, torso, [0, 2.68, 0], null, [1, 0.5, 0.92]);

/* cardigan */
const gap = 1.5;
mesh(new THREE.CylinderGeometry(0.47, 0.6, 2.05, 40, 1, true, gap / 2, Math.PI * 2 - gap), M.cardigan, torso, [0, 1.72, 0]);
for (const s of [-1, 1]) {
  mesh(new THREE.SphereGeometry(0.19, 20, 14), M.cardiganSolid, torso, [s * 0.4, 2.66, 0]);
  mesh(new THREE.BoxGeometry(0.2, 0.27, 0.07), M.cardiganDeep, torso, [s * 0.5, 1.45, 0.3], [0, s * -0.55, 0]);
  limb(torso, V(s * 0.3, 2.7, 0.34), V(s * 0.4, 0.75, 0.44), 0.055, M.cardiganDeep);
}

/* hijab drapes */
const drapes = [];
for (const s of [-1, 1]) {
  const len = s < 0 ? 1.35 : 1.15;
  drapes.push(mesh(new THREE.CapsuleGeometry(0.14, len, 6, 18), M.hijab, torso, [s * 0.28, s < 0 ? 1.98 : 2.08, 0.42], [0.05, 0, s * 0.07], [0.9, 1, 0.42]));
}
mesh(new THREE.CapsuleGeometry(0.2, 0.9, 6, 18), M.hijabDeep, torso, [0, 2.2, -0.38], null, [1.25, 1, 0.42]);

/* neck + wrap + necklace */
mesh(new THREE.CylinderGeometry(0.13, 0.145, 0.32, 18), M.skin, torso, [0, 2.82, 0.02]);
mesh(new THREE.TorusGeometry(0.21, 0.088, 12, 30), M.hijab, torso, [0, 2.93, 0.05], [Math.PI / 2, 0, 0]);
mesh(new THREE.SphereGeometry(0.09, 16, 12), M.hijabDeep, torso, [0.21, 2.9, 0.18]);
mesh(new THREE.TorusGeometry(0.17, 0.012, 8, 34), M.silver, torso, [0, 2.68, 0.1], [1.35, 0, 0]);
const heartShape = new THREE.Shape();
heartShape.moveTo(0.25, 0.25);
heartShape.bezierCurveTo(0.25, 0.25, 0.2, 0, 0, 0);
heartShape.bezierCurveTo(-0.3, 0, -0.3, 0.35, -0.3, 0.35);
heartShape.bezierCurveTo(-0.3, 0.55, -0.1, 0.77, 0.25, 0.95);
heartShape.bezierCurveTo(0.6, 0.77, 0.8, 0.55, 0.8, 0.35);
heartShape.bezierCurveTo(0.8, 0.35, 0.8, 0, 0.5, 0);
heartShape.bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25);
const heartGeo = new THREE.ExtrudeGeometry(heartShape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2, curveSegments: 12 });
heartGeo.center();
const pendant = mesh(heartGeo, M.silver, torso, [0, 2.47, 0.37], [0.15, 0, Math.PI], [0.16, 0.16, 0.16]);

/* head */
const head = new THREE.Group();
head.position.set(0, 3.42, 0.02);
torso.add(head);
mesh(new THREE.SphereGeometry(0.6, 40, 30), M.hijab, head, [0, 0.02, -0.05], null, [1.02, 1.12, 1.04]);
mesh(new THREE.SphereGeometry(0.47, 36, 28), M.skin, head, [0, -0.02, 0.22], null, [0.9, 1.02, 0.85]);
mesh(new THREE.TorusGeometry(0.4, 0.11, 12, 40), M.hijab, head, [0, 0, 0.36], null, [0.95, 1.12, 1]);

const eyes = [];
const glints = [];
for (const s of [-1, 1]) {
  const eye = new THREE.Group();
  eye.position.set(s * 0.185, 0.0, 0.565);
  head.add(eye);
  mesh(new THREE.SphereGeometry(0.082, 20, 14), M.eyeWhite, eye, [0, 0, 0], null, [1, 1.18, 0.5]);
  mesh(new THREE.SphereGeometry(0.052, 16, 12), M.iris, eye, [0, -0.004, 0.045]);
  mesh(new THREE.SphereGeometry(0.027, 12, 10), M.pupil, eye, [0, -0.004, 0.072]);
  glints.push(mesh(new THREE.SphereGeometry(0.013, 10, 8), M.glint, eye, [0.02, 0.024, 0.088]));
  const arc = 2.7;
  mesh(new THREE.TorusGeometry(0.088, 0.011, 8, 20, arc), M.dark, eye, [0, 0.005, 0.02], [0, 0, Math.PI / 2 - arc / 2]);
  mesh(new THREE.BoxGeometry(0.05, 0.013, 0.013), M.dark, eye, [s * 0.1, 0.045, 0.02], [0, 0, s * 0.4]);
  eyes.push(eye);
  const bArc = 2.0;
  mesh(new THREE.TorusGeometry(0.105, 0.024, 8, 20, bArc), M.dark, head, [s * 0.2, 0.185, 0.55], [-0.15, 0, Math.PI / 2 - bArc / 2 + s * -0.18]);
}
mesh(new THREE.SphereGeometry(0.03, 12, 10), M.skinSoft, head, [0, -0.09, 0.65]);

/* mouth group (scalable smile) */
const mouth = new THREE.Group();
mouth.position.set(0, -0.22, 0.6);
head.add(mouth);
mesh(new THREE.SphereGeometry(0.042, 16, 12), M.lips, mouth, [0, 0.015, 0.01], null, [1.7, 0.45, 0.3]);
mesh(new THREE.SphereGeometry(0.047, 16, 12), M.lips, mouth, [0, -0.03, 0.005], null, [1.5, 0.55, 0.35]);
const smileArc = 2.4;
mesh(new THREE.TorusGeometry(0.075, 0.009, 8, 24, smileArc), M.lipsLine, mouth, [0, 0.05, 0.03], [0, 0, -Math.PI / 2 - smileArc / 2]);

for (const s of [-1, 1]) {
  mesh(new THREE.SphereGeometry(0.065, 14, 10), M.blush, head, [s * 0.3, -0.13, 0.5], [0, s * 0.55, 0], [1, 0.75, 0.3]);
}

/* ---------------- Dynamic arms (2-bone IK) ---------------- */
const L1 = 0.55, L2 = 0.62;
const arms = [];
for (const s of [-1, 1]) {
  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.135, L1 - 0.27, 6, 16), M.cardiganSolid);
  const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, L2 - 0.23, 6, 16), M.cardiganSolid);
  torso.add(upper, fore);
  const cuff = mesh(new THREE.TorusGeometry(0.115, 0.028, 8, 20), M.cardiganDeep, torso);
  const wrist = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.06, 6, 12), M.skin);
  torso.add(wrist);
  const hand = new THREE.Group();
  torso.add(hand);
  mesh(new THREE.SphereGeometry(0.105, 18, 14), M.skin, hand, [0, 0, 0], null, [0.8, 1.05, 0.55]);
  for (let f = 0; f < 4; f++) {
    const bx = s * (-0.045 + f * 0.03);
    const bz = 0.015 - f * 0.008;
    const knuckle = V(bx + s * -0.02, 0.13, bz + 0.015);
    limb(hand, V(bx, 0.06, bz), knuckle, 0.026, M.skin);
    limb(hand, knuckle, V(bx + s * -0.05, 0.17, bz + 0.06), 0.024, M.skin);
  }
  limb(hand, V(s * 0.07, -0.02, 0.03), V(s * 0.03, 0.04, 0.08), 0.028, M.skin);
  let bracelet = null;
  if (s < 0) bracelet = mesh(new THREE.TorusGeometry(0.095, 0.018, 8, 22), M.gold, torso);
  else mesh(new THREE.TorusGeometry(0.032, 0.013, 8, 14), M.belt, hand, [-0.03, 0.12, 0.03], [0.3, 0, 0]);
  arms.push({ s, upper, fore, cuff, wrist, hand, bracelet, S: V(s * 0.42, 2.62, 0.02) });
}

const _dir = new THREE.Vector3(), _dn = new THREE.Vector3(), _bend = new THREE.Vector3(),
  _E = new THREE.Vector3(), _W = new THREE.Vector3(), _tmp = new THREE.Vector3(),
  _fd = new THREE.Vector3(), _w2 = new THREE.Vector3();

function placeLimb(m, a, b) {
  m.position.copy(a).add(b).multiplyScalar(0.5);
  _tmp.copy(b).sub(a).normalize();
  m.quaternion.setFromUnitVectors(UP, _tmp);
}

function updateArm(arm, Wtarget, hint) {
  const { S, upper, fore, cuff, wrist, hand, bracelet } = arm;
  _dir.copy(Wtarget).sub(S);
  const d = clamp(_dir.length(), 0.12, L1 + L2 - 0.01);
  _dn.copy(_dir).normalize();
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(L1 * L1 - a * a, 0.0001));
  _bend.copy(hint).addScaledVector(_dn, -hint.dot(_dn)).normalize();
  _E.copy(S).addScaledVector(_dn, a).addScaledVector(_bend, h);
  _W.copy(S).addScaledVector(_dn, d);
  placeLimb(upper, S, _E);
  placeLimb(fore, _E, _W);
  _fd.copy(_W).sub(_E).normalize();
  cuff.position.copy(_W).addScaledVector(_fd, -0.06);
  cuff.quaternion.setFromUnitVectors(V(0, 0, 1), _fd);
  _w2.copy(_W).addScaledVector(_fd, 0.1);
  placeLimb(wrist, _W, _w2);
  hand.position.copy(_W).addScaledVector(_fd, 0.13);
  hand.quaternion.setFromUnitVectors(UP, _fd);
  hand.rotateY(arm.s * 0.5);
  if (bracelet) {
    bracelet.position.copy(_W).addScaledVector(_fd, 0.045);
    bracelet.quaternion.setFromUnitVectors(V(0, 0, 1), _fd);
  }
}

root.traverse((o) => { if (o.isMesh) o.castShadow = true; });

/* ---------------- Walk path (precomputed, deterministic) ---------------- */
const pathZ = (() => {
  const dt = 1 / 240, n = Math.ceil(DUR / dt) + 1;
  const arr = new Float32Array(n);
  let z = -5.5;
  for (let i = 0; i < n; i++) {
    const t = i * dt;
    arr[i] = z;
    z += 1.35 * (1 - smooth(4.8, 6.2, t)) * dt;
  }
  return arr;
})();
function zAt(t) {
  const f = clamp(t * 240, 0, pathZ.length - 1.001);
  const i = Math.floor(f);
  return lerp(pathZ[i], pathZ[i + 1], f - i);
}

/* ---------------- Overlay handles ---------------- */
const bar = document.getElementById("bar");
const disc = document.getElementById("disc");
const likeIcon = document.getElementById("likeIcon");
const likeCount = document.getElementById("likeCount");
const endcard = document.getElementById("endcard");
const bigHeart = document.getElementById("bigHeart");

/* ---------------- Choreography ---------------- */
const BLINKS = [2.1, 4.4, 7.6, 9.9];
const _walkW = new THREE.Vector3(), _poseW = new THREE.Vector3(),
  _walkHint = new THREE.Vector3(), _poseHint = new THREE.Vector3(), _hint = new THREE.Vector3();

function renderFrame(t) {
  t = clamp(t, 0, DUR);
  const phi = t * (Math.PI * 2 / 0.85);
  const walkAmt = 1 - smooth(4.8, 6.2, t);
  const poseP = smooth(5.2, 6.5, t);
  const smileP = smooth(5.8, 6.7, t);
  const pushP = smooth(6.5, 10.4, t);

  /* root motion */
  const z = zAt(t);
  const weave = 0.15 * Math.sin(t * 0.6) * walkAmt;
  root.position.set(weave, 0, z);
  const turnRaw = smooth(5.0, 6.2, t);
  const baseRot = 0.06 + 0.1 * Math.sin(Math.min(t, 5.0) * 0.5);
  root.rotation.y = baseRot * (1 - easeOutBack(turnRaw));

  /* body bob / sway / lean */
  const walkBob = Math.abs(Math.sin(phi)) * 0.055 * walkAmt;
  const idleBob = Math.sin(t * 1.3) * 0.02 * poseP;
  const hop = 0.05 * Math.exp(-Math.pow((t - 6.3) * 4, 2)) * Math.abs(Math.sin((t - 6.3) * 12));
  body.position.y = walkBob + idleBob + hop;
  body.rotation.z = 0.03 * Math.sin(phi) * walkAmt + 0.015 * Math.sin(t * 0.8) * poseP;
  torso.rotation.x = 0.06 * walkAmt;

  /* legs */
  legs[0].rotation.x = 0.42 * Math.sin(phi) * walkAmt + 0.04 * poseP;
  legs[1].rotation.x = 0.42 * Math.sin(phi + Math.PI) * walkAmt - 0.02 * poseP;

  /* head: look around while walking, then turn to camera + signature tilt */
  const headTurn = smooth(4.9, 5.8, t);
  head.rotation.y = 0.18 * Math.sin(t * 0.7) * (1 - headTurn) + 0.05 * Math.sin(t * 0.6) * poseP;
  head.rotation.z = 0.09 * poseP + 0.02 * Math.sin(t * 0.9);
  head.rotation.x = -0.04 * walkAmt + 0.02 * Math.sin(t * 1.1) * poseP;

  /* arms: swing while walking, IK lerp into hands-near-chin pose */
  for (const arm of arms) {
    const s = arm.s;
    const swing = 0.3 * Math.sin(phi + (s > 0 ? Math.PI : 0));
    _walkW.copy(arm.S).add(V(s * 0.1, -1.02, swing));
    _poseW.set(s * 0.3, 2.78, 0.46);
    _W.lerpVectors(_walkW, _poseW, poseP);
    _walkHint.set(s * 0.6, -0.4, -0.35);
    _poseHint.set(s * 0.5, -1, 0.15);
    _hint.lerpVectors(_walkHint, _poseHint, poseP);
    updateArm(arm, _W, _hint);
  }

  /* smile + blush + eye sparkle */
  mouth.scale.set(1 + 0.18 * smileP, 1 + 0.12 * smileP, 1);
  M.blush.opacity = 0.55 + 0.2 * smileP;
  glints.forEach((g) => g.scale.setScalar(1 + 0.5 * smileP));

  /* blink */
  let eyeS = 1;
  for (const bt of BLINKS) {
    const dtb = t - bt;
    if (dtb >= 0 && dtb < 0.24) {
      eyeS = dtb < 0.09 ? 1 - (dtb / 0.09) * 0.92 : 0.08 + ((dtb - 0.09) / 0.15) * 0.92;
    }
  }
  eyes.forEach((e) => (e.scale.y = clamp(eyeS, 0.08, 1)));

  /* pendant + drapes sway */
  pendant.rotation.z = Math.PI + Math.sin(t * 1.6) * 0.1 + 0.15 * Math.sin(phi) * walkAmt;
  drapes.forEach((d, i) => {
    d.rotation.x = 0.05 + Math.sin(t * 1.1 + i) * 0.015 + 0.06 * Math.sin(phi + i) * walkAmt;
  });

  /* particles */
  bokeh.rotation.y = t * 0.02;
  sparkles.rotation.y = -t * 0.05;
  const burst = Math.exp(-Math.pow(t - 6.7, 2) * 2);
  sparkles.material.opacity = 0.5 + Math.sin(t * 2) * 0.25 + 0.4 * burst;
  sparkles.material.size = 0.14 * (1 + 1.2 * burst);

  /* handheld camera */
  const sx = 0.035 * Math.sin(t * 7.3) + 0.02 * Math.sin(t * 13.7 + 1.7);
  const sy = 0.03 * Math.sin(t * 9.1 + 0.6) + 0.018 * Math.sin(t * 15.3) + 0.022 * Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 * 1.7)), 3);
  const sz = 0.025 * Math.sin(t * 6.1 + 2.1);
  camera.position.set(0.35 - 0.5 * pushP + sx, 2.45 + 0.25 * pushP + sy, 6.2 - 0.35 * pushP + sz);
  const lookY = lerp(2.25, 2.98, smooth(1, 6.0, t));
  camera.lookAt(
    weave * 0.4 + 0.012 * Math.sin(t * 8.7 + 3),
    lookY + 0.012 * Math.sin(t * 10.3 + 1),
    z + 0.15
  );
  camera.rotation.z += 0.008 * Math.sin(t * 1.3) + 0.005 * Math.sin(t * 2.9 + 1);

  /* overlay state */
  bar.style.width = ((t / DUR) * 100).toFixed(2) + "%";
  disc.style.transform = `rotate(${(t * 120).toFixed(1)}deg)`;
  const liked = t > 6.65;
  likeIcon.classList.toggle("liked", liked);
  likeCount.textContent = liked ? "12.5K" : "12.4K";
  const pop = 1 + 0.25 * Math.exp(-Math.pow((t - 6.75) * 5, 2));
  likeIcon.style.transform = `scale(${pop.toFixed(3)})`;
  if (bigHeart) {
    const bh = Math.exp(-Math.pow((t - 6.9) * 3.2, 2));
    bigHeart.style.opacity = bh.toFixed(3);
    bigHeart.style.transform = `translate(-50%,-50%) scale(${(0.6 + 0.5 * bh).toFixed(3)}) rotate(-8deg)`;
  }
  const e = smooth(10.3, 11.0, t);
  endcard.style.opacity = e.toFixed(3);
  endcard.style.transform = `scale(${(0.85 + 0.15 * easeOutBack(e)).toFixed(3)})`;

  renderer.render(scene, camera);
}

/* ---------------- Boot ---------------- */
sizeRenderer();
window.addEventListener("resize", sizeRenderer);

window.renderFrame = renderFrame;
window.__meta = { fps: FPS, dur: DUR, w: W, h: H };

if (CAPTURE) {
  document.fonts.ready.then(() => {
    renderFrame(0);
    window.__ready = true;
  });
} else {
  let start = performance.now();
  document.getElementById("replayBtn").addEventListener("click", () => (start = performance.now()));
  const loop = () => {
    const t = ((performance.now() - start) / 1000) % DUR;
    renderFrame(t);
    requestAnimationFrame(loop);
  };
  document.fonts.ready.then(() => requestAnimationFrame(loop));
}
