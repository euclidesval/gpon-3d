import * as THREE from 'three';
import { TEX } from './texturas.js';

// Materiais PBR partilhados (criados uma vez).
let m = null;

export function materiais() {
  if (m) return m;
  m = {
    metalEscuro: new THREE.MeshStandardMaterial({ color: '#1c1f24', metalness: 0.7, roughness: 0.45 }),
    metalChassis: new THREE.MeshStandardMaterial({ color: '#59616b', metalness: 0.75, roughness: 0.38 }),
    metalClaro: new THREE.MeshStandardMaterial({ color: '#b9c0c7', metalness: 0.8, roughness: 0.3 }),
    carta: new THREE.MeshStandardMaterial({ color: '#2b3038', metalness: 0.55, roughness: 0.5 }),
    plasticoPreto: new THREE.MeshStandardMaterial({ color: '#141518', metalness: 0.1, roughness: 0.55 }),
    plasticoBranco: new THREE.MeshPhysicalMaterial({ color: '#f1f1ee', metalness: 0, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
    plasticoCinza: new THREE.MeshStandardMaterial({ color: '#7d838a', metalness: 0.1, roughness: 0.6 }),
    porta: new THREE.MeshStandardMaterial({ color: '#0c0d0f', metalness: 0.4, roughness: 0.6 }),
    betao: new THREE.MeshStandardMaterial({ color: '#ffffff', map: TEX.betao(), roughness: 0.92, metalness: 0 }),
    paredeCasa: new THREE.MeshStandardMaterial({ color: '#e9e0d2', roughness: 0.9 }),
    paredeInterior: new THREE.MeshStandardMaterial({ color: '#f3efe6', roughness: 0.95 }),
    telhado: new THREE.MeshStandardMaterial({ color: '#8a3f2e', roughness: 0.75 }),
    soalho: new THREE.MeshStandardMaterial({ color: '#ffffff', map: TEX.soalho(), roughness: 0.7 }),
    madeira: new THREE.MeshStandardMaterial({ color: '#7a5636', roughness: 0.6 }),
    vidro: new THREE.MeshPhysicalMaterial({ color: '#9fb7c9', metalness: 0, roughness: 0.05, transparent: true, opacity: 0.35 }),
    ecraDesligado: new THREE.MeshStandardMaterial({ color: '#0a0c10', metalness: 0.2, roughness: 0.15 }),
    ecraLigado: new THREE.MeshStandardMaterial({ color: '#20262e', emissive: '#c9d6e3', emissiveIntensity: 0.35, roughness: 0.2 }),
    caboCinza: new THREE.MeshStandardMaterial({ color: '#b7bcc2', roughness: 0.6 }),
    // Cabo de fibra monomodo: bainha amarela translúcida para se verem os impulsos lá dentro.
    fibraBainha: new THREE.MeshPhysicalMaterial({
      color: '#f2c94c',
      roughness: 0.35,
      metalness: 0,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      clearcoat: 0.4,
    }),
    fibraNucleo: new THREE.MeshStandardMaterial({ color: '#fff6d8', emissive: '#fff3c4', emissiveIntensity: 0.15, roughness: 0.2 }),
    armario: new THREE.MeshStandardMaterial({ color: '#7f8a80', metalness: 0.5, roughness: 0.55 }),
    relva: new THREE.MeshStandardMaterial({ color: '#ffffff', map: TEX.relva(), roughness: 1 }),
    asfalto: new THREE.MeshStandardMaterial({ color: '#ffffff', map: TEX.asfalto(), roughness: 0.95 }),
    passeio: new THREE.MeshStandardMaterial({ color: '#ffffff', map: TEX.passeio(), roughness: 0.9 }),
    terreno: new THREE.MeshStandardMaterial({ color: '#ffffff', map: TEX.terreno(), roughness: 1 }),
    grelha: new THREE.MeshStandardMaterial({ color: '#ffffff', map: TEX.grelha(), metalness: 0.5, roughness: 0.6 }),
  };
  for (const mat of Object.values(m)) mat.userData.partilhado = true;
  return m;
}

// LED: material próprio para poder mudar cor/intensidade individualmente.
export function materialLed(cor = '#22ff66', intensidade = 1.6) {
  return new THREE.MeshStandardMaterial({ color: '#111', emissive: cor, emissiveIntensity: intensidade, roughness: 0.3 });
}

export function caixa(w, h, d, material, { sombra = true } = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.castShadow = sombra;
  mesh.receiveShadow = true;
  return mesh;
}
