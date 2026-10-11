/**
 * src/systems/classes.ts
 *
 * Classes de personagem com modificadores exclusivos.
 * Cada classe usa um sprite diferente do pack Kenney e concede um bônus passivo.
 */

export type ClassId = 'soldado' | 'sobrevivente' | 'robo' | 'medico';

export interface ClassDef {
  id: ClassId;
  name: string;
  desc: string;
  color: string;
  sprite: string;
  damageMult: number;
  speedMult: number;
  reloadMult: number;
  /**
   * Vida por segundo durante o combate (MÉDICO).
   *
   * Era HP por abate, o que premiava matar cinco inimigos fracos em vez de
   * segurar a linha contra um mutante: a cura vinha da contagem, não do
   * esforço. Por segundo, segurar a linha compensa.
   */
  healthPerSecond: number;
}

export const CLASSES: ClassDef[] = [
  {
    id: 'soldado',
    name: 'SOLDADO',
    desc: '+15% dano',
    color: '#7a9a6a',
    sprite: 'soldier',
    damageMult: 1.15,
    speedMult: 1.0,
    reloadMult: 1.0,
    healthPerSecond: 0,
  },
  {
    id: 'sobrevivente',
    name: 'SOBREVIVENTE',
    desc: '+15% velocidade',
    color: '#608090',
    sprite: 'survivor',
    damageMult: 1.0,
    speedMult: 1.15,
    reloadMult: 1.0,
    healthPerSecond: 0,
  },
  {
    id: 'robo',
    name: 'ROBÔ',
    desc: '+20% recarga',
    color: '#b07050',
    sprite: 'robot',
    damageMult: 1.0,
    speedMult: 1.0,
    reloadMult: 0.8,
    healthPerSecond: 0,
  },
  {
    id: 'medico',
    name: 'MÉDICO',
    desc: '+4 HP/s em combate',
    color: '#8b4040',
    sprite: 'manBlue',
    damageMult: 1.0,
    speedMult: 1.0,
    reloadMult: 1.0,
    healthPerSecond: 4,
  },
];

let currentClass: ClassId = 'soldado';

export function getCurrentClass(): ClassDef {
  return CLASSES.find(c => c.id === currentClass) ?? CLASSES[0];
}

export function setCurrentClass(id: ClassId): void {
  currentClass = id;
}

export function getClassDamageMult(): number {
  return getCurrentClass().damageMult;
}

export function getClassSpeedMult(): number {
  return getCurrentClass().speedMult;
}

export function getClassReloadMult(): number {
  return getCurrentClass().reloadMult;
}

export function getClassHealthPerSecond(): number {
  return getCurrentClass().healthPerSecond;
}

const CLASS_KEY = 'rios.class';

export function loadClass(): void {
  try {
    const raw = localStorage.getItem(CLASS_KEY);
    if (raw && CLASSES.some(c => c.id === raw)) {
      currentClass = raw as ClassId;
    }
  } catch {}
}

export function saveClass(): void {
  try {
    localStorage.setItem(CLASS_KEY, currentClass);
  } catch {}
}

export function resetClass(): void {
  currentClass = 'soldado';
  saveClass();
}
