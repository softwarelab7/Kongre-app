// src/components/PublishersTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { Publisher, Gender, Absence } from '../types';
import {
  Search,
  UserPlus,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit2,
  Calendar,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  Phone,
  Filter,
  Check,
  X,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { computePublisherAssignmentStats } from '../utils/autoAssigner';
import { useSecurity } from '../context/SecurityContext';
import { maskPhoneNumber } from '../utils/theocraticSecurity';

export const PublishersTab: React.FC = () => {
  const {
    publishers,
    addPublisher,
    updatePublisher,
    deletePublisher,
    importPublishersFromCSV,
    weeks,
    customDuties,
  } = useCongregation();

  const { privacyModeEnabled } = useSecurity();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedPublisher, setSelectedPublisher] = useState<Publisher | null>(null);

  // Form state for creating / editing publisher
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<Gender>('hermano');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formGroup, setFormGroup] = useState<number>(1);
  const [formActive, setFormActive] = useState<boolean>(true);
  const [formAbsences, setFormAbsences] = useState<Absence[]>([]);
  const [formRoles, setFormRoles] = useState<Record<string, boolean>>({});

  // New absence fields
  const [newAbsStart, setNewAbsStart] = useState('');
  const [newAbsEnd, setNewAbsEnd] = useState('');
  const [newAbsReason, setNewAbsReason] = useState('');

  // CSV modal state
  const [csvText, setCsvText] = useState('');
  const [csvFeedback, setCsvFeedback] = useState<string | null>(null);

  // Assignment stats
  const stats = useMemo(() => computePublisherAssignmentStats(weeks, publishers), [weeks, publishers]);

  // Filtered publishers
  const filteredPublishers = useMemo(() => {
    return publishers.filter(pub => {
      const matchesSearch =
        pub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.phone.includes(searchTerm) ||
        (pub.notes && pub.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesGender = filterGender === 'all' || pub.gender === filterGender;

      let matchesStatus = true;
      if (filterStatus === 'active') matchesStatus = pub.active;
      else if (filterStatus === 'inactive') matchesStatus = !pub.active;
      else if (filterStatus === 'absent') {
        const today = new Date().toISOString().split('T')[0];
        matchesStatus = pub.absences.some(a => a.startDate <= today && a.endDate >= today);
      }

      return matchesSearch && matchesGender && matchesStatus;
    });
  }, [publishers, searchTerm, filterGender, filterStatus]);

  const openNewModal = () => {
    setSelectedPublisher(null);
    setFormName('');
    setFormGender('hermano');
    setFormPhone('');
    setFormNotes('');
    setFormGroup(1);
    setFormActive(true);
    setFormAbsences([]);
    // Default roles
    setFormRoles({
      vym_presidente: false,
      vym_oracion: true,
      vym_tesoros_discurso: false,
      vym_tesoros_perlas: true,
      vym_tesoros_lectura: true,
      vym_maestros_titular: true,
      vym_maestros_ayudante: true,
      vym_vida_partes: false,
      vym_estudio_conductor: false,
      vym_estudio_lector: true,
      fds_presidente: false,
      fds_atalaya_lector: true,
      fds_oracion: true,
      deber_acomodador: true,
      deber_seguridad: true,
      deber_audio: true,
      deber_video: true,
      deber_microfonos: true,
      deber_plataforma: true,
      deber_zoom: true,
    });
    setIsEditModalOpen(true);
  };

  const openEditModal = (pub: Publisher) => {
    setSelectedPublisher(pub);
    setFormName(pub.name);
    setFormGender(pub.gender);
    setFormPhone(pub.phone || '');
    setFormNotes(pub.notes || '');
    setFormGroup(pub.groupNumber || 1);
    setFormActive(pub.active);
    setFormAbsences([...pub.absences]);
    setFormRoles({ ...pub.roles });
    setIsEditModalOpen(true);
  };

  const handleSavePublisher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (selectedPublisher) {
      updatePublisher({
        ...selectedPublisher,
        name: formName.trim(),
        gender: formGender,
        phone: formPhone.trim(),
        notes: formNotes.trim(),
        groupNumber: Number(formGroup) || 1,
        active: formActive,
        absences: formAbsences,
        roles: formRoles as any,
      });
    } else {
      addPublisher({
        name: formName.trim(),
        gender: formGender,
        phone: formPhone.trim(),
        notes: formNotes.trim(),
        groupNumber: Number(formGroup) || 1,
        active: formActive,
        absences: formAbsences,
        roles: formRoles as any,
      });
    }
    setIsEditModalOpen(false);
  };

  const handleAddAbsence = () => {
    if (!newAbsStart || !newAbsEnd) return;
    const newAbs: Absence = {
      id: `abs-${Date.now()}`,
      startDate: newAbsStart,
      endDate: newAbsEnd,
      reason: newAbsReason.trim(),
    };
    setFormAbsences([...formAbsences, newAbs]);
    setNewAbsStart('');
    setNewAbsEnd('');
    setNewAbsReason('');
  };

  const handleRemoveAbsence = (id: string) => {
    setFormAbsences(formAbsences.filter(a => a.id !== id));
  };

  const handleToggleRole = (roleKey: string) => {
    setFormRoles(prev => ({
      ...prev,
      [roleKey]: !prev[roleKey],
    }));
  };

  const handleImportCsv = () => {
    if (!csvText.trim()) return;
    const count = importPublishersFromCSV(csvText);
    setCsvFeedback(`¡Se importaron ${count} publicadores correctamente!`);
    setTimeout(() => {
      setIsCsvModalOpen(false);
      setCsvText('');
      setCsvFeedback(null);
    }, 1200);
  };

  const exportPublishersCsv = () => {
    const header = 'Nombre,Género,Teléfono,Grupo,Notas,Activo\n';
    const rows = publishers
      .map(
        p =>
          `"${p.name}","${p.gender}","${p.phone}","${p.groupNumber || 1}","${p.notes || ''}","${p.active ? 'Sí' : 'No'}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Publicadores_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadExampleCsv = () => {
    const sample = `Nombre,Género,Teléfono,Grupo,Notas\n"Carlos Mendoza","hermano","+34 612 345 678",1,"Anciano"\n"Ana García","hermana","+34 655 778 899",1,"Precursora regular"\n"David Silva","hermano","+34 622 987 654",2,"Siervo ministerial"`;
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ejemplo_Importacion_Publicadores.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Publisher History
  const publisherHistoryRecords = useMemo(() => {
    if (!selectedPublisher) return [];
    const list: Array<{
      date: string;
      meetingType: string;
      partTitle: string;
      role: string;
      assistantName?: string;
      status: string;
    }> = [];

    weeks.forEach(w => {
      const pid = selectedPublisher.id;
      // Midweek
      if (w.midweek.presidentId === pid) {
        list.push({ date: w.midweek.date, meetingType: 'Entre Semana', partTitle: 'Presidente', role: 'Presidente', status: 'confirmada' });
      }
      if (w.midweek.initialPrayerId === pid) {
        list.push({ date: w.midweek.date, meetingType: 'Entre Semana', partTitle: 'Oración inicial', role: 'Oración', status: 'confirmada' });
      }
      if (w.midweek.finalPrayerId === pid) {
        list.push({ date: w.midweek.date, meetingType: 'Entre Semana', partTitle: 'Oración final', role: 'Oración', status: 'confirmada' });
      }
      if (w.midweek.tesoros.discurso.publisherId === pid) {
        list.push({ date: w.midweek.date, meetingType: 'Entre Semana', partTitle: w.midweek.tesoros.discurso.title, role: 'Tesoros Discurso', status: w.midweek.tesoros.discurso.status });
      }
      if (w.midweek.tesoros.perlas.publisherId === pid) {
        list.push({ date: w.midweek.date, meetingType: 'Entre Semana', partTitle: w.midweek.tesoros.perlas.title, role: 'Perlas', status: w.midweek.tesoros.perlas.status });
      }
      if (w.midweek.tesoros.lecturaBiblia.publisherId === pid) {
        list.push({ date: w.midweek.date, meetingType: 'Entre Semana', partTitle: 'Lectura de la Biblia', role: 'Lectura', status: w.midweek.tesoros.lecturaBiblia.status });
      }
      w.midweek.maestros.items.forEach(m => {
        if (m.publisherId === pid) {
          const asst = publishers.find(p => p.id === m.assistantId)?.name;
          list.push({ date: w.midweek.date, meetingType: 'Entre Semana', partTitle: m.title, role: 'Demostración (Titular)', assistantName: asst, status: m.status });
        }
        if (m.assistantId === pid) {
          const tit = publishers.find(p => p.id === m.publisherId)?.name;
          list.push({ date: w.midweek.date, meetingType: 'Entre Semana', partTitle: m.title, role: 'Ayudante', assistantName: `Con: ${tit}`, status: m.status });
        }
      });
      w.midweek.vidaCristiana.items.forEach(v => {
        if (v.publisherId === pid) {
          list.push({ date: w.midweek.date, meetingType: 'Entre Semana', partTitle: v.title, role: 'Vida Cristiana', status: v.status });
        }
      });
      if (w.midweek.vidaCristiana.estudioBiblico.conductorId === pid) {
        list.push({ date: w.midweek.date, meetingType: 'Entre Semana', partTitle: 'Conductor Estudio Bíblico', role: 'Conductor', status: 'confirmada' });
      }
      if (w.midweek.vidaCristiana.estudioBiblico.lectorId === pid) {
        list.push({ date: w.midweek.date, meetingType: 'Entre Semana', partTitle: 'Lector Estudio Bíblico', role: 'Lector', status: 'confirmada' });
      }
      Object.entries(w.midweek.duties).forEach(([dKey, ids]) => {
        if (ids.includes(pid)) {
          list.push({ date: w.midweek.date, meetingType: 'Entre Semana', partTitle: dKey.replace('deber_', '').toUpperCase(), role: 'Deber', status: 'confirmada' });
        }
      });

      // Weekend
      if (w.weekend.presidentId === pid) {
        list.push({ date: w.weekend.date, meetingType: 'Fin de Semana', partTitle: 'Presidente Fin de Semana', role: 'Presidente', status: 'confirmada' });
      }
      if (w.weekend.atalayaConductorId === pid) {
        list.push({ date: w.weekend.date, meetingType: 'Fin de Semana', partTitle: 'Conductor Atalaya', role: 'Conductor', status: 'confirmada' });
      }
      if (w.weekend.atalayaLectorId === pid) {
        list.push({ date: w.weekend.date, meetingType: 'Fin de Semana', partTitle: 'Lector Atalaya', role: 'Lector', status: 'confirmada' });
      }
      if (w.weekend.initialPrayerId === pid || w.weekend.finalPrayerId === pid) {
        list.push({ date: w.weekend.date, meetingType: 'Fin de Semana', partTitle: 'Oración Fin de Semana', role: 'Oración', status: 'confirmada' });
      }
      Object.entries(w.weekend.duties).forEach(([dKey, ids]) => {
        if (ids.includes(pid)) {
          list.push({ date: w.weekend.date, meetingType: 'Fin de Semana', partTitle: dKey.replace('deber_', '').toUpperCase(), role: 'Deber', status: 'confirmada' });
        }
      });
    });

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedPublisher, weeks, publishers]);

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Directorio de Publicadores</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {publishers.length} publicadores registrados ({publishers.filter(p => p.active).length} activos). Configura roles y ausencias para bloquear asignaciones automáticamente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Importar CSV</span>
          </button>

          <button
            onClick={exportPublishersCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-all"
            title="Exportar a CSV"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <button
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Publicador</span>
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, teléfono, notas..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          <select
            value={filterGender}
            onChange={e => setFilterGender(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Todos los géneros</option>
            <option value="hermano">Hermanos</option>
            <option value="hermana">Hermanas</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Solo Activos</option>
            <option value="inactive">Solo Inactivos</option>
            <option value="absent">Con Ausencia Actual</option>
          </select>
        </div>
      </div>

      {/* Publishers grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {filteredPublishers.map(pub => {
          const pubStat = stats.get(pub.id);
          const today = new Date().toISOString().split('T')[0];
          const currentAbsence = pub.absences.find(a => a.startDate <= today && a.endDate >= today);

          return (
            <div
              key={pub.id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all hover:shadow-md ${
                !pub.active
                  ? 'border-slate-200 bg-slate-50/70 opacity-80'
                  : currentAbsence
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        pub.gender === 'hermana'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {pub.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                          {pub.name}
                        </h3>
                        {!pub.active && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <span className="capitalize">{pub.gender}</span> • Grupo {pub.groupNumber || 1}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedPublisher(pub);
                        setIsHistoryModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Ver historial de asignaciones"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(pub)}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Editar publicador"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar a ${pub.name}?`)) {
                          deletePublisher(pub.id);
                        }
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Eliminar publicador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Absence Badge if present */}
                {currentAbsence && (
                  <div className="mt-3 px-3 py-1.5 rounded-lg bg-amber-100/80 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="truncate">
                      Ausente: {currentAbsence.startDate} al {currentAbsence.endDate} {currentAbsence.reason ? `(${currentAbsence.reason})` : ''}
                    </span>
                  </div>
                )}

                {/* Notes or phone */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {pub.phone && (
                    <div className="flex items-center justify-between text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      {privacyModeEnabled ? (
                        <div
                          className="flex items-center gap-1.5 font-semibold text-slate-500"
                          title="Protección de privacidad teocrática activa"
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{maskPhoneNumber(pub.phone)}</span>
                        </div>
                      ) : (
                        <a
                          href={`tel:${pub.phone}`}
                          className="flex items-center gap-1.5 hover:text-indigo-600 font-semibold"
                          title="Llamar"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{pub.phone}</span>
                        </a>
                      )}
                      {!privacyModeEnabled && (
                        <a
                          href={`https://wa.me/${pub.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] hover:bg-emerald-100 transition-colors"
                          title="Abrir chat de WhatsApp"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                  {pub.notes && (
                    <p className="italic text-slate-500 text-[11px] line-clamp-2">"{pub.notes}"</p>
                  )}
                </div>

                {/* Enabled roles summary badges */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1">
                  {pub.roles.vym_presidente && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700">
                      Pres. VYM
                    </span>
                  )}
                  {pub.roles.vym_tesoros_discurso && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                      Tesoros
                    </span>
                  )}
                  {pub.roles.vym_maestros_titular && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">
                      Estudiante
                    </span>
                  )}
                  {pub.roles.vym_estudio_conductor && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700">
                      Cond. Estudio
                    </span>
                  )}
                  {pub.roles.fds_presidente && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                      Pres. FDS
                    </span>
                  )}
                  {pub.roles.deber_audio && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                      Audio/Video
                    </span>
                  )}
                  {pub.roles.deber_microfonos && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                      Micrófonos
                    </span>
                  )}
                  {pub.roles.deber_acomodador && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                      Acomodador
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom stats pill */}
              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Participaciones: <strong className="text-slate-800">{pubStat?.total || 0}</strong></span>
                <span className="text-[11px]">
                  {pubStat?.lastDate ? `Última: ${pubStat.lastDate}` : 'Sin participaciones'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD / EDIT PUBLISHER */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100">
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedPublisher ? 'Editar Publicador' : 'Registrar Nuevo Publicador'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configura roles habilitados y fechas de ausencia para evitar cruces.
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal form body */}
            <form onSubmit={handleSavePublisher} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Ej. Carlos Mendoza"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Género *
                  </label>
                  <select
                    value={formGender}
                    onChange={e => setFormGender(e.target.value as Gender)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  >
                    <option value="hermano">Hermano (Varón)</option>
                    <option value="hermana">Hermana (Mujer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Grupo de Predicación
                  </label>
                  <select
                    value={formGroup}
                    onChange={e => setFormGroup(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>
                        Grupo #{num}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status active/inactive switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-sm font-bold text-slate-800">Estado de Publicador</p>
                  <p className="text-xs text-slate-500">
                    Si está inactivo, el sistema alertará y evitará que sea asignado.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={e => setFormActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notas / Privilegios teocráticos
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Ej. Anciano, Siervo ministerial, Precursor, etc."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* AUSENCIAS TEMPORALES */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>Ausencias Temporales (Bloqueo de asignaciones)</span>
                  </h4>
                </div>

                {formAbsences.length > 0 && (
                  <div className="space-y-2">
                    {formAbsences.map(abs => (
                      <div
                        key={abs.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900"
                      >
                        <div>
                          <strong className="font-semibold">
                            {abs.startDate} al {abs.endDate}
                          </strong>
                          {abs.reason && <span className="ml-2 text-amber-700 italic">({abs.reason})</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAbsence(abs.id)}
                          className="text-amber-700 hover:text-rose-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add absence inputs */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-xs font-semibold text-slate-600">Añadir nueva ausencia:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500">Desde:</span>
                      <input
                        type="date"
                        value={newAbsStart}
                        onChange={e => setNewAbsStart(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Hasta:</span>
                      <input
                        type="date"
                        value={newAbsEnd}
                        onChange={e => setNewAbsEnd(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Motivo (opcional):</span>
                      <input
                        type="text"
                        value={newAbsReason}
                        onChange={e => setNewAbsReason(e.target.value)}
                        placeholder="Ej. Vacaciones"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAbsence}
                    disabled={!newAbsStart || !newAbsEnd}
                    className="w-full py-1.5 px-3 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    + Registrar Ausencia
                  </button>
                </div>
              </div>

              {/* ROLES HABILITADOS (Casillas de verificación) */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900">
                  Roles y Asignaciones Habilitadas
                </h4>

                {/* Vida y ministerio */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                    Reunión Entre Semana (Vida y Ministerio)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.vym_presidente)}
                        onChange={() => handleToggleRole('vym_presidente')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Presidente de la reunión</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.vym_oracion)}
                        onChange={() => handleToggleRole('vym_oracion')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Oraciones (Inicial / Final)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.vym_tesoros_discurso)}
                        onChange={() => handleToggleRole('vym_tesoros_discurso')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Tesoros: Discurso (10 mins)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.vym_tesoros_perlas)}
                        onChange={() => handleToggleRole('vym_tesoros_perlas')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Tesoros: Perlas escondidas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.vym_tesoros_lectura)}
                        onChange={() => handleToggleRole('vym_tesoros_lectura')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Tesoros: Lectura de la Biblia</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.vym_maestros_titular)}
                        onChange={() => handleToggleRole('vym_maestros_titular')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Maestros: Titular (Demostraciones)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.vym_maestros_ayudante)}
                        onChange={() => handleToggleRole('vym_maestros_ayudante')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Maestros: Ayudante</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.vym_vida_partes)}
                        onChange={() => handleToggleRole('vym_vida_partes')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Vida Cristiana: Partes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.vym_estudio_conductor)}
                        onChange={() => handleToggleRole('vym_estudio_conductor')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Estudio Bíblico: Conductor</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.vym_estudio_lector)}
                        onChange={() => handleToggleRole('vym_estudio_lector')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Estudio Bíblico: Lector</span>
                    </label>
                  </div>
                </div>

                {/* Fin de semana */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Reunión de Fin de Semana
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.fds_presidente)}
                        onChange={() => handleToggleRole('fds_presidente')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Presidente Fin de Semana</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.fds_atalaya_lector)}
                        onChange={() => handleToggleRole('fds_atalaya_lector')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Lector de La Atalaya</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.fds_oracion)}
                        onChange={() => handleToggleRole('fds_oracion')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Oraciones</span>
                    </label>
                  </div>
                </div>

                {/* Deberes operativos */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Deberes y Logística
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.deber_audio)}
                        onChange={() => handleToggleRole('deber_audio')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Operador de Audio</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.deber_video)}
                        onChange={() => handleToggleRole('deber_video')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Operador de Video</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.deber_microfonos)}
                        onChange={() => handleToggleRole('deber_microfonos')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Micrófonos</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.deber_plataforma)}
                        onChange={() => handleToggleRole('deber_plataforma')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Plataforma</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.deber_acomodador)}
                        onChange={() => handleToggleRole('deber_acomodador')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Acomodador Auditorio / Puerta</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.deber_seguridad)}
                        onChange={() => handleToggleRole('deber_seguridad')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Seguridad / Estacionamiento</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formRoles.deber_zoom)}
                        onChange={() => handleToggleRole('deber_zoom')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Anfitrión de Zoom</span>
                    </label>

                    {/* Custom duties */}
                    {customDuties.map(d => (
                      <label key={d.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(formRoles[d.key])}
                          onChange={() => handleToggleRole(d.key)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{d.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm"
                >
                  {selectedPublisher ? 'Guardar Cambios' : 'Registrar Publicador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CSV IMPORT */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Importar Publicadores desde CSV</span>
              </h3>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Pega el contenido de tu hoja de cálculo o archivo CSV con las columnas: <br />
              <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-800">
                Nombre, Género, Teléfono, Grupo, Notas
              </code>
            </p>

            <button
              onClick={downloadExampleCsv}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Descargar plantilla CSV de ejemplo
            </button>

            <textarea
              rows={6}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder={`"Carlos Mendoza","hermano","+34 612 345 678",1,"Anciano"\n"Ana García","hermana","+34 655 778 899",1,"Precursora"`}
              className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />

            {csvFeedback && (
              <p className="text-xs font-bold text-emerald-600 text-center animate-fade-in">
                {csvFeedback}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportCsv}
                disabled={!csvText.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                Procesar e Importar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PUBLISHER HISTORY */}
      {isHistoryModalOpen && selectedPublisher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedPublisher.name}</h3>
                <p className="text-xs text-slate-500">Historial de participaciones pasadas y programadas</p>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {publisherHistoryRecords.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No hay participaciones registradas para este publicador en el programa actual.
                </div>
              ) : (
                publisherHistoryRecords.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{rec.partTitle}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                          {rec.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {rec.meetingType} • 📅 {rec.date}
                      </p>
                      {rec.assistantName && (
                        <p className="text-[11px] text-slate-600 font-medium mt-1">
                          Ayudante / Pareja: {rec.assistantName}
                        </p>
                      )}
                    </div>
                    <div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          rec.status === 'confirmada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'rechazada'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
