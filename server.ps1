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

        # Checkpoint: Check Status (/api/checkpoint/status or /api/check-session)
        if ($rawPath -eq "/api/checkpoint/status" -or $rawPath -eq "/api/check-session") {
            $s = if ($req.QueryString["session"]) { $req.QueryString["session"] } else { $req.QueryString["puid"] }
            $isVerified = $false
            if ($s -and $Sessions.ContainsKey($s)) {
                $isVerified = [bool]$Sessions[$s].verified
            }
            $ans = '{"sessionId":"' + $s + '","puid":"' + $s + '","verified":' + ($isVerified.ToString().ToLower()) + '}'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($ans)
            $res.ContentType = "application/json"
            $res.StatusCode = 200
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        # LootLabs Postback Webhook Endpoint
        if ($rawPath -eq "/api/lootlabs-postback" -or $rawPath -eq "/api/simulate-postback" -or $rawPath -eq "/api/test-verify") {
            $uid = if ($req.QueryString["uid"]) { $req.QueryString["uid"] } else { $req.QueryString["puid"] }
            if (-not $uid) { $uid = $req.QueryString["session"] }
            if ($uid) {
                if ($Sessions.ContainsKey($uid)) {
                    $Sessions[$uid].verified = $true
                    $Sessions[$uid].paidAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                } else {
                    $Sessions[$uid] = @{ verified = $true; paidAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() }
                }
            } else {
                # Mark all sessions verified if no uid passed
                foreach ($k in @($Sessions.Keys)) {
                    $Sessions[$k].verified = $true
                }
            }
            $ans = '{"status":"ok","message":"LootLabs postback credited successfully","uid":"' + $uid + '","verified":true}'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($ans)
            $res.ContentType = "application/json"
            $res.StatusCode = 200
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        # Reset Device Test
        if ($rawPath -eq "/api/reset-device-test") {
            $Sessions.Clear()
            $ans = '{"success":true,"message":"Sessions cleared"}'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($ans)
            $res.ContentType = "application/json"
            $res.StatusCode = 200
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        # Mock /api/config for local testing
        if ($rawPath -eq "/api/config") {
            $ans = '{"lootlabsGate":{"enabled":true,"provider":"lootlabs","token":"blacklist_vip","shrinkmeUrl":"https://shrinkme.click/aZd1s","blackpassLockerUrl":"/access","shrinkearnUrl":"","lootlabsUrl":"https://loot-link.com/s?cWo9w57Q&data=5Sry/nbaIQi29n2jVNZ7M9UpuqobH6bsHCdIKRglVMRPjJjypYEmr0NbQXLrHww5","expiryHours":24,"bypassMessage":"Please complete LootLabs verification to unlock website access for 24 hours"}}'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($ans)
            $res.ContentType = "application/json; charset=utf-8"
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
