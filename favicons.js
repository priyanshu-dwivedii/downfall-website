const fs = require('fs');
const sharp = require('sharp');

async function gen() {
  const svg = fs.readFileSync('public/d-emblem.svg');
  fs.writeFileSync('src/app/icon.svg', svg);
  fs.writeFileSync('src/app/apple-icon.png', await sharp(svg).resize(180, 180).png().toBuffer());
  fs.writeFileSync('public/favicon.ico', await sharp(svg).resize(32, 32).png().toBuffer());
  fs.writeFileSync('src/app/favicon.ico', await sharp(svg).resize(32, 32).png().toBuffer());
  console.log('Favicons generated');
}
gen().catch(console.error);
