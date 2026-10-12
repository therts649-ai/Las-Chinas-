// Datos de contacto (PENDIENTES: reemplazar por los reales) y parámetros de movimiento.
export const CONFIG = {
  whatsapp: '5210000000000', // lada de país + número, sin "+" ni espacios (ej. 5218112345678)
  instagram: '',             // ej. https://www.instagram.com/laschinas
  facebook: '',              // ej. https://www.facebook.com/laschinas
  tiktok: '',                // ej. https://www.tiktok.com/@laschinas
  maps: 'https://www.google.com/maps/search/?api=1&query=Monterrey%2C%20N.L.',
};

// Un solo lugar para ajustar el movimiento de todo el sitio (mismos valores que en styles.css)
export const MOTION = {
  micro: 0.2,
  ui: 0.35,
  revela: 0.8,
  ease: 'power3.out',
  easeIO: 'power3.inOut',
  saborCada: 7,           // segundos que se queda cada sabor en el hero
};

const mq = (q) => window.matchMedia(q).matches;
export const reduceMotion = mq('(prefers-reduced-motion: reduce)');
export const finePointer = mq('(hover: hover) and (pointer: fine)');
export const esCelular = () => mq('(max-width: 760px)');
export const esEscritorio = () => mq('(min-width: 1001px)');
export const gsap = window.gsap;
export const anima = !!gsap && !reduceMotion;
