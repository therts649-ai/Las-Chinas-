// Enlaces externos, encabezado, sección actual y paneles (menú, pedido, detalle, búsqueda).
import { CONFIG } from './config.js';
import { $, $$, waLink, toast } from './util.js';

export function enlaces() {
  $$('[data-wa]').forEach((a) => {
    a.href = waLink(a.dataset.wa);
    a.target = '_blank';
    a.rel = 'noopener';
  });
  $$('.js-social').forEach((a) => {
    const url = CONFIG[a.dataset.social];
    if (url) {
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
    } else {
      a.setAttribute('aria-disabled', 'true');
      a.title = 'Muy pronto';
      a.addEventListener('click', (e) => { e.preventDefault(); toast('Nuestras redes estarán disponibles muy pronto'); });
    }
  });
  $$('.js-maps').forEach((a) => { a.href = CONFIG.maps; });
}

let lastFocus = null;
export function openPanel(el) {
  lastFocus = document.activeElement;
  el.hidden = false;
  document.body.classList.add('is-locked');
  el.querySelector('input, button:not(.drawer__scrim), a[href]')?.focus({ preventScroll: true });
}
export function closePanel(el) {
  if (!el || el.hidden) return;
  el.hidden = true;
  if (!$$('.drawer:not([hidden]), .modal:not([hidden])').length) document.body.classList.remove('is-locked');
  lastFocus?.focus?.({ preventScroll: true });
}

export function paneles() {
  $$('.drawer, .modal').forEach((el) => el.addEventListener('click', (e) => { if (e.target.closest('.js-close')) closePanel(el); }));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $$('.drawer:not([hidden]), .modal:not([hidden])').forEach(closePanel);
  });
  $('.js-menu-open').addEventListener('click', () => openPanel($('#menu')));
  $$('#menu .drawer__nav a').forEach((a) => a.addEventListener('click', () => closePanel($('#menu'))));
}

export function encabezado() {
  const header = $('.header');
  const hero = $('.hero');
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > hero.offsetHeight - 80);
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
  const links = $$('.header__nav a');
  const spy = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === `#${e.target.id}`));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean).forEach((s) => spy.observe(s));
}
