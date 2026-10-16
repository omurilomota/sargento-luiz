#!/usr/bin/env python3
"""
tools/medir.py — medição de PNG: o instrumento MENOR das dúvidas visuais.

Não substitui olho (ninguém aqui tem olho para dizer "ficou bonito"), mas
responde com número o que é objetivo:

  - onde o objeto está dentro do tile (bbox/centroide) -> pivô e proporção
  - o tile é preenchimento chapado? (cobertura de alfa + borda vs miolo)
  - dois tiles são visualmente iguais? (distância de histograma)
  - o tile emenda sem costura? (faixa da borda oposta)
  - como é a silhueta? (mapa ASCII: forma e luz)

Uso:
  python3 tools/medir.py img.png [mais.png ...]        # relatório por imagem
  python3 tools/medir.py --ascii 60 24 img.png         # silhueta maior
  python3 tools/medir.py --par a.png b.png             # compara dois
  python3 tools/medir.py --matriz *.png                # matriz de distância
  python3 tools/medir.py --recorte L,T,W,H shot.png    # medir região do shot
"""
import argparse
import os
import sys

from PIL import Image

# rampa de luminância: claro = espaço, escuro = mais tinta
RAMP_LUM = " .:-=+*#%@"
RAMP_DENS = " .:-=+*#%@"
LIMIAR_OPACO = 128
BAIXO, ALTO = 0, 255


