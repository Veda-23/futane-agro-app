const { execSync } = require('child_process');

try {
  const output = execSync('wmic process where "name=\'java.exe\' or name=\'node.exe\' or name=\'esbuild.exe\'" get ProcessId,Name,WorkingSetSize,CommandLine /FORMAT:LIST', { encoding: 'utf-8' });
  const blocks = output.split('\r\r\n\r\r\n').map(b => b.trim()).filter(Boolean);
  
  console.log('=== RUNNING DEV PROCESSES DETAILS ===');
  blocks.forEach(b => {
    const lines = b.split('\r\r\n');
    const info = {};
    lines.forEach(l => {
      const idx = l.indexOf('=');
      if (idx !== -1) {
        info[l.substring(0, idx).trim()] = l.substring(idx + 1).trim();
      }
    });
    const ramMB = (parseInt(info.WorkingSetSize, 10) / (1024 * 1024)).toFixed(1);
    console.log(`\n[PID ${info.ProcessId}] ${info.Name} — ${ramMB} MB`);
    console.log(`CMD: ${(info.CommandLine || '').substring(0, 180)}...`);
  });
} catch (e) {
  console.error(e.message);
}
