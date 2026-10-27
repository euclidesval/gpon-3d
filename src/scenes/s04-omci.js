import * as THREE from 'three';
import gsap from 'gsap';
import { CORES } from '../core/colors.js';
import { criarPacote, marca, tuboLinha } from './util.js';
import { viajar } from '../models/pulse.js';
import { criarTecnico } from '../models/technician.js';
import { criarAmpliacao, mostrarAmpliacao, montarInteriorONT, encaixar, curvaAteONT } from './interior.js';

// Cena 4 — OMCI: o comando à distância. Canal roxo dentro da fibra, entre a OLT e a ONT 7.
// Passos: configurar, monitorizar, alarmes (dying gasp), actualizar software.
const K = 3; // ONT 7
const CAM = {
  olt: [[-14.6, 3.9, 6.6], [-17.4, 1.6, -1]],
  ont: [[31, 3.1, 5.4], [30.6, 2.0, -1.6]],
};

let E = null; // estado partilhado pelos passos (recriado em montar)

export default {
  id: 's04-omci',
  montar(ctx) {
    const { rede } = ctx;
    const curva = curvaAteONT(rede, K);
    // Canal OMCI: fio roxo por dentro da fibra, separado do tráfego do cliente
    // Canal tracejado (fluxo) por cima do núcleo da fibra, com brilho
    const canal = tuboLinha(curvaAteONT(rede, K, { desvioY: 0.1 }), CORES.omci, { raio: 0.07, tracejado: true, traco: 0.5, espaco: 0.25, emissivo: 2.2 });
    ctx.adicionar(canal, { brilho: true });
    const rCanal = ctx.rotulo('<b>Canal OMCI</b><span>dentro da fibra</span>', curva.getPointAt(0.35).add(new THREE.Vector3(0, 0.9, 0)), { visivel: true });

    const tecnico = criarTecnico();
    tecnico.position.set(-16.3, 0.2, 0.7);
    tecnico.rotation.y = -2.5;
    ctx.adicionar(tecnico);
    const rTec = ctx.rotulo('<b>Técnico</b><span>configura na OLT</span>', new THREE.Vector3(-15.2, 2.3, 1.2), { visivel: true });

    const ont = rede.onts[K];
    const casa = rede.casas[K];
    const amp = criarAmpliacao(ctx, ont, new THREE.Vector3(casa.position.x - 1.1, 2.35, casa.position.z + 0.6));
    const interior = montarInteriorONT(ctx, amp);
    ctx.rede.rotulos.casas[K].visible = true;
    E = { curva, canal, rCanal, tecnico, rTec, ont, casa, amp, interior, cartoes: [] };
  },
  passo(ctx, i) {
    return [configurar, monitorizar, alarmes, actualizar][i](ctx);
  },
};

function esconderCartoes(tl) {
  E.cartoes.forEach((c) => tl.set(c, { visible: false }, 0));
}

function configurar(ctx) {
  const tl = gsap.timeline({ paused: true });
  const cam = ctx.dados.camara;
  tl.add(ctx.tweenCamara(...CAM.olt, 1.4), 0);
  tl.call(ctx.destacarEm(['olt']), null, 0.2);
  tl.to(E.tecnico.userData.ecra.material, { emissiveIntensity: 2.2, duration: 0.3, yoyo: true, repeat: 3 }, 0.8);
  const pac = criarPacote(ctx, CORES.omci, '⚙ OMCI · configurar', { classe: 'rotulo-pacote omci' });
  tl.add(ctx.tweenCamara(cam.posicao, cam.alvo, 1.6), 2.4);
  tl.call(ctx.destacarEm(['omci']), null, 2.6);
  tl.add(viajar(pac, E.curva, { de: 0, ate: 1, duracao: 4.2, ease: 'power1.inOut' }), 2.8);
  tl.set(pac, { visible: false }, 7.0);
  tl.add(ctx.tweenCamara(...CAM.ont, 1.6), 6.4);
  tl.call(ctx.destacarEm(['ont']), null, 7.0);
  tl.add(mostrarAmpliacao(E.amp), 7.4);
  E.interior.tconts.forEach((tc, k) => tl.add(encaixar(tc), 8.0 + k * 0.45));
  E.interior.gems.forEach((g, k) => tl.add(encaixar(g, { de: 0.5 }), 9.5 + k * 0.45));
  tl.to({}, { duration: 0.8 });
  return tl;
}

function monitorizar(ctx) {
  const tl = gsap.timeline({ paused: true });
  const cam = ctx.dados.camara;
  esconderCartoes(tl);
  const grafico = `<div class="mini-grafico"><div><i style="height:1.4rem"></i>potência</div><div><i style="height:0.9rem"></i>contadores</div><div><i style="height:0.35rem"></i>erros</div></div>`;
  const pac = criarPacote(ctx, CORES.omci, `<div class="cartao-info"><b>📈 OMCI · relatório</b>${grafico}</div>`, { classe: 'rotulo-pacote-livre' });
  tl.call(ctx.destacarEm(['ont']), null, 0.1);
  tl.add(ctx.tweenCamara(cam.posicao, cam.alvo, 1.4), 0);
  tl.call(ctx.destacarEm(['omci']), null, 1.2);
  tl.add(viajar(pac, E.curva, { de: 1, ate: 0, duracao: 4.2, ease: 'power1.inOut' }), 1.2);
  tl.set(pac, { visible: false }, 5.4);
  const cartao = ctx.rotulo(
    `<div class="cartao-info"><b>ONT 7 · monitorização</b>${grafico}<small>potência óptica · contadores · erros</small></div>`,
    ctx.rede.olt.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0.6, 3.1, 0.6)),
    { classe: '' },
  );
  E.cartoes.push(cartao);
  tl.add(ctx.tweenCamara(...CAM.olt, 1.4), 4.6);
  tl.call(ctx.destacarEm(['olt']), null, 5.4);
  tl.set(cartao, { visible: true }, 5.4);
  tl.fromTo(cartao.element, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 5.4);
  tl.to({}, { duration: 1.2 });
  return tl;
}

