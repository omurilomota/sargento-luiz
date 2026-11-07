# PENDÊNCIAS — lista viva

> Atualizado: 2026-11-07 14:12 · branch `develop` · merge `8da044c` · código `6971442` · docs `7f9a328`
>
> Este é o lugar de consultar o que está aberto. `TODO.md` guarda o histórico
> das sessões (muitos itens `[ ]` de lá já foram entregues e ficaram como
> registro). `docs/IDEIAS.md` guarda o que é proposta, não compromisso.
>
> Régua: **P0** = promessa quebrada ou bug relatado; **P1** = dívida de
> sistema/UX; **P2** = conteúdo novo. **Decidido** = não reabrir sem motivo
> novo.

## Estado do disco (conferido em 2026-11-07)

| métrica | valor |
|---|---|
| fases | 16 |
| armas | 13 |
| chefes | 16 de fase (17 tipos com o Rogério da Fábrica), mais a fila `NUCLEO_RUSH` na fase final |
| tipos de inimigo | 40 |
| combos | 7 |
| testes | 1439 em 66 arquivos |
| `tsc --noEmit` / `npm run build` | limpos |
| render | `npm run visual` sem 404/pageerror |

---

## Fechado em 2026-11-07

| item | o que era | onde |
|---|---|---|
| Auras verdes/roxas/amarelas | o sprite do inimigo era multiplicado pela cor do tipo e virava silhueta chapada | `renderer.ts` (tint removido), `sprites.ts` |
| “1–9 trocar armas” | HUD prometia 9 slots com inventário de 4; com uma arma aparecia “1–9” | `hud.ts`, `tutorial.ts`, site |
| Amigo/doutor/Júlio na parede | NPC nascia em `p.x + 60` sem validar o grid | `main.ts` (`pushOutOfWalls`) |
| Setas movendo os dois no 2P | P1 lia as setas mesmo com o P2 ativo | `main.ts` (`setasDoP2`) |
| Ícone do site/jogo | `favicon` era `data:,` (vazio) | `public/assets/ui/icone.png`, `site/imagens/icone.png` |
| Números do site | anunciava 9 fases, 12 armas, 9 chefes | `site/index.html` |

## Fechado em 2026-11-07 (playtest, 13:12 · `883740b` + worktree)

| item | o que era | onde |
|---|---|---|
| Explosivos hitkill | BFG somava 5 projéteis no centro do chefe e apagava o VIGIA de 290 HP com uma carga. Dano por projétil reduzido (BFG 100→38, RPG 81→70, Granada 50→42, Mina 50→44, Destruidor 120→110) e teste novo trava a soma contra a resistência de chefe | `config.ts`, `explosivos.test.ts` |
| Árvore caída com colisão fantasma | `detonateProp` zerava a vida de tree/carro; o sprite sumia mas o blocker continuava. Os dois viraram cobertura permanente e a cadeia de barril não os derruba | `props.ts`, `props.test.ts` |
| Música sumida e sem estado visível | o gesto agora tenta retomar a faixa se o contexto já está rodando mas a fonte não chegou; o rodapé do menu mostra `M: Musica LIGADA/DESLIGADA` | `audio.ts`, `renderer.ts` |
| Letras pequenas e prompt escondido | cutscene com corpo 18px e prompt 15px em mostarda; caixa pequena com 132px de altura, corpo 16px e `ENTER OU CLIQUE PARA CONTINUAR` central. A dica do tutorial some enquanto a caixa está aberta (ela cobria o prompt) | `renderer.ts`, `main.ts` |
| Chegada da Fábrica nunca abria | `main.ts` testava `fase === 3` (Hospital) para a caixa da Fábrica; o índice certo é 5, a única fase sem cutscene grande | `main.ts` |
| Jogo seco no movimento/impacto | recuo de tiro no eixo da mira, balanço curto de passo e squash de 16% no flash de dano — tudo com as poses do pack, sem frame inventado | `renderer.ts`, `weapons.ts` |

## Fechado em 2026-11-07 (playtest, 14:11 · `6971442`)

