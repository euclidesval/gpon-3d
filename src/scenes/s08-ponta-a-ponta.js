import * as THREE from 'three';
import gsap from 'gsap';
import { CORES } from '../core/colors.js';
import { criarPacote, marca, tuboLinha } from './util.js';
import { viajar } from '../models/pulse.js';
import { criarTcont, criarGem, encaixar, etiquetaVlan, curvaAteONT, curvaCabo } from './interior.js';
import { escapar } from '../ui/texto.js';

// Cena 8 — Dos comandos à rede, de ponta a ponta (ONT 7, perfil 100, service-port 138).
// 1) ont add: o OMCI cria na ONT 7 o T-CONT 1 e a GEM 2; 2) portátil → router (VLAN 100);
// 3) a GEM 2 espera pela janela do T-CONT 1; 4) sobe a fibra (âmbar); 5) service-port: 100 → 2000 + 1410;
// 6) sai da OLT para a rede de transporte.
const K = 3;
const CAM = {
  casa: [[31.4, 3.0, 5.6], [31.4, 1.3, -1.2]],
  modelo: [[33.6, 2.6, 6.8], [32.6, 0.9, 1.2]],
  olt: [[-14.4, 3.8, 6.4], [-17.6, 2.2, -1.2]],
  saida: [[-13.5, 7.5, 14], [-23, 2.6, -1]],
};
// Partes dos comandos destacadas em cada passo (índices dos passos)
const TOKENS = [
  { cmd: 0, txt: 'ont add 12 7', passos: [0] },
  { cmd: 0, txt: 'omci', passos: [0] },
  { cmd: 0, txt: 'ont-lineprofile-id 100', passos: [0, 2] },
  { cmd: 1, txt: 'vlan 1410', passos: [4] },
  { cmd: 1, txt: 'ont 7', passos: [4] },
  { cmd: 1, txt: 'gemport 2', passos: [2, 4] },
  { cmd: 1, txt: 'user-vlan 100', passos: [1, 4] },
  { cmd: 1, txt: 'translate-and-add', passos: [4] },
  { cmd: 1, txt: 'inner-vlan 2000', passos: [4] },
];

let E = null;

function htmlComandos(comandos) {
  return comandos
    .map((c, i) => {
      let h = escapar(c);
      TOKENS.forEach((t, k) => {
        if (t.cmd !== i) return;
        const alvo = escapar(t.txt);
        const pos = h.indexOf(alvo);
        if (pos >= 0) h = `${h.slice(0, pos)}<mark data-k="${k}">${alvo}</mark>${h.slice(pos + alvo.length)}`;
      });
      return `<div class="comando" data-c="${i}"><span class="prompt">OLT(config)#</span> ${h}</div>`;
    })
    .join('');
}

