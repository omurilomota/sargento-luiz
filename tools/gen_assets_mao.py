"""
Gera o ARMA NA MÃO de cada arma — asset autoral, CC0, top-down de verdade.

Por que autoral e não o pack: o Kay Lousberg "2D Guns" (já no disco para a
loja) é de PERFIL — colar uma escopeta lateral na mão vista de cima é
mistura de perspectiva (DECISIONS #91 rejeitou o perfil para o corpo; a
loja pode porque é ícone, a mão não pode). O Kenney topdown tem 3 canos
(weapon_gun/machine/silencer) para 13 armas — a pose era por FAMÍLIA.

O pedido do dono (playtest 2026-10-16): "Para cada arma equipada, um
sprite na mão do jogador. Pegar/desenhar." — o desenho é DE CIMA: um
cano com coronha, visto do alto, com o comprimento e o detalhe que
distinguem a arma (a pistola é curta e limpa; a sniper é longa com
luneta; a metralhadora tem carregador de caixa; o RPG é um tubo largo).

O jogo desenha a mão via drawSpriteFit com pivô (17,21) do corpo — a
arma é composta NO MESMO CANVAS do braço? Não: a pose do Kenney já tem
braço+cano assados. Aqui a arma substitui o cano por cima da pose:
desenhada PELO renderer na frente do corpo, rotacionada pela mira.

Saída: public/assets/sprites/hand/mao_*.png, carregadas como mao_*.
Comprimentos medidos em células (32px por meia-célula): pistola 30px,
shotgun 44, metralhadora 46, sniper 66, laser 50, rpg 56, raios 36,
gel 34, granada 30, mina 24, bfg 62, quebrada 28, destruidor 70.
"""

from pathlib import Path
from PIL import Image, ImageDraw

DESTINO = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'sprites' / 'hand'
DESTINO.mkdir(parents=True, exist_ok=True)

# paleta dessaturada (a regra do jogo): metal frio + detalhe por família
METAL = (96, 96, 102)
METAL_ESCURO = (72, 72, 78)
MADEIRA = (94, 78, 58)
DETALHE = (120, 96, 66)  # terracota apagada — o acento da paleta


def _cano(w, h, comprimento, cano_cor, coronha, extra=None, luneta=False, caixa=False):
    """Vista de cima: coronha embaixo, cano para cima, detalhe no meio."""
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = w // 2
    # coronha (a parte que a mão segura): retângulo arredondado embaixo
    d.polygon([(cx - 5, h - 4), (cx + 5, h - 4), (cx + 6, h - 10), (cx - 6, h - 10)], fill=coronha + (255,))
    # o corpo da arma (receiver)
    d.polygon([(cx - 6, h - 10), (cx + 6, h - 10), (cx + 6, h - 16), (cx - 6, h - 16)], fill=METAL_ESCURO + (255,))
    # o cano: sobe do receiver
    d.polygon([(cx - 2, h - 16), (cx + 2, h - 16), (cx + 2, h - 16 - comprimento), (cx - 2, h - 16 - comprimento)], fill=cano_cor + (255,))
    if extra:
        extra(d, cx, h)
    return img


ARMAS = {
    # nome: (comprimento do cano, cor do cano, coronha, extra)
    'mao_pistola': (22, METAL, MADEIRA),
    'mao_shotgun': (30, METAL_ESCURO, MADEIRA),
    'mao_metralhadora': (32, METAL, METAL_ESCURO),
    'mao_sniper': (48, METAL_ESCURO, MADEIRA),
    'mao_laser': (34, (70, 96, 90), METAL_ESCURO),
    'mao_rpg': (40, (86, 82, 72), METAL_ESCURO),
    'mao_raios': (24, (90, 100, 110), METAL_ESCURO),
    'mao_gel': (22, (80, 110, 130), METAL_ESCURO),
    'mao_granada': (20, (88, 88, 78), MADEIRA),
    'mao_mina': (14, (100, 80, 60), MADEIRA),
    'mao_bfg': (44, (110, 104, 84), METAL_ESCURO),
    'mao_quebrada': (16, (82, 78, 70), MADEIRA),
    'mao_destruidor': (54, (120, 100, 70), METAL_ESCURO),
}


for nome, (comp, cano, coronha) in ARMAS.items():
    h = comp + 22
    img = _cano(24, h, comp, cano, coronha)
    d = ImageDraw.Draw(img)
    cx = 12
    # o detalhe que distingue a FAMÍLIA: faixa terracota no receiver
    faixa_y = h - 13
    d.polygon([(cx - 6, faixa_y), (cx + 6, faixa_y), (cx + 6, faixa_y - 2), (cx - 6, faixa_y - 2)], fill=DETALHE + (255,))
    # luneta da sniper / mira do laser / carregador da metralhadora
    if 'sniper' in nome:
        d.ellipse((cx - 3, faixa_y - 10, cx + 3, faixa_y - 4), fill=(60, 60, 66, 255))
    if 'metralhadora' in nome:
        d.polygon([(cx - 4, faixa_y), (cx + 4, faixa_y), (cx + 4, faixa_y + 6), (cx - 4, faixa_y + 6)], fill=METAL_ESCURO + (255,))
    if 'bfg' in nome or 'destruidor' in nome:
        d.ellipse((cx - 4, faixa_y - 8, cx + 4, faixa_y), fill=(140, 110, 70, 255))
    if 'rpg' in nome:
        d.ellipse((cx - 5, h - 17 - comp, cx + 5, h - 7 - comp), fill=(100, 92, 78, 255))
    img.save(DESTINO / f'{nome}.png')
    print(f'{nome}.png {img.size[0]}x{img.size[1]}')
