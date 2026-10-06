# BubbleGame — Status Geral do Projeto

> Atualizado: 2026-10-03 · branch `feature/v1.3-hud-bugfixes` · v1.4 (pós-review + pendências)

Direção do jogo: [`docs/DESIGN.md`](docs/DESIGN.md) ·
pendências: [`TODO.md`](TODO.md) ·
decisões autônomas: [`docs/DECISIONS.md`](docs/DECISIONS.md)

---

## Versão atual: v1.3 (geometria + HUD)

A v1.2 tinha 7 fases, 11 armas, 19 upgrades, 3 habilidades e 4 modos — e era
chato, porque **o campo de batalha era um retângulo vazio**: `collision.ts` só
tinha circle-circle, não existia parede, obstáculo, cobertura ou hazard em
nenhum lugar do código, e todo inimigo fazia seek direto no jogador. A v1.3
ataca isso primeiro.

## ✅ ENTREGUE NESTA VERSÃO

### Geometria (o que faltava de verdade)

- **Tilemap** 30×20 (1920×1280 px) com colisão círculo-vs-grid e **deslize por
  eixo** — sem isso o jogador trava na quina da parede
- **Flow field** (Dijkstra da célula do jogador) no lugar do seek direto: custo
  zero por inimigo e o empilhamento desaparece de brinde
- **Câmera** com follow/clamp e `screenToWorld` — sem ela a arma atira na
  direção errada quando o mapa é maior que a tela
- **Terreno prerenderizado** com tint por bioma: 1 `drawImage` por frame em vez
  de ~600 `drawImage`
- **Props destrutíveis**: caixote (moeda), barril com pavio de 0.9s e explosão
  em **cadeia de verdade** (cada barril alcançado também explode), ninho
  (objetivo de fase) — e com a paleta do bioma
- **9 mapas autorais**, cada um com hazard e objetivo próprios
- **9 hazards com efeito mecânico**: os 9 biomas têm efeito próprio, inclusive
  os dois que antes eram só número (`fog` e `debris`)
- **Objetivos de fase**: `clear` · `survive` · `destroy` · `protect` · `reach`,
  cada um com fase própria. O objetivo não encerra mais a fase: ele **libera o
  chefe**, e é o chefe que fecha a fase. Se o sobrevivente do `protect` cai, a
  fase reinicia
- **Cobertura real nas 9 fases**: o tiro de inimigo para em prop. Só o entulho da
  Cidade desmorona com o primeiro tiro
- **Boss data-driven**: **9 bosses** com padrão declarativo e telegrafia, cada
  um com sprite do seu bioma (antes os 9 caíam no fallback `zombie`) e com um
  anel no chão que o distingue do trash

### Bugs corrigidos

- Screen shake existia mas **nunca era aplicado** no `draw()` (offset fixo `{0,0}`)
- **ENTER cascateava estado**: `keys['enter']` ficava `true` no estado
  seguinte, então Game Over → ENTER → menu entrava na cutscene sozinho
- **Laser atravessava inimigos** (ponto-ponto a 1200px/s); agora a colisão de
  projétil é *swept*, por distância ponto-segmento
- **A loja comprava a linha de cima**: o draw usava `leftX=40, colW=w/2-60` e o
  clique usava `leftX=20, colW=w/2-40`. Agora ambos consomem `getShopLayout`
- **Menu: clicar num modo selecionava outro** — `height/2+i*50` no clique vs
  `H*0.28+i*modeSpacing` no draw. Agora ambos usam `getMenuLayout`
- **Assets não chegavam ao build**: `assets/` na raiz do projeto não é copiado
  pelo Vite, então as sprites funcionavam em `npm run dev` e davam 404 em
  produção. Movido para `public/`
- **Tiles nunca carregavam**: o nome usa pad de 2 dígitos (`tile_01.png`), não 3
- **Dash ia para onde a arma aponta**; agora segue a direção do movimento
- Log `[DANO]` pintado em tela durante o combate, removido
- **Telegrafia de boss nunca era exibida**: os 9 chefes declaravam um texto em
  `pattern[].telegraph` e a barra mostrava um "PREPARANDO..." fixo
- **Chefe não telegrafava a primeira ação**: `step` do runtime começava em `0`, o
  que fazia `step.index !== rt.step` ser falso no primeiro frame — o chefe
  ficava 2.6s em silêncio e atacava sem aviso
- **O game loop rodava duas vezes por frame**: `init()` estava escrito duas vezes
  no fim do main.ts, e cada chamada agenda o seu `requestAnimationFrame`
- **O objetivo encerrava a fase antes da fase existir**: o `protect` do Castelo
  terminava na onda 0 de 7 e o `survive` da Fábrica na onda 1 de 6, sem chefe
- **A curva de dificuldade não era uma curva**: as três últimas fases ficavam
  progressivamente mais baratas, e a final custava 24% a menos que a sétima
- **O pavio do barril não existia**: `updateBarrels` zerava o timer e detonava no
  frame seguinte à ignitação, e a cadeia de barril não encadeava — o barril
  alcançado morria sem explodir
- **A Intocável era impossível depois da primeira leva de dano**: o flag era
  zerado só quando já estava limpo, então gruda até o fim da partida
- **O terreno deslocava em tela larga**: a câmera já centraliza o mundo quando
  ele é menor que a viewport, e `drawTerrain` centralizava de novo — numa janela
  de 2560px o mapa de 1920px aparecia 320px à direita, com a borda cortada
