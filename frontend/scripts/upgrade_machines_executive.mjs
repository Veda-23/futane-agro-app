import fs from 'fs';
import path from 'path';

const file = path.resolve('src/app/components/features/machines/machines.component.css');
let css = fs.readFileSync(file, 'utf8');

// Replace gradient blues with Imperial Emerald
css = css.replace(/linear-gradient\(135deg,\s*#0B47D4\s*0%,\s*#0066FF\s*100%\)/gi, 'linear-gradient(135deg, #065F46 0%, #047857 100%)');
css = css.replace(/linear-gradient\(135deg,\s*#093cb3\s*0%,\s*#0052cc\s*100%\)/gi, 'linear-gradient(135deg, #047857 0%, #064E3B 100%)');
css = css.replace(/linear-gradient\(135deg,\s*#0050D8\s*0%,\s*#0055E6\s*100%\)/gi, 'linear-gradient(135deg, #047857 0%, #064E3B 100%)');

// Replace rgba(11, 71, 212, <alpha>) with rgba(6, 95, 70, <alpha>)
css = css.replace(/rgba\(11,\s*71,\s*212/gi, 'rgba(6, 95, 70');

// Replace remaining single hex #0B47D4 / #0b47d4 with #065F46
css = css.replace(/#0B47D4/gi, '#065F46');

// Replace border-card rgba(99, 102, 241, 0.12) with subtle slate
css = css.replace(/rgba\(99,\s*102,\s*241,\s*0\.12\)/gi, 'rgba(226, 232, 240, 0.85)');

// Ensure .kpi-emerald and clean overrides are present
const overrideBlock = `
/* =========================================================================
   EXECUTIVE DUAL-TONE & IMPERIAL EMERALD OVERRIDES (MACHINES MODULE)
   ========================================================================= */
.kpi-emerald,
.machine-kpi-icon.kpi-emerald,
.kpi-blue,
.machine-kpi-icon.kpi-blue {
  background: linear-gradient(135deg, #065F46 0%, #047857 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(6, 95, 70, 0.32) !important;
}

.header-icon-box,
.page-header-icon,
.module-header-icon,
.erp-header-icon,
.header-icon-badge {
  background: linear-gradient(135deg, #065F46 0%, #047857 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(6, 95, 70, 0.28) !important;
}

.btn-header-primary,
button.btn-primary.btn-header-primary,
.btn-success.btn-header-action,
.btn-add-new {
  background: linear-gradient(135deg, #065F46 0%, #047857 100%) !important;
  border-color: transparent !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(6, 95, 70, 0.28) !important;
}

.btn-header-primary:hover,
button.btn-primary.btn-header-primary:hover,
.btn-success.btn-header-action:hover,
.btn-add-new:hover {
  background: linear-gradient(135deg, #047857 0%, #064E3B 100%) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 18px rgba(6, 95, 70, 0.38) !important;
}

.erp-panel-icon {
  background: linear-gradient(135deg, #065F46 0%, #047857 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(6, 95, 70, 0.25) !important;
}

.machine-kpi-card:hover {
  border-color: rgba(6, 95, 70, 0.28) !important;
  box-shadow: 0 12px 24px -4px rgba(6, 95, 70, 0.12), 0 4px 10px -2px rgba(15, 23, 42, 0.04) !important;
}

.subnav-tab-btn.active {
  background: linear-gradient(135deg, #065F46 0%, #047857 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(6, 95, 70, 0.32) !important;
}

.erp-filter-pill.active,
.status-filter-pill.active,
.filter-pill.active,
.subtab-pill-btn.active {
  background: linear-gradient(135deg, #065F46 0%, #047857 100%) !important;
  border-color: transparent !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(6, 95, 70, 0.28) !important;
}
`;

css = css.trimEnd() + '\n' + overrideBlock;
fs.writeFileSync(file, css, 'utf8');
console.log('Successfully upgraded machines.component.css to Executive Dual-Tone & Imperial Emerald!');
