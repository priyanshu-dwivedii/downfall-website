const { createCanvas, loadImage } = require('canvas');

async function analyze() {
  const img = await loadImage('public/emblem-clean2.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const data = ctx.getImageData(0, 0, img.width, img.height).data;
  
  // Find all red pixels
  let redMinX = img.width, redMaxX = 0, redMinY = img.height, redMaxY = 0;
  // Find all black pixels
  let blackMinX = img.width, blackMaxX = 0, blackMinY = img.height, blackMaxY = 0;
  
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      
      if (a > 100) {
        if (r > 100 && g < 100 && b < 100) {
          if (x < redMinX) redMinX = x;
          if (x > redMaxX) redMaxX = x;
          if (y < redMinY) redMinY = y;
          if (y > redMaxY) redMaxY = y;
        } else {
          if (x < blackMinX) blackMinX = x;
          if (x > blackMaxX) blackMaxX = x;
          if (y < blackMinY) blackMinY = y;
          if (y > blackMaxY) blackMaxY = y;
        }
      }
    }
  }
  
  console.log('Red:', { redMinX, redMaxX, redMinY, redMaxY });
  console.log('Black:', { blackMinX, blackMaxX, blackMinY, blackMaxY });
}

analyze().catch(console.error);
