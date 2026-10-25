# 📋 Registro de Versiones y Novedades — Kongre

Bienvenido al historial oficial de actualizaciones de **Kongre**. Aquí encontrarás de manera clara y sencilla todas las nuevas funciones, mejoras visuales y medidas de seguridad incorporadas en cada versión para la gestión teocrática de tu congregación.

---

## 🚀 Versión Actual

### [v2.12.24] — 25 de Octubre, 2026
**Token de Rol Firmado por el Servidor y Fase 2 de la Bóveda Local para Salud (DPA) y Notas Confidenciales**

- 🛡️ **Token Firmado por el Servidor para PIN Personal (`kgr_srt1` con HMAC-SHA256):**
  - **Generación en Edge Function (`kongre-sync`):** Al validar el PIN personal del publicador, el servidor genera un token firmado criptográficamente con el secreto del servidor (`pepper`), vinculando con firma constante el ID de la congregación, el ID del publicador, el rol teocrático primario, los roles departamentales secundarios y una expiración de 30 días.
  - **Protección contra Manipulación en DevTools:** El cliente valida la sesión local contra este token de servidor. Si un usuario intenta modificar variables locales como `kongre_active_role_v1` o elevar sus privilegios a Anciano o Coordinador, la sesión es invalidada de inmediato impidiendo cualquier escalada fraudulenta.
  - **Nuevo Endpoint `verify_role_token`:** La Edge Function provee verificación directa y en tiempo real de la vigencia e integridad de tokens emitidos.
- 🔐 **Fase 2 de la Bóveda Local en Reposo (`kgr_sec4:` respaldado por IndexedDB):**
  - **Protección de Datos Médicos DPA y Notas de Ancianos:** Se amplió la protección criptográfica para cubrir la Directiva Médica Anticipada (DPA), representantes de atención médica, alergias a fármacos, condiciones médicas crónicas y las notas espirituales/confidenciales de los ancianos.
  - **Cifrado AES-256 no extraíble (`atRestVault`):** Estos campos ahora se cifran bajo el formato `kgr_sec4:` en modo Counter autenticado (CTR + MAC), cuya clave deriva de la CryptoKey no extraíble (`extractable: false`) residente en IndexedDB. Incluso ante un volcado total de `localStorage`, un atacante no puede descifrar los datos médicos ni las notas sin la clave del navegador.
  - **Retrocompatibilidad Total:** Lectura y migración transparente de registros anteriores en formatos `kgr_sec3:`, `kgr_sec2:` y texto plano sin alterar la experiencia de usuario.

---

## 📅 Historial de Actualizaciones Anteriores

### [v2.12.23] — 25 de Octubre, 2026
**Rediseño Arquitectónico desde Cero de Estado Espiritual y las 11 Tarjetas del Publicador con Bloques Numerados y Cintas de KPIs**

- 🛡️ **Rediseño Total desde Cero de Estado Espiritual (`PrivilegesSection`):**
  - **Bloque 1 — Cabecera Ejecutiva, Selector de Rol y Cinta de KPIs:** Conmutador superior de **Esperanza S-21** (*Otras ovejas* / *Ungido*), 4 tarjetas arquitectónicas de rol teocrático (*Anciano*, *Siervo Ministerial*, *Publicador Bautizado* y *Publicador No Bautizado*) y cinta de 4 indicadores en tiempo real (*Tiempo de Bautismo*, *Modalidad de Servicio*, *Grupo de Servicio* y *Cuidado Pastoral*).
  - **Bloque 2 — Línea de Tiempo de Hitos Espirituales (`01–04`):** Tarjetas cronológicas para *Inicio como Publicador*, *Fecha de Bautismo S-21*, *Nombramiento / Inicio de Precursorado* y *Última Escuela de Precursores*, cada una con cálculo automático de tiempo transcurrido (`X años, Y meses`).
  - **Bloque 3 — Espacio Operativo en Dos Columnas:** Panel izquierdo para *Modalidad del Servicio de Precursor* (con meta de horas) y *Asignación en Grupo de Servicio del Campo* (*Publicador*, *Sup. Grupo*, *Auxiliar*); panel derecho para *Visitas de Pastoreo y Progreso Espiritual*, *Estado de Actividad Mensual* y un cajón colapsable discreto de *Registro Confidencial del Comité*.
  - **Bloque 4 — Matriz Filtrable de 16 Departamentos y Responsabilidades:** Pestañas de filtro (*Todos (16)*, *Asignados*, *Enseñanza y Comité*, *Cuentas y Territorios*, *Salón y Audio/Video*) y filas con controles segmentados de 3 estados (`No | Titular | Auxiliar`).
- 🏛️ **Arquitectura Multi-Bloque con Cintas de KPIs en Todas las Tarjetas del Publicador (`01` a `11`):**
  - **Información Personal (`01`), Contacto y Ubicación (`02`) y Directriz Médica DPA (`04`):** Cintas superiores de 4 indicadores tabulares y bloques numerados (`1.`, `2.`, `3.`) para filiación familiar, separación automática de nombres, captura GPS con enlaces a Google Maps/Waze, plazas de vehículo y representantes médicos del directorio.
  - **Asignaciones (`06`), Condiciones Especiales (`09`) y Ausencias y Notas (`10`):** Cinta de KPIs de habilitación por reunión, barra de filtros por área (*Todas*, *Activas*, *Vida y Ministerio*, *Fin de Semana y Campo*, *Acomodación, A/V y Salón*), panel pedagógico `S-38` y bosquejos (`1–194`), matriz de accesibilidad/traslado de congregación y calendario de ausencias con cálculo de días acumulados.
