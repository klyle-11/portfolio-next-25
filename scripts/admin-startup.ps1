# Start the blog admin desktop app (dev mode, `npm run admin:app`) when you sign in to Windows.
#
#   npm run admin:startup          add it to your Startup folder
#   npm run admin:startup:remove   take it out again
#
# It runs hidden (no console window) and writes its output to admin/startup.log.
param([switch]$Remove)

$repo = Split-Path -Parent $PSScriptRoot
$shortcut = Join-Path ([Environment]::GetFolderPath('Startup')) 'Blog Admin.lnk'

if ($Remove) {
    if (Test-Path $shortcut) { Remove-Item $shortcut; Write-Host "Removed $shortcut" }
    else { Write-Host 'Blog Admin is not set to start on sign-in.' }
    exit 0
}

$log = Join-Path $repo 'admin\startup.log'
$command = "Set-Location -LiteralPath '$repo'; npm run admin:app *> '$log'"

$shell = New-Object -ComObject WScript.Shell
$link = $shell.CreateShortcut($shortcut)
$link.TargetPath = (Get-Command powershell.exe).Source
$link.Arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -Command `"$command`""
$link.WorkingDirectory = $repo
$link.IconLocation = Join-Path $repo 'admin\src-tauri\icons\icon.ico'
$link.Description = 'Blog Admin (dev)'
$link.Save()

Write-Host "Blog Admin will start when you sign in: $shortcut"
Write-Host "Output goes to $log"
