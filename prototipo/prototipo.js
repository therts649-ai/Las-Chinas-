// Prototipo del inicio: un plano secuencia en cuatro etapas.
//  1. Gelatina líquida (fluido WebGL)  2. A través de la gelatina (lente)
//  3. Mundo en capas (profundidad con mouse o giroscopio)  4. Entrar a la gelatina (video con el scroll)

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = !!window.gsap;

// ---------- Cuadros del video (etapa 4) ----------
const TOTAL = 120;
const frames = new Array(TOTAL);
const frameSrc = (i) => `../assets/video/cuadros/c${String(i + 1).padStart(3, '0')}.webp`;
function loadFrames() {
  const load = (i) => {
    if (frames[i]) return;
    const img = new Image();
    img.decoding = 'async';
    img.src = frameSrc(i);
    frames[i] = img;
  };
  for (let i = 0; i < TOTAL; i += 4) load(i);
  setTimeout(() => { for (let i = 0; i < TOTAL; i++) load(i); }, 800);
}

// ---------- Etapas 1 y 2 ----------
function runIntro(onDone) {
  const canvas = $('.gl');
  // El lienzo debe estar visible antes de crear la simulación (si no, mide 0×0)
  root.classList.add('has-intro');
  let g = null;
  try { g = window.GelatinaGL && GelatinaGL.start(canvas, { image: '../assets/temp/hero-hermanas.webp' }); } catch (e) { g = null; }
  if (!g) { root.classList.remove('has-intro'); onDone(); return; }

  document.body.classList.add('is-locked');
  let finished = false;
  const state = { mix: 0, through: 0 };

  // La gelatina se "sirve": chorros que bajan del centro y se esparcen
  const pours = [];
  const POURS = innerWidth < 700 ? 16 : 26;
  for (let i = 0; i < POURS; i++) {
    pours.push(setTimeout(() => {
      const x = 0.5 + (Math.random() - 0.5) * 0.8;
      const y = 0.85 - Math.random() * 0.7;
      const a = Math.random() * Math.PI * 2;
      g.splat(x, y, Math.cos(a) * 900, Math.sin(a) * 900 - 500);
      g.splat(1 - x, 1 - y, -Math.cos(a) * 700, -Math.sin(a) * 700);
    }, 60 + i * 140));
  }

  const tl = gsap.timeline();
  tl.to('.intro-ui__hint', { opacity: 1, y: -6, duration: 0.6 }, 0.6)
    // La gelatina cuaja: deja de fluir y aparece el logo
    .call(() => g.setDyeFade(1.6), null, 4.0)
    .to('.intro-ui__hint', { opacity: 0, duration: 0.4 }, 4.0)
    .fromTo('.intro-ui__brand img', { opacity: 0, scale: 0.3, rotate: -40 }, { opacity: 1, scale: 1, rotate: 0, duration: 1, ease: 'elastic.out(1, 0.45)' }, 4.1)
    .fromTo('.intro-ui__brand p', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'back.out(2)' }, 4.5)
    // La gelatina se vuelve translúcida y deja ver el inicio
    .to(state, { mix: 1, duration: 1.4, ease: 'power2.inOut', onUpdate: () => g.setMix(state.mix) }, 5.2)
    .to('.intro-ui__brand', { opacity: 0, scale: 0.9, duration: 0.6 }, 6.0)
    .to('.intro-ui__enter', { opacity: 1, y: -6, duration: 0.6, repeat: -1, yoyo: true, repeatDelay: 0.4 }, 6.4)
    .addLabel('wait', 6.6);

  // Atravesar la gelatina: con scroll, deslizar, tocar o una tecla (o sola a los 10 s)
  const through = () => {
    if (finished || tl.time() < 5.6) return;
    finished = true;
    remove();
    gsap.to('.intro-ui', { opacity: 0, duration: 0.4 });
    gsap.to(state, {
      through: 1, duration: 1.3, ease: 'power2.in', onUpdate: () => g.setThrough(state.through),
      onComplete: end,
    });
  };
  const end = () => {
    finished = true;
    pours.forEach(clearTimeout);
    tl.kill();
    g.stop();
    root.classList.remove('has-intro');
    document.body.classList.remove('is-locked');
    onDone();
  };
  const onWheel = () => through();
  const onKey = () => through();
  const onTouch = () => through();
  const auto = setTimeout(through, 10000);
  window.addEventListener('wheel', onWheel, { passive: true });
  window.addEventListener('keydown', onKey);
  canvas.addEventListener('pointerup', onTouch);
  function remove() {
    clearTimeout(auto);
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('keydown', onKey);
    canvas.removeEventListener('pointerup', onTouch);
  }
  $('.skip-intro').addEventListener('click', () => { remove(); end(); }, { once: true });

  // En iPhone, el giroscopio pide permiso con un toque: aprovechamos el primero
  canvas.addEventListener('pointerdown', askMotion, { once: true });
}

