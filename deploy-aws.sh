#!/bin/bash
# ============================================================
# Script de despliegue a AWS Elastic Beanstalk — CUP-FICCT
# ============================================================
# Uso: ./deploy-aws.sh
# Requiere: eb CLI, aws CLI, node, composer

set -e

echo ""
echo "========================================"
echo "  DESPLIEGUE CUP-FICCT → AWS"
echo "========================================"
echo ""

# 1. Construir assets de frontend
echo "[1/4] Construyendo assets de producción (Vite)..."
npm ci
npm run build
echo "      ✅ Assets construidos en public/build/"

# 2. Optimizar Composer
echo "[2/4] Optimizando autoloader de Composer..."
composer install --no-dev --optimize-autoloader --no-interaction
echo "      ✅ Dependencias PHP optimizadas"

# 3. Limpiar cachés locales (EB las regenera en producción)
echo "[3/4] Limpiando cachés locales..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
echo "      ✅ Cachés limpiadas"

# 4. Desplegar con EB CLI
echo "[4/4] Desplegando en Elastic Beanstalk..."
eb deploy --label "deploy-$(date +%Y%m%d-%H%M%S)"
echo "      ✅ Despliegue completado"

echo ""
echo "========================================"
echo "  ✅ DESPLIEGUE EXITOSO"
echo "========================================"
eb open
