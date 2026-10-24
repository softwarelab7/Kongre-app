// src/utils/rbac.ts
import type { ActiveTab } from '../components/Navbar';

export type TheocraticRole =
  | 'coordinador'
  | 'anciano'
  | 'superintendente_vym'
  | 'superintendente_servicio'
  | 'secretario'
  | 'siervo_discursos'
  | 'siervo_territorios'
  | 'siervo_carritos'
  | 'siervo_literatura'
  | 'siervo_cuentas'
  | 'superintendente_grupo'
  | 'encargado_mantenimiento'
  | 'encargado_audiovideo'
  | 'encargado_acomodadores'
  | 'encargado_cartelera'
  | 'publico';

export interface Permission {
  // Reuniones y programación
  canEditCLM: boolean;
  canEditWeekend: boolean;
  canEditSchedule: boolean;
  canEditMidweekOnly: boolean;

  // Publicadores / Tarjetas S-21
  canEditPublishers: boolean;
  canViewS21: boolean;
  canEditS21: boolean;

  // Informes y asistencia
  canEditReports: boolean;
  canViewBranchReports: boolean;
  canEditAttendance: boolean;

  // Territorios y grupos
  canEditTerritories: boolean;
  canManageTerritories: boolean;
  canEditGroups: boolean;

  // Anuncios y cartelera
  canEditAnnouncements: boolean;
  canEditBillboard: boolean;

  // Deberes, carritos, discursos
  canEditDuties: boolean;
  canEditCartWitnessing: boolean;
  canEditPublicTalks: boolean;

  // Literatura y cuentas
  canManageLiterature: boolean;
  canManageAccounts: boolean;

  // Supervisión, conflictos y ajustes
  canSuperviseConflicts: boolean;
  canModifySettings: boolean;
  canManageAccess: boolean;   // Administrar hermanos_acceso / PINs
  canViewAuditLog: boolean;
  canManageConfig: boolean;
}

export interface TheocraticRoleInfo extends Permission {
  id: TheocraticRole;
  name: string;
  shortName: string;
  badgeColor: string;
  description: string;
  allowedTabs: ActiveTab[];
  isReadOnly: boolean;
}

export interface AuditLogEntry {
  id?: string;
  accion: string;
  hermano_nid: string;
  hermano_nombre?: string;
  modulo: string;
  fecha?: string;
  detalles?: string;
  prevHash?: string;
  integrityHash?: string;
}

export const NO_PERMISSIONS: Permission = {
  canEditCLM: false,
  canEditWeekend: false,
  canEditSchedule: false,
  canEditMidweekOnly: false,
  canEditPublishers: false,
  canViewS21: false,
  canEditS21: false,
  canEditReports: false,
  canViewBranchReports: false,
  canEditAttendance: false,
  canEditTerritories: false,
  canManageTerritories: false,
  canEditGroups: false,
  canEditAnnouncements: false,
  canEditBillboard: false,
  canEditDuties: false,
  canEditCartWitnessing: false,
  canEditPublicTalks: false,
  canManageLiterature: false,
  canManageAccounts: false,
  canSuperviseConflicts: false,
  canModifySettings: false,
  canManageAccess: false,
  canViewAuditLog: false,
  canManageConfig: false,
};

export function normalizeTheocraticRole(rawRole: string | undefined | null): TheocraticRole {
  if (!rawRole) return 'publico';
  const r = String(rawRole).trim().toLowerCase();

  switch (r) {
    case 'admin':
    case 'super_admin':
    case 'administrador':
    case 'coordinador':
      return 'coordinador';

    case 'anciano':
    case 'elder':
      return 'anciano';

    case 'vym':
    case 'superintendente_vym':
      return 'superintendente_vym';

    case 'servicio':
    case 'superintendente_servicio':
      return 'superintendente_servicio';

    case 'secretario':
    case 'secretary':
      return 'secretario';

    case 'discursos':
    case 'publico_discursos':
    case 'lector':
    case 'siervo_discursos':
      return 'siervo_discursos';

    case 'territorios':
    case 'siervo_territorios':
      return 'siervo_territorios';

    case 'carritos':
    case 'siervo_carritos':
      return 'siervo_carritos';

    case 'literatura':
    case 'siervo_literatura':
      return 'siervo_literatura';

    case 'cuentas':
    case 'siervo_cuentas':
      return 'siervo_cuentas';

    case 'sup_grupo':
    case 'superintendente_grupo':
      return 'superintendente_grupo';

    case 'mantenimiento':
    case 'encargado_mantenimiento':
      return 'encargado_mantenimiento';

    case 'audiovideo':
    case 'sonido':
    case 'video':
    case 'encargado_audiovideo':
      return 'encargado_audiovideo';

    case 'acomodadores':
    case 'encargado_acomodadores':
      return 'encargado_acomodadores';

    case 'cartelera':
    case 'encargado_cartelera':
      return 'encargado_cartelera';

    case 'publisher':
    case 'publicador':
    case 'unbaptized':
    case 'publico':
    default:
      return 'publico';
  }
}

