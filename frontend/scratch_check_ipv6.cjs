const http = require('http');

http.get('http://[::1]:4200/', (res) => {
  console.log(`[::1]:4200 responded with status: ${res.statusCode}`);
}).on('error', (err) => {
  console.log('Error connecting to [::1]:4200:', err.message);
});
