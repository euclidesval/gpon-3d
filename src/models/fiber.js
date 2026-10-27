import * as THREE from 'three';
import { materiais } from '../core/materiais.js';

// Cabo de fibra monomodo: bainha amarela translúcida + núcleo fino onde viajam os impulsos.
export function criarFibra(pontos, { raio = 0.11, tensao = 0.25, nome = 'fibra' } = {}) {
  const M = materiais();
  const curva = new THREE.CatmullRomCurve3(pontos, false, 'catmullrom', tensao);
  const comprimento = curva.getLength();
  const segs = Math.max(24, Math.round(comprimento * 6));
  const g = new THREE.Group();
  g.name = nome;
  const bainhaMat = M.fibraBainha.clone();
  const bainha = new THREE.Mesh(new THREE.TubeGeometry(curva, segs, raio, 14, false), bainhaMat);
  bainha.renderOrder = 2;
  bainha.castShadow = true;
  const nucleo = new THREE.Mesh(new THREE.TubeGeometry(curva, segs, raio * 0.18, 6, false), M.fibraNucleo);
  nucleo.userData.semContorno = true;
  g.add(nucleo, bainha);
  g.userData = { curva, comprimento, bainha, nucleo };
  return g;
}
