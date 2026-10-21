const fs = require('fs');

const data = fs.readFileSync('docs/FUTANE_AGRO_ERP_COMPLETE_SOP.pdf');
const text = data.toString('latin1');

// Match all Page objects
// In PDF: obj ... << ... /Type /Page ... >> ... endobj
const pageRegex = /(\d+)\s+0\s+obj\s*<<[^>]*\/Type\s*\/Page\b[^>]*>>\s*endobj/gs;
let match;
let count = 0;
const pageObjNums = [];
while ((match = pageRegex.exec(text)) !== null) {
  count++;
  pageObjNums.push(match[1]);
}

console.log(`Found ${count} page objects in PDF structure.`);

// For each page object, check its /Contents reference
let blankPages = 0;
let contentLengths = [];

pageObjNums.forEach((objNum, idx) => {
  const pageDefRegex = new RegExp(`${objNum}\\s+0\\s+obj\\s*<<(.*?)>>\\s*endobj`, 's');
  const pageDefMatch = text.match(pageDefRegex);
  if (!pageDefMatch) {
    console.log(`Page ${idx + 1}: could not parse obj ${objNum}`);
    return;
  }
  const pageDict = pageDefMatch[1];
  const contentsMatch = pageDict.match(/\/Contents\s+(\d+)\s+0\s+R/);
  if (!contentsMatch) {
    // Might be an array of contents or direct
    const contentsArrMatch = pageDict.match(/\/Contents\s*\[([^\]]+)\]/);
    if (!contentsArrMatch) {
      console.log(`Page ${idx + 1} has NO /Contents entry! (Possibly BLANK)`);
      blankPages++;
      return;
    }
  } else {
    const streamObjNum = contentsMatch[1];
    const streamRegex = new RegExp(`${streamObjNum}\\s+0\\s+obj\\s*<<(.*?)>>\\s*stream\r?\n(.*?)\r?\nendstream`, 's');
    const streamMatch = text.match(streamRegex);
    if (streamMatch) {
      const streamLen = streamMatch[2].length;
      contentLengths.push(streamLen);
      if (streamLen < 50) {
        console.log(`Page ${idx + 1}: Warning, suspiciously small content stream (${streamLen} bytes)`);
        blankPages++;
      }
    }
  }
});

console.log(`Total Pages: ${count}`);
console.log(`Pages with valid content streams: ${contentLengths.length}`);
console.log(`Average stream size: ${(contentLengths.reduce((a, b) => a + b, 0) / contentLengths.length).toFixed(0)} bytes`);
console.log(`Blank or empty pages detected: ${blankPages}`);
