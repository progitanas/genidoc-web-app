const DEFAULT_BASE = 'http://10.0.2.2:3000'; // change when using real device to your machine LAN IP

async function post(path, body = {}) {
  const res = await fetch((process.env.BACKEND_URL || DEFAULT_BASE) + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function login(email, password) {
  return post('/api/login', { email, password });
}

export async function fetchAppointments(token) {
  const res = await fetch(
    (process.env.BACKEND_URL || DEFAULT_BASE) + '/api/appointments',
    {
      headers: { Authorization: 'Bearer ' + (token || '') },
    }
  );
  return res.json();
}
