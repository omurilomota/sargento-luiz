/**
 * src/ui/hud.ts — HUD inteiro em canvas.
 *
 * Antes isso era metade HTML (`#hud-top`, `#hud-bottom`) e metade desenhada
 * no `main.ts`, e as duas se sobrepunham: score no DOM em y≈16 colidindo com o
 * minimapa em y=12..92, barra de rodapé de 28px em cima do nome da arma em
 * `height-20`, combo em `height-100` colidindo com a dica em `height-80`.
 *
 * Aqui o layout é uma grade de três colunas com inset de 12px e cada elemento
 * tem uma casa só.
 */

import { PALETTE } from '../core/palette';
import { ObjectiveProgress } from '../systems/objectives';
import { EnvironmentWarning } from '../systems/environment';

const INSET = 12;

export interface HudSkill {
  key: string;
  name: string;
  cooldown: number;
  maxCooldown: number;
  active: boolean;
}

export interface HudBoss {
  name: string;
  health: number;
  maxHealth: number;
  telegraphing: boolean;
  /** Texto da ação que vem a seguir (vem de EnemyType.pattern[].telegraph) */
  telegraphLabel: string;
}

export interface HudMinimap {
  /** Arredondamentos do mapa em pixels de mundo */
  walls: { x: number; y: number; w: number; h: number }[];
  /** Densidade do mapa (0-1) usada como cor de fundo */
  density: number;
}

export interface HudData {
  phase: string;
  health: number;
  maxHealth: number;
  shield: number;
  score: number;
  coins: number;
  wave: number;
  maxWave: number;
  enemies: number;
  weapon: string;
  ammo: number;
  maxAmmo: number;
  reloading: boolean;
  reloadProgress: number;
  combo: number;
  comboDecay: number;
  skills: HudSkill[];
  activePowerups: Record<string, number>;
  powerupMeta: Record<string, { color: string; symbol: string }>;
  worldSize: { w: number; h: number };
  minimap: HudMinimap;
  player: { x: number; y: number };
  enemyDots: { x: number; y: number; boss: boolean }[];
  propDots: { x: number; y: number; barrel: boolean }[];
  boss?: HudBoss | null;
  objective: ObjectiveProgress;
  warnings: EnvironmentWarning[];
  combos: { name: string; description: string; color: string }[];
  hint: { key: string; text: string } | null;
  toasts: { name: string; time: number }[];
}

let ctx: CanvasRenderingContext2D | null = null;

/** Inicializa o HUD com o contexto do canvas principal. */
export function initHud(context: CanvasRenderingContext2D): void {
  ctx = context;
}

/** Desenha o HUD inteiro. Chamado depois de `restoreCanvas()`, em espaço de tela. */
export function drawHud(d: HudData): void {
  if (!ctx) return;
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  drawTopLeft(d, W);
  drawTopCenter(d, W);
  drawTopRight(d, W, H);
  if (d.boss) drawBossBar(d, W);
  drawWarningStrip(d, W);
  drawBottomLeft(d, H);
  drawComboChips(d, W, H);
  drawHint(d, W, H);
  drawToasts(d, W, H);
}

/** Retorna a largura usada pelas colunas laterais, para o centro não colidir. */
const SIDE_W = 260;

