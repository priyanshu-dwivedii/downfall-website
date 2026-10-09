const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const ImageTracer = require('imagetracerjs');

async function traceEmblem() {
  const img = await loadImage('public/emblem-clean2.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  const svgstring = ImageTracer.imagedataToSVG(
    imgData,
    { ltres: 0.01, qtres: 0.01, pathomit: 4, colorsampling: 0, palette: [{r:0,g:0,b:0,a:0}, {r:2,g:2,b:2,a:255}, {r:153,g:0,b:11,a:255}] }
  );
  
  // Save d-emblem.svg
  fs.writeFileSync('public/d-emblem.svg', svgstring);
  console.log('Saved d-emblem.svg');
  
  // Save d-emblem-white.svg
  // The trace creates paths with rgb(2,2,2) and rgb(153,0,11)
  // We need to replace rgb(2,2,2) with rgb(255,255,255)
  const whiteSvg = svgstring.replace(/rgb\(2,2,2\)/g, 'rgb(255,255,255)');
  fs.writeFileSync('public/d-emblem-white.svg', whiteSvg);
  console.log('Saved d-emblem-white.svg');
}

traceEmblem().catch(console.error);
