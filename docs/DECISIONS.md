# Log de Decisões Autônomas

Sessão conduzida em **modo autônomo** (usuário ausente), executando o plano
`.kilo/plans/1791032082850-quiet-plan.md`.

Uma linha por decisão, com a alternativa rejeitada — é o que permite revisar
sem reconstruir o raciocínio. Para desfazer uma decisão, apague a linha e o
respectivo código volta ao estado anterior. A visão do jogo está em
`docs/DESIGN.md`.

| # | Onde | Decisão | Motivo | Alternativa rejeitada |
|---|------|---------|--------|------------------------|
| 1 | `src/maps.ts`, `tools/genmaps.py` | Mapas gerados por script, não escritos à mão | 9 grades de 30×20 autoradas à mão erraram a largura de quase todas as linhas; o script valida largura, borda fechada, P único e conectividade por BFS antes de emitir | Corrigir as linhas à mão |
| 2 | `src/systems/terrain.ts` | Chão escuro, parede **clara** | Com chão claro e parede preta o olho lê a massa clara como objeto e o mapa vira uma coleção de buracos; invertido, o jogador lê onde não pode andar | Manter chão claro (parede como buraco) |
| 3 | `src/systems/terrain.ts` | Chão = tile do Kenney dessaturado e multiplicado pela cor do bioma | O pack é saturado e claro; o `multiply` pela cor do chão dá textura sem brilho e resolve o conflito com a paleta sóbria | Usar só tiles "bons" e acceptar o brilho |
| 4 | `src/maps.ts` | Só tiles **chapados** (std < 4) como piso | Tile com fiada de tijolo no chão fazia o piso parecer parede — invertia a leitura | Usar os tiles de alvenaria do pack |
| 5 | `src/systems/terrain.ts` | Parede desenhada proceduralmente, não com tile | Tile de borda direcional não autotileia e não dá leitura de "bloqueia" | Autotiling com os tiles de borda |
| 6 | `src/systems/sprites.ts` | Tiles de chão só os **chapados** de banda de luminância estrita | Escolher tiles por banda (±3 de luminância) elimina o patchwork de valores no piso | Escolher por semelhança de cor |
| 7 | `public/assets/` (era `assets/`) | Assets estáticos movidos para `public/` | Com `assets/` na raiz, `vite build` não copiava nada: as sprites funcionavam em `npm run dev` e davam 404 em produção. Bug invisível no dev | Manter na raiz e aceitar sprite quebrado no build |
| 8 | `assets/music/*.ogg` | Faixas sintetizadas por `tools/genmusic.py` em vez de baixar loops CC0 | Sem rede garantida no build; sintetizar é licença limpa e reprodutível | Baixar de itch.io e depender de rede |
| 9 | `src/maps.ts` | Objetivo `destroy` conta **3 ninhos** na Caverna | O validador exige `N` == `objectiveTarget`; 3 é o número de ninhos que o mapa tem | Deixar o alvo divergir do mapa |
| 10 | `src/main.ts` | Salvar `wave: 0` no save | `nextPhase()` já volta para a onda 0, então salvar a onda atual era enganoso e nunca era lido | Ler a onda salva no resume |
| 11 | `src/ui/shop.ts` | Aviso de compra na faixa de rodapé | No meio da tela ele cobria as duas colunas da loja | Manter no centro da tela |
| 12 | `src/ui/shop.ts` | `attachShopWheelListener()` chamado pelo `main.ts` | Listener de `document` no topo do módulo quebra o layout puro em Node, tirando os testes de `getShopLayout` | Manter o listener no módulo e perder os testes |
| 13 | `src/systems/audio.ts` | Toggles de música/SFX em `localStorage` | A opção existe no menu e no pause; sem persistir, toda sessão recomeça com som ligado | Sem persistência |
| 14 | `src/systems/gameModes.ts` | Cortado para 4 modos | `survival`, `missions` e `bossrush` não tinham uma única função ligada; o objetivo por fase do Sprint 2 cobre esse papel | Manter 7 opções com 3 inertes |
| 15 | `src/systems/collision.ts` | Colisão swept por distância ponto-segmento | Laser a 1200px/s anda 20px/frame contra raio de hit ~21px e atravessava inimigos | Subir o raio de hit |
| 16 | `src/systems/tilemap.ts` | Flow field em vez de A* por inimigo | 600 células de Dijkstra custam quase nada, dá o mesmo resultado por inimigo e resolve o empilhamento de graça (separação por força, não por path) | A* individual |
| 17 | `src/systems/skills.ts` | Dash segue a **direção do movimento** | Uma esquiva que vai para onde a arma aponta é o oposto de esquivar | Seguir a mira |
| 18 | `src/systems/props.ts` | Ninho (`N`) é um terceiro tipo de prop | Dá objetivo destrutível de verdade ao `destroy` reaproveitando a explosão em cadeia | Ninho só decorativo |
| 19 | `src/systems/boss.ts` | `step` do runtime começa em `-1`, não `0` | Com `0`, `step.index !== rt.step` é falso no primeiro frame e o chefe nunca telegrafava a **primeira** ação: ficava 2.6s em silêncio e atacava sem aviso | Deixar a primeira ação sem telegrafia |
| 20 | `src/ui/hud.ts` | Barra de boss mostra o texto de `pattern[].telegraph` | Os 9 chefes declaravam um texto de telegrafia e `hud.ts` mostrava um "PREPARANDO..." fixo — o dado era morto. O VIGIA existe para ensinar, e teach sem o texto não ensina | Manter "PREPARANDO..." genérico |
| 21 | `tools/genmaps.py` | `arena()` abre praça de boss em Cidade e Bunker | O maior retângulo livre era 13x3 na Cidade e 1x28 no Bunker: chefe de raio 42+px preso em corredor fica batendo na parede | Deixar o chefe nascer no centro do mapa |
| 22 | `src/config.ts` | VIGIA e NÚCLEO sem `charge` no Bunker | A galeria do Bunker tem 6 células de altura; investida a 620px/s por 0.75s são 465px de parede | Dar investida ao chefe final |
| 23 | `src/systems/terrain.ts` | `drawTerrain` não centraliza nada | A câmera já centraliza o mundo quando ele é menor que a viewport (`clampToWorld` devolve negativo); centralizar nos dois aplica o offset duas vezes e desloca o mapa em janelas largas | Centralizar também no draw |
| 24 | `src/systems/boss.ts` | Investida resolve contra o grid (`moveCircleBy`) | Escrever em `e.x` direto faz o chefe atravessar parede, e na praça da Cidade isso acontecia no primeiro ataque — exatamente quando o jogador está sendo ensinado a usar cobertura | Deixar a investida ignorando geometria |
| 25 | `src/main.ts` | Props seguram tiro de inimigo **só** na Cidade (`hazard === 'debris'`) | Cobertura que não protege é enfeite. Mas aplicar em todas as fases mexeria no balanceamento das 9 de uma vez, e a Cidade é a fase que ensina a usar cobertura — faz sentido ser a primeira a entregar a mecânica | Tornar props cobertura universal |
| 26 | `src/main.ts` | Na Cidade o entulho desmorona com um tiro | A fase 1 só tem `grunt`, que não atira, então a regra de linha de tiro nunca era exercida ali. O desmoronamento é a metade visível de "entulho" e aparece no primeiro tiro do jogador | Deixar o debris só como regra invisível |
| 27 | `src/main.ts` | Névoa é vinheta larga (470px), não cone | A lanterna da Caverna tem cone e corta a tela; se a névoa fosse igual, seria a mesma mecânica com nome diferente. Larga e gradual ainda deixa ler a forma do que está perto | Reusar `drawFlashlightOverlay` na Floresta |
| 28 | `src/systems/renderer.ts` | Pose do jogador = classe da arma, não `stand` | `gun`/`machine`/`silencer` desenham o personagem **segurando** a arma (16px mais largas que `stand` pelo cano); `stand` e `hold` são as duas poses sem arma. O jogador ficava em `stand` quando não atirava, então a arma só aparecia no disparo | Continuar em `stand` e desenhar a arma na ponta |
| 29 | `src/systems/renderer.ts` | Sprite `weapon_*` da ponta removida | Duplicava o cano que já vem na pose, e era desenhada com `rotate(-angle)` dentro de `rotate(angle)` — ficava sempre na horizontal, independente da mira | Manter a arma solta na ponta |
| 30 | `src/systems/renderer.ts` | Linha de mira só no fallback sem sprite | Com sprite ela ficava por cima do cano parecendo laser atravessando a arma; a direção já é legível porque o corpo inteiro gira para a mira | Desenhar a mira sempre |
| 31 | `src/systems/renderer.ts` | Inimigo atirador fica armado fora do disparo | `enemyPose` só usava `machine` nos 0.2s antes do tiro, então o atirador aparecia desarmado o resto do tempo — mesma falha do jogador | Manter a pose armada só no instante do tiro |
| 32 | `src/systems/renderer.ts` | `enemyPose` perdeu o parâmetro `moving` | `drawEnemies` passava `true` fixo, então o ramo `moving ? 'stand' : 'hold'` nunca chose o outro lado. `Enemy` não guarda `vx`/`vy` (a direção vem do flow field por frame), então não há como derivar "andando" sem guardar estado extra | Manter o parâmetro morto |
