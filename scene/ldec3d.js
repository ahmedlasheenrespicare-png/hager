/* ============================================================
   ماكيتات LASHEEN — LDEC · مشهد ثلاثي الأبعاد تفاعلي
   Two high-detail miniature maquettes (glass HQ tower + active
   construction site) built as real 3D geometry so zooming stays
   crisp at any distance. Three.js vendored locally.
   ============================================================ */
import * as THREE from "three";
import { OrbitControls } from "./vendor/OrbitControls.js";

/* ---------------- Capture mode (headless verification) ---------------- */
const Q = new URLSearchParams(location.search);
const CAPTURE = Q.get("capture") === "1";
const CW = parseInt(Q.get("w") || "0", 10);
const CH = parseInt(Q.get("h") || "0", 10);
if (CAPTURE) document.body.classList.add("capture");

/* ---------------- Renderer / Scene / Camera ---------------- */
const canvas = document.getElementById("stage");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(CAPTURE && CW ? CW : window.innerWidth, CAPTURE && CH ? CH : window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf1e3cb, 22, 55);

const camera = new THREE.PerspectiveCamera(
  38,
  (CAPTURE && CW ? CW : window.innerWidth) / (CAPTURE && CH ? CH : window.innerHeight),
  0.05,
  120
);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.autoRotate = !CAPTURE;
controls.autoRotateSpeed = 0.7;
controls.minDistance = 0.35;
controls.maxDistance = 30;
controls.maxPolarAngle = 1.52;
controls.minPolarAngle = 0.08;

/* ---------------- Canvas texture helpers ---------------- */
function makeCanvas(w, h, draw) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
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
scene.background = gradientBackground("#f7ecd9", "#efdcbb");

/* ---------------- LDEC logo textures ---------------- */
function goldFill(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, "#f4e2a8");
  g.addColorStop(0.45, "#d9b45e");
  g.addColorStop(0.75, "#c9a24b");
  g.addColorStop(1, "#a8842e");
  return g;
}

/* The interlocked LDEC monogram on a 250x100 design grid */
function drawMonogram(ctx, ox, oy, w) {
  const s = w / 250;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(s, s);
  ctx.fillStyle = goldFill(ctx, 0, 100);
  /* L */
  ctx.fillRect(0, 0, 22, 100);
  ctx.fillRect(0, 78, 104, 22);
  /* D (with hole) */
  ctx.beginPath();
  ctx.moveTo(34, 0);
  ctx.lineTo(70, 0);
  ctx.quadraticCurveTo(104, 0, 104, 39);
  ctx.quadraticCurveTo(104, 78, 70, 78);
  ctx.lineTo(34, 78);
  ctx.closePath();
  ctx.moveTo(56, 20);
  ctx.lineTo(68, 20);
  ctx.quadraticCurveTo(82, 20, 82, 39);
  ctx.quadraticCurveTo(82, 58, 68, 58);
  ctx.lineTo(56, 58);
  ctx.closePath();
  ctx.fill("evenodd");
  /* E = three horizontal bars */
  ctx.fillRect(112, 0, 60, 18);
  ctx.fillRect(112, 41, 60, 18);
  ctx.fillRect(112, 82, 60, 18);
  /* C (ring open to the right) */
  const cx = 200, cy = 50, R = 50, r = 28, gap = 0.72;
  ctx.beginPath();
  ctx.arc(cx, cy, R, gap, Math.PI * 2 - gap, false);
  ctx.arc(cx, cy, r, Math.PI * 2 - gap, gap, true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWordmark(ctx, cx, y, size, text) {
  ctx.fillStyle = goldFill(ctx, y, y + size);
  ctx.font = `900 ${size}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${Math.round(size * 0.06)}px`;
  ctx.fillText(text, cx, y);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
}

/* monogram + LASHEEN (tower facade) */
const logoTex = makeCanvas(1024, 640, (ctx, w) => {
  drawMonogram(ctx, (w - 760) / 2, 26, 760);
  drawWordmark(ctx, w / 2, 372, 148, "LASHEEN");
});

/* full lockup with tagline (site signboard) */
const logoFullTex = makeCanvas(1024, 780, (ctx, w) => {
  drawMonogram(ctx, (w - 720) / 2, 20, 720);
  drawWordmark(ctx, w / 2, 340, 138, "LASHEEN");
  ctx.fillStyle = goldFill(ctx, 520, 570);
  ctx.font = "700 44px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("DESIGN & ENGINEERING CONTRACTING", w / 2, 524);
  ctx.font = "700 54px Arial, Helvetica, sans-serif";
  ctx.fillText("( LDEC )", w / 2, 610);
});

function logoMaterial(tex) {
  return new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    metalness: 0.85,
    roughness: 0.3,
    envMapIntensity: 1.5,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
}

/* ---------------- Surface textures ---------------- */
const facadeTex = makeCanvas(512, 512, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#9cc8ea");
  g.addColorStop(0.5, "#6f9fca");
  g.addColorStop(1, "#54809f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const cols = 6, rows = 10, pw = w / cols, ph = h / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const t = Math.random();
      ctx.fillStyle =
        t < 0.3
          ? `rgba(255,255,255,${0.03 + Math.random() * 0.08})`
          : t < 0.6
          ? `rgba(20,50,90,${0.02 + Math.random() * 0.06})`
          : "rgba(255,255,255,0.015)";
      ctx.fillRect(i * pw + 2, j * ph + 2, pw - 4, ph - 4);
    }
  }
  /* soft sky reflection band */
  const rg = ctx.createLinearGradient(0, 0, w, h);
  rg.addColorStop(0.25, "rgba(255,255,255,0)");
  rg.addColorStop(0.42, "rgba(255,255,255,0.12)");
  rg.addColorStop(0.55, "rgba(255,255,255,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, w, h);
  /* mullions */
  ctx.strokeStyle = "#3d608a";
  ctx.lineWidth = 3;
  for (let i = 0; i <= cols; i++) {
    ctx.beginPath(); ctx.moveTo(i * pw, 0); ctx.lineTo(i * pw, h); ctx.stroke();
  }
  ctx.lineWidth = 4;
  for (let j = 0; j <= rows; j++) {
    ctx.beginPath(); ctx.moveTo(0, j * ph); ctx.lineTo(w, j * ph); ctx.stroke();
  }
});
facadeTex.wrapS = facadeTex.wrapT = THREE.RepeatWrapping;
facadeTex.repeat.set(2, 6);

const pavementTex = makeCanvas(512, 512, (ctx, w, h) => {
  ctx.fillStyle = "#d9d6cf";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(120,115,105,${Math.random() * 0.08})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  ctx.strokeStyle = "#b6b2a9";
  ctx.lineWidth = 2;
  for (let i = 0; i <= 8; i++) {
    ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * 64); ctx.lineTo(w, i * 64); ctx.stroke();
  }
});
pavementTex.wrapS = pavementTex.wrapT = THREE.RepeatWrapping;
pavementTex.repeat.set(4, 4);

