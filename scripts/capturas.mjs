// Capturas de ecrã de cada cena com Playwright (headless) + verificação de erros na consola.
// Uso:
//   npm run build && npm run capturas                 → todas as cenas para capturas/
//   npm run capturas -- --ate 3                       → só as cenas 0 a 3
//   node scripts/capturas.mjs --cena 3 --passo 1 --t 0.6 --saida /tmp/x.png
import { createRequire } from 'node:module';
import { preview } from 'vite';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require('/opt/node-tools/node_modules/playwright');
}

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), []),
);

// Momento representativo de cada cena para a captura (cena, passo, progresso 0..1).
const PADRAO = [
  { cena: 0, passo: 0, t: 0.55 },
  { cena: 1, passo: 0, t: 1 },
  { cena: 2, passo: 0, t: 0.42 },
  { cena: 3, passo: 0, t: 0.4 },
  { cena: 4, passo: 0, t: 1 },
  { cena: 5, passo: 2, t: 0.7 },
  { cena: 6, passo: 0, t: 0.85 },
  { cena: 7, passo: 4, t: 1 },
  { cena: 8, passo: 4, t: 1 },
  { cena: 9, passo: 2, t: 1 },
  { cena: 10, passo: 0, t: 0.45 },
];

const largura = Number(args.largura ?? 1600);
const altura = Number(args.altura ?? 900);

const servidor = await preview({ root: raiz, preview: { port: 4179, strictPort: false }, logLevel: 'error' });
const url = servidor.resolvedUrls.local[0];
const browser = await playwright.chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const erros = [];

const alvos =
  args.cena !== undefined
    ? [{ cena: Number(args.cena), passo: Number(args.passo ?? 0), t: Number(args.t ?? 1) }]
    : PADRAO.filter((a) => a.cena >= Number(args.de ?? 0) && a.cena <= Number(args.ate ?? 10)); // --de M --ate N: só as cenas M..N
mkdirSync(resolve(raiz, 'capturas'), { recursive: true });

for (const a of alvos) {
  // Uma página nova por captura (o SwiftShader é lento e uma página ocupada atrasa a seguinte)
  const pagina = await browser.newPage({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
  pagina.setDefaultTimeout(120000);
  pagina.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
  pagina.on('pageerror', (e) => erros.push(String(e)));
  const extra = `${args.sentido ? `&sentido=${args.sentido}` : ''}${args.analogia ? '&analogia=1' : ''}${args.cam ? `&cam=${args.cam}` : ''}`;
  // Query única para forçar um carregamento novo da página em cada captura.
  await pagina.goto(`${url}?captura=${Date.now()}#cena=${a.cena}&passo=${a.passo}&t=${a.t}${extra}`);
  await pagina.waitForTimeout(Number(args.espera ?? 2500));
  const saida = args.saida ?? resolve(raiz, 'capturas', `cena-${String(a.cena).padStart(2, '0')}.png`);
  // O Chromium headless (SwiftShader) nem sempre apresenta o último frame WebGL na captura:
  // copia-se o conteúdo do canvas para uma imagem por cima dele antes de capturar.
  await pagina.evaluate(() => {
    const c = document.querySelector('#palco canvas');
    const img = document.createElement('img');
    img.src = c.toDataURL('image/png');
    img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    c.after(img);
    return new Promise((r) => (img.onload = r));
  });
  await pagina.screenshot({ path: saida });
  await pagina.close();
  console.log(`✓ cena ${a.cena} (passo ${a.passo}, t=${a.t}) → ${saida}`);
}

await browser.close();
servidor.httpServer.close();
if (erros.length) {
  console.error(`\n✗ ${erros.length} erro(s) na consola:\n` + erros.join('\n'));
  process.exit(1);
}
console.log('\nSem erros na consola.');
