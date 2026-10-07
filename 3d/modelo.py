"""Modela la gelatina de fresa con leche en Blender y la exporta a GLB.

Uso: python 3d/modelo.py   (con el módulo bpy de Blender instalado)
Salida: assets/3d/gelatina.glb

Escena (unidades: radio exterior de la gelatina = 1):
- 8 gajos de gelatina de fresa (Fresa_0..7) y 8 de leche (Leche_0..7)
- 2 mitades de fresa dentro de cada gajo rojo (MitadFresa_k_j, hijas del gajo)
- 3 fresas enteras con hojas (Fresa_entera_0..2) y el plato (Plato)
Los materiales solo llevan nombre; el color y la translucidez se ajustan en la web.
"""
import math
import os
import bpy
import bmesh

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', '3d', 'gelatina.glb')

RI, RO, YS = 0.30, 1.0, 0.32          # radio interior, exterior y altura de la capa de leche
FLUTES, WEDGES = 16, 8
PLATE_Y = 0.035


def to_bl(x, y, z):
    """Coordenadas de la web (Y arriba) a Blender (Z arriba)."""
    return (x, -z, y)


def flute(theta, r):
    k = min(max((r - RI) / (RO - RI), 0.0), 1.0)
    k = k * k * (3 - 2 * k)
    return 1 + 0.06 * math.cos(FLUTES * theta) * k


def profile_bottom():
    pts = [(RI + 0.04, 0.0), (RO - 0.05, 0.0)]
    for i in range(1, 6):  # esquina redondeada inferior
        a = -math.pi / 2 + i / 6 * math.pi / 2
        pts.append((RO - 0.05 + 0.05 * math.cos(a), 0.05 + 0.05 * math.sin(a)))
    pts += [(RO, 0.05), (RO - 0.01, YS), (RI + 0.01, YS), (RI, 0.05)]
    for i in range(1, 6):
        a = math.pi + i / 6 * math.pi / 2
        pts.append((RI + 0.04 + 0.04 * math.cos(a), 0.04 + 0.04 * math.sin(a)))
    return pts


def profile_top():
    pts = [(RI + 0.01, YS), (RO - 0.01, YS)]
    for i in range(0, 25):
        t = i / 24 * math.pi
        pts.append((0.65 + 0.35 * math.cos(t), YS + 0.06 + 0.42 * math.sin(t)))
    return pts


def new_obj(name, me, parent=None):
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if parent:
        ob.parent = parent
    return ob


def smooth(me, angle=0.75):
    for p in me.polygons:
        p.use_smooth = True
    if hasattr(me, 'set_sharp_from_angle'):
        me.set_sharp_from_angle(angle=angle)


def lathe_wedge(name, profile, phi0, phi1, steps, mat, v_scale=1.0):
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('UVMap')
    n = len(profile)
    # longitud acumulada del perfil para la coordenada v
    acc = [0.0]
    for i in range(1, n + 1):
        a, b = profile[i - 1], profile[i % n]
        acc.append(acc[-1] + math.dist(a, b))
    total = acc[-1]
    rings = []
    for j in range(steps + 1):
        th = phi0 + (phi1 - phi0) * j / steps
        ring = []
        for (r, y) in profile:
            rr = r * flute(th, r)
            ring.append(bm.verts.new(to_bl(rr * math.sin(th), y, rr * math.cos(th))))
        rings.append(ring)
    bm.verts.ensure_lookup_table()
    for j in range(steps):
        for i in range(n):
            i2 = (i + 1) % n
            f = bm.faces.new((rings[j][i], rings[j + 1][i], rings[j + 1][i2], rings[j][i2]))
            for loop, (jj, ii) in zip(f.loops, ((j, i), (j + 1, i), (j + 1, i2 if i2 else n), (j, i2 if i2 else n))):
                th = phi0 + (phi1 - phi0) * jj / steps
                loop[uv].uv = (th / (2 * math.pi) * WEDGES, acc[ii] / total * v_scale)
    # Tapas planas en los dos cortes (se ven al separar los gajos)
    caps = []
    for ring, flip in ((rings[0], True), (rings[-1], False)):
        verts = list(reversed(ring)) if flip else ring
        f = bm.faces.new(verts)
        caps.append(f)
        for loop in f.loops:
            co = loop.vert.co
            r = math.hypot(co.x, co.y)
            loop[uv].uv = ((r - RI) / (RO - RI), co.z / 0.82)
        f.material_index = 1
    bmesh.ops.triangulate(bm, faces=caps)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    me.materials.append(bpy.data.materials.get(mat.name + '_corte') or bpy.data.materials.new(mat.name + '_corte'))
    smooth(me)
    return new_obj(name, me)


