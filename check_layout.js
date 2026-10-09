const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function checkLayout() {
  const img = await loadImage('public/logo-clean.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  
  let minRedY = canvas.height, maxRedY = 0, minRedX = canvas.width, maxRedX = 0;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      if (data[i] === 208) {
        if (x < minRedX) minRedX = x; if (x > maxRedX) maxRedX = x;
        if (y < minRedY) minRedY = y; if (y > maxRedY) maxRedY = y;
      }
    }
  }
  console.log(`Red bounding box: X:${minRedX}-${maxRedX}, Y:${minRedY}-${maxRedY}`);
  console.log(`Total size: ${canvas.width}x${canvas.height}`);
  
  // Let's find horizontal gaps
  let emptyRows = [];
  for (let y = 0; y < canvas.height; y++) {
    let empty = true;
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      if (data[i+3] > 0) { empty = false; break; }
    }
    if (empty) emptyRows.push(y);
  }
  
  console.log(`Empty rows count: ${emptyRows.length}`);
  
  // Find vertical gaps
  let emptyCols = [];
  for (let x = 0; x < canvas.width; x++) {
    let empty = true;
    for (let y = 0; y < canvas.height; y++) {
      const i = (y * canvas.width + x) * 4;
      if (data[i+3] > 0) { empty = false; break; }
    }
    if (empty) emptyCols.push(x);
  }
  console.log(`Empty cols count: ${emptyCols.length}`);
}

checkLayout().catch(console.error);
