import * as THREE from 'three';
import gsap from 'gsap';
import { CORES } from '../core/colors.js';
import { criarPacote, marca, rebentar } from './util.js';
import { viajar, criarImpulso } from '../models/pulse.js';
import { vistaCorte } from '../models/ont.js';
import { criarAmpliacao, montarInteriorONT, etiquetaVlan, curvaCabo } from './interior.js';

// Cena 6 — GEM port: um canal para cada tipo de tráfego (ONT 7 em corte).
// Passos: 1) VLAN 100 → GEM 2; 2) a GEM 2 está dentro do T-CONT 1 e sai pelas janelas dele;
// 3) a descer, a ONT reconhece as tramas pelo identificador da GEM.
// Dentro de casa os pacotes têm a cor do serviço; na fibra, a cor do sentido.
const K = 3;
let E = null;

export default {
  id: 's06-gem',
  montar(ctx) {
    const { rede } = ctx;
    const ont = rede.onts[K];
    const casa = rede.casas[K];
    vistaCorte(ont, true);
    const amp = criarAmpliacao(ctx, ont, new THREE.Vector3(casa.position.x - 1.1, 2.35, casa.position.z + 0.6));
    const interior = montarInteriorONT(ctx, amp);
    amp.visible = true;
    amp.userData.linhas.visible = true;
    interior.tconts.forEach((t) => (t.visible = true));
    interior.gems.forEach((g) => (g.visible = true));
    rede.rotulos.casas[K].visible = true;
    const p = (o) => o.getWorldPosition(new THREE.Vector3());
    E = {
      ont,
      casa,
      amp,
      interior,
      cabo: curvaCabo(casa),
      pPortatil: p(casa.userData.portatil).add(new THREE.Vector3(0, 0.35, 0)),
      pRouter: p(casa.userData.router).add(new THREE.Vector3(0.2, 0.15, -0.08)),
      pOnt: p(ont),
      pGem: interior.gems.map((g) => p(g)),
      pTcont: p(interior.tconts[0]),
    };
  },
  passo(ctx, i) {
    if (i === 2 || ctx.sentido === 'down') return descer(ctx);
    return i === 0 ? vlanParaGem(ctx) : sairPeloTcont(ctx);
  },
};

function mover(obj, de, para, duracao, ease = 'power1.inOut') {
  const tl = gsap.timeline();
  tl.set(obj, { visible: true });
  tl.fromTo(obj.position, { x: de.x, y: de.y, z: de.z }, { x: para.x, y: para.y, z: para.z, duration: duracao, ease });
  return tl;
}

function pacoteServico(ctx, cor, etiqueta = null) {
  const pac = criarPacote(ctx, cor, etiqueta, { raio: 0.09, comprimento: 0.22, classe: 'rotulo-pacote' });
  pac.rotation.z = Math.PI / 2;
  return pac;
}

function vlanParaGem(ctx) {
  const tl = gsap.timeline({ paused: true });
  const cam = ctx.dados.camara;
  tl.add(ctx.tweenCamara(cam.posicao, cam.alvo, 1.2), 0);
  tl.call(ctx.destacarEm(['router']), null, 0.3);
  const pac = pacoteServico(ctx, CORES.gemInternet);
  const vlan = etiquetaVlan(ctx, 100, pac, new THREE.Vector3(0, 0.22, 0), { visivel: false });
  // Portátil → router (Wi-Fi)
  tl.add(mover(pac, E.pPortatil, E.pRouter, 1.4), 0.8);
  // O router marca o tráfego com a VLAN 100
  tl.set(vlan, { visible: true }, 2.2);
  tl.fromTo(vlan.element, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 2.2);
  tl.add(marca(ctx, '🏷 VLAN 100', 'sim', E.pRouter.clone().add(new THREE.Vector3(0, 0.6, 0.3)), { duracao: 1.2 }), 2.2);
  // Router → ONT pelo cabo
  tl.add(viajar(pac, E.cabo, { de: 1, ate: 0, duracao: 1.4, alinhar: false }), 3.0);
  tl.call(ctx.destacarEm(['ont']), null, 4.4);
  // ONT → compartimento da GEM 2 (vista ampliada)
  tl.add(mover(pac, E.pOnt, E.pGem[0].clone().add(new THREE.Vector3(0, 0.05, 0.25)), 1.2), 4.5);
  tl.to(E.interior.gems[0].material, { emissiveIntensity: 1.4, duration: 0.25, yoyo: true, repeat: 3 }, 5.7);
  tl.add(marca(ctx, 'VLAN 100 → GEM 2', 'sim', E.pGem[0].clone().add(new THREE.Vector3(-1.6, -0.2, 0.4)), { duracao: 2.4 }), 5.7);
  tl.to({}, { duration: 1.0 });
  E.pacote = pac;
  return tl;
}

