/* ============================================================
   مجسم هاجر — مشهد ثلاثي الأبعاد تفاعلي
   Stylized 3D figurine scene inspired by the reference photo.
   Built with Three.js (vendored locally, no CDN needed).
   ============================================================ */
import * as THREE from "three";
import { OrbitControls } from "./vendor/OrbitControls.js";

/* ---------------- Renderer / Scene / Camera ---------------- */
const canvas = document.getElementById("stage");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf2d8c4, 13, 32);

const camera = new THREE.PerspectiveCamera(
  38,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
const INIT_POS = new THREE.Vector3(3.6, 3.1, 6.9);
const INIT_TARGET = new THREE.Vector3(0, 2.35, 0);
camera.position.copy(INIT_POS);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(INIT_TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.1;
controls.minDistance = 3;
controls.maxDistance = 14;
controls.maxPolarAngle = 1.5;
controls.minPolarAngle = 0.15;
controls.enablePan = false;

/* ---------------- Palette ---------------- */
const C = {
  hijab: 0xe3d2b8,
  hijabDeep: 0xd8c5a8,
  skin: 0xf5cbaa,
  skinSoft: 0xeec09e,
  cardigan: 0x7e2f40,
  cardiganDeep: 0x6d2737,
  top: 0xf7f2e9,
  pants: 0xe7d8bf,
  shoe: 0xf6f3ee,
  belt: 0x271c17,
  lips: 0xc96f5e,
  lipsLine: 0xa4543f,
  brow: 0x3a2a20,
  iris: 0x6b452a,
  blush: 0xf09a80,
  gold: 0xd8b25a,
  silver: 0xd6d9de,
  wood: 0x9a7350,
};

/* ---------------- Canvas texture helpers ---------------- */
function makeCanvas(w, h, draw) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function gradientBackground(top, bottom) {
  return makeCanvas(32, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

const marbleTex = makeCanvas(512, 512, (ctx, w, h) => {
  ctx.fillStyle = "#f7f2ea";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 22; i++) {
    ctx.strokeStyle = `rgba(178,168,158,${0.08 + Math.random() * 0.18})`;
    ctx.lineWidth = 0.6 + Math.random() * 2.2;
    ctx.beginPath();
    let x = Math.random() * w;
    let y = Math.random() * h;
    ctx.moveTo(x, y);
    for (let s = 0; s < 5; s++) {
      const nx = x + (Math.random() - 0.5) * 220;
      const ny = y + (Math.random() - 0.5) * 220;
      ctx.quadraticCurveTo(
        x + (Math.random() - 0.5) * 120,
        y + (Math.random() - 0.5) * 120,
        nx,
        ny
      );
      x = nx;
      y = ny;
    }
    ctx.stroke();
  }
});

const knitBump = makeCanvas(128, 128, (ctx, w, h) => {
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 16) {
    for (let y = 0; y < h; y += 12) {
      ctx.strokeStyle = "#9c9c9c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 2, y);
      ctx.lineTo(x + 8, y + 9);
      ctx.lineTo(x + 14, y);
      ctx.stroke();
      ctx.strokeStyle = "#6a6a6a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 3);
      ctx.lineTo(x + 8, y + 12);
      ctx.lineTo(x + 14, y + 3);
      ctx.stroke();
    }
  }
});
knitBump.colorSpace = THREE.NoColorSpace;
knitBump.wrapS = knitBump.wrapT = THREE.RepeatWrapping;
knitBump.repeat.set(7, 4);

const ribBump = makeCanvas(64, 64, (ctx, w, h) => {
  for (let x = 0; x < w; x += 8) {
    ctx.fillStyle = x % 16 === 0 ? "#8c8c8c" : "#747474";
    ctx.fillRect(x, 0, 8, h);
  }
});
ribBump.colorSpace = THREE.NoColorSpace;
ribBump.wrapS = ribBump.wrapT = THREE.RepeatWrapping;
ribBump.repeat.set(10, 1);

const bokehSprite = makeCanvas(128, 128, (ctx, w, h) => {
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
});

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

/* ---------------- Plaque (name on the base) ---------------- */
const plaqueCanvas = document.createElement("canvas");
plaqueCanvas.width = 512;
plaqueCanvas.height = 160;
const plaqueTex = new THREE.CanvasTexture(plaqueCanvas);
plaqueTex.colorSpace = THREE.SRGBColorSpace;
plaqueTex.anisotropy = 4;

function drawPlaque(name) {
  const ctx = plaqueCanvas.getContext("2d");
  const w = plaqueCanvas.width;
  const h = plaqueCanvas.height;
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "#e9cd82");
  g.addColorStop(0.35, "#c9a24b");
  g.addColorStop(0.65, "#f2dfa6");
  g.addColorStop(1, "#b8912f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(90,60,20,0.55)";
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.strokeStyle = "rgba(255,240,200,0.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, w - 40, h - 40);
  ctx.fillStyle = "#4a2f14";
  ctx.font = "italic 700 78px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, w / 2, h / 2 + 6, w - 90);
  for (const [sx, sy] of [
    [30, 30],
    [w - 30, 30],
    [30, h - 30],
    [w - 30, h - 30],
  ]) {
    ctx.beginPath();
    ctx.arc(sx, sy, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#8a6a2a";
    ctx.fill();
  }
  plaqueTex.needsUpdate = true;
}
drawPlaque("Hager");

/* ---------------- Materials ---------------- */
const M = {
  skin: new THREE.MeshStandardMaterial({ color: C.skin, roughness: 0.62 }),
  skinSoft: new THREE.MeshStandardMaterial({ color: C.skinSoft, roughness: 0.62 }),
  hijab: new THREE.MeshPhysicalMaterial({
    color: C.hijab,
    roughness: 0.88,
    sheen: 0.6,
    sheenColor: new THREE.Color(0xfff2dd),
  }),
  hijabDeep: new THREE.MeshPhysicalMaterial({
    color: C.hijabDeep,
    roughness: 0.9,
    sheen: 0.5,
    sheenColor: new THREE.Color(0xfff2dd),
  }),
  cardigan: new THREE.MeshPhysicalMaterial({
    color: C.cardigan,
    roughness: 0.95,
    sheen: 0.4,
    sheenColor: new THREE.Color(0xb06070),
    bumpMap: knitBump,
    bumpScale: 0.6,
    side: THREE.DoubleSide,
  }),
  cardiganSolid: new THREE.MeshStandardMaterial({
    color: C.cardigan,
    roughness: 0.95,
    bumpMap: knitBump,
    bumpScale: 0.6,
  }),
  cardiganDeep: new THREE.MeshStandardMaterial({
    color: C.cardiganDeep,
    roughness: 0.95,
    bumpMap: knitBump,
    bumpScale: 0.6,
  }),
  top: new THREE.MeshStandardMaterial({
    color: C.top,
    roughness: 0.85,
    bumpMap: ribBump,
    bumpScale: 0.35,
  }),
  pants: new THREE.MeshStandardMaterial({ color: C.pants, roughness: 0.88 }),
  shoe: new THREE.MeshStandardMaterial({ color: C.shoe, roughness: 0.5 }),
  belt: new THREE.MeshStandardMaterial({ color: C.belt, roughness: 0.45 }),
  gold: new THREE.MeshStandardMaterial({
    color: C.gold,
    metalness: 1,
    roughness: 0.28,
  }),
  silver: new THREE.MeshStandardMaterial({
    color: C.silver,
    metalness: 1,
    roughness: 0.25,
  }),
  marble: new THREE.MeshPhysicalMaterial({
    map: marbleTex,
    roughness: 0.32,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
  }),
  eyeWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 }),
  iris: new THREE.MeshStandardMaterial({ color: C.iris, roughness: 0.3 }),
  pupil: new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.2 }),
  glint: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  dark: new THREE.MeshStandardMaterial({ color: C.brow, roughness: 0.6 }),
  lips: new THREE.MeshStandardMaterial({ color: C.lips, roughness: 0.45 }),
  lipsLine: new THREE.MeshStandardMaterial({ color: C.lipsLine, roughness: 0.5 }),
  blush: new THREE.MeshStandardMaterial({
    color: C.blush,
    roughness: 1,
    transparent: true,
    opacity: 0.55,
  }),
  wood: new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.8 }),
};

