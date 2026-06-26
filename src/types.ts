// src/types.ts

/** Vetor bidimensional genérico para coordenadas e direções */
export interface Vec2 {
  /** Coordenada horizontal */
  x: number;
  /** Coordenada vertical */
  y: number;
}

/** Representa um projétil disparado por jogador ou inimigo */
export interface Bullet {
  /** Posição horizontal */
  x: number;
  /** Posição vertical */
  y: number;
  /** Velocidade horizontal */
  vx: number;
  /** Velocidade vertical */
  vy: number;
  /** Tempo de vida restante em segundos */
  life: number;
  /** Dano causado ao atingir um alvo */
  damage: number;
  /** Indica se o projétil foi disparado por um inimigo */
  isEnemy: boolean;
  /** Cor de renderização do projétil */
  color: string;
  /** Indica se o projétil atravessa múltiplos alvos */
  pierce: boolean;
  /** Indica se o projétil é explosivo */
  explosive?: boolean;
  /** Raio da explosão em pixels */
  explosionRadius?: number;
}

/** Representa um inimigo no campo de batalha */
export interface Enemy {
  /** Posição horizontal */
  x: number;
  /** Posição vertical */
  y: number;
  /** Raio de colisão */
  radius: number;
  /** Velocidade de movimento em pixels/segundo */
  speed: number;
  /** Pontos de vida atuais */
  health: number;
  /** Pontos de vida máximos */
  maxHealth: number;
  /** Dano causado ao colidir com o jogador */
  damage: number;
  /** Cor de renderização */
  color: string;
  /** Pontos concedidos ao ser derrotado */
  scoreValue: number;
  /** Temporizador para o próximo disparo */
  shootTimer: number;
  /** Intervalo entre disparos em segundos */
  shootRate: number;
  /** Indica se o inimigo pode disparar projéteis */
  canShoot: boolean;
  /** Identificador do tipo de inimigo (chave no ENEMY_TYPES) */
  type: string;
  /** Ângulo de rotação atual */
  angle: number;
  /** Temporizador para ataques especiais */
  attackTimer: number;
  /** Temporizador para invocar aliados (chefes) */
  summonTimer: number;
  /** Delay antes de começar a se mover (segundos) */
  spawnDelay: number;
  /** Timer de flash de dano (segundos restantes) */
  hitFlash: number;
  /** Fase de ataque do boss (0-2, apenas para isBoss) */
  bossPhase: number;
}

/** Representa uma partícula visual (explosão, rastro, etc.) */
export interface Particle {
  /** Posição horizontal */
  x: number;
  /** Posição vertical */
  y: number;
  /** Velocidade horizontal */
  vx: number;
  /** Velocidade vertical */
  vy: number;
  /** Tempo de vida restante em segundos */
  life: number;
  /** Tempo de vida total (usado para calcular alpha) */
  maxLife: number;
  /** Raio da partícula */
  radius: number;
  /** Cor da partícula */
  color: string;
}

/** Representa uma moeda coletável dropada por inimigos */
export interface Coin {
  /** Posição horizontal */
  x: number;
  /** Posição vertical */
  y: number;
  /** Valor em pontos ao ser coletada */
  value: number;
  /** Tempo de vida restante em segundos */
  life: number;
  /** Velocidade horizontal */
  vx: number;
  /** Velocidade vertical */
  vy: number;
}

/** Representa um power-up coletável no campo de batalha */
export interface PowerUp {
  /** Posição horizontal */
  x: number;
  /** Posição vertical */
  y: number;
  /** Tipo do power-up (chave no POWERUP_TYPES) */
  type: string;
  /** Tempo de vida restante em segundos */
  life: number;
}

/** Define as propriedades de uma arma disponível na loja */
export interface Weapon {
  /** Nome da arma exibido na interface */
  name: string;
  /** Dano causado por projétil */
  damage: number;
  /** Intervalo entre disparos em segundos */
  shootRate: number;
  /** Velocidade do projétil em pixels/segundo */
  bulletSpeed: number;
  /** Quantidade de projéteis disparados por vez */
  bulletCount: number;
  /** Ângulo de dispersão entre projéteis (radianos) */
  spread: number;
  /** Cor dos projéteis */
  color: string;
  /** Preço em moedas para desbloquear */
  price: number;
  /** Indica se o projétil atravessa inimigos */
  pierce: boolean;
  /** Indica se o projétil é explosivo (explode ao atingir) */
  explosive?: boolean;
  /** Raio da explosão em pixels (apenas para armas explosivas) */
  explosionRadius?: number;
  /** Tamanho do pente (máximo de balas antes de recarregar) */
  magazineSize: number;
  /** Tempo de recarga em segundos */
  reloadTime: number;
  /** Arma secreta - só aparece se desbloqueada */
  secret?: boolean;
}

/** Define um upgrade permanente disponível na loja */
export interface Upgrade {
  /** Nome do upgrade exibido na interface */
  name: string;
  /** Identificador do efeito aplicado (health, speed, damage, etc.) */
  effect: string;
  /** Valor do efeito (absoluto para vida, percentual para dano/velocidade) */
  value: number;
  /** Preço em moedas para comprar */
  price: number;
}

/** Define uma fase do jogo com suas configurações visuais e de inimigos */
export interface Phase {
  /** Nome da fase exibido na interface */
  name: string;
  /** Cor de fundo principal */
  bg: string;
  /** Cor de fundo secundária */
  bgColor2: string;
  /** Cor da grade de fundo */
  gridColor: string;
  /** Tipos de inimigos que aparecem nesta fase */
  enemyTypes: string[];
  /** Número total de ondas na fase */
  waves: number;
}

/** Define as estatísticas e comportamento de um tipo de inimigo */
export interface EnemyType {
  /** Raio de colisão */
  radius: number;
  /** Velocidade base de movimento */
  speed: number;
  /** Pontos de vida base */
  health: number;
  /** Dano base ao colidir */
  damage: number;
  /** Cor de renderização */
  color: string;
  /** Pontos concedidos ao ser derrotado */
  scoreValue: number;
  /** Quantidade de moedas dropadas */
  coinDrop: number;
  /** Indica se o inimigo pode disparar projéteis */
  canShoot?: boolean;
  /** Intervalo entre disparos em segundos */
  shootRate?: number;
  /** Indica se é um chefe */
  isBoss?: boolean;
  /** Indica se possui armadura (forma hexagonal) */
  armor?: boolean;
  /** Indica se dispara múltiplos projéteis em leque */
  spreadShot?: boolean;
  /** Indica se o projétil se divide em 4 direções */
  splitBullet?: boolean;
  /** Indica se invoca outros inimigos periodicamente */
  summons?: boolean;
  /** Indica se deixa rastro de partículas de fogo */
  leavesFire?: boolean;
  /** Cor dos projéteis disparados */
  projectileColor?: string;
}

/** Estados possíveis do ciclo de vida do jogo */
export type GameStateType = 'menu' | 'playing' | 'shop' | 'gameover' | 'paused';
