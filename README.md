# SARGENTO LUIZ

> Top-down shooter **pós-apocalíptico** com progressão roguelite.
> TypeScript + Vite + Canvas 2D. Tudo em canvas — não existe HUD em DOM.

Você não limpa corredores: você luta por **terreno**. Cada fase é um mapa de
30×20 células (1920×1280 px, maior que a tela) com paredes, cobertura, barris e
hazards que mudam a leitura de cada tiro. Onde você fica é a decisão.

A direção do jogo está em [`docs/DESIGN.md`](docs/DESIGN.md).

## Gameplay

- **Mover:** WASD ou setas · **Mirar:** mouse · **Atirar:** botão esquerdo
- **Habilidades:** `Espaço` dash (segue o movimento) · `F` escudo · `E` — a
  fúria é segredo: ela abre na história
- **Armas:** `1`-`9` ou `Q` (anterior) para trocar · **Ficha:** `TAB` (DPS real + mapa)
- **Recarregar:** `R` (automático ao esvaziar o pente) · **Pausa:** `Esc`
- **Som:** `M` música · `S` efeitos (toggle persistente)
- **Dificuldade:** cada fase tem hazard e objetivo próprios — sobreviver,
  destruir ninhos, proteger um sobrevivente ou chegar à zona. Nem toda fase é
  "mate todo mundo".

## Fases

| # | Fase | Hazard | Objetivo | Boss |
|---|---|---|---|---|
| 1 | Cidade em Ruínas | detritos | limpar a área | VIGIA |
| 2 | Rodovia | — | sobreviver 30s | PEDAGIÁRIO |
| 3 | Floresta | névoa | limpar a área | ALPHA WOLF |
| 4 | Hospital de Campanha | névoa | limpar a área | FERNANDO INFECTADO |
| 5 | Caverna | escuridão | destruir 3 ninhos | CRYSTAL QUEEN |
| 6 | Fábrica | eletricidade | sobreviver 45s | SENTINEL |
| 7 | Pátio de Trens | eletricidade | destruir 3 ninhos | MAQUINISTA |
| 8 | Ponte | baixa gravidade | chegar à zona | GÁRGULA |
| 9 | Pântano | lama | limpar a área | LEVIATHAN |
| 10 | Refinaria | lava | limpar a área | TORRE |
| 11 | Subestação | eletricidade | sobreviver 35s | TRANSFORMADOR |
| 12 | Vulcão | lava | chegar à zona | INFERNO PRIME |
| 13 | Porto | névoa | destruir 3 ninhos | CAPITÃO |
| 14 | Castelo | espinhos | proteger o foguete | REI MUTANTE |
| 15 | Espaço | baixa gravidade | limpar a área | MOTHERSHIP |
| 16 | NÚCLEO-CENTRAL | — | limpar a área | NÚCLEO (desfile: INFERNO PRIME → REI MUTANTE → MOTHERSHIP → NÚCLEO) |

O foguete enche **tanque** no Porto, é **consertado** no Castelo e voa —
o respiro do Castelo é a sequência de decolagem (céu azul → azul e preto →
a estação chegando).

## Modos

`1` Campanha · `2` Competitivo (contra bots) · `3` Local 2P · `4` Hardcore
(sem loja, sem cura entre ondas). `C` no menu continua o jogo salvo.

## Armas

Todas municiadas, com recarga. A **família** da arma define a pose do
personagem, o sprite do projétil e o timbre do som; a **condição** (quebrada a
lendária) muda dano, dispersão, som e preço.

| Arma | Dano | Cadência | Pente | Projéteis | Preço | Especial |
|---|---|---|---|---|---|---|
| Pistola | 12 | 0.35s | 10 | 1 | 30 | inicial |
| Shotgun | 9 | 0.6s | 8 | 3 | 80 | leque |
| Gel | 8 | 0.28s | 20 | 2 | 180 | leque |
| Mina | 50 | 2.8s | 2 | 1 | 200 | explosivo, raio 140 |
| Metralhadora | 6 | 0.14s | 25 | 1 | 150 | — |
| Sniper | 50 | 1.2s | 4 | 1 | 200 | pierce |
| Laser | 2 | 0.06s | 40 | 1 | 250 | pierce |
| Granada | 50 | 1.4s | 3 | 1 | 250 | explosivo, raio 110 |
| Raios | 4 | 0.25s | 15 | 2 | 300 | pierce |
| RPG | 81 | 1.8s | 2 | 1 | 350 | explosivo, raio 140 |
| BFG | 100 | 2.0s | 1 | 5 | 999 | **secreta** |
| M. Quebrada | 5 | 0.3s | 30 | 1 | — | quebrada (encasquilha) |
| Destruidor | 120 | 1.6s | 3 | 1 | — | **secreta** (entregue na fase final) |

Entre as fases a loja oferece **3 perks por visita**, tirados de uma escada de
4 ramos (DANO, CORPO, PERNAS, MENTE) com 5 degraus e um especial no fim de cada
um. O degrau N só destrava depois do N−1, e 1 dos 3 sempre casa com a build que
você já tem. Também vende skins, peças e medkits.

Certos degraus com certas armas viram **combos** com bônus próprio.

## Progressão

XP por abate, por onda e por fase, somando nível. Cada nível dá 1 ponto, gasto
na **árvore de talentos** (3 galhos × 2 nós) ou na escada de perks. Tudo
persiste no save.

## Como rodar

```bash
npm install
npm run dev      # desenvolvimento com hot reload
npm run build    # build de produção (tsc + vite build)
npm test         # vitest (o número atual está no STATUS.md; inclui os 5 portões anti-IA)
npx tsc --noEmit # type check
```

Provas de tela — cada uma abre o PNG e falha se algo estiver ilegível:

```bash
npm run visual      # 8 screenshots, sem 404/pageerror
npm run perks       # escada de perks na loja
npm run hud         # texto do HUD cabe na caixa (4 resoluções)
npm run loja        # texto e seções da loja (3 scrolls)
npm run local2p     # tela de fim do versus: revanche e vencedor nos 2 sentidos
npm run variedade   # personagem de inimigo muda por fase
npm run fases       # mede as 16 fases: sobrevivência, onda e dano por fonte
npm run espaco      # reproduz o Game Over do Espaço (só vs. jogador sem desvio)
npm run sessao      # sessão longa com telemetria de dano por fonte
npm run servicos    # os 3 serviços da loja entregam o que vendem
npm run m2fluxo     # anúncio de onda sob a caixa, martelo forçado, vitória
npm run voo         # a decolagem do Castelo conta 5s e entrega a loja
npm run m5          # o grito do Maquinista, a fala de morte, o traje
```

O CI do GitHub Actions roda `tsc --noEmit` + a suíte inteira + o build a
cada push (ver `.github/workflows/ci.yml`).

Os mapas são validados por script — para regenerar:

```bash
python3 tools/genmaps.py    # 16 mapas: largura, borda fechada, BFS
python3 tools/genmusic.py   # 4 faixas OGG (precisa de ffmpeg)
```

## Estrutura

```
src/
├── main.ts        orquestrador: loop, input, update/draw
├── maps.ts        dados dos 16 mapas + paletas de bioma
├── config.ts      fases, inimigos, armas, peças, power-ups
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
Assets: ver [`public/assets/CREDITS.md`](public/assets/CREDITS.md) — sprites
Kenney, Screaming Brain e Kay Lousberg (CC0), música Eric Matyas (soundimage,
livre com atribuição), SFX em OGG de bancos CC0 e CC-BY (tiros: Vincent
Sevedge). Síntese procedural existe só como fallback de arquivo ausente.