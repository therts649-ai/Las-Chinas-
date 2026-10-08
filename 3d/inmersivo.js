// Apertura inmersiva de Las Chinas.
// La foto real de la gelatina, separada en capas (herramientas/capas.py), vive en
// un espacio 3D: la cámara sigue al mouse, las capas se abren, las fresas orbitan,
// la cámara se mete dentro de la gelatina y sale con todo armado otra vez.
// Compilar con `npm run build:inmersivo` → assets/js/inmersivo.js
import * as THREE from 'three';
import Lenis from 'lenis';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);

const BASE = document.querySelector('meta[name="assets"]')?.content || '../assets/';
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = matchMedia('(hover: none)').matches;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

// ---------- Desplazamiento suave ----------
const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();

// ---------- Render ----------
const canvas = $('.inm-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.5 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);

// Proporción de las capas (1500 × 860)
const W = 3;
const H = W * 860 / 1500;

// ---------- Carga con progreso ----------
const manager = new THREE.LoadingManager();
const bar = $('.inm-loader__bar span');
const pct = $('.inm-loader__pct');
manager.onProgress = (_u, done, total) => {
  const p = done / total;
  bar.style.transform = `scaleX(${p})`;
  pct.textContent = `${Math.round(p * 100)}%`;
};
const loader = new THREE.TextureLoader(manager);
const small = innerWidth < 800;
const tex = (name) => {
  const t = loader.load(`${BASE}capas/${name}${small && name !== 'fresa-mitad' ? '-m' : ''}.webp`);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
};

// ---------- Gelatina: capas con temblor y brillo ----------
const shared = {
  uTime: { value: 0 },
  uSway: { value: new THREE.Vector2() },
  uSquash: { value: 0 },
  uMouse: { value: new THREE.Vector2(0.5, 0.6) },
  uGlint: { value: 1 },
};

const layerVert = /* glsl */`
  uniform vec2 uSway; uniform float uSquash; uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    // 0 en la base de la leche, 1 arriba de la fresa: la base no se mueve
    float h = clamp((uv.y - 0.12) / (0.95 - 0.12), 0.0, 1.0);
    float w = h * h * (3.0 - 2.0 * h);
    p.x += uSway.x * w + (uv.x - 0.5) * uSquash * 0.22 * w;
    p.y += uSway.y * w * 0.3 - uSquash * w * 0.22;
    p.x += sin(uTime * 1.6 + uv.y * 5.0) * 0.0025 * w;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const layerFrag = /* glsl */`
  uniform sampler2D map; uniform vec2 uMouse; uniform float uGlint; uniform float uTime; uniform float uOpacity; uniform float uShine;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv;
    vec2 d = (uv - uMouse) * vec2(1.744, 1.0);
    float r = length(d);
    // Onda de refracción alrededor del cursor, como ver a través de gelatina
    uv += normalize(d + 1e-5) * sin(r * 46.0 - uTime * 3.2) * 0.0022 * uShine * smoothstep(0.32, 0.0, r);
    vec4 c = texture2D(map, uv);
    float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    // Destello que sigue la luz del cursor sobre las partes brillantes
    float g = smoothstep(0.26, 0.0, r) * smoothstep(0.45, 0.95, lum) * uGlint * uShine;
    c.rgb += g * 0.32;
    gl_FragColor = vec4(c.rgb, c.a * uOpacity);
    #include <colorspace_fragment>
  }
