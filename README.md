# SARGENTO LUIZ — Pós-Apocalíptico

> Top-down survival shooter com progressão roguelite, em **TypeScript + Vite + Canvas 2D**.
> Tudo em canvas — não existe HUD em DOM. 16 fases, 16 chefes, 13 armas.

Você não limpa corredores: você luta por **terreno**. Cada fase é um mapa de
30×20 células (1920×1280 px, maior que a tela), com paredes, cobertura, barris
e eventos climáticos que mudam a leitura de cada tiro. Onde você fica é a decisão.

Jogar no navegador:
- **itch.io:** https://omurilomota.itch.io/sargento-luis
- **Vercel:** https://sargento-luiz.vercel.app

## Controles

| Tecla | Ação |
|---|---|
| `WASD` / setas | mover |
| Mouse | mirar |
| Botão esquerdo | atirar (segure) |
| `Espaço` | dash |
| `E` | escudo |
| `F` | fúria (segredo: abre na história da Fábrica) |
| `R` | recarregar |
| `1`–`9` / `Q` | trocar de arma |
| `TAB` | ficha da arma (DPS real + mapa) |
| `H` | medkit |
| `M` / `S` | música / efeitos |
| `O` | configurações (também na loja) |
| `D` | modo desenvolvedor (senha: `desenvolvefacil123`) |
| `Esc` | pausa |

## As 16 fases

| # | Fase | Hazard | Objetivo | Chefe |
|---|---|---|---|---|
| 1 | Cidade em Ruínas | detritos | limpar | VIGIA |
| 2 | Rodovia | — | sobreviver 30s | PEDAGIÁRIO |
| 3 | Floresta | névoa | limpar | PALE CROCODILE |
| 4 | Hospital de Campanha | névoa | limpar | CIRURGIÃO |
| 5 | Caverna | escuridão | destruir 3 ninhos | CRYSTAL QUEEN |
| 6 | Fábrica | eletricidade | sobreviver 45s | SENTINEL |
| 7 | Pátio de Trens | eletricidade | destruir 3 ninhos | MAQUINISTA |
| 8 | Ponte | baixa gravidade | chegar à zona | GÁRGULA |
| 9 | Pântano | lama | limpar | LEVIATHAN |
| 10 | Refinaria | lava | bombear 2L de combustível | TORRE |
| 11 | Subestação | eletricidade | sobreviver 35s | TRANSFORMADOR |
| 12 | Vulcão | lava | chegar à zona | INFERNO PRIME |
| 13 | Porto | névoa | destruir 3 ninhos | CAPITÃO |
| 14 | Castelo | espinhos | proteger o foguete | REI MUTANTE |
| 15 | Espaço | baixa gravidade | limpar | MOTHERSHIP |
| 16 | NÚCLEO-CENTRAL | — | limpar | NÚCLEO (desfile de 4 chefes) |

O Porto tem mar animado, barcos derivando e garças andando. Na Refinaria você
fica em cima do tambor bombeando 500ml por vez — e sai encharcado de combustível.
O foguete enche no Porto, é consertado no Castelo e a decolagem roda junto com
o diálogo final.

Eventos climáticos: terremoto, raio/trovão, tempestade (com chuva sonora e
poças escorregadias), tornado, chuva de cinzas e frio extremo.

## Modos

`1` Campanha · `2` Competitivo (bots) · `3` Local 2P · `4` Hardcore (sem loja,
sem cura entre ondas). `C` no menu continua o save.

## Armas

Todas municiadas, com recarga. A **família** define pose, projétil e som; a
**condição** (quebrada → lendária) muda dano, dispersão, som e preço.
Granada, Mina e RPG são **arremessáveis** — saem da mão, não do cano.