def strawberry_mesh(name, height=0.30, radius=0.12, half=False, rings=26, segs=40):
    """Fresa con forma real: punta redondeada, hombros anchos. Si half=True se corta a la mitad."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('UVMap')
    grid = []
    for i in range(rings + 1):
        t = i / rings  # 0 = punta, 1 = arriba
        # cónica: punta redondeada abajo, lo más ancho cerca de los hombros, tapa redondeada arriba
        r = radius * (t ** 0.58) * (1 - 0.85 * max(0.0, (t - 0.8) / 0.2) ** 2.2)
        r *= 1 - 0.55 * max(0.0, 0.06 - t) / 0.06
        y = -height / 2 + t * height
        row = []
        for j in range(segs + 1):
            a = j / segs * 2 * math.pi
            bump = 1 + 0.025 * math.sin(a * 5 + t * 7)
            row.append(bm.verts.new(to_bl(r * bump * math.sin(a), y, r * bump * math.cos(a))))
        grid.append(row)
    for i in range(rings):
        for j in range(segs):
            f = bm.faces.new((grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]))
            for loop, (ii, jj) in zip(f.loops, ((i, j), (i, j + 1), (i + 1, j + 1), (i + 1, j))):
                loop[uv].uv = (jj / segs * 3, ii / rings)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    if half:
        # Cortar por el plano que pasa por el eje y rellenar la cara del corte
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        res = bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, 0, 0), plane_no=(0, 1, 0), clear_outer=True)
        edges = [e for e in res['geom_cut'] if isinstance(e, bmesh.types.BMEdge)]
        filled = bmesh.ops.edgeloop_fill(bm, edges=edges)
        cap = filled['faces']
        bmesh.ops.triangulate(bm, faces=cap)
        cap = [f for f in bm.faces if all(abs(v.co.y) < 1e-4 for v in f.verts)]
        for f in cap:
            f.material_index = 1
            for loop in f.loops:
                co = loop.vert.co
                loop[uv].uv = (0.5 + co.x / (radius * 2.3), 0.5 + co.z / (height * 1.15))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat_fresa_piel)
    me.materials.append(mat_fresa_corte)
    smooth(me, 1.0)
    return me


def sepals_mesh(name, radius=0.12, height=0.30):
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('UVMap')
    top = height / 2 - 0.01
    for k in range(6):
        a = k / 6 * 2 * math.pi
        pts = []
        for s, w in ((0.0, 0.012), (0.25, 0.03), (0.55, 0.032), (0.8, 0.02), (1.0, 0.0)):
            L = radius * 1.15 * s
            droop = -0.07 * s * s + 0.01 * s
            pts.append((L, droop, w))
        verts = []
        for (L, dy, w) in pts:
            for side in (-1, 1):
                x, z = L * math.sin(a) + side * w * math.cos(a), L * math.cos(a) - side * w * math.sin(a)
                verts.append(bm.verts.new(to_bl(x, top + dy, z)))
        for i in range(len(pts) - 1):
            f = bm.faces.new((verts[i * 2], verts[i * 2 + 1], verts[i * 2 + 3], verts[i * 2 + 2]))
            for loop in f.loops:
                loop[uv].uv = (0.5, i / (len(pts) - 1))
    # tallito
    stem = bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=0.012, radius2=0.008, depth=0.06)
    bmesh.ops.translate(bm, verts=stem['verts'], vec=to_bl(0, top + 0.03, 0))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat_hoja)
    smooth(me, 1.2)
    return me


# ---------- Escena ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
mat_fresa_gel = bpy.data.materials.new('GelatinaFresa')
mat_leche = bpy.data.materials.new('GelatinaLeche')
mat_fresa_piel = bpy.data.materials.new('FresaPiel')
mat_fresa_corte = bpy.data.materials.new('FresaCorte')
mat_hoja = bpy.data.materials.new('Hoja')
mat_plato = bpy.data.materials.new('Plato')
bpy.data.materials.new('GelatinaFresa_corte')
bpy.data.materials.new('GelatinaLeche_corte')

root = bpy.data.objects.new('Gelatina', None)
bpy.context.scene.collection.objects.link(root)
root.location = to_bl(0, PLATE_Y, 0)

half_me = strawberry_mesh('MitadFresa', height=0.36, radius=0.135, half=True)
STEP = 2 * math.pi / WEDGES
chunk_me = strawberry_mesh('TrozoFresa', height=0.36, radius=0.14, half=True)
for k in range(WEDGES):
    phi0 = math.pi / FLUTES + k * STEP
    for name, prof, mat in (('Leche', profile_bottom(), mat_leche), ('Fresa', profile_top(), mat_fresa_gel)):
        ob = lathe_wedge(f'{name}_{k}', prof, phi0, phi0 + STEP, 36, mat)
        ob.parent = root
        if name == 'Leche':
            # Trozos de fresa dentro de la leche, asomándose por la pared
            import random
            rnd = random.Random(k)
            for j in range(5):
                th = phi0 + STEP * (0.1 + 0.8 * rnd.random())
                y = 0.08 + 0.18 * rnd.random()
                ch = new_obj(f'TrozoFresa_{k}_{j}', chunk_me, ob)
                # la cara del corte queda al ras de la pared, mirando hacia afuera
                rr = (RO - 0.006) * flute(th, RO) - 0.004
                ch.location = to_bl(math.sin(th) * rr, y, math.cos(th) * rr)
                ch.rotation_mode = 'XYZ'  # primero gira sobre su propio corte (Y), luego se orienta (Z)
                ch.rotation_euler = (0.0, rnd.uniform(-0.9, 0.9), math.pi + th)
                sc = 0.42 + 0.22 * rnd.random()
                ch.scale = (sc, sc, sc)
        if name == 'Fresa':
            # Dos mitades de fresa pegadas a la pared exterior, sobre las crestas
            for j, th in enumerate((phi0 + math.pi / FLUTES, phi0 + 3 * math.pi / FLUTES)):
                h = new_obj(f'MitadFresa_{k}_{j}', half_me, ob)
                h.location = to_bl(math.sin(th) * 0.87, YS + 0.17, math.cos(th) * 0.87)
                # la cara del corte mira hacia afuera; la punta hacia abajo
                h.rotation_euler = (0.0, 0.0, math.pi + th)
                h.rotation_mode = 'XYZ'
                h.scale = (1.0, 1.0, 1.0)

whole_me = strawberry_mesh('Fresa', height=0.40, radius=0.16)
sep_me = sepals_mesh('Hojas', radius=0.16, height=0.40)
for i, (ang, dist, tilt) in enumerate(((0.55, 1.22, 1.3), (0.85, 1.3, 1.45), (-0.75, 1.24, 1.25))):
    f = new_obj(f'Fresa_entera_{i}', whole_me)
    f.location = to_bl(math.sin(ang) * dist, 0.15, math.cos(ang) * dist)
    f.rotation_euler = (tilt, 0.3 * i, ang)
    s = new_obj(f'Hojas_{i}', sep_me, f)

plate_prof = [(0.0, 0.0), (1.15, 0.0), (1.3, 0.012), (1.42, 0.06), (1.48, 0.095), (1.46, 0.11), (1.40, 0.10), (1.28, 0.055), (1.12, PLATE_Y), (0.0, PLATE_Y)]
bm = bmesh.new()
rings = []
for j in range(97):
    th = j / 96 * 2 * math.pi
    rings.append([bm.verts.new(to_bl(r * math.sin(th), y, r * math.cos(th))) for r, y in plate_prof])
for j in range(96):
    for i in range(len(plate_prof) - 1):
        bm.faces.new((rings[j][i], rings[j + 1][i], rings[j + 1][i + 1], rings[j][i + 1]))
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
pm = bpy.data.meshes.new('Plato')
bm.to_mesh(pm)
bm.free()
pm.materials.append(mat_plato)
smooth(pm, 0.9)
new_obj('Plato', pm)

bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True,
                          export_materials='PLACEHOLDER' if False else 'EXPORT', export_image_format='NONE')
print('GLB exportado:', OUT, os.path.getsize(OUT) // 1024, 'KB')
