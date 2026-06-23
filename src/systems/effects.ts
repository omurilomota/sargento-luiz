/**
 * Sistema de efeitos visuais (Game Juice).
 * Screen shake, flash de dano, flash de level up, slow motion, hit stop.
 */

// ─── Screen Shake ────────────────────────────────────────────
let screenShakeIntensity = 0;
let screenShakeDuration = 0;

/**
 * Ativa screen shake.
 * @param intensity - força do tremor (1-20)
 * @param duration - duração em segundos
 */
export function triggerScreenShake(intensity: number, duration: number): void {
  screenShakeIntensity = Math.max(screenShakeIntensity, intensity);
  screenShakeDuration = Math.max(screenShakeDuration, duration);
}

/**
 * Atualiza o screen shake. Chamar a cada frame.
 * @param dt - delta time em segundos
 * @returns deslocamento {x, y} para aplicar no canvas
 */
export function updateScreenShake(dt: number): { x: number; y: number } {
  if (screenShakeDuration > 0) {
    screenShakeDuration -= dt;
    const decay = screenShakeDuration > 0 ? 1 : 0;
    const x = (Math.random() - 0.5) * screenShakeIntensity * 2 * decay;
    const y = (Math.random() - 0.5) * screenShakeIntensity * 2 * decay;
    if (screenShakeDuration <= 0) {
      screenShakeIntensity = 0;
    }
    return { x, y };
  }
  return { x: 0, y: 0 };
}

// ─── Flash Overlay ───────────────────────────────────────────
let flashColor = '';
let flashDuration = 0;
let flashMaxDuration = 0;

/**
 * Ativa flash de cor na tela.
 * @param color - cor do flash (ex: 'rgba(255,0,0,0.3)')
 * @param duration - duração em segundos
 */
export function triggerFlash(color: string, duration: number): void {
  flashColor = color;
  flashDuration = duration;
  flashMaxDuration = duration;
}

/** Flash de dano (vermelho) */
export function triggerDamageFlash(): void {
  triggerFlash('rgba(220, 50, 50, 0.35)', 0.25);
}

/** Flash de level up (dourado) */
export function triggerLevelUpFlash(): void {
  triggerFlash('rgba(241, 196, 15, 0.3)', 0.4);
}

/** Flash de boss kill (branco) */
export function triggerBossKillFlash(): void {
  triggerFlash('rgba(255, 255, 255, 0.4)', 0.3);
}

/**
 * Atualiza o flash. Chamar a cada frame.
 * @param dt - delta time
 * @returns string de cor para draw, ou null se não há flash
 */
export function updateFlash(dt: number): string | null {
  if (flashDuration > 0) {
    flashDuration -= dt;
    if (flashDuration <= 0) return null;
    const alpha = flashDuration / flashMaxDuration;
    return flashColor.replace(/[\d.]+\)$/, `${alpha * 0.35})`);
  }
  return null;
}

// ─── Slow Motion ─────────────────────────────────────────────
let slowMotionScale = 1;
let slowMotionDuration = 0;
let slowMotionTarget = 1;

/**
 * Ativa slow motion.
 * @param scale - escala de tempo (0.3 = 30% da velocidade)
 * @param duration - duração em segundos
 */
export function triggerSlowMotion(scale: number, duration: number): void {
  slowMotionScale = scale;
  slowMotionDuration = duration;
  slowMotionTarget = 1;
}

/**
 * Atualiza slow motion. Chamar a cada frame.
 * @param dt - delta time original
 * @returns dt ajustado
 */
export function updateSlowMotion(dt: number): number {
  if (slowMotionDuration > 0) {
    slowMotionDuration -= dt;
    if (slowMotionDuration <= 0) {
      slowMotionScale = 1;
    }
    return dt * slowMotionScale;
  }
  return dt;
}

// ─── Hit Stop ────────────────────────────────────────────────
let hitStopDuration = 0;

/**
 * Ativa hit stop (congela o jogo por breves instantes).
 * @param duration - duração em segundos (0.03-0.08 ideal)
 */
export function triggerHitStop(duration: number): void {
  hitStopDuration = Math.max(hitStopDuration, duration);
}

/**
 * Atualiza hit stop. Chamar a cada frame.
 * @param dt - delta time
 * @returns true se o jogo está congelado
 */
export function updateHitStop(dt: number): boolean {
  if (hitStopDuration > 0) {
    hitStopDuration -= dt;
    return true;
  }
  return false;
}

// ─── Reset ───────────────────────────────────────────────────
/** Reseta todos os efeitos (chamar ao iniciar nova run) */
export function resetEffects(): void {
  screenShakeIntensity = 0;
  screenShakeDuration = 0;
  flashDuration = 0;
  slowMotionScale = 1;
  slowMotionDuration = 0;
  hitStopDuration = 0;
}
