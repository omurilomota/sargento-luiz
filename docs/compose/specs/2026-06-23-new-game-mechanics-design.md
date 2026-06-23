# Design: Novas Mecânicas de Jogo

## [S1] Problema

O jogo atual possui mecânicas básicas de movimentação e tiro. O jogador precisa de mais opções estratégicas e variedade durante o gameplay para aumentar a rejogabilidade e profundidade.

## [S2] Visão Geral da Solução

Adicionar 5 novas mecânicas de jogo de forma simples e funcional:
1. Sistema de Dash/Dodge
2. Habilidade Especial (Ultimate)
3. Sistema de Crafting
4. Perigos Ambientais
5. Modificação de Armas com Elementos

## [S3] Sistema de Dash/Dodge

- **Tecla:** Shift para ativar dash
- **Comportamento:** Move o jogador rapidamente na direção atual
- **Invincibilidade:** 0.3 segundos durante o dash
- **Cooldown:** 2 segundos entre dashes
- **Visual:** Rastro de partículas durante o movimento

## [S4] Habilidade Especial (Ultimate)

- **Barra de carga:** 100 pontos para ativar
- **Ganho de carga:** +10 pontos por inimigo morto
- **Efeito:** Explosão em área (raio 150px, dano 100)
- **Cooldown:** 30 segundos após uso
- **Visual:** Indicador na parte superior da tela

## [S5] Sistema de Crafting

- **Materiais:**
  - Ferro: Dropa de inimigos comuns (30% chance)
  - Cristal: Dropa de inimigos raros (20% chance)
  - Fogo: Dropa de inimigos de fogo (25% chance)

- **Combinações:**
  - Ferro + Arma = Arma com +10% dano
  - Cristal + Fogo = Elemento aleatório
  - 3x Ferro = Upgrade aleatório

- **Interface:** Aba de crafting na loja

## [S6] Perigos Ambientais

- **Lagoas de lava:**
  - Dano: 5 por segundo ao pisar
  - Visual: Círculo laranja com animação
  - Spawn: 2-3 por fase

- **Armadilhas de gelo:**
  - Efeito: Stun por 1 segundo
  - Visual: Círculo azul claro
  - Spawn: 3-4 por fase

## [S7] Modificação de Armas (Elementos)

- **Fogo:**
  - Efeito: Burn (5 dano por 2 segundos)
  - Cor: Laranja/vermelho

- **Gelo:**
  - Efeito: Slow (50% velocidade por 2 segundos)
  - Cor: Azul claro

- **Raio:**
  - Efeito: Stun (0.5 segundos)
  - Cor: Roxo

- **Aplicação:** Via crafting na loja

## [S8] Requisitos de Implementação

- Todas as mecânicas devem ser simples e funcionais
- Interface do usuário deve ser intuitiva
- Balanceamento adequado para não quebrar o jogo
- Compatível com o sistema existente de fases e loja
