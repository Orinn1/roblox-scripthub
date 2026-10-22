$ErrorActionPreference = 'Stop'
$destZip = Join-Path $PSScriptRoot "discloud-bot.zip"
$tempDir = Join-Path $env:TEMP ("discloud_pkg_" + (Get-Random))

Write-Host "Creating temp directory: $tempDir"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    $filesToCopy = @(
        'discloud.config',
        'index-discloud.js',
        'package.json',
        'package-lock.json',
        'db.js',
        '.env',
        'bot',
        'data'
    )

    foreach ($file in $filesToCopy) {
        $sourcePath = Join-Path $PSScriptRoot $file
        if (Test-Path $sourcePath) {
            Write-Host "Copying $file..."
            Copy-Item -Path $sourcePath -Destination $tempDir -Recurse -Force
        }
    }

    # Copy super-bot without node_modules
    $superBotSrc = Join-Path $PSScriptRoot 'super-bot'
    if (Test-Path $superBotSrc) {
        Write-Host "Copying super-bot (excluding node_modules)..."
        $superBotDest = Join-Path $tempDir 'super-bot'
        Copy-Item -Path $superBotSrc -Destination $tempDir -Recurse -Force
        $sbModules = Join-Path $superBotDest 'node_modules'
        if (Test-Path $sbModules) {
            Remove-Item -Path $sbModules -Recurse -Force
        }
    }

    # Copy shop-bot without node_modules
    $shopBotSrc = Join-Path $PSScriptRoot 'shop-bot'
    if (Test-Path $shopBotSrc) {
        Write-Host "Copying shop-bot (excluding node_modules)..."
        $shopBotDest = Join-Path $tempDir 'shop-bot'
        Copy-Item -Path $shopBotSrc -Destination $tempDir -Recurse -Force
        $shopModules = Join-Path $shopBotDest 'node_modules'
        if (Test-Path $shopModules) {
            Remove-Item -Path $shopModules -Recurse -Force
        }
    }

    if (Test-Path $destZip) {
        Remove-Item -Path $destZip -Force
    }

    Write-Host "Compressing to $destZip..."
    Compress-Archive -Path "$tempDir\*" -DestinationPath $destZip -Force
    Write-Host "SUCCESS: $destZip created successfully!"
}
finally {
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
