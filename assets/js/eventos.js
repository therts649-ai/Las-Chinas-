// Mesas para eventos: elegir la celebración y recorrer la mesa con los números.
import { gsap, anima, MOTION } from './config.js';
import { $, $$ } from './util.js';

export function eventos() {
  const invitaciones = $$('.invitacion');
  if (!invitaciones.length) return;
  function elegir(btn) {
    if (btn.getAttribute('aria-selected') === 'true') return;
    invitaciones.forEach((b) => { b.setAttribute('aria-selected', String(b === btn)); b.tabIndex = b === btn ? 0 : -1; });
    const mesa = $(`#mesa-${btn.dataset.mesa}`);
    $$('.mesa').forEach((m) => { m.hidden = m !== mesa; });
    if (!anima) return;
    gsap.timeline()
      .fromTo($('.mesa__foto', mesa), { clipPath: 'inset(0 100% 0 0 round 22px)' }, { clipPath: 'inset(0 0% 0 0 round 22px)', duration: 0.9, ease: MOTION.easeIO })
      .fromTo($('.mesa__foto img', mesa), { scale: 1.1 }, { scale: 1, duration: 1.3, ease: MOTION.ease }, 0)
      .from($$('.pin', mesa), { scale: 0, opacity: 0, duration: 0.4, stagger: 0.07, ease: MOTION.ease }, 0.55)
      .from($$('.mesa__detalle > *, .piezas li', mesa), { y: 16, opacity: 0, duration: 0.5, stagger: 0.04, ease: MOTION.ease }, 0.15);
  }
  invitaciones.forEach((b) => b.addEventListener('click', () => elegir(b)));
  $('.montaje__selector').addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const i = invitaciones.findIndex((b) => b.getAttribute('aria-selected') === 'true');
    const sig = invitaciones[(i + (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : -1) + invitaciones.length) % invitaciones.length];
    elegir(sig);
    sig.focus();
  });
  // Cada número de la foto se enlaza con su pieza en la lista (y al revés)
  $$('.mesa').forEach((mesa) => {
    const marcar = (n) => $$('[data-pieza]', mesa).forEach((el) => el.classList.toggle('is-activo', el.dataset.pieza === n));
    $$('[data-pieza]', mesa).forEach((el) => {
      el.addEventListener('pointerenter', () => marcar(el.dataset.pieza));
      el.addEventListener('focus', () => marcar(el.dataset.pieza));
      el.addEventListener('click', () => marcar(el.dataset.pieza));
    });
    mesa.addEventListener('pointerleave', () => marcar(null));
  });
  if (!anima) return;
  const sec = $('.eventos');
  gsap.from($$('.titular > *', sec), { y: 30, opacity: 0, duration: MOTION.revela, stagger: 0.08, ease: MOTION.ease, scrollTrigger: { trigger: sec, start: 'top 80%' } });
  gsap.from('.invitacion', { y: 24, opacity: 0, duration: 0.6, stagger: 0.08, ease: MOTION.ease, scrollTrigger: { trigger: '.montaje', start: 'top 85%' } });
  gsap.fromTo('.mesa:not([hidden]) .mesa__foto', { clipPath: 'inset(0 100% 0 0 round 22px)' }, { clipPath: 'inset(0 0% 0 0 round 22px)', duration: 1.1, ease: MOTION.easeIO, scrollTrigger: { trigger: '.montaje__mesas', start: 'top 80%' } });
  // Los moldes se dibujan a línea
  $$('.formas__lista path, .formas__lista ellipse, .formas__lista circle').forEach((p) => {
    const largo = p.getTotalLength?.() || 300;
    gsap.fromTo(p, { strokeDasharray: largo, strokeDashoffset: largo }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', scrollTrigger: { trigger: '.formas', start: 'top 85%' } });
  });
}
