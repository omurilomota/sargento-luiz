# FUTURO — ideias, dívidas e apostas para o SARGENTO RIOS

> Documento de discussão, não de compromisso. `TODO.md` é o que está em obra;
> `docs/DESIGN.md` é a direção; **este arquivo é o que ainda não foi decidido** —
> ideias com custo, apostas com tradeoff e perguntas que precisam do dono do
> projeto antes de virarem linha de código.
>
> Estado do disco em 2026-10-10: branch `feature/v2-weapons-story`, 732 testes
> em 39 arquivos, campanha das 9 fases provada pelo `tools/campanha-proof.mjs`
> (9/9 fases, 9/9 chefes, 9/9 fechando na loja), tabela de dano alinhada
> (nenhuma fase fora da faixa de 6 a 10 toques), harness visual sem 404.
>
> Legenda: ✅ decidido (executar como está) · 💡 proposta (custo × entrega) ·
> ⚠️ conversa de design antes de qualquer código · ⛔ fora de escopo por decisão
> (não reabrir sem motivo novo).

## 0. Decisões registradas (2026-10-10, primeira rodada da discussão)

- **Destino:** o jogo **já está publicado** no itch ("in development",
  disclosure de IA marcado certo — Code e Text, sem tag `co-op`) e a ambição é
  chegar à **Parte III–IV** — mas a história só está pensada **até o fim da
  Parte I**. Consequência: o maior buraco criativo do projeto é o arco II–IV
  (ver §3.9).
- **Prioridade:** "tudo" — o §5 deixa de ser sugestão e vira cronograma em
  régua de sprints.
- **História:** é o coração. O investimento vai para roteiro, cenas e retratos
  (§2.2, §2.7, §3.6), não só para mecânica.
- **2P e bots:** os dois entram — o 2P local conserta de verdade (§1.2) e os
  bots ganham dodge de verdade (§1.4).
- **Input:** navegador com teclado+mouse é o alvo; gamepad e mobile saem do
  radar ativo (rebind de teclas continua valendo — §3.5).
- **Economia:** empate técnico — loja e progressão dividem o posto de centro
  de decisão, com um **teste de economia** como árbitro (§3.4).

## Como ler (e a régua de curadoria)

Toda ideia deste documento passa por dois filtros tirados do `AGENTS.md`:

1. **Interage com 2+ sistemas.** Feature solta não entra; feature que muda
   *como o jogador decide*, entra.
2. **Troca algo.** Se não tem tradeoff (custa velocidade, arrisca vida, gasta
   recurso, fecha outra porta), é enfeite — enfeite não paga o custo de manter.

Ideia divertida que não passa nos dois ficou de fora de propósito. O documento
é longo, mas a régua é curta.

---

## 1. Dívidas em aberto (fechar antes de sonhar)

### 1.1 O Castelo promete proteger e pune quem tenta — ⚠️
O `archer` com `huntsNpc` mata o sobrevivente rápido demais (já registrado no
`TODO.md`, SPRINT 9). Três caminhos na mesa, cada um muda uma decisão
diferente:

- **O NPC se abriga sozinho**: procura prop próximo quando toma tiro. Custo:
  IA nova barata. Efeito: o jogador protege *criando rota*, não sendo escudo.
- **Interceptar a linha de tiro**: o arqueiro para de mirar quando o jogador
  está entre ele e o NPC. Efeito: o jogador vira parede móvel — decisão tática
  clara, zero IA nova.
- **Vida de escolta**: o sobrevivente aguenta 2–3 toques com feedback (ele
  cambaleia, grita). Efeito: menos punitivo, porém mais raso.

Escolher **uma**. As três juntas viram sopa.

### 1.2 O Local 2P anuncia mais do que entrega — ⚠️
O P2 se move, atira e mata, mas não leva dano e não existe condição de vitória
(o próprio `PUBLISHING.md` manda não vender como "versus"). **Decisão de
10/10: consertar de verdade** — vida pro P2, condição de fim e revanche; a
página ganha o `co-op` honesto depois.

