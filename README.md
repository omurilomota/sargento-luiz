# Bubble Shooter

> Top-down shooter **pós-apocalíptico** com progressão roguelite.
> TypeScript + Vite + Canvas 2D. Tudo em canvas — não existe HUD em DOM.

Você não limpa corredores: você luta por **terreno**. Cada fase é um mapa de
30×20 células (1920×1280 px, maior que a tela) com paredes, cobertura, barris e
hazards que mudam a leitura de cada tiro. Onde você fica é a decisão.

A direção do jogo está em [`docs/DESIGN.md`](docs/DESIGN.md).

## Gameplay

- **Mover:** WASD ou setas · **Mirar:** mouse · **Atirar:** botão esquerdo
- **Habilidades:** `Espaço` dash (segue o movimento) · `F` escudo · `E` fúria
- **Recarregar:** `R` (automático ao esvaziar o pente) · **Pausa:** `Esc`
- **Som:** `M` música · `S` efeitos (toggle persistente)
- **Dificuldade:** cada fase tem hazard e objetivo próprios — sobreviver,
  destruir ninhos ou chegar na zona. Nem toda fase é "mate todo mundo".

## Fases

| # | Fase | Hazard | Objetivo | Boss |
|---|---|---|---|---|
| 1 | Cidade em Ruínas | detritos | limpar a área | — |
| 2 | Floresta | névoa | limpar a área | ALPHA WOLF |
| 3 | Caverna | escuridão | destruir 3 ninhos | CRYSTAL QUEEN |
| 4 | Fábrica | eletricidade | sobreviver 45s | SENTINEL |
| 5 | Pântano | lama | limpar a área | LEVIATHAN |
| 6 | Castelo | espinhos | limpar a área | REI MUTANTE |
| 7 | Vulcão | lava | limpar a área | INFERNO PRIME |
| 8 | Espaço | baixa gravidade | limpar a área | MOTHERSHIP |
| 9 | Bunker Central | — | limpar a área | — |

## Modos

`1` Campanha · `2` Competitivo (contra bots) · `3` Local 2P · `4` Hardcore
(sem loja, sem cura entre ondas). `C` no menu continua o jogo salvo.

## Armas

Todas municiadas, com recarga. A classe de arma define o sprite do cano e o
timbre do som.

| Arma | Dano | Cadência | Pente | Projéteis | Preço | Especial |
|---|---|---|---|---|---|---|
| Pistola | 10 | 0.35s | 10 | 1 | — | inicial |
| Shotgun | 7 | 0.6s | 8 | 3 | 80 | leque |
| Gel | 6 | 0.28s | 20 | 2 | 180 | leque |
| Mina | 40 | 2.8s | 2 | 1 | 200 | explosivo, raio 140 |
| Metralhadora | 5 | 0.14s | 25 | 1 | 150 | — |
| Sniper | 40 | 1.2s | 4 | 1 | 200 | pierce |
| Laser | 3 | 0.06s | 40 | 1 | 250 | pierce |
| Granada | 40 | 1.4s | 3 | 1 | 250 | explosivo |
| Raios | 6 | 0.25s | 15 | 2 | 300 | pierce |
| RPG | 65 | 1.8s | 2 | 1 | 350 | explosivo |
| BFG | 80 | 2.0s | 1 | 5 | 999 | **secreta** (só após completar o jogo) |

Entre as fases a loja vende 19 upgrades permanentes (vida, velocidade, dano,
escudo, magnetismo, crítico, pierce, armadura, regeneração, recarga rápida) e
skins. Certain combinações arma+upgrade viram **combos** com bônus próprio.

## Como rodar

```bash
npm install
npm run dev      # desenvolvimento com hot reload
npm run build    # build de produção (tsc + vite build)
npm test         # vitest
npx tsc --noEmit # type check
```

Os mapas são validados por script — para regenerar:

```bash
python3 tools/genmaps.py    # 9 mapas: largura, borda fechada, BFS
python3 tools/genmusic.py   # 4 faixas OGG (precisa de ffmpeg)
```

## Estrutura

```
src/
├── main.ts        orquestrador: loop, input, update/draw
├── maps.ts        dados dos 9 mapas + paletas de bioma
├── config.ts      fases, inimigos, armas, upgrades, power-ups
├── core/          constantes de balanceamento e paleta
├── entities/      player, bullet, coin
├── systems/       tilemap, camera, terrain, props, objectives, boss,
│                  collision, audio, renderer, e mais
├── ui/            hud.ts (HUD canvas), shop.ts (getShopLayout)
└── __tests__/     colisão swept, layout de loja/menu, validação de mapas
tools/             geradores de mapa e música
public/assets/     sprites (Kenney CC0) e música (CC0)
```

Três coisas que valem saber antes de mexer:

- **Assets têm que estar em `public/`.** Na raiz, `vite build` não copia e o
  jogo fica sem sprite só em produção.
- **A geometria de cada tela tem uma função só.** Draw e hit-test consomem o
  mesmo `getShopLayout` / `getMenuLayout`. Divergir entre os dois foi o que
  fazia a loja comprar a linha de cima.
- **Tiles do Kenney têm numeração com buracos** e o nome usa pad de 2 dígitos.
  Só carregue números que você viu no disco — `TILE_NUMBERS` em
  `src/systems/sprites.ts` é a lista curada e testada.

## Licença

Código do projeto: uso livre.
Assets: ver [`public/assets/CREDITS.md`](public/assets/CREDITS.md) — sprites do
Kenney Top-down Shooter (CC0), música original do projeto (CC0), SFX
inteiramente procedurais via Web Audio API.