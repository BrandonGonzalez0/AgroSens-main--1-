#!/bin/bash
# ================================================================
# SCRIPT DE PRUEBAS DE SEGURIDAD - AGROSENS (Linux/Mac)
# ================================================================
# Ejecutar: chmod +x test-security.sh && ./test-security.sh
# Requisitos: Servidor backend corriendo en http://localhost:5000
# ================================================================

BASE_URL="http://localhost:5000"
PASSED=0
FAILED=0
WARNINGS=0
ERRORS=0
TOTAL=0

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "\n${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║    PRUEBAS DE SEGURIDAD - AGROSENS                        ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}\n"

# Función para registrar resultados
test_result() {
    local name=$1
    local status=$2
    local details=$3
    
    ((TOTAL++))
    
    case $status in
        PASS)
            ((PASSED++))
            echo -e "✅ ${name} - ${GREEN}${status}${NC}"
            ;;
        FAIL)
            ((FAILED++))
            echo -e "❌ ${name} - ${RED}${status}${NC}"
            ;;
        WARN)
            ((WARNINGS++))
            echo -e "⚠️  ${name} - ${YELLOW}${status}${NC}"
            ;;
        ERROR)
            ((ERRORS++))
            echo -e "🔴 ${name} - ${RED}${status}${NC}"
            ;;
    esac
    
    if [ ! -z "$details" ]; then
        echo -e "   └─ ${details}"
    fi
}

# Verificar que curl esté instalado
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl no está instalado${NC}"
    exit 1
fi

# Verificar servidor
echo -e "${YELLOW}[1/10] Verificando servidor...${NC}"
if curl -s -f -o /dev/null "$BASE_URL/health" --max-time 5; then
    test_result "Servidor activo" "PASS" "Servidor responde correctamente"
else
    test_result "Servidor activo" "FAIL" "No se puede conectar al servidor"
    echo -e "\n${RED}⚠️  El servidor debe estar corriendo en $BASE_URL${NC}"
    echo -e "${YELLOW}   Ejecuta: cd backend && npm start${NC}\n"
    exit 1
fi

# TEST 1: CSRF PROTECTION
echo -e "\n${YELLOW}[2/10] Probando protección CSRF...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/ia" \
    -H "Content-Type: application/json" \
    -d '{"test":"data"}' \
    --max-time 5)

if [ "$HTTP_CODE" = "403" ]; then
    test_result "CSRF Protection" "PASS" "POST sin token rechazado (403)"
