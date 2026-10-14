"""
Converte tiles de um pack CC0 para tiles individuais 64x64 no layout do jogo.

Por que: `src/systems/sprites.ts` so carrega `tile_NN.png` (Kenney, 64x64) e
o `AGENTS.md` Regra 15 exige asset em vez de desenho. Os sheets do Screaming
Brain Studio vem 8x6 numa imagem so; este script fatia em arquivos soltos e
remove o fundo magenta (o pack usa magenta como transparencia).

PISO — o bug da grade de 64px: a versao anterior fatiava a linha 0 do sheet,
que e' a faixa de BORDA do autotile (tiles 0-7: pecas de canto/aresta com a
moldura escura assada — medido: borda 38 pontos de luminancia mais escura
que o centro). Repetidos, viravam uma grade visivel. O wangset do .tsx do
proprio pack responde: so o tile 47 tem as 4 arestas E os 4 cantos do mesmo
terreno — e' o unico miolo puro por sheet (medido: delta -1). A variedade
honesta vem dos sheets da familia (cada sheet e' um "look" diferente do
material), nao das pecas de borda.

PAREDE — linhas 0+1: pecas de bloco 3D (topo claro + face frontal assados).
O desenho de cumeeira/claraboia/faixa que o renderer somava por cima virou
o "altura duplicada" — saiu no terrain.ts, nao aqui.

Uso: python3 tools/extract_tiles.py
"""
from pathlib import Path
import shutil
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
DUNGEON = Path('/tmp/opencode/kenney_dl/dungeon/Tiles')
DESTINO = RAIZ / 'public/assets/sprites/dungeon'

TILE = 64
COLS, ROWS = 8, 6
MIOLO = 47  # o unico tile com arestas+cantos do mesmo terreno (wangset do .tsx)

# Parede usa a linha 0+1 (bloco 3D de topo+face, sem a franja solta).
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


# prefixo -> sheets de onde sai o miolo (tile 47 de cada uma).
# Curadoria visual (prova 2x2 por sheet): Stone_04 (ocre, junta preta pesada)
# e Sand_02 (cinza-azulado, longe de praia) ficaram fora.
FLOORS = {
    'piso_pedra':   ['Floors/Floor-Stone_01-64x64.png', 'Floors/Floor-Stone_03-64x64.png'],
    'piso_pedra2':  ['Floors/Floor-Stone_02-64x64.png'],
    'piso_terra':   ['Floors/Floor-Dirt_01-64x64.png', 'Floors/Floor-Dirt_03-64x64.png'],
    'piso_terra2':  ['Floors/Floor-Dirt_02-64x64.png', 'Floors/Floor-Dirt_04-64x64.png'],
    'piso_areia':   ['Floors/Floor-Sand_01 64x64.png',
                     'Floors/Floor-Sand_03-64x64.png', 'Floors/Floor-Sand_04-64x64.png'],
    'piso_grama':   ['Floors/Floor-Grass_01-64x64.png', 'Floors/Floor-Grass_02-64x64.png'],
    'piso_metal':   ['Floors/Floor-Metal_01-64x64.png', 'Floors/Floor-Metal_02-64x64.png'],
    'piso_madeira': ['Floors/Floor-Wood_01-64x64.png', 'Floors/Floor-Wood_02-64x64.png'],
}

WALLS = {
    'parede_pedra':    'Walls/Wall-Stone_01-64x64.png',
    'parede_tijolo':   'Walls/Wall-Brick_01-64x64.png',
    'parede_concreto': 'Walls/Wall-Concrete_01-64x64.png',
    'parede_metal':    'Walls/Wall-Metal_01-64x64.png',
    'parede_terra':    'Walls/Wall-Dirt_01-64x64.png',
    'parede_areia':    'Walls/Wall-Sand_01-64x64.png',
}


def extrair_miolos(sheets, prefixo, destino):
    n = 0
    for rel in sheets:
        origem = DUNGEON / rel
        if not origem.exists():
            print(f'  ausente: {rel}')
            continue
        sheet = Image.open(origem).convert('RGBA')
        r, c = divmod(MIOLO, COLS)
        box = (c * TILE, r * TILE, (c + 1) * TILE, (r + 1) * TILE)
        tile = limpar_magenta(sheet.crop(box))
        if tile.getchannel('A').getextrema() == (0, 0):
            print(f'  miolo vazio em {rel}')
            continue
        tile.save(destino / f'{prefixo}_{n:02d}.png', optimize=True)
        n += 1
    return n


def extrair_paredes(sheet, prefixo, destino):
    img = Image.open(sheet).convert('RGBA')
    n = 0
    for r in LINHAS_PAREDE:
        for c in range(COLS):
            box = (c * TILE, r * TILE, (c + 1) * TILE, (r + 1) * TILE)
            tile = limpar_magenta(img.crop(box))
            if tile.getchannel('A').getextrema() == (0, 0):
                continue
            tile.save(destino / f'{prefixo}_{n:02d}.png', optimize=True)
            n += 1
    return n


def main():
    if not DUNGEON.exists():
        print(f'fonte ausente: {DUNGEON}')
        print('baixar: https://opengameart.org/content/top-down-dungeon-pack')
        return 1
    # recria destino: nomes antigos (8 por piso) nao podem sobrar como orfaos
    if DESTINO.exists():
        shutil.rmtree(DESTINO)
    DESTINO.mkdir(parents=True)
    total = 0
    for prefixo, sheets in FLOORS.items():
        n = extrair_miolos(sheets, prefixo, DESTINO)
        total += n
        print(f'  {prefixo}: {n} tiles (miolo)')
    for prefixo, rel in WALLS.items():
        origem = DUNGEON / rel
        if not origem.exists():
            print(f'  ausente: {rel}')
            continue
        n = extrair_paredes(origem, prefixo, DESTINO)
        total += n
        print(f'  {prefixo}: {n} tiles (linhas {LINHAS_PAREDE})')
    print(f'\n{total} tiles em {DESTINO}')


if __name__ == '__main__':
    raise SystemExit(main())