`;
function layer(name, z, shine = 1) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...shared, map: { value: tex(name) }, uOpacity: { value: 1 }, uShine: { value: shine } },
    vertexShader: layerVert,
    fragmentShader: layerFrag,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H, 48, 28), m);
  mesh.position.z = z;
  return mesh;
}
const gel = new THREE.Group();
const plato = layer('plato', 0, 0.3);
const leche = new THREE.Group();
const tapa = layer('leche-tapa', 0.001, 0.4);
const lecheCara = layer('leche', 0.002, 0.6);
leche.add(tapa, lecheCara);
const fresa = layer('fresa', 0.004, 1);
gel.add(plato, leche, fresa);
scene.add(gel);
// Orden fijo de dibujo: así la cara de la leche nunca queda encima de la fresa
plato.renderOrder = 2;
tapa.renderOrder = 3;
lecheCara.renderOrder = 4;
fresa.renderOrder = 5;

// Sombra suave bajo el plato
const sombra = new THREE.Mesh(
  new THREE.PlaneGeometry(W * 1.05, H * 0.5),
  new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0.55 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uOpacity; varying vec2 vUv; void main(){ float d = length((vUv - 0.5) * vec2(1.0, 2.2)); gl_FragColor = vec4(0.05, 0.0, 0.02, smoothstep(0.5, 0.0, d) * uOpacity); }',
    transparent: true,
    depthWrite: false,
  }),
);
sombra.position.set(0.02, -H * 0.44, -0.01);
sombra.renderOrder = 1;
gel.add(sombra);

// ---------- Nombre enorme detrás de la gelatina ----------
function textTexture(text, font, w, h, color) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.font = font;
  x.fillStyle = color;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
const nombre = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.8), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0 }));
nombre.position.set(0, 1.0, -1.6);
nombre.renderOrder = 0;
scene.add(nombre);

// ---------- Fresas que orbitan ----------
const fresaTex = tex('fresa-mitad');
const orbitas = [];
const N = small ? 9 : 14;
for (let i = 0; i < N; i++) {
  const s = 0.18 + Math.random() * 0.22;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 301 / 304), new THREE.MeshBasicMaterial({ map: fresaTex, transparent: true, depthWrite: false, opacity: 0 }));
  orbitas.push({
    m,
    a: (i / N) * Math.PI * 2 + Math.random() * 0.4,
    rx: 1.9 + Math.random() * 0.9,
    rz: 1.1 + Math.random() * 0.7,
    y: -0.3 + Math.random() * 1.1,
    v: 0.08 + Math.random() * 0.1,
    spin: (Math.random() - 0.5) * 1.2,
    rot: Math.random() * Math.PI * 2,
  });
  scene.add(m);
}

// ---------- Destellos de azúcar flotando ----------
const dotC = document.createElement('canvas');
dotC.width = dotC.height = 64;
const dg = dotC.getContext('2d');
const gr = dg.createRadialGradient(32, 32, 0, 32, 32, 32);
gr.addColorStop(0, 'rgba(255,235,240,1)');
gr.addColorStop(0.35, 'rgba(255,180,205,.45)');
gr.addColorStop(1, 'rgba(255,180,205,0)');
dg.fillStyle = gr;
dg.fillRect(0, 0, 64, 64);
const P = small ? 140 : 260;
const pos = new Float32Array(P * 3);
for (let i = 0; i < P; i++) {
  pos[i * 3] = (Math.random() - 0.5) * 9;
  pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
  pos[i * 3 + 2] = -3 + Math.random() * 6;
}
const pg = new THREE.BufferGeometry();
pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const polvo = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.05, map: new THREE.CanvasTexture(dotC), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7 }));
polvo.renderOrder = 20;
scene.add(polvo);

// ---------- Dentro de la gelatina (pantalla completa) ----------
const dentro = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uOpacity: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
    vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: /* glsl */`
      uniform float uTime; uniform float uOpacity; uniform vec2 uRes;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec2 p = gl_FragCoord.xy / uRes;
        vec2 q = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
        float t = uTime;
        // Rojo profundo con luz que entra desde arriba
        vec3 deep = vec3(0.035, 0.0, 0.003);
        vec3 lit = vec3(0.42, 0.008, 0.025);
        vec3 col = mix(deep, lit, smoothstep(-0.1, 1.2, p.y) * 0.85);
        // Cáusticas: la luz ondulando a través de la gelatina
        float c = 0.0;
        vec2 w = q * 6.0;
        for (int i = 0; i < 3; i++) {
          w += vec2(sin(w.y * 1.3 + t * 0.7), cos(w.x * 1.1 - t * 0.6)) * 0.55;
          c += abs(sin(w.x + w.y));
        }
        c = pow(1.0 - c / 3.0, 3.0);
        col += vec3(1.0, 0.35, 0.3) * c * 0.32 * smoothstep(-0.2, 1.0, p.y);
        // Rayos de luz diagonales
        float ray = pow(max(0.0, sin(q.x * 3.0 + q.y * 1.4 + t * 0.15) * 0.5 + 0.5), 8.0);
        col += vec3(1.0, 0.6, 0.6) * ray * 0.18 * p.y;
        // Burbujas que suben
        vec2 g = q * vec2(7.0, 7.0);
        g.y -= t * 0.35;
        vec2 id = floor(g);
        vec2 f = fract(g) - 0.5;
        float rnd = hash(id);
        vec2 o = vec2(hash(id + 3.1) - 0.5, hash(id + 7.7) - 0.5) * 0.6;
        float rad = 0.05 + rnd * 0.12;
        float d = length(f - o);
        float ring = smoothstep(rad, rad - 0.02, d) - smoothstep(rad - 0.025, rad - 0.05, d);
        float spec = smoothstep(rad * 0.35, 0.0, length(f - o - vec2(-rad * 0.35, rad * 0.35)));
        float on = step(0.55, rnd);
        col += vec3(1.0, 0.6, 0.6) * (ring * 0.16 + spec * 0.4) * on;
        // Viñeta
        col *= 1.0 - 0.35 * length(q);
        gl_FragColor = vec4(col, uOpacity);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  }),
);
dentro.frustumCulled = false;
dentro.renderOrder = 999;
scene.add(dentro);

