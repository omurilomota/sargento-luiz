#!/usr/bin/env python3
"""Gerador + validador dos mapas de src/maps.ts.

Autorar 9 grades de 30x20 à mão erra a largura das linhas — o risco que o
plano sinaliza. Aqui cada mapa é montado a partir de blocos declarados,
conferido (largura, borda fechada, P único, BFS de P até todo E/B/N) e só
depois impresso no formato de string usado pelo jogo.

Uso: python3 tools/genmaps.py          # valida e imprime os 16 blocos para colar em maps.ts
     python3 tools/genmaps.py porto    # desenha um mapa em ASCII colorido no terminal
"""
from collections import deque

W, H = 30, 20

FLOOR, DECOR, HAZARD, CRATE, BARREL = '.', ',', '^', 'c', 'b'
PLAYER, SPAWN, BOSS, NEST = 'P', 'E', 'B', 'N'
REACH = 'R'
WALL = '#'


def blank():
    g = [[WALL] * W for _ in range(H)]
    for r in range(1, H - 1):
        for c in range(1, W - 1):
            g[r][c] = FLOOR
    return g


def rect(g, c0, r0, c1, r1, ch=WALL):
    for r in range(r0, r1 + 1):
        for c in range(c0, c1 + 1):
            if 0 < r < H - 1 and 0 < c < W - 1:
                g[r][c] = ch


def blob(g, cr, cc, radius, ch=WALL):
    for y in range(cr - radius, cr + radius + 1):
        for x in range(cc - radius, cc + radius + 1):
            if not (0 < y < H - 1 and 0 < x < W - 1):
                continue
            if (y - cr) ** 2 + (x - cc) ** 2 <= (radius * 0.92) ** 2:
                g[y][x] = ch


def wall_row(g, r, c0, c1, doors=()):
    for c in range(c0, c1 + 1):
        if 0 < r < H - 1 and 0 < c < W - 1 and c not in doors:
            g[r][c] = WALL


def wall_col(g, c, r0, r1, doors=()):
    for r in range(r0, r1 + 1):
        if 0 < r < H - 1 and 0 < c < W - 1 and r not in doors:
            g[r][c] = WALL


def arena(g, r0, c0, r1, c1, cover=()):
    """Abre um retângulo como arena de boss e recoloca cobertura dentro dele.

    Sem isto os dois mapas de boss não tinham onde lutar: o maior retângulo livre
    da Cidade era 13x3 e o do Bunker 1x28, e um chefe de raio 42+px preso num
    corredor fica batendo na parede em vez de atacar.
    """
    for r in range(r0, r1 + 1):
        for c in range(c0, c1 + 1):
            if 0 < r < H - 1 and 0 < c < W - 1:
                g[r][c] = FLOOR
    for box in cover:
        rect(g, *box)


def scatter(g, ch, count, seed):
    import random
    rng = random.Random(seed)
    placed = guard = 0
    while placed < count and guard < 6000:
        guard += 1
        r, c = rng.randrange(1, H - 1), rng.randrange(1, W - 1)
        if g[r][c] == FLOOR:
            g[r][c] = ch
            placed += 1


def nearest_floor(g, target):
    tr, tc = target
    best, best_d = None, 1e9
    for r in range(1, H - 1):
        for c in range(1, W - 1):
            if g[r][c] == WALL:
                continue
            d = (r - tr) ** 2 + (c - tc) ** 2
            if d < best_d:
                best_d, best = d, (r, c)
    return best


def reachable_from(g, start):
    seen = {start}
    q = deque([start])
    while q:
        r, c = q.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if not (0 < nr < H - 1 and 0 < nc < W - 1):
                continue
            if g[nr][nc] == WALL or (nr, nc) in seen:
                continue
            seen.add((nr, nc))
            q.append((nr, nc))
    return seen