const sandTex = makeCanvas(512, 512, (ctx, w, h) => {
  ctx.fillStyle = "#c8a377";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    const t = Math.random();
    ctx.fillStyle = t < 0.5 ? `rgba(90,60,30,${Math.random() * 0.16})` : `rgba(255,235,200,${Math.random() * 0.14})`;
    const s = 1 + Math.random() * 3;
    ctx.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
  ctx.strokeStyle = "rgba(100,72,40,0.25)";
  ctx.lineWidth = 7;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, 0);
    ctx.bezierCurveTo(Math.random() * w, h * 0.3, Math.random() * w, h * 0.7, Math.random() * w, h);
    ctx.stroke();
  }
});
sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping;
sandTex.repeat.set(3, 2);

const concreteTex = makeCanvas(256, 256, (ctx, w, h) => {
  ctx.fillStyle = "#b8b3aa";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `rgba(70,66,60,${Math.random() * 0.1})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  ctx.strokeStyle = "rgba(90,86,80,0.3)";
  ctx.lineWidth = 2;
  for (let j = 0; j <= 4; j++) {
    ctx.beginPath(); ctx.moveTo(0, j * 64); ctx.lineTo(w, j * 64); ctx.stroke();
  }
});
concreteTex.wrapS = concreteTex.wrapT = THREE.RepeatWrapping;

const blueprintTex = makeCanvas(256, 192, (ctx, w, h) => {
  ctx.fillStyle = "#f3f6f9";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#2b5f9e";
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, w - 24, h - 24);
  ctx.strokeRect(30, 30, 90, 70);
  ctx.strokeRect(140, 30, 80, 50);
  ctx.strokeRect(30, 120, 60, 44);
  ctx.strokeRect(110, 100, 110, 64);
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath(); ctx.moveTo(30, 30 + i * 12); ctx.lineTo(120, 30 + i * 12); ctx.stroke();
  }
  ctx.strokeRect(180, 140, 40, 24);
});

/* ---------------- Environment & lights ---------------- */
const envTex = makeCanvas(256, 128, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#fff8ea");
  g.addColorStop(0.5, "#f3ddc2");
  g.addColorStop(1, "#c9a583");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const r = ctx.createRadialGradient(180, 28, 2, 180, 28, 48);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = r;
  ctx.fillRect(0, 0, w, h);
  const r2 = ctx.createRadialGradient(58, 52, 2, 58, 52, 32);
  r2.addColorStop(0, "rgba(255,232,200,0.85)");
  r2.addColorStop(1, "rgba(255,232,200,0)");
  ctx.fillStyle = r2;
  ctx.fillRect(0, 0, w, h);
});
envTex.mapping = THREE.EquirectangularReflectionMapping;
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromEquirectangular(envTex).texture;
scene.environmentIntensity = 0.6;
pmrem.dispose();

scene.add(new THREE.HemisphereLight(0xfff4e0, 0xc9b090, 0.55));
const key = new THREE.DirectionalLight(0xffe9c9, 1.7);
key.position.set(7, 11, 6);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -12;
key.shadow.camera.right = 12;
key.shadow.camera.top = 12;
key.shadow.camera.bottom = -12;
key.shadow.camera.far = 40;
key.shadow.bias = -0.0004;
scene.add(key);
const fill = new THREE.DirectionalLight(0xd8e8ff, 0.5);
fill.position.set(-8, 5, -5);
scene.add(fill);

/* floor */
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(48, 48),
  new THREE.MeshStandardMaterial({ color: 0xe9d7b8, roughness: 1 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

/* golden bokeh ambience */
const bokehSprite = makeCanvas(128, 128, (ctx) => {
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.5)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
});
function makePoints(n, rMin, rMax, yMin, yMax, size, opacity, color) {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = rMin + Math.random() * (rMax - rMin);
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = yMin + Math.random() * (yMax - yMin);
    pos[i * 3 + 2] = Math.sin(a) * r - 6;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    map: bokehSprite, size, transparent: true, opacity,
    color, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return pts;
}
const bokeh = makePoints(90, 9, 20, 1.5, 11, 0.9, 0.4, 0xffdf9e);

/* ---------------- Materials ---------------- */
const M = {
  navy: new THREE.MeshStandardMaterial({ color: 0x16283f, roughness: 0.42, metalness: 0.2 }),
  navyDeep: new THREE.MeshStandardMaterial({ color: 0x0f1e33, roughness: 0.5 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd9b45e, metalness: 1, roughness: 0.27 }),
  goldTrim: new THREE.MeshStandardMaterial({ color: 0xc9a24b, metalness: 1, roughness: 0.34 }),
  glass: new THREE.MeshPhysicalMaterial({
    map: facadeTex, metalness: 0.35, roughness: 0.12,
    envMapIntensity: 1.7, clearcoat: 0.6, clearcoatRoughness: 0.2,
  }),
  glassDark: new THREE.MeshPhysicalMaterial({
    color: 0x1c3a55, metalness: 0.4, roughness: 0.1, envMapIntensity: 1.6,
  }),
  roof: new THREE.MeshStandardMaterial({ color: 0x9fc0da, roughness: 0.5 }),
  pavement: new THREE.MeshStandardMaterial({ map: pavementTex, roughness: 0.85 }),
  sand: new THREE.MeshStandardMaterial({ map: sandTex, roughness: 1 }),
  sandDark: new THREE.MeshStandardMaterial({ color: 0xa8845c, roughness: 1 }),
  concrete: new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.9 }),
  concreteDark: new THREE.MeshStandardMaterial({ color: 0x9a958c, roughness: 0.95 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x9a7350, roughness: 0.8 }),
  woodLight: new THREE.MeshStandardMaterial({ color: 0xc8a06a, roughness: 0.75 }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xe8b13a, roughness: 0.45, metalness: 0.25 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.5 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x4a525c, roughness: 0.45, metalness: 0.7 }),
  rebar: new THREE.MeshStandardMaterial({ color: 0x6b4a3a, roughness: 0.7, metalness: 0.4 }),
  tire: new THREE.MeshStandardMaterial({ color: 0x26262a, roughness: 0.9 }),
  green: new THREE.MeshStandardMaterial({ color: 0x4a7c3f, roughness: 0.9 }),
  greenDark: new THREE.MeshStandardMaterial({ color: 0x3a6330, roughness: 0.9 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.9 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xe8b48c, roughness: 0.7 }),
  vest: new THREE.MeshStandardMaterial({ color: 0x1d3a63, roughness: 0.7 }),
  helmet: new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.35 }),
  asphalt: new THREE.MeshStandardMaterial({ color: 0x8f8c86, roughness: 0.95 }),
  windowDark: new THREE.MeshStandardMaterial({ color: 0x18242f, roughness: 0.2, metalness: 0.5 }),
  beacon: new THREE.MeshStandardMaterial({ color: 0xff4433, emissive: 0xff2211, emissiveIntensity: 1.6 }),
  lamp: new THREE.MeshStandardMaterial({ color: 0xfff2cc, emissive: 0xffdf9e, emissiveIntensity: 1.2 }),
  blueprint: new THREE.MeshStandardMaterial({ map: blueprintTex, roughness: 0.8 }),
};

/* ---------------- Small helpers ---------------- */
function mesh(geo, material, parent, pos, rot, scale) {
  const m = new THREE.Mesh(geo, material);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  if (scale) m.scale.set(...scale);
  m.castShadow = true;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, seg = 16) => new THREE.CylinderGeometry(rt, rb, h, seg);
const sph = (r, seg = 12) => new THREE.SphereGeometry(r, seg, seg);

function instanced(geo, mat, transforms, parent) {
  const im = new THREE.InstancedMesh(geo, mat, transforms.length);
  const M4 = new THREE.Matrix4();
  const Qt = new THREE.Quaternion();
  const Eu = new THREE.Euler();
  const Sc = new THREE.Vector3();
  const Pv = new THREE.Vector3();
  transforms.forEach((t, i) => {
    Pv.set(...t.p);
    Eu.set(...(t.r || [0, 0, 0]));
    Qt.setFromEuler(Eu);
    Sc.set(...(t.s || [1, 1, 1]));
    M4.compose(Pv, Qt, Sc);
    im.setMatrixAt(i, M4);
  });
  im.castShadow = true;
  im.receiveShadow = true;
  parent.add(im);
  return im;
}

/* thin bar between two points */
function bar(parent, a, b, r, mat) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const dir = new THREE.Vector3().subVectors(B, A);
  const len = dir.length();
  const m = new THREE.Mesh(cyl(r, r, len, 6), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = true;
  parent.add(m);
  return m;
}

/* ============================================================
   MODEL 1 — HQ GLASS TOWER MAQUETTE
   ============================================================ */
const towerModel = new THREE.Group();
towerModel.position.set(-4.6, 0, 0);
scene.add(towerModel);

/* pedestal */
mesh(cyl(2.95, 3.15, 0.5, 56), M.navy, towerModel, [0, 0.25, 0]);
mesh(new THREE.TorusGeometry(2.96, 0.045, 12, 72), M.gold, towerModel, [0, 0.5, 0], [Math.PI / 2, 0, 0]);
mesh(new THREE.TorusGeometry(3.12, 0.04, 12, 72), M.goldTrim, towerModel, [0, 0.05, 0], [Math.PI / 2, 0, 0]);
mesh(cyl(2.82, 2.82, 0.09, 56), M.pavement, towerModel, [0, 0.545, 0]);

const tower = new THREE.Group();
tower.position.y = 0.59;
towerModel.add(tower);

/* tapered glass shaft */
const TW = 2.3, TH = 6.2, TD = 2.1, TAPER = 0.16;
const shaftGeo = new THREE.BoxGeometry(TW, TH, TD, 1, 40, 1);
{
  const p = shaftGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = (p.getY(i) + TH / 2) / TH;
    const s = 1 - TAPER * t;
    p.setX(i, p.getX(i) * s);
    p.setZ(i, p.getZ(i) * s);
  }
  shaftGeo.computeVertexNormals();
}
mesh(shaftGeo, M.glass, tower, [0, TH / 2, 0]);

/* roof */
const topS = 1 - TAPER;
const rw = TW * topS, rd = TD * topS;
mesh(box(rw + 0.06, 0.1, 0.06), M.roof, tower, [0, TH + 0.05, rd / 2]);
mesh(box(rw + 0.06, 0.1, 0.06), M.roof, tower, [0, TH + 0.05, -rd / 2]);
mesh(box(0.06, 0.1, rd + 0.06), M.roof, tower, [rw / 2, TH + 0.05, 0]);
mesh(box(0.06, 0.1, rd + 0.06), M.roof, tower, [-rw / 2, TH + 0.05, 0]);
mesh(box(rw - 0.08, 0.06, rd - 0.08), M.roof, tower, [0, TH + 0.02, 0]);
mesh(box(0.7, 0.24, 0.5), M.concreteDark, tower, [0.2, TH + 0.17, -0.15]);
mesh(box(0.3, 0.14, 0.3), M.steel, tower, [-0.45, TH + 0.12, 0.3]);

/* entrance */
const entZ = (TD / 2) * (1 - TAPER * (0.3 / TH)) + 0.02;
mesh(box(1.5, 0.55, 0.08), M.glassDark, tower, [0, 0.28, entZ]);
for (let i = -1; i <= 1; i++) {
  mesh(box(0.03, 0.55, 0.1), M.goldTrim, tower, [i * 0.5, 0.28, entZ]);
}
mesh(box(1.7, 0.05, 0.35), M.navy, tower, [0, 0.6, entZ + 0.12]);

/* logo signage near the top (front + back) */
const logoY = 5.0;
const logoZ = (TD / 2) * (1 - TAPER * (logoY / TH)) + 0.035;
const logoPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 0.97), logoMaterial(logoTex));
logoPlane.position.set(0, logoY, logoZ);
tower.add(logoPlane);
const logoBack = logoPlane.clone();
logoBack.position.z = -logoZ;
logoBack.rotation.y = Math.PI;
tower.add(logoBack);

/* palms */
function palm(parent, x, z, s = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(s);
  parent.add(g);
  mesh(cyl(0.028, 0.045, 0.5, 8), M.trunk, g, [0, 0.25, 0], [0, 0, 0.06]);
  const top = new THREE.Group();
  top.position.set(0.03, 0.5, 0);
  g.add(top);
  mesh(sph(0.045, 8), M.greenDark, top);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const frond = mesh(new THREE.ConeGeometry(0.04, 0.4, 4), M.green, top);
    frond.position.set(Math.cos(a) * 0.15, 0.05, Math.sin(a) * 0.15);
    frond.rotation.set(Math.sin(a) * 1.75, 0, -Math.cos(a) * 1.75);
    frond.scale.set(1, 1, 0.35);
  }
  return g;
}
const palmSpots = [
  [1.9, 1.5, 1], [-1.95, 1.35, 0.9], [2.15, -0.9, 1.05],
  [-2.2, -0.8, 0.95], [0.9, 2.25, 0.85], [-1.1, 2.2, 0.9],
  [1.2, -2.2, 0.9], [-1.3, -2.15, 0.85],
];
palmSpots.forEach(([x, z, s]) => palm(towerModel, x, z, s).position.setY(0.59));

/* parking bays + tiny cars */
function car(parent, x, z, rot, color) {
  const g = new THREE.Group();
  g.position.set(x, 0.59, z);
  g.rotation.y = rot;
  parent.add(g);
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.4 });
  mesh(box(0.24, 0.06, 0.11), bodyMat, g, [0, 0.05, 0]);
  mesh(box(0.13, 0.05, 0.1), M.windowDark, g, [-0.01, 0.1, 0]);
  for (const [wx, wz] of [[-0.08, 0.055], [0.08, 0.055], [-0.08, -0.055], [0.08, -0.055]]) {
    mesh(cyl(0.026, 0.026, 0.02, 10), M.tire, g, [wx, 0.026, wz], [Math.PI / 2, 0, 0]);
  }
  return g;
}
const carColors = [0xf2f2f2, 0x2a2a2e, 0xb8342c, 0xd9d9d9, 0x355a8a, 0xeee8d8];
const carSpots = [
  [1.95, 0.35, 0], [1.95, 0.62, 0], [1.95, 0.89, 0],
  [-1.95, 0.3, Math.PI], [-1.95, 0.57, Math.PI], [0.3, -2.35, Math.PI / 2],
];
carSpots.forEach(([x, z, r], i) => car(towerModel, x, z, r, carColors[i % carColors.length]));
/* bay lines */
for (let i = 0; i < 4; i++) {
  mesh(box(0.3, 0.005, 0.015), M.white, towerModel, [1.95, 0.593, 0.22 + i * 0.27]);
  mesh(box(0.3, 0.005, 0.015), M.white, towerModel, [-1.95, 0.593, 0.17 + i * 0.27]);
}

/* tiny people */
function person(parent, x, y, z, shirt, helmetOn = false) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = Math.random() * Math.PI * 2;
  parent.add(g);
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.8 });
  mesh(new THREE.CapsuleGeometry(0.022, 0.055, 4, 8), shirtMat, g, [0, 0.06, 0]);
  mesh(sph(0.02, 8), M.skin, g, [0, 0.115, 0]);
  if (helmetOn) {
    mesh(new THREE.SphereGeometry(0.023, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.helmet, g, [0, 0.118, 0]);
  }
  return g;
}
[[0.6, 1.7, 0x8a4a3a], [-0.5, 1.8, 0x3a5a8a], [1.1, -1.6, 0x556b3f],
 [-1.2, -1.7, 0x777777], [0.2, 2.4, 0xb8912f], [-0.8, 2.35, 0x444444]]
  .forEach(([x, z, c]) => person(towerModel, x, 0.59, z, c));

/* street lamps */
for (let i = 0; i < 7; i++) {
  const a = (i / 7) * Math.PI * 2 + 0.3;
  const x = Math.cos(a) * 2.55, z = Math.sin(a) * 2.55;
  mesh(cyl(0.009, 0.012, 0.4, 6), M.steel, towerModel, [x, 0.79, z]);
  mesh(sph(0.022, 8), M.lamp, towerModel, [x, 1.0, z]);
}
/* hedges */
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2 + 0.55;
  const x = Math.cos(a) * 2.3, z = Math.sin(a) * 2.3;
  mesh(box(0.5, 0.09, 0.14), M.greenDark, towerModel, [x, 0.635, z], [0, -a, 0]);
}

/* ============================================================
   MODEL 2 — CONSTRUCTION SITE MAQUETTE
   ============================================================ */
const siteModel = new THREE.Group();
siteModel.position.set(4.6, 0, 0);
scene.add(siteModel);

/* base + gold trim */
mesh(box(6.4, 0.5, 4.6), M.navy, siteModel, [0, 0.25, 0]);
for (const y of [0.5, 0.04]) {
  mesh(box(6.46, 0.05, 0.05), M.gold, siteModel, [0, y, 2.3]);
  mesh(box(6.46, 0.05, 0.05), M.gold, siteModel, [0, y, -2.3]);
  mesh(box(0.05, 0.05, 4.66), M.gold, siteModel, [3.2, y, 0]);
  mesh(box(0.05, 0.05, 4.66), M.gold, siteModel, [-3.2, y, 0]);
}
mesh(box(6.1, 0.14, 4.3), M.sand, siteModel, [0, 0.57, 0]);
const GY = 0.64; /* ground level */
/* dirt road */
mesh(box(5.9, 0.012, 0.55), M.sandDark, siteModel, [0, GY + 0.006, 1.45]);

/* ---- building under construction ---- */
const bld = new THREE.Group();
bld.position.set(-0.7, GY, -0.45);
siteModel.add(bld);
const FLOORS = 4, FH = 0.6, BW = 2.5, BD = 1.9;
for (let f = 0; f <= FLOORS; f++) {
  mesh(box(BW, 0.07, BD), M.concrete, bld, [0, f * FH, 0]);
  /* edge beams */
  mesh(box(BW, 0.09, 0.06), M.concreteDark, bld, [0, f * FH - 0.06, BD / 2 - 0.03]);
  mesh(box(BW, 0.09, 0.06), M.concreteDark, bld, [0, f * FH - 0.06, -BD / 2 + 0.03]);
}
/* columns */
const colT = [];
for (let f = 0; f < FLOORS; f++) {
  for (let ix = 0; ix < 4; ix++) {
    for (let iz = 0; iz < 3; iz++) {
      if (f === FLOORS - 1 && (ix + iz) % 2 === 0) continue; /* partial top floor */
      colT.push({ p: [-1.05 + ix * 0.7, f * FH + FH / 2, -0.75 + iz * 0.75] });
    }
  }
}
instanced(box(0.09, FH - 0.07, 0.09), M.concrete, colT, bld);
/* formwork panels on top */
for (let i = 0; i < 5; i++) {
  mesh(box(0.42, 0.22, 0.03), M.woodLight, bld, [-1.0 + i * 0.5, FLOORS * FH + 0.14, BD / 2 - 0.05], [0.12, 0, 0]);
}
mesh(box(0.03, 0.22, 0.8), M.woodLight, bld, [-BW / 2 + 0.05, FLOORS * FH + 0.14, 0.3], [0, 0, -0.12]);
/* rebar sticking up */
const rebarT = [];
for (let ix = 0; ix < 4; ix++) {
  for (let iz = 0; iz < 3; iz++) {
    for (let k = 0; k < 3; k++) {
      rebarT.push({
        p: [-1.05 + ix * 0.7 + (k - 1) * 0.025, FLOORS * FH + 0.16, -0.75 + iz * 0.75 + (k % 2) * 0.02],
        r: [(Math.random() - 0.5) * 0.12, 0, (Math.random() - 0.5) * 0.12],
      });
    }
  }
}
instanced(cyl(0.007, 0.007, 0.3, 5), M.rebar, rebarT, bld);
/* scaffolding on front + right side */
const scaffoldMat = new THREE.MeshStandardMaterial({ color: 0x7d8894, roughness: 0.5, metalness: 0.6 });
const scafT = [];
for (let i = 0; i < 6; i++) {
  scafT.push({ p: [-1.15 + i * 0.46, FH * 2, BD / 2 + 0.14], s: [1, 4, 1] });
}
for (let j = 0; j < 5; j++) {
  scafT.push({ p: [0, 0.25 + j * 0.5, BD / 2 + 0.14], r: [0, 0, Math.PI / 2], s: [1, 4.2, 1] });
}
for (let i = 0; i < 5; i++) {
  scafT.push({ p: [BW / 2 + 0.14, FH * 2, -0.8 + i * 0.4], s: [1, 4, 1] });
}
for (let j = 0; j < 5; j++) {
  scafT.push({ p: [BW / 2 + 0.14, 0.25 + j * 0.5, 0], r: [Math.PI / 2, 0, 0], s: [1, 3.2, 1] });
}
instanced(cyl(0.012, 0.012, 0.6, 6), scaffoldMat, scafT, bld);
/* plank decks */
for (let j = 0; j < 3; j++) {
  mesh(box(2.5, 0.02, 0.24), M.wood, bld, [0, 0.55 + j * 0.62, BD / 2 + 0.14]);
}

/* ---- tower cranes ---- */
const slews = [];
const hangs = [];
const beacons = [];
function latticeMast(parent, h, w) {
  const segs = Math.round(h / 0.28);
  const chords = [];
  for (const [cx, cz] of [[-w, -w], [w, -w], [-w, w], [w, w]]) {
    chords.push({ p: [cx, h / 2, cz], s: [1, h / 0.28, 1] });
  }
  instanced(cyl(0.014, 0.014, 0.28, 5), M.yellow, chords, parent);
  const braces = [];
  for (let s = 0; s < segs; s++) {
    const y = s * 0.28 + 0.14;
    const dir = s % 2 === 0 ? 1 : -1;
    braces.push({ p: [0, y, w], r: [0, 0, dir * 0.95], s: [1, 1.25, 1] });
    braces.push({ p: [0, y, -w], r: [0, 0, -dir * 0.95], s: [1, 1.25, 1] });
    braces.push({ p: [w, y, 0], r: [dir * 0.95, 0, 0], s: [1, 1.25, 1] });
    braces.push({ p: [-w, y, 0], r: [-dir * 0.95, 0, 0], s: [1, 1.25, 1] });
  }
  instanced(cyl(0.008, 0.008, 0.28, 4), M.yellow, braces, parent);
}
function latticeJib(parent, len, w) {
  const segs = Math.round(len / 0.26);
  const chords = [
    { p: [len / 2, 0, -w], r: [0, 0, Math.PI / 2], s: [1, len / 0.26, 1] },
    { p: [len / 2, 0, w], r: [0, 0, Math.PI / 2], s: [1, len / 0.26, 1] },
    { p: [len / 2, w * 1.6, 0], r: [0, 0, Math.PI / 2], s: [1, len / 0.26, 1] },
  ];
  instanced(cyl(0.012, 0.012, 0.26, 5), M.yellow, chords, parent);
  const braces = [];
  for (let s = 0; s < segs; s++) {
    const x = s * 0.26 + 0.13;
    const dir = s % 2 === 0 ? 1 : -1;
    braces.push({ p: [x, w * 0.8, -w * 0.5], r: [0.6, 0, dir * 0.9], s: [1, 1.1, 1] });
    braces.push({ p: [x, w * 0.8, w * 0.5], r: [-0.6, 0, dir * 0.9], s: [1, 1.1, 1] });
    braces.push({ p: [x, 0, 0], r: [Math.PI / 2, 0, 0], s: [1, 1, 1] });
  }
  instanced(cyl(0.007, 0.007, 0.26, 4), M.yellow, braces, parent);
}
function crane(parent, x, z, h, jibLen, rot) {
  const g = new THREE.Group();
  g.position.set(x, GY, z);
  g.rotation.y = rot;
  parent.add(g);
  mesh(box(0.34, 0.12, 0.34), M.concreteDark, g, [0, 0.06, 0]);
  latticeMast(g, h, 0.075);
  const slew = new THREE.Group();
  slew.position.y = h;
  g.add(slew);
  slews.push({ g: slew, base: Math.random() * Math.PI * 2, speed: 0.05 + Math.random() * 0.05 });
  mesh(cyl(0.09, 0.09, 0.08, 12), M.steel, slew, [0, 0.04, 0]);
  mesh(box(0.15, 0.13, 0.13), M.yellow, slew, [0.12, 0.14, 0]);
  mesh(box(0.02, 0.08, 0.1), M.windowDark, slew, [0.2, 0.14, 0]);
  /* jib + counter-jib */
  const jib = new THREE.Group();
  jib.position.y = 0.22;
  slew.add(jib);
  latticeJib(jib, jibLen, 0.05);
  const cj = new THREE.Group();
  cj.rotation.y = Math.PI;
  jib.add(cj);
  latticeJib(cj, 0.65, 0.05);
  mesh(box(0.2, 0.14, 0.14), M.concreteDark, cj, [0.58, -0.04, 0]);
  /* peak + ties */
  mesh(box(0.035, 0.34, 0.035), M.yellow, slew, [0, 0.42, 0]);
  bar(slew, [0, 0.58, 0], [jibLen * 0.55, 0.26, 0], 0.006, M.steel);
  bar(slew, [0, 0.58, 0], [jibLen * 0.95, 0.24, 0], 0.005, M.steel);
  bar(slew, [0, 0.58, 0], [-0.6, 0.24, 0], 0.006, M.steel);
  /* trolley + hook */
  const tx = jibLen * 0.62;
  mesh(box(0.08, 0.05, 0.09), M.steel, jib, [tx, -0.03, 0]);
  const hang = new THREE.Group();
  hang.position.set(tx, -0.05, 0);
  jib.add(hang);
  const L = h * 0.45;
  const cable = mesh(cyl(0.004, 0.004, L, 4), M.steel, hang, [0, -L / 2, 0]);
  const hook = mesh(box(0.05, 0.07, 0.035), M.yellow, hang, [0, -L, 0]);
  hangs.push({ cable, hook, L, phase: Math.random() * 6 });
  /* beacon */
  const bc = mesh(sph(0.02, 8), M.beacon.clone(), slew, [0, 0.62, 0]);
  beacons.push(bc);
  return g;
}
crane(siteModel, -2.35, -1.5, 4.1, 2.3, 0.5);
crane(siteModel, 1.75, -1.55, 3.3, 1.9, -0.7);
crane(siteModel, 2.5, 0.9, 2.7, 1.5, 2.4);

/* ---- vehicles ---- */
function excavator(parent, x, z, rot) {
  const g = new THREE.Group();
  g.position.set(x, GY, z);
  g.rotation.y = rot;
  parent.add(g);
  mesh(box(0.32, 0.07, 0.08), M.tire, g, [0, 0.035, 0.08]);
  mesh(box(0.32, 0.07, 0.08), M.tire, g, [0, 0.035, -0.08]);
  mesh(box(0.24, 0.08, 0.18), M.yellow, g, [-0.02, 0.11, 0]);
  mesh(box(0.1, 0.1, 0.1), M.yellow, g, [0.05, 0.2, 0.04]);
  mesh(box(0.02, 0.06, 0.08), M.windowDark, g, [0.105, 0.2, 0.04]);
  const boom = new THREE.Group();
  boom.position.set(0.12, 0.14, -0.04);
  boom.rotation.z = -0.7;
  g.add(boom);
  mesh(box(0.26, 0.045, 0.04), M.yellow, boom, [0.13, 0, 0]);
  const stick = new THREE.Group();
  stick.position.set(0.26, 0, 0);
  stick.rotation.z = 1.5;
  boom.add(stick);
  mesh(box(0.18, 0.035, 0.03), M.yellow, stick, [0.09, 0, 0]);
  mesh(box(0.07, 0.06, 0.08), M.steel, stick, [0.2, -0.02, 0]);
  return g;
}
function dumpTruck(parent, x, z, rot, bedColor) {
  const g = new THREE.Group();
  g.position.set(x, GY, z);
  g.rotation.y = rot;
  parent.add(g);
  mesh(box(0.38, 0.04, 0.14), M.steel, g, [0, 0.06, 0]);
  mesh(box(0.1, 0.11, 0.14), M.white, g, [0.15, 0.13, 0]);
  mesh(box(0.02, 0.06, 0.11), M.windowDark, g, [0.205, 0.14, 0]);
  mesh(box(0.24, 0.09, 0.15), bedColor, g, [-0.06, 0.13, 0], [0, 0, 0.04]);
  for (const wx of [-0.13, -0.02, 0.13]) {
    mesh(cyl(0.035, 0.035, 0.025, 10), M.tire, g, [wx, 0.035, 0.08], [Math.PI / 2, 0, 0]);
    mesh(cyl(0.035, 0.035, 0.025, 10), M.tire, g, [wx, 0.035, -0.08], [Math.PI / 2, 0, 0]);
  }
  return g;
}
function loader(parent, x, z, rot) {
  const g = new THREE.Group();
  g.position.set(x, GY, z);
  g.rotation.y = rot;
  parent.add(g);
  mesh(box(0.24, 0.09, 0.14), M.yellow, g, [0, 0.1, 0]);
  mesh(box(0.09, 0.09, 0.1), M.yellow, g, [-0.04, 0.19, 0]);
  mesh(box(0.02, 0.05, 0.08), M.windowDark, g, [0.01, 0.19, 0]);
  mesh(box(0.1, 0.06, 0.16), M.steel, g, [0.19, 0.05, 0], [0, 0, 0.25]);
  for (const [wx, wz] of [[-0.09, 0.08], [0.09, 0.08], [-0.09, -0.08], [0.09, -0.08]]) {
    mesh(cyl(0.045, 0.045, 0.03, 10), M.tire, g, [wx, 0.045, wz], [Math.PI / 2, 0, 0]);
  }
  return g;
}
excavator(siteModel, -2.3, 0.7, 0.8);
excavator(siteModel, 0.9, -1.7, -2.2);
dumpTruck(siteModel, -1.1, 1.45, 0.1, M.yellow);
dumpTruck(siteModel, 0.6, 1.5, -0.15, M.steel);
dumpTruck(siteModel, 2.2, -0.6, 1.9, M.yellow);
loader(siteModel, -1.9, 1.6, -0.5);
loader(siteModel, 1.6, 0.4, 2.6);
/* pickup */
{
  const g = new THREE.Group();
  g.position.set(2.7, GY, 1.6);
  g.rotation.y = 0.4;
  siteModel.add(g);
  mesh(box(0.26, 0.06, 0.12), M.white, g, [0, 0.06, 0]);
  mesh(box(0.1, 0.06, 0.11), M.white, g, [0.05, 0.12, 0]);
  mesh(box(0.02, 0.04, 0.09), M.windowDark, g, [0.105, 0.12, 0]);
  for (const [wx, wz] of [[-0.09, 0.06], [0.09, 0.06], [-0.09, -0.06], [0.09, -0.06]]) {
    mesh(cyl(0.03, 0.03, 0.02, 8), M.tire, g, [wx, 0.03, wz], [Math.PI / 2, 0, 0]);
  }
}

/* ---- engineers + blueprint table + survey tripod ---- */
const tableG = new THREE.Group();
tableG.position.set(0.9, GY, 0.75);
siteModel.add(tableG);
mesh(box(0.42, 0.02, 0.28), M.wood, tableG, [0, 0.16, 0]);
for (const [lx, lz] of [[-0.18, -0.11], [0.18, -0.11], [-0.18, 0.11], [0.18, 0.11]]) {
  mesh(cyl(0.012, 0.012, 0.16, 6), M.wood, tableG, [lx, 0.08, lz]);
}
mesh(new THREE.PlaneGeometry(0.36, 0.24), M.blueprint, tableG, [0, 0.172, 0], [-Math.PI / 2, 0, 0.1]);
mesh(cyl(0.014, 0.014, 0.2, 8), M.white, tableG, [0.16, 0.185, 0.08], [0, 0, Math.PI / 2]);
person(siteModel, 0.72, GY, 0.55, 0x1d3a63, true).rotation.y = 0.7;
person(siteModel, 1.08, GY, 0.52, 0x1d3a63, true).rotation.y = -0.5;
person(siteModel, 0.95, GY, 1.0, 0x1d3a63, true).rotation.y = 3.0;
/* tripod */
{
  const g = new THREE.Group();
  g.position.set(0.35, GY, 1.05);
  siteModel.add(g);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    bar(g, [0, 0.2, 0], [Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08], 0.006, M.wood);
  }
  mesh(box(0.05, 0.05, 0.05), M.yellow, g, [0, 0.23, 0]);
  mesh(cyl(0.012, 0.012, 0.05, 8), M.windowDark, g, [0, 0.27, 0]);
}

/* ---- project signboard with the full logo ---- */
{
  const g = new THREE.Group();
  g.position.set(2.55, GY, 1.85);
  g.rotation.y = -0.35;
  siteModel.add(g);
  mesh(cyl(0.02, 0.02, 0.55, 8), M.steel, g, [-0.4, 0.27, 0]);
  mesh(cyl(0.02, 0.02, 0.55, 8), M.steel, g, [0.4, 0.27, 0]);
  mesh(box(1.05, 0.68, 0.045), M.navy, g, [0, 0.72, 0]);
  mesh(box(1.09, 0.03, 0.05), M.goldTrim, g, [0, 1.07, 0]);
  mesh(box(1.09, 0.03, 0.05), M.goldTrim, g, [0, 0.37, 0]);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.7), logoMaterial(logoFullTex));
  sign.position.set(0, 0.72, 0.028);
  g.add(sign);
}

/* ---- site extras: container office, piles, gravel ---- */
{
  const g = new THREE.Group();
  g.position.set(-2.55, GY, 1.55);
  g.rotation.y = 0.15;
  siteModel.add(g);
  mesh(box(0.75, 0.3, 0.32), new THREE.MeshStandardMaterial({ color: 0x2a5a8a, roughness: 0.6 }), g, [0, 0.15, 0]);
  mesh(box(0.12, 0.2, 0.02), M.white, g, [-0.2, 0.12, 0.17]);
  mesh(box(0.14, 0.1, 0.02), M.windowDark, g, [0.12, 0.18, 0.17]);
  mesh(box(0.78, 0.03, 0.35), M.white, g, [0, 0.315, 0]);
}
for (const [x, z, r] of [[-1.6, -1.7, 0.2], [0.2, -1.8, 0.16], [2.6, -1.5, 0.19]]) {
  mesh(new THREE.ConeGeometry(r, r * 0.75, 10), M.sandDark, siteModel, [x, GY + r * 0.37, z]);
}
/* rebar bundle */
for (let i = 0; i < 6; i++) {
  mesh(cyl(0.01, 0.01, 0.5, 5), M.rebar, siteModel, [-0.2 + (i % 3) * 0.025, GY + 0.012 + Math.floor(i / 3) * 0.02, 1.9], [0, 0, Math.PI / 2]);
}
/* plank stack */
for (let i = 0; i < 4; i++) {
  mesh(box(0.4, 0.02, 0.14), M.woodLight, siteModel, [1.9, GY + 0.015 + i * 0.022, -1.8], [0, 0.2, 0]);
}

/* dust motes over the site */
const dust = makePoints(50, 0.2, 3, 0.8, 3.4, 0.12, 0.35, 0xe8cfa0);
dust.position.set(4.6, 0, 6);

/* ============================================================
   CAMERA VIEWS & NAVIGATION
   ============================================================ */
const VIEWS = {
  both: { pos: [0.6, 6.6, 15.6], tgt: [0, 2.1, 0] },
  tower: { pos: [0.6, 5.8, 10.6], tgt: [-4.6, 3.5, 0] },
  site: { pos: [9.4, 5.6, 9.0], tgt: [4.6, 2.0, 0] },
  logo: { pos: [-4.55, 5.75, 3.3], tgt: [-4.6, 5.55, 0.9] },
  crane: { pos: [4.4, 4.6, 1.4], tgt: [6.35, 3.6, -1.55] },
};
let tween = null;
function flyTo(name, instant = false) {
  const v = VIEWS[name];
  if (!v) return;
  const p1 = new THREE.Vector3(...v.pos);
  const t1 = new THREE.Vector3(...v.tgt);
  if (instant) {
    camera.position.copy(p1);
    controls.target.copy(t1);
    tween = null;
    return;
  }
  tween = {
    t: 0, dur: 1.4,
    p0: camera.position.clone(), p1,
    t0: controls.target.clone(), t1,
  };
}
flyTo("both", true);
controls.addEventListener("start", () => { tween = null; });

function dolly(f) {
  const off = camera.position.clone().sub(controls.target);
  const len = THREE.MathUtils.clamp(off.length() * f, controls.minDistance, controls.maxDistance);
  off.setLength(len);
  camera.position.copy(controls.target).add(off);
  tween = null;
}

/* double-click: focus on the picked point */
const ray = new THREE.Raycaster();
const ptr = new THREE.Vector2();
renderer.domElement.addEventListener("dblclick", (e) => {
  ptr.x = (e.clientX / window.innerWidth) * 2 - 1;
  ptr.y = -(e.clientY / window.innerHeight) * 2 + 1;
  ray.setFromCamera(ptr, camera);
  const hits = ray.intersectObjects([towerModel, siteModel], true);
  if (!hits.length) return;
  const p = hits[0].point;
  const off = camera.position.clone().sub(controls.target);
  off.setLength(Math.max(0.9, off.length() * 0.35));
  tween = {
    t: 0, dur: 1.0,
    p0: camera.position.clone(), p1: p.clone().add(off),
    t0: controls.target.clone(), t1: p.clone(),
  };
});

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

document.querySelectorAll(".view").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".view").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    flyTo(btn.dataset.view);
  });
});

$("zoomInBtn").addEventListener("click", () => dolly(0.72));
$("zoomOutBtn").addEventListener("click", () => dolly(1.38));
$("rotateBtn").addEventListener("click", (e) => {
  controls.autoRotate = !controls.autoRotate;
  e.currentTarget.classList.toggle("active", controls.autoRotate);
  toast(controls.autoRotate ? "الدوران التلقائي: تشغيل" : "الدوران التلقائي: إيقاف");
});
$("resetBtn").addEventListener("click", () => {
  flyTo("both");
  document.querySelectorAll(".view").forEach((b) => b.classList.toggle("active", b.dataset.view === "both"));
  toast("تمت إعادة ضبط الكاميرا");
});
$("shotBtn").addEventListener("click", () => {
  const w = window.innerWidth, h = window.innerHeight;
  const pr = renderer.getPixelRatio();
  renderer.setPixelRatio(Math.min(pr * 2, 4));
  renderer.setSize(w, h);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL("image/png");
  renderer.setPixelRatio(pr);
  renderer.setSize(w, h);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ldec-maquette-3d.png";
  a.click();
  toast("تم حفظ لقطة عالية الدقة");
});

setTimeout(() => $("hint").classList.add("fade"), 10000);

/* ---------------- Animation ---------------- */
const clock = new THREE.Clock();
let loaderHidden = false;

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  /* camera tween */
  if (tween) {
    tween.t += dt / tween.dur;
    const k = tween.t >= 1 ? 1 : tween.t * tween.t * (3 - 2 * tween.t);
    camera.position.lerpVectors(tween.p0, tween.p1, k);
    controls.target.lerpVectors(tween.t0, tween.t1, k);
    if (tween.t >= 1) tween = null;
  }

  /* living site: cranes slew, hooks bob, beacons pulse */
  slews.forEach((s, i) => {
    s.g.rotation.y = s.base + Math.sin(t * s.speed + i * 2.1) * 0.55;
  });
  hangs.forEach((h) => {
    const s = 1 + Math.sin(t * 0.55 + h.phase) * 0.05;
    h.cable.scale.y = s;
    h.cable.position.y = (-h.L * s) / 2;
    h.hook.position.y = -h.L * s;
  });
  beacons.forEach((b, i) => {
    b.material.emissiveIntensity = 1.2 + Math.max(0, Math.sin(t * 2.4 + i * 1.7)) * 1.6;
  });

  bokeh.rotation.y = t * 0.015;
  dust.rotation.y = t * 0.05;
  dust.material.opacity = 0.25 + Math.sin(t * 0.8) * 0.1;

  controls.update();
  renderer.render(scene, camera);

  if (!loaderHidden) {
    loaderHidden = true;
    document.getElementById("loader").classList.add("done");
    window.__ready = true;
  }
}
renderer.setAnimationLoop(animate);

/* ---------------- Resize ---------------- */
window.addEventListener("resize", () => {
  if (CAPTURE) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------------- Headless verification hooks ---------------- */
window.__setView = (name) => flyTo(name, true);
window.__dolly = (f) => dolly(f);
window.__renderNow = () => renderer.render(scene, camera);
