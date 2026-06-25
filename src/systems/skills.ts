/**
 * Sistema de habilidades do jogador.
 * Dash, escudo temporal, modo fúria.
 * Habilidades são ativadas por teclas e têm cooldown.
 */

import { Player } from '../entities/player';

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
 * Tenta ativar uma habilidade.
 * @param type - tipo da habilidade
 * @returns true se a habilidade foi ativada
 */
export function useSkill(type: SkillType): boolean {
  const skill = skills[type];
  if (skill.cooldown > 0 || skill.active) return false;
  
  skill.active = true;
  skill.duration = skill.maxDuration;
  skill.cooldown = skill.maxCooldown;
  return true;
}

/**
 * Verifica se uma habilidade está ativa.
 * @param type - tipo da habilidade
 * @returns true se ativa
 */
export function isSkillActive(type: SkillType): boolean {
  return skills[type].active;
}

/**
 * Retorna o cooldown restante de uma habilidade.
 * @param type - tipo da habilidade
 * @returns segundos restantes de cooldown
 */
export function getSkillCooldown(type: SkillType): number {
  return skills[type].cooldown;
}

/**
 * Retorna o cooldown máximo de uma habilidade.
 * @param type - tipo da habilidade
 * @returns segundos totais de cooldown
 */
export function getSkillMaxCooldown(type: SkillType): number {
  return skills[type].maxCooldown;
}

/**
 * Retorna se uma habilidade está em cooldown.
 * @param type - tipo da habilidade
 * @returns true se em cooldown
 */
export function isSkillOnCooldown(type: SkillType): boolean {
  return skills[type].cooldown > 0;
}

/**
 * Retorna o multiplicador de dano baseado nas habilidades ativas.
 * @returns multiplicador de dano
 */
export function getDamageMultiplier(): number {
  return skills.fury.active ? FURY_DAMAGE_MULT : 1;
}

/**
 * Retorna o multiplicador de dano recebido baseado nas habilidades ativas.
 * @returns multiplicador de dano recebido
 */
export function getDamageTakenMultiplier(): number {
  if (skills.shield.active) return 0;
  return skills.fury.active ? FURY_DAMAGE_TAKEN_MULT : 1;
}

/**
 * Atualiza todas as habilidades.
 * @param dt - delta time em segundos
 * @param player - estado do jogador (para dash)
 */
export function updateSkills(dt: number, player: Player): void {
  for (const type of Object.keys(skills) as SkillType[]) {
    const skill = skills[type];
    
    if (skill.cooldown > 0) {
      skill.cooldown = Math.max(0, skill.cooldown - dt);
    }
    
    if (skill.active) {
      skill.duration -= dt;
      
      // Dash move o jogador
      if (type === 'dash' && skill.duration > 0) {
        const dashDist = DASH_SPEED * dt;
        player.x += Math.cos(player.angle) * dashDist;
        player.y += Math.sin(player.angle) * dashDist;
        player.invincible = 0.1; // Invencível durante dash
      }
      
      if (skill.duration <= 0) {
        skill.active = false;
      }
    }
  }
}

/**
 * Reseta todas as habilidades.
 */
export function resetSkills(): void {
  for (const type of Object.keys(skills) as SkillType[]) {
    skills[type].cooldown = 0;
    skills[type].duration = 0;
    skills[type].active = false;
  }
}
