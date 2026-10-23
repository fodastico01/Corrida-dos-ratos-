// Monta a pasta www a partir do jogo (../index.html), com fontes locais e sem service worker.
import fs from 'fs'; import path from 'path';
const raiz = path.resolve(import.meta.dirname, '..');
const www = path.resolve(import.meta.dirname, 'www');
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(path.join(www, 'fonts'), { recursive: true });

let html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');

// 1) Fontes do Google -> fontes locais (Nunito 500-800, IBM Plex Mono 400-600, latin + latin-ext)
const linkRe = /<link[^>]*fonts\.googleapis\.com[^>]*>\s*/g;
const antes = (html.match(linkRe) || []).length;
if (antes < 1) throw new Error('link das fontes do Google nao encontrado');
html = html.replace(linkRe, '<link rel="stylesheet" href="fonts/fonts.css">\n');
html = html.replace(/<link[^>]*rel="preconnect"[^>]*fonts\.g[^>]*>\s*/g, '');
const fontes = [['nunito', 'Nunito', [500, 600, 700, 800]], ['ibm-plex-mono', 'IBM Plex Mono', [400, 500, 600]]];
let css = '';
for (const [pkg, fam, pesos] of fontes) {
  for (const w of pesos) for (const sub of ['latin', 'latin-ext']) {
    const nome = `${pkg}-${sub}-${w}-normal.woff2`;
    const src = path.resolve(import.meta.dirname, 'node_modules/@fontsource', pkg, 'files', nome);
    if (!fs.existsSync(src)) throw new Error('fonte ausente: ' + nome);
    fs.copyFileSync(src, path.join(www, 'fonts', nome));
    const faixa = sub === 'latin'
      ? 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
      : 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
    css += `@font-face{font-family:'${fam}';font-style:normal;font-display:swap;font-weight:${w};src:url(${nome}) format('woff2');unicode-range:${faixa};}\n`;
  }
}
fs.writeFileSync(path.join(www, 'fonts', 'fonts.css'), css);

// 2) Sem service worker dentro do app (os arquivos ja ficam no aparelho)
const swRe = /if\('serviceWorker' in navigator\)\{.*?\}\s*\n/;
if (!swRe.test(html)) throw new Error('registro do service worker nao encontrado');
html = html.replace(swRe, '/* service worker desativado no app Android */\n');
if (html.includes('fonts.googleapis.com') || html.includes('fonts.gstatic.com'))
  console.warn('AVISO: ainda ha referencia a fontes do Google no html');



fs.writeFileSync(path.join(www, 'index.html'), html);
for (const f of ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'manifest.json', 'manifest-en.json'])
  if (fs.existsSync(path.join(raiz, f))) fs.copyFileSync(path.join(raiz, f), path.join(www, f));
console.log('www pronto:', (fs.statSync(path.join(www, 'index.html')).size / 1e6).toFixed(1), 'MB, fontes:', fs.readdirSync(path.join(www, 'fonts')).length);
