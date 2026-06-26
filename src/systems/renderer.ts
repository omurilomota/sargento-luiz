/**
 * Sistema de renderização Canvas 2D.
 * Responsável por desenhar todos os elementos visuais do jogo:
 * menu, fundo, inimigos, jogador, projéteis, partículas, moedas,
 * power-ups, HUD e efeitos visuais.
 */

import { Enemy, Bullet, Particle, Coin, PowerUp } from '../types';
import { ENEMY_TYPES, POWERUP_TYPES } from '../config';
import { Player } from '../entities/player';
import { hasPowerUp } from '../powerups';
import { isSkillActive } from './skills';
import { getSprite, getEnemySpriteKey, isSpritesEnabled } from './sprites';
import { getCurrentCutscene, getCurrentLine, isLineComplete, getTextProgress, getPortraitInfo, Character } from './story';
import { getEquippedSkin } from './skins';
import { hasSave } from './saveSystem';
import { getLeaderboard, addLeaderboardEntry } from './leaderboard';

/** Contexto 2D do canvas */
let ctx: CanvasRenderingContext2D;
/** Elemento canvas principal */
let canvas: HTMLCanvasElement;

/**
 * Inicializa o renderer com o canvas e contexto fornecidos.
 * @param canvasEl - elemento canvas HTML
 * @param ctxEl - contexto 2D do canvas
 */
export function initRenderer(canvasEl: HTMLCanvasElement, ctxEl: CanvasRenderingContext2D): void {
  canvas = canvasEl;
  ctx = ctxEl;
}

/**
 * Desenha o menu principal com partículas e opções de jogo.
 * @param selectedMode - modo atualmente selecionado
 */
export function drawMenu(selectedMode: string = 'campaign'): void {
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, W, H);

  // Particles
  for (let i = 0; i < 8; i++) {
    const x = (i * 137 + Date.now() / 40) % W;
    const y = (i * 89 + Date.now() / 50) % H;
    ctx.fillStyle = `rgba(180,160,130,${0.1 + Math.sin(Date.now() / 2000 + i) * 0.05})`;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Layout: title at top, modes in middle, controls at bottom
  const titleY = H * 0.12;
  const subtitleY = titleY + 24;
  const modesStartY = H * 0.28;
  const modeSpacing = Math.min(40, (H * 0.55) / 6);
  const controlsY = H * 0.88;
  const startPromptY = H * 0.94;

  // Title
  ctx.fillStyle = '#c8b890';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BUBBLE SHOOTER', W / 2, titleY);

  // Subtitle
  ctx.fillStyle = '#555';
  ctx.font = '12px monospace';
  ctx.fillText('POS-APOCALIPTICO', W / 2, subtitleY);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.3, subtitleY + 12);
  ctx.lineTo(W * 0.7, subtitleY + 12);
  ctx.stroke();

  // Mode label
  ctx.fillStyle = '#666';
  ctx.font = '11px monospace';
  ctx.fillText('SELECIONE O MODO (tecle 1-6)', W / 2, modesStartY - 12);

  const modes = [
    { key: '1', name: 'CAMPANHA', desc: 'Historia com cutscenes', color: '#7a9a6a' },
    { key: '2', name: 'SOBREVIVENCIA', desc: 'Ondas infinitas', color: '#b07050' },
    { key: '3', name: 'MISSOES', desc: 'Objetivos especificos', color: '#a08050' },
    { key: '4', name: 'BOSS RUSH', desc: 'Apenas bosses', color: '#8070a0' },
    { key: '5', name: 'COMPETITIVO', desc: 'Vs bots IA', color: '#608090' },
    { key: '6', name: 'LOCAL 2P', desc: 'Mesmo teclado', color: '#b07050' },
  ];

  const modeKeyMap: Record<string, string> = {
    '1': 'campaign', '2': 'survival', '3': 'missions',
    '4': 'bossrush', '5': 'competitive', '6': 'local',
  };

  const boxW = Math.min(340, W * 0.7);
  const boxH = Math.min(32, modeSpacing - 4);

  modes.forEach((mode, i) => {
    const y = modesStartY + i * modeSpacing;
    const isSelected = modeKeyMap[mode.key] === selectedMode;

    // Background
    ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - boxW / 2, y, boxW, boxH, 3);
    ctx.fill();

    // Border
    ctx.strokeStyle = isSelected ? mode.color : 'rgba(255,255,255,0.06)';
    ctx.lineWidth = isSelected ? 1.5 : 0.5;
    ctx.stroke();

    // Arrow
    if (isSelected) {
      ctx.fillStyle = mode.color;
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('>', W / 2 - boxW / 2 + 8, y + boxH / 2 + 4);
    }

    // Key
    ctx.fillStyle = isSelected ? '#fff' : mode.color;
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(mode.key, W / 2 - boxW / 2 + 22, y + boxH / 2 + 4);

    // Name
    ctx.fillStyle = isSelected ? '#fff' : '#aaa';
    ctx.font = '12px monospace';
    ctx.fillText(mode.name, W / 2 - boxW / 2 + 42, y + boxH / 2 + 4);

    // Desc
    ctx.fillStyle = isSelected ? '#777' : '#444';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(mode.desc, W / 2 + boxW / 2 - 10, y + boxH / 2 + 4);
    ctx.textAlign = 'center';
  });

  // Controls
  ctx.fillStyle = '#444';
  ctx.font = '10px monospace';
  ctx.fillText('WASD: Mover | Mouse: Mirar | Click: Atirar', W / 2, controlsY);
  ctx.fillText('Espaco: Dash | F: Escudo | E: Furia | R: Recarregar', W / 2, controlsY + 14);

  // Continue option if save exists
  if (hasSave()) {
    ctx.fillStyle = '#a08050';
    ctx.font = '12px monospace';
    ctx.fillText('C: Continuar jogo salvo', W / 2, startPromptY - 18);
  }

  // Start prompt
  ctx.fillStyle = '#777';
  ctx.font = '13px monospace';
  const pulse = 0.3 + Math.sin(Date.now() / 600) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillText('ENTER para jogar', W / 2, startPromptY);
  ctx.globalAlpha = 1;
}

