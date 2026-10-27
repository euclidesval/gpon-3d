import * as THREE from 'three';
import { materiais, materialLed, caixa } from '../core/materiais.js';
import { texturaCanvas } from '../core/texturas.js';

const COR_LED = { PON: '#33ff77', LOS: '#ff3030', LAN: '#33ff77' };

// ONT: caixa branca de parede com LEDs (PON, LOS, LAN), entrada de fibra e portas Ethernet.
// A frente (`carcaca`) pode ficar translúcida para a vista em corte.
export function criarONT(numero) {
  const M = materiais();
  const g = new THREE.Group();
  g.name = `ONT ${numero}`;

  const w = 1.0;
  const h = 0.62;
  const d = 0.22;
  const carcacaMat = M.plasticoBranco.clone();
  carcacaMat.transparent = true;
  const carcaca = caixa(w, h, d, carcacaMat);
  g.add(carcaca);

  // Painel frontal com serigrafia
  const tex = texturaCanvas(`ont-frente`, 512, 320, (c, W, H) => {
    c.fillStyle = '#f4f4f1';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#5c6670';
    c.font = '600 34px system-ui, Arial, sans-serif';
    c.textAlign = 'center';
    ['PON', 'LOS', 'LAN'].forEach((t, i) => c.fillText(t, 110 + i * 145, 120));
    c.font = '700 44px system-ui, Arial, sans-serif';
    c.fillStyle = '#9aa3ac';
    c.fillText('ONT', W / 2, 250);
  });
  const frenteMat = new THREE.MeshStandardMaterial({ map: tex, color: tex ? '#fff' : '#f2f2ee', roughness: 0.4, transparent: true });
  const frente = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.96, h * 0.94), frenteMat);
  frente.position.z = d / 2 + 0.002;
  g.add(frente);

  const leds = {};
  ['PON', 'LOS', 'LAN'].forEach((nome, i) => {
    const mat = materialLed(COR_LED[nome], nome === 'LOS' ? 0.0 : 1.8);
    const led = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 14), mat);
    led.rotation.x = Math.PI / 2;
    led.position.set(w * 0.96 * ((110 + i * 145) / 512 - 0.5), h * 0.94 * (0.5 - 165 / 320), d / 2 + 0.012);
    led.userData.semContorno = true;
    g.add(led);
    leds[nome] = led;
  });

  // Portas em baixo: fibra (SC/APC) + 4 Ethernet
  const fundo = -h / 2 - 0.005;
  const sc = caixa(0.07, 0.04, 0.07, M.plasticoCinza);
  sc.position.set(-0.38, fundo, 0);
  g.add(sc);
  const rj = [];
  for (let i = 0; i < 4; i++) {
    const p = caixa(0.09, 0.03, 0.08, M.porta, { sombra: false });
    p.position.set(-0.12 + i * 0.13, fundo, 0);
    g.add(p);
    rj.push(new THREE.Vector3(-0.12 + i * 0.13, fundo - 0.02, 0));
  }

  // Interior (visível na vista em corte; preenchido pelas cenas 6–8)
  const interior = new THREE.Group();
  interior.name = 'interior';
  g.add(interior);

  g.userData = {
    numero,
    leds,
    carcaca,
    frente,
    interior,
    entradaFibra: new THREE.Vector3(-0.38, fundo - 0.03, 0),
    portaLan: rj[0],
    dimensoes: { w, h, d },
  };
  return g;
}

export function definirLed(ont, nome, cor, intensidade) {
  const led = ont.userData.leds[nome];
  if (!led) return;
  if (cor) led.material.emissive.set(cor);
  if (intensidade !== undefined) led.material.emissiveIntensity = intensidade;
}

export function repor(ont) {
  definirLed(ont, 'PON', COR_LED.PON, 1.8);
  definirLed(ont, 'LOS', COR_LED.LOS, 0);
  definirLed(ont, 'LAN', COR_LED.LAN, 1.8);
  ont.userData.carcaca.material.opacity = 1;
  ont.userData.frente.material.opacity = 1;
  ont.userData.interior.clear();
}

export function vistaCorte(ont, ligar = true, opacidade = 0.18) {
  const o = ligar ? opacidade : 1;
  ont.userData.carcaca.material.opacity = o;
  ont.userData.carcaca.material.depthWrite = !ligar;
  ont.userData.frente.material.opacity = ligar ? 0.08 : 1;
}
