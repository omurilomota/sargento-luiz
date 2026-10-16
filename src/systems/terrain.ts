/**
 * Prerender do terreno com tint por bioma.
 *
 * Desenhar 30×20 tiles por frame seria ~600 `drawImage`/frame. Aqui o terreno
 * inteiro é desenhado UMA vez num canvas offscreen do tamanho do mapa, recebe
 * uma dessaturação + `multiply` com a cor do bioma e um leve `overlay` de
 * granulação, e por frame o jogo faz um único `drawImage` deslocado pela câmera.
 *
 * Piso e parede vêm exclusivamente do pack Top Down Dungeon (textura real com
 * rejunte). Não há desenho procedural no terreno: não há `fillRect`/`strokeRect`
 * inventando tijolo, laje ou textura de bioma — apenas o tile do pack, o
 * contorno da parede e os objetos (decor, hazard) que já são sprites do pack.
 */

import { Biome, BIOMES, CELL_SIZE } from '../maps';
import { getSprite, DUNGEON_COUNT } from './sprites';

/** Canvas offscreen do terreno já tintado (null antes do primeiro build) */
let prerendered: HTMLCanvasElement | null = null;
/** Chave do bioma do terreno já prerenderizado */
let prerenderedKey = '';

/** Cache de tiles já dessaturados e tingidos, por (número do Kenney, cor do bioma) */
const floorTileCache = new Map<string, HTMLCanvasElement>();

/** Desenha o mapa inteiro num offscreen e aplica o tint do bioma. */
export function buildTerrain(biome: Biome, cells: string[][]): HTMLCanvasElement {
  const cols = cells[0]?.length ?? 0;
  const rows = cells.length;
  const off = document.createElement('canvas');
  off.width = cols * CELL_SIZE;
  off.height = rows * CELL_SIZE;
  const c = off.getContext('2d')!;

  // base
  c.fillStyle = biome.floor;
  c.fillRect(0, 0, off.width, off.height);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ch = cells[row][col];
      const px = col * CELL_SIZE;
      const py = row * CELL_SIZE;
      switch (ch) {
        case '#': drawWall(c, px, py, biome, cells, col, row); break;
        case ',': drawDecor(c, px, py, biome, (col * 7 + row * 13) % 4); break;
        case '^': drawHazard(c, px, py, biome, (col * 7 + row * 13) % 4); break;
        // estrada da Rodovia: '=' asfalto liso, ':' faixa de pista, '-'
        // linha de borda no topo, '_' linha de borda na base
        case '=': case ':': case '-': case '_':
          drawAsphalt(c, px, py, biome, col, row, ch);
          break;
        default: drawFloor(c, px, py, biome, col, row); break;
      }
    }
  }

  applyTint(c, off, biome);
  prerendered = off;
  prerenderedKey = biome.key;
  return off;
}

/**
 * Piso: tile do Kenney dessaturado e multiplicado pela cor do bioma.
 *
 * O multiply pela cor do chão é o que resolve o conflito "pack saturated e
 * claro" × "paleta sóbria": o tile continua dando textura, mas o valor e o tom
 * saem do bioma. Sem ele, o chão do Kenney brilha e o jogador lê o piso como
 * objeto em vez de espaço.
 */
/**
 * Estrada da Rodovia: asfalto autoral (`tools/gen_assets_estrada.py`, CC0).
 *
 * '=' corpo liso (variante por hash), ':' faixa de pista, '-' linha de borda
 * no topo e '_' na base. O material é fixo: `biome.dungeonFloor` da Rodovia é
 * o acostamento de pedra, então a estrada não pode sair do material do bioma.
 *
 * Sem a lavagem de 62% que `drawFloor` aplica: ela existe para domar o
 * rejunte ASSADO do pack, e o asfalto autoral não tem borda (costura medida
 * ~0 pelo gerador, com o mesmo portão do tiles.test.ts). Lavar aqui
 * achataria a faixa — que é o que lê "estrada".
 */
function drawAsphalt(
  c: CanvasRenderingContext2D, px: number, py: number, biome: Biome,
  col: number, row: number, ch: string,
): void {
  let material = 'piso_asfalto';
  let variant = varianteDeChao(col, row);
  if (ch === ':') variant = 0, material = 'piso_faixa';
  if (ch === '-') variant = 0, material = 'piso_borda';
  if (ch === '_') variant = 1, material = 'piso_borda';
  const tile = getDungeonTile(material, variant, biome.tint);
  // tile não carregou: fica a cor base pintada em buildTerrain, sem desenho
  if (tile) c.drawImage(tile, px, py, CELL_SIZE, CELL_SIZE);
}

