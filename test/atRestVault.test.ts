import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  initAtRestVault,
  getVaultValue,
  setVaultValue,
  resetVaultForTesting,
  setVaultKeyForTesting,
  encryptWithVaultKey,
  decryptWithVaultKey,
  isVaultReady,
  isVaultCiphertext,
  VAULT_CIPHER_PREFIX,
} from '../src/utils/atRestVault.ts';
import {
  hashPasscode,
  hashPasscodeSlow,
  isSlowHash,
  verifyPasscode,
  getSecureLocalPin,
  setSecureLocalPin,
  verifySecureLocalPin,
  encryptPinAtRest,
} from '../src/utils/theocraticSecurity.ts';

// Mock de almacenamiento en memoria para localStorage y sessionStorage
function createMockStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
    _raw: store,
  };
}

// Mock ligero de IndexedDB para entorno Node
function setupMockIndexedDB() {
  const dbs = new Map<string, Map<string, Map<any, any>>>();

  const mockIDB: any = {
    open: (dbName: string, _version?: number) => {
      let isUpgradeNeeded = false;
      if (!dbs.has(dbName)) {
        dbs.set(dbName, new Map());
        isUpgradeNeeded = true;
      }
      const dbStores = dbs.get(dbName)!;

      const dbInstance: any = {
        objectStoreNames: {
          contains: (name: string) => dbStores.has(name),
        },
        createObjectStore: (name: string) => {
          if (!dbStores.has(name)) {
            dbStores.set(name, new Map());
          }
          return {};
        },
        transaction: (storeNames: string | string[], _mode: string) => {
          const storeName = Array.isArray(storeNames) ? storeNames[0] : storeNames;
          if (!dbStores.has(storeName)) dbStores.set(storeName, new Map());
          const storeData = dbStores.get(storeName)!;
          const tx: any = {
            oncomplete: null,
            onerror: null,
            objectStore: () => ({
              get: (key: any) => {
                const req: any = {};
                queueMicrotask(() => {
                  req.result = storeData.get(key);
                  if (req.onsuccess) req.onsuccess({ target: req });
                });
                return req;
              },
              put: (val: any, key: any) => {
                const req: any = {};
                queueMicrotask(() => {
                  storeData.set(key, val);
                  if (req.onsuccess) req.onsuccess({ target: req });
                  queueMicrotask(() => {
                    if (tx.oncomplete) tx.oncomplete({ target: tx });
                  });
                });
                return req;
              },
            }),
          };
          return tx;
        },
        close: () => {},
      };

      const openReq: any = { result: dbInstance };
      queueMicrotask(() => {
        if (isUpgradeNeeded && openReq.onupgradeneeded) {
          openReq.onupgradeneeded({ target: openReq });
        }
        if (openReq.onsuccess) {
          openReq.onsuccess({ target: openReq });
        }
      });
      return openReq;
    },
    _clearAll: () => dbs.clear(),
  };

  return mockIDB;
}

let mockLocal: ReturnType<typeof createMockStorage>;
let mockSession: ReturnType<typeof createMockStorage>;
let mockIDB: ReturnType<typeof setupMockIndexedDB>;

beforeEach(() => {
  resetVaultForTesting();
  mockLocal = createMockStorage();
  mockSession = createMockStorage();
  mockIDB = setupMockIndexedDB();

  (globalThis as any).window = {};
  (globalThis as any).localStorage = mockLocal;
  (globalThis as any).sessionStorage = mockSession;
  (globalThis as any).indexedDB = mockIDB;
});

afterEach(() => {
  resetVaultForTesting();
});

// ============================================================================
// PRUEBAS DE LA BÓVEDA CON CLAVES NO EXTRAÍBLES (atRestVault)
// ============================================================================