// ---------- Estado que mueve el scroll ----------
const S = {
  camZ: 9, camY: 0.9, lookY: 0.05, lookX: 0,
  sep: 0,          // separación de capas
  orbit: 0,        // 0 fresas escondidas · 1 orbitando
  dive: 0,         // 0 → 1 la cámara entra a la fresa
  inside: 0,       // velo rojo de "dentro de la gelatina"
  nombre: 0,
  drop: 1.6,       // la gelatina cae al cargar
  spin: 0,
};

// ---------- Mouse y temblor ----------
const mouse = new THREE.Vector2(0, 0);
const target = new THREE.Vector2(0, 0);
addEventListener('pointermove', (e) => {
  target.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
});
const spring = { x: 0, y: 0, s: 0, vx: 0, vy: 0, vs: 0 };
function poke(fx, fy, f = 1) {
  spring.vx += fx * f;
  spring.vy += fy * f;
  spring.vs += 0.9 * f;
}
const ray = new THREE.Raycaster();
canvas.addEventListener('pointerdown', (e) => {
  ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  const hit = ray.intersectObject(fresa)[0] || ray.intersectObject(lecheCara)[0];
  if (hit) poke(-(hit.uv.x - 0.5) * 1.6, 0.2, 1.1);
});

// ---------- Tamaño ----------
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // En pantallas angostas se abre el encuadre para que quepa la gelatina completa
  const ancho = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect * 5.4;
  camera.zoom = Math.min(1, ancho / 3.5);
  camera.updateProjectionMatrix();
  dentro.material.uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
}
addEventListener('resize', resize);
resize();