let motionAllowed = false;
function askMotion() {
  const D = window.DeviceOrientationEvent;
  if (D && typeof D.requestPermission === 'function') {
    D.requestPermission().then((r) => { motionAllowed = r === 'granted'; }).catch(() => {});
  } else motionAllowed = true;
}

// ---------- Etapas 3 y 4 ----------
function startWorld() {
  // Entrada del inicio
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.top', { y: -40, opacity: 0, duration: 0.8 }, 0)
    .from('.layer--photo', { scale: 1.15, duration: 1.6, ease: 'power2.out' }, 0)
    .from('.seq__text h1 span', { yPercent: 120, opacity: 0, rotate: -6, duration: 1, stagger: 0.12, ease: 'back.out(1.6)' }, 0.1)
    .from('.seq__text p, .seq__actions .btn', { y: 20, opacity: 0, duration: 0.7, stagger: 0.1 }, 0.5)
    .from('.spark', { scale: 0, duration: 0.8, stagger: 0.08, ease: 'back.out(3)' }, 0.5);

  // Las chispas y luces respiran
  gsap.to('.spark', { opacity: 0.35, scale: 0.6, duration: 1.6, stagger: { each: 0.3, repeat: -1, yoyo: true }, ease: 'sine.inOut' });
  gsap.to('.orb', { y: '+=18', duration: 4, stagger: { each: 0.6, repeat: -1, yoyo: true }, ease: 'sine.inOut' });

  // Profundidad: cada capa se mueve distinto con el mouse o el giroscopio
  const layers = $$('[data-depth]').map((el) => ({
    d: parseFloat(el.dataset.depth),
    x: gsap.quickTo(el, 'x', { duration: 1, ease: 'power3' }),
    y: gsap.quickTo(el, 'y', { duration: 1, ease: 'power3' }),
  }));
  const textX = gsap.quickTo('.seq__text', 'x', { duration: 1.2, ease: 'power3' });
  const move = (nx, ny) => {
    layers.forEach((l) => { l.x(nx * -40 * l.d); l.y(ny * -28 * l.d); });
    textX(nx * 12);
  };
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    move(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5);
  });
  window.addEventListener('deviceorientation', (e) => {
    if (e.gamma == null) return;
    move(gsap.utils.clamp(-0.5, 0.5, e.gamma / 40), gsap.utils.clamp(-0.5, 0.5, (e.beta - 45) / 40));
  });
  window.addEventListener('pointerdown', askMotion, { once: true });

  // Video cuadro por cuadro
  const canvas = $('.cine');
  const ctx = canvas.getContext('2d');
  let target = 0, shown = 0, raf = 0;
  const ready = (img) => img && img.complete && img.naturalWidth;
  const nearest = (i) => {
    for (let d = 0; d < TOTAL; d++) {
      if (ready(frames[i - d])) return frames[i - d];
      if (ready(frames[i + d])) return frames[i + d];
    }
    return null;
  };
  const draw = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = Math.round(canvas.clientWidth * dpr), H = Math.round(canvas.clientHeight * dpr);
    if (!W || !H) return;
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    const img = nearest(Math.round(shown));
    if (!img) return;
    const ia = img.naturalWidth / img.naturalHeight;
    let w, h;
    if (W / H > 1) { w = Math.max(W, H * ia); h = w / ia; } else { h = H * 0.62; w = h * ia; }
    ctx.fillStyle = '#F6CFC8';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    if (W / H <= 1) {
      // En celular, los bordes del video se funden con el fondo
      const y0 = (H - h) / 2, f = h * 0.2;
      for (const [a, b] of [[y0, y0 + f], [y0 + h, y0 + h - f]]) {
        const gr = ctx.createLinearGradient(0, a, 0, b);
        gr.addColorStop(0, 'rgba(246,207,200,1)');
        gr.addColorStop(1, 'rgba(246,207,200,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(0, Math.min(a, b) - 1, W, f + 2);
      }
    }
  };
  const tick = () => {
    shown += (target - shown) * 0.2;
    if (Math.abs(target - shown) < 0.05) shown = target;
    draw();
    raf = shown !== target ? requestAnimationFrame(tick) : 0;
  };

  // Recorrido con el scroll: avanzar entre capas → entrar a la gelatina → deconstrucción
  const caps = $$('.captions li');
  let active = -1;
  const setCaption = (p) => {
    let idx = -1;
    caps.forEach((li, i) => { if (p >= parseFloat(li.dataset.at)) idx = i; });
    if (idx === active) return;
    if (active >= 0) gsap.to(caps[active], { opacity: 0, y: -14, duration: 0.25, overwrite: true });
    if (idx >= 0) gsap.fromTo(caps[idx], { opacity: 0, y: 20, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(2)', overwrite: true });
    active = idx;
  };

  const story = gsap.timeline({ defaults: { ease: 'none' } });
  story
    .to('.layer--bg', { scale: 1.12, duration: 0.22 }, 0)
    .to('.layer--photo', { scale: 1.3, duration: 0.22 }, 0)
    .to('.layer--fg', { scale: 2.6, opacity: 0, duration: 0.22 }, 0)
    .to('.seq__text', { y: -160, opacity: 0, duration: 0.14 }, 0)
    // La cámara entra en la gelatina del centro
    .to('.layer--photo', { scale: 5, transformOrigin: '52% 80%', duration: 0.18, ease: 'power2.in' }, 0.22)
    .fromTo('.flash', { opacity: 0 }, { opacity: 1, duration: 0.05, ease: 'power1.in' }, 0.31)
    .to('.flash', { opacity: 0, duration: 0.07, ease: 'power1.out' }, 0.36)
    .to('.layer--photo', { opacity: 0, duration: 0.06 }, 0.34)
    .to('.layer--bg', { opacity: 0, duration: 0.08 }, 0.3)
    .fromTo('.cine', { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.1, ease: 'power2.out' }, 0.32)
    .to({}, { duration: 0.58 }, 0.42);

  ScrollTrigger.create({
    trigger: '.seq',
    start: 'top top',
    end: '+=600%',
    pin: '.seq__pin',
    scrub: 0.8,
    animation: story,
    onUpdate: (self) => {
      const p = self.progress;
      $('.progress span').style.transform = `scaleX(${p.toFixed(4)})`;
      setCaption(p);
      $('.scroll-hint').style.opacity = p < 0.02 ? 1 : 0;
      target = gsap.utils.clamp(0, TOTAL - 1, gsap.utils.mapRange(0.4, 1, 0, TOTAL - 1, p));
      if (!raf) raf = requestAnimationFrame(tick);
    },
  });
  addEventListener('resize', draw);
  draw();
}

// ---------- Arranque ----------
if (reduceMotion || !hasGsap) {
  // Sin movimiento: el inicio queda fijo y la página es normal
} else {
  gsap.registerPlugin(ScrollTrigger);
  loadFrames();
  runIntro(startWorld);
}
