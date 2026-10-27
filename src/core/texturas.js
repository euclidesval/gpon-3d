import * as THREE from 'three';

// Texturas procedurais (sem ficheiros externos). Em ambientes sem canvas 2D
// (testes em jsdom) devolvem null e os materiais ficam só com a cor.
const cache = new Map();

export function texturaCanvas(chave, largura, altura, desenhar, { repetir = null, srgb = true } = {}) {
  if (chave && cache.has(chave)) return cache.get(chave);
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  let g = null;
  try {
    g = canvas.getContext('2d');
  } catch {
    g = null;
  }
  if (!g) return null;
  desenhar(g, largura, altura);
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repetir) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repetir[0], repetir[1]);
  }
  if (chave) cache.set(chave, tex);
  return tex;
}

// Gerador pseudo-aleatório determinístico (mesma imagem em todas as execuções).
export function aleatorio(semente = 1) {
  let s = semente >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function ruido(g, w, h, base, variacao, n, semente, tamanho = 2) {
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  const r = aleatorio(semente);
  for (let i = 0; i < n; i++) {
    const v = (r() - 0.5) * variacao;
    g.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`;
    g.fillRect(r() * w, r() * h, tamanho * (0.5 + r()), tamanho * (0.5 + r()));
  }
}

export const TEX = {
  betao: () => texturaCanvas('betao', 256, 256, (g, w, h) => ruido(g, w, h, '#9aa0a6', 0.18, 5000, 7), { repetir: [3, 3] }),
  asfalto: () => texturaCanvas('asfalto', 256, 256, (g, w, h) => ruido(g, w, h, '#2b2e33', 0.22, 9000, 11, 1.5), { repetir: [30, 2] }),
  passeio: () =>
    texturaCanvas(
      'passeio',
      256,
      256,
      (g, w, h) => {
        ruido(g, w, h, '#8d8a84', 0.12, 3000, 13);
        g.strokeStyle = 'rgba(40,40,40,0.35)';
        g.lineWidth = 2;
        for (let x = 0; x <= w; x += 64) {
          g.beginPath();
          g.moveTo(x, 0);
          g.lineTo(x, h);
          g.stroke();
        }
        for (let y = 0; y <= h; y += 64) {
          g.beginPath();
          g.moveTo(0, y);
          g.lineTo(w, y);
          g.stroke();
        }
      },
      { repetir: [40, 1] },
    ),
  relva: () => texturaCanvas('relva', 256, 256, (g, w, h) => ruido(g, w, h, '#3d5a35', 0.3, 12000, 17, 1.2), { repetir: [6, 6] }),
  terreno: () =>
    texturaCanvas(
      'terreno',
      512,
      512,
      (g, w, h) => {
        ruido(g, w, h, '#3f4a37', 0.0, 0, 19);
        const r = aleatorio(29);
        for (let i = 0; i < 260; i++) {
          const x = r() * w;
          const y = r() * h;
          const rad = 10 + r() * 50;
          const gr = g.createRadialGradient(x, y, 0, x, y, rad);
          const tom = r() > 0.5 ? '70,84,58' : '52,60,44';
          gr.addColorStop(0, `rgba(${tom},0.35)`);
          gr.addColorStop(1, `rgba(${tom},0)`);
          g.fillStyle = gr;
          g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        }
        const r2 = aleatorio(31);
        for (let i = 0; i < 9000; i++) {
          const v = (r2() - 0.5) * 0.12;
          g.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`;
          g.fillRect(r2() * w, r2() * h, 1.5, 1.5);
        }
      },
      { repetir: [10, 10] },
    ),
  soalho: () =>
    texturaCanvas(
      'soalho',
      256,
      256,
      (g, w, h) => {
        const r = aleatorio(23);
        for (let y = 0; y < h; y += 32) {
          let x = -r() * 120;
          while (x < w) {
            const comp = 90 + r() * 80;
            const tom = 120 + r() * 40;
            g.fillStyle = `rgb(${tom},${tom * 0.72},${tom * 0.48})`;
            g.fillRect(x, y, comp, 32);
            g.fillStyle = 'rgba(0,0,0,0.25)';
            g.fillRect(x, y, 2, 32);
            x += comp;
          }
          g.fillStyle = 'rgba(0,0,0,0.3)';
          g.fillRect(0, y, w, 2);
        }
      },
      { repetir: [2, 2] },
    ),
  grelha: () =>
    texturaCanvas(
      'grelha',
      128,
      128,
      (g, w, h) => {
        g.fillStyle = '#1a1d21';
        g.fillRect(0, 0, w, h);
        g.fillStyle = '#05070a';
        for (let y = 4; y < h; y += 10) for (let x = 4; x < w; x += 10) g.fillRect(x, y, 6, 6);
      },
      { repetir: [1, 1] },
    ),
  ceu: () =>
    texturaCanvas('ceu', 16, 512, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#0b1626');
      gr.addColorStop(0.55, '#24384f');
      gr.addColorStop(1, '#5b6d7c');
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
    }),
};

// Placa de texto (etiquetas impressas nos equipamentos).
export function texturaTexto(texto, { largura = 256, altura = 64, fundo = 'rgba(0,0,0,0)', cor = '#e8e8e8', tamanho = 36, peso = 600, alinhar = 'center' } = {}) {
  return texturaCanvas(`txt:${texto}:${largura}:${altura}:${fundo}:${cor}:${tamanho}`, largura, altura, (g, w, h) => {
    g.fillStyle = fundo;
    g.fillRect(0, 0, w, h);
    g.fillStyle = cor;
    g.font = `${peso} ${tamanho}px system-ui, "Segoe UI", Roboto, Arial, sans-serif`;
    g.textAlign = alinhar;
    g.textBaseline = 'middle';
    g.fillText(texto, alinhar === 'center' ? w / 2 : 8, h / 2);
  });
}