/**
 * Desenha uma cutscene da história.
 */
export function drawCutscene(): void {
  const cutscene = getCurrentCutscene();
  const line = getCurrentLine();
  const portrait = getPortraitInfo(line.speaker);
  const progress = getTextProgress();
  const complete = isLineComplete();

  // Fundo escuro
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Linha superior sutil
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvas.width * 0.15, canvas.height * 0.18);
  ctx.lineTo(canvas.width * 0.85, canvas.height * 0.18);
  ctx.stroke();

  // Título da cena
  ctx.fillStyle = cutscene.color;
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(cutscene.title, canvas.width / 2, canvas.height * 0.15);

  // Retrato do personagem (círculo simples)
  const portraitX = canvas.width * 0.2;
  const portraitY = canvas.height * 0.45;
  const portraitR = 35;

  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.beginPath();
  ctx.arc(portraitX, portraitY, portraitR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = portrait.color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inicial do personagem
  if (line.speaker !== 'narrador') {
    ctx.fillStyle = portrait.color;
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(line.speaker === 'rios' ? 'R' : line.speaker === 'comandante' ? 'V' : 'F', portraitX, portraitY + 8);
  } else {
    ctx.fillStyle = '#555';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('*', portraitX, portraitY + 7);
  }

  // Nome do personagem
  ctx.fillStyle = portrait.color;
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(portrait.name, portraitX + portraitR + 16, portraitY - 10);

  // Texto com efeito de máquina de escrever
  const displayedText = line.text.substring(0, Math.floor(progress));
  ctx.fillStyle = '#bbb';
  ctx.font = '16px monospace';
  ctx.textAlign = 'left';

  const textX = portraitX + portraitR + 16;
  const textY = portraitY + 10;
  const maxWidth = canvas.width * 0.6;

  wrapText(ctx, displayedText, textX, textY, maxWidth, 22);

  // Indicador de continuação
  if (complete) {
    ctx.fillStyle = '#555';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    const pulse = 0.3 + Math.sin(Date.now() / 500) * 0.3;
    ctx.globalAlpha = pulse;
    ctx.fillText('BACKSPACE >>', canvas.width - 30, canvas.height - 30);
    ctx.globalAlpha = 1;
  }

  // Linha inferior
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvas.width * 0.15, canvas.height * 0.82);
  ctx.lineTo(canvas.width * 0.85, canvas.height * 0.82);
  ctx.stroke();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line.trim(), x, currentY);
      line = word + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}

/**
 * Desenha a tela de game over com pontuação final e opção de reiniciar.
 * @param score - pontuação final do jogador
 * @param killStreak - total de inimigos derrotados
 */