export const THEOCRATIC_ROLES: Record<TheocraticRole, TheocraticRoleInfo> = {
  coordinador: {
    id: 'coordinador',
    name: 'Coordinador del Cuerpo de Ancianos (Admin)',
    shortName: 'Coordinador',
    badgeColor: 'bg-indigo-600 text-white shadow-xs',
    description: 'Acceso total y supervisión general de todos los departamentos, ajustes y permisos.',
    allowedTabs: [
      'inicio', 'calendario', 'programacion', 'clm_vmc', 's89', 'discursos', 'hospitalidad',
      'estadisticas_secretaria', 'publicadores', 'precursores_auxiliares', 'tarjetas_s21', 'informe_s1', 'informes_servicio',
      'asistencia', 'cuentas', 'territorios', 'grupos_servicio', 'carritos', 'literatura',
      'limpieza_deberes', 'mantenimiento', 'panel_electrico', 'visita_sc', 'memorial_asambleas',
      'tablero_anuncios', 'conflictos', 'equidad', 'exportar_pdf', 'mi_vista', 'perfil', 'ajustes', 'roles'
    ],
    canEditCLM: true,
    canEditWeekend: true,
    canEditSchedule: true,
    canEditMidweekOnly: false,
    canEditPublishers: true,
    canViewS21: true,
    canEditS21: true,
    canEditReports: true,
    canViewBranchReports: true,
    canEditAttendance: true,
    canEditTerritories: true,
    canManageTerritories: true,
    canEditGroups: true,
    canEditAnnouncements: true,
    canEditBillboard: true,
    canEditDuties: true,
    canEditCartWitnessing: true,
    canEditPublicTalks: true,
    canManageLiterature: true,
    canManageAccounts: true,
    canSuperviseConflicts: true,
    canModifySettings: true,
    canManageAccess: true,
    canViewAuditLog: true,
    canManageConfig: true,
    isReadOnly: false,
  },

  anciano: {
    id: 'anciano',
    name: 'Anciano de Congregación',
    shortName: 'Anciano',
    badgeColor: 'bg-purple-600 text-white shadow-xs',
    description: 'Supervisión espiritual general, reuniones, oradores y visitas de pastoreo.',
    allowedTabs: [
      'inicio', 'calendario', 'programacion', 'clm_vmc', 's89', 'discursos', 'hospitalidad',
      'estadisticas_secretaria', 'publicadores', 'precursores_auxiliares', 'tarjetas_s21', 'informes_servicio', 'asistencia',
      'grupos_servicio', 'territorios', 'carritos', 'limpieza_deberes', 'visita_sc',
      'memorial_asambleas', 'tablero_anuncios', 'conflictos', 'equidad', 'exportar_pdf', 'mi_vista', 'perfil', 'roles'
    ],
    canEditCLM: true,
    canEditWeekend: true,
    canEditSchedule: true,
    canEditMidweekOnly: false,
    canEditPublishers: false,
    canViewS21: true,
    canEditS21: false,
    canEditReports: true,
    canViewBranchReports: true,
    canEditAttendance: true,
    canEditTerritories: true,
    canManageTerritories: false,
    canEditGroups: true,
    canEditAnnouncements: true,
    canEditBillboard: true,
    canEditDuties: true,
    canEditCartWitnessing: true,
    canEditPublicTalks: true,
    canManageLiterature: false,
    canManageAccounts: false,
    canSuperviseConflicts: true,
    canModifySettings: false,
    canManageAccess: false,
    canViewAuditLog: true,
    canManageConfig: false,
    isReadOnly: false,
  },

  superintendente_vym: {
    id: 'superintendente_vym',
    name: 'Superintendente de Vida y Ministerio',
    shortName: 'Supt. Vida y Min.',
    badgeColor: 'bg-emerald-600 text-white shadow-xs',
    description: 'Edita el programa entre semana, asignaciones estudiantiles S-89 y lecciones de oratoria.',
    allowedTabs: [
      'inicio', 'calendario', 'programacion', 'clm_vmc', 's89', 'limpieza_deberes',
      'tablero_anuncios', 'conflictos', 'equidad', 'exportar_pdf', 'mi_vista', 'publicadores', 'perfil'
    ],
    canEditCLM: true,
    canEditWeekend: false,
    canEditSchedule: true,
    canEditMidweekOnly: true,
    canEditPublishers: false,
    canViewS21: false,
    canEditS21: false,
    canEditReports: false,
    canViewBranchReports: false,
    canEditAttendance: false,
    canEditTerritories: false,
    canManageTerritories: false,
    canEditGroups: false,
    canEditAnnouncements: false,
    canEditBillboard: true,
    canEditDuties: true,
    canEditCartWitnessing: false,
    canEditPublicTalks: false,
    canManageLiterature: false,
    canManageAccounts: false,
    canSuperviseConflicts: true,
    canModifySettings: false,
    canManageAccess: false,
    canViewAuditLog: false,
    canManageConfig: false,
    isReadOnly: false,
  },

  superintendente_servicio: {
    id: 'superintendente_servicio',
    name: 'Superintendente de Servicio',
    shortName: 'Supt. de Servicio',
    badgeColor: 'bg-cyan-600 text-white shadow-xs',
    description: 'Supervisa la predicación, grupos de servicio, territorios, carritos y actividad.',
    allowedTabs: [
      'inicio', 'calendario', 'territorios', 'grupos_servicio', 'carritos', 'estadisticas_secretaria', 'publicadores',
      'precursores_auxiliares', 'informes_servicio', 'tablero_anuncios', 'mi_vista', 'perfil'
    ],
    canEditCLM: false,
    canEditWeekend: false,
    canEditSchedule: false,
    canEditMidweekOnly: false,
    canEditPublishers: true,
    canViewS21: true,
    canEditS21: false,
    canEditReports: true,
    canViewBranchReports: false,
    canEditAttendance: false,
    canEditTerritories: true,
    canManageTerritories: true,
    canEditGroups: true,
    canEditAnnouncements: false,
    canEditBillboard: false,
    canEditDuties: false,
    canEditCartWitnessing: true,
    canEditPublicTalks: false,
    canManageLiterature: false,
    canManageAccounts: false,
    canSuperviseConflicts: false,
    canModifySettings: false,
    canManageAccess: false,
    canViewAuditLog: false,
    canManageConfig: false,
    isReadOnly: false,
  },

  secretario: {
    id: 'secretario',
    name: 'Secretario de la Congregación',
    shortName: 'Secretario',
    badgeColor: 'bg-blue-600 text-white shadow-xs',
    description: 'Administra tarjetas S-21, informes S-4, asistencia S-88 y directorio de hermanos.',
    allowedTabs: [
      'inicio', 'calendario', 'estadisticas_secretaria', 'publicadores', 'tarjetas_s21', 'informe_s1', 'informes_servicio',
      'asistencia', 'precursores_auxiliares', 'grupos_servicio', 'visita_sc', 'tablero_anuncios', 'exportar_pdf', 'mi_vista', 'perfil'
    ],
    canEditCLM: false,
    canEditWeekend: false,
    canEditSchedule: false,
    canEditMidweekOnly: false,
    canEditPublishers: true,
    canViewS21: true,
    canEditS21: true,
    canEditReports: true,
    canViewBranchReports: true,
    canEditAttendance: true,
    canEditTerritories: false,
    canManageTerritories: false,
    canEditGroups: false,
    canEditAnnouncements: true,
    canEditBillboard: false,
    canEditDuties: false,
    canEditCartWitnessing: false,
    canEditPublicTalks: false,
    canManageLiterature: false,
    canManageAccounts: false,
    canSuperviseConflicts: false,
    canModifySettings: false,
    canManageAccess: false,
    canViewAuditLog: true,
    canManageConfig: false,
    isReadOnly: false,
  },

  siervo_discursos: {
    id: 'siervo_discursos',
    name: 'Siervo de Discursos Públicos',
    shortName: 'Siervo Discursos',
    badgeColor: 'bg-amber-600 text-white shadow-xs',
    description: 'Asigna oradores locales y visitantes, catálogo de bosquejos y oradores salientes.',
    allowedTabs: [
      'inicio', 'calendario', 'discursos', 'hospitalidad', 'programacion', 'tablero_anuncios', 'mi_vista', 'perfil'
    ],
    canEditCLM: false,
    canEditWeekend: true,
    canEditSchedule: true,
    canEditMidweekOnly: false,
    canEditPublishers: false,
    canViewS21: false,
    canEditS21: false,
    canEditReports: false,
    canViewBranchReports: false,
    canEditAttendance: false,
    canEditTerritories: false,
    canManageTerritories: false,
    canEditGroups: false,
    canEditAnnouncements: false,
    canEditBillboard: true,
    canEditDuties: false,
    canEditCartWitnessing: false,
    canEditPublicTalks: true,
    canManageLiterature: false,
    canManageAccounts: false,
    canSuperviseConflicts: false,
    canModifySettings: false,
    canManageAccess: false,
    canViewAuditLog: false,
    canManageConfig: false,
    isReadOnly: false,
  },

  siervo_territorios: {
    id: 'siervo_territorios',
    name: 'Siervo de Territorios (S-13)',
    shortName: 'Siervo Territorios',
    badgeColor: 'bg-teal-600 text-white shadow-xs',
    description: 'Gestiona mapas y tarjetas de territorio S-13 y salidas de predicación.',
    allowedTabs: [
      'inicio', 'calendario', 'territorios', 'grupos_servicio', 'tablero_anuncios', 'mi_vista', 'perfil'
    ],
    canEditCLM: false,
    canEditWeekend: false,
    canEditSchedule: false,
    canEditMidweekOnly: false,
    canEditPublishers: false,
    canViewS21: false,
    canEditS21: false,
    canEditReports: false,
    canViewBranchReports: false,
    canEditAttendance: false,
    canEditTerritories: true,
    canManageTerritories: true,
    canEditGroups: false,
    canEditAnnouncements: false,
    canEditBillboard: true,
    canEditDuties: false,
    canEditCartWitnessing: false,
    canEditPublicTalks: false,
    canManageLiterature: false,
    canManageAccounts: false,
    canSuperviseConflicts: false,
    canModifySettings: false,
    canManageAccess: false,
    canViewAuditLog: false,
    canManageConfig: false,
    isReadOnly: false,
  },

  siervo_carritos: {
    id: 'siervo_carritos',
    name: 'Encargado de Carritos (Predicación Pública)',
    shortName: 'Carritos / Stands',
    badgeColor: 'bg-emerald-700 text-white shadow-xs',
    description: 'Gestiona turnos, ubicaciones, carritos de literatura y asignación de hermanos.',
    allowedTabs: [
      'inicio', 'calendario', 'carritos', 'tablero_anuncios', 'mi_vista', 'perfil'
    ],
    canEditCLM: false,
    canEditWeekend: false,
    canEditSchedule: false,
    canEditMidweekOnly: false,
    canEditPublishers: false,
    canViewS21: false,
    canEditS21: false,
    canEditReports: false,
    canViewBranchReports: false,
    canEditAttendance: false,
    canEditTerritories: false,
    canManageTerritories: false,
    canEditGroups: false,
    canEditAnnouncements: false,
    canEditBillboard: true,
    canEditDuties: true,
    canEditCartWitnessing: true,
    canEditPublicTalks: false,
    canManageLiterature: false,
    canManageAccounts: false,
    canSuperviseConflicts: false,
    canModifySettings: false,
    canManageAccess: false,
    canViewAuditLog: false,
    canManageConfig: false,
    isReadOnly: false,
  },

  siervo_literatura: {
    id: 'siervo_literatura',
    name: 'Siervo de Literatura y Revistas (S-14)',
    shortName: 'Siervo Literatura',
    badgeColor: 'bg-orange-600 text-white shadow-xs',
    description: 'Gestiona inventario de literatura, pedidos especiales y entregas a grupos.',
    allowedTabs: [
      'inicio', 'calendario', 'literatura', 'tablero_anuncios', 'mi_vista', 'perfil'
    ],
    canEditCLM: false,
    canEditWeekend: false,
    canEditSchedule: false,
    canEditMidweekOnly: false,
    canEditPublishers: false,
    canViewS21: false,
    canEditS21: false,
    canEditReports: false,
    canViewBranchReports: false,
    canEditAttendance: false,
    canEditTerritories: false,
    canManageTerritories: false,
    canEditGroups: false,
    canEditAnnouncements: true,
    canEditBillboard: true,
    canEditDuties: false,
    canEditCartWitnessing: false,
    canEditPublicTalks: false,
    canManageLiterature: true,
    canManageAccounts: false,
    canSuperviseConflicts: false,
    canModifySettings: false,
    canManageAccess: false,
    canViewAuditLog: false,
    canManageConfig: false,
    isReadOnly: false,
  },

  siervo_cuentas: {
    id: 'siervo_cuentas',
    name: 'Siervo de Cuentas (S-26)',
    shortName: 'Siervo Cuentas',
    badgeColor: 'bg-rose-600 text-white shadow-xs',
    description: 'Gestiona la hoja mensual de cuentas S-26 y auditorías trimestrales.',
    allowedTabs: [
      'inicio', 'calendario', 'cuentas', 'tablero_anuncios', 'mi_vista', 'perfil'
    ],
    canEditCLM: false,
    canEditWeekend: false,
    canEditSchedule: false,
    canEditMidweekOnly: false,
    canEditPublishers: false,
    canViewS21: false,
    canEditS21: false,
    canEditReports: false,
    canViewBranchReports: false,
    canEditAttendance: false,
    canEditTerritories: false,
    canManageTerritories: false,
    canEditGroups: false,
    canEditAnnouncements: false,
    canEditBillboard: false,
    canEditDuties: false,
    canEditCartWitnessing: false,
    canEditPublicTalks: false,
    canManageLiterature: false,
    canManageAccounts: true,
    canSuperviseConflicts: false,
    canModifySettings: false,
    canManageAccess: false,
    canViewAuditLog: false,
    canManageConfig: false,
    isReadOnly: false,
  },

  superintendente_grupo: {
    id: 'superintendente_grupo',
    name: 'Superintendente de Grupo de Servicio',
    shortName: 'Supt. de Grupo',
    badgeColor: 'bg-sky-700 text-white shadow-xs',
    description: 'Supervisa a los publicadores de su grupo asignado, salidas y pastoreo.',
    allowedTabs: [
      'inicio', 'calendario', 'grupos_servicio', 'territorios', 'carritos', 'publicadores', 'tablero_anuncios', 'mi_vista', 'perfil'
    ],
    canEditCLM: false,
    canEditWeekend: false,
    canEditSchedule: false,
    canEditMidweekOnly: false,
    canEditPublishers: false,
    canViewS21: true,
    canEditS21: false,
    canEditReports: false,
    canViewBranchReports: false,
    canEditAttendance: false,
    canEditTerritories: false,
    canManageTerritories: false,
    canEditGroups: true,
    canEditAnnouncements: false,
    canEditBillboard: false,
    canEditDuties: false,
    canEditCartWitnessing: false,
    canEditPublicTalks: false,
    canManageLiterature: false,
    canManageAccounts: false,
    canSuperviseConflicts: false,
    canModifySettings: false,
    canManageAccess: false,
    canViewAuditLog: false,
    canManageConfig: false,
    isReadOnly: false,
  },

  encargado_mantenimiento: {
    id: 'encargado_mantenimiento',
    name: 'Encargado de Mantenimiento y Aseo del Salón',
    shortName: 'Mantenimiento / Aseo',
    badgeColor: 'bg-lime-700 text-white shadow-xs',
    description: 'Gestiona turnos de aseo, mantenimiento preventivo y panel de inspección.',
    allowedTabs: [
      'inicio', 'calendario', 'mantenimiento', 'limpieza_deberes', 'panel_electrico', 'tablero_anuncios', 'mi_vista', 'perfil'
    ],
    canEditCLM: false,
    canEditWeekend: false,
    canEditSchedule: false,
    canEditMidweekOnly: false,
    canEditPublishers: false,
    canViewS21: false,
    canEditS21: false,
    canEditReports: false,
    canViewBranchReports: false,
    canEditAttendance: false,
    canEditTerritories: false,
    canManageTerritories: false,
    canEditGroups: false,
    canEditAnnouncements: false,
    canEditBillboard: true,
    canEditDuties: true,
    canEditCartWitnessing: false,
    canEditPublicTalks: false,
    canManageLiterature: false,
    canManageAccounts: false,
    canSuperviseConflicts: false,
    canModifySettings: false,
    canManageAccess: false,
    canViewAuditLog: false,
    canManageConfig: false,
    isReadOnly: false,
  },

  encargado_audiovideo: {
    id: 'encargado_audiovideo',
    name: 'Encargado de Audio, Video y Plataforma',
    shortName: 'Audio y Video',
    badgeColor: 'bg-indigo-700 text-white shadow-xs',
    description: 'Asigna y coordina operadores de sonido, video, Zoom y micrófonos.',
    allowedTabs: [
      'inicio', 'calendario', 'programacion', 'limpieza_deberes', 'tablero_anuncios', 'mi_vista', 'perfil'
    ],
    canEditCLM: true,
    canEditWeekend: true,
    canEditSchedule: true,
    canEditMidweekOnly: false,
    canEditPublishers: false,
    canViewS21: false,
    canEditS21: false,
    canEditReports: false,
    canViewBranchReports: false,
    canEditAttendance: false,
    canEditTerritories: false,
    canManageTerritories: false,
    canEditGroups: false,
    canEditAnnouncements: false,
    canEditBillboard: true,
    canEditDuties: true,
    canEditCartWitnessing: false,
    canEditPublicTalks: false,
    canManageLiterature: false,
    canManageAccounts: false,
    canSuperviseConflicts: false,
    canModifySettings: false,
    canManageAccess: false,
    canViewAuditLog: false,
    canManageConfig: false,
    isReadOnly: false,
  },

  encargado_acomodadores: {
    id: 'encargado_acomodadores',
    name: 'Encargado de Acomodadores',
    shortName: 'Acomodadores',
    badgeColor: 'bg-amber-700 text-white shadow-xs',
    description: 'Coordina los acomodadores del auditorio, pasillos, entradas y asistencia.',
    allowedTabs: [
      'inicio', 'calendario', 'limpieza_deberes', 'asistencia', 'tablero_anuncios', 'mi_vista', 'perfil'
    ],
    canEditCLM: false,
    canEditWeekend: false,
    canEditSchedule: false,
    canEditMidweekOnly: false,
    canEditPublishers: false,
    canViewS21: false,
    canEditS21: false,
    canEditReports: false,
    canViewBranchReports: false,
    canEditAttendance: true,
    canEditTerritories: false,
    canManageTerritories: false,
    canEditGroups: false,
    canEditAnnouncements: false,
    canEditBillboard: true,
    canEditDuties: true,
    canEditCartWitnessing: false,
    canEditPublicTalks: false,
    canManageLiterature: false,
    canManageAccounts: false,
    canSuperviseConflicts: false,
    canModifySettings: false,
    canManageAccess: false,
    canViewAuditLog: false,
    canManageConfig: false,
    isReadOnly: false,
  },

  encargado_cartelera: {
    id: 'encargado_cartelera',
    name: 'Encargado del Tablero de Anuncios / Cartelera',
    shortName: 'Cartelera / Anuncios',
    badgeColor: 'bg-violet-700 text-white shadow-xs',
    description: 'Publica avisos oficiales, programas de limpieza, discursos y cartas de sucursal.',
    allowedTabs: [
      'inicio', 'calendario', 'tablero_anuncios', 'programacion', 'mi_vista', 'perfil'
    ],
    canEditCLM: false,
    canEditWeekend: false,
    canEditSchedule: false,
    canEditMidweekOnly: false,
    canEditPublishers: false,
    canViewS21: false,
    canEditS21: false,
    canEditReports: false,
    canViewBranchReports: false,
    canEditAttendance: false,
    canEditTerritories: false,
    canManageTerritories: false,
    canEditGroups: false,
    canEditAnnouncements: true,
    canEditBillboard: true,
    canEditDuties: false,
    canEditCartWitnessing: false,
    canEditPublicTalks: false,
    canManageLiterature: false,
    canManageAccounts: false,
    canSuperviseConflicts: false,
    canModifySettings: false,
    canManageAccess: false,
    canViewAuditLog: false,
    canManageConfig: false,
    isReadOnly: false,
  },

  publico: {
    id: 'publico',
    name: 'Modo Cartelera / Publicador (Solo Lectura)',
    shortName: 'Modo Cartelera (Lectura)',
    badgeColor: 'bg-slate-700 text-white shadow-xs',
    description: 'Vista de solo lectura para el Salón o publicadores. No permite editar ni ver datos confidenciales.',
    allowedTabs: [
      'inicio', 'calendario', 'programacion', 'tablero_anuncios', 'mi_vista', 'perfil'
    ],
    ...NO_PERMISSIONS,
    isReadOnly: true,
  },
};

