// Intro de marca (≈3.5 s en escritorio, ≈2.8 s en celular), una vez por sesión.
// 1 Luz · 2 las hermanas aparecen por su panel (rizos, centro, lacio) · 3 destellos en las gelatinas
// · 4 logo oficial y lema · la cortina sube hacia el hero. Cualquier toque, tecla o scroll la adelanta.
import { gsap, anima, esCelular } from './config.js';
import { $, $$ } from './util.js';

// Mismos polígonos que en styles.css; "cerrado" pega todos los puntos al borde superior
const PANELES = [
  ['0% 0%, 34.8% 0%, 28% 74.4%, 26.3% 81.8%, 0% 81.8%', '0% 0%, 34.8% 0%, 34.8% 0%, 34.8% 0%, 0% 0%'],
  ['35.2% 0%, 72% 0%, 67.6% 59.5%, 29.4% 59.5%', '35.2% 0%, 72% 0%, 72% 0%, 35.2% 0%'],
  ['72.2% 0%, 100% 0%, 100% 82.9%, 67.6% 82.9%, 66.4% 59.5%, 67.5% 55.3%', '72.2% 0%, 100% 0%, 100% 0%, 72.2% 0%, 72.2% 0%, 72.2% 0%'],
];

export function intro() {
  const raiz = document.documentElement;
  const el = $('.intro');
  return new Promise((listo) => {
    if (!raiz.classList.contains('con-intro') || raiz.classList.contains('sin-intro') || !anima) {
      raiz.classList.add('sin-intro');
      return listo(false);
    }
    try { sessionStorage.setItem('lc-intro', '1'); } catch (e) { /* sin almacenamiento: se verá de nuevo */ }
    const cel = esCelular();
    const paneles = $$('.intro__panel', el);
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => { raiz.classList.add('sin-intro'); raiz.classList.remove('con-intro'); quitar(); },
    });
    tl.from('.intro__luz', { opacity: 0, scale: 0.6, duration: 1.2, ease: 'power2.out' }, 0);
    // Fase 2: cada hermana se descubre de arriba hacia abajo, en orden
    paneles.forEach((p, i) => {
      const [abierto, cerrado] = PANELES[i];
      tl.fromTo(p, { clipPath: `polygon(${cerrado})`, y: cel ? 0 : 24 }, {
        clipPath: `polygon(${abierto})`, y: 0, duration: cel ? 0.6 : 0.9, ease: 'power3.inOut',
      }, (cel ? 0.15 : 0.25) + i * (cel ? 0.25 : 0.45));
    });
    // Fase 3: un destello en cada gelatina
    tl.fromTo('.intro__destello', { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.35, stagger: 0.12, ease: 'power2.out' }, cel ? 1 : 1.55)
      .to('.intro__destello', { opacity: 0, scale: 1.3, duration: 0.5, stagger: 0.12, ease: 'power2.in' }, cel ? 1.3 : 1.85);
    // Fase 4: firma de marca
    tl.from('.intro__logo', { opacity: 0, scale: 0.7, y: 30, duration: 0.8, ease: 'expo.out' }, cel ? 1.2 : 1.9)
      .from('.intro__lema', { opacity: 0, y: 18, duration: 0.7 }, cel ? 1.45 : 2.2)
      // Transición: la cortina sube y deja ver el hero
      .to('.intro__marco', { yPercent: -6, duration: 0.8, ease: 'power2.in' }, cel ? 2.2 : 2.9)
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.75, ease: 'power3.inOut' }, cel ? 2.25 : 2.95)
      .add(() => listo(true), cel ? 2.3 : 3.0);

    // Adelantar: cualquier gesto acelera el final (sin cortes bruscos)
    const adelantar = () => { if (tl.progress() < 1) tl.timeScale(5); };
    const eventos = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    eventos.forEach((n) => addEventListener(n, adelantar, { passive: true }));
    $('.intro__saltar', el).addEventListener('click', adelantar);
    function quitar() { eventos.forEach((n) => removeEventListener(n, adelantar)); }
  });
}
