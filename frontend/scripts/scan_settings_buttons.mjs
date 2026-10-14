import fs from 'fs';

const html = fs.readFileSync('src/app/components/features/settings/settings.component.html', 'utf8');
const ts = fs.readFileSync('src/app/components/features/settings/settings.component.ts', 'utf8');

// Regex for button tags
const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
let match;
const buttons = [];

while ((match = buttonRegex.exec(html)) !== null) {
  const attrs = match[1];
  const innerText = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  
  // Extract (click)
  const clickMatch = attrs.match(/\(click\)="([^"]*)"/);
  const clickHandler = clickMatch ? clickMatch[1] : null;

  // Extract type
  const typeMatch = attrs.match(/type="([^"]*)"/);
  const btnType = typeMatch ? typeMatch[1] : null;

  // Extract class
  const classMatch = attrs.match(/class="([^"]*)"/);
  const btnClass = classMatch ? classMatch[1] : '';

  // Extract id
  const idMatch = attrs.match(/id="([^"]*)"/);
  const btnId = idMatch ? idMatch[1] : '';

  buttons.push({
    text: innerText || '(icon/no text)',
    id: btnId,
    class: btnClass,
    type: btnType,
    clickHandler
  });
}

console.log(`Total buttons found in settings.component.html: ${buttons.length}`);

const deadButtons = [];
const workingButtons = [];

buttons.forEach((b, idx) => {
  if (!b.clickHandler && b.type !== 'submit') {
    deadButtons.push({ idx, ...b, reason: 'No (click) handler and not type=submit' });
  } else if (b.clickHandler) {
    // Extract method name: e.g. openAddCompanyModal() -> openAddCompanyModal
    const methodMatch = b.clickHandler.match(/^([a-zA-Z0-9_$]+)\s*\(/);
    const varAssignMatch = b.clickHandler.match(/^([a-zA-Z0-9_$.]+)\s*=/);
    
    if (methodMatch) {
      const methodName = methodMatch[1];
      // Check if method exists in ts
      const methodDefRegex = new RegExp(`\\b${methodName}\\s*\\(`);
      const exists = methodDefRegex.test(ts);
      if (!exists) {
        deadButtons.push({ idx, ...b, reason: `Method ${methodName} NOT found in settings.component.ts` });
      } else {
        workingButtons.push({ idx, ...b, methodName });
      }
    } else if (varAssignMatch) {
      // Assignment like activeSubTab = 'branding' or showModal = false
      workingButtons.push({ idx, ...b, assignment: varAssignMatch[1] });
    } else {
      workingButtons.push({ idx, ...b });
    }
  } else {
    // type="submit" in form
    workingButtons.push({ idx, ...b, formSubmit: true });
  }
});

console.log(`Working buttons: ${workingButtons.length}`);
console.log(`Potential Dead/Unbound buttons: ${deadButtons.length}`);
if (deadButtons.length > 0) {
  console.log('\n--- POTENTIAL ISSUES FOUND ---');
  console.log(JSON.stringify(deadButtons, null, 2));
}
