import * as THREE from 'three';
import gsap from 'gsap';
import { criarImpulso, criarParticulas, explodir, viajar } from '../models/pulse.js';

// Ajudas comuns às cenas.

// Pacote = impulso de luz + etiqueta HTML por cima (opcional). Começa invisível.
export function criarPacote(ctx, cor, etiqueta = null, { classe = 'rotulo-pacote', raio = 0.15, comprimento = 0.9, rotuloVisivel = true } = {}) {
  const imp = criarImpulso(cor, { raio, comprimento });
  imp.visible = false;
  ctx.adicionar(imp, { brilho: true });
  if (etiqueta) {
    const r = ctx.rotulo(etiqueta, new THREE.Vector3(0, 0, 0), { classe, pai: imp, visivel: rotuloVisivel });
    r.position.set(0, 0.35, 0);
    r.center.set(0.5, 1);
    imp.userData.rotulo = r;
  }
  return imp;
}

// Faz o pacote percorrer várias curvas seguidas. `sentido` 'down' (0→1) ou 'up' (1→0).
export function percorrer(pacote, curvas, duracoes, sentido = 'down') {
  const tl = gsap.timeline();
  curvas.forEach((c, i) => {
    const [de, ate] = sentido === 'down' ? [0, 1] : [1, 0];
    tl.add(viajar(pacote, c, { de, ate, duracao: duracoes[i], ease: 'none' }));
  });
  return tl;
}

// Ponto de chegada de uma curva (início ou fim).
export function ponto(curva, u) {
  return curva.getPointAt(u, new THREE.Vector3());
}

// Explosão de partículas num ponto.
export function rebentar(ctx, cor, posicao, opcoes = {}) {
  const p = criarParticulas(cor, opcoes.n ?? 40, { tamanho: opcoes.tamanho ?? 0.14 });
  p.position.copy(posicao);
  ctx.adicionar(p);
  return explodir(p, { raio: opcoes.raio ?? 1.2, duracao: opcoes.duracao ?? 0.9 });
}

// Marca (✓ / ✕ / ⚠) que aparece e desaparece sobre um ponto.
export function marca(ctx, html, classe, posicao, { duracao = 1.4 } = {}) {
  const r = ctx.rotulo(html, posicao, { classe: `marca ${classe}` });
  const tl = gsap.timeline();
  tl.set(r, { visible: true });
  tl.fromTo(r.element, { opacity: 0 }, { opacity: 1, duration: 0.25 });
  tl.to(r.element, { opacity: 0, duration: 0.3 }, duracao);
  tl.set(r, { visible: false });
  return tl;
}

// Clarão esférico (brilho) num ponto.
export function clarao(ctx, cor, posicao, { raio = 0.9, duracao = 0.8 } = {}) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(raio, 24, 16),
    new THREE.MeshStandardMaterial({ color: cor, emissive: cor, emissiveIntensity: 4, transparent: true, opacity: 0.9, depthWrite: false }),
  );
  m.position.copy(posicao);
  m.visible = false;
  m.userData.semContorno = true;
  ctx.adicionar(m, { brilho: true });
  const tl = gsap.timeline();
  tl.set(m, { visible: true });
  tl.fromTo(m.scale, { x: 0.2, y: 0.2, z: 0.2 }, { x: 1.4, y: 1.4, z: 1.4, duration: duracao * 0.5, ease: 'power2.out' });
  tl.to(m.material, { opacity: 0, duration: duracao * 0.5 }, '>-0.1');
  tl.set(m, { visible: false });
  return tl;
}

// Pisca um LED da ONT.
export function piscarLed(ont, nome = 'PON', cor = '#33ff77', vezes = 3) {
  const led = ont.userData.leds[nome];
  const tl = gsap.timeline();
  tl.set(led.material.emissive, { r: new THREE.Color(cor).r, g: new THREE.Color(cor).g, b: new THREE.Color(cor).b });
  tl.to(led.material, { emissiveIntensity: 6, duration: 0.12, yoyo: true, repeat: vezes * 2 - 1 });
  tl.set(led.material, { emissiveIntensity: 1.8 });
  return tl;
}

// Mostra um rótulo da rede (e acende-o).
export function mostrarRotulo(r, aceso = true) {
  const tl = gsap.timeline();
  tl.set(r, { visible: true });
  tl.call(() => r.element.classList.toggle('aceso', aceso));
  tl.fromTo(r.element, { opacity: 0 }, { opacity: 1, duration: 0.4 });
  return tl;
}

export function esconderRotulo(r) {
  const tl = gsap.timeline();
  tl.to(r.element, { opacity: 0, duration: 0.3 });
  tl.set(r, { visible: false });
  tl.call(() => r.element.classList.remove('aceso'));
  return tl;
}

// Abanão de câmara (impacto).
// (Nota: o CSS2DRenderer controla o transform dos rótulos — animar só a opacidade.)
export function abanar(camera, forca = 0.18, vezes = 6) {
  const tl = gsap.timeline();
  const desvio = { k: 0 };
  let base = null;
  tl.call(() => (base = camera.position.clone()));
  tl.to(desvio, {
    k: 1,
    duration: 0.05 * vezes,
    ease: 'none',
    onUpdate() {
      if (!base) return;
      const f = forca * (1 - desvio.k);
      const s = Math.sin(desvio.k * Math.PI * vezes);
      camera.position.set(base.x + s * f, base.y - s * f * 0.5, base.z);
    },
  });
  tl.call(() => base && camera.position.copy(base));
  return tl;
}

// Linha grossa e visível (as linhas WebGL têm sempre 1 px): tubo contínuo ou tracejado ao longo de uma curva.
export function tuboLinha(curva, cor, { raio = 0.06, tracejado = false, traco = 0.6, espaco = 0.35, emissivo = 1.2, opacidade = 1 } = {}) {
  const mat = new THREE.MeshStandardMaterial({ color: cor, emissive: cor, emissiveIntensity: emissivo, roughness: 0.4, transparent: opacidade < 1, opacity: opacidade });
  const g = new THREE.Group();
  const comp = curva.getLength();
  if (!tracejado) {
    const m = new THREE.Mesh(new THREE.TubeGeometry(curva, Math.max(16, Math.round(comp * 8)), raio, 8, false), mat);
    m.userData.semContorno = true;
    g.add(m);
  } else {
    for (let s = 0; s < comp; s += traco + espaco) {
      const a = s / comp;
      const b = Math.min(1, (s + traco) / comp);
      const pts = [0, 0.33, 0.66, 1].map((f) => curva.getPointAt(a + (b - a) * f));
      const seg = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 4, raio, 6, false), mat);
      seg.userData.semContorno = true;
      g.add(seg);
    }
  }
  g.userData.material = mat;
  return g;
}
