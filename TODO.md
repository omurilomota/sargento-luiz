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
// [ ] Procedural restante (viola a nova regra):
//     drawHazard — 14 chamadas de desenho, 0 sprites, os 9 biomas
//     drawDecor  — 5 dos 9 biomas ainda desenham elipse em vez de usar tile
//     renderer   — 42 chamadas (só as bordas/auras são legitimamente código)
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
// [x] Som distinto por habilidade (dash, escudo, fúria)
// [x] Toggle de música/SFX no pause, com persistência

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
