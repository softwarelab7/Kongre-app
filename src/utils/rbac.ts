// src/utils/rbac.ts
import { ActiveTab } from '../components/Navbar';

export type TheocraticRole =
  | 'coordinador'
  | 'anciano'
  | 'superintendente_vym'
  | 'secretario'
  | 'siervo_discursos'
  | 'siervo_territorios'
  | 'siervo_literatura'
  | 'siervo_cuentas'
  | 'publico';

export interface TheocraticRoleInfo {
  id: TheocraticRole;
  name: string;
  shortName: string;
  badgeColor: string;
  description: string;
  allowedTabs: ActiveTab[];
  canEditSchedule: boolean;
  canEditMidweekOnly: boolean;
  canEditPublishers: boolean;
  canViewS21: boolean;
  canEditS21: boolean;
  canEditAttendance: boolean;
  canEditPublicTalks: boolean;
  canManageTerritories: boolean;
  canManageLiterature: boolean;
  canManageAccounts: boolean;
  canSuperviseConflicts: boolean;
  canModifySettings: boolean;
  isReadOnly: boolean;
}

export const THEOCRATIC_ROLES: Record<TheocraticRole, TheocraticRoleInfo> = {
  coordinador: {
    id: 'coordinador',
    name: 'Coordinador del Cuerpo de Ancianos',
    shortName: 'Coordinador',
    badgeColor: 'bg-indigo-600 text-white shadow-xs',
    description: 'Acceso total y supervisión general de todos los departamentos y ajustes.',
    allowedTabs: [
      'inicio',
      'programacion',
      's89',
      'discursos',
      'publicadores',
      'tarjetas_s21',
      'informes_servicio',
      'asistencia',
      'cuentas',
      'territorios',
      'grupos_servicio',
      'carritos',
      'literatura',
      'limpieza_deberes',
      'visita_sc',
      'memorial_asambleas',
      'tablero_anuncios',
      'conflictos',
      'equidad',
      'exportar_pdf',
      'mi_vista',
      'perfil',
      'ajustes',
    ],
    canEditSchedule: true,
    canEditMidweekOnly: false,
    canEditPublishers: true,
    canViewS21: true,
    canEditS21: true,
    canEditAttendance: true,
    canEditPublicTalks: true,
    canManageTerritories: true,
    canManageLiterature: true,
    canManageAccounts: true,
    canSuperviseConflicts: true,
    canModifySettings: true,
    isReadOnly: false,
  },

  anciano: {
    id: 'anciano',
    name: 'Anciano de Congregación',
    shortName: 'Anciano',
    badgeColor: 'bg-purple-600 text-white shadow-xs',
    description: 'Miembro del Cuerpo de Ancianos. Supervisión teocrática, reuniones, oradores y visitas.',
    allowedTabs: [
      'inicio',
      'programacion',
      's89',
      'discursos',
      'publicadores',
      'grupos_servicio',
      'asistencia',
      'limpieza_deberes',
      'visita_sc',
      'memorial_asambleas',
      'tablero_anuncios',
      'conflictos',
      'equidad',
      'exportar_pdf',
      'mi_vista',
      'perfil',
    ],
    canEditSchedule: true,
    canEditMidweekOnly: false,
    canEditPublishers: false,
    canViewS21: true,
    canEditS21: false,
    canEditAttendance: true,
    canEditPublicTalks: true,
    canManageTerritories: false,
    canManageLiterature: false,
    canManageAccounts: false,
    canSuperviseConflicts: true,
    canModifySettings: false,
    isReadOnly: false,
  },

  superintendente_vym: {
    id: 'superintendente_vym',
    name: 'Superintendente de Vida y Ministerio',
    shortName: 'Supt. Vida y Min.',
    badgeColor: 'bg-emerald-600 text-white shadow-xs',
    description: 'Edita el programa entre semana, asignaciones estudiantiles S-89 y lecciones de oratoria.',
    allowedTabs: [
      'inicio',
      'programacion',
      's89',
      'limpieza_deberes',
      'tablero_anuncios',
      'conflictos',
      'equidad',
      'exportar_pdf',
      'mi_vista',
      'publicadores',
    ],
    canEditSchedule: true,
    canEditMidweekOnly: true,
    canEditPublishers: false,
    canViewS21: false,
    canEditS21: false,
    canEditAttendance: false,
    canEditPublicTalks: false,
    canManageTerritories: false,
    canManageLiterature: false,
    canManageAccounts: false,
    canSuperviseConflicts: true,
    canModifySettings: false,
    isReadOnly: false,
  },

  secretario: {
    id: 'secretario',
    name: 'Secretario de la Congregación',
    shortName: 'Secretario',
    badgeColor: 'bg-blue-600 text-white shadow-xs',
    description: 'Administra tarjetas S-21, informes S-4, asistencia S-88 y directorio de hermanos.',
    allowedTabs: [
      'inicio',
      'publicadores',
      'tarjetas_s21',
      'informes_servicio',
      'asistencia',
      'grupos_servicio',
      'visita_sc',
      'tablero_anuncios',
      'exportar_pdf',
      'mi_vista',
    ],
    canEditSchedule: false,
    canEditMidweekOnly: false,
    canEditPublishers: true,
    canViewS21: true,
    canEditS21: true,
    canEditAttendance: true,
    canEditPublicTalks: false,
    canManageTerritories: false,
    canManageLiterature: false,
    canManageAccounts: false,
    canSuperviseConflicts: false,
    canModifySettings: false,
    isReadOnly: false,
  },

  siervo_discursos: {
    id: 'siervo_discursos',
    name: 'Siervo de Discursos Públicos',
    shortName: 'Siervo Discursos',
    badgeColor: 'bg-amber-600 text-white shadow-xs',
    description: 'Asigna oradores locales y visitantes, catálogo de bosquejos y oradores salientes.',
    allowedTabs: [
      'inicio',
      'discursos',
      'programacion',
      'tablero_anuncios',
      'mi_vista',
    ],
    canEditSchedule: false,
    canEditMidweekOnly: false,
    canEditPublishers: false,
    canViewS21: false,
    canEditS21: false,
    canEditAttendance: false,
    canEditPublicTalks: true,
    canManageTerritories: false,
    canManageLiterature: false,
    canManageAccounts: false,
    canSuperviseConflicts: false,
    canModifySettings: false,
    isReadOnly: false,
  },

  siervo_territorios: {
    id: 'siervo_territorios',
    name: 'Siervo de Territorios (S-13)',
    shortName: 'Siervo Territorios',
    badgeColor: 'bg-teal-600 text-white shadow-xs',
    description: 'Solo ve y gestiona territorios S-13, no visitas, carritos y grupos de servicio.',
    allowedTabs: [
      'inicio',
      'territorios',
      'grupos_servicio',
      'carritos',
      'tablero_anuncios',
      'mi_vista',
    ],
    canEditSchedule: false,
    canEditMidweekOnly: false,
    canEditPublishers: false,
    canViewS21: false,
    canEditS21: false,
    canEditAttendance: false,
    canEditPublicTalks: false,
    canManageTerritories: true,
    canManageLiterature: false,
    canManageAccounts: false,
    canSuperviseConflicts: false,
    canModifySettings: false,
    isReadOnly: false,
  },

  siervo_literatura: {
    id: 'siervo_literatura',
    name: 'Siervo de Literatura y Revistas (S-14)',
    shortName: 'Siervo Literatura',
    badgeColor: 'bg-orange-600 text-white shadow-xs',
    description: 'Solo ve y gestiona el inventario de literatura, pedidos especiales y entregas a grupos.',
    allowedTabs: [
      'inicio',
      'literatura',
      'tablero_anuncios',
      'mi_vista',
    ],
    canEditSchedule: false,
    canEditMidweekOnly: false,
    canEditPublishers: false,
    canViewS21: false,
    canEditS21: false,
    canEditAttendance: false,
    canEditPublicTalks: false,
    canManageTerritories: false,
    canManageLiterature: true,
    canManageAccounts: false,
    canSuperviseConflicts: false,
    canModifySettings: false,
    isReadOnly: false,
  },

  siervo_cuentas: {
    id: 'siervo_cuentas',
    name: 'Siervo de Cuentas (S-26)',
    shortName: 'Siervo Cuentas',
    badgeColor: 'bg-rose-600 text-white shadow-xs',
    description: 'Solo ve y gestiona la hoja mensual de cuentas S-26 y auditorías trimestrales.',
    allowedTabs: [
      'inicio',
      'cuentas',
      'tablero_anuncios',
      'mi_vista',
    ],
    canEditSchedule: false,
    canEditMidweekOnly: false,
    canEditPublishers: false,
    canViewS21: false,
    canEditS21: false,
    canEditAttendance: false,
    canEditPublicTalks: false,
    canManageTerritories: false,
    canManageLiterature: false,
    canManageAccounts: true,
    canSuperviseConflicts: false,
    canModifySettings: false,
    isReadOnly: false,
  },

  publico: {
    id: 'publico',
    name: 'Modo Público / Cartelera del Salón',
    shortName: 'Modo Cartelera (Lectura)',
    badgeColor: 'bg-slate-700 text-white shadow-xs',
    description: 'Vista de solo lectura para el Salón o publicadores. No permite editar ni ver datos confidenciales.',
    allowedTabs: [
      'inicio',
      'programacion',
      'tablero_anuncios',
      'mi_vista',
    ],
    canEditSchedule: false,
    canEditMidweekOnly: false,
    canEditPublishers: false,
    canViewS21: false,
    canEditS21: false,
    canEditAttendance: false,
    canEditPublicTalks: false,
    canManageTerritories: false,
    canManageLiterature: false,
    canManageAccounts: false,
    canSuperviseConflicts: false,
    canModifySettings: false,
    isReadOnly: true,
  },
};

export function isTabAllowedForRole(role: TheocraticRole, tab: ActiveTab): boolean {
  if (tab === 'inicio' || tab === 'perfil' || tab === 'calendario') return true;
  const roleInfo = THEOCRATIC_ROLES[role];
  if (!roleInfo) return false;
  if (tab === 'clm_vmc') return roleInfo.allowedTabs.includes('programacion');
  return roleInfo.allowedTabs.includes(tab);
}
