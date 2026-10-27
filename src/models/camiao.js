import * as THREE from 'three';
import { materiais, caixa } from '../core/materiais.js';

// Camião de carga (analogia): cabine + caixa com 3 compartimentos e porta lateral removível.
export function criarCamiao({ corCabine = '#d9dde2' } = {}) {
  const M = materiais();
  const g = new THREE.Group();
  g.name = 'Camião';
  const pintura = new THREE.MeshStandardMaterial({ color: corCabine, metalness: 0.3, roughness: 0.45 });
  // Cabine (à frente = -x)
  const cabine = caixa(1.0, 1.1, 1.3, pintura);
  cabine.position.set(-1.55, 0.95, 0);
  const vidro = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.45), new THREE.MeshStandardMaterial({ color: '#1d2a36', metalness: 0.6, roughness: 0.1 }));
  vidro.rotation.y = -Math.PI / 2;
  vidro.position.set(-2.06, 1.2, 0);
  // Caixa de carga
  const largura = 2.4;
  const caixaCarga = new THREE.Group();
  caixaCarga.position.set(0.2, 1.15, 0);
  const fundo = caixa(largura, 0.06, 1.3, M.metalChassis);
  fundo.position.y = -0.62;
  const tecto = caixa(largura, 0.06, 1.3, pintura);
  tecto.position.y = 0.62;
  const tras = caixa(largura, 1.24, 0.05, pintura);
  tras.position.z = -0.63;
  const topoTras = caixa(0.05, 1.24, 1.3, pintura);
  topoTras.position.x = largura / 2;
  const topoFrente = caixa(0.05, 1.24, 1.3, pintura);
  topoFrente.position.x = -largura / 2;
  caixaCarga.add(fundo, tecto, tras, topoTras, topoFrente);
  // Divisórias (3 compartimentos)
  for (const x of [-largura / 6, largura / 6]) {
    const d = caixa(0.04, 1.2, 1.25, M.metalClaro);
    d.position.x = x;
    caixaCarga.add(d);
  }
  // Porta lateral (do lado da câmara, +z): fica translúcida para se ver a carga
  const portaMat = pintura.clone();
  portaMat.transparent = true;
  const porta = caixa(largura, 1.24, 0.05, portaMat);
  porta.position.z = 0.63;
  caixaCarga.add(porta);
  // Rodas
  const rodaGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.25, 20);
  for (const x of [-1.55, 0.6, 1.1]) {
    for (const z of [-0.62, 0.62]) {
      const r = new THREE.Mesh(rodaGeo, M.plasticoPreto);
      r.rotation.x = Math.PI / 2;
      r.position.set(x, 0.32, z);
      r.castShadow = true;
      g.add(r);
    }
  }
  // Antena do rádio
  const antena = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), M.metalEscuro);
  antena.position.set(-1.4, 1.8, 0.4);
  g.add(cabine, vidro, caixaCarga, antena);
  // Centros dos 3 compartimentos (coordenadas locais do camião)
  const compartimentos = [-largura / 3, 0, largura / 3].map((x) => new THREE.Vector3(0.2 + x, 1.0, 0.1));
  g.userData = { porta, caixaCarga, compartimentos, topoAntena: new THREE.Vector3(-1.4, 2.1, 0.4) };
  return g;
}

// Semáforo (analogia do T-CONT): três luzes, por defeito vermelho.
export function criarSemaforo() {
  const M = materiais();
  const g = new THREE.Group();
  g.name = 'Semáforo';
  const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 10), M.metalEscuro);
  poste.position.y = 1.2;
  const caixaLuz = caixa(0.36, 0.95, 0.3, M.plasticoPreto);
  caixaLuz.position.y = 2.75;
  g.add(poste, caixaLuz);
  const luzes = {};
  [['vermelho', '#ff3b30', 0.3], ['amarelo', '#ffcc00', 0], ['verde', '#34c759', -0.3]].forEach(([nome, cor, dy]) => {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshStandardMaterial({ color: '#111', emissive: cor, emissiveIntensity: nome === 'vermelho' ? 2.5 : 0.05 }));
    l.position.set(0, 2.75 + dy, 0.16);
    l.userData.semContorno = true;
    g.add(l);
    luzes[nome] = l;
  });
  g.userData.luzes = luzes;
  return g;
}

// Torre de rádio (analogia do OMCI).
export function criarTorreRadio() {
  const M = materiais();
  const g = new THREE.Group();
  g.name = 'Rádio';
  const altura = 6;
  for (const [x, z] of [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, altura, 6), M.metalClaro);
    p.position.set(x * 0.6, altura / 2, z * 0.6);
    p.rotation.z = -x * 0.08;
    p.rotation.x = z * 0.08;
    g.add(p);
  }
  for (let y = 0.8; y < altura; y += 0.9) {
    const anel = new THREE.Mesh(new THREE.TorusGeometry(0.28 * (1 - y / (altura * 1.6)), 0.02, 6, 16), M.metalClaro);
    anel.rotation.x = Math.PI / 2;
    anel.position.y = y;
    g.add(anel);
  }
  const topo = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), new THREE.MeshStandardMaterial({ color: '#ff3b30', emissive: '#ff3b30', emissiveIntensity: 2 }));
  topo.position.y = altura + 0.1;
  g.add(topo);
  g.userData.topo = new THREE.Vector3(0, altura + 0.1, 0);
  return g;
}
