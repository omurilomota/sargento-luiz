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
import hashlib
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


# Assinatura (md5) dos tiles já escolhidos por outro material. O pack
# compartilha tiles entre sheets da família — medido: Gramado e Terra dividem
# o tile 22, byte a byte. O extrador escolhia esse tile nos DOIS materiais e
# `piso_grama_00.png` saía idêntico a `piso_terra_00.png`: a Floresta nascia
# com chão de terra e nada acusava. Tile já usado é pulado na busca.
ASSINATURAS_USADAS: set[str] = set()

# Luminância do 1o tile de cada material: referência para as próximas
# variantes não saírem de faixa (chão xadrez).
MIOLO_POR_MATERIAL: dict[str, float] = {}


def assinatura(tile: Image.Image) -> str:
    return hashlib.md5(tile.tobytes()).hexdigest()[:10]


# prefixo -> sheets de onde sai o miolo (tile 47 de cada uma).
# Os nomes de arquivo são os reais do pack extraído (com espaços), não os
# nomes ideais do script antigo. Cada sheet é um "look" diferente do material;
# a variedade honesta vem dos sheets da família, não das peças de borda.
FLOORS = {
    # Stone 1 NÃO é piso: medido, 0 dos 48 tiles passam o portão de costura
    # (|diff| mínimo 57.8, borda assada em todos). O sheet é de bloco, não de
    # chão — ficar com Stone 3 apenas.
    'piso_pedra':   ['Floors/Floor - Stone 3 64x64.png'],
    'piso_pedra2':  ['Floors/Floor - Stone 2 64x64.png'],
    'piso_terra':   ['Floors/Floor - Dirt 1 64x64.png', 'Floors/Floor - Dirt 2 64x64.png'],
    'piso_terra2':  ['Floors/Floor - Dirt 2 64x64.png', 'Floors/Floor - Dirt 1 64x64.png'],
    'piso_areia':   ['Floors/Floor - Sand 1 64x64.png', 'Floors/Floor - Sand 2 64x64.png'],
    'piso_grama':   ['Floors/Floor - Grass 1 64x64.png'],
    'piso_metal':   ['Floors/Floor - Metal 1 64x64.png'],
    # Hospital: cerâmica/vidro do mesmo pack (10 dos 48 tiles passam o portão,
    # melhor |diff| 8.5). Era o único sheet do pack que estava sem uso.
    'piso_vidro':   ['Floors/Floor - Glass 1 64x64.png'],
    # O pack não tem sheet de piso de madeira; reusa Floor - Dirt 2 com tom
    # de madeira aplicado pelo tint do bioma (o material sai da cor, não do desenho).
    'piso_madeira': ['Floors/Floor - Dirt 2 64x64.png'],
}

# Portão de costura: a borda do tile não pode ficar mais de 30 pontos de
# luminância abaixo do miolo. É o MESMO número do `tiles.test.ts` — o extrador
# que escolhe o tile tem de respeitar o gate que o reprova, senão o piso nasce
# com a grade de 64px assada e só o teste vê.
LIMIAR_COSTURA = 30

# Luminância mínima do miolo. Os tiles sem costura do pack se dividem em duas
# famílias: uma BASE escura (miolo 12-18, sempre a de menor |diff| — por isso
# ela ganhava todo sheet) e as texturizadas (73-200). Com o piso em 12, o
# `multiply` do bioma escurece mais ainda e a fase nasce com buraco preto onde
# deveria ser chão. Em 50 a areia ficava com o tile de miolo 53 e perdia a 2a
# variante (a família clara do pack é 144+); em 60 as duas entram.
MINIMO_MIOLO = 60