def lum(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def carregar(path: str, recorte=None):
    img = Image.open(path).convert("RGBA")
    if recorte:
        l, t, w, h = recorte
        img = img.crop((l, t, l + w, t + h))
    return img


def opacos(img):
    """Lista (x, y, lum) dos pixels opacos — a única coisa que se mede."""
    w, h = img.size
    px = img.load()
    out = []
    for y in range(h):
        for x in range(w):
            a = px[x, y][3]
            if a >= LIMIAR_OPACO:
                r, g, b = px[x, y][0], px[x, y][1], px[x, y][2]
                out.append((x, y, lum(r, g, b), r, g, b))
    return out


def bbox(ops):
    xs = [p[0] for p in ops]
    ys = [p[1] for p in ops]
    return min(xs), min(ys), max(xs), max(ys)


def borda_miolo(img, ops, faixa=0.08):
    """Luminância da borda do bbox vs a do miolo (50% central).

    Delta pequeno com cobertura alta = preenchimento chapado, sem textura.
    """
    x0, y0, x1, y1 = bbox(ops)
    bw = max(1, int((x1 - x0 + 1) * faixa))
    bh = max(1, int((y1 - y0 + 1) * faixa))
    cx0, cy0 = x0 + (x1 - x0 + 1) // 4, y0 + (y1 - y0 + 1) // 4
    cx1, cy1 = x1 - (x1 - x0 + 1) // 4, y1 - (y1 - y0 + 1) // 4
    bei, me = [], []
    for x, y, l, *_ in ops:
        na_borda = x < x0 + bw or x > x1 - bw or y < y0 + bh or y > y1 - bh
        no_miolo = cx0 <= x <= cx1 and cy0 <= y <= cy1
        if na_borda and not no_miolo:
            bei.append(l)
        elif no_miolo:
            me.append(l)
    if not bei or not me:
        return None, None, None
    return sum(bei) / len(bei), sum(me) / len(me), sum(bei) / len(bei) - sum(me) / len(me)


def top_cores(ops, n=4, passos=32):
    """Bin de 32: bin de 64 colapsa imagem escura (média 37) num único balde
    e a saída passava a mentir "98% de uma cor" num shot com 3113 cores."""
    bins = {}
    for _, _, _, r, g, b in ops:
        k = (min(passos - 1, r * passos // 256), min(passos - 1, g * passos // 256),
             min(passos - 1, b * passos // 256))
        bins[k] = bins.get(k, 0) + 1
    total = sum(bins.values()) or 1
    ordenados = sorted(bins.items(), key=lambda kv: -kv[1])[:n]
    return [(tuple(v * 256 // passos + 128 // passos for v in k), c / total) for k, c in ordenados]


def sat_media(ops):
    if not ops:
        return 0.0
    s = 0.0
    for _, _, _, r, g, b in ops:
        mx, mn = max(r, g, b), min(r, g, b)
        s += 0.0 if mx == 0 else (mx - mn) / mx
    return s / len(ops)


def histograma(ops, bins=6):
    h = {}
    for _, _, _, r, g, b in ops:
        k = (min(bins - 1, r * bins // 256), min(bins - 1, g * bins // 256), min(bins - 1, b * bins // 256))
        h[k] = h.get(k, 0) + 1
    total = sum(h.values()) or 1
    return {k: v / total for k, v in h.items()}


def dist_hist(h1, h2, bins=6):
    """Distância L1 normalizada: 0 = idêntico, 1 = nada em comum."""
    chaves = set(h1) | set(h2)
    return 0.5 * sum(abs(h1.get(k, 0.0) - h2.get(k, 0.0)) for k in chaves)


def costura(img, faixa=0.06):
    """Diff de luminância entre as faixas que ficam vizinhas no tile.

    Direita↔esquerda e baixo↔cima: é a fronteira que o tile cria quando
    emenda. Diff alto = costura visível.
    """
    w, h = img.size
    px = img.load()
    kx = max(1, int(w * faixa))
    ky = max(1, int(h * faixa))

    def col_media(x):
        vals = [lum(*px[x, y][:3]) for y in range(h) if px[x, y][3] >= LIMIAR_OPACO]
        return sum(vals) / len(vals) if vals else None

    def lin_media(y):
        vals = [lum(*px[x, y][:3]) for x in range(w) if px[x, y][3] >= LIMIAR_OPACO]
        return sum(vals) / len(vals) if vals else None

    res = {}
    for nome, a, b in (("dir-esq", [w - 1 - i for i in range(kx)], [i for i in range(kx)]),
                       ("baixo-cima", [h - 1 - i for i in range(ky)], [i for i in range(ky)])):
        diffs = []
        if nome == "dir-esq":
            for ya, yb in zip([h - 1 - i for i in range(ky)], range(ky)):
                pass
            for i, j in zip(a, b):
                # colisão vertical: coluna i e coluna j ficam lado a lado
                va = [lum(*px[i, y][:3]) for y in range(h) if px[i, y][3] >= LIMIAR_OPACO and px[j, y][3] >= LIMIAR_OPACO]
                vb = [lum(*px[j, y][:3]) for y in range(h) if px[i, y][3] >= LIMIAR_OPACO and px[j, y][3] >= LIMIAR_OPACO]
                if va and vb:
                    diffs.append(abs(sum(v - u for v, u in zip(vb, va)) / len(va)))
        else:
            for i, j in zip(a, b):
                va = [lum(*px[x, i][:3]) for x in range(w) if px[x, i][3] >= LIMIAR_OPACO and px[x, j][3] >= LIMIAR_OPACO]
                vb = [lum(*px[x, j][:3]) for x in range(w) if px[x, i][3] >= LIMIAR_OPACO and px[x, j][3] >= LIMIAR_OPACO]
                if va and vb:
                    diffs.append(abs(sum(v - u for v, u in zip(vb, va)) / len(va)))
        res[nome] = sum(diffs) / len(diffs) if diffs else None
    return res


def perfil(img):
    """Contagem de opacos por coluna e por linha: acha o eixo do cano e o
    centro da base sem depender de silhueta."""
    w, h = img.size
    px = img.load()
    cols_, rows_ = [], []
    for x in range(w):
        c = sum(1 for y in range(h) if px[x, y][3] >= LIMIAR_OPACO)
        cols_.append(c)
    for y in range(h):
        c = sum(1 for x in range(w) if px[x, y][3] >= LIMIAR_OPACO)
        rows_.append(c)

    def pico(vs):
        return vs.index(max(vs)) if vs else -1

    def barra(vs):
        mx = max(vs) or 1
        return "".join(str(min(9, int(v * 9 / mx))) for v in vs)

    return cols_, rows_, pico(cols_), pico(rows_), barra(cols_), barra(rows_)


def _amostra(img):
    px = img.load()
    w, h = img.size
    for y in range(0, h, 3):
        for x in range(0, w, 3):
            yield px[x, y]


def silhueta(img, cols=40, rows=20):
    """Dois mapas ASCII: FORMA (densidade de alfa) e LUZ (luminância relativa
    ao mínimo/máximo do próprio sprite — o que importa é o contraste interno,
    não a faixa absoluta)."""
    global BAIXO, ALTO
    px = img.load()
    lums = [0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2] for p in _amostra(img)]
    BAIXO, ALTO = min(lums), max(lums)
    w, h = img.size
    px = img.load()
    forma, luz = [], []
    for ry in range(rows):
        y0 = ry * h // rows
        y1 = max(y0 + 1, (ry + 1) * h // rows)
        lf, ll = "", ""
        for rx in range(cols):
            x0, x1 = rx * w // cols, max(rx * w // cols + 1, (rx + 1) * w // cols)
            tot = op = 0
            sl = 0
            for y in range(y0, y1):
                for x in range(x0, x1):
                    tot += 1
                    if px[x, y][3] >= LIMIAR_OPACO:
                        op += 1
                        sl += lum(*px[x, y][:3])
            dens = op / tot if tot else 0
            lf += RAMP_DENS[min(len(RAMP_DENS) - 1, int(dens * (len(RAMP_DENS) - 1) + 0.5))]
            if op >= tot * 0.5:
                m = sl / op
                # contraste relativo: rampa absoluta (255-lum) achatava imagem
                # escura num bloco único de '='
                idx = int((ALTO - m) / max(1.0, ALTO - BAIXO) * (len(RAMP_LUM) - 1) + 0.5)
                ll += RAMP_LUM[max(0, min(len(RAMP_LUM) - 1, idx))]
            else:
                ll += " "
        forma.append(lf)
        luz.append(ll)
    return forma, luz


def tem_transparencia(img):
    px = img.load()
    w, h = img.size
    for y in range(0, h, 7):
        for x in range(0, w, 7):
            if px[x, y][3] < 250:
                return True
    return False


def medir(path, recorte=None, ascii_cols=40, ascii_rows=20, mostrar_ascii=True, mostrar_perfil=False):
    img = carregar(path, recorte)
    w, h = img.size
    ops = opacos(img)
    tem_alpha = tem_transparencia(img)
    cov = len(ops) / (w * h)
    linhas = [f"== {os.path.basename(path)}  {w}x{h}  opacos {cov * 100:.0f}%"]
    if not ops:
        linhas.append("   sem pixel opaco")
        return "\n".join(linhas), None

    x0, y0, x1, y1 = bbox(ops)
    cx = sum(p[0] for p in ops) / len(ops)
    cy = sum(p[1] for p in ops) / len(ops)
    linhas.append(
        f"   bbox {x1 - x0 + 1}x{y1 - y0 + 1} em ({x0},{y0})-({x1},{y1})  "
        f"margens e{ x0 } d{ w - 1 - x1 } t{ y0 } b{ h - 1 - y1 }"
    )
    linhas.append(
        f"   centroide ({cx:.1f},{cy:.1f}) = ({cx / w * 100:.0f}%,{cy / h * 100:.0f}%) do tile"
    )
    lm = sum(p[2] for p in ops) / len(ops)
    var = sum((p[2] - lm) ** 2 for p in ops) / len(ops)
    be, me, delta = borda_miolo(img, ops)
    linhas.append(f"   lum média {lm:.0f} (desvio {var ** 0.5:.0f})  saturação {sat_media(ops) * 100:.0f}%")
    if delta is not None:
        linhas.append(f"   lum borda {be:.0f} vs miolo {me:.0f}  delta {delta:+.0f}")
        # o veredito de preenchimento chapado é de TILE (tem alfa); screenshot
        # não tem transparência e imagem escura sempre parece "chata" no delta
        if tem_alpha and cov >= 0.85 and abs(delta) <= 6:
            linhas.append("   >>> PAPEL CHAPADO: cobertura alta e sem textura")
    cores = top_cores(ops)
    linhas.append("   top cores: " + "  ".join(f"#{r:02x}{g:02x}{b:02x} {p * 100:.0f}%" for (r, g, b), p in cores))
    txt = "\n".join(linhas)

    if mostrar_perfil:
        cols_, rows_, pcol, plin, bcol, brow = perfil(img)
        txt += (
            f"\n   PERFIL colunas ({w}px, pico em x={pcol}): {bcol}"
            f"\n   PERFIL linhas   ({h}px, pico em y={plin}): {brow}"
        )

    if mostrar_ascii:
        forma, luzm = silhueta(img, ascii_cols, ascii_rows)
        txt += "\n   FORMA (densidade)\n" + "\n".join("   " + l for l in forma)
        txt += "\n   LUZ (escuro = mais tinta)\n" + "\n".join("   " + l for l in luzm)
    return txt, histograma(ops)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pngs", nargs="+")
    ap.add_argument("--ascii", nargs=2, type=int, default=[40, 20], metavar=("COLS", "ROWS"))
    ap.add_argument("--par", action="store_true", help="compara os dois primeiros arquivos")
    ap.add_argument("--matriz", action="store_true", help="matriz de distância de histograma")
    ap.add_argument("--sem-ascii", action="store_true")
    ap.add_argument("--perfil", action="store_true", help="contagem de opacos por coluna e por linha")
    ap.add_argument("--recorte", default=None, help="L,T,W,H aplicado antes de medir")
    ap.add_argument("--limiar", type=float, default=8.0, help="% abaixo do qual dois tiles são 'iguais'")
    a = ap.parse_args()

    recorte = tuple(int(v) for v in a.recorte.split(",")) if a.recorte else None
    cols, rows = a.ascii

    if a.par:
        if len(a.pngs) != 2:
            print("--par quer exatamente 2 arquivos")
            sys.exit(1)
        hists = []
        for p in a.pngs:
            _, hh = medir(p, recorte, cols, rows, not a.sem_ascii, a.perfil)
            print()
            hists.append(hh)
        if hists[0] and hists[1]:
            d = dist_hist(hists[0], hists[1]) * 100
            print(f"\n== DISTÂNCIA DE HISTOGRAMA: {d:.1f}%")
            print("   <8% praticamente iguais · 8-20% mesma família · >20% distintos")
        c1, c2 = costura(carregar(a.pngs[0], recorte)), costura(carregar(a.pngs[1], recorte))
        for nome, c in zip([os.path.basename(p) for p in a.pngs], (c1, c2)):
            vs = "  ".join(f"{k} {v:.0f}" if v is not None else f"{k} n/a" for k, v in c.items())
            print(f"   costura {nome}: {vs}")
        return

    if a.matriz:
        nomes, hists = [], []
        for p in a.pngs:
            _, hh = medir(p, recorte, cols, rows, False, False)
            nomes.append(os.path.splitext(os.path.basename(p))[0])
            hists.append(hh)
        print("\n== MATRIZ DE DISTÂNCIA (%)")
        larg = max(len(n) for n in nomes)
        print(" " * (larg + 2) + "".join(f"{n[:8]:>9}" for n in nomes))
        for i, ni in enumerate(nomes):
            cells = []
            for j, nj in enumerate(nomes):
                if hists[i] is None or hists[j] is None:
                    cells.append("      n/a")
                    continue
                cells.append(f"{dist_hist(hists[i], hists[j]) * 100:9.1f}")
            print(f"{ni:<{larg}}  " + "".join(cells))
        print(f"\n   pares abaixo de {a.limiar:.0f}% (indistinguíveis):")
        achou = False
        for i in range(len(nomes)):
            for j in range(i + 1, len(nomes)):
                if hists[i] and hists[j] and dist_hist(hists[i], hists[j]) * 100 < a.limiar:
                    print(f"   - {nomes[i]}  vs  {nomes[j]}  ({dist_hist(hists[i], hists[j]) * 100:.1f}%)")
                    achou = True
        if not achou:
            print("   (nenhum)")
        return

    for p in a.pngs:
        txt, _ = medir(p, recorte, cols, rows, not a.sem_ascii, a.perfil)
        print(txt)
        print()


if __name__ == "__main__":
    main()
