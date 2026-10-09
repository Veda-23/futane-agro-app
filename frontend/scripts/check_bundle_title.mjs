import * as fs from 'fs';
const content = fs.readFileSync('dist/frontend/browser/main-U6QPYFBU.js', 'utf8');
const match = content.match(/Futane [^"']+/g);
console.log('Matches:', match?.slice(0, 5));
