# Auditoria de assets e tilesets

**Data:** 2026-10-14 · **Medido sobre:** árvore de trabalho em cima de
`develop` @ `51be5c2` (há trabalho não commitado em `src/`, inclusive os 7
biomas novos de 2026-10-14) · **Método:** inspeção visual dos PNGs + medição de
pixel + réplica do pipeline de tingimento fora do jogo.

Este documento existe porque o defeito que ele descreve **não aparece em nenhum
gate**. `tsc` passa, os 969 testes passam, `npm run visual` não acusa 404 — e o
chão continua sendo um papel quadriculado. O portão `semAssetQuebrado` prova que
o arquivo chega ao `dist` com >0 byte; ele não prova que o tile faz sentido.

Cada achado abaixo traz a **medição** que o sustenta, não a impressão. Onde a
evidência é uma imagem, ela está descrita em texto para quem não abre PNG.

---

## 0. Como reproduzir

As pranchas de evidência foram geradas em `/tmp/opencode/assets-audit/` (efêmero).
Para refazer:

```python
# costura de um tile: borda vs miolo
from PIL import Image
im = Image.open('public/assets/sprites/dungeon/piso_pedra_01.png').convert('RGBA')
px = im.load(); w, h = im.size
col = lambda x: sum(sum(px[x, y][:3]) for y in range(h)) / (3 * h)
print('col0', col(0), 'col62', col(62), 'col63', col(63))
lin = lambda y: sum(sum(px[x, y][:3]) for x in range(w)) / (3 * w)
print('linha63', lin(63), 'linha32', lin(32))

# réplica do drawFloor + applyTint de src/systems/terrain.ts
from PIL import Image, ImageChops
import glob
CELL, n = 64, 8
def sat_gray(im):
    g = im.convert('L'); return Image.merge('RGB', (g, g, g))
def multiply(im, hexc):
    r, g, b = [int(hexc[i:i+2], 16) for i in (1, 3, 5)]
    return ImageChops.multiply(im, Image.new('RGB', im.size, (r, g, b)))
big = Image.new('RGB', (CELL*n, CELL*n))
tiles = sorted(glob.glob('public/assets/sprites/dungeon/piso_pedra2_*.png'))
for y in range(n):
    for x in range(n):
        t = Image.open(tiles[(x*7 + y*13) % len(tiles)]).convert('RGB')
        t = multiply(sat_gray(t), '#e8e0d4')          # tintTile
        t = Image.blend(t, Image.new('RGB', (CELL, CELL), '#2a2521'), 0.62)  # a lavagem
        big.paste(t, (x*CELL, y*CELL))
big = multiply(sat_gray(big), '#e8e0d4')              # applyTint
big.save('/tmp/cidade.png')                           # -> caderno quadriculado
```

---

## 1. P0 — o piso não é seamless; a grade de 64px é o chão

`src/systems/sprites.ts:74` afirma que o pack *Screaming Brain Top Down Dungeon*
é *"seamless, com 8 variações por material"*. **Não é.** Medindo a luminância
média de cada linha e coluna de todos os 64 tiles de piso:

```
piso_pedra_01   col63 =   0.0 (preto puro)    linha63 =  32.7    miolo = 128.0
piso_pedra_00   col0  =  14.6                 linha63 =  33.3    miolo = 127.9
piso_pedra2_00  col0  =  27.6                 linha63 =  26.5    miolo =  56.4
piso_grama_00   linha0 = 26.1                                   miolo =  79.7
piso_metal_00   linha0 = 47.9                                   miolo =  97.7
```

**Todos os 64 tiles têm uma faixa escura assada de ~2px em pelo menos dois
lados.** Em ladrilho, isso vira uma grade de 64px com contraste alto contra o
miolo. Replicando o pipeline real (`drawFloor`, `terrain.ts:66-100`, mais
`applyTint`, `terrain.ts:558-576`), a saída é:

- **`piso_pedra2`** (cidade, rodovia, ponte) → **papel quadriculado**, linhas
  pretas perfeitas de 1px a cada 64px.
