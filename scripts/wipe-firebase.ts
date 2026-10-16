// scripts/wipe-firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import config from '../firebase-applet-config.json';

const app = initializeApp(config);
const db =
  config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, config.firestoreDatabaseId)
    : getFirestore(app);

const SUBCOLLECTIONS = [
  'publishers',
  'weeks',
  'territories',
  'notices',
  'accounts',
  'literature',
  'invitations',
  'sessions',
  'audit',
  'linkRequests',
];

async function wipeFirestore() {
  console.log('🔥 Iniciando borrado total de Firestore en el proyecto:', config.projectId);
  console.log('📁 Base de datos Firestore ID:', config.firestoreDatabaseId || '(default)');

  let totalDeleted = 0;

  try {
    const congSnap = await getDocs(collection(db, 'congregations'));
    console.log(`📋 Congregaciones encontradas: ${congSnap.size}`);

    for (const congDoc of congSnap.docs) {
      const congId = congDoc.id;
      console.log(`\n🗑️ Procesando congregación: ${congId}`);

      // 1. Borrar todas las subcolecciones de esta congregación
      for (const sub of SUBCOLLECTIONS) {
        try {
          const subSnap = await getDocs(collection(db, 'congregations', congId, sub));
          if (subSnap.size > 0) {
            console.log(`   - Borrando ${subSnap.size} documentos en subcolección [${sub}]...`);
            for (const subDoc of subSnap.docs) {
              await deleteDoc(doc(db, 'congregations', congId, sub, subDoc.id));
              totalDeleted++;
            }
          }
        } catch (subErr: any) {
          console.warn(`   ⚠️ Error revisando subcolección [${sub}]:`, subErr.message);
        }
      }

      // 2. Borrar el documento principal de la congregación
      await deleteDoc(doc(db, 'congregations', congId));
      totalDeleted++;
      console.log(`   ✅ Documento principal de congregación [${congId}] eliminado.`);
    }

    // 3. Verificar si quedan congregaciones
    const verifySnap = await getDocs(collection(db, 'congregations'));
    console.log(`\n🔍 Verificación final en 'congregations': ${verifySnap.size} documentos restantes.`);

    console.log(`\n🎉 Borrado completado con éxito. Total de documentos eliminados: ${totalDeleted}`);
  } catch (err: any) {
    console.error('❌ Error durante el borrado de Firestore:', err);
  }
}

wipeFirestore()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
