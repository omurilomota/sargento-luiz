/**
 * Sistema de renderização Canvas 2D.
 *
 * Menu, cutscene, game over, entidades do mundo e a caixa de pausa.
 * O HUD inteiro vive em `ui/hud.ts` — aqui não há mais barra de score, nem
 * log de dano, nem minimapa, nem skills, nem indicador de combo: eram quatro
 * layers diferentes brigando pelo mesmo canto da tela.
 *
 * Tudo o que é do MUNDO é desenhado em coordenadas de mundo (o `main.ts`
 * aplica a translação da câmera uma vez por frame).
 */

import { Enemy, Bullet, Particle, Coin, PowerUp } from '../types';
import { Player } from '../entities/player';
import { ENEMY_TYPES, POWERUP_TYPES } from '../config';
import { hasPowerUp } from '../powerups';
import { isSkillActive } from './skills';
import { getSprite, getEnemyCharacter, poseKey, drawSpriteFit, Pose, isSpritesEnabled } from './sprites';
import { getIsReloading } from '../weapons';
import { getCurrentCutscene, getCurrentLine, isLineComplete, getTextProgress, getPortraitInfo, isWaitingForChoice } from './story';
import { getEquippedSkin } from './skins';
import { hasSave } from './saveSystem';
import { getLeaderboard } from './leaderboard';
import { PALETTE } from '../core/palette';
import { GAME_MODES } from './gameModes';
import { CLASSES, ClassId } from './classes';
import {
  getMasterVolume, getMusicVolume, getSfxVolume,
  setMasterVolume, setMusicVolume, setSfxVolume,
} from './audio';

/** Contexto 2D do canvas */
let ctx: CanvasRenderingContext2D;
/** Elemento canvas principal */
let canvas: HTMLCanvasElement;

/** Inicializa o renderer com o canvas e contexto fornecidos. */
export function initRenderer(canvasEl: HTMLCanvasElement, ctxEl: CanvasRenderingContext2D): void {
  canvas = canvasEl;
  ctx = ctxEl;
}

// ─── Menu ───────────────────────────────────────────────────────

export interface MenuItemLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Calcula o layout do menu. Draw e hit-test consomem a MESMA função — antes o
 * clique usava `height/2 + i*50` e o draw usava `H*0.28 + i*modeSpacing`, então
 * clicar num modo selecionava outro.
 * @param w - largura do canvas
 * @param h - altura do canvas
 */
export function getMenuLayout(w: number, h: number): { titleY: number; items: MenuItemLayout[]; classItems: MenuItemLayout[]; settingsRow: MenuItemLayout | null } {
  const startY = h * 0.3;
  const spacing = Math.min(46, (h * 0.5) / GAME_MODES.length);
  const boxW = Math.min(340, w * 0.7);
  const boxH = Math.min(32, spacing - 6);
  const classStartY = startY + GAME_MODES.length * spacing + 30;
  const classSpacing = Math.min(36, (h * 0.3) / 4);
  // row de configurações: só quando cabe acima do rodapé (h*0.88).
  // Em 800x480 não cabe — a tecla O continua funcionando.
  const settingsY = classStartY + 4 * classSpacing + 22;
  const settingsRow: MenuItemLayout | null =
    settingsY + (classSpacing - 4) <= h * 0.88
      ? { x: w / 2 - boxW / 2, y: settingsY, w: boxW, h: classSpacing - 4 }
      : null;
  return {
    titleY: h * 0.12,
    items: GAME_MODES.map((_, i) => ({
      x: w / 2 - boxW / 2,
      y: startY + i * spacing,
      w: boxW,
      h: boxH,
    })),
    classItems: [0, 1, 2, 3].map(i => ({
      x: w / 2 - boxW / 2,
      y: classStartY + i * classSpacing,
      w: boxW,
      h: classSpacing - 4,
    })),
    settingsRow,
  };
}

/**
 * Retorna o índice do modo sob o clique, ou -1.
 * Também verifica seleção de classe (retorna 100 + índice da classe)
 * e a row de configurações (retorna 200).
 */
