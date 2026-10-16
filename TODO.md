// Sempre leia antes de marcar X
// Status detalhado: ver STATUS.md

// ═══════════════════════════════════════════════════════════════
// CONCLUÍDO
// ═══════════════════════════════════════════════════════════════
- [x] Sons para cada arma especificamente.
- [x] Armas municiadas, podendo ter recarregamento.
- [x] Bug existente em que do nada inimigos morrem ou eu tomo dano.
- [x] Modo competitivo para jogar contra bots que seriam jogadores mais experientes.
- [x] Expansão da loja
- [x] Upgrades de personagens
- [x] Moedas que comprarão skins
- [x] Anúncios para comprar skins
- [x] Dinheiro para comprar skins
- [x] Jogo com muita cara de IA, pouco natural
- [x] Inimigos tomam dano do nada também.
- [x] Buff geral nos inimigos (a cada onda ficam mais fortes)
- [x] Possibilidade de builds de combos para melhor vantagem no jogo.
- [x] Loja com cliques errados, uns não podia comprar nem se quisesse e outras compravam o de cima.
- [x] R passara a ser para recarregar furia será movida para outra tecla.
- [x] Eventos de ambiente sem visual.
- [x] 1,2,3,4,5,6,7 etc não funcionam na tela inicial do jogo.
- [x] Tomo dano como se tivesse trombado em zumbi.
- [x] Tela inicial com opções de modo sobrepondo as teclas do jogo.
- [x] Timer pra saber quando posso usar fúria, escudo e demais poderes.
- [x] Bug de não conseguir selecionar nenhum, ENTER não funcionava.
- [x] Dano persiste na onda 2.
- [x] Projeto com muitos arquivos soltos, falta um cleanup geral.
- [x] Tela inicial com itens sobrepondo-se.
- [x] Diálogo passando muito rápido.
- [x] Tempo de recarga do poderes, poderes ficando em cima da barra.
- [x] Eventos do ambiente ficando em cima do tempo dos power-ups.
- [x] Upgrades da loja passando da tela.
- [x] Evento de ambiente ficando em cima dos pontos.
- [x] Armas muito baratas e muito dano, arma de raios hitkill.
- [x] História bem documentada com diálogos.
- [x] Achievements/badges (13 conquistas)
- [x] Leaderboard local (top 10)
- [x] Boss com fases de ataque (3 fases)
- [x] Modo hardcore (uma vida, sem loja)
- [x] Arma secreta BFG
- [x] Animação de morte do jogador (partículas + slow motion)
- [x] Transição animada entre fases
- [x] Sistema de save/load (localStorage)
- [x] Minimap
- [x] Power-up drops dos inimigos
- [x] Dificuldade progressiva dinâmica
- [x] Escolhas na história (3 opções no epílogo)
- [x] Diário de bordo do Rios (8 entradas)
- [x] Tutorial interativo (6 dicas)
- [x] Crítico visual com slow motion
- [x] Pausa com ESC

// ═══════════════════════════════════════════════════════════════
// PENDENTE
// ═══════════════════════════════════════════════════════════════

// --- ONLINE ---
- [ ] Modo competitivo online para jogar com amigos.
    (Decidido 2026-10-10: adiado. O formato seria coop, não competitivo — e
    mesmo assim o usuário avaliou como distante. Não fazer por enquanto.)

// --- OBJETIVO DE FASE ---
// [x] 5 tipos de objetivo: clear, survive, destroy, protect, reach
// [x] protect com fase (Castelo) e inimigo que caça o NPC (archer, huntsNpc)
// [x] reach com fase (Vulcão) e zona de extração a 15 células do spawn
// [x] protect não encerra a fase no 1o frame (latch "houve luta")
// [x] NPC com dano por segundo, não por frame (30 DPS)
// [x] protect: o objetivo não encerra mais a fase, ele libera o chefe
// [x] protect: o sobrevivente cair reinicia a fase (não existe fim negativo)
// [x] Marcador de boss no mundo: anel no chão, cor única terracota
// [x] Cobertura real nas 9 fases; só o entulho da Cidade desmorona
// [x] Paleta de props por bioma (antes 9 engradados bege iguais)
// [x] Curva de balanceamento monotônica + balance.test.ts (9)
// [x] 21 conquistas (13 -> 21) + achievements.test.ts (14)
// [x] main.ts: update() de 463 para 252 linhas; init() duplicado removido
// [x] props.test.ts (26) e terrain.test.ts (98)

// --- FEEDBACK DO JOGADOR (sessão 2026-10-05) ---
// [x] Crash ao sair da loja na última fase (getCurrentPhase() undefined)
// [x] Continuar o save devolvia só a pistola: inventário, qualidades e upgrades
// [x] Upgrades do mesmo efeito empilhavam (Dano +25% e +50% davam 1.75)
// [x] Balanceamento: crítico ×2 -> ×1.5 com teto de 60%, pierce com teto de 3
//     e -25% de dano, Laser e Raios com DPS abaixo de 40
// [x] Inimigo melee morria ao encostar; agora briga (bate e apanha no contato)
// [x] NPC atravessava parede (J alterna seguir/parar; protect faz todos caçarem)
// [x] Medkit como item de inventário, tecla H
// [x] Inimigos escalam com o tempo da fase
// [x] Névoa da Floresta removida
// [x] Bioma dá pró e contra nos 9 (o de dano recebido estava inerte, corrigido)
// [x] Serviço "Reparar Arma" na loja
// [x] Cobertura de teste: saveSystem (15), weapons (18), loot (12), biome (7)
// [x] Tela preta ao comprar skin: auditada, caminho correto, sem alteração
// [x] Som de tiro: 10 armas com estalo+corpo distintos e variação de pitch
// [x] Parede vem de tile do pack nos 8 biomas (Floresta usa a copa de 181/209)
// [x] Regra gravada no AGENTS.md: visual vem de asset, nunca de código
// [x] Procedural restante — AUDITADO, não há dívida:
//     drawHazard usa HAZARD_SPRITES com tile por hazard, e o desenho procedural
//     só roda atrás de `if (img) return` (fallback de asset que não carregou).
//     Os 7 tiles (260,265,264,268,316,319,320) existem no pack.
//     drawDecor tem spriteFor com os 9 biomas; os 9 tiles existem.
//     renderer: as arc/ellipse são sombra de sprite, anel de pulso e poeira —
//     código legítimo. O corpo do jogador e do inimigo estão no `else` do sprite.
//     darkness/lowGravity/none não marcam o chão por decisão de design
//     (terrain.ts), não por falta de tile.
// [x] Música real (Soundimage/Eric Matyas, livre com atribuição) no lugar da síntese do genmusic.py
// [x] Retrato das cutscenes já usam sprites do personagem quando carregado (fallback só se faltar sprite)

// --- BOSS ---
// [x] VIGIA na Cidade em Ruínas (fase 1) — primeira luta ensina o mapa
// [x] NÚCLEO no Bunker Central (fase 9) — chefe final, sem investida
// [x] Arena de boss nos 2 mapas que não tinham (corredor de 13x3 e 1x28)
// [x] Texto da telegrafia aparece na barra de boss (era dado morto)
// [x] Primeira ação de cada chefe telegrafada (step do runtime = -1)
// [x] Chefe não morre no contato: investida matava o chefe sozinho
// [x] Investida resolve contra o grid (a praça do VIGIA ficou inútil sem isso)
// [x] Lanterna da Caverna centralizada no jogador (overlay transladava 2x)
// [x] Terreno não desloca mais em viewport maior que o mapa

// --- SPRITES ---
// [x] Protagonista segura a arma quando parado (pose pela classe da arma)
// [x] Pose `reload` usada enquanto recarrega (estava carregada e sem uso)
// [x] Pose armada no inimigo atirador fora do disparo
// [x] Sem arma duplicada: a sprite weapon_* da ponta saiu
// [x] Os 9 chefes com sprite do bioma (antes todos caíam no fallback 'zombie')
// [x] assets.test.ts: pad de tile, 54 nomes de personagem, tipo sem sprite

// --- HAZARDS ---
// [x] fog (Floresta) deixa de ser número: vinheta larga em torno do jogador
// [x] debris (Cidade) deixa de ser número: props seguram tiro e desmoronam
// [x] Os 9 biomas têm efeito mecânico próprio (antes 6 de 9)

// --- LOJA ---
// [ ] Editor de fases visual: é uma ferramenta, não uma fase do jogo

// --- GEOMETRIA (a maior pendência do projeto até v1.3) ---
// [x] Tilemap 30×20 com colisão círculo-vs-grid e deslize por eixo
// [x] Câmera com follow/clamp e conversão screen→mundo
// [x] Flow field para IA (troca o seek direto que empilhava inimigos)
// [x] Prerender do terreno com tint por bioma (1 drawImage/frame)
// [x] Props destrutíveis: caixote, barril com explosão em cadeia, ninho
// [x] 9 mapas autorais com hazard e objetivo próprios
// [x] Colisão swept de projétil (Laser não atravessa mais inimigo)

// --- HISTÓRIA / NARRATIVA ---
- [x] Cutscenes com mais animação (fundo dinâmico por fase, retrato flutuando)
- [x] Escolhas na história que afetam o final (3 finais diferentes)
- [x] Personagens secundários integrados ao gameplay (NPCs spawam aleatoriamente)

// --- GAMEPLAY ---

// --- VISUAL ---
- [x] Tiles de terreno por fase (floresta, caverna, fábrica, pântano, castelo, vulcão, espaço)
- [x] Animação de morte completa do jogador (gira e encolhe por 1.5s)
- [x] Assets para eventos ambientais e chão de cada level (tiles procedurais implementados)

// --- LIMPEZA ---
- [x] Remover `src/engine/` (código morto, prototype raycaster)
- [x] Limpar package.json (remover ~11 deps internas do Vite listadas por engano)
- [x] Remover console.log de debug em `main.ts:228`
- [x] Integrar constantes de `localMultiplayer.ts` com `constants.ts`
- [x] Mover velocidades de tiro dos inimigos para config (hardcoded em main.ts)

// --- DIALOGO ---
- [x] Tecla ç para avançar/skipar diálogo + indicador visual no HUD

// --- VISUAL EXTRA ---
- [x] HitFlash visual nos inimigos ao tomar dano
- [x] Sombras no chão para jogador, inimigos e NPCs

// ═══════════════════════════════════════════════════════════════
// ASSETS NECESSÁRIOS ( sprites que faltam )
// ═══════════════════════════════════════════════════════════════

// --- INIMIGOS (sem sprite, usando formas geométricas) ---
// fireElemental, magmaGolem, inferno, crystal, asteroid, alien, frog, ufo, mothership

// --- ARMAS (sem sprite) ---
// shotgun, sniper, laser, rpg, raios, gel, granada, mina

// --- CHÃO / TERRENO POR FASE ---
// floresta (grama, árvores), caverna (rocha, cristais), fábrica (metal, engrenagens)
// pântano (lama, água), castelo (pedra, tochas), vulcão (lava, rocha), espaço (estação)

// --- UI ---
// ícones de habilidades (dash, shield, fury), ícones de arma, barra de munição

// --- Cenas ---
// retratos dos personagens (Rios, Vale, Ferreira) para cutscenes

// --- LAYOUT / OVERLAP ---
// [x] HUD 100% canvas em grade de 3 colunas (score não bate mais no minimapa)
// [x] Geometria única da loja: draw e hit-test no mesmo getShopLayout
// [x] Geometria única do menu: getMenuLayout (clique não selecionava outro modo)
// [x] Modos cortados de 7 para 4 (3 eram inertes)

// --- AUDIO ---
// [x] 4 faixas OGG reais com crossfade no lugar do piano procedural
// [x] 29 SFX reais em assets/sfx/ (campanha CC0: Kenney + OpenGameArt; tiros CC-BY 3.0 Vincent Sevedge)
// [x] Som distinto por habilidade (dash, escudo, fúria)
// [x] Toggle de música/SFX no pause, com persistência

// --- VISUAL / PALETA ---
// [x] Cores Flat UI saturadas removidas de combos, bots, multiplayer, explosões, story e skins (22 locais)
// [x] Skins reescritas como tons temáticos desaturados (Fogo/Gelo/Neon/Sangue/Robô em terracota/musgo/stone)
// [x] shadowBlur do body do jogador 15 -> 8 (uniforme com o título)

// --- ASSETS ---
// [x] assets/ movido para public/ (build de produção não copiava sprite nenhum)
// [x] Pad de 2 dígitos no nome do tile (todo tile de 1 a 99 dava 404)
// [x] Credits reais em public/assets/CREDITS.md

// ═══════════════════════════════════════════════════════════════
// SUGESTÕES AVANÇADAS (baixa prioridade)
// ═══════════════════════════════════════════════════════════════
- [x] Sistema de achievement/badges expandido (13 -> 21)
- [x] Testes unitários para sistemas de colisão e dano
- [x] Screen shake mais sutil e consistente (explosões, terremoto, relâmpago reduzidos)
- [x] Partículas de poeira no chão durante terremoto
- [x] Indicador visual de dano nos inimigos (hitFlash)
- [x] Sombras dos personagens no chão
- [x] Efeito de zoom lento no boss quando aparece
- [x] Performance: limitar partículas por frame (80/frame + 500 global)
// [x] Skins agora persistem via localStorage ('bubbleShooter_skins_unlocked'); resetSkins
//     carrega as salvas em vez de zerar
// [x] Serviços/Upgrades/Ads agora têm chips (inicial + cor) nas cartas da loja
// [x] HUD: painel sólido do topo-centro removido -> só sombra de texto no black
// [x] Boss: summon capado em 12 inimigos vivos; MAX_ENEMIES 30 -> 16 (não afoga mais a fase)

// ═══════════════════════════════════════════════════════════════
// BUGS DE JOGABILIDADE (2026-10-09)
// ═══════════════════════════════════════════════════════════════
// [x] Item preso em parede: moeda, power-up e caixa nasciam na posição crua do
//     inimigo morto e não tinham colisão nenhuma — se nascesse encostado na
//     parede, morria ali intocável. Spawn passa por pushOutOfWalls e a moeda
//     usa moveCircleBy. pickup.test.ts (20) trava nos 9 biomas.
// [x] Overlap no HUD: o score era desenhado em waveBarY+26 e o "ONDA x/y" em
//     waveBarY+18 — o topo dos dígitos invadia a label. Geometria extraída para
//     getHudCenterLayout; hudLayout.test.ts (15).
// [x] Overlap no menu: as linhas de controle avançavam 14px de h*0.88 e o aviso
//     de save era posicionado em h*0.94-18. Em 720p o "V: Créditos" caía
//     ACIMA do "C: Continuar jogo salvo". Rodapé virou getMenuFooterLayout,
//     ancorado pela base; menuLayout.test.ts.
// [x] Dano de projétil usava enemyCollisionDamage: armadura (que é placa contra
//     corpo a corpo) era aplicada a tiro, e os i-frames eram os de contato.
//     damagePlayer() estava morta; BULLET_INVINCIBLE_DURATION nunca se aplica.
// [x] resetPieces() nunca era chamada em resetGame(): peças equipadas e o
//     inventário vazavam de uma partida para a outra.
// [x] wasJammed, playerDied e os timers de fase não eram resetados por
//     resetGame(), então o valor residual da partida anterior sobrevivia.
// [x] endsPhaseOnDone() retornava false sempre e o bloco que a consumia em
//     main.ts nunca entrava. Função e bloco removidos; o teste que só confirmava
//     a tautologia foi trocado pelo que importa (toda fase tem chefe).
// [x] loot.ts calculava pieceType e pieceTypes num caminho que nunca os usava.
// [x] Respiro de fim de fase era armado só na morte do chefe. Agora é genérico:
//     qualquer abate que feche a última onda segura a ida à loja.
// [x] loot.test.ts era flake (~4%): 20 rollLootDrop sem mock num drop de 15%.

// ═══════════════════════════════════════════════════════════════
// LIMPEZA DE RESÍDUO DE GERAÇÃO (2026-10-09)
// ═══════════════════════════════════════════════════════════════
// [x] Comentários que narram histórico de bug ("antes X / o bug que / nunca
//     Y") — memória de sessão gravada no código. Reduzidos à decisão que vale.
// [x] gameModes.ts descrevia funções que não existem no disco.
// [x] ~236 tags @param/@returns que só repetiam o tipo que o TS já declara.
// [x] ~45 exports mortos (getWaveTimer, findHazards, buyWeapon que ignorava o
//     limite de inventário, drawFlashlight, getTotalKills, MAX_BULLETS...).
// [x] Statements inertes: `void POWERUP_TYPES`, `void H`, fillText de string
//     vazia na loja.
// [x] 8 comentários em inglês/espanhol no meio do português (dynamicDifficulty,
//     npcs, bots, saveSystem, terrain, main).
// [x] Seção `// ─── Reset ───` vazia em effects.ts; 2 blocos JSDoc órfãos.
// [x] Três listas paralelas de power-up que podiam divergir (loot.ts x2,
//     config.ts) — agora uma só, derivada de POWERUP_TYPES.
// [x] Diálogo duplicado entre story.ts e diary.ts (mesmo beat escrito duas
//     vezes: "a terra treme", "pelo menos tentei", "não é instinto").
// [x] "O mundo não tinha acabado" x3 em 12 linhas no epílogo.
// [x] Conquistas: 16 das 21 eram 4 templates aritméticos com nomes em sinônimo
//     crescente. 'Rebaixo' (que significa desconto) e jargão "props" na
//     descrição corrigidos; typos ('Cacador', 'Milionario') e meta-comentário
//     ("os 5 tipos de objetivo") fora.
// [x] Nomes de fantasia genéricos em combos e skins; 'Neon' prometia uma cor
//     que a paleta proíbe.
// [x] Subtitulo do menu dizia o gênero ("PÓS-APOCALÍPTICO"), não a premissa.
// [x] Barks de NPC eram 10 frases para 3 classes; agora por classe.
// [x] 'Mãe-Nave' na cutscene vs 'MOTHERSHIP' que o HUD imprime; 'OVN' typo.
// [x] Geografia errada: o Bunker é a fase 9, não "do outro lado" do Pântano.