export const ROLE_PERMISSIONS: Record<TheocraticRole, Permission> = Object.fromEntries(
  Object.entries(THEOCRATIC_ROLES).map(([role, info]) => [
    role as TheocraticRole,
    {
      canEditCLM: info.canEditCLM,
      canEditWeekend: info.canEditWeekend,
      canEditSchedule: info.canEditSchedule,
      canEditMidweekOnly: info.canEditMidweekOnly,
      canEditPublishers: info.canEditPublishers,
      canViewS21: info.canViewS21,
      canEditS21: info.canEditS21,
      canEditReports: info.canEditReports,
      canViewBranchReports: info.canViewBranchReports,
      canEditAttendance: info.canEditAttendance,
      canEditTerritories: info.canEditTerritories,
      canManageTerritories: info.canManageTerritories,
      canEditGroups: info.canEditGroups,
      canEditAnnouncements: info.canEditAnnouncements,
      canEditBillboard: info.canEditBillboard,
      canEditDuties: info.canEditDuties,
      canEditCartWitnessing: info.canEditCartWitnessing,
      canEditPublicTalks: info.canEditPublicTalks,
      canManageLiterature: info.canManageLiterature,
      canManageAccounts: info.canManageAccounts,
      canSuperviseConflicts: info.canSuperviseConflicts,
      canModifySettings: info.canModifySettings,
      canManageAccess: info.canManageAccess,
      canViewAuditLog: info.canViewAuditLog,
      canManageConfig: info.canManageConfig,
    },
  ])
) as Record<TheocraticRole, Permission>;

