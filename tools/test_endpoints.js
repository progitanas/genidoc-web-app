// Node smoke test for GeniDoc API endpoints
// Usage: node tools/test_endpoints.js [port] [token]
// Example: node tools/test_endpoints.js 3000

const port = process.argv[2] ? Number(process.argv[2]) : 3000;
const token = process.argv[3] || null;
const base = `http://localhost:${port}/api`;

async function run() {
  console.log(`Testing endpoints on ${base}`);

  await tryEndpoint('GET', `${base}/patient/GD-000001`);
  await tryEndpoint('GET', `${base}/patient/123/history`);
  await tryEndpoint('POST', `${base}/diagnostics`, {
    appointmentId: 't1',
    patient: 'GD-000001',
    text: 'Test diagnostic',
  });
  await tryEndpoint('POST', `${base}/prescriptions`, {
    appointmentId: 't1',
    patient: 'GD-000001',
    text: 'Test prescription',
  });
  await tryEndpoint('PUT', `${base}/appointments/demo-1`, {
    status: 'terminé',
  });

  console.log(
    '\nSmoke tests complete. If endpoints returned 401, auth protection is active.'
  );
}

async function tryEndpoint(method, url, body = null) {
  try {
    const opts = { method, headers: {} };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    // Use global fetch (Node 18+). If not available, advise user to use Node 18+ or run the PowerShell script.
    if (typeof fetch !== 'function') {
      console.error(
        'Global fetch is not available in this Node version. Use Node 18+ or run the PowerShell script tools/test_endpoints.ps1'
      );
      process.exit(1);
    }
    const res = await fetch(url, opts);
    const contentType = res.headers.get('content-type') || '';
    let text;
    try {
      if (contentType.includes('application/json'))
        text = JSON.stringify(await res.json(), null, 2);
      else text = await res.text();
    } catch (e) {
      text = '(no body)';
    }
    console.log(`\n[${res.status}] ${method} ${url}`);
    console.log(text);
  } catch (err) {
    console.error(`\n[ERR] ${method} ${url} ->`, err.message || err);
  }
}

run();