function drawFloor(c: CanvasRenderingContext2D, px: number, py: number, biome: Biome, col: number, row: number): void {
  // O chão vem exclusivamente do pack Top Down Dungeon (textura real com
  // rejunte). Sem fallback para tiles chapados do Kenney nem desenho
  // procedural: se o tile não carregou, fica a cor base já pintada em
  // buildTerrain — não inventa forma no código.
  const dngeon = getDungeonTile(biome.dungeonFloor, varianteDeChao(col, row), biome.tint);
  if (dngeon) {
    c.drawImage(dngeon, px, py, CELL_SIZE, CELL_SIZE);
    // O rejunte do pack é forte demais na escala 64px: sem esta lavagem o chão
    // lê como azulejo de banheiro e compete com os inimigos. Alpha baixo e
    // uma única passada de escurecimento tiram o excesso — o traço da textura
    // continua lá, só que discreto.
    c.fillStyle = biome.floor;
    c.globalAlpha = 0.62;
    c.fillRect(px, py, CELL_SIZE, CELL_SIZE);
    c.globalAlpha = 1;
  }
}

/**
 * Variação de tile sem período curto.
 *
 * O `(col*31 + row*17) % n` original tinha período lcm(30,20)/… baixo demais e
 * a parede `(col*5 + row*3) % 4` repetia um bloco 4x4 visível. Aqui o termo
 * `col*row` embaralha a sequência sem período curto perceptível.
 */
function varianteDeChao(col: number, row: number): number {
  // hash cru; o módulo por material entra em getDungeonTile (a contagem por
  // material vem do número de fills sem costura que o pack oferece)
  return Math.abs(col * 7 + row * 13 + ((col * row * 3) % 11));
}

/**
 * Chão decorativo: manchas largas de terra batida.
 * Sprite do Kenney aqui virava lixo espalhado — lê como entulho aleatório e
 * suja o gameplay. É variação de tom, não objeto.
 */
function drawDecor(c: CanvasRenderingContext2D, px: number, py: number, biome: Biome, variant: number): void {
  c.fillStyle = biome.floor;
  c.fillRect(px, py, CELL_SIZE, CELL_SIZE);

  // decor de chão por bioma: um objeto do pack que resume o lugar —
  // entulho na Cidade, sucata na Fábrica, pedra no Castelo, placa no Espaço
  // e caixa no Bunker. Cada bioma novo recebeu o próprio objeto em vez de
  // cair no fallback procedural (`ellipse`).
  // J3c/J3d: listas por bioma de CHAVES de sprite — a variante da célula
  // escolhe. Mistura tiles do pack (tile_N) com AUTORAIS (prop_tocha/painel/
  // berco, gerados por gen_assets_cenografia.py — o pack não tem tocha nem
  // painel de estação; medido na auditoria T6, os objetos são caixa ou
  // cilindro). As escolhas erradas saíram: castelo 133 (quadrado bege 84%
  // saturação) → brasão + TOCHAS; espaco ganha o PAINEL da estação; o
  // bunker (NÚCLEO) ganha o BERÇO das biomaquinas.
  const spriteFor: Record<string, string[]> = {
    floresta: ['tile_181'],
    caverna: ['tile_264', 'tile_265', 'tile_238'],
    pantano: ['tile_320'],
    vulcao: ['tile_316', 'tile_319'],
    cidade: ['tile_292', 'tile_289'],
    fabrica: ['tile_180'],
    castelo: ['tile_312', 'prop_tocha_00', 'prop_tocha_01'],
    espaco: ['tile_333', 'prop_painel_00'],
    bunker: ['tile_129', 'prop_berco_00'],
    hospital: ['tile_156'],
    // Rodovia não entra nesta tabela: a faixa de asfalto do mapa dela usa os
    // caracteres próprios (`=`, `:`, `-`, `_`) e não o `,`. O tile 260 que
    // estava nesta linha era uma marca laranja/cinza do pack repetida em 77
    // células — lia como padrão, não como estrada, e foi escolhido por número
    // sem nunca ser aberto.
    trens: ['tile_180'],
    ponte: ['tile_238'],
    refinaria: ['tile_316'],
    subestacao: ['tile_264'],
    // 134 era o "avião de papel" da auditoria T6: o cais pede pedra/amarração
    porto: ['tile_317'],
  };
  const lista = spriteFor[biome.key];
  if (lista !== undefined && lista.length > 0) {
    const chave = lista[variant % lista.length];
    const img = getSprite(chave);
    if (img) {
      const s = CELL_SIZE * (0.5 + (variant % 2) * 0.2);
      c.drawImage(img, px + (CELL_SIZE - s) / 2, py + (CELL_SIZE - s) / 2, s, s);
      return;
    }
  }

  const tone = variant % 2 === 0 ? shade(biome.floor, 0.09) : shade(biome.floor, -0.09);
  c.fillStyle = tone;
  c.beginPath();
  c.ellipse(px + CELL_SIZE / 2, py + CELL_SIZE / 2, CELL_SIZE * 0.44, CELL_SIZE * 0.36, 0, 0, Math.PI * 2);
  c.fill();
}