// ═══════════════════════════════════════════════════════════════
// PUBLICAÇÃO — itch.io (português primeiro, inglês depois)
// ═══════════════════════════════════════════════════════════════
// [x] Fase 0: `base: './'` no vite (vite.config.ts:21). Build abre em iframe.
// [x] Fase 0: brand. package.json é `sargento-rios`, README sem "Bubble".
// [x] Fase 0: chaves bubbleShooter_* fora do bundle (distBuild.test.ts:54).
// [x] Fase 0: créditos dizem 29 efeitos (renderer.ts:613/615).
// [x] Fase 1: 2 botões na loja. Moedas virou "RESGATE DE MOEDAS" (shop.ts:1197)
//     — a diretriz do itch proíbe anúncio enganoso — e o botão de apoio abre a
//     página de doação (shop.ts:1223).
// [x] Fase 2: build, zip de dist/ e verificação local dos assets. Publicado no
//     itch.io (confirmado pelo usuário em 2026-10-10).
// [ ] DEPOIS: tradução para en-US (~1.574 strings, sem camada de i18n ainda).
// [ ] DEPOIS: CrazyGames/Poki. Exige touch (hoje só há mouse) e o SDK deles
//     no lugar do ads.ts. O dist passa folgado nos limites (12MB/658 arquivos).
// [ ] DEPOIS: Steam. Wrapper desktop, Steamworks, save em nuvem, ~$100.

// ═══════════════════════════════════════════════════════════════
// BUGS DE JOGABILIDADE — RELATADOS EM JOGO (2026-10-09)
// ═══════════════════════════════════════════════════════════════
// [x] Upgrade de vida descartado a cada fase: loadPhaseEnvironment chamava
//     initPlayer(), que recria o jogador com maxHealth 100. resetPlayerProgress
//     é o que partida nova usa; placePlayer() só reposiciona e cura.
//     playerProgress.test.ts (9)
// [x] Munição infinita: currentAmmo era UM escalar e setWeapon reescrevia com
//     magazineSize — trocar de arma devolvia o pente inteiro. Agora é Map por
//     arma, e o encasquilhamento também é por arma (trocar consertava de graça).
//     weaponAmmo.test.ts (13)
// [x] Boss nasce dentro de parede: o centro do mapa é '#' em cidade, floresta e
//     bunker, e o spawn usava forceX/forceY (que pula a validação do spawner).
//     findFreeSpotNear() busca em espiral. bossSpawn.test.ts (20)
// [x] Vulcão pulava a loja: o atalho do objetivo 'reach' chamava leaveShop(),
//     que vai direto para a próxima fase. Agora faz setGameState('shop') +
//     enterShop().
// [x] BFG e M. Quebrada sem som: não estavam em WEAPON_SOUNDS e caíam num
//     `|| sfxPistol` silencioso. O mapa foi para audio.ts e weaponSound.test.ts
//     (17) trava que toda arma tem som.
// [x] Descrições da loja prometendo mecânica inexistente: Gel "cola os inimigos"
//     e Shotgun "empurra os inimigos" — `Enemy` não tem campo de slow nem de
//     knockback. Texto corrigido para descrever o que o código faz.
// [x] Diálogo travado: advanceCutscene devolvia false enquanto a linha digitava,
//     a 18 chars/s. ENTER ficava inerte ~5s por linha e BACKSPACE (a única saída)
//     só era anunciado depois. Agora ENTER completa a linha, BACKSPACE pula a
//     cutscene inteira, a velocidade é 40 chars/s e o prompt fica sempre visível.
//     cutscene.test.ts (9) conta os toques INERTES de ENTER — precisa ser 0.
// [x] Contagem de 5s antes da loja (era 2,5s e silenciosa, então lia como
//     travamento). O número aparece no centro da tela.
// [x] Tiro de inimigo não acertava o sobrevivente: não havia colisão
//     projétil x NPC, só dano por contato. O arqueiro do Castelo é `huntsNpc`
//     e mirava no NPC — a bala passava. npcDamage.test.ts (8)
// [x] Bot nascia dentro da parede de borda: createBot usava -30 / worldW+30 e
//     main.ts passava worldW/worldH (tamanho do MAPA) nos parâmetros chamados
//     canvasWidth/Height. botsSpawn.test.ts (11)
// [x] "Conquista" a cada troca de arma: o aviso ARMANDO empilhava no mesmo
//     array das conquistas e o HUD prefixava CONQUISTA:. Toast agora tem `kind`.
// [x] Fontes: 42 de 128 eram 9/10/11px. Em monospace, O/0 e S/5 ficavam
//     indistinguíveis — o menu imprimia "SELECIONE 0 MODO" e "5: Efeitos".
//     Tudo agora é 11px, e o crédito de licença saiu de 9px/#333 (ilegível).
// [x] Teclas H (medkit), J (seguir NPC) e 1-9 (armas) não apareciam em lugar
//     nenhum. Agora ficam visíveis sob as skills, e o tutorial é dispensável
//     (ESC) e adianta ao atirar.

// ═══════════════════════════════════════════════════════════════
// VISUAL — DIAGNÓSTICO RESOLVIDO (pack Screaming Brain, 2026-10-10)
// ═══════════════════════════════════════════════════════════════
// [x] O pack Kenney Top-down Shooter NÃO é um tileset de piso/parede: medido,
//     453 de 520 tiles (87%) completamente chapados, e o chão dos 9 biomas usava
//     0 tiles com textura. Resolvido: Screaming Brain Studios "Top Down Dungeon
//     Pack" (CC0), 160 tiles 64x64 com rejunte/mancha/grão, 8 materiais de
//     chão x 8 variações e 6 de parede x 16. Fatiado por tools/extract_tiles.py.
// [x] Capa do menu (tile_31 95% cinza repetido 64x) -> MENU_TILE virou
//     dngeon_parede_concreto_0 (Sprint 10).
// [x] Paredes repetindo em grade 4x4 -> variante de parede com período maior e
//     claraboia sorteada contida (Sprint 10).
// [x] UPGRADE REAL: tileset CC0 de piso/parede com curadoria, CREDITS.md e
//     dungeonFloor/dungeonWall por bioma em maps.ts. Entregue pelo item acima.
//     Costura de 64px e "treliça de emendas" somem do chão, parede e capa.

// ═══════════════════════════════════════════════════════════════
// FEATURES PEDIDAS — PÓS-RELEASE
// ═══════════════════════════════════════════════════════════════
// [x] Renomear ASHFALL -> SARGENTO RIOS. "Ashfall" tem 8 jogos no itch.io,
//     vários com "AI Disclosure: AI Assisted". Colide com "Ashfall City"
//     (HTML5 wave shooter, mesmo gênero). Trocar em: package.json, index.html,
//     renderer.ts (titulo + creditos), README, STATUS, SUPPORT_URL e o prefixo
//     de save `ashfall.*` -> `rios.*` (13 chaves).
// [x] Alpha Wolf e um homem marrom: o pack nao tem NENHUM animal. 8 dos 29
//     tipos de inimigo nao batem com o sprite (mosquito, bat e slime sao zumbi).
//     A propria cutscene ja chama de "a matilha" e o padrao do chefe diz
//     CHAMANDO A MATILHA — renomear o chefe resolve por 1 string.
// [x] Preview de classe com upscale de 130px sem filtro: vira borrão. Usar
//     nearest-neighbor ou sprite maior.
// [x] Furia com mais eixos: hoje so mexe em dano (x2) e dano recebido (x1.5).
//     Candidato: tambem cadencia.
// [ ] Objetivos mais profundos: 5 das 9 fases sao `clear`, que nao tem condicao
//     de vitoria. Alinhar a Fábrica com a cutscene (destroy nos robos) e
//     possivelmente objetivos secundarios em paralelo.
// [x] Restricao de peca por classe de arma (allowedClasses no PieceType).
// [x] Comparador de armas na loja com DPS real, para o jogador ver se vale
//     trocar.
// [x] Auto-equip de itens.
// [x] Expansao de historia: a narrativa so aparece no comeco. Hooks prontos
//     sem uso: Fernandes morre na Fabrica e nunca e citado de novo; o NUCLEO e
//     a cura do Genesis nunca tem resolução em tela.
// [x] Som de recarga por arma.
// [ ] Novas armas. Esquema de armadura. Slots de skill. Arvore de habilidades.
// [x] Local 2P: RECONCILIADO em 2026-10-11. Este item dizia que o P2 "nao
//     leva dano e nao existe condicao de vitoria" e que `damagePlayer2`/
//     `getWinner` "foram removidos como codigo morto". NAO era verdade:
//     `damagePlayer2` esta ligado em `main.ts:811,817` e `getWinner` em `:820`,
//     com `immortality.test.ts` provando. O que faltava era o resto da tela:
//     [x] Tela de fim de partida entregue em 2026-11 (`drawFimLocal` +
//         `revancheLocal` + `fimLocal`): P2 cai e a tela entra por early-return
//         do draw (a partida continua em `playing`), ENTER é REVANCHE (mesma
//         fase, os dois de pé, sem perder arma/moeda/nível), e P1 caído desenha
//         "P2 VENCEU" em vez do GAME OVER de campanha. Prova em
//         `tools/local2p-proof.mjs` (`npm run local2p`), 7 checagens e 3 PNGs
//         abertos. A prova achou o defeito que fechou o item: o ENTER da tela
//         só existia no ramo `gameover`, então a queda do P2 nunca alcançava a
//         revanche — a tela anunciava uma tecla que não fazia nada.
//     [x] `setPlayer2Health` (setter público sem chamador) era a porta aberta
//         para o P2 virar invencível por engano; virou `matarPlayer2`, que o
//         harness de 2P usa para fechar a partida.
//     [x] P2 desenhado em 2026-11 (`drawPlayer2` + spawn ao lado do P1,
//         decisão do jogador): o módulo dá estado, sprite e rótulo "P2", e o
//         P2 nasce a 70px do P1 com `pushOutOfWalls` — antes era `worldW*0.75`,
//         fora da câmera, que segue o P1. Prova: `npm run local2p` mede
//         distância e viewport, e o PNG da partida mostra os dois corpos. O
//         achado nasceu de abrir esse PNG (regra 16): a tela de fim nova
//         nomeava um vencedor que ninguém tinha visto em campo.

// ═══════════════════════════════════════════════════════════════
// v2 — REBALANCEAMENTO E SISTEMAS NOVOS (2026-10-09)
// ═══════════════════════════════════════════════════════════════

// A curva de dificuldade esta invertida: o comeco mata quem nao sabe o jogo e
// o fim vira decorativo. Medido com o modelo real do jogo (pistola = 25,5 DPS
// efetivos com recarga; i-frame de contato 0,5s; pior caso = jogador cercado):
//
//   Onda 1 da Cidade, hoje: 8 inimigos -> 100 de dano de 100 HP -> MORRE
//   Onda 3 da Cidade, hoje: 14 inimigos -> 260 de dano -> MORRE
//
// E o poder do jogador diverge mais rapido que o do inimigo. O inimigo escala
// por ONDA (waveScale = 1 + wave*0.15, so 1.0x -> 2.05x na campanha inteira).
// O jogador escala por upgrade COMPRADO, e o topo e livre:
//
//   dano 1.75x | crit 1.5x | pierce 4 (5 alvos por bala) | vida 2.75x
//   armadura 0.40 | escudo 3 cargas | regen
//
// A taxa de limpeza vai ~11x enquanto o HP inimigo vai 3x.

// ─── SPRINT 0 — BALANÇO (entrega jogo jogável, não espera nada) ───

// [x] Hotfix do combo 'Carvão': a descrição diz "+30% de cadência" e o valor
//     real entrega +43%. fireRateBonus multiplica o COOLDOWN (main.ts:700),
//     não a taxa — renomeado para cooldownMult para não armar a armadilha de
//     novo. Teto de 1.5x no empilhamento de vida (Couro Duplo 1.25 x Imanência
//     1.30 = 1.625x, e os dois são independentes de arma, então empilham mesmo)
//     e piso de cooldown na hora de aplicar.
//     NOTA: a explosão multiplicativa de DANO que se supunha não existe — cada
//     combo de dano exige uma arma diferente e só se equipa uma por vez.
// [x] Fases 1 e 2 com difficulty 0.7 e 0.75 (antes as duas eram 1.0, o tier
//     máximo, enquanto a Caverna da fase 3 já vinha em 0.8).
// [x] Constantes de onda: WAVE_BASE_ENEMIES 8 -> 4, WAVE_ENEMIES_PER_LEVEL
//     3 -> 2, WAVE_BASE_SPAWN_RATE 0.8 -> 1.2.
// [x] balance.test.ts: a CERTIFICAÇÃO. Falha se a onda 1 da fase 1 passar de 4
//     inimigos, ou se o dano possível da fase 1 exceder a vida do jogador.
//     Roda no `npm test`, então o começo não regride sem o teste quebrar.
// [x] Curva de HP dos 9 chefes, TTK de 27s-288s -> 15s-75s. Total 20.879 ->
//     5.500 (-74%). O VIGIA cai de 499 para 290 (-42%): era o primeiro chefe e
//     exigia 28s de pistola, que é a única arma da fase 1.
//     vigia 290 | alphaWolf 380 | crystalQueen 550 | sentinel 360 |
//     leviathan 420 | reiMutante 630 | infernoPrime 830 |
//     mothership 980 | nucleo 1060
// [x] Tipo `mutante`: HP 80 (grunt 20), dano 25 (grunt 10), raio 26, vel 62,
//     coinDrop 12, sprite manBlue (asset do pack que ninguem usava). Um mutante
//     vale ~3 grunts em TTK mas o jogador mira em UM corpo so — a densidade
//     cai e a ameaca por alvo sobe. Sprite novo = falta ameaca visual.
// [x] Faucet de moedas fechado. O RESGATE DE MOEDAS dava 15 + 5*adsWatched sem
//     teto e sem reset por fase (resetAds so no resetGame): 30 resgates = 2625
//     moedas de graca, ou 78% de toda a renda da campanha sem matar nada.
//     Agora: 2 resgates por fase, reset em leaveShop(), e AD_REWARD_PER_WATCH
//     5 -> 0 (a recompensa crescia a cada uso, vira espiral).

// ─── SPRINT 1 — REGISTRO CENTRAL DE STATS (keystone) ───
// Sem isso a escada de perks vira addX() espalhada: hoje os stats sao ~10 `let`
// soltas entre player.ts e weapons.ts (damageMultiplier, pierceCount,
// critChance, reloadSpeedMultiplier, armorLevel, regenLevel, medkits...).
// [x] src/core/stats.ts: registro com applyStat(id, value) + clamp declarado.
//     11 stats: damageMult, critChance, critMult, pierce, reloadSpeed, armor,
//     armorMax (teto vivo, perk pode levantar), regen, coinMult, xpMult, luck.
//     Fora de propósito: maxHealth/speed (estado da entidade; o combo de vida
//     grava delta direto no player.maxHealth), escudo vivo, medkits.
// [x] Migrar player.ts e weapons.ts para ler daqui. Os add* viraram cascas de
//     applyStat — API pública intacta (loja, combos, testes e HUD sem mudança).
// [x] Teste de paridade: statsParity.test.ts (10) — cada expectativa é a
//     aritmética dos `let` antigos escrita à mão (piso 0.3 da recarga, teto 3
//     do pierce, teto 0.5 da armadura, soma sem clamp do crítico).
// NOTA: existe triggerLevelUp() em effects.ts:69 e o asset levelUp.ogg, e
//     NENHUM dos dois e chamado. Estao prontos, so plugar no Sprint 4.

// ─── SPRINT 2 — EXPLOSIVOS ───
// [x] Bala colide com o grid: `segmentHitsWall` já existia (tilemap.ts:213) e
//     o fim de frame já matava a bala na parede com fagulha. O que faltava era
//     o explosivo DETONAR nesse impacto em vez de sumir em silêncio.
// [x] Explosivo detona em: inimigo, parede, prop ou FIM DA VIDA ÚTIL (pavio).
//     `detonateBullet()` (main.ts) virou o único caminho de explosão, com o
//     flag `detonated` no Bullet contra a dupla; `updateBullets` devolve os
//     expirados (pavio), `updateBulletProps` detona no prop e o loop de parede
//     detona no muro. Efeito colateral bom: a BFG (pierce + explosiva) explodia
//     a cada inimigo atravessado e seguia voando; agora cada projétil explode
//     uma vez e morre.
// [x] Mina: vida própria (MINE_LIFE 12s), raio de detecção (72px) e fuse de
//     0,6s — `updateMines` (bullet.ts) devolve quem estourou e main.ts detona.
//     Antes sumia com o pavio de 2s da bala e só explodia se alguém pisasse.
// [x] Explosão não fere o jogador: `createExplosion` itera SÓ a lista de
//     enemies (testado em explosivos.test.ts). Barril continua machucando de
//     propósito: é perigo do mundo (explodeProp), não do próprio tiro.

// ─── SPRINT 3 — ASSETS DE TIRO E ARMA ───
// O pack Kenney Top-down Shooter tem 3 sprites de arma (weapon_gun,
// weapon_machine, weapon_silencer) e ZERO de projetil. 12 armas colapsam em 3
// weaponClass, e todo tiro e ctx.arc() em renderer.ts:736.
// Regra 15 do AGENTS.md: o arc so pode ficar como fallback de asset que nao
// carregou, nunca como visual pretendido.
// [x] Kenney Particle Pack (CC0, 80 sprites: spark, glow, muzzle flash, smoke,
//     fire, electricity). Mesmo autor do pack atual -> consistencia visual
//     garantida. Creditar em CREDITS.md.
// [x] Kay Lousberg "2D Guns" (CC0: pistola, revolver, shotgun, sniper, SMG,
//     rifle + balas, granadas, municao, SVG fonte).
// [x] GATE VISUAL: NÃO funde — decidido olhando os dois lados. As armas do Kay
//     Lousberg são perfil lateral (coronha, alça, detalhe lateral) e o jogo é
//     top-down: a pose do Kenney já desenha a arma de cima, e colar shotgun
//     lateral no ombro visto de cima é mistura de perspectiva. O pack Kay
//     segue só nos projéteis, onde funde (cartuchos simétricos que rotacionam
//     bem). O fallback que o TODO propunha (Kenney Scribble Dungeons) é
//     tileset de dungeon e não tem arma na mão — a resposta real é manter
//     as poses. Decisão registrada no comentário da tabela em renderer.ts.
// [x] 6 famílias de arma, não 12 sprites: a pose agora sai de POSE_DA_FAMILIA
//     (renderer.ts) pela WEAPON_FAMILY (a mesma do som), não mais do
//     `weaponClass` solto no config — que fazia Shotgun e Pistola na mesma
//     pose. Mapa: pistola/mina->gun, escopeta/máquina/lança->machine,
//     precisão/energia->silencer. O `weaponClass` saiu do config E do tipo
//     Weapon (não era lido por mais nada); completude testada em
//     weaponSound.test.ts (toda arma tem família, toda família tem pose).
// [x] Projeteis: `BULLET_FAMILY` (sprites.ts:136) mapeia as 13 armas no
//     projétil que cada uma usa de fato — small/medium/large_bullet (Kay
//     Lousberg) + estilhaco, feixe, foguete, orbe, plasma. O `arc` em
//     renderer.ts:790 virou fallback de asset ausente.