export function menuIndexAt(x: number, y: number, w: number, h: number): number {
  const L = getMenuLayout(w, h);
  for (let i = 0; i < L.items.length; i++) {
    const r = L.items[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  for (let i = 0; i < L.classItems.length; i++) {
    const r = L.classItems[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return 100 + i;
  }
  if (L.settingsRow) {
    const r = L.settingsRow;
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return 200;
  }
  return -1;
}

/**
 * Tile do pack que texturiza o fundo do menu: rocha escura de baixo
 * contraste (piso de caverna — média 75/255 e desvio 11, a mais
 * escura com textura entre os tiles do `TILE_NUMBERS`).
 */
const MENU_TILE = 'tile_31';

/** Fundo prerenderizado do menu (null antes do primeiro draw). */
let menuBg: HTMLCanvasElement | null = null;
/** Resolução do fundo prerenderizado — o offscreen é por (W,H). */
let menuBgKey = '';

/**
 * Fundo do menu: tile do pack desenhado 1× num offscreen por resolução,
 * coberto de quase-preto e vinheta radial (o único gradiente permitido).
 * Sem tile carregado o fundo é o quase-preto liso — fallback silencioso,
 * sem desenho procedural (regra 15).
 */
function drawMenuBackground(W: number, H: number): void {
  const key = `${W}x${H}`;
  if (!menuBg || menuBgKey !== key) {
    menuBg = document.createElement('canvas');
    menuBg.width = W;
    menuBg.height = H;
    const c = menuBg.getContext('2d')!;
    c.fillStyle = PALETTE.void;
    c.fillRect(0, 0, W, H);
    const tile = getSprite(MENU_TILE);
    if (tile) {
      const S = 64;
      for (let y = 0; y < H; y += S) {
        for (let x = 0; x < W; x += S) {
          c.drawImage(tile, x, y, S, S);
        }
      }
    }
    c.fillStyle = 'rgba(8,8,10,0.72)';
    c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.5)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    menuBgKey = key;
  }
  ctx.drawImage(menuBg, 0, 0);
}

export function drawMenu(selectedMode: string = 'campaign', selectedClass: ClassId = 'soldado'): void {
  const W = canvas.width;
  const H = canvas.height;
  const L = getMenuLayout(W, H);

  drawMenuBackground(W, H);

  // poeira de fundo — poucas partículas, cor do tema
  for (let i = 0; i < 8; i++) {
    const x = (i * 137 + Date.now() / 40) % W;
    const y = (i * 89 + Date.now() / 50) % H;
    ctx.fillStyle = `rgba(180,160,130,${0.08 + Math.sin(Date.now() / 2000 + i) * 0.04})`;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // preview da classe: esquerda (assimetria orgânica), reage à seleção.
  // Só em tela larga e com o sprite do pack — sem ele, nada se desenha.
  const cls = CLASSES.find(c => c.id === selectedClass) ?? CLASSES[0];
  const preview = W >= 900 ? getSprite(poseKey(cls.sprite, 'hold')) : null;
  if (preview) {
    const px = W * 0.2;
    const py = H * 0.52;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(px, py + 52, 44, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    drawSpriteFit(ctx, preview, px, py, 130, -0.15);
  }

  // título — a 1 exceção de sombra permitida (elemento-chave da tela)
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.title;
  ctx.font = 'bold 48px monospace';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 8;
  ctx.fillText('ASHFALL', W / 2, L.titleY);
  ctx.shadowBlur = 0;

  ctx.fillStyle = PALETTE.textOff;
  ctx.font = '12px monospace';
  ctx.fillText('PÓS-APOCALÍPTICO', W / 2, L.titleY + 24);

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.3, L.titleY + 36);
  ctx.lineTo(W * 0.7, L.titleY + 36);
  ctx.stroke();

  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '11px monospace';
  ctx.fillText('SELECIONE O MODO (1-4)', W / 2, L.items[0].y - 14);

  const hoveredMode = menuIndexAt(uiMouse.x, uiMouse.y, W, H);
  GAME_MODES.forEach((mode, i) => {
    const r = L.items[i];
    const isSelected = mode.mode === selectedMode;
    const isHovered = i === hoveredMode;

    ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.07)' : isHovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)';
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, 3);
    ctx.fill();

    ctx.strokeStyle = isSelected ? mode.color : isHovered ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)';
    ctx.lineWidth = isSelected ? 1.5 : 0.5;
    ctx.stroke();

    // barra de acento do modo selecionado
    if (isSelected) {
      ctx.fillStyle = mode.color;
      ctx.fillRect(r.x, r.y, 3, r.h);
    }

    const midY = r.y + r.h / 2 + 4;
    ctx.textAlign = 'left';
    if (isSelected) {
      ctx.fillStyle = mode.color;
      ctx.font = '11px monospace';
      ctx.fillText('>', r.x + 8, midY);
    }
    ctx.fillStyle = isSelected ? PALETTE.text : mode.color;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(mode.key, r.x + 22, midY);
    ctx.fillStyle = isSelected ? PALETTE.text : '#aaa';
    ctx.font = '12px monospace';
    ctx.fillText(mode.name, r.x + 42, midY);
    ctx.fillStyle = isSelected ? PALETTE.textDim : PALETTE.textOff;
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(mode.desc, r.x + r.w - 10, midY);
    ctx.textAlign = 'center';
  });

  // ── SELEÇÃO DE CLASSE ──
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '11px monospace';
  ctx.fillText('SELECIONE A CLASSE', W / 2, L.classItems[0].y - 14);

  CLASSES.forEach((clsDef, i) => {
    const r = L.classItems[i];
    const isSelected = clsDef.id === selectedClass;
    const isHovered = 100 + i === hoveredMode;

    ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.07)' : isHovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)';
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, 3);
    ctx.fill();

    ctx.strokeStyle = isSelected ? clsDef.color : isHovered ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)';
    ctx.lineWidth = isSelected ? 1.5 : 0.5;
    ctx.stroke();

    // barra de acento da classe selecionada
    if (isSelected) {
      ctx.fillStyle = clsDef.color;
      ctx.fillRect(r.x, r.y, 3, r.h);
    }

    const midY = r.y + r.h / 2 + 4;
    ctx.textAlign = 'left';
    if (isSelected) {
      ctx.fillStyle = clsDef.color;
      ctx.font = '11px monospace';
      ctx.fillText('>', r.x + 8, midY);
    }
    ctx.fillStyle = isSelected ? PALETTE.text : clsDef.color;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(clsDef.name, r.x + 22, midY);
    ctx.fillStyle = isSelected ? PALETTE.textDim : PALETTE.textOff;
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(clsDef.desc, r.x + r.w - 10, midY);
    ctx.textAlign = 'center';
  });

  // ── CONFIGURAÇÕES (row, quando cabe na tela) ──
  if (L.settingsRow) {
    const r = L.settingsRow;
    const isHovered = hoveredMode === 200;

    ctx.fillStyle = isHovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)';
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, 3);
    ctx.fill();

    ctx.strokeStyle = isHovered ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    const midY = r.y + r.h / 2 + 4;
    ctx.textAlign = 'center';
    ctx.fillStyle = isHovered ? PALETTE.text : PALETTE.textDim;
    ctx.font = '12px monospace';
    ctx.fillText('CONFIGURAÇÕES (O)', W / 2, midY);
  }

  ctx.fillStyle = PALETTE.textOff;
  ctx.font = '10px monospace';
  ctx.fillText('WASD: Mover | Mouse: Mirar | Click: Atirar', W / 2, H * 0.88);
  ctx.fillText('Espaco: Dash | F: Escudo | E: Furia | R: Recarregar', W / 2, H * 0.88 + 14);
  ctx.fillText('M: Musica | S: Efeitos | O: Configurações', W / 2, H * 0.88 + 28);
  ctx.fillText('V: Créditos', W / 2, H * 0.88 + 42);

  if (hasSave()) {
    ctx.fillStyle = PALETTE.mustard;
    ctx.font = '12px monospace';
    ctx.fillText('C: Continuar jogo salvo', W / 2, H * 0.94 - 18);
  }

  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '13px monospace';
  const pulse = 0.3 + Math.sin(Date.now() / 600) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillText('ENTER para jogar', W / 2, H * 0.94);
  ctx.globalAlpha = 1;

  // crédito das faixas — obrigatório por licença
  ctx.fillStyle = '#333';
  ctx.font = '9px monospace';
  ctx.fillText('Música: faixas originais do projeto (CC0) — assets/music/CREDITS.md', W / 2, H - 12);
}

