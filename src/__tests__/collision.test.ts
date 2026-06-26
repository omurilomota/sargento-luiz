import { describe, it, expect, vi } from 'vitest';
import { checkBulletEnemyCollisions, checkEnemyBulletPlayerCollision, checkEnemyPlayerCollision } from '../systems/collision';
import { dist } from '../utils';

describe('dist', () => {
  it('should calculate distance between two points', () => {
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('should return 0 for same point', () => {
    expect(dist({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  it('should handle negative coordinates', () => {
    expect(dist({ x: -3, y: -4 }, { x: 0, y: 0 })).toBe(5);
  });
});

describe('checkBulletEnemyCollisions', () => {
  it('should detect bullet hitting enemy', () => {
    const bullets = [{ x: 10, y: 10, isEnemy: false }];
    const enemies = [{ x: 12, y: 12, radius: 5, health: 10 }];
    const onHit = vi.fn();

    checkBulletEnemyCollisions(bullets as any, enemies as any, onHit);
    expect(onHit).toHaveBeenCalledTimes(1);
    expect(onHit).toHaveBeenCalledWith(bullets[0], enemies[0]);
  });

  it('should not detect when bullet is far away', () => {
    const bullets = [{ x: 0, y: 0, isEnemy: false }];
    const enemies = [{ x: 100, y: 100, radius: 5, health: 10 }];
    const onHit = vi.fn();

    checkBulletEnemyCollisions(bullets as any, enemies as any, onHit);
    expect(onHit).not.toHaveBeenCalled();
  });

  it('should ignore enemy bullets', () => {
    const bullets = [{ x: 10, y: 10, isEnemy: true }];
    const enemies = [{ x: 12, y: 12, radius: 5, health: 10 }];
    const onHit = vi.fn();

    checkBulletEnemyCollisions(bullets as any, enemies as any, onHit);
    expect(onHit).not.toHaveBeenCalled();
  });

  it('should ignore dead enemies', () => {
    const bullets = [{ x: 10, y: 10, isEnemy: false }];
    const enemies = [{ x: 12, y: 12, radius: 5, health: 0 }];
    const onHit = vi.fn();

    checkBulletEnemyCollisions(bullets as any, enemies as any, onHit);
    expect(onHit).not.toHaveBeenCalled();
  });
});

describe('checkEnemyBulletPlayerCollision', () => {
  it('should detect enemy bullet hitting player', () => {
    const bullets = [{ x: 10, y: 10, isEnemy: true }];
    const onHit = vi.fn();

    checkEnemyBulletPlayerCollision(bullets as any, 12, 12, 10, 0, onHit);
    expect(onHit).toHaveBeenCalledTimes(1);
  });

  it('should not trigger when player is invincible', () => {
    const bullets = [{ x: 10, y: 10, isEnemy: true }];
    const onHit = vi.fn();

    checkEnemyBulletPlayerCollision(bullets as any, 12, 12, 10, 0.5, onHit);
    expect(onHit).not.toHaveBeenCalled();
  });

  it('should ignore player bullets', () => {
    const bullets = [{ x: 10, y: 10, isEnemy: false }];
    const onHit = vi.fn();

    checkEnemyBulletPlayerCollision(bullets as any, 12, 12, 10, 0, onHit);
    expect(onHit).not.toHaveBeenCalled();
  });
});

describe('checkEnemyPlayerCollision', () => {
  it('should detect enemy colliding with player', () => {
    const enemies = [{ x: 10, y: 10, radius: 5, health: 10 }];
    const onHit = vi.fn();

    checkEnemyPlayerCollision(enemies as any, 12, 12, 10, 0, onHit);
    expect(onHit).toHaveBeenCalledTimes(1);
  });

  it('should not trigger when player is invincible', () => {
    const enemies = [{ x: 10, y: 10, radius: 5, health: 10 }];
    const onHit = vi.fn();

    checkEnemyPlayerCollision(enemies as any, 12, 12, 10, 1.0, onHit);
    expect(onHit).not.toHaveBeenCalled();
  });

  it('should not detect when enemy is far away', () => {
    const enemies = [{ x: 100, y: 100, radius: 5, health: 10 }];
    const onHit = vi.fn();

    checkEnemyPlayerCollision(enemies as any, 0, 0, 10, 0, onHit);
    expect(onHit).not.toHaveBeenCalled();
  });

  it('should only trigger for first colliding enemy', () => {
    const enemies = [
      { x: 10, y: 10, radius: 5, health: 10 },
      { x: 11, y: 11, radius: 5, health: 10 },
    ];
    const onHit = vi.fn();

    checkEnemyPlayerCollision(enemies as any, 12, 12, 10, 0, onHit);
    expect(onHit).toHaveBeenCalledTimes(1);
  });
});
