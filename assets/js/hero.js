// Hero: el producto al frente; cada sabor trae su propio color.
// Sin deformar el postre: solo cambia luz, color, posición y enfoque.
import { gsap, anima, finePointer, MOTION } from './config.js';
import { $, $$ } from './util.js';
import { resaltar } from './catalogo.js';

const MUNDOS = {
  'fresa-crema': { c1: '#7A1236', c2: '#2A0912', luz: '255, 90, 140', acento: '#F7A0C1' },
  'fresa-natural': { c1: '#8E2D58', c2: '#2C0A18', luz: '255, 160, 200', acento: '#FFC4DB' },
  'mango-maracuya': { c1: '#8A4508', c2: '#251004', luz: '255, 180, 70', acento: '#FFD08A' },
  'vasitos-capas': { c1: '#4E1D66', c2: '#16061F', luz: '210, 140, 255', acento: '#E2C2FF' },
};

const hero = $('.hero');
const caja = $('.hero__postres');
const postres = $$('.postre', hero);
const botones = $$('.sabor', hero);
let actual = 'fresa-crema';
let barra = null;

const silueta = (img) => hero.style.setProperty('--silueta', `url("${img.currentSrc || img.src}")`);
const reflejo = () => anima && gsap.fromTo('.hero__reflejo', { backgroundPosition: '130% 0' }, { backgroundPosition: '-60% 0', duration: 1.3, ease: 'power2.inOut' });

function correrBarra() {
  barra?.kill();
  $$('.sabor__barra', hero).forEach((b) => gsap?.set(b, { scaleX: 0 }));
  if (!anima) return;
  barra = gsap.to($(`.sabor[data-sabor="${actual}"] .sabor__barra`, hero), {
    scaleX: 1, duration: MOTION.saborCada, ease: 'none',
    onComplete: () => {
      const i = botones.findIndex((b) => b.dataset.sabor === actual);
      cambiar(botones[(i + 1) % botones.length].dataset.sabor);
    },
  });
  if (pausado) barra.pause();
}

function cambiar(id) {
  if (id === actual) return;
  postres.forEach((p) => { if (p.dataset.src) { p.srcset = p.dataset.srcset; p.src = p.dataset.src; delete p.dataset.src; } });
  const antes = postres.find((p) => p.dataset.sabor === actual);
  const ahora = postres.find((p) => p.dataset.sabor === id);
  actual = id;
  hero.dataset.sabor = id;
  botones.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sabor === id)));
  silueta(ahora);
  const m = MUNDOS[id];
  if (!anima) {
    antes.classList.remove('is-activa');
    ahora.classList.add('is-activa');
    Object.entries({ '--c1': m.c1, '--c2': m.c2, '--luz': m.luz, '--acento': m.acento }).forEach(([k, v]) => hero.style.setProperty(k, v));
    return;
  }
  gsap.timeline()
    .to(hero, { '--c1': m.c1, '--c2': m.c2, '--acento': m.acento, duration: 1.2, ease: MOTION.easeIO }, 0)
    .add(() => hero.style.setProperty('--luz', m.luz), 0.45)
    .to(antes, { opacity: 0, yPercent: 6, scale: 0.96, filter: 'blur(8px)', duration: 0.55, ease: 'power2.in' }, 0)
    .add(() => { antes.classList.remove('is-activa'); gsap.set(antes, { clearProps: 'all' }); })
    .fromTo(ahora, { opacity: 0, yPercent: -6, scale: 1.03, filter: 'blur(10px)' }, {
      opacity: 1, yPercent: 0, scale: 1, filter: 'blur(0px)', duration: 0.9, ease: MOTION.ease, clearProps: 'filter',
      onStart: () => ahora.classList.add('is-activa'),
    }, 0.4)
    .add(reflejo, 1.05);
  correrBarra();
}

let pausado = false;
const pausar = (v) => { pausado = v; if (barra) (v ? barra.pause() : barra.resume()); };

export function hero_() {
  // Los demás sabores se descargan cuando la página ya cargó (no compiten con el primero)
  const cargarResto = () => postres.forEach((p) => { if (p.dataset.src) { p.srcset = p.dataset.srcset; p.src = p.dataset.src; delete p.dataset.src; } });
  if (document.readyState === 'complete') setTimeout(cargarResto, 300); else addEventListener('load', () => setTimeout(cargarResto, 300));
  silueta(postres[0]);
  postres[0].addEventListener('load', () => silueta(postres[0]));
  botones.forEach((b) => b.addEventListener('click', () => cambiar(b.dataset.sabor)));
  $('.js-hero-ver').addEventListener('click', (e) => { e.preventDefault(); resaltar(actual); });
  caja.addEventListener('click', () => resaltar(actual));
  if (!anima) return;

  $('.hero__sabores').addEventListener('pointerenter', () => pausar(true));
  $('.hero__sabores').addEventListener('pointerleave', () => pausar(false));
  ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', onToggle: (st) => pausar(!st.isActive) });

  // Flotación muy suave del postre (sin deformarlo)
  gsap.to(caja, { y: -10, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  // Profundidad discreta con el mouse
  if (finePointer) {
    const x = gsap.quickTo('.hero__producto', 'x', { duration: 1.2, ease: 'power3' });
    const y = gsap.quickTo('.hero__producto', 'y', { duration: 1.2, ease: 'power3' });
    const lx = gsap.quickTo('.hero__luz', 'x', { duration: 1.6, ease: 'power3' });
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      x(nx * 16); y(ny * 10); lx(nx * 60);
    });
  }

  // Al bajar, el texto se despide y el producto sube más lento que la página
  const sc = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.hero__texto, .hero__sabores', { opacity: 0, y: -40, ease: 'none', scrollTrigger: { ...sc, end: '50% top' } });
  gsap.to('.hero__producto', { yPercent: 18, ease: 'none', scrollTrigger: sc });
}

// Entrada del hero (después de la intro o directamente si ya se vio)
export function entradaHero(corta = false) {
  if (!anima) return;
  const d = corta ? 0.6 : 1;
  gsap.timeline({ defaults: { ease: MOTION.ease }, onComplete: correrBarra })
    .from('.header', { opacity: 0, y: -12, duration: 0.6 * d, clearProps: 'opacity,transform' }, 0)
    .from('.hero__texto .kicker', { opacity: 0, y: 12, duration: 0.6 * d }, 0.05)
    .from('.hero h1 .linea > span', { yPercent: 110, duration: 0.9 * d, stagger: 0.1, ease: 'power4.out' }, 0.1)
    .from('.hero__sub, .hero__ctas', { opacity: 0, y: 16, duration: 0.7 * d, stagger: 0.08 }, 0.35 * d)
    .fromTo('.hero__postres', { opacity: 0, scale: 0.94, filter: 'blur(12px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.1 * d, clearProps: 'filter,opacity,scale' }, 0.1)
    .from('.hero__pedestal', { opacity: 0, scaleX: 0.6, duration: 0.9 * d }, 0.3)
    .add(reflejo, 0.9 * d)
    .from('.sabor, .hero__ver', { opacity: 0, y: 12, duration: 0.5 * d, stagger: 0.06 }, 0.6 * d);
}
