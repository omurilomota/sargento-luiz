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
import { getCurrentCutscene } from './story';

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
 * Desenha a tela de menu com título, instruções e efeito de partículas animadas.
 */
export function drawMenu(): void {
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Particles
  for (let i = 0; i < 50; i++) {
    const x = (i * 73 + Date.now() / 20) % canvas.width;
    const y = (i * 47 + Date.now() / 30) % canvas.height;
    ctx.fillStyle = `rgba(46,204,113,${0.2 + Math.sin(Date.now() / 500 + i) * 0.1})`;
    ctx.beginPath();
    ctx.arc(x, y, 2 + Math.sin(Date.now() / 1000 + i) * 1, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Title with better contrast
  ctx.fillStyle = '#2ecc71';
  ctx.font = 'bold 56px monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#2ecc71';
  ctx.shadowBlur = 40;
  ctx.fillText('BUBBLE SHOOTER', canvas.width / 2, canvas.height / 2 - 140);
  ctx.shadowBlur = 0;
  
  // Subtitle
  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('PÓS-APOCALÍPTICO', canvas.width / 2, canvas.height / 2 - 95);
  
  // Separator line
  ctx.strokeStyle = 'rgba(46,204,113,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 150, canvas.height / 2 - 70);
  ctx.lineTo(canvas.width / 2 + 150, canvas.height / 2 - 70);
  ctx.stroke();
  
  // Game modes with better visibility
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('SELECIONE O MODO:', canvas.width / 2, canvas.height / 2 - 40);
  
  const modes = [
    { key: '1', name: 'CAMPANHA', desc: 'História com cutscenes', color: '#2ecc71' },
    { key: '2', name: 'SOBREVIVÊNCIA', desc: 'Ondas infinitas', color: '#e74c3c' },
    { key: '3', name: 'MISSÕES', desc: 'Objetivos específicos', color: '#f39c12' },
    { key: '4', name: 'BOSS RUSH', desc: 'Apenas bosses', color: '#9b59b6' },
  ];
  
  modes.forEach((mode, i) => {
    const y = canvas.height / 2 + i * 45;
    
    // Background for each mode
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - 180, y - 15, 360, 35, 6);
    ctx.fill();
    
    // Key
    ctx.fillStyle = mode.color;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`[${mode.key}]`, canvas.width / 2 - 160, y + 5);
    
    // Name
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(mode.name, canvas.width / 2 - 100, y + 5);
    
    // Description
    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(mode.desc, canvas.width / 2 + 170, y + 5);
    ctx.textAlign = 'center';
  });
  
  // Controls
  ctx.fillStyle = '#666';
  ctx.font = '14px monospace';
  ctx.fillText('WASD: Mover | Mouse: Mirar | Click: Atirar', canvas.width / 2, canvas.height / 2 + 200);
  ctx.fillText('Espaço: Dash | F: Escudo | R: Fúria', canvas.width / 2, canvas.height / 2 + 225);
  
  // Start prompt
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px monospace';
  const pulse = 0.5 + Math.sin(Date.now() / 400) * 0.4;
  ctx.globalAlpha = pulse;
  ctx.fillText('Pressione ENTER para jogar', canvas.width / 2, canvas.height / 2 + 280);
  ctx.globalAlpha = 1;
}

/**
 * Desenha uma cutscene da história.
 */
export function drawCutscene(): void {
  const cutscene = getCurrentCutscene();
  
  // Fundo escuro
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Partículas sutis
  for (let i = 0; i < 30; i++) {
    const x = (i * 97 + Date.now() / 30) % canvas.width;
    const y = (i * 63 + Date.now() / 40) % canvas.height;
    ctx.fillStyle = `rgba(255,255,255,${0.03 + Math.sin(Date.now() / 2000 + i) * 0.02})`;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Linha decorativa superior
  ctx.strokeStyle = cutscene.color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(canvas.width * 0.2, canvas.height * 0.25);
  ctx.lineTo(canvas.width * 0.8, canvas.height * 0.25);
  ctx.stroke();
  ctx.globalAlpha = 1;
  
  // Título
  ctx.fillStyle = cutscene.color;
  ctx.font = 'bold 36px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = cutscene.color;
  ctx.shadowBlur = 15;
  ctx.fillText(cutscene.title, canvas.width / 2, canvas.height * 0.32);
  ctx.shadowBlur = 0;
  
  // Texto narrativo
  ctx.fillStyle = '#ccc';
  ctx.font = '18px "Cinzel", serif';
  const lines = cutscene.text.split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, canvas.height * 0.4 + i * 30);
  });
  
  // Linha decorativa inferior
  ctx.strokeStyle = cutscene.color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(canvas.width * 0.2, canvas.height * 0.75);
  ctx.lineTo(canvas.width * 0.8, canvas.height * 0.75);
  ctx.stroke();
  ctx.globalAlpha = 1;
  
  // Instrução
  ctx.fillStyle = '#888';
  ctx.font = '14px monospace';
  const pulse = 0.5 + Math.sin(Date.now() / 500) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillText('Pressione ENTER ou ESPAÇO para continuar', canvas.width / 2, canvas.height * 0.85);
  ctx.globalAlpha = 1;
}

/**
 * Desenha a tela de game over com pontuação final e opção de reiniciar.
 * @param score - pontuação final do jogador
 * @param killStreak - total de inimigos derrotados
 */
export function drawGameOver(score: number, killStreak: number): void {
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 30; i++) {
    const x = (i * 100 + Date.now() / 40) % canvas.width;
    const y = (i * 80 + Date.now() / 50) % canvas.height;
    ctx.fillStyle = `rgba(231,76,60,${0.15 + Math.sin(Date.now() / 800 + i) * 0.05})`;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 56px monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#e74c3c';
  ctx.shadowBlur = 30;
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 70);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.fillText(`Pontos: ${score}`, canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillText(`Kills: ${killStreak}`, canvas.width / 2, canvas.height / 2 + 20);
  const pulse = 0.7 + Math.sin(Date.now() / 400) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillText('Pressione ENTER para reiniciar', canvas.width / 2, canvas.height / 2 + 70);
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
    ctx.shadowBlur = 10;
    const trailLen = b.isEnemy ? 8 : 12;
    const speed = Math.hypot(b.vx, b.vy) || 1;
    const tx = b.x - (b.vx / speed) * trailLen;
    const ty = b.y - (b.vy / speed) * trailLen;
    const grad = ctx.createLinearGradient(tx, ty, b.x, b.y);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, b.color);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.isEnemy ? 3 : 4, 0, Math.PI * 2);
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
      // Draw sprite
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
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(-barW / 2, -e.radius - 12, barW * (e.health / e.maxHealth), 5);
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
      // Fallback to canvas drawing
      let playerColor = '#2ecc71';
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
      ctx.shadowColor = playerColor;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
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
