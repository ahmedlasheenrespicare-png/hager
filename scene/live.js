/* ============================================================
   هاجر — الصورة الحية (living photo)
   The EXACT attached 3D render, brought to life:
   segmented figurine layer warped with breathing / head-tilt /
   sway / hijab motion over a reconstructed background plate,
   handheld push-in camera, depth parallax, sparkles, light sweep.
   Deterministic renderFrame(t) for offline capture.
   ============================================================ */
import * as THREE from "three";

const params = new URLSearchParams(location.search);
const CAPTURE = params.has("capture");
const W = parseInt(params.get("w") || "720", 10);
const H = parseInt(params.get("h") || "1280", 10);
const FPS = 30, DUR = 12;
if (CAPTURE) document.body.classList.add("capture");

const IMG_W = 1024, IMG_H = 1536;
const PLANE_H = 4.0, PLANE_W = PLANE_H * IMG_W / IMG_H;

const phone = document.getElementById("phone");
const canvas = document.getElementById("stage");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 9 / 16, 0.1, 60);

function sizeRenderer() {
  const w = CAPTURE ? W : phone.clientWidth;
  const h = CAPTURE ? H : phone.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const band = (x, a, b) => smooth(a - 40, a + 40, x) * (1 - smooth(b - 40, b + 40, x));

/* ---------------- Textures / layers ---------------- */
const loader = new THREE.TextureLoader();
let readyCount = 0;
function tex(path, onReady) {
  const t = loader.load(path, (tt) => {
    tt.colorSpace = THREE.SRGBColorSpace;
    tt.anisotropy = 4;
    tt.generateMipmaps = true;
    tt.minFilter = THREE.LinearMipmapLinearFilter;
    readyCount++;
    if (onReady) onReady(tt);
  });
  return t;
}

/* background plate (pedestal intact, person inpainted out) */
const BG_DEPTH = 0.5;
const BG_SCALE = 1.12;
const bgMat = new THREE.MeshBasicMaterial({ map: tex("./assets/layer-bg.png"), toneMapped: false });
const bg = new THREE.Mesh(new THREE.PlaneGeometry(PLANE_W * BG_SCALE, PLANE_H * BG_SCALE), bgMat);
bg.position.set(0, 0, -BG_DEPTH);
bg.renderOrder = 1;
scene.add(bg);
/* same plate as screen-space fallback so camera shake never reveals black edges */
scene.background = bgMat.map;

/* figurine layer — subdivided for warp */
const personMat = new THREE.MeshBasicMaterial({
  map: tex("./assets/layer-person.png"),
  transparent: true,
  toneMapped: false,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const SEG_X = 40, SEG_Y = 60;
const personGeo = new THREE.PlaneGeometry(PLANE_W, PLANE_H, SEG_X, SEG_Y);
const person = new THREE.Mesh(personGeo, personMat);
person.renderOrder = 2;
scene.add(person);

/* precompute per-vertex weights from pixel coords */
const posAttr = personGeo.attributes.position;
const base = new Float32Array(posAttr.array);
const VN = posAttr.count;
const vpx = new Float32Array(VN), vpy = new Float32Array(VN);
const wUpper = new Float32Array(VN), wHead = new Float32Array(VN),
  wTorso = new Float32Array(VN), wDrape = new Float32Array(VN), wArm = new Float32Array(VN);
for (let i = 0; i < VN; i++) {
  const x = base[i * 3], y = base[i * 3 + 1];
  const u = x / PLANE_W + 0.5, v = y / PLANE_H + 0.5;
  const px = u * IMG_W, py = (1 - v) * IMG_H;
  vpx[i] = px; vpy[i] = py;
  wUpper[i] = 1 - smooth(900, 1240, py);
  wHead[i] = 1 - smooth(250, 360, py);
  wTorso[i] = band(py, 320, 760);
  wDrape[i] = band(py, 300, 960) * band(px, 330, 650);
  wArm[i] = band(py, 280, 720) * (1 - band(px, 400, 620));
}
const SX = PLANE_W / IMG_W, SY = PLANE_H / IMG_H;
const PIV_X = 500, PIV_Y = 310;

function warpPerson(t) {
  const stepEnv = 1 - smooth(4.8, 6.0, t);
  const sway = 0.012 * Math.sin(t * 0.9);
  const bob = 0.006 * Math.sin(t * 1.4);
  const step = 0.010 * Math.abs(Math.sin(t * Math.PI * 1.7)) * stepEnv;
  const headA = 0.022 * Math.sin(t * 0.6) + 0.012 * Math.sin(t * 0.27 + 1) + 0.02 * smooth(5.0, 6.4, t);
  const breathe = Math.sin(t * 1.4 + 0.5);
  const arr = posAttr.array;
  for (let i = 0; i < VN; i++) {
    const px = vpx[i], py = vpy[i];
    let dx = sway * wUpper[i];
    let dy = (bob + step) * wUpper[i];
    /* breathing chest */
    dy += 0.004 * breathe * wTorso[i];
    dx += (px - 512) * 0.00002 * breathe * wTorso[i];
    /* hijab drape sway */
    dx += 0.008 * Math.sin(t * 1.2 + py * 0.008) * wDrape[i];
    /* arms micro-motion */
    dy += 0.003 * Math.sin(t * 1.1 + 1) * wArm[i];
    /* head tilt around neck pivot */
    const hw = wHead[i];
    if (hw > 0.001) {
      const a = headA * hw;
      const rx = px - PIV_X, ry = py - PIV_Y;
      const ca = Math.cos(a), sa = Math.sin(a);
      const nx = PIV_X + rx * ca - ry * sa;
      const ny = PIV_Y + rx * sa + ry * ca;
      dx += (nx - px) * SX;
      dy += -(ny - py) * SY;
    }
    arr[i * 3] = base[i * 3] + dx;
    arr[i * 3 + 1] = base[i * 3 + 1] + dy;
  }
  posAttr.needsUpdate = true;
}

/* ---------------- Sparkles + light sweep ---------------- */
function makeCanvas(w, h, draw) {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const sparkSprite = makeCanvas(64, 64, (ctx) => {
  const g = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,240,210,0.6)");
  g.addColorStop(1, "rgba(255,240,210,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
});
let seed = 17;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const SP_N = 90;
const spPos = new Float32Array(SP_N * 3);
for (let i = 0; i < SP_N; i++) {
  spPos[i * 3] = (rnd() - 0.5) * 3.2;
  spPos[i * 3 + 1] = -1.6 + rnd() * 3.8;
  spPos[i * 3 + 2] = 0.15 + rnd() * 0.9;
}
const spGeo = new THREE.BufferGeometry();
spGeo.setAttribute("position", new THREE.BufferAttribute(spPos, 3));
const spMat = new THREE.PointsMaterial({
  size: 0.05, map: sparkSprite, transparent: true, opacity: 0.8,
  color: 0xfff1d6, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
});
const sparkles = new THREE.Points(spGeo, spMat);
sparkles.renderOrder = 3;
scene.add(sparkles);

const sweepTex = makeCanvas(256, 256, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.45, "rgba(255,246,225,0)");
  g.addColorStop(0.5, "rgba(255,246,225,0.9)");
  g.addColorStop(0.55, "rgba(255,246,225,0)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
});
const sweep = new THREE.Mesh(
  new THREE.PlaneGeometry(3.4, 5.2),
  new THREE.MeshBasicMaterial({ map: sweepTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
);
sweep.position.z = 0.4;
sweep.renderOrder = 4;
scene.add(sweep);

/* ---------------- Overlay handles ---------------- */
const bar = document.getElementById("bar");
const disc = document.getElementById("disc");
const likeIcon = document.getElementById("likeIcon");
const likeCount = document.getElementById("likeCount");
const endcard = document.getElementById("endcard");
const bigHeart = document.getElementById("bigHeart");

/* ---------------- Choreography ---------------- */
function renderFrame(t) {
  t = clamp(t, 0, DUR);
  const pushP = smooth(1.5, 9.5, t);
  const settle = smooth(5.0, 6.4, t);

  warpPerson(t);
  person.scale.setScalar(1 + 0.04 * smooth(0.5, 6, t));
  person.position.x = 0.03 * Math.sin(t * 0.8) * (1 - smooth(4.8, 6.0, t));
  person.rotation.z = 0.006 * Math.sin(t * 0.7) * (1 - settle);

  /* sparkles */
  sparkles.rotation.z = t * 0.02;
  const burst = Math.exp(-Math.pow(t - 6.7, 2) * 2);
  spMat.opacity = 0.45 + 0.25 * Math.sin(t * 2.2) + 0.4 * burst;
  spMat.size = 0.05 * (1 + 1.4 * burst);

  /* light sweep across the figurine */
  const sw = (t % 6) / 6;
  sweep.position.x = lerp(-2.2, 2.2, sw);
  sweep.material.opacity = 0.10 * Math.sin(sw * Math.PI) * (0.4 + 0.6 * settle);

  /* handheld camera push-in */
  const sx = 0.02 * Math.sin(t * 7.3) + 0.012 * Math.sin(t * 13.7 + 1.7);
  const sy = 0.018 * Math.sin(t * 9.1 + 0.6) + 0.01 * Math.sin(t * 15.3) + 0.014 * Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 * 1.7)), 3) * (1 - settle);
  const sz = 0.015 * Math.sin(t * 6.1 + 2.1);
  const z = lerp(7.4, 4.3, pushP);
  const lookY = lerp(0.15, 0.95, pushP);
  camera.position.set(sx, lookY + sy, z + sz);
  camera.lookAt(0.008 * Math.sin(t * 8.7 + 3), lookY + 0.008 * Math.sin(t * 10.3 + 1), 0);
  camera.rotation.z += 0.006 * Math.sin(t * 1.3) + 0.004 * Math.sin(t * 2.9 + 1);

  /* overlay */
  bar.style.width = ((t / DUR) * 100).toFixed(2) + "%";
  disc.style.transform = `rotate(${(t * 120).toFixed(1)}deg)`;
  const liked = t > 6.65;
  likeIcon.classList.toggle("liked", liked);
  likeCount.textContent = liked ? "12.5K" : "12.4K";
  likeIcon.style.transform = `scale(${(1 + 0.25 * Math.exp(-Math.pow((t - 6.75) * 5, 2))).toFixed(3)})`;
  const bh = Math.exp(-Math.pow((t - 6.9) * 3.2, 2));
  bigHeart.style.opacity = bh.toFixed(3);
  bigHeart.style.transform = `translate(-50%,-50%) scale(${(0.6 + 0.5 * bh).toFixed(3)}) rotate(-8deg)`;
  const e = smooth(10.3, 11.0, t);
  endcard.style.opacity = e.toFixed(3);
  endcard.style.transform = `scale(${(0.85 + 0.15 * easeOutBack(e)).toFixed(3)})`;

  renderer.render(scene, camera);
}

/* ---------------- Boot ---------------- */
sizeRenderer();
window.addEventListener("resize", sizeRenderer);
window.renderFrame = renderFrame;

function boot() {
  renderFrame(0);
  window.__ready = true;
  if (!CAPTURE) {
    let start = performance.now();
    document.getElementById("replayBtn").addEventListener("click", () => (start = performance.now()));
    const loop = () => {
      renderFrame(((performance.now() - start) / 1000) % DUR);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
const waitTex = setInterval(() => {
  if (readyCount >= 2) {
    clearInterval(waitTex);
    document.fonts.ready.then(boot);
  }
}, 50);
