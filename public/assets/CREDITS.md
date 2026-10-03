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

Os personagens são vistos de cima e apontam para a direita, então são girados em
tempo de execução pela direção de mira. O pivô é o centro do corpo
(`BODY_PIVOT_X`/`BODY_PIVOT_Y` em `src/systems/sprites.ts`), não o centro da
imagem — pivotar pela imagem faria o personagem girar em volta do cano.

Detalhes do pack quemitteram bug e estão guardados em teste:

- A numeração dos tiles tem **buracos**: `tile_054`, `tile_081`, `tile_135`,
  `tile_162`, `tile_459`, `tile_485` e outros não existem. Pedir um intervalo em
  vez de uma lista curada dá 404. `TILE_NUMBERS` em `sprites.ts` é a lista
  curada, e `src/__tests__/mapValidation.test.ts` verifica que ela só contém
  números que existem.
- O pad do nome do arquivo é de **2 dígitos** (`tile_01.png`), não 3. Com pad 3
  todo tile de 1 a 99 dá 404 e o chão inteiro cai no fallback de cor chapada.

Parede, props e hazards **não** usam tiles do pack: tile de borda direcional não
serve como geometria legível, e o jogador precisa ler "isto bloqueia" num
olhar. Essas peças são desenhadas em `src/systems/terrain.ts` e
`src/systems/props.ts` e recebem o tint do bioma.

## Música

**Faixas originais deste projeto · CC0 1.0 Universal**

- `assets/music/menu.ogg` — 64s, ambiência lenta e vazia
- `assets/music/combat.ogg` — 44s, pulso de baixo em colcheias
- `assets/music/boss.ogg` — 39s, tensão cromática sem resolução
- `assets/music/shop.ogg` — 53s, acordes quentes

Ver `assets/music/CREDITS.md` para o método de geração e a licença.

## Áudio de efeito

100% procedural via **Web Audio API** (`src/systems/audio.ts`). Não há arquivo de
SFX no repositório — cada arma e cada ação tem timbre e envelope próprios,
gerados em runtime.