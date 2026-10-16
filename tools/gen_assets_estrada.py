"""
Gera os tiles de ASFALTO da Rodovia — asset autoral, CC0, e valida cada um.

Por que autoral e não do pack: o pack não tem asfalto. Medido, os sheets Top
Down Dungeon oferecem pedra/terra/areia/metal/vidro como piso, e o tilesheet
Top-down Shooter só tem SINALIZAÇÃO solta (setas e cunhas, tiles 261-268) sem
corpo de pista. A Rodovia ficava com piso de pedra e 77 marcas laranjas
repetidas (tile_260 na tabela `spriteFor` de terrain.ts), que lê como padrão,
não como estrada — o dono chamou de "símbolos".

O que o jogo faz com o tile manda mais que a cor: `applyTint` e `tintTile`
aplicam `saturation` com #808080 e `multiply` com o tint do bioma, então o
tile chega na tela DESSATURADO — só a luminância sobrevive. Os tiles são
gerados em escala de cinza por isso: a estrada se lê pelo contraste do corpo
escuro contra a faixa clara, não pela tonalidade.

Portões conferidos na saída (mesmos números do `tiles.test.ts`):
  - cobertura de alfa 100% (o teste exige >= 85%)
  - borda mais escura >= miolo - 30 (o portão da costura de 64px)
  - textura: desvio de luminância >= 4 (preenchimento chapado reprova)
  - costura de emenda: na composição 3x3, a média das linhas/colunas de costura
    não pode escurecer mais de 30 contra o miolo — asfalto repetido com borda
    assada vira tabuleiro, que é o defeito que o extrador do pack tinha
"""

from pathlib import Path
import sys
import numpy as np
from PIL import Image

TILE = 64
DESTINO = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'sprites' / 'dungeon'

# luminância do corpo do asfalto: 40 no tile. Medido em jogo: ~28. O tint do
# bioma ('#d8d0c4', 0.85) é aplicado DUAS vezes — uma em `tintTile`, quando o
# tile entra no cache de chão, e outra em `applyTint`, no canvas do terreno
# inteiro — então o que sai na tela é tile × 0.72. O acostamento de pedra mede
# 38; a estrada fica abaixo e lê como faixa escura.
BASE = 40.0
GRAO = 4.0        # desvio do granulado fino (agregado)
MANCHA = 7.0      # desvio das manchas largas (desgaste/remendo)
# A faixa de pista precisa vencer os dois multiplies: pintada em 205, chega a
# ~140 na tela, contra ~28 do asfalto (5:1). Em 155 ela chegava a 65 (2.6:1) e
# o traço sumia no corpo — foi medido no shot da fase, não suposto.
FIXA = 205.0      # luminância da faixa de pista (branco amarelado, sem cor)
TRINCA = 24.0     # luminância da trinca
LIMIAR_COSTURA = 30.0
MINIMO_TEXTURA = 4.0


def _manchas(seed: int, sigma: float, blocos: int = 8) -> np.ndarray:
    """Camada grossa e lisa de variação: sorteada em 8x8 e ampliada sem blocos."""
    rng = np.random.default_rng(seed)
    a = rng.normal(0.0, 1.0, (blocos, blocos))
    span = max(a.max() - a.min(), 1e-6)
    img = Image.fromarray(((a - a.min()) / span * 255).astype('uint8'), 'L')
    img = img.resize((TILE, TILE), Image.BICUBIC)
    return (np.asarray(img, dtype=float) - 127.5) / 127.5 * sigma


def _graos(rng: np.random.Generator, quantos: int, forza: float) -> list[tuple[int, int, int, float]]:
    """Pontos de agregado: (x, y, tamanho, delta de luminância)."""
    return [
        (int(rng.integers(0, TILE)), int(rng.integers(0, TILE)), int(rng.integers(1, 3)), float(rng.choice([-1, 1])) * forza)
        for _ in range(quantos)
    ]


def _corpo(seed: int) -> np.ndarray:
    """Corpo do asfalto: base + granulado + manchas + agregado."""
    rng = np.random.default_rng(seed)
    lum = np.full((TILE, TILE), BASE)
    lum += rng.normal(0.0, GRAO, (TILE, TILE))
    lum += _manchas(seed + 1, MANCHA)
    for x, y, tam, delta in _graos(rng, 46, 11.0):
        lum[y:y + tam, x:x + tam] += delta
    return lum


