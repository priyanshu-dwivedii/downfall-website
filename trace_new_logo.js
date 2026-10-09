const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const ImageTracer = require('imagetracerjs');

async function trace() {
  const img = await loadImage('public/logo-clean2.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  const svgstring = ImageTracer.imagedataToSVG(
    imgData,
    { ltres: 0.01, qtres: 0.01, pathomit: 4, colorsampling: 0, palette: [{r:0,g:0,b:0,a:0}, {r:2,g:2,b:2,a:255}, {r:153,g:0,b:11,a:255}] }
  );
  fs.writeFileSync('public/logo.svg', svgstring);
  console.log('Saved SVG');
}

trace().catch(console.error);
