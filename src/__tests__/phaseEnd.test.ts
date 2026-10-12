/**
 * O countdown de fim de fase nunca aparecia, e a fase só fechava depois que o
 * jogador matasse TODOS os inimigos restantes.
 *
 * Duas causas que nunca se separavam:
 *
 *   1. O consumo do respiro morava dentro de `if (waveComplete)`, e o
 *      `waveComplete` do spawner exige `enemies.length === 0` E a cota da onda
 *      preenchida. Como o spawner zera a cota ao reportar a onda completa, ele
 *      recomeçava a última onda durante a luta contra o chefe e jogava reforço
 *      na tela. O jogador só passava depois de matar esse reforço.
 *   2. O re-arm no `killEnemy` tinha `!phaseEnding`, mas `phaseEnding` já era
 *      true desde a última onda — o re-arm era código morto.
 *
 * A correção extrai o predicado para `deveFecharFase` (phases.ts). Este arquivo
 * importa o predicado real: a versão anterior reimplementava a condição local
 * e, por isso, continuava verde depois de o bug voltar.
 *
 * --- Segundo couplings, anos depois ---
 *
 * A extração abriu o caminho para uma terceira causa, que é a que este arquivo
 * agora existe para travar: `deveFecharFase` é chamado de um bloco que roda
 * todo frame, e o predicado respondia `true` para qualquer onda que não fosse a
 * última. Toda fase pulava para a última onda em dois frames e o chefe nascia
 * com o campo vazio — o sintoma "toda fase começa com chefe".
 *
 * Nenhum teste aqui pegou, por dois motivos que valem como regra: os testes só
 * cobriam o caminho da última onda, e o `tools/fase-proof.mjs` **força** a
 * última onda com `pularParaUltimaOnda()`. As duas camadas confirmavam a parte
 * que já estava certa e nenhuma tocava a que quebrou.
 */
import { describe, it, expect } from 'vitest';
import { ENEMY_TYPES, PHASES } from '../config';
import { PHASE_END_PAUSE } from '../core/constants';
import { deveFecharFase, proximoDoRushNasce, nextPhase, getCurrentWave, resetPhases, setGameState, setCurrentWave } from '../phases';
import { readFileSync } from 'fs';
import { join } from 'path';
import { checkEnemyPlayerCollision } from '../systems/collision';
import type { Enemy } from '../types';

function bossEnemies(n: number): Enemy[] {
  return Array.from({ length: n }, (_, i) => ({
    type: 'vigia', x: i * 10, y: 0, radius: 40,
  } as unknown as Enemy));
}

const VIVO = {
  ondaCompleta: true,
  ultimaOnda: true,
  respiroArmado: true,
  respiroRestante: 0,
  chefeVivo: false,
  jogadorMorto: false,
  // O objetivo liberou o chefe. `clear` libera na largada, então quase toda
  // fase está aqui; as exceções são `reach` (jogador tem de chegar na zona) e
  // `protect`/`survive`/`destroy`, que só liberam quando cumprem.
  chefeLiberado: true,
};

describe('deveFecharFase: o chefe tem de morrer antes da loja', () => {
  it('não fecha com o chefe vivo', () => {
    expect(deveFecharFase({ ...VIVO, chefeVivo: true })).toBe(false);
  });

  it('não fecha enquanto o respiro não zerou', () => {
    expect(deveFecharFase({ ...VIVO, respiroRestante: 3 })).toBe(false);
  });

  it('não fecha sem respiro armado', () => {
    expect(deveFecharFase({ ...VIVO, respiroArmado: false })).toBe(false);
  });

  it('fecha com o chefe morto e o respiro zerado', () => {
    expect(deveFecharFase(VIVO)).toBe(true);
  });

  it('onda intermediária fecha assim que o campo limpa, sem respiro', () => {
    // Numa onda do meio, fechar é o comportamento certo: o respiro só existe
    // na última. É isso que faz a fase avançar em vez de travar.
    expect(deveFecharFase({ ...VIVO, ultimaOnda: false, respiroArmado: false })).toBe(true);
  });

  it('o respiro dura o suficiente para o jogador ver o loot', () => {
    expect(PHASE_END_PAUSE).toBeGreaterThanOrEqual(3);
  });
});

