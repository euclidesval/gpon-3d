import { describe, it, expect, vi, afterEach } from 'vitest';
import gsap from 'gsap';
import { Apresentacao, ligarTeclado } from '../src/app/apresentacao.js';

function montar(nPassos = [1, 3, 1]) {
  const chamadas = [];
  const cenas = nPassos.map((_, i) => ({
    id: `c${i}`,
    passo(ctx, p) {
      chamadas.push([i, p]);
      return gsap.timeline({ paused: true }).to({}, { duration: 0.1 });
    },
  }));
  const conteudo = {
    cenas: nPassos.map((n, i) => ({
      id: `c${i}`,
      titulo: `Cena ${i}`,
      sentidos: i === 1 ? ['down', 'up'] : [],
      camara: { posicao: [0, 1, 2], alvo: [0, 0, 0] },
      passos: Array.from({ length: n }, (_, k) => ({ id: `p${k}`, actor: 'olt' })),
    })),
  };
  const ctx = { limpar: vi.fn(), camaraPara: vi.fn(), destacar: vi.fn() };
  const app = new Apresentacao({ cenas, conteudo, ctx });
  return { app, ctx, chamadas };
}

afterEach(() => {
  gsap.globalTimeline.paused(false);
  gsap.globalTimeline.timeScale(1);
});

describe('navegação', () => {
  it('começa na cena indicada e avança pelos passos antes de mudar de cena', () => {
    const { app } = montar();
    app.irPara(0);
    expect(app.indice).toBe(0);
    app.seguinte();
    expect([app.indice, app.passoAtual]).toEqual([1, 0]);
    app.seguinte();
    app.seguinte();
    expect([app.indice, app.passoAtual]).toEqual([1, 2]);
    app.seguinte();
    expect([app.indice, app.passoAtual]).toEqual([2, 0]);
  });

  it('não passa dos limites', () => {
    const { app } = montar();
    app.irPara(0);
    app.anterior();
    expect(app.indice).toBe(0);
    app.irPara(99);
    expect(app.indice).toBe(2);
    app.seguinte();
    expect(app.indice).toBe(2);
  });

  it('recuar volta ao passo anterior da mesma cena', () => {
    const { app } = montar();
    app.irPara(1, 2);
    app.anterior();
    expect([app.indice, app.passoAtual]).toEqual([1, 1]);
  });

  it('ao saltar para um passo, executa os anteriores (estado coerente)', () => {
    const { app, chamadas } = montar();
    app.irPara(1, 2);
    expect(chamadas).toEqual([
      [1, 0],
      [1, 1],
      [1, 2],
    ]);
  });

  it('limpa a cena e move a câmara ao mudar de cena', () => {
    const { app, ctx } = montar();
    app.irPara(0);
    app.irPara(1);
    expect(ctx.limpar).toHaveBeenCalled();
    expect(ctx.camaraPara).toHaveBeenCalledTimes(2);
  });

  it('repetir volta a tocar o passo actual', () => {
    const { app, chamadas } = montar();
    app.irPara(2);
    app.repetir();
    expect(chamadas.filter(([c]) => c === 2)).toHaveLength(2);
  });

  it('câmara lenta e pausa actuam na linha temporal global', () => {
    const { app } = montar();
    app.irPara(0);
    app.alternarLento();
    expect(gsap.globalTimeline.timeScale()).toBe(0.25);
    app.alternarLento();
    expect(gsap.globalTimeline.timeScale()).toBe(1);
    app.alternarPausa();
    expect(gsap.globalTimeline.paused()).toBe(true);
    app.alternarPausa();
    expect(gsap.globalTimeline.paused()).toBe(false);
  });

  it('o alternador de sentido só funciona nas cenas com os dois sentidos', () => {
    const { app } = montar();
    app.irPara(0);
    app.definirSentido('up');
    expect(app.sentido).toBe(null);
    app.irPara(1);
    expect(app.sentido).toBe('down');
    app.definirSentido('up');
    expect(app.sentido).toBe('up');
  });
});

describe('teclado', () => {
  it('setas, espaço e R', () => {
    const { app } = montar();
    app.irPara(0);
    const desligar = ligarTeclado(app, window);
    const tecla = (key) => window.dispatchEvent(new KeyboardEvent('keydown', { key }));
    tecla('ArrowRight');
    expect(app.indice).toBe(1);
    tecla('ArrowLeft');
    expect(app.indice).toBe(0);
    tecla(' ');
    expect(app.pausado).toBe(true);
    tecla(' ');
    expect(app.pausado).toBe(false);
    const repetir = vi.spyOn(app, 'repetir');
    tecla('r');
    expect(repetir).toHaveBeenCalled();
    desligar();
  });
});