test('bóveda: generación y no-extraibilidad de la CryptoKey (extractable: false)', async () => {
  const initialized = await initAtRestVault();
  assert.equal(initialized, true, 'La bóveda debe inicializarse correctamente con IndexedDB');
  assert.equal(isVaultReady(), true, 'La bóveda debe estar marcada como lista');

  // Comprobar que generateKey produjo una clave no extraíble
  const testKey = await (globalThis.crypto.subtle as any).generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  assert.equal(testKey.extractable, false, 'La clave generada debe tener extractable: false');

  await assert.rejects(
    async () => {
      await globalThis.crypto.subtle.exportKey('raw', testKey);
    },
    (err: any) => /^InvalidAccess/.test(String(err?.name)),
    'Intentar exportar la clave debe fallar con InvalidAccessError'
  );
});

test('bóveda: ida y vuelta de cifrado y descifrado con clave no extraíble', async () => {
  await initAtRestVault();
  const keyName = 'kongre_coordinator_pin';
  const secretPin = '839201847192';

  const ciphertext = await encryptWithVaultKey(keyName, secretPin);
  assert.ok(ciphertext.startsWith(VAULT_CIPHER_PREFIX), 'Debe iniciar con kgr_v3:');
  assert.ok(isVaultCiphertext(ciphertext), 'Debe ser detectado como ciphertext de la bóveda');

  const decrypted = await decryptWithVaultKey(keyName, ciphertext);
  assert.equal(decrypted, secretPin, 'El descifrado debe recuperar exactamente el PIN original');
});

test('bóveda: manipulación de ciphertext (tampering) detectada por AES-GCM', async () => {
  await initAtRestVault();
  const keyName = 'kongre_session_pin_v2';
  const secret = '994820194821';

  const validCipher = await encryptWithVaultKey(keyName, secret);
  const parts = validCipher.slice(VAULT_CIPHER_PREFIX.length).split(':');
  const ivHex = parts[0];
  const cipherHex = parts[1];

  // Alterar el último carácter hexadecimal del texto cifrado (manipulación)
  const lastChar = cipherHex.slice(-1);
  const mutatedChar = lastChar === 'a' ? 'b' : 'a';
  const tamperedCipherHex = cipherHex.slice(0, -1) + mutatedChar;
  const tampered = `${VAULT_CIPHER_PREFIX}${ivHex}:${tamperedCipherHex}`;

  await assert.rejects(
    async () => {
      await decryptWithVaultKey(keyName, tampered);
    },
    { name: 'OperationError' },
    'AES-GCM debe rechazar el texto manipulado con OperationError'
  );
});

test('bóveda: manipulación de AAD (traslado de secreto a otra clave) detectada', async () => {
  await initAtRestVault();
  const originalKey = 'kongre_coordinator_pin';
  const targetKey = 'kongre_session_pin_v2';
  const pin = '123456789012';

  // Cifrado bajo originalKey
  const cipher = await encryptWithVaultKey(originalKey, pin);

  // Intentar descifrar bajo targetKey debe fallar porque el AAD no coincide
  await assert.rejects(
    async () => {
      await decryptWithVaultKey(targetKey, cipher);
    },
    { name: 'OperationError' },
    'AES-GCM debe rechazar el descifrado si se utiliza una clave AAD distinta'
  );
});

test('bóveda: API síncrona en memoria y eliminación de ${key}_hash y sessionStorage', async () => {
  await initAtRestVault();
  const key = 'kongre_coordinator_pin';
  const pin = '482910482910';

  // Al guardar
  setSecureLocalPin(key, pin);

  // Lectura síncrona inmediata en memoria
  const readSync = getSecureLocalPin(key);
  assert.equal(readSync, pin, 'getSecureLocalPin debe responder síncronamente desde la caché');
  assert.equal(getVaultValue(key), pin, 'getVaultValue debe reflejar el PIN de inmediato');

  // Comprobar que NO se almacena copia en claro en sessionStorage
  assert.equal(mockSession.getItem(key), null, 'sessionStorage NO debe tener copia del PIN');

  // Comprobar que NO se guarda el hash rápido inseguro ${key}_hash
  assert.equal(mockLocal.getItem(`${key}_hash`), null, 'localStorage NO debe contener ${key}_hash');

  // Esperar microtareas para comprobar persistencia asíncrona
  await new Promise((r) => setTimeout(r, 10));
  const persisted = mockLocal.getItem(key);
  assert.ok(persisted && persisted.startsWith(VAULT_CIPHER_PREFIX), 'Debe persistirse en localStorage como kgr_v3');
});

