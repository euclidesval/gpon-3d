import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// Rótulos HTML ancorados a objectos 3D (legíveis; não são texto 3D).
export function criarRotulo(html, { classe = 'rotulo', visivel = false } = {}) {
  const el = document.createElement('div');
  el.className = classe;
  el.innerHTML = html;
  const obj = new CSS2DObject(el);
  obj.visible = visivel;
  obj.userData.semContorno = true;
  obj.center.set(0.5, 1);
  return obj;
}
