/**
 * src/systems/props.ts
 *
 * Caixotes, barris e árvores: geometria viva sobre o terreno.
 * Barris explodem em cadeia; caixotes soltam moedas; a árvore é a única que
 * bloqueia passagem — e não morre, porque é o bioma, não cobertura.
 * São poucos e mudam, então são desenhados por frame por cima do terreno
 * prerenderizado.
 */

import { CELL_SIZE } from '../maps';
import { HazardKind } from '../types';
import { PALETTE } from '../core/palette';
import { getSprite } from './sprites';
import { charAt, setBlockers } from './tilemap';

/**
 * Sprite de prop por tipo. Mesmo padrão das paredes: o tile cobre o corpo e
 * a cor do bioma (`propCrate`/`propBarrel` do mapa) continua vindo do tint.
 * Por isso os mesmos 5 caixotes do pack servem aos 9 biomas.
 *
 * `barrel` usa os tiles 505-510 do pack Kenney (barril com cintas), que
 * substituem o desenho procedural (regra 15: visual vem de asset).
 */
export const PROP_SPRITES: Record<'crate' | 'nest' | 'barrel', number[]> = {
  crate: [129, 130, 156, 157, 158],
  nest: [181, 182, 183],
  barrel: [505, 506, 507, 508, 509, 510],
};

/** Tinta um sprite do pack com a cor do bioma. Offscreen por prop vivo. */
function tintSprite(img: HTMLImageElement, color: string, size: number): HTMLCanvasElement {
  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const c = off.getContext('2d')!;
  c.drawImage(img, 0, 0, size, size);
  c.globalCompositeOperation = 'saturation';
  c.fillStyle = '#808080';
  c.fillRect(0, 0, size, size);
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = color;
  c.fillRect(0, 0, size, size);
  c.globalCompositeOperation = 'source-over';
  return off;
}

export interface Prop {
  col: number;
  row: number;
  x: number;
  y: number;
  radius: number;
  /** `nest` é o objetivo destrutível do `destroy`; `rocket` é o alvo vivo do
   * `protect` do Castelo (as ondas atacam ELE, não um NPC que foge);
   * `capsula` é a cápsula BioGen caída na Fábrica: cenário da história,
   * cobre tiro mas não queima — ela só abre no roteiro (relato do Murilo:
   * "poderia ter a cápsula desde o início da fase");
   * `tree` é a árvore da Floresta e do Pântano: o ÚNICO prop que bloqueia
   * passagem (copa de 27px de raio, colisão de 20) e não morre — é a
   * identidade do bioma, não cobertura perecível. */
  kind: 'crate' | 'barrel' | 'nest' | 'rocket' | 'capsula' | 'tree' | 'carro';
  health: number;
  maxHealth: number;
  hitFlash: number;
  /** Tempo até o barril explodir quando encostado em fogo (0 = inerte) */
  fuse: number;
}

/** Tempo de pavio de um barril, em segundos. */
const BARREL_FUSE = 0.9;
/** Barris com o pavio aceso: distingue "ainde não queimou" de "nunca acendeu". */
const acesos = new Set<Prop>();

