const http = require('http');

const ports = [80, 4200, 8080, 8081, 3000, 5000, 8000, 8888, 9000];

ports.forEach(port => {
  const req = http.get(`http://localhost:${port}/`, (res) => {
    console.log(`Port ${port}: HTTP ${res.statusCode}`);
  });
  req.on('error', (err) => {
    // silently ignore unreachable
  });
  req.setTimeout(1500, () => {
    req.destroy();
  });
});
