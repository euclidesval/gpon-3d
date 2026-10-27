# PROMPT — Apresentação 3D interactiva: OMCI, T-CONT, GEM ports e Perfil de Linha (GPON)

> **Claude Code na web:** cria um repositório GitHub vazio (ex.: `gpon-3d`), carrega este ficheiro para a raiz e abre o repositório no Claude Code na web. Escreve:
> **"Lê o ficheiro prompt_gpon_3d.md e executa-o do início ao fim."**
>
> **Mais tarde, no PC:** clona o mesmo repositório e continua com o Claude Code local. O projecto é o mesmo.

---

## 0. Ambiente de execução (ler primeiro)

Estás a correr no **Claude Code na web**, numa máquina na cloud ligada a um repositório GitHub. O utilizador **não tem acesso a `localhost`** e vai ver o resultado pelo browser. Por isso:

1. **Publicação para visualização:** configura o **GitHub Pages** com um workflow do GitHub Actions (`.github/workflows/deploy.yml`) que corre `npm ci && npm run build` e publica a pasta `dist/` em cada push.
   - No `vite.config.js`, define `base: './'` para os caminhos funcionarem no Pages.
   - No fim de cada paragem de validação, indica-me o link do Pages e diz-me o que devo ver.
   - Se o Pages ainda não estiver activo, explica-me em passos curtos como o activar (Settings → Pages → Source: GitHub Actions).
2. **Commits pequenos e frequentes:** um commit por passo do workflow, com mensagem em português (ex.: `cena 3: colisão e TDMA no upstream`). Faz push para a branch de trabalho e abre um pull request quando eu validar uma fase.
3. **Verificação visual:** tenta usar o Playwright para tirar capturas de cada cena. Se não conseguires instalar o browser do Playwright neste ambiente, não insistas: diz-me isso numa linha e verifica pelo build sem erros + testes de que cada cena carrega sem excepções (ex.: com `vitest` + `jsdom` para a lógica de navegação). As capturas fazem-se depois, no PC.
4. **Sem dependências fora do npm:** nada de downloads de modelos, texturas ou HDRI de sites externos; tudo procedural ou incluído no repositório.
5. **Continuidade:** mantém o `PLANO.md` actualizado com o que está feito e o que falta, para que uma sessão nova (na web ou no PC) consiga continuar sem perder contexto.

---

## 1. Missão

Constrói uma **apresentação 3D interactiva e realista**, a correr no browser, que ensine a **qualquer leigo** como funciona uma rede GPON e, em particular, quatro conceitos:

| Conceito | Pergunta que responde |
|---|---|
| **OMCI** | Como é que a OLT configura e controla, à distância, uma ONT que está em casa do cliente? |
| **T-CONT** | Muitas ONT partilham a mesma fibra a subir. Quem pode transmitir, quando e quanto? |
| **GEM port** | Dentro da mesma ONT há vários tipos de tráfego. Como se separam? |
| **Perfil de linha** | Como se junta tudo (T-CONT + GEM ports + VLAN) num modelo reutilizável enviado pela OLT à ONT? |

A apresentação deve mostrar, de forma visual e animada:
- o **downstream** (OLT → ONT) e o **upstream** (ONT → OLT);
- **quem faz o quê** em cada momento (OLT, splitter, ONT, router, DBA, OMCI);
- **notas conceituais** curtas em cada cena;
- gráficos e imagens **simples de interpretar**: uma ideia por cena, poucas cores, legendas sempre visíveis.

Idioma de todo o conteúdo: **português (Angola)**, com a ortografia do material de origem (ex.: «actualizar», «óptica»). Termos técnicos (OLT, ONT, T-CONT, GEM, DBA, VLAN) ficam no original.

---

## 2. Princípios didácticos (obrigatórios)

