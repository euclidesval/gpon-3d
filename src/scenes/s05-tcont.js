import * as THREE from 'three';
import gsap from 'gsap';
import { CORES } from '../core/colors.js';
import { criarPacote, ponto, marca } from './util.js';
import { viajar } from '../models/pulse.js';
import { criarTcont } from './interior.js';
import { escapar } from '../ui/texto.js';

// Cena 5 — T-CONT: a autorização para falar a subir.
// Passos: 1) a OLT envia o mapa de banda; 2) cada ONT envia nas janelas do seu T-CONT;
// 3) DBA em acção (uma fila cresce, a janela dessa ONT alarga e a de outra encurta);
// 4) sub-vista «Tipos de T-CONT» (5 faixas de autoestrada: mínimo sólido, máximo tracejado).
const IGUAIS = [1, 1, 1, 1];
const DEPOIS_DBA = [1, 1.6, 0.4, 1]; // só a ONT 3 (ocupada) ganha e só a ONT 5 (quieta) perde
const X0 = -14.2;
const COMPRIMENTO = 10.8;

let E = null;

export default {
  id: 's05-tcont',
  montar(ctx) {
    const { rede } = ctx;
    rede.rotulos.casas.forEach((r) => (r.visible = true));
    // Um contentor T-CONT por cima de cada casa
    const tconts = rede.casas.map((casa) => {
      // No relvado, à frente da casa (os números das ONT ficam por cima do telhado)
      const tc = criarTcont(ctx, { largura: 1.4, altura: 0.85, profundidade: 0.8 });
      tc.position.set(casa.position.x + 1.7, 0.5, casa.position.z + 2.75);
      return tc;
    });
    // Barra de janelas por cima da fibra de alimentação
    const barra = new THREE.Group();
    barra.position.set(0, 2.3, 3.6);
    barra.visible = false; // só aparece no passo 2
    ctx.adicionar(barra);
    const tons = ['#f59e0b', '#d98a08', '#f5b544', '#c27b06'];
    const janelas = rede.numerosONT.map((n, k) => {
      const mat = new THREE.MeshStandardMaterial({ color: tons[k], emissive: tons[k], emissiveIntensity: 0.15, transparent: true, opacity: 0.45 });
      const j = new THREE.Mesh(new THREE.BoxGeometry(1, 0.7, 0.14), mat);
      barra.add(j);
      const r = ctx.rotulo(`<b>ONT ${n}</b>`, new THREE.Vector3(0, -0.2, 0.1), { classe: 'rotulo rotulo-janela', pai: barra, visivel: true });
      r.center.set(0.5, 0.5);
      j.userData.rotulo = r;
      return j;
    });
    const cursor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.16), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff', emissiveIntensity: 1 }));
    cursor.position.set(X0, 0, 0.05);
    barra.add(cursor);
    const titulo = ctx.rotulo('<b>Janelas a subir</b><span>uma por T-CONT</span>', new THREE.Vector3(X0 + COMPRIMENTO / 2, 3.1, 3.6), { visivel: false });
    E = { tconts, barra, janelas, cursor, titulo, larguras: [...IGUAIS] };
    dispor(IGUAIS);
  },
  passo(ctx, i) {
    return [mapa, envio, dba, tipos][i](ctx);
  },
};

// Coloca as janelas na barra segundo as larguras relativas.
function dispor(larg) {
  const soma = larg.reduce((a, b) => a + b, 0);
  let x = X0;
  E.janelas.forEach((j, k) => {
    const w = (COMPRIMENTO * larg[k]) / soma;
    j.scale.x = Math.max(0.05, w - 0.08);
    j.position.x = x + w / 2;
    j.userData.rotulo.position.x = x + w / 2;
    j.userData.inicio = x;
    j.userData.largura = w;
    x += w;
  });
  E.larguras = [...larg];
}