/** Mancha irregular com seed: mesma célula sempre gera a mesma forma. */
function blobPath(c: CanvasRenderingContext2D, px: number, py: number, variant: number, rx: number, ry: number): void {
  const cx = px + CELL_SIZE / 2;
  const cy = py + CELL_SIZE / 2;
  c.beginPath();
  const n = 7;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const jitter = 0.72 + ((variant * 31 + i * 17) % 10) / 25;
    const x = cx + Math.cos(a) * rx * jitter;
    const y = cy + Math.sin(a) * ry * jitter;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.closePath();
}

/**
 * Sprite de hazard por tipo. Mesmo padrão das paredes: o tile cobre a célula
 * inteira e a cor continua vindo do `applyTint` do bioma. Por isso o mesmo
 * `320` serve tanto para névoa quanto para lama — o que separa é o piso de
 * baixo (floresta verde, pântano escuro), não o objeto. Quem nunca divide:
 * os tiles de debris (292/265/260) são entulho legível, e lava (316/319)
 * são os únicos discos incandescentes do pack.
 *
 * `spikes` e `electric` ficam de fora porque o pack não tem espinho, raio
 * nem fogo (524 tiles inspecionados). Eles usam o pack Tower Defense CC0
 * baixado, e não o fallback procedural.
 */
