# BubbleGame — Roadmap

> Atualizado: 2026-10-03 · direção em [`docs/DESIGN.md`](docs/DESIGN.md)
> estado concreto em [`STATUS.md`](STATUS.md) · pendências em [`TODO.md`](TODO.md)

A ordem não é por "o que é mais legal", é por **o que destrava o resto**. Sem
geometria de campo, troca de paleta, tile novo ou sistema novo não muda nada —
então geometria vem antes de tudo.

---

## v1.3 — o campo de batalha ✅

**Por que primeiro:** o jogo tinha 7 fases e nenhum obstáculo. `collision.ts`
só tinha circle-circle; não existia parede, cobertura, hazard ou nada que
fizesse o jogador decidir onde ficar.

- [x] Tilemap 30×20, colisão círculo-vs-grid com deslize por eixo
- [x] Câmera com follow/clamp e `screenToWorld`
- [x] Flow field no lugar do seek direto (resolve empilhamento de graça)
- [x] Prerender do terreno com tint por bioma
- [x] Props destrutíveis: caixote, barril com cadeia, ninho
- [x] 9 mapas autorais, com hazard e objetivo próprios
- [x] Objetivos de fase: clear, survive, destroy, protect, reach
- [x] Boss data-driven (7 bosses) com telegrafia
- [x] HUD 100% canvas em grade de 3 colunas
- [x] Geometria única de loja e menu (draw e hit-test no mesmo layout)
- [x] Colisão swept de projétil
- [x] Assets em `public/` (build de produção copia)
- [x] 4 faixas OGG com crossfade + som por habilidade
- [x] Screen shake aplicado, ENTER sem cascata, dash com direção
- [x] 159 testes (swept, layout de loja/menu, validação de mapas, executor de boss)

## v1.4 — conteúdo que falta ⏳

Cada item destrava algo maior que ele mesmo.

- [x] **Fases 1 e 9 com boss.** VIGIA na Cidade (a primeira luta é uma aula:
      telegrafia que diz o que vem, investida como primeira coisa a desviar,
      praça com cobertura) e NÚCLEO no Bunker (tira uma opção por faixa, sem
      investida porque a galeria não comporta).
- [ ] **Boss que não morre em cima do jogador.** `killEnemy` no contato vale
      para todos, então um chefe que investe se suicida: dar de frente é uma
      estratégia válida, e vale para o ALPHA WOLF também. Não é regressão
      desta entrega — é a regra de contato do jogo, que ninguém revisou ainda.
- [ ] **`protect` com inimigo que caça o NPC.** O objetivo existe no código e
      no HUD, mas nenhum mapa o usa. Precisa de um inimigo com IA de alvo.
- [ ] **Cobertura que muda a decisão de rota.** Barril destrutível já existe;
      falta uma paleta de props por bioma (Caverna e Vulcão repetem).
- [x] **Balanceamento por bioma.** Os 9 hazards agora têm efeito mecânico
      próprio, inclusive `fog` e `debris`, que eram só número. Falta decidir se
      isso substitui diferença de stats entre fases.
- [ ] **Props como cobertura real nas outras fases.** Só a Cidade tem props que
      seguram tiro de inimigo; aplicar nas 9 muda o balanceamento de uma vez.
- [ ] **Achievements expandidos** (13 existem, o backlog pede mais).

## v2.0 — o que exige decisão de design, não implementação ⏳

- [ ] **Progressão durante a fase.** Hoje upgrade só entre fases, na loja.
      É a maior mudança de *sensação* de jogo e mexe em tudo.
- [ ] **Mapa procedural.** Os 9 são autorais. Geração exigiria decidir o que
      é "bom mapa" — hoje não existe critério.
- [ ] **Multiplayer online.** Não é networking, é o modelo de autoridade.
- [ ] **Áudio posicional.** Hoje tudo é estéreo.

---

## Fora de escopo (e por quê)

- **Side-scroller estilo Zombotron** (`docs/archive/MVP-ZOMBOTRON.md`) — direção
  abandonada quando o jogo virou top-down.