def ensure_connected(g, player, targets):
    """Escava corredores em L até todo alvo alcançar o spawn."""
    for _ in range(300):
        seen = reachable_from(g, player)
        orphan = next(
            ((r, c) for (r, c) in targets if g[r][c] != WALL and (r, c) not in seen),
            None,
        )
        if orphan is None:
            return
        tr, tc = orphan
        target = None
        for rr in range(tr, H - 1):
            if (rr, tc) in seen:
                target = (rr, tc)
                break
        if target is None:
            for cc2 in range(tc, W - 1):
                if (tr, cc2) in seen:
                    target = (tr, cc2)
                    break
        if target is None:
            for rr in range(tr, 0, -1):
                if (rr, tc) in seen:
                    target = (rr, tc)
                    break
        assert target, 'sem destino para escavar'
        r0, c0 = min(tr, target[0]), min(tc, target[1])
        r1, c1 = max(tr, target[0]), max(tc, target[1])
        for r in range(r0, r1 + 1):
            g[r][c0] = FLOOR
        for c in range(c0, c1 + 1):
            g[r0][c] = FLOOR
        for (r, c) in targets:
            if 0 < r < H - 1 and 0 < c < W - 1 and g[r][c] == WALL:
                g[r][c] = FLOOR


def validate(name, g, need_boss, nest_target):
    for r, row in enumerate(g):
        assert len(row) == W, f'{name}: linha {r} tem {len(row)} colunas'
    assert all(ch == WALL for ch in g[0]), f'{name}: borda superior aberta'
    assert all(ch == WALL for ch in g[H - 1]), f'{name}: borda inferior aberta'
    for row in g:
        assert row[0] == WALL and row[W - 1] == WALL, f'{name}: borda lateral aberta'

    flat = ''.join(''.join(row) for row in g)
    assert flat.count(PLAYER) == 1, f'{name}: {flat.count(PLAYER)} spawns do jogador'
    assert flat.count(SPAWN) >= 4, f'{name}: {flat.count(SPAWN)} zonas de spawn'
    assert flat.count(BOSS) == (1 if need_boss else 0), f'{name}: {flat.count(BOSS)} bosses'
    assert flat.count(NEST) == nest_target, f'{name}: {flat.count(NEST)} ninhos (esperado {nest_target})'

    start = next((r, c) for r in range(H) for c in range(W) if g[r][c] == PLAYER)
    seen = reachable_from(g, start)
    for target in (SPAWN, BOSS, NEST):
        for r in range(H):
            for c in range(W):
                if g[r][c] == target and (r, c) not in seen:
                    raise AssertionError(f'{name}: {target} isolado em ({c},{r})')
    orphan = sum(
        1 for r in range(1, H - 1) for c in range(1, W - 1)
        if g[r][c] != WALL and (r, c) not in seen
    )
    assert orphan == 0, f'{name}: {orphan} células órfãs'


def finish(g, name, player_target, spawns, boss=None, nests=(), reach=None):
    pr, pc = nearest_floor(g, player_target)
    targets = ([(pr, pc)] + list(spawns) + ([boss] if boss else [])
               + list(nests) + ([reach] if reach else []))
    ensure_connected(g, (pr, pc), targets)
    pr, pc = nearest_floor(g, (pr, pc))
    for (r, c) in spawns:
        rr, cc = nearest_floor(g, (r, c))
        g[rr][cc] = SPAWN
    if boss:
        br, bc = nearest_floor(g, boss)
        g[br][bc] = BOSS
    for (r, c) in nests:
        rr, cc = nearest_floor(g, (r, c))
        g[rr][cc] = NEST
    if reach:
        rr, cc = nearest_floor(g, reach)
        g[rr][cc] = REACH
    g[pr][pc] = PLAYER
    validate(name, g, bool(boss), len(nests))
    return g


# ───────────────────────── cada mapa ─────────────────────────