/**
 * Regressão: TODA fase começava com o chefe.
 *
 * `deveFecharFase` é chamado de um bloco que roda todo frame, não só quando a
 * onda fecha. Sem o gate `ondaCompleta`, as ondas 1 e 2 respondiam `true` a cada
 * frame e a fase saltava para a última onda em dois frames — o chefe nascia
 * com o campo vazio, sem nenhuma onda.
 *
 * A versão anterior deste arquivo não pegou nada disso: só cobria o caminho da
 * última onda, e o `tools/fase-proof.mjs` **força** a última onda com
 * `pularParaUltimaOnda()`. Os testes confirmavam a parte que já tinha sido
 * corrigida e ignoravam a que quebrou.
 */
describe('deveFecharFase: a onda precisa ter terminado de verdade', () => {
  it('NÃO fecha uma onda do meio enquanto ela não acabou', () => {
    // Este é exatamente o caso que falava em produção: a fase 1 tem 3 ondas, e a
    // onda 1 tem de responder `false` mesmo com respiro zerado e chefe morto.
    expect(deveFecharFase({
      ondaCompleta: false, ultimaOnda: false,
      respiroArmado: false, respiroRestante: 0,
      chefeVivo: false, jogadorMorto: false, chefeLiberado: true,
    })).toBe(false);
  });

  it('NÃO avança a onda mesmo chamado 60 vezes seguidas com a mesma entrada', () => {
    // O bloco que chama o predicado roda todo frame. Se ele responder `true`
    // com a onda em andamento, `nextWave()` é chamado todo frame e a fase
    // atravessa as ondas antes de o jogador matar qualquer coisa.
    const emAndamento = {
      ondaCompleta: false, ultimaOnda: false,
      respiroArmado: false, respiroRestante: 0,
      chefeVivo: false, jogadorMorto: false, chefeLiberado: true,
    };
    let framesQueFecham = 0;
    for (let frame = 0; frame < 60; frame++) {
      if (deveFecharFase(emAndamento)) framesQueFecham++;
    }
    expect(framesQueFecham, 'a fase pulou para a última onda antes da hora').toBe(0);
  });

  it('o gate vale mesmo na última onda, com respiro zerado e chefe morto', () => {
    // Sem este teste, `ondaCompleta` podia ser lido como "só importa no meio" e
    // a última onda voltaria a fechar no primeiro frame.
    expect(deveFecharFase({ ...VIVO, ondaCompleta: false })).toBe(false);
  });

  it('a onda do meio fecha assim que o campo limpa', () => {
    // O outro lado do portão: quando a onda realmente acabou, o fechamento
    // tem de acontecer, senão a fase trava e nunca avança.
    expect(deveFecharFase({
      ondaCompleta: true, ultimaOnda: false,
      respiroArmado: false, respiroRestante: 0,
      chefeVivo: false, jogadorMorto: false, chefeLiberado: true,
    })).toBe(true);
  });
});

describe('deveFecharFase: o re-arm do chefe funciona', () => {
  it('o respiro do chefe não fecha a fase antes de zerar', () => {
    const durante = { ...VIVO, respiroArmado: true, respiroRestante: PHASE_END_PAUSE };
    expect(deveFecharFase(durante), 'não fecha durante o respiro do chefe').toBe(false);
    expect(deveFecharFase({ ...durante, respiroRestante: 0 })).toBe(true);
  });

  it('a queda do chefe tira chefeVivo e destrava o fechamento', () => {
    const lutando = { ...VIVO, chefeVivo: true };
    const depois = { ...lutando, chefeVivo: false };
    expect(deveFecharFase(lutando)).toBe(false);
    expect(deveFecharFase(depois)).toBe(true);
  });
});

