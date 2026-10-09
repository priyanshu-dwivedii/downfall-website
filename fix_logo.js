const fs = require('fs');

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function cleanLogo(filename, isWhite) {
  let content = fs.readFileSync(filename, 'utf-8');
  
  const paths = [...content.matchAll(/(<path[^>]*d="([^"]+)"[^>]*>)/g)];
  console.log(`Processing ${filename}. Total paths:`, paths.length);
  
  let newContent = content;
  
  paths.forEach((p, i) => {
    const fullPath = p[1];
    const d = p[2];
    const coords = [...d.matchAll(/([0-9.]+)/g)].map(m => parseFloat(m[1]));
    let minX=10000,minY=10000,maxX=-10000,maxY=-10000;
    for(let j=0; j<coords.length; j+=2) {
      let x=coords[j], y=coords[j+1];
      if(!isNaN(x) && !isNaN(y)) {
        if(x<minX) minX=x;
        if(x>maxX) maxX=x;
        if(y<minY) minY=y;
        if(y>maxY) maxY=y;
      }
    }
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Background rectangles are basically the width of the whole image (~406px)
    if (width > 390) {
      console.log(`Removing path ${i}: width=${width}, height=${height}`);
      newContent = newContent.replace(fullPath, '');
    }
  });

  newContent = newContent.replace(/stroke="[^"]*"/g, '');
  newContent = newContent.replace(/stroke-width="[^"]*"/g, '');
  newContent = newContent.replace(/opacity="[^"]*"/g, '');
  
  // Replace fill colors (hex or rgb)
  newContent = newContent.replace(/fill="([^"]+)"/g, (match, color) => {
    let r=0, g=0, b=0;
    if (color.startsWith('#')) {
      const rgb = hexToRgb(color);
      if(rgb) { r = rgb.r; g = rgb.g; b = rgb.b; }
    } else if (color.startsWith('rgb')) {
      const rgbMatch = color.match(/\d+/g);
      if(rgbMatch) { r = parseInt(rgbMatch[0]); g = parseInt(rgbMatch[1]); b = parseInt(rgbMatch[2]); }
    }
    
    // Check if it's the red accent (e.g. #99000b)
    if (r > 100 && g < 100 && b < 100) {
      return 'fill="#d10f18"'; // Approved red
    } else {
      return isWhite ? 'fill="#ffffff"' : 'fill="#111111"';
    }
  });
  
  // Also fix the svg dimensions just in case it's huge
  // (We'll leave the viewBox alone or set it if needed)
  if(!newContent.match(/viewBox/)) {
     // match width and height
     const wMatch = newContent.match(/width="(\d+)"/);
     const hMatch = newContent.match(/height="(\d+)"/);
     if (wMatch && hMatch) {
       newContent = newContent.replace(/<svg[^>]+>/, (match) => {
          return match.replace(/width="\d+" height="\d+"/, `viewBox="0 0 ${wMatch[1]} ${hMatch[1]}" width="100%" height="100%"`);
       });
     }
  }
  
  newContent = newContent.replace(/\s+/g, ' ');
  newContent = newContent.replace(/ \/>/g, '/>');
  
  fs.writeFileSync(filename, newContent);
  console.log(`Cleaned ${filename}`);
}

const execSync = require('child_process').execSync;
console.log('Retracing logo.svg first...');
execSync('node trace_new_logo.js');
console.log('Copying to logo-white.svg...');
fs.copyFileSync('public/logo.svg', 'public/logo-white.svg');

cleanLogo('public/logo.svg', false);
cleanLogo('public/logo-white.svg', true);
