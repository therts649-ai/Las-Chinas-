// Las Chinas: punto de entrada. Cada módulo se encarga de una parte de la página.
import { gsap, anima, MOTION } from './config.js';
import { $$ } from './util.js';
import { enlaces, paneles, encabezado } from './navegacion.js';
import { pedido } from './pedido.js';
import { catalogo } from './catalogo.js';
import { intro } from './intro.js';
import { hero_, entradaHero } from './hero.js';
import { escena } from './escena.js';
import { historia } from './historia.js';
import { eventos } from './eventos.js';
import { recetario } from './recetario.js';

if (anima) gsap.registerPlugin(ScrollTrigger);

enlaces();
paneles();
encabezado();
pedido();
catalogo();
hero_();
escena();
historia();
eventos();
recetario();

// Títulos de las demás secciones: entrada suave y corta
if (anima) {
  $$('.catalogo .titular, .arma .titular, .pasos .titular').forEach((t) => {
    gsap.from(t.children, { y: 30, opacity: 0, duration: MOTION.revela, stagger: 0.08, ease: MOTION.ease, scrollTrigger: { trigger: t, start: 'top 82%' } });
  });
  gsap.from('.filtro', { y: 14, opacity: 0, duration: 0.5, stagger: 0.04, ease: MOTION.ease, scrollTrigger: { trigger: '.filtros', start: 'top 88%' } });
  gsap.from('.recetario', { y: 40, opacity: 0, duration: MOTION.revela, ease: MOTION.ease, scrollTrigger: { trigger: '.recetario', start: 'top 85%' } });
  gsap.from('.pasos__lista li', { y: 30, opacity: 0, duration: 0.7, stagger: 0.1, ease: MOTION.ease, scrollTrigger: { trigger: '.pasos__lista', start: 'top 85%' } });
}

// La intro termina y el hero hace su entrada (si la intro ya se vio, una entrada corta)
intro().then((huboIntro) => entradaHero(!huboIntro));

addEventListener('load', () => window.ScrollTrigger?.refresh());
