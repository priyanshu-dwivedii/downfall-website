const { loadImage } = require('canvas');
const fs = require('fs');
async function checkImages() {
  const dir = 'C:/Users/a/.gemini/antigravity-ide/brain/ac18a124-edb8-46d1-890e-487626103839/.user_uploaded/';
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.png')) continue;
    const img = await loadImage(dir + f);
    const canvas = require('canvas').createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, img.width, img.height).data;
    let b = 0, w = 0;
    for (let i = 0; i < data.length; i+=4) {
      if (data[i+3] > 100) {
        if (data[i] < 50 && data[i+1] < 50 && data[i+2] < 50) b++;
        if (data[i] > 200 && data[i+1] > 200 && data[i+2] > 200) w++;
      }
    }
    console.log(f, 'Black:', b, 'White:', w);
  }
}
checkImages().catch(console.error);
