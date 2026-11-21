# Como eu reviso PRs

Este arquivo diz o que eu olho antes de mergear. Serve para você saber de antemão
o que precisa estar pronto — e para eu não inventar critério novo a cada PR.

## Antes de olhar o código

- PR mira `develop`. PR em `main` será fechado com pedido para reabrir contra `develop`.
- CI verde. Se o GitHub Actions reprovou, eu nem começo a revisar.
- Um PR = uma mudança lógica. Misturou feature com correção? Vou pedir para dividir.
- Descrição preenchida no template. "Arrumei umas coisas" não conta.

## O que eu confiro no diff

- **A mudança faz o que a descrição diz.** Se o texto promete uma coisa e o
  código faz outra, o PR volta.
- **Os portões passaram de verdade.** `semIA`, `semDesenho`, `semProcedural`,
  `semAssetQuebrado` e `semOrfao` reprovam sozinhos. Não tem como contornar
  escondendo erro.
- **Visual novo veio de asset.** Regra 15: se tem `arc`/`fillRect` criando
  forma no renderer sem ser UI/efeito/fallback declarado, volta.
- **Render mudou?** Tem que ter `npm run visual` e a folha de screenshots aberta.
  Screenshot não lido não conta.
- **Texto novo soa como pessoa.** Sem tríade "A, B e C", sem "não X, mas Y",
  sem adjetivo vazio. Se a frase só funciona com o tic, reescreva.
- **Código novo tem chamador.** Export sem uso, stat sem leitor ou sem escritor
  cai no `semOrfao`.

## Prazo

Eu reviso PRs pequenos em até poucos dias. Se passar uma semana sem resposta,
pode mandar um ping na issue do GitHub — não é pressão, é lembrete.

## Depois do merge

- Branch `feature/*` é apagada pelo autor do PR ou por mim.
- Release sai de `develop` via `release/*` → merge em `main` → tag.
- Nunca commitar direto em `main`.
