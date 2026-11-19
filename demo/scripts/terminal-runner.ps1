# Runs INSIDE the visible capture window. The commands really execute (fe test against the clean
# clone); the runner only echoes each command line before running it and holds after each one.
# Nothing is typed for show and no output is edited.
param([string]$Log, [string]$Go, [string]$Done)

$Host.UI.RawUI.WindowTitle = 'anyorder-demo-terminal'
Set-Location C:\anyorder-demo
function prompt { 'anyorder> ' }
Clear-Host
while (-not (Test-Path $Go)) { Start-Sleep -Milliseconds 100 }
Start-Sleep -Seconds 2

function Invoke-Step([string]$Display, [scriptblock]$Do, [int]$Hold) {
    Write-Host -NoNewline 'anyorder> ' -ForegroundColor Yellow
    Write-Host $Display
    "### $Display" | Out-File -FilePath $Log -Append -Encoding utf8
    & $Do | ForEach-Object { $_ | Out-File -FilePath $Log -Append -Encoding utf8; $_ }
    "### exit=$script:ec" | Out-File -FilePath $Log -Append -Encoding utf8
    Start-Sleep -Seconds $Hold
    Write-Host ''
}

Invoke-Step 'fe test --filter sandwich' { cmd /c 'fe test --filter sandwich 2>&1'; $script:ec = $LASTEXITCODE } 4
Invoke-Step 'fe test --filter permutation' { cmd /c 'fe test --filter permutation 2>&1'; $script:ec = $LASTEXITCODE } 4
Invoke-Step 'grep -n "== 8_090_638_930_163_447" ingots/exchange/src/sandwich_tests.fe' {
    & 'C:\Program Files\Git\usr\bin\grep.exe' -n '== 8_090_638_930_163_447' ingots/exchange/src/sandwich_tests.fe; $script:ec = $LASTEXITCODE
} 7
New-Item -ItemType File -Path $Done -Force | Out-Null
Start-Sleep -Seconds 2