/* ---------------- Small helpers ---------------- */
function mesh(geo, material, parent, pos, rot, scale) {
  const m = new THREE.Mesh(geo, material);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  if (scale) m.scale.set(...scale);
  if (parent) parent.add(m);
  return m;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function limb(parent, a, b, r, material) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const geo = new THREE.CapsuleGeometry(r, Math.max(0.02, len), 6, 16);
  const m = new THREE.Mesh(geo, material);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize());
  parent.add(m);
  return m;
}

/* ---------------- Lights ---------------- */
scene.add(new THREE.HemisphereLight(0xfff3e4, 0xd9a68f, 0.85));

const key = new THREE.DirectionalLight(0xffe9d2, 2.4);
key.position.set(4.5, 7.5, 5.5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -7;
key.shadow.camera.right = 7;
key.shadow.camera.top = 9;
key.shadow.camera.bottom = -4;
key.shadow.camera.near = 1;
key.shadow.camera.far = 25;
key.shadow.bias = -0.0005;
scene.add(key);

const rim = new THREE.DirectionalLight(0xffd2b8, 1.1);
rim.position.set(-5, 4.5, -5);
scene.add(rim);

const fill = new THREE.DirectionalLight(0xffffff, 0.45);
fill.position.set(-3, 2.5, 6);
scene.add(fill);

/* ---------------- Floor ---------------- */
const floor = mesh(
  new THREE.CircleGeometry(40, 64),
  new THREE.MeshStandardMaterial({ color: 0xe9cdb9, roughness: 0.95 }),
  scene,
  [0, 0, 0],
  [-Math.PI / 2, 0, 0]
);
floor.receiveShadow = true;

/* ---------------- Pedestal ---------------- */
const PED_H = 0.55;
const pedestal = new THREE.Group();
scene.add(pedestal);

const pedBody = mesh(
  new THREE.CylinderGeometry(1.45, 1.58, PED_H, 64),
  M.marble,
  pedestal,
  [0, PED_H / 2, 0]
);
pedBody.receiveShadow = true;
mesh(new THREE.TorusGeometry(1.455, 0.035, 12, 72), M.gold, pedestal, [0, PED_H - 0.02, 0], [Math.PI / 2, 0, 0]);
mesh(new THREE.TorusGeometry(1.565, 0.035, 12, 72), M.gold, pedestal, [0, 0.045, 0], [Math.PI / 2, 0, 0]);

const plaque = mesh(
  new THREE.BoxGeometry(0.92, 0.28, 0.06),
  new THREE.MeshStandardMaterial({ map: plaqueTex, metalness: 0.55, roughness: 0.4 }),
  pedestal,
  [0, 0.27, 1.5]
);
plaque.rotation.x = -0.06;

/* ---------------- Character ---------------- */
const character = new THREE.Group();
character.position.y = PED_H;
scene.add(character);

/* Shoes */
for (const s of [-1, 1]) {
  mesh(new THREE.SphereGeometry(0.13, 24, 18), M.shoe, character, [s * 0.2, 0.08, 0.06], null, [1.1, 0.62, 1.7]);
  mesh(new THREE.BoxGeometry(0.24, 0.05, 0.4), M.shoe, character, [s * 0.2, 0.025, 0.05]);
}

/* Wide-leg pants */
for (const s of [-1, 1]) {
  mesh(new THREE.CylinderGeometry(0.17, 0.235, 1.5, 28), M.pants, character, [s * 0.2, 0.85, 0]);
}
mesh(new THREE.CylinderGeometry(0.37, 0.34, 0.42, 32), M.pants, character, [0, 1.7, 0]);
mesh(new THREE.SphereGeometry(0.36, 28, 20), M.pants, character, [0, 1.62, 0], null, [1, 0.55, 0.92]);

/* Belt + buckle */
mesh(new THREE.CylinderGeometry(0.375, 0.375, 0.085, 32), M.belt, character, [0, 1.9, 0]);
mesh(new THREE.BoxGeometry(0.11, 0.075, 0.035), M.gold, character, [0, 1.9, 0.372]);

/* White ribbed top */
mesh(new THREE.CylinderGeometry(0.33, 0.355, 0.78, 32), M.top, character, [0, 2.32, 0]);
mesh(new THREE.SphereGeometry(0.335, 28, 20), M.top, character, [0, 2.68, 0], null, [1, 0.5, 0.92]);

/* Long open cardigan */
const gap = 1.5;
mesh(
  new THREE.CylinderGeometry(0.47, 0.6, 2.05, 48, 1, true, gap / 2, Math.PI * 2 - gap),
  M.cardigan,
  character,
  [0, 1.72, 0]
);
for (const s of [-1, 1]) {
  mesh(new THREE.SphereGeometry(0.19, 24, 18), M.cardiganSolid, character, [s * 0.4, 2.66, 0]);
  mesh(new THREE.BoxGeometry(0.2, 0.27, 0.07), M.cardiganDeep, character, [s * 0.5, 1.45, 0.3], [0, s * -0.55, 0]);
  /* front edges of the cardigan */
  limb(character, V(s * 0.3, 2.7, 0.34), V(s * 0.4, 0.75, 0.44), 0.055, M.cardiganDeep);
}

/* Hijab drapes down the front */
const drapes = [];
for (const s of [-1, 1]) {
  const len = s < 0 ? 1.35 : 1.15;
  const d = mesh(
    new THREE.CapsuleGeometry(0.14, len, 8, 20),
    M.hijab,
    character,
    [s * 0.28, s < 0 ? 1.98 : 2.08, 0.42],
    [0.05, 0, s * 0.07],
    [0.9, 1, 0.42]
  );
  drapes.push(d);
}
/* back drape */
mesh(new THREE.CapsuleGeometry(0.2, 0.9, 8, 20), M.hijabDeep, character, [0, 2.2, -0.38], null, [1.25, 1, 0.42]);

/* Neck + hijab wrap under the chin */
mesh(new THREE.CylinderGeometry(0.13, 0.145, 0.32, 20), M.skin, character, [0, 2.82, 0.02]);
mesh(new THREE.TorusGeometry(0.21, 0.088, 14, 36), M.hijab, character, [0, 2.93, 0.05], [Math.PI / 2, 0, 0]);
mesh(new THREE.SphereGeometry(0.09, 18, 14), M.hijabDeep, character, [0.21, 2.9, 0.18]);

/* Necklace + heart pendant */
mesh(new THREE.TorusGeometry(0.17, 0.012, 10, 40), M.silver, character, [0, 2.68, 0.1], [1.35, 0, 0]);
const heartShape = new THREE.Shape();
heartShape.moveTo(0.25, 0.25);
heartShape.bezierCurveTo(0.25, 0.25, 0.2, 0, 0, 0);
heartShape.bezierCurveTo(-0.3, 0, -0.3, 0.35, -0.3, 0.35);
heartShape.bezierCurveTo(-0.3, 0.55, -0.1, 0.77, 0.25, 0.95);
heartShape.bezierCurveTo(0.6, 0.77, 0.8, 0.55, 0.8, 0.35);
heartShape.bezierCurveTo(0.8, 0.35, 0.8, 0, 0.5, 0);
heartShape.bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25);
const heartGeo = new THREE.ExtrudeGeometry(heartShape, {
  depth: 0.3,
  bevelEnabled: true,
  bevelThickness: 0.08,
  bevelSize: 0.08,
  bevelSegments: 3,
  curveSegments: 14,
});
heartGeo.center();
const pendant = mesh(heartGeo, M.silver, character, [0, 2.47, 0.37], [0.15, 0, Math.PI], [0.16, 0.16, 0.16]);

