import fs from 'fs';

const cssPath = 'frontend/src/app/components/features/vendors/vendors.component.css';
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Header border and shadow
css = css.replace(
  /border: 1px solid var\(--border-card, rgba\(99, 102, 241, 0\.12\)\);\s*border-radius: var\(--radius-card, 14px\);\s*box-shadow: var\(--shadow-card, 0 4px 20px -2px rgba\(11, 71, 212, 0\.06\), 0 2px 6px -1px rgba\(30, 27, 75, 0\.04\)\);/,
  `border: 1px solid var(--border-color, rgba(226, 232, 240, 0.85));\n  border-radius: var(--radius-card, 14px);\n  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02);`
);

// 2. Header icon box
css = css.replace(
  /background: linear-gradient\(135deg, #0B47D4 0%, #0066FF 100%\);\s*color: #ffffff;\s*font-size: 22px;\s*box-shadow: 0 4px 14px rgba\(11, 71, 212, 0\.28\);/,
  `background: linear-gradient(135deg, #065F46 0%, #047857 100%);\n  color: #ffffff;\n  font-size: 22px;\n  box-shadow: 0 4px 14px rgba(6, 95, 70, 0.28);`
);

// 3. Header count pill
css = css.replace(
  /background: rgba\(11, 71, 212, 0\.08\);\s*color: #0B47D4;\s*border: 1px solid rgba\(11, 71, 212, 0\.2\);/,
  `background: rgba(6, 95, 70, 0.08);\n  color: #065F46;\n  border: 1px solid rgba(6, 95, 70, 0.2);`
);

// 4. Secondary button hover
css = css.replace(
  /border-color: #0B47D4;\s*color: #0B47D4;/g,
  `border-color: #065F46;\n  color: #065F46;`
);

// 5. Primary button in header
css = css.replace(
  /background: linear-gradient\(135deg, #0B47D4 0%, #0066FF 100%\) !important;\s*color: #ffffff !important;\s*border: 1px solid transparent !important;\s*box-shadow: 0 4px 14px rgba\(11, 71, 212, 0\.32\) !important;/,
  `background: linear-gradient(135deg, #065F46 0%, #047857 100%) !important;\n  color: #ffffff !important;\n  border: 1px solid transparent !important;\n  box-shadow: 0 4px 14px rgba(6, 95, 70, 0.32) !important;`
);

css = css.replace(
  /background: linear-gradient\(135deg, #093cb3 0%, #0052cc 100%\) !important;\s*box-shadow: 0 6px 18px rgba\(11, 71, 212, 0\.42\) !important;/,
  `background: linear-gradient(135deg, #047857 0%, #064E3B 100%) !important;\n  box-shadow: 0 6px 18px rgba(6, 95, 70, 0.42) !important;`
);

// 6. Subnav tab buttons
css = css.replace(
  /border-color: rgba\(11, 71, 212, 0\.3\);/g,
  `border-color: rgba(6, 95, 70, 0.3);`
);

css = css.replace(
  /background: linear-gradient\(135deg, #0B47D4 0%, #0066FF 100%\);\s*color: #ffffff;\s*border-color: transparent;\s*font-weight: 700;\s*box-shadow: 0 4px 14px rgba\(11, 71, 212, 0\.32\);/,
  `background: linear-gradient(135deg, #065F46 0%, #047857 100%);\n  color: #ffffff;\n  border-color: transparent;\n  font-weight: 700;\n  box-shadow: 0 4px 14px rgba(6, 95, 70, 0.32);`
);

css = css.replace(
  /box-shadow: 0 2px 6px rgba\(11, 71, 212, 0\.3\);/g,
  `box-shadow: 0 2px 6px rgba(6, 95, 70, 0.3);`
);

// 7. KPI card borders & shadows
css = css.replace(
  /border: 1px solid var\(--border-card, rgba\(99, 102, 241, 0\.12\)\);\s*border-radius: var\(--radius-card, 18px\);\s*padding: 16px 18px;\s*display: flex;\s*align-items: flex-start;\s*gap: 14px;\s*box-shadow: var\(--shadow-card, 0 4px 20px -2px rgba\(11, 71, 212, 0\.06\), 0 2px 6px -1px rgba\(30, 27, 75, 0\.04\)\);/,
  `border: 1px solid var(--border-color, rgba(226, 232, 240, 0.85));\n  border-radius: var(--radius-card, 18px);\n  padding: 16px 18px;\n  display: flex;\n  align-items: flex-start;\n  gap: 14px;\n  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02);`
);

css = css.replace(
  /transform: translateY\(-3px\);\s*box-shadow: var\(--shadow-card-hover, 0 14px 30px -4px rgba\(11, 71, 212, 0\.14\), 0 4px 12px -2px rgba\(30, 27, 75, 0\.06\)\);\s*border-color: rgba\(11, 71, 212, 0\.25\);/,
  `transform: translateY(-3px);\n  box-shadow: 0 12px 24px -4px rgba(6, 95, 70, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.04);\n  border-color: rgba(6, 95, 70, 0.25);`
);

// 8. KPI colors
css = css.replace(
  /\.kpi-blue\s*\{\s*background: linear-gradient\(135deg, #0B47D4 0%, #0066FF 100%\) !important;\s*color: #ffffff !important;\s*box-shadow: 0 4px 14px rgba\(11, 71, 212, 0\.32\) !important;\s*\}/,
  `.kpi-emerald { background: linear-gradient(135deg, #065F46 0%, #047857 100%) !important; color: #ffffff !important; box-shadow: 0 4px 14px rgba(6, 95, 70, 0.32) !important; }\n.kpi-blue    { background: linear-gradient(135deg, #065F46 0%, #047857 100%) !important; color: #ffffff !important; box-shadow: 0 4px 14px rgba(6, 95, 70, 0.32) !important; }`
);

// 9. Primary action button
css = css.replace(
  /background: linear-gradient\(135deg, #0B47D4 0%, #0066FF 100%\);\s*border: 1px solid transparent;\s*color: #ffffff;\s*cursor: pointer;\s*box-shadow: 0 4px 14px rgba\(11, 71, 212, 0\.28\);/,
  `background: linear-gradient(135deg, #065F46 0%, #047857 100%);\n  border: 1px solid transparent;\n  color: #ffffff;\n  cursor: pointer;\n  box-shadow: 0 4px 14px rgba(6, 95, 70, 0.28);`
);

css = css.replace(
  /background: linear-gradient\(135deg, #0050D8 0%, #0055E6 100%\);\s*transform: translateY\(-1px\);\s*box-shadow: 0 6px 18px rgba\(11, 71, 212, 0\.38\);/g,
  `background: linear-gradient(135deg, #047857 0%, #064E3B 100%);\n  transform: translateY(-1px);\n  box-shadow: 0 6px 18px rgba(6, 95, 70, 0.38);`
);

// 10. Filter pills active override
css = css.replace(
  /background: linear-gradient\(135deg, #0B47D4 0%, #0066FF 100%\) !important;\s*border-color: transparent !important;\s*color: #ffffff !important;\s*box-shadow: 0 2px 8px rgba\(11, 71, 212, 0\.28\) !important;/,
  `background: linear-gradient(135deg, #065F46 0%, #047857 100%) !important;\n  border-color: transparent !important;\n  color: #ffffff !important;\n  box-shadow: 0 2px 8px rgba(6, 95, 70, 0.28) !important;`
);

// 11. Form actions btn-primary
css = css.replace(
  /background: linear-gradient\(135deg, #0B47D4 0%, #0066FF 100%\);\s*border: 1px solid transparent;\s*color: #ffffff;\s*box-shadow: 0 4px 14px rgba\(11, 71, 212, 0\.24\);/,
  `background: linear-gradient(135deg, #065F46 0%, #047857 100%);\n  border: 1px solid transparent;\n  color: #ffffff;\n  box-shadow: 0 4px 14px rgba(6, 95, 70, 0.24);`
);

css = css.replace(
  /background: linear-gradient\(135deg, #0050D8 0%, #0055E6 100%\);\s*transform: translateY\(-1px\);\s*box-shadow: 0 6px 18px rgba\(11, 71, 212, 0\.34\);/,
  `background: linear-gradient(135deg, #047857 0%, #064E3B 100%);\n  transform: translateY(-1px);\n  box-shadow: 0 6px 18px rgba(6, 95, 70, 0.34);`
);

// 12. Bottom overrides
css = css.replace(
  /flex-shrink: 0 !important; background: linear-gradient\(135deg, #0B47D4 0%, #0066FF 100%\) !important;\s*color: #ffffff !important; box-shadow: 0 4px 14px rgba\(11,71,212,0\.32\) !important;/,
  `flex-shrink: 0 !important; background: linear-gradient(135deg, #065F46 0%, #047857 100%) !important;\n  color: #ffffff !important; box-shadow: 0 4px 14px rgba(6,95,70,0.32) !important;`
);

css = css.replace(
  /\.kpi-icon-wrapper\.primary,\.kpi-icon-wrap\.primary \{ background:linear-gradient\(135deg,#0B47D4 0%,#0066FF 100%\) !important; color:#fff !important; box-shadow:0 4px 14px rgba\(11,71,212,0\.32\) !important; \}/,
  `.kpi-icon-wrapper.primary,.kpi-icon-wrap.primary { background:linear-gradient(135deg,#065F46 0%,#047857 100%) !important; color:#fff !important; box-shadow:0 4px 14px rgba(6,95,70,0.32) !important; }`
);

css = css.replace(
  /\.header-icon-box \{ width:46px !important; height:46px !important; border-radius:14px !important; background:linear-gradient\(135deg,#0B47D4 0%,#0066FF 100%\) !important; color:#fff !important; display:flex !important; align-items:center !important; justify-content:center !important; font-size:22px !important; box-shadow:0 4px 14px rgba\(11,71,212,0\.28\) !important; flex-shrink:0 !important; position:relative !important; overflow:hidden !important; transition:transform 0.2s cubic-bezier\(0.34,1.56,0.64,1\) !important; \}/,
  `.header-icon-box { width:46px !important; height:46px !important; border-radius:14px !important; background:linear-gradient(135deg,#065F46 0%,#047857 100%) !important; color:#fff !important; display:flex !important; align-items:center !important; justify-content:center !important; font-size:22px !important; box-shadow:0 4px 14px rgba(6,95,70,0.28) !important; flex-shrink:0 !important; position:relative !important; overflow:hidden !important; transition:transform 0.2s cubic-bezier(0.34,1.56,0.64,1) !important; }`
);

css = css.replace(
  /\.kpi-card:hover \{ border-color:rgba\(11,71,212,0\.25\) !important; box-shadow:0 14px 30px -4px rgba\(11,71,212,0\.14\),0 4px 12px -2px rgba\(30,27,75,0\.06\) !important; \}/,
  `.kpi-card:hover { border-color:rgba(6,95,70,0.25) !important; box-shadow:0 14px 30px -4px rgba(6,95,70,0.14),0 4px 12px -2px rgba(30,27,75,0.06) !important; }`
);

css = css.replace(
  /\.btn-success\.btn-header-action,\.btn-add-new,\.btn-header-primary \{ background:linear-gradient\(135deg,#0B47D4 0%,#0066FF 100%\) !important; border-color:transparent !important; color:#fff !important; box-shadow:0 4px 14px rgba\(11,71,212,0\.28\) !important; \}/,
  `.btn-success.btn-header-action,.btn-add-new,.btn-header-primary { background:linear-gradient(135deg,#065F46 0%,#047857 100%) !important; border-color:transparent !important; color:#fff !important; box-shadow:0 4px 14px rgba(6,95,70,0.28) !important; }`
);

css = css.replace(
  /\.btn-success\.btn-header-action:hover,\.btn-add-new:hover,\.btn-header-primary:hover \{ background:linear-gradient\(135deg,#0050D8 0%,#0055E6 100%\) !important; transform:translateY\(-1px\) !important; box-shadow:0 6px 18px rgba\(11,71,212,0\.38\) !important; \}/,
  `.btn-success.btn-header-action:hover,.btn-add-new:hover,.btn-header-primary:hover { background:linear-gradient(135deg,#047857 0%,#064E3B 100%) !important; transform:translateY(-1px) !important; box-shadow:0 6px 18px rgba(6,95,70,0.38) !important; }`
);

fs.writeFileSync(cssPath, css, 'utf8');
console.log('Successfully upgraded Vendors CSS to Executive Imperial Emerald standard!');
