"""Separa la ilustración del hero en dos capas para el parallax.

Uso: python3 herramientas/hero.py   (requiere numpy, Pillow y opencv-python-headless)

Entrada:
  assets/temp/hero-hermanas.webp       ilustración actual (una sola imagen)
  fuentes/hero-hermanas-recorte.webp   la misma sin fondo (hyperframes remove-background)
Salida (assets/hero/):
  fondo-*.webp   el fondo de luces, desenfocado (se mueve poco)
  frente-*.webp  hermanas y gelatinas con transparencia (se mueve más)
"""
import os
import cv2
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
R = lambda *p: os.path.join(HERE, '..', *p)
OUT = R('assets', 'hero')

img = np.array(Image.open(R('assets', 'temp', 'hero-hermanas.webp')).convert('RGB'))
H, W = img.shape[:2]
yy, xx = np.mgrid[0:H, 0:W]

# 1) Quitar la flecha "↓" que quedó pegada del mockup (esquina inferior izquierda)
flecha = (((xx - 215) ** 2 + (yy - 790) ** 2) < 34 ** 2).astype(np.uint8) * 255
img = cv2.inpaint(img, flecha, 7, cv2.INPAINT_TELEA)

# 2) Frente: el recorte automático + toda la franja de gelatinas de abajo
#    (el recorte pierde el mango y parte de los platos, así que la franja va completa)
alfa = np.array(Image.open(R('fuentes', 'hero-hermanas-recorte.webp')).convert('RGBA'))[..., 3].astype(np.float32) / 255
franja = np.clip((yy - 500) / 60, 0, 1)
alfa = np.maximum(alfa, franja)
alfa = cv2.GaussianBlur(alfa, (0, 0), 1.2)
frente = np.dstack([img, (alfa * 255).astype(np.uint8)])

# 3) Fondo: la misma escena muy desenfocada, para que al moverse no se vean huecos
fondo = cv2.GaussianBlur(img, (0, 0), 16).astype(np.float32)
fondo = np.clip(fondo * 0.92, 0, 255).astype(np.uint8)


def guardar(arr, nombre, modo):
    im = Image.fromarray(arr, modo)
    for w in (960, 1600):
        h = round(w * H / W)
        im.resize((w, h), Image.LANCZOS).save(os.path.join(OUT, f'{nombre}-{w}.webp'), 'WEBP', quality=86 if modo == 'RGBA' else 80, method=6)


guardar(frente, 'frente', 'RGBA')
guardar(fondo, 'fondo', 'RGB')
print('capas del hero listas', W, H)
