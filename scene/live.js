/* ============================================================
   هاجر — الصورة الحية (natural walk, articulated legs)
   The EXACT attached render as a puppet: torso/head/arms layer
   warped for breathe + head-tilt + hijab sway; each leg is a
   separate layer rotating about its hip (hidden by the coat),
   giving a real stride. Forward locomotion + handheld camera.
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
const SX = PLANE_W / IMG_W, SY = PLANE_H / IMG_H;
const px2x = (px) => (px / IMG_W - 0.5) * PLANE_W;
const py2y = (py) => (0.5 - py / IMG_H) * PLANE_H;

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

/* ---------------- layers ---------------- */
const loader = new THREE.TextureLoader();
let readyCount = 0;
function tex(path) {
  return loader.load(path, (tt) => {
    tt.colorSpace = THREE.SRGBColorSpace;
    tt.anisotropy = 4;
    tt.generateMipmaps = true;
    tt.minFilter = THREE.LinearMipmapLinearFilter;
    readyCount++;
  });
}
function photoMat(t) {
  return new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide });
}

const BG_DEPTH = 0.5, BG_SCALE = 1.12;
const bgMat = new THREE.MeshBasicMaterial({ map: tex("./assets/layer-bg.png"), toneMapped: false });
const bg = new THREE.Mesh(new THREE.PlaneGeometry(PLANE_W * BG_SCALE, PLANE_H * BG_SCALE), bgMat);
bg.position.set(0, 0, -BG_DEPTH);
bg.renderOrder = 1;
scene.add(bg);
scene.background = bgMat.map;

const figure = new THREE.Group();
scene.add(figure);

/* legs (rigid rotation about hip) */
const legL = new THREE.Mesh(new THREE.PlaneGeometry(PLANE_W, PLANE_H), photoMat(tex("./assets/layer-legL.png")));
const legR = new THREE.Mesh(new THREE.PlaneGeometry(PLANE_W, PLANE_H), photoMat(tex("./assets/layer-legR.png")));
legL.renderOrder = 2; legR.renderOrder = 2;
figure.add(legL, legR);
const HIP_L = { x: px2x(452), y: py2y(1000) };
const HIP_R = { x: px2x(566), y: py2y(1000) };
function setLeg(mesh, hip, a) {
  const ca = Math.cos(a), sa = Math.sin(a);
  mesh.rotation.z = a;
  mesh.position.set(hip.x - (hip.x * ca - hip.y * sa), hip.y - (hip.x * sa + hip.y * ca), 0);
}

/* torso (warped) */
const SEG_X = 48, SEG_Y = 72;
const torsoGeo = new THREE.PlaneGeometry(PLANE_W, PLANE_H, SEG_X, SEG_Y);
const torso = new THREE.Mesh(torsoGeo, photoMat(tex("./assets/layer-torso.png")));
torso.renderOrder = 3;
figure.add(torso);

const posAttr = torsoGeo.attributes.position;
const base = new Float32Array(posAttr.array);
const VN = posAttr.count;
const vpx = new Float32Array(VN), vpy = new Float32Array(VN);
const wUpper = new Float32Array(VN), wHead = new Float32Array(VN),
  wTorso = new Float32Array(VN), wDrape = new Float32Array(VN), wArm = new Float32Array(VN);
for (let i = 0; i < VN; i++) {
  const x = base[i * 3], y = base[i * 3 + 1];
  const px = (x / PLANE_W + 0.5) * IMG_W, py = (0.5 - y / PLANE_H) * IMG_H;
  vpx[i] = px; vpy[i] = py;
  wUpper[i] = 1 - smooth(900, 1000, py);
  wHead[i] = 1 - smooth(250, 360, py);
  wTorso[i] = band(py, 320, 760);
  wDrape[i] = band(py, 300, 960) * band(px, 330, 650);
  wArm[i] = band(py, 280, 720) * (1 - band(px, 400, 620));
}
const PIV_X = 500, PIV_Y = 310;

function warpTorso(t, phi, walkEnv) {
  const sway = 0.012 * Math.sin(t * 0.9);
  const bob = 0.013 * Math.abs(Math.sin(phi)) * walkEnv + 0.005 * Math.sin(t * 1.4) * (1 - walkEnv);
  const headA = 0.02 * Math.sin(t * 0.6) + 0.012 * Math.sin(t * 0.27 + 1) + 0.025 * smooth(5.2, 6.6, t);
  const headNod = 0.005 * Math.sin(phi * 2) * walkEnv;
  const breathe = Math.sin(t * 1.4 + 0.5);
  const arr = posAttr.array;
  for (let i = 0; i < VN; i++) {
    const px = vpx[i], py = vpy[i];
    let dx = sway * wUpper[i];
    let dy = bob * wUpper[i] + headNod * wHead[i];
    dy += 0.004 * breathe * wTorso[i];
    dx += (px - 512) * 0.00002 * breathe * wTorso[i];
    dx += 0.008 * Math.sin(t * 1.2 + py * 0.008) * wDrape[i];
    dy += 0.003 * Math.sin(t * 1.1 + 1) * wArm[i];
    const hw = wHead[i];
    if (hw > 0.001) {
      const a = headA * hw;
      const rx = px - PIV_X, ry = py - PIV_Y;
      const ca = Math.cos(a), sa = Math.sin(a);
      dx += (PIV_X + rx * ca - ry * sa - px) * SX;
      dy += -(PIV_Y + rx * sa + ry * ca - py) * SY;
    }
    arr[i * 3] = base[i * 3] + dx;
    arr[i * 3 + 1] = base[i * 3 + 1] + dy;
  }
  posAttr.needsUpdate = true;
}

