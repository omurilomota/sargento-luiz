# MVP: BubbleGame 2D — Continuação Estilo Zombotron

> Documento de planejamento do MVP
> Status: **RASCUNHO** — precisa de validação do usuário

---

## 1. O QUE É ESTE JOGO

Sequência lateral do Bubble Shooter Pós-Apocalíptico. O jogador controla o **Sargento Rios** em um side-scroller 2D com combate, plataformas e narrativa. Estilo Zombotron/Deadlight — run & gun com puzzles ambientais e upgrade entre fases.

**Tom:** Pós-apocalíptico, tenso, sobrevivência. Sem humor. Sem brightness.

---

## 2. O QUE JÁ TEMOS (reutilizável do top-down)

| Sistema | Reutilizável? | Adaptação necessária |
|---------|--------------|---------------------|
| Áudio procedural (Web Audio) | ✅ Sim | Novos SFX para side-scroller |
| Sistema de armas (munição, recarga) | ✅ Sim | Mesma lógica, novos valores |
| Power-ups | ✅ Sim | Mesmos tipos |
| Upgrades / loja | ✅ Sim | Mesma lógica |
| Cutscenes / story.ts | ✅ Sim | Novo conteúdo narrativo |
| Achievements / leaderboard | ✅ Sim | Expandido |
| Save/load | ✅ Sim | Expandido |
| Combos / sinergias | ✅ Sim | Mesmos tipos |
| Skins | ✅ Sim | Adaptar para sprite 2D |
| Diário de bordo | ✅ Sim | Mais entradas |
| Testes (vitest) | ✅ Sim | Expandir |
| Config / constants | ✅ Sim | Novos valores |

| Sistema | Reutilizável? | O que fazer |
|---------|--------------|-------------|
| Renderer (Canvas 2D) | ❌ Não | Reescrever para side-scroller (câmera follow, parallax, tiles) |
| Physics (colisão) | ⚠️ Parcial | Adaptar para AABB + gravidade + plataformas |
| Enemy AI | ❌ Não | Reescrever para 2D lateral (patrulha, pulo, tiro) |
| Spawner / waves | ⚠️ Parcial | Adaptar para spawn por sala/segmento |
| Player movement | ❌ Não | Reescrever (pulo, duplo pulo, grapple, dash lateral) |
| Map / level design | ❌ Não | Novo sistema de tiles + editor |

---

## 3. MVP SCOPE (Mínimo Viável)

### Core Loop (OBRIGATÓRIO)

```
Início → Fase 1 (plataformas + inimigos) → Boss → Shop/Upgrade
→ Fase 2 → Boss → Shop → ... → Fase final → Epílogo
```

### Features do MVP

| # | Feature | Prioridade | Status |
|---|---------|-----------|--------|
| 1 | Movimento lateral (correr, pular, duplo pulo) | OBRIGATÓRIO | ❌ Novo |
| 2 | Câmera follow com suavização | OBRIGATÓRIO | ❌ Novo |
| 3 | Sistema de tiles (chão, plataformas, Backgrounds) | OBRIGATÓRIO | ❌ Novo |
| 4 | Gravidade e física básica | OBRIGATÓRIO | ❌ Novo |
| 5 | Armes (reutilizável, adapatar valores) | OBRIGATÓRIO | ✅ Existe |
| 6 | Inimigos 2D (patrulha, tiro, melee) | OBRIGATÓRIO | ❌ Novo |
| 7 | Dano do jogador + morte | OBRIGATÓRIO | ⚠️ Adaptar |
| 8 | HUD (vida, munição, moedas) | OBRIGATÓRIO | ✅ Existe (adaptar) |
| 9 | Shop entre fases | OBRIGATÓRIO | ✅ Existe |
| 10 | 3 fases minimum (Floresta, Fábrica, Bunker) | OBRIGATÓRIO | ❌ Novo |
| 11 | 1 boss por fase | OBRIGATÓRIO | ⚠️ Adaptar |
| 12 | Cutscenes entre fases | DESEJÁVEL | ✅ Existe (adapatar) |
| 13 | Power-ups drops | DESEJÁVEL | ✅ Existe |
| 14 | Parallax scrolling (3 layers) | DESEJÁVEL | ❌ Novo |
| 15 | Tile editor visual | FUTURO | ❌ Novo |

### Fora do Escopo MVP

- Multiplayer
- Modo survival ilimitado
- Sistema de skins complexo
- Editor de fases visual
- Achievements expandidos
- Diário de bordo interativo

---

## 4. ARQUITETURA PROPOSTA

```
bubble2d/
├── main.ts              # Orquestrador (adaptar do top-down)
├── config.ts            # Dados estáticos (reutilizar + expandir)
├── types.ts             # Interfaces (adaptar)
├── core/
│   ├── constants.ts     # Balanceamento
│   └── physics.ts       # 🆕 Gravidade, colisão AABB, tiles
├── entities/
│   ├── player2d.ts      # 🆕 Player lateral (pulo, dash, grapple)
│   ├── enemy2d.ts       # 🆕 Inimigos 2D (patrulha, tiro, melee)
│   ├── bullet.ts        # Reutilizar
│   └── coin.ts          # Reutilizar
├── systems/
│   ├── renderer2d.ts    # 🆕 Renderer side-scrolling
│   ├── camera.ts        # 🆕 Câmera follow + shake
│   ├── tilemap.ts       # 🆕 Sistema de tiles
│   ├── spawner2d.ts     # 🆕 Spawn por segmento/sala
│   ├── audio.ts         # Reutilizar
│   ├── effects.ts       # Reutilizar
│   ├── collisions2d.ts  # 🆕 Colisão AABB + tiles
│   ├── parallax.ts      # 🆕 Parallax scrolling
│   ├── story.ts         # Reutilizar (novos diálogos)
│   └── saveSystem.ts    # Reutilizar
├── ui/
│   ├── hud.ts           # Adaptar
│   └── shop.ts          # Reutilizar
├── levels/              # 🆕 Definições de fases
│   ├── floresta.ts      # Tiles + inimigos + boss
│   ├── fabrica.ts
│   └── bunker.ts
└── assets/              # 🆕 Sprites necessários
    ├── player/
    ├── enemies/
    ├── tiles/
    └── ui/
```

