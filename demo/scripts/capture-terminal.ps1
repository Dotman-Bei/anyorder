# S3: opens a visible terminal window with a unique title, captures ONLY that window (gfxcapture by
# title, found at runtime, never a hardcoded handle), runs the real commands, stops, gate-checks the log.
param([int]$Take = 1)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'capture\S3'
New-Item -ItemType Directory -Force $out | Out-Null
$title = 'anyorder-demo-terminal'
$go = Join-Path $out 'go.flag'; $done = Join-Path $out 'done.flag'
$log = Join-Path $out "S3-take$Take.log"; $mp4 = Join-Path $out "S3-take$Take.mp4"
Remove-Item $go, $done, $log, $mp4 -ErrorAction SilentlyContinue

# A console-appearance key scoped to this one unique window title only; removed again at the end.
$key = "HKCU:\Console\$title"
New-Item -Path $key -Force | Out-Null
Set-ItemProperty $key FaceName 'Consolas'
Set-ItemProperty $key FontFamily 54 -Type DWord
Set-ItemProperty $key FontWeight 400 -Type DWord
Set-ItemProperty $key FontSize ([int](28 -shl 16)) -Type DWord
Set-ItemProperty $key WindowSize ([int]((32 -shl 16) -bor 112)) -Type DWord
Set-ItemProperty $key ScreenBufferSize ([int]((300 -shl 16) -bor 112)) -Type DWord

$runner = Join-Path $PSScriptRoot 'terminal-runner.ps1'
$argline = "/c start `"$title`" powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$runner`" -Log `"$log`" -Go `"$go`" -Done `"$done`""
Start-Process -FilePath cmd.exe -ArgumentList $argline -WindowStyle Hidden | Out-Null

# find the window by title at runtime
$win = $null
for ($i = 0; $i -lt 60 -and -not $win; $i++) {
    Start-Sleep -Milliseconds 250
    $win = Get-Process powershell -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq $title } | Select-Object -First 1
}
if (-not $win) { Remove-Item $key -Recurse -ErrorAction SilentlyContinue; throw 'capture window not found' }
"window found: pid $($win.Id)"

$ff = New-Object System.Diagnostics.Process
$ff.StartInfo.FileName = 'ffmpeg'
$ff.StartInfo.Arguments = "-y -hide_banner -f lavfi -i `"gfxcapture=window_title=$title`:capture_cursor=0,hwdownload,format=bgra,fps=30`" -vf `"scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p`" -c:v libx264 -crf 16 -preset fast `"$mp4`""
$ff.StartInfo.UseShellExecute = $false
$ff.StartInfo.RedirectStandardInput = $true
$ff.StartInfo.RedirectStandardError = $true
$null = $ff.Start()
$errTask = $ff.StandardError.ReadToEndAsync()
Start-Sleep -Seconds 3
if ($ff.HasExited) { Remove-Item $key -Recurse -ErrorAction SilentlyContinue; throw "ffmpeg exited early: $($errTask.Result)" }
New-Item -ItemType File -Path $go -Force | Out-Null

$t0 = Get-Date
while (-not (Test-Path $done) -and ((Get-Date) - $t0).TotalSeconds -lt 150) { Start-Sleep -Milliseconds 250 }
Start-Sleep -Seconds 1.5
$ff.StandardInput.WriteLine('q')
$null = $ff.WaitForExit(20000)
if (-not $ff.HasExited) { $ff.Kill() }
Remove-Item $key -Recurse -ErrorAction SilentlyContinue
Get-Process powershell -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq $title } | ForEach-Object { Stop-Process -Id $_.Id -Force }

# gate assertion
$t = if (Test-Path $log) { Get-Content $log -Raw -Encoding UTF8 } else { '' }
$checks = [ordered]@{
  'sandwich: 6 passed'           = $t -match 'test result: ok\. 6 passed; 0 failed'
  'permutation: 3 passed'        = $t -match 'test result: ok\. 3 passed; 0 failed'
  'grep hit on the profit assert' = $t -match '117:.*== 8_090_638_930_163_447'
  'every exit code 0'            = (([regex]::Matches($t, '### exit=(\d+)') | ForEach-Object { $_.Groups[1].Value }) -notmatch '^0$').Count -eq 0
  'no username in the log'       = $t -notmatch [regex]::Escape($env:USERNAME)
  'clip written'                 = (Test-Path $mp4) -and ((Get-Item $mp4).Length -gt 100000)
}
$checks.GetEnumerator() | ForEach-Object { '{0} {1}' -f $(if ($_.Value) { 'ok ' } else { 'NOT' }), $_.Key }
$pass = -not ($checks.Values -contains $false)
@{ id = 'S3'; take = $Take; pass = $pass; checks = $checks } | ConvertTo-Json | Set-Content (Join-Path $out "S3-take$Take.json") -Encoding UTF8
"S3 take${Take}: " + $(if ($pass) { 'PASS' } else { 'FAIL' })
