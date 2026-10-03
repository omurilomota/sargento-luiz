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