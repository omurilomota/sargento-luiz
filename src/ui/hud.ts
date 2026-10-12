/**
 * src/ui/hud.ts — HUD inteiro em canvas.
 *
 * Layout em grade de três colunas com inset de 12px: cada elemento tem uma casa
 * só, e a geometria de cada coluna sai de uma função pura (`getHudCenterLayout`
 * no centro) para que o teste possa garantir que nada invade o vizinho.
 */

import { PALETTE } from '../core/palette';
import { ObjectiveProgress } from '../systems/objectives';
import { EnvironmentWarning } from '../systems/environment';
import { isJammed } from '../weapons';

const INSET = 12;

export type ToastKind = 'achievement' | 'equip' | 'aviso';

/** Ficha da arma, mostrada na tela TAB. */
export interface WeaponSheet {
  name: string;
  quality: string;
  qualityColor: string;
  damage: number;
  shootRate: number;
  magazine: number;
  reloadTime: number;
  dps: number;
  pierce: boolean;
  explosive: boolean;
  bulletCount: number;
  spread: number;
}

export interface Toast {
  name: string;
  time: number;
  kind: ToastKind;
}

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
  /** Ficha da arma equipada, null se ausente. */
  weaponStats: WeaponSheet | null;
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
  /** Adjetivo da condição da arma, ex.: 'CORROÍDA'. Vazio se estiver boa. */
  weaponCondition: string;
  /** Cor do rótulo da condição. */
  weaponConditionColor: string;
  ammo: number;
  maxAmmo: number;
  reloading: boolean;
  reloadProgress: number;
  /** Nível da progressão (XP é o score acumulado). */
  nivel: number;
  /** XP dentro do nível atual e o que o nível exige. */
  xpAtual: number;
  xpNecessario: number;
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
  toasts: Toast[];
  /** Segundos restantes antes da loja abrir (0 = sem contagem) */
  phaseEndSeconds: number;
  medkits: number;
  hasNpc: boolean;
  npcFollowing: boolean;
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
  drawKeyHints(d);
  const centerBottom = drawTopCenter(d, W);
  drawTopRight(d, W, H);
  let stackY = centerBottom + 10;
  if (d.boss) {
    drawBossBar(d, W, stackY);
    stackY += 34;
  }
  drawWarningStrip(d, W, stackY);
  drawBottomLeft(d, H);
  drawFichaMini(d, W, H);
  drawHint(d, W, H);
  drawPhaseEndCountdown(d, W, H);
  drawToasts(d, W);
}

/** Retorna a largura usada pelas colunas laterais, para o centro não colidir. */
const SIDE_W = 260;

export interface HudCenterLayout {
  phaseY: number;
  waveBarY: number;
  waveLabelY: number;
  scoreY: number;
  comboY: number | null;
  comboBarY: number | null;
  objectiveY: number;
  objectiveDetailY: number;
  /** Y a partir de onde a barra de boss e a faixa de aviso podem ser desenhadas. */
  nextY: number;
}

/**
 * Geometria da coluna central do HUD.
 *
 * O score usava `waveBarY + 26` e o rótulo de onda fica em `waveBarY + 18`: o
 * topo dos dígitos do score (16px) invadia o `ONDA x/y` (13px) em ~3px. Como as
 * duas posições são absolutas e não relativas, o overlap era constante — não
 * dependia da resolução.
 */
export function getHudCenterLayout(hasCombo: boolean): HudCenterLayout {
  const phaseY = INSET + 10;
  const waveBarY = phaseY + 12;
  const waveLabelY = waveBarY + 18;
  // 38 e não 26: o topo do score precisa de ~13px acima do baseline da onda.
  const scoreY = waveBarY + 38;
  const comboY = hasCombo ? scoreY + 15 : null;
  const objectiveY = (comboY ?? scoreY) + 22;
  return {
    phaseY,
    waveBarY,
    waveLabelY,
    scoreY,
    comboY,
    comboBarY: comboY === null ? null : comboY + 4,
    objectiveY,
    objectiveDetailY: objectiveY + 18,
    nextY: objectiveY + 22,
  };
}

