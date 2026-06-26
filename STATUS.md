# BubbleGame - Status Geral do Projeto
> Atualizado: 2026-06-25

## Versão atual: v1.2+ (develop branch)

---

## ✅ CONCLUÍDO (features implementadas)

### Core Gameplay
- [x] Sons para cada arma especificamente
- [x] Armas municiadas com recarga
- [x] Bug de inimigos morrendo/dano aleatório (corrigido)
- [x] Modo competitivo contra bots
- [x] Expansão da loja
- [x] Upgrades de personagens
- [x] Sistema de moedas e skins
- [x] Anúncios simulados para comprar skins
- [x] Combos e sinergias entre armas
- [x] Buff geral nos inimigos (progressão por onda)
- [x] Rebalanceamento de armas (preços, dano, armadura, regen)
- [x] Shotgun buff (pente 8, recarga 1.3s, dano 7x3=21)

### Novas Features (v1.2+)
- [x] Achievements/badges (13 conquistas, persistência localStorage)
- [x] Leaderboard local (top 10, localStorage)
- [x] Boss com fases de ataque (3 fases baseadas no HP)
- [x] Modo hardcore (uma vida, sem loja entre ondas)
- [x] Arma secreta BFG (desbloqueada ao completar o jogo)
- [x] Animação de morte do jogador (partículas + slow motion)
- [x] Transição animada entre fases (fade + nome da fase)
- [x] Sistema de save/load (localStorage)
- [x] Minimap (120x80px, canto superior direito)
- [x] Power-up drops dos inimigos (15% chance, boss sempre dropa 2)
- [x] Dificuldade progressiva dinâmica (inimigos preveem movimento)
- [x] Escolhas na história (3 opções no epílogo)
- [x] Diário de bordo do Rios (8 entradas, uma por fase)
- [x] Tutorial interativo (6 dicas, timer-based)
- [x] Crítico visual com slow motion (15% velocidade, 0.3s)
- [x] Pausa com ESC (overlay + voltar ao menu)

### Bugs Corrigidos
- [x] Loja com cliques errados
- [x] R para recarregar, furia movida para outra tecla
- [x] Dano de eventos ambientais sem feedback visual
- [x] 1-7 não funcionavam na tela inicial
- [x] Dano persistente na onda 2
- [x] Upgrades da loja passando da tela
- [x] Diálogo passando rápido demais
- [x] Timer de cooldown dos poderes
- [x] Eventos sobrepondo HUD
- [x] Tela inicial com itens sobrepondo

### Visual/Design
- [x] Jogo com cara menos artificial
- [x] Paleta pós-apocalíptica aplicada
- [x] História com diálogos decentes
- [x] Cutscenes com 9 cenas (Prólogo ao Epílogo)

---

## 🚧 PARCIALMENTE IMPLEMENTADO (precisa de trabalho)

| Feature | O que existe | O que falta |
|---------|-------------|-------------|
| **Animações de cutscene** | Typewriter text, fade-in, retratos circulares | Movimento de personagens, explosões, transições de cena |
| **Personagens secundários** | NPCs definidos (Cientista, Soldado, Civil), Cabo Fernandes na história | NPCs nunca são spawados no gameplay, morte é só textual |
| **Animação de morte do jogador** | Partículas + slow motion | O círculo do jogador simplesmente some, sem animação na entidade |
| **Tile mapping por fase** | Cores de fundo e grid por fase | Tiles reais (grama, rocha, metal, etc) — só tem grid colorido |
| **Escolhas na história** | 3 opções no epílogo com UI | Escolhas não afetam final nem gameplay |

---

## ❌ NÃO IMPLEMENTADO (pendente)

### Gameplay
- [ ] Modo competitivo online (multiplayer real)
- [ ] Continuação estilo Zombotron (2D lateral)
- [ ] Precisamos de mais assets para eventos ambientais e chão

### Assets Faltantes
**Inimigos (sem sprite, usando formas geométricas):**
fireElemental, magmaGolem, inferno, crystal, asteroid, alien, frog, ufo, mothership

**Armas (sem sprite):**
shotgun, sniper, laser, rpg, raios, gel, granada, mina

**Chão/terreno por fase:**
floresta, caverna, fábrica, pântano, castelo, vulcão, espaço

**UI:**
ícones de habilidades (dash, shield, fury), ícones de arma, barra de munição

**Cenas:**
retratos dos personagens (Rios, Vale, Ferreira) para cutscenes

