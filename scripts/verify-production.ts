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

// 3. Validar sintaxis y reglas de Firestore
console.log('\n🛡️ 3. Validando firestore.rules y RBAC teocrático...');
const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
if (fs.existsSync(rulesPath)) {
  const rules = fs.readFileSync(rulesPath, 'utf8');
  const requiredSubcollections = [
    '/publishers/{pubId}',
    '/weeks/{weekId}',
    '/territories/{terrId}',
    '/accounts/{accId}',
    '/literature/{litId}',
    '/notices/{noticeId}',
  ];

  for (const sub of requiredSubcollections) {
    if (!rules.includes(sub)) {
      console.error(`❌ Subcolección requerida no encontrada en firestore.rules: ${sub}`);
      hasError = true;
    } else {
      console.log(`  ✅ Subcolección protegida: ${sub}`);
    }
  }

  // Comprobar balanceo de llaves {}
  const openBraces = (rules.match(/{/g) || []).length;
  const closeBraces = (rules.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    console.error(`❌ Llaves desbalanceadas en firestore.rules: ${openBraces} abiertas vs ${closeBraces} cerradas`);
    hasError = true;
  } else {
    console.log(`  ✅ Estructura sintáctica de reglas correcta (${openBraces} bloques).`);
  }
} else {
  console.error('❌ No se encontró firestore.rules');
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