- 🔐 **Endurecimiento de Seguridad Cero Conocimiento y Bóveda Criptográfica en Reposo:**
  - **Bóveda no extraíble `atRestVault` (IndexedDB AES-256-GCM):** Almacenamiento seguro de credenciales con clave criptográfica creada con `extractable: false`, autenticación de datos asociados (AAD) y migración transparente de credenciales previas.
  - **Derivación Robusta PBKDF2 (200.000 iteraciones):** Sustitución de hashes locales rápidos por PBKDF2 con sal aleatoria criptográfica, purga de `${key}_hash` en localStorage y erradicación de almacenamiento en texto claro en `sessionStorage`.
  - **Rotación Segura de Credenciales en la Nube (`RotateCredentialsModal`):** Asistente interactivo en Ajustes para rotar de forma independiente o simultánea el PIN de Congregación (Crockford Base32 `XXXX-XXXX`) y el PIN Maestro (12 dígitos), con re-cifrado en el cliente e invalidación inmediata de accesos anteriores en Supabase.
  - **Blindaje del Despliegue de Base de Datos:** Reubicación del rollback de emergencia fuera del directorio de migraciones automáticas (`supabase/rollback/`) para garantizar que `supabase db push` preserve siempre el cierre de permisos públicos.

---

## 📅 Historial de Actualizaciones Anteriores

### [v2.12.22] — 25 de Octubre, 2026
**Rediseño Editorial Completo de las 11 Tarjetas del Publicador, el Hub de Categorías, Registro S-21, Contactos de Emergencia y Credenciales PIN/QR**

- 🏛️ **Cabecera Ejecutiva, Pestañas Numeradas (`01–11`) y Nuevo Hub de Tarjetas (`PublisherEditor`):**
  - **Cabecera Ejecutiva Unificada:** Avatar con iniciales del publicador, edición rápida del nombre en línea, metadatos tipográficos separados por punto medio (`ID · Rol · Grupo · Edad · Estado de sincronización`) y medidor compacto de integridad de la ficha.
  - **Mosaico Editorial sin Cajas Anidadas:** Rediseño de las 11 tarjetas del Hub eliminando sub-cajas redundantes en favor de filas limpias separadas por líneas sutiles (*hairlines*) y numeración `tabular-nums`.
  - **Navegación Secuencial entre Tarjetas:** Nueva barra inferior dentro de cada sección que permite avanzar o retroceder directamente entre las 11 tarjetas (*Anterior / Siguiente tarjeta*) sin tener que regresar cada vez al Hub.
- 📊 **Rediseño del Registro Oficial de Publicador `S-21` (`S21RecordsSection`):**
  - **Selector Multi-Año (`2024–2027`) y Cinta de KPIs Anuales:** Resumen superior con cifras tabulares de *Meses Activos (`X/12`)*, *Total de Horas (con crédito)*, *Promedio Mensual*, *Cursos Bíblicos (promedio y máximo)* y *Meses de Precursor Auxiliar*.
  - **Acciones Rápidas de Secretaría y Exportación:** Botón **«Año activo»** para marcar los 12 meses de participación en un clic, botón por fila para **copiar los datos del mes anterior** y descarga directa de la tarjeta anual en formato **CSV**, acompañado de una curva anual limpia de horas y cursos bíblicos.
- 🚨 **Rediseño de Contactos de Emergencia (`EmergencyContactsSection`):**
  - **Importación desde el Directorio y desde el DPA:** Buscador integrado para vincular a cualquier hermano de la congregación como contacto de emergencia, estado vacío asistido con botón para importar en un clic al representante médico del DPA y etiquetas rápidas de parentesco en el modal (*Esposo(a)*, *Padre / Madre*, *Hijo(a)*, *Hermano(a) carnal*, *Hermano(a) de la congregación*).
  - **Acciones Directas Siempre Accesibles:** Botones de edición y eliminación visibles en pantallas táctiles y móviles, junto con botones de un clic para **Llamar**, abrir **WhatsApp**, **Copiar teléfono** y enviar **Correo**.
- 🔐 **Rediseño de Credenciales de Acceso y PIN Personal (`AccessCredentialsSection`) y Coherencia en las 11 Secciones:**
  - Espacio de trabajo unificado en dos columnas (*PIN Personal y Fortaleza* + *Nivel de Acceso y Permisos en la Aplicación*), papeleta imprimible con código QR renovada y cabeceras editoriales consistentes en las 11 tarjetas del publicador.

---

## 📅 Historial de Actualizaciones Anteriores

### [v2.12.21] — 25 de Octubre, 2026
**Renovación Integral de las Tarjetas del Publicador: Información Personal, Contacto y Ubicación, Estado Espiritual, DPA, Asignaciones e Historial**

- 👤 **Tarjeta de Información Personal (`BasicInfoSection`):**
  - **Nombre y Edad Inteligente:** Edición rápida de nombre completo con auto-separación en 4 campos, cálculo automático de edad y etapa de vida (*Niño(a)*, *Joven menor*, *Joven adulto*, *Adulto*, *Edad Avanzada 65+*) con botones de sugerencia rápida para marcar indicadores congregacionales.
  - **Filiación, Núcleo Familiar, Idiomas y Oficios:** Selector de 5 estados civiles, interruptores siempre visibles de *Cabeza de Familia* y *Menor de Edad*, selector de Padre/Madre o Tutor responsable, vinculación de cónyuge y etiquetas interactivas de **Idiomas** (incluyendo Lengua de Señas) y **Oficios / Habilidades Prácticas** para mantenimiento y emergencias.
