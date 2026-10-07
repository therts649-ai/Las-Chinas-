"""Render fotorrealista (Cycles) de la gelatina. Reutiliza el modelado de modelo.py.

Uso: python 3d/render.py [salida.png] [muestras] [ancho] [alto]
"""
import math
import os
import sys
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, '..', 'assets', '3d')
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'render.png')
samples = int(sys.argv[2]) if len(sys.argv) > 2 else 96
W = int(sys.argv[3]) if len(sys.argv) > 3 else 1200
H = int(sys.argv[4]) if len(sys.argv) > 4 else 800

# 1) Modelado (sin exportar)
src = open(os.path.join(HERE, 'modelo.py')).read().split('bpy.ops.export_scene.gltf')[0]
exec(compile(src, 'modelo.py', 'exec'), {'__file__': os.path.join(HERE, 'modelo.py'), '__name__': 'modelo'})


def nodes(mat):
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    outn = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], outn.inputs['Surface'])
    return nt, bsdf, outn


def image(nt, name, non_color=False, scale=(1, 1)):
    t = nt.nodes.new('ShaderNodeTexImage')
    t.image = bpy.data.images.load(os.path.join(TEX, name), check_existing=True)
    if non_color:
        t.image.colorspace_settings.name = 'Non-Color'
    if scale != (1, 1):
        m = nt.nodes.new('ShaderNodeMapping')
        m.inputs['Scale'].default_value = (scale[0], scale[1], 1)
        c = nt.nodes.new('ShaderNodeTexCoord')
        nt.links.new(c.outputs['UV'], m.inputs['Vector'])
        nt.links.new(m.outputs['Vector'], t.inputs['Vector'])
    return t


def set_in(bsdf, name, value):
    if name in bsdf.inputs:
        bsdf.inputs[name].default_value = value


# 2) Materiales físicos
def jelly(mat):
    nt, b, o = nodes(mat)
    set_in(b, 'Base Color', (1.0, 0.16, 0.22, 1))
    set_in(b, 'Transmission Weight', 1.0)
    set_in(b, 'Roughness', 0.015)
    set_in(b, 'IOR', 1.34)
    set_in(b, 'Coat Weight', 0.3)
    set_in(b, 'Coat Roughness', 0.02)
    vol = nt.nodes.new('ShaderNodeVolumeAbsorption')
    vol.inputs['Color'].default_value = (1.0, 0.08, 0.14, 1)
    vol.inputs['Density'].default_value = 1.6
    nt.links.new(vol.outputs['Volume'], o.inputs['Volume'])


def milk(mat, scale):
    nt, b, o = nodes(mat)
    t = image(nt, 'leche-color.webp', scale=scale)
    nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    set_in(b, 'Subsurface Weight', 0.75)
    set_in(b, 'Subsurface Radius', (0.6, 0.35, 0.3))
    set_in(b, 'Subsurface Scale', 0.18)
    set_in(b, 'Roughness', 0.3)
    set_in(b, 'Coat Weight', 0.35)
    set_in(b, 'Coat Roughness', 0.08)


jelly(bpy.data.materials['GelatinaFresa'])
jelly(bpy.data.materials['GelatinaFresa_corte'])
milk(bpy.data.materials['GelatinaLeche'], (1, 2.5))
milk(bpy.data.materials['GelatinaLeche_corte'], (1, 0.6))

nt, b, o = nodes(bpy.data.materials['FresaPiel'])
t = image(nt, 'fresa-color.webp')
nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
nm = nt.nodes.new('ShaderNodeNormalMap')
nn = image(nt, 'fresa-normal.webp', non_color=True)
nt.links.new(nn.outputs['Color'], nm.inputs['Color'])
nm.inputs['Strength'].default_value = 0.8
nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
set_in(b, 'Subsurface Weight', 0.35)
set_in(b, 'Subsurface Radius', (1.0, 0.15, 0.1))
set_in(b, 'Subsurface Scale', 0.02)
set_in(b, 'Roughness', 0.28)
set_in(b, 'Coat Weight', 0.5)
set_in(b, 'Coat Roughness', 0.1)

nt, b, o = nodes(bpy.data.materials['FresaCorte'])
t = image(nt, 'fresa-corte.webp')
nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
set_in(b, 'Subsurface Weight', 0.5)
set_in(b, 'Subsurface Radius', (1.0, 0.3, 0.3))
set_in(b, 'Subsurface Scale', 0.02)
set_in(b, 'Roughness', 0.35)
set_in(b, 'Coat Weight', 0.6)

nt, b, o = nodes(bpy.data.materials['Hoja'])
set_in(b, 'Base Color', (0.035, 0.16, 0.03, 1))
set_in(b, 'Roughness', 0.5)
set_in(b, 'Subsurface Weight', 0.0)
set_in(b, 'Coat Weight', 0.3)