def rodovia():
    """A estrada norte: pistas, canteiro com passagens e a praça de pedágio.

    Redesenho de 2026-10-14 — o relato do Murilo foi "umas das piores
    rodovias já feitas", e era: um corredor com uma mureta no meio não é
    uma estrada. Agora o asfalto atravessa o mapa inteiro em duas pistas
    com canteiro, o guarda-corpo vaza para o campo pelos acostamentos, a
    cancela é o vão entre as cabines do pedágio e os carros pararam em
    fila nas faixas — cobertura de verdade no lugar de `scatter` aleatório.
    """
    g = blank()
    # asfalto: as pistas ocupam as linhas 6..15, com o acostamento marcado
    for c in range(1, W - 1):
        for r in range(6, 16):
            g[r][c] = DECOR if r in (6, 15) else FLOOR
    # canteiro central (mureta dupla) com passagens
    for c in range(1, W - 1):
        if c not in (3, 8, 13, 18, 23, 27):
            g[10][c] = WALL
            g[11][c] = WALL
    # guarda-corpo com aberturas — o acostamento vaza para o campo
    for c in range(1, W - 1):
        if c not in (2, 7, 12, 17, 22):
            g[5][c] = WALL
        if c not in (4, 9, 14, 19, 24):
            g[16][c] = WALL
    # praça de pedágio: as cabines nas duas pistas, a cancela é o vão
    for r in (7, 8, 12, 13):
        for c in (12, 17):
            g[r][c] = WALL
    # carros abandonados: parados em fila nas faixas
    for r, c in ((8, 5), (8, 6), (9, 20), (13, 4), (13, 5), (14, 22), (8, 24), (13, 18)):
        g[r][c] = CRATE
    # barris no acostamento
    for r, c in ((6, 10), (15, 3), (15, 26), (6, 18)):
        g[r][c] = BARREL
    return finish(g, 'rodovia', (17, 15), [(2, 4), (2, 15), (2, 26), (17, 4), (17, 26)],
                  boss=(9, 15), reach=None)

