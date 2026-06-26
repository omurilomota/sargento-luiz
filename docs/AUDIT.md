# Validação do Projeto BubbleGame
> Auditoria completa — 2026-06-26

---

## 1. ARQUITETURA E CÓDIGO (7.811 LOC, 36 arquivos)

### main.ts (1.127 LOC) — PONTO FRACO

**Notas:** Ponto central do jogo. Game loop bem estruturado.

**Fraquezas:**
- `update()` tem 541 linhas — god-function que faz TUDO (input, spawning, IA, colisões, morte, HUD)
- `draw()` tem 276 linhas — renderiza bots, skills, minimap, achievements, combos, tutorial, debug log
- **10 imports mortos** nunca usados: `useAmmo`, `getReloadTimer`, `triggerLevelUpFlash`, `sfxBuy`, `sfxError`, `sfxHitStop`, `damagePlayer2`, `isLocalGameOver`, `getLocalWinner`, `dist` (sombreado)
- `dist` é importado de utils mas sombreado por `const dist` inline em 2 lugares

**Pontos fortes:**
- Game loop compacto (linhas 1104-1117)
- `resetGame()` delega limpo para cada subsistema
- Seções bem demarcadas com comentários

### renderer.ts (1.101 LOC) — PONTO FRACO

**Notas:** Renderiza tudo em Canvas 2D.

**Fraquezas:**
- Função `drawCutscene()` grew para 100+ linhas com scene backgrounds inline
- `drawMenu()` e `drawGameOver()` monolíticas
- Mistura lógica de renderização com lógica de negócio (chama `getLeaderboard()`)

### config.ts (96 LOC) — PONTO FORTE

**Notas:** Dados estáticos bem centralizados. Fácil de balancear.

### systems/ — MISTO

| Arquivo | LOC | Avaliação |
|---------|-----|-----------|
| bots.ts | 238 | OK — isolado, focado |
| environment.ts | 233 | OK — eventos ambientais |
| audio.ts | 349 | OK — procedural, sem dependências externas |
| story.ts | 362 | OK — sistema de cutscenes |
| combos.ts | 172 | **FRACO** — health bonus é código morto |
| dynamicDifficulty.ts | 109 | **FRACO** — coleta dados mas nunca adapta dificuldade |
| npcs.ts | 95 | **FRACO** — sistema completo mas nunca importado antes desta sessão |
| collision.ts | 88 | **FORTE** — limpo, puro, testado |
| effects.ts | 183 | **FORTE** — bem organizado |
| particles.ts | 83 | **FORTE** — cap duplo (global + por frame) |

### entities/ — BOM

| Arquivo | LOC | Avaliação |
|---------|-----|-----------|
| player.ts | 225 | OK — interface limpa, funções puras |
| bullet.ts | 68 | **FORTE** — mínimo, focado |
| coin.ts | 110 | OK — magnetismo implementado |

### types.ts (226 LOC) — PONTO FORTE

**Notas:** Interfaces bem definidas, documentadas, sem `any`.

---

## 2. GAME DESIGN E BALANCEAMENTO

### Armas — 2/5 ⚠️

| Arma | DPS Sustentado | Preço | Veredicto |
|------|---------------|-------|-----------|
| Pistola | 21.3 | 0 | Baseline |
| Shotgun | 27.5 | 80 | OK |
| Metralhadora | 22.7 | 150 | Fraca pelo preço |
| Sniper | 21.9 | 200 | OK (pierce) |
| Laser | 20.5 | 250 | **TRAP** — pior que Sniper em tudo |
| RPG | 15.2 | 350 | Fraco (AoE não compensa) |
| **Raios** | **41.7** | 300 | **OVERPOWERED** |
| **Gel** | **47.1** | 180 | **DOMINANTE** — melhor custo-benefício |
| Granada | 11.2 | 250 | Trap |
| Mina | 9.3 | 200 | Trap |
| BFG | 72.7 | 999 | OK (secreta) |

**Problemas:**
- Gel e Raios dominam todas as builds
- Armas explosivas (RPG, Granada, Mina) têm DPS 9-15 — muito abaixo
- Laser é estritamente pior que Sniper
- Não há nichos claros (single-target vs crowd vs burst)

### Inimigos — 3/5

**Pontos fortes:**
- Boa variedade de arquétipos (melee, tanque, ranged, especial)
- Boss com 3 fases baseadas em HP
- Armor em knight/magmaGolem adiciona tática

**Fraquezas:**
- Todos os inimigos fazem a mesma coisa: andam em direção ao jogador
- Stat distribution flat (8-12 dano, 10-30 HP para maioria)
- `shooter` definido mas nunca usado em nenhuma fase
- Cores neon violam a paleta pós-apocalíptica do AGENTS.md
- Sem sinergias entre inimigos (nenhum buffa aliados, cria zonas, bloqueia projéteis)

