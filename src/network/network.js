import * as THREE from 'three';
import { materiais, caixa } from '../core/materiais.js';
import { texturaTexto, TEX } from '../core/texturas.js';
import { criarOLT } from '../models/olt.js';
import { criarFibra } from '../models/fiber.js';
import { criarSplitter } from '../models/splitter.js';
import { criarCasa } from '../models/house.js';
import { repor as reporONT } from '../models/ont.js';
import { criarRotulo } from '../core/rotulos.js';
import { criarCenario } from '../models/cenario.js';

// Disposição da rede (unidades ≈ metros, equipamentos ampliados para se verem).
export const LAYOUT = {
  central: new THREE.Vector3(-18, 0, -1),
  splitter: new THREE.Vector3(0, 0, 2.2),
  casas: [9, 16.5, 24, 31.5].map((x) => new THREE.Vector3(x, 0, -1)),
  // As 4 casas visíveis ligam às saídas 1, 3, 5 e 7 do splitter (as outras ficam livres).
  numerosONT: [1, 3, 5, 7],
  yFibra: 0.14,
  zPasseio: 3.6,
};

// Monta a rede completa: central com OLT → fibra → splitter 1:8 → 4 casas (ONT + router).
export function criarRede() {
  const M = materiais();
  const rede = new THREE.Group();
  rede.name = 'Rede';

  criarChao(rede);
  criarCenario(rede);

  // Central com OLT
  const central = criarCentral();
  central.position.copy(LAYOUT.central);
  rede.add(central);
  const olt = criarOLT();
  olt.position.set(LAYOUT.central.x, 0.2, LAYOUT.central.z - 0.6);
  central.parent.add(olt);

  // Splitter
  const splitter = criarSplitter();
  splitter.position.copy(LAYOUT.splitter);
  rede.add(splitter);

  // Casas
  const cores = ['#eadfce', '#dfe6e0', '#efe3d6', '#e4e1ea'];
  const casas = LAYOUT.casas.map((p, i) => {
    const casa = criarCasa(LAYOUT.numerosONT[i], { corParede: cores[i] });
    casa.position.copy(p);
    rede.add(casa);
    return casa;
  });
  rede.updateMatrixWorld(true);

  // Fibra de alimentação (OLT → splitter)
  const pPON = olt.localToWorld(olt.userData.portaPON.clone());
  const pEnt = splitter.localToWorld(splitter.userData.entrada.clone());
  const y = LAYOUT.yFibra;
  const zP = LAYOUT.zPasseio;
  const alimentacao = criarFibra(
    [
      pPON,
      new THREE.Vector3(pPON.x + 0.2, pPON.y, pPON.z + 0.08),
      new THREE.Vector3(olt.position.x + 0.9, pPON.y - 0.1, pPON.z + 0.06),
      new THREE.Vector3(olt.position.x + 0.95, 0.6, pPON.z + 0.06),
      new THREE.Vector3(olt.position.x + 1.2, y, pPON.z + 0.5),
      new THREE.Vector3(olt.position.x + 1.8, y, LAYOUT.central.z + 2.4),
      new THREE.Vector3(LAYOUT.central.x + 5.5, y, zP),
      new THREE.Vector3(-5, y, zP),
      new THREE.Vector3(pEnt.x - 1.2, y, zP - 0.4),
      new THREE.Vector3(pEnt.x - 0.9, pEnt.y - 0.3, pEnt.z + 0.1),
      pEnt,
    ],
    { nome: 'Fibra de alimentação', tensao: 0.3, raio: 0.075 },
  );
  rede.add(alimentacao);

  // Fibras de distribuição (splitter → ONT)
  const saidasUsadas = LAYOUT.numerosONT.map((n) => n - 1);
  const derivacoes = casas.map((casa, i) => {
    const ont = casa.userData.ont;
    const pSai = splitter.localToWorld(splitter.userData.saidas[saidasUsadas[i]].clone());
    const pOnt = ont.localToWorld(ont.userData.entradaFibra.clone());
    // Entra pelo canto da frente à esquerda, corre junto à parede e sobe até à ONT.
    const xParede = casa.position.x - 2.6;
    const zLinha = zP - 0.16 * (i + 1);
    const pontos = [
      pSai,
      new THREE.Vector3(pSai.x + 0.5, pSai.y - 0.1, pSai.z),
      new THREE.Vector3(pSai.x + 0.9, 0.5, pSai.z + 0.6),
      new THREE.Vector3(pSai.x + 1.6, y, zLinha),
      new THREE.Vector3(xParede - 1.6, y, zLinha),
      new THREE.Vector3(xParede, 0.26, casa.position.z + 2.2),
      new THREE.Vector3(xParede, 0.26, pOnt.z + 0.35),
      new THREE.Vector3(xParede + 0.4, 0.26, pOnt.z + 0.05),
      new THREE.Vector3(pOnt.x - 0.35, 0.3, pOnt.z),
      new THREE.Vector3(pOnt.x, 0.7, pOnt.z),
      new THREE.Vector3(pOnt.x, pOnt.y - 0.2, pOnt.z),
      pOnt,
    ];
    const f = criarFibra(pontos, { nome: `Fibra ONT ${LAYOUT.numerosONT[i]}`, raio: 0.055, tensao: 0.25 });
    rede.add(f);
    return f;
  });

  // As outras 4 saídas servem casas que não aparecem: fibras que descem para uma caixa enterrada
  const caixaVisita = caixa(1.0, 0.08, 0.7, M.betao);
  caixaVisita.position.set(LAYOUT.splitter.x + 1.4, 0.04, LAYOUT.splitter.z - 1.4);
  rede.add(caixaVisita);
  splitter.userData.saidas.forEach((p, i) => {
    if (saidasUsadas.includes(i)) return;
    const pSai = splitter.localToWorld(p.clone());
    const destino = caixaVisita.position.clone().add(new THREE.Vector3((i % 4) * 0.15 - 0.2, -0.2, 0));
    const f = criarFibra(
      [pSai, new THREE.Vector3(pSai.x + 0.35, pSai.y - 0.1, pSai.z - 0.1), new THREE.Vector3(destino.x, 0.5, destino.z + 0.2), destino],
      { nome: `Fibra saída ${i + 1}`, raio: 0.045 },
    );
    rede.add(f);
  });

  // Rótulos dos componentes
  const rotulos = {
    olt: ancorar(olt, criarRotulo('<b>OLT</b><span>na central</span>'), new THREE.Vector3(1.6, 2.2, 0.4)),
    central: ancorar(central, criarRotulo('<b>Central</b>'), new THREE.Vector3(0, 5.2, 0)),
    fibra: ancorar(rede, criarRotulo('<b>Fibra</b><span>uma só</span>'), new THREE.Vector3(-9, 0.6, zP)),
    splitter: ancorar(splitter, criarRotulo('<b>Splitter 1:8</b><span>divide em 8 · passivo</span>'), new THREE.Vector3(0, 2.1, 0)),
    casas: casas.map((c) => ancorar(c, criarRotulo(`<b>ONT ${c.userData.numero}</b>`), new THREE.Vector3(-1.0, 5.4, -1.8))),
  };

  const onts = casas.map((c) => c.userData.ont);
  const routers = casas.map((c) => c.userData.router);

  const api = {
    grupo: rede,
    olt,
    central,
    splitter,
    casas,
    onts,
    routers,
    fibras: { alimentacao, derivacoes },
    rotulos,
    numerosONT: LAYOUT.numerosONT,
    // Percurso descendente completo até à ONT i (curvas encadeadas).
    curvas: {
      alimentacao: alimentacao.userData.curva,
      derivacoes: derivacoes.map((d) => d.userData.curva),
    },
    // Objectos que se destacam quando um actor está activo.
    actores: {
      olt: [olt],
      splitter: [splitter],
      ont: onts,
      router: routers,
      omci: [olt, ...onts],
      dba: [olt.userData.dba],
    },
    repor() {
      onts.forEach(reporONT);
      olt.userData.dba.visible = false;
      Object.values(rotulos)
        .flat()
        .forEach((r) => (r.visible = false));
      for (const f of [alimentacao, ...derivacoes]) {
        f.userData.bainha.material.emissive?.set('#000');
        f.userData.bainha.material.opacity = 0.32;
      }
      for (const c of casas) c.visible = true;
    },
  };
  return api;
}

