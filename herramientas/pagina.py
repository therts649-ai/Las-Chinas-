"""Arma index.html a partir de las piezas de la página.

El catálogo se escribe desde la lista CATALOGO (una sola fuente de datos): así
agregar o quitar un producto es editar una línea. Las secciones de eventos,
recetario y paneles viven en herramientas/piezas/.

    python3 herramientas/pagina.py
"""
from html import escape
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PIEZAS = RAIZ / 'herramientas' / 'piezas'

CATEGORIAS = [
    ('familiares', 'Familiares', 'Familiar'),
    ('individuales', 'Individuales', 'Individual'),
    ('temporada', 'De temporada', 'Temporada'),
    ('variados', 'Postres variados', 'Variado'),
    ('eventos', 'Eventos', 'Evento'),
]

# id, categoría, nombre, descripción, foto (sin tamaño) o None, acción
# acción: 'pedido' (se agrega al pedido) · ('wa', mensaje) · ('ir', '#ancla', texto)
CATALOGO = [
    ('fresa-crema', 'familiares', 'Fresa con crema', 'Fresas naturales en gelatina brillante, sobre una capa de leche cremosa.', 'sabores/fresa-crema', 'pedido'),
    ('uva', 'familiares', 'Uva', 'Uvas verdes y moradas en gelatina de uva, sobre una capa de leche cremosa.', 'sabores/uva', 'pedido'),
    ('mango', 'familiares', 'Mango', 'Cubos de mango natural sobre una capa de leche cremosa. Dulce y tropical.', 'sabores/mango', 'pedido'),
    ('fresa-natural', 'familiares', 'Fresa natural', 'Gelatina de leche rosada con trozos reales de fresa y una fresa entera encima.', 'sabores/fresa-natural', 'pedido'),
    ('vasitos-capas', 'individuales', 'Vasitos de capas', 'Capas de fresa, leche, mango y uva en vaso, con fruta fresca encima.', 'sabores/vasitos-capas', 'pedido'),
    ('mango-maracuya', 'individuales', 'Mango con maracuyá', 'Maracuyá con cubos de mango y hierbabuena. Fresca y tropical.', 'sabores/mango-maracuya', 'pedido'),
    (None, 'temporada', 'San Valentín', 'Corazones de fresa y mini corazones para regalar.', 'temporada/san-valentin', ('wa', 'Hola Las Chinas, quiero pedir una gelatina de San Valentín.')),
    (None, 'temporada', 'Día de las Madres', 'Gelatinas de flor en tonos pastel, para consentir a mamá.', 'temporada/dia-madres', ('wa', 'Hola Las Chinas, quiero pedir una gelatina para el Día de las Madres.')),
    (None, 'temporada', 'Navidad y fin de año', 'Roscas para la cena, decoradas para la ocasión. Se apartan con anticipación.', None, ('wa', 'Hola Las Chinas, quiero apartar una gelatina para Navidad.')),
    ('corazon-fresa', 'variados', 'Corazón de fresa', 'En forma de corazón: fresas en gelatina brillante sobre capa de leche.', 'sabores/corazon-fresa', 'pedido'),
    ('mosaico', 'variados', 'Mosaico', 'Cubos de colores en gelatina de leche, en molde rectangular para rebanar.', 'sabores/mosaico', 'pedido'),
    (None, 'variados', 'La forma que imagines', 'Estrella, flor, números o letras: diséñala en el recetario y te la cotizamos.', None, ('ir', '#arma', 'Diseñar')),
    (None, 'eventos', 'Mesa de postres', 'Gelatinas de varias formas, tamaños y sabores, montadas para tu evento.', 'eventos/mesa', ('ir', '#eventos', 'Ver montajes')),
    (None, 'eventos', 'Gelatina personalizada', 'Con el nombre, los colores y la decoración de tu celebración.', 'temp/pedidos-especiales', ('wa', 'Hola Las Chinas, quiero cotizar una gelatina personalizada.')),
    (None, 'eventos', 'Individuales por docena', 'Vasitos y porciones individuales para tus invitados.', 'sabores/vasitos-capas', ('wa', 'Hola Las Chinas, quiero cotizar gelatinas individuales por docena para un evento.')),
]

