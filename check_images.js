const { createCanvas, loadImage } = require('canvas');

async function check(filename) {
  try {
    const image = await loadImage(filename);
    console.log(`${filename}: ${image.width}x${image.height}`);
  } catch (e) {
    console.log(e.message);
  }
}

const dir = 'C:/Users/a/.gemini/antigravity-ide/brain/c5c44f52-ba77-4f84-b88f-9dd9141677af/.user_uploaded/';
check(dir + 'media_1791466347780.png');
check(dir + 'media_1791468242594.jpg');