nt, b, o = nodes(bpy.data.materials['Plato'])
set_in(b, 'Base Color', (0.95, 0.93, 0.92, 1))
set_in(b, 'Roughness', 0.1)
set_in(b, 'Coat Weight', 1.0)
set_in(b, 'Coat Roughness', 0.03)

# Con la gelatina entera, las tapas de los cortes no deben verse (solo al separar los gajos)
import bmesh as _bm
for ob in [o for o in bpy.data.objects if o.type == 'MESH' and (o.name.startswith('Fresa_') and not o.name.startswith('Fresa_entera') or o.name.startswith('Leche_'))]:
    b2 = _bm.new()
    b2.from_mesh(ob.data)
    _bm.ops.delete(b2, geom=[f for f in b2.faces if f.material_index == 1], context='FACES')
    b2.to_mesh(ob.data)
    b2.free()

# 3) Estudio: mesa y fondo curvo rosa, luces suaves, HDRI para los reflejos
import bmesh
bm = bmesh.new()
prof = [(-8, 0.0)] + [(2.5 + math.sin(a) * 2.0, 2.0 - math.cos(a) * 2.0) for a in [i / 12 * math.pi / 2 for i in range(13)]] + [(4.5, 7.0)]
row0 = [bm.verts.new((-12, x, z)) for (x, z) in prof]
row1 = [bm.verts.new((12, x, z)) for (x, z) in prof]
for i in range(len(prof) - 1):
    bm.faces.new((row0[i], row1[i], row1[i + 1], row0[i + 1]))
me = bpy.data.meshes.new('Estudio')
bm.to_mesh(me)
bm.free()
for p in me.polygons:
    p.use_smooth = True
studio = bpy.data.objects.new('Estudio', me)
bpy.context.scene.collection.objects.link(studio)
sm = bpy.data.materials.new('EstudioRosa')
nt, b, o = nodes(sm)
set_in(b, 'Base Color', (0.86, 0.42, 0.5, 1))
set_in(b, 'Roughness', 0.85)
me.materials.append(sm)

world = bpy.data.worlds.new('Mundo')
bpy.context.scene.world = world
world.use_nodes = True
wn = world.node_tree
for n in list(wn.nodes):
    wn.nodes.remove(n)
wo = wn.nodes.new('ShaderNodeOutputWorld')
env = wn.nodes.new('ShaderNodeTexEnvironment')
env.image = bpy.data.images.load(os.path.join(TEX, 'estudio.hdr'))
bg = wn.nodes.new('ShaderNodeBackground')
bg.inputs['Strength'].default_value = 0.35
wn.links.new(env.outputs['Color'], bg.inputs['Color'])
wn.links.new(bg.outputs['Background'], wo.inputs['Surface'])


def area(name, loc, rot, size, power, color=(1, 1, 1)):
    l = bpy.data.lights.new(name, 'AREA')
    l.size = size
    l.energy = power
    l.color = color
    ob = bpy.data.objects.new(name, l)
    ob.location = loc
    ob.rotation_euler = rot
    bpy.context.scene.collection.objects.link(ob)


area('Principal', (-3.5, -3.0, 4.0), (math.radians(50), 0, math.radians(-50)), 3.5, 420, (1.0, 0.96, 0.92))
area('Relleno', (4.0, -3.0, 1.5), (math.radians(75), 0, math.radians(55)), 3.0, 110, (1.0, 0.9, 0.92))
area('Contraluz', (1.5, 4.0, 3.0), (math.radians(-60), 0, math.radians(160)), 2.0, 450, (1.0, 0.85, 0.9))

cam_data = bpy.data.cameras.new('Camara')
cam_data.lens = 60
cam_data.dof.use_dof = True
cam_data.dof.aperture_fstop = 4.0
cam = bpy.data.objects.new('Camara', cam_data)
bpy.context.scene.collection.objects.link(cam)
cam.location = (0, -5.6, 2.05)
target = bpy.data.objects.new('Mira', None)
target.location = (0, 0, 0.42)
bpy.context.scene.collection.objects.link(target)
cam_data.dof.focus_object = target
c = cam.constraints.new('TRACK_TO')
c.target = target
c.track_axis = 'TRACK_NEGATIVE_Z'
c.up_axis = 'UP_Y'
bpy.context.scene.camera = cam

sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = samples
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 16
sc.cycles.transmission_bounces = 16
sc.cycles.transparent_max_bounces = 16
sc.cycles.volume_bounces = 2
sc.cycles.caustics_refractive = False
sc.cycles.caustics_reflective = False
sc.render.resolution_x = W
sc.render.resolution_y = H
sc.render.film_transparent = False
sc.view_settings.view_transform = 'AgX'
sc.view_settings.look = 'AgX - Medium High Contrast'
sc.render.image_settings.file_format = 'PNG'
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print('render listo:', out)
