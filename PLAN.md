# Plan del sitio de Las Chinas

## Objetivo
Que cada visita termine en **un pedido por WhatsApp listo para confirmar** (sabor, tamaño, cantidad y fecha), sin que las hermanas tengan que volver a preguntar todo.

**Cómo lo medimos:** clics a WhatsApp por página y pedidos que llegan desde la web.

## Recorrido del visitante
| Etapa | Qué debe sentir | Dónde ocurre |
|---|---|---|
| Atrapar (0–5 s) | "¡Wow!" | Entrada con la gota e inicio con las hermanas |
| Antojar | "Se me antoja" | Gelatina que se deconstruye con el scroll, sabores estrella |
| Confiar | "Son de verdad" | Las hermanas, cómo la preparan, opiniones reales (cuando existan) |
| Elegir | "Quiero esta" | Catálogo con filtros y "Arma tu gelatina" |
| Pedir | "Qué fácil" | Carrito y configurador que envían por WhatsApp, zonas y horario |

## Mapa del sitio
1. **Inicio** (`/`)
   - Entrada (una vez por visita) → hero con las hermanas → la gelatina capa por capa (scroll) → sabores estrella (4) → banner "Arma tu gelatina" → las hermanas (resumen) → cómo pedir (3 pasos) → Instagram → ubicación y horario → llamado final.
2. **Sabores** (`/sabores`)
   - Filtros por categoría, catálogo completo, ficha de cada gelatina (fotos, descripción, tamaños y precios, agregar al pedido).
3. **Arma tu gelatina** (`/arma-tu-gelatina`) — pieza central.
4. **Nosotras** (`/nosotras`)
   - Historia de las tres hermanas, cómo preparan cada gelatina, ingredientes, fotos.
5. **Carrito** (panel en todas las páginas) → mensaje de WhatsApp con el pedido.

## "Arma tu gelatina"
Configurador paso a paso con vista previa, precio aproximado y resumen enviado por WhatsApp.

| Paso | Opciones (por confirmar con el cliente) |
|---|---|
| 1. Tamaño | Individual (vasito), chica, mediana, grande, para evento |
| 2. Base | Leche, agua (cristalina), mosaico |
| 3. Sabor y color | Fresa, uva, mango, limón, piña, rompope, etc. |
| 4. Capas | 1, 2 o 3 capas, con color de cada una |
| 5. Fruta | Fresa, mango, uva, durazno, sin fruta |
| 6. Decoración | Flores, nombre o mensaje, número de edad, temática |
| 7. Fecha y entrega | Fecha, recoger o entrega a domicilio, zona |
| Resumen | Vista previa, precio aproximado, "Enviar por WhatsApp" |

**Vista previa:**
- foto del tamaño y la base elegidos (una foto por combinación principal, generada con IA);
- encima, capas de color, fruta, decoración y mensaje como elementos superpuestos;
- transición tipo gelatina en cada cambio.

**Precio:**
- tabla por tamaño, más extras (capas, fruta, decoración);
- se muestra como "desde $___" y el precio final se confirma por WhatsApp.

## Experiencia de inicio: un plano secuencia
Los cuatro conceptos aprobados se unen en un solo recorrido continuo, sin cortes. Cada uno tiene un papel:

| # | Etapa | Qué pasa | Cómo avanza | Técnica |
|---|---|---|---|---|
| 1 | **Gelatina líquida** (A) | La pantalla es gelatina rosa líquida que se ondula, salpica y deja estelas al mover el dedo o el mouse. A los ~4 s "cuaja" y forma el logo. | Sola, en unos 5 s; un toque la adelanta | Simulación de fluido WebGL |
| 2 | **A través de la gelatina** (D) | La gelatina cuajada se vuelve translúcida: detrás se ve el inicio refractado, con burbujas y fresas suspendidas. Tiembla al tocarla. | Primer scroll o toque: la atraviesas | Shader de refracción sobre la escena |
| 3 | **Mundo en capas** (C) | El inicio: cocina rosa con luces, las tres hermanas, gelatinas y fresas flotando al frente. Cada capa se mueve a su propia profundidad con el giroscopio o el mouse. Aparecen el título y los botones. | Reposo; al bajar, la cámara avanza entre las capas y las fresas pasan por delante | Capas recortadas con GSAP (2.5D) |
| 4 | **Cine con scroll** (B) | La cámara sigue de frente y **entra en la gelatina del centro**; sin corte comienza la deconstrucción: se separa, flota, se vuelve a unir y termina en la rebanada. | El scroll controla el video, hacia adelante y hacia atrás | Video IA cuadro por cuadro sincronizado con el scroll |

**Reglas para que envuelva sin cansar:**
- La entrada (1 y 2) dura como máximo 6 s, sale una vez por visita y siempre se puede saltar.
- El menú y el botón de WhatsApp están visibles desde la etapa 3.
- Carga progresiva:
  - la etapa 1 no necesita fotos, así que arranca al instante;
  - mientras juegas, se cargan las capas y el video.
