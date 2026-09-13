const path = require('path');
const sqlite3 = require(path.join(__dirname, 'node_modules', 'sqlite3')).verbose();

const dbPath = 'C:\\Program Files\\GrafanaLabs\\grafana\\data\\grafana.db';
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) throw err;
  db.all('PRAGMA table_info(data_source)', [], (err, rows) => {
    if (err) throw err;
    console.table(rows);
    db.all('SELECT * FROM data_source WHERE id = 1', [], (err, sample) => {
      console.log('Sample row (Prometheus):', sample);
      db.close();
    });
  });
});
