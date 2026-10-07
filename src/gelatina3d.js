// Gelatina de fresa con leche en 3D que se deconstruye al hacer scroll.
// Compilar con `npm run build` (genera assets/js/gelatina3d.js).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const section = document.querySelector('.deco');
const host = section?.querySelector('.deco__frame');
const steps = section ? [...section.querySelectorAll('.deco__step')] : [];
const bar = section?.querySelector('.deco__progress span');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = window.matchMedia('(max-width: 860px)').matches;

if (section && host) start();

function start() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    section.classList.add('no-webgl');
    return;
  }
  section.classList.add('has-webgl');

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  if ('transmissionResolutionScale' in renderer) renderer.transmissionResolutionScale = isSmall ? 0.5 : 0.8;
  host.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#F6EAE4');
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.85;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  // ---------- Luces ----------
  const key = new THREE.DirectionalLight('#fff1e4', 2.4);
  key.position.set(3.5, 7, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(isSmall ? 1024 : 2048, isSmall ? 1024 : 2048);
  key.shadow.camera.left = -4; key.shadow.camera.right = 4;
  key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  scene.add(key);
  scene.add(new THREE.HemisphereLight('#ffe9ee', '#b9928a', 0.6));
  const rim = new THREE.SpotLight('#ffc2cf', 40, 20, 0.6, 0.8);
  rim.position.set(-4, 4, -5);
  scene.add(rim);

  // ---------- Texturas pintadas ----------
  const canvasTex = (w, h, draw, repeat) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
    return t;
  };
  const rand = mulberry32(7);

  // Corte de fresa: centro claro, vetas blancas y borde rojo intenso
  const sliceTex = canvasTex(256, 256, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h * 0.55, 4, w / 2, h / 2, w / 2);
    grd.addColorStop(0, '#fff3ef');
    grd.addColorStop(0.28, '#ffb3c0');
    grd.addColorStop(0.62, '#f0294a');
    grd.addColorStop(0.9, '#c1001f');
    grd.addColorStop(1, '#8e0016');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,240,240,.55)';
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      g.lineWidth = 1 + rand() * 2;
      g.beginPath();
      g.moveTo(w / 2, h * 0.55);
      g.quadraticCurveTo(w / 2 + Math.cos(a) * 40, h * 0.55 + Math.sin(a) * 40, w / 2 + Math.cos(a) * w * 0.42, h * 0.55 + Math.sin(a) * h * 0.42);
      g.stroke();
    }
    g.fillStyle = '#ffd86b';
    for (let i = 0; i < 30; i++) {
      const a = rand() * Math.PI * 2;
      const r = w * (0.4 + rand() * 0.06);
      g.beginPath();
      g.ellipse(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, 2.2, 3.2, a, 0, Math.PI * 2);
      g.fill();
    }
  });
  sliceTex.repeat.set(2.2, 2.2);
  sliceTex.offset.set(0.5, 0.5);

  // Piel de fresa con semillas
  const seedTex = canvasTex(256, 256, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#ff3a55');
    grd.addColorStop(1, '#b8001c');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const px = (x + (y % 2) * 0.5) * (w / 8) + rand() * 6;
        const py = y * (h / 8) + rand() * 6 + 8;
        g.fillStyle = 'rgba(120,0,15,.5)';
        g.beginPath(); g.ellipse(px, py + 1, 5, 7, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#ffd86b';
        g.beginPath(); g.ellipse(px, py, 2.4, 3.6, 0, 0, Math.PI * 2); g.fill();
      }
    }
  }, [3, 2]);

  // Leche con trocitos de fresa
  const chunks = (g, w, h, n, big) => {
    for (let i = 0; i < n; i++) {
      const x = rand() * w, y = rand() * h, s = (big ? 14 : 8) + rand() * (big ? 26 : 14);
      g.fillStyle = 'rgba(255,170,185,.45)';
      blob(g, x, y, s * 1.5);
      g.fillStyle = rand() > 0.5 ? '#d8183a' : '#ec3a57';
      blob(g, x, y, s);
      g.fillStyle = 'rgba(255,225,230,.8)';
      blob(g, x + s * 0.1, y - s * 0.1, s * 0.35);
    }
  };
  const milkTex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#fbf2ea';
    g.fillRect(0, 0, w, h);
    chunks(g, w, h, 34, false);
  }, [1, 1]);
  const milkCapTex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#fbf2ea';
    g.fillRect(0, 0, w, h);
    chunks(g, w, h, 18, true);
  });
  const jellyCapTex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 7; i++) {
      const x = 40 + rand() * (w - 80), y = 30 + rand() * (h - 60), s = 40 + rand() * 30;
      const grd = g.createRadialGradient(x, y, 2, x, y, s);
      grd.addColorStop(0, '#fff4f0');
      grd.addColorStop(0.4, '#ffc2cc');
      grd.addColorStop(0.85, '#ff8597');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd;
      g.beginPath(); g.ellipse(x, y, s * 0.8, s, rand() * 3, 0, Math.PI * 2); g.fill();
    }
  });

  // ---------- Materiales ----------
  const jelly = new THREE.MeshPhysicalMaterial({
    color: '#ff5470',
    roughness: 0.04,
    transmission: 1,
    thickness: 0.7,
    ior: 1.34,
    attenuationColor: new THREE.Color('#f0203f'),
    attenuationDistance: 1.4,
    emissive: new THREE.Color('#5a0010'),
    emissiveIntensity: 0.35,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    specularIntensity: 1,
  });
  const jellyCap = jelly.clone();
  jellyCap.map = jellyCapTex;
  jellyCap.side = THREE.DoubleSide;
  const milk = new THREE.MeshPhysicalMaterial({
    color: '#fff7f0',
    map: milkTex,
    roughness: 0.3,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    sheen: 0.5,
    sheenColor: new THREE.Color('#ffe6ea'),
  });
  const milkCap = milk.clone();
  milkCap.map = milkCapTex;
  milkCap.side = THREE.DoubleSide;
  const sliceFace = new THREE.MeshPhysicalMaterial({ map: sliceTex, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const sliceSide = new THREE.MeshPhysicalMaterial({ color: '#d6102f', roughness: 0.3, clearcoat: 1 });
  const berry = new THREE.MeshPhysicalMaterial({ map: seedTex, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 });
  const leaf = new THREE.MeshStandardMaterial({ color: '#3f9b3a', roughness: 0.5, side: THREE.DoubleSide });
  const porcelain = new THREE.MeshPhysicalMaterial({ color: '#fffdfb', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
  const milkSplash = new THREE.MeshPhysicalMaterial({ color: '#fffaf6', roughness: 0.15, clearcoat: 1, sheen: 0.4, transparent: true });

  // ---------- Geometría del molde (corte transversal r, y) ----------
  const RI = 0.52, RO = 1.75, Y_SPLIT = 0.55;
  const bottomProfile = [
    [RI + 0.04, 0], [RO - 0.06, 0], [RO, 0.06], [RO - 0.02, Y_SPLIT], [RI + 0.02, Y_SPLIT], [RI, 0.06],
  ];
  const topProfile = [[RI + 0.02, Y_SPLIT], [RO - 0.02, Y_SPLIT]];
  for (let i = 0; i <= 18; i++) {
    const t = (i / 18) * Math.PI;
    topProfile.push([1.135 + 0.6 * Math.cos(t), 0.86 + 0.48 * Math.sin(t)]);
  }
  topProfile.push([RI + 0.03, Y_SPLIT + 0.02]);

  const FLUTES = 16;
  const flute = (geo) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const r = Math.hypot(x, z);
      if (r < 1e-5) continue;
      const th = Math.atan2(x, z);
      const k = 1 + 0.045 * Math.cos(FLUTES * th) * THREE.MathUtils.smoothstep(r, RI, RO);
      p.setX(i, x * k);
      p.setZ(i, z * k);
    }
    geo.computeVertexNormals();
    return geo;
  };
  const latheWedge = (profile, phiStart, phiLength) => {
    const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
    pts.push(pts[0].clone());
    return flute(new THREE.LatheGeometry(pts, 20, phiStart, phiLength));
  };
  const cap = (profile, phi, tex, yRange) => {
    const shape = new THREE.Shape(profile.map(([r, y]) => new THREE.Vector2(r, y)));
    const geo = new THREE.ShapeGeometry(shape, 16);
    // UV a partir del corte: r de RI a RO, y dentro de la capa
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (uv.getX(i) - RI) / (RO - RI), (uv.getY(i) - yRange[0]) / (yRange[1] - yRange[0]));
    }
    geo.rotateY(phi - Math.PI / 2);
    return flute(geo);
  };

  // ---------- Piezas ----------
  const WEDGES = 8;
  const WEDGE = (Math.PI * 2) / WEDGES;
  const PHI0 = -WEDGE / 2 - Math.PI / FLUTES; // las uniones caen en los valles de las estrías

  const assembly = new THREE.Group();
  scene.add(assembly);
  const pieces = [];

  const sliceShape = new THREE.Shape();
  sliceShape.moveTo(0, -0.22);
  sliceShape.bezierCurveTo(0.12, -0.16, 0.21, 0, 0.17, 0.12);
  sliceShape.bezierCurveTo(0.14, 0.21, 0.04, 0.22, 0, 0.18);
  sliceShape.bezierCurveTo(-0.04, 0.22, -0.14, 0.21, -0.17, 0.12);
  sliceShape.bezierCurveTo(-0.21, 0, -0.12, -0.16, 0, -0.22);
  const sliceGeo = new THREE.ExtrudeGeometry(sliceShape, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 16 });
  sliceGeo.center();
  const makeSlice = () => {
    const m = new THREE.Mesh(sliceGeo, [sliceFace, sliceSide]);
    m.castShadow = true;
    return m;
  };

  for (let w = 0; w < WEDGES; w++) {
    const phi = PHI0 + w * WEDGE;
    const mid = phi + WEDGE / 2;
    for (const layer of ['bottom', 'top']) {
      const top = layer === 'top';
      const profile = top ? topProfile : bottomProfile;
      const yRange = top ? [Y_SPLIT, 1.34] : [0, Y_SPLIT];
      const group = new THREE.Group();
      const shell = new THREE.Mesh(latheWedge(profile, phi, WEDGE), top ? jelly : milk);
      const c1 = new THREE.Mesh(cap(profile, phi, null, yRange), top ? jellyCap : milkCap);
      const c2 = new THREE.Mesh(cap(profile, phi + WEDGE, null, yRange), top ? jellyCap : milkCap);
      for (const m of [shell, c1, c2]) { m.castShadow = true; m.receiveShadow = !top; group.add(m); }
      if (top) {
        // Rebanadas de fresa dentro de la gelatina, mirando hacia afuera
        for (const da of [-WEDGE / 4, WEDGE / 4]) {
          const s = makeSlice();
          const a = mid + da;
          s.position.set(Math.sin(a) * 1.36, 0.95, Math.cos(a) * 1.36);
          s.rotation.set(-0.15, a, (rand() - 0.5) * 0.6);
          s.scale.setScalar(1.15);
          group.add(s);
        }
        const s = makeSlice();
        s.position.set(Math.sin(mid) * 1.0, 1.12, Math.cos(mid) * 1.0);
        s.rotation.set(-1.1, mid, 0.3);
        group.add(s);
      }
      // Centrar cada pieza en su propio centro para que gire sobre sí misma
      const center = new THREE.Vector3(Math.sin(mid) * 1.13, top ? 0.9 : 0.28, Math.cos(mid) * 1.13);
      group.children.forEach((c) => c.position.sub(center));
      group.position.copy(center);
      assembly.add(group);
      const axis = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
      pieces.push({
        group, top, wedge: w, home: center.clone(),
        dir: new THREE.Vector3(Math.sin(mid), 0, Math.cos(mid)),
        axis, spin: 0.8 + rand() * 1.4, reach: 0.7 + rand() * 0.6, lift: (rand() - 0.3) * 0.9,
      });
    }
  }

  // Plato de porcelana y sombra suave en la mesa
  const platePts = [[0, 0], [2.0, 0], [2.25, 0.05], [2.42, 0.16], [2.46, 0.2], [2.38, 0.19], [2.15, 0.08], [0, 0.06]].map(([x, y]) => new THREE.Vector2(x, y));
  const plate = new THREE.Mesh(new THREE.LatheGeometry(platePts, 96), porcelain);
  plate.position.y = -0.07;
  plate.receiveShadow = true;
  scene.add(plate);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.075;
  floor.receiveShadow = true;
  scene.add(floor);

  // Fresas enteras y rebanadas que orbitan mientras la gelatina está separada
  const berryPts = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const r = Math.sin(Math.pow(t, 0.8) * Math.PI) * (0.17 + 0.05 * t);
    berryPts.push(new THREE.Vector2(Math.max(r, 0.001), t * 0.42 - 0.21));
  }
  const berryGeo = new THREE.LatheGeometry(berryPts, 24);
  const sepalGeo = new THREE.ConeGeometry(0.035, 0.16, 4);
  sepalGeo.rotateX(Math.PI / 2);
  sepalGeo.translate(0, 0, 0.07);
  const makeBerry = () => {
    const g = new THREE.Group();
    const b = new THREE.Mesh(berryGeo, berry);
    b.castShadow = true;
    g.add(b);
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(sepalGeo, leaf);
      s.position.y = 0.2;
      s.rotation.set(-0.25, (i / 6) * Math.PI * 2, 0);
      g.add(s);
    }
    return g;
  };
  const orbiters = [];
  const orbitGroup = new THREE.Group();
  assembly.add(orbitGroup);
  for (let i = 0; i < 10; i++) {
    const obj = i % 2 ? makeSlice() : makeBerry();
    if (i % 2) obj.scale.setScalar(1.6);
    orbitGroup.add(obj);
    orbiters.push({
      obj, base: (i / 10) * Math.PI * 2 + rand() * 0.3,
      radius: 2.2 + rand() * 0.7, height: 0.3 + rand() * 1.9,
      spin: new THREE.Vector3(rand(), rand(), rand()), scale: obj.scale.x,
    });
  }

  // Remolino de leche que se dibuja alrededor
  const spiral = [];
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const a = t * Math.PI * 3.2;
    spiral.push(new THREE.Vector3(Math.sin(a) * (2.0 + 0.4 * Math.sin(t * 9)), 0.2 + t * 1.8 + 0.15 * Math.sin(t * 13), Math.cos(a) * (2.0 + 0.4 * Math.sin(t * 9))));
  }
  const ribbonGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiral), 400, 0.045, 10, false);
  const ribbon = new THREE.Mesh(ribbonGeo, milkSplash);
  ribbon.castShadow = true;
  orbitGroup.add(ribbon);
  const ribbonCount = ribbonGeo.index.count;

  // Destellos dorados al reconstruirse
  const sparkCount = 180;
  const sparkPos = new Float32Array(sparkCount * 3);
  for (let i = 0; i < sparkCount; i++) {
    const a = rand() * Math.PI * 2, r = 1.4 + rand() * 1.6, h = rand() * 2.4;
    sparkPos.set([Math.sin(a) * r, h, Math.cos(a) * r], i * 3);
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const dot = canvasTex(64, 64, (g, w) => {
    const grd = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.3, 'rgba(255,233,190,.8)');
    grd.addColorStop(1, 'rgba(255,233,190,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, w);
  });
  const sparkMat = new THREE.PointsMaterial({ map: dot, size: 0.12, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  scene.add(sparks);

  // ---------- Línea de tiempo (p de 0 a 1) ----------
  const ss = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);
  const window2 = (a, b, c, d, x) => ss(a, b, x) * (1 - ss(c, d, x));
  const q = new THREE.Quaternion();
  const camPos = new THREE.Vector3();
  const look = new THREE.Vector3(0, 0.75, 0);

  function pose(p, time) {
    const lift = window2(0.08, 0.2, 0.76, 0.86, p);
    const split = window2(0.16, 0.3, 0.6, 0.76, p);
    const orbit = ss(0.28, 0.66, p) * Math.PI * 2;
    const slice = ss(0.88, 0.98, p);
    const calm = 1 - ss(0.8, 0.9, p);

    assembly.position.y = lift * 0.55;
    assembly.rotation.y = orbit + Math.sin(time * 0.35) * 0.22 * calm;
    // Al caer en el plato se aplasta y rebota como gelatina
    const landT = THREE.MathUtils.clamp((p - 0.83) / 0.07, 0, 1);
    const squash = Math.sin(landT * Math.PI * 3) * (1 - landT) * 0.07;
    assembly.scale.set(1 + squash * 0.6, 1 - squash, 1 + squash * 0.6);

    for (const pc of pieces) {
      // La base regresa antes que la capa de fresa: se reúnen capa por capa
      const ex = pc.top ? window2(0.26, 0.4, 0.56, 0.68, p) : window2(0.26, 0.4, 0.5, 0.6, p);
      const radial = 0.28 * split + ex * pc.reach * 1.3;
      const up = pc.top ? 0.62 * split + ex * pc.lift : -0.04 * split + ex * pc.lift * 0.5;
      pc.group.position.copy(pc.home).addScaledVector(pc.dir, radial);
      pc.group.position.y += up;
      q.setFromAxisAngle(pc.axis, ex * pc.spin * Math.PI * 0.6);
      pc.group.quaternion.copy(q);
      if (pc.wedge === 0 && slice > 0) {
        // La rebanada sale hacia el frente y gira para mostrar el corte
        pc.group.position.addScaledVector(pc.dir, slice * 1.15);
        pc.group.position.y += slice * 0.35;
        pc.group.rotateY(slice * 0.75);
        pc.group.rotateX(-slice * 0.12);
      }
    }

    const show = window2(0.28, 0.4, 0.56, 0.66, p);
    for (const o of orbiters) {
      const a = o.base + time * 0.25;
      o.obj.position.set(Math.sin(a) * o.radius, o.height, Math.cos(a) * o.radius);
      o.obj.rotation.set(time * o.spin.x, time * o.spin.y, time * o.spin.z);
      o.obj.scale.setScalar(Math.max(show, 0.0001) * o.scale);
      o.obj.visible = show > 0.001;
    }
    const draw = ss(0.3, 0.46, p);
    const fade = 1 - ss(0.56, 0.66, p);
    ribbonGeo.setDrawRange(0, Math.floor(ribbonCount * draw / 3) * 3);
    milkSplash.opacity = fade;
    ribbon.visible = draw > 0.001 && fade > 0.001;
    orbitGroup.rotation.y = time * 0.15;

    const burst = window2(0.68, 0.76, 0.82, 0.9, p);
    sparkMat.opacity = burst;
    sparks.rotation.y = time * 0.3;
    sparks.position.y = (1 - burst) * -0.4;
    sparks.visible = burst > 0.001;

    // Cámara: se aleja cuando todo está separado y se acerca para ver la rebanada
    const wide = window2(0.24, 0.4, 0.58, 0.72, p);
    const aspect = camera.aspect;
    const fit = aspect < 0.9 ? 1.35 : 1;
    camPos.set(slice * 0.9, 2.5 + wide * 0.7 - slice * 0.35, (7.6 + wide * 2.6 - slice * 1.6) * fit);
    camera.position.copy(camPos);
    look.set(slice * 0.5, 0.75 + lift * 0.4 + wide * 0.35, slice * 0.6);
    camera.lookAt(look);
  }

  // ---------- Tamaño ----------
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(() => { resize(); if (!running) render(); }).observe(host);
  resize();

  // ---------- Progreso con el scroll ----------
  let target = 0, current = 0, running = false, visible = false, frame = 0;
  const timer = new THREE.Timer();
  const readScroll = () => {
    const r = section.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    target = total > 0 ? THREE.MathUtils.clamp(-r.top / total, 0, 1) : 0;
  };
  const setStep = (p) => {
    const idx = Math.min(steps.length - 1, Math.floor(p * steps.length));
    steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
  };
  const render = () => {
    timer.update();
    pose(current, timer.getElapsed());
    renderer.render(scene, camera);
  };
  const loop = () => {
    readScroll();
    current += (target - current) * 0.09;
    if (Math.abs(target - current) < 0.0004) current = target;
    setStep(current);
    render();
    frame = visible ? requestAnimationFrame(loop) : 0;
    running = !!frame;
  };

  if (reduceMotion) {
    // Sin movimiento: una sola imagen con la rebanada mostrando el interior
    current = 0.97;
    render();
    return;
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !frame) { running = true; frame = requestAnimationFrame(loop); }
  }, { rootMargin: '200px 0px' }).observe(section);
  render();
}

function blob(g, x, y, s) {
  g.beginPath();
  for (let i = 0; i <= 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const r = s * (0.7 + 0.3 * Math.sin(i * 2.3 + x));
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.8;
    if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
  }
  g.closePath();
  g.fill();
}

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
