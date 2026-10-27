import * as THREE from 'three';
import { materiais, materialLed, caixa } from '../core/materiais.js';
import { criarONT } from './ont.js';

// Casa em corte (sem parede da frente nem água da frente do telhado) com ONT, router,
// portátil, telefone e TV no interior.
export function criarCasa(numero, { corParede = '#e9e0d2' } = {}) {
  const M = materiais();
  const g = new THREE.Group();
  g.name = `Casa ${numero}`;
  const L = 6; // largura (x)
  const P = 5; // profundidade (z)
  const A = 3; // altura das paredes
  const esp = 0.18;
  const parede = M.paredeCasa.clone();
  parede.color.set(corParede);

  // Lote: relva
  const relva = new THREE.Mesh(new THREE.PlaneGeometry(L + 1.6, P + 2.6), M.relva);
  relva.rotation.x = -Math.PI / 2;
  relva.position.set(0, 0.012, 0.6);
  relva.receiveShadow = true;
  g.add(relva);

  // Laje / soalho
  const laje = caixa(L, 0.2, P, M.betao);
  laje.position.y = 0.1;
  g.add(laje);
  const soalho = new THREE.Mesh(new THREE.PlaneGeometry(L - esp * 2, P - esp), M.soalho);
  soalho.rotation.x = -Math.PI / 2;
  soalho.position.set(0, 0.202, esp / 2);
  soalho.receiveShadow = true;
  g.add(soalho);

  // Parede do fundo e laterais (com janela nas laterais)
  const fundo = caixa(L, A, esp, parede);
  fundo.position.set(0, 0.2 + A / 2, -P / 2 + esp / 2);
  g.add(fundo);
  const interiorFundo = new THREE.Mesh(new THREE.PlaneGeometry(L - esp * 2, A), M.paredeInterior);
  interiorFundo.position.set(0, 0.2 + A / 2, -P / 2 + esp + 0.002);
  interiorFundo.receiveShadow = true;
  g.add(interiorFundo);
  for (const lado of [-1, 1]) {
    const lat = caixa(esp, A, P, parede);
    lat.position.set(lado * (L / 2 - esp / 2), 0.2 + A / 2, 0);
    g.add(lat);
    // Meia empena (só a metade de trás: a casa está em corte)
    const forma = new THREE.Shape();
    forma.moveTo(0, 0);
    forma.lineTo(P / 2, 0);
    forma.lineTo(0, 1.6);
    forma.closePath();
    const emp = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: esp, bevelEnabled: false }), parede);
    emp.rotation.y = Math.PI / 2; // x da forma → -z do mundo; extrusão → +x
    emp.position.set(lado > 0 ? L / 2 - esp : -L / 2, 0.2 + A, 0);
    emp.castShadow = true;
    g.add(emp);
    // Janela
    const janela = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), M.vidro);
    janela.rotation.y = lado * Math.PI / 2;
    janela.position.set(lado * (L / 2 + 0.002), 1.8, 0.3);
    g.add(janela);
    const caixilho = caixa(0.04, 1.1, 1.5, M.paredeInterior);
    caixilho.position.set(lado * (L / 2 + 0.01), 1.8, 0.3);
    g.add(caixilho);
    janela.position.x += lado * 0.02;
  }

  // Telhado: só a água de trás (corte didáctico) + cumeeira
  const inclinacao = Math.atan2(1.6, P / 2);
  const compAgua = Math.hypot(P / 2, 1.6) + 0.45;
  const agua = caixa(L + 0.6, 0.14, compAgua, M.telhado);
  agua.rotation.x = -inclinacao;
  agua.position.set(0, 0.2 + A + 0.8 + 0.1, -P / 4 - 0.18);
  g.add(agua);
  const cumeeira = caixa(L + 0.7, 0.16, 0.2, M.telhado);
  cumeeira.position.set(0, 0.2 + A + 1.62, 0.02);
  g.add(cumeeira);
  // Rodapé da frente (sugere a parede em corte)
  const rodape = caixa(L, 0.35, esp, parede);
  rodape.position.set(0, 0.2 + 0.175, P / 2 - esp / 2);
  g.add(rodape);

  // ONT na parede do fundo
  const ont = criarONT(numero);
  ont.position.set(-1.0, 1.75, -P / 2 + esp + 0.13);
  g.add(ont);

  // Móvel por baixo com router e telefone
  const movel = caixa(2.0, 0.8, 0.6, M.madeira);
  movel.position.set(-0.9, 0.2 + 0.4, -P / 2 + esp + 0.32);
  g.add(movel);
  const router = criarRouter();
  router.position.set(-1.35, 1.0, -P / 2 + esp + 0.32);
  g.add(router);
  const telefone = criarTelefone();
  telefone.position.set(-0.25, 1.0, -P / 2 + esp + 0.35);
  g.add(telefone);

  // Cabo Ethernet ONT → router
  const pontosCabo = [
    new THREE.Vector3(ont.position.x + ont.userData.portaLan.x, ont.position.y + ont.userData.portaLan.y, ont.position.z),
    new THREE.Vector3(ont.position.x + ont.userData.portaLan.x, 1.2, ont.position.z + 0.05),
    new THREE.Vector3(router.position.x + 0.2, 1.12, router.position.z - 0.08),
  ];
  const cabo = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontosCabo), 20, 0.02, 6), M.caboCinza);
  g.add(cabo);

  // Mesa com portátil
  const mesa = criarMesa();
  mesa.position.set(1.55, 0.2, 1.0);
  g.add(mesa);
  const portatil = criarPortatil();
  portatil.position.set(1.55, 0.2 + 0.78, 1.0);
  portatil.rotation.y = Math.PI;
  g.add(portatil);

  // TV num móvel baixo
  const movelTv = caixa(1.8, 0.45, 0.5, M.madeira);
  movelTv.position.set(1.7, 0.2 + 0.225, -P / 2 + esp + 0.3);
  g.add(movelTv);
  const tv = criarTV();
  tv.position.set(1.7, 0.65, -P / 2 + esp + 0.3);
  g.add(tv);

  g.userData = { numero, ont, router, portatil, telefone, tv, dimensoes: { L, P, A } };
  return g;
}

