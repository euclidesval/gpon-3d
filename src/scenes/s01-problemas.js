import * as THREE from 'three';
import gsap from 'gsap';
import { CORES } from '../core/colors.js';
import { escapar } from '../ui/texto.js';

// Cena 1 — Três problemas: três cartões com «?» apontam para o sítio de cada problema.
const COR_CONCEITO = { omci: CORES.omci, tcont: CORES.tcont, gem: '#9aa3ad' };
const NOME_CONCEITO = { omci: 'OMCI', tcont: 'T-CONT', gem: 'GEM port' };

export default {
  id: 's01-problemas',
  passo(ctx) {
    const { rede } = ctx;
    const tl = gsap.timeline({ paused: true });
    const problemas = ctx.dados.problemas;
    const olt = rede.olt.getWorldPosition(new THREE.Vector3());
    const ont1 = rede.onts[0].getWorldPosition(new THREE.Vector3());
    const ont3 = rede.onts[1].getWorldPosition(new THREE.Vector3());

    // 1) OLT ↔ ONT: tracejado roxo ao longo da própria fibra (o OMCI vai por dentro dela)
    const pts = [
      ...rede.curvas.alimentacao.getSpacedPoints(80),
      ...rede.curvas.derivacoes[0].getSpacedPoints(40).slice(1),
    ].map((p) => p.clone().add(new THREE.Vector3(0, 0.28, 0)));
    const arco = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.BufferGeometry().setFromPoints(arco.getSpacedPoints(300));
    const linha = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: CORES.omci, dashSize: 0.5, gapSize: 0.35, transparent: true, opacity: 0 }));
    linha.computeLineDistances();
    ctx.adicionar(linha);
    const ponto = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshStandardMaterial({ color: CORES.omci, emissive: CORES.omci, emissiveIntensity: 3 }));
    ponto.visible = false;
    ctx.adicionar(ponto, { brilho: true });
    const percurso = { u: 0 };

    // 2) Fibra a subir: setas âmbar sobre a fibra, a apontar para a OLT
    const setas = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 16), new THREE.MeshStandardMaterial({ color: CORES.up, emissive: CORES.up, emissiveIntensity: 1.5, transparent: true, opacity: 0 }));
      s.rotation.z = Math.PI / 2; // aponta para -x (para a OLT)
      s.position.set(-11 + i * 1.6, 0.9, 3.6);
      setas.add(s);
    }
    ctx.adicionar(setas, { brilho: true });

    const posicoes = [
      new THREE.Vector3((olt.x + ont1.x) / 2 + 2, 5.2, 0),
      new THREE.Vector3(-11, 1.3, 3.6),
      ont3.clone().add(new THREE.Vector3(0, 1.0, 0.4)),
    ];
    const actores = [['olt', 'ont'], [rede.fibras.alimentacao, 'ont'], ['ont']];

    problemas.forEach((p, i) => {
      const html = `<div class="interrogacao" style="color:${COR_CONCEITO[p.id]}">?</div><b>${escapar(p.titulo)}</b><small>${escapar(p.onde)}</small>${p.id === 'gem' ? '<div style="font-size:1.3rem;margin-top:0.2rem">🌐 📞 📺</div>' : ''}<span class="conceito" style="border:1px solid ${COR_CONCEITO[p.id]};color:${COR_CONCEITO[p.id]}">${NOME_CONCEITO[p.id]}</span>`;
      const cartao = ctx.rotulo(html, posicoes[i], { classe: 'cartao-problema' });
      cartao.element.style.borderColor = COR_CONCEITO[p.id];
      const t0 = 0.8 + i * 1.8;
      tl.call(ctx.destacarEm(actores[i]), null, t0);
      tl.set(cartao, { visible: true }, t0);
      tl.fromTo(cartao.element, { opacity: 0 }, { opacity: 1, duration: 0.5 }, t0);
      if (i === 0) {
        tl.to(linha.material, { opacity: 0.9, duration: 0.6 }, t0);
        tl.set(ponto, { visible: true }, t0);
        tl.fromTo(percurso, { u: 0 }, { u: 1, duration: 2.4, repeat: 1, yoyo: true, ease: 'power1.inOut', onUpdate: () => arco.getPointAt(percurso.u, ponto.position) }, t0);
      }
      if (i === 1) {
        setas.children.forEach((s, k) => {
          tl.to(s.material, { opacity: 1, duration: 0.3 }, t0 + k * 0.15);
          tl.to(s.position, { x: s.position.x - 1.2, duration: 1.2, repeat: 2, ease: 'none' }, t0 + k * 0.15);
        });
      }
    });
    tl.call(ctx.destacarEm(['olt', 'ont']), null, 6.4);
    tl.to({}, { duration: 0.4 });
    return tl;
  },
};
