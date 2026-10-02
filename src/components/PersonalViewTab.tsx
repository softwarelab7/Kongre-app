// src/components/PersonalViewTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { AssignmentStatus } from '../types';
import { generateGoogleCalendarUrl, downloadSingleIcsEvent } from '../utils/calendarExport';
import {
  UserCheck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Share2,
  Copy,
  Check,
  User,
  MapPin,
  CalendarDays,
  ExternalLink,
  Map,
  ShieldAlert,
  Briefcase,
  Utensils,
  Compass,
  Wine,
  Flame,
  Building,
  Package,
} from 'lucide-react';

export const PersonalViewTab: React.FC = () => {
  const {
    publishers,
    weeks,
    replaceAssignment,
    settings,
    publishersMap,
    cartShifts,
    cartLocations,
    notices,
    territories,
    circuitVisit,
    memorialPlans,
    theocraticAssemblies,
    specialOrders,
  } = useCongregation();
  const [selectedPublisherId, setSelectedPublisherId] = useState<string>(() => {
    return publishers[0]?.id || '';
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedPublisher = publishersMap.get(selectedPublisherId);

  // My assigned territories
  const myTerritories = useMemo(() => {
    if (!selectedPublisherId) return [];
    return territories.filter(t => t.currentAssigneeId === selectedPublisherId);
  }, [territories, selectedPublisherId]);

  // My meals for Circuit Overseer visit
  const myVisitMeals = useMemo(() => {
    if (!selectedPublisherId || !circuitVisit) return [];
    return circuitVisit.meals.filter(m => m.hostPublisherId === selectedPublisherId);
  }, [circuitVisit, selectedPublisherId]);

  // My ministry accompaniment for Circuit Overseer visit
  const myVisitMinistry = useMemo(() => {
    if (!selectedPublisherId || !circuitVisit) return [];
    return circuitVisit.ministry.filter(
      m => m.coCompanionPublisherId === selectedPublisherId || m.wifeCompanionPublisherId === selectedPublisherId
    );
  }, [circuitVisit, selectedPublisherId]);

  // My cart shifts
  const myCartShifts = useMemo(() => {
    if (!selectedPublisherId) return [];
    return cartShifts.filter(
      (s) => s.publisher1Id === selectedPublisherId || s.publisher2Id === selectedPublisherId
    );
  }, [cartShifts, selectedPublisherId]);

  // My Memorial Assignments
  const myMemorialAssignments = useMemo(() => {
    if (!selectedPublisherId || !memorialPlans.length) return [];
    const list: Array<{
      planId: string;
      year: number;
      date: string;
      time: string;
      location: string;
      roleTitle: string;
      description?: string;
    }> = [];

    memorialPlans.forEach(plan => {
      if (plan.chairmanPublisherId === selectedPublisherId) {
        list.push({
          planId: plan.id,
          year: plan.serviceYear,
          date: plan.date,
          time: plan.time,
          location: plan.location,
          roleTitle: 'Presidente de la Conmemoración',
          description: 'Presidirá la reunión sagrada, cánticos y bienvenida',
        });
      }
      if (plan.speakerPublisherId === selectedPublisherId) {
        list.push({
          planId: plan.id,
          year: plan.serviceYear,
          date: plan.date,
          time: plan.time,
          location: plan.location,
          roleTitle: 'Orador del Discurso del Memorial',
          description: `Discurso: "${plan.speakerTheme}"`,
        });
      }
      if (plan.breadPrayerPublisherId === selectedPublisherId) {
        list.push({
          planId: plan.id,
          year: plan.serviceYear,
          date: plan.date,
          time: plan.time,
          location: plan.location,
          roleTitle: 'Oración por el Pan Ácimo',
          description: 'Agradecimiento por el cuerpo de Cristo',
        });
      }
      if (plan.winePrayerPublisherId === selectedPublisherId) {
        list.push({
          planId: plan.id,
          year: plan.serviceYear,
          date: plan.date,
          time: plan.time,
          location: plan.location,
          roleTitle: 'Oración por el Vino Tinto',
          description: 'Agradecimiento por la sangre del pacto',
        });
      }
      plan.emblemServers.forEach(server => {
        if (server.breadServerPublisherId === selectedPublisherId) {
          list.push({
            planId: plan.id,
            year: plan.serviceYear,
            date: plan.date,
            time: plan.time,
            location: plan.location,
            roleTitle: `Servidor del Pan (${server.sectionName})`,
            description: server.notes,
          });
        }
        if (server.wineServerPublisherId === selectedPublisherId) {
          list.push({
            planId: plan.id,
            year: plan.serviceYear,
            date: plan.date,
            time: plan.time,
            location: plan.location,
            roleTitle: `Servidor del Vino (${server.sectionName})`,
            description: server.notes,
          });
        }
      });
      plan.attendants.forEach(att => {
        if (att.publisherId === selectedPublisherId) {
          list.push({
            planId: plan.id,
            year: plan.serviceYear,
            date: plan.date,
            time: plan.time,
            location: plan.location,
            roleTitle: `Acomodador del Memorial (${att.role.replace('_', ' ').toUpperCase()})`,
            description: att.notes,
          });
        }
      });
      if (plan.preparation.breadPreparationPublisherId === selectedPublisherId) {
        list.push({
          planId: plan.id,
          year: plan.serviceYear,
          date: plan.date,
          time: plan.time,
          location: plan.location,
          roleTitle: 'Preparación del Pan Ácimo',
          description: plan.preparation.emblemBreadType,
        });
      }
      if (plan.preparation.wineProviderPublisherId === selectedPublisherId) {
        list.push({
          planId: plan.id,
          year: plan.serviceYear,
          date: plan.date,
          time: plan.time,
          location: plan.location,
          roleTitle: 'Provisión del Vino Tinto No Adulterado',
          description: plan.preparation.emblemWineType,
        });
      }
    });

    return list;
  }, [memorialPlans, selectedPublisherId]);

  // My Assembly volunteering
  const myAssemblyVolunteering = useMemo(() => {
    if (!selectedPublisherId || !theocraticAssemblies.length) return [];
    const list: Array<{
      assemblyTheme: string;
      dates: string;
      venue: string;
      department: string;
      roleOrShift: string;
      shiftTime?: string;
    }> = [];

    theocraticAssemblies.forEach(ass => {
      ass.volunteers.forEach(v => {
        if (v.publisherId === selectedPublisherId) {
          list.push({
            assemblyTheme: ass.theme,
            dates: ass.dates,
            venue: ass.venue,
            department: v.department,
            roleOrShift: v.roleOrShift,
            shiftTime: v.shiftTime,
          });
        }
      });
    });

    return list;
  }, [theocraticAssemblies, selectedPublisherId]);

  // My special literature orders
  const mySpecialOrders = useMemo(() => {
    if (!selectedPublisherId) return [];
    return specialOrders.filter(o => o.publisherId === selectedPublisherId);
  }, [specialOrders, selectedPublisherId]);

  // Extract all future assignments for this publisher
  const myAssignments = useMemo(() => {
    if (!selectedPublisherId) return [];

    const list: Array<{
      id: string;
      weekId: string;
      date: string;
      meetingType: 'midweek' | 'weekend';
      meetingName: string;
      assignmentTitle: string;
      roleKey: string;
      assignmentPath: string;
      room?: 'principal' | 'auxiliar';
      assistantName?: string;
      timeMinutes?: number;
      status: AssignmentStatus;
    }> = [];

    const sortedWeeks = [...weeks].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));

    sortedWeeks.forEach(w => {
      const pid = selectedPublisherId;

      // Skip blocked meetings
      if (!w.specialEvent?.noMeetingMidweek) {
        // Midweek President
        if (w.midweek.presidentId === pid) {
          list.push({
            id: `pres-${w.id}`,
            weekId: w.id,
            date: w.midweek.date,
            meetingType: 'midweek',
            meetingName: 'Vida y Ministerio Cristianos',
            assignmentTitle: 'Presidente de la reunión',
            roleKey: 'vym_presidente',
            assignmentPath: 'presidentId',
            status: 'confirmada',
          });
        }

        // Initial Prayer
        if (w.midweek.initialPrayerId === pid) {
          list.push({
            id: `pr-init-${w.id}`,
            weekId: w.id,
            date: w.midweek.date,
            meetingType: 'midweek',
            meetingName: 'Vida y Ministerio Cristianos',
            assignmentTitle: 'Oración inicial',
            roleKey: 'vym_oracion',
            assignmentPath: 'initialPrayerId',
            status: 'confirmada',
          });
        }

        // Final Prayer
        if (w.midweek.finalPrayerId === pid) {
          list.push({
            id: `pr-fin-${w.id}`,
            weekId: w.id,
            date: w.midweek.date,
            meetingType: 'midweek',
            meetingName: 'Vida y Ministerio Cristianos',
            assignmentTitle: 'Oración final',
            roleKey: 'vym_oracion',
            assignmentPath: 'finalPrayerId',
            status: 'confirmada',
          });
        }

        // Tesoros Discurso
        if (w.midweek.tesoros.discurso.publisherId === pid) {
          list.push({
            id: `tes-disc-${w.id}`,
            weekId: w.id,
            date: w.midweek.date,
            meetingType: 'midweek',
            meetingName: 'Vida y Ministerio Cristianos',
            assignmentTitle: `Tesoros: ${w.midweek.tesoros.discurso.title}`,
            roleKey: 'vym_tesoros_discurso',
            assignmentPath: 'tesoros.discurso',
            timeMinutes: 10,
            status: w.midweek.tesoros.discurso.status,
          });
        }

        // Perlas
        if (w.midweek.tesoros.perlas.publisherId === pid) {
          list.push({
            id: `tes-perl-${w.id}`,
            weekId: w.id,
            date: w.midweek.date,
            meetingType: 'midweek',
            meetingName: 'Vida y Ministerio Cristianos',
            assignmentTitle: `Perlas: ${w.midweek.tesoros.perlas.title}`,
            roleKey: 'vym_tesoros_perlas',
            assignmentPath: 'tesoros.perlas',
            timeMinutes: 10,
            status: w.midweek.tesoros.perlas.status,
          });
        }

        // Lectura de la Biblia
        if (w.midweek.tesoros.lecturaBiblia.publisherId === pid) {
          list.push({
            id: `tes-lect-${w.id}`,
            weekId: w.id,
            date: w.midweek.date,
            meetingType: 'midweek',
            meetingName: 'Vida y Ministerio Cristianos',
            assignmentTitle: 'Lectura de la Biblia (Estudiante)',
            roleKey: 'vym_tesoros_lectura',
            assignmentPath: 'tesoros.lecturaBiblia',
            room: 'principal',
            timeMinutes: 4,
            status: w.midweek.tesoros.lecturaBiblia.status,
          });
        }

        // Demonstrations
        w.midweek.maestros.items.forEach((item, idx) => {
          if (item.publisherId === pid) {
            const assistantName = item.assistantId ? publishersMap.get(item.assistantId)?.name : undefined;
            list.push({
              id: `maes-tit-${item.id}`,
              weekId: w.id,
              date: w.midweek.date,
              meetingType: 'midweek',
              meetingName: 'Vida y Ministerio Cristianos',
              assignmentTitle: `Seamos mejores maestros: ${item.title}`,
              roleKey: 'vym_maestros_titular',
              assignmentPath: `maestros.${idx}`,
              room: item.room,
              assistantName,
              timeMinutes: item.timeMinutes,
              status: item.status,
            });
          } else if (item.assistantId === pid) {
            const titularName = item.publisherId ? publishersMap.get(item.publisherId)?.name : 'Estudiante';
            list.push({
              id: `maes-asst-${item.id}`,
              weekId: w.id,
              date: w.midweek.date,
              meetingType: 'midweek',
              meetingName: 'Vida y Ministerio Cristianos',
              assignmentTitle: `Ayudante en: ${item.title}`,
              roleKey: 'vym_maestros_ayudante',
              assignmentPath: `maestros_helper.${idx}`,
              room: item.room,
              assistantName: `Titular: ${titularName}`,
              timeMinutes: item.timeMinutes,
              status: item.status,
            });
          }
        });

        // Vida Cristiana parts
        w.midweek.vidaCristiana.items.forEach((item, idx) => {
          if (item.publisherId === pid) {
            list.push({
              id: `vida-${item.id}`,
              weekId: w.id,
              date: w.midweek.date,
              meetingType: 'midweek',
              meetingName: 'Vida y Ministerio Cristianos',
              assignmentTitle: `Nuestra Vida Cristiana: ${item.title}`,
              roleKey: 'vym_vida_partes',
              assignmentPath: `vida.${idx}`,
              timeMinutes: item.timeMinutes,
              status: item.status,
            });
          }
        });

        // CBS Conductor & Reader
        if (w.midweek.vidaCristiana.estudioBiblico.conductorId === pid) {
          list.push({
            id: `cbs-cond-${w.id}`,
            weekId: w.id,
            date: w.midweek.date,
            meetingType: 'midweek',
            meetingName: 'Vida y Ministerio Cristianos',
            assignmentTitle: 'Conductor del Estudio Bíblico de Congregación',
            roleKey: 'vym_estudio_conductor',
            assignmentPath: 'vidaCristiana.estudioBiblico.conductorId',
            timeMinutes: 30,
            status: 'confirmada',
          });
        }
        if (w.midweek.vidaCristiana.estudioBiblico.lectorId === pid) {
          list.push({
            id: `cbs-lect-${w.id}`,
            weekId: w.id,
            date: w.midweek.date,
            meetingType: 'midweek',
            meetingName: 'Vida y Ministerio Cristianos',
            assignmentTitle: 'Lector del Estudio Bíblico de Congregación',
            roleKey: 'vym_estudio_lector',
            assignmentPath: 'vidaCristiana.estudioBiblico.lectorId',
            timeMinutes: 30,
            status: 'confirmada',
          });
        }

        // Midweek Duties
        Object.entries(w.midweek.duties).forEach(([dKey, ids]) => {
          if (ids.includes(pid)) {
            list.push({
              id: `duty-mid-${w.id}-${dKey}`,
              weekId: w.id,
              date: w.midweek.date,
              meetingType: 'midweek',
              meetingName: 'Vida y Ministerio Cristianos',
              assignmentTitle: `Deber: ${dKey.replace('deber_', '').toUpperCase()}`,
              roleKey: dKey,
              assignmentPath: `midweek_duty_${dKey}`,
              status: 'confirmada',
            });
          }
        });
      }

      // Weekend
      if (!w.specialEvent?.noMeetingWeekend) {
        if (w.weekend.presidentId === pid) {
          list.push({
            id: `fds-pres-${w.id}`,
            weekId: w.id,
            date: w.weekend.date,
            meetingType: 'weekend',
            meetingName: 'Reunión del Fin de Semana',
            assignmentTitle: 'Presidente de la reunión',
            roleKey: 'fds_presidente',
            assignmentPath: 'presidentId',
            status: 'confirmada',
          });
        }
        if (w.weekend.atalayaConductorId === pid) {
          list.push({
            id: `fds-cond-${w.id}`,
            weekId: w.id,
            date: w.weekend.date,
            meetingType: 'weekend',
            meetingName: 'Reunión del Fin de Semana',
            assignmentTitle: 'Conductor del Estudio de La Atalaya',
            roleKey: 'fds_presidente',
            assignmentPath: 'atalayaConductorId',
            status: 'confirmada',
          });
        }
        if (w.weekend.atalayaLectorId === pid) {
          list.push({
            id: `fds-lect-${w.id}`,
            weekId: w.id,
            date: w.weekend.date,
            meetingType: 'weekend',
            meetingName: 'Reunión del Fin de Semana',
            assignmentTitle: 'Lector del Estudio de La Atalaya',
            roleKey: 'fds_atalaya_lector',
            assignmentPath: 'atalayaLectorId',
            status: 'confirmada',
          });
        }
        if (w.weekend.initialPrayerId === pid) {
          list.push({
            id: `fds-pr-init-${w.id}`,
            weekId: w.id,
            date: w.weekend.date,
            meetingType: 'weekend',
            meetingName: 'Reunión del Fin de Semana',
            assignmentTitle: 'Oración inicial (Fin de semana)',
            roleKey: 'fds_oracion',
            assignmentPath: 'initialPrayerId',
            status: 'confirmada',
          });
        }
        if (w.weekend.finalPrayerId === pid) {
          list.push({
            id: `fds-pr-fin-${w.id}`,
            weekId: w.id,
            date: w.weekend.date,
            meetingType: 'weekend',
            meetingName: 'Reunión del Fin de Semana',
            assignmentTitle: 'Oración final (Fin de semana)',
            roleKey: 'fds_oracion',
            assignmentPath: 'finalPrayerId',
            status: 'confirmada',
          });
        }

        // Weekend Duties
        Object.entries(w.weekend.duties).forEach(([dKey, ids]) => {
          if (ids.includes(pid)) {
            list.push({
              id: `duty-fds-${w.id}-${dKey}`,
              weekId: w.id,
              date: w.weekend.date,
              meetingType: 'weekend',
              meetingName: 'Reunión del Fin de Semana',
              assignmentTitle: `Deber: ${dKey.replace('deber_', '').toUpperCase()}`,
              roleKey: dKey,
              assignmentPath: `weekend_duty_${dKey}`,
              status: 'confirmada',
            });
          }
        });
      }
    });

    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedPublisherId, weeks, publishersMap]);

  const handleUpdateStatus = (
    weekId: string,
    meetingType: 'midweek' | 'weekend',
    assignmentPath: string,
    newStatus: AssignmentStatus
  ) => {
    if (!selectedPublisherId) return;
    replaceAssignment(weekId, meetingType, assignmentPath, selectedPublisherId, newStatus);
  };

  const copyAssignmentDetails = (item: any) => {
    const text = `Asignación teocrática:\n📅 Fecha: ${item.date}\n🏛 Reunión: ${item.meetingName}\n📌 Tarea: ${item.assignmentTitle}${item.room ? `\nSala: ${item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'}` : ''}${item.assistantName ? `\n${item.assistantName}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header with publisher switcher */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
            Portal del Publicador
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Mis Próximas Asignaciones</h2>
          <p className="text-xs text-slate-500">
            Vista individual limpia y privada para consultar fechas, confirmar asistencia o avisar oportunamente.
          </p>
        </div>

        {/* Selector */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <User className="w-5 h-5 text-indigo-600 shrink-0" />
          <div className="flex-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
              Consultar asignaciones de:
            </label>
            <select
              value={selectedPublisherId}
              onChange={e => setSelectedPublisherId(e.target.value)}
              className="w-full text-sm font-bold text-slate-900 bg-transparent border-none focus:outline-hidden cursor-pointer"
            >
              {publishers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.active ? '' : '(Inactivo)'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assignment cards */}
      {myAssignments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {selectedPublisher?.name} no tiene asignaciones próximas
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Todas las semanas registradas están al día y no figuran tareas asignadas para este publicador.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 px-2">
            {myAssignments.length} {myAssignments.length === 1 ? 'asignación programada' : 'asignaciones programadas'}
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {myAssignments.map(item => {
            const isConfirmed = item.status === 'confirmada';
            const isRejected = item.status === 'rechazada';

            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                      <Calendar className="w-3.5 h-3.5" />
                      {item.date}
                    </span>
                    <span className="text-xs text-slate-500">
                      {item.meetingName}
                    </span>
                    {item.room && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        {item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {item.assignmentTitle}
                  </h3>

                  {item.assistantName && (
                    <p className="text-xs font-medium text-slate-600">
                      👥 {item.assistantName}
                    </p>
                  )}

                  {item.timeMinutes && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Tiempo asignado: {item.timeMinutes} minutos
                    </p>
                  )}
                </div>

                {/* Status & Confirmation buttons */}
                <div className="flex flex-col sm:items-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">Estado:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                        isConfirmed
                          ? 'bg-emerald-100 text-emerald-800'
                          : isRejected
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        const meetingTime = item.meetingType === 'midweek' ? settings.midweekMeetingTime : settings.weekendMeetingTime;
                        const gUrl = generateGoogleCalendarUrl(
                          `${item.assignmentTitle} - ${settings.congregationName}`,
                          `Asignación teocrática: ${item.assignmentTitle}${item.assistantName ? `\n${item.assistantName}` : ''}${item.room ? `\nSala: ${item.room}` : ''}`,
                          settings.hallAddress || 'Salón del Reino',
                          item.date,
                          meetingTime || '19:30',
                          item.timeMinutes || 105
                        );
                        window.open(gUrl, '_blank');
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[40px]"
                      title="Añadir a Google Calendar"
                    >
                      <CalendarDays className="w-4 h-4 text-indigo-600" />
                      <span>Google Cal</span>
                    </button>

                    <button
                      onClick={() => {
                        const meetingTime = item.meetingType === 'midweek' ? settings.midweekMeetingTime : settings.weekendMeetingTime;
                        downloadSingleIcsEvent(
                          `${item.assignmentTitle} - ${settings.congregationName}`,
                          `Asignación teocrática: ${item.assignmentTitle}${item.assistantName ? `\n${item.assistantName}` : ''}${item.room ? `\nSala: ${item.room}` : ''}`,
                          settings.hallAddress || 'Salón del Reino',
                          item.date,
                          meetingTime || '19:30',
                          item.timeMinutes || 105
                        );
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1 transition-all min-h-[40px]"
                      title="Descargar archivo .ics para Apple Calendar o Outlook"
                    >
                      <span>.ICS</span>
                    </button>

                    <button
                      onClick={() => copyAssignmentDetails(item)}
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-xs transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Copiar detalles de la asignación"
                    >
                      {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() =>
                        handleUpdateStatus(item.weekId, item.meetingType, item.assignmentPath, 'confirmada')
                      }
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
                        isConfirmed
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar</span>
                    </button>

                    <button
                      onClick={() =>
                        handleUpdateStatus(item.weekId, item.meetingType, item.assignmentPath, 'rechazada')
                      }
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
                        isRejected
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Avisar Reemplazo</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Assigned Territories for this Publisher (S-13) */}
      {myTerritories.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Map className="w-5 h-5 text-blue-600" />
              <span>Mi Territorio de Predicación Asignado (S-13)</span>
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {myTerritories.length} {myTerritories.length === 1 ? 'territorio' : 'territorios'}
            </span>
          </div>

          <div className="space-y-4">
            {myTerritories.map((terr) => {
              const isOverdue =
                terr.status === 'vencido' ||
                (terr.dueDate && new Date(terr.dueDate) < new Date());
              const mapLink =
                terr.mapUrl ||
                `https://maps.google.com/?q=${encodeURIComponent(
                  `${terr.name} ${settings.congregationName}`
                )}`;

              return (
                <div
                  key={terr.id}
                  className={`p-4 rounded-xl border ${
                    isOverdue
                      ? 'border-rose-300 bg-rose-50/30'
                      : 'border-slate-200 bg-slate-50/70'
                  } space-y-3 text-xs`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {terr.number}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{terr.name}</h4>
                        <p className="text-slate-500 text-[11px]">
                          {terr.zone} • ~{terr.estimatedHomes} hogares • Tipo {terr.type}
                        </p>
                      </div>
                    </div>

                    <a
                      href={mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 transition shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir Mapa</span>
                    </a>
                  </div>

                  {terr.boundsDescription && (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
                      <strong className="text-slate-800">Límites: </strong>
                      {terr.boundsDescription}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200 text-slate-600">
                    <div>
                      <span>Asignado: </span>
                      <strong className="text-slate-800">{terr.assignedDate || 'Reciente'}</strong>
                    </div>
                    <div>
                      <span>Plazo de entrega (4 meses): </span>
                      <strong
                        className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'}
                      >
                        {terr.dueDate || 'Sin fecha'}
                        {isOverdue && ' (¡Vencido!)'}
                      </strong>
                    </div>
                  </div>

                  {/* No-visit houses for this territory */}
                  {terr.noVisits && terr.noVisits.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg space-y-1.5 text-rose-900">
                      <div className="font-bold flex items-center gap-1.5 text-rose-800">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        <span>¡Atención! Domicilios NO VISITAR en este territorio:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-800 pl-1">
                        {terr.noVisits.map((nv) => (
                          <li key={nv.id}>
                            <strong>{nv.address}</strong>
                            {nv.residentName ? ` (${nv.residentName})` : ''} - {nv.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Circuit Overseer Visit Arrangements (Meals & Ministry) */}
      {(myVisitMeals.length > 0 || myVisitMinistry.length > 0) && circuitVisit && (
        <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-300" />
              <span>Mis Asignaciones para la Visita del SC ({circuitVisit.startDate.slice(5)} al {circuitVisit.endDate.slice(5)})</span>
            </h3>
            <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full font-semibold">
              Hno. {circuitVisit.overseerName}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Hospitalidad / Comidas asignadas */}
            {myVisitMeals.map((meal) => (
              <div key={meal.id} className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/15 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Hospitalidad: {meal.day} ({meal.mealType === 'almuerzo' ? 'Almuerzo' : 'Cena'})</span>
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                    meal.isConfirmed ? 'bg-emerald-500/30 text-emerald-200' : 'bg-amber-500/30 text-amber-200'
                  }`}>
                    {meal.isConfirmed ? 'Confirmada' : 'Por confirmar'}
                  </span>
                </div>
                <p className="text-slate-200">
                  Lugar: <strong>{meal.location || 'Su hogar'}</strong>
                </p>
                {circuitVisit.dietaryPreferences && (
                  <p className="text-[11px] text-blue-200/90 italic">
                    Dietas/Sugerencias: {circuitVisit.dietaryPreferences}
                  </p>
                )}
              </div>
            ))}

            {/* Predicación / Acompañamiento asignado */}
            {myVisitMinistry.map((min) => {
              const isAccompanyingOverseer = min.coCompanionPublisherId === selectedPublisherId;
              return (
                <div key={min.id} className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/15 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-200 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5" />
                      <span>Predicación: {min.day} • {min.time}</span>
                    </span>
                    {min.territoryNumber && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/30 text-blue-100 font-medium">
                        Territorio #{min.territoryNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-200">
                    Punto de salida: <strong>{min.meetingPoint}</strong>
                  </p>
                  <p className="text-emerald-300 font-semibold text-[11px]">
                    {isAccompanyingOverseer
                      ? `Asignado/a para acompañar al Hno. ${circuitVisit.overseerName}`
                      : `Asignada para acompañar a la Hna. ${circuitVisit.wifeName || 'Esposa del SC'}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cart Witnessing Shifts for this Publisher */}
      {myCartShifts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-600" />
            <span>Mis Turnos de Testimonio Público con Carrito</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myCartShifts.map((shift) => {
              const loc = cartLocations.find((l) => l.id === shift.locationId);
              const partnerId =
                shift.publisher1Id === selectedPublisherId
                  ? shift.publisher2Id
                  : shift.publisher1Id;
              const partner = partnerId ? publishersMap.get(partnerId) : null;

              return (
                <div
                  key={shift.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      {shift.dayOfWeek} {shift.startTime} - {shift.endTime}
                    </span>
                    <span className="font-bold text-slate-900">{loc?.name}</span>
                  </div>
                  {loc?.address && <p className="text-[11px] text-slate-400">{loc.address}</p>}
                  <p className="text-slate-600">
                    Compañero/a:{' '}
                    <strong className="text-slate-900 font-bold">
                      {partner ? partner.name : 'Por asignar'}
                    </strong>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mis Asignaciones para la Conmemoración del Memorial */}
      {myMemorialAssignments.length > 0 && (
        <div className="bg-linear-to-r from-red-950 via-slate-900 to-red-900 text-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-400" />
              <span>Mi Asignación para la Conmemoración del Memorial (14 de Nisán)</span>
            </h3>
            <span className="text-xs bg-red-500/30 text-red-200 border border-red-500/30 px-2.5 py-0.5 rounded-full font-semibold">
              Reunión Sagrada
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {myMemorialAssignments.map((item, idx) => (
              <div
                key={`${item.planId}-${idx}`}
                className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/15 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                    <Wine className="w-4 h-4 text-red-400" />
                    <span>{item.roleTitle}</span>
                  </span>
                  <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
                    Año {item.year}
                  </span>
                </div>
                <p className="text-slate-200">
                  🗓️ <strong>{item.date}</strong> a las <strong>{item.time} hrs</strong>
                </p>
                <p className="text-slate-300 text-[11px]">📍 {item.location}</p>
                {item.description && (
                  <p className="text-[11px] text-amber-200/90 italic pt-1 border-t border-white/10">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mis Turnos de Voluntario en Asambleas */}
      {myAssemblyVolunteering.length > 0 && (
        <div className="bg-linear-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-400" />
              <span>Mis Voluntariados en Asambleas Teocráticas</span>
            </h3>
            <span className="text-xs bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-semibold">
              Servicio Voluntario
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {myAssemblyVolunteering.map((v, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/15 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-200 uppercase tracking-wider text-[11px]">
                    Departamento: {v.department}
                  </span>
                  {v.shiftTime && (
                    <span className="text-[10px] bg-indigo-400/20 text-indigo-200 px-2 py-0.5 rounded font-medium">
                      {v.shiftTime}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-white text-xs">{v.assemblyTheme}</h4>
                <p className="text-slate-200">
                  🗓️ {v.dates} • 📍 {v.venue}
                </p>
                <p className="text-amber-200 text-[11px] pt-1 border-t border-white/10">
                  Asignación: <strong>{v.roleOrShift}</strong>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mis Pedidos Especiales de Literatura */}
      {mySpecialOrders.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span>Mis Pedidos Especiales de Literatura</span>
            </h3>
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">
              {mySpecialOrders.length} pedido(s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {mySpecialOrders.map(order => {
              const statusLabels: Record<string, { label: string; badge: string }> = {
                solicitado: { label: 'Solicitado a la congregación', badge: 'bg-slate-100 text-slate-700' },
                pedido_a_betel: { label: 'Tramitado a Betel', badge: 'bg-blue-100 text-blue-800' },
                recibido_en_salon: { label: '¡Listo para recoger en el Salón!', badge: 'bg-amber-100 text-amber-900 font-bold border border-amber-300' },
                entregado: { label: 'Entregado', badge: 'bg-emerald-100 text-emerald-800' },
              };
              const s = statusLabels[order.status] || { label: order.status, badge: 'bg-slate-100 text-slate-700' };

              return (
                <div key={order.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs truncate max-w-[200px]">
                      {order.itemTitle}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.badge}`}>
                      {s.label}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Cantidad: <strong>{order.quantity}</strong> {order.language && `• Idioma: ${order.language}`} • Pedido: {order.requestDate}
                  </p>
                  {order.status === 'recibido_en_salon' && (
                    <p className="text-[11px] text-amber-800 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200">
                      📦 Puedes pasar a recoger tu publicación en el mostrador de literatura al concluir la reunión.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Congregation Notices */}
      {notices.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              <span>Avisos Importantes de la Congregación</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">Tablero Oficial</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notices.slice(0, 4).map((notice) => (
              <div
                key={notice.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{notice.title}</span>
                  <span className="text-[10px] text-slate-400">{notice.date}</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px] line-clamp-3">
                  {notice.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
