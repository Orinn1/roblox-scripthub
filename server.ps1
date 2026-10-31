param (
    [int]$Port = 3000,
    [string]$Root = "$PSScriptRoot\public"
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   BlacklistScriptX Local Dev Server running on:" -ForegroundColor Green
Write-Host "   👉 http://localhost:$Port/" -ForegroundColor Yellow
Write-Host "   👉 http://localhost:$Port/gateflow/locker.html" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".webp" = "image/webp"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawPath = $request.Url.LocalPath
        if ($rawPath -eq "/") { $rawPath = "/index.html" }

        # Normalize relative path
        $relPath = $rawPath.TrimStart("/\").Replace("/", "\")
        $filePath = Join-Path $Root $relPath

        # Support clean URLs (e.g. /gateflow/locker -> /gateflow/locker.html)
        if (-not (Test-Path $filePath -PathType Leaf)) {
            if (Test-Path ($filePath + ".html") -PathType Leaf) {
                $filePath = $filePath + ".html"
            }
        }

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = $mimeTypes[$ext]
            if (-not $mime) { $mime = "application/octet-stream" }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.StatusCode = 200
        } else {
            $msg = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 Not Found</h1><p>$rawPath</p>")
            $response.ContentType = "text/html; charset=utf-8"
            $response.ContentLength64 = $msg.Length
            $response.StatusCode = 404
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }

        $response.Close()
    }
} finally {
    $listener.Stop()
    $listener.Close()
}