export function drawGameOver(score: number, killStreak: number): void {
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = '#b07050';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', W / 2, H * 0.12);

  // Stats
  ctx.fillStyle = '#ccc';
  ctx.font = '18px monospace';
  ctx.fillText(`Pontos: ${score}`, W / 2, H * 0.22);
  ctx.fillText(`Kills: ${killStreak}`, W / 2, H * 0.28);

  // Leaderboard
  const lb = getLeaderboard();
  if (lb.length > 0) {
    ctx.fillStyle = '#a08050';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('RECORDES', W / 2, H * 0.38);

    ctx.font = '12px monospace';
    lb.slice(0, 5).forEach((entry, i) => {
      const y = H * 0.44 + i * 22;
      const isNew = entry.score === score;
      ctx.fillStyle = isNew ? '#a08050' : '#666';
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}. ${entry.name}`, W / 2 - 120, y);
      ctx.textAlign = 'right';
      ctx.fillText(`${entry.score} pts`, W / 2 + 120, y);
    });
    ctx.textAlign = 'center';
  }

  // Controls
  const pulse = 0.3 + Math.sin(Date.now() / 600) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#777';
  ctx.font = '13px monospace';
  ctx.fillText('ENTER para reiniciar', W / 2, H * 0.85);
  ctx.globalAlpha = 1;
}

/**
 * Desenha o fundo do campo de batalha com grade e efeito de screen shake.
 * @param bg - cor de fundo principal
 * @param gridColor - cor da grade
 * @param screenShake - intensidade do tremor (0 = sem shake)
 */
export function drawGameBackground(bg: string, gridColor: string, shake: { x: number; y: number }): void {
  ctx.save();
  ctx.translate(shake.x, shake.y);
  ctx.fillStyle = bg;
  ctx.fillRect(-10, -10, canvas.width + 20, canvas.height + 20);
  const gridSize = 50;
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
}

/**
 * Desenha a transição visual entre ondas com sobreposição semi-transparente.
 * @param phaseTransition - tempo restante da transição (0 = sem transição)
 * @param currentWave - número da onda atual para exibir
 * @param phaseName - nome da fase atual (opcional)
 */
export function drawPhaseTransition(phaseTransition: number, currentWave: number, phaseName: string | undefined): void {
  if (phaseTransition > 0) {
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
}

/**
 * Desenha todas as moedas no campo de batalha com efeito de pulso.
 * @param coins - array de moedas ativas
 */
export function drawCoins(coins: Coin[]): void {
  for (const c of coins) {
    const pulse = 1 + Math.sin(Date.now() / 300 + c.x) * 0.15;
    const alpha = Math.max(0, Math.min(1, c.life / 3));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#f1c40f';
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 7 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#d4ac0d';
    ctx.beginPath();
    ctx.arc(c.x - 1, c.y - 1, 4 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', c.x, c.y + 1);
  }
  ctx.globalAlpha = 1;
}

/**
 * Desenha todos os power-ups no campo de batalha com efeito de flutuação.
 * @param powerups - array de power-ups ativos
 */
export function drawPowerUps(powerups: PowerUp[]): void {
  for (const p of powerups) {
    const def = POWERUP_TYPES[p.type];
    const bob = Math.sin(Date.now() / 200 + p.x) * 3;
    const alpha = Math.min(1, p.life / 2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = def.color;
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.symbol, p.x, p.y + bob);
  }
  ctx.globalAlpha = 1;
}

/**
 * Desenha todas as partículas com transparência baseada no tempo de vida.
 * @param particles - array de partículas ativas
 */
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

/**
 * Desenha todos os projéteis com efeito de rastro gradiente.
 * @param bullets - array de projéteis ativos
 */
export function drawBullets(bullets: Bullet[]): void {
  for (const b of bullets) {
    ctx.fillStyle = b.color;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = b.isEnemy ? 14 : 10;
    const trailLen = b.isEnemy ? 12 : 12;
    const speed = Math.hypot(b.vx, b.vy) || 1;
    const tx = b.x - (b.vx / speed) * trailLen;
    const ty = b.y - (b.vy / speed) * trailLen;
    const grad = ctx.createLinearGradient(tx, ty, b.x, b.y);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, b.color);
    ctx.strokeStyle = grad;
    ctx.lineWidth = b.isEnemy ? 5 : 4;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.isEnemy ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

/**
 * Desenha todos os inimigos com visuais diferenciados por tipo:
 * formas hexagonais para armadura, estrelas para chefes, círculos para normais.
 * Inclui barra de vida e olhos que seguem o jogador.
 * @param enemies - array de inimigos ativos
 * @param playerX - posição horizontal do jogador (para direcionar olhos)
 * @param playerY - posição vertical do jogador (para direcionar olhos)
 */
export function drawEnemies(enemies: Enemy[], playerX: number, playerY: number): void {
  for (const e of enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);

    // Try to use sprite if available
    const spriteKey = getEnemySpriteKey(e.type);
    const sprite = spriteKey ? getSprite(spriteKey) : null;

    if (sprite && isSpritesEnabled()) {
      ctx.drawImage(sprite, -e.radius, -e.radius, e.radius * 2, e.radius * 2);
    } else {
      // Fallback to canvas drawing
      const def = ENEMY_TYPES[e.type];
      ctx.fillStyle = e.color;
      ctx.shadowColor = e.color;
      
      // Different shapes based on enemy type
      if (def?.armor) {
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = e.angle + (i * Math.PI * 2) / 6;
          const r = e.radius * (i % 2 === 0 ? 1 : 0.8);
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (def?.isBoss) {
        ctx.shadowBlur = 25;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = e.angle + (i * Math.PI * 2) / 8;
          const r = e.radius * (i % 2 === 0 ? 1 : 0.6);
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, e.radius);
        gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (e.type === 'slime' || e.type === 'lavaSlime') {
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.arc(-e.radius * 0.3, -e.radius * 0.3, e.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (e.type === 'ufo' || e.type === 'drone') {
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, -e.radius);
        ctx.lineTo(e.radius * 0.7, 0);
        ctx.lineTo(0, e.radius);
        ctx.lineTo(-e.radius * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (e.type === 'mosquito') {
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(e.radius, 0);
        ctx.lineTo(-e.radius * 0.6, -e.radius * 0.5);
        ctx.lineTo(-e.radius * 0.6, e.radius * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (e.type === 'knight' || e.type === 'magmaGolem') {
        ctx.shadowBlur = 10;
        const r = e.radius * 0.85;
        ctx.beginPath();
        ctx.rect(-r, -r, r * 2, r * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-r, -r, r * 0.4, r * 0.4);
        ctx.fillRect(r * 0.6, -r, r * 0.4, r * 0.4);
        ctx.fillRect(-r, r * 0.6, r * 0.4, r * 0.4);
        ctx.fillRect(r * 0.6, r * 0.6, r * 0.4, r * 0.4);
        ctx.shadowBlur = 0;
      } else {
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
    
    // Health bar
    if (e.health < e.maxHealth) {
      const barW = e.radius * 2;
      ctx.fillStyle = '#333';
      ctx.fillRect(-barW / 2, -e.radius - 12, barW, 5);
      ctx.fillStyle = '#8b4040';
      ctx.fillRect(-barW / 2, -e.radius - 12, barW * (e.health / e.maxHealth), 5);
    }

    // Hit flash overlay
    if (e.hitFlash > 0) {
      ctx.globalAlpha = e.hitFlash / 0.15 * 0.6;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}

/**
 * Desenha o jogador com efeitos visuais baseados no estado:
 * flash durante invincibilidade, aura de escudo, anel de invencibilidade,
 * mira direcional e olhos.
 * @param player - objeto do jogador com suas propriedades atuais
 */
export function drawPlayer(player: Player): void {
  const flash = player.invincible > 0 && Math.floor(player.invincible * 25) % 2;
  if (!flash) {
    // Try to use sprite if available
    const sprite = getSprite('player');
    if (sprite && isSpritesEnabled()) {
      // Draw sprite with effects overlay
      ctx.save();
      ctx.translate(player.x, player.y);
      
      // Apply color tint based on active effects
      if (isSkillActive('fury')) {
        ctx.globalAlpha = 0.8;
        ctx.drawImage(sprite, -player.radius, -player.radius, player.radius * 2, player.radius * 2);
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
        ctx.fillRect(-player.radius, -player.radius, player.radius * 2, player.radius * 2);
        ctx.globalCompositeOperation = 'source-over';
      } else if (isSkillActive('shield')) {
        ctx.drawImage(sprite, -player.radius, -player.radius, player.radius * 2, player.radius * 2);
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, player.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.drawImage(sprite, -player.radius, -player.radius, player.radius * 2, player.radius * 2);
      }
      
      ctx.restore();
    } else {
      // Fallback to canvas drawing with skin
      const skin = getEquippedSkin();
      let playerColor = skin.bodyColor;
      if (hasPowerUp('invincible')) {
        playerColor = '#f1c40f';
      } else if (isSkillActive('shield')) {
        playerColor = '#3498db';
      } else if (isSkillActive('fury')) {
        playerColor = '#e74c3c';
      } else if (player.shield > 0) {
        playerColor = '#3498db';
      }

      ctx.fillStyle = playerColor;
      ctx.shadowColor = skin.borderColor;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Aim direction indicator with skin color
      ctx.strokeStyle = skin.aimColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(player.x + Math.cos(player.angle) * player.radius * 1.5, player.y + Math.sin(player.angle) * player.radius * 1.5);
      ctx.stroke();
    }
    
    // Shield skill aura (blue pulsing ring)
    if (isSkillActive('shield')) {
      ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 10 + Math.sin(Date.now() / 100) * 3, 0, Math.PI * 2);
      ctx.stroke();
      
      // Second ring
      ctx.strokeStyle = 'rgba(52, 152, 219, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 18 + Math.sin(Date.now() / 150) * 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Fury skill aura (red pulsing flames)
    if (isSkillActive('fury')) {
      ctx.strokeStyle = 'rgba(231, 76, 60, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 8 + Math.sin(Date.now() / 80) * 4, 0, Math.PI * 2);
      ctx.stroke();
      
      // Flame particles around player
      for (let i = 0; i < 6; i++) {
        const angle = (Date.now() / 200 + i * Math.PI / 3);
        const dist = player.radius + 15 + Math.sin(Date.now() / 100 + i) * 5;
        const fx = player.x + Math.cos(angle) * dist;
        const fy = player.y + Math.sin(angle) * dist;
        ctx.fillStyle = `rgba(231, 76, 60, ${0.5 + Math.sin(Date.now() / 50 + i) * 0.3})`;
        ctx.beginPath();
        ctx.arc(fx, fy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Invincibility powerup effect
    if (hasPowerUp('invincible')) {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 5 + Math.sin(Date.now() / 100) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Shield item effect
    if (player.shield > 0 && !isSkillActive('shield')) {
      ctx.strokeStyle = 'rgba(52,152,219,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Gun barrel
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(player.angle) * 28, player.y + Math.sin(player.angle) * 28);
    ctx.stroke();
  }
}

/**
 * Desenha os números de dano flutuantes sobre inimigos atingidos.
 * @param damageNumbers - array de números de dano ativos
 */
export function drawDamageNumbers(damageNumbers: { x: number; y: number; text: string; color: string; life: number; vy: number }[]): void {
  for (const d of damageNumbers) {
    const alpha = Math.min(1, d.life / 0.5);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = d.color;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(d.text, d.x, d.y);
  }
  ctx.globalAlpha = 1;
}

/**
 * Desenha o indicador de combo no topo da tela.
 * @param combo - multiplicador atual do combo (exibido apenas se > 1)
 */
export function drawCombo(combo: number): void {
  if (combo > 1) {
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 10;
    ctx.fillText(`COMBO x${combo}`, canvas.width / 2, 40);
    ctx.shadowBlur = 0;
  }
}

/**
 * Desenha o nome da arma atual no canto inferior esquerdo.
 * @param weaponName - nome da arma equipada
 */
export function drawWeaponInfo(weaponName: string): void {
  ctx.fillStyle = '#aaa';
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(weaponName, 20, canvas.height - 20);
}

/**
 * Desenha os ícones dos power-ups ativos com tempo restante no canto superior direito.
 * @param activePowerups - mapa de power-ups ativos e seus tempos restantes
 */
export function drawActivePowerUps(activePowerups: Record<string, number>): void {
  let x = canvas.width - 20;
  for (const key in activePowerups) {
    const def = POWERUP_TYPES[key];
    const remaining = activePowerups[key];
    ctx.fillStyle = def.color;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(x, 30, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.symbol, x, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(remaining.toFixed(1), x, 52);
    x -= 35;
  }
  ctx.globalAlpha = 1;
}

/**
 * Restaura o estado do canvas após uso de save/translate (screen shake).
 */
export function restoreCanvas(): void {
  ctx.restore();
}
