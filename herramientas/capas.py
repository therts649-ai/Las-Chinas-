"""Separa la foto real de la gelatina en capas para la escena «Capa por capa».

Uso: python3 herramientas/capas.py   (requiere numpy, Pillow y opencv-python-headless)

Entrada:
  fuentes/gelatina-recorte.webp  foto sin fondo (hyperframes remove-background)
Salida (assets/capas/, todas del mismo tamaño para encimarlas sin ajustar nada):
  plato.webp        plato completo dibujado (el de la foto sale cortado)
  leche.webp        capa de leche con trocitos de fresa (de la foto)
  leche-tapa.webp   cara de arriba de la capa de leche (solo se ve al separar)
  fresa.webp        capa de gelatina de fresa (de la foto)
  fresa-mitad.webp  la fresa partida de la foto, suelta, para que flote
Cada archivo tiene además una versión -m (mitad de tamaño) para celular.
"""
import math
import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'fuentes', 'gelatina-recorte.webp')
OUT = os.path.join(HERE, '..', 'assets', 'capas')
rng = np.random.default_rng(3)

# Lienzo final (coordenadas de la foto de 1400×933). Es más ancho que la foto
# porque el plato completo se sale por la derecha.
X0, Y0, CW, CH = 40, 40, 1500, 860

# La gelatina es un anillo: cada altura se ve como una elipse con el mismo centro.
CX, RX, RY = 790, 620, 198
CORTE = 402    # centro de la elipse donde termina la fresa y empieza la leche
BASE = 602     # centro de la elipse donde la leche toca el plato


def arco(x, cy, rx=RX, ry=RY):
    """Altura del borde de enfrente de la elipse en la columna x."""
    t = np.clip(1 - ((x - CX) / rx) ** 2, 0, 1)
    return cy + ry * np.sqrt(t)


im = np.array(Image.open(SRC).convert('RGBA'))
H, W = im.shape[:2]
rgb, alpha = im[..., :3].copy(), im[..., 3].astype(np.float32) / 255
yy, xx = np.mgrid[0:H, 0:W]

# ---------- Las fresas sueltas de la izquierda no son parte de la gelatina ----------
mitad = Image.new('L', (W, H), 0)
ImageDraw.Draw(mitad).polygon([(18, 700), (40, 640), (100, 595), (170, 578), (238, 598), (270, 650), (278, 720),
                               (258, 782), (202, 814), (110, 818), (40, 792), (16, 750)], fill=255)
mitad = np.array(mitad) > 0
r, g, b = [rgb[..., i].astype(int) for i in range(3)]
hojas = (g > r - 6) & (r < 175) & (xx < 335) & (yy > 525) & (yy < 725) & (alpha > 0.2)
hojas = cv2.dilate(hojas.astype(np.uint8), np.ones((11, 11), np.uint8)) > 0
fresas = mitad | hojas | (xx < 200)


def borde_fresa():
    """Borde real (ondulado) entre la gelatina roja y la leche, columna por columna."""
    G = rgb[..., 1].astype(float)
    ajuste = lambda x: 317.4 + 281.2 * np.sqrt(np.clip(1 - ((x - 805) / 620) ** 2, 0, 1))
    ys = ajuste(np.arange(W).astype(float))
    for x in range(330, W):
        e, mejor = int(ajuste(x)), None
        for y in range(e - 60, e + 30):
            if G[y - 6:y, x].mean() < 95 and (G[y:y + 14, x] > 112).all():
                mejor = y
        if mejor is not None and abs(mejor - ajuste(x)) < 45:
            ys[x] = mejor
    k = 15
    pad = np.pad(ys, k, mode='edge')
    med = np.array([np.median(pad[i:i + 2 * k + 1]) for i in range(W)])
    caja = np.ones(31) / 31
    return np.convolve(np.pad(med, 15, mode='edge'), caja, mode='valid')


borde = borde_fresa()

