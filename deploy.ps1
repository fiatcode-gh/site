# Variables
$remoteUser = "dhemas"
$remoteHost = "dhemasnurjaya.com"
$remoteDir = "/home/dhemas/apps/blog/public/"
$localDir = "dist/"
$keyPath = "D:\Secrets\giocloud-default.ppk"
$winscpExecutable = "C:\Users\dhemas\AppData\Local\Programs\WinSCP\WinSCP.com"  # Update this if needed

# Build astro site
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "Build failed!" -ForegroundColor Red
  exit 1
}

# Generate WinSCP sync commands
$scriptContent = @"
open sftp://$remoteUser@$remoteHost -privatekey=$keyPath
synchronize remote -delete -criteria=checksum $localDir $remoteDir
exit
"@

# Save the script to a temporary file
$tempScript = [System.IO.Path]::GetTempFileName()
Set-Content -Path $tempScript -Value $scriptContent

# Execute the WinSCP command
& $winscpExecutable /script=$tempScript

# Clean up
Remove-Item $tempScript

Write-Host "Deployed to $remoteHost!"
