#!/usr/bin/env node

/**
 * Script post-build para asegurar que .htaccess se copie al build
 * Este script se ejecuta automáticamente después de cada build
 */

const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '../public/.htaccess');
const targetDir = path.join(__dirname, '../dist/restaurante-frontend/browser');
const targetFile = path.join(targetDir, '.htaccess');

// Verificar que el directorio de build existe
if (!fs.existsSync(targetDir)) {
  console.warn('⚠️  Directorio de build no encontrado:', targetDir);
  console.warn('   Ejecuta "npm run build" primero');
  process.exit(0);
}

// Verificar que el archivo fuente existe
if (!fs.existsSync(sourceFile)) {
  console.error('❌ Archivo fuente no encontrado:', sourceFile);
  process.exit(1);
}

// Copiar .htaccess al build
try {
  fs.copyFileSync(sourceFile, targetFile);
  console.log('✅ .htaccess copiado exitosamente a:', targetFile);
} catch (error) {
  console.error('❌ Error al copiar .htaccess:', error.message);
  process.exit(1);
}

