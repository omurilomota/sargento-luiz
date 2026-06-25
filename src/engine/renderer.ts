import { castRay } from './raycaster';

const FOV = Math.PI / 4; // 45 degrees
const HALF_FOV = FOV / 2;

export interface RenderState {
  playerX: number;
  playerY: number;
  playerAngle: number;
}

function generateTextures(): ImageData[] {
  const textures: ImageData[] = [];

  // Wall texture (brick pattern)
  const wallCanvas = document.createElement('canvas');
  wallCanvas.width = 64;
  wallCanvas.height = 64;
  const wallCtx = wallCanvas.getContext('2d')!;

  wallCtx.fillStyle = '#8B4513';
  wallCtx.fillRect(0, 0, 64, 64);

  wallCtx.strokeStyle = '#000';
  wallCtx.lineWidth = 2;

  // Horizontal lines
  for (let y = 0; y < 64; y += 16) {
    wallCtx.beginPath();
    wallCtx.moveTo(0, y);
    wallCtx.lineTo(64, y);
    wallCtx.stroke();
  }

  // Vertical lines (offset every other row)
  for (let y = 0; y < 64; y += 16) {
    const offset = (y / 16) % 2 === 0 ? 0 : 16;
    for (let x = offset; x < 64; x += 32) {
      wallCtx.beginPath();
      wallCtx.moveTo(x, y);
      wallCtx.lineTo(x, y + 16);
      wallCtx.stroke();
    }
  }

  textures.push(wallCtx.getImageData(0, 0, 64, 64));

  return textures;
}

const textures = generateTextures();

export function render(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: RenderState
): void {
  // Sky gradient
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height / 2);
  skyGradient.addColorStop(0, '#87CEEB');
  skyGradient.addColorStop(1, '#4682B4');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height / 2);

  // Floor
  ctx.fillStyle = '#333';
  ctx.fillRect(0, height / 2, width, height / 2);

  // Raycasting
  const numRays = width;
  const columnWidth = width / numRays;

  for (let x = 0; x < numRays; x++) {
    const rayAngle = state.playerAngle - HALF_FOV + (x / numRays) * FOV;
    const ray = castRay(state.playerX, state.playerY, rayAngle);

    // Fish-eye correction
    const correctedDistance = ray.distance * Math.cos(rayAngle - state.playerAngle);

    const wallHeight = Math.max(1, Math.min(height * 2, height / correctedDistance));
    const wallTop = (height - wallHeight) / 2;

    // Wall texture
    const textureX = Math.floor(ray.wallX * 64);
    const texture = textures[0];

    // Simple shading based on distance and side
    const shade = ray.side === 0 ? 1.0 : 0.7;
    const distanceShade = Math.max(0.3, 1 - correctedDistance / 10);

    // Draw wall column
    for (let y = 0; y < wallHeight; y++) {
      const textureY = Math.floor((y / wallHeight) * 64);
      const pixelIndex = (textureY * 64 + textureX) * 4;

      const r = texture.data[pixelIndex] * shade * distanceShade;
      const g = texture.data[pixelIndex + 1] * shade * distanceShade;
      const b = texture.data[pixelIndex + 2] * shade * distanceShade;

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x * columnWidth, wallTop + y, columnWidth + 1, 1);
    }
  }
}