// ─── SPRINT 4 — XP E NIVEL ───
// [x] XP por abate (killEnemy), por onda (XP_BONUS_ONDA 40, no waveComplete) e
//     por fase (XP_BONUS_FASE 150, no phaseEnding). Moral/sorte continuam fora
//     — são Sprint 7.
// [x] Barra de nível + XP no HUD: rótulo "NV x" + trilho de 4px entre o número
//     de vida e as skills (getHudHintsLayout virou geometria compartilhada e
//     empurrou as skills 10px). HudData ganhou nivel/xpAtual/xpNecessario;
//     teste de geometria em hudLayout.test.ts; PNGs conferidos (regra 16).
// [x] Level-up: `ganhaXp()` envia toast + sfxLevelUp() + triggerLevelUpFlash()
//     nos três ganhos — os dois órfãos agora têm chamador.
// [x] Persistir XP: `saveGame` grava `xp`, `restoreXp()` no continue
//     recalcula o nível do total e os pontos livres (níveis - talentos
//     comprados). Save antigo sem o campo carrega como 0.

// ─── SPRINT 5 — ESCADA DE PERKS ───
// Hoje a loja lista os 19 UPGRADES todos, toda visita, em ordem fixa
// (shop.ts:456 faz UPGRADES.map direto, sem slicing). Custo total 3890 moedas:
// a renda da fase 4 ja compra tudo e a loja — que era a decisao central do
// jogo — deixa de existir.oferecer tudo de uma vez e apelão.
// REGRA: so compra o degrau N depois do N-1. Um special por ramo no fim.
//   DANO: T1-T5 +8% cada (+40%) -> PISTOLA INCANDESCENTE (cada 5o tiro, fogo)
//   CORPO: T1-T5 vida/armadura/escudo -> SEGUNDO FOLEGO (abaixo de 30% de vida,
//          1,5s de invulnerabilidade)
//   PERNAS: T1-T5 velocidade/dash -> PASSO FANTASMA (dash fere quem atravessa)
//   MENTE: T1-T5 xp/moedas -> SORTUDO (sorte alta puxa o melhor evento)
// [x] PERK_LADDER em `systems/perks.ts` (não em config.ts): degrau, custo,
//     statId, requires. 24 degraus = 4 ramos × 5 + 1 especial cada.
// [x] Compra sequencial: bloquear degrau N se o N-1 nao foi comprado.
// [x] 4 habilidades especiais com efeito real no codigo.
// [x] Loja oferece 3 perks por visita.
// [x] REGRA DO PERK GARANTIDO (decidido): 1 dos 3 sempre casa com a build atual.
//     Criterio: entre os 3 sorteados, garante o proximo degrau de um ramo onde o
//     jogador ja tem >=1 degrau comprado. Run nova cai no primeiro degrau de
//     DANO. Assim a loja e curation, nao loteria.
// [x] Continue restaura os degraus: `restoreUpgrades` resolve o id na
//     PERK_LADDER e chama a MESMA porta da compra (`aplicarPerk`). Sem isso os 4
//     especiais — que vivem em flag, não em stat — voltavam desligados: o
//     jogador pagava 400 e ficava sem o efeito, e nenhum teste de número via.
// [x] `resetGame` chama `resetPerks()` e `resetStats()`, e `resetShop` zera
//     `stockPerks`. Os dois primeiros estavam importados e nunca chamados:
//     a run seguinte herdava os 4 especiais e o dano comprado, multiplicados.
// [x] Save anterior à escada (`PERK_LEGADO`): efeito aplicado direto, com
//     "maior valor do mesmo efeito vence" como estado local do restore — sem
//     isso `vida25`+`vida50` no save valiam +75. NÃO traduz para degrau: perde
//     poder (Dano +50% viraria +40%) e deixa os degraus de baixo compráveis de
//     novo, porque o `requires` só olha o anterior. DECISIONS #118.
// [x] Código morto removido: `UPGRADES` (config.ts), `interface Upgrade`
//     (types.ts), `buyUpgrade` + `purchasedEffectValues` + `effectText`
//     (shop.ts). `effectText` já era órfão antes.
// [x] Portões: tsc limpo, 807 testes, build ok, `npm run visual` sem 404,
//     `tools/perks-proof.mjs` 13/13 e o PNG da loja aberto (3 perks sem
//     overlap com serviços e talentos).
// [x] `npm run sessao` mede a escada: o bot DESVIA (kite, `tools/dodge.mjs` +
//     `dodgeBot.test.ts` — a 1ª versão aproximava o jogador em 179 dos 360
//     ângulos) e olha BARRIL também, então não morre mais na onda 1. Medir uma
//     fase não exige chegar nela: `npm run fases` (`irParaFase`) abriu as 9 e
//     o número está em `tools/fases-medidas.json`. O bot é o PISO — não usa
//     dash, escudo nem fúria. O Item acima (o bot morrer na Cidade) era a
//     dívida do `FUTURO §1.4` e está paga.

// ─── SPRINT 6 — COMBOS REAIS (2026-10-11) ───
// Os 8 combos eram binarios (arma X + upgrade Y). [x] Checar por id.
// [x] Soma com teto em vez de produto sem limite.
// [x] CORRIGIDO: os 8 combos estavam MOROS desde que a escada entrou.
//     `combos.ts` exigia `crit2`, `dano25`, `pierce`, `vel15`, `magnetismo`,
//     `escudo`, `vida25`/`vida50` — ids do catalogo de 19 upgrades removido. A
//     escada produz `dano_t1`, `mente_t3`, `corpo_t3`… e nao tem nenhum id em
//     comum: 7 dos 8 so disparavam em save anterior a escada.
//     CAUSA RAIZ: nao era mapeamento, era eixo. A escada nao tem CRITICO,
//     PERFURANTE, RECARGA nem MAGNETISMO — e `luck`/`critMult` nao tinham
//     NENHUM leitor em producao, ou seja, o eixo nao existia de fato.
// [x] `comboCheck` virou `COMBO_CHECKS` (dado, nao funcao): um `check` so
//     callable nao prova que aponta para a escada, so que "algum combo
//     disparou". Definicao e requisito andam na mesma ordem, com guarda de nome.
// [x] 6 combos mapeados: Tiro Longo, Carvao, Rearme Pesado e Pancada -> `dano_t3`;
//     Couro Duplo -> `corpo_t3` + `corpo_t1`; Congelante -> `pernas_t1`.
// [x] Arco Eletrico e Imanencia REMOVIDOS: exigiam `pierce` e `magnetismo`,
//     que a escada nao tem eixo. Deixa-los com `check: false` seria um combo
//     listado no jogo que nunca dispara. Voltam com o eixo (DECISIONS #127).
// [x] Compra antiga NAO liga combo: `dano25` virou inerte. 6 combos nao
//     sobrevivem a migracao do save — registrado, nao escondido.
// [ ] Combos cruzados entre ramos (ex.: DANO T5 + MENTE T4 -> "Polvora
//     Instavel", +30% dano mas -10% vida).
// [x] 5 travas em gear.test.ts: id na escada, definicao==requisito,
//     exigeArma bate com a lista, degrau acessivel, combo tem efeito.

// ─── SPRINT 7 — MORAL <-> SORTE + EVENTOS ALEATORIOS ───
// A numeração dos sprints colidiu uma vez: o de TELEMETRIA (logo abaixo, já
// entregue) também se chamou SPRINT 7. Este é o que está em aberto.
// Estado novo entre fases (gameState: 'event'), antes da loja.
// [ ] Moral (-100..+100): ajudar sobrevivente sobe, perder dinheiro cai.
// [ ] Sorte derivada da moral + componente estocastico.
// [ ] Moral pesa o sorteio do evento; sorte pesa drop de moeda e qualidade do loot.
// [ ] Eventos com 2-3 escolhas, cada uma com consequencia em moral/sorte/
//     moeda/XP.
// [ ] Persistir moral e sorte no save.

// ─── SPRINT 8 — MURAIS ───
// [ ] Mural de conquistas no menu: hoje ACHIEVEMENTS so aparece como toast,
//     nao existe nenhuma tela de listar.
// [ ] Mural de personagens contando as historias: story.ts tem retratos e
//     falas, mas nao ha roster visual que junte as historias por personagem.

// ─── SPRINT 9 — PECAS, PROTECT, CONQUISTA DE LOSS ───
// [x] Vender pecas na mochila: hoje so da pra vender ARMA
//     (sellInventoryWeapon). Peca (pieces.ts) so equipa, nunca vende, e
//     acumula sem utilidade.
// [x] Fase protect (Castelo) inviagivel: o arqueiro huntsNpc matava o
//     sobrevivente rapido demais. Resolvido pela 4a opcao (decisao do dono,
//     2026-10-12): o alvo deixou de ser a escolta de 50 HP — e o FOGUETE,
//     prop parado de 300 HP na camara do meio (char `F` no mapa). As ondas
//     caçam ele (huntsNpc acha o alvo do protect, foguete primeiro), tiro do
//     jogador nao fere a propria protecao, e cada inimigo encostado tira
//     12 DPS. Prova: npm run protect (2 cenarios verdes no mundo do
//     foguete) + npm run foguete (HUD "PROTEGER O FOGUETE 300/300" e as
//     ondas chegando nele).
// [x] Cacador do alvo trava na parede: o huntsNpc andava em linha reta
//     (legado, sem flow field) e contra o foguete — parado atras das paredes
//     da camara — deslizava na parede em vez de achar a porta. Medido
//     2026-10-13: em 2 de 3 amostras isoladas o foguete ficou 41s intacto
//     com inimigos vivos; a ameaca era loteria de spawn. CONsertado em DUAS
//     camadas, cada uma com sua causa:
//     (1) FLOW FIELD DO ALVO (tilemap.ts): o mesmo Dijkstra do jogador
//         (hazard caro, descida por gradiente), apontado para a celula do
//         foguete. O alvo e estatico: um campo por fase, cache por celula.
//         `flowAlvo.test.ts` (6): a descida chega ao foguete dos 4 cantos
//         por onde os cacadores realmente chegam, sem pisar em hazard, e o
//         campo do alvo nao e o do jogador (na porta da camara um sobe e
//         o outro desce).
//     (2) PASSO DE CELULA (main.ts, passoDeCelula): a prova continuou
//         falhando 3/3 com o campo pronto — o vetor por celula nao carrega
//         o alinhamento sub-celula que porta de 1 celula exige. Reproduzido
//         em Node puro com as funcoes reais (cacadorPorta.test.ts): um
//         archer 1800/1800 frames parado na LATERAL da porta norte
//         (896,371), e outro 994 frames espetado no CANTO da parede do
//         corredor sul. Mirar no CENTRO da proxima celula da descida
//         realinha o corpo com o vão — vale para os DOIS campos (jogador
//         e alvo): e a mesma familia de trava que os inimigos comuns
//         sofriam.
//     Prova: npm run cacador — 3/3 amostras com o cacador chegando (6s,
//     34s, 8s; antes: 3/3 intactos). Regressao: campanha 9/9, onda 10/10,
//     protect 2/2, 942 testes, fases re-medidas.
// [x] Conquista de loss ("amigo morto"): hoje so existe vip_saved (salvou).
//     Falta a conquista pelo loss, apresentada com peso de narrativa.

// ─── SPRINT 10 — IDENTIDADE ───
// [x] Renomear ASHFALL -> SARGENTO RIOS (package.json, index.html, renderer.ts,
//     README, STATUS, SUPPORT_URL e o prefixo de save ashfall.* -> rios.*).
// [x] SUPPORT_URL: hoje aponta https://ashfall.itch.io. Vai para
//     https://omurilomota.itch.io/sargento-rios (config.ts:345).
// [x] Texto do pause estoura o box: boxW = 280 mas o texto
//     "W/S escolher · ENTER confirmar · ESC continuar" mede ~304px a 11px
//     (renderer.ts:1148). O da linha 1367 mede ~370px. Quebrar em 2 linhas.
// [x] drawKeyHints (hud.ts:511) sobrepoe a dica do tutorial — as duas sao
//     strings de largura variavel sem geometria compartilhada. Extrair um
//     getHudHintsLayout(), como ja existe getHudCenterLayout e
//     getMenuFooterLayout.
// [x] Capa do menu: MENU_TILE = tile_31 e 95% cinza com um tracinho amarelo,
//     repetido 64x em grade perfeita sob 72% de preto. O que aparece e a
//     trelica de emendas. Trocar por fundo solido + vinheta.
// [x] Parede repete em grade 4x4: o tile vem de (col*5 + row*3) % 4, periodo
//     4x4, e drawWallEdges sorteia uma claraboia em ~20% das celulas.

// ─── SPRINT 11 — FECHAMENTO ───
// [ ] TODO.md + DECISIONS.md com tudo que foi decidido no lugar do usuario.
// [ ] tsc --noEmit, npm test, npm run build.
// [x] ZIP do dist para o itch — pedido do dono na rodada 2026-10-12 e feito
//     em 2026-10-13: `npm run package` → sargento-rios.zip (11MB, 904
//     arquivos, foguete novo conferido por md5 dentro do zip). Subir no
//     itch é ação do dono.

// ─── BUGS REPORTADOS EM JOGO (2026-10-09) ───
// [x] CHEFE MORTO NAO ENCERRAVA A FASE. Tres causas, uma so visivel: o
//     consumo do respiro morava DENTRO de `if (waveComplete)`, que exige
//     `enemies.length === 0` E a cota do spawner preenchida. Como o spawner
//     zera a cota ao reportar a onda completa, ele recomecava a ultima onda
//     durante a luta contra o chefe e jogava reforco na tela — o jogador so
//     passava depois de matar esse reforco. E o re-arm em killEnemy() tinha
//     `!phaseEnding`, mas `phaseEnding` ja era true desde a ultima onda, entao
//     era codigo morto.
//     Fix: `deveFecharFase()` puro em phases.ts, consumo fora do
//     `waveComplete`, spawner parado enquanto o chefe esta vivo. tools/fase-proof.mjs
//     prova os 2 cenarios no navegador. (A analise antiga no TODO dizia "vai
//     direto a loja" — o comportamento real era o oposto: a fase nao fechava.)

// ═══════════════════════════════════════════════════════════════
// v2 — ARMAS, ASSETS E NARRATIVA (2026-10-10)
// Branch: feature/v2-weapons-story. Detalhes em docs/DECISIONS.md #80-#109.
// Verificacao: 713 testes, tsc limpo, build ok, 4 provas em navegador.

// ─── FASE -1: A IA PELA VER DE QUEM MEXE EM RENDER ─────────────
// [x] playwright como devDependency + scripts `visual`, `sessao`, `provas`
// [x] AGENTS.md regra 16: mudanca de render exige `npm run visual` E abrir
//     os PNGs. Antes, `tsc` limpo + 646 testes verdes + build ok escondiam o
//     HUD ilegivel com texto sobre texto.
// [x] favicon: o harness reportava um 404 de /favicon.ico a cada rodada
// [x] AGENTS.md: 5 modulos faltando na estrutura de diretorios

// ─── FASE 0: BUGS QUE QUEBRAM A CAMPANHA ──────────────────────
// [x] Chefe morto so encerrava a fase depois de matar TODO o reforco.
//     tools/fase-proof.mjs (7/7) prova os dois cenarios.
// [x] Morrer no fimzinho ainda passava de fase: o bloco de onda roda antes do
//     de morte, e `playerDied` ainda e false no frame em que a vida zera.
// [x] H sem medkit comprava 25 HP por 50 moedas EM COMBATE, sem limite.
// [x] `invincible` dava 4s de imunidade total, sorteado por qualquer inimigo
//     comum entre 12 tipos. Tirado do sorteio comum, mantido no chefe.
// [x] A passiva do MEDICO curava em Hardcore, que promete "sem loja, sem cura".
// [x] `weaponQualities` era Map por indice: a mesma arma em duas raridades
//     mostrava e vendia pela mesma. Agora a qualidade e do par {index,quality}.
// [x] Local 2P: P2 nao levava dano e nao havia fim de partida.
// [x] loot.test.ts era flake (~4%): sorteio com LCG mockado

// ─── FASE 1: INVENTARIO, AUTO-EQUIP E FICHA ───────────────────
// [x] Vender a arma deixava as pecas equipadas orfas num Map que nenhuma tela
//     lia. Agora voltam para a mochila.
// [x] `sellPiece()` com preco — peca so equipava e nunca vendia.
// [x] Pecas persistidas no save (startFromSave() apagava todas)
// [x] `getEffectiveDps()` e `getWeaponStats()`: DPS real com recarga, peca,
//     penalidade de pierce e falha da Quebrada
// [x] Auto-equip condicional: compra so equipa se o DPS novo for maior
// [x] Q/E para ciclar as armas (1-9 cobriam so 4 slots de 4 possiveis)
// [x] Tela TAB: minimapa grande + ficha da arma (TAB nao estava ligado em
//     lugar nenhum, e nenhum lugar do jogo mostrava DPS real)
// [x] Loja mostra o delta de DPS contra a arma na mao
// [x] HUD: `maxAmmo` usava o pente cru e ignorava a peca CAPACIDADE; a barra
//     de recarga dividia pelo tempo base e nunca chegava a zero
// [x] Raridade/condicao da arma sempre visivel no HUD (antes so num toast
//     de 2s no ato de equipar)

// ─── FASE 2: ASSETS COM TEXTURA REAL ──────────────────────────
// [x] Pack Top Down Dungeon (Screaming Brain, CC0) no lugar do Kenney no
//     chao e na parede. Medido: 453 dos 520 tiles do Kenney sao 100% chapados,
//     e a costura de 64px visivel vinha dai.
// [x] tools/extract_tiles.py: fatia os sheets 8x6, remove o magenta e so
//     pega a linha 0 (piso full). 160 tiles, 1,7MB.
// [x] Kenney Particle Pack (CC0) redimensionado de 512px para 64px (1,3MB ->
//     66KB) com 3 familias: muzzle, smoke, spark
// [x] `drawParticles` era 100% `ctx.arc()`: explosao, tiro e morte de inimigo
//     tinham a mesma cara
// [x] Parede deixa de repetir em grade 4x4 (hash sem periodo curto)
// [x] Capa do menu: era `tile_31` (95% cinza + um tracinho amarelo) repetido
//     numa grade 20x11. O que aparecia era a trelica de emendas.
// [x] CREDITS.md com os dois packs novos