### Sugestões Avançadas (não priorizadas)
- Cutscenes com mais animação (andando, explosões)
- Sistema de dificuldade mais dinâmico (inimigos aprendem padrões)
- Modo survival com leaderboard online
- Arma secreta desbloqueável
- Sistema de crítico visual melhorado
- Mini-mapa melhorado
- Animação de morte completa
- Screen shake mais sutil
- Partículas de poeira no terremoto
- Indicador de dano nos inimigos (hitFlash)
- Sombras no chão
- Zoom no boss
- Testes unitários
- Performance: limitar partículas

---

## 🐛 BUGS E ISSUES CONHECIDOS

| Prioridade | Issue | Arquivo |
|------------|-------|---------|
| **ALTA** | package.json com ~11 deps internas do Vite listadas erroneamente (incluindo `lightningcss-win32-x64-msvc`) | `package.json` |
| **MÉDIA** | `src/engine/` (3 arquivos) é código morto — prototype raycaster nunca usado | `src/engine/` |
| **MÉDIA** | `src/systems/npcs.ts` nunca é importado — código morto | `src/systems/npcs.ts` |
| **MÉDIA** | `console.log` em `main.ts:228` loga dano em cada hit (debug logging) | `src/main.ts` |
| **BAIXA** | `localMultiplayer.ts` duplica constantes em vez de importar de `constants.ts` | `src/systems/localMultiplayer.ts` |
| **BAIXA** | Velocidade de tiro dos inimigos hardcoded em `main.ts` em vez de config | `src/main.ts` |
| **BAIXA** | `package.json` tem `"type": "commonjs"` e `"name": "verao-rubro"` | `package.json` |

---

## 📁 ESTRUTURA DO PROJETO

```
src/
├── main.ts              # Orquestrador central (~1100 linhas)
├── config.ts            # Dados estáticos
├── types.ts             # Interfaces TypeScript
├── weapons.ts           # Sistema de armas
├── powerups.ts          # Power-ups
├── phases.ts            # Progressão de fases
├── utils.ts             # Utilitários
├── core/constants.ts    # Constantes de balanceamento
├── entities/
│   ├── player.ts        # Jogador
│   ├── bullet.ts        # Projéteis
│   └── coin.ts          # Moedas
├── systems/
│   ├── audio.ts         # Áudio procedural
│   ├── collision.ts     # Colisão
│   ├── effects.ts       # Efeitos visuais
│   ├── environment.ts   # Eventos ambientais
│   ├── explosions.ts    # Explosões
│   ├── gameModes.ts     # Modos de jogo
│   ├── renderer.ts      # Renderização Canvas 2D
│   ├── skills.ts        # Habilidades (dash, shield, fury)
│   ├── spawner.ts       # Spawn de inimigos
│   ├── sprites.ts       # Sprites PNG
│   ├── story.ts         # Cutscenes
│   ├── bots.ts          # IA de bots
│   ├── combos.ts        # Sinergias
│   ├── achievements.ts  # Conquistas ★ NOVO
│   ├── leaderboard.ts   # Ranking local ★ NOVO
│   ├── npcs.ts          # NPCs (morto, não importado) ★ NOVO
│   ├── tutorial.ts      # Tutorial interativo ★ NOVO
│   ├── diary.ts         # Diário de bordo ★ NOVO
│   ├── dynamicDifficulty.ts # Dificuldade dinâmica ★ NOVO
│   ├── saveSystem.ts    # Save/load ★ NOVO
│   └── skins.ts         # Sistema de skins
├── ui/
│   ├── hud.ts           # HUD DOM
│   └── shop.ts          # Loja canvas
└── engine/              # CÓDIGO MORTO (raycaster prototype)
    ├── renderer.ts
    ├── raycaster.ts
    └── input.ts
```

---

## 🔄 PRÓXIMOS PASSOS SUGERIDOS

1. **Limpeza urgente:** Remover `src/engine/` (código morto), remover deps desnecessárias do `package.json`, remover `console.log` de debug
2. **Integrar NPCs:** O módulo `npcs.ts` existe mas nunca é chamado — integrar no gameplay
3. **Completar animações:** Cutscenes e morte do jogador precisam de mais trabalho visual
4. **Tile mapping:** Implementar terreno visual por fase em vez de grid colorido
5. **Assets:** Buscar sprites para inimigos, armas, terreno e UI
6. **Multiplayer online:** Feature grande que requer arquitetura de rede