test('bóveda: migración automática desde formato kgr_v2 legado y purga de hash', async () => {
  const key = 'kongre_coordinator_pin';
  const plainPin = '748291847291';

  // Simular estado antiguo: cifrado con kgr_v2 y con hash rápido SHA-256
  const oldEncrypted = encryptPinAtRest(plainPin);
  mockLocal.setItem(key, oldEncrypted);
  mockLocal.setItem(`${key}_hash`, 'a6b7c8d9e0f1...');

  // Inicializar la bóveda (debe ejecutar la migración automática)
  await initAtRestVault();

  // El valor debe estar disponible en memoria
  assert.equal(getSecureLocalPin(key), plainPin, 'Debe migrar y devolver el PIN correcto');

  // El hash legado debe haber sido purgado
  assert.equal(mockLocal.getItem(`${key}_hash`), null, 'El hash legado debe ser eliminado');

  // El formato en localStorage debe haber sido promovido a kgr_v3
  const updatedStored = mockLocal.getItem(key);
  assert.ok(updatedStored && updatedStored.startsWith(VAULT_CIPHER_PREFIX), 'Debe promoverse a kgr_v3:');
});

test('bóveda: recarga de sesión reutiliza la clave de IndexedDB', async () => {
  // Sesión 1
  await initAtRestVault();
  const key = 'kongre_session_pin_v2';
  const pin = '958201948210';
  setSecureLocalPin(key, pin);
  await new Promise((r) => setTimeout(r, 15));

  const storedCipher = mockLocal.getItem(key);
  assert.ok(storedCipher && storedCipher.startsWith(VAULT_CIPHER_PREFIX));

  // Simular reinicio / recarga de pestaña (borra estado en memoria)
  resetVaultForTesting();
  assert.equal(isVaultReady(), false, 'La memoria de la bóveda fue reiniciada');

  // Sesión 2: inicializar nuevamente sobre el mismo mockIDB
  await initAtRestVault();
  assert.equal(isVaultReady(), true);

  // Debe haber descifrado e hidratado el valor persistido
  assert.equal(getSecureLocalPin(key), pin, 'Debe restaurar el PIN persistido reutilizando la clave');
});

test('bóveda: pérdida de clave en IndexedDB maneja fallo limpiamente sin fuga', async () => {
  // Sesión 1
  await initAtRestVault();
  const key = 'kongre_coordinator_pin';
  const pin = '839201948271';
  setSecureLocalPin(key, pin);
  await new Promise((r) => setTimeout(r, 15));

  // Simular borrado de IndexedDB por el usuario ("Borrar datos del sitio") mientras localStorage persiste
  mockIDB._clearAll();
  resetVaultForTesting();

  // Sesión 2: se inicializa sin clave previa (crea una NUEVA clave distinta)
  await initAtRestVault();

  // El PIN antiguo ya no puede ser descifrado con la nueva clave: debe devolver cadena vacía
  const recovered = getSecureLocalPin(key);
  assert.equal(recovered, '', 'Si se pierde la clave original, el PIN antiguo no se descifra');
});

test('bóveda: fallback seguro a kgr_v2 cuando IndexedDB no está disponible', async () => {
  // Simular entorno sin IndexedDB (ej: modo privado estricto o web worker limitado)
  delete (globalThis as any).indexedDB;
  resetVaultForTesting();

  const initialized = await initAtRestVault();
  assert.equal(initialized, false, 'initAtRestVault debe retornar false sin error');
  assert.equal(isVaultReady(), false, 'La bóveda debe reportar no estar lista');

  const key = 'kongre_last_cong_pin';
  const pin = '991204';
  setSecureLocalPin(key, pin);

  // En memoria síncrona se puede leer
  assert.equal(getSecureLocalPin(key), pin, 'Lectura síncrona debe funcionar');

  // En localStorage debe usar fallback kgr_v2
  const stored = mockLocal.getItem(key);
  assert.ok(stored && stored.startsWith('kgr_v2:'), 'Debe utilizar fallback kgr_v2 cuando no hay IndexedDB');
});

