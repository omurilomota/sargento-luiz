/**
 * Constantes do jogo.
 * Valores centralizados para facilitar ajustes de balanceamento
 * sem necessidade de modificar código em múltiplos arquivos.
 */

/** Número máximo de partículas ativas na tela simultaneamente */
export const MAX_PARTICLES = 500;
/** Número máximo de inimigos ativos na tela simultaneamente */
export const MAX_ENEMIES = 16;
/** Velocidade base de movimento do jogador em pixels/segundo */
export const PLAYER_BASE_SPEED = 320;
/** Pontos de vida iniciais do jogador */
export const PLAYER_BASE_HEALTH = 100;
/** Raio de colisão do jogador */
export const PLAYER_RADIUS = 18;
/**
 * Raio de colisão dos itens no chão (moeda, power-up, caixa de loot).
 * Spawn usa `pushOutOfWalls` com este raio: inimigo morto encostado na parede
 * colocava o item dentro dela, e sem colisão no movimento ele ficava lá até
 * expirar — impossível de pegar.
 */
export const PICKUP_RADIUS = 9;
/** Raio adicional para coleta de moedas */
export const COLLECT_RADIUS = 12;
/** Raio de atração do magnetismo para moedas */
export const MAGNET_RADIUS = 120;
/** Velocidade de atração das moedas quando magnetismo está ativo */
export const MAGNET_SPEED = 400;
/** Tempo para o combo resetar após último abate (segundos) */
export const COMBO_TIMEOUT = 2;
/** Duração da invincibilidade ao colidir com inimigo (segundos) */
export const INVINCIBLE_DURATION = 0.5;
/** Duração da invincibilidade ao ser atingido por projétil inimigo (segundos) */
export const BULLET_INVINCIBLE_DURATION = 0.3;
/** Tempo de vida padrão de um projétil (segundos) */
export const BULLET_LIFE = 2;
/** Vida da mina plantada (explosiva parada) — pavio longo, não o da bala */
export const MINE_LIFE = 12;
/** Raio em que um inimigo arma a mina (pixels) */
export const MINE_DETECTION_RADIUS = 72;
/** Delay entre detectar o inimigo e explodir (segundos) */
export const MINE_FUSE = 0.6;
/** Tempo de vida de uma moeda no chão (segundos) */
export const COIN_LIFE = 20;
/** Tempo de vida de um power-up no chão (segundos) */
export const POWERUP_LIFE = 12;
/**
 * Número base de inimigos por onda.
 *
 * A densidade é baixa de propósito: a ameaça vem do `mutante`, que é forte e
 * lento, não de encher a tela. Com 8 inimigos comuns na primeira onda da Cidade
 * o dano possível passava dos 100 HP do jogador — morria quem ainda estava
 * aprendendo a recarregar. Ver `balance.test.ts`, que trava esse teto.
 */
export const WAVE_BASE_ENEMIES = 4;
/** Inimigos adicionais por onda (escala com número da onda) */
export const WAVE_ENEMIES_PER_LEVEL = 2;
/** Intervalo base entre spawns de inimigos (segundos) */
export const WAVE_BASE_SPAWN_RATE = 1.2;
/** Redução do intervalo de spawn por onda (segundos) */
export const WAVE_SPAWN_RATE_DECAY = 0.05;
/** Intervalo mínimo entre spawns de inimigos (segundos) */
export const WAVE_MIN_SPAWN_RATE = 0.2;
/** Quantidade de vida recuperada ao completar uma onda */
export const WAVE_HEAL_ON_COMPLETE = 15;
/**
 * Pausa antes de a loja abrir quando a última onda é limpa.
 * Sem ela o loot do último abate some sob a tela da loja antes de ser visto.
 */
export const PHASE_END_PAUSE = 5;
/** Segundos de "nave em perigo" na entrada do Espaço: a tela vermelha dos
 * primeiros instantes, que dá peso à fala do Bot #89 (H3, relato do dono). */
export const PERIGO_NAVE_SEGUNDOS = 5;
/**
 * Faixa de combate do atirador comum (relato do Murilo, 2026-10-13: "os
 * atiradores não fazem sentido aproximar se já sabem onde estou"). Acima do
 * alcance ele chega; abaixo do recuo ele afasta; entre os dois, fica.
 */
export const ALCANCE_DO_ATIRADOR = 300;
export const RECUO_DO_ATIRADOR = 200;
/** Fator de escala de stats dos inimigos por onda */
export const WAVE_SCALE_PER_LEVEL = 0.15;
/** Fator de escala de velocidade dos inimigos por onda */
export const WAVE_SPEED_SCALE_PER_LEVEL = 0.05;
