# Plan de Pruebas - AgroSens

## 📋 Información del Documento

**Proyecto:** AgroSens - Sistema de Monitoreo Agrícola Inteligente  
**Versión:** 1.0  
**Fecha:** Noviembre 2025  
**Responsable:** Equipo de Desarrollo AgroSens

---

## 1. Introducción

### 1.1 Propósito
Este documento establece el plan de pruebas integral para el sistema AgroSens, definiendo estrategias, tipos de pruebas, recursos necesarios y criterios de aceptación para garantizar la calidad del software.

### 1.2 Alcance
El plan cubre todas las funcionalidades del sistema AgroSens:
- Backend (API REST en Node.js/Express)
- Frontend (React con Vite)
- Sistema de Machine Learning (TensorFlow)
- Integración con sensores IoT
- Seguridad y protección de datos
- Rendimiento y escalabilidad

### 1.3 Objetivos
- Validar funcionalidad completa del sistema
- Garantizar seguridad y protección contra vulnerabilidades
- Verificar rendimiento bajo carga
- Asegurar compatibilidad cross-browser y dispositivos
- Confirmar precisión del modelo de IA
- Validar integridad de datos

---

## 2. Estrategia de Pruebas

### 2.1 Niveles de Pruebas

#### **Pruebas Unitarias**
- **Cobertura objetivo:** ≥ 70%
- **Herramientas:** Jest, Mocha, PyTest
- **Responsable:** Desarrolladores
- **Frecuencia:** Continua (cada commit)

#### **Pruebas de Integración**
- **Cobertura objetivo:** ≥ 60%
- **Herramientas:** Supertest, Jest
- **Responsable:** Equipo QA + Desarrolladores
- **Frecuencia:** Diaria (builds nocturnos)

#### **Pruebas de Sistema**
- **Cobertura objetivo:** 100% casos de uso críticos
- **Herramientas:** Cypress, Playwright
- **Responsable:** Equipo QA
- **Frecuencia:** Semanal + Pre-release

#### **Pruebas de Aceptación**
- **Cobertura objetivo:** 100% requisitos funcionales
- **Herramientas:** Pruebas manuales guiadas
- **Responsable:** Product Owner + Usuarios finales
- **Frecuencia:** Cada sprint + Pre-release

---

## 3. Tipos de Pruebas

### 3.1 Pruebas Funcionales

#### **Módulo: Gestión de Cultivos**
| ID | Caso de Prueba | Prioridad | Estado |
|----|----------------|-----------|--------|
| TC-001 | Crear nuevo cultivo | Alta | - |
| TC-002 | Editar cultivo existente | Alta | - |
| TC-003 | Eliminar cultivo | Media | - |
| TC-004 | Buscar cultivos por filtros | Media | - |
| TC-005 | Visualizar historial de cultivo | Alta | - |

#### **Módulo: Sensores IoT**
| ID | Caso de Prueba | Prioridad | Estado |
|----|----------------|-----------|--------|
| TC-006 | Recibir lectura de sensor (pH) | Crítica | - |
| TC-007 | Recibir lectura de sensor (humedad) | Crítica | - |
| TC-008 | Recibir lectura de sensor (temperatura) | Crítica | - |
| TC-009 | Validar rango de datos de sensor | Alta | - |
| TC-010 | Almacenar datos de telemetría | Alta | - |
| TC-011 | Recuperar última lectura | Alta | - |

#### **Módulo: Análisis con IA**
| ID | Caso de Prueba | Prioridad | Estado |
|----|----------------|-----------|--------|
| TC-012 | Subir imagen para análisis | Crítica | - |
| TC-013 | Clasificar enfermedad de planta | Crítica | - |
| TC-014 | Generar recomendaciones | Alta | - |
| TC-015 | Validar formato de imagen | Alta | - |
| TC-016 | Manejo de imagen corrupta | Media | - |
| TC-017 | Precisión del modelo (≥85%) | Crítica | - |

