import fs from 'fs';

const cssPath = 'frontend/src/app/components/features/raw-materials/raw-materials.component.css';
const htmlPath = 'frontend/src/app/components/features/raw-materials/raw-materials.component.html';

const css = fs.readFileSync(cssPath, 'utf8');
const cssLines = css.split('\n');

console.log('--- CSS MATCHES ---');
cssLines.forEach((l, idx) => {
  if (/0B47D4|0066FF|093cb3|0052cc|0050D8|0055E6|11,\s*71|kpi-blue/i.test(l)) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});

const html = fs.readFileSync(htmlPath, 'utf8');
const htmlLines = html.split('\n');

console.log('\n--- HTML MATCHES ---');
htmlLines.forEach((l, idx) => {
  if (/kpi-blue|btn-primary/i.test(l)) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
