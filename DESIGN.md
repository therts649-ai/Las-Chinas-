# Diseño de Las Chinas

## Mundo visual
Repostería real y antojable: **la fotografía es la protagonista**. Nada de ilustraciones de caricatura para los productos. Si todavía no hay foto de un producto, se muestra un espacio elegante con "Foto próximamente".

El fondo es un degradado rubor → durazno con luz suave y grano fino tipo papel fotográfico. Encima van bloques rojo fresa (vitrina detrás de la foto, franja de festejos, "Cómo pedir" con foto de fresas teñida de rojo) y un pie color vino.

## Color (tomado de la foto de fresa con leche)
| Token | Valor | Uso |
|---|---|---|
| `--rubor` | `#F7CDD3` | Fondo, inicio del degradado |
| `--durazno` | `#FCDDCB` | Fondo, final del degradado |
| `--crema` | `#FFF7F1` | Tarjetas, texto sobre rojo |
| `--nata` | `#F9E9DF` | Fondos de foto pendiente |
| `--fresa` | `#C8102E` | Marca, botones, franja |
| `--fresa-oscura` | `#8E0A22` | Texto pequeño en rojo sobre rubor, sombras |
| `--vino` | `#4E0716` | Pie de página |
| `--chocolate` | `#3A1F1D` | Texto principal |

## Fotografía
- Estilo de referencia: `assets/gelatina-fresa-leche-*.webp`. Luz natural, fondo rosa suave, mármol blanco, fruta fresca alrededor, mucho brillo en la gelatina.
- Las fotos nuevas van en `assets/` en WebP, en dos tamaños (800 y 1400 px de ancho).

## Tipografía
- **Títulos:** Gluten (redonda y suave, se siente como gelatina).
- **Texto:** Figtree.

## Movimiento
Nivel de movimiento alto (taste-skill: 8/10), con reglas de impeccable/animate y Emil Kowalski.

- **Momento principal (entrada, ~2 s):** el bloque fresa entra girando y la foto "se llena" de abajo hacia arriba como un molde, con un acercamiento que se asienta. Al final la foto tiembla como gelatina y aparece el sello giratorio con el logo. Al mismo tiempo, el título rebota palabra por palabra.
- **Apoyo:**
  - La foto se inclina en 3D hacia el cursor con un resorte y tiembla al tocarla.
  - Franja de festejos (la única marquesina; se pausa al pasar el mouse).
  - Polaroids que caen y se quedan pegadas.
  - Fotos del catálogo que se revelan de abajo hacia arriba.
  - Íconos de los pasos que brincan.
  - Paralaje en la foto de fondo de "Cómo pedir".
  - Borde derretido que fluye.
  - WhatsApp que entra al final y late 3 veces.
- **Curvas:** `--ease-out` para entradas. Resortes `linear()` solo para lo que es "gelatina".
- Los ciclos infinitos se pausan fuera de pantalla.
- **Reducir movimiento:** la página aparece completa y quieta.

## Logo
Logo preliminar en `assets/logo-preliminar-160.webp` (barra) y `assets/logo-preliminar-480.webp` (pie). Para cambiarlo, reemplaza esos archivos.

## Reglas de las skills que seguimos
- Nada de tres tarjetas idénticas en fila; el catálogo usa tamaños variados.
- Sin etiquetas pequeñas sobre los títulos, sin texto con degradado y sin nombres o testimonios inventados.
- Íconos de Phosphor, no emojis.
