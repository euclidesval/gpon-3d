import gsap from 'gsap';

// Cena ainda por construir: mostra a rede e o actor activo, sem animação própria.
export function cenaPorFazer(id) {
  return {
    id,
    porFazer: true,
    passo(ctx, i) {
      const tl = gsap.timeline({ paused: true });
      const passo = ctx.dados.passos?.[i];
      tl.call(ctx.destacarEm(passo?.actor ?? ctx.dados.actorAtivo));
      tl.call(ctx.faixa('Cena em construção'), null, 0.3);
      tl.to({}, { duration: 1 });
      return tl;
    },
  };
}
