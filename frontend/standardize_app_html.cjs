const fs = require('fs');
let html = fs.readFileSync('src/app/app.component.html', 'utf8');
const original = html;

// 1. Column manager: ⚙️ Columns -> <i class="bi bi-layout-three-columns me-1"></i> Columns
html = html.replace(/⚙️\s*Columns/g, '<i class="bi bi-layout-three-columns me-1"></i> Columns');

// 2. Reset columns / reset button: ↺ Reset -> <i class="bi bi-arrow-counterclockwise me-1"></i> Reset
html = html.replace(/↺\s*Reset/g, '<i class="bi bi-arrow-counterclockwise me-1"></i> Reset');

// 3. Density buttons:
html = html.replace(/▤\s*Compact/g, '<i class="bi bi-distribute-vertical"></i> Compact');
html = html.replace(/☷\s*Normal/g, '<i class="bi bi-list-ul"></i> Normal');
html = html.replace(/▦\s*Spacious/g, '<i class="bi bi-grid-3x2-gap"></i> Spacious');

// 4. Bulk selection bar:
// ✓ {{ getSelectedCount(...) }} record(s) selected
html = html.replace(/✓\s*(\{\{\s*getSelectedCount\([^)]+\)\s*\}\}\s*record\(s\)\s*selected)/g, '<i class="bi bi-check-circle-fill me-1"></i> $1');
// ✕ Clear
html = html.replace(/>✕\s*Clear</g, '><i class="bi bi-x-lg me-1"></i> Clear<');
// 📥 Export
html = html.replace(/>\s*📥\s*Export/g, '><i class="bi bi-download me-1"></i> Export');

// 5. Form action buttons:
// Cancel edit: ✕ Cancel Edit
html = html.replace(/>✕\s*Cancel\s*Edit</g, '><i class="bi bi-x-circle me-1"></i> Cancel Edit<');
html = html.replace(/>✕\s*Cancel</g, '><i class="bi bi-x-circle me-1"></i> Cancel<');
// 💾 Update / 💾 Save
html = html.replace(/💾\s*Update/g, '<i class="bi bi-floppy me-1"></i> Update');
html = html.replace(/💾\s*Save/g, '<i class="bi bi-floppy me-1"></i> Save');

// 6. Row action buttons:
// ✏️ Edit
html = html.replace(/✏️\s*Edit/g, '<i class="bi bi-pencil-square me-1"></i> Edit');
// 🗑️ Delete or just 🗑️
html = html.replace(/>\s*🗑️\s*Delete\s*</g, '><i class="bi bi-trash3 me-1"></i> Delete<');
html = html.replace(/>\s*🗑️\s*</g, '><i class="bi bi-trash3"></i><');

// 7. Sort indicators:
// (sortAsc ? '▲' : '▼')
html = html.replace(/\(\s*sortAsc\s*\?\s*['"]▲['"]\s*:\s*['"]▼['"]\s*\)/g, `(sortAsc ? '↑' : '↓')`);
// If sortField has '▲' : '▼'
html = html.replace(/['"]▲['"]\s*:\s*['"]▼['"]/g, `'↑' : '↓'`);

// 8. Dashboard / Analytics icons:
html = html.replace(/<span class="kpi-icon">🏭<\/span>/g, '<span class="kpi-icon"><i class="bi bi-gear-wide-connected"></i></span>');
html = html.replace(/<span class="kpi-icon">📦<\/span>/g, '<span class="kpi-icon"><i class="bi bi-box-seam"></i></span>');
html = html.replace(/<span class="kpi-badge positive">▲\s*([\d.]+% Capacity)<\/span>/g, '<span class="kpi-badge positive"><i class="bi bi-arrow-up-short"></i> $1</span>');
html = html.replace(/<span class="visual-icon">🏭<\/span>/g, '<span class="visual-icon"><i class="bi bi-gear-wide-connected"></i></span>');
html = html.replace(/<span class="visual-icon">⚙️<\/span>/g, '<span class="visual-icon"><i class="bi bi-gear-fill"></i></span>');
html = html.replace(/<span class="visual-icon">👥<\/span>/g, '<span class="visual-icon"><i class="bi bi-people-fill"></i></span>');
html = html.replace(/<span class="visual-icon">🤖<\/span>/g, '<span class="visual-icon"><i class="bi bi-cpu-fill"></i></span>');
html = html.replace(/<span class="aii-bullet yellow">⚠️<\/span>/g, '<span class="aii-bullet yellow"><i class="bi bi-exclamation-triangle-fill"></i></span>');
html = html.replace(/<span class="aii-bullet blue">📦<\/span>/g, '<span class="aii-bullet blue"><i class="bi bi-box-seam"></i></span>');
html = html.replace(/↺\s*Sync/g, '<i class="bi bi-arrow-clockwise me-1"></i> Sync');

// Modal close button: title="Close (Esc)">✕</button>
html = html.replace(/>✕<\/button>/g, '><i class="bi bi-x-lg"></i></button>');

// Invoice modal in app.component (if any duplicated):
html = html.replace(/'✓ FULLY PAID'/g, `'FULLY PAID'`);
html = html.replace(/'✕ UNPAID'/g, `'UNPAID'`);
html = html.replace(/'◐ PARTIAL PAYMENT'/g, `'PARTIAL PAYMENT'`);

fs.writeFileSync('src/app/app.component.html', html, 'utf8');
console.log('Processed app.component.html successfully.');
