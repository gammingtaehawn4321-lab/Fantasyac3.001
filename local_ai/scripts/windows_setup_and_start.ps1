param([string]$Profile = 'desktop-quality')
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Project = Split-Path -Parent $Root

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js가 필요합니다.' }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'npm이 필요합니다.' }

if (-not (Test-Path (Join-Path $Project '.env'))) {
  Copy-Item (Join-Path $Project '.env.example') (Join-Path $Project '.env')
  Write-Host '.env 파일을 만들었습니다. GEMINI_API_KEY를 입력한 뒤 다시 실행하세요.' -ForegroundColor Yellow
  exit 1
}

if (-not (Get-Command llama -ErrorAction SilentlyContinue)) {
  Write-Host 'llama.cpp 설치 중...'
  winget install --id ggml.llamacpp -e --accept-package-agreements --accept-source-agreements
}

if (-not (Test-Path (Join-Path $Project 'node_modules'))) {
  Push-Location $Project
  npm install
  Pop-Location
}

$NarratorScript = Join-Path $Root 'scripts/windows_start.ps1'
Start-Process powershell -ArgumentList '-NoExit', '-ExecutionPolicy', 'Bypass', '-File', "`"$NarratorScript`"", '-Profile', $Profile
Start-Sleep -Seconds 2

Push-Location $Project
Write-Host '판타지악 서버를 시작합니다. 브라우저에서 http://127.0.0.1:3000 을 여세요.' -ForegroundColor Green
npm run dev
Pop-Location
