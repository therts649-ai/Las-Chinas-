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

// ---------- Foto del inicio ----------

const hero = document.querySelector('.hero');
const heroPhoto = document.querySelector('.hero__photo');
const heroTilt = heroPhoto?.querySelector('.hero__tilt');

// Tocarla la hace temblar como gelatina (WAAPI: se puede repetir sin esperar).
heroPhoto?.addEventListener('click', () => {
  if (reduceMotion.matches || !heroTilt) return;
  heroTilt.animate(
    [
      { scale: '1 1' },
      { scale: '1.05 .94', offset: 0.16 },
      { scale: '.97 1.035', offset: 0.34 },
      { scale: '1.02 .985', offset: 0.52 },
      { scale: '.995 1.008', offset: 0.7 },
      { scale: '1 1' },
    ],
    { duration: 900, easing: 'ease-out' }
  );
});

// Con mouse: la foto se inclina en 3D hacia el cursor con un resorte
// que solo corre mientras hay movimiento.
if (hero && heroTilt && finePointer.matches && !reduceMotion.matches) {
  const target = { x: 0, y: 0 };
  const pos = { x: 0, y: 0 };
  const vel = { x: 0, y: 0 };
  let frame = 0;

  const step = () => {
    for (const k of ['x', 'y']) {
      vel[k] = (vel[k] + (target[k] - pos[k]) * 0.08) * 0.82; // rigidez y amortiguamiento
      pos[k] += vel[k];
    }
    heroTilt.style.transform = `rotateY(${(pos.x * 8).toFixed(2)}deg) rotateX(${(-pos.y * 6).toFixed(2)}deg)`;
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

  // Los ciclos infinitos (sello, franja) se detienen cuando no se ven.
  const pauser = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle('is-offscreen', !entry.isIntersecting));
  });
  document.querySelectorAll('.hero, .marquee').forEach((el) => pauser.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'));
}
