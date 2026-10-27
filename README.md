# GPON 3D — OMCI, T-CONT, GEM ports e Perfil de linha

Apresentação 3D interactiva, no browser, que explica a qualquer leigo como funciona uma rede GPON: o **OMCI**, o **T-CONT**, as **GEM ports** e o **perfil de linha**. É feita com Vite, Three.js e GSAP. Todos os objectos são gerados por código e a apresentação funciona sem internet.

> Estado actual: estão prontas as **cenas 0 a 3** (rede, três problemas, downstream e upstream). As cenas 4 a 10 aparecem como «em construção». O que falta está descrito em [`PLANO.md`](PLANO.md).

## Instalar

É preciso ter o Node.js 20.19 ou mais recente (recomenda-se o 22).

```bash
npm ci          # instala as dependências
npm run dev     # servidor de desenvolvimento (http://localhost:5173)
npm test        # testes (conteúdo, navegação, cada cena carrega sem erros)
npm run build   # gera a versão estática em dist/
```

## Apresentar

- **Online:** cada push publica a versão no GitHub Pages, com o workflow `.github/workflows/deploy.yml`.
  Para activar: *Settings → Pages → Source: GitHub Actions*. Para publicar a partir de outra branch que não a principal, junte essa branch em *Settings → Environments → github-pages → Deployment branches*.
- **Sem internet:** corra `npm run build` e sirva a pasta `dist/` com um servidor simples, por exemplo `npx vite preview` ou `python3 -m http.server -d dist`. Todos os caminhos são relativos (`base: './'`).
- Para abrir directamente numa cena, use o endereço com `#cena=3&passo=1` (cenas de 0 a 10, passos a começar em 0).
- Se a máquina for fraca, a qualidade baixa sozinha (primeiro desliga as sombras, depois o bloom). Também pode forçar com `?qualidade=baixa`.

## Atalhos de teclado

| Tecla | Acção |
|---|---|
| → / PageDown | Seguinte (passo ou cena) |
| ← / PageUp | Anterior |
| Espaço | Pausa / continua |
| R | Repetir a animação |

Na barra inferior há ainda 🐢 câmara lenta (0,25×), 🚚 «Ver analogia» e 🎯 «Repor vista». O rato roda a vista e o scroll faz zoom.

## Editar os textos

Todos os textos estão em [`src/content/cenas.pt.json`](src/content/cenas.pt.json). Pode alterá-los sem mexer no código:

| Campo | Onde aparece |
|---|---|
| `titulo` | Título da cena (canto superior esquerdo) |
| `legenda` | Legenda no ecrã (máximo 2 linhas) |
| `analogia` | Legenda alternativa do botão «Ver analogia» |
| `nota` | Painel «Notas conceituais» (um parágrafo por elemento) |
| `passos[].rotulo` | Etiqueta do passo actual, nas cenas com vários passos |
| `avisos` | Caixa amarela (ex.: «Valores ilustrativos») |
| `camara` | Enquadramento da cena (`posicao` e `alvo`, em metros) |
| `siglas` | Texto dos tooltips das siglas (OLT, ONT, T-CONT…) |
| `actores` | Painel «Quem faz o quê» |
| `quiz`, `resumo` | Teste rápido e tabela final (cena 10) |

Texto entre `` `acentos graves` `` aparece como código. As siglas da lista `siglas` ganham tooltip automaticamente. Depois de editar, corra `npm test`: o teste verifica, entre outras coisas, que nenhuma legenda passa do limite.

## Capturas de ecrã

```bash
npm run build && npm run capturas     # uma imagem por cena em capturas/
node scripts/capturas.mjs --cena 3 --passo 1 --t 0.5 --saida x.png
```

Usa o Playwright em modo headless e falha se aparecer algum erro na consola.

## Estrutura

```
src/content/cenas.pt.json   textos
src/core/                   motor 3D, cores, materiais, texturas procedurais
src/models/                 OLT, fibra, splitter, ONT, casa, impulsos de luz
src/network/network.js      montagem da rede (central → splitter 1:8 → 4 casas)
src/scenes/                 uma cena por ficheiro (sXX-*.js)
src/app/                    controlador da apresentação e contexto das cenas
src/ui/                     interface HTML sobreposta
tests/                      testes (vitest + jsdom)
```

## Cores (significado fixo)

| Cor | Significado |
|---|---|
| Azul-ciano | Downstream, luz a 1490 nm |
| Âmbar | Upstream, luz a 1310 nm |
| Roxo | OMCI (canal de gestão) |
| Azul / Verde / Vermelho | GEM Internet / Voz / IPTV |
| Contentor laranja | T-CONT (Alloc-ID) |
| Etiqueta branca | VLAN |