/* Arms — signature pose: hands raised near the chin */
for (const s of [-1, 1]) {
  const S = V(s * 0.42, 2.62, 0.02);
  const E = V(s * 0.66, 2.1, 0.16);
  const W = V(s * 0.3, 2.78, 0.46);
  limb(character, S, E, 0.135, M.cardiganSolid);
  limb(character, E, W, 0.115, M.cardiganSolid);
  /* cuff */
  const cuffDir = new THREE.Vector3().subVectors(W, E).normalize();
  const cuff = mesh(new THREE.TorusGeometry(0.115, 0.028, 10, 24), M.cardiganDeep, character);
  cuff.position.copy(W).addScaledVector(cuffDir, -0.06);
  cuff.quaternion.setFromUnitVectors(V(0, 0, 1), cuffDir);

  /* wrist + hand */
  const H = V(s * 0.22, 2.9, 0.52);
  limb(character, W, H, 0.07, M.skin);
  mesh(new THREE.SphereGeometry(0.105, 20, 16), M.skin, character, [H.x, H.y, H.z], [-0.2, 0, s * -0.3], [0.8, 1.05, 0.55]);
  /* fingers gently curled toward the chin */
  for (let f = 0; f < 4; f++) {
    const base = V(H.x + s * (-0.045 + f * 0.03), H.y + 0.06, H.z + 0.015 - f * 0.008);
    const knuckle = V(base.x + s * -0.02, base.y + 0.07, base.z + 0.015);
    const tip = V(knuckle.x + s * -0.03, knuckle.y + 0.04, knuckle.z + 0.045);
    limb(character, base, knuckle, 0.026, M.skin);
    limb(character, knuckle, tip, 0.024, M.skin);
  }
  /* thumb */
  limb(character, V(H.x + s * 0.07, H.y - 0.02, H.z + 0.03), V(H.x + s * 0.03, H.y + 0.04, H.z + 0.08), 0.028, M.skin);

  if (s < 0) {
    /* gold bracelet on the left wrist */
    const br = mesh(new THREE.TorusGeometry(0.095, 0.018, 10, 28), M.gold, character);
    br.position.copy(W).addScaledVector(cuffDir, 0.045);
    br.quaternion.setFromUnitVectors(V(0, 0, 1), cuffDir);
  } else {
    /* black ring on the right hand */
    mesh(new THREE.TorusGeometry(0.032, 0.013, 8, 18), M.belt, character, [H.x - 0.03, H.y + 0.1, H.z + 0.02], [0.3, 0, 0]);
  }
}

