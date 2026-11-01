// src/types/index.ts
import type { TheocraticRole } from '../utils/rbac';

export type Gender = 'hermano' | 'hermana' | 'male' | 'female';

export type AssignmentStatus = 'pendiente' | 'confirmada' | 'rechazada';

export type TheocraticPrivilege =
  | 'anciano'
  | 'siervo_ministerial'
  | 'precursor_regular'
  | 'precursor_especial'
  | 'precursor_auxiliar'
  | 'publicador_bautizado'
  | 'publicador_no_bautizado';

export interface Absence {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason?: string;
}

export interface PublisherAbsence {
  id: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

export interface PublisherChangeLog {
  id: string;
  nid: string;
  campo: string;
  valor_ant: string | null;
  valor_new: string | null;
  cambiado_por: string;
  fecha: string;
  nombre_publicador?: string;
}

export interface StudentLessonRecord {
  id: string;
  lessonNumber: number;
  lessonTitle: string;
  date: string;
  status: 'completada' | 'continuar';
  notes?: string;
}

export interface PublisherRoles {
  // Vida y Ministerio Cristianos (Entre semana)
  vym_presidente: boolean;
  vym_oracion: boolean;
  vym_tesoros_discurso: boolean;
  vym_tesoros_perlas: boolean;
  vym_tesoros_lectura: boolean;
  vym_maestros_titular: boolean;
  vym_maestros_ayudante: boolean;
  vym_vida_partes: boolean;
  vym_estudio_conductor: boolean;
  vym_estudio_lector: boolean;

  // Fin de semana
  fds_presidente: boolean;
  fds_atalaya_lector: boolean;
  fds_oracion: boolean;

  // Deberes
  deber_acomodador: boolean;
  deber_seguridad: boolean;
  deber_audio: boolean;
  deber_video: boolean;
  deber_microfonos: boolean;
  deber_plataforma: boolean;
  deber_zoom: boolean;

  // Deberes personalizados (clave dinámica booleana)
  [customDutyKey: string]: boolean;
}

export interface Publisher {
  id: string;
  publisherCode?: string; // ID Único de Publicador (ej. 'PUB-01')
  name: string;
  gender: Gender;
  phone: string;
  email?: string;
  photoURL?: string;
  privilege?: TheocraticPrivilege;
  theocraticRole?: TheocraticRole;
  theocraticRoles?: TheocraticRole[];
  personalPin?: string;
  personalPinHash?: string;
  encryptedPin?: string;
  twoFactorEnabled?: boolean;
  twoFactorEnabledAt?: string;
  notes?: string;
  active: boolean;
  groupNumber?: number; // Grupo de predicación
  absences: Absence[];
  currentLessonNumber?: number;
  lessonsHistory?: StudentLessonRecord[];
  preparedOutlines?: number[]; // Bosquejos de discursos públicos preparados
  roles: PublisherRoles;
  createdAt?: string;

  // Registro Oficial S-21 (Congregation's Publisher Record)
  birthDate?: string; // YYYY-MM-DD
  baptismDate?: string; // YYYY-MM-DD
  hope?: 'otras_ovejas' | 'ungido';
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  pioneerStatus?: 'ninguno' | 'auxiliar_continuo' | 'regular' | 'especial';
  pioneerStartDate?: string; // YYYY-MM-DD

  // Extensiones de compatibilidad CLM y Kongre Directorio
  nid?: string;
  full_name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  second_last_name?: string;
  nip?: string;
  is_admin?: boolean;
  role?: 'super_admin' | 'elder' | 'servant' | 'publisher' | 'unbaptized' | string;
  status?: 'active' | 'irregular' | 'inactive' | 'removed' | 'deleted' | string;
  is_approved?: boolean;
  spiritualStatus?: 'elder' | 'ministerial_servant' | 'anciano' | 'siervo_ministerial' | 'publicador' | 'publisher' | string;
  serviceRole?: 'regular_pioneer' | 'special_pioneer' | 'precursor_regular' | 'precursor_auxiliar' | 'publicador' | string;
  privileges?: string[];
  privilegios?: string[];
  home_phone?: string;
  birth_date?: string;
  roles_array?: string[];
  admin_permissions?: string[];
  emergency_contacts?: any[];
  assignment_metadata?: Record<string, any>;
  s21_records?: Record<string, any[]>;
  id_grupo?: string | null;
  ausencias?: PublisherAbsence[];
  is_elderly?: boolean;
  is_infirm?: boolean;
  is_deaf?: boolean;
  is_blind?: boolean;
  is_imprisoned?: boolean;
  is_head_of_household?: boolean;
  is_child?: boolean;
  is_moved?: boolean;
  baptism_date?: string;
  publisher_date?: string;
  last_visit_date?: string;
  pioneer_type?: 'none' | 'auxiliary_continuous' | 'regular' | 'special' | 'missionary' | string;
  is_active?: boolean;
  is_regular?: boolean;
  is_anointed?: boolean;
  has_key?: boolean;
  reports_to_branch?: boolean;
  is_disfellowshipped?: boolean;
  is_reinstated?: boolean;
  spiritual_notes?: string;
  group_responsibility?: 'none' | 'overseer' | 'assistant' | string;
  is_inactive?: boolean;
  printed_watchtower?: boolean;
  printed_guide?: boolean;
  is_cart_approved?: boolean;
  cart_available_days?: number[];
  fixed_cart_partner_nid?: string;

