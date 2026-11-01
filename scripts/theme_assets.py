#!/usr/bin/env python3
"""
Regenerates src/assets/images/themed/* from the ORIGINAL artwork in
src/assets/images/ (which is never modified).

What it does
  * Re-maps the green/teal hue family to the app's blue (hue ~221 deg, the
    theme primary #2563EB). Whites, greys, reds, yellows and existing blues are
    left alone, and the mapping is monotonic so gradients/shadows keep their order.
  * logo.jpeg: white background, cropped, 512px.
  * dashboardHero: repairs the dark rounded corners baked into the source file.
  * Resizes to the sizes the UI needs and saves optimised JPEG/PNG.

Usage:   python3 scripts/theme_assets.py [output_dir]
Needs:   pip install pillow numpy scipy scikit-image
"""
import os, sys
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))

import numpy as np
from PIL import Image
from skimage.color import rgb2hsv, hsv2rgb

# hue anchors in degrees: source -> target (piecewise linear, identity outside)
HUE_SRC=[0,62,82,190,225,360]
HUE_DST=[0,62,208,221,225,360]   # green/teal family -> theme blue (hue ~221); monotonic so gradients keep their order

def _smooth(x,a,b):
    t=np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)

def recolor(rgb, v_gamma=0.68, lift=0.02, sat_scale=1.0):
    """rgb: float array HxWx3 in 0..1. Returns recoloured float array."""
    hsv=rgb2hsv(rgb)
    h=hsv[...,0]*360.0; s=hsv[...,1]; v=hsv[...,2]
    new_h=np.interp(h,HUE_SRC,HUE_DST)
    w=_smooth(s,0.015,0.07)            # leave neutrals/whites alone
    inband=((h>=62)&(h<=225)).astype(float)
    w=w*inband
    h2=h*(1-w)+new_h*w
    # brighten shifted pixels a little: blue reads darker than green at equal V
    vv=v**v_gamma
    v2=v*(1-w)+np.clip(vv+lift,0,1)*w
    s2=np.clip(s*(1-w)+np.clip(s*sat_scale,0,1)*w,0,1)
    out=hsv2rgb(np.stack([(h2%360)/360.0,s2,v2],axis=-1))
    return np.clip(out,0,1)

def load_rgba(p):
    return Image.open(p).convert('RGBA')

def recolor_image(im, **kw):
    arr=np.asarray(im).astype(np.float32)/255.0
    rgb=recolor(arr[...,:3],**kw)
    out=np.concatenate([rgb,arr[...,3:4]],axis=-1)
    return Image.fromarray((out*255+0.5).astype(np.uint8),'RGBA')

# ---------------------------------------------------------------- build
from scipy import ndimage as ndi
SRC=os.path.join(ROOT,'src','assets','images')+os.sep
OUT=(sys.argv[1] if len(sys.argv)>1 else os.path.join(ROOT,'src','assets','images','themed'))+os.sep
os.makedirs(OUT,exist_ok=True)


def to_white(im):
    bg=Image.new('RGBA',im.size,(255,255,255,255)); bg.alpha_composite(im); return bg.convert('RGB')

# ---------- logo: recolour + transparent background (white petals inside stay opaque)
im=load_rgba(SRC+'logo.png'); im=recolor_image(im)
a=np.asarray(im).astype(np.float32)
rgb=a[...,:3]
near_white=(rgb.min(axis=-1)>=246)
lab,n=ndi.label(near_white)
border_labels=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
outer=np.isin(lab,list(border_labels))
ring=ndi.binary_dilation(outer,iterations=3)&~outer
alpha=np.full(outer.shape,255.0); alpha[outer]=0
# anti-aliased edge: colour-to-alpha against white on the thin ring
mn=rgb.min(axis=-1)
ring_alpha=np.clip((255-mn)/(255-60.0),0,1)
alpha[ring]=ring_alpha[ring]*255
al=np.clip(alpha/255.0,1e-3,1)[...,None]
rgb_un=np.where(ring[...,None],np.clip((rgb-255*(1-al))/al,0,255),rgb)
out=np.concatenate([rgb_un,alpha[...,None]],axis=-1).astype(np.uint8)
logo=Image.fromarray(out,'RGBA')
bb=logo.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
pad=int(0.04*max(bb[2]-bb[0],bb[3]-bb[1]))
bb=(max(0,bb[0]-pad),max(0,bb[1]-pad),min(logo.width,bb[2]+pad),min(logo.height,bb[3]+pad))
logo=logo.crop(bb); logo.thumbnail((512,512),Image.LANCZOS)
logo=to_white(logo)
logo.save(OUT+'logo.jpeg',quality=95,optimize=True,subsampling=0)

