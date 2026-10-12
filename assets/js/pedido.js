// Pedido por WhatsApp, detalle de un producto y búsqueda.
// El catálogo (las tarjetas con data-id) es la única fuente de datos.
import { gsap, anima } from './config.js';
import { $, $$, waLink, store, toast } from './util.js';
import { openPanel, closePanel } from './navegacion.js';

const ETIQUETAS = { familiares: 'Familiar', individuales: 'Individual', temporada: 'De temporada', variados: 'Variado', eventos: 'Evento' };
export const products = Object.fromEntries($$('.producto[data-id]').map((li) => [li.dataset.id, {
  id: li.dataset.id,
  name: li.dataset.name,
  img: li.dataset.img,
  desc: li.dataset.desc,
  menu: ETIQUETAS[li.dataset.cat] || '',
}]));

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

// La foto del producto vuela hasta el pedido
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
    .from(img, { scale: 0.4, opacity: 0, duration: 0.2 })
    .to(img, { x: dx, duration: 0.7, ease: 'power2.inOut' }, 0.1)
    .to(img, { y: dy, duration: 0.7, ease: 'power2.in' }, 0.1)
    .to(img, { scale: 0.15, borderRadius: '50%', duration: 0.7, ease: 'power2.in' }, 0.1)
    .to(img, { opacity: 0, duration: 0.15 }, 0.7);
}

export function addToCart(id, qty = 1, fromEl) {
  cart[id] = (cart[id] || 0) + qty;
  saveCart();
  flyToCart(fromEl, products[id].img);
  countEl.classList.remove('is-bump');
  void countEl.offsetWidth;
  countEl.classList.add('is-bump');
  toast(`${products[id].name} va en tu pedido`);
}

const detail = $('#detalle');
let detailId = null, detailQty = 1;
export function openDetail(id) {
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

export function pedido() {
  $$('.producto[data-id]').forEach((li) => {
    $('.js-agregar', li).addEventListener('click', (e) => addToCart(li.dataset.id, 1, $('img', li) || e.currentTarget));
    $('.js-ver', li).addEventListener('click', () => openDetail(li.dataset.id));
    $('.producto__foto', li).addEventListener('click', () => openDetail(li.dataset.id));
  });
  $('.js-cart-open').addEventListener('click', () => openPanel(cartEl));
  $('.js-checkout').addEventListener('click', () => toast('Abriendo WhatsApp con tu pedido'));
  renderCart();

  $('.js-qty-minus', detail).addEventListener('click', () => { detailQty = Math.max(1, detailQty - 1); $('.js-qty', detail).textContent = detailQty; });
  $('.js-qty-plus', detail).addEventListener('click', () => { detailQty++; $('.js-qty', detail).textContent = detailQty; });
  $('.js-detail-add', detail).addEventListener('click', () => {
    addToCart(detailId, detailQty, $('.js-detail-img', detail));
    closePanel(detail);
  });

  // Búsqueda
  const search = $('#buscar');
  const input = $('#buscar-input');
  const results = $('.search__results', search);
  const sinAcentos = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const render = () => {
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
  };
  $('.js-search-open').addEventListener('click', () => { input.value = ''; render(); openPanel(search); });
  input.addEventListener('input', render);
  results.addEventListener('click', (e) => {
    const id = e.target.closest('[data-id]')?.dataset.id;
    if (!id) return;
    closePanel(search);
    openDetail(id);
  });
}
