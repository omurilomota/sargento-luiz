/**
 * src/systems/props.ts
 *
 * Caixotes e barris: geometria que o jogador pode destruir.
 * Barris explodem em cadeia; caixotes soltam moedas. São poucos e mudam,
 * então são desenhados por frame por cima do terreno prerenderizado.
 */

import { CELL_SIZE } from '../maps';
import { HazardKind } from '../types';
import { PALETTE } from '../core/palette';

export interface Prop {
  col: number;
  row: number;
  x: number;
  y: number;
  radius: number;
  /** `nest` é o objetivo destrutível das fases com objetivo `destroy` */
  kind: 'crate' | 'barrel' | 'nest';
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

const CRATE_HEALTH = 20;
const BARREL_HEALTH = 14;
const NEST_HEALTH = 90;
const BARREL_RADIUS = 26;
const BARREL_BLAST_RADIUS = 96;
const BARREL_BLAST_DAMAGE = 45;

let props: Prop[] = [];

/**
 * Cria os props a partir dos caracteres do mapa.
 * @param cells - matriz de caracteres do mapa
 */
export function initProps(cells: string[][]): void {
  props = [];
  acesos.clear();
  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[row].length; col++) {
      const ch = cells[row][col];
      if (ch !== 'c' && ch !== 'b' && ch !== 'N') continue;
      const isBarrel = ch === 'b';
      const isNest = ch === 'N';
      const hp = isNest ? NEST_HEALTH : isBarrel ? BARREL_HEALTH : CRATE_HEALTH;
      props.push({
        col, row,
        x: col * CELL_SIZE + CELL_SIZE / 2,
        y: row * CELL_SIZE + CELL_SIZE / 2,
        radius: isNest ? CELL_SIZE * 0.46 : isBarrel ? BARREL_RADIUS : CELL_SIZE * 0.38,
        kind: isNest ? 'nest' : isBarrel ? 'barrel' : 'crate',
        health: hp,
        maxHealth: hp,
        hitFlash: 0,
        fuse: 0,
      });
    }
  }
}

/** Lista os ninhos (objetivos destrutíveis) ainda de pé. */
export function getNests(): Prop[] {
  return props.filter(p => p.kind === 'nest' && p.health > 0);
}

/** Retorna todos os props ativos. */
export function getProps(): Prop[] {
  return props;
}

/** Retorna apenas os props que ainda bloqueiam o caminho. */
export function getBlockingProps(): Prop[] {
  return props.filter(p => p.health > 0);
}

/** Remove todos os props. */
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
 * @param hazard - hazard da fase
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
 * @param p - prop detonado
 * @returns lista de props destruídos (incluindo o próprio)
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
 * @returns os barris cujo pavio acabou de zerar, prontos para detonar
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
 * @param ctx - contexto 2D
 * @param visible - callback que diz se um retângulo em mundo está visível
 */
export function drawProps(ctx: CanvasRenderingContext2D, isVisible: (x: number, y: number, r: number) => boolean): void {
  for (const p of props) {
    if (p.health <= 0) continue;
    if (!isVisible(p.x, p.y, p.radius + 24)) continue;

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + p.radius * 0.55, p.radius * 0.85, p.radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    if (p.kind === 'nest') {
      // ninho: monte orgânico escuro com brasa no meio
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
      ctx.fillStyle = p.hitFlash > 0 ? PALETTE.crit : PALETTE.terracotta;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7 + Math.sin(Date.now() / 400 + p.col) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'barrel') {
      ctx.fillStyle = p.hitFlash > 0 ? '#c8b890' : '#6a5a44';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3a2f22';
      ctx.lineWidth = 3;
      ctx.stroke();
      // cintas do barril
      ctx.strokeStyle = '#4a3d2c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x - p.radius * 0.7, p.y - 6);
      ctx.lineTo(p.x + p.radius * 0.7, p.y - 6);
      ctx.moveTo(p.x - p.radius * 0.7, p.y + 6);
      ctx.lineTo(p.x + p.radius * 0.7, p.y + 6);
      ctx.stroke();
      if (p.fuse > 0) {
        ctx.fillStyle = p.fuse < 0.35 ? PALETTE.danger : PALETTE.mustard;
        ctx.beginPath();
        ctx.arc(p.x, p.y - p.radius * 0.7, 4 + Math.sin(p.fuse * 40) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const s = p.radius * 0.9;
      ctx.fillStyle = p.hitFlash > 0 ? '#c8b890' : '#7a6244';
      ctx.fillRect(p.x - s, p.y - s, s * 2, s * 2);
      ctx.strokeStyle = '#4a3a28';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x - s, p.y - s, s * 2, s * 2);
      ctx.beginPath();
      ctx.moveTo(p.x - s, p.y - s);
      ctx.lineTo(p.x + s, p.y + s);
      ctx.moveTo(p.x + s, p.y - s);
      ctx.lineTo(p.x - s, p.y + s);
      ctx.stroke();
    }

    if (p.health < p.maxHealth) {
      const barW = p.radius * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(p.x - barW / 2, p.y - p.radius - 9, barW, 4);
      ctx.fillStyle = PALETTE.mustard;
      ctx.fillRect(p.x - barW / 2, p.y - p.radius - 9, barW * (p.health / p.maxHealth), 4);
    }
  }
}
