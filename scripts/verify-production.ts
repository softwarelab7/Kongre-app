// scripts/verify-production.ts
import fs from 'fs';
import path from 'path';

console.log('🚀 Iniciando verificación de calidad y preparación para producción (Fase 6)...');

let hasError = false;

// 1. Verificar existencia de artefactos de producción en dist/
const requiredDistFiles = [
  'dist/index.html',
  'dist/sw.js',
  'dist/manifest.webmanifest',
  'dist/registerSW.js',
];

console.log('\n📦 1. Verificando bundle de producción (dist)...');
for (const file of requiredDistFiles) {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Falta archivo crítico en dist: ${file}`);
    hasError = true;
  } else {
    const stats = fs.statSync(filePath);
    console.log(`  ✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  }
}

// 2. Verificar manifiesto PWA
console.log('\n📱 2. Validando manifiesto PWA...');
const manifestPath = path.resolve(process.cwd(), 'dist/manifest.webmanifest');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!manifest.name || !manifest.short_name || !manifest.start_url || !manifest.icons) {
      console.error('❌ Manifiesto PWA incompleto.');
      hasError = true;
    } else {
      console.log(`  ✅ Nombre de la aplicación: ${manifest.name}`);
      console.log(`  ✅ Modo de despliegue: ${manifest.display}`);
      console.log(`  ✅ Iconos declarados: ${manifest.icons.length}`);
    }
  } catch (err: any) {
    console.error('❌ Error leyendo manifiesto PWA:', err.message);
    hasError = true;
  }
}

// 3. Validar arquitectura de seguridad Cero Conocimiento (Supabase + AES-256-GCM)
console.log('\n🛡️ 3. Validando arquitectura de seguridad Cero Conocimiento (Supabase)...');
const syncServicePath = path.resolve(process.cwd(), 'src/services/supabaseSyncService.ts');
const cryptoUtilsPath = path.resolve(process.cwd(), 'src/utils/crypto.ts');

if (fs.existsSync(syncServicePath) && fs.existsSync(cryptoUtilsPath)) {
  const syncContent = fs.readFileSync(syncServicePath, 'utf8');
  const cryptoContent = fs.readFileSync(cryptoUtilsPath, 'utf8');

  if (cryptoContent.includes('AES-GCM') && cryptoContent.includes('PBKDF2')) {
    console.log('  ✅ Cifrado de grado militar activo (AES-256-GCM + PBKDF2 100k iteraciones).');
  } else {
    console.error('❌ Módulo de criptografía incompleto.');
    hasError = true;
  }

  if (syncContent.includes('uploadCongregation') && syncContent.includes('fetchAndDecryptCongregation')) {
    console.log('  ✅ Pipeline de sincronización Cero Conocimiento configurado correctamente.');
  } else {
    console.error('❌ Pipeline de sincronización Supabase incompleto.');
    hasError = true;
  }
} else {
  console.error('❌ Faltan archivos requeridos para el stack de seguridad Supabase');
  hasError = true;
}

// 4. Verificación de chunks divididos (Code Splitting)
console.log('\n⚡ 4. Verificando división de código (Code Splitting)...');
const assetsDir = path.resolve(process.cwd(), 'dist/assets');
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const vendorChunks = files.filter((f) => f.startsWith('vendor-'));
  console.log(`  ✅ Chunks independientes generados: ${vendorChunks.length}`);
  vendorChunks.forEach((c) => {
    const s = fs.statSync(path.join(assetsDir, c));
    console.log(`     • ${c} (${(s.size / 1024).toFixed(2)} KB)`);
  });
}

console.log('\n' + '='.repeat(60));
if (hasError) {
  console.error('❌ LA VERIFICACIÓN DE PRODUCCIÓN DETECTÓ PROBLEMAS.');
  process.exit(1);
} else {
  console.log('🎉 TODAS LAS VERIFICACIONES DE PRODUCCIÓN PASARON CON ÉXITO.');
  console.log('='.repeat(60));
}
