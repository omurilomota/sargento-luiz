# AGENTS.md — Regras e Diretrizes para IAs neste Projeto

## Contexto do Projeto

**Bubble Shooter Pós-Apocalíptico** — Jogo top-down survival shooter com progressão roguelite.

- **Stack**: TypeScript + Vite + Canvas 2D
- **Entry point**: `src/main.ts` (orquestrador central)
- **Arquitetura**: Módulos separados (entities, systems, ui, core)
- **Áudio**: 100% procedural via Web Audio API (sem arquivos de áudio para SFX)
- **Renderização**: Canvas 2D com fallback para sprites PNG
- **Estados do jogo**: menu → playing → shop → gameover (loop)

### Estrutura de Diretórios

```
src/
├── main.ts              # Orquestrador, game loop, input, update/draw
├── config.ts            # Dados estáticos: fases, inimigos, armas, upgrades
├── types.ts             # Interfaces TypeScript (Enemy, Bullet, Weapon, etc.)
├── weapons.ts           # Sistema de armas, munição, recarga
├── powerups.ts          # Power-ups coletáveis
├── phases.ts            # Progressão de fases e score
├── utils.ts             # Funções utilitárias (dist, normalize, rand)
├── core/
│   ├── constants.ts     # Constantes de balanceamento
│   └── gameState.ts     # Estado global (MORTO - não usar)
├── entities/
│   ├── player.ts        # Entidade do jogador (movimento, dano, cura)
│   ├── bullet.ts        # Sistema de projéteis
│   └── coin.ts          # Sistema de moedas e magnetismo
├── systems/
│   ├── audio.ts         # Áudio procedural (Web Audio API)
│   ├── collision.ts     # Detecção de colisão circle-circle
│   ├── effects.ts       # Screen shake, flash, hit stop, slow motion
│   ├── environment.ts   # Eventos ambientais (terremoto, relâmpago, tempestade)
│   ├── explosions.ts    # Explosões visuais + dano em área
│   ├── gameModes.ts     # Modos: campaign, survival, missions, bossrush, competitive
│   ├── renderer.ts      # Renderização Canvas 2D de todos os elementos
│   ├── skills.ts        # Habilidades: dash, shield, fury
│   ├── spawner.ts       # Spawn de inimigos por onda
│   ├── sprites.ts       # Carregamento lazy de sprites PNG
│   ├── story.ts         # Cutscenes narrativas
│   ├── bots.ts          # IA de bots para modo competitivo
│   ├── combos.ts        # Sistema de sinergias entre armas/upgrades
│   ├── localMultiplayer.ts # Multiplayer local 2 jogadores
│   └── skins.ts         # Sistema de skins do jogador
├── ui/
│   ├── hud.ts           # HUD DOM (barra inferior)
│   └── shop.ts          # Loja canvas (armas, upgrades, skins, ads)
└── ads.ts (systems/)    # Sistema de anúncios simulados
```

### Comandos

```bash
npm run dev      # Desenvolvimento com hot reload
npm run build    # Build de produção (tsc + vite build)
npx tsc --noEmit # Type check sem gerar output
```

### Fluxo do Jogo

1. **Menu** → ENTER → Cutscene → **Playing**
2. **Playing** → ondas de inimigos → fase completa → **Shop**
3. **Shop** → ENTER → próxima fase → **Playing**
4. **Playing** → health <= 0 → **Game Over** → ENTER → **Menu**

---

## Regras Gitflow

### Branches

- `main` — Produção estável. Apenas merges de release/hotfix.
- `develop` — Integração. Todas as features merge aqui primeiro.
- `feature/*` — Features novas. Criam de `develop`, merge de volta em `develop`.
- `hotfix/*` — Fixes urgentes. Criam de `main`, merge em `main` E `develop`.

### Commits

- Formato: `tipo: descrição curta em português`
- Tipos: `feat`, `fix`, `chore`, `refactor`, `style`, `debug`, `revert`
- Exemplos:
  - `feat: adicionar sistema de munição e recarga`
  - `fix: corrigir dano ambiental sem feedback visual`
  - `chore: remover console.logs de debug`
  - `style: simplificar visual do menu para parecer menos artificial`

