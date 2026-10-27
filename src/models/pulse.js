import * as THREE from 'three';
import gsap from 'gsap';

// Impulso de luz que viaja dentro da fibra. Material emissivo forte → apanhado pelo bloom.
export function criarImpulso(cor, { raio = 0.13, comprimento = 0.8 } = {}) {
  const mat = new THREE.MeshStandardMaterial({ color: cor, emissive: cor, emissiveIntensity: 3.2, roughness: 0.3, transparent: true, opacity: 1 });
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(raio, comprimento, 6, 12), mat);
  mesh.userData.semContorno = true;
  mesh.name = 'impulso';
  return mesh;
}

const _p = new THREE.Vector3();
const _t = new THREE.Vector3();
const _eixo = new THREE.Vector3(0, 1, 0);

// Coloca o objecto no ponto u (0..1) da curva, alinhado com a tangente.
export function colocarNaCurva(obj, curva, u) {
  const v = THREE.MathUtils.clamp(u, 0, 1);
  curva.getPointAt(v, _p);
  curva.getTangentAt(v, _t);
  obj.position.copy(_p);
  obj.quaternion.setFromUnitVectors(_eixo, _t.normalize());
}

// Tween que faz o objecto percorrer a curva de `de` até `ate` (0..1).
// O objecto só está visível durante a viagem (a não ser que `ficar` seja true):
// assim o estado é sempre coerente, mesmo quando se salta para um ponto qualquer da timeline.
export function viajar(obj, curva, { de = 0, ate = 1, duracao = 1.5, ease = 'none', alinhar = true, ficar = false, ...resto } = {}) {
  const estado = { u: de };
  return gsap.fromTo(
    estado,
    { u: de },
    {
      u: ate,
      duration: duracao,
      ease,
      immediateRender: false,
      ...resto,
      onUpdate() {
        const p = this.progress();
        obj.visible = ficar ? p > 0 : p > 0 && p < 1;
        if (alinhar) colocarNaCurva(obj, curva, estado.u);
        else curva.getPointAt(THREE.MathUtils.clamp(estado.u, 0, 1), obj.position);
        resto.onUpdate?.call(this);
      },
    },
  );
}

// Explosão de partículas (pacote descartado, colisão).
export function criarParticulas(cor, n = 40, { tamanho = 0.12 } = {}) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  const dir = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const b = Math.acos(2 * Math.random() - 1);
    dir[i * 3] = Math.sin(b) * Math.cos(a);
    dir[i * 3 + 1] = Math.abs(Math.cos(b)) * 0.8 + 0.2;
    dir[i * 3 + 2] = Math.sin(b) * Math.sin(a);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: cor, size: tamanho, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(geo, mat);
  pts.userData = { dir, n };
  pts.visible = false;
  pts.userData.semContorno = true;
  return pts;
}

export function explodir(pts, { raio = 1.2, duracao = 0.9 } = {}) {
  const { dir, n } = pts.userData;
  const pos = pts.geometry.attributes.position;
  const estado = { k: 0 };
  return gsap.fromTo(
    estado,
    { k: 0 },
    {
      k: 1,
      duration: duracao,
      ease: 'power2.out',
      immediateRender: false,
      onUpdate() {
        pts.visible = estado.k > 0 && estado.k < 1;
        for (let i = 0; i < n; i++) {
          pos.array[i * 3] = dir[i * 3] * raio * estado.k;
          pos.array[i * 3 + 1] = dir[i * 3 + 1] * raio * estado.k - 0.6 * estado.k * estado.k;
          pos.array[i * 3 + 2] = dir[i * 3 + 2] * raio * estado.k;
        }
        pos.needsUpdate = true;
        pts.material.opacity = 1 - estado.k;
      },
    },
  );
}