  // Información Personal Extendida & Teocrática
  marital_status?: 'soltero' | 'casado' | 'viudo' | 'divorciado' | 'separado' | string;
  spouse_name?: string;
  spouse_nid?: string;
  parent_guardian_nid?: string;
  parent_guardian_name?: string;
  familyId?: string; // Identificador de núcleo familiar (ej. 'FAM-PEREZ')
  familyMemberIds?: string[]; // IDs de otros publicadores que pertenecen al mismo núcleo familiar
  groupWithFamilyInMeetings?: boolean; // Preferencia: Agrupar con miembros de su familia en la misma reunión/turno
  neighborhood?: string;
  city?: string;
  postal_code?: string;
  address_reference?: string; // Referencias de llegada / Entre calles
  maps_url?: string; // Enlace de ubicación GPS / Google Maps
  has_vehicle?: boolean;
  vehicle_seats?: number; // Asientos disponibles para apoyo
  needs_ride?: boolean;
  occupation?: string;
  skills?: string[];
  languages?: string[];
  preferred_contact_method?: 'whatsapp' | 'call' | 'email';

  // Trayectoria Espiritual y Pastoreo Extendido
  appointment_date?: string; // Fecha de nombramiento como Anciano / Siervo
  pioneer_school_date?: string; // Fecha de última Escuela del Servicio de Precursor
  last_shepherding_visit?: string; // YYYY-MM-DD
  shepherding_elders?: string; // Ancianos que realizaron la última visita
  pastoral_priority?: 'normal' | 'atencion' | 'urgente';
  is_reproved?: boolean;

  // Necesidades Especiales, Publicaciones y Mudanza
  large_print?: boolean;
  zoom_regular?: boolean;
  special_seating?: boolean;
  moved_congregation_name?: string;
  moved_date?: string;
  letter_of_introduction_sent?: boolean;

  // Directriz Médica Anticipada (DPA / Asuntos Médicos)
  has_dpa?: boolean;
  dpa_date?: string;
  dpa_expiry_date?: string;
  dpa_copy_on_file?: boolean;
  healthcare_agent_name?: string;
  healthcare_agent_phone?: string;
  healthcare_agent_alternate_name?: string;
  healthcare_agent_alternate_phone?: string;
  medical_allergies?: string;
  medical_conditions?: string;

  // Historial de Auditoría Local
  change_history?: PublisherChangeLog[];