- 📍 **Tarjeta de Contacto, Ubicación y Movilidad (`ContactSection`):**
  - **Acciones Directas y Ubicación GPS:** Botones de un clic para copiar, llamar, abrir WhatsApp o redactar correo, selector de medio preferido de contacto, campo de *Referencias del domicilio / entre calles*, captura de coordenadas GPS actuales y enlaces directos a **Google Maps** y **Waze**.
  - **Transporte y Literatura Impresa:** Selector de asientos disponibles en vehículo (`2` a `7` plazas) para apoyo al grupo de predicación y preferencias de publicaciones impresas incluyendo **Letra Grande**.
- 🛡️ **Tarjeta de Estado Espiritual y Privilegios (`PrivilegesSection`):**
  - **Trayectoria S-21 y Precursorado:** Botones directos para los 4 roles (*Anciano*, *Siervo Ministerial*, *Publicador Bautizado* y *No Bautizado*), selector explícito de **Esperanza S-21** (*Otras ovejas* / *Ungido*), fecha de nombramiento, fecha de inicio de precursorado y fecha de la última **Escuela del Servicio de Precursor**.
  - **Grupos de Servicio y Pastoreo:** Terminología teocrática oficial (*Publicador*, *Sup. Grupo*, *Auxiliar*), seguimiento de la última visita de pastoreo con antigüedad automática, ancianos visitadores, nivel de prioridad pastoral (*Normal*, *Pronto*, *Urgente*) y notas de progreso espiritual.
- 🏥 **Directriz Médica DPA, Asignaciones, Condiciones Especiales e Historial:**
  - **DPA y Salud (`MedicalDpaSection`):** Buscador de representantes de atención médica en el directorio de la congregación, botones de llamada/WhatsApp de urgencia, indicador de copia en archivo, alerta de revisión anual (`+1 año`) y campos separados para alergias y condiciones médicas.
  - **Asignaciones (`AssignmentsSection`), Condiciones (`SpecialConditionsSection`) e Historial (`PublisherHistoryPanel`):** Corrección de colores estáticos en Tailwind v4, selector de lección actual del folleto *Maestros* (`1–20`), registro de bosquejos de discursos públicos (`1–194`), indicadores de conexión regular por Zoom y asiento preferencial, panel de seguimiento de mudanza de congregación (carta de presentación y tarjeta `S-21`), barra de integridad de ficha en el Hub y auditoría de cambios con reversión en navegador.

---

## 📅 Historial de Actualizaciones Anteriores

### [v2.12.20] — 25 de Octubre, 2026
**Analítica Gráfica con Recharts y Selector Multi-Grupo de Servicio en el Tablero de Equidad (`EquidadDashboardTab`)**

- 📊 **Visualización Comparativa con Recharts y Detección Gráfica de Desequilibrios:**
  - **4 Modos de Análisis Gráfico:** *Por Áreas (Apilado)* (desglose de puntos en Enseñanza, Estudiantil/Lectura, Deberes/Audio, Campo/Carritos y Oraciones junto con curva de N° de asignaciones), *Brecha vs. Privilegio* (comparación de cada publicador frente al promedio de su cuerpo/privilegio), *Cuerpos y Estados* (rango mínimo, promedio y máximo por cuerpo junto con gráfico de dona interactivo) y *Por Grupos* (comparativa directa entre grupos de servicio).
  - **Líneas de Referencia y Selector de Muestra:** Indicadores visuales del promedio filtrado y del umbral de sobrecarga (`140%`), con vistas rápidas de contraste (*8 Más vs. 8 Menos Cargados*, *Top 15 Mayor Carga*, *Top 15 Menor Carga* y *Vista General*) e inspector detallado al hacer clic en cualquier barra.
- 👥 **Selector y Filtro Multi-Grupo de Servicio en Tiempo Real:**
  - Selector desplegable rápido y barra interactiva de *chips* por grupo de predicación que permiten filtrar un único grupo o comparar varios grupos de servicio específicos de forma simultánea.
  - Sincronización integral entre el selector superior, la barra multi-grupo, la tabla de radiografía por publicador y las tarjetas inferiores de grupos de predicación, incluyendo sufijos identificadores `(G#N)` en los gráficos al comparar múltiples grupos.

---

## 📅 Historial de Actualizaciones Anteriores

### [v2.12.19] — 25 de Octubre, 2026
**Centro Local y Motor Universal de Carga y Relleno Automático de Plantillas PDF Oficiales (`S-21`, `S-89`, `S-140`, `S-88`, `S-13`, `S-26`, `S-30`, `S-25`, `S-28` y `S-1`)**

- 📄 **Carga de Plantillas PDF Oficiales en Blanco (100% Local):**
  - En cumplimiento estricto con las políticas de propiedad intelectual, **Kongre jamás genera ni dibuja formularios oficiales desde cero**.
  - Cada usuario carga localmente desde su dispositivo su propio archivo PDF oficial en blanco (descargado de *jw.org* / *JW Hub*) y la aplicación lo rellena automáticamente en el navegador con los datos reales de la congregación usando `pdf-lib`.
- 🧠 **Ordenamiento Visual Inteligente de Campos Interactivos (`AcroForm`):**
  - Algoritmo de inspección espacial (`sortPdfFieldsVisually`) que ordena todos los cuadros de texto, casillas de verificación, listas desplegables y botones de opción por coordenadas visuales `(página, fila superior a inferior, columna izquierda a derecha)`.
  - Garantiza compatibilidad universal con cualquier idioma, edición o revisión de los formularios oficiales sin depender de nombres internos rígidos de campos, e incluye estampado por coordenadas como respaldo para PDFs aplanados.