### Regras

1. **Nunca commitar direto em `main`** — sempre via merge de `develop` ou `hotfix`.
2. **Feature branches** devem ser curtas e focadas — uma feature por branch.
3. **Antes de merge**: `npm run build` deve passar sem erros.
4. **Mensagem de commit** descreve o "porquê", não apenas o "o quê".
5. **Não forçar push** em branches compartilhadas.

---

## Anti-Padrões de Design Gerado por IA — O QUE EVITAR

### Visual / UI

| Anti-padrão | Por quê é ruim | O que fazer |
|---|---|---|
| `shadowBlur` excessivo em tudo | Cria visual "fantasma", artificial, cansativo visualmente | Usar sombra apenas em 1-2 elementos-chave (título, botão ativo) |
| Cores neon saturadas (verde-azul, magenta, ciano) | Visual "tech demo", não tem personalidade | Usar paleta sóbria: terracota, cinza, mostarda, verde-oliva |
| Muitas partículas coloridas simultaneamente | Ruído visual, tira foco do gameplay | Partículas sutis, poucas, mesmas cores do tema |
| Gradientes complexos em tudo | Parece template pronto, não design intencional | Fundos sólidos ou gradiente único sutil |
| Fontes "decorativas" (Cinzel, serifadas ornamentadas) | Parece RPG genérico de IA | Monospace ou sans-serif limpo |
| Layout perfeitamente simétrico e "limpo demais" | Parece gerado, não desenhado por humano | Adicionar assimetria sutil, espaçamento orgânico |
| UI com muitos elementos competindo por atenção | O jogador não sabe onde olhar | Hierarquia visual clara: 1 elemento principal, resto secundário |
| Efeitos de "sparkle" / "shimmer" | Muito comum em conteúdo gerado por IA | Evitar completamente |
| Tema escuro + acentos neon = "futurístico" | O jogo é pós-apocalíptico, não cyberpunk | Terra, cinza, ferrugem, verde morto |
| Tudo brilhante e "polido" | Jogo pós-apocalíptico deveria ter textura e desgaste | Adicionar granulação, cores desbotadas, bordas irregulares |

### Código

| Anti-padrão | Por quê é ruim | O que fazer |
|---|---|---|
| Comentários em TODA função (`/** Função que faz X */`) | Ruído, obvio pelo nome | Comentar apenas decisões não óbvias e "porquês" |
| try/catch em código que não pode falhar | Over-engineering, esconde bugs reais | Tratar erros apenas em bordas do sistema (input do usuário, APIs externas) |
| Abstrações desnecessárias (interfaces para tudo, factory patterns simples) | Complexidade sem benefício | 3 linhas repetidas > 1 abstração premature |
| Console.log por todo lado | Suja o output, parece debug perpetuo | Usar apenas para debugging ativo, remover depois |
| Nomes genéricos (`data`, `result`, `item`, `handler`) | Código difícil de seguir | Nomes específicos: `waveScale`, `bulletDamage`, `enemyHealth` |
| Validação defensiva em código interno | Desperdício, confia nos guarantees do sistema | Validar apenas em boundaries (input do usuário, dados externos) |
| Features que não se conectam | Coleção de features soltas, não um jogo coeso | Cada feature deve interagir com pelo menos 2 outras |
| "While I'm here" — melhorar código adjacente sem pedido | Escopo creep, changes inesperados | Focar na task pedida. Só limpar se estiver no caminho |

### Game Design

| Anti-padrão | Por quê é ruim | O que fazer |
|---|---|---|
| Muitos sistemas sem profundidade | Coleção de features rasas, nada memorável | Menos features, mais interação entre elas |
| Progressão genérica "roguelite" sem escolhas significativas | Parece template, não design intencional | Cada escolha deve ter tradeoff real |
| Player overpowered vs inimigos fracos | Sem desafio, sem tensão | Inimigos devem representar ameaça real |
| Visual noise durante gameplay | Distração, perde informação importante | Efeitos visuais só para feedback de ação (hit, kill, powerup) |
| Nenhuma identidade visual única | Parece "mais um jogo de IA" | Ter 1-2 elementos visuais marcantes e consistentes |
| Sons genéricos para tudo | Falta personalidade | Cada arma/ação ter som distinto e reconhecível |
| "Mais = melhor" (mais upgrades, mais armas, mais inimigos) | Sobrecarga, sem curadoria | Menos opções, mais impacto em cada uma |

