const fs = require('fs');
const s = fs.readFileSync('public/d-emblem-white.svg', 'utf8');
const m = s.match(/fill="[^"]*"/g);
console.log([...new Set(m)]);
