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

## Dirección elegida: película interactiva
Todo el impacto lo pone **video de alta calidad dirigido como comercial**. La interfaz es mínima: logo, botón de pedir, una frase por escena y una línea de progreso. Sin corazones, temblores, gotas ni destellos.

### Cómo se ve y se siente
- **Una escena por pantalla.** Al bajar, la página avanza a la siguiente escena (como pasar historias) y su video se reproduce.
- **La deconstrucción es la única escena que se controla con el dedo**: avanza y retrocede con el scroll.
- **Cortes invisibles:** el último cuadro de cada video es el primero del siguiente, así la película se siente como una sola toma.
- **Tipografía:** una frase grande por escena que aparece con una revelación suave. Es la única animación de interfaz.
- **Celular primero:** cada escena en vertical 9:16 para celular y horizontal 16:9 para computadora.

### Guion de escenas del inicio
| # | Escena | Qué se ve | Cámara | Frase | Duración |
|---|---|---|---|---|---|
| 1 | Apertura | Desde negro, una gota de gelatina de fresa líquida cae en cámara lenta sobre un molde y salpica | Fija, macro | *Las Chinas* | 5 s |
| 2 | El vertido | Gelatina roja brillante se vierte en un molde de rosca con rebanadas de fresa | Órbita lenta | *Hechas a mano, una por una* | 6 s |
| 3 | El desmolde | Se levanta el molde y aparece la gelatina perfecta, que tiembla suavemente | Acercamiento lento | *Gelatinas artesanales* | 6 s |
| 4 | Las manos | Manos con mandil rosa decoran gelatinas con fresas y flores (sin rostros, para que se vea siempre consistente) | Lateral lento | *Tres hermanas, un mismo sabor* | 6 s |
| 5 | Deconstrucción | La gelatina se separa, flota y se vuelve a unir (ya la tenemos; se regenera en mejor calidad y en vertical) | Fija; **se controla con el scroll** | Una frase por etapa | 10 s |
| 6 | La mesa | La cámara se aleja y revela la mesa con gelatinas de fresa, uva, mango y fresa con crema | Alejamiento lento | *¿Cuál se te antoja?* + botones | 6 s |

### Estilo común (pegar al inicio de cada indicación)
> Ultra-realistic premium food commercial, soft pink pastel studio, soft natural window light from the left, white marble table, fresh strawberries, glossy translucent gelatin, shallow depth of field, slow elegant motion, 24fps cinematic, no text, no logos, no watermark.

### Indicaciones por escena (agregar después del estilo común)
1. **Apertura:** *Starting from black, a single drop of liquid strawberry gelatin falls in extreme slow motion into an empty bundt mold and creates a small glossy splash. Static macro camera.*
2. **El vertido:** *Glossy liquid red strawberry gelatin is poured slowly into a bundt mold filled with fresh strawberry slices. The camera orbits slowly around the mold.*
3. **El desmolde:** *A bundt mold is lifted slowly, revealing a perfect strawberry and milk jello on a white plate; it jiggles softly. The camera pushes in slowly.*
4. **Las manos:** *Hands of a young woman wearing a pink apron decorate strawberry jellos with fresh strawberries and small edible flowers. No faces visible. Slow lateral camera move.*
5. **Deconstrucción:** regenerar el video actual en 1080p, en vertical y horizontal.
6. **La mesa:** *The camera slowly pulls back from a strawberry jello to reveal a pink table with several jellos: strawberry, grape, mango and strawberry with cream, fresh fruit around them.*

**Truco para que no se noten los cortes:** al generar cada escena, usa como **imagen inicial el último cuadro** de la escena anterior. La herramienta lo permite: "start frame" en Kling, Runway, Luma y Veo.

### Especificaciones de entrega
- Cada escena en **9:16 (1080×1920)** y **16:9 (1920×1080)**, MP4, sin audio, sin texto.
- Yo los recorto, los comprimo para celular (MP4 y WebM) y preparo los cuadros de la deconstrucción para el control con scroll.
- **Presupuesto de carga:** la escena 1 pesa menos de 1 MB para que arranque al instante; las demás se cargan mientras ves la anterior.

### El resto del sitio
Sereno y elegante. Fotografía grande y tipografía cuidada, con transiciones suaves entre páginas. El configurador "Arma tu gelatina" mantiene una sola animación: la vista previa que cambia con cada elección.

## Hecho: entrada nueva y escena «Capa por capa»

Menos animaciones y más fuertes. Se quitaron los corazones flotando, las gotas del
hero, el temblor de las fotos, la franja de festejos y la secuencia de cuadros del video.

- **Entrada** (una vez por visita, se salta con un toque): fondo marfil, «Tres hermanas,
  un mismo sabor» en serif (Cormorant Garamond) línea por línea, el logo, y la cortina
  se levanta como un molde que se estira y se suelta.
- **Capa por capa**: la foto real de la gelatina separada en capas
  (`herramientas/capas.py` → `assets/capas/`). Con el scroll la capa de fresa sube,
  la leche se despega del plato, todo flota, se vuelve a unir con un temblor y termina
  en «Lista para tu mesa» con el botón de WhatsApp.
  - Fondo quitado con `npx hyperframes remove-background` (`fuentes/gelatina-recorte.webp`).
  - La cara de arriba de la leche (que la foto no muestra) se arma con parches de la
    textura real de la leche; el plato completo está dibujado.
  - Cuando existan las fotos por capa hechas con IA (o fotos reales), solo se cambian
    los archivos de `assets/capas/`.

## (Descartado) Experiencia de inicio: un plano secuencia
Se probó en `prototipo/` y se descartó: demasiados efectos y muy simples.

### Detalle del intento descartado
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

**Prototipo:** `prototipo/index.html` (etapas 1 a 4 con las imágenes temporales).

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
- **Publicación:** por ahora en un enlace privado de Claude; después, hosting con dominio propio cuando lo tengan.

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

## La cocina como entrada (inicio)
- `#inicio` es ahora la cocina (`assets/cocina.css`, `assets/js/cocina.js`). Cada objeto acerca la cámara y abre una tarjeta que lleva a su sección: vitrina → sabores (con «Agregar al pedido»), celular → WhatsApp, fotos → `#nosotras`, pizarrón → menú completo, recetario → `#arma`, ventana → `#ubicacion`.
- La marca es un letrero de neón en la pared; el `h1` queda para lectores de pantalla.
- La ilustración de las hermanas pasó a «Conoce a Las Chinas».
- `#arma`: recetario que arma la receta y la manda por WhatsApp.
- `/cocina/` redirige al inicio.
- PENDIENTE: número de WhatsApp, precios reales, zonas de entrega.
