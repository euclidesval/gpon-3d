import { describe, it, expect } from 'vitest';
import { montarQuiz, tabelaResumo } from '../src/ui/quiz.js';
import conteudo from '../src/content/cenas.pt.json';

describe('teste rápido', () => {
  it('conta as respostas certas e mostra o resultado no fim', () => {
    const el = document.createElement('div');
    const q = montarQuiz(el, conteudo.quiz, conteudo.siglas);
    conteudo.quiz.forEach((p, i) => {
      expect(el.querySelector('.quiz-cabecalho').textContent).toContain(`${i + 1} de 5`);
      // acerta nas pares, falha nas ímpares
      const resposta = i % 2 === 0 ? p.certa : (p.certa + 1) % p.opcoes.length;
      el.querySelector(`.quiz-opcao[data-k="${resposta}"]`).click();
      expect(el.querySelector('.quiz-feedback').hidden).toBe(false);
      expect(el.querySelector('.quiz-feedback').textContent).toContain(i % 2 === 0 ? 'Certo' : 'Não é bem assim');
      el.querySelector('.quiz-seguinte').click();
    });
    expect(q.pontos).toBe(3);
    expect(el.querySelector('.quiz-pontos').textContent).toBe('3 / 5');
    el.querySelector('.quiz-repetir').click();
    expect(el.querySelector('.quiz-cabecalho').textContent).toContain('1 de 5');
  });

  it('só aceita uma resposta por pergunta', () => {
    const el = document.createElement('div');
    const q = montarQuiz(el, conteudo.quiz);
    q.responder(conteudo.quiz[0].certa);
    q.responder((conteudo.quiz[0].certa + 1) % 3);
    expect(q.pontos).toBe(1);
  });

  it('a tabela de resumo tem uma linha por actor', () => {
    const div = document.createElement('div');
    div.innerHTML = tabelaResumo(conteudo.resumo, conteudo.siglas);
    expect(div.querySelectorAll('tbody tr')).toHaveLength(5);
  });
});
