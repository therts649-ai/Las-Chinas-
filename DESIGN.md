# Diseño de Las Chinas

Dirección: marca de postres con dirección artística propia; el producto es el protagonista
y las tres hermanas son las embajadoras de la marca. Fuente única de verdad de los tokens:
`:root` en `styles.css` (y `MOTION` en `assets/js/config.js` para el movimiento).

## Color
| Token | Valor | Uso |
|---|---|---|
| `--rosa` | `#F7A0C1` | Rosa pastel de la marca, acentos sobre fondos oscuros |
| `--rosa-claro` | `#FCE3EC` | Fondos editoriales (catálogo, recetario) |
| `--magenta` | `#D41465` | Acciones y acentos |
| `--marfil` | `#FFF9F5` | Áreas de lectura |
| `--ciruela` | `#35111F` | Profundidad: escena capa por capa, eventos, pie |

El hero cambia de color con cada sabor (`MUNDOS` en `assets/js/hero.js`).

## Tipografía
- **Titulares:** Space Grotesk 500–700.
- **Texto y navegación:** IBM Plex Sans 400–600.
- **Precios, números y metadatos:** IBM Plex Mono 400–500.
- El logotipo siempre es el archivo original (`assets/entrada/logo-*.webp`, `assets/logo-160.webp`).

## Estructura
1. Intro de marca (una vez por sesión) · 2. Hero · 3. Catálogo · 4. Capa por capa ·
5. Historia de las tres hermanas · 6. Mesas para eventos · 7. Recetario · 8. Cómo pedir · 9. Pie.

## Movimiento
- **Intro (≈3.5 s escritorio, ≈2.8 s celular):** luz → las hermanas aparecen por su panel
  original (rizos, centro, lacio) con máscaras → destellos en las gelatinas → logo y lema →
  la cortina sube hacia el hero. Cualquier toque, tecla o scroll la adelanta.
- **Hero:** cambio de sabor con cambio de color de todo el escenario; el postre entra
  enfocándose y un reflejo lo recorre. Flotación suave. Nunca se deforma el producto.
- **Catálogo:** tarjetas que entran por grupos; filtros por categoría.
- **Capa por capa:** escritorio, escena fija controlada por scroll (acercamiento, se separan
  las capas, flotan, regresan); celular y tableta, se reproduce una vez.
- **Historia:** cada hermana se descubre por separado con una máscara.
- **Duraciones:** micro 150–250 ms, interfaz 250–450 ms, revelados 500–900 ms.
- **Movimiento reducido:** sin intro ni escenas; todo visible y estático.

## Código
- `index.html` se genera con `python3 herramientas/pagina.py` (catálogo en la lista
  `CATALOGO`; piezas en `herramientas/piezas/`). No editar `index.html` a mano.
- JS en módulos: `assets/js/main.js` importa `intro`, `hero`, `catalogo`, `pedido`,
  `escena`, `historia`, `eventos`, `recetario`, `navegacion`.
