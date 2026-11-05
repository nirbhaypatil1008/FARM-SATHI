$ErrorActionPreference = 'Stop'

$serviceDirectory = $PSScriptRoot
$venvDirectory = Join-Path $serviceDirectory '.venv'
$venvPython = Join-Path $venvDirectory 'Scripts\python.exe'
$activateScript = Join-Path $venvDirectory 'Scripts\Activate.ps1'
$requirementsFile = Join-Path $serviceDirectory 'requirements.txt'
$environmentFile = Join-Path $serviceDirectory '.env'
$environmentExample = Join-Path $serviceDirectory '.env.example'

if (-not (Test-Path $venvPython)) {
    $pythonLauncher = Get-Command py -ErrorAction SilentlyContinue
    if (-not $pythonLauncher) {
        throw 'Install Python 3.13 and the Windows Python launcher, then run this script again.'
    }

    & $pythonLauncher.Source -3.13 -m venv $venvDirectory
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not create ai-service\.venv with Python 3.13.'
    }
}

. $activateScript

$pythonVersion = python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"
if ($pythonVersion -ne '3.13') {
    throw "ai-service\.venv uses Python $pythonVersion. Remove only ai-service\.venv and rerun this script to create it with Python 3.13."
}

if (-not (Test-Path $environmentFile)) {
    Copy-Item $environmentExample $environmentFile
}

$configuredPort = Get-Content $environmentFile |
    Where-Object { $_ -match '^\s*PORT\s*=' } |
    Select-Object -Last 1
$port = 8000
if ($configuredPort -and $configuredPort -match '^\s*PORT\s*=\s*(\d+)\s*$') {
    $port = [int]$Matches[1]
}
if ($port -lt 1 -or $port -gt 65535) {
    throw 'PORT in ai-service\.env must be between 1 and 65535.'
}

$existingListener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1
if ($existingListener) {
    $healthUri = "http://127.0.0.1:$port/health"
    try {
        $health = Invoke-RestMethod -Uri $healthUri -TimeoutSec 3
    } catch {
        throw "Port $port is already occupied but does not respond to the Farm Saathi AI health check. No second AI service was started."
    }
    if ($health.service -ne 'farm-saathi-ai') {
        throw "Port $port is occupied by a different service. No second AI service was started."
    }

    Write-Host "Farm Saathi AI service is already running at $healthUri; reusing it without starting a duplicate."
    while ($true) {
        Start-Sleep -Seconds 30
    }
}

$missingModules = python -c "import importlib.util; modules = {'fastapi': 'fastapi', 'uvicorn': 'uvicorn', 'python-multipart': 'multipart', 'tensorflow': 'tensorflow', 'Pillow': 'PIL', 'numpy': 'numpy', 'pydantic': 'pydantic', 'python-dotenv': 'dotenv'}; print(' '.join(name for name, module in modules.items() if importlib.util.find_spec(module) is None))"
if ($LASTEXITCODE -ne 0) {
    throw 'Could not inspect ai-service dependencies.'
}
if ($missingModules) {
    Write-Host "Installing missing ai-service dependencies: $missingModules"
    python -m pip install --disable-pip-version-check -r $requirementsFile
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not install ai-service requirements. Check Python 3.13, network access, and the pip error above.'
    }
}

Write-Host "Starting Farm Saathi AI service on http://127.0.0.1:$port"
Set-Location $serviceDirectory
python run.py
exit $LASTEXITCODE