/** Coluna central: fase, barra de onda, score e chip de combo com decaimento. */
function drawTopCenter(d: HudData, W: number): number {
  const cx = W / 2;
  const L = getHudCenterLayout(d.combo > 1);

  // Contraste sutil para as labels da coluna central: sem bloco escuro
  ctx!.save();
  ctx!.shadowColor = 'rgba(0,0,0,0.85)';
  ctx!.shadowBlur = 4;
  ctx!.shadowOffsetY = 1;

  ctx!.textAlign = 'center';
  ctx!.fillStyle = PALETTE.title;
  ctx!.font = 'bold 14px monospace';
  ctx!.fillText(d.phase.toUpperCase(), cx, L.phaseY);

  const barW = Math.min(240, SIDE_W);
  const barX = cx - barW / 2;
  ctx!.fillStyle = 'rgba(0,0,0,0.5)';
  ctx!.fillRect(barX, L.waveBarY, barW, 6);
  const wavePct = d.maxWave > 0 ? d.wave / d.maxWave : 0;
  ctx!.fillStyle = PALETTE.stone;
  ctx!.fillRect(barX, L.waveBarY, barW * Math.min(1, wavePct), 6);
  ctx!.strokeStyle = 'rgba(200,184,144,0.25)';
  ctx!.lineWidth = 1;
  ctx!.strokeRect(barX + 0.5, L.waveBarY + 0.5, barW - 1, 5);
  ctx!.fillStyle = PALETTE.textDim;
  ctx!.font = 'bold 13px monospace';
  ctx!.fillText(`ONDA ${d.wave + 1}/${d.maxWave}`, cx, L.waveLabelY);

  ctx!.fillStyle = PALETTE.mustard;
  ctx!.font = 'bold 16px monospace';
  ctx!.fillText(String(d.score), cx, L.scoreY);

  if (L.comboY !== null) {
    const decay = Math.max(0, Math.min(1, d.comboDecay));
    ctx!.fillStyle = PALETTE.terracotta;
    ctx!.font = 'bold 13px monospace';
    ctx!.fillText(`COMBO x${d.combo}`, cx, L.comboY);
    const cw = 60;
    ctx!.fillStyle = 'rgba(0,0,0,0.5)';
    ctx!.fillRect(cx - cw / 2, L.comboBarY!, cw, 3);
    ctx!.fillStyle = PALETTE.terracotta;
    ctx!.fillRect(cx - cw / 2, L.comboBarY!, cw * decay, 3);
  }

  // objetivo da fase
  ctx!.fillStyle = PALETTE.textDim;
  ctx!.font = 'bold 13px monospace';
  ctx!.fillText(d.objective.label, cx, L.objectiveY);
  const ow = 160;
  ctx!.fillStyle = 'rgba(0,0,0,0.5)';
  ctx!.fillRect(cx - ow / 2, L.objectiveY + 4, ow, 4);
  ctx!.fillStyle = PALETTE.moss;
  ctx!.fillRect(cx - ow / 2, L.objectiveY + 4, ow * d.objective.progress, 4);
  ctx!.fillStyle = PALETTE.textOff;
  ctx!.font = '12px monospace';
  ctx!.fillText(d.objective.detail, cx, L.objectiveDetailY);
  ctx!.textAlign = 'left';
  ctx!.restore();
  return L.nextY;
}

export interface HudHintsLayout {
  /** Topo da barra de XP (4px, entre o número de vida e as skills). */
  xpBarY: number;
  /** Baseline do rótulo "NV x" da barra de XP. */
  xpLabelY: number;
  /** Topo da linha de skills. */
  skillY: number;
  /** Baseline do nome da skill (abaixo da caixa). */
  skillLabelY: number;
  /** Baseline das dicas de tecla. */
  hintsY: number;
}