#### **Módulo: Alertas**
| ID | Caso de Prueba | Prioridad | Estado |
|----|----------------|-----------|--------|
| TC-018 | Generar alerta por valor crítico | Crítica | - |
| TC-019 | Notificar usuario de alerta | Alta | - |
| TC-020 | Marcar alerta como leída | Media | - |
| TC-021 | Filtrar alertas por tipo | Media | - |

#### **Módulo: Clima**
| ID | Caso de Prueba | Prioridad | Estado |
|----|----------------|-----------|--------|
| TC-022 | Obtener datos meteorológicos | Alta | - |
| TC-023 | Validar coordenadas GPS | Alta | - |
| TC-024 | Manejo de API externa caída | Media | - |
| TC-025 | Cache de datos meteorológicos | Baja | - |

#### **Módulo: Usuarios**
| ID | Caso de Prueba | Prioridad | Estado |
|----|----------------|-----------|--------|
| TC-026 | Registrar nuevo usuario | Alta | - |
| TC-027 | Iniciar sesión | Crítica | - |
| TC-028 | Cerrar sesión | Media | - |
| TC-029 | Recuperar contraseña | Media | - |
| TC-030 | Actualizar perfil de usuario | Baja | - |

---

### 3.2 Pruebas de Seguridad

#### **Vulnerabilidades OWASP Top 10**
| ID | Prueba de Seguridad | Severidad | Método |
|----|---------------------|-----------|--------|
| TS-001 | Inyección SQL/NoSQL | Crítica | Prueba automatizada + Manual |
| TS-002 | Cross-Site Scripting (XSS) | Crítica | Prueba automatizada |
| TS-003 | Cross-Site Request Forgery (CSRF) | Alta | Validación de tokens |
| TS-004 | Exposición de datos sensibles | Crítica | Auditoría de logs y respuestas |
| TS-005 | Control de acceso roto | Alta | Pruebas de autorización |
| TS-006 | Configuración incorrecta | Media | Revisión de configuración |
| TS-007 | Deserialización insegura | Media | Análisis de payloads |
| TS-008 | Componentes vulnerables | Alta | Escaneo de dependencias |
| TS-009 | Registro y monitoreo insuficiente | Baja | Revisión de logs |
| TS-010 | Server-Side Request Forgery (SSRF) | Alta | Validación de URLs externas |

#### **Pruebas de Autenticación y Autorización**
| ID | Caso de Prueba | Criterio de Aceptación |
|----|----------------|------------------------|
| TS-011 | Fuerza bruta de contraseñas | Rate limiting bloquea después de 5 intentos |
| TS-012 | Sesiones concurrentes | Límite configurable por usuario |
| TS-013 | Timeout de sesión | Sesión expira después de 24h de inactividad |
| TS-014 | Token CSRF válido | Rechazo de peticiones sin token válido |
| TS-015 | Headers de seguridad | Todos los headers requeridos presentes |

#### **Pruebas de Entrada de Datos**
| ID | Caso de Prueba | Vector de Ataque |
|----|----------------|------------------|
| TS-016 | Validación de pH | Valores fuera de rango 0-14 |
| TS-017 | Validación de humedad | Valores fuera de rango 0-100% |
| TS-018 | Validación de temperatura | Valores fuera de rango -50 a 100°C |
| TS-019 | Path Traversal en uploads | `../../../etc/passwd` |
| TS-020 | Polyglot file upload | Archivo con múltiples extensiones |

#### **Script de Pruebas Automatizadas**
- **Herramienta:** `test-security.ps1` (PowerShell) / `test-security.sh` (Bash)
- **Ejecución:** `.\test-security.ps1`
- **Cobertura:** 10 categorías de seguridad
- **Criterio de éxito:** ≥ 80% PASS

---

### 3.3 Pruebas de Rendimiento

#### **Pruebas de Carga**
| Escenario | Usuarios Concurrentes | Duración | Métrica Objetivo |
|-----------|----------------------|----------|------------------|
| Lectura de sensores | 100 | 10 min | Latencia p95 < 200ms |
| Análisis de IA | 20 | 5 min | Latencia p95 < 3s |
| Consulta de cultivos | 200 | 15 min | Latencia p95 < 150ms |
| API meteorológica | 50 | 10 min | Latencia p95 < 500ms |

