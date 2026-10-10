// La cocina de Las Chinas: una escena que se explora.
// La cámara se acerca al objeto que tocas; la vitrina y el celular tienen su
// propia foto de cerca, los demás objetos muestran una tarjeta.
(() => {
  const WHATSAPP = '5210000000000'; // PENDIENTE: el número real de Las Chinas
  const SABORES = {
    'fresa-crema': { nombre: 'Fresa con crema', desc: 'Gelatina de fresa brillante con fresas naturales sobre una capa de leche cremosa.', precio: 45 },
    uva: { nombre: 'Uva', desc: 'Gelatina de uva intensa y refrescante, con uvas por dentro y capa de leche.', precio: 45 },
    mango: { nombre: 'Mango', desc: 'Gelatina de mango con cubos de fruta natural. Dulce y tropical.', precio: 45 },
    'fresa-natural': { nombre: 'Fresa natural', desc: 'Gelatina de leche rosada con trozos reales de fresa y una fresa entera encima.', precio: 45 },
  };
  // Cuánto se acerca la cámara a cada objeto y qué muestra al llegar
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
  const root = document.documentElement;
  const escena = $('.escena');
  const cam = $('.cam');
  const sceneFrame = $('.cam .frame');
  const volver = $('.volver');
  const sabor = $('#sabor');
  const wa = (t) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t)}`;
  const dur = (s) => (reduce ? 0 : s);

  $$('[data-wa]').forEach((a) => { a.href = wa(a.dataset.wa); a.target = '_blank'; a.rel = 'noopener'; });

  // ---------- Encuadre que se puede recorrer (cover + arrastre + mouse) ----------
  function panel(frame, foco = 0.5) {
    const s = { x: 0, y: 0, mx: 0, my: 0 };
    const limites = () => ({
      x: Math.max(0, (frame.offsetWidth - innerWidth) / 2),
      y: Math.max(0, (frame.offsetHeight - innerHeight) / 2),
    });
    const clamp = (v, m) => Math.max(-m, Math.min(m, v));
    const aplicar = (d = 0.9) => {
      const l = limites();
      gsap.to(frame, { x: clamp(s.x + s.mx, l.x), y: clamp(s.y + s.my, l.y), duration: dur(d), ease: 'power3.out', overwrite: 'auto' });
    };
    const enfocar = (fx, d) => { s.x = (0.5 - fx) * frame.offsetWidth; aplicar(d); };
    gsap.set(frame, { xPercent: -50, yPercent: -50 });
    enfocar(foco, 0);
    // Arrastrar para mirar alrededor (en celular la foto es más ancha que la pantalla)
    let start = null;
    frame.addEventListener('pointerdown', (e) => { start = { x: e.clientX, sx: s.x, moved: false }; });
    addEventListener('pointermove', (e) => {
      if (start) {
        const dx = e.clientX - start.x;
        if (Math.abs(dx) > 6) start.moved = true;
        s.x = start.sx + dx;
        aplicar(0.35);
      } else if (fine && !reduce) {
        // Con el mouse la escena se mueve muy poco: sensación de profundidad
        s.mx = -(e.clientX / innerWidth - 0.5) * 26;
        s.my = -(e.clientY / innerHeight - 0.5) * 16;
        aplicar(1.2);
      }
    });
    addEventListener('pointerup', () => {
      if (start?.moved) frame.dataset.dragged = '1';
      setTimeout(() => delete frame.dataset.dragged, 0);
      const l = limites();
      s.x = clamp(s.x, l.x);
      start = null;
    });
    addEventListener('resize', () => aplicar(0));
    return { enfocar };
  }
  const panEscena = panel(sceneFrame, innerWidth / innerHeight < 1 ? 0.55 : 0.5);
  const panVitrina = panel($('#close-vitrina .frame'), 0.5);
  panel($('#close-celular .frame'), 0.62);

  // ---------- Polvo en el rayo de luz ----------
  $$('.polvo i').forEach((p) => {
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 70}%`;
    p.style.setProperty('--d', `${7 + Math.random() * 6}s`);
    p.style.setProperty('--w', `${-Math.random() * 8}s`);
  });

  // ---------- Ir a un objeto y volver ----------
  let actual = null;
  function centro(el) {
    const r = el.getBoundingClientRect();
    const px = parseFloat(el.style.getPropertyValue('--px') || 50) / 100;
    const py = parseFloat(el.style.getPropertyValue('--py') || 50) / 100;
    return { x: r.left + r.width * px, y: r.top + r.height * py };
  }
  function mostrar(el) {
    el.hidden = false;
    gsap.fromTo(el, { opacity: 0, y: 24, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: dur(0.6), ease: 'power3.out' });
  }
  function ir(nombre) {
    const cfg = OBJETOS[nombre];
    if (!cfg || actual) return;
    actual = nombre;
    root.classList.add('is-zoomed');
    const el = $(`.obj[data-obj="${nombre}"]`);
    const p = centro(el);
    const k = innerWidth < 760 ? cfg.k * 0.85 : cfg.k;
    // Sin salirse de la foto: la cámara nunca muestra el borde de la escena
    const fr = sceneFrame.getBoundingClientRect();
    const lim = (c, a, b, vp) => {
      const lo = vp - (p[c] + (b - p[c]) * k);
      const hi = -(p[c] + (a - p[c]) * k);
      return (t) => Math.min(hi, Math.max(lo, t));
    };
    const tx = lim('x', fr.left, fr.right, innerWidth)(innerWidth / 2 - p.x);
    const ty = lim('y', fr.top, fr.bottom, innerHeight)(innerHeight / 2 - p.y);
    const tl = gsap.timeline();
    tl.to(cam, { x: tx, y: ty, scale: k, transformOrigin: `${p.x}px ${p.y}px`, duration: dur(1.3), ease: 'power3.inOut' });
    if (cfg.close) {
      const close = $(cfg.close);
      tl.add(() => {
        close.hidden = false;
        root.classList.add('is-close');
      }, dur(0.85))
        .fromTo(close, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: dur(0.8), ease: 'power2.out' }, dur(0.85))
        .add(() => {
          if (nombre === 'celular') {
            gsap.to('.pantalla', { opacity: 1, duration: dur(0.6) });
            mostrar($('.chat'));
          }
        });
    } else {
      tl.add(() => mostrar($(cfg.nota)), dur(1.0));
    }
    tl.add(() => { volver.hidden = false; gsap.fromTo(volver, { opacity: 0 }, { opacity: 1, duration: dur(0.4) }); }, dur(1.1));
  }
  function regresar() {
    if (!actual) return;
    const cfg = OBJETOS[actual];
    const tl = gsap.timeline({ onComplete: () => { actual = null; root.classList.remove('is-zoomed', 'is-close'); } });
    sabor.hidden = true;
    volver.hidden = true;
    $$('.nota').forEach((n) => { n.hidden = true; });
    if (cfg.close) {
      const close = $(cfg.close);
      tl.to(close, { opacity: 0, scale: 1.06, duration: dur(0.5), ease: 'power2.in' })
        .add(() => { close.hidden = true; $('.chat').hidden = true; gsap.set('.pantalla', { opacity: 0 }); });
    }
    tl.to(cam, { x: 0, y: 0, scale: 1, duration: dur(1.1), ease: 'power3.inOut' });
  }
  $$('.obj[data-obj]').forEach((b) => b.addEventListener('click', () => {
    if (sceneFrame.dataset.dragged) return;
    if (b.dataset.obj === 'lampara') return lampara();
    ir(b.dataset.obj);
  }));
  volver.addEventListener('click', regresar);
  $$('[data-ir]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    const destino = b.dataset.ir;
    if (actual === destino) return;
    if (actual) { regresar(); setTimeout(() => ir(destino), reduce ? 0 : 1700); } else ir(destino);
  }));

  // ---------- La lámpara se prende y se apaga ----------
  function lampara() {
    const b = $('.obj--lampara');
    const on = sceneFrame.classList.toggle('is-dark');
    b.setAttribute('aria-pressed', String(!on));
  }

  // ---------- Sabores en la vitrina ----------
  $$('.gel').forEach((g) => g.addEventListener('click', () => {
    if (g.closest('.frame').dataset.dragged) return;
    const s = SABORES[g.dataset.sabor];
    $('.sabor__nombre', sabor).textContent = s.nombre;
    $('.sabor__desc', sabor).textContent = s.desc;
    $('.sabor__precio', sabor).textContent = `$${s.precio}`;
    $('.sabor__pedir', sabor).href = wa(`Hola Las Chinas, quiero pedir una gelatina de ${s.nombre.toLowerCase()}.`);
    $('.close__hint').hidden = true;
    // En pantallas angostas la vitrina se recorre hasta la gelatina elegida
    const r = g.closest('.frame').getBoundingClientRect();
    const gr = g.getBoundingClientRect();
    panVitrina.enfocar((gr.left + gr.width / 2 - r.left) / r.width, 0.8);
    mostrar(sabor);
  }));
  $('.sabor__cerrar').addEventListener('click', () => { sabor.hidden = true; });

  // ---------- Teclado ----------
  addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') return sabor.hidden ? regresar() : (sabor.hidden = true);
    if (actual) return;
    if (k === 'v') ir('vitrina');
    if (k === 'w') ir('celular');
    if (k === 'n') ir('pared');
    if (k === 'l') lampara();
  });

  // ---------- Entrada: la cocina aparece desde la penumbra ----------
  gsap.timeline()
    .set('.ui-top, .ui-bottom', { opacity: 0 })
    .fromTo(cam, { scale: 1.12 }, { scale: 1, duration: dur(2.8), ease: 'power2.out' }, 0)
    .to('.veil', { opacity: 0, duration: dur(1.8), ease: 'power1.inOut' }, 0)
    .set('.veil', { display: 'none' })
    .to('.ui-top', { opacity: 1, duration: dur(0.8) }, dur(1.2))
    .from('.obj__punto', { scale: 0, opacity: 0, duration: dur(0.6), stagger: dur(0.12), ease: 'back.out(2)' }, dur(1.6))
    .to('.ui-bottom', { opacity: 1, duration: dur(0.8), clearProps: 'opacity' }, dur(2.2));
  if (!fine) $('.pista').textContent = 'Desliza para mirar la cocina · toca un objeto';
})();