function tabelaMapa(ctx, larg) {
  const linhas = ctx.rede.numerosONT
    .map((n, k) => `<tr><td>Alloc-ID · ONT ${n}</td><td><span class="barra-mapa" style="width:${(larg[k] * 2.2).toFixed(2)}rem"></span></td></tr>`)
    .join('');
  return `<div class="cartao-info mapa-banda"><b>🗺 Mapa de banda</b><table>${linhas}</table></div>`;
}

// O mapa de banda desce (azul-ciano) para TODAS as ONT; cada uma lê-o.
function enviarMapa(ctx, tl, t0, larg) {
  const { rede } = ctx;
  const C = rede.curvas;
  const pac = criarPacote(ctx, CORES.down, tabelaMapa(ctx, larg), { classe: 'rotulo-pacote-livre' });
  tl.call(ctx.destacarEm(['olt']), null, t0);
  tl.add(viajar(pac, C.alimentacao, { de: 0, ate: 1, duracao: 2.4 }), t0);
  tl.set(pac, { visible: false }, t0 + 2.4);
  C.derivacoes.forEach((curva, k) => {
    const copia = criarPacote(ctx, CORES.down, null);
    tl.add(viajar(copia, curva, { de: 0, ate: 1, duracao: 1.4 }), t0 + 2.4);
    tl.set(copia, { visible: false }, t0 + 3.8);
    const tc = E.tconts[k];
    tl.to(tc.userData.faces.material, { opacity: 0.55, duration: 0.2, yoyo: true, repeat: 3 }, t0 + 3.8);
  });
  tl.call(ctx.destacarEm(['ont']), null, t0 + 3.8);
  return t0 + 4.6;
}

// Um ciclo de envio: cada ONT envia na sua janela (n pulsos por janela).
function ciclo(ctx, tl, t0, duracao, pulsos) {
  const { rede } = ctx;
  const C = rede.curvas;
  tl.fromTo(E.cursor.position, { x: X0 }, { x: X0 + COMPRIMENTO, duration: duracao, ease: 'none' }, t0);
  E.janelas.forEach((j, k) => {
    const tj = t0 + ((j.userData.inicio - X0) / COMPRIMENTO) * duracao;
    const dj = (j.userData.largura / COMPRIMENTO) * duracao;
    tl.to(j.material, { opacity: 1, emissiveIntensity: 0.9, duration: 0.12 }, tj);
    tl.to(j.material, { opacity: 0.45, emissiveIntensity: 0.15, duration: 0.15 }, tj + dj - 0.15);
    const n = pulsos[k];
    for (let p = 0; p < n; p++) {
      const ts = tj + (p * dj) / n;
      const pac = criarPacote(ctx, CORES.up, p === 0 ? `ONT ${rede.numerosONT[k]}` : null, { classe: 'rotulo-pacote up' });
      tl.add(viajar(pac, C.derivacoes[k], { de: 1, ate: 0, duracao: 1.4 }), ts);
      tl.add(viajar(pac, C.alimentacao, { de: 1, ate: 0, duracao: 2.4 }), ts + 1.4);
      tl.set(pac, { visible: false }, ts + 3.8);
      if (E.fila && k === 1) tl.add(tirarDaFila(), ts);
    }
  });
  return t0 + duracao + 3.8;
}

function mapa(ctx) {
  const tl = gsap.timeline({ paused: true });
  const cam = ctx.dados.camara;
  tl.add(ctx.tweenCamara(cam.posicao, cam.alvo, 1.2), 0);
  E.tconts.forEach((tc, k) => tl.from(tc.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.5, ease: 'back.out(2)' }, 0.3 + k * 0.15));
  enviarMapa(ctx, tl, 1.4, IGUAIS);
  tl.to({}, { duration: 0.8 });
  return tl;
}