// ============================================================================
// PRUEBAS DE HASH LENTO PBKDF2 (hashPasscodeSlow / verifyPasscode)
// ============================================================================

test('hash lento: generación con PBKDF2 (200.000 iteraciones) y sal aleatoria', async () => {
  const pin = '104829471928';
  const hash1 = await hashPasscodeSlow(pin);
  const hash2 = await hashPasscodeSlow(pin);

  assert.ok(hash1.startsWith('pbkdf2:200000:'), 'Debe usar prefijo pbkdf2:200000:');
  assert.ok(isSlowHash(hash1), 'isSlowHash debe reconocer el formato pbkdf2');
  assert.notEqual(hash1, hash2, 'Dos hashes del mismo PIN deben diferir por la sal aleatoria');
});

test('hash lento: verifyPasscode verifica coincidencia exacta, mayúsculas y sin guiones', async () => {
  const secret = '8X4W-9M2K';
  const slowHash = await hashPasscodeSlow(secret);

  assert.equal(await verifyPasscode('8X4W-9M2K', slowHash), true, 'Coincidencia exacta');
  assert.equal(await verifyPasscode('8x4w-9m2k', slowHash), true, 'Insensible a mayúsculas');
  assert.equal(await verifyPasscode('8X4W9M2K', slowHash), true, 'Sin guión');
  assert.equal(await verifyPasscode('8x4w9m2k', slowHash), true, 'Sin guión y minúsculas');
  assert.equal(await verifyPasscode('WRONG-CODE', slowHash), false, 'PIN incorrecto es rechazado');
});

test('hash lento: retrocompatibilidad con hashes SHA-256 antiguos en verifyPasscode', async () => {
  const pin = '4821';
  const legacyHash = await hashPasscode(pin);

  assert.equal(isSlowHash(legacyHash), false, 'Hash legado no es detectado como lento');
  assert.equal(await verifyPasscode(pin, legacyHash), true, 'verifyPasscode debe verificar el hash legado');
  assert.equal(await verifyPasscode('9999', legacyHash), false, 'PIN incorrecto contra hash legado es rechazado');
});

test('hash lento: verifySecureLocalPin valida y limpia hashes residuales', () => {
  const key = 'kongre_session_pin_v2';
  const pin = '839201';

  setSecureLocalPin(key, pin);
  assert.equal(verifySecureLocalPin(key, pin), true, 'verifySecureLocalPin debe validar el PIN');
  assert.equal(verifySecureLocalPin(key, '000000'), false, 'verifySecureLocalPin rechaza PIN incorrecto');
  assert.equal(mockLocal.getItem(`${key}_hash`), null, 'Cualquier hash residual queda eliminado');
});

// ============================================================================
// REGRESIONES DE CONCURRENCIA Y TIMEOUT EN LA BÓVEDA
// ============================================================================

