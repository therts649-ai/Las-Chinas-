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
- **Presentación de entrada** (una vez por visita, se salta con clic): logo y la frase "Tres hermanas, un mismo sabor" palabra por palabra; luego se abre en círculo.
- **Hero:** entrada coreografiada con GSAP; capas con profundidad que siguen al mouse; corazones y luces que flotan; al bajar, la foto se aleja y el texto sube.
- **Gelatina 3D realista** (`assets/js/jelly.js`): la foto real de cada sabor se deforma como gelatina al pasar el mouse o tocarla, con brillo húmedo que sigue al cursor. Tiembla una vez al aparecer. Sin WebGL usa un temblor CSS.
- **Tarjetas** con inclinación 3D; títulos script que se escriben al aparecer; banners con paralaje.
- **Carrito:** la foto vuela al carrito al agregar; el contador rebota.
- **Video** de la deconstrucción con etapas sincronizadas.
- **Reducir movimiento:** sin presentación, sin GSAP ni efecto gelatina; todo aparece quieto.

## Pedidos
Carrito guardado en el navegador; "Enviar pedido por WhatsApp" arma el mensaje con productos, cantidades y total.

## Archivos
- `assets/temp/`: imágenes TEMPORALES recortadas del diseño de referencia. Reemplazarlas por fotos en alta resolución con el mismo nombre.
- `assets/vendor/`: GSAP 3 y ScrollTrigger (licencia gratuita de GSAP).