- **`piso_metal`** (fabrica, trens, espaco, bunker, subestacao) → **colcha de
  retalhos**, placas deslocadas com borda dupla.
- **`piso_grama`** → grade de quadrados de grama com borda escura.

É exatamente o que está em `tools/shots/04-jogando.png` e `castelo-000.png`.

### Causa raiz

`tools/extract_tiles.py:26`:

```python
# So a linha 0 do sheet e' piso full; o resto e' autotile de parede.
LINHAS_PISO = (0,)
```

A linha 0 dos sheets `Floors/` do pack é a faixa de **borda/autotile**, não o
miolo. Os 8 arquivos por material são 8 peças de contorno distintas — por isso
cada uma tem a faixa escura num lado diferente. O comentário e o fatiado
divergem, e o fatiado está errado.

**Correção:** escolher a faixa de miolo de cada sheet e cortar a borda, ou
descartar o fatiado e usar a linha de interior. Verificar por **pixel**
(§6, item 6), nunca por palavra.

---

## 2. P0 — a parede é um bloco 3D, e o código desenha um segundo bloco por cima

Inspeção dos 96 tiles de parede: **todos** são blocos com topo iluminado, frente
escura e sombra inferior **assados no arquivo**. Não existe tile de "superfície
de parede" no conjunto. `LINHAS_PAREDE = (0, 1)` (`extract_tiles.py:28`) não dá
cap-vs-miolo — as linhas 0 e 1 são a mesma coisa com rostos de bloco diferentes.

`terrain.ts:497-552` (`drawWallEdges`) desenha **por cima** do tile:

- cumeeira (`shade(baseWall, 0.35)`, 3px)
- claraboia (`rgba(0,0,0,0.25)` + `strokeRect`)
- beiral (borda interna escura de 6px em todo contato com chão)
- face superior (`shade(biome.wall, 0.42)`, **14px de barra clara**)
- contorno fechado (`rgba(0,0,0,0.75)`, 3px)

Ou seja: **geometria 3D duplicada**. No `castelo-000.png` isso aparece como
barras cinza-claras longas e retangulares pintadas no meio do mapa, que leem
como riscos de falha, não como arquitetura. E a claraboia solta retângulos
cinza espalhados na parede que parecem ruído de UI.

---

## 3. P1 — 16 biomas, 8 pisos, 6 paredes

| piso | quem usa |
|---|---|
| `piso_metal` | **fabrica, trens, espaco, bunker, subestacao** |
| `piso_pedra2` | cidade, rodovia, ponte |
| `piso_pedra` | caverna, castelo |
| `piso_areia` | vulcao, refinaria |
| `piso_grama` / `piso_terra` / `piso_terra2` / `piso_madeira` | 1 cada |

| parede | quem usa |
|---|---|
| `parede_concreto` | **cidade, rodovia, trens, bunker, hospital, subestacao, porto** |
| `parede_metal` | fabrica, espaco, ponte, refinaria |
| `parede_pedra` | caverna, vulcao |
| `parede_tijolo` | **pantano, castelo** |
| `parede_terra` | floresta |

Dois pares saem **byte-idênticos** em `dungeonFloor` + `dungeonWall` +
`floorTiles`:

- **`cidade` ≡ `rodovia`** → `piso_pedra2` / `parede_concreto` / `[13, 15, 349, 350, 376, 377]`
- **`fabrica` ≡ `trens`** → `piso_metal` / `parede_metal` / `[35, 36, 37, 62, 63, 64]`

Só muda `floor` e `tint`, e a diferença é ~4% de luminância. Tijolo vermelho em
pântano e castelo; chapa estriada em hospital e no espaço.

`sprites.ts:311-320` vende `VARIACAO_POR_BIOMA` como a razão de o jogo anunciar
33 inimigos e "a variação que o jogador sente". No terreno essa variação não
existe: metade dos biomas divide material com outro.

---

## 4. P1 — a Rodovia não parece uma rodovia