### 1.3 O fim de fase depois do chefe (relato do `bugs.md`)
"O chefe morre, o countdown acaba e a partida não acaba; só fecha quando o
campo limpa." Pode já ter sido resolvido pelo respiro pós-boss genérico —
**verificar se ainda reproduz** e, se reproduzir, escrever o teste que pega.

### 1.4 A telemetria não alcança o fim da campanha
O bot do `session.mjs` não desvia e morre na Cidade, onda 1 — a sessão longa
nunca mede Espaço/Castelo/Bunker. Precisa de: dodge simples (mover
perpendicular ao inimigo mais próximo a menos de N px) + telemetria de dano
recebido por fonte. Sem isso, nenhuma mudança de balanceamento nas fases finais
tem medição de verdade.

### 1.5 `t=undefined` no log do `session.mjs` — [x] FEITO em 2026-10-10
O log imprimia `t=undefined` porque pedia o relógio à telemetria, que devolve
estado de jogo, não tempo de sessão. Correção: o `session.mjs` calcula `t`
local, `(Date.now() - t0)` (linha 116). Duas linhas, sem tocar na telemetria.

### 1.6 `main.ts` ainda concentra menu, loja, cutscene e input
Refactor adiado de propósito (não tem bug atrás). Só fazer quando outra
mudança exigir — e aí extrair menu/loja primeiro.

### 1.7 TAB abre a ficha da arma, mas o minimapa grande não existe (bugs.md)
Pedido direto: no TAB, ver o minimapa em tamanho grande — de preferência na
mesma tela da ficha (a informação é complementar: campo + build).

### 1.8 Sem auto-equipar e sem preset de loadout (bugs.md)
Com o arsenal inteiro + peças, o jogador refaz a mesma arrumação a cada loja. Presets
salvos no save resolvem sem UI nova: 2–3 slots, tecla na ficha.

---

## 2. Na fila (decidido — executar como está, sem reabrir)

Estes não são ideias; são compromissos já esboçados na sessão de 2026-10-10 e
nos sprints do `TODO.md`. Listados aqui para o documento ser o mapa completo.

- **2.1 Portão anti-IA (4 testes) — [x] FEITO em 2026-10-10.** `semIA` (zero
  tics; `story.ts:90` reescrita), `semDesenho` (64 sites auditados: 52
  permitidos com porquê, 12 de débito com teto), `semProcedural` (4 débitos
  declarados, lista exata), `semAssetQuebrado` (árvore `public/assets` ×
  `dist`). Provados mordendo com violação injetada; regra normativa no
  AGENTS.md. Suíte: 731 testes em 39 arquivos. O débito já encolheu: **7 sites**
  (59 no total).
- **2.2 Arte vinda de asset, não de código — [x] FEITO (10/10).** As **cenas
  de cutscene** saíram do código (as 4 que existiam são prerenderizadas em
  `buildCutsceneBackdrop` com piso tingido e objetos do bioma), e **moeda e
  power-up** viraram sprite da Kenney Platformer Art Deluxe (moeda dourada +
  4 gemas; símbolo como legenda abaixo, depois de medir que em cima ele
  apagava a faceta). Débito do `semDesenho`: 12 → **3 sites** (só `drawBots`,
  que depende da decisão visual do §1.2). O gate também foi corrigido: ele
  contava `ctx.arc()` citado em comentário como desenho (−2 sites).
- **2.2b Cenas das outras 5 fases — [x] FEITO em 2026-10-10.** `buildCutsceneBackdrop`
  é uma tabela: **PRÓLOGO, FÁBRICA, PÂNTANO, CASTELO e EPÍLOGO** entraram (antes
  fundo chapado), cada uma ~1 linha com tiles que já estão no jogo — entulho da
  Cidade (292/265/260), sucata+engradado+anel da Fábrica (180/129/264), lama e
  folhagem do Pântano (320/134), pedra e espinho do Castelo (133/268) e
  caixotes do Bunker (129/156/158). Não é "BUNKER" o nome da cena: a fase 8 abre
  o título **EPÍLOGO** (`FASE_PARA_CUTSCENE`), e um nome que não batesse nunca
  desenharia. Provado com `tools/story-proof.mjs` (19/19) e os PNGs das 5 cenas
  novas abertos (regra 16): `historia-2/3/4/7` + `02-cutscene` do `npm run visual`.
