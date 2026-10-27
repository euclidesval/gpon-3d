import * as THREE from 'three';
import { caixa } from '../core/materiais.js';
import { aleatorio } from '../core/texturas.js';

// Elementos de contexto (não didácticos): árvores, candeeiros e prédios ao fundo.
export function criarCenario(rede) {
  const r = aleatorio(41);
  const tronco = new THREE.MeshStandardMaterial({ color: '#5a4030', roughness: 0.9 });
  const copas = ['#3f6b3a', '#4b7a3f', '#36603a'].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true }));

  const arvore = (x, z, esc = 1) => {
    const g = new THREE.Group();
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * esc, 0.18 * esc, 1.6 * esc, 7), tronco);
    t.position.y = 0.8 * esc;
    t.castShadow = true;
    g.add(t);
    const n = 2 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) {
      const c = new THREE.Mesh(new THREE.IcosahedronGeometry((0.9 + r() * 0.5) * esc, 1), copas[Math.floor(r() * copas.length)]);
      c.position.set((r() - 0.5) * 0.8 * esc, (1.9 + i * 0.6) * esc, (r() - 0.5) * 0.8 * esc);
      c.castShadow = true;
      g.add(c);
    }
    g.position.set(x, 0, z);
    g.rotation.y = r() * Math.PI * 2;
    rede.add(g);
  };

  // Árvores atrás das casas e à volta da central
  for (let x = -30; x <= 44; x += 3.2 + r() * 2.5) arvore(x + r(), -7.5 - r() * 3, 0.9 + r() * 0.5);
  for (const [x, z] of [[-24, 1], [-25, -4], [-12, -3], [-6, -2.5], [4, -3.5], [38, 1], [40, -3]]) arvore(x, z, 1 + r() * 0.3);

  // Prédios baixos ao fundo (silhuetas)
  const predio = new THREE.MeshStandardMaterial({ color: '#56606a', roughness: 0.95 });
  for (let x = -40; x <= 52; x += 7 + r() * 5) {
    const h = 4 + r() * 7;
    const b = caixa(5 + r() * 3, h, 5, predio);
    b.position.set(x, h / 2, -34 - r() * 8);
    rede.add(b);
  }
}
