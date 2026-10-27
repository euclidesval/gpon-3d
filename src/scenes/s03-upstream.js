import * as THREE from 'three';
import gsap from 'gsap';
import { CORES } from '../core/colors.js';
import { criarPacote, ponto, rebentar, marca, clarao, abanar } from './util.js';
import { viajar } from '../models/pulse.js';

// Cena 3 — Upstream. Passo 0: sem regras, os impulsos das 4 ONT colidem no splitter (didáctico).
// Passo 1: TDMA — cada ONT só envia na sua janela; chegam à OLT em fila.
export default {
  id: 's03-upstream',
  passo(ctx, i) {
    return i === 0 ? colisao(ctx) : tdma(ctx);
  },
};

function colisao(ctx) {
  const { rede, camera } = ctx;
  const C = rede.curvas;
  const tl = gsap.timeline({ paused: true });
  const juncao = ponto(C.alimentacao, 1);
  const cam = ctx.dados.camara;
  tl.add(ctx.tweenCamara(cam.posicao, cam.alvo, 0.8), 0);
  tl.call(ctx.destacarEm(['ont']), null, 0.2);

  rede.rotulos.casas.forEach((r) => tl.set(r, { visible: true }, 0));
  // As 4 ONT começam ao mesmo tempo (pequeno desfasamento para se verem as 4 etiquetas) e chegam juntas
  const dur = 2.6;
  const t0 = 0.6;
  C.derivacoes.forEach((curva, k) => {
    const n = rede.numerosONT[k];
    const pac = criarPacote(ctx, CORES.up, `ONT ${n}`, { classe: 'rotulo-pacote up' });
    const atraso = k * 0.12;
    tl.add(viajar(pac, curva, { de: 1, ate: 0, duracao: dur - atraso, ease: 'power1.in' }), t0 + atraso);
    tl.call(() => rede.rotulos.casas[k].element.classList.add('aceso'), null, t0 + atraso);
    tl.set(pac, { visible: false }, t0 + dur);
  });
  const tc = t0 + dur;
  tl.add(clarao(ctx, CORES.alerta, juncao, { raio: 1.6, duracao: 1.2 }), tc);
  tl.add(rebentar(ctx, CORES.up, juncao, { n: 70, raio: 1.8, duracao: 1.1 }), tc);
  tl.add(rebentar(ctx, CORES.alerta, juncao, { n: 50, raio: 1.4, duracao: 1.0 }), tc + 0.05);
  tl.add(abanar(camera, 0.22, 8), tc);
  tl.add(marca(ctx, '⚠', 'alerta', rede.splitter.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 2.4, 0)), { duracao: 3.4 }), tc);
  tl.call(ctx.faixa('Sem regras, ninguém se entende.<br><small>(o que aconteceria sem TDMA)</small>', 'alerta'), null, tc + 0.2);

  // Ruído (sinal ilegível) segue até à OLT
  const ruido = criarPacote(ctx, '#8a8f96', '≈ ruído', { classe: 'rotulo-pacote' });
  ruido.scale.set(1.4, 0.7, 1.4);
  tl.add(viajar(ruido, C.alimentacao, { de: 1, ate: 0, duracao: 2.2, ease: 'none' }), tc + 0.6);
  tl.set(ruido, { visible: false }, tc + 2.8);
  tl.add(marca(ctx, '?', 'nao', rede.olt.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 3.4, 0)), { duracao: 1.6 }), tc + 2.8);
  // Pausa de 1 s antes de terminar
  tl.to({}, { duration: 1.0 }, tc + 4.4);
  return tl;
}