- 🗂️ **Cobertura Completa de los 10 Formularios Teocráticos (`LocalOfficialFormsCenter` y `OfficialPdfModal`):**
  - **Registro de Publicador (`S-21`):** Relleno individual o generación de un único PDF multipágina por lotes (por grupo de servicio, precursores o toda la congregación), marcando sexo, esperanza, privilegios, horas, cursos bíblicos, notas y totales anuales.
  - **Asignaciones VMC (`S-89`) y Programa (`S-140`):** Relleno de hojas `S-89` (plantillas de 1 por página o 4 por página en cuadrícula con paginación automática) y plantilla semanal `S-140`.
  - **Asistencia (`S-88`), Territorios (`S-13`), Cuentas (`S-26`, `S-30`, `S-25`), Literatura (`S-28`) e Informe a la Sucursal (`S-1`):** Almacenamiento local en `IndexedDB` (o modo exclusivo en memoria RAM por sesión), inspector de campos detectados y botones directos de **«PDF Oficial»** integrados en cada módulo.

---

### [v2.12.18] — 25 de Octubre, 2026
**Auditoría de Secretaría, Carpeta Ejecutiva de Visita del Sup. de Circuito, Literatura (`S-28`/`S-14`), Mantenimiento/Emergencias y Contabilidad (`S-26`/`S-30`/`S-25`)**

- 📋 **Auditoría de Secretaría y Meta Anual de Precursores (600 h):**
  - Seguimiento en tiempo real del ritmo anual de los precursores regulares y especiales durante el año de servicio (meta de 600 horas, créditos de horas aprobados, promedio mensual y semáforo visual *En Meta / Atención / Rezagado*).
  - Panel de cuidado pastoral para identificar oportunamente publicadores irregulares o en riesgo de inactividad.
- 🧳 **Carpeta Ejecutiva (Dossier A4) para la Visita del Superintendente de Circuito:**
  - Nueva pestaña en **Visita del Sup. de Circuito** y en **Tarjetas S-21** que consolida automáticamente la radiografía completa de la congregación: estructura de publicadores y nombrados, precursores, promedios de estudios bíblicos, asistencia `S-88`, cobertura de territorios `S-13` y estado por grupo de servicio, lista para imprimir en formato A4 o compartir por WhatsApp.
- 📚 **Gestión Integral de Literatura (`S-28` / `S-14`) y Pedidos Especiales por Grupo:**
  - Diagnóstico automático de inventario (artículos agotados, stock bajo y cálculo de cantidad sugerida de reposición a la sucursal).
  - Seguimiento de pedidos especiales agrupados por grupo de servicio con avisos directos por WhatsApp al publicador o superintendente de grupo cuando el artículo llega al Salón del Reino, entregas por grupo y registro de recuentos físicos.
- 🛠️ **Calendario Anual de Mantenimiento Preventivo y Plan de Preparación ante Emergencias:**
  - **Matriz Anual de Mantenimiento (Septiembre – Agosto):** Programación visual de todas las fichas técnicas a lo largo de los 12 meses del año de servicio con porcentaje de cumplimiento y estimación de horas anuales.
  - **Plan de Preparación ante Emergencias y Desastres:** Árbol de contacto pastoral por grupo de servicio, directorio de hermanos con capacitación médica/primeros auxilios, vehículos disponibles para evacuación o apoyo, responsables con llaves del Salón e integración con el mapa de cortacircuitos del panel eléctrico (imprimible en A4 y enviable por WhatsApp).
- 🏦 **Contabilidad Congregacional Avanzada (`S-26`, `S-30` y Auditoría Trimestral `S-25`):**
  - Libro mensual `S-26` con cálculo de saldo acumulado línea por línea (`runningBalance`), desglose por fondos y conciliación interactiva entre extracto bancario y efectivo en caja.
  - Cálculo automático de la reserva operativa recomendada (2 meses de gastos locales) y excedente disponible para transferir a la sucursal.
  - Generador automático del texto oficial del anuncio mensual de cuentas (`S-30`) para lectura en la plataforma y módulo de **Auditoría Trimestral (`S-25`)** con verificación de comprobantes e impresión A4.

---

### [v2.12.17] — 25 de Octubre, 2026
**Suite Integral de Gestión Congregacional: Intercambio de Oradores, Deberes y Aseo, Carritos, Agrupación Familiar, Salidas al Campo, Cartelera Digital y Equidad Ponderada**

- 🎙️ **Motor de Intercambio de Oradores, Congregaciones Vecinas y Hospitalidad Inteligente:**
  - Directorio unificado de congregaciones vecinas (con horarios de reunión y datos de coordinadores) y catálogo de oradores visitantes.
  - Evaluador automático de repetición de bosquejos públicos y detector transversal de choques de agenda para oradores salientes (reunión de fin de semana, deberes, hospitalidad, carritos, salidas al campo y ausencias).
  - Sugeridor inteligente de familias anfitrionas de hospitalidad clasificado por puntaje de equidad, capacidad de invitados y alertas de alergias o dieta, con plantillas de WhatsApp para orador, anfitrión y coordinador vecino.
- 🧹 **Motor de Deberes Logísticos y Programa de Aseo Semanal/Profundo con Control de Insumos:**
  - Auto-asignación inteligente de Audio, Video, Micrófonos, Acomodadores, Plataforma, Seguridad y Zoom validando que ningún hermano tenga choque en la misma reunión o esté ausente.
  - Matriz de equidad de deberes y programación por grupos para aseo semanal regular, limpieza profunda (`S-28`), visita del superintendente de circuito y eventos especiales, incluyendo lista de verificación por áreas del Salón y semáforo de estado de insumos de aseo (*Insumos Completos / Reponer Pronto / Urgente Comprar*).
