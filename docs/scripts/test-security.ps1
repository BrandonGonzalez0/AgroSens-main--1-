<#
===============================================================
SCRIPT DE PRUEBAS DE SEGURIDAD - AGROSENS (PowerShell 5.1 compatible)
===============================================================
Ejecutar: .\test-security.ps1
Requisitos: Servidor backend corriendo en http://localhost:5000
Nota: Se han removido emojis y caracteres especiales para evitar
      problemas de parsing/encoding en Windows PowerShell 5.1.
===============================================================
#>

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:5000"
$testResults = @()

Write-Host "\n================ PRUEBAS DE SEGURIDAD - AGROSENS ================" -ForegroundColor Cyan

function Add-TestResult {
    param(
        [string]$Name,
        [string]$Status,
        [string]$Details
    )
    $script:testResults += [PSCustomObject]@{
        Test    = $Name
        Status  = $Status
        Details = $Details
    }
    $color = if ($Status -eq "PASS") { "Green" } elseif ($Status -eq "WARN") { "Yellow" } elseif ($Status -eq "ERROR") { "Magenta" } else { "Red" }
    Write-Host ("[{0}] {1}" -f $Status, $Name) -ForegroundColor $color
    if ($Details) {
        Write-Host ("   -> {0}" -f $Details) -ForegroundColor Gray
    }
}

# 1) Verificar que el servidor esté corriendo
Write-Host "\n[1/10] Verificando servidor..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri ("{0}/health" -f $baseUrl) -Method GET -UseBasicParsing -TimeoutSec 5
    Add-TestResult "Servidor activo" "PASS" ("Status: {0}" -f $response.StatusCode)
} catch {
    Add-TestResult "Servidor activo" "FAIL" "No se puede conectar al servidor"
    Write-Host ("El servidor debe estar corriendo en {0}" -f $baseUrl) -ForegroundColor Red
    Write-Host "Ejecuta: cd backend ; npm start" -ForegroundColor Yellow
    exit 1
}

# 2) CSRF PROTECTION
Write-Host "\n[2/10] Probando proteccion CSRF..." -ForegroundColor Yellow
try {
    $body = @{ test = "data" } | ConvertTo-Json
    $headers = @{ "Content-Type" = "application/json" }
    $response = Invoke-WebRequest -Uri ("{0}/api/ia" -f $baseUrl) -Method POST -Body $body -Headers $headers -UseBasicParsing -TimeoutSec 5
    Add-TestResult "CSRF Protection" "FAIL" "POST sin token fue aceptado (deberia rechazarse)"
} catch {
    if ($_.Exception -and $_.Exception.Response -and $_.Exception.Response.StatusCode -eq 403) {
        Add-TestResult "CSRF Protection" "PASS" "POST sin token fue rechazado (403)"
    } else {
        $code = if ($_.Exception -and $_.Exception.Response) { $_.Exception.Response.StatusCode } else { "N/A" }
        Add-TestResult "CSRF Protection" "WARN" ("Respuesta inesperada: {0}" -f $code)
    }
}

# 3) RATE LIMITING
Write-Host "\n[3/10] Probando rate limiting..." -ForegroundColor Yellow
try {
    $rateLimitHit = $false
    # Usar un IP falso en X-Forwarded-For para aislar el rate limit
    $rlHeaders = @{ "X-Forwarded-For" = "203.0.113.77" }
    for ($i = 1; $i -le 105; $i++) {
        try {
            $null = Invoke-WebRequest -Uri ("{0}/api/sensores" -f $baseUrl) -Method GET -Headers $rlHeaders -UseBasicParsing -TimeoutSec 2
        } catch {
            if ($_.Exception -and $_.Exception.Response -and $_.Exception.Response.StatusCode -eq 429) {
                $rateLimitHit = $true
                break
            }
        }
    }
    if ($rateLimitHit) {
        Add-TestResult "Rate Limiting" "PASS" "Limite activado despues de ~100 requests"
    } else {
        Add-TestResult "Rate Limiting" "FAIL" "No se activo rate limiting despues de 105 requests"
    }
} catch {
    Add-TestResult "Rate Limiting" "ERROR" $_.Exception.Message
}

Start-Sleep -Seconds 2

# 4) SECURITY HEADERS
Write-Host "\n[4/10] Verificando security headers..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri ("{0}/health" -f $baseUrl) -Method GET -UseBasicParsing
    $headers = $response.Headers
    $requiredHeaders = @(
        "X-Content-Type-Options",
        "X-Frame-Options",
        "X-XSS-Protection",
        "Referrer-Policy"
    )
    $allPresent = $true
    foreach ($h in $requiredHeaders) {
        if ($headers.ContainsKey($h)) {
            Write-Host ("   OK: {0}" -f $h) -ForegroundColor Green
        } else {
            Write-Host ("   FALTA: {0}" -f $h) -ForegroundColor Red
            $allPresent = $false
        }
    }
    if (-not $headers.ContainsKey("X-Powered-By")) {
        Write-Host "   OK: X-Powered-By removido" -ForegroundColor Green
    } else {
        Write-Host "   FALTA: X-Powered-By debe estar oculto" -ForegroundColor Red
        $allPresent = $false
    }
    if ($allPresent) {
        Add-TestResult "Security Headers" "PASS" "Headers requeridos presentes"
    } else {
        Add-TestResult "Security Headers" "FAIL" "Headers faltantes o inseguros"
    }
} catch {
    Add-TestResult "Security Headers" "ERROR" $_.Exception.Message
}

