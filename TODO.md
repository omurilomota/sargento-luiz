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

// --- HISTÓRIA / NARRATIVA ---
- [x] Cutscenes com mais animação (fundo dinâmico por fase, retrato flutuando)
- [x] Escolhas na história que afetam o final (3 finais diferentes)
- [x] Personagens secundários integrados ao gameplay (NPCs spawam aleatoriamente)

// --- GAMEPLAY ---
- [ ] Continuação do jogo estilo Zombotron (2D lateral)

// --- VISUAL ---
- [ ] Tiles de terreno por fase (atualmente só grid colorido)
- [x] Animação de morte completa do jogador (gira e encolhe por 1.5s)
- [ ] Assets para eventos ambientais e chão de cada level

// --- LIMPEZA ---
- [x] Remover `src/engine/` (código morto, prototype raycaster)
- [x] Limpar package.json (remover ~11 deps internas do Vite listadas por engano)
- [x] Remover console.log de debug em `main.ts:228`
- [x] Integrar constantes de `localMultiplayer.ts` com `constants.ts`
- [ ] Mover velocidades de tiro dos inimigos para config (hardcoded em main.ts)

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

// ═══════════════════════════════════════════════════════════════
// SUGESTÕES AVANÇADAS (baixa prioridade)
// ═══════════════════════════════════════════════════════════════
- [ ] Modo survival com leaderboard online
- [ ] Sistema de achievement/badges expandido
- [ ] Testes unitários para sistemas de colisão e dano
- [ ] Screen shake mais sutil e consistente (só RPG e granada)
- [ ] Partículas de poeira no chão durante terremoto
- [ ] Indicador visual de dano nos inimigos (hitFlash)
- [ ] Sombras dos personagens no chão
- [ ] Efeito de zoom lento no boss quando aparece
- [ ] Performance: limitar partículas por frame (verificar cap existente)
