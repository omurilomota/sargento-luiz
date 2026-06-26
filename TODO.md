# TODO

## Bugs

- [x] Tempo de recarga dos poderes ficando em cima da barra de informações (HUD)
- [x] Eventos do ambiente ficando em cima do tempo dos power-ups
- [x] Nome da arma que fica no canto inferior esquerdo e o nome está agora no canto inferior direito, remova o nome do canto inferior esquerdo.
- [x] Quando aperto ENTER no menu, ele não volta pro menu
- [ ] Bug: mostra dano mas nem sempre tomo dano (especificamente na onda 2) Bug de status de vida, etc que some do nada e não aparece mais. Queria trocar de lugar também e colocar de outra forma as informações se possível. Bug persiste


## Features Pendentes

- [ ] Modo competitivo online para jogar com amigos
- [ ] Possibilidade de jogo 2D de lado estilo Zombotron (continuação/versão separada)
- [x] Regeneração lenta de graça.
- [x] Aviso de evento de ambiente vindo antes para avisar o jogador para ele se preparar

## Sugestões

### Narrativa
- [ ] Escolhas na história que afetam o final (bom/ruim/moral)
- [x] Cutscenes com mais animação (personagem andando, explosões, etc)
- [ ] Diário de bordo do Rios que desbloqueia a cada fase (lore opcional)
- [x] Final secreto se o jogador nunca morrer
- [x] Personagens secundários que aparecem e morrem no caminho

### Gameplay
- [ ] Sistema de dificuldade progressiva mais dinâmico (inimigos aprendem padrões)
- [x] Bosses com fases de ataque (não só atirar e andar)
- [x] Modo survival com leaderboard local (salvar score no localStorage)
- [x] Modo hardcore (uma vida só, sem recarga entre ondas)
- [x] Arma secreta desbloqueável após completar o jogo
- [x] Inimigos que dropam power-ups temporários ao morrer (8% chance, main.ts:572)
- [x] Sistema de crítico visual (câmera lenta no headshot)

### UI/UX
- [x] Tela de pausa com ESC (opção de voltar ao menu e continuar de onde parou) (main.ts:128-136)
- [x] Mini-mapa no canto mostrando posição dos inimigos
- [x] Animação de morte do jogador (não só sumir)
- [x] Transição animada entre fases (fade + nome da fase)
- [x] Tutorial interativo na primeira fase (setas e textos)

### Visual
- [x] Screen shake mais sutil (restrito a RPG e granada)
- [x] Sombras dos personagens no chão
- [x] Efeito de zoom lento no boss quando aparece

### Código
- [x] Sistema de save/load (localStorage) para continuar jogo (saveSystem.ts)
- [x] Sistema de achievement/badges (primeiro kill, sobreviver 10 ondas, etc)
- [ ] Testes unitários para sistemas de colisão e dano
