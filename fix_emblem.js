const fs = require('fs');

async function fix() {
  // Let's re-trace the emblem from the PNG so we get the pure imagetracerjs output again
  // Wait, I can just use my process_new_logo logic again or trace_emblem.js!
  
  // I will just trace it with imagetracerjs, but this time I will parse the paths
  // and discard any path that is not black or red!
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
  // We completely strip paths that have fill="rgb(0,0,0)" (transparent)
  
  // We can just use an XML parser or regex to remove `<path ... fill="rgb(0,0,0)" ... />`
  let cleaned = svgstring.replace(/<path[^>]*fill="rgb\(0,0,0\)"[^>]*\/>/g, '');
  
  // Replace black with #111111 or #ffffff
  let darkSvg = cleaned.replace(/rgb\(2,2,2\)/g, '#111111').replace(/rgb\(153,0,11\)/g, '#d10f18');
  let whiteSvg = cleaned.replace(/rgb\(2,2,2\)/g, '#ffffff').replace(/rgb\(153,0,11\)/g, '#d10f18');
  
  // Remove stroke and opacity just in case
  darkSvg = darkSvg.replace(/stroke="[^"]*"/g, '').replace(/stroke-width="[^"]*"/g, '').replace(/opacity="[^"]*"/g, '');
  whiteSvg = whiteSvg.replace(/stroke="[^"]*"/g, '').replace(/stroke-width="[^"]*"/g, '').replace(/opacity="[^"]*"/g, '');
  
  fs.writeFileSync('public/d-emblem.svg', darkSvg);
  fs.writeFileSync('public/d-emblem-white.svg', whiteSvg);
  
  console.log('Fixed D emblems');
}

fix().catch(console.error);
