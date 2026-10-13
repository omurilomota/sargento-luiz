# AGENTS.md — Regras e Diretrizes para IAs neste Projeto

## Contexto do Projeto

**ASHFALL** — Jogo top-down survival shooter com progressão roguelite.

- **Stack**: TypeScript + Vite + Canvas 2D
- **Entry point**: `src/main.ts` (orquestrador central)
- **Arquitetura**: Módulos separados (entities, systems, ui, core)
- **SFX**: arquivos OGG de freesound.org (CC0/CC-BY) em `public/assets/sfx/`,
  com fallback procedural quando o arquivo não existe (`src/systems/audio.ts`)
- **Música**: 4 faixas OGG reais em loop, com crossfade (`public/assets/music/`)
- **Renderização**: Canvas 2D. Sprites do pack Kenney **são** o visual; o
  fallback procedural só entra se o pack não carregar
- **Tela**: tudo em canvas. Não existe HUD em DOM — `index.html` tem só o
  `<canvas>` e 6 linhas de CSS
- **Estados do jogo**: menu → playing → shop → gameover (loop)
- **Coordenadas**: o mundo é maior que a tela. Tudo que é entidade vive em
  coordenadas de mundo; a câmera aplica UMA translação por frame no `draw()`

### Estrutura de Diretórios

```
src/
├── main.ts              # Orquestrador, game loop, input, update/draw
├── config.ts            # Dados estáticos: fases, inimigos, armas, upgrades
├── maps.ts              # Dados dos 9 mapas (30×20 chars) + paletas de bioma
├── types.ts             # Interfaces TypeScript (Enemy, Bullet, Weapon, Phase...)
├── weapons.ts           # Sistema de armas, munição, recarga
├── powerups.ts          # Power-ups coletáveis
├── phases.ts            # Progressão de fases, ondas e score
├── utils.ts             # Funções utilitárias (dist, normalize, rand)
├── core/
│   ├── constants.ts     # Constantes de balanceamento
│   └── palette.ts       # Paleta do jogo (fonte única de cor de UI)
├── entities/
│   ├── player.ts        # Entidade do jogador (movimento, dano, cura)
│   ├── bullet.ts        # Projéteis (guarda px/py para colisão swept)
│   └── coin.ts          # Sistema de moedas e magnetismo
├── systems/
│   ├── tilemap.ts       # Grid, colisão círculo-vs-grid com deslize, flow field
│   ├── camera.ts        # Câmera com lerp, clamp e screen→world
│   ├── terrain.ts       # Prerender do terreno com tint por bioma
│   ├── props.ts         # Caixotes, barris e ninhos (geometria destrutível)
│   ├── objectives.ts    # Objetivo por fase (clear/survive/destroy/protect/reach)
│   ├── boss.ts          # Executor de padrão de boss data-driven
│   ├── collision.ts     # Colisão swept (ponto-segmento) + circle-circle
│   ├── audio.ts         # SFX procedural + música OGG com crossfade
│   ├── effects.ts       # Screen shake, flash, hit stop, slow motion
│   ├── environment.ts   # Eventos ambientais (terremoto, relâmpago, tempestade)
│   ├── explosions.ts    # Explosões visuais + dano em área
│   ├── gameModes.ts     # Modos: campaign, competitive, local, hardcore
│   ├── renderer.ts      # Renderização do mundo + menus + pause
│   ├── skills.ts        # Habilidades: dash, shield, fury
│   ├── spawner.ts       # Spawn de inimigos por onda (fora da viewport)
│   ├── sprites.ts       # Cache de sprites (6 poses × 9 personagens, tiles)
│   ├── story.ts         # Cutscenes narrativas
│   ├── bots.ts          # IA de bots para modo competitivo
│   ├── combos.ts        # Sinergias entre armas/upgrades
│   ├── localMultiplayer.ts # Multiplayer local 2 jogadores
│   ├── npcs.ts          # NPCs de loja e de objetivo `protect`
│   ├── achievements.ts  # Conquistas
│   ├── diary.ts         # Diário de bordo
│   ├── dynamicDifficulty.ts # Ajuste de dificuldade por comportamento
│   ├── leaderboard.ts   # Recordes (localStorage)
│   ├── saveSystem.ts    # Save/load (localStorage)
│   ├── tutorial.ts      # Dicas contextuais do primeiro minuto
│   ├── ads.ts           # Anúncios simulados
│   ├── skins.ts         # Skins do jogador
│   ├── classes.ts       # Classes do jogador (soldado/sobrevivente/robô/médico)
│   ├── loot.ts          # Tabela de drop, caixa de chefe e revelação
│   ├── particles.ts     # Pool de partículas do mundo
│   ├── pieces.ts        # Peças equipáveis na arma (base e acessório)
│   └── support.ts       # Ferramentas de input (wheel, clique, toque)
├── ui/
│   ├── hud.ts           # HUD 100% canvas (grade de 3 colunas, sem overlap)
│   └── shop.ts          # Loja canvas (getShopLayout é a geometria única)
└── __tests__/           # Vitest: colisão swept, layout de loja/menu, mapas

tools/
├── genmaps.py           # Gera e valida os 9 mapas (largura, borda, BFS)
├── genmusic.py          # Sintetiza as 4 faixas OGG (precisa de ffmpeg)
├── visual.mjs           # Harness Playwright: screenshots + 404/pageerror
├── session.mjs          # Sessão longa com telemetria (HP/onda/inimigos)
├── bullet-proof.mjs     # Prova de orientação dos projéteis
└── tilemap-proof.mjs    # Prova de colisão contra o grid

public/assets/           # Assets estáticos (Vite copia public/ → dist/)
├── sprites/topdown-shooter/PNG/  # Kenney Top-down Shooter, CC0
└── music/*.ogg                   # Faixas originais do projeto, CC0
```

