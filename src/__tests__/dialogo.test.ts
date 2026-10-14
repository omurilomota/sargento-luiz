/**
 * Porta: a caixa pequena de diálogo da Fábrica do Fernando (H2 — pedido do
 * Murilo: "caixa de diálogo pequena, não gigante igual aos outros níveis").
 *
 * O contrato: a fila conta as linhas em ordem; o ENTER avança e a caixa só
 * fecha quando a fila esvazia (o mundo congela por linha — decisão do
 * Murilo); o callback de fechamento dispara UMA vez, no fechar; o efeito
 * (a explosão da cápsula) dispara QUANDO a linha dele aparece, não depois;
 * e o reset não vaza sequência entre partidas.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  abrirDialogo, avancarDialogo, dialogoAtivo, getDialogo,
  setEfeitoDialogo, resetDialogo, EntradaDialogo,
} from '../systems/dialogo';

const linha = (speaker: 'rios' | 'fernando' | 'narrador', text: string, efeito?: 'explosaoCapsula'): EntradaDialogo =>
  ({ speaker, text, efeito });

describe('dialogo: a caixa pequena da Fábrica (H2)', () => {
  beforeEach(() => resetDialogo());

  it('a caixa abre na primeira linha e avança em ordem', () => {
    abrirDialogo([linha('rios', 'primeira'), linha('fernando', 'segunda')]);
    expect(dialogoAtivo()).toBe(true);
    expect(getDialogo()?.text).toBe('primeira');
    expect(avancarDialogo()).toBe(false);
    expect(getDialogo()?.text).toBe('segunda');
  });

  it('a caixa fecha quando a fila esvazia — o retorno diz se fechou', () => {
    // abrirDialogo JÁ mostra a primeira linha (o sistema avança sozinho ao
    // abrir): o primeiro avancar público vai para a SEGUNDA. A caixa de
    // uma linha só fecha no primeiro avançar público.
    abrirDialogo([linha('rios', 'a'), linha('fernando', 'b')]);
    expect(getDialogo()?.text).toBe('a');
    expect(avancarDialogo()).toBe(false);
    expect(getDialogo()?.text).toBe('b');
    expect(avancarDialogo()).toBe(true);
    expect(dialogoAtivo()).toBe(false);
    expect(getDialogo()).toBeNull();
  });

  it('o callback de fechamento dispara UMA vez, no fechar da caixa', () => {
    const aoFechar = vi.fn();
    abrirDialogo([linha('rios', 'a'), linha('fernando', 'b')], aoFechar);
    avancarDialogo();
    expect(aoFechar).not.toHaveBeenCalled();
    avancarDialogo();
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it('o efeito dispara quando a LINHA dele aparece — a explosão da cápsula no meio do diálogo', () => {
    const efeito = vi.fn();
    setEfeitoDialogo(e => efeito(e));
    abrirDialogo([
      linha('rios', 'antes'),
      linha('narrador', 'a cápsula cede', 'explosaoCapsula'),
    ]);
    expect(efeito).not.toHaveBeenCalled();
    avancarDialogo(); // chegou na linha do efeito
    expect(efeito).toHaveBeenCalledWith('explosaoCapsula');
    expect(getDialogo()?.text).toContain('cede');
  });

  it('o reset não vaza sequência entre partidas', () => {
    abrirDialogo([linha('rios', 'aberta')]);
    resetDialogo();
    expect(dialogoAtivo()).toBe(false);
    // abrir de novo começa da primeira linha, não de onde parou
    abrirDialogo([linha('fernando', 'nova')]);
    expect(getDialogo()?.text).toBe('nova');
  });

  it('sequências enfileiradas com a caixa aberta entram atrás das atuais', () => {
    abrirDialogo([linha('rios', 'primeira sequência')]);
    abrirDialogo([linha('fernando', 'segunda sequência')]);
    avancarDialogo();
    expect(getDialogo()?.text).toBe('segunda sequência');
  });
});