describe('deveFecharFase: a morte vence qualquer transição', () => {
  it('o jogador morto não abre a loja mesmo com tudo pronto', () => {
    // Este é o "morreu no fimzinho e passou de fase": respiro zerado, chefe
    // morto, última onda. Só a morte impede a passagem.
    expect(deveFecharFase({ ...VIVO, jogadorMorto: true })).toBe(false);
  });

  it('a morte vence também numa onda intermediária', () => {
    expect(deveFecharFase({
      ondaCompleta: true, ultimaOnda: false, respiroArmado: false, respiroRestante: 0,
      chefeVivo: false, jogadorMorto: true, chefeLiberado: true,
    })).toBe(false);
  });

  it('a morte vence mesmo com o chefe ainda vivo', () => {
    expect(deveFecharFase({ ...VIVO, chefeVivo: true, jogadorMorto: true })).toBe(false);
  });
});

describe('B4: a fase final não abre com o estado da anterior', () => {
  /**
   * Relato do jogador: "A última fase abriu 'já sem nada'. Suspeita: estado do
   * rush vazando entre fases — a mesma família que `irParaFase` já consertou
   * uma vez para os inimigos."
   *
   * A pista era o estado do rush: `loadPhaseEnvironment` zera `bossSpawned`,
   * `bossKilled`, `bossRushIndex` e `biomaquinaTimer`, mas `irParaFase` (o hook
   * do harness) só limpava os dois primeiros. Com o rush inteiro passando a
   * depender do índice, essa assimetria é a forma exata que o vazamento
   * voltaria.
   *
   * Medido no navegador nos dois caminhos (salto direto e playthrough) e não
   * reproduzido: as 9 fases abrem com 0 inimigos, onda 1 e respiro false. O que
   * fica aqui é a trava do contrato, não do sintoma — um "não achei o bug"
   * sem prova escrita volta amanhã igual.
   */
  const ZERA_RUSH = ['bossSpawned', 'bossKilled', 'bossRushIndex', 'biomaquinaTimer'];

  it('todo estado do rush é zerado ao carregar a fase', () => {
    // `loadPhaseEnvironment` é a única função que roda na troca de fase de
    // qualquer caminho (loja, save, `irParaFase`). Se um destes parar de ser
    // zerado aqui, o rush da fase 9 começa com o índice da fase anterior.
    const corpo = readFileSync(join(__dirname, '..', 'main.ts'), 'utf-8');
    const ini = corpo.indexOf('function loadPhaseEnvironment');
    const fim = corpo.indexOf('\nfunction ', ini + 10);
    const bloco = corpo.slice(ini, fim);
    for (const estado of ZERA_RUSH) {
      expect(bloco, `${estado} não é zerado ao carregar a fase`).toContain(`${estado} = `);
    }
  });

  it('o hook de salto do harness limpa o mesmo conjunto que a troca real', () => {
    // `irParaFase` é o caminho dos harnesses. Se ele zerar menos que a fase
    // real, toda prova de tela mede uma fase montada diferente do jogo.
    const corpo = readFileSync(join(__dirname, '..', 'main.ts'), 'utf-8');
    const ini = corpo.indexOf('irParaFase: (i: number) =>');
    const fim = corpo.indexOf('\n  //', ini + 10);
    const bloco = corpo.slice(ini, fim);
    for (const estado of ZERA_RUSH) {
      const temFalse = bloco.includes(`${estado} = false;`);
      const temZero = bloco.includes(`${estado} = 0;`);
      expect(temFalse || temZero, `${estado} não é zerado por irParaFase`).toBe(true);
    }
  });

  it('trocar de fase zera a onda, senão a fase nasce na onda 2', () => {
    // `nextPhase` é o que `leaveShop` chama. Sem `resetPhases` antes, a fase
    // seguinte abriria com a onda de onde o jogador saiu.
    resetPhases();
    setGameState('playing');
    setCurrentWave(4);
    nextPhase();
    expect(getCurrentWave()).toBe(0);
  });
});

