// Prepara as fotos da equipe para a web: recorte 4:5 (cabeça e ombros), fundo neutro, WebP 480x600.
// Uso: node scripts/prepara-fotos.mjs <pasta-com-as-fotos> [recortes.json]
// Cada arquivo se chama <id>.<extensão>, onde <id> é o campo "id" em grupo.equipe (ex.: leonardo.jpg).
// Sem recorte informado para uma foto, o programa centraliza no topo (rosto costuma ficar na parte de cima).
// Formato do arquivo de recortes: { "leonardo": { "left": 218, "top": 60, "width": 640, "height": 800 } }
// (medidas em pixels da foto original; a proporção deve ser 4:5).
import sharp from 'sharp';
import { readdir, readFile } from 'node:fs/promises';
import { join, parse } from 'node:path';

const entrada = process.argv[2];
if (!entrada) {
  console.error('Informe a pasta com as fotos. Exemplo: node scripts/prepara-fotos.mjs C:\fotos');
  process.exit(1);
}
const recortes = process.argv[3] ? JSON.parse(await readFile(process.argv[3], 'utf8')) : {};
const FUNDO = '#EEF1F6';

for (const arq of await readdir(entrada)) {
  const { name, ext } = parse(arq);
  if (!/\.(png|jpe?g|webp)$/i.test(ext)) continue;
  let img = sharp(join(entrada, arq)).rotate().flatten({ background: FUNDO });
  const r = recortes[name];
  if (r) img = img.extract(r);
  const info = await img
    .resize({ width: 480, height: 600, fit: 'cover', position: 'top' })
    .webp({ quality: 82 })
    .toFile(join('public/img/equipe', `${name}.webp`));
  console.log(name, `${info.width}x${info.height}`, Math.round(info.size / 1024) + ' KB', r ? 'recorte manual' : 'recorte automático (topo)');
}
