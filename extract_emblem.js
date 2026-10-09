const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function extractEmblem() {
  const img = await loadImage('public/logo-clean.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  
  // Find right-most red pixel
  let maxRedX = 0;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      if (data[i] === 208 && data[i+1] === 16 && data[i+2] === 16) {
        if (x > maxRedX) maxRedX = x;
      }
    }
  }
  
  // The D emblem likely ends shortly after the red part. 
  // Let's find the first gap of empty space after maxRedX.
  let cutX = maxRedX;
  for (let x = maxRedX; x < canvas.width; x++) {
    let isEmpty = true;
    for (let y = 0; y < canvas.height; y++) {
      const i = (y * canvas.width + x) * 4;
      if (data[i+3] > 0) {
        isEmpty = false; break;
      }
    }
    if (isEmpty) {
      cutX = x;
      break;
    }
  }
  
  // Crop out the emblem
  const cropped = createCanvas(cutX, canvas.height);
  cropped.getContext('2d').drawImage(canvas, 0, 0, cutX, canvas.height, 0, 0, cutX, canvas.height);
  
  fs.writeFileSync('public/emblem-clean.png', cropped.toBuffer('image/png'));
  console.log('Saved emblem-clean.png with width', cutX);
}

extractEmblem().catch(console.error);
