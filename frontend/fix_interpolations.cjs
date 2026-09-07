const fs = require('fs');

let content = fs.readFileSync('src/app/app.component.html', 'utf8');

// Regex to find: {{ <condition> ? '<i class="bi bi-... me-1"></i> <UpdateText>' : <fallback> }}
const regex = /\{\{\s*([a-zA-Z0-9_$.]+)\s*\?\s*'<i class="bi bi-[^"]+"><\/i>\s*([^']+)'\s*:\s*([^}]+)\}\}/g;

let count = 0;
content = content.replace(regex, (match, condition, updateText, fallback) => {
  count++;
  console.log(`Fixing [${condition}]: text='${updateText}', fallback='${fallback.trim()}'`);
  return `<i class="bi bi-check2 me-1"></i>{{ ${condition} ? '${updateText.trim()}' : ${fallback.trim()} }}`;
});

console.log(`Total replaced with regex: ${count}`);

// Verify if any remain
const lines = content.split('\n');
let remaining = 0;
lines.forEach((line, idx) => {
  if (/\{\{.*<i class=.*\}\}/.test(line)) {
    remaining++;
    console.log(`Still found on line ${idx + 1}: ${line.trim()}`);
  }
});
console.log(`Remaining <i class= inside {{ }}: ${remaining}`);

fs.writeFileSync('src/app/app.component.html', content, 'utf8');