/** Coluna esquerda: vida segmentada + escudo + linha de skills. */
function drawTopLeft(d: HudData, _W: number): void {
  const x = INSET;
  const y = INSET;

  // vida segmentada
  const segW = 16;
  const segH = 12;
  const segments = Math.min(20, Math.max(4, Math.ceil(d.maxHealth / 25)));
  const filled = (d.health / d.maxHealth) * segments;
  ctx!.fillStyle = 'rgba(0,0,0,0.5)';
  ctx!.fillRect(x - 2, y - 2, segments * (segW + 2) + 4, segH + 4);

  for (let i = 0; i < segments; i++) {
    const sx = x + i * (segW + 2);
    ctx!.fillStyle = 'rgba(255,255,255,0.06)';
    ctx!.fillRect(sx, y, segW, segH);
    const part = Math.max(0, Math.min(1, filled - i));
    if (part > 0) {
      const pct = d.health / d.maxHealth;
      ctx!.fillStyle = pct > 0.6 ? PALETTE.moss : pct > 0.3 ? PALETTE.mustard : PALETTE.danger;
      ctx!.fillRect(sx, y, segW * part, segH);
    }
  }

  // número de vida + pips de escudo
  ctx!.fillStyle = PALETTE.text;
  ctx!.font = 'bold 11px monospace';
  ctx!.textAlign = 'left';
  ctx!.textBaseline = 'alphabetic';
  const hpText = `${Math.ceil(d.health)}/${Math.round(d.maxHealth)}`;
  ctx!.fillText(hpText, x, y + segH + 16);

  for (let i = 0; i < Math.min(6, d.shield); i++) {
    ctx!.fillStyle = PALETTE.stone;
    ctx!.beginPath();
    ctx!.arc(x + 62 + i * 10, y + segH + 11, 3.5, 0, Math.PI * 2);
    ctx!.fill();
  }

  // linha única com as 3 skills (antes empilhadas para y negativo, fora da tela)
  const skillY = y + segH + 30;
  d.skills.forEach((s, i) => {
    const sx = x + i * 46;
    const size = 22;
    ctx!.fillStyle = 'rgba(0,0,0,0.5)';
    ctx!.fillRect(sx, skillY, size, size);

    const pct = s.maxCooldown > 0 ? 1 - s.cooldown / s.maxCooldown : 1;
    ctx!.fillStyle = s.active ? PALETTE.moss : s.cooldown <= 0 ? 'rgba(122,154,106,0.35)' : 'rgba(255,255,255,0.08)';
    ctx!.fillRect(sx + 1, skillY + size * (1 - pct) + 1, size - 2, (size - 2) * pct);

    ctx!.strokeStyle = s.active ? PALETTE.moss : s.cooldown <= 0 ? 'rgba(122,154,106,0.6)' : 'rgba(255,255,255,0.08)';
    ctx!.lineWidth = 1;
    ctx!.strokeRect(sx + 0.5, skillY + 0.5, size - 1, size - 1);

    ctx!.fillStyle = s.active ? '#fff' : s.cooldown <= 0 ? PALETTE.moss : PALETTE.textOff;
    ctx!.font = 'bold 9px monospace';
    ctx!.textAlign = 'center';
    ctx!.textBaseline = 'middle';
    ctx!.fillText(s.key, sx + size / 2, skillY + size / 2);

    ctx!.textBaseline = 'alphabetic';
    ctx!.fillStyle = PALETTE.textOff;
    ctx!.font = '8px monospace';
    ctx!.fillText(s.name.toUpperCase(), sx + size / 2, skillY + size + 9);
  });
  ctx!.textAlign = 'left';
}

/** Coluna central: fase, barra de onda, score e chip de combo com decaimento. */
function drawTopCenter(d: HudData, W: number): void {
  const cx = W / 2;
  let y = INSET + 10;

  ctx!.textAlign = 'center';
  ctx!.fillStyle = PALETTE.title;
  ctx!.font = 'bold 13px monospace';
  ctx!.fillText(d.phase.toUpperCase(), cx, y);

  y += 12;
  const barW = Math.min(240, SIDE_W);
  const barX = cx - barW / 2;
  ctx!.fillStyle = 'rgba(0,0,0,0.5)';
  ctx!.fillRect(barX, y, barW, 6);
  const wavePct = d.maxWave > 0 ? d.wave / d.maxWave : 0;
  ctx!.fillStyle = PALETTE.stone;
  ctx!.fillRect(barX, y, barW * Math.min(1, wavePct), 6);
  ctx!.strokeStyle = 'rgba(200,184,144,0.25)';
  ctx!.lineWidth = 1;
  ctx!.strokeRect(barX + 0.5, y + 0.5, barW - 1, 5);
  ctx!.fillStyle = PALETTE.textDim;
  ctx!.font = '9px monospace';
  ctx!.fillText(`ONDA ${d.wave + 1}/${d.maxWave}`, cx, y + 17);

  y += 26;
  ctx!.fillStyle = PALETTE.mustard;
  ctx!.font = 'bold 16px monospace';
  ctx!.fillText(String(d.score), cx, y);

  if (d.combo > 1) {
    y += 15;
    const decay = Math.max(0, Math.min(1, d.comboDecay));
    ctx!.fillStyle = PALETTE.terracotta;
    ctx!.font = 'bold 11px monospace';
    ctx!.fillText(`COMBO x${d.combo}`, cx, y);
    const cw = 60;
    ctx!.fillStyle = 'rgba(0,0,0,0.5)';
    ctx!.fillRect(cx - cw / 2, y + 4, cw, 3);
    ctx!.fillStyle = PALETTE.terracotta;
    ctx!.fillRect(cx - cw / 2, y + 4, cw * decay, 3);
  }

  // objetivo da fase
  y += 22;
  ctx!.fillStyle = PALETTE.textDim;
  ctx!.font = '9px monospace';
  ctx!.fillText(d.objective.label, cx, y);
  const ow = 160;
  ctx!.fillStyle = 'rgba(0,0,0,0.5)';
  ctx!.fillRect(cx - ow / 2, y + 4, ow, 4);
  ctx!.fillStyle = PALETTE.moss;
  ctx!.fillRect(cx - ow / 2, y + 4, ow * d.objective.progress, 4);
  ctx!.fillStyle = PALETTE.textOff;
  ctx!.font = '8px monospace';
  ctx!.fillText(d.objective.detail, cx, y + 17);
  ctx!.textAlign = 'left';
}

