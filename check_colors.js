const fs = require('fs');
const c = fs.readFileSync('public/logo-white.svg', 'utf-8');
const m = new Set([...c.matchAll(/fill="([^"]+)"/g)].map(x => x[1]));
console.log(Array.from(m));
