export const MAP_WIDTH = 16;
export const MAP_HEIGHT = 16;

// 0 = empty, 1 = wall
export const MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,1,0,0,0,0,0,1,1,0,0,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,1,1,0,0,0,0,0,1,1,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export interface Ray {
  distance: number;
  wallX: number;
  side: number;
  mapX: number;
  mapY: number;
}

export function castRay(
  posX: number,
  posY: number,
  rayAngle: number
): Ray {
  const rayDirX = Math.cos(rayAngle);
  const rayDirY = Math.sin(rayAngle);

  let mapX = Math.floor(posX);
  let mapY = Math.floor(posY);

  const deltaDistX = Math.abs(1 / rayDirX);
  const deltaDistY = Math.abs(1 / rayDirY);

  let stepX: number;
  let stepY: number;
  let sideDistX: number;
  let sideDistY: number;

  if (rayDirX < 0) {
    stepX = -1;
    sideDistX = (posX - mapX) * deltaDistX;
  } else {
    stepX = 1;
    sideDistX = (mapX + 1 - posX) * deltaDistX;
  }

  if (rayDirY < 0) {
    stepY = -1;
    sideDistY = (posY - mapY) * deltaDistY;
  } else {
    stepY = 1;
    sideDistY = (mapY + 1 - posY) * deltaDistY;
  }

  let hit = false;
  let side = 0;
  let maxSteps = MAP_WIDTH + MAP_HEIGHT;

  while (!hit && maxSteps > 0) {
    maxSteps--;
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
    }

    if (mapX < 0 || mapX >= MAP_WIDTH || mapY < 0 || mapY >= MAP_HEIGHT) {
      hit = true;
    } else if (MAP[mapY][mapX] > 0) {
      hit = true;
    }
  }

  let perpWallDist: number;
  if (side === 0) {
    perpWallDist = (mapX - posX + (1 - stepX) / 2) / rayDirX;
  } else {
    perpWallDist = (mapY - posY + (1 - stepY) / 2) / rayDirY;
  }

  let wallX: number;
  if (side === 0) {
    wallX = posY + perpWallDist * rayDirY;
  } else {
    wallX = posX + perpWallDist * rayDirX;
  }
  wallX -= Math.floor(wallX);

  return {
    distance: perpWallDist,
    wallX,
    side,
    mapX,
    mapY,
  };
}

export function checkCollision(posX: number, posY: number, radius: number = 0.2): boolean {
  const checks = [
    [posX - radius, posY - radius],
    [posX + radius, posY - radius],
    [posX - radius, posY + radius],
    [posX + radius, posY + radius],
  ];

  for (const [x, y] of checks) {
    const mapX = Math.floor(x);
    const mapY = Math.floor(y);
    if (mapX < 0 || mapX >= MAP_WIDTH || mapY < 0 || mapY >= MAP_HEIGHT) {
      return true;
    }
    if (MAP[mapY][mapX] > 0) {
      return true;
    }
  }

  return false;
}
