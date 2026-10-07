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

O manifesto das 29 chaves vive em `src/systems/audio.ts`
(`SFX_FILES`), e `src/__tests__/sfxAssets.test.ts` trava
a existência de cada arquivo no disco.

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

Atribuição exigida pela licença CC-BY 3.0 dos 4 tiros
(pistol, shotgun, sniper, enemyShoot):
"Gunshot Sounds by Vincent Sevedge —
opengameart.org/content/gunshot-sounds — CC-BY 3.0".