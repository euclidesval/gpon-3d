import gsap from 'gsap';
import { mostrarRotulo, esconderRotulo } from './util.js';

// Cena 0 — A rede numa vista: a câmara desce da vista aérea até à OLT;
// cada componente acende quando é nomeado.
export default {
  id: 's00-rede',
  camaraPropria: true,
  passo(ctx) {
    const { rede } = ctx;
    const R = rede.rotulos;
    const cam = ctx.dados.camara;
    const tl = gsap.timeline({ paused: true });

    tl.add(ctx.tweenCamara([5, 62, 16], [5, 0, -1], 0.01), 0);
    tl.add(ctx.tweenCamara(cam.posicao, cam.alvo, 3.2, 'power2.inOut'), 0.4);

    // Central + OLT
    tl.call(ctx.destacarEm(['olt']), null, 2.4);
    tl.add(mostrarRotulo(R.olt), 2.4);
    // Fibra: a bainha acende
    const bainhas = [rede.fibras.alimentacao, ...rede.fibras.derivacoes].map((f) => f.userData.bainha.material);
    tl.call(ctx.destacarEm([rede.fibras.alimentacao]), null, 3.8);
    tl.call(() => R.olt.element.classList.remove('aceso'), null, 3.8);
    tl.add(mostrarRotulo(R.fibra), 3.8);
    tl.to(bainhas, { opacity: 0.85, duration: 0.5, yoyo: true, repeat: 1 }, 3.8);
    // Splitter
    tl.call(ctx.destacarEm(['splitter']), null, 5.2);
    tl.call(() => R.fibra.element.classList.remove('aceso'), null, 5.2);
    tl.add(mostrarRotulo(R.splitter), 5.2);
    // Casas (ONT)
    tl.call(ctx.destacarEm(['ont']), null, 6.6);
    tl.call(() => R.splitter.element.classList.remove('aceso'), null, 6.6);
    R.casas.forEach((r, i) => tl.add(mostrarRotulo(r), 6.6 + i * 0.2));

    // Desce até à OLT
    tl.call(() => R.casas.forEach((r) => r.element.classList.remove('aceso')), null, 8.6);
    tl.add(ctx.tweenCamara([-15.2, 4.2, 7.5], [-18, 1.7, -1.4], 3.2, 'power2.inOut'), 8.8);
    [R.fibra, R.splitter, ...R.casas].forEach((r) => tl.add(esconderRotulo(r), 9.2));
    tl.call(ctx.destacarEm(['olt']), null, 10.4);
    tl.call(() => R.olt.element.classList.add('aceso'), null, 10.4);
    tl.to({}, { duration: 0.6 });
    return tl;
  },
};
