import * as THREE from 'three';
import gsap from 'gsap';
import { CORES } from '../core/colors.js';
import { tuboLinha } from './util.js';

// Peças do interior da ONT (vista ampliada): T-CONT, GEM ports, etiquetas VLAN.

// Vista ampliada «Dentro da ONT N»: caixa translúcida à frente da ONT, ligada a ela por linhas.
export function criarAmpliacao(ctx, ont, posicao, { largura = 2.8, altura = 1.7, profundidade = 0.9, titulo = null } = {}) {
  const g = new THREE.Group();
  g.position.copy(posicao);
  const caixaGeo = new THREE.BoxGeometry(largura, altura, profundidade);
  const vidro = new THREE.Mesh(
    caixaGeo,
    new THREE.MeshPhysicalMaterial({ color: '#f4f6f8', roughness: 0.2, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide }),
  );
  vidro.userData.semContorno = true;
  g.add(vidro, moldura(largura, altura, profundidade, '#e9eef3', 0.03, 0.5));
  const nome = titulo ?? `Dentro da ONT ${ont.userData.numero}`;
  const r = ctx.rotulo(`<b>🔍 ${nome}</b>`, new THREE.Vector3(0, altura / 2 + 0.05, 0), { pai: g, visivel: true });
  r.center.set(0.5, 1);
  // Linhas de «zoom» entre a ONT real e a ampliação
  ctx.rede.grupo.updateMatrixWorld(true);
  const pOnt = ont.getWorldPosition(new THREE.Vector3());
  const cantos = [
    [-largura / 2, altura / 2],
    [largura / 2, altura / 2],
    [-largura / 2, -altura / 2],
    [largura / 2, -altura / 2],
  ].map(([x, y]) => posicao.clone().add(new THREE.Vector3(x, y, -profundidade / 2)));
  const linhas = new THREE.Group();
  cantos.forEach((c) => linhas.add(tuboLinha(new THREE.LineCurve3(pOnt, c), '#e9eef3', { raio: 0.015, tracejado: true, traco: 0.12, espaco: 0.08, emissivo: 0.5 })));
  ctx.adicionar(linhas);
  ctx.adicionar(g);
  g.visible = false;
  linhas.visible = false;
  g.userData = { linhas, largura, altura, profundidade, rotulo: r };
  return g;
}

export function mostrarAmpliacao(amp, duracao = 0.6) {
  const tl = gsap.timeline();
  tl.set([amp, amp.userData.linhas], { visible: true });
  tl.from(amp.scale, { x: 0.05, y: 0.05, z: 0.05, duration: duracao, ease: 'back.out(1.4)' });
  return tl;
}

// Contentor laranja do T-CONT com etiqueta «Alloc-ID».
export function criarTcont(ctx, { numero = null, largura = 1.2, altura = 0.9, profundidade = 0.6, pai = null } = {}) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(largura, altura, profundidade);
  const faces = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: CORES.tcont, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
  const arestas = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: CORES.tcont }));
  // Barras grossas nas arestas (as linhas WebGL têm sempre 1 px)
  const barras = new THREE.Group();
  const matBarra = new THREE.MeshBasicMaterial({ color: CORES.tcont });
  const e = 0.06;
  for (const [sx, sy, sz, px, py, pz] of [
    [largura, e, e, 0, altura / 2, profundidade / 2],
    [largura, e, e, 0, -altura / 2, profundidade / 2],
    [largura, e, e, 0, altura / 2, -profundidade / 2],
    [largura, e, e, 0, -altura / 2, -profundidade / 2],
    [e, altura, e, largura / 2, 0, profundidade / 2],
    [e, altura, e, -largura / 2, 0, profundidade / 2],
    [e, altura, e, largura / 2, 0, -profundidade / 2],
    [e, altura, e, -largura / 2, 0, -profundidade / 2],
    [e, e, profundidade, largura / 2, altura / 2, 0],
    [e, e, profundidade, -largura / 2, altura / 2, 0],
    [e, e, profundidade, largura / 2, -altura / 2, 0],
    [e, e, profundidade, -largura / 2, -altura / 2, 0],
  ]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), matBarra);
    b.position.set(px, py, pz);
    barras.add(b);
  }
  faces.userData.semContorno = true;
  g.add(faces, arestas, barras);
  const nome = numero ? `T-CONT ${numero}` : 'T-CONT';
  const r = ctx.rotulo(`<b>${nome}</b><span>Alloc-ID</span>`, new THREE.Vector3(0, altura / 2 + 0.04, 0), { classe: 'rotulo rotulo-tcont', pai: g, visivel: true });
  r.center.set(0.5, 1);
  (pai ?? ctx.temp).add(g);
  g.userData = { faces, barras, rotulo: r, largura, altura, profundidade };
  return g;
}