1. **Uma ideia por cena.** Se uma cena precisa de duas ideias, divide-a em duas.
2. **Primeiro o problema, depois a solução.** Ex.: mostra a colisão no upstream *antes* de mostrar o TDMA.
3. **Ver antes de ler.** A animação explica; o texto confirma. Legenda no ecrã: máximo 2 linhas.
4. **Cores fixas = significado fixo** (nunca mudam ao longo da apresentação):
   - Downstream (luz 1490 nm): **azul-ciano**
   - Upstream (luz 1310 nm): **âmbar**
   - OMCI (canal de gestão): **roxo**
   - GEM Internet: **azul**, GEM Voz: **verde**, GEM IPTV: **vermelho**
   - T-CONT: **contentor laranja** com etiqueta «Alloc-ID»
   - VLAN: **etiqueta branca** colada ao pacote (com o número visível)
5. **Analogia sempre disponível:** em cada cena, um botão «Ver analogia» troca a legenda técnica pela analogia da estrada (ver cena 9).
6. **Nada de jargão sem explicação:** cada sigla tem tooltip ao passar o rato / tocar.
7. **Ritmo controlado pelo utilizador:** nada avança sozinho sem o utilizador carregar em «Seguinte», excepto as animações dentro da cena.

---

## 3. Stack técnica

- **Vite + Three.js** (última versão estável) + **GSAP** para a linha temporal das animações.
- Realismo: materiais **PBR** (`MeshStandardMaterial`/`MeshPhysicalMaterial`), iluminação com **HDRI procedural** ou `RoomEnvironment`, **sombras suaves**, **bloom** (postprocessing) apenas na luz que viaja na fibra.
- **Sem modelos externos pagos ou com direitos.** Todos os objectos são modelados por código (geometria procedural) com bom nível de detalhe:
  - **OLT**: chassis de bastidor com cartas de serviço, LEDs e portas PON.
  - **Fibra**: cabo amarelo (monomodo) com núcleo translúcido onde se vêem os impulsos de luz a viajar.
  - **Splitter 1:8**: caixa com 1 entrada e 8 saídas.
  - **ONT**: caixa branca com LEDs (PON, LOS, LAN) e portas Ethernet.
  - **Casas**: 4 casas visíveis (as outras 4 saídas do splitter ficam implícitas), cada uma com ONT + router; dentro, ícones simples de portátil, telefone e TV.
- Interface em HTML/CSS sobreposta ao canvas (não texto 3D para legendas: legibilidade primeiro).
- Responsivo (portátil e projector 16:9; funcional em tablet). 60 fps num portátil comum; se cair, reduzir sombras e bloom automaticamente.
- Exportar build estática (`npm run build`) que abre num servidor simples, para poder apresentar sem internet.

---

## 4. Interface

- **Barra inferior:** ◀ Anterior | indicador «Cena X de 11» | Seguinte ▶ | ⟲ Repetir animação | 🐢 Câmara lenta (0,25×) | Ver analogia.
- **Teclado:** setas ←/→, espaço = pausa/continua, R = repetir.
- **Painel lateral recolhível «Notas conceituais»** com o texto da secção 6 da cena actual.
- **Painel «Quem faz o quê»** (sempre acessível): lista dos actores, e o actor activo na cena fica destacado em 3D (contorno luminoso) e na lista.
- **Legenda de cores** fixa no canto superior direito.
- **Alternador ⬇ Downstream / ⬆ Upstream** nas cenas onde os dois sentidos fazem sentido.
- **Câmara:** transições suaves entre cenas (GSAP); o utilizador pode rodar/zoom com o rato, e um botão «Repor vista» volta ao enquadramento da cena.

---

## 5. Guião das cenas

Para cada cena: **o que se vê**, **animação**, **legenda** (no ecrã) e **actor activo**.

### Cena 0 — A rede numa vista
- **Vê-se:** vista aérea: central com OLT → fibra → splitter → 4 casas.
- **Animação:** câmara desce lentamente da vista aérea até à OLT. Cada componente acende quando é nomeado.
- **Legenda:** «Uma só fibra sai da central e é dividida para várias casas. Vamos ver como é que todas a partilham sem confusão.»