- **2.3 Som — [x] FEITO (10/10).** Os 4 `sfx*` sem arquivo viraram **9 chaves
  CC0** (29 → 38): recarga por família (pente de pistola, bomba de shotgun,
  fuzil, rifle, recarga genérica, encaixe de lançador, clique de mina — cada
  família com o seu timbre, que um arquivo único perderia), rangido de
  ferrugem (`creak1`) e encaixe metálico de peça (`metalLatch`);
  `sfxCondicao` delega para ferrugem e para o `jammed` que já existia.
  `semProcedural` com débito **vazio**. Fontes: OpenGameArt CC0 (bmaczero,
  joaken, zer0sol) + Kenney RPG Audio; níveis no mesmo degrau do banco.
- **2.4 Progressão.** XP (gravar o *threat* que o spawner calcula e joga fora),
  drop no chão com sprite, curva de nível, barra no HUD, plugar os 2 órfãos
  (`triggerLevelUp`/`sfxLevelUp`), livros compráveis, e a árvore de progressão.
  **Decidir UMA coisa**: a "árvore de 3 galhos" da sessão × a "escada de 4
  ramos" (DANO/CORPO/PERNAS/MENTE) do SPRINT 5. Minha leitura: são a mesma
  feature — a escada é o conteúdo, a árvore é a tela. Escolher os ramos e os
  especiais de ponta e seguir.
- **2.5 Correções de jogo.** Input com dono por estado (clique não sobrepõe
  E/dash); clique avança a fala; fuga do NPC do Castelo; pavio de explosivo na
  borda do mapa; armadura aplicada no dano de projétil (hoje é ignorada).
- **2.6 Muros quebráveis.** Char novo nos mapas, célula com vida própria, dano
  no grid, 9 mapas revisados. Destrava a ideia 3.2.
- **2.7 Texto.** Reescrever as 9 cutscenes + diário contra a premissa nova
  (batalhão, Joe, Arthur, o núcleo, os trilionários, a nave), com o `semIA`
  verde do primeiro ao último.

---

## 3. Ideias novas

### 3.1 Rejogabilidade — o maior retorno depois que a campanha acabar

- 💡 **Semente do dia.** Uma seed compartilhada por dia/semana: mesmos mapas de
  loot, mesmos sorteios, mesmo spawn. O `leaderboard.ts` ganha ranking por
  seed; o código da seed é um número curto que o jogador posta em qualquer
  lugar. Corrida justa **sem servidor** — o ranking local vira comparável de
  verdade.
  *Interage com: leaderboard, spawner (usa `rand`), save, competitivo.*
- 💡 **Fantasma / corrida contra o seu melhor.** Grava input por tick (leve) e
  replica como um espectro da melhor run; de brinde, vira anti-cheat do ranking
  por seed (o replay prova que a run aconteceu).
  *Interage com: bots (reusa o player fake), leaderboard, 3.1-semente.*
- 💡 **Cronômetro de run + splits.** Timer opcional no HUD e tempos por fase
  salvos no save. Custo baixíssimo; transforma qualquer modo em speedrun-ável.
  *Interage com: save, leaderboard, conquistas.*
- 💡 **Boss Rush.** Destrava ao terminar a campanha: os 9 chefes em sequência,
  loja entre lutas, placar.
  *Interage com: boss.ts (já é data-driven), shop, leaderboard.*
- 💡 **Arena infinita.** Horda sem fim com o `dynamicDifficulty` escalando;
  placar por maior onda sobrevivida.
  *Interage com: spawner, dynamicDifficulty, leaderboard.*
- 💡 **Treino de chefe.** Menu de treino com cada chefe já visto; sem
  recompensa, sem ranking. O hook `pularParaUltimaOnda` que os harnesses já
  usam é metade do trabalho pronto.
  *Interage com: boss.ts, conquistas (destrava por "viu o chefe"), tutorial da
  luta (a telegrafia já existe).*
- ⚠️ **NG+ com modificadores curados.** Quatro, não vinte: sem loja / só
  pistola / inimigos +25% / sem cura. Cada um muda a run inteira; vinte viram
  menu de opções que ninguém lê.

