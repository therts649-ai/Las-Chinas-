// Prueba de realismo: la gelatina 3D de fresa con leche bajo luz de estudio.
// Compilar con `npm run build:3d` → assets/js/escena3d.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const BASE = document.querySelector('meta[name="assets"]')?.content || '../assets/';
const host = document.querySelector('.escena');
const small = Math.min(innerWidth, innerHeight) < 700;

// ---------- Render ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.6 : 2));
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
if ('transmissionResolutionScale' in renderer) renderer.transmissionResolutionScale = small ? 0.6 : 1;
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
camera.position.set(0, 1.55, small ? 6.2 : 5.0);

// Fondo de estudio rosa (degradado suave) — también es lo que se ve a través de la gelatina
const bgCanvas = document.createElement('canvas');
bgCanvas.width = 16; bgCanvas.height = 256;
const bg = bgCanvas.getContext('2d');
const grad = bg.createLinearGradient(0, 0, 0, 256);
grad.addColorStop(0, '#f9d9dc');
grad.addColorStop(0.55, '#f2c3c8');
grad.addColorStop(1, '#e9aeb6');
bg.fillStyle = grad; bg.fillRect(0, 0, 16, 256);
const bgTex = new THREE.CanvasTexture(bgCanvas);
bgTex.colorSpace = THREE.SRGBColorSpace;
scene.background = bgTex;

// Iluminación: HDRI de estudio + luz principal con sombra + contraluz
const pmrem = new THREE.PMREMGenerator(renderer);
new HDRLoader().load(`${BASE}3d/estudio.hdr`, (hdr) => {
  scene.environment = pmrem.fromEquirectangular(hdr).texture;
  scene.environmentIntensity = 0.75;
  hdr.dispose();
});
const key = new THREE.DirectionalLight('#fff4ea', 1.8);
key.position.set(-3, 5, 3);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 15 });
key.shadow.radius = 8;
key.shadow.blurSamples = 16;
key.shadow.bias = -0.0005;
scene.add(key);
const rim = new THREE.DirectionalLight('#ffd0dc', 1.6);
rim.position.set(2.5, 2.5, -4);
scene.add(rim);

// Mesa: solo recibe la sombra
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ color: '#7a2038', opacity: 0.22 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// ---------- Materiales ----------
const tl = new THREE.TextureLoader();
const tex = (name, srgb = true, repeat) => {
  const t = tl.load(`${BASE}3d/${name}`);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
};