// ─── FASE 3: ARMAS QUE SOAM E PARECEM DIFERENTES ──────────────
// [x] Som de recarga por familia de arma (7 familias, so sintetico: clique, puxa,
//     encaixa). Nao havia som de recarga nenhum.
// [x] Condicao audivel: a `enferrujada` range no primeiro disparo, a
//     `quebrada` falha mais alto, a `suja` so encarece. Uma vez por arma.
// [x] Adjetivo de condicao por arma: "Metralhadora CORROIDA" em vez do
//     rotulo generico "Enferrujada"
// [x] 7 projeteis em vez de 3 cartuchos: foguete na RPG, feixe no Laser,
//     plasma nos Raios, orbe no Gel, estilhaco na Shotgun.
//     tools/bullet-family-proof.mjs (11/11)
// [x] Combos checando `Upgrade.id` em vez do nome de exibicao. Renomear um
//     upgrade matava o combo em silencio.
// [x] Teto de dano (2.2) e piso de cadencia (0.5) nos combos empilhados
// [x] Furia ganhou cadencia (+33%): dano sem cadencia nao muda o ritmo

// ─── FASE 4: A HISTORIA JOGA ──────────────────────────────────
// [x] `showCutscene()` era chamado so no menu: 62 das 69 linhas nunca jogavam,
//     incluindo a morte do Fernandes e os 3 finais do epilogue.
//     tools/story-proof.mjs (11/11)
// [x] Tabela fase -> cutscene; a cena abre em `leaveShop()`, e o combate so
//     comeca quando ela acaba
// [x] Ferreira ganhou voz: o Genesis tinha uma cura que nunca aparecia em tela
// [x] Fernandes tem aftermath: entrada de diario "Seis segundos"
// [x] Beat de silencio (linha "---") depois da morte, sem texto e sem retrato
// [x] Cortadas as falas que anunciavam o HUD ("Cinco ondas em 45 segundos")
// [x] As 3 escolhas do epilogue falam, nao resumem: cortar o canal / contar
//     tudo / pedir mais uma missao

// ─── POST-RELEASE ──────────────────────────────────────────────
// [x] ASHFALL -> SARGENTO RIOS em package.json, index.html, renderer,
//     SUPPORT_URL e nas 12 chaves de localStorage
// [x] Migracao de save idempotente: quem jogou como ASHFALL nao perde save,
//     conquistas, diario, recordes, skins, classe nem volume

// ═══════════════════════════════════════════════════════════════
// TELA CHEIA NO ITCH.IO (2026-10-10)
// ═══════════════════════════════════════════════════════════════
// [x] CAUSA RAIZ: o botão de fullscreen do itch pede fullscreen no IFRAME, no
//     documento do pai. Dentro do jogo `document.fullscreenElement` é null e
//     `document.exitFullscreen()` é REJEITADO (TypeError). O jogo não tinha como
//     detectar que estava em tela cheia, nem como sair.
// [x] `src/systems/fullscreen.ts`: acha o documento dono subindo a cadeia de
//     frames (o itch dá allow-same-origin) e pede a saída por ele.
// [x] ESC em tela cheia sai e não abre a pausa junto (duas ações numa tecla).
// [x] `fullscreenchange` reajusta o canvas (entrar/sair muda o iframe por um
//     caminho que nem sempre dispara resize a tempo).
// [x] Aviso fixo na tela + rodapé da pausa muda quando está em tela cheia.
// [x] tools/itch-fullscreen-proof.mjs: prova o embed real. Ver
//     `npm run itch`.
//     antes: "depois: pai em tela cheia? SIM (BUG)"
//     depois: "OK: o ESC do jogo saiu da tela cheia dentro do embed do itch"

// ═══════════════════════════════════════════════════════════════
// SPRINT 0 — A FASE PULA PARA A ÚLTIMA ONDA (2026-10-10)
// ═══════════════════════════════════════════════════════════════
// [x] CAUSA RAIZ: `deveFecharFase` e chamado de um bloco que roda todo frame
//     (main.ts:855), mas respondia `true` para qualquer onda que NAO fosse a
//     ultima. As ondas 1 e 2 avancavam todo frame: em dois frames a fase chegava
//     na ultima, `isUltimasOndas` virava true e o chefe nascia com o campo
//     vazio. Bug introduzido pela propria extracao do predicado (DECISIONS #82),
//     que tirou `nextWave()` de dentro do `if (waveComplete)` sem levar o portao.
// [x] `FimDeFase` ganhou `ondaCompleta`; `deveFecharFase` nega sem ele.
// [x] `ondaCompleta = waveComplete || (bossSpawned && !chefeVivo)` — sem o
//     segundo termo o fim de fase travava para sempre depois do chefe.
// [x] 4 testes novos em phaseEnd.test.ts, incluindo 60 chamadas seguidas com a
//     onda em andamento. Com o portao fora, o teste acusa "expected 60 to be +0".
// [x] O teste antigo ("onda intermediária fecha assim que o campo limpa")
//     afirmava o comportamento COM O PORTAO FORA: codificava o bug como
//     contrato. Corrigido.
// [x] `tools/onda-proof.mjs` + script `npm run onda`: joga a fase de verdade,
//     sem pularParaUltimaOnda/invocarChefe. 10/10. Com o bug de volta: 4/10,
//     com `onda=3/3` e chefe vivo na primeira amostra.
// [x] Duas camadas, uma regra: prova e teste unitário falham no bug e passam na
//     correcao. Nenhuma das duas afirma sem a outra.
//
// ⚠ POR QUE ISSO PASSOU COM 713 TESTES VERDES
// As duas camadas de teste cobriam o MESMO caminho — o da última onda. O
// `fase-proof.mjs` força a última onda para encurtar o caminho até o chefe, e
// os 8 testes do `deveFecharFase` só descreviam o fim de fase. Quando um
// harness usa atalho para encurtar o teste, ele para de cobrir o jogo: a
// prova continuava verde sem que o jogo funcionasse. Regra: um harness que
// pula etapas tem de ter uma contrapartida que joga o trecho inteiro.

// ═══════════════════════════════════════════════════════════════
// AS 3 FASES SEM `difficulty` (2026-10-10)
// ═══════════════════════════════════════════════════════════════
// [x] `tools/campanha-proof.mjs` mediu o que ninguém tinha medido: Castelo,
//     Espaço e Bunker Central não declaravam `difficulty` e caíam no default
//     1.0 de `resetSpawner` — sem ninguém ter escolhido isso. O asteroid
//     (speed 30, não desvia) a 1.0 tirava 33 do jogador com o lowGravity e
//     matava em 4 toques: a fase mais letal do jogo era a 8ª, por omissão.
// [x] Castelo 0.9, Espaço 0.88, Bunker Central 0.88 — a curva volta às 9.
// [x] asteroid 30 -> 21: tira 19 do jogador (6 toques, na faixa do resto) e
//     segue o golpe mais forte entre os inimigos comuns (19 x 18 do magmaGolem).
// [x] O par 0.82 + 23 chegou a ser aplicado e dava o mesmo 19 no jogador, mas
//     o custo da fase (HP x dificuldade) caía sob o do Vulcão e o balance.test
//     reprovava a rampa. 0.88 + 21 preserva o resultado E a rampa.
// [x] Prova: tabela de toques 9/8/6/6/10/6/6/6/6, 9/9 chefes, 9/9 lojas,
//     717/717 testes, visual sem 404. A sessão do `session.mjs` não cobre
//     esta mudança: o bot morre na Cidade onda 1 (não desvia).

// ═══════════════════════════════════════════════════════════════
// PORTÃO ANTI-IA — OS 4 TESTES (2026-10-10)
// ═══════════════════════════════════════════════════════════════
// [x] `semIA.test.ts`: 8 tics de texto (tríade, "não X mas Y", "onda de X",
//     corpo clichê, etiqueta de fala além de "disse", adjetivo vazio,
//     narração repetindo a UI, palavra em espanhol) com CONTROLES POSITIVOS
//     de cada um — e a lista de controles tem que bater com a de tics, senão
//     o portão aprova em silêncio. CONTROLES NEGATIVOS no tic de espanhol:
//     "aqui é Vale" é português e não pode ser acusado (a 1ª versão acusou —
//     `\b` do JS é ASCII, o fim virou lookahead Unicode). 3 violações
//     encontradas e corrigidas: `story.ts` "Cinco ondas", "recibir",
//     "A.Freeira".
// [x] `semDesenho.test.ts`: estado NA ENTREGA — 64 sites de desenho no
//     renderer auditados: 52 permitidos com porquê (UI, efeito, sombra,
//     fallback) e 12 de débito com TETO por função (cena de cutscene, moeda,
//     power-up e bot). Débito não cresce; total congelado em 64 até alguém
//     editar o teste com motivo. (A cena de cutscene foi paga no mesmo dia: a
//     entrada abaixo baixa o teto para 59.)
// [x] `semProcedural.test.ts`: extração por contagem de chaves acha as 33
//     funções sfx*; exatamente as 4 sem arquivo estão declaradas (Reload,
//     Ferrugem, Condicao, Piece) — a lista encolhe quando o débito é pago.
// [x] `semAssetQuebrado.test.ts`: a ÁRVORE inteira de public/assets existe
//     em dist/assets, sem arquivo de 0 byte (as amostras já eram cobertas
//     por assets/distBuild).
// [x] Provados mordendo: função de desenho injetada, sfx nova sem arquivo e
//     arquivo removido do dist reprovaram; restaurados, verde.
// [x] Regra normativa no AGENTS.md ("Portão Anti-IA", com a lista de tics e
//     o "não sei escrever sem soar IA: pergunto").
// 731 testes em 39 arquivos.

// ═══════════════════════════════════════════════════════════════
// DÉBITO DE DESENHO PAGO — CENA DE CUTSCENE VIRA TILE (2026-10-10)
// ═══════════════════════════════════════════════════════════════
// [x] `drawCutsceneScene` não desenha mais nada: as 4 cenas (FLORESTA,
//     CAVERNA, ESPAÇO, VULCÃO) agora vêm de `buildCutsceneBackdrop`
//     (terrain.ts), prerenderizadas com o piso e os objetos do próprio bioma
//     — copa 183/186, cristal 238/239/264, placa 333, lava 316/319, lama 320.
//     183/186 entraram em TILE_NUMBERS; o 208 foi testado e saiu (sozinho, a
//     metade de copa lê como arbusto cortado).
// [x] Véu por cena (`cutsceneVeil`): o 0.15 padrão apagava o céu do Espaço —
//     as estrelas ficaram invisíveis no primeiro screenshot, medido e
//     corrigido para 0.4 ali. Sem abrir o PNG, isso ia pro usuário.
// [x] Débito do `semDesenho`: 12 → 7 sites (total 64 → 59). Restam moeda (2),
//     item (2) e bot (3): moeda/item seguem SEM asset no disco (nenhum pack tem
//     moeda — conferido nos 524 tiles do Kenney, no sheet Roguelike e no
//     dungeon), e o visual do bot é a decisão pendente do FUTURO §1.2.
// [x] `story-proof` prometia conferir "cada fase" e parava na Fábrica: agora
//     percorre as 8 fases e as 9 cenas (19/19). Foi ele que pegou as estrelas.
// [x] Verificação: `npm run visual` sem 404/pageerror, PNGs das 4 cenas abertos
//     e conferidos, tsc limpo, build ok, 731 testes verdes.

// ═══════════════════════════════════════════════════════════════
// DÉBITOS PAGOS — MOEDA, GEMAS E OS 4 SONS (2026-10-10)
// ═══════════════════════════════════════════════════════════════
// [x] Moeda e power-up viraram sprite (Kenney Platformer Art Deluxe, CC0 —
//     pack novo, 70px, mesmo estilo flat do pack de personagens). 5 PNGs em
//     `assets/sprites/items/`; `item_*` no cache de sprites; teste no
//     `assets.test` trava que existem no disco. Símbolo do power-up foi para
//     BAIXO da gema (28px): em cima, o glifo cobria a faceta — medido no
//     harness de composição, não por chute.
// [x] Os 4 sons sem arquivo viraram 9 chaves CC0 (29 → 38): recarga por
//     família (7 timbres distintos, um arquivo único perderia a variação que
//     a síntese dava), ferrugem (`creak1`) e peça (`metalLatch`).
//     `sfxCondicao` delega para ferrugem e para o `jammed` que já existia.
//     Fontes: OpenGameArt CC0 (bmaczero, joaken, zer0sol) + Kenney RPG Audio;
//     mono OGG, picos entre -0.7 e -7.9 dB (banco: tiro a 0, UI em -8).
// [x] `semProcedural` com débito VAZIO (a lista fica para o próximo débito
//     entrar com porquê); `semDesenho` com 3 sites (só drawBots).
// [x] Gate corrigido: contava `ctx.arc()` citado em COMENTÁRIO como desenho
//     (2 sites falsos) — comentário agora é pulado, total 59 → 58.
// [x] CREDITS.md: novo pack + tabela com as 9 fontes e os autores.
// [x] Verificado com prova de tela: moeda em jogo (combate de 25s, kills →
//     drop → sprite na tela) e composição das 4 gemas no canvas real.
// 732 testes em 39 arquivos.

// ═══════════════════════════════════════════════════════════════
// SITE, HISTÓRIA II–IV E TELEMETRIA (2026-10-10)
// ═══════════════════════════════════════════════════════════════
// [x] Site estático em `site/`: `index.html` + `conteudo.js` gerado por
//     `tools/gensite.mjs` lendo o `config.ts` real via Vite — 9 fases, 12
//     armas, 9 chefes, 31 inimigos, 19 upgrades, zero número escrito à mão.
//     Estilo do jogo (monospace do sistema, paleta do `palette.ts`, tile de
//     chão CC0 como textura), sem gradiente/ícone/sombra/emoji. Capturas são
//     PNGs reais do harness. Verificado por screenshot (regra 16). Falta só
//     hospedar (FUTURO §3.10).
// [x] `docs/HISTORIA-II-IV.md`: os 3 arcos da Parte II escritos para avaliação
//     (patenteado / colônia / montagem 2079), cada um com premissa,
//     antagonista, escala, convergência dos 3 finais, custo e linha de III–IV.
//     Falta escolher UM — e decidir o destino do Fernandes.
// [x] Fix §1.5 (FUTURO): `session.mjs` imprimia `t=undefined` porque pedia o
//     relógio à telemetria, que devolve estado de jogo, não tempo de sessão.

// ═══════════════════════════════════════════════════════════════
// BACKDROPS DAS 5 CUTSCENES — §2.2b (2026-10-10)
// ═══════════════════════════════════════════════════════════════
// [x] `CENAS_CUTSCENE` (terrain.ts) ganhou as 5 cenas que eram fundo chapado:
//     PRÓLOGO (cidade), FÁBRICA (fabrica), PÂNTANO (pantano), CASTELO (castelo)
//     e EPÍLOGO (bunker). Cada uma é uma linha de tabela com tiles que já estão
//     em `TILE_NUMBERS` (entulho 292/265/260, sucata+caixote+anel 180/129/264,
//     lama+folhagem 320/134, pedra+espinho 133/268, caixotes 129/156/158) — sem
//     asset novo, sem `arc`/`fillRect` fabricando objeto (regra 15 intacta).
// [x] O doc dizia "BUNKER"; o título real que chega ao `buildCutsceneBackdrop` é
//     EPÍLOGO (fase 8 -> índice 8 em `FASE_PARA_CUTSCENE`, story.ts). Nome errado
//     nunca desenharia. Corrigido no FUTURO §2.2b.
// [x] Verificação: `tools/story-proof.mjs` 19/19 (as 9 cenas abrem e avançam),
//     os PNGs das 5 cenas novas abertos (regra 16) — `historia-2` fábrica,
//     `historia-3` pântano, `historia-4` castelo, `historia-7` epílogo e
//     `02-cutscene` prólogo — `npm run visual` sem 404/pageerror, 732 testes
//     verdes, tsc e build limpos.

// ═══════════════════════════════════════════════════════════════
// BACKLOG DA SESSÃO ANTERIOR FECHADO (2026-10-10)
// ═══════════════════════════════════════════════════════════════
// [x] Clique avança fala: `cutsceneClick` (edge por frame) ligado no mousedown
//     com dono por estado — só quando a cutscene está ativa e não espera
//     escolha. Consumido nos 2 pontos de cutscene (menu e playing). Limpo no
//     resetInput. ENTER/ESPAÇO/clique avançam igual.
// [x] Eventos aleatórios no diário (3 tipos pedidos + 1): `rollDiaryEvent()`
//     sorteia 1 por fase entre resgate/casa/sorte/azar (sem repetir), cada um
//     desbloqueia entrada e muda moedas (+25/+15/+20/-10). Ligado no enterShop.
//     Substitui o sorteio de NPC solto. diaryEvents.test.ts (3).
// [x] Progressão de XP → nível → talentos (`systems/progress.ts`): XP é o score
//     acumulado; cada nível dá 1 ponto; árvore de 3 galhos (Mente/Armas/
//     Movimento, 2 nós cada) gasta ponto na loja. Persiste no save (talentos).
//     progress.test.ts (11). PNG da loja aberto (regra 16) via
//     tools/progress-proof.mjs.
// [x] semIA endurecido: +3 tells da pesquisa (rótulo de emoção na voz, subtexto
//     anunciado, fala-terapia) = 11 no total, todos com controle que morde.
// [ ] Muros quebráveis: NÃO feito — muda colisão/pathfinding/render e o jogador
//     poderia furar a borda do mapa. Decidido deixar por último (risco).