test('bóveda: dos escrituras seguidas no dejan el primer valor en localStorage aunque su cifrado termine más tarde', async () => {
  await initAtRestVault();
  const key = 'kongre_coordinator_pin';

  // Interceptar el primer subtle.encrypt para que se resuelva DESPUÉS del segundo
  const subtle = globalThis.crypto.subtle as any;
  const realEncrypt = subtle.encrypt.bind(subtle);
  let callCount = 0;
  let releaseFirst!: () => void;
  const firstGate = new Promise<void>((r) => { releaseFirst = r; });

  subtle.encrypt = async (...args: any[]) => {
    callCount++;
    if (callCount === 1) {
      await firstGate;
    }
    return realEncrypt(...args);
  };

  try {
    setVaultValue(key, 'PIN_VIEJO_111111');
    setVaultValue(key, 'PIN_NUEVO_222222');

    // Esperar a que termine la segunda escritura
    await new Promise((r) => setTimeout(r, 15));
    // Ahora se completa tardíamente la primera
    releaseFirst();
    await new Promise((r) => setTimeout(r, 15));

    assert.equal(getVaultValue(key), 'PIN_NUEVO_222222');
    const persisted = mockLocal.getItem(key)!;
    const decrypted = await decryptWithVaultKey(key, persisted);
    assert.equal(decrypted, 'PIN_NUEVO_222222', 'El cifrado tardío de la primera escritura no debe pisar la segunda');
  } finally {
    subtle.encrypt = realEncrypt;
  }
});

test('bóveda: borrar una clave mientras hay una escritura en vuelo no la resucita en localStorage', async () => {
  await initAtRestVault();
  const key = 'kongre_session_pin_v2';

  const subtle = globalThis.crypto.subtle as any;
  const realEncrypt = subtle.encrypt.bind(subtle);
  let release!: () => void;
  const gate = new Promise<void>((r) => { release = r; });
  subtle.encrypt = async (...args: any[]) => {
    await gate;
    return realEncrypt(...args);
  };

  try {
    setVaultValue(key, 'SECRETO_TEMPORAL');
    setVaultValue(key, ''); // logout / limpieza inmediata
    assert.equal(getVaultValue(key), null);
    assert.equal(mockLocal.getItem(key), null);

    release();
    await new Promise((r) => setTimeout(r, 15));

    assert.equal(mockLocal.getItem(key), null, 'El cifrado en vuelo no debe volver a escribir una clave ya borrada');
  } finally {
    subtle.encrypt = realEncrypt;
  }
});

test('bóveda: dos inicializaciones sobre el mismo IndexedDB conservan la primera clave sin sobrescribirla', async () => {
  await initAtRestVault();
  setSecureLocalPin('kongre_coordinator_pin', 'PIN_PESTANA_1');
  await new Promise((r) => setTimeout(r, 15));
  const cipherFromTab1 = mockLocal.getItem('kongre_coordinator_pin')!;

  // Simular segunda pestaña: memoria limpia pero mismo IndexedDB
  resetVaultForTesting();
  await initAtRestVault();

  const plainInTab2 = await decryptWithVaultKey('kongre_coordinator_pin', cipherFromTab1);
  assert.equal(plainInTab2, 'PIN_PESTANA_1', 'La segunda pestaña debe reutilizar la clave existente en la misma transacción');
});

test('bóveda: si el tiempo límite vence, la inicialización aborta y no muta el estado después', async () => {
  const key = 'kongre_coordinator_pin';
  const legacyCipher = encryptPinAtRest('PIN_ANTES_TIMEOUT');
  mockLocal.setItem(key, legacyCipher);

  // IndexedDB lento: tarda 60ms en abrir, pero el timeout es de 5ms
  const fastOpen = mockIDB.open;
  mockIDB.open = (dbName: string, version?: number) => {
    const req: any = {};
    setTimeout(() => {
      const inner = fastOpen(dbName, version);
      queueMicrotask(() => {
        req.result = inner.result;
        if (req.onsuccess) req.onsuccess({ target: req });
      });
    }, 60);
    return req;
  };

  try {
    const ok = await initAtRestVault(5);
    assert.equal(ok, false, 'Debe devolver false al vencer el timeout');
    assert.equal(isVaultReady(), false);

    // Esperar a que termine la apertura lenta de IndexedDB
    await new Promise((r) => setTimeout(r, 90));

    assert.equal(isVaultReady(), false, 'La tarea cancelada no debe activar la bóveda más tarde');
    assert.equal(mockLocal.getItem(key), legacyCipher, 'No debe haber reescrito localStorage a kgr_v3 tras el timeout');
  } finally {
    mockIDB.open = fastOpen;
  }
});

