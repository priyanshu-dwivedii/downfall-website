const fs = require('fs');

function cleanSvg(filename, isWhite) {
  let content = fs.readFileSync(filename, 'utf-8');
  
  // Remove all stroke, stroke-width, and opacity attributes
  content = content.replace(/stroke="[^"]*"/g, '');
  content = content.replace(/stroke-width="[^"]*"/g, '');
  content = content.replace(/opacity="[^"]*"/g, '');
  
  // Replace fill colors based on their rgb values
  content = content.replace(/fill="rgb\((\d+),(\d+),(\d+)\)"/g, (match, r, g, b) => {
    r = parseInt(r);
    g = parseInt(g);
    b = parseInt(b);
    
    // Is it red?
    if (r > 100 && g < 100 && b < 100) {
      return 'fill="#d10f18"'; // The approved Downfall red
    } else {
      // It's the body (black or gray)
      return isWhite ? 'fill="#ffffff"' : 'fill="#111111"';
    }
  });
  
  // Clean up any double spaces left by removing attributes
  content = content.replace(/\s+/g, ' ');
  content = content.replace(/ \/>/g, '/>');
  
  fs.writeFileSync(filename, content);
  console.log('Cleaned', filename);
}

cleanSvg('public/d-emblem.svg', false);
cleanSvg('public/d-emblem-white.svg', true);
