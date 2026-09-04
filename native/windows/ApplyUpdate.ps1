param(
  [Parameter(Mandatory=$true)][string]$PackageZip,
  [string]$InstallDir = (Resolve-Path "$PSScriptRoot\..\..").Path
)
$ErrorActionPreference = 'Stop'

if (-not (Test-Path $PackageZip)) { throw "업데이트 ZIP을 찾을 수 없습니다: $PackageZip" }
$staging = Join-Path $env:TEMP ("fantasyac_update_" + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $staging | Out-Null
try {
  Expand-Archive -Path $PackageZip -DestinationPath $staging -Force
  $candidate = $staging
  $children = Get-ChildItem $staging
  if ($children.Count -eq 1 -and $children[0].PSIsContainer) { $candidate = $children[0].FullName }

  # Never overwrite locally-held secrets/user content. Browser IndexedDB lives outside this tree.
  $preserve = @('.env', 'src\user_content\petReferences.ts')
  $tempPreserve = @{}
  foreach ($rel in $preserve) {
    $src = Join-Path $InstallDir $rel
    if (Test-Path $src) {
      $tmp = Join-Path $env:TEMP ("fantasyac_preserve_" + [Guid]::NewGuid().ToString('N'))
      Copy-Item $src $tmp -Force
      $tempPreserve[$rel] = $tmp
    }
  }

  Write-Host '[Fantasyac] 프로그램 파일 업데이트 중...'
  robocopy $candidate $InstallDir /MIR /XD node_modules .git /XF .env | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy 실패 코드: $LASTEXITCODE" }

  foreach ($rel in $tempPreserve.Keys) {
    $dest = Join-Path $InstallDir $rel
    New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
    Copy-Item $tempPreserve[$rel] $dest -Force
    Remove-Item $tempPreserve[$rel] -Force -ErrorAction SilentlyContinue
  }
  Write-Host '[Fantasyac] 업데이트 완료. 세이브는 동일 localhost 원점의 IndexedDB에 유지됩니다.' -ForegroundColor Green
} finally {
  Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue
}
