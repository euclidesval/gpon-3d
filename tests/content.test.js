import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import conteudo from '../src/content/cenas.pt.json';
import { CORES } from '../src/core/colors.js';

const CAMPOS = ['id', 'titulo', 'legenda', 'analogia', 'nota', 'actorAtivo', 'camara', 'passos'];
// Uma legenda de ecrã com no máximo 2 linhas (≈ 85 caracteres por linha no projector).
const MAX_LEGENDA = 170;

describe('cenas.pt.json', () => {
  it('tem as 11 cenas, por ordem', () => {
    expect(conteudo.cenas).toHaveLength(11);
    conteudo.cenas.forEach((c, i) => expect(c.id.startsWith(`s${String(i).padStart(2, '0')}-`)).toBe(true));
  });

  it.each(conteudo.cenas.map((c) => [c.id, c]))('%s tem todos os campos obrigatórios', (_id, c) => {
    for (const campo of CAMPOS) expect(c[campo], campo).toBeTruthy();
    expect(c.legenda.length).toBeLessThanOrEqual(MAX_LEGENDA);
    expect(c.analogia.length).toBeLessThanOrEqual(MAX_LEGENDA);
    expect(Array.isArray(c.nota) && c.nota.length > 0).toBe(true);
    expect(c.passos.length).toBeGreaterThan(0);
    expect(c.camara.posicao).toHaveLength(3);
    expect(c.camara.alvo).toHaveLength(3);
  });

  it('os actores activos existem na lista de actores', () => {
    const ids = new Set(conteudo.actores.map((a) => a.id));
    for (const c of conteudo.cenas) {
      for (const a of c.actorAtivo) expect(ids.has(a), `${c.id}: ${a}`).toBe(true);
      for (const p of c.passos) expect(ids.has(p.actor), `${c.id}/${p.id}: ${p.actor}`).toBe(true);
    }
  });

  it('não menciona o vídeo RF a 1550 nm (fora do tema)', () => {
    expect(JSON.stringify(conteudo)).not.toMatch(/1550/);
  });

  it('usa 1490 nm a descer e 1310 nm a subir', () => {
    const texto = JSON.stringify(conteudo);
    expect(texto).toMatch(/1490 nm a descer/);
    expect(texto).toMatch(/1310 nm a subir/);
  });

  it('assinala os valores ilustrativos nas cenas 7 e 8', () => {
    for (const id of ['s07-perfil', 's08-ponta-a-ponta']) {
      const c = conteudo.cenas.find((x) => x.id === id);
      expect(c.avisos.join(' ')).toMatch(/ilustrativos/i);
    }
  });

  it('o teste rápido tem 5 perguntas válidas', () => {
    expect(conteudo.quiz).toHaveLength(5);
    for (const q of conteudo.quiz) {
      expect(q.opcoes.length).toBeGreaterThanOrEqual(2);
      expect(q.certa).toBeGreaterThanOrEqual(0);
      expect(q.certa).toBeLessThan(q.opcoes.length);
      expect(q.explicacao).toBeTruthy();
    }
  });
});

describe('cores fixas', () => {
  it('as variáveis CSS coincidem com colors.js', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/main.css'), 'utf8');
    const mapa = { '--down': 'down', '--up': 'up', '--omci': 'omci', '--gem-internet': 'gemInternet', '--gem-voz': 'gemVoz', '--gem-iptv': 'gemIptv', '--tcont': 'tcont', '--vlan': 'vlan' };
    for (const [v, k] of Object.entries(mapa)) {
      const m = css.match(new RegExp(`${v}:\\s*(#[0-9a-fA-F]{6})`));
      expect(m?.[1].toLowerCase(), v).toBe(CORES[k].toLowerCase());
    }
  });
});