  assignments?: {
    chairman?: boolean;
    prayers?: boolean;
    talk?: boolean;
    gems?: boolean;
    reading?: boolean;
    conversations?: boolean;
    return_visits?: boolean;
    disciples?: boolean;
    bible_study?: boolean;
    reader_living?: boolean;
    assistant_student?: boolean;
    [key: string]: boolean | undefined;
  };
}

// Assignment item in a meeting
export interface AssignmentItem {
  id: string;
  title: string;
  type: string; // e.g. 'vym_tesoros_discurso', 'vym_maestros_titular', 'deber_audio'
  timeMinutes?: number;
  publisherId?: string;
  assistantId?: string; // For demonstrations
  room?: 'principal' | 'auxiliar';
  lessonNumber?: number;
  status: AssignmentStatus;
  notes?: string;
}

export interface MeetingMidweek {
  date: string; // YYYY-MM-DD
  bibleReading?: string; // e.g. 'Salmos 80 a 84'
  songFirst?: number;
  songMiddle?: number;
  songConclude?: number;
  presidentId?: string;
  auxiliaryCounselorId?: string; // Consejero sala auxiliar
  initialPrayerId?: string;
  finalPrayerId?: string;
  tesoros: {
    discurso: AssignmentItem;
    perlas: AssignmentItem;
    lecturaBiblia: AssignmentItem; // can have auxiliary room
    lecturaBibliaAux?: AssignmentItem;
  };
  maestros: {
    items: AssignmentItem[]; // Titular + Ayudante, room: 'principal' | 'auxiliar'
  };
  vidaCristiana: {
    items: AssignmentItem[];
    estudioBiblico: {
      conductorId?: string;
      lectorId?: string;
    };
  };
  duties: Record<string, string[]>; // dutyKey -> array of publisherIds (e.g. microfonos: [id1, id2])
}

export type HospitalityMealType = 'almuerzo' | 'cena' | 'desayuno' | 'refrigerio' | 'hospedaje';

export interface MeetingWeekend {
  date: string; // YYYY-MM-DD
  presidentId?: string;
  publicTalkSpeaker?: string; // might be visiting speaker text or local publisherId
  publicTalkOutlineNumber?: number;
  publicTalkTheme?: string;
  isVisitingSpeaker?: boolean;
  visitingSpeakerId?: string; // ID del Directorio de Oradores Visitantes
  neighboringCongregationId?: string; // ID del Directorio de Congregaciones Vecinas
  visitingSpeakerCongregation?: string;
  visitingSpeakerPhone?: string;
  visitingSpeakerCompanions?: number; // Acompañantes (ej. 1 si viene con su esposa)
  visitingSpeakerDietaryNotes?: string; // Alergias o notas de alimentación del orador y acompañantes
  speakerConfirmed?: boolean; // Confirmación del orador (local o visitante)
  hospitalityPublisherId?: string; // Hermano / familia asignada para la hospitalidad / comida del orador
  hospitalityMealType?: HospitalityMealType; // Tipo de atención (Almuerzo, Cena, Refrigerio, Hospedaje)
  hospitalityStatus?: 'pendiente' | 'confirmada';
  hospitalityLocation?: string;
  hospitalityNotes?: string;
  atalayaConductorId?: string;
  atalayaLectorId?: string;
  watchtowerTheme?: string;
  watchtowerScripture?: string;
  openingSong?: number;
  middleSong?: number;
  closingSong?: number;
  initialPrayerId?: string;
  finalPrayerId?: string;
  duties: Record<string, string[]>;
}

export interface HospitalityHost {
  id: string;
  publisherId: string;
  capacity: number; // Capacidad de comensales / invitados
  dietaryNotes?: string; // Alergias, notas de comida, mascotas
  alternateAddress?: string; // Dirección específica si es distinta a la del publicador
  contactPhone?: string;
  active: boolean;
  notes?: string;
}

export interface Breaker {
  id: string;
  name: string;
  descripcion?: string;
  status: 'on' | 'off' | 'always' | 'event';
  icon?: string;
  color?: string;
  col: 'left' | 'right';
  order_idx: number;
  amperage?: number;
  congregation_id?: string;
}

export type MaintenanceCategory =
  | 'climatizacion'
  | 'electricidad'
  | 'plomeria'
  | 'edificacion'
  | 'seguridad'
  | 'jardineria'
  | 'audio_video'
  | 'limpieza_profunda';

export type MaintenanceFrequency =
  | 'semanal'
  | 'mensual'
  | 'bimestral'
  | 'trimestral'
  | 'semestral'
  | 'anual'
  | 'segun_necesidad';

export type MaintenanceStatus = 'al_dia' | 'proximo' | 'pendiente' | 'vencido';

export interface MaintenanceChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface MaintenanceSheet {
  id: string;
  label: string; // Título de la ficha / tarea (ej: "Revisión trimestral de extintores")
  description?: string;
  category: MaintenanceCategory;
  frequency: MaintenanceFrequency;
  status: MaintenanceStatus;
  isActive: boolean;
  orderIndex: number;
  assignedPublisherIds: string[]; // Publicadores encargados o colaboradores capacitados
  lastCompletedDate?: string; // YYYY-MM-DD
  nextDueDate?: string; // YYYY-MM-DD
  checklist: MaintenanceChecklistItem[];
  estimatedMinutes?: number;
  estimatedCost?: number;
  safetyGear?: string[]; // ej. ["Guantes de protección", "Gafas de seguridad", "Arnés"]
  notes?: string;
  congregation_id?: string;
}

export type AuxPioneerStatus = 'pendiente' | 'aprobada' | 'rechazada';

export interface AuxPioneerRequest {
  id: string;
  publisherId: string;
  publisher_nid?: string;
  month: number; // 0 (Enero) a 11 (Diciembre)
  mes?: number;
  year: number;
  anio?: number;
  targetHours: 15 | 30;
  meta_horas?: 15 | 30;
  isContinuous?: boolean;
  status: AuxPioneerStatus;
  estado?: AuxPioneerStatus;
  requestDate: string;
  fecha_solicitud?: string;
  responseDate?: string;
  fecha_respuesta?: string;
  reviewedBy?: string;
  notes?: string;
  nota_opcional?: string;
  congregation_id?: string;
}

export type S1SubmissionStatus = 'pendiente' | 'enviado';

export interface BranchReportS1 {
  id: string; // e.g. 's1-2026-10'
  monthKey: string; // 'YYYY-MM' (e.g. '2026-10')
  year: number;
  monthNumber: number; // 1-12
  status: S1SubmissionStatus;
  submittedAt?: string;
  submittedBy?: string;
  confirmationNumber?: string;
  notes?: string;
  manualOverrides?: {
    midweekMeetingsCount?: number;
    midweekTotalAttendance?: number;
    weekendMeetingsCount?: number;
    weekendTotalAttendance?: number;
    regularPublishersReporting?: number;
    auxPioneersReporting?: number;
    auxPioneerHours?: number;
    pioneersReporting?: number;
    pioneerHours?: number;
    specialPioneersReporting?: number;
    specialPioneerHours?: number;
    totalBibleStudies?: number;
  };
}

export interface SpecialEvent {
  isSpecial: boolean;
  type?: 'asamblea_circuito' | 'asamblea_regional' | 'conmemoracion' | 'visita_superintendente' | 'otro';
  title?: string;
  noMeetingMidweek?: boolean;
  noMeetingWeekend?: boolean;
  notes?: string;
}

export interface MeetingAttendance {
  weekId: string;
  midweek: { inPerson: number; zoom: number; total: number };
  weekend: { inPerson: number; zoom: number; total: number };
}

export type CleaningProgramType = 'semanal' | 'profunda' | 'visita_sc' | 'evento_especial';
export type CleaningSuppliesStatus = 'abastecido' | 'reponer_pronto' | 'urgente';

export interface WeekSchedule {
  id: string; // e.g. '2026-W40' or start date '2026-09-28'
  weekStartDate: string; // YYYY-MM-DD (Monday)
  weekEndDate: string;   // YYYY-MM-DD (Sunday)
  specialEvent?: SpecialEvent;
  midweek: MeetingMidweek;
  weekend: MeetingWeekend;
  attendance?: MeetingAttendance;
  cleaningGroupNumbers: number[]; // Numbers of preaching groups assigned to clean
  cleaningType?: CleaningProgramType;
  cleaningChecklistCompleted?: string[]; // IDs of completed S-28 cleaning tasks
  cleaningSuppliesStatus?: CleaningSuppliesStatus;
  cleaningNotes?: string;
  notes?: string;
}

export interface PreachingGroup {
  number: number;
  name: string;
  overseerId?: string;
  assistantId?: string;
  memberIds: string[];
}

export interface CustomDuty {
  id: string;
  key: string;
  name: string;
  description?: string;
  midweek: boolean;
  weekend: boolean;
  maxPeople: number;
}

export interface PublicTalkOutline {
  number: number;
  title: string;
  category?: string;
}

export interface NeighboringCongregation {
  id: string;
  name: string; // ej. 'Congregación Las Acacias'
  congregationNumber?: string;
  circuit?: string; // ej. 'CO-04'
  city?: string;
  address?: string; // Dirección del Salón del Reino vecino
  weekendMeetingDay: string; // ej. 'Domingo' | 'Sábado'
  weekendMeetingTime: string; // ej. '10:00'
  talkCoordinatorName?: string; // Coordinador de Discursos Públicos vecino
  talkCoordinatorPhone?: string; // WhatsApp / Teléfono
  talkCoordinatorEmail?: string;
  distanceKm?: number;
  notes?: string;
  active: boolean;
}

export interface VisitingSpeakerDirectoryEntry {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  privilege: 'anciano' | 'siervo_ministerial';
  congregationId?: string; // Referencia a NeighboringCongregation.id
  congregationName: string;
  preparedOutlines: number[]; // Números de bosquejos preparados (1-194)
  companionsDefault?: number; // Acompañantes habituales (ej. 1 = esposa)
  spouseName?: string;
  dietaryNotes?: string; // Alergias o preferencias alimentarias registradas
  needsTransportation?: boolean;
  lastVisitDate?: string; // YYYY-MM-DD
  notes?: string;
  active: boolean;
}

export interface OutgoingSpeakerAssignment {
  id: string;
  publisherId: string;
  date: string;
  destinationCongregation: string;
  destinationCongregationId?: string;
  destinationMeetingTime?: string;
  destinationAddress?: string;
  destinationCoordinatorName?: string;
  destinationCoordinatorPhone?: string;
  outlineNumber: number;
  outlineTitle: string;
  status?: 'pendiente' | 'confirmado';
  notes?: string;
}

export type FieldServiceModality =
  | 'casa_en_casa'
  | 'carritos'
  | 'estudios_revisitas'
  | 'telefonica_cartas'
  | 'negocios';

export interface FieldServiceMeeting {
  id: string;
  date?: string; // YYYY-MM-DD (fecha específica si pertenece al cuadrante semanal/mensual)
  dayOfWeek: string; // 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo'
  session?: 'manana' | 'tarde' | 'noche';
  time: string;
  location: string;
  conductorId?: string;
  groupNumber?: number; // undefined o 0 = Congregación General
  territoryNumber?: string;
  territoryId?: string;
  modality?: FieldServiceModality;
  notes?: string;
}

export interface ConflictRuleSettings {
  allowPartAndDutySameMeeting: boolean;
  allowAudioAndMicrophones: boolean;
  allowPresidentAndOtherPart: boolean;
  maxConsecutiveWeeksWithDuty: number; // e.g. 3
  maxConsecutiveWeeksWithPart: number; // e.g. 2
  enforceSisterDemonstrationRules: boolean; // sisters only with sisters or family
  warnOutlineRepeatedWithinMonths: number; // e.g. 12 months
  prioritizeFamilySameMeeting?: boolean; // Agrupación familiar en la misma reunión
}

export interface ConflictAlert {
  id: string;
  weekId: string;
  weekStartDate: string;
  meetingType: 'midweek' | 'weekend';
  severity: 'error' | 'warning';
  publisherId: string;
  publisherName: string;
  type: 'double_assignment' | 'absence' | 'inactive' | 'role_disabled' | 'gender_mismatch' | 'consecutive_weeks' | 'special_event_clash' | 'outgoing_speaker_clash' | 'outline_repeated';
  description: string;
  assignmentTitles: string[];
}

export interface CongregationSettings {
  congregationName: string;
  congregationNumber?: string; // ej. '10582' (ID oficial de congregación)
  congregationId?: string;     // ID único de congregación
  customCode?: string;         // Código único o ID personalizado
  isCustomId?: boolean;        // true si el usuario definió un código personalizado
  congregationPinHash?: string;// Hash seguro del PIN de Congregación (4-8 dígitos)
  circuitNumber?: string;      // ej. 'CO-04'
  language?: string;           // ej. 'Español'
  country?: string;            // ej. 'Colombia'
  city?: string;               // ej. 'Bogotá'
  coordinatorName?: string;    // ej. 'Carlos Mendoza'
  coordinatorEmail?: string;   // ej. 'coordinador.cbe@gmail.com'
  coordinatorPhone?: string;   // ej. '+57 300 123 4567'
  coordinatorPhotoURL?: string; // Foto de perfil del coordinador (Google Auth / nube)
  isRegistered?: boolean;      // true if the congregation registration wizard has been completed
  registeredAt?: string;       // ISO date
  updatedAt?: string;          // ISO date
  midweekMeetingDay: string;  // e.g. 'Miércoles'
  midweekMeetingTime: string; // e.g. '19:00'
  weekendMeetingDay: string;  // e.g. 'Domingo'
  weekendMeetingTime: string; // e.g. '10:00'
  hallAddress?: string;
  hallCoordinates?: [number, number]; // [lat, lng] Ubicación del Salón del Reino
  territoryMapCenter?: [number, number]; // [lat, lng] Centro predeterminado del mapa
  territoryMapZoom?: number; // Zoom predeterminado (ej. 14)
  conflictRules: ConflictRuleSettings;
  pdfTemplate: 'clasica' | 'moderna' | 'minimalista' | 'color' | 'oficial' | 'nw_scheduler';
  pdfPageSize: 'letter' | 'a4';
  pdfOrientation?: 'portrait' | 'landscape';
  pdfSections: {
    midweek: boolean;
    weekend: boolean;
    duties: boolean;
    cleaning: boolean;
  };
  neighboringCongregations?: NeighboringCongregation[];
  visitingSpeakersDirectory?: VisitingSpeakerDirectoryEntry[];
}

export interface AssignmentHistoryRecord {
  id: string;
  date: string;
  meetingType: 'midweek' | 'weekend';
  assignmentTitle: string;
  roleType: string;
  publisherId: string;
  assistantId?: string;
  room?: string;
}

// ==========================================
// THEOCRATIC FEATURES
// ==========================================

export interface S89Slip {
  id: string;
  weekId: string;
  date: string;
  meetingDateFormatted?: string;
  studentId: string;
  studentName: string;
  assistantId?: string;
  assistantName?: string;
  partNumber: number; // e.g. 1 (Lectura), 2, 3, 4
  partTitle: string;
  room: 'principal' | 'auxiliar';
  lessonNumber?: number;
  lessonTitle?: string;
  deliveredStatus: 'pendiente' | 'entregada' | 'confirmada';
  notes?: string;
}

export interface CartLocation {
  id: string;
  name: string;
  address: string;
  notes?: string;
  active: boolean;
}

export interface CartShift {
  id: string;
  locationId: string;
  dayOfWeek: string; // 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo'
  startTime: string; // '09:00'
  endTime: string;   // '11:00'
  date?: string;     // YYYY-MM-DD
  publisher1Id?: string;
  publisher2Id?: string;
  notes?: string;
}

export interface MonthlyServiceReport {
  id: string;
  publisherId: string;
  month: string; // 'YYYY-MM'
  participated: boolean;
  hours?: number;
  minutes?: number; // Minutos adicionales (0-59) para conservar fracciones como 15 min
  totalMinutes?: number; // Total exacto de minutos acumulados en el mes (ej. 15, 75, 120)
  returnVisits?: number;
  placements?: number;
  hourGoal?: number; // Meta mensual de horas configurada por el publicador
  bibleStudies: number;
  notes?: string;
  reportedAt?: string;
  updatedAt?: string; // Timestamp ISO de la última sincronización automática o manual
  isPioneer?: boolean;
  isAuxiliaryPioneer?: boolean;
  creditHours?: number;
  activeTimerSeconds?: number; // Segundos acumulados en el cronómetro pendientes de cerrar
  activeTimerRunning?: boolean; // Si el cronómetro está corriendo en tiempo real
  activeTimerStartedAt?: number | null; // Timestamp (ms) de inicio de la sesión en curso
  activeTimerModality?: 'casa_en_casa' | 'carritos' | 'revisitas' | 'estudio' | 'informal';
  activeTimerReturnVisits?: number;
  activeTimerPlacements?: number;
  activeTimerNotes?: string;
  timeLogs?: Array<{
    id: string;
    date: string;
    month: string;
    minutes: number;
    modality: 'casa_en_casa' | 'carritos' | 'revisitas' | 'estudio' | 'informal';
    returnVisitsCount: number;
    placementsCount: number;
    notes: string;
    createdAt: string;
  }>;
  returnVisitRecords?: any[];
  bibleStudyRecords?: any[];
}

// ==========================================
// REGISTRO DE PUBLICADOR DE LA CONGREGACIÓN (S-21)
// ==========================================

export interface S21MonthRecord {
  monthKey: string;      // 'YYYY-MM' (e.g. '2025-09')
  monthName: string;     // 'Septiembre'
  monthShort: string;    // 'Sep'
  participated: boolean;
  hours?: number;
  bibleStudies: number;
  isAuxiliaryPioneer?: boolean;
  notes?: string;
  hasReport: boolean;
}

export interface S21ServiceYearCard {
  serviceYear: string;   // e.g. '2025-2026' (Sep 2025 - Ago 2026)
  months: S21MonthRecord[];
  totalMonthsActive: number;
  totalHours: number;
  totalBibleStudies: number;
  avgHoursPerMonth: number;
  avgStudiesPerMonth: number;
  auxiliaryPioneerMonthsCount: number;
}

export interface CongregationNotice {
  id: string;
  title: string;
  category: 'anuncio' | 'asamblea' | 'circuito' | 'campana' | 'carta' | 'limpieza';
  content: string;
  date: string;
  expiresDate?: string;
  pinned: boolean;
  author?: string;
}

// ==========================================
// REGISTRO DE ASIGNACIÓN DE TERRITORIO (S-13)
// ==========================================

export type TerritoryType = 'residencial' | 'negocios' | 'rural' | 'edificios' | 'telefonico' | 'campana';

export type TerritoryStatus = 'disponible' | 'asignado' | 'vencido';

export interface NoVisitAddress {
  id: string;
  address: string;
  residentName?: string;
  dateAdded: string; // YYYY-MM-DD
  reason?: string;
  coordinates?: [number, number]; // [lat, lng] para geolocalización en mapa
}

export interface TerritoryBlock {
  id: string;
  number: number;
  name?: string;
  status: 'pendiente' | 'trabajando' | 'completado';
  coordinates?: [number, number][]; // Polígono perimetral de la manzana
  completedAt?: string;
}

export interface TerritoryAssignmentRecord {
  id: string;
  territoryId: string;
  publisherId: string;
  publisherName: string;
  assignedDate: string; // YYYY-MM-DD
  dueDate: string;      // YYYY-MM-DD
  returnedDate?: string; // YYYY-MM-DD
  notes?: string;
}

export interface Territory {
  id: string;
  number: string; // e.g. "01", "02-A", "14", "R-03"
  name: string;
  type: TerritoryType;
  zone: string; // e.g. "Zona Norte", "Centro", "Altamira"
  estimatedHomes: number;
  status: TerritoryStatus;
  currentAssigneeId?: string;
  assignedDate?: string; // YYYY-MM-DD
  dueDate?: string;      // YYYY-MM-DD (4 meses recomendados según pautas S-13)
  lastCompletedDate?: string; // YYYY-MM-DD
  mapUrl?: string; // Google Maps URL o enlace digital
  boundsDescription?: string; // Límites del territorio
  notes?: string;
  noVisits: NoVisitAddress[];
  history: TerritoryAssignmentRecord[];

