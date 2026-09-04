param(
  [string]$Root = (Resolve-Path "$PSScriptRoot\..\..").Path
)
$ErrorActionPreference = 'Stop'
$envFile = Join-Path $Root '.env'
if (-not (Test-Path $envFile)) {
  $example = Join-Path $Root '.env.example'
  if (Test-Path $example) { Copy-Item $example $envFile }
  Write-Host "[Fantasyac] .env가 준비되었습니다. GEMINI_API_KEY를 설정하세요." -ForegroundColor Yellow
}

$bundledNode = Join-Path $Root 'runtime\node\node.exe'
if (Test-Path $bundledNode) {
  $nodeExe = $bundledNode
} else {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) { throw '정식 배포본의 내장 Node 런타임을 찾지 못했습니다. 개발 실행 시 Node.js 22+가 필요합니다.' }
  $nodeExe = $node.Source
}

Push-Location $Root
try {
  if (-not (Test-Path (Join-Path $Root 'node_modules'))) {
    $npm = Get-Command npm -ErrorAction SilentlyContinue
    if (-not $npm) { throw 'node_modules가 없고 npm도 없습니다. 정식 Release ZIP을 다시 받아주세요.' }
    Write-Host '[Fantasyac] 개발 실행용 의존성 설치 중...'
    npm install
  }
  if (-not (Test-Path (Join-Path $Root 'dist\server.cjs'))) {
    Write-Host '[Fantasyac] 게임 빌드 중...'
    npm run build
  }

  Write-Host '[Fantasyac] 로컬 게임 서버 시작: http://127.0.0.1:3000'
  $proc = Start-Process -FilePath $nodeExe -ArgumentList @('dist/server.cjs') -WorkingDirectory $Root -PassThru
  Start-Sleep -Seconds 2
  Start-Process 'http://127.0.0.1:3000'
  Write-Host '게임 창을 닫은 뒤 이 창에서 Enter를 누르면 서버를 종료합니다.'
  Read-Host | Out-Null
  if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
} finally {
  Pop-Location
}