| item | o que era | onde |
|---|---|---|
| Pátio sem trilho e sem trem | a fase se chamava Pátio de Trens e o mapa não tinha nem um dormente. Entraram 2 trilhos camináveis, locomotiva e vagão sobre células `#` (colisão/BFS preservados) | `maps.ts`, `terrain.ts`, `gen_assets_trens.py` |
| Combustível indistinguível de barril | o tambor `G` era o mesmo barril do bioma. Ganhou galão, clarão do pack e rótulo `COMBUSTÍVEL`; o dano continua recusado para a fase não ficar impossível | `props.ts`, `gen_assets_combustivel.py` |
| Combate sem peso | acerto e abate comuns não tinham som próprio; o abate tocava explosão. Entraram `impacto`/`abate`, poeira de passo, rastro de dash, recuo de tiro e squash no dano | `audio.ts`, `particles.ts`, `main.ts`, `renderer.ts` |
| Poucas silhuetas de inimigo | 40 tipos usavam 9 corpos do Kenney. Entraram 3 zumbis externos (SpriteAttack, CC0) na variação por bioma | `sprites.ts`, `public/assets/sprites/enemies/` |

## Auditoria de assets por fase — playtest 07/11

O relato se repetiu em quase toda fase: **o lugar não tem o objeto que o nome promete**. A tabela abaixo é o que o mapa tem hoje, o que falta para o jogador ler a fase sem legenda, e a prioridade. “P1” = identidade da fase; “P2” = camada de detalhe.

| fase | o que já está na tela | o que falta | prio |
|---|---|---|---|
| Cidade em Ruínas | casas (`parede_predio`), entulho, 3 carcaças, caixotes/barris, tornado | fachada de loja, toldo, poste, placa, saco de areia, mais variações de carro | P2 |
| Rodovia | asfalto com faixa e ombro, 8 carcaças, engradados | **cabine de pedágio e cancela** (o chefe é o Pedagiário e não existe pedágio), guard-rail, placa, caminhão tombado, mato seco | P1 |
| Floresta | 2 árvores vivas, 1 morta, ninhos, caixotes | sub-bosque, tronco caído, pedra, cogumelo, acampamento, fogueira, pegadas | P2 |
| Hospital de Campanha | piso/parede de azulejo, neblina, caixotes/barris | **maca, soro, biombo, mesa de cirurgia** (o chefe é o Cirurgião), armário de remédios, barricada de colchão | P1 |
| Caverna | cristais 264/265, escuridão, ninhos | estalactite, veio de cristal, carrinho de mina, trilho, lanterna, ossada, lago subterrâneo | P1 |
| Fábrica | piso metal, cápsula BioGen, arco elétrico, robôs | esteira, prensa, tubulação, empilhadeira, painel, tanque, faixa de alerta | P1 |
| Pátio de Trens | trilho, locomotiva, vagão, dormentes, arco elétrico | **plataforma, sinal, batente, mais vagões**, carga, lampião, guindaste; o trem é estático | P1 |
| Ponte | vazio, extração, baixa gravidade | cabo de suspensão, guarda-corpo, trecho caído, placa, vento visível | P1 |
| Pântano | lama, 18 árvores mortas, ninhos, neblina | junco, água parada, passarela de madeira, barco, ossada, neblina baixa | P2 |
| Refinaria | 4 tambores `G` com galão e rótulo, lava, caixotes | **tubulação, tanque, torre de destilação** (o chefe é a Torre), chama, vazamento, placa de perigo | P1 |
| Subestação | arco elétrico, concreto, metal | **transformador** (o chefe é o Transformador), poste, cabo, painel, isolador, placa de alta tensão | P1 |
| Vulcão | lava, extração, cinza | obsidiana, fenda, gêiser, ossada queimada, fumaça, ponte de pedra | P2 |
| Porto | areia, tijolo, 3 armazéns `N`, neblina | **água** (o mapa não tem um tile de água), beira do cais, guindaste, barco, contêiner, corda, gaivota | P1 |
| Castelo | arenito, espinhos, tocha, brasão, foguete `F` | torre, portão, trono, estandarte, estátua, fosso, ruína | P1 |
| Espaço | piso metal/vidro, painel, baixa gravidade | casco, console, campo de asteroide, eclusa, destroço flutuante, starfield; **caixote/barril de terra não lêem no vácuo** | P1 |
| NÚCLEO-CENTRAL | bunker, berço de biomaquina, alarme | rack de servidor, cabo, tanque de contenção, porta blindada, monitor, luz de emergência | P1 |