export const HAZARD_SPRITES: Record<string, number[]> = {
  debris: [292, 265, 260],
  fog: [320],
  mud: [260],
  lava: [316, 319],
  electric: [264],
  spikes: [268],
};
function drawHazard(c: CanvasRenderingContext2D, px: number, py: number, biome: Biome, variant: number): void {
  c.fillStyle = biome.floor;
  c.fillRect(px, py, CELL_SIZE, CELL_SIZE);

  // objeto do pack antes de qualquer forma procedural, na mesma escala das
  // paredes: cobre ~0.85 da célula, como a mancha antiga. O tile não carrega
  // em produção (fora de TILE_NUMBERS) cai no desenho de baixo.
  const hazardTiles = HAZARD_SPRITES[biome.hazard];
  if (hazardTiles) {
    const img = getSprite(`tile_${hazardTiles[variant % hazardTiles.length]}`);
    if (img) {
      const s = CELL_SIZE * 0.85;
      c.drawImage(img, px + (CELL_SIZE - s) / 2, py + (CELL_SIZE - s) / 2, s, s);
      return;
    }
  }

  const color = biome.hazardColor;
  switch (biome.hazard) {
    case 'spikes': {
      c.fillStyle = shade(color, -0.1);
      for (let i = 0; i < 4; i++) {
        const bx = px + 10 + i * 14;
        c.beginPath();
        c.moveTo(bx, py + CELL_SIZE - 12);
        c.lineTo(bx + 6, py + 14 + (variant % 2) * 6);
        c.lineTo(bx + 12, py + CELL_SIZE - 12);
        c.closePath();
        c.fill();
      }
      break;
    }
    case 'electric': {
      c.strokeStyle = color;
      c.lineWidth = 3;
      c.globalAlpha = 0.75;
      for (let i = 0; i < 2; i++) {
        const ox = px + 12 + i * 24 + (variant % 2) * 6;
        c.beginPath();
        c.moveTo(ox, py + 10);
        c.lineTo(ox - 6 + (variant % 3) * 4, py + CELL_SIZE / 2);
        c.lineTo(ox + 6, py + CELL_SIZE / 2 + 4);
        c.lineTo(ox, py + CELL_SIZE - 10);
        c.stroke();
      }
      c.globalAlpha = 1;
      break;
    }
    case 'lava': {
      c.fillStyle = shade(color, -0.35);
      blobPath(c, px, py, variant, CELL_SIZE * 0.42, CELL_SIZE * 0.34);
      c.fill();
      c.strokeStyle = color;
      c.lineWidth = 3;
      c.globalAlpha = 0.9;
      c.beginPath();
      c.moveTo(px + 10, py + CELL_SIZE / 2);
      c.lineTo(px + CELL_SIZE / 2 - 6, py + CELL_SIZE / 2 + (variant % 3) * 6 - 6);
      c.lineTo(px + CELL_SIZE / 2 + 8, py + CELL_SIZE / 2 - 4);
      c.lineTo(px + CELL_SIZE - 10, py + CELL_SIZE / 2 + 2);
      c.stroke();
      c.globalAlpha = 1;
      break;
    }
    case 'debris': {
      c.fillStyle = color;
      c.globalAlpha = 0.55;
      blobPath(c, px, py, variant, CELL_SIZE * 0.4, CELL_SIZE * 0.32);
      c.fill();
      c.globalAlpha = 1;
      c.fillStyle = shade(color, -0.3);
      for (let i = 0; i < 4; i++) {
        c.fillRect(px + ((variant * 13 + i * 11) % 44) + 8, py + ((variant * 7 + i * 17) % 40) + 10, 5, 4);
      }
      break;
    }
    case 'fog': {
      c.fillStyle = color;
      c.globalAlpha = 0.16;
      blobPath(c, px, py, variant, CELL_SIZE * 0.46, CELL_SIZE * 0.38);
      c.fill();
      c.globalAlpha = 0.1;
      blobPath(c, px, py, variant + 3, CELL_SIZE * 0.3, CELL_SIZE * 0.26);
      c.fill();
      c.globalAlpha = 1;
      break;
    }
    case 'mud': {
      c.fillStyle = shade(color, -0.35);
      c.globalAlpha = 0.7;
      blobPath(c, px, py, variant, CELL_SIZE * 0.44, CELL_SIZE * 0.36);
      c.fill();
      c.globalAlpha = 1;
      break;
    }
    case 'darkness':
    case 'lowGravity':
    case 'none':
      // caverna/espaco/bunker não têm marcação no chão: o overlay e a física
      // de baixa gravidade cuidam disso
      break;
    default: {
      c.fillStyle = color;
      c.globalAlpha = 0.5;
      blobPath(c, px, py, variant, CELL_SIZE * 0.42, CELL_SIZE * 0.34);
      c.fill();
      c.globalAlpha = 1;
    }
  }
}

/**
 * Parede: laje sólida e escura, com uma "face" iluminada no topo quando o
 * vizinho de cima é chão e contorno preto em todo contato com o chão.
 *
 * A leitura "isto bloqueia" precisa acontecer num relance, então a parede é
 * sempre bem mais escura que o piso e tem uma silhueta fechada — sem isso o
 * mapa vira um código de barras e o jogador não sabe onde pode andar.
 */
function drawWall(
  c: CanvasRenderingContext2D,
  px: number, py: number,
  biome: Biome,
  cells: string[][],
  col: number, row: number
): void {
  const isWall = (cc: number, rr: number): boolean =>
    rr < 0 || cc < 0 || rr >= cells.length || cc >= cells[0].length || cells[rr][cc] === '#';

  // sombra projetada no chão logo abaixo: separa o prédio do piso
  if (!isWall(col, row + 1)) {
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.fillRect(px + 4, py + CELL_SIZE, CELL_SIZE, 7);
  }

  // tom base por estilo de bioma, com variação de célula p/ não virar laje
  const v = (col * 13 + row * 7) % 3;
  const baseWall = biome.key === 'vulcao' ? shade(biome.wall, -0.12) : biome.wall;
  c.fillStyle = v === 0 ? baseWall : shade(baseWall, v === 1 ? 0.08 : -0.08);
  c.fillRect(px, py, CELL_SIZE, CELL_SIZE);

  // A parede vem exclusivamente do pack Top Down Dungeon (tijolo/rejunte de
  // verdade). Sem textura procedural por bioma: se o tile não carregou, fica
  // a cor base já pintada acima + o contorno que diz "isto bloqueia".
  const variante = (col * 7 + row * 13 + ((col * row) % 5)) % DUNGEON_COUNT.parede;
  const dngeonWall = tintTile(`dngeon_${biome.dungeonWall}_${variante}`, biome.wall);
  if (dngeonWall) {
    c.drawImage(dngeonWall, px, py, CELL_SIZE, CELL_SIZE);
  }
  drawWallOutline(c, px, py, col, row, isWall);
}