Relato do dono: *"a cena de rodovia que parece tudo menos uma rodovia"*. Medido,
tem três causas independentes — e nenhuma delas se resolve trocando uma cor.

### 4.1 O bioma é a Cidade com outro tint

`maps.ts:79` e `maps.ts:360` — `cidade` e `rodovia` são idênticos em piso, parede
e lista de tiles (§3). A diferença é `floor #2a2521`→`#282420` e
`tint #e8e0d4`→`#d8d0c4`. A rodovia é a Cidade 4% mais escura.

O bloco da `rodovia` foi escrito hoje (2026-10-14, "Unidade A" em `maps.ts:357`),
**copiando o da cidade** — inclusive a linha `floorTiles`. Ninguém olhou o
resultado, porque ninguém tem como olhar.

### 4.2 Os 6 tiles que a rodovia declara não são estrada

`floorTiles: [13, 15, 349, 350, 376, 377]`, ampliados:

| tile | o que é |
|---|---|
| `13` | laje terracota |
| `15` | laje ocre com faixa escura no topo |
| `349`, `350`, `376`, `377` | **preenchimento sólido laranja**, chapado |

**Nenhum dos 6 é asfalto, e nenhum tem marcação de pista.** É a lista da Cidade
copiada. E nem chega a rodar: como `dungeonFloor` é `piso_pedra2`, o que o
jogador vê é laje de pedra.

### 4.3 O mapa não tem estrutura de estrada

O mapa de `rodovia` é um labirinto retangular genérico de 30×20 — salas
fechadas, sem eixo, sem pista contínua:

```
 3  #,,,,,,,,,,,,,E,,,,,,,,,,,,,,#
 4  #...........###.##...........#
 5  #.......^..,###.##...........#
16  #,,E,,,,,,,,,,,,,,,,,,,,,,E,,#
```

Não há pista contínua, não há eixo, não há acostamento, não há defesa. As linhas
3 e 16 são `,` (decor), que é mancha de tom — não asfalto.

### 4.4 O pack tem a família de estrada inteira, e o jogo não usa nenhuma

Os 524 tiles do Kenney `topdown-shooter` incluem um sistema de estrada
completo, **inteiramente disponível e 100% não usado**:

| grupo | tiles |
|---|---|
| asfalto liso | `29`, `35`, `36`, `41`, `66` |
| **faixa amarela** contínua | `30`, `55`, `56`, `57`, `58` |
| **faixa branca** contínua | `34`, `37`, `60`, `61` |
| caixa de pista | `60`, `61` |
| **guarda-corpo / new jersey** | `307`, `308`, `311`, `313`, `314` |
| **carro (corpo)** | `474`, `475`, `476` |
| **carro (interior, 2 bancos)** | `477`, `478` |
| **roda** | `479` |

Guarda-corpo, carro abandonado e eixo tracejado estão todos no disco. Nenhum
está em `TILE_NUMBERS`.

---

## 5. P1 — as tabelas de tiles apontam para o tile errado

### `WALL_TILES` (`terrain.ts:325`) — 6 dos 8 conjuntos não são parede

| bioma | tiles | o que é de verdade |
|---|---|---|
| `fabrica` | `110-113` | **cantos em L laranja**, restante semitransparente |
| `vulcao` | `163-166` | **cantos em L laranja** |
| `pantano` | `172-175` | **cantos em L laranja** |
| `bunker` | `415-418` | **frestas azul-claro** de ~4px |
| `caverna` | `334-337` | `334` é **piso sólido laranja**; `335-337` são frestas |
| `espaco` | `489-492` | três listras verticais + uma horizontal |
| `castelo` | `43-46` | ✅ tijolo de verdade |
| `cidade` | `96-99` | painel de madeira (aceitável) |

E o caminho é **inalcançável**: `drawWall` tenta o dungeon primeiro
(`terrain.ts:366`), que sempre carrega. O único consumidor de `WALL_TILES` é
`terrain.test.ts:154-183` — órfão com consumidor de teste, a classe que o
`semOrfao` existe para pegar.

