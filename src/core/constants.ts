/**
 * Constantes do jogo.
 * Valores centralizados para facilitar ajustes de balanceamento
 * sem necessidade de modificar código em múltiplos arquivos.
 */

/** Número máximo de partículas ativas na tela simultaneamente */
export const MAX_PARTICLES = 500;
/** Número máximo de projéteis ativos na tela simultaneamente */
export const MAX_BULLETS = 200;
/** Número máximo de inimigos ativos na tela simultaneamente */
export const MAX_ENEMIES = 16;
/** Velocidade base de movimento do jogador em pixels/segundo */
export const PLAYER_BASE_SPEED = 320;
/** Pontos de vida iniciais do jogador */
export const PLAYER_BASE_HEALTH = 100;
/** Raio de colisão do jogador */
export const PLAYER_RADIUS = 18;
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
/** Tempo de vida de uma moeda no chão (segundos) */
export const COIN_LIFE = 20;
/** Tempo de vida de um power-up no chão (segundos) */
export const POWERUP_LIFE = 12;
/** Número base de inimigos por onda */
export const WAVE_BASE_ENEMIES = 8;
/** Inimigos adicionais por onda (escala com número da onda) */
export const WAVE_ENEMIES_PER_LEVEL = 3;
/** Intervalo base entre spawns de inimigos (segundos) */
export const WAVE_BASE_SPAWN_RATE = 0.8;
/** Redução do intervalo de spawn por onda (segundos) */
export const WAVE_SPAWN_RATE_DECAY = 0.05;
/** Intervalo mínimo entre spawns de inimigos (segundos) */
export const WAVE_MIN_SPAWN_RATE = 0.2;
/** Quantidade de vida recuperada ao completar uma onda */
export const WAVE_HEAL_ON_COMPLETE = 15;
/** Fator de escala de stats dos inimigos por onda */
export const WAVE_SCALE_PER_LEVEL = 0.15;
/** Fator de escala de velocidade dos inimigos por onda */
export const WAVE_SPEED_SCALE_PER_LEVEL = 0.05;
