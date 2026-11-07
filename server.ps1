# Anti-Bypass Checkpoint Gateway Server (Port 3400)
param([int]$Port = 3400)

$Root = "C:\Users\Administrator\Downloads\roblox-scripthub-main\public"
$SecretKey = "b1c7af121565c79c916f738bbbbed70a97d1600c14c9218dc8c14e8033b27812"

# In-Memory Session Store for Postback Verification
$Sessions = [hashtable]::Synchronized(@{})

function HmacSha256($key, $data) {
    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($key)
    $hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($data))
    return [System.Convert]::ToBase64String($hash).Replace('+', '-').Replace('/', '_').TrimEnd('=')
}

function Base64UrlEncode($str) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($str)
    return [System.Convert]::ToBase64String($bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=')
}

function Base64UrlDecode($str) {
    $pad = $str.Replace('-', '+').Replace('_', '/')
    while ($pad.Length % 4) { $pad += "=" }
    $bytes = [System.Convert]::FromBase64String($pad)
    return [System.Text.Encoding]::UTF8.GetString($bytes)
}

$MimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")

$listener.Start()
Write-Output "Anti-Bypass Gateway Server running on port $Port"
Write-Output "Access Checkpoint: http://localhost:$Port/checkpoint"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response

        $res.Headers.Add("Access-Control-Allow-Origin", "*")
        $res.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $res.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization")

        if ($req.HttpMethod -eq "OPTIONS") {
            $res.StatusCode = 204
            $res.Close()
            continue
        }

        $rawPath = $req.Url.AbsolutePath.ToLower()

        # Checkpoint: Create Session
        if ($rawPath -eq "/api/checkpoint/create") {
            $rnd = [System.IO.Path]::GetRandomFileName().Replace('.', '').Substring(0, 8).ToUpper()
            $sessId = "TICKET_$rnd"
            $Sessions[$sessId] = @{
                verified = $false
                createdAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
            }
            $ans = '{"success":true,"sessionId":"' + $sessId + '"}'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($ans)
            $res.ContentType = "application/json"
            $res.StatusCode = 200
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        # Checkpoint: Check Status
        if ($rawPath -eq "/api/checkpoint/status") {
            $s = $req.QueryString["session"]
            $isVerified = $false
            if ($s -and $Sessions.ContainsKey($s)) {
                $isVerified = $Sessions[$s].verified
            }
            $ans = '{"sessionId":"' + $s + '","verified":' + ($isVerified.ToString().ToLower()) + '}'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($ans)
            $res.ContentType = "application/json"
            $res.StatusCode = 200
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        # LootLabs Postback Webhook Endpoint
        if ($rawPath -eq "/api/lootlabs-postback") {
            $uid = $req.QueryString["uid"]
            $clickId = $req.QueryString["click_id"]
            if ($uid -and $Sessions.ContainsKey($uid)) {
                $Sessions[$uid].verified = $true
                $Sessions[$uid].paidAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
            } elseif ($uid) {
                $Sessions[$uid] = @{ verified = $true; paidAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() }
            }
            $ans = '{"status":"ok","message":"LootLabs postback credited successfully","uid":"' + $uid + '"}'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($ans)
            $res.ContentType = "application/json"
            $res.StatusCode = 200
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        # Route: /checkpoint or /gateway
        if ($rawPath -eq "/checkpoint" -or $rawPath -eq "/gateway") {
            $filePath = Join-Path $Root "checkpoint.html"
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $res.ContentType = "text/html; charset=utf-8"
            $res.StatusCode = 200
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        # Route: /access, /hub, /gate, /locker
        if ($rawPath -eq "/access" -or $rawPath -eq "/hub" -or $rawPath -eq "/gate" -or $rawPath -eq "/locker" -or $rawPath -eq "/gateflow/locker") {
            $filePath = Join-Path $Root "gateflow\locker.html"
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $res.ContentType = "text/html; charset=utf-8"
            $res.StatusCode = 200
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        # Static files
        $subPath = $req.Url.AbsolutePath.TrimStart('/').Replace('/', '\')
        if ([string]::IsNullOrWhiteSpace($subPath)) {
            $subPath = "index.html"
        }
        $targetFile = Join-Path $Root $subPath

        if (Test-Path $targetFile -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($targetFile).ToLower()
            $contentType = if ($MimeTypes.ContainsKey($ext)) { $MimeTypes[$ext] } else { "application/octet-stream" }
            $bytes = [System.IO.File]::ReadAllBytes($targetFile)
            $res.ContentType = $contentType
            $res.StatusCode = 200
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        $notFound = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 Not Found</h1>")
        $res.StatusCode = 404
        $res.ContentType = "text/html"
        $res.OutputStream.Write($notFound, 0, $notFound.Length)
        $res.Close()
    } catch {
        # continue
    }
}
