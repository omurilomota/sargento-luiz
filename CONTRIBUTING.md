# Contribuindo para o SARGENTO LUIZ

Obrigado pelo interesse! O projeto aceita contribuições via pull request.
Antes de começar, leia isto — economiza tempo seu e meu.

## Direitos

O código é **copyright (c) 2026 Murilo Mota — todos os direitos reservados**
(veja `LICENSE`). Ao enviar um PR, você concorda que sua contribuição passa
a ser propriedade do projeto, sob a mesma licença.

Assets de terceiros (Kenney, Eric Matyas, Vincent Sevedge, harrison-lord,
isaiah658, LPC, Kay Lousberg) têm licenças próprias e **devem** manter os
créditos em `public/assets/CREDITS.md` e `public/assets/music/CREDITS.md`.

## Antes de mexer

1. Leia `AGENTS.md` — contém as regras de design e os anti-padrões.
2. Leia `TODO.md` e `docs/PENDENCIAS.md` — o que já está planejado.
3. Abra uma issue descrevendo o que quer mudar **antes** de escrever código.
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

## Regras de design (resumo)

- **Visual vem de asset**, nunca de código. Procedural só como fallback
  declarado quando o asset não carrega.
- **Som vem de arquivo**, com fallback procedural atrás de `playSfxFile`.
- **Texto novo passa pelo `semIA`** antes de existir — os portões reprovam
  tics de texto gerado por IA.
- **Código que ninguém chama não entra** — o portão `semOrfao` pega export
  sem chamador, stat sem leitor/escritor.

## Pull request

- Base: `develop`.
- Descreva **o quê** e **por quê**, com as provas (testes, screenshots).
- Um PR = uma mudança lógica. PRs grandes e mistos serão pedidos para dividir.
