# 🧪 Guía de Pruebas de Seguridad - AgroSens

Esta guía te ayudará a verificar todas las correcciones de seguridad implementadas.

---

## 📋 Preparación

### 1. Iniciar el servidor backend

```bash
# Opción 1: Desde la raíz del proyecto
npm run dev

# Opción 2: Desde el directorio backend
cd backend
npm start
```

**Asegúrate de que el servidor esté corriendo en:** `http://localhost:5000`

### 2. Verificar que .env esté configurado

```bash
# Copiar plantilla si no existe
cp .env.example backend/.env

# Editar con tus valores
# Mínimo requerido:
# - SESSION_SECRET=<64-byte-hex>
# - CSRF_SECRET=<32-byte-hex>
# - MONGO_URI=mongodb://localhost:27017/agrosens
```

---

## 🤖 Pruebas Automáticas

### Opción 1: Windows (PowerShell)

```powershell
# Dar permisos de ejecución (primera vez)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Ejecutar pruebas
.\test-security.ps1
```

### Opción 2: Linux/Mac (Bash)

```bash
# Dar permisos de ejecución
chmod +x test-security.sh

# Ejecutar pruebas
./test-security.sh
```

**Resultado esperado:**
```
╔═══════════════════════════════════════════════════════════╗
║    PRUEBAS DE SEGURIDAD - AGROSENS                        ║
╚═══════════════════════════════════════════════════════════╝

✅ Servidor activo - PASS
✅ CSRF Protection - PASS
✅ Rate Limiting - PASS
✅ Security Headers - PASS
✅ XSS Protection - PASS
✅ SQL Injection Protection - PASS
✅ Path Traversal Protection - PASS
✅ Environment Variables - PASS
✅ Content Security Policy - PASS
✅ CORS Configuration - PASS

Total de pruebas: 10
✅ Pasadas: 10
❌ Fallidas: 0

Porcentaje de éxito: 100%
```

---

## 🔧 Pruebas Manuales

Si prefieres probar manualmente cada funcionalidad:

### 1. Protección CSRF

**Test:** Intentar POST sin token CSRF

```bash
# Con curl (Linux/Mac)
curl -X POST http://localhost:5000/api/ia \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'

# Con PowerShell (Windows)
Invoke-WebRequest -Uri "http://localhost:5000/api/ia" `
  -Method POST `
  -Body '{"test":"data"}' `
  -ContentType "application/json"
```

**Resultado esperado:** `403 Forbidden` o error CSRF

---

### 2. Rate Limiting

**Test:** Hacer muchas peticiones rápidas

```bash
# Linux/Mac
for i in {1..105}; do
  curl -s http://localhost:5000/api/sensores > /dev/null
  echo "Request $i"
done

# Windows PowerShell
1..105 | ForEach-Object {
  Invoke-WebRequest "http://localhost:5000/api/sensores" -UseBasicParsing
  Write-Host "Request $_"
}
```

**Resultado esperado:** Después de ~100 requests, deberías recibir `429 Too Many Requests`

---

### 3. Security Headers

**Test:** Verificar headers de seguridad

```bash
# Linux/Mac
curl -I http://localhost:5000/health

# Windows PowerShell
(Invoke-WebRequest "http://localhost:5000/health").Headers
```

**Headers esperados:**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```

**NO debe aparecer:**
```
X-Powered-By: Express
```

---

### 4. Protección XSS

**Test:** Intentar inyectar script

```bash
# Linux/Mac
curl "http://localhost:5000/api/sensores?cultivo=<script>alert('xss')</script>"

# Windows PowerShell
Invoke-WebRequest "http://localhost:5000/api/sensores?cultivo=<script>alert('xss')</script>"
```

**Resultado esperado:** `400 Bad Request` con mensaje "Suspicious input detected"

---

### 5. Protección SQL Injection

**Test:** Intentar SQL injection

```bash
# Linux/Mac
curl "http://localhost:5000/api/sensores?cultivo=' OR '1'='1"

# Windows PowerShell
Invoke-WebRequest "http://localhost:5000/api/sensores?cultivo=' OR '1'='1"
```

**Resultado esperado:** `400 Bad Request` con mensaje "Suspicious input detected"

---

### 6. Path Traversal Protection

**Test:** Intentar acceder a archivos del sistema

```bash
# Linux/Mac
curl "http://localhost:5000/api/sensores?file=../../../etc/passwd"

# Windows PowerShell
Invoke-WebRequest "http://localhost:5000/api/sensores?file=../../../etc/passwd"
```

**Resultado esperado:** `400 Bad Request` con mensaje "Suspicious input detected"

---

### 7. File Upload Validation

**Test:** Intentar subir archivo malicioso