export function criarRouter() {
  const M = materiais();
  const g = new THREE.Group();
  g.name = 'Router';
  const corpo = caixa(0.6, 0.1, 0.36, M.plasticoPreto);
  corpo.position.y = 0.05;
  g.add(corpo);
  for (const x of [-0.24, 0.24]) {
    const antena = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.4, 8), M.plasticoPreto);
    antena.position.set(x, 0.3, -0.15);
    antena.rotation.z = x > 0 ? -0.15 : 0.15;
    antena.castShadow = true;
    g.add(antena);
  }
  const leds = [];
  for (let i = 0; i < 5; i++) {
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, 0.01), materialLed('#7dffb0', 1.5));
    led.position.set(-0.16 + i * 0.08, 0.06, 0.182);
    led.userData.semContorno = true;
    g.add(led);
    leds.push(led);
  }
  g.userData.leds = leds;
  return g;
}

function criarTelefone() {
  const M = materiais();
  const g = new THREE.Group();
  g.name = 'Telefone';
  const base = caixa(0.2, 0.05, 0.22, M.plasticoCinza);
  base.position.y = 0.025;
  g.add(base);
  const auscultador = caixa(0.07, 0.06, 0.3, M.plasticoPreto);
  auscultador.position.set(0, 0.08, 0);
  auscultador.rotation.x = 0.15;
  g.add(auscultador);
  return g;
}

function criarMesa() {
  const M = materiais();
  const g = new THREE.Group();
  const tampo = caixa(1.6, 0.06, 0.9, M.madeira);
  tampo.position.y = 0.75;
  g.add(tampo);
  for (const x of [-0.72, 0.72]) for (const z of [-0.38, 0.38]) {
    const perna = caixa(0.06, 0.72, 0.06, M.metalEscuro);
    perna.position.set(x, 0.36, z);
    g.add(perna);
  }
  return g;
}

function criarPortatil() {
  const M = materiais();
  const g = new THREE.Group();
  g.name = 'Portátil';
  const base = caixa(0.62, 0.03, 0.42, M.metalChassis);
  base.position.y = 0.015;
  g.add(base);
  const tampa = new THREE.Group();
  tampa.position.set(0, 0.03, -0.2);
  tampa.rotation.x = -0.25;
  const costas = caixa(0.62, 0.4, 0.02, M.metalChassis);
  costas.position.y = 0.2;
  tampa.add(costas);
  const ecra = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.34), M.ecraLigado);
  ecra.position.set(0, 0.2, 0.012);
  ecra.userData.semContorno = true;
  tampa.add(ecra);
  g.add(tampa);
  return g;
}

function criarTV() {
  const M = materiais();
  const g = new THREE.Group();
  g.name = 'TV';
  const pe = caixa(0.4, 0.03, 0.2, M.plasticoPreto);
  g.add(pe);
  const haste = caixa(0.06, 0.15, 0.04, M.plasticoPreto);
  haste.position.y = 0.08;
  g.add(haste);
  const painel = caixa(1.5, 0.86, 0.05, M.plasticoPreto);
  painel.position.y = 0.6;
  g.add(painel);
  const ecra = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.78), M.ecraLigado);
  ecra.position.set(0, 0.6, 0.027);
  ecra.userData.semContorno = true;
  g.add(ecra);
  return g;
}