/**
 * Silhueta fechada nos contatos com o chão para o bloco 3D do pack Top Down
 * Dungeon. O bloco já nasce com topo claro, face frontal e junta sombreados;
 * somar cumeeira/claraboia/faixa de topo (o `drawWallEdges` cheio) empilhava
 * uma SEGUNDA altura por cima da assada — o "parede duplicada" da auditoria.
 * Fica só o que a parede ainda pede: o contorno que diz "isto bloqueia".
 */
function drawWallOutline(
  c: CanvasRenderingContext2D,
  px: number, py: number,
  col: number, row: number,
  isWall: (cc: number, rr: number) => boolean
): void {
  c.strokeStyle = 'rgba(0,0,0,0.75)';
  c.lineWidth = 3;
  c.beginPath();
  if (!isWall(col, row - 1)) { c.moveTo(px - 1.5, py - 1.5); c.lineTo(px + CELL_SIZE + 1.5, py - 1.5); }
  if (!isWall(col, row + 1)) { c.moveTo(px - 1.5, py + CELL_SIZE + 1.5); c.lineTo(px + CELL_SIZE + 1.5, py + CELL_SIZE + 1.5); }
  if (!isWall(col - 1, row)) { c.moveTo(px - 1.5, py - 1.5); c.lineTo(px - 1.5, py + CELL_SIZE + 1.5); }
  if (!isWall(col + 1, row)) { c.moveTo(px + CELL_SIZE + 1.5, py - 1.5); c.lineTo(px + CELL_SIZE + 1.5, py + CELL_SIZE + 1.5); }
  c.stroke();
}

/**
 * Borda da parede: apenas o contorno fechado que diz "isto bloqueia".
 *
 * O tile do Top Down Dungeon já traz o volume 3D assado (topo claro, frente
 * escura, junta sombreados). Desenhar cumeeira, claraboia, beiral e face
 * superior POR CIMA do tile empilhava uma SEGUNDA altura — o "parede
 * duplicada" da auditoria. Agora `drawWallEdges` só faz o contorno, que é o
 * que separa a parede do chão e torna a leitura "isto bloqueia" instantânea.
 *
 * Chamado quando o tile do dungeon não carrega: apenas o contorno, sem
 * textura procedural.
 */
function drawWallEdges(
  c: CanvasRenderingContext2D,
  px: number, py: number,
  biome: Biome,
  cells: string[][],
  col: number, row: number,
  isWall: (cc: number, rr: number) => boolean
): void {
  drawWallOutline(c, px, py, col, row, isWall);
}

/**
 * Aplica o tint do bioma: multiply com a cor + overlay de granulação.
 * É o que resolve o conflito "Kenney flat e saturado" × "paleta sóbria".
 */
function applyTint(c: CanvasRenderingContext2D, off: HTMLCanvasElement, biome: Biome): void {
  c.save();
  c.globalCompositeOperation = 'saturation';
  c.fillStyle = '#808080';
  c.fillRect(0, 0, off.width, off.height);

  c.globalCompositeOperation = 'multiply';
  c.fillStyle = biome.tint;
  c.fillRect(0, 0, off.width, off.height);

  c.globalCompositeOperation = 'overlay';
  c.globalAlpha = biome.grainAlpha;
  c.fillStyle = biome.grain;
  c.fillRect(0, 0, off.width, off.height);

  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  c.restore();
}

/**
 * Versão tingida de um tile do pack Top Down Dungeon (chave `dngeon_<mat>_<n>`).
 *
 * O tint é o mesmo pipeline do Kenney — `saturation` para tirar a saturação e
 * `multiply` pela cor do bioma. É o que permite o material ter textura de
 * verdade sem virar o "pack saturated e claro brigando com a paleta sóbria".
 */
function getDungeonTile(material: string, variant: number, biomeColor: string): HTMLCanvasElement | null {
  const key = `dngeon_${material}_${variant % (DUNGEON_COUNT.piso[material] ?? 1)}`;
  return tintTile(key, biomeColor);
}