/** Coluna direita: moedas, inimigos, minimapa e timers de power-up. */
function drawTopRight(d: HudData, W: number, _H: number): void {
  const mmW = 150;
  const mmH = Math.round(mmW * (d.worldSize.h / Math.max(1, d.worldSize.w)));
  const mmX = W - mmW - INSET;
  const mmY = INSET;

  ctx!.textAlign = 'right';
  ctx!.fillStyle = PALETTE.mustard;
  ctx!.font = 'bold 12px monospace';
  ctx!.fillText(`${d.coins}$`, W - INSET, mmY + 11);

  ctx!.fillStyle = PALETTE.terracotta;
  ctx!.font = '11px monospace';
  ctx!.fillText(`HOSTIS ${d.enemies}`, W - INSET, mmY + 26);

  // minimapa: agora mapeia mundo → minimapa, então é informativo de verdade
  const sx = mmW / Math.max(1, d.worldSize.w);
  const sy = mmH / Math.max(1, d.worldSize.h);
  ctx!.fillStyle = 'rgba(0,0,0,0.55)';
  ctx!.fillRect(mmX - 2, mmY + 34, mmW + 4, mmH + 4);
  ctx!.fillStyle = `rgba(122,154,106,${0.06 + d.minimap.density * 0.06})`;
  ctx!.fillRect(mmX, mmY + 36, mmW, mmH);

  const oy = mmY + 36;
  ctx!.fillStyle = 'rgba(120,120,120,0.5)';
  for (const w of d.minimap.walls) {
    ctx!.fillRect(mmX + w.x * sx, oy + w.y * sy, Math.max(1, w.w * sx), Math.max(1, w.h * sy));
  }
  for (const p of d.propDots) {
    ctx!.fillStyle = p.barrel ? PALETTE.terracotta : PALETTE.mustard;
    ctx!.fillRect(mmX + p.x * sx - 0.5, oy + p.y * sy - 0.5, 1.5, 1.5);
  }
  for (const e of d.enemyDots) {
    ctx!.fillStyle = e.boss ? PALETTE.crit : PALETTE.danger;
    ctx!.beginPath();
    ctx!.arc(mmX + e.x * sx, oy + e.y * sy, e.boss ? 2.5 : 1.2, 0, Math.PI * 2);
    ctx!.fill();
  }
  ctx!.fillStyle = PALETTE.moss;
  ctx!.beginPath();
  ctx!.arc(mmX + d.player.x * sx, oy + d.player.y * sy, 2.2, 0, Math.PI * 2);
  ctx!.fill();

  ctx!.strokeStyle = PALETTE.panelEdge;
  ctx!.lineWidth = 1;
  ctx!.strokeRect(mmX + 0.5, oy + 0.5, mmW - 1, mmH - 1);

  // timers de power-up ativo, logo abaixo do minimapa
  let px = W - INSET - 10;
  const py = oy + mmH + 14;
  for (const key of Object.keys(d.activePowerups)) {
    const meta = d.powerupMeta[key];
    if (!meta) continue;
    ctx!.fillStyle = meta.color;
    ctx!.beginPath();
    ctx!.arc(px, py, 8, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.fillStyle = '#111';
    ctx!.font = 'bold 8px monospace';
    ctx!.textAlign = 'center';
    ctx!.textBaseline = 'middle';
    ctx!.fillText(meta.symbol, px, py);
    ctx!.textBaseline = 'alphabetic';
    ctx!.textAlign = 'right';
    px -= 22;
  }
  ctx!.textAlign = 'left';
}

/** Barra de boss, logo abaixo do topo-centro. */
function drawBossBar(d: HudData, W: number): void {
  const b = d.boss!;
  const w = Math.min(460, W * 0.5);
  const x = W / 2 - w / 2;
  const y = 128;

  ctx!.fillStyle = PALETTE.panel;
  ctx!.fillRect(x - 3, y - 3, w + 6, 16);

  ctx!.fillStyle = b.telegraphing ? PALETTE.crit : '#2a1a1a';
  ctx!.fillRect(x, y, w, 10);
  const pct = Math.max(0, b.health / b.maxHealth);
  ctx!.fillStyle = PALETTE.danger;
  ctx!.fillRect(x, y, w * pct, 10);
  ctx!.strokeStyle = b.telegraphing ? PALETTE.crit : 'rgba(139,64,64,0.5)';
  ctx!.lineWidth = 1;
  ctx!.strokeRect(x + 0.5, y + 0.5, w - 1, 9);

  ctx!.textAlign = 'center';
  ctx!.fillStyle = b.telegraphing ? PALETTE.crit : PALETTE.text;
  ctx!.font = b.telegraphing ? 'bold 11px monospace' : '10px monospace';
  // During a telegraph the label says WHICH action is coming. It was hardcoded
  // "PREPARANDO..." before: the 9 bosses each declare a telegraph text in
  // EnemyType.pattern and none of it reached the screen — the VIGIA's whole
  // job is to teach the fight, and it was saying the same thing as the Mothership.
  const texto = b.telegraphing && b.telegraphLabel ? `${b.name} — ${b.telegraphLabel}` : b.name;
  ctx!.fillText(texto, W / 2, y + 21);
  ctx!.textAlign = 'left';
}

/** Faixa de aviso ambiental (destrava o relâmpago invisível de 40 de dano). */
function drawWarningStrip(d: HudData, W: number): void {
  if (d.warnings.length === 0) return;
  const labels: Record<string, string> = {
    earthquake: 'TERREMOTO',
    lightning: 'RELÂMPAGO',
    storm: 'TEMPESTADE',
  };
  const stripH = 20;
  const y = 60;
  ctx!.fillStyle = 'rgba(0,0,0,0.55)';
  ctx!.fillRect(0, y, W, stripH);
  ctx!.strokeStyle = 'rgba(176,112,80,0.4)';
  ctx!.lineWidth = 1;
  ctx!.beginPath();
  ctx!.moveTo(0, y + 0.5);
  ctx!.lineTo(W, y + 0.5);
  ctx!.moveTo(0, y + stripH - 0.5);
  ctx!.lineTo(W, y + stripH - 0.5);
  ctx!.stroke();

  ctx!.textAlign = 'center';
  const warn = d.warnings[0];
  const pulse = 0.6 + Math.sin(performance.now() / 140) * 0.4;
  ctx!.globalAlpha = pulse;
  ctx!.fillStyle = PALETTE.terracotta;
  ctx!.font = 'bold 11px monospace';
  ctx!.fillText(`${labels[warn.type] ?? warn.type} EM ${Math.ceil(warn.timeLeft)}s`, W / 2, y + 14);
  ctx!.globalAlpha = 1;
  ctx!.textAlign = 'left';
}

/** Rodapé esquerdo: arma + munição segmentada + arco de recarga. */
function drawBottomLeft(d: HudData, H: number): void {
  const x = INSET;
  let y = H - INSET - 22;

  ctx!.fillStyle = PALETTE.text;
  ctx!.font = 'bold 12px monospace';
  ctx!.textAlign = 'left';
  ctx!.fillText(d.weapon, x, y);
  ctx!.fillStyle = PALETTE.textDim;
  ctx!.font = '9px monospace';
  ctx!.textAlign = 'right';
  ctx!.fillText(d.reloading ? 'RECARREGANDO' : `${d.ammo}/${d.maxAmmo}`, x + 200, y);
  ctx!.textAlign = 'left';

  y += 8;
  const barW = 200;
  ctx!.fillStyle = 'rgba(0,0,0,0.55)';
  ctx!.fillRect(x - 2, y - 2, barW + 4, 14);

  const bulletsPerCell = Math.max(1, Math.round(d.maxAmmo / 20));
  const cells = Math.min(20, d.maxAmmo);
  const realCell = barW / cells;
  const filledCells = d.ammo / bulletsPerCell;
  for (let i = 0; i < cells; i++) {
    const cx = x + i * realCell;
    ctx!.fillStyle = 'rgba(255,255,255,0.06)';
    ctx!.fillRect(cx + 1, y, realCell - 2, 10);
    const part = Math.max(0, Math.min(1, filledCells - i));
    if (part > 0) {
      ctx!.fillStyle = d.ammo / d.maxAmmo < 0.25 ? PALETTE.danger : PALETTE.title;
      ctx!.fillRect(cx + 1, y, (realCell - 2) * part, 10);
    }
  }

  if (d.reloading) {
    ctx!.fillStyle = PALETTE.mustard;
    ctx!.fillRect(x, y, barW * d.reloadProgress, 10);
    ctx!.fillStyle = PALETTE.mustard;
    ctx!.font = '9px monospace';
    ctx!.fillText('RECARGA', x, y + 22);
  }
}

/** Rodapé direito: chips de combo ativos. */
function drawComboChips(d: HudData, W: number, H: number): void {
  if (d.combos.length === 0) return;
  let y = H - INSET - 12;
  ctx!.textAlign = 'right';
  for (const c of d.combos) {
    ctx!.fillStyle = 'rgba(0,0,0,0.5)';
    ctx!.font = 'bold 11px monospace';
    const nameW = ctx!.measureText(c.name).width;
    ctx!.fillRect(W - INSET - nameW - 14, y - 11, nameW + 14, 15);
    ctx!.fillStyle = c.color;
    ctx!.fillRect(W - INSET - 8, y - 9, 4, 11);
    ctx!.fillText(c.name, W - INSET - 12, y);
    ctx!.fillStyle = PALETTE.textOff;
    ctx!.font = '9px monospace';
    ctx!.fillText(c.description, W - INSET - 12, y + 13);
    y -= 32;
  }
  ctx!.textAlign = 'left';
}

/** Rodapé central: dica do tutorial (o texto já traz a tecla). */
function drawHint(d: HudData, W: number, H: number): void {
  if (!d.hint) return;
  const text = d.hint.text;
  ctx!.font = '11px monospace';
  const w = ctx!.measureText(text).width + 24;
  const x = W / 2 - w / 2;
  const y = H - INSET - 30;
  ctx!.fillStyle = 'rgba(0,0,0,0.6)';
  ctx!.fillRect(x, y, w, 22);
  ctx!.strokeStyle = 'rgba(160,128,80,0.3)';
  ctx!.lineWidth = 1;
  ctx!.strokeRect(x + 0.5, y + 0.5, w - 1, 21);
  ctx!.fillStyle = PALETTE.mustard;
  ctx!.textAlign = 'center';
  ctx!.fillText(text, W / 2, y + 15);
  ctx!.textAlign = 'left';
}

/** Toasts de conquista empilhados, no canto superior direito. */
function drawToasts(d: HudData, W: number, H: number): void {
  let y = INSET + 220;
  ctx!.textAlign = 'right';
  for (let i = d.toasts.length - 1; i >= 0; i--) {
    const t = d.toasts[i];
    const alpha = Math.min(1, t.time);
    ctx!.globalAlpha = alpha;
    ctx!.fillStyle = PALETTE.panel;
    const text = `CONQUISTA: ${t.name}`;
    ctx!.font = 'bold 10px monospace';
    const w = ctx!.measureText(text).width + 16;
    ctx!.fillRect(W - INSET - w, y - 11, w, 16);
    ctx!.fillStyle = PALETTE.mustard;
    ctx!.fillText(text, W - INSET - 8, y);
    y += 20;
  }
  ctx!.globalAlpha = 1;
  ctx!.textAlign = 'left';
  void H;
}
