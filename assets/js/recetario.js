// Recetario: arma tu gelatina y mándala por WhatsApp.
// La receta se escribe mientras eliges; las capas se ven como una franja de colores.
import { $, waLink, toast } from './util.js';

export function recetario() {
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
}
