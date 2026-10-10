// La cocina de Las Chinas: la entrada de la página.
// La cámara se acerca al objeto que tocas; la vitrina y el celular tienen su
// propia foto de cerca, los demás objetos muestran una tarjeta que lleva a su
// sección completa. Los sabores y precios se leen de las tarjetas de la tienda
// (#sabores), así hay una sola fuente de datos.
(() => {
  const escena = document.querySelector('.cocina');
  if (!escena) return;

  // El número sale de CONFIG en script.js (PENDIENTE: el número real de Las Chinas)
  const WHATSAPP = typeof CONFIG !== 'undefined' ? CONFIG.whatsapp : '5210000000000';
  const OBJETOS = {
    vitrina: { k: 1.7, close: '#close-vitrina' },
    celular: { k: 3.2, close: '#close-celular' },
    pared: { k: 2.4, nota: '#nota-pared' },
    pizarron: { k: 1.8, nota: '#nota-pizarron' },
    libro: { k: 2.1, nota: '#nota-libro' },
    ventana: { k: 1.7, nota: '#nota-ventana' },
  };

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const gsap = window.gsap;
  const cam = $('.cocina__cam', escena);
  const sceneFrame = $('.js-k-frame', escena);
  const volver = $('.k-volver', escena);
  const sabor = $('#k-sabor');
  const wa = (t) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t)}`;
  const dur = (s) => (reduce ? 0 : s);
  const veil = $('.k-veil', escena);

  // Sin GSAP la cocina se queda quieta pero todo sigue a la vista
  if (!gsap) { veil.classList.add('is-done'); return; }

  // Sabores desde la tienda
  const SABORES = Object.fromEntries($$('.flavor[data-id]').map((c) => [c.dataset.id, {
    id: c.dataset.id, nombre: c.dataset.name, desc: c.dataset.desc, precio: Number(c.dataset.price), img: c.dataset.img,
  }]));

  // ---------- Encuadre que se puede recorrer (cover + arrastre + mouse) ----------
  function panel(frame, foco = 0.5) {
    const s = { x: 0, y: 0, mx: 0, my: 0 };
    const limites = () => ({
      x: Math.max(0, (frame.offsetWidth - escena.clientWidth) / 2),
      y: Math.max(0, (frame.offsetHeight - escena.clientHeight) / 2),
    });
    const clamp = (v, m) => Math.max(-m, Math.min(m, v));
    const aplicar = (d = 0.9) => {
      const l = limites();
      gsap.to(frame, { x: clamp(s.x + s.mx, l.x), y: clamp(s.y + s.my, l.y), duration: dur(d), ease: 'power3.out', overwrite: 'auto' });
    };
    const enfocar = (fx, d) => { s.x = (0.5 - fx) * frame.offsetWidth; aplicar(d); };
    gsap.set(frame, { xPercent: -50, yPercent: -50 });
    enfocar(foco, 0);
    // Arrastrar de lado para mirar alrededor (en celular la foto es más ancha que la pantalla)
    let start = null;
    frame.addEventListener('pointerdown', (e) => { start = { x: e.clientX, sx: s.x, moved: false }; });
    addEventListener('pointermove', (e) => {
      if (start) {
        const dx = e.clientX - start.x;
        if (Math.abs(dx) > 6) start.moved = true;
        s.x = start.sx + dx;
        aplicar(0.35);
      } else if (fine && !reduce && visible) {
        // Con el mouse la escena se mueve muy poco: sensación de profundidad
        const r = escena.getBoundingClientRect();
        s.mx = -((e.clientX - r.left) / r.width - 0.5) * 26;
        s.my = -((e.clientY - r.top) / r.height - 0.5) * 16;
        aplicar(1.2);
      }
    });
    const soltar = () => {
      if (start?.moved) frame.dataset.dragged = '1';
      setTimeout(() => delete frame.dataset.dragged, 0);
      s.x = clamp(s.x, limites().x);
      start = null;
    };
    addEventListener('pointerup', soltar);
    addEventListener('pointercancel', soltar);
    addEventListener('resize', () => aplicar(0));
    return { enfocar };
  }
  let visible = true;
  // Si la pantalla es más angosta que la foto, se empieza mirando la pared con el
  // letrero y las fotos de las hermanas; lo demás se descubre deslizando
  const vista = Math.min(1, escena.clientWidth / escena.clientHeight / (16 / 9));
  panel(sceneFrame, Math.min(0.5, 0.055 + vista / 2));
  const panVitrina = panel($('#close-vitrina .k-close__frame'), 0.5);
  panel($('#close-celular .k-close__frame'), 0.62);

  // ---------- Polvo en el rayo de luz ----------
  $$('.k-polvo i', escena).forEach((p) => {
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 70}%`;
    p.style.setProperty('--d', `${7 + Math.random() * 6}s`);
    p.style.setProperty('--w', `${-Math.random() * 8}s`);
  });

  // ---------- El pizarrón: el menú completo ----------
  const menu = $('.js-k-menu');
  Object.values(SABORES).forEach((s) => {
    const li = document.createElement('li');
    li.innerHTML = '<button type="button"><span></span><b></b></button>';
    $('span', li).textContent = s.nombre;
    $('b', li).textContent = `$${s.precio}`;
    $('button', li).addEventListener('click', () => irATienda(s.id));
    menu.appendChild(li);
  });

  // La tienda selecciona el sabor en su vitrina (script.js escucha este evento)
  function irATienda(id) {
    document.dispatchEvent(new CustomEvent('lc:ver-sabor', { detail: { id } }));
  }

  // ---------- Ir a un objeto y volver ----------
  let actual = null;
  let ocupado = false;
  // El foco se mueve a la tarjeta solo si se llegó con el teclado
  let teclado = false;
  addEventListener('keydown', () => { teclado = true; }, true);
  addEventListener('pointerdown', () => { teclado = false; }, true);
  const enfocar = (el) => { if (teclado) el?.focus({ preventScroll: true }); };
  function centro(el) {
    const r = el.getBoundingClientRect();
    const px = parseFloat(el.style.getPropertyValue('--px') || 50) / 100;
    const py = parseFloat(el.style.getPropertyValue('--py') || 50) / 100;
    return { x: r.left + r.width * px, y: r.top + r.height * py };
  }
  function mostrar(el) {
    el.hidden = false;
    gsap.fromTo(el, { opacity: 0, y: 24, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: dur(0.6), ease: 'power3.out', clearProps: 'filter' });
  }
  // Si la cocina no está completa en pantalla, primero se sube hasta ella
  function encuadrar() {
    const top = escena.getBoundingClientRect().top;
    if (Math.abs(top) < 4) return 0;
    scrollTo({ top: scrollY + top, behavior: reduce ? 'auto' : 'smooth' });
    return reduce ? 50 : 650;
  }
  function ir(nombre) {
    const cfg = OBJETOS[nombre];
    if (!cfg || actual || ocupado) return;
    ocupado = true;
    setTimeout(() => zoom(nombre, cfg), encuadrar());
  }
  function zoom(nombre, cfg) {
    gsap.killTweensOf(cam); // por si la entrada todavía se está moviendo
    actual = nombre;
    escena.classList.add('is-zoomed');
    const er = escena.getBoundingClientRect();
    const W = er.width, H = er.height;
    const c = centro($(`.k-obj[data-obj="${nombre}"]`, escena));
    const p = { x: c.x - er.left, y: c.y - er.top };
    const k = W < 760 ? cfg.k * 0.85 : cfg.k;
    // Sin salirse de la foto: la cámara nunca muestra el borde de la escena
    const fr = sceneFrame.getBoundingClientRect();
    const f = { left: fr.left - er.left, right: fr.right - er.left, top: fr.top - er.top, bottom: fr.bottom - er.top };
    const lim = (eje, a, b, vp) => {
      const lo = vp - (p[eje] + (b - p[eje]) * k);
      const hi = -(p[eje] + (a - p[eje]) * k);
      return (t) => Math.min(hi, Math.max(lo, t));
    };
    const tx = lim('x', f.left, f.right, W)(W / 2 - p.x);
    const ty = lim('y', f.top, f.bottom, H)(H / 2 - p.y);
    const tl = gsap.timeline({ onComplete: () => { ocupado = false; } });
    tl.to(cam, { x: tx, y: ty, scale: k, transformOrigin: `${p.x}px ${p.y}px`, duration: dur(1.3), ease: 'power3.inOut' });
    let foco = null;
    if (cfg.close) {
      const close = $(cfg.close);
      tl.add(() => { close.hidden = false; escena.classList.add('is-close'); }, dur(0.85))
        .fromTo(close, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: dur(0.8), ease: 'power2.out' }, dur(0.85))
        .add(() => {
          if (nombre === 'celular') {
            gsap.to('.k-pantalla', { opacity: 1, duration: dur(0.6) });
            mostrar($('.k-chat'));
            foco = $('.k-chip');
          } else {
            foco = $('.k-gel', close);
          }
          enfocar(foco);
        });
    } else {
      tl.add(() => { const n = $(cfg.nota); mostrar(n); enfocar($('a, button', n)); }, dur(1.0));
    }
    tl.add(() => { volver.hidden = false; gsap.fromTo(volver, { opacity: 0 }, { opacity: 1, duration: dur(0.4) }); }, dur(1.1));
  }
  function regresar(instant = false) {
    if (!actual) return;
    const cfg = OBJETOS[actual];
    const desde = actual;
    ocupado = true;
    const d = (s) => (instant ? 0 : dur(s));
    const tl = gsap.timeline({ onComplete: () => {
      actual = null;
      ocupado = false;
      escena.classList.remove('is-zoomed', 'is-close');
      if (!instant) enfocar($(`.k-obj[data-obj="${desde}"]`, escena));
    } });
    sabor.hidden = true;
    volver.hidden = true;
    $$('.k-nota', escena).forEach((n) => { n.hidden = true; });
    if (cfg.close) {
      const close = $(cfg.close);
      tl.to(close, { opacity: 0, scale: 1.06, duration: d(0.5), ease: 'power2.in' })
        .add(() => { close.hidden = true; $('.k-chat').hidden = true; gsap.set('.k-pantalla', { opacity: 0 }); });
    }
    tl.to(cam, { x: 0, y: 0, scale: 1, duration: d(1.1), ease: 'power3.inOut' });
  }
  $$('.k-obj[data-obj]', escena).forEach((b) => b.addEventListener('click', () => {
    if (sceneFrame.dataset.dragged) return;
    if (b.dataset.obj === 'lampara') return lampara();
    ir(b.dataset.obj);
  }));
  volver.addEventListener('click', () => regresar());
  // Desde cualquier parte de la página: <a data-ir="vitrina">…
  $$('[data-ir]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    const destino = b.dataset.ir;
    if (actual === destino) return encuadrar();
    if (actual) { regresar(); setTimeout(() => ir(destino), reduce ? 0 : 1700); } else ir(destino);
  }));
  // Los enlaces de las tarjetas bajan a su sección: la cocina vuelve a su lugar al salir
  $$('.k-nota a[href^="#"], .k-sabor__ver', escena).forEach((a) => a.addEventListener('click', () => setTimeout(() => regresar(true), 900)));

  // ---------- La lámpara se prende y se apaga ----------
  function lampara() {
    const b = $('.k-obj--lampara', escena);
    const on = sceneFrame.classList.toggle('is-dark');
    b.setAttribute('aria-pressed', String(!on));
  }

  // ---------- Sabores en la vitrina ----------
  let saborActual = null;
  $$('.k-gel', escena).forEach((g) => g.addEventListener('click', () => {
    if (g.closest('.cocina__frame').dataset.dragged) return;
    const s = SABORES[g.dataset.sabor];
    if (!s) return;
    saborActual = s.id;
    $('.k-sabor__nombre', sabor).textContent = s.nombre;
    $('.k-sabor__desc', sabor).textContent = s.desc;
    $('.k-sabor__precio', sabor).textContent = `$${s.precio}`;
    $('.k-sabor__pedir', sabor).href = wa(`Hola Las Chinas, quiero pedir una gelatina de ${s.nombre.toLowerCase()}.`);
    $('.k-close__hint').hidden = true;
    // En pantallas angostas la vitrina se recorre hasta la gelatina elegida
    const r = g.closest('.cocina__frame').getBoundingClientRect();
    const gr = g.getBoundingClientRect();
    panVitrina.enfocar((gr.left + gr.width / 2 - r.left) / r.width, 0.8);
    mostrar(sabor);
  }));
  $('.k-sabor__cerrar', sabor).addEventListener('click', () => { sabor.hidden = true; });
  // Al carrito de la tienda (script.js escucha este evento)
  $('.k-sabor__agregar', sabor).addEventListener('click', () => {
    const g = $(`.k-gel[data-sabor="${saborActual}"]`, escena);
    document.dispatchEvent(new CustomEvent('lc:agregar', { detail: { id: saborActual, rect: g?.getBoundingClientRect() } }));
  });
  $('.k-sabor__ver', sabor).addEventListener('click', (e) => { e.preventDefault(); irATienda(saborActual); });

  // ---------- Teclado (solo mientras la cocina está en pantalla) ----------
  addEventListener('keydown', (e) => {
    if (!visible || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (document.body.classList.contains('is-locked')) return; // un panel de la tienda está abierto
    const k = e.key.toLowerCase();
    if (k === 'escape') return sabor.hidden ? regresar() : (sabor.hidden = true);
    if (actual) return;
    if (k === 'v') ir('vitrina');
    if (k === 'w') ir('celular');
    if (k === 'n') ir('pared');
    if (k === 'l') lampara();
  });

  // Fuera de pantalla: animaciones en pausa y la cámara regresa sola
  new IntersectionObserver(([e]) => {
    visible = e.intersectionRatio > 0.35;
    escena.classList.toggle('is-offscreen', !e.isIntersecting);
    if (!visible && actual && !ocupado) regresar(true);
  }, { threshold: [0, 0.35] }).observe(escena);

  // ---------- Entrada: la cocina aparece desde la penumbra y el neón se enciende ----------
  if (!fine) $('.k-pista', escena).textContent = 'Desliza para mirar la cocina · toca un objeto';
  if (reduce) { veil.classList.add('is-done'); return; }
  gsap.timeline({ defaults: { ease: 'power2.out' } })
    .fromTo(cam, { scale: 1.12 }, { scale: 1, duration: 2.8, clearProps: 'transform' }, 0)
    .to(veil, { opacity: 0, duration: 1.8, ease: 'power1.inOut', onComplete: () => veil.classList.add('is-done') }, 0)
    .from('.header', { opacity: 0, y: -16, duration: 0.9, clearProps: 'opacity,transform' }, 1.0)
    // El neón parpadea dos veces y se queda prendido
    .fromTo('.k-neon', { opacity: 0 }, { opacity: 1, duration: 0.05 }, 1.1)
    .to('.k-neon', { opacity: 0.15, duration: 0.05 }, 1.2)
    .to('.k-neon', { opacity: 1, duration: 0.05 }, 1.3)
    .to('.k-neon', { opacity: 0.4, duration: 0.04 }, 1.42)
    .to('.k-neon', { opacity: 1, duration: 0.3 }, 1.48)
    .from('.k-obj .k-punto', { scale: 0, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'back.out(2)' }, 1.6)
    .from('.cocina__pie', { opacity: 0, duration: 0.8, clearProps: 'opacity' }, 2.2);
})();