  // FASE 5: Mapas Interactivos (OpenStreetMap / Leaflet)
  polygon?: [number, number][]; // Polígono perimetral [[lat, lng], [lat, lng], ...]
  center?: [number, number];    // Coordenadas centrales del territorio [lat, lng]
  zoom?: number;                // Nivel de zoom recomendado (14-18)
  blocks?: TerritoryBlock[];    // Manzanas/cuadras individuales
  color?: string;               // Color temático personalizado para el polígono (hex)
  geoJson?: any;                // Objeto GeoJSON opcional
}

// ==========================================
// VISITA DEL SUPERINTENDENTE DE CIRCUITO (SC)
// ==========================================

export interface MealArrangement {
  id: string;
  day: string; // e.g. "Martes", "Miércoles"
  date: string; // YYYY-MM-DD
  mealType: 'almuerzo' | 'cena';
  hostPublisherId?: string;
  hostName?: string;
  hostPhone?: string;
  location?: string;
  notes?: string;
  isConfirmed: boolean;
}

export interface MinistryArrangement {
  id: string;
  day: string; // e.g. "Miércoles", "Jueves"
  session: 'manana' | 'tarde';
  date: string; // YYYY-MM-DD
  time: string; // e.g. "09:30"
  meetingPoint: string;
  territoryNumber?: string;
  coCompanionPublisherId?: string; // Acompañante del SC
  wifeCompanionPublisherId?: string; // Acompañante de la esposa del SC
  groupNumber?: number;
  notes?: string;
}

export interface SpecialMeeting {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  attendeesDescription: string;
  notes?: string;
}

export interface VisitChecklistItem {
  id: string;
  task: string;
  category: 'secretaria' | 'servicio' | 'cuentas' | 'salon';
  completed: boolean;
  notes?: string;
  assignedRole?: string;
}

export interface CircuitOverseerVisit {
  id: string;
  circuitNumber: string;
  overseerName: string;
  overseerPhone?: string;
  wifeName?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: 'proxima' | 'en_curso' | 'concluida';
  