#### **Pruebas de Estrés**
- **Objetivo:** Determinar punto de quiebre del sistema
- **Método:** Incremento gradual de usuarios hasta fallo
- **Herramientas:** Apache JMeter, k6
- **Criterio:** Sistema debe degradarse gracefully

#### **Pruebas de Estabilidad**
- **Duración:** 24 horas continuas
- **Carga:** 50% de capacidad máxima
- **Objetivo:** Sin memory leaks, conexiones abiertas o degradación

#### **Pruebas de Picos**
- **Patrón:** Carga normal → Pico 10x → Carga normal
- **Duración del pico:** 2 minutos
- **Criterio:** Recuperación < 5 minutos

---

### 3.4 Pruebas de Compatibilidad

#### **Navegadores Web**
| Navegador | Versión | Desktop | Mobile | Estado |
|-----------|---------|---------|--------|--------|
| Chrome | Latest | ✓ | ✓ | - |
| Firefox | Latest | ✓ | ✓ | - |
| Safari | Latest | ✓ | ✓ | - |
| Edge | Latest | ✓ | - | - |

#### **Dispositivos Móviles**
| Dispositivo | OS | Resolución | Estado |
|-------------|----|-----------:|--------|
| iPhone 12+ | iOS 15+ | 390x844 | - |
| Samsung Galaxy | Android 11+ | 360x800 | - |
| iPad | iOS 15+ | 768x1024 | - |

#### **Resoluciones de Pantalla**
- Mobile: 360x640, 375x667, 414x896
- Tablet: 768x1024, 820x1180
- Desktop: 1366x768, 1920x1080, 2560x1440

---

### 3.5 Pruebas de Machine Learning

#### **Validación del Modelo**
| Métrica | Objetivo | Método de Medición |
|---------|----------|--------------------|
| Accuracy | ≥ 85% | Dataset de validación |
| Precisión | ≥ 80% | Por clase de enfermedad |
| Recall | ≥ 80% | Por clase de enfermedad |
| F1-Score | ≥ 80% | Promedio ponderado |
| Inference Time | < 2s | Imagen 224x224 |

#### **Casos de Prueba de IA**
| ID | Caso de Prueba | Dataset | Resultado Esperado |
|----|----------------|---------|-------------------|
| TML-001 | Clasificación de hoja sana | PlantVillage | Clase "Healthy" con ≥90% confianza |
| TML-002 | Detección de mildiu | PlantVillage | Clase correcta con ≥85% confianza |
| TML-003 | Imagen borrosa/oscura | Sintético | Confianza baja (<60%) o rechazo |
| TML-004 | Imagen sin planta | Sintético | Rechazo o "Unknown" |
| TML-005 | Batch de 10 imágenes | PlantVillage | Consistencia en clasificación |

#### **Pruebas de Sesgo del Modelo**
- Validar performance equitativa entre especies de plantas
- Verificar resultados con diferentes condiciones de iluminación
- Probar con imágenes de diferentes fuentes (no solo PlantVillage)

---

### 3.6 Pruebas de Usabilidad

#### **Criterios de Evaluación**
| Criterio | Método | Meta |
|----------|--------|------|
| Facilidad de aprendizaje | Time-to-first-task | < 5 minutos |
| Eficiencia | Task completion time | < 2 min para tareas comunes |
| Tasa de error | Error rate | < 5% |
| Satisfacción | SUS Score | ≥ 70 |
| Accesibilidad | WCAG 2.1 AA | 100% cumplimiento |

#### **Tareas de Usuario**
1. Registrar un nuevo cultivo
2. Capturar y analizar imagen de planta
3. Ver lecturas de sensores en tiempo real
4. Responder a una alerta
5. Consultar recomendaciones históricas

---

### 3.7 Pruebas de Instalación/Despliegue