export function getPermissionsForRoles(roles: (TheocraticRole | string)[]): Permission {
  if (!roles || roles.length === 0) return { ...NO_PERMISSIONS };
  return roles.reduce<Permission>(
    (acc, r) => {
      const normalized = normalizeTheocraticRole(r);
      const perms = ROLE_PERMISSIONS[normalized] || NO_PERMISSIONS;
      return {
        canEditCLM: acc.canEditCLM || perms.canEditCLM,
        canEditWeekend: acc.canEditWeekend || perms.canEditWeekend,
        canEditSchedule: acc.canEditSchedule || perms.canEditSchedule,
        canEditMidweekOnly: acc.canEditMidweekOnly || perms.canEditMidweekOnly,
        canEditPublishers: acc.canEditPublishers || perms.canEditPublishers,
        canViewS21: acc.canViewS21 || perms.canViewS21,
        canEditS21: acc.canEditS21 || perms.canEditS21,
        canEditReports: acc.canEditReports || perms.canEditReports,
        canViewBranchReports: acc.canViewBranchReports || perms.canViewBranchReports,
        canEditAttendance: acc.canEditAttendance || perms.canEditAttendance,
        canEditTerritories: acc.canEditTerritories || perms.canEditTerritories,
        canManageTerritories: acc.canManageTerritories || perms.canManageTerritories,
        canEditGroups: acc.canEditGroups || perms.canEditGroups,
        canEditAnnouncements: acc.canEditAnnouncements || perms.canEditAnnouncements,
        canEditBillboard: acc.canEditBillboard || perms.canEditBillboard,
        canEditDuties: acc.canEditDuties || perms.canEditDuties,
        canEditCartWitnessing: acc.canEditCartWitnessing || perms.canEditCartWitnessing,
        canEditPublicTalks: acc.canEditPublicTalks || perms.canEditPublicTalks,
        canManageLiterature: acc.canManageLiterature || perms.canManageLiterature,
        canManageAccounts: acc.canManageAccounts || perms.canManageAccounts,
        canSuperviseConflicts: acc.canSuperviseConflicts || perms.canSuperviseConflicts,
        canModifySettings: acc.canModifySettings || perms.canModifySettings,
        canManageAccess: acc.canManageAccess || perms.canManageAccess,
        canViewAuditLog: acc.canViewAuditLog || perms.canViewAuditLog,
        canManageConfig: acc.canManageConfig || perms.canManageConfig,
      };
    },
    { ...NO_PERMISSIONS }
  );
}

