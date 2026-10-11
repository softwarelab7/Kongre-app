// src/context/CongregationContext.tsx
import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth, isFirestoreQuotaExceeded, markFirestoreQuotaExceeded, isQuotaError } from '../firebase/config';
import { useAuth } from './AuthContext';
import {
  Publisher,
  WeekSchedule,
  PreachingGroup,
  CustomDuty,
  CongregationSettings,
  ConflictAlert,
  AssignmentStatus,
  FieldServiceMeeting,
  OutgoingSpeakerAssignment,
  MeetingAttendance,
  CartLocation,
  CartShift,
  MonthlyServiceReport,
  CongregationNotice,
  S89Slip,
  StudentLessonRecord,
  Territory,
  NoVisitAddress,
  TerritoryAssignmentRecord,
  CircuitOverseerVisit,
  MealArrangement,
  MinistryArrangement,
  SpecialMeeting,
  VisitChecklistItem,
  AccountTransaction,
  QuarterlyAudit,
  MemorialPlan,
  TheocraticAssembly,
  LiteratureItem,
  LiteratureSpecialOrder,
  LiteratureGroupDistribution,
  LiteratureInventoryRecord,
  AccountLinkRequest,
  HospitalityHost,
  Breaker,
  MaintenanceSheet,
  MaintenanceStatus,
  AuxPioneerRequest,
  BranchReportS1,
  S1SubmissionStatus,
  ClmPrograma,
} from '../types';
import { bridgeClmToWeek, bridgeWeekToClm } from '../utils/clmBridge';
import { TheocraticRole } from '../utils/rbac';
import {
  INITIAL_PUBLISHERS,
  INITIAL_PREACHING_GROUPS,
  INITIAL_CUSTOM_DUTIES,
  INITIAL_SETTINGS,
  INITIAL_FIELD_SERVICE_MEETINGS,
  INITIAL_OUTGOING_SPEAKERS,
  INITIAL_CART_LOCATIONS,
  INITIAL_CART_SHIFTS,
  INITIAL_NOTICES,
  INITIAL_MONTHLY_REPORTS,
  INITIAL_TERRITORIES,
  INITIAL_CIRCUIT_VISIT,
  INITIAL_TRANSACTIONS,
  INITIAL_QUARTERLY_AUDITS,
  INITIAL_MEMORIAL_PLANS,
  INITIAL_ASSEMBLIES,
  INITIAL_LITERATURE_ITEMS,
  INITIAL_SPECIAL_ORDERS,
  INITIAL_GROUP_DISTRIBUTIONS,
  INITIAL_LITERATURE_INVENTORY_RECORDS,
  INITIAL_HOSPITALITY_HOSTS,
  INITIAL_BREAKERS,
  INITIAL_MAINTENANCE_SHEETS,
  INITIAL_AUX_PIONEER_REQUESTS,
  INITIAL_BRANCH_REPORTS_S1,
  generateInitialWeeks,
  createEmptyWeek,
  formatDateISO,
} from '../utils/sampleData';
import { getOrganizedScheduleForWeek, applyOrganizedToWeek, isWeekNeedingOrganizedSync } from '../utils/organizedSync';
import { detectConflictsInWeek } from '../utils/conflictDetector';
import { autoAssignWeek } from '../utils/autoAssigner';
import { OFFICIAL_STUDENT_LESSONS } from '../utils/theocraticData';
import { isCongregationIdString, getFriendlyCongregationName, sanitizeForFirestore } from '../utils/theocraticSecurity';

interface CongregationContextType {
  publishers: Publisher[];
  weeks: WeekSchedule[];
  currentWeek: WeekSchedule | undefined;
  currentWeekId: string;
  setCurrentWeekId: (id: string) => void;
  preachingGroups: PreachingGroup[];
  customDuties: CustomDuty[];
  settings: CongregationSettings;
  conflicts: ConflictAlert[];
  allWeeksConflicts: ConflictAlert[];
  syncStatus: 'synced' | 'saving' | 'offline' | 'error';
  outgoingSpeakers: OutgoingSpeakerAssignment[];
  fieldServiceMeetings: FieldServiceMeeting[];
  cartLocations: CartLocation[];
  cartShifts: CartShift[];
  notices: CongregationNotice[];
  monthlyReports: MonthlyServiceReport[];
  territories: Territory[];
  circuitVisit: CircuitOverseerVisit | null;
  transactions: AccountTransaction[];
  quarterlyAudits: QuarterlyAudit[];
  memorialPlans: MemorialPlan[];
  theocraticAssemblies: TheocraticAssembly[];
  literatureItems: LiteratureItem[];
  specialOrders: LiteratureSpecialOrder[];
  groupDistributions: LiteratureGroupDistribution[];
  inventoryRecords: LiteratureInventoryRecord[];

  // Publisher actions
  addPublisher: (pub: Omit<Publisher, 'id'>) => void;
  updatePublisher: (pub: Publisher) => void;
  deletePublisher: (id: string) => Promise<void> | void;
  deletePublishersBatch: (ids: string[]) => Promise<void> | void;
  importPublishersFromCSV: (csvText: string) => number;

  // Week schedule actions
  updateWeek: (week: WeekSchedule) => void;
  addNextWeek: () => void;
  copyWeekStructure: (fromWeekId: string, toWeekId: string) => void;
  syncWeekWithOrganized: (weekId: string, scope?: 'all' | 'midweek' | 'weekend') => void;
  syncAllWeeksWithOrganized: () => void;
  autoAssignCurrentWeek: () => void;
  autoAssignAllWeeksInMonth: (monthPrefix: string) => void;
  clearWeekAssignments: (weekId: string, scope?: 'all' | 'midweek' | 'weekend' | 'duties') => Promise<void> | void;
  replaceAssignment: (
    weekId: string,
    meetingType: 'midweek' | 'weekend',
    assignmentPath: string,
    newPublisherId: string,
    newStatus?: AssignmentStatus
  ) => void;
  updateAssignmentStatus: (
    weekId: string,
    meetingType: 'midweek' | 'weekend',
    assignmentPath: string,
    newStatus: AssignmentStatus,
    reason?: string
  ) => void;
  advancePublisherLesson: (publisherId: string, nextLessonNumber?: number, notes?: string) => void;
  repeatPublisherLesson: (publisherId: string, notes?: string) => void;
  updateMeetingAttendance: (weekId: string, attendance: MeetingAttendance) => void;

  // CLM (Vida y Ministerio Cristianos) Acciones y Sincronización en la Nube
  clmProgramas: Record<string, ClmPrograma>;
  updateClmPrograma: (programa: ClmPrograma) => Promise<void>;
  getClmPrograma: (semanaFecha: string) => ClmPrograma | null;

  // Outgoing Speakers
  addOutgoingSpeaker: (item: Omit<OutgoingSpeakerAssignment, 'id'>) => void;
  updateOutgoingSpeaker: (item: OutgoingSpeakerAssignment) => void;
  deleteOutgoingSpeaker: (id: string) => void;

  // Hospitality Hosts
  hospitalityHosts: HospitalityHost[];
  addHospitalityHost: (host: Omit<HospitalityHost, 'id'>) => void;
  updateHospitalityHost: (host: HospitalityHost) => void;
  deleteHospitalityHost: (id: string) => void;

  // Panel Eléctrico (Circuitos y Breakers del Salón)
  breakers: Breaker[];
  addBreaker: (breaker: Omit<Breaker, 'id'>) => void;
  updateBreaker: (breaker: Breaker) => void;
  deleteBreaker: (id: string) => void;
  toggleBreakerStatus: (id: string) => void;
  setMeetingBreakersPower: (turnOn: boolean) => void;
  reorderBreakers: (newBreakers: Breaker[]) => void;

  // Fichas de Mantenimiento del Salón
  maintenanceSheets: MaintenanceSheet[];
  addMaintenanceSheet: (sheet: Omit<MaintenanceSheet, 'id'>) => void;
  updateMaintenanceSheet: (sheet: MaintenanceSheet) => void;
  deleteMaintenanceSheet: (id: string) => void;
  toggleMaintenanceSheetActive: (id: string) => void;
  markMaintenanceSheetCompleted: (id: string, notes?: string) => void;
  reorderMaintenanceSheets: (newSheets: MaintenanceSheet[]) => void;

  // Solicitudes de Precursor Auxiliar
  auxPioneerRequests: AuxPioneerRequest[];
  addAuxPioneerRequest: (req: Omit<AuxPioneerRequest, 'id'>) => void;
  updateAuxPioneerRequest: (req: AuxPioneerRequest) => void;
  deleteAuxPioneerRequest: (id: string) => void;
  setAuxPioneerRequestStatus: (id: string, status: 'aprobada' | 'rechazada', reviewedBy?: string) => void;

  // Formulario S-1 (Informe Mensual de la Congregación a la Sucursal)
  branchReportsS1: BranchReportS1[];
  updateBranchReportS1: (report: BranchReportS1) => void;
  markBranchReportS1Status: (
    monthKey: string,
    status: S1SubmissionStatus,
    submittedBy?: string,
    confirmationNumber?: string,
    notes?: string
  ) => void;

  // Field Service Meetings
  addFieldServiceMeeting: (item: Omit<FieldServiceMeeting, 'id'>) => void;
  updateFieldServiceMeeting: (item: FieldServiceMeeting) => void;
  deleteFieldServiceMeeting: (id: string) => void;

  // Cart Witnessing
  addCartLocation: (loc: Omit<CartLocation, 'id'>) => void;
  updateCartLocation: (loc: CartLocation) => void;
  deleteCartLocation: (id: string) => void;
  addCartShift: (shift: Omit<CartShift, 'id'>) => void;
  updateCartShift: (shift: CartShift) => void;
  deleteCartShift: (id: string) => void;

  // Notices
  addNotice: (notice: Omit<CongregationNotice, 'id'>) => void;
  updateNotice: (notice: CongregationNotice) => void;
  deleteNotice: (id: string) => void;

  // Monthly Service Reports S-4
  updateMonthlyReport: (report: MonthlyServiceReport) => void;
  batchUpdateMonthlyReports: (reports: MonthlyServiceReport[]) => void;

  // Territories S-13
  addTerritory: (terr: Omit<Territory, 'id' | 'history'>) => void;
  updateTerritory: (terr: Territory) => void;
  deleteTerritory: (id: string) => void;
  assignTerritory: (territoryId: string, publisherId: string, assignedDate?: string, dueDate?: string, notes?: string) => void;
  returnTerritory: (territoryId: string, returnedDate?: string, notes?: string) => void;
  extendTerritoryDueDate: (territoryId: string, newDueDate: string) => void;
  addNoVisitAddress: (territoryId: string, noVisit: Omit<NoVisitAddress, 'id'>) => void;
  removeNoVisitAddress: (territoryId: string, noVisitId: string) => void;

  // Circuit Overseer Visit
  updateCircuitVisit: (visit: CircuitOverseerVisit) => void;
  updateMealArrangement: (meal: MealArrangement) => void;
  updateMinistryArrangement: (min: MinistryArrangement) => void;
  toggleVisitChecklistItem: (checkId: string) => void;
  addSpecialMeeting: (meeting: Omit<SpecialMeeting, 'id'>) => void;
  removeSpecialMeeting: (meetingId: string) => void;

  // Congregation Accounts (S-26, S-30, S-25)
  addTransaction: (tx: Omit<AccountTransaction, 'id'>) => void;
  updateTransaction: (tx: AccountTransaction) => void;
  deleteTransaction: (id: string) => void;
  updateQuarterlyAudit: (audit: QuarterlyAudit) => void;

  // Conmemoración del Memorial & Asambleas Teocráticas
  updateMemorialPlan: (plan: MemorialPlan) => void;
  addTheocraticAssembly: (assembly: Omit<TheocraticAssembly, 'id'>) => void;
  updateTheocraticAssembly: (assembly: TheocraticAssembly) => void;
  deleteTheocraticAssembly: (id: string) => void;

  // Literatura y Publicaciones (Formulario S-14)
  addLiteratureItem: (item: Omit<LiteratureItem, 'id'>) => void;
  updateLiteratureItem: (item: LiteratureItem) => void;
  deleteLiteratureItem: (id: string) => void;
  addSpecialOrder: (order: Omit<LiteratureSpecialOrder, 'id'>) => void;
  updateSpecialOrder: (order: LiteratureSpecialOrder) => void;
  deleteSpecialOrder: (id: string) => void;
  updateGroupDistribution: (dist: LiteratureGroupDistribution) => void;
  recordPhysicalCount: (record: Omit<LiteratureInventoryRecord, 'id'>) => void;

  // S-89 Slips extraction
  getS89SlipsForWeek: (week: WeekSchedule) => S89Slip[];

  // Cleaning & Groups
  updatePreachingGroups: (groups: PreachingGroup[]) => void;

  // Custom Duties
  addCustomDuty: (duty: Omit<CustomDuty, 'id'>) => void;
  updateCustomDuty: (duty: CustomDuty) => void;
  deleteCustomDuty: (id: string) => void;

  // Settings & Backup
  updateSettings: (newSettings: Partial<CongregationSettings>) => Promise<void> | void;
  exportBackupJSON: () => void;
  getBackupJSON: () => string;
  importBackupJSON: (jsonString: string) => boolean;
  publishersMap: Map<string, Publisher>;
  cleanSampleData: () => Promise<void> | void;
  clearAllPublishers: () => Promise<void> | void;
  resetAllCongregationData: () => void;
  restorePreviousRegistration: (congName?: string, coordName?: string, pin?: string) => Promise<void>;
  uploadLocalDataToGoogle: () => Promise<{ success: boolean; message: string }>;
  downloadDataFromGoogle: () => Promise<{ success: boolean; message: string }>;
  loadCongregationFromCloud: (congId: string) => Promise<{ success: boolean; congregationName?: string; message: string; data?: any }>;

  // Account Link Requests (Vinculación de Cuentas de Google)
  accountLinkRequests: AccountLinkRequest[];
  createAccountLinkRequest: (
    email: string,
    brotherName: string,
    personalPin: string,
    role: string,
    congregationId: string
  ) => Promise<AccountLinkRequest>;
  approveAccountLinkRequest: (
    requestId: string,
    reviewerEmail: string
  ) => Promise<void>;
  rejectAccountLinkRequest: (
    requestId: string,
    reviewerEmail: string,
    reason?: string
  ) => Promise<void>;
}

const LOCAL_STORAGE_KEY = 'teocratic_app_data_v1';

export function unifyAudioVideoDuties(dutiesList: CustomDuty[]): CustomDuty[] {
  if (!Array.isArray(dutiesList) || dutiesList.length === 0) return INITIAL_CUSTOM_DUTIES;
  const filtered = dutiesList.filter(d => d.key !== 'deber_video');
  const audioDuty = filtered.find(d => d.key === 'deber_audio');
  if (audioDuty) {
    audioDuty.name = 'Audio y Video';
    audioDuty.description = 'Control de cabina, audio, video y pantallas en la reunión';
    audioDuty.maxPeople = Math.max(audioDuty.maxPeople || 1, 2);
  } else {
    filtered.unshift({
      id: 'duty-audio',
      key: 'deber_audio',
      name: 'Audio y Video',
      description: 'Control de cabina, audio, video y pantallas en la reunión',
      midweek: true,
      weekend: true,
      maxPeople: 2,
    });
  }
  return filtered;
}

export function unifyWeeksDuties(weekList: WeekSchedule[]): WeekSchedule[] {
  return weekList.map(w => {
    let modified = false;
    const midDuties = { ...(w.midweek?.duties || {}) };
    if (midDuties.deber_video && midDuties.deber_video.length > 0) {
      midDuties.deber_audio = Array.from(new Set([...(midDuties.deber_audio || []), ...midDuties.deber_video]));
      delete midDuties.deber_video;
      modified = true;
    }
    const endDuties = { ...(w.weekend?.duties || {}) };
    if (endDuties.deber_video && endDuties.deber_video.length > 0) {
      endDuties.deber_audio = Array.from(new Set([...(endDuties.deber_audio || []), ...endDuties.deber_video]));
      delete endDuties.deber_video;
      modified = true;
    }
    if (modified) {
      return {
        ...w,
        midweek: { ...w.midweek, duties: midDuties },
        weekend: { ...w.weekend, duties: endDuties },
      };
    }
    return w;
  });
}

const CongregationContext = createContext<CongregationContextType | null>(null);

