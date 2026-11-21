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
  /** Posição horizontal no frame anterior (colisão swept) */
  px: number;
  /** Posição vertical no frame anterior (colisão swept) */
  py: number;
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
  /** Indica se este projétil acertou crítico */
  isCrit: boolean;
  /** Indica se o projétil atravessa múltiplos alvos */
  pierce: boolean;
  /** Indica se o projétil é explosivo */
  explosive?: boolean;
  /** Raio da explosão em pixels */
  explosionRadius?: number;
  /**
   * Família da sprite de projétil (`small_bullet` | `medium_bullet` |
   * `large_bullet`). Vem da classe da arma que disparou; o renderer usa para
   * escolher o asset, e cai no `arc` procedural se a sprite não carregar.
   */
  bulletSprite?: string;
  /** Inimigos já atingidos por esta bala (perfurante não re-hitta o mesmo alvo) */
  hitBy?: Set<Enemy>;
  /** Já explodiu — o flag que impede a dupla detonação (pavio × parede × impacto) */
  detonated?: boolean;
  /**
   * Tipo do inimigo que disparou (só em projétil inimigo).
   *
   * Só a telemetria lê: sem ele, `npm run sessao` responde "quanto o Espaço
   * mata" e não "qual inimigo mata mais no Espaço" — que é a pergunta que
   * decide o balanceamento do hazard.
   */
  orcador?: string;
  /** Fuse da mina plantada: segundos acumulados desde que o inimigo entrou no raio */
  fuse?: number;
}

/** Representa um inimigo no campo de batalha */
export interface Enemy {
  /** Posição horizontal */
  x: number;
  /** Posição vertical */
  y: number;
  /** Raio de colisão */
  radius: number;
  /**
   * O TITÃ da onda (T1): um inimigo comum que nasce grande — 3× vida, 1,5×
   * dano, 1,35× raio, 3× moedas, anel mostarda e barra de vida. Abre as
   * ondas a partir da segunda, para o chefão não ser o único corpo
   * grande da fase.
   */
  isElite?: boolean;
  /**
   * Segundos de ressentimento com o JOGADOR (decisão do Murilo, 2026-10-13):
   * o caçador do alvo que leva tiro troca de alvo temporariamente — persegue
   * quem atirou — e depois volta ao foguete.
   */
  aggroTimer?: number;
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
  /** Segundos de atordoamento (granada Flash). Não age nem atira. */
  stun: number;
  /** Segundos de inércia em poça (escorrega depois de mudar de direção). */
  slideWet: number;
  /** Direção do deslizamento molhado. */
  slideWetX: number;
  slideWetY: number;
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
  /**
   * Sprite do Kenney Particle Pack (CC0). Ausente = usa o círculo de fallback.
   * Escolhido na criação conforme o evento: muzzle flash, fumaça ou faísca não
   * são a mesma coisa.
   */
  sprite?: string;
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
  /** Se a arma é secreta (desbloqueada ao completar o jogo) */
  secret?: boolean;
  /** Armas 'quebradas' encasquilham após N disparos e exigem conserto */
  broken?: boolean;
  /** Tamanho do pente */
  magazineSize: number;
  /** Tempo de recarga em segundos */
  reloadTime: number;
  /** Arma de CORPO A CORPO (P0-4): o golpe atinge em arco e não gasta munição. */
  melee?: boolean;
  /** Arma arremessável: sai da mão em arco, não do bico da pistola. */
  thrown?: boolean;
  /** Alcance do golpe melee, em pixels. */
  meleeRange?: number;
  /** Abertura do arco do golpe melee, em radianos. */
  meleeArc?: number;
}

/** Ações possíveis de um boss data-driven */
export type BossAction = 'spread' | 'ring' | 'charge' | 'summon' | 'mines' | 'split' | 'sweep'
  | 'spray' | 'burst' | 'lob' | 'rail_charge' | 'tongue';

/** Uma etapa do padrão de ataque de um boss, ativada quando o HP cruza o limiar */
export interface BossPatternStep {
  /** Limiar de HP (0-1) abaixo do qual esta etapa assume */
  atHp: number;
  /** Ação executada nesta etapa */
  action: BossAction;
  /** Texto curto exibido na telegrafia (opcional) */
  telegraph?: string;
}

