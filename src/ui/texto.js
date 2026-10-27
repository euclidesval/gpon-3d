// Formatação de texto da UI: escapa HTML, transforma `código` em <code> e marca
// as siglas com tooltip (<abbr>). Funções puras, testáveis sem browser.

export function escapar(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function regexSiglas(siglas) {
  const chaves = Object.keys(siglas).sort((a, b) => b.length - a.length);
  if (!chaves.length) return null;
  const alt = chaves.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return new RegExp(`(?<![\\p{L}\\p{N}-])(${alt})(?![\\p{L}\\p{N}-])`, 'gu');
}

const cacheRegex = new WeakMap();

export function formatar(texto, siglas = {}) {
  let re = cacheRegex.get(siglas);
  if (re === undefined) {
    re = regexSiglas(siglas);
    cacheRegex.set(siglas, re);
  }
  const partes = String(texto).split('`');
  return partes
    .map((parte, i) => {
      if (i % 2 === 1) return `<code>${escapar(parte)}</code>`;
      const seguro = escapar(parte);
      if (!re) return seguro;
      re.lastIndex = 0;
      return seguro.replace(re, (m) => `<abbr class="sigla" tabindex="0" data-sigla="${m}">${m}</abbr>`);
    })
    .join('');
}