export default {
  id: 's08-ponta-a-ponta',
  montar(ctx) {
    const { rede } = ctx;
    const casa = rede.casas[K];
    const ont = rede.onts[K];
    rede.rotulos.casas[K].visible = true;
    const painel = ctx.sobreposicao(htmlComandos(ctx.dados.comandos), 'painel-comandos');
    // Modelo da ONT 7 (no relvado): T-CONT 1 com a GEM 2
    const tcont = criarTcont(ctx, { numero: 1, largura: 1.5, altura: 1.0, profundidade: 0.8 });
    tcont.position.set(casa.position.x + 1.7, 0.6, casa.position.z + 2.75);
    tcont.visible = false;
    const gem = criarGem(ctx, CORES.gemInternet, 'GEM 2', { largura: 0.9, altura: 0.45, profundidade: 0.45, pai: tcont });
    gem.position.y = -0.15;
    gem.visible = false;
    const rModelo = ctx.rotulo('<b>ONT 7</b><span>perfil 100</span>', tcont.position.clone().add(new THREE.Vector3(0, 1.45, 0)), {});
    // Ligação da OLT à rede de transporte (cinzento neutro)
    const olt = rede.olt.getWorldPosition(new THREE.Vector3());
    const uplink = new THREE.CatmullRomCurve3([
      olt.clone().add(new THREE.Vector3(0, 2.7, -0.2)),
      olt.clone().add(new THREE.Vector3(0, 3.7, -0.6)),
      olt.clone().add(new THREE.Vector3(-3.0, 3.7, -0.6)),
      olt.clone().add(new THREE.Vector3(-5.5, 3.2, 1.5)),
      olt.clone().add(new THREE.Vector3(-14, 3.2, 3)),
    ]);
    ctx.adicionar(tuboLinha(uplink, '#9aa3ad', { raio: 0.06, emissivo: 0.2 }));
    const rUplink = ctx.rotulo('<b>Rede de transporte</b><span>VLAN 1410</span>', uplink.getPointAt(0.85).add(new THREE.Vector3(0, 0.6, 0)), {});
    const p = (o) => o.getWorldPosition(new THREE.Vector3());
    E = {
      painel,
      tcont,
      gem,
      rModelo,
      uplink,
      rUplink,
      ont,
      casa,
      curvaOmci: curvaAteONT(rede, K),
      cabo: curvaCabo(casa),
      pPortatil: p(casa.userData.portatil).add(new THREE.Vector3(0, 0.35, 0)),
      pRouter: p(casa.userData.router).add(new THREE.Vector3(0.2, 0.15, -0.08)),
      pOnt: p(ont),
      pGem: () => p(gem),
      pOlt: olt.clone().add(new THREE.Vector3(0, 2.0, 0.5)),
    };
  },
  passo(ctx, i) {
    const tl = gsap.timeline({ paused: true });
    // Destaca as partes dos comandos que contam neste passo
    tl.call(() => {
      E.painel?.querySelectorAll('mark').forEach((m) => m.classList.toggle('activa', TOKENS[m.dataset.k].passos.includes(i)));
      E.painel?.querySelectorAll('.comando').forEach((c) => c.classList.toggle('activo', TOKENS.some((t) => t.cmd === Number(c.dataset.c) && t.passos.includes(i))));
    }, null, 0);
    [ontAdd, router, esperaJanela, subir, servicePort, saida][i](ctx, tl);
    tl.to({}, { duration: 0.8 });
    return tl;
  },
};

function ontAdd(ctx, tl) {
  const cam = ctx.dados.camara;
  tl.add(ctx.tweenCamara(cam.posicao, cam.alvo, 1.2), 0);
  tl.call(ctx.destacarEm(['omci']), null, 0.3);
  const pac = criarPacote(ctx, CORES.omci, '⚙ OMCI · perfil 100', { classe: 'rotulo-pacote omci' });
  tl.add(viajar(pac, E.curvaOmci, { de: 0, ate: 1, duracao: 4.0, ease: 'power1.inOut' }), 0.8);
  tl.add(ctx.tweenCamara(...CAM.modelo, 1.4), 4.0);
  tl.call(ctx.destacarEm(['ont']), null, 4.8);
  tl.set(E.rModelo, { visible: true }, 4.8);
  tl.add(encaixar(E.tcont), 5.0);
  tl.add(encaixar(E.gem, { de: 0.5 }), 5.7);
}

function pacoteServico(ctx) {
  const pac = criarPacote(ctx, CORES.gemInternet, null, { raio: 0.1, comprimento: 0.24 });
  pac.rotation.z = Math.PI / 2;
  return pac;
}

function mover(tl, obj, de, para, t, d) {
  tl.set(obj, { visible: true }, t);
  tl.fromTo(obj.position, { x: de.x, y: de.y, z: de.z }, { x: para.x, y: para.y, z: para.z, duration: d, ease: 'power1.inOut', immediateRender: false }, t);
}

function router(ctx, tl) {
  tl.add(ctx.tweenCamara(...CAM.casa, 1.4), 0);
  tl.call(ctx.destacarEm(['router']), null, 0.4);
  const pac = pacoteServico(ctx);
  const vlan = etiquetaVlan(ctx, 100, pac, new THREE.Vector3(0, 0.24, 0), { visivel: false });
  mover(tl, pac, E.pPortatil, E.pRouter, 1.2, 1.4);
  tl.set(vlan, { visible: true }, 2.6);
  tl.add(marca(ctx, '🏷 VLAN 100', 'sim', E.pRouter.clone().add(new THREE.Vector3(0, 0.6, 0.3)), { duracao: 1.6 }), 2.6);
  E.pacote = pac;
  E.vlan = vlan;
}