elif [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    test_result "CSRF Protection" "FAIL" "POST sin token fue aceptado"
else
    test_result "CSRF Protection" "WARN" "Respuesta inesperada: $HTTP_CODE"
fi

# TEST 2: RATE LIMITING
echo -e "\n${YELLOW}[3/10] Probando rate limiting...${NC}"
echo "   Enviando 105 requests..."

RATE_LIMIT_HIT=false
for i in {1..105}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/sensores" --max-time 2)
    
    if [ "$HTTP_CODE" = "429" ]; then
        RATE_LIMIT_HIT=true
        echo "   Request $i: Rate limit activado ✓"
        break
    fi
    
    if [ $((i % 25)) -eq 0 ]; then
        echo "   Progreso: $i/105 requests..."
    fi
done

if [ "$RATE_LIMIT_HIT" = true ]; then
    test_result "Rate Limiting" "PASS" "Límite activado después de ~100 requests"
else
    test_result "Rate Limiting" "FAIL" "No se activó rate limiting"
fi

sleep 2

# TEST 3: SECURITY HEADERS
echo -e "\n${YELLOW}[4/10] Verificando security headers...${NC}"

HEADERS=$(curl -s -I "$BASE_URL/health")

check_header() {
    if echo "$HEADERS" | grep -qi "$1"; then
        echo -e "   ${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "   ${RED}✗${NC} $1 (faltante)"
        return 1
    fi
}

ALL_PRESENT=true
check_header "X-Content-Type-Options" || ALL_PRESENT=false
check_header "X-Frame-Options" || ALL_PRESENT=false
check_header "X-XSS-Protection" || ALL_PRESENT=false
check_header "Referrer-Policy" || ALL_PRESENT=false

# Verificar que X-Powered-By esté ausente
if echo "$HEADERS" | grep -qi "X-Powered-By"; then
    echo -e "   ${RED}✗${NC} X-Powered-By presente (debería estar oculto)"
    ALL_PRESENT=false
else
    echo -e "   ${GREEN}✓${NC} X-Powered-By removido"
fi

if [ "$ALL_PRESENT" = true ]; then
    test_result "Security Headers" "PASS" "Todos los headers presentes"
else
    test_result "Security Headers" "FAIL" "Algunos headers faltantes"
fi

# TEST 4: XSS PROTECTION
echo -e "\n${YELLOW}[5/10] Probando protección XSS...${NC}"

XSS_PAYLOAD="<script>alert('xss')</script>"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/sensores?cultivo=$XSS_PAYLOAD" --max-time 5)

if [ "$HTTP_CODE" = "400" ]; then
    test_result "XSS Protection" "PASS" "XSS payload bloqueado (400)"
elif [ "$HTTP_CODE" = "200" ]; then
    test_result "XSS Protection" "FAIL" "XSS payload fue aceptado"
else
    test_result "XSS Protection" "WARN" "Respuesta inesperada: $HTTP_CODE"
fi

# TEST 5: SQL INJECTION PROTECTION
echo -e "\n${YELLOW}[6/10] Probando protección SQL Injection...${NC}"

SQL_PAYLOAD="' OR '1'='1"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/sensores?cultivo=$SQL_PAYLOAD" --max-time 5)

if [ "$HTTP_CODE" = "400" ]; then
    test_result "SQL Injection Protection" "PASS" "SQL injection bloqueado (400)"
elif [ "$HTTP_CODE" = "200" ]; then
    test_result "SQL Injection Protection" "FAIL" "SQL payload fue aceptado"
else
    test_result "SQL Injection Protection" "WARN" "Respuesta: $HTTP_CODE"
fi

# TEST 6: PATH TRAVERSAL PROTECTION
echo -e "\n${YELLOW}[7/10] Probando protección Path Traversal...${NC}"

PATH_PAYLOAD="../../../etc/passwd"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/sensores?file=$PATH_PAYLOAD" --max-time 5)

if [ "$HTTP_CODE" = "400" ]; then
    test_result "Path Traversal Protection" "PASS" "Path traversal bloqueado (400)"
elif [ "$HTTP_CODE" = "200" ]; then
    test_result "Path Traversal Protection" "FAIL" "Path traversal no fue bloqueado"
else
    test_result "Path Traversal Protection" "WARN" "Respuesta: $HTTP_CODE"
fi

# TEST 7: ENVIRONMENT VARIABLES
echo -e "\n${YELLOW}[8/10] Verificando configuración de seguridad...${NC}"

if [ -f "backend/.env" ]; then
    echo -e "   ${GREEN}✓${NC} Archivo .env existe"
    
    ALL_SET=true
    for VAR in SESSION_SECRET CSRF_SECRET MONGO_URI; do
        if grep -q "^$VAR=.\\+" backend/.env; then
            echo -e "   ${GREEN}✓${NC} $VAR configurado"
        else
            echo -e "   ${RED}✗${NC} $VAR no configurado"
            ALL_SET=false
        fi
    done
    
    # Verificar valores por defecto inseguros
    if grep -qE "CHANGE_ME|fallback-secret|temp-dev-secret" backend/.env; then
        echo -e "   ${YELLOW}⚠️${NC}  Advertencia: Detectados valores por defecto"
        ALL_SET=false
    fi
    
    if [ "$ALL_SET" = true ]; then
        test_result "Environment Variables" "PASS" "Variables críticas configuradas"
    else
        test_result "Environment Variables" "WARN" "Algunas variables necesitan configuración"
    fi
else
    test_result "Environment Variables" "FAIL" "Archivo .env no existe"
fi

# Verificar .gitignore
if [ -f ".gitignore" ] && grep -q "\.env" .gitignore; then
    echo -e "   ${GREEN}✓${NC} .env en .gitignore"
else
    echo -e "   ${YELLOW}⚠️${NC}  .env NO está en .gitignore"
fi

# TEST 8: CONTENT SECURITY POLICY
echo -e "\n${YELLOW}[9/10] Verificando Content Security Policy...${NC}"

CSP_HEADER=$(curl -s -I "$BASE_URL/health" | grep -i "content-security-policy")

if [ ! -z "$CSP_HEADER" ]; then
    echo -e "   ${GREEN}✓${NC} CSP Header presente"
    
    ALL_PRESENT=true
    for DIRECTIVE in default-src script-src style-src img-src; do
        if echo "$CSP_HEADER" | grep -q "$DIRECTIVE"; then
            echo -e "   ${GREEN}✓${NC} $DIRECTIVE configurado"
        else
            echo -e "   ${RED}✗${NC} $DIRECTIVE faltante"
            ALL_PRESENT=false
        fi
    done
    
    if [ "$ALL_PRESENT" = true ]; then
        test_result "Content Security Policy" "PASS" "CSP configurado correctamente"
    else
        test_result "Content Security Policy" "WARN" "CSP incompleto"
    fi
else
    test_result "Content Security Policy" "FAIL" "CSP Header no encontrado"
fi

# TEST 9: CORS CONFIGURATION
echo -e "\n${YELLOW}[10/10] Verificando configuración CORS...${NC}"

CORS_HEADER=$(curl -s -I -H "Origin: http://malicious-site.com" "$BASE_URL/api/sensores" | grep -i "access-control-allow-origin")

if echo "$CORS_HEADER" | grep -q "malicious-site.com"; then
    test_result "CORS Configuration" "FAIL" "CORS acepta cualquier origen"
else
    test_result "CORS Configuration" "PASS" "CORS configurado correctamente"
fi

# RESUMEN FINAL
echo -e "\n\n${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    RESUMEN DE PRUEBAS                      ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}\n"

echo -e "Total de pruebas: ${TOTAL}"
echo -e "${GREEN}✅ Pasadas:       ${PASSED}${NC}"
echo -e "${RED}❌ Fallidas:      ${FAILED}${NC}"
echo -e "${YELLOW}⚠️  Advertencias:  ${WARNINGS}${NC}"
echo -e "${RED}🔴 Errores:       ${ERRORS}${NC}"

PERCENTAGE=$(awk "BEGIN {printf \"%.2f\", ($PASSED / $TOTAL) * 100}")
COLOR=$GREEN
if (( $(echo "$PERCENTAGE < 60" | bc -l) )); then
    COLOR=$RED
elif (( $(echo "$PERCENTAGE < 80" | bc -l) )); then
    COLOR=$YELLOW
fi

echo -e "\nPorcentaje de éxito: ${COLOR}${PERCENTAGE}%${NC}"

# Recomendaciones
echo -e "\n${CYAN}📋 RECOMENDACIONES:${NC}"
if [ $FAILED -gt 0 ] || [ $WARNINGS -gt 0 ]; then
    echo -e "   ${YELLOW}1. Revisar archivo .env y configurar todas las variables${NC}"
    echo -e "   ${YELLOW}2. Asegurar que el servidor tenga todas las dependencias instaladas${NC}"
    echo -e "   ${YELLOW}3. Revisar logs del servidor para más detalles${NC}"
fi

if (( $(echo "$PERCENTAGE >= 80" | bc -l) )); then
    echo -e "   ${GREEN}✅ El sistema tiene una buena configuración de seguridad${NC}"
elif (( $(echo "$PERCENTAGE >= 60" | bc -l) )); then
    echo -e "   ${YELLOW}⚠️  El sistema necesita mejoras en seguridad${NC}"
else
    echo -e "   ${RED}🔴 El sistema necesita atención urgente en seguridad${NC}"
fi

echo ""