### 3.2 O campo de batalha — o diferencial do jogo merece mais exploração

- 💡 **Salas secretas atrás de muro rachado.** 1–2 por fase, autorais. RPG,
  granada ou barril abre a parede; dentro, loot garantido (peça, medkit raro,
  moeda). O diário dá a dica depois da primeira descoberta; o minimapa marca o
  vault encontrado.
  *Interage com: 2.6 (muros), explosivos, loot.ts, minimapa, diário.*
- 💡 **Hazard × evento ambiental — só 2 sinergias.** Tempestade apaga fogo
  (`fireElemental`/`inferno` sem `leavesFire` enquanto durar); terremoto racha
  muro quebrável (abre atalho sozinho). O sistema de eventos já existe; as
  regras são uma tabela.
  *Interage com: environment.ts, props, 2.6, inimigos por bioma.*
- 💡 **Minimapa 2.0.** Ícones por entidade: ninho vivo/morto, zona de reach,
  NPC, vault descoberto. Hoje o minimapa desenha parede; falta o que o jogador
  precisa *procurar*.
  *Interage com: 1.7 (TAB grande), objetivos, diário.*

### 3.3 Inimigos e chefes

- 💡 **Arquivo do Esquadrão (bestiário).** Cada tipo desbloqueia uma página ao
  ser morto N vezes: fraqueza, comportamento, uma linha de lore. Saúde a
  promessa do jogo de "ler o campo" — o jogador que entende o inimigo decide
  melhor.
  *Interage com: achievements, diário, cutscenes (entrada com gate de
  spoiler), menu.*
- 💡 **Variantes locais sem asset novo.** O mesmo sprite muda de comportamento
  pelo bioma: o `drone` da Fábrica escolta o `tank`, o do Espaço orbita a
  `mothership`. Uma tabela no config, zero arte nova.
  *Interage com: config, boss.ts (orbitar é um mini-pattern), flow field.*
- 💡 **Fúria de chefe data-driven.** Quinta ação no `pattern`: `enrage`, abaixo
  de X% de vida — mais velocidade e cadência, telegrafia curta. Muda o ritmo
  final da luta sem boss novo.
  *Interage com: boss.ts, barra de chefe, música (3.6).*
- ⚠️ **Portador de escudo (inimigo novo).** Só entra se flanquear virar
  decisão real (escudo bloqueia à frente, expõe as costas). Custa sprite + IA
  nova — é o inimigo mais caro da lista.

### 3.4 Arsenal e economia

- ⚠️ **Desgaste + bancada de reparo.** A condição da arma piora com uso (a cada
  X tiros); a loja conserta com moeda. Dá uso à qualidade `quebrada` e aos
  `sfxFerrugem`/`sfxCondicao`. **Cuidado**: não virar imposto irritante — teto
  de desgaste baixo, reparo barato, e nunca degradar a arma *durante* o chefe.
  *Interage com: weapons.ts (condição já existe), economia, peças, som.*
- 💡 **Contratos do vendedor.** 1 contrato por loja: "mate o chefe do Pântano
  sem tomar dano", "feche a fase só com a pistola". Paga moeda ou peça.
  Curadoria: sempre 3 à vista, um deles garantido alcançável.
  *Interage com: shop, conquistas, eventos aleatórios, moral.*
- 💡 **Venda de peça na mochila** (SPRINT 9) + **presets** (1.8).
  *Interage com: inventário, economia, ficha da arma.*
- 💡 **Peso × velocidade unificado.** Quando a armadura ganhar peso (2.4/2.5),
  arma pesada divide a mesma balança: quanto segura, quanto carrega. Tradeoff
  real de build, sem UI nova.
  *Interage com: armadura, velocidade (upgrades), dash.*
- 💡 **Teste de economia (o árbitro do empate técnico).** Renda de moedas por
  fase × preço dos upgrades × valor do XP num teste que trava o orçamento e diz
  qual lado pode apertar o outro. Sem ele, "empate" vira decisão por sensação
  a cada mudança.
  *Interage com: shop, XP, loot, balance.test (mesmo idioma de certificação).*

