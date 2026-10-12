// Catálogo: filtros por categoría, entrada de las tarjetas y resaltar un producto.
import { gsap, anima, MOTION } from './config.js';
import { $, $$ } from './util.js';

const tarjetas = () => $$('.producto');

function filtrar(cat) {
  const visibles = [];
  tarjetas().forEach((t) => {
    const ok = cat === 'todos' || t.dataset.cat === cat;
    t.classList.toggle('is-oculto', !ok);
    if (ok) visibles.push(t);
  });
  if (anima) gsap.fromTo(visibles, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.05, ease: MOTION.ease, clearProps: 'transform,opacity' });
}

export function resaltar(id) {
  const t = $(`.producto[data-id="${id}"]`);
  if (!t) return;
  if (t.classList.contains('is-oculto')) $('.filtro[data-cat="todos"]').click();
  t.scrollIntoView({ behavior: anima ? 'smooth' : 'auto', block: 'center' });
  t.classList.add('is-resaltado');
  setTimeout(() => t.classList.remove('is-resaltado'), 2200);
}

export function catalogo() {
  const filtros = $$('.filtro');
  filtros.forEach((b) => b.addEventListener('click', () => {
    filtros.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    filtrar(b.dataset.cat);
  }));
  if (!anima) return;
  // Las tarjetas entran en grupos conforme aparecen
  gsap.set(tarjetas(), { y: 40, opacity: 0 });
  ScrollTrigger.batch(tarjetas(), {
    start: 'top 92%',
    once: true,
    onEnter: (lote) => gsap.to(lote, { y: 0, opacity: 1, duration: MOTION.revela, stagger: 0.08, ease: MOTION.ease, clearProps: 'transform,opacity' }),
  });
}