// Compartimento de uma GEM port (cor = tipo de tráfego).
export function criarGem(ctx, cor, texto, { largura = 0.9, altura = 0.5, profundidade = 0.4, pai = null } = {}) {
  const geo = new THREE.BoxGeometry(largura, altura, profundidade);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: cor, emissive: cor, emissiveIntensity: 0.55, roughness: 0.35 }));
  m.castShadow = true;
  m.add(moldura(largura, altura, profundidade, '#ffffff', 0.035));
  const r = ctx.rotulo(`<b>${texto}</b>`, new THREE.Vector3(0, 0, profundidade / 2 + 0.02), { classe: 'rotulo rotulo-gem', pai: m, visivel: true });
  r.center.set(0.5, 0.5);
  r.element.style.borderColor = cor;
  (pai ?? ctx.temp).add(m);
  m.userData = { rotulo: r, cor };
  return m;
}

// Etiqueta VLAN (branca, com o número visível) colada a um objecto.
export function etiquetaVlan(ctx, numero, pai, deslocamento = new THREE.Vector3(0, 0.3, 0), { visivel = true, classe = '' } = {}) {
  const r = ctx.rotulo(`VLAN <b>${numero}</b>`, deslocamento, { classe: `etiqueta-vlan ${classe}`, pai, visivel });
  r.center.set(0.5, 1);
  return r;
}

// Faz aparecer uma peça «a encaixar»: cai de cima e cresce.
export function encaixar(obj, { de = 0.8, duracao = 0.7 } = {}) {
  const tl = gsap.timeline();
  const y = obj.position.y;
  tl.set(obj, { visible: true });
  tl.fromTo(obj.position, { y: y + de }, { y, duration: duracao, ease: 'bounce.out' }, 0);
  tl.fromTo(obj.scale, { x: 0.3, y: 0.3, z: 0.3 }, { x: 1, y: 1, z: 1, duration: duracao * 0.6, ease: 'back.out(2)' }, 0);
  return tl;
}

// Curva em mundo do cabo Ethernet ONT ↔ router de uma casa (u=0 na ONT, u=1 no router).
export function curvaCabo(casa) {
  casa.updateMatrixWorld(true);
  return new THREE.CatmullRomCurve3(casa.userData.caboPontos.map((p) => casa.localToWorld(p.clone())));
}

// Percurso do OMCI até à ONT k (alimentação + derivação), u=0 na OLT.
export function curvaAteONT(rede, k, { desvioY = 0 } = {}) {
  const pts = [...rede.curvas.alimentacao.getSpacedPoints(90), ...rede.curvas.derivacoes[k].getSpacedPoints(60).slice(1)].map((p) => p.clone().add(new THREE.Vector3(0, desvioY, 0)));
  return new THREE.CatmullRomCurve3(pts);
}

// Interior completo usado nas cenas 4 e 6: três T-CONT, cada um com uma GEM port.
// Só a GEM 2 (Internet, T-CONT 1) tem número: é a do perfil de linha 100 (cena 7).
export function montarInteriorONT(ctx, amp) {
  const L = amp.userData.largura;
  const tipos = [
    { cor: CORES.gemInternet, texto: 'GEM 2 · Internet', tcont: 1 },
    { cor: CORES.gemVoz, texto: 'GEM · Voz', tcont: null },
    { cor: CORES.gemIptv, texto: 'GEM · IPTV', tcont: null },
  ];
  const passo = L / 3;
  const tconts = [];
  const gems = [];
  tipos.forEach((t, i) => {
    const tc = criarTcont(ctx, { numero: t.tcont, largura: passo * 0.82, altura: 0.95, profundidade: 0.55, pai: amp });
    tc.position.set(-L / 2 + passo * (i + 0.5), -0.22, 0);
    tc.visible = false;
    const gem = criarGem(ctx, t.cor, t.texto, { largura: passo * 0.6, altura: 0.42, profundidade: 0.32, pai: tc });
    gem.position.set(0, -0.12, 0);
    gem.visible = false;
    tconts.push(tc);
    gems.push(gem);
  });
  return { tconts, gems };
}

// Moldura de arestas grossas (caixas finas) para uma caixa w×h×d.
export function moldura(w, h, d, cor, e = 0.04, emissivo = 0.8) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: cor, emissive: cor, emissiveIntensity: emissivo, roughness: 0.5 });
  const arestas = [
    [w, e, e, 0, h / 2, d / 2], [w, e, e, 0, -h / 2, d / 2], [w, e, e, 0, h / 2, -d / 2], [w, e, e, 0, -h / 2, -d / 2],
    [e, h, e, w / 2, 0, d / 2], [e, h, e, -w / 2, 0, d / 2], [e, h, e, w / 2, 0, -d / 2], [e, h, e, -w / 2, 0, -d / 2],
    [e, e, d, w / 2, h / 2, 0], [e, e, d, -w / 2, h / 2, 0], [e, e, d, w / 2, -h / 2, 0], [e, e, d, -w / 2, -h / 2, 0],
  ];
  for (const [sx, sy, sz, px, py, pz] of arestas) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    b.position.set(px, py, pz);
    b.userData.semContorno = true;
    g.add(b);
  }
  return g;
}