export function isTabAllowedForRole(roleOrRoles: string | string[], tab: ActiveTab): boolean {
  if (
    tab === 'inicio' ||
    tab === 'panorama_general' ||
    tab === 'cronometro_ministerio' ||
    tab === 'revisitas' ||
    tab === 'estudios_biblicos' ||
    tab === 'mi_vista' ||
    tab === 'perfil' ||
    tab === 'calendario' ||
    tab === 'roles' ||
    tab === 'menu'
  ) {
    return true;
  }
  const list = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
  return list.some((r) => {
    const normalized = normalizeTheocraticRole(r);
    const roleInfo = THEOCRATIC_ROLES[normalized];
    if (!roleInfo) return false;
    if (tab === 'clm_vmc') return roleInfo.allowedTabs.includes('programacion');
    return roleInfo.allowedTabs.includes(tab);
  });
}

// ============================================================================
//  POLÍTICA DE ADMINISTRACIÓN DE ACCESOS Y ALCANCE DE DATOS
//  Funciones puras (sin React) para poder probarlas y reutilizarlas en la interfaz.
//
//  IMPORTANTE: en esta versión la app aplica estas reglas en el navegador. Son una barrera
//  de interfaz y de coherencia, no un control de servidor: el servidor solo distingue
//  "PIN maestro" y "PIN de congregación" (ver supabase/functions/kongre-sync).
// ============================================================================