### 3.5 HUD, UX e acessibilidade

- 💡 **Bússola de objetivo.** Seta na borda da tela para o que importa fora do
  viewport: zona de reach, NPC do protect, vault descoberto.
  *Interage com: objectives, minimapa, câmera.*
- 💡 **Configurações 2.0.** Rebind de teclas; toggle de screen shake; intensidade
  de partículas; números de dano on/off. O painel de configurações já existe —
  é só ganhar linhas.
  *Interage com: input, effects.ts, renderer, save.*
- 💡 **Modo assistido (acessibilidade separada de dificuldade).** Dano recebido
  −25% e i-frames +20%, em Configurações. Não é "easy mode": fica fora dos
  modos e do ranking, e não mexe no conteúdo.
  *Interage com: damageTaken, i-frames, modos, conquistas (bloquear as de
  ranking se ligado).*
- 💡 **Paleta daltonismo-safe.** Os avisos críticos (dano, hostil, objetivo já
  cumprido) precisam de forma além de cor. Validar a paleta com simulador e
  travar num teste próprio (dentro do `biome.test.ts` ou um `palette.test.ts`
  novo).
  *Interage com: palette.ts, HUD, acessibilidade.*

### 3.6 Áudio, narrativa e apresentação

- 💡 **Mix reativo de verdade.** As 4 faixas OGG em stems (base + percussão +
  tensão) e o crossfade atual vira mix dinâmico: mais inimigos vivos, mais
  camada. Custo: re-exportar as faixas em camadas.
  *Interage com: audio.ts, boss (tema de tensão), dynamicDifficulty.*
- 💡 **SFX por material de impacto.** Tiro em metal/pedra/madeira com timbre
  próprio — o bioma já tinge os props; o ouvido pode tingir também.
  *Interage com: props por bioma, áudio, feedback.*
- 💡 **Diário reativo 2.0.** O diário comenta os dados que o save já tem:
  quantas vezes morreu no Espaço, qual chefe mais custou, melhor tempo por
  fase. O Rios escreve sobre o *jogador dele*.
  *Interage com: diary.ts, save, leaderboard, conquistas.*
- 💡 **Cutscene 2.0.** Retratos grandes do pack + cena montada por tile (2.2).
  O `bugs.md` pede "história que emocione" — metade disso é arte, e a outra
  metade é o texto de 2.7.

### 3.7 Ferramentas de desenvolvimento

- 💡 **Perf budget test.** Asserção no `npm test`: `update+draw` abaixo de X ms
  com 16 inimigos vivos na fase mais densa. Sem isso, o primeiro vazamento de
  performance aparece no PC de outra pessoa.
- 💡 **Hot-reload de mapa no dev.** Watch em `maps.ts` que recarrega a fase sem
  voltar ao menu — apaga o ciclo build→menu→jogar do dia a dia de level design.
- 💡 **`campanha-proof` com "jogador ruim".** Um agente que não atira mede o
  dano recebido real por fase (hoje a Passagem A é determinística e o bot morre
  cedo). Fecha o buraco que a sessão de 10/10 encontrou.

### 3.8 Publicação (quando decidir subir — guia no `PUBLISHING.md`)

- Corrigir ou consertar o 2P antes (1.2), pela promessa da página.
- Trocar `SUPPORT_URL` pela URL real e republicar o pacote.
- Trailer de 30s + 3 GIFs (chefe, loja, hazard) — o itch converte com GIF.
- Devlog curto por entrega relevante; a página do itch é vivo, não estático.
- Versão visível no menu (saber o que o jogador tem em mãos quando reportar).

### 3.9 O maior buraco criativo: o arco da Parte II–IV — ⚠️

A história só existe até o fim da Parte I e a ambição é III–IV. Antes de
escrever uma linha da Parte II, responder três coisas: **quem é o antagonista
de II** (o núcleo? os trilionários? algo acima deles), **o que cada parte
promete em escala** (o que significa subir de nível quando o Bunker já caiu), e
**como os 3 finais da Parte I convergem** sem trair a escolha do jogador.
Entregável: um beat sheet de II + uma linha de III–IV, e uma **cena-amostra**
antes das outras — mesmo método combinado para a Caverna: escreve uma, revisa
o registro, só depois escreve o resto.

