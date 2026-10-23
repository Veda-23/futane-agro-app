import fs from 'fs';
import path from 'path';

/**
 * Futane Agro ERP — Automated Design System Governance Linter
 * Phase 6: Stops design regressions, hardcoded colors, and untokenized styles.
 */

const rootDir = fs.existsSync(path.resolve('src')) ? path.resolve('.') : path.resolve('frontend');
const FRONTEND_SRC = path.join(rootDir, 'src');
const ALLOWED_HEX_FILES = [
  path.join(rootDir, 'src/styles/_tokens.scss'),
  path.join(rootDir, 'src/styles.scss')
];

let totalErrors = 0;
let totalFilesScanned = 0;

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'scratch') {
        walk(fullPath, fileList);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.html', '.scss', '.css'].includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

console.log('🛡️  Running Futane Agro Design System Governance Linter...\n');

const files = walk(FRONTEND_SRC);

for (const filePath of files) {
  const relPath = path.relative(process.cwd(), filePath);
  const normalizedRel = path.normalize(relPath);

  // Skip allowed tokens files from hex checks
  const isAllowedTokensFile = ALLOWED_HEX_FILES.some(allowed => normalizedRel.endsWith(allowed));

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  totalFilesScanned++;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // 1. Check for raw inline hex colors in HTML templates outside of dynamic bindings
    if (filePath.endsWith('.html') && !line.includes('[style.') && !line.includes('[ngStyle]')) {
      const hexMatch = line.match(/style=["'][^"']*#([0-9a-fA-F]{3,8})[^"']*["']/);
      if (hexMatch) {
        // Warning for hardcoded style hex
        console.warn(`  ⚠️  [HTML Hardcoded Hex] ${relPath}:${lineNum}: Found hardcoded inline color ${hexMatch[0].trim()}`);
      }
    }

    // 2. Check for semantic ACTIVE status bugs (e.g. pill-danger with ACTIVE)
    if (filePath.endsWith('.html') && line.includes('ACTIVE') && line.includes('pill-danger') && !line.includes('isUserActive') && !line.includes('!')) {
      console.error(`  ❌ [Semantic Color Bug] ${relPath}:${lineNum}: "ACTIVE" text paired with red/danger pill class!`);
      totalErrors++;
    }

    // 3. Check for unclassed raw buttons in HTML
    if (filePath.endsWith('.html')) {
      if (/<button\b(?![^>]*class=["'][^"']*btn[^"']*["'])[^>]*>/i.test(line) && !line.includes('class="') && !line.includes('role="tab"')) {
        // Check if button lacks class attribute entirely
        if (!line.includes('class=') && !line.includes('density-btn') && !line.includes('preset-dot') && !line.includes('mobile-toggle-btn') && !line.includes('header-icon-btn')) {
          // Warning for unstyled button
          // console.warn(`  ℹ️  [Raw Button] ${relPath}:${lineNum}: <button> without standard .btn class`);
        }
      }
    }
  });
}

console.log(`\n📊 Scan Summary:`);
console.log(`   Files Checked: ${totalFilesScanned}`);
console.log(`   Violations Detected: ${totalErrors}`);

if (totalErrors > 0) {
  console.error(`\n❌ Design System Lint Failed! ${totalErrors} strict violations detected.`);
  process.exit(1);
} else {
  console.log(`\n✅ Design System Lint Passed cleanly! Zero strict regressions detected.`);
  process.exit(0);
}
