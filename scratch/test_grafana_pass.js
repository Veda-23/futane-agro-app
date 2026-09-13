const passwords = [
  'admin',
  'admin123',
  'superadmin123',
  'superadmin',
  'futane',
  'futane123',
  'futaneagro',
  'futaneagro123',
  'root',
  'password',
  '123456',
  'Vedant',
  'vedant',
  'vedant123',
  'Vedant123',
  'Grafana123',
  'grafana',
  'grafana123'
];

async function check() {
  for (const p of passwords) {
    const auth = Buffer.from(`admin:${p}`).toString('base64');
    try {
      const res = await fetch('http://localhost:3000/api/user', {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      if (res.status === 200) {
        const json = await res.json();
        console.log(`🎉 SUCCESS! Password is: "${p}"`);
        console.log('User profile:', json);
        return p;
      } else {
        // console.log(`Failed: "${p}" (${res.status})`);
      }
    } catch (e) {
      console.error('Error connecting to Grafana:', e.message);
      return;
    }
  }
  console.log('None of the common passwords matched.');
}

check();