/** Cacheia a versão dessaturada e tingida de um tile, por chave de sprite. */
function tintTile(spriteKey: string, biomeColor: string): HTMLCanvasElement | null {
  const key = `${spriteKey}:${biomeColor}`;
  const cached = floorTileCache.get(key);
  if (cached) return cached;
  const img = getSprite(spriteKey);
  if (!img) return null;
  const off = document.createElement('canvas');
  off.width = CELL_SIZE;
  off.height = CELL_SIZE;
  const c = off.getContext('2d')!;
  c.drawImage(img, 0, 0, CELL_SIZE, CELL_SIZE);
  c.globalCompositeOperation = 'saturation';
  c.fillStyle = '#808080';
  c.fillRect(0, 0, CELL_SIZE, CELL_SIZE);
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = biomeColor;
  c.fillRect(0, 0, CELL_SIZE, CELL_SIZE);
  c.globalCompositeOperation = 'source-over';
  floorTileCache.set(key, off);
  return off;
}

/**
 * Desenha o terreno já tintado.
 * Chamado de dentro do espaço transladado pela câmera: o destino é a própria
 * coordenada de mundo e o canvas recorta o que cai fora da viewport.
 *
 * Não centraliza nada aqui. A câmera já centraliza quando o mundo é menor que
 * a viewport (`clampToWorld` devolve um valor negativo), então centralizar
 * também aqui aplicava o offset duas vezes: numa janela de 2560px o mapa de
 * 1920px aparecia deslocado 320px para a direita, com a borda esquerda vazia e
 * a direita cortada.
 */
export function drawTerrain(ctx: CanvasRenderingContext2D): void {
  if (!prerendered) return;
  ctx.drawImage(prerendered, 0, 0);
}

/** Invalida o terreno prerenderizado (troca de fase). */
export function clearTerrain(): void {
  prerendered = null;
  prerenderedKey = '';
}

// ─── Fundo das cutscenes ────────────────────────────────────────

/** Cache dos fundos de cutscene, por (cena, tamanho da tela). */
const backdropCache = new Map<string, HTMLCanvasElement | null>();

interface CenaCutscene {
  /** Bioma que empresta o piso e o tom ao fundo. */
  bioma: string;
  /** Tiles que se erguem do chão, na ordem em que aparecem. */
  objetos: number[];
  /** Tamanho do objeto em relação ao tile de 64px. */
  escala: number;
  /** Estrelas no céu, com sprite de partícula (só o Espaço tem). */
  estrelas?: number;
  /** Objetos menores e mais altos: a segunda fileira dá profundidade. */
  longe?: number[];
  /** Teto de pedra no alto: a Caverna é fechada. */
  teto?: boolean;
  /**
   * Alpha do fundo na tela. O padrão 0.15 é o véu para a cena ficar atrás do
   * texto; o Espaço é um céu escuro e some com ele (medido no harness: as
   * estrelas não apareciam), então ali o céu entra mais forte.
   */
  veu?: number;
  /** Brilho quente no pé da tela, na cor do bioma (Vulcão). */
  brasa?: string;
}

/**
 * A cena de cada capítulo, com o tile do próprio bioma.
 *
 * Os objetos saem do que o jogo já usa: copa e arbusto da Floresta (208/209
 * são as duas metades da mesma copa, 183 o arbusto, 186 o de outono), cristal
 * da Caverna (238/239/264), placa e detrito do Espaço (333/264) e a lava do
 * Vulcão (316/319 — os únicos discos incandescentes do pack).
 *
 * As 5 de §2.2b (antes fundo chapado) seguem o mesmo critério: entulho da
 * Cidade no PRÓLOGO (292/265/260), sucata e engradado da Fábrica (180/129) com
 * o anel elétrico (264), lama e folhagem do Pântano (320/134), pedra e espinho
 * do Castelo (133/268) e os caixotes do Bunker no EPÍLOGO (129/156/158). A
 * fase 8 abre o EPÍLOGO, não uma cena "BUNKER": o título é o que `story.ts`
 * passa (FASE_PARA_CUTSCENE), e um nome que não bate com ele nunca desenha.
 */
