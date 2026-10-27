import gsap from 'gsap';

// Controlador da apresentação: navegação entre cenas e passos, repetir, pausa,
// câmara lenta, alternador de sentido e modo analogia. Não depende de WebGL.
//
// Contrato de cada cena (src/scenes/sXX-*.js):
//   id: string                       — igual ao id em cenas.pt.json
//   montar(ctx)                      — cria os objectos da cena (opcional)
//   passo(ctx, i) → gsap.Timeline    — animação do passo i (pausada; tudo dentro da timeline)
//   camaraPropria: boolean           — a cena controla a câmara sozinha (sem transição genérica)
export class Apresentacao {
  constructor({ cenas, conteudo, ctx, ui = null, aoMudar = null }) {
    this.cenas = cenas;
    this.conteudo = conteudo;
    this.ctx = ctx;
    this.ui = ui;
    this.aoMudar = aoMudar;
    this.indice = -1;
    this.passoAtual = 0;
    this.timeline = null;
    this.transicao = null;
    this.analogia = false;
    this.lento = false;
    this.pausado = false;
    this.sentido = null;
    this.terminou = false;
  }

  get total() {
    return this.cenas.length;
  }

  get cena() {
    return this.cenas[this.indice];
  }

  get dados() {
    return this.conteudo.cenas[this.indice];
  }

  get nPassos() {
    return Math.max(1, this.dados?.passos?.length ?? 1);
  }

  irPara(indice, passo = 0, { instantaneo = false } = {}) {
    const i = Math.max(0, Math.min(this.total - 1, indice));
    const mudouCena = i !== this.indice;
    this.indice = i;
    const dados = this.dados;
    if (mudouCena) {
      const sentidos = dados.sentidos ?? [];
      this.sentido = sentidos.length ? sentidos[0] : null;
      this.transicao?.kill();
      this.transicao = null;
      if (!this.cena.camaraPropria && dados.camara) {
        this.transicao = this.ctx.camaraPara(dados.camara.posicao, dados.camara.alvo, instantaneo ? 0 : 1.8);
      }
    }
    this.tocarPasso(Math.max(0, Math.min(this.nPassos - 1, passo)));
  }

  tocarPasso(p, { progresso = null } = {}) {
    this.timeline?.kill();
    this.timeline = null;
    this.passoAtual = p;
    this.terminou = false;
    const ctx = this.ctx;
    ctx.dados = this.dados;
    ctx.sentido = this.sentido;
    ctx.analogia = this.analogia;
    ctx.limpar();
    this.cena.montar?.(ctx);
    // Avança instantaneamente os passos anteriores, para o estado ficar coerente.
    for (let k = 0; k < p; k++) {
      const tl = this.cena.passo(ctx, k);
      if (tl) {
        tl.progress(1, false);
        tl.kill();
      }
    }
    const tl = this.cena.passo(ctx, p) ?? gsap.timeline({ paused: true });
    tl.eventCallback('onComplete', () => {
      this.terminou = true;
      this.ui?.fimDoPasso?.();
    });
    this.timeline = tl;
    if (progresso !== null) {
      tl.progress(progresso, false);
      tl.pause();
    } else {
      tl.play(0);
    }
    this.#notificar();
  }

  seguinte() {
    if (this.passoAtual < this.nPassos - 1) this.tocarPasso(this.passoAtual + 1);
    else if (this.indice < this.total - 1) this.irPara(this.indice + 1);
  }

  anterior() {
    if (this.passoAtual > 0) this.tocarPasso(this.passoAtual - 1);
    else if (this.indice > 0) this.irPara(this.indice - 1);
  }

  repetir() {
    this.tocarPasso(this.passoAtual);
  }

  alternarPausa(forcar = null) {
    this.pausado = forcar ?? !this.pausado;
    gsap.globalTimeline.paused(this.pausado);
    this.#notificar();
  }

  alternarLento(forcar = null) {
    this.lento = forcar ?? !this.lento;
    gsap.globalTimeline.timeScale(this.lento ? 0.25 : 1);
    this.#notificar();
  }

  alternarAnalogia(forcar = null) {
    this.analogia = forcar ?? !this.analogia;
    this.ctx.analogia = this.analogia;
    this.#notificar();
  }

  definirSentido(sentido) {
    if (!this.dados.sentidos?.includes(sentido) || sentido === this.sentido) return;
    this.sentido = sentido;
    this.tocarPasso(this.passoAtual);
  }

  reporVista() {
    const c = this.dados.camara;
    if (c) this.ctx.camaraPara(c.posicao, c.alvo, 1.2);
  }

  estado() {
    return {
      indice: this.indice,
      total: this.total,
      passo: this.passoAtual,
      nPassos: this.nPassos,
      dados: this.dados,
      analogia: this.analogia,
      lento: this.lento,
      pausado: this.pausado,
      sentido: this.sentido,
    };
  }

  #notificar() {
    const e = this.estado();
    this.ui?.atualizar?.(e);
    this.aoMudar?.(e);
  }
}

// Atalhos de teclado: ←/→, espaço (pausa/continua), R (repetir).
export function ligarTeclado(app, alvo = window) {
  const tratar = (ev) => {
    if (ev.target?.closest?.('input, textarea, select, [contenteditable]')) return;
    if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
    switch (ev.key) {
      case 'ArrowRight':
      case 'PageDown':
        ev.preventDefault();
        app.seguinte();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        ev.preventDefault();
        app.anterior();
        break;
      case ' ':
      case 'Spacebar':
        ev.preventDefault();
        app.alternarPausa();
        break;
      case 'r':
      case 'R':
        app.repetir();
        break;
      default:
    }
  };
  alvo.addEventListener('keydown', tratar);
  return () => alvo.removeEventListener('keydown', tratar);
}
