@echo off
title Interview Copilot Desktop Launcher
color 0b
echo =====================================================================
echo   Interview Copilot AI - Native Windows Desktop Launcher
echo   Equipped with Parakeet-Grade Screen Share Invisibility (DWM Cloak)
echo =====================================================================
echo.
echo Launching native desktop window with SetWindowDisplayAffinity...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$appUrl = 'https://ais-dev-dekg77rzmikklb5emsfymz-934662374252.asia-southeast1.run.app?mode=standalone-hud';" ^
  "$sig = @'" ^
  "using System;" ^
  "using System.Runtime.InteropServices;" ^
  "public class WinCloak {" ^
  "    [DllImport(\"user32.dll\", SetLastError = true)]" ^
  "    public static extern bool SetWindowDisplayAffinity(IntPtr hWnd, uint dwAffinity);" ^
  "    [DllImport(\"user32.dll\")]" ^
  "    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);" ^
  "    public static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);" ^
  "}" ^
  "'@;" ^
  "Add-Type -TypeDefinition $sig;" ^
  "$browserPath = [System.IO.Path]::Combine($env:ProgramFiles, 'Google\Chrome\Application\chrome.exe');" ^
  "if (-not (Test-Path $browserPath)) {" ^
  "  $browserPath = [System.IO.Path]::Combine(${env:ProgramFiles(x86)}, 'Google\Chrome\Application\chrome.exe');" ^
  "}" ^
  "if (-not (Test-Path $browserPath)) {" ^
  "  $browserPath = [System.IO.Path]::Combine($env:LOCALAPPDATA, 'Google\Chrome\Application\chrome.exe');" ^
  "}" ^
  "if (-not (Test-Path $browserPath)) {" ^
  "  $browserPath = 'chrome.exe';" ^
  "}" ^
  "$proc = Start-Process -FilePath $browserPath -ArgumentList \"--app=$appUrl\", \"--window-size=440,650\", \"--window-position=1200,80\" -PassThru;" ^
  "Write-Host 'Window launched. Applying OS screen capture exclusion (WDA_EXCLUDEFROMCAPTURE)...' -ForegroundColor Cyan;" ^
  "$cloaked = $false;" ^
  "for ($i = 0; $i -lt 35; $i++) {" ^
  "  Start-Sleep -Milliseconds 250;" ^
  "  $procs = Get-Process -Name 'chrome', 'msedge' -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 -and ($_.MainWindowTitle -match 'Interview|Copilot|Settings|Terminal') };" ^
  "  foreach ($p in $procs) {" ^
  "    $h = $p.MainWindowHandle;" ^
  "    if ($h -ne 0) {" ^
  "      $res = [WinCloak]::SetWindowDisplayAffinity($h, 0x00000011);" ^
  "      if ($res) {" ^
  "        [WinCloak]::SetWindowPos($h, [WinCloak]::HWND_TOPMOST, 0, 0, 0, 0, 0x0001 -bor 0x0002);" ^
  "        Write-Host \"[CLOAKED] Protected window: $($p.MainWindowTitle)\" -ForegroundColor Green;" ^
  "        $cloaked = $true;" ^
  "      }" ^
  "    }" ^
  "  }" ^
  "  if ($cloaked) { break; }" ^
  "}" ^
  "if ($cloaked) {" ^
  "  Write-Host '`n============================================================' -ForegroundColor Green;" ^
  "  Write-Host '  [SUCCESS] SCREEN SHARE INVISIBILITY IS NOW ACTIVE!' -ForegroundColor Green;" ^
  "  Write-Host '============================================================' -ForegroundColor Green;" ^
  "  Write-Host '  Win32 WDA_EXCLUDEFROMCAPTURE has been applied.' -ForegroundColor White;" ^
  "  Write-Host '  The Copilot HUD is now 100% INVISIBLE to:' -ForegroundColor Yellow;" ^
  "  Write-Host '    * Microsoft Teams (Entire Screen / Screen 1)' -ForegroundColor White;" ^
  "  Write-Host '    * Zoom Desktop Screen Share' -ForegroundColor White;" ^
  "  Write-Host '    * Google Meet Full Desktop Capture' -ForegroundColor White;" ^
  "  Write-Host '    * Snipping Tool / OBS / Recording Software' -ForegroundColor White;" ^
  "  Write-Host '`n  You can now safely share your ENTIRE SCREEN in Teams.' -ForegroundColor Cyan;" ^
  "  Write-Host '  Keep this helper window open or minimize it during your interview.' -ForegroundColor DarkGray;" ^
  "} else {" ^
  "  Write-Host '[NOTE] Native window launched. Run stealth-cloak.ps1 if required.' -ForegroundColor Yellow;" ^
  "}"

echo.
echo Press any key to close this console (Copilot will stay open and hidden)...
pause >nul
