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
    <div className="bg-white dark:bg-[#121216] p-6 rounded-3xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-6">
      <div className="pb-3 border-b border-zinc-100 dark:border-[#27272A] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5]">
              Gestión de Datos y Limpieza de Pruebas
            </h3>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              Herramientas administrativas para restablecer la información de la congregación
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] leading-relaxed">
        Herramientas para eliminar los datos de prueba o demostración cargados en la aplicación, o reiniciar la información para comenzar desde cero con tu congregación real.
      </p>

      {cleanActionStatus && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2.5 animate-fade-in ${
            cleanActionStatus.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {cleanActionStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{cleanActionStatus.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setCleanActionStatus(null)}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Opción 1: Eliminar datos de prueba del Salón */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-zinc-900 dark:text-[#F4F4F5] font-bold text-xs mb-1">
              <Trash2 className="w-4 h-4 text-zinc-500" />
              <span>Eliminar Datos de Prueba</span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-[#A1A1AA] leading-relaxed">
              Limpia los circuitos de muestra del tablero eléctrico, fichas de mantenimiento de prueba, registros y asignaciones ficticias. <strong>Conserva el nombre de tu congregación y los horarios de reunión intactos.</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCleanSampleModal(true)}
            className="px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-[#27272A] hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-[#F4F4F5] text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar Datos de Prueba</span>
          </button>
        </div>

        {/* Opción 2: Vaciar publicadores de prueba */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-zinc-900 dark:text-[#F4F4F5] font-bold text-xs mb-1">
              <User className="w-4 h-4 text-zinc-500 dark:text-[#A1A1AA]" />
              <span>Vaciar Publicadores de Prueba</span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-[#A1A1AA] leading-relaxed">
              Elimina todos los publicadores de prueba agregados previamente si necesitas importar o escribir tu lista de hermanos real desde cero.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowClearPublishersModal(true)}
            className="px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-[#27272A] hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-[#F4F4F5] text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>Vaciar Lista de Publicadores</span>
          </button>
        </div>
      </div>

      {/* Zona de peligro */}
      <div className="pt-4 mt-2 border-t border-zinc-100 dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Zona de Peligro: Restablecer a Valores de Fábrica</span>
          </h4>
          <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
            Borra absolutamente todos los datos locales y en la nube y vuelve a la pantalla inicial de bienvenida.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setResetConfirmationText('');
            setShowResetAllModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
        >
          Restablecer Todo a Cero
        </button>
      </div>

      {/* MODAL: ELIMINAR DATOS DE PRUEBA */}
      {showCleanSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#27272A] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm">
                  Eliminar Datos de Prueba
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCleanSampleModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-[#F4F4F5] leading-relaxed">
              ¿Estás seguro de que deseas eliminar los datos de prueba? Esta acción limpiará:
            </p>
            <ul className="text-xs text-zinc-500 dark:text-[#A1A1AA] space-y-1 list-disc pl-5">
              <li>Circuitos de demostración del cuadro eléctrico.</li>
              <li>Fichas de mantenimiento de muestra.</li>
              <li>Asignaciones y registros de demostración en las semanas.</li>
              <li>Avisos y transacciones de prueba.</li>
            </ul>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              ✓ El nombre de tu congregación (<strong>{settings.congregationName || 'Tu congregación'}</strong>) y los horarios de tus reuniones se mantendrán guardados.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#27272A]">
              <button
                type="button"
                onClick={() => setShowCleanSampleModal(false)}
                className="px-4 py-2 rounded-xl text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] font-bold text-xs cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#27272A] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <User className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm">
                  Vaciar Publicadores de Prueba
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowClearPublishersModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-[#F4F4F5] leading-relaxed">
              ¿Deseas vaciar la lista de publicadores? Si agregaste nombres de prueba para ensayos, esto te permitirá comenzar con una lista completamente limpia para agregar o importar a los publicadores reales de tu congregación.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#27272A]">
              <button
                type="button"
                onClick={() => setShowClearPublishersModal(false)}
                className="px-4 py-2 rounded-xl text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] font-bold text-xs cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#27272A] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex items-center justify-center text-rose-500">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm">
                  Restablecer Toda la Aplicación
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowResetAllModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-[#F4F4F5] leading-relaxed">
              Esta acción borrará <strong>toda la congregación</strong>, configuración, contraseñas y registros almacenados. Volverás al asistente inicial de registro.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                Escribe <strong>RESETEAR</strong> para confirmar:
              </label>
              <input
                type="text"
                value={resetConfirmationText}
                onChange={(e) => setResetConfirmationText(e.target.value)}
                placeholder="RESETEAR"
                className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] focus:border-zinc-500 bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] font-mono text-center text-sm font-bold tracking-widest uppercase focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#27272A]">
              <button
                type="button"
                onClick={() => setShowResetAllModal(false)}
                className="px-4 py-2 rounded-xl text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] font-bold text-xs cursor-pointer"
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