ETIQUETA = {c: e for c, _, e in CATEGORIAS}


def imagen(foto, nombre):
    if foto is None:
        return ''
    if foto.startswith('temp/'):
        src = f'assets/{foto}.webp'
        return f'<img src="{src}" width="520" height="240" loading="lazy" alt="{escape(nombre)}">'
    return (f'<img src="assets/{foto}-760.webp" srcset="assets/{foto}-760.webp 760w, assets/{foto}-1200.webp 1200w" '
            f'sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 30vw" width="760" height="507" loading="lazy" alt="{escape(nombre)}">')


def tarjeta(item):
    pid, cat, nombre, desc, foto, accion = item
    attrs = f' data-cat="{cat}"'
    if pid:
        grande = f'assets/{foto}-1200.webp'
        attrs = f' data-id="{pid}" data-cat="{cat}" data-name="{escape(nombre)}" data-img="{grande}" data-desc="{escape(desc)}"'
    if foto:
        figura = f'<figure class="producto__foto">{imagen(foto, nombre)}<span class="producto__cat">{ETIQUETA[cat]}</span></figure>'
    else:
        figura = (f'<figure class="producto__foto producto__foto--tipo" aria-hidden="true"><span class="producto__tipo">{escape(nombre)}</span>'
                  f'<span class="producto__cat">{ETIQUETA[cat]}</span></figure>')
    if accion == 'pedido':
        acciones = (f'<button class="btn-texto js-ver" type="button">Ver</button>'
                    f'<button class="btn-mas js-agregar" type="button" aria-label="Agregar {escape(nombre)} a tu pedido"><svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg></button>')
        precio = 'Precio a confirmar'
    elif accion[0] == 'wa':
        acciones = f'<a class="btn-chico" data-wa="{escape(accion[1])}" href="#">Cotizar</a>'
        precio = 'Sobre pedido'
    else:
        acciones = f'<a class="btn-chico" href="{accion[1]}">{accion[2]}</a>'
        precio = 'Sobre pedido'
    return f'''          <li class="producto"{attrs}>
            {figura}
            <div class="producto__cuerpo">
              <h3 class="producto__nombre">{escape(nombre)}</h3>
              <p class="producto__desc">{escape(desc)}</p>
              <div class="producto__pie"><span class="producto__precio">{precio}</span><div class="producto__acciones">{acciones}</div></div>
            </div>
          </li>'''


def filtros():
    total = len(CATALOGO)
    botones = [f'<button class="filtro" type="button" data-cat="todos" aria-pressed="true">Todos <span>{total:02d}</span></button>']
    for c, nombre, _ in CATEGORIAS:
        n = sum(1 for i in CATALOGO if i[1] == c)
        botones.append(f'<button class="filtro" type="button" data-cat="{c}" aria-pressed="false">{nombre} <span>{n:02d}</span></button>')
    return '\n          '.join(botones)


def main():
    plantilla = (PIEZAS / 'plantilla.html').read_text()
    pagina = (plantilla
              .replace('{{ICONOS}}', (PIEZAS / 'iconos.html').read_text().rstrip())
              .replace('{{FILTROS}}', filtros())
              .replace('{{CATALOGO}}', '\n'.join(tarjeta(i) for i in CATALOGO))
              .replace('{{EVENTOS}}', (PIEZAS / 'eventos.html').read_text().rstrip())
              .replace('{{RECETARIO}}', (PIEZAS / 'recetario.html').read_text().rstrip())
              .replace('{{PIE}}', (PIEZAS / 'pie.html').read_text().rstrip())
              .replace('{{PANELES}}', (PIEZAS / 'paneles.html').read_text().rstrip()))
    assert '{{' not in pagina
    (RAIZ / 'index.html').write_text(pagina)
    print('index.html listo:', len(CATALOGO), 'productos')


if __name__ == '__main__':
    main()
