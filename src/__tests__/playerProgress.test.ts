import { describe, it, expect, beforeEach } from 'vitest';
import {
  initPlayer, placePlayer, resetPlayerProgress, addMaxHealth, addArmor, getArmorLevel,
  addMedkits, getMedkits, getPlayer, getEffectiveMaxHealth, setComboHealthMultiplier,
} from '../entities/player';
import { PLAYER_BASE_HEALTH } from '../core/constants';

describe('progressão do jogador sobrevive à troca de fase', () => {
  // Bug: `loadPhaseEnvironment` chamava `initPlayer()`, que recria o objeto do
  // jogador com `health`/`maxHealth` em 100. Comprar "Vida +100" na loja e
  // chegar na fase seguinte com 100 é o sintoma; a mesma chamada jogava fora
  // armadura e medkits.
  beforeEach(() => {
    initPlayer(1920, 1280);
    resetPlayerProgress();
  });

  it('comprar vida aumenta o máximo e a vida atual', () => {
    addMaxHealth(100);
    expect(getPlayer().maxHealth).toBe(PLAYER_BASE_HEALTH + 100);
    expect(getPlayer().health).toBe(PLAYER_BASE_HEALTH + 100);
  });

  it('a vida comprada NÃO é perdida ao entrar na fase seguinte', () => {
    addMaxHealth(100);
    placePlayer(300, 400);
    expect(getPlayer().maxHealth).toBe(PLAYER_BASE_HEALTH + 100);
    expect(getPlayer().health).toBe(PLAYER_BASE_HEALTH + 100);
  });

  it('várias compras de vida acumulam através das fases', () => {
    addMaxHealth(100);
    placePlayer(10, 10);
    addMaxHealth(100);
    placePlayer(20, 20);
    addMaxHealth(100);
    placePlayer(30, 30);
    expect(getPlayer().maxHealth).toBe(PLAYER_BASE_HEALTH + 300);
  });

  it('armadura e medkits também sobrevivem à troca de fase', () => {
    addArmor(0.15);
    addMedkits(3);
    placePlayer(500, 500);
    expect(getArmorLevel()).toBeCloseTo(0.15, 5);
    expect(getMedkits()).toBe(3);
  });

  it('o bônus de vida do combo sobrevive à troca de fase', () => {
    addMaxHealth(100);
    setComboHealthMultiplier(1.3);
    const antes = getEffectiveMaxHealth();
    placePlayer(100, 100);
    expect(getEffectiveMaxHealth()).toBe(antes);
  });

  it('entrar na fase cura o jogador até o máximo', () => {
    addMaxHealth(100);
    getPlayer().health = 5;
    placePlayer(200, 200);
    expect(getPlayer().health).toBe(getPlayer().maxHealth);
  });

  it('entrar na fase limpa o estado transitório (escudo, invencibilidade)', () => {
    const p = getPlayer();
    p.invincible = 3;
    p.shield = 2;
    p.shootCooldown = 5;
    p.hitFlash = 1;
    placePlayer(200, 200);
    expect(p.invincible).toBe(0);
    expect(p.shield).toBe(0);
    expect(p.shootCooldown).toBe(0);
    expect(p.hitFlash).toBe(0);
  });

  it('placePlayer põe o jogador no ponto de entrada pedido', () => {
    placePlayer(777, 888);
    expect(getPlayer().x).toBe(777);
    expect(getPlayer().y).toBe(888);
  });

  it('resetPlayerProgress zera TUDO — é o que partida nova usa', () => {
    addMaxHealth(100);
    addArmor(0.15);
    addMedkits(3);
    resetPlayerProgress();
    expect(getPlayer().maxHealth).toBe(PLAYER_BASE_HEALTH);
    expect(getPlayer().health).toBe(PLAYER_BASE_HEALTH);
    expect(getArmorLevel()).toBe(0);
    expect(getMedkits()).toBe(0);
  });
});
