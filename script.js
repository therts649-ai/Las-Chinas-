// ---------- Datos de contacto (PENDIENTES: reemplazar por los reales) ----------
const CONFIG = {
  whatsapp: '5210000000000', // lada de país + número, sin "+" ni espacios (ej. 5218112345678)
  instagram: '',             // ej. https://www.instagram.com/laschinas
  facebook: '',              // ej. https://www.facebook.com/laschinas
  tiktok: '',                // ej. https://www.tiktok.com/@laschinas
  maps: 'https://www.google.com/maps/search/?api=1&query=Monterrey%2C%20N.L.',
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = (n) => `$${n.toLocaleString('es-MX')}`;
const waLink = (text) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
const store = {
  get(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch (e) { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
};
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- Enlaces: WhatsApp, redes y mapa ----------

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

// ---------- Aviso breve ----------

const toastEl = $('.toast');
let toastTimer = 0;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2200);
}

// ---------- Paneles (menú, carrito, detalle, búsqueda) ----------

let lastFocus = null;
function openPanel(el) {
  lastFocus = document.activeElement;
  el.hidden = false;
  document.body.classList.add('is-locked');
  const first = el.querySelector('input, button:not(.drawer__scrim), a[href]');
  first?.focus({ preventScroll: true });
}
function closePanel(el) {
  if (!el || el.hidden) return;
  el.hidden = true;
  if (!$$('.drawer:not([hidden]), .modal:not([hidden])').length) document.body.classList.remove('is-locked');
  lastFocus?.focus?.({ preventScroll: true });
}
$$('.drawer, .modal').forEach((el) => {
  el.addEventListener('click', (e) => { if (e.target.closest('.js-close')) closePanel(el); });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') $$('.drawer:not([hidden]), .modal:not([hidden])').forEach(closePanel);
});
$('.js-menu-open').addEventListener('click', () => openPanel($('#menu')));
$$('#menu .drawer__nav a').forEach((a) => a.addEventListener('click', () => closePanel($('#menu'))));

// ---------- Sabores ----------

const cards = $$('.flavor[data-id]');
const products = Object.fromEntries(cards.map((c) => [c.dataset.id, {
  id: c.dataset.id,
  name: c.dataset.name,
  price: Number(c.dataset.price),
  img: c.dataset.img,
  desc: c.dataset.desc,
}]));

// Favoritos
const favs = new Set(store.get('lc-favs', []));
cards.forEach((c) => {
  const btn = $('.flavor__fav', c);
  btn.setAttribute('aria-pressed', favs.has(c.dataset.id));
  btn.addEventListener('click', () => {
    const on = !favs.has(c.dataset.id);
    on ? favs.add(c.dataset.id) : favs.delete(c.dataset.id);
    btn.setAttribute('aria-pressed', on);
    store.set('lc-favs', [...favs]);
    toast(on ? `${c.dataset.name} guardada en favoritos` : `${c.dataset.name} quitada de favoritos`);
  });
});

// Categorías
const track = $('.flavors__track');
const emptyCard = $('.flavor--empty');
$$('.cat').forEach((btn) => btn.addEventListener('click', () => {
  $$('.cat').forEach((b) => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', b === btn); });
  const cat = btn.dataset.cat;
  let shown = 0;
  cards.forEach((c) => {
    const ok = cat === 'todas' || c.dataset.cats.split(' ').includes(cat);
    c.hidden = !ok;
    if (ok) shown++;
  });
  emptyCard.hidden = shown > 0;
  track.scrollTo({ left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  if (!reduceMotion && window.gsap) {
    gsap.fromTo($$('.flavor:not([hidden])', track), { y: 30, opacity: 0, rotateX: -12 }, { y: 0, opacity: 1, rotateX: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out' });
  }
  $('#sabores').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}));

// Flechas del carrusel
const step = () => (cards[0]?.getBoundingClientRect().width || 280) + 20;
$('.js-prev').addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
$('.js-next').addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));

// ---------- Pedido (carrito) ----------

let cart = store.get('lc-cart', {});
const cartEl = $('#cart');
const countEl = $('.cart-count');

function renderCart() {
  const ids = Object.keys(cart).filter((id) => products[id] && cart[id] > 0);
  const list = $('.cart__items', cartEl);
  list.innerHTML = '';
  let total = 0, items = 0;
  for (const id of ids) {
    const p = products[id], q = cart[id];
    total += p.price * q;
    items += q;
    const li = document.createElement('li');
    li.className = 'cart__item';
    li.innerHTML = `
      <img src="${p.img}" alt="">
      <div><h3>${p.name}</h3><span class="price">${money(p.price * q)}</span></div>
      <div class="qty">
        <button class="round round--plain" type="button" data-act="minus" aria-label="Quitar uno de ${p.name}"><svg class="icon" aria-hidden="true"><use href="#i-${q > 1 ? 'minus' : 'trash'}"/></svg></button>
        <output aria-label="Cantidad">${q}</output>
        <button class="round round--plain" type="button" data-act="plus" aria-label="Agregar uno de ${p.name}"><svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg></button>
      </div>`;
    li.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      cart[id] = Math.max(0, q + (act === 'plus' ? 1 : -1));
      if (!cart[id]) delete cart[id];
      saveCart();
    });
    list.appendChild(li);
  }
  $('.js-total', cartEl).textContent = money(total);
  cartEl.classList.toggle('has-items', items > 0);
  countEl.textContent = items;
  countEl.dataset.n = items;
  const lines = ids.map((id) => `• ${cart[id]} × ${products[id].name} (${money(products[id].price * cart[id])})`);
  $('.js-checkout', cartEl).href = waLink(
    `Hola Las Chinas, quiero hacer este pedido:\n${lines.join('\n')}\n\nTotal: ${money(total)}\n\nFecha de entrega: \nNombre: `
  );
}
function saveCart() {
  store.set('lc-cart', cart);
  renderCart();
}
function addToCart(id, qty = 1, fromImg) {
  const r = document.activeElement?.getBoundingClientRect?.();
  if (r && r.width) burst(r.left + r.width / 2, r.top + r.height / 2, 6);
  cart[id] = (cart[id] || 0) + qty;
  saveCart();
  flyToCart(fromImg);
  countEl.classList.remove('is-bump');
  void countEl.offsetWidth;
  countEl.classList.add('is-bump');
  toast(`${products[id].name} agregada a tu pedido`);
}
// La foto vuela hasta el carrito
function flyToCart(img) {
  if (!img || reduceMotion || !window.gsap) return;
  const a = img.getBoundingClientRect();
  const b = $('.js-cart-open').getBoundingClientRect();
  const clone = img.cloneNode();
  clone.className = 'fly';
  Object.assign(clone.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
  document.body.appendChild(clone);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  gsap.timeline({ onComplete: () => clone.remove() })
    .to(clone, { x: dx, duration: 0.8, ease: 'power1.inOut' }, 0)
    .to(clone, { y: dy, duration: 0.8, ease: 'back.in(1.4)' }, 0)
    .to(clone, { scale: 0.12, rotate: 25, borderRadius: '50%', duration: 0.8, ease: 'power2.in' }, 0)
    .to(clone, { opacity: 0, duration: 0.15 }, 0.7);
}
cards.forEach((c) => $('.js-add', c).addEventListener('click', () => addToCart(c.dataset.id, 1, $('img', c))));
$('.js-cart-open').addEventListener('click', () => openPanel(cartEl));
$('.js-checkout').addEventListener('click', () => toast('Abriendo WhatsApp con tu pedido'));
renderCart();

// ---------- Detalle de un sabor ----------

const detail = $('#detalle');
let detailId = null, detailQty = 1, detailJelly = null;
function openDetail(id) {
  const p = products[id];
  detailId = id;
  detailQty = 1;
  const img = $('.js-detail-img', detail);
  img.src = p.img;
  img.alt = `Gelatina de ${p.name.toLowerCase()}`;
  $('.js-detail-name', detail).textContent = p.name;
  $('.js-detail-price', detail).textContent = money(p.price);
  $('.js-detail-desc', detail).textContent = p.desc;
  $('.js-qty', detail).textContent = detailQty;
  openPanel(detail);
  if (!reduceMotion && window.Jelly) {
    detailJelly ||= Jelly.attach($('.modal__media', detail));
    img.decode?.().then(() => setTimeout(() => detailJelly.poke(0.5, 0.35, 1), 250)).catch(() => {});
  }
}
cards.forEach((c) => $('.flavor__media', c).addEventListener('click', () => openDetail(c.dataset.id)));
$('.js-qty-minus', detail).addEventListener('click', () => { detailQty = Math.max(1, detailQty - 1); $('.js-qty', detail).textContent = detailQty; });
$('.js-qty-plus', detail).addEventListener('click', () => { detailQty++; $('.js-qty', detail).textContent = detailQty; });
$('.js-detail-add', detail).addEventListener('click', () => {
  const img = $('.js-detail-img', detail);
  addToCart(detailId, detailQty, img);
  closePanel(detail);
});

// ---------- Búsqueda ----------

const search = $('#buscar');
const input = $('#buscar-input');
const results = $('.search__results', search);
function renderSearch() {
  const q = input.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const found = Object.values(products).filter((p) => {
    const hay = `${p.name} ${p.desc}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return !q || hay.includes(q);
  });
  results.innerHTML = found.length
    ? found.map((p) => `<li><button type="button" data-id="${p.id}"><img src="${p.img}" alt=""><span><strong>${p.name}</strong></span><span class="price">${money(p.price)}</span></button></li>`).join('')
    : `<li class="none">No encontramos "${input.value}". Pídela personalizada por WhatsApp.</li>`;
}
$('.js-search-open').addEventListener('click', () => { input.value = ''; renderSearch(); openPanel(search); });
input.addEventListener('input', renderSearch);
results.addEventListener('click', (e) => {
  const id = e.target.closest('[data-id]')?.dataset.id;
  if (!id) return;
  closePanel(search);
  openDetail(id);
});

// ---------- Encabezado: fondo al bajar y sección actual ----------

const header = $('.header');
new IntersectionObserver(([e]) => header.classList.toggle('is-scrolled', !e.isIntersecting), { rootMargin: '-80px 0px 0px 0px' })
  .observe($('.hero'));
const navLinks = $$('.header__nav a');
const spy = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === `#${e.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
['inicio', 'sabores', 'pedidos', 'nosotras', 'ubicacion', 'contacto']
  .map((id) => document.getElementById(id)).filter(Boolean)
  .forEach((el) => spy.observe(el));

// El hero pausa sus luces y corazones cuando no se ve
new IntersectionObserver(([e]) => $('.hero').classList.toggle('is-offscreen', !e.isIntersecting)).observe($('.hero'));

// ---------- Coreografía con GSAP ----------

const root = document.documentElement;
const introShown = !root.classList.contains('no-intro') && !reduceMotion && !!window.gsap;
if (!window.gsap || reduceMotion) root.classList.add('no-intro');

// Corazones que salen al agregar al pedido
function burst(x, y, n = 8) {
  if (reduceMotion || !window.gsap) return;
  for (let i = 0; i < n; i++) {
    const h = document.createElement('span');
    h.className = 'burst';
    h.style.left = `${x}px`;
    h.style.top = `${y}px`;
    document.body.appendChild(h);
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.6;
    const d = 50 + Math.random() * 70;
    gsap.fromTo(h, { scale: 0.3, rotate: 0, opacity: 1 }, {
      x: Math.cos(a) * d, y: Math.sin(a) * d - 30, scale: 0.6 + Math.random() * 0.9,
      rotate: (Math.random() - 0.5) * 120, opacity: 0, duration: 0.9 + Math.random() * 0.4,
      ease: 'power2.out', onComplete: () => h.remove(),
    });
  }
}

if (window.gsap && !reduceMotion) {
  gsap.registerPlugin(ScrollTrigger);

  // ---- Entrada: la frase se revela línea por línea, aparece el logo y la
  //      cortina se levanta como un molde, estirándose antes de soltarse ----
  let start = 0.1;
  if (introShown) {
    const edge = $('.intro__edge path');
    const pull = { v: 1 };
    const drawEdge = () => edge.setAttribute('d', `M0 0 H1200 V1 Q600 ${pull.v.toFixed(1)} 0 1 Z`);
    const intro = gsap.timeline({ onComplete: () => root.classList.add('no-intro') });
    intro
      .from('.intro__line > span', { yPercent: 115, duration: 1.1, stagger: 0.18, ease: 'power4.out' }, 0.25)
      .from('.intro__rule', { scaleX: 0, duration: 0.9, ease: 'power3.inOut' }, 0.9)
      .from('.intro__logo', { opacity: 0, y: 16, scale: 0.92, duration: 0.9, ease: 'power3.out' }, 1.05)
      .addLabel('out', 2.3)
      .to('.intro__panel > *', { y: -24, opacity: 0, duration: 0.45, stagger: 0.04, ease: 'power2.in' }, 'out')
      .to('.intro', { yPercent: -100, duration: 1.15, ease: 'power3.inOut' }, 'out+=0.3')
      .to(pull, { v: 120, duration: 0.6, ease: 'power2.in', onUpdate: drawEdge }, 'out+=0.3')
      .to(pull, { v: 1, duration: 1.1, ease: 'elastic.out(1, 0.32)', onUpdate: drawEdge }, '>');
    start = intro.labels.out + 0.75;
    const skip = () => { if (intro.time() < intro.labels.out) intro.seek('out'); };
    window.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });
  }

  // Entrada del hero: la foto se asienta y el título aparece línea por línea
  const tl = gsap.timeline({ delay: start, defaults: { ease: 'power3.out' } });
  tl.from('.header', { y: -30, opacity: 0, duration: 0.9 })
    .from('.hero__photo', { opacity: 0, scale: 1.08, duration: 1.8, ease: 'power2.out' }, 0)
    .fromTo('.hero__title .line', { clipPath: 'inset(-20% -10% 100% -10%)', y: 40 }, { clipPath: 'inset(-20% -10% -30% -10%)', y: 0, duration: 1.1, stagger: 0.14, ease: 'power4.out' }, 0.15)
    .from('.hero__sub', { opacity: 0, y: 16, duration: 0.8 }, 0.55)
    .from('.hero__list li', { opacity: 0, y: 14, duration: 0.7, stagger: 0.06 }, 0.65)
    .from('.hero__actions .btn', { opacity: 0, y: 16, duration: 0.7, stagger: 0.08 }, 0.8)
    .from('.hero__note', { opacity: 0, y: 10, duration: 0.9 }, 1)
    .from('.cats__list', { y: 40, opacity: 0, duration: 0.9 }, 0.9);

  // ---- La gelatina capa por capa, controlada con el scroll ----
  setupCapas();

  // Profundidad del hero: la foto sigue al mouse muy poco
  if (finePointer) {
    const px = gsap.quickTo('.hero__photo', 'x', { duration: 1.2, ease: 'power3' });
    const py = gsap.quickTo('.hero__photo', 'y', { duration: 1.2, ease: 'power3' });
    $('.hero').addEventListener('pointermove', (e) => {
      px((e.clientX / window.innerWidth - 0.5) * -18);
      py((e.clientY / window.innerHeight - 0.5) * -12);
    });
  }

  // Al bajar, la foto del hero se aleja y el texto sube más rápido
  gsap.to('.hero__photo', { yPercent: 10, scale: 1.04, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { y: -70, opacity: 0.3, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Entradas de las secciones: todas iguales, suaves y cortas
  const rise = (targets, trigger, extra = {}) => gsap.from(targets, {
    y: 36, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08,
    scrollTrigger: { trigger, start: 'top 85%' }, ...extra,
  });
  $$('h2.script').forEach((h) => {
    gsap.from(h, { clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'power2.inOut', scrollTrigger: { trigger: h, start: 'top 85%' } });
  });
  rise('.flavor[data-id]', '.flavors__track');
  rise('.special', '.special');
  rise('.quality__list li', '.quality');
  rise('.about__photo img', '.about');
  rise('.how__list li', '.how__list');
  rise('.insta__item', '.insta__grid', { stagger: 0.05 });
  rise('.cta', '.cta');

  // Banners: la foto se mueve más lento que el scroll
  $$('[data-parallax] img').forEach((img) => {
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
}

// ---------- Capa por capa ----------
// La foto real de la gelatina separada en capas (herramientas/capas.py):
// se abre, flota, se vuelve a unir con un temblor y queda lista para pedir.

function setupCapas() {
  const sec = $('.capas');
  const fresa = $('.capas__fresa', sec);
  const leche = $('.capas__leche', sec);
  const plato = $('.capas__plato', sec);
  const notas = $$('.capas__notas li', sec);
  const [s1, s2, s3] = $$('.capas__suelta', sec);

  // Las imágenes se piden antes de llegar para que nada aparezca a medias
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    $$('img', sec).forEach((i) => { i.loading = 'eager'; });
    obs.disconnect();
  }, { rootMargin: '1200px 0px' }).observe(sec);

  gsap.set([s1, s2, s3], { opacity: 0 });
  gsap.set(s1, { xPercent: -260, yPercent: 40, rotation: -40, scale: 0.8 });
  gsap.set(s2, { xPercent: 260, yPercent: -30, rotation: 50, scale: 0.7 });
  gsap.set(s3, { xPercent: 120, yPercent: -220, rotation: 20, scale: 0.5 });

  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  tl.fromTo('.capas__stage', { scale: 0.9, yPercent: 6 }, { scale: 1, yPercent: 0, duration: 1.2, ease: 'power2.out' }, 0)
    // Se abre: la fresa sube, la leche se despega del plato
    .addLabel('abre', 0.8)
    .to(fresa, { yPercent: -11, duration: 1.8, ease: 'power2.inOut' }, 'abre')
    .to(leche, { yPercent: -3.6, duration: 1.8, ease: 'power2.inOut' }, 'abre')
    .to('.capas__gap', { opacity: 1, duration: 1.2 }, 'abre')
    .to('.capas__apoyo', { opacity: 1, duration: 1.2 }, 'abre')
    // Flota: cada capa gira un poco y llegan las fresas
    .addLabel('flota', 2.6)
    .to(fresa, { yPercent: -14, xPercent: 1.2, rotation: -1.6, duration: 3.4, ease: 'sine.inOut' }, 'flota')
    .to(leche, { yPercent: -5, xPercent: -0.6, rotation: 0.9, duration: 3.4, ease: 'sine.inOut' }, 'flota')
    .to(plato, { yPercent: 1.4, duration: 3.4, ease: 'sine.inOut' }, 'flota')
    .to('.capas__gap', { opacity: 0.75, duration: 3.4 }, 'flota')
    .to(s1, { opacity: 1, xPercent: -30, yPercent: -10, rotation: -12, scale: 1, duration: 2.4, ease: 'power2.out' }, 'flota')
    .to(s2, { opacity: 1, xPercent: 20, yPercent: 10, rotation: 18, scale: 0.85, duration: 2.4, ease: 'power2.out' }, 'flota+=0.4')
    .to(s3, { opacity: 0.9, xPercent: 10, yPercent: -20, rotation: -8, scale: 0.6, duration: 2.4, ease: 'power2.out' }, 'flota+=0.8')
    // Se vuelve a unir: cae por su peso
    .addLabel('cierra', 6)
    .to(fresa, { yPercent: 0, xPercent: 0, rotation: 0, duration: 1.5, ease: 'power2.in' }, 'cierra')
    .to(leche, { yPercent: 0, xPercent: 0, rotation: 0, duration: 1.3, ease: 'power2.in' }, 'cierra')
    .to(plato, { yPercent: 0, duration: 1.3, ease: 'power2.inOut' }, 'cierra')
    .to(['.capas__gap', '.capas__apoyo'], { opacity: 0, duration: 1.3 }, 'cierra')
    .addLabel('cae', 7.5)
    // Las fresas se acomodan junto al plato
    .to(s1, { xPercent: 10, yPercent: 60, rotation: -4, scale: 0.95, duration: 1.6, ease: 'power2.inOut' }, 'cierra+=0.4')
    .to(s2, { xPercent: -30, yPercent: 70, rotation: 8, scale: 0.8, duration: 1.6, ease: 'power2.inOut' }, 'cierra+=0.5')
    .to(s3, { opacity: 0, yPercent: -60, duration: 1.2 }, 'cierra+=0.3')
    .to({}, { duration: 2.2 });

  // El temblor al caer no se controla con el scroll: es física, pasa una vez
  let st = null;
  const jiggle = () => {
    if (st && st.direction < 0) return;
    gsap.timeline()
      .to(fresa, { scaleY: 0.955, scaleX: 1.022, duration: 0.1, ease: 'power2.out', transformOrigin: '50% 72%' })
      .to(fresa, { scaleY: 1, scaleX: 1, duration: 1.2, ease: 'elastic.out(1.15, 0.28)' })
      .fromTo(fresa, { skewX: 0 }, { keyframes: { skewX: [1.4, -1.1, 0.7, -0.35, 0] }, duration: 1.1, ease: 'sine.out' }, 0.06)
      .to(leche, { scaleY: 0.985, duration: 0.1, transformOrigin: '50% 90%' }, 0.02)
      .to(leche, { scaleY: 1, duration: 0.9, ease: 'elastic.out(1, 0.35)' }, 0.12);
  };
  tl.call(jiggle, null, 'cae');

  const total = tl.duration();
  const marks = [1.4 / total, 3.4 / total, 4.8 / total];
  const finalAt = 7.8 / total;
  let last = -2;
  st = ScrollTrigger.create({
    trigger: sec,
    start: 'top top',
    end: '+=320%',
    pin: '.capas__pin',
    scrub: 0.6,
    animation: tl,
    onUpdate: (self) => {
      const p = self.progress;
      let idx = -1;
      marks.forEach((m, i) => { if (p >= m) idx = i; });
      if (p >= finalAt) idx = 3;
      if (idx === last) return;
      last = idx;
      notas.forEach((li, i) => li.classList.toggle('is-on', i === idx));
      notas.forEach((li, i) => li.classList.toggle('is-past', i < idx));
      sec.classList.toggle('is-final', idx === 3);
    },
  });
  gsap.from('.capas__head > *', { y: 30, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: sec, start: 'top 70%' } });
}

// Sin GSAP o con movimiento reducido: la gelatina completa y las tres notas a la vista
if (!window.gsap || reduceMotion) $('.capas').classList.add('capas--static');
