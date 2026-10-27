import * as THREE from 'three';
import gsap from 'gsap';
import { CORES } from '../core/colors.js';
import { tuboLinha } from './util.js';
import { criarTcont, criarGem, curvaAteONT } from './interior.js';
import { criarCamiao, criarSemaforo, criarTorreRadio } from '../models/camiao.js';

// Cena 9 — A analogia completa: cada elemento da rede transforma-se no seu equivalente na estrada.
// OMCI → rádio; T-CONT → autorização de passagem (semáforo); GEM ports → compartimentos do camião;
// perfil de linha → manual de carga, igual para todos os camiões do mesmo tipo.
const K = 3;
let E = null;

function ligacao(ctx, tecnico, analogia, pos) {
  const r = ctx.rotulo(`<b>${tecnico}</b><span class="seta-analogia">⟷</span><b>${analogia}</b>`, pos, { classe: 'rotulo rotulo-analogia' });
  E.ligacoes.push(r);
  return r;
}

function aparecer(tl, obj, t, d = 0.6) {
  tl.set(obj, { visible: true }, t);
  tl.fromTo(obj.scale, { x: 0.01, y: 0.01, z: 0.01 }, { x: 1, y: 1, z: 1, duration: d, ease: 'back.out(1.6)', immediateRender: false }, t);
}

function desaparecer(tl, obj, t, d = 0.5) {
  tl.to(obj.scale, { x: 0.01, y: 0.01, z: 0.01, duration: d, ease: 'power2.in' }, t);
  tl.set(obj, { visible: false }, t + d);
}

function mostrarRotulo(tl, r, t) {
  tl.set(r, { visible: true }, t);
  tl.fromTo(r.element, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, t);
}

export default {
  id: 's09-analogia',
  montar(ctx) {
    const { rede } = ctx;
    rede.rotulos.casas.forEach((r) => (r.visible = true));
    // Um camião por casa, na estrada à frente (o da ONT 7 é o do exemplo)
    const camioes = rede.casas.map((casa, k) => {
      const c = criarCamiao();
      c.position.set(casa.position.x + 0.8, 0, 6.4);
      c.visible = k === K;
      ctx.adicionar(c);
      return c;
    });
    const torre = criarTorreRadio();
    torre.position.set(-14, 0, 2.2);
    torre.visible = false;
    ctx.adicionar(torre);
    const semaforo = criarSemaforo();
    semaforo.position.set(rede.casas[K].position.x - 2.6, 0, 5.0);
    semaforo.visible = false;
    ctx.adicionar(semaforo);
    // Elementos da rede que se transformam
    const omci = tuboLinha(curvaAteONT(rede, K, { desvioY: 0.1 }), CORES.omci, { raio: 0.07, tracejado: true, traco: 0.5, espaco: 0.25, emissivo: 2.2 });
    omci.visible = false;
    ctx.adicionar(omci, { brilho: true });
    const tcont = criarTcont(ctx, { numero: 1, largura: 1.4, altura: 0.9, profundidade: 0.8 });
    tcont.position.set(semaforo.position.x, 1.2, 5.0);
    tcont.visible = false;
    const gems = [CORES.gemInternet, CORES.gemVoz, CORES.gemIptv].map((cor, i) => {
      const g = criarGem(ctx, cor, ['Internet', 'Voz', 'IPTV'][i], { largura: 0.62, altura: 0.5, profundidade: 0.55 });
      g.visible = false;
      return g;
    });
    E = { camioes, torre, semaforo, omci, tcont, gems, cam: camioes[K], ligacoes: [] };
  },
  passo(ctx, i) {
    const tl = gsap.timeline({ paused: true });
    // Só a ligação do passo actual fica visível (as anteriores estão nas notas)
    E.ligacoes.forEach((r) => tl.set(r, { visible: false }, 0));
    [radio, autorizacao, compartimentos, manual][i](ctx, tl);
    tl.to({}, { duration: 1.0 });
    return tl;
  },
};

// 1) OMCI → rádio
function radio(ctx, tl) {
  const cam = ctx.dados.camara;
  tl.add(ctx.tweenCamara(cam.posicao, cam.alvo, 1.4), 0);
  tl.call(ctx.destacarEm(['omci']), null, 0.3);
  tl.set(E.omci, { visible: true }, 0.5);
  tl.fromTo(E.omci.userData.material, { opacity: 0 }, { opacity: 1, duration: 0.5, immediateRender: false }, 0.5);
  // O canal roxo desvanece e aparece o rádio: ondas da torre da central até ao camião
  E.omci.userData.material.transparent = true;
  tl.to(E.omci.userData.material, { opacity: 0.15, duration: 0.8 }, 2.2);
  aparecer(tl, E.torre, 2.2, 0.8);
  const origem = E.torre.position.clone().add(E.torre.userData.topo);
  const destino = E.cam.localToWorld(E.cam.userData.topoAntena.clone());
  for (let k = 0; k < 6; k++) {
    const onda = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 8, 32), new THREE.MeshStandardMaterial({ color: CORES.omci, emissive: CORES.omci, emissiveIntensity: 2, transparent: true }));
    onda.visible = false;
    onda.userData.semContorno = true;
    ctx.adicionar(onda, { brilho: true });
    const t = 3.2 + k * 0.45;
    tl.set(onda, { visible: true }, t);
    tl.fromTo(onda.position, { x: origem.x, y: origem.y, z: origem.z }, { x: destino.x, y: destino.y + 0.6, z: destino.z, duration: 2.4, ease: 'none', immediateRender: false }, t);
    tl.fromTo(onda.scale, { x: 0.4, y: 0.4, z: 0.4 }, { x: 1.6, y: 1.6, z: 1.6, duration: 2.4, immediateRender: false }, t);
    tl.set(onda, { visible: false }, t + 2.4);
  }
  mostrarRotulo(tl, ligacao(ctx, 'OMCI', 'rádio da central', origem.clone().add(new THREE.Vector3(5, 1.2, 0))), 3.4);
}

