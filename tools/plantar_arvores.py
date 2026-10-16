"""
Planta as árvores que bloqueiam passagem na Floresta (`T`) e no Pântano (`D`).

O portão vem ANTES do plantio, não depois: a árvore tem raio de colisão 20 e o
maior inimigo comum do jogo é o magmaGolem com raio 30, então um tronco no
lugar errado sela uma passagem e a onda nunca fecha. Medido no Castelo: dois
caixotes nos dois únicos vãos de 1 célula fecham 116 das 375 células (31%).

O portão é contínuo, não de grade: para cada par de células vizinhas ele varre
o segmento entre os dois centros e exige que um círculo de raio 26 caiba em
todos os pontos do caminho — 64px de distância a toda parede e 46px a toda
árvore. Isso reprova tanto a árvore no meio do corredor quanto a árvore
encostada no corredor, que uma BFS de células deixaria passar.

Uso: `python3 tools/plantar_arvores.py` (idempotente: a mesma semente dá o
mesmo bosque, e rodar de novo em cima replanta do zero).
"""

from pathlib import Path
import math
import random
import re
import sys

RAIZ = Path(__file__).resolve().parent.parent
MAPAS = RAIZ / 'src' / 'maps.ts'

# o maior inimigo COMUM do jogo (magmaGolem, raio 30 em config.ts). Boss tem
# raio até 54 e não respeita corredor de célula — a arena dele é outra conversa.
RAIO = 30
# raio de colisão da árvore em props.ts
ARVORE = 20
CELL = 64

# bosques: semente, quantas sementes, tamanho alvo de cada bosque
PLANTIO = {
    'floresta': {'char': 'T', 'semente': 101, 'brotos': 7, 'por_bosque': 4},
    'pantano': {'char': 'D', 'semente': 202, 'brotos': 6, 'por_bosque': 4},
}

LINHA_MAPA = re.compile(r"^      '.{30}',$")


def ler_bloco(txt: str, biome: str) -> tuple[int, int, list[str]]:
    """Devolve (início, fim, linhas) do bloco LINHA de um bioma em maps.ts."""
    ini = txt.find(f"  {biome}: {{")
    fim = txt.find("\n  },\n", ini)
    if ini < 0 or fim < 0:
        raise SystemExit(f"bioma {biome} não encontrado em maps.ts")
    linhas = []
    i = ini
    while True:
        j = txt.find("\n", i)
        linha = txt[i:j] if j > 0 else ''
        if re.match(r"^      '.{30}',$", linha):
            linhas.append(linha)
        if j >= fim:
            break
        i = j + 1
    if len(linhas) != 20:
        raise SystemExit(f"{biome}: {len(linhas)} linhas de mapa, esperado 20")
    return ini, fim, linhas


def grade(linhas: list[str]) -> list[list[str]]:
    return [list(l[7:-2]) for l in linhas]


def escrever_bloco(txt: str, ini: int, fim: int, linhas_antigas: list[str], g: list[list[str]]) -> str:
    """Troca as linhas de mapa antigas pelas novas, preservando o resto."""
    novo = txt[ini:fim]
    for antiga, row in zip(linhas_antigas, g):
        nova = f"      '{''.join(row)}',"
        if antiga not in novo:
            raise SystemExit(f"linha não encontrada no bloco: {antiga!r}")
        novo = novo.replace(antiga, nova, 1)
    return txt[:ini] + novo + txt[fim:]


def dist_parede(px: float, py: float, c: int, r: int) -> float:
    dx = max(c * CELL - px, 0, px - (c + 1) * CELL)
    dy = max(r * CELL - py, 0, py - (r + 1) * CELL)
    return math.hypot(dx, dy)