/** Tipos de hazard por bioma */
export type HazardKind =
  | 'none'
  | 'debris'
  | 'fog'
  | 'darkness'
  | 'electric'
  | 'mud'
  | 'spikes'
  | 'lava'
  | 'lowGravity';

/** Tipos de objetivo por fase */
export type ObjectiveKind = 'clear' | 'survive' | 'destroy' | 'protect' | 'reach' | 'collect';

/** Uma zona de objetivo posicionada no mapa (ninho, ponto de extração, NPC) */
export interface ObjectiveZone {
  /** Posição no mapa em pixels */
  x: number;
  y: number;
  /** HP do objetivo (ninhos e barreiras) */
  health?: number;
  /** Índice do NPC VIP quando objective = protect */
  npcIndex?: number;
  /** Raio de alcance quando objective = reach */
  radius?: number;
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
  /**
   * Quantos mutantes entram na onda, quando `mutant` faz parte de `enemyTypes`.
   * A cota é separada do total: o mutante não é "mais um inimigo", ele
   * substitui vários. Sem este campo a fase mostraria 4 inimigos comuns.
   */
  mutantsPerWave?: number;
  /** Número total de ondas na fase */
  waves: number;
  /**
   * Quantos corpos entram por célula de spawn (P0-2, Ponte). 1 = o spawner
   * clássico, um por vez; 2–3 = a onda entra em grupo e o jogador enfrenta
   * um bloco, não uma fila. A cota total da onda NÃO muda.
   */
  spawnGroup?: number;
  /** Chave do mapa em `maps.ts` */
  map: string;
  /** Hazard do bioma */
  hazard: HazardKind;
  /** Objetivo da fase */
  objective: ObjectiveKind;
  /**
   * Multiplicador de stats dos inimigos da fase (1 = sem ajuste).
   *
   * A rampa de dificuldade vem do número de ondas; este campo só corrige os
   * tipos que fogem dela. Ver `balance.test.ts` para a curva medida.
   */
  difficulty?: number;
  /** Alvo numérico do objetivo (segundos, quantidade de ninhos, etc.) */
  objectiveTarget: number;
  /** Chave do tipo de inimigo boss desta fase, se houver */
  boss?: string;
  /**
   * Fase de COLETA (H2, a Fábrica do Rogério — "essa fase será destinada a
   * coleta de recursos. Os zumbis droparão mais coisas e com mais
   * facilidade"): os drops e moedas pagam mais, e a dificuldade das fases
   * SEGUINTES compensa (o texto do dono pede os dois lados).
   */
  coleta?: boolean;
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
  /** Velocidade dos projéteis disparados */
  bulletSpeed?: number;
  /** Indica se é um chefe */
  isBoss?: boolean;
  /** Indica se possui armadura (forma hexagonal) */
  armor?: boolean;
  /**
   * Indica que o inimigo caça o NPC protegido em vez do jogador.
   * Só o objetivo `protect` usa; sem isso o NPC é só alguém que foge de todo
   * mundo por igual e o jogador não tem agência nenhuma no objetivo.
   */
  huntsNpc?: boolean;
  /**
   * Mutante: lento, muita vida, dano alto. Aparece em número baixo no lugar de
   * encher a onda de inimigos comuns. O spawner usa a flag para reservar a cota
   * mutantsPerWave em vez de contar no total da onda.
   */
  isMutant?: boolean;
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
  /**
   * Forma do projétil: `bullet` (cartucho de agente), `slime` (gosma de
   * recusante), `shard` (lasca de cristal), `ember` (brasa). Padrão `bullet`.
   * Um zumbi nunca empunha arma — pose e sprite seguem este campo.
   */
  projectileKind?: 'bullet' | 'slime' | 'shard' | 'ember' | 'spark' | 'vomit' | 'rad';
  /** Padrão de ataque data-driven (apenas bosses) */
  pattern?: BossPatternStep[];
  /** Nome exibido na barra de boss */
  bossName?: string;
  /** Grito de ENTRADA: o que ele grita ao aparecer (barra de boss, M5) */
  entryShout?: string;
  /** Fala de MORTE: o que a barra de boss mostra quando ele cai (M5) */
  deathLine?: string;
  /** Duração da telegrafia antes de uma ação (segundos) */
  telegraph?: number;
}

/** Estados possíveis do ciclo de vida do jogo */
export type GameStateType = 'menu' | 'playing' | 'shop' | 'gameover' | 'paused' | 'credits';
