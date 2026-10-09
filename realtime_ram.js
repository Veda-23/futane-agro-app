const { execSync } = require('child_process');
const os = require('os');

const totalMem = os.totalmem();
const freeMem = os.freemem();
const usedMem = totalMem - freeMem;

console.log('=== SYSTEM RAM ===');
console.log('Total:', (totalMem / (1024 ** 3)).toFixed(2), 'GB');
console.log('Used: ', (usedMem / (1024 ** 3)).toFixed(2), 'GB', `(${((usedMem / totalMem) * 100).toFixed(1)}%)`);
console.log('Free: ', (freeMem / (1024 ** 3)).toFixed(2), 'GB\n');

try {
  const output = execSync('tasklist /FO CSV /NH', { encoding: 'utf-8' });
  const lines = output.trim().split('\n');
  const grouped = {};

  lines.forEach(line => {
    const row = line.trim();
    if (!row) return;
    const parts = row.split('","').map(s => s.replace(/"/g, ''));
    if (parts.length >= 5) {
      const name = parts[0];
      const pid = parts[1];
      const memKB = parseInt(parts[4].replace(/[^0-9]/g, ''), 10) || 0;
      if (!grouped[name]) grouped[name] = { count: 0, totalMB: 0, pids: [] };
      grouped[name].count++;
      grouped[name].totalMB += memKB / 1024;
      grouped[name].pids.push(pid);
    }
  });

  const sorted = Object.entries(grouped).sort((a, b) => b[1].totalMB - a[1].totalMB);
  console.log('=== TOP 20 PROCESS GROUPS BY RAM ===');
  sorted.slice(0, 20).forEach(([name, data]) => {
    console.log(`${data.totalMB.toFixed(1).padStart(7)} MB (${String(data.count).padStart(2)}x) : ${name}`);
  });
} catch (e) {
  console.error(e.message);
}
