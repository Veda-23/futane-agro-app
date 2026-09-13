const path = require('path');
const sqlite3 = require(path.join(__dirname, 'node_modules', 'sqlite3')).verbose();

const dbPath = 'C:\\Program Files\\GrafanaLabs\\grafana\\data\\grafana.db';
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('OPEN_READWRITE failed:', err.message);
  } else {
    console.log('SUCCESS: Opened grafana.db with WRITE access!');
    db.close();
  }
});
