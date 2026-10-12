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
const waLink = (text) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
const store = {
  get(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch (e) { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const gsap = window.gsap;
const anima = !!gsap && !reduceMotion;
const dur = (s) => (anima ? s : 0);

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
  toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2400);
}

// ---------- Paneles (menú, pedido, detalle, búsqueda) ----------

let lastFocus = null;
function openPanel(el) {
  lastFocus = document.activeElement;
  el.hidden = false;
  document.body.classList.add('is-locked');
  el.querySelector('input, button:not(.drawer__scrim), a[href]')?.focus({ preventScroll: true });
}
function closePanel(el) {
  if (!el || el.hidden) return;
  el.hidden = true;
  if (!$$('.drawer:not([hidden]), .modal:not([hidden])').length) document.body.classList.remove('is-locked');
  lastFocus?.focus?.({ preventScroll: true });
}
$$('.drawer, .modal').forEach((el) => el.addEventListener('click', (e) => { if (e.target.closest('.js-close')) closePanel(el); }));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') $$('.drawer:not([hidden]), .modal:not([hidden])').forEach(closePanel);
});
$('.js-menu-open').addEventListener('click', () => openPanel($('#menu')));
$$('#menu .drawer__nav a').forEach((a) => a.addEventListener('click', () => closePanel($('#menu'))));

// ---------- El catálogo sale de la carta (una sola fuente de datos) ----------

const products = Object.fromEntries($$('.plato[data-id]').map((li) => [li.dataset.id, {
  id: li.dataset.id,
  name: li.dataset.name,
  img: li.dataset.img,
  desc: li.dataset.desc,
  menu: $('h3', li.closest('.menu')).textContent,
}]));

// =========================================================
// La carta: un mazo que se baraja y una hoja que da vuelta
// =========================================================

const mazo = $('.mazo');
const naipes = $$('.naipe', mazo);
const pagina = $('.hoja__pagina');
let menuActual = naipes[0].dataset.menu;

// Lugar de cada carta según su distancia a la elegida: al frente, luego en abanico
const ABANICO = [
  { x: 0, y: 0, r: 0, s: 1 },
  { x: -14, y: 2, r: -7, s: 0.95 },
  { x: 14, y: 2, r: 7, s: 0.95 },
  { x: -26, y: 5, r: -13, s: 0.9 },
  { x: 26, y: 5, r: 13, s: 0.9 },
];
function acomodar(elegida, animar = true) {
  const i0 = naipes.indexOf(elegida);
  naipes.forEach((n, i) => {
    const k = (i - i0 + naipes.length) % naipes.length;
    const p = ABANICO[k] || ABANICO[ABANICO.length - 1];
    n.style.zIndex = String(10 - k);
    n.setAttribute('aria-selected', String(k === 0));
    n.tabIndex = k === 0 ? 0 : -1;
    const destino = { xPercent: p.x, yPercent: p.y, rotation: p.r, scale: p.s };
    if (!gsap) return;
    if (!animar || !anima) return gsap.set(n, destino);
    if (k === 0) {
      // La carta elegida sale del mazo, sube y llega al frente
      n.style.zIndex = '20';
      gsap.timeline({ onComplete: () => { n.style.zIndex = '10'; } })
        .to(n, { yPercent: -16, rotation: 0, scale: 1.04, duration: 0.32, ease: 'power2.out' })
        .to(n, { xPercent: 0, yPercent: 0, scale: 1, duration: 0.6, ease: 'power3.inOut' });
    } else {
      gsap.to(n, { ...destino, duration: 0.8, ease: 'power3.inOut', delay: 0.04 * k });
    }
  });
}