function sairPeloTcont(ctx) {
  const tl = gsap.timeline({ paused: true });
  const tc = E.interior.tconts[0];
  const pac = E.pacote;
  tl.call(ctx.destacarEm(['ont']), null, 0.1);
  // O contentor do T-CONT 1 acende: a GEM 2 está lá dentro
  tl.to(tc.userData.faces.material, { opacity: 0.55, duration: 0.3, yoyo: true, repeat: 3 }, 0.3);
  const espera = ctx.rotulo('<div class="cartao-info" style="border-color:#f97316"><b>⏱ À espera da janela do T-CONT 1</b><span class="conta">3</span></div>', E.pTcont.clone().add(new THREE.Vector3(1.5, 0.75, 0.3)), {});
  tl.set(espera, { visible: true }, 0.6);
  for (let s = 2; s >= 0; s--) tl.call(() => (espera.element.querySelector('.conta').textContent = s ? String(s) : 'Janela aberta ✓'), null, 0.6 + (3 - s) * 0.7);
  // Sai pelo topo do contentor, volta à ONT e entra na fibra como luz âmbar (a subir)
  tl.add(mover(pac, E.pGem[0].clone().add(new THREE.Vector3(0, 0.05, 0.25)), E.pTcont.clone().add(new THREE.Vector3(0, 0.75, 0)), 0.6), 2.8);
  tl.add(mover(pac, E.pTcont.clone().add(new THREE.Vector3(0, 0.75, 0)), E.pOnt, 0.8), 3.4);
  tl.set(pac, { visible: false }, 4.2);
  const luz = criarImpulso(CORES.up, { raio: 0.12, comprimento: 0.7 });
  luz.visible = false;
  ctx.adicionar(luz, { brilho: true });
  const curva = ctx.rede.curvas.derivacoes[K];
  tl.add(viajar(luz, curva, { de: 1, ate: 0.55, duracao: 2.0, ease: 'power1.in' }), 4.2);
  tl.set(luz, { visible: false }, 6.2);
  tl.add(ctx.tweenCamara([29.5, 4.2, 9.5], [28.6, 1.2, -1], 1.6), 4.2);
  tl.to({}, { duration: 0.6 });
  return tl;
}

function descer(ctx) {
  const tl = gsap.timeline({ paused: true });
  const cam = ctx.dados.camara;
  tl.add(ctx.tweenCamara(cam.posicao, cam.alvo, 1.0), 0);
  tl.call(ctx.destacarEm(['ont']), null, 0.2);
  const curva = ctx.rede.curvas.derivacoes[K];
  // Tramas que chegam pela fibra, cada uma com o identificador da sua GEM
  const tramas = [
    { gem: 0, texto: 'GEM 2' },
    { gem: 1, texto: 'GEM · Voz' },
    { gem: null, texto: 'GEM de outra ONT' },
    { gem: 2, texto: 'GEM · IPTV' },
  ];
  tramas.forEach((t, k) => {
    const t0 = 0.6 + k * 1.1;
    const luz = criarPacote(ctx, CORES.down, t.texto);
    tl.add(viajar(luz, curva, { de: 0.6, ate: 1, duracao: 1.2 }), t0);
    tl.set(luz, { visible: false }, t0 + 1.2);
    if (t.gem === null) {
      tl.add(rebentar(ctx, CORES.down, E.pOnt, { raio: 0.6 }), t0 + 1.2);
      tl.add(marca(ctx, '✕', 'nao', E.pOnt.clone().add(new THREE.Vector3(0.7, 0.5, 0.3)), { duracao: 0.9 }), t0 + 1.2);
      return;
    }
    const g = E.interior.gems[t.gem];
    const pac = pacoteServico(ctx, g.userData.cor);
    tl.add(mover(pac, E.pOnt, E.pGem[t.gem].clone().add(new THREE.Vector3(0, 0.05, 0.25)), 0.8), t0 + 1.2);
    tl.to(g.material, { emissiveIntensity: 1.4, duration: 0.2, yoyo: true, repeat: 1 }, t0 + 2.0);
    tl.set(pac, { visible: false }, t0 + 2.6);
  });
  // A GEM 2 segue para o router com a VLAN 100 e chega ao portátil
  const pac = pacoteServico(ctx, CORES.gemInternet);
  const vlan = etiquetaVlan(ctx, 100, pac, new THREE.Vector3(0, 0.22, 0));
  const t1 = 5.6;
  tl.call(ctx.destacarEm(['router']), null, t1);
  tl.add(mover(pac, E.pGem[0].clone().add(new THREE.Vector3(0, 0.05, 0.25)), E.pOnt, 0.8), t1);
  tl.add(viajar(pac, E.cabo, { de: 0, ate: 1, duracao: 1.2, alinhar: false }), t1 + 0.8);
  tl.set(vlan, { visible: false }, t1 + 2.0);
  tl.add(mover(pac, E.pRouter, E.pPortatil, 1.2), t1 + 2.0);
  tl.set(pac, { visible: false }, t1 + 3.2);
  tl.add(marca(ctx, '✓', 'sim', E.pPortatil.clone().add(new THREE.Vector3(0, 0.5, 0)), { duracao: 1.2 }), t1 + 3.2);
  tl.to({}, { duration: 0.6 });
  return tl;
}