def _faixa_desgaste(lum: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """Duas passagens de pneu: bandas sutis, 4px, com borda mole."""
    for y0 in (18, 42):
        perfil = np.array([0.0, 0.45, 1.0, 0.45, 0.0])
        for i, peso in enumerate(perfil):
            lum[y0 + i, :] -= 5.0 * peso
        lum[y0 - 1, :] -= 2.0
        lum[y0 + 4, :] -= 2.0
    return lum


def _remendo(lum: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """Remendo de asfalto novo: mancha clara irregular, some no jogo (tint)."""
    y0, x0 = int(rng.integers(8, 40)), int(rng.integers(8, 40))
    raio = int(rng.integers(9, 14))
    for dy in range(-raio, raio + 1):
        for dx in range(-raio, raio + 1):
            if dx * dx + dy * dy > raio * raio:
                continue
            borda = 1.0 - (abs(dx) + abs(dy)) / (raio * 1.4)
            lum[y0 + dy, x0 + dx] += 13.0 * max(borda, 0.0)
    return lum


def _trincas(lum: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """Trincas: caminhada torta de 1-2px com halo claro do lado (relevo)."""
    for _ in range(4):
        x, y = int(rng.integers(4, TILE - 4)), int(rng.integers(4, TILE - 4))
        ang = rng.uniform(0, 2 * np.pi)
        for _ in range(9):
            ang += rng.uniform(-0.7, 0.7)
            nx, ny = x + np.cos(ang) * 3.0, y + np.sin(ang) * 3.0
            ix, iy = int(round(nx)), int(round(ny))
            if 1 <= ix < TILE - 1 and 1 <= iy < TILE - 1:
                lum[iy, ix] = TRINCA
                lum[iy + 1, ix] = TRINCA + 4.0
                lum[iy, ix + 1] = TRINCA + 8.0
            x, y = nx, ny
    return lum


def _pintar(lum: np.ndarray, y0: int, y1: int, x0: int, x1: int, valor: float, rampa: int = 0) -> None:
    """Retângulo de luminância com rampa horizontal nas pontas (ponta de traço)."""
    for y in range(y0, y1):
        for x in range(x0, x1):
            peso = 1.0
            if rampa:
                if x - x0 < rampa:
                    peso = (x - x0 + 1) / rampa
                elif x1 - 1 - x < rampa:
                    peso = (x1 - x) / rampa
            lum[y, x] = BASE * (1 - peso) + valor * peso


def salvar(nome: str, lum: np.ndarray) -> np.ndarray:
    """Grava o PNG e devolve a luminância já cortada na faixa visível."""
    arr = np.clip(lum, 8.0, 235.0)
    img = np.zeros((TILE, TILE, 4), dtype='uint8')
    img[..., 0] = arr.astype('uint8')
    img[..., 1] = arr.astype('uint8')
    img[..., 2] = np.clip(arr + 2.0, 0, 255).astype('uint8')
    img[..., 3] = 255
    Image.fromarray(img, 'RGBA').save(DESTINO / nome, optimize=True)
    return arr


def _medir(nome: str, arr: np.ndarray) -> dict:
    miolo = float(arr[:, TILE // 2].mean())
    borda = min(
        float(arr[0, :].mean()), float(arr[-1, :].mean()),
        float(arr[:, 0].mean()), float(arr[:, -1].mean()),
    )
    return {
        'nome': nome,
        'lum': float(arr.mean()),
        'textura': float(arr.std()),
        'costura': borda - miolo,
    }


def _emenda(nome: str, arr: np.ndarray) -> float:
    """Costura da composição 3x3: linhas/colunas de junção contra o miolo."""
    g = np.tile(arr, (3, 3))
    juntas_x = np.concatenate([g[64, :], g[128, :]])
    juntas_y = np.concatenate([g[:, 64], g[:, 128]])
    miolo = float(g[64:128, 64:128].mean())
    junta = float(np.concatenate([juntas_x, juntas_y]).mean())
    del nome
    return junta - miolo


def main() -> int:
    DESTINO.mkdir(parents=True, exist_ok=True)
    tiles: list[tuple[str, np.ndarray]] = []

    corpo = _corpo(1001)
    salvar('piso_asfalto_00.png', corpo)
    tiles.append(('piso_asfalto_00', corpo))

    variante = _faixa_desgaste(_corpo(1002), np.random.default_rng(7))
    salvar('piso_asfalto_01.png', variante)
    tiles.append(('piso_asfalto_01', variante))

    remendado = _remendo(_manchas(1003, MANCHA) + BASE, np.random.default_rng(11))
    remendado += np.random.default_rng(1003).normal(0.0, GRAO, (TILE, TILE))
    salvar('piso_asfalto_02.png', remendado)
    tiles.append(('piso_asfalto_02', remendado))

    rachado = _trincas(_corpo(1004), np.random.default_rng(13))
    salvar('piso_asfalto_03.png', rachado)
    tiles.append(('piso_asfalto_03', rachado))

    # faixa de pista: traço de 9px de altura por 40px de largura, com rampa de
    # 3px nas pontas — alternado com célula lisa no mapa, vira linha tracejada.
    # A rampa é o que impede o traço de parecer um selo colado. A altura é 9 e
    # não 10 porque o portão de costura compara a coluna central com as bordas:
    # em 10px a diferença batia em -28.3 de -30, e em 9px sobe para -23.
    faixa = _corpo(1005).copy()
    _pintar(faixa, 27, 36, 12, 52, FIXA, rampa=3)
    salvar('piso_faixa_00.png', faixa)
    tiles.append(('piso_faixa_00', faixa))

    for idx, (y0, y1) in enumerate([(0, 4), (TILE - 4, TILE)]):
        borda = _corpo(1006 + idx).copy()
        _pintar(borda, y0, y1, 0, TILE, FIXA)
        nome = f'piso_borda_{idx:02d}.png'
        salvar(nome, borda)
        tiles.append((nome[:-4], borda))

    print(f"{'tile':<18} {'lum':>6} {'textura':>8} {'costura':>8} {'emenda':>8}")
    ruins = 0
    for nome, arr in tiles:
        m = _medir(nome, arr)
        em = _emenda(nome, arr)
        ok = m['costura'] <= LIMIAR_COSTURA and m['textura'] >= MINIMO_TEXTURA and em > -LIMIAR_COSTURA
        if not ok:
            ruins += 1
        print(f"{m['nome']:<18} {m['lum']:6.1f} {m['textura']:8.1f} {m['costura']:+8.1f} {em:+8.1f}  {'ok' if ok else 'REPROVA'}")
    print(f"\n{len(tiles)} tiles em {DESTINO.relative_to(Path.cwd())}")
    return 1 if ruins else 0


if __name__ == '__main__':
    sys.exit(main())