export const CongregationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, assignRoleToEmail } = useAuth();

  const [publishers, setPublishers] = useState<Publisher[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_publishers`);
    return saved !== null ? JSON.parse(saved) : INITIAL_PUBLISHERS;
  });

  const [weeks, setWeeks] = useState<WeekSchedule[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_weeks`);
    const initialRaw: WeekSchedule[] = saved ? JSON.parse(saved) : generateInitialWeeks();
    const mapped = initialRaw.map(w => {
      if (isWeekNeedingOrganizedSync(w)) {
        const org = getOrganizedScheduleForWeek(w.id, w.weekStartDate);
        return org ? applyOrganizedToWeek(w, org) : w;
      }
      return w;
    });
    return unifyWeeksDuties(mapped);
  });

  const [currentWeekId, setCurrentWeekId] = useState<string>(() => {
    return weeks[0]?.id || '';
  });

  const [preachingGroups, setPreachingGroups] = useState<PreachingGroup[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_groups`);
    return saved ? JSON.parse(saved) : INITIAL_PREACHING_GROUPS;
  });

  const [customDuties, setCustomDuties] = useState<CustomDuty[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_duties`);
    const raw = saved ? JSON.parse(saved) : INITIAL_CUSTOM_DUTIES;
    return unifyAudioVideoDuties(raw);
  });

  const [settings, setSettings] = useState<CongregationSettings>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_settings`) || localStorage.getItem('kongre_saved_settings_backup');
      const confirmedName = localStorage.getItem('kongre_user_confirmed_name');
      const confirmedMidDay = localStorage.getItem('kongre_user_confirmed_midweek_day');
      const confirmedMidTime = localStorage.getItem('kongre_user_confirmed_midweek_time');
      const confirmedFdsDay = localStorage.getItem('kongre_user_confirmed_weekend_day');
      const confirmedFdsTime = localStorage.getItem('kongre_user_confirmed_weekend_time');
      const confirmedAddress = localStorage.getItem('kongre_user_confirmed_address');

      const storedCongName = confirmedName || localStorage.getItem('kongre_congregation_name') || '';
      const storedMidDay = confirmedMidDay || localStorage.getItem('kongre_midweek_day');
      const storedMidTime = confirmedMidTime || localStorage.getItem('kongre_midweek_time');
      const storedFdsDay = confirmedFdsDay || localStorage.getItem('kongre_weekend_day');
      const storedFdsTime = confirmedFdsTime || localStorage.getItem('kongre_weekend_time');
      const storedAddress = confirmedAddress !== null && confirmedAddress !== undefined ? confirmedAddress : localStorage.getItem('kongre_hall_address');

      if (saved) {
        const parsed = JSON.parse(saved);
        const rawName = confirmedName || parsed.congregationName || storedCongName;
        const cleanName =
          rawName && !isCongregationIdString(rawName)
            ? rawName
            : rawName || '';
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          congregationName: cleanName || parsed.congregationName || storedCongName || '',
          midweekMeetingDay: confirmedMidDay || parsed.midweekMeetingDay || storedMidDay || INITIAL_SETTINGS.midweekMeetingDay,
          midweekMeetingTime: confirmedMidTime || parsed.midweekMeetingTime || storedMidTime || INITIAL_SETTINGS.midweekMeetingTime,
          weekendMeetingDay: confirmedFdsDay || parsed.weekendMeetingDay || storedFdsDay || INITIAL_SETTINGS.weekendMeetingDay,
          weekendMeetingTime: confirmedFdsTime || parsed.weekendMeetingTime || storedFdsTime || INITIAL_SETTINGS.weekendMeetingTime,
          hallAddress: (confirmedAddress !== null && confirmedAddress !== undefined) ? confirmedAddress : (parsed.hallAddress || storedAddress || INITIAL_SETTINGS.hallAddress),
          isRegistered: parsed.isRegistered || Boolean(cleanName) || localStorage.getItem('kongre_is_registered_congregation') === 'true',
          conflictRules: {
            ...INITIAL_SETTINGS.conflictRules,
            ...(parsed.conflictRules || {}),
          },
        };
      } else if (storedCongName) {
        return {
          ...INITIAL_SETTINGS,
          congregationName: storedCongName,
          midweekMeetingDay: storedMidDay || INITIAL_SETTINGS.midweekMeetingDay,
          midweekMeetingTime: storedMidTime || INITIAL_SETTINGS.midweekMeetingTime,
          weekendMeetingDay: storedFdsDay || INITIAL_SETTINGS.weekendMeetingDay,
          weekendMeetingTime: storedFdsTime || INITIAL_SETTINGS.weekendMeetingTime,
          hallAddress: storedAddress || INITIAL_SETTINGS.hallAddress,
          isRegistered: true,
        };
      }
    } catch {
      // fallback
    }
    return INITIAL_SETTINGS;
  });

  const skipNextSnapshotEchoRef = useRef(false);
  const latestSettingsRef = useRef<CongregationSettings>(settings);
  useEffect(() => {
    latestSettingsRef.current = settings;
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(settings));
      localStorage.setItem('kongre_saved_settings_backup', JSON.stringify(settings));
      if (settings.congregationName?.trim() && !isCongregationIdString(settings.congregationName)) {
        localStorage.setItem('kongre_congregation_name', settings.congregationName.trim());
      }
      if (settings.midweekMeetingDay) localStorage.setItem('kongre_midweek_day', settings.midweekMeetingDay);
      if (settings.midweekMeetingTime) localStorage.setItem('kongre_midweek_time', settings.midweekMeetingTime);
      if (settings.weekendMeetingDay) localStorage.setItem('kongre_weekend_day', settings.weekendMeetingDay);
      if (settings.weekendMeetingTime) localStorage.setItem('kongre_weekend_time', settings.weekendMeetingTime);
    } catch {}
  }, [settings]);

  const [outgoingSpeakers, setOutgoingSpeakers] = useState<OutgoingSpeakerAssignment[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_outgoing_speakers`);
    return saved ? JSON.parse(saved) : INITIAL_OUTGOING_SPEAKERS;
  });

  const [hospitalityHosts, setHospitalityHosts] = useState<HospitalityHost[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_hospitality_hosts`);
      return saved ? JSON.parse(saved) : INITIAL_HOSPITALITY_HOSTS;
    } catch {
      return INITIAL_HOSPITALITY_HOSTS;
    }
  });

  const [breakers, setBreakers] = useState<Breaker[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_breakers`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isAllSample =
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every((b: any) => typeof b.id === 'string' && /^brk-([1-9]|1[0-2])$/.test(b.id));
        if (isAllSample) {
          localStorage.removeItem(`${LOCAL_STORAGE_KEY}_breakers`);
          return [];
        }
        return parsed;
      }
      return INITIAL_BREAKERS;
    } catch {
      return INITIAL_BREAKERS;
    }
  });

  const [maintenanceSheets, setMaintenanceSheets] = useState<MaintenanceSheet[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_maintenance_sheets`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isAllSample =
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every((s: any) => typeof s.id === 'string' && /^maint-[1-8]$/.test(s.id));
        if (isAllSample) {
          localStorage.removeItem(`${LOCAL_STORAGE_KEY}_maintenance_sheets`);
          return [];
        }
        return parsed;
      }
      return INITIAL_MAINTENANCE_SHEETS;
    } catch {
      return INITIAL_MAINTENANCE_SHEETS;
    }
  });

  const [auxPioneerRequests, setAuxPioneerRequests] = useState<AuxPioneerRequest[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_aux_pioneer_requests`);
      return saved ? JSON.parse(saved) : INITIAL_AUX_PIONEER_REQUESTS;
    } catch {
      return INITIAL_AUX_PIONEER_REQUESTS;
    }
  });

  const [branchReportsS1, setBranchReportsS1] = useState<BranchReportS1[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_branch_reports_s1`);
      return saved ? JSON.parse(saved) : INITIAL_BRANCH_REPORTS_S1;
    } catch {
      return INITIAL_BRANCH_REPORTS_S1;
    }
  });

  const [fieldServiceMeetings, setFieldServiceMeetings] = useState<FieldServiceMeeting[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_field_service`);
    return saved ? JSON.parse(saved) : INITIAL_FIELD_SERVICE_MEETINGS;
  });

  const [cartLocations, setCartLocations] = useState<CartLocation[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_cart_locations`);
    return saved ? JSON.parse(saved) : INITIAL_CART_LOCATIONS;
  });

  const [cartShifts, setCartShifts] = useState<CartShift[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_cart_shifts`);
    return saved ? JSON.parse(saved) : INITIAL_CART_SHIFTS;
  });

  const [notices, setNotices] = useState<CongregationNotice[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_notices`);
    return saved ? JSON.parse(saved) : INITIAL_NOTICES;
  });

  const [monthlyReports, setMonthlyReports] = useState<MonthlyServiceReport[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_monthly_reports`);
    return saved ? JSON.parse(saved) : INITIAL_MONTHLY_REPORTS;
  });

  const [territories, setTerritories] = useState<Territory[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_territories`);
    return saved ? JSON.parse(saved) : INITIAL_TERRITORIES;
  });

  const [circuitVisit, setCircuitVisit] = useState<CircuitOverseerVisit | null>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_circuit_visit`);
    return saved ? JSON.parse(saved) : INITIAL_CIRCUIT_VISIT;
  });

  const [transactions, setTransactions] = useState<AccountTransaction[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_transactions`);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [quarterlyAudits, setQuarterlyAudits] = useState<QuarterlyAudit[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_quarterly_audits`);
    return saved ? JSON.parse(saved) : INITIAL_QUARTERLY_AUDITS;
  });

  const [memorialPlans, setMemorialPlans] = useState<MemorialPlan[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_memorial_plans`);
    return saved ? JSON.parse(saved) : INITIAL_MEMORIAL_PLANS;
  });

  const [theocraticAssemblies, setTheocraticAssemblies] = useState<TheocraticAssembly[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_assemblies`);
    return saved ? JSON.parse(saved) : INITIAL_ASSEMBLIES;
  });

  const [literatureItems, setLiteratureItems] = useState<LiteratureItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_literature_items`);
    return saved ? JSON.parse(saved) : INITIAL_LITERATURE_ITEMS;
  });

  const [specialOrders, setSpecialOrders] = useState<LiteratureSpecialOrder[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_special_orders`);
    return saved ? JSON.parse(saved) : INITIAL_SPECIAL_ORDERS;
  });

  const [groupDistributions, setGroupDistributions] = useState<LiteratureGroupDistribution[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_group_distributions`);
    return saved ? JSON.parse(saved) : INITIAL_GROUP_DISTRIBUTIONS;
  });

  const [inventoryRecords, setInventoryRecords] = useState<LiteratureInventoryRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_inventory_records`);
    return saved ? JSON.parse(saved) : INITIAL_LITERATURE_INVENTORY_RECORDS;
  });

  const [accountLinkRequests, setAccountLinkRequests] = useState<AccountLinkRequest[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_account_link_requests`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(
      `${LOCAL_STORAGE_KEY}_account_link_requests`,
      JSON.stringify(accountLinkRequests)
    );
  }, [accountLinkRequests]);

  // CLM Programas (Vida y Ministerio Cristianos) State
  const [clmProgramas, setClmProgramas] = useState<Record<string, ClmPrograma>>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_clm_programas`);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem(
      `${LOCAL_STORAGE_KEY}_clm_programas`,
      JSON.stringify(clmProgramas)
    );
  }, [clmProgramas]);

  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline' | 'error'>(
    user ? 'synced' : 'offline'
  );

  // Publishers quick map
  const publishersMap = useMemo(() => {
    const map = new Map<string, Publisher>();
    publishers.forEach(p => map.set(p.id, p));
    return map;
  }, [publishers]);

  // Current active week object
  const currentWeek = useMemo(() => {
    return weeks.find(w => w.id === currentWeekId) || weeks[0];
  }, [weeks, currentWeekId]);

  // Cache locally
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_publishers`, JSON.stringify(publishers));
  }, [publishers]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_weeks`, JSON.stringify(weeks));
  }, [weeks]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_groups`, JSON.stringify(preachingGroups));
  }, [preachingGroups]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_duties`, JSON.stringify(customDuties));
  }, [customDuties]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_outgoing_speakers`, JSON.stringify(outgoingSpeakers));
  }, [outgoingSpeakers]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_field_service`, JSON.stringify(fieldServiceMeetings));
  }, [fieldServiceMeetings]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_cart_locations`, JSON.stringify(cartLocations));
  }, [cartLocations]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_cart_shifts`, JSON.stringify(cartShifts));
  }, [cartShifts]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_notices`, JSON.stringify(notices));
  }, [notices]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_monthly_reports`, JSON.stringify(monthlyReports));
  }, [monthlyReports]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_territories`, JSON.stringify(territories));
  }, [territories]);

  useEffect(() => {
    if (circuitVisit) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_circuit_visit`, JSON.stringify(circuitVisit));
    }
  }, [circuitVisit]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_transactions`, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_quarterly_audits`, JSON.stringify(quarterlyAudits));
  }, [quarterlyAudits]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_memorial_plans`, JSON.stringify(memorialPlans));
  }, [memorialPlans]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_assemblies`, JSON.stringify(theocraticAssemblies));
  }, [theocraticAssemblies]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_literature_items`, JSON.stringify(literatureItems));
  }, [literatureItems]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_special_orders`, JSON.stringify(specialOrders));
  }, [specialOrders]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_group_distributions`, JSON.stringify(groupDistributions));
  }, [groupDistributions]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_inventory_records`, JSON.stringify(inventoryRecords));
  }, [inventoryRecords]);

  // Helper que obtiene el snapshot más reciente y fidedigno de los datos locales en localStorage
  const getFreshLocalCongregationData = () => {
    const parseKey = <T,>(key: string, fallback: T): T => {
      try {
        const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${key}`);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    };

    const savedPubs = parseKey<Publisher[]>('publishers', publishers);
    const savedWeeks = parseKey<WeekSchedule[]>('weeks', weeks);
    const savedSettings = parseKey<CongregationSettings>('settings', settings);
    const savedGroups = parseKey<PreachingGroup[]>('groups', preachingGroups);
    const savedDuties = parseKey<CustomDuty[]>('duties', customDuties);
    const savedOutgoing = parseKey<OutgoingSpeakerAssignment[]>('outgoing_speakers', outgoingSpeakers);
    const savedMeetings = parseKey<FieldServiceMeeting[]>('field_service', fieldServiceMeetings);
    const savedCartLocs = parseKey<CartLocation[]>('cart_locations', cartLocations);
    const savedCartShifts = parseKey<CartShift[]>('cart_shifts', cartShifts);
    const savedNotices = parseKey<CongregationNotice[]>('notices', notices);
    const savedReports = parseKey<MonthlyServiceReport[]>('monthly_reports', monthlyReports);
    const savedTerritories = parseKey<Territory[]>('territories', territories);
    const savedCircuitVisit = parseKey<CircuitOverseerVisit | null>('circuit_visit', circuitVisit);
    const savedTransactions = parseKey<AccountTransaction[]>('transactions', transactions);
    const savedAudits = parseKey<QuarterlyAudit[]>('quarterly_audits', quarterlyAudits);
    const savedMemorial = parseKey<MemorialPlan[]>('memorial_plans', memorialPlans);
    const savedAssemblies = parseKey<TheocraticAssembly[]>('assemblies', theocraticAssemblies);
    const savedLitItems = parseKey<LiteratureItem[]>('literature_items', literatureItems);
    const savedSpecialOrders = parseKey<LiteratureSpecialOrder[]>('special_orders', specialOrders);
    const savedGroupDist = parseKey<LiteratureGroupDistribution[]>('group_distributions', groupDistributions);
    const savedInvRecords = parseKey<LiteratureInventoryRecord[]>('inventory_records', inventoryRecords);
    const savedLinkRequests = parseKey<AccountLinkRequest[]>('account_link_requests', accountLinkRequests);
    const savedClm = parseKey<Record<string, ClmPrograma>>('clm_programas', clmProgramas);
    const savedHosts = parseKey<HospitalityHost[]>('hospitality_hosts', hospitalityHosts);
    const savedBreakers = parseKey<Breaker[]>('breakers', breakers);
    const savedMaintenance = parseKey<MaintenanceSheet[]>('maintenance_sheets', maintenanceSheets);
    const savedAuxPioneer = parseKey<AuxPioneerRequest[]>('aux_pioneer_requests', auxPioneerRequests);
    const savedBranchS1 = parseKey<BranchReportS1[]>('branch_reports_s1', branchReportsS1);

    return {
      publishers: Array.isArray(savedPubs) && savedPubs.length > 0 ? savedPubs : publishers,
      weeks: Array.isArray(savedWeeks) && savedWeeks.length > 0 ? savedWeeks : weeks,
      settings: savedSettings && savedSettings.congregationName ? savedSettings : settings,
      preachingGroups: Array.isArray(savedGroups) ? savedGroups : preachingGroups,
      customDuties: Array.isArray(savedDuties) ? savedDuties : customDuties,
      outgoingSpeakers: Array.isArray(savedOutgoing) ? savedOutgoing : outgoingSpeakers,
      fieldServiceMeetings: Array.isArray(savedMeetings) ? savedMeetings : fieldServiceMeetings,
      cartLocations: Array.isArray(savedCartLocs) ? savedCartLocs : cartLocations,
      cartShifts: Array.isArray(savedCartShifts) ? savedCartShifts : cartShifts,
      notices: Array.isArray(savedNotices) ? savedNotices : notices,
      monthlyReports: Array.isArray(savedReports) ? savedReports : monthlyReports,
      territories: Array.isArray(savedTerritories) ? savedTerritories : territories,
      circuitVisit: savedCircuitVisit !== undefined ? savedCircuitVisit : circuitVisit,
      transactions: Array.isArray(savedTransactions) ? savedTransactions : transactions,
      quarterlyAudits: Array.isArray(savedAudits) ? savedAudits : quarterlyAudits,
      memorialPlans: Array.isArray(savedMemorial) ? savedMemorial : memorialPlans,
      theocraticAssemblies: Array.isArray(savedAssemblies) ? savedAssemblies : theocraticAssemblies,
      literatureItems: Array.isArray(savedLitItems) ? savedLitItems : literatureItems,
      specialOrders: Array.isArray(savedSpecialOrders) ? savedSpecialOrders : specialOrders,
      groupDistributions: Array.isArray(savedGroupDist) ? savedGroupDist : groupDistributions,
      inventoryRecords: Array.isArray(savedInvRecords) ? savedInvRecords : inventoryRecords,
      accountLinkRequests: Array.isArray(savedLinkRequests) ? savedLinkRequests : accountLinkRequests,
      clmProgramas: savedClm && Object.keys(savedClm).length > 0 ? savedClm : clmProgramas,
      hospitalityHosts: Array.isArray(savedHosts) ? savedHosts : hospitalityHosts,
      breakers: Array.isArray(savedBreakers) ? savedBreakers : breakers,
      maintenanceSheets: Array.isArray(savedMaintenance) ? savedMaintenance : maintenanceSheets,
      auxPioneerRequests: Array.isArray(savedAuxPioneer) ? savedAuxPioneer : auxPioneerRequests,
      branchReportsS1: Array.isArray(savedBranchS1) ? savedBranchS1 : branchReportsS1,
    };
  };

  // Helper centralizado para hidratar estado y localStorage desde datos de Firestore
  const hydrateAllFromData = (data: any) => {
    if (!data) return;

    if (data.publishers && Array.isArray(data.publishers)) {
      setPublishers(data.publishers);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_publishers`, JSON.stringify(data.publishers));
    }
    if (data.weeks && Array.isArray(data.weeks)) {
      const enrichedWeeks = data.weeks.map((w: WeekSchedule) => {
        if (isWeekNeedingOrganizedSync(w)) {
          const org = getOrganizedScheduleForWeek(w.id, w.weekStartDate);
          return org ? applyOrganizedToWeek(w, org) : w;
        }
        return w;
      });
      setWeeks(enrichedWeeks);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_weeks`, JSON.stringify(enrichedWeeks));
    }
    if (data.preachingGroups && Array.isArray(data.preachingGroups)) {
      setPreachingGroups(data.preachingGroups);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_groups`, JSON.stringify(data.preachingGroups));
    }
    if (data.customDuties && Array.isArray(data.customDuties)) {
      const unifiedDuties = unifyAudioVideoDuties(data.customDuties);
      setCustomDuties(unifiedDuties);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_duties`, JSON.stringify(unifiedDuties));
    }
    if (data.settings) {
      let currentLocal: CongregationSettings | null = null;
      try {
        const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_settings`) || localStorage.getItem('kongre_saved_settings_backup');
        if (saved) currentLocal = JSON.parse(saved);
      } catch {}

      const hasUserSavedLocally = localStorage.getItem('kongre_settings_user_saved') === 'true';
      const userConfirmedName = localStorage.getItem('kongre_user_confirmed_name');
      const userConfirmedMidDay = localStorage.getItem('kongre_user_confirmed_midweek_day');
      const userConfirmedMidTime = localStorage.getItem('kongre_user_confirmed_midweek_time');
      const userConfirmedFdsDay = localStorage.getItem('kongre_user_confirmed_weekend_day');
      const userConfirmedFdsTime = localStorage.getItem('kongre_user_confirmed_weekend_time');
      const userConfirmedAddress = localStorage.getItem('kongre_user_confirmed_address');

      const localStoredName = userConfirmedName || localStorage.getItem('kongre_congregation_name');
      const localName = (userConfirmedName || currentLocal?.congregationName || localStoredName || settings.congregationName || '').trim();
      const cloudName = (data.settings.congregationName || '').trim();

      const isLocalRealName = Boolean(localName && !isCongregationIdString(localName));
      const isCloudRealName = Boolean(cloudName && !isCongregationIdString(cloudName));

      // Comprobar marcas de tiempo ESPECÍFICAS de configuración
      const lastSettingsUpdate = localStorage.getItem('kongre_last_settings_update') || currentLocal?.updatedAt || '';
      const cloudSettingsUpdatedAt = data.settings?.updatedAt || '';

      // La nube solo tiene prioridad si la configuración de la nube fue guardada explícitamente después del guardado local
      // Y contiene datos válidos
      const isCloudSettingsNewer = Boolean(
        cloudSettingsUpdatedAt &&
        lastSettingsUpdate &&
        cloudSettingsUpdatedAt > lastSettingsUpdate &&
        isCloudRealName
      );

      // Decidir el nombre oficial: Si el usuario guardó localmente mediante "Guardar", protegerlo absolutamente
      let finalCongName = '';
      if (hasUserSavedLocally && (userConfirmedName || isLocalRealName) && !isCloudSettingsNewer) {
        finalCongName = userConfirmedName || localName;
      } else if (isLocalRealName && !isCloudRealName) {
        finalCongName = localName;
      } else if (isCloudRealName && !isLocalRealName) {
        finalCongName = cloudName;
      } else if (isLocalRealName && isCloudRealName) {
        finalCongName = isCloudSettingsNewer ? cloudName : (userConfirmedName || localName);
      } else {
        finalCongName = userConfirmedName || localName || cloudName || '';
      }

      // Decidir los días y horarios: Si el usuario guardó localmente mediante el botón Guardar, PRESERVAR local
      const finalMidDay = (hasUserSavedLocally && userConfirmedMidDay && !isCloudSettingsNewer)
        ? userConfirmedMidDay
        : (isCloudSettingsNewer && data.settings.midweekMeetingDay
          ? data.settings.midweekMeetingDay
          : (userConfirmedMidDay || currentLocal?.midweekMeetingDay || localStorage.getItem('kongre_midweek_day') || data.settings.midweekMeetingDay || 'Miércoles'));

      const finalMidTime = (hasUserSavedLocally && userConfirmedMidTime && !isCloudSettingsNewer)
        ? userConfirmedMidTime
        : (isCloudSettingsNewer && data.settings.midweekMeetingTime
          ? data.settings.midweekMeetingTime
          : (userConfirmedMidTime || currentLocal?.midweekMeetingTime || localStorage.getItem('kongre_midweek_time') || data.settings.midweekMeetingTime || '19:00'));

      const finalFdsDay = (hasUserSavedLocally && userConfirmedFdsDay && !isCloudSettingsNewer)
        ? userConfirmedFdsDay
        : (isCloudSettingsNewer && data.settings.weekendMeetingDay
          ? data.settings.weekendMeetingDay
          : (userConfirmedFdsDay || currentLocal?.weekendMeetingDay || localStorage.getItem('kongre_weekend_day') || data.settings.weekendMeetingDay || 'Domingo'));

      const finalFdsTime = (hasUserSavedLocally && userConfirmedFdsTime && !isCloudSettingsNewer)
        ? userConfirmedFdsTime
        : (isCloudSettingsNewer && data.settings.weekendMeetingTime
          ? data.settings.weekendMeetingTime
          : (userConfirmedFdsTime || currentLocal?.weekendMeetingTime || localStorage.getItem('kongre_weekend_time') || data.settings.weekendMeetingTime || '10:00'));

      const finalAddress = (hasUserSavedLocally && userConfirmedAddress !== null && userConfirmedAddress !== undefined && !isCloudSettingsNewer)
        ? (userConfirmedAddress || '')
        : (isCloudSettingsNewer && data.settings.hallAddress !== undefined
          ? data.settings.hallAddress
          : (userConfirmedAddress || currentLocal?.hallAddress || localStorage.getItem('kongre_hall_address') || data.settings.hallAddress || ''));

      const isReg = Boolean(
        data.settings.isRegistered ||
        currentLocal?.isRegistered ||
        settings.isRegistered ||
        Boolean(finalCongName && finalCongName.trim() !== '') ||
        (data.publishers && data.publishers.length > 0)
      );

      const isLocalNewer = !isCloudSettingsNewer;

      const baseMerged = isLocalNewer
        ? { ...INITIAL_SETTINGS, ...data.settings, ...(currentLocal || {}) }
        : { ...INITIAL_SETTINGS, ...(currentLocal || {}), ...data.settings };

      const enrichedSettings: CongregationSettings = {
        ...baseMerged,
        congregationName: finalCongName,
        midweekMeetingDay: finalMidDay,
        midweekMeetingTime: finalMidTime,
        weekendMeetingDay: finalFdsDay,
        weekendMeetingTime: finalFdsTime,
        hallAddress: finalAddress,
        isRegistered: isReg,
        coordinatorEmail: (isLocalNewer ? currentLocal?.coordinatorEmail : data.settings.coordinatorEmail) || currentLocal?.coordinatorEmail || data.settings.coordinatorEmail || user?.email || '',
        coordinatorName: (isLocalNewer ? currentLocal?.coordinatorName : data.settings.coordinatorName) || currentLocal?.coordinatorName || data.settings.coordinatorName || user?.displayName || 'Coordinador',
      };

      setSettings(enrichedSettings);
      latestSettingsRef.current = enrichedSettings;
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(enrichedSettings));
        localStorage.setItem('kongre_saved_settings_backup', JSON.stringify(enrichedSettings));
        if (finalCongName) {
          localStorage.setItem('kongre_congregation_name', finalCongName);
        }
        localStorage.setItem('kongre_midweek_day', finalMidDay);
        localStorage.setItem('kongre_midweek_time', finalMidTime);
        localStorage.setItem('kongre_weekend_day', finalFdsDay);
        localStorage.setItem('kongre_weekend_time', finalFdsTime);
        if (finalAddress) {
          localStorage.setItem('kongre_hall_address', finalAddress);
        }
      } catch {}
      if (isReg) {
        localStorage.setItem('kongre_is_registered_congregation', 'true');
        localStorage.setItem('kongre_has_entered_app', 'true');
      }
    }
    if (data.outgoingSpeakers && Array.isArray(data.outgoingSpeakers)) {
      setOutgoingSpeakers(data.outgoingSpeakers);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_outgoing_speakers`, JSON.stringify(data.outgoingSpeakers));
    }
    if (data.fieldServiceMeetings && Array.isArray(data.fieldServiceMeetings)) {
      setFieldServiceMeetings(data.fieldServiceMeetings);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_field_service`, JSON.stringify(data.fieldServiceMeetings));
    }
    if (data.cartLocations && Array.isArray(data.cartLocations)) {
      setCartLocations(data.cartLocations);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_cart_locations`, JSON.stringify(data.cartLocations));
    }
    if (data.cartShifts && Array.isArray(data.cartShifts)) {
      setCartShifts(data.cartShifts);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_cart_shifts`, JSON.stringify(data.cartShifts));
    }
    if (data.notices && Array.isArray(data.notices)) {
      setNotices(data.notices);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_notices`, JSON.stringify(data.notices));
    }
    if (data.monthlyReports && Array.isArray(data.monthlyReports)) {
      setMonthlyReports(data.monthlyReports);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_monthly_reports`, JSON.stringify(data.monthlyReports));
    }
    if (data.territories && Array.isArray(data.territories)) {
      setTerritories(data.territories);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_territories`, JSON.stringify(data.territories));
    }
    if (data.circuitVisit !== undefined) {
      setCircuitVisit(data.circuitVisit);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_circuit_visit`, JSON.stringify(data.circuitVisit));
    }
    if (data.transactions && Array.isArray(data.transactions)) {
      setTransactions(data.transactions);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_transactions`, JSON.stringify(data.transactions));
    }
    if (data.quarterlyAudits && Array.isArray(data.quarterlyAudits)) {
      setQuarterlyAudits(data.quarterlyAudits);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_quarterly_audits`, JSON.stringify(data.quarterlyAudits));
    }
    if (data.memorialPlans && Array.isArray(data.memorialPlans)) {
      setMemorialPlans(data.memorialPlans);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_memorial_plans`, JSON.stringify(data.memorialPlans));
    }
    if (data.theocraticAssemblies && Array.isArray(data.theocraticAssemblies)) {
      setTheocraticAssemblies(data.theocraticAssemblies);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_assemblies`, JSON.stringify(data.theocraticAssemblies));
    }
    if (data.literatureItems && Array.isArray(data.literatureItems)) {
      setLiteratureItems(data.literatureItems);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_literature_items`, JSON.stringify(data.literatureItems));
    }
    if (data.specialOrders && Array.isArray(data.specialOrders)) {
      setSpecialOrders(data.specialOrders);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_special_orders`, JSON.stringify(data.specialOrders));
    }
    if (data.groupDistributions && Array.isArray(data.groupDistributions)) {
      setGroupDistributions(data.groupDistributions);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_group_distributions`, JSON.stringify(data.groupDistributions));
    }
    if (data.inventoryRecords && Array.isArray(data.inventoryRecords)) {
      setInventoryRecords(data.inventoryRecords);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_inventory_records`, JSON.stringify(data.inventoryRecords));
    }
    if (data.accountLinkRequests && Array.isArray(data.accountLinkRequests)) {
      setAccountLinkRequests(data.accountLinkRequests);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_account_link_requests`, JSON.stringify(data.accountLinkRequests));
    }
    if (data.clmProgramas && typeof data.clmProgramas === 'object') {
      setClmProgramas(data.clmProgramas);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_clm_programas`, JSON.stringify(data.clmProgramas));
    }
    if (data.hospitalityHosts && Array.isArray(data.hospitalityHosts)) {
      setHospitalityHosts(data.hospitalityHosts);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_hospitality_hosts`, JSON.stringify(data.hospitalityHosts));
    }
    if (data.breakers && Array.isArray(data.breakers)) {
      const isAllSample =
        data.breakers.length > 0 &&
        data.breakers.every((b: any) => typeof b.id === 'string' && /^brk-([1-9]|1[0-2])$/.test(b.id));
      if (!isAllSample) {
        setBreakers(data.breakers);
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_breakers`, JSON.stringify(data.breakers));
      } else {
        setBreakers([]);
        localStorage.removeItem(`${LOCAL_STORAGE_KEY}_breakers`);
      }
    }
    if (data.maintenanceSheets && Array.isArray(data.maintenanceSheets)) {
      const isAllSample =
        data.maintenanceSheets.length > 0 &&
        data.maintenanceSheets.every((s: any) => typeof s.id === 'string' && /^maint-[1-8]$/.test(s.id));
      if (!isAllSample) {
        setMaintenanceSheets(data.maintenanceSheets);
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_maintenance_sheets`, JSON.stringify(data.maintenanceSheets));
      } else {
        setMaintenanceSheets([]);
        localStorage.removeItem(`${LOCAL_STORAGE_KEY}_maintenance_sheets`);
      }
    }
    if (data.auxPioneerRequests && Array.isArray(data.auxPioneerRequests)) {
      setAuxPioneerRequests(data.auxPioneerRequests);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_aux_pioneer_requests`, JSON.stringify(data.auxPioneerRequests));
    }
    if (data.branchReportsS1 && Array.isArray(data.branchReportsS1)) {
      setBranchReportsS1(data.branchReportsS1);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_branch_reports_s1`, JSON.stringify(data.branchReportsS1));
    }
  };

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Firestore Sync: Load, listen and smart-merge when user logs in with Google
  useEffect(() => {
    if (!user) {
      setSyncStatus('offline');
      return;
    }

    if (isFirestoreQuotaExceeded()) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('saving');
    const userDocRef = doc(db, 'users', user.uid, 'congregation_data', 'main');

    let isInitialSnapshot = true;
    let skipNextSnapshotEcho = false;

    const unsubscribe = onSnapshot(
      userDocRef,
      async (docSnap) => {
        const nowISO = new Date().toISOString();

        if (!docSnap.exists()) {
          isInitialSnapshot = false;
          skipNextSnapshotEcho = true;
          // Primera vez que este usuario de Google se conecta y no tiene documento en la nube:
          if (isFirestoreQuotaExceeded()) {
            setSyncStatus('offline');
            return;
          }
          const fresh = getFreshLocalCongregationData();
          const cleanId = (
            fresh.settings.congregationNumber ||
            fresh.settings.congregationId ||
            settings.congregationNumber ||
            settings.congregationId ||
            ''
          ).trim().toUpperCase();

          const initialPayload = sanitizeForFirestore({
            ...fresh,
            settings: {
              ...fresh.settings,
              isRegistered: true,
              coordinatorEmail: fresh.settings.coordinatorEmail || user.email || '',
              coordinatorName: fresh.settings.coordinatorName || user.displayName || 'Coordinador',
            },
            congregationId: cleanId,
            updatedAt: nowISO,
          });

          try {
            await setDoc(userDocRef, initialPayload, { merge: true });
            if (cleanId) {
              const congDocRef = doc(db, 'congregations', cleanId);
              await setDoc(congDocRef, initialPayload, { merge: true });
            }
            localStorage.removeItem('kongre_needs_cloud_upload');
            localStorage.setItem('kongre_last_local_update', nowISO);
            localStorage.setItem('kongre_is_registered_congregation', 'true');
            setSyncStatus('synced');
          } catch (err) {
            if (isQuotaError(err)) {
              await markFirestoreQuotaExceeded();
              setSyncStatus('offline');
            } else {
              console.warn('Aviso guardando estado inicial en Firestore:', err);
              setSyncStatus('error');
            }
          }
          return;
        }

        const data = docSnap.data();

        // Ignorar snapshots emitidos por escrituras locales pendientes
        if (docSnap.metadata?.hasPendingWrites) {
          return;
        }

        // Si acabamos de subir los datos locales a Firestore, ignorar el eco que emite onSnapshot
        if (skipNextSnapshotEcho || skipNextSnapshotEchoRef.current) {
          skipNextSnapshotEcho = false;
          skipNextSnapshotEchoRef.current = false;
          setSyncStatus('synced');
          return;
        }

        // Si hay una operación de guardado local pendiente (debounce activo), no sobreescribir con datos desactualizados de la nube
        if (saveTimeoutRef.current) {
          return;
        }

        // Comprobar marcas temporales: si la versión local es más reciente que los datos de Firestore, no revertir el estado local
        const lastLocalTs = localStorage.getItem('kongre_last_local_update');
        const cloudTs = data?.updatedAt || data?.settings?.updatedAt;
        if (lastLocalTs && cloudTs && lastLocalTs > cloudTs) {
          return;
        }

        // En la primera conexión tras iniciar sesión con Google:
        if (isInitialSnapshot) {
          isInitialSnapshot = false;

          const fresh = getFreshLocalCongregationData();
          const needsCloudUpload = localStorage.getItem('kongre_needs_cloud_upload') === 'true';
          const lastLocalUpdate = localStorage.getItem('kongre_last_local_update');
          const isRegisteredLocally = localStorage.getItem('kongre_is_registered_congregation') === 'true';
          const cloudUpdatedAt = data?.updatedAt;

          const localHasRealCong = Boolean(
            fresh.publishers.length > 0 ||
            (fresh.settings && fresh.settings.isRegistered && fresh.settings.congregationName &&
              fresh.settings.congregationName !== 'Congregación Central' &&
              fresh.settings.congregationName !== 'Congregación El Olivar')
          );

          const cloudHasRealCong = Boolean(
            data.publishers && data.publishers.length > 0 &&
            data.settings?.congregationName &&
            data.settings.congregationName !== 'Congregación Central' &&
            data.settings.congregationName !== 'Congregación El Olivar'
          );

          // Si el usuario configuró datos localmente con credenciales de aplicación
          // o tiene cambios locales pendientes de sincronizar:
          const shouldUploadLocalToCloud = Boolean(
            needsCloudUpload ||
            (localHasRealCong && !cloudHasRealCong) ||
            (localHasRealCong && isRegisteredLocally && (!cloudUpdatedAt || (lastLocalUpdate && lastLocalUpdate >= cloudUpdatedAt))) ||
            (localHasRealCong && fresh.settings.congregationName && data.settings?.congregationName && fresh.settings.congregationName !== data.settings.congregationName && isRegisteredLocally)
          );

          if (shouldUploadLocalToCloud) {
            if (isFirestoreQuotaExceeded()) {
              setSyncStatus('offline');
              return;
            }
            skipNextSnapshotEcho = true;
            const cleanId = (
              fresh.settings.congregationNumber ||
              fresh.settings.congregationId ||
              settings.congregationNumber ||
              settings.congregationId ||
              ''
            ).trim().toUpperCase();

            const uploadPayload = sanitizeForFirestore({
              ...fresh,
              settings: {
                ...fresh.settings,
                isRegistered: true,
                coordinatorEmail: fresh.settings.coordinatorEmail || user.email || '',
                coordinatorName: fresh.settings.coordinatorName || user.displayName || 'Coordinador',
              },
              congregationId: cleanId,
              updatedAt: nowISO,
            });

            try {
              await setDoc(userDocRef, uploadPayload, { merge: true });
              if (cleanId) {
                const congDocRef = doc(db, 'congregations', cleanId);
                await setDoc(congDocRef, uploadPayload, { merge: true });
              }
              localStorage.removeItem('kongre_needs_cloud_upload');
              localStorage.setItem('kongre_last_local_update', nowISO);
              localStorage.setItem('kongre_is_registered_congregation', 'true');
              setSyncStatus('synced');
            } catch (err) {
              if (isQuotaError(err)) {
                await markFirestoreQuotaExceeded();
                setSyncStatus('offline');
              } else {
                console.warn('Aviso actualizando Firestore con datos locales:', err);
              }
            }
            return;
          }
        }

        // Hidratar estado y localStorage desde Firestore
        hydrateAllFromData(data);
        setSyncStatus('synced');
      },
      (err) => {
        if (isQuotaError(err)) {
          markFirestoreQuotaExceeded();
          setSyncStatus('offline');
          return;
        }
        console.warn('Aviso de listener Firestore:', err);
        setSyncStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Helper to sync changes to Firestore whenever state updates (with debounce & quota guard)
  const saveToFirestore = async (
    newPubs = publishers,
    newWeeks = weeks,
    newGroups = preachingGroups,
    newDuties = customDuties,
    newSettings = latestSettingsRef.current,
    newOutgoing = outgoingSpeakers,
    newFieldService = fieldServiceMeetings,
    newCartLocs = cartLocations,
    newCartShifts = cartShifts,
    newNotices = notices,
    newReports = monthlyReports,
    newTerritories = territories,
    newCircuitVisit = circuitVisit,
    newTransactions = transactions,
    newQuarterlyAudits = quarterlyAudits,
    newMemorialPlans = memorialPlans,
    newAssemblies = theocraticAssemblies,
    newLiteratureItems = literatureItems,
    newSpecialOrders = specialOrders,
    newGroupDistributions = groupDistributions,
    newInventoryRecords = inventoryRecords,
    newAccountLinkRequests = accountLinkRequests,
    newClm = clmProgramas,
    options?: { immediate?: boolean }
  ) => {
    const nowISO = new Date().toISOString();
    localStorage.setItem('kongre_last_local_update', nowISO);

    // Resolver configuración asegurando que nunca se sobreescriba con estados antiguos de clausuras
    const baseSettings = latestSettingsRef.current;
    const resolvedSettings: CongregationSettings = {
      ...baseSettings,
      ...(newSettings || {}),
    };

    // Si el usuario guardó explícitamente sus datos mediante "Guardar", protegerlos siempre
    if (localStorage.getItem('kongre_settings_user_saved') === 'true') {
      const confirmedName = localStorage.getItem('kongre_user_confirmed_name');
      const confirmedMidDay = localStorage.getItem('kongre_user_confirmed_midweek_day');
      const confirmedMidTime = localStorage.getItem('kongre_user_confirmed_midweek_time');
      const confirmedFdsDay = localStorage.getItem('kongre_user_confirmed_weekend_day');
      const confirmedFdsTime = localStorage.getItem('kongre_user_confirmed_weekend_time');
      const confirmedAddress = localStorage.getItem('kongre_user_confirmed_address');

      if (confirmedName && (!resolvedSettings.congregationName || isCongregationIdString(resolvedSettings.congregationName))) {
        resolvedSettings.congregationName = confirmedName;
      }
      if (confirmedMidDay) resolvedSettings.midweekMeetingDay = confirmedMidDay;
      if (confirmedMidTime) resolvedSettings.midweekMeetingTime = confirmedMidTime;
      if (confirmedFdsDay) resolvedSettings.weekendMeetingDay = confirmedFdsDay;
      if (confirmedFdsTime) resolvedSettings.weekendMeetingTime = confirmedFdsTime;
      if (confirmedAddress !== null && confirmedAddress !== undefined) resolvedSettings.hallAddress = confirmedAddress;
    }

    // Asegurar persistencia local inmediata
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(resolvedSettings));
      localStorage.setItem('kongre_saved_settings_backup', JSON.stringify(resolvedSettings));
      if (resolvedSettings.congregationName?.trim() && !isCongregationIdString(resolvedSettings.congregationName)) {
        localStorage.setItem('kongre_congregation_name', resolvedSettings.congregationName.trim());
      }
      if (resolvedSettings.midweekMeetingDay) localStorage.setItem('kongre_midweek_day', resolvedSettings.midweekMeetingDay);
      if (resolvedSettings.midweekMeetingTime) localStorage.setItem('kongre_midweek_time', resolvedSettings.midweekMeetingTime);
      if (resolvedSettings.weekendMeetingDay) localStorage.setItem('kongre_weekend_day', resolvedSettings.weekendMeetingDay);
      if (resolvedSettings.weekendMeetingTime) localStorage.setItem('kongre_weekend_time', resolvedSettings.weekendMeetingTime);
      if (resolvedSettings.hallAddress) localStorage.setItem('kongre_hall_address', resolvedSettings.hallAddress);
    } catch {}

    // Si la cuota diaria fue superada, guardar de inmediato en local y suspender llamadas cloud
    if (isFirestoreQuotaExceeded()) {
      setSyncStatus('offline');
      return;
    }

    const congDocId = (
      resolvedSettings.congregationNumber ||
      resolvedSettings.congregationId ||
      latestSettingsRef.current.congregationNumber ||
      latestSettingsRef.current.congregationId ||
      ''
    ).trim().toUpperCase();

    const payload = sanitizeForFirestore({
      publishers: newPubs,
      weeks: newWeeks,
      preachingGroups: newGroups,
      customDuties: newDuties,
      settings: resolvedSettings,
      outgoingSpeakers: newOutgoing,
      fieldServiceMeetings: newFieldService,
      cartLocations: newCartLocs,
      cartShifts: newCartShifts,
      notices: newNotices,
      monthlyReports: newReports,
      territories: newTerritories,
      circuitVisit: newCircuitVisit,
      transactions: newTransactions,
      quarterlyAudits: newQuarterlyAudits,
      memorialPlans: newMemorialPlans,
      theocraticAssemblies: newAssemblies,
      literatureItems: newLiteratureItems,
      specialOrders: newSpecialOrders,
      groupDistributions: newGroupDistributions,
      inventoryRecords: newInventoryRecords,
      accountLinkRequests: newAccountLinkRequests,
      clmProgramas: newClm,
      hospitalityHosts,
      breakers,
      maintenanceSheets,
      auxPioneerRequests,
      branchReportsS1,
      congregationId: congDocId,
      updatedAt: nowISO,
    });

    const activeUser = user || auth.currentUser;
    if (!activeUser && !congDocId) {
      localStorage.setItem('kongre_needs_cloud_upload', 'true');
      setSyncStatus('synced');
      return;
    }

    const executeCloudWrite = async () => {
      if (isFirestoreQuotaExceeded()) {
        setSyncStatus('offline');
        return;
      }

      try {
        skipNextSnapshotEchoRef.current = true;
        if (activeUser) {
          const userDocRef = doc(db, 'users', activeUser.uid, 'congregation_data', 'main');
          await setDoc(userDocRef, payload, { merge: true });
          localStorage.removeItem('kongre_needs_cloud_upload');
        }
        if (congDocId && congDocId.length >= 3 && !['1001', 'CENTRAL', 'MAIN', 'ID'].includes(congDocId)) {
          try {
            const congDocRef = doc(db, 'congregations', congDocId);
            await setDoc(congDocRef, payload, { merge: true });
          } catch (congErr: any) {
            if (isQuotaError(congErr)) throw congErr;
            console.warn('Aviso guardando en congregación:', congErr);
          }
        }
        setSyncStatus('synced');
      } catch (err: any) {
        if (isQuotaError(err)) {
          await markFirestoreQuotaExceeded();
          setSyncStatus('offline');
          console.warn('Firestore: Cuota diaria alcanzada. Operando en modo local seguro.');
        } else {
          console.warn('Aviso de sincronización Firestore:', err);
          setSyncStatus('error');
        }
      }
    };

    if (options?.immediate) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      setSyncStatus('saving');
      await executeCloudWrite();
      return;
    }

    // Debounce de guardado en la nube para ahorrar cuota de escrituras (2.5 segundos)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSyncStatus('saving');
    saveTimeoutRef.current = setTimeout(async () => {
      saveTimeoutRef.current = null;
      await executeCloudWrite();
    }, 2500);
  };

  // Función explícita para forzar subida de datos locales a la cuenta de Google y a la congregación
  const uploadLocalDataToGoogle = async (): Promise<{ success: boolean; message: string }> => {
    const activeUser = user || auth.currentUser;
    if (!activeUser) {
      return { success: false, message: 'Primero inicia sesión con tu cuenta de Google.' };
    }
    if (isFirestoreQuotaExceeded()) {
      setSyncStatus('offline');
      return {
        success: false,
        message: 'La cuota diaria gratuita de Google Cloud Firestore se ha completado por hoy. Todos tus cambios están 100% seguros y respaldados localmente en tu navegador.',
      };
    }
    setSyncStatus('saving');
    try {
      const userDocRef = doc(db, 'users', activeUser.uid, 'congregation_data', 'main');
      const nowISO = new Date().toISOString();
      const fresh = getFreshLocalCongregationData();
      const cleanId = (
        fresh.settings.congregationNumber ||
        fresh.settings.congregationId ||
        settings.congregationNumber ||
        settings.congregationId ||
        ''
      ).trim().toUpperCase();

      const payload = sanitizeForFirestore({
        ...fresh,
        settings: {
          ...fresh.settings,
          isRegistered: true,
          coordinatorEmail: fresh.settings.coordinatorEmail || activeUser.email || '',
          coordinatorName: fresh.settings.coordinatorName || activeUser.displayName || 'Coordinador',
        },
        congregationId: cleanId,
        updatedAt: nowISO,
      });

      await setDoc(userDocRef, payload, { merge: true });

      if (cleanId) {
        try {
          const congDocRef = doc(db, 'congregations', cleanId);
          await setDoc(congDocRef, payload, { merge: true });
        } catch (e: any) {
          if (isQuotaError(e)) throw e;
          console.warn('Error sincronizando en doc de congregación:', e);
        }
      }

      localStorage.removeItem('kongre_needs_cloud_upload');
      localStorage.setItem('kongre_last_local_update', nowISO);
      localStorage.setItem('kongre_is_registered_congregation', 'true');
      setSyncStatus('synced');
      return { success: true, message: '¡Datos de la congregación guardados y sincronizados en tu cuenta de Google con éxito!' };
    } catch (err: any) {
      if (isQuotaError(err)) {
        await markFirestoreQuotaExceeded();
        setSyncStatus('offline');
        return {
          success: false,
          message: 'La cuota diaria gratuita de Google Cloud Firestore se ha completado por hoy. Todos tus cambios están 100% seguros y respaldados localmente en tu navegador.',
        };
      }
      console.error('Error al subir a Firestore:', err);
      setSyncStatus('error');
      return { success: false, message: err?.message || 'Error al guardar en Firestore.' };
    }
  };

  // Función explícita para descargar datos desde la cuenta de Google
  const downloadDataFromGoogle = async (): Promise<{ success: boolean; message: string }> => {
    const activeUser = user || auth.currentUser;
    if (!activeUser) {
      return { success: false, message: 'Primero inicia sesión con tu cuenta de Google.' };
    }
    setSyncStatus('saving');
    try {
      const userDocRef = doc(db, 'users', activeUser.uid, 'congregation_data', 'main');
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        setSyncStatus('synced');
        return { success: false, message: 'No hay datos guardados en la nube para esta cuenta de Google.' };
      }
      const data = snap.data();
      hydrateAllFromData(data);
      setSyncStatus('synced');
      return { success: true, message: '¡Datos de la congregación restaurados desde Google con éxito!' };
    } catch (err: any) {
      if (isQuotaError(err)) {
        await markFirestoreQuotaExceeded();
        setSyncStatus('offline');
        return {
          success: false,
          message: 'La cuota de Google Cloud Firestore se ha completado temporalmente. Se mantendrán tus datos locales actuales.',
        };
      }
      console.error('Error al descargar de Firestore:', err);
      setSyncStatus('error');
      return { success: false, message: err?.message || 'Error al descargar datos de Firestore.' };
    }
  };

  // Función para cargar los datos de una congregación existente desde Firestore (incluso sin Google Auth)
  const loadCongregationFromCloud = async (congId: string): Promise<{ success: boolean; congregationName?: string; message: string; data?: any }> => {
    const cleanId = congId.trim().toUpperCase();
    if (!cleanId) return { success: false, message: 'ID de congregación no válido.' };

    try {
      const congDocRef = doc(db, 'congregations', cleanId);
      const snap = await getDoc(congDocRef);
      if (!snap.exists()) {
        return { success: false, message: 'No se encontraron datos en la nube para este ID de congregación.' };
      }

      const data = snap.data();
      hydrateAllFromData(data);
      setSyncStatus('synced');
      return {
        success: true,
        data,
        congregationName: data.settings?.congregationName || 'Congregación',
        message: '¡Datos de la congregación cargados exitosamente desde la nube!',
      };
    } catch (err: any) {
      if (isQuotaError(err)) {
        await markFirestoreQuotaExceeded();
        setSyncStatus('offline');
        return { success: false, message: 'La cuota de Google Cloud se ha completado temporalmente. Se conservan los datos locales.' };
      }
      console.error('Error cargando congregación desde la nube:', err);
      return { success: false, message: err?.message || 'Error al conectar con la nube.' };
    }
  };

  // Auto-sync pending local changes when internet connection is restored
  useEffect(() => {
    const handleReconnected = () => {
      if (user) {
        saveToFirestore();
      }
    };
    window.addEventListener('online', handleReconnected);
    return () => window.removeEventListener('online', handleReconnected);
  }, [user, publishers, weeks, territories]);

  // Conflict detection for current week
  const conflicts = useMemo(() => {
    if (!currentWeek) return [];
    return detectConflictsInWeek(currentWeek, weeks, publishersMap, settings.conflictRules, outgoingSpeakers);
  }, [currentWeek, weeks, publishersMap, settings.conflictRules, outgoingSpeakers]);

  // Conflict detection for all weeks
  const allWeeksConflicts = useMemo(() => {
    const list: ConflictAlert[] = [];
    weeks.forEach(w => {
      const c = detectConflictsInWeek(w, weeks, publishersMap, settings.conflictRules, outgoingSpeakers);
      list.push(...c);
    });
    return list;
  }, [weeks, publishersMap, settings.conflictRules, outgoingSpeakers]);

  // PUBLISHER ACTIONS
  const addPublisher = (pubData: Omit<Publisher, 'id'>) => {
    const newPub: Publisher = {
      ...pubData,
      id: `pub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...publishers, newPub];
    setPublishers(updated);
    saveToFirestore(updated);
  };

  const updatePublisher = (pub: Publisher) => {
    const updated = publishers.map(p => (p.id === pub.id ? pub : p));
    setPublishers(updated);
    saveToFirestore(updated);
  };

  const deletePublishersBatch = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);

    // 1. Filtrar lista de publicadores
    const updatedPubs = publishers.filter(p => !idSet.has(p.id));
    setPublishers(updatedPubs);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_publishers`, JSON.stringify(updatedPubs));
    } catch {}

    // 2. Limpiar asignaciones activas de todos estos publicadores en semanas (Weeks)
    let weeksChanged = false;
    const updatedWeeks = weeks.map(w => {
      let changedInWeek = false;
      const clone: WeekSchedule = JSON.parse(JSON.stringify(w));

      if (idSet.has(clone.midweek.presidentId || '')) { clone.midweek.presidentId = ''; changedInWeek = true; }
      if (idSet.has(clone.midweek.initialPrayerId || '')) { clone.midweek.initialPrayerId = ''; changedInWeek = true; }
      if (idSet.has(clone.midweek.finalPrayerId || '')) { clone.midweek.finalPrayerId = ''; changedInWeek = true; }
      if (clone.midweek.tesoros?.lecturaBiblia?.publisherId && idSet.has(clone.midweek.tesoros.lecturaBiblia.publisherId)) { clone.midweek.tesoros.lecturaBiblia.publisherId = ''; changedInWeek = true; }
      if (clone.midweek.tesoros?.lecturaBibliaAux?.publisherId && idSet.has(clone.midweek.tesoros.lecturaBibliaAux.publisherId)) { clone.midweek.tesoros.lecturaBibliaAux.publisherId = ''; changedInWeek = true; }
      if (clone.midweek.tesoros?.discurso?.publisherId && idSet.has(clone.midweek.tesoros.discurso.publisherId)) { clone.midweek.tesoros.discurso.publisherId = ''; changedInWeek = true; }
      if (clone.midweek.tesoros?.perlas?.publisherId && idSet.has(clone.midweek.tesoros.perlas.publisherId)) { clone.midweek.tesoros.perlas.publisherId = ''; changedInWeek = true; }

      clone.midweek.maestros?.items?.forEach(item => {
        if (item.publisherId && idSet.has(item.publisherId)) { item.publisherId = ''; changedInWeek = true; }
        if (item.assistantId && idSet.has(item.assistantId)) { item.assistantId = ''; changedInWeek = true; }
      });

      clone.midweek.vidaCristiana?.items?.forEach(item => {
        if (item.publisherId && idSet.has(item.publisherId)) { item.publisherId = ''; changedInWeek = true; }
      });

      if (idSet.has(clone.midweek.vidaCristiana?.estudioBiblico?.conductorId || '')) {
        if (clone.midweek.vidaCristiana?.estudioBiblico) clone.midweek.vidaCristiana.estudioBiblico.conductorId = '';
        changedInWeek = true;
      }
      if (idSet.has(clone.midweek.vidaCristiana?.estudioBiblico?.lectorId || '')) {
        if (clone.midweek.vidaCristiana?.estudioBiblico) clone.midweek.vidaCristiana.estudioBiblico.lectorId = '';
        changedInWeek = true;
      }

      if (idSet.has(clone.weekend.presidentId || '')) { clone.weekend.presidentId = ''; changedInWeek = true; }
      if (idSet.has(clone.weekend.atalayaConductorId || '')) { clone.weekend.atalayaConductorId = ''; changedInWeek = true; }
      if (idSet.has(clone.weekend.atalayaLectorId || '')) { clone.weekend.atalayaLectorId = ''; changedInWeek = true; }
      if (idSet.has(clone.weekend.initialPrayerId || '')) { clone.weekend.initialPrayerId = ''; changedInWeek = true; }
      if (idSet.has(clone.weekend.finalPrayerId || '')) { clone.weekend.finalPrayerId = ''; changedInWeek = true; }
      if (idSet.has(clone.weekend.hospitalityPublisherId || '')) { clone.weekend.hospitalityPublisherId = ''; changedInWeek = true; }
      if (idSet.has(clone.weekend.publicTalkSpeaker || '')) { clone.weekend.publicTalkSpeaker = ''; changedInWeek = true; }

      Object.keys(clone.midweek.duties || {}).forEach(k => {
        if (Array.isArray(clone.midweek.duties[k])) {
          const originalLen = clone.midweek.duties[k].length;
          clone.midweek.duties[k] = clone.midweek.duties[k].filter(pid => !idSet.has(pid));
          if (clone.midweek.duties[k].length !== originalLen) changedInWeek = true;
        }
      });

      Object.keys(clone.weekend.duties || {}).forEach(k => {
        if (Array.isArray(clone.weekend.duties[k])) {
          const originalLen = clone.weekend.duties[k].length;
          clone.weekend.duties[k] = clone.weekend.duties[k].filter(pid => !idSet.has(pid));
          if (clone.weekend.duties[k].length !== originalLen) changedInWeek = true;
        }
      });

      if (changedInWeek) {
        weeksChanged = true;
        return clone;
      }
      return w;
    });

    if (weeksChanged) {
      setWeeks(updatedWeeks);
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_weeks`, JSON.stringify(updatedWeeks));
      } catch {}
    }

    // 3. Limpiar referencias en clmProgramas (Vida y Ministerio)
    let clmChanged = false;
    const updatedClm: Record<string, ClmPrograma> = {};
    Object.entries(clmProgramas).forEach(([dateStr, prog]) => {
      let progModified = false;
      const partesCloned = (prog.partes || []).map(part => {
        let partModified = false;
        let newAsignadoNid = part.asignado_nid;
        let newAsignadoNombre = part.asignado_nombre;
        let newAuxNid = part.asignado_auxiliar_nid;
        let newAuxNombre = part.asignado_auxiliar_nombre;

        if (newAsignadoNid && idSet.has(newAsignadoNid)) {
          newAsignadoNid = null;
          newAsignadoNombre = '';
          partModified = true;
        }
        if (newAuxNid && idSet.has(newAuxNid)) {
          newAuxNid = null;
          newAuxNombre = '';
          partModified = true;
        }

        if (partModified) {
          progModified = true;
          return {
            ...part,
            asignado_nid: newAsignadoNid,
            asignado_nombre: newAsignadoNombre,
            asignado_auxiliar_nid: newAuxNid,
            asignado_auxiliar_nombre: newAuxNombre,
          };
        }
        return part;
      });

      if (progModified) {
        clmChanged = true;
        updatedClm[dateStr] = { ...prog, partes: partesCloned };
        try {
          localStorage.setItem(`clm_programa_${dateStr}`, JSON.stringify(updatedClm[dateStr]));
        } catch {}
      } else {
        updatedClm[dateStr] = prog;
      }
    });

    if (clmChanged) {
      setClmProgramas(updatedClm);
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_clm_programas`, JSON.stringify(updatedClm));
      } catch {}
    }

    // 4. Limpiar en grupos de predicación
    let groupsChanged = false;
    const updatedGroups = preachingGroups.map(g => {
      let gMod = false;
      let newOverseer = g.overseerId;
      let newAssistant = g.assistantId;
      if (newOverseer && idSet.has(newOverseer)) { newOverseer = ''; gMod = true; }
      if (newAssistant && idSet.has(newAssistant)) { newAssistant = ''; gMod = true; }
      let newMembers = g.memberIds || (g as any).members || [];
      if (Array.isArray(newMembers)) {
        const origL = newMembers.length;
        newMembers = newMembers.filter((mid: string) => !idSet.has(mid));
        if (newMembers.length !== origL) gMod = true;
      }
      if (gMod) {
        groupsChanged = true;
        return { ...g, overseerId: newOverseer, assistantId: newAssistant, memberIds: newMembers };
      }
      return g;
    });

    if (groupsChanged) {
      setPreachingGroups(updatedGroups);
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_groups`, JSON.stringify(updatedGroups));
      } catch {}
    }

    // 5. Limpiar en turnos de carritos
    let shiftsChanged = false;
    const updatedShifts = cartShifts.map(s => {
      let sMod = false;
      let p1 = s.publisher1Id;
      let p2 = s.publisher2Id;
      if (p1 && idSet.has(p1)) { p1 = undefined; sMod = true; }
      if (p2 && idSet.has(p2)) { p2 = undefined; sMod = true; }
      if (sMod) {
        shiftsChanged = true;
        return { ...s, publisher1Id: p1, publisher2Id: p2 };
      }
      return s;
    });
    if (shiftsChanged) {
      setCartShifts(updatedShifts);
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_cart_shifts`, JSON.stringify(updatedShifts));
      } catch {}
    }

    // 6. Limpiar en anfitriones de hospitalidad
    const updatedHospitality = hospitalityHosts.filter(h => !idSet.has(h.publisherId));
    if (updatedHospitality.length !== hospitalityHosts.length) {
      setHospitalityHosts(updatedHospitality);
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_hospitality_hosts`, JSON.stringify(updatedHospitality));
      } catch {}
    }

    // 7. Limpiar en discursos salientes
    const updatedOutgoing = outgoingSpeakers.filter(s => !idSet.has(s.publisherId || ''));
    if (updatedOutgoing.length !== outgoingSpeakers.length) {
      setOutgoingSpeakers(updatedOutgoing);
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_outgoing_speakers`, JSON.stringify(updatedOutgoing));
      } catch {}
    }

    // 8. Sincronizar de inmediato a Firestore
    await saveToFirestore(
      updatedPubs,
      weeksChanged ? updatedWeeks : weeks,
      groupsChanged ? updatedGroups : preachingGroups,
      customDuties,
      latestSettingsRef.current,
      updatedOutgoing,
      fieldServiceMeetings,
      cartLocations,
      shiftsChanged ? updatedShifts : cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      memorialPlans,
      theocraticAssemblies,
      literatureItems,
      specialOrders,
      groupDistributions,
      inventoryRecords,
      accountLinkRequests,
      clmChanged ? updatedClm : clmProgramas,
      { immediate: true }
    );
  };

  const deletePublisher = async (id: string) => {
    await deletePublishersBatch([id]);
  };

  const importPublishersFromCSV = (csvText: string): number => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length <= 1) return 0;

    let importedCount = 0;
    const newPublishers: Publisher[] = [...publishers];

    // Check header or parse lines: Name, Gender, Phone, Group, Notes
    const startIndex = lines[0].toLowerCase().includes('nombre') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      const name = parts[0];
      if (!name) continue;

      const rawGender = (parts[1] || '').toLowerCase();
      const gender: 'hermano' | 'hermana' =
        rawGender.includes('hermana') || rawGender.includes('mujer') || rawGender === 'f'
          ? 'hermana'
          : 'hermano';
      const phone = parts[2] || '';
      const groupNum = parseInt(parts[3], 10) || 1;
      const notes = parts[4] || '';

      // Default reasonable roles
      const isMale = gender === 'hermano';
      const roles: any = {
        vym_presidente: false,
        vym_oracion: isMale,
        vym_tesoros_discurso: false,
        vym_tesoros_perlas: isMale,
        vym_tesoros_lectura: isMale,
        vym_maestros_titular: true,
        vym_maestros_ayudante: true,
        vym_vida_partes: false,
        vym_estudio_conductor: false,
        vym_estudio_lector: isMale,
        fds_presidente: false,
        fds_atalaya_lector: isMale,
        fds_oracion: isMale,
        deber_acomodador: isMale,
        deber_seguridad: isMale,
        deber_audio: isMale,
        deber_video: isMale,
        deber_microfonos: isMale,
        deber_plataforma: isMale,
        deber_zoom: true,
      };

      const newP: Publisher = {
        id: `pub-import-${Date.now()}-${i}`,
        name,
        gender,
        phone,
        groupNumber: groupNum,
        notes,
        active: true,
        absences: [],
        roles,
      };

      newPublishers.push(newP);
      importedCount++;
    }

    setPublishers(newPublishers);
    saveToFirestore(newPublishers);
    return importedCount;
  };

  // WEEKS ACTIONS
  const updateWeek = (week: WeekSchedule) => {
    const updated = weeks.map(w => (w.id === week.id ? week : w));
    setWeeks(updated);

    let updatedClm = { ...clmProgramas };
    if (week.weekStartDate) {
      const existing = updatedClm[week.weekStartDate] || null;
      const bridgedClm = bridgeWeekToClm(week, existing, publishers);
      updatedClm[week.weekStartDate] = bridgedClm;
      setClmProgramas(updatedClm);
      try {
        localStorage.setItem(`clm_programa_${week.weekStartDate}`, JSON.stringify(bridgedClm));
      } catch {}
    }

    saveToFirestore(
      publishers,
      updated,
      preachingGroups,
      customDuties,
      settings,
      outgoingSpeakers,
      fieldServiceMeetings,
      cartLocations,
      cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      memorialPlans,
      theocraticAssemblies,
      literatureItems,
      specialOrders,
      groupDistributions,
      inventoryRecords,
      accountLinkRequests,
      updatedClm
    );
  };

  const addNextWeek = () => {
    const sorted = [...weeks].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));
    const lastWeek = sorted[sorted.length - 1];

    let nextMonday: Date;
    if (lastWeek) {
      const d = new Date(lastWeek.weekStartDate);
      d.setDate(d.getDate() + 7);
      nextMonday = d;
    } else {
      nextMonday = new Date();
    }

    const emptyWeek = createEmptyWeek(nextMonday, weeks.length);
    const org = getOrganizedScheduleForWeek(emptyWeek.id, emptyWeek.midweek.date);
    const newWeek = org
      ? applyOrganizedToWeek(emptyWeek, org, { applyMidweek: true, applyWeekend: true })
      : emptyWeek;
    const updated = [...weeks, newWeek];
    setWeeks(updated);
    setCurrentWeekId(newWeek.id);
    saveToFirestore(publishers, updated);
  };

  const syncWeekWithOrganized = (weekId: string, scope: 'all' | 'midweek' | 'weekend' = 'all') => {
    const target = weeks.find((w) => w.id === weekId);
    if (!target) return;
    const org = getOrganizedScheduleForWeek(target.id, target.midweek.date);
    if (!org) return;
    const updatedWeek = applyOrganizedToWeek(target, org, {
      applyMidweek: scope === 'all' || scope === 'midweek',
      applyWeekend: scope === 'all' || scope === 'weekend',
    });
    const updatedWeeks = weeks.map((w) => (w.id === weekId ? updatedWeek : w));
    setWeeks(updatedWeeks);
    saveToFirestore(publishers, updatedWeeks);
  };

  const syncAllWeeksWithOrganized = () => {
    const updatedWeeks = weeks.map((w) => {
      const org = getOrganizedScheduleForWeek(w.id, w.midweek.date);
      return org ? applyOrganizedToWeek(w, org) : w;
    });
    setWeeks(updatedWeeks);
    saveToFirestore(publishers, updatedWeeks);
  };

  const copyWeekStructure = (fromWeekId: string, toWeekId: string) => {
    const fromWeek = weeks.find(w => w.id === fromWeekId);
    if (!fromWeek) return;

    const updated = weeks.map(w => {
      if (w.id === toWeekId) {
        return {
          ...w,
          midweek: {
            ...w.midweek,
            tesoros: {
              ...w.midweek.tesoros,
              discurso: { ...w.midweek.tesoros.discurso, title: fromWeek.midweek.tesoros.discurso.title },
              perlas: { ...w.midweek.tesoros.perlas, title: fromWeek.midweek.tesoros.perlas.title },
            },
            maestros: {
              items: fromWeek.midweek.maestros.items.map(m => ({
                ...m,
                id: `copy-${Date.now()}-${Math.random()}`,
                publisherId: undefined,
                assistantId: undefined,
                status: 'pendiente' as AssignmentStatus,
              })),
            },
            vidaCristiana: {
              ...w.midweek.vidaCristiana,
              items: fromWeek.midweek.vidaCristiana.items.map(v => ({
                ...v,
                id: `copy-${Date.now()}-${Math.random()}`,
                publisherId: undefined,
                status: 'pendiente' as AssignmentStatus,
              })),
            },
          },
        };
      }
      return w;
    });

    setWeeks(updated);
    saveToFirestore(publishers, updated);
  };

  const autoAssignCurrentWeek = () => {
    if (!currentWeek) return;
    const assigned = autoAssignWeek(currentWeek, weeks, publishers, settings.conflictRules, customDuties);
    updateWeek(assigned);
  };

  const autoAssignAllWeeksInMonth = (monthPrefix: string) => {
    // monthPrefix e.g. "2026-10"
    let currentPool = [...weeks];
    const monthWeeks = currentPool.filter(w => w.weekStartDate.startsWith(monthPrefix));
    monthWeeks.forEach(w => {
      const assigned = autoAssignWeek(w, currentPool, publishers, settings.conflictRules, customDuties);
      currentPool = currentPool.map(item => (item.id === assigned.id ? assigned : item));
    });
    setWeeks(currentPool);
    saveToFirestore(publishers, currentPool);
  };

  const clearWeekAssignments = async (weekId: string, scope: 'all' | 'midweek' | 'weekend' | 'duties' = 'all') => {
    let weekDateKey = '';
    const updatedWeeks = weeks.map(w => {
      if (w.id !== weekId && w.weekStartDate !== weekId) return w;
      weekDateKey = w.weekStartDate;
      const clone: WeekSchedule = JSON.parse(JSON.stringify(w));

      if (scope === 'all' || scope === 'midweek') {
        clone.midweek.presidentId = '';
        clone.midweek.initialPrayerId = '';
        clone.midweek.finalPrayerId = '';
        if (clone.midweek.tesoros?.lecturaBiblia) clone.midweek.tesoros.lecturaBiblia.publisherId = '';
        if (clone.midweek.tesoros?.lecturaBibliaAux) clone.midweek.tesoros.lecturaBibliaAux.publisherId = '';
        if (clone.midweek.tesoros?.discurso) clone.midweek.tesoros.discurso.publisherId = '';
        if (clone.midweek.tesoros?.perlas) clone.midweek.tesoros.perlas.publisherId = '';
        clone.midweek.maestros?.items?.forEach(item => {
          item.publisherId = '';
          item.assistantId = '';
        });
        clone.midweek.vidaCristiana?.items?.forEach(item => {
          item.publisherId = '';
        });
        if (clone.midweek.vidaCristiana?.estudioBiblico) {
          clone.midweek.vidaCristiana.estudioBiblico.conductorId = '';
          clone.midweek.vidaCristiana.estudioBiblico.lectorId = '';
        }
        Object.keys(clone.midweek.duties || {}).forEach(k => {
          clone.midweek.duties[k] = [];
        });
      }

      if (scope === 'all' || scope === 'weekend') {
        clone.weekend.presidentId = '';
        clone.weekend.publicTalkSpeaker = '';
        clone.weekend.visitingSpeakerCongregation = '';
        clone.weekend.hospitalityPublisherId = '';
        clone.weekend.atalayaConductorId = '';
        clone.weekend.atalayaLectorId = '';
        clone.weekend.initialPrayerId = '';
        clone.weekend.finalPrayerId = '';
        Object.keys(clone.weekend.duties || {}).forEach(k => {
          clone.weekend.duties[k] = [];
        });
      }

      if (scope === 'duties') {
        Object.keys(clone.midweek.duties || {}).forEach(k => {
          clone.midweek.duties[k] = [];
        });
        Object.keys(clone.weekend.duties || {}).forEach(k => {
          clone.weekend.duties[k] = [];
        });
      }

      return clone;
    });

    setWeeks(updatedWeeks);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_weeks`, JSON.stringify(updatedWeeks));
    } catch {}

    // Sincronizar también con clmProgramas si es reunión de entre semana
    let updatedClm = { ...clmProgramas };
    if ((scope === 'all' || scope === 'midweek') && weekDateKey && updatedClm[weekDateKey]) {
      const prog = JSON.parse(JSON.stringify(updatedClm[weekDateKey])) as ClmPrograma;
      prog.partes = (prog.partes || []).map(p => ({
        ...p,
        asignado_nid: null,
        asignado_nombre: '',
        asignado_auxiliar_nid: null,
        asignado_auxiliar_nombre: '',
      }));
      updatedClm = { ...updatedClm, [weekDateKey]: prog };
      setClmProgramas(updatedClm);
      try {
        localStorage.setItem(`clm_programa_${weekDateKey}`, JSON.stringify(prog));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_clm_programas`, JSON.stringify(updatedClm));
      } catch {}
    }

    await saveToFirestore(
      publishers,
      updatedWeeks,
      preachingGroups,
      customDuties,
      latestSettingsRef.current,
      outgoingSpeakers,
      fieldServiceMeetings,
      cartLocations,
      cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      memorialPlans,
      theocraticAssemblies,
      literatureItems,
      specialOrders,
      groupDistributions,
      inventoryRecords,
      accountLinkRequests,
      updatedClm,
      { immediate: true }
    );
  };

  const replaceAssignment = (
    weekId: string,
    meetingType: 'midweek' | 'weekend',
    assignmentPath: string,
    newPublisherId: string,
    newStatus: AssignmentStatus = 'pendiente'
  ) => {
    const updated = weeks.map(w => {
      if (w.id !== weekId) return w;
      const clone = JSON.parse(JSON.stringify(w));

      if (meetingType === 'midweek') {
        if (assignmentPath === 'presidentId') clone.midweek.presidentId = newPublisherId;
        else if (assignmentPath === 'initialPrayerId') clone.midweek.initialPrayerId = newPublisherId;
        else if (assignmentPath === 'finalPrayerId') clone.midweek.finalPrayerId = newPublisherId;
        else if (assignmentPath === 'tesoros.discurso') {
          clone.midweek.tesoros.discurso.publisherId = newPublisherId;
          clone.midweek.tesoros.discurso.status = newStatus;
        } else if (assignmentPath === 'tesoros.perlas') {
          clone.midweek.tesoros.perlas.publisherId = newPublisherId;
          clone.midweek.tesoros.perlas.status = newStatus;
        } else if (assignmentPath === 'tesoros.lecturaBiblia') {
          clone.midweek.tesoros.lecturaBiblia.publisherId = newPublisherId;
          clone.midweek.tesoros.lecturaBiblia.status = newStatus;
        } else if (assignmentPath.startsWith('maestros.')) {
          const idx = parseInt(assignmentPath.split('.')[1], 10);
          if (clone.midweek.maestros.items[idx]) {
            clone.midweek.maestros.items[idx].publisherId = newPublisherId;
            clone.midweek.maestros.items[idx].status = newStatus;
          }
        } else if (assignmentPath.startsWith('maestros_helper.')) {
          const idx = parseInt(assignmentPath.split('.')[1], 10);
          if (clone.midweek.maestros.items[idx]) {
            clone.midweek.maestros.items[idx].assistantId = newPublisherId;
          }
        } else if (assignmentPath.startsWith('vida.')) {
          const idx = parseInt(assignmentPath.split('.')[1], 10);
          if (clone.midweek.vidaCristiana.items[idx]) {
            clone.midweek.vidaCristiana.items[idx].publisherId = newPublisherId;
            clone.midweek.vidaCristiana.items[idx].status = newStatus;
          }
        } else if (assignmentPath === 'vidaCristiana.estudioBiblico.conductorId') {
          clone.midweek.vidaCristiana.estudioBiblico.conductorId = newPublisherId;
        } else if (assignmentPath === 'vidaCristiana.estudioBiblico.lectorId') {
          clone.midweek.vidaCristiana.estudioBiblico.lectorId = newPublisherId;
        }
      } else {
        if (assignmentPath === 'presidentId') clone.weekend.presidentId = newPublisherId;
        else if (assignmentPath === 'atalayaConductorId') clone.weekend.atalayaConductorId = newPublisherId;
        else if (assignmentPath === 'atalayaLectorId') clone.weekend.atalayaLectorId = newPublisherId;
        else if (assignmentPath === 'initialPrayerId') clone.weekend.initialPrayerId = newPublisherId;
        else if (assignmentPath === 'finalPrayerId') clone.weekend.finalPrayerId = newPublisherId;
      }
      return clone;
    });

    setWeeks(updated);
    saveToFirestore(publishers, updated);
  };

  const updateAssignmentStatus = (
    weekId: string,
    meetingType: 'midweek' | 'weekend',
    assignmentPath: string,
    newStatus: AssignmentStatus,
    reason?: string
  ) => {
    const updated = weeks.map(w => {
      if (w.id !== weekId) return w;
      const clone = JSON.parse(JSON.stringify(w));

      const setStatusAndNote = (item: any) => {
        if (!item) return;
        item.status = newStatus;
        if (reason) {
          item.notes = item.notes ? `${item.notes} | ${reason}` : reason;
        }
      };

      if (meetingType === 'midweek') {
        if (assignmentPath === 'tesoros.discurso') setStatusAndNote(clone.midweek.tesoros.discurso);
        else if (assignmentPath === 'tesoros.perlas') setStatusAndNote(clone.midweek.tesoros.perlas);
        else if (assignmentPath === 'tesoros.lecturaBiblia') setStatusAndNote(clone.midweek.tesoros.lecturaBiblia);
        else if (assignmentPath.startsWith('maestros.')) {
          const idx = parseInt(assignmentPath.split('.')[1], 10);
          if (clone.midweek.maestros.items[idx]) setStatusAndNote(clone.midweek.maestros.items[idx]);
        } else if (assignmentPath.startsWith('vida.')) {
          const idx = parseInt(assignmentPath.split('.')[1], 10);
          if (clone.midweek.vidaCristiana.items[idx]) setStatusAndNote(clone.midweek.vidaCristiana.items[idx]);
        } else {
          if (reason) {
            clone.notes = clone.notes ? `${clone.notes} | ${assignmentPath}: ${reason}` : `${assignmentPath}: ${reason}`;
          }
        }
      } else {
        if (reason) {
          clone.notes = clone.notes ? `${clone.notes} | ${assignmentPath}: ${reason}` : `${assignmentPath}: ${reason}`;
        }
      }
      return clone;
    });

    setWeeks(updated);
    saveToFirestore(publishers, updated);
  };

  const advancePublisherLesson = (publisherId: string, nextLessonNumber?: number, notes?: string) => {
    const pub = publishers.find(p => p.id === publisherId);
    if (!pub) return;

    const currentNum = pub.currentLessonNumber || 1;
    const lessonObj = OFFICIAL_STUDENT_LESSONS.find(l => l.number === currentNum) || {
      number: currentNum,
      title: `Lección ${currentNum}`,
    };

    const newRecord: StudentLessonRecord = {
      id: `lesson-${Date.now()}`,
      lessonNumber: currentNum,
      lessonTitle: lessonObj.title,
      date: new Date().toISOString().split('T')[0],
      status: 'completada',
      notes,
    };

    const updatedCurrentNumber = nextLessonNumber || Math.min(20, currentNum + 1);
    const existingHistory = pub.lessonsHistory || [];

    const updatedPub: Publisher = {
      ...pub,
      currentLessonNumber: updatedCurrentNumber,
      lessonsHistory: [newRecord, ...existingHistory],
    };

    updatePublisher(updatedPub);
  };

  const repeatPublisherLesson = (publisherId: string, notes?: string) => {
    const pub = publishers.find(p => p.id === publisherId);
    if (!pub) return;

    const currentNum = pub.currentLessonNumber || 1;
    const lessonObj = OFFICIAL_STUDENT_LESSONS.find(l => l.number === currentNum) || {
      number: currentNum,
      title: `Lección ${currentNum}`,
    };

    const newRecord: StudentLessonRecord = {
      id: `lesson-${Date.now()}`,
      lessonNumber: currentNum,
      lessonTitle: lessonObj.title,
      date: new Date().toISOString().split('T')[0],
      status: 'continuar',
      notes: notes || 'Continuar practicando en la próxima asignación',
    };

    const existingHistory = pub.lessonsHistory || [];
    const updatedPub: Publisher = {
      ...pub,
      lessonsHistory: [newRecord, ...existingHistory],
    };

    updatePublisher(updatedPub);
  };

  const updateMeetingAttendance = (weekId: string, attendance: MeetingAttendance) => {
    const updated = weeks.map(w => (w.id === weekId ? { ...w, attendance } : w));
    setWeeks(updated);
    saveToFirestore(publishers, updated);
  };

  // CLM (Vida y Ministerio Cristianos) Acciones con Sincronización en la Nube
  const updateClmPrograma = async (programa: ClmPrograma) => {
    const updatedClm = {
      ...clmProgramas,
      [programa.semana_fecha]: programa,
    };
    setClmProgramas(updatedClm);

    // Guardado local y SQLite si Electron está presente
    try {
      localStorage.setItem(`clm_programa_${programa.semana_fecha}`, JSON.stringify(programa));
      if (window.electronAPI && typeof window.electronAPI.upsertClmPrograma === 'function') {
        await window.electronAPI.upsertClmPrograma(programa);
      }
    } catch (err) {
      console.warn('Error local saving CLM programa:', err);
    }

    // Puente bidireccional hacia WeekSchedule oficial de Kongre
    let updatedWeeks = [...weeks];
    const weekIdx = updatedWeeks.findIndex(w => w.weekStartDate === programa.semana_fecha);
    if (weekIdx >= 0) {
      const syncedWeek = bridgeClmToWeek(programa, updatedWeeks[weekIdx], publishers);
      updatedWeeks[weekIdx] = syncedWeek;
      setWeeks(updatedWeeks);
    }

    // Persistir de inmediato en Firestore
    await saveToFirestore(
      publishers,
      updatedWeeks,
      preachingGroups,
      customDuties,
      settings,
      outgoingSpeakers,
      fieldServiceMeetings,
      cartLocations,
      cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      memorialPlans,
      theocraticAssemblies,
      literatureItems,
      specialOrders,
      groupDistributions,
      inventoryRecords,
      accountLinkRequests,
      updatedClm
    );
  };

  const getClmPrograma = (semanaFecha: string): ClmPrograma | null => {
    if (clmProgramas[semanaFecha] && clmProgramas[semanaFecha].partes && clmProgramas[semanaFecha].partes.length > 0) {
      return clmProgramas[semanaFecha];
    }
    const local = localStorage.getItem(`clm_programa_${semanaFecha}`);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed && parsed.partes && parsed.partes.length > 0) {
          return parsed;
        }
      } catch {}
    }
    const week = weeks.find(w => w.weekStartDate === semanaFecha);
    if (week) {
      return bridgeWeekToClm(week, clmProgramas[semanaFecha] || null, publishers);
    }
    return bridgeWeekToClm(
      {
        id: `week-${semanaFecha}`,
        weekStartDate: semanaFecha,
        weekEndDate: semanaFecha,
        cleaningGroupNumbers: [1],
        midweek: {
          date: semanaFecha,
          tesoros: {
            discurso: { id: `disc-${semanaFecha}`, title: '', type: 'vym_tesoros_discurso', status: 'pendiente' },
            perlas: { id: `perl-${semanaFecha}`, title: '', type: 'vym_tesoros_perlas', status: 'pendiente' },
            lecturaBiblia: { id: `lect-${semanaFecha}`, title: '', type: 'vym_tesoros_lectura', status: 'pendiente' },
          },
          maestros: { items: [] },
          vidaCristiana: { items: [], estudioBiblico: {} },
          duties: {},
        },
        weekend: {
          date: semanaFecha,
          publicTalkTheme: '',
          watchtowerTheme: '',
          duties: {},
        },
      },
      null,
      publishers
    );
  };

  const addOutgoingSpeaker = (itemData: Omit<OutgoingSpeakerAssignment, 'id'>) => {
    const newItem: OutgoingSpeakerAssignment = {
      ...itemData,
      id: `out-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    const updated = [...outgoingSpeakers, newItem];
    setOutgoingSpeakers(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, updated);
  };

  const updateOutgoingSpeaker = (item: OutgoingSpeakerAssignment) => {
    const updated = outgoingSpeakers.map(o => (o.id === item.id ? item : o));
    setOutgoingSpeakers(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, updated);
  };

  const deleteOutgoingSpeaker = (id: string) => {
    const updated = outgoingSpeakers.filter(o => o.id !== id);
    setOutgoingSpeakers(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, updated);
  };

  // Hospitality Hosts Actions
  const addHospitalityHost = (hostData: Omit<HospitalityHost, 'id'>) => {
    const newHost: HospitalityHost = {
      ...hostData,
      id: `hosp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    const updated = [...hospitalityHosts, newHost];
    setHospitalityHosts(updated);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_hospitality_hosts`, JSON.stringify(updated));
    } catch {}
  };

  const updateHospitalityHost = (host: HospitalityHost) => {
    const updated = hospitalityHosts.map(h => (h.id === host.id ? host : h));
    setHospitalityHosts(updated);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_hospitality_hosts`, JSON.stringify(updated));
    } catch {}
  };

  const deleteHospitalityHost = (id: string) => {
    const updated = hospitalityHosts.filter(h => h.id !== id);
    setHospitalityHosts(updated);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_hospitality_hosts`, JSON.stringify(updated));
    } catch {}
  };

  // Panel Eléctrico (Breakers) Actions
  const addBreaker = (breakerData: Omit<Breaker, 'id'>) => {
    const colBreakers = breakers.filter(b => b.col === breakerData.col);
    const newBreaker: Breaker = {
      ...breakerData,
      id: `brk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      order_idx: breakerData.order_idx !== undefined ? breakerData.order_idx : colBreakers.length,
    };
    const updated = [...breakers, newBreaker];
    setBreakers(updated);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_breakers`, JSON.stringify(updated));
    } catch {}
  };

  const updateBreaker = (breaker: Breaker) => {
    const updated = breakers.map(b => (b.id === breaker.id ? breaker : b));
    setBreakers(updated);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_breakers`, JSON.stringify(updated));
    } catch {}
  };

  const deleteBreaker = (id: string) => {
    const updated = breakers.filter(b => b.id !== id);
    setBreakers(updated);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_breakers`, JSON.stringify(updated));
    } catch {}
  };

  const toggleBreakerStatus = (id: string) => {
    const breaker = breakers.find(b => b.id === id);
    if (!breaker || breaker.status === 'always') return;
    const newStatus = breaker.status === 'off' ? 'on' : 'off';
    const updated = breakers.map(b => (b.id === id ? { ...b, status: newStatus as Breaker['status'] } : b));
    setBreakers(updated);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_breakers`, JSON.stringify(updated));
    } catch {}
  };

  const setMeetingBreakersPower = (turnOn: boolean) => {
    const updated = breakers.map(b => {
      if (b.status === 'event') {
        return { ...b, status: (turnOn ? 'event' : 'off') as Breaker['status'] };
      }
      return b;
    });
    setBreakers(updated);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_breakers`, JSON.stringify(updated));
    } catch {}
  };

  const reorderBreakers = (newBreakers: Breaker[]) => {
    setBreakers(newBreakers);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_breakers`, JSON.stringify(newBreakers));
    } catch {}
  };

  // Fichas de Mantenimiento del Salón Actions
  const addMaintenanceSheet = (sheetData: Omit<MaintenanceSheet, 'id'>) => {
    const newSheet: MaintenanceSheet = {
      ...sheetData,
      id: `maint-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderIndex: sheetData.orderIndex !== undefined ? sheetData.orderIndex : maintenanceSheets.length,
    };
    const updated = [...maintenanceSheets, newSheet];
    setMaintenanceSheets(updated);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_maintenance_sheets`, JSON.stringify(updated));
    } catch {}
  };

  const updateMaintenanceSheet = (sheet: MaintenanceSheet) => {
    const updated = maintenanceSheets.map(s => (s.id === sheet.id ? sheet : s));
    setMaintenanceSheets(updated);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_maintenance_sheets`, JSON.stringify(updated));
    } catch {}
  };

  const deleteMaintenanceSheet = (id: string) => {
    const updated = maintenanceSheets.filter(s => s.id !== id);
    setMaintenanceSheets(updated);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_maintenance_sheets`, JSON.stringify(updated));
    } catch {}
  };

  const toggleMaintenanceSheetActive = (id: string) => {
    const sheet = maintenanceSheets.find(s => s.id === id);
    if (!sheet) return;
    const updated = maintenanceSheets.map(s => (s.id === id ? { ...s, isActive: !s.isActive } : s));
    setMaintenanceSheets(updated);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_maintenance_sheets`, JSON.stringify(updated));
    } catch {}
  };

  const markMaintenanceSheetCompleted = (id: string, notes?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = maintenanceSheets.map(s => {
      if (s.id === id) {
        const nextDate = new Date();
        switch (s.frequency) {
          case 'semanal': nextDate.setDate(nextDate.getDate() + 7); break;
          case 'mensual': nextDate.setMonth(nextDate.getMonth() + 1); break;
          case 'bimestral': nextDate.setMonth(nextDate.getMonth() + 2); break;
          case 'trimestral': nextDate.setMonth(nextDate.getMonth() + 3); break;
          case 'semestral': nextDate.setMonth(nextDate.getMonth() + 6); break;
          case 'anual': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
          default: nextDate.setMonth(nextDate.getMonth() + 1);
        }
        const nextDueDate = nextDate.toISOString().split('T')[0];
        const newChecklist = s.checklist.map(item => ({ ...item, completed: true }));

        return {
          ...s,
          lastCompletedDate: today,
          nextDueDate,
          status: 'al_dia' as MaintenanceStatus,
          checklist: newChecklist,
          notes: notes ? (s.notes ? `${s.notes}\n[${today}] ${notes}` : `[${today}] ${notes}`) : s.notes,
        };
      }
      return s;
    });
    setMaintenanceSheets(updated);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_maintenance_sheets`, JSON.stringify(updated));
    } catch {}
  };

  const reorderMaintenanceSheets = (newSheets: MaintenanceSheet[]) => {
    setMaintenanceSheets(newSheets);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_maintenance_sheets`, JSON.stringify(newSheets));
    } catch {}
  };

  // Solicitudes de Precursor Auxiliar Actions
  const addAuxPioneerRequest = (reqData: Omit<AuxPioneerRequest, 'id'>) => {
    const newReq: AuxPioneerRequest = {
      ...reqData,
      id: `apr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      publisher_nid: reqData.publisher_nid || reqData.publisherId,
      mes: reqData.mes !== undefined ? reqData.mes : reqData.month,
      anio: reqData.anio !== undefined ? reqData.anio : reqData.year,
      meta_horas: reqData.meta_horas || reqData.targetHours,
      estado: reqData.estado || reqData.status || 'pendiente',
      fecha_solicitud: reqData.fecha_solicitud || reqData.requestDate || new Date().toISOString(),
    };
    const updated = [newReq, ...auxPioneerRequests];
    setAuxPioneerRequests(updated);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_aux_pioneer_requests`, JSON.stringify(updated));
    } catch {}
  };

  const updateAuxPioneerRequest = (req: AuxPioneerRequest) => {
    const updated = auxPioneerRequests.map((r) => (r.id === req.id ? req : r));
    setAuxPioneerRequests(updated);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_aux_pioneer_requests`, JSON.stringify(updated));
    } catch {}
  };

  const deleteAuxPioneerRequest = (id: string) => {
    const updated = auxPioneerRequests.filter((r) => r.id !== id);
    setAuxPioneerRequests(updated);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_aux_pioneer_requests`, JSON.stringify(updated));
    } catch {}
  };

  const setAuxPioneerRequestStatus = (id: string, status: 'aprobada' | 'rechazada', reviewedBy?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = auxPioneerRequests.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          status,
          estado: status,
          responseDate: today,
          fecha_respuesta: today,
          reviewedBy: reviewedBy || 'Comité de Servicio de la Congregación',
        };
      }
      return r;
    });
    setAuxPioneerRequests(updated);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_aux_pioneer_requests`, JSON.stringify(updated));
    } catch {}
  };

  // Formulario S-1 (Informe a la Sucursal) Actions
  const updateBranchReportS1 = (report: BranchReportS1) => {
    const exists = branchReportsS1.some((r) => r.monthKey === report.monthKey || r.id === report.id);
    let updated: BranchReportS1[];
    if (exists) {
      updated = branchReportsS1.map((r) =>
        r.monthKey === report.monthKey || r.id === report.id ? report : r
      );
    } else {
      updated = [report, ...branchReportsS1];
    }
    setBranchReportsS1(updated);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_branch_reports_s1`, JSON.stringify(updated));
    } catch {}
  };

  const markBranchReportS1Status = (
    monthKey: string,
    status: S1SubmissionStatus,
    submittedBy?: string,
    confirmationNumber?: string,
    notes?: string
  ) => {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const monthNumber = parseInt(monthStr, 10);

    const existing = branchReportsS1.find((r) => r.monthKey === monthKey);
    let updatedReport: BranchReportS1;

    if (existing) {
      updatedReport = {
        ...existing,
        status,
        submittedAt: status === 'enviado' ? (existing.submittedAt || new Date().toISOString()) : undefined,
        submittedBy: submittedBy !== undefined ? submittedBy : existing.submittedBy,
        confirmationNumber: confirmationNumber !== undefined ? confirmationNumber : existing.confirmationNumber,
        notes: notes !== undefined ? notes : existing.notes,
      };
    } else {
      updatedReport = {
        id: `s1-${monthKey}`,
        monthKey,
        year,
        monthNumber,
        status,
        submittedAt: status === 'enviado' ? new Date().toISOString() : undefined,
        submittedBy,
        confirmationNumber,
        notes,
      };
    }
    updateBranchReportS1(updatedReport);
  };

  const addFieldServiceMeeting = (itemData: Omit<FieldServiceMeeting, 'id'>) => {
    const newItem: FieldServiceMeeting = {
      ...itemData,
      id: `fs-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    const updated = [...fieldServiceMeetings, newItem];
    setFieldServiceMeetings(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, updated);
  };

  const updateFieldServiceMeeting = (item: FieldServiceMeeting) => {
    const updated = fieldServiceMeetings.map(f => (f.id === item.id ? item : f));
    setFieldServiceMeetings(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, updated);
  };

  const deleteFieldServiceMeeting = (id: string) => {
    const updated = fieldServiceMeetings.filter(f => f.id !== id);
    setFieldServiceMeetings(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, updated);
  };

  const updatePreachingGroups = (groups: PreachingGroup[]) => {
    setPreachingGroups(groups);
    saveToFirestore(publishers, weeks, groups);
  };

  const addCustomDuty = (dutyData: Omit<CustomDuty, 'id'>) => {
    const newDuty: CustomDuty = {
      ...dutyData,
      id: `duty-${Date.now()}`,
    };
    const updated = [...customDuties, newDuty];
    setCustomDuties(updated);
    saveToFirestore(publishers, weeks, preachingGroups, updated);
  };

  const updateCustomDuty = (duty: CustomDuty) => {
    const updated = customDuties.map(d => (d.id === duty.id ? duty : d));
    setCustomDuties(updated);
    saveToFirestore(publishers, weeks, preachingGroups, updated);
  };

  const deleteCustomDuty = (id: string) => {
    const updated = customDuties.filter(d => d.id !== id);
    setCustomDuties(updated);
    saveToFirestore(publishers, weeks, preachingGroups, updated);
  };

  const updateSettings = async (newSettings: Partial<CongregationSettings>) => {
    const cleanCongName =
      newSettings.congregationName !== undefined
        ? isCongregationIdString(newSettings.congregationName)
          ? ''
          : newSettings.congregationName.trim()
        : latestSettingsRef.current.congregationName;

    const nowISO = new Date().toISOString();

    const merged: CongregationSettings = {
      ...latestSettingsRef.current,
      ...newSettings,
      ...(newSettings.congregationName !== undefined ? { congregationName: cleanCongName } : {}),
      updatedAt: nowISO,
      conflictRules: {
        ...INITIAL_SETTINGS.conflictRules,
        ...(latestSettingsRef.current.conflictRules || {}),
        ...(newSettings.conflictRules || {}),
      },
    };

    latestSettingsRef.current = merged;
    setSettings(merged);

    // Persistencia local síncrona inmediata en múltiples claves de resguardo
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(merged));
      localStorage.setItem('kongre_saved_settings_backup', JSON.stringify(merged));
      localStorage.setItem('kongre_settings_user_saved', 'true');
      localStorage.setItem('kongre_last_settings_update', nowISO);
      localStorage.setItem('kongre_last_local_update', nowISO);
      if (merged.congregationName?.trim() && !isCongregationIdString(merged.congregationName)) {
        localStorage.setItem('kongre_congregation_name', merged.congregationName.trim());
        if (newSettings.congregationName !== undefined) {
          localStorage.setItem('kongre_user_confirmed_name', merged.congregationName.trim());
        }
      }
      if (merged.midweekMeetingDay) {
        localStorage.setItem('kongre_midweek_day', merged.midweekMeetingDay);
        if (newSettings.midweekMeetingDay) {
          localStorage.setItem('kongre_user_confirmed_midweek_day', merged.midweekMeetingDay);
        }
      }
      if (merged.midweekMeetingTime) {
        localStorage.setItem('kongre_midweek_time', merged.midweekMeetingTime);
        if (newSettings.midweekMeetingTime) {
          localStorage.setItem('kongre_user_confirmed_midweek_time', merged.midweekMeetingTime);
        }
      }
      if (merged.weekendMeetingDay) {
        localStorage.setItem('kongre_weekend_day', merged.weekendMeetingDay);
        if (newSettings.weekendMeetingDay) {
          localStorage.setItem('kongre_user_confirmed_weekend_day', merged.weekendMeetingDay);
        }
      }
      if (merged.weekendMeetingTime) {
        localStorage.setItem('kongre_weekend_time', merged.weekendMeetingTime);
        if (newSettings.weekendMeetingTime) {
          localStorage.setItem('kongre_user_confirmed_weekend_time', merged.weekendMeetingTime);
        }
      }
      if (merged.hallAddress !== undefined) {
        localStorage.setItem('kongre_hall_address', merged.hallAddress || '');
        if (newSettings.hallAddress !== undefined) {
          localStorage.setItem('kongre_user_confirmed_address', merged.hallAddress || '');
        }
      }
      if (merged.isRegistered || (merged.congregationName && merged.congregationName.trim())) {
        localStorage.setItem('kongre_is_registered_congregation', 'true');
        localStorage.setItem('kongre_has_entered_app', 'true');
      }
    } catch (e) {
      console.warn('Error guardando settings localmente:', e);
    }

    await saveToFirestore(
      publishers,
      weeks,
      preachingGroups,
      customDuties,
      merged,
      outgoingSpeakers,
      fieldServiceMeetings,
      cartLocations,
      cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      memorialPlans,
      theocraticAssemblies,
      literatureItems,
      specialOrders,
      groupDistributions,
      inventoryRecords,
      accountLinkRequests,
      clmProgramas,
      { immediate: true }
    );
  };

  // Carritos de predicación y avisos
  const addCartLocation = (locData: Omit<CartLocation, 'id'>) => {
    const newLoc: CartLocation = {
      ...locData,
      id: `cart-loc-${Date.now()}`,
    };
    const updated = [...cartLocations, newLoc];
    setCartLocations(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, updated);
  };

  const updateCartLocation = (loc: CartLocation) => {
    const updated = cartLocations.map(l => (l.id === loc.id ? loc : l));
    setCartLocations(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, updated);
  };

  const deleteCartLocation = (id: string) => {
    const updated = cartLocations.filter(l => l.id !== id);
    setCartLocations(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, updated);
  };

  const addCartShift = (shiftData: Omit<CartShift, 'id'>) => {
    const newShift: CartShift = {
      ...shiftData,
      id: `cshift-${Date.now()}`,
    };
    const updated = [...cartShifts, newShift];
    setCartShifts(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, updated);
  };

  const updateCartShift = (shift: CartShift) => {
    const updated = cartShifts.map(s => (s.id === shift.id ? shift : s));
    setCartShifts(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, updated);
  };

  const deleteCartShift = (id: string) => {
    const updated = cartShifts.filter(s => s.id !== id);
    setCartShifts(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, updated);
  };

  const addNotice = (noticeData: Omit<CongregationNotice, 'id'>) => {
    const newNotice: CongregationNotice = {
      ...noticeData,
      id: `not-${Date.now()}`,
    };
    const updated = [newNotice, ...notices];
    setNotices(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, updated);
  };

  const updateNotice = (notice: CongregationNotice) => {
    const updated = notices.map(n => (n.id === notice.id ? notice : n));
    setNotices(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, updated);
  };

  const deleteNotice = (id: string) => {
    const updated = notices.filter(n => n.id !== id);
    setNotices(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, updated);
  };

  const updateMonthlyReport = (report: MonthlyServiceReport) => {
    const existingIndex = monthlyReports.findIndex(
      r => r.publisherId === report.publisherId && r.month === report.month
    );
    let updated: MonthlyServiceReport[];
    if (existingIndex >= 0) {
      updated = [...monthlyReports];
      updated[existingIndex] = report;
    } else {
      updated = [...monthlyReports, { ...report, id: report.id || `rep-${Date.now()}` }];
    }
    setMonthlyReports(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, updated);
  };

  const batchUpdateMonthlyReports = (newReports: MonthlyServiceReport[]) => {
    setMonthlyReports(newReports);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, newReports);
  };

  // Territory Management actions (S-13)
  const addTerritory = (terrData: Omit<Territory, 'id' | 'history'>) => {
    const newTerr: Territory = {
      ...terrData,
      id: `terr-${Date.now()}`,
      noVisits: terrData.noVisits || [],
      history: [],
    };
    const updated = [...territories, newTerr];
    setTerritories(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, monthlyReports, updated);
  };

  const updateTerritory = (terr: Territory) => {
    const updated = territories.map(t => (t.id === terr.id ? terr : t));
    setTerritories(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, monthlyReports, updated);
  };

  const deleteTerritory = (id: string) => {
    const updated = territories.filter(t => t.id !== id);
    setTerritories(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, monthlyReports, updated);
  };

  const assignTerritory = (
    territoryId: string,
    publisherId: string,
    assignedDate?: string,
    dueDate?: string,
    notes?: string
  ) => {
    const pub = publishersMap.get(publisherId);
    const today = assignedDate || new Date().toISOString().slice(0, 10);
    let calculatedDueDate = dueDate;
    if (!calculatedDueDate) {
      const d = new Date(today);
      d.setMonth(d.getMonth() + 4);
      calculatedDueDate = d.toISOString().slice(0, 10);
    }

    const updated = territories.map(t => {
      if (t.id !== territoryId) return t;

      const newHistoryItem: TerritoryAssignmentRecord = {
        id: `th-${Date.now()}`,
        territoryId,
        publisherId,
        publisherName: pub?.name || 'Publicador',
        assignedDate: today,
        dueDate: calculatedDueDate,
        notes,
      };

      return {
        ...t,
        status: 'asignado' as const,
        currentAssigneeId: publisherId,
        assignedDate: today,
        dueDate: calculatedDueDate,
        history: [newHistoryItem, ...(t.history || [])],
      };
    });

    setTerritories(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, monthlyReports, updated);
  };

  const returnTerritory = (territoryId: string, returnedDate?: string, notes?: string) => {
    const today = returnedDate || new Date().toISOString().slice(0, 10);

    const updated = territories.map(t => {
      if (t.id !== territoryId) return t;

      const updatedHistory = (t.history || []).map((h, idx) => {
        if (idx === 0 && !h.returnedDate) {
          return {
            ...h,
            returnedDate: today,
            notes: notes ? (h.notes ? `${h.notes} | ${notes}` : notes) : h.notes,
          };
        }
        return h;
      });

      return {
        ...t,
        status: 'disponible' as const,
        currentAssigneeId: undefined,
        assignedDate: undefined,
        dueDate: undefined,
        lastCompletedDate: today,
        history: updatedHistory,
      };
    });

    setTerritories(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, monthlyReports, updated);
  };

  const extendTerritoryDueDate = (territoryId: string, newDueDate: string) => {
    const updated = territories.map(t => {
      if (t.id !== territoryId) return t;

      const updatedHistory = (t.history || []).map((h, idx) => {
        if (idx === 0 && !h.returnedDate) {
          return {
            ...h,
            dueDate: newDueDate,
            notes: h.notes ? `${h.notes} (Plazo ampliado al ${newDueDate})` : `Plazo ampliado al ${newDueDate}`,
          };
        }
        return h;
      });

      return {
        ...t,
        dueDate: newDueDate,
        status: 'asignado' as const,
        history: updatedHistory,
      };
    });

    setTerritories(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, monthlyReports, updated);
  };

  const addNoVisitAddress = (territoryId: string, noVisitData: Omit<NoVisitAddress, 'id'>) => {
    const newNoVisit: NoVisitAddress = {
      ...noVisitData,
      id: `nv-${Date.now()}`,
    };

    const updated = territories.map(t => {
      if (t.id !== territoryId) return t;
      return {
        ...t,
        noVisits: [...(t.noVisits || []), newNoVisit],
      };
    });

    setTerritories(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, monthlyReports, updated);
  };

  const removeNoVisitAddress = (territoryId: string, noVisitId: string) => {
    const updated = territories.map(t => {
      if (t.id !== territoryId) return t;
      return {
        ...t,
        noVisits: (t.noVisits || []).filter(nv => nv.id !== noVisitId),
      };
    });

    setTerritories(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, monthlyReports, updated);
  };

  // Circuit Overseer Visit actions
  const updateCircuitVisit = (visit: CircuitOverseerVisit) => {
    setCircuitVisit(visit);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, monthlyReports, territories, visit);
  };

  const updateMealArrangement = (meal: MealArrangement) => {
    if (!circuitVisit) return;
    const updatedMeals = circuitVisit.meals.map(m => (m.id === meal.id ? meal : m));
    const updatedVisit: CircuitOverseerVisit = {
      ...circuitVisit,
      meals: updatedMeals,
    };
    setCircuitVisit(updatedVisit);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, monthlyReports, territories, updatedVisit);
  };

  const updateMinistryArrangement = (min: MinistryArrangement) => {
    if (!circuitVisit) return;
    const updatedMin = circuitVisit.ministry.map(m => (m.id === min.id ? min : m));
    const updatedVisit: CircuitOverseerVisit = {
      ...circuitVisit,
      ministry: updatedMin,
    };
    setCircuitVisit(updatedVisit);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, monthlyReports, territories, updatedVisit);
  };

  const toggleVisitChecklistItem = (checkId: string) => {
    if (!circuitVisit) return;
    const updatedChecklist = circuitVisit.checklist.map(chk =>
      chk.id === checkId ? { ...chk, completed: !chk.completed } : chk
    );
    const updatedVisit: CircuitOverseerVisit = {
      ...circuitVisit,
      checklist: updatedChecklist,
    };
    setCircuitVisit(updatedVisit);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, monthlyReports, territories, updatedVisit);
  };

  const addSpecialMeeting = (meetingData: Omit<SpecialMeeting, 'id'>) => {
    if (!circuitVisit) return;
    const newMeeting: SpecialMeeting = {
      ...meetingData,
      id: `sp-${Date.now()}`,
    };
    const updatedVisit: CircuitOverseerVisit = {
      ...circuitVisit,
      specialMeetings: [...circuitVisit.specialMeetings, newMeeting],
    };
    setCircuitVisit(updatedVisit);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, monthlyReports, territories, updatedVisit);
  };

  const removeSpecialMeeting = (meetingId: string) => {
    if (!circuitVisit) return;
    const updatedVisit: CircuitOverseerVisit = {
      ...circuitVisit,
      specialMeetings: circuitVisit.specialMeetings.filter(m => m.id !== meetingId),
    };
    setCircuitVisit(updatedVisit);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, monthlyReports, territories, updatedVisit);
  };

  // Congregation Accounts (S-26, S-30, S-25)
  const addTransaction = (txData: Omit<AccountTransaction, 'id'>) => {
    const newTx: AccountTransaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, monthlyReports, territories, circuitVisit, updated);
  };

  const updateTransaction = (tx: AccountTransaction) => {
    const updated = transactions.map(t => (t.id === tx.id ? tx : t));
    setTransactions(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, monthlyReports, territories, circuitVisit, updated);
  };

  const deleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, monthlyReports, territories, circuitVisit, updated);
  };

  const updateQuarterlyAudit = (audit: QuarterlyAudit) => {
    const updated = quarterlyAudits.map(a => (a.id === audit.id ? audit : a));
    setQuarterlyAudits(updated);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, settings, outgoingSpeakers, fieldServiceMeetings, cartLocations, cartShifts, notices, monthlyReports, territories, circuitVisit, transactions, updated);
  };

  // Conmemoración del Memorial & Asambleas Teocráticas
  const updateMemorialPlan = (plan: MemorialPlan) => {
    const exists = memorialPlans.some(p => p.id === plan.id);
    const updated = exists
      ? memorialPlans.map(p => (p.id === plan.id ? plan : p))
      : [plan, ...memorialPlans];
    setMemorialPlans(updated);
    saveToFirestore(
      publishers,
      weeks,
      preachingGroups,
      customDuties,
      settings,
      outgoingSpeakers,
      fieldServiceMeetings,
      cartLocations,
      cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      updated
    );
  };

  const addTheocraticAssembly = (assemblyData: Omit<TheocraticAssembly, 'id'>) => {
    const newAssembly: TheocraticAssembly = {
      ...assemblyData,
      id: `assembly-${Date.now()}`,
    };
    const updated = [newAssembly, ...theocraticAssemblies];
    setTheocraticAssemblies(updated);
    saveToFirestore(
      publishers,
      weeks,
      preachingGroups,
      customDuties,
      settings,
      outgoingSpeakers,
      fieldServiceMeetings,
      cartLocations,
      cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      memorialPlans,
      updated
    );
  };

  const updateTheocraticAssembly = (assembly: TheocraticAssembly) => {
    const updated = theocraticAssemblies.map(a => (a.id === assembly.id ? assembly : a));
    setTheocraticAssemblies(updated);
    saveToFirestore(
      publishers,
      weeks,
      preachingGroups,
      customDuties,
      settings,
      outgoingSpeakers,
      fieldServiceMeetings,
      cartLocations,
      cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      memorialPlans,
      updated
    );
  };

  const deleteTheocraticAssembly = (id: string) => {
    const updated = theocraticAssemblies.filter(a => a.id !== id);
    setTheocraticAssemblies(updated);
    saveToFirestore(
      publishers,
      weeks,
      preachingGroups,
      customDuties,
      settings,
      outgoingSpeakers,
      fieldServiceMeetings,
      cartLocations,
      cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      memorialPlans,
      updated
    );
  };

  // Literatura y Publicaciones (Formulario S-14)
  const addLiteratureItem = (itemData: Omit<LiteratureItem, 'id'>) => {
    const newItem: LiteratureItem = {
      ...itemData,
      id: `lit-${Date.now()}`,
    };
    const updated = [newItem, ...literatureItems];
    setLiteratureItems(updated);
    saveToFirestore(
      publishers,
      weeks,
      preachingGroups,
      customDuties,
      settings,
      outgoingSpeakers,
      fieldServiceMeetings,
      cartLocations,
      cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      memorialPlans,
      theocraticAssemblies,
      updated
    );
  };

  const updateLiteratureItem = (item: LiteratureItem) => {
    const updated = literatureItems.map(i => (i.id === item.id ? item : i));
    setLiteratureItems(updated);
    saveToFirestore(
      publishers,
      weeks,
      preachingGroups,
      customDuties,
      settings,
      outgoingSpeakers,
      fieldServiceMeetings,
      cartLocations,
      cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      memorialPlans,
      theocraticAssemblies,
      updated
    );
  };

  const deleteLiteratureItem = (id: string) => {
    const updated = literatureItems.filter(i => i.id !== id);
    setLiteratureItems(updated);
    saveToFirestore(
      publishers,
      weeks,
      preachingGroups,
      customDuties,
      settings,
      outgoingSpeakers,
      fieldServiceMeetings,
      cartLocations,
      cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      memorialPlans,
      theocraticAssemblies,
      updated
    );
  };

  const addSpecialOrder = (orderData: Omit<LiteratureSpecialOrder, 'id'>) => {
    const newOrder: LiteratureSpecialOrder = {
      ...orderData,
      id: `ord-${Date.now()}`,
    };
    const updated = [newOrder, ...specialOrders];
    setSpecialOrders(updated);
    saveToFirestore(
      publishers,
      weeks,
      preachingGroups,
      customDuties,
      settings,
      outgoingSpeakers,
      fieldServiceMeetings,
      cartLocations,
      cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      memorialPlans,
      theocraticAssemblies,
      literatureItems,
      updated
    );
  };

  const updateSpecialOrder = (order: LiteratureSpecialOrder) => {
    const updated = specialOrders.map(o => (o.id === order.id ? order : o));
    setSpecialOrders(updated);
    saveToFirestore(
      publishers,
      weeks,
      preachingGroups,
      customDuties,
      settings,
      outgoingSpeakers,
      fieldServiceMeetings,
      cartLocations,
      cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      memorialPlans,
      theocraticAssemblies,
      literatureItems,
      updated
    );
  };

  const deleteSpecialOrder = (id: string) => {
    const updated = specialOrders.filter(o => o.id !== id);
    setSpecialOrders(updated);
    saveToFirestore(
      publishers,
      weeks,
      preachingGroups,
      customDuties,
      settings,
      outgoingSpeakers,
      fieldServiceMeetings,
      cartLocations,
      cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      memorialPlans,
      theocraticAssemblies,
      literatureItems,
      updated
    );
  };

  const updateGroupDistribution = (dist: LiteratureGroupDistribution) => {
    const exists = groupDistributions.some(d => d.groupNumber === dist.groupNumber);
    const updated = exists
      ? groupDistributions.map(d => (d.groupNumber === dist.groupNumber ? dist : d))
      : [...groupDistributions, dist];
    setGroupDistributions(updated);
    saveToFirestore(
      publishers,
      weeks,
      preachingGroups,
      customDuties,
      settings,
      outgoingSpeakers,
      fieldServiceMeetings,
      cartLocations,
      cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      memorialPlans,
      theocraticAssemblies,
      literatureItems,
      specialOrders,
      updated
    );
  };

  const recordPhysicalCount = (recordData: Omit<LiteratureInventoryRecord, 'id'>) => {
    const newRecord: LiteratureInventoryRecord = {
      ...recordData,
      id: `inv-${Date.now()}`,
    };
    const updated = [newRecord, ...inventoryRecords];
    setInventoryRecords(updated);
    saveToFirestore(
      publishers,
      weeks,
      preachingGroups,
      customDuties,
      settings,
      outgoingSpeakers,
      fieldServiceMeetings,
      cartLocations,
      cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      memorialPlans,
      theocraticAssemblies,
      literatureItems,
      specialOrders,
      groupDistributions,
      updated
    );
  };

  const getS89SlipsForWeek = (week: WeekSchedule): S89Slip[] => {
    const slips: S89Slip[] = [];
    if (!week || !week.midweek) return slips;

    const midweek = week.midweek;
    const meetingDate = midweek.date || week.weekStartDate;

    // 1. Lectura de la Biblia (Sala Principal)
    if (midweek.tesoros?.lecturaBiblia?.publisherId) {
      const student = publishersMap.get(midweek.tesoros.lecturaBiblia.publisherId);
      slips.push({
        id: `s89-${week.id}-lectura-prin`,
        weekId: week.id,
        date: meetingDate,
        studentId: midweek.tesoros.lecturaBiblia.publisherId,
        studentName: student?.name || 'Estudiante',
        partNumber: 1,
        partTitle: 'Lectura de la Biblia',
        room: 'principal',
        lessonNumber: midweek.tesoros.lecturaBiblia.lessonNumber || student?.currentLessonNumber || 1,
        lessonTitle: 'Lectura con exactitud',
        deliveredStatus: midweek.tesoros.lecturaBiblia.status === 'confirmada' ? 'confirmada' : 'entregada',
      });
    }

    // 2. Lectura de la Biblia (Sala Auxiliar)
    if (midweek.tesoros?.lecturaBibliaAux?.publisherId) {
      const student = publishersMap.get(midweek.tesoros.lecturaBibliaAux.publisherId);
      slips.push({
        id: `s89-${week.id}-lectura-aux`,
        weekId: week.id,
        date: meetingDate,
        studentId: midweek.tesoros.lecturaBibliaAux.publisherId,
        studentName: student?.name || 'Estudiante',
        partNumber: 1,
        partTitle: 'Lectura de la Biblia (Sala auxiliar)',
        room: 'auxiliar',
        lessonNumber: midweek.tesoros.lecturaBibliaAux.lessonNumber || student?.currentLessonNumber || 1,
        lessonTitle: 'Lectura con exactitud',
        deliveredStatus: midweek.tesoros.lecturaBibliaAux.status === 'confirmada' ? 'confirmada' : 'entregada',
      });
    }

    // 3. Seamos Mejores Maestros (Partes de estudiantes)
    if (midweek.maestros?.items) {
      midweek.maestros.items.forEach((item, idx) => {
        if (item.publisherId) {
          const student = publishersMap.get(item.publisherId);
          const assistant = item.assistantId ? publishersMap.get(item.assistantId) : undefined;
          slips.push({
            id: `s89-${week.id}-m-${item.id || idx}`,
            weekId: week.id,
            date: meetingDate,
            studentId: item.publisherId,
            studentName: student?.name || 'Estudiante',
            assistantId: item.assistantId,
            assistantName: assistant?.name,
            partNumber: idx + 2,
            partTitle: item.title,
            room: item.room || 'principal',
            lessonNumber: item.lessonNumber || student?.currentLessonNumber,
            deliveredStatus: item.status === 'confirmada' ? 'confirmada' : 'pendiente',
            notes: item.notes,
          });
        }
      });
    }

    return slips;
  };

  const exportBackupJSON = () => {
    const backupData = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      congregationName: settings.congregationName,
      publishers,
      weeks,
      preachingGroups,
      customDuties,
      settings,
      outgoingSpeakers,
      fieldServiceMeetings,
      cartLocations,
      cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      memorialPlans,
      theocraticAssemblies,
      literatureItems,
      specialOrders,
      groupDistributions,
      inventoryRecords,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Respaldo_Kongre_${settings.congregationName.replace(/\s+/g, '_')}_${formatDateISO(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getBackupJSON = (): string => {
    const backupData = {
      publishers,
      weeks,
      preachingGroups,
      customDuties,
      settings,
      outgoingSpeakers,
      fieldServiceMeetings,
      cartLocations,
      cartShifts,
      notices,
      monthlyReports,
      territories,
      circuitVisit,
      transactions,
      quarterlyAudits,
      memorialPlans,
      theocraticAssemblies,
      literatureItems,
      specialOrders,
      groupDistributions,
      inventoryRecords,
    };
    return JSON.stringify(backupData, null, 2);
  };

  const importBackupJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.publishers || !data.weeks) {
        throw new Error('Formato de archivo inválido.');
      }
      if (Array.isArray(data.publishers)) setPublishers(data.publishers);
      if (Array.isArray(data.weeks)) setWeeks(unifyWeeksDuties(data.weeks));
      if (Array.isArray(data.preachingGroups)) setPreachingGroups(data.preachingGroups);
      if (Array.isArray(data.customDuties)) setCustomDuties(unifyAudioVideoDuties(data.customDuties));
      if (data.settings) setSettings(data.settings);
      if (Array.isArray(data.outgoingSpeakers)) setOutgoingSpeakers(data.outgoingSpeakers);
      if (Array.isArray(data.fieldServiceMeetings)) setFieldServiceMeetings(data.fieldServiceMeetings);
      if (Array.isArray(data.cartLocations)) setCartLocations(data.cartLocations);
      if (Array.isArray(data.cartShifts)) setCartShifts(data.cartShifts);
      if (Array.isArray(data.notices)) setNotices(data.notices);
      if (Array.isArray(data.monthlyReports)) setMonthlyReports(data.monthlyReports);
      if (Array.isArray(data.territories)) setTerritories(data.territories);
      if (data.circuitVisit) setCircuitVisit(data.circuitVisit);
      if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (Array.isArray(data.quarterlyAudits)) setQuarterlyAudits(data.quarterlyAudits);
      if (Array.isArray(data.memorialPlans)) setMemorialPlans(data.memorialPlans);
      if (Array.isArray(data.theocraticAssemblies)) setTheocraticAssemblies(data.theocraticAssemblies);
      if (Array.isArray(data.literatureItems)) setLiteratureItems(data.literatureItems);
      if (Array.isArray(data.specialOrders)) setSpecialOrders(data.specialOrders);
      if (Array.isArray(data.groupDistributions)) setGroupDistributions(data.groupDistributions);
      if (Array.isArray(data.inventoryRecords)) setInventoryRecords(data.inventoryRecords);
      saveToFirestore(
        data.publishers,
        data.weeks,
        data.preachingGroups,
        data.customDuties,
        data.settings,
        data.outgoingSpeakers,
        data.fieldServiceMeetings,
        data.cartLocations,
        data.cartShifts,
        data.notices,
        data.monthlyReports,
        data.territories,
        data.circuitVisit,
        data.transactions,
        data.quarterlyAudits,
        data.memorialPlans,
        data.theocraticAssemblies,
        data.literatureItems,
        data.specialOrders,
        data.groupDistributions,
        data.inventoryRecords
      );
      return true;
    } catch (err) {
      console.error('Error importing backup JSON:', err);
      return false;
    }
  };

  const cleanSampleData = async () => {
    // 1. Limpiar circuitos y breakers de prueba
    setBreakers([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_breakers`);

    // 2. Limpiar fichas de mantenimiento de prueba
    setMaintenanceSheets([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_maintenance_sheets`);

    // 3. Limpiar registros de cuentas / auditorías / avisos de prueba
    setTransactions([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_transactions`);
    setQuarterlyAudits([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_quarterly_audits`);
    setNotices([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_notices`);
    setMemorialPlans([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_memorial_plans`);
    setTheocraticAssemblies([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_assemblies`);
    setLiteratureItems([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_literature_items`);
    setSpecialOrders([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_special_orders`);
    setGroupDistributions([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_group_distributions`);
    setInventoryRecords([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_inventory_records`);
    setHospitalityHosts([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_hospitality_hosts`);
    setAuxPioneerRequests([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_aux_pioneer_requests`);
    setBranchReportsS1([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_branch_reports_s1`);
    setCartLocations([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_cart_locations`);
    setCartShifts([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_cart_shifts`);
    setFieldServiceMeetings([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_field_service`);
    setOutgoingSpeakers([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_outgoing_speakers`);

    // 4. Limpiar asignaciones en semanas para dejarlas sin hermanos asignados de prueba
    const cleanedWeeks = weeks.map((w) => {
      const cloned: WeekSchedule = JSON.parse(JSON.stringify(w));
      cloned.midweek.presidentId = '';
      cloned.midweek.initialPrayerId = '';
      cloned.midweek.finalPrayerId = '';
      if (cloned.midweek.tesoros?.lecturaBiblia) cloned.midweek.tesoros.lecturaBiblia.publisherId = '';
      if (cloned.midweek.tesoros?.lecturaBibliaAux) cloned.midweek.tesoros.lecturaBibliaAux.publisherId = '';
      if (cloned.midweek.tesoros?.discurso) cloned.midweek.tesoros.discurso.publisherId = '';
      if (cloned.midweek.tesoros?.perlas) cloned.midweek.tesoros.perlas.publisherId = '';
      if (cloned.midweek.maestros?.items) {
        cloned.midweek.maestros.items.forEach((item) => {
          item.publisherId = '';
          item.assistantId = '';
        });
      }
      if (cloned.midweek.vidaCristiana?.items) {
        cloned.midweek.vidaCristiana.items.forEach((item) => {
          item.publisherId = '';
        });
      }
      if (cloned.midweek.vidaCristiana?.estudioBiblico) {
        cloned.midweek.vidaCristiana.estudioBiblico.conductorId = '';
        cloned.midweek.vidaCristiana.estudioBiblico.lectorId = '';
      }
      cloned.midweek.duties = {
        deber_audio: [],
        deber_video: [],
        deber_microfonos: [],
        deber_plataforma: [],
        deber_acomodador: [],
        deber_seguridad: [],
        deber_zoom: [],
      };
      cloned.weekend.presidentId = '';
      cloned.weekend.publicTalkSpeaker = '';
      cloned.weekend.atalayaConductorId = '';
      cloned.weekend.atalayaLectorId = '';
      cloned.weekend.initialPrayerId = '';
      cloned.weekend.finalPrayerId = '';
      cloned.weekend.duties = {
        deber_audio: [],
        deber_video: [],
        deber_microfonos: [],
        deber_plataforma: [],
        deber_acomodador: [],
        deber_seguridad: [],
        deber_zoom: [],
      };
      return cloned;
    });
    setWeeks(cleanedWeeks);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_weeks`, JSON.stringify(cleanedWeeks));

    // Guardar estado limpio preservando los datos de la congregación y horarios
    await saveToFirestore(
      publishers,
      cleanedWeeks,
      preachingGroups,
      customDuties,
      latestSettingsRef.current,
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      null,
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      clmProgramas
    );
  };

  const clearAllPublishers = async () => {
    if (!publishers || publishers.length === 0) {
      setPublishers([]);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_publishers`, JSON.stringify([]));
      return;
    }
    await deletePublishersBatch(publishers.map(p => p.id));
  };

  const resetAllCongregationData = () => {
    setPublishers([]);
    setPreachingGroups([]);
    setOutgoingSpeakers([]);
    setFieldServiceMeetings([]);
    setCartLocations([]);
    setCartShifts([]);
    setNotices([]);
    setMonthlyReports([]);
    setTerritories([]);
    setCircuitVisit(null);
    setTransactions([]);
    setQuarterlyAudits([]);
    setMemorialPlans([]);
    setTheocraticAssemblies([]);
    setLiteratureItems([]);
    setSpecialOrders([]);
    setGroupDistributions([]);
    setInventoryRecords([]);
    setHospitalityHosts([]);
    setBreakers([]);
    setMaintenanceSheets([]);
    setAuxPioneerRequests([]);
    setBranchReportsS1([]);
    setSettings(INITIAL_SETTINGS);
    latestSettingsRef.current = INITIAL_SETTINGS;
    const cleanWeeks = generateInitialWeeks();
    setWeeks(cleanWeeks);

    const keysToClear = [
      `${LOCAL_STORAGE_KEY}_publishers`,
      `${LOCAL_STORAGE_KEY}_weeks`,
      `${LOCAL_STORAGE_KEY}_groups`,
      `${LOCAL_STORAGE_KEY}_duties`,
      `${LOCAL_STORAGE_KEY}_settings`,
      `${LOCAL_STORAGE_KEY}_outgoing_speakers`,
      `${LOCAL_STORAGE_KEY}_field_service`,
      `${LOCAL_STORAGE_KEY}_cart_locations`,
      `${LOCAL_STORAGE_KEY}_cart_shifts`,
      `${LOCAL_STORAGE_KEY}_notices`,
      `${LOCAL_STORAGE_KEY}_monthly_reports`,
      `${LOCAL_STORAGE_KEY}_territories`,
      `${LOCAL_STORAGE_KEY}_circuit_visit`,
      `${LOCAL_STORAGE_KEY}_transactions`,
      `${LOCAL_STORAGE_KEY}_quarterly_audits`,
      `${LOCAL_STORAGE_KEY}_memorial_plans`,
      `${LOCAL_STORAGE_KEY}_assemblies`,
      `${LOCAL_STORAGE_KEY}_literature_items`,
      `${LOCAL_STORAGE_KEY}_special_orders`,
      `${LOCAL_STORAGE_KEY}_group_distributions`,
      `${LOCAL_STORAGE_KEY}_inventory_records`,
      `${LOCAL_STORAGE_KEY}_hospitality_hosts`,
      `${LOCAL_STORAGE_KEY}_breakers`,
      `${LOCAL_STORAGE_KEY}_maintenance_sheets`,
      `${LOCAL_STORAGE_KEY}_aux_pioneer_requests`,
      `${LOCAL_STORAGE_KEY}_branch_reports_s1`,
      'kongre_has_entered_app',
      'kongre_is_registered_congregation',
      'kongre_theocratic_invitations_v1',
      'kongre_user_roles_v1',
      'kongre_device_sessions_v1',
      'kongre_congregation_name',
      'kongre_midweek_day',
      'kongre_midweek_time',
      'kongre_weekend_day',
      'kongre_weekend_time',
      'kongre_saved_settings_backup',
      'kongre_last_local_update',
    ];
    keysToClear.forEach((k) => localStorage.removeItem(k));

    if (user) {
      saveToFirestore(
        [],
        cleanWeeks,
        [],
        customDuties,
        INITIAL_SETTINGS,
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        null,
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        {}
      );
    }
  };

  /**
   * Restaura y activa inmediatamente la congregación para usuarios que ya se habían registrado
   * previamente (incluso antes del cambio de PINs personales únicos).
   */
  const restorePreviousRegistration = async (
    congName?: string,
    coordName?: string,
    congPin?: string
  ) => {
    const storedName = localStorage.getItem('kongre_congregation_name');
    const candidateName = congName?.trim() || latestSettingsRef.current.congregationName || storedName || '';
    const finalName = getFriendlyCongregationName(candidateName, candidateName || 'Congregación Central');
    const finalCoordName = coordName?.trim() || latestSettingsRef.current.coordinatorName || user?.displayName || 'Coordinador';
    const finalEmail = user?.email || latestSettingsRef.current.coordinatorEmail || 'coordinador@kongre.org';
    const finalId = latestSettingsRef.current.congregationNumber || latestSettingsRef.current.congregationId || '1001';

    const newSettings: CongregationSettings = {
      ...latestSettingsRef.current,
      congregationName: finalName,
      congregationNumber: finalId,
      congregationId: finalId,
      coordinatorName: finalCoordName,
      coordinatorEmail: finalEmail,
      isRegistered: true,
      registeredAt: latestSettingsRef.current.registeredAt || new Date().toISOString(),
    };

    latestSettingsRef.current = newSettings;
    setSettings(newSettings);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(newSettings));
    localStorage.setItem('kongre_saved_settings_backup', JSON.stringify(newSettings));
    if (finalName && !isCongregationIdString(finalName)) {
      localStorage.setItem('kongre_congregation_name', finalName);
    }
    localStorage.setItem('kongre_is_registered_congregation', 'true');
    localStorage.setItem('kongre_has_entered_app', 'true');

    // Assign coordinator role to current email in AuthContext
    if (finalEmail) {
      assignRoleToEmail(finalEmail, 'coordinador', finalCoordName);
    }

    if (user && !isFirestoreQuotaExceeded()) {
      try {
        const userDocRef = doc(db, 'users', user.uid, 'congregation_data', 'main');
        await setDoc(userDocRef, sanitizeForFirestore({ settings: newSettings, updatedAt: new Date().toISOString() }), { merge: true });
      } catch (err: any) {
        if (isQuotaError(err)) {
          await markFirestoreQuotaExceeded();
        } else {
          console.warn('Aviso guardando settings en Firestore:', err);
        }
      }
    }
  };

  // Account Link Requests
  const createAccountLinkRequest = async (
    email: string,
    brotherName: string,
    personalPin: string,
    role: string,
    congregationId: string
  ): Promise<AccountLinkRequest> => {
    const cleanEmail = email.toLowerCase().trim();
    const existing = accountLinkRequests.find(
      (r) => r.email === cleanEmail && r.congregationId === congregationId && r.status === 'pending'
    );
    if (existing) return existing;

    const newReq: AccountLinkRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      brotherName: brotherName.trim(),
      personalPin: personalPin.trim(),
      role,
      congregationId,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };

    const updated = [newReq, ...accountLinkRequests.filter((r) => r.email !== cleanEmail)];
    setAccountLinkRequests(updated);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_account_link_requests`, JSON.stringify(updated));

    if (user) {
      await saveToFirestore(
        publishers,
        weeks,
        preachingGroups,
        customDuties,
        settings,
        outgoingSpeakers,
        fieldServiceMeetings,
        cartLocations,
        cartShifts,
        notices,
        monthlyReports,
        territories,
        circuitVisit,
        transactions,
        quarterlyAudits,
        memorialPlans,
        theocraticAssemblies,
        literatureItems,
        specialOrders,
        groupDistributions,
        inventoryRecords,
        updated
      );
    }

    return newReq;
  };

  const approveAccountLinkRequest = async (requestId: string, reviewerEmail: string) => {
    const targetReq = accountLinkRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    const approvedReq: AccountLinkRequest = {
      ...targetReq,
      status: 'approved',
      reviewedBy: reviewerEmail,
      reviewedAt: new Date().toISOString(),
    };

    const updatedRequests = accountLinkRequests.map((req) =>
      req.id === requestId ? approvedReq : req
    );

    setAccountLinkRequests(updatedRequests);
    localStorage.setItem(
      `${LOCAL_STORAGE_KEY}_account_link_requests`,
      JSON.stringify(updatedRequests)
    );

    const { email, brotherName, role, personalPin } = approvedReq;
    const cleanEmail = email.toLowerCase().trim();

    // 1. Update publisher profile email if publisher exists by name
    let updatedPubs = [...publishers];
    const pubIndex = updatedPubs.findIndex(
      (p) => p.name.toLowerCase().trim() === brotherName.toLowerCase().trim()
    );
    if (pubIndex >= 0) {
      updatedPubs[pubIndex] = { ...updatedPubs[pubIndex], email: cleanEmail };
      setPublishers(updatedPubs);
    }

    // 2. Assign role to email in AuthContext
    assignRoleToEmail(cleanEmail, role as TheocraticRole, brotherName, personalPin);

    // 3. Save to Firestore
    if (user) {
      await saveToFirestore(
        updatedPubs,
        weeks,
        preachingGroups,
        customDuties,
        settings,
        outgoingSpeakers,
        fieldServiceMeetings,
        cartLocations,
        cartShifts,
        notices,
        monthlyReports,
        territories,
        circuitVisit,
        transactions,
        quarterlyAudits,
        memorialPlans,
        theocraticAssemblies,
        literatureItems,
        specialOrders,
        groupDistributions,
        inventoryRecords,
        updatedRequests
      );
    }
  };

  const rejectAccountLinkRequest = async (requestId: string, reviewerEmail: string, reason?: string) => {
    const updatedRequests = accountLinkRequests.map((req) => {
      if (req.id === requestId) {
        return {
          ...req,
          status: 'rejected' as const,
          reviewedBy: reviewerEmail,
          reviewedAt: new Date().toISOString(),
          rejectionReason: reason || 'Rechazado por los ancianos de la congregación.',
        };
      }
      return req;
    });

    setAccountLinkRequests(updatedRequests);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_account_link_requests`, JSON.stringify(updatedRequests));

    if (user) {
      await saveToFirestore(
        publishers,
        weeks,
        preachingGroups,
        customDuties,
        settings,
        outgoingSpeakers,
        fieldServiceMeetings,
        cartLocations,
        cartShifts,
        notices,
        monthlyReports,
        territories,
        circuitVisit,
        transactions,
        quarterlyAudits,
        memorialPlans,
        theocraticAssemblies,
        literatureItems,
        specialOrders,
        groupDistributions,
        inventoryRecords,
        updatedRequests
      );
    }
  };

  return (
    <CongregationContext.Provider
      value={{
        publishers,
        weeks,
        currentWeek,
        currentWeekId,
        setCurrentWeekId,
        preachingGroups,
        customDuties,
        settings,
        conflicts,
        allWeeksConflicts,
        syncStatus,
        outgoingSpeakers,
        fieldServiceMeetings,
        cartLocations,
        cartShifts,
        notices,
        monthlyReports,
        territories,
        circuitVisit,
        transactions,
        quarterlyAudits,
        memorialPlans,
        theocraticAssemblies,
        literatureItems,
        specialOrders,
        groupDistributions,
        inventoryRecords,
        addPublisher,
        updatePublisher,
        deletePublisher,
        deletePublishersBatch,
        importPublishersFromCSV,
        updateWeek,
        addNextWeek,
        copyWeekStructure,
        syncWeekWithOrganized,
        syncAllWeeksWithOrganized,
        autoAssignCurrentWeek,
        autoAssignAllWeeksInMonth,
        clearWeekAssignments,
        replaceAssignment,
        updateAssignmentStatus,
        advancePublisherLesson,
        repeatPublisherLesson,
        updateMeetingAttendance,
        clmProgramas,
        updateClmPrograma,
        getClmPrograma,
        addOutgoingSpeaker,
        updateOutgoingSpeaker,
        deleteOutgoingSpeaker,
        hospitalityHosts,
        addHospitalityHost,
        updateHospitalityHost,
        deleteHospitalityHost,
        breakers,
        addBreaker,
        updateBreaker,
        deleteBreaker,
        toggleBreakerStatus,
        setMeetingBreakersPower,
        reorderBreakers,
        maintenanceSheets,
        addMaintenanceSheet,
        updateMaintenanceSheet,
        deleteMaintenanceSheet,
        toggleMaintenanceSheetActive,
        markMaintenanceSheetCompleted,
        reorderMaintenanceSheets,
        auxPioneerRequests,
        addAuxPioneerRequest,
        updateAuxPioneerRequest,
        deleteAuxPioneerRequest,
        setAuxPioneerRequestStatus,
        branchReportsS1,
        updateBranchReportS1,
        markBranchReportS1Status,
        addFieldServiceMeeting,
        updateFieldServiceMeeting,
        deleteFieldServiceMeeting,
        addCartLocation,
        updateCartLocation,
        deleteCartLocation,
        addCartShift,
        updateCartShift,
        deleteCartShift,
        addNotice,
        updateNotice,
        deleteNotice,
        updateMonthlyReport,
        batchUpdateMonthlyReports,
        addTerritory,
        updateTerritory,
        deleteTerritory,
        assignTerritory,
        returnTerritory,
        extendTerritoryDueDate,
        addNoVisitAddress,
        removeNoVisitAddress,
        updateCircuitVisit,
        updateMealArrangement,
        updateMinistryArrangement,
        toggleVisitChecklistItem,
        addSpecialMeeting,
        removeSpecialMeeting,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateQuarterlyAudit,
        updateMemorialPlan,
        addTheocraticAssembly,
        updateTheocraticAssembly,
        deleteTheocraticAssembly,
        addLiteratureItem,
        updateLiteratureItem,
        deleteLiteratureItem,
        addSpecialOrder,
        updateSpecialOrder,
        deleteSpecialOrder,
        updateGroupDistribution,
        recordPhysicalCount,
        getS89SlipsForWeek,
        updatePreachingGroups,
        addCustomDuty,
        updateCustomDuty,
        deleteCustomDuty,
        updateSettings,
        exportBackupJSON,
        getBackupJSON,
        importBackupJSON,
        publishersMap,
        cleanSampleData,
        clearAllPublishers,
        resetAllCongregationData,
        restorePreviousRegistration,
        uploadLocalDataToGoogle,
        downloadDataFromGoogle,
        loadCongregationFromCloud,
        accountLinkRequests,
        createAccountLinkRequest,
        approveAccountLinkRequest,
        rejectAccountLinkRequest,
      }}
    >
      {children}
    </CongregationContext.Provider>
  );
};

export const useCongregation = () => {
  const context = useContext(CongregationContext);
  if (!context) throw new Error('useCongregation must be used within a CongregationProvider');
  return context;
};