def posicao_livre(g: list[list[str]], arvores: set[tuple[int, int]], px: float, py: float) -> bool:
    """Um círculo de raio RAIO cabe centrado neste ponto?"""
    H, W = len(g), len(g[0])
    r0, c0 = int(py // CELL), int(px // CELL)
    for r in range(max(0, r0 - 1), min(H, r0 + 2)):
        for c in range(max(0, c0 - 1), min(W, c0 + 2)):
            if g[r][c] == '#' and dist_parede(px, py, c, r) < RAIO:
                return False
    for (c, r) in arvores:
        if math.hypot(px - (c + 0.5) * CELL, py - (r + 0.5) * CELL) < RAIO + ARVORE:
            return False
    return True


def passagem(g, arvores, a, b) -> bool:
    """Um círculo de raio RAIO vai do centro de `a` ao de `b` sem trombar?"""
    x1, y1 = (a[0] + 0.5) * CELL, (a[1] + 0.5) * CELL
    x2, y2 = (b[0] + 0.5) * CELL, (b[1] + 0.5) * CELL
    n = max(1, int(math.hypot(x2 - x1, y2 - y1) / (RAIO / 2)))
    for i in range(n + 1):
        t = i / n
        if not posicao_livre(g, arvores, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t):
            return False
    return True


def inalcancaveis(g, arvores) -> int:
    """BFS a partir do spawn: quantas células o raio 26 não alcança mais.

    A célula da árvore não conta como livre: o tronco ocupa o lugar.
    """
    H, W = len(g), len(g[0])
    inicio = next((c, r) for r in range(H) for c in range(W) if g[r][c] == 'P')
    if not posicao_livre(g, arvores, (inicio[0] + 0.5) * CELL, (inicio[1] + 0.5) * CELL):
        return 10 ** 6
    vistos = {inicio}
    fila = [inicio]
    while fila:
        c, r = fila.pop()
        for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (c + dc, r + dr)
            if not (0 <= n[0] < W and 0 <= n[1] < H) or n in vistos:
                continue
            if g[n[1]][n[0]] == '#' or n in arvores:
                continue
            if not passagem(g, arvores, (c, r), n):
                continue
            vistos.add(n)
            fila.append(n)
    livres = sum(
        1 for r in range(H) for c in range(W)
        if g[r][c] != '#' and (c, r) not in arvores
    )
    return livres - len(vistos)


def plantar(g: list[list[str]], char: str, semente: int, brotos: int, por_bosque: int):
    """Bosques crescentes: de cada broto, cresce enquanto o portão aguentar."""
    rng = random.Random(semente)
    H, W = len(g), len(g[0])
    arvores: set[tuple[int, int]] = set()
    base = inalcancaveis(g, arvores)
    if base != 0:
        raise SystemExit(f'mapa já vem com {base} células inalcancáveis antes de plantar')

    # candidatos: célula de piso com a vizinhança 3x3 sem parede, longe do
    # spawn. Duas listas em vez de uma: o piso limpo (vizinhança também sem
    # decoração) entra primeiro porque o bosque fica mais legível, e o que
    # tem decoração na beirada só completa onde o primeiro faltar.
    P = next((c, r) for r in range(H) for c in range(W) if g[r][c] == 'P')
    sem_parede = [
        (c, r)
        for r in range(H) for c in range(W)
        if g[r][c] == '.'
        and all(g[r + dr][c + dc] != '#' for dr in (-1, 0, 1) for dc in (-1, 0, 1))
        and max(abs(c - P[0]), abs(r - P[1])) > 2
    ]
    limpo = [v for v in sem_parede
             if all(g[v[1] + dr][v[0] + dc] == '.' for dr in (-1, 0, 1) for dc in (-1, 0, 1))]
    rng.shuffle(sem_parede)
    sem_parede = limpo + [v for v in sem_parede if v not in limpo]

    # brotos por amostragem de ponto mais distante: sorteado o primeiro, cada
    # próximo é o candidato mais longe de todos os já escolhidos. Sem isso os
    # bosques nascem todos no mesmo canto do mapa (foi o que aconteceu) e a
    # floresta fica com metade do mapa vazia.
    brotos_escolhidos = [sem_parede[0]]
    while len(brotos_escolhidos) < min(brotos, len(sem_parede)):
        mais_longe = max(
            (v for v in sem_parede if v not in brotos_escolhidos),
            key=lambda v: min(max(abs(v[0] - b[0]), abs(v[1] - b[1])) for b in brotos_escolhidos),
        )
        brotos_escolhidos.append(mais_longe)
    restantes = [v for v in sem_parede if v not in brotos_escolhidos]
    recusas = 0
    for broto in brotos_escolhidos:
        bosque = [broto]
        while len(bosque) < por_bosque:
            # cresce para um vizinho ainda não plantado, o mais próximo do
            # broto — bosque, não cerca
            vizinhos = [
                v for v in restantes
                if any(max(abs(v[0] - b[0]), abs(v[1] - b[1])) == 1 for b in bosque)
            ]
            if not vizinhos:
                vizinhos = [v for v in restantes
                            if any(max(abs(v[0] - b[0]), abs(v[1] - b[1])) <= 2 for b in bosque)]
            colocou = False
            for v in vizinhos:
                arvores.add(v)
                if inalcancaveis(g, arvores) == 0:
                    bosque.append(v)
                    restantes.remove(v)
                    colocou = True
                    break
                arvores.discard(v)
                recusas += 1
            if not colocou:
                break
    for (c, r) in sorted(arvores):
        g[r][c] = char
    return arvores, recusas


def main() -> int:
    txt = MAPAS.read_text(encoding='utf-8')
    total = 0
    for biome, cfg in PLANTIO.items():
        ini, fim, linhas = ler_bloco(txt, biome)
        g = grade(linhas)
        arvores, recusas = plantar(g, cfg['char'], cfg['semente'], cfg['brotos'], cfg['por_bosque'])
        txt = escrever_bloco(txt, ini, fim, linhas, g)
        print(f"{biome}: {len(arvores)} {cfg['char']} plantadas, {recusas} recusas do portão")
        if inalcancaveis(g, arvores) != 0:
            print(f"  FALHA: {inalcancaveis(g, arvores)} células inalcancáveis", file=sys.stderr)
            return 1
        total += len(arvores)
    MAPAS.write_text(txt, encoding='utf-8')
    print(f"{total} árvores escritas em src/maps.ts")
    return 0


if __name__ == '__main__':
    sys.exit(main())