// ═══════════════════════════════════════════════════════════════
// PORTA ANTI-IA Nº 5 — "TODO SISTEMA TEM CHAMADOR" (2026-10-11)
// ═══════════════════════════════════════════════════════════════
// Os 4 portões pegam FORMA: `arc()` em renderer, tics em story, `sfx*` sem
// arquivo, asset quebrado no dist. A nº 5 pega SUBSTÂNCIA: código que existe,
// é vendido ao jogador, e não faz nada. Foi o sweep que a criou que achou 12.
//
// [x] `src/__tests__/semOrfao.test.ts` (9 testes): export sem chamador (nem
//     interno, nem de outro arquivo, nem de teste), export só-de-teste não
//     declarado, todo StatId com leitor, todo StatId com caminho de escrita, e
//     a trava específica do `armorMax` (o teto que nunca abria).
// [x] Lista `SO_DE_TESTE` com 24 entradas e motivo escrito — superfície de
//     observação dos testes (ler contador, injetar Math.random). Débito novo
//     entra com porquê; a lista não cresce em silêncio.
// [x] Auto-mordida provada: um `export function orfaoPlantado()` e um
//     `'statSemLeitor'` injetados foram accusation e nomeados; restaurados,
//     verde.
//
// ─── OS 12 DEFEITOS QUE ELA ACHOU (todos corrigidos) ───
// [x] `mente_t3` "Sorte +1" vendia `luck`, e `luck` NÃO TINHA LEITOR: buraco
//     de 150 moedas. Agora pesa na moeda (+5%/ponto, piso 1), no `rollQuality`
//     (soma ao boost) e no evento do diário (peso, não booleano).
// [x] `critMult` no registro, crítico hardcoded 1.5 no `shoot()` (weapons.ts:419):
//     mexer no stat era inócuo. Agora `getStat('critMult')`.
// [x] `armorMax` lido por `applyStat` e escrito por NINGUÉM: o teto de 0.5
//     nunca abria. `corpo_t5` virou "Armadura: teto +10%".
// [x] A ARMADURA NÃO VALIA CONTRA PROJÉTIL (player.ts:118, comentário
//     "placa contra corpo a corpo"). 17 dos 31 inimigos atiram: mais da metade
//     do dano ignorava o eixo CORPO. Agora vale nos dois caminhos.
// [x] Os 8 combos checavam ids que a escada não produz. 6 remapeados, 2 fora.
// [x] `getInventorySnapshot`/`restoreInventory`/`getEquippedSnapshot`/
//     `restoreEquipped`: o save tem o campo `pieces` e o `main.ts:1491` gravava
//     `[]`/`{}` SEMPRE. As peças NÃO persistiam — e o relatório anterior dizia
//     que persistiam. Achado pela porta, ligado de verdade.
// [x] `isSupportUrlVisible`: o `drawSupportFallback` repetia o guard inline.
// [x] Órfãos sem chamador: `ordenarEventosPorSorte`, `temSortudo` (duplicata de
//     `temSortudoAtivo`), `sfxHitStop`, `checkEnemyBulletNpcCollision`
//     (duplicata dentro de `updateNPCs`), `setPlayer2Health` (virou
//     `matarPlayer2`, que tem chamador).
//
// [ ] `main.ts` com 2.452 linhas é a próxima fonte da família: `resetPerks`
//     ficou 3 sprints importado e nunca chamado. Não é refactor agora (não há
//     bug à frente), mas é onde a próxima omissão mora.
// [x] Fase do Núcleo apelona (fúria, tela vermelha, martelo, traje): feito.
//     Destruidor (arma secreta, 120 dano, explosão 260) em 4 tabelas de assets
//     + som `launcher`; vinheta vermelha pulsante na fúria (hook no harness);
//     trajeNucleo (20s, dano ×2, dano recebido ×0.5, vel ×1.3, +3 escudo ao
//     coletar, forçado no leaveShop da fase 9); boss rush `NUCLEO_RUSH`
//     (infernoPrime → reiMutante → mothership → nucleo, um por campo vazio;
//     só o último fecha fase e larga o Destruidor). nucleo.test.ts (8) +
//     tools/rush-proof.mjs prova a fila rodando (pegou 2 bugs: o 4º chefe
//     nunca nascia e a onda vazia fechava a fase no meio do rush).


//     Agora calcula local: `(Date.now() - t0)` na linha 116.

// ═══════════════════════════════════════════════════════════════
// BUGS DA PLAYTHROUGH (2026-10-11) — relato do jogador, 12 itens
// ═══════════════════════════════════════════════════════════════
// A regra do projeto é que nada muda sem prova de navegador. Cada bug daqui
// tem um `npm run` que o reproduz ou mede, e o portão morde (provado com
// violação injetada).
//
// [x] HUD GRUDADO (a imagem do jogador). Medido: o rótulo das skills terminava
//     em y=97 e a dica de tecla começava em y=100 — **3px de folga para fonte
//     de 11px**, em TODAS as resoluções (`getHudHintsLayout` usava
//     `skillLabelY + 14` e 14px entre baselines não basta). Virou 21.
//     `npm run hud` mede `measureText` em 4 resoluções, com bite negativo
//     provado (voltando a +8, reprova com folga de −3px).
// [x] ARMAS HERDAM MUNIÇÃO DA FASE ANTERIOR. `leaveShop` limpava balas,
//     moedas e partículas mas não o pente: a metralhadora (25) chegava com 2.
//     `refillAmmo()` em weapons.ts — puro, porque `resetWeapons()` zera
//     damageMult/pierce/critChance/reloadSpeed e estouraria a build na troca.
//     weaponAmmo.test.ts (5 testes, incl. "não conserta a quebrada de graça").
// [x] E COM DUAS FUNÇÕES (fúria em main.ts:287 e ciclo de arma em :317).
//     Decisão do jogador: E só fúria, Q vai pra arma ANTERIOR, sem ciclo pra
//     frente. `1-9` e Q continuam. O bloco do ciclo foi removido.
// [x] "ABATES: 0" COM PONTOS ALTOS. `drawGameOver(score, getKillStreak())`
//     imprimia a melhor SEQUÊNCIA seguida (zera a cada intervalo sem abate)
//     com o rótulo "Abates". `getTotalKills()` exposto e usado. O PNG do
//     `espaco-proof` confirma: agora "Abates: 1" com 1 abate.
// [x] TEXTO DO TRAJE ESTOURANDO O CARD. `POWERUP_DESC['trajeNucleo']` tem
//     93 caracteres numa linha de 44px de altura. `truncateText` na largura útil
//     (r.w − 50) e a constante de largura corrigida: 6.6px/char errava ~9% —
//     `Lanterna` (8 chars) media 53px numa coluna de 44px.
// [x] NOMES DE SKIN SOBREPOSTOS. "Fita Isolante" (86px) e "Sangue Seco" (73px)
//     numa coluna de 44px. `npm run loja` mede em `measureText`.
// [x] BUG NOVO achado no PNG: a 2ª linha de skins ficava ATRÁS de MOEDAS.
//     `SKIN_ROW_H` media 62px e o conteúdo da linha ocupa 64 (card 44 + nome 11
//     + preço 11). Virou 74. A prova compara as seções por COLUNA — entre
//     colunas o Y repetido é de projeto (ARMAS x PERKS) e daria falso positivo.
// [x] "GAME OVER AO CHEGAR NO ESPAÇO" — REPRODUZIDO com `npm run espaco`:
//     onda 1, 100 → −50 HP em ~3s com 2 inimigos na tela. `hazard` do Espaço
//     é `lowGravity`: multiplica o movimento do inimigo por 1.35 E o dano
//     recebido por 1.10, com `ufo`(6) e `drone`(5) atirando e o `asteroid`
//     (raio 28, dano 21, o maior do jogo) a 30 px/s — 8 toques matam.
// [x] MEDIDO com o bot que desvia (2026-11): o Espaço sobrevive 45s na onda 2
//     levando 66 de dano de `projetil`. A reprodução acima é de jogador que
//     NÃO desvia — o `espaco-proof.mjs` usa o próprio movimento (space a cada
//     900ms, sem dodge). Ou seja: a fase não é injogável, a prova media o
//     jogador parado. Sanado por medição, não por balanceamento: mexer no
//     `lowGravity` agora seria consertar um número que a régua errada produziu.
//
// ─── PENDENTES DESTA RODADA (feature, não bug) ───
// [x] Tutorial de perks + destrinchar os 4 ramos (2026-10-13, 20:26): os 4
//     ESPECIAIS ganham `desc` (a linha "RAMO X T6" não dizia nada sobre
//     eles — "Pistola Incandescente" não explica o que faz): "a cada 5
//     tiros, um incendeia", "abaixo de 30% de vida: 1,5s invulnerável",
//     "o dash fere quem você atravessa", "sorte pesa eventos e drops".
//     O rótulo da seção PERKS ensina a regra da escada: "degraus na ordem,
//     o T2 pede o T1 · 3 ofertas por visita". Os degraus comuns já se
//     explicam ("Dano +8%" + "RAMO DANO T2").
// [x] Cores ilustrando lendária/boa/suja durante a partida (2026-10-13,
//     20:26): a condição da arma agora aparece no HUD para TODA qualidade
//     exceto normal — antes só as negativas tinham adjetivo e a LENDÁRIA
//     jogava invisível (o dono não via o que a loja vendeu caro). A cor é
//     a da própria qualidade (QUALITIES[q].color). `ehNegativa` ficou
//     órfã e saiu (semOrfao mordeu e a função foi removida, não
//     aposentada). Provas: loja-proof + hud-proof verdes, 952 testes.
// [ ] Árvore de talentos inútil quando lotada: quais dos 24 degraus não valem
//     o preço. Medir antes de podar.
// [ ] NPC aliado do Castelo (atira, sobrevive, dá arma lendária). NÃO é a
//     resposta ao §1.1 do FUTURO: a fase protect do Castelo tem 3 caminhos
//     próprios (abrigo / interceptar linha de tiro / vida de escolta) e nenhum
//     deles é um aliado que atira. São features distintas e a protect segue
//     sem decisão. Fábrica fica intacta (o Fernandes morre lá, que é o gancho).
// [ ] Deploy do site na Vercel + aprofundar o conteúdo do site.
// [ ] Spec completa de história (Parte II, nave destruída) → `HISTORIA-II-IV.md`.

// ═══════════════════════════════════════════════════════════════
// VARIEDADE DE INIMIGOS POR FASE (2026-11)
// ═══════════════════════════════════════════════════════════════
// O pack tem 9 personagens e o jogo tem 24 tipos de inimigo + 9 chefes.
// Medido no mapa único: `zombie` atendia 9 inimigos, `robot` 4, `manOld` 4.
// O jogo anunciava 33 inimigos e desenhava 9 silhuetas.
//
// [x] `VARIACAO_POR_BIOMA` (sprites.ts): personagem por (tipo, fase). O
//     `grunt` da Cidade é `zombie`, o da Caverna é `manOld`, o do Espaço é
//     `manBlue`. Medido: **57%** dos inimigos mudam de silhueta entre fases
//     vizinhas (era 0% antes), zero estagnação de 4 fases.
// [x] `drawEnemies` recebe `faseIndex`. A primeira versão criou a tabela e
//     esqueceu de ligar — a variação existia no código e nunca chegava na
//     tela. A `variedade-proof.mjs` provou em navegador.
// [x] `getEnemyCharacter` valida contra `CHARACTER_NAMES`: erro de digitação
//     seria 404 silencioso com a silhueta sumindo (o `getSprite` devolve null e
//     o inimigo cai no círculo de fallback).
// [x] `variedade.test.ts` (18): tabela ligada ao disco, jogador nunca vira
//     inimigo, chefe nunca varia, 57% de mudança, zero estagnação de 4 fases,
//     nenhum tipo preso num corpo só.
// [x] `tools/variedade-check.mjs`: imprime a matriz 22×9 e diz onde está a
//     estagnação — corrigir só pelo teste é caça-a-caso.
// [x] `tools/variedad-proof.mjs` (npm run variedade): 3 fases com o MESMO
//     tipo, print de cada, com a câmera no inimigo. PNGs abertos: Cidade =
//     zumbi verde, Espaço = corpo azul metálico.
//
// [ ] TINT por inimigo (4 cores × 9 personagens × 6 poses = 216 PNGs
//     pré-renderizados). Hoje o `color` do tipo só pinta o FALLBACK
//     (`renderer.ts:904-922`), então o sprite é desenhado cru. Medir bytes e
//     tempo de load antes de gerar; se passar de ~2MB ou 400ms, reduzir a 3.
// [ ] ARMAS 12 → 20+: sprint própria. Cada arma nova precisa de família
//     (som CC0), projétil, pose, DPS medido no `balance.test` e PREÇO na curva
//     de poder. Os 7 sprites do Kay Lousberg estão no disco e não são usados:
//     são perfil lateral e o jogo é top-down (DECISIONS #91).
// [ ] Pack CC0 novo de personagens, se o tint não bastar.
// [ ] Variar tilesets por zona (Bloco 4): mais material por bioma em
//     `terrain.ts` + `npm run visual`. (Esta e a linha "Variar tilesets." mais
//     acima eram a mesma pendência em dois lugares; a de cima saiu.)

// ─── SPRINT 7T — TELEMETRIA QUE CHEGA ATÉ O FIM (FUTURO §1.4) — [x] ENTREGUE ───
// O bloqueio era "o bot morre na Cidade, onda 1, então Espaço/Castelo/Bunker
// nunca são medidos". Entregue: o bot desvia e a medição não depende de
// sobreviver até lá.
//
// [x] Telemetria de dano por fonte, registrada no GARGALO (`player.ts`).
//     São 6 caminhos que tiram HP e, registrado na ponta, 3 entravam por baixo
//     da régua: a sessão media 20 de 130 de dano. DECISIONS #149.
// [x] `FonteDano` em 7: `contato`, `projetil`, `bioma`, `barril`, `evento`,
//     `boss`, `bot`. `ambiente` respondia "110" numa fase em que o bot morria
//     na onda 1, e as 3 causas que dividiam esse nome têm conserto oposto.
//     DECISIONS #150.
// [x] `tools/dodge.mjs` + `dodgeBot.test.ts`: a primeira versão (perpendicular
//     pura, 1 tecla) APROXIMAVA o jogador do inimigo em 179 dos 360 ângulos.
//     Agora é kite e afasta nos 360. DECISIONS #151 e #152.
// [x] O dodge olha BARRIL também: sem isso o bot morria dos próprios caixotes
//     (90 de 115 de dano) achando que era dificuldade. DECISIONS #153.
// [x] `irParaFase` limpa o mundo ao trocar de fase. Sem isso as 9 fases
//     mediram igual, cada uma com o `mutante` da Cidade ainda caçando.
//     DECISIONS #155.
// [x] `session.mjs --fase N` e `tools/fases-todas.mjs` (npm run fases):
//     medir uma fase não exige chegar nela. DECISIONS #154.
// [x] `tools/bot.mjs` extraído (dois consumidores, uma implementação).
// [x] `kills` da telemetria é `getTotalKills()`, não `getKillStreak()`: a
//     sequência zera e o log mostrava o número congelado.
//
// [x] BUG DE JOGO: inimigo preso dentro de parede. `pushOutOfWalls` era
//     chamado por jogador, chefe, loot, moeda e powerup — e não pelo inimigo
//     comum. Um inimigo sobreposto à parede fica com `flowDist === -1`, o
//     `sampleFlowDir` devolve 0,0 e `moveCircleBy` recusa todo passo: congelado
//     para sempre, invencível, fora da tela. No Bunker a fase não acabava —
//     4 hostis, 0 abates, HP cheio. DECISIONS #156.
// [x] `pushOutOfWalls` ganhou PISO: a busca em anel (8 pontos, 3 células)
//     falhava em 26 posições com raio 26, e um resgate que pode falhar é a
//     origem da classe de bug acima. DECISIONS #157.
// [x] `presoNaParede.test.ts` (11) + `tools/sessao-diagnostico.mjs`.
//
// [x] Chefe de raio 46 numa passagem de 64px (FUTURO §1.9). MEDIDO
//     (2026-10-13, rushCorredor.test.ts): nenhum dos 4 chefes do rush CABE
//     em corredor de 1 célula — raios 46-54 contra meia célula (32), por
//     projeto (DECISIONS #158; o presoNaParede já os excluía por isso) — e o
//     corredor de baixo do Bunker não é queijo: ele é RETO, os 4 atiram
//     (canShoot, 300-340 px/s, linha limpa até o acampado) e a biomaquina
//     (raio 19) entra e pressiona. VEREDITO: não mexer — nem arena, nem
//     raio, nem mapa. O teste trava as duas propriedades que sustentam o
//     veredito (ninguém espreme, todos atiram): um rebalanceamento que
//     baixe raio para <= 32 ou tire o tiro muda a geometria em silêncio.
// [x] Barril: 45 de dano e 96px de raio contra um jogador de 100 HP. MEDIDO
//     (2026-10-13, session.mjs --fase 0, 180s na Cidade): o piso que DESVIA
//     de barril aceso (DECISIONS #153) tomou ZERO de dano de barril em 3
//     minutos — os 40 de dano da sessão vieram todos do raio do evento, e
//     o barril não apareceu como fonte principal em nenhuma das 9 linhas
//     do `npm run fases`. O instrumento não mede jogador humano, mas mede
//     o piso: o risco do barril é escolha de quem atira perto dele, com
//     0,9s de pavio como aviso. VEREDITO: aceitar assim — sem nerf, sem
//     aviso novo (o pavio é o aviso). Reabrir só se o dono relatar dano
//     de barril em jogo real.