# 5) XSS PROTECTION
Write-Host "\n[5/10] Probando proteccion XSS..." -ForegroundColor Yellow
try {
    $xssPayload = '<script>alert("xss")</script>'
    $encodedPayload = [System.Web.HttpUtility]::UrlEncode($xssPayload)
    try {
        $null = Invoke-WebRequest -Uri ("{0}/api/sensores?cultivo={1}" -f $baseUrl, $encodedPayload) -Method GET -UseBasicParsing -TimeoutSec 5
        Add-TestResult "XSS Protection" "FAIL" "XSS payload fue aceptado"
    } catch {
        if ($_.Exception -and $_.Exception.Response -and $_.Exception.Response.StatusCode -eq 400) {
            Add-TestResult "XSS Protection" "PASS" "XSS payload bloqueado (400)"
        } else {
            $code = if ($_.Exception -and $_.Exception.Response) { $_.Exception.Response.StatusCode } else { "N/A" }
            Add-TestResult "XSS Protection" "WARN" ("Respuesta inesperada: {0}" -f $code)
        }
    }
} catch {
    Add-TestResult "XSS Protection" "ERROR" $_.Exception.Message
}

# 6) SQL INJECTION PROTECTION
Write-Host "\n[6/10] Probando proteccion SQL Injection..." -ForegroundColor Yellow
try {
    $sqlPayload = "' OR '1'='1"
    $encodedPayload = [System.Web.HttpUtility]::UrlEncode($sqlPayload)
    # Usar otra IP de prueba para evitar interferencia con rate limit
    $sqliHeaders = @{ "X-Forwarded-For" = "198.51.100.77" }
    try {
        $null = Invoke-WebRequest -Uri ("{0}/api/sensores?cultivo={1}" -f $baseUrl, $encodedPayload) -Method GET -Headers $sqliHeaders -UseBasicParsing -TimeoutSec 5
        Add-TestResult "SQL Injection Protection" "FAIL" "SQL payload aceptado"
    } catch {
        if ($_.Exception -and $_.Exception.Response -and $_.Exception.Response.StatusCode -eq 400) {
            Add-TestResult "SQL Injection Protection" "PASS" "SQL injection bloqueado (400)"
        } else {
            $code = if ($_.Exception -and $_.Exception.Response) { $_.Exception.Response.StatusCode } else { "N/A" }
            Add-TestResult "SQL Injection Protection" "WARN" ("Respuesta: {0}" -f $code)
        }
    }
} catch {
    Add-TestResult "SQL Injection Protection" "ERROR" $_.Exception.Message
}

# 7) PATH TRAVERSAL PROTECTION
Write-Host "\n[7/10] Probando proteccion Path Traversal..." -ForegroundColor Yellow
try {
    $pathPayload = "../../../etc/passwd"
    $encodedPayload = [System.Web.HttpUtility]::UrlEncode($pathPayload)
    try {
        $null = Invoke-WebRequest -Uri ("{0}/api/sensores?file={1}" -f $baseUrl, $encodedPayload) -Method GET -UseBasicParsing -TimeoutSec 5
        Add-TestResult "Path Traversal Protection" "FAIL" "Path traversal aceptado"
    } catch {
        if ($_.Exception -and $_.Exception.Response -and $_.Exception.Response.StatusCode -eq 400) {
            Add-TestResult "Path Traversal Protection" "PASS" "Path traversal bloqueado (400)"
        } else {
            $code = if ($_.Exception -and $_.Exception.Response) { $_.Exception.Response.StatusCode } else { "N/A" }
            Add-TestResult "Path Traversal Protection" "WARN" ("Respuesta: {0}" -f $code)
        }
    }
} catch {
    Add-TestResult "Path Traversal Protection" "ERROR" $_.Exception.Message
}

# 8) ENVIRONMENT VARIABLES
Write-Host "\n[8/10] Verificando configuracion de seguridad..." -ForegroundColor Yellow

# Buscar .env en backend/.env y en raiz .env; tomar el primero que contenga las variables
$envFiles = @("backend\\.env", ".env")
$envContent = ""
$foundAny = $false
foreach ($path in $envFiles) {
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        if ($content) {
            $envContent += "`n" + $content
            $foundAny = $true
            Write-Host ("   Detectado archivo: {0}" -f $path) -ForegroundColor Gray
        }
    }
}

