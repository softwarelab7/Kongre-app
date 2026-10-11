// src/components/ExportPdfTab.tsx
import React, { useState, useEffect } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { generateProgramPdf, generateS89Pdf } from '../utils/pdfGenerator';
import { createAssignmentWhatsAppMessage, openWhatsAppLink } from '../utils/whatsapp';
import { exportScheduleToCsvExcel } from '../utils/excelExport';
import { downloadMonthIcsSchedule } from '../utils/calendarExport';
import {
  FileText,
  Printer,
  Download,
  Palette,
  Layout,
  Sliders,
  Check,
  Eye,
  MessageCircle,
  FileCheck,
  Calendar,
  Layers,
  FileSpreadsheet,
  CalendarDays,
  Copy,
  CheckCircle2,
} from 'lucide-react';

export const ExportPdfTab: React.FC = () => {
  const { weeks, publishersMap, settings, updateSettings, currentWeek } = useCongregation();

  const [activeTemplate, setActiveTemplate] = useState<'clasica' | 'moderna' | 'minimalista' | 'color' | 'oficial'>(
    settings.pdfTemplate === 'color' || settings.pdfTemplate === 'clasica' || settings.pdfTemplate === 'moderna' || settings.pdfTemplate === 'minimalista'
      ? settings.pdfTemplate
      : 'oficial'
  );
  const [pageSize, setPageSize] = useState<'letter' | 'a4'>(settings.pdfPageSize || 'letter');
  const [showMidweek, setShowMidweek] = useState(settings.pdfSections.midweek);
  const [showWeekend, setShowWeekend] = useState(settings.pdfSections.weekend);
  const [showDuties, setShowDuties] = useState(settings.pdfSections.duties);
  const [showCleaning, setShowCleaning] = useState(settings.pdfSections.cleaning);
  const [activeTab, setActiveTab] = useState<'programa' | 's89' | 'whatsapp'>('programa');
  const [notifiedKeys, setNotifiedKeys] = useState<Record<string, boolean>>({});
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [pdfCongregationName, setPdfCongregationName] = useState(settings.congregationName || '');

  useEffect(() => {
    setPdfCongregationName(settings.congregationName || '');
  }, [settings.congregationName]);

  const handleDownloadPdf = () => {
    generateProgramPdf(weeks, publishersMap, {
      ...settings,
      congregationName: pdfCongregationName.trim() || settings.congregationName || 'Congregación',
      pdfTemplate: activeTemplate,
      pdfPageSize: pageSize,
      pdfSections: {
        midweek: showMidweek,
        weekend: showWeekend,
        duties: showDuties,
        cleaning: showCleaning,
      },
    });
  };

  const handleDownloadExcel = () => {
    exportScheduleToCsvExcel(weeks, publishersMap, {
      ...settings,
      congregationName: pdfCongregationName.trim() || settings.congregationName || 'Congregación',
    });
  };

  const handleDownloadIcs = () => {
    downloadMonthIcsSchedule(weeks, publishersMap, settings);
  };

  const handleDownloadS89 = () => {
    if (!currentWeek) return;
    generateS89Pdf(currentWeek, publishersMap, settings.congregationName, pageSize);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleNotified = (key: string) => {
    setNotifiedKeys(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCopyWeekSummary = () => {
    if (!currentWeek) return;
    const getPub = (id?: string) => (id ? publishersMap.get(id)?.name || '---' : '---');

    let text = `📋 *PROGRAMA DE REUNIONES - ${settings.congregationName.toUpperCase()}*\n`;
    text += `Semana del ${currentWeek.weekStartDate} al ${currentWeek.weekEndDate}\n\n`;

    if (!currentWeek.specialEvent?.noMeetingMidweek) {
      text += `🏛 *VIDA Y MINISTERIO CRISTIANOS* (${currentWeek.midweek.date} - ${settings.midweekMeetingTime})\n`;
      text += `• Presidente: ${getPub(currentWeek.midweek.presidentId)}\n`;
      text += `• Oraciones: ${getPub(currentWeek.midweek.initialPrayerId)} / ${getPub(currentWeek.midweek.finalPrayerId)}\n`;
      text += `• Tesoros: ${currentWeek.midweek.tesoros.discurso.title} (${getPub(currentWeek.midweek.tesoros.discurso.publisherId)})\n`;
      text += `• Perlas: ${getPub(currentWeek.midweek.tesoros.perlas.publisherId)}\n`;
      text += `• Lectura: ${getPub(currentWeek.midweek.tesoros.lecturaBiblia.publisherId)}\n`;
      currentWeek.midweek.maestros.items.forEach((m, idx) => {
        text += `• Maestros #${idx + 1}: ${m.title} -> ${getPub(m.publisherId)}${m.assistantId ? ` (Ayudante: ${getPub(m.assistantId)})` : ''}\n`;
      });
      text += `• Estudio Bíblico: Conductor: ${getPub(currentWeek.midweek.vidaCristiana.estudioBiblico.conductorId)} | Lector: ${getPub(currentWeek.midweek.vidaCristiana.estudioBiblico.lectorId)}\n`;
      const midAudioVideo = Array.from(new Set([...(currentWeek.midweek.duties.deber_audio || []), ...(currentWeek.midweek.duties.deber_video || [])])).map(getPub).join(', ') || '---';
      text += `• Audio y Video: ${midAudioVideo}\n`;
      text += `• Micrófonos: ${(currentWeek.midweek.duties.deber_microfonos || []).map(getPub).join(', ') || '---'}\n\n`;
    }

    if (!currentWeek.specialEvent?.noMeetingWeekend) {
      text += `📖 *REUNIÓN DE FIN DE SEMANA* (${currentWeek.weekend.date} - ${settings.weekendMeetingTime})\n`;
      text += `• Presidente: ${getPub(currentWeek.weekend.presidentId)}\n`;
      text += `• Discurso Público: ${currentWeek.weekend.publicTalkSpeaker || '---'} ("${currentWeek.weekend.publicTalkTheme || ''}")\n`;
      text += `• Estudio Atalaya: Conductor: ${getPub(currentWeek.weekend.atalayaConductorId)} | Lector: ${getPub(currentWeek.weekend.atalayaLectorId)}\n`;
      const fdsAudioVideo = Array.from(new Set([...(currentWeek.weekend.duties.deber_audio || []), ...(currentWeek.weekend.duties.deber_video || [])])).map(getPub).join(', ') || '---';
      text += `• Audio y Video: ${fdsAudioVideo}\n`;
      text += `• Micrófonos: ${(currentWeek.weekend.duties.deber_microfonos || []).map(getPub).join(', ') || '---'}\n\n`;
    }

    text += `🧹 *Limpieza del Salón:* Grupo(s) #${currentWeek.cleaningGroupNumbers.join(', #')}\n`;
    text += `¡Muchas gracias a todos por su amor y colaboración! ✨`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
            Exportación Oficial
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Exportar Programa y Hojas S-89</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Genera documentos listos para el tablero de anuncios, imprimir o compartir por WhatsApp.
          </p>
        </div>

        {/* Tab switch between Monthly Program, S-89 Slips, and WhatsApp Center */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-semibold w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('programa')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'programa' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate">Programa</span>
          </button>

          <button
            onClick={() => setActiveTab('s89')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center ${
              activeTab === 's89' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">Hojas S-89</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'whatsapp' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">WhatsApp</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROGRAMA MENSUAL */}
      {activeTab === 'programa' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 no-print">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <span>Personalizar Plantilla</span>
            </h3>

            {/* Template Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Estilo de Plantilla (5 Diseños)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'oficial', name: 'Cuadrícula Oficial', desc: 'Cuadrícula y bandas teocráticas' },
                  { id: 'color', name: 'A Color', desc: 'Colores oficiales VYM' },
                  { id: 'clasica', name: 'Clásica', desc: 'Institucional y sobria' },
                  { id: 'moderna', name: 'Moderna', desc: 'Tarjetas y bordes suaves' },
                  { id: 'minimalista', name: 'Minimalista', desc: 'Ahorro de tinta' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTemplate(t.id as any);
                      updateSettings({ pdfTemplate: t.id as any });
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      activeTemplate === t.id
                        ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-indigo-200 bg-white'
                    }`}
                  >
                    <p className="font-bold text-xs text-slate-900">{t.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Page Size & Congregation name */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Formato de Página
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setPageSize('letter');
                    updateSettings({ pdfPageSize: 'letter' });
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    pageSize === 'letter'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tamaño Carta
                </button>
                <button
                  onClick={() => {
                    setPageSize('a4');
                    updateSettings({ pdfPageSize: 'a4' });
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    pageSize === 'a4'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tamaño A4
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nombre de la Congregación:
                </label>
                <input
                  type="text"
                  value={pdfCongregationName}
                  onChange={e => setPdfCongregationName(e.target.value)}
                  placeholder="Ej. Congregación Central"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>
            </div>

            {/* Sections toggle */}
            <div className="space-y-2 pt-4 border-t border-slate-100 text-xs">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                3. Secciones a Incluir
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMidweek}
                  onChange={e => setShowMidweek(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Reunión de Entre Semana (Vida y Ministerio)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWeekend}
                  onChange={e => setShowWeekend(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Reunión de Fin de Semana (Discurso / Atalaya)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDuties}
                  onChange={e => setShowDuties(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Deberes Operativos (Audio, Video, Mics, Acomodadores)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCleaning}
                  onChange={e => setShowCleaning(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Limpieza del Salón del Reino</span>
              </label>
            </div>

            {/* Print and Download buttons */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={handlePrint}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar como PDF</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-bold border border-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Programa (PDF)</span>
              </button>

              <button
                onClick={handleDownloadExcel}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold border border-emerald-200 transition-all flex items-center justify-center gap-2"
                title="Exportar a Excel / CSV con todas las columnas"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Exportar a Excel (.csv)</span>
              </button>

              <button
                onClick={handleDownloadIcs}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold border border-slate-200 transition-all flex items-center justify-center gap-2"
                title="Exportar calendario para Google Calendar, Apple Calendar o Outlook"
              >
                <CalendarDays className="w-4 h-4 text-slate-600" />
                <span>Exportar Calendario (.ics)</span>
              </button>
            </div>
          </div>

          {/* Interactive Live Preview Area */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-2 no-print">
              <span className="flex items-center gap-1 font-semibold">
                <Eye className="w-4 h-4 text-indigo-600" />
                Vista Previa en Tiempo Real ({pageSize.toUpperCase()} • Plantilla: {activeTemplate})
              </span>
              <span>Listo para imprimir o descargar</span>
            </div>

            {/* Print Document Paper Container */}
            <div
              className={`p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-lg min-h-[600px] text-slate-900 transition-all ${
                activeTemplate === 'clasica'
                  ? 'font-serif border-t-8 border-t-slate-800'
                  : activeTemplate === 'minimalista'
                  ? 'font-sans border-t-4 border-t-black'
                  : activeTemplate === 'moderna'
                  ? 'font-sans border-t-8 border-t-indigo-600'
                  : 'font-sans border-t-8 border-t-indigo-800'
              }`}
            >
              {/* Document Header */}
              <div className="text-center pb-6 border-b border-slate-200">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                  {settings.congregationName || 'CONGREGACIÓN LOCAL'}
                </h1>
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-1">
                  Programa de Asignaciones Teocráticas
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {settings.midweekMeetingDay} {settings.midweekMeetingTime} • {settings.weekendMeetingDay} {settings.weekendMeetingTime}
                </p>
              </div>

              {/* Weeks List */}
              <div className="mt-6 space-y-6">
                {weeks.map(w => (
                  <div
                    key={w.id}
                    className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                      activeTemplate === 'color'
                        ? 'border-indigo-100 bg-slate-50/50'
                        : activeTemplate === 'minimalista'
                        ? 'border-black/20 bg-white'
                        : activeTemplate === 'clasica'
                        ? 'border-slate-300 bg-amber-50/20'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {/* Week Title Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-1">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 uppercase">
                        Semana del {w.weekStartDate} al {w.weekEndDate}
                      </h3>
                      {w.specialEvent?.isSpecial && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          {w.specialEvent.title}
                        </span>
                      )}
                    </div>

                    {/* Special Event Block if no meeting */}
                    {w.specialEvent?.isSpecial && w.specialEvent.noMeetingMidweek && w.specialEvent.noMeetingWeekend ? (
                      <p className="py-4 text-xs font-bold text-amber-800 italic">
                        * Sin reuniones regulares en el Salón del Reino con motivo de {w.specialEvent.title}.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3 text-xs">
                        {/* Midweek section */}
                        {showMidweek && !w.specialEvent?.noMeetingMidweek && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-bold text-indigo-900">
                              <span className="w-2 h-2 rounded-full bg-indigo-600" />
                              <span>Vida y Ministerio Cristianos ({w.midweek.date})</span>
                            </div>
                            <div className="pl-4 text-slate-700 space-y-0.5">
                              <p>
                                <strong>Presidente:</strong> {publishersMap.get(w.midweek.presidentId || '')?.name || '---'} |{' '}
                                <strong>Oración:</strong> {publishersMap.get(w.midweek.initialPrayerId || '')?.name || '---'} / {publishersMap.get(w.midweek.finalPrayerId || '')?.name || '---'}
                              </p>
                              <p>
                                <strong>Tesoros:</strong> {w.midweek.tesoros.discurso.title} ({publishersMap.get(w.midweek.tesoros.discurso.publisherId || '')?.name || '---'}) |{' '}
                                <strong>Perlas:</strong> {publishersMap.get(w.midweek.tesoros.perlas.publisherId || '')?.name || '---'} |{' '}
                                <strong>Lectura:</strong> {publishersMap.get(w.midweek.tesoros.lecturaBiblia.publisherId || '')?.name || '---'}
                              </p>
                              {w.midweek.maestros.items.length > 0 && (
                                <p>
                                  <strong>Seamos Mejores Maestros:</strong>{' '}
                                  {w.midweek.maestros.items
                                    .map(
                                      m =>
                                        `${m.title}: ${publishersMap.get(m.publisherId || '')?.name || '---'} ${
                                          m.assistantId ? `(Ayudante: ${publishersMap.get(m.assistantId)?.name})` : ''
                                        }`
                                    )
                                    .join(' • ')}
                                </p>
                              )}
                              <p>
                                <strong>Estudio Bíblico:</strong> Conductor: {publishersMap.get(w.midweek.vidaCristiana.estudioBiblico.conductorId || '')?.name || '---'} | Lector: {publishersMap.get(w.midweek.vidaCristiana.estudioBiblico.lectorId || '')?.name || '---'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Weekend section */}
                        {showWeekend && !w.specialEvent?.noMeetingWeekend && (
                          <div className="space-y-1 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2 font-bold text-emerald-900">
                              <span className="w-2 h-2 rounded-full bg-emerald-600" />
                              <span>Reunión Fin de Semana ({w.weekend.date})</span>
                            </div>
                            <div className="pl-4 text-slate-700 space-y-0.5">
                              <p>
                                <strong>Presidente:</strong> {publishersMap.get(w.weekend.presidentId || '')?.name || '---'} |{' '}
                                <strong>Discurso Público:</strong>{' '}
                                {w.weekend.publicTalkOutlineNumber ? `#${w.weekend.publicTalkOutlineNumber} ` : ''}
                                {w.weekend.publicTalkTheme ? `"${w.weekend.publicTalkTheme}"` : ''}{' '}
                                ({w.weekend.isVisitingSpeaker ? `${w.weekend.publicTalkSpeaker || '---'} [Visitante - ${w.weekend.visitingSpeakerCongregation || 'Sin cong.'}]` : (publishersMap.get(w.weekend.publicTalkSpeaker || '')?.name || w.weekend.publicTalkSpeaker || '---')})
                              </p>
                              {w.weekend.hospitalityPublisherId && (
                                <p className="text-amber-800">
                                  <strong>Hospitalidad / Comida:</strong> {publishersMap.get(w.weekend.hospitalityPublisherId)?.name || '---'}
                                </p>
                              )}
                              <p>
                                <strong>Estudio de La Atalaya:</strong> Conductor: {publishersMap.get(w.weekend.atalayaConductorId || '')?.name || '---'} | Lector: {publishersMap.get(w.weekend.atalayaLectorId || '')?.name || '---'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Duties section */}
                        {showDuties && (
                          <div className="pt-2 border-t border-slate-100 text-slate-600">
                            <p>
                              <strong className="text-slate-800">Deberes:</strong>{' '}
                              Audio y Video: {Array.from(new Set([...(w.midweek.duties.deber_audio || []), ...(w.midweek.duties.deber_video || [])])).map(id => publishersMap.get(id)?.name).filter(Boolean).join(', ') || '---'} |{' '}
                              Micrófonos: {(w.midweek.duties.deber_microfonos || []).map(id => publishersMap.get(id)?.name).filter(Boolean).join(', ') || '---'} |{' '}
                              Acomodador: {(w.midweek.duties.deber_acomodador || []).map(id => publishersMap.get(id)?.name).filter(Boolean).join(', ') || '---'}
                            </p>
                          </div>
                        )}

                        {/* Cleaning */}
                        {showCleaning && (
                          <div className="pt-1 text-slate-500 italic">
                            Limpieza Salón del Reino: Grupo(s) #{w.cleaningGroupNumbers.join(', #')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOJAS DE ASIGNACIÓN S-89 */}
      {activeTab === 's89' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Papeletas de Asignación S-89 (Seamos Mejores Maestros)
              </h3>
              <p className="text-xs text-slate-500">
                Formato oficial de 4 papeletas por hoja listas para imprimir y recortar para la semana seleccionada.
              </p>
            </div>
            <button
              onClick={handleDownloadS89}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Papeletas S-89 (PDF)</span>
            </button>
          </div>

          {/* S-89 Slips 2x2 Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentWeek && currentWeek.midweek.maestros.items.map((item, idx) => {
              const student = item.publisherId ? publishersMap.get(item.publisherId)?.name : 'Estudiante asignado';
              const assistant = item.assistantId ? publishersMap.get(item.assistantId)?.name : '---';

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border-2 border-slate-300 bg-slate-50/70 text-slate-800 space-y-3 font-sans shadow-xs"
                >
                  <div className="text-center pb-2 border-b border-slate-200">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                      Asignación para la Reunión
                    </h4>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">
                      Vida y Ministerio Cristianos (S-89)
                    </p>
                  </div>

                  <div className="text-xs space-y-1.5">
                    <p className="flex justify-between">
                      <span className="font-bold text-slate-600">Congregación:</span>
                      <span className="font-semibold text-slate-900">{settings.congregationName}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-bold text-slate-600">Fecha:</span>
                      <span className="font-semibold text-slate-900">{currentWeek.midweek.date}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-bold text-slate-600">Estudiante:</span>
                      <span className="font-bold text-indigo-700">{student}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-bold text-slate-600">Ayudante:</span>
                      <span className="font-semibold text-slate-900">{assistant}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-bold text-slate-600">Asignación:</span>
                      <span className="font-semibold text-slate-900">{item.title}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-bold text-slate-600">Sala:</span>
                      <span className="font-semibold text-slate-900">
                        {item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'}
                      </span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-center">
                    <p className="text-[10px] text-slate-400 italic">
                      Presente esta hoja a su consejero con su libro Guía.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CENTRO WHATSAPP */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <span>Centro de Mensajes Masivos y Recordatorios por WhatsApp</span>
              </h3>
              <p className="text-xs text-slate-500">
                Semana del {currentWeek?.weekStartDate} al {currentWeek?.weekEndDate}. Notifica a cada hermano individualmente o copia el resumen general.
              </p>
            </div>

            <button
              onClick={handleCopyWeekSummary}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all shrink-0"
            >
              {copiedSummary ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSummary ? '¡Resumen Copiado!' : 'Copiar Resumen Semanal Completo'}</span>
            </button>
          </div>

          {/* List of all weekly assignments with Notified checkboxes */}
          <div className="space-y-2.5">
            {currentWeek && (() => {
              const allItems: Array<{
                id: string;
                title: string;
                meetingType: 'midweek' | 'weekend';
                date: string;
                publisherId?: string;
                assistantId?: string;
                room?: 'principal' | 'auxiliar';
                timeMinutes?: number;
              }> = [];

              // Midweek
              if (currentWeek.midweek.presidentId) {
                allItems.push({ id: 'mid-pres', title: 'Presidente Entre Semana', meetingType: 'midweek', date: currentWeek.midweek.date, publisherId: currentWeek.midweek.presidentId });
              }
              if (currentWeek.midweek.tesoros.discurso.publisherId) {
                allItems.push({ id: 'mid-disc', title: currentWeek.midweek.tesoros.discurso.title, meetingType: 'midweek', date: currentWeek.midweek.date, publisherId: currentWeek.midweek.tesoros.discurso.publisherId, timeMinutes: 10 });
              }
              if (currentWeek.midweek.tesoros.perlas.publisherId) {
                allItems.push({ id: 'mid-perl', title: 'Perlas escondidas', meetingType: 'midweek', date: currentWeek.midweek.date, publisherId: currentWeek.midweek.tesoros.perlas.publisherId, timeMinutes: 10 });
              }
              if (currentWeek.midweek.tesoros.lecturaBiblia.publisherId) {
                allItems.push({ id: 'mid-lect', title: 'Lectura de la Biblia', meetingType: 'midweek', date: currentWeek.midweek.date, publisherId: currentWeek.midweek.tesoros.lecturaBiblia.publisherId, timeMinutes: 4, room: 'principal' });
              }
              currentWeek.midweek.maestros.items.forEach((m, idx) => {
                if (m.publisherId) {
                  allItems.push({ id: `mid-m-${idx}`, title: m.title, meetingType: 'midweek', date: currentWeek.midweek.date, publisherId: m.publisherId, assistantId: m.assistantId, room: m.room, timeMinutes: m.timeMinutes });
                }
              });
              currentWeek.midweek.vidaCristiana.items.forEach((v, idx) => {
                if (v.publisherId) {
                  allItems.push({ id: `mid-v-${idx}`, title: v.title, meetingType: 'midweek', date: currentWeek.midweek.date, publisherId: v.publisherId, timeMinutes: v.timeMinutes });
                }
              });
              if (currentWeek.midweek.vidaCristiana.estudioBiblico.conductorId) {
                allItems.push({ id: 'mid-cbs-cond', title: 'Conductor Estudio Bíblico', meetingType: 'midweek', date: currentWeek.midweek.date, publisherId: currentWeek.midweek.vidaCristiana.estudioBiblico.conductorId });
              }
              if (currentWeek.midweek.vidaCristiana.estudioBiblico.lectorId) {
                allItems.push({ id: 'mid-cbs-lect', title: 'Lector Estudio Bíblico', meetingType: 'midweek', date: currentWeek.midweek.date, publisherId: currentWeek.midweek.vidaCristiana.estudioBiblico.lectorId });
              }
              // Midweek duties
              Object.entries(currentWeek.midweek.duties).forEach(([k, ids]) => {
                ids.forEach((id, idx) => {
                  allItems.push({ id: `duty-mid-${k}-${idx}`, title: `Deber: ${k.replace('deber_', '').toUpperCase()}`, meetingType: 'midweek', date: currentWeek.midweek.date, publisherId: id });
                });
              });

              // Weekend
              if (currentWeek.weekend.presidentId) {
                allItems.push({ id: 'fds-pres', title: 'Presidente Fin de Semana', meetingType: 'weekend', date: currentWeek.weekend.date, publisherId: currentWeek.weekend.presidentId });
              }
              if (currentWeek.weekend.atalayaConductorId) {
                allItems.push({ id: 'fds-cond', title: 'Conductor de La Atalaya', meetingType: 'weekend', date: currentWeek.weekend.date, publisherId: currentWeek.weekend.atalayaConductorId });
              }
              if (currentWeek.weekend.atalayaLectorId) {
                allItems.push({ id: 'fds-lect', title: 'Lector de La Atalaya', meetingType: 'weekend', date: currentWeek.weekend.date, publisherId: currentWeek.weekend.atalayaLectorId });
              }
              Object.entries(currentWeek.weekend.duties).forEach(([k, ids]) => {
                ids.forEach((id, idx) => {
                  allItems.push({ id: `duty-fds-${k}-${idx}`, title: `Deber: ${k.replace('deber_', '').toUpperCase()} (FDS)`, meetingType: 'weekend', date: currentWeek.weekend.date, publisherId: id });
                });
              });

              return allItems.map(item => {
                const pub = item.publisherId ? publishersMap.get(item.publisherId) : undefined;
                if (!pub) return null;
                const assistant = item.assistantId ? publishersMap.get(item.assistantId)?.name : undefined;
                const isNotified = Boolean(notifiedKeys[item.id]);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      isNotified ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isNotified}
                        onChange={() => toggleNotified(item.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title="Marcar como ya notificado"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900">{pub.name}</span>
                          {isNotified && (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              ✓ Notificado
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 mt-0.5">
                          {item.title} • {item.date} {item.room ? `(${item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'})` : ''}
                        </p>
                        {assistant && <p className="text-slate-500 text-[11px]">Ayudante: {assistant}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-7 sm:pl-0">
                      <button
                        onClick={() => {
                          const msg = createAssignmentWhatsAppMessage(
                            pub,
                            currentWeek,
                            item.title,
                            item.meetingType,
                            item.date,
                            {
                              assistantName: assistant,
                              room: item.room,
                              timeMinutes: item.timeMinutes,
                              congregationName: settings.congregationName,
                            }
                          );
                          openWhatsAppLink(pub.phone || '', msg);
                          setNotifiedKeys(prev => ({ ...prev, [item.id]: true }));
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Notificar</span>
                      </button>

                      <button
                        onClick={() => {
                          const msg = createAssignmentWhatsAppMessage(
                            pub,
                            currentWeek,
                            item.title,
                            item.meetingType,
                            item.date,
                            {
                              isReminder: true,
                              assistantName: assistant,
                              room: item.room,
                              timeMinutes: item.timeMinutes,
                              congregationName: settings.congregationName,
                            }
                          );
                          openWhatsAppLink(pub.phone || '', msg);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold transition-all"
                      >
                        Recordar
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