  // Temas de discursos
  midweekTalkTheme: string;
  midweekSongNumber?: number;
  weekendPublicTalkTheme: string;
  weekendFinalTalkTheme: string;
  weekendSongNumber?: number;

  dietaryPreferences?: string;
  lodgingNotes?: string;

  meals: MealArrangement[];
  ministry: MinistryArrangement[];
  specialMeetings: SpecialMeeting[];
  checklist: VisitChecklistItem[];
  notes?: string;
}

// ==========================================
// CUENTAS DE LA CONGREGACIÓN (S-26, S-30, S-25)
// ==========================================

export type AccountFund = 'gastos_locales' | 'obra_mundial' | 'construccion';

export type TransactionType = 'ingreso' | 'gasto';

export type TransactionCategory =
  | 'donaciones_cajas'
  | 'donaciones_linea'
  | 'servicios_electricidad'
  | 'servicios_agua_gas'
  | 'servicios_internet'
  | 'mantenimiento_reparaciones'
  | 'articulos_limpieza'
  | 'seguro_salon'
  | 'resolucion_apoyo_circuito'
  | 'resolucion_obra_mundial'
  | 'fondos_transferidos_sucursal'
  | 'otro';

export interface AccountTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  type: TransactionType;
  fund: AccountFund;
  category: TransactionCategory;
  description: string;
  amount: number;
  receiptNumber?: string;
  payerOrPayee?: string;
  paymentMethod: 'efectivo' | 'transferencia' | 'cheque';
  verified: boolean;
  notes?: string;
}

