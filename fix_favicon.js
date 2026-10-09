const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

async function fixIcon() {
  const img = await loadImage('src/app/apple-icon.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  
  // Find the bounds of the "D" vs the wordmark
  // Let's just find the bounding box of the top part (D) and bottom part (wordmark)
  let bounds = [];
  let inObject = false;
  let currentBound = null;
  
  // horizontal scanlines
  for (let y = 0; y < canvas.height; y++) {
    let hasPixel = false;
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      if (data[i+3] > 10) { // not transparent
        hasPixel = true;
        break;
      }
    }
    
    if (hasPixel && !inObject) {
      inObject = true;
      currentBound = { startY: y, endY: y };
    } else if (hasPixel && inObject) {
      currentBound.endY = y;
    } else if (!hasPixel && inObject) {
      inObject = false;
      bounds.push(currentBound);
      currentBound = null;
    }
  }
  if (currentBound) bounds.push(currentBound);
  
  console.log("Found objects at Y bounds:", bounds);
  
  if (bounds.length >= 2) {
    // The top one is probably the D, bottom is the wordmark
    const dBound = bounds[0];
    const dHeight = dBound.endY - dBound.startY + 1;
    
    // Find X bounds for the D
    let minX = canvas.width, maxX = 0;
    for (let y = dBound.startY; y <= dBound.endY; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        if (data[i+3] > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
    const dWidth = maxX - minX + 1;
    console.log(`D is at X:${minX}-${maxX}, Y:${dBound.startY}-${dBound.endY}. Width: ${dWidth}, Height: ${dHeight}`);
    
    // Create new clean icon
    const newCanvas = createCanvas(canvas.width, canvas.height);
    const newCtx = newCanvas.getContext('2d');
    
    // Center the D
    const targetX = (canvas.width - dWidth) / 2;
    const targetY = (canvas.height - dHeight) / 2;
    
    // copy just the D
    newCtx.drawImage(canvas, minX, dBound.startY, dWidth, dHeight, targetX, targetY, dWidth, dHeight);
    
    fs.writeFileSync('src/app/apple-icon.png', newCanvas.toBuffer('image/png'));
    console.log("Fixed apple-icon.png");
    
    // For favicon.ico, we might just try to copy the PNG and rename it, 
    // or if the original favicon.ico was a PNG under the hood:
    const icoMagic = fs.readFileSync('src/app/favicon.ico').slice(0, 4);
    console.log("favicon.ico magic bytes:", icoMagic);
    // If it's a real ICO, we might need png-to-ico, else we can just save it
    // Actually, browsers support PNG as favicon if we name it favicon.ico sometimes, but standard is standard.
    // Let's just save as PNG first.
    fs.writeFileSync('src/app/favicon.png', newCanvas.toBuffer('image/png'));
  }
}

fixIcon().catch(console.error);
