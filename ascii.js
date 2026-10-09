const { createCanvas, loadImage } = require('canvas');

async function printAscii() {
  const img = await loadImage('public/emblem-clean2.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const data = ctx.getImageData(0, 0, img.width, img.height).data;
  
  for (let y = 100; y < 350; y += 10) {
    let row = '';
    for (let x = 90; x < 330; x += 5) {
      const i = (y * img.width + x) * 4;
      const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      if (a < 50) {
        row += ' ';
      } else if (r > 100 && g < 100 && b < 100) {
        row += 'R';
      } else {
        row += 'B';
      }
    }
    console.log(row);
  }
}

printAscii().catch(console.error);
