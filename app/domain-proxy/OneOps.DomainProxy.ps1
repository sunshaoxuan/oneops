param(
    [string]$ConfigPath = (Join-Path $PSScriptRoot "domain-proxy.json"),
    [switch]$SelfTest
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function ConvertTo-Base64Url {
    param([byte[]]$Bytes)
    return [Convert]::ToBase64String($Bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

function New-OneOpsSignature {
    param(
        [string]$Secret,
        [string]$Method,
        [string]$PathAndQuery,
        [string]$User,
        [string]$Upn,
        [string]$Timestamp,
        [string]$Nonce
    )
    $canonical = @(
        $Method.ToUpperInvariant(),
        $PathAndQuery,
        $User,
        $Upn,
        $Timestamp,
        $Nonce
    ) -join "`n"
    $hmac = [Security.Cryptography.HMACSHA256]::new(
        [Text.Encoding]::UTF8.GetBytes($Secret)
    )
    try {
        return ConvertTo-Base64Url -Bytes $hmac.ComputeHash(
            [Text.Encoding]::UTF8.GetBytes($canonical)
        )
    }
    finally {
        $hmac.Dispose()
    }
}

function New-OneOpsNonce {
    $bytes = New-Object byte[] 24
    $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $generator.GetBytes($bytes)
    }
    finally {
        $generator.Dispose()
    }
    return ConvertTo-Base64Url -Bytes $bytes
}

function Escape-LdapFilterValue {
    param([string]$Value)
    return $Value.Replace("\", "\5c").Replace("*", "\2a").Replace("(", "\28").Replace(")", "\29").Replace(
        [char]0,
        "\00"
    )
}

function Get-AccountName {
    param([string]$IdentityName)
    $value = $IdentityName.Trim()
    $slash = $value.LastIndexOf("\")
    if ($slash -ge 0) {
        $value = $value.Substring($slash + 1)
    }
    $at = $value.IndexOf("@")
    if ($at -ge 0) {
        $value = $value.Substring(0, $at)
    }
    return $value.Trim()
}

function Test-AllowedUpn {
    param(
        [string]$Upn,
        [string[]]$AllowedDomains
    )
    $normalized = $Upn.Trim().ToLowerInvariant()
    $at = $normalized.LastIndexOf("@")
    if ($at -le 0) {
        return $false
    }
    $domain = $normalized.Substring($at + 1)
    return $AllowedDomains | Where-Object {
        $domain -eq $_.Trim().ToLowerInvariant()
    } | Select-Object -First 1
}

function Get-DomainUserInfo {
    param(
        [string]$IdentityName,
        [string[]]$AllowedDomains
    )
    Add-Type -AssemblyName System.DirectoryServices
    $accountName = Get-AccountName -IdentityName $IdentityName
    $searcher = [DirectoryServices.DirectorySearcher]::new()
    try {
        $escaped = Escape-LdapFilterValue -Value $accountName
        $searcher.Filter = "(&(objectCategory=person)(objectClass=user)(sAMAccountName=$escaped))"
        foreach ($property in "userPrincipalName", "mail", "displayName", "department", "title") {
            [void]$searcher.PropertiesToLoad.Add($property)
        }
        $result = $searcher.FindOne()
        if ($null -eq $result) {
            throw "The authenticated Windows account was not found in Active Directory."
        }
        $values = @{}
        foreach ($property in "userprincipalname", "mail", "displayname", "department", "title") {
            $items = $result.Properties[$property]
            $values[$property] = if ($items -and $items.Count -gt 0) {
                [string]$items[0]
            }
            else {
                ""
            }
        }
        $upn = @($values.mail, $values.userprincipalname) |
            Where-Object { $_ -and (Test-AllowedUpn -Upn $_ -AllowedDomains $AllowedDomains) } |
            Select-Object -First 1
        if (-not $upn) {
            throw "The authenticated Windows account has no allowed onehr.jp principal."
        }
        return [pscustomobject]@{
            Upn = $upn.Trim().ToLowerInvariant()
            Mail = if ($values.mail) { $values.mail.Trim().ToLowerInvariant() } else { $upn.Trim().ToLowerInvariant() }
            DisplayName = if ($values.displayname) { $values.displayname.Trim() } else { $accountName }
            Department = $values.department.Trim()
            Title = $values.title.Trim()
        }
    }
    finally {
        $searcher.Dispose()
    }
}

function Add-EncodedHeader {
    param(
        [Net.Http.HttpRequestMessage]$Request,
        [string]$Name,
        [string]$Value
    )
    if ($Value) {
        [void]$Request.Headers.TryAddWithoutValidation($Name, [Uri]::EscapeDataString($Value))
    }
}

function Write-Response {
    param(
        [Net.HttpListenerResponse]$Response,
        [int]$StatusCode,
        [byte[]]$Body,
        [string]$ContentType = "text/plain; charset=utf-8"
    )
    $Response.StatusCode = $StatusCode
    $Response.ContentType = $ContentType
    $Response.ContentLength64 = $Body.Length
    $Response.OutputStream.Write($Body, 0, $Body.Length)
    $Response.OutputStream.Close()
}

if ($SelfTest) {
    $signature = New-OneOpsSignature `
        -Secret "secret" `
        -Method "GET" `
        -PathAndQuery "/api/work-center/v1/auth/sso/windows/begin?returnTo=%2F" `
        -User "TOKYO\viewer.user" `
        -Upn "viewer.user@onehr.jp" `
        -Timestamp "1784869000000" `
        -Nonce "nonce-test"
    [pscustomobject]@{
        Signature = $signature
        Expected = "1cNnZswF0lkgdP4GJ2R3AfB3iiN1sx6kAsr2CWUHf30"
        Valid = $signature -eq "1cNnZswF0lkgdP4GJ2R3AfB3iiN1sx6kAsr2CWUHf30"
    } | ConvertTo-Json -Compress
    exit 0
}

if (-not (Test-Path -LiteralPath $ConfigPath)) {
    throw "Domain proxy configuration was not found: $ConfigPath"
}
Add-Type -AssemblyName System.Net.Http
$config = Get-Content -Raw -LiteralPath $ConfigPath | ConvertFrom-Json
$secretPath = if ([IO.Path]::IsPathRooted([string]$config.SharedSecretFile)) {
    [string]$config.SharedSecretFile
}
else {
    Join-Path (Split-Path -Parent $ConfigPath) ([string]$config.SharedSecretFile)
}
if (-not (Test-Path -LiteralPath $secretPath)) {
    throw "Domain proxy shared secret was not found."
}
$sharedSecret = (Get-Content -Raw -LiteralPath $secretPath).Trim()
if ($sharedSecret.Length -lt 32) {
    throw "Domain proxy shared secret is too short."
}
$allowedDomains = @($config.AllowedUpnDomains | ForEach-Object { [string]$_ })
$listenPrefix = [string]$config.ListenPrefix
$targetBaseUrl = ([string]$config.TargetBaseUrl).TrimEnd("/") + "/"

$handler = [Net.Http.HttpClientHandler]::new()
$handler.AllowAutoRedirect = $false
$handler.UseCookies = $false
if ([bool]$config.AllowInvalidTargetCertificate) {
    $handler.ServerCertificateCustomValidationCallback = { $true }
}
$http = [Net.Http.HttpClient]::new($handler)
$listener = [Net.HttpListener]::new()
$listener.AuthenticationSchemeSelectorDelegate = {
    param($request)
    if ($request.Url.AbsolutePath -eq "/health") {
        return [Net.AuthenticationSchemes]::Anonymous
    }
    return [Net.AuthenticationSchemes]::IntegratedWindowsAuthentication
}
$listener.Prefixes.Add($listenPrefix)
$listener.Start()
Write-Output "OneOps domain proxy listening on $listenPrefix"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
            $pathAndQuery = $context.Request.RawUrl
            if ($context.Request.Url.AbsolutePath -eq "/health") {
                $machine = Get-CimInstance Win32_ComputerSystem
                $payload = [Text.Encoding]::UTF8.GetBytes(
                    ([pscustomobject]@{
                        status = "UP"
                        domainJoined = [bool]$machine.PartOfDomain
                        domain = [string]$machine.Domain
                        target = $targetBaseUrl
                    } | ConvertTo-Json -Compress)
                )
                Write-Response -Response $context.Response -StatusCode 200 -Body $payload -ContentType "application/json; charset=utf-8"
                continue
            }
            if (
                $context.Request.HttpMethod -ne "GET" -or
                $context.Request.Url.AbsolutePath -ne "/api/work-center/v1/auth/sso/windows/begin"
            ) {
                Write-Response -Response $context.Response -StatusCode 404 -Body ([Text.Encoding]::UTF8.GetBytes("Not Found"))
                continue
            }
            $identity = $context.User.Identity -as [Security.Principal.WindowsIdentity]
            $rawUser = if ($identity) { $identity.Name } else { "" }
            if (-not $rawUser -or $rawUser.EndsWith('$')) {
                Write-Response -Response $context.Response -StatusCode 403 -Body ([Text.Encoding]::UTF8.GetBytes("Forbidden"))
                continue
            }
            $info = Get-DomainUserInfo -IdentityName $rawUser -AllowedDomains $allowedDomains
            $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds().ToString()
            $nonce = New-OneOpsNonce
            $signature = New-OneOpsSignature `
                -Secret $sharedSecret `
                -Method "GET" `
                -PathAndQuery $pathAndQuery `
                -User $rawUser `
                -Upn $info.Upn `
                -Timestamp $timestamp `
                -Nonce $nonce
            $target = [Uri]::new([Uri]$targetBaseUrl, $pathAndQuery.TrimStart("/"))
            $request = [Net.Http.HttpRequestMessage]::new([Net.Http.HttpMethod]::Get, $target)
            [void]$request.Headers.TryAddWithoutValidation("X-OneOps-Remote-User", $rawUser)
            [void]$request.Headers.TryAddWithoutValidation("X-OneOps-Remote-Upn", $info.Upn)
            [void]$request.Headers.TryAddWithoutValidation("X-OneOps-Auth-Timestamp", $timestamp)
            [void]$request.Headers.TryAddWithoutValidation("X-OneOps-Auth-Nonce", $nonce)
            [void]$request.Headers.TryAddWithoutValidation("X-OneOps-Auth-Signature", $signature)
            [void]$request.Headers.TryAddWithoutValidation(
                "X-Real-IP",
                [string]$context.Request.RemoteEndPoint.Address
            )
            Add-EncodedHeader -Request $request -Name "X-OneOps-Remote-Display-Name" -Value $info.DisplayName
            Add-EncodedHeader -Request $request -Name "X-OneOps-Remote-Mail" -Value $info.Mail
            Add-EncodedHeader -Request $request -Name "X-OneOps-Remote-Department" -Value $info.Department
            Add-EncodedHeader -Request $request -Name "X-OneOps-Remote-Title" -Value $info.Title
            $response = $http.SendAsync($request).GetAwaiter().GetResult()
            try {
                $body = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
                $context.Response.StatusCode = [int]$response.StatusCode
                foreach ($header in $response.Headers) {
                    $context.Response.Headers[$header.Key] = $header.Value -join ","
                }
                foreach ($header in $response.Content.Headers) {
                    if ($header.Key -ne "Content-Length") {
                        $context.Response.Headers[$header.Key] = $header.Value -join ","
                    }
                }
                $context.Response.ContentLength64 = $body.Length
                $context.Response.OutputStream.Write($body, 0, $body.Length)
                $context.Response.OutputStream.Close()
            }
            finally {
                $response.Dispose()
                $request.Dispose()
            }
        }
        catch {
            $message = [Text.Encoding]::UTF8.GetBytes("Domain authentication proxy failed.")
            if ($context.Response.OutputStream.CanWrite) {
                Write-Response -Response $context.Response -StatusCode 502 -Body $message
            }
            Write-Warning $_
        }
    }
}
finally {
    $listener.Stop()
    $listener.Close()
    $http.Dispose()
    $handler.Dispose()
}