/* ---------------- Head ---------------- */
const head = new THREE.Group();
head.position.set(0, 3.42, 0.02);
head.rotation.set(0, -0.06, 0.09);
character.add(head);

/* hijab shell + face */
mesh(new THREE.SphereGeometry(0.6, 48, 36), M.hijab, head, [0, 0.02, -0.05], null, [1.02, 1.12, 1.04]);
mesh(new THREE.SphereGeometry(0.47, 40, 32), M.skin, head, [0, -0.02, 0.22], null, [0.9, 1.02, 0.85]);
mesh(new THREE.TorusGeometry(0.4, 0.11, 14, 48), M.hijab, head, [0, 0, 0.36], null, [0.95, 1.12, 1]);

/* eyes (groups so we can blink) */
const eyes = [];
for (const s of [-1, 1]) {
  const eye = new THREE.Group();
  eye.position.set(s * 0.185, 0.0, 0.565);
  head.add(eye);
  mesh(new THREE.SphereGeometry(0.082, 22, 16), M.eyeWhite, eye, [0, 0, 0], null, [1, 1.18, 0.5]);
  mesh(new THREE.SphereGeometry(0.052, 18, 14), M.iris, eye, [0, -0.004, 0.045]);
  mesh(new THREE.SphereGeometry(0.027, 14, 10), M.pupil, eye, [0, -0.004, 0.072]);
  mesh(new THREE.SphereGeometry(0.013, 10, 8), M.glint, eye, [0.02, 0.024, 0.088]);
  /* eyeliner arc + wing */
  const arc = 2.7;
  mesh(new THREE.TorusGeometry(0.088, 0.011, 8, 24, arc), M.dark, eye, [0, 0.005, 0.02], [0, 0, Math.PI / 2 - arc / 2]);
  mesh(new THREE.BoxGeometry(0.05, 0.013, 0.013), M.dark, eye, [s * 0.1, 0.045, 0.02], [0, 0, s * 0.4]);
  eyes.push(eye);

  /* bold eyebrow */
  const bArc = 2.0;
  mesh(
    new THREE.TorusGeometry(0.105, 0.024, 8, 24, bArc),
    M.dark,
    head,
    [s * 0.2, 0.185, 0.55],
    [-0.15, 0, Math.PI / 2 - bArc / 2 + s * -0.18]
  );
}

