// Confere, em dist/, se todo link e imagem interno (começando com "/") aponta para um arquivo que existe.
// Uso: npm run verifica-links   (depois do build). Falha se houver link quebrado.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const BARRA = String.fromCharCode(92);

function listar(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) listar(p, acc);
    else acc.push(p);
  }
  return acc;
}

const existe = (alvo) => {
  const limpo = alvo.split('#')[0].split('?')[0];
  if (!limpo) return true;
  const p = join(DIST, limpo);
  return existsSync(p) && (statSync(p).isFile() || existsSync(join(p, 'index.html')));
};

const htmls = listar(DIST).filter((f) => f.endsWith('.html'));
const quebrados = [];
let total = 0;
for (const arq of htmls) {
  const html = readFileSync(arq, 'utf8');
  for (const m of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    if (m[1].startsWith('//')) continue;
    total++;
    if (!existe(m[1])) quebrados.push(`${arq.split(BARRA).join('/')} -> ${m[1]}`);
  }
}
console.log(`Links internos conferidos: ${total} em ${htmls.length} páginas. Quebrados: ${quebrados.length}.`);
for (const q of quebrados) console.error('  ' + q);
if (quebrados.length) process.exit(1);
