export interface InputState {
  forward: boolean;
  backward: boolean;
  strafeLeft: boolean;
  strafeRight: boolean;
  shoot: boolean;
  mouseX: number;
  mouseY: number;
  mouseDeltaX: number;
}

const keys: Record<string, boolean> = {};
let mouseX = 0;
let mouseY = 0;
let mouseDeltaX = 0;

export function initInput(canvas: HTMLCanvasElement): void {
  document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
  });

  document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    mouseDeltaX += e.movementX;
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  canvas.addEventListener('mousedown', () => {
    keys['MouseLeft'] = true;
  });

  canvas.addEventListener('mouseup', () => {
    keys['MouseLeft'] = false;
  });
}

export function getInput(): InputState {
  const state: InputState = {
    forward: keys['KeyW'] || false,
    backward: keys['KeyS'] || false,
    strafeLeft: keys['KeyA'] || false,
    strafeRight: keys['KeyD'] || false,
    shoot: keys['MouseLeft'] || false,
    mouseX,
    mouseY,
    mouseDeltaX,
  };
  mouseDeltaX = 0;
  return state;
}
