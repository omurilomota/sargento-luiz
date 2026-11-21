# Créditos de Assets

## Sons

**Kenney — Racing Pack** ·
[kenney.nl/assets/racing-pack](https://kenney.nl/assets/racing-pack) ·
**CC0 1.0 Universal** (mesmo autor do pack de personagens)

- `assets/sprites/props/carro_{00,01,02}.png` — as carcaças abandonadas
  da Rodovia e da Cidade (M6/J3b): três carros top-down do pack
  (sedan preto, hatch verde, compacto amarelo) rotacionados para pista
  horizontal e dessaturados a 45% — a cor de fábrica leria como
  concessionária; o jogo pede abandonado. São cobertura PERMANENTE:
  bloqueiam como a árvore, não queimam.

**Tsorthan Grove — Storm Arwen 2022** ·
[opengameart.org/content/storm-arwen-2022](https://opengameart.org/content/storm-arwen-2022) ·
**CC-BY 4.0**

- `assets/sfx/tornado.ogg` — o uivo do tornado da Cidade (M1): 7s cortados
  da cena de vendaval (gravação de campo da tempestade que bateu recorde de
  vento no Reino Unido, colhida pelo autor em risco de perder a janela e o
  gravador). Trecho t=88-95, fade de 0,6s entrando, normalizado ao banco.

**A ambiência dos biomas (M1)** — one-shots periódicos por fase, todos de
gravação real:

| som | fase | autor · licença |
|---|---|---|
| `vento.ogg` | Cidade em Ruínas | Tsorthan Grove · CC-BY 4.0 (mesma fonte do tornado — outro trecho da cena) |
| `gaivota.ogg` | Porto | Rango Mango · CC0 ("Solo Seagull Sound Effects") |
| `agua_cais.ogg` | Porto | qubodup · CC0 ("Water Waves"; gravação original de TransitKING) |
| `gotejamento.ogg` | Caverna | qubodup · CC0 ("Dripping Water Loop" — um ping cortado da gravação) |
| `apito.ogg` | Pátio de Trens | bart · CC0 ("Steam Whistle") |
| `maquinario.ogg` | Fábrica, Pátio de Trens | bart · CC-BY 3.0 ("Ambient Machinery 1" — o ruído elétrico) |
| `drone_vazio.ogg` | Espaço, NÚCLEO | jdagenet · CC-BY 3.0 ("Sci-Fi Drone Loop") |
| `alarme_estacao.ogg` | Espaço | ezduzziteh · CC0 ("Alarm 1") |

Todos mono OGG, cortados com fade e normalizados ao banco; o volume final
por contexto vem do `vol` em `SFX_FILES`.

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

**SpriteAttack — FreeArt Topdown Zombies** ·
[opengameart.org/content/freeart-topdown-zombies](https://opengameart.org/content/freeart-topdown-zombies) ·
**CC0 1.0 Universal**

- `assets/sprites/enemies/free{1,2,3}_*.png` — 3 corpos top-down para os
  tipos de zumbi que antes caíam todos no mesmo `zombie` do Kenney. Os SVGs
  originais foram rasterizados com `cairosvg`, recortados fora das molduras
  de guia, dessaturados a 62% (o pack de 2014 usa vermelho/azul vivos) e
  normalizados em 51×43 com o pivô (17,21) do `drawSpriteFit`. O `free3` é
  uma variante verde-musgo do `free2`: o SVG combinado só oferece um corpo
  rastejante horizontal para o terceiro zumbi, que ficaria baixo demais no
  `bodySize` de 38px. As 6 poses compartilham o mesmo quadro porque o pack é
  de corpo parado; o corpo inteiro gira na direção da perseguição.

**isaiah658 — 50+ Monsters Pack 2D** ·
[opengameart.org/content/50-monsters-pack-2d](https://opengameart.org/content/50-monsters-pack-2d) ·
**CC0 1.0 Universal**

- `assets/sprites/bosses/{reiMutante,leviathan,infernoPrime,crystalQueen,alphaWolf,nucleo}.png`
  — 6 monstros recortados da face "Front", dessaturados a 28% e escurecidos a
  78% para sentar na paleta pós-apocalíptica. Dão silhueta própria aos chefes
  que antes dividiam o corpo dos inimigos comuns. Atribuição: "isaiah658 —
  50+ Monsters Pack 2D — opengameart.org/content/50-monsters-pack-2d — CC0".

**Kenney — Pirate Pack** ·
[opengameart.org/content/pirate-pack-190](https://opengameart.org/content/pirate-pack-190) ·
**CC0 1.0 Universal**

- `assets/sprites/props/barco1.png`, `barco2.png` — dois barcos top-down
  recortados do pack (os tons cinza/azul, os mais sóbrios). Dão mar e barcos
  atracados ao Porto, que antes era só cais seco.

**LPC — Birds** ·
[opengameart.org/content/lpc-birds](https://opengameart.org/content/lpc-birds) ·
**CC0 1.0 Universal**

- `assets/sprites/props/garca.png`, `garca_clara.png` — garças top-down
  (primeiro frame da folha, recortado para 24×23). Vida no cais do Porto.

**harrison-lord — Top-down Dog + Simple Animation** ·
[opengameart.org/content/top-down-dog-simple-animation](https://opengameart.org/content/top-down-dog-simple-animation) ·
**CC-BY 3.0**

- `assets/sprites/enemies/pardal.png` — quadro top-down do cachorro (o 3º da
  animação, recortado do alpha original de 256×256 para 49×111 com 4px de
  folga). É o cachorro de guarda da loja: segue o jogador e morde quem encosta.
  A arte é pixel art cinza, mais escura que o pack Kenney — foi a única
  encontrada com ângulo realmente top-down e resolução aceitável (a de #214
  era de perfil ou 16×16). Atribuição: "harrison-lord — Top-down Dog + Simple
  Animation — opengameart.org/content/top-down-dog-simple-animation — CC-BY 3.0".

**SARGENTO LUIZ — trilho, trens e galão (autorais, CC0)**

- `assets/sprites/props/trilho_h_{00,01}.png` — tile de 64px com lastro,
  dormentes e bitola; desenhado em 4× e reduzido com Lanczos.
- `assets/sprites/props/trem_locomotiva_00.png` e `trem_vagao_00.png` —
  256×64, telhado, nervuras, escotilhas, ferrugem, engates e o “7” do
  manifesto. Gerados por `tools/gen_assets_trens.py`.
- `assets/sprites/props/combustivel_00.png` — galão 64×64 com alça, bico e
  gota, o ícone que identifica o tambor do objetivo `collect` da Refinaria.
  Gerado por `tools/gen_assets_combustivel.py`.

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

`destruidor.ogg` — mix autoral de `bossDeath.ogg` (Kenney, CC0,
pitch reduzido) e `explosion.ogg` (rubberduck, CC0) — o golpe do
Destruidor de Mundos, antes com o impacto comum de qualquer tiro.

`chuva.ogg` — "Rain (loopable)", **CC0**
(opengameart.org/content/rain-loopable), cortado para 6s. `trovao.ogg` —
"thunderclap" da **LPC**, **CC0** (lpc.opengameart.org/content/thunder),
cortado para 2.5s. Os dois tocam na tempestade — antes a chuva era só visual.

`spit.ogg` — "slime_12" do pacote **40 CC0 water/splash/slime SFX**
(opengameart.org/content/40-cc0-water-splash-slime-sfx), **CC0**. É o som
de cuspida dos recusantes — antes eles tocavam `enemyShoot.ogg` (barulho
de arma de fogo) mesmo cospindo gosma; agora o som segue o projétil.
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
| impacto | `assets/sfx/impacto.ogg` | Kenney Vleugels — corte e highpass de `hitStop.ogg` | kenney.nl/assets/impact-sounds | CC0 |
| abate | `assets/sfx/abate.ogg` | Kenney Vleugels + rubberduck (Thomas Deisz) — mix de `hitStop.ogg` e `explosion.ogg` | kenney.nl/assets/impact-sounds · opengameart.org/content/25-cc0-bang-firework-sfx | CC0 |
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

### A arma na mão e as casas (autoral, CC0)

- `assets/sprites/hand/mao_*.png` — a arma na mão de CADA arma (13),
  vista de cima: cano com coronha, comprimento e detalhe por família
  (luneta na sniper, caixa na metralhadora, boca larga no Destruidor).
  Por que não o pack: o Kay Lousberg é de PERFIL (mistura de
  perspectiva em vista de cima — DECISIONS #91 para o corpo).
- `assets/sprites/dungeon/parede_predio_*.png` — as CASAS da Cidade em
  Ruínas: laje com janelas quebradas e vidro estilhaçado, o vocabulário
  de prédio que o concreto de dungeon não tinha.
- `assets/sprites/dungeon/piso_hospital_*.png` e
  `parede_hospital_*.png` — o HOSPITAL com cara de hospital: ladrilho
  com rejunte e manchas de uso no chão, azulejo com rodapé na parede.
  O bioma virou o único claro do jogo (piso ~92 de luminância na tela,
  parede branca encardida ~120) — o "hospital abandonado" no relance.

Gerados por `tools/gen_assets_mao.py` e no mesmo molde do painel; a
paleta sóbria é por construção (dessaturação + matiz terrosa).

### A cenografia autoral de interior (tocha, painel, berço)

Quatro sprites autorais (**CC0**, autoria do projeto) em
`assets/sprites/props/`, gerados por `tools/gen_assets_cenografia.py` —
o pack Top-down Shooter não tem tocha, painel de estação nem berço
(medido na auditoria: os 185 objetos são caixa ou cilindro), e a caça
externa da sessão não achou pack 2D compatível:

| arquivo | o que é |
|---|---|
| `tocha_00.png` · `tocha_01.png` | braseiro do Castelo visto de cima: bacia de pedra irregular, carvão e chama âmbar |
| `painel_00.png` | módulo de piso da estação do Espaço: placa chanfrada com luzes apagadas e grade de ventilação |
| `berco_00.png` | berço das biomaquinas do NÚCLEO: laje com guias âmbar e fenda central |

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