function mostrarMenu(id) {
  $$('.menu', pagina).forEach((m) => { m.hidden = m.id !== `menu-${id}`; });
}
let tlHoja = null;
function elegir(id, { desplazar = false } = {}) {
  const naipe = naipes.find((n) => n.dataset.menu === id);
  if (!naipe) return;
  if (desplazar) $('#carta').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  if (id === menuActual) return;
  tlHoja?.progress(1); // si la hoja seguía cambiando, termina de inmediato
  menuActual = id;
  acomodar(naipe);
  if (!anima) return mostrarMenu(id);
  // La hoja cambia con un velo que baja y vuelve a descubrirla (sin 3D)
  const viejos = $$(`.menu:not([hidden]) > *, .menu:not([hidden]) .plato`, pagina);
  tlHoja = gsap.timeline()
    .to(viejos, { y: -10, opacity: 0, duration: 0.28, stagger: 0.02, ease: 'power2.in' })
    .add(() => { gsap.set(viejos, { clearProps: 'all' }); mostrarMenu(id); })
    .fromTo(pagina, { clipPath: 'inset(0 0 100% 0 round 6px 16px 16px 6px)' }, { clipPath: 'inset(0 0 0% 0 round 6px 16px 16px 6px)', duration: 0.7, ease: 'power3.inOut' })
    .from($$(`#menu-${id} > *`), { y: 18, opacity: 0, duration: 0.6, stagger: 0.06, ease: 'power3.out' }, '-=0.45')
    .from($$(`#menu-${id} .plato`), { y: 16, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' }, '-=0.4');
}
naipes.forEach((n) => n.addEventListener('click', () => elegir(n.dataset.menu)));
// Flechas del teclado para recorrer las cartas
mazo.addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  e.preventDefault();
  const i = naipes.findIndex((n) => n.dataset.menu === menuActual);
  const sig = naipes[(i + (e.key === 'ArrowRight' ? 1 : -1) + naipes.length) % naipes.length];
  elegir(sig.dataset.menu);
  sig.focus();
});
// En celular se desliza el mazo para cambiar de carta
let toque = null;
mazo.addEventListener('pointerdown', (e) => { toque = e.clientX; });
mazo.addEventListener('pointerup', (e) => {
  if (toque === null) return;
  const dx = e.clientX - toque;
  toque = null;
  if (Math.abs(dx) < 50) return;
  const i = naipes.findIndex((n) => n.dataset.menu === menuActual);
  elegir(naipes[(i + (dx < 0 ? 1 : -1) + naipes.length) % naipes.length].dataset.menu);
});
// Índice de la entrada: abre la carta elegida
$$('[data-abrir]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  elegir(a.dataset.abrir, { desplazar: true });
}));
mostrarMenu(menuActual);
acomodar(naipes[0], false);

// Al pasar por un postre, la foto de la carta de enfrente cambia con un círculo que se abre
function cambiarFoto(src, x = 50, y = 50) {
  const frente = naipes.find((n) => n.dataset.menu === menuActual);
  const marco = $('.naipe__foto', frente);
  const actual = marco.lastElementChild;
  if (!src || actual.getAttribute('src') === src) return;
  const img = new Image();
  img.src = src;
  img.alt = '';
  marco.appendChild(img);
  if (!anima) { [...marco.children].slice(0, -1).forEach((c) => c.remove()); return; }
  gsap.fromTo(img, { clipPath: `circle(0% at ${x}% ${y}%)` }, {
    clipPath: `circle(150% at ${x}% ${y}%)`, duration: 0.7, ease: 'power3.out',
    onComplete: () => [...marco.children].slice(0, -1).forEach((c) => c.remove()),
  });
}
naipes.forEach((n) => { n.dataset.foto = $('.naipe__foto img', n).getAttribute('src'); });
$$('.plato').forEach((p) => {
  const ver = () => {
    $$('.plato.is-activo').forEach((o) => o.classList.remove('is-activo'));
    p.classList.add('is-activo');
    cambiarFoto(p.dataset.img, 50, 40);
  };
  p.addEventListener('pointerenter', () => { if (finePointer) ver(); });
  p.addEventListener('focusin', ver);
});
$('.hoja').addEventListener('pointerleave', () => {
  $$('.plato.is-activo').forEach((o) => o.classList.remove('is-activo'));
  const frente = naipes.find((n) => n.dataset.menu === menuActual);
  cambiarFoto(frente.dataset.foto, 50, 60);
});

// ---------- Pedido ----------

let cart = store.get('lc-pedido', {});
const cartEl = $('#cart');
const countEl = $('.cart-count');

