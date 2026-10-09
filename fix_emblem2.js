const fs = require('fs');

async function fix() {
  const ImageTracer = require('imagetracerjs');
  const { createCanvas, loadImage } = require('canvas');

  const img = await loadImage('public/emblem-clean2.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  const svgstring = ImageTracer.imagedataToSVG(
    imgData,
    { ltres: 0.01, qtres: 0.01, pathomit: 4, colorsampling: 0, palette: [{r:0,g:0,b:0,a:0}, {r:2,g:2,b:2,a:255}, {r:153,g:0,b:11,a:255}] }
  );
  
  // Clean the SVG string by keeping ONLY the paths that are black or red
  // We remove anything that is transparent (rgb(0,0,0) with opacity 0)
  
  let cleaned = svgstring.replace(/<path[^>]*fill="rgb\(0,0,0\)"[^>]*\/>/g, '');
  
  // Extract all the <path ... /> elements
  const paths = cleaned.match(/<path[^>]*\/>/g);
  
  let dBodyPath = '';
  let redPaths = [];
  
  for (let p of paths) {
    if (p.includes('rgb(2,2,2)')) {
      // The largest path is the D body. We only want the largest one to avoid noise.
      // Or we can just keep all black paths.
      // Wait, there should only be one main black path! Let's just find the longest one.
      if (p.length > dBodyPath.length) {
        dBodyPath = p;
      }
    } else if (p.includes('rgb(153,0,11)')) {
      redPaths.push(p);
    }
  }
  
  // Make the D body path white/black and add fill-rule="evenodd"
  let whiteDBody = dBodyPath.replace('rgb(2,2,2)', '#ffffff').replace('<path', '<path fill-rule="evenodd"');
  let darkDBody = dBodyPath.replace('rgb(2,2,2)', '#111111').replace('<path', '<path fill-rule="evenodd"');
  
  // Make the red paths pure red
  let redPathsClean = redPaths.map(p => p.replace('rgb(153,0,11)', '#d10f18')).join('\n');
  
  // Strip stroke, stroke-width, opacity
  const cleanAttr = (str) => str.replace(/stroke="[^"]*"/g, '').replace(/stroke-width="[^"]*"/g, '').replace(/opacity="[^"]*"/g, '');
  
  whiteDBody = cleanAttr(whiteDBody);
  darkDBody = cleanAttr(darkDBody);
  redPathsClean = cleanAttr(redPathsClean);
  
  const header = `<svg width="${img.width}" height="${img.height}" version="1.1" xmlns="http://www.w3.org/2000/svg">`;
  const footer = `</svg>`;
  
  const whiteSvg = header + '\n' + whiteDBody + '\n' + redPathsClean + '\n' + footer;
  const darkSvg = header + '\n' + darkDBody + '\n' + redPathsClean + '\n' + footer;
  
  fs.writeFileSync('public/d-emblem.svg', darkSvg);
  fs.writeFileSync('public/d-emblem-white.svg', whiteSvg);
  
  console.log('Fixed D emblems with evenodd');
}

fix().catch(console.error);