**Progresso 2026-10-10:** os **3 caminhos** já estão escritos em
`docs/HISTORIA-II-IV.md` (patenteado / colônia / montagem 2079) — cada um com
premissa, antagonista, escala, convergência dos 3 finais, custo e linha de
III–IV. O que falta é escolher UM e, com ele, o destino do Fernandes.

### 3.10 Site do jogo + página do itch decorada — 🗒️ alvo decidido em 2026-10-10

**Decisão de 10/10:** o alvo é **itch + site que apresenta** (página estática
única, sem framework, com capturas reais, changelog, armas/inimigos gerados do
`config.ts` e o bestiário como lore) — o site **não** hospeda o jogo; quem joga
vai pro itch.

**[x] FEITO em 10/10 — `site/`** (`index.html` + `conteudo.js` gerado por
`tools/gensite.mjs`, que lê o `config.ts` real via Vite: 9 fases, 12 armas,
9 chefes, 31 inimigos, 19 upgrades — zero número escrito à mão). Estilo é o do
jogo: monospace do sistema, paleta tirada do `palette.ts`, textura de fundo = o
próprio tile de chão (CC0), sem gradiente/ícone/sombra/emoji. Capturas são
PNGs reais do harness. Verificado com screenshot (regra 16): tabelas com
9/12/31 linhas, zero erro de console, zero 404; um bug de dados foi achado
só por abrir a página (colunas `undefined` — li `family`/`fireRate` do tipo
errado; corrigido contra o `Weapon` real).
**O que falta para publicar:** hospedagem (GitHub Pages ou Cloudflare),
subir a pasta e ligar o domínio; e a parte do itch (cápsula + 3 GIFs), que é
fora daqui.

Pedido do dono do projeto (10/10): *"site para o game muito bem feito mesmo,
no estilo do game (padrão anti-IA)"* e *"decorar o site do itch.io do game"*.
Anotado para depois; nada aqui foi implementado.

**Página do itch (barato, faz diferença primeiro).** A página hoje é texto
tséptico com pouca imagem — e o itch converte com imagem. Ordem de custo:
1. **Cápsula + banner próprios** (630×500 e 960×400) montados com screenshot
   real do jogo + tipografia monospace + a paleta do `palette.ts`. Sem arte
   gerada, sem gradiente neon: o material é o do jogo.
2. **3 GIFs de 5s**: luta de chefe, loja (decisão), hazard/explosão. São as
   três coisas que a página precisa provar.
3. **Seções secas**: "O que é" (3 linhas), "Como jogar" (6 teclas), "O que
tem" (9 fases, 12 armas, 9 chefes, 4 modos), **disclosure de IA** como está.
4. **Devlog por entrega relevante** — a página é viva, não estática.
5. Ainda pendente do `PUBLISHING.md`: `SUPPORT_URL` real e a linha do 2P
   (só ganha `co-op`/"versus" quando 1.2 estiver consertado).

**Site do jogo (uma sessão, sem framework).** Página estática única, HTML+CSS,
hospedagem grátis (GitHub Pages ou Cloudflare Pages), e o portão anti-IA
valendo para ela também:
- **Jogar na própria página** (iframe do build do itch) — o site não vende,
  ele deixa jogar; a página do itch continua sendo a loja.
- **Conteúdo vindo dos dados, não escrito à mão**: lista de armas/upgrades/
inimigos gerada de `config.ts` no build (`tools/gensite.mjs`) — assim o site
  não mente quando o balanceamento muda.
- **Arquivo do Esquadrão** (3.3) tem casa natural aqui: bestiário e diário
  como páginas de lore, com gate de spoiler.
- **Estilo = o do jogo**: monospace, paleta pós-apocalíptica, capturas reais
  como decoração, grão/papel envelhecido em vez de gradiente. Sem analytics,
  sem pop-up, sem "sparkle".
- **Teste que trava o site** (`semSite.test.ts`, mesmo idioma do portão):
  nenhuma imagem referenciada que não exista, nenhuma cor fora da paleta,
  nenhuma fonte decorativa, nenhum `lorem ipsum`.