# Silueta de la gelatina (sin plato): todo lo que está arriba del borde de la base
gel = (alpha > 0.02) & (yy < arco(xx, BASE) + 2) & (xx >= 200)
# Lo que tapaban las fresas se rellena con la leche de alrededor
tapadas = cv2.dilate((mitad | hojas).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
hueco = tapadas & (xx >= 200) & (yy > 520) & (yy < arco(xx, BASE))
# Se copia la onda de al lado (misma luz, mismos trocitos) y se suaviza la unión
DESP = 132
parche = np.roll(rgb, -DESP, axis=1)
suave = cv2.GaussianBlur(hueco.astype(np.float32), (0, 0), 3)[..., None]
suave = np.maximum(suave, hueco[..., None])
rgb = (rgb * (1 - suave) + parche * suave).astype(np.uint8)
a_gel = np.where(hueco, 1.0, alpha) * ((yy < arco(xx, BASE) + 2) & (xx >= 200))
# Borde inferior suave (donde estaba el plato)
a_gel *= np.clip((arco(xx, BASE) + 2 - yy) / 3, 0, 1)

# ---------- Fresa / leche: se cortan por el borde real ----------
corte = borde[xx]
f_fresa = np.clip((corte + 1.5 - yy) / 3, 0, 1)
f_leche = np.clip((yy - corte + 1.5) / 3, 0, 1)


def guardar(rgba, nombre):
    img = Image.fromarray(rgba, 'RGBA')
    lienzo = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
    lienzo.paste(img, (-X0, -Y0), img)
    lienzo.save(os.path.join(OUT, f'{nombre}.webp'), 'WEBP', quality=86, method=6)
    lienzo.resize((CW // 2, CH // 2), Image.LANCZOS).save(os.path.join(OUT, f'{nombre}-m.webp'), 'WEBP', quality=84, method=6)


def capa(a):
    return np.dstack([rgb, (np.clip(a, 0, 1) * 255).astype(np.uint8)])


orilla = np.clip((xx - 200) / 34, 0, 1)
rgb = (rgb * (0.78 + 0.22 * orilla ** 0.7)[..., None]).astype(np.uint8)
guardar(capa(a_gel * f_fresa), 'fresa')
guardar(capa(a_gel * f_leche), 'leche')

# ---------- Cara de arriba de la leche (dibujada) ----------
# Plano a la altura del corte: el borde de atrás es una elipse y el de enfrente
# es el borde real de la foto, así encaja exacto con la capa de leche.
S = 2  # se dibuja al doble y se reduce para que los bordes queden finos
TCX, TCY, TRX, TRY = 805, 402, 600, 198
ty, tx = np.mgrid[0:H * S, 0:W * S] / S
s_ = np.sqrt(np.clip(1 - ((tx - TCX) / TRX) ** 2, 0, 1))
atras = TCY - TRY * s_
frente = np.interp(tx, np.arange(W), borde) - 0.5
dentro = np.clip(np.minimum(ty - atras, frente - ty) * S / 2, 0, 1) * (np.abs(tx - TCX) < TRX)
# La superficie usa la textura real de la leche de la foto: parches del costado,
# aplanados por la perspectiva (TRY / TRX) y acomodados al azar, sin repetirse.
franja = rgb[620:700, 330:1250]
media = franja.reshape(-1, 3).mean(0)
TW, TH = int(2 * TRX * S) + 8, int(2 * TRY * S) + 8
tex = Image.new('RGB', (TW, TH), tuple(int(c) for c in media))
PW, PH = 70, 70
aplano = TRY / TRX
pw, ph = PW * S, max(8, int(PH * S * aplano))
borde_suave = Image.new('L', (pw, ph), 0)
ImageDraw.Draw(borde_suave).rectangle([pw * 0.18, ph * 0.18, pw * 0.82, ph * 0.82], fill=255)
borde_suave = borde_suave.filter(ImageFilter.GaussianBlur(min(pw, ph) * 0.12))
for gy in range(-ph, TH + ph, int(ph * 0.55)):
    for gx in range(-pw, TW + pw, int(pw * 0.55)):
        sx, sy = rng.integers(0, franja.shape[1] - PW), rng.integers(0, franja.shape[0] - min(PH, franja.shape[0]) + 1)
        parche = Image.fromarray(franja[sy:sy + PH, sx:sx + PW]).resize((pw, ph), Image.LANCZOS)
        if rng.random() < 0.5:
            parche = parche.transpose(Image.FLIP_LEFT_RIGHT)
        tex.paste(parche, (int(gx + rng.integers(-8, 8)), int(gy + rng.integers(-3, 3))), borde_suave)
tex = np.array(tex.filter(ImageFilter.GaussianBlur(1.2 * S))).astype(np.float32)
ox, oy = (TCX - TRX) * S - 4, (TCY - TRY) * S - 4
col = np.zeros((H * S, W * S, 3), np.float32) + media
col[int(oy):int(oy) + TH, int(ox):int(ox) + TW] = tex[:max(0, min(TH, H * S - int(oy))), :max(0, min(TW, W * S - int(ox)))]
# Película lisa encima: los trocitos se adivinan debajo
col = 0.62 * cv2.GaussianBlur(col, (0, 0), 1.2 * S) + 0.38 * media
# Luz de arriba: más clara al frente, más oscura atrás y en los extremos
v = np.clip((ty - atras) / np.maximum(frente - atras, 1), 0, 1)
luz = 0.9 + 0.16 * v ** 0.8 - 0.1 * np.abs((tx - TCX) / TRX) ** 4
col = np.clip(col * luz[..., None] * np.array([1.0, 1.02, 1.03]), 0, 255)
t = Image.fromarray(np.dstack([col, dentro * 255]).astype(np.uint8), 'RGBA')
t = np.array(t)
t[..., 3] = (dentro * 255).astype(np.uint8)
t = Image.fromarray(t, 'RGBA')
d = ImageDraw.Draw(t)
rx, ry = TRX, TRY
CX, CORTE = TCX, TCY
# Agujero del centro: pared interior en sombra
hole = Image.new('RGBA', t.size, (0, 0, 0, 0))
hr, hry = TRX * 0.37, TRY * 0.37
hg = np.zeros((H * S, W * S, 4), np.float32)
k = np.clip((ty - (CORTE - hry)) / (2 * hry), 0, 1)
hg[..., 0] = 214 - 96 * k
hg[..., 1] = 168 - 98 * k
hg[..., 2] = 156 - 92 * k
mask = Image.new('L', t.size, 0)
ImageDraw.Draw(mask).ellipse([(CX - hr) * S, (CORTE - hry) * S, (CX + hr) * S, (CORTE + hry) * S], fill=255)
hg[..., 3] = np.array(mask)
t.alpha_composite(Image.fromarray(hg.astype(np.uint8), 'RGBA'))
# Brillo húmedo pegado al borde de enfrente
brillo = np.exp(-((frente - ty - 4) / 1.8) ** 2) * dentro * (0.35 + 0.65 * s_)
ta = np.array(t).astype(np.float32)
ta[..., :3] += (255 - ta[..., :3]) * (0.55 * brillo)[..., None]
t = Image.fromarray(np.clip(ta, 0, 255).astype(np.uint8), 'RGBA')
t = np.array(t.resize((W, H), Image.LANCZOS))
# Recortar a la silueta (no puede salirse de la gelatina que la tapa)
t[..., 3] = (t[..., 3].astype(np.float32) * np.clip(a_gel * 1.0, 0, 1)).astype(np.uint8)
guardar(t, 'leche-tapa')

# ---------- Plato completo ----------
PCY, PRX, PRY, GROSOR = 612, 735, 232, 16
p = Image.new('RGBA', (W * 2 * S, H * S), (0, 0, 0, 0))  # más ancho: el plato se sale de la foto
dp = ImageDraw.Draw(p)
dp.ellipse([(CX - PRX) * S, (PCY - PRY + GROSOR) * S, (CX + PRX) * S, (PCY + PRY + GROSOR) * S], fill=(214, 206, 208, 255))
dp.ellipse([(CX - PRX) * S, (PCY - PRY) * S, (CX + PRX) * S, (PCY + PRY) * S], fill=(246, 243, 242, 255))
pa = np.array(p).astype(np.float32)
py_, px_ = np.mgrid[0:H * S, 0:W * 2 * S] / S
dist = np.sqrt(((px_ - CX) / PRX) ** 2 + ((py_ - PCY) / PRY) ** 2)
# Ala del plato: un aro un poco más oscuro y luego el borde brillante
ala = np.clip((dist - 0.80) / 0.06, 0, 1) * np.clip((1.0 - dist) / 0.03, 0, 1)
luz = 1 - 0.05 * ala - 0.03 * np.clip((PCY - py_) / PRY, 0, 1)
top = dist <= 1.0
pa[..., :3] = np.where(top[..., None], pa[..., :3] * luz[..., None], pa[..., :3])
p = Image.fromarray(np.clip(pa, 0, 255).astype(np.uint8), 'RGBA')
b2 = Image.new('RGBA', p.size, (0, 0, 0, 0))
db = ImageDraw.Draw(b2)
db.arc([(CX - PRX + 10) * S, (PCY - PRY + 6) * S, (CX + PRX - 10) * S, (PCY + PRY - 4) * S], 200, 300, fill=(255, 255, 255, 230), width=5 * S)
db.arc([(CX - PRX + 3) * S, (PCY - PRY + 3) * S, (CX + PRX - 3) * S, (PCY + PRY + 2) * S], 30, 150, fill=(255, 255, 255, 200), width=3 * S)
p.alpha_composite(b2.filter(ImageFilter.GaussianBlur(3 * S)))
p = np.array(p.resize((W * 2, H), Image.LANCZOS))
guardar_plato = Image.fromarray(p, 'RGBA')
lienzo = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
lienzo.paste(guardar_plato, (-X0, -Y0), guardar_plato)
lienzo.save(os.path.join(OUT, 'plato.webp'), 'WEBP', quality=86, method=6)
lienzo.resize((CW // 2, CH // 2), Image.LANCZOS).save(os.path.join(OUT, 'plato-m.webp'), 'WEBP', quality=84, method=6)

# ---------- Fresa partida suelta ----------
sel = (mitad | hojas) & (alpha > 0.05)
fa = np.dstack([im[..., :3], (alpha * sel * 255).astype(np.uint8)])
ys, xs = np.where(sel)
caja = (xs.min() - 4, ys.min() - 4, xs.max() + 5, ys.max() + 5)
fr = Image.fromarray(fa, 'RGBA').crop(caja)
fr.save(os.path.join(OUT, 'fresa-mitad.webp'), 'WEBP', quality=86, method=6)
print('capas listas; fresa suelta', fr.size, 'lienzo', (CW, CH))
