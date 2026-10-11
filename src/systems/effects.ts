/**
 * Sistema de efeitos visuais (Game Juice).
 * Screen shake, flash de dano, flash de level up, slow motion, hit stop.
 */

// ─── Screen Shake ────────────────────────────────────────────
let screenShakeIntensity = 0;
let screenShakeDuration = 0;
let screenShakeMaxDuration = 0;

/**
 * Ativa screen shake.
 * @param duration - duração em segundos
 */
export function triggerScreenShake(intensity: number, duration: number): void {
  screenShakeIntensity = Math.max(screenShakeIntensity, intensity);
  screenShakeDuration = Math.max(screenShakeDuration, duration);
  screenShakeMaxDuration = Math.max(screenShakeMaxDuration, duration);
}

/**
 * Atualiza o screen shake. Chamar a cada frame e passar o resultado ao draw.
 * O envelope é linear no tempo restante: sem isso o tremor é um degrau que
 * some do nada (e, antes, nem era aplicado — `{x:0, y:0}` fixo no main).
 * @returns deslocamento {x, y} para aplicar na transformação do mundo
 */
export function updateScreenShake(dt: number): { x: number; y: number } {
  if (screenShakeDuration <= 0) {
    screenShakeIntensity = 0;
    screenShakeMaxDuration = 0;
    return { x: 0, y: 0 };
  }
  screenShakeDuration -= dt;
  if (screenShakeDuration <= 0) {
    screenShakeDuration = 0;
    screenShakeIntensity = 0;
    screenShakeMaxDuration = 0;
    return { x: 0, y: 0 };
  }
  const envelope = screenShakeMaxDuration > 0 ? screenShakeDuration / screenShakeMaxDuration : 1;
  const mag = screenShakeIntensity * envelope;
  return {
    x: (Math.random() - 0.5) * 2 * mag,
    y: (Math.random() - 0.5) * 2 * mag,
  };
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

/**
 * Ativa slow motion.
 * @param scale - escala de tempo (0.3 = 30% da velocidade)
 * @param duration - duração em segundos
 */
export function triggerSlowMotion(scale: number, duration: number): void {
  slowMotionScale = scale;
  slowMotionDuration = duration;
}

/**
 * Atualiza slow motion. Chamar a cada frame.
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
 * @returns true se o jogo está congelado
 */
export function updateHitStop(dt: number): boolean {
  if (hitStopDuration > 0) {
    hitStopDuration -= dt;
    return true;
  }
  return false;
}

// ─── Boss Zoom ───────────────────────────────────────────────
let bossZoomActive = false;
let bossZoomTimer = 0;
let bossZoomScale = 1;

export function triggerBossZoom(): void {
  bossZoomActive = true;
  bossZoomTimer = 2.0;
  bossZoomScale = 1;
}

export function updateBossZoom(dt: number): number {
  if (!bossZoomActive) return 1;
  bossZoomTimer -= dt;
  const progress = 1 - (bossZoomTimer / 2.0);
  if (progress < 0.3) {
    bossZoomScale = 1 + progress * 0.67;
  } else if (progress < 0.7) {
    bossZoomScale = 1.2;
  } else {
    bossZoomScale = 1.2 - (progress - 0.7) * 0.67;
  }
  if (bossZoomTimer <= 0) {
    bossZoomActive = false;
    bossZoomScale = 1;
  }
  return bossZoomScale;
}

/** Reseta todos os efeitos (chamar ao iniciar nova run) */
export function resetEffects(): void {
  screenShakeIntensity = 0;
  screenShakeDuration = 0;
  screenShakeMaxDuration = 0;
  flashDuration = 0;
  slowMotionScale = 1;
  slowMotionDuration = 0;
  hitStopDuration = 0;
  bossZoomActive = false;
  bossZoomTimer = 0;
  bossZoomScale = 1;
}
