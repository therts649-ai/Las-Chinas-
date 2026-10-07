# Diseño de Las Chinas

## Mundo visual
Rosa glamoroso, tal como el diseño de referencia del cliente: hero frambuesa oscuro con luces desenfocadas y corazones flotantes, fondo rosa muy claro, tarjetas blancas, rosa intenso para las acciones y títulos en letra script.

## Color
| Token | Valor | Uso |
|---|---|---|
| `--rosa-50` | `#FFF5F9` | Fondo de la página |
| `--rosa-100` / `--rosa-200` | `#FDE8F0` / `#F9CFDF` | Superficies suaves, íconos |
| `--rosa-500` / `--rosa-600` | `#E23A7E` / `#C81D63` | Botones y acentos |
| `--rosa-700` | `#A3124D` | Títulos script y precios |
| `--frambuesa` / `--frambuesa-2` | `#5A0F33` / `#3A0820` | Hero, "Calidad", pie y menú |
| `--ciruela` / `--ciruela-suave` | `#3B1029` / `#7A4A60` | Texto |

## Tipografía
- **Títulos:** Lobster Two itálica.
- **Notas a mano:** Caveat ("Tres hermanas, un mismo sabor").
- **Texto:** Poppins.

## Movimiento y 3D (GSAP + WebGL)
- **Entrada** (una vez por visita, un toque la adelanta): cae una gota de gelatina, rebota aplastándose con ondas, se transforma en el logo, se escribe "Tres hermanas, un mismo sabor" y la cortina sube escurriendo con gotas que se estiran.
- **Hero:** las letras de "Gelatinas artesanales" caen y rebotan una por una; la foto de las hermanas tiembla como gelatina al terminar y al tocarla; tocar el hero lanza corazones; capas con profundidad que siguen al mouse; el borde inferior escurre con gotas que se estiran.
- **Gelatina capa por capa:** la sección se queda fija y el video real avanza y retrocede con el scroll (120 cuadros en `assets/video/cuadros/`), con la frase de cada etapa. En celular la gelatina va grande al centro.
- **Franja de festejos** que corre sola y se acelera con la velocidad del scroll.
- **Sabores:** la foto real tiembla como gelatina al pasar el mouse o tocarla (`assets/js/jelly.js`); tarjetas con inclinación 3D.
- **Carrito:** la foto vuela al carrito, salen corazones del botón y el contador rebota.
- Títulos script que se escriben al aparecer; banners con paralaje.
- **Reducir movimiento:** sin entrada ni animaciones; la escena del scroll se cambia por el video con controles.

## Pedidos
Carrito guardado en el navegador; "Enviar pedido por WhatsApp" arma el mensaje con productos, cantidades y total.

## Archivos
- `assets/temp/`: imágenes TEMPORALES recortadas del diseño de referencia. Reemplazarlas por fotos en alta resolución con el mismo nombre.
- `assets/vendor/`: GSAP 3 y ScrollTrigger (licencia gratuita de GSAP).
