import fs from 'fs';
import path from 'path';

function scanDir(dir) {
  const results = [];
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      results.push(...scanDir(full));
    } else if (f.endsWith('.component.html')) {
      const txt = fs.readFileSync(full, 'utf8');
      const matches = txt.match(/class="[^"]*(?:modal-backdrop|modal-dialog|modal-content|dossier-|drawer-box|dialog-box|popup)[^"]*"/g);
      if (matches && matches.length) {
        results.push({
          file: f,
          classes: [...new Set(matches.map(m => m.replace(/class="/, '').replace(/"/, '')))]
        });
      }
    }
  }
  return results;
}

const found = scanDir('src/app/components');
console.log(JSON.stringify(found, null, 2));
