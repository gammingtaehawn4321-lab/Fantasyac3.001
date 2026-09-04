$ErrorActionPreference = 'Stop'
Write-Host 'Installing llama.cpp with WinGet...'
winget install --id ggml.llamacpp -e --accept-package-agreements --accept-source-agreements
Write-Host 'Done. Open a new PowerShell window if llama is not immediately found.'