### `spriteFor` (`terrain.ts:125`) — decor de chão

| bioma | tile | o que é | saturação |
|---|---|---|---|
| floresta | `134` | **avião de papel verde** | 58% |
| espaco | `333` | **quadrado cinza-azulado chapado** (66% de cobertura) | 24% |
| castelo | `133` | **quadrado bege** — o objeto mais claro do jogo | **84%** |
| pantano | `209` | verde chapado, sem textura | 56% |
| vulcao | `316` | **disco laranja chapado** | **84%** |

E `spriteFor` só cobre 9 dos 16 biomas — rodovia, hospital, trens, ponte,
refinaria, subestacao e porto caem no `ellipse` procedural de fallback.

### `HAZARD_SPRITES` (`terrain.ts:182`)

- `fog` e `mud` **dividem o `320`**: uma mancha cinza. Cinza não é névoa nem lama.
- `electric: [264]` → **cristal azul** (é o mesmo desenho de `238`/`239`).
- `debris: [292, 265, 260]` → caixa de papelão, tora, laje de chão.

### `CENAS_CUTSCENE` (`terrain.ts:683`)

| cena | objetos | o que aparece |
|---|---|---|
| FLORESTA | `183, 186` alternados | **mesma silhueta de blob em verde e laranja** |
| PÂNTANO | `320, 134` | mancha cinza + avião de papel |
| ESPAÇO | `333, 333, 264` | **2 quadrados cinza** + caco azul |
| VULCÃO | `319, 316, 319, 320` | manchas cinza com um ponto laranja; **sem brasa visível** |
| CASTELO | `133, 268` | **quadrado bege** + engrenagem escura |
| FÁBRICA | `180, 129, 180, 264, 180` | 3 engradados + cristal azul (cristal em fábrica) |
| EPÍLOGO / NÚCLEO | `129, 156, 130, 158` | 3 engradados |

### A cutscene está vazia por construção

Em `02-cutscene.png`, `cena-5-vulcao.png` e `cena-6-espaco.png`: **~85% da tela
é preto puro**, os objetos ocupam ~55px numa tela de 1280, e o "retrato" é um
anel vazio desenhado por `arc`. O `veu` de 0.15 (`terrain.ts:663`) não faz nada
porque o fundo já é `#000`. O `brasa` do Vulcão (radial a 0.45) é invisível
sobre preto.

---

## 6. P1 — saturação invertida e perspectiva incompatível

```
cenário / cutscene    sat 55–84%     (copa, lava, quadrado do castelo)
personagens           sat 22–57%
terreno               sat  9–30%
```

A coisa mais saturada da tela é o fundo. A AGENTS.md define
*"inimigos: cores dessaturadas, nunca neon"* e *"máximo 3–4 cores ativas por
tela"* — está invertido no que importa: o cenário grita, o chão sussurra.

**Perspectiva:** os personagens do Kenney são **vista de cima** (dá para ver o
topo da cabeça e o ombro; o cano sai lateral). O Screaming Brain é **oblíquo,
com altura visível**. São dois projetos de câmera incompatíveis, e nenhum tint
resolve. Some-se o nível de detalhe: argamassa, tijolo e reboco contra vetor
chapado de 33×43. É a origem do "personagem achatado no chão" que
`sprites.ts:549-553` já tentava explicar por rotação.

---

## 7. P3 — dívida

- **`public/assets/sprites/tiles/`** (`dirt1`, `dirt2`, `grass1`, `grass2`,
  `water1`, 7KB) — **zero chamadores** em `src/` ou `tools/`. Resíduo do Kenney
  Roguelike.
- **`WALL_TILES`** — só consumido por teste; caminho de runtime inalcançável.
- **`biome.floorTiles`** — o fallback aponta para tiles chapados e saturados
  (`1,2,17` verde `#00c020`; `3,4` azul; `13` laranja; `89-92` moldura laranja).
  Se o dungeon falhar, o chão vira neon.
