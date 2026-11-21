"""
Gera a CENOGRAFIA AUTORAL de interior — tocha do Castelo, painel da
estação do Espaço e berço de biomaquina do NÚCLEO. Asset autoral, CC0.

Por que autoral e não do pack: medido na auditoria T6, dos 524 tiles do
Top-down Shooter 185 são objetos e TODOS são caixa ou cilindro — não
existe tocha, painel ou berço. A caça externa da sessão 2026-10-16
falhou: o "Space Shooter Redux" do Kenney mudou de nome no catálogo e o
que restou é 3D ou textura de céu. O precedente é a árvore
(gen_assets_arvores.py): quando o pack não tem e a caça não acha, o
projeto gera com a paleta sóbria NA CONSTRUÇÃO e declara a autoria.

Vista do jogo: TOP-DOWN. A tocha é um BRASEIRO visto de cima — bacia de
pedra com borda, carvão escuro no miolo e a chama como massa clara
irregular no centro. O painel é um módulo de piso com luzes indicadoras
apagadas (pedra-azul #608090 da paleta). O berço é uma laje com faixas
âmbar — o vocabulário das biomaquinas (mustarda da paleta).

Luminâncias medidas contra o piso da tela (~31): o objeto de cenografia
tem que ler (~90-130) sem virar o ponto mais claro da fase — o HUD passa
de 100 e a chama é a única coisa que pode competir com ele, porque chama
É luz.

Saída: public/assets/sprites/props/tocha_00.png, tocha_01.png,
painel_00.png, berco_00.png — carregados como prop_*.
"""

from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

TILE = 64
DESTINO = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'sprites' / 'props'


def _rgb(lum: float, matiz: tuple[float, float, float]) -> tuple[int, int, int]:
    return tuple(int(round(lum * c)) for c in matiz)


# matizes sóbrias: pedra cinza-quente do castelo, chama âmbar apagado,
# painel pedra-azul, berço cinza com faixa mostarda
MATIZ_PEDRA = (1.0, 0.97, 0.90)
MATIZ_CHAMA = (1.0, 0.82, 0.58)
MATIZ_CARVAO = (1.0, 0.72, 0.55)
MATIZ_TECH = (0.88, 0.94, 1.0)
MATIZ_AMBAR = (1.0, 0.88, 0.62)


def _disco_irregular(rng: np.random.Generator, raio: float, cx: int, cy: int,
                     lobos: int = 9, amplitude: float = 0.16) -> list[tuple[int, int]]:
    """Contorno irregular: lóbulos senoidais com fase aleatória — círculo
    perfeito leria como barril, que é o que o pack já tem de sobra."""
    pontos = []
    fase = rng.uniform(0, 2 * np.pi)
    for i in range(36):
        a = i / 36 * 2 * np.pi
        r = raio * (1 + amplitude * np.sin(lobos * a + fase) + rng.uniform(-0.04, 0.04))
        pontos.append((cx + r * np.cos(a), cy + r * np.sin(a)))
    return [(p[0], p[1]) for p in pontos]