function renderCart() {
  const ids = Object.keys(cart).filter((id) => products[id] && cart[id] > 0);
  const list = $('.cart__items', cartEl);
  list.replaceChildren();
  let items = 0;
  for (const id of ids) {
    const p = products[id], q = cart[id];
    items += q;
    const li = document.createElement('li');
    li.className = 'cart__item';
    li.innerHTML = `
      <img src="${p.img}" alt="">
      <div><h3></h3><small class="kicker"></small></div>
      <div class="qty">
        <button class="round" type="button" data-act="minus"><svg class="icon" aria-hidden="true"><use href="#i-${q > 1 ? 'minus' : 'trash'}"/></svg></button>
        <output aria-label="Cantidad">${q}</output>
        <button class="round" type="button" data-act="plus"><svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg></button>
      </div>`;
    $('h3', li).textContent = p.name;
    $('small', li).textContent = p.menu;
    $('[data-act="minus"]', li).setAttribute('aria-label', `Quitar uno de ${p.name}`);
    $('[data-act="plus"]', li).setAttribute('aria-label', `Agregar uno de ${p.name}`);
    li.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      cart[id] = Math.max(0, q + (act === 'plus' ? 1 : -1));
      if (!cart[id]) delete cart[id];
      saveCart();
    });
    list.appendChild(li);
  }
  cartEl.classList.toggle('has-items', items > 0);
  countEl.textContent = items;
  countEl.dataset.n = items;
  const lines = ids.map((id) => `• ${cart[id]} × ${products[id].name} (${products[id].menu})`);
  $('.js-checkout', cartEl).href = waLink(
    `Hola Las Chinas, quiero hacer este pedido:\n${lines.join('\n')}\n\nFecha de entrega: \nNombre: \n\n¿Me confirman tamaños y precio?`
  );
}
function saveCart() {
  store.set('lc-pedido', cart);
  renderCart();
}
function addToCart(id, qty = 1, fromEl) {
  cart[id] = (cart[id] || 0) + qty;
  saveCart();
  flyToCart(fromEl, products[id].img);
  countEl.classList.remove('is-bump');
  void countEl.offsetWidth;
  countEl.classList.add('is-bump');
  toast(`${products[id].name} va en tu pedido`);
}
// La foto del postre vuela hasta el pedido
function flyToCart(fromEl, src) {
  if (!fromEl || !anima) return;
  const a = fromEl.getBoundingClientRect();
  const b = $('.js-cart-open').getBoundingClientRect();
  const size = Math.max(56, Math.min(a.width, 120));
  const img = new Image();
  img.src = src;
  img.className = 'fly';
  Object.assign(img.style, { left: `${a.left + a.width / 2 - size / 2}px`, top: `${a.top + a.height / 2 - size / 2}px`, width: `${size}px`, height: `${size}px` });
  document.body.appendChild(img);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  gsap.timeline({ onComplete: () => img.remove() })
    .from(img, { scale: 0.4, opacity: 0, duration: 0.25 })
    .to(img, { x: dx, duration: 0.8, ease: 'power1.inOut' }, 0.15)
    .to(img, { y: dy, duration: 0.8, ease: 'back.in(1.3)' }, 0.15)
    .to(img, { scale: 0.15, borderRadius: '50%', duration: 0.8, ease: 'power2.in' }, 0.15)
    .to(img, { opacity: 0, duration: 0.15 }, 0.85);
}
$$('.plato[data-id]').forEach((li) => {
  $('.plato__mas', li).addEventListener('click', (e) => addToCart(li.dataset.id, 1, e.currentTarget));
  $('.plato__nombre', li).addEventListener('click', () => openDetail(li.dataset.id));
});
$('.js-cart-open').addEventListener('click', () => openPanel(cartEl));
$('.js-checkout').addEventListener('click', () => toast('Abriendo WhatsApp con tu pedido'));
renderCart();

// ---------- Detalle de un postre ----------

const detail = $('#detalle');
let detailId = null, detailQty = 1;
function openDetail(id) {
  const p = products[id];
  detailId = id;
  detailQty = 1;
  const img = $('.js-detail-img', detail);
  img.src = p.img;
  img.alt = p.name;
  $('.js-detail-menu', detail).textContent = p.menu;
  $('.js-detail-name', detail).textContent = p.name;
  $('.js-detail-desc', detail).textContent = p.desc;
  $('.js-qty', detail).textContent = detailQty;
  openPanel(detail);
}
$('.js-qty-minus', detail).addEventListener('click', () => { detailQty = Math.max(1, detailQty - 1); $('.js-qty', detail).textContent = detailQty; });
$('.js-qty-plus', detail).addEventListener('click', () => { detailQty++; $('.js-qty', detail).textContent = detailQty; });
$('.js-detail-add', detail).addEventListener('click', () => {
  addToCart(detailId, detailQty, $('.js-detail-img', detail));
  closePanel(detail);
});

// ---------- Búsqueda ----------

const search = $('#buscar');
const input = $('#buscar-input');
const results = $('.search__results', search);
const sinAcentos = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function renderSearch() {
  const q = sinAcentos(input.value.trim());
  const found = Object.values(products).filter((p) => !q || sinAcentos(`${p.name} ${p.desc} ${p.menu}`).includes(q));
  results.replaceChildren();
  if (!found.length) {
    const li = document.createElement('li');
    li.className = 'none';
    li.textContent = `No encontramos "${input.value}". Pídela personalizada en el recetario o por WhatsApp.`;
    return results.appendChild(li);
  }
  found.forEach((p) => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" data-id="${p.id}"><img src="${p.img}" alt=""><span><strong></strong><br><small></small></span></button>`;
    $('strong', li).textContent = p.name;
    $('small', li).textContent = p.menu;
    results.appendChild(li);
  });
}
$('.js-search-open').addEventListener('click', () => { input.value = ''; renderSearch(); openPanel(search); });
input.addEventListener('input', renderSearch);
results.addEventListener('click', (e) => {
  const id = e.target.closest('[data-id]')?.dataset.id;
  if (!id) return;
  closePanel(search);
  openDetail(id);
});

// ---------- Encabezado: vidrio al bajar y sección actual ----------

