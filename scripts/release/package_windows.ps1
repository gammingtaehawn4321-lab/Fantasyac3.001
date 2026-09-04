param(
  [Parameter(Mandatory=$true)][string]$Version,
  [string]$Root = (Resolve-Path "$PSScriptRoot\..\..").Path,
  [string]$OutDir = (Join-Path (Resolve-Path "$PSScriptRoot\..\..").Path 'release-out')
)
$ErrorActionPreference = 'Stop'
$stage = Join-Path $env:TEMP ("fantasyac_windows_" + [Guid]::NewGuid().ToString('N'))
$payload = Join-Path $stage 'Fantasyac'
New-Item -ItemType Directory -Force -Path $payload, $OutDir | Out-Null
try {
  Push-Location $Root
  try {
    npm install
    npm run build
    npm prune --omit=dev
  } finally { Pop-Location }

  $include = @(
    'dist','node_modules','package.json','package-lock.json','.env.example','metadata.json',
    'local_ai','runtime','native\windows','src\user_content','README.md',
    'UPDATE_AND_SAVE_PLAN.md','LOCAL_AI_5TH_INTEGRATION_NOTES.md'
  )
  foreach ($rel in $include) {
    $src = Join-Path $Root $rel
    if (Test-Path $src) {
      $dest = Join-Path $payload $rel
      $parent = Split-Path $dest
      New-Item -ItemType Directory -Force -Path $parent | Out-Null
      Copy-Item $src $dest -Recurse -Force
    }
  }

  $nodeCommand = Get-Command node -ErrorAction Stop
  $nodeDir = Join-Path $payload 'runtime\node'
  New-Item -ItemType Directory -Force -Path $nodeDir | Out-Null
  Copy-Item $nodeCommand.Source (Join-Path $nodeDir 'node.exe') -Force

  $zip = Join-Path $OutDir ("Fantasyac-Windows-v$Version.zip")
  if (Test-Path $zip) { Remove-Item $zip -Force }
  Compress-Archive -Path $payload -DestinationPath $zip -CompressionLevel Optimal
  Write-Output $zip
} finally {
  Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
}
