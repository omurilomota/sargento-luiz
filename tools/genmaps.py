#!/usr/bin/env python3
"""Gerador + validador dos mapas de src/maps.ts.

Autorar 9 grades de 30x20 à mão erra a largura das linhas — o risco que o
plano sinaliza. Aqui cada mapa é montado a partir de blocos declarados,
conferido (largura, borda fechada, P único, BFS de P até todo E/B/N) e só
depois impresso no formato de string usado pelo jogo.

Uso: python3 tools/genmaps.py          # imprime os blocos para colar em maps.ts
"""
from collections import deque

W, H = 30, 20

FLOOR, DECOR, HAZARD, CRATE, BARREL = '.', ',', '^', 'c', 'b'
PLAYER, SPAWN, BOSS, NEST = 'P', 'E', 'B', 'N'
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


def finish(g, name, player_target, spawns, boss=None, nests=()):
    pr, pc = nearest_floor(g, player_target)
    targets = [(pr, pc)] + list(spawns) + ([boss] if boss else []) + list(nests)
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
    g[pr][pc] = PLAYER
    validate(name, g, bool(boss), len(nests))
    return g


# ───────────────────────── cada mapa ─────────────────────────

def cidade():
    g = blank()
    for box in ((3, 2, 6, 5), (3, 8, 6, 11), (10, 2, 13, 4), (17, 2, 20, 6),
                (23, 3, 26, 7), (10, 8, 12, 12), (15, 8, 19, 11), (22, 10, 26, 13),
                (3, 14, 8, 17), (11, 15, 15, 17), (18, 14, 21, 17), (24, 15, 27, 17)):
        rect(g, *box)
    scatter(g, CRATE, 9, 11)
    scatter(g, BARREL, 5, 12)
    scatter(g, DECOR, 8, 13)
    return finish(g, 'cidade', (15, 15), [(1, 7), (2, 20), (6, 27), (12, 15), (18, 8), (9, 24)])


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
        for c in range(9, 21, 2):
            g[r][c] = HAZARD
    scatter(g, CRATE, 6, 61)
    scatter(g, BARREL, 4, 62)
    scatter(g, DECOR, 8, 63)
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
    return finish(g, 'vulcao', (18, 15), [(1, 5), (1, 24), (6, 15), (9, 3), (13, 26), (17, 6)],
                  boss=(18, 9))


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
    return finish(g, 'bunker', (18, 14), [(3, 4), (16, 4), (4, 15), (11, 15), (18, 3), (18, 15)])


MAPS = [
    ('cidade', cidade),
    ('floresta', floresta),
    ('caverna', caverna),
    ('fabrica', fabrica),
    ('pantano', pantano),
    ('castelo', castelo),
    ('vulcao', vulcao),
    ('espaco', espaco),
    ('bunker', bunker),
]

if __name__ == '__main__':
    for name, fn in MAPS:
        g = fn()
        print(f'--- {name} ---')
        for row in g:
            print(f"      '{''.join(row)}',")
