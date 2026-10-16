"""
Gera as ÁRVORES que bloqueiam passagem — asset autoral, CC0.

Por que autoral e não do pack: o pack não tem vegetação. Medido: dos 524 tiles
do tilesheet Top-down Shooter, 185 são objetos (alfa parcial) e TODOS são caixa
ou cilindro — caixote, barril, saco de areia, carro, parede. Os 17 tiles com
verde dominante são peças de CHÃO (cobertura de alfa 94-97%, os "gramados"
75-77 e 48-50) mais os ninhos 181-183, já usados como prop. O manifesto do pack
não nomeia nenhuma árvore (`grep -i tree vector_tiles.svg` = zero).

Por que a árvore NÃO leva o tint do bioma: `tintSprite` dessatura com #808080 e
multiplica pela cor do bioma, e o fator média dessas cores é ~0.26 (medido no
Pântano: caixote do pack, luminância 121 no PNG, chega a 31 na tela — igual ao
piso, 33). Um tile autoral morreria no mesmo multiplicador. A árvore é
identidade de bioma, não caixote: fica isenta como o foguete, o único objeto
que já não muda de cara com o bioma. A paleta sóbria entra por construção
(verde-cinza, saturação ~20%), não por lavagem.

A cor ainda dessatura no `applyTint`? Não: esse passo é só do terreno
prerrenderizado. Props são desenhados por frame depois, com o tile cru.

Saída: `public/assets/sprites/props/arvore_00.png`, `arvore_01.png` e
`arvore_morta_00.png`, carregados como `prop_arvore_00` etc.
"""

from pathlib import Path
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

TILE = 64
DESTINO = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'sprites' / 'props'

# luminâncias autorais. O piso mede ~31 na tela; a copa a ~120 lê como massa
# viva sem virar o objeto mais claro da fase (o HUD passa de 100).
COPA = 118.0
COPA_CLARA = 136.0
COPA_ESCURA = 96.0
FOLHAGEM = 128.0
TRONCO = 52.0
GALHO = 66.0
FOLHA_MORTA = 104.0


def _rgb(lum: float, matiz: tuple[float, float, float]) -> tuple[int, int, int]:
    """Luminância alvo com matiz fixa (verde-cinza sóbrio, saturação ~20%)."""
    return tuple(int(round(lum * c)) for c in matiz)


# matizes: copa verde-oliva, tronco/galho marrom-cinza, folha morta ocre apagado
MATIZ_COPA = (1.0, 1.05, 0.84)
MATIZ_TRONCO = (1.0, 0.92, 0.78)
MATIZ_MORTA = (1.0, 0.98, 0.86)


def _copa(rng: np.random.Generator, raio: float, cx: int = 32, cy: int = 32) -> Image.Image:
    """Máscara da copa: disco irregular com lóbulos, nunca circunferência pura
    (círculo perfeito lê como barril, que é o que o pack já tem)."""
    m = Image.new('L', (TILE, TILE), 0)
    d = ImageDraw.Draw(m)
    angulos = np.linspace(0, 2 * np.pi, 48, endpoint=False)
    fase = rng.uniform(0, 6.28)
    pontos = []
    for a in angulos:
        r = raio * (1 + 0.13 * np.sin(a * 3 + fase) + 0.07 * np.sin(a * 7 + fase) + rng.uniform(-0.05, 0.05))
        pontos.append((cx + np.cos(a) * r, cy + np.sin(a) * r * 0.94))
    d.polygon(pontos, fill=255)
    return m


def _manchas(mask: Image.Image, rng: np.random.Generator, quantas: int, sigma: float) -> Image.Image:
    """Manchas de folhagem dentro da copa: claras e escuras, borda mole."""
    camada = Image.new('L', (TILE, TILE), 0)
    d = ImageDraw.Draw(camada)
    for _ in range(quantas):
        bx, by = rng.integers(8, TILE - 8, 2)
        r = rng.integers(5, 13)
        v = int(128 + rng.normal(0, sigma))
        d.ellipse([bx - r, by - r, bx + r, by + r], fill=max(0, min(255, v)))
    camada = camada.filter(ImageFilter.GaussianBlur(4))
    return Image.composite(camada, Image.new('L', (TILE, TILE), 0), mask)


