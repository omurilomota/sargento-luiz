"""
Gera o galão de combustível da Refinaria — asset autoral CC0.

O tambor da Refinaria usava o MESMO tile do barril explosivo, só tingido de
mostarda. No playtest de 2026-11-07 o dono perguntou como o jogador saberia
que aquilo era combustível. O galão é o ícone que falta: um objeto com alça,
bico e cor de gasolina, desenhado uma vez como PNG e desenhado ACIMA do
tambor, com o rótulo de objetivo no HUD do mundo.

Vista TOP-DOWN: corpo retangular com quinas arredondadas, alça vazada no
topo, bico lateral e uma faixa escura. A paleta é a mostarda da Refinaria,
não amarelo-neon.

Saída: public/assets/sprites/props/combustivel_00.png (64×64, alfa).
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

TILE = 64
S = 4
DESTINO = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'sprites' / 'props'

MOSTARDA = (160, 128, 80, 255)
MOSTARDA_CLARA = (196, 160, 102, 255)
MOSTARDA_ESCURA = (92, 70, 42, 255)
FERRO = (34, 32, 28, 255)
FERRUGEM = (122, 74, 46, 255)


def galao() -> Image.Image:
    img = Image.new('RGBA', (TILE * S, TILE * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # sombra no chão, separada do corpo
    d.ellipse((12 * S, 50 * S, 52 * S, 58 * S), fill=(0, 0, 0, 70))

    # corpo do galão
    d.rounded_rectangle((14 * S, 18 * S, 50 * S, 52 * S), radius=4 * S,
                        fill=MOSTARDA)
    d.rounded_rectangle((14 * S, 18 * S, 50 * S, 52 * S), radius=4 * S,
                        outline=FERRO, width=2 * S)
    # luz de cima e sombra de baixo: o objeto tem volume, não é adesivo
    d.line((17 * S, 21 * S, 47 * S, 21 * S), fill=MOSTARDA_CLARA, width=2 * S)
    d.line((17 * S, 48 * S, 47 * S, 48 * S), fill=MOSTARDA_ESCURA, width=2 * S)
    # faixa de identificação
    d.rectangle((16 * S, 30 * S, 48 * S, 35 * S), fill=MOSTARDA_ESCURA)
    d.rectangle((16 * S, 36 * S, 48 * S, 38 * S), fill=FERRUGEM)

    # alça vazada no topo
    d.rounded_rectangle((24 * S, 12 * S, 40 * S, 22 * S), radius=2 * S,
                        outline=FERRO, width=2 * S)
    # bico lateral
    d.polygon([(48 * S, 22 * S), (55 * S, 20 * S), (55 * S, 28 * S), (48 * S, 28 * S)],
              fill=MOSTARDA_CLARA, outline=FERRO)
    d.ellipse((52 * S, 21 * S, 57 * S, 26 * S), fill=FERRO)
    # respiro
    d.ellipse((20 * S, 40 * S, 24 * S, 44 * S), fill=FERRO)

    # gota de combustível no corpo, para leitura a 24px
    d.polygon([(31 * S, 40 * S), (36 * S, 46 * S), (31 * S, 50 * S), (26 * S, 46 * S)],
              fill=MOSTARDA_CLARA if False else (196, 160, 102, 255))
    d.ellipse((29 * S, 43 * S, 33 * S, 47 * S), fill=MOSTARDA_ESCURA)

    return img.resize((TILE, TILE), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.3))


if __name__ == '__main__':
    DESTINO.mkdir(parents=True, exist_ok=True)
    galao().save(DESTINO / 'combustivel_00.png')
    print('ok: combustivel_00 em', DESTINO)