/* nose */
mesh(new THREE.SphereGeometry(0.03, 14, 10), M.skinSoft, head, [0, -0.09, 0.65]);

/* gentle smile */
mesh(new THREE.SphereGeometry(0.042, 18, 12), M.lips, head, [0, -0.2, 0.615], null, [1.7, 0.45, 0.3]);
mesh(new THREE.SphereGeometry(0.047, 18, 12), M.lips, head, [0, -0.245, 0.61], null, [1.5, 0.55, 0.35]);
const smileArc = 2.4;
mesh(
  new THREE.TorusGeometry(0.075, 0.009, 8, 24, smileArc),
  M.lipsLine,
  head,
  [0, -0.17, 0.635],
  [0, 0, -Math.PI / 2 - smileArc / 2]
);

/* blush */
for (const s of [-1, 1]) {
  mesh(new THREE.SphereGeometry(0.065, 16, 12), M.blush, head, [s * 0.3, -0.13, 0.5], [0, s * 0.55, 0], [1, 0.75, 0.3]);
}

/* shadows for the whole figurine */
character.traverse((o) => {
  if (o.isMesh) {
    o.castShadow = true;
    o.receiveShadow = false;
  }
});
pedestal.traverse((o) => {
  if (o.isMesh) o.castShadow = true;
});