- En celular: giroscopio (con permiso en iPhone), menos partículas y resolución adaptada para mantener 60 cuadros por segundo.
- Con "reducir movimiento": sin entrada; inicio con foto fija y video con controles.

**Material con IA para el plano secuencia:**
| Archivo | Descripción | Medidas |
|---|---|---|
| Capa fondo | Cocina rosa con luces desenfocadas, sin personas | 2400×1600 |
| Capa hermanas | Las tres hermanas con mandiles rosas, fondo liso verde o gris para recortar | 2400×1600 |
| Capa gelatinas | Gelatinas de fresa, fresa con crema, uva y mango sobre la mesa, fondo liso | 2400×1200 |
| Fresas y gotas sueltas | 6–8 fresas, mitades y cubitos de gelatina, cada uno aislado sobre fondo liso | 800×800 c/u |
| Video "entrar a la gelatina" | Cámara fija que avanza lento hacia la gelatina central hasta entrar en su interior rojo translúcido | 6–8 s, 1080p |
| Video deconstrucción | El que ya tenemos (se puede regenerar en mayor calidad) | 10 s, 1080p |

## Sistema de diseño
- **Colores:** rosa intenso, frambuesa oscuro y rosa muy claro, como en el diseño de referencia del cliente.
- **Tipografía:**
  - Lobster Two para los títulos;
  - Caveat para las notas a mano;
  - Poppins para el texto.
- **Componentes:** botón, chip de categoría, tarjeta de sabor, panel lateral, paso del configurador y resumen de pedido. Se definen una vez y se usan igual en todo el sitio.

## Sistema de movimiento (tres niveles)
1. **Momento estrella (uno por página):**
   - Inicio: el plano secuencia de entrada (ver arriba);
   - Configurador: la vista previa que se arma capa por capa.
2. **Transiciones:**
   - al cambiar de página, la gelatina "se derrite" hacia la siguiente;
   - las secciones aparecen con el scroll.
3. **Detalles:** temblor al tocar una foto, corazones al agregar al pedido, contador que rebota.

**Reglas:**
- menos efectos y mejor elegidos;
- todo respeta "reducir movimiento";
- 60 cuadros por segundo en un celular de gama media.

## Fotos con IA (especificación)
Mismo estilo en todas: luz natural suave, fondo rosa claro, mármol blanco, fruta fresca alrededor, gelatina muy brillante, sin texto ni marcas de agua.

| Imagen | Medidas | Uso |
|---|---|---|
| Hero con las tres hermanas y sus gelatinas | 2400×1600 (horizontal) y 1080×1350 (vertical) | Inicio en computadora y celular |
| Cada sabor (fresa con crema, uva, mango, fresa natural…) | 1600×1200 | Catálogo y fichas |
| Configurador: tamaño × base | 1600×1600 | Vista previa |
| Las hermanas trabajando | 1600×1200 | Nosotras |
| Proceso (vertiendo, desmoldando) | 1600×1200 | Calidad y Nosotras |
| 6 publicaciones tipo Instagram | 1080×1080 | Instagram |

## Parte técnica
- **Astro:**
  - páginas y componentes reutilizables;
  - productos y opciones del configurador en archivos de datos fáciles de editar;
  - imágenes optimizadas automáticamente.
- **GSAP + ScrollTrigger** para el movimiento y **Lenis** para el desplazamiento suave.
- **SEO local** (Monterrey):
  - datos de negocio para Google;
  - imagen al compartir en WhatsApp y redes.
- **Velocidad:** que cargue en menos de 2.5 s en el celular con datos móviles.
- **Accesibilidad:** contraste, teclado y lectores de pantalla.
- **Publicación:** GitHub Pages o Netlify, con dominio propio cuando lo tengan.

## Fases
| Fase | Qué sale | Depende de |
|---|---|---|
| 0. Definición | Este plan aprobado | — |
| 1. Contenido | Fotos IA, precios, opciones del configurador, textos, datos de contacto | Cliente |
| 2. Bocetos | Bocetos para celular de las 4 páginas y del configurador | Fase 0 |
| 3. Diseño | Inicio y configurador diseñados para aprobación | Fase 2 |
| 4. Desarrollo | Sitio completo en Astro | Fases 1 y 3 |
| 5. Pruebas y lanzamiento | Pruebas en celulares reales, velocidad, SEO, publicación | Fase 4 |

## Lo que necesitamos del cliente
- [ ] Número de WhatsApp y redes (Instagram, Facebook, TikTok).
- [ ] Catálogo real: sabores, tamaños y precios.
- [ ] Opciones reales del configurador y costo de cada extra.
- [ ] Zonas de entrega, costo de envío y horario.
- [ ] Anticipación mínima para pedidos (por ejemplo, 2 días).
- [ ] Opiniones reales de clientas (con permiso).
