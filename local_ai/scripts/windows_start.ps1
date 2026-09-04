param([string]$Profile = 'desktop-quality')
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Profiles = Get-Content (Join-Path $Root 'config/model_profiles.json') -Raw | ConvertFrom-Json
$P = $Profiles.$Profile
if (-not $P) { throw "Unknown profile: $Profile" }
Write-Host "Starting $($P.label): $($P.hfModel)"
llama serve -hf $P.hfModel --host 127.0.0.1 --port 8080 --ctx-size $P.ctxSize --n-gpu-layers all --flash-attn auto