- **Raycaster** (`docs/archive/compose/`) — plano engine, engine removida.
- **Gerar mapa por IA.** O plano original citava "gerar os mapas com IA"; o
  `tools/genmaps.py` faz a parte mecânica (largura, borda, conectividade) e o
  layout continua escrito à mão. Gerar *layout* com IA produz exatamente a
  textura de "feito por máquina" que o AGENTS.md proíbe.

---

# Histórico

O que já foi entregue antes da v1.3, e o que foi entregue nela.

## ✅ CONCLUÍDO NA v1.2

### Core Gameplay
- [x] Sons para cada arma especificamente
- [x] Armas municiadas com recarga
- [x] Modo competitivo contra bots
- [x] Expansão da loja com upgrades
- [x] Sistema de moedas e skins
- [x] Combos e sinergias entre armas
- [x] Buff geral nos inimigos (progressão por onda)
- [x] Rebalanceamento de armas e preços

### Bugs Corrigidos
- [x] Bug de inimigos morrendo/dano aleatório
- [x] Loja com cliques errados
- [x] R para recarregar, furia movida
- [x] Dano de eventos ambientais sem visual
- [x] Tela inicial com itens sobrepondo
- [x] Diálogo passando rápido demais
- [x] Timer de cooldown dos poderes
- [x] Eventos sobrepondo HUD

### Novas Features (v1.2+)
- [x] Achievements/badges (13 conquistas)
- [x] Leaderboard local (top 10)
- [x] Boss com 3 fases de ataque
- [x] Modo hardcore
- [x] Arma secreta BFG
- [x] Animação de morte do jogador
- [x] Transição animada entre fases
- [x] Save/load (localStorage)
- [x] Minimap
- [x] Power-up drops
- [x] Dificuldade progressiva dinâmica
- [x] Escolhas na história (3 finais)
- [x] Diário de bordo do Rios
- [x] Tutorial interativo
- [x] Crítico visual com slow motion
- [x] Pausa com ESC

### Visual/Melhorias
- [x] HitFlash visual nos inimigos
- [x] Sombras no chão
- [x] Tiles de terreno por fase
- [x] Cutscenes com animações visuais
- [x] NPCs integrados ao gameplay
- [x] Tecla ç para avançar diálogos
- [x] Screen shake sutil
- [x] Partículas de poeira no terremoto
- [x] Zoom no boss

### Balanceamento
- [x] Nerfar Gel/Raios
- [x] Buffar Laser/RPG/Granada
- [x] Regen stacking corrigido
- [x] Combo health bonus wired
- [x] Cores ajustadas para paleta pós-apocalíptica

### Limpeza
- [x] Remover código morto (engine/, imports)
- [x] Limpar package.json
- [x] Unificar constantes
- [x] Mover velocidades para config

### Testes
- [x] 14 testes unitários (collision, utils)

---

## 📋 PENDENTE

### Prioridade ALTA
- [ ] `main.ts` ainda é uma god-function de 1222 linhas — `update()` e `draw()`
      ainda concentrates o orquestrador inteiro
- [ ] **`shooter` é tipo morto**: definido em `ENEMY_TYPES` (`config.ts:65`) e
      citado por nenhum `Phase`. Ou entra numa fase, ou sai do dicionário
- [ ] **Dificuldade dinâmica de verdade**: `dynamicDifficulty.ts` calcula
      `getPlayerAccuracy` e nada consome — só a previsão de posição está ligada
- [ ] `protect` sem inimigo que caça o NPC (ver v1.4)

### Prioridade MÉDIA
- [ ] Testes para `props`, `objectives` e `boss` — a lógica que mais mudou na
      v1.3 é a que menos tem cobertura
- [ ] Achievements expandidos (13 existem)
- [ ] Editor de fases visual

### Prioridade BAIXA
- [ ] Multiplayer online
- [ ] Áudio posicional

---

## 📊 MÉTRICAS DO PROJETO

| Métrica | Valor |
|---------|-------|
| Arquivos TypeScript | 49 |
| Linhas de código | ~10.500 |
| Testes unitários | 159 |
| Mapas / fases | 9 |
| Tipos de inimigos | 22 |
| Bosses | 9 |
| Armas | 11 |
| Upgrades | 19 |
| Combos | 8 |
| Achievements | 13 |
| Modos de jogo | 4 |

Números conferidos contra o disco em 2026-10-03.
