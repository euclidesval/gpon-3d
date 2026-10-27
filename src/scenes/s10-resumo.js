import gsap from 'gsap';
import { montarQuiz, tabelaResumo } from '../ui/quiz.js';

// Cena 10 — Resumo: quem faz o quê (a descer e a subir) + teste rápido de 5 perguntas.
const ACTORES = ['olt', 'splitter', 'ont', 'omci', 'router'];

export default {
  id: 's10-resumo',
  passo(ctx, i) {
    const tl = gsap.timeline({ paused: true });
    const cam = ctx.dados.camara;
    const C = ctx.conteudo;
    tl.add(ctx.tweenCamara(cam.posicao, cam.alvo, 1.6), 0);
    if (i === 0) {
      const el = ctx.sobreposicao(`<h2>Quem faz o quê</h2>${tabelaResumo(C.resumo, C.siglas)}`, 'cartao-resumo interactiva');
      const linhas = el ? [...el.querySelectorAll('tbody tr')] : [];
      C.resumo.forEach((_, k) => {
        const t = 0.6 + k * 1.2;
        tl.call(() => {
          linhas.forEach((l, m) => l.classList.toggle('activa', m === k));
          ctx.destacar([ACTORES[k]]);
        }, null, t);
      });
      tl.call(() => {
        linhas.forEach((l) => l.classList.remove('activa'));
        ctx.destacar([]);
      }, null, 0.6 + C.resumo.length * 1.2);
    } else {
      // A tabela do passo anterior sai: o teste fica sozinho no ecrã
      ctx.ui?.limparCena?.();
      const el = ctx.sobreposicao('<h2>Teste rápido</h2><div class="quiz"></div>', 'cartao-resumo cartao-quiz interactiva');
      if (el) montarQuiz(el.querySelector('.quiz'), C.quiz, C.siglas);
      tl.call(ctx.destacarEm([]), null, 0.2);
    }
    tl.to({}, { duration: 0.6 });
    return tl;
  },
};
