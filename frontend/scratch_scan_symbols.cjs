const fs = require('fs');
const c = fs.readFileSync('src/app/app.component.html', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
  if (l.includes("activeTab === '") || l.includes('activeTab === "')) {
    console.log(`L${i + 1}: ${l.trim()}`);
  }
});
