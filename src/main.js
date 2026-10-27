import './styles/main.css';
import conteudo from './content/cenas.pt.json';
import { Motor } from './core/engine.js';
import { criarMundo } from './core/mundo.js';
import { criarContexto } from './app/contexto.js';
import { Apresentacao, ligarTeclado } from './app/apresentacao.js';
import { Interface } from './ui/ui.js';
import { CENAS } from './scenes/index.js';

function lerHash() {
  const p = new URLSearchParams(location.hash.replace(/^#/, ''));
  return {
    cena: p.has('cena') ? Number(p.get('cena')) : 0,
    passo: p.has('passo') ? Number(p.get('passo')) : 0,
    t: p.has('t') ? Number(p.get('t')) : null,
    sentido: p.get('sentido'),
    analogia: p.get('analogia') === '1',
    cam: p.get('cam'),
  };
}

function suportaWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function arrancar() {
  const carregar = document.getElementById('carregar');
  if (!suportaWebGL()) {
    carregar.innerHTML = '<div class="erro-webgl">Este browser não suporta WebGL, necessário para a apresentação 3D. Experimente uma versão recente do Chrome, Edge ou Firefox.</div>';
    return;
  }
  const params = new URLSearchParams(location.search);
  const motor = new Motor(document.getElementById('palco'), { qualidade: params.get('qualidade') ?? 'alta', captura: params.has('captura') });
  const mundo = criarMundo(motor.cena);
  const ui = new Interface(document.getElementById('ui'), conteudo);
  const ctx = criarContexto({ mundo, camera: motor.camera, controlos: motor.controlos, motor, ui, conteudo });
  motor.aoAtualizar.add((dt, t) => ctx.atualizar(dt, t));
  // LEDs da OLT a piscar suavemente
  const leds = mundo.rede.olt.userData.leds;
  motor.aoAtualizar.add((dt, t) => {
    leds.forEach((l, i) => (l.material.emissiveIntensity = 1.2 + Math.max(0, Math.sin(t * 3 + i * 1.7)) * 1.4));
  });

  const app = new Apresentacao({
    cenas: CENAS,
    conteudo,
    ctx,
    ui,
    aoMudar(e) {
      const h = `#cena=${e.indice}${e.passo ? `&passo=${e.passo}` : ''}`;
      if (location.hash !== h) history.replaceState(null, '', h);
    },
  });
  ui.ligar(app);
  ligarTeclado(app);
  window.__app = app;
  window.__motor = motor;

  const h = lerHash();
  if (h.analogia) app.alternarAnalogia(true);
  app.irPara(h.cena, h.passo, { instantaneo: h.t !== null });
  if (h.sentido) app.definirSentido(h.sentido);
  if (h.t !== null) app.tocarPasso(app.passoAtual, { progresso: h.t });
  // Depuração/capturas: #...&cam=x,y,z,ax,ay,az fixa a câmara.
  if (h.cam) {
    const v = h.cam.split(',').map(Number);
    ctx.camaraPara(v.slice(0, 3), v.slice(3, 6), 0);
  }

  // ?fps mostra os FPS e o nível de qualidade (útil para testar no portátil da apresentação)
  if (params.has('fps')) {
    const el = document.createElement('div');
    el.className = 'fps';
    document.body.appendChild(el);
    let n = 0;
    let acc = 0;
    motor.aoAtualizar.add((dt) => {
      n++;
      acc += dt;
      if (acc >= 0.5) {
        el.textContent = `${Math.round(n / acc)} fps · ${motor.nivel}`;
        n = 0;
        acc = 0;
      }
    });
  }

  motor.iniciar();
  carregar.remove();
}

arrancar();
