#!/usr/bin/env python3
"""
tools/montage.py — folha-contato de screenshots da prova.

O limite por input do modelo é de 8 imagens; as provas do jogo geram 16+
shots. Esta ferramenta monta N screenshots numa grade única rotulada, com
recorte opcional da região que importa (o "objeto" da prova — regra do
AGENTS.md: screenshot prova o objeto, não a tela inteira com HUD).

Uso:
  python3 tools/montage.py shots/piso-*.png --cols 4 \
      --crop 240,160,800,400 --scale 0.5 --out /tmp/mont.png

  --crop L,T,W,H   recorte aplicado a cada shot antes da grade (opcional)
  --scale F        escala do recorte na grade (default 1.0)
  --cols N         colunas da grade (default 4)
  --label-size PX  altura da faixa de rótulo (default 20)
"""
import argparse
import os
import sys

from PIL import Image, ImageDraw


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('pngs', nargs='+', help='shots de entrada, na ordem da grade')
    ap.add_argument('--cols', type=int, default=4)
    ap.add_argument('--crop', default=None, help='L,T,W,H em pixels do shot original')
    ap.add_argument('--scale', type=float, default=1.0)
    ap.add_argument('--label-size', type=int, default=20)
    ap.add_argument('--out', required=True)
    args = ap.parse_args()

    crop = None
    if args.crop:
        l, t, w, h = [int(v) for v in args.crop.split(',')]
        crop = (l, t, l + w, t + h)

    cells = []
    for path in args.pngs:
        img = Image.open(path).convert('RGB')
        if crop:
            img = img.crop(crop)
        if args.scale != 1.0:
            img = img.resize((max(1, int(img.width * args.scale)),
                              max(1, int(img.height * args.scale))), Image.LANCZOS)
        cells.append((os.path.basename(path), img))

    cw = max(i.width for _, i in cells)
    ch = max(i.height for _, i in cells)
    label = args.label_size
    cols = args.cols
    rows = (len(cells) + cols - 1) // cols

    sheet = Image.new('RGB', (cols * cw, rows * (ch + label)), '#111111')
    draw = ImageDraw.Draw(sheet)
    for idx, (name, img) in enumerate(cells):
        gx = (idx % cols) * cw
        gy = (idx // cols) * (ch + label)
        draw.rectangle((gx, gy, gx + cw - 1, gy + label - 1), fill='#1c1c1c')
        draw.text((gx + 4, gy + 5), name, fill='#cccccc')
        sheet.paste(img, (gx, gy + label))

    sheet.save(args.out)
    print(f'{len(cells)} shots -> {args.out} ({sheet.width}x{sheet.height})')


if __name__ == '__main__':
    main()