def _arvore_viva(seed: int) -> np.ndarray:
    """Copa maciça, tronco no centro e galhos saindo dele — árvore vista de cima."""
    rng = np.random.default_rng(seed)
    img = Image.new('RGBA', (TILE, TILE), (0, 0, 0, 0))
    mask = _copa(rng, raio=27.0)

    # corpo da copa
    corpo = Image.new('RGBA', (TILE, TILE), (0, 0, 0, 0))
    corpo.paste(Image.new('RGBA', (TILE, TILE), _rgb(COPA, MATIZ_COPA) + (255,)), (0, 0), mask)

    # manchas de folhagem por cima, dentro da copa
    man = _manchas(mask, rng, 14, 46)
    tom = Image.new('RGBA', (TILE, TILE), (0, 0, 0, 0))
    tom.paste(Image.new('RGBA', (TILE, TILE), _rgb(FOLHAGEM, MATIZ_COPA) + (255,)), (0, 0), man)
    corpo = Image.alpha_composite(corpo, tom)

    d = ImageDraw.Draw(corpo)
    # sombra de volume: faixa mais escura na borda de baixo/direita
    sombra = mask.transform((TILE, TILE), Image.AFFINE, (1, 0, -3, 0, 1, -3), resample=Image.BILINEAR)
    borda = Image.composite(sombra, Image.new('L', (TILE, TILE), 0), mask)
    borda = Image.eval(borda, lambda v: int(v * 0.55))
    escuro = Image.new('RGBA', (TILE, TILE), _rgb(COPA_ESCURA, MATIZ_COPA) + (255,))
    corpo.paste(escuro, (0, 0), borda)

    # tronco e galhos: o que lê "árvore" de verdade, contra a copa clara.
    # Largura 4 e tronco raio 7 porque a sprite é desenhada a 64px na tela:
    # traço de 2px viraria fiapo invisível.
    d.ellipse([25, 25, 39, 39], fill=_rgb(TRONCO, MATIZ_TRONCO) + (255,))
    for i in range(7):
        a = (i * np.pi * 2) / 7 + rng.uniform(-0.3, 0.3)
        comp = rng.uniform(0.5, 0.85) * 26
        d.line(
            [32, 32, 32 + np.cos(a) * comp, 32 + np.sin(a) * comp * 0.94],
            fill=_rgb(GALHO, MATIZ_TRONCO) + (255,), width=4,
        )
    # anel de casca
    d.ellipse([27, 27, 37, 37], outline=_rgb(TRONCO * 1.4, MATIZ_TRONCO) + (255,), width=2)

    return np.asarray(corpo).astype(float)


def _arvore_morta(seed: int) -> np.ndarray:
    """Árvore morta: sem copa, só tronco grosso e galhos finos e esparsos."""
    rng = np.random.default_rng(seed)
    img = Image.new('RGBA', (TILE, TILE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # sombra: disco fino deslocado, dá volume sem copa
    d.ellipse([24, 26, 44, 44], fill=(40, 38, 32, 70))

    # tronco grosso com anéis de casca
    d.ellipse([24, 24, 40, 40], fill=_rgb(TRONCO, MATIZ_TRONCO) + (255,))
    for r in (5, 8):
        d.ellipse([32 - r, 32 - r, 32 + r, 32 + r], outline=_rgb(TRONCO * (1.6 - r * 0.12), MATIZ_TRONCO) + (255,), width=2)

    # galhos: raios compridos e grossos (largura 4 na autoral, 4px na tela),
    # alguns com bifurcação. É o que lê "árvore morta" contra o Pântano.
    for i in range(9):
        a = (i * np.pi * 2) / 9 + rng.uniform(-0.22, 0.22)
        comp = rng.uniform(0.66, 1.0) * 28
        x2, y2 = 32 + np.cos(a) * comp, 32 + np.sin(a) * comp
        d.line([32, 32, x2, y2], fill=_rgb(GALHO, MATIZ_TRONCO) + (255,), width=4)
        if rng.random() < 0.55:
            b = a + rng.uniform(0.5, 0.9) * (1 if i % 2 else -1)
            d.line([x2, y2, x2 + np.cos(b) * 7, y2 + np.sin(b) * 7],
                   fill=_rgb(GALHO, MATIZ_TRONCO) + (255,), width=2)

    # duas moitas de folha morta ainda na ponta de dois galhos
    for _ in range(3):
        a = rng.uniform(0, 2 * np.pi)
        dist = rng.uniform(0.55, 0.95) * 28
        px, py = 32 + np.cos(a) * dist, 32 + np.sin(a) * dist
        r = rng.integers(2, 4)
        d.ellipse([px - r, py - r, px + r, py + r], fill=_rgb(FOLHA_MORTA, MATIZ_MORTA) + (255,))

    return np.asarray(img).astype(float)


def salvar(nome: str, arr: np.ndarray) -> None:
    img = np.clip(arr, 0, 255).astype('uint8')
    Image.fromarray(img, 'RGBA').save(DESTINO / nome, optimize=True)


def _medir(nome: str, arr: np.ndarray) -> None:
    op = arr[..., 3] > 128
    lum = arr[..., :3].mean(axis=2)
    dentro = lum[op]
    sat = ((arr[..., :3].max(axis=2) - arr[..., :3].min(axis=2)) / np.maximum(arr[..., :3].max(axis=2), 1))[op]
    print(f"{nome:<22} cobertura {op.mean():5.2f}  lum {dentro.mean():5.1f}  "
          f"contraste {dentro.max() - dentro.min():5.1f}  sat {sat.mean() * 100:4.1f}%")


def main() -> int:
    DESTINO.mkdir(parents=True, exist_ok=True)
    for nome, gerador, seed in [
        ('arvore_00.png', _arvore_viva, 21),
        ('arvore_01.png', _arvore_viva, 37),
        ('arvore_morta_00.png', _arvore_morta, 53),
    ]:
        arr = gerador(seed)
        salvar(nome, arr)
        _medir(nome, arr)
    print(f"\n{3} tiles em {DESTINO.relative_to(Path.cwd())}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
