import fs from 'fs';
import path from 'path';

function transformCss(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace Cobalt Blue with Imperial Forest Emerald
  content = content.replace(/#0B47D4/gi, '#065F46');
  content = content.replace(/rgba\(11,\s*71,\s*212,/gi, 'rgba(6, 95, 70,');
  content = content.replace(/#0066FF/gi, '#047857');
  content = content.replace(/#3b82f6/gi, '#047857');
  content = content.replace(/#4f46e5/gi, '#0F766E');

  // Replace dark theme indigo with luminescent jade/emerald
  content = content.replace(/#818cf8/gi, '#34D399');
  content = content.replace(/#6366f1/gi, '#10B981');
  content = content.replace(/rgba\(99,\s*102,\s*241,/gi, 'rgba(16, 185, 129,');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Transformed: ${filePath}`);
}

const headerPath = path.resolve('frontend/src/app/components/layout/header/header.component.css');
const sidebarPath = path.resolve('frontend/src/app/components/layout/sidebar/sidebar.component.css');

transformCss(headerPath);
transformCss(sidebarPath);

console.log('Successfully applied Swiss Industrial Luxury Palette to Header & Sidebar!');
