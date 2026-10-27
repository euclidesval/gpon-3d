import { formatar, escapar } from './texto.js';

// Teste rápido (cena 10): uma pergunta de cada vez, feedback e explicação, pontuação final.
export function montarQuiz(el, perguntas, siglas = {}) {
  let i = 0;
  let certas = 0;
  let respondida = false;
  let falhadas = [];

  const desenhar = () => {
    if (i >= perguntas.length) {
      el.innerHTML = `
        <div class="quiz-fim">
          <div class="quiz-pontos">${certas} / ${perguntas.length}</div>
          <p>${certas === perguntas.length ? 'Excelente! Percebeste tudo.' : `${certas >= 3 ? 'Muito bem!' : 'Volta a ver as cenas e tenta outra vez.'} Falhaste: ${falhadas.map((n) => `pergunta ${n}`).join(', ')} (a explicação indica a cena).`}</p>
          <button class="quiz-repetir">⟲ Repetir o teste</button>
        </div>`;
      el.querySelector('.quiz-repetir').addEventListener('click', () => {
        i = 0;
        certas = 0;
        falhadas = [];
        desenhar();
      });
      return;
    }
    const q = perguntas[i];
    respondida = false;
    el.innerHTML = `
      <div class="quiz-cabecalho">Pergunta ${i + 1} de ${perguntas.length}</div>
      <p class="quiz-pergunta">${formatar(q.pergunta, siglas)}</p>
      <div class="quiz-opcoes">${q.opcoes.map((o, k) => `<button class="quiz-opcao" data-k="${k}">${String.fromCharCode(65 + k)}. ${formatar(o, siglas)}</button>`).join('')}</div>
      <div class="quiz-feedback" hidden></div>`;
    el.querySelectorAll('.quiz-opcao').forEach((b) => b.addEventListener('click', () => responder(Number(b.dataset.k))));
  };

  const responder = (k) => {
    if (respondida) return;
    respondida = true;
    const q = perguntas[i];
    const acertou = k === q.certa;
    if (acertou) certas++;
    else falhadas.push(i + 1);
    el.querySelectorAll('.quiz-opcao').forEach((b) => {
      const n = Number(b.dataset.k);
      b.disabled = true;
      b.classList.toggle('certa', n === q.certa);
      b.classList.toggle('errada', n === k && !acertou);
    });
    const fb = el.querySelector('.quiz-feedback');
    fb.hidden = false;
    fb.innerHTML = `<b>${acertou ? '✓ Certo!' : '✕ Não é bem assim.'}</b> ${formatar(q.explicacao, siglas)}
      <button class="quiz-seguinte">${i + 1 < perguntas.length ? 'Pergunta seguinte →' : 'Ver resultado →'}</button>`;
    fb.querySelector('.quiz-seguinte').addEventListener('click', () => {
      i++;
      desenhar();
    });
  };

  desenhar();
  return {
    responder,
    get pontos() {
      return certas;
    },
    get indice() {
      return i;
    },
    seguinte() {
      i++;
      desenhar();
    },
  };
}

// Cor do nome de cada actor (só o OMCI tem cor fixa própria)
const COR_ACTOR = { OMCI: '#c084fc' };

export function tabelaResumo(linhas, siglas = {}) {
  return `<table class="tabela-resumo">
    <thead><tr><th>Actor</th><th><span class="seta-down">⬇</span> Downstream</th><th><span class="seta-up">⬆</span> Upstream</th></tr></thead>
    <tbody>${linhas
      .map((l, k) => `<tr data-linha="${k}"><th style="color:${COR_ACTOR[l.actor] ?? 'inherit'}">${formatar(l.actor, siglas)}</th><td>${formatar(l.downstream, siglas)}</td><td>${formatar(l.upstream, siglas)}</td></tr>`)
      .join('')}</tbody></table>`;
}

export { escapar };