/**
 * Política: ¿pueden los ancianos (no coordinador) cambiar roles/PIN de OTROS ancianos?
 * Por defecto NO: un anciano que fija el PIN de otro anciano podría iniciar sesión como él.
 * Cámbialo a true si en tu congregación todos los ancianos administran accesos entre sí.
 */
export const ELDERS_CAN_MANAGE_ELDERS = true;

/** Roles que ven la tarjeta S-21 de TODOS los publicadores. */
const S21_BROAD_ROLES: TheocraticRole[] = ['coordinador', 'anciano', 'secretario', 'superintendente_servicio'];

export interface PolicyDecision {
  allowed: boolean;
  reason?: string;
}

export interface CredentialTarget {
  publisherId?: string;
  currentRole?: TheocraticRole | string | null;
  privilege?: string | null;
}

export interface CredentialChangeRequest {
  actorRoles: (TheocraticRole | string)[];
  actorPublisherId?: string | null;
  target: CredentialTarget;
  /** Rol que se quiere asignar. Omitir si solo se cambia/revoca/revela el PIN. */
  newRole?: TheocraticRole | string;
}

function normalizeRoles(roles: (TheocraticRole | string)[] | undefined | null): TheocraticRole[] {
  return (roles || []).map((r) => normalizeTheocraticRole(r));
}

