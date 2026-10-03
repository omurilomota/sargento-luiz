/**
 * src/systems/sprites.ts
 *
 * Cache de sprites do pack Kenney Top-down Shooter (CC0).
 *
 * Os personagens têm 6 poses (`stand`/`hold`/`gun`/`machine`/`reload`/
 * `silencer`) e as armas têm 3 classes visuais de cano. Os tiles do pack têm
 * numeração com buracos (não existem tile_054, tile_081, tile_162…), então só
 * os números realmente existentes e curados visualmente são carregados.
 */

/** Cache de sprites carregadas */
const spriteCache: Map<string, HTMLImageElement> = new Map();

/** Se o sistema de sprites está habilitado */
let spritesEnabled = false;

/** Tipos de pose disponíveis */
export type Pose = 'stand' | 'hold' | 'gun' | 'machine' | 'reload' | 'silencer';

/** Prefixo de arquivo de cada personagem */
const CHARACTERS: Record<string, string> = {
  survivor: 'Survivor 1/survivor1',
  manBlue: 'Man Blue/manBlue',
  manBrown: 'Man Brown/manBrown',
  manOld: 'Man Old/manOld',
  hitman: 'Hitman 1/hitman1',
  soldier: 'Soldier 1/soldier1',
  robot: 'Robot 1/robot1',
  woman: 'Woman Green/womanGreen',
  zombie: 'Zombie 1/zoimbie1',
};

/**
 * Centro do corpo dentro da sprite, em pixels do arquivo.
 * Medido nos arquivos: o corpo ocupa x≈1..32 e o cano vai até x≈49, então
 * pivotar pela imagem inteira faria o personagem girar em volta do cano.
 */
const BODY_PIVOT_X = 17;
const BODY_PIVOT_Y = 21;

/** Tiles do Kenney que realmente existem e servem de chão (curadoria visual) */
export const TILE_NUMBERS = [
  1, 2, 3, 4, 13, 15, 17, 18, 19, 20, 31, 32, 35, 36, 37, 40, 41, 58, 59, 62, 63, 64, 67, 68, 76, 77, 79, 80, 86, 89, 90, 91, 92, 93, 95, 169, 178, 334, 340, 349, 350, 361, 362, 363, 376, 377, 398,
];

const BASE = 'assets/sprites/topdown-shooter/PNG';

/** As 6 poses que o pack tem por personagem */
export const POSES: Pose[] = ['stand', 'hold', 'gun', 'machine', 'reload', 'silencer'];

/** As 3 classes visuais de cano */
export const WEAPON_CLASSES = ['gun', 'machine', 'silencer'] as const;

/**
 * Nome do arquivo de tile no pack Kenney.
 * O pad é de 2 dígitos, não 3: `tile_01.png` até `tile_99.png` e `tile_100.png`
 * em diante. Com pad 3 todo tile de 1 a 99 dá 404 e o chão cai no fallback —
 * exatamente o que aconteceu antes deste teste existir.
 */
export function tileFileName(n: number): string {
  return `tile_${String(n).padStart(2, '0')}.png`;
}

/**
 * Mapeamento de tipos de inimigo para o personagem do pack.
 * Exportado para o teste de asset: um tipo sem entrada aqui aparece com o sprite
 * do zumbi, sem aviso — foi assim que os 9 chefes viraram zumbis.
 */
export const ENEMY_CHARACTER: Record<string, string> = {
  grunt: 'zombie',
  runner: 'manBrown',
  tank: 'manOld',
  bat: 'zombie',
  robot: 'robot',
  drone: 'robot',
  slime: 'zombie',
  lavaSlime: 'zombie',
  mosquito: 'zombie',
  knight: 'soldier',
  archer: 'hitman',
  mage: 'woman',
  fireElemental: 'manBrown',
  magmaGolem: 'manOld',
  inferno: 'hitman',
  ufo: 'robot',
  asteroid: 'manOld',
  alien: 'zombie',
  frog: 'zombie',
  crystal: 'woman',
  spitter: 'zombie',

  // Os 9 chefes. Antes nenhum estava aqui, então os 9 caíam no fallback
  // 'zombie' e todo chefe do jogo era desenhado como um zumbi genérico — o
  // mesmo sprite do grunt, só maior. `survivor` é o jogador e nunca entra
  // aqui; sobram 7 personagens para 9 chefes, então dois compartilham.
  vigia: 'soldier',            // guarda de cidade em pé numa cidade que caiu
  alphaWolf: 'manBrown',       // a fera mais terrosa do pack
  crystalQueen: 'woman',       // mesma persona do cristal da Caverna
  sentinel: 'robot',           // a máquina da fábrica
  leviathan: 'manOld',         // criatura grande e velha do pântano
  reiMutante: 'hitman',        // o rei encapuzado
  infernoPrime: 'zombie',      // elemental apodrecido: verde e queimado
  mothership: 'manBlue',       // aço frio do vácuo
  nucleo: 'soldier',           // comando militar do bunker
};

