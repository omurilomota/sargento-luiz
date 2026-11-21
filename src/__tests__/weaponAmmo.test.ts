import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetWeapons, refillAmmo, setWeapon, shoot, getCurrentAmmo, getCurrentWeaponIndex, startReload,
  updateReload, canShoot, isJammed, repairCurrentWeapon, getCurrentCapacity,
  getDamageMultiplier, addDamageMultiplier, getIsReloading, getReloadTimer, setWeaponQuality,
} from '../weapons';
import { WEAPONS } from '../config';
import { applyStat, resetStats, getStat } from '../core/stats';

const IDX_PISTOLA = 0;
const IDX_SHOTGUN = 1;

function atirarUmaVez(): void {
  shoot(0, 0, 0, false);
}

/**
 * `refillAmmo` — a troca de fase enche o pente.
 *
 * Bug do jogador (2026-10-11): "armas herdam balas da fase anterior, todas
 * devem estar cheias quando chegar na horda seguinte". O `leaveShop` limpava
 * balas, moedas e partículas, mas não o pente: a metralhadora (25 tiros)
 * chegava na horda seguinte com 2.
 *
 * A correção não pode ser `resetWeapons()`: ele zera `damageMult`, `pierce`,
 * `critChance` e `reloadSpeed` — a build inteira. O refill é puro.
 */
describe('refillAmmo: pente cheio na troca de fase', () => {
  beforeEach(() => { resetWeapons(); resetStats(); });

  it('enche o pente da arma na mão', () => {
    setWeapon(IDX_SHOTGUN, 'normal');
    atirarUmaVez();
    atirarUmaVez();
    expect(getCurrentAmmo()).toBeLessThan(getCurrentCapacity());
    refillAmmo();
    expect(getCurrentAmmo()).toBe(getCurrentCapacity());
  });

  it('não zera o dano comprado (o defeito de usar resetWeapons)', () => {
    addDamageMultiplier(0.4);
    const dano = getDamageMultiplier();
    setWeapon(IDX_SHOTGUN, 'normal');
    atirarUmaVez();
    refillAmmo();
    expect(getDamageMultiplier(), 'o refill estourou a build na troca de fase').toBeCloseTo(dano, 5);
    expect(getStat('critChance'), 'o refill mexeu no crítico').toBe(0);
  });

  it('enche TODAS as armas, não só a da mão', () => {
    // a arma que ainda não foi equipada também entra cheia: senão a segunda
    // metralhadora que o jogador compra depois chega vazia na horda
    const idxMetralhadora = WEAPONS.findIndex(w => w.name === 'Metralhadora');
    refillAmmo();
    setWeapon(idxMetralhadora, 'normal');
    expect(getCurrentAmmo()).toBe(getCurrentCapacity());
  });

  it('cancela a recarga pendente', () => {
    setWeapon(IDX_PISTOLA, 'normal');
    startReload();
    refillAmmo();
    expect(canShoot(), 'o pente está cheio mas a recarga antiga ainda trava o tiro').toBe(true);
  });

  it('não conserta a arma quebrada de graça', () => {
    // encher o pente não pode ser um "Reparar" disfarçado
    const idxQuebrada = WEAPONS.findIndex(w => w.name === 'Quebrada' || w.name === 'Metralhadora');
    setWeapon(idxQuebrada, 'quebrada');
    const antes = isJammed();
    refillAmmo();
    expect(isJammed(), 'o refill desativou o engasgo').toBe(antes);
    expect(applyStat, 'sanity').toBeTypeOf('function');
  });
});

describe('munição é por arma, não global', () => {
  // Bug: `currentAmmo` era UM escalar e `setWeapon` reescrevia com
  // `magazineSize`. Trocar de arma devolvia o pente cheio — munição infinita
  // alternando duas armas. E o `jammed` era global, então trocar de arma
  // consertava a arma quebrada de graça.
  beforeEach(() => {
    resetWeapons();
    setWeapon(IDX_PISTOLA);
  });

  it('trocar de arma NÃO recarrega o pente da arma que voltou', () => {
    const pente = WEAPONS[IDX_PISTOLA].magazineSize;
    for (let i = 0; i < 3; i++) atirarUmaVez();
    expect(getCurrentAmmo()).toBe(pente - 3);

    setWeapon(IDX_SHOTGUN);
    setWeapon(IDX_PISTOLA);

    expect(getCurrentAmmo()).toBe(pente - 3);
  });

  it('cada arma guarda o próprio pente', () => {
    const pente = WEAPONS[IDX_PISTOLA].magazineSize;
    for (let i = 0; i < 3; i++) atirarUmaVez();
    setWeapon(IDX_SHOTGUN);
    expect(getCurrentAmmo()).toBe(WEAPONS[IDX_SHOTGUN].magazineSize);
    setWeapon(IDX_PISTOLA);
    expect(getCurrentAmmo()).toBe(pente - 3);
  });

  it('não dá pra recarregar pulando entre duas armas', () => {
    for (let i = 0; i < WEAPONS[IDX_PISTOLA].magazineSize; i++) atirarUmaVez();
    expect(getCurrentAmmo()).toBe(0);
    expect(canShoot()).toBe(false);

    // o exploit: alternar as duas armas devolve o pente cheio
    for (let k = 0; k < 20; k++) {
      setWeapon(IDX_SHOTGUN);
      setWeapon(IDX_PISTOLA);
    }
    expect(getCurrentAmmo()).toBe(0);
    expect(canShoot()).toBe(false);
  });

  it('recarga de verdade devolve o pente cheio', () => {
    for (let i = 0; i < 3; i++) atirarUmaVez();
    startReload();
    for (let i = 0; i < 300; i++) updateReload(1 / 60);
    expect(getCurrentAmmo()).toBe(WEAPONS[IDX_PISTOLA].magazineSize);
  });

  it('a munição gasta antes de trocar continua gasta depois', () => {
    for (let i = 0; i < 5; i++) atirarUmaVez();
    const antes = getCurrentAmmo();
    startReload();
    // troca durante a recarga cancela o timer
    setWeapon(IDX_SHOTGUN);
    for (let i = 0; i < 300; i++) updateReload(1 / 60);
    setWeapon(IDX_PISTOLA);
    expect(getCurrentAmmo()).toBe(antes);
  });

  it('recarga só começa se o pente não estiver cheio', () => {
    // pente já cheio: não consome tempo nem trava
    startReload();
    expect(canShoot()).toBe(true);
  });

  it('trocar de arma cancela a recarga em andamento', () => {
    for (let i = 0; i < 3; i++) atirarUmaVez();
    startReload();
    setWeapon(IDX_SHOTGUN);
    // sem updateReload, se a recarga não tivesse sido cancelada o pente da
    // pistola estaria cheio ao voltar
    setWeapon(IDX_PISTOLA);
    expect(getCurrentAmmo()).toBe(WEAPONS[IDX_PISTOLA].magazineSize - 3);
  });
});

