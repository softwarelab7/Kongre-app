# 0001. Arquitectura de Bóveda Local Cifrada y Sincronización Zero-Knowledge

## Contexto y Decisión
Las congregaciones de los Testigos de Jehová manejan información pastoral y personal sensible (tarjetas S-21, notas de ancianos, datos de salud DPA) sujeta a estrictas leyes de protección de datos (Ley 1581 / GDPR). Además, las reuniones se llevan a cabo frecuentemente en auditorios o salidas a la predicación con conectividad nula o intermitente.

Decidimos que Kongre operará bajo una arquitectura **100% offline-first con bóveda local cifrada (`atRestVault`)** respaldada por IndexedDB con una `CryptoKey` no extraíble (`extractable: false`), utilizando derivación lenta PBKDF2-SHA256 (200.000 iteraciones) y AES-GCM (256 bits). La sincronización en la nube funciona como un relay de payloads cifrados (`payload_public`, `payload_dept`, `payload_personal`, `payload_master`), donde el servidor desconoce completamente las claves en texto claro y no almacena credenciales maestras.

## Opciones Consideradas
1. **Autenticación Tradicional y Base de Datos Centralizada en la Nube:** Descartada porque comprometería la soberanía local de los ancianos, crearía un punto único de fallo/filtración y violaría el requisito de operatividad offline total.
2. **Almacenamiento Local en Texto Plano (`localStorage` / SQLite):** Descartado porque cualquier script o acceso físico al dispositivo expondría datos sensibles de publicadores.

## Consecuencias
- La congregación funciona sin interrupciones con o sin conexión a internet en el Salón del Reino.
- Ni los desarrolladores ni los proveedores de infraestructura en la nube tienen la capacidad técnica de descifrar la información de las congregaciones.
- Los PINs y claves nunca viajan por la red en texto claro.
