import * as THREE from 'three';
import { materiais, caixa } from '../core/materiais.js';

// Técnico (silhueta simples) com portátil, de pé junto à OLT.
export function criarTecnico() {
  const M = materiais();
  const g = new THREE.Group();
  g.name = 'Técnico';
  const roupa = new THREE.MeshStandardMaterial({ color: '#3b4a5e', roughness: 0.8 });
  const pele = new THREE.MeshStandardMaterial({ color: '#8a6a55', roughness: 0.7 });
  const corpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.75, 6, 12), roupa);
  corpo.position.y = 1.15;
  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), pele);
  cabeca.position.y = 1.78;
  const pernas = [-0.1, 0.1].map((x) => {
    const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.6, 4, 8), roupa);
    p.position.set(x, 0.5, 0);
    return p;
  });
  const bracos = [-1, 1].map((l) => {
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.45, 4, 8), roupa);
    b.position.set(l * 0.26, 1.2, 0.18);
    b.rotation.x = -1.0;
    return b;
  });
  const portatil = new THREE.Group();
  const base = caixa(0.42, 0.025, 0.3, M.metalChassis);
  const tampa = caixa(0.42, 0.28, 0.02, M.metalChassis);
  tampa.position.set(0, 0.14, -0.15);
  tampa.rotation.x = -0.3;
  const ecra = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.24), new THREE.MeshStandardMaterial({ color: '#111', emissive: '#c9a8ff', emissiveIntensity: 0.6 }));
  ecra.position.set(0, 0.14, -0.138);
  ecra.rotation.x = -0.3;
  portatil.add(base, tampa, ecra);
  portatil.position.set(0, 1.18, 0.42);
  g.add(corpo, cabeca, ...pernas, ...bracos, portatil);
  g.traverse((o) => o.isMesh && (o.castShadow = true));
  g.userData.ecra = ecra;
  return g;
}