# Faixa de luminância entre as variantes do MESMO material: 60. Sem isto,
# `piso_terra` saía com um tile de miolo 12 e outro de 116 e o chão virava
# xadrez de preto e branco (o `varianteDeChao` alterna os dois por célula).
FAIXA_VARIANTE = 60

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
    # miolo: coluna central. `miolo_soma` já é luminância por pixel (o /3 está
    # na linha acima) — dividir por 3 DE NOVO deixava o miolo 3x menor que a
    # borda e a busca por "borda mais próxima do miolo" escolhia, cega, o tile
    # de borda mais assada. Medido no erro: borda 45-101 pts mais escura que o
    # miolo nos 12 pisos, com `tiles.test.ts` reprovando 12/12.
    miolo_soma = 0.0
    alfa_soma = 0
    for y in range(tamanho):
        r, g, b, a = px[cx, y]
        miolo_soma += (r + g + b) / 3
        alfa_soma += a
    miolo = miolo_soma / tamanho
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
        # 2. miolo >= MINIMO_MIOLO (não nascer preto depois do tint)
        # 3. diff <= LIMIAR_COSTURA (borda não assada: o portão do tiles.test.ts)
        # 4. da 2a variante em diante, mais próximo do miolo já escolhido
        #    (FAIXA_VARIANTE) — variante do mesmo material não pode virar xadrez
        # 5. menor |diff| entre os que sobraram
        aprovados = 0
        melhor = None  # (absdiff, diff, rr, cc, miolo, alfa, ass)
        referencia = MIOLO_POR_MATERIAL.get(prefixo)
        for rr in range(ROWS):
            for cc in range(COLS):
                box = (cc * TILE, rr * TILE, (cc + 1) * TILE, (rr + 1) * TILE)
                tile_candidato = limpar_magenta(sheet.crop(box)).copy()
                if tile_candidato.getchannel('A').getextrema() == (0, 0):
                    continue
                diff, miolo, alfa = _medir_tile_imagem(tile_candidato)
                if alfa < 100 or miolo < MINIMO_MIOLO:
                    continue
                if diff > LIMIAR_COSTURA:
                    continue
                if referencia is not None and abs(miolo - referencia) > FAIXA_VARIANTE:
                    continue
                aprovados += 1
                ass = assinatura(tile_candidato)
                if ass in ASSINATURAS_USADAS:
                    continue
                absdiff = abs(diff)
                if melhor is None or absdiff < melhor[0]:
                    melhor = (absdiff, diff, rr, cc, miolo, alfa, ass)
        if melhor is None:
            if referencia is None:
                motivo = 'nenhum tile passa os portões (costura/luminância)'
            elif aprovados > 0:
                motivo = 'os aprovados já foram usados por outro material'
            else:
                motivo = f'nenhum dentro da faixa de variante (+-{FAIXA_VARIANTE} do miolo {referencia:.0f})'
            print(f'  sem miolo valido em {rel}: {motivo}')
            continue
        absdiff, diff, rr, cc, miolo, alfa, ass = melhor
        idx = rr * COLS + cc
        box = (cc * TILE, rr * TILE, (cc + 1) * TILE, (rr + 1) * TILE)
        tile = limpar_magenta(sheet.crop(box)).copy()
        diff_salvo, miolo_salvo, alfa_salvo = _medir_tile_imagem(tile)
        tile.save(destino / f'{prefixo}_{n:02d}.png', optimize=True)
        ASSINATURAS_USADAS.add(assinatura(tile))
        # a 1a variante do material vira a referência de luminância das próximas
        MIOLO_POR_MATERIAL[prefixo] = miolo
        # confere que o que foi salvo bate com o que foi medido
        if abs(diff_salvo - diff) > 1:
            print(f'    !! DESALINHAMENTO: medido diff={diff:.1f}, salvo diff={diff_salvo:.1f} para {prefixo}_{n:02d}')
        n += 1
        print(f'  {prefixo}_{n - 1:02d}: {rel.split("/")[-1]:<26} idx={idx:>2} diff={diff:>5.1f} miolo={miolo:>3.0f} ass={ass}')
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
