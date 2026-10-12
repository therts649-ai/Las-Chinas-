// Intro de marca (≈3.6 s en escritorio, ≈2.9 s en celular), una vez por sesión.
// 1 Luz · 2 cada hermana aparece por separado (rizos, centro, lacio) con una máscara
// · 3 llegan las gelatinas al frente con un destello · 4 el escenario se atenúa y aparecen
// el logo oficial y el lema · la cortina sube hacia el hero. Cualquier gesto la adelanta.
import { gsap, anima, esCelular } from './config.js';
import { $ } from './util.js';

export function intro() {
  const raiz = document.documentElement;
  const el = $('.intro');
  return new Promise((listo) => {
    if (!raiz.classList.contains('con-intro') || raiz.classList.contains('sin-intro') || !anima) {
      raiz.classList.add('sin-intro');
      return listo(false);
    }
    try { sessionStorage.setItem('lc-intro', '1'); } catch (e) { /* sin almacenamiento: se verá de nuevo */ }
    const k = esCelular() ? 0.8 : 1; // en celular todo un poco más corto
    const t = (s) => s * k;
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => { raiz.classList.add('sin-intro'); raiz.classList.remove('con-intro'); quitar(); },
    });
    tl.from('.intro__luz', { opacity: 0, scale: 0.6, duration: t(1.2), ease: 'power2.out' }, 0);

    // Fase 2: cada hermana se descubre de abajo hacia arriba, en orden
    ['rizos', 'centro', 'lacio'].forEach((n, i) => {
      tl.fromTo(`.intro__hermana--${n}`,
        { clipPath: 'inset(100% 0% 0% 0%)', yPercent: 8, opacity: 0 },
        { clipPath: 'inset(0% 0% 0% 0%)', yPercent: 0, opacity: 1, duration: t(0.9), ease: 'power3.inOut' },
        t(0.25 + i * 0.38));
    });

    // Fase 3: las gelatinas llegan al frente; un destello en cada una
    tl.from('.intro__gel', { yPercent: 40, opacity: 0, duration: t(0.8), stagger: t(0.1) }, t(1.25))
      .fromTo('.intro__destello', { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: t(0.3), stagger: t(0.1), ease: 'power2.out' }, t(1.7))
      .to('.intro__destello', { opacity: 0, scale: 1.3, duration: t(0.45), stagger: t(0.1), ease: 'power2.in' }, t(1.95));

    // Fase 4: firma de marca al frente del escenario
    tl.to('.intro__escena', { scale: 0.94, filter: 'brightness(.45)', duration: t(0.9), ease: 'power2.inOut' }, t(2.1))
      .from('.intro__logo', { opacity: 0, scale: 0.7, duration: t(0.8), ease: 'expo.out' }, t(2.2))
      .from('.intro__lema', { opacity: 0, y: 16, duration: t(0.6) }, t(2.45))
      // Transición: la cortina sube y deja ver el hero
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: t(0.75), ease: 'power3.inOut' }, t(3.05))
      .add(() => listo(true), t(3.1));

    // Adelantar: cualquier gesto acelera el final (sin cortes bruscos)
    const adelantar = () => { if (tl.progress() < 1) tl.timeScale(5); };
    const eventos = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    eventos.forEach((n) => addEventListener(n, adelantar, { passive: true }));
    $('.intro__saltar', el).addEventListener('click', adelantar);
    function quitar() { eventos.forEach((n) => removeEventListener(n, adelantar)); }
  });
}
