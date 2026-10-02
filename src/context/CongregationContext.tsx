// src/context/CongregationContext.tsx
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
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
} from '../types';
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
  generateInitialWeeks,
  createEmptyWeek,
  formatDateISO,
} from '../utils/sampleData';
import { getOrganizedScheduleForWeek, applyOrganizedToWeek, isWeekNeedingOrganizedSync } from '../utils/organizedSync';
import { detectConflictsInWeek } from '../utils/conflictDetector';
import { autoAssignWeek } from '../utils/autoAssigner';
import { OFFICIAL_STUDENT_LESSONS } from '../utils/theocraticData';

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
  deletePublisher: (id: string) => void;
  importPublishersFromCSV: (csvText: string) => number;

  // Week schedule actions
  updateWeek: (week: WeekSchedule) => void;
  addNextWeek: () => void;
  copyWeekStructure: (fromWeekId: string, toWeekId: string) => void;
  autoAssignCurrentWeek: () => void;
  autoAssignAllWeeksInMonth: (monthPrefix: string) => void;
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

  // Outgoing Speakers
  addOutgoingSpeaker: (item: Omit<OutgoingSpeakerAssignment, 'id'>) => void;
  updateOutgoingSpeaker: (item: OutgoingSpeakerAssignment) => void;
  deleteOutgoingSpeaker: (id: string) => void;

  // Field Service Meetings
  addFieldServiceMeeting: (item: Omit<FieldServiceMeeting, 'id'>) => void;
  updateFieldServiceMeeting: (item: FieldServiceMeeting) => void;
  deleteFieldServiceMeeting: (id: string) => void;

  // Cart Witnessing (Organized)
  addCartLocation: (loc: Omit<CartLocation, 'id'>) => void;
  updateCartLocation: (loc: CartLocation) => void;
  deleteCartLocation: (id: string) => void;
  addCartShift: (shift: Omit<CartShift, 'id'>) => void;
  updateCartShift: (shift: CartShift) => void;
  deleteCartShift: (id: string) => void;

  // Notices (Organized)
  addNotice: (notice: Omit<CongregationNotice, 'id'>) => void;
  updateNotice: (notice: CongregationNotice) => void;
  deleteNotice: (id: string) => void;

  // Monthly Service Reports S-4 (Organized)
  updateMonthlyReport: (report: MonthlyServiceReport) => void;
  batchUpdateMonthlyReports: (reports: MonthlyServiceReport[]) => void;

  // Territories S-13 (Organized / NW Scheduler)
  addTerritory: (terr: Omit<Territory, 'id' | 'history'>) => void;
  updateTerritory: (terr: Territory) => void;
  deleteTerritory: (id: string) => void;
  assignTerritory: (territoryId: string, publisherId: string, assignedDate?: string, dueDate?: string, notes?: string) => void;
  returnTerritory: (territoryId: string, returnedDate?: string, notes?: string) => void;
  extendTerritoryDueDate: (territoryId: string, newDueDate: string) => void;
  addNoVisitAddress: (territoryId: string, noVisit: Omit<NoVisitAddress, 'id'>) => void;
  removeNoVisitAddress: (territoryId: string, noVisitId: string) => void;

  // Circuit Overseer Visit (NW Scheduler / Organized)
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

  // S-89 Slips extraction (Organized)
  getS89SlipsForWeek: (week: WeekSchedule) => S89Slip[];

  // Cleaning & Groups
  updatePreachingGroups: (groups: PreachingGroup[]) => void;

  // Custom Duties
  addCustomDuty: (duty: Omit<CustomDuty, 'id'>) => void;
  updateCustomDuty: (duty: CustomDuty) => void;
  deleteCustomDuty: (id: string) => void;

  // Settings & Backup
  updateSettings: (newSettings: Partial<CongregationSettings>) => void;
  exportBackupJSON: () => void;
  getBackupJSON: () => string;
  importBackupJSON: (jsonString: string) => boolean;
  publishersMap: Map<string, Publisher>;
  resetAllCongregationData: () => void;
}

const LOCAL_STORAGE_KEY = 'teocratic_app_data_v1';

// Purge legacy mock data once to ensure a clean slate for new congregation registration
const PURGE_KEY = 'kongre_data_purged_fresh_start_v3';
if (typeof window !== 'undefined' && localStorage.getItem(PURGE_KEY) !== 'true') {
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
    'kongre_has_entered_app',
    'kongre_is_registered_congregation',
    'kongre_theocratic_invitations_v1',
    'kongre_user_roles_v1',
    'kongre_device_sessions_v1',
  ];
  keysToClear.forEach((k) => localStorage.removeItem(k));
  localStorage.setItem(PURGE_KEY, 'true');
}

const CongregationContext = createContext<CongregationContextType | null>(null);

