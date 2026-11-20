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
import { getSprite, getEnemyCharacter, poseKey, drawSpriteFit, Pose, isSpritesEnabled, HAND_SPRITES, isExtraCharacter, PAPEL_POR_TIPO, BOSS_SPRITES } from './sprites';
import { buildCutsceneBackdrop, cutsceneVeil } from './terrain';
import { getIsReloading, getWeaponFamily, getShotRecoil, WeaponFamily } from '../weapons';
import { getCurrentCutscene, getCurrentLine, isLineComplete, getTextProgress, getPortraitInfo, getBeatRestante } from './story';
import { getDialogo, retratoDoDialogo } from './dialogo';
import { estaEmTelaCheia } from './fullscreen';
import { getCurrentWeapon } from '../weapons';
import { getEquippedSkin } from './skins';
import { hasSave } from './saveSystem';
import { getLeaderboard } from './leaderboard';
import { PALETTE } from '../core/palette';
import { GAME_MODES } from './gameModes';
import { getAmeacaAtual, formatarAmeaca } from './ameaca';
import { CLASSES, ClassId } from './classes';
import {
  getMasterVolume, getMusicVolume, getSfxVolume,
  setMasterVolume, setMusicVolume, setSfxVolume, isMusicEnabled,
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
 */
export interface MenuFooterLine {
  texto: string;
  cor: string;
  fonte: string;
  /** Baseline da linha, em pixels de tela. */
  y: number;
  /** Y do topo do bloco inteiro — usado para não colidir com o menu. */
  pulso: boolean;
}

/** Vão entre baselines no rodapé. O último valor é o espaço após a 5ª linha. */
const RODAPE_ESPACO = [12, 12, 12, 16, 18];

/**
 * Geometria do rodapé do menu: as linhas de controle, o aviso de save
 * existente e o "ENTER para jogar".
 *
 * Isso não pode ser âncora em percentual: o bloco de controle avançava 14px a
 * partir de `h*0.88` enquanto o aviso de save era desenhado em `h*0.94 - 18`,
 * e o vão real entre os dois é `h*0.06`. Em tela baixa o "V: Créditos" caía
 * abaixo do "C: Continuar jogo salvo" e os dois se sobrepunham.
 *
 * O rodapé é ancorado pela BASE (última linha acima do crédito de licença) e
 * cresce para cima, então a distância para o crédito é constante em qualquer
 * altura.
 */
export function getMenuFooterLayout(h: number, temSave: boolean, musicOn = true): MenuFooterLine[] {
  const linhas: { texto: string; cor: string; fonte: string; pulso: boolean }[] = [
    { texto: 'WASD: Mover | Mouse: Mirar | Click: Atirar', cor: PALETTE.textOff, fonte: '11px monospace', pulso: false },
    { texto: 'Espaco: Dash | E: Escudo | F: Furia | R: Recarregar', cor: PALETTE.textOff, fonte: '11px monospace', pulso: false },
    { texto: `M: Musica ${musicOn ? 'LIGADA' : 'DESLIGADA'} | S: Efeitos | O: Configurações`, cor: PALETTE.textOff, fonte: '11px monospace', pulso: false },
    { texto: 'V: Créditos', cor: PALETTE.textOff, fonte: '11px monospace', pulso: false },
  ];
  if (temSave) {
    linhas.push({ texto: 'C: Continuar jogo salvo', cor: PALETTE.mustard, fonte: '12px monospace', pulso: false });
  }
  linhas.push({ texto: 'ENTER para jogar', cor: PALETTE.textDim, fonte: '13px monospace', pulso: true });

  const out: MenuFooterLine[] = new Array(linhas.length);
  out[linhas.length - 1] = { ...linhas[linhas.length - 1], y: h - 22 };
  for (let i = linhas.length - 2; i >= 0; i--) {
    const abaixo = RODAPE_ESPACO[i] ?? 14;
    out[i] = { ...linhas[i], y: out[i + 1].y - abaixo };
  }
  return out;
}

/** Y do topo do rodapé — abaixo disso o menu não pode desenhar. */
export function getMenuFooterTop(h: number, temSave: boolean): number {
  const linhas = getMenuFooterLayout(h, temSave);
  return linhas[0].y - 9;
}

export function getMenuLayout(w: number, h: number): { titleY: number; items: MenuItemLayout[]; classItems: MenuItemLayout[]; settingsRow: MenuItemLayout | null } {
  const startY = h * 0.3;
  const spacing = Math.min(46, (h * 0.5) / GAME_MODES.length);
  const boxW = Math.min(340, w * 0.7);
  const boxH = Math.min(32, spacing - 6);
  const classStartY = startY + GAME_MODES.length * spacing + 30;
  const classSpacing = Math.min(36, (h * 0.3) / 4);
  const footerTop = getMenuFooterTop(h, hasSave());
  const settingsY = classStartY + 4 * classSpacing + 22;
  const settingsRow: MenuItemLayout | null =
    settingsY + (classSpacing - 4) <= footerTop
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
/**
 * Tile de fundo do menu: concreto do pack Top Down Dungeon (CC0).
 *
 * Era `tile_31` do Kenney — 95% cinza com um tracinho amarelo, o pior caso de
 * "cara de IA" do projeto. Este tem rejunte e mancha, e a passada escura por
 * cima o deixa só como superfície.
 */
const MENU_TILE = 'dngeon_parede_concreto_0';

/** Fundo prerenderizado do menu (null antes do primeiro draw). */
let menuBg: HTMLCanvasElement | null = null;
/** Resolução do fundo prerenderizado — o offscreen é por (W,H). */
let menuBgKey = '';

/**
 * Fundo do menu.
 *
 * Antes era o `tile_31` do Kenney repetido numa grade de 64px sob 72% de
 * preto: o tile é 95% cinza com um tracinho amarelo, então o que aparecia na
 * tela não era o desenho — era a treliça das emendas. Agora usa um tile de
 * concreto com rejunte do pack Top Down Dungeon (que tem textura real), em
 * uma passada escura, com vinheta por cima.
 *
 * O tile é asset: sem ele carregado o fundo é o quase-preto liso, que é
 * fallback e não um desenho feito com código (regra 15).
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
      // 128px em vez de 64: a grade fica 11x6 em vez de 20x11, e a costura
      // some atrás da vinheta
      const S = 128;
      for (let y = 0; y < H; y += S) {
        for (let x = 0; x < W; x += S) {
          c.drawImage(tile, x, y, S, S);
        }
      }
    }
    c.fillStyle = 'rgba(8,8,10,0.86)';
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
  ctx.fillText('SARGENTO LUIZ', W / 2, L.titleY);
  ctx.shadowBlur = 0;

  ctx.fillStyle = PALETTE.textOff;
  ctx.font = '12px monospace';
  ctx.fillText('12/03/2087 — ESQUADRÃO RIOS', W / 2, L.titleY + 24);

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
    ctx.font = '11px monospace';
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
    ctx.font = '11px monospace';
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

  for (const linha of getMenuFooterLayout(H, hasSave(), isMusicEnabled())) {
    if (linha.pulso) ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 600) * 0.3;
    ctx.fillStyle = linha.cor;
    ctx.font = linha.fonte;
    ctx.fillText(linha.texto, W / 2, linha.y);
    if (linha.pulso) ctx.globalAlpha = 1;
  }

  // crédito das faixas — obrigatório por licença
  ctx.fillStyle = PALETTE.textOff;
  ctx.font = '11px monospace';
  ctx.fillText('Música: Juhani Junkala (CC0) e Eric Matyas (soundimage.org) — veja os créditos no menu', W / 2, H - 12);
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
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(portrait.name, portraitX + portraitR + 16, portraitY - 12);

  // Beat de silêncio: a linha "---" não desenha texto nenhum, e o retrato
  // some. É o silêncio depois da morte do Fernandes — a tela fica com o
  // cenário e nada mais. Sem isso a morte passava como mais uma fala.
  const emSilencio = getBeatRestante() > 0;
  const displayedText = emSilencio ? '' : line.text.substring(0, Math.floor(progress));
  if (!emSilencio) {
    ctx.fillStyle = '#bbb';
    ctx.font = '18px monospace';
    wrapText(ctx, displayedText, portraitX + portraitR + 16, portraitY + 12, canvas.width * 0.6, 24);
  }

  // Sempre visível: antes o prompt só aparecia DEPOIS de a linha terminar,
  // então quem não sabia o truque ficava preso vendo o texto digitar. Agora
  // ele é a única coisa em mostarda no rodapé e diz a ação, não o nome da tecla.
  ctx.fillStyle = PALETTE.mustard;
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  ctx.globalAlpha = complete ? 0.75 + Math.sin(Date.now() / 500) * 0.25 : 0.6;
  ctx.fillText('ENTER / ESPAÇO / CLIQUE PARA CONTINUAR', canvas.width / 2, canvas.height - 28);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath();
  ctx.moveTo(canvas.width * 0.15, canvas.height * 0.82);
  ctx.lineTo(canvas.width * 0.85, canvas.height * 0.82);
  ctx.stroke();
}

/**
 * A caixa de diálogo PEQUENA da fase (H2 — a Fábrica do Rogério): faixa na
 * base da tela, o mundo congelado atrás (decisão do Murilo: pausado por
 * linha). O retrato é o MESMO das cutscenes — um vocabulário só de rosto.
 * Os 2 sítios de chrome (caixa + moldura) estão no PERMITIDAS do semDesenho:
 * é UI de diálogo, a mesma categoria dos painéis da cutscene.
 */
export function drawDialogo(): void {
  const entrada = getDialogo();
  if (!entrada) return;
  const info = retratoDoDialogo(entrada);
  const W = canvas.width, H = canvas.height;
  const boxW = Math.min(760, W - 80);
  const boxH = 132;
  const x = (W - boxW) / 2;
  const y = H - boxH - 24;
  ctx.fillStyle = 'rgba(10,10,10,0.92)';
  ctx.fillRect(x, y, boxW, boxH);
  ctx.strokeStyle = 'rgba(160,128,80,0.5)';
  ctx.strokeRect(x + 0.5, y + 0.5, boxW - 1, boxH - 1);
  const img = getSprite(info.sprite);
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, x + 16, y + 20, 64, 64);
  }
  ctx.fillStyle = info.color;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(info.name, x + 96, y + 26);
  ctx.fillStyle = '#bbb';
  ctx.font = '16px monospace';
  wrapText(ctx, entrada.text, x + 96, y + 48, boxW - 120, 21);
  ctx.fillStyle = PALETTE.mustard;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.65 + Math.sin(Date.now() / 400) * 0.25;
  ctx.fillText('ENTER OU CLIQUE PARA CONTINUAR', x + boxW / 2, y + boxH - 14);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

/**
 * Cena da cutscene: fundo montado por `buildCutsceneBackdrop` (terrain.ts),
 * com o piso e os objetos do próprio bioma.
 *
 * Antes esta função desenhava a cena toda com `arc`/`fillRect` — árvore em
 * círculo, estalactite em triângulo, estrela em ponto. Era o último lugar do
 * jogo em que a arte era código (Regra 15). Agora a cena vem do pack; daqui
 * sai só o véu de alpha (a cena fica atrás do texto) e a deriva lenta.
 */
function drawCutsceneScene(title: string): void {
  const fundo = buildCutsceneBackdrop(title, canvas.width, canvas.height);
  if (!fundo) return;
  // 2px de deriva vertical custam um `drawImage` por frame.
  const deriva = Math.sin(Date.now() / 1500) * 2;
  ctx.globalAlpha = cutsceneVeil(title);
  ctx.drawImage(fundo, 0, deriva);
  ctx.globalAlpha = 1;
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
// Tela separada da derrota: zerar o jogo caindo no mesmo desenho lia como
// derrota. Vitória usa o verde-musgo do jogador, morte continua terracota.
export function drawVictory(score: number, killStreak: number): void {
  // M2, relato de 2026-10-14: a vitória de quem zerou a campanha lê como o
  // cumprimento do sargento — "Muito bem, soldado!" — e não como o fim
  // genérico. O fato fica no subtítulo: a tela celebra quem chegou aqui.
  drawEndScreen('MUITO BEM, SOLDADO!', PALETTE.moss, score, killStreak, 'O NÚCLEO CAIU — A CAMPANHA ACABOU');
}

function drawEndScreen(title: string, titleColor: string, score: number, killStreak: number, subtitulo?: string): void {
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = titleColor;
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, W / 2, H * 0.12);

  if (subtitulo) {
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '16px monospace';
    ctx.fillText(subtitulo, W / 2, H * 0.17);
  }

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

// ─── Fim de partida do versus local ───────────────────────────────
/**
 * Tela de fim do Local 2P.
 *
 * O módulo de 2P já tinha vida, dano, i-frame e `getWinner()`, mas o fim da
 * partida era um TOAST de 4 segundos e a partida seguia. "LOCAL 2P" na página
 * do itch promete versus, e versus precisa de tela: sem esta, ninguém descobre
 * que ganhou nem que perdeu, e a partida não acaba na tela.
 *
 * Sem desenho próprio: o fundo reusa o das outras telas de fim e o placar é
 * barra retangular — UI, que é o que a `semDesenho` autoriza.
 */
export function drawFimLocal(
  vencedor: 'p1' | 'p2',
  placar: { nome: string; vida: number; vidaMax: number; vivo: boolean; cor: string }[],
  onda: number,
): void {
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '13px monospace';
  ctx.fillText('LOCAL 2P', W / 2, H * 0.13);

  ctx.fillStyle = vencedor === 'p1' ? PALETTE.moss : PALETTE.stone;
  ctx.font = 'bold 36px monospace';
  ctx.fillText(`${vencedor.toUpperCase()} VENCEU`, W / 2, H * 0.22);

  ctx.fillStyle = PALETTE.text;
  ctx.font = '15px monospace';
  ctx.fillText(`Onda ${onda}`, W / 2, H * 0.31);

  // lado a lado: o que o jogador quer no fim de um versus é comparar
  const colW = 170;
  const gap = 70;
  const x0 = W / 2 - gap / 2 - colW;
  const y0 = H * 0.42;

  placar.forEach((jog, i) => {
    const x = x0 + i * (colW + gap);
    ctx.fillStyle = jog.cor;
    ctx.font = 'bold 16px monospace';
    ctx.fillText(jog.nome, x + colW / 2, y0);

    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '13px monospace';
    ctx.fillText(jog.vivo ? 'em pé' : 'caído', x + colW / 2, y0 + 20);

    const barW = colW;
    const barH = 12;
    const by = y0 + 32;
    ctx.fillStyle = PALETTE.void;
    ctx.fillRect(x, by, barW, barH);
    const frac = jog.vidaMax > 0 ? Math.max(0, Math.min(1, jog.vida / jog.vidaMax)) : 0;
    ctx.fillStyle = jog.cor;
    ctx.fillRect(x, by, Math.round(barW * frac), barH);
    ctx.strokeStyle = PALETTE.textDim;
    ctx.strokeRect(x + 0.5, by + 0.5, barW - 1, barH - 1);

    ctx.fillStyle = PALETTE.text;
    ctx.font = '13px monospace';
    ctx.fillText(`${jog.vida} / ${jog.vidaMax}`, x + colW / 2, by + barH + 18);
  });

  ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 600) * 0.3;
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '13px monospace';
  ctx.fillText('ENTER revanche   ·   ESC menu', W / 2, H * 0.85);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

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
    { texto: 'Eric Matyas (soundimage.org) — Automation, Darkness Below, Puzzle Dreams, Autumn Changes, Dystopic Mayhem, And the Machines Came at Midnight, 80s Space Game', cor: PALETTE.text, tamanho: '12px', peso: '' },
    { texto: 'Uso gratuito com atribuição — agradecimento a todos os autores', cor: PALETTE.textDim, tamanho: '11px', peso: '' },
    { texto: 'SPRITES EXTRAS', cor: PALETTE.mustard, tamanho: '13px', peso: 'bold ' },
    { texto: 'harrison-lord (CC-BY 3.0) — Top-down Dog, o pardal da loja', cor: PALETTE.text, tamanho: '12px', peso: '' },
    { texto: 'isaiah658 (CC0) — 50+ Monsters Pack, silhuetas dos chefes', cor: PALETTE.text, tamanho: '12px', peso: '' },
    { texto: '', cor: PALETTE.textDim, tamanho: '11px', peso: '' },
    { texto: 'SFX', cor: PALETTE.mustard, tamanho: '13px', peso: 'bold ' },
    { texto: 'Kenney.nl + OpenGameArt — CC0 e CC-BY (52 efeitos)', cor: PALETTE.text, tamanho: '12px', peso: '' },
    { texto: 'Tiros: Vincent Sevedge (opengameart.org) — CC-BY 3.0', cor: PALETTE.text, tamanho: '12px', peso: '' },
    { texto: 'Sons gratuitos com crédito; o detalhe completo está no menu de créditos', cor: PALETTE.textDim, tamanho: '11px', peso: '' },
    { texto: 'Recursos e sons narrativos: OpenGameArt (risada, chave de roda, foguete)', cor: PALETTE.textDim, tamanho: '11px', peso: '' },
    { texto: '', cor: PALETTE.textDim, tamanho: '11px', peso: '' },
    { texto: 'SPRITES', cor: PALETTE.mustard, tamanho: '13px', peso: 'bold ' },
    { texto: 'Kenney — Top-down Shooter · kenney.nl · CC0', cor: PALETTE.text, tamanho: '12px', peso: '' },
    { texto: 'SpriteAttack — FreeArt Topdown Zombies · CC0 (3 corpos)', cor: PALETTE.text, tamanho: '11px', peso: '' },
    { texto: 'Trilho, trens e galão autorais · CC0 (tools/gen_assets_*)', cor: PALETTE.textDim, tamanho: '11px', peso: '' },
    { texto: 'Personagens, armas e tiles (PNG/Tiles)', cor: PALETTE.textDim, tamanho: '11px', peso: '' },
    { texto: 'Screaming Brain — Top Down Dungeon · CC0 (chão e paredes)', cor: PALETTE.text, tamanho: '11px', peso: '' },
    { texto: 'Kay Lousberg — 2D Guns · CC0 (armas e projéteis)', cor: PALETTE.text, tamanho: '11px', peso: '' },
    { texto: 'Saturn V Rocket — Michael J Pierce @ IsometricRobot.com · CC-BY 3.0', cor: PALETTE.text, tamanho: '11px', peso: '' },
    { texto: '', cor: PALETTE.textDim, tamanho: '11px', peso: '' },
    { texto: 'CÓDIGO E DESIGN', cor: PALETTE.mustard, tamanho: '13px', peso: 'bold ' },
    { texto: 'SARGENTO LUIZ — projeto original', cor: PALETTE.text, tamanho: '12px', peso: '' },
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
 * Desenha a transição visual entre ondas.
 */
/**
 * A SEQUÊNCIA DE VOO do Castelo (M4, relato 2026-10-14): no respiro depois
 * do rei mutante, o jogador vê o foguete subir — céu azul embaixo, azul e
 * preto no meio, a estação chegando. O foguete é o SPRITE do Castelo (o
 * mesmo `prop_foguete`, placeholder que o dono vai trocar); as bandas de
 * céu são chapadas de propósito: gradiente aqui leria como template, e a
 * paleta pede céu desbotado, não cartão-postal.
 *
 * `progresso` é 1→0 (o mesmo relógio do respiro): 0 é o chão, 1 é a janela
 * da estação.
 */
export function drawVoo(progresso: number, W: number, H: number): void {
  const t = 1 - progresso; // 0 no chão → 1 chegando

  // céu em 3 bandas chapadas que escurecem com a altura da subida
  const cor = (a: number, b: number) => {
    const mix = (x: number, y: number) => Math.round(x + (y - x) * Math.min(1, t * 1.4));
    return `rgb(${mix(74, 8)},${mix(122, 10)},${mix(146, 24)})`;
  };
  ctx.fillStyle = cor(0, 0);
  ctx.fillRect(0, 0, W, H * 0.5);
  ctx.fillStyle = `rgb(${Math.round(64 - 52 * t)},${Math.round(118 - 104 * t)},${Math.round(148 - 130 * t)})`;
  ctx.fillRect(0, H * 0.5, W, H * 0.35);
  ctx.fillStyle = `rgb(${Math.round(120 - 110 * t)},${Math.round(168 - 156 * t)},${Math.round(190 - 178 * t)})`;
  ctx.fillRect(0, H * 0.85, W, H * 0.15);

  // o foguete sobe e AFASTA (vista de baixo): encolhe conforme ganha altura
  const foguete = getSprite('prop_foguete');
  if (foguete) {
    const tamanho = H * (0.85 - 0.68 * t);
    const y = H * (1.05 - 1.15 * t);
    ctx.drawImage(foguete, W / 2 - tamanho * 0.27, y - tamanho / 2, tamanho * 0.54, tamanho);
  }

  // o que a janela diz, no compasso da subida
  ctx.fillStyle = 'rgba(200,184,144,0.9)';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  if (t < 0.55) ctx.fillText('DECOLAGEM', W / 2, H * 0.16);
  else ctx.fillText('APROXIMANDO DA ESTAÇÃO', W / 2, H * 0.16);
}

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

/**
 * Moedas: sprite da Kenney "Platformer Art Deluxe" (CC0).
 *
 * Era um `ctx.arc()` mostarda com um "$" desenhado por cima — o objeto mais
 * visto do jogo e o último círculo de arte no renderer. O pulso (escala) e o
 * fade por `life` continuam: eles são movimento, não desenho.
 */
export function drawCoins(coins: Coin[]): void {
  const img = getSprite('item_coinGold');
  for (const c of coins) {
    const pulse = 1 + Math.sin(Date.now() / 300 + c.x) * 0.12;
    const alpha = Math.max(0, Math.min(1, c.life / 3));
    ctx.globalAlpha = alpha;
    if (img) {
      const lado = 18 * pulse;
      ctx.drawImage(img, c.x - lado / 2, c.y - lado / 2, lado, lado);
      continue;
    }
    // fallback: asset não carregou — o círculo de antes, declarado como
    // exceção de fallback no `semDesenho` (Regra 15)
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

/**
 * Gema por cor do power-up.
 *
 * As 12 cores do `POWERUP_TYPES` são da paleta do jogo, e o pack tem 4 gemas —
 * o pareamento é por tom. O símbolo continua na frente: ele é texto de UI (é
 * o que distingue `botas` de `reflexos`), não desenho.
 */
const GEMA_POR_COR: Record<string, string> = {
  '#7a9a6a': 'item_gemGreen',   // health
  '#608090': 'item_gemBlue',    // shield, peleDePedra
  '#b07050': 'item_gemRed',     // damage, furia
  '#c8b890': 'item_gemYellow',  // speed, invincible, botas, reflexos
  '#a08050': 'item_gemYellow',  // multiShot, municaoInfinita
  '#8a8a9a': 'item_gemBlue',    // magnet
};

export function drawPowerUps(powerups: PowerUp[]): void {
  for (const p of powerups) {
    const def = POWERUP_TYPES[p.type];
    const bob = Math.sin(Date.now() / 200 + p.x) * 3;
    const py = p.y + bob;
    ctx.globalAlpha = Math.min(1, p.life / 2);
    const gema = getSprite(GEMA_POR_COR[def.color] ?? 'item_gemYellow');
    if (gema) {
      // 28px e o símbolo EMBAIXO, não em cima: sobre a faceta o glifo cobria
      // o desenho e a gema virava "ponto colorido com letra" (medido no
      // harness de composição).
      const lado = 28;
      ctx.drawImage(gema, p.x - lado / 2, py - lado / 2, lado, lado);
    } else {
      // fallback: asset não carregou — o círculo de antes (Regra 15)
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(p.x, py, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // o símbolo é legenda de UI: continua texto, com contorno escuro para
    // ficar legível em cima da gema
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(8,8,10,0.85)';
    ctx.strokeText(def.symbol, p.x, py + 20);
    ctx.fillStyle = '#e8dcc0';
    ctx.fillText(def.symbol, p.x, py + 20);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }
  ctx.globalAlpha = 1;
}

/**
 * Partículas.
 *
 * Antes, toda partícula era um `ctx.arc()` — 80 por frame, mais as explosões
 * e os rastros. Numa tela cheia de tiro isso são centenas de arcos por frame,
 * e o resultado lê como "bolinha de programa", não como fumaça ou faísca.
 * Agora usa o Kenney Particle Pack (CC0); o `arc` fica só como fallback de
 * asset que não carregou.
 */
export function drawParticles(particles: Particle[]): void {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    const sprite = getSprite(`fx_${p.sprite ?? 'spark_02'}`);
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      // encolhe junto com a vida: a partícula morre sumindo, não cortando
      const lado = p.radius * 2.6 * (0.45 + alpha * 0.55);
      ctx.drawImage(sprite, p.x - lado / 2, p.y - lado / 2, lado, lado);
      continue;
    }
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.1, p.radius * alpha), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * Poças de fogo no chão (B7, fase do NÚCLEO): a marca de queimado é o
 * asset `scorch_01` (o pack tem exatamente isso — chão marcado por fogo) e
 * a brasa é o `flare_01` pulsando devagar por cima, encolhendo com a vida
 * restante. Dois assets do pack de partículas, nenhum desenho de código.
 */
export function drawFires(fires: { x: number; y: number; radius: number; life: number; maxLife: number }[]): void {
  const marca = getSprite('fx_scorch_01');
  const brasa = getSprite('fx_flare_01');
  if ((!marca || !marca.complete || marca.naturalWidth === 0) && (!brasa || !brasa.complete || brasa.naturalWidth === 0)) return;
  for (const f of fires) {
    const faseVida = f.life / f.maxLife;
    const pulso = 0.72 + 0.28 * Math.sin(Date.now() / 130 + f.x);
    if (marca && marca.complete && marca.naturalWidth > 0) {
      ctx.globalAlpha = 0.55;
      ctx.drawImage(marca, f.x - f.radius, f.y - f.radius, f.radius * 2, f.radius * 2);
    }
    if (brasa && brasa.complete && brasa.naturalWidth > 0) {
      const lado = f.radius * 1.7 * (0.6 + faseVida * 0.4);
      ctx.globalAlpha = (0.35 + 0.45 * faseVida) * pulso;
      ctx.drawImage(brasa, f.x - lado / 2, f.y - lado / 2, lado, lado);
    }
  }
  ctx.globalAlpha = 1;
}

export function drawBullets(bullets: Bullet[]): void {
  for (const b of bullets) {
    const speed = Math.hypot(b.vx, b.vy) || 1;
    const ang = Math.atan2(b.vy, b.vx);
    // Família da bala: o sprite vem do pack de armas (Kay Lousberg, CC0).
    // `bullet_*` no cache = asset carregou; o `arc` abaixo é o fallback de
    // asset ausente, que é a única função dele.
    const blob = b.bulletSprite === 'slime_blob' || b.bulletSprite === 'shard_blob' || b.bulletSprite === 'ember_blob';
    const sprite = b.bulletSprite ? getSprite(`bullet_${b.bulletSprite}`) : null;
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      // Cartucho tem ponta: gira +90° para a ponta seguir a velocidade.
      // Gosma/lasca/brasa são gotas sem "frente": girá-las como cartucho
      // fazia a gosma de zumbi parecer bala de metralhadora deitada.
      const altura = blob ? 14 : b.isEnemy ? 16 : 20;
      const larg = blob ? altura : altura * (sprite.naturalWidth / sprite.naturalHeight);
      ctx.save();
      ctx.translate(b.x, b.y);
      if (!blob) ctx.rotate(ang + Math.PI / 2);
      ctx.drawImage(sprite, -larg / 2, -altura / 2, larg, altura);
      ctx.restore();
      // rastro na cor da arma, saindo da BASE do cartucho
      const tx = b.x - Math.cos(ang) * altura * 0.5;
      const ty = b.y - Math.sin(ang) * altura * 0.5;
      const grad = ctx.createLinearGradient(tx, ty, b.x, b.y);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, b.color);
      ctx.strokeStyle = grad;
      ctx.lineWidth = b.isEnemy ? 4 : 3;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    } else {
      // fallback: asset não carregou
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
 */
function enemyPose(e: Enemy): Pose {
  if (e.hitFlash > 0) return 'reload';
  // Zumbi/recusante nunca empunha arma: ele cospe gosma, não atira cartucho.
  // Só o agente (que aceitou o implante) tem pose armada. Era isso que fazia
  // o free1/free2/free3 aparecer segurando metralhadora — o dono apontou.
  if (PAPEL_POR_TIPO[e.type] === 'recusante') return 'stand';
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
  facing: (e: Enemy) => number,
  /** Índice da fase (0..8). Escolhe o personagem do bioma; -1 usa o mapa geral. */
  faseIndex = -1
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

    // O TITÃ da onda (T1): anel mostarda — o mesmo vocabulário do anel de
    // chefe, uma escala abaixo (o chefe é terracota, o titã é mostarda).
    // E a barra de vida: 3× a vida da onda não pode ser invisível, senão o
    // jogador não entende por que o corpo grande não cai. Sites contados no
    // semDesenho (TOTAL_ATUAL 67 → 70, decisão no diff do teste).
    if (e.isElite) {
      const pulso = 0.5 + Math.sin(Date.now() / 650 + e.y * 0.01) * 0.16;
      ctx.strokeStyle = PALETTE.mustard;
      ctx.globalAlpha = pulso;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + e.radius * 0.6, e.radius * 1.05, e.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      const barW = Math.min(64, e.radius * 2);
      const barY = e.y - e.radius * 1.4 - 8;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(e.x - barW / 2, barY, barW, 4);
      ctx.fillStyle = PALETTE.mustard;
      ctx.fillRect(e.x - barW / 2, barY, barW * Math.max(0, e.health / e.maxHealth), 4);
    }

    // o personagem depende da FASE: o mesmo tipo de inimigo sai com um corpo
    // diferente em cada bioma (a "9 silhuetas para 33 inimigos" do Sprint 1).
    // Sem o índice da fase, a variação existia na tabela e nunca chegava na tela.
    const char = getEnemyCharacter(e.type, faseIndex);
    const pose = enemyPose(e);
    // O corpo é o sprite do pack, SEM tint por tipo. O tint multiplicava o
    // PNG inteiro pela cor do config e o personagem virava uma silhueta
    // chapada verde/roxa/amarela — o dono leu como "aura feia" no playtest
    // de 2026-11. A cor do tipo continua no fallback procedural e nos
    // projéteis; o corpo na tela é a arte do pack.
    const bossKey = BOSS_SPRITES[e.type];
    const img = spritesOn ? (bossKey ? getSprite(`boss_${bossKey}`) : getSprite(poseKey(char, pose))) : null;

    if (img) {
      // "squash" de dano: o corpo encolhe/estica 16% no flash em vez de só
      // piscar. É leitura de impacto, não uma animação de morte inventada.
      const squash = 1 + Math.min(0.16, Math.max(0, e.hitFlash) * 1.1);
      // Os zumbis externos foram desenhados de frente para CIMA (cabeça no
      // topo, pés embaixo); o Kenney aponta para a direita. O offset alinha o
      // corpo à direção de perseguição sem mudar a arte de cada um. O corpo
      // deles ocupa 34px dentro do quadro 51×43, então precisa de 1.3× para
      // ler no mesmo tamanho do Kenney.
      const extra = isExtraCharacter(char) || !!bossKey;
      // O chefe tem arte "de frente" própria: girá-la com a mira deixaria o
      // monstro de lado/costas conforme o jogador se move. Fica fixo.
      const angulo = bossKey ? 0 : extra ? facing(e) + Math.PI / 2 : facing(e);
      drawSpriteFit(ctx, img, e.x, e.y, e.radius * 2.4 * squash * (extra ? 1.3 : 1), angulo);
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
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(bot.name, bot.x, barY - 4);
    ctx.textAlign = 'left';
  }
}

/**
 * Pose do jogador por FAMÍLIA de arma.
 *
 * As poses `gun`/`machine`/`silencer` do pack já desenham o personagem
 * **segurando** a arma — são 16px mais largas que `stand` por causa do cano.
 * `stand` e `hold` são as duas poses sem arma nenhuma. O jogador ficava em
 * `stand` quando não estava atirando, então a arma só aparecia no disparo:
 * parado, o `weapon_*` desenhado na ponta ficava solto ao lado do corpo, e
 * atirando ficavam duas armas (a da pose e a da ponta). Como a arma agora vem
 * da pose, a sprite `weapon_*` da ponta sai.
 *
 * GATE VISUAL (Sprint 3): as armas do Kay Lousberg NÃO entram na mão. Elas são
 * perfil lateral (coronha, alça, detalhe lateral) e o jogo é top-down — a pose
 * do Kenney já desenha a arma de cima, e colar uma shotgun lateral no ombro
 * visto de cima é mistura de perspectiva. O pack Kay segue só nos projéteis,
 * onde funde (cartuchos simétricos que rotacionam bem). O fallback que o TODO
 * propunha (Kenney Scribble Dungeons) é tileset de dungeon e não tem arma na
 * mão — a resposta real é manter as poses.
 *
 * A curadoria é por família (WEAPON_FAMILY, a mesma do som), não por arma:
 * 12 armas colapsam nas 3 poses que o pack tem, e o `weaponClass` solto no
 * config — que fazia Shotgun e Pistola na mesma pose — saiu do caminho.
 */
/** Exportada para o teste de completude da curadoria por família. */
export const POSE_DA_FAMILIA: Record<WeaponFamily, Pose> = {
  pistol: 'gun',
  mine: 'gun',
  shotgun: 'machine',
  machine: 'machine',
  launcher: 'machine',
  precision: 'silencer',
  energy: 'silencer',
};

function playerPose(): Pose {
  // recarregando não é pose armada: o pack tem `reload` com as duas mãos na arma
  if (getIsReloading()) return 'reload';
  return POSE_DA_FAMILIA[getWeaponFamily()];
}

/**
 * O pacote não tem frames de caminhada: as 6 poses são de arma, não de passo.
 * O corpo ganha vida com um balanço curto (e para quando o jogador para) — é
 * o que tira a leitura de "peça deslizando" sem inventar frame que o asset
 * não tem.
 */
let ultimoPlayerX = Number.NaN;
let ultimoPlayerY = Number.NaN;
let ultimoPlayerAngle = 0;
let faseDoPasso = 0;

/** Fantasmas do dash: sprites do pack, não um rastro desenhado em código. */
interface RastroDash {
  x: number;
  y: number;
  angle: number;
  criadoEm: number;
}
const rastroDash: RastroDash[] = [];
const RASTRO_DASH_MS = 220;

/**
 * Desenha o jogador com pose do pacote Kenney, arma na mão e auras
 * de escudo/fúria.
 */
export function drawPlayer(player: Player): void {
  const dx = Number.isNaN(ultimoPlayerX) ? 0 : player.x - ultimoPlayerX;
  const dy = Number.isNaN(ultimoPlayerY) ? 0 : player.y - ultimoPlayerY;
  const andou = Math.hypot(dx, dy) > 0.35;
  faseDoPasso += andou ? 0.3 : 0.06;
  const balanco = andou ? Math.sin(faseDoPasso) * 1.2 : Math.sin(Date.now() / 520) * 0.35;
  ultimoPlayerX = player.x;
  ultimoPlayerY = player.y;
  ultimoPlayerAngle = player.angle;

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

  // O dash ganha um rastro de corpos do próprio pack. Antes o dash era só o
  // deslocamento e um whoosh: a velocidade não deixava marca no mundo.
  const agora = performance.now();
  while (rastroDash.length && agora - rastroDash[0].criadoEm > RASTRO_DASH_MS) {
    rastroDash.shift();
  }
  if (isSkillActive('dash') && hasSprite && !Number.isNaN(ultimoPlayerX) && rastroDash.length < 9) {
    rastroDash.push({ x: ultimoPlayerX, y: ultimoPlayerY, angle: ultimoPlayerAngle, criadoEm: agora });
  }
  const imgRastro = hasSprite ? getSprite(poseKey('survivor', playerPose())) : null;
  if (imgRastro && rastroDash.length) {
    for (const g of rastroDash) {
      const alpha = 0.26 * (1 - (agora - g.criadoEm) / RASTRO_DASH_MS);
      if (alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(g.x, g.y);
      ctx.rotate(g.angle);
      drawSpriteFit(ctx, imgRastro, 0, 0, player.radius * 2.5, 0);
      ctx.restore();
    }
  }

  ctx.save();
  ctx.translate(player.x, player.y + balanco);
  ctx.rotate(player.angle);
  // recuo no eixo da mira: o corpo/arma volta alguns pixels e decompõe
  const recuo = getShotRecoil();
  if (recuo > 0) ctx.translate(-recuo * 3, 0);

  if (hasSprite) {
    const img = getSprite(poseKey('survivor', playerPose()))!;
    // hitFlash do jogador nunca era lido no desenho: o corpo agora dá um
    // pequeno estalo de 10% no dano, no mesmo vocabulário do squash inimigo.
    const corpoDano = player.radius * 2.5 * (1 + Math.min(0.1, player.hitFlash * 0.5));
    drawSpriteFit(ctx, img, 0, 0, corpoDano, 0);
    // A ARMA NA MÃO POR ARMA (playtest: "para cada arma equipada, um
    // sprite na mão"): autoral top-down (o pack é perfil — DECISIONS #91
    // para o corpo, vale para a mão). Nasce GRIP no ombro (o (0,0) local
    // já é o corpo girado para a mira) e o cano segue o eixo +x local.
    // a chave do cache é a própria id da mão: HAND_SPRITES já devolve 'mao_X'
    const mao = getSprite(HAND_SPRITES[getCurrentWeapon().name] ?? 'mao_pistola');
    if (mao) {
      const largura = mao.naturalWidth * (player.radius / 16);
      const altura = mao.naturalHeight * (player.radius / 16);
      ctx.drawImage(mao, -largura / 2, -altura * 0.72, largura, altura);
    }
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

/**
 * Desenha o segundo jogador do versus local.
 *
 * O P2 existe no estado desde outubro de 2026 — nasce, anda com as setas,
 * atira com L, leva dano e ganha — e nunca foi desenhado: esta função não
 * existia, então "LOCAL 2P" anunciava um jogador invisível. O rótulo é o que
 * separa os dois corpos, porque o pack tem um personagem só de jogador e a
 * paleta dá ao P2 o azul-pedra.
 *
 * É o mesmo caminho de sprite do `drawPlayer`, sem arte nova em código: sombra
 * (efeito) e um círculo que só entra se o sprite não carregar (fallback).
 */
export function drawPlayer2(p2: { x: number; y: number; radius: number; angle: number; alive: boolean }): void {
  if (!p2.alive) return;

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(p2.x, p2.y + p2.radius * 0.7, p2.radius * 0.8, p2.radius * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  const img = isSpritesEnabled() ? getSprite(poseKey('survivor', 'gun')) : null;

  ctx.save();
  ctx.translate(p2.x, p2.y);
  ctx.rotate(p2.angle);
  if (img) {
    drawSpriteFit(ctx, img, 0, 0, p2.radius * 2.5, 0);
  } else {
    // fallback declarado: só entra se a sprite do pack não carregar
    ctx.fillStyle = PALETTE.stone;
    ctx.beginPath();
    ctx.arc(0, 0, p2.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = PALETTE.stone;
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('P2', p2.x, p2.y - p2.radius - 8);
  ctx.textAlign = 'left';
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
  { id: 'fullscreen', label: 'TELA CHEIA' },
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
  // Mesma conta do desenho: o hint ocupa as últimas linhas do box. Divergir
  // aqui fazia o clique acertar a opção errada quando o rodapé tinha 2 linhas.
  const boxH = 90 + PAUSE_OPTIONS.length * rowH + getHintLines(pauseHint()).length * HINT_LINE_H;
  const x = W / 2 - boxW / 2;
  const y = H / 2 - boxH / 2;
  for (let i = 0; i < PAUSE_OPTIONS.length; i++) {
    const oy = y + 70 + i * rowH;
    if (mx >= x && mx <= x + boxW && my >= oy - 18 && my <= oy + 12) return i;
  }
  return -1;
}

/** Largura útil dentro do box, descontando a borda. */
const HINT_MAX_W = 240;
/** Fonte dos rodapés de tecla. */
const HINT_FONT = '11px monospace';
/** Avanço da linha a cada 16px de fonte, com folga. */
const HINT_LINE_H = 15;

/**
 * Rodapés de tecla como listas curtas, uma por linha.
 *
 * Uma linha só não cabia: o box do pause tem 280px e
 * 'W/S escolher · ENTER confirmar · ESC continuar' mede ~304px a 11px
 * monospace, ou seja, transbordava 24px dos dois lados. O das configurações
 * estourava 90px. Quebrar em linhas curtas cabe sem mexer na largura do box,
 * que é compartilhada pelo hit-test das opções.
 */
/**
 * Rodapé da pausa.
 *
 * Com o jogo em tela cheia a última linha muda: dentro do iframe do itch.io não
 * há barra do jogador para clicar de volta, então o ESC precisa aparecer como a
 * saída — era o que faltava para o jogador saber que estava preso.
 */
function pauseHint(): string[] {
  const base = ['W/S escolher · ENTER confirmar'];
  base.push(estaEmTelaCheia() ? 'ESC: sair da tela cheia' : 'ESC continuar');
  return base;
}
const SETTINGS_HINT = ['W/S escolher · A/D ajustar', 'ENTER alternar · ESC voltar'];

/** Largura máxima que o hint ocupa, em pixels de fonte. */
export function getHintWidth(text: string, fontPx: number): number {
  // monospace anda ~0.6em por caractere; a folga de 4px cobre o arredondamento
  return Math.ceil(text.length * fontPx * 0.6) + 4;
}

/** As linhas do rodapé já quebradas: garante que nenhuma estoura o box. */
export function getHintLines(lines: string[], maxWidth = HINT_MAX_W): string[] {
  const out: string[] = [];
  for (const linha of lines) {
    if (getHintWidth(linha, 11) <= maxWidth) { out.push(linha); continue; }
    // quebra no separador mais próximo do meio, sem partir uma instrução
    const partes = linha.split(' · ');
    let atual = '';
    for (const p of partes) {
      const candidato = atual ? `${atual} · ${p}` : p;
      if (getHintWidth(candidato, 11) <= maxWidth || !atual) atual = candidato;
      else { out.push(atual); atual = p; }
    }
    if (atual) out.push(atual);
  }
  return out;
}

/** Desenha o rodapé de tecla centrado, empilhado para baixo. */
function drawHintLines(centerX: number, bottomY: number, lines: string[]): void {
  const quebrar = getHintLines(lines);
  ctx!.fillStyle = PALETTE.textOff;
  ctx!.font = HINT_FONT;
  ctx!.textAlign = 'center';
  const topo = bottomY - (quebrar.length - 1) * HINT_LINE_H;
  quebrar.forEach((linha, i) => ctx!.fillText(linha, centerX, topo + i * HINT_LINE_H));
}

/**
 * Desenha o overlay de pausa com as opções navegáveis.
 */
export function drawPause(musicOn: boolean, sfxOn: boolean): void {
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, W, H);

  const boxW = 280;
  const rowH = 34;
  // A linha da AMEAÇA entra na conta da altura: a caixa tem de caber o que
  // ela mostra, senão o texto de baixo fica em cima da última opção.
  const boxH = 108 + PAUSE_OPTIONS.length * rowH + getHintLines(pauseHint()).length * HINT_LINE_H;
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

  // A AMEAÇA em vigor: o quanto o mundo cresceu com o preparo do jogador.
  ctx.fillStyle = PALETTE.terracotta;
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`AMEAÇA ×${formatarAmeaca(getAmeacaAtual())}`, W / 2, y + 62);

  PAUSE_OPTIONS.forEach((opt, i) => {
    const oy = y + 88 + i * rowH;
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

  drawHintLines(W / 2, y + boxH - 28, pauseHint());
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
 * @param sfx - volume dos efeitos (0–1)
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

  drawHintLines(W / 2, L.y + L.h - 28, SETTINGS_HINT);
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
  character: string;
  /** Aliado de loja (contratado/torreta): sprite próprio e rotação do cano. */
  aliado?: { sprite?: string; angulo: number; modo: string };
  /** Pose armada ('gun') para combatentes — default 'hold' é mãos vazias. */
  pose?: string;
}

export function drawNPCs(npcs: NPCData[]): void {
  for (const npc of npcs) {
    if (!npc.alive && npc.messageTimer <= 0) continue;
    ctx.globalAlpha = npc.alive ? 1 : 0.4;

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(npc.x, npc.y + npc.radius * 0.6, npc.radius * 0.7, npc.radius * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // O personagem é do NPC, não do jogador — antes TODOS vestiam 'survivor'
    // e os três amigos da campanha eram a mesma pessoa na tela (relato do
    // Murilo: "os dois outros personagens amigos com a mesma skin").
    // Aliado com sprite próprio (torreta) não tem pose: a chave é a do prop.
    // O contratado pega a pose 'gun' (mãos vazias de 'hold' era o "nem
    // parece estar segurando arma" do playtest).
    const img = isSpritesEnabled()
      ? npc.aliado?.sprite
        ? getSprite(npc.aliado.sprite)
        : getSprite(poseKey(npc.character || 'manOld', (npc.pose as Pose) || 'hold'))
      : null;
    if (img) {
      drawSpriteFit(ctx, img, npc.x, npc.y, npc.radius * 2.4, npc.aliado ? npc.aliado.angulo : 0);
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
    ctx.font = '11px monospace';
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