/* ---------------- Framed original photo on an easel ---------------- */
const easel = new THREE.Group();
easel.position.set(-2.9, 0, -1.3);
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
  const imgAspect = t.image.width / t.image.height;
  const planeAspect = 1.06 / 1.36;
  if (imgAspect > planeAspect) {
    t.repeat.set(planeAspect / imgAspect, 1);
    t.offset.set((1 - t.repeat.x) / 2, 0);
  } else {
    t.repeat.set(1, imgAspect / planeAspect);
    t.offset.set(0, (1 - t.repeat.y) / 2);
  }
  t.needsUpdate = true;
});
mesh(
  new THREE.PlaneGeometry(1.06, 1.36),
  new THREE.MeshStandardMaterial({ map: photoTex, roughness: 0.85 }),
  frame,
  [0, 0, 0.045]
);
easel.traverse((o) => {
  if (o.isMesh) o.castShadow = true;
});

/* ---------------- Bokeh & sparkles ---------------- */
function makePoints(count, rMin, rMax, yMin, yMax, size, opacity, color) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = rMin + Math.random() * (rMax - rMin);
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = yMin + Math.random() * (yMax - yMin);
    pos[i * 3 + 2] = Math.sin(a) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size,
    map: bokehSprite,
    transparent: true,
    opacity,
    color,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return pts;
}
const bokeh = makePoints(110, 5, 14, 0.3, 8, 0.9, 0.32, 0xffe7c9);
const sparkles = makePoints(70, 1.7, 4.6, 0.6, 5.2, 0.14, 0.85, 0xfff1d6);

/* ---------------- Themes ---------------- */
const THEMES = [
  { name: "خوخي دافئ 🍑", top: "#f6ddc9", bottom: "#fdf3e7", fog: 0xf2d8c4, floor: 0xe9cdb9, bokeh: 0xffe7c9 },
  { name: "وردي هادئ 🌸", top: "#ecd0da", bottom: "#faf0f3", fog: 0xecd2dc, floor: 0xdfc3cf, bokeh: 0xffdff0 },
  { name: "ليلي ذهبي 🌙", top: "#332844", bottom: "#5a4468", fog: 0x463756, floor: 0x3c2f4d, bokeh: 0xffd9a0 },
];
let themeIdx = 0;
function applyTheme(i) {
  const t = THEMES[i];
  if (scene.background && scene.background.dispose) scene.background.dispose();
  scene.background = gradientBackground(t.top, t.bottom);
  scene.fog.color.setHex(t.fog);
  floor.material.color.setHex(t.floor);
  bokeh.material.color.setHex(t.bokeh);
  sparkles.material.color.setHex(t.bokeh);
}
applyTheme(0);

