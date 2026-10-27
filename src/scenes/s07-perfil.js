import * as THREE from 'three';
import gsap from 'gsap';
import { CORES } from '../core/colors.js';
import { criarPacote } from './util.js';
import { viajar } from '../models/pulse.js';
import { criarAmpliacao, mostrarAmpliacao, criarTcont, criarGem, etiquetaVlan, encaixar } from './interior.js';
import { escapar } from '../ui/texto.js';

// Cena 7 — O perfil de linha: código à esquerda, peças em 3D à direita, sincronizados linha a linha.
// Depois, o perfil é reutilizado: a OLT aplica-o a várias ONT pelo OMCI.
const K = 3;
let E = null;

export default {
  id: 's07-perfil',
  montar(ctx) {
    const { rede } = ctx;
    const casa = rede.casas[K];
    const ont = rede.onts[K];
    rede.rotulos.casas.forEach((r) => (r.visible = true));
    const dados = ctx.dados;
    // Painel de código
    const html = `<div class="titulo-codigo">OLT · configuração (valores ilustrativos)</div>${dados.codigo
      .map((l, i) => `<span class="linha" data-i="${i}">${escapar(l.linha)}<small>→ ${escapar(l.peca)}</small></span>`)
      .join('')}`;
    const painel = ctx.sobreposicao(html, 'painel-codigo');

    const amp = criarAmpliacao(ctx, ont, new THREE.Vector3(casa.position.x - 0.9, 2.35, casa.position.z + 0.9), {
      largura: 3.0,
      altura: 2.0,
      profundidade: 1.2,
      titulo: 'Perfil de linha 100 → ONT 7',
    });

    // Faixa do dba-profile 10: 10 Mbit/s garantidos (sólido), até 100 Mbit/s (tracejado)
    const faixa = new THREE.Group();
    faixa.position.set(0, -0.86, 0);
    amp.add(faixa);
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.9), new THREE.MeshStandardMaterial({ color: '#1b1e22', roughness: 0.9 }));
    piso.rotation.x = -Math.PI / 2;
    const solido = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.9), new THREE.MeshStandardMaterial({ color: CORES.tcont, emissive: CORES.tcont, emissiveIntensity: 0.4 }));
    solido.rotation.x = -Math.PI / 2;
    solido.position.set(-1.3 + 0.13, 0.01, 0);
    faixa.add(piso, solido);
    const matTraco = new THREE.MeshStandardMaterial({ color: CORES.tcont, emissive: CORES.tcont, emissiveIntensity: 0.6 });
    for (let k = 0; k < 12; k++) {
      for (const z of [-0.45, 0.45]) {
        const tr = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.04), matTraco);
        tr.position.set(-1.3 + (2.6 / 12) * (k + 0.5), 0.02, z);
        faixa.add(tr);
      }
    }
    const rFaixa = ctx.rotulo('<b>dba-profile 10 · tipo 3</b><span>▮ 10 Mbit/s garantidos · ┅ até 100 Mbit/s</span>', new THREE.Vector3(0, -0.05, 0.6), { pai: faixa, visivel: true });
    rFaixa.center.set(0.5, 0);
    faixa.visible = false;

    const tcont = criarTcont(ctx, { numero: 1, largura: 1.5, altura: 1.05, profundidade: 0.7, pai: amp });
    tcont.position.set(0.4, -0.3, 0);
    tcont.visible = false;
    const gem = criarGem(ctx, CORES.gemInternet, 'GEM 2', { largura: 0.9, altura: 0.48, profundidade: 0.4, pai: tcont });
    gem.position.set(0, -0.15, 0);
    gem.visible = false;

    // Etiqueta VLAN 100 ligada por uma seta à GEM 2
    const suporte = new THREE.Object3D();
    suporte.position.set(-1.0, 0.25, 0.2);
    amp.add(suporte);
    const vlan = etiquetaVlan(ctx, 100, suporte, new THREE.Vector3(0, 0, 0), { visivel: false });
    const seta = new THREE.ArrowHelper(new THREE.Vector3(1, -0.55, 0).normalize(), new THREE.Vector3(-0.85, 0.12, 0.2), 0.95, 0xffffff, 0.16, 0.1);
    seta.visible = false;
    amp.add(seta);

    const carimbo = ctx.rotulo('<div class="carimbo">GRAVADO</div>', new THREE.Vector3(0.9, 0.55, 0.6), { pai: amp, classe: '' });
    carimbo.center.set(0.5, 0.5);

    E = { painel, amp, faixa, tcont, gem, vlan, seta, carimbo, ont, casa };
  },
  passo(ctx, i) {
    const tl = gsap.timeline({ paused: true });
    const linhas = E.painel ? [...E.painel.querySelectorAll('.linha')] : [];
    const nLinhas = ctx.dados.codigo.length;
    tl.call(() => linhas.forEach((l, k) => {
      l.classList.toggle('feita', k < i || i >= nLinhas);
      l.classList.toggle('activa', k === i);
    }), null, 0);
    const cam = ctx.dados.camara;
    if (i < nLinhas) tl.add(ctx.tweenCamara(cam.posicao, cam.alvo, i === 0 ? 1.4 : 0.6), 0);
    switch (i) {
      case 0: // dba-profile
        tl.call(ctx.destacarEm(['dba']), null, 0.2);
        tl.add(mostrarAmpliacao(E.amp), 0.4);
        tl.set(E.faixa, { visible: true }, 1.0);
        tl.from(E.faixa.scale, { x: 0.01, duration: 0.8, ease: 'power2.out' }, 1.0);
        break;
      case 1: // ont-lineprofile 100: o «livro» (moldura) acende
        tl.call(ctx.destacarEm(['olt']), null, 0.1);
        tl.fromTo(E.amp.userData.rotulo.element, { opacity: 0.3 }, { opacity: 1, duration: 0.3, repeat: 3, yoyo: true }, 0.2);
        tl.to(E.amp.scale, { x: 1.06, y: 1.06, z: 1.06, duration: 0.25, yoyo: true, repeat: 1 }, 0.2);
        break;
      case 2: // tcont 1 dba-profile-id 10
        tl.add(encaixar(E.tcont, { de: 0.6 }), 0.3);
        break;
      case 3: // gem add 2 eth tcont 1
        tl.add(encaixar(E.gem, { de: 0.5 }), 0.3);
        break;
      case 4: // gem mapping 2 0 vlan 100
        tl.set(E.vlan, { visible: true }, 0.3);
        tl.fromTo(E.vlan.element, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.3);
        tl.set(E.seta, { visible: true }, 0.8);
        tl.from(E.seta.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.5 }, 0.8);
        tl.to(E.gem.material, { emissiveIntensity: 1.4, duration: 0.25, yoyo: true, repeat: 3 }, 1.2);
        break;
      case 5: // commit
        tl.set(E.carimbo, { visible: true }, 0.3);
        tl.fromTo(E.carimbo.element.firstChild, { opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, 0.3);
        break;
      default: // reutilizar: a OLT aplica o mesmo perfil a várias ONT (pelo OMCI)
        reutilizar(ctx, tl);
    }
    tl.to({}, { duration: 0.8 });
    return tl;
  },
};