- 🛒 **Motor de Predicación Pública con Carritos y Emparejamiento Teocrático:**
  - Validación automática de cada turno de exhibidor público: reconocimiento de matrimonios/familiares y compañeros fijos, alerta ante parejas mixtas sin parentesco, detección de turnos solapados el mismo día y ausencias.
  - Auto-asignador equitativo según disponibilidad diaria de cada publicador/precursor, matriz de equidad y cuadrante imprimible A4.
- 👨‍👩‍👧‍👦 **Agrupación Familiar Inteligente, Reemplazos VMC y Despacho Mensual Unificado en 8 Módulos:**
  - Vinculación de núcleos familiares en la ficha del publicador con sugerencias automáticas por apellido o dirección compartida, e insignias en los selectores de asignación y reemplazos VMC cuando otro miembro de la familia ya participa en esa misma reunión.
  - **Consolidador Mensual Unificado (`unifiedMonthlyAssignments`):** Agrupa en un único resumen por hermano todas sus asignaciones del mes a través de 8 módulos (*Vida y Ministerio, Fin de Semana, Deberes, Limpieza, Carritos, Salidas al Campo, Orador Saliente y Hospitalidad*), permitiendo enviarlo en un solo WhatsApp desde `BatchWhatsAppModal` o `Mi Vista`, imprimir su hoja mensual personal o descargar un archivo de calendario `.ics` unificado.
- 📌 **Cartelera Digital del Salón del Reino y Generador Automático de Salidas al Campo:**
  - **Cartelera Digital Unificada:** Vista previa oficial e impresión A4 unificada para el tablero físico del Salón, boletín semanal consolidado para WhatsApp y descarga del calendario maestro `.ics` de la congregación.
  - **Generador de Salidas al Servicio del Campo:** Plantillas de bloques semanales (mañana, tarde, noche) y modalidades (*Casa en casa, Carritos, Revisitas/Estudios, Telefónica/Cartas, Negocios*) con asignación rotativa de conductores elegibles y recomendación automática de territorios con más tiempo sin trabajar.
- ⚖️ **Auditoría Ponderada de Carga Teocrática y Equidad Transversal (`EquidadDashboardTab`):**
  - Sistema de pesos configurables por rol y categoría (*Enseñanza Principal, Partes Estudiantiles, Deberes/Logística, Ministerio del Campo y Oraciones*) que calcula los puntos de esfuerzo real acumulados por cada hermano, identifica sobrecarga o subutilización, mide rachas semanales y genera informes de equidad imprimibles.

---

### [v2.12.16] — 23 de Octubre, 2026
**Optimización Integral de Experiencia Móvil (Auditoría UI/UX, Gestos Táctiles y Ergonomía)**

- 📱 **Cabecera Superior y Pie de Página Móvil Simplificados:**
  - Se redujo la densidad de iconos secundarios en la cabecera móvil (`< 640px`) trasladándolos al menú de cuenta y hoja inferior, y se compactó el pie de página interno a una sola línea discreta.
- 👆 **Navegación Táctil en Programa de Reuniones:**
  - Sub-cabecera de semanas fija (*sticky*) con soporte para deslizar horizontalmente (*swipe* izquierda/derecha) entre semanas, botón directo «Hoy» y agrupación de herramientas secundarias.
- 📊 **Cintas de KPIs Interactivas, Tablas con Primera Columna Fija y Modales *Bottom Sheet*:**
  - Los KPIs de Territorios y Publicadores funcionan como filtros rápidos deslizables en una sola fila móvil, las tablas fijan su primera columna al desplazar y los modales clave abren como hoja inferior.

---

### [v2.12.15] — 23 de Octubre, 2026
**Indicador de Carga Global (`LoadingSpinner`) durante la Sincronización con Supabase**

- ✨ **Componente Global `LoadingSpinner`:**
  - Nuevo indicador de carga con diseño *glassmorphism*, doble anillo orbital en rotación inversa e indicación de cifrado **Zero-Knowledge AES-256-GCM**.
- 🔄 **Superposición sobre el Contenido de cada Pestaña:**
  - Se muestra automáticamente sobre el contenedor de la pestaña activa mientras se realiza la sincronización de datos (carga inicial, subida cifrada o sincronización bidireccional) con Supabase, indicando el nombre de la vista en actualización.

---

### [v2.12.14] — 23 de Octubre, 2026
**Redacción Institucional y Profesional de Términos de Uso y Política de Privacidad**

- ⚖️ **Marco Normativo de Términos de Uso Teocrático:**
  - Reestructuración integral con lenguaje formal, claro e institucional dividido en 5 cláusulas normativas: Alcance Operativo e Independencia Institucional (aclaración expresa de no afiliación oficial con *jw.org*), Gobernanza de Accesos y Roles (RBAC en 3 niveles de PIN + 2FA TOTP), Confidencialidad y Uso Ético del Directorio, Arquitectura *Offline-First* y Responsabilidad de Respaldo, y Limitación de Responsabilidad y Baja Definitiva.
- 🔒 **Política de Privacidad, Cifrado y Protección de Datos:**
  - Documentación detallada de la arquitectura de **Conocimiento Cero (*Zero-Knowledge*)**, especificando el cifrado en el cliente mediante **AES-256-GCM** y derivación de llaves **PBKDF2-HMAC-SHA256** (hasta 600.000 iteraciones), principio de minimización de datos, cumplimiento de la cláusula de *Uso Limitado (Limited Use)* de Google OAuth 2.0 y ejercicio de derechos **ARCO+** (Acceso, Rectificación, Cancelación, Oposición, Portabilidad y Olvido Digital).