// Temblor de gelatina: desplazamiento en el vértice según la altura (la base queda fija)
const jiggle = { uSway: { value: new THREE.Vector2() }, uSquash: { value: 0 }, uTime: { value: 0 } };
function withJiggle(mat) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, jiggle);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform vec2 uSway; uniform float uSquash; uniform float uTime;`)
      .replace('#include <project_vertex>', `
        vec4 wp = modelMatrix * vec4(transformed, 1.0);
        float h = clamp((wp.y - 0.035) / 0.82, 0.0, 1.0);
        float w = h * h * (3.0 - 2.0 * h);
        wp.xz += uSway * w;
        wp.y *= 1.0 - uSquash * w;
        wp.xz *= 1.0 + uSquash * 0.5 * w;
        wp.y += sin(uTime * 2.1 + wp.x * 3.0) * 0.003 * w;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;`);
  };
  return mat;
}

const jelly = withJiggle(new THREE.MeshPhysicalMaterial({
  color: '#ff3350',
  roughness: 0.03,
  transmission: 1,
  thickness: 0.55,
  ior: 1.34,
  attenuationColor: new THREE.Color('#e0102e'),
  attenuationDistance: 0.6,
  specularIntensity: 1,
  clearcoat: 0.7,
  clearcoatRoughness: 0.04,
}));
const milkMap = tex('leche-color.webp', true, [1, 9]);
const milkCapMap = tex('leche-color.webp', true, [1, 2]);
const milk = withJiggle(new THREE.MeshPhysicalMaterial({
  color: '#fff9f4',
  map: milkMap,
  roughness: 0.34,
  transmission: 0.22,
  thickness: 0.8,
  attenuationColor: new THREE.Color('#ffd9d2'),
  attenuationDistance: 0.6,
  sheen: 0.6,
  sheenColor: new THREE.Color('#ffe6ea'),
  clearcoat: 0.45,
  clearcoatRoughness: 0.12,
}));
const skin = withJiggle(new THREE.MeshPhysicalMaterial({
  map: tex('fresa-color.webp'),
  normalMap: tex('fresa-normal.webp', false),
  normalScale: new THREE.Vector2(0.9, 0.9),
  roughness: 0.3,
  clearcoat: 0.55,
  clearcoatRoughness: 0.12,
  sheen: 0.25,
  sheenColor: new THREE.Color('#ff9aa8'),
}));
const cut = withJiggle(new THREE.MeshPhysicalMaterial({
  map: tex('fresa-corte.webp'),
  roughness: 0.4,
  clearcoat: 0.7,
  clearcoatRoughness: 0.1,
}));
const milkCap = withJiggle(milk.clone());
milkCap.map = milkCapMap;
const leaf = new THREE.MeshPhysicalMaterial({ map: tex('hoja-color.webp'), roughness: 0.6, side: THREE.DoubleSide, sheen: 0.3, sheenColor: new THREE.Color('#bfffaa') });
const plate = new THREE.MeshPhysicalMaterial({ color: '#f4ece8', roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.06 });
const plainSkin = new THREE.MeshPhysicalMaterial({ map: skin.map, normalMap: skin.normalMap, normalScale: skin.normalScale, roughness: 0.3, clearcoat: 0.55, clearcoatRoughness: 0.12, sheen: 0.25, sheenColor: skin.sheenColor });
const MATS = {
  GelatinaFresa: jelly, GelatinaFresa_corte: jelly,
  GelatinaLeche: milk, GelatinaLeche_corte: milkCap,
  FresaPiel: skin, FresaCorte: cut, Hoja: leaf, Plato: plate,
};

// ---------- Modelo ----------
let model = null;
const caps = [];
new GLTFLoader().load(`${BASE}3d/gelatina.glb`, (gltf) => {
  model = gltf.scene;
  model.traverse((o) => {
    if (!o.isMesh) return;
    const name = o.material?.name;
    const loose = /^Fresa_entera|^Hojas_/.test(o.name) || /^Fresa_entera/.test(o.parent?.name || '');
    o.material = loose && name === 'FresaPiel' ? plainSkin : (MATS[name] || plate);
    o.castShadow = true;
    o.receiveShadow = name === 'Plato';
    // Las tapas de los cortes solo se ven cuando los gajos se separan
    if (/_corte$/.test(name)) { o.visible = false; caps.push(o); }
  });
  scene.add(model);
  document.documentElement.classList.add('is-ready');
});

// ---------- Acabado: brillo suave ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.1, 0.3, 2.4);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- Cámara: girar con el dedo, con límites ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.38, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minDistance = 3.2;
controls.maxDistance = 8;
controls.minPolarAngle = 0.35;
controls.maxPolarAngle = 1.42;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.6;

// ---------- Física del temblor (resorte amortiguado) ----------
const spring = { x: 0, z: 0, s: 0, vx: 0, vz: 0, vs: 0 };
function poke(dirX, dirZ, force = 1) {
  spring.vx += dirX * 0.9 * force;
  spring.vz += dirZ * 0.9 * force;
  spring.vs += 0.55 * force;
}
const ray = new THREE.Raycaster();
let down = null;
renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6 || !model) return;
  const r = renderer.domElement.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  const hit = ray.intersectObject(model, true)[0];
  if (!hit) return;
  const d = hit.point.clone().setY(0).normalize().negate();
  poke(d.x, d.z, 1.1);
  controls.autoRotate = false;
  clearTimeout(poke.t);
  poke.t = setTimeout(() => { controls.autoRotate = true; }, 4000);
});

// ---------- Tamaño y ciclo ----------
function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  renderer.setSize(w, h);
  composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(host);
resize();

const clock = new THREE.Timer();
let visible = true;
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
renderer.setAnimationLoop(() => {
  if (!visible) return;
  clock.update();
  const dt = Math.min(clock.getDelta(), 1 / 30);
  // resorte: rigidez 90, amortiguamiento 7
  for (const [p, v] of [['x', 'vx'], ['z', 'vz'], ['s', 'vs']]) {
    spring[v] += (-90 * spring[p] - 7 * spring[v]) * dt;
    spring[p] += spring[v] * dt;
  }
  jiggle.uSway.value.set(spring.x * 0.12, spring.z * 0.12);
  jiggle.uSquash.value = spring.s * 0.08;
  jiggle.uTime.value = clock.getElapsed();
  controls.update();
  composer.render();
});

// Un temblor de bienvenida
setTimeout(() => poke(0.6, 0.3, 1.2), 900);
