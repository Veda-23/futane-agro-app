export const bookStyles = `
@page {
  size: A4 portrait;
  margin: 14mm 12mm 14mm 12mm;
  @bottom-right {
    content: "Page " counter(page);
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 8pt;
    color: #64748b;
    font-weight: 600;
  }
  @bottom-left {
    content: "FUTANE AGRO ERP — Master Operating Manual & Technical Specification";
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 8pt;
    color: #94a3b8;
  }
}

* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 9pt;
  line-height: 1.45;
  color: #1e293b;
  background: #ffffff;
  margin: 0;
  padding: 0;
}

/* Page Break Controls */
.page-break {
  page-break-before: always;
  break-before: page;
}

.avoid-break {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Typography */
h1.book-title {
  font-size: 26pt;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.5px;
  line-height: 1.15;
  margin-bottom: 8px;
}

h2.volume-title {
  font-size: 20pt;
  font-weight: 800;
  color: #1e3a8a;
  border-bottom: 2.5px solid #1e3a8a;
  padding-bottom: 6px;
  margin-top: 0;
  margin-bottom: 16px;
  letter-spacing: -0.3px;
}

h3.chapter-title {
  font-size: 14pt;
  font-weight: 700;
  color: #0f172a;
  margin-top: 18px;
  margin-bottom: 10px;
  border-left: 4px solid #2563eb;
  padding-left: 10px;
}

h4.section-title {
  font-size: 11pt;
  font-weight: 700;
  color: #334155;
  margin-top: 14px;
  margin-bottom: 6px;
}

p {
  margin-top: 0;
  margin-bottom: 8px;
  text-align: justify;
}

/* Tables */
table.spec-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  margin-bottom: 12px;
  font-size: 8pt;
  line-height: 1.35;
}

table.spec-table th {
  background: #0f172a;
  color: #ffffff;
  font-weight: 700;
  text-align: left;
  padding: 6px 8px;
  border: 1px solid #0f172a;
}

table.spec-table td {
  padding: 5px 8px;
  border: 1px solid #cbd5e1;
  vertical-align: top;
}

table.spec-table tr:nth-child(even) {
  background: #f8fafc;
}

/* Code & Schemas */
pre.code-block {
  background: #0f172a;
  color: #f8fafc;
  font-family: "Consolas", "Courier New", monospace;
  font-size: 7.5pt;
  line-height: 1.35;
  padding: 10px 12px;
  border-radius: 4px;
  overflow-x: hidden;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin-top: 6px;
  margin-bottom: 10px;
  border: 1px solid #334155;
}

/* Callouts & Alert Banners */
.callout {
  padding: 10px 14px;
  border-radius: 4px;
  margin-top: 8px;
  margin-bottom: 12px;
  font-size: 8.5pt;
  line-height: 1.4;
}

.callout-warning {
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
  color: #92400e;
}

.callout-guardrail {
  background: #fef2f2;
  border-left: 4px solid #ef4444;
  color: #991b1b;
}

.callout-info {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  color: #1e40af;
}

.callout-success {
  background: #f0fdf4;
  border-left: 4px solid #10b981;
  color: #065f46;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 7pt;
  font-weight: 700;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.badge-post { background: #dbeafe; color: #1e40af; }
.badge-get { background: #dcfce7; color: #15803d; }
.badge-put { background: #fef3c7; color: #b45309; }
.badge-delete { background: #fee2e2; color: #b91c1c; }
.badge-role { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

/* Screenshots */
.screenshot-container {
  margin-top: 10px;
  margin-bottom: 12px;
  text-align: center;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px;
  background: #f8fafc;
}

.screenshot-img {
  width: 100%;
  max-height: 380px;
  object-fit: contain;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.screenshot-caption {
  font-size: 8pt;
  color: #64748b;
  font-style: italic;
  margin-top: 4px;
}

/* Grids & Cards */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
  margin-bottom: 12px;
}

.card {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px 12px;
  background: #ffffff;
}

.card-title {
  font-size: 9.5pt;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}
`;