# ---------- loginHero (photo-like, opaque) -> JPEG
im=recolor_image(load_rgba(SRC+'loginHero.png')); im=to_white(im); im.thumbnail((640,640),Image.LANCZOS)
im.save(OUT+'loginHero.jpg',quality=90,optimize=True,subsampling=0)

# ---------- dashboardHero: repair baked dark corners, recolour, resize
im=Image.open(SRC+'dashboardHero.png').convert('RGB'); arr=np.asarray(im).copy()
lum=arr.astype(float).mean(axis=-1); H,W=lum.shape; mask=np.zeros((H,W),bool); R=90
for ys,xs in [(slice(0,R),slice(0,R)),(slice(0,R),slice(W-R,W)),(slice(H-R,H),slice(0,R)),(slice(H-R,H),slice(W-R,W))]:
    sub=(lum[ys,xs]<190); mask[ys,xs]=sub
mask=ndi.binary_dilation(mask,iterations=3)
idx=ndi.distance_transform_edt(mask,return_distances=False,return_indices=True)
arr[mask]=arr[tuple(i[mask] for i in idx)]
im=Image.fromarray(arr); im=recolor_image(im.convert('RGBA')).convert('RGB'); im.thumbnail((1200,1200),Image.LANCZOS)
im.save(OUT+'dashboardHero.jpg',quality=90,optimize=True,subsampling=0)

# ---------- illustrations (white background, opaque) -> JPEG
for name,ext in [('otpIllustration','png'),('changePasswordIllustration','jpeg'),('successIllustration','jpeg')]:
    im=recolor_image(load_rgba(SRC+f'{name}.{ext}')); im=to_white(im); im.thumbnail((900,900),Image.LANCZOS)
    im.save(OUT+f'{name}.jpg',quality=92,optimize=True,subsampling=0)

# ---------- healthLogo: recolour (light theme) + lighter variant (dark theme)
im=load_rgba(SRC+'healthLogo.png'); bb=im.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
im=im.crop(bb); im.thumbnail((640,640),Image.LANCZOS)
light=recolor_image(im); light.save(OUT+'healthLogo.png',optimize=True)
arr=np.asarray(light).astype(np.float32)/255.0
hsv=rgb2hsv(arr[...,:3]); hsv[...,1]=np.minimum(hsv[...,1],0.55); hsv[...,2]=0.72+0.28*hsv[...,2]
dark=np.concatenate([hsv2rgb(hsv),arr[...,3:4]],axis=-1)
Image.fromarray((dark*255+0.5).astype(np.uint8),'RGBA').save(OUT+'healthLogoDark.png',optimize=True)

for f in sorted(os.listdir(OUT)): print(f, os.path.getsize(OUT+f)//1024,'KB', Image.open(OUT+f).size)

# ---------- loginHeroFade: login photo whose left/bottom/top/right edges fade to
# transparent, so it dissolves into the screen background in light AND dark mode
# (the reference design does this with SVG gradients; this needs no extra library).
im=Image.open(OUT+'loginHero.jpg').convert('RGB').resize((512,512),Image.LANCZOS)
a=np.asarray(im).astype(np.float32); H,W,_=a.shape
x=np.linspace(0,1,W)[None,:].repeat(H,0); y=np.linspace(0,1,H)[:,None].repeat(W,1)
def _s(t): t=np.clip(t,0,1); return t*t*(3-2*t)
alpha=(_s(x/0.55)*_s((1-y)/0.35)*_s(y/0.22)*_s((1-x)/0.14)*255).astype(np.uint8)
Image.fromarray(np.dstack([a.astype(np.uint8),alpha]),'RGBA').save(OUT+'loginHeroFade.png',optimize=True)
print('loginHeroFade.png', os.path.getsize(OUT+'loginHeroFade.png')//1024,'KB')