/**
 * Geometria da coluna esquerda, abaixo da barra de vida.
 *
 * Antes, as skills e as dicas de tecla usavam cada uma sua conta solta
 * (`INSET + 12 + 30 + 22 + 12` e `y + segH + 22 + 9`), e as duas davam 85 e
 * 88: 3px de distância para uma fonte de 11px, então "DASH / ESC: Config" e
 * "SPC F E" saíam impressos um sobre o outro no topo esquerdo.
 *
 * A barra de XP entrou no meio e empurrou as skills 10px para baixo — o
 * bloco de vida (segmentos + número) termina em INSET+28 e as skills não
 * podiam simplesmente ficar onde estavam.
 */
export function getHudHintsLayout(): HudHintsLayout {
  const xpBarY = INSET + 34;
  const xpLabelY = xpBarY + 5;
  const skillY = xpBarY + 18;
  const skillLabelY = skillY + 22 + 9;
  // 21 e não 14: entre dois baselines de fonte 11px, 14px deixa 3px de folga
  // real (o topo do glifo fica ~9px acima do baseline). Era o que o jogador
  // viu — `DASH` impresso em cima de `1-9: trocar arma` — e nenhuma resolução
  // escapava, porque as posições são absolutas. Medido pelo `hud-proof.mjs`.
  return { xpBarY, xpLabelY, skillY, skillLabelY, hintsY: skillLabelY + 21 };
}

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
  ctx!.font = 'bold 13px monospace';
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

  // nível + barra de XP: 4px, entre o número de vida e as skills
  const L = getHudHintsLayout();
  ctx!.fillStyle = PALETTE.stone;
  ctx!.font = 'bold 11px monospace';
  ctx!.fillText(`NV ${d.nivel}`, x, L.xpLabelY);
  const xpW = 110;
  ctx!.fillStyle = 'rgba(0,0,0,0.5)';
  ctx!.fillRect(x + 40, L.xpBarY, xpW, 4);
  ctx!.fillStyle = PALETTE.moss;
  ctx!.fillRect(x + 40, L.xpBarY, xpW * Math.min(1, d.xpAtual / Math.max(1, d.xpNecessario)), 4);
  // sem o contorno a barra vazia (0 XP) some no chão escuro do dungeon
  ctx!.strokeStyle = 'rgba(200,184,144,0.25)';
  ctx!.lineWidth = 1;
  ctx!.strokeRect(x + 40.5, L.xpBarY + 0.5, xpW - 1, 3);

  // linha única com as 3 skills (antes empilhadas para y negativo, fora da tela)
  const skillY = L.skillY;
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
    ctx!.font = 'bold 11px monospace';
    ctx!.textAlign = 'center';
    ctx!.textBaseline = 'middle';
    ctx!.fillText(s.key, sx + size / 2, skillY + size / 2);

    ctx!.textBaseline = 'alphabetic';
    ctx!.fillStyle = PALETTE.textOff;
    ctx!.font = '11px monospace';
    ctx!.fillText(s.name.toUpperCase(), sx + size / 2, skillY + size + 9);
  });
  ctx!.textAlign = 'left';
}

export interface HudMedida {
  texto: string;
  /** Largura real em pixels (measureText). */
  largura: number;
  /** Largura disponível na caixa que a contém. */
  caixa: number;
  caixaNome: string;
  /** Camada da coluna esquerda, para a prova checar a folga vertical. */
  camada?: string;
  camadaY?: number;
  camadaFim?: number;
  alturaFonte?: number;
}

/**
 * Mede o HUD em pixels, para o `hud-proof.mjs` (regra 16).
 *
 * `getHudHintsLayout` prova que as caixas não se sobrepõem ENTRE SI; não prova
 * que o texto CABE dentro delas. Monospace de 11px mede ~6.6px por caractere, e
 * um rótulo 3px mais largo que a coluna invade a layer vizinha sem nenhum
 * `expect` accusing — foi o que o jogador viu: a barra de vida colada na de XP e
 * o `DASH` encostando em `1-9: trocar arma`.
 *
 * A medição usa o próprio `measureText` do canvas, na resolução real.
 */
