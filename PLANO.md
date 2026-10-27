# PLANO — Apresentação 3D interactiva GPON (OMCI, T-CONT, GEM ports, Perfil de linha)

> Documento de continuidade. Qualquer sessão nova (web ou PC) deve ler este ficheiro e o `prompt_gpon_3d.md` antes de continuar.
> Fonte de verdade dos requisitos: `prompt_gpon_3d.md`. Este plano descreve **como** vamos cumpri-los.

---

## Estado actual

| Passo (método WAT) | Estado |
|---|---|
| 1. Planear (`PLANO.md`) | ✅ feito — aprovado pelo utilizador |
| 2. Esqueleto (Vite, cena base, UI, navegação, Pages) | ✅ feito |
| 3. Modelos procedurais (OLT, fibra, splitter, ONT, casas, router, dispositivos) | ✅ feito |
| 4. Cenas 0–3 → **paragem de validação** | ✅ feito — validado (PR #1) |
| 5. Cenas 4–7 | ✅ feito — revisto pelos dois revisores — **a aguardar validação do utilizador** |
| 6. Cenas 8–10 | ⏳ por fazer |
| 7. Polimento (desempenho, responsividade, acessibilidade) | ⏳ por fazer |
| 8. Verificação final + `npm run build` + capturas | ⏳ por fazer |

---

## Decisões técnicas

| Tema | Decisão |
|---|---|
| Build | **Vite 8** (`base: './'` para funcionar no GitHub Pages e em `file://`/servidor simples) |
| 3D | **three 0.186** (módulos ES, `three/addons/...`) |
| Animação | **GSAP 3.15** — uma `gsap.timeline()` por cena; câmara lenta via `timeline.timeScale(0.25)` |
| Pós-processamento | **postprocessing 6** (`EffectComposer` + `SelectiveBloomEffect` só nos impulsos de luz) + `OutlineEffect` para o actor activo |
| Ambiente | `RoomEnvironment` + `PMREMGenerator` (procedural, sem HDRI externo) |
| Sombras | `PCFSoftShadowMap`, uma luz direccional com sombra; desactivadas automaticamente se FPS < 45 |
| Qualidade adaptativa | Monitor de FPS (média 2 s): nível alto → médio (sem sombras) → baixo (sem bloom, `pixelRatio` 1) |
| UI | HTML/CSS sobreposto ao canvas; nada de texto 3D nas legendas. Rótulos ancorados a objectos 3D com `CSS2DRenderer` |
| Textos | Todos em `src/content/cenas.pt.json` (editável sem tocar no código) |
| Testes | `vitest` + `jsdom`: validação do JSON (campos obrigatórios, legenda ≤ 2 linhas/≈160 car.), navegação (limites, teclado), carregamento de cada cena sem excepções (WebGL simulado) |
| Capturas | Playwright headless (Chromium pré-instalado no ambiente) → `capturas/cena-XX.png`; script `npm run capturas` |
| Publicação | `.github/workflows/deploy.yml`: `npm ci && npm test && npm run build` → GitHub Pages (artefacto `dist/`) em cada push |
| Sem rede externa | Nenhum modelo/textura/HDRI descarregado; texturas geradas em `CanvasTexture` |

---

## Estrutura de pastas

```
gpon-3d/
├── .github/workflows/deploy.yml     # build + publicação no GitHub Pages
├── capturas/                        # uma imagem por cena (Playwright)
├── index.html
├── package.json
├── vite.config.js                   # base: './'
├── PLANO.md                         # este ficheiro
├── README.md                        # instalar, apresentar, atalhos, editar textos
├── prompt_gpon_3d.md                # requisitos originais
├── scripts/
│   └── capturas.mjs                 # Playwright: abre cada cena e grava PNG + erros de consola
├── src/
│   ├── main.js                      # arranque: motor, UI, controlador de cenas
│   ├── content/
│   │   └── cenas.pt.json            # TODOS os textos (legendas, analogias, notas, tooltips, quiz)
│   ├── core/
│   │   ├── engine.js                # renderer, câmara, OrbitControls, ambiente, composer, loop
│   │   ├── quality.js               # monitor de FPS e níveis de qualidade
│   │   ├── cameraRig.js             # transições GSAP de câmara + «Repor vista»
│   │   ├── highlight.js             # contorno luminoso do actor activo
│   │   └── colors.js                # paleta fixa (secção 2 do prompt) — única fonte de cores
│   ├── models/                      # geometria procedural
│   │   ├── olt.js                   # bastidor, cartas de serviço, LEDs, portas PON
│   │   ├── fiber.js                 # cabo amarelo + núcleo translúcido; curvas (CatmullRom)
│   │   ├── splitter.js              # caixa 1:8 (1 entrada, 8 saídas; 4 ligadas a casas)
│   │   ├── ont.js                   # caixa branca, LEDs PON/LOS/LAN, portas Ethernet, modo «corte»
│   │   ├── house.js                 # casa + router + portátil, telefone, TV
│   │   ├── technician.js            # silhueta + portátil (cena 4)
│   │   ├── tcont.js                 # contentor laranja «Alloc-ID»
│   │   ├── gemPort.js               # compartimento colorido (Internet/Voz/IPTV)
│   │   ├── packet.js                # pacote + etiqueta GEM, cadeado, etiquetas VLAN empilháveis
│   │   ├── pulse.js                 # impulso de luz (bloom) que percorre uma curva
│   │   └── road.js                  # faixas de estrada (tipos de T-CONT, analogia)
│   ├── network/
│   │   └── network.js               # monta a rede: central/OLT → fibra → splitter → 4 casas
│   ├── scenes/
│   │   ├── index.js                 # registo ordenado das 11 cenas
│   │   ├── sceneBase.js             # contrato comum: enter(ctx), build timeline, exit()
│   │   ├── s00-rede.js
│   │   ├── s01-problemas.js
│   │   ├── s02-downstream.js
│   │   ├── s03-upstream.js
│   │   ├── s04-omci.js
│   │   ├── s05-tcont.js
│   │   ├── s06-gem.js
│   │   ├── s07-perfil.js
│   │   ├── s08-ponta-a-ponta.js
│   │   ├── s09-analogia.js
│   │   └── s10-resumo.js
│   ├── ui/
│   │   ├── controls.js              # barra inferior + teclado
│   │   ├── notes.js                 # painel «Notas conceituais» (recolhível)
│   │   ├── actors.js                # painel «Quem faz o quê»
│   │   ├── legend.js                # legenda de cores (canto superior direito)
│   │   ├── tooltips.js              # siglas → explicação (rato/toque)
│   │   ├── codePanel.js             # painel de código sincronizado (cena 7)
│   │   └── quiz.js                  # teste rápido (cena 10)
│   └── styles/
│       └── main.css                 # letra ≥ 18 px em ecrã grande, contraste AA
└── tests/
    ├── content.test.js              # JSON completo e coerente
    ├── navigation.test.js           # anterior/seguinte/limites/teclado
    └── scenes.test.js               # cada cena entra/sai sem excepções
```

---

## Paleta fixa (`src/core/colors.js`)

| Significado | Cor | Hex proposto |
|---|---|---|
| Downstream (1490 nm) | azul-ciano | `#22d3ee` |
| Upstream (1310 nm) | âmbar | `#f59e0b` |
| OMCI | roxo | `#a855f7` |
| GEM Internet | azul | `#3b82f6` |
| GEM Voz | verde | `#22c55e` |
| GEM IPTV | vermelho | `#ef4444` |
| T-CONT | contentor laranja + etiqueta «Alloc-ID» | `#f97316` |
| VLAN | etiqueta branca com número | `#ffffff` |
| Colisão (só cena 3) | clarão vermelho + ⚠ | (usa o vermelho de alerta, fora dos pacotes) |

Estas cores são lidas por todos os módulos a partir de `colors.js` e repetidas na legenda fixa. Nenhuma cena define cores próprias para estes significados.

---

## Modelo de dados de cada cena (`src/content/cenas.pt.json`)

```jsonc
{
  "siglas": { "OLT": "Optical Line Terminal: equipamento na central…", "...": "..." },
  "actores": [ { "id": "olt", "nome": "OLT", "papel": "…" }, ... ],
  "cenas": [
    {
      "id": "s02-downstream",          // corresponde ao módulo src/scenes/s02-downstream.js
      "titulo": "Downstream: a OLT fala para todos",
      "legenda": "A descer, a OLT envia tudo para todos. Cada ONT só fica com o que é seu, e o tráfego vai cifrado.",
      "analogia": "Texto alternativo com a analogia da estrada (botão «Ver analogia»).",
      "nota": "Texto do painel «Notas conceituais» (secção 6 do prompt).",
      "actorAtivo": ["olt", "ont"],     // por ordem; a timeline muda o destaque
      "sentidos": ["down"],             // "down" e/ou "up" → mostra o alternador se houver os dois
      "camara": { "posicao": [x, y, z], "alvo": [x, y, z] },
      "timeline": [                     // passos da animação (rótulos de GSAP)
        { "id": "envio", "texto": "Pacotes saem da OLT", "actor": "olt" },
        { "id": "filtro", "texto": "Cada ONT verifica a etiqueta", "actor": "ont" }
      ],
      "passos": false,                  // true → «Seguinte» avança passos internos antes da cena seguinte (cena 4, 7, 8)
      "avisos": []                      // ex.: «Valores ilustrativos…» (cenas 7 e 8)
    }
  ],
  "quiz": [ { "pergunta": "…", "opcoes": ["…"], "certa": 0, "explicacao": "…" } ],
  "resumo": [ { "actor": "OLT", "downstream": "…", "upstream": "…" } ]
}
```

O código de cada cena (`sXX-*.js`) exporta `{ id, enter(ctx), timeline(ctx, sentido), exit(ctx) }`. O `ctx` dá acesso à rede 3D, à câmara, à UI e aos textos. A cena só cria/mostra objectos e define a timeline; a navegação, a câmara lenta, a pausa e o «Repetir» são genéricos (actuam sobre a timeline devolvida).

---

## Lista de cenas

| # | id | Título | Ideia única | Actor activo | Sentido | Passos internos |
|---|---|---|---|---|---|---|
| 0 | s00-rede | A rede numa vista | Uma fibra, muitas casas | OLT → fibra → splitter → ONT (acendem por ordem) | — | não |
| 1 | s01-problemas | Três problemas | Controlar, partilhar, separar | OLT↔ONT, fibra, interior ONT | — | não |
| 2 | s02-downstream | A OLT fala para todos | Difusão + filtro na ONT + cifra | OLT → ONT | ⬇ | não |
| 3 | s03-upstream | O problema da colisão | Colisão (didáctica) → TDMA | ONT → OLT | ⬆ | sim (problema / solução) |
| 4 | s04-omci | OMCI: o comando à distância | Configurar, monitorizar, alarmes, actualizar | OLT → OMCI → ONT | ⬇⬆ | sim (4 passos) |
| 5 | s05-tcont | T-CONT: autorização para falar a subir | Mapa de banda + DBA; sub-vista tipos 1–5 | OLT (DBA) → ONT (T-CONT) | ⬇⬆ | sim (mapa / envio / DBA / tipos) |
| 6 | s06-gem | GEM port: um canal por tráfego | VLAN 100 → GEM 2, GEM dentro do T-CONT | router → ONT | ⬇⬆ (alternador) | sim |
| 7 | s07-perfil | O perfil de linha | Código ↔ peças 3D, reutilizável | OLT | — | sim (uma linha por clique, depois cópia) |
| 8 | s08-ponta-a-ponta | Dos comandos à rede | `ont add` + `service-port`, 100 → 2000 + 1410 | OMCI, router, ONT, OLT | ⬆ | sim (6 passos) |
| 9 | s09-analogia | A analogia completa | Rede ↔ estrada com semáforo | todos | — | sim (4 transformações) |
| 10 | s10-resumo | Quem faz o quê + teste | Tabela final + 5 perguntas | todos | — | não |

### Notas de rigor a respeitar no código (secção 7)
- 1490 nm a descer / 1310 nm a subir; 1550 nm não aparece.
- 2,488 / 1,244 Gbit/s só no painel de notas.
- Splitter passivo: nunca «escolhe», nunca tem LED de energia, nunca é actor que decide. A luz divide-se para **todas** as saídas igualmente.
- Cena 3: colisão marcada como «o que aconteceria sem regras».
- Cenas 7 e 8: aviso «Valores ilustrativos…» sempre visível; `gemport 2` = índice da GEM no perfil (o identificador físico é atribuído pela OLT).
- ONT 7 na cena 8: é uma das 4 casas visíveis rotulada «ONT 7» (as ONT 1–8 correspondem às 8 saídas do splitter; desenham-se 4 — p. ex. ONT 1, 3, 5, 7 — e as outras ficam implícitas como saídas não ligadas). Não se inventam outros IDs.
- Comandos da cena 8 ficam com reticências até o utilizador fornecer os valores reais.

---

## Interface (resumo)

- Barra inferior: ◀ Anterior | «Cena X de 11» | Seguinte ▶ | ⟲ Repetir | 🐢 0,25× | Ver analogia.
- Teclado: ←/→, espaço (pausa/continua), R (repetir).
- Painéis: «Notas conceituais» (recolhível, lado direito), «Quem faz o quê» (lado esquerdo, recolhível), legenda de cores (canto superior direito), alternador ⬇/⬆ quando `sentidos` tem os dois, botão «Repor vista».
- Tooltips em todas as siglas da legenda e das notas (marcação automática a partir de `siglas`).

---

## Agentes de revisão (só nos passos de revisão)
- **Revisor técnico GPON** — compara cada cena com as secções 6 e 7.
- **Revisor didáctico («leigo»)** — percorre a apresentação e aponta confusões, texto a mais, cores incoerentes.

---

## Paragens de validação
1. Depois deste plano (agora).
2. Depois das cenas 0–3 (link do Pages + capturas).
3. Depois das cenas 4–7.
4. Versão final (cenas 8–10 + polimento + verificação).

Em cada paragem: commit + push para `claude/zen-noether-3wwknm`, link do Pages e o que deve ser visto. PR aberto quando o utilizador validar a fase.

---

## Notas para quem continua

- **Contrato das cenas** (`src/app/apresentacao.js`): cada cena exporta `{ id, passo(ctx, i), montar?(ctx), camaraPropria? }`.
  `passo` devolve uma `gsap.timeline({ paused: true })` com **tudo** lá dentro (nada de tweens soltos):
  para saltar para o passo N, o controlador limpa a cena e avança instantaneamente os passos 0..N-1.
- Objectos temporários vão para `ctx.temp` (via `ctx.adicionar`, `ctx.rotulo`); `ctx.limpar()` remove-os e repõe a rede.
- Ajudas em `src/scenes/util.js`: `criarPacote`, `percorrer`, `rebentar`, `marca`, `clarao`, `piscarLed`, `abanar`.
- Curvas da fibra: `rede.curvas.alimentacao` (OLT→splitter, u=0 na OLT) e `rede.curvas.derivacoes[k]` (splitter→ONT k, u=0 no splitter).
- Casas visíveis: ONT 1, 3, 5, 7 (saídas 1, 3, 5, 7 do splitter; as outras 4 com tampa). `rede.onts[k]`, `rede.routers[k]`.
- Cenas 8–10 estão como `cenaPorFazer` em `src/scenes/index.js` (mostram a rede e o actor activo).
- Depuração/capturas: `#cena=N&passo=P&t=0.5` (progresso fixo), `&cam=x,y,z,ax,ay,az` (câmara), `?captura=1`.
- Playwright: `scripts/capturas.mjs` copia o canvas para uma `<img>` antes de capturar (o headless nem sempre apresenta o último frame WebGL).
- `dist/` está no `.gitignore` durante o desenvolvimento; na entrega final é gerado e incluído.

## Revisão das cenas 0–3 (subagentes)
- Revisor técnico e revisor didáctico correram sobre as cenas 0–3; correcções aplicadas (ver commit «revisão das cenas 0–3»).
- **Decidido pelo utilizador:** as casas chamam-se ONT 1, 3, 5 e 7.
- **Comandos reais da cena 8 (fornecidos pelo utilizador; SN e descrição anonimizados de propósito — não substituir):** estão em `cenas.pt.json` → `s08-ponta-a-ponta.comandos`.
- Sugestões didácticas não aplicadas (contrariam o guião ou ficam para o polimento): legenda de cores filtrada por cena; trocar «Downstream/Upstream» nos títulos.

## Notas técnicas (fase 2)
- `viajar()` e `explodir()` usam `immediateRender: false` e controlam a visibilidade no `onUpdate` (o objecto só é visível durante a viagem; `ficar: true` mantém-no no fim). Não usar `tl.set(x, {visible:true})` antes de uma viagem.
- Peças do interior da ONT em `src/scenes/interior.js` (`criarAmpliacao`, `criarTcont`, `criarGem`, `etiquetaVlan`, `montarInteriorONT`, `moldura`).
- Linhas grossas: `tuboLinha()` em `src/scenes/util.js` (as linhas WebGL têm 1 px).
- Tone mapping NEUTRAL (o ACES desvirtuava o azul das GEM para lilás).
- Um passo pode impor o sentido (`passos[i].sentido` no JSON).

## Registo de sessões
- **2026-10-27** — Plano criado. Versões verificadas no npm: three 0.186.1, gsap 3.15.0, postprocessing 6.39.5, vite 8.3.5, vitest 5.0.5. Node 22.
- **2026-10-27** — Passos 2–4: esqueleto, modelos procedurais, cenas 0–3, testes (vitest + jsdom), capturas com Playwright, workflow do Pages. Respostas pendentes do utilizador assumidas: casas = ONT 1, 3, 5, 7; comandos da cena 8 ficam com reticências.
- **2026-10-27** — Fase 2: cenas 4–7 (OMCI, T-CONT/DBA/tipos, GEM port, perfil de linha), linhas mais visíveis a pedido do utilizador, revisão técnica e didáctica aplicada. PR #1 aberto com a fase 1.
