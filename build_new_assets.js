const fs = require('fs');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');

async function build() {
  const svg = fs.readFileSync('public/logo.svg');
  
  // 4096px PNG
  await sharp(svg)
    .resize({ width: 4096, withoutEnlargement: false })
    .png()
    .toFile('public/logo-4k.png');
    
  console.log('Saved 4K PNG');
  
  // Create white SVG by replacing the dark color
  let whiteSvg = svg.toString().replace(/rgb\(2,2,2\)/g, 'rgb(255,255,255)');
  fs.writeFileSync('public/logo-white.svg', whiteSvg);
  console.log('Saved white SVG');
  
  // Extract emblem (the top part of the image)
  // Image is 406x469. We'll find the bottom of the black 'D'.
  const img = await sharp('public/logo-clean2.png').raw().toBuffer({ resolveWithObject: true });
  // Instead of manual cropping, we'll just crop the top 310 pixels (roughly, for a square emblem).
  // Let's create an icon.svg using just the D. We'll use the SVG and clip it? No, sharp extract.
  const emblemPng = await sharp('public/logo-clean2.png').extract({ left: 0, top: 0, width: 406, height: 350 }).trim().png().toBuffer();
  fs.writeFileSync('public/emblem-clean2.png', emblemPng);
  
  // Create 16, 32, 48 for ico
  await sharp(emblemPng).resize(16, 16).png().toFile('public/icon-16.png');
  await sharp(emblemPng).resize(32, 32).png().toFile('public/icon-32.png');
  await sharp(emblemPng).resize(48, 48).png().toFile('public/icon-48.png');
  await sharp(emblemPng).resize(180, 180).png().toFile('src/app/apple-icon.png');
  
  const buf = await pngToIco.default(['public/icon-16.png', 'public/icon-32.png', 'public/icon-48.png']);
  fs.writeFileSync('src/app/favicon.ico', buf);
  fs.writeFileSync('public/favicon.ico', buf);
  
  console.log('Generated favicons');
}

build().catch(console.error);