const CENAS_CUTSCENE: Record<string, CenaCutscene> = {
  // As copas são redondas (183 verde, 186 de outono). As metades 208/209 ficam
  // de fora: sozinhas, cada uma lê como uma copa cortada pela metade.
  FLORESTA: { bioma: 'floresta', objetos: [183, 186, 183, 186, 183], escala: 1.8, longe: [186, 183, 186] },
  CAVERNA: { bioma: 'caverna', objetos: [238, 264, 239, 238, 264], escala: 1.1, teto: true },
  'ESPAÇO': { bioma: 'espaco', objetos: [333, 333, 264], escala: 1, estrelas: 34, veu: 0.4 },
  'VULCÃO': { bioma: 'vulcao', objetos: [319, 316, 319, 320], escala: 1.4, brasa: '#c46a3a' },
  'PRÓLOGO': { bioma: 'cidade', objetos: [292, 265, 260, 292, 265], escala: 1.2, longe: [265, 260, 292] },
  'FÁBRICA': { bioma: 'fabrica', objetos: [180, 129, 180, 264, 180], escala: 1.3, longe: [129, 180, 129] },
  'PÂNTANO': { bioma: 'pantano', objetos: [320, 260, 320, 260], escala: 1.1, longe: [260, 320, 260] },
  'CASTELO': { bioma: 'castelo', objetos: [268, 133, 268, 133, 268], escala: 1.2, longe: [133, 268, 133] },
  'EPÍLOGO': { bioma: 'bunker', objetos: [129, 156, 130, 158, 129], escala: 1.3, longe: [130, 129, 156] },
  // A abertura da fase 9 é o mesmo galpão do epílogo, visto antes da luta:
  // mesmo bioma, mesma engradagem, mais longe — é o mesmo lugar, outra vez.
  // Sem esta entrada `buildCutsceneBackdrop` devolve `null` e a cena abre preta.
  'NÚCLEO-CENTRAL': { bioma: 'bunker', objetos: [129, 156, 130, 158, 129], escala: 1.5, longe: [130, 129, 156] },
  // ─── As 7 fases novas (2026-10-14) ────────────────────────────────
  // Cada cena pisa no CHÃO do próprio bioma (o material é o que diferencia:
  // asfalto, madeira de hospital, metal de pátio) e levanta os objetos das
  // cenas vizinhas já vistas. Os índices precisam passar pelo olho da revisão
  // de imagem — são âncoras semânticas, não curadoria final.
  'RODOVIA': { bioma: 'rodovia', objetos: [260, 292, 265, 260], escala: 1.2, longe: [265, 260, 292] },
  'HOSPITAL': { bioma: 'hospital', objetos: [129, 156, 130, 158], escala: 1.2, longe: [130, 129, 156] },
  'PÁTIO DE TRENS': { bioma: 'trens', objetos: [180, 129, 180, 264], escala: 1.3, longe: [129, 180, 129] },
  'PONTE': { bioma: 'ponte', objetos: [238, 264, 239, 238], escala: 1.2, longe: [264, 238, 264], veu: 0.3 },
  'REFINARIA': { bioma: 'refinaria', objetos: [319, 316, 319, 320], escala: 1.4, brasa: '#c46a3a' },
  'SUBESTAÇÃO': { bioma: 'subestacao', objetos: [180, 264, 264, 180], escala: 1.2, longe: [264, 180, 264] },
  'PORTO': { bioma: 'porto', objetos: [260, 292, 292, 260], escala: 1.2, longe: [292, 260, 292] },
};

/** Alpha com que o renderer desenha a cena (o véu é parte do fundo). */
export function cutsceneVeil(title: string): number {
  return CENAS_CUTSCENE[title]?.veu ?? 0.15;
}

/**
 * Fundo da cena de cutscene, montado com tile do pack.
 *
 * Era o último lugar do jogo onde a arte era código (`arc`/`fillRect` no
 * renderer): árvore em círculo, estalactite em triângulo, estrela em ponto.
 * Aqui a cena usa o mesmo piso com textura e os mesmos objetos do bioma — e o
 * véu de alpha baixo do renderer deixa tudo atrás do texto.
 *
 * Prerenderizado uma vez por (cena, tamanho) porque o renderer chama isto a
 * cada frame. Sem `applyTint`: a dessaturação existe para varrer uma tela
 * inteira de chão saturado, e nos objetos ela apagaria o desenho.
 */
