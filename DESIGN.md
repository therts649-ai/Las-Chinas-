# Diseño de Las Chinas

## Mundo visual
Repostería casera, alegre y antojable. Fondo en **degradado rosa → durazno** que se mueve muy lento. Las gelatinas son las protagonistas y siempre van sobre tarjetas crema para que no se pierdan en el rosa.

## Color
| Token | Valor | Uso |
|---|---|---|
| `--rosa` | `#FFD1DF` | Inicio del degradado de fondo |
| `--durazno` | `#FFDAB9` | Final del degradado de fondo |
| `--crema` | `#FFF8F3` | Tarjetas y superficies |
| `--fresa` | `#C42D63` | Marca, botones, banda de "Cómo pedir" |
| `--chocolate` | `#4A2C2A` | Texto principal (nunca negro puro) |
| `--mango`, `--uva`, `--limon`, `--menta` | ver `styles.css` | Sabores y acentos en ilustraciones |

## Tipografía
- **Títulos:** Gluten (redonda y suave, se siente como gelatina).
- **Texto:** Figtree.

## Movimiento
Nivel de movimiento alto (taste-skill: 8/10), con reglas de impeccable/animate y Emil Kowalski.

- **Momento principal (entrada, ~2.3 s):** la gelatina se llena capa por capa (fresa, mango, uva) con la superficie ondulada, se desmolda con un salto y tiembla. Al mismo tiempo, el título rebota palabra por palabra. Todo en CSS para que corra fluido aunque la página siga cargando.
- **Apoyo:**
  - Cubitos flotantes que siguen al mouse.
  - La gelatina se inclina hacia el cursor con un resorte (solo con mouse).
  - Una franja de festejos (la única marquesina de la página; se pausa al pasar el mouse).
  - Polaroids que caen y se quedan pegadas.
  - Gelatinas de las tarjetas que aterrizan en su plato.
  - Íconos de los pasos que brincan.
  - Borde derretido que fluye.
  - Botón de WhatsApp que entra al final y late 3 veces.
- **Curvas:** `--ease-out` para entradas normales. `--spring-bouncy` y `--spring-soft` (resortes como `linear()`) solo para lo que es "gelatina". El rebote es el material de la marca, no un adorno.
- Solo `transform`, `opacity`, `translate`, `rotate` y `scale`. Los ciclos infinitos se pausan fuera de pantalla.
- **Reducir movimiento:** la página aparece completa y quieta; solo quedan fundidos de opacidad.

## Logo
Logo preliminar en `assets/logo-preliminar-160.webp` (barra) y `assets/logo-preliminar-480.webp` (pie). Para cambiarlo, reemplaza esos archivos.

## Reglas de las skills que seguimos
- Nada de tres tarjetas idénticas en fila; el catálogo usa tamaños variados.
- Sin etiquetas pequeñas sobre los títulos, sin texto con degradado y sin nombres o testimonios inventados.
- Íconos de Phosphor, no emojis.
