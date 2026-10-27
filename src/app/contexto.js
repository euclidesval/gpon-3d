import * as THREE from 'three';
import gsap from 'gsap';
import { criarRotulo } from '../core/rotulos.js';

// Contexto passado às cenas: acesso à rede, ao grupo temporário, à câmara e à UI.
// O `motor` e a `ui` são opcionais (nos testes não há WebGL nem interface).
export function criarContexto({ mundo, camera, controlos = null, motor = null, ui = null, conteudo }) {
  const atualizadores = new Set();
  const destaqueAtual = { ids: [] };

  const ctx = {
    rede: mundo.rede,
    temp: mundo.temporario,
    mundo,
    camera,
    conteudo,
    dados: null,
    sentido: null,
    analogia: false,
    ui,

    adicionar(obj, { brilho = false, pai = null } = {}) {
      (pai ?? mundo.temporario).add(obj);
      if (brilho) motor?.brilhar(obj);
      return obj;
    },

    rotulo(html, posicao, { classe = 'rotulo', pai = null, visivel = false } = {}) {
      const r = criarRotulo(html, { classe, visivel });
      r.position.copy(posicao);
      (pai ?? mundo.temporario).add(r);
      return r;
    },

    // Destaca actores (ids de cenas.pt.json → objectos 3D) e a lista «Quem faz o quê».
    destacar(ids = []) {
      const lista = Array.isArray(ids) ? ids : [ids];
      destaqueAtual.ids = lista;
      // Aceita ids de actores ou objectos 3D (ex.: a fibra).
      const objs = lista.flatMap((id) => (typeof id === 'string' ? (mundo.rede.actores[id] ?? []) : [id]));
      if (lista.includes('dba')) mundo.rede.olt.userData.dba.visible = true;
      motor?.destacar(objs);
      ui?.destacarActores?.(lista.filter((id) => typeof id === 'string'));
    },

    // Devolve um callback para usar em timeline.call()
    destacarEm(ids) {
      return () => ctx.destacar(ids);
    },

    camaraPara(posicao, alvo, duracao = 1.6, ease = 'power2.inOut') {
      const tl = gsap.timeline();
      const p = Array.isArray(posicao) ? { x: posicao[0], y: posicao[1], z: posicao[2] } : posicao;
      const a = Array.isArray(alvo) ? { x: alvo[0], y: alvo[1], z: alvo[2] } : alvo;
      if (duracao <= 0) {
        camera.position.set(p.x, p.y, p.z);
        controlos?.target.set(a.x, a.y, a.z);
        return tl;
      }
      tl.to(camera.position, { ...p, duration: duracao, ease, overwrite: 'auto' }, 0);
      if (controlos) tl.to(controlos.target, { ...a, duration: duracao, ease, overwrite: 'auto' }, 0);
      return tl;
    },

    // Mesma coisa, mas para usar dentro da timeline de uma cena.
    tweenCamara(posicao, alvo, duracao = 1.6, ease = 'power2.inOut') {
      const tl = gsap.timeline();
      tl.to(camera.position, { x: posicao[0], y: posicao[1], z: posicao[2], duration: duracao, ease }, 0);
      if (controlos) tl.to(controlos.target, { x: alvo[0], y: alvo[1], z: alvo[2], duration: duracao, ease }, 0);
      return tl;
    },

    faixa(texto, tipo = '') {
      return () => ui?.faixa?.(texto, tipo);
    },

    aoAtualizar(f) {
      atualizadores.add(f);
    },

    atualizar(dt, t) {
      for (const f of atualizadores) f(dt, t);
    },

    sobreposicao(html, classe = '') {
      return ui?.sobreposicao?.(html, classe) ?? null;
    },

    limpar() {
      atualizadores.clear();
      motor?.bloom.selection.clear();
      for (const filho of [...mundo.temporario.children]) {
        mundo.temporario.remove(filho);
        filho.traverse((o) => {
          // Rótulos HTML filhos de outros objectos não recebem o evento 'removed': tirar do DOM.
          if (o.isCSS2DObject) o.element.remove();
          if (o.isMesh || o.isPoints || o.isLine) {
            o.geometry?.dispose();
            if (o.material && !o.material.userData?.partilhado) o.material.dispose?.();
          }
        });
      }
      mundo.rede.repor();
      ui?.limparCena?.();
      ctx.destacar([]);
    },

    vec(x, y, z) {
      return new THREE.Vector3(x, y, z);
    },
  };
  return ctx;
}
