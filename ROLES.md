# Kongre · Fase 2: roles y permisos

## Resumen

Esta fase cierra una escalada de privilegios real, aplica alcance de datos a la tarjeta S-21 y deja las reglas
de administración de accesos en funciones puras y probadas. **No cambia la matriz de permisos** (`THEOCRATIC_ROLES`):
cambiarla es una decisión de tu cuerpo de ancianos (ver "Decisiones pendientes").

## Hallazgos corregidos

| # | Hallazgo | Cómo se explotaba | Corrección |
|---|---|---|---|
| 1 | **Anciano → Coordinador** vinculando una cuenta de Google | En `RoleSwitcherModal`, `handleAddEmail` aceptaba cualquier rol (incluido `coordinador`) y el login con Google hacía `setActiveRole(found.role)` sin PIN | `checkEmailRoleLink` en el formulario + el login con Google solo concede `coordinador` si el correo coincide con `kongre_coordinator_email` |
| 2 | **Invitaciones con rol Coordinador/Anciano** | `createInvitation(invRole, …)` sin validar el rol; en el modal ni siquiera comprobaba `isAllowedAccess` | Misma regla en ambas pantallas |
| 3 | **Aprobar solicitudes de vínculo** | `AccountLinkRequest.role` lo propone quien envía la solicitud (viaja en un payload que el PIN de congregación puede escribir) y "Aprobar" lo concedía tal cual | Se valida el rol de la solicitud antes de aprobar |
| 4 | Ancianos podían **otorgar `coordinador`**, **auto-ascenderse**, y **ver/cambiar el PIN de otros ancianos y del coordinador** | Cualquier anciano tenía acceso total al directorio de accesos | `checkCredentialChange` en todos los handlers; selectores de rol filtrados; PIN enmascarado y enlaces de compartir bloqueados |
| 5 | **S-21 de todos los publicadores** para superintendentes de grupo | `canViewS21` es un booleano global; la descripción dice "su grupo" | `canViewS21Of`: solo su tarjeta y la de miembros de los grupos donde es superintendente o auxiliar |
| 6 | Bitácora atribuía a **"Coordinador"** cualquier acción sin nombre identificado | `currentBrotherName || 'Coordinador'` en 12 sitios | Ahora usa el rol real o "Sin identificar" |

## Reglas de administración de accesos (`checkCredentialChange`)

El coordinador queda exento. Para los demás (ancianos):

1. Nadie salvo el coordinador otorga el rol Coordinador ni toca las credenciales del Coordinador.
2. El rol Anciano solo se asigna a hermanos con privilegio de anciano.
3. Nadie cambia su propio rol (sí puede regenerar su propio PIN).
4. Un anciano no administra las credenciales de otros ancianos. Es la constante `ELDERS_CAN_MANAGE_ELDERS` de `rbac.ts`
   (por defecto `false`); ponla en `true` si en tu congregación todos los ancianos se administran entre sí.

Alcance S-21: coordinador, ancianos, secretario y superintendente de servicio ven todas las tarjetas;
el superintendente de grupo, solo las de su grupo (y la suya).

## La matriz de permisos: qué se aplica de verdad

Medido sobre el código (dónde se lee cada permiso fuera de `rbac.ts`):

**Se aplican (7 de 25):** `canEditSchedule` (programación y aseo), `canEditPublishers`, `canViewS21`, `canEditS21`,
`canSuperviseConflicts`, `canViewAuditLog`, `canManageAccess`.

**Solo se muestran en la tabla de la pestaña de roles, no restringen nada (6):** `canEditCLM`, `canEditWeekend`,
`canEditTerritories`, `canManageTerritories`, `canManageLiterature`, `canManageAccounts`.

**No se leen en ningún sitio (12):** `canEditMidweekOnly`, `canEditReports`, `canViewBranchReports`, `canEditAttendance`,
`canEditGroups`, `canEditAnnouncements`, `canEditBillboard`, `canEditDuties`, `canEditCartWitnessing`,
`canEditPublicTalks`, `canModifySettings`, `canManageConfig`.

