# SARGENTO RIOS — Roadmap

> Atualizado: 2026-10-12 · direção em [`docs/DESIGN.md`](docs/DESIGN.md) ·
> estado concreto em [`STATUS.md`](STATUS.md) · pendências em [`TODO.md`](TODO.md) ·
> cardápio não-decidido em [`docs/FUTURO.md`](docs/FUTURO.md)

A ordem não é por "o que é mais legal", é por **o que destrava o resto**.

---

## Em andamento — rodada 2026-11 (IA-2)

A partida completa relatada pelo dono virou bugs B1–B8 da fase final + tasks
T1–T6 + a história II–IV. Item a item no `TODO.md` ("RODADA 2026-11").
Arquivos em voo: `src/main.ts`, `src/systems/loot.ts`, `src/config.ts`,
`src/systems/sprites.ts` e os docs de história — quem não for desta frente
evita editar esses arquivos até o commit.

- [x] B1 — o epílogo não toca antes da luta final
- [x] B2 — o Destruidor é entregue na entrada da fase 9, não como loot da loja
- [x] B3 — countdown do Vulcão sem chefe: reproduzido, consertado e provado
      (`npm run vulcao`, 2026-10-13)
- [x] B4 — estado do rush: NÃO reproduz no HEAD (`02e7733`); ação = republicar
- [x] B6 + biomaquina + nome NÚCLEO-CENTRAL — pagos na própria rodada 2026-11
      (`3e7458f`, `56395c8`, DECISIONS #169/#170)
- [x] B5 + B7 — B5 foi resolvido por B1+B2 e a reescrita do H4 (DECISIONS
      #174); B7 (cenário destrutivo) entregue em 2026-10-13: barril
      instável, fogo no chão (hazard dos dois lados), resta a parede
      rachada como pendência de ARTE (96 variantes esperando o olho do dono)
- [x] T1 — o TITÃ da onda: 1 por onda a partir da segunda, corpo grande de
      verdade (2026-10-13)
- [x] T4a — vender pontos de talento por moedas (2026-10-13)
- [x] T5 — resgate a 20 moedas, arbitrado pelo teste de economia
- [ ] T2 — playlist de músicas mais elaborada
- [ ] T3 — tirar auxílio de IA da parte final do site
- [ ] T4b — mais níveis e mais perks (atrás da economia medida e do C2)
- [ ] T6 — armaduras no jogo
- DESTRAVADO pela sessão: o **teste de economia** (o árbitro,
      `economia.test.ts`) — as 7 fases novas (PREMISSA-V2) e a poda da
      árvore agora têm número para decidir

## Frentes aprovadas (plano de 2026-10-12)

Executadas em paralelo com a rodada acima, sem tocar nos arquivos dela.

1. **Base verde + docs** — README, ROADMAP e STATUS reconciliados com o disco;
    a cada entrega, os três voltam a dizer a verdade.
2. **Balanceamento mensurável** — o espinho do Castelo (única fase que mata o
   piso: 32s contra 45s+ das outras 8), dano de barril medido em sessão, curva
   de dificuldade com passos uniformes, chefe de raio 46 no corredor de 1
   célula (só **depois** da fase 9 nova, que pode resolver sozinha).
3. **Dívidas de UX** — tutorial de perks, cores de condição durante a
   partida, preset de loadout, conquista de loss, combos cruzados entre
   ramos, objetivo da Fábrica alinhado à cutscene, mural de conquistas e de
   personagens.
4. **Decisões do dono** — Castelo `protect` (abrigo / interceptar linha de
   tiro / vida de escolta), teste de economia (árbitro loja × progressão,
   destrava as 7 fases novas), poda da árvore de talentos, arco II–IV.
   Nada disto vira código antes da escolha.
5. **Conteúdo** — tint por inimigo, tilesets por zona, moral ↔ sorte (Sprint
   7), armas 12→20, NPC aliado do Castelo, muros quebráveis (por último:
   colisão, pathfinding e borda do mapa no mesmo risco).
6. **Polimento** — perf budget, bússola de objetivo, configurações 2.0,
   SFX por material, paleta daltonismo-safe.
7. **Publicação** — deploy do site, cápsula + GIFs do itch, versão visível no
   menu. i18n, touch e Steam ficam DEPOIS por decisão registrada.

A régua por entrega: `tsc` limpo + `npm test` + build; render mudou →
`npm run visual` com o PNG aberto; HP/onda mudou → `npm run fases`/`sessao`.

---

## Fora de escopo (não reabrir sem motivo novo)

- **Coop/competitivo online** — o modelo de autoridade de rede não existe;
  decidido e adiado em 2026-10-10.
- **Mapa procedural** — o resultado lê como "feito por máquina", que é
  exatamente o que a direção proíbe.
- **Mobile/touch e gamepad** — navegador + teclado/mouse é o alvo decidido.
- **HUD em DOM** — quebra a regra do canvas único e foi a causa de metade dos
  overlaps da v1.2.
- **Progressão durante a fase** — reabrir muda a economia inteira.
- **Steam agora** — página e validação vêm depois do jogo fechado.

---

## Histórico

- **v1.2** — conteúdo de base: armas, upgrades, combos, boss em 3 fases,
  hardcore, save/load, conquistas, tutorial, minimapa.
- **v1.3** — o campo de batalha: tilemap com deslize por eixo, câmera com
  clamp, flow field, terreno prerenderizado, props destrutíveis, 9 mapas
  autorais, colisão swept, HUD 100% canvas, 4 faixas OGG.
- **v1.4** — bosses VIGIA e NÚCLEO, `protect` que falha e reinicia, marcador
  de chefe, cobertura por bioma, curva por número de ondas, 21 conquistas.
- **v2** — armas com família/condição/peça, XP e nível, escada de 24 perks com
  4 especiais, portão anti-IA (5 testes), telemetria de dano por fonte,
  silhueta de inimigo variando por fase, site estático, versus local 2P
  completo com revanche.
- **2026-11** — fase final como desfile (`NUCLEO_RUSH`), biomaquina,
  Destruidor e traje de contenção, telemetria que alcança as 9 fases.

## Métricas (conferidas contra o disco em 2026-10-12)

| Métrica | Valor |
|---|---|
| Arquivos TypeScript (fora de teste) | 55 |
| Testes | 894 em 49 arquivos |
| Mapas / fases | 9 |
| Tipos de inimigo | 32 (22 comuns + 9 chefes + biomaquina) |
| Bosses | 9, mais a fila `NUCLEO_RUSH` na fase final |
| Armas | 13 |
| Perks | 24 degraus + 4 especiais |
| Combos | 6 |
| Conquistas | 21 |
| Modos de jogo | 4 |