### Upgrades — 3/5

**Problemas:**
- **Dano stacking domina**: +25% + +50% = +75% para 400 coins, escala com toda arma
- **Regen quebrada**: `enableRegen()` é boolean — comprar "Regen Avancada" faz NADA
- **Combo health bonus é código morto**: `getComboHealthBonus()` nunca é chamado
- Health upgrades são outscaled pelo scaling inimigo (15%/onda)

### Fases — 4/5

**Pontos fortes:**
- Progressão suave: 8→11→14→17→...→26 inimigos
- Cada fase introduz tipos novos
- Wave count aumenta (4→5→6→7)

**Fraquezas:**
- Phase 5 (Castelo) inclui `boss` como tipo regular — pode spawnar bosses aleatórios
- Phase 6 (Vulcão) não tem boss — anticlimático
- Sem variação dentro da fase (todas as ondas escalam igual)

### Skills — 3/5

| Skill | CD | Duração | Uptime | Avaliação |
|-------|-----|---------|--------|-----------|
| Dash | 3s | 0.2s | 6.7% | **Bom** — janela precisa |
| Shield | 10s | 3s | 30% | OK — poderoso mas CD longo |
| Fury | 15s | 5s | 33% | **MUITO ALTO** — 1/3 do tempo em 2x dano |

**Problemas:**
- Dash não faz dano — inútil ofensivamente
- Shield e Fury não interagem (não pode usar Shield durante Fury)
- Fury uptime 33% trivializa conteúdo
- Sem sinergias com sistema de combos

### Combos — 2/5

**Problemas:**
- `getComboHealthBonus()` é código morto (exportado mas nunca chamado)
- Restritivos: exatamente 1 arma + 1 upgrade específicos
- Apenas 8 combos para 11 armas e 19 upgrades
- Sem UI mostrando combos ativos
- Todos são multiplicadores de stat — nenhum muda comportamento

### Dificuldade Dinâmica — 1/5

**Problema:** Coleta dados (posição, precisão) mas NUNCA adapta dificuldade. `getPlayerAccuracy()` é exportado mas nunca chamado. O nome é enganoso — é apenas "predição de IA", não dificuldade dinâmica.

---

## 3. UI/UX

**Pontos fortes:**
- HUD funcional com barra de vida, munição, moedas
- Minimap implementado
- Loja com skins, upgrades, armas, ads
- Tutorial interativo
- Diário de bordo
- Pausa com ESC

**Fraquezas:**
- Sem indicador de combos ativos
- Sem lista de conquistas acessível no menu
- Loja pode ficar confusa com muitos itens

---

## 4. ASSETS

**Usando formas geométricas (sem sprites):**
- 9 tipos de inimigos (fireElemental, magmaGolem, inferno, crystal, asteroid, alien, frog, ufo, mothership)
- 8 armas (shotgun, sniper, laser, rpg, raios, gel, granada, mina)
- 7 terrenos por fase
- Retratos de personagens (só iniciais coloridas)

---

## 5. RESUMO EXECUTIVO

### Top 5 Pontos Fortes
1. **Arquitetura modular** — sistemas bem isolados (collision, effects, particles, audio)
2. **Áudio procedural** — sem dependências externas, 100% Web Audio API
3. **Conteúdo rico** — 7 fases, 23 inimigos, 11 armas, 19 upgrades, 8 combos, 9 cutscenes
4. **Testes** — 14 testes unitários funcionando
5. **Sistema de save/load** — localStorage com persistência

### Top 5 Pontos Fracos
1. **main.ts é um god-object** — 1.127 linhas com update() de 541 linhas
2. **Balanceamento quebrado** — Gel (47.1 DPS/180 coins) domina tudo
3. **Código morto significativo** — dynamicDifficulty, combo health bonus, shooter type, 10 imports
4. **Regen não faz stacking** — bug funcional que desperdiça 350 coins
5. **Combos inexequíveis** — health bonus é dead code, sem UI, sem sinergias

### Nota Geral: 2.8/5

O jogo tem uma base sólida (arquitetura, conteúdo, sistemas) mas sofre de:
- Balanceamento de armas desleal (2 armas dominam)
- Sistemas incompletos (combos, dificuldade dinâmica, regen)
- Código monolítico no orchestrador
- Código morto acumulado

### Prioridades de Correção (impacto x esforço)
1. **[ALTO]** Nerfar Gel e Raios, buffar Laser e explosivos
2. **[ALTO]** Corrigir regen stacking e combo health bonus
3. **[ALTO]** Remover imports mortos e código dead
4. **[MÉDIO]** Extrair lógica de update()/draw() para módulos
5. **[MÉDIO]** Adicionar boss na Phase 6, remover boss do spawn regular da Phase 5
6. **[BAIXO]** Implementar dificuldade dinâmica de verdade ou remover
7. **[BAIXO]** UI de combos ativos