// ---------- Ciclo ----------
const clock = new THREE.Timer();
const look = new THREE.Vector3();
const planeHit = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const hitP = new THREE.Vector3();
function frame() {
  clock.update();
  const dt = Math.min(clock.getDelta(), 1 / 30);
  const t = clock.getElapsed();
  shared.uTime.value = t;

  // Mouse suavizado (en celular, un vaivén lento)
  if (touch) target.set(Math.sin(t * 0.35) * 0.35, Math.cos(t * 0.27) * 0.2);
  mouse.lerp(target, 0.06);

  // Resorte del temblor
  for (const [p, v] of [['x', 'vx'], ['y', 'vy'], ['s', 'vs']]) {
    spring[v] += (-110 * spring[p] - 8 * spring[v]) * dt;
    spring[p] += spring[v] * dt;
  }
  shared.uSway.value.set(spring.x * 0.08, spring.y * 0.05);
  shared.uSquash.value = spring.s * 0.06;

  // Capas: se abren hacia arriba y hacia la cámara
  gel.position.y = S.drop;
  leche.position.set(0, S.sep * 0.16, S.sep * 0.18);
  fresa.position.set(S.sep * 0.02, S.sep * 0.46, S.sep * 0.42);
  fresa.rotation.z = -S.sep * 0.03;
  gel.rotation.y = Math.sin(t * 0.25) * 0.05 * (1 - S.dive) + S.spin;

  // Cámara: parallax con el mouse y el recorrido del scroll
  const par = 1 - S.dive;
  camera.position.set(mouse.x * 0.45 * par + S.lookX * S.dive, S.camY + mouse.y * 0.22 * par, S.camZ);
  look.set(S.lookX * S.dive + mouse.x * 0.05, S.lookY, 0);
  camera.lookAt(look);

  // Punto del cursor sobre la gelatina, para el brillo y la onda
  ray.setFromCamera(mouse, camera);
  planeHit.constant = -fresa.position.z;
  if (ray.ray.intersectPlane(planeHit, hitP)) {
    shared.uMouse.value.set(hitP.x / W + 0.5, (hitP.y - S.drop - fresa.position.y) / H + 0.5);
  }

  // Fresas en órbita, pasando por delante y por detrás
  orbitas.forEach((o) => {
    o.a += o.v * dt * (0.6 + S.orbit);
    const k = 0.55 + 0.45 * S.orbit;
    o.m.position.set(Math.cos(o.a) * o.rx * k, o.y + Math.sin(o.a * 2 + o.rot) * 0.08 + S.drop * 0.3, Math.sin(o.a) * o.rz * k);
    o.m.quaternion.copy(camera.quaternion);
    o.rot += o.spin * dt;
    o.m.rotateZ(o.rot);
    o.m.material.opacity = S.orbit * (1 - S.inside);
    // Las que pasan por detrás se dibujan antes que la gelatina, las de enfrente después
    o.m.renderOrder = o.m.position.z < fresa.position.z ? 1.5 : 10;
  });

  polvo.rotation.y = t * 0.02;
  polvo.position.y = Math.sin(t * 0.2) * 0.1;
  nombre.material.opacity = S.nombre;
  dentro.material.uniforms.uOpacity.value = S.inside;
  dentro.visible = S.inside > 0.001;

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(frame);

// ---------- Entrada al cargar y coreografía con el scroll ----------
manager.onLoad = async () => {
  await document.fonts.load('italic 600 200px "Cormorant Garamond"').catch(() => {});
  nombre.material.map = textTexture('Las Chinas', 'italic 600 250px "Cormorant Garamond"', 2048, 512, 'rgba(255, 196, 214, 0.92)');
  nombre.material.needsUpdate = true;

  root.classList.add('is-loaded');
  const intro = gsap.timeline({ onComplete: () => { lenis.start(); root.classList.add('is-ready'); } });
  intro
    .to('.inm-loader', { opacity: 0, duration: 0.6, ease: 'power2.out' })
    .set('.inm-loader', { display: 'none' })
    .to(S, { camZ: 5.4, camY: 0.35, duration: 2.4, ease: 'power3.inOut' }, 0.2)
    .to(S, { drop: 0, duration: 1.1, ease: 'power2.in' }, 0.7)
    .call(() => poke(0, -0.4, 1.5), null, 1.8)
    .to(S, { nombre: 1, duration: 1.4, ease: 'power2.out' }, 1.6)
    .to(S, { orbit: 0.35, duration: 2, ease: 'power2.out' }, 1.8)
    .from('.inm-hero .inm-line > span', { yPercent: 110, duration: 1.1, stagger: 0.12, ease: 'power4.out' }, 1.9)
    .from('.inm-hero .inm-fade', { opacity: 0, y: 14, duration: 0.9, stagger: 0.1, ease: 'power3.out' }, 2.3);
  if (reduce) intro.progress(1);

  buildScroll();
};

function buildScroll() {
  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  // 1 · se abre
  tl.to('.inm-hero', { opacity: 0, y: -40, duration: 0.6 }, 0)
    .to(S, { nombre: 0.35, duration: 1 }, 0)
    .to(S, { sep: 1, orbit: 1, camZ: 5.8, camY: 0.7, lookY: 0.25, duration: 2, ease: 'power2.inOut' }, 0.2)
    .fromTo('.inm-c1', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, 0.9)
    .to('.inm-c1', { opacity: 0, y: -30, duration: 0.5 }, 2.4)
    // 2 · gira alrededor
    .to(S, { spin: 0.5, duration: 1.6, ease: 'sine.inOut' }, 2.2)
    .fromTo('.inm-c2', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, 2.6)
    .to('.inm-c2', { opacity: 0, y: -30, duration: 0.5 }, 3.6)
    // 3 · la cámara entra a la gelatina
    .to(S, { spin: 0, sep: 0.55, lookX: -0.25, lookY: 0.55, camY: 0.55, duration: 1.2, ease: 'power2.inOut' }, 3.8)
    .to(S, { dive: 1, camZ: 0.75, duration: 1.6, ease: 'power3.in' }, 3.9)
    .to(S, { inside: 1, duration: 0.45, ease: 'power1.in' }, 5.05)
    .fromTo('.inm-c3', { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' }, 5.5)
    .to('.inm-c3', { opacity: 0, scale: 1.06, duration: 0.5 }, 6.7)
    // 4 · sale con todo armado (el cambio pasa mientras la pantalla está roja)
    .set(S, { camZ: 7.5, camY: 0.35, lookY: 0.05, lookX: 0, dive: 0, sep: 0, orbit: 0.2 }, 6.9)
    .to(S, { inside: 0, duration: 0.6, ease: 'power2.out' }, 6.95)
    .to(S, { camZ: 6.3, lookY: -0.42, camY: 0.1, duration: 1.4, ease: 'power3.out' }, 6.95)
    .call(() => { if (st.direction > 0) poke(0.4, -0.3, 1.6); }, null, 7.3)
    .to(S, { nombre: 1, orbit: 0.45, duration: 1 }, 7.2)
    .fromTo('.inm-c4', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7 }, 7.6)
    .to({}, { duration: 1.2 });

  const st = ScrollTrigger.create({
    trigger: '.inm-scroll',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.8,
    animation: tl,
    onUpdate: (self) => { $('.inm-progress span').style.transform = `scaleY(${self.progress})`; },
  });
}

// Cursor propio en computadora
if (!touch) {
  const cur = $('.inm-cursor');
  const cx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' });
  const cy = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
  addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); });
  $$('a, button').forEach((el) => {
    el.addEventListener('pointerenter', () => cur.classList.add('is-big'));
    el.addEventListener('pointerleave', () => cur.classList.remove('is-big'));
  });
  canvas.addEventListener('pointerdown', () => { cur.classList.add('is-press'); setTimeout(() => cur.classList.remove('is-press'), 250); });
}
