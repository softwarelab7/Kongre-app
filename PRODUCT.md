# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Ancianos de congregación, siervos ministeriales, superintendentes de grupo y publicadores de las congregaciones de los Testigos de Jehová que administran asignaciones, reuniones semanales, informes del ministerio del campo (S-4, S-21, S-88), cuadrantes de limpieza y mantenimiento del Salón del Reino, y territorios digitales de predicación.

## Product Purpose
Proporcionar una plataforma teocrática integral, privada, altamente estética y offline-first que centralice la administración de la congregación con estricta separación departamental, cifrado en reposo y sincronización segura entre dispositivos sin exponer credenciales maestras.

## Positioning
Software teocrático privativo y de código cerrado con arquitectura de bóveda criptográfica local (AES-GCM / PBKDF2), compartimentos departamentales herméticos, modo Cabina de Audio/Video dedicado (#000000), modo Sepia para lectura prolongada y cero almacenamiento en la nube sin cifrar.

## Operating Context
- **Salón del Reino:** Uso continuo durante las reuniones semanales (frecuentemente con baja conectividad o modo avión en auditorio).
- **Cabina de Audio y Video:** Operación de micrófonos, sonido, plataforma y cronómetro en entorno con iluminación tenue (modo Cabina A/V a negro puro).
- **Salidas a la predicación:** Gestión y asignación de territorios con geolocalización GPS, polígonos interactivos Leaflet y códigos QR compartibles sin requerir internet activo.
- **Secretaría teocrática:** Consulta rápida de publicadores, registro de asistencia S-88, tarjetas S-21 e impresión o exportación de hojas de asignación S-89.

## Capabilities and Constraints
- **Capacidades:**
  - PWA instalable multiplataforma y empaquetado nativo de escritorio Tauri (.AppImage, .deb, .rpm, .exe, .dmg).
  - Bóveda de almacenamiento local cifrado (`kgr_sec4` respaldado en IndexedDB con claves no extraíbles).
  - Separación de privilegios: Coordinador, Secretario, Ancianos, Siervos Ministeriales, Publicadores.
  - Generación de hojas de asignación S-89, tarjetas S-21 y registros de asistencia S-88.
  - Editor interactivo de polígonos de territorio con Leaflet y códigos QR compartibles.
  - Temporizador de reuniones y cronómetro de oradores con avisos visuales sutiles.
  - Sistema de respaldo cifrado y recuperación de datos locales.
- **Restricciones:**
  - Código cerrado: el código fuente nunca se publica en repositorios públicos.
  - Cero dependencias obligatorias de servidores externos para el funcionamiento diario (100% operativo offline).

## Brand Commitments
- **Nombre:** Kongre
- **Identidad visual:** Indigo Teocrático (`#4C3AED`), paleta neutra Zinc (`#09090b` / `#121216`), tipografía Plus Jakarta Sans.
- **Voz:** Sobria, respetuosa, teocrática, precisa y sin tecnicismos innecesarios para los hermanos.

## Evidence on Hand
- Repositorio privado de desarrollo: `softwarelab7/Kongre`.
- Repositorio público de instaladores binarios: `softwarelab7/Kongre-app`.
- Dominio oficial de producción: [kongre-app.com](https://www.kongre-app.com).
- 88 tests unitarios de seguridad y cifrado pasando al 100%.

## Product Principles
1. **Privacidad y Ley de Datos (Ley 1581 / GDPR):** Datos personales y de salud teocráticos cifrados en reposo en el dispositivo del usuario.
2. **Offline-First Absoluto:** La congregación no se detiene si no hay internet en el Salón del Reino.
3. **Ergonomía en Auditorio:** Modos Sepia y Cabina A/V diseñados para reducir la fatiga visual y no distraer durante la reunión.
4. **Respeto a la Estructura Teocrática:** Los privilegios departamentales respetan fielmente el orden teocrático.

## Accessibility & Inclusion
- Soporte para zoom nativo accesible (WCAG 1.4.4) sin restricciones artificiales en el viewport.
- Textos de alto contraste con variantes específicas para lectura prolongada.
- Inputs con altura mínima táctil de 42px y texto base de 16px para evitar distorsiones o zooms accidentales en dispositivos móviles.
