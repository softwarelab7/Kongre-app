// src/components/ConflictsModal.tsx
import React, { useState } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useToast } from '../context/ToastContext';
import { openWhatsAppLink } from '../utils/whatsapp';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
} from '../services/notificationService';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  X,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  BellRing,
  Bell,
  MessageCircle,
  ShoppingBag,
  FileText,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';

export interface ConflictsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToWeek: (weekId: string) => void;
  initialTab?: 'reminders' | 'conflicts';
}

export const ConflictsModal: React.FC<ConflictsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToWeek,
  initialTab = 'reminders',
}) => {
  const {
    conflicts,
    allWeeksConflicts,
    theocraticReminders,
    updateAssignmentStatus,
  } = useCongregation();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'reminders' | 'conflicts'>(() => {
    // Si hay recordatorios pendientes, priorizar pestaña de recordatorios; de lo contrario, si hay conflictos, mostrar conflictos
    if (initialTab === 'conflicts') return 'conflicts';
    if (theocraticReminders.totalAttentionCount > 0) return 'reminders';
    if (conflicts.length > 0 || allWeeksConflicts.length > 0) return 'conflicts';
    return 'reminders';
  });

  const [viewScope, setViewScope] = useState<'current' | 'all'>('current');
  const [notificationPerm, setNotificationPerm] = useState<NotificationPermission>(() =>
    isNotificationSupported() ? getNotificationPermission() : 'denied'
  );
  const [confirmedItemIds, setConfirmedItemIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const currentConflictList = viewScope === 'current' ? conflicts : allWeeksConflicts;
  const errorCount = currentConflictList.filter((c) => c.severity === 'error').length;
  const warningCount = currentConflictList.filter((c) => c.severity === 'warning').length;

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPerm(perm);
    if (perm === 'granted') {
      showToast('Notificaciones de escritorio habilitadas en este equipo.', 'success');
      sendTestNotification('Hermano(a)');
    } else if (perm === 'denied') {
      showToast('Las notificaciones fueron bloqueadas en este navegador.', 'error');
    }
  };

  const handleSendTestNotification = async () => {
    const success = await sendTestNotification('Hermano(a)');
    if (success) {
      showToast('Notificación de prueba enviada al sistema operativo.', 'success');
    } else {
      showToast('No se pudo enviar la notificación. Verifica los permisos del sistema.', 'error');
    }
  };

  const handleConfirmAssignment = (
    weekId: string,
    meetingType: 'midweek' | 'weekend',
    assignmentPath: string,
    publisherName: string,
    id: string
  ) => {
    updateAssignmentStatus(weekId, meetingType, assignmentPath, 'confirmada');
    setConfirmedItemIds((prev) => new Set(prev).add(id));
    showToast(`Asignación de ${publisherName} marcada como confirmada.`, 'success');
  };

  const handleSendWhatsAppReminder = (phone: string, text: string, name: string) => {
    openWhatsAppLink(phone, text);
    showToast(`Abriendo WhatsApp para enviar recordatorio a ${name}...`, 'info');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Centro de Notificaciones y Recordatorios"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/60 backdrop-blur-md"
    >
      <div className="kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[90dvh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-zinc-200/80 dark:border-white/10 pb-[env(safe-area-inset-bottom,0px)] sm:pb-0 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 overflow-hidden">
        {/* Cabecera del Centro de Notificaciones */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-100 dark:border-[#27272A] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              data-mobile-back-btn="true"
              onClick={onClose}
              aria-label="Volver"
              className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-100 dark:bg-[#18181F] text-zinc-800 dark:text-zinc-100 shrink-0 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </button>
            <div
              className={`kg-glow-badge hidden sm:flex w-10 h-10 rounded-xl items-center justify-center ${
                theocraticReminders.hasUrgentItems || errorCount > 0
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                  : theocraticReminders.totalAttentionCount > 0 || currentConflictList.length > 0
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {theocraticReminders.hasUrgentItems || errorCount > 0 ? (
                <AlertOctagon className="w-5 h-5" />
              ) : theocraticReminders.totalAttentionCount > 0 || currentConflictList.length > 0 ? (
                <BellRing className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>Centro de Notificaciones y Alertas</span>
                {theocraticReminders.hasUrgentItems && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse">
                    Acción Requerida
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Recordatorios activos de asignaciones, turnos de carritos, informes y cruces de horario.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de notificaciones"
            className="hidden sm:flex p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#27272A] min-h-[44px] min-w-[44px] items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Pestañas: Recordatorios vs Conflictos */}
        <div className="px-4 sm:px-6 py-2.5 bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-100 dark:border-[#27272A] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-200/70 dark:bg-[#18181F] p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('reminders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'reminders'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-zinc-600 dark:text-[#D4D4D8] hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Recordatorios y Pendientes</span>
              {theocraticReminders.totalAttentionCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                  {theocraticReminders.totalAttentionCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('conflicts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'conflicts'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-zinc-600 dark:text-[#D4D4D8] hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cruces de Horario</span>
              {allWeeksConflicts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
                  {allWeeksConflicts.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'conflicts' && (
            <div className="flex items-center gap-1.5 bg-zinc-200/50 dark:bg-[#18181F]/80 p-0.5 rounded-lg text-[11px] font-medium">
              <button
                onClick={() => setViewScope('current')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewScope === 'current'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
                }`}
              >
                Semana Actual ({conflicts.length})
              </button>
              <button
                onClick={() => setViewScope('all')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewScope === 'all'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
                }`}
              >
                Todas ({allWeeksConflicts.length})
              </button>
            </div>
          )}
        </div>

        {/* CUERPO: PESTAÑA RECORDATORIOS */}
        {activeTab === 'reminders' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Banner de Notificaciones de Escritorio / Sistema */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-100/70 dark:bg-[#18181F]/60 border border-zinc-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    notificationPerm === 'granted'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                    Notificaciones Nativas del Sistema
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] leading-relaxed">
                    {notificationPerm === 'granted'
                      ? 'Las notificaciones de escritorio están habilitadas para recordarte reuniones y avisos teocráticos.'
                      : notificationPerm === 'denied'
                      ? 'Las notificaciones están bloqueadas en tu navegador. Puedes activarlas desde el candado de la URL.'
                      : 'Activa las notificaciones del equipo para recibir avisos sin depender de tener la pestaña abierta.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {notificationPerm === 'granted' ? (
                  <button
                    type="button"
                    onClick={handleSendTestNotification}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#27272A] text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all cursor-pointer shadow-2xs"
                  >
                    Probar Aviso
                  </button>
                ) : notificationPerm !== 'denied' ? (
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-sm shadow-indigo-600/25"
                  >
                    Permitir Notificaciones
                  </button>
                ) : null}
              </div>
            </div>

            {/* SECCIÓN 1: ASIGNACIONES SIN CONFIRMAR */}
            {theocraticReminders.unconfirmedAssignments.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Asignaciones Próximas sin Confirmar</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {theocraticReminders.unconfirmedAssignments.length}
                    </span>
                  </h4>
                </div>

                <div className="space-y-2">
                  {theocraticReminders.unconfirmedAssignments.map((item) => {
                    const isAlreadyConfirmed = confirmedItemIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isAlreadyConfirmed
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : item.isUrgent
                            ? 'bg-rose-500/5 border-rose-500/25 dark:border-rose-500/20 shadow-xs'
                            : 'bg-white dark:bg-[#18181F]/70 border-zinc-200/80 dark:border-white/10'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                                {item.publisherName}
                              </span>
                              {item.isUrgent && !isAlreadyConfirmed && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500 text-white animate-pulse">
                                  ¡Reunión en &lt; 48h!
                                </span>
                              )}
                              <span className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                                • {item.formattedDate}
                              </span>
                            </div>

                            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">
                              {item.roleTitle}
                              {item.assistantName ? ` (Ayudante: ${item.assistantName})` : ''}
                              {item.room === 'auxiliar' ? ' • Sala Auxiliar' : ''}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {isAlreadyConfirmed ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <Check className="w-3.5 h-3.5" />
                                Confirmada
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSendWhatsAppReminder(
                                      item.publisherPhone,
                                      item.whatsappMessage,
                                      item.publisherName
                                    )
                                  }
                                  title="Enviar recordatorio amistoso por WhatsApp"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-sm shadow-emerald-600/20"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>Recordar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleConfirmAssignment(
                                      item.weekId,
                                      item.meetingType,
                                      item.assignmentPath,
                                      item.publisherName,
                                      item.id
                                    )
                                  }
                                  title="Marcar como confirmada en 1 clic"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-indigo-50 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 hover:text-indigo-600 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/10 transition-all cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Confirmar</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECCIÓN 2: TURNOS DE CARRITOS SIN CUBRIR */}
            {theocraticReminders.uncoveredCartShifts.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                    <span>Turnos de Carritos con Vacantes</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      {theocraticReminders.uncoveredCartShifts.length}
                    </span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {theocraticReminders.uncoveredCartShifts.slice(0, 6).map((shift) => (
                    <div
                      key={shift.id}
                      className="p-3 rounded-2xl bg-white dark:bg-[#18181F]/70 border border-zinc-200/80 dark:border-white/10 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                          {shift.locationName}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                            shift.isCritical
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {shift.vacanciesCount === 2 ? 'Descubierto (2 vacantes)' : 'Falta 1 publicador'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                        📅 {shift.dayOfWeek} • ⏰ {shift.timeSlot}
                      </p>
                      {shift.currentPublishers.length > 0 && (
                        <p className="text-[10px] text-zinc-600 dark:text-zinc-300 font-medium">
                          Asignado: {shift.currentPublishers.map((p) => p.name).join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN 3: INFORMES DE SERVICIO DEL CAMPO PENDIENTES */}
            {theocraticReminders.pendingReports.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Cierre de Mes: Informes S-4 Pendientes</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {theocraticReminders.pendingReports.length}
                    </span>
                  </h4>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {theocraticReminders.pendingReports.map((rep) => (
                    <div
                      key={rep.publisherId}
                      className="p-2.5 px-3 rounded-xl bg-white dark:bg-[#18181F]/70 border border-zinc-200/80 dark:border-white/10 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-zinc-900 dark:text-white truncate block">
                          {rep.publisherName}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-400">
                          Falta informe de {rep.reportMonthName}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleSendWhatsAppReminder(
                            rep.publisherPhone,
                            rep.whatsappMessage,
                            rep.publisherName
                          )
                        }
                        title="Enviar recordatorio de informe por WhatsApp"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-2xs"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>Avisar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN 4: CUENTAS POR VERIFICAR */}
            {theocraticReminders.pendingAccountsCount > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Comprobantes de Cuentas por Verificar
                    </h5>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      Hay {theocraticReminders.pendingAccountsCount} gasto(s) sin comprobante verificado en el mes contable actual.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ESTADO VACÍO (TODO AL DÍA) */}
            {theocraticReminders.totalAttentionCount === 0 && (
              <div className="text-center py-10 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                  ¡Todo al día en la congregación!
                </h4>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] max-w-sm mx-auto leading-relaxed">
                  Todas las asignaciones próximas están confirmadas, los turnos de carritos cubiertos y no hay informes de servicio pendientes.
                </p>
              </div>
            )}
          </div>
        )}

        {/* CUERPO: PESTAÑA CRUCES Y CONFLICTOS */}
        {activeTab === 'conflicts' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-100 dark:border-[#27272A]">
              <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 font-bold">
                <AlertOctagon className="w-3.5 h-3.5" />
                {errorCount} {errorCount === 1 ? 'Cruce Crítico' : 'Cruces Críticos'}
              </span>
              <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                {warningCount} {warningCount === 1 ? 'Advertencia' : 'Advertencias'}
              </span>
            </div>

            {currentConflictList.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-100">
                  ¡Excelente! No hay ningún conflicto detectado
                </h4>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] max-w-sm mx-auto">
                  Todas las asignaciones respetan los roles habilitados, ausencias registradas y no presentan cruces de horario.
                </p>
              </div>
            ) : (
              currentConflictList.map((item) => {
                const isError = item.severity === 'error';
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]">
                          {isError ? (
                            <AlertOctagon className="w-4 h-4 text-rose-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-zinc-900 dark:text-[#F4F4F5]">
                              {item.publisherName || 'Asignación'}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#D4D4D8]">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isError ? 'bg-rose-500' : 'bg-amber-500'
                                }`}
                              />
                              {isError ? 'Cruce Crítico' : 'Advertencia'}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-[#A1A1AA] flex items-center gap-1 font-mono tabular-nums">
                              <Calendar className="w-3 h-3" />
                              Semana del {item.weekStartDate}
                            </span>
                          </div>

                          <p className="text-xs font-medium text-zinc-700 dark:text-[#E4E4E7] mt-1 leading-relaxed">
                            {item.description}
                          </p>

                          {item.assignmentTitles && item.assignmentTitles.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {item.assignmentTitles.map((t, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-lg text-[11px] bg-zinc-100 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] text-zinc-700 dark:text-[#D4D4D8] font-medium"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onNavigateToWeek(item.weekId);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-xs font-semibold text-zinc-800 dark:text-[#F4F4F5] transition-all shadow-2xs shrink-0 cursor-pointer"
                      >
                        <span>Ir a Resolver</span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-400 dark:text-[#71717A]" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/80 rounded-b-3xl">
          <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
            {activeTab === 'reminders'
              ? 'Los recordatorios se sincronizan en tiempo real con la agenda y los carritos.'
              : 'Puedes personalizar qué reglas generan avisos desde Ajustes de la congregación.'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-indigo-600 dark:hover:bg-zinc-100 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictsModal;