if ($foundAny) {
    $criticalVars = @("SESSION_SECRET", "CSRF_SECRET", "MONGO_URI|MONGODB_URI")
    $allSet = $true
    foreach ($var in $criticalVars) {
        $pattern = $var
        if ($envContent -match ("(?m)^(" + $pattern + ")=.+")) {
            Write-Host ("   OK: {0} configurado" -f $var) -ForegroundColor Green
        } else {
            Write-Host ("   FALTA: {0} no configurado" -f $var) -ForegroundColor Red
            $allSet = $false
        }
    }
    if ($envContent -match "CHANGE_ME|fallback-secret|temp-dev-secret") {
        Write-Host "   ADVERTENCIA: Detectados valores por defecto" -ForegroundColor Yellow
        $allSet = $false
    }
    if ($allSet) {
        Add-TestResult "Environment Variables" "PASS" "Variables criticas configuradas"
    } else {
        Add-TestResult "Environment Variables" "WARN" "Variables faltantes o inseguras"
    }
} else {
    Add-TestResult "Environment Variables" "FAIL" ".env no encontrado (copiar de .env.example)"
}
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -match "\.env") {
        Write-Host "   OK: .env en .gitignore" -ForegroundColor Green
    } else {
        Write-Host "   ADVERTENCIA: .env NO esta en .gitignore" -ForegroundColor Yellow
    }
}

# 9) CONTENT SECURITY POLICY
Write-Host "\n[9/10] Verificando Content Security Policy..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri ("{0}/health" -f $baseUrl) -Method GET -UseBasicParsing
    $cspHeader = $response.Headers["Content-Security-Policy"]
    if ($cspHeader) {
        Write-Host "   OK: CSP Header presente" -ForegroundColor Green
        $requiredDirectives = @("default-src", "script-src", "style-src", "img-src")
        $allPresent = $true
        foreach ($directive in $requiredDirectives) {
            if ($cspHeader -match $directive) {
                Write-Host ("   OK: {0} configurado" -f $directive) -ForegroundColor Green
            } else {
                Write-Host ("   FALTA: {0}" -f $directive) -ForegroundColor Red
                $allPresent = $false
            }
        }
        if ($allPresent) {
            Add-TestResult "Content Security Policy" "PASS" "CSP configurado correctamente"
        } else {
            Add-TestResult "Content Security Policy" "WARN" "CSP incompleto"
        }
    } else {
        Add-TestResult "Content Security Policy" "FAIL" "CSP Header no encontrado"
    }
} catch {
    Add-TestResult "Content Security Policy" "ERROR" $_.Exception.Message
}

# 10) CORS CONFIGURATION
Write-Host "\n[10/10] Verificando configuracion CORS..." -ForegroundColor Yellow
try {
    $headers = @{ "Origin" = "http://malicious-site.com" }
    try {
        $response = Invoke-WebRequest -Uri ("{0}/api/sensores" -f $baseUrl) -Method GET -Headers $headers -UseBasicParsing -TimeoutSec 5
        if ($response.Headers -and $response.Headers["Access-Control-Allow-Origin"] -eq "http://malicious-site.com") {
            Add-TestResult "CORS Configuration" "FAIL" "CORS acepta origen no autorizado"
        } else {
            Add-TestResult "CORS Configuration" "PASS" "CORS configurado correctamente"
        }
    } catch {
        Add-TestResult "CORS Configuration" "PASS" "Origen no autorizado rechazado"
    }
} catch {
    Add-TestResult "CORS Configuration" "ERROR" $_.Exception.Message
}

# RESUMEN FINAL
Write-Host "\n==================== RESUMEN DE PRUEBAS ====================" -ForegroundColor Cyan
$passed   = ($script:testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failed   = ($script:testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$warnings = ($script:testResults | Where-Object { $_.Status -eq "WARN" }).Count
$errors   = ($script:testResults | Where-Object { $_.Status -eq "ERROR" }).Count
$total    = $script:testResults.Count
Write-Host ("Total de pruebas: {0}" -f $total) -ForegroundColor White
Write-Host ("Pasadas: {0}" -f $passed) -ForegroundColor Green
Write-Host ("Fallidas: {0}" -f $failed) -ForegroundColor Red
Write-Host ("Advertencias: {0}" -f $warnings) -ForegroundColor Yellow
Write-Host ("Errores: {0}" -f $errors) -ForegroundColor Magenta
$percentage = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 2) } else { 0 }
$color = if ($percentage -ge 80) { "Green" } elseif ($percentage -ge 60) { "Yellow" } else { "Red" }
Write-Host ("Porcentaje de exito: {0}%" -f $percentage) -ForegroundColor $color

if ($failed -gt 0 -or $errors -gt 0) {
    Write-Host "\nPRUEBAS QUE NECESITAN ATENCION:" -ForegroundColor Yellow
    $testResults | Where-Object { $_.Status -eq "FAIL" -or $_.Status -eq "ERROR" } | ForEach-Object {
        Write-Host (" - {0}: {1}" -f $_.Test, $_.Details) -ForegroundColor Red
    }
}

Write-Host "\n" 
