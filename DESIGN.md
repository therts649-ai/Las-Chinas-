# Diseño de Las Chinas

## Mundo visual
Pastelería fina: **marfil y vino**. Fondo marfil con un toque rosado y luz cálida que respira, títulos en Bodoni Moda con palabras en itálica vino, líneas finas doradas y secciones oscuras en vino profundo. La fotografía y la gelatina 3D aportan el rojo fresa. Las fotos van dentro de arcos, como ventanas de vitrina.

## Color
| Token | Valor | Uso |
|---|---|---|
| `--marfil` | `#F7F0EA` | Fondo principal |
| `--marfil-2` | `#EFE3DA` | Superficies secundarias |
| `--blanco` | `#FFFDFB` | Tarjetas, marcos |
| `--rosado` | `#F1DCD8` | Luz cálida del fondo |
| `--vino` | `#5B0F1F` | Botones, itálicas, acentos |
| `--vino-2` / `--vino-3` | `#3E0915` / `#2A0610` | Títulos, "Cómo pedir", pie |
| `--dorado` / `--dorado-claro` | `#B08D57` / `#D9C29A` | Solo líneas y detalles (no texto pequeño sobre marfil) |
| `--dorado-texto` | `#7A5A2E` | Etiquetas doradas legibles sobre marfil |
| `--tinta` / `--tinta-suave` | `#2A1416` / `#6A4F4F` | Texto |

## Tipografía
- **Títulos:** Bodoni Moda (con itálica para las palabras clave).
- **Texto:** Figtree.

## Movimiento (taste-skill 8/10, reglas de impeccable y Emil Kowalski)
- **Telón de entrada** (1 vez por visita, se salta con clic o tecla): logo, nombre y línea dorada; el telón sube.
- **Inicio:** palabras que suben desde su máscara, el arco se abre desde el centro, la foto se asienta, cruza un destello y la gelatina tiembla. Con mouse, la vitrina se inclina en 3D y el brillo sigue al cursor.
- **Deconstrucción 3D** (`src/gelatina3d.js`, Three.js): la escena se queda fija mientras bajas y la gelatina, modelada en 3D, se eleva, se parte en gajos, las piezas, fresas y un remolino de leche giran alrededor, se vuelve a unir capa por capa, cae al plato con rebote y termina con una rebanada que muestra el interior. Las 8 etapas se resaltan al lado.
- **Franja de festejos** que corre sola y se adelanta con el scroll.
- **Vitrina horizontal:** el catálogo se queda fijo y las gelatinas pasan de lado al bajar (en celular se deslizan con el dedo).
- **Pasos:** números que suben de su máscara y una línea dorada que se dibuja.
- **Llamado final** con botón imán; destello dorado en los botones.
- **Reducir movimiento:** sin telón, sin fijados y sin escena animada; la página aparece completa y quieta (la 3D muestra una sola imagen con la rebanada).

## Logo
Logo oficial en `assets/logo-160.webp` y `assets/logo-480.webp`.

## Reglas de las skills que seguimos
- Sin etiquetas pequeñas sobre los títulos, sin texto con degradado y sin nombres o testimonios inventados.
- Íconos de Phosphor, no emojis. Una sola marquesina.
