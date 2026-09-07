const fs = require('fs');
const path = require('path');

const specialChars = ['✏', '🗑', '💾', '↺', '▤', '▦', '☷', '▲', '▼', '↕', '✓', '✕', '📤', '📥', '⚙️', '👁️', '🤖', '📦', '⚠️', '◀', '▶', '🧾', '📋', '🏭', '💰', '🚛', '👥', '💸', '🏛', '🏷️', '❓', '✅', '❌', '🔴', '🟡', '🟢', '🔵', '🔐', '🔒', '🙈', '⏱'];

let totalFound = 0;
const results = [];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist') {
        scanDir(full);
      }
    } else if (f.endsWith('.html') || f.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Exclude translate.service.ts or language dictionaries if they define translations or tests
        if (full.includes('translate.service.ts') || full.includes('.spec.ts')) return;
        for (const s of specialChars) {
          if (line.includes(s)) {
            totalFound++;
            results.push({ file: path.relative('.', full), line: idx + 1, char: s, text: line.trim() });
            break;
          }
        }
      });
    }
  }
}

scanDir('src');
console.log('Total across entire src/:', totalFound);
results.slice(0, 50).forEach(r => console.log(`${r.file}:${r.line} [${r.char}] -> ${r.text.slice(0, 100)}`));
if (results.length > 50) console.log(`... and ${results.length - 50} more`);
