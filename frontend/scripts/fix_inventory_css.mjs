import fs from 'fs';
import path from 'path';

const file = path.resolve('src/app/components/features/inventory/inventory.component.css');
let content = fs.readFileSync(file, 'utf8');

const marker = 'KPI ICON & BADGE OVERRIDES';
const idx = content.indexOf(marker);

if (idx === -1) {
  console.error('Marker not found!');
  process.exit(1);
}

const commentStart = content.lastIndexOf('/*', idx);
const before = content.slice(0, commentStart).trimEnd();

const tail = `/* =========================================================================
   KPI ICON & BADGE OVERRIDES
   ========================================================================= */
.kpi-icon-wrap,
.kpi-icon-wrapper {
  width: 44px !important;
  height: 44px !important;
  border-radius: 14px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
  position: relative !important;
  overflow: hidden !important;
  font-size: 19px !important;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

.kpi-icon-wrap::after,
.kpi-icon-wrapper::after {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  right: 0 !important;
  width: 60% !important;
  height: 50% !important;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 100%) !important;
  border-radius: 0 14px 0 80px !important;
  pointer-events: none !important;
}

.kpi-icon-wrapper.primary,
.kpi-icon-wrap.primary,
.kpi-icon-wrap.kpi-emerald,
.kpi-emerald {
  background: linear-gradient(135deg, #065F46 0%, #047857 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(6, 95, 70, 0.32) !important;
}

.kpi-icon-wrapper.success,
.kpi-icon-wrap.success {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.32) !important;
}

.kpi-icon-wrapper.danger,
.kpi-icon-wrap.danger {
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.32) !important;
}

.kpi-icon-wrapper.warning,
.kpi-icon-wrap.warning {
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35) !important;
}

.kpi-icon-wrapper.info,
.kpi-icon-wrap.info {
  background: linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.32) !important;
}

.kpi-card:hover {
  border-color: rgba(6, 95, 70, 0.28) !important;
  box-shadow: 0 14px 30px -4px rgba(6, 95, 70, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.04) !important;
}

/* =========================================================================
   HEADER ICON & CTA IMPERIAL EMERALD OVERRIDE
   ========================================================================= */
.header-icon-box,
.page-header-icon,
.module-header-icon,
.erp-header-icon,
.header-icon-badge {
  width: 46px !important;
  height: 46px !important;
  border-radius: 14px !important;
  background: linear-gradient(135deg, #065F46 0%, #047857 100%) !important;
  color: #ffffff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 22px !important;
  box-shadow: 0 4px 14px rgba(6, 95, 70, 0.28) !important;
  flex-shrink: 0 !important;
  position: relative !important;
  overflow: hidden !important;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

.header-icon-box::after {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  right: 0 !important;
  width: 60% !important;
  height: 50% !important;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 100%) !important;
  border-radius: 0 14px 0 80px !important;
  pointer-events: none !important;
}

.header-icon-box:hover {
  transform: scale(1.05) rotate(1deg) !important;
}

.btn-success.btn-header-action,
.btn-add-new,
.btn-header-primary {
  background: linear-gradient(135deg, #065F46 0%, #047857 100%) !important;
  border-color: transparent !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(6, 95, 70, 0.28) !important;
}

.btn-success.btn-header-action:hover,
.btn-add-new:hover,
.btn-header-primary:hover {
  background: linear-gradient(135deg, #047857 0%, #064E3B 100%) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 18px rgba(6, 95, 70, 0.38) !important;
}
`;

fs.writeFileSync(file, before + '\n\n' + tail, 'utf8');
console.log('Successfully updated inventory.component.css with clean Imperial Emerald styles!');
