import * as THREE from 'three';
import gsap from 'gsap';
import { CORES } from '../core/colors.js';
import { criarPacote, percorrer, ponto, rebentar, marca, piscarLed } from './util.js';
import { viajar } from '../models/pulse.js';

// Cena 2 — Downstream: a OLT envia tudo para todos (difusão). O splitter só divide a luz.
// Cada ONT verifica a etiqueta: aceita o seu (✓, LED pisca) e descarta os outros (partículas).
export default {
  id: 's02-downstream',
  passo(ctx) {
    const { rede } = ctx;
    const tl = gsap.timeline({ paused: true });
    const C = rede.curvas;
    const saidaSplitter = ponto(C.alimentacao, 1);

    // Rótulo do splitter passivo
    const rSplit = ctx.rotulo('<b>Splitter</b><span>só divide a luz</span>', saidaSplitter.clone().add(new THREE.Vector3(0, 1.1, 0)));

    // Rondas: [índice da ONT de destino, duração na alimentação, duração na derivação, início]
    const rondas = [
      [1, 3.0, 2.2, 0.4],
      [3, 1.6, 1.3, 6.4],
      [0, 1.6, 1.3, 7.4],
    ];

    // Número de cada casa sempre visível
    rede.rotulos.casas.forEach((r) => tl.set(r, { visible: true }, 0));

    rondas.forEach(([destino, dA, dD, t0], r) => {
      const n = rede.numerosONT[destino];
      const etiqueta = `🔒 GEM da ONT ${n}`;
      const pac = criarPacote(ctx, CORES.down, etiqueta);
      tl.call(ctx.destacarEm(['olt']), null, t0);
      tl.add(percorrer(pac, [C.alimentacao], [dA]), t0);
      tl.set(pac, { visible: false }, t0 + dA);
      if (r === 0) {
        tl.set(rSplit, { visible: true }, t0 + dA - 0.2);
        tl.fromTo(rSplit.element, { opacity: 0 }, { opacity: 1, duration: 0.3 }, t0 + dA - 0.2);
      }
      // Cópias para todas as saídas (a luz divide-se igualmente)
      C.derivacoes.forEach((curva, i) => {
        // A etiqueta das cópias só aparece depois de se separarem (evita sobreposição)
        const copia = criarPacote(ctx, CORES.down, etiqueta, { rotuloVisivel: false });
        const chegada = t0 + dA + dD;
        tl.set(copia.userData.rotulo, { visible: true }, t0 + dA + dD * 0.45);
        tl.add(viajar(copia, curva, { de: 0, ate: 1, duracao: dD }), t0 + dA);
        const fim = ponto(curva, 1);
        if (i === destino) {
          tl.to(copia.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.35 }, chegada);
          tl.set(copia, { visible: false }, chegada + 0.35);
          tl.call(ctx.destacarEm(['ont']), null, chegada);
          tl.add(piscarLed(rede.onts[i], 'PON', '#33ff77', 3), chegada);
          tl.add(marca(ctx, '✓', 'sim', fim.clone().add(new THREE.Vector3(0, 1.5, 0.3)), { duracao: r === 0 ? 2.2 : 1.2 }), chegada);
        } else {
          tl.set(copia, { visible: false }, chegada);
          tl.add(rebentar(ctx, CORES.down, fim, { raio: 0.9 }), chegada);
          tl.add(marca(ctx, '✕', 'nao', fim.clone().add(new THREE.Vector3(0, 1.5, 0.3)), { duracao: r === 0 ? 2.2 : 1.2 }), chegada);
        }
        // Repor a escala para o caso de repetir
        tl.set(copia.scale, { x: 1, y: 1, z: 1 }, chegada + 0.4);
      });
    });
    tl.to({}, { duration: 0.8 });
    return tl;
  },
};