/** NPCs e bots compartilham o mesmo pool de personagens */
export const NPC_CHARACTERS = ['survivor', 'manBlue', 'manOld', 'manBrown'];

/**
 * Monta a lista de caminhos a carregar.
 * @returns array de [chave, caminho]
 */
function buildSpriteList(): [string, string][] {
  const out: [string, string][] = [];
  for (const [charKey, prefix] of Object.entries(CHARACTERS)) {
    for (const pose of POSES) {
      out.push([`${charKey}_${pose}`, `${BASE}/${prefix}_${pose}.png`]);
    }
  }
  for (const w of WEAPON_CLASSES) {
    out.push([`weapon_${w}`, `${BASE}/weapon_${w}.png`]);
  }
  for (const n of TILE_NUMBERS) {
    out.push([`tile_${n}`, `${BASE}/Tiles/${tileFileName(n)}`]);
  }
  return out;
}

/** Habilita o sistema de sprites. */
export function enableSprites(): void {
  spritesEnabled = true;
}

/** Verifica se sprites estão habilitados. */
export function isSpritesEnabled(): boolean {
  return spritesEnabled;
}

/**
 * Carrega uma imagem como sprite.
 * @param key - chave única para o sprite
 * @param url - caminho da imagem
 * @returns Promise que resolve quando carregada
 */
export async function loadSprite(key: string, url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      spriteCache.set(key, img);
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Carrega todos os sprites do jogo.
 * @returns Promise que resolve quando todos carregados
 */
export async function loadAllSprites(): Promise<void> {
  const list = buildSpriteList();
  await Promise.all(list.map(([key, path]) => loadSprite(key, path)));
  spritesEnabled = spriteCache.size > 0;
}

/** Obtém uma sprite do cache. */
export function getSprite(key: string): HTMLImageElement | null {
  return spriteCache.get(key) || null;
}

/** Lista os caminhos de personagem referenciados pelo jogo (para teste de asset). */
export function characterFileExists(): string[] {
  const out: string[] = [];
  for (const prefix of Object.values(CHARACTERS)) {
    for (const pose of POSES) out.push(`${prefix}_${pose}.png`);
  }
  return out;
}

/** Lista os caminhos de arma referenciados pelo jogo (para teste de asset). */
export function weaponFileExists(): string[] {
  return WEAPON_CLASSES.map(w => `weapon_${w}.png`);
}

/** Personagem usado por um tipo de inimigo. */
export function getEnemyCharacter(enemyType: string): string {
  return ENEMY_CHARACTER[enemyType] || 'zombie';
}

/** Chave completa da sprite de um personagem numa pose. */
export function poseKey(character: string, pose: Pose): string {
  return `${character}_${pose}`;
}

/**
 * Desenha uma sprite mantendo o aspect ratio real, pivotada pelo centro do
 * corpo e girada para a direção de mira.
 *
 * Forçar um quadrado (`radius*2` × `radius*2`) em uma imagem de 51×43 achata o
 * personagem — foi o que deixou inimigos e player "esmagados" até aqui.
 *
 * @param ctx - contexto 2D
 * @param img - imagem da sprite
 * @param cx - centro X no mundo
 * @param cy - centro Y no mundo
 * @param bodySize - altura desejada do corpo em pixels
 * @param angle - ângulo de mira em radianos
 */
export function drawSpriteFit(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  cx: number,
  cy: number,
  bodySize: number,
  angle: number
): void {
  const iw = (img as HTMLImageElement).naturalWidth || (img as HTMLImageElement).width;
  const ih = (img as HTMLImageElement).naturalHeight || (img as HTMLImageElement).height;
  if (!iw || !ih) return;
  const scale = bodySize / ih;
  const w = iw * scale;
  const h = ih * scale;
  const px = (BODY_PIVOT_X / iw) * w;
  const py = (BODY_PIVOT_Y / ih) * h;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.drawImage(img, -px, -py, w, h);
  ctx.restore();
}

/** Limpa o cache de sprites. */
export function clearSprites(): void {
  spriteCache.clear();
}
