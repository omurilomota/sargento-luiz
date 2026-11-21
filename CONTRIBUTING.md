# Contribuindo para o SARGENTO LUIZ

Obrigado pelo interesse! O projeto aceita contribuições via pull request.
Antes de começar, leia isto — economiza tempo seu e meu.

## Direitos e licença

O código é **copyright (c) 2026 Murilo Mota**, licenciado sob
**Apache License 2.0** (veja `LICENSE` e `NOTICE`).

Ao enviar um pull request, **você mantém os direitos autorais** do que
escreveu. Sua contribuição entra no projeto sob a mesma Apache-2.0, sem
transferência de propriedade e sem CLA — a seção 5 da licença já cobre
isso. Você continua livre para reutilizar seu próprio código em outros
projetos, respeitada a licença do projeto.

Assets de terceiros (Kenney, Eric Matyas, Vincent Sevedge, harrison-lord,
isaiah658, LPC, Kay Lousberg e outros) têm licenças próprias e **devem**
manter os créditos em `public/assets/CREDITS.md`,
`public/assets/music/CREDITS.md` e `NOTICE`. Não relicencie esses assets.

## Antes de mexer

1. Leia o `README.md` — o que o jogo é e como rodar.
2. Leia `docs/PENDENCIAS.md` — a **lista viva** do que está aberto.
   (`TODO.md` é histórico de sessões: não é leitura obrigatória.)
3. Leia `AGENTS.md` — regras de design e anti-padrões.
4. Abra uma issue descrevendo o que quer mudar **antes** de escrever código.
   Isso evita trabalho duplicado.

## Gitflow

- `main` — produção estável. **Nunca commitar direto.**
- `develop` — integração. Todo PR mira aqui.
- `feature/*` — uma feature por branch, criada de `develop`.
- `hotfix/*` — fixes urgentes, criados de `main`, merge em `main` e `develop`.

Commits: `tipo: descrição curta em português`
(`feat`, `fix`, `chore`, `refactor`, `style`, `debug`, `revert`).
Um commit = uma mudança lógica.

## Portões obrigatórios (antes de abrir o PR)

```bash
npx tsc --noEmit   # 0 erros
npm test           # suíte inteira, inclui os 5 portões anti-IA
npm run build      # build ok
```

## Regra 16 — mudanças visuais

Se você mexeu em `renderer.ts`, `hud.ts`, `shop.ts`, `terrain.ts`, `props.ts`,
`sprites.ts`, `audio.ts` ou `maps.ts`, **tem que** rodar:

```bash
npm run visual
```

e **abrir os PNGs** de `tools/shots/` (use `tools/montage.py` para juntar
numa folha-contato). Screenshot não lido é screenshot inexistente.

Mudanças em HP/onda exigem `npm run sessao`.

## Ferramentas de IA

Copilot, Claude Code, OpenCode, Cursor e semelhantes são permitidos. O projeto
usa essas ferramentas; o que importa é o resultado passar nos portões.

Os cinco portões da suíte (`npm test`) reprovam:

| Portão | O que pega |
|---|---|
| `semIA` | tics de texto em falas e diário: tríade "A, B e C", "não X, mas Y", etiqueta de fala, adjetivo vazio |
| `semDesenho` | `arc`, `fillRect`, `ellipse` e gradientes no renderer fora da lista permitida |
| `semProcedural` | som sintético sem arquivo OGG atrás de `playSfxFile` |
| `semAssetQuebrado` | arquivo de `public/assets/` que não chegou ao `dist/` ou veio com 0 byte |
| `semOrfao` | export sem chamador, stat sem leitor ou sem escritor |

Regras que os testes não pegam sozinhos:

- **Regra 15:** visual vem de sprite do pack. Código desenha só UI, efeito e
  fallback declarado de asset que falhou ao carregar.
- **Regra 16:** render mudou → `npm run visual` → abrir o PNG. Sem isso, a
  entrega fica pendente.
- **Texto novo:** se a frase só funciona com o tic, reescreva. Se não souber
  escrever sem soar IA, pergunte na issue antes de colocar no código.

## Pull request

- Base: `develop`.
- Descreva **o quê** e **por quê**, com as provas (testes, screenshots).
- Um PR = uma mudança lógica. PRs grandes e mistos serão pedidos para dividir.
