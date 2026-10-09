const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function processImage() {
  const img = await loadImage('C:/Users/a/.gemini/antigravity-ide/brain/c5c44f52-ba77-4f84-b88f-9dd9141677af/.user_uploaded/media_1791473278407.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  
  // We want to isolate the center part (the logo) and ignore the dark UI borders.
  // The checkerboard is light. The logo is dark (black) and red.
  // Let's find the bounding box of the non-UI area. The UI is usually at the edges.
  
  // Just dump the colors in the middle row to understand the checkerboard/UI.
  const y = Math.floor(canvas.height / 2);
  let row = [];
  for (let x = 0; x < canvas.width; x+=10) {
    const i = (y * canvas.width + x) * 4;
    row.push(`${data[i]},${data[i+1]},${data[i+2]}`);
  }
  console.log('Middle row colors:', row.join(' | '));
}

processImage().catch(console.error);
