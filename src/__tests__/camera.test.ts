import { describe, it, expect, afterEach } from 'vitest';
import { initCamera, snapCamera, updateCamera, getCamX, getCamY, screenToWorld, setShake } from '../systems/camera';

/** O mapa do jogo é 30x20 de 64px. */
const WORLD_W = 1920;
const WORLD_H = 1280;

afterEach(() => setShake(0, 0));

describe('camera: o clamp é por eixo', () => {
  it('o vertical usa a ALTURA do mundo, não a largura', () => {
    // viewport mais larga e mais alta que o mapa: centraliza nos dois eixos
    initCamera(WORLD_W, WORLD_H, 2560, 1300, 960, 640);
    snapCamera(960, 640);
    expect(getCamX()).toBeCloseTo((WORLD_W - 2560) / 2);
    expect(getCamY()).toBeCloseTo((WORLD_H - 1300) / 2);
  });

  it('não deixa a câmera mostrar vazio acima nem abaixo do mapa', () => {
    initCamera(WORLD_W, WORLD_H, 1440, 900, 960, 640);
    snapCamera(960, 640);
    snapCamera(960, 20);
    expect(getCamY()).toBe(0);
    snapCamera(960, 1260);
    expect(getCamY()).toBe(WORLD_H - 900);
  });

  it('o limite vertical não depende da largura da janela', () => {
    // mesma altura, larguras diferentes: o topo e a base têm de ser os mesmos
    for (const vw of [1440, 2560]) {
      initCamera(WORLD_W, WORLD_H, vw, 900, 960, 640);
      snapCamera(960, 640);
      snapCamera(960, 20);
      expect(getCamY(), `largura ${vw}`).toBe(0);
      snapCamera(960, 1260);
      expect(getCamY(), `largura ${vw}`).toBe(WORLD_H - 900);
    }
  });
});

describe('camera: a mira usa a mesma matriz do draw', () => {
  it('screenToWorld desconta o shake que o draw aplica', () => {
    initCamera(WORLD_W, WORLD_H, 1440, 900, 960, 640);
    snapCamera(960, 640);
    setShake(0, 0);
    const parado = screenToWorld(700, 450);
    setShake(10, -6);
    const tremendo = screenToWorld(700, 450);
    expect(tremendo.x).toBe(parado.x - 10);
    expect(tremendo.y).toBe(parado.y + 6);
  });
});

describe('camera: o lerp não atravessa o clamp', () => {
  it('perseguir um alvo fora do mapa não move a câmera além do limite', () => {
    initCamera(WORLD_W, WORLD_H, 1440, 900, 960, 640);
    snapCamera(960, 640);
    for (let i = 0; i < 600; i++) updateCamera(1 / 60, -5000, -5000);
    expect(getCamX()).toBeCloseTo(0);
    expect(getCamY()).toBeCloseTo(0);
    for (let i = 0; i < 600; i++) updateCamera(1 / 60, 5000, 5000);
    expect(getCamX()).toBeCloseTo(WORLD_W - 1440);
    expect(getCamY()).toBeCloseTo(WORLD_H - 900);
  });
});