### Cena 1 — Três problemas
- **Vê-se:** três cartões flutuantes sobre a cena, um por problema (OMCI, T-CONT, GEM port), com um «?» cada.
- **Animação:** cada cartão aparece apontando para o sítio do problema (OLT↔ONT; fibra a subir; interior da ONT).
- **Legenda:** «Controlar a ONT à distância. Partilhar a fibra a subir. Separar tipos de tráfego.»

### Cena 2 — Downstream: a OLT fala para todos
- **Vê-se:** impulsos azul-ciano saem da OLT, passam no splitter e chegam a **todas** as ONT.
- **Animação:** cada pacote leva uma etiqueta com o identificador da GEM port de destino e um **cadeado** (tráfego cifrado). Cada ONT verifica a etiqueta: aceita o seu (pacote entra, LED pisca verde) e descarta os outros (pacote desfaz-se em partículas).
- **Legenda:** «A descer, a OLT envia tudo para todos. Cada ONT só fica com o que é seu, e o tráfego vai cifrado.»
- **Actor activo:** OLT, depois ONT.

### Cena 3 — Upstream: o problema da colisão
- **Vê-se:** as 4 ONT tentam enviar ao mesmo tempo (impulsos âmbar).
- **Animação:** os impulsos encontram-se no splitter e **colidem** (clarão vermelho, ruído, ícone ⚠). Pausa de 1 s. Texto: «Sem regras, ninguém se entende.»
- **Depois:** a mesma cena com **TDMA**: uma linha do tempo horizontal sobre a fibra mostra janelas coloridas; cada ONT só envia na sua janela; os impulsos chegam à OLT em fila, sem colisões.
- **Legenda:** «A subir, todos partilham a mesma fibra. Por isso cada ONT só fala quando a OLT lhe dá vez.»
- **Actor activo:** ONT (problema) → OLT (solução).

### Cena 4 — OMCI: o comando à distância
- **Vê-se:** um técnico (silhueta simples) ao lado da OLT, com um portátil. Dentro da fibra, um canal **roxo** separado do tráfego do cliente.
- **Animação, em 4 passos (um por clique):**
  1. **Configurar:** pacote roxo vai da OLT à ONT; dentro da ONT «constroem-se» os T-CONT e as GEM ports (peças a encaixar).
  2. **Monitorizar:** a ONT devolve um pacote roxo com um mini-gráfico (potência óptica, contadores, erros).
  3. **Alarmes:** a casa perde energia; a ONT envia um último sinal **dying gasp** (ícone de bateria a apagar) e a OLT mostra o alarme.
  4. **Actualizar software:** barra de progresso a encher-se na ONT.
- **Legenda:** «O técnico nunca vai a casa do cliente configurar a ONT. Configura na OLT, e a OLT envia tudo pelo OMCI.»
- **Actor activo:** OLT → OMCI → ONT.

### Cena 5 — T-CONT: a autorização para falar a subir
- **Vê-se:** dentro de cada ONT, um contentor laranja com etiqueta «Alloc-ID».
- **Animação:**
  1. A OLT envia, numa trama descendente, um **«mapa de banda»** (pergaminho/ecrã) que lista as janelas de cada Alloc-ID.
  2. Cada ONT lê o mapa e envia só nas janelas do seu T-CONT.
  3. **DBA em acção:** uma ONT começa a ter muito tráfego (fila de pacotes a crescer); o DBA (engrenagem na OLT) alarga a janela dessa ONT no mapa seguinte e encurta outra que está quieta.
- **Sub-vista «Tipos de T-CONT»:** 5 faixas de autoestrada lado a lado:
  - Tipo 1 — faixa fixa, sempre reservada (voz)
  - Tipo 2 — garantida (vídeo)
  - Tipo 3 — garantida + extra não garantido (Internet com mínimo)
  - Tipo 4 — melhor esforço (Internet residencial básica)
  - Tipo 5 — combinação
  Mostrar, para cada uma, a largura mínima (sólida) e a máxima possível (tracejada).