/* ---------------- UI wiring ---------------- */
const $ = (id) => document.getElementById(id);
const toastEl = $("toast");
let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.hidden = true), 2200);
}

$("rotateBtn").addEventListener("click", (e) => {
  controls.autoRotate = !controls.autoRotate;
  e.currentTarget.classList.toggle("active", controls.autoRotate);
  toast(controls.autoRotate ? "الدوران التلقائي: تشغيل 🔄" : "الدوران التلقائي: إيقاف ⏸️");
});

$("themeBtn").addEventListener("click", () => {
  themeIdx = (themeIdx + 1) % THEMES.length;
  applyTheme(themeIdx);
  toast("الخلفية: " + THEMES[themeIdx].name);
});

$("frameBtn").addEventListener("click", (e) => {
  easel.visible = !easel.visible;
  e.currentTarget.classList.toggle("active", easel.visible);
  toast(easel.visible ? "تم إظهار إطار الصورة 🖼️" : "تم إخفاء إطار الصورة");
});

$("resetBtn").addEventListener("click", () => {
  camera.position.copy(INIT_POS);
  controls.target.copy(INIT_TARGET);
  toast("تمت إعادة ضبط الكاميرا 🎯");
});

$("shotBtn").addEventListener("click", () => {
  renderer.render(scene, camera);
  const a = document.createElement("a");
  a.href = renderer.domElement.toDataURL("image/png");
  a.download = "hager-3d-scene.png";
  a.click();
  toast("تم حفظ اللقطة 📷");
});

$("nameInput").addEventListener("input", (e) => {
  drawPlaque(e.target.value.trim() || "Hager");
});

const lightbox = $("lightbox");
$("thumbBtn").addEventListener("click", () => (lightbox.hidden = false));
lightbox.querySelectorAll("[data-close]").forEach((el) =>
  el.addEventListener("click", () => (lightbox.hidden = true))
);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") lightbox.hidden = true;
});

setTimeout(() => $("hint").classList.add("fade"), 9000);

/* ---------------- Animation ---------------- */
const clock = new THREE.Clock();
let nextBlink = 2.5;
let blinkStart = -1;
let loaderHidden = false;

function animate() {
  const t = clock.getElapsedTime();

  /* idle breathing + head sway */
  character.position.y = PED_H + Math.sin(t * 1.3) * 0.02;
  head.rotation.z = 0.09 + Math.sin(t * 0.9) * 0.02;
  head.rotation.y = -0.06 + Math.sin(t * 0.6) * 0.05;
  pendant.rotation.z = Math.PI + Math.sin(t * 1.6) * 0.1;
  drapes.forEach((d, i) => {
    d.rotation.x = 0.05 + Math.sin(t * 1.1 + i) * 0.015;
  });

  /* blink */
  if (blinkStart < 0 && t > nextBlink) blinkStart = t;
  if (blinkStart >= 0) {
    const bt = t - blinkStart;
    let s = 1;
    if (bt < 0.09) s = 1 - (bt / 0.09) * 0.92;
    else if (bt < 0.24) s = 0.08 + ((bt - 0.09) / 0.15) * 0.92;
    else {
      blinkStart = -1;
      nextBlink = t + 2.5 + Math.random() * 2.5;
    }
    eyes.forEach((eye) => (eye.scale.y = Math.max(0.08, Math.min(1, s))));
  }

  /* ambient particles */
  bokeh.rotation.y = t * 0.02;
  sparkles.rotation.y = -t * 0.05;
  sparkles.material.opacity = 0.55 + Math.sin(t * 2) * 0.3;

  controls.update();
  renderer.render(scene, camera);

  if (!loaderHidden) {
    loaderHidden = true;
    document.getElementById("loader").classList.add("done");
  }
}
renderer.setAnimationLoop(animate);

/* ---------------- Resize ---------------- */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