def tocha(semente: int, variant: int) -> Image.Image:
    rng = np.random.default_rng(semente)
    img = Image.new('RGBA', (TILE, TILE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = 32, 32

    # bacia de pedra: anel externo irregular
    raio_base = 22 - variant * 2
    borda = _disco_irregular(rng, raio_base, cx, cy)
    d.polygon(borda, fill=_rgb(74, MATIZ_PEDRA) + (255,))
    miolo = _disco_irregular(rng, raio_base - 5, cx, cy)
    d.polygon(miolo, fill=_rgb(38, MATIZ_PEDRA) + (255,))

    # carvão: massa escura irregular no centro
    carvao = _disco_irregular(rng, raio_base - 9, cx, cy, lobos=7)
    d.polygon(carvao, fill=_rgb(30, MATIZ_CARVAO) + (255,))

    # chama: massa âmbar com duas camadas — núcleo mais claro, borda mais
    # apagada. A forma vem dos mesmos lóbulos (chama de cima é blob, não
    # triangular de lado).
    chama_ext = _disco_irregular(rng, 9, cx, cy, lobos=5, amplitude=0.3)
    d.polygon(chama_ext, fill=_rgb(132, MATIZ_CHAMA) + (255,))
    chama_int = _disco_irregular(rng, 5, cx, cy, lobos=4, amplitude=0.35)
    d.polygon(chama_int, fill=_rgb(168, MATIZ_CHAMA) + (255,))

    return img.filter(ImageFilter.GaussianBlur(0.4))


def painel() -> Image.Image:
    """Módulo de piso da estação: placa retangular com borda chanfrada e
    duas luzes indicadoras apagadas (pedra-azul) — equipamento morto."""
    rng = np.random.default_rng(77)
    img = Image.new('RGBA', (TILE, TILE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # placa: retângulo com cantos cortados (chanfro lê "tech" melhor que
    # canto vivo, e nunca círculo — círculo é barril)
    pts = [(14, 10), (50, 10), (54, 14), (54, 50), (50, 54), (14, 54), (10, 50), (10, 14)]
    d.polygon(pts, fill=_rgb(58, MATIZ_TECH) + (255,))
    # volume: borda superior clara (luz de cima) e inferior escura — o
    # pack inteiro tem esse sombreamento; sem ele o painel leria como
    # retângulo chapado (o anti-padrão da auditoria T6)
    d.line(pts[:2] + [pts[2]], fill=_rgb(84, MATIZ_TECH) + (255,), width=3)
    d.line(pts[4:6] + [pts[6]], fill=_rgb(34, MATIZ_TECH) + (255,), width=3)
    # friso interno
    d.polygon([(p[0] + (2 if p[0] < 32 else -2), p[1] + (2 if p[1] < 32 else -2)) for p in pts],
              outline=_rgb(78, MATIZ_TECH) + (255,), width=2)
    # luzes: dois discos pequenos, apagados (a estação está morrendo)
    for i, (lx, ly) in enumerate(((24, 24), (40, 40))):
        r = 3.5
        d.ellipse((lx - r, ly - r, lx + r, ly + r), fill=_rgb(96, MATIZ_TECH) + (255,))
    # grade de ventilação: três traços paralelos
    for k in range(3):
        y = 20 + k * 10
        d.line((30, y, 44, y), fill=_rgb(46, MATIZ_TECH) + (255,), width=2)
    return img.filter(ImageFilter.GaussianBlur(0.3))


def berco() -> Image.Image:
    """Berço da biomaquina: laje escura com duas faixas âmbar apagadas nas
    bordas — onde a máquina encosta. O âmbar é o vocabulário das
    biomaquinas do NÚCLEO (a mostarda da paleta, ~86 de luminância)."""
    img = Image.new('RGBA', (TILE, TILE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.polygon([(8, 16), (56, 16), (56, 48), (8, 48)], fill=_rgb(42, MATIZ_TECH) + (255,))
    # volume: topo iluminado, base em sombra (mesmo vocabulário do painel)
    d.line((8, 16, 56, 16), fill=_rgb(66, MATIZ_TECH) + (255,), width=3)
    d.line((8, 48, 56, 48), fill=_rgb(24, MATIZ_TECH) + (255,), width=3)
    # faixas âmbar: as guias do berço
    for y in (18, 44):
        d.polygon([(10, y), (54, y), (54, y + 3), (10, y + 3)], fill=_rgb(86, MATIZ_AMBAR) + (255,))
    # fenda central: onde a biomaquina senta
    d.polygon([(26, 22), (38, 22), (38, 44), (26, 44)], fill=_rgb(26, MATIZ_TECH) + (255,))
    # parafusos nos cantos
    for (x, y) in ((12, 20), (52, 20), (12, 44), (52, 44)):
        d.ellipse((x - 2, y - 2, x + 2, y + 2), fill=_rgb(62, MATIZ_TECH) + (255,))
    return img.filter(ImageFilter.GaussianBlur(0.3))


if __name__ == '__main__':
    DESTINO.mkdir(parents=True, exist_ok=True)
    tocha(11, 0).save(DESTINO / 'tocha_00.png')
    tocha(23, 1).save(DESTINO / 'tocha_01.png')
    painel().save(DESTINO / 'painel_00.png')
    berco().save(DESTINO / 'berco_00.png')
    print('ok: tocha_00, tocha_01, painel_00, berco_00 em', DESTINO)
