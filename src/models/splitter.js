import * as THREE from 'three';
import { materiais, caixa } from '../core/materiais.js';
import { texturaTexto } from '../core/texturas.js';

// Splitter óptico 1:8 (passivo): armário de rua + caixa do splitter com 1 entrada e 8 saídas.
// Não tem LEDs nem alimentação — é passivo.
export function criarSplitter() {
  const M = materiais();
  const g = new THREE.Group();
  g.name = 'Splitter';

  // Armário de rua (pedestal)
  const armario = caixa(1.3, 1.25, 0.7, M.armario);
  armario.position.y = 0.625;
  g.add(armario);
  const tampa = caixa(1.38, 0.06, 0.78, M.armario);
  tampa.position.y = 1.28;
  g.add(tampa);
  const sapata = caixa(1.45, 0.1, 0.85, M.betao);
  sapata.position.y = 0.05;
  g.add(sapata);
  // Porta com ranhuras
  for (let i = 0; i < 5; i++) {
    const r = caixa(0.9, 0.02, 0.01, M.metalEscuro, { sombra: false });
    r.position.set(0, 0.35 + i * 0.12, 0.355);
    g.add(r);
  }

  // Caixa do splitter
  const yS = 1.48;
  const corpo = caixa(1.1, 0.3, 0.42, new THREE.MeshStandardMaterial({ color: '#30353b', metalness: 0.4, roughness: 0.45 }));
  corpo.position.y = yS;
  g.add(corpo);
  const tex = texturaTexto('SPLITTER 1:8', { largura: 512, altura: 96, cor: '#f0f3f6', tamanho: 54, peso: 700 });
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.15), new THREE.MeshStandardMaterial({ map: tex, transparent: true, color: tex ? '#fff' : '#ccc' }));
  placa.position.set(0, yS + 0.02, 0.212);
  g.add(placa);

  // Entrada (lado esquerdo)
  const adaptadorEnt = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 12), M.metalClaro);
  adaptadorEnt.rotation.z = Math.PI / 2;
  adaptadorEnt.position.set(-0.61, yS, 0);
  g.add(adaptadorEnt);

  // 8 saídas (lado direito, em duas filas de 4)
  const saidas = [];
  for (let i = 0; i < 8; i++) {
    const fila = Math.floor(i / 4);
    const col = i % 4;
    const ad = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 10), M.metalClaro);
    ad.rotation.z = Math.PI / 2;
    const p = new THREE.Vector3(0.6, yS + 0.08 - fila * 0.14, -0.15 + col * 0.1);
    ad.position.copy(p);
    g.add(ad);
    saidas.push(new THREE.Vector3(p.x + 0.06, p.y, p.z));
  }

  g.userData = {
    entrada: new THREE.Vector3(-0.68, yS, 0),
    saidas,
    corpo,
    topo: new THREE.Vector3(0, yS + 0.3, 0),
  };
  return g;
}
