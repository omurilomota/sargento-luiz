// Sempre leia antes de marcar X

- [x] Sons para cada arma especificamente.
- [x] Armas municiadas, podendo ter recarregamento.
- [x] Bug existente em que do nada inimigos morrem ou eu tomo dano.
- [x] Modo competitivo para jogar contra bots que seriam jogadores mais experientes.
- [ ] Modo competitivo online para jogar com amigos.
- [x] Expansão da loja
- [x] Upgrades de personagens
- [x] Moedas que comprarão skins
- [x] Anúncios para comprar skins
- [x] Dinheiro para comprar skins
- [x] Jogo com muita cara de IA, pouco natural
- [x] Inimigos tomam dano do nada também.
- [x] Buff geral nos inimigos ( a cada onda ficam mais fortes )
- [x] Possibilidade de builds de combos para melhor vantagem no jogo.
- [ ] Possibilidade de fazer jogo semelhante contando melhor a história ou possível continuação do jogo de 2D de lado estilo Zombotron.
- [x] Loja com cliques errados, uns não podia comprar nem se quisesse e outras compravam o de cima.
- [x] R passara a ser para recarregar furia será movida para outra tecla.
- [x] inimigos tomam dano do nada e eu também, estou suspeitando de que seja alguns eventos de ambiente que a IA só implementou no código e faltou o visual.
- [x] História bem documentada e decente para esse jogo com diálogos e animações em Canvas2D ou algo melhor e mais indicado.
- [x] 1,2,3,4,5,6,7 etc não funcionam na tela inicial do jogo.
- [x] Tomo dano como se tivesse trombado em zumbi (mas não trombei) especialmente em início de alguma onda aí.
- [x] Tela inicial com opções de modo sobrepondo as teclas do jogo.
- [x] Sinto falta de um timer pra saber quando posso usar fúria, escudo e demais poderes...
- [x] Bug de não cosneguir selecionar nenhum voltou, até consigo mudar o que quero, mas qando aperto ENTER, nada
- [x] Novamente tomei dano e foi após iniciar a onda 2.
- [x] Projeto com muitos arquivos soltos, falta um cleanup geral.
- [x] Tela inicial ainda está uma bosta, itens sobrepondo-se. Tente refazer a tela inicial.
- [x] Diálogo passando muito rápido e não dá nem pra ler, recomendo enter para continuar...
- [ ] Tempo de recarga do poderes
- [ ] Dano persiste na onda 2 que tomo dano aleatoriamente mesmo após correções.

// ═══════════════════════════════════════════════════════════════
// SUGESTÕES (avaliar quais implementar)
// ═══════════════════════════════════════════════════════════════

// --- HISTÓRIA / NARRATIVA ---
- [ ] Escolhas na história que afetam o final (bom/ruim/moral) - Legal
- [ ] Cutscenes com mais animação (personagem andando, explosões, etc)  - Legal
- [ ] Diário de bordo do Rios que desbloqueia a cada fase (lore opcional) - Legal 
- [ ] Final secreto se o jogador nunca morrer - Legal
- [ ] Personagens secundários que aparecem e morrem no caminho (impacto emocional) - Legal

// --- GAMEPLAY ---
- [ ] Sistema de difficulté progressiva mais dinâmico (inimigos aprendem padrões) - Legal
- [ ] Bosses com fases de ataque (não só atirar e andar) - Legal
- [ ] Modo survival com leaderboard local (salvar score no localStorage) - Legal, podemos evoluir para online/multiplayer
- [ ] Modo hardcore (uma vida só, sem recarga entre ondas) - Legal
- [ ] Arma secreta desbloqueável após completar o jogo - Legal
- [ ] Inimigos que dropam power-ups temporários ao morrer - Legal
- [ ] Sistema de crítico visual (tela fica em câmera lenta no headshot) - Legal

// --- UI/UX ---
- [ ] Tela de pausa com ESC (opção de voltar ao menu) - Legal, poeriamos também colocar um modo qe voce volta onde parou.
- [ ] Mini-mapa no canto mostrando posição dos inimigos - Legal
- [ ] Animação de morte do jogador (não só sumir) - Legal
- [ ] Transição animada entre fases (fade + nome da fase) - Legal
- [ ] Contador de inimigos restantes na onda atual - na verdade já tem
- [ ] Tutorial interativo na primeira fase (setas e textos) - pode ser

// --- VISUAL / DESIGN ---
- [ ] Efeito de screen shake mais sutil e consistente - por mim é restrito só a rpg e granada
- [ ] Partículas de poeira no chão durante terremoto - legal
- [ ] Indicador visual de dano nos inimigos (flash vermelho) - legal
- [ ] Sombras dos personagens no chão - legal
- [ ] Efeito de zoom lento no boss quando aparece - legal

// --- CÓDIGO / ARQUITETURA ---
- [ ] Sistema de save/load (localStorage) para continuar jogo - legal
- [ ] Sistema de achievement/badges (primeiro kill, sobreviver 10 ondas, etc) - legal
- [ ] Modularizar drawMenu em componente separado - legal
- [ ] Testes unitários para sistemas de colisão e dano - legal
- [ ] Performance: limitar partículas por frame (já tem cap, verificar se funciona) - legal

// Todas essas melhorias envolvem muitos assets, seria interessante voce entrar na internet e pegar todos eles...