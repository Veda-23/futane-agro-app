const fs = require('fs');
const crypto = require('crypto');

const content = fs.readFileSync('scripts/generator/volume4_ui_tabs.mjs', 'utf8');
const regex = /file:\s*"([^"]+)"/g;
let match;
const files = [];
while ((match = regex.exec(content)) !== null) {
  files.push(match[1]);
}

console.log('Total screens defined in Volume 4:', files.length);
const seen = {};
let duplicateCount = 0;
files.forEach((f, idx) => {
  const p = 'docs/screenshots/' + f;
  if (!fs.existsSync(p)) {
    console.error(`ERROR: File does not exist: ${p}`);
    return;
  }
  const buf = fs.readFileSync(p);
  const h = crypto.createHash('md5').update(buf).digest('hex');
  const size = (buf.length / 1024).toFixed(1);
  if (seen[h]) {
    console.error(`DUPLICATE DETECTED: Screen ${idx + 1} (${f}) has IDENTICAL hash to ${seen[h]}!`);
    duplicateCount++;
  } else {
    seen[h] = f;
    console.log(`[OK] Screen ${idx + 1}: ${f} (${size} KB, md5: ${h.slice(0, 8)})`);
  }
});

console.log(`Summary: ${files.length} screens checked. ${duplicateCount} duplicates found.`);