### Fluxo do Jogo

1. **Menu** → ENTER → Cutscene → **Playing**
2. **Playing** → ondas de inimigos até o objetivo da fase ser cumprido
3. Objetivo cumprido → **Shop** (pula no modo Hardcore)
4. **Shop** → ENTER → próxima fase → **Playing**
5. **Playing** → health <= 0 → **Game Over** → ENTER → **Menu**

### Comandos

```bash
npm run dev        # Desenvolvimento com hot reload
npm run build      # Build de produção (tsc + vite build)
npm test           # Vitest
npm run visual     # Build + screenshots + 404/pageerror (ver regra 16)
npm run sessao     # Build + sessão longa com telemetria de HP/onda
npx tsc --noEmit   # Type check sem gerar output
python3 tools/genmaps.py    # Regenera e revalida src/maps.ts
python3 tools/genmusic.py   # Regenera public/assets/music/*.ogg
```

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
| **Desenho procedural no lugar de asset** | O usuário odeia. Elipse, retângulo, `arc()`, `fillRect` e `drawImage` de nada fabricando forma, parede, chão, árvore ou inimigo = visual de programador, não de jogo. É a causa nº 1 do "jogo com cara de IA" | **Usar o sprite/tile do pack.** O Kenney já tem a arte; escolher e curar é design, inventar com código é contorno. Procedural só entra como fallback quando o asset **não carregar** — nunca como visual pretendido |
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

## Portão Anti-IA (testes que reprovam sozinhos)

> "Nada pode parecer ou entregar como IA" deixou de ser promessa em
> 2026-10-10: virou cinco testes que rodam no `npm test`. O padrão desta base
> era **afirmar sem portão** — cada defeito "pronto" que o usuário encontrou
> depois tinha um `rg` e um "está bom" na origem. Estes testes são a resposta.