- **`semAssetQuebrado.test.ts`** — prova que o arquivo chega ao `dist` com >0
  byte. Não prova que o tile serve ao papel que ele cumpre.

---

## 8. Correções sugeridas, em ordem

1. **Reprocessar o tileset em vez de trocar de pack.** Em `extract_tiles.py`:
   escolher a faixa de miolo e cortar a faixa de borda. Custo zero de download e
   mata a grade (§1). Reproduzir antes do fix, como manda a regra de "reproduzir
   no instrumento menor".

2. **Reduzir para 2–3 tiles por material e variar por rotação/espelho em
   runtime.** 4 variantes de graça a partir de 1 tile, e quebra o período visível
   que hoje aparece em `castelo-000.png`.

3. **Parede: uma única fonte de altura.** Ou o tile traz o volume e
   `drawWallEdges` sai, ou o contrário — hoje os dois. E remover a claraboia
   (retângulos cinza que leem como ruído) e reduzir a face superior de 14px.

4. **Dar 16 pares (piso, parede) distintos.** 8×6 = 48 combinações disponíveis;
   hoje 2 pares são idênticos e 1 piso cobre 5 biomas. Escolher por leitura:
   hospital não é chapa de metal, caverna não é tijolo.

5. **Refazer a Rodovia (§4).** asfalto como piso, faixa contínua de eixo
   (`30`/`55-58` amarela ou `34`/`37` branca), guarda-corpo (`307-314`), carro
   abandonado (`474-478`) como prop destrutível, e um mapa com pista contínua em
   vez de labirinto de salas.

6. **Portão novo: `tiles.test.ts`.** Três asserções que pegam §1, §4.2, §5 e §6:
   - **costura** — a borda de um tile de piso não pode ser mais escura que
     `miolo − 30`;
   - **papel** — tile usado como preenchimento (parede/chão) precisa de ≥85% de
     cobertura; pega `335`, `415`, `110` automaticamente;
   - **hierarquia** — teto de saturação para decor e objeto de cutscene; impede
     que o quadrado bege vire o objeto mais claro do jogo.

7. **Reescrever `WALL_TILES`, `spriteFor`, `HAZARD_SPRITES` e `CENAS_CUTSCENE`
   com curadoria visual de verdade.** Regra: nenhuma tile entra numa dessas
   tabelas sem ter sido vista com zoom. `tools/shots/tiles_*.png` é a folha de
   referência existente.

8. **Cutscene com profundidade.** 3 camadas com valor decrescente em vez de 2
   fileiras na mesma escala, e uma camada de atmosfera para o objeto estar sobre
   informação em vez de sobre preto. O anel do retrato: sprite ou fora.

9. **Perspectiva — decisão de direção de arte, do dono.** Manter o Kenney de
   cima e trocar o terreno por tiles de vista de cima, ou manter o Screaming
   Brain e trocar o pack de personagem para um da mesma projeção. Não dá para os
   dois, e é a origem do §6.

---

## 9. Backlog

Extraído para `TODO.md`. Resumo por prioridade:

| # | item | arquivo |
|---|---|---|
| 1 | fatiado do piso: miolo, sem borda assada | `tools/extract_tiles.py` |
| 2 | `tiles.test.ts` — costura, papel, hierarquia | `src/__tests__/` |
| 3 | parede com fonte única de altura; sair a claraboia | `terrain.ts` |
| 4 | 16 pares (piso, parede) distintos | `maps.ts` |
| 5 | Rodovia: asfalto, eixo, guarda-corpo, carro, mapa | `maps.ts`, `terrain.ts`, `props.ts` |
| 6 | reescrever as 4 tabelas de tile por curadoria visual | `terrain.ts` |
| 7 | remover `public/assets/sprites/tiles/` (sem chamador) | `assets` |
| 8 | remover `WALL_TILES` ou torná-lo alcançável | `terrain.ts`, `terrain.test.ts` |
| 9 | reescrever ou remover `biome.floorTiles` | `maps.ts` |
| 10 | decisão de perspectiva (chefe do projeto) | — |