| ID | Escenario | Plataforma | Criterio de Éxito |
|----|-----------|------------|-------------------|
| TD-001 | Instalación limpia | Windows 10/11 | Sin errores, todos los servicios arriba |
| TD-002 | Instalación limpia | Ubuntu 20.04/22.04 | Sin errores, todos los servicios arriba |
| TD-003 | Instalación limpia | macOS 12+ | Sin errores, todos los servicios arriba |
| TD-004 | Actualización de versión | Todas | Datos preservados, sin downtime |
| TD-005 | Configuración de .env | Todas | Variables requeridas documentadas |
| TD-006 | Conexión a MongoDB | Todas | Atlas + Local funcionan |
| TD-007 | Carga de modelos TF.js | Todas | Modelos se sirven correctamente |

---

## 4. Gestión de Datos de Prueba

### 4.1 Datos de Prueba Requeridos

#### **Usuarios**
- 5 usuarios de prueba con diferentes roles
- Credenciales válidas e inválidas
- Usuarios con/sin cultivos asignados

#### **Cultivos**
- 10 cultivos de diferentes tipos (tomate, lechuga, maíz, etc.)
- Estados: activos, cosechados, en alerta
- Con/sin datos de sensores asociados

#### **Sensores**
- Lecturas simuladas en rangos normales
- Lecturas con valores límite
- Lecturas con valores inválidos

#### **Imágenes de Plantas**
- 50 imágenes del dataset PlantVillage
- 20 imágenes de calidad variable (borrosas, oscuras)
- 10 imágenes no válidas (sin plantas, corruptas)

### 4.2 Gestión de Ambientes

| Ambiente | Propósito | Datos | Acceso |
|----------|-----------|-------|--------|
| Desarrollo (DEV) | Desarrollo diario | Mock/Sintético | Desarrolladores |
| Pruebas (QA) | Testing funcional | Sintético + Dataset | QA + Dev |
| Staging (STG) | Pre-producción | Copia de PROD | QA + PO |
| Producción (PROD) | Usuarios finales | Real | Usuarios |

---

## 5. Criterios de Entrada y Salida

### 5.1 Criterios de Entrada
- [ ] Código completo para la funcionalidad
- [ ] Revisión de código aprobada
- [ ] Documentación técnica actualizada
- [ ] Datos de prueba preparados
- [ ] Ambiente de pruebas disponible
- [ ] Build exitoso sin errores de compilación

### 5.2 Criterios de Salida
- [ ] Ejecución de todos los casos de prueba planificados
- [ ] ≥ 95% de casos críticos PASS
- [ ] ≥ 90% de casos alta prioridad PASS
- [ ] 0 defectos críticos abiertos
- [ ] ≤ 3 defectos alta prioridad abiertos (con plan de remediación)
- [ ] Pruebas de seguridad ≥ 80% PASS
- [ ] Métricas de rendimiento dentro de objetivos
- [ ] Documentación de defectos completa

---

## 6. Gestión de Defectos

### 6.1 Clasificación de Severidad

| Nivel | Descripción | Ejemplo | SLA |
|-------|-------------|---------|-----|
| **Crítico** | Sistema no funciona, pérdida de datos | DB down, IA no responde | 4 horas |
| **Alto** | Funcionalidad principal afectada | No se pueden crear cultivos | 24 horas |
| **Medio** | Funcionalidad secundaria afectada | Filtro de búsqueda no funciona | 3 días |
| **Bajo** | Problema cosmético, UX menor | Alineación de texto | 1 semana |

### 6.2 Proceso de Reporte
1. Documentar en sistema de tracking (GitHub Issues / Jira)
2. Incluir: pasos de reproducción, evidencia (screenshots/logs), ambiente
3. Asignar severidad y prioridad
4. Notificar a equipo de desarrollo
5. Seguimiento hasta resolución
6. Verificación de fix en ambiente QA

