// src/components/CongregationCalendar.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { CongregationEvent, WeekSchedule, Publisher } from '../types';
import { Select } from './Select';
import { PremiumDatePicker } from './PremiumDatePicker';
import { useCongregation } from '../context/CongregationContext';
import { getMeetingDateForWeek } from '../utils/dateUtils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Search,
  Check,
  Clock,
  X,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  User,
  Users,
  MapPin,
  Mic,
  Shield,
  Sparkles,
} from 'lucide-react';

const locales = {
  es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const withDragAndDropFn = (withDragAndDrop as any)?.default || withDragAndDrop;
const DnDCalendar =
  typeof withDragAndDropFn === 'function' ? withDragAndDropFn(Calendar) as any : (Calendar as any);

// Custom Toolbar to match Google Calendar style
const CustomToolbar = (toolbar: any) => {
  const goToBack = () => toolbar.onNavigate('PREV');
  const goToNext = () => toolbar.onNavigate('NEXT');
  const goToCurrent = () => toolbar.onNavigate('TODAY');

  const label = () => {
    const date = format(toolbar.date, 'MMMM yyyy', { locale: es });
    return (
      <span className="text-base sm:text-lg font-bold capitalize text-zinc-900 dark:text-white">
        {date}
      </span>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 mb-3.5 sm:mb-4">
      <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={goToCurrent}
            className="px-3 sm:px-3.5 py-1.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 dark:bg-[#18181F] dark:border-[#27272A] dark:text-[#E4E4E7] rounded-xl hover:bg-zinc-50 dark:hover:bg-[#27272A]/60 transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            Hoy
          </button>
          <div className="flex items-center gap-0.5 bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={goToBack}
              className="p-1.5 sm:p-1 hover:bg-zinc-100 dark:hover:bg-[#27272A] rounded-lg text-zinc-500 transition-colors cursor-pointer active:scale-95"
              title="Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="p-1.5 sm:p-1 hover:bg-zinc-100 dark:hover:bg-[#27272A] rounded-lg text-zinc-500 transition-colors cursor-pointer active:scale-95"
              title="Siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {label()}
        </div>

        {toolbar.onAddEvent && (
          <button
            type="button"
            onClick={toolbar.onAddEvent}
            title="Crear Evento"
            aria-label="Crear Evento"
            className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 px-2.5 sm:px-3.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span className="hidden sm:inline">Crear Evento</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 sm:flex items-center gap-1 bg-zinc-100/90 dark:bg-white/[0.04] p-1 rounded-xl border border-zinc-200/80 dark:border-white/10 shadow-2xs">
        {[
          { key: 'month', label: 'Mes' },
          { key: 'week', label: 'Semana' },
          { key: 'day', label: 'Día' },
          { key: 'agenda', label: 'Agenda' },
        ].map(({ key, label: viewLabel }) => (
          <button
            key={key}
            type="button"
            onClick={() => toolbar.onView(key)}
            className={`px-2 sm:px-3 py-1.5 sm:py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center active:scale-95 ${
              toolbar.view === key
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-[#A1A1AA]'
            }`}
          >
            {viewLabel}
          </button>
        ))}
      </div>
    </div>
  );
};

// Custom Date Header to match Google Calendar style
const CustomDateHeader = ({ label, date, onDrillDown }: any) => {
  const today = new Date();
  const isToday =
    today.getDate() === date.getDate() &&
    today.getMonth() === date.getMonth() &&
    today.getFullYear() === date.getFullYear();

  let displayLabel = label;
  if (date.getDate() === 1) {
    const monthName = date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
    displayLabel = `1 ${monthName}`;
  }

  return (
    <div className="flex justify-end select-none">
      {isToday ? (
        <button
          type="button"
          onClick={onDrillDown}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold shadow-xs transition-colors cursor-pointer mr-1 mt-1"
        >
          {date.getDate()}
        </button>
      ) : (
        <button
          type="button"
          onClick={onDrillDown}
          className="text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#27272A] rounded-full px-1.5 py-0.5 text-[10px] font-medium transition-colors cursor-pointer mr-1 mt-1"
        >
          {displayLabel}
        </button>
      )}
    </div>
  );
};

const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();

  if (dateStr.includes('T')) {
    const [datePart, timePart] = dateStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hour || 0, minute || 0);
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: {
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    type: CongregationEvent['type'];
    horarios_diarios?: string;
  }) => void;
  eventToEdit?: CongregationEvent | null;
  initialDate?: string;
  onDelete?: (id: string) => void;
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  eventToEdit,
  initialDate,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [type, setType] = useState<CongregationEvent['type']>('special');
  const [isSameSchedule, setIsSameSchedule] = useState(true);
  const [dailySchedules, setDailySchedules] = useState<Record<string, { start: string; end: string }>>({});

  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        setTitle(eventToEdit.title);
        setDescription(eventToEdit.description || '');
        setType(eventToEdit.type === 'meeting' ? 'special' : eventToEdit.type);

        const hasTime = eventToEdit.start_date.includes('T');
        setIsAllDay(!hasTime);
        setIsSameSchedule(!eventToEdit.horarios_diarios);

        if (eventToEdit.horarios_diarios) {
          try {
            setDailySchedules(JSON.parse(eventToEdit.horarios_diarios));
          } catch {
            setDailySchedules({});
          }
        } else {
          setDailySchedules({});
        }

        if (hasTime) {
          const [sDate, sTime] = eventToEdit.start_date.split('T');
          setStartDate(sDate);
          setStartTime(sTime.substring(0, 5));
          if (eventToEdit.end_date && eventToEdit.end_date.includes('T')) {
            const [eDate, eTime] = eventToEdit.end_date.split('T');
            setEndDate(eDate);
            setEndTime(eTime.substring(0, 5));
          } else {
            setEndDate(eventToEdit.end_date || sDate);
          }
        } else {
          setStartDate(eventToEdit.start_date);
          setEndDate(eventToEdit.end_date || eventToEdit.start_date);
        }
      } else {
        setTitle('');
        setDescription('');
        const dateStr = initialDate || new Date().toISOString().split('T')[0];
        setStartDate(dateStr);
        setEndDate(dateStr);
        setIsAllDay(true);
        setStartTime('10:00');
        setEndTime('12:00');
        setType('special');
        setIsSameSchedule(true);
        setDailySchedules({});
      }
    }
  }, [isOpen, eventToEdit, initialDate]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() || !startDate) return;
    const safeEnd = endDate && endDate >= startDate ? endDate : startDate;

    let finalStart = startDate;
    let finalEnd = safeEnd;
    let finalHorarios: string | undefined = undefined;

    if (!isAllDay) {
      finalStart = `${startDate}T${startTime}:00`;
      finalEnd = `${safeEnd}T${endTime}:00`;
      if (!isSameSchedule && Object.keys(dailySchedules).length > 0) {
        finalHorarios = JSON.stringify(dailySchedules);
      }
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      start_date: finalStart,
      end_date: finalEnd,
      type,
      horarios_diarios: finalHorarios,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="kg-glass-surface kg-sheen-top rounded-3xl max-w-lg w-full shadow-2xl border border-zinc-200/80 dark:border-white/10 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              data-mobile-back-btn="true"
              onClick={onClose}
              aria-label="Volver al calendario"
              className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-100 dark:bg-[#18181F] text-zinc-800 dark:text-zinc-100 shrink-0 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </button>
            <div className="hidden sm:flex w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                {eventToEdit ? 'Editar Evento' : 'Nuevo Evento'}
              </h3>
              <p className="text-xs text-zinc-400">
                {eventToEdit ? 'Modifica los detalles del evento' : 'Programa una actividad, asamblea o fecha especial'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:flex p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block ml-1">
              Título del Evento
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-[#18181F]/80 border border-zinc-200 dark:border-[#27272A]/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400"
              placeholder="Ej. Salida especial de predicación / Jornada de limpieza"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block ml-1">
                Fecha Inicio
              </label>
              <PremiumDatePicker value={startDate} onChange={setStartDate} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block ml-1">
                Fecha Fin
              </label>
              <PremiumDatePicker value={endDate} onChange={setEndDate} />
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-[#18181F]/50 border border-zinc-200/80 dark:border-[#27272A]/80 rounded-2xl p-4">
            <label className="flex items-center gap-3 cursor-pointer group mb-3">
              <div
                className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${
                  isAllDay ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute transition-transform ${
                    isAllDay ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
                />
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
              />
              <span className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-[#D4D4D8]">
                Todo el día
              </span>
            </label>

            {!isAllDay && (
              <div className="pt-3 border-t border-zinc-200 dark:border-[#27272A] flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-xl px-3 py-2 pl-9 text-xs font-semibold text-zinc-800 dark:text-[#E4E4E7] outline-none"
                  />
                </div>
                <div className="flex-1 relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-xl px-3 py-2 pl-9 text-xs font-semibold text-zinc-800 dark:text-[#E4E4E7] outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block ml-1">
              Categoría del Evento
            </label>
            <Select
              value={type}
              onChange={(val) => setType(val as any)}
              options={[
                { value: 'special', label: 'Evento Especial / Actividad' },
                { value: 'visit', label: 'Visita del Superintendente' },
                { value: 'assembly', label: 'Asamblea / Jornada' },
                { value: 'memorial', label: 'Conmemoración' },
                { value: 'no_meeting', label: 'Sin Reunión / Reunión Cancelada' },
              ]}
              placeholder="Seleccionar tipo..."
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block ml-1">
              Descripción o Detalles (Opcional)
            </label>
            <textarea
              placeholder="Detalles adicionales, hermanos encargados o recordatorios..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-[#18181F]/80 border border-zinc-200 dark:border-[#27272A]/80 rounded-xl py-2.5 px-3.5 outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white h-20 resize-none shadow-2xs placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between gap-3 bg-zinc-50/50 dark:bg-[#121216]">
          {eventToEdit && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(eventToEdit.id)}
              className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              <span>Eliminar</span>
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#D4D4D8] hover:bg-zinc-200 dark:hover:bg-[#27272A] rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!title.trim() || !startDate}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              {eventToEdit ? 'Guardar Cambios' : 'Crear Evento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal for viewing meeting details directly from the calendar
interface MeetingDetailModalProps {
  meeting: {
    week: WeekSchedule;
    meetingType: 'midweek' | 'weekend';
    date: string;
    time: string;
  } | null;
  onClose: () => void;
  onOpenSchedule: (weekId: string) => void;
  publishersMap: Map<string, Publisher>;
}

const MeetingDetailModal: React.FC<MeetingDetailModalProps> = ({
  meeting,
  onClose,
  onOpenSchedule,
  publishersMap,
}) => {
  if (!meeting) return null;

  const { week, meetingType, date, time } = meeting;
  const isMidweek = meetingType === 'midweek';

  const presidentName = isMidweek
    ? week.midweek?.presidentId
      ? publishersMap.get(week.midweek.presidentId)?.name
      : 'Sin asignar'
    : week.weekend?.presidentId
    ? publishersMap.get(week.weekend.presidentId)?.name
    : 'Sin asignar';

  const speakerName = !isMidweek
    ? week.weekend?.publicTalkSpeaker
      ? publishersMap.get(week.weekend.publicTalkSpeaker)?.name || week.weekend.publicTalkSpeaker
      : 'Sin asignar'
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="kg-glass-surface kg-sheen-top rounded-3xl max-w-lg w-full shadow-2xl border border-zinc-200/80 dark:border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between gap-2 bg-indigo-50/50 dark:bg-indigo-950/30">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              data-mobile-back-btn="true"
              onClick={onClose}
              aria-label="Volver al calendario"
              className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white dark:bg-[#18181F] text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-[#27272A] shrink-0 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </button>
            <div className="hidden sm:flex w-10 h-10 rounded-2xl bg-indigo-600 text-white items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {isMidweek ? 'Reunión Entre Semana' : 'Reunión de Fin de Semana'}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                {isMidweek ? 'Vida y Ministerio Cristianos' : 'Discurso Público y La Atalaya'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:flex p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-100 dark:border-[#27272A]">
            <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-zinc-900 dark:text-white capitalize">
                {parseLocalDate(date).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="text-zinc-400 ml-2 font-medium">Horario: {time || 'Programado'}</span>
            </div>
          </div>

          {isMidweek ? (
            <div className="space-y-3">
              {week.midweek?.bibleReading && (
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F]/40 border border-zinc-100 dark:border-[#27272A]/80">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Lectura Semanal de la Biblia
                  </span>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {week.midweek.bibleReading}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F]/40 border border-zinc-100 dark:border-[#27272A]/80">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Presidente
                  </span>
                  <p className="text-xs font-bold text-zinc-800 dark:text-[#E4E4E7] mt-0.5 truncate">
                    {presidentName}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F]/40 border border-zinc-100 dark:border-[#27272A]/80">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Tesoros de la Biblia
                  </span>
                  <p className="text-xs font-bold text-zinc-800 dark:text-[#E4E4E7] mt-0.5 truncate">
                    {week.midweek?.tesoros?.discurso?.publisherId
                      ? publishersMap.get(week.midweek.tesoros.discurso.publisherId)?.name || 'Asignado'
                      : 'Sin asignar'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {week.weekend?.publicTalkTheme && (
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F]/40 border border-zinc-100 dark:border-[#27272A]/80">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Discurso Público
                  </span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">
                    "{week.weekend.publicTalkTheme}"
                  </p>
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" />
                    <span>Orador: {speakerName}</span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F]/40 border border-zinc-100 dark:border-[#27272A]/80">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Presidente FDS
                  </span>
                  <p className="text-xs font-bold text-zinc-800 dark:text-[#E4E4E7] mt-0.5 truncate">
                    {presidentName}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F]/40 border border-zinc-100 dark:border-[#27272A]/80">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Lector de La Atalaya
                  </span>
                  <p className="text-xs font-bold text-zinc-800 dark:text-[#E4E4E7] mt-0.5 truncate">
                    {week.weekend?.atalayaLectorId
                      ? publishersMap.get(week.weekend.atalayaLectorId)?.name || 'Asignado'
                      : 'Sin asignar'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with action to navigate to program */}
        <div className="p-4 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between gap-3 bg-zinc-50/50 dark:bg-[#121216]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#D4D4D8] hover:bg-zinc-200 dark:hover:bg-[#27272A] rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSchedule(week.id);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <span>Ver Programa Completo</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export interface CongregationCalendarProps {
  onNavigateToWeek?: (weekId: string) => void;
}

export const CongregationCalendar: React.FC<CongregationCalendarProps> = ({ onNavigateToWeek }) => {
  const {
    congregationEvents,
    addCongregationEvent,
    updateCongregationEvent,
    deleteCongregationEvent,
    theocraticAssemblies,
    circuitVisit,
    memorialPlans,
    weeks,
    settings,
    publishersMap,
    setCurrentWeekId,
  } = useCongregation();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [miniDate, setMiniDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CongregationEvent | null>(null);
  const [selectedSlotDate, setSelectedSlotDate] = useState<string | undefined>(undefined);
  const [selectedMeeting, setSelectedMeeting] = useState<{
    week: WeekSchedule;
    meetingType: 'midweek' | 'weekend';
    date: string;
    time: string;
  } | null>(null);

  const [filterTypes, setFilterTypes] = useState<string[]>([
    'meeting',
    'visit',
    'assembly',
    'special',
    'memorial',
    'no_meeting',
  ]);

  // Sync mini calendar when main date changes
  useEffect(() => {
    setMiniDate(new Date(currentDate));
  }, [currentDate]);

  const handleMiniMonthChange = (offset: number) => {
    const d = new Date(miniDate.getFullYear(), miniDate.getMonth() + offset, 1);
    setMiniDate(d);
  };

  // Combine manual events + weekly meetings + theocratic data (assemblies, SC visits, memorial)
  const allEvents = useMemo(() => {
    const list: CongregationEvent[] = [...congregationEvents];

    // 1. Weekly Meetings from `weeks`
    weeks.forEach((w) => {
      // Midweek meeting (Vida y Ministerio)
      if (!w.specialEvent?.noMeetingMidweek) {
        const mwDate = getMeetingDateForWeek(w.weekStartDate, settings.midweekMeetingDay, 2);
        const pres = w.midweek?.presidentId ? publishersMap.get(w.midweek.presidentId)?.name : '';
        const reading = w.midweek?.bibleReading || '';
        const startTime = settings.midweekMeetingTime || '19:00';

        list.push({
          id: `meeting-midweek-${w.id}`,
          title: 'Vida y Ministerio Cristianos',
          description:
            [reading ? `Lectura: ${reading}` : '', pres ? `Pres: ${pres}` : '']
              .filter(Boolean)
              .join(' • ') || 'Reunión entre semana',
          start_date: `${mwDate}T${startTime}:00`,
          end_date: `${mwDate}T${startTime}:00`,
          type: 'meeting',
        });
      }

      // Weekend meeting (Discurso Público y La Atalaya)
      if (!w.specialEvent?.noMeetingWeekend) {
        const weDate = getMeetingDateForWeek(w.weekStartDate, settings.weekendMeetingDay, 6);
        const pres = w.weekend?.presidentId ? publishersMap.get(w.weekend.presidentId)?.name : '';
        const talk = w.weekend?.publicTalkTheme || '';
        const speaker = w.weekend?.publicTalkSpeaker
          ? publishersMap.get(w.weekend.publicTalkSpeaker)?.name || w.weekend.publicTalkSpeaker
          : '';
        const startTime = settings.weekendMeetingTime || '10:00';

        list.push({
          id: `meeting-weekend-${w.id}`,
          title: 'Reunión Fin de Semana',
          description:
            [
              talk ? `Tema: "${talk}"` : '',
              speaker ? `Orador: ${speaker}` : '',
              pres ? `Pres: ${pres}` : '',
            ]
              .filter(Boolean)
              .join(' • ') || 'Discurso Público y Estudio de La Atalaya',
          start_date: `${weDate}T${startTime}:00`,
          end_date: `${weDate}T${startTime}:00`,
          type: 'meeting',
        });
      }
    });

    // 2. Theocratic Assemblies
    theocraticAssemblies.forEach((a) => {
      const dateStr = a.dates ? a.dates.trim().split(/[, ]+/)[0] : '';
      if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        list.push({
          id: `virtual-asm-${a.id}`,
          title: a.theme || 'Asamblea Teocrática',
          description: `${a.type === 'regional' ? 'Asamblea Regional' : 'Asamblea de Circuito'} • ${a.venue || ''}`,
          start_date: dateStr,
          end_date: dateStr,
          type: 'assembly',
        });
      }
    });

    // 3. Circuit Overseer Visit
    if (circuitVisit && circuitVisit.startDate) {
      list.push({
        id: `virtual-sc-${circuitVisit.id}`,
        title: `Visita SC: ${circuitVisit.overseerName || 'Superintendente'}`,
        description: circuitVisit.midweekTalkTheme || 'Semana especial de visita del superintendente de circuito',
        start_date: circuitVisit.startDate,
        end_date: circuitVisit.endDate || circuitVisit.startDate,
        type: 'visit',
      });
    }

    // 4. Memorial Plans
    memorialPlans.forEach((m) => {
      if (m.date) {
        list.push({
          id: `virtual-mem-${m.id}`,
          title: `Conmemoración ${m.serviceYear || ''}`,
          description: `Discurso del Memorial: ${m.speakerTheme || 'La Conmemoración de la muerte de Cristo'}`,
          start_date: m.date,
          end_date: m.date,
          type: 'memorial',
        });
      }
    });

    return list;
  }, [
    congregationEvents,
    weeks,
    settings,
    publishersMap,
    theocraticAssemblies,
    circuitVisit,
    memorialPlans,
  ]);

  // Mini calendar days calculation
  const miniCalendarDays = useMemo(() => {
    const year = miniDate.getFullYear();
    const month = miniDate.getMonth();

    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const days: {
      day: number;
      monthOffset: number;
      isToday: boolean;
      isSelected: boolean;
      hasEvents: boolean;
    }[] = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevTotalDays - i,
        monthOffset: -1,
        isToday: false,
        isSelected: false,
        hasEvents: false,
      });
    }

    // Current month days
    const today = new Date();
    for (let d = 1; d <= totalDays; d++) {
      const isDayToday =
        today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
      const isDaySelected =
        currentDate.getDate() === d &&
        currentDate.getMonth() === month &&
        currentDate.getFullYear() === year;
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasEventsOnDay = allEvents.some(
        (e) => e.start_date.substring(0, 10) <= dateKey && (e.end_date || e.start_date).substring(0, 10) >= dateKey
      );
      days.push({
        day: d,
        monthOffset: 0,
        isToday: isDayToday,
        isSelected: isDaySelected,
        hasEvents: hasEventsOnDay,
      });
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        day: d,
        monthOffset: 1,
        isToday: false,
        isSelected: false,
        hasEvents: false,
      });
    }

    return days;
  }, [miniDate, currentDate, allEvents]);

  const handleMiniDayClick = (dayObj: { day: number; monthOffset: number }) => {
    const targetDate = new Date(
      miniDate.getFullYear(),
      miniDate.getMonth() + dayObj.monthOffset,
      dayObj.day
    );
    setCurrentDate(targetDate);
  };

  const toggleFilter = (type: string) => {
    if (filterTypes.includes(type)) {
      setFilterTypes(filterTypes.filter((t) => t !== type));
    } else {
      setFilterTypes([...filterTypes, type]);
    }
  };

  const formatEventsForCalendar = () => {
    return allEvents
      .filter((e) => filterTypes.includes(e.type))
      .filter((e) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q))
        );
      })
      .map((e) => {
        const start = parseLocalDate(e.start_date);
        let end = parseLocalDate(e.end_date || e.start_date);

        // For all day events ending at midnight, add 1 day so RBC includes the last day
        if (!e.start_date.includes('T') && (!e.end_date || !e.end_date.includes('T'))) {
          end = new Date(end.getTime() + 24 * 60 * 60 * 1000 - 1);
        } else if (e.start_date.includes('T') && start.getTime() === end.getTime()) {
          // If start and end are equal on a meeting, give it 1h45m duration for visual display
          end = new Date(start.getTime() + 105 * 60 * 1000);
        }

        return {
          id: e.id,
          title: e.title,
          start,
          end,
          allDay: !e.start_date.includes('T'),
          resource: e,
        };
      });
  };

  const handleSaveEvent = (eventData: {
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    type: CongregationEvent['type'];
    horarios_diarios?: string;
  }) => {
    if (eventToEdit && !eventToEdit.id.startsWith('virtual-') && !eventToEdit.id.startsWith('meeting-')) {
      updateCongregationEvent({
        ...eventToEdit,
        ...eventData,
      });
    } else {
      addCongregationEvent(eventData);
    }
    setShowAddModal(false);
    setEventToEdit(null);
  };

  const handleSelectEvent = (event: any) => {
    const resource: CongregationEvent = event.resource ?? allEvents.find((e) => e.id === event.id);
    if (!resource) return;

    // Check if it is a meeting
    if (resource.id.startsWith('meeting-')) {
      const isMidweek = resource.id.startsWith('meeting-midweek-');
      const weekId = resource.id.replace(isMidweek ? 'meeting-midweek-' : 'meeting-weekend-', '');
      const foundWeek = weeks.find((w) => w.id === weekId);
      if (foundWeek) {
        setSelectedMeeting({
          week: foundWeek,
          meetingType: isMidweek ? 'midweek' : 'weekend',
          date: resource.start_date.split('T')[0],
          time: resource.start_date.includes('T')
            ? resource.start_date.split('T')[1].substring(0, 5)
            : isMidweek
            ? settings.midweekMeetingTime || '19:00'
            : settings.weekendMeetingTime || '10:00',
        });
        return;
      }
    }

    // Manual custom event or virtual theocratic event: open detail/edit modal
    setEventToEdit(resource);
    setShowAddModal(true);
  };

  const handleDeleteEvent = (id: string) => {
    if (id.startsWith('virtual-') || id.startsWith('meeting-')) {
      return;
    }
    deleteCongregationEvent(id);
    setShowAddModal(false);
    setEventToEdit(null);
  };

  const handleEventDrop = ({ event, start, end }: any) => {
    if (event.resource.id.startsWith('virtual-') || event.resource.id.startsWith('meeting-')) {
      return; // Reuniones y eventos teocráticos sincronizados no se arrastran libremente
    }
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');
    updateCongregationEvent({
      ...event.resource,
      start_date: startStr,
      end_date: endStr,
    });
  };

  const handleOpenScheduleForWeek = (weekId: string) => {
    setCurrentWeekId(weekId);
    if (onNavigateToWeek) {
      onNavigateToWeek(weekId);
    }
  };

  const dayPropGetter = (date: Date) => {
    const isDark = document.documentElement.classList.contains('dark');
    if (!isDark) return {};

    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const isOffRange =
      date.getMonth() !== currentDate.getMonth() || date.getFullYear() !== currentDate.getFullYear();

    if (isToday) {
      return { style: { backgroundColor: 'rgba(99, 102, 241, 0.12)' } };
    }
    if (isOffRange) {
      return { style: { backgroundColor: 'rgba(0, 0, 0, 0.28)' } };
    }
    return { style: { backgroundColor: 'transparent' } };
  };

  const eventStyleGetter = (event: any) => {
    const type = event.resource.type;
    const isDark = document.documentElement.classList.contains('dark');

    type EventStyle = { bg: string; border: string; text: string };
    const styles: Record<string, EventStyle> = {
      meeting: isDark
        ? { bg: 'rgba(76,58,237,0.25)', border: '#9085f4', text: '#e0e7ff' }
        : { bg: '#eef2ff', border: '#4C3AED', text: '#312e81' },
      visit: isDark
        ? { bg: 'rgba(139,92,246,0.22)', border: '#a78bfa', text: '#c4b5fd' }
        : { bg: '#f3e5f5', border: '#8e24aa', text: '#8e24aa' },
      assembly: isDark
        ? { bg: 'rgba(37,99,235,0.22)', border: '#60a5fa', text: '#bfdbfe' }
        : { bg: '#eff6ff', border: '#2563eb', text: '#1e40af' },
      no_meeting: isDark
        ? { bg: 'rgba(239,68,68,0.2)', border: '#f87171', text: '#fca5a5' }
        : { bg: '#fef2f2', border: '#dc2626', text: '#991b1b' },
      memorial: isDark
        ? { bg: 'rgba(245,158,11,0.2)', border: '#fbbf24', text: '#fde68a' }
        : { bg: '#fffbeb', border: '#d97706', text: '#92400e' },
      special: isDark
        ? { bg: 'rgba(16,185,129,0.2)', border: '#34d399', text: '#6ee7b7' }
        : { bg: '#ecfdf5', border: '#059669', text: '#065f46' },
    };

    const s =
      styles[type] ||
      (isDark
        ? { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.3)', text: 'rgba(255,255,255,0.85)' }
        : { bg: '#f4f4f5', border: '#3c4043', text: '#3c4043' });

    return {
      style: {
        backgroundColor: s.bg,
        borderColor: 'transparent',
        color: s.text,
        borderWidth: '0px',
        borderLeft: `3px solid ${s.border}`,
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '700',
        padding: '2px 6px',
        marginTop: '2px',
        marginBottom: '2px',
        boxShadow: isDark ? 'none' : '0 1px 2px 0 rgba(0,0,0,0.05)',
        outline: 'none',
        display: 'block',
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
    };
  };

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Main Layout: Sidebar & Calendar (Calendar first on mobile for immediate access) */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 items-start">
        {/* Left Sidebar (Rendered below main calendar on mobile, left on desktop) */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4 order-2 lg:order-1">
          {/* Mini Calendar Widget (Desktop only since main calendar is directly above on mobile) */}
          <div className="hidden lg:block kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-zinc-800 dark:text-[#E4E4E7] capitalize">
                {miniDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex gap-0.5">
                <button
                  type="button"
                  onClick={() => handleMiniMonthChange(-1)}
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-white/[0.06] rounded-lg text-zinc-500 cursor-pointer"
                  title="Mes anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMiniMonthChange(1)}
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-white/[0.06] rounded-lg text-zinc-500 cursor-pointer"
                  title="Mes siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, idx) => (
                <div key={idx} className="text-[10px] font-bold text-zinc-400 text-center uppercase py-0.5">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {miniCalendarDays.map((dayObj, idx) => {
                const { day, monthOffset, isToday, isSelected, hasEvents } = dayObj;
                const isCurrentMonth = monthOffset === 0;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleMiniDayClick(dayObj)}
                    className={`w-7 h-7 rounded-full text-[10px] font-bold flex flex-col items-center justify-center transition-all mx-auto relative cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs font-extrabold'
                        : isToday
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-extrabold'
                        : isCurrentMonth
                        ? 'text-zinc-700 dark:text-[#D4D4D8] hover:bg-zinc-100 dark:hover:bg-white/[0.06]'
                        : 'text-zinc-300 dark:text-[#71717A] hover:bg-zinc-50 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <span>{day}</span>
                    {hasEvents && (
                      <span
                        className={`w-1 h-1 rounded-full absolute bottom-1 ${
                          isSelected ? 'bg-white' : 'bg-indigo-600 dark:bg-indigo-400'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categorías (Filtros de Google Calendar) */}
          <div className="kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl p-4 shadow-sm">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3 ml-1">
              Capas y Categorías
            </h4>
            <div className="space-y-2.5">
              {[
                { id: 'meeting', label: 'Reuniones de Congregación', color: 'bg-indigo-600' },
                { id: 'visit', label: 'Visita del Superintendente', color: 'bg-purple-500' },
                { id: 'assembly', label: 'Asambleas y Jornadas', color: 'bg-blue-500' },
                { id: 'special', label: 'Eventos Especiales', color: 'bg-emerald-500' },
                { id: 'memorial', label: 'Conmemoración', color: 'bg-amber-500' },
                { id: 'no_meeting', label: 'Reuniones Canceladas', color: 'bg-rose-500' },
              ].map((filter) => (
                <label key={filter.id} className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={filterTypes.includes(filter.id)}
                    onChange={() => toggleFilter(filter.id)}
                  />
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                      filterTypes.includes(filter.id)
                        ? `${filter.color} text-white shadow-2xs`
                        : 'bg-zinc-100 dark:bg-white/[0.04] border border-zinc-300 dark:border-white/15'
                    }`}
                  >
                    {filterTypes.includes(filter.id) && <Check size={11} strokeWidth={3.5} />}
                  </div>
                  <span className="text-xs text-zinc-700 dark:text-[#D4D4D8] font-semibold group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                    {filter.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Próximas Actividades */}
          <div className="kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl p-4 shadow-sm">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3 ml-1">
              Próximas Actividades
            </h4>
            <div className="space-y-2">
              {allEvents
                .filter((e) => e.start_date >= new Date().toISOString().split('T')[0])
                .sort((a, b) => a.start_date.localeCompare(b.start_date))
                .slice(0, 6)
                .map((e) => {
                  const isMultiDay = e.end_date && e.end_date !== e.start_date;
                  const isMeeting = e.type === 'meeting';
                  return (
                    <div
                      key={e.id}
                      onClick={() => handleSelectEvent({ id: e.id, resource: e })}
                      className={`p-2.5 rounded-2xl cursor-pointer transition-colors group border ${
                        isMeeting
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100/60 dark:border-indigo-900/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                          : 'bg-zinc-50/60 dark:bg-white/[0.03] border-zinc-200/60 dark:border-white/10 hover:bg-zinc-100/70 dark:hover:bg-white/[0.06]'
                      }`}
                    >
                      <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-0.5 flex items-center justify-between">
                        <span>
                          {parseLocalDate(e.start_date).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                          {isMultiDay &&
                            ` - ${parseLocalDate(e.end_date!).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                            })}`}
                        </span>
                        {isMeeting && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                            Reunión
                          </span>
                        )}
                      </p>
                      <p className="text-xs font-semibold text-zinc-800 dark:text-[#E4E4E7] group-hover:text-indigo-600 transition-colors truncate">
                        {e.title}
                      </p>
                    </div>
                  );
                })}
              {allEvents.filter((e) => e.start_date >= new Date().toISOString().split('T')[0]).length ===
                0 && (
                <p className="text-xs text-zinc-400 italic text-center py-4">No hay eventos próximos</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Calendar View (First on mobile, right column on desktop) */}
        <div className="flex-1 w-full kg-card-bento kg-glass-surface kg-sheen-top rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm p-3 sm:p-6 flex flex-col min-h-[480px] sm:min-h-[640px] overflow-hidden rbc-custom-theme order-1 lg:order-2">
          <DnDCalendar
            localizer={localizer}
            events={formatEventsForCalendar()}
            startAccessor="start"
            endAccessor="end"
            date={currentDate}
            onNavigate={(newDate: Date) => setCurrentDate(newDate)}
            view={currentView}
            onView={(newView: View) => setCurrentView(newView)}
            culture="es"
            components={{
              toolbar: (toolbarProps: any) => (
                <CustomToolbar
                  {...toolbarProps}
                  onAddEvent={() => {
                    setEventToEdit(null);
                    setSelectedSlotDate(undefined);
                    setShowAddModal(true);
                  }}
                />
              ),
              month: {
                dateHeader: CustomDateHeader,
              },
            }}
            messages={{
              allDay: 'Todo el día',
              previous: 'Anterior',
              next: 'Siguiente',
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              agenda: 'Agenda',
              date: 'Fecha',
              time: 'Hora',
              event: 'Evento',
              noEventsInRange: 'No hay eventos en este rango.',
              showMore: (total: number) => `+ Ver más (${total})`,
            }}
            dayPropGetter={dayPropGetter}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            onEventDrop={handleEventDrop}
            onSelectSlot={({ start }: { start: Date }) => {
              setSelectedSlotDate(format(start, 'yyyy-MM-dd'));
              setEventToEdit(null);
              setShowAddModal(true);
            }}
            selectable
            resizable={false}
            className="flex-1 font-sans text-xs sm:text-sm text-zinc-800 dark:text-[#E4E4E7] min-h-[580px]"
          />
        </div>
      </div>

      {/* Add / Edit Event Modal */}
      <AddEventModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEventToEdit(null);
          setSelectedSlotDate(undefined);
        }}
        onSave={handleSaveEvent}
        eventToEdit={eventToEdit}
        initialDate={selectedSlotDate}
        onDelete={handleDeleteEvent}
      />

      {/* Meeting Detail Modal */}
      <MeetingDetailModal
        meeting={selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        onOpenSchedule={handleOpenScheduleForWeek}
        publishersMap={publishersMap}
      />
    </div>
  );
};
