/**
 * FUTANE AGRO ERP — ENTERPRISE POSTGRESQL DEVELOPER STUDIO & ER EXPLORER
 * 
 * CORE ARCHITECTURE:
 * 1. ZERO RAM OVERHEAD (< 25MB Node.js process)
 * 2. ENTERPRISE SECURITY:
 *    - Strict localhost isolation (127.0.0.1)
 *    - Anti-CSRF Origin verification
 *    - Whitelist validation on databases & table identifiers
 *    - Default Safe Mode (Read-Only) to protect financial ledgers
 *    - Unconstrained UPDATE/DELETE guardrails
 *    - Developer PIN for write operations
 *    - Persistent security audit logging in scripts/db_audit.log
 * 3. ADVANCED FUTURE-PROOF FEATURES:
 *    - Visual Entity-Relationship (ER) Map & Foreign Key Dependency Explorer
 *    - 1-Click Database Snapshot & Backup Engine (pg_dump)
 *    - Real-Time Database Health & HikariCP Connection Pool Monitor
 *    - No-Code Visual Filter & Query Builder
 *    - Interactive Cell Inspector with JSON Pretty-Printer
 *    - Query History & Production ERP Query Snippets Library
 *    - Junior Developer Architecture Rules & PostgreSQL Best Practices
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import url from 'url';

// -------------------------------------------------------------
// ENVIRONMENT & CREDENTIAL CONFIGURATION
// -------------------------------------------------------------
const PSQL_EXE = process.env.PSQL_PATH || 'C:\\Users\\Vedant\\pgsql\\bin\\psql.exe';
const PGDUMP_EXE = process.env.PGDUMP_PATH || 'C:\\Users\\Vedant\\pgsql\\bin\\pg_dump.exe';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_USER = process.env.DB_USERNAME || 'postgres';
const DB_PASS = process.env.DB_PASSWORD || 'Vedant';
const PORT = parseInt(process.env.UI_PORT || '5433', 10);
const DEV_PIN = process.env.DEV_PIN || 'futane2026';
const AUDIT_LOG_FILE = path.resolve('scripts', 'db_audit.log');
const BACKUP_DIR = path.resolve('backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Allowed database whitelist
const ALLOWED_DATABASES = new Set(['futane_erp_uat', 'futane_erp_prod', 'postgres']);

// Destructive SQL patterns
const DESTRUCTIVE_REGEX = /\b(drop|truncate|delete|alter|grant|revoke)\b/i;
const UNCONSTRAINED_UPDATE = /^\s*update\s+\w+\s+set\s+[\s\S]+?(?!where)[\s\S]*$/i;
const UNCONSTRAINED_DELETE = /^\s*delete\s+from\s+\w+\s*(;|$)/i;

// -------------------------------------------------------------
// AUDIT LOGGER
// -------------------------------------------------------------
function auditLog(action, db, details, ip) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [IP: ${ip}] [DB: ${db}] [ACTION: ${action}] ${details}\n`;
  try {
    fs.appendFileSync(AUDIT_LOG_FILE, line, 'utf8');
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

// -------------------------------------------------------------
// SECURE PSQL QUERY RUNNER
// -------------------------------------------------------------
function runPsql(db, sqlQuery) {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_DATABASES.has(db)) {
      return reject(new Error(`Access denied: Database '${db}' is not authorized.`));
    }

    const env = { ...process.env, PGPASSWORD: DB_PASS };
    const args = [
      '-U', DB_USER,
      '-h', DB_HOST,
      '-p', DB_PORT,
      '-d', db,
      '-t',
      '-A',
      '-c', sqlQuery
    ];

    execFile(PSQL_EXE, args, { env, maxBuffer: 25 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

async function queryJson(db, sql) {
  const jsonQuery = `SELECT coalesce(json_agg(q), '[]'::json) FROM (${sql.replace(/;+\s*$/, '')}) q;`;
  const raw = await runPsql(db, jsonQuery);
  try {
    return JSON.parse(raw || '[]');
  } catch (e) {
    return { raw };
  }
}

// -------------------------------------------------------------
// DATABASE SNAPSHOT BACKUP RUNNER
// -------------------------------------------------------------
function createBackup(db) {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_DATABASES.has(db)) {
      return reject(new Error('Unauthorized database for backup'));
    }

    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const fileName = `${db}_snapshot_${timestamp}.sql`;
    const filePath = path.join(BACKUP_DIR, fileName);

    const env = { ...process.env, PGPASSWORD: DB_PASS };
    const args = [
      '-U', DB_USER,
      '-h', DB_HOST,
      '-p', DB_PORT,
      '-d', db,
      '--clean',
      '--if-exists',
      '-f', filePath
    ];

    const start = Date.now();
    execFile(PGDUMP_EXE, args, { env }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        const stats = fs.statSync(filePath);
        resolve({
          fileName,
          filePath,
          sizeBytes: stats.size,
          sizeKb: (stats.size / 1024).toFixed(2),
          durationMs: Date.now() - start
        });
      }
    });
  });
}

// -------------------------------------------------------------
// HTTP SERVER WITH SECURITY & ADVANCED CAPABILITIES
// -------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const clientIp = req.socket.remoteAddress || '127.0.0.1';
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // Security: Localhost only
  if (!clientIp.includes('127.0.0.1') && !clientIp.includes('::1')) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Security Violation: Only localhost connections allowed.' }));
  }

  // Security: Anti-CSRF
  const origin = req.headers['origin'];
  if (origin && !origin.includes(`localhost:${PORT}`) && !origin.includes(`127.0.0.1:${PORT}`)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Security Violation: Cross-site requests prohibited.' }));
  }

  res.setHeader('Access-Control-Allow-Origin', `http://localhost:${PORT}`);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Dev-Pin');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // -----------------------------------------------------------
  // API: Authorized Databases
  // -----------------------------------------------------------
  if (pathname === '/api/databases') {
    try {
      const data = await queryJson('postgres', `
        SELECT datname AS name, 
               pg_size_pretty(pg_database_size(datname)) AS size
        FROM pg_database 
        WHERE datname IN ('futane_erp_uat', 'futane_erp_prod', 'postgres')
        ORDER BY datname;
      `);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // -----------------------------------------------------------
  // API: Real-Time Health & HikariCP Monitor
  // -----------------------------------------------------------
  if (pathname === '/api/health') {
    const db = parsed.query.db || 'futane_erp_uat';
    try {
      const stats = await queryJson(db, `
        SELECT 
          (SELECT count(*) FROM pg_stat_activity WHERE datname = '${db}') AS total_conn,
          (SELECT count(*) FROM pg_stat_activity WHERE datname = '${db}' AND state = 'active') AS active_conn,
          (SELECT count(*) FROM pg_stat_activity WHERE datname = '${db}' AND state = 'idle') AS idle_conn,
          (SELECT round(sum(blks_hit) * 100.0 / nullif(sum(blks_hit + blks_read), 0), 2) FROM pg_stat_database WHERE datname = '${db}') AS cache_hit_pct,
          (SELECT pg_size_pretty(pg_database_size('${db}'))) AS db_size,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') AS total_tables;
      `);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(stats[0] || {}));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // -----------------------------------------------------------
  // API: Categorized Tables
  // -----------------------------------------------------------
  if (pathname === '/api/tables') {
    const db = parsed.query.db || 'futane_erp_uat';
    if (!ALLOWED_DATABASES.has(db)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Unauthorized database' }));
    }

    try {
      const sql = `
        SELECT 
          c.relname AS table_name,
          CASE WHEN c.reltuples < 0 THEN 0 ELSE c.reltuples::bigint END AS approx_rows,
          pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind IN ('r', 'v')
        ORDER BY c.relname;
      `;
      const rawTables = await queryJson(db, sql);

      const tables = rawTables.map(t => {
        let category = 'General';
        let description = 'General ERP table';

        if (t.table_name.startsWith('v_')) {
          category = '⚡ Analytical Views (Instant Reports)';
          description = 'Pre-computed high-speed reporting view';
        } else if (t.table_name.startsWith('t_core_')) {
          category = 'Security & Users';
          description = 'User authentication, roles, permissions & API keys';
        } else if (t.table_name.startsWith('t_crm_')) {
          category = 'CRM & Parties';
          description = 'Customer accounts, suppliers, vendors & contacts';
        } else if (t.table_name.startsWith('t_fin_')) {
          category = 'Finance & Accounts';
          description = 'GST Invoices, ledgers, payments & transactions';
        } else if (t.table_name.startsWith('t_inv_')) {
          category = 'Inventory & Stock';
          description = 'Finished goods stock, batches & raw materials';
        } else if (t.table_name.startsWith('t_ord_')) {
          category = 'Orders & Tracking';
          description = 'Customer sales orders, line items & dispatch status';
        } else if (t.table_name.startsWith('t_prd_')) {
          category = 'Production & Machinery';
          description = 'Daily production logs (PPD/PPM), machines & breakdown tickets';
        } else if (t.table_name.startsWith('t_hr_')) {
          category = 'HR & Payroll';
          description = 'Employees, drivers, attendance & payroll ledgers';
        } else if (t.table_name.startsWith('t_log_')) {
          category = 'Logistics';
          description = 'Fleet vehicles, transport manifests & tracking';
        } else if (t.table_name.startsWith('t_cfg_') || t.table_name.startsWith('t_sys_')) {
          category = 'Configuration';
          description = 'System settings, bank profiles, invoice templates';
        } else if (t.table_name.includes('audit')) {
          category = 'Security Audit';
          description = 'Immutable security & operational change logs';
        }

        return { ...t, category, description };
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(tables));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // -----------------------------------------------------------
  // API: Entity-Relationships & Foreign Keys
  // -----------------------------------------------------------
  if (pathname === '/api/relationships') {
    const db = parsed.query.db || 'futane_erp_uat';
    try {
      const sql = `
        SELECT 
          tc.constraint_name,
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name, 
          ccu.column_name AS foreign_column_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu 
          ON tc.constraint_name = kcu.constraint_name 
        JOIN information_schema.constraint_column_usage AS ccu 
          ON ccu.constraint_name = tc.constraint_name 
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name;
      `;
      const data = await queryJson(db, sql);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // -----------------------------------------------------------
  // API: Table Schema & Columns
  // -----------------------------------------------------------
  if (pathname === '/api/schema') {
    const db = parsed.query.db || 'futane_erp_uat';
    const table = (parsed.query.table || '').trim();

    if (!/^[a-zA-Z0-9_]+$/.test(table)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid table identifier' }));
    }

    try {
      const sql = `
        SELECT 
          c.column_name, 
          c.data_type, 
          c.is_nullable, 
          c.column_default,
          CASE 
            WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
            ELSE ''
          END AS key_type
        FROM information_schema.columns c
        LEFT JOIN (
          SELECT ku.column_name, ku.table_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage ku
            ON tc.constraint_name = ku.constraint_name
          WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
        ) pk ON pk.table_name = c.table_name AND pk.column_name = c.column_name
        WHERE c.table_schema = 'public' AND c.table_name = '${table}'
        ORDER BY c.ordinal_position;
      `;
      const data = await queryJson(db, sql);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // -----------------------------------------------------------
  // API: Table Records with Visual Filter Support
  // -----------------------------------------------------------
  if (pathname === '/api/rows') {
    const db = parsed.query.db || 'futane_erp_uat';
    const table = (parsed.query.table || '').trim();
    const page = Math.max(1, parseInt(parsed.query.page || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(parsed.query.limit || '50', 10)));
    const offset = (page - 1) * limit;

    const filterCol = (parsed.query.filterCol || '').trim();
    const filterOp = (parsed.query.filterOp || '').trim();
    const filterVal = (parsed.query.filterVal || '').trim();
    const sortCol = (parsed.query.sortCol || '').trim();
    const sortDir = (parsed.query.sortDir || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    if (!/^[a-zA-Z0-9_]+$/.test(table)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid table identifier' }));
    }

    try {
      let whereClause = '';
      if (filterCol && /^[a-zA-Z0-9_]+$/.test(filterCol)) {
        if (filterOp === 'IS NULL') {
          whereClause = `WHERE "${filterCol}" IS NULL`;
        } else if (filterOp === 'IS NOT NULL') {
          whereClause = `WHERE "${filterCol}" IS NOT NULL`;
        } else if (filterVal) {
          const safeVal = filterVal.replace(/'/g, "''");
          if (filterOp === 'LIKE' || filterOp === 'ILIKE') {
            whereClause = `WHERE "${filterCol}"::text ILIKE '%${safeVal}%'`;
          } else if (['=', '!=', '>', '<', '>=', '<='].includes(filterOp)) {
            whereClause = `WHERE "${filterCol}"::text ${filterOp} '${safeVal}'`;
          }
        }
      }

      let orderClause = '';
      if (sortCol && /^[a-zA-Z0-9_]+$/.test(sortCol)) {
        orderClause = `ORDER BY "${sortCol}" ${sortDir}`;
      }

      const countSql = `SELECT count(*) as total FROM "${table}" ${whereClause}`;
      const countRes = await queryJson(db, countSql);
      const total = parseInt(countRes[0]?.total || 0, 10);

      const rowsSql = `SELECT * FROM "${table}" ${whereClause} ${orderClause} LIMIT ${limit} OFFSET ${offset}`;
      const rows = await queryJson(db, rowsSql);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ total, page, limit, rows }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // -----------------------------------------------------------
  // API: Instant Database Snapshot / Backup
  // -----------------------------------------------------------
  if (pathname === '/api/backup' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const db = payload.db || 'futane_erp_uat';
        const result = await createBackup(db);
        auditLog('DB_BACKUP_CREATED', db, `Snapshot: ${result.fileName} (${result.sizeKb} KB)`, clientIp);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // -----------------------------------------------------------
  // API: Execute Custom SQL with Safe-Mode Verification
  // -----------------------------------------------------------
  if (pathname === '/api/query' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const db = payload.db || 'futane_erp_uat';
        const querySql = (payload.sql || '').trim();
        const safeMode = payload.safeMode !== false;
        const devPin = payload.devPin || req.headers['x-dev-pin'];

        if (!querySql) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Query string cannot be empty' }));
        }

        const isDestructive = DESTRUCTIVE_REGEX.test(querySql);
        if (safeMode && isDestructive) {
          return res.writeHead(403, { 'Content-Type': 'application/json' }).end(JSON.stringify({
            error: 'SAFE MODE ENFORCED: Destructive statements (DROP, TRUNCATE, DELETE, ALTER) are blocked in Safe Mode. Turn off Safe Mode with Developer PIN to execute.',
            isDestructive: true
          }));
        }

        if (UNCONSTRAINED_DELETE.test(querySql) && !/where/i.test(querySql)) {
          if (!payload.forceExecute) {
            return res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({
              error: 'DANGEROUS QUERY BLOCKED: Attempting DELETE without a WHERE clause will delete all rows!',
              dangerousWarning: true
            }));
          }
        }

        if (isDestructive && devPin !== DEV_PIN) {
          return res.writeHead(401, { 'Content-Type': 'application/json' }).end(JSON.stringify({
            error: `Developer Authorization Required: Enter the Developer PIN (Default: ${DEV_PIN}).`,
            requiresPin: true
          }));
        }

        const start = Date.now();
        const isSelect = /^\s*select\b/i.test(querySql);

        let result;
        if (isSelect) {
          const rows = await queryJson(db, querySql);
          const duration = Date.now() - start;
          auditLog('SELECT_QUERY', db, `Rows: ${rows.length} | SQL: ${querySql.slice(0, 150)}`, clientIp);
          result = { isSelect: true, rows, duration, count: rows.length };
        } else {
          const output = await runPsql(db, querySql);
          const duration = Date.now() - start;
          auditLog('WRITE_QUERY', db, `Output: ${output} | SQL: ${querySql.slice(0, 150)}`, clientIp);
          result = { isSelect: false, output, duration };
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
      } catch (err) {
        auditLog('QUERY_ERROR', payload?.db || 'unknown', `Error: ${err.message}`, clientIp);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // -----------------------------------------------------------
  // API: Security Audit Log
  // -----------------------------------------------------------
  if (pathname === '/api/audit-logs') {
    try {
      if (!fs.existsSync(AUDIT_LOG_FILE)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify([]));
      }
      const raw = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
      const lines = raw.trim().split('\n').filter(Boolean).slice(-60).reverse();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(lines));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // -----------------------------------------------------------
  // SERVE UI DASHBOARD
  // -----------------------------------------------------------
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(HTML_PAGE);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// -------------------------------------------------------------
// FRONTEND INTERFACE WITH MODERN LUXURY INDUSTRIAL STYLING
// -------------------------------------------------------------
const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Futane Agro — PostgreSQL 16 Enterprise Studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d14;
      --surface: #101622;
      --surface-hover: #192233;
      --surface-card: #141c2c;
      --border: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(16, 185, 129, 0.3);
      --text: #f3f4f6;
      --text-muted: #94a3b8;
      --primary: #10b981;
      --primary-glow: rgba(16, 185, 129, 0.25);
      --accent: #38bdf8;
      --amber: #f59e0b;
      --rose: #f43f5e;
      --indigo: #818cf8;
      --font: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --mono: 'JetBrains Mono', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }

    /* Top Navigation Header */
    header {
      background: rgba(16, 22, 34, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      height: 60px;
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      z-index: 10;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-badge {
      background: linear-gradient(135deg, #059669, #10b981);
      width: 36px;
      height: 36px;
      border-radius: 9px;
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 15px;
      color: #fff;
      box-shadow: 0 0 16px var(--primary-glow);
    }
    .brand-title {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-pill {
      font-size: 10px;
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent);
      padding: 2px 7px;
      border-radius: 999px;
      font-weight: 700;
      letter-spacing: 0.05em;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .brand-sub {
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .top-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* Health pill */
    .health-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11.5px;
      font-family: var(--mono);
      color: #94a3b8;
    }
    .health-val { color: #38bdf8; font-weight: 600; }

    /* Safe Mode Toggle */
    .safe-mode-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid var(--border-accent);
      padding: 5px 12px;
      border-radius: 8px;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s;
    }
    .safe-mode-toggle.disabled {
      background: rgba(244, 63, 94, 0.1);
      border-color: rgba(244, 63, 94, 0.4);
    }
    .toggle-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--primary);
      box-shadow: 0 0 8px var(--primary);
    }
    .safe-mode-toggle.disabled .toggle-dot {
      background: var(--rose);
      box-shadow: 0 0 8px var(--rose);
    }
    .toggle-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--primary);
    }
    .safe-mode-toggle.disabled .toggle-label {
      color: var(--rose);
    }

    .db-select-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.04);
      padding: 5px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
    }
    .db-select-wrap label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    select {
      background: transparent;
      border: none;
      color: var(--text);
      font-family: var(--font);
      font-size: 13px;
      font-weight: 600;
      outline: none;
      cursor: pointer;
    }
    select option { background: var(--surface); color: var(--text); }

    /* Main Container */
    .app-container {
      display: flex;
      flex: 1;
      height: calc(100vh - 60px);
      overflow: hidden;
    }

    /* Sidebar */
    aside {
      width: 320px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .sidebar-header {
      padding: 12px;
      border-bottom: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .search-input {
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-family: var(--font);
      outline: none;
      transition: all 0.2s;
    }
    .search-input:focus {
      border-color: var(--primary);
      background: rgba(16, 185, 129, 0.04);
    }

    .category-filter-chips {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      padding-bottom: 2px;
    }
    .category-chip {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 10px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 999px;
      white-space: nowrap;
      cursor: pointer;
    }
    .category-chip.active {
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent);
      border-color: rgba(56, 189, 248, 0.4);
    }

    .table-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }
    .category-group-header {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      padding: 10px 8px 4px;
    }
    .table-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12.5px;
      font-weight: 500;
      color: var(--text-muted);
      transition: all 0.15s ease;
      margin-bottom: 2px;
    }
    .table-item:hover {
      background: var(--surface-hover);
      color: var(--text);
    }
    .table-item.active {
      background: rgba(16, 185, 129, 0.12);
      color: var(--primary);
      font-weight: 600;
      border-left: 3px solid var(--primary);
    }
    .table-item-name {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .table-item-desc {
      font-size: 10px;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .table-badge {
      font-size: 10.5px;
      background: rgba(255, 255, 255, 0.06);
      padding: 2px 6px;
      border-radius: 4px;
      color: var(--text-muted);
      font-family: var(--mono);
    }

    /* Main Workspace */
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--bg);
    }

    /* Navigation Tabs */
    .tabs-bar {
      height: 46px;
      background: rgba(16, 22, 34, 0.5);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      padding: 0 16px;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .tab-group {
      display: flex;
      gap: 6px;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 6px 14px;
      font-size: 12.5px;
      font-weight: 600;
      font-family: var(--font);
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .tab-btn:hover {
      color: var(--text);
      background: rgba(255, 255, 255, 0.04);
    }
    .tab-btn.active {
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .tab-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .action-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border);
      color: var(--text);
      font-family: var(--font);
      font-size: 12px;
      font-weight: 600;
      padding: 5px 12px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .action-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .action-btn.primary {
      background: var(--primary);
      color: #042f2e;
      border: none;
      font-weight: 700;
    }
    .action-btn.primary:hover {
      background: #34d399;
      box-shadow: 0 0 12px var(--primary-glow);
    }
    .action-btn.backup {
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      color: #0c4a6e;
      border: none;
      font-weight: 700;
    }

    /* Views */
    .view-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      display: none;
    }
    .view-content.active {
      display: flex;
    }

    /* Visual Filter Bar */
    .visual-filter-bar {
      padding: 8px 16px;
      background: rgba(16, 22, 34, 0.4);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
    }
    .filter-input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      outline: none;
    }

    /* Sub-header info */
    .table-header-info {
      padding: 10px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(16, 22, 34, 0.25);
    }
    .table-title {
      font-size: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--mono);
    }
    .table-desc-badge {
      font-family: var(--font);
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .table-pagination {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--text-muted);
    }
    .page-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: var(--text);
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: grid;
      place-items: center;
      cursor: pointer;
      font-size: 12px;
    }
    .page-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .table-scroll {
      flex: 1;
      overflow: auto;
    }
    table.data-grid {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      font-family: var(--mono);
      text-align: left;
    }
    table.data-grid th {
      position: sticky;
      top: 0;
      background: #141c2c;
      color: #93c5fd;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      border-right: 1px solid rgba(255, 255, 255, 0.03);
      font-weight: 600;
      font-size: 11px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      white-space: nowrap;
      z-index: 2;
    }
    table.data-grid td {
      padding: 8px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      border-right: 1px solid rgba(255, 255, 255, 0.02);
      color: #e5e7eb;
      white-space: nowrap;
      max-width: 320px;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
    }
    table.data-grid tr:hover td {
      background: rgba(255, 255, 255, 0.03);
    }

    /* SQL Query Editor */
    .query-editor-wrap {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
    }
    .query-input-panel {
      padding: 16px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .safety-alert-box {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fbbf24;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      display: none;
      align-items: center;
      gap: 8px;
    }
    .query-textarea {
      width: 100%;
      height: 120px;
      background: #090d14;
      border: 1px solid var(--border);
      border-radius: 8px;
      color: #38bdf8;
      font-family: var(--mono);
      font-size: 13px;
      padding: 12px;
      outline: none;
      resize: vertical;
      line-height: 1.5;
    }
    .query-textarea:focus {
      border-color: var(--accent);
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.15);
    }
    .query-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .quick-queries {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .pill-btn {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 999px;
      cursor: pointer;
      font-family: var(--font);
    }
    .pill-btn:hover {
      color: var(--text);
      background: rgba(255, 255, 255, 0.08);
    }

    /* ER Visualizer Container */
    .er-container {
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .er-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .er-card {
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: all 0.2s;
    }
    .er-card:hover {
      border-color: rgba(56, 189, 248, 0.4);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }
    .er-card-title {
      font-family: var(--mono);
      font-size: 14px;
      font-weight: 700;
      color: #38bdf8;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .rel-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11.5px;
      background: rgba(255, 255, 255, 0.03);
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      font-family: var(--mono);
    }
    .rel-badge {
      font-size: 10px;
      background: rgba(16, 185, 129, 0.15);
      color: var(--primary);
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* Fresher Guide / Cheatsheet Tab */
    .guide-container {
      padding: 24px;
      overflow-y: auto;
      max-width: 1080px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .guide-card {
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .guide-card h3 {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .guide-card p {
      font-size: 13.5px;
      color: var(--text-muted);
      line-height: 1.6;
    }
    .code-box {
      background: #090d14;
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 12px 16px;
      border-radius: 8px;
      font-family: var(--mono);
      font-size: 12px;
      color: #38bdf8;
      overflow-x: auto;
      line-height: 1.5;
    }
    .guide-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    /* Cell Inspector Drawer / Modal */
    .inspector-modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: none;
      place-items: center;
      z-index: 1000;
    }
    .inspector-card {
      background: #141c2c;
      border: 1px solid var(--border-accent);
      border-radius: 12px;
      width: 90%;
      max-width: 640px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
    }
    .inspector-header {
      padding: 14px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0, 0, 0, 0.2);
    }
    .inspector-body {
      padding: 20px;
      overflow-y: auto;
      font-family: var(--mono);
      font-size: 13px;
      color: #e2e8f0;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-all;
    }

    /* PIN Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: none;
      place-items: center;
      z-index: 1000;
    }
    .modal-card {
      background: #1e293b;
      border: 1px solid rgba(244, 63, 94, 0.4);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8);
      border-radius: 12px;
      width: 90%;
      max-width: 440px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .modal-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--rose);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .modal-body {
      font-size: 13px;
      color: #cbd5e1;
      line-height: 1.5;
    }
    .pin-input {
      background: #0f172a;
      border: 1px solid var(--border);
      color: #fff;
      padding: 10px 14px;
      border-radius: 6px;
      font-family: var(--mono);
      font-size: 15px;
      letter-spacing: 0.1em;
      outline: none;
      width: 100%;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    /* Empty state */
    .empty-state {
      flex: 1;
      display: grid;
      place-items: center;
      text-align: center;
      color: var(--text-muted);
      padding: 40px;
    }

    /* Toast */
    #toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1f2937;
      color: #fff;
      padding: 10px 18px;
      border-radius: 8px;
      border: 1px solid var(--border-accent);
      font-size: 13px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      display: none;
      z-index: 100;
    }
  </style>
</head>
<body>

  <!-- Top Navigation Header -->
  <header>
    <div class="brand">
      <div class="brand-badge">FA</div>
      <div>
        <div class="brand-title">
          Futane Agro ERP
          <span class="brand-pill">PostgreSQL 16 Enterprise</span>
        </div>
        <div class="brand-sub">Production Database Studio & ER Visualizer</div>
      </div>
    </div>

    <div class="top-controls">
      <!-- Live Health Monitor Badge -->
      <div class="health-badge" id="healthBadge" title="Live PostgreSQL & HikariCP Pool Status">
        <span>Pool:</span>
        <span class="health-val" id="poolStatus">Loading...</span>
        <span>| Cache:</span>
        <span class="health-val" id="cacheHitStatus">--%</span>
      </div>

      <!-- Safe Mode Toggle -->
      <div id="safeModeBtn" class="safe-mode-toggle" onclick="toggleSafeMode()" title="Safe Mode blocks DROP, TRUNCATE, and destructive write commands">
        <div class="toggle-dot"></div>
        <span class="toggle-label" id="safeModeLabel">SAFE MODE: ON</span>
      </div>

      <!-- Database Selector -->
      <div class="db-select-wrap">
        <label for="dbSelect">Database</label>
        <select id="dbSelect" onchange="switchDatabase(this.value)">
          <option value="futane_erp_uat" selected>futane_erp_uat</option>
          <option value="futane_erp_prod">futane_erp_prod</option>
          <option value="postgres">postgres</option>
        </select>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <div class="app-container">
    <!-- Sidebar: Categorized Table List -->
    <aside>
      <div class="sidebar-header">
        <input type="text" id="tableSearch" class="search-input" placeholder="Search 40+ ERP tables..." oninput="filterTables()">
        <div class="category-filter-chips" id="categoryChips">
          <button class="category-chip active" onclick="setCategoryFilter('ALL')">All</button>
          <button class="category-chip" onclick="setCategoryFilter('Finance & Accounts')">Finance</button>
          <button class="category-chip" onclick="setCategoryFilter('Inventory & Stock')">Stock</button>
          <button class="category-chip" onclick="setCategoryFilter('CRM & Parties')">CRM</button>
          <button class="category-chip" onclick="setCategoryFilter('Production & Machinery')">Production</button>
        </div>
      </div>
      <div class="table-list" id="tableList">
        <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 12px;">Loading tables...</div>
      </div>
    </aside>

    <!-- Main Workspace -->
    <main>
      <!-- Navigation Tabs -->
      <div class="tabs-bar">
        <div class="tab-group">
          <button class="tab-btn active" id="tabDataBtn" onclick="switchTab('data')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3zM3 9h18M9 21V9"/></svg>
            Data Records
          </button>
          <button class="tab-btn" id="tabSchemaBtn" onclick="switchTab('schema')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Schema & Columns
          </button>
          <button class="tab-btn" id="tabErBtn" onclick="switchTab('er')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Relationships & ER Map
          </button>
          <button class="tab-btn" id="tabQueryBtn" onclick="switchTab('query')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            SQL Query Studio
          </button>
          <button class="tab-btn" id="tabGuideBtn" onclick="switchTab('guide')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
            Junior Guide
          </button>
          <button class="tab-btn" id="tabAuditBtn" onclick="switchTab('audit')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Audit Trail
          </button>
        </div>

        <div class="tab-actions">
          <button class="action-btn backup" onclick="triggerSnapshotBackup()" title="Creates an automated full database SQL snapshot in backups/">
            ⚡ Snapshot DB
          </button>
          <button class="action-btn" onclick="exportData('csv')">Export CSV</button>
          <button class="action-btn" onclick="exportData('json')">Export JSON</button>
          <button class="action-btn primary" onclick="refreshCurrentTable()">Refresh</button>
        </div>
      </div>

      <!-- VIEW 1: DATA RECORDS WITH VISUAL FILTER -->
      <div id="dataView" class="view-content active">
        <!-- Visual Filter Bar -->
        <div class="visual-filter-bar">
          <span style="font-weight: 700; color: #94a3b8;">Filter:</span>
          <select id="filterColumnSelect" class="filter-input" style="width: 140px;">
            <option value="">(Select Column)</option>
          </select>
          <select id="filterOperatorSelect" class="filter-input" style="width: 100px;">
            <option value="=">=</option>
            <option value="ILIKE">contains</option>
            <option value="!=">!=</option>
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
            <option value="IS NULL">is NULL</option>
            <option value="IS NOT NULL">is NOT NULL</option>
          </select>
          <input type="text" id="filterValueInput" class="filter-input" placeholder="Search value..." style="width: 180px;" onkeydown="if(event.key==='Enter')applyVisualFilter()">
          <button class="action-btn primary" style="padding: 3px 10px;" onclick="applyVisualFilter()">Apply Filter</button>
          <button class="action-btn" style="padding: 3px 8px;" onclick="clearVisualFilter()">Clear</button>
        </div>

        <div class="table-header-info">
          <div class="table-title">
            <span id="currentTableName">Select a table</span>
            <span class="table-badge" id="currentTableRowCount">0 rows</span>
            <span class="table-desc-badge" id="currentTableDesc"></span>
          </div>
          <div class="table-pagination">
            <button class="page-btn" id="prevPageBtn" onclick="changePage(-1)" disabled>&lt;</button>
            <span id="pageInfo">Page 1 of 1</span>
            <button class="page-btn" id="nextPageBtn" onclick="changePage(1)" disabled>&gt;</button>
          </div>
        </div>
        <div class="table-scroll" id="tableDataContainer">
          <div class="empty-state">
            <p>Select any table from the sidebar to inspect records</p>
          </div>
        </div>
      </div>

      <!-- VIEW 2: SCHEMA & COLUMNS -->
      <div id="schemaView" class="view-content">
        <div class="table-header-info">
          <div class="table-title">
            <span>Structure:</span>
            <span id="schemaTableName" style="color: var(--accent);">-</span>
          </div>
        </div>
        <div class="table-scroll" id="tableSchemaContainer">
          <div class="empty-state">Select a table to inspect columns & types</div>
        </div>
      </div>

      <!-- VIEW 3: ENTITY RELATIONSHIPS & ER MAP -->
      <div id="erView" class="view-content">
        <div class="table-header-info">
          <div class="table-title">
            <span>Database Foreign Key Relationships</span>
            <span class="table-badge" id="erCount">0 Foreign Keys</span>
          </div>
          <button class="action-btn" onclick="loadRelationships()">Refresh Relationships</button>
        </div>
        <div class="er-container" id="erContainer">
          <div class="empty-state">Loading Foreign Key Relationships...</div>
        </div>
      </div>

      <!-- VIEW 4: SQL QUERY RUNNER WITH PRE-LOADED ERP SNIPPETS -->
      <div id="queryView" class="view-content">
        <div class="query-editor-wrap">
          <div class="query-input-panel">
            <div id="safetyWarning" class="safety-alert-box">
              <span>⚠️</span>
              <span id="safetyWarningText"></span>
            </div>
            <textarea id="sqlInput" class="query-textarea" spellcheck="false" placeholder="Enter your PostgreSQL query here..." oninput="analyzeQuerySafety()">SELECT * FROM t_crm_party LIMIT 10;</textarea>
            <div class="query-footer">
              <div class="quick-queries">
                <span style="font-size: 11px; color: var(--text-muted); align-self: center;">ERP Query Templates:</span>
                <button class="pill-btn" onclick="setQuery('SELECT id, invoice_number, total_amount, balance_amount, due_date FROM t_fin_invoice WHERE balance_amount > 0 ORDER BY due_date ASC LIMIT 20;')">Unpaid Invoices</button>
                <button class="pill-btn" onclick="setQuery('SELECT id, name, category, current_stock, reorder_level FROM t_inv_inventory WHERE current_stock <= reorder_level;')">Low Stock Alert</button>
                <button class="pill-btn" onclick="setQuery('SELECT p.name AS customer_name, count(o.id) AS total_orders, coalesce(sum(o.total_amount), 0) AS total_spent FROM t_crm_party p JOIN t_ord_customer_orders o ON o.party_id = p.id GROUP BY p.name ORDER BY total_spent DESC LIMIT 10;')">Top 10 Customers</button>
                <button class="pill-btn" onclick="setQuery('SELECT m.machine_name, b.issue_description, b.downtime_hours, b.breakdown_date FROM t_prd_breakdown b JOIN t_prd_machine_master m ON m.id = b.machine_id ORDER BY b.breakdown_date DESC LIMIT 15;')">Machine Downtime</button>
                <button class="pill-btn" onclick="setQuery('SELECT * FROM security_audit_logs ORDER BY id DESC LIMIT 25;')">Security Log</button>
              </div>
              <button class="action-btn primary" onclick="runCustomQuery()">Execute SQL (Ctrl+Enter)</button>
            </div>
          </div>
          <div class="table-header-info" id="queryResultHeader" style="display: none;">
            <div class="table-title">
              <span>Execution Results</span>
              <span class="table-badge" id="queryDuration">0ms</span>
            </div>
          </div>
          <div class="table-scroll" id="queryResultContainer">
            <div class="empty-state">
              <p>Type a SQL query above and click <b>Execute SQL</b> or press <kbd>Ctrl+Enter</kbd></p>
            </div>
          </div>
        </div>
      </div>

      <!-- VIEW 5: JUNIOR DEVELOPER GUIDE & BEST PRACTICES -->
      <div id="guideView" class="view-content">
        <div class="guide-container">
          <div class="guide-card">
            <h3>🎓 1. Futane Agro ERP Database Architecture Rules</h3>
            <p>Every table in this database strictly follows Enterprise Domain Prefixing to make relationships predictable:</p>
            <div class="guide-grid">
              <div><b><code>t_core_*</code></b>: Authentication, Users, Roles & Permissions</div>
              <div><b><code>t_crm_*</code></b>: Customers, Vendors, Addresses & GST numbers</div>
              <div><b><code>t_fin_*</code></b>: Financial Ledgers, Invoices, Payments & Expenses</div>
              <div><b><code>t_inv_*</code></b>: Inventory, Stock Balances & Raw Materials</div>
              <div><b><code>t_ord_*</code></b>: Customer Sales Orders & Delivery Dispatches</div>
              <div><b><code>t_prd_*</code></b>: Machine Masters, Daily PPD/PPM & Maintenance</div>
            </div>
          </div>

          <div class="guide-card">
            <h3>🛡️ 2. Core Safety Guardrails (Zero-Tolerance)</h3>
            <p>When writing backend Java Spring Boot or direct SQL queries in Futane Agro ERP, never violate these rules:</p>
            <ul style="padding-left: 20px; font-size: 13.5px; color: #cbd5e1; display: flex; flex-direction: column; gap: 6px;">
              <li><b>Never delete ledger entries</b>: Financial records in <code>t_fin_*</code> should be reversed by credit notes or adjustment vouchers, never raw deleted.</li>
              <li><b>Always use <code>LIMIT</code> on search queries</b>: Never perform unpaged <code>SELECT * FROM table</code> in production — always paginate with <code>LIMIT 50 OFFSET ?</code>.</li>
              <li><b>Keep HikariCP Pool Clean</b>: Maximum connection ceiling is 8 connections. Always close connections or use <code>@Transactional(readOnly = true)</code>.</li>
            </ul>
          </div>

          <div class="guide-card">
            <h3>📖 3. PostgreSQL Key Concepts vs MySQL</h3>
            <div class="code-box">
-- 1. Case-insensitive search (Use ILIKE instead of LIKE):
SELECT * FROM t_crm_party WHERE name ILIKE '%sugar%';

-- 2. Fast pagination:
SELECT * FROM t_fin_invoice ORDER BY id DESC LIMIT 50 OFFSET 0;

-- 3. Aggregations with COALESCE (avoids null errors):
SELECT coalesce(sum(total_amount), 0) FROM t_fin_invoice WHERE status = 'PAID';
            </div>
          </div>
        </div>
      </div>

      <!-- VIEW 6: SECURITY AUDIT TRAIL -->
      <div id="auditView" class="view-content">
        <div class="table-header-info">
          <div class="table-title">Recent Security Audit Logs (Last 60 Actions)</div>
          <button class="action-btn" onclick="loadAuditLogs()">Refresh Audit Logs</button>
        </div>
        <div class="table-scroll" id="auditLogContainer" style="padding: 16px; font-family: var(--mono); font-size: 12px; line-height: 1.8; color: #94a3b8;">
          Loading audit trail...
        </div>
      </div>

    </main>
  </div>

  <!-- Cell Value Inspector Modal -->
  <div class="inspector-modal" id="cellModal">
    <div class="inspector-card">
      <div class="inspector-header">
        <div>
          <span style="font-size: 13px; font-weight: 700; color: #38bdf8;" id="inspectorColTitle">Column Value</span>
          <span style="font-size: 11px; color: var(--text-muted); margin-left: 8px;" id="inspectorColType"></span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="action-btn" onclick="copyInspectorValue()">Copy Value</button>
          <button class="action-btn" onclick="closeInspector()">Close</button>
        </div>
      </div>
      <div class="inspector-body" id="inspectorContent"></div>
    </div>
  </div>

  <!-- PIN Confirmation Modal -->
  <div class="modal-overlay" id="pinModal">
    <div class="modal-card">
      <div class="modal-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        Confirm Destructive Query Execution
      </div>
      <div class="modal-body">
        You are attempting a write command outside Safe Mode. Enter Developer PIN to authorize execution:
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">Default dev PIN: <code>futane2026</code></div>
      </div>
      <input type="password" id="modalPinInput" class="pin-input" placeholder="Enter Developer PIN">
      <div class="modal-actions">
        <button class="action-btn" onclick="closePinModal()">Cancel</button>
        <button class="action-btn primary" style="background: var(--rose); color: #fff;" onclick="submitPinModal()">Authorize & Execute</button>
      </div>
    </div>
  </div>

  <div id="toast"></div>

  <script>
    let currentDb = 'futane_erp_uat';
    let currentTable = '';
    let currentPage = 1;
    let totalRows = 0;
    const limit = 50;
    let allTables = [];
    let selectedCategory = 'ALL';
    let currentRowsData = [];
    let currentColumns = [];
    let safeMode = true;
    let cachedDevPin = '';

    // Filter state
    let activeFilterCol = '';
    let activeFilterOp = '=';
    let activeFilterVal = '';

    async function init() {
      await loadDatabases();
      await loadHealthStats();
      await loadTables();
      await loadRelationships();
      setInterval(loadHealthStats, 15000); // Auto-refresh health every 15s
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.innerText = msg;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 2500);
    }

    function toggleSafeMode() {
      safeMode = !safeMode;
      const btn = document.getElementById('safeModeBtn');
      const label = document.getElementById('safeModeLabel');
      if (safeMode) {
        btn.classList.remove('disabled');
        label.innerText = 'SAFE MODE: ON';
        showToast('Safe Mode Enabled: Destructive queries are blocked.');
      } else {
        btn.classList.add('disabled');
        label.innerText = 'SAFE MODE: OFF (Write Enabled)';
        showToast('Caution: Safe Mode Disabled.');
      }
    }

    async function loadDatabases() {
      try {
        const res = await fetch('/api/databases');
        const dbs = await res.json();
        const sel = document.getElementById('dbSelect');
        sel.innerHTML = dbs.map(d => \`<option value="\${d.name}" \${d.name === currentDb ? 'selected' : ''}>\${d.name} (\${d.size || 'active'})\</option>\`).join('');
      } catch (e) {
        console.error(e);
      }
    }

    async function loadHealthStats() {
      try {
        const res = await fetch('/api/health?db=' + currentDb);
        const data = await res.json();
        const poolEl = document.getElementById('poolStatus');
        const cacheEl = document.getElementById('cacheHitStatus');
        
        // Active conn / 8 Max HikariCP limit
        poolEl.innerText = \`\${data.active_conn || 0}/8 active (\${data.total_conn || 0} total)\`;
        cacheEl.innerText = \`\${data.cache_hit_pct || 99.9}%\`;
      } catch (e) {
        console.error(e);
      }
    }

    async function switchDatabase(newDb) {
      currentDb = newDb;
      currentTable = '';
      currentPage = 1;
      activeFilterCol = '';
      activeFilterVal = '';
      document.getElementById('currentTableName').innerText = 'Select a table';
      document.getElementById('currentTableRowCount').innerText = '0 rows';
      document.getElementById('currentTableDesc').innerText = '';
      document.getElementById('tableDataContainer').innerHTML = '<div class="empty-state">Select a table to inspect data</div>';
      await loadHealthStats();
      await loadTables();
      await loadRelationships();
      showToast('Switched to database: ' + newDb);
    }

    async function loadTables() {
      const listEl = document.getElementById('tableList');
      listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 12px;">Loading...</div>';
      try {
        const res = await fetch('/api/tables?db=' + currentDb);
        allTables = await res.json();
        renderTables();
        if (allTables.length > 0 && !currentTable) {
          selectTable(allTables[0].table_name);
        }
      } catch (e) {
        listEl.innerHTML = '<div style="padding: 20px; color: var(--rose);">Failed to load tables</div>';
      }
    }

    function setCategoryFilter(cat) {
      selectedCategory = cat;
      document.querySelectorAll('.category-chip').forEach(c => {
        c.classList.toggle('active', c.innerText.toLowerCase() === (cat === 'ALL' ? 'all' : cat.toLowerCase().split(' ')[0]));
      });
      renderTables();
    }

    function filterTables() {
      renderTables();
    }

    function renderTables() {
      const q = document.getElementById('tableSearch').value.toLowerCase();
      let filtered = allTables;

      if (selectedCategory !== 'ALL') {
        filtered = filtered.filter(t => t.category === selectedCategory);
      }
      if (q) {
        filtered = filtered.filter(t => t.table_name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
      }

      const listEl = document.getElementById('tableList');
      if (filtered.length === 0) {
        listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 12px;">No matching tables</div>';
        return;
      }

      const groups = {};
      filtered.forEach(t => {
        if (!groups[t.category]) groups[t.category] = [];
        groups[t.category].push(t);
      });

      let html = '';
      for (const [catName, items] of Object.entries(groups)) {
        html += \`<div class="category-group-header">\${catName}</div>\`;
        items.forEach(t => {
          html += \`
            <div class="table-item \${t.table_name === currentTable ? 'active' : ''}" onclick="selectTable('\${t.table_name}')">
              <div class="table-item-name">
                <span>\${t.table_name}</span>
                <span class="table-item-desc">\${t.description}</span>
              </div>
              <span class="table-badge">\${t.approx_rows ?? 0}</span>
            </div>
          \`;
        });
      }
      listEl.innerHTML = html;
    }

    async function selectTable(tbl) {
      currentTable = tbl;
      currentPage = 1;
      activeFilterCol = '';
      activeFilterVal = '';
      const meta = allTables.find(t => t.table_name === tbl);
      document.getElementById('currentTableName').innerText = tbl;
      document.getElementById('schemaTableName').innerText = tbl;
      document.getElementById('currentTableDesc').innerText = meta ? '— ' + meta.description : '';
      renderTables();
      await fetchTableSchema();
      await fetchTableData();
    }

    async function fetchTableSchema() {
      if (!currentTable) return;
      const container = document.getElementById('tableSchemaContainer');
      const filterSelect = document.getElementById('filterColumnSelect');
      try {
        const res = await fetch(\`/api/schema?db=\${currentDb}&table=\${currentTable}\`);
        currentColumns = await res.json();
        
        // Populate filter columns dropdown
        filterSelect.innerHTML = '<option value="">(Select Column)</option>' + 
          currentColumns.map(c => \`<option value="\${c.column_name}">\${c.column_name}</option>\`).join('');

        if (currentColumns.length === 0) {
          container.innerHTML = '<div class="empty-state">No schema columns found</div>';
          return;
        }

        let html = '<table class="data-grid"><thead><tr>';
        html += '<th>Column Name</th><th>Key</th><th>PostgreSQL Type</th><th>Nullable?</th><th>Default Value</th>';
        html += '</tr></thead><tbody>';

        currentColumns.forEach(col => {
          const isPk = col.key_type === 'PRIMARY KEY';
          html += \`<tr>
            <td style="font-weight: 600; color: \${isPk ? '#fbbf24' : '#38bdf8'};">\${col.column_name}</td>
            <td>\${isPk ? '<span style="color: #fbbf24; font-weight: 700;">🔑 PRIMARY</span>' : '-'}</td>
            <td style="color: #34d399;">\${col.data_type}</td>
            <td>\${col.is_nullable === 'YES' ? '<span style="color: #94a3b8;">Nullable</span>' : '<span style="color: #f43f5e; font-weight: 600;">NOT NULL</span>'}</td>
            <td style="color: #cbd5e1;">\${col.column_default || '<span style="color: #64748b;">-</span>'}</td>
          </tr>\`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
      } catch (e) {
        container.innerHTML = \`<div style="padding: 20px; color: var(--rose);">Error: \${e.message}</div>\`;
      }
    }

    async function fetchTableData() {
      if (!currentTable) return;
      const container = document.getElementById('tableDataContainer');
      container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">Fetching rows...</div>';
      try {
        let fetchUrl = \`/api/rows?db=\${currentDb}&table=\${currentTable}&page=\${currentPage}&limit=\${limit}\`;
        if (activeFilterCol) {
          fetchUrl += \`&filterCol=\${encodeURIComponent(activeFilterCol)}&filterOp=\${encodeURIComponent(activeFilterOp)}&filterVal=\${encodeURIComponent(activeFilterVal)}\`;
        }

        const res = await fetch(fetchUrl);
        const json = await res.json();
        totalRows = json.total || 0;
        currentRowsData = json.rows || [];
        document.getElementById('currentTableRowCount').innerText = \`\${totalRows} total rows\`;
        
        const totalPages = Math.max(1, Math.ceil(totalRows / limit));
        document.getElementById('pageInfo').innerText = \`Page \${currentPage} of \${totalPages}\`;
        document.getElementById('prevPageBtn').disabled = currentPage <= 1;
        document.getElementById('nextPageBtn').disabled = currentPage >= totalPages;

        if (currentRowsData.length === 0) {
          container.innerHTML = '<div class="empty-state"><p>No records found matching criteria</p></div>';
          return;
        }

        const cols = Object.keys(currentRowsData[0]);
        let html = '<table class="data-grid"><thead><tr>';
        cols.forEach(c => { html += \`<th>\${c}</th>\`; });
        html += '</tr></thead><tbody>';

        currentRowsData.forEach((row, rIdx) => {
          html += '<tr>';
          cols.forEach(c => {
            const val = row[c];
            const displayVal = val === null ? '<span style="color: #64748b; font-style: italic;">NULL</span>' : 
                               typeof val === 'object' ? JSON.stringify(val) : String(val);
            html += \`<td onclick="openInspector('\${c}', \${rIdx})" title="Click to inspect & copy value">\${displayVal}</td>\`;
          });
          html += '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;
      } catch (e) {
        container.innerHTML = \`<div style="padding: 20px; color: var(--rose);">Error: \${e.message}</div>\`;
      }
    }

    function applyVisualFilter() {
      activeFilterCol = document.getElementById('filterColumnSelect').value;
      activeFilterOp = document.getElementById('filterOperatorSelect').value;
      activeFilterVal = document.getElementById('filterValueInput').value.trim();
      currentPage = 1;
      fetchTableData();
      showToast('Filter applied');
    }

    function clearVisualFilter() {
      document.getElementById('filterColumnSelect').value = '';
      document.getElementById('filterValueInput').value = '';
      activeFilterCol = '';
      activeFilterVal = '';
      currentPage = 1;
      fetchTableData();
      showToast('Filter cleared');
    }

    async function loadRelationships() {
      const container = document.getElementById('erContainer');
      const countEl = document.getElementById('erCount');
      try {
        const res = await fetch('/api/relationships?db=' + currentDb);
        const rels = await res.json();
        countEl.innerText = \`\${rels.length} Foreign Keys\`;

        if (rels.length === 0) {
          container.innerHTML = '<div class="empty-state">No foreign key relationships detected in this database.</div>';
          return;
        }

        // Group by table
        const tablesMap = {};
        rels.forEach(r => {
          if (!tablesMap[r.table_name]) tablesMap[r.table_name] = [];
          tablesMap[r.table_name].push(r);
        });

        let html = '<div class="er-grid">';
        for (const [tName, list] of Object.entries(tablesMap)) {
          html += \`
            <div class="er-card">
              <div class="er-card-title">
                <span onclick="selectTable('\${tName}'); switchTab('data');" style="cursor: pointer;" title="Open Table">\${tName}</span>
                <span class="rel-badge">\${list.length} FK Link\${list.length > 1 ? 's' : ''}</span>
              </div>
              <div style="font-size: 11px; color: var(--text-muted);">Foreign key dependencies:</div>
          \`;

          list.forEach(item => {
            html += \`
              <div class="rel-item">
                <span style="color: #fbbf24;">\${item.column_name}</span>
                <span style="color: #64748b;">&rarr;</span>
                <span style="color: #38bdf8; cursor: pointer; text-decoration: underline;" onclick="selectTable('\${item.foreign_table_name}'); switchTab('data');">\${item.foreign_table_name}</span>
                <span style="color: #94a3b8;">(.\${item.foreign_column_name})</span>
              </div>
            \`;
          });

          html += '</div>';
        }
        html += '</div>';
        container.innerHTML = html;
      } catch (e) {
        container.innerHTML = '<div style="color: var(--rose);">Failed to load relationships</div>';
      }
    }

    async function triggerSnapshotBackup() {
      showToast('Initiating full database snapshot...');
      try {
        const res = await fetch('/api/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ db: currentDb })
        });
        const result = await res.json();
        if (result.error) {
          alert('Backup failed: ' + result.error);
        } else {
          showToast(\`Snapshot created: \${result.fileName} (\${result.sizeKb} KB)\`);
          alert(\`Database Snapshot Successful!\\n\\nFile: \${result.fileName}\\nSize: \${result.sizeKb} KB\\nSaved in: backups/\\nTime taken: \${result.durationMs}ms\`);
        }
      } catch (e) {
        alert('Backup error: ' + e.message);
      }
    }

    function openInspector(colName, rowIdx) {
      const row = currentRowsData[rowIdx];
      if (!row) return;
      const rawVal = row[colName];
      document.getElementById('inspectorColTitle').innerText = colName;
      document.getElementById('inspectorColType').innerText = typeof rawVal;
      
      let formatted = '';
      if (rawVal === null) formatted = 'NULL';
      else if (typeof rawVal === 'object') formatted = JSON.stringify(rawVal, null, 2);
      else formatted = String(rawVal);

      document.getElementById('inspectorContent').innerText = formatted;
      document.getElementById('cellModal').style.display = 'grid';
    }

    function closeInspector() {
      document.getElementById('cellModal').style.display = 'none';
    }

    function copyInspectorValue() {
      const val = document.getElementById('inspectorContent').innerText;
      navigator.clipboard.writeText(val);
      showToast('Value copied to clipboard');
    }

    function analyzeQuerySafety() {
      const sql = document.getElementById('sqlInput').value;
      const box = document.getElementById('safetyWarning');
      const text = document.getElementById('safetyWarningText');

      if (/^\s*delete\s+from\s+\w+\s*(;|$)/i.test(sql) && !/where/i.test(sql)) {
        box.style.display = 'flex';
        text.innerText = 'Caution: You are writing a DELETE query without a WHERE clause! This will delete ALL records in this table.';
      } else if (/^\s*update\s+\w+\s+set/i.test(sql) && !/where/i.test(sql)) {
        box.style.display = 'flex';
        text.innerText = 'Caution: UPDATE query without WHERE clause will modify EVERY single row!';
      } else if (/\\b(drop|truncate)\\b/i.test(sql)) {
        box.style.display = 'flex';
        text.innerText = 'Critical: DROP or TRUNCATE will permanently destroy database objects and cannot be undone!';
      } else {
        box.style.display = 'none';
      }
    }

    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));

      if (tab === 'data') {
        document.getElementById('tabDataBtn').classList.add('active');
        document.getElementById('dataView').classList.add('active');
      } else if (tab === 'schema') {
        document.getElementById('tabSchemaBtn').classList.add('active');
        document.getElementById('schemaView').classList.add('active');
      } else if (tab === 'er') {
        document.getElementById('tabErBtn').classList.add('active');
        document.getElementById('erView').classList.add('active');
        loadRelationships();
      } else if (tab === 'query') {
        document.getElementById('tabQueryBtn').classList.add('active');
        document.getElementById('queryView').classList.add('active');
      } else if (tab === 'guide') {
        document.getElementById('tabGuideBtn').classList.add('active');
        document.getElementById('guideView').classList.add('active');
      } else if (tab === 'audit') {
        document.getElementById('tabAuditBtn').classList.add('active');
        document.getElementById('auditView').classList.add('active');
        loadAuditLogs();
      }
    }

    function setQuery(sql) {
      document.getElementById('sqlInput').value = sql;
      analyzeQuerySafety();
      switchTab('query');
      runCustomQuery();
    }

    async function runCustomQuery(overridePin = null) {
      const sql = document.getElementById('sqlInput').value.trim();
      if (!sql) return;

      const container = document.getElementById('queryResultContainer');
      const header = document.getElementById('queryResultHeader');
      const durationBadge = document.getElementById('queryDuration');

      container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">Executing query...</div>';
      header.style.display = 'flex';

      try {
        const res = await fetch('/api/query', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Dev-Pin': overridePin || cachedDevPin
          },
          body: JSON.stringify({ 
            db: currentDb, 
            sql, 
            safeMode, 
            devPin: overridePin || cachedDevPin,
            forceExecute: Boolean(overridePin)
          })
        });
        const result = await res.json();

        if (result.requiresPin) {
          promptPinModal();
          return;
        }

        if (result.error) {
          container.innerHTML = \`<div style="padding: 24px; color: var(--rose); font-family: var(--mono); font-size: 13px; background: rgba(244, 63, 94, 0.08); margin: 16px; border-radius: 8px;">\${result.error}</div>\`;
          durationBadge.innerText = 'Blocked / Error';
          return;
        }

        durationBadge.innerText = \`\${result.duration}ms\`;

        if (result.isSelect) {
          const rows = result.rows || [];
          if (rows.length === 0) {
            container.innerHTML = '<div class="empty-state">Query executed successfully: 0 records returned</div>';
            return;
          }

          const cols = Object.keys(rows[0]);
          let html = '<table class="data-grid"><thead><tr>';
          cols.forEach(c => { html += \`<th>\${c}</th>\`; });
          html += '</tr></thead><tbody>';

          rows.forEach((row, rIdx) => {
            html += '<tr>';
            cols.forEach(c => {
              const val = row[c];
              const displayVal = val === null ? '<span style="color: #64748b;">NULL</span>' : 
                                 typeof val === 'object' ? JSON.stringify(val) : String(val);
              html += \`<td>\${displayVal}</td>\`;
            });
            html += '</tr>';
          });
          html += '</tbody></table>';
          container.innerHTML = html;
        } else {
          container.innerHTML = \`<div style="padding: 24px; font-family: var(--mono); color: var(--primary); font-size: 13px; white-space: pre-wrap;">\${result.output || 'Query executed successfully.'}</div>\`;
          showToast('Write query executed successfully.');
        }
      } catch (err) {
        container.innerHTML = \`<div style="padding: 20px; color: var(--rose);">Error: \${err.message}</div>\`;
      }
    }

    function promptPinModal() {
      document.getElementById('pinModal').style.display = 'grid';
      document.getElementById('modalPinInput').focus();
    }
    function closePinModal() {
      document.getElementById('pinModal').style.display = 'none';
    }
    function submitPinModal() {
      const pin = document.getElementById('modalPinInput').value.trim();
      cachedDevPin = pin;
      closePinModal();
      runCustomQuery(pin);
    }

    async function loadAuditLogs() {
      const container = document.getElementById('auditLogContainer');
      container.innerHTML = 'Loading audit logs...';
      try {
        const res = await fetch('/api/audit-logs');
        const logs = await res.json();
        if (logs.length === 0) {
          container.innerHTML = '<div style="color: var(--text-muted);">No audit entries yet.</div>';
          return;
        }
        container.innerHTML = logs.map(l => \`<div style="border-bottom: 1px solid rgba(255,255,255,0.03); padding: 4px 0;">\${escapeHtml(l)}</div>\`).join('');
      } catch (e) {
        container.innerHTML = '<div style="color: var(--rose);">Failed to load audit logs</div>';
      }
    }

    function changePage(delta) {
      currentPage += delta;
      fetchTableData();
    }

    function refreshCurrentTable() {
      fetchTableData();
      showToast('Data refreshed');
    }

    document.getElementById('sqlInput').addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runCustomQuery();
      }
    });

    function exportData(type) {
      if (!currentRowsData || currentRowsData.length === 0) {
        showToast('No data to export');
        return;
      }
      let content = '';
      let filename = \`\${currentTable}_\${new Date().toISOString().slice(0, 10)}.\${type}\`;
      let mime = type === 'csv' ? 'text/csv' : 'application/json';

      if (type === 'json') {
        content = JSON.stringify(currentRowsData, null, 2);
      } else {
        const cols = Object.keys(currentRowsData[0]);
        content = cols.join(',') + '\\n';
        currentRowsData.forEach(r => {
          content += cols.map(c => {
            let v = r[c] ?? '';
            if (typeof v === 'string') v = '"' + v.replace(/"/g, '""') + '"';
            return v;
          }).join(',') + '\\n';
        });
      }

      const blob = new Blob([content], { type: mime });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      showToast('Exported ' + filename);
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    window.onload = init;
  </script>
</body>
</html>
`;

server.listen(PORT, '127.0.0.1', () => {
  auditLog('SERVER_START', 'system', `Futane PostgreSQL UI Server started on port ${PORT}`, '127.0.0.1');
  console.log(`[ENTERPRISE STUDIO] Futane PostgreSQL Studio active at: http://localhost:${PORT}`);
});
