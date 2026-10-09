const fs = require('fs');
const pngToIco = require('png-to-ico');

pngToIco('src/app/favicon.png')
  .then(buf => {
    fs.writeFileSync('src/app/favicon.ico', buf);
    console.log('Successfully created favicon.ico');
  })
  .catch(console.error);