// 2) T-CONT → autorização de passagem (semáforo: quando avançar e a que velocidade)
function autorizacao(ctx, tl) {
  const cam = E.cam.position;
  tl.add(ctx.tweenCamara([cam.x - 2, 4.6, cam.z + 9], [cam.x - 1.8, 1.2, cam.z - 1.2], 1.4), 0);
  tl.call(ctx.destacarEm(['dba']), null, 0.3);
  aparecer(tl, E.tcont, 0.8);
  // O contentor do T-CONT transforma-se no semáforo
  desaparecer(tl, E.tcont, 2.4);
  aparecer(tl, E.semaforo, 2.6);
  mostrarRotulo(tl, ligacao(ctx, 'T-CONT', 'autorização de passagem', E.semaforo.position.clone().add(new THREE.Vector3(0, 3.6, 0))), 2.8);
  const L = E.semaforo.userData.luzes;
  tl.to(L.vermelho.material, { emissiveIntensity: 0.05, duration: 0.2 }, 4.4);
  tl.to(L.verde.material, { emissiveIntensity: 3, duration: 0.2 }, 4.4);
  // Com luz verde, o camião avança na sua vez
  tl.to(E.cam.position, { x: E.cam.position.x - 3.2, duration: 1.8, ease: 'power1.inOut' }, 4.7);
  tl.to(E.cam.position, { x: E.cam.position.x, duration: 0.01 }, 6.9);
  tl.to(L.verde.material, { emissiveIntensity: 0.05, duration: 0.2 }, 6.8);
  tl.to(L.vermelho.material, { emissiveIntensity: 2.5, duration: 0.2 }, 6.8);
}

// 3) GEM ports → compartimentos etiquetados dentro do camião
function compartimentos(ctx, tl) {
  const pos = E.cam.position;
  tl.add(ctx.tweenCamara([pos.x + 0.4, 3.4, pos.z + 6.5], [pos.x + 0.2, 1.1, pos.z], 1.2), 0);
  tl.call(ctx.destacarEm(['ont']), null, 0.3);
  // A porta lateral fica translúcida para se ver a carga
  tl.to(E.cam.userData.porta.material, { opacity: 0.12, duration: 0.6 }, 0.6);
  E.gems.forEach((g, k) => {
    const destino = E.cam.localToWorld(E.cam.userData.compartimentos[k].clone());
    const inicio = destino.clone().add(new THREE.Vector3(0, 2.6, 0.6));
    const t = 1.2 + k * 0.6;
    tl.set(g, { visible: true }, t);
    tl.fromTo(g.position, { x: inicio.x, y: inicio.y, z: inicio.z }, { x: destino.x, y: destino.y, z: destino.z, duration: 1.0, ease: 'bounce.out', immediateRender: false }, t);
  });
  mostrarRotulo(tl, ligacao(ctx, 'GEM ports', 'compartimentos do camião', pos.clone().add(new THREE.Vector3(0.2, 2.6, 0.8))), 3.4);
}

// 4) Perfil de linha → manual de carga, igual para todos os camiões do mesmo tipo
function manual(ctx, tl) {
  tl.add(ctx.tweenCamara([19, 14, 33], [19.5, 1, 3], 1.6), 0);
  tl.call(ctx.destacarEm(['olt']), null, 0.3);
  E.camioes.forEach((c, k) => {
    if (k !== K) aparecer(tl, c, 0.8 + k * 0.2);
    const livro = ctx.rotulo('<b>📘 manual</b><span>perfil 100</span>', c.position.clone().add(new THREE.Vector3(0.2, 2.5, 0)), { classe: 'rotulo rotulo-manual' });
    tl.set(livro, { visible: true }, 2.2 + k * 0.25);
    tl.fromTo(livro.element, { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, 2.2 + k * 0.25);
  });
  mostrarRotulo(tl, ligacao(ctx, 'Perfil de linha', 'manual de carga', new THREE.Vector3(20, 6.2, 6.4)), 3.4);
}