const header = $('.header');
const onScroll = () => header.classList.toggle('is-scrolled', scrollY > innerHeight * 0.6);
addEventListener('scroll', onScroll, { passive: true });
onScroll();
const navLinks = $$('.header__nav a');
const spy = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === `#${e.target.id}`));
}), { rootMargin: '-45% 0px -50% 0px' });
['carta', 'eventos', 'arma', 'nosotras', 'contacto'].map((id) => document.getElementById(id)).filter(Boolean).forEach((el) => spy.observe(el));

// =========================================================
// Mesas para eventos: elige la celebración y recorre la mesa
// =========================================================

const invitaciones = $$('.invitacion');
function elegirMesa(btn) {
  if (btn.getAttribute('aria-selected') === 'true') return;
  invitaciones.forEach((b) => { b.setAttribute('aria-selected', String(b === btn)); b.tabIndex = b === btn ? 0 : -1; });
  const mesa = $(`#mesa-${btn.dataset.mesa}`);
  $$('.mesa').forEach((m) => { m.hidden = m !== mesa; });
  if (!anima) return;
  gsap.timeline()
    .fromTo($('.mesa__foto', mesa), { clipPath: 'inset(0 100% 0 0 round 14px)' }, { clipPath: 'inset(0 0% 0 0 round 14px)', duration: 1, ease: 'power3.inOut' })
    .fromTo($('.mesa__foto img', mesa), { scale: 1.12 }, { scale: 1, duration: 1.4, ease: 'power3.out' }, 0)
    .from($$('.pin', mesa), { scale: 0, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'back.out(2)' }, 0.6)
    .from($$('.mesa__detalle > *, .piezas li', mesa), { y: 18, opacity: 0, duration: 0.6, stagger: 0.05, ease: 'power3.out' }, 0.2);
}
invitaciones.forEach((b) => b.addEventListener('click', () => elegirMesa(b)));
$('.montaje__selector').addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
  e.preventDefault();
  const i = invitaciones.findIndex((b) => b.getAttribute('aria-selected') === 'true');
  const sig = invitaciones[(i + (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : -1) + invitaciones.length) % invitaciones.length];
  elegirMesa(sig);
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

// =========================================================
// Recetario: arma tu gelatina y mándala por WhatsApp
// =========================================================

