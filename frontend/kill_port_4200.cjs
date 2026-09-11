const { execSync } = require('child_process');

try {
  const output = execSync('netstat -ano', { encoding: 'utf8' });
  const lines = output.split('\n').filter(l => l.includes('4200'));
  console.log('Port 4200 lines:', lines);

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && parseInt(pid) > 0 && parseInt(pid) !== process.pid) {
      console.log('Freeing port 4200 by killing PID:', pid);
      try {
        execSync(`taskkill /F /PID ${pid}`);
        console.log('Successfully killed PID:', pid);
      } catch (e) {
        console.log('Failed to kill PID:', pid, e.message);
      }
    }
  }
} catch (err) {
  console.error('Error during port check:', err.message);
}
