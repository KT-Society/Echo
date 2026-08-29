$source = "C:\Users\Daddy\.config\echo"
$ws = "$(Get-Location)\.echo"
$central = "C:\Users\Daddy\.echo"

Write-Host "SoulSpread: Syncing from Global Config ($source) to Workspace ($ws)..."
if (!(Test-Path -Path $ws)) { New-Item -ItemType Directory -Path $ws -Force }
Get-ChildItem -Path $source -Exclude "node_modules" | Copy-Item -Destination $ws -Recurse -Force

Write-Host "SoulSpread: Syncing from Global Config ($source) to Central Echo ($central)..."
if (!(Test-Path -Path $central)) { New-Item -ItemType Directory -Path $central -Force }
Get-ChildItem -Path $source -Exclude "node_modules" | Copy-Item -Destination $central -Recurse -Force

Write-Host "SoulSpread: Sync Complete (node_modules excluded)."