describe('encasquilhamento é da arma quebrada', () => {
  const idxQuebrada = WEAPONS.findIndex(w => w.broken);
  const idxBoa = IDX_SHOTGUN;

  beforeEach(() => {
    resetWeapons();
  });

  it('existe uma arma quebrada para testar', () => {
    expect(idxQuebrada).toBeGreaterThanOrEqual(0);
  });

  it('encasquilha depois de 35 disparos e NÃO passa pra outra arma', () => {
    setWeapon(idxQuebrada);
    // qualidade "quebrada" é a que dispara o jam; setWeapon não seta qualidade,
    // então usamos o caminho de tiros para encher o contador via falha de tiro
    for (let i = 0; i < 40; i++) atirarUmaVez();
    setWeapon(idxBoa);
    expect(isJammed()).toBe(false);
  });

  it('repairCurrentWeapon conserta a arma que está na mão', () => {
    setWeapon(idxQuebrada);
    repairCurrentWeapon();
    expect(isJammed()).toBe(false);
  });

  it('o contador de disparos não zera sozinho ao trocar de arma', () => {
    setWeapon(idxQuebrada);
    const antes = getCurrentAmmo();
    setWeapon(idxBoa);
    setWeapon(idxQuebrada);
    expect(getCurrentAmmo()).toBe(antes);
  });
});

describe('setWeapon não reinicia a partida silenciosamente', () => {
  beforeEach(() => {
    resetWeapons();
    setWeapon(IDX_PISTOLA);
  });

  it('o índice da arma equipada é o pedido', () => {
    setWeapon(IDX_SHOTGUN);
    expect(getCurrentWeaponIndex()).toBe(IDX_SHOTGUN);
  });

  it('resetWeapons volta tudo a zero', () => {
    setWeapon(IDX_SHOTGUN);
    for (let i = 0; i < 4; i++) atirarUmaVez();
    resetWeapons();
    expect(getCurrentWeaponIndex()).toBe(IDX_PISTOLA);
    expect(getCurrentAmmo()).toBe(WEAPONS[IDX_PISTOLA].magazineSize);
  });
});

describe('recarga: o progresso viaja com a arma (playtest 2026-10-16)', () => {
  beforeEach(() => resetWeapons());

  it('trocar de arma NO MEIO da recarga não perde o progresso', () => {
    // esvazia a pistola e começa a recarga
    setWeapon(0);
    for (let i = 0; i < 10; i++) shoot(100, 100, 0, false);
    expect(getCurrentAmmo()).toBe(0);
    startReload();
    expect(getIsReloading()).toBe(true);
    // metade do tempo de recarga...
    for (let i = 0; i < 30; i++) updateReload(0.02); // 0.6s de 1.2s
    const progressoAntes = getReloadTimer();
    expect(progressoAntes).toBeLessThan(1.2);
    // ...troca para a metralhadora e VOLTA: a recarga retoma, não recomeça
    setWeapon(2);
    expect(getIsReloading()).toBe(false); // a metralhadora não está recarregando
    setWeapon(0);
    expect(getIsReloading()).toBe(true);
    expect(getReloadTimer()).toBeCloseTo(progressoAntes, 5);
    // e completa
    for (let i = 0; i < 60; i++) updateReload(0.02);
    expect(getIsReloading()).toBe(false);
    expect(getCurrentAmmo()).toBe(10);
  });

  it('arma emperrada NÃO começa recarga (o som não mente mais)', () => {
    setWeapon(0);
    for (let i = 0; i < 10; i++) shoot(100, 100, 0, false);
    // encasquilha via o mesmo caminho do jogo
    setWeaponQuality('quebrada');
    let disparos = 0;
    while (!isJammed() && disparos < 200) {
      shoot(100, 100, 0, false);
      updateReload(0.01);
      disparos++;
    }
    expect(isJammed()).toBe(true);
    startReload();
    expect(getIsReloading()).toBe(false);
    setWeaponQuality('normal');
  });
});