```bash
# Crear archivo de prueba con contenido malicioso
echo '<?php system($_GET["cmd"]); ?>' > malicious.php

# Intentar subir
curl -X POST http://localhost:5000/api/upload \
  -F "file=@malicious.php"
```

**Resultado esperado:** `400 Bad Request` - archivo rechazado por extensión o contenido

---

### 8. CORS Configuration

**Test:** Verificar que CORS rechace orígenes no autorizados

```bash
# Linux/Mac
curl -H "Origin: http://malicious-site.com" \
  http://localhost:5000/api/sensores -I

# Windows PowerShell
$headers = @{ "Origin" = "http://malicious-site.com" }
Invoke-WebRequest "http://localhost:5000/api/sensores" -Headers $headers
```

**Resultado esperado:** No debe incluir `Access-Control-Allow-Origin: http://malicious-site.com`

---

### 9. Environment Variables

**Test:** Verificar configuración

```bash
# Verificar que .env existe y tiene valores
cat backend/.env | grep SESSION_SECRET
cat backend/.env | grep CSRF_SECRET

# Verificar que .env NO está en git
git status | grep .env
# No debe aparecer nada
```

**Resultado esperado:** 
- ✅ Variables configuradas con valores reales
- ✅ .env NO aparece en `git status`

---

### 10. Content Security Policy

**Test:** Verificar CSP en navegador

1. Abre el navegador en `http://localhost:3000`
2. Abre DevTools (F12)
3. Ve a la pestaña "Network"
4. Recarga la página
5. Haz clic en cualquier request
6. Ve a la pestaña "Headers"
7. Busca "Content-Security-Policy"

**CSP esperado:**
```
default-src 'self'; 
script-src 'self' https://cdn.jsdelivr.net; 
style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
img-src 'self' data: blob: https:;
connect-src 'self' https://api.open-meteo.com https://api.weatherapi.com;
```

---

## 🔍 Verificación en Producción

Antes de desplegar a producción, verifica:

### Checklist de Seguridad

- [ ] **SESSION_SECRET** único y seguro (64 bytes)
- [ ] **CSRF_SECRET** único y seguro (32 bytes)
- [ ] **NODE_ENV=production** configurado
- [ ] **HTTPS/TLS** habilitado (certificado válido)
- [ ] **CORS** configurado con dominio de producción
- [ ] **MongoDB** con autenticación habilitada
- [ ] **Rate limiting** activo (verificar con script)
- [ ] **Security headers** presentes (verificar con curl)
- [ ] **File upload** validando correctamente
- [ ] **.env** NO incluido en repositorio Git
- [ ] **Logs de seguridad** monitoreados

### Herramientas Online

Después de desplegar, usa estas herramientas para verificación adicional:

1. **Security Headers:** https://securityheaders.com
   - Ingresa tu URL de producción
   - Debe obtener grado A o A+

2. **SSL Labs:** https://www.ssllabs.com/ssltest/
   - Verifica tu certificado SSL/TLS
   - Debe obtener grado A o A+

3. **Observatory by Mozilla:** https://observatory.mozilla.org
   - Análisis completo de seguridad
   - Debe obtener grado B+ o superior

---

## 📊 Interpretación de Resultados

### Script Automático

| Porcentaje | Estado | Acción Requerida |
|------------|--------|------------------|
| 90-100% | 🟢 Excelente | Mantener configuración |
| 70-89% | 🟡 Bueno | Revisar advertencias |
| 50-69% | 🟠 Regular | Corregir fallos críticos |
| 0-49% | 🔴 Crítico | Configuración urgente necesaria |

### Fallos Comunes

| Error | Causa Probable | Solución |
|-------|---------------|----------|
| CSRF fails | Middleware no aplicado | Verificar `server.js` |
| Rate limiting fails | KeyGenerator faltante | Verificar `security.js` |
| Headers missing | Helmet mal configurado | Verificar `server.js` |
| XSS passes | Input validation off | Verificar `security.js` |
| .env issues | Archivo no configurado | Copiar de `.env.example` |

---

## 🆘 Soporte

Si alguna prueba falla:

1. **Revisa los logs del servidor:**
   ```bash
   # Ver últimos logs
   npm run dev
   # Buscar errores o warnings
   ```

2. **Verifica dependencias:**
   ```bash
   cd backend
   npm install
   ```

3. **Verifica configuración:**
   ```bash
   # Debe existir y tener valores
   cat backend/.env
   ```

4. **Reinicia el servidor:**
   ```bash
   # Ctrl+C para detener
   npm run dev
   ```

5. **Vuelve a ejecutar las pruebas**

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)

---

**✅ Si todas las pruebas pasan, tu aplicación está protegida contra las vulnerabilidades más comunes.**