| teste | o que trava |
|---|---|
| `semIA.test.ts` | tics de texto em `story.ts`/`diary.ts` (lista abaixo) |
| `semDesenho.test.ts` | `arc`/`fillRect`/`ellipse`/gradiente em `renderer.ts` fora da lista permitida (regra 15) |
| `semProcedural.test.ts` | função `sfx*` sem arquivo (`playSfxFile`) fora da lista de débito |
| `semAssetQuebrado.test.ts` | arquivo de `public/assets/` que não chegou ao `dist/`, ou veio com 0 byte |
| `semOrfao.test.ts` | **código que existe e não faz nada**: export sem chamador, `StatId` sem leitor, `StatId` sem escritor |

Os quatro primeiros pegam **forma** (`arc()` no renderer, tics no texto,
síntese no som, asset quebrado). O quinto pega **substância** — a classe de
defeito mais cara do projeto, porque nada a revela: nem `tsc`, nem teste de
geometria, nem screenshot. Foi ele que achou o `mente_t3` vendendo 150 moedas
por um stat sem leitor, o teto de armadura que nunca abria, os 8 combos que só
disparam em save antigo, e as peças que o save gravava como lista vazia.

Tics que o `semIA` acusa: tríade `A, B e C` · "não X, mas Y" · "uma
onda/langadouro de X" · corpo clichê (coração acelerou, olhos se
arregalaram…) · etiqueta de fala além de "disse" (murmurou, sussurrou…) ·
adjetivo vazio (silêncio pesado, olhar penetrante…) · narração repetindo a UI
("cinco ondas") · palavra em espanhol vazada (recibir, mejor, también).

Regras que valem para toda IA neste projeto:

0. **Código novo que ninguém chama não entra.** Export com chamador, stat com
   leitor, stat com escritor. Se não há consumidor ainda, não é entrega: é
   dívida. A porta nº 5 reprova no `npm test` e nomeia o culpado.
1. **Texto novo passa pelo `semIA` antes de existir.** Se a frase precisa do
   tic para funcionar, ela não está pronta — reescreva, não contorne.
2. **Não sei escrever sem soar IA? Não escrevo: pergunto.** Improvisar e
   "reviso depois" foi como o passivo nasceu.
3. **Arte nova vem de asset.** Código só desenha o que a lista permitida do
   `semDesenho` já justifica (UI, efeito, sombra, fallback declarado). Débito
   da lista não cresce; item novo é decisão registrada no diff do teste.
4. **Som novo vem de arquivo.** A síntese é fallback atrás do `playSfxFile`;
   o débito do `semProcedural` só encolhe.
5. **Portão verde não substitui olho.** A regra 16 continua: render mudado
   exige `npm run visual` com os PNGs abertos; HP/onda mudado exige
   `npm run sessao`.

---

## Erros de IA que Viraram Regra

> Nascido em 2026-10-13, de uma sessão autônoma que errou em público: o dono
> viu o fundo branco de um sprite que o commit dizia estar recortado, e a IA
> consertou pela hipótese duas vezes antes de reproduzir. A lista cresce:
> toda sessão que cometer um erro novo, acrescenta a linha aqui — com o custo
> real que ele teve, não com a intenção.