- **A lanterna da Caverna ficava fora de lugar**: o overlay transladava a câmera
  duas vezes, então o furo do cone saía deslocado de (camX, camY). Só coincidia
  no canto do mapa, onde `camX` é 0
- **O protagonista só segurava a arma quando atirava**: a pose de parado era
  `stand`, que é uma das duas poses do pack sem arma. Além disso a sprite
  `weapon_*` desenhada na ponta duplicava o cano da pose e ficava sempre na
  horizontal (o `rotate(-angle)` anulava o `rotate(angle)` do corpo), e a linha
  branca de mira passava por cima da arma
- **Inimigo atirador aparecia desarmado fora do disparo**: `enemyPose` só usava
  pose armada nos 0.2s antes do tiro
- **Investida de chefe atravessava parede**: `updateBoss` escrevia em `e.x`/`e.y`
  direto, sem passar por `moveCircleBy`. Os quatro blocos de cobertura da praça
  do VIGIA eram inúteis porque o chefe saía da arena pela parede
- Relâmpago tirava 40 de dano sem nenhum feedback visual
- Tiro do Laser na cor errada (o `isCrit` agora é flag, não comparação de string)
- Chave presa ao voltar para a janela (`keyup` só era tratado em `playing`)
- `saveGame` gravava uma onda que o resume nunca lia

### HUD e layout

- **HUD 100% canvas** em grade de 3 colunas. Antes era metade HTML e metade
  desenhada, e as duas se sobrepunham: score no DOM em y≈16 sobre o minimapa em
  y=12..92, rodapé de 28px sobre o nome da arma em `height-20`
- 4 layers disputando os mesmos pixels foram para `ui/hud.ts`
- Faixa de aviso de evento ambiental (destrava o relâmpago invisível)

### Conteúdo

- Música procedural de 12 notas trocada por **4 faixas OGG** com crossfade
- Som distinto por habilidade (antes as três usavam `sfxPowerup`)
- Toggle de música/SFX no pause, com persistência
- 9 bosses com padrão data-driven, incluindo VIGIA (fase 1) e NÚCLEO (fase 9)
- Modos cortados de 7 para 4 (`survival`, `missions` e `bossrush` não tinham
  uma única função ligada)
- Créditos reais em `public/assets/CREDITS.md`

### Ferramentas

- `tools/genmaps.py` — gera e valida os 9 mapas (largura, borda fechada, P
  único, BFS até todo E/B/N)
- `tools/genmusic.py` — sintetiza as 4 faixas OGG a partir de uma semente fixa

## Testes

420 testes em 17 arquivos, cobrindo exatamente as regressões que já voltaram:

| Arquivo | Cobre |
|---|---|
| `collision.test.ts` | Colisão swept (tunneling), ponto-segmento, circle-circle |
| `boss.test.ts` | `updateBoss`: avanço por faixa de HP, telegrafia, `mines` acende barril, summon, e as 9 fases ligadas a um boss |
| `camera.test.ts` | clamp por eixo, lerp não atravessa o limite, mira desconta o shake |
| `objectives.test.ts` | os 5 tipos sabem quando terminam, `peekObjective` não muta, latch de `protect` |
| `dynamicDifficulty.test.ts` | guard de amostra, banda de pressão, ritmo do spawn |
| `assets.test.ts` | nomes de arquivo (pad de tile), sprite mapeado por tipo, tipo órfão |
| `props.test.ts` | os 3 tipos, dano, cadeia de barril, pavio de 0.9s, entulho |
| `terrain.test.ts` | `shade`, e o contrato de dado dos 9 biomas que o prerender consome |
| `balance.test.ts` | a curva de dificuldade das 9 fases cresce |
| `achievements.test.ts` | os 21 ids únicos e cada gatilho |
| `shopLayout.test.ts` | `getShopLayout`: sobreposição, colunas, hit-test bate com o draw |
| `menuLayout.test.ts` | `getMenuLayout`: índice do clique, cabimento em 4 resoluções |
| `mapValidation.test.ts` | 9 mapas: largura, borda, conectividade, contraste piso/parede, caminho de tile no disco |
| `saveSystem.test.ts` | round-trip do save, restauração depois do `resetShop`, upgrades do mesmo efeito substituindo em vez de empilhar, todo `effect` do config reconhecido |
| `weapons.test.ts` | teto de pierce e o custo de 25%, crítico ×1.5 com 60% de teto, qualidade/falha da Quebrada, jam + Reparo, medkit, armadura |
| `loot.test.ts` | taxa de drop por tipo, coleta e expiração, validade de toda recompensa, raridade do medkit, caixa do boss |
| `biome.test.ts` | todo hazard tem par na tabela de mods, os 3 de `takenMult` existem, DPS de Laser/Raios, inimigos de fase existem |
| `terrain.test.ts` (extra) | 8 biomas com tile de parede, todo tile em `TILE_NUMBERS`, min 2 tiles por bioma |

```
npm test            # 420 passando
npx tsc --noEmit    # 0 erros
npm run build       # ok
```

## ⏳ NÃO ENTREGUE (está no `TODO.md`)

- Modo competitivo online
- A curva de dificuldade é **monotônica, mas não uniforme**: os passos vão de
  +2% a +106%. O custo base das fases varia 10× entre a primeira e a última, e
  um multiplicador só não achata sem deixar o jogo uniforme. Monotônico é o
  contrato que `balance.test.ts` trava
- `main.ts` ainda é o orquestrador com 1300 linhas

Ver `TODO.md` para a lista completa e `docs/DESIGN.md` §10 para o que está
fora de escopo por decisão.