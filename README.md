# SARGENTO RIOS

> Top-down shooter **pós-apocalíptico** com progressão roguelite.
> TypeScript + Vite + Canvas 2D. Tudo em canvas — não existe HUD em DOM.

Você não limpa corredores: você luta por **terreno**. Cada fase é um mapa de
30×20 células (1920×1280 px, maior que a tela) com paredes, cobertura, barris e
hazards que mudam a leitura de cada tiro. Onde você fica é a decisão.

A direção do jogo está em [`docs/DESIGN.md`](docs/DESIGN.md).

## Gameplay

- **Mover:** WASD ou setas · **Mirar:** mouse · **Atirar:** botão esquerdo
- **Habilidades:** `Espaço` dash (segue o movimento) · `F` escudo · `E` fúria
- **Armas:** `1`-`9` ou `Q` (anterior) para trocar · **Ficha:** `TAB` (DPS real + mapa)
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

Entre as fases a loja oferece **3 perks por visita**, tirados de uma escada de
4 ramos (DANO, CORPO, PERNAS, MENTE) com 5 degraus e um especial no fim de cada
um. O degrau N só destrava depois do N−1, e 1 dos 3 sempre casa com a build que
você já tem. Também vende skins, peças e medkits.

Certos degraus com certain armas viram **combos** com bônus próprio.

## Progressão

XP por abate, por onda e por fase, somando nível. Cada nível dá 1 ponto, gasto
na **árvore de talentos** (3 galhos × 2 nós) ou na escada de perks. Tudo
persiste no save.

## Como rodar

```bash
npm install
npm run dev      # desenvolvimento com hot reload
npm run build    # build de produção (tsc + vite build)
npm test         # vitest (856 testes, inclui os 5 portões anti-IA)
npx tsc --noEmit # type check
```

Provas de tela — cada uma abre o PNG e falha se algo estiver ilegível:

```bash
npm run visual      # 8 screenshots, sem 404/pageerror
npm run perks       # escada de perks na loja
npm run hud         # texto do HUD cabe na caixa (4 resoluções)
npm run loja        # texto e seções da loja (3 scrolls)
npm run variedade   # personagem de inimigo muda por fase
npm run espaco      # reproduz o Game Over do Espaço
npm run sessao      # telemetria de HP/onda (o bot morre na onda 1)
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