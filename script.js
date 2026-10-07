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
const animated = !reduceMotion.matches;

// Telón de entrada: un clic o una tecla lo salta.
const skipIntro = () => document.documentElement.classList.add('no-intro');
window.addEventListener('pointerdown', skipIntro, { once: true });
window.addEventListener('keydown', skipIntro, { once: true });

// Resorte reutilizable: lleva un valor hacia su objetivo y solo corre mientras se mueve.
function spring(onFrame, { stiffness = 0.08, damping = 0.82 } = {}) {
  const target = { x: 0, y: 0 };
  const pos = { x: 0, y: 0 };
  const vel = { x: 0, y: 0 };
  let frame = 0;
  const step = () => {
    for (const k of ['x', 'y']) {
      vel[k] = (vel[k] + (target[k] - pos[k]) * stiffness) * damping;
      pos[k] += vel[k];
    }
    onFrame(pos);
    const rest = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) + Math.abs(vel.x) + Math.abs(vel.y);
    frame = rest < 0.001 ? 0 : requestAnimationFrame(step);
  };
  return (x, y) => {
    target.x = x;
    target.y = y;
    if (!frame) frame = requestAnimationFrame(step);
  };
}

// ---------- Foto del inicio ----------

const hero = document.querySelector('.hero');
const heroPhoto = document.querySelector('.hero__photo');
const heroTilt = heroPhoto?.querySelector('.hero__tilt');
const heroArch = heroPhoto?.querySelector('.hero__arch');

// Tocarla la hace temblar como gelatina.
heroPhoto?.addEventListener('click', () => {
  if (!animated || !heroTilt) return;
  heroTilt.animate(
    [
      { scale: '1 1' },
      { scale: '1.045 .95', offset: 0.16 },
      { scale: '.975 1.03', offset: 0.34 },
      { scale: '1.015 .99', offset: 0.52 },
      { scale: '.996 1.006', offset: 0.7 },
      { scale: '1 1' },
    ],
    { duration: 900, easing: 'ease-out' }
  );
});

// Con mouse: la vitrina se inclina en 3D y el brillo sigue al cursor.
if (hero && heroTilt && heroArch && finePointer.matches && animated) {
  const move = spring(({ x, y }) => {
    heroTilt.style.transform = `rotateY(${(x * 9).toFixed(2)}deg) rotateX(${(-y * 7).toFixed(2)}deg)`;
    heroArch.style.setProperty('--sx', `${(50 + x * 45).toFixed(1)}%`);
    heroArch.style.setProperty('--sy', `${(45 + y * 45).toFixed(1)}%`);
  });
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    move(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
  });
  hero.addEventListener('pointerleave', () => move(0, 0));
}

// ---------- Botón imán del llamado final ----------

const magnet = document.querySelector('.magnet');
const magnetBtn = magnet?.querySelector('.btn');
if (magnet && magnetBtn && finePointer.matches && animated) {
  const pull = spring(({ x, y }) => {
    magnetBtn.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  }, { stiffness: 0.12, damping: 0.75 });
  magnet.addEventListener('pointermove', (e) => {
    const r = magnet.getBoundingClientRect();
    pull((e.clientX - (r.left + r.width / 2)) * 0.35, (e.clientY - (r.top + r.height / 2)) * 0.45);
  });
  magnet.addEventListener('pointerleave', () => pull(0, 0));
}

// ---------- Deconstrucción en video ----------

const deco = document.querySelector('.deco');
const decoVideo = deco?.querySelector('.deco__video');
if (deco && decoVideo) {
  const decoSteps = [...deco.querySelectorAll('.deco__step')];
  const decoBar = deco.querySelector('.deco__progress span');
  // La sección solo aparece cuando el video existe y se puede reproducir.
  decoVideo.addEventListener('loadedmetadata', () => { deco.hidden = false; }, { once: true });
  if (decoVideo.readyState >= 1) deco.hidden = false;

  const sync = () => {
    const d = decoVideo.duration || 1;
    const f = Math.min(decoVideo.currentTime / d, 0.9999);
    const idx = Math.floor(f * decoSteps.length);
    decoSteps.forEach((el, i) => el.classList.toggle('is-active', i === idx));
    if (decoBar) decoBar.style.transform = `scaleX(${f.toFixed(4)})`;
    if (!decoVideo.paused) requestAnimationFrame(sync);
  };
  decoVideo.addEventListener('play', () => requestAnimationFrame(sync));
  decoVideo.addEventListener('seeked', sync);

  if (animated && 'IntersectionObserver' in window) {
    // Se reproduce sola mientras se ve y se pausa al salir de pantalla.
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) decoVideo.play().catch(() => { decoVideo.controls = true; });
      else decoVideo.pause();
    }, { threshold: 0.35 }).observe(decoVideo);
  } else {
    decoVideo.controls = true;
    decoVideo.loop = false;
  }
}

// ---------- Aparición con scroll y pausas fuera de pantalla ----------

document.querySelectorAll('.polaroids, .steps__list').forEach((group) => {
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