function alarmes(ctx) {
  const tl = gsap.timeline({ paused: true });
  const cam = ctx.dados.camara;
  esconderCartoes(tl);
  const { casa, ont } = E;
  // A casa fica sem energia: escurece, LEDs apagam
  const escuro = new THREE.Mesh(
    new THREE.BoxGeometry(5.7, 3.1, 4.8),
    new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0, depthWrite: false }),
  );
  escuro.position.set(casa.position.x, 1.75, casa.position.z);
  escuro.userData.semContorno = true;
  ctx.adicionar(escuro);
  E.escuro = escuro;
  const semEnergia = ctx.rotulo('<b>⚡✕ Sem energia</b>', new THREE.Vector3(casa.position.x + 1.5, 3.6, casa.position.z + 1), {});
  E.semEnergia = semEnergia;
  tl.add(ctx.tweenCamara(...CAM.ont, 1.4), 0);
  tl.call(ctx.destacarEm(['ont']), null, 0.2);
  tl.to(escuro.material, { opacity: 0.6, duration: 0.5 }, 1.5);
  tl.set(semEnergia, { visible: true }, 1.5);
  const leds = [...Object.values(ont.userData.leds), ...casa.userData.router.userData.leds];
  tl.to(leds.map((l) => l.material), { emissiveIntensity: 0, duration: 0.3 }, 1.5);
  // Último sinal: dying gasp
  const pac = criarPacote(ctx, CORES.omci, '🪫 dying gasp', { classe: 'rotulo-pacote omci' });
  tl.add(viajar(pac, E.curva, { de: 1, ate: 0, duracao: 3.6, ease: 'power1.in' }), 2.2);
  tl.add(ctx.tweenCamara(cam.posicao, cam.alvo, 1.4), 2.4);
  tl.call(ctx.destacarEm(['omci']), null, 2.4);
  tl.set(pac, { visible: false }, 5.8);
  tl.add(ctx.tweenCamara(...CAM.olt, 1.2), 5.0);
  const alarme = ctx.rotulo('<div class="cartao-info alarme"><b>⚠ Alarme · ONT 7</b>dying gasp (perda de energia)</div>', ctx.rede.olt.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0.6, 3.1, 0.6)), { classe: '' });
  E.cartoes.push(alarme);
  tl.call(ctx.destacarEm(['olt']), null, 5.8);
  tl.set(alarme, { visible: true }, 5.8);
  tl.fromTo(alarme.element, { opacity: 0 }, { opacity: 1, duration: 0.2, repeat: 3, yoyo: true }, 5.8);
  tl.set(alarme.element, { opacity: 1 }, 6.8);
  tl.to({}, { duration: 1.0 });
  return tl;
}

function actualizar(ctx) {
  const tl = gsap.timeline({ paused: true });
  const cam = ctx.dados.camara;
  esconderCartoes(tl);
  const { casa, ont } = E;
  // Energia reposta
  tl.set(E.escuro.material, { opacity: 0 }, 0);
  tl.set(E.semEnergia, { visible: false }, 0);
  const leds = [ont.userData.leds.PON, ont.userData.leds.LAN, ...casa.userData.router.userData.leds];
  tl.set(leds.map((l) => l.material), { emissiveIntensity: 1.8 }, 0);
  tl.add(ctx.tweenCamara(cam.posicao, cam.alvo, 1.2), 0);
  tl.call(ctx.destacarEm(['omci']), null, 0.3);
  for (let k = 0; k < 5; k++) {
    const pac = criarPacote(ctx, CORES.omci, k === 0 ? '💾 software' : null, { raio: 0.12, comprimento: 0.6, classe: 'rotulo-pacote omci' });
    tl.add(viajar(pac, E.curva, { de: 0, ate: 1, duracao: 3.4, ease: 'none' }), 0.6 + k * 0.45);
    tl.set(pac, { visible: false }, 4.0 + k * 0.45);
  }
  tl.add(ctx.tweenCamara(...CAM.ont, 1.4), 3.6);
  tl.call(ctx.destacarEm(['ont']), null, 4.0);
  const barra = ctx.rotulo('<div class="cartao-info"><b>A actualizar o software…</b><div class="progresso"><i></i></div></div>', ont.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.75, 0.3)), { classe: '' });
  const enchimento = barra.element.querySelector('.progresso i');
  tl.set(barra, { visible: true }, 4.2);
  tl.fromTo(enchimento, { width: '0%' }, { width: '100%', duration: 3.2, ease: 'none' }, 4.4);
  tl.call(() => (barra.element.querySelector('b').textContent = 'Software actualizado ✓'), null, 7.6);
  tl.add(marca(ctx, '✓', 'sim', ont.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0.9, 0.3, 0.3)), { duracao: 1.6 }), 7.6);
  tl.to({}, { duration: 0.6 });
  return tl;
}