Consecuencias prácticas, hoy:

- **Territorios, literatura y cuentas** se controlan solo por visibilidad de pestaña (`allowedTabs`): quien ve la pestaña edita todo en ella.
- **`canEditSchedule` es una sola llave para toda la programación.** Por eso el encargado de audio/video, el siervo de
  discursos y el superintendente de Vida y Ministerio pueden editar tanto la reunión de entre semana como la del fin de
  semana; `canEditMidweekOnly`, `canEditCLM` y `canEditWeekend` no los limitan.
- La pestaña `roles` está abierta a todos los roles (contiene "Mi sesión"); el directorio de accesos dentro de ella
  se restringe con `isAllowedAccess` y ahora con las reglas de arriba.

## Decisiones pendientes (de tu cuerpo de ancianos, no técnicas)

1. ¿Los ancianos administran las credenciales de otros ancianos? (`ELDERS_CAN_MANAGE_ELDERS`)
2. ¿Quién debe poder editar solo entre semana / solo fin de semana / solo asignar operadores de sonido? Hoy no existe
   ese nivel de detalle; habría que conectar `canEditMidweekOnly`/`canEditWeekend` a `ScheduleTab` y crear un permiso
   para deberes de audio/video.
3. ¿Territorios, literatura y cuentas deben tener edición restringida más allá de ver la pestaña?
4. ¿El superintendente de servicio debe ver todas las tarjetas S-21 o solo informes?

## Cambios de comportamiento que notarán los usuarios

- Un anciano ya no ve los roles Coordinador/Anciano en los selectores, ni el PIN de otros ancianos o del coordinador,
  ni puede compartir su enlace; si lo intenta por otra vía, recibe un mensaje con el motivo.
- **Un coordinador que inicia sesión con Google en un dispositivo sin `kongre_coordinator_email`** (por ejemplo, un segundo
  dispositivo) entra como `publico` y debe identificarse con su PIN de coordinador. En el dispositivo donde registró la
  congregación no cambia nada.
- Un superintendente de grupo ve la pestaña de tarjeta S-21 solo en publicadores de su grupo.
- Para que la regla de grupo funcione, el superintendente debe estar identificado (`currentPublisherId`) y figurar como
  `overseerId`/`assistantId` de su grupo en la configuración de grupos.

## Verificación

12 pruebas de la política (`test/rbac.test.ts`), `tsc` sin errores y `vite build` correcto con las fases 1 y 2 juntas.
**No ejercité las pantallas en un navegador**: el cableado está verificado por tipos y compilación, no por una sesión real.
Pruébalo con una cuenta de anciano y otra de coordinador antes de publicar.

## Límites (lo que esto NO resuelve)

- **Sigue siendo control de cliente.** Quien manipule `localStorage` o use una copia modificada de la app puede saltarse
  estas reglas; el servidor solo distingue PIN maestro y PIN de congregación. Cerrarlo de verdad exige claves separadas por
  nivel de sensibilidad (cifrado por sobres) para que lo que no te corresponde no se pueda descifrar.
- Los guardias están en las dos pantallas de administración, no en las funciones de `AuthContext`
  (`assignPersonalPinToPublisher`, `assignRoleToEmail`), porque el flujo de registro las usa para crear al coordinador inicial.
- `userRolesList` (correo → rol) vive en el dispositivo; la protección del login con Google cubre el rol Coordinador, no
  otros roles.
- Siguen pendientes de la revisión inicial: hashes de PIN personal dentro del payload público, firma de sesión de rol con
  clave embebida, PINs personales en claro dentro del payload cifrado y el límite de intentos del PIN personal (local).

## Siguiente fase propuesta

1. Conectar los 18 permisos decorativos a los componentes (o eliminarlos de la matriz para que no engañen).
2. Sacar los hashes de PIN personal del payload público y verificarlos en la Edge Function con límite de intentos.
3. Cifrado por sobres: una clave por categoría (S-21/médicos, cuentas, programación…) entregada solo a los roles que corresponden.
