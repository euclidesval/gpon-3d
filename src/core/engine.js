import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  SelectiveBloomEffect,
  OutlineEffect,
  ToneMappingEffect,
  ToneMappingMode,
  BlendFunction,
  KernelSize,
} from 'postprocessing';
import { CORES } from './colors.js';
import { MonitorQualidade } from './quality.js';

// Motor: renderer, câmara, controlos, ambiente, pós-processamento e ciclo de desenho.
export class Motor {
  constructor(contentor, { qualidade = 'alta', captura = false } = {}) {
    this.contentor = contentor;
    this.renderer = new THREE.WebGLRenderer({ powerPreference: 'high-performance', antialias: false, stencil: false, depth: false, preserveDrawingBuffer: captura });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap; // sombras suaves (radius) — PCFSoft foi removido no three r18x
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    contentor.appendChild(this.renderer.domElement);

    this.rotulos = new CSS2DRenderer();
    this.rotulos.domElement.className = 'camada-rotulos';
    contentor.appendChild(this.rotulos.domElement);

    this.cena = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 400);
    this.camera.position.set(6, 34, 52);

    this.controlos = new OrbitControls(this.camera, this.renderer.domElement);
    this.controlos.enableDamping = true;
    this.controlos.dampingFactor = 0.08;
    this.controlos.maxPolarAngle = Math.PI * 0.47;
    this.controlos.minDistance = 2;
    this.controlos.maxDistance = 140;
    this.controlos.target.set(6, 0, 0);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.cena.environmentIntensity = 0.45;

    this.#montarComposer();
    this.qualidade = new MonitorQualidade((nivel) => this.aplicarQualidade(nivel));
    this.aplicarQualidade(qualidade);
    if (captura) this.qualidade.ativo = false;

    this.relogio = new THREE.Timer();
    this.relogio.connect?.(document);
    this.aoAtualizar = new Set();
    window.addEventListener('resize', () => this.redimensionar());
    this.redimensionar();
  }

  #montarComposer() {
    this.composer = new EffectComposer(this.renderer, { multisampling: 4, frameBufferType: THREE.HalfFloatType });
    this.composer.addPass(new RenderPass(this.cena, this.camera));
    // Bloom só na luz que viaja na fibra (selecção explícita).
    this.bloom = new SelectiveBloomEffect(this.cena, this.camera, {
      mipmapBlur: true,
      intensity: 2.4,
      luminanceThreshold: 0.0,
      luminanceSmoothing: 0.25,
      radius: 0.7,
    });
    this.bloom.ignoreBackground = true;
    // Contorno luminoso do actor activo.
    this.contorno = new OutlineEffect(this.cena, this.camera, {
      blendFunction: BlendFunction.SCREEN,
      edgeStrength: 4,
      pulseSpeed: 0.35,
      visibleEdgeColor: new THREE.Color(CORES.destaque).getHex(),
      hiddenEdgeColor: 0x8a7a4a,
      blur: true,
      kernelSize: KernelSize.SMALL,
      xRay: true,
    });
    this.tonemap = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    this.passoEfeitos = null;
  }

  // O último passo do composer é o que desenha no ecrã: recria-se em vez de o desactivar.
  #montarEfeitos(comBloom) {
    if (this.passoEfeitos) this.composer.removePass(this.passoEfeitos);
    const efeitos = comBloom ? [this.bloom, this.contorno, this.tonemap] : [this.contorno, this.tonemap];
    this.passoEfeitos = new EffectPass(this.camera, ...efeitos);
    this.composer.addPass(this.passoEfeitos);
  }

  aplicarQualidade(nivel) {
    this.nivel = nivel;
    this.qualidade.definir(nivel);
    const alta = nivel === 'alta';
    const baixa = nivel === 'baixa';
    this.renderer.shadowMap.enabled = alta;
    this.cena.traverse((o) => {
      if (o.material) o.material.needsUpdate = true;
    });
    this.#montarEfeitos(!baixa);
    this.composer.multisampling = alta ? 4 : 0;
    this.renderer.setPixelRatio(baixa ? 1 : Math.min(window.devicePixelRatio || 1, alta ? 2 : 1.5));
    this.redimensionar();
    document.documentElement.dataset.qualidade = nivel;
  }

  brilhar(obj) {
    obj.traverse((o) => o.isMesh && this.bloom.selection.add(o));
  }

  apagarBrilho(obj) {
    obj.traverse((o) => o.isMesh && this.bloom.selection.delete(o));
  }

  destacar(objectos) {
    const malhas = [];
    for (const obj of objectos) obj.traverse((o) => o.isMesh && o.visible && !o.userData.semContorno && malhas.push(o));
    this.contorno.selection.set(malhas);
  }

  redimensionar() {
    const w = this.contentor.clientWidth || window.innerWidth;
    const h = this.contentor.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.rotulos.setSize(w, h);
  }

  iniciar() {
    this.renderer.setAnimationLoop(() => {
      this.relogio.update();
      const bruto = this.relogio.getDelta();
      const dt = Math.min(bruto, 0.1);
      const t = this.relogio.getElapsed();
      this.qualidade.amostra(bruto);
      for (const f of this.aoAtualizar) f(dt, t);
      this.controlos.update();
      this.composer.render(dt);
      this.rotulos.render(this.cena, this.camera);
    });
  }
}
