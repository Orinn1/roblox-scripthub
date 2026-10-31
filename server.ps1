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

        # Short & Clean URLs for Locker & Access Gate
        if ($rawPath -in @("/access", "/hub", "/gate", "/go", "/locker") -or $rawPath -like "/l/*") {
            $rawPath = "/gateflow/locker.html"
        }
        if ($rawPath -in @("/generator")) {
            $rawPath = "/gateflow/generator.html"
        }
        if ($rawPath -in @("/dashboard")) {
            $rawPath = "/gateflow/dashboard.html"
        }

        # Handle Short Locker API (/api/locker and /api/locker/create)
        if ($rawPath -eq "/api/latest-video") {
            $rawCh = $request.QueryString["ch"]
            if (-not $rawCh) { $rawCh = "Blacklistxyx" }
            $cleanCh = $rawCh.TrimStart("@").ToLower()
            
            $channelId = "UCOAGxYeICyBbSjxJkul3HXA"
            if ($cleanCh -like "*ghost*") {
                $channelId = "UC8laKzbaWUNJMJ6XN_pxiBg"
            }
            
            $vid = ""
            try {
                $rss = Invoke-WebRequest -Uri "https://www.youtube.com/feeds/videos.xml?channel_id=$channelId" -UserAgent "Mozilla/5.0" -UseBasicParsing
                $m = [regex]::Match($rss.Content, '<yt:videoId>(.*?)</yt:videoId>')
                if ($m.Success) {
                    $vid = $m.Groups[1].Value
                }
            } catch {}
            
            $videoUrl = if ($vid) { "https://www.youtube.com/watch?v=$vid" } else { "https://www.youtube.com/@$cleanCh/videos" }
            $outJson = @{
                success = $true
                channel = $cleanCh
                channelId = $channelId
                videoId = $vid
                videoUrl = $videoUrl
            } | ConvertTo-Json
            
            $outBytes = [System.Text.Encoding]::UTF8.GetBytes($outJson)
            $response.ContentType = "application/json; charset=utf-8"
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.StatusCode = 200
            $response.OutputStream.Write($outBytes, 0, $outBytes.Length)
            $response.Close()
            continue
        }

        # Gate Event Tracking (/api/gate/track)
        if ($rawPath -eq "/api/gate/track") {
            $key = "AIzaSyApTJf2qSiaaM3qQ9e2XE16Za1p3FGXpxI"
            $proj = "blacklistscripts"
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.Headers.Add("Access-Control-Allow-Methods", "POST, OPTIONS")
            $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")

            if ($request.HttpMethod -eq "OPTIONS") {
                $response.StatusCode = 204
                $response.Close()
                continue
            }

            if ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $bodyText = $reader.ReadToEnd()
                $body = ConvertFrom-Json $bodyText

                $slug = "$($body.slug)".Trim().ToLower()
                $event = "$($body.event)".Trim().ToLower()

                $fbGetUri = "https://firestore.googleapis.com/v1/projects/$proj/databases/(default)/documents/lockers/$slug`?key=$key"
                try {
                    $doc = Invoke-RestMethod -Uri $fbGetUri -Method Get
                    $f = $doc.fields
                    $clicks = 0
                    $unlocks = 0
                    if ($f.clicks.integerValue) { $clicks = [int]$f.clicks.integerValue }
                    if ($f.unlocks.integerValue) { $unlocks = [int]$f.unlocks.integerValue }

                    if ($event -eq "click") { $clicks += 1 }
                    if ($event -eq "unlock") { $unlocks += 1 }

                    $fbPatchUri = "https://firestore.googleapis.com/v1/projects/$proj/databases/(default)/documents/lockers/$slug`?updateMask.fieldPaths=clicks&updateMask.fieldPaths=unlocks&key=$key"
                    $patchBody = @{
                        fields = @{
                            clicks = @{ integerValue = $clicks }
                            unlocks = @{ integerValue = $unlocks }
                        }
                    } | ConvertTo-Json

                    Invoke-RestMethod -Uri $fbPatchUri -Method Patch -Body $patchBody -ContentType "application/json" | Out-Null

                    $jsonOut = @{
                        success = $true
                        slug = $slug
                        clicks = $clicks
                        unlocks = $unlocks
                    } | ConvertTo-Json

                    $outBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonOut)
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.StatusCode = 200
                    $response.OutputStream.Write($outBytes, 0, $outBytes.Length)
                } catch {
                    $errBytes = [System.Text.Encoding]::UTF8.GetBytes("{""error"":""$($_)""}")
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.StatusCode = 500
                    $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                }
                $response.Close()
                continue
            }
        }

        # List all lockers (/api/locker/list)
        if ($rawPath -eq "/api/locker/list") {
            $key = "AIzaSyApTJf2qSiaaM3qQ9e2XE16Za1p3FGXpxI"
            $proj = "blacklistscripts"
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS")
            $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")

            if ($request.HttpMethod -eq "OPTIONS") {
                $response.StatusCode = 204
                $response.Close()
                continue
            }

            $listUri = "https://firestore.googleapis.com/v1/projects/$proj/databases/(default)/documents/lockers?pageSize=100&key=$key"
            try {
                $raw = Invoke-RestMethod -Uri $listUri -Method Get
                $lockersList = @()
                if ($raw.documents) {
                    foreach ($d in $raw.documents) {
                        $f = $d.fields
                        $docSlug = if ($f.slug.stringValue) { $f.slug.stringValue } else { ($d.name -split '/')[-1] }
                        $lockersList += @{
                            slug = $docSlug
                            url = if ($f.url.stringValue) { $f.url.stringValue } else { "" }
                            script = if ($f.script.stringValue) { $f.script.stringValue } else { "" }
                            title = if ($f.title.stringValue) { $f.title.stringValue } else { $docSlug }
                            desc = if ($f.desc.stringValue) { $f.desc.stringValue } else { "" }
                            ch = if ($f.ch.stringValue) { $f.ch.stringValue } else { "Blacklistxyx" }
                            clicks = if ($f.clicks.integerValue) { [int]$f.clicks.integerValue } else { 0 }
                            unlocks = if ($f.unlocks.integerValue) { [int]$f.unlocks.integerValue } else { 0 }
                            createdAt = if ($f.createdAt.stringValue) { $f.createdAt.stringValue } else { $d.createTime }
                        }
                    }
                }

                $jsonOut = @{
                    success = $true
                    lockers = $lockersList
                } | ConvertTo-Json -Depth 5

                $outBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonOut)
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 200
                $response.OutputStream.Write($outBytes, 0, $outBytes.Length)
            } catch {
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes("{""error"":""$($_)""}")
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 500
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            }
            $response.Close()
            continue
        }

        if ($rawPath -eq "/api/locker" -or $rawPath -eq "/api/locker/create") {
            $key = "AIzaSyApTJf2qSiaaM3qQ9e2XE16Za1p3FGXpxI"
            $proj = "blacklistscripts"
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
            $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")

            if ($request.HttpMethod -eq "OPTIONS") {
                $response.StatusCode = 204
                $response.Close()
                continue
            }

            if ($request.HttpMethod -eq "DELETE") {
                $slug = $request.QueryString["slug"]
                if (-not $slug) {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                    $bodyText = $reader.ReadToEnd()
                    if ($bodyText) {
                        try {
                            $body = ConvertFrom-Json $bodyText
                            $slug = "$($body.slug)"
                        } catch {}
                    }
                }
                $slug = $slug.Trim().ToLower()
                if ($slug) {
                    $delUri = "https://firestore.googleapis.com/v1/projects/$proj/databases/(default)/documents/lockers/$slug`?key=$key"
                    try {
                        Invoke-RestMethod -Uri $delUri -Method Delete | Out-Null
                        $jsonOut = @{ success = $true; slug = $slug } | ConvertTo-Json
                        $outBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonOut)
                        $response.ContentType = "application/json; charset=utf-8"
                        $response.StatusCode = 200
                        $response.OutputStream.Write($outBytes, 0, $outBytes.Length)
                    } catch {
                        $errBytes = [System.Text.Encoding]::UTF8.GetBytes("{""error"":""$($_)""}")
                        $response.ContentType = "application/json; charset=utf-8"
                        $response.StatusCode = 500
                        $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                    }
                }
                $response.Close()
                continue
            }

            if ($request.HttpMethod -eq "PATCH") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $bodyText = $reader.ReadToEnd()
                $body = ConvertFrom-Json $bodyText
                
                $slug = "$($body.slug)".Trim().ToLower()
                $targetUrl = "$($body.url)"
                $scriptCode = "$($body.script)"
                $title = "$($body.title)"
                $desc = "$($body.desc)"
                $channel = if ($body.ch) { "$($body.ch)" } else { "Blacklistxyx" }

                $patchUri = "https://firestore.googleapis.com/v1/projects/$proj/databases/(default)/documents/lockers/$slug`?updateMask.fieldPaths=url&updateMask.fieldPaths=script&updateMask.fieldPaths=title&updateMask.fieldPaths=desc&updateMask.fieldPaths=ch&key=$key"
                $patchBody = @{
                    fields = @{
                        url = @{ stringValue = $targetUrl }
                        script = @{ stringValue = $scriptCode }
                        title = @{ stringValue = $title }
                        desc = @{ stringValue = $desc }
                        ch = @{ stringValue = $channel }
                    }
                } | ConvertTo-Json -Depth 5

                try {
                    Invoke-RestMethod -Uri $patchUri -Method Patch -Body $patchBody -ContentType "application/json; charset=utf-8" | Out-Null
                    $jsonOut = @{
                        success = $true
                        slug = $slug
                        locker = @{ slug = $slug; url = $targetUrl; script = $scriptCode; title = $title; desc = $desc; ch = $channel }
                    } | ConvertTo-Json
                    $outBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonOut)
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.StatusCode = 200
                    $response.OutputStream.Write($outBytes, 0, $outBytes.Length)
                } catch {
                    $errBytes = [System.Text.Encoding]::UTF8.GetBytes("{""error"":""$($_)""}")
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.StatusCode = 500
                    $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                }
                $response.Close()
                continue
            }

            if ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $bodyText = $reader.ReadToEnd()
                $body = ConvertFrom-Json $bodyText
                
                $slug = "$($body.slug)".Trim().ToLower() -replace '[^a-z0-9_-]', '-' -replace '-+', '-'
                if (-not $slug) {
                    $slug = -join ((97..122) + (48..57) | Get-Random -Count 5 | ForEach-Object {[char]$_})
                }
                
                $targetUrl = "$($body.url)"
                $scriptCode = "$($body.script)"
                $title = "$($body.title)"
                $desc = "$($body.desc)"
                $channel = if ($body.ch) { "$($body.ch)" } else { "Blacklistxyx" }
                
                $fbUri = "https://firestore.googleapis.com/v1/projects/$proj/databases/(default)/documents/lockers/$slug`?key=$key"
                $fbBody = @{
                    fields = @{
                        slug = @{ stringValue = $slug }
                        url = @{ stringValue = $targetUrl }
                        script = @{ stringValue = $scriptCode }
                        title = @{ stringValue = $title }
                        desc = @{ stringValue = $desc }
                        ch = @{ stringValue = $channel }
                        clicks = @{ integerValue = 0 }
                        unlocks = @{ integerValue = 0 }
                        createdAt = @{ stringValue = (Get-Date).ToUniversalTime().ToString("o") }
                    }
                } | ConvertTo-Json -Depth 5
                
                try {
                    $fbRes = Invoke-RestMethod -Uri $fbUri -Method Patch -Body $fbBody -ContentType "application/json; charset=utf-8"
                    $jsonOut = @{
                        success = $true
                        slug = $slug
                        shortUrl = "http://localhost:$Port/l/$slug"
                    } | ConvertTo-Json
                    $outBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonOut)
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.ContentLength64 = $outBytes.Length
                    $response.StatusCode = 200
                    $response.OutputStream.Write($outBytes, 0, $outBytes.Length)
                } catch {
                    $errBytes = [System.Text.Encoding]::UTF8.GetBytes("{""error"":""$($_)""}")
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.StatusCode = 500
                    $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                }
                $response.Close()
                continue
            }
            
            if ($request.HttpMethod -eq "GET") {
                $slug = $request.QueryString["slug"]
                if ($slug) {
                    $fbUri = "https://firestore.googleapis.com/v1/projects/$proj/databases/(default)/documents/lockers/$slug`?key=$key"
                    try {
                        $doc = Invoke-RestMethod -Uri $fbUri -Method Get
                        $f = $doc.fields
                        $jsonOut = @{
                            success = $true
                            locker = @{
                                slug = if ($f.slug.stringValue) { $f.slug.stringValue } else { $slug }
                                url = if ($f.url.stringValue) { $f.url.stringValue } else { "" }
                                script = if ($f.script.stringValue) { $f.script.stringValue } else { "" }
                                title = if ($f.title.stringValue) { $f.title.stringValue } else { "" }
                                desc = if ($f.desc.stringValue) { $f.desc.stringValue } else { "" }
                                ch = if ($f.ch.stringValue) { $f.ch.stringValue } else { "Blacklistxyx" }
                                clicks = if ($f.clicks.integerValue) { [int]$f.clicks.integerValue } else { 0 }
                                unlocks = if ($f.unlocks.integerValue) { [int]$f.unlocks.integerValue } else { 0 }
                            }
                        } | ConvertTo-Json
                        $outBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonOut)
                        $response.ContentType = "application/json; charset=utf-8"
                        $response.StatusCode = 200
                        $response.OutputStream.Write($outBytes, 0, $outBytes.Length)
                    } catch {
                        $errBytes = [System.Text.Encoding]::UTF8.GetBytes("{""error"":""Not found""}")
                        $response.StatusCode = 404
                        $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                    }
                }
                $response.Close()
                continue
            }
        }

        # Normalize relative path
        $relPath = $rawPath.TrimStart("/\").Replace("/", "\")
        $filePath = Join-Path $Root $relPath

        # Support clean URLs (e.g. /gateflow/locker -> /gateflow/locker.html)
        if (-not (Test-Path $filePath -PathType Leaf)) {
            if (Test-Path ($filePath + ".html") -PathType Leaf) {
                $filePath = $filePath + ".html"
            } elseif (Test-Path (Join-Path $Root (Join-Path "gateflow" $relPath)) -PathType Leaf) {
                $filePath = Join-Path $Root (Join-Path "gateflow" $relPath)
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