### 6.3 Métricas de Defectos
- **Defect Density:** Defectos / KLOC
- **Defect Removal Efficiency:** (Defectos encontrados pre-release) / (Total defectos)
- **Defect Leakage:** Defectos encontrados en PROD
- **Mean Time to Resolve (MTTR):** Tiempo promedio de resolución

---

## 7. Recursos Necesarios

### 7.1 Equipo
| Rol | Cantidad | Responsabilidad |
|-----|----------|-----------------|
| QA Lead | 1 | Planificación, coordinación, reporte |
| QA Engineer | 2 | Ejecución de pruebas, automatización |
| Desarrollador (soporte) | 2 | Fixes, soporte técnico |
| Product Owner | 1 | Validación de aceptación |

### 7.2 Infraestructura
- Servidor de pruebas (4 cores, 8GB RAM)
- Base de datos MongoDB de pruebas
- Navegadores: Chrome, Firefox, Safari, Edge (últimas 2 versiones)
- Dispositivos móviles físicos (iOS, Android)
- Herramientas de pruebas de carga (JMeter, k6)

### 7.3 Herramientas

| Categoría | Herramienta | Propósito |
|-----------|-------------|-----------|
| Testing Framework | Jest, Mocha, PyTest | Pruebas unitarias |
| E2E Testing | Cypress, Playwright | Pruebas end-to-end |
| API Testing | Supertest, Postman | Pruebas de API |
| Security Testing | OWASP ZAP, Burp Suite | Pruebas de seguridad |
| Performance | JMeter, k6 | Carga y rendimiento |
| Tracking | GitHub Issues, Jira | Gestión de defectos |
| CI/CD | GitHub Actions | Automatización |

---

## 8. Cronograma

### 8.1 Fases del Proyecto

| Fase | Duración | Actividades Principales |
|------|----------|-------------------------|
| **Preparación** | Semana 1 | Setup ambientes, datos de prueba, scripts |
| **Pruebas Unitarias** | Continuo | Ejecución automática en cada commit |
| **Pruebas de Integración** | Semanas 2-3 | API endpoints, flujos backend |
| **Pruebas de Sistema** | Semanas 3-4 | End-to-end, cross-browser |
| **Pruebas de Seguridad** | Semana 4 | Escaneo automatizado + manual |
| **Pruebas de Rendimiento** | Semana 5 | Carga, estrés, estabilidad |
| **Pruebas de Aceptación** | Semana 6 | Validación con usuarios |
| **Regresión Final** | Semana 7 | Suite completa pre-release |

### 8.2 Hitos
- **Semana 2:** Pruebas de humo completas (Smoke Test Suite)
- **Semana 4:** Todas las pruebas funcionales críticas PASS
- **Semana 5:** Seguridad validada (≥80% PASS)
- **Semana 6:** Rendimiento validado
- **Semana 7:** Go/No-Go para producción

---

## 9. Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Estrategia de Mitigación |
|--------|--------------|---------|--------------------------|
| API externa (clima) no disponible | Media | Alto | Implementar fallback con datos mock |
| Modelo de IA con baja precisión | Baja | Crítico | Re-entrenamiento con más datos, ajuste hiperparámetros |
| Datos de sensores inconsistentes | Alta | Medio | Validación estricta en backend, alertas |
| Rate limiting muy estricto | Media | Medio | Configuración ajustable por ambiente |
| MongoDB Atlas con latencia alta | Baja | Alto | Conexión local para testing, optimización de queries |
| Equipo QA insuficiente | Media | Alto | Automatización agresiva, priorización |

---

## 10. Entregables

### 10.1 Documentos
- [x] Plan de Pruebas (este documento)
- [ ] Casos de Prueba detallados (Test Cases)
- [ ] Scripts de prueba automatizados
- [ ] Reporte de ejecución de pruebas
- [ ] Reporte de defectos
- [ ] Matriz de trazabilidad (Requisitos ↔ Casos de Prueba)

### 10.2 Artefactos
- [ ] Suite de pruebas automatizadas (Jest, Cypress)
- [ ] Scripts de seguridad (`test-security.ps1`, `test-security.sh`)
- [ ] Scripts de carga (JMeter/k6)
- [ ] Dataset de pruebas (imágenes, datos de sensores)
- [ ] Configuraciones de ambientes (.env templates)