/* ---------------- sparkles + sweep ---------------- */
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
const spMat = new THREE.PointsMaterial({ size: 0.05, map: sparkSprite, transparent: true, opacity: 0.8, color: 0xfff1d6, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
const sparkles = new THREE.Points(spGeo, spMat);
sparkles.renderOrder = 4;
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
const sweep = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 5.2), new THREE.MeshBasicMaterial({ map: sweepTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
sweep.position.z = 0.4;
sweep.renderOrder = 5;
scene.add(sweep);

/* ---------------- overlay ---------------- */
const bar = document.getElementById("bar");
const disc = document.getElementById("disc");
const likeIcon = document.getElementById("likeIcon");
const likeCount = document.getElementById("likeCount");
const endcard = document.getElementById("endcard");
const bigHeart = document.getElementById("bigHeart");

/* ---------------- choreography ---------------- */
function renderFrame(t) {
  t = clamp(t, 0, DUR);
  const phi = t * (Math.PI * 2 / 0.9);
  const walkEnv = 1 - smooth(4.6, 6.0, t);
  const settle = smooth(5.2, 6.6, t);
  const pushP = smooth(2.0, 9.5, t);

  warpTorso(t, phi, walkEnv);
  const legAmp = 0.18 * walkEnv;
  setLeg(legL, HIP_L, legAmp * Math.sin(phi));
  setLeg(legR, HIP_R, legAmp * Math.sin(phi + Math.PI));

  const approach = smooth(0.3, 5.2, t);
  figure.position.z = 0.55 * approach;
  figure.scale.setScalar(1 + 0.03 * settle);
  figure.position.x = 0.02 * Math.sin(phi * 0.5) * walkEnv;
  figure.rotation.y = 0.03 * Math.sin(phi * 0.5) * walkEnv;
  figure.rotation.z = 0.008 * Math.sin(phi) * walkEnv + 0.006 * Math.sin(t * 0.7) * settle;

  sparkles.rotation.z = t * 0.02;
  const burst = Math.exp(-Math.pow(t - 6.7, 2) * 2);
  spMat.opacity = 0.45 + 0.25 * Math.sin(t * 2.2) + 0.4 * burst;
  spMat.size = 0.05 * (1 + 1.4 * burst);
  const sw = (t % 6) / 6;
  sweep.position.x = lerp(-2.2, 2.2, sw);
  sweep.material.opacity = 0.10 * Math.sin(sw * Math.PI) * (0.4 + 0.6 * settle);

  const stepShake = 0.014 * Math.pow(Math.max(0, Math.sin(phi)), 3) * walkEnv;
  const sx = 0.02 * Math.sin(t * 7.3) + 0.012 * Math.sin(t * 13.7 + 1.7);
  const sy = 0.018 * Math.sin(t * 9.1 + 0.6) + 0.01 * Math.sin(t * 15.3) + stepShake;
  const sz = 0.015 * Math.sin(t * 6.1 + 2.1);
  const z = lerp(7.8, 4.3, pushP);
  const lookY = lerp(0.15, 0.95, pushP);
  camera.position.set(sx, lookY + sy, z + sz);
  camera.lookAt(0.008 * Math.sin(t * 8.7 + 3), lookY + 0.008 * Math.sin(t * 10.3 + 1), 0);
  camera.rotation.z += 0.006 * Math.sin(t * 1.3) + 0.004 * Math.sin(t * 2.9 + 1);

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

/* ---------------- boot ---------------- */
sizeRenderer();
window.addEventListener("resize", sizeRenderer);
window.renderFrame = renderFrame;
function boot() {
  renderFrame(0);
  window.__ready = true;
  if (!CAPTURE) {
    let start = performance.now();
    document.getElementById("replayBtn").addEventListener("click", () => (start = performance.now()));
    const loop = () => { renderFrame(((performance.now() - start) / 1000) % DUR); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
}
const waitTex = setInterval(() => {
  if (readyCount >= 4) { clearInterval(waitTex); document.fonts.ready.then(boot); }
}, 50);
