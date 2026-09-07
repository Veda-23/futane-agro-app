const fs = require('fs');
const content = fs.readFileSync('src/app/app.component.html', 'utf8');
const lines = content.split('\n');
const specialChars = ['✏', '🗑', '💾', '↺', '▤', '▦', '☷', '▲', '▼', '↕', '✓', '✕', '📤', '📥', '⚙', '👁', '🤖', '📦', '⚠️', '◀', '▶', '→', '←', '🧾', '📋', '🏭', '💰', '🚛', '👥', '💸', '🏛', '🏷', '❓', 'ℹ', '✅', '❌', '🔴', '🟡', '🟢', '🔵'];

const matches = [];
lines.forEach((line, idx) => {
  for (const s of specialChars) {
    if (line.includes(s)) {
      matches.push({ line: idx + 1, char: s, text: line.trim() });
      break;
    }
  }
});

console.log('Total matches found:', matches.length);
matches.forEach(m => console.log(`L${m.line} [${m.char}]: ${m.text.slice(0, 100)}`));
