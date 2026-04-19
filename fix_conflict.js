const fs = require('fs');
let content = fs.readFileSync('src/app/notes/page.js', 'utf8');
content = content.replace(/<<<<<<< HEAD[\s\S]*?=======([\s\S]*?)>>>>>>> a63fb2346cc2fdd196bd0a2af0c2ec4911af1183/g, '$1');
fs.writeFileSync('src/app/notes/page.js', content, 'utf8');
console.log('Fixed conflicts!');