export function medirHud(d: HudData): HudMedida[] {
  if (!ctx) return [];
  const L = getHudHintsLayout();
  const c = ctx;
  const medir = (texto: string, fonte: string): number => {
    const anterior = c.font;
    c.font = fonte;
    const w = c.measureText(texto).width;
    c.font = anterior;
    return w;
  };
  const partes: HudMedida[] = [];
  const push = (texto: string, fonte: string, caixa: number, caixaNome: string, camada?: string, camadaY?: number, camadaFim?: number) => {
    const px = parseInt(fonte.match(/(\d+)px/)?.[1] ?? '11', 10);
    partes.push({ texto, largura: medir(texto, fonte), caixa, caixaNome, camada, camadaY, camadaFim, alturaFonte: px });
  };

  // a coluna esquerda tem SIDE_W; a barra de vida cresce com a vida máxima
  const segmentos = Math.min(20, Math.max(4, Math.ceil(d.maxHealth / 25)));
  const larguraVida = segmentos * 18 + 4;
  const col = Math.min(SIDE_W, larguraVida + 62 + Math.min(6, d.shield) * 10);

  push(`${Math.ceil(d.health)}/${Math.round(d.maxHealth)}`, 'bold 13px monospace', col, 'coluna esquerda', 'vidaFim', 12, 12 + 12);
  push(`NV ${d.nivel}`, 'bold 11px monospace', 34, 'antes da barra de XP', 'xpRotuloY', L.xpLabelY - 9, L.xpLabelY + 2);
  push(d.skills.map(s => s.name.toUpperCase()).join(' '), '11px monospace', SIDE_W, 'coluna esquerda', 'skillRotuloY', L.skillLabelY - 9, L.skillLabelY + 2);
  push('1-9: trocar arma · TAB: ficha', '11px monospace', SIDE_W, 'coluna esquerda', 'hintsY', L.hintsY - 9, L.hintsY + 2);

  // ficha mini (canto inferior direito) e painel de combos do TAB: as caixas
  // vêm da metade direita da tela na resolução atual (o vizinho mais próximo
  // é a dica central) e da mesma fórmula de largura do draw.
  const W = c.canvas.width;
  const meiaDireita = W / 2 - INSET;
  if (d.weaponStats) {
    const s = d.weaponStats;
    push(`DANO ${s.damage}${s.bulletCount > 1 ? ` ×${s.bulletCount}` : ''}`, 'bold 12px monospace', meiaDireita, 'metade direita inferior');
    push(`QUALIDADE ${s.quality.toUpperCase()}`, '11px monospace', meiaDireita, 'metade direita inferior');
  }
  push('NENHUM COMBO ATIVO', '13px monospace', getTabPanelWidth(W), 'painel de combos do TAB');
  // a descrição mais longa conhecida — combo novo mais largo que esta linha
  // precisa entrar aqui para a medição pegar.
  push('RPG/Granada + Dano: +40% dano explosivo', '11px monospace', getTabPanelWidth(W), 'painel de combos do TAB');
  return partes;
}

/**
 * Minimapa: mundo → retângulo na tela.
 *
 * Extraído do canto do HUD porque a tela TAB usa o mesmo desenho em escala
 * grande, e duplicar a projection dava dois lugares para o mapa divergir.
 */