/** Escurece uma cor hex (local, para não puxar o módulo de terreno inteiro). */
function shadeCor(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const k = 1 + amount;
  const limita = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${((1 << 24) | (limita(((n >> 16) & 255) * k) << 16)
    | (limita(((n >> 8) & 255) * k) << 8) | limita((n & 255) * k)).toString(16).slice(1)}`;
}

const CRATE_HEALTH = 20;
const BARREL_HEALTH = 14;
const NEST_HEALTH = 90;
const BARREL_RADIUS = 26;
const BARREL_BLAST_RADIUS = 96;
const BARREL_BLAST_DAMAGE = 45;

/**
 * A árvore. RAIO DE COLISÃO 20 contra copa de 27 no sprite: o jogador entra
 * sob a folhagem da beirada e só o tronco segura — é o que faz a árvore parecer
 * árvore e não caixote grande. O raio fica abaixo de 32 (metade da célula) para
 * que o mutante (r 26) tenha passagem por qualquer lado que o mapa abrir.
 *
 * Vida infinita: a árvore é cenário do bioma, não loot. Tiro nela não derruba
 * (o flash acende, o dano some) e a conectividade do mapa não muda no meio da
 * onda. Caixote e barril continuam perecíveis — a diferença é o que dá à
 * Floresta o chão firme.
 */
const TREE_RADIUS = 20;
const TREE_HEALTH = Infinity;

/**
 * O carro abandonado (M6, J3b): carcaça do Kenney Racing Pack (CC0)
 * processada — rotação p/ pista horizontal + dessaturação de 45% (a cor
 * de fábrica leria como concessionária; o jogo pede abandonado). É
 * COBERTURA PERMANENTE: chassi não queima, não explode, não sai do lugar.
 */
const CARRO_RADIUS = 34;
const CARRO_HEALTH = Infinity;
const CARRO_SPRITES = ['prop_carro_00', 'prop_carro_01', 'prop_carro_02'];

/** Sprites autorais das árvores (CC0, ver tools/gen_assets_arvores.py). */
const TREE_SPRITES: Record<'viva' | 'morta', string[]> = {
  viva: ['prop_arvore_00', 'prop_arvore_01'],
  morta: ['prop_arvore_morta_00'],
};

/**
 * O foguete que o Castelo protege (decisão do dono de 2026-10-12: "o alvo do
 * protect é o FOGUETE com HP, não uma escolta"). 300 HP contra contato de 12
 * DPS por inimigo encostado e a flecha do arqueiro: dá para errar e chegar,
 * ao contrário do VIP de 50 HP que dois toques já derrubavam.
 */
const ROCKET_HEALTH = 300;
/** A cápsula não quebra com tiro: o número só precisa existir para o HUD. */
const CAPSULA_HEALTH = 9999;
const ROCKET_RADIUS = 30;
/** Dano por segundo de CADA inimigo encostado no foguete. */
export const ROCKET_CONTACT_DPS = 12;

let props: Prop[] = [];

/**
 * Cria os props a partir dos caracteres do mapa.
 */
export function initProps(cells: string[][]): void {
  props = [];
  acesos.clear();
  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[row].length; col++) {
      const ch = cells[row][col];
      if (ch !== 'c' && ch !== 'b' && ch !== 'N' && ch !== 'F' && ch !== 'T' && ch !== 'D' && ch !== 'A') continue;
      const isBarrel = ch === 'b';
      const isNest = ch === 'N';
      const isRocket = ch === 'F';
      const isTree = ch === 'T' || ch === 'D';
      const isCarro = ch === 'A';
      const hp = isRocket ? ROCKET_HEALTH : isNest ? NEST_HEALTH : isBarrel ? BARREL_HEALTH
        : isTree ? TREE_HEALTH : isCarro ? CARRO_HEALTH : CRATE_HEALTH;
      props.push({
        col, row,
        x: col * CELL_SIZE + CELL_SIZE / 2,
        y: row * CELL_SIZE + CELL_SIZE / 2,
        radius: isRocket ? ROCKET_RADIUS : isNest ? CELL_SIZE * 0.46 : isBarrel ? BARREL_RADIUS
          : isTree ? TREE_RADIUS : isCarro ? CARRO_RADIUS : CELL_SIZE * 0.38,
        kind: isRocket ? 'rocket' : isNest ? 'nest' : isBarrel ? 'barrel'
          : isTree ? 'tree' : isCarro ? 'carro' : 'crate',
        health: hp,
        maxHealth: hp,
        hitFlash: 0,
        fuse: 0,
      });
    }
  }
  // A árvore é o único prop que segura passagem, então quem colide precisa
  // saber onde elas estão. O registro é refeito a cada fase junto com o mapa.
  setBlockers(getBlockingProps());
}

/**
 * A cápsula BioGen caída no pátio da Fábrica — existe DESDE O INÍCIO da fase
 * (relato do Murilo: "poderia ter a cápsula desde o início"). Cobre tiro
 * como cobertura, não toma dano: ela abre no roteiro, na hora da virada.
 */
export function spawnCapsula(x: number, y: number): void {
  props.push({
    col: Math.floor(x / CELL_SIZE), row: Math.floor(y / CELL_SIZE),
    x, y,
    radius: CELL_SIZE * 0.55,
    kind: 'capsula',
    health: CAPSULA_HEALTH,
    maxHealth: CAPSULA_HEALTH,
    hitFlash: 0,
    fuse: 0,
  });
}

/** Remove a cápsula (o roteiro abriu ela — o que sobrou voou na explosão). */
export function consumirCapsula(): Prop | undefined {
  const idx = props.findIndex(p => p.kind === 'capsula');
  if (idx < 0) return undefined;
  return props.splice(idx, 1)[0];
}

/** Lista os ninhos (objetivos destrutíveis) ainda de pé. */
export function getNests(): Prop[] {  return props.filter(p => p.kind === 'nest' && p.health > 0);
}

/** O foguete do Castelo ainda de pé, se o mapa trouxe um (char `F`). */
export function getRocket(): Prop | undefined {
  return props.find(p => p.kind === 'rocket' && p.health > 0);
}

/**
 * O foguete do mapa, vivo OU derrubado. O HUD não pode trocar o rótulo de
 * "PROTEGER O FOGUETE" para "SOBREVIVENTE" no frame em que ele cai.
 */
export function getAnyRocket(): Prop | undefined {
  return props.find(p => p.kind === 'rocket');
}

export function getProps(): Prop[] {
  return props;
}

/**
 * Props que SEGURAM passagem. Só a árvore: caixote e barril são cobertura de
 * tiro, não parede — andar por cima deles é o jogo de sempre, e transformá-los
 * em obstáculo mudaria todas as 16 fases de uma vez.
 */
export function getBlockingProps(): Prop[] {
  // carro bloqueia como árvore: cobertura permanente que a IA e o BFS
  // precisam ver (o mapaValidation conta os DOIS como parede)
  return props.filter(p => (p.kind === 'tree' || p.kind === 'carro') && p.health > 0);
}

export function clearProps(): void {
  props.length = 0;
  acesos.clear();
}

/**
 * Se o prop desmorona com o primeiro tiro.
 *
 * Só o entulho da Cidade em Ruínas: lá o prop é entulho de estrutura caída, e
 * ruína não aguenta tiro. Nas outras fases o prop é madeira e metal, que aguentam
 * — a diferença é o que dá à Cidade a identidade de "a cobertura aqui também é
 * perecível", já que a cobertura em si (segurar tiro) vale em toda fase.
 */
export function collapsesOnHit(hazard: HazardKind): boolean {
  return hazard === 'debris';
}

/** Faz o prop receber dano. Retorna true se foi destruído. */
export function damageProp(p: Prop, amount: number): boolean {
  p.health -= amount;
  p.hitFlash = 0.12;
  if (p.health <= 0) {
    p.health = 0;
    return true;
  }
  return false;
}

/** Acende o pavio de um barril. */
export function igniteBarrel(p: Prop): void {
  if (p.kind === 'barrel' && p.fuse <= 0 && p.health > 0) {
    p.fuse = BARREL_FUSE;
    acesos.add(p);
  }
}

/**
 * Detona um prop e propaga: cada barril alcançado também explode, e o que ele
 * alcança também. Só barril propaga — caixote e ninho morrem sem explodir.
 *
 * A propagação é o que o jogo promete em todo lugar ("barris explodem em
 * cadeia") e o que não acontecia: `detonateProp` aplicava um raio único, os
 * barris alcançados morriam sem detonar, e a fileira inteira de barris alinhados
 * não ia junto. Atirar num basta para a linha inteira subir.
 */
export function detonateProp(p: Prop): Prop[] {
  const destroyed: Prop[] = [];
  const fila: Prop[] = [p];
  const visitados = new Set<Prop>([p]);

  while (fila.length > 0) {
    const atual = fila.shift()!;
    destroyed.push(atual);
    atual.health = 0;

    const blastRadius = atual.kind === 'barrel' ? BARREL_BLAST_RADIUS : 0;
    if (blastRadius <= 0) continue;

    for (const other of props) {
      if (visitados.has(other) || other.health <= 0) continue;
      if (Math.hypot(other.x - atual.x, other.y - atual.y) <= blastRadius) {
        visitados.add(other);
        fila.push(other);
      }
    }
  }
  return destroyed;
}

/** Raio e dano da explosão de um prop (0 se não explode). */
export function getBlast(p: Prop): { radius: number; damage: number } {
  return p.kind === 'barrel'
    ? { radius: BARREL_BLAST_RADIUS, damage: BARREL_BLAST_DAMAGE }
    : { radius: 0, damage: 0 };
}

/**
 * Reduz o flash de dano e consome o pavio dos barris acesos.
 */
export function updateProps(dt: number): Prop[] {
  const expirados: Prop[] = [];
  for (const p of props) {
    if (p.hitFlash > 0) p.hitFlash = Math.max(0, p.hitFlash - dt);
    if (p.fuse > 0) {
      p.fuse = Math.max(0, p.fuse - dt);
      // só sai da lista se foi realmente ignitado: fuse === 0 também é o
      // estado de um barril que nunca foi acendido
      if (p.fuse === 0 && acesos.has(p)) expirados.push(p);
    }
  }
  return expirados;
}

/**
 * Desenha os props com sombra, volume e estado de dano.
 *
 * As cores vêm do bioma (`propCrate`/`propBarrel`): com cor fixa, o caixote
 * bege e o barril bege apareciam iguais nos 9 biomas, e a Caverna e o Vulcão —
 * que são justamente os biomas onde o objeto deveria ser rocha ou ferro — tinham o
 * mesmo engradado de madeira do pântano.
 *
 * @param visible - callback que diz se um retângulo em mundo está visível
 */
export function drawProps(
  ctx: CanvasRenderingContext2D,
  isVisible: (x: number, y: number, r: number) => boolean,
  paleta: { crate: string; barrel: string } = { crate: '#7a6244', barrel: '#6a5a44' },
): void {
  for (const p of props) {
    if (p.health <= 0) continue;
    if (!isVisible(p.x, p.y, p.radius + 24)) continue;

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + p.radius * 0.55, p.radius * 0.85, p.radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    if (p.kind === 'carro') {
      // carro: sprite horizontal (2 células de comprimento), cru — a
      // dessaturação entrou no processamento do PNG, não no draw. Varia
      // por célula como a árvore, para a fila não vir carimbo.
      const img = getSprite(CARRO_SPRITES[(p.col + p.row) % CARRO_SPRITES.length]);
      if (img) {
        const largura = CELL_SIZE * 2;
        const altura = largura * (img.naturalHeight / img.naturalWidth);
        ctx.drawImage(img, p.x - largura / 2, p.y - altura / 2, largura, altura);
      }
      // sem fallback de desenho: carro que não carregou é cobertura
      // invisível — o radiador do jogo é a colisão (regra 15 no espírito:
      // aqui o que faltaria é o ASSET, e o código não inventa chassi)
    } else if (p.kind === 'tree') {
      // Árvore: o tile AUTORAL cru, sem tint (a justificativa está no
      // gen_assets_arvores.py — o multiplicador do bioma deixaria a copa na
      // mesma luminância do piso). Varia por célula, como o caixote, para a
      // floresta não vir carimbo.
      const morta = charAt(p.col, p.row) === 'D';
      const nomes = TREE_SPRITES[morta ? 'morta' : 'viva'];
      const img = getSprite(nomes[(p.col + p.row) % nomes.length]);
      const s = CELL_SIZE;
      if (img) {
        ctx.drawImage(img, p.x - s / 2, p.y - s / 2, s, s);
      } else {
        // fallback se o asset não carregar (regra 15)
        ctx.fillStyle = morta ? '#3a3428' : '#4a5236';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radius, p.radius * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (p.hitFlash > 0) {
        ctx.fillStyle = PALETTE.crit;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
        ctx.globalAlpha = 1;
      }
    } else if (p.kind === 'nest') {
      // ninho: arbusto do pack na cor do bioma, com a brasa no meio. A brasa
      // pulsa e acende no dano — é feedback de "cabeça" do objetivo, não
      // identidade, então continua em código.
      const nestTiles = PROP_SPRITES.nest;
      const nestImg = getSprite(`tile_${nestTiles[(p.col + p.row) % nestTiles.length]}`);
      if (nestImg) {
        const s = p.radius * 2.2;
        const body = tintSprite(nestImg, '#3a2f24', Math.ceil(s));
        ctx.drawImage(body, p.x - s / 2, p.y - s / 2, s, s);
      } else {
        ctx.fillStyle = '#241a14';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radius, p.radius * 0.82, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = p.hitFlash > 0 ? PALETTE.crit : '#3a2a1e';
        ctx.lineWidth = 3;
        ctx.stroke();
        for (let i = 0; i < 5; i++) {
          const a = (i * Math.PI * 2) / 5 - 0.4;
          ctx.strokeStyle = '#3a2a1e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x + Math.cos(a) * p.radius * 0.35, p.y + Math.sin(a) * p.radius * 0.35);
          ctx.lineTo(p.x + Math.cos(a) * p.radius * 0.95, p.y + Math.sin(a) * p.radius * 0.85);
          ctx.stroke();
        }
      }
      ctx.fillStyle = p.hitFlash > 0 ? PALETTE.crit : PALETTE.terracotta;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7 + Math.sin(Date.now() / 400 + p.col) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'rocket') {
      // O alvo do protect do Castelo: sprite Saturn V (Michael J Pierce,
      // CC-BY 3.0) em pé sobre a base. Sem tint — o foguete é o ÚNICO objeto
      // da fase que não pode mudar de cara com o bioma. O dano ACUMULA na
      // carcaça (relato do Murilo: "o foguete poderia ir se estragando à
      // medida que tomasse dano"): abaixo de 2/3 ele solta fumaça, abaixo
      // de 1/3 a fumaça engrossa e o corpo entorta até 7° na base.
      const img = getSprite('prop_foguete');
      const altura = p.radius * 5.2;
      const baseY = p.y + p.radius * 0.35;
      const integridade = Math.max(0, p.health / p.maxHealth);
      const entorta = (1 - integridade) * 0.12;
      if (img) {
        const largura = altura * (img.width / img.height);
        ctx.save();
        ctx.translate(p.x, baseY);
        ctx.rotate(entorta);
        ctx.drawImage(img, -largura / 2, -altura, largura, altura);
        if (p.hitFlash > 0) {
          ctx.globalAlpha = 0.65;
          ctx.filter = 'brightness(2.4) saturate(0.5)';
          ctx.drawImage(img, -largura / 2, -altura, largura, altura);
        }
        ctx.restore();
        if (integridade < 0.66) {
          // fumaça do pack: dois bicos abaixo de 2/3, três abaixo de 1/3
          const bicos = integridade < 0.33 ? 3 : 2;
          const agora = Date.now() / 1000;
          for (let i = 0; i < bicos; i++) {
            const fum = getSprite(`smoke_0${(i % 2) + 1}`);
            if (!fum) break;
            const sobe = (agora * 26 + i * 40) % 90;
            const lado = Math.sin(agora * 1.4 + i * 2.1) * largura * 0.22;
            const tamanho = 26 + (i % 2) * 8;
            ctx.globalAlpha = 0.42 - (sobe / 90) * 0.34;
            ctx.drawImage(fum, p.x + lado - tamanho / 2, baseY - altura * 0.66 - sobe, tamanho, tamanho);
          }
          ctx.globalAlpha = 1;
        }
      } else {
        // fallback só se o asset não carregar (regra 15): silhueta de torre
        // com a ponta terracota, para o alvo continuar lendo como alvo
        ctx.fillStyle = p.hitFlash > 0 ? PALETTE.crit : '#b8b8b0';
        ctx.fillRect(p.x - p.radius * 0.42, baseY - altura, p.radius * 0.84, altura);
        ctx.fillStyle = PALETTE.terracotta;
        ctx.beginPath();
        ctx.moveTo(p.x - p.radius * 0.42, baseY - altura);
        ctx.lineTo(p.x, baseY - altura - p.radius * 0.9);
        ctx.lineTo(p.x + p.radius * 0.42, baseY - altura);
        ctx.fill();
      }
    } else if (p.kind === 'capsula') {
      // A cápsula BioGen caída: tile de tecnologia do pack DEITADO (ela
      // caiu do céu, não pousou), com o vazamento verde atrás — o flare do
      // pack, não um brilho desenhado. O tile é o mesmo da cena do Espaço
      // (333): a cápsula é a MESMA tecnologia, caída em terra errada.
      // Passar pelo olho da revisão de imagem.
      const vazamento = getSprite('flare_01');
      if (vazamento) {
        const pulso = 0.5 + Math.sin(Date.now() / 600) * 0.12;
        ctx.globalAlpha = 0.35 * pulso;
        const s = p.radius * 2.6;
        ctx.drawImage(vazamento, p.x - s / 2, p.y - s / 2, s, s);
        ctx.globalAlpha = 1;
      }
      const capsulaImg = getSprite('tile_333');
      if (capsulaImg) {
        const s = p.radius * 2.1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(1.05);
        ctx.drawImage(capsulaImg, -s / 2, -s / 2, s, s);
        ctx.restore();
      } else {
        // fallback se o asset não carregar (regra 15)
        ctx.fillStyle = '#5a6a5a';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radius * 0.5, p.radius, 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7a9a6a';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    } else if (p.kind === 'barrel') {
      // barril: sprite do pack (tiles 505-510) na cor do bioma, com cintas e pavio.
      // Fallback procedural só se o asset não carregar (regra 15).
      const barrelTiles = PROP_SPRITES.barrel;
      const barrelImg = getSprite(`tile_${barrelTiles[(p.col + p.row) % barrelTiles.length]}`);
      if (barrelImg) {
        const s = p.radius * 2.1;
        const body = tintSprite(barrelImg, paleta.barrel, Math.ceil(s));
        ctx.drawImage(body, p.x - s / 2, p.y - s / 2, s, s);
      } else {
        // fallback procedural (regra 15)
        ctx.fillStyle = p.hitFlash > 0 ? PALETTE.crit : paleta.barrel;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = shadeCor(paleta.barrel, -0.3);
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.strokeStyle = shadeCor(paleta.barrel, -0.18);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x - p.radius * 0.7, p.y - 6);
        ctx.lineTo(p.x + p.radius * 0.7, p.y - 6);
        ctx.moveTo(p.x - p.radius * 0.7, p.y + 6);
        ctx.lineTo(p.x + p.radius * 0.7, p.y + 6);
        ctx.stroke();
      }
      // pavio aceso (estado que muda por frame, não identidade)
      if (p.fuse > 0) {
        ctx.fillStyle = p.fuse < 0.35 ? PALETTE.danger : PALETTE.mustard;
        ctx.beginPath();
        ctx.arc(p.x, p.y - p.radius * 0.7, 4 + Math.sin(p.fuse * 40) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // caixote: caixa do pack na cor do bioma. O resto — barra de vida,
      // flash de dano, sombra — é estado que muda por frame, não identidade.
      const crateTiles = PROP_SPRITES.crate;
      const crateImg = getSprite(`tile_${crateTiles[(p.col + p.row) % crateTiles.length]}`);
      if (crateImg) {
        const s = p.radius * 0.9;
        const body = tintSprite(crateImg, paleta.crate, Math.ceil(s * 2));
        ctx.drawImage(body, p.x - s, p.y - s, s * 2, s * 2);
      } else {
        const s = p.radius * 0.9;
        ctx.fillStyle = p.hitFlash > 0 ? PALETTE.crit : paleta.crate;
        ctx.fillRect(p.x - s, p.y - s, s * 2, s * 2);
        ctx.strokeStyle = shadeCor(paleta.crate, -0.28);
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - s, p.y - s, s * 2, s * 2);
        ctx.beginPath();
        ctx.moveTo(p.x - s, p.y - s);
        ctx.lineTo(p.x + s, p.y + s);
        ctx.moveTo(p.x + s, p.y - s);
        ctx.lineTo(p.x - s, p.y + s);
        ctx.stroke();
      }
    }

    if (p.health < p.maxHealth) {
      const barW = p.radius * 2;
      // no foguete a barra fica acima da ponta, não no meio do corpo
      const barY = p.kind === 'rocket' ? p.y - p.radius * 6.2 : p.y - p.radius - 9;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(p.x - barW / 2, barY, barW, 4);
      ctx.fillStyle = PALETTE.mustard;
      ctx.fillRect(p.x - barW / 2, barY, barW * (p.health / p.maxHealth), 4);
    }
  }
}
