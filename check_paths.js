const fs = require('fs');
const ImageTracer = require('imagetracerjs');
const { createCanvas, loadImage } = require('canvas');

async function f() {
  const img = await loadImage('public/emblem-clean2.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const svgstring = ImageTracer.imagedataToSVG(imgData, { ltres: 0.01, qtres: 0.01, pathomit: 4, colorsampling: 0, palette: [{r:0,g:0,b:0,a:0}, {r:2,g:2,b:2,a:255}, {r:153,g:0,b:11,a:255}] });
  
  const fills = ['rgb(0,0,0)','rgb(25,3,4)','rgb(85,0,0)','rgb(94,73,75)','rgb(149,0,6)','rgb(149,131,132)'];
  for (let c of fills) {
    const paths = svgstring.match(new RegExp('<path[^>]*fill="' + c.replace('(','\\(').replace(')','\\)') + '"[^>]*/>', 'g'));
    if (paths) {
      let maxLen = 0;
      for (let p of paths) if (p.length > maxLen) maxLen = p.length;
      console.log(c, 'count:', paths.length, 'maxLen:', maxLen);
      if (maxLen > 1000) {
        console.log(paths.find(p => p.length === maxLen).substring(0, 150));
      }
    }
  }
}
f().catch(console.error);