function envio(ctx) {
  const tl = gsap.timeline({ paused: true });
  tl.set([E.titulo, E.barra], { visible: true }, 0);
  tl.from(E.barra.scale, { x: 0.01, duration: 0.6, ease: 'power2.out' }, 0.2);
  tl.call(ctx.destacarEm(['ont']), null, 0.4);
  const fim = ciclo(ctx, tl, 1.0, 5.2, [1, 1, 1, 1]);
  tl.call(ctx.destacarEm(['olt']), null, fim - 0.6);
  return tl;
}

// Fila de pacotes à espera na ONT 3 (cubos âmbar empilhados ao lado do T-CONT).
function criarFila(ctx) {
  const tc = E.tconts[1];
  const g = new THREE.Group();
  g.position.copy(tc.position).add(new THREE.Vector3(-1.25, -0.4, 0));
  ctx.adicionar(g);
  const cubos = [];
  for (let i = 0; i < 6; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.3), new THREE.MeshStandardMaterial({ color: CORES.up, emissive: CORES.up, emissiveIntensity: 0.5 }));
    c.position.y = i * 0.25;
    c.visible = false;
    g.add(c);
    cubos.push(c);
  }
  const r = ctx.rotulo('<b>Fila a crescer</b><span>muito tráfego</span>', new THREE.Vector3(-0.3, 2.6, 0), { pai: g, visivel: false });
  E.fila = { g, cubos, r, n: 0 };
  return E.fila;
}

function tirarDaFila() {
  const tl = gsap.timeline();
  tl.call(() => {
    const f = E.fila;
    const visiveis = f.cubos.filter((c) => c.visible);
    for (let i = 0; i < 2 && visiveis.length; i++) visiveis.pop().visible = false;
  });
  return tl;
}

function dba(ctx) {
  const tl = gsap.timeline({ paused: true });
  const { rede } = ctx;
  const fila = criarFila(ctx);
  tl.set([E.titulo, E.barra], { visible: true }, 0);
  tl.call(ctx.destacarEm(['ont']), null, 0.2);
  tl.set(fila.r, { visible: true }, 0.3);
  fila.cubos.forEach((c, i) => tl.set(c, { visible: true }, 0.4 + i * 0.35));
  const quieta = ctx.rotulo('<b>💤 quieta</b><span>pouco tráfego</span>', E.tconts[2].position.clone().add(new THREE.Vector3(-1.0, 2.3, 0)), {});
  tl.set(quieta, { visible: true }, 1.0);
  // DBA na OLT
  const dbaObj = rede.olt.userData.dba;
  tl.call(ctx.destacarEm(['dba']), null, 2.6);
  const rDba = ctx.rotulo('<b>⚙ DBA</b><span>ajusta as janelas</span>', dbaObj.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.6, 0)), {});
  tl.set(rDba, { visible: true }, 2.6);
  tl.to(dbaObj.userData.roda.rotation, { z: -Math.PI * 4, duration: 3.5, ease: 'power1.inOut' }, 2.6);
  // Novo mapa com as janelas ajustadas
  const t1 = enviarMapa(ctx, tl, 4.2, DEPOIS_DBA);
  // A barra muda: a janela da ONT 3 alarga, a da ONT 5 encurta
  const estado = { k: 0 };
  tl.to(
    estado,
    {
      k: 1,
      duration: 1.0,
      ease: 'power2.inOut',
      onUpdate: () => dispor(IGUAIS.map((a, i) => a + (DEPOIS_DBA[i] - a) * estado.k)),
    },
    t1,
  );
  // O ciclo calcula os tempos das janelas a partir da disposição: usar a disposição nova
  dispor(DEPOIS_DBA);
  const centro = (k) => new THREE.Vector3(E.janelas[k].position.x, 3.4, 3.6);
  tl.add(marca(ctx, '＋ ONT 3', 'sim', centro(1), { duracao: 2.4 }), t1 + 1.0);
  tl.add(marca(ctx, '－ ONT 5', 'nao', centro(2).add(new THREE.Vector3(0.6, 0, 0)), { duracao: 2.4 }), t1 + 1.0);
  const fim = ciclo(ctx, tl, t1 + 1.4, 6.0, [1, 3, 1, 1]);
  dispor(IGUAIS);
  tl.call(() => dispor(DEPOIS_DBA), null, t1 + 1.1);
  tl.call(ctx.destacarEm(['dba']), null, fim - 0.5);
  return tl;
}

