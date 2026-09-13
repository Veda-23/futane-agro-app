const path = require('path');
const sqlite3 = require(path.join(__dirname, 'node_modules', 'sqlite3')).verbose();

const dbPath = 'C:\\Program Files\\GrafanaLabs\\grafana\\data\\grafana.db';
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Failed to open grafana.db:', err.message);
    process.exit(1);
  }
  
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  // Check if testdata_ds already exists
  db.get('SELECT * FROM data_source WHERE uid = ?', ['testdata_ds'], (err, row) => {
    if (err) {
      console.error('Query error:', err.message);
      db.close();
      return;
    }

    if (row) {
      console.log('Datasource testdata_ds already exists:', row);
      db.close();
      return;
    }

    // Insert testdata_ds
    const stmt = db.prepare(`
      INSERT INTO data_source (
        org_id, version, type, name, access, url, password, user, database,
        basic_auth, basic_auth_user, basic_auth_password, is_default, json_data,
        created, updated, with_credentials, secure_json_data, read_only, uid,
        is_prunable, api_version
      ) VALUES (
        1, 1, 'testdata', 'TestData', 'proxy', '', '', '', '',
        0, '', '', 0, '{}',
        ?, ?, 0, '{}', 0, 'testdata_ds',
        0, ''
      )
    `);

    stmt.run([now, now], function(err) {
      if (err) {
        console.error('Insert failed:', err.message);
      } else {
        console.log(`SUCCESS: Inserted testdata_ds with ID ${this.lastID}`);
      }
      stmt.finalize();
      db.close();
    });
  });
});
