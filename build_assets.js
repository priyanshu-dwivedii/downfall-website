const fs = require('fs');
const sharp = require('sharp');

async function build() {
  const svg = fs.readFileSync('public/logo.svg');
  
  // 4096px PNG
  await sharp(svg)
    .resize({ width: 4096, withoutEnlargement: false })
    .png()
    .toFile('public/logo-4k.png');
    
  console.log('Saved 4K PNG');
  
  // Create white SVG by replacing the dark color
  let whiteSvg = svg.toString().replace(/rgb\(17,17,17\)/g, 'rgb(255,255,255)');
  fs.writeFileSync('public/logo-white.svg', whiteSvg);
  console.log('Saved white SVG');
  
  // Favicons
  // We'll use the full SVG as the favicon for now, since isolating the D is not programmatically reliable without a clear gap.
  fs.writeFileSync('src/app/icon.svg', svg);
  fs.writeFileSync('src/app/apple-icon.png', await sharp(svg).resize(180, 180).png().toBuffer());
  fs.writeFileSync('public/favicon.ico', await sharp(svg).resize(32, 32).png().toBuffer());
  
  console.log('Generated favicons');
}

build().catch(console.error);