def hospital():
    """Corredores de hospital — salas que saem de um corredor central."""
    g = blank()
    # corredor central horizontal
    for c in range(1, W - 1):
        g[10][c] = FLOOR; g[9][c] = FLOOR
    # salas ao norte e ao sul do corredor
    for r0, c0, r1, c1 in ((2, 2, 7, 9), (2, 12, 7, 18), (2, 21, 7, 27),
                             (12, 2, 17, 9), (12, 12, 17, 18), (12, 21, 17, 27)):
        for r in range(r0, r1 + 1):
            for c in range(c0, c1 + 1):
                g[r][c] = FLOOR
        # porta para o corredor
        g[r1 if r0 == 2 else r0][ (c0 + c1) // 2] = FLOOR
    # paredes entre as salas
    for r in range(2, 18):
        for c in (10, 19):
            if g[r][c] != FLOOR or r == 2 or r == 17:
                pass
    for c in range(2, 28):
        for r in (8, 11):
            if not (c in range(5, 7) or c in range(14, 16) or c in range(23, 25)):
                g[r][c] = WALL
    # hazard: gás de esterilização
    for r, c in ((4, 5), (4, 15), (4, 24), (14, 5), (14, 15), (14, 24)):
        g[r][c] = HAZARD
    scatter(g, CRATE, 4, 61)
    scatter(g, BARREL, 3, 62)
    return finish(g, 'hospital', (17, 15), [(2, 5), (2, 15), (2, 24), (17, 5), (17, 24)],
                  boss=(4, 15))

def trens():
    """Pátio de trens — trilhos paralehos com vagões entre eles."""
    g = blank()
    # trilhos horizontais (hazard elétrico). Medido (2026-10-14): 3 linhas
    # cheias, depois 3 segmentadas, matavam no hazard — o elétrico é o tick
    # mais caro do jogo (14). Ficam DOIS trilhos, em segmentos curtos: pátio
    # de manobras tem desvio, não cerca elétrica.
    for c in range(1, W - 1):
        if c % 7 < 4:
            g[4][c] = HAZARD
            if c % 8 < 4:
                g[14][c] = HAZARD
    # vagões (blocos de parede)
    for r0 in (5, 11, 15):
        for c0 in (3, 10, 17, 24):
            for r in range(r0, min(r0 + 3, 18)):
                for c in range(c0, min(c0 + 4, 28)):
                    g[r][c] = WALL
    # passagens entre vagões (colunas livres)
    for r in range(1, 18):
        for c in (1, 7, 14, 21, 28):
            g[r][c] = FLOOR
    # corredores horizontais livres entre as fileiras
    for c in range(1, 28):
        for r in (1, 8, 18):
            g[r][c] = FLOOR
    # vagões infectados (ninhos)
    nests = ((6, 5), (12, 12), (16, 19))
    scatter(g, CRATE, 4, 61)
    scatter(g, BARREL, 3, 62)
    return finish(g, 'trens', (18, 15), [(2, 5), (2, 14), (2, 22), (16, 7)],
                  boss=(2, 27), nests=nests)

def ponte():
    """O vão da ponte — estreito, com as torres e o vento (lowGravity)."""
    g = blank()
    # torres da ponte (pilares)
    for r in range(1, 6):
        for c in (6, 7, 22, 23):
            g[r][c] = WALL
    # o tabuleiro (faixa livre no meio)
    for c in range(1, W - 1):
        for r in range(7, 14):
            g[r][c] = FLOOR
    # guardas do tabuleiro (cobertura)
    for c in range(2, W - 2):
        if c not in (5, 10, 15, 20, 25):
            g[6][c] = WALL
            g[14][c] = WALL
    # acima e abaixo do tabuleiro é o rio (parede)
    for c in range(1, W - 1):
        for r in list(range(1, 6)) + list(range(15, 19)):
            if g[r][c] == FLOOR:
                g[r][c] = WALL
    # cabos (algumas colunas de parede no tabuleiro)
    for c in (6, 7, 22, 23):
        for r in range(7, 14):
            if r not in (9, 10):
                g[r][c] = WALL
    scatter(g, CRATE, 3, 61)
    scatter(g, BARREL, 2, 62)
    return finish(g, 'ponte', (9, 27), [(9, 3), (10, 3), (9, 12), (10, 12)],
                  boss=(9, 16), reach=(9, 2))

def refinaria():
    """A refinaria — torres circulares com lava entre elas."""
    g = blank()
    # torres de destilação (círculos fechados — sólidos, sem interior)
    for cx, cy, rad in ((8, 8, 3), (8, 22, 3), (15, 8, 2), (15, 15, 2), (15, 22, 2)):
        for r in range(max(1, cy - rad), min(H - 2, cy + rad + 1)):
            for c in range(max(1, cx - rad), min(W - 2, cx + rad + 1)):
                d = (r - cy) ** 2 + (c - cx) ** 2
                if d <= rad * rad:
                    g[r][c] = WALL
    # poças de lava entre as torres
    for r, c in ((4, 15), (5, 15), (11, 12), (11, 13), (18, 8), (18, 9), (12, 25)):
        g[r][c] = HAZARD
    scatter(g, CRATE, 5, 61)
    scatter(g, BARREL, 4, 62)
    scatter(g, DECOR, 5, 63)
    return finish(g, 'refinaria', (18, 15), [(2, 5), (2, 15), (2, 25), (18, 5)],
                  boss=(8, 15))

def subestacao():
    """A subestação — transformadores em grade com trilhos energizados."""
    g = blank()
    # transformadores (blocos 2×2 espaçados)
    for r0 in (3, 8, 13):
        for c0 in (3, 9, 15, 21, 26):
            for r in range(r0, min(r0 + 2, 18)):
                for c in range(c0, min(c0 + 2, 28)):
                    g[r][c] = WALL
    # trilhos energizados (linhas de hazard entre as fileiras)
    for c in range(1, W - 1):
        if c not in (2, 6, 12, 18, 24, 28):
            for r in (6, 11):
                g[r][c] = HAZARD
    # corredores livres
    for c in range(1, W - 1):
        g[1][c] = FLOOR; g[17][c] = FLOOR; g[18][c] = FLOOR
    scatter(g, CRATE, 4, 61)
    scatter(g, BARREL, 3, 62)
    return finish(g, 'subestacao', (18, 15), [(2, 5), (2, 15), (2, 25), (16, 7)],
                  boss=(17, 15))

def porto():
    """O porto — docas com contêineres e a água ao sul.

    Fase 15 de PREMISSA-V2 (Parte I). A nave da MegaCorp estava aqui: galpão,
    docas, escória de decolagem quente, casco vazio. O jogador destrói as 3
    docas (ninhos) — é "destroy", não apenas chegar/percorrer.

    A água fica ao sul (rows 15-17, com 4 passagens). A cobertura vem de
    contêineres em pilha — mesmo formato de caixa do castelo/bunker, só muda
    o enquadramento e a história.
    """
    g = blank()
    # água ao sul: rows 15-17 são a doca/lagoa; deixamos 3 aberturas
    for r in range(15, 18):
        for c in range(1, W - 1):
            g[r][c] = WALL
    g[15][3] = FLOOR; g[15][8] = FLOOR; g[15][15] = FLOOR; g[15][22] = FLOOR
    # contêineres como cobertura (pilhas de depósito)
    for r0, c0, r1, c1 in ((2, 3, 4, 6), (2, 9, 4, 12), (2, 15, 4, 18), (2, 21, 4, 24),
                             (6, 3, 8, 6), (6, 9, 8, 12), (6, 15, 8, 18), (6, 21, 8, 24),
                             (10, 3, 12, 7), (10, 10, 12, 14), (10, 17, 12, 21)):
        for r in range(r0, r1 + 1):
            for c in range(c0, c1 + 1):
                g[r][c] = WALL
    # passagens entre contêineres
    for r in range(2, 14):
        g[r][7] = FLOOR; g[r][13] = FLOOR; g[r][19] = FLOOR; g[r][25] = FLOOR
    # ninhos (as 3 docas-vazias = "naves destruir")
    nests = ((3, 4), (7, 10), (11, 18))
    scatter(g, CRATE, 5, 61)
    scatter(g, BARREL, 3, 62)
    return finish(g, 'porto', (18, 15), [(2, 3), (2, 15), (2, 25), (13, 3), (13, 25)],
                  boss=(10, 27), nests=nests)

def cidade():
    g = blank()
    for box in ((3, 2, 6, 5), (3, 8, 6, 11), (10, 2, 13, 4), (17, 2, 20, 6),
                (23, 3, 26, 7), (10, 8, 12, 12), (15, 8, 19, 11), (22, 10, 26, 13),
                (3, 14, 8, 17), (11, 15, 15, 17), (18, 14, 21, 17), (24, 15, 27, 17)):
        rect(g, *box)
    scatter(g, CRATE, 9, 11)
    scatter(g, BARREL, 5, 12)
    scatter(g, DECOR, 8, 13)
    # Praça do VIGIA no canto inferior direito. A primeira luta do jogo existe
    # para ensinar que parede é cobertura: quatro blocos no meio da praça
    # dão onde se esconder da investida, e os barris nas bordas dão o que
    # explodes quando o chefe os acende.
    arena(g, 12, 17, 18, 28, cover=((19, 13, 20, 13), (25, 13, 26, 13),
                                     (19, 16, 20, 16), (25, 16, 26, 16)))
    scatter(g, BARREL, 4, 14)
    return finish(g, 'cidade', (15, 15), [(1, 7), (2, 20), (6, 27), (12, 15), (18, 8), (9, 24)],
                  boss=(15, 22))


def floresta():
    g = blank()
    for cr, cc, r in ((3, 5, 2), (3, 12, 2), (4, 20, 3), (2, 26, 2), (7, 4, 3),
                      (8, 15, 3), (7, 25, 2), (13, 7, 3), (14, 19, 3), (12, 26, 2),
                      (17, 4, 2), (17, 13, 2), (17, 23, 2)):
        blob(g, cr, cc, r)
    rect(g, 13, 8, 16, 10)
    scatter(g, CRATE, 8, 21)
    scatter(g, BARREL, 4, 22)
    scatter(g, DECOR, 14, 23)
    return finish(g, 'floresta', (18, 15), [(1, 2), (1, 27), (6, 14), (11, 2), (16, 27), (11, 27)],
                  boss=(17, 4), nests=[(18, 5), (18, 24)])


def caverna():
    g = blank()
    for r in range(2, 17, 4):
        rect(g, 2, r, 27, r + 1)
        for c in range(3, 27, 6):
            g[r][c] = FLOOR
            g[r + 1][c] = FLOOR
    for c in range(5, 27, 6):
        rect(g, c, 2, c, 17)
    scatter(g, CRATE, 6, 31)
    scatter(g, BARREL, 4, 32)
    scatter(g, DECOR, 10, 33)
    return finish(g, 'caverna', (18, 15), [(2, 6), (2, 24), (6, 15), (10, 6), (14, 24), (17, 6)],
                  boss=(17, 24), nests=[(5, 12), (9, 20), (13, 10)])


def fabrica():
    g = blank()
    rect(g, 6, 2, 6, 17)
    rect(g, 23, 2, 23, 17)
    rect(g, 6, 6, 23, 6)
    rect(g, 6, 12, 23, 12)
    for r in (3, 4, 8, 9, 14, 15):
        for c in (9, 12, 15, 18, 21):
            rect(g, c, r, c, r)
    for r in range(3, 17, 3):
        g[r][8] = HAZARD
        g[r][20] = HAZARD
    scatter(g, CRATE, 7, 41)
    scatter(g, BARREL, 5, 42)
    scatter(g, DECOR, 6, 43)
    return finish(g, 'fabrica', (18, 15), [(1, 4), (2, 26), (4, 15), (9, 2), (14, 27), (17, 4)],
                  boss=(18, 8))


def pantano():
    g = blank()
    for cr, cc, r in ((3, 4, 2), (3, 9, 2), (3, 20, 2), (3, 25, 2), (8, 6, 2),
                      (8, 13, 2), (8, 22, 2), (12, 4, 2), (12, 17, 2), (12, 24, 2),
                      (16, 8, 2), (16, 20, 2)):
        blob(g, cr, cc, r)
    for r, c0, c1 in ((5, 8, 14), (5, 18, 23), (9, 10, 16), (13, 6, 12), (13, 18, 22), (17, 12, 18)):
        for c in range(c0, c1 + 1):
            g[r][c] = HAZARD
    scatter(g, CRATE, 7, 51)
    scatter(g, BARREL, 5, 52)
    scatter(g, DECOR, 12, 53)
    return finish(g, 'pantano', (18, 15), [(1, 3), (1, 26), (6, 15), (10, 6), (14, 24), (17, 3)],
                  boss=(18, 8))


def castelo():
    g = blank()
    rect(g, 2, 2, 27, 2)
    rect(g, 2, 17, 27, 17)
    for c in (7, 22):
        rect(g, c, 3, c, 16)
    for r in (6, 11):
        rect(g, 8, r, 21, r)
    for r in (4, 5, 8, 9, 13, 14):
        for c in (12, 15, 18):
            rect(g, c, r, c, r)
    for r in (7, 12):
        # Espinho guarda a base da cobertura (pilares de 12/15/18 nas linhas
        # 8-9 e 13-14), não forra o corredor inteiro: o tapete de range(9,21,2)
        # era a única causa de morte do bot nas 9 fases — 120 de dano de bioma
        # em 32s no Castelo, contra 45s+ nas outras 8 (tools/fases-medidas.json).
        for c in (12, 15, 18):
            g[r][c] = HAZARD
    scatter(g, CRATE, 6, 61)
    scatter(g, BARREL, 4, 62)
    scatter(g, DECOR, 8, 63)
    # O foguete que o protect defende (decisão do dono de 2026-10-12): a câmara
    # do meio, colada às duas portas da coluna 14. Não A porta: a coluna 14 é o
    # corredor norte-sul que o `ensure_connected` escava TODO run (as linhas 6
    # e 11 são parede cheia), então o (10,14) sempre termina chão. O foguete
    # fica na (10,13): um passo à esquerda do corredor — quem desce pela porta
    # tromba nele.
    assert g[10][13] == FLOOR
    g[10][13] = 'F'
    return finish(g, 'castelo', (18, 14), [(3, 14), (16, 3), (16, 26), (8, 4), (13, 25), (18, 10)],
                  boss=(18, 6))


def vulcao():
    g = blank()
    # dois canais de lava, não um mar: a arena precisa continuar legível
    for c in range(4, 26):
        r = 4 + int((c - 4) * 0.30)
        g[r][c] = HAZARD
        if c % 3 == 0:
            g[min(H - 2, r + 1)][c] = HAZARD
    for c in range(6, 24):
        r = 11 - int((c - 6) * 0.24)
        g[r][c] = HAZARD
    blob(g, 7, 6, 2)
    blob(g, 7, 22, 2)
    blob(g, 15, 8, 2)
    blob(g, 15, 21, 2)
    scatter(g, CRATE, 5, 71)
    scatter(g, BARREL, 6, 72)
    scatter(g, DECOR, 7, 73)
    # Zona de extração no canto inferior esquerdo: o jogador começa embaixo à
    # direita, então o objetivo reach obriga a atravessar a faixa de lava com a
    # onda em cima em vez de simplesmente limpar o caminho.
    return finish(g, 'vulcao', (18, 15), [(1, 5), (1, 24), (6, 15), (9, 3), (13, 26), (17, 6)],
                  boss=(18, 9), reach=(17, 3))


def espaco():
    g = blank()
    for cr, cc, r in ((4, 4, 2), (4, 15, 2), (4, 25, 2), (10, 8, 2), (10, 21, 2),
                      (15, 4, 2), (15, 26, 2), (7, 11, 1), (13, 17, 1), (17, 13, 1)):
        blob(g, cr, cc, r)
    scatter(g, CRATE, 8, 81)
    scatter(g, BARREL, 6, 82)
    scatter(g, DECOR, 6, 83)
    return finish(g, 'espaco', (18, 3), [(1, 4), (1, 25), (6, 15), (9, 2), (14, 27), (17, 15)],
                  boss=(18, 10))


def bunker():
    g = blank()
    # salas ortogonais com portas: cada reta de parede tem vãos, o que garante
    # que todas as salas se conectem sem depender de escavação
    wall_row(g, 2, 2, 27)
    wall_row(g, 17, 2, 27)
    for r in (6, 10, 14):
        wall_row(g, r, 3, 26, doors=(5, 12, 19, 24))
    for c in (7, 14, 22):
        wall_col(g, c, 3, 16, doors=(4, 8, 12, 16))
    scatter(g, CRATE, 6, 91)
    scatter(g, BARREL, 4, 92)
    scatter(g, DECOR, 8, 93)
    # Salão do NÚCLEO: as duas divisórias do meio viram uma galeria de 6x21, e a
    # fileira de salas ortogonais que sobra é a que o jogador não usa. O chefe
    # final não tem investida — numa arena espremida ela seria só ele batendo
    # na parede —, então a galeria estreita é parte do desenho, não limitação.
    arena(g, 8, 1, 13, 21, cover=((3, 10, 4, 11), (17, 10, 18, 11),
                                  (7, 12, 8, 13), (14, 9, 15, 10)))
    return finish(g, 'bunker', (18, 14), [(3, 4), (16, 4), (4, 15), (11, 15), (18, 3), (18, 15)],
                  boss=(11, 11))


MAPS = [
    ('cidade', cidade),
    ('rodovia', rodovia),
    ('floresta', floresta),
    ('hospital', hospital),
    ('caverna', caverna),
    ('fabrica', fabrica),
    ('trens', trens),
    ('ponte', ponte),
    ('pantano', pantano),
    ('refinaria', refinaria),
    ('castelo', castelo),
    ('subestacao', subestacao),
    ('vulcao', vulcao),
    ('porto', porto),
    ('espaco', espaco),
    ('bunker', bunker),
]

# ─── VISUALIZAÇÃO ASCII (debug de layout sem abrir o jogo) ───

MAPA_LEGENDA = {
    '#': 'parede',
    '.': 'piso',
    ',': 'decor/chão',
    '^': 'hazard',
    'c': 'caixote',
    'b': 'barril',
    'P': 'jogador',
    'E': 'spawn inimigo',
    'B': 'boss',
    'N': 'ninho',
    'R': 'zona extração (reach)',
}

PALETA_ASCII = {
    '#': '\033[47m \033[0m',   # parede - cinza claro
    '.': '\033[47m \033[0m',   # piso - branco (mesmo cinza)
    ',': '\033[40m \033[0m',   # decor - preto
    '^': '\033[41m \033[0m',   # hazard - vermelho
    'c': '\033[43m \033[0m',   # caixote - amarelo
    'b': '\033[100m \033[0m',  # barril - cinza escuro
    'P': '\033[42m\033[1mP\033[0m',  # jogador - verde
    'E': '\033[44mE\033[0m',   # spawn - azul
    'B': '\033[45mB\033[0m',   # boss - roxo
    'N': '\033[33mN\033[0m',   # ninho - amarelo
    'R': '\033[35mR\033[0m',   # reach - roxo claro
}

CELL_WIDTH = 4


def visualizar_mapa(g, title="Mapa"):
    """Desenha o mapa em ASCII colorido para debug/exibição no terminal."""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")
    
    for row in g:
        line = []
        for cell in row:
            if cell in PALETA_ASCII:
                line.append(PALETA_ASCII[cell] * CELL_WIDTH)
            else:
                line.append(' ' * CELL_WIDTH)
        print(''.join(line))
    
    # Estatísticas
    flat = ''.join(''.join(row) for row in g)
    stats = {}
    for ch in MAPA_LEGENDA:
        count = flat.count(ch)
        if count > 0:
            stats[ch] = count
    
    print(f"\n  Estatísticas:")
    for ch, label in MAPA_LEGENDA.items():
        if ch in stats:
            print(f"    {label:15s}: {stats[ch]:3d}")
    
    # Validação rápida dos pontos-chave
    print(f"\n  Pontos obrigatórios:")
    print(f"    Jogador (P):    {'✓' if flat.count('P') == 1 else '✗'} ({flat.count('P')} encontrado(s))")
    print(f"    Spawns (E):     {'✓' if flat.count('E') >= 4 else '✗'} ({flat.count('E')} encontrado(s), mínimo 4)")
    
    has_boss = 'B' in flat
    print(f"    Boss (B):       {'✓' if has_boss else 'N/A'} ({flat.count('B')} encontrado(s))")
    print(f"    Ninhos (N):     {flat.count('N')} encontrado(s)")
    print(f"    Reach (R):      {flat.count('R')} encontrado(s)")
    
    # Conectividade
    start = next((r, c) for r in range(H) for c in range(W) if g[r][c] == PLAYER)
    seen = reachable_from(g, start)
    isolated = []
    for target in ('E', 'B', 'N', 'R'):
        for r in range(H):
            for c in range(W):
                if g[r][c] == target and (r, c) not in seen:
                    isolated.append(f"{target} em ({c},{r})")
    if isolated:
        print(f"\n  ✗ Células isoladas: {isolated}")
    else:
        print(f"\n  ✓ Todos os pontos conectados ao jogador")
    
    orphan = sum(
        1 for r in range(1, H - 1) for c in range(1, W - 1)
        if g[r][c] != WALL and (r, c) not in seen
    )
    if orphan:
        print(f"  ✗ {orphan} células órfãs (piso não alcançável)")
    else:
        print(f"  ✓ Sem células órfãs")
    
    print(f"{'='*60}\n")


if __name__ == '__main__':
    import sys
    # Sem argumento: valida as 16 e emite as grades no formato de maps.ts —
    # o modo de sempre. Com o nome de um mapa: desenha esse mapa em ASCII
    # colorido no terminal (visualizar_mapa) — leitura rápida de paredes,
    # hazards e conectividade sem abrir o jogo.
    if len(sys.argv) > 1:
        target = sys.argv[1].lower()
        for name, fn in MAPS:
            if name == target:
                visualizar_mapa(fn(), f'Mapa: {name.upper()}')
                break
        else:
            print(f"Mapa '{target}' não encontrado. Disponíveis: {[n for n, _ in MAPS]}")
    else:
        for name, fn in MAPS:
            g = fn()
            print(f'--- {name} ---')
            for row in g:
                print(f"      '{''.join(row)}',")