export function buildCutsceneBackdrop(title: string, width: number, height: number): HTMLCanvasElement | null {
  const cena = CENAS_CUTSCENE[title];
  if (!cena) return null;
  const chave = `${title}:${width}x${height}`;
  const cacheado = backdropCache.get(chave);
  if (cacheado !== undefined) return cacheado;

  const biome = BIOMES[cena.bioma];
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  const c = off.getContext('2d')!;

  /** Piso do bioma, no mesmo material e com a mesma lavagem do terreno. */
  const piso = (px: number, py: number, col: number, row: number, alpha: number) => {
    const dngeon = getDungeonTile(biome.dungeonFloor, varianteDeChao(col, row), biome.tint);
    if (dngeon) {
      c.drawImage(dngeon, px, py, CELL_SIZE, CELL_SIZE);
      c.fillStyle = biome.floor;
      c.globalAlpha = alpha;
      c.fillRect(px, py, CELL_SIZE, CELL_SIZE);
      c.globalAlpha = 1;
      return;
    }
    c.fillStyle = biome.floor;
    c.fillRect(px, py, CELL_SIZE, CELL_SIZE);
  };

  // Chão no pé da tela (22%): a cena tem onde pisar.
  const topo = height - Math.round(height * 0.22);
  for (let py = topo; py < height; py += CELL_SIZE) {
    for (let px = 0; px < width; px += CELL_SIZE) {
      piso(px, py, px / CELL_SIZE, (py - topo) / CELL_SIZE, 0.62);
    }
  }

  // A Caverna é fechada: pedra em cima também.
  if (cena.teto) {
    const alturaTeto = Math.round(height * 0.1);
    for (let py = 0; py < alturaTeto; py += CELL_SIZE) {
      for (let px = 0; px < width; px += CELL_SIZE) {
        piso(px, py, px / CELL_SIZE, py / CELL_SIZE, 0.74);
      }
    }
  }

  // Brilho do Vulcão: atmosfera, não objeto — entra na cor do bioma.
  if (cena.brasa) {
    const g = c.createRadialGradient(width / 2, height, 0, width / 2, height, height * 0.55);
    g.addColorStop(0, cena.brasa);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    c.globalAlpha = 0.45;
    c.fillStyle = g;
    c.fillRect(0, 0, width, height);
    c.globalAlpha = 1;
  }

  // Estrelas do Espaço: sprite de partícula em ponto pequeno. Antes era
  // `ctx.arc()` de raio 1 — o céu era o único desenho do jogo sem asset.
  if (cena.estrelas) {
    for (let i = 0; i < cena.estrelas; i++) {
      const brilha = i % 5 === 0;
      const img = getSprite(`fx_${brilha ? 'flare_01' : `spark_0${(i % 5) + 1}`}`);
      if (!img) break;
      const tam = brilha ? 13 : 5;
      const x = (((i * 977 + 61) % 1000) / 1000) * (width - tam);
      const y = (((i * 613 + 29) % 1000) / 1000) * (height * 0.7);
      c.drawImage(img, x, y, tam, tam);
    }
  }

  // Objetos sobre a faixa de chão. Posição determinística (sem `Math.random`):
  // a mesma cena em toda partida, que é o que um fundo de cutscene precisa.
  const linhaDeObjetos = (tiles: number[], escala: number, linhaY: number, variacao: number) => {
    const n = tiles.length;
    tiles.forEach((tile, i) => {
      const img = getSprite(`tile_${tile}`);
      if (!img) return;
      const tam = CELL_SIZE * escala * (0.85 + ((i * 37) % 30) / 100);
      const x = (width * (i + 0.5)) / n - tam / 2 + (((i * 53) % 40) - 20) * variacao;
      const y = linhaY - tam * 0.6 + ((i * 29) % 16);
      c.drawImage(img, x, y, tam, tam);
    });
  };

  // Fileira de trás primeiro: ela é o fundo da fileira da frente.
  if (cena.longe) linhaDeObjetos(cena.longe, cena.escala * 0.62, topo - CELL_SIZE * 0.5, 0.5);
  linhaDeObjetos(cena.objetos, cena.escala, topo, 1);

  backdropCache.set(chave, off);
  return off;
}

/**
 * Escurece ou clareia uma cor hex em `amount` (-1..1).
 *
 * O resultado é limitado a 0..255 por canal: sem isso, um `amount` fora da faixa
 * (ninguém chama hoje, mas é uma função compartilhada) estoura o canal e o
 * `| << 16` devolve uma cor completamente diferente em vez de uma cor extrema.
 */
export function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  if (amount >= 0) {
    r = r + (255 - r) * amount;
    g = g + (255 - g) * amount;
    b = b + (255 - b) * amount;
  } else {
    const k = 1 + amount;
    r = r * k;
    g = g * k;
    b = b * k;
  }
  const limita = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  r = limita(r);
  g = limita(g);
  b = limita(b);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