- 🌐 **Sincronización con Páginas Estáticas Oficiales (`/terms` y `/privacy`):**
  - Las páginas públicas estáticas en español e inglés han sido actualizadas con el mismo estándar profesional para usuarios y revisores de seguridad.

---

### [v2.12.13] — 23 de Octubre, 2026
**Vistas Dedicadas de Página Completa para Registro de Versiones (Changelog) y Términos y Privacidad**

- 📄 **Registro de Versiones (Changelog) en Página Completa:**
  - El historial de versiones y novedades ya no se abre en un cuadro emergente (*pop-up*), sino como una página completa de lectura cómoda con su botón superior «← Volver atrás».
- ⚖️ **Términos de Uso y Política de Privacidad en Página Completa:**
  - Los Términos de Uso y la Política de Privacidad (así como la pantalla de aceptación de primer ingreso) ahora se despliegan en una vista dedicada de página completa sin ventanas flotantes ni fondos superpuestos.

---

### [v2.12.12] — 23 de Octubre, 2026
**Aceptación Obligatoria de Términos de Uso y Política de Privacidad en Registro y Primer Ingreso**

- ⚖️ **Aceptación en el Registro de Congregación:**
  - En el último paso del asistente de registro, el coordinador debe confirmar que ha leído y acepta los **Términos de Uso** y la **Política de Privacidad** antes de registrar y activar la congregación.
- 🔐 **Aceptación en el Primer Inicio de Sesión:**
  - Al ingresar por primera vez mediante **Google**, **ID y PIN de Congregación** o **Código de Invitación**, se presenta una casilla interactiva obligatoria con enlaces directos para abrir y leer los Términos de Uso y la Política de Privacidad sin salir de la pantalla.
  - Al pulsar «Entendido y Aceptar» dentro del visor legal, la casilla queda marcada automáticamente y se guarda la aceptación en el dispositivo para no volver a solicitarla en futuros ingresos.
- 🛡️ **Ventana de Consentimiento en Acceso por Enlace Directo o QR:**
  - Si un hermano ingresa por primera vez escaneando un código QR o abriendo un enlace directo sin haber aceptado aún las condiciones, el sistema muestra el resumen interactivo de Términos y Privacidad para su aceptación previa.

---

## 📅 Historial de Actualizaciones Anteriores

### [v2.12.11] — 23 de Octubre, 2026
**Autenticación de Dos Pasos (2FA) con Microsoft Authenticator y Códigos de Respaldo**

- 📱 **Verificación en Dos Factores con Microsoft Authenticator (Opcional):**
  - Cada publicador puede activar de forma totalmente voluntaria la verificación en dos pasos en su portal ("Mi Vista" > pestaña "Seguridad 2FA").
  - Compatible de forma nativa con **Microsoft Authenticator**, Google Authenticator y cualquier aplicación TOTP estándar.
  - Escaneo sencillo con código QR o mediante clave secreta alfanumérica copiable.
- 💾 **Códigos de Respaldo de Emergencia (8 Códigos de Un Solo Uso):**
  - Al activar 2FA, se generan 8 códigos de recuperación imprimibles o descargables en texto para recuperar el acceso si pierdes o cambias de teléfono.
  - Cada código se almacena en el sistema únicamente como hash seguro SHA-256 (arquitectura de conocimiento cero).
- 🕒 **Dispositivos de Confianza ("Recordar este dispositivo por 30 días"):**
  - No necesitas introducir el código de 6 dígitos cada vez que uses tu propio teléfono. Al marcar la casilla de confianza, el sistema solo te pedirá el código 2FA cuando ingreses en un dispositivo nuevo o si han pasado más de 30 días sin actividad.
- 🏛️ **Herramientas para Ancianos y Administración Teocrática:**
  - En el Directorio Teocrático, los ancianos pueden ver qué publicadores tienen 2FA activo con una insignia verde identificativa (`2FA`).
  - Si un hermano extravía su teléfono o aplicación autenticadora, un anciano puede restablecer su 2FA con un solo clic para que pueda volver a ingresar con su PIN habitual.
- ⚡ **100% Autónomo y Fuera de Línea:**
  - La verificación de códigos se calcula íntegramente en el dispositivo del usuario con la API nativa del navegador (Web Crypto API), funcionando perfectamente sin conexión a internet.

---

## 📅 Historial de Actualizaciones Anteriores

### [v2.12.10] — 23 de Octubre, 2026
**Páginas Oficiales de Privacidad y Términos de Uso para Verificación de Google**

- 📜 **Acceso Directo y Universal a Términos y Privacidad:**
  - Los enlaces directos `https://kongre-app.com/#privacy` y `https://kongre-app.com/#terms` (así como `/privacy` y `/terms`) abren de inmediato los documentos legales correspondientes tanto en la aplicación interactiva como en navegadores sin iniciar sesión.
  - Se crearon páginas web dedicadas e independientes (`/privacy` y `/terms`) que cargan al instante incluso sin conexión o en navegadores antiguos.
- 🛡️ **Claridad Total sobre el Acceso con Google:**
  - Se añadió la declaración oficial de cumplimiento con la *Política de Datos de Usuario de Google* (Google API Services User Data Policy) y los requisitos de Uso Limitado (Limited Use), explicando con total transparencia que solo se accede al nombre, correo y foto para verificar al usuario y que los datos jamás se comparten ni comercializan.

---

## 📅 Historial de Actualizaciones Anteriores

### [v2.12.9] — 23 de Octubre, 2026
**Corrección en Cambio de Cuenta con Google**