- **Legenda:** «O T-CONT decide quanto e quando a ONT pode enviar. O DBA ajusta isso em tempo real.»
- **Actor activo:** OLT (DBA) → ONT (T-CONT).

### Cena 6 — GEM port: um canal para cada tipo de tráfego
- **Vê-se:** a ONT em corte (meio transparente). No interior, três compartimentos: azul (Internet), verde (Voz), vermelho (IPTV).
- **Animação:**
  1. Do router chega um pacote com etiqueta **VLAN 100**; a ONT encaminha-o para a **GEM 2** (compartimento azul).
  2. As GEM ports estão **dentro** do contentor T-CONT: a GEM sai pelas janelas desse T-CONT.
  3. Em downstream (alternador), a ONT reconhece os pacotes pelo identificador da GEM.
- **Legenda:** «A GEM port separa que tráfego é qual dentro da ONT. A VLAN 100 vai para a GEM 2.»
- **Actor activo:** router → ONT.

### Cena 7 — O perfil de linha: o manual de carga
- **Vê-se:** à esquerda, um painel de código; à direita, a ONT em 3D.
- **Animação sincronizada:** cada linha do código acende e, ao mesmo tempo, a peça correspondente aparece em 3D:

```
dba-profile add profile-id 10 type3 assure 10240 max 102400
ont-lineprofile gpon profile-id 100
 tcont 1 dba-profile-id 10
 gem add 2 eth tcont 1
 gem mapping 2 0 vlan 100
 commit
```

| Linha | O que aparece em 3D |
|---|---|
| `dba-profile … type3 assure 10240 max 102400` | Faixa de estrada: 10 Mbit/s sólidos, até 100 Mbit/s tracejados |
| `tcont 1 dba-profile-id 10` | Contentor laranja T-CONT 1 com essa faixa |
| `gem add 2 eth tcont 1` | Compartimento azul GEM 2 dentro do T-CONT 1 |
| `gem mapping 2 0 vlan 100` | Etiqueta VLAN 100 ligada por uma seta à GEM 2 |
| `commit` | Carimbo «Gravado» no perfil |

- **Depois:** o perfil (um «livro») é copiado para várias ONT de uma vez → mostra que é reutilizável.
- **Aviso visível no ecrã:** «Valores ilustrativos. O perfil real confirma-se com `display ont-lineprofile gpon profile-id 100`.»
- **Nota técnica (painel):** na Huawei, o número `gemport 2` do `service-port` é o **índice** da GEM no perfil de linha; o identificador físico da GEM port na fibra é atribuído pela OLT.

### Cena 8 — Dos comandos à rede, de ponta a ponta
- **Vê-se:** dois comandos no topo do ecrã:
  - `ont add … omci ont-lineprofile-id 100 …`
  - `service-port … gemport 2 … user-vlan 100 …` (tradução para VLAN interna 2000 e externa 1410)
  *(Se o utilizador fornecer os comandos completos, substitui as reticências pelos valores reais.)*
- **Animação de um pacote do portátil até à rede:**
  1. `ont add`: o pacote roxo do OMCI cria na **ONT 7** o T-CONT e a GEM 2 do perfil 100.
  2. Portátil → router: o router envia com **VLAN 100**.
  3. ONT: o pacote entra na **GEM 2** e espera pela janela do **T-CONT** (relógio a contar).
  4. Fibra a subir (âmbar) até à OLT.
  5. OLT, `service-port`: a etiqueta **100** é trocada por **2000** (interna) e é colada uma segunda etiqueta **1410** (externa). Mostrar as duas etiquetas empilhadas.
  6. O pacote sai da OLT para a rede de transporte.
- **Legenda:** «Os dois comandos ligam tudo: o primeiro prepara a ONT, o segundo diz à OLT o que fazer com o tráfego que chega.»