describe('deveFecharFase: o chefe que nunca nasceu não conta como derrotado', () => {
  /**
   * Bug do jogador, no Vulcão (B3): "horda 7 — o countdown disparou SEM chefe,
   * veio outra horda, e matar o último foi direto pra loja."
   *
   * A causa: o Vulcão é `reach`, que só libera o chefe quando o jogador entra
   * na zona de extração. Com o countdown da última onda rodado e o objetivo
   * pendente, o chefe NUNCA nasce — e `!chefeVivo` é verdade por vacuidade.
   * O predicado lia "não há chefe vivo" como "o chefe morreu" e fechava a fase.
   *
   * `chefeLiberado` é o termo que separa as duas coisas.
   */
  const SEM_CHEFE_NASCIDO = {
    ondaCompleta: true,
    ultimaOnda: true,
    respiroArmado: true,
    respiroRestante: 0,
    chefeVivo: false,
    jogadorMorto: false,
    chefeLiberado: false,
  };

  it('NÃO fecha a última onda quando o chefe ainda não foi liberado', () => {
    expect(deveFecharFase(SEM_CHEFE_NASCIDO)).toBe(false);
  });

  it('NÃO fecha mesmo com o countdown rodado e o campo vazio', () => {
    // As três condições que sobram são exatamente as do relato do jogador.
    expect(deveFecharFase({ ...SEM_CHEFE_NASCIDO, respiroRestante: 0, respiroArmado: true })).toBe(false);
  });

  it('fecha assim que o objetivo libera o chefe (mesmo estado, um termo a mais)', () => {
    // O outro lado do portão: com o objetivo cumprido, o chefe nasce, cai, e
    // a fase fecha. Se isto devolvesse false, a fase travaria para sempre.
    expect(deveFecharFase({ ...SEM_CHEFE_NASCIDO, chefeLiberado: true })).toBe(true);
  });

  it('o objetivo pendente segura a fase mesmo numa onda do meio', () => {
    // Não é exclusivo da última onda: sem o termo, a fase do meio também
    // fechava sem chefe.
    expect(deveFecharFase({ ...SEM_CHEFE_NASCIDO, ultimaOnda: false })).toBe(false);
  });

  it('a fase `clear` nunca é afetada — ela libera o chefe na largada', () => {
    // `clear` não depende do objetivo, então as 6 fases common não podem ter
    // o comportamento mudado por este conserto.
    expect(PHASES.filter(f => f.objective === 'clear').length).toBeGreaterThan(0);
  });
});

