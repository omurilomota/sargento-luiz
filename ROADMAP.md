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
- [x] 210 testes (swept, câmera, objetivo, executor de boss, asset, layout de loja/menu, dificuldade dinâmica, validação de mapas)

## v1.4 — conteúdo que falta ⏳

Cada item destrava algo maior que ele mesmo.

- [x] **Fases 1 e 9 com boss.** VIGIA na Cidade (a primeira luta é uma aula:
      telegrafia que diz o que vem, investida como primeira coisa a desviar,
      praça com cobertura) e NÚCLEO no Bunker (tira uma opção por faixa, sem
      investida porque a galeria não comporta).
- [x] **Boss que não morre em cima do jogador.** O contato só mata melee;
      chefe leva o dano e continua. Um chefe que investia se matava sozinho, e a
      investida telegrafada virava um presente para quem ficasse parado.
- [x] **`protect` com inimigo que caça o NPC.** O Castelo é a fase: o `archer`
      tem `huntsNpc` e ignora o flow field para ir direto no sobrevivente, e
      atira nele também; `knight` e `mage` continuam no jogador.
- [x] **`protect` com falha.** O sobrevivente cair reinicia a fase: mesmo mapa,
      onda zerada, sobrevivente novo. Um objetivo de escolta sem consequência
      não é escolta.
- [x] **Marcador de chefe no mundo.** Anel no chão, na linguagem das auras do
      jogador. Cor única (terracota) e não a do chefe: com a cor dele o anel do
      NÚCLEO sumia no piso do Bunker.
- [x] **Cobertura que muda a decisão de rota.** Paleta de props por bioma —
      madeira na Floresta, chapa na Fábrica, rocha na Caverna, basalto no Vulcão.
      Antes todo mundo era o mesmo engradado bege.
- [x] **Balanceamento por bioma.** A rampa agora é o número de ondas
      (3,4,5,5,6,6,7,7,8) e `Phase.difficulty` só corrige os 4 tipos que fugiam
      dela. `balance.test.ts` trava que a curva cresce.
- [x] **Props como cobertura real nas outras fases.** O tiro de inimigo para em
      prop nas 9. O que continua exclusivo da Cidade é o desmoronamento: entulho
      não aguenta tiro e cai inteiro com o primeiro.
- [x] **Achievements expandidos** (13 -> 21, sem sistema de tracking novo).

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
- [x] `main.ts`: `update()` foi de 463 para 252 linhas e o `init()` duplicado
      — que rodava o game loop duas vezes por frame — saiu. Ainda é um arquivo
      grande, mas agora é um orquestrador de passos nomeados, não um bloco só
- [ ] `main.ts` ainda concentra input, menu, loja, cutscene e save no mesmo
      arquivo. Extrair menu/loja é o próximo passo natural, mas é refactor de
      arquivo sem bug conhecido por trás
- [x] **`shooter` saiu do dicionário**: cada fase já tem atirador temático
      (spitter, crystal, robot, frog, archer, fireElemental, ufo), então um
      atirador genérico só diluiria a identidade da fase
- [x] **Dificuldade dinâmica de verdade**: `getSkillPressure()` alimenta o ritmo
      do spawn, com banda de 12% e nada antes de 20 tiros
- [x] `protect` com inimigo que caça o NPC (Castelo)
- [x] `reach` com mapa (Vulcão, zona a 15 células do spawn)

### Prioridade MÉDIA
- [x] Testes para `objectives`, `boss` e `camera` — a lógica que mais mudou na
      v1.3 era a que menos tinha cobertura
- [x] Testes para `props` (24) e `terrain` (98)
- [x] Testes para `balance`, `achievements`, `objectives`, `camera` e `assets`
- [x] Achievements expandidos (13 -> 21)
- [ ] Editor de fases visual — é uma ferramenta, não uma fase do jogo

### Prioridade BAIXA
- [ ] Multiplayer online
- [ ] Áudio posicional

---

## 📊 MÉTRICAS DO PROJETO

| Métrica | Valor |
|---------|-------|
| Arquivos TypeScript | 54 |
| Linhas de código | ~11.500 |
| Testes unitários | 210 |
| Mapas / fases | 9 |
| Tipos de inimigos | 22 |
| Bosses | 9 |
| Armas | 11 |
| Upgrades | 19 |
| Combos | 8 |
| Achievements | 13 |
| Modos de jogo | 4 |

Números conferidos contra o disco em 2026-10-03.
