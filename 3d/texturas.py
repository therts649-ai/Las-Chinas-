"""Genera las texturas de la gelatina 3D (piel y corte de fresa, leche con fresa).

Uso: python 3d/texturas.py   (requiere numpy y Pillow)
Salida: assets/3d/*.webp
"""
import math
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', '3d')
rng = np.random.default_rng(7)


def save(img, name, q=88):
    img.save(os.path.join(OUT, name), 'WEBP', quality=q)


def normal_from_height(h, strength=4.0):
    """Mapa de normales (tangente) a partir de un mapa de altura 0..1."""
    gy, gx = np.gradient(h)
    nx, ny, nz = -gx * strength, -gy * strength, np.ones_like(h)
    n = np.stack([nx, ny, nz], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return Image.fromarray(((n * 0.5 + 0.5) * 255).astype(np.uint8))


# ---------- Piel de fresa: color, semillas hundidas y rugosidad ----------
W, H = 1024, 1024
v = np.linspace(0, 1, H)[:, None]           # 0 = punta, 1 = hombros (bajo las hojas)
base = np.zeros((H, W, 3))
deep = np.array([0.62, 0.02, 0.07])
mid = np.array([0.86, 0.06, 0.12])
top = np.array([0.93, 0.55, 0.42])           # zona clara cerca de las hojas
t = np.clip((v - 0.78) / 0.22, 0, 1)
col = mid * (1 - t) + top * t
col = col * (0.85 + 0.15 * np.sin(v * 3.1))  # leve variación de tono
col = deep * (1 - np.clip(v * 2.2, 0, 1)) * 0.25 + col * (0.75 + 0.25 * np.clip(v * 2.2, 0, 1))
base[:] = col[:, None, :]
noise = rng.normal(0, 0.025, (H, W, 1))
base = np.clip(base + noise, 0, 1)

height = np.ones((H, W)) * 0.5
img = Image.fromarray((base * 255).astype(np.uint8))
d = ImageDraw.Draw(img)
hm = Image.fromarray((height * 255).astype(np.uint8))
dh = ImageDraw.Draw(hm)
rows = 22
for r in range(rows):
    y = (r + 0.5) / rows * H
    cols = 20
    for c in range(cols):
        x = ((c + 0.5 * (r % 2)) / cols) * W + rng.normal(0, 4)
        yy = y + rng.normal(0, 4)
        s = 7 + rng.random() * 3
        # hoyuelo
        dh.ellipse([x - s * 1.6, yy - s * 2, x + s * 1.6, yy + s * 2], fill=40)
        d.ellipse([x - s * 1.5, yy - s * 1.9, x + s * 1.5, yy + s * 1.9], fill=(120, 4, 18))
        # semilla
        dh.ellipse([x - s * 0.55, yy - s * 0.9, x + s * 0.55, yy + s * 0.9], fill=200)
        d.ellipse([x - s * 0.55, yy - s * 0.9, x + s * 0.55, yy + s * 0.9], fill=(236, 200, 92))
        d.ellipse([x - s * 0.25, yy - s * 0.6, x + s * 0.05, yy - s * 0.1], fill=(255, 240, 170))
img = img.filter(ImageFilter.GaussianBlur(0.8))
save(img, 'fresa-color.webp')
hmf = np.asarray(hm.filter(ImageFilter.GaussianBlur(3))).astype(float) / 255
save(normal_from_height(hmf, 6.0), 'fresa-normal.webp')

# ---------- Corte de fresa (cara interior de las mitades) ----------
S = 1024
yy, xx = np.mgrid[0:S, 0:S] / S
# forma de corazón alargado: centro un poco arriba
cx, cy = 0.5, 0.45
dx, dy = (xx - cx) * 1.15, (yy - cy)
r = np.sqrt(dx ** 2 + dy ** 2)
ang = np.arctan2(dy, dx)
core = np.exp(-(dx / 0.05) ** 2 - (dy / 0.28) ** 2)        # médula blanca vertical
streak = (0.5 + 0.5 * np.sin(ang * 26)) ** 8 * np.clip(r / 0.45, 0, 1) * np.clip((0.40 - r) / 0.1, 0, 1)
red = np.array([0.80, 0.03, 0.10])
pink = np.array([1.0, 0.55, 0.62])
white = np.array([1.0, 0.92, 0.90])
k = np.clip(r / 0.42, 0, 1)[..., None]
c = white * (1 - k) ** 2 + pink * 2 * k * (1 - k) + red * k ** 2
c = c * (1 - 0.35 * streak[..., None]) + white * 0.35 * streak[..., None]
c = c * (1 - core[..., None] * 0.9) + white * core[..., None] * 0.9
rim = np.clip((r - 0.40) / 0.06, 0, 1)[..., None]
c = c * (1 - rim) + np.array([0.6, 0.0, 0.06]) * rim
cimg = Image.fromarray((np.clip(c, 0, 1) * 255).astype(np.uint8))
dc = ImageDraw.Draw(cimg)
for i in range(46):  # semillas en el borde
    a = i / 46 * math.tau
    x, y = cx + math.cos(a) * 0.43 / 1.15, cy + math.sin(a) * 0.43
    dc.ellipse([(x - 0.006) * S, (y - 0.009) * S, (x + 0.006) * S, (y + 0.009) * S], fill=(240, 205, 100))
save(cimg.filter(ImageFilter.GaussianBlur(1.2)), 'fresa-corte.webp')

# ---------- Leche con trocitos de fresa ----------
# La textura se estira 4 veces en vertical sobre el modelo, así que los trozos
# se dibujan aplanados (1/4 de alto) para que en la gelatina se vean redondos.
W, H = 2048, 512
SQ = 4.0
m = Image.new('RGB', (W, H), (252, 245, 238))
for i in range(10):
    x, y, s = rng.random() * W, rng.random() * H, 160 + rng.random() * 140
    halo = Image.new('L', (int(s * 6), int(s * 6 / SQ) + 2), 0)
    ImageDraw.Draw(halo).ellipse([s, s / SQ, s * 5, s * 5 / SQ], fill=60)
    halo = halo.filter(ImageFilter.GaussianBlur(s * 0.5 / SQ))
    m.paste((244, 172, 186), (int(x - s * 3), int(y - s * 3 / SQ)), halo)
m = m.filter(ImageFilter.GaussianBlur(2.2))
save(m, 'leche-color.webp')

# ---------- Hoja (sépalo) ----------
L = Image.new('RGB', (256, 256), (28, 80, 26))
dl = ImageDraw.Draw(L)
for i in range(256):
    g = int(70 + 50 * i / 256)
    dl.line([(0, i), (256, i)], fill=(22 + i // 20, int(g * 0.8), 22))
dl.line([(128, 0), (128, 256)], fill=(120, 170, 90), width=3)
save(L, 'hoja-color.webp')
print('texturas listas')
