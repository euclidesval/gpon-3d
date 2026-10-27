import { describe, it, expect, beforeAll, vi } from 'vitest';
import * as THREE from 'three';
import gsap from 'gsap';
import conteudo from '../src/content/cenas.pt.json';
import { CENAS } from '../src/scenes/index.js';
import { criarMundo } from '../src/core/mundo.js';
import { criarContexto } from '../src/app/contexto.js';
import { Apresentacao } from '../src/app/apresentacao.js';

// Sem WebGL nem canvas 2D: as cenas têm de montar e animar na mesma (só objectos three.js).
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = () => null;
});

function montarApp() {
  const cena = new THREE.Scene();
  const mundo = criarMundo(cena);
  const camera = new THREE.PerspectiveCamera();
  const ctx = criarContexto({ mundo, camera, conteudo });
  const app = new Apresentacao({ cenas: CENAS, conteudo, ctx });
  return { app, mundo, ctx };
}

describe('cenas', () => {
  it('o registo de cenas coincide com cenas.pt.json', () => {
    expect(CENAS.map((c) => c.id)).toEqual(conteudo.cenas.map((c) => c.id));
  });

  it('a rede tem OLT, splitter e 4 casas com ONT nas saídas 1, 3, 5 e 7', () => {
    const { mundo } = montarApp();
    expect(mundo.rede.onts).toHaveLength(4);
    expect(mundo.rede.numerosONT).toEqual([1, 3, 5, 7]);
    expect(mundo.rede.curvas.derivacoes).toHaveLength(4);
    expect(mundo.rede.splitter.userData.saidas).toHaveLength(8);
  });

  const casos = conteudo.cenas.flatMap((c, i) => c.passos.map((p, k) => [`${c.id} · passo ${k + 1} (${p.id})`, i, k]));
  it.each(casos)('%s carrega e anima sem excepções', (_nome, i, k) => {
    const { app, mundo } = montarApp();
    const erros = vi.spyOn(console, 'error');
    expect(() => {
      app.irPara(i, k);
      app.timeline.progress(1, false);
      for (const s of ['down', 'up']) app.definirSentido(s);
      app.timeline?.progress(1, false);
    }).not.toThrow();
    expect(erros).not.toHaveBeenCalled();
    erros.mockRestore();
    // Ao limpar, não ficam objectos temporários
    app.ctx.limpar();
    expect(mundo.temporario.children).toHaveLength(0);
    gsap.globalTimeline.clear();
  });
});

describe('limpeza', () => {
  it('ao limpar, os rótulos HTML (incluindo os filhos de pacotes) saem do DOM', () => {
    const { app, mundo } = montarApp();
    const camada = document.createElement('div');
    document.body.appendChild(camada);
    app.irPara(2);
    app.timeline.progress(0.5, false);
    // Simula o CSS2DRenderer: põe os elementos no DOM
    mundo.temporario.traverse((o) => o.isCSS2DObject && camada.appendChild(o.element));
    expect(camada.children.length).toBeGreaterThan(0);
    app.ctx.limpar();
    expect(camada.children.length).toBe(0);
  });
});

describe('pacotes', () => {
  // Regressão: os pacotes só se vêem durante a viagem (nada fica «preso» no fim de um passo).
  it.each([
    [2, 0],
    [3, 0],
    [3, 1],
    [4, 1],
    [5, 2],
  ])('cena %i, passo %i: nenhum impulso visível no fim', (cena, passo) => {
    const { app, mundo } = montarApp();
    app.irPara(cena, passo);
    app.timeline.progress(1, false);
    const visiveis = mundo.temporario.children.filter((o) => o.name === 'impulso' && o.visible);
    expect(visiveis).toHaveLength(0);
    gsap.globalTimeline.clear();
  });
});
