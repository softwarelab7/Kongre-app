// src/components/GlobalSearchModal.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { ActiveTab } from './Navbar';
import { OFFICIAL_PUBLIC_TALK_OUTLINES } from '../utils/theocraticData';
import {
  Search,
  X,
  Calendar,
  Users,
  User,
  Map,
  Mic,
  FileText,
  Award,
  BarChart3,
  Landmark,
  Package,
  Brush,
  Bell,
  AlertTriangle,
  Settings,
  Tv,
  Timer,
  UserCheck,
  ShieldCheck,
  Compass,
  Briefcase,
  Flame,
  FileCheck,
  ChevronRight,
  ArrowUpDown,
  CornerDownLeft,
  Sparkles,
  Phone,
  Tag,
  Zap,
  Wrench,
  Target,
  FileBarChart,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab, extraAction?: () => void) => void;
  onOpenKiosk?: () => void;
  onOpenTimer?: () => void;
  onOpenQr?: () => void;
}

type SearchCategory = 'todos' | 'publicadores' | 'territorios' | 'discursos' | 'programa' | 'modulos';

interface SearchResultItem {
  id: string;
  category: 'publicadores' | 'territorios' | 'discursos' | 'programa' | 'modulos';
  categoryLabel: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  icon: any;
  action: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenKiosk,
  onOpenTimer,
  onOpenQr,
}) => {
  const {
    publishers,
    territories,
    weeks,
    setCurrentWeekId,
    conflicts,
    notices,
  } = useCongregation();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('todos');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveCategory('todos');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // System navigation modules index
  const navigationModules: SearchResultItem[] = useMemo(() => [
    {
      id: 'mod-calendario',
      category: 'modulos',
      categoryLabel: 'Reuniones',
      title: 'Calendario de la Congregación',
      subtitle: 'Agenda mensual, visitas del SC, asambleas y eventos teocráticos',
      icon: Calendar,
      action: () => onNavigate('calendario'),
    },
    {
      id: 'mod-programa',
      category: 'modulos',
      categoryLabel: 'Reuniones',
      title: 'Programa Semanal',
      subtitle: 'Vida y Ministerio Cristianos y Reunión del Fin de Semana',
      icon: Calendar,
      action: () => onNavigate('programacion'),
    },
    {
      id: 'mod-s89',
      category: 'modulos',
      categoryLabel: 'Reuniones',
      title: 'Hojas de Asignación S-89',
      subtitle: 'Impresión y seguimiento de asignaciones de estudiantes',
      icon: Award,
      action: () => onNavigate('s89'),
    },
    {
      id: 'mod-discursos',
      category: 'modulos',
      categoryLabel: 'Reuniones',
      title: 'Discursos Públicos',
      subtitle: 'Catálogo de 200 bosquejos, oradores locales y visitantes',
      icon: Mic,
      action: () => onNavigate('discursos'),
    },
    {
      id: 'mod-kiosco',
      category: 'modulos',
      categoryLabel: 'Reuniones',
      title: 'Pantalla Kiosco / Salón',
      subtitle: 'Modo cartelera digital para monitores del Salón del Reino',
      icon: Tv,
      badge: 'Herramienta',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      action: () => {
        onClose();
        if (onOpenKiosk) onOpenKiosk();
      },
    },
    {
      id: 'mod-timer',
      category: 'modulos',
      categoryLabel: 'Reuniones',
      title: 'Cronómetro de Presidencia (Atril)',
      subtitle: 'Temporizador oficial con alertas visuales verde/amarillo/rojo',
      icon: Timer,
      badge: 'Atril',
      badgeColor: 'bg-amber-100 text-amber-800',
      action: () => {
        onClose();
        if (onOpenTimer) onOpenTimer();
      },
    },
    {
      id: 'mod-publicadores',
      category: 'modulos',
      categoryLabel: 'Secretaría',
      title: 'Directorio de Publicadores',
      subtitle: 'Privilegios, teléfonos, ausencias y roles asignables',
      icon: Users,
      action: () => onNavigate('publicadores'),
    },
    {
      id: 'mod-precursores',
      category: 'modulos',
      categoryLabel: 'Secretaría',
      title: 'Precursores Auxiliares (S-205)',
      subtitle: 'Gestión y aprobación de solicitudes de 15 y 30 horas del comité',
      icon: Target,
      action: () => onNavigate('precursores_auxiliares'),
    },
    {
      id: 'mod-tarjetas-s21',
      category: 'modulos',
      categoryLabel: 'Secretaría',
      title: 'Tarjetas de Registro S-21',
      subtitle: 'Historial oficial de actividad de servicio y precursores',
      icon: FileText,
      action: () => onNavigate('tarjetas_s21'),
    },
    {
      id: 'mod-informes-s4',
      category: 'modulos',
      categoryLabel: 'Secretaría',
      title: 'Informes de Servicio S-4',
      subtitle: 'Recolección mensual, totales de congregación y envío a sucursal',
      icon: FileCheck,
      action: () => onNavigate('informes_servicio'),
    },
    {
      id: 'mod-asistencia-s88',
      category: 'modulos',
      categoryLabel: 'Secretaría',
      title: 'Registro de Asistencia S-88',
      subtitle: 'Asistencia entre semana y fin de semana, gráficos y promedios',
      icon: BarChart3,
      action: () => onNavigate('asistencia'),
    },
    {
      id: 'mod-informe-s1',
      category: 'modulos',
      categoryLabel: 'Secretaría',
      title: 'Informe S-1 Sucursal (JW Hub)',
      subtitle: 'Consolidación mensual de asistencia S-88 y predicación S-4 para la sucursal',
      icon: FileBarChart,
      action: () => onNavigate('informe_s1'),
    },
    {
      id: 'mod-cuentas-s26',
      category: 'modulos',
      categoryLabel: 'Secretaría',
      title: 'Cuentas de Congregación S-26',
      subtitle: 'Ingresos, gastos, fondo de sucursal y conciliación mensual',
      icon: Landmark,
      action: () => onNavigate('cuentas'),
    },
    {
      id: 'mod-territorios-s13',
      category: 'modulos',
      categoryLabel: 'Predicación',
      title: 'Territorios S-13',
      subtitle: 'Registro de asignación, mapas, no visitas y territorios vencidos',
      icon: Map,
      action: () => onNavigate('territorios'),
    },
    {
      id: 'mod-grupos',
      category: 'modulos',
      categoryLabel: 'Predicación',
      title: 'Grupos de Servicio del Campo',
      subtitle: 'Superintendentes de grupo, auxiliares y miembros',
      icon: Compass,
      action: () => onNavigate('grupos_servicio'),
    },
    {
      id: 'mod-carritos',
      category: 'modulos',
      categoryLabel: 'Predicación',
      title: 'Testimonio Público (Carritos)',
      subtitle: 'Puntos estratégicos, turnos y parejas de predicación',
      icon: Map,
      action: () => onNavigate('carritos'),
    },
    {
      id: 'mod-literatura',
      category: 'modulos',
      categoryLabel: 'Predicación',
      title: 'Literatura & Revistas S-14',
      subtitle: 'Inventario del mostrador, pedidos especiales y entregas',
      icon: Package,
      action: () => onNavigate('literatura'),
    },
    {
      id: 'mod-limpieza',
      category: 'modulos',
      categoryLabel: 'Salón',
      title: 'Servicios de la Congregación (Deberes y Turnos)',
      subtitle: 'Audio y video, micrófonos, acomodadores, turnos y aseo semanal',
      icon: ShieldCheck,
      action: () => onNavigate('limpieza_deberes'),
    },
    {
      id: 'mod-panel-electrico',
      category: 'modulos',
      categoryLabel: 'Salón',
      title: 'Tablero / Panel Eléctrico',
      subtitle: 'Control de breakers, circuitos, modo reunión e impresión de rótulo',
      icon: Zap,
      action: () => onNavigate('panel_electrico'),
    },
    {
      id: 'mod-mantenimiento',
      category: 'modulos',
      categoryLabel: 'Salón',
      title: 'Fichas de Mantenimiento del Salón',
      subtitle: 'Plan preventivo, extintores, climatización, cubiertas y tareas',
      icon: Wrench,
      action: () => onNavigate('mantenimiento'),
    },
    {
      id: 'mod-visita-sc',
      category: 'modulos',
      categoryLabel: 'Salón',
      title: 'Visita del Superintendente de Circuito',
      subtitle: 'Programa especial, reuniones con ancianos, siervos y comidas',
      icon: Briefcase,
      action: () => onNavigate('visita_sc'),
    },
    {
      id: 'mod-memorial',
      category: 'modulos',
      categoryLabel: 'Salón',
      title: 'Conmemoración & Asambleas',
      subtitle: 'Planes del Memorial, emblemas, acomodadores y asambleas',
      icon: Flame,
      action: () => onNavigate('memorial_asambleas'),
    },
    {
      id: 'mod-tablero',
      category: 'modulos',
      categoryLabel: 'Salón',
      title: 'Tablero de Anuncios',
      subtitle: 'Noticias teocráticas, cartas de sucursal y anuncios fijados',
      icon: Bell,
      badge: notices.length > 0 ? `${notices.length} avisos` : undefined,
      badgeColor: 'bg-blue-100 text-blue-800',
      action: () => onNavigate('tablero_anuncios'),
    },
    {
      id: 'mod-conflictos',
      category: 'modulos',
      categoryLabel: 'Supervisión',
      title: 'Centro de Conflictos Teocráticos',
      subtitle: 'Detección en tiempo real de cruces de hermanos en la misma fecha',
      icon: AlertTriangle,
      badge: conflicts.length > 0 ? `${conflicts.length} cruces` : '0 cruces',
      badgeColor: conflicts.length > 0 ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-emerald-100 text-emerald-800',
      action: () => onNavigate('conflictos'),
    },
    {
      id: 'mod-equidad',
      category: 'modulos',
      categoryLabel: 'Supervisión',
      title: 'Panel de Equidad y Estadísticas',
      subtitle: 'Balance de carga de asignaciones y distribución justa',
      icon: BarChart3,
      action: () => onNavigate('equidad'),
    },
    {
      id: 'mod-exportar',
      category: 'modulos',
      categoryLabel: 'Supervisión',
      title: 'Exportar Programa a PDF',
      subtitle: 'Descarga en hojas A4/Carta listas para imprimir o enviar por WhatsApp',
      icon: FileText,
      action: () => onNavigate('exportar_pdf'),
    },
    {
      id: 'mod-portal',
      category: 'modulos',
      categoryLabel: 'Supervisión',
      title: 'Mi Portal (Vista de Publicador)',
      subtitle: 'Consulta rápida de mis propias asignaciones y tareas',
      icon: UserCheck,
      action: () => onNavigate('mi_vista'),
    },
    {
      id: 'mod-perfil',
      category: 'modulos',
      categoryLabel: 'Usuario',
      title: 'Mi Perfil y Contacto',
      subtitle: 'Foto de perfil, nombre visible, canales de contacto y datos personales',
      icon: User,
      action: () => onNavigate('perfil'),
    },
    {
      id: 'mod-ajustes',
      category: 'modulos',
      categoryLabel: 'Supervisión',
      title: 'Ajustes de la Congregación',
      subtitle: 'Nombre, horarios de reunión, copias de seguridad y restauración',
      icon: Settings,
      action: () => onNavigate('ajustes'),
    },
  ], [onNavigate, onOpenKiosk, onOpenTimer, notices.length, conflicts.length, onClose]);

  // Aggregate and search
  const filteredResults: SearchResultItem[] = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const results: SearchResultItem[] = [];

    // 1. Search Publishers
    if (activeCategory === 'todos' || activeCategory === 'publicadores') {
      publishers.forEach((p) => {
        const matchesName = p.name.toLowerCase().includes(cleanQuery);
        const matchesPhone = p.phone && p.phone.toLowerCase().includes(cleanQuery);
        const matchesPrivilege = p.privilege && p.privilege.toLowerCase().replace('_', ' ').includes(cleanQuery);
        const matchesGroup = cleanQuery.includes('grupo') ? `grupo ${p.groupNumber}`.includes(cleanQuery) : false;

        if (!cleanQuery || matchesName || matchesPhone || matchesPrivilege || matchesGroup) {
          const privilegeLabel = p.privilege
            ? p.privilege.replace('_', ' ').toUpperCase()
            : p.gender === 'hermana'
            ? 'HERMANA'
            : 'HERMANO';

          results.push({
            id: `pub-${p.id}`,
            category: 'publicadores',
            categoryLabel: 'Publicador',
            title: p.name,
            subtitle: `Grupo ${p.groupNumber || 1} • ${p.phone || 'Sin teléfono'} • ${p.gender === 'hermana' ? 'Hermana' : 'Hermano'}`,
            badge: privilegeLabel,
            badgeColor: p.privilege?.includes('anciano')
              ? 'bg-purple-100 text-purple-800'
              : p.privilege?.includes('siervo')
              ? 'bg-blue-100 text-blue-800'
              : p.privilege?.includes('precursor')
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-100 text-slate-700',
            icon: Users,
            action: () => {
              onNavigate('publicadores');
              onClose();
            },
          });
        }
      });
    }

    // 2. Search Territories
    if (activeCategory === 'todos' || activeCategory === 'territorios') {
      territories.forEach((t) => {
        const assignedPublisher = t.currentAssigneeId ? publishers.find((p) => p.id === t.currentAssigneeId) : null;
        const matchesNumber = t.number.toLowerCase().includes(cleanQuery);
        const matchesName = t.name.toLowerCase().includes(cleanQuery);
        const matchesAssigned = assignedPublisher ? assignedPublisher.name.toLowerCase().includes(cleanQuery) : false;
        const matchesType = t.type.toLowerCase().includes(cleanQuery);
        const matchesZone = t.zone ? t.zone.toLowerCase().includes(cleanQuery) : false;

        if (!cleanQuery || matchesNumber || matchesName || matchesAssigned || matchesType || matchesZone) {
          const isOverdue =
            t.status === 'vencido' ||
            (t.status === 'asignado' && t.dueDate && new Date(t.dueDate) < new Date());

          results.push({
            id: `terr-${t.id}`,
            category: 'territorios',
            categoryLabel: 'Territorio S-13',
            title: `Territorio #${t.number}: ${t.name}`,
            subtitle: assignedPublisher
              ? `Asignado a: ${assignedPublisher.name} • ${t.zone || t.type}`
              : `Disponible para trabajar • ${t.zone || t.type}`,
            badge: isOverdue ? 'Vencido' : t.status === 'asignado' ? 'Asignado' : 'Disponible',
            badgeColor: isOverdue
              ? 'bg-rose-100 text-rose-800 font-bold'
              : t.status === 'asignado'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800',
            icon: Map,
            action: () => {
              onNavigate('territorios');
              onClose();
            },
          });
        }
      });
    }

    // 3. Search Public Talk Outlines
    if (activeCategory === 'todos' || activeCategory === 'discursos') {
      OFFICIAL_PUBLIC_TALK_OUTLINES.forEach((talk) => {
        const matchesNum =
          talk.number.toString() === cleanQuery ||
          `discurso ${talk.number}`.includes(cleanQuery) ||
          `#${talk.number}`.includes(cleanQuery);
        const matchesTitle = talk.title.toLowerCase().includes(cleanQuery);
        const talkCat = talk.category || 'General';
        const matchesCategory = talkCat.toLowerCase().includes(cleanQuery);

        if (!cleanQuery || matchesNum || matchesTitle || matchesCategory) {
          results.push({
            id: `talk-${talk.number}`,
            category: 'discursos',
            categoryLabel: 'Discurso Público',
            title: `#${talk.number}: ${talk.title}`,
            subtitle: `Categoría: ${talkCat}`,
            badge: `#${talk.number}`,
            badgeColor: 'bg-indigo-100 text-indigo-800 font-mono font-bold',
            icon: Mic,
            action: () => {
              onNavigate('discursos');
              onClose();
            },
          });
        }
      });
    }

    // 4. Search Weeks / Schedule
    if (activeCategory === 'todos' || activeCategory === 'programa') {
      weeks.forEach((w) => {
        const matchesDate =
          w.id.includes(cleanQuery) ||
          w.weekStartDate.includes(cleanQuery) ||
          w.weekEndDate.includes(cleanQuery);
        const readingTitle = w.midweek?.tesoros?.lecturaBiblia?.title || '';
        const talkTheme = w.weekend?.publicTalkTheme || '';
        const matchesReading = readingTitle.toLowerCase().includes(cleanQuery);
        const matchesTalk = talkTheme.toLowerCase().includes(cleanQuery);

        if (!cleanQuery || matchesDate || matchesReading || matchesTalk) {
          results.push({
            id: `week-${w.id}`,
            category: 'programa',
            categoryLabel: 'Programa Semanal',
            title: `Semana ${w.weekStartDate} al ${w.weekEndDate}`,
            subtitle: `Lectura: ${readingTitle || 'Programada'} ${
              talkTheme ? `• Discurso: ${talkTheme}` : ''
            }`,
            badge: w.id,
            badgeColor: 'bg-blue-100 text-blue-800 font-mono text-[11px]',
            icon: Calendar,
            action: () => {
              setCurrentWeekId(w.id);
              onNavigate('programacion');
              onClose();
            },
          });
        }
      });
    }

    // 5. Search Navigation Modules
    if (activeCategory === 'todos' || activeCategory === 'modulos') {
      navigationModules.forEach((m) => {
        const matchesTitle = m.title.toLowerCase().includes(cleanQuery);
        const matchesSub = m.subtitle.toLowerCase().includes(cleanQuery);
        const matchesCat = m.categoryLabel.toLowerCase().includes(cleanQuery);

        if (!cleanQuery || matchesTitle || matchesSub || matchesCat) {
          results.push(m);
        }
      });
    }

    return results;
  }, [
    query,
    activeCategory,
    publishers,
    territories,
    weeks,
    navigationModules,
    onNavigate,
    onClose,
    setCurrentWeekId,
  ]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults.length, activeCategory]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : prev));
      scrollSelectedIntoView(selectedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      scrollSelectedIntoView(selectedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        filteredResults[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const scrollSelectedIntoView = (index: number) => {
    const container = resultsContainerRef.current;
    if (!container) return;
    const items = container.querySelectorAll('[data-search-item]');
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 px-3 pb-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[82vh] z-10 animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar publicador, territorio, bosquejo de discurso (#1..200), fecha o módulo..."
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-sm sm:text-base focus:outline-hidden"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded shadow-2xs">
              ESC
            </kbd>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none bg-white dark:bg-slate-900 text-xs">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'publicadores', label: 'Publicadores' },
            { id: 'territorios', label: 'Territorios' },
            { id: 'discursos', label: 'Discursos' },
            { id: 'programa', label: 'Programa' },
            { id: 'modulos', label: 'Módulos' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as SearchCategory)}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-slate-400 dark:text-slate-400 font-normal pl-2 shrink-0">
            {filteredResults.length} {filteredResults.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

        {/* Results List */}
        <div
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60"
        >
          {filteredResults.length > 0 ? (
            filteredResults.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  data-search-item
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors text-left ${
                    isSelected
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-200 dark:ring-indigo-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                          {item.categoryLabel}
                        </span>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded-md text-[10px] font-semibold ${
                              item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold truncate leading-snug text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    {isSelected && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60">
                        <span>Ir</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    )}
                    <ChevronRight
                      className={`w-4 h-4 ${
                        isSelected ? 'text-indigo-600 dark:text-indigo-400 translate-x-0.5' : 'text-slate-300 dark:text-slate-600'
                      } transition-transform`}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 px-4">
              <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">No se encontraron resultados</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                No hay coincidencias para &ldquo;{query}&rdquo;. Prueba buscando por nombre de publicador, número de territorio o bosquejo de discurso.
              </p>
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
                ↓
              </kbd>
              <span>Navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
                ↵
              </kbd>
              <span>Abrir</span>
            </span>
          </div>
          <span className="hidden sm:inline text-slate-400 dark:text-slate-500">
            Consejo: Escribe <span className="font-semibold text-indigo-600 dark:text-indigo-400">#12</span> para el discurso 12
          </span>
        </div>
      </div>
    </div>
  );
};
