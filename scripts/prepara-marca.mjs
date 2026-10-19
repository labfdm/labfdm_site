// Gera os arquivos de marca em public/img a partir dos PNGs oficiais (2000x2000).
// Apenas recorta o espaço vazio e reduz o tamanho. Não recolore nem altera proporções.
import sharp from 'sharp';

const saidas = [
  ['scripts/_origem-logo.png', 'public/img/logo-fdm.png', { height: 240 }],
  ['scripts/_origem-icone.png', 'public/img/icone-fdm.png', { height: 240 }],
  ['scripts/_origem-icone.png', 'public/img/favicon.png', { height: 64 }],
  ['scripts/_origem-icone.png', 'public/img/apple-touch-icon.png', { height: 180 }],
];

for (const [origem, destino, resize] of saidas) {
  const info = await sharp(origem)
    .trim({ threshold: 10 })
    .resize({ ...resize, fit: 'inside' })
    .png({ compressionLevel: 9 })
    .toFile(destino);
  console.log(destino, info.width + 'x' + info.height);
}