function tdma(ctx) {
  const { rede } = ctx;
  const C = rede.curvas;
  const tl = gsap.timeline({ paused: true });
  tl.call(ctx.faixa(''), null, 0);
  rede.rotulos.casas.forEach((r) => tl.set(r, { visible: true }, 0));
  tl.add(ctx.tweenCamara([2, 15, 34], [4, 0.5, 0], 1.4), 0);
  tl.call(ctx.destacarEm(['olt']), null, 0.2);

  // Linha do tempo sobre a fibra: 4 janelas, uma por ONT
  const barra = new THREE.Group();
  const largura = 2.6;
  const x0 = -13.6;
  const janelas = rede.numerosONT.map((n, k) => {
    const tons = ['#f59e0b', '#d98a08', '#f5b544', '#c27b06'];
    const mat = new THREE.MeshStandardMaterial({ color: tons[k], emissive: tons[k], emissiveIntensity: 0.15, transparent: true, opacity: 0.45, roughness: 0.6 });
    const j = new THREE.Mesh(new THREE.BoxGeometry(largura - 0.1, 0.7, 0.14), mat);
    j.position.set(x0 + largura * (k + 0.5), 0, 0);
    barra.add(j);
    const r = ctx.rotulo(`<b>ONT ${n}</b>`, new THREE.Vector3(j.position.x, -0.2, 0.1), { classe: 'rotulo rotulo-janela', pai: barra, visivel: true });
    r.center.set(0.5, 0.5);
    return j;
  });
  barra.position.set(0, 2.2, 3.6);
  ctx.adicionar(barra);
  const titulo = ctx.rotulo('<b>Janelas de tempo</b><span>dadas pela OLT</span>', new THREE.Vector3(x0 + largura * 2, 3.0, 3.6), { visivel: false });
  tl.set(titulo, { visible: true }, 0.6);
  tl.fromTo(titulo.element, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.6);
  tl.from(barra.scale, { x: 0.01, duration: 0.6, ease: 'power2.out' }, 0.6);
  // Cursor da linha do tempo
  const cursor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.16), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 1 }));
  cursor.position.set(x0, 0, 0.05);
  barra.add(cursor);

  const dJanela = 1.3;
  const dDeriv = 1.6;
  const dAlim = 2.6;
  const inicio = 1.6;
  for (let ciclo = 0; ciclo < 2; ciclo++) {
    const tCiclo = inicio + ciclo * dJanela * 4;
    tl.fromTo(cursor.position, { x: x0 }, { x: x0 + largura * 4, duration: dJanela * 4, ease: 'none' }, tCiclo);
    janelas.forEach((j, k) => {
      const tj = tCiclo + k * dJanela;
      tl.to(j.material, { opacity: 1, emissiveIntensity: 0.9, duration: 0.15 }, tj);
      tl.to(j.material, { opacity: 0.45, emissiveIntensity: 0.15, duration: 0.2 }, tj + dJanela - 0.2);
      // A ONT k envia na sua janela; todas demoram o mesmo até ao splitter → chegam em fila
      const pac = criarPacote(ctx, CORES.up, `ONT ${rede.numerosONT[k]}`, { classe: 'rotulo-pacote up' });
      tl.call(ctx.destacarEm(['ont']), null, tj);
      tl.call(() => rede.rotulos.casas.forEach((r, m) => r.element.classList.toggle('aceso', m === k)), null, tj);
      tl.add(viajar(pac, C.derivacoes[k], { de: 1, ate: 0, duracao: dDeriv }), tj);
      tl.add(viajar(pac, C.alimentacao, { de: 1, ate: 0, duracao: dAlim }), tj + dDeriv);
      tl.set(pac, { visible: false }, tj + dDeriv + dAlim);
      tl.call(ctx.destacarEm(['olt']), null, tj + dDeriv + dAlim);
      tl.add(marca(ctx, '✓', 'sim', rede.olt.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0.9, 3.2, 0)), { duracao: 0.7 }), tj + dDeriv + dAlim);
    });
  }
  tl.call(ctx.faixa('Cada ONT na sua janela.', 'ok'), null, inicio + dJanela * 8 + dDeriv);
  tl.to({}, { duration: 1.2 });
  return tl;
}
