<#
.SYNOPSIS
  Interview Copilot AI - Windows 11 Native Screen-Share Invisibility Script
  Applies Parakeet-grade SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE) to hide the Copilot HUD
  from Microsoft Teams, Zoom, Google Meet, and OBS during ENTIRE SCREEN sharing.

.DESCRIPTION
  This script uses the official Windows 10/11 Desktop Window Manager (DWM) API
  SetWindowDisplayAffinity with dwAffinity = 0x00000011 (WDA_EXCLUDEFROMCAPTURE).
  The window remains 100% visible to you on your monitor, but becomes completely
  invisible to screen sharing, video conferencing, and screen recording tools.
#>

$signature = @"
using System;
using System.Runtime.InteropServices;
public class WinDWM {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetWindowDisplayAffinity(IntPtr hWnd, uint dwAffinity);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
}
"@

Add-Type -TypeDefinition $signature

$WDA_NONE = 0x00000000
$WDA_EXCLUDEFROMCAPTURE = 0x00000011 # Windows 10 2004+ and Windows 11

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Interview Copilot AI - Native Screen Share Cloak" -ForegroundColor Green
Write-Host "  Parakeet-grade WDA_EXCLUDEFROMCAPTURE (Win32 DWM API)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$targetTitles = @("Settings", "Copilot HUD", "CopilotFloatingHUD", "Interview Copilot", "Notepad - Notes.txt")
$foundWindows = 0

[WinDWM]::EnumWindows({
    param($hWnd, $lParam)
    $sb = New-Object System.Text.StringBuilder 256
    [WinDWM]::GetWindowText($hWnd, $sb, 256) | Out-Null
    $title = $sb.ToString()

    foreach ($target in $targetTitles) {
        if ($title -like "*$target*") {
            $result = [WinDWM]::SetWindowDisplayAffinity($hWnd, $WDA_EXCLUDEFROMCAPTURE)
            if ($result) {
                Write-Host "[SUCCESS] Cloaked window: '$title' (Handle: $hWnd)" -ForegroundColor Green
                Write-Host "          --> Invisible to Teams / Zoom / Meet during Entire Screen sharing!" -ForegroundColor Yellow
                $script:foundWindows++
            } else {
                $err = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
                Write-Host "[NOTE] Window found: '$title' (Status: $err)" -ForegroundColor DarkGray
            }
            break
        }
    }
    return $true
}, [IntPtr]::Zero)

if ($foundWindows -eq 0) {
    Write-Host "[INFO] No open Copilot HUD window found matching: $($targetTitles -join ', ')." -ForegroundColor Yellow
    Write-Host "       Please launch the Pop Out Desktop HUD first, then re-run this script." -ForegroundColor White
} else {
    Write-Host "`nAll matching windows are now excluded from Windows DWM desktop capture." -ForegroundColor Green
    Write-Host "You can now share your ENTIRE SCREEN safely in Teams, Zoom, or Google Meet." -ForegroundColor Cyan
}

Start-Sleep -Seconds 3