// ═══════════════════════════════════════════════════════════════
// RODADA 2026-11 — RELATO DO JOGADOR: FASE FINAL, HISTÓRIA E BUGS
// ═══════════════════════════════════════════════════════════════
// Tudo aqui saiu de uma partida completa contada pelo dono do projeto, em
// 2026-11-11. História aprovada e registrada em `PREMISSA-V2.md` (Parte I) e
// `HISTORIA-II-IV.md` (Partes II–IV).
//
// ─── BUGS ───
// [ ] B1. EPÍLOGO toca na ABERTURA da fase 9 e de novo no fim. CAUSA
//     CONHECIDA: `FASE_PARA_CUTSCENE[8] = 8` e `EPILOGUE_CUTSCENE = 8` são a
//     MESMA cena. A primeira linha dela é "O MOTHERSHIP cai" — a mothership é
//     o 3º chefe do `NUCLEO_RUSH`, então o jogador via o fim antes de lutar e
//     via duas vezes. Conserto: cutscene própria da fase 9 (`NÚCLEO-CENTRAL`) e
//     a linha da mothership movida para o meio do epílogo.
// [ ] B2. O martelo (`Destruidor`) chegava como loot do NÚCLEO MORTO, e o
//     jogador o recebia na LOJA. Decisão do jogador: martelo e traje de
//     contenção são entregues NA ENTRADA da fase, como o traje já fazia.
//     `spawnBossLoot` deixa de entregar o martelo.
// [ ] B6. Os 4 chefes do rush entravam no fim das ondas. Decisão do jogador:
//     entram desde a entrada da fase, um morrendo e vindo outro — o ritmo que
//     ele elogiou. A fase passa a não ter onda comum: só chefes e biomaquina.
// [ ] B8. BIOMAQUINA: o Núcleo solta inimigos dele a fase inteira. Pedido do
//     jogador: "robôs humanoides zumbis bizarros de apelão". Proposta de stat
//     no `PREMISSA-V2.md` e decisão no DECISIONS #170. A fase não pode
//     esvaziar (senão o próximo chefe do rush nunca nasce): o nascer do próximo
//     chefe passa a depender de "não há chefe vivo", não de "campo vazio".
// [ ] NOME DA FASE 9: a história chama de NÚCLEO-CENTRAL, o `config.ts` e a
//     tela chamam de BUNKER CENTRAL. A fase final vai ser reescrita de qualquer
//     forma (B1–B8) — aproveitar e acertar o nome.
// [x] B3. VULCÃO, horda 7: o countdown disparou SEM chefe, veio outra horda,
//     e matar o último foi direto pra loja. O Vulcão é `reach` + chefe
//     `infernoPrime` (o "survive 45s + sentinel" que esta linha dizia era a
//     FÁBRICA). REPRODUZIDO no HEAD (tools/vulcao-proof.mjs: 3 falhas) e
//     consertado: o respiro de 5s armava na limpeza da última onda SEM
//     checar o objetivo — o countdown expirava com o chefe proibido de
//     existir, o spawner reabastecia a cota (a "outra horda" do relato) e,
//     se o jogador pisasse na zona depois, `deveFecharFase` fechava a fase
//     no primeiro frame liberado: `!chefeVivo` é verdade por vacuidade,
//     porque o chefe nasce no bloco que roda DEPOIS do fechamento.
//     Fix: o armamento do respiro exige `objetivoLiberouChefe` (main.ts).
//     Prova verde: countdown não arma pendente, o chefe nasce ao liberar,
//     a loja vem depois da luta. Regressão: campanha 9/9, onda 10/10,
//     protect 2/2, rush ok, 931 testes.
// [x] B4. A última fase abriu "já sem nada". VEREDITO: NÃO REPRODUZ no
//     HEAD — medido no navegador nos dois caminhos (salto `irParaFase` e
//     playthrough completo), os primeiros frames das 9 fases abrem com 0
//     inimigos, onda 1/N e respiro false (commit 02e7733, com teste). O
//     "onda=2" que gerou a suspeita era artefato do harness, que media 1,3s
//     depois da entrada, quando o `clear` já tinha avançado. Ação:
//     republicar o zip do dist (o publicado é anterior aos fixes).
// [ ] B5. O fim da Parte I lê como MOTHERSHIP, não como NÚCLEO. É o texto do
//     epílogo (B1) + a decisão de onde o martelo entra (B2).
// [x] B7. Cenário da última fase pouco destrutivo — "quer explosão por todo
//     lado" — ENTREGUE em 2026-10-13 20:41, em camadas que usam o que já
//     existia: (1) BARRIL ESTOURANDO SOZINHO: a máquina instável acende um
//     barril vivo ao acaso a cada ~11s, a fase inteira — o pavio de 0,9s é
//     o aviso, a cadeia faz o resto; (2) FOGO NO CHÃO: poças de fogo
//     (explosions.ts: FOGO_VIDA 6s, RAIO 44, DPS 8, teto 12) nascem onde o
//     barril explodiu, onde o chefe caiu, no berço de cada biomaquina e no
//     impacto de tiro explosivo — hazard do mundo, fere os dois lados
//     (inimigo direto no HP; jogador 4 a cada 0,5s na fonte 'bioma',
//     respeitando escudo/invincible). Visual 100% asset: scorch_01 (a
//     marca de queimado) + flare_01 (a brasa pulsando) do pack de
//     partículas; (3) PAREDE RACHANDO: PENDÊNCIA DE ARTE — o dungeon pack
//     tem 96 variantes de parede e escolher a rachada é curadoria de olho,
//     não de código; o dono redesenha os assets da fase de qualquer forma.
//     Só na fase do NÚCLEO (o pedido é do cenário final; as outras 8
//     seguem com o mundo de sempre). Portas: fogo.test.ts (5), 957 testes.
//
// ─── TASKS APROVADAS ───
// [x] T1. TITÃS/ELITES nas fases (2026-10-13, 21:08): o titã de verdade que
//     faltava. Um inimigo comum do tipo da fase nasce GRANDE a partir da
//     segunda onda — exatamente 1 por onda, e ele ABRE a onda: 3× vida (em
//     cima do escalão de onda), 1,5× dano, raio 1,35× (o sprite desenha
//     pelo raio: o corpo cresce de verdade), 0,85× velocidade, 3× moedas.
//     Anel mostarda no chão (o vocabulário do anel de chefe, uma escala
//     abaixo — chefe é terracota) + barra de vida (3× a vida não pode ser
//     invisível; TOTAL_ATUAL do semDesenho 67 → 70, decisão no diff do
//     teste). Loot: a taxa elite de 15% (peças de tiers altos) e os 25% de
//     peça direta estendem ao titã via flag — o corpo grande paga, não o
//     nome do tipo. tita.test.ts (4) trava o contrato de spawn; o
//     aparecimento é "por fase" no sentido do dono: toda fase com 2+
//     ondas tem seus titãs.
// [ ] T2. PLAYLIST de músicas mais elaborada (hoje são 4 faixas com crossfade).
// [x] T3. Tirar auxílio de IA da parte final do site (2026-10-13, 21:24).
//     O aviso "Feito com ajuda de IA" vivia no RODAPÉ do `site/index.html`
//     (o registro aqui dizia conteudo.js — era o index). Saiu; ficou o
//     ponteiro de problema ("o lugar é a página do jogo"). Junto, a
//     atribuição de música do rodapé foi corrigida: dizia só Eric Matyas,
//     mas o menu do jogo é Juhani Junkala (CC0) — agora os dois, como a
//     tela de créditos do jogo já diz desde o H4. site-proof: 9 fases,
//     12 armas, 31 inimigos, zero erro/404.
// [x] T4a. Vender PONTOS de talento por moedas (decisão do dono: "por
//     moedas, padrão" — a ambiguidade do C4 já estava respondida). Linha
//     "VENDER PONTO" na coluna direita da loja, colada abaixo da árvore:
//     1 ponto não gasto vira 100 moedas (MOEDAS_POR_PONTO no shop.ts —
//     paga mais que qualquer serviço, fica na faixa do 1º degrau da
//     escada). Sem ponto livre, a linha fica cinza com "SEM PONTO" — o
//     jogador vê que a opção existe. Portas: venderPonto.test.ts (3) +
//     shopLayout (2: sem pisar na árvore, coberta pelo scroll) + loja-proof
//     verde. O preço é arbitrável pelo teste de economia quando ele existir.
// [ ] T4b. Mais coisas para upar, mais níveis e mais perks na loja —
//     depende do teste de economia (o árbitro) e do formato da árvore
//     (C2). Não implementar antes de medir.
// [x] T5. Mais moedas por anúncio (`ads.ts`): resgate 15 -> 20 moedas. O
//     número não é chute — é a sentença do árbitro da economia
//     (economia.test.ts): com o teto de 2 resgates por fase, 2×20=40
//     ficam em ~23% da renda média de abate por fase (172), dentro da
//     guarda de 25% que mantém o resgate como renda secundária sem
//     reabrir a faucet do Sprint 0.
// [ ] T6. Armaduras no jogo (com peso × velocidade, que já está no FUTURO §2.4).
//
// ─── CONTEÚDO APROVADO, NÃO EXECUTADO ───
// 7 fases novas em `PREMISSA-V2.md`: Rodovia/Pedágio, Hospital de campanha,
// Pátio de trens, Ponte, Refinaria, Subestação, Porto. Cada uma custa mapa
// validado, paleta, cutscene, chefe/objetivo, spawn e balanceamento. A campanha
// passaria de 9 para 16 fases, o que mexe no teste de economia ainda pendente —
// por isso entram DEPOIS da economia medida.
// Partes II–IV em `HISTORIA-II-IV.md`, com 3 cenas-amostra escritas.

// ═══════════════════════════════════════════════════════════════
// RODADA 2026-10-12 — HISTÓRIA COMPLETA + 15 BUGS/TASKS DO DONO
// ═══════════════════════════════════════════════════════════════
// Relato direto do dono: a história das 9 fases com falas, e 15 bugs/tasks.
// Registrado pela frente de bugs/balance. A frente HISTÓRIA é território
// do Sprint A (story.ts/PREMISSA em voo) — roteada no NEGOCIADO.md §6.
//
// ─── O QUE O RELATO RESOLVE ───
// - O §1.1 (Castelo protect) ganhou 4ª opção: o alvo é o FOGUETE (prop com
//   HP que as ondas atacam), não uma escolta. Barra de vida de verdade (B3).
//   ENTREGUE 2026-10-13: mapa `F`, prop de 300 HP, ondas caçando o alvo —
//   registrado como [x] no Sprint 9 e no H6.
// - A linha "Agora você vai ver só seus trilionários" FICA (o dono repetiu) —
//   o semIA ganha exceção registrada: "agora" é português, o portão
//   falso-positiva (H7).
// - O que já está pago e NÃO refaz: Núcleo apelão (NUCLEO_RUSH desde a
//   entrada + traje + Destruidor + fúria vermelha), epílogo sem tocar antes
//   da luta, biomaquina, martelo na entrada da fase 9.
// - Parte II do dono (nave destruída, missão de peças + combustível, planeta
//   AHB-45) precisa casar com os 3 arcos do HISTORIA-II-IV.md.
//
// ─── H — HISTÓRIA (Sprint A) ───
// [x] H1. Fernandes sai da Fábrica (morte, diário "Seis Segundos", hook do
//     diário no main.ts) e vai para o CASTELO — "é lá onde ele está". A cena
//     do Castelo reescrita com o sacrifício no portão (o beat "---" e o
//     "Fernandes." migram junto); a Fábrica fica com a chegada e a ponta do
//     subsolo, que o H2 abre. story-proof 19/19, PNGs da Fábrica e do
//     Castelo abertos. Hooks de conquista: NÃO EXISTEM — nenhum achievement
//     cita o Fernandes; o hook real era o do diário, que migrou.
// [ ] H2. Fábrica: sequência do AMIGO — diálogo em CAIXA PEQUENA (modo novo
//     de diálogo, não a caixa grande), cápsula, radiação (todos infectados,
//     player imune sem saber), pós-boss o amigo vira MID-BOSS (forte, vários
//     ataques), Rios vence, morre → FÚRIA DESBLOQUEIA AQUI (hoje existe
//     desde o início; passa a ter gate de história).
// [x] H3. Falas por fase contra o texto do dono (verbatim na sessão, e o
//     semIA verde do primeiro ao último) — ENTREGUE em 2026-10-13, noite:
//     Floresta: a cabana da bruxa ("certeza que era mentira"), as trilhas
//       que não levavam a nada, o balanço na árvore e "agora só tem
//       zumbis" — costuradas nas falas do Joe que já existiam.
//     Caverna: "Os zumbis estão evoluindo rapidamente" + o "Grr…" do
//       túnel, junto do Arthur morto que a cena já contava.
//     Pântano: as três verbatim — "Nada mais me surpreende, daqui a pouco
//       estão saindo do chão", o "Ohoa…" da lama cedendo, "tenho que
//       tomar cuidado com o que falo".
//     Vulcão: "continua em frente pra manter o legado", fechando a
//       reflexão de pai/irmã que a cena já tinha.
//     Espaço: Bot #89 (retrato novo, sprite robot_hold) com "INIMIGO
//       DETECTADO! ATIRAR PROJÉTEIS", o "Não tão antes que eu já estou
//       aqui!" do Rios, a explosão — e a TELA VERMELHA dos 5s iniciais
//       (vinheta de alarme, `PERIGO_NAVE_SEGUNDOS`, mesmo molde da fúria
//       com pulso mais rápido).
//     Núcleo-Central: o Viajante #23 (retrato novo, manOld_hold) entrega o
//       martelo AI-ON pela porta dos fundos; o NÚCLEO fala "INTRUSO
//       AVISTADO! MODO NEUTRALIZADOR ATIVO"; pós-morte no EPÍLOGO:
//       "INSTABILIDADE REGISTRADA… MODO CRÍ-CRÍ-CRÍ-TICOOOOO", a risada
//       (descrita — o SOM é o H5) e "OS RESPONSÁVEIS AINDA PRECISAM TER
//       UMA CONVERSA COMIGO".
//     Castelo: "de acordo com a coordenada daquela cápsula, o antigo
//       abrigo deles era aqui" (Fernandes, antes do anúncio do foguete).
//     PENDÊNCIAS DE ARTE (não de texto): o "conserta o motor e VOAR"
//       pós-missão pede animação de voo — o dono vai desenhar o foguete
//       próprio, o voo espera a arte dele; a risada do NÚCLEO é asset do
//       H5. Provas: semIA verde (as 16 verbatim + as linhas de costura),
//       story-proof 19/19, campanha 9/9, 948 testes.
// [x] H4. Epílogo: NARRADOR, créditos de toda a jornada, música nostálgica
//     (asset livre), teaser AHB-45 "Part II em breve!". Reescrito do zero em
//     2026-10-13 (DECISIONS #174): a cena mantém a abertura forte (NÚCLEO
//     esfriando, MOTHERSHIP no meio, o registro da MegaCorp 2089) e troca a
//     ESCOLHA dos 3 finais pelo roll da jornada — quartel, Joe, Arthur,
//     cápsula, Fernandes no portão, Ferreira e Vale no rádio — fechando com
//     "[ PART II EM BREVE — AHB-45 ]". A maquinaria de escolhas saiu JUNTO
//     (selectChoice/isWaitingForChoice/ENDINGS/storyChoices, teclas 1-3,
//     render das opções e o campo `esperandoEscolha` do hook), senão o
//     semOrfao reprova; o cutscene.test ganhou o contrato novo (o roll cita
//     os nomes, o teaser existe, a cena atravessa só com ENTER).
//     Música: "Autumn Changes (Looping)" de Eric Matyas — a mesma fonte das
//     outras 3 faixas (RF com atribuição, regra 14 do AGENTS.md: crédito
//     resolve; a pedido dizia "CC0", mas consistência de fonte/estilo
//     pesou mais que pureza de licença — DECISIONS #184). Toca no
//     epílogo e sob a tela de fim; atribuição corrigida nos créditos do
//     jogo (a linha antiga dizia "faixas originais do projeto (CC0)",
//     que era falso).
// [ ] H5. Assets de som narrativos: foguete, ferrutura, explosão de
//     cápsula, risada — CC0/CC-BY + CREDITS.md + tela de créditos.
// [x] H6. Asset do foguete (sprite CC0 — procurar nos packs de espaço antes
//     de buscar pack novo). O CC0 nao existia no disco: Saturn V Pixel
//     Rocket (Michael J Pierce @ IsometricRobot, CC-BY 3.0), atribuicao no
//     CREDITS.md e na tela de creditos. Commit 6090b8f.
//     AVISO DO DONO (2026-10-13): o estilo nao e o que ele quer seguir —
//     o asset fica como PLACEHOLDER de teste e ele mesmo desenha e troca
//     depois. Nao investir em polimento deste PNG.
// [x] H7. VEREDITO: a exceção não é necessária. As 16 falas verbatim do dono
//     (incluindo "Agora você vai ver só seus trilionários") rodam VERDES nas
//     regexes reais do semIA — o portão acusa `ahora` (espanhol), não `agora`
//     (português). A crença contrária veio do NEGOCIADO §3b, lido errado.
//     Portão NÃO enfraquecido; prova registrada no DECISIONS #173.
//
// ─── B — BUGS DO RELATO (frente de bugs; verificação antes de mexer) ───
// [x] B1. GAME OVER AO ENTRAR NO BUNKER: NÃO REPRODUZ no HEAD. O
//     campanha-proof atravessa as 9 fases: Espaço fecha na loja → cutscene
//     → NÚCLEO-CENTRAL existe, tem chefe e fecha sozinha ("Nenhum problema
//     estrutural"). O repro do dono é do BUILD PUBLICADO, anterior aos fixes
//     B1/B2/B6 do Sprint A. AÇÃO: republicar o zip do dist.
// [x] B2. WAVE PÓS-BOSS NO CASTELO: consertado em `5e85e90`, prova em
//     `npm run protect` (2 cenários verdes: chefe morto + VIP cai → loja sem
//     onda; chefe vivo + VIP cai → fase renasce inteira e o chefe volta pelo
//     caminho NATURAL). Causa raiz em 2 metades: o reinício não distinguia
//     fase decidida de em andamento (bossSpawned herdado) e o chefeLiberado
//     era re-check vivo em vez de latch (bossKilled é a prova de que o
//     objetivo foi cumprido). Colateral: a campanha-proof ganhou
//     `cumprirObjetivo` no caminho de força — desde o B3 do Vulcão o fim
//     exige objetivo de verdade, e a prova invocava chefe de fase pendente
//     (a campanha travava na Caverna, que é `destroy`).
// [x] B3. BARRA DO ALVO DO PROTECT: agora é o HP em tempo real (progress =
//     hp/maxHp, detalhe '72/100'), `a89922f`. Trava em objectives.test (2
//     assertos: 20/50 = 0.4) + hud-proof verde nas 4 resoluções. Serve para o
//     foguete da frente HISTÓRIA sem mudar nada: o contrato é do alvo.
// [x] B4. SOM DE RECARGA: VERIFICADO correto no HEAD — call site passa a
//     família (`sfxReload(getWeaponFamily())`), 7 arquivos OGG distintos no
//     disco (ffprobe: 0.21s a 1.59s, pistola ≠ metralhadora ≠ escopeta).
//     O relato ("igual para todos e péssimo") é do build publicado, que
//     tinha o fallback sintetizado ÚNICO. AÇÃO: re-testar no build novo; se
//     ainda soar ruim, é curadoria de samples CC0 (task nova).
// [x] B5. TAB NO VIVALDI: preventDefault no keydown (`a89922f`) — página de
//     jogo é o canvas, não há outro elemento focável. Testar no Vivaldi é
//     do dono (Playwright é Chromium); M não serve de alternativa (é música).
// [x] B6. Diálogo do Cabo Fernandes na Fábrica "na hora errada" — resolvido
//     pelo H1: ele saiu da cena da Fábrica e está no Castelo (onde morre).
//
// ─── C — UI / LOJA / HUD ───
// [ ] C1. HUD trocado: canto inferior direito = ficha da ARMA; perks saem
//     dali e vão para o TAB (troca com a ficha). hudLayout + npm run hud.
// [ ] C2. ÁRVORE VISUAL de perks: tela canvas, 4 ramos × 5 + 4 especiais,
//     estados comprado/comprável/bloqueado. Geometria única; semDesenho.
// [ ] C3. TRAVAR ARMA na loja: pin na oferta para não sumir no restock;
//     comprar depois, preço cheio.
// [x] C4. VENDER PONTOS DE TALENTO: resolvido pela decisão do dono
//     (2026-10-12: "por MOEDAS, padrão") — entregue no T4a acima. O
//     respecc (devolver pontos gastos) ficou registrado como task separada
//     se um dia for pedido.
// [ ] C5. PULAR WAVE com recompensa (waves devagar, sobretudo Vulcão):
//     chama a próxima onda antes; recompensa proporcional ao tempo restante.
//     Toca na RENDA → medir com fases/sessao + teste de economia.
//
// ─── D — CONTEÚDO / SISTEMAS (confirmados pelo relato) ───
// [ ] D1. ARMAS 12 → 20+ (sprint própria: família, som CC0, projétil, pose,
//     DPS medido, preço na curva).
// [ ] D2. SPRITE POR FUNÇÃO, não reciclado por fase — o dono pediu assets
//     NOVOS ("urgentemente"), não tint. Caça de packs CC0 de personagens.
//     Destrava o sprite único do mid-boss da Fábrica.
// [ ] D3. EVENTOS ALEATÓRIOS (Sprint 7 moral ↔ sorte + estado `event`).
// [ ] D4. PAREDES QUEBRÁVEIS (§2.6): pedido de novo, sai do "por último".
//     Risco menor hoje: o Dijkstra já tem modelo de custo (hazard custa 60,
//     commit 26a485a) — muro rachado vira célula cara que pode ficar barata.
//
// ─── DECISÕES DO DONO — RESPONDIDAS EM 2026-10-12 (tarde) ───
// 1. Alvo do protect no Castelo: FOGUETE com HP — SIM, confirmado.
//    Fernandes é NPC de diálogo, não alvo.
// 2. O amigo da Fábrica (mid-boss) se chama FERNANDO.
// 3. Vender pontos: por MOEDAS (padrão). O dono perguntou o que é respecc
//    (devolver pontos gastos para redistribuir) — explicado; se um dia
//    quiser, é task separada.
// 4. FÚRIA TRANCADA até a Fábrica — SIM, confirmado (o gate de história do
//    H2; a fúria deixa de existir desde o início da campanha).
// ReBuild pedido pelo dono: build + zip de dist para republicar no itch
// (o zip publicado está velho — os vereditos dos bugs B1/B4 valem só no
// build novo). FEITO 2026-10-13: `npm run package` com o HEAD de 0d754d2
// (foguete + B3) — sargento-rios.zip, 11MB, 904 arquivos, index.html na
// raiz, visual sem 404/pageerror no build final. Falta o dono subir no
// itch.