export function isCoordinatorRoles(roles: (TheocraticRole | string)[] | undefined | null): boolean {
  return normalizeRoles(roles).includes('coordinador');
}

/**
 * ¿Puede este conjunto de roles abrir el directorio de accesos? Refleja la regla que ya aplicaba la
 * interfaz: coordinador, quien tenga canManageAccess y los ancianos.
 */
export function canAdministerAccess(actorRoles: (TheocraticRole | string)[]): boolean {
  const roles = normalizeRoles(actorRoles);
  return (
    roles.includes('coordinador') ||
    roles.includes('anciano') ||
    getPermissionsForRoles(roles).canManageAccess
  );
}

/**
 * Decide si el actor puede asignar un rol y/o cambiar, revocar o ver el PIN de un hermano.
 * Reglas (el coordinador queda exento de todas):
 *  1. Nadie salvo el coordinador otorga el rol de Coordinador ni toca las credenciales del Coordinador.
 *  2. El rol de Anciano solo se asigna a hermanos con privilegio de anciano.
 *  3. Nadie cambia su propio rol (evita auto-ascenso); sí puede regenerar su propio PIN.
 *  4. Los ancianos no administran las credenciales de otros ancianos (ver ELDERS_CAN_MANAGE_ELDERS).
 */
export function checkCredentialChange(req: CredentialChangeRequest): PolicyDecision {
  const actor = normalizeRoles(req.actorRoles);
  if (!canAdministerAccess(actor)) {
    return { allowed: false, reason: 'Tu rol no puede administrar accesos.' };
  }
  if (actor.includes('coordinador')) return { allowed: true };

  const targetRole = normalizeTheocraticRole(req.target.currentRole as string | undefined);
  const newRole = req.newRole !== undefined ? normalizeTheocraticRole(req.newRole as string) : undefined;
  const isSelf = Boolean(req.actorPublisherId && req.target.publisherId && req.actorPublisherId === req.target.publisherId);

  if (targetRole === 'coordinador') {
    return { allowed: false, reason: 'Solo el Coordinador puede modificar las credenciales del Coordinador.' };
  }
  if (newRole === 'coordinador') {
    return { allowed: false, reason: 'Solo el Coordinador puede otorgar el rol de Coordinador.' };
  }
  if (newRole === 'anciano' && req.target.privilege !== 'anciano') {
    return { allowed: false, reason: 'El rol de Anciano solo puede asignarse a hermanos con privilegio de anciano.' };
  }
  if (isSelf && newRole !== undefined && newRole !== targetRole) {
    return { allowed: false, reason: 'No puedes cambiar tu propio rol.' };
  }
  const targetIsElder = req.target.privilege === 'anciano' || targetRole === 'anciano';
  if (targetIsElder && !isSelf && !ELDERS_CAN_MANAGE_ELDERS) {
    return { allowed: false, reason: 'Solo el Coordinador puede modificar las credenciales de otros ancianos.' };
  }
  return { allowed: true };
}

