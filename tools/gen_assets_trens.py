"""
Gera o trilho e os dois carros do Pátio de Trens — asset autoral CC0.

Por que autoral: a busca por um trilho/trem 2D top-down CC0 não achou pack
com a mesma linguagem do resto do jogo. O Kenney Train Kit é 3D; o tileset
de metrô que aparece no itch é pago; o Railroad Track do OpenGameArt é
isométrico. O precedente do projeto (árvore, asfalto, painel da estação) é
gerar NA CONSTRUÇÃO, com a paleta sóbria, e declarar a autoria.

O trem é visto de cima: telhado, nervuras, escotilhas, ferrugem e engates.
A locomotiva tem cabine e farol; o vagão leva o "7" do manifesto da história.
O trilho é um tile de 64px com dormentes e bitola, para ser repetido em linha
no mapa sem costura visível.

Saída em public/assets/sprites/props/:
  trilho_h_00.png, trilho_h_01.png
  trem_locomotiva_00.png (256×64), trem_vagao_00.png (256×64)
"""

from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

TILE = 64
CAR_W = 256
CAR_H = 64
S = 4  # desenha em 4× e reduz: antialias sem depender de fonte/sistema
DESTINO = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'sprites' / 'props'

FERRUGEM = (122, 74, 46, 255)
FERRUGEM_ESCURA = (82, 48, 32, 255)
ACO = (74, 76, 68, 255)
ACO_CLARO = (124, 124, 108, 255)
ACO_ESCURO = (34, 34, 28, 255)
MADEIRA = (68, 50, 34, 255)
MADEIRA_CLARA = (96, 72, 48, 255)
MOSTARDA = (160, 128, 80, 255)


def _ruido(rng: np.random.Generator, w: int, h: int, n: int,
           cor: tuple[int, int, int, int]) -> Image.Image:
    camada = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(camada)
    for _ in range(n):
        x = rng.integers(0, w)
        y = rng.integers(0, h)
        r = rng.integers(1, 4)
        d.ellipse((x - r, y - r, x + r, y + r), fill=cor)
    return camada


