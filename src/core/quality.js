// Monitor de FPS: se a média cair abaixo de 45 fps durante duas janelas seguidas,
// desce um nível (alta → média → baixa). Nunca volta a subir sozinho, para não oscilar.
export const NIVEIS = ['alta', 'media', 'baixa'];

export class MonitorQualidade {
  constructor(aoMudar, { limiar = 45, janela = 2 } = {}) {
    this.aoMudar = aoMudar;
    this.limiar = limiar;
    this.janela = janela;
    this.tempo = 0;
    this.frames = 0;
    this.baixas = 0;
    this.nivel = 'alta';
    this.aquecimento = 3; // ignora os primeiros segundos (compilação de shaders)
    this.ativo = true;
  }

  definir(nivel) {
    this.nivel = nivel;
  }

  amostra(dt) {
    if (!this.ativo) return;
    if (this.aquecimento > 0) {
      this.aquecimento -= dt;
      return;
    }
    // Separadores em segundo plano dão dt enormes: ignorar.
    if (dt > 0.5) return;
    this.tempo += dt;
    this.frames++;
    if (this.tempo < this.janela) return;
    const fps = this.frames / this.tempo;
    this.tempo = 0;
    this.frames = 0;
    this.baixas = fps < this.limiar ? this.baixas + 1 : 0;
    if (this.baixas >= 2) {
      this.baixas = 0;
      const i = NIVEIS.indexOf(this.nivel);
      if (i < NIVEIS.length - 1) {
        this.nivel = NIVEIS[i + 1];
        this.aoMudar(this.nivel, fps);
      }
    }
  }
}
