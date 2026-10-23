# Gera os icones e a tela de abertura do app Android a partir dos icones do jogo.
import os, sys
from PIL import Image, ImageDraw
raiz = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
res = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'android/app/src/main/res')
mask = Image.open(os.path.join(raiz, 'icon-maskable-512.png')).convert('RGBA')
BG = (205, 239, 219)
dens = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for d, k in dens.items():
    p = os.path.join(res, 'mipmap-' + d); os.makedirs(p, exist_ok=True)
    s = round(48 * k); f = round(108 * k)
    mask.resize((s, s), Image.LANCZOS).save(os.path.join(p, 'ic_launcher.png'))
    r = mask.resize((s, s), Image.LANCZOS); m = Image.new('L', (s, s), 0)
    ImageDraw.Draw(m).ellipse((0, 0, s - 1, s - 1), fill=255); r.putalpha(m)
    r.save(os.path.join(p, 'ic_launcher_round.png'))
    fg = Image.new('RGBA', (f, f), (0, 0, 0, 0)); inner = round(f * 0.80)
    fg.paste(mask.resize((inner, inner), Image.LANCZOS), ((f - inner) // 2, (f - inner) // 2))
    fg.save(os.path.join(p, 'ic_launcher_foreground.png'))
open(os.path.join(res, 'values/ic_launcher_background.xml'), 'w').write(
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#CDEFDB</color>\n</resources>\n')
# tela de abertura: fundo do jogo + ratinho no centro
for nome in sorted(os.listdir(res)):
    if not nome.startswith('drawable'): continue
    arq = os.path.join(res, nome, 'splash.png')
    if not os.path.exists(arq): continue
    w, h = Image.open(arq).size
    im = Image.new('RGB', (w, h), (245, 243, 239)); t = round(min(w, h) * 0.38)
    im.paste(mask.resize((t, t), Image.LANCZOS).convert('RGB'), ((w - t) // 2, (h - t) // 2))
    im.save(arq)
print('icones e splash gerados')