---

## Regras para IAs Assistentes

### Princípio Fundamental

**O jogador é humano. O código é ferramenta. O design é intencional.**

1. **Não adicionar features não pedido.** Implementar EXATAMENTE o que foi perguntado/pedido. Nada mais.

2. **Simplicidade antes de abstração.** Se 3 linhas resolvem, não criar uma classe/interface. Se um arquivo resolve, não criar um módulo.

3. **Manter o código vivo e orgânico.** Seguir os padrões existentes no projeto. Não introduzir novos frameworks, libs ou padrões sem necessidade explícita.

4. **Remover o que não funciona.** Se um módulo está morto (como `core/gameState.ts`), marcar claramente ou remover. Não manter código morto "por precaução".

5. **Verificar antes de afirmar.** Nunca dizer "está funcionando" sem rodar `npm run build` ou `npx tsc --noEmit`. Evidência antes de afirmação.

6. **Um commit = uma mudança lógica.** Não misturar fix de bug com feature nova no mesmo commit.

7. **Priorizar fixes de bugs antes de features.** Bugs quebram a experiência. Features são additive.

8. **Não over-engineer.** O jogo é um projeto indie em Canvas 2D. Não precisa de arquitetura de AAA. Módulos simples, funções pequenas, dados em config.

9. **Respeitar o escopo.** Se o usuário pede "corrigir o bug X", corrigir o bug X. Não "enquanto isso, vou refatorar o sistema Y".

10. **Perguntar antes de假设.** Se algo é ambíguo, perguntar ao usuário. Não assumir preferências de design ou arquitetura.

### Fluxo de Trabalho

```
Receber tarefa
  → Entender o que foi pedido (não mais, não menos)
  → Explorar código relevante (não o projeto inteiro)
  → Implementar a mudança mínima necessária
  → Verificar: npm run build passa?
  → Reportar o que foi feito
  → Parar
```

### O que NÃO fazer

- Não criar documentação não pedido (README, docs, etc.)
- Não adicionar "melhorias" em código adjacent
- Não criar abstrações para código que funciona
- Não adicionar validação desnecessária
- Não adicionar features extras "porque sim"
- Não mudar estilo/visual sem pedido explícito
- Não fazer commit sem pedido explícito
- Não forçar push
- Não mudar o git config

### Quando Perguntar ao Usuário

- Requisito ambíguo ("melhorar o visual" → como?)
- Escopo incerto (feature grande vs fix simples)
- Tradeoff técnico (Performance vs legibilidade)
- Prioridade entre tarefas concorrentes
- Antes de mudar arquitetura existente

---

## Paleta de Cores do Jogo (Referência)

O jogo é **pós-apocalíptico**. A paleta deve refletir desgaste, sobrevivência, natureza morta.

```
Fundo principal:    #111 (quase preto, não azulado)
Título:             #c8b890 (areia velha)
Texto principal:    #ccc (cinza claro)
Texto secundário:   #666 (cinza médio)
Texto desabilitado: #444 (cinza escuro)

Accent principal:   #7a9a6a (verde musgo)
Accent quente:      #b07050 (terracota)
Accent neutro:      #a08050 (mostarda)
Accent frio:        #608090 (azul-pedra)
Accent perigo:      #8b4040 (vermelho desbotado)

Inimigos:           Cores desaturadas, nunca neon
Jogador P1:         #7a9a6a (verde musgo)
Jogador P2:         #608090 (azul-pedra)
```

### Regras de Cor

1. **Nunca usar**: `#2ecc71`, `#e74c3c`, `#3498db`, `#f39c12`, `#9b59b6` (cores genéricas de IA)
2. **Sempre desaturar** cores para manter consistência pós-apocalíptica
3. **Máximo 3-4 cores** ativas por tela
4. **Texto**: sempre neutro (cinza), nunca branco puro ou cores vivas
5. **Feedback de dano/morte**: usar partículas da cor do alvo, não vermelho genérico