- Bônus que o site destrava: **kit de imprensa** (logo, 3 capturas, 1 GIF,
  ficha técnica) — que o `PUBLISHING.md` já pedia.

*Custo estimado:* itch, meia sessão; site, uma sessão; kit de imprensa, junto.
*Interage com:* PUBLISHING.md, `palette.ts`, 3.3 (bestiário), 3.6 (cutscene 2.0
para as imagens), `config.ts`.

---

## 4. Não recomendo agora (e por quê)

| Ideia | Por que não |
|---|---|
| Coop online | Não é networking, é autoridade de rede — decisão já fora (`DESIGN` §10). |
| Mapa procedural | O resultado lê como "feito por máquina", que é exatamente o que a direção proíbe. |
| Mobile/touch | O jogo não tem evento de touch nenhum e o `PUBLISHING.md` já decidiu desligar no itch. |
| Gamepad | Fora por decisão de 10/10: navegador + teclado/mouse é o alvo — só reabrir se a ambição mudar. |
| "Mais 10 armas" soltas | Arma que não muda a decisão do jogador não paga o custo de asset, som, sprite de bala e balanceamento. |
| HUD em DOM | Quebra a regra do canvas único e já foi a causa de metade dos overlaps da v1.2. |
| Progressão *durante* a fase | Reabrir isso muda a economia inteira (loja perde o posto de decisão central). Se um dia, com uma pergunta só. |
| Steam agora | Página e validação são recompensa de um jogo fechado; o 2P e o polimento vem antes. |

---

## 5. Ordem sugerida (se ninguém decidir nada)

1. **Portão anti-IA** — destrava confiança em todo o resto.
2. **Dívidas 1.1–1.4** — Castelo, 2P, fim de fase, telemetria (são as que o
   jogador sente).
3. **Som + arte das cutscenes + texto** — o trio que tira a "cara de IA".
4. **Progressão (2.4)** — o maior destrave de sensação de roguelite.
5. **Campo 2.0 (muros + salas) e rejogabilidade (semente do dia, boss rush).**

E a régua de sempre: cada entrega fecha `tsc`, `npm test`, `npm run visual` (com
os PNGs abertos) e, quando mexer em HP/onda, a prova da campanha.

---

## 6. A mesa de discussão

A primeira rodada (seis perguntas) foi respondida em 2026-10-10 — as respostas
estão no §0. As conversas que continuam abertas:

1. **O arco II–IV (§3.9).** Quem é o antagonista de II, o que cada parte
   promete em escala, e como os 3 finais da Parte I convergem. Precisa de uma
   sessão de história dedicada, com a cena-amostra antes do resto.
   **Três caminhos escritos para avaliação** em `docs/HISTORIA-II-IV.md`
   (patenteado / colônia / montagem 2079), cada um com premissa, antagonista,
   escala, convergência dos 3 finais, custo e linha de III–IV. Falta escolher
   UM — e decidir o destino do Fernandes, que é o único fio dos três.
2. **O teste de economia.** Qual é a renda-alvo por fase (moedas ganhas ×
   custo do que a loja oferece × valor do XP)? O teste trava qual dos dois
   lados pode apertar o outro.
3. **O desenho do Castelo (§1.1).** Abrigo do NPC, interceptação da linha de
   tiro ou vida de escolta — escolher uma para desenhar e testar.
4. **A ordem do "tudo" (§5).** A régua vira cronograma: qual frente puxa a
   fila quando duas estiverem prontas ao mesmo tempo?
5. **Site + itch (§3.10).** Decidido em 10/10: itch decorado + site que
   apresenta (sem iframe). Ordem: cápsula e GIFs primeiro, depois o site
   estático com conteúdo gerado do `config.ts` e o kit de imprensa. As cenas
   das outras 5 fases (2.2b) rendem as imagens do site sem custo extra.

---

*Este documento não é uma promessa — é um cardápio. Cada linha que virar obra
sai daqui e entra no `TODO.md` com `[ ]`; o que não for escolhido fica aqui
como conversa, sem dívida.*