def trilho(variant: int) -> Image.Image:
    """Tile horizontal: lastro, quatro dormentes e dois trilhos."""
    rng = np.random.default_rng(100 + variant)
    img = Image.new('RGBA', (TILE * S, TILE * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # lastro: faixa escura sem borda dura; a transparência deixa o piso do
    # bioma aparecer nas beiradas, então o trilho não vira um tapete.
    d.rectangle((0, 10 * S, TILE * S, 54 * S), fill=(32, 28, 24, 116))
    for _ in range(260):
        x = rng.integers(0, TILE * S)
        y = rng.integers(11 * S, 54 * S)
        r = rng.integers(1, 3)
        d.ellipse((x - r, y - r, x + r, y + r),
                  fill=(86, 72, 56, int(rng.integers(40, 100))))

    # dormentes: passo 16px fecha sem costura entre tiles (64/16 = 4)
    for i in range(4):
        x = (6 + i * 16 + variant * 2) * S
        d.rounded_rectangle((x, 12 * S, x + 7 * S, 52 * S), radius=2 * S,
                            fill=MADEIRA)
        d.line((x + 1 * S, 14 * S, x + 1 * S, 50 * S), fill=MADEIRA_CLARA, width=S)
        for gy in (16, 30, 44):
            d.line((x + 2 * S, gy * S, x + 6 * S, gy * S),
                   fill=(54, 38, 26, 200), width=max(1, S // 2))

    # trilhos: base escura, corpo de aço e brilho na aresta de cima
    for y in (22, 42):
        d.rectangle((0, (y - 2) * S, TILE * S, (y + 2) * S), fill=ACO_ESCURO)
        d.rectangle((0, (y - 1) * S, TILE * S, (y + 1) * S), fill=ACO)
        d.line((0, (y - 1) * S + S // 2, TILE * S, (y - 1) * S + S // 2),
               fill=ACO_CLARO, width=max(1, S // 2))
        # ferrugem pontual, não em toda junta
        for _ in range(3 + variant):
            x = rng.integers(0, TILE * S)
            r = rng.integers(1, 4)
            d.ellipse((x - r * S, (y - 1) * S - r, x + r * S, (y + 1) * S + r),
                      fill=FERRUGEM)

    # cravos: dois por dormente/trilho
    for i in range(4):
        x = (6 + i * 16 + variant * 2) * S + 3 * S
        for y in (22, 42):
            d.ellipse((x - S, y * S - S, x + S, y * S + S), fill=(28, 26, 22, 255))

    img = img.resize((TILE, TILE), Image.LANCZOS)
    return img.filter(ImageFilter.GaussianBlur(0.25))


def _corpo_carro(d: ImageDraw.ImageDraw, largura: int, altura: int) -> None:
    """Chassi, passadiço e contorno escuro — a base dos dois carros."""
    d.rounded_rectangle((8 * S, 4 * S, (largura - 8) * S, (altura - 4) * S),
                        radius=4 * S, fill=ACO_ESCURO)
    d.rounded_rectangle((10 * S, 6 * S, (largura - 10) * S, (altura - 6) * S),
                        radius=3 * S, fill=(58, 58, 48, 255))
    # passadiço nas duas laterais
    d.rectangle((10 * S, 6 * S, (largura - 10) * S, 9 * S), fill=(34, 34, 28, 255))
    d.rectangle((10 * S, (altura - 9) * S, (largura - 10) * S, (altura - 6) * S),
                fill=(34, 34, 28, 255))


def _telhado(d: ImageDraw.ImageDraw, largura: int, altura: int,
             rng: np.random.Generator) -> None:
    """Telhado com nervuras transversais, emendas e ferrugem."""
    topo = 10 * S
    base = (altura - 10) * S
    d.rounded_rectangle((14 * S, topo, (largura - 14) * S, base), radius=3 * S,
                        fill=(78, 76, 62, 255))
    # duas águas: uma faixa clara no centro, sombra nas bordas
    d.rectangle((16 * S, topo + 2 * S, (largura - 16) * S, 14 * S),
                fill=(92, 88, 72, 255))
    d.rectangle((16 * S, (altura - 14) * S, (largura - 16) * S, base - 2 * S),
                fill=(54, 54, 44, 255))
    # nervuras a cada 22px (cabe inteiro nos 4 tiles)
    for x in range(24, largura - 18, 22):
        d.rectangle((x * S, topo + 2 * S, (x + 3) * S, base - 2 * S),
                    fill=(62, 62, 50, 255))
        d.line(((x + 1) * S, topo + 3 * S, (x + 1) * S, base - 3 * S),
               fill=(106, 102, 84, 180), width=max(1, S // 2))
    # ferrugem escorrida: manchas alongadas, nunca neon
    for _ in range(9):
        x = rng.integers(20, largura - 24) * S
        y = rng.integers(topo // S + 2, base // S - 4) * S
        w = rng.integers(2, 7) * S
        h = rng.integers(2, 11) * S
        d.rounded_rectangle((x, y, x + w, y + h), radius=2 * S,
                            fill=(*FERRUGEM[:3], int(rng.integers(90, 170))))
    # rebites nas duas fileiras externas
    for x in range(18, largura - 16, 12):
        for y in (12, altura - 12):
            d.ellipse(((x - 1) * S, (y - 1) * S, (x + 1) * S, (y + 1) * S),
                      fill=(118, 114, 96, 220))


def locomotiva() -> Image.Image:
    rng = np.random.default_rng(7)
    img = Image.new('RGBA', (CAR_W * S, CAR_H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    _corpo_carro(d, CAR_W, CAR_H)
    _telhado(d, CAR_W, CAR_H, rng)

    # cabine à direita: caixa mais alta e janelas laterais escuras
    d.rounded_rectangle((174 * S, 12 * S, 232 * S, 52 * S), radius=3 * S,
                        fill=(68, 64, 52, 255))
    d.rectangle((178 * S, 15 * S, 228 * S, 23 * S), fill=(36, 40, 38, 255))
    d.rectangle((178 * S, 41 * S, 228 * S, 49 * S), fill=(36, 40, 38, 255))
    for x in (182, 196, 210, 224):
        d.rectangle((x * S, 13 * S, (x + 3) * S, 15 * S), fill=(124, 120, 100, 255))
    # escotilha do motor
    d.rounded_rectangle((48 * S, 20 * S, 108 * S, 44 * S), radius=3 * S,
                        fill=(54, 56, 46, 255))
    d.rectangle((53 * S, 23 * S, 103 * S, 27 * S), fill=(92, 88, 72, 255))
    for x in range(56, 104, 10):
        d.line((x * S, 29 * S, x * S, 41 * S), fill=(40, 42, 34, 220), width=S)
    # chaminé
    d.ellipse((66 * S, 27 * S, 82 * S, 39 * S), fill=(34, 34, 28, 255))
    d.ellipse((69 * S, 29 * S, 79 * S, 37 * S), fill=(16, 16, 12, 255))
    # farol e para-choque dianteiro
    d.rounded_rectangle((232 * S, 16 * S, 240 * S, 48 * S), radius=2 * S,
                        fill=(90, 48, 30, 255))
    d.ellipse((236 * S, 28 * S, 241 * S, 36 * S), fill=(210, 186, 132, 255))
    d.rectangle((240 * S, 20 * S, 248 * S, 44 * S), fill=(38, 34, 28, 255))
    # engate traseiro
    d.rectangle((0, 27 * S, 10 * S, 37 * S), fill=(30, 28, 24, 255))
    d.ellipse((0, 25 * S, 6 * S, 39 * S), fill=(60, 56, 46, 255))
    return img.resize((CAR_W, CAR_H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.25))


def vagao() -> Image.Image:
    rng = np.random.default_rng(19)
    img = Image.new('RGBA', (CAR_W * S, CAR_H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    _corpo_carro(d, CAR_W, CAR_H)
    _telhado(d, CAR_W, CAR_H, rng)

    # duas escotilhas redondas e uma faixa central
    for cx in (78, 178):
        d.ellipse(((cx - 22) * S, 13 * S, (cx + 22) * S, 51 * S),
                  fill=(50, 50, 42, 255))
        d.ellipse(((cx - 17) * S, 16 * S, (cx + 17) * S, 48 * S),
                  fill=(72, 70, 58, 255))
        d.ellipse(((cx - 8) * S, 25 * S, (cx + 8) * S, 39 * S),
                  fill=(38, 38, 32, 255))
    d.rectangle((30 * S, 28 * S, 226 * S, 36 * S), fill=(56, 56, 46, 180))
    # o "7" do manifesto, gasto
    d.rectangle((116 * S, 22 * S, 144 * S, 44 * S), fill=(*MOSTARDA[:3], 70))
    d.line((124 * S, 25 * S, 136 * S, 25 * S), fill=(*MOSTARDA[:3], 190), width=2 * S)
    d.line((136 * S, 25 * S, 126 * S, 41 * S), fill=(*MOSTARDA[:3], 190), width=2 * S)
    # engates nas duas pontas
    for x0 in (0, 248):
        d.rectangle((x0 * S, 27 * S, (x0 + 8) * S, 37 * S), fill=(30, 28, 24, 255))
        d.ellipse(((x0 + 1) * S, 25 * S, (x0 + 7) * S, 39 * S), fill=(60, 56, 46, 255))
    return img.resize((CAR_W, CAR_H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.25))


if __name__ == '__main__':
    DESTINO.mkdir(parents=True, exist_ok=True)
    trilho(0).save(DESTINO / 'trilho_h_00.png')
    trilho(1).save(DESTINO / 'trilho_h_01.png')
    locomotiva().save(DESTINO / 'trem_locomotiva_00.png')
    vagao().save(DESTINO / 'trem_vagao_00.png')
    print('ok: trilho_h_00/01, trem_locomotiva_00, trem_vagao_00 em', DESTINO)
