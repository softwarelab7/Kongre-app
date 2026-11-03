// src/components/Settings/sections/CloudSettingsSection.tsx
import React, { useState } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  X,
  Upload,
  Download,
  LogOut,
  Layers,
  Loader2,
  RefreshCw,
  Sparkles,
  Users,
  Calendar,
  MapPin,
  Bell,
  CreditCard,
  BookOpen,
  ShieldCheck,
  KeyRound,
  Clock,
} from 'lucide-react';
import { useCongregation } from '../../../context/CongregationContext';
import { useAuth } from '../../../context/AuthContext';

export interface CloudSettingsSectionProps {
  onOpenRotateModal: () => void;
}

export const CloudSettingsSection: React.FC<CloudSettingsSectionProps> = ({
  onOpenRotateModal,
}) => {
  const {
    uploadLocalDataToGoogle,
    downloadDataFromGoogle,
    publishers,
    weeks,
    territories,
    notices,
    transactions,
    literatureItems,
    granularSyncStats,
    checkGranularStatus,
    forceSubcollectionsMigration,
    syncNowWithSupabase,
    lastSupabaseSyncAt,
    isSupabaseSyncing,
    isDemoMode,
  } = useCongregation();

  const { user, signOutUser } = useAuth();

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudActionStatus, setCloudActionStatus] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Fase 4: Subcolecciones
  const [isCheckingGranular, setIsCheckingGranular] = useState(false);
  const [isMigratingSubcollections, setIsMigratingSubcollections] = useState(false);
  const [granularStatusMessage, setGranularStatusMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Supabase sync feedback
  const [supabaseSyncFeedback, setSupabaseSyncFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    msg: string;
  } | null>(null);

  const handleUploadToGoogle = async () => {
    setIsSyncingCloud(true);
    setCloudActionStatus(null);
    try {
      const res = await uploadLocalDataToGoogle();
      setCloudActionStatus({ type: res.success ? 'success' : 'error', msg: res.message });
    } catch (e: any) {
      setCloudActionStatus({
        type: 'error',
        msg: e?.message || 'Error al guardar en la nube de Google.',
      });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleDownloadFromGoogle = async () => {
    setIsSyncingCloud(true);
    setCloudActionStatus(null);
    try {
      const res = await downloadDataFromGoogle();
      setCloudActionStatus({ type: res.success ? 'success' : 'error', msg: res.message });
    } catch (e: any) {
      setCloudActionStatus({
        type: 'error',
        msg: e?.message || 'Error al descargar datos desde Google.',
      });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleCheckGranular = async () => {
    setIsCheckingGranular(true);
    setGranularStatusMessage(null);
    try {
      const stats = await checkGranularStatus();
      setGranularStatusMessage({
        type: 'success',
        text: `Verificación completada: ${stats.publishersCount} publicadores, ${stats.weeksCount} semanas, ${stats.territoriesCount} territorios y ${stats.noticesCount} anuncios activos en subcolecciones de Firestore.`,
      });
    } catch (err: any) {
      setGranularStatusMessage({
        type: 'error',
        text: 'Error diagnosticando subcolecciones: ' + (err?.message || 'Error de conexión'),
      });
    } finally {
      setIsCheckingGranular(false);
    }
  };

  const handleMigrateSubcollections = async () => {
    setIsMigratingSubcollections(true);
    setGranularStatusMessage(null);
    try {
      const res = await forceSubcollectionsMigration();
      if (res.success) {
        setGranularStatusMessage({
          type: 'success',
          text: `¡Migración a subcolecciones completada con éxito! ${res.message}`,
        });
      } else {
        setGranularStatusMessage({
          type: 'error',
          text: res.message,
        });
      }
    } catch (err: any) {
      setGranularStatusMessage({
        type: 'error',
        text: 'Error durante la migración: ' + (err?.message || 'Error desconocido'),
      });
    } finally {
      setIsMigratingSubcollections(false);
    }
  };

  const handleSyncSupabase = async (forceUpload: boolean = false) => {
    setSupabaseSyncFeedback(null);
    if (isDemoMode) {
      setSupabaseSyncFeedback({
        type: 'info',
        msg: 'El modo de demostración opera de manera 100% local sin conexión a Supabase.',
      });
      return;
    }
    try {
      const res = await syncNowWithSupabase(forceUpload);
      setSupabaseSyncFeedback({
        type: res.success ? 'success' : 'error',
        msg: res.message,
      });
    } catch (err: any) {
      setSupabaseSyncFeedback({
        type: 'error',
        msg: err?.message || 'Error al conectar con Supabase.',
      });
    }
  };

  return (
    <div className="kg-card-bento kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 p-6 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/10 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="kg-glow-badge w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/50 dark:border-sky-800/50 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5]">
              Respaldo Automático en la Nube
            </h3>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              Sincronización segura de la congregación con Supabase (Cifrado AES-256)
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            user
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
              : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500'}`}
          />
          {user ? 'Google Conectado' : 'Respaldo automático por ID'}
        </span>
      </div>

      {cloudActionStatus && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2.5 animate-fade-in ${
            cloudActionStatus.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {cloudActionStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{cloudActionStatus.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setCloudActionStatus(null)}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] text-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-bold text-zinc-800 dark:text-[#F4F4F5] flex items-center gap-2">
            {user ? (
              <>
                <span>Conectado como:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs">
                  {user.email}
                </span>
              </>
            ) : (
              <span>Modo Local / Sincronización por ID de Congregación</span>
            )}
          </p>
          <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] leading-relaxed max-w-xl">
            {user
              ? 'Tus datos de la congregación (publicadores, reuniones, programas CLM, asignaciones y ajustes) se respaldan automáticamente en la nube bajo el ID de tu congregación, sin importar la cuenta con la que entres.'
              : 'Tus datos de la congregación (ID y PIN) se respaldan automáticamente en la nube bajo el ID de la congregación en cada cambio guardado.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {user ? (
            <>
              <button
                type="button"
                onClick={handleUploadToGoogle}
                disabled={isSyncingCloud}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer disabled:opacity-60"
                title="Subir y guardar todos los datos locales actuales en tu cuenta de Google Firestore"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isSyncingCloud ? 'Guardando...' : 'Subir datos a Google'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadFromGoogle}
                disabled={isSyncingCloud}
                className="px-3.5 py-2 rounded-xl bg-zinc-200 dark:bg-[#27272A] hover:bg-zinc-300 dark:hover:bg-[#3F3F46] text-zinc-800 dark:text-[#F4F4F5] text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-60"
                title="Descargar y restaurar datos teocráticos desde Google Firestore"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Restaurar de Google</span>
              </button>
              <button
                type="button"
                onClick={signOutUser}
                className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-600 hover:text-rose-600 dark:text-[#A1A1AA] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Desconectar cuenta de Google"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Desconectar</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleUploadToGoogle}
              disabled={isSyncingCloud}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs active:scale-95 cursor-pointer"
            >
              <Cloud className="w-4 h-4" />
              <span>{isSyncingCloud ? 'Guardando...' : 'Guardar ahora en la nube'}</span>
            </button>
          )}
        </div>
      </div>

      {/* PANEL FASE 4: SINCRONIZACIÓN GRANULAR COLABORATIVA POR SUBCOLECCIONES */}
      <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-white/10 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="kg-glow-badge w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-[#F4F4F5]">
                  Fase 4: Sincronización Granular Colaborativa
                </h4>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Subcolecciones en Vivo
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Cada departamento teocrático sincroniza su propia subcolección en Firestore sin sobreescribir el trabajo de otros hermanos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCheckGranular}
              disabled={isCheckingGranular || isMigratingSubcollections}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Verifica el número de documentos reales sincronizados en cada subcolección de Firestore"
            >
              {isCheckingGranular ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>Diagnosticar</span>
            </button>
            <button
              type="button"
              onClick={handleMigrateSubcollections}
              disabled={isCheckingGranular || isMigratingSubcollections}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
              title="Migra o verifica todos los registros hacia subcolecciones granulares en Firestore"
            >
              {isMigratingSubcollections ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isMigratingSubcollections ? 'Sincronizando...' : 'Migrar a Subcolecciones'}</span>
            </button>
          </div>
        </div>

        {granularStatusMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2.5 animate-fade-in ${
              granularStatusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : granularStatusMessage.type === 'info'
                ? 'bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200'
                : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {granularStatusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{granularStatusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setGranularStatusMessage(null)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] text-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Grid con las 6 subcolecciones modulares */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Subcolección 1: Publicadores */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                <Users className="w-4 h-4" />
                <span>/publishers</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tabular-nums bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {granularSyncStats?.publishersCount ?? publishers.length} docs
              </span>
            </div>
            <p className="text-[11px] text-zinc-700 dark:text-[#F4F4F5] font-medium">
              Publicadores y Tarjetas S-21
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-[#71717A]">
              Coordinador & Secretario • Escucha y guarda independientemente.
            </p>
          </div>

          {/* Subcolección 2: Semanas VyM */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <Calendar className="w-4 h-4" />
                <span>/weeks</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tabular-nums bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {granularSyncStats?.weeksCount ?? weeks.length} semanas
              </span>
            </div>
            <p className="text-[11px] text-zinc-700 dark:text-[#F4F4F5] font-medium">
              Vida y Ministerio & Deberes
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-[#71717A]">
              Supt. VyM & Coordinador • Cada semana es un documento aislado.
            </p>
          </div>

          {/* Subcolección 3: Territorios */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                <MapPin className="w-4 h-4" />
                <span>/territories</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tabular-nums bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                {granularSyncStats?.territoriesCount ?? territories.length} territorios
              </span>
            </div>
            <p className="text-[11px] text-zinc-700 dark:text-[#F4F4F5] font-medium">
              Territorios y Manzanas S-13
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-[#71717A]">
              Siervo de Territorios • Actualizaciones sin bloqueo concurrente.
            </p>
          </div>

          {/* Subcolección 4: Tablero de Anuncios */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-xs">
                <Bell className="w-4 h-4" />
                <span>/notices</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tabular-nums bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                {granularSyncStats?.noticesCount ?? notices.length} anuncios
              </span>
            </div>
            <p className="text-[11px] text-zinc-700 dark:text-[#F4F4F5] font-medium">
              Tablero de Anuncios Oficial
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-[#71717A]">
              Lectura congregacional y redacción exclusiva de ancianos.
            </p>
          </div>

          {/* Subcolección 5: Cuentas */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs">
                <CreditCard className="w-4 h-4" />
                <span>/accounts</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tabular-nums bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                {transactions.length} txs
              </span>
            </div>
            <p className="text-[11px] text-zinc-700 dark:text-[#F4F4F5] font-medium">
              Libro de Cuentas S-26 y Auditorías
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-[#71717A]">
              Siervo de Cuentas • Privacidad garantizada por reglas de seguridad.
            </p>
          </div>

          {/* Subcolección 6: Literatura */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-xs">
                <BookOpen className="w-4 h-4" />
                <span>/literature</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tabular-nums bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                {literatureItems.length} items
              </span>
            </div>
            <p className="text-[11px] text-zinc-700 dark:text-[#F4F4F5] font-medium">
              Almacén de Literatura e Inventario
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-[#71717A]">
              Siervo de Literatura • Pedidos y recuentos físicos aislados.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-[#18181F] border border-indigo-100 dark:border-[#27272A] text-[11px] text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Colaboración Concurrente Segura:</span> Gracias a la Fase 4, si varios hermanos (coordinador, secretario, siervos) editan el sistema simultáneamente desde distintas computadoras o teléfonos, no hay riesgo de sobreescribir el trabajo ajeno.
          </div>
        </div>
      </div>

      {/* PANEL SUPABASE: SINCRONIZACIÓN CIFRADA DE CERO CONOCIMIENTO (AES-256-GCM) */}
      <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-white/10 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="kg-glow-badge w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-[#F4F4F5]">
                  Cero Conocimiento: Supabase (AES-256-GCM)
                </h4>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Cifrado Militar en Dispositivo
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Los datos se cifran con tu PIN antes de enviarse a Supabase. Nadie en internet ni en los servidores puede leer tus registros teocráticos.
              </p>
            </div>
          </div>

          {isDemoMode ? (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Modo Demostración Activo:</strong> La conexión con Supabase está deshabilitada. Los datos son locales para proteger la nube.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleSyncSupabase(false)}
                disabled={isSupabaseSyncing}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                title="Sincroniza y combina bidireccionalmente los datos con Supabase"
              >
                {isSupabaseSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>{isSupabaseSyncing ? 'Sincronizando...' : 'Sincronizar con Supabase'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSyncSupabase(true)}
                disabled={isSupabaseSyncing}
                className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Fuerza la subida del snapshot local cifrado a Supabase"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Forzar Subida</span>
              </button>
              <button
                type="button"
                onClick={onOpenRotateModal}
                disabled={isSupabaseSyncing}
                className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Rotar PIN de congregación o PIN maestro con revocación inmediata en la nube"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Rotar Credenciales</span>
              </button>
            </div>
          )}
        </div>

        {supabaseSyncFeedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2.5 animate-fade-in ${
              supabaseSyncFeedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {supabaseSyncFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{supabaseSyncFeedback.msg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSupabaseSyncFeedback(null)}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] text-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-[#71717A] uppercase tracking-wider">Última Sincronización</p>
            <p className="text-xs font-bold text-zinc-800 dark:text-[#F4F4F5] flex items-center gap-1.5 font-mono tabular-nums">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {lastSupabaseSyncAt
                  ? new Date(lastSupabaseSyncAt).toLocaleString('es-MX', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'Pendiente de sincronizar'}
              </span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-[#71717A] uppercase tracking-wider">Cifrado de Payload</p>
            <p className="text-xs font-bold text-zinc-800 dark:text-[#F4F4F5] flex items-center gap-1.5 font-mono tabular-nums">
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              <span>AES-256-GCM (100k PBKDF2)</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-[#71717A] uppercase tracking-wider">Resolución de Conflictos</p>
            <p className="text-xs font-bold text-zinc-800 dark:text-[#F4F4F5] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-500" />
              <span>Fusión Inteligente No Destructiva</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