export interface MonthlyAccountsRecord {
  month: string; // YYYY-MM
  openingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  closingBalance: number;
  bankBalance: number;
  cashOnHand: number;
  reconciled: boolean;
  notes?: string;
}

export interface QuarterlyAudit {
  id: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  serviceYear: string; // e.g. '2025-2026'
  monthsCovered: string[]; // e.g. ['2025-09', '2025-10', '2025-11']
  auditorPublisherId?: string;
  auditorName: string;
  auditDate?: string;
  isCompleted: boolean;
  reviewedReceipts: boolean;
  verifiedBankStatements: boolean;
  checkedS30Announcements: boolean;
  findingsNotes?: string;
}

// ==========================================
// CONMEMORACIÓN DEL MEMORIAL Y ASAMBLEAS TEOCRÁTICAS
// ==========================================

export interface EmblemServerAssignment {
  id: string;
  sectionName: string; // e.g., 'Pasillo Central', 'Pasillo Lateral Izq', 'Pasillo Lateral Der', 'Plataforma y Orador'
  breadServerPublisherId: string;
  wineServerPublisherId: string;
  notes?: string;
}

export interface MemorialAttendant {
  id: string;
  role: 'entrada_principal' | 'pasillo_interior' | 'estacionamiento' | 'audio_video_zoom' | 'conteo_asistencia';
  publisherId: string;
  notes?: string;
}