function reutilizar(ctx, tl) {
  const { rede } = ctx;
  const C = rede.curvas;
  tl.add(ctx.tweenCamara([10, 17, 36], [8, 1.5, -1], 1.6), 0);
  tl.call(ctx.destacarEm(['omci']), null, 0.4);
  const pac = criarPacote(ctx, CORES.omci, '📘 perfil 100', { classe: 'rotulo-pacote omci' });
  tl.add(viajar(pac, C.alimentacao, { de: 0, ate: 1, duracao: 2.2 }), 1.2);
  tl.set(pac, { visible: false }, 3.4);
  C.derivacoes.forEach((curva, k) => {
    const copia = criarPacote(ctx, CORES.omci, null, { classe: 'rotulo-pacote omci' });
    tl.add(viajar(copia, curva, { de: 0, ate: 1, duracao: 1.4 }), 3.4);
    tl.set(copia, { visible: false }, 4.8);
    const casa = rede.casas[k];
    const selo = ctx.rotulo('<b>📘 perfil 100</b><span>aplicado</span>', casa.position.clone().add(new THREE.Vector3(1.4, 5.6, -1)), {});
    selo.element.style.borderColor = '#a855f7';
    tl.set(selo, { visible: true }, 4.8 + k * 0.1);
    tl.fromTo(selo.element, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 4.8 + k * 0.1);
  });
  tl.call(ctx.destacarEm(['ont']), null, 4.8);
}
