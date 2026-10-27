import * as THREE from 'three';
import { materiais, materialLed, caixa } from '../core/materiais.js';
import { texturaTexto } from '../core/texturas.js';

// OLT: bastidor de 19" com subbastidor, cartas de serviço (2 cartas PON), LEDs,
// portas PON, cartas de controlo, fontes e tabuleiro de ventilação.
export function criarOLT() {
  const M = materiais();
  const g = new THREE.Group();
  g.name = 'OLT';
  const leds = [];

  // Bastidor (montantes e travessas)
  const altura = 2.6;
  for (const x of [-0.82, 0.82]) {
    for (const z of [-0.42, 0.42]) {
      const montante = caixa(0.07, altura, 0.07, M.metalEscuro);
      montante.position.set(x, altura / 2, z);
      g.add(montante);
    }
  }
  for (const y of [0.04, altura - 0.04]) {
    const topo = caixa(1.71, 0.08, 0.91, M.metalEscuro);
    topo.position.y = y;
    g.add(topo);
  }
  const fundo = caixa(1.6, altura - 0.1, 0.03, M.metalEscuro);
  fundo.position.set(0, altura / 2, -0.4);
  g.add(fundo);

  // Subbastidor (chassis)
  const yChassis = 1.55;
  const chassis = caixa(1.56, 1.05, 0.7, M.metalChassis);
  chassis.position.set(0, yChassis, 0);
  g.add(chassis);

  // Cartas de serviço na vertical
  const nCartas = 16;
  const passo = 1.44 / nCartas;
  const cartasPON = [3, 4];
  let portaPON = null;
  for (let i = 0; i < nCartas; i++) {
    const x = -0.72 + passo * (i + 0.5);
    const ePON = cartasPON.includes(i);
    const eControlo = i === 7 || i === 8;
    const carta = caixa(passo * 0.86, 0.9, 0.04, ePON ? M.metalClaro : M.carta);
    carta.position.set(x, yChassis, 0.36);
    g.add(carta);
    // Puxador
    const puxador = caixa(passo * 0.5, 0.05, 0.03, M.plasticoPreto);
    puxador.position.set(x, yChassis - 0.42, 0.395);
    g.add(puxador);
    // LEDs de estado (RUN/ALM)
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), materialLed(i % 5 === 2 ? '#ffb020' : '#33ff77', 2));
    led.position.set(x, yChassis + 0.4, 0.385);
    g.add(led);
    leds.push(led);
    if (ePON || eControlo) {
      const nPortas = ePON ? 8 : 2;
      for (let p = 0; p < nPortas; p++) {
        const porta = caixa(passo * 0.5, 0.045, 0.03, M.porta, { sombra: false });
        porta.position.set(x, yChassis + 0.28 - p * 0.075, 0.39);
        g.add(porta);
        const ledPorta = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.01), materialLed('#33ff77', ePON && p < 2 ? 2.2 : 0.05));
        ledPorta.position.set(x + passo * 0.32, yChassis + 0.28 - p * 0.075, 0.39);
        g.add(ledPorta);
        if (ePON && p < 2) leds.push(ledPorta);
        if (i === 3 && p === 0) portaPON = new THREE.Vector3(x, yChassis + 0.28, 0.42);
      }
    }
  }

  // Etiqueta frontal
  const tex = texturaTexto('OLT · GPON', { largura: 512, altura: 64, cor: '#e6edf3', tamanho: 40 });
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.09), new THREE.MeshStandardMaterial({ map: tex, transparent: true, color: tex ? '#fff' : '#ddd', roughness: 0.5 }));
  placa.position.set(0, yChassis + 0.49, 0.352);
  g.add(placa);

  // Tabuleiro de ventilação
  const vent = caixa(1.56, 0.18, 0.7, M.metalChassis);
  vent.position.set(0, yChassis + 0.64, 0);
  g.add(vent);
  const grelha = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.12), M.grelha);
  grelha.position.set(0, yChassis + 0.64, 0.352);
  g.add(grelha);

  // Fontes de alimentação e equipamento de agregação abaixo
  const fontes = caixa(1.56, 0.22, 0.65, M.metalChassis);
  fontes.position.set(0, 0.85, 0);
  g.add(fontes);
  for (const x of [-0.5, 0.5]) {
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), materialLed('#33ff77', 2));
    led.position.set(x, 0.85, 0.33);
    g.add(led);
  }
  const ligacoes = caixa(1.56, 0.12, 0.6, M.carta);
  ligacoes.position.set(0, 0.55, 0);
  g.add(ligacoes);

  // Gestor de cabos de fibra (calha lateral)
  const calha = caixa(0.12, 1.4, 0.12, M.plasticoPreto);
  calha.position.set(0.9, 1.4, 0.38);
  g.add(calha);

  // Engrenagem do DBA (aparece nas cenas do T-CONT)
  const dba = criarEngrenagem();
  dba.position.set(-0.45, altura + 0.35, 0.1);
  dba.visible = false;
  g.add(dba);

  g.userData = {
    leds,
    dba,
    portaPON, // posição local da porta PON ligada à fibra
    topo: new THREE.Vector3(0, altura + 0.2, 0),
  };
  return g;
}

export function criarEngrenagem() {
  const forma = new THREE.Shape();
  const dentes = 10;
  const rExt = 0.32;
  const rInt = 0.25;
  for (let i = 0; i < dentes * 2; i++) {
    const a0 = (i / (dentes * 2)) * Math.PI * 2;
    const a1 = ((i + 1) / (dentes * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? rExt : rInt;
    if (i === 0) forma.moveTo(Math.cos(a0) * r, Math.sin(a0) * r);
    else forma.lineTo(Math.cos(a0) * r, Math.sin(a0) * r);
    forma.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
  }
  const furo = new THREE.Path();
  furo.absarc(0, 0, 0.09, 0, Math.PI * 2, true);
  forma.holes.push(furo);
  const geo = new THREE.ExtrudeGeometry(forma, { depth: 0.08, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2 });
  geo.center();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#c8ccd2', metalness: 0.9, roughness: 0.25 }));
  mesh.castShadow = true;
  const g = new THREE.Group();
  g.name = 'DBA';
  g.add(mesh);
  g.userData.roda = mesh;
  return g;
}
