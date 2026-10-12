// Historia: cada hermana se descubre por separado, con una máscara de abajo hacia arriba.
import { gsap, anima, MOTION } from './config.js';
import { $, $$ } from './util.js';

export function historia() {
  if (!anima) return;
  const sec = $('.historia');
  gsap.from($$('.titular > *', sec), { y: 30, opacity: 0, duration: MOTION.revela, stagger: 0.08, ease: MOTION.ease, scrollTrigger: { trigger: sec, start: 'top 80%' } });
  const fotos = $$('.hermana__foto', sec);
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.hermanas', start: 'top 78%' } });
  fotos.forEach((f, i) => {
    tl.fromTo(f, { clipPath: 'inset(100% 0% 0% 0% round 200px 200px 22px 22px)' }, { clipPath: 'inset(0% 0% 0% 0% round 200px 200px 22px 22px)', duration: 0.9, ease: 'power3.inOut', clearProps: 'clipPath' }, i * 0.28)
      .from($('img', f), { scale: 1.18, duration: 1.4, ease: MOTION.ease }, i * 0.28)
      .from(f.nextElementSibling, { opacity: 0, y: 10, duration: 0.5 }, i * 0.28 + 0.6);
  });
  gsap.from('.historia__firma > *', { y: 24, opacity: 0, duration: 0.7, stagger: 0.08, ease: MOTION.ease, scrollTrigger: { trigger: '.historia__firma', start: 'top 85%' } });
}
