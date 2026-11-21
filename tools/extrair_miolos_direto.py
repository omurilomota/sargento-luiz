"""
Extrai o melhor miolo de cada sheet do pack Top Down Dungeon, medindo
diretamente no objeto que sera salvo (sem objetos PIL mutaveis compartilhados).

Para cada sheet, testa todos os 48 tiles e escolhe aquele com:
  1. alfa >= 100 (conteudo visivel)
  2. miolo >= 10 (luminancia minima)
  3. menor |diff| borda-vs-miolo (elimina a grade de 64px)

A medida eh a mesma do tiles.test.ts: miolo = coluna central,
borda = minimo dos 4 lados.
"""
from pathlib import Path
import shutil
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
DUNGEON = Path('/tmp/opencode/kenney_dl/dungeon/Tiles')
DESTINO = RAIZ / 'public/assets/sprites/dungeon'

TILE = 64
COLS, ROWS = 8, 6

FLOORS = {
    'piso_pedra':   ['Floors/Floor - Stone 2 64x64.png', 'Floors/Floor - Stone 3 64x64.png'],
    'piso_pedra2':  ['Floors/Floor - Stone 2 64x64.png'],
    'piso_terra':   ['Floors/Floor - Dirt 1 64x64.png', 'Floors/Floor - Dirt 2 64x64.png'],
    'piso_terra2':  ['Floors/Floor - Dirt 2 64x64.png', 'Floors/Floor - Dirt 1 64x64.png'],
    'piso_areia':   ['Floors/Floor - Sand 1 64x64.png', 'Floors/Floor - Sand 2 64x64.png'],
    'piso_grama':   ['Floors/Floor - Grass 1 64x64.png'],
    'piso_metal':   ['Floors/Floor - Metal 1 64x64.png'],
    'piso_madeira': ['Floors/Floor - Dirt 2 64x64.png'],
}

WALLS = {
    'parede_pedra':    'Walls/Wall - Stone 1 64x64.png',
    'parede_tijolo':   'Walls/Wall - Brick 1 64x64.png',
    'parede_concreto': 'Walls/Wall - Concrete 1 64x64.png',
    'parede_metal':    'Walls/Wall - Metal 1 64x64.png',
    'parede_terra':    'Walls/Wall - Dirt 1 64x64.png',
    'parede_areia':    'Walls/Wall - Sand 1 64x64.png',
}


def limpar_magenta(img):
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r > 190 and b > 190 and g < 90:
                px[x, y] = (0, 0, 0, 0)
    return img


def medir_tile(tile):
    """Retorna (diff borda-vs-miolo, luminancia miolo, alfa medio) do tile."""
    px = tile.load()
    T = TILE
    cx = T // 2
    col0 = sum(sum(px[0, y][:3]) for y in range(T)) / (3 * T)
    colf = sum(sum(px[T - 1, y][:3]) for y in range(T)) / (3 * T)
    lin0 = sum(px[x, 0][0] + px[x, 0][1] + px[x, 0][2] for x in range(T)) / (3 * T)
    linf = sum(px[x, T - 1][0] + px[x, T - 1][1] + px[x, T - 1][2] for x in range(T)) / (3 * T)
    borda = min(col0, colf, lin0, linf)
    miolo_soma = sum(px[cx, y][0] + px[cx, y][1] + px[cx, y][2] for y in range(T))
    miolo = miolo_soma / T / 3
    alfa_soma = sum(px[cx, y][3] for y in range(T))
    alfa_medio = alfa_soma / T
    return miolo - borda, miolo, alfa_medio


def extrair_miolos(sheets, prefixo, destino):
    n = 0
    for rel in sheets:
        origem = DUNGEON / rel
        if not origem.exists():
            print(f'  ausente: {rel}')
            continue
        sheet = Image.open(origem).convert('RGBA')
        melhor = None  # (absdiff, diff, rr, cc, miolo, alfa, tile_objeto)
        for rr in range(ROWS):
            for cc in range(COLS):
                box = (cc * TILE, rr * TILE, (cc + 1) * TILE, (rr + 1) * TILE)
                tile = limpar_magenta(sheet.crop(box)).copy()
                if tile.getchannel('A').getextrema() == (0, 0):
                    continue
                diff, miolo, alfa = medir_tile(tile)
                if alfa < 100 or miolo < 10:
                    continue
                absdiff = abs(diff)
                if melhor is None or absdiff < melhor[0]:
                    melhor = (absdiff, diff, rr, cc, miolo, alfa, tile)
        if melhor is None:
            print(f'  sem miolo valido em {rel}')
            continue
        absdiff, diff, rr, cc, miolo, alfa, tile = melhor
        idx = rr * COLS + cc
        tile.save(destino / f'{prefixo}_{n:02d}.png', optimize=True)
        n += 1
        print(f'  {prefixo}: miolo idx={idx} (r={rr},c={cc}) diff={diff:.1f} |diff|={absdiff:.1f} miolo={miolo:.0f} alfa={alfa:.0f}')
    return n


def extrair_paredes(rel, prefixo, destino):
    origem = DUNGEON / rel
    if not origem.exists():
        print(f'  ausente: {rel}')
        return 0
    img = Image.open(origem).convert('RGBA')
    n = 0
    for r in (0, 1):
        for c in range(COLS):
            box = (c * TILE, r * TILE, (c + 1) * TILE, (r + 1) * TILE)
            tile = limpar_magenta(img.crop(box)).copy()
            if tile.getchannel('A').getextrema() == (0, 0):
                continue
            tile.save(destino / f'{prefixo}_{n:02d}.png', optimize=True)
            n += 1
    return n


def main():
    if not DUNGEON.exists():
        print(f'fonte ausente: {DUNGEON}')
        return 1
    if DESTINO.exists():
        shutil.rmtree(DESTINO)
    DESTINO.mkdir(parents=True)
    total = 0
    for prefixo, sheets in FLOORS.items():
        total += extrair_miolos(sheets, prefixo, DESTINO)
    for prefixo, rel in WALLS.items():
        total += extrair_paredes(rel, prefixo, DESTINO)
    print(f'\n{total} tiles em {DESTINO}')


if __name__ == '__main__':
    raise SystemExit(main())