export const CongregationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [publishers, setPublishers] = useState<Publisher[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_publishers`);
    return saved ? JSON.parse(saved) : INITIAL_PUBLISHERS;
  });

  const [weeks, setWeeks] = useState<WeekSchedule[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_weeks`);
    const initialRaw: WeekSchedule[] = saved ? JSON.parse(saved) : generateInitialWeeks();
    return initialRaw.map(w => {
      if (isWeekNeedingOrganizedSync(w)) {
        const org = getOrganizedScheduleForWeek(w.id, w.weekStartDate);
        return org ? applyOrganizedToWeek(w, org) : w;
      }
      return w;
    });
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
    return saved ? JSON.parse(saved) : INITIAL_CUSTOM_DUTIES;
  });

  const [settings, setSettings] = useState<CongregationSettings>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_settings`);
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [outgoingSpeakers, setOutgoingSpeakers] = useState<OutgoingSpeakerAssignment[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_outgoing_speakers`);
    return saved ? JSON.parse(saved) : INITIAL_OUTGOING_SPEAKERS;
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

  // Firestore Sync: Load and listen when user is logged in
  useEffect(() => {
    if (!user) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('saving');
    const userDocRef = doc(db, 'users', user.uid, 'congregation_data', 'main');

    const unsubscribe = onSnapshot(
      userDocRef,
      docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();

          // If Firestore contains old mock data from previous demo sessions, reset it to clean state
          if (
            data.settings?.congregationName === 'Congregación El Olivar' ||
            data.settings?.congregationName === 'Congregación Central' ||
            data.settings?.isRegistered === false ||
            !data.settings?.isRegistered
          ) {
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
            setSettings(INITIAL_SETTINGS);
            setWeeks(generateInitialWeeks());
            setSyncStatus('synced');
            return;
          }

          if (data.publishers) setPublishers(data.publishers);
          if (data.weeks) {
            const enrichedWeeks = data.weeks.map((w: WeekSchedule) => {
              if (isWeekNeedingOrganizedSync(w)) {
                const org = getOrganizedScheduleForWeek(w.id, w.weekStartDate);
                return org ? applyOrganizedToWeek(w, org) : w;
              }
              return w;
            });
            setWeeks(enrichedWeeks);
          }
          if (data.preachingGroups) setPreachingGroups(data.preachingGroups);
          if (data.customDuties) setCustomDuties(data.customDuties);
          if (data.settings) setSettings(data.settings);
          if (data.outgoingSpeakers) setOutgoingSpeakers(data.outgoingSpeakers);
          if (data.fieldServiceMeetings) setFieldServiceMeetings(data.fieldServiceMeetings);
          if (data.cartLocations) setCartLocations(data.cartLocations);
          if (data.cartShifts) setCartShifts(data.cartShifts);
          if (data.notices) setNotices(data.notices);
          if (data.monthlyReports) setMonthlyReports(data.monthlyReports);
          if (data.territories) setTerritories(data.territories);
          if (data.circuitVisit) setCircuitVisit(data.circuitVisit);
          if (data.transactions) setTransactions(data.transactions);
          if (data.quarterlyAudits) setQuarterlyAudits(data.quarterlyAudits);
          if (data.memorialPlans) setMemorialPlans(data.memorialPlans);
          if (data.theocraticAssemblies) setTheocraticAssemblies(data.theocraticAssemblies);
          if (data.literatureItems) setLiteratureItems(data.literatureItems);
          if (data.specialOrders) setSpecialOrders(data.specialOrders);
          if (data.groupDistributions) setGroupDistributions(data.groupDistributions);
          if (data.inventoryRecords) setInventoryRecords(data.inventoryRecords);
          setSyncStatus('synced');
        } else {
          // First time user logged in: write current state to Firestore
          const initialPayload = {
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
            updatedAt: new Date().toISOString(),
          };
          setDoc(userDocRef, initialPayload, { merge: true })
            .then(() => setSyncStatus('synced'))
            .catch(err => {
              console.error('Error saving initial state to Firestore:', err);
              setSyncStatus('error');
            });
        }
      },
      err => {
        console.error('Firestore listener error:', err);
        setSyncStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Helper to sync changes to Firestore whenever state updates
  const saveToFirestore = async (
    newPubs = publishers,
    newWeeks = weeks,
    newGroups = preachingGroups,
    newDuties = customDuties,
    newSettings = settings,
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
    newInventoryRecords = inventoryRecords
  ) => {
    if (!user) return;
    setSyncStatus('saving');
    try {
      const userDocRef = doc(db, 'users', user.uid, 'congregation_data', 'main');
      await setDoc(userDocRef, {
        publishers: newPubs,
        weeks: newWeeks,
        preachingGroups: newGroups,
        customDuties: newDuties,
        settings: newSettings,
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
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error syncing to Firestore:', err);
      setSyncStatus('error');
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

  const deletePublisher = (id: string) => {
    const updated = publishers.filter(p => p.id !== id);
    setPublishers(updated);
    saveToFirestore(updated);
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
    saveToFirestore(publishers, updated);
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

    const newWeek = createEmptyWeek(nextMonday, weeks.length);
    const updated = [...weeks, newWeek];
    setWeeks(updated);
    setCurrentWeekId(newWeek.id);
    saveToFirestore(publishers, updated);
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

  const updateSettings = (newSettings: Partial<CongregationSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    saveToFirestore(publishers, weeks, preachingGroups, customDuties, merged);
  };

  // Organized features actions
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

  // Circuit Overseer Visit actions (NW Scheduler / Organized)
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
    link.download = `Respaldo_Organized_${settings.congregationName.replace(/\s+/g, '_')}_${formatDateISO(new Date())}.json`;
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
      if (Array.isArray(data.weeks)) setWeeks(data.weeks);
      if (Array.isArray(data.preachingGroups)) setPreachingGroups(data.preachingGroups);
      if (Array.isArray(data.customDuties)) setCustomDuties(data.customDuties);
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
    setSettings(INITIAL_SETTINGS);
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
      'kongre_has_entered_app',
      'kongre_is_registered_congregation',
      'kongre_theocratic_invitations_v1',
      'kongre_user_roles_v1',
      'kongre_device_sessions_v1',
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
        []
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
        importPublishersFromCSV,
        updateWeek,
        addNextWeek,
        copyWeekStructure,
        autoAssignCurrentWeek,
        autoAssignAllWeeksInMonth,
        replaceAssignment,
        updateAssignmentStatus,
        advancePublisherLesson,
        repeatPublisherLesson,
        updateMeetingAttendance,
        addOutgoingSpeaker,
        updateOutgoingSpeaker,
        deleteOutgoingSpeaker,
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
        resetAllCongregationData,
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
