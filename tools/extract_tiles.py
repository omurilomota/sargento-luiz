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
# O wangset do .tsx tem 47 tiles (8x6 menos 1 vazio). O tile 47 (r=5,c=7) é
# o miolo puro em alguns sheets, mas não em todos. A busca abaixo encontra, por
# sheet, o tile com a menor diferenca entre borda e miolo (e alfa suficiente
# para ter conteúdo visível). Isso elimina a grade de 64px que nascia quando
# o fatiado pegava uma peça de borda em vez do miolo.

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
# Os nomes de arquivo são os reais do pack extraído (com espaços), não os
# nomes ideais do script antigo. Cada sheet é um "look" diferente do material;
# a variedade honesta vem dos sheets da família, não das peças de borda.
FLOORS = {
    'piso_pedra':   ['Floors/Floor - Stone 1 64x64.png', 'Floors/Floor - Stone 3 64x64.png'],
    'piso_pedra2':  ['Floors/Floor - Stone 2 64x64.png'],
    'piso_terra':   ['Floors/Floor - Dirt 1 64x64.png', 'Floors/Floor - Dirt 2 64x64.png'],
    'piso_terra2':  ['Floors/Floor - Dirt 2 64x64.png', 'Floors/Floor - Dirt 1 64x64.png'],
    'piso_areia':   ['Floors/Floor - Sand 1 64x64.png', 'Floors/Floor - Sand 2 64x64.png'],
    'piso_grama':   ['Floors/Floor - Grass 1 64x64.png'],
    'piso_metal':   ['Floors/Floor - Metal 1 64x64.png'],
    # O pack não tem sheet de piso de madeira; reusa Floor - Dirt 2 com tom
    # de madeira aplicado pelo tint do bioma (o material sai da cor, não do desenho).
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


def _medir_tile_imagem(tile: Image.Image, tamanho: int = TILE):
    """Retorna (diff borda-vs-miolo, luminancia miolo, alfa medio) de um tile ja recortado.

    Mede no proprio objeto Image (depois de crop + copy), que e exatamente o
    que sera salvo no disco. Mesma definicao do tiles.test.ts: miolo = coluna
    central, borda = minimo dos 4 lados.
    """
    px = tile.load()
    cx = tamanho // 2
    # borda: media dos 4 lados
    col0 = sum(sum(px[0, y][:3]) for y in range(tamanho)) / (3 * tamanho)
    colf = sum(sum(px[tamanho - 1, y][:3]) for y in range(tamanho)) / (3 * tamanho)
    lin0 = sum(px[x, 0][0] + px[x, 0][1] + px[x, 0][2] for x in range(tamanho)) / (3 * tamanho)
    linf = sum(px[x, tamanho - 1][0] + px[x, tamanho - 1][1] + px[x, tamanho - 1][2] for x in range(tamanho)) / (3 * tamanho)
    borda = min(col0, colf, lin0, linf)
    # miolo: coluna central
    miolo_soma = 0.0
    alfa_soma = 0
    for y in range(tamanho):
        r, g, b, a = px[cx, y]
        miolo_soma += (r + g + b) / 3
        alfa_soma += a
    miolo = miolo_soma / tamanho / 3
    alfa_medio = alfa_soma / tamanho
    return miolo - borda, miolo, alfa_medio


def extrair_miolos(sheets, prefixo, destino):
    n = 0
    for rel in sheets:
        origem = DUNGEON / rel
        if not origem.exists():
            print(f'  ausente: {rel}')
            continue
        print(f'    abrindo: {origem}')
        sheet = Image.open(origem).convert('RGBA')
        # busca o melhor miolo por sheet:
        # 1. alfa >= 100 (conteúdo visível)
        # 2. miolo >= 10 (luminância mínima para não ficar preto após o tint)
        # 3. menor |diff| (borda mais próxima do miolo): elimina a grade visível
        melhor = None  # (absdiff, diff, rr, cc, miolo, alfa)
        for rr in range(ROWS):
            for cc in range(COLS):
                box = (cc * TILE, rr * TILE, (cc + 1) * TILE, (rr + 1) * TILE)
                tile_candidato = limpar_magenta(sheet.crop(box)).copy()
                if tile_candidato.getchannel('A').getextrema() == (0, 0):
                    continue
                diff, miolo, alfa = _medir_tile_imagem(tile_candidato)
                if alfa < 100 or miolo < 10:
                    continue
                if 'Dirt 2' in rel and rr == 1 and cc == 2:
                    px = tile_candidato.load()
                    T = TILE
                    c0 = sum(sum(px[0, y][:3]) for y in range(T)) / (3 * T)
                    c63 = sum(sum(px[T - 1, y][:3]) for y in range(T)) / (3 * T)
                    l0 = sum(px[x, 0][0] + px[x, 0][1] + px[x, 0][2] for x in range(T)) / (3 * T)
                    l63 = sum(px[x, T - 1][0] + px[x, T - 1][1] + px[x, T - 1][2] for x in range(T)) / (3 * T)
                    m = sum(px[T // 2, y][0] + px[T // 2, y][1] + px[T // 2, y][2] for y in range(T)) / (3 * T)
                    print(f'      DEBUG Dirt2 idx10: col0={c0:.1f} col63={c63:.1f} lin0={l0:.1f} lin63={l63:.1f} miolo={m:.1f} borda={min(c0,c63,l0,l63):.1f} diff={m - min(c0,c63,l0,l63):.1f}')
                absdiff = abs(diff)
                if melhor is None or absdiff < melhor[0]:
                    melhor = (absdiff, diff, rr, cc, miolo, alfa)
        if melhor is None:
            print(f'  sem miolo valido em {rel}')
            continue
        absdiff, diff, rr, cc, miolo, alfa = melhor
        idx = rr * COLS + cc
        if 'Dirt 2' in rel:
            print(f'      MELHOR Dirt2: absdiff={absdiff:.1f} diff={diff:.1f} rr={rr} cc={cc} idx={idx} miolo={miolo:.1f}')
        box = (cc * TILE, rr * TILE, (cc + 1) * TILE, (rr + 1) * TILE)
        tile = limpar_magenta(sheet.crop(box)).copy()
        diff_salvo, miolo_salvo, alfa_salvo = _medir_tile_imagem(tile)
        tile.save(destino / f'{prefixo}_{n:02d}.png', optimize=True)
        # confere que o que foi salvo bate com o que foi medido
        if abs(diff_salvo - diff) > 1:
            print(f'    !! DESALINHAMENTO: medido diff={diff:.1f}, salvo diff={diff_salvo:.1f} para {prefixo}_{n:02d}')
        n += 1
        print(f'  {prefixo}: miolo idx={idx} (r={rr},c={cc}) diff={diff:.1f} |diff|={absdiff:.1f} miolo={miolo:.0f} alfa={alfa:.0f}')
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