// ═══════════════════════════════════════════════════════════════
// RODADA 2026-10-13 (NOITE II) — O SEGUNDO RELATO DO MURILO
// ═══════════════════════════════════════════════════════════════
// História completa reafirmada + falas verbatim + 5 bugs + críticas.
// A maior crítica registrada: "a falta de carinho nos detalhes" — a
// unidade de TEXTOS desta fila é a resposta. (Murilo pediu para ser
// chamado de Murilo, não de "dono".)

// ─── BUGS (os cinco desta rodada) ───
// [x] GAME OVER AO ENTRAR NO BUNKER (2ª vez, "patético!"). CAUSA RAIZ: o
//     índice de cutscene depois do fim de uma cena aponta para a
//     SEGUINTE — a abertura do NÚCLEO-CENTRAL termina com o índice EM CIMA
//     do epílogo, e o main perguntava "era o epílogo?" DEPOIS do
//     advanceCutscene: passar a cutscene de entrada com ENTER dava fim
//     de campanha. Fix: capturar `eraEpilogo` ANTES de avançar. Portas:
//     tools/bunker-entry-proof.mjs (`npm run bunker`) — MORDIDA PROVADA:
//     com a linha antiga, "gameover" na entrada; com a fix, combate. O
//     campanha-proof ganhou a travessia por ENTER da abertura final (era
//     cego: só usava BACKSPACE). JUNTO, dois da mesma família:
//     (a) BACKSPACE em cutscene de FASE chamava startRun() — agora
//     distingue menu (começa a partida) de partida (fecha a cena e abre
//     o combate; epílogo pulado também encerra);
//     (b) `gameCompleted` nunca era zerado pelo resetPhases — depois de
//     UMA campanha completada, morrer na seguinte mostrava a tela de
//     VITÓRIA e o FINAL SECRETO "PERFEIÇÃO" disparava sozinho. Trava:
//     phaseEnd.test ("partida nova não herda campanha completada") + o
//     teste da armadilha no cutscene.test documenta o porquê da ordem.
// [x] BALAS FORA DO BICO DO CANO: o tiro nascia no CENTRO do jogador
//     (shoot(p.x, p.y)) enquanto o flash nascia a 24px na direção da
//     mira — a bala saía do peito, atrás do cano que a pose desenha.
//     Agora bala e flash nascem no mesmo ponto (DISTANCIA_DO_CANO).
// [x] ATIRADORES SEM SENTIDO: aproximavam de quem já sabiam onde estava
//     e atiravam através de parede. Agora: (1) LINHA DE VISÃO — o tiro
//     só nasce quando segmentHitsWall diz que há visão até o alvo
//     (jogador ou foguete); (2) ALCANCE — o atirador comum segura
//     distância: aproxima até ALCANCE_DO_ATIRADOR (300), recua abaixo de
//     RECUO_DO_ATIRADOR (200), fica na faixa (só a separação age).
// [x] DESFOCAR PAUSA: blur da janela em combate → pausa automática (o
//     resetInput que já existia ganhou o setGameState('paused')). Alt-tab
//     no meio da horda não é mais morte de graça.
// [x] CAÇADORES QUE IGNORAM BALAS ("me ignorando inclusive nas balas"):
//     quem leva tiro do jogador ganha 4s de aggro (aggroTimer no Enemy)
//     e troca de alvo — persegue quem atirou — antes de voltar ao
//     foguete. Decisão do Murilo: troca temporária, não permanente.

// ─── REGISTRADO, ADIADO (instrução: "não focaremos agora") ───
// [ ] MODO 2P: incontáveis bugs — as SETINHAS movem os DOIS jogadores
//     juntos e o P2 ATRAVESSA PAREDES. Sessão dedicada quando entrar na
//     fila; anotar o resto lá dentro.
// [ ] MODO COMPETITIVO apelão: bots rápidos demais, dano demais.
//     Proposta registrada: bots como PERSONAGENS JOGÁVEIS (velocidade e
//     dano do próprio jogador, sem vantagem de máquina).
// [ ] LINGUAGEM DEV NA TELA ("assets/music/CREDITS.md" na capa — "quem
//     vai jogar não é dev"): varrer os textos voltados ao jogador
//     (créditos, capa, game over, pausa, configurações) trocando
//     jargão por linguagem de gente. Docs de dev ficam como estão.
// [ ] LIMPEZA DOS ARQUIVOS DA RAIZ (aprovada): descartar session-*.md,
//     freebuff-chat-*.md, NEGOCIADO.md, RELATORIO*.md, bugs.md, plano*.md,
//     ashfall.zip — a história fica no git.

// ─── FILA DESTA SESSÃO (ordem aprovada: bugs → H2 → textos) ───
// [x] H2 — a Fábrica do Fernando (2026-10-14, 00:20): ENTREGUE.
//     - CAIXA PEQUENA (`systems/dialogo.ts`): a faixa na base da tela com
//       o mundo CONGELADO atrás (decisão do Murilo: pausado por linha), o
//       ENTER avança e o auto-avanço de 10s prende ninguém. A Fábrica
//       deixou de ter cutscene grande (o pedido: "não gigante igual aos
//       outros níveis") — as três sequências + o luto correm na caixa.
//       dialogo.test.ts (6); story-proof atravessa a Fábrica pela caixa.
//     - AS SEQUÊNCIAS (verbatim do relato): a chegada ("era exatamente
//       aqui onde eles escravizavam o povo…"), o amigo na onda 2 (o NPC
//       Fernando nasce do lado do jogador; a cápsula EXPLODE no meio do
//       diálogo — o efeito dispara com a linha, sem dano: é a radiação da
//       história, todos infectados, o player imune sem saber), a virada
//       pós-sentinel ("Quer–o–o-o o seu cerébrO!!!") e o luto ("Eu não
//       queria te matar amigo…", "Brains…").
//     - O FERNANDO INFECTADO (`fernandoInf` no config): chefe MENOR com
//       barra (decisão do Murilo) — 520 HP entre o sentinel (360) e o rei
//       (630), os três ataques do vocabulário de chefe (ring, charge,
//       summon), corpo manBrown (o MESMO do amigo — o jogador reconhece
//       quem está matando). Nasce do FECHAMENTO da caixa da virada, no
//       lugar do NPC. SCRIPTED_TYPES no config: o quinto caminho do
//       cheque de órfão do assets.test.
//     - A COLETA: `coleta: true` na Fábrica — moedas ×1,5 e loot ×2, e a
//       dificuldade das fases seguintes compensa (+0,05 de Pântano até o
//       NÚCLEO), como o relato pede os dois lados.
//     - O GATE DA FÚRIA: travada para TODOS (decisão do Murilo, inclusive
//       saves antigos — o gate é a história), desbloqueia na morte do
//       Fernando, viaja no save (`furia`), e apertar E antes diz porquê
//       ("FÚRIA TRAVADA — ELA ABRE NA HISTÓRIA").
//     Provas: 969 testes (dialogo 6 + ajustes), story-proof 19/19 (a
//     Fábrica pela caixa), campanha 9/9 (o fluxo completo: sentinel →
//     virada → Fernando → luto → fúria → loja).
// [ ] TEXTOS — o carinho nos detalhes: ENTREGUE em 2026-10-14 (00:52).
//     - CASTELO REESCRITO pro texto novo (decisão do Murilo: o Fernandes
//       morre EM JOGO, não em cutscene): a cena grande encolheu para 6
//       linhas (a coordenada da cápsula + "vamos ver o que temos aqui!"),
//       e o CABO FERNANDES virou NPC real: chega na onda 2 (caixa pequena
//       conta quem ele é e anuncia o foguete), o sacrifício acontece
//       quando o REI MUTANTE levanta (a caixa congela a luta, o fechamento
//       tira o NPC e registra o diário "Seis Segundos" — o gatilho migrou
//       da cutscene), e o pós-missão conta o conserto + o voo ("Lá vou eu!
//       Vocês pagam!") com os sons H5.
//     - FLORESTA/CIVERNA verbatim completos: "Saudades daqui, gostava de
//       brincar no balanço…", "Vou destruir todos!", "Finalmente saí da
//       floresta… Pelo menos aqui na caverna não deve ter nenhum!",
//       "O que é isso? Ah não…"
//     - BUNKER: "Ei, você! Pegue isto!" + "O universo está a meu favo-"
//       cortado pela explosão (o narrador conta o que a explosão engoliu).
//     - EPÍLOGO: a risada é do RIOS (correção do Murilo: "HAHAHAHA!
//       Acabei com você, maldição!"), e o fecho narrador ganha as
//       perguntas dele ("Será que ele vai conseguir? Como ele vai fazer
//       isso?").
//     - Sons H5 caçados e ligados: risada (Supergeek, CC0), ferramenta
//       (BMacZero, CC0), foguete (dklon, CC-BY 3.0) — CREDITS.md
//       atualizado.
//     - LINGUAGEM AMIGÁVEL: os créditos do jogo citavam caminhos de
//       arquivo ("assets/CREDITS.md", "29 efeitos em assets/sfx/")
//       — quem joga não é dev. Reescrito em linguagem de gente.
//     - LIMPEZA DOS ARQUIVOS DA RAIZ (lista aprovada): session-*.md,
//       freebuff-chat-*.md, NEGOCIADO.md, RELATORIO*.md, bugs.md, plano*.md,
//       ashfall.zip — descartados. A raiz agora: AGENTS.md, PUBLISHING.md,
//       README.md, ROADMAP.md, STATUS.md, TODO.md + o zip da entrega.
//     - VULCÃO 0,79 → 0,74: o +0,05 da compensação da coleta não coube
//       nele — 3 mortes em 5 amostras (32s, dano de inferno 108-126).
//       A fase já era a calibrada no limite (medida na era §1.9).
// [ ] H5 — sons narrativos (ferramenta, foguete, risada, explosão de
//     cápsula): ENTREGUE junto com a unidade de textos (2026-10-14):
//     ferramenta.ogg (BMacZero, CC0 — Mechanical Sounds, "rattle1"),
//     foguete_lancamento.ogg (dklon, CC-BY 3.0 — 8-bit rocket),
//     risada.ogg (Supergeek, CC0 — "Do you remember laughter?", 1ª
//     variação fatiada por silêncio). A explosão da cápsula usa o
//     explosion.ogg existente. Todos atrás de playSfxFile com fallback
//     sintético (o semProcedural segue verde — som novo vem de arquivo).
// [ ] AS 7 FASES NOVAS (aprovadas: Rodovia/Pedágio, Hospital, Pátio de
//     trens, Ponte, Refinaria, Subestação, Porto) — a economia arbitra.
//     Murilo (2026-10-14): "vamos conversar e sugerir" — próxima sessão.
// [ ] PAREDE RACHADA (B7): NÃO é arte do dono — "vai ser ela apresentando
//     defeitos". O dungeon pack tem 96 variantes; a rachada precisa ser
//     curada por olho (o modelo não lê imagem). Se o pack tiver uma
//     variante danificada por material, é trocar o tile da fase 9.
// [ ] O VOO DO FOGUETE (pós-missão do Castelo): o beat hoje é texto +
//     som. A animação do foguete subindo precisa de decisão de arte.
// [ ] REPUBLICAR O ZIP NO ITCH — Murilo faz depois ("faço depois").

// ─── TILESET (2026-10-14, auditoria em docs/ASSETS.md) ───
// A IA que fez esta base não é multimodal: curou tile por número, sem
// olhar. A auditoria mediu pixel e achou o que nenhum gate pegava.
//     docs/ASSETS.md  — a evidência completa, com reprodução.
// [ ] T1 (P0) PISO COM COSTURA: os 64 tiles de piso têm faixa escura
//     assada de ~2px em 2+ lados (piso_pedra_01 tem col63 = 0.0 preto
//     puro contra miolo 128). Ladrilhado, vira papel quadriculado de
//     64px. Causa: extract_tiles.py:26 fatia LINHAS_PISO = (0,), que no
//     pack é a faixa de BORDA do autotile, não o miolo. sprites.ts:74
//     afirma "seamless" e está errado.
//     Reproduzir antes do fix (docs/ASSETS.md §0), cortar a borda na
//     extração, e provar por pixel.
// [ ] T2 (P0) PAREDE COM ALTURA DUPLICADA: os 96 tiles de parede são
//     blocos 3D com topo+frente+virada assados, e drawWallEdges
//     (terrain.ts:497) desenha cumeeira+claraboia+beiral+face de 14px
//     POR CIMA. Sai barra cinza atravessando o mapa (castelo-000.png).
//     Uma única fonte de altura; remover a claraboia.
// [ ] T3 (P1) tiles.test.ts — o portão que faltava: costura (borda não
//     pode ser mais escura que miolo − 30), papel (tile de
//     preenchimento com ≥85% de cobertura) e hierarquia (teto de
//     saturação p/ decor e cutscene). Pega T1, T5, T6 e T7 sozinho.
// [ ] T4 (P1) 16 PARES (PISO, PAREDE) DISTINTOS: hoje piso_metal cobre
//     5 biomas, parede_concreto cobre 7, e cidade/rodovia e
//     fabrica/trens saem byte-idênticos. 8×6 = 48 combinações sobrando.
// [ ] T5 (P1) RODOVIA (relato do dono: "parece tudo menos uma
//     rodovia"): 3 causas medidas em docs/ASSETS.md §4 — (a) o bioma foi
//     escrito hoje ("Unidade A", maps.ts:357) copiando o da Cidade: piso,
//     parede e floorTiles byte-idênticos, só o tint muda em 4%;
//     (b) os 6 tiles declarados [13,15,349,350,376,377] são laje
//     terracota e preenchimento laranja, nenhum é asfalto;
//     (c) o mapa é labirinto de salas sem pista contínua. O pack JÁ TEM
//     asfalto (29,35,36,41,66), eixo amarelo (30,55-58), eixo branco
//     (34,37,60,61), guarda-corpo (307-314) e carro abandonado (474-479)
//     — nenhum carregado.
// [ ] T6 (P2) REESCREVER AS 4 TABELAS POR CURATURA VISUAL:
//     WALL_TILES (6 de 8 conjuntos são cantos em L laranja ou frestas
//     azuis — e o caminho é inalcançável, órfão com consumidor só de
//     teste), spriteFor (floresta=avião de papel 134, castelo=quadrado
//     bege 133 a 84% de saturação), HAZARD_SPRITES (fog e mud dividem
//     o 320, mancha cinza; electric=264 é cristal), CENAS_CUTSCENE.
//     Regra: nenhum tile entra sem ter sido visto com zoom.
// [ ] T7 (P1) CUTSCENE COM PROFUNDIDADE: 85% da tela é preto puro e o
//     "retrato" é um anel vazio desenhado por arc. 3 camadas com valor
//     decrescente + atmosfera; anel sai ou vira sprite.
// [ ] T8 (P2) DÍVIDA: remover public/assets/sprites/tiles/ (dirt1,
//     dirt2, grass1, grass2, water1 — zero chamadores); remover
//     WALL_TILES ou torná-lo alcançável; reescrever biome.floorTiles
//     (o fallback aponta p/ verde #00c020, azul e laranja neon).
// [ ] T9 (P1) PERSPECTIVA — decisão do dono, não dá para adiar: os
//     personagens Kenney são vista de cima, o Screaming Brain é
//     oblíquo com altura visível. Incompatíveis, e nenhum tint
//     resolve. Ou troca o terreno, ou troca o pack de personagem.

