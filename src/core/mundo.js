import * as THREE from 'three';
import { TEX } from './texturas.js';
import { criarRede } from '../network/network.js';

// Cena base: céu, nevoeiro, luzes (com sombras suaves) e a rede.
export function criarMundo(cena) {
  const ceu = TEX.ceu();
  cena.background = ceu ?? new THREE.Color('#1a2a3c');
  cena.fog = new THREE.Fog('#3b4d5f', 90, 220);

  const hemi = new THREE.HemisphereLight('#c9dcf2', '#3b3a30', 0.75);
  cena.add(hemi);

  const sol = new THREE.DirectionalLight('#ffe2bf', 2.3);
  sol.position.set(-18, 34, 26);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  sol.shadow.camera.left = -48;
  sol.shadow.camera.right = 52;
  sol.shadow.camera.top = 30;
  sol.shadow.camera.bottom = -30;
  sol.shadow.camera.near = 5;
  sol.shadow.camera.far = 110;
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.03;
  sol.shadow.radius = 4;
  sol.target.position.set(6, 0, 0);
  sol.shadow.camera.left = -40;
  sol.shadow.camera.right = 44;
  cena.add(sol, sol.target);

  // Luz de enchimento fria, sem sombra
  const enchimento = new THREE.DirectionalLight('#9fc3ff', 0.5);
  enchimento.position.set(30, 18, -20);
  cena.add(enchimento);

  // Luz interior da central
  const luzCentral = new THREE.PointLight('#fff4e0', 6, 12, 1.6);
  luzCentral.position.set(-18, 3.6, 0);
  cena.add(luzCentral);

  const rede = criarRede();
  cena.add(rede.grupo);

  // Grupo para os objectos temporários de cada cena (limpo ao mudar de passo/cena).
  const temporario = new THREE.Group();
  temporario.name = 'Temporário';
  cena.add(temporario);

  return { rede, temporario, luzes: { hemi, sol, enchimento, luzCentral } };
}