| Erro cometido | O que custou | A regra |
|---|---|---|
| Consertar pela hipótese: aplicou um "realinhamento quando bloqueado" sem repro, e ele não cobria o caso real (inimigo já no centro da célula, espetado no canto da parede) | 1 ciclo de prova falho (3/3) e o band-aid teve que sair depois | Reproduzir no instrumento MENOR antes do fix: Node importando as funções reais (não reescrevê-las). A repro que falha em segundos substitui a teoria que dura uma hora |
| Prova verde por causa do bug: "30s sem pular de onda" só era verde porque os inimigos TRAVAVAM nas portas e nunca chegavam ao jogador | O onda-proof reprovou o conserto (`passoDeCelula`) como se fosse regressão | Checagem codifica o CONTRATO testemunhável ("a onda só avança depois de campo vazio OBSERVADO"), nunca a ausência de um sintoma |
| Mudança de mecânica sem varrer os harnesses: o hook `esperandoEscolha` era lido pelo `campanha-proof` (apertava '1'), e o teto do loop era do tamanho do conteúdo antigo (40 toques para 17 linhas) | O teardown teria quebrado a prova; com o epílogo de 29 linhas, a cena deixou de fechar sem ninguém notar | Toda mudança/remoção varre `src/`, `src/__tests__/` E `tools/*.mjs` — harness lê hook, hook é API; caps de loop são proporcionais ao conteúdo que atravessam |
| Pipe `tail` na saída de prova | Perdeu QUAL verificação falhou (9/10 sem nome) e a prova inteira foi re-rodada à mão | Ler a saída de prova inteira, ou grepar `FALHA`/`OK` — nunca só as últimas linhas |
| Enquadramento fora da prova: screenshot parado no spawn cortava o objeto (o bico do foguete) fora da tela | O dono viu "sprite torto" que era enquadramento; 2 rodadas de revisão queimadas | Screenshot prova o OBJETO: a prova anda o jogador/câmera até ele antes de fotografar |
| Processamento de asset afirmado e não feito: o commit dizia "fundo preto recortado" e o PNG era a cena inteira, fundo branco opaco | 3 olhadas do dono + recorte refeito com medição | Prova de processamento de imagem é PIXEL (cantos, canal alfa, silhueta em ASCII) — não a palavra do commit; CREDITS.md descreve o processamento REAL |
| Relato que descreve a fase errada ("Vulcão é survive+sentinel" — era reach+infernoPrime) | A investigação de B3 começou mirando a fase errada | Conferir o alvo no `config.ts` antes de reproduzir; a descrição do relato é hipótese, não dado |
| Terminar o turno esperando notificação de job em fundo | O dono perguntou "você parou do nada" duas vezes | Job em fundo não é desculpa para idle: seguir pela próxima frente desbloqueada no MESMO turno; checar o arquivo de saída diretamente quando a notificação não vem |

---

## Regras para IAs Assistentes

### Princípio Fundamental

**O jogador é humano. O código é ferramenta. O design é intencional.**

1. **Não adicionar features não pedido.** Implementar EXATAMENTE o que foi perguntado/pedido. Nada mais.

2. **Simplicidade antes de abstração.** Se 3 linhas resolvem, não criar uma classe/interface. Se um arquivo resolve, não criar um módulo.

3. **Manter o código vivo e orgânico.** Seguir os padrões existentes no projeto. Não introduzir novos frameworks, libs ou padrões sem necessidade explícita.

4. **Remover o que não funciona.** Se um módulo está morto, remover. Não manter código morto "por precaução". (`core/gameState.ts` foi removido nesta versão; a lista acima é o estado real do disco.)

5. **Verificar antes de afirmar.** Nunca dizer "está funcionando" sem rodar `npm run build` ou `npx tsc --noEmit`. Evidência antes de afirmação.

6. **Um commit = uma mudança lógica.** Não misturar fix de bug com feature nova no mesmo commit.

7. **Priorizar fixes de bugs antes de features.** Bugs quebram a experiência. Features são additive.

8. **Não over-engineer.** O jogo é um projeto indie em Canvas 2D. Não precisa de arquitetura de AAA. Módulos simples, funções pequenas, dados em config.

9. **Respeitar o escopo.** Se o usuário pede "corrigir o bug X", corrigir o bug X. Não "enquanto isso, vou refatorar o sistema Y".

10. **Perguntar antes de assumir.** Se algo é ambíguo, perguntar ao usuário. Não assumir preferências de design ou arquitetura.

11. **Seguir a lista de tarefas ao pé da letra.** Manter `todowrite` atualizado em tempo real: um item `in_progress` por vez, marcar `completed` só após verificar (build/teste), e nunca deixar item feito pendente ou feito esquecido. Ao receber uma lista de itens do usuário, registrá-la inteira antes de começar a executar.