| Arma | Dano | Cadência | Pente | Projéteis | Preço | Especial |
|---|---|---|---|---|---|---|
| Pistola | 12 | 0.35s | 10 | 1 | 30 | inicial |
| Shotgun | 9 | 0.6s | 8 | 3 | 80 | leque |
| Metralhadora | 6 | 0.14s | 25 | 1 | 150 | — |
| Sniper | 50 | 1.2s | 4 | 1 | 200 | penetra |
| Laser | 2 | 0.06s | 40 | 1 | 250 | penetra |
| Raios | 4 | 0.25s | 15 | 2 | 300 | penetra |
| Gel | 8 | 0.28s | 20 | 2 | 180 | — |
| Granada | 42 | 1.4s | 3 | 1 | 250 | explosivo (raio 110), arremessável |
| Mina | 44 | 2.8s | 2 | 1 | 200 | explosivo (raio 140), arremessável |
| RPG | 70 | 1.8s | 2 | 1 | 350 | explosivo (raio 140), arremessável |
| BFG | 38 | 2.0s | 1 | 5 | 999 | **secreta**, explosiva |
| M. Quebrada | 5 | 0.3s | 30 | 1 | — | encasquilha |
| Destruidor | 110 | 1.6s | 3 | corpo a corpo | — | **secreto**, martelo do Luiz |

Acessórios aparecem **montados na arma**: ótica (mira), muzzle (freio),
empunhadura (cabo) e carregador (pente). A loja vende 3 perks por visita,
skins, peças, medkits e serviços (contratado, torreta, cachorro de guarda).

## Progressão

XP por abate, onda e fase. Cada nível dá 1 ponto para a árvore de talentos
(3 galhos × 2 nós) ou a escada de perks (4 ramos, 5 degraus + especial).
Combos entre perks e armas dão bônus próprios. Tudo persiste no save local.

## Como rodar

```bash
npm install
npm run dev        # desenvolvimento com hot reload
npm run build      # build de produção (tsc + vite build)
npm test           # suíte Vitest (inclui os 5 portões anti-IA)
npx tsc --noEmit   # type check
```

As provas de tela abrem os PNGs e falham se algo estiver ilegível:

```bash
npm run visual     # 9 screenshots, zero 404/pageerror
node tools/story-proof.mjs   # cutscenes de todas as fases (com CHROME_PATH)
npm run fases      # mede sobrevivência/onda/dano das 16 fases
npm run sessao     # sessão longa com telemetria
npm run hud        # HUD cabe em 4 resoluções
npm run loja       # texto e seções da loja (3 scrolls)
npm run variedade  # variação de inimigos por bioma
```

O CI (`.github/workflows/ci.yml`) roda `tsc --noEmit` + testes + build a cada
push em `develop`/`main`.

```bash
python3 tools/genmaps.py    # valida/regenera os 16 mapas
```

## Estrutura

```
src/
├── main.ts        orquestrador: loop, input, update/draw
├── config.ts      fases, inimigos, armas, peças, power-ups
├── maps.ts        dados dos 16 mapas + paletas de bioma
├── core/          constantes de balanceamento e paleta
├── entities/      player, bullet, coin
├── systems/       tilemap, câmera, terreno, props, objetivos, boss,
│                  colisão, áudio, renderer, chuva, trem, cais...
├── ui/            hud.ts (HUD canvas), shop.ts (getShopLayout)
└── __tests__/     colisão, layout, mapas, portões anti-IA
tools/             harnesses Playwright + geradores
public/assets/     sprites e áudio (ver CREDITS.md)
site/              página estática do projeto
```

Três coisas que valem saber antes de mexer:

- **Assets têm que estar em `public/`.** Na raiz, `vite build` não copia.
- **A geometria de cada tela tem uma função só.** Draw e hit-test consomem o
  mesmo `getShopLayout` / `getMenuLayout`.
- **Visual vem de asset, nunca de código.** Procedural só como fallback
  declarado. Regra 16: mudança de render exige `npm run visual` com PNG aberto.

## Licença e contribuição

**Código: copyright (c) 2026 Murilo Mota — todos os direitos reservados.**
Não é permitido copiar, modificar ou distribuir sem autorização escrita.
Contribuições via PR são bem-vindas — leia [`CONTRIBUTING.md`](CONTRIBUTING.md).

Assets de terceiros mantêm suas licenças originais (Kenney CC0, Eric Matyas
royalty-free com atribuição, Vincent Sevedge e harrison-lord CC-BY 3.0,
isaiah658 CC0, LPC CC0, Kay Lousberg CC0). Créditos completos em
[`public/assets/CREDITS.md`](public/assets/CREDITS.md) e
[`public/assets/music/CREDITS.md`](public/assets/music/CREDITS.md).

[`AGENTS.md`](AGENTS.md) · [`STATUS.md`](STATUS.md) ·
[`docs/DESIGN.md`](docs/DESIGN.md) · [`docs/PREMISSA-V2.md`](docs/PREMISSA-V2.md)
