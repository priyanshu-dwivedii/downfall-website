const fs = require('fs');

function cleanSvg(filename, isWhite) {
  let content = fs.readFileSync(filename, 'utf-8');
  
  content = content.replace(/stroke="[^"]*"/g, '');
  content = content.replace(/stroke-width="[^"]*"/g, '');
  content = content.replace(/opacity="[^"]*"/g, '');
  
  content = content.replace(/fill="rgb\((\d+),(\d+),(\d+)\)"/g, (match, r, g, b) => {
    r = parseInt(r);
    g = parseInt(g);
    b = parseInt(b);
    
    if (r > 100 && g < 100 && b < 100) {
      return 'fill="#d10f18"'; 
    } else {
      return isWhite ? 'fill="#ffffff"' : 'fill="#111111"';
    }
  });
  
  content = content.replace(/\s+/g, ' ');
  content = content.replace(/ \/>/g, '/>');
  
  fs.writeFileSync(filename, content);
  console.log('Cleaned', filename);
}

cleanSvg('public/logo.svg', false);
cleanSvg('public/logo-white.svg', true);