---

## 5. INFORMAÇÕES QUE FALTAM (precisam ser preenchidas)

### 5.1 Game Design

| Pergunta | Opções | Recomendação |
|----------|--------|-------------|
| **Gravidade?** | Realista / Arcade / Lua | Arcade (pulo responsivo) |
| **Duplo pulo?** | Sim / Não | Sim (estilo Mega Man) |
| **Dash aéreo?** | Sim / Não | Sim (invencibility frames) |
| **Grapple hook?** | Sim / Não | Sim (Rios é soldado, faz sentido) |
| **Wall jump?** | Sim / Não | Não (simplifica o design) |
| **Quantas fases no MVP?** | 3 / 5 / 7 | 3 (Floresta, Fábrica, Bunker) |
| **Boss por fase?** | Sim / Não | Sim, 1 por fase |
| **Tamanho da fase?** | 2-5 min / 5-10 min | 3-5 min |
| **Upgrade entre fases?** | Loja /选择 / Ambos | Loja (reutilizar do top-down) |
| **Narrativa?** | Cutscenes / Environmental / Ambas | Cutscenes (já temos o sistema) |

### 5.2 Visual

| Pergunta | Opções | Recomendação |
|----------|--------|-------------|
| **Resolução base?** | 320x180 / 640x360 / 1280x720 | 640x360 (pixel art) |
| **Tile size?** | 16x16 / 32x32 | 32x32 (detalhe suficiente) |
| **Sprites ou shapes?** | Sprites PNG / Canvas shapes / Híbrido | Shapes coloridos (MVP rápido) |
| **Paleta de cores?** | Seguir AGENTS.md | Sim, pós-apocalíptica |
| **Parallax layers?** | 2 / 3 | 3 (sky, mid, foreground) |

### 5.3 Nível / Progressão

| Pergunta | Opções | Recomendação |
|----------|--------|-------------|
| **Estrutura de fase?** | Linear / Ramificada / Salas | Linear com seções |
| **Checkpoints?** | Sim / Não | Sim, 1-2 por fase |
| **Secretos?** | Sim / Não | Sim, 1 por fase (arma/extras) |
| **Dificuldade?** | Fixa / Progressiva / Selecionável | Progressiva |
| **New Game+?** | Sim / Não | Não (MVP) |

### 5.4 Técnico

| Pergunta | Opções | Recomendação |
|----------|--------|-------------|
| **Separar do top-down?** | Mesmo repo / Repo separado | Mesmo repo (pasta `bubble2d/`) |
| **Engine?** | Canvas 2D puro / Phaser / PixiJS | Canvas 2D puro (consistente) |
| **Build system?** | Vite (existente) | Vite |
| **Map format?** | JSON / TypeScript arrays / Tiled | TypeScript arrays (simples) |
| **Física?** | Custom / Matter.js / Planck.js | Custom (leve, suficiente) |

### 5.5 Conteúdo

| Pergunta | Status |
|----------|--------|
| **Quantos tipos de inimigos 2D?** | Definir (mínimo 5: melee, ranged, flyer, charger, turret) |
| **Quantas armas no MVP?** | 4-5 (pistola, shotgun, metralhadora, sniper, RPG) |
| **Quantos upgrades?** | 8-10 (reutilizar do top-down) |
| **Diálogos das cutscenes?** | Reutilizar existentes + novos para fases laterais |
| **Boss designs?** | Definir (1 por fase com mecânicas únicas) |

---

## 6. CRONOGRAMA ESTIMADO MVP

| Fase | Escopo | Estimativa |
|------|--------|-----------|
| **Sprint 1** | Core: movimento, câmera, tiles, gravidade | 2-3 dias |
| **Sprint 2** | Combate: armas, dano, inimigos básicos | 2-3 dias |
| **Sprint 3** | Níveis: Floresta + boss, shop | 2-3 dias |
| **Sprint 4** | Fábrica + Bunker, cutscenes | 2-3 dias |
| **Sprint 5** | Polish: parallax, efeitos, saves, testes | 1-2 dias |
| **Total** | **MVP jogável** | **~10-15 dias** |

---

## 7. PRÓXIMOS PASSOS

1. **Usuário preenche as perguntas acima** (ou aceita recomendações)
2. **Criar branch** `feature/bubble2d` do develop
3. **Sprint 1:** Core engine (movimento + tiles + câmera)
4. **Iterar:** jogar, ajustar, expandir

---

## 8. RISCOS

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Scope creep | Alto | MVP rigoroso, sem features extras |
| Física quebrada | Alto | Testar cedo, usar referências (Celeste, Mega Man) |
| Tiles tediosos | Médio | Formato simples (arrays), não editor visual |
| Balanço de dano | Médio | Reutilizar sistema existente, ajustar数值 |
| Performance | Baixo | Canvas 2D é leve, 60fps garantido |
