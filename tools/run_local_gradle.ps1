<#
Run a local Android gradle build for the Expo-managed mobile app.
Usage (PowerShell):
  From repo root:
    .\tools\run_local_gradle.ps1
  To skip prebuild (if already prebuilt):
    .\tools\run_local_gradle.ps1 -SkipPrebuild

This script will:
- cd into `mobile`
- run `npx expo prebuild -p android` (unless -SkipPrebuild passed)
- cd into `mobile/android` and run `gradlew assembleDebug` (Windows)
- capture the console output to `mobile/gradle_build_output.txt`

You can paste the contents of that file here for me to analyze.
#>
param(
  [switch]$SkipPrebuild
)

$ErrorActionPreference = 'Stop'

$mobileDir = Join-Path -Path $PSScriptRoot -ChildPath '..\mobile'
$mobileDir = (Resolve-Path $mobileDir).ProviderPath

Write-Host "Mobile directory: $mobileDir"
Push-Location $mobileDir
try {
    if (-not $SkipPrebuild) {
        Write-Host "Running: npx expo prebuild -p android"
        npx expo prebuild -p android
    } else {
        Write-Host "Skipping prebuild as requested."
    }

    $androidDir = Join-Path -Path $mobileDir -ChildPath 'android'
    if (-not (Test-Path $androidDir)) {
        Write-Host "Android directory not found after prebuild: $androidDir" -ForegroundColor Red
        exit 1
    }

    Push-Location $androidDir
    $outputFile = Join-Path -Path $mobileDir -ChildPath 'gradle_build_output.txt'
    Write-Host "Running gradlew assembleDebug and writing output to $outputFile"
    $gradleCmd = Join-Path -Path (Get-Location) -ChildPath 'gradlew.bat'
    if (-not (Test-Path $gradleCmd)) {
        Write-Host "gradlew.bat not found in $androidDir" -ForegroundColor Red
        exit 1
    }

    # Run gradle and capture output (both stdout and stderr)
    & $gradleCmd assembleDebug --stacktrace --info 2>&1 | Tee-Object -FilePath $outputFile
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        Write-Host "Gradle finished with exit code $exitCode" -ForegroundColor Yellow
    } else {
        Write-Host "Gradle build finished successfully." -ForegroundColor Green
    }
    Pop-Location
} catch {
    Write-Host "Error during local gradle run: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}

Write-Host "Done. Inspect mobile\gradle_build_output.txt for the full gradle log." -ForegroundColor Cyan
