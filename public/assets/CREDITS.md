# Créditos de Assets

## Sprites

**Screaming Brain Studios — Top Down Dungeon Pack** ·
[opengameart.org/content/top-down-dungeon-pack](https://opengameart.org/content/top-down-dungeon-pack) ·
**CC0 1.0 Universal** (domínio público, crédito nunca exigido)

- `assets/sprites/dungeon/*.png` — 160 tiles 64×64 com textura real:
  8 materiais de chão × 8 variações (pedra, terra, areia, grama, metal,
  madeira) e 6 materiais de parede × 16 variações (pedra, tijolo, concreto,
  metal, terra, areia)

Este pack substituiu o chão e a parede do Kenney. Motivo medido: **453 dos
520 tiles do Kenney Top-down Shooter são completamente chapados** (87%), e é
dessa chapada que vinha a costura de 64px visível no chão e a "treliça de
emendas" da capa do menu — a principal causa do visual "feito por IA".
Os tiles são seamless e 64×64 nativos (o Kenney Roguelike era 16×16 e viraria
borrão no upscale).

Fatiado por `tools/extract_tiles.py`, que também remove o fundo magenta e
descarta os tiles de autotile que o jogo não usa.

**Kenney Vleugels — Particle Pack** ·
[kenney.nl/assets/particle-pack](https://kenney.nl/assets/particle-pack) ·
**CC0 1.0** (mesmo autor do pack de personagens, então a consistência visual
está garantida)

- `assets/sprites/particles/*.png` — 19 sprites redimensionados para 64px:
  5 de muzzle flash, 5 de faísca, 5 de fumaça, 1 de clarão, 1 de queimado,
  1 de risco, 1 de corte

Substituem os `ctx.arc()` de `renderer.ts` no tiro, no muzzle e nas faíscas.
Redimensionados de 512px/80KB para 64px/3KB: o pack original somava 1,3 MB
para 19 arquivos que são desenhados com 20–40px na tela.

**Kenney — Platformer Art Deluxe** · [kenney.nl/assets/platformer-art-deluxe](https://kenney.nl/assets/platformer-art-deluxe) · **CC0 1.0 Universal**

- `assets/sprites/items/*.png` — moeda (`coinGold`) e 4 gemas (`gemRed`,
  `gemGreen`, `gemBlue`, `gemYellow`), 70px nativos

Entrou em 10/10 para pagar o último débito de arte de `renderer.ts`: a moeda
era um `ctx.arc()` mostarda com um `$` desenhado por cima e o power-up um
círculo com o símbolo. Estes sprites são flat cartoon do mesmo autor do pack de
personagens, então pertencem à camada de objetos do jogo; o chão/parede
continua sendo o Screaming Brain. O símbolo do power-up ficou como legenda
abaixo da gema — ele é texto de UI, e é o que distingue `botas` de `reflexos`.

**Michael J Pierce / IsometricRobot — Saturn V Pixel Rocket** ·
[opengameart.org/content/saturn-v-pixel-rocket](https://opengameart.org/content/saturn-v-pixel-rocket) ·
**CC-BY 3.0** (atribuição obrigatória: "Saturn V Pixel Rocket by Michael J
Pierce @ IsometricRobot.com")

- `assets/sprites/props/foguete.png` — o foguete do Castelo: o alvo que o
  jogador protege na fase (decisão do dono de 2026-10-12) e que voa na saída.
  O original é uma CENA de lançamento inteira (445×1641: foguete + torre de
  serviço + decks + pedestal, line-art cinza sobre branco). O primeiro corte
  era a cena INTEIRA reduzida (104×384, mesma proporção) — o dono viu o
  fundo branco e o "foguete torto": o corpo era um prédio em primeiro plano,
  e o bico era só a agulha no topo. Corrigido: recorte só do foguete
  (x 100-320, y 48-452 do original, 220×404 — a saia larga simétrica, cortada
  antes das pernas da torre e da retratação do lado direito) + flood-fill do
  fundo branco — os contornos de line-art selam o cone e o interior
  preenche, virando silhueta sólida. Asset PLACEHOLDER: o dono vai desenhar
  o foguete próprio e trocar.

A busca olhou primeiro os packs de espaço já no disco (Kenney Top-down
Shooter não tem foguete/forno de lançamento; o `foguete.png` de `bullets/` é
o projétil da RPG, não um veículo). O candidato "Damaged rocket" (CC-BY 4.0)
foi rejeitado por estilo: cartoon vetorial com aro roxo, incompatível com o
flat do jogo.

**Kenney — Top-down Shooter** · [kenney.nl](https://kenney.nl) · **CC0 1.0 Universal**
(domínio público: sem atribuição obrigatória, atribuída aqui por cortesia)

- `assets/sprites/topdown-shooter/PNG/<Personagem>/*.png` — 9 personagens × 6 poses
  (`stand`, `hold`, `gun`, `machine`, `reload`, `silencer`)
- `assets/sprites/topdown-shooter/PNG/weapon_*.png` — 3 classes de cano
  (`gun`, `machine`, `silencer`)
- `assets/sprites/topdown-shooter/PNG/Tiles/tile_*.png` — 524 tiles de 64×64
- `assets/sprites/topdown-shooter/License.txt` — licença original do pack

**Kenney — Tower Defense (Top-Down)** ·
[kenney.nl/assets/tower-defense-top-down](https://kenney.nl/assets/tower-defense-top-down) ·
**CC0 1.0 Universal** (domínio público, crédito por cortesia)

- `assets/sprites/props/torreta.png` — a torreta automática da loja (serviço
  M3). Fonte: tile 277 do pack, girado para o cano apontar para LESTE
  (ângulo 0 do mundo) e recomposto para o montante cair no pivô (17,21) que
  o `drawSpriteFit` usa. Mesmo autor do pack de personagens — consistência
  visual garantida.

**Kay Lousberg — 2D Guns** · [kaylousberg.itch.io/gun-assets](https://kaylousberg.itch.io/gun-assets) ·
[opengameart.org/content/2d-guns](https://opengameart.org/content/2d-guns) · **CC0 1.0**
(sem atribuição obrigatória, atribuída aqui por cortesia)

- `assets/sprites/weapons/*.png` — 6 armas (pistola, revólver, escopeta, sniper,
  submetralhadora, fuzil de assalto, granada), 3 tamanhos de bala
  (`small_bullet`, `medium_bullet`, `large_bullet`) e variantes de cor (`*2`)

O pack Kenney acima traz 3 sprites de arma para 12 armas no jogo e nenhum
projétil. Este cobre as duas lacunas: 6 famílias de arma e 3 de projétil. Os
personagens e tiles continuam sendo todos do Kenney — este pack só entra em
`assets/sprites/weapons/`.

> **Conferência pendente:** o estilo do Kay Lousberg é cartoon vetorial escuro,
> e o Kenney é mais suave. A compatibilidade visual precisa ser avaliada
> rodando o jogo; `assets.test.ts` garante que os arquivos existem, não que
> o conjunto fica bom. Se não fundir, o fallback é o Kenney Scribble Dungeons
> (CC0), também com armas.

Do pack o jogo usa principalmente os tiles:

- `assets/sprites/topdown-shooter/PNG/<Personagem>/*.png` — 9 personagens × 6 poses
  (`stand`, `hold`, `gun`, `machine`, `reload`, `silencer`)
- `assets/sprites/topdown-shooter/PNG/weapon_*.png` — 3 classes de cano
  (`gun`, `machine`, `silencer`)
- `assets/sprites/topdown-shooter/PNG/Tiles/tile_*.png` — tiles de 64×64
  (chão por bioma, paredes via `WALL_TILES`, hazards via `HAZARD_SPRITES`,
  decor via `spriteFor`, props via `PROP_SPRITES`)
- `assets/sprites/topdown-shooter/License.txt` — licença original do pack

Detalhes do pack que já custaram bug e estão guardados em teste:

- A numeração dos tiles tem **buracos**: `tile_054`, `tile_081`, `tile_135`,
  `tile_162`, `tile_459`, `tile_485` e outros não existem. Pedir um intervalo em
  vez de uma lista curada dá 404. `TILE_NUMBERS` em `sprites.ts` é a lista
  curada, e `src/__tests__/mapValidation.test.ts` verifica que ela só contém
  números que existem.
- O pad do nome do arquivo é de **2 dígitos** (`tile_01.png`), não 3. Com pad 3
  todo tile de 1 a 99 dá 404 e o chão inteiro cai no fallback de cor chapada.

## Música

**Eric Matyas — soundimage.org · livre com atribuição do autor**

- `assets/music/menu.ogg` — Mystical Ocean Puzzle Game (loop de ambiente)
- `assets/music/combat.ogg` — Automation (loop de combate)
- `assets/music/boss.ogg` — The Darkness Below (loop de boss)
- `assets/music/shop.ogg` — Puzzle Dreams (loop de loja)
- `assets/music/epilogo.ogg` — Autumn Changes (loop do epílogo e da tela de
  fim; MP3 original transcoded para OGG)

Ver `assets/music/CREDITS.md` para as URLs exatas e a forma de atribuição.
As versões antigas sintetizadas por `tools/genmusic.py` continuam disponíveis
no histórico do git como fallback.

## Áudio de efeito (SFX)

Origem: **Kenney.nl** (CC0), **OpenGameArt** (CC0) e
**OpenGameArt** (CC-BY 3.0 — os 4 tiros reais de
Vincent Sevedge, única fonte com atribuição obrigatória).
Critérios de curadoria: evento único, 0.1–2.0s, sem música,
tom pós-apocalíptico (sem neon, sem cartoon). Conversão:
mono, OGG Vorbis (`ffmpeg -i in -ac 1 -c:a libvorbis -q:a 4 out.ogg`),
nível normalizado por hierarquia (bossDeath mais alto,
UI mais suave). O fallback procedural em `audio.ts` é
mantido por design (regra 15): só entra se um arquivo
sumir — hoje ele nunca dispara.

O manifesto das 38 chaves vive em `src/systems/audio.ts`
(`SFX_FILES`), e `src/__tests__/sfxAssets.test.ts` trava
a existência de cada arquivo no disco.

As 9 de 10/10 (fecharam o `semProcedural`): 7 recargas por família — pente de
pistola, bomba de shotgun, fuzil de assalto, rifle, recarga genérica de pistola,
carregamento pesado de lançador e clique de mina —, o rangido de ferrugem e o
encaixe metálico da peça. Cada família ficou com um timbre próprio porque um
arquivo único para todas perderia a distinção que a síntese dava. Níveis: picos
entre −0.7 e −7.9 dB, no mesmo degrau do banco (tiro a 0 dB, UI em −8).

| chave | arquivo | autor | URL | licença |
|---|---|---|---|---|
| pistol | `assets/sfx/pistol.ogg` | Vincent Sevedge | opengameart.org/content/gunshot-sounds | CC-BY 3.0 |
| shotgun | `assets/sfx/shotgun.ogg` | Vincent Sevedge | opengameart.org/content/gunshot-sounds | CC-BY 3.0 |
| machinegun | `assets/sfx/machinegun.ogg` | Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney | opengameart.org/content/the-free-firearm-sound-library | CC0 |
| sniper | `assets/sfx/sniper.ogg` | Vincent Sevedge | opengameart.org/content/gunshot-sounds | CC-BY 3.0 |
| laser | `assets/sfx/laser.ogg` | Kenney Vleugels | kenney.nl/assets/sci-fi-sounds | CC0 |
| rpg | `assets/sfx/rpg.ogg` | Kenney Vleugels | kenney.nl/assets/sci-fi-sounds | CC0 |
| raios | `assets/sfx/raios.ogg` | Kenney Vleugels (`laserLarge_000`, mais grosso que o `laserRetro_000` 8-bit anterior) | kenney.nl/assets/sci-fi-sounds | CC0 |
| gel | `assets/sfx/gel.ogg` | Kenney Vleugels | kenney.nl/assets/sci-fi-sounds | CC0 |
| granade | `assets/sfx/granade.ogg` | rubberduck (Thomas Deisz) | opengameart.org/content/25-cc0-bang-firework-sfx | CC0 |
| mina | `assets/sfx/mina.ogg` | Kenney Vleugels | kenney.nl/assets/rpg-audio | CC0 |
| enemyShoot | `assets/sfx/enemyShoot.ogg` | Vincent Sevedge | opengameart.org/content/gunshot-sounds | CC-BY 3.0 |
| explosion | `assets/sfx/explosion.ogg` | rubberduck (Thomas Deisz) | opengameart.org/content/25-cc0-bang-firework-sfx | CC0 |
| risada | `assets/sfx/risada.ogg` | Supergeek ("Do you remember laughter?", 1ª variação "hahaha, huh?" fatiada por silêncio) | opengameart.org/content/do-you-remember-laughter | CC0 |
| ferramenta | `assets/sfx/ferramenta.ogg` | BMacZero (`rattle1`, Brian MacIntosh) | opengameart.org/content/mechanical-sounds | CC0 |
| foguete_lancamento | `assets/sfx/foguete_lancamento.ogg` | dklon (rocket_launch, 8-bit) | opengameart.org/content/rocket-launch-0 | CC-BY 3.0 |
| bossDeath | `assets/sfx/bossDeath.ogg` | Kenney Vleugels | kenney.nl/assets/sci-fi-sounds | CC0 |
| playerHit | `assets/sfx/playerHit.ogg` | Kenney Vleugels | kenney.nl/assets/impact-sounds | CC0 |
| coin | `assets/sfx/coin.ogg` | Kenney Vleugels | kenney.nl/assets/rpg-audio | CC0 |
| powerup | `assets/sfx/powerup.ogg` | Kenney Vleugels | kenney.nl/assets/interface-sounds | CC0 |
| achievement | `assets/sfx/achievement.ogg` | Kenney Vleugels | kenney.nl/assets/interface-sounds | CC0 |
| levelUp | `assets/sfx/levelUp.ogg` | Kenney Vleugels | kenney.nl/assets/interface-sounds | CC0 |
| waveStart | `assets/sfx/waveStart.ogg` | Kenney Vleugels | kenney.nl/assets/interface-sounds | CC0 |
| buy | `assets/sfx/buy.ogg` | Kenney Vleugels | kenney.nl/assets/interface-sounds | CC0 |
| error | `assets/sfx/error.ogg` | Kenney Vleugels | kenney.nl/assets/interface-sounds | CC0 |
| jammed | `assets/sfx/jammed.ogg` | Kenney Vleugels | kenney.nl/assets/interface-sounds | CC0 |
| gameOver | `assets/sfx/gameOver.ogg` | Kenney Vleugels | kenney.nl/assets/impact-sounds | CC0 |
| hitStop | `assets/sfx/hitStop.ogg` | Kenney Vleugels | kenney.nl/assets/impact-sounds | CC0 |
| dash | `assets/sfx/dash.ogg` | Kenney Vleugels | kenney.nl/assets/rpg-audio | CC0 |
| shield | `assets/sfx/shield.ogg` | Kenney Vleugels | kenney.nl/assets/sci-fi-sounds | CC0 |
| fury | `assets/sfx/fury.ogg` | Kenney Vleugels | kenney.nl/assets/sci-fi-sounds | CC0 |
| menuMove | `assets/sfx/menuMove.ogg` | Kenney Vleugels | kenney.nl/assets/interface-sounds | CC0 |
| menuSelect | `assets/sfx/menuSelect.ogg` | Kenney Vleugels | kenney.nl/assets/interface-sounds | CC0 |
| reload_pistola | `assets/sfx/reload_pistola.ogg` (`clipload1`) | bmaczero | opengameart.org/content/gun-reload-sound-effects | CC0 |
| reload_lancador | `assets/sfx/reload_lancador.ogg` (`clipload2`) | bmaczero | opengameart.org/content/gun-reload-sound-effects | CC0 |
| reload_escopeta | `assets/sfx/reload_escopeta.ogg` (`shotguncock_0`) | joaken | opengameart.org/content/gun-reload-sounds | CC0 |
| reload_metralhadora | `assets/sfx/reload_metralhadora.ogg` (`assaultriflereload1`) | joaken | opengameart.org/content/gun-reload-sounds | CC0 |
| reload_precisao | `assets/sfx/reload_precisao.ogg` (`gunreload1`) | joaken | opengameart.org/content/gun-reload-sounds | CC0 |
| reload_energia | `assets/sfx/reload_energia.ogg` (`reload`) | zer0sol | opengameart.org/content/handgun-reload-sound-effect | CC0 |
| reload_mina | `assets/sfx/reload_mina.ogg` (`metalClick`) | Kenney Vleugels | kenney.nl/assets/rpg-audio | CC0 |
| ferrugem | `assets/sfx/ferrugem.ogg` (`creak1`) | Kenney Vleugels | kenney.nl/assets/rpg-audio | CC0 |
| piece | `assets/sfx/piece.ogg` (`metalLatch`) | Kenney Vleugels | kenney.nl/assets/rpg-audio | CC0 |

Atribuição exigida pela licença CC-BY 3.0 dos 4 tiros
(pistol, shotgun, sniper, enemyShoot):
"Gunshot Sounds by Vincent Sevedge —
opengameart.org/content/gunshot-sounds — CC-BY 3.0".

## Assets autorais

Os tiles de asfalto da Rodovia (**CC0**, autoria do projeto) são os únicos
tiles de piso que não vêm do pack. O pack Kenney não tem asfalto: os sheets
Top Down Dungeon oferecem pedra, terra, areia, metal e vidro, e o tilesheet
Top-down Shooter só tem sinalização solta (tiles 261–268, setas e cunhas) sem
corpo de pista. Antes desses tiles a Rodovia tinha chão de pedra com 77
células decoradas pelo `tile_260` — uma marca laranja/cinza repetida, que lia
como padrão e não como estrada.

| arquivo | o que é | gerado por |
|---|---|---|
| `assets/sprites/dungeon/piso_asfalto_00.png` | asfalto liso (variante 1) | `tools/gen_assets_estrada.py` |
| `assets/sprites/dungeon/piso_asfalto_01.png` | asfalto com passagem de pneu | idem |
| `assets/sprites/dungeon/piso_asfalto_02.png` | asfalto com remendo claro | idem |
| `assets/sprites/dungeon/piso_asfalto_03.png` | asfalto rachado | idem |
| `assets/sprites/dungeon/piso_faixa_00.png` | faixa de pista (traço tracejado) | idem |
| `assets/sprites/dungeon/piso_borda_00.png` | linha de borda no topo do tile | idem |
| `assets/sprites/dungeon/piso_borda_01.png` | linha de borda na base do tile | idem |

Os tiles são gerados em **escala de cinza** de propósito: `applyTint` e
`tintTile` aplicam `saturation` com `#808080` antes do `multiply`, então a cor
não sobrevive ao pipeline — só a luminância. A estrada se lê pelo contraste
(corpo a 31, faixa e borda a 122 na tela, medido no shot da fase 2).

### As árvores da Floresta e do Pântano

Três tiles autoral (**CC0**, autoria do projeto) em
`assets/sprites/props/`, gerados por `tools/gen_assets_arvores.py`:

| arquivo | o que é |
|---|---|
| `arvore_00.png` | árvore viva, copa irregular com tronco e galhos (variante 1) |
| `arvore_01.png` | árvore viva, variante 2 |
| `arvore_morta_00.png` | árvore morta: tronco grosso e galhos sem copa |

O pack não tem vegetação. Medido: dos 524 tiles do tilesheet Top-down Shooter,
185 são objetos (alfa parcial) e todos são caixa ou cilindro — caixote, barril,
saco de areia, carro, parede. Os 17 tiles com verde dominante são peças de
**chão** (cobertura de alfa 94–97%) mais os ninhos 181–183, já usados como
prop do objetivo `destroy`. O manifesto do pack não nomeia nenhuma árvore.

A árvore é o **único prop que bloqueia passagem** (raio de colisão 20 contra
copa de raio 27 na sprite) e o único que **não toma dano**: é identidade de
bioma, não cobertura perecível — caixote e barril seguem destruíveis.

Ela **não leva o tint do bioma**, como o foguete. `tintSprite` multiplica a
luminância do tile pelo fator médio da cor do bioma (~0.26), e um tile autoral
morreria no mesmo multiplicador: o caixote do pack, com luminância 121 no PNG,
chega a 31 na tela do Pântano — igual ao piso. A copa autoral nasce a ~120 com
saturação de ~20% (verde-cinza sóbrio), que lê contra o piso a 31 sem virar o
objeto mais claro da fase.

O plantio (`tools/plantar_arvores.py`) passa por um portão de conectividade
**contínuo** antes de escrever o mapa: varre o segmento entre células vizinhas
e exige que um círculo de raio 30 — o maior inimigo comum, o magmaGolem — caiba
em todos os pontos. Sem ele um tronco no lugar errado sela um corredor e a onda
nunca fecha.
