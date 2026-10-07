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

// ---------- Video de la deconstrucción ----------

const deco = $('.deco');
const decoVideo = $('.deco__video');
if (deco && decoVideo) {
  const decoSteps = $$('.deco__step', deco);
  const decoBar = $('.deco__progress span', deco);
  decoVideo.addEventListener('loadedmetadata', () => { deco.hidden = false; window.ScrollTrigger?.refresh(); }, { once: true });
  if (decoVideo.readyState >= 1) deco.hidden = false;
  const sync = () => {
    const t = decoVideo.currentTime, d = decoVideo.duration || 1;
    let idx = 0;
    decoSteps.forEach((el, i) => { if (t >= parseFloat(el.dataset.t || 0)) idx = i; });
    decoSteps.forEach((el, i) => el.classList.toggle('is-active', i === idx));
    if (decoBar) decoBar.style.transform = `scaleX(${Math.min(t / d, 1).toFixed(4)})`;
    if (!decoVideo.paused) requestAnimationFrame(sync);
  };
  decoVideo.addEventListener('play', () => requestAnimationFrame(sync));
  if (!reduceMotion && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) decoVideo.play().catch(() => { decoVideo.controls = true; });
      else decoVideo.pause();
    }, { threshold: 0.35 }).observe(decoVideo);
  } else {
    decoVideo.controls = true;
    decoVideo.loop = false;
  }
}

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

// ---------- Efecto gelatina 3D sobre las fotos reales ----------

if (!reduceMotion && window.Jelly) {
  cards.forEach((c) => {
    const j = Jelly.attach($('.flavor__media', c));
    // Tiembla una vez la primera vez que aparece en pantalla
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return;
      setTimeout(() => j.poke(0.5, 0.3, 0.9), 200 + Math.random() * 300);
      obs.disconnect();
    }, { threshold: 0.6 }).observe(c);
  });
}

// ---------- Coreografía con GSAP ----------

const introShown = document.documentElement.classList.contains('js') && !document.documentElement.classList.contains('no-intro') && !reduceMotion;
const skipIntro = () => document.documentElement.classList.add('no-intro');
if (introShown) {
  window.addEventListener('pointerdown', skipIntro, { once: true });
  window.addEventListener('keydown', skipIntro, { once: true });
}

if (window.gsap && !reduceMotion) {
  gsap.registerPlugin(ScrollTrigger);
  const start = introShown ? 2.5 : 0.1;

  // Entrada del hero
  const tl = gsap.timeline({ delay: start, defaults: { ease: 'power3.out' } });
  tl.from('.header', { y: -40, opacity: 0, duration: 0.8 })
    .from('.hero__photo', { opacity: 0, scale: 1.12, duration: 1.6, ease: 'power2.out' }, 0)
    .from('.hero__title .line', { yPercent: 110, opacity: 0, rotate: -6, duration: 1, stagger: 0.12, ease: 'back.out(1.6)' }, 0.15)
    .from('.hero__sub', { opacity: 0, x: -20, duration: 0.7 }, 0.55)
    .from('.hero__list li', { opacity: 0, x: -24, duration: 0.6, stagger: 0.08 }, 0.65)
    .from('.hero__actions .btn', { opacity: 0, y: 20, scale: 0.9, duration: 0.6, stagger: 0.1, ease: 'back.out(2)' }, 0.85)
    .from('.hero__note', { opacity: 0, scale: 0.6, rotate: -30, duration: 0.9, ease: 'back.out(2)' }, 1)
    .from('.fheart', { scale: 0, duration: 0.8, stagger: 0.08, ease: 'back.out(3)' }, 0.9)
    .from('.cats__list', { y: 60, opacity: 0, duration: 0.9 }, 0.9)
    .from('.cat', { y: 20, opacity: 0, duration: 0.5, stagger: 0.05 }, 1.05);

  // Profundidad del hero: cada capa sigue al mouse a distinta distancia
  if (finePointer) {
    const layers = $$('[data-depth]').map((el) => ({
      d: parseFloat(el.dataset.depth),
      x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3' }),
      y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3' }),
    }));
    const tx = gsap.quickTo('.hero__content', 'x', { duration: 1, ease: 'power3' });
    $('.hero').addEventListener('pointermove', (e) => {
      const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
      layers.forEach((l) => { l.x(nx * -30 * l.d); l.y(ny * -20 * l.d); });
      tx(nx * 10);
    });
  }

  // Al bajar, la foto del hero se aleja y el texto sube más rápido
  gsap.to('.hero__photo', { yPercent: 12, scale: 1.05, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { y: -80, opacity: 0.3, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Títulos script: aparecen escribiéndose de izquierda a derecha
  $$('h2.script').forEach((h) => {
    gsap.from(h, { clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'power2.inOut', scrollTrigger: { trigger: h, start: 'top 85%' } });
  });

  // Tarjetas de sabores: entran girando en 3D
  gsap.from('.flavor[data-id]', {
    y: 60, rotateX: -18, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out',
    scrollTrigger: { trigger: '.flavors__track', start: 'top 85%' },
  });

  // Banners: la foto se mueve más lento que el scroll
  $$('[data-parallax] img').forEach((img) => {
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.from('.special', { y: 50, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.special', start: 'top 85%' } });
  gsap.from('.special__icon', { scale: 0, rotate: -90, duration: 0.9, ease: 'back.out(2.5)', scrollTrigger: { trigger: '.special', start: 'top 80%' } });
  gsap.from('.quality__list li', { y: 30, opacity: 0, scale: 0.9, duration: 0.7, stagger: 0.12, ease: 'back.out(2)', scrollTrigger: { trigger: '.quality', start: 'top 75%' } });
  gsap.from('.about__photo img', { rotate: -12, y: 60, opacity: 0, duration: 1.1, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.about', start: 'top 75%' } });
  gsap.from('.about__note', { scale: 0, rotate: -20, duration: 0.8, delay: 0.3, ease: 'back.out(2.5)', scrollTrigger: { trigger: '.about', start: 'top 75%' } });
  gsap.from('.how__list li', { y: 50, opacity: 0, rotateY: -20, duration: 0.8, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.how__list', start: 'top 85%' } });
  gsap.from('.insta__item', { y: 40, opacity: 0, scale: 0.85, duration: 0.7, stagger: 0.06, ease: 'back.out(1.8)', scrollTrigger: { trigger: '.insta__grid', start: 'top 88%' } });
  gsap.from('.map__pin', { y: -60, opacity: 0, duration: 0.9, ease: 'bounce.out', scrollTrigger: { trigger: '.visit', start: 'top 80%' } });
  gsap.from('.cta', { y: 50, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.cta', start: 'top 88%' } });

  // Tarjetas con inclinación 3D y reflejo al pasar el mouse
  if (finePointer) {
    $$('.flavor[data-id], .how__list li, .visit__card').forEach((el) => {
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
      const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
      gsap.set(el, { transformPerspective: 900 });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 10);
        rx(((e.clientY - r.top) / r.height - 0.5) * -10);
      });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
}