- 🔄 **Cambio y Selección de Cuentas de Google Fluido:**
  - Al pulsar "Cambiar cuenta" y conectar de nuevo con Google, el selector de cuentas se abre siempre de forma limpia para que puedas elegir tu cuenta preferida.
  - Se corrigió un detalle que hacía que, al volver de Google tras cambiar de cuenta, la pantalla quedara esperando o volviera a mostrar el botón "Continuar con Google". Ahora la sesión se valida al instante y muestra directamente tu tarjeta de cuenta verificada.

---

## 📅 Historial de Actualizaciones Anteriores

### [v2.12.8] — 23 de Octubre, 2026
**Navegación Fluida en el Portal y Corrección en Menú de Google**

- 🧭 **Sincronización Precisa de Pantalla y Enlace:**
  - Se corrigió un problema donde refrescar la página en `#portal` mostraba la pantalla de inicio con Google en lugar del portal principal.
  - La barra de direcciones ahora refleja exactamente la opción en la que te encuentras (Google, Conectar con ID y PIN, o Invitación) y permite retroceder o refrescar sin perder tu ubicación.
- 🧹 **Higiene de Sesión:**
  - Al pulsar "Volver" o usar las flechas del navegador para regresar al portal de bienvenida, las pantallas temporales de inicio de sesión se limpian de inmediato.

---

## 📅 Historial de Actualizaciones Anteriores

### [v2.12.7] — 23 de Octubre, 2026
**Blindaje de Privacidad en Vista Personal, Cierre por Inactividad y Protección del Sistema**

- 🔒 **Mayor Privacidad en Vista Personal:**
  - El PIN de acceso ahora se conserva únicamente en la memoria de la sesión activa y se cifra de forma segura en tu dispositivo. Al cerrar sesión, todas las credenciales temporales se purgan de inmediato.
  - **Auto-cierre por Inactividad (5 min):** Para proteger la privacidad en dispositivos o tabletas compartidas en el Salón del Reino, el portal personal se cierra automáticamente tras 5 minutos sin uso.
  - **Protección contra Intentos Repetidos:** Si se ingresa un PIN erróneo varias veces consecutivas, la pantalla muestra una cuenta regresiva visual (`⏳ Bloqueo de seguridad: espera Xs`) e inhabilita temporalmente el teclado para impedir intentos automatizados.
  - **Protección de Navegador:** Se activaron atributos para evitar que navegadores compartidos guarden o autocompleten el PIN personal sin autorización.
  - **Respuesta Táctil:** Vibración suave y animación de sacudida para confirmar errores de PIN de forma clara e intuitiva.

- ⚡ **Sincronización más Estable y Rápida:**
  - El servidor valida de forma estricta los identificadores de publicadores y limita la carga a un máximo de 500 hermanos por congregación, evitando sobrecargas de procesamiento y asegurando un servicio ágil para todos.
  - Se bloquean intentos maliciosos de saturar la base de datos con consultas inválidas.

- 🛡️ **Seguridad contra Manipulación de Permisos:**
  - La pantalla de bloqueo y los permisos de usuario están blindados para impedir que se omita la seguridad simulando un modo de demostración en una congregación real.
  - Las credenciales de rol quedan firmadas criptográficamente y ligadas de forma única a tu dispositivo y a tu congregación activa, impidiendo su reutilización en otros salones o dispositivos.

- 📄 **Registro de Auditoría Seguro:**
  - Las acciones registradas en el historial de auditoría enmascaran cualquier número de PIN o identificador sensible mediante claves de seguridad, impidiendo que terceros puedan deducir credenciales a partir de los registros.
  - Detección y ocultamiento automático de contraseñas accidentales en las descripciones de eventos (`••••`).

---

## 📅 Historial de Actualizaciones Anteriores

### [v2.12.6] — 23 de Octubre, 2026
**Cifrado de Grado Militar en el Dispositivo, Navegación Protegida y Salto de Seguridad OWASP**
- **Cifrado Fuerte de Datos Sensibles:** Los datos de salud, contactos de emergencia y teléfonos personales en tu dispositivo ahora se protegen con cifrado de flujo por bloques de última generación ligado al hardware del dispositivo.
- **Protección Web Estricta (CSP Bloqueador):** La aplicación no permite la ejecución de scripts no autorizados ni enlaces externos sospechosos, garantizando un entorno totalmente blindado.
- **Limpieza de Credenciales en la Barra del Navegador:** Ningún enlace o código QR deja contraseñas visibles en la barra de direcciones; las URLs se limpian al instante al cargar.

### [v2.12.5] — 23 de Octubre, 2026
**Seguridad Web en Producción y Optimización de Memoria**
- **Protección contra Secuestro de Clics (Clickjacking):** La app no puede ser incrustada en páginas externas no autorizadas.
- **Rendimiento Mejorado Fuera de Línea:** Almacenamiento optimizado para que la app instalada en móviles funcione más rápido sin consumir almacenamiento innecesario.

### [v2.12.4] — 23 de Octubre, 2026
**Invitaciones de Alta Seguridad y Facilidad de Entrada**
- **Códigos Imposibles de Adivinar:** Los nuevos códigos de invitación para publicadores y ancianos adoptan 10 caracteres aleatorios de alta seguridad (`KONG-[ROL]-XXXXX-XXXXX`).
- **Escritura Flexible:** Puedes escribir o pegar tu código con o sin guiones, con o sin el prefijo `KONG-`, o en minúsculas. El sistema lo reconoce y valida automáticamente.

### [v2.12.3] — 23 de Octubre, 2026
**Minimización de Datos en Nube (Ley 1581 de Protección de Datos)**
- **Mayor Reserva de Informes:** Los informes mensuales de predicación personales y correos electrónicos de los hermanos se retiraron del contenido público general, quedando reservados exclusivamente para el cuerpo de ancianos.
- **App Más Ligera:** Depuración profunda de componentes internos, reduciendo el peso de la aplicación.

