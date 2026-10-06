# Créditos de Assets

## Sprites

**Kenney — Top-down Shooter** · [kenney.nl](https://kenney.nl) · **CC0 1.0 Universal**
(domínio público: sem atribuição obrigatória, atribuída aqui por cortesia)

- `assets/sprites/topdown-shooter/PNG/<Personagem>/*.png` — 9 personagens × 6 poses
  (`stand`, `hold`, `gun`, `machine`, `reload`, `silencer`)
- `assets/sprites/topdown-shooter/PNG/weapon_*.png` — 3 classes de cano
  (`gun`, `machine`, `silencer`)
- `assets/sprites/topdown-shooter/PNG/Tiles/tile_*.png` — 524 tiles de 64×64
- `assets/sprites/topdown-shooter/License.txt` — licença original do pack

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

Ver `assets/music/CREDITS.md` para as URLs exatas e a forma de atribuição.
As versões antigas sintetizadas por `tools/genmusic.py` continuam disponíveis
no histórico do git como fallback.

## Áudio de efeito (SFX)

Origem: **freesound.org** — só licenças **CC0** ou **CC-BY**
(CC-BY-NC é proibido pelo projeto). Critérios de curadoria:
evento único, 0.1–1.5s, sem música. Formato OGG
(`ffmpeg -i in.wav -c:a libvorbis -q:a 4 out.ogg`).

O manifesto das 29 chaves vive em `src/systems/audio.ts`
(`SFX_FILES`). Enquanto o arquivo não existir em
`assets/sfx/`, o jogo toca o SFX procedural equivalente —
a curadoria é incremental, por batch, e o jogo nunca fica mudo.

| chave | arquivo | autor | URL | licença |
|---|---|---|---|---|
| pistol | `assets/sfx/pistol.ogg` | pendente | | |
| shotgun | `assets/sfx/shotgun.ogg` | pendente | | |
| machinegun | `assets/sfx/machinegun.ogg` | pendente | | |
| sniper | `assets/sfx/sniper.ogg` | pendente | | |
| laser | `assets/sfx/laser.ogg` | pendente | | |
| rpg | `assets/sfx/rpg.ogg` | pendente | | |
| raios | `assets/sfx/raios.ogg` | pendente | | |
| gel | `assets/sfx/gel.ogg` | pendente | | |
| granade | `assets/sfx/granade.ogg` | pendente | | |
| mina | `assets/sfx/mina.ogg` | pendente | | |
| enemyShoot | `assets/sfx/enemyShoot.ogg` | pendente | | |
| explosion | `assets/sfx/explosion.ogg` | pendente | | |
| bossDeath | `assets/sfx/bossDeath.ogg` | pendente | | |
| playerHit | `assets/sfx/playerHit.ogg` | pendente | | |
| coin | `assets/sfx/coin.ogg` | pendente | | |
| powerup | `assets/sfx/powerup.ogg` | pendente | | |
| achievement | `assets/sfx/achievement.ogg` | pendente | | |
| levelUp | `assets/sfx/levelUp.ogg` | pendente | | |
| waveStart | `assets/sfx/waveStart.ogg` | pendente | | |
| buy | `assets/sfx/buy.ogg` | pendente | | |
| error | `assets/sfx/error.ogg` | pendente | | |
| jammed | `assets/sfx/jammed.ogg` | pendente | | |
| gameOver | `assets/sfx/gameOver.ogg` | pendente | | |
| hitStop | `assets/sfx/hitStop.ogg` | pendente | | |
| dash | `assets/sfx/dash.ogg` | pendente | | |
| shield | `assets/sfx/shield.ogg` | pendente | | |
| fury | `assets/sfx/fury.ogg` | pendente | | |
| menuMove | `assets/sfx/menuMove.ogg` | pendente | | |
| menuSelect | `assets/sfx/menuSelect.ogg` | pendente | | |