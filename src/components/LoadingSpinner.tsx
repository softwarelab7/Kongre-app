import React from 'react';
import { Cloud, ShieldCheck, Lock } from 'lucide-react';
import { useOptionalCongregation } from '../context/CongregationContext';
import { ActiveTab } from './Navbar';

export interface LoadingSpinnerProps {
  /** Si se omite, detecta automáticamente el estado de sincronización con Supabase del contexto global */
  isVisible?: boolean;
  /** Título principal mostrado durante la sincronización */
  message?: string;
  /** Subtítulo técnico o descriptivo */
  submessage?: string;
  /** Pestaña activa actual para mostrar contexto adicional si se desea */
  activeTab?: ActiveTab | string;
  /** Modo de presentación: sobre el contenido de la pestaña ('overlay'), pantalla completa ('fullscreen') o en línea ('inline') */
  mode?: 'overlay' | 'fullscreen' | 'inline';
}

const TAB_LABELS: Record<string, string> = {
  inicio: 'Mi Ministerio',
  panorama_general: 'Panorama General',
  estadisticas_secretaria: 'Resumen y Estadísticas',
  calendario: 'Calendario Teocrático',
  programacion: 'Programación de Reuniones',
  clm_vmc: 'Vida y Ministerio Cristianos',
  s89: 'Asignaciones S-89',
  publicadores: 'Directorio de Publicadores',
  precursores_auxiliares: 'Precursores Auxiliares',
  grupos_servicio: 'Grupos de Servicio',
  territorios: 'Territorios',
  visita_sc: 'Visita del Superintendente',
  memorial_asambleas: 'Memorial y Asambleas',
  discursos: 'Discursos Públicos',
  hospitalidad: 'Hospitalidad',
  carritos: 'Predicación Pública (Carritos)',
  asistencia: 'Asistencia a Reuniones (S-88)',
  informe_s1: 'Informe a la Sucursal (S-1)',
  informes_servicio: 'Informes de Servicio (S-4)',
  tarjetas_s21: 'Tarjetas de Publicador (S-21)',
  cuentas: 'Cuentas de la Congregación',
  literatura: 'Literatura y Publicaciones',
  limpieza_deberes: 'Aseo y Deberes',
  panel_electrico: 'Panel Eléctrico',
  mantenimiento: 'Mantenimiento del Salón',
  tablero_anuncios: 'Tablero de Anuncios',
  conflictos: 'Centro de Conflictos',
  equidad: 'Equidad de Asignaciones',
  exportar_pdf: 'Formatos Oficiales y PDF',
  mi_vista: 'Mi Vista Personal',
  perfil: 'Mi Perfil',
  roles: 'Roles y Permisos',
  ajustes: 'Ajustes de la Congregación',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  isVisible,
  message = 'Sincronizando datos con Supabase',
  submessage = 'Cifrado Zero-Knowledge AES-256-GCM activo',
  activeTab,
  mode = 'overlay',
}) => {
  const congregation = useOptionalCongregation();

  const isSyncing =
    isVisible !== undefined
      ? isVisible
      : Boolean(
          congregation &&
            !congregation.isDemoMode &&
            (congregation.isSupabaseSyncing || congregation.syncStatus === 'saving')
        );

  if (!isSyncing) {
    return null;
  }

  const tabName = activeTab ? TAB_LABELS[activeTab] || '' : '';

  const spinnerCard = (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="relative overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-indigo-200/80 dark:border-indigo-800/70 shadow-2xl shadow-indigo-500/15 dark:shadow-black/50 px-6 py-5 sm:px-8 sm:py-6 max-w-sm w-[92%] sm:w-auto backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Barra superior luminosa animada */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="h-full w-1/2 bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 rounded-full animate-pulse" />
      </div>

      {/* Resplandor ambiental de fondo */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-28 h-28 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 w-28 h-28 rounded-full bg-violet-500/10 dark:bg-violet-400/10 blur-2xl" />

      <div className="relative flex flex-col items-center text-center gap-3.5">
        {/* Anillos orbitales concéntricos de carga */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Halo pulsante exterior */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/15 dark:bg-indigo-400/15 animate-ping" style={{ animationDuration: '2.2s' }} />

          {/* Anillo exterior rotatorio */}
          <div
            className="absolute inset-0 rounded-full border-[3px] border-slate-200/70 dark:border-slate-800/80 border-t-indigo-600 border-r-violet-500 dark:border-t-indigo-400 dark:border-r-violet-400 animate-spin"
            style={{ animationDuration: '1s' }}
          />

          {/* Anillo interior en rotación inversa */}
          <div
            className="absolute inset-2 rounded-full border-2 border-slate-200/40 dark:border-slate-800/50 border-b-emerald-500 border-l-indigo-400 dark:border-b-emerald-400 dark:border-l-indigo-300 animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
          />

          {/* Núcleo central con icono de nube segura */}
          <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
            <Cloud className="w-4 h-4 animate-pulse" />
          </div>
        </div>

        {/* Textos de estado */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              {message}
            </h4>
            <span className="inline-flex items-center gap-0.5 pt-1" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600 dark:bg-violet-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-bounce" />
            </span>
          </div>

          {tabName && (
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
              Actualizando vista: {tabName}
            </p>
          )}

          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 pt-0.5">
            <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{submessage}</span>
          </p>
        </div>

        {/* Insignia inferior de integridad */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/70 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Sincronización Segura en Tiempo Real</span>
        </div>
      </div>
    </div>
  );

  if (mode === 'inline') {
    return (
      <div className="w-full py-8 flex items-center justify-center">
        {spinnerCard}
      </div>
    );
  }

  if (mode === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/35 dark:bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-300">
        {spinnerCard}
      </div>
    );
  }

  // En móvil (< md) mostramos únicamente una barra superior delgada sin pop-up flotante
  return (
    <>
      <div className="md:hidden fixed top-14 left-0 right-0 z-30 h-1 bg-indigo-100 dark:bg-indigo-950 overflow-hidden pointer-events-none">
        <div className="h-full w-1/2 bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 animate-pulse" />
      </div>
      <div
        data-testid="supabase-tab-loading-overlay"
        className="hidden md:flex absolute inset-0 z-30 bg-slate-50/65 dark:bg-slate-950/65 backdrop-blur-[2px] items-start justify-center pt-20 sm:pt-28 transition-all duration-300 pointer-events-auto rounded-2xl"
      >
        <div className="sticky top-28 sm:top-36 flex justify-center w-full">
          {spinnerCard}
        </div>
      </div>
    </>
  );
};

export default LoadingSpinner;