export interface MemorialPreparation {
  breadPreparationPublisherId?: string;
  wineProviderPublisherId?: string;
  tableArrangementPublisherId?: string;
  cleaningPublisherId?: string;
  emblemBreadType?: string;
  emblemWineType?: string;
  specialNotes?: string;
}

export interface MemorialInvitationCampaign {
  startDate: string;
  endDate: string;
  totalInvitationsReceived: number;
  invitationsPerPublisher: number;
  territoriesCoveredCount: number;
  totalCongregationTerritories: number;
  notes?: string;
}

export interface MemorialReport {
  inPersonAttendance: number;
  streamingAttendance: number;
  totalAttendance: number;
  partakersCount: number; // Conteo de participantes (ungidos)
  partakerNames?: string;
  reportedToBranch: boolean;
  reportedDate?: string;
  notes?: string;
}

export interface MemorialPlan {
  id: string;
  serviceYear: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  sunsetTime: string; // HH:mm
  location: string;
  chairmanPublisherId: string;
  speakerPublisherId: string;
  speakerTheme: string;
  breadPrayerPublisherId: string;
  winePrayerPublisherId: string;
  initialSongNumber: number;
  finalSongNumber: number;
  closingPrayerPublisherId?: string;
  emblemServers: EmblemServerAssignment[];
  attendants: MemorialAttendant[];
  preparation: MemorialPreparation;
  campaign: MemorialInvitationCampaign;
  report: MemorialReport;
}

export type AssemblyType = 'circuito_con_sc' | 'circuito_sin_sc' | 'regional';

export interface AssemblyVolunteer {
  id: string;
  publisherId: string;
  department: 'limpieza' | 'acomodadores' | 'audio_video' | 'primeros_auxilios' | 'bautismo' | 'estacionamiento' | 'otro';
  roleOrShift: string;
  shiftDate?: string;
  shiftTime?: string;
  notes?: string;
}

export interface AssemblyBaptismCandidate {
  id: string;
  publisherId: string;
  questionsCompleted: boolean;
  reviewedByElders?: string;
  notes?: string;
}

export interface AssemblyBusArrangement {
  hasBus: boolean;
  busCompany?: string;
  departureTime?: string;
  departureLocation?: string;
  returnTime?: string;
  seatsTotal?: number;
  seatsBooked?: number;
  farePerSeat?: number;
  coordinatorPublisherId?: string;
  notes?: string;
}

export interface TheocraticAssembly {
  id: string;
  serviceYear: number;
  type: AssemblyType;
  theme: string;
  dates: string;
  venue: string;
  circuitNumber?: string;
  assignedCleaningDepartment?: string;
  cleaningCoordinatorPublisherId?: string;
  volunteers: AssemblyVolunteer[];
  baptismCandidates: AssemblyBaptismCandidate[];
  busArrangement: AssemblyBusArrangement;
  congregationAttendance?: {
    friday?: number;
    saturday?: number;
    sunday?: number;
  };
  notes?: string;
}

// ==========================================
// LITERATURA Y PUBLICACIONES (FORMULARIO S-14)
// ==========================================

export type LiteratureCategory =
  | 'biblia'
  | 'libro'
  | 'folleto'
  | 'tratado'
  | 'revista'
  | 'campana_especial'
  | 'otro';

export interface LiteratureItem {
  id: string;
  code: string; // ej. 'bi12', 'lff-S', 'wp26-1', 'T-36'
  title: string;
  category: LiteratureCategory;
  language: string; // ej. 'Español', 'Inglés', 'Lengua de Señas'
  currentStock: number;
  minimumStock: number;
  locationBox?: string; // Estante / Armario del Salón
  lastCountDate?: string;
  notes?: string;
}

export type SpecialOrderStatus =
  | 'solicitado'
  | 'pedido_a_betel'
  | 'recibido_en_salon'
  | 'entregado'
  | 'cancelado';

export interface LiteratureSpecialOrder {
  id: string;
  publisherId: string;
  itemId?: string;
  itemTitle: string;
  language?: string;
  quantity: number;
  requestDate: string;
  status: SpecialOrderStatus;
  deliveredDate?: string;
  notes?: string;
}

export interface LiteratureGroupDistribution {
  groupNumber: number;
  magazinesCount: number;
  tractsCount: number;
  brochuresCount: number;
  lastDistributedDate?: string;
  notes?: string;
}

export interface LiteratureInventoryRecord {
  id: string;
  serviceYear: string; // ej. '2025-2026'
  countDate: string;
  servantPublisherId?: string; // Siervo de literatura
  overseerPublisherId?: string; // Anciano supervisor
  totalItemsCounted: number;
  isCountCompleted: boolean;
  notes?: string;
}

// Theocratic Invitation and Registration System
export interface CongregationInvitation {
  id: string;
  code: string; // e.g. 'KONG-SEC-4819'
  codeHash?: string; // SHA-256 salted hash for Zero-Knowledge verification in public payload
  role: string; // TheocraticRole
  targetName?: string;
  targetEmail?: string;
  createdByEmail: string;
  createdAt: string;
  expiresAt?: string;
  status: 'active' | 'used' | 'revoked';
  usedAt?: string;
  usedByEmail?: string;
}