function esperaJanela(ctx, tl) {
  const pac = E.pacote;
  tl.call(ctx.destacarEm(['ont']), null, 0.2);
  tl.add(viajar(pac, E.cabo, { de: 1, ate: 0, duracao: 1.4, alinhar: false, ficar: true }), 0.3);
  tl.add(ctx.tweenCamara(...CAM.modelo, 1.4), 1.4);
  mover(tl, pac, E.pOnt, E.pGem().add(new THREE.Vector3(0, 0.05, 0.35)), 1.8, 1.4);
  tl.to(E.gem.material, { emissiveIntensity: 1.4, duration: 0.25, yoyo: true, repeat: 3 }, 3.2);
  const relogio = ctx.rotulo('<div class="cartao-info" style="border-color:#f97316"><b>⏱ GEM 2 à espera da janela do T-CONT 1</b><span class="conta">3</span></div>', E.tcont.position.clone().add(new THREE.Vector3(-1.9, 1.0, 0)), {});
  tl.set(relogio, { visible: true }, 3.2);
  for (let s = 2; s >= 0; s--) tl.call(() => (relogio.element.querySelector('.conta').textContent = s ? String(s) : 'Janela aberta ✓'), null, 3.2 + (3 - s) * 0.8);
  E.relogio = relogio;
}

function subir(ctx, tl) {
  const { rede } = ctx;
  const cam = ctx.dados.camara;
  tl.set([E.pacote, E.relogio], { visible: false }, 0);
  tl.add(ctx.tweenCamara(cam.posicao, cam.alvo, 1.4), 0);
  tl.call(ctx.destacarEm(['ont']), null, 0.2);
  // Na fibra é luz âmbar; a etiqueta VLAN 100 vai com ela
  const luz = criarPacote(ctx, CORES.up, null);
  etiquetaVlan(ctx, 100, luz, new THREE.Vector3(0, 0.35, 0));
  tl.add(viajar(luz, rede.curvas.derivacoes[K], { de: 1, ate: 0, duracao: 2.0 }), 0.6);
  tl.call(ctx.destacarEm(['splitter']), null, 2.6);
  tl.add(viajar(luz, rede.curvas.alimentacao, { de: 1, ate: 0, duracao: 3.0 }), 2.6);
  tl.call(ctx.destacarEm(['olt']), null, 5.6);
}

function pilha(html) {
  return `<div class="pilha-vlan">${html}</div>`;
}

function servicePort(ctx, tl) {
  tl.add(ctx.tweenCamara(...CAM.olt, 1.4), 0);
  tl.call(ctx.destacarEm(['olt']), null, 0.2);
  const pac = criarPacote(ctx, CORES.gemInternet, null, { raio: 0.12, comprimento: 0.3 });
  pac.rotation.z = Math.PI / 2;
  pac.position.copy(E.pOlt);
  const tags = ctx.rotulo(pilha('<span class="etiqueta-vlan">VLAN <b>100</b></span>'), new THREE.Vector3(0, 0.3, 0), { pai: pac, classe: '', visivel: true });
  tl.set(pac, { visible: true }, 1.0);
  tl.fromTo(pac.scale, { x: 0.01, y: 0.01, z: 0.01 }, { x: 1, y: 1, z: 1, duration: 0.4, immediateRender: false }, 1.0);
  // 100 → 2000 (interna)
  tl.call(() => (tags.element.innerHTML = pilha('<span class="etiqueta-vlan troca">VLAN <b>2000</b> <small>interna</small></span>')), null, 2.4);
  tl.add(marca(ctx, '100 → 2000', 'sim', E.pOlt.clone().add(new THREE.Vector3(1.6, 0.4, 0)), { duracao: 1.6 }), 2.4);
  // + 1410 (externa), empilhada por cima
  tl.call(
    () => (tags.element.innerHTML = pilha('<span class="etiqueta-vlan externa nova">VLAN <b>1410</b> <small>externa</small></span><span class="etiqueta-vlan">VLAN <b>2000</b> <small>interna</small></span>')),
    null,
    4.0,
  );
  tl.add(marca(ctx, '+ 1410', 'sim', E.pOlt.clone().add(new THREE.Vector3(1.6, 0.9, 0)), { duracao: 1.6 }), 4.0);
  E.pacoteOlt = pac;
}

function saida(ctx, tl) {
  const pac = E.pacoteOlt;
  tl.add(ctx.tweenCamara(...CAM.saida, 1.4), 0);
  tl.call(ctx.destacarEm(['olt']), null, 0.2);
  tl.set(E.rUplink, { visible: true }, 0.4);
  tl.add(viajar(pac, E.uplink, { de: 0, ate: 1, duracao: 3.2, ease: 'power1.in', alinhar: false }), 0.8);
}
