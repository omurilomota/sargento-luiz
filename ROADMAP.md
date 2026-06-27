# BubbleGame — Roadmap de Desenvolvimento

> Atualizado: 2026-06-26
> Projeto: Top-down shooter pós-apocalíptico (v1.2+)

---

## ✅ CONCLUÍDO

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
- [ ] Otimizar main.ts (god-function de 1100+ linhas)
- [ ] Extrair draw() e update() para módulos separados
- [ ] Corrigir shooter type (definido mas nunca usado)
- [ ] Adicionar boss na Phase 6 (Vulcão)
- [ ] Implementar dificuldade dinâmica de verdade

### Prioridade MÉDIA
- [ ] Modo survival com leaderboard online
- [ ] Mais achievements expansíveis
- [ ] UI de combos ativos
- [ ] Testes para mais sistemas
- [ ] Performance: verificar cap de partículas

### Prioridade BAIXA
- [ ] Modo competitivo online (multiplayer real)
- [ ] Continuação estilo Zombotron (2D lateral) → WASTELAND
- [ ] Editor de fases visual

---

## 🎨 ASSETS PENDENTES

### Inimigos (usando formas geométricas)
fireElemental, magmaGolem, inferno, crystal, asteroid, alien, frog, ufo, mothership

### Armas (sem sprite)
shotgun, sniper, laser, rpg, raios, gel, granada, mina

### Terreno por fase
floresta, caverna, fábrica, pântano, castelo, vulcão, espaço

### UI
ícones de habilidades, ícones de arma, barra de munição

### Cenas
retratos dos personagens (Rios, Vale, Ferreira)

---

## 📊 MÉTRICAS DO PROJETO

| Métrica | Valor |
|---------|-------|
| Arquivos TypeScript | 36 |
| Linhas de código | ~7,800 |
| Testes unitários | 14 |
| Fases implementadas | 7 |
| Tipos de inimigos | 23 |
| Armas | 11 |
| Upgrades | 19 |
| Combos | 8 |
| Cutscenes | 9 |
| Achievements | 13 |

---

## 🔗 PROJETO RELACIONADO

**WASTELAND** — Side-scroller 2D baseado neste universo
- Repo: `/home/murilo/Documents/Wasteland`
- Status: Sprint 5 (core engine + combate + 3 fases)
- Inspiração: Zombotron Flash (1, 2, Time Machine)