### Lacunas que atravessam as 16 fases

| lacuna | evidência | prio |
|---|---|---|
| **Inimigos reciclados** | 40 tipos para 12 corpos-base; runner, tank, spitter, drone, ufo, elemental e knight ainda são o mesmo manequim com cor/tamanho diferente | P1 |
| **Chefes sem silhueta própria** | 17 chefes, todos montados com um corpo comum + anel + escala. Pedagiário, Maquinista, Torre, Transformador e NÚCLEO são os que mais pedem sprite próprio | P2 |
| **Caixote e barril genéricos** | o mesmo par tintado aparece em 16 biomas, inclusive Espaço e NÚCLEO. Falta 1–2 props específicos por fase | P1 |
| **Affordance só no combustível** | `G` agora tem galão e rótulo; `N` (ninho/armazém), `R` (extração), `F` (foguete) e `B` (chefe) continuam sem ícone/rótulo no mundo | P1 |
| **Ambiência por fase** | existe one-shot por bioma (`ambiente.ts`); falta camada contínua/loop e transição entre fases | P2 |
| **Arena de chefe** | nenhuma fase muda a cenografia quando o chefe entra; o anel é a única marca | P2 |

### O que o relato pediu

- **“Pátio de Trens sem trilho e sem trens”** — entregue: trilho caminável, locomotiva e vagão; o trem é cenário estático, não veículo.
- **“Na Refinaria, quando é que o cara vai saber que caixas são combustíveis?”** — entregue: galão, clarão e rótulo `COMBUSTÍVEL` no tambor; a coleta continua por proximidade.
- **“Mais assets específicos para cada fase”** — a tabela acima é a resposta; as lacunas P1 são a próxima fila, começando por água no Porto, pedágio na Rodovia e mesa de cirurgia no Hospital.
- **“Mais assets para inimigos”** — 3 corpos novos entram na variação; a lacuna de fundo é 1 corpo por arquétipo, não mais recolor do mesmo manequim.

## P0 — aberto

| # | item | evidência | próximo passo |
|---|---|---|---|
| P0-1 | **Onda 1 do Vulcão demorada** | onda 0 nasce com 4 inimigos, 1 a cada 1,2s, em célula aleatória fora da tela; os tipos do Vulcão andam a 35–90 px/s. Num mapa 30×20, o spawn pode cair a ~1.500 px | medir `npm run fases` no Vulcão e comparar com as outras fases. Depois escolher: (a) primeira onda nascer na célula válida **mais próxima** fora da tela; (b) `C5` pular onda com recompensa. Não mexer sem a medição |
| P0-2 | **Multi-spawn na Ponte não existe** | `spawner.ts` cria um inimigo por vez; a Ponte tem 5 ondas como as outras | desenhar onda em grupos (2–3 corpos por célula) e provar no `ponte-proof` |
| P0-3 | **Torreta não anda, inimigos não a atacam, contratado fraco** | `npcs.ts`: torreta fixa em `postX/postY`; o alvo dos inimigos é o jogador (ou o foguete no `protect`). Contratado: dano 6, alcance 280 | tratar como uma frente só: tecla `T` move a torreta, aggro de inimigo em aliado, números do contratado medidos em `servicos-proof` |
| P0-4 | **Martelo não é corpo a corpo** | o `Destruidor` é lançador de projétil explosivo (`bulletSpeed 460`) | desenhar família `melee` (arco de golpe, sem munição, alcance curto) e migrar o martelo; exige o sistema de melee, não um número |
| P0-5 | **Diário pouco presente; loja sem dicas; missões fora do TAB** | `diary.ts` tem as entradas e o save; a loja não notifica e o TAB mostra mapa/ficha/combos, não missões | loja: card do diário + inspeção de custo/ganho; TAB: página de missões por fase |
| P0-6 | **Timing dos SFX** | `initAudio()` já chama `preloadSfx()` para as 52 chaves; não reproduzi atraso depois disso | se voltar, medir a primeira reprodução por chave (prova com `performance.now`) antes de mexer |
| P0-7 | **Limpeza da raiz** | há `freebuff-chat-*.md`, `sargento-luiz.zip`, arquivo de hash e docs soltos | **precisa de autorização** do dono: apagar arquivo é destrutivo e pode incluir material de sessão |
| P0-8 | **7 fases novas fora da régua do bot** | a tabela do `STATUS.md` mede as 9 fases da v1.4; Rodovia/Hospital/Trens/Ponte/Refinaria/Subestação/Porto não têm linha | rodar `npm run fases` e anexar o JSON ao STATUS |

