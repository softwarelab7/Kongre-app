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
  NeighboringCongregation,
  VisitingSpeakerDirectoryEntry,
  HospitalityMealType,
} from '../types';
import {
  getMergedNeighboringCongregations,
  getMergedVisitingSpeakersDirectory,
  evaluateOutlineRepetition,
  detectOutgoingSpeakerConflicts,
  suggestBestHospitalityHosts,
  buildWhatsAppVisitingSpeakerInvite,
  buildWhatsAppHostFamilyReminder,
  buildWhatsAppCoordinatorExchangeMessage,
  buildWhatsAppOutgoingSpeakerSlip,
  MEAL_TYPE_LABELS,
} from '../utils/khsSpeakerExchangeEngine';
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
  MessageCircle,
  Copy,
  Clock,
  Sparkles,
  Users,
  MapPin,
  ShieldAlert,
  ArrowRightLeft,
  Check,
  X,
} from 'lucide-react';
import { SplashCheckbox } from './SplashCheckbox';

export const DiscursosPublicosTab: React.FC = () => {
  const {
    weeks,
    updateWeek,
    publishers,
    publishersMap,
    updatePublisher,
    outgoingSpeakers,
    addOutgoingSpeaker,
    updateOutgoingSpeaker,
    deleteOutgoingSpeaker,
    hospitalityHosts,
    cartShifts,
    fieldServiceMeetings,
    settings,
    updateSettings,
  } = useCongregation();

  const [activeSubTab, setActiveSubTab] = useState<
    'programa' | 'directorio_khs' | 'salientes' | 'catalogo' | 'historial'
  >('programa');

  // Directory sub-view: 'ambos' | 'congregaciones' | 'oradores'
  const [directoryView, setDirectoryView] = useState<'ambos' | 'congregaciones' | 'oradores'>('ambos');
  const [directorySearch, setDirectorySearch] = useState('');
  const [selectedCongFilter, setSelectedCongFilter] = useState<string>('todas');

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
    destinationCongregationId: '',
    destinationMeetingTime: '',
    destinationAddress: '',
    destinationCoordinatorName: '',
    destinationCoordinatorPhone: '',
    outlineNumber: 1,
    outlineTitle: OFFICIAL_PUBLIC_TALK_OUTLINES[0]?.title || '',
    status: 'confirmado' as 'pendiente' | 'confirmado',
    notes: '',
  });

  // Modal for Neighboring Congregation CRUD
  const [isCongModalOpen, setIsCongModalOpen] = useState(false);
  const [editingCong, setEditingCong] = useState<NeighboringCongregation | null>(null);
  const [congForm, setCongForm] = useState({
    name: '',
    congregationNumber: '',
    circuit: settings.circuitNumber || '',
    city: settings.city || '',
    address: '',
    weekendMeetingDay: 'Domingo',
    weekendMeetingTime: '10:00',
    talkCoordinatorName: '',
    talkCoordinatorPhone: '',
    distanceKm: '',
    notes: '',
    active: true,
  });

  // Modal for Visiting Speaker CRUD
  const [isVisitingModalOpen, setIsVisitingModalOpen] = useState(false);
  const [editingVisitingSpeaker, setEditingVisitingSpeaker] =
    useState<VisitingSpeakerDirectoryEntry | null>(null);
  const [visitingForm, setVisitingForm] = useState({
    name: '',
    phone: '',
    privilege: 'anciano' as 'anciano' | 'siervo_ministerial',
    congregationId: '',
    congregationName: '',
    preparedOutlines: [] as number[],
    companionsDefault: 0,
    spouseName: '',
    dietaryNotes: '',
    needsTransportation: false,
    notes: '',
    active: true,
  });
  const [outlinePickerSearch, setOutlinePickerSearch] = useState('');

  // Quick Schedule Modal: Schedule a Visiting Speaker directly onto a Week
  const [quickScheduleSpeaker, setQuickScheduleSpeaker] =
    useState<VisitingSpeakerDirectoryEntry | null>(null);
  const [quickScheduleWeekId, setQuickScheduleWeekId] = useState<string>('');
  const [quickScheduleOutlineNum, setQuickScheduleOutlineNum] = useState<number>(1);
  const [quickScheduleHostId, setQuickScheduleHostId] = useState<string>('');
  const [quickScheduleMealType, setQuickScheduleMealType] =
    useState<HospitalityMealType>('almuerzo');

  // Modal for managing prepared outlines for a local brother
  const [selectedOutlineForBrothers, setSelectedOutlineForBrothers] =
    useState<PublicTalkOutline | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Merged Directories (combines saved settings + auto-discovered entries from weeks/outgoing)
  const neighboringCongregations = useMemo(
    () => getMergedNeighboringCongregations(settings, weeks, outgoingSpeakers),
    [settings, weeks, outgoingSpeakers]
  );

  const visitingSpeakersDirectory = useMemo(
    () => getMergedVisitingSpeakersDirectory(settings, weeks, publishersMap),
    [settings, weeks, publishersMap]
  );

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
      mealType?: HospitalityMealType;
    }[] = [];

    weeks.forEach((w) => {
      if (
        w.weekend.publicTalkOutlineNumber ||
        w.weekend.publicTalkSpeaker ||
        w.weekend.publicTalkTheme
      ) {
        const isVisiting = w.weekend.isVisitingSpeaker;
        let speakerName = w.weekend.publicTalkSpeaker || 'Sin asignar';
        if (
          !isVisiting &&
          w.weekend.publicTalkSpeaker &&
          publishersMap.has(w.weekend.publicTalkSpeaker)
        ) {
          speakerName = publishersMap.get(w.weekend.publicTalkSpeaker)!.name;
        }
        let hospitalityName = '';
        if (
          w.weekend.hospitalityPublisherId &&
          publishersMap.has(w.weekend.hospitalityPublisherId)
        ) {
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
          mealType: w.weekend.hospitalityMealType,
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

  // Local brothers eligible for public talks
  const localSpeakerPublishers = useMemo(() => {
    return publishers.filter(
      (p) =>
        p.active &&
        (p.gender === 'hermano' || p.gender === 'male') &&
        (p.roles.vym_vida_partes ||
          p.roles.fds_presidente ||
          p.privilege === 'anciano' ||
          p.privilege === 'siervo_ministerial')
    );
  }, [publishers]);

  // Brothers eligible for hospitality
  const hospitalityPublishers = useMemo(() => {
    return publishers.filter((p) => p.active);
  }, [publishers]);

  // Filtered Neighboring Congregations & Visiting Speakers
  const filteredNeighboringCongs = useMemo(() => {
    const q = directorySearch.trim().toLowerCase();
    return neighboringCongregations.filter((c) => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.talkCoordinatorName || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q) ||
        (c.circuit || '').toLowerCase().includes(q)
      );
    });
  }, [neighboringCongregations, directorySearch]);

  const filteredVisitingSpeakers = useMemo(() => {
    const q = directorySearch.trim().toLowerCase();
    return visitingSpeakersDirectory.filter((s) => {
      if (
        selectedCongFilter !== 'todas' &&
        s.congregationName.toLowerCase() !== selectedCongFilter.toLowerCase()
      ) {
        return false;
      }
      if (!q) return true;
      const matchesOutline = s.preparedOutlines.some((num) => String(num) === q);
      return (
        s.name.toLowerCase().includes(q) ||
        s.congregationName.toLowerCase().includes(q) ||
        (s.phone || '').includes(q) ||
        (s.dietaryNotes || '').toLowerCase().includes(q) ||
        matchesOutline
      );
    });
  }, [visitingSpeakersDirectory, directorySearch, selectedCongFilter]);

  // Live conflicts for the Outgoing Speaker modal
  const liveOutgoingModalConflicts = useMemo(() => {
    if (!isOutgoingModalOpen || !outgoingForm.publisherId || !outgoingForm.date) return [];
    return detectOutgoingSpeakerConflicts(
      outgoingForm.publisherId,
      outgoingForm.date,
      weeks,
      publishersMap,
      outgoingSpeakers,
      cartShifts,
      fieldServiceMeetings,
      editingOutgoingItem?.id
    );
  }, [
    isOutgoingModalOpen,
    outgoingForm.publisherId,
    outgoingForm.date,
    weeks,
    publishersMap,
    outgoingSpeakers,
    cartShifts,
    fieldServiceMeetings,
    editingOutgoingItem,
  ]);

  // Ranked hospitality hosts for the week currently being edited
  const editingWeekHostSuggestions = useMemo(() => {
    if (!editingWeek) return [];
    const guests = 1 + (editingWeek.weekend.visitingSpeakerCompanions || 0);
    return suggestBestHospitalityHosts(
      editingWeek,
      weeks,
      hospitalityHosts,
      publishersMap,
      guests,
      editingWeek.weekend.visitingSpeakerDietaryNotes
    );
  }, [editingWeek, weeks, hospitalityHosts, publishersMap]);

  // Outline repetition evaluation for the week currently being edited
  const editingWeekOutlineEval = useMemo(() => {
    if (!editingWeek || !editingWeek.weekend.publicTalkOutlineNumber) return null;
    return evaluateOutlineRepetition(
      editingWeek.weekend.publicTalkOutlineNumber,
      editingWeek.id,
      editingWeek.weekend.date || editingWeek.weekEndDate,
      weeks,
      publishersMap,
      settings.conflictRules?.warnOutlineRepeatedWithinMonths || 12
    );
  }, [editingWeek, weeks, publishersMap, settings.conflictRules]);

  // ==========================================
  // HANDLERS: WEEKEND TALK & 1-CLICK HOSPITALITY
  // ==========================================
  const handleOpenEditTalk = (week: WeekSchedule) => {
    setEditingWeek(JSON.parse(JSON.stringify(week)));
  };

  const handleSaveWeekTalk = () => {
    if (!editingWeek) return;
    updateWeek(editingWeek);

    // Si es un orador visitante nuevo o actualizado, sincronizarlo con el Directorio
    const wk = editingWeek.weekend;
    if (wk.isVisitingSpeaker && wk.publicTalkSpeaker?.trim()) {
      const nameClean = wk.publicTalkSpeaker.trim();
      const currentDir = [...visitingSpeakersDirectory];
      const idx = currentDir.findIndex(
        (s) => s.name.toLowerCase() === nameClean.toLowerCase()
      );
      if (idx >= 0) {
        const existing = { ...currentDir[idx] };
        if (
          wk.publicTalkOutlineNumber &&
          !existing.preparedOutlines.includes(wk.publicTalkOutlineNumber)
        ) {
          existing.preparedOutlines = [
            ...existing.preparedOutlines,
            wk.publicTalkOutlineNumber,
          ].sort((a, b) => a - b);
        }
        if (wk.visitingSpeakerPhone) existing.phone = wk.visitingSpeakerPhone;
        if (wk.visitingSpeakerCongregation)
          existing.congregationName = wk.visitingSpeakerCongregation;
        if (wk.visitingSpeakerCompanions !== undefined)
          existing.companionsDefault = wk.visitingSpeakerCompanions;
        if (wk.visitingSpeakerDietaryNotes)
          existing.dietaryNotes = wk.visitingSpeakerDietaryNotes;
        existing.lastVisitDate = wk.date;
        currentDir[idx] = existing;
      } else {
        currentDir.push({
          id: wk.visitingSpeakerId || `vs-${Date.now()}`,
          name: nameClean,
          phone: wk.visitingSpeakerPhone || '',
          privilege: 'anciano',
          congregationName: wk.visitingSpeakerCongregation || 'Congregación Vecina',
          preparedOutlines: wk.publicTalkOutlineNumber ? [wk.publicTalkOutlineNumber] : [],
          companionsDefault: wk.visitingSpeakerCompanions ?? 0,
          dietaryNotes: wk.visitingSpeakerDietaryNotes || '',
          lastVisitDate: wk.date,
          active: true,
        });
      }
      updateSettings({ visitingSpeakersDirectory: currentDir });
    }

    setEditingWeek(null);
    triggerToast('Discurso y hospitalidad actualizados correctamente.');
  };

  // 1-Click Auto-Assign Best Hospitality Host directly on a Week Card
  const handleOneClickAssignHospitality = (week: WeekSchedule) => {
    const guests = 1 + (week.weekend.visitingSpeakerCompanions || 0);
    const ranked = suggestBestHospitalityHosts(
      week,
      weeks,
      hospitalityHosts,
      publishersMap,
      guests,
      week.weekend.visitingSpeakerDietaryNotes
    );
    const best = ranked.find((r) => r.isAvailable && r.meetsCapacity) || ranked[0];
    if (!best) {
      triggerToast('Registra primero familias anfitrionas en la pestaña Hospitalidad.');
      return;
    }

    const updated: WeekSchedule = {
      ...week,
      weekend: {
        ...week.weekend,
        hospitalityPublisherId: best.host.publisherId,
        hospitalityMealType: week.weekend.hospitalityMealType || 'almuerzo',
        hospitalityStatus: 'pendiente',
      },
    };
    updateWeek(updated);
    triggerToast(`Hospitalidad asignada en 1 clic a: ${best.publisher.name}`);
  };

  // Toggle Speaker Confirmed status directly on a Week Card
  const handleToggleSpeakerConfirmed = (week: WeekSchedule) => {
    const updated: WeekSchedule = {
      ...week,
      weekend: {
        ...week.weekend,
        speakerConfirmed: !week.weekend.speakerConfirmed,
      },
    };
    updateWeek(updated);
  };

  // Toggle Hospitality Confirmed status directly on a Week Card
  const handleToggleHospitalityStatus = (week: WeekSchedule) => {
    const nextStatus =
      week.weekend.hospitalityStatus === 'confirmada' ? 'pendiente' : 'confirmada';
    const updated: WeekSchedule = {
      ...week,
      weekend: {
        ...week.weekend,
        hospitalityStatus: nextStatus,
      },
    };
    updateWeek(updated);
  };

  // ==========================================
  // WHATSAPP 1-CLICK SLIPS
  // ==========================================
  const handleSendWhatsAppSpeaker = (week: WeekSchedule) => {
    const { phoneClean, message } = buildWhatsAppVisitingSpeakerInvite(
      week,
      settings,
      publishersMap,
      hospitalityHosts
    );
    const url = phoneClean
      ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSendWhatsAppHospitality = (week: WeekSchedule) => {
    const res = buildWhatsAppHostFamilyReminder(
      week,
      settings,
      publishersMap,
      hospitalityHosts
    );
    if (!res) return;
    const url = res.phoneClean
      ? `https://wa.me/${res.phoneClean}?text=${encodeURIComponent(res.message)}`
      : `https://wa.me/?text=${encodeURIComponent(res.message)}`;
    window.open(url, '_blank');
  };

  const handleSendWhatsAppCoordinator = (
    cong: NeighboringCongregation,
    week?: WeekSchedule
  ) => {
    const { phoneClean, message } = buildWhatsAppCoordinatorExchangeMessage(
      cong,
      settings,
      week
    );
    const url = phoneClean
      ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSendWhatsAppOutgoingSlip = (item: OutgoingSpeakerAssignment) => {
    const speaker = publishersMap.get(item.publisherId);
    const cong = neighboringCongregations.find(
      (c) =>
        c.id === item.destinationCongregationId ||
        c.name.toLowerCase() === item.destinationCongregation.toLowerCase()
    );
    const { phoneClean, message } = buildWhatsAppOutgoingSpeakerSlip(
      item,
      speaker,
      cong,
      settings
    );
    const url = phoneClean
      ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // ==========================================
  // HANDLERS: NEIGHBORING CONGREGATIONS CRUD
  // ==========================================
  const handleOpenAddCong = () => {
    setEditingCong(null);
    setCongForm({
      name: '',
      congregationNumber: '',
      circuit: settings.circuitNumber || '',
      city: settings.city || '',
      address: '',
      weekendMeetingDay: 'Domingo',
      weekendMeetingTime: '10:00',
      talkCoordinatorName: '',
      talkCoordinatorPhone: '',
      distanceKm: '',
      notes: '',
      active: true,
    });
    setIsCongModalOpen(true);
  };

  const handleOpenEditCong = (cong: NeighboringCongregation) => {
    setEditingCong(cong);
    setCongForm({
      name: cong.name,
      congregationNumber: cong.congregationNumber || '',
      circuit: cong.circuit || '',
      city: cong.city || '',
      address: cong.address || '',
      weekendMeetingDay: cong.weekendMeetingDay || 'Domingo',
      weekendMeetingTime: cong.weekendMeetingTime || '10:00',
      talkCoordinatorName: cong.talkCoordinatorName || '',
      talkCoordinatorPhone: cong.talkCoordinatorPhone || '',
      distanceKm: cong.distanceKm !== undefined ? String(cong.distanceKm) : '',
      notes: cong.notes || '',
      active: cong.active,
    });
    setIsCongModalOpen(true);
  };

  const handleSaveCong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!congForm.name.trim()) return;

    const currentList = [...neighboringCongregations];
    const distNum = congForm.distanceKm ? parseFloat(congForm.distanceKm) : undefined;

    if (editingCong) {
      const updated = currentList.map((c) =>
        c.id === editingCong.id
          ? {
              ...editingCong,
              name: congForm.name.trim(),
              congregationNumber: congForm.congregationNumber.trim() || undefined,
              circuit: congForm.circuit.trim() || undefined,
              city: congForm.city.trim() || undefined,
              address: congForm.address.trim() || undefined,
              weekendMeetingDay: congForm.weekendMeetingDay,
              weekendMeetingTime: congForm.weekendMeetingTime,
              talkCoordinatorName: congForm.talkCoordinatorName.trim() || undefined,
              talkCoordinatorPhone: congForm.talkCoordinatorPhone.trim() || undefined,
              distanceKm: isNaN(distNum as number) ? undefined : distNum,
              notes: congForm.notes.trim() || undefined,
              active: congForm.active,
            }
          : c
      );
      updateSettings({ neighboringCongregations: updated });
      triggerToast(`Congregación "${congForm.name.trim()}" actualizada.`);
    } else {
      const newCong: NeighboringCongregation = {
        id: `ncong-${Date.now()}`,
        name: congForm.name.trim(),
        congregationNumber: congForm.congregationNumber.trim() || undefined,
        circuit: congForm.circuit.trim() || undefined,
        city: congForm.city.trim() || undefined,
        address: congForm.address.trim() || undefined,
        weekendMeetingDay: congForm.weekendMeetingDay,
        weekendMeetingTime: congForm.weekendMeetingTime,
        talkCoordinatorName: congForm.talkCoordinatorName.trim() || undefined,
        talkCoordinatorPhone: congForm.talkCoordinatorPhone.trim() || undefined,
        distanceKm: isNaN(distNum as number) ? undefined : distNum,
        notes: congForm.notes.trim() || undefined,
        active: congForm.active,
      };
      updateSettings({ neighboringCongregations: [...currentList, newCong] });
      triggerToast(`Congregación "${newCong.name}" agregada al directorio.`);
    }

    setIsCongModalOpen(false);
    setEditingCong(null);
  };

  const handleDeleteCong = (id: string) => {
    const updated = neighboringCongregations.filter((c) => c.id !== id);
    updateSettings({ neighboringCongregations: updated });
    triggerToast('Congregación vecina eliminada del directorio.');
  };

  // ==========================================
  // HANDLERS: VISITING SPEAKERS DIRECTORY CRUD
  // ==========================================
  const handleOpenAddVisitingSpeaker = (presetCong?: NeighboringCongregation) => {
    setEditingVisitingSpeaker(null);
    setVisitingForm({
      name: '',
      phone: '',
      privilege: 'anciano',
      congregationId: presetCong?.id || neighboringCongregations[0]?.id || '',
      congregationName: presetCong?.name || neighboringCongregations[0]?.name || '',
      preparedOutlines: [],
      companionsDefault: 1,
      spouseName: '',
      dietaryNotes: '',
      needsTransportation: false,
      notes: '',
      active: true,
    });
    setOutlinePickerSearch('');
    setIsVisitingModalOpen(true);
  };

  const handleOpenEditVisitingSpeaker = (sp: VisitingSpeakerDirectoryEntry) => {
    setEditingVisitingSpeaker(sp);
    setVisitingForm({
      name: sp.name,
      phone: sp.phone || '',
      privilege: sp.privilege || 'anciano',
      congregationId: sp.congregationId || '',
      congregationName: sp.congregationName || '',
      preparedOutlines: [...(sp.preparedOutlines || [])],
      companionsDefault: sp.companionsDefault ?? 0,
      spouseName: sp.spouseName || '',
      dietaryNotes: sp.dietaryNotes || '',
      needsTransportation: Boolean(sp.needsTransportation),
      notes: sp.notes || '',
      active: sp.active,
    });
    setOutlinePickerSearch('');
    setIsVisitingModalOpen(true);
  };

  const handleSaveVisitingSpeaker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitingForm.name.trim() || !visitingForm.congregationName.trim()) return;

    const currentDir = [...visitingSpeakersDirectory];
    if (editingVisitingSpeaker) {
      const updated = currentDir.map((s) =>
        s.id === editingVisitingSpeaker.id
          ? {
              ...editingVisitingSpeaker,
              name: visitingForm.name.trim(),
              phone: visitingForm.phone.trim() || undefined,
              privilege: visitingForm.privilege,
              congregationId: visitingForm.congregationId || undefined,
              congregationName: visitingForm.congregationName.trim(),
              preparedOutlines: [...visitingForm.preparedOutlines].sort((a, b) => a - b),
              companionsDefault: visitingForm.companionsDefault,
              spouseName: visitingForm.spouseName.trim() || undefined,
              dietaryNotes: visitingForm.dietaryNotes.trim() || undefined,
              needsTransportation: visitingForm.needsTransportation,
              notes: visitingForm.notes.trim() || undefined,
              active: visitingForm.active,
            }
          : s
      );
      updateSettings({ visitingSpeakersDirectory: updated });
      triggerToast(`Orador visitante "${visitingForm.name.trim()}" actualizado.`);
    } else {
      const newSpeaker: VisitingSpeakerDirectoryEntry = {
        id: `vs-${Date.now()}`,
        name: visitingForm.name.trim(),
        phone: visitingForm.phone.trim() || undefined,
        privilege: visitingForm.privilege,
        congregationId: visitingForm.congregationId || undefined,
        congregationName: visitingForm.congregationName.trim(),
        preparedOutlines: [...visitingForm.preparedOutlines].sort((a, b) => a - b),
        companionsDefault: visitingForm.companionsDefault,
        spouseName: visitingForm.spouseName.trim() || undefined,
        dietaryNotes: visitingForm.dietaryNotes.trim() || undefined,
        needsTransportation: visitingForm.needsTransportation,
        notes: visitingForm.notes.trim() || undefined,
        active: visitingForm.active,
      };
      updateSettings({ visitingSpeakersDirectory: [...currentDir, newSpeaker] });
      triggerToast(`Orador visitante "${newSpeaker.name}" agregado al directorio.`);
    }

    setIsVisitingModalOpen(false);
    setEditingVisitingSpeaker(null);
  };

  const handleDeleteVisitingSpeaker = (id: string) => {
    const updated = visitingSpeakersDirectory.filter((s) => s.id !== id);
    updateSettings({ visitingSpeakersDirectory: updated });
    triggerToast('Orador visitante eliminado del directorio.');
  };

  // Quick 1-Click Schedule Visiting Speaker onto a Week
  const handleOpenQuickSchedule = (speaker: VisitingSpeakerDirectoryEntry) => {
    // Pick first week without speaker or first week
    const targetWeek =
      weeks.find((w) => !w.weekend.publicTalkSpeaker) || weeks[0];
    const defaultOutline = speaker.preparedOutlines[0] || 1;
    setQuickScheduleSpeaker(speaker);
    setQuickScheduleWeekId(targetWeek?.id || '');
    setQuickScheduleOutlineNum(defaultOutline);
    setQuickScheduleMealType('almuerzo');

    if (targetWeek) {
      const guests = 1 + (speaker.companionsDefault || 0);
      const ranked = suggestBestHospitalityHosts(
        targetWeek,
        weeks,
        hospitalityHosts,
        publishersMap,
        guests,
        speaker.dietaryNotes
      );
      const best = ranked.find((r) => r.isAvailable && r.meetsCapacity) || ranked[0];
      setQuickScheduleHostId(best?.host.publisherId || '');
    } else {
      setQuickScheduleHostId('');
    }
  };

  const handleConfirmQuickSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickScheduleSpeaker || !quickScheduleWeekId) return;
    const targetWeek = weeks.find((w) => w.id === quickScheduleWeekId);
    if (!targetWeek) return;

    const outlineObj = findOutlineByNumber(quickScheduleOutlineNum);
    const updatedWeek: WeekSchedule = {
      ...targetWeek,
      weekend: {
        ...targetWeek.weekend,
        isVisitingSpeaker: true,
        visitingSpeakerId: quickScheduleSpeaker.id,
        publicTalkSpeaker: quickScheduleSpeaker.name,
        visitingSpeakerCongregation: quickScheduleSpeaker.congregationName,
        visitingSpeakerPhone: quickScheduleSpeaker.phone,
        visitingSpeakerCompanions: quickScheduleSpeaker.companionsDefault ?? 0,
        visitingSpeakerDietaryNotes: quickScheduleSpeaker.dietaryNotes,
        publicTalkOutlineNumber: quickScheduleOutlineNum,
        publicTalkTheme: outlineObj?.title || targetWeek.weekend.publicTalkTheme,
        hospitalityPublisherId: quickScheduleHostId || undefined,
        hospitalityMealType: quickScheduleMealType,
        hospitalityStatus: quickScheduleHostId ? 'pendiente' : undefined,
        speakerConfirmed: true,
      },
    };

    updateWeek(updatedWeek);
    setQuickScheduleSpeaker(null);
    setActiveSubTab('programa');
    triggerToast(
      `Visita de ${quickScheduleSpeaker.name} programada para el ${targetWeek.weekend.date}.`
    );
  };

  // ==========================================
  // HANDLERS: OUTGOING SPEAKER
  // ==========================================
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
        destinationCongregationId: outgoingForm.destinationCongregationId || undefined,
        destinationMeetingTime: outgoingForm.destinationMeetingTime || undefined,
        destinationAddress: outgoingForm.destinationAddress || undefined,
        destinationCoordinatorName: outgoingForm.destinationCoordinatorName || undefined,
        destinationCoordinatorPhone: outgoingForm.destinationCoordinatorPhone || undefined,
        outlineNumber: outgoingForm.outlineNumber,
        outlineTitle: title,
        status: outgoingForm.status,
        notes: outgoingForm.notes,
      });
    } else {
      addOutgoingSpeaker({
        publisherId: outgoingForm.publisherId,
        date: outgoingForm.date,
        destinationCongregation: outgoingForm.destinationCongregation,
        destinationCongregationId: outgoingForm.destinationCongregationId || undefined,
        destinationMeetingTime: outgoingForm.destinationMeetingTime || undefined,
        destinationAddress: outgoingForm.destinationAddress || undefined,
        destinationCoordinatorName: outgoingForm.destinationCoordinatorName || undefined,
        destinationCoordinatorPhone: outgoingForm.destinationCoordinatorPhone || undefined,
        outlineNumber: outgoingForm.outlineNumber,
        outlineTitle: title,
        status: outgoingForm.status,
        notes: outgoingForm.notes,
      });
    }

    setIsOutgoingModalOpen(false);
    setEditingOutgoingItem(null);
    triggerToast('Salida de orador registrada con protección anti-choques.');
  };

  const handleOpenAddOutgoing = () => {
    setEditingOutgoingItem(null);
    const firstPub = localSpeakerPublishers[0];
    const firstOutlineNum = firstPub?.preparedOutlines?.[0] || 1;
    const firstOutline = findOutlineByNumber(firstOutlineNum);
    const firstCong = neighboringCongregations[0];

    setOutgoingForm({
      publisherId: firstPub?.id || '',
      date: weeks[0]?.weekend.date || new Date().toISOString().split('T')[0],
      destinationCongregation: firstCong?.name || '',
      destinationCongregationId: firstCong?.id || '',
      destinationMeetingTime: firstCong?.weekendMeetingTime || '',
      destinationAddress: firstCong?.address || '',
      destinationCoordinatorName: firstCong?.talkCoordinatorName || '',
      destinationCoordinatorPhone: firstCong?.talkCoordinatorPhone || '',
      outlineNumber: firstOutlineNum,
      outlineTitle: firstOutline?.title || OFFICIAL_PUBLIC_TALK_OUTLINES[0]?.title || '',
      status: 'confirmado',
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
      destinationCongregationId: item.destinationCongregationId || '',
      destinationMeetingTime: item.destinationMeetingTime || '',
      destinationAddress: item.destinationAddress || '',
      destinationCoordinatorName: item.destinationCoordinatorName || '',
      destinationCoordinatorPhone: item.destinationCoordinatorPhone || '',
      outlineNumber: item.outlineNumber,
      outlineTitle: item.outlineTitle,
      status: item.status || 'confirmado',
      notes: item.notes || '',
    });
    setIsOutgoingModalOpen(true);
  };

  // Outlines prepared toggle for local brother
  const handleToggleOutlinePrepared = (pubId: string, outlineNum: number) => {
    const pub = publishersMap.get(pubId);
    if (!pub) return;
    const current = pub.preparedOutlines || [];
    const exists = current.includes(outlineNum);
    const updated = exists
      ? current.filter((n) => n !== outlineNum)
      : [...current, outlineNum].sort((a, b) => a - b);

    updatePublisher({
      ...pub,
      preparedOutlines: updated,
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-white/10 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Barra de Acciones y Navegación de Discursos Públicos */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Sub-tab Navigation Pills (Grid on mobile so nothing clips) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/90 dark:bg-slate-800/70 p-1 gap-1 w-full xl:w-auto">
            <button
              onClick={() => setActiveSubTab('programa')}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
                activeSubTab === 'programa'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Programa Semanal</span>
            </button>

            <button
              onClick={() => setActiveSubTab('directorio_khs')}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
                activeSubTab === 'directorio_khs'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Vecinas y Oradores</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 font-bold shrink-0">
                {visitingSpeakersDirectory.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('salientes')}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
                activeSubTab === 'salientes'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Salientes</span>
              {outgoingSpeakers.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 font-bold shrink-0">
                  {outgoingSpeakers.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('catalogo')}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
                activeSubTab === 'catalogo'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Bosquejos (1-194)</span>
            </button>

            <button
              onClick={() => setActiveSubTab('historial')}
              className={`col-span-2 sm:col-span-1 flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
                activeSubTab === 'historial'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Historial ({talkHistory.length})</span>
            </button>
          </div>

          {/* Action quick buttons */}
          <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full xl:w-auto shrink-0">
            <button
              onClick={() => handleOpenAddVisitingSpeaker()}
              className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 font-semibold text-xs transition-all active:scale-95 cursor-pointer truncate"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate">Orador</span>
            </button>
            <button
              onClick={handleOpenAddCong}
              className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 font-semibold text-xs transition-all active:scale-95 cursor-pointer truncate"
            >
              <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate">Cong. Vecina</span>
            </button>
            <button
              onClick={handleOpenAddOutgoing}
              className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer truncate"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Nueva Salida</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================
          SUBTAB 1: PROGRAMA FIN DE SEMANA Y HOSPITALIDAD 1-CLIC
      ========================================== */}
      {activeSubTab === 'programa' && (
        <div className="space-y-4">
          {/* Executive Summary Banner */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-3.5 shadow-2xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {weeks.filter((w) => Boolean(w.weekend.publicTalkSpeaker)).length} / {weeks.length}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Semanas con Orador
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-3.5 shadow-2xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {weeks.filter((w) => w.weekend.isVisitingSpeaker).length}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Oradores Visitantes
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-3.5 shadow-2xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {weeks.filter((w) => Boolean(w.weekend.hospitalityPublisherId)).length}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Hospitalidades Asignadas
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-3.5 shadow-2xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {outgoingSpeakers.length} salidas
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Intercambio con Vecinas
                </div>
              </div>
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
              const theme =
                w.publicTalkTheme ||
                (outlineNum ? findOutlineByNumber(outlineNum)?.title : 'Sin tema definido');

              // Check outline repetition
              const outlineEval = evaluateOutlineRepetition(
                outlineNum,
                week.id,
                w.date || week.weekEndDate,
                weeks,
                publishersMap,
                settings.conflictRules?.warnOutlineRepeatedWithinMonths || 12
              );

              // If local speaker is assigned, check if he has an outgoing talk clash that weekend
              const localSpeakerOutgoingClash =
                !isVisiting && w.publicTalkSpeaker && publishersMap.has(w.publicTalkSpeaker)
                  ? outgoingSpeakers.find(
                      (o) =>
                        o.publisherId === w.publicTalkSpeaker &&
                        o.date >= week.weekStartDate &&
                        o.date <= week.weekEndDate
                    )
                  : undefined;

              const hospitalityPub = w.hospitalityPublisherId
                ? publishersMap.get(w.hospitalityPublisherId)
                : null;
              const hostRecord = hospitalityHosts.find(
                (h) => h.publisherId === w.hospitalityPublisherId
              );

              // Find matching Neighboring Congregation if visiting
              const matchingNeighborCong = isVisiting && w.visitingSpeakerCongregation
                ? neighboringCongregations.find(
                    (c) =>
                      c.id === w.neighboringCongregationId ||
                      c.name.toLowerCase() === w.visitingSpeakerCongregation!.toLowerCase()
                  )
                : undefined;

              const companions = w.visitingSpeakerCompanions || 0;
              const totalGuests = 1 + companions;

              return (
                <div
                  key={week.id}
                  className={`bg-white dark:bg-[#131d2e] rounded-2xl border p-5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between ${
                    localSpeakerOutgoingClash
                      ? 'border-rose-300 ring-2 ring-rose-100 dark:border-rose-500/40'
                      : outlineEval?.isRepeatedRecently
                      ? 'border-amber-300 ring-2 ring-amber-100 dark:border-amber-500/40'
                      : 'border-slate-200 dark:border-white/[0.08]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                            {w.date}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {settings.weekendMeetingDay} {settings.weekendMeetingTime}
                          </span>
                          {w.publicTalkSpeaker && (
                            <button
                              type="button"
                              onClick={() => handleToggleSpeakerConfirmed(week)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                                w.speakerConfirmed
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                              }`}
                              title="Alternar estado de confirmación del orador"
                            >
                              {w.speakerConfirmed ? '✓ Orador Confirmado' : '⏳ Por Confirmar'}
                            </button>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">
                          Semana del {week.weekStartDate}
                        </h3>
                      </div>

                      <button
                        onClick={() => handleOpenEditTalk(week)}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                        title="Editar Discurso y Hospitalidad"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Outline Title */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300">
                          {outlineNum ? `Bosquejo #${outlineNum}` : 'Sin Bosquejo #'}
                        </span>
                        {isVisiting ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                            Orador Visitante
                          </span>
                        ) : (
                          w.publicTalkSpeaker && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              Orador Local
                            </span>
                          )
                        )}
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-2">
                        {theme || 'Tema no especificado'}
                      </p>

                      {/* Repeated outline alert */}
                      {outlineEval?.isRepeatedRecently && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-500/20">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            {outlineEval.lastDeliveredDate
                              ? `Ya presentado el ${outlineEval.lastDeliveredDate} por ${outlineEval.lastSpeakerName} (hace ${outlineEval.monthsSinceLast} meses)`
                              : `Programado también en la fecha ${outlineEval.otherScheduledDate}`}
                          </span>
                        </div>
                      )}

                      {/* Outgoing clash alert */}
                      {localSpeakerOutgoingClash && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/20">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>
                            ¡Choque! {speakerName} sale a discursar a "{localSpeakerOutgoingClash.destinationCongregation}" el {localSpeakerOutgoingClash.date}.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Speaker & 1-Click Hospitality Details */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 space-y-2 text-xs mb-4 border border-slate-100 dark:border-white/[0.06]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5 text-indigo-500" /> Orador:
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {speakerName}
                        </span>
                      </div>

                      {isVisiting && (
                        <>
                          {w.visitingSpeakerCongregation && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Building className="w-3.5 h-3.5 text-emerald-600" /> Congregación:
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {w.visitingSpeakerCongregation}
                              </span>
                            </div>
                          )}
                          {w.visitingSpeakerPhone && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5" /> Contacto:
                              </span>
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {w.visitingSpeakerPhone}
                              </span>
                            </div>
                          )}
                          {companions > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-indigo-500" /> Comitiva:
                              </span>
                              <span className="font-medium text-indigo-700 dark:text-indigo-300">
                                Orador + {companions} acompañante(s) ({totalGuests} pers.)
                              </span>
                            </div>
                          )}
                          {w.visitingSpeakerDietaryNotes && (
                            <div className="p-2 rounded-lg bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px]">
                              <strong>⚠️ Dieta/Alergias Orador:</strong> {w.visitingSpeakerDietaryNotes}
                            </div>
                          )}
                        </>
                      )}

                      {/* 1-Click Hospitality Section */}
                      <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Utensils className="w-3.5 h-3.5 text-amber-600" /> Hospitalidad:
                          </span>
                          {hospitalityPub ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {hospitalityPub.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleHospitalityStatus(week)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                  w.hospitalityStatus === 'confirmada'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                                }`}
                                title="Alternar confirmación de la familia anfitriona"
                              >
                                {w.hospitalityStatus === 'confirmada' ? '✓ Confirmada' : 'Pendiente'}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOneClickAssignHospitality(week)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 font-bold text-[11px] transition-colors cursor-pointer"
                              title="Asignar automáticamente a la familia anfitriona disponible con mejor rotación y capacidad"
                            >
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              <span>Asignar en 1 Clic</span>
                            </button>
                          )}
                        </div>

                        {hospitalityPub && (
                          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>
                              Modalidad:{' '}
                              <strong className="text-slate-700 dark:text-slate-300">
                                {w.hospitalityMealType
                                  ? MEAL_TYPE_LABELS[w.hospitalityMealType]
                                  : 'Almuerzo'}
                              </strong>
                            </span>
                            {hostRecord && (
                              <span>Capacidad: {hostRecord.capacity} pers.</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons (WhatsApp 1-Click Suite) */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {isVisiting && (
                      <button
                        onClick={() => handleSendWhatsAppSpeaker(week)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20 transition-colors cursor-pointer"
                        title="Enviar ficha S-99 y datos de hospitalidad al orador visitante"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Confirmar Orador</span>
                      </button>
                    )}

                    {hospitalityPub && (
                      <button
                        onClick={() => handleSendWhatsAppHospitality(week)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-500/20 transition-colors cursor-pointer"
                        title="Recordar detalles de la comida, acompañantes y dieta a la familia anfitriona"
                      >
                        <Utensils className="w-3.5 h-3.5 text-amber-600" />
                        <span>Avisar Anfitrión</span>
                      </button>
                    )}

                    {matchingNeighborCong && matchingNeighborCong.talkCoordinatorPhone && (
                      <button
                        onClick={() => handleSendWhatsAppCoordinator(matchingNeighborCong, week)}
                        className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-500/20 transition-colors cursor-pointer"
                        title={`Contactar al Coordinador de Discursos de ${matchingNeighborCong.name}`}
                      >
                        <Building className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Coord. Vecino</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==========================================
          SUBTAB 2: DIRECTORIO DE CONGREGACIONES VECINAS Y ORADORES VISITANTES
      ========================================== */}
      {activeSubTab === 'directorio_khs' && (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-white/[0.08] p-4 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
            <div className="relative w-full lg:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                placeholder="Buscar congregación, orador, coordinador o # bosquejo..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-slate-800/50 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
              <select
                value={selectedCongFilter}
                onChange={(e) => setSelectedCongFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 outline-hidden"
              >
                <option value="todas">Todas las congregaciones ({neighboringCongregations.length})</option>
                {neighboringCongregations.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-white/10">
                <button
                  onClick={() => setDirectoryView('ambos')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    directoryView === 'ambos'
                      ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Vista Completa
                </button>
                <button
                  onClick={() => setDirectoryView('congregaciones')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    directoryView === 'congregaciones'
                      ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Congregaciones ({filteredNeighboringCongs.length})
                </button>
                <button
                  onClick={() => setDirectoryView('oradores')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    directoryView === 'oradores'
                      ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Oradores ({filteredVisitingSpeakers.length})
                </button>
              </div>
            </div>
          </div>

          {/* SECTION A: NEIGHBORING CONGREGATIONS */}
          {(directoryView === 'ambos' || directoryView === 'congregaciones') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-600" />
                    <span>Directorio de Congregaciones Vecinas (Intercambio)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Coordine horarios de reunión, direcciones y contacto directo por WhatsApp con los Coordinadores de Discursos Públicos vecinos.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddCong}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-500/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Congregación</span>
                </button>
              </div>

              {filteredNeighboringCongs.length === 0 ? (
                <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-white/[0.08] p-8 text-center">
                  <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                    No hay congregaciones vecinas registradas
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Agregue las congregaciones con las que realizan intercambio de oradores para contactar a sus coordinadores en 1 clic.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredNeighboringCongs.map((cong) => {
                    const speakersFromCong = visitingSpeakersDirectory.filter(
                      (s) =>
                        s.congregationId === cong.id ||
                        s.congregationName.toLowerCase() === cong.name.toLowerCase()
                    );

                    return (
                      <div
                        key={cong.id}
                        className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-white/[0.08] p-4 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2.5">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                                  {cong.name}
                                </h4>
                                {cong.circuit && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                                    {cong.circuit}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Reunión: <strong>{cong.weekendMeetingDay} {cong.weekendMeetingTime}</strong>
                                {cong.distanceKm !== undefined ? ` • a ${cong.distanceKm} km` : ''}
                              </p>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditCong(cong)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                                title="Editar congregación"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCong(cong.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                                title="Eliminar congregación"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-1.5 text-xs mb-3 border border-slate-100 dark:border-white/[0.05]">
                            {cong.address && (
                              <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{cong.address}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 dark:text-slate-400">Coordinador:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {cong.talkCoordinatorName || 'No especificado'}
                              </span>
                            </div>
                            {cong.talkCoordinatorPhone && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Teléfono:</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {cong.talkCoordinatorPhone}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 dark:border-white/10">
                              <span className="text-slate-500 dark:text-slate-400">Oradores acreditados:</span>
                              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                {speakersFromCong.length} orador(es)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleSendWhatsAppCoordinator(cong)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20 cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp Coordinador</span>
                          </button>
                          <button
                            onClick={() => handleOpenAddVisitingSpeaker(cong)}
                            className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-700 text-xs font-semibold cursor-pointer"
                            title="Añadir orador visitante de esta congregación"
                          >
                            + Orador
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION B: VISITING SPEAKERS DIRECTORY */}
          {(directoryView === 'ambos' || directoryView === 'oradores') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Oradores Visitantes Acreditados y Bosquejos Preparados</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Consulte qué bosquejos S-99 tiene preparado cada orador visitante, sus notas de dieta/acompañantes y prográmelos en 1 clic.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenAddVisitingSpeaker()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Orador Visitante</span>
                </button>
              </div>

              {filteredVisitingSpeakers.length === 0 ? (
                <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-white/[0.08] p-8 text-center">
                  <Mic className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                    No hay oradores visitantes en esta vista
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Registre a los hermanos de congregaciones vecinas junto con su lista de bosquejos preparados para asignarlos rápidamente.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVisitingSpeakers.map((sp) => (
                    <div
                      key={sp.id}
                      className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-white/[0.08] p-4 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                                {sp.name}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                {sp.privilege === 'siervo_ministerial' ? 'Siervo Min.' : 'Anciano'}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                              🏛️ {sp.congregationName}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditVisitingSpeaker(sp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                              title="Editar orador visitante"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteVisitingSpeaker(sp.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                              title="Eliminar orador visitante"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-3">
                          {sp.phone && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Teléfono:</span>
                              <span className="font-medium">{sp.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Acompañantes:</span>
                            <span className="font-medium">
                              {sp.companionsDefault && sp.companionsDefault > 0
                                ? `+${sp.companionsDefault} (${sp.spouseName || 'Esposa / Familia'})`
                                : 'Viaja solo (1 pers.)'}
                            </span>
                          </div>
                          {sp.lastVisitDate && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Última visita:</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {sp.lastVisitDate}
                              </span>
                            </div>
                          )}
                          {sp.dietaryNotes && (
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px]">
                              🍽️ {sp.dietaryNotes}
                            </div>
                          )}
                        </div>

                        {/* Prepared outlines chips */}
                        <div className="mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Bosquejos Preparados ({sp.preparedOutlines.length}):
                          </span>
                          {sp.preparedOutlines.length === 0 ? (
                            <span className="text-xs italic text-slate-400">
                              Sin bosquejos especificados
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {sp.preparedOutlines.slice(0, 8).map((num) => {
                                const outObj = findOutlineByNumber(num);
                                return (
                                  <span
                                    key={num}
                                    title={outObj ? `#${num} - ${outObj.title}` : `Bosquejo #${num}`}
                                    className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-500/20 text-[11px] font-bold"
                                  >
                                    #{num}
                                  </span>
                                );
                              })}
                              {sp.preparedOutlines.length > 8 && (
                                <span className="px-1.5 py-0.5 text-[10px] text-slate-500 font-semibold">
                                  +{sp.preparedOutlines.length - 8} más
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenQuickSchedule(sp)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Programar Visita + Hospitalidad (1-Clic)</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          SUBTAB 3: ORADORES SALIENTES (CON DETECTOR DE CHOQUES EN VIVO)
      ========================================== */}
      {activeSubTab === 'salientes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#131d2e] rounded-2xl p-4 border border-slate-200 dark:border-white/[0.08] shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Discursos en Congregaciones Vecinas (Salidas Protegidas)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                El motor inteligente verifica automáticamente si el orador que sale tiene Presidencia, Estudio de La Atalaya, Audio/Video, Micrófonos, Acomodador, Carritos o Hospitalidad ese fin de semana.
              </p>
            </div>
            <button
              onClick={handleOpenAddOutgoing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Salida</span>
            </button>
          </div>

          {outgoingSpeakers.length === 0 ? (
            <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-white/[0.08] p-8 text-center">
              <Send className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 dark:text-white text-base">
                No hay salidas registradas
              </h4>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                Registre las fechas en que los ancianos o siervos ministeriales de su congregación
                salen a presentar discursos públicos en congregaciones vecinas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {outgoingSpeakers.map((item) => {
                const pub = publishersMap.get(item.publisherId);
                const outline = findOutlineByNumber(item.outlineNumber);
                const itemConflicts = detectOutgoingSpeakerConflicts(
                  item.publisherId,
                  item.date,
                  weeks,
                  publishersMap,
                  outgoingSpeakers,
                  cartShifts,
                  fieldServiceMeetings,
                  item.id
                );

                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-[#131d2e] rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                      itemConflicts.length > 0
                        ? 'border-rose-300 ring-2 ring-rose-100 dark:border-rose-500/40'
                        : 'border-slate-200 dark:border-white/[0.08] hover:border-indigo-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                            <Send className="w-4 h-4" />
                          </span>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                              {pub ? pub.name : 'Hermano no encontrado'}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {pub?.phone || ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditOutgoing(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteOutgoingSpeaker(item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-1.5 text-xs mb-3 border border-slate-100 dark:border-white/[0.06]">
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Fecha de salida:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{item.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Congregación destino:</span>
                          <span className="font-bold text-indigo-700 dark:text-indigo-300">
                            {item.destinationCongregation}
                          </span>
                        </div>
                        {item.destinationMeetingTime && (
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Hora reunión:</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {item.destinationMeetingTime}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-500 dark:text-slate-400 shrink-0">
                            Bosquejo #{item.outlineNumber}:
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {item.outlineTitle || outline?.title}
                          </span>
                        </div>
                      </div>

                      {/* Real-time Conflict Alerts on Card */}
                      {itemConflicts.length > 0 ? (
                        <div className="mb-3 space-y-1.5">
                          {itemConflicts.map((c) => (
                            <div
                              key={c.id}
                              className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-900 dark:text-rose-200 text-xs"
                            >
                              <div className="font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>{c.title}</span>
                              </div>
                              <p className="text-[11px] mt-0.5 leading-snug">{c.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mb-3 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-200/60 dark:border-emerald-500/20 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Sin choques con asignaciones locales ese fin de semana</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
                      <button
                        onClick={() => handleSendWhatsAppOutgoingSlip(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Enviar Ficha al Orador</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          SUBTAB 4: CATÁLOGO OFICIAL DE BOSQUEJOS (1-194)
      ========================================== */}
      {activeSubTab === 'catalogo' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-white/[0.08] p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={catalogQuery}
                onChange={(e) => setCatalogQuery(e.target.value)}
                placeholder="Buscar por número (ej: 23) o título..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-500">Categoría:</span>
              <select
                value={catalogCategory}
                onChange={(e) => setCatalogCategory(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 outline-hidden focus:ring-2 focus:ring-indigo-500"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredOutlines.map((outline) => {
              const lastDelivered = outlineLastDelivered.get(outline.number);
              const preparedBrothers = publishers.filter(
                (p) => p.preparedOutlines && p.preparedOutlines.includes(outline.number)
              );
              const preparedVisiting = visitingSpeakersDirectory.filter(
                (vs) => vs.preparedOutlines && vs.preparedOutlines.includes(outline.number)
              );

              return (
                <div
                  key={outline.number}
                  className="bg-white dark:bg-[#131d2e] rounded-xl border border-slate-200 dark:border-white/[0.08] p-4 hover:border-indigo-300 transition-all flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-200 dark:border-indigo-500/20 shrink-0">
                        #{outline.number}
                      </span>
                      {outline.category && (
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full truncate">
                          {outline.category}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug mb-3">
                      {outline.title}
                    </h4>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] text-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span>Última vez presentado:</span>
                      {lastDelivered ? (
                        <span className="font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-2 py-0.5 rounded-md">
                          {lastDelivered}
                        </span>
                      ) : (
                        <span className="italic text-slate-400">Nunca registrado</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Oradores locales:</span>
                      <button
                        onClick={() => setSelectedOutlineForBrothers(outline)}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        {preparedBrothers.length > 0
                          ? `${preparedBrothers.length} asignado(s)`
                          : '+ Habilitar'}
                      </button>
                    </div>

                    {(preparedBrothers.length > 0 || preparedVisiting.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {preparedBrothers.map((b) => (
                          <span
                            key={b.id}
                            className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 text-[11px] font-semibold"
                          >
                            {b.name} (Local)
                          </span>
                        ))}
                        {preparedVisiting.map((vs) => (
                          <span
                            key={vs.id}
                            className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 text-[11px] font-semibold"
                          >
                            {vs.name} ({vs.congregationName})
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

      {/* ==========================================
          SUBTAB 5: HISTORIAL DE DISCURSOS
      ========================================== */}
      {activeSubTab === 'historial' && (
        <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Historial de Discursos Presentados en el Salón
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro cronológico para auditoría teocrática y control de repetición de bosquejos S-99.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold">
              {talkHistory.length} discursos registrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase font-semibold border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Bosquejo # y Tema</th>
                  <th className="px-4 py-3">Orador</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Hospitalidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {talkHistory.map((h, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {h.date}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {h.outlineNumber ? `#${h.outlineNumber}` : ''} {h.theme || 'Sin tema'}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                      <div>{h.speakerName}</div>
                      {h.congregation && (
                        <div className="text-slate-400 text-[11px]">{h.congregation}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {h.isVisiting ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                          Visitante
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          Local
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {h.hospitalityName ? (
                        <span className="font-medium text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/20">
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

      {/* ==========================================
          MODAL 1: EDIT WEEKEND TALK & 1-CLICK HOSPITALITY
      ========================================== */}
      {editingWeek && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#131d2e] rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                  Configurar Discurso Público y Hospitalidad
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Semana del {editingWeek.weekStartDate} • Fin de semana: {editingWeek.weekend.date}
                </p>
              </div>
              <button
                onClick={() => setEditingWeek(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm overflow-y-auto flex-1 pr-1">
              {/* Speaker Type Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
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
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-colors border cursor-pointer ${
                      !editingWeek.weekend.isVisitingSpeaker
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
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
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-colors border cursor-pointer ${
                      editingWeek.weekend.isVisitingSpeaker
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    Orador Visitante (Invitado)
                  </button>
                </div>
              </div>

              {/* Speaker Selection */}
              {!editingWeek.weekend.isVisitingSpeaker ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Hermano Local
                  </label>
                  <select
                    value={editingWeek.weekend.publicTalkSpeaker || ''}
                    onChange={(e) => {
                      const pubId = e.target.value;
                      const pub = publishersMap.get(pubId);
                      const firstOutline = pub?.preparedOutlines?.[0];
                      const foundOutline = firstOutline ? findOutlineByNumber(firstOutline) : undefined;
                      setEditingWeek({
                        ...editingWeek,
                        weekend: {
                          ...editingWeek.weekend,
                          publicTalkSpeaker: pubId,
                          ...(firstOutline && !editingWeek.weekend.publicTalkOutlineNumber
                            ? {
                                publicTalkOutlineNumber: firstOutline,
                                publicTalkTheme: foundOutline?.title || '',
                              }
                            : {}),
                        },
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 font-medium text-slate-800 dark:text-white outline-hidden"
                  >
                    <option value="">-- Seleccionar hermano local --</option>
                    {localSpeakerPublishers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.preparedOutlines && p.preparedOutlines.length > 0
                          ? ` (Bosquejos: ${p.preparedOutlines.map((n) => `#${n}`).join(', ')})`
                          : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3 bg-emerald-50/50 dark:bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                  {/* Quick Pick from Visiting Speakers Directory */}
                  {visitingSpeakersDirectory.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                        ⚡ Seleccionar del Directorio de Oradores Visitantes
                      </label>
                      <select
                        value={editingWeek.weekend.visitingSpeakerId || ''}
                        onChange={(e) => {
                          const spId = e.target.value;
                          const sp = visitingSpeakersDirectory.find((s) => s.id === spId);
                          if (!sp) return;
                          const firstOut = sp.preparedOutlines[0] || editingWeek.weekend.publicTalkOutlineNumber;
                          const outObj = firstOut ? findOutlineByNumber(firstOut) : undefined;
                          setEditingWeek({
                            ...editingWeek,
                            weekend: {
                              ...editingWeek.weekend,
                              visitingSpeakerId: sp.id,
                              publicTalkSpeaker: sp.name,
                              visitingSpeakerCongregation: sp.congregationName,
                              visitingSpeakerPhone: sp.phone || '',
                              visitingSpeakerCompanions: sp.companionsDefault ?? 0,
                              visitingSpeakerDietaryNotes: sp.dietaryNotes || '',
                              publicTalkOutlineNumber: firstOut,
                              publicTalkTheme: outObj ? outObj.title : editingWeek.weekend.publicTalkTheme,
                            },
                          });
                        }}
                        className="w-full px-3 py-2 border border-emerald-300 dark:border-emerald-500/30 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white outline-hidden"
                      >
                        <option value="">-- Autocompletar desde el Directorio --</option>
                        {visitingSpeakersDirectory.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.name} — {sp.congregationName}{' '}
                            {sp.preparedOutlines.length > 0
                              ? `[Bosquejos: ${sp.preparedOutlines.map((n) => `#${n}`).join(', ')}]`
                              : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-1">
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
                        placeholder="Ej: Hno. Marcelo Vega"
                        className="w-full px-3 py-2 border border-emerald-300 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-1">
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
                        placeholder="+57 300 000 0000"
                        className="w-full px-3 py-2 border border-emerald-300 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                        Congregación de Origen
                      </label>
                      <input
                        type="text"
                        list="neighboring-congs-datalist"
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
                        placeholder="Ej: Congregación Las Acacias"
                        className="w-full px-3 py-2 border border-emerald-300 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden"
                      />
                      <datalist id="neighboring-congs-datalist">
                        {neighboringCongregations.map((c) => (
                          <option key={c.id} value={c.name} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                        Acompañantes (Esposa / Familia)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={editingWeek.weekend.visitingSpeakerCompanions ?? 0}
                        onChange={(e) =>
                          setEditingWeek({
                            ...editingWeek,
                            weekend: {
                              ...editingWeek.weekend,
                              visitingSpeakerCompanions: Math.max(0, parseInt(e.target.value, 10) || 0),
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-emerald-300 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                      Alergias / Notas Alimentarias del Orador
                    </label>
                    <input
                      type="text"
                      value={editingWeek.weekend.visitingSpeakerDietaryNotes || ''}
                      onChange={(e) =>
                        setEditingWeek({
                          ...editingWeek,
                          weekend: {
                            ...editingWeek.weekend,
                            visitingSpeakerDietaryNotes: e.target.value,
                          },
                        })
                      }
                      placeholder="Ej: Sin lácteos, vegetariano, alergia a mariscos..."
                      className="w-full px-3 py-2 border border-emerald-300 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Outline Number & Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Bosquejo Oficial S-99 (1-194)
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
                    placeholder="Núm"
                    className="w-24 px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl text-center font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 outline-hidden"
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
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>

                {/* Live Outline Repetition Alert in Modal */}
                {editingWeekOutlineEval?.isRepeatedRecently && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Aviso de Frecuencia de Bosquejo: </span>
                      {editingWeekOutlineEval.lastDeliveredDate
                        ? `Este bosquejo ya se presentó el ${editingWeekOutlineEval.lastDeliveredDate} (${editingWeekOutlineEval.lastSpeakerName}, hace ${editingWeekOutlineEval.monthsSinceLast} meses).`
                        : `Este bosquejo ya está programado en la fecha ${editingWeekOutlineEval.otherScheduledDate}.`}
                    </div>
                  </div>
                )}
              </div>

              {/* 1-Click Hospitality Coordination Section */}
              <div className="bg-amber-50/50 dark:bg-amber-500/10 p-3.5 rounded-xl border border-amber-200 dark:border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-950 dark:text-amber-200 uppercase flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-amber-600" />
                    <span>Hospitalidad y Atención al Orador (1-Clic)</span>
                  </label>
                  {editingWeekHostSuggestions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const best =
                          editingWeekHostSuggestions.find(
                            (r) => r.isAvailable && r.meetsCapacity
                          ) || editingWeekHostSuggestions[0];
                        if (best) {
                          setEditingWeek({
                            ...editingWeek,
                            weekend: {
                              ...editingWeek.weekend,
                              hospitalityPublisherId: best.host.publisherId,
                              hospitalityMealType:
                                editingWeek.weekend.hospitalityMealType || 'almuerzo',
                            },
                          });
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-500/30 text-amber-950 dark:text-amber-100 text-[11px] font-bold cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Elegir Mejor Rotación</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Familia / Hermano Anfitrión
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
                      className="w-full px-3 py-2 border border-amber-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-white outline-hidden"
                    >
                      <option value="">-- Sin hospitalidad asignada --</option>
                      {editingWeekHostSuggestions.length > 0 && (
                        <optgroup label="⭐ Familias Anfitrionas (Ordenadas por Equidad y Capacidad)">
                          {editingWeekHostSuggestions.map((s) => (
                            <option key={`sug-${s.host.id}`} value={s.host.publisherId}>
                              {s.isAvailable && s.meetsCapacity ? '✅' : '⚠️'} {s.publisher.name} (Cap: {s.host.capacity}p) — {s.reasonBadge}
                            </option>
                          ))}
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
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Modalidad de Hospitalidad
                    </label>
                    <select
                      value={editingWeek.weekend.hospitalityMealType || 'almuerzo'}
                      onChange={(e) =>
                        setEditingWeek({
                          ...editingWeek,
                          weekend: {
                            ...editingWeek.weekend,
                            hospitalityMealType: e.target.value as HospitalityMealType,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-amber-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-white outline-hidden"
                    >
                      {Object.entries(MEAL_TYPE_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Notas de Hospitalidad / Transporte
                  </label>
                  <input
                    type="text"
                    value={editingWeek.weekend.hospitalityNotes || ''}
                    onChange={(e) =>
                      setEditingWeek({
                        ...editingWeek,
                        weekend: {
                          ...editingWeek.weekend,
                          hospitalityNotes: e.target.value,
                        },
                      })
                    }
                    placeholder="Ej: Recoger al orador en la terminal, almuerzo a las 12:30..."
                    className="w-full px-3 py-2 border border-amber-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setEditingWeek(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveWeekTalk}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: ADD/EDIT OUTGOING SPEAKER (WITH LIVE CONFLICT RADAR)
      ========================================== */}
      {isOutgoingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveOutgoing}
            className="bg-white dark:bg-[#131d2e] rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-white/10"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3 shrink-0">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600 shrink-0" />
                <span>
                  {editingOutgoingItem
                    ? 'Editar Salida de Discurso'
                    : 'Registrar Discurso en Congregación Vecina'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsOutgoingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Hermano Local que Sale
                  </label>
                  <select
                    required
                    value={outgoingForm.publisherId}
                    onChange={(e) => {
                      const pubId = e.target.value;
                      const pub = publishersMap.get(pubId);
                      const firstOutline = pub?.preparedOutlines?.[0] || outgoingForm.outlineNumber;
                      const outObj = findOutlineByNumber(firstOutline);
                      setOutgoingForm({
                        ...outgoingForm,
                        publisherId: pubId,
                        outlineNumber: firstOutline,
                        outlineTitle: outObj ? outObj.title : outgoingForm.outlineTitle,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 font-medium text-slate-800 dark:text-white outline-hidden"
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
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Fecha del Discurso
                  </label>
                  <input
                    type="date"
                    required
                    value={outgoingForm.date}
                    onChange={(e) => setOutgoingForm({ ...outgoingForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
              </div>

              {/* LIVE CONFLICT RADAR */}
              {outgoingForm.publisherId && outgoingForm.date && (
                <div>
                  {liveOutgoingModalConflicts.length === 0 ? (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Detector: Libre de choques locales para el {outgoingForm.date}.
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-900 dark:text-rose-200 space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>
                          ¡Atención! Se detectaron {liveOutgoingModalConflicts.length} choque(s) ese fin de semana:
                        </span>
                      </div>
                      {liveOutgoingModalConflicts.map((c) => (
                        <div key={c.id} className="text-[11px] pl-5">
                          • <strong>[{c.moduleLabel}]</strong> {c.description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Destination Congregation Selector (linked with Neighboring Congregations Directory) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Congregación Destino
                </label>
                {neighboringCongregations.length > 0 && (
                  <select
                    value={outgoingForm.destinationCongregationId}
                    onChange={(e) => {
                      const cId = e.target.value;
                      const cong = neighboringCongregations.find((c) => c.id === cId);
                      if (cong) {
                        setOutgoingForm({
                          ...outgoingForm,
                          destinationCongregationId: cong.id,
                          destinationCongregation: cong.name,
                          destinationMeetingTime: cong.weekendMeetingTime || '',
                          destinationAddress: cong.address || '',
                          destinationCoordinatorName: cong.talkCoordinatorName || '',
                          destinationCoordinatorPhone: cong.talkCoordinatorPhone || '',
                        });
                      } else {
                        setOutgoingForm({
                          ...outgoingForm,
                          destinationCongregationId: '',
                        });
                      }
                    }}
                    className="w-full px-3 py-2 mb-2 border border-indigo-200 dark:border-indigo-500/30 rounded-xl bg-indigo-50/50 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold outline-hidden"
                  >
                    <option value="">-- Elegir del Directorio de Congregaciones Vecinas --</option>
                    {neighboringCongregations.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.weekendMeetingDay} {c.weekendMeetingTime})
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  required
                  value={outgoingForm.destinationCongregation}
                  onChange={(e) =>
                    setOutgoingForm({ ...outgoingForm, destinationCongregation: e.target.value })
                  }
                  placeholder="Nombre de la congregación destino..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Hora de Reunión Destino
                  </label>
                  <input
                    type="text"
                    value={outgoingForm.destinationMeetingTime}
                    onChange={(e) =>
                      setOutgoingForm({ ...outgoingForm, destinationMeetingTime: e.target.value })
                    }
                    placeholder="Ej: 10:00"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Dirección del Salón Destino
                  </label>
                  <input
                    type="text"
                    value={outgoingForm.destinationAddress}
                    onChange={(e) =>
                      setOutgoingForm({ ...outgoingForm, destinationAddress: e.target.value })
                    }
                    placeholder="Dirección o ubicación..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
              </div>

              {/* Prepared Outlines quick chips for the selected local speaker */}
              {(() => {
                const selectedPub = publishersMap.get(outgoingForm.publisherId);
                const prep = selectedPub?.preparedOutlines || [];
                if (prep.length === 0) return null;
                return (
                  <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-500/10 border border-indigo-200/70 dark:border-indigo-500/20">
                    <span className="block text-[10px] font-bold uppercase text-indigo-800 dark:text-indigo-300 mb-1.5">
                      Bosquejos preparados de {selectedPub?.name}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {prep.map((num) => {
                        const o = findOutlineByNumber(num);
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() =>
                              setOutgoingForm({
                                ...outgoingForm,
                                outlineNumber: num,
                                outlineTitle: o ? o.title : outgoingForm.outlineTitle,
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                              outgoingForm.outlineNumber === num
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200'
                            }`}
                          >
                            #{num}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
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
                    className="w-20 px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl text-center font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 outline-hidden"
                  />
                  <input
                    type="text"
                    required
                    value={outgoingForm.outlineTitle}
                    onChange={(e) =>
                      setOutgoingForm({ ...outgoingForm, outlineTitle: e.target.value })
                    }
                    placeholder="Título del tema..."
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Notas Adicionales
                </label>
                <input
                  type="text"
                  value={outgoingForm.notes}
                  onChange={(e) => setOutgoingForm({ ...outgoingForm, notes: e.target.value })}
                  placeholder="Ej: Confirmado con el coordinador vecino..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsOutgoingModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Guardar Salida
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          MODAL 3: NEIGHBORING CONGREGATION CRUD
      ========================================== */}
      {isCongModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveCong}
            className="bg-white dark:bg-[#131d2e] rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-white/10"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <span>
                  {editingCong ? 'Editar Congregación Vecina' : 'Nueva Congregación Vecina'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCongModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Nombre de la Congregación *
                  </label>
                  <input
                    type="text"
                    required
                    value={congForm.name}
                    onChange={(e) => setCongForm({ ...congForm, name: e.target.value })}
                    placeholder="Ej: Congregación Las Acacias"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Circuito
                  </label>
                  <input
                    type="text"
                    value={congForm.circuit}
                    onChange={(e) => setCongForm({ ...congForm, circuit: e.target.value })}
                    placeholder="Ej: CO-04"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Día Fin de Semana
                  </label>
                  <select
                    value={congForm.weekendMeetingDay}
                    onChange={(e) =>
                      setCongForm({ ...congForm, weekendMeetingDay: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  >
                    <option value="Sábado">Sábado</option>
                    <option value="Domingo">Domingo</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Hora de Reunión
                  </label>
                  <input
                    type="text"
                    value={congForm.weekendMeetingTime}
                    onChange={(e) =>
                      setCongForm({ ...congForm, weekendMeetingTime: e.target.value })
                    }
                    placeholder="Ej: 10:00"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Distancia (km)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={congForm.distanceKm}
                    onChange={(e) => setCongForm({ ...congForm, distanceKm: e.target.value })}
                    placeholder="Ej: 8"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Dirección del Salón del Reino
                </label>
                <input
                  type="text"
                  value={congForm.address}
                  onChange={(e) => setCongForm({ ...congForm, address: e.target.value })}
                  placeholder="Dirección exacta para enviar a los oradores..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-indigo-50/50 dark:bg-indigo-500/10 p-3 rounded-xl border border-indigo-200/70 dark:border-indigo-500/20">
                <div>
                  <label className="block font-bold text-indigo-950 dark:text-indigo-200 uppercase mb-1">
                    Coordinador de Discursos
                  </label>
                  <input
                    type="text"
                    value={congForm.talkCoordinatorName}
                    onChange={(e) =>
                      setCongForm({ ...congForm, talkCoordinatorName: e.target.value })
                    }
                    placeholder="Nombre del hermano..."
                    className="w-full px-3 py-2 border border-indigo-200 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-indigo-950 dark:text-indigo-200 uppercase mb-1">
                    WhatsApp / Teléfono Coordinador
                  </label>
                  <input
                    type="text"
                    value={congForm.talkCoordinatorPhone}
                    onChange={(e) =>
                      setCongForm({ ...congForm, talkCoordinatorPhone: e.target.value })
                    }
                    placeholder="+57 300 000 0000"
                    className="w-full px-3 py-2 border border-indigo-200 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsCongModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Guardar Congregación
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          MODAL 4: VISITING SPEAKER DIRECTORY CRUD (WITH S-99 OUTLINE PICKER)
      ========================================== */}
      {isVisitingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveVisitingSpeaker}
            className="bg-white dark:bg-[#131d2e] rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-white/10"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span>
                  {editingVisitingSpeaker
                    ? 'Editar Orador Visitante'
                    : 'Registrar Orador Visitante Acreditado'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsVisitingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Nombre del Orador *
                  </label>
                  <input
                    type="text"
                    required
                    value={visitingForm.name}
                    onChange={(e) => setVisitingForm({ ...visitingForm, name: e.target.value })}
                    placeholder="Ej: Hno. Roberto Peña"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Nombramiento
                  </label>
                  <select
                    value={visitingForm.privilege}
                    onChange={(e) =>
                      setVisitingForm({
                        ...visitingForm,
                        privilege: e.target.value as 'anciano' | 'siervo_ministerial',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  >
                    <option value="anciano">Anciano</option>
                    <option value="siervo_ministerial">Siervo Ministerial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Congregación de Origen *
                  </label>
                  <input
                    type="text"
                    required
                    list="visiting-congs-list"
                    value={visitingForm.congregationName}
                    onChange={(e) => {
                      const val = e.target.value;
                      const match = neighboringCongregations.find(
                        (c) => c.name.toLowerCase() === val.toLowerCase()
                      );
                      setVisitingForm({
                        ...visitingForm,
                        congregationName: val,
                        congregationId: match?.id || '',
                      });
                    }}
                    placeholder="Ej: Congregación Las Acacias"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  />
                  <datalist id="visiting-congs-list">
                    {neighboringCongregations.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={visitingForm.phone}
                    onChange={(e) => setVisitingForm({ ...visitingForm, phone: e.target.value })}
                    placeholder="+57 300 000 0000"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Acompañantes Habituales
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={visitingForm.companionsDefault}
                    onChange={(e) =>
                      setVisitingForm({
                        ...visitingForm,
                        companionsDefault: Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Nombre de Esposa / Acompañante
                  </label>
                  <input
                    type="text"
                    value={visitingForm.spouseName}
                    onChange={(e) =>
                      setVisitingForm({ ...visitingForm, spouseName: e.target.value })
                    }
                    placeholder="Opcional..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Notas de Dieta / Alergias (Para Hospitalidad)
                </label>
                <input
                  type="text"
                  value={visitingForm.dietaryNotes}
                  onChange={(e) =>
                    setVisitingForm({ ...visitingForm, dietaryNotes: e.target.value })
                  }
                  placeholder="Ej: Sin gluten, alérgico a frutos secos..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                />
              </div>

              {/* Interactive S-99 Prepared Outlines Picker */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-white uppercase">
                    Bosquejos Preparados ({visitingForm.preparedOutlines.length})
                  </span>
                  <input
                    type="text"
                    value={outlinePickerSearch}
                    onChange={(e) => setOutlinePickerSearch(e.target.value)}
                    placeholder="Filtrar # o tema..."
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 text-xs outline-hidden w-44"
                  />
                </div>

                {visitingForm.preparedOutlines.length > 0 && (
                  <div className="flex flex-wrap gap-1 pb-1">
                    {visitingForm.preparedOutlines.map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() =>
                          setVisitingForm({
                            ...visitingForm,
                            preparedOutlines: visitingForm.preparedOutlines.filter(
                              (n) => n !== num
                            ),
                          })
                        }
                        className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <span>#{num}</span>
                        <span>×</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {OFFICIAL_PUBLIC_TALK_OUTLINES.filter((o) => {
                    const q = outlinePickerSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      String(o.number).includes(q) || o.title.toLowerCase().includes(q)
                    );
                  })
                    .slice(0, 40)
                    .map((o) => {
                      const selected = visitingForm.preparedOutlines.includes(o.number);
                      return (
                        <button
                          key={o.number}
                          type="button"
                          onClick={() => {
                            const next = selected
                              ? visitingForm.preparedOutlines.filter((n) => n !== o.number)
                              : [...visitingForm.preparedOutlines, o.number].sort((a, b) => a - b);
                            setVisitingForm({ ...visitingForm, preparedOutlines: next });
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors ${
                            selected
                              ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-900 dark:text-indigo-200 font-bold'
                              : 'hover:bg-slate-200/60 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="truncate">
                            <strong>#{o.number}</strong> — {o.title}
                          </span>
                          {selected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsVisitingModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Guardar Orador Visitante
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          MODAL 5: QUICK 1-CLICK SCHEDULE VISITING SPEAKER ONTO WEEK
      ========================================== */}
      {quickScheduleSpeaker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleConfirmQuickSchedule}
            className="bg-white dark:bg-[#131d2e] rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-white/10"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Programación en 1 Clic
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">
                  Invitar a {quickScheduleSpeaker.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {quickScheduleSpeaker.congregationName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickScheduleSpeaker(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  1. Seleccionar Fin de Semana
                </label>
                <select
                  required
                  value={quickScheduleWeekId}
                  onChange={(e) => setQuickScheduleWeekId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-white outline-hidden"
                >
                  {weeks.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.weekend.date} (Semana del {w.weekStartDate}){' '}
                      {w.weekend.publicTalkSpeaker
                        ? `— Ocupado: ${w.weekend.publicTalkSpeaker}`
                        : '— Disponible'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  2. Bosquejo a Presentar
                </label>
                <select
                  value={quickScheduleOutlineNum}
                  onChange={(e) => setQuickScheduleOutlineNum(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-white outline-hidden"
                >
                  {quickScheduleSpeaker.preparedOutlines.length > 0 && (
                    <optgroup label="⭐ Bosquejos Preparados del Orador">
                      {quickScheduleSpeaker.preparedOutlines.map((num) => {
                        const o = findOutlineByNumber(num);
                        return (
                          <option key={`prep-${num}`} value={num}>
                            #{num} — {o?.title || ''}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  <optgroup label="Catálogo Completo (1-194)">
                    {OFFICIAL_PUBLIC_TALK_OUTLINES.map((o) => (
                      <option key={o.number} value={o.number}>
                        #{o.number} — {o.title}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  3. Familia Anfitriona de Hospitalidad (Sugerida por Rotación)
                </label>
                <select
                  value={quickScheduleHostId}
                  onChange={(e) => setQuickScheduleHostId(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 dark:border-white/10 rounded-xl bg-amber-50/40 dark:bg-slate-800 font-semibold text-slate-800 dark:text-white outline-hidden"
                >
                  <option value="">-- Dejar sin hospitalidad por ahora --</option>
                  {hospitalityHosts
                    .filter((h) => h.active)
                    .map((h) => {
                      const p = publishersMap.get(h.publisherId);
                      if (!p) return null;
                      return (
                        <option key={h.id} value={h.publisherId}>
                          🍽️ {p.name} (Capacidad: {h.capacity} pers.)
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setQuickScheduleSpeaker(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Confirmar y Programar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 6: PREPARED OUTLINES FOR LOCAL BROTHERS */}
      {selectedOutlineForBrothers && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#131d2e] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  Bosquejo #{selectedOutlineForBrothers.number}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">
                  {selectedOutlineForBrothers.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOutlineForBrothers(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Marque qué hermanos locales tienen preparado y listo para presentar este bosquejo público:
            </p>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {localSpeakerPublishers.map((pub) => {
                const isPrepared = pub.preparedOutlines?.includes(
                  selectedOutlineForBrothers.number
                );

                return (
                  <label
                    key={pub.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isPrepared
                        ? 'bg-indigo-50/70 dark:bg-indigo-500/20 border-indigo-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:bg-slate-100'
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
                        <span className="font-semibold text-slate-900 dark:text-white text-xs">
                          {pub.name}
                        </span>
                      </div>
                    </div>

                    {isPrepared && (
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                        Preparado
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-white/10">
              <button
                onClick={() => setSelectedOutlineForBrothers(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
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