---

## 11. Métricas y KPIs

### 11.1 Cobertura de Pruebas
- **Code Coverage:** ≥ 70%
- **Requirement Coverage:** 100% (requisitos críticos)
- **Risk Coverage:** 100% (riesgos altos y críticos)

### 11.2 Calidad
- **Pass Rate:** ≥ 95% (casos críticos)
- **Defect Density:** ≤ 5 defectos por KLOC
- **Defect Leakage:** ≤ 2% (defectos en producción)

### 11.3 Eficiencia
- **Test Execution Time:** ≤ 2 horas (suite completa)
- **Automation Rate:** ≥ 60% de casos automatizados
- **MTTR (Mean Time to Resolve):** ≤ 24h (críticos), ≤ 3 días (altos)

### 11.4 Rendimiento
- **API Response Time (p95):** ≤ 200ms
- **IA Inference Time:** ≤ 2s
- **Throughput:** ≥ 100 req/s (lecturas de sensores)
- **Error Rate:** ≤ 0.1%

---

## 12. Aprobaciones

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| QA Lead | | | |
| Project Manager | | | |
| Tech Lead | | | |
| Product Owner | | | |

---

## 13. Referencias

### 13.1 Documentos Relacionados
- `SECURITY_FIXES.md` - Hardening de seguridad implementado
- `TESTING_SECURITY.md` - Guía de ejecución de pruebas de seguridad
- `README.md` - Documentación general del proyecto
- `docs/IA_TRAINING.md` - Entrenamiento del modelo de IA

### 13.2 Estándares y Guías
- OWASP Top 10 (2021)
- WCAG 2.1 Level AA
- ISO/IEC 25010 (Software Quality Model)
- IEEE 829 (Software Test Documentation)

### 13.3 Herramientas y Scripts
- `test-security.ps1` / `test-security.sh` - Script de pruebas de seguridad automatizadas
- `package.json` - Configuración de scripts de prueba
- `.env.example` - Template de configuración

---

## 14. Historial de Cambios

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | Nov 2025 | Equipo AgroSens | Creación inicial del plan |

---

## 15. Anexos

### Anexo A: Checklist de Preparación de Ambiente
```bash
# Backend
cd backend
npm install
cp .env.example .env
# Configurar MONGO_URI, SESSION_SECRET, CSRF_SECRET
npm start

# Frontend
cd frontend
npm install
npm run dev

# Verificar conectividad
curl http://localhost:5000/health
curl http://localhost:3000

# Ejecutar pruebas de seguridad
.\test-security.ps1
```

### Anexo B: Template de Caso de Prueba
```markdown
**ID:** TC-XXX
**Título:** [Nombre descriptivo]
**Módulo:** [Backend/Frontend/IA]
**Prioridad:** [Crítica/Alta/Media/Baja]
**Precondiciones:** 
- [Listar precondiciones]

**Pasos:**
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

**Resultado Esperado:**
[Descripción del resultado esperado]

**Datos de Prueba:**
- Input: [datos]
- Output esperado: [datos]

**Ambiente:** [DEV/QA/STG]
**Estado:** [Pendiente/En progreso/PASS/FAIL]
**Ejecutado por:** [Nombre]
**Fecha:** [DD/MM/YYYY]
**Evidencia:** [Link a screenshot/log]
```

### Anexo C: Comando Rápidos

#### Ejecutar pruebas unitarias
```bash
# Backend
npm test

# Frontend
npm test

# Python (ML)
pytest backend/ml/
```

#### Ejecutar pruebas de seguridad
```powershell
# Windows
.\test-security.ps1

# Linux/Mac
bash test-security.sh
```

#### Ejecutar suite E2E
```bash
cd frontend
npx cypress open
# o headless
npx cypress run
```

#### Generar reporte de cobertura
```bash
npm test -- --coverage
```

---

**Fin del Documento**
