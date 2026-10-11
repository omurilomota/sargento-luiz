/**
 * Sistema de habilidades do jogador.
 * Dash, escudo temporal, modo fúria.
 * Habilidades são ativadas por teclas e têm cooldown.
 */

import { Player } from '../entities/player';
import { hasPowerUp } from '../powerups';
import { getStat } from '../core/stats';

/** Tipos de habilidade disponíveis */
export type SkillType = 'dash' | 'shield' | 'fury';

/** Estado de uma habilidade */
interface SkillState {
  /** Cooldown restante em segundos */
  cooldown: number;
  /** Duração restante (para habilidades com duração) */
  duration: number;
  /** Cooldown máximo em segundos */
  maxCooldown: number;
  /** Duração máxima em segundos */
  maxDuration: number;
  /** Se a habilidade está ativa */
  active: boolean;
}

/** Estado de todas as habilidades */
const skills: Record<SkillType, SkillState> = {
  dash: { cooldown: 0, duration: 0, maxCooldown: 3, maxDuration: 0.2, active: false },
  shield: { cooldown: 0, duration: 0, maxCooldown: 10, maxDuration: 3, active: false },
  fury: { cooldown: 0, duration: 0, maxCooldown: 15, maxDuration: 5, active: false },
};

/** Velocidade do dash em pixels/segundo */
const DASH_SPEED = 800;
/** Escala de dano na fúria */
const FURY_DAMAGE_MULT = 2;
/** Escala de dano recebido na fúria */
const FURY_DAMAGE_TAKEN_MULT = 1.5;
/**
 * Multiplicador do INTERVALO entre tiros durante a fúria.
 *
 * A fúria só mexia em dano (2×) e dano recebido (1,5×). Dano sem cadência
 * continua sendo dano, então a habilidade não mudava a *ritmo* de combate —
 * uma Metralhadora em fúria matava mais, mas no mesmo ritmo. Como 0.75 é
 * multiplicador de intervalo, a conta real é 1/0.75 = +33% de cadência.
 */
const FURY_COOLDOWN_MULT = 0.75;
/** Direção da última investida do dash (undefined = parado) */
let dashDirection: { x: number; y: number } | null = null;

/**
 * Informa o módulo de skills para qual lado o jogador está andando.
 * O dash segue o movimento, não o mouse: uma esquiva que vai para onde a
 * arma aponta é o oposto de esquivar.
 */
export function setMoveDirection(dx: number, dy: number): void {
  if (dx === 0 && dy === 0) {
    dashDirection = null;
    return;
  }
  const len = Math.hypot(dx, dy) || 1;
  dashDirection = { x: dx / len, y: dy / len };
}

/**
 * Tenta ativar uma habilidade.
 * @returns true se a habilidade foi ativada
 */
export function useSkill(type: SkillType): boolean {
  const skill = skills[type];
  if (skill.cooldown > 0 || skill.active) return false;

  skill.active = true;
  skill.duration = skill.maxDuration;
  skill.cooldown = skill.maxCooldown * getStat('dashCooldown');
  return true;
}

/**
 * Verifica se uma habilidade está ativa.
 * @returns true se ativa
 */
export function isSkillActive(type: SkillType): boolean {
  return skills[type].active;
}

/**
 * Retorna o cooldown restante de uma habilidade.
 * @returns segundos restantes de cooldown
 */
export function getSkillCooldown(type: SkillType): number {
  return skills[type].cooldown;
}

/**
 * Retorna o cooldown máximo de uma habilidade.
 * @returns segundos totais de cooldown
 */
export function getSkillMaxCooldown(type: SkillType): number {
  return skills[type].maxCooldown;
}

/**
 * Retorna se uma habilidade está em cooldown.
 * @returns true se em cooldown

/**
 * Retorna o multiplicador de dano baseado nas habilidades ativas.
 */
export function getDamageMultiplier(): number {
  let mult = skills.fury.active ? FURY_DAMAGE_MULT : 1;
  if (hasPowerUp('furia')) mult *= 1.3;
  if (hasPowerUp('trajeNucleo')) mult *= 2;
  return mult;
}

/**
 * Multiplicador do intervalo entre tiros durante a fúria.
 * `< 1` dispara mais rápido. Retorna 1 com a fúria inativa.
 */
export function getFuryCooldownMult(): number {
  return skills.fury.active ? FURY_COOLDOWN_MULT : 1;
}

/**
 * Retorna o multiplicador de dano recebido baseado nas habilidades ativas.
 */
export function getDamageTakenMultiplier(): number {
  if (skills.shield.active) return 0;
  let mult = skills.fury.active ? FURY_DAMAGE_TAKEN_MULT : 1;
  if (hasPowerUp('peleDePedra')) mult *= 0.5;
  if (hasPowerUp('trajeNucleo')) mult *= 0.5;
  return mult;
}

/**
 * Atualiza todas as habilidades.
 * @param bounds - limites do mundo (o dash precisa de clamp, senão atravessa a borda)
 */
export function updateSkills(dt: number, player: Player, bounds?: { w: number; h: number }): void {
  for (const type of Object.keys(skills) as SkillType[]) {
    const skill = skills[type];

    if (skill.cooldown > 0) {
      skill.cooldown = Math.max(0, skill.cooldown - dt);
    }

    if (skill.active) {
      skill.duration -= dt;

      // Dash move o jogador na direção do movimento; parado, usa a mira
      if (type === 'dash' && skill.duration > 0) {
        const dir = dashDirection ?? { x: Math.cos(player.angle), y: Math.sin(player.angle) };
        const dashDist = DASH_SPEED * dt;
        player.x += dir.x * dashDist;
        player.y += dir.y * dashDist;
        player.invincible = 0.1; // Invencível durante dash
      }

      if (skill.duration <= 0) {
        skill.active = false;
      }
    }
  }

  if (bounds) {
    player.x = Math.max(player.radius, Math.min(bounds.w - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(bounds.h - player.radius, player.y));
  }
}

/**
 * Reseta todas as habilidades.
 */
export function resetSkills(): void {
  dashDirection = null;
  for (const type of Object.keys(skills) as SkillType[]) {
    skills[type].cooldown = 0;
    skills[type].duration = 0;
    skills[type].active = false;
  }
}
