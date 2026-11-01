# Kongre

Plataforma de gestión teocrática integral, privada y offline-first diseñada para congregaciones de los Testigos de Jehová, con compartimentos criptográficos locales y separación departamental estricta.

## Lenguaje y Dominio Ubicuo

### Entidades y Estructura

**Congregación**:
Unidad eclesiástica local autónoma gobernada por un cuerpo de ancianos, con soberanía local y almacén criptográfico propio.
_Avoid_: Parroquia, iglesia, sede, cuenta central, organización.

**Publicador**:
Miembro activo de la congregación con registro teocrático individual, asignaciones y reporte de actividad en el ministerio.
_Avoid_: Usuario, cliente, miembro genérico, suscriptor, empleado.

**Cuerpo de Ancianos**:
Grupo de hermanos nombrados teocráticamente responsables de la supervisión espiritual, decisiones pastorales y custodia de los compartimentos maestros.
_Avoid_: Junta directiva, administradores, comité directivo, staff.

**Siervo Ministerial**:
Hermano nombrado teocráticamente que asiste a los ancianos en responsabilidades departamentales como sonido, cuentas, literatura y territorios.
_Avoid_: Auxiliar, ayudante, moderador, operador.

### Criptografía y Seguridad

**Bóveda Local**:
Almacén criptográfico en el dispositivo del usuario (`atRestVault`) protegido con cifrado AES-GCM (256 bits) y una `CryptoKey` no extraíble (`extractable: false`) respaldada por IndexedDB.
_Avoid_: LocalStorage plano, base de datos local, caché de navegador.

**Compartimento Maestro**:
Contenedor criptográfico de máximo privilegio (`payload_master`) descifrable únicamente con el PIN Maestro para auditorías, nombramientos y comités.
_Avoid_: Superadmin, cuenta root, panel de control central.

**Compartimento Departamental**:
Contenedor criptográfico (`payload_dept`) accesible solo a hermanos autorizados en áreas específicas (territorios, cuentas, literatura).
_Avoid_: Subcarpeta, módulo compartido, base de datos de área.

**Compartimento Personal**:
Contenedor criptográfico individual (`payload_personal_${id}`) derivado de la sal única del publicador para proteger su tarjeta S-21 frente a otros publicadores.
_Avoid_: Perfil de usuario, carpeta privada, cuenta individual.

**PIN Maestro**:
Credencial aleatoria de 12 dígitos generada con CSPRNG Web Crypto requerida para operaciones de escritura (`push`), rotación de claves y administración teocrática.
_Avoid_: Password maestro, clave admin, token de superusuario.

**PIN de Congregación**:
Credencial alfanumérica de congregación requerida para sincronizar y descifrar el compartimento público (`payload_public`).
_Avoid_: Contraseña de acceso, código de sala, password grupal.

**PIN Personal**:
Credencial numérica de 6 dígitos con sal individual (`kongre-personal-pin-v2|congId|publisherId`) para verificar identidad y firmar sesiones de rol.
_Avoid_: Contraseña personal, pin simple, clave de usuario.

### Registros e Informes Teocráticos

**Tarjeta S-21**:
Registro oficial de publicador de la congregación que recopila la participación mensual en el ministerio del campo, cursos bíblicos y notas del superintendente de grupo.
_Avoid_: Ficha de usuario, kardex, reporte de membresía, perfil de horas.

**Registro de Asistencia S-88**:
Control mensual oficial de asistencia física y por videoconferencia a la reunión de entre semana (Vida y Ministerio) y fin de semana (Discurso Público y Estudio de La Atalaya).
_Avoid_: Control de asistencia, lista de presentes, log de entrada.

**Hoja de Asignación S-89**:
Documento oficial impreso o digital entregado a estudiantes con su parte asignada en la reunión Vida y Ministerio Cristianos.
_Avoid_: Volante de intervención, ticket de tarea, boleta de discurso.

### Ambientes Visuales y Ergonomía

**Modo Cabina A/V**:
Ambiente de visualización a negro absoluto (`#000000`) con interfaces atenuadas para pantallas de auditorio y cabinas de sonido/plataforma.
_Avoid_: Modo oscuro, tema negro, dark mode estándar.

**Modo Sepia**:
Ambiente de visualización en tonos pergamino cálidos (`#f4ecd8` / `#eae0c8`) diseñado para lectura prolongada sin fatiga ocular.
_Avoid_: Modo lectura, tema beige, fondo vintage.