12. **Marcar status dos TODOs na hora.** Toda troca de status (`pending` → `in_progress` → `completed`) deve ser registrada no `todowrite` imediatamente ao iniciar e ao concluir cada item — não no fim da sessão, não "quando lembrar". Se um item está sendo trabalhado, o registro tem que dizer `in_progress` naquele momento.

13. **Pode propor (e distinguir) ideias.** Quando fizer sentido melhorar a experiência — mesmo sem pedido explícito — a IA pode sugerir ideias criativas (balanceamento, mecânicas, loot, design por bioma, HUD). Ideia nova ≠ escopo: é oferecida como proposta, com o que ganha e o custo, e só vira implementação depois de aprovada. O que não pode é implementá-la em silêncio misturada no pedido atual.

14. **Assets sempre livres.** Qualquer asset novo (sprite, som, música, fonte) tem que ser de licença livre (CC0, CC-BY, domínio público). Atribuição obrigatória não é problema — pode usar mesmo se precisar creditar — mas o crédito entra em `public/assets/CREDITS.md` e na tela de créditos do jogo. Nunca assets pagos ou de licença personalizada.

15. **Visual vem de asset, nunca de código.** O usuário **odeia desenho procedural**. O pack em `public/assets/` é o visual; desenhar forma com `arc`/`fillRect`/`stroke`/`ellipse` em vez de usar o sprite é fazer arte no editor de código, e o resultado é lido como IA, não como jogo. Vale para parede, chão, inimigo, item, ícone e árvore. Antes de escrever código que desenha alguma coisa, procurar o tile correspondente. Procedural é permitido **só como fallback** de um asset que falhou ao carregar, e essa intenção tem que estar dita no comentário. Em dúvida entre "tile do pack" e "desenho meu": tile.

16. **Mudança de render não é verificada por `npm test`.** A suíte testa geometria (números de `getShopLayout`, `getHudCenterLayout`), nunca pixels. É possível ter `tsc` limpo, 646 testes verdes, build ok e o HUD ilegível com texto sobre texto. Toda alteração em `renderer.ts`, `hud.ts`, `shop.ts`, `terrain.ts`, `props.ts`, `sprites.ts`, `audio.ts` ou `maps.ts` **exige** rodar `npm run visual` e **abrir os PNGs de `tools/shots/` com a ferramenta de leitura de imagem** — screenshot não lido é screenshot inexistente. Se o ambiente não tiver Chrome, isso entra no relatório como pendência explícita, nunca como "está funcionando". Vale o mesmo para `npm run sessao` quando a mudança mexe em balanceamento de HP/onda.

### Fluxo de Trabalho

```
Receber tarefa
  → Ler TODO.md. Se for alterar, gravar apenas se o conteúdo lido for idêntico ao que será escrito (evitar sobrescrever mudanças de outra sessão)
  → Entender o que foi pedido (não mais, não menos)
  → Explorar código relevante (não o projeto inteiro)
  → Implementar a mudança mínima necessária
  → Verificar: npm run build passa?
  → Se mexeu render: npm run visual e ABRIR os screenshots (regra 16)
  → Reportar o que foi feito — em docs de entrega (STATUS/TODO/DECISIONS),
    registrar data E HORA com o hash do commit: "2026-10-13 19:19, `c6230e1`".
    O dia sozinho não separa a manhã da noite de uma sessão longa, e o hash
    amarra o registro ao momento exato do git
  → Parar
```

Em **Modo Autônomo** (seção abaixo) o fluxo não termina em "Parar": ele volta para "Receber tarefa" e repete até o escopo acabar.

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

### Modo Autônomo (usuário ausente)

**Gatilho.** O usuário avisa que vai sair do PC. Frases equivalentes:

> "vou sair do pc, trabalhe o máximo sem mim"
> "não vou estar aí, continua sozinho"
> "deixa rodando, eu revejo depois"
> "pode ir sem me perguntar nada"

**O que muda.** A partir dessa frase, e até o escopo acabar:

1. **Não perguntar nada.** Zero perguntas, mesmo as que a seção "Quando Perguntar" listaria. Ambiguidade não é motivo para parar.
2. **Não parar para reportar.** Não encerrar a tarefa, não esperar confirmação, não devolver "pronto, e agora?". Cada entrega vira entrada da próxima.
3. **Não travar.** Se um caminho falhar (teste quebrado, hipótese errada, arquivo inesperado), registrar e seguir pelo próximo caminho. Só parar em bloqueio absoluto que impeça qualquer progresso.
4. **Decidir e registrar.** Toda decisão tomada no lugar do usuário vai para o log (§ abaixo), com o motivo. O usuário audita depois em vez de responder pergunta a pergunta.
5. **Encerrar quando o escopo acabar, não antes.** Se o pedido for "faça o plano inteiro", entregar o plano inteiro — sprint por sprint, sem para no meio para perguntar se continua.
6. **Ter autoridade para criar tarefa e resolver pendência por conta própria.** Não é só executar o que foi pedido: enquanto o usuário estiver fora, o backlog é do projeto. Se aparecer bug, teste quebrado, código morto, inconsistência entre docs e código ou item do `TODO.md`/`STATUS.md` dentro do escopo do projeto, a IA cria a tarefa e resolve. Não precisa esperar alguém listar o que fazer.

### O que a autoridade autônoma alcança

Cobre, sem depender de novo pedido:

- **Criar e gerenciar tarefas** — escrever no `TODO.md`/`STATUS.md` o que foi descoberto e o que foi entregue, para retomar de onde parou.
- **Corrigir bugs e testes quebrados** que aparecerem durante a execução, mesmo não tendo sido o alvo.
- **Remover código morto** e reconciliar documentação desatualizada com o código real.
- **Executar o plano inteiro** quando o pedido foi um plano, e só parar quando ele acabar.
- **Refazer a verificação** (`npx tsc --noEmit`, `npm test`, `npm run build`) a cada unidade de trabalho.

Não cobre — continua valendo a regra de sempre:

- Push, tag, release ou qualquer escrita em remoto.
- `reset --hard`, `push --force`, `rebase -i`, alteração de branch no meio da autonomous.
- Commit, a menos que o pedido original já tenha dito para commitar.
- Mudança de direção de design (novo sistema, remover um sistema inteiro, trocar a identidade do jogo).

### O que NÃO muda

O modo autônomo dá autonomia de escopo, não de segurança:

- **Nada de git destrutivo.** Sem `push --force`, sem `reset --hard`, sem `rebase -i`, sem mexer em git config. Commitar apenas se o usuário tiver pedido commit.
- **Sem trocar o arquivo de branch no meio da autonomous.** Escolher a branch uma vez, no começo.
- **Verificação continua obrigatória.** `npx tsc --noEmit` e `npm test` no fim de cada unidade de trabalho. Modo autônomo sem build verde é só código não verificado.
- **Sem decisão de design irreversível.** Escolher entre duas leituras defensáveis é ok; apagar ou reescrever algo fora do escopo pedido, não.

### Log de Decisões Autônomas

Enquanto o usuário estiver ausente, manter `docs/DECISIONS.md` aberto e acrescentando uma linha por decisão:

```markdown
| # | Onde | Decisão | Motivo | Alternativa rejeitada |
|---|------|---------|--------|------------------------|
| 1 | src/systems/renderer.ts | HUD 100% canvas | 4 layers disputavam os mesmos pixels | Manter HUD parcial em DOM |
```

Regras do log:

- Uma linha por decisão, sem parágrafo.
- Sempre com a alternativa rejeitada — é o que permite revisar sem reconstruir o raciocínio.
- Só decisões, não narrated de etapas ("rodei o teste", "editei o arquivo").
- Nunca editados retroativamente para justificar a escolha: se a decisão mudou, linha nova.

No relatório final ao usuário voltar, listar as decisões que ele pode querer desfazer, com o número da linha.

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