### [v2.12.2] — 23 de Octubre, 2026
**Protección de Datos Médicos, Dominio Oficial y Enlaces Temporales**
- **Dominio Oficial:** Lanzamiento en la dirección web oficial `https://kongre-app.com` con conexión cifrada de alta velocidad.
- **Protección Médica y DPA:** Alergias, directivas médicas anticipadas y notas pastorales se guardan cifradas en el dispositivo del hermano autorizado.
- **Enlaces con Caducidad:** Los enlaces compartidos y códigos QR expiran automáticamente a los 7 días y no transportan claves de congregación.

### [v2.12.1] — 23 de Octubre, 2026
**Acceso con Google en 1 Clic y Pantalla Completa**
- **Acceso Directo con Google:** Ya no es necesario hacer doble clic; la aplicación recuerda tu congregación y te conecta automáticamente al iniciar sesión.
- **Diseño Amplio de Bienvenida:** Las ventanas de acceso aprovechan todo el ancho de la pantalla, con campos simétricos para el ID y el PIN de la congregación.

### [v2.12.0] — 23 de Octubre, 2026
**Sincronización en la Nube de Cero Conocimiento**
- **Arquitectura Privada:** Nueva sincronización donde el servidor en la nube nunca conoce las contraseñas, los PINs ni el contenido íntimo de tu congregación.

---

### [v2.10.8] — 21 de Octubre, 2026
**Más Espacio en Pantalla y Arranque Directo con Contenido**
- **Más Espacio Vertical:** Se eliminaron tarjetas y encabezados que duplicaban el nombre de la sección en 27 módulos. Toda la aplicación arranca de inmediato con sus tablas, filtros y herramientas útiles.
- **Barra de Navegación Unificada:** La barra superior fija muestra siempre tu congregación y sección actual con un diseño limpio estilo Notion y Linear.

### [v2.10.7] — 21 de Octubre, 2026
**Reloj Animado de Bloqueo por Inactividad y Alerta Suave**
- **Contador en Barra Superior:** Chip interactivo con anillo de progreso y cuenta regresiva de minutos restantes de inactividad.
- **Aviso Flotante en los Últimos 60 Segundos:** Alerta suave en la parte inferior de la pantalla antes del bloqueo; tocar cualquier parte restablece el tiempo al instante.
- **Selector de Tiempo en Ajustes:** Deslizador para configurar el bloqueo automático entre 5, 10 o 15 minutos según las necesidades del salón.

### [v2.10.5 & v2.10.6] — 21 de Octubre, 2026
**Botón de Modo Oscuro Minimalista y Herramientas Agrupadas**
- **Transición Sol ⇄ Luna:** Nuevo botón con animación fluida y alto contraste en modo oscuro para facilitar la lectura nocturna.
- **Herramientas de Ajustes en una Sola Fila:** Los botones "Guardar Ajustes" y "Mi Perfil" se integraron en la misma fila que las pestañas para mayor comodidad.

### [v2.10.4] — 21 de Octubre, 2026
**Sincronización Total de 20 Módulos y Guardado Automático**
- **Guardado Automático:** Cambios en programas de reunión, territorios, discursos, asistencia, carritos, paneles eléctricos y mantenimiento se sincronizan solos en segundo plano.
- **Cola sin Conexión Confiable:** Si estás sin internet en el Salón o en el territorio, tus registros se guardan en el teléfono y se suben solos al restablecerse la conexión.

### [v2.10.0 a v2.10.3] — 21 de Octubre, 2026
**Suite del Publicador, Gestos Táctiles y Accesos Directos Móviles**
- **Herramientas para el Ministerio:** Cronómetro de predicación persistente (sigue contando al bloquear el teléfono), meta mensual de horas, agenda de revisitas con enlace a WhatsApp y control de lecciones de cursos bíblicos.
- **Gestos Móviles (Swipe):** Deslizar el dedo desde el borde abre y cierra el menú lateral con total fluidez.
- **Modo Atril a Pantalla Completa:** Vista amplia sin distracciones para oradores y presidentes de reunión.
- **Icono Oficial e Instalación Móvil:** Accesos directos al mantener presionado el icono de la app en Android y iPhone (*Programación, Territorios, Asistencia y Anuncios*).

---

### [v2.9.0 a v2.9.2] — 20 y 21 de Octubre, 2026
**Formatos Oficiales en Local, Avisos Push y Gestión de Roles**
- **Llenado Local de Formatos Oficiales (S-21, S-89, S-140, S-88):** Completa papeletas e historiales en PDF directamente desde tu navegador sin subir documentos oficiales a la nube.
- **Notificaciones Push en Segundo Plano:** Recordatorios de asignaciones y turnos que llegan a tu teléfono móvil incluso si la app o el navegador están cerrados.
- **Gestor de Roles a Pantalla Completa:** Panel interactivo para asignar y renovar PINs personales y enviar credenciales por WhatsApp con un solo clic.

---

### [v2.0.0 a v2.8.12] — Resumen de Fundamentos de Kongre
- **Gráficos de Tendencias de Asistencia:** Estadísticas mensuales del año de servicio y comparación presencial vs. Zoom.
- **Territorios Digitales y Mapas:** Asignación de territorios con enlaces QR y direcciones de no visitar.
- **Control de Acceso por Roles (RBAC):** Privilegios diferenciados para Coordinador, Ancianos, Siervos Ministeriales, Precursores y Publicadores.
- **Modo Fuera de Línea (PWA):** Aplicación instalable en teléfonos, tabletas y computadoras que funciona 100% sin conexión a internet.