function ancorar(pai, rotulo, pos) {
  rotulo.position.copy(pos);
  pai.add(rotulo);
  return rotulo;
}

function criarChao(rede) {
  const M = materiais();
  const terreno = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), M.terreno);
  terreno.rotation.x = -Math.PI / 2;
  terreno.receiveShadow = true;
  rede.add(terreno);
  // Passeio onde corre a fibra
  const passeio = new THREE.Mesh(new THREE.PlaneGeometry(90, 2.2), M.passeio);
  passeio.rotation.x = -Math.PI / 2;
  passeio.position.set(6, 0.006, LAYOUT.zPasseio - 0.2);
  passeio.receiveShadow = true;
  rede.add(passeio);
  // Estrada
  const estrada = new THREE.Mesh(new THREE.PlaneGeometry(90, 6), M.asfalto);
  estrada.rotation.x = -Math.PI / 2;
  estrada.position.set(6, 0.004, LAYOUT.zPasseio + 4);
  estrada.receiveShadow = true;
  rede.add(estrada);
  // Traço central
  const traco = new THREE.MeshStandardMaterial({ color: '#d9d4c3', roughness: 0.8 });
  for (let x = -38; x < 50; x += 4) {
    const t = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.14), traco);
    t.rotation.x = -Math.PI / 2;
    t.position.set(x, 0.008, LAYOUT.zPasseio + 4);
    rede.add(t);
  }
  // Lancil
  const lancil = caixa(90, 0.12, 0.2, M.betao, { sombra: false });
  lancil.position.set(6, 0.06, LAYOUT.zPasseio + 0.95);
  rede.add(lancil);
}

