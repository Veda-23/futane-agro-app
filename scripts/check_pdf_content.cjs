const fs = require('fs');
const path = require('path');

async function verifyPdf() {
  const pdfPath = path.resolve('docs', 'FUTANE_AGRO_ERP_COMPLETE_SOP.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF file does not exist at:', pdfPath);
    process.exit(1);
  }

  const fileBytes = fs.readFileSync(pdfPath);
  console.log(`PDF File Size: ${(fileBytes.length / (1024 * 1024)).toFixed(2)} MB (${fileBytes.length} bytes)`);

  const { PDFDocument } = require('../frontend/node_modules/pdf-lib');
  const pdfDoc = await PDFDocument.load(fileBytes);
  const pageCount = pdfDoc.getPageCount();

  console.log(`========================================`);
  console.log(`TOTAL VERIFIED PDF PAGES: ${pageCount}`);
  console.log(`========================================`);

  const sampleIndices = [0, Math.floor(pageCount / 4), Math.floor(pageCount / 2), Math.floor((3 * pageCount) / 4), pageCount - 1];
  sampleIndices.forEach(idx => {
    const page = pdfDoc.getPage(idx);
    const { width, height } = page.getSize();
    console.log(`Page ${idx + 1}: Width = ${width.toFixed(1)}pt, Height = ${height.toFixed(1)}pt (A4: ~595x842)`);
  });

  if (pageCount >= 200) {
    console.log(`\n🎉 Verification Passed: Document meets the 200+ page technical specification requirement!`);
  } else {
    console.warn(`\n⚠️ Warning: Document has ${pageCount} pages, target was 200+ pages.`);
  }
}

verifyPdf().catch(console.error);
