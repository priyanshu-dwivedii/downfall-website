const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function processImage() {
  const img = await loadImage('C:/Users/a/.gemini/antigravity-ide/brain/c5c44f52-ba77-4f84-b88f-9dd9141677af/.user_uploaded/media_1791473278407.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  
  // Find where the white/checkerboard area starts and ends
  let minX = canvas.width, maxX = 0;
  let minY = canvas.height, maxY = 0;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const r = data[i], g = data[i+1], b = data[i+2];
      
      // WhatsApp background is ~32,32,32
      // Checkerboard is ~240,240,240 and 255,255,255
      // Logo is dark (<100) or red.
      
      const isUi = r < 50 && g < 50 && b < 50 && Math.abs(r-g) < 10 && Math.abs(g-b) < 10 && x < 150 || x > canvas.width - 150;
      
      // If it's not UI, and not checkerboard, it's logo
      const isCheckerboard = r > 200 && g > 200 && b > 200;
      const isBackground = isUi || isCheckerboard;
      
      if (!isBackground) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  // Now clear everything outside this bounding box, and clear checkerboard
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const r = data[i], g = data[i+1], b = data[i+2];
      
      if (x < minX || x > maxX || y < minY || y > maxY) {
        data[i+3] = 0; // transparent
      } else {
        // Soft thresholding for anti-aliasing against white/gray background
        const luminance = (r + g + b) / 3;
        if (luminance > 220) {
          data[i+3] = 0;
        } else if (luminance > 150) {
          // Semi-transparent
          const alpha = Math.floor(255 * ((220 - luminance) / 70));
          data[i+3] = alpha;
          // darken to match color
          data[i] = r < 100 ? 0 : 153;
          data[i+1] = r < 100 ? 0 : 0;
          data[i+2] = r < 100 ? 0 : 11;
        }
      }
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const cropped = createCanvas(width, height);
  cropped.getContext('2d').drawImage(canvas, minX, minY, width, height, 0, 0, width, height);
  
  fs.writeFileSync('public/logo-clean2.png', cropped.toBuffer('image/png'));
  console.log('Saved clean PNG:', width, 'x', height);
}

processImage().catch(console.error);
