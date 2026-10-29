// src/components/Settings/sections/MaintenanceSection.tsx
import React, { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  User,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useCongregation } from '../../../context/CongregationContext';

export const MaintenanceSection: React.FC = () => {
  const {
    settings,
    cleanSampleData,
    clearAllPublishers,
    deleteAllRegisteredCongregations,
  } = useCongregation();

  const [cleanActionStatus, setCleanActionStatus] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const [showCleanSampleModal, setShowCleanSampleModal] = useState(false);
  const [showClearPublishersModal, setShowClearPublishersModal] = useState(false);
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [isCleaning, setIsCleaning] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Gestión de Datos y Limpieza de Pruebas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Herramientas administrativas para restablecer la información de la congregación
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        Herramientas para eliminar los datos de prueba o demostración cargados en la aplicación, o reiniciar la información para comenzar desde cero con tu congregación real.
      </p>

      {cleanActionStatus && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2.5 animate-fade-in ${
            cleanActionStatus.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {cleanActionStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{cleanActionStatus.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setCleanActionStatus(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Opción 1: Eliminar datos de prueba del Salón */}
        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs mb-1">
              <Trash2 className="w-4 h-4 text-amber-600" />
              <span>Eliminar Datos de Prueba</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Limpia los circuitos de muestra del tablero eléctrico, fichas de mantenimiento de prueba, registros y asignaciones ficticias. <strong>Conserva el nombre de tu congregación y los horarios de reunión intactos.</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCleanSampleModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar Datos de Prueba</span>
          </button>
        </div>

        {/* Opción 2: Vaciar publicadores de prueba */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs mb-1">
              <User className="w-4 h-4 text-slate-500" />
              <span>Vaciar Publicadores de Prueba</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Elimina todos los publicadores de prueba agregados previamente si necesitas importar o escribir tu lista de hermanos real desde cero.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowClearPublishersModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>Vaciar Lista de Publicadores</span>
          </button>
        </div>
      </div>

      {/* Zona de peligro */}
      <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Zona de Peligro: Restablecer a Valores de Fábrica</span>
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Borra absolutamente todos los datos locales y en la nube y vuelve a la pantalla inicial de bienvenida.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setResetConfirmationText('');
            setShowResetAllModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
        >
          Restablecer Todo a Cero
        </button>
      </div>

      {/* MODAL: ELIMINAR DATOS DE PRUEBA */}
      {showCleanSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Eliminar Datos de Prueba
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCleanSampleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ¿Estás seguro de que deseas eliminar los datos de prueba? Esta acción limpiará:
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc pl-5">
              <li>Circuitos de demostración del cuadro eléctrico.</li>
              <li>Fichas de mantenimiento de muestra.</li>
              <li>Asignaciones y registros de demostración en las semanas.</li>
              <li>Avisos y transacciones de prueba.</li>
            </ul>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
              ✓ El nombre de tu congregación (<strong>{settings.congregationName || 'Tu congregación'}</strong>) y los horarios de tus reuniones se mantendrán guardados.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowCleanSampleModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isCleaning}
                onClick={async () => {
                  setIsCleaning(true);
                  try {
                    await cleanSampleData();
                    setShowCleanSampleModal(false);
                    setCleanActionStatus({
                      type: 'success',
                      msg: '¡Datos de prueba eliminados exitosamente! Tu congregación y horarios están protegidos.',
                    });
                  } catch (e: any) {
                    setCleanActionStatus({
                      type: 'error',
                      msg: e?.message || 'Error al eliminar datos de prueba.',
                    });
                  } finally {
                    setIsCleaning(false);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isCleaning ? 'Eliminando...' : 'Sí, Eliminar Datos de Prueba'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VACIAR PUBLICADORES */}
      {showClearPublishersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <User className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Vaciar Publicadores de Prueba
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowClearPublishersModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ¿Deseas vaciar la lista de publicadores? Si agregaste nombres de prueba para ensayos, esto te permitirá comenzar con una lista completamente limpia para agregar o importar a los publicadores reales de tu congregación.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowClearPublishersModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isCleaning}
                onClick={async () => {
                  setIsCleaning(true);
                  try {
                    await clearAllPublishers();
                    setShowClearPublishersModal(false);
                    setCleanActionStatus({
                      type: 'success',
                      msg: 'Directorio de publicadores vaciado con éxito.',
                    });
                  } catch (e: any) {
                    setCleanActionStatus({
                      type: 'error',
                      msg: e?.message || 'Error al vaciar publicadores.',
                    });
                  } finally {
                    setIsCleaning(false);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isCleaning ? 'Vaciando...' : 'Sí, Vaciar Publicadores'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET TOTAL */}
      {showResetAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-950 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-rose-700 dark:text-rose-400 text-sm">
                  Restablecer Toda la Aplicación
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowResetAllModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Esta acción borrará <strong>toda la congregación</strong>, configuración, contraseñas y registros almacenados. Volverás al asistente inicial de registro.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Escribe <strong>RESETEAR</strong> para confirmar:
              </label>
              <input
                type="text"
                value={resetConfirmationText}
                onChange={(e) => setResetConfirmationText(e.target.value)}
                placeholder="RESETEAR"
                className="w-full p-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 font-mono text-center text-sm font-bold tracking-widest uppercase"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetAllModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={resetConfirmationText.trim().toUpperCase() !== 'RESETEAR'}
                onClick={async () => {
                  setShowResetAllModal(false);
                  await deleteAllRegisteredCongregations();
                  window.location.reload();
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-md disabled:opacity-40 flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Confirmar Restablecimiento Total</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