### Cena 9 — A analogia completa
- **Vê-se:** a mesma rede transformada numa estrada partilhada com semáforo:
  - **OMCI** = o rádio com que a central dá instruções ao condutor;
  - **T-CONT** = a autorização de passagem: quando pode avançar e a que velocidade;
  - **GEM ports** = os compartimentos etiquetados dentro do camião (Internet num, voz noutro);
  - **Perfil de linha** = o manual de carga, igual para todos os camiões do mesmo tipo.
- **Animação:** cada elemento da rede transforma-se (morph/fade) no seu equivalente da analogia, com a etiqueta a ligar os dois.

### Cena 10 — Resumo: quem faz o quê + teste rápido
- **Tabela final:**

| Actor | Downstream | Upstream |
|---|---|---|
| OLT | Envia para todos, cifra, envia o mapa de banda | Recebe em fila, DBA ajusta janelas, traduz VLAN (`service-port`) |
| Splitter | Divide a luz para todas as casas | Junta a luz de todas as ONT (passivo, sem energia) |
| ONT | Filtra pela GEM port, descarta o resto | Põe cada serviço na sua GEM, envia nas janelas do T-CONT |
| OMCI | Configura, monitoriza, actualiza a ONT | Traz alarmes e contadores para a OLT |
| Router | Entrega ao dispositivo | Marca o tráfego com a VLAN 100 |

- **Teste rápido (5 perguntas de escolha múltipla)** com feedback e explicação curta. Exemplos:
  1. Porque é que as ONT não podem transmitir todas ao mesmo tempo a subir?
  2. Onde é que o técnico configura a ONT?
  3. O que decide quanto e quando a ONT pode enviar?
  4. Para que GEM port vai a VLAN 100 no nosso exemplo?
  5. O que contém um perfil de linha?

---

## 6. Notas conceituais (texto do painel lateral, por cena)

Usa estes textos, adaptando apenas para caber. Não acrescentes afirmações técnicas que não estejam aqui ou na secção 7.

- **OMCI** — ONU Management and Control Interface, norma ITU-T G.988. Canal de gestão entre a OLT e cada ONT, por dentro da própria fibra, numa GEM port reservada só para ele. Serve para configurar (T-CONT, GEM ports, VLAN, portas Ethernet), monitorizar (potência óptica, contadores, erros), receber alarmes (dying gasp, perda de sinal, porta em baixo) e actualizar o software da ONT.
- **Downstream** — a OLT envia tudo para todas as ONT do splitter, em difusão. Cada ONT fica só com o que é seu. O tráfego de cada ONT é cifrado.
- **Upstream** — todas as ONT partilham a mesma fibra. Cada ONT só transmite quando a OLT lhe dá vez, em janelas de tempo (TDMA).
- **T-CONT** — Transmission Container: unidade a que a OLT atribui banda a subir, identificada por um Alloc-ID. Em cada trama descendente, a OLT envia o mapa de banda; o DBA ajusta as janelas em tempo real. Na Huawei, tipo e banda definem-se num `dba-profile`, para o qual o T-CONT do perfil de linha aponta.
- **GEM port** — GPON Encapsulation Method: canal lógico com identificador próprio, normalmente um por serviço. A subir, cada GEM pertence a um T-CONT; a descer, a ONT reconhece as tramas pelas suas GEM ports. O perfil de linha define que VLAN vai para que GEM.
- **Perfil de linha** — `ont-lineprofile`: modelo reutilizável definido uma vez na OLT e aplicado a muitas ONT, com os T-CONT, o perfil DBA de cada um, as GEM ports e o mapeamento VLAN → GEM.

---

## 7. Rigor técnico (verificar antes de entregar)

