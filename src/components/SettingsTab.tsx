// src/components/SettingsTab.tsx
import React, { useState, useRef } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Settings,
  Shield,
  Cloud,
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  LogOut,
  Save,
  Sliders,
  Calendar,
  Sun,
  Moon,
  Tv,
  Sparkles,
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const { settings, updateSettings, exportBackupJSON, importBackupJSON } = useCongregation();
  const { user, signInWithGoogle, signOutUser } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [congName, setCongName] = useState(settings.congregationName);
  const [midDay, setMidDay] = useState(settings.midweekMeetingDay);
  const [midTime, setMidTime] = useState(settings.midweekMeetingTime);
  const [fdsDay, setFdsDay] = useState(settings.weekendMeetingDay);
  const [fdsTime, setFdsTime] = useState(settings.weekendMeetingTime);
  const [hallAddress, setHallAddress] = useState(settings.hallAddress || '');

  // Rules state
  const [allowPartAndDuty, setAllowPartAndDuty] = useState(settings.conflictRules.allowPartAndDutySameMeeting);
  const [allowAudioAndMics, setAllowAudioAndMics] = useState(settings.conflictRules.allowAudioAndMicrophones);
  const [allowPresAndPart, setAllowPresAndPart] = useState(settings.conflictRules.allowPresidentAndOtherPart);
  const [maxConsecutiveDuty, setMaxConsecutiveDuty] = useState(settings.conflictRules.maxConsecutiveWeeksWithDuty);
  const [maxConsecutivePart, setMaxConsecutivePart] = useState(settings.conflictRules.maxConsecutiveWeeksWithPart);
  const [enforceSisters, setEnforceSisters] = useState(settings.conflictRules.enforceSisterDemonstrationRules);
  const [warnOutlineMonths, setWarnOutlineMonths] = useState(settings.conflictRules.warnOutlineRepeatedWithinMonths || 12);

  const [savedFeedback, setSavedFeedback] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      congregationName: congName.trim(),
      midweekMeetingDay: midDay,
      midweekMeetingTime: midTime,
      weekendMeetingDay: fdsDay,
      weekendMeetingTime: fdsTime,
      hallAddress: hallAddress.trim(),
      conflictRules: {
        allowPartAndDutySameMeeting: allowPartAndDuty,
        allowAudioAndMicrophones: allowAudioAndMics,
        allowPresidentAndOtherPart: allowPresAndPart,
        maxConsecutiveWeeksWithDuty: Number(maxConsecutiveDuty),
        maxConsecutiveWeeksWithPart: Number(maxConsecutivePart),
        enforceSisterDemonstrationRules: enforceSisters,
        warnOutlineRepeatedWithinMonths: Number(warnOutlineMonths) || 12,
      },
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const success = importBackupJSON(content);
      if (success) {
        setImportStatus('¡Respaldo restaurado exitosamente!');
      } else {
        setImportStatus('Error: El archivo no tiene un formato válido.');
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Configuración y Reglas del Sistema</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personaliza los horarios de reunión, las reglas de prevención de conflictos y los respaldos en la nube.
          </p>
        </div>
      </div>

      {/* AMBIENTACIÓN Y MODO OSCURO (CABINA & SALÓN DEL REINO) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Ambientación y Modo Oscuro (Cabina & Salón)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Optimizado para la cabina de audio y video, consola de Zoom y acomodadores en el fondo del auditorio.
            </p>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 self-start sm:self-auto">
            Activo: {themeMode === 'light' ? '☀️ Modo Claro' : themeMode === 'dark' ? '🌙 Modo Oscuro' : '🎛️ Modo Cabina'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* 1. Modo Claro */}
          <button
            type="button"
            onClick={() => setThemeMode('light')}
            className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
              themeMode === 'light'
                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <Sun className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Modo Claro (Día)</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Fondo blanco estándar. Óptimo para lectura diurna, secretaría y preparación de asignaciones en casa.
            </p>
          </button>

          {/* 2. Modo Oscuro */}
          <button
            type="button"
            onClick={() => setThemeMode('dark')}
            className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
              themeMode === 'dark'
                ? 'bg-indigo-950/30 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-900/60 text-indigo-400 flex items-center justify-center mb-3 border border-indigo-800">
              <Moon className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Modo Oscuro (Noche)</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tonos carbón y pizarra. Descansa la vista y ahorra batería en dispositivos portátiles.
            </p>
          </button>

          {/* 3. Modo Cabina & Acomodadores */}
          <button
            type="button"
            onClick={() => setThemeMode('cabina')}
            className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
              themeMode === 'cabina'
                ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-950/70 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-800">
              <Tv className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Modo Cabina & Salón</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Negro OLED ultra-profundo con atenuación de destellos para no iluminar el auditorio durante la reunión.
            </p>
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* 1. INFORMACIÓN DE LA CONGREGACIÓN */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Información y Horarios de Reunión</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre de la Congregación
              </label>
              <input
                type="text"
                required
                value={congName}
                onChange={e => setCongName(e.target.value)}
                placeholder="Ej. Congregación El Olivar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Dirección del Salón del Reino
              </label>
              <input
                type="text"
                value={hallAddress}
                onChange={e => setHallAddress(e.target.value)}
                placeholder="Ej. Av. Las Palmeras 450"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Midweek meeting day & time */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Día Entre Semana
                </label>
                <select
                  value={midDay}
                  onChange={e => setMidDay(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Lunes">Lunes</option>
                  <option value="Martes">Martes</option>
                  <option value="Miércoles">Miércoles</option>
                  <option value="Jueves">Jueves</option>
                  <option value="Viernes">Viernes</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Hora de Inicio
                </label>
                <input
                  type="time"
                  value={midTime}
                  onChange={e => setMidTime(e.target.value)}
                  className="w-full p-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>

            {/* Weekend meeting day & time */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Día Fin de Semana
                </label>
                <select
                  value={fdsDay}
                  onChange={e => setFdsDay(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Sábado">Sábado</option>
                  <option value="Domingo">Domingo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Hora de Inicio
                </label>
                <input
                  type="time"
                  value={fdsTime}
                  onChange={e => setFdsTime(e.target.value)}
                  className="w-full p-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. REGLAS DE DETECCIÓN DE CONFLICTOS */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Reglas de Detección de Cruces y Conflictos</span>
          </h3>

          <p className="text-xs text-slate-500">
            Define qué asignaciones simultáneas están prohibidas para que el sistema emita alertas en tiempo real y el autoasignador evite cometer errores.
          </p>

          <div className="space-y-3 text-xs">
            {/* Rule 1: Part + Duty clash */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={allowPartAndDuty}
                onChange={e => setAllowPartAndDuty(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  Permitir que quien tenga una parte en el programa tenga también un deber
                </p>
                <p className="text-slate-500 mt-0.5">
                  Si se desmarca (recomendado), el sistema generará un error crítico si alguien con parte en plataforma es asignado simultáneamente a Audio, Video, Micrófonos o Acomodador.
                </p>
              </div>
            </label>

            {/* Rule 2: Audio + Mic clash */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={allowAudioAndMics}
                onChange={e => setAllowAudioAndMics(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  Permitir que el operador de Audio/Video haga micrófonos al mismo tiempo
                </p>
                <p className="text-slate-500 mt-0.5">
                  Si se desmarca, evitará que una persona que debe estar en cabina técnica sea asignada a correr micrófonos o estar en la puerta.
                </p>
              </div>
            </label>

            {/* Rule 3: President clash */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={allowPresAndPart}
                onChange={e => setAllowPresAndPart(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  Permitir que el Presidente de la reunión tenga otra parte o deber
                </p>
                <p className="text-slate-500 mt-0.5">
                  Si se desmarca, alertará para que el presidente se enfoque exclusivamente en dirigir la reunión.
                </p>
              </div>
            </label>

            {/* Rule 4: Sister demonstrations */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={enforceSisters}
                onChange={e => setEnforceSisters(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  Exigir que la ayudante de una hermana titular sea siempre otra hermana
                </p>
                <p className="text-slate-500 mt-0.5">
                  Alineado con las directrices de la Escuela del Ministerio Teocrático / Vida y Ministerio.
                </p>
              </div>
            </label>

            {/* Consecutive weeks control */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Límite de semanas seguidas con deberes:
                </label>
                <select
                  value={maxConsecutiveDuty}
                  onChange={e => setMaxConsecutiveDuty(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value={1}>1 semana (Rotación semanal estricta)</option>
                  <option value={2}>2 semanas seguidas (Recomendado)</option>
                  <option value={3}>3 semanas seguidas</option>
                  <option value={4}>4 semanas seguidas</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Límite de semanas seguidas con partes:
                </label>
                <select
                  value={maxConsecutivePart}
                  onChange={e => setMaxConsecutivePart(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value={1}>1 semana</option>
                  <option value={2}>2 semanas seguidas (Recomendado)</option>
                  <option value={3}>3 semanas seguidas</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-800 mb-1">
                  Alerta de repetición de Bosquejos Públicos (NW Scheduler):
                </label>
                <select
                  value={warnOutlineMonths}
                  onChange={e => setWarnOutlineMonths(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value={6}>No repetir el mismo bosquejo antes de 6 meses</option>
                  <option value={9}>No repetir el mismo bosquejo antes de 9 meses</option>
                  <option value={12}>No repetir antes de 12 meses (Recomendación Teocrática)</option>
                  <option value={18}>No repetir antes de 18 meses</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Save button bar */}
        <div className="flex items-center justify-end gap-3">
          {savedFeedback && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              ¡Configuración guardada correctamente!
            </span>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>

      {/* 3. SINCRONIZACIÓN EN LA NUBE Y GOOGLE AUTH */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Cloud className="w-4 h-4 text-indigo-600" />
          <span>Sincronización en la Nube con Google y Firebase</span>
        </h3>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-800">
              {user ? `Conectado como: ${user.displayName || user.email}` : 'Modo fuera de línea / Almacenamiento local'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {user
                ? 'Tus datos se sincronizan automáticamente en Firestore vinculados a tu cuenta de Google.'
                : 'Inicia sesión con Google para sincronizar en tiempo real entre tu teléfono celular y tu computadora.'}
            </p>
          </div>

          <div>
            {user ? (
              <button
                type="button"
                onClick={signOutUser}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Desconectar Cuenta</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión con Google</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. RESPALDO Y RESTAURACIÓN EN JSON */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600" />
          <span>Copia de Seguridad y Restauración (JSON)</span>
        </h3>

        <p className="text-xs text-slate-500">
          Descarga un archivo con todos los publicadores, semanas, deberes y reglas para tener un respaldo en tu computadora o restaurarlo cuando lo desees.
        </p>

        {importStatus && (
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportBackupJSON}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Respaldo JSON Completo</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Restaurar desde Respaldo JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
