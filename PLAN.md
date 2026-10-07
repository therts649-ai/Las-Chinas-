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

## Sistema de diseño
- **Colores:** rosa intenso, frambuesa oscuro y rosa muy claro, como en el diseño de referencia del cliente.
- **Tipografía:**
  - Lobster Two para los títulos;
  - Caveat para las notas a mano;
  - Poppins para el texto.
- **Componentes:** botón, chip de categoría, tarjeta de sabor, panel lateral, paso del configurador y resumen de pedido. Se definen una vez y se usan igual en todo el sitio.

## Sistema de movimiento (tres niveles)
1. **Momento estrella (uno por página):**
   - Inicio: la gelatina que se deconstruye con el scroll;
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