function criarCentral() {
  const M = materiais();
  const g = new THREE.Group();
  g.name = 'Central';
  const L = 8;
  const P = 6;
  const A = 4;
  const laje = caixa(L, 0.2, P, M.betao);
  laje.position.y = 0.1;
  g.add(laje);
  const fundo = caixa(L, A, 0.25, M.betao);
  fundo.position.set(0, 0.2 + A / 2, -P / 2 + 0.125);
  g.add(fundo);
  for (const lado of [-1, 1]) {
    const lat = caixa(0.25, A, P, M.betao);
    lat.position.set(lado * (L / 2 - 0.125), 0.2 + A / 2, 0);
    g.add(lat);
  }
  // Cobertura recuada (deixa ver o interior)
  const cobertura = caixa(L + 0.3, 0.3, P * 0.55, M.betao);
  cobertura.position.set(0, 0.2 + A + 0.15, -P / 2 + (P * 0.55) / 2);
  g.add(cobertura);
  const tex = texturaTexto('CENTRAL', { largura: 512, altura: 96, cor: '#1e252c', tamanho: 64, peso: 800, fundo: '#e7e3d8' });
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.56), new THREE.MeshStandardMaterial({ map: tex, color: tex ? '#fff' : '#e7e3d8', roughness: 0.7 }));
  placa.position.set(0, 0.2 + A - 0.5, -P / 2 + 0.26);
  g.add(placa);
  // Esteira de cabos no tecto
  const esteira = caixa(0.4, 0.08, P * 0.5, M.metalClaro);
  esteira.position.set(1.5, A - 0.2, -P / 4);
  g.add(esteira);
  // Pavimento técnico
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(L - 0.5, P - 0.3), new THREE.MeshStandardMaterial({ color: '#c9ccd0', map: TEX.passeio(), roughness: 0.7 }));
  piso.rotation.x = -Math.PI / 2;
  piso.position.set(0, 0.205, 0.1);
  piso.receiveShadow = true;
  g.add(piso);
  return g;
}
