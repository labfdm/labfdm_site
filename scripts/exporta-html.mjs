// Gera um único arquivo HTML com o site inteiro (todas as páginas, estilos, fontes e imagens embutidos).
// Serve para enviar o site por e-mail ou WhatsApp e abrir com duplo clique, sem servidor.
// Uso: npm run exportar-html   (roda o build e depois este script)
// Saída: exportacoes/site-fdm-completo.html
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

const DIST = 'dist';
const SAIDA = 'exportacoes/site-fdm-completo.html';

const mime = { '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const dataUri = async (arq) => `data:${mime[extname(arq)]};base64,${(await readFile(arq)).toString('base64')}`;

async function listar(dir, acc = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await listar(p, acc);
    else acc.push(p);
  }
  return acc;
}
const norm = (p) => p.replace(/\\/g, '/');

const arquivos = (await listar(DIST)).map(norm);
const htmls = arquivos.filter((a) => a.endsWith('/index.html') && a !== `${DIST}/index.html`);

// ---- Estilos: CSS global + @font-face (somente subconjuntos latin e latin-ext, em woff2)
const cssArq = arquivos.find((a) => /\/_astro\/global\..*\.css$/.test(a));
let css = await readFile(cssArq, 'utf8');
const primeira = await readFile(htmls[0], 'utf8');
const estilos = [...primeira.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
// Os @font-face vêm do CSS global e do <style> das páginas, com caminhos relativos. Junta sem repetir,
// tira do CSS global e reescreve abaixo com as fontes embutidas.
const REGRA_FONTE = /@font-face\{[^}]*\}/g;
const regras = [...new Set([...(css.match(REGRA_FONTE) ?? []), ...(estilos.match(REGRA_FONTE) ?? [])])];
css = css.replace(REGRA_FONTE, '');
let fontes = '';
for (const r of regras) {
  const woff2 = r.match(/url\(([^)]*?\.woff2)\)/);
  if (!woff2 || !/-latin(-ext)?-/.test(woff2[1])) continue;
  const uri = await dataUri(join(DIST, woff2[1].replace(/^\//, '')));
  fontes += r.replace(/src:[^;}]*/, `src:url(${uri}) format("woff2")`) + '\n';
}

// ---- Imagens (uma vez só; as páginas apontam para elas por caminho)
const imagens = {};
for (const a of arquivos.filter((x) => x.startsWith(`${DIST}/img/`))) {
  imagens['/' + a.slice(DIST.length + 1)] = await dataUri(a);
}

// ---- Páginas
const paginas = {};
for (const h of htmls) {
  const caminho = '/' + h.slice(DIST.length + 1).replace(/index\.html$/, '');
  const html = await readFile(h, 'utf8');
  const titulo = html.match(/<title>([\s\S]*?)<\/title>/)[1];
  const lang = html.match(/<html lang="([^"]+)"/)[1];
  let corpo = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
  corpo = corpo.replace(/<script[\s\S]*?<\/script>/g, '');
  paginas[caminho] = { titulo, lang, corpo };
}
const BARRA = String.fromCharCode(92);
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
// No JSON incorporado ao HTML, '<' e os separadores de linha Unicode viram escapes, para que nada feche a tag <script> por engano.
const escapar = (obj) => JSON.stringify(obj).split('<').join(BARRA + 'u003c').split(LS).join(BARRA + 'u2028').split(PS).join(BARRA + 'u2029');

const roteador = `
(function () {
  var PAGINAS = JSON.parse(document.getElementById('dados-paginas').textContent);
  var IMAGENS = JSON.parse(document.getElementById('dados-imagens').textContent);
  var app = document.getElementById('app');
  var ouvinteMenu = null;

  function caminhoAtual() {
    var h = location.hash.replace(/^#/, '');
    return PAGINAS[h] ? h : '/pt/';
  }

  function iniciarMenu() {
    var b = app.querySelector('.menu-botao');
    var n = app.querySelector('#menu');
    if (!b || !n) return;
    var mq = window.matchMedia('(min-width: 62rem)');
    function aberto() { return b.getAttribute('aria-expanded') === 'true'; }
    function aplicar() {
      if (mq.matches) { b.hidden = true; n.hidden = false; }
      else { b.hidden = false; n.hidden = !aberto(); }
    }
    b.addEventListener('click', function () { b.setAttribute('aria-expanded', String(!aberto())); aplicar(); });
    n.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mq.matches && aberto()) { b.setAttribute('aria-expanded', 'false'); aplicar(); b.focus(); }
    });
    aplicar();
    if (ouvinteMenu) ouvinteMenu.mq.removeEventListener('change', ouvinteMenu.fn);
    mq.addEventListener('change', aplicar);
    ouvinteMenu = { mq: mq, fn: aplicar };
  }

  function iniciarInstagram() {
    var s = app.querySelector('[data-instagram]');
    if (!s) return;
    var b = s.querySelector('button');
    var q = s.querySelector('.instagram__quadro');
    var aviso = s.querySelector('[data-aviso]');
    b.hidden = false;
    aviso.hidden = false;
    b.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = b.getAttribute('data-src');
      f.title = b.getAttribute('data-titulo');
      f.loading = 'lazy';
      q.appendChild(f);
      q.hidden = false;
      b.setAttribute('aria-expanded', 'true');
      b.hidden = true;
      aviso.hidden = true;
    });
  }

  function mostrar(foco) {
    var c = caminhoAtual();
    var p = PAGINAS[c];
    document.documentElement.lang = p.lang;
    document.title = p.titulo;
    app.innerHTML = p.corpo;
    app.querySelectorAll('img[src^="/img/"]').forEach(function (img) {
      var uri = IMAGENS[img.getAttribute('src')];
      if (uri) img.src = uri;
      img.loading = 'eager';
    });
    iniciarMenu();
    iniciarInstagram();
    window.scrollTo(0, 0);
    if (foco) { var m = app.querySelector('main'); if (m) m.focus({ preventScroll: true }); }
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (href === '#conteudo') {
      e.preventDefault();
      var m = app.querySelector('main');
      if (m) { m.focus(); m.scrollIntoView(); }
    } else if (href.charAt(0) === '/' && href.charAt(1) !== '/') {
      e.preventDefault();
      if (PAGINAS[href]) { location.hash = href; }
    }
  });
  window.addEventListener('hashchange', function () { mostrar(true); });
  mostrar(false);
})();
`;

const documento = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FDM</title>
<meta name="robots" content="noindex">
<link rel="icon" href="${imagens['/img/favicon.png']}">
<style>
${fontes}
${css}
</style>
</head>
<body>
<div id="app"></div>
<script id="dados-paginas" type="application/json">${escapar(paginas)}</script>
<script id="dados-imagens" type="application/json">${escapar(imagens)}</script>
<script>${roteador}</script>
</body>
</html>
`;

await mkdir('exportacoes', { recursive: true });
await writeFile(SAIDA, documento);
console.log(`${SAIDA}: ${Object.keys(paginas).length} páginas, ${(Buffer.byteLength(documento) / 1024).toFixed(0)} KB`);
