#!/bin/bash

# Script de testing completo para el módulo Historial de Trabajos
# Ejecuta tests unitarios, de integración y E2E

echo "🚀 Iniciando suite completa de testing para Historial de Trabajos"
echo "=================================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar dependencias
log_info "Verificando dependencias..."

if ! command -v npm &> /dev/null; then
    log_error "npm no está instalado"
    exit 1
fi

if ! command -v node &> /dev/null; then
    log_error "Node.js no está instalado"
    exit 1
fi

# Variables de configuración
MODULE_PATH="src/modules/historial-trabajos"
TEST_OUTPUT_DIR="test-results"
COVERAGE_DIR="coverage"

# Crear directorio de resultados
mkdir -p $TEST_OUTPUT_DIR
mkdir -p $COVERAGE_DIR

log_info "Directorio del módulo: $MODULE_PATH"
log_info "Directorio de resultados: $TEST_OUTPUT_DIR"

# Función para ejecutar tests unitarios
run_unit_tests() {
    log_info "🧪 Ejecutando tests unitarios..."
    
    # Jest con coverage
    npm test -- \
        --testPathPattern="$MODULE_PATH" \
        --coverage \
        --coverageDirectory="$COVERAGE_DIR" \
        --coverageReporters=text,lcov,html \
        --watchAll=false \
        --ci \
        --silent \
        --outputFile="$TEST_OUTPUT_DIR/unit-tests.json" 2>&1
    
    if [ $? -eq 0 ]; then
        log_info "✅ Tests unitarios completados exitosamente"
        return 0
    else
        log_error "❌ Tests unitarios fallaron"
        return 1
    fi
}

# Función para ejecutar tests de componentes
run_component_tests() {
    log_info "🧩 Ejecutando tests de componentes..."
    
    # Jest específicamente para componentes
    npm test -- \
        --testPathPattern="$MODULE_PATH/components" \
        --testNamePattern="Component" \
        --watchAll=false \
        --ci \
        --verbose 2>&1 | tee "$TEST_OUTPUT_DIR/component-tests.log"
    
    if [ $? -eq 0 ]; then
        log_info "✅ Tests de componentes completados exitosamente"
        return 0
    else
        log_error "❌ Tests de componentes fallaron"
        return 1
    fi
}

# Función para ejecutar tests de hooks
run_hook_tests() {
    log_info "🪝 Ejecutando tests de hooks..."
    
    npm test -- \
        --testPathPattern="$MODULE_PATH/hooks" \
        --watchAll=false \
        --ci \
        --verbose 2>&1 | tee "$TEST_OUTPUT_DIR/hook-tests.log"
    
    if [ $? -eq 0 ]; then
        log_info "✅ Tests de hooks completados exitosamente"
        return 0
    else
        log_error "❌ Tests de hooks fallaron"
        return 1
    fi
}

# Función para ejecutar tests E2E
run_e2e_tests() {
    log_info "🌐 Ejecutando tests E2E..."
    
    # Verificar si el servidor está corriendo
    if ! curl -f http://localhost:3000 &> /dev/null; then
        log_warn "Servidor no está corriendo, iniciando..."
        npm start &
        SERVER_PID=$!
        sleep 10
        
        # Verificar nuevamente
        if ! curl -f http://localhost:3000 &> /dev/null; then
            log_error "No se pudo iniciar el servidor"
            return 1
        fi
    fi
    
    # Ejecutar Cypress
    npx cypress run \
        --spec "cypress/e2e/historial-trabajos/**/*" \
        --browser chrome \
        --headless \
        --reporter mochawesome \
        --reporter-options "reportDir=$TEST_OUTPUT_DIR/e2e,overwrite=false,html=true,json=true" 2>&1
    
    local cypress_result=$?
    
    # Terminar servidor si lo iniciamos
    if [ ! -z "$SERVER_PID" ]; then
        log_info "Terminando servidor..."
        kill $SERVER_PID
    fi
    
    if [ $cypress_result -eq 0 ]; then
        log_info "✅ Tests E2E completados exitosamente"
        return 0
    else
        log_error "❌ Tests E2E fallaron"
        return 1
    fi
}

# Función para generar reporte de coverage
generate_coverage_report() {
    log_info "📊 Generando reporte de coverage..."
    
    if [ -d "$COVERAGE_DIR" ]; then
        # Convertir coverage a formatos adicionales
        npx nyc report \
            --temp-dir="$COVERAGE_DIR" \
            --report-dir="$TEST_OUTPUT_DIR/coverage" \
            --reporter=html \
            --reporter=text \
            --reporter=json-summary
        
        # Mostrar resumen
        if [ -f "$TEST_OUTPUT_DIR/coverage/coverage-summary.json" ]; then
            log_info "📈 Resumen de Coverage:"
            cat "$TEST_OUTPUT_DIR/coverage/coverage-summary.json" | jq '.total'
        fi
        
        log_info "✅ Reporte de coverage generado en: $TEST_OUTPUT_DIR/coverage"
    else
        log_warn "No se encontró directorio de coverage"
    fi
}

# Función para ejecutar linting
run_linting() {
    log_info "🔍 Ejecutando linting..."
    
    npx eslint "$MODULE_PATH/**/*.{js,jsx}" \
        --format=json \
        --output-file="$TEST_OUTPUT_DIR/eslint-results.json" 2>&1
    
    local lint_result=$?
    
    if [ $lint_result -eq 0 ]; then
        log_info "✅ Linting completado sin errores"
    else
        log_warn "⚠️ Se encontraron issues de linting (ver $TEST_OUTPUT_DIR/eslint-results.json)"
    fi
    
    return $lint_result
}

