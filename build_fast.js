const fs = require('fs');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');

async function build() {
  // Use the clean raster instead of the dense SVG to avoid hanging
  const imgBuffer = fs.readFileSync('public/logo-clean2.png');
  
  // 4096px PNG
  await sharp(imgBuffer)
    .resize({ width: 4096, withoutEnlargement: false })
    .png()
    .toFile('public/logo-4k.png');
    
  console.log('Saved 4K PNG');
  
  // Create 16, 32, 48 for ico
  await sharp(imgBuffer).resize(16, 16).png().toFile('public/icon-16.png');
  await sharp(imgBuffer).resize(32, 32).png().toFile('public/icon-32.png');
  await sharp(imgBuffer).resize(48, 48).png().toFile('public/icon-48.png');
  await sharp(imgBuffer).resize(180, 180).png().toFile('src/app/apple-icon.png');
  
  const buf = await pngToIco.default(['public/icon-16.png', 'public/icon-32.png', 'public/icon-48.png']);
  fs.writeFileSync('src/app/favicon.ico', buf);
  fs.writeFileSync('public/favicon.ico', buf);
  
  console.log('Generated favicons');
}

build().catch(console.error);