export type CredentialRevocationReasonId =
  | 'olvido'
  | 'perdida_telefono'
  | 'alguien_mas_lo_sabe'
  | 'cambio_dispositivo'
  | 'otro_motivo';

export interface ActiveDeviceSession {
  id: string;
  deviceId?: string;
  publisherId?: string;
  email: string;
  name: string;
  role: string;
  deviceInfo: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  osName?: string;
  browserName?: string;
  startedAt?: string;
  lastActive: string;
  approxLocation?: string;
  ipPlaceholder?: string;
  isCurrentDevice?: boolean;
  codeMasked?: string;
  status: 'active' | 'revoked';
  revokedAt?: string;
  revokedReasonId?: CredentialRevocationReasonId;
  revokedReasonLabel?: string;
  revokedReasonDetails?: string;
  revokedBy?: string;
}

export interface CredentialRevocationHistoryItem {
  id: string;
  publisherId: string;
  publisherName: string;
  previousCodeMasked: string;
  previousDeviceInfo: string;
  previousRedeemedAt?: string;
  revokedAt: string;
  revokedBy: string;
  reasonId: CredentialRevocationReasonId;
  reasonLabel: string;
  reasonDetails?: string;
  newCodeMasked: string;
}

export interface CredentialRedemptionRecord {
  id: string;
  publisherId: string;
  publisherName: string;
  role: string;
  codeMasked: string;
  deviceInfo: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  osName: string;
  browserName: string;
  redeemedAt: string; // ISO string with day and hour
  lastActiveAt: string;
  status: 'active' | 'revoked';
  revokedAt?: string;
  revokedBy?: string;
  revokedReasonId?: CredentialRevocationReasonId;
  revokedReasonLabel?: string;
  revokedReasonDetails?: string;
}

export type PinChangeRequestReasonId =
  | 'perdida_dispositivo'
  | 'olvido'
  | 'sospecha_acceso_no_autorizado'
  | 'cambio_equipo'
  | 'otro';

export interface SolicitudCambioPin {
  id: string;
  congregation_id: string;
  publisher_id: string;
  publisher_name: string;
  publisher_email?: string;
  role: string;
  reason_id: PinChangeRequestReasonId;
  reason_label: string;
  details?: string;
  status: 'pendiente' | 'atendida' | 'rechazada';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  new_pin_masked?: string;
}

export interface AccountLinkRequest {
  id: string;
  email: string;
  brotherName: string;
  personalPin: string;
  role: string;
  congregationId: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

// User Profile and Contact Preferences
export type PreferredContactMethod = 'whatsapp' | 'email' | 'phone' | 'sms';
export type ContactTimePreference = 'morning' | 'afternoon' | 'evening' | 'anytime';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  secondaryEmail?: string;
  preferredContactMethod: PreferredContactMethod;
  contactTimePreference: ContactTimePreference;
  notificationsEnabled: boolean;
  notes?: string;
  congregationId?: string;
  congregationNumber?: string;
  congregationName?: string;
  updatedAt?: string;
}

// ── Modelos de Datos CLM (Vida y Ministerio Cristianos) ──
export type ClmPartType =
  | 'canto'
  | 'presidente'
  | 'oracion_apertura'
  | 'oracion_cierre'
  | 'oracion_estudio'
  | 'discurso_tesoros'
  | 'busquemos_perlas'
  | 'lectura_biblica'
  | 'empiece_conversaciones'
  | 'empiece_conversaciones_aux'
  | 'haga_revisitas'
  | 'haga_revisitas_aux'
  | 'haga_discipulos'
  | 'explique_sus_creencias'
  | 'discurso_estudiante'
  | 'necesidades_congregacion'
  | 'estudio_biblico_grupo'
  | 'lector_estudio'
  | 'conductor_auxiliar'
  | 'demo_auxiliar';

export type ClmProgramaEstado = 'borrador' | 'publicado' | 'cancelado';

export interface ClmParte {
  id: string;
  tipo: ClmPartType;
  titulo: string;
  duracion_min: number;
  seccion: 'tesoros' | 'maestros' | 'vida_cristiana' | 'marco';
  asignado_nid?: string | null;
  asignado_nombre?: string;
  asignado_auxiliar_nid?: string | null;
  asignado_auxiliar_nombre?: string;
  requiere_hermano: boolean;
  requiere_privilegio: boolean;
  descripcion?: string;
  notas?: string;
  es_clase_auxiliar?: boolean;
  leccion_numero?: number;
  leccion_titulo?: string;
  leccion_estado?: 'completada' | 'continuar' | 'pendiente';
}

export interface ClmPrograma {
  id: string;
  semana_fecha: string; // Formato YYYY-MM-DD (lunes de la semana)
  anio: number;
  semana_num: number;
  estado: ClmProgramaEstado;
  partes: ClmParte[];
  notas?: string;
  generado_por?: 'manual' | 'ai';
  congregation_id?: string | null;
  lectura_semana?: string;
  rango_semana?: string;
  sala_auxiliar_habilitada?: boolean;
}

export interface CongregationEvent {
  id: string;
  congregation_id?: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  horarios_diarios?: string; // JSON string with per-day schedules
  type: 'visit' | 'assembly' | 'no_meeting' | 'memorial' | 'special' | 'meeting';
}

declare global {
  interface Window {
    electronAPI?: {
      upsertClmPrograma?: (programa: ClmPrograma) => Promise<any>;
      getClmPrograma?: (semanaFecha: string) => Promise<ClmPrograma | null>;
      [key: string]: any;
    };
  }
}

