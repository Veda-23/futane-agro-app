const fs = require('fs');
const html = fs.readFileSync('C:/Users/Vedant/.gemini/antigravity-ide/brain/63ae1ca7-044a-4a77-a0c6-a06dc2558ecf/report_preview.html', 'utf8');

// find all matches of tab / module titles
const regex = /class="section-title"[^>]*>([\s\S]*?)<\/div>/g;
let match;
let count = 0;
while ((match = regex.exec(html)) !== null) {
  count++;
  console.log(count + '. ' + match[1].replace(/<[^>]+>/g, ' ').trim());
}

if (count === 0) {
  // Check any card-title or similar
  const cards = html.match(/class="card-title"[^>]*>([\s\S]*?)<\/span>/g) || [];
  console.log('Total card titles:', cards.length);
  cards.slice(0, 15).forEach(c => console.log('  ', c.replace(/<[^>]+>/g, '').trim()));
}