// ─── Cutscene ───────────────────────────────────────────────────

export function drawCutscene(): void {
  const cutscene = getCurrentCutscene();
  const line = getCurrentLine();
  const portrait = getPortraitInfo(line.speaker);
  const progress = getTextProgress();
  const complete = isLineComplete();

  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawCutsceneScene(cutscene.title);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvas.width * 0.15, canvas.height * 0.18);
  ctx.lineTo(canvas.width * 0.85, canvas.height * 0.18);
  ctx.stroke();

  ctx.fillStyle = cutscene.color;
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(cutscene.title, canvas.width / 2, canvas.height * 0.15);

  const portraitX = canvas.width * 0.2;
  const portraitY = canvas.height * 0.45 + Math.sin(Date.now() / 800) * 4;
  const portraitR = 35;

  // Sprite do personagem (Kenney) em vez do círculo procedural com iniciais.
  // O fallback só entra quando o asset não carregou — narrador e mensagem são
  // entidades sem forma física, então não têm sprite por design (Regra 15).
  const portraitImg = portrait.sprite ? getSprite(portrait.sprite) : null;
  if (portraitImg) {
    const targetH = portraitR * 1.8;
    const iw = portraitImg.naturalWidth || portraitImg.width;
    const ih = portraitImg.naturalHeight || portraitImg.height;
    const sw = iw * (targetH / ih);
    ctx.drawImage(portraitImg, portraitX - sw / 2, portraitY - targetH / 2, sw, targetH);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.arc(portraitX, portraitY, portraitR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = portrait.color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = portrait.color;
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(portrait.name, portraitX + portraitR + 16, portraitY - 10);

  const displayedText = line.text.substring(0, Math.floor(progress));
  ctx.fillStyle = '#bbb';
  ctx.font = '16px monospace';
  wrapText(ctx, displayedText, portraitX + portraitR + 16, portraitY + 10, canvas.width * 0.6, 22);

  if (isWaitingForChoice() && line.choices) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - 200, canvas.height / 2 + 30, 400, line.choices.length * 40 + 20, 5);
    ctx.fill();
    line.choices.forEach((choice, i) => {
      ctx.fillStyle = PALETTE.mustard;
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}. ${choice.text}`, canvas.width / 2, canvas.height / 2 + 50 + i * 40);
    });
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '11px monospace';
    ctx.fillText('Pressione 1, 2 ou 3', canvas.width / 2, canvas.height / 2 + 50 + line.choices.length * 40 + 10);
  }

  if (complete && !isWaitingForChoice()) {
    ctx.fillStyle = PALETTE.textOff;
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 500) * 0.3;
    ctx.fillText('BACKSPACE ou Ç >>', canvas.width - 30, canvas.height - 30);
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath();
  ctx.moveTo(canvas.width * 0.15, canvas.height * 0.82);
  ctx.lineTo(canvas.width * 0.85, canvas.height * 0.82);
  ctx.stroke();
}

function drawCutsceneScene(title: string): void {
  const t = Date.now() / 1000;
  ctx.globalAlpha = 0.15;
  if (title === 'FLORESTA') {
    for (let i = 0; i < 8; i++) {
      const tx = (i * 130 + 40) % canvas.width;
      const ty = canvas.height * 0.85 + Math.sin(t + i) * 3;
      ctx.fillStyle = '#2a4a2a';
      ctx.fillRect(tx - 4, ty - 60, 8, 60);
      ctx.beginPath();
      ctx.arc(tx, ty - 70, 25, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (title === 'CAVERNA') {
    for (let i = 0; i < 10; i++) {
      const sx = (i * 100 + 20) % canvas.width;
      ctx.fillStyle = '#3a3a5a';
      ctx.beginPath();
      ctx.moveTo(sx - 8, 0);
      ctx.lineTo(sx, 40 + Math.sin(t + i) * 5);
      ctx.lineTo(sx + 8, 0);
      ctx.fill();
    }
  } else if (title === 'ESPAÇO' || title === 'ESPAÇO'.toUpperCase()) {
    for (let i = 0; i < 20; i++) {
      const sx = (i * 97 + 13) % canvas.width;
      const sy = (i * 73 + 7) % canvas.height;
      ctx.fillStyle = '#ccc';
      ctx.beginPath();
      ctx.arc(sx, sy, 1 + Math.sin(t * 2 + i) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (title === 'VULCÃO') {
    const g = ctx.createRadialGradient(canvas.width / 2, canvas.height, 0, canvas.width / 2, canvas.height, canvas.height * 0.6);
    g.addColorStop(0, '#6b2010');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
  let line = '';
  let currentY = y;
  for (const word of text.split(' ')) {
    const testLine = `${line}${word} `;
    if (context.measureText(testLine).width > maxWidth && line !== '') {
      context.fillText(line.trim(), x, currentY);
      line = `${word} `;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line.trim(), x, currentY);
}

// ─── Game Over ──────────────────────────────────────────────────

export function drawGameOver(score: number, killStreak: number): void {
  drawEndScreen('GAME OVER', PALETTE.terracotta, score, killStreak);
}

// ─── Vitória ────────────────────────────────────────────────────
// Antes a última fase caía no mesmo drawGameOver: zerar o jogo lia como derrota.
// Vitória usa o verde-musgo do jogador e texto próprio; morte continua terracota.
export function drawVictory(score: number, killStreak: number): void {
  drawEndScreen('VITÓRIA — AS CINZAS ASSENTAM', PALETTE.moss, score, killStreak);
}

function drawEndScreen(title: string, titleColor: string, score: number, killStreak: number): void {
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = titleColor;
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, W / 2, H * 0.12);

  ctx.fillStyle = PALETTE.text;
  ctx.font = '18px monospace';
  ctx.fillText(`Pontos: ${score}`, W / 2, H * 0.22);
  ctx.fillText(`Abates: ${killStreak}`, W / 2, H * 0.28);

  const lb = getLeaderboard();
  if (lb.length > 0) {
    ctx.fillStyle = PALETTE.mustard;
    ctx.font = 'bold 14px monospace';
    ctx.fillText('RECORDES', W / 2, H * 0.38);
    ctx.font = '12px monospace';
    lb.slice(0, 5).forEach((entry, i) => {
      const y = H * 0.44 + i * 22;
      const isNew = entry.score === score;
      ctx.fillStyle = isNew ? PALETTE.mustard : PALETTE.textDim;
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}. ${entry.name}`, W / 2 - 120, y);
      ctx.textAlign = 'right';
      ctx.fillText(`${entry.score} pts`, W / 2 + 120, y);
    });
    ctx.textAlign = 'center';
  }

  ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 600) * 0.3;
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '13px monospace';
  ctx.fillText('ENTER para voltar ao menu', W / 2, H * 0.85);
  ctx.globalAlpha = 1;
}