# Función para tests de accesibilidad
run_accessibility_tests() {
    log_info "♿ Ejecutando tests de accesibilidad..."
    
    if command -v axe &> /dev/null; then
        # Usar axe-core si está disponible
        npx axe http://localhost:3000/historial-trabajos \
            --save "$TEST_OUTPUT_DIR/accessibility-results.json" \
            --timeout 10000 2>&1
        
        if [ $? -eq 0 ]; then
            log_info "✅ Tests de accesibilidad completados"
        else
            log_warn "⚠️ Se encontraron issues de accesibilidad"
        fi
    else
        log_warn "axe-core no está instalado, saltando tests de accesibilidad"
    fi
}

# Función para tests de performance
run_performance_tests() {
    log_info "⚡ Ejecutando tests de performance..."
    
    if command -v lighthouse &> /dev/null; then
        lighthouse http://localhost:3000/historial-trabajos \
            --output=json \
            --output-path="$TEST_OUTPUT_DIR/lighthouse-results.json" \
            --chrome-flags="--headless" \
            --only-categories=performance 2>&1
        
        if [ $? -eq 0 ]; then
            log_info "✅ Tests de performance completados"
            
            # Extraer score de performance
            if [ -f "$TEST_OUTPUT_DIR/lighthouse-results.json" ]; then
                local perf_score=$(cat "$TEST_OUTPUT_DIR/lighthouse-results.json" | jq '.categories.performance.score * 100')
                log_info "📊 Performance Score: $perf_score/100"
            fi
        else
            log_warn "⚠️ Tests de performance fallaron"
        fi
    else
        log_warn "Lighthouse no está instalado, saltando tests de performance"
    fi
}

# Función para generar reporte final
generate_final_report() {
    log_info "📋 Generando reporte final..."
    
    local report_file="$TEST_OUTPUT_DIR/final-report.md"
    
    cat > "$report_file" << EOF
# Reporte de Testing - Historial de Trabajos

## Fecha de Ejecución
$(date)

## Resumen de Resultados

### Tests Unitarios
- Estado: $unit_tests_status
- Coverage: Ver $COVERAGE_DIR/index.html

### Tests de Componentes  
- Estado: $component_tests_status

### Tests de Hooks
- Estado: $hook_tests_status

### Tests E2E
- Estado: $e2e_tests_status
- Reporte: Ver $TEST_OUTPUT_DIR/e2e/mochawesome.html

### Linting
- Estado: $linting_status
- Resultados: Ver $TEST_OUTPUT_DIR/eslint-results.json

## Archivos Generados

- Coverage Report: $COVERAGE_DIR/index.html
- E2E Report: $TEST_OUTPUT_DIR/e2e/mochawesome.html
- Lighthouse Results: $TEST_OUTPUT_DIR/lighthouse-results.json
- Accessibility Results: $TEST_OUTPUT_DIR/accessibility-results.json

## Comandos para Ejecutar Tests Individuales

\`\`\`bash
# Tests unitarios
npm test -- --testPathPattern="$MODULE_PATH"

# Tests E2E
npm run cypress:run

# Linting
npm run lint

# Coverage
npm run test:coverage
\`\`\`

## Notas

- Todos los tests deben pasar antes de merge
- Coverage mínimo requerido: 80%
- Performance score mínimo: 90/100
- Sin errores de accesibilidad críticos

EOF

    log_info "✅ Reporte final generado: $report_file"
}

# EJECUCIÓN PRINCIPAL
echo ""
log_info "Iniciando ejecución de tests..."

# Variables para tracking de resultados
unit_tests_status="❌ No ejecutado"
component_tests_status="❌ No ejecutado"
hook_tests_status="❌ No ejecutado"
e2e_tests_status="❌ No ejecutado"
linting_status="❌ No ejecutado"

# Ejecutar linting primero
if run_linting; then
    linting_status="✅ Exitoso"
else
    linting_status="⚠️ Con warnings"
fi

# Tests unitarios
if run_unit_tests; then
    unit_tests_status="✅ Exitoso"
fi

# Tests de componentes
if run_component_tests; then
    component_tests_status="✅ Exitoso"
fi

# Tests de hooks
if run_hook_tests; then
    hook_tests_status="✅ Exitoso"
fi

# Tests E2E (solo si los unitarios pasaron)
if [ "$unit_tests_status" = "✅ Exitoso" ]; then
    if run_e2e_tests; then
        e2e_tests_status="✅ Exitoso"
    fi
else
    log_warn "Saltando tests E2E debido a fallos en tests unitarios"
    e2e_tests_status="⏭️ Saltado"
fi

# Generar reportes
generate_coverage_report
run_accessibility_tests
run_performance_tests
generate_final_report

# Resumen final
echo ""
echo "=================================================================="
log_info "🏁 RESUMEN FINAL DE TESTING"
echo "=================================================================="
echo "Tests Unitarios:     $unit_tests_status"
echo "Tests Componentes:   $component_tests_status"
echo "Tests Hooks:         $hook_tests_status"
echo "Tests E2E:           $e2e_tests_status"
echo "Linting:             $linting_status"
echo ""
log_info "📁 Resultados disponibles en: $TEST_OUTPUT_DIR/"
log_info "📊 Coverage disponible en: $COVERAGE_DIR/index.html"

# Exit code basado en resultados críticos
if [[ "$unit_tests_status" == *"✅"* && "$e2e_tests_status" == *"✅"* ]]; then
    log_info "🎉 ¡Todos los tests críticos pasaron!"
    exit 0
else
    log_error "💥 Algunos tests críticos fallaron"
    exit 1
fi