// ─── AJUSTES PÓS-PUSH (2026-10-14, relatos do Murilo) ───
// [x] A FÚRIA É SEGREDO (relato: "não gostei de ter avisado que a fúria
//     vai ser liberada, ela tem que ser um segredo até a hora de ser
//     liberada"): o toast "FÚRIA TRAVADA" saiu — apertar E antes da
//     Fábrica é só silêncio; e o BOTÃO da fúria some do HUD enquanto
//     travada (a caixa de cooldown não aparece, o jogador não sabe que
//     ela existe). O "FÚRIA DESBLOQUEADA — TECLA E" na morte do Fernando
//     é a primeira vez que o jogador vê que ela existe.
// [x] AS SKILLS COMO TEXTO NO TOPO-DIREITA (relato: "vale um espaço na
//     parte superior direita nos textos fúria, dash, etc."): o canto
//     superior direito ganhou a linha "SPC: DASH · F: ESCUDO · E:
//     FÚRIA" (com cooldown em segundos), na mesma coluna das moedas e
//     dos hostis. O minimapa desceu 14px para abrir espaço.
// [x] PISTOLA DE GRAÇA NA LOJA (relato: "a pistola sempre está de graça
//     na loja, em todas as raridades, isso é muito roubado"): a causa
//     era price: 0 no config — o preço zero era "você começa com ela",
//     mas a loja usava o MESMO valor pra VENDER: uma Pistola Lendária
//     saía de graça. Corrigido: price: 30 (a mais barata da loja, mas
//     não grátis).
//     Rebuild: npm run package com o HEAD de 872422a.

// ─── VERCEL + 5 MISSÕES (plano aprovado 2026-10-14) ───
// [x] FASE 0: jogo público no Vercel — projeto sargento-luiz, 2 deployments
//     Ready em produção; o login do Vercel Authentication foi desligado
//     (PATCH /v9/projects com ssoProtection: null — o campo writable; o
//     `protection` do GET não existe na escrita). Prova: HTTP 200 com
//     <title>SARGENTO LUIZ</title> e o bundle JS servindo.
//     URL estável: https://sargento-luiz-murilohenriquemota935-1958s-projects.vercel.app
// [ ] M1 — ASSETS: [x] piso sem costura 2026-10-14 20:23 (re-extração do
//     miolo = tile 47 do wangset, o único fill puro; prova: folha-contato
//     dos 16 biomas lida, grade de 64px sumiu). [x] parede com altura
//     duplicada (frente visual, `8ff3ac5` — drawWallEdges virou só
//     contorno). [x] TORNADO (2026-10-16, F8/I): o evento showpiece da
//     Cidade — vórtice que atravessa o mapa EMPURRANDO jogador e zumbi
//     (força que cai a zero a 260px; dano só dentro do funil), visual de
//     partículas de sprite (fumaça em espiral + poeira na base), uivo de
//     "Storm Arwen 2022" (Tsorthan Grove, CC-BY 4.0) tornado.ogg, aviso
//     "TORNADO" no HUD, permissão SÓ no bioma da Cidade (o prólogo fecha
//     o céu "do lado do mar"). Trava: tornado.test (6) + npm run tornado
//     (174px de empurrão no jogador; no Espaço a permissão mata o
//     evento no 1º update). [x] AMBIÊNCIA SONORA (2026-10-16, J1): o
//     agendador `systems/ambiente.ts` arma one-shots por FASE — vento na
//     Cidade (o prólogo cumpre), gaivota e água no Porto, gotejamento na
//     Caverna, apito e maquinário no Pátio de Trens, maquinário na
//     Fábrica, drone e alarme no Espaço, drone no NÚCLEO; o Hospital
//     silencia de projeto. 8 arquivos novos (Rango Mango/qubodup/bart/
//     ezduzziteh CC0 · jdagenet CC-BY 3.0 · Tsorthan Grove CC-BY 4.0),
//     SFX_FILES 42→50, sfxAmbiente SEM fallback (silêncio, não síntese).
//     Trava: ambiente.test (7 — nomes de fase e chaves batem, janelas
//     honradas) + npm run ambiente (as 6 fases com seus contratos).
//     → O M1 ESTÁ COMPLETO: piso, parede, tornado e ambiência.
// [x] M2 — BUGS DE FLUXO (2026-10-15, F1): [x] resetSpawner no load de
//     fase ("onda 2 na entrada") — F0; [x] anúncio de onda cala sob a caixa
//     de diálogo (Hospital): o som agora arma PENDENTE na abertura do
//     encontro e toca quando a caixa fecha — m2fluxo-proof testemunha o
//     flag armar/consumir; [x] input morto no blur da aba: NÃO REPRODUZ
//     no HEAD (blur-proof: 256px de movimento pós-blur+ESC nas duas
//     variantes, 60q/s) — o relato é do build publicado, anterior ao fix
//     de 2026-10-13; ação = republicar o zip; [x] tela de vitória "Muito
//     bem, soldado!": o título novo + o markGameCompleted no caminho
//     natural (antes só o FINAL SECRETO "PERFEIÇÃO" marcava — quem zerou
//     morrendo via GAME OVER no fim vencido); [x] martelo forçado no
//     NÚCLEO: o Destruidor vem NA MÃO e as teclas 1-9/Q respondem com
//     aviso em vez de trocar (m2fluxo-proof: arma Destruidor na entrada,
//     tecla 2 não troca); [x] gate da fúria no spawn do powerup: a gema
//     "F" não dropa (comum NEM chefe) e não entra no estoque da loja
//     enquanto a Fábrica não abrir a tecla E — gateFuria.test (5).
//     Prova: npm run m2fluxo (3 contratos verdes) + npm run blur.
// [ ] M3 — DINHEIRO E DESAFIO: [x] economia medida contra o modelo do
//     árbitro (2026-10-16, F7/H): o modelo ganhou FONTE ÚNICA
//     (`src/systems/economia.ts`) e enxergou as duas TORNEIRAS — os TITÃS
//     (3× moedas) e a COLETA da Fábrica, que entraram no jogo depois dele.
//     Renda verdadeira: 2.896 (não 2.492); a razão tinha caído a 2,25 e a
//     escada foi REPOSTA (t4 320, t5 450, especiais 900 → 8.400, razão
//     2,90× no meio da banda; t1 60 segue — toda fase paga o 1º degrau).
//     A medição em navegador (`npm run m3economia`) lê o lado do SPAWN
//     (gerado/abate vs modelo) com as folgas medidas documentadas (floor
//     da moeda pequena, stomp sem prêmio). [x] resistência a explosão nos
//     chefes: 0,75 (placa — vale arma explosiva, barril e granada; o
//     Destruidor segue sendo a fantasia da fase final), explosivos.test
//     +2. [x] rework da Pistola Incandescente: o efeito SEMPRE valeu pra
//     qualquer arma (o mecanismo conta cada tiro) — agora o nome diz:
//     "Munição Incandescente", "a cada 5 tiros, um incendeia — vale para
//     qualquer arma" (id preservado: é a chave do save). [x] archers do
//     Castelo alternam alvo: "encostou, vira alvo" — caçador a 90px arma
//     o mesmo aggro de 4s (cacador re-medido: sem regressão, a variância
//     documentada domina). [x] PONTE COM MULTI-SPAWN + TIMER DE QUEBRA
//     (2026-10-16, J2): a fala da cutscene virou mecânica — o tabuleiro
//     cede uma coluna por vez, de leste pra oeste ATRÁS do jogador
//     (graça 10s, passo 6s): a coluna anterior SELA em parede, a nova
//     frente vira entulho (10/s para quem fica em pé), e DOIS inimigos
//     acordam por passo (o multi-spawn: a queda tira quem aninhava nos
//     cabos). O terreno re-prerenderiza por passo, o minimapa aprende as
//     paredes novas, o HUD mostra "A PONTE CAI EM Xs". A frente PARA na
//     coluna 3 — a zona de extração (col 2) nunca cai; e a queda PAUSA
//     quando o objetivo cumpre: quem atravessa rápido luta o chefe com
//     espaço, quem demora, apertado. Trava: ponte.test (7) + npm run
//     ponte (a queda anda, o objetivo congela, o prerender aguenta).
//     → O M3 ESTÁ COMPLETO: economia medida, placa, munição, caçador,
//     ponte.
//     Histórico da loja nova (entregue na F0, 2026-10-15): contratado
//     (segue e atira), torreta na entrada (fixa, atira com linha de
//     visão, sprite Kenney TD 277 CC0) e consumível Botas de Campo
//     (+30% velocidade na fase) — efeito real (servicos.test 10 + npm run
//     servicos). O CACHORRO ficou FORA até existir arte top-down CC0
//     (candidatos são de perfil — perspectiva mista, DECISIONS #91/#214);
//     quem reinicia a fase (protect) perde o aliado pago (#215).
// [x] M4 — A ORDEM E O VOO (2026-10-16, F4): Pântano 8 → Refinaria 9 →
//     Subestação 10 → Vulcão 11 → Porto 12 → Castelo 13 → Espaço 14 →
//     NÚCLEO 15 — o foguete enche TANQUE no Porto antes de ser CONCERTADO
//     no Castelo e voar. Prova: campanha-proof 16/16 na ordem nova, TODA
//     fase começando na onda 1. [x] sequência de voo no lugar do
//     countdown: `drawVoo` — 3 bandas de céu chapadas (azul → azul e
//     preto → chegada), o foguete subindo e encolhendo (vista de baixo),
//     "APROXIMANDO DA ESTAÇÃO" no fim; arma no respiro do Castelo pelos
//     DOIS caminhos (onda e morte do chefe, `armarRespiro`) e conta os
//     mesmos 5s — `npm run voo` (arma, conta, entrega a loja; na Cidade
//     não arma). semDesenho teto 72→75 com porquê no diff.
//     [x] falas: clima na Cidade (o céu fecha do lado do mar — setup do
//     tornado do M1), Caverna citando o hospital que agora a precede, e
//     as verbatim duplicadas do Pântano dedupadas (bug de costura do H3).
//     Consequências cuidadas: save resolve fase por NOME (reordenar não
//     puxa o jogador para outra fase); BIOMAS/FASE_PARA_CUTSCENE/
//     provas re-indexadas; balance ganhou o formato M4 (subida em todo
//     passo MENOS o respiro declarado do Castelo — o custo cai −43% e a
//     cauda RECUPOA acima do pré-dip: 5091→2864→5306→6447, medido);
//     variedade ganhou a guarda BIOMAS[i]==PHASES[i].map; ondas idem
//     (respiro declarado). PNGs do voo com pendência de leitura (regra 16).
// [x] M5 — EMOÇÃO E CONQUISTAS (2026-10-16, F6): [x] "YOU SHALL NOT
//     PASS!" do MAQUINISTA na entrada — `entryShout` no config, a barra de
//     boss mostra o grito por 2,6s antes da primeira telegrafia (só dele: o
//     grito é a assinatura do vigia do pedágio, não ruído dos 17). [x]
//     abates de chefe com slow-mo + fala de morte: `deathLine` para os 17
//     chefes (de 'A cidade cai comigo.' do VIGIA ao 'INSTABILIDADE
//     REGISTRADA.' do NÚCLEO), câmera lenta 0,3/0,9s na queda, a fala
//     flutua ONDE o chefe caiu (damageNumber) e o toast entra por ÚLTIMO —
//     o cap de 3 comia a fala quando ela vinha antes de
//     conquista/diário/onda (mordida da prova m5). [x] conquistas: 10/50
//     com a mesma arma ('Pistoleiro Leal'/'Uma Arma Só'), fase inteira sem
//     dano ('Intocável' — o nome histórico de volta), 20 rasantes
//     ('Rasante', banda de 6-30px, uma vez por bala), 10 abates por barril
//     ('Pirotecnista', contados POST-explosão: health<=0 no raio, sem
//     estimativa de falloff) e o traje ('Traje de Contenção').
//     Prova: npm run m5 (grito arma/expira, fala na pilha, traje).
// [ ] M6 — CENOGRAFIA POR BIOMA (aprovado 2026-10-14 ~20:00):
//     [x] as árvores (frente visual, `8ff3ac5`) e o asfalto com faixas
//         (verificado J3a 2026-10-16: `npm run asfalto` mede faixa 124 ×
//         corpo 25 × ombro 0 — a pista lê). [x] AS CARCAÇAS (J3b,
//         2026-10-16): carros do Kenney Racing Pack (CC0) processados
//         (horizontal + dessaturação 45%), prop `carro` bloqueador
//         permanente como a árvore, char 'A' no genmaps — 8 na Rodovia
//         (fila nas faixas, no lugar dos engradados curados) e 4 na
//         Cidade (nas ruas; 1 caiu dentro da arena e foi comido pelo
//         gerador — 3 ficaram). ACHADO da frente: o genmaps.py estava
//         ATRASADO vs maps.ts — regerar destruía a estrada; o rodovia()
//         virou especificação LITERAL byte a byte (DECISIONS #245).
//         Prova: `npm run carros` (pixel: rodovia 109×24, cidade 172×45).
//     [x] (c-parcial, 2026-10-16 J3c): o decor por bioma virou LISTA de
//         tiles com as escolhas erradas da auditoria T6 fora — castelo
//         ganhou o BRASÃO/ESTANDARTE (312 no lugar do quadrado bege), a
//         CAVERNA ganhou os CRISTAIS 264/265 (o inimigo crystal existia
//         e o mapa não tinha um), o porto perdeu o "avião de papel" por
//         pedra de cais, cidade/vulcão ganham variedade (289/319). As
//         [x] TOCHAS do Castelo (2026-10-16, J3c-final): AUTORAIS
//             (`gen_assets_cenografia.py`, CC0 — o precedente das
//             árvores; braseiro visto de cima, chama âmbar blob). [x]
//             (d) A ESTAÇÃO (J3d, 2026-10-16): painel de piso autoral no
//             Espaço (placa chanfrada, luzes apagadas, grade de ventilação)
//             e BERÇO das biomaquinas no NÚCLEO (laje com guias âmbar e
//             fenda central) — a caça externa falhou (pack renomeado no
//             catálogo do Kenney), a geração autoral cobriu com a paleta
//             medida. Prova: npm run cenografia (berço 19×38 no NÚCLEO,
//             painel 129×30 no Espaço, brasão 56×41 no Castelo).
//             → A FRENTE M6 ESTÁ COMPLETA: árvores, asfalto, carcaças,
//             cristais, brasão, tochas, painel e berço.
//     Achado: o pack TEM tambor (~tile 505-511) e o barril seguia
//     procedural — dívida da regra 15. Sistema: cenografia nasce no
//     genmaps.py (ele REGERA o maps.ts — edição manual é apagada); a
//     Rodovia pede piso por char (asfalto na pista, acostamento fora).
// [ ] FINAL: redeploy no Vercel com o build de tudo (npm run build &&
//     vercel deploy dist --prod --yes --name sargento-luiz).
//     [x] FEITO 2026-10-16 01:58, build `index-D-LzR4pc.js` (M4+M5+frente
//     visual+F0/F1): target PRODUCTION Ready, aliases
//     `sargento-luiz.vercel.app` e o URL estável do TODO. Verificado ao
//     vivo: bundle novo servido, `torreta.png` 200/PNG/398b, e as strings
//     desta sessão ("MUITO BEM, SOLDADO", "YOU SHALL NOT PASS",
//     "APROXIMANDO DA ESTAÇÃO") no JS do ar.

// ═══════════════════════════════════════════════════════════════
// PLAYTEST 2026-10-16 (Fase III) — triagem da frente F-A/F-B
// ═══════════════════════════════════════════════════════════════
// [x] A1 carros somem com um tiro: o caminho do debris derrubava
//     QUALQUER prop atingido — carro e árvore agora são cobertura
//     intocável (fagulha, a bala morre); colisor 34→40 e desenho a
//     1,75 célula (zumbi não entra mais pela ponta). Prova: balas
//     direto no carro, pixel 172→172 (carros-proof).
// [x] A2 TypeError .map no fim: JSON.parse válido ≠ forma válida —
//     as 5 fronteiras de localStorage (leaderboard/achievements/diary/
//     skins/save) validam a forma; save velho descarta limpo.
//     saveSystem.test +3.
// [x] A3 o lag após matar muitos: VAZAMENTO de grafo de áudio — todo
//     SFX conectava um GainNode sem nunca desconectar; centenas de
//     hits = centenas de nós presos. onended+disconnect nos 5 caminhos
//     one-shot + crossfade de música (DECISIONS #251).
// [x] A4 pause dessincronizado: ESC em tela cheia SAÍA do fullscreen
//     em vez de pausar (#111) e ESC no tutorial dispensava sem pausar —
//     a máquina ficava um atrás ("pausar e voltar não progride"). ESC
//     pausa SEMPRE; sair da tela cheia = opção no menu de pausa
//     (DECISIONS #253). Prova: m4-pausa-proof (ESC#1 paused, ESC#2
//     playing, ondas andam).
// [x] recarga "só um ruidinho": o progresso VIAJA com a arma (trocar
//     pausa, voltar retoma — antes trocar CANCELAVA) e arma emperrada
//     não começa recarga. weaponAmmo.test +2 (DECISIONS #252).
// [ ] A5 player para de se mover em certos mapas — SUSPEITO: o
//     empurrão (tornado/ponte) prendendo contra parede + input = net
//     zero. Repro: bot andando nas 16 fases + instrumento de stall.
// [x] F-B (2026-10-16, noite): [x] TORRE=zumbi → robot; [x] contratado
//     com pose 'gun' + aviso de peso na morte (flash+toast+sfx);
//     [x] BOTAS FORA (decisão sua: a velocidade default é a ideal) —
//     serviço, consumo, prova e testes atualizados; [x] continue do save:
//     música de combate + a QUALIDADE do par na arma (a "pistola
//     sobrescrita" era equipar por índice sem qualidade); [x] amigo/
//     doutor/Júlio nascem com pushOutOfWalls (o bug da parede); [x]
//     flash/véu desenha ANTES da caixa (a faixa branca sobre as
//     mensagens); [x] respiro da Fábrica espera o FERNANDO (o
//     "COLETANDO" não arma mais no sentinel); [x] risada do epílogo na
//     LINHA do riso (efeito por linha, o molde da caixa — DECISIONS #258);
//     [x] hint fala o número real de armas ("1-4: trocar arma" quando
//     são 4).
// [ ] F-B RESTA: o "U" do Pântano (o mapa tem um bolsão que lê como
//     letra — precisa do seu olho pra apontar qual), a onda 1 do Vulcão
//     (medição), SFX timing (auditoria por gatilho) e A5 (player para
//     de se mover — repro com bot).
// [ ] F-C (SPRITES: tint por inimigo, arma na mão, casas, hospital) e
//     F-D (refinaria=combustível, subestação opcional, melee, moral)