// ─── Créditos ────────────────────────────────────────────────

export function drawCredits(): void {
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.title;
  ctx.font = 'bold 28px monospace';
  ctx.fillText('CRÉDITOS', W / 2, H * 0.1);

  const linhas: { texto: string; cor: string; tamanho: string; peso: string }[] = [
    { texto: 'MÚSICA', cor: PALETTE.mustard, tamanho: '13px', peso: 'bold ' },
    { texto: 'Juhani Junkala / SubspaceAudio (CC0) — Post Apocalyptic Wastelands (menu)', cor: PALETTE.text, tamanho: '12px', peso: '' },
    { texto: 'Eric Matyas (soundimage.org) — Automation, Darkness Below, Puzzle Dreams', cor: PALETTE.text, tamanho: '12px', peso: '' },
    { texto: 'Uso gratuito com atribuição desta tela e do CREDITS.md', cor: PALETTE.textDim, tamanho: '11px', peso: '' },
    { texto: '', cor: PALETTE.textDim, tamanho: '11px', peso: '' },
    { texto: 'SFX', cor: PALETTE.mustard, tamanho: '13px', peso: 'bold ' },
    { texto: 'Kenney.nl + OpenGameArt — CC0 (25 efeitos)', cor: PALETTE.text, tamanho: '12px', peso: '' },
    { texto: 'Tiros: Vincent Sevedge (opengameart.org) — CC-BY 3.0', cor: PALETTE.text, tamanho: '12px', peso: '' },
    { texto: '29 efeitos reais em assets/sfx/ (fallback procedural em audio.ts)', cor: PALETTE.textDim, tamanho: '11px', peso: '' },
    { texto: 'Autores por arquivo: assets/CREDITS.md', cor: PALETTE.textDim, tamanho: '11px', peso: '' },
    { texto: '', cor: PALETTE.textDim, tamanho: '11px', peso: '' },
    { texto: 'SPRITES', cor: PALETTE.mustard, tamanho: '13px', peso: 'bold ' },
    { texto: 'Kenney — Top-down Shooter · kenney.nl · CC0', cor: PALETTE.text, tamanho: '12px', peso: '' },
    { texto: 'Personagens, armas e tiles (PNG/Tiles)', cor: PALETTE.textDim, tamanho: '11px', peso: '' },
    { texto: '', cor: PALETTE.textDim, tamanho: '11px', peso: '' },
    { texto: 'CÓDIGO E DESIGN', cor: PALETTE.mustard, tamanho: '13px', peso: 'bold ' },
    { texto: 'ASHFALL — projeto original', cor: PALETTE.text, tamanho: '12px', peso: '' },
  ];

  let y = H * 0.2;
  for (const l of linhas) {
    ctx.fillStyle = l.cor;
    ctx.font = `${l.peso}${l.tamanho} monospace`;
    ctx.fillText(l.texto, W / 2, y);
    y += l.texto === '' ? 10 : 20;
  }

  ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 600) * 0.3;
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '13px monospace';
  ctx.fillText('ENTER ou ESC para voltar', W / 2, H * 0.88);
  ctx.globalAlpha = 1;
}

// ─── Mundo ──────────────────────────────────────────────────────

/**
 * Desenha o terreno tintado do bioma atual.
 * O deslocamento da câmera é feito pela translação do `main.ts`.
 */
export function drawGameBackground(_bg: string, _grid: string, _shake: { x: number; y: number }, _phaseName?: string): void {
  // o terreno é desenhado por `drawTerrain` a partir do canvas offscreen
}

/**
 * Desenha a transição visual entre ondas.
 */
export function drawPhaseTransition(phaseTransition: number, currentWave: number, phaseName: string | undefined): void {
  if (phaseTransition <= 0) return;
  const alpha = Math.min(1, phaseTransition / 1.5);
  ctx.fillStyle = `rgba(0,0,0,${alpha * 0.5})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Onda ${currentWave + 1}`, canvas.width / 2, canvas.height / 2);
  if (phaseName) {
    ctx.font = '24px monospace';
    ctx.fillText(phaseName, canvas.width / 2, canvas.height / 2 + 40);
  }
}