(() => {
  const form = $('.js-recetario');
  if (!form) return;
  const receta = $('.js-receta', form);
  const franja = $('.js-r-capas', form);
  const COLORES = { Leche: '#FFF4EC', Fresa: '#E0313F', Uva: '#5E1B63', Mango: '#F6A21E', 'Maracuyá': '#F2C230' };
  const fecha = $('[name="fecha"]', form);
  const hoy = new Date();
  fecha.min = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  function leer() {
    const d = new FormData(form);
    const capas = ['capa1', 'capa2', 'capa3'].map((k) => d.get(k)).filter(Boolean);
    const fruta = d.getAll('fruta');
    const f = d.get('fecha');
    return {
      forma: d.get('forma'),
      capas,
      fruta: fruta.length ? fruta.join(', ') : 'Sin fruta',
      personas: d.get('personas') ? `${d.get('personas')} personas` : 'Por definir',
      fecha: f ? new Date(`${f}T12:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Por definir',
      mensaje: (d.get('mensaje') || '').trim(),
    };
  }
  function pintar() {
    const r = leer();
    const filas = [['Forma', r.forma], ['Capas', r.capas.join(' · ')], ['Fruta', r.fruta], ['Para', r.personas], ['Fecha', r.fecha]];
    if (r.mensaje) filas.push(['Decoración', `«${r.mensaje}»`]);
    receta.replaceChildren(...filas.flatMap(([k, v]) => {
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = k;
      dd.textContent = v;
      return [dt, dd];
    }));
    franja.replaceChildren(...[...r.capas].reverse().map((c) => {
      const b = document.createElement('span');
      b.style.background = COLORES[c] || '#eee';
      b.title = c;
      return b;
    }));
  }
  form.addEventListener('input', pintar);
  form.addEventListener('change', pintar);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const r = leer();
    const texto = [
      'Hola Las Chinas, armé esta gelatina en su recetario:',
      `• Forma: ${r.forma}`,
      `• Capas (de abajo hacia arriba): ${r.capas.join(', ')}`,
      `• Fruta: ${r.fruta}`,
      `• Para: ${r.personas}`,
      `• Fecha: ${r.fecha}`,
      r.mensaje ? `• Decoración o mensaje: ${r.mensaje}` : '',
      '',
      '¿Me confirman disponibilidad y precio?',
    ].filter((l, i, a) => l || a[i - 1]).join('\n');
    window.open(waLink(texto), '_blank', 'noopener');
    toast('Abriendo WhatsApp con tu receta');
  });
  pintar();
})();

// =========================================================
// La entrada: cada sabor llega con su propio color
// =========================================================

const entrada = $('.entrada');
const escenario = $('.escenario');
const postresBox = $('.escenario__postres');
const postres = $$('.postre', entrada);
const botonesSabor = $$('.sabor-btn', entrada);
const SABORES = JSON.parse($('#sabores-entrada').textContent);
// El mundo de color de cada sabor: fondo, luz y acento
const MUNDOS = {
  'fresa-crema': { c1: '#6A0B22', c2: '#1E0409', brillo: '255, 70, 110', acento: '#FFB3C1' },
  'fresa-natural': { c1: '#8A2A52', c2: '#2A0816', brillo: '255, 150, 195', acento: '#FFC9DF' },
  'mango-maracuya': { c1: '#8A4206', c2: '#220F03', brillo: '255, 175, 60', acento: '#FFD08A' },
  'vasitos-capas': { c1: '#4A1A62', c2: '#13051C', brillo: '205, 130, 255', acento: '#E4C2FF' },
};
let saborActual = 'fresa-crema';
const silueta = (img) => entrada.style.setProperty('--silueta', `url("${img.currentSrc || img.src}")`);
silueta(postres[0]);
postres[0].addEventListener('load', () => silueta(postres[0]));

// Tocar el postre lo hace temblar (como una gelatina de verdad)
function temblar(fuerza = 1) {
  if (!anima) return;
  gsap.killTweensOf(postresBox);
  gsap.fromTo(postresBox, { scaleX: 1, scaleY: 1, skewX: 0 }, {
    keyframes: {
      scaleY: [1, 1 - 0.06 * fuerza, 1 + 0.035 * fuerza, 1 - 0.015 * fuerza, 1],
      scaleX: [1, 1 + 0.04 * fuerza, 1 - 0.02 * fuerza, 1 + 0.008 * fuerza, 1],
      skewX: [0, 2.2 * fuerza, -1.6 * fuerza, 0.6 * fuerza, 0],
      easeEach: 'sine.inOut',
    },
    duration: 1.1,
    ease: 'none',
  });
}
const destello = () => anima && gsap.fromTo('.escenario__brillo', { backgroundPosition: '130% 0' }, { backgroundPosition: '-60% 0', duration: 1.4, ease: 'power2.inOut' });

// Barra de tiempo del sabor actual: al llenarse pasa al siguiente
const ESPERA = 6;
let barra = null;
function correrBarra() {
  barra?.kill();
  $$('.sabor-btn__barra', entrada).forEach((b) => gsap?.set(b, { scaleX: 0 }));
  if (!anima) return;
  const b = $(`.sabor-btn[data-sabor="${saborActual}"] .sabor-btn__barra`, entrada);
  barra = gsap.to(b, {
    scaleX: 1, duration: ESPERA, ease: 'none',
    onComplete: () => {
      const i = botonesSabor.findIndex((x) => x.dataset.sabor === saborActual);
      cambiarSabor(botonesSabor[(i + 1) % botonesSabor.length].dataset.sabor);
    },
  });
}
function cambiarSabor(id) {
  if (id === saborActual) return;
  const antes = postres.find((p) => p.dataset.sabor === saborActual);
  const ahora = postres.find((p) => p.dataset.sabor === id);
  saborActual = id;
  botonesSabor.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sabor === id)));
  $('.js-sabor-nombre', entrada).textContent = SABORES[id].nombre;
  $('.js-sabor-desc', entrada).textContent = SABORES[id].desc;
  entrada.dataset.sabor = id;
  silueta(ahora);
  const m = MUNDOS[id];
  if (!anima) {
    antes.classList.remove('is-activa');
    ahora.classList.add('is-activa');
    Object.entries({ '--c1': m.c1, '--c2': m.c2, '--brillo': m.brillo, '--acento': m.acento }).forEach(([k, v]) => entrada.style.setProperty(k, v));
    return;
  }
  gsap.timeline()
    // El color de todo el escenario cambia, como cuando cambia la luz
    .to(entrada, { '--c1': m.c1, '--c2': m.c2, '--acento': m.acento, duration: 1.4, ease: 'power2.inOut' }, 0)
    .add(() => entrada.style.setProperty('--brillo', m.brillo), 0.5)
    // El postre de antes se va hacia abajo y se desenfoca
    .to(antes, { yPercent: 10, scale: 0.9, opacity: 0, filter: 'blur(10px)', duration: 0.6, ease: 'power2.in' }, 0)
    .add(() => { antes.classList.remove('is-activa'); gsap.set(antes, { clearProps: 'all' }); })
    // El nuevo llega desde arriba, enfocándose
    .fromTo(ahora, { yPercent: -12, scale: 1.08, opacity: 0, filter: 'blur(12px)' }, {
      yPercent: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out', clearProps: 'filter',
      onStart: () => ahora.classList.add('is-activa'),
    }, 0.45)
    .add(() => temblar(0.7), 1.1)
    .add(destello, 1.2)
    .fromTo('.entrada__actual', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.5);
  correrBarra();
}
botonesSabor.forEach((b) => b.addEventListener('click', () => cambiarSabor(b.dataset.sabor)));
escenario.addEventListener('click', () => temblar(1));
let ultimoTemblor = 0;
escenario.addEventListener('pointerenter', () => {
  if (!finePointer || Date.now() - ultimoTemblor < 1500) return;
  ultimoTemblor = Date.now();
  temblar(0.5);
});

// Divide un texto en letras (respetando cursivas y saltos) para animarlas
function partir(el) {
  if (el.dataset.partido) return $$('.letra', el);
  el.dataset.partido = '1';
  el.classList.add('partido');
  const recorrer = (nodo) => {
    [...nodo.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((parte) => {
          if (!parte) return;
          if (/^\s+$/.test(parte)) return frag.appendChild(document.createTextNode(' '));
          const palabra = document.createElement('span');
          palabra.className = 'palabra';
          [...parte].forEach((ch) => {
            const l = document.createElement('span');
            l.className = 'letra';
            l.textContent = ch;
            palabra.appendChild(l);
          });
          frag.appendChild(palabra);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.matches('em, .script')) {
        // Las cursivas con degradado se animan como una sola pieza
        const palabra = document.createElement('span');
        palabra.className = 'palabra';
        const l = document.createElement('span');
        l.className = 'letra';
        n.replaceWith(palabra);
        l.appendChild(n);
        palabra.appendChild(l);
      } else if (n.nodeType === 1 && !n.matches('svg')) recorrer(n);
    });
  };
  recorrer(el);
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  return $$('.letra', el);
}

// ---------- Fondo de la página: cambia de color al pasar de una sección a otra ----------
const fondoVivo = $('.fondo-vivo');
let seccionFondo = null;
const fondoA = (color) => gsap ? gsap.to(fondoVivo, { backgroundColor: color, duration: anima ? 1.1 : 0, ease: 'power2.inOut', overwrite: true }) : (fondoVivo.style.background = color);
// Al barajar la carta, el fondo toma el tono de la carta elegida
const TONOS_CARTA = { familiares: '#F9E9EC', individuales: '#FBF1E1', temporada: '#FAE4E9', variados: '#F2EAF5', eventos: '#F4E6EA' };
const cartaSec = $('#carta');
const tintarCarta = (id) => {
  cartaSec.dataset.fondo = TONOS_CARTA[id] || '#FBF6F1';
  if (seccionFondo === cartaSec) fondoA(cartaSec.dataset.fondo);
};
naipes.forEach((n) => n.addEventListener('click', () => tintarCarta(n.dataset.menu)));
tintarCarta(menuActual);

if (anima) {
  gsap.registerPlugin(ScrollTrigger);

  // ---- Entrada: el medallón del logo gira hacia la luz, el anillo lo abraza y llega el primer sabor ----
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: correrBarra });
  intro
    .from('.entrada__ambiente', { opacity: 0, duration: 1.6, ease: 'power2.out' }, 0)
    .from('.medalla__halo', { opacity: 0, scale: 0.4, duration: 1.6, ease: 'power2.out' }, 0.1)
    .fromTo('.medalla__logo', { opacity: 0, scale: 0.55, rotation: -28, filter: 'blur(16px) brightness(.6)' }, { opacity: 1, scale: 1, rotation: 0, filter: 'blur(0px) brightness(1)', duration: 1.5, ease: 'expo.out', clearProps: 'filter' }, 0.2)
    .from('.medalla__anillo', { opacity: 0, scale: 0.75, rotation: -120, duration: 1.8, ease: 'expo.out' }, 0.45)
    .fromTo('.medalla__brillo', { backgroundPosition: '130% 0' }, { backgroundPosition: '-60% 0', duration: 1.3, ease: 'power2.inOut' }, 1.05)
    .fromTo(postresBox, { opacity: 0, yPercent: -40, scale: 0.85, filter: 'blur(10px)' }, { opacity: 1, yPercent: 0, scale: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power3.in', clearProps: 'filter' }, 1.0)
    .from('.escenario__aura, .escenario__sombra', { opacity: 0, scale: 0.6, duration: 1 }, 1.6)
    .add(() => temblar(1.1), 1.9)
    .add(destello, 2.05)
    .from('.header', { opacity: 0, y: -14, duration: 0.8, clearProps: 'opacity,transform' }, 1.1)
    .from('.kicker__linea', { scaleX: 0, duration: 0.8 }, 1.2)
    .from('.entrada__texto .kicker', { opacity: 0, x: -12, duration: 0.8 }, 1.25)
    .from('.entrada h1 .linea > *', { yPercent: 115, rotate: 3, duration: 1.1, stagger: 0.12, ease: 'power4.out' }, 1.3)
    .from('.entrada__sub, .entrada__ctas', { opacity: 0, y: 18, duration: 0.8, stagger: 0.1 }, 1.65)
    .from('.entrada__sabores', { opacity: 0, y: 20, duration: 0.9 }, 1.8)
    .from('.sabor-btn', { opacity: 0, y: 14, duration: 0.6, stagger: 0.07 }, 1.9)
    .from('.entrada__baja', { opacity: 0, duration: 0.8 }, 2.3);

  // La barra se detiene si el mouse está sobre los sabores o la entrada no se ve
  const pausar = (v) => barra && (v ? barra.pause() : barra.resume());
  $('.entrada__sabores').addEventListener('pointerenter', () => pausar(true));
  $('.entrada__sabores').addEventListener('pointerleave', () => pausar(false));
  ScrollTrigger.create({ trigger: entrada, start: 'top top', end: 'bottom top', onToggle: (st) => { pausar(!st.isActive); entrada.classList.toggle('is-fuera', !st.isActive); } });

  // ---- Profundidad con el mouse: luz, logo y postre a distintas velocidades ----
  if (finePointer) {
    const luzX = gsap.quickTo('.entrada__luz', 'x', { duration: 1.4, ease: 'power3' });
    const luzY = gsap.quickTo('.entrada__luz', 'y', { duration: 1.4, ease: 'power3' });
    const pX = gsap.quickTo('.medalla', 'x', { duration: 1.6, ease: 'power3' });
    const pY = gsap.quickTo('.medalla', 'y', { duration: 1.6, ease: 'power3' });
    const pR = gsap.quickTo('.medalla__logo', 'rotation', { duration: 1.6, ease: 'power3' });
    const eX = gsap.quickTo(escenario, 'x', { duration: 1.2, ease: 'power3' });
    const eY = gsap.quickTo(escenario, 'y', { duration: 1.2, ease: 'power3' });
    const eR = gsap.quickTo(escenario, 'rotation', { duration: 1.2, ease: 'power3' });
    entrada.addEventListener('pointermove', (e) => {
      const r = entrada.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      luzX(e.clientX - r.left); luzY(e.clientY - r.top);
      pX(nx * 14); pY(ny * 10); pR(nx * 4);
      eX(nx * 22); eY(ny * 14); eR(nx * 2.5);
    });
    gsap.set('.entrada__luz', { x: innerWidth * 0.68, y: innerHeight * 0.45 });
  }

  // ---- Al bajar: el texto se despide, el logo se aleja y el postre sube más lento ----
  const salida = { trigger: entrada, start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.entrada__texto, .entrada__sabores, .entrada__baja', { opacity: 0, y: -50, ease: 'none', scrollTrigger: { ...salida, end: '45% top' } });
  gsap.to(escenario, { yPercent: 36, ease: 'none', scrollTrigger: salida });
  gsap.to('.medalla', { yPercent: 14, rotation: 12, ease: 'none', scrollTrigger: salida });

  // ---- Cinta: avanza sola y se acelera (e inclina) con la velocidad del scroll ----
  const filas = $$('.cinta__fila');
  const cintas = filas.map((f, i) => gsap.to(f, { xPercent: i ? 0 : -50, duration: 38, ease: 'none', repeat: -1, ...(i ? { startAt: { xPercent: -50 }, xPercent: 0 } : {}) }));
  let inclinar = gsap.quickTo(filas, 'skewX', { duration: 0.6, ease: 'power3' });
  ScrollTrigger.create({
    trigger: '.cinta', start: 'top bottom', end: 'bottom top',
    onUpdate: (st) => {
      const v = st.getVelocity();
      cintas.forEach((t) => gsap.to(t, { timeScale: 1 + Math.min(Math.abs(v) / 250, 6), duration: 0.2, overwrite: true, onComplete: () => gsap.to(t, { timeScale: 1, duration: 1.2 }) }));
      inclinar(gsap.utils.clamp(-8, 8, v / -200));
      clearTimeout(inclinar.t); inclinar.t = setTimeout(() => inclinar(0), 120);
    },
  });

  // ---- Fondo vivo por sección ----
  $$('[data-fondo]').forEach((sec) => ScrollTrigger.create({
    trigger: sec, start: 'top 55%', end: 'bottom 55%',
    onToggle: (st) => { if (st.isActive) { seccionFondo = sec; fondoA(sec.dataset.fondo); } },
  }));

  // ---- La carta: el mazo se reparte al llegar ----
  gsap.from(naipes, {
    yPercent: 40, rotation: 0, opacity: 0, duration: 1.1, stagger: 0.09, ease: 'power3.out',
    scrollTrigger: { trigger: mazo, start: 'top 80%' },
    onComplete: () => acomodar(naipes.find((n) => n.dataset.menu === menuActual), false),
  });

  // ---- Títulos: las letras suben desde una línea invisible, desenfocadas ----
  $$('.titular h2, .nosotras h2, .cocina__frase, .mesa__detalle h3').forEach((h) => {
    const letras = partir(h);
    gsap.from(letras, {
      yPercent: 70, opacity: 0, filter: 'blur(8px)', rotate: 4, duration: 0.9, stagger: 0.022, ease: 'power3.out', clearProps: 'filter',
      scrollTrigger: { trigger: h, start: 'top 85%' },
    });
  });

  // ---- Entradas de secciones: suaves y cortas ----
  const sube = (targets, trigger, extra = {}) => gsap.from(targets, {
    y: 40, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.08,
    scrollTrigger: { trigger, start: 'top 85%' }, ...extra,
  });
  $$('.titular').forEach((t) => sube($$('.kicker, p', t), t));
  sube('.hoja__pagina', '.hoja');
  sube('.montaje__selector .invitacion', '.montaje__selector');
  sube('.formas__lista li', '.formas', { stagger: 0.07 });
  sube('.recetario__hoja', '.recetario', { stagger: 0.15 });
  sube('.nosotras__texto > *:not(h2)', '.nosotras__texto', { stagger: 0.06 });
  sube('.pasos__lista li', '.pasos__lista', { stagger: 0.12 });

  // ---- Cortina rosa que descubre las fotos grandes ----
  $$('.revela, .mesa:not([hidden]) .mesa__foto').forEach((box) => {
    const c = document.createElement('span');
    c.className = 'cortina';
    box.appendChild(c);
    const img = $('img', box);
    gsap.timeline({ scrollTrigger: { trigger: box, start: 'top 80%' } })
      .set(img, { opacity: 0 })
      .to(c, { scaleX: 1, duration: 0.7, ease: 'power3.inOut' })
      .set(img, { opacity: 1 })
      .set(c, { transformOrigin: 'right' })
      .to(c, { scaleX: 0, duration: 0.8, ease: 'power3.inOut' })
      .from(img, { scale: 1.25, duration: 1.6, ease: 'power3.out' }, '-=0.8');
  });

  // Los moldes se dibujan a línea al aparecer
  $$('.formas__lista path, .formas__lista ellipse, .formas__lista circle').forEach((p) => {
    const largo = p.getTotalLength?.() || 300;
    gsap.fromTo(p, { strokeDasharray: largo, strokeDashoffset: largo }, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', scrollTrigger: { trigger: '.formas', start: 'top 80%' } });
  });

  // Fotos grandes que se mueven más lento que el scroll
  gsap.fromTo('.cocina__foto', { yPercent: -8, scale: 1.08 }, { yPercent: 8, scale: 1, ease: 'none', scrollTrigger: { trigger: '.cocina', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.nosotras__foto img', { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: '.nosotras__foto', start: 'top bottom', end: 'bottom top', scrub: true } });

  // ---- Botones magnéticos y cursor propio (solo con mouse) ----
  if (finePointer) {
    $$('.btn, .tool, .plato__mas, .round').forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.3);
        y((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', () => { x(0); y(0); });
    });

    const cursor = $('.cursor');
    const texto = $('.cursor__texto', cursor);
    const cpX = gsap.quickTo('.cursor__punto', 'x', { duration: 0.08 });
    const cpY = gsap.quickTo('.cursor__punto', 'y', { duration: 0.08 });
    const caX = gsap.quickTo('.cursor__aro', 'x', { duration: 0.45, ease: 'power3' });
    const caY = gsap.quickTo('.cursor__aro', 'y', { duration: 0.45, ease: 'power3' });
    let ultimo = null;
    const revisar = (x, y, objetivo) => {
      const t = objetivo?.closest?.('[data-cursor], .naipe, .plato__nombre, .pin');
      const etiqueta = t?.dataset.cursor || (t?.classList.contains('naipe') ? 'Abrir' : t?.classList.contains('plato__nombre') ? 'Ver' : '');
      cursor.classList.toggle('is-grande', !!etiqueta);
      if (etiqueta) texto.textContent = etiqueta;
      cursor.classList.toggle('is-enlace', !etiqueta && !!objetivo?.closest?.('a, button, label, select, input, textarea'));
    };
    addEventListener('pointermove', (e) => {
      cpX(e.clientX); cpY(e.clientY); caX(e.clientX); caY(e.clientY);
      ultimo = [e.clientX, e.clientY];
      revisar(e.clientX, e.clientY, e.target);
    });
    // Al hacer scroll lo que está bajo el cursor cambia aunque el mouse no se mueva
    addEventListener('scroll', () => { if (ultimo) revisar(...ultimo, document.elementFromPoint(...ultimo)); }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.add('is-oculto'));
    document.addEventListener('pointerenter', () => cursor.classList.remove('is-oculto'));
  }

  addEventListener('load', () => ScrollTrigger.refresh());
} else {
  fondoA('#FBF6F1');
}
