// Roda depois do build. Falha se uma página marcada como publicada ainda tiver bloco "A CONFIRMAR".
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const raiz = 'dist';
const arquivos = [];
async function varrer(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await varrer(p);
    else if (e.name.endsWith('.html')) arquivos.push(p);
  }
}
await varrer(raiz);

let erros = 0, publicadas = 0, rascunhos = 0, blocos = 0;
for (const arq of arquivos) {
  const html = await readFile(arq, 'utf8');
  const publicada = /<meta name="fdm-publicada" content="true"/.test(html);
  const n = (html.match(/data-pendente/g) ?? []).length;
  blocos += n;
  if (publicada) {
    publicadas++;
    if (n > 0) {
      erros++;
      console.error(`ERRO: ${arq} está marcada como publicada e contém ${n} bloco(s) “A CONFIRMAR”.`);
    }
  } else rascunhos++;
}

console.log(`Páginas publicadas: ${publicadas}. Páginas em rascunho: ${rascunhos}. Blocos provisórios no total: ${blocos}.`);
if (erros > 0) {
  console.error('Publicação bloqueada: preencha os dados em src/content/evento.config.json.');
  process.exit(1);
}