describe('proximoDoRushNasce: o próximo chefe da fila do NÚCLEO', () => {
  const base = {
    ehRush: true,
    rushComecou: true,
    chefeVivo: false,
    proximaPosicao: 0,
    tamanhoDaFila: 4,
  };

  it('nasce quando a fila começou e nenhum chefe está vivo', () => {
    expect(proximoDoRushNasce(base)).toBe(true);
  });

  it('NÃO nasce com chefe vivo na tela', () => {
    expect(proximoDoRushNasce({ ...base, chefeVivo: true })).toBe(false);
  });

  it('NÃO nasce fora do rush do NÚCLEO', () => {
    expect(proximoDoRushNasce({ ...base, ehRush: false })).toBe(false);
  });

  it('NÃO nasce antes do primeiro chefe (a fila ainda não começou)', () => {
    expect(proximoDoRushNasce({ ...base, rushComecou: false })).toBe(false);
  });

  it('NÃO nasce quando a fila acabou — é o que fecha a fase', () => {
    // `>= length`, não `>`: na posição 4 de uma fila de 4 o NÚCLEO já nasceu e
    // morreu, e a fase fecha em vez de o chefe renascer.
    expect(proximoDoRushNasce({ ...base, proximaPosicao: 4 })).toBe(false);
  });

  it('avança pela fila inteira, uma posição por chefe que cai', () => {
    // O PRIMEIRO chefe nasce pela outra condição (`!bossSpawned`), que o
    // predicado não cobre — ele responde só "a fila pode andar". A simulação
    // roda as duas juntas, como o `update` faz.
    const vistos: string[] = [];
    const FILA = ['infernoPrime', 'reiMutante', 'mothership', 'nucleo'];
    let posicao = 0;
    let chefeVivo = false;
    for (let guarda = 0; guarda < 50 && posicao < FILA.length; guarda++) {
      const primeiro = posicao === 0;
      const podeNascer = primeiro
        || proximoDoRushNasce({ ehRush: true, rushComecou: true, chefeVivo, proximaPosicao: posicao, tamanhoDaFila: FILA.length });
      if (podeNascer) {
        vistos.push(FILA[posicao]);
        posicao++;
        chefeVivo = true;   // o chefe que acabou de nascer
      } else {
        chefeVivo = false;  // ele caiu: a fila pode andar
      }
    }
    expect(vistos).toEqual(FILA);
  });

  it('não depende do campo esvaziar (a biomaquina nunca deixa)', () => {
    // A máquina pulsa a fase inteira: exigir `enemies.length === 0` travava a
    // fila no primeiro chefe. O predicado não tem esse termo — é a trava do
    // deadlock (DECISIONS #170) e a que impede o NÚCLEO de renascer a cada
    // frame, que o rush-proof mediu como 851 inimigos com os 4 chefes vivos.
    expect(proximoDoRushNasce({ ...base, proximaPosicao: 1 })).toBe(true);
  });

  it('o flag de chefe derrotado NÃO entra no predicado', () => {
    // `bossKilled` é setado na morte de QUALQUER chefe e nunca é limpo, então
    // ele vale `true` durante a luta inteira. A assinatura não o aceita: é o
    // que faz o teste não poder regredir para o flag.
    expect(proximoDoRushNasce.length).toBe(1);
  });
});

describe('a queda do chefe é detectada pelo config', () => {
  it('a última fase tem chefe para testar', () => {
    expect(PHASES.every(p => typeof p.boss === 'string')).toBe(true);
  });

  it('o chefe é reconhecido como chefe pelo config', () => {
    for (const fase of PHASES) {
      expect(ENEMY_TYPES[fase.boss!].isBoss, `${fase.name}: ${fase.boss} não é isBoss`).toBe(true);
    }
  });

  it('a guarda de chefe vivo usa isBoss, não o tipo', () => {
    // Um summon do chefe não pode segurar a fase, e um inimigo comum não pode
    // liberá-la: é o flag do tipo que decide.
    const summons: Enemy[] = [
      { type: 'grunt', x: 0, y: 0, radius: 16 } as unknown as Enemy,
    ];
    const comBoss = [...summons, ...bossEnemies(1)];
    const estaVivo = (lista: Enemy[]) => lista.some(e => ENEMY_TYPES[e.type]?.isBoss);
    expect(estaVivo(comBoss)).toBe(true);
    expect(estaVivo(summons)).toBe(false);
  });
});

describe('o dano por toque é o do pior inimigo, não a soma da onda', () => {
  it('vários inimigos encostando rendem um toque por i-frame', () => {
    // `checkEnemyPlayerCollision` faz `break` no primeiro contato. Somar a onda
    // inteira (como fez um teste anterior) superestimava o pior caso e levava a
    // reprovar o balanceamento que o mutante veio corrigir.
    const lista = bossEnemies(3);
    let toques = 0;
    checkEnemyPlayerCollision(lista, 0, 0, 18, 0, () => { toques++; });
    expect(toques).toBe(1);
  });

  it('nenhum toque enquanto o jogador está invulnerável', () => {
    const lista = bossEnemies(3);
    let toques = 0;
    checkEnemyPlayerCollision(lista, 0, 0, 18, 0.4, () => { toques++; });
    expect(toques).toBe(0);
  });
});