- Comprimentos de onda GPON: **1490 nm a descer**, **1310 nm a subir** (o vídeo RF a 1550 nm não é tema desta apresentação; não o mostrar).
- Débitos nominais GPON: **2,488 Gbit/s a descer**, **1,244 Gbit/s a subir** (só no painel de notas, não nas legendas).
- O splitter é **passivo**: não decide nada, não tem energia. Nunca o animar como se «escolhesse» o destino.
- A descer, as ONT recebem **tudo** e filtram; não é o splitter que encaminha.
- A colisão na cena 3 é didáctica (o que *aconteceria* sem TDMA).
- Todos os valores do perfil 100 e do DBA 10 são **ilustrativos** e têm de estar assinalados como tal.
- Não inventes IDs, VLAN ou nomes de equipamentos além dos que aparecem neste documento.

---

## 8. Fluxo de trabalho — método WAT

### W — Workflow (passos, por ordem)
1. **Planear:** cria `PLANO.md` com a estrutura de pastas, a lista de cenas e o modelo de dados de cada cena (`id`, `título`, `legenda`, `analogia`, `nota`, `actorAtivo`, `câmara`, `timeline`). Mostra-me o plano e espera pelo meu OK.
2. **Esqueleto:** projecto Vite, cena 3D base (luz, ambiente, câmara, chão), interface e navegação entre cenas vazias.
3. **Modelos:** OLT, fibra, splitter, ONT, casas, router, dispositivos. Tira capturas de ecrã e revê o realismo antes de avançar.
4. **Cenas 0 a 3** (rede, problemas, downstream, upstream). Pára e mostra-me o resultado.
5. **Cenas 4 a 7** (OMCI, T-CONT, GEM, perfil de linha).
6. **Cenas 8 a 10** (ponta a ponta, analogia, resumo e teste).
7. **Polimento:** desempenho, responsividade, acessibilidade (contraste, tamanho de letra ≥ 18 px no projector).
8. **Verificação final** (ver critérios na secção 9) e `npm run build`.

### A — Agents (papéis)
Usa subagentes só nos passos de revisão:
- **Revisor técnico GPON:** compara cada cena com as secções 6 e 7 e lista qualquer erro ou afirmação não suportada.
- **Revisor didáctico (o «leigo»):** percorre a apresentação como alguém que nunca ouviu falar de GPON e aponta onde ficou confuso, onde há texto a mais ou cores incoerentes.
Corrige o que eles apontarem antes de dar o passo por concluído.

### T — Tools
- `three`, `gsap`, `postprocessing` (ou `three/examples/jsm/postprocessing`), `vite`.
- **Playwright** (headless) para abrir cada cena, tirar captura de ecrã e verificar que não há erros na consola.
- Todos os conteúdos de texto num único ficheiro `src/content/cenas.pt.json`, para eu poder editar sem tocar no código.

---

## 9. Critérios de aceitação

- [ ] As 11 cenas existem e correm sem erros na consola.
- [ ] Cada cena tem: animação, legenda (≤ 2 linhas), analogia, nota conceitual e actor activo destacado.
- [ ] As cores seguem a secção 2 em **todas** as cenas.
- [ ] Downstream e upstream são claramente distinguíveis (cor, direcção, rótulo).
- [ ] A colisão (cena 3) e o DBA (cena 5) percebem-se sem ler o texto.
- [ ] O código do perfil de linha (cena 7) está sincronizado com as peças 3D.
- [ ] Os valores ilustrativos estão assinalados.
- [ ] Funciona a 60 fps num portátil comum e em ecrã 16:9.
- [ ] `npm run build` gera uma versão que funciona sem internet.
- [ ] `README.md` em português com: como instalar, como apresentar, atalhos de teclado e como editar os textos.

## 10. Entregáveis

- Projecto completo no repositório, com workflow de publicação no GitHub Pages a funcionar.
- Link do GitHub Pages da versão final.
- `PLANO.md`, `README.md`, `src/content/cenas.pt.json`.
- Pasta `capturas/` com uma imagem por cena.
- Pasta `dist/` pronta a apresentar.
