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

// Tocar la gelatina principal la hace temblar otra vez.
const heroJelly = document.querySelector('.hero__jelly');
const heroShape = heroJelly?.querySelector('.jelly');

heroJelly?.addEventListener('click', () => {
  if (reduceMotion.matches || !heroShape) return;
  heroShape.getAnimations().forEach((a) => a.cancel());
  heroShape.animate(
    [
      { transform: 'scale(1, 1)' },
      { transform: 'scale(1.14, .84)', offset: 0.14 },
      { transform: 'scale(.9, 1.1)', offset: 0.3 },
      { transform: 'scale(1.07, .94)', offset: 0.46 },
      { transform: 'scale(.96, 1.04)', offset: 0.62 },
      { transform: 'scale(1.02, .985)', offset: 0.78 },
      { transform: 'scale(1, 1)' },
    ],
    { duration: 1000, easing: 'ease-out' }
  );
});

// Aparición escalonada de hermanas y pasos al entrar en pantalla.
const revealGroups = document.querySelectorAll('.polaroids, .steps__list');
revealGroups.forEach((group) => {
  group.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--i', i));
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.2 }
  );
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'));
}