export function drawMinimap(d: HudData, x: number, y: number, w: number, h: number): void {
  const sx = w / Math.max(1, d.worldSize.w);
  const sy = h / Math.max(1, d.worldSize.h);
  ctx!.fillStyle = 'rgba(0,0,0,0.55)';
  ctx!.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx!.fillStyle = `rgba(122,154,106,${0.06 + d.minimap.density * 0.06})`;
  ctx!.fillRect(x, y, w, h);

  for (const wall of d.minimap.walls) {
    ctx!.fillStyle = 'rgba(120,120,120,0.5)';
    ctx!.fillRect(x + wall.x * sx, y + wall.y * sy, Math.max(1, wall.w * sx), Math.max(1, wall.h * sy));
  }
  for (const p of d.propDots) {
    ctx!.fillStyle = p.barrel ? PALETTE.terracotta : PALETTE.mustard;
    ctx!.fillRect(x + p.x * sx - 0.5, y + p.y * sy - 0.5, 1.5, 1.5);
  }
  for (const e of d.enemyDots) {
    ctx!.fillStyle = e.boss ? PALETTE.crit : PALETTE.danger;
    ctx!.beginPath();
    ctx!.arc(x + e.x * sx, y + e.y * sy, e.boss ? 2.5 : 1.2, 0, Math.PI * 2);
    ctx!.fill();
  }
  ctx!.fillStyle = PALETTE.moss;
  ctx!.beginPath();
  ctx!.arc(x + d.player.x * sx, y + d.player.y * sy, 2.2, 0, Math.PI * 2);
  ctx!.fill();

  ctx!.strokeStyle = PALETTE.panelEdge;
  ctx!.lineWidth = 1;
  ctx!.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

/**
 * Tela TAB: minimapa grande à esquerda, ficha da arma à direita.
 *
 * TAB não estava ligado em lugar nenhum. O minimapa do canto é pequeno demais
 * para ler a sala, e nenhum lugar do jogo mostrava dano, cadência ou DPS real —
 * a loja imprimia `damage × qualidade` e ignorava upgrade, combo, classe e
 * peça, então o número mostrado não era o número do tiro.
 */
/** Largura do painel direito do TAB, partilhada por draw e medição. */
export function getTabPanelWidth(W: number): number {
  return Math.min(520, (W - 40 * 3 - 24) / 2);
}

export function drawTabScreen(d: HudData, W: number, H: number): void {
  ctx!.save();
  // 0.94 e não 0.8: com o mundo aparecendo, a barra de boss, as skills e o
  // rodapé de munição atravessavam o painel e viravam ruído atrás do texto.
  ctx!.fillStyle = 'rgba(0,0,0,0.94)';
  ctx!.fillRect(0, 0, W, H);

  const pad = 40;
  const gap = 24;
  const panelW = getTabPanelWidth(W);
  const mapW = panelW;
  const mapH = Math.round(mapW * (d.worldSize.h / Math.max(1, d.worldSize.w)));
  const top = Math.max(pad, (H - Math.max(mapH, 300)) / 2);

  ctx!.fillStyle = PALETTE.textOff;
  ctx!.font = '11px monospace';
  ctx!.textAlign = 'left';
  ctx!.fillText('TAB · MAPA', pad, top - 10);
  drawMinimap(d, pad, top, mapW, mapH);

  const x2 = pad + mapW + gap;
  ctx!.fillText('COMBOS ATIVOS', x2, top - 10);

  // Os combos trocaram de lugar com a ficha da arma (rodada do dono
  // 2026-10-12): a ficha mini ficou no canto inferior direito do HUD, e o
  // TAB passou a listar o que está ativo — nome, descrição e a cor do combo.
  ctx!.font = '13px monospace';
  if (d.combos.length === 0) {
    ctx!.fillStyle = PALETTE.textDim;
    ctx!.fillText('NENHUM COMBO ATIVO', x2, top + 24);
    ctx!.font = '11px monospace';
    ctx!.fillStyle = PALETTE.textOff;
    ctx!.fillText('DEGRAUS DA ESCADA + A ARMA CERTA ATIVAM', x2, top + 44);
  } else {
    d.combos.forEach((c, i) => {
      const y = top + 30 + i * 34;
      ctx!.fillStyle = c.color;
      ctx!.font = 'bold 13px monospace';
      ctx!.fillText(c.name, x2, y);
      ctx!.fillStyle = PALETTE.textOff;
      ctx!.font = '11px monospace';
      ctx!.fillText(c.description, x2, y + 15);
    });
  }

  ctx!.textAlign = 'left';
  ctx!.font = '11px monospace';
  ctx!.fillStyle = PALETTE.textOff;
  // Dentro da área do mapa, não no rodapé da tela: embaixo colidia com o
  // nome da arma e a barra de munição.
  ctx!.fillText('SOLTE TAB PARA VOLTAR', pad, top + mapH + 22);
  ctx!.restore();
  ctx!.textAlign = 'left';
}

function drawTopRight(d: HudData, W: number, _H: number): void {
  const mmW = 150;
  const mmH = Math.round(mmW * (d.worldSize.h / Math.max(1, d.worldSize.w)));
  const mmX = W - mmW - INSET;
  const mmY = INSET;

  ctx!.textAlign = 'right';
  ctx!.fillStyle = PALETTE.mustard;
  ctx!.font = 'bold 15px monospace';
  ctx!.fillText(`${d.coins}$`, W - INSET, mmY + 11);

  ctx!.fillStyle = PALETTE.terracotta;
  ctx!.font = 'bold 14px monospace';
  ctx!.fillText(`HOSTIS ${d.enemies}`, W - INSET, mmY + 26);

  // minimapa: agora mapeia mundo → minimapa, então é informativo de verdade
  drawMinimap(d, mmX, mmY + 36, mmW, mmH);

  // timers de power-up ativo, logo abaixo do minimapa
  let px = W - INSET - 10;
  const py = mmY + 36 + mmH + 14;
  for (const key of Object.keys(d.activePowerups)) {
    const meta = d.powerupMeta[key];
    if (!meta) continue;
    ctx!.fillStyle = meta.color;
    ctx!.beginPath();
    ctx!.arc(px, py, 8, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.fillStyle = '#111';
    ctx!.font = 'bold 10px monospace';
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
function drawBossBar(d: HudData, W: number, y: number): void {
  const b = d.boss!;
  const w = Math.min(460, W * 0.5);
  const x = W / 2 - w / 2;

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
  ctx!.font = b.telegraphing ? 'bold 11px monospace' : '11px monospace';
  // During a telegraph the label says WHICH action is coming. It was hardcoded
  // "PREPARANDO..." before: the 9 bosses each declare a telegraph text in
  // EnemyType.pattern and none of it reached the screen — the VIGIA's whole
  // job is to teach the fight, and it was saying the same thing as the Mothership.
  const texto = b.telegraphing && b.telegraphLabel ? `${b.name} — ${b.telegraphLabel}` : b.name;
  ctx!.fillText(texto, W / 2, y + 21);
  ctx!.textAlign = 'left';
}

/** Faixa de aviso ambiental (destrava o relâmpago invisível de 40 de dano). */
function drawWarningStrip(d: HudData, W: number, y: number): void {
  if (d.warnings.length === 0) return;
  const labels: Record<string, string> = {
    earthquake: 'TERREMOTO',
    lightning: 'RELÂMPAGO',
    storm: 'TEMPESTADE',
  };
  const stripH = 20;
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
  ctx!.font = 'bold 13px monospace';
  ctx!.fillText(`${labels[warn.type] ?? warn.type} EM ${Math.ceil(warn.timeLeft)}s`, W / 2, y + 14);
  ctx!.globalAlpha = 1;
  ctx!.textAlign = 'left';
}

/** Rodapé esquerdo: arma + munição segmentada + arco de recarga. */
function drawBottomLeft(d: HudData, H: number): void {
  const x = INSET;
  let y = H - INSET - 22;

  ctx!.fillStyle = PALETTE.text;
  ctx!.font = 'bold 15px monospace';
  ctx!.textAlign = 'left';
  ctx!.fillText(d.weapon, x, y);

  ctx!.font = '13px monospace';
  ctx!.fillStyle = PALETTE.textDim;
  ctx!.textAlign = 'right';
  const textoDireita = d.reloading ? 'RECARREGANDO' : `${d.ammo}/${d.maxAmmo}`;
  // largura da coluna direita: "RECARREGANDO" tem ~108px, a munição ~52. O
  // maior dos dois é que define o limite, senão um nome com condição longa
  // (Metralhadora CORROÍDA) atropela o contador.
  const larguraDireita = Math.max(
    ctx!.measureText('RECARREGANDO').width,
    ctx!.measureText(`${d.ammo}/${d.maxAmmo}`).width,
  );
  ctx!.fillText(textoDireita, x + 200, y);
  ctx!.textAlign = 'left';

  // A condição da arma fica sempre visível. Antes só existia num toast de 2s
  // no ato de equipar: durante a fase inteira o jogador não tinha como saber
  // que estava com uma enferrujada. Quando não cabe ao lado do nome, sobe uma
  // linha em vez de invadir a coluna da munição.
  if (d.weaponCondition) {
    const nomeLargura = ctx!.measureText(d.weapon).width;
    const condLargura = ctx!.measureText(d.weaponCondition).width;
    const cabeAoLado = x + nomeLargura + 8 + condLargura <= x + 200 - larguraDireita - 8;
    ctx!.fillStyle = d.weaponConditionColor;
    ctx!.font = '11px monospace';
    ctx!.fillText(d.weaponCondition, cabeAoLado ? x + nomeLargura + 8 : x, cabeAoLado ? y : y - 15);
  }

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

  if (isJammed()) {
    ctx!.fillStyle = PALETTE.danger;
    ctx!.font = 'bold 13px monospace';
    ctx!.fillText('ENCASQUILHADA — CONSERTANDO', x, y + 26);
  }
  if (d.reloading) {
    // empilhada ABAIXO da munição (y+14): antes desenhava no mesmo y e cobria a barra
    const ry = y + 14;
    ctx!.fillStyle = 'rgba(0,0,0,0.55)';
    ctx!.fillRect(x - 2, ry - 2, barW + 4, 14);
    ctx!.fillStyle = PALETTE.mustard;
    ctx!.fillRect(x, ry, barW * d.reloadProgress, 10);
    ctx!.fillStyle = PALETTE.mustard;
    ctx!.font = '11px monospace';
    ctx!.fillText('RECARGA', x, ry + 24);
  }
}

/** Rodapé direito: chips de combo ativos. */
/**
 * Ficha mini da arma no canto inferior direito.
 *
 * Trocou de lugar com os combos (rodada do dono 2026-10-12): a leitura de
 * "vale a pena esta arma" fica sempre visível durante o combate, e os combos
 * ativos vão para o TAB, junto do mapa. Só o essencial aqui — o TAB tem a
 * ficha completa para quem quiser parar e ler.
 */
function drawFichaMini(d: HudData, W: number, H: number): void {
  const s = d.weaponStats;
  if (!s) return;
  let y = H - INSET - 12;
  ctx!.textAlign = 'right';
  const linha = (texto: string, fonte: string, cor: string) => {
    ctx!.fillStyle = 'rgba(0,0,0,0.5)';
    ctx!.font = fonte;
    const w = ctx!.measureText(texto).width;
    ctx!.fillRect(W - INSET - w - 14, y - 11, w + 14, 15);
    ctx!.fillStyle = cor;
    ctx!.fillText(texto, W - INSET - 8, y);
    y -= 20;
  };
  linha(`DANO ${s.damage}${s.bulletCount > 1 ? ` ×${s.bulletCount}` : ''}`, 'bold 12px monospace', PALETTE.text);
  linha(`DPS EFETIVO ${s.dps}`, '11px monospace', PALETTE.textOff);
  linha(`QUALIDADE ${s.quality.toUpperCase()}`, '11px monospace', s.qualityColor);
  ctx!.textAlign = 'left';
}

/**
 * Teclas que existem no jogo e não apareciam em lugar nenhum.
 *
 * `H` (medkit), `J` (NPC parar de seguir) e `1-9` (equipar arma) só saíam num
 * damage number temporário depois de acontecer. Agora ficam sempre visíveis.
 *
 * Fica sob as skills, no topo esquerdo: embaixo colidiria com a dica do
 * tutorial, que é centralizada e cresce para os dois lados.
 */
function drawKeyHints(d: HudData): void {
  const partes: string[] = [];
  if (d.medkits > 0) partes.push(`H: medkit (${d.medkits})`);
  if (d.hasNpc) partes.push(d.npcFollowing ? 'J: seguindo' : 'J: parado');
  partes.push('1-9: trocar arma');
  partes.push('TAB: ficha');

  ctx!.fillStyle = PALETTE.textOff;
  ctx!.font = '11px monospace';
  ctx!.textAlign = 'left';
  ctx!.fillText(partes.join('  ·  '), INSET, getHudHintsLayout().hintsY);
}

/** Rodapé central: dica do tutorial (o texto já traz a tecla). */
function drawHint(d: HudData, W: number, H: number): void {
  if (!d.hint) return;
  const text = d.hint.text;
  ctx!.font = '13px monospace';
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
/**
 * Contagem regressiva do fim de fase.
 *
 * A pausa antes da loja é para o loot do último abate ser visto. Sem o número
 * na tela ela vira tempo morto: o jogador lê como travamento.
 */
function drawPhaseEndCountdown(d: HudData, W: number, H: number): void {
  if (d.phaseEndSeconds <= 0) return;
  const restante = Math.ceil(d.phaseEndSeconds);
  const fade = Math.min(1, d.phaseEndSeconds);
  ctx!.save();
  ctx!.textAlign = 'center';
  ctx!.globalAlpha = fade;
  ctx!.font = 'bold 64px monospace';
  ctx!.fillStyle = PALETTE.title;
  ctx!.shadowColor = 'rgba(0,0,0,0.8)';
  ctx!.shadowBlur = 10;
  ctx!.fillText(String(restante), W / 2, H * 0.42);
  ctx!.shadowBlur = 0;
  ctx!.font = '13px monospace';
  ctx!.fillStyle = PALETTE.textDim;
  ctx!.fillText('COLETANDO O QUE SOBROU', W / 2, H * 0.42 + 24);
  ctx!.restore();
  ctx!.globalAlpha = 1;
  ctx!.textAlign = 'left';
}

function drawToasts(d: HudData, W: number): void {
  // começa logo abaixo dos timers de power-up, não em y fixo que fura o minimapa
  const mmH = Math.round(150 * (d.worldSize.h / Math.max(1, d.worldSize.w)));
  let y = INSET + 36 + mmH + 34;
  ctx!.textAlign = 'right';
  for (let i = d.toasts.length - 1; i >= 0; i--) {
    const t = d.toasts[i];
    const alpha = Math.min(1, t.time);
    ctx!.globalAlpha = alpha;
    ctx!.fillStyle = PALETTE.panel;
    // O rótulo distingue conquista de troca de arma. Sem isso, anunciar a arma
    // empilhava no mesmo canal e o HUD imprimia "CONQUISTA: ARMANDO: ...".
    // `aviso` não tem rótulo: aviso de fase e entrada de diário não são
    // conquista, e o prefixo mentia sobre o que aconteceu.
    const rotulo = t.kind === 'achievement' ? 'CONQUISTA: ' : t.kind === 'equip' ? 'EQUIPADA: ' : '';
    const texto = rotulo + t.name;
    ctx!.font = 'bold 12px monospace';
    const w = ctx!.measureText(texto).width + 16;
    ctx!.fillRect(W - INSET - w, y - 11, w, 16);
    ctx!.fillStyle = t.kind === 'achievement' ? PALETTE.mustard : PALETTE.stone;
    ctx!.fillText(texto, W - INSET - 8, y);
    y += 20;
  }
  ctx!.globalAlpha = 1;
  ctx!.textAlign = 'left';
}