function tipos(ctx) {
  const tl = gsap.timeline({ paused: true });
  const lista = ctx.dados.tiposTcont;
  const g = new THREE.Group();
  g.position.set(4, 0.03, 8.6);
  ctx.adicionar(g);
  const espaco = 4.4;
  const maxL = 3.2;
  const comp = 5.4;
  const matSolido = new THREE.MeshStandardMaterial({ color: CORES.tcont, emissive: CORES.tcont, emissiveIntensity: 0.35, roughness: 0.5 });
  const matTraco = new THREE.MeshStandardMaterial({ color: CORES.tcont, emissive: CORES.tcont, emissiveIntensity: 0.6 });
  const matPiso = new THREE.MeshStandardMaterial({ color: '#1b1e22', roughness: 0.9 });
  lista.forEach((t, i) => {
    const x = (i - (lista.length - 1) / 2) * espaco;
    const faixa = new THREE.Group();
    faixa.position.x = x;
    g.add(faixa);
    const wMax = maxL * t.maximo;
    const wMin = maxL * t.minimo;
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(maxL + 0.3, comp), matPiso);
    piso.rotation.x = -Math.PI / 2;
    faixa.add(piso);
    if (wMin > 0) {
      const solido = new THREE.Mesh(new THREE.PlaneGeometry(wMin, comp), matSolido);
      solido.rotation.x = -Math.PI / 2;
      solido.position.y = 0.01;
      faixa.add(solido);
    }
    // Contorno tracejado do máximo possível
    const tracos = new THREE.Group();
    const nTracos = 9;
    for (const lado of [-1, 1]) {
      for (let k = 0; k < nTracos; k++) {
        const tr = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, (comp / nTracos) * 0.55), matTraco);
        tr.position.set((lado * wMax) / 2, 0.03, -comp / 2 + (comp / nTracos) * (k + 0.5));
        tracos.add(tr);
      }
    }
    faixa.add(tracos);
    const r = ctx.rotulo(
      `<b>Tipo ${t.tipo} · ${escapar(t.nome)}</b><span>${escapar(t.exemplo)}</span>`,
      new THREE.Vector3(x, 0.2, -comp / 2 - 0.2),
      { pai: g, visivel: false },
    );
    const t0 = 1.2 + i * 0.5;
    tl.set(r, { visible: true }, t0);
    tl.from(faixa.scale, { x: 0.01, z: 0.01, duration: 0.5, ease: 'power2.out' }, t0);
  });
  const legenda = ctx.rotulo(
    '<b style="white-space:nowrap"><i class="amostra" style="--cor:#f97316;width:1.2em"></i> sólido = mínimo garantido &nbsp;·&nbsp; <i class="amostra amostra-contentor" style="--cor:#f97316;border-style:dashed;width:1.2em"></i> tracejado = máximo possível</b>',
    new THREE.Vector3(0, 0.2, comp / 2 + 0.6),
    { pai: g, visivel: false },
  );
  // Sub-vista limpa: esconde o resto da cena
  tl.call(() => {
    ctx.temp.children.forEach((c) => c !== g && (c.visible = false));
    ctx.rede.rotulos.casas.forEach((r) => (r.visible = false));
  }, null, 0);
  tl.add(ctx.tweenCamara([4, 18, 23], [4, 0, 8.4], 1.6), 0);
  tl.call(ctx.destacarEm(['dba']), null, 0.2);
  tl.set(legenda, { visible: true }, 4.0);
  tl.to({}, { duration: 1.2 });
  return tl;
}
