// Número de WhatsApp con lada de país, sin "+" ni espacios (ej. 5215512345678).
// PENDIENTE: reemplazar por el número real de Las Chinas.
const WHATSAPP_NUMBER = '5210000000000';

// Cada enlace con data-wa abre WhatsApp con su mensaje ya escrito.
document.querySelectorAll('[data-wa]').forEach((link) => {
  link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(link.dataset.wa)}`;
  link.target = '_blank';
  link.rel = 'noopener';
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

// ---------- Gelatina del inicio ----------

const hero = document.querySelector('.hero');
const heroJelly = document.querySelector('.hero__jelly');
const heroShape = heroJelly?.querySelector('.jelly');
const heroLean = heroJelly?.querySelector('.hero__lean');
const cubes = document.querySelector('.cubes');

// Tocarla la hace temblar otra vez (WAAPI: se puede interrumpir y repetir).
heroJelly?.addEventListener('click', () => {
  if (reduceMotion.matches || !heroShape) return;
  heroShape.getAnimations().forEach((a) => a.cancel());
  heroShape.animate(
    [
      { transform: 'scale(1, 1)' },
      { transform: 'scale(1.15, .84)', offset: 0.14 },
      { transform: 'scale(.9, 1.1)', offset: 0.3 },
      { transform: 'scale(1.07, .94)', offset: 0.46 },
      { transform: 'scale(.96, 1.04)', offset: 0.62 },
      { transform: 'scale(1.02, .985)', offset: 0.78 },
      { transform: 'scale(1, 1)' },
    ],
    { duration: 1000, easing: 'ease-out' }
  );
});

// Con mouse: la gelatina se inclina hacia el cursor y los cubitos lo siguen,
// con un resorte que solo corre mientras hay movimiento.
if (hero && heroLean && finePointer.matches && !reduceMotion.matches) {
  const target = { x: 0, y: 0 };
  const pos = { x: 0, y: 0 };
  const vel = { x: 0, y: 0 };
  let frame = 0;

  const step = () => {
    for (const k of ['x', 'y']) {
      vel[k] = (vel[k] + (target[k] - pos[k]) * 0.08) * 0.82; // rigidez y amortiguamiento
      pos[k] += vel[k];
    }
    heroLean.style.transform = `skewX(${(-pos.x * 7).toFixed(2)}deg) rotate(${(pos.x * 2).toFixed(2)}deg)`;
    cubes?.style.setProperty('--px', (pos.x * 14).toFixed(2));
    cubes?.style.setProperty('--py', (pos.y * 14).toFixed(2));
    const settled = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) + Math.abs(vel.x) + Math.abs(vel.y) < 0.001;
    frame = settled ? 0 : requestAnimationFrame(step);
  };
  const kick = () => { if (!frame) frame = requestAnimationFrame(step); };

  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    kick();
  });
  hero.addEventListener('pointerleave', () => {
    target.x = 0;
    target.y = 0;
    kick();
  });
}

// ---------- Aparición con scroll y pausas fuera de pantalla ----------

// Cuando la gelatina de una tarjeta termina de aterrizar, queda lista para el hover.
document.querySelector('.bento')?.addEventListener('animationend', (e) => {
  if (e.animationName === 'land') e.target.closest('.card')?.classList.add('landed');
});

document.querySelectorAll('.polaroids, .bento, .steps__list').forEach((group) => {
  group.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--i', i));
});

if ('IntersectionObserver' in window) {
  const revealer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealer.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => revealer.observe(el));

  // Los ciclos infinitos (cubitos, franja) se detienen cuando no se ven.
  const pauser = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle('is-offscreen', !entry.isIntersecting));
  });
  document.querySelectorAll('.hero, .marquee').forEach((el) => pauser.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'));
}
