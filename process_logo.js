const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function processLogo() {
  const img = await loadImage('public/Downfall logo.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  
  let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      const a = data[i+3];
      
      const isDark = r < 50 && g < 50 && b < 50 && a > 200;
      const isRed = r > 150 && g < 80 && b < 80 && a > 200;
      
      if (isDark) {
        data[i] = 17; data[i+1] = 17; data[i+2] = 17; data[i+3] = 255;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      } else if (isRed) {
        data[i] = 208; data[i+1] = 16; data[i+2] = 16; data[i+3] = 255;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      } else {
        data[i+3] = 0;
      }
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  
  // Crop to actual content
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const cropped = createCanvas(width, height);
  cropped.getContext('2d').drawImage(canvas, minX, minY, width, height, 0, 0, width, height);
  
  const buffer = cropped.toBuffer('image/png');
  fs.writeFileSync('public/logo-clean.png', buffer);
  console.log('Saved clean PNG. Dimensions:', width, 'x', height);
}

processLogo().catch(console.error);
