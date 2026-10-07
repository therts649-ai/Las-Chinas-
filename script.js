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

// ---------- Efecto gelatina 3D sobre las fotos reales ----------

const heroJelly = !reduceMotion && window.Jelly ? Jelly.attach($('.hero__photo')) : null;

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

const root = document.documentElement;
const introShown = !root.classList.contains('no-intro') && !reduceMotion && !!window.gsap;
if (!window.gsap || reduceMotion) root.classList.add('no-intro');

// Corazones que salen disparados desde un punto
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

  // ---- Entrada: cae una gota, rebota, salen ondas, aparece el logo, la frase
  //      se escribe y la cortina sube escurriendo como gelatina ----
  let start = 0.1;
  if (introShown) {
    const intro = gsap.timeline({ onComplete: () => root.classList.add('no-intro') });
    intro
      .set('.intro__drop', { opacity: 1, y: -window.innerHeight * 0.6, scaleX: 0.8, scaleY: 1.25 })
      .to('.intro__drop', { y: 0, duration: 0.55, ease: 'power2.in' })
      .to('.intro__drop', { scaleX: 1.45, scaleY: 0.6, duration: 0.12, ease: 'power1.out' })
      .to('.intro__drop', { scaleX: 1, scaleY: 1, duration: 0.6, ease: 'elastic.out(1.1, 0.35)' })
      .fromTo('.intro__ring', { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 2.2, duration: 1, stagger: 0.18, ease: 'power2.out' }, '<-0.6')
      .to('.intro__drop', { scale: 2.3, opacity: 0, duration: 0.45, ease: 'power2.in' }, '-=0.55')
      .fromTo('.intro__logo', { opacity: 0, scale: 0.4, rotate: -30 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.7, ease: 'back.out(2)' }, '<0.15')
      .fromTo('.intro__phrase span', { opacity: 0, y: 24, rotate: -8 }, { opacity: 1, y: 0, rotate: 0, duration: 0.5, stagger: 0.09, ease: 'back.out(2)' }, '<0.2')
      .addLabel('out', '+=0.35')
      .to('.intro', { yPercent: -112, duration: 1.05, ease: 'power3.inOut' }, 'out')
      .fromTo('.intro__drips .drip', { scaleY: 1 }, { scaleY: 2.4, duration: 0.7, ease: 'power1.in', yoyo: true, repeat: 1 }, 'out');
    start = intro.labels.out + 0.35;
    const skip = () => { if (intro.progress() < 1 && intro.time() < intro.labels.out) intro.seek('out'); };
    window.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });
  }

  // Título: separar en letras para que caigan una por una
  $$('.hero__title .line').forEach((line) => {
    line.setAttribute('aria-label', line.textContent);
    line.innerHTML = [...line.textContent].map((c) => `<span class="ch" aria-hidden="true">${c}</span>`).join('');
  });

  // Entrada del hero
  const tl = gsap.timeline({ delay: start, defaults: { ease: 'power3.out' } });
  tl.from('.header', { y: -40, opacity: 0, duration: 0.8 })
    .from('.hero__photo', { opacity: 0, scale: 1.12, duration: 1.6, ease: 'power2.out' }, 0)
    .from('.hero__title .ch', { y: -140, opacity: 0, scaleY: 1.5, scaleX: 0.7, rotate: () => gsap.utils.random(-25, 25), duration: 0.9, stagger: 0.035, ease: 'bounce.out' }, 0.1)
    .from('.hero__sub', { opacity: 0, x: -20, duration: 0.7 }, 0.55)
    .from('.hero__list li', { opacity: 0, x: -24, duration: 0.6, stagger: 0.08 }, 0.65)
    .from('.hero__actions .btn', { opacity: 0, y: 20, scale: 0.9, duration: 0.6, stagger: 0.1, ease: 'back.out(2)' }, 0.85)
    .from('.hero__note', { opacity: 0, scale: 0.6, rotate: -30, duration: 0.9, ease: 'back.out(2)' }, 1)
    .from('.fheart', { scale: 0, duration: 0.8, stagger: 0.08, ease: 'back.out(3)' }, 0.9)
    .from('.cats__list', { y: 60, opacity: 0, duration: 0.9 }, 0.9)
    .from('.cat', { y: 20, opacity: 0, duration: 0.5, stagger: 0.05 }, 1.05)
    .from('.hero__drips .hd', { scaleY: 0, duration: 1.2, stagger: 0.12, ease: 'elastic.out(1, 0.5)' }, 0.6)
    .call(() => heroJelly?.poke(0.5, 0.25, 1.4), null, 1.3);

  // Gotas del borde: se estiran despacio, como gelatina que escurre
  $$('.hero__drips .hd').forEach((d, i) => {
    gsap.to(d, { scaleY: 1.35, duration: 2.4 + i * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: start + 2 + i * 0.3 });
  });

  // Tocar el hero lanza corazones y hace temblar la foto
  $('.hero').addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    burst(e.clientX, e.clientY);
    const r = $('.hero__photo').getBoundingClientRect();
    if (e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom) {
      heroJelly?.poke((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, 1.2);
    }
  });

  // Franja de festejos: corre sola y se acelera con la velocidad del scroll
  const mq = gsap.to('.marquee__track', { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
  ScrollTrigger.create({
    trigger: '.marquee',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => {
      const v = gsap.utils.clamp(0, 6, Math.abs(self.getVelocity()) / 300);
      gsap.to(mq, { timeScale: 1 + v, duration: 0.2, overwrite: true, onComplete: () => gsap.to(mq, { timeScale: 1, duration: 1.2 }) });
    },
    onToggle: (self) => (self.isActive ? mq.resume() : mq.pause()),
  });

  // ---- La gelatina capa por capa: el video avanza con el scroll ----
  setupCine();

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
  $$('h2.script:not(.cine__title)').forEach((h) => {
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

// ---------- Gelatina capa por capa ----------

function setupCine() {
  const sec = $('.cine');
  const canvas = $('.cine__canvas', sec);
  const ctx = canvas.getContext('2d');
  const steps = $$('.cine__steps li', sec);
  const bar = $('.cine__progress span', sec);
  const TOTAL = 120;
  const frames = new Array(TOTAL);
  let target = 0, shown = 0, raf = 0, active = -1;

  const src = (i) => `assets/video/cuadros/c${String(i + 1).padStart(3, '0')}.webp`;
  const load = (i) => {
    if (frames[i]) return;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { if (Math.abs(i - Math.round(shown)) < 3) draw(); };
    img.src = src(i);
    frames[i] = img;
  };
  // Primero uno de cada cuatro cuadros (ya se puede ver) y luego el resto
  const preload = () => {
    for (let i = 0; i < TOTAL; i += 4) load(i);
    setTimeout(() => { for (let i = 0; i < TOTAL; i++) load(i); }, 700);
  };
  new IntersectionObserver(([e], obs) => {
    if (e.isIntersecting) { preload(); obs.disconnect(); }
  }, { rootMargin: '800px 0px' }).observe(sec);

  const ready = (img) => img && img.complete && img.naturalWidth;
  const nearest = (i) => {
    for (let d = 0; d < TOTAL; d++) {
      if (ready(frames[i - d])) return frames[i - d];
      if (ready(frames[i + d])) return frames[i + d];
    }
    return null;
  };

  function draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(canvas.clientWidth * dpr), H = Math.round(canvas.clientHeight * dpr);
    if (!W || !H) return;
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    const img = nearest(Math.round(shown));
    if (!img) return;
    ctx.clearRect(0, 0, W, H);
    const ia = img.naturalWidth / img.naturalHeight;
    let w, h, y;
    if (W / H > 1) {
      // Computadora: el video llena la pantalla
      w = Math.max(W, H * ia); h = w / ia; y = (H - h) / 2;
    } else {
      // Celular: la gelatina grande al centro y los bordes se funden con el fondo
      w = W * 1.85; h = w / ia; y = H * 0.48 - h / 2;
    }
    ctx.drawImage(img, (W - w) / 2, y, w, h);
    if (W / H <= 1) {
      const fade = h * 0.22;
      for (const [from, to] of [[y, y + fade], [y + h, y + h - fade]]) {
        const g = ctx.createLinearGradient(0, from, 0, to);
        g.addColorStop(0, 'rgba(248, 211, 204, 1)');
        g.addColorStop(1, 'rgba(248, 211, 204, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, Math.min(from, to) - 1, W, fade + 2);
      }
    }
  }

  const tick = () => {
    shown += (target - shown) * 0.18;
    if (Math.abs(target - shown) < 0.05) shown = target;
    draw();
    raf = shown !== target ? requestAnimationFrame(tick) : 0;
  };

  const setStep = (p) => {
    let idx = 0;
    steps.forEach((li, i) => { if (p >= parseFloat(li.dataset.at)) idx = i; });
    if (idx === active) return;
    if (active >= 0) gsap.to(steps[active], { opacity: 0, y: -16, scale: 0.95, duration: 0.3, ease: 'power2.in', overwrite: true });
    gsap.fromTo(steps[idx], { opacity: 0, y: 24, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(2)', overwrite: true });
    active = idx;
  };

  ScrollTrigger.create({
    trigger: sec,
    start: 'top top',
    end: '+=280%',
    pin: '.cine__pin',
    scrub: true,
    onUpdate: (self) => {
      target = self.progress * (TOTAL - 1);
      bar.style.transform = `scaleX(${self.progress.toFixed(4)})`;
      setStep(self.progress);
      if (!raf) raf = requestAnimationFrame(tick);
    },
  });
  gsap.from('.cine__title', { clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'power2.inOut', scrollTrigger: { trigger: sec, start: 'top 70%' } });
  setStep(0);
  window.addEventListener('resize', draw);
  draw();
}

// Sin GSAP o con movimiento reducido: video normal con controles y todas las etapas
if (!window.gsap || reduceMotion) {
  const sec = $('.cine');
  sec.classList.add('cine--static');
  const v = $('.cine__video', sec);
  v.controls = true;
  v.preload = 'metadata';
}