/** Roles que el actor puede ofrecer en un selector para este hermano (siempre incluye el rol actual). */
export function getAssignableRoles(
  actorRoles: (TheocraticRole | string)[],
  target: CredentialTarget,
  actorPublisherId?: string | null
): TheocraticRole[] {
  const current = normalizeTheocraticRole(target.currentRole as string | undefined);
  return (Object.keys(THEOCRATIC_ROLES) as TheocraticRole[]).filter(
    (role) =>
      role === current ||
      checkCredentialChange({ actorRoles, actorPublisherId, target, newRole: role }).allowed
  );
}

/** ¿Puede el actor ver/copiar/compartir el PIN de este hermano? */
export function canRevealPinOf(
  actorRoles: (TheocraticRole | string)[],
  target: CredentialTarget,
  actorPublisherId?: string | null
): boolean {
  if (isCoordinatorRoles(actorRoles)) return true;
  if (actorPublisherId && target.publisherId === actorPublisherId) return true;
  return checkCredentialChange({ actorRoles, actorPublisherId, target }).allowed;
}

export interface GroupScope {
  overseerId?: string;
  assistantId?: string;
  memberIds: string[];
}

/**
 * ¿Puede el actor ver la tarjeta S-21 (registro de servicio) de este publicador?
 * Coordinador, ancianos, secretario y superintendente de servicio: todos los publicadores.
 * Superintendente de grupo (y cualquier otro rol con canViewS21): solo su propia tarjeta y las de
 * los miembros de los grupos donde es superintendente o auxiliar.
 */
export function canViewS21Of(
  actorRoles: (TheocraticRole | string)[],
  publisherId: string | undefined | null,
  ctx: { actorPublisherId?: string | null; groups?: GroupScope[] }
): boolean {
  const roles = normalizeRoles(actorRoles);
  if (!getPermissionsForRoles(roles).canViewS21) return false;
  if (roles.some((r) => S21_BROAD_ROLES.includes(r))) return true;

  const me = ctx.actorPublisherId;
  if (!me || !publisherId) return false;
  if (publisherId === me) return true;
  return (ctx.groups || []).some(
    (g) =>
      (g.overseerId === me || g.assistantId === me) &&
      (g.memberIds.includes(publisherId) || g.overseerId === publisherId || g.assistantId === publisherId)
  );
}

/**
 * ¿Puede este actor vincular una cuenta de Google con este rol? Solo el coordinador puede vincular
 * una cuenta como Coordinador; el resto sigue las mismas reglas que la asignación de roles.
 */
export function checkEmailRoleLink(
  actorRoles: (TheocraticRole | string)[],
  role: TheocraticRole | string
): PolicyDecision {
  if (!canAdministerAccess(actorRoles)) return { allowed: false, reason: 'Tu rol no puede administrar accesos.' };
  if (isCoordinatorRoles(actorRoles)) return { allowed: true };
  const r = normalizeTheocraticRole(role as string);
  if (r === 'coordinador') return { allowed: false, reason: 'Solo el Coordinador puede vincular una cuenta como Coordinador.' };
  if (r === 'anciano') return { allowed: false, reason: 'Solo el Coordinador puede vincular una cuenta con el rol de Anciano.' };
  return { allowed: true };
}

