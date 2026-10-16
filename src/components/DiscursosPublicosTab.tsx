// src/components/DiscursosPublicosTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import {
  OFFICIAL_PUBLIC_TALK_OUTLINES,
  searchOutlines,
  findOutlineByNumber,
} from '../utils/theocraticData';
import {
  PublicTalkOutline,
  OutgoingSpeakerAssignment,
  WeekSchedule,
} from '../types';
import {
  Mic,
  Calendar,
  BookOpen,
  Send,
  UserCheck,
  Building,
  Phone,
  Utensils,
  Plus,
  Trash2,
  Edit2,
  Search,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Copy,
  Clock,
  Sparkles,
} from 'lucide-react';
import { SplashCheckbox } from './SplashCheckbox';

export const DiscursosPublicosTab: React.FC = () => {
  const {
    weeks,
    updateWeek,
    publishers,
    publishersMap,
    outgoingSpeakers,
    addOutgoingSpeaker,
    updateOutgoingSpeaker,
    deleteOutgoingSpeaker,
    hospitalityHosts,
    settings,
  } = useCongregation();

  const [activeSubTab, setActiveSubTab] = useState<
    'programa' | 'catalogo' | 'salientes' | 'historial'
  >('programa');

  // Search & Filters for Catalog
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<string>('todas');

  // Modal for editing weekend public talk on a week
  const [editingWeek, setEditingWeek] = useState<WeekSchedule | null>(null);

  // Modal for adding/editing outgoing speaker
  const [isOutgoingModalOpen, setIsOutgoingModalOpen] = useState(false);
  const [editingOutgoingItem, setEditingOutgoingItem] = useState<OutgoingSpeakerAssignment | null>(null);
  const [outgoingForm, setOutgoingForm] = useState({
    publisherId: '',
    date: new Date().toISOString().split('T')[0],
    destinationCongregation: '',
    outlineNumber: 1,
    outlineTitle: '',
    notes: '',
  });

  // Modal for managing prepared outlines for a publisher
  const [selectedOutlineForBrothers, setSelectedOutlineForBrothers] = useState<PublicTalkOutline | null>(null);

  // Filtered outlines for catalog
  const filteredOutlines = useMemo(() => {
    let list = OFFICIAL_PUBLIC_TALK_OUTLINES;
    if (catalogQuery.trim()) {
      list = searchOutlines(catalogQuery);
    }
    if (catalogCategory !== 'todas') {
      list = list.filter((o) => o.category === catalogCategory);
    }
    return list;
  }, [catalogQuery, catalogCategory]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    OFFICIAL_PUBLIC_TALK_OUTLINES.forEach((o) => {
      if (o.category) set.add(o.category);
    });
    return Array.from(set);
  }, []);

  // History of talks given locally from weeks
  const talkHistory = useMemo(() => {
    const list: {
      weekId: string;
      date: string;
      outlineNumber?: number;
      theme?: string;
      speakerName: string;
      isVisiting?: boolean;
      congregation?: string;
      hospitalityName?: string;
    }[] = [];

    weeks.forEach((w) => {
      if (w.weekend.publicTalkOutlineNumber || w.weekend.publicTalkSpeaker || w.weekend.publicTalkTheme) {
        const isVisiting = w.weekend.isVisitingSpeaker;
        let speakerName = w.weekend.publicTalkSpeaker || 'Sin asignar';
        if (!isVisiting && w.weekend.publicTalkSpeaker && publishersMap.has(w.weekend.publicTalkSpeaker)) {
          speakerName = publishersMap.get(w.weekend.publicTalkSpeaker)!.name;
        }
        let hospitalityName = '';
        if (w.weekend.hospitalityPublisherId && publishersMap.has(w.weekend.hospitalityPublisherId)) {
          hospitalityName = publishersMap.get(w.weekend.hospitalityPublisherId)!.name;
        }

        list.push({
          weekId: w.id,
          date: w.weekend.date,
          outlineNumber: w.weekend.publicTalkOutlineNumber,
          theme: w.weekend.publicTalkTheme,
          speakerName,
          isVisiting,
          congregation: w.weekend.visitingSpeakerCongregation,
          hospitalityName,
        });
      }
    });

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [weeks, publishersMap]);

  // Map of outline number to last date delivered locally
  const outlineLastDelivered = useMemo(() => {
    const map = new Map<number, string>();
    talkHistory.forEach((h) => {
      if (h.outlineNumber && !map.has(h.outlineNumber)) {
        map.set(h.outlineNumber, h.date);
      }
    });
    return map;
  }, [talkHistory]);

  // Local brothers eligible for public talks (brothers with vym_vida_partes or anciano/siervo)
  const localSpeakerPublishers = useMemo(() => {
    return publishers.filter(
      (p) => p.active && p.gender === 'hermano' && (p.roles.vym_vida_partes || p.roles.fds_presidente)
    );
  }, [publishers]);

  // Brothers eligible for hospitality
  const hospitalityPublishers = useMemo(() => {
    return publishers.filter((p) => p.active);
  }, [publishers]);

  // Open edit modal for week
  const handleOpenEditTalk = (week: WeekSchedule) => {
    setEditingWeek(JSON.parse(JSON.stringify(week)));
  };

  const handleSaveWeekTalk = () => {
    if (!editingWeek) return;
    updateWeek(editingWeek);
    setEditingWeek(null);
  };

  // WhatsApp invite to visiting speaker
  const handleSendWhatsAppSpeaker = (week: WeekSchedule) => {
    const w = week.weekend;
    const speakerName = w.publicTalkSpeaker || 'Hermano';
    const theme = w.publicTalkTheme ? `"${w.publicTalkTheme}" (Bosquejo #${w.publicTalkOutlineNumber || ''})` : 'el discurso público';
    const hospitalityPub = w.hospitalityPublisherId ? publishersMap.get(w.hospitalityPublisherId) : null;

    let text = `Estimado ${speakerName}, ¡saludos cristianos!\n\n`;
    text += `Le recordamos con mucho cariño su visita a la *${settings.congregationName}* para presentar ${theme}.\n\n`;
    text += `📅 *Fecha:* ${w.date}\n`;
    text += `⏰ *Hora de inicio:* ${settings.weekendMeetingTime}\n`;
    if (settings.hallAddress) {
      text += `📍 *Lugar:* Salón del Reino (${settings.hallAddress})\n`;
    }
    if (hospitalityPub) {
      text += `\n🍽️ *Hospitalidad / Comida:* El hermano *${hospitalityPub.name}* (${hospitalityPub.phone}) estará a cargo de atenderlo gustosamente después de la reunión.\n`;
    }
    text += `\nEsperamos con anhelo compartir con usted este fin de semana. Que Jehová bendiga su viaje y preparación.`;

    const phoneClean = w.visitingSpeakerPhone ? w.visitingSpeakerPhone.replace(/[^0-9]/g, '') : '';
    const url = phoneClean
      ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // WhatsApp notification to hospitality brother
  const handleSendWhatsAppHospitality = (week: WeekSchedule) => {
    const w = week.weekend;
    const hospitalityPub = w.hospitalityPublisherId ? publishersMap.get(w.hospitalityPublisherId) : null;
    if (!hospitalityPub) return;

    const speakerName = w.publicTalkSpeaker || 'el orador visitante';
    const cong = w.visitingSpeakerCongregation ? ` de la congregación ${w.visitingSpeakerCongregation}` : '';
    const speakerPhone = w.visitingSpeakerPhone ? ` (Tel: ${w.visitingSpeakerPhone})` : '';

    let text = `Querido hno. ${hospitalityPub.name},\n\n`;
    text += `Le recordamos con aprecio que ha sido asignado para brindar la *hospitalidad y comida* al orador visitante para este fin de semana:\n\n`;
    text += `👤 *Orador:* ${speakerName}${cong}${speakerPhone}\n`;
    text += `📅 *Fecha:* ${w.date}\n`;
    text += `⏰ *Reunión:* ${settings.weekendMeetingTime}\n`;
    text += `📖 *Tema:* #${w.publicTalkOutlineNumber || ''} "${w.publicTalkTheme || ''}"\n\n`;
    text += `Muchas gracias por su amorosa disposición cristiana para recibir a nuestros hermanos visitantes.`;

    const phoneClean = hospitalityPub.phone ? hospitalityPub.phone.replace(/[^0-9]/g, '') : '';
    const url = phoneClean
      ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Outgoing talk save
  const handleSaveOutgoing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outgoingForm.publisherId || !outgoingForm.destinationCongregation) return;

    const outline = findOutlineByNumber(outgoingForm.outlineNumber);
    const title = outline ? outline.title : outgoingForm.outlineTitle;

    if (editingOutgoingItem) {
      updateOutgoingSpeaker({
        ...editingOutgoingItem,
        publisherId: outgoingForm.publisherId,
        date: outgoingForm.date,
        destinationCongregation: outgoingForm.destinationCongregation,
        outlineNumber: outgoingForm.outlineNumber,
        outlineTitle: title,
        notes: outgoingForm.notes,
      });
    } else {
      addOutgoingSpeaker({
        publisherId: outgoingForm.publisherId,
        date: outgoingForm.date,
        destinationCongregation: outgoingForm.destinationCongregation,
        outlineNumber: outgoingForm.outlineNumber,
        outlineTitle: title,
        notes: outgoingForm.notes,
      });
    }

    setIsOutgoingModalOpen(false);
    setEditingOutgoingItem(null);
  };

  const handleOpenAddOutgoing = () => {
    setEditingOutgoingItem(null);
    setOutgoingForm({
      publisherId: localSpeakerPublishers[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      destinationCongregation: '',
      outlineNumber: 1,
      outlineTitle: OFFICIAL_PUBLIC_TALK_OUTLINES[0]?.title || '',
      notes: '',
    });
    setIsOutgoingModalOpen(true);
  };

  const handleOpenEditOutgoing = (item: OutgoingSpeakerAssignment) => {
    setEditingOutgoingItem(item);
    setOutgoingForm({
      publisherId: item.publisherId,
      date: item.date,
      destinationCongregation: item.destinationCongregation,
      outlineNumber: item.outlineNumber,
      outlineTitle: item.outlineTitle,
      notes: item.notes || '',
    });
    setIsOutgoingModalOpen(true);
  };

  // Outlines prepared toggle for brother
  const handleToggleOutlinePrepared = (pubId: string, outlineNum: number) => {
    const pub = publishersMap.get(pubId);
    if (!pub) return;
    const current = pub.preparedOutlines || [];
    const exists = current.includes(outlineNum);
    const updated = exists ? current.filter((n) => n !== outlineNum) : [...current, outlineNum];

    const { updatePublisher } = useCongregation();
    updatePublisher({
      ...pub,
      preparedOutlines: updated,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold tracking-wide uppercase">
              Módulo Oficial Teocrático
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
              194 Bosquejos Oficiales
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Mic className="w-7 h-7 text-indigo-400" />
            <span>Coordinación de Discursos Públicos</span>
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Gestión completa de oradores locales y visitantes, asignación de hospitalidad,
            registro de salidas a otras congregaciones y control de duplicados de bosquejos.
          </p>
        </div>

        {/* Action quick buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleOpenAddOutgoing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Salida de Orador</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-white rounded-t-xl px-2 pt-2">
        <button
          onClick={() => setActiveSubTab('programa')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeSubTab === 'programa'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Programa Fin de Semana ({weeks.length} semanas)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('catalogo')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeSubTab === 'catalogo'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Catálogo de Bosquejos (1-194)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('salientes')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeSubTab === 'salientes'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Oradores Salientes</span>
          {outgoingSpeakers.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-800 font-bold">
              {outgoingSpeakers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('historial')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeSubTab === 'historial'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Historial de Discursos ({talkHistory.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: PROGRAMA FIN DE SEMANA */}
      {activeSubTab === 'programa' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900 text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Regla Teocrática de Repetición de Bosquejos:</p>
              <p className="text-amber-800 text-xs mt-0.5">
                La sucursal recomienda que un mismo bosquejo público no se repita en la congregación
                antes de 12 meses. Esta pantalla le alertará en amarillo si un tema programado ya se
                presentó recientemente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeks.map((week) => {
              const w = week.weekend;
              const isVisiting = w.isVisitingSpeaker;
              let speakerName = w.publicTalkSpeaker || 'Pendiente de asignar';
              if (!isVisiting && w.publicTalkSpeaker && publishersMap.has(w.publicTalkSpeaker)) {
                speakerName = publishersMap.get(w.publicTalkSpeaker)!.name;
              }

              const outlineNum = w.publicTalkOutlineNumber;
              const theme = w.publicTalkTheme || (outlineNum ? findOutlineByNumber(outlineNum)?.title : 'Sin tema definido');

              // Check if outline was delivered recently in another week
              const otherWeekSameOutline = outlineNum
                ? weeks.find(
                    (other) =>
                      other.id !== week.id &&
                      other.weekend.publicTalkOutlineNumber === outlineNum &&
                      other.weekend.date < w.date
                  )
                : null;

              const hospitalityPub = w.hospitalityPublisherId
                ? publishersMap.get(w.hospitalityPublisherId)
                : null;

              return (
                <div
                  key={week.id}
                  className={`bg-white rounded-2xl border p-5 transition-all shadow-xs hover:shadow-md ${
                    otherWeekSameOutline
                      ? 'border-amber-300 ring-2 ring-amber-100'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {w.date}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {settings.weekendMeetingDay} {settings.weekendMeetingTime}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mt-1">
                        Semana del {week.weekStartDate}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleOpenEditTalk(week)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 transition-colors"
                      title="Editar Discurso y Hospitalidad"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Outline Title */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                        {outlineNum ? `Bosquejo #${outlineNum}` : 'Sin Bosquejo #'}
                      </span>
                      {isVisiting && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Orador Visitante
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-800 text-sm line-clamp-2">
                      {theme || 'Tema no especificado'}
                    </p>

                    {/* Repeated outline alert */}
                    {otherWeekSameOutline && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          Ya presentado el {otherWeekSameOutline.weekend.date} (hace menos de 12 meses)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Speaker Details */}
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-xs mb-4 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Mic className="w-3.5 h-3.5" /> Orador:
                      </span>
                      <span className="font-bold text-slate-900">{speakerName}</span>
                    </div>

                    {isVisiting && (
                      <>
                        {w.visitingSpeakerCongregation && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 flex items-center gap-1">
                              <Building className="w-3.5 h-3.5" /> Congregación:
                            </span>
                            <span className="font-medium text-slate-800">
                              {w.visitingSpeakerCongregation}
                            </span>
                          </div>
                        )}
                        {w.visitingSpeakerPhone && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" /> Teléfono:
                            </span>
                            <span className="font-medium text-slate-800">
                              {w.visitingSpeakerPhone}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Hospitality brother */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Utensils className="w-3.5 h-3.5 text-amber-600" /> Hospitalidad (Comida):
                      </span>
                      <span className="font-semibold text-slate-900">
                        {hospitalityPub ? hospitalityPub.name : 'No asignado'}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons (WhatsApp) */}
                  <div className="grid grid-cols-2 gap-2">
                    {isVisiting ? (
                      <button
                        onClick={() => handleSendWhatsAppSpeaker(week)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors"
                        title="Enviar invitación y datos al orador visitante"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Invitar Orador</span>
                      </button>
                    ) : (
                      <div className="text-center py-2 text-xs text-slate-400 font-medium italic">
                        Orador Local
                      </div>
                    )}

                    {hospitalityPub && (
                      <button
                        onClick={() => handleSendWhatsAppHospitality(week)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors"
                        title="Avisar al hermano de la hospitalidad"
                      >
                        <Utensils className="w-3.5 h-3.5 text-amber-600" />
                        <span>Avisar Comida</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: CATALOGO OFICIAL DE BOSQUEJOS */}
      {activeSubTab === 'catalogo' && (
        <div className="space-y-4">
          {/* Search bar & Category filter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={catalogQuery}
                onChange={(e) => setCatalogQuery(e.target.value)}
                placeholder="Buscar por número (ej: 23) o título..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-500">Categoría:</span>
              <select
                value={catalogCategory}
                onChange={(e) => setCatalogCategory(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-medium text-slate-700 outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todas">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredOutlines.map((outline) => {
              const lastDelivered = outlineLastDelivered.get(outline.number);
              // Find local brothers who prepared this outline
              const preparedBrothers = publishers.filter(
                (p) => p.preparedOutlines && p.preparedOutlines.includes(outline.number)
              );

              return (
                <div
                  key={outline.number}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 transition-all flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200 shrink-0">
                        #{outline.number}
                      </span>
                      {outline.category && (
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full truncate">
                          {outline.category}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm leading-snug mb-3">
                      {outline.title}
                    </h4>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    {/* Last delivered */}
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Última vez presentado:</span>
                      {lastDelivered ? (
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {lastDelivered}
                        </span>
                      ) : (
                        <span className="italic text-slate-400">Nunca registrado</span>
                      )}
                    </div>

                    {/* Prepared brothers */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Oradores locales:</span>
                      <button
                        onClick={() => setSelectedOutlineForBrothers(outline)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                      >
                        {preparedBrothers.length > 0
                          ? `${preparedBrothers.length} asignado(s)`
                          : '+ Habilitar'}
                      </button>
                    </div>

                    {preparedBrothers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {preparedBrothers.map((b) => (
                          <span
                            key={b.id}
                            className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-2xs font-semibold"
                          >
                            {b.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: ORADORES SALIENTES */}
      {activeSubTab === 'salientes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Discursos en Otras Congregaciones (Salidas)
              </h3>
              <p className="text-xs text-slate-500">
                Cuando un hermano local sale a discursar fuera, el sistema bloquea sus asignaciones
                locales para que no tenga cruces ese fin de semana.
              </p>
            </div>
            <button
              onClick={handleOpenAddOutgoing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Salida</span>
            </button>
          </div>

          {outgoingSpeakers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <Send className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-base">No hay salidas registradas</h4>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                Registre las fechas en que los ancianos o siervos ministeriales de su congregación
                tienen invitaciones para discursar en otras congregaciones.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {outgoingSpeakers.map((item) => {
                const pub = publishersMap.get(item.publisherId);
                const outline = findOutlineByNumber(item.outlineNumber);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            <Send className="w-4 h-4" />
                          </span>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">
                              {pub ? pub.name : 'Hermano no encontrado'}
                            </h4>
                            <p className="text-xs text-slate-500">{pub?.phone || ''}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditOutgoing(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteOutgoingSpeaker(item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs mb-3 border border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Fecha de visita:</span>
                          <span className="font-bold text-slate-900">{item.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Congregación destino:</span>
                          <span className="font-bold text-indigo-700">
                            {item.destinationCongregation}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Bosquejo #{item.outlineNumber}:</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                            {item.outlineTitle || outline?.title}
                          </span>
                        </div>
                      </div>

                      {item.notes && (
                        <p className="text-xs text-slate-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100 mb-3">
                          "{item.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-2xs text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Protegido contra cruces locales ese fin de semana</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: HISTORIAL DE DISCURSOS */}
      {activeSubTab === 'historial' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Historial de Discursos Presentados en el Salón
              </h3>
              <p className="text-xs text-slate-500">
                Registro cronológico para auditoría teocrática y control de repetición.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {talkHistory.length} discursos registrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Bosquejo # y Tema</th>
                  <th className="px-4 py-3">Orador</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Hospitalidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {talkHistory.map((h, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                      {h.date}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">
                        {h.outlineNumber ? `#${h.outlineNumber}` : ''} {h.theme || 'Sin tema'}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <div>{h.speakerName}</div>
                      {h.congregation && (
                        <div className="text-slate-400 text-2xs">{h.congregation}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {h.isVisiting ? (
                        <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800">
                          Visitante
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 text-slate-700">
                          Local
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {h.hospitalityName ? (
                        <span className="font-medium text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {h.hospitalityName}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT WEEK TALK */}
      {editingWeek && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Configurar Discurso y Hospitalidad
                </h3>
                <p className="text-xs text-slate-500">
                  Semana del {editingWeek.weekStartDate} • Fin de semana: {editingWeek.weekend.date}
                </p>
              </div>
              <button
                onClick={() => setEditingWeek(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm overflow-y-auto flex-1 pr-1">
              {/* Outline Number & Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Bosquejo Oficial (1-194)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="194"
                    value={editingWeek.weekend.publicTalkOutlineNumber || ''}
                    onChange={(e) => {
                      const num = parseInt(e.target.value, 10);
                      const found = findOutlineByNumber(num);
                      setEditingWeek({
                        ...editingWeek,
                        weekend: {
                          ...editingWeek.weekend,
                          publicTalkOutlineNumber: isNaN(num) ? undefined : num,
                          publicTalkTheme: found ? found.title : editingWeek.weekend.publicTalkTheme,
                        },
                      });
                    }}
                    placeholder="Núm (ej: 23)"
                    className="w-24 px-3 py-2 border border-slate-300 rounded-xl text-center font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                  <input
                    type="text"
                    value={editingWeek.weekend.publicTalkTheme || ''}
                    onChange={(e) =>
                      setEditingWeek({
                        ...editingWeek,
                        weekend: {
                          ...editingWeek.weekend,
                          publicTalkTheme: e.target.value,
                        },
                      })
                    }
                    placeholder="Título del discurso..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Speaker Type Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tipo de Orador
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingWeek({
                        ...editingWeek,
                        weekend: {
                          ...editingWeek.weekend,
                          isVisitingSpeaker: false,
                          publicTalkSpeaker: localSpeakerPublishers[0]?.id || '',
                        },
                      })
                    }
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-colors border ${
                      !editingWeek.weekend.isVisitingSpeaker
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Orador Local (Congregación)
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingWeek({
                        ...editingWeek,
                        weekend: {
                          ...editingWeek.weekend,
                          isVisitingSpeaker: true,
                          publicTalkSpeaker: '',
                        },
                      })
                    }
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-colors border ${
                      editingWeek.weekend.isVisitingSpeaker
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Orador Visitante (Invitado)
                  </button>
                </div>
              </div>

              {/* Speaker selection */}
              {!editingWeek.weekend.isVisitingSpeaker ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Hermano Local
                  </label>
                  <select
                    value={editingWeek.weekend.publicTalkSpeaker || ''}
                    onChange={(e) =>
                      setEditingWeek({
                        ...editingWeek,
                        weekend: {
                          ...editingWeek.weekend,
                          publicTalkSpeaker: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  >
                    <option value="">-- Seleccionar hermano local --</option>
                    {localSpeakerPublishers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.notes ? `(${p.notes.split('.')[0]})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200">
                  <div>
                    <label className="block text-xs font-bold text-emerald-900 mb-1">
                      Nombre del Orador Visitante
                    </label>
                    <input
                      type="text"
                      value={editingWeek.weekend.publicTalkSpeaker || ''}
                      onChange={(e) =>
                        setEditingWeek({
                          ...editingWeek,
                          weekend: {
                            ...editingWeek.weekend,
                            publicTalkSpeaker: e.target.value,
                          },
                        })
                      }
                      placeholder="Ej: Marcelo Vega"
                      className="w-full px-3 py-2 border border-emerald-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-emerald-900 mb-1">
                        Congregación
                      </label>
                      <input
                        type="text"
                        value={editingWeek.weekend.visitingSpeakerCongregation || ''}
                        onChange={(e) =>
                          setEditingWeek({
                            ...editingWeek,
                            weekend: {
                              ...editingWeek.weekend,
                              visitingSpeakerCongregation: e.target.value,
                            },
                          })
                        }
                        placeholder="Ej: Las Acacias"
                        className="w-full px-3 py-2 border border-emerald-300 rounded-xl bg-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-emerald-900 mb-1">
                        Teléfono / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={editingWeek.weekend.visitingSpeakerPhone || ''}
                        onChange={(e) =>
                          setEditingWeek({
                            ...editingWeek,
                            weekend: {
                              ...editingWeek.weekend,
                              visitingSpeakerPhone: e.target.value,
                            },
                          })
                        }
                        placeholder="+34 600 000 000"
                        className="w-full px-3 py-2 border border-emerald-300 rounded-xl bg-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Hospitality Brother */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-amber-600" />
                  <span>Hermano Asignado para la Hospitalidad / Comida</span>
                </label>
                <select
                  value={editingWeek.weekend.hospitalityPublisherId || ''}
                  onChange={(e) =>
                    setEditingWeek({
                      ...editingWeek,
                      weekend: {
                        ...editingWeek.weekend,
                        hospitalityPublisherId: e.target.value || undefined,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                >
                  <option value="">-- Sin hospitalidad asignada --</option>
                  {hospitalityHosts.filter(h => h.active).length > 0 && (
                    <optgroup label="⭐ Anfitriones Registrados de Hospitalidad">
                      {hospitalityHosts
                        .filter(h => h.active)
                        .map(h => {
                          const pub = publishersMap.get(h.publisherId);
                          if (!pub) return null;
                          return (
                            <option key={`host-${h.id}`} value={h.publisherId}>
                              ⭐ {pub.name} (Capacidad: {h.capacity} pers.){h.dietaryNotes ? ` [${h.dietaryNotes}]` : ''}
                            </option>
                          );
                        })}
                    </optgroup>
                  )}
                  <optgroup label="Todos los Publicadores">
                    {hospitalityPublishers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-2xs text-slate-400 mt-1">
                  Se generará un mensaje de WhatsApp para recordarle los detalles de la comida.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingWeek(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveWeekTalk}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD/EDIT OUTGOING SPEAKER */}
      {isOutgoingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveOutgoing}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600 shrink-0" />
                <span>
                  {editingOutgoingItem
                    ? 'Editar Salida de Discurso'
                    : 'Registrar Discurso en Otra Congregación'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsOutgoingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Hermano Local que Sale
                </label>
                <select
                  required
                  value={outgoingForm.publisherId}
                  onChange={(e) => setOutgoingForm({ ...outgoingForm, publisherId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                >
                  <option value="">-- Seleccionar hermano --</option>
                  {localSpeakerPublishers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Fecha de la Reunión
                </label>
                <input
                  type="date"
                  required
                  value={outgoingForm.date}
                  onChange={(e) => setOutgoingForm({ ...outgoingForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Congregación Destino
                </label>
                <input
                  type="text"
                  required
                  value={outgoingForm.destinationCongregation}
                  onChange={(e) =>
                    setOutgoingForm({ ...outgoingForm, destinationCongregation: e.target.value })
                  }
                  placeholder="Ej: Congregación Las Palmeras"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Bosquejo que Presentará (1-194)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="194"
                    required
                    value={outgoingForm.outlineNumber}
                    onChange={(e) => {
                      const num = parseInt(e.target.value, 10);
                      const found = findOutlineByNumber(num);
                      setOutgoingForm({
                        ...outgoingForm,
                        outlineNumber: num,
                        outlineTitle: found ? found.title : outgoingForm.outlineTitle,
                      });
                    }}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-xl text-center font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                  <input
                    type="text"
                    required
                    value={outgoingForm.outlineTitle}
                    onChange={(e) => setOutgoingForm({ ...outgoingForm, outlineTitle: e.target.value })}
                    placeholder="Título del tema..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Notas Adicionales
                </label>
                <input
                  type="text"
                  value={outgoingForm.notes}
                  onChange={(e) => setOutgoingForm({ ...outgoingForm, notes: e.target.value })}
                  placeholder="Horario, persona de contacto, etc."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOutgoingModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs"
              >
                Guardar Salida
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: PREPARED OUTLINES FOR BROTHERS */}
      {selectedOutlineForBrothers && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  Bosquejo #{selectedOutlineForBrothers.number}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  {selectedOutlineForBrothers.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOutlineForBrothers(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Marque qué hermanos de la congregación tienen preparado y listo para presentar este
              bosquejo público:
            </p>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {localSpeakerPublishers.map((pub) => {
                const isPrepared = pub.preparedOutlines?.includes(selectedOutlineForBrothers.number);

                return (
                  <label
                    key={pub.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isPrepared
                        ? 'bg-indigo-50/70 border-indigo-300'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <SplashCheckbox
                        size="sm"
                        checked={Boolean(isPrepared)}
                        onChange={() =>
                          handleToggleOutlinePrepared(pub.id, selectedOutlineForBrothers.number)
                        }
                      />
                      <div>
                        <span className="font-semibold text-slate-900 text-xs">{pub.name}</span>
                        {pub.notes && (
                          <span className="text-slate-400 text-2xs block">
                            {pub.notes.split('.')[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    {isPrepared && (
                      <span className="text-2xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                        Preparado
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedOutlineForBrothers(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
