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
Reglas tomadas de las skills `animate` y `emil-design-eng`:
- **Momento principal:** la gelatina de tres capas cae y tiembla **una vez** al cargar. Si la tocas, vuelve a temblar.
- **Hover en tarjetas:** temblor corto y suave, solo en dispositivos con mouse.
- **Scroll:** las tarjetas de las hermanas y los pasos aparecen escalonados.
- Solo se animan `transform` y `opacity`. Curva principal: `cubic-bezier(0.23, 1, 0.32, 1)`.
- Con "reducir movimiento" activado se quitan temblores y desplazamientos.

## Reglas de las skills que seguimos
- Nada de tres tarjetas idénticas en fila; el catálogo usa tamaños variados.
- Sin etiquetas pequeñas sobre los títulos, sin texto con degradado y sin nombres o testimonios inventados.
- Íconos de Phosphor, no emojis.
