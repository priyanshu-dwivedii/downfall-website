const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

async function createEmblemAndFavicon() {
  const img = await loadImage('public/downfall-black-red-transparent.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  
  // Find the bounds of the "D" vs the wordmark
  let bounds = [];
  let inObject = false;
  let currentBound = null;
  
  // horizontal scanlines to separate D and wordmark vertically
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
    // The top one is the D, bottom is the wordmark
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
    
    // 1. Create the transparent D crop (d-emblem-black-transparent.png)
    const cropCanvas = createCanvas(dWidth, dHeight);
    cropCanvas.getContext('2d').drawImage(canvas, minX, dBound.startY, dWidth, dHeight, 0, 0, dWidth, dHeight);
    fs.writeFileSync('public/d-emblem-black-transparent.png', cropCanvas.toBuffer('image/png'));
    
    // 2. Create the apple-icon.png (180x180) with modest transparent padding
    // We'll scale the D to fit within 180x180 with some padding.
    const iconSize = 180;
    const padding = 20; // total padding? Let's say we want D to be 140x140 max
    const maxDSize = iconSize - padding * 2;
    
    const scale = Math.min(maxDSize / dWidth, maxDSize / dHeight);
    const scaledWidth = dWidth * scale;
    const scaledHeight = dHeight * scale;
    
    const appleCanvas = createCanvas(iconSize, iconSize);
    const appleCtx = appleCanvas.getContext('2d');
    
    const targetX = (iconSize - scaledWidth) / 2;
    const targetY = (iconSize - scaledHeight) / 2;
    appleCtx.drawImage(cropCanvas, 0, 0, dWidth, dHeight, targetX, targetY, scaledWidth, scaledHeight);
    
    fs.writeFileSync('src/app/apple-icon.png', appleCanvas.toBuffer('image/png'));
    
    // 3. Create a favicon.png that we'll convert to favicon.ico later using png-to-ico
    // Favicons usually scale well if we just give it a nice square PNG. 180x180 is fine for png-to-ico,
    // it will generate 16, 32, 48 from it.
    // Wait, let's make a larger one just in case, or just use the apple-icon.png.
    fs.writeFileSync('src/app/favicon.png', appleCanvas.toBuffer('image/png'));
    
    console.log("Successfully generated emblems and icons.");
  } else {
    console.log("Could not cleanly separate D and wordmark.", bounds);
  }
}

createEmblemAndFavicon().catch(console.error);
