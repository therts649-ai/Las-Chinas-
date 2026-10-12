// Escena «capa por capa» con las capas reales de la foto (plato, leche, superficie de leche y fresa).
// Escritorio: la sección se fija y el scroll controla la escena.
// Celular y tableta: la escena se reproduce una vez al aparecer (más ligera).
// Solo se mueven, se acercan y se alejan las capas: nunca se deforman.
import { gsap, anima, esEscritorio } from './config.js';
import { $, $$ } from './util.js';

export function escena() {
  const sec = $('.capas');
  if (!sec) return;
  const notas = $$('.capas__nota', sec);
  const activar = (n) => notas.forEach((el) => el.classList.toggle('is-activa', el.dataset.nota === String(n)));
  if (!anima) { notas.forEach((n) => n.classList.add('is-activa')); return; }

  const gel = $('.capas__gel', sec);
  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
  tl
    // 1 · la gelatina completa; 2 · la cámara se acerca
    .to(gel, { scale: 1.12, duration: 1 }, 0)
    // 3 · se separan las capas
    .set('.capas__tapa', { opacity: 1 }, 0.9)
    .to('.capas__fresa', { yPercent: -30, duration: 1.2 }, 0.9)
    .to('.capas__plato, .capas__sombra', { yPercent: 12, duration: 1.2 }, 0.9)
    .add(() => activar(1), 1.2)
    .add(() => activar(2), 1.9)
    // 4 · flotan un momento
    .to('.capas__fresa', { yPercent: -36, duration: 0.8, ease: 'sine.inOut' }, 2.1)
    .to('.capas__leche, .capas__tapa', { yPercent: -3, duration: 0.8, ease: 'sine.inOut' }, 2.1)
    .add(() => activar(3), 2.5)
    // 5 · regresan a su lugar; 6 · el producto completo
    .to('.capas__fresa, .capas__leche, .capas__tapa, .capas__plato, .capas__sombra', { yPercent: 0, duration: 1.1 }, 2.9)
    .set('.capas__tapa', { opacity: 0 }, 4)
    .to(gel, { scale: 1, duration: 1 }, 3.4);

  if (esEscritorio()) {
    tl.eventCallback('onReverseComplete', () => activar(0));
    ScrollTrigger.create({
      trigger: sec,
      start: 'top top',
      end: '+=170%',
      pin: '.capas__escena',
      scrub: 0.6,
      animation: tl,
      anticipatePin: 1,
    });
  } else {
    tl.pause();
    ScrollTrigger.create({ trigger: gel, start: 'top 70%', once: true, onEnter: () => tl.play() });
  }
  gsap.from('.capas__texto > *', { y: 30, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: sec, start: 'top 75%' } });
}