/** Moedas: sem `shadowBlur` por moeda (eram 10 por moeda por frame). */
export function drawCoins(coins: Coin[]): void {
  for (const c of coins) {
    const pulse = 1 + Math.sin(Date.now() / 300 + c.x) * 0.12;
    const alpha = Math.max(0, Math.min(1, c.life / 3));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = PALETTE.mustard;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 7 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a6244';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 4.5 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8c8a0';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', c.x, c.y + 1);
    ctx.textBaseline = 'alphabetic';
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export function drawPowerUps(powerups: PowerUp[]): void {
  for (const p of powerups) {
    const def = POWERUP_TYPES[p.type];
    const bob = Math.sin(Date.now() / 200 + p.x) * 3;
    ctx.globalAlpha = Math.min(1, p.life / 2);
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#111';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.symbol, p.x, p.y + bob);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }
  ctx.globalAlpha = 1;
}

export function drawParticles(particles: Particle[]): void {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.1, p.radius * alpha), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawBullets(bullets: Bullet[]): void {
  for (const b of bullets) {
    const speed = Math.hypot(b.vx, b.vy) || 1;
    const tx = b.x - (b.vx / speed) * 14;
    const ty = b.y - (b.vy / speed) * 14;
    const grad = ctx.createLinearGradient(tx, ty, b.x, b.y);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, b.color);
    ctx.strokeStyle = grad;
    ctx.lineWidth = b.isEnemy ? 4 : 3;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.isEnemy ? 4.5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Escolhe a pose do sprite: dano > tiro > armado parado > andar/parado.
 *
 * Quem atira fica armado o tempo todo, não só nos 0.2s antes do disparo: `gun`
 * e `machine` são as poses com arma na mão, então usá-las só no momento do
 * tiro fazia o atirador aparecer desarmado o resto do tempo. Quem não atira
 * fica em `stand`, a pose sem arma — coerente com um melee.
 *
 * O antigo parâmetro `moving` foi removido: `drawEnemies` passava `true`
 * fixo, então o ramo `moving ? 'stand' : 'hold'` nunca chose o outro lado.
 * `Enemy` não guarda `vx`/`vy` (a direção vem do flow field, recalculada por
 * frame), então não há como derivar "andando" aqui sem guardar estado extra
 * só para isso — e as duas poses são a mesma coisa sem arma.
 * @param e - inimigo
 */
function enemyPose(e: Enemy): Pose {
  if (e.hitFlash > 0) return 'reload';
  if (e.canShoot) return e.shootTimer > e.shootRate - 0.2 ? 'machine' : 'gun';
  return 'stand';
}

/**
 * Desenha os inimigos. A pose vem do pacote Kenney e o pivot é o corpo, então
 * o personagem gira de verdade na direção da mira.
 */
export function drawEnemies(
  enemies: Enemy[],
  playerX: number,
  playerY: number,
  facing: (e: Enemy) => number
): void {
  const spritesOn = isSpritesEnabled();

  for (const e of enemies) {
    if (e.radius <= 0) continue;

    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + e.radius * 0.6, e.radius * 0.72, e.radius * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();

    const def = ENEMY_TYPES[e.type];

    // Chefe ganha um anel no chão, na mesma linguagem das auras do jogador. Sem
    // isso o chefe só se distingue do trash pelo tamanho e pela barra de vida, e
    // num mapa com 12 inimigos o jogador não sabe de relance qual é o alvo.
    //
    // A cor é uma só para todos os chefes, e não a do chefe: com a cor dele o
    // anel do NÚCLEO (#7a7a8a) desaparecia no piso cinza do Bunker. Uma cor
    // única diz "isto é o alvo" sem competir com a paleta do bioma. Terracota é
    // a mesma família da barra de vida do inimigo, então é o mesmo vocabulário.
    // O alpha respira devagar para não se confundir com a elipse estática do
    // hazard no chão.
    if (def?.isBoss) {
      const pulso = 0.5 + Math.sin(Date.now() / 800 + e.x * 0.01) * 0.18;
      ctx.strokeStyle = PALETTE.terracotta;
      ctx.globalAlpha = pulso;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + e.radius * 0.6, e.radius * 1.1, e.radius * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const char = getEnemyCharacter(e.type);
    const pose = enemyPose(e);
    const img = spritesOn ? getSprite(poseKey(char, pose)) : null;

    if (img) {
      drawSpriteFit(ctx, img, e.x, e.y, e.radius * 2.4, facing(e));
      if (e.hitFlash > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(0.55, e.hitFlash * 3);
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else {
      drawEnemyShape(e, def?.isBoss, def?.armor, playerX, playerY);
    }

    if (e.health < e.maxHealth) {
      const barW = Math.max(20, e.radius * 1.9);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(e.x - barW / 2, e.y - e.radius - 12, barW, 4);
      ctx.fillStyle = PALETTE.danger;
      ctx.fillRect(e.x - barW / 2, e.y - e.radius - 12, barW * (e.health / e.maxHealth), 4);
    }
  }
}

function drawEnemyShape(e: Enemy, isBoss: boolean | undefined, armor: boolean | undefined, playerX: number, playerY: number): void {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = e.hitFlash > 0 ? '#ddd' : e.color;
  if (isBoss) ctx.shadowColor = e.color;
  ctx.beginPath();
  if (armor) {
    for (let i = 0; i < 6; i++) {
      const a = e.angle + (i * Math.PI * 2) / 6;
      const r = e.radius * (i % 2 === 0 ? 1 : 0.82);
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
  } else if (isBoss) {
    for (let i = 0; i < 8; i++) {
      const a = e.angle + (i * Math.PI * 2) / 8;
      const r = e.radius * (i % 2 === 0 ? 1 : 0.62);
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
  } else {
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // olhos olham para o jogador (legibilidade de ameaça)
  const look = Math.atan2(playerY - e.y, playerX - e.x);
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  for (const off of [-0.45, 0.45]) {
    const a = look + off;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * e.radius * 0.42, Math.sin(a) * e.radius * 0.42, Math.max(1.2, e.radius * 0.12), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

interface BotLike {
  x: number; y: number; radius: number; color: string; health: number;
  maxHealth: number; name: string; angle: number;
}

/** Bots do modo competitivo (morava inline no main.ts). */
export function drawBots(bots: BotLike[]): void {
  for (const bot of bots) {
    ctx.fillStyle = bot.color;
    ctx.beginPath();
    ctx.arc(bot.x, bot.y, bot.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.moss;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bot.x, bot.y);
    ctx.lineTo(bot.x + Math.cos(bot.angle) * bot.radius, bot.y + Math.sin(bot.angle) * bot.radius);
    ctx.stroke();

    const barW = 32;
    const barX = bot.x - barW / 2;
    const barY = bot.y - bot.radius - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX, barY, barW, 4);
    ctx.fillStyle = bot.color;
    ctx.fillRect(barX, barY, barW * (bot.health / bot.maxHealth), 4);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(bot.name, bot.x, barY - 4);
    ctx.textAlign = 'left';
  }
}

/**
 * Pose do jogador por classe de arma.
 *
 * As poses `gun`/`machine`/`silencer` do pack já desenham o personagem **segurando**
 * a arma — são 16px mais largas que `stand` por causa do cano. `stand` e `hold`
 * são as duas poses sem arma nenhuma. O jogador ficava em `stand` quando não
 * estava atirando, então a arma só aparecia no disparo: parado, o `weapon_*`
 * desenhado na ponta ficava solto ao lado do corpo, e atirando ficavam duas
 * armas (a da pose e a da ponta).
 *
 * Como a arma agora vem da pose, a sprite `weapon_*` da ponta sai: ela duplica
 * o cano, é desenhada dentro de um espaço já rotacionado e depois des-rotacionado
 * (`rotate(-player.angle)` dentro de `rotate(player.angle)`), então ficava
 * sempre na horizontal independente da mira.
 */
const ARMED_POSE: Record<'pistol' | 'machine' | 'silencer', Pose> = {
  pistol: 'gun',
  machine: 'machine',
  silencer: 'silencer',
};

function playerPose(weaponClass: 'pistol' | 'machine' | 'silencer'): Pose {
  // recarregando não é pose armada: o pack tem `reload` com as duas mãos na arma
  if (getIsReloading()) return 'reload';
  return ARMED_POSE[weaponClass];
}

/**
 * Desenha o jogador com pose do pacote Kenney, arma na mão e auras
 * de escudo/fúria.
 */
export function drawPlayer(player: Player, weaponClass: 'pistol' | 'machine' | 'silencer'): void {
  if (player.deathTimer > 0) {
    const progress = 1 - player.deathTimer / 1.5;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.deathAngle);
    ctx.globalAlpha = 1 - progress;
    ctx.fillStyle = PALETTE.moss;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius * (1 - progress * 0.8), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (player.invincible > 0 && Math.floor(player.invincible * 25) % 2) return;

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + player.radius * 0.7, player.radius * 0.8, player.radius * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  const skin = getEquippedSkin();
  const hasSprite = isSpritesEnabled() && !!getSprite('survivor_stand');

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  if (hasSprite) {
    const img = getSprite(poseKey('survivor', playerPose(weaponClass)))!;
    drawSpriteFit(ctx, img, 0, 0, player.radius * 2.5, 0);
  } else {
    let bodyColor = skin.bodyColor;
    if (hasPowerUp('invincible')) bodyColor = PALETTE.crit;
    else if (isSkillActive('shield') || player.shield > 0) bodyColor = PALETTE.stone;
    else if (isSkillActive('fury')) bodyColor = PALETTE.terracotta;
    ctx.fillStyle = bodyColor;
    ctx.shadowColor = skin.borderColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // cano e mira: só no fallback. Com sprite, o cano já vem desenhado na mão e
  // a linha branca de mira ficava por cima dele parecendo laser atravessando a
  // arma; a direção já é legível porque o corpo inteiro gira para a mira.
  if (!hasSprite) {
    ctx.strokeStyle = skin.aimColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.radius * 0.6, 0);
    ctx.lineTo(player.radius * 1.45, 0);
    ctx.stroke();

    ctx.strokeStyle = PALETTE.text;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(player.radius * 0.5, 0);
    ctx.lineTo(player.radius * 1.5, 0);
    ctx.stroke();
  }

  ctx.restore();

  // auras (mantêm shadowBlur — são o feedback de status)
  if (isSkillActive('shield')) {
    ctx.strokeStyle = 'rgba(96,128,144,0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 10 + Math.sin(Date.now() / 100) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (isSkillActive('fury')) {
    ctx.strokeStyle = 'rgba(176,112,80,0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 8 + Math.sin(Date.now() / 80) * 4, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = Date.now() / 200 + (i * Math.PI) / 3;
      const d = player.radius + 15 + Math.sin(Date.now() / 100 + i) * 5;
      ctx.fillStyle = `rgba(176,112,80,${0.5 + Math.sin(Date.now() / 50 + i) * 0.3})`;
      ctx.beginPath();
      ctx.arc(player.x + Math.cos(a) * d, player.y + Math.sin(a) * d, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (hasPowerUp('invincible')) {
    ctx.strokeStyle = PALETTE.crit;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 5 + Math.sin(Date.now() / 100) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (player.shield > 0 && !isSkillActive('shield')) {
    ctx.strokeStyle = 'rgba(96,128,144,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawDamageNumbers(damageNumbers: { x: number; y: number; text: string; color: string; life: number; vy: number }[]): void {
  for (const d of damageNumbers) {
    ctx.globalAlpha = Math.min(1, d.life / 0.5);
    ctx.fillStyle = d.color;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(d.text, d.x, d.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

// ─── Pausa ──────────────────────────────────────────────────────

/** Opções de pausa. `index` é a selecionada. */
export const PAUSE_OPTIONS = [
  { id: 'resume', label: 'CONTINUAR' },
  { id: 'music', label: 'MÚSICA' },
  { id: 'sfx', label: 'EFEITOS' },
  { id: 'config', label: 'CONFIGURAÇÕES' },
  { id: 'menu', label: 'VOLTAR AO MENU' },
] as const;

let pauseIndex = 0;
export function getPauseIndex(): number { return pauseIndex; }
export function movePause(delta: number): void {
  pauseIndex = (pauseIndex + delta + PAUSE_OPTIONS.length) % PAUSE_OPTIONS.length;
}

export function setPauseIndex(i: number): void {
  if (i >= 0 && i < PAUSE_OPTIONS.length) pauseIndex = i;
}

/** Posição do mouse em coordenadas de canvas, sincronizada pelo main.ts */
const uiMouse = { x: 0, y: 0 };
export function setUiMouse(x: number, y: number): void {
  uiMouse.x = x;
  uiMouse.y = y;
}

/** Linha da pausa onde o mouse está, ou -1 */
export function pauseOptionAt(mx: number, my: number): number {
  const W = canvas.width;
  const H = canvas.height;
  const boxW = 280;
  const rowH = 34;
  const boxH = 90 + PAUSE_OPTIONS.length * rowH;
  const x = W / 2 - boxW / 2;
  const y = H / 2 - boxH / 2;
  for (let i = 0; i < PAUSE_OPTIONS.length; i++) {
    const oy = y + 70 + i * rowH;
    if (mx >= x && mx <= x + boxW && my >= oy - 18 && my <= oy + 12) return i;
  }
  return -1;
}

/**
 * Desenha o overlay de pausa com as opções navegáveis.
 * @param musicOn - estado da música
 * @param sfxOn - estado dos efeitos
 */
export function drawPause(musicOn: boolean, sfxOn: boolean): void {
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, W, H);

  const boxW = 280;
  const rowH = 34;
  const boxH = 90 + PAUSE_OPTIONS.length * rowH;
  const x = W / 2 - boxW / 2;
  const y = H / 2 - boxH / 2;

  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(x, y, boxW, boxH);
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, boxW - 1, boxH - 1);

  ctx.fillStyle = PALETTE.title;
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSADO', W / 2, y + 40);

  PAUSE_OPTIONS.forEach((opt, i) => {
    const oy = y + 70 + i * rowH;
    const hovered = pauseOptionAt(uiMouse.x, uiMouse.y) === i;
    const selected = i === pauseIndex || hovered;
    if (hovered) { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(x+8, oy-16, boxW-16, rowH-6); }
    let label: string = opt.label;
    if (opt.id === 'music') label = `MÚSICA: ${musicOn ? 'LIGADA' : 'DESLIGADA'}`;
    if (opt.id === 'sfx') label = `EFEITOS: ${sfxOn ? 'LIGADOS' : 'DESLIGADOS'}`;
    ctx.fillStyle = selected ? PALETTE.moss : PALETTE.textDim;
    ctx.font = selected ? 'bold 14px monospace' : '13px monospace';
    ctx.textAlign = 'left';
    if (selected) ctx.fillText('>', x + 24, oy);
    ctx.fillText(label, x + 44, oy);
  });

  ctx.fillStyle = PALETTE.textOff;
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('W/S escolher · ENTER confirmar · ESC continuar', W / 2, y + boxH - 14);
  ctx.textAlign = 'left';
}

// ─── Configurações (volume + música) ──────────────────────

/** Identificador das linhas do painel de configurações. */
export type SettingsRowId = 'master' | 'music' | 'sfx' | 'musicOn' | 'sfxOn';

/** Linhas do painel: 3 volumes + 2 toggles. */
export const SETTINGS_ROWS: { id: SettingsRowId; label: string; kind: 'volume' | 'toggle' }[] = [
  { id: 'master', label: 'VOLUME GERAL', kind: 'volume' },
  { id: 'music', label: 'VOLUME MÚSICA', kind: 'volume' },
  { id: 'sfx', label: 'VOLUME EFEITOS', kind: 'volume' },
  { id: 'musicOn', label: 'MÚSICA', kind: 'toggle' },
  { id: 'sfxOn', label: 'EFEITOS', kind: 'toggle' },
];

/** Overlay (flag), sem novo estado de jogo: o estado subjacente
 * (`menu`/`paused`) é preservado e ESC só limpa a flag. */
let settingsOpen = false;
let settingsIndex = 0;

export function isSettingsOpen(): boolean { return settingsOpen; }
export function openSettings(): void {
  settingsOpen = true;
  settingsIndex = 0;
}
export function closeSettings(): void { settingsOpen = false; }
export function getSettingsIndex(): number { return settingsIndex; }
export function moveSettings(delta: number): void {
  settingsIndex = (settingsIndex + delta + SETTINGS_ROWS.length) % SETTINGS_ROWS.length;
}
export function setSettingsIndex(i: number): void {
  if (i >= 0 && i < SETTINGS_ROWS.length) settingsIndex = i;
}

export interface SettingsRowLayout extends MenuItemLayout {
  id: SettingsRowId;
  kind: 'volume' | 'toggle';
  /** Botões [-]/[+] das linhas de volume (null nas de toggle). */
  minus: MenuItemLayout | null;
  plus: MenuItemLayout | null;
}

export interface SettingsLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  rows: SettingsRowLayout[];
}

const SETTINGS_BOX_W = 360;
const SETTINGS_ROW_H = 44;
const SETTINGS_BTN = 30;

/**
 * Geometria única do painel: draw e hit-test consomem a MESMA função.
 * @param W - largura do canvas
 * @param H - altura do canvas
 */
export function getSettingsLayout(W: number, H: number): SettingsLayout {
  const boxW = Math.min(SETTINGS_BOX_W, W * 0.9);
  const boxH = 70 + SETTINGS_ROWS.length * SETTINGS_ROW_H + 30;
  const x = W / 2 - boxW / 2;
  const y = H / 2 - boxH / 2;
  const rows: SettingsRowLayout[] = SETTINGS_ROWS.map((row, i) => {
    const ry = y + 70 + i * SETTINGS_ROW_H;
    const r: SettingsRowLayout = {
      id: row.id,
      kind: row.kind,
      x: x + 10,
      y: ry - 18,
      w: boxW - 20,
      h: SETTINGS_ROW_H - 8,
      minus: null,
      plus: null,
    };
    if (row.kind === 'volume') {
      r.plus = { x: x + boxW - 12 - SETTINGS_BTN, y: ry - 14, w: SETTINGS_BTN, h: 28 };
      r.minus = { x: r.plus.x - 8 - SETTINGS_BTN, y: ry - 14, w: SETTINGS_BTN, h: 28 };
    }
    return r;
  });
  return { x, y, w: boxW, h: boxH, rows };
}

/** Linha do painel sob o mouse, ou -1. */
export function settingsRowAt(mx: number, my: number, W: number, H: number): number {
  const L = getSettingsLayout(W, H);
  for (let i = 0; i < L.rows.length; i++) {
    const r = L.rows[i];
    if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return i;
  }
  return -1;
}

/** Botão [-]/[+] sob o mouse, ou null. */
export function settingsButtonAt(mx: number, my: number, W: number, H: number): { row: number; dir: -1 | 1 } | null {
  const L = getSettingsLayout(W, H);
  for (let i = 0; i < L.rows.length; i++) {
    const r = L.rows[i];
    if (r.minus && mx >= r.minus.x && mx <= r.minus.x + r.minus.w && my >= r.minus.y && my <= r.minus.y + r.minus.h) {
      return { row: i, dir: -1 };
    }
    if (r.plus && mx >= r.plus.x && mx <= r.plus.x + r.plus.w && my >= r.plus.y && my <= r.plus.y + r.plus.h) {
      return { row: i, dir: 1 };
    }
  }
  return null;
}

/** Passo de ajuste de volume (A/D, roda do mouse e botões [-]/[+]). */
const VOLUME_STEP = 0.05;

/** Ajusta o volume da linha em um passo, com clamp e persistência. */
export function adjustSettingsVolume(row: number, dir: -1 | 1): void {
  const id = SETTINGS_ROWS[row].id;
  if (id === 'master') setMasterVolume(getMasterVolume() + dir * VOLUME_STEP);
  else if (id === 'music') setMusicVolume(getMusicVolume() + dir * VOLUME_STEP);
  else if (id === 'sfx') setSfxVolume(getSfxVolume() + dir * VOLUME_STEP);
}

function drawSettingsButton(r: MenuItemLayout, label: string, rowHovered: boolean): void {
  const hovered = rowHovered
    && uiMouse.x >= r.x && uiMouse.x <= r.x + r.w
    && uiMouse.y >= r.y && uiMouse.y <= r.y + r.h;
  ctx.fillStyle = hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, 3);
  ctx.fill();
  ctx.strokeStyle = hovered ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.fillStyle = hovered ? PALETTE.text : PALETTE.textDim;
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 4);
  ctx.textAlign = 'left';
}

/**
 * Desenha o painel de configurações (overlay centralizado).
 * @param master - volume geral (0–1)
 * @param music - volume da música (0–1)
 * @param sfx - volume dos efeitos (0–1)
 * @param musicOn - música ligada
 * @param sfxOn - efeitos ligados
 */
export function drawSettings(master: number, music: number, sfx: number, musicOn: boolean, sfxOn: boolean): void {
  const W = canvas.width;
  const H = canvas.height;
  const L = getSettingsLayout(W, H);

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(L.x, L.y, L.w, L.h);
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(L.x + 0.5, L.y + 0.5, L.w - 1, L.h - 1);

  ctx.fillStyle = PALETTE.title;
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CONFIGURAÇÕES', W / 2, L.y + 40);

  const hoveredRow = settingsRowAt(uiMouse.x, uiMouse.y, W, H);
  const volumeOf = (id: SettingsRowId): number =>
    id === 'master' ? master : id === 'music' ? music : sfx;
  const toggleOf = (id: SettingsRowId): boolean =>
    id === 'musicOn' ? musicOn : sfxOn;

  SETTINGS_ROWS.forEach((row, i) => {
    const r = L.rows[i];
    const hovered = hoveredRow === i;
    const selected = i === settingsIndex || hovered;

    if (hovered) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }

    const midY = r.y + r.h / 2 + 4;
    ctx.textAlign = 'left';
    ctx.fillStyle = selected ? PALETTE.moss : PALETTE.textDim;
    ctx.font = selected ? 'bold 13px monospace' : '13px monospace';
    if (selected) ctx.fillText('>', r.x + 4, midY);
    ctx.fillText(row.label, r.x + 20, midY);

    if (row.kind === 'volume' && r.minus && r.plus) {
      const v = volumeOf(row.id);
      const barX = r.x + 130;
      const barW = 100;
      const barH = 10;
      const barY = r.y + r.h / 2 - barH / 2;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = PALETTE.moss;
      ctx.fillRect(barX, barY, barW * v, barH);

      ctx.fillStyle = PALETTE.text;
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(v * 100)}%`, r.minus.x - 8, midY);

      drawSettingsButton(r.minus, '-', hovered);
      drawSettingsButton(r.plus, '+', hovered);
    } else {
      const on = toggleOf(row.id);
      ctx.fillStyle = on ? PALETTE.moss : PALETTE.textOff;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(
        on ? (row.id === 'musicOn' ? 'LIGADA' : 'LIGADOS') : (row.id === 'musicOn' ? 'DESLIGADA' : 'DESLIGADOS'),
        r.x + r.w, midY,
      );
    }
  });

  ctx.fillStyle = PALETTE.textOff;
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('W/S escolher · A/D ajustar · ENTER alternar · ESC voltar', W / 2, L.y + L.h - 14);
  ctx.textAlign = 'left';
}

function onSettingsWheel(e: WheelEvent): void {
  if (!isSettingsOpen()) return;
  const row = settingsRowAt(uiMouse.x, uiMouse.y, canvas.width, canvas.height);
  if (row < 0 || SETTINGS_ROWS[row].kind !== 'volume') return;
  adjustSettingsVolume(row, e.deltaY > 0 ? -1 : 1);
}

/**
 * Registra o scroll do painel. Chamado pelo `main.ts` (e não no topo
 * do módulo) para o estado UI continuar testável fora do navegador.
 */
export function attachSettingsWheelListener(): void {
  document.addEventListener('wheel', onSettingsWheel);
}

/** Restaura o estado do canvas após a translação do mundo. */
export function restoreCanvas(): void {
  ctx.restore();
}

// ─── NPCs ───────────────────────────────────────────────────────

interface NPCData {
  x: number; y: number; name: string; color: string;
  health: number; maxHealth: number; radius: number;
  alive: boolean; message: string; messageTimer: number;
}

export function drawNPCs(npcs: NPCData[]): void {
  for (const npc of npcs) {
    if (!npc.alive && npc.messageTimer <= 0) continue;
    ctx.globalAlpha = npc.alive ? 1 : 0.4;

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(npc.x, npc.y + npc.radius * 0.6, npc.radius * 0.7, npc.radius * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    const img = isSpritesEnabled() ? getSprite(poseKey('survivor', 'hold')) : null;
    if (img) {
      drawSpriteFit(ctx, img, npc.x, npc.y, npc.radius * 2.4, 0);
    } else {
      ctx.fillStyle = npc.color;
      ctx.beginPath();
      ctx.arc(npc.x, npc.y, npc.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (npc.health < npc.maxHealth && npc.alive) {
      const barW = npc.radius * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(npc.x - barW / 2, npc.y - npc.radius - 10, barW, 4);
      ctx.fillStyle = PALETTE.danger;
      ctx.fillRect(npc.x - barW / 2, npc.y - npc.radius - 10, barW * (npc.health / npc.maxHealth), 4);
    }

    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, npc.x, npc.y - npc.radius - 14);

    if (npc.messageTimer > 0 && npc.alive) {
      ctx.font = '11px monospace';
      const tw = ctx.measureText(npc.message).width;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(npc.x - tw / 2 - 6, npc.y - npc.radius - 34, tw + 12, 18);
      ctx.fillStyle = PALETTE.text;
      ctx.fillText(npc.message, npc.x, npc.y - npc.radius - 20);
    }

    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
}

/** Cono de lanterna (hazard de escuridão da Caverna). */
export function drawFlashlight(x: number, y: number, angle: number, radius: number): void {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, 'rgba(200,184,144,0.22)');
  grad.addColorStop(1, 'rgba(200,184,144,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, radius, angle - 0.5, angle + 0.5);
  ctx.closePath();
  ctx.fill();
}