## P1 — dívida de sistema/UX

| # | item | estado |
|---|---|---|
| P1-1 | **Objetivos rasos**: 6 das 16 fases são `clear` (sem condição de vitória além de limpar) | alinhar Fábrica à cutscene (`destroy` nos robôs) e desenhar objetivo secundário em paralelo |
| P1-2 | **Mural de conquistas** | só existe toast; falta a tela que lista as 21 |
| P1-3 | **Mural de personagens** | `story.ts`/`diary.ts` têm as histórias; falta o roster visual |
| P1-4 | **Moral ↔ sorte e eventos aleatórios** (Sprint 7) | não iniciado: estado `event`, escolhas, persistência |
| P1-5 | **Armaduras, slots de skill e árvore de talentos** (T6/T4b) | não iniciado; a árvore atual tem 24 degraus + 4 especiais |
| P1-6 | **Muros quebráveis** | não iniciado; mexe em colisão, pathfinding e render ao mesmo tempo |
| P1-7 | **Competitivo “apelão”** | bots e dano foram ajustados em rodadas anteriores, mas falta medição dedicada; o 2P acabou de receber o conserto das setas |
| P1-8 | **`main.ts` grande** | ~3.950 linhas; concentra menu, loja, cutscene, input e update. Separar por estado, não por “arquivo novo” |
| P1-9 | **Playlist de música** (T2) | 5 faixas OGG com crossfade; falta curadoria por fase/boss |
| P1-10 | **i18n en-US** | ~1.574 strings sem camada de tradução; decidido depois da publicação em português |
| P1-11 | **Site: conteúdo e revisão de IA** (T3) | o site é gerado do `config.ts`; falta aprofundar e revisar a parte final |

## P2 — conteúdo novo

- armas 13 → 20+ (cada uma exige família, som, projétil, pose e prova);
- sprites por função, não reciclados por bioma;
- cenografia por bioma (casas na Cidade, salas no Hospital, cabana na Floresta, trem andando no Pátio);
- chefes com mecânica própria (rei que escala por ano, maquinista, gárgula);
- modo online — **decidido adiado** em 2026-10-10 (seria co-op, não competitivo).

## Decidido / fora de escopo

- **Online** — adiado; não reabrir sem decisão nova.
- **Mapa procedural** — o resultado lê como máquina; proibido pela direção.
- **Mobile/touch e gamepad** — navegador + teclado/mouse é o alvo.
- **HUD em DOM** — quebra o canvas único.
- **Steam e CrazyGames/Poki** — depois do jogo fechado; exigem wrapper/SDK e touch.
- **Progressão durante a fase** — reabrir muda a economia inteira.

## Régua de entrega

1. `npx tsc --noEmit`
2. `npm test`
3. `npm run build`
4. render mudou → `npm run visual` e **abrir os PNGs** (regra 16)
5. HP/onda mudou → `npm run fases` ou `npm run sessao`
6. toda entrega atualiza este arquivo e `STATUS.md` com data, hora e hash
