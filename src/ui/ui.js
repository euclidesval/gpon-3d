import { LEGENDA } from '../core/colors.js';
import { formatar, escapar } from './texto.js';

// Interface HTML sobreposta ao canvas.
export class Interface {
  constructor(raiz, conteudo) {
    this.raiz = raiz;
    this.conteudo = conteudo;
    this.siglas = conteudo.siglas;
    this.app = null;
    this.#montar();
  }

  ligar(app) {
    this.app = app;
    const $ = (s) => this.raiz.querySelector(s);
    $('[data-accao=anterior]').addEventListener('click', () => app.anterior());
    $('[data-accao=seguinte]').addEventListener('click', () => app.seguinte());
    $('[data-accao=repetir]').addEventListener('click', () => app.repetir());
    $('[data-accao=lento]').addEventListener('click', () => app.alternarLento());
    $('[data-accao=pausa]').addEventListener('click', () => app.alternarPausa());
    $('[data-accao=analogia]').addEventListener('click', () => app.alternarAnalogia());
    $('[data-accao=vista]').addEventListener('click', () => app.reporVista());
    this.raiz.querySelectorAll('[data-sentido]').forEach((b) => b.addEventListener('click', () => app.definirSentido(b.dataset.sentido)));
  }

  #montar() {
    const c = this.conteudo;
    this.raiz.innerHTML = `
      <header class="cabecalho">
        <div class="cabecalho-num" data-ref="num"></div>
        <h1 data-ref="titulo"></h1>
        <div class="passo-chip" data-ref="passo" hidden></div>
      </header>

      <section class="legenda-cores" aria-label="Legenda de cores">
        <ul>${LEGENDA.map((l) => `<li><i class="amostra amostra-${l.forma}" style="--cor:${l.cor}"></i><span>${formatar(l.texto, this.siglas)}</span></li>`).join('')}</ul>
      </section>

      <aside class="painel painel-actores" data-ref="actores" aria-label="Quem faz o quê">
        <button class="painel-titulo" data-alternar="actores" aria-expanded="false">👥 Quem faz o quê</button>
        <ul class="lista-actores">
          ${c.actores
            .map(
              (a) => `<li data-actor="${a.id}"><b>${formatar(a.nome, this.siglas)}</b><span>${formatar(a.papel, this.siglas)}</span></li>`,
            )
            .join('')}
        </ul>
      </aside>

      <aside class="painel painel-notas" data-ref="notas" aria-label="Notas conceituais">
        <button class="painel-titulo" data-alternar="notas" aria-expanded="false">📘 Notas conceituais</button>
        <div class="notas-corpo" data-ref="notasCorpo"></div>
      </aside>

      <div class="faixa" data-ref="faixa" role="status" aria-live="polite"></div>
      <div class="sobreposicoes" data-ref="sobreposicoes"></div>
      <div class="aviso" data-ref="aviso" hidden></div>

      <div class="ferramentas">
        <div class="sentido" data-ref="sentido" role="group" aria-label="Sentido do tráfego" hidden>
          <button data-sentido="down" class="sentido-down">⬇ Downstream</button>
          <button data-sentido="up" class="sentido-up">⬆ Upstream</button>
        </div>
        <button class="botao-vista" data-accao="vista" title="Voltar ao enquadramento da cena">🎯 Repor vista</button>
      </div>

      <div class="legenda-ecra" data-ref="legenda" aria-live="polite">
        <span class="legenda-icone" data-ref="legendaIcone" aria-hidden="true"></span>
        <p data-ref="legendaTexto"></p>
      </div>

      <nav class="barra" aria-label="Navegação">
        <button data-accao="anterior" title="Anterior (←)">◀ <span>Anterior</span></button>
        <div class="indicador" data-ref="indicador"></div>
        <button data-accao="seguinte" class="principal" title="Seguinte (→)"><span>Seguinte</span> ▶</button>
        <span class="separador"></span>
        <button data-accao="repetir" title="Repetir animação (R)">⟲ <span>Repetir</span></button>
        <button data-accao="pausa" title="Pausa / continua (espaço)" aria-pressed="false">⏸ <span>Pausa</span></button>
        <button data-accao="lento" title="Câmara lenta (0,25×)" aria-pressed="false">🐢 <span>0,25×</span></button>
        <button data-accao="analogia" title="Trocar a legenda técnica pela analogia da estrada" aria-pressed="false">🚚 <span>Ver analogia</span></button>
      </nav>

      <div class="tooltip" data-ref="tooltip" role="tooltip" hidden></div>
    `;
    this.ref = {};
    this.raiz.querySelectorAll('[data-ref]').forEach((el) => (this.ref[el.dataset.ref] = el));
    this.raiz.querySelectorAll('[data-alternar]').forEach((b) =>
      b.addEventListener('click', () => {
        const painel = this.ref[b.dataset.alternar];
        const aberto = painel.classList.toggle('aberto');
        b.setAttribute('aria-expanded', String(aberto));
      }),
    );
    this.#tooltips();
  }

  #tooltips() {
    const tip = this.ref.tooltip;
    const mostrar = (el) => {
      const s = el.dataset.sigla;
      const txt = this.siglas[s];
      if (!txt) return;
      tip.innerHTML = `<b>${escapar(s)}</b> — ${escapar(txt)}`;
      tip.hidden = false;
      const r = el.getBoundingClientRect();
      const w = tip.offsetWidth;
      const x = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2));
      const acima = r.top > tip.offsetHeight + 16;
      tip.style.left = `${x}px`;
      tip.style.top = `${acima ? r.top - tip.offsetHeight - 10 : r.bottom + 10}px`;
      this.tipAtual = el;
    };
    const esconder = () => {
      tip.hidden = true;
      this.tipAtual = null;
    };
    this.raiz.addEventListener('pointerover', (e) => {
      const el = e.target.closest?.('.sigla');
      if (el && e.pointerType !== 'touch') mostrar(el);
    });
    this.raiz.addEventListener('pointerout', (e) => {
      if (e.target.closest?.('.sigla') && e.pointerType !== 'touch') esconder();
    });
    this.raiz.addEventListener('focusin', (e) => e.target.classList?.contains('sigla') && mostrar(e.target));
    this.raiz.addEventListener('focusout', (e) => e.target.classList?.contains('sigla') && esconder());
    // Toque: tocar abre/fecha.
    this.raiz.addEventListener('click', (e) => {
      const el = e.target.closest?.('.sigla');
      if (el) {
        e.preventDefault();
        if (this.tipAtual === el) esconder();
        else mostrar(el);
      } else if (this.tipAtual) esconder();
    });
  }

  atualizar(e) {
    const d = e.dados;
    const r = this.ref;
    r.num.textContent = this.conteudo.titulo;
    r.titulo.innerHTML = formatar(d.passos?.[e.passo]?.titulo ?? d.titulo, this.siglas);
    r.indicador.innerHTML = `Cena <b>${e.indice + 1}</b> de ${e.total}` + (e.nPassos > 1 ? ` <small>· passo ${e.passo + 1}/${e.nPassos}</small>` : '');
    const passo = d.passos?.[e.passo];
    r.passo.hidden = !(passo && e.nPassos > 1);
    if (passo) r.passo.innerHTML = formatar(passo.rotulo, this.siglas);
    const legenda = d.passos?.[e.passo]?.legenda ?? d.legenda;
    r.legendaTexto.innerHTML = formatar(e.analogia ? d.analogia : legenda, this.siglas);
    r.legenda.classList.toggle('modo-analogia', e.analogia);
    r.legendaIcone.textContent = e.analogia ? '🚚' : '';
    r.notasCorpo.innerHTML = (d.nota ?? []).map((p) => `<p>${formatar(p, this.siglas)}</p>`).join('');
    r.aviso.hidden = !(d.avisos && d.avisos.length);
    r.aviso.innerHTML = (d.avisos ?? []).map((a) => `⚠ ${formatar(a, this.siglas)}`).join('<br>');
    const temDois = (d.sentidos ?? []).length > 1;
    r.sentido.hidden = !temDois;
    r.sentido.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sentido === e.sentido)));
    const $ = (s) => this.raiz.querySelector(s);
    $('[data-accao=anterior]').disabled = e.indice === 0 && e.passo === 0;
    $('[data-accao=seguinte]').disabled = e.indice === e.total - 1 && e.passo === e.nPassos - 1;
    $('[data-accao=seguinte]').classList.remove('pronto');
    $('[data-accao=lento]').setAttribute('aria-pressed', String(e.lento));
    $('[data-accao=pausa]').setAttribute('aria-pressed', String(e.pausado));
    $('[data-accao=pausa]').innerHTML = e.pausado ? '▶ <span>Continuar</span>' : '⏸ <span>Pausa</span>';
    $('[data-accao=analogia]').setAttribute('aria-pressed', String(e.analogia));
    $('[data-accao=analogia]').querySelector('span').textContent = e.analogia ? 'Ver técnica' : 'Ver analogia';
    document.title = `${e.indice + 1}/${e.total} · ${d.titulo} — GPON 3D`;
  }

  fimDoPasso() {
    this.raiz.querySelector('[data-accao=seguinte]')?.classList.add('pronto');
  }

  destacarActores(ids) {
    this.raiz.querySelectorAll('[data-actor]').forEach((li) => li.classList.toggle('ativo', ids.includes(li.dataset.actor)));
  }

  faixa(texto, tipo = '') {
    const f = this.ref.faixa;
    if (!texto) {
      f.classList.remove('visivel');
      return;
    }
    f.className = `faixa visivel ${tipo}`;
    // «<br>» separa a frase principal de uma segunda linha mais pequena
    const [principal, segunda] = texto.split('<br>');
    f.innerHTML = formatar(principal, this.siglas) + (segunda ? `<small>${formatar(segunda.replace(/<\/?small>/g, ''), this.siglas)}</small>` : '');
  }

  sobreposicao(html, classe = '') {
    const el = document.createElement('div');
    el.className = `sobreposicao ${classe}`;
    el.innerHTML = html;
    this.ref.sobreposicoes.appendChild(el);
    return el;
  }

  limparCena() {
    this.ref.sobreposicoes.innerHTML = '';
    this.faixa('');
  }
}
