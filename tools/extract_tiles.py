"""
Converte tiles de um pack CC0 para tiles individuais 64x64 no layout do jogo.

Por que: `src/systems/sprites.ts` so carrega `tile_NN.png` (Kenney, 64x64) e
o `AGENTS.md` Regra 15 exige asset em vez de desenho. Os sheets do Screaming
Brain Studio vem 8x6 numa imagem so; este script fatia em arquivos soltos e
remove o fundo magenta (o pack usa magenta como transparencia).

Selecao: o sheet tem 48 tiles, mas so os 8 primeiros (linha 0) sao piso full
sem borda — a linha 1 tem faixa clara, e da linha 2 em diante e' autotile de
parede. Para o piso do jogo so a linha 0 presta.

Uso: python3 tools/extract_tiles.py
"""
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
DUNGEON = Path('/tmp/opencode/kenney_dl/dungeon/Tiles')
DESTINO = RAIZ / 'public/assets/sprites/dungeon'

TILE = 64
COLS, ROWS = 8, 6

# So a linha 0 do sheet e' piso full; o resto e' autotile de parede.
LINHAS_PISO = (0,)
# Parede usa a linha 1 (miolo da parede, sem a franja de cima).
LINHAS_PAREDE = (0, 1)


def limpar_magenta(img):
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r > 190 and b > 190 and g < 90:
                px[x, y] = (0, 0, 0, 0)
    return img


def extrair(sheet, prefixo, destino, linhas, largura):
    img = Image.open(sheet).convert('RGBA')
    destino.mkdir(parents=True, exist_ok=True)
    n = 0
    for r in linhas:
        for c in range(COLS):
            box = (c * TILE, r * TILE, (c + 1) * TILE, (r + 1) * TILE)
            tile = limpar_magenta(img.crop(box))
            alpha = tile.getchannel('A')
            if alpha.getextrema() == (0, 0):
                continue
            tile = tile.resize((largura, largura), Image.LANCZOS)
            tile.save(destino / f'{prefixo}_{n:02d}.png', optimize=True)
            n += 1
    return n


# prefixo -> (sheet, linhas, lado do tile de saida)
FLOORS = {
    'piso_pedra':   'Floors/Floor-Stone_01-64x64.png',
    'piso_pedra2':  'Floors/Floor-Stone_02-64x64.png',
    'piso_terra':   'Floors/Floor-Dirt_01-64x64.png',
    'piso_terra2':  'Floors/Floor-Dirt_02-64x64.png',
    'piso_areia':   'Floors/Floor-Sand_01 64x64.png',
    'piso_grama':   'Floors/Floor-Grass_01-64x64.png',
    'piso_metal':   'Floors/Floor-Metal_01-64x64.png',
    'piso_madeira': 'Floors/Floor-Wood_01-64x64.png',
}

WALLS = {
    'parede_pedra':    'Walls/Wall-Stone_01-64x64.png',
    'parede_tijolo':   'Walls/Wall-Brick_01-64x64.png',
    'parede_concreto': 'Walls/Wall-Concrete_01-64x64.png',
    'parede_metal':    'Walls/Wall-Metal_01-64x64.png',
    'parede_terra':    'Walls/Wall-Dirt_01-64x64.png',
    'parede_areia':    'Walls/Wall-Sand_01-64x64.png',
}


def main():
    if not DUNGEON.exists():
        print(f'fonte ausente: {DUNGEON}')
        print('baixar: https://opengameart.org/content/top-down-dungeon-pack')
        return
    total = 0
    for prefixo, rel in FLOORS.items():
        origem = DUNGEON / rel
        if not origem.exists():
            print(f'  ausente: {rel}')
            continue
        n = extrair(origem, prefixo, DESTINO, LINHAS_PISO, TILE)
        total += n
        print(f'  {prefixo}: {n} tiles')
    for prefixo, rel in WALLS.items():
        origem = DUNGEON / rel
        if not origem.exists():
            print(f'  ausente: {rel}')
            continue
        n = extrair(origem, prefixo, DESTINO, LINHAS_PAREDE, TILE)
        total += n
        print(f'  {prefixo}: {n} tiles')
    print(f'\n{total} tiles em {DESTINO}')


if __name__ == '__main__':
    main()