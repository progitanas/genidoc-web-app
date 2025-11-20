Quick test instructions for GeniDoc API

1. Ensure the server is running on the port you will test (default 3000). If port 3000 is busy start on another port:

PowerShell (temporary for this terminal session):

```powershell
$env:PORT=3001; node serveurs/server.js
```

2. To find the process using port 3000 (PowerShell):

```powershell
Get-NetTCPConnection -LocalPort 3000 | ForEach-Object { Get-Process -Id $_.OwningProcess }
```

3. To kill that process (replace <PID> with the process id):

```powershell
Stop-Process -Id <PID> -Force
```

4. Run the PowerShell smoke tests I added (these use Invoke-RestMethod and work even if Node < 18):

```powershell
.\tools\test_endpoints.ps1 -Port 3000
```

5. Or run the Node smoke test (requires Node 18+ for global fetch):

```powershell
node .\tools\test_endpoints.js 3000
# or with a token:
node .\tools\test_endpoints.js 3000 <your_token_here>
```

Interpretation:

- If protected endpoints return HTTP 401, the `requireAuth` protection is active.
- If endpoints return 200 and data, they accepted the request. Use a valid token in the `Authorization: Bearer <token>` header to test authenticated flows.

If you want, I can:

- Add a test that performs authenticated requests (issue a test token from the server) if you want me to wire JWT issuance.
- Attempt to run a local smoke test from here (I cannot run your server for you, but I can help interpret pasted output).
