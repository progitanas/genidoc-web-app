# Quick smoke test for GeniDoc API endpoints (PowerShell)
# Usage: Set-Location to repo root and run: .\tools\test_endpoints.ps1 -Port 3000
param(
    [int]$Port = 3000
)
$base = "http://localhost:$Port/api"
Write-Host "Testing endpoints on $base"

function TryEndpoint($method, $url, $body=$null) {
    try {
        if ($body) {
            $resp = Invoke-RestMethod -Method $method -Uri $url -Body ($body | ConvertTo-Json -Depth 5) -ContentType 'application/json' -ErrorAction Stop
        } else {
            $resp = Invoke-RestMethod -Method $method -Uri $url -ErrorAction Stop
        }
        Write-Host "[OK] $method $url" -ForegroundColor Green
        return $resp
    } catch {
        $err = $_.Exception.Response
        if ($err -ne $null) {
            $status = $err.StatusCode.value__
            Write-Host "[HTTP $status] $method $url" -ForegroundColor Yellow
            try { $text = (New-Object System.IO.StreamReader($err.GetResponseStream())).ReadToEnd(); Write-Host $text } catch {}
        } else {
            Write-Host "[ERR] $method $url -> $_" -ForegroundColor Red
        }
        return $null
    }
}

# 1) Protected GET patient (should require auth -> 401)
TryEndpoint -method GET -url "$base/patient/GD-000001"
# 2) Protected patient history
TryEndpoint -method GET -url "$base/patient/123/history"
# 3) Protected diagnostics POST
TryEndpoint -method POST -url "$base/diagnostics" -body @{ appointmentId='t1'; patient='GD-000001'; text='Test' }
# 4) Protected prescriptions POST
TryEndpoint -method POST -url "$base/prescriptions" -body @{ appointmentId='t1'; patient='GD-000001'; text='Test prescription' }
# 5) Update appointment (should be protected)
TryEndpoint -method PUT -url "$base/appointments/demo-1" -body @{ status='terminé' }

Write-Host "Smoke tests complete. If endpoints returned 401, auth protection is active." -ForegroundColor Cyan
