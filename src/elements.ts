import { Element } from './types';
import { ELEMENTS } from './config';

let currentElement: Element | null = null;
let elementDuration: number = 0;

export function getCurrentElement(): Element | null {
  return currentElement;
}

export function applyElement(elementType: string) {
  const element = ELEMENTS.find(e => e.type === elementType);
  if (element) {
    currentElement = element;
    elementDuration = element.duration;
  }
}

export function updateElements(dt: number): { active: boolean; effect: string; damage: number } {
  if (currentElement && elementDuration > 0) {
    elementDuration -= dt;
    if (elementDuration <= 0) {
      currentElement = null;
      return { active: false, effect: '', damage: 0 };
    }
    return { active: true, effect: currentElement.effect, damage: currentElement.damage };
  }
  return { active: false, effect: '', damage: 0 };
}

export function resetElements() {
  currentElement = null;
  elementDuration = 0;
}

export function getBulletElement(): string | null {
  return currentElement?.type || null;
}

export function getBulletElementColor(): string | null {
  return currentElement?.color || null;
}

export function drawElementIndicator(ctx: CanvasRenderingContext2D, x: number, y: number) {
  if (currentElement) {
    ctx.fillStyle = currentElement.color;
    ctx.beginPath();
    ctx.arc(x, y - 30, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(currentElement.name.charAt(0), x, y - 27);
  }
}
