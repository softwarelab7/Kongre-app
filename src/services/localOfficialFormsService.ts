// src/services/localOfficialFormsService.ts
import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFRadioGroup,
  PDFOptionList,
  PDFField,
  StandardFonts,
  rgb,
} from 'pdf-lib';
import type {
  Publisher,
  S21ServiceYearCard,
  S89Slip,
  WeekSchedule,
  CongregationSettings,
  Territory,
  MonthlyServiceReport,
  AccountTransaction,
  QuarterlyAudit,
  LiteratureItem,
} from '../types';
import { buildS21CardForPublisher, getServiceYearMonths } from '../utils/s21Helper';
import { computeMonthlyS26, formatCurrency } from '../utils/accountsHelper';

export type OfficialFormCode =
  | 'S-21'
  | 'S-89'
  | 'S-140'
  | 'S-88'
  | 'S-13'
  | 'S-26'
  | 'S-30'
  | 'S-25'
  | 'S-28'
  | 'S-1'
  | 'S-205b'
  | 'CUSTOM';

export interface LocalOfficialFormMetadata {
  id: string;
  code: OfficialFormCode;
  fileName: string;
  fileSize: number;
  loadedAt: string;
  fieldCount: number;
  pageCount: number;
  fieldsSummary: DetectedPdfField[];
  sessionOnly?: boolean;
}

export interface DetectedPdfField {
  name: string;
  type: 'text' | 'checkbox' | 'dropdown' | 'radio' | 'optionlist' | 'unknown';
  value: string | boolean;
  options?: string[];
  pageIndex?: number;
  x?: number;
  y?: number;
}

export interface OfficialFormCatalogItem {
  code: OfficialFormCode;
  title: string;
  subtitle: string;
  description: string;
  autoFillCapabilities: string[];
}

export const OFFICIAL_FORMS_CATALOG: OfficialFormCatalogItem[] = [
  {
    code: 'S-21',
    title: 'Registro de Publicador de la Congregación (S-21)',
    subtitle: 'Tarjeta oficial individual, por grupo o congregación completa',
    description:
      'Carga el archivo S-21 oficial en blanco descargado de JW Hub para que la aplicación rellene automáticamente datos personales, bautismo, esperanza, privilegios, los 12 meses del año de servicio y totales anuales.',
    autoFillCapabilities: [
      'Datos del publicador (Nombre, fecha de nacimiento, fecha de bautismo, sexo)',
      'Esperanza (Otras ovejas / Ungido) y privilegios (Anciano, Siervo Ministerial, Precursor Regular/Especial, Misionero)',
      '12 meses del año de servicio (Participación, cursos bíblicos, precursor auxiliar, horas, notas)',
      'Rellenado y descarga individual o en lote (por Grupo de Servicio o Congregación completa)',
    ],
  },
  {
    code: 'S-89',
    title: 'Asignación para la Reunión Vida y Ministerio Cristianos (S-89)',
    subtitle: 'Hoja oficial individual (1x1) o plantilla de 4 por página (4x1)',
    description:
      'Carga el archivo S-89 oficial en blanco para que la aplicación rellene automáticamente el nombre del estudiante, ayudante, fecha, número de intervención y sala para todas las asignaciones de la semana.',
    autoFillCapabilities: [
      'Nombre del estudiante y del ayudante asignado',
      'Fecha de la reunión y número/título de la intervención',
      'Casillas de Sala Principal o Sala Auxiliar',
      'Generación multipágina automática si hay más de 4 asignaciones en la semana',
    ],
  },
  {
    code: 'S-140',
    title: 'Programa de la Reunión Vida y Ministerio Cristianos (S-140)',
    subtitle: 'Tablero oficial para la cartelera del Salón del Reino',
    description:
      'Carga el formulario S-140 oficial en blanco para rellenar el programa de entre semana con presidente, consejero auxiliar, canciones, oraciones, Tesoros de la Biblia, Seamos Mejores Maestros y Nuestra Vida Cristiana.',
    autoFillCapabilities: [
      'Nombre de la congregación, fecha y lectura semanal de la Biblia',
      'Presidente, consejero de la clase auxiliar y oraciones inicial/final',
      'Tesoros de la Biblia, Seamos Mejores Maestros y Nuestra Vida Cristiana',
    ],
  },
  {
    code: 'S-88',
    title: 'Registro de Asistencia a las Reuniones de la Congregación (S-88)',
    subtitle: 'Consolidado oficial mensual de entre semana y fin de semana',
    description:
      'Carga el formulario S-88 oficial en blanco para rellenar el año de servicio, número de reuniones mensuales, asistencia total y promedio mensual tanto de entre semana como de fin de semana.',
    autoFillCapabilities: [
      'Año de servicio actual y anterior',
      '12 meses de reuniones de entre semana (cantidad de reuniones, asistencia total y promedio)',
      '12 meses de reuniones de fin de semana (cantidad de reuniones, asistencia total y promedio)',
    ],
  },
  {
    code: 'S-13',
    title: 'Registro de Asignación de Territorio (S-13)',
    subtitle: 'Control oficial de predicación por números de territorio',
    description:
      'Carga el formulario S-13 oficial en blanco para volcar el historial de asignaciones de territorios, última fecha en que se completó, publicadores asignados y fechas de asignación y conclusión.',
    autoFillCapabilities: [
      'Año de servicio teocrático',
      'Número de territorio y última fecha en que se completó',
      'Publicador asignado, fecha en que se asignó y fecha en que se completó (hasta 4 rotaciones por fila)',
    ],
  },
  {
    code: 'S-26',
    title: 'Hoja de Cuentas de la Congregación (S-26)',
    subtitle: 'Registro oficial contable de entradas, salidas y conciliación',
    description:
      'Carga el formulario S-26 oficial en blanco para rellenar encabezados congregacionales, movimientos de ingresos y gastos del mes, totales y conciliación bancaria.',
    autoFillCapabilities: [
      'Nombre de la congregación, ciudad, provincia/estado, mes y año',
      'Listado de transacciones del mes (fecha, descripción, código, entradas y salidas)',
      'Saldos inicial y final, conciliación de extracto bancario y efectivo',
    ],
  },
  {
    code: 'S-30',
    title: 'Informe Mensual de las Cuentas de la Congregación (S-30)',
    subtitle: 'Informe oficial para el tablero de anuncios',
    description:
      'Carga el formulario S-30 oficial en blanco para rellenar automáticamente los ingresos del mes, gastos locales, remesas a la obra mundial y saldo disponible al cierre del mes.',
    autoFillCapabilities: [
      'Nombre de la congregación, mes y año del informe',
      'Saldo inicial, donaciones recibidas, gastos de la congregación y resoluciones enviadas',
      'Saldo final al cierre del mes para publicar en el tablero de anuncios',
    ],
  },
  {
    code: 'S-25',
    title: 'Informe de la Auditoría de las Cuentas (S-25)',
    subtitle: 'Formulario oficial de revisión trimestral de cuentas',
    description:
      'Carga el formulario S-25 oficial en blanco para rellenar los datos del trimestre auditado, saldos verificados, observaciones y firmas del comité de auditoría.',
    autoFillCapabilities: [
      'Nombre de la congregación, trimestre auditado y año de servicio',
      'Saldos verificados, comprobantes revisados y estado de conciliación',
    ],
  },
  {
    code: 'S-28',
    title: 'Inventario de Publicaciones (S-28 / S-14)',
    subtitle: 'Registro oficial de existencias de literatura y revistas',
    description:
      'Carga el formulario S-28 oficial en blanco para rellenar el inventario actual de biblias, libros, folletos y tratados registrados en el mostrador de literatura.',
    autoFillCapabilities: [
      'Nombre de la congregación, idioma, fecha y número de congregación',
      'Cantidades en existencia por código y título de publicación',
    ],
  },
  {
    code: 'S-1',
    title: 'Informe Mensual de Predicación y Asistencia (S-1)',
    subtitle: 'Consolidado mensual de la congregación para JW Hub',
    description:
      'Carga cualquier plantilla PDF del informe mensual S-1 para rellenar publicadores activos, promedio de asistencia de fin de semana, informes de publicadores, precursores auxiliares y precursores regulares.',
    autoFillCapabilities: [
      'Publicadores activos y asistencia media a la reunión del fin de semana',
      'Desglose de publicadores, precursores auxiliares y precursores regulares (informes, horas y cursos bíblicos)',
    ],
  },
  {
    code: 'CUSTOM',
    title: 'Otro Formato Oficial Rellenable (S-205b, TO-62, etc.)',
    subtitle: 'Inspector y rellenador universal AcroForm 100% local',
    description:
      'Carga cualquier otro documento PDF oficial con campos interactivos descargado de JW Hub para autocompletar datos de la congregación o editar cada campo manualmente antes de descargarlo.',
    autoFillCapabilities: [
      'Detección automática de todos los campos de texto, casillas y listas desplegables',
      'Autocompletado inteligente de datos de congregación y publicador seleccionado',
      'Edición interactiva campo por campo con vista previa y descarga directa en PDF',
    ],
  },
];

// IndexedDB Constants (100% Local Browser Storage - NEVER synced to Cloud)
const DB_NAME = 'kongre_local_official_forms_db';
const DB_VERSION = 1;
const STORE_NAME = 'official_pdf_templates';

// In-memory store for session-only files
const sessionMemoryStore = new Map<
  string,
  { meta: LocalOfficialFormMetadata; bytes: Uint8Array }
>();

function openLocalFormsDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no está disponible en este navegador.'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Ordena los campos AcroForm de un PDF visualmente: por página (0..N), de arriba hacia abajo (Y descendente) y de izquierda a derecha (X ascendente).
 */
function sortPdfFieldsVisually<T extends PDFField>(pdfDoc: PDFDocument, fields: T[]): T[] {
  const pages = pdfDoc.getPages();
  const pageRefMap = new Map<any, number>();
  pages.forEach((p, idx) => {
    if ((p as any).ref) pageRefMap.set((p as any).ref, idx);
  });

  const decorated = fields.map((field, originalIndex) => {
    let pageIndex = 0;
    let x = 0;
    let y = 0;
    try {
      const widgets = field.acroField.getWidgets();
      if (widgets && widgets.length > 0) {
        const w = widgets[0];
        const rect = w.getRectangle();
        x = rect.x;
        y = rect.y;
        const pRef = w.P();
        if (pRef && pageRefMap.has(pRef)) {
          pageIndex = pageRefMap.get(pRef)!;
        }
      }
    } catch {}
    return { field, originalIndex, pageIndex, x, y };
  });

  decorated.sort((a, b) => {
    if (a.pageIndex !== b.pageIndex) return a.pageIndex - b.pageIndex;
    // Tolerancia de 6 puntos para agrupar campos en la misma fila horizontal
    if (Math.abs(b.y - a.y) > 6) return b.y - a.y;
    if (Math.abs(a.x - b.x) > 2) return a.x - b.x;
    return a.originalIndex - b.originalIndex;
  });

  return decorated.map((d) => d.field);
}

/**
 * Detecta automáticamente el código del formato oficial según el nombre del archivo o sus campos.
 */
export function detectOfficialFormCode(
  fileName: string,
  fields: DetectedPdfField[] = []
): OfficialFormCode {
  const upper = fileName.toUpperCase();
  if (upper.includes('S-21') || upper.includes('S21')) return 'S-21';
  if (upper.includes('S-89') || upper.includes('S89')) return 'S-89';
  if (upper.includes('S-140') || upper.includes('S140')) return 'S-140';
  if (upper.includes('S-88') || upper.includes('S88')) return 'S-88';
  if (upper.includes('S-13') || upper.includes('S13')) return 'S-13';
  if (upper.includes('S-26') || upper.includes('S26')) return 'S-26';
  if (upper.includes('S-30') || upper.includes('S30')) return 'S-30';
  if (upper.includes('S-25') || upper.includes('S25')) return 'S-25';
  if (upper.includes('S-28') || upper.includes('S28') || upper.includes('S-14') || upper.includes('S14')) return 'S-28';
  if (upper.includes('S-1_') || upper.includes('S-1-') || upper.includes('S-1.')) return 'S-1';
  if (upper.includes('S-205') || upper.includes('S205')) return 'S-205b';

  // Heurística por cantidad/nombre de campos AcroForm
  const fieldNamesJoined = fields.map((f) => f.name.toLowerCase()).join(' ');
  if (
    fieldNamesJoined.includes('900_1') &&
    fieldNamesJoined.includes('901_') &&
    fields.length >= 45
  ) {
    return 'S-21';
  }
  if (fields.length >= 4 && fields.length <= 36 && fieldNamesJoined.includes('900_')) {
    return 'S-89';
  }

  return 'CUSTOM';
}

/**
 * Inspecciona un archivo PDF en memoria local y devuelve sus metadatos y campos AcroForm ordenados visualmente.
 */
export async function inspectPdfBytes(
  bytes: Uint8Array
): Promise<{ pageCount: number; fields: DetectedPdfField[] }> {
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();
  const fields: DetectedPdfField[] = [];

  try {
    const form = pdfDoc.getForm();
    const rawFields = sortPdfFieldsVisually(pdfDoc, form.getFields());

    for (const f of rawFields) {
      const name = f.getName();
      let x = 0;
      let y = 0;
      try {
        const w = f.acroField.getWidgets()[0];
        if (w) {
          const rect = w.getRectangle();
          x = Math.round(rect.x);
          y = Math.round(rect.y);
        }
      } catch {}

      if (f instanceof PDFTextField) {
        fields.push({
          name,
          type: 'text',
          value: f.getText() || '',
          x,
          y,
        });
      } else if (f instanceof PDFCheckBox) {
        fields.push({
          name,
          type: 'checkbox',
          value: f.isChecked(),
          x,
          y,
        });
      } else if (f instanceof PDFDropdown) {
        fields.push({
          name,
          type: 'dropdown',
          value: (f.getSelected() || [])[0] || '',
          options: f.getOptions(),
          x,
          y,
        });
      } else if (f instanceof PDFRadioGroup) {
        fields.push({
          name,
          type: 'radio',
          value: f.getSelected() || '',
          options: f.getOptions(),
          x,
          y,
        });
      } else if (f instanceof PDFOptionList) {
        fields.push({
          name,
          type: 'optionlist',
          value: (f.getSelected() || [])[0] || '',
          options: f.getOptions(),
          x,
          y,
        });
      } else {
        fields.push({
          name,
          type: 'unknown',
          value: '',
          x,
          y,
        });
      }
    }
  } catch (err) {
    console.warn('El PDF no contiene formulario AcroForm estándar o hubo un aviso al leerlo:', err);
  }

  return { pageCount, fields };
}

/**
 * Guarda una plantilla PDF oficial exclusivamente en el almacenamiento local del dispositivo (o solo en memoria de sesión).
 */
export async function saveLocalOfficialForm(
  file: File,
  explicitCode?: OfficialFormCode,
  sessionOnly = false
): Promise<LocalOfficialFormMetadata> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const { pageCount, fields } = await inspectPdfBytes(bytes);
  const detectedCode = explicitCode || detectOfficialFormCode(file.name, fields);
  const id = `local_form_${detectedCode}_${Date.now()}`;

  const meta: LocalOfficialFormMetadata = {
    id,
    code: detectedCode,
    fileName: file.name,
    fileSize: file.size,
    loadedAt: new Date().toISOString(),
    fieldCount: fields.length,
    pageCount,
    fieldsSummary: fields,
    sessionOnly,
  };

  if (sessionOnly) {
    for (const [k, v] of sessionMemoryStore.entries()) {
      if (v.meta.code === detectedCode && detectedCode !== 'CUSTOM') {
        sessionMemoryStore.delete(k);
      }
    }
    sessionMemoryStore.set(id, { meta, bytes });
    return meta;
  }

  const db = await openLocalFormsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const getAllReq = store.getAll();
    getAllReq.onsuccess = () => {
      const existing = (getAllReq.result || []) as Array<{
        id: string;
        meta: LocalOfficialFormMetadata;
        bytes: Uint8Array;
      }>;
      for (const item of existing) {
        if (item.meta.code === detectedCode && detectedCode !== 'CUSTOM') {
          store.delete(item.id);
        }
      }
      store.put({
        id,
        meta,
        bytes,
      });
    };

    tx.oncomplete = () => {
      db.close();
      resolve(meta);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Lista todos los formatos oficiales cargados localmente en este dispositivo.
 */
export async function listLocalOfficialForms(): Promise<LocalOfficialFormMetadata[]> {
  const sessionItems = Array.from(sessionMemoryStore.values()).map((v) => v.meta);
  try {
    const db = await openLocalFormsDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        db.close();
        const dbItems = ((req.result || []) as Array<{ meta: LocalOfficialFormMetadata }>).map(
          (r) => r.meta
        );
        const combined = [...sessionItems, ...dbItems].sort((a, b) =>
          b.loadedAt.localeCompare(a.loadedAt)
        );
        resolve(combined);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return sessionItems;
  }
}

/**
 * Obtiene los bytes binarios de un formato oficial guardado localmente.
 */
export async function getLocalOfficialFormBytes(
  idOrCode: string
): Promise<{ meta: LocalOfficialFormMetadata; bytes: Uint8Array } | null> {
  if (sessionMemoryStore.has(idOrCode)) {
    return sessionMemoryStore.get(idOrCode)!;
  }
  for (const val of sessionMemoryStore.values()) {
    if (val.meta.code === idOrCode) return val;
  }

  try {
    const db = await openLocalFormsDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        db.close();
        const all = (req.result || []) as Array<{
          id: string;
          meta: LocalOfficialFormMetadata;
          bytes: Uint8Array;
        }>;
        const found = all.find((item) => item.id === idOrCode || item.meta.code === idOrCode);
        if (!found) {
          resolve(null);
          return;
        }
        resolve({
          meta: found.meta,
          bytes:
            found.bytes instanceof Uint8Array
              ? found.bytes
              : new Uint8Array(found.bytes as ArrayBuffer),
        });
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Elimina un formato oficial específico del almacenamiento local.
 */
export async function deleteLocalOfficialForm(id: string): Promise<void> {
  sessionMemoryStore.delete(id);
  try {
    const db = await openLocalFormsDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {}
}

/**
 * Purga absolutamente todos los formatos oficiales locales del navegador (Memoria + IndexedDB).
 */
export async function purgeAllLocalOfficialForms(): Promise<void> {
  sessionMemoryStore.clear();
  try {
    const db = await openLocalFormsDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {}
}

// ============================================================================
// UTILIDADES INTERNAS PARA ESCRIBIR EN CAMPOS ACROFORM DE PDF-LIB
// ============================================================================

function safeSetText(field: PDFTextField, text: string) {
  try {
    field.setText(text ?? '');
  } catch {
    try {
      const maxLen = field.getMaxLength();
      if (maxLen && text.length > maxLen) {
        field.setText(text.slice(0, maxLen));
      }
    } catch {}
  }
}

function safeSetCheckBox(field: PDFCheckBox, checked: boolean) {
  try {
    if (checked) field.check();
    else field.uncheck();
  } catch {}
}

/**
 * Rellena el formato oficial S-21 (Registro de Publicador de la Congregación)
 * sobre el archivo PDF oficial cargado por el usuario.
 */
export async function fillOfficialS21Pdf(
  templateBytes: Uint8Array,
  publisher: Publisher,
  serviceYear: string,
  allReports: MonthlyServiceReport[],
  customFieldOverrides?: Record<string, string | boolean>
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const rawFields = sortPdfFieldsVisually(pdfDoc, form.getFields());

  const textFields: PDFTextField[] = [];
  const checkBoxes: PDFCheckBox[] = [];

  for (const f of rawFields) {
    if (f instanceof PDFTextField) textFields.push(f);
    else if (f instanceof PDFCheckBox) checkBoxes.push(f);
  }

  const card: S21ServiceYearCard = buildS21CardForPublisher(publisher, serviceYear, allReports);
  const fullName =
    publisher.full_name ||
    publisher.name ||
    [publisher.first_name, publisher.middle_name, publisher.last_name, publisher.second_last_name]
      .filter(Boolean)
      .join(' ') ||
    '';
  const birthDate = publisher.birth_date || publisher.birthDate || '';
  const baptismDate = publisher.baptism_date || publisher.baptismDate || '';
  const isFemale = publisher.gender === 'female' || publisher.gender === 'hermana';
  const isAnointed = Boolean(publisher.is_anointed || publisher.hope === 'ungido');
  const roleStr = String(
    publisher.role || publisher.privilege || publisher.spiritualStatus || ''
  ).toLowerCase();
  const isElder = roleStr === 'elder' || roleStr === 'anciano' || roleStr === 'super_admin';
  const isServant = roleStr === 'servant' || roleStr === 'siervo_ministerial';
  const pType = String(publisher.pioneer_type || publisher.pioneerStatus || '').toLowerCase();
  const isRegularPioneer = pType === 'regular' || roleStr === 'precursor_regular';
  const isSpecialPioneer =
    pType === 'special' || pType === 'especial' || roleStr === 'precursor_especial';
  const isMissionary = pType === 'missionary' || pType === 'misionero';

  const yearKeyShort = serviceYear.split('-')[1] || serviceYear;
  const legacyS21Records =
    (publisher.s21_records || {})[serviceYear] ||
    (publisher.s21_records || {})[yearKeyShort] ||
    [];

  const enrichedMonths = card.months.map((m, idx) => {
    const leg = legacyS21Records[idx];
    if (!m.hasReport && leg && (leg.participated || leg.hours > 0 || leg.bible_studies > 0)) {
      return {
        ...m,
        participated: Boolean(leg.participated || leg.hours > 0),
        bibleStudies: leg.bible_studies || 0,
        isAuxiliaryPioneer: Boolean(leg.auxiliary_pioneer),
        hours: leg.hours || 0,
        notes: leg.comments || '',
        hasReport: true,
      };
    }
    return m;
  });

  const totalHours = enrichedMonths.reduce((acc, m) => acc + (m.hours || 0), 0);
  const totalStudies = enrichedMonths.reduce((acc, m) => acc + (m.bibleStudies || 0), 0);

  const fieldByName = new Map<string, any>();
  rawFields.forEach((f) => fieldByName.set(f.getName(), f));

  const setByPattern = (patterns: RegExp[], val: string | boolean) => {
    for (const f of rawFields) {
      const name = f.getName();
      if (patterns.some((rx) => rx.test(name))) {
        if (typeof val === 'string' && f instanceof PDFTextField) {
          safeSetText(f, val);
          return true;
        } else if (typeof val === 'boolean' && f instanceof PDFCheckBox) {
          safeSetCheckBox(f, val);
          return true;
        }
      }
    }
    return false;
  };

  // Mapeo por patrones de nombres oficiales JW (familia 900_x / 901_x o nombres descriptivos)
  const matchedName = setByPattern(
    [/^900_1_/i, /nombre|name/i, /^text1$/i],
    fullName
  );
  setByPattern([/^900_2_/i, /nacimiento|birth/i, /^text2$/i], birthDate);
  setByPattern([/^900_5_/i, /bautismo|baptism|inmersi/i, /^text3$/i], baptismDate);

  setByPattern([/^900_3_/i, /hombre|male|varon/i], !isFemale);
  setByPattern([/^900_4_/i, /mujer|female|hermana/i], isFemale);
  setByPattern([/^900_6_/i, /otras_ovejas|other_sheep/i], !isAnointed);
  setByPattern([/^900_7_/i, /ungido|anointed/i], isAnointed);
  setByPattern([/^900_8_/i, /anciano|elder/i], isElder);
  setByPattern([/^900_9_/i, /siervo|servant|ministerial/i], isServant);
  setByPattern([/^900_10_/i, /regular/i], isRegularPioneer);
  setByPattern([/^900_11_/i, /especial|special/i], isSpecialPioneer);
  setByPattern([/^900_12_/i, /misionero|missionary/i], isMissionary);
  setByPattern([/^900_13_/i, /a[ñn]o.*servicio|service.*year/i], serviceYear);

  // Fallback posicional visual (ya ordenado de arriba hacia abajo y de izquierda a derecha)
  if (!matchedName && textFields.length >= 3) {
    safeSetText(textFields[0], fullName);
    safeSetText(textFields[1], birthDate);
    safeSetText(textFields[2], baptismDate);
    if (textFields[3]) safeSetText(textFields[3], serviceYear);
  }

  if (checkBoxes.length >= 9 && !rawFields.some((f) => /^900_3_/i.test(f.getName()))) {
    safeSetCheckBox(checkBoxes[0], !isFemale);
    safeSetCheckBox(checkBoxes[1], isFemale);
    safeSetCheckBox(checkBoxes[2], !isAnointed);
    safeSetCheckBox(checkBoxes[3], isAnointed);
    safeSetCheckBox(checkBoxes[4], isElder);
    safeSetCheckBox(checkBoxes[5], isServant);
    safeSetCheckBox(checkBoxes[6], isRegularPioneer);
    safeSetCheckBox(checkBoxes[7], isSpecialPioneer);
    safeSetCheckBox(checkBoxes[8], isMissionary);
  }

  const monthNamesRegex = [
    /sep/i,
    /oct/i,
    /nov/i,
    /dic|dec/i,
    /ene|jan/i,
    /feb/i,
    /mar/i,
    /abr|apr/i,
    /may/i,
    /jun/i,
    /jul/i,
    /ago|aug/i,
  ];

  enrichedMonths.forEach((m, idx) => {
    const rowNum = idx + 1;
    const studiesStr = m.bibleStudies && m.bibleStudies > 0 ? String(m.bibleStudies) : '';
    const hoursStr = m.hours !== undefined && m.hours > 0 ? String(m.hours) : '';
    const notesStr = m.notes || '';

    setByPattern(
      [
        new RegExp(`^901_20_${rowNum}_`, 'i'),
        new RegExp(`part.*_${rowNum}$`, 'i'),
        new RegExp(`${monthNamesRegex[idx].source}.*part`, 'i'),
      ],
      m.participated
    );
    setByPattern(
      [
        new RegExp(`^901_21_${rowNum}_`, 'i'),
        new RegExp(`(cursos|studies|estudios).*_${rowNum}$`, 'i'),
        new RegExp(`${monthNamesRegex[idx].source}.*(cursos|studies|estudios)`, 'i'),
      ],
      studiesStr
    );
    setByPattern(
      [
        new RegExp(`^901_22_${rowNum}_`, 'i'),
        new RegExp(`aux.*_${rowNum}$`, 'i'),
        new RegExp(`${monthNamesRegex[idx].source}.*aux`, 'i'),
      ],
      Boolean(m.isAuxiliaryPioneer)
    );
    setByPattern(
      [
        new RegExp(`^901_23_${rowNum}_`, 'i'),
        new RegExp(`(horas|hours).*_${rowNum}$`, 'i'),
        new RegExp(`${monthNamesRegex[idx].source}.*(horas|hours)`, 'i'),
      ],
      hoursStr
    );
    setByPattern(
      [
        new RegExp(`^901_24_${rowNum}_`, 'i'),
        new RegExp(`(notas|notes|obs).*_${rowNum}$`, 'i'),
        new RegExp(`${monthNamesRegex[idx].source}.*(notas|notes|obs)`, 'i'),
      ],
      notesStr
    );
  });

  if (totalHours > 0) {
    setByPattern([/^901_23_13_/i, /total.*(horas|hours)/i, /^901_25_/i], String(totalHours));
  }
  if (totalStudies > 0) {
    setByPattern([/^901_21_13_/i, /total.*(cursos|studies|estudios)/i], String(totalStudies));
  }

  const remainingCheckboxes = checkBoxes.slice(9);
  if (
    remainingCheckboxes.length >= 24 &&
    !rawFields.some((f) => /^901_20_/i.test(f.getName()))
  ) {
    enrichedMonths.forEach((m, idx) => {
      const partBox = remainingCheckboxes[idx * 2];
      const auxBox = remainingCheckboxes[idx * 2 + 1];
      if (partBox) safeSetCheckBox(partBox, Boolean(m.participated));
      if (auxBox) safeSetCheckBox(auxBox, Boolean(m.isAuxiliaryPioneer));
    });
  }

  const remainingTextFields = textFields.slice(4);
  if (
    remainingTextFields.length >= 36 &&
    !rawFields.some((f) => /^901_21_/i.test(f.getName()))
  ) {
    enrichedMonths.forEach((m, idx) => {
      const studiesField = remainingTextFields[idx * 3];
      const hoursField = remainingTextFields[idx * 3 + 1];
      const notesField = remainingTextFields[idx * 3 + 2];
      if (studiesField && m.bibleStudies) safeSetText(studiesField, String(m.bibleStudies));
      if (hoursField && m.hours) safeSetText(hoursField, String(m.hours));
      if (notesField && m.notes) safeSetText(notesField, m.notes);
    });
    const totalField = remainingTextFields[36];
    if (totalField && totalHours > 0) safeSetText(totalField, String(totalHours));
  }

  if (customFieldOverrides) {
    for (const [fieldName, val] of Object.entries(customFieldOverrides)) {
      const f = fieldByName.get(fieldName);
      if (!f) continue;
      if (f instanceof PDFTextField && typeof val === 'string') {
        safeSetText(f, val);
      } else if (f instanceof PDFCheckBox && typeof val === 'boolean') {
        safeSetCheckBox(f, val);
      }
    }
  }

  // Si el PDF cargado fue aplanado y no contiene campos interactivos AcroForm, estampar todos los datos S-21
  if (rawFields.length === 0) {
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { height } = firstPage.getSize();

    firstPage.drawText(fullName, {
      x: 75,
      y: height - 68,
      size: 10,
      font: boldFont,
      color: rgb(0.05, 0.05, 0.2),
    });
    if (birthDate) {
      firstPage.drawText(birthDate, { x: 115, y: height - 86, size: 9, font: regularFont });
    }
    if (baptismDate) {
      firstPage.drawText(baptismDate, { x: 115, y: height - 104, size: 9, font: regularFont });
    }
    firstPage.drawText(serviceYear, {
      x: 115,
      y: height - 138,
      size: 9.5,
      font: boldFont,
      color: rgb(0.05, 0.05, 0.2),
    });

    enrichedMonths.forEach((m, idx) => {
      const rowY = height - 175 - idx * 17.5;
      if (m.participated) {
        firstPage.drawText('X', { x: 138, y: rowY, size: 9, font: boldFont });
      }
      if (m.bibleStudies && m.bibleStudies > 0) {
        firstPage.drawText(String(m.bibleStudies), { x: 205, y: rowY, size: 9, font: regularFont });
      }
      if (m.isAuxiliaryPioneer) {
        firstPage.drawText('X', { x: 270, y: rowY, size: 9, font: boldFont });
      }
      if (m.hours && m.hours > 0) {
        firstPage.drawText(String(m.hours), { x: 332, y: rowY, size: 9, font: regularFont });
      }
      if (m.notes) {
        firstPage.drawText(m.notes.slice(0, 35), { x: 388, y: rowY, size: 8, font: regularFont });
      }
    });

    if (totalHours > 0) {
      firstPage.drawText(String(totalHours), {
        x: 332,
        y: height - 175 - 12 * 17.5,
        size: 9.5,
        font: boldFont,
      });
    }
  }

  return await pdfDoc.save();
}

/**
 * Genera un único PDF multipágina rellenando el formato oficial S-21 para múltiples publicadores
 * (por ejemplo, todo un Grupo de Servicio o toda la Congregación) sobre la plantilla oficial cargada.
 */
export async function fillBatchOfficialS21Pdf(
  templateBytes: Uint8Array,
  publishersList: Publisher[],
  serviceYear: string,
  allReports: MonthlyServiceReport[]
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const pub of publishersList) {
    const filledSingleBytes = await fillOfficialS21Pdf(
      templateBytes,
      pub,
      serviceYear,
      allReports
    );
    const singleDoc = await PDFDocument.load(filledSingleBytes, { ignoreEncryption: true });
    try {
      singleDoc.getForm().flatten();
    } catch {}
    const copiedPages = await mergedPdf.copyPages(singleDoc, singleDoc.getPageIndices());
    copiedPages.forEach((p) => mergedPdf.addPage(p));
  }

  return await mergedPdf.save();
}

/**
 * Rellena el formato oficial S-89 (Asignación para la Reunión Vida y Ministerio Cristianos)
 * soportando tanto el archivo individual (1 por hoja) como la plantilla 4 en 1 (4 por hoja).
 */
export async function fillOfficialS89Pdf(
  templateBytes: Uint8Array,
  slips: S89Slip[]
): Promise<Uint8Array> {
  if (slips.length === 0) {
    return templateBytes;
  }

  const probeDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const probeForm = probeDoc.getForm();
  const rawFields = sortPdfFieldsVisually(probeDoc, probeForm.getFields());
  const textFieldsCount = rawFields.filter((f) => f instanceof PDFTextField).length;

  // Si tiene >= 12 campos de texto, es la plantilla oficial S-89 de 4 por página (4-up)
  const isFourUp = textFieldsCount >= 12;
  const slipsPerPage = isFourUp ? 4 : 1;
  const totalPagesNeeded = Math.ceil(slips.length / slipsPerPage);

  const outputPdf = await PDFDocument.create();

  for (let pageIdx = 0; pageIdx < totalPagesNeeded; pageIdx++) {
    const chunk = slips.slice(pageIdx * slipsPerPage, (pageIdx + 1) * slipsPerPage);
    const pageDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
    const form = pageDoc.getForm();
    const fields = sortPdfFieldsVisually(pageDoc, form.getFields());

    const pageTextFields = fields.filter((f): f is PDFTextField => f instanceof PDFTextField);
    const pageCheckBoxes = fields.filter((f): f is PDFCheckBox => f instanceof PDFCheckBox);

    chunk.forEach((slip, slotIdx) => {
      const textStride = Math.max(4, Math.floor(pageTextFields.length / slipsPerPage));
      const checkStride = Math.max(2, Math.floor(pageCheckBoxes.length / slipsPerPage));

      const baseTextIdx = slotIdx * textStride;
      const baseCheckIdx = slotIdx * checkStride;

      const nameField = pageTextFields[baseTextIdx];
      const assistantField = pageTextFields[baseTextIdx + 1];
      const dateField = pageTextFields[baseTextIdx + 2];
      const partNumField = pageTextFields[baseTextIdx + 3];

      if (nameField) safeSetText(nameField, slip.studentName || '');
      if (assistantField) safeSetText(assistantField, slip.assistantName || '');
      if (dateField) safeSetText(dateField, slip.date || '');
      if (partNumField) {
        safeSetText(partNumField, `${slip.partNumber}. ${slip.partTitle || ''}`.trim());
      }

      const mainHallBox = pageCheckBoxes[baseCheckIdx];
      const auxHallBox = pageCheckBoxes[baseCheckIdx + 1];
      const isAux = slip.room === 'auxiliar';

      if (mainHallBox) safeSetCheckBox(mainHallBox, !isAux);
      if (auxHallBox) safeSetCheckBox(auxHallBox, isAux);
    });

    if (totalPagesNeeded > 1) {
      try {
        form.flatten();
      } catch {}
    }

    if (totalPagesNeeded === 1) {
      return await pageDoc.save();
    }

    const copied = await outputPdf.copyPages(pageDoc, pageDoc.getPageIndices());
    copied.forEach((p) => outputPdf.addPage(p));
  }

  return await outputPdf.save();
}

/**
 * Rellena el formato oficial S-88 (Registro de Asistencia a las Reuniones de la Congregación)
 * en local con los datos de asistencia de las semanas registradas.
 */
export async function fillOfficialS88Pdf(
  templateBytes: Uint8Array,
  weeks: WeekSchedule[],
  serviceYear: string,
  settings: CongregationSettings
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const fields = sortPdfFieldsVisually(pdfDoc, form.getFields());
  const textFields = fields.filter((f): f is PDFTextField => f instanceof PDFTextField);

  const months = getServiceYearMonths(serviceYear);
  const monthlyStats = months.map((m) => {
    const monthWeeks = weeks.filter((w) => w.weekStartDate.startsWith(m.monthKey));
    let midCount = 0;
    let midTotal = 0;
    let wkndCount = 0;
    let wkndTotal = 0;

    monthWeeks.forEach((w) => {
      const att = w.attendance as any;
      const midAtt =
        att?.midweek?.total ||
        (att?.midweek?.inPerson || att?.midweekInPerson || 0) +
          (att?.midweek?.zoom || att?.midweekZoom || 0);
      const wkndAtt =
        att?.weekend?.total ||
        (att?.weekend?.inPerson || att?.weekendInPerson || 0) +
          (att?.weekend?.zoom || att?.weekendZoom || 0);
      if (midAtt > 0) {
        midCount++;
        midTotal += midAtt;
      }
      if (wkndAtt > 0) {
        wkndCount++;
        wkndTotal += wkndAtt;
      }
    });

    return {
      monthName: m.monthName,
      midCount,
      midTotal,
      midAvg: midCount > 0 ? Math.round(midTotal / midCount) : 0,
      wkndCount,
      wkndTotal,
      wkndAvg: wkndCount > 0 ? Math.round(wkndTotal / wkndCount) : 0,
    };
  });

  if (textFields.length > 0) {
    safeSetText(textFields[0], settings.congregationName || serviceYear);
  }
  if (textFields.length > 1) {
    safeSetText(textFields[1], serviceYear);
  }

  let cursor = 2;
  for (const st of monthlyStats) {
    if (cursor + 5 < textFields.length) {
      if (st.midCount > 0) {
        safeSetText(textFields[cursor], String(st.midCount));
        safeSetText(textFields[cursor + 1], String(st.midTotal));
        safeSetText(textFields[cursor + 2], String(st.midAvg));
      }
      if (st.wkndCount > 0) {
        safeSetText(textFields[cursor + 3], String(st.wkndCount));
        safeSetText(textFields[cursor + 4], String(st.wkndTotal));
        safeSetText(textFields[cursor + 5], String(st.wkndAvg));
      }
      cursor += 6;
    }
  }

  return await pdfDoc.save();
}

/**
 * Rellena el formato oficial S-140 (Programa de la Reunión Vida y Ministerio Cristianos) en local.
 */
export async function fillOfficialS140Pdf(
  templateBytes: Uint8Array,
  week: WeekSchedule,
  publishersMap: Map<string, Publisher>,
  settings: CongregationSettings
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const fields = sortPdfFieldsVisually(pdfDoc, form.getFields());
  const textFields = fields.filter((f): f is PDFTextField => f instanceof PDFTextField);

  const getPubName = (id?: string) => (id ? publishersMap.get(id)?.name || '' : '');
  const midweekAny = week.midweek as any;

  const valuesQueue: string[] = [
    settings.congregationName || '',
    `${week.weekStartDate} al ${week.weekEndDate}`,
    week.midweek.bibleReading || midweekAny.bibleReadingText || '',
    getPubName(week.midweek.presidentId),
    getPubName(week.midweek.auxiliaryCounselorId || midweekAny.auxiliaryClassCounselorId),
    String(week.midweek.songFirst || midweekAny.initialSong || ''),
    getPubName(week.midweek.initialPrayerId),
    week.midweek.tesoros.discurso.title || '',
    getPubName(week.midweek.tesoros.discurso.publisherId),
    getPubName(week.midweek.tesoros.perlas.publisherId),
    getPubName(week.midweek.tesoros.lecturaBiblia.publisherId),
    ...week.midweek.maestros.items.flatMap((it) => [
      it.title || '',
      [getPubName(it.publisherId), getPubName(it.assistantId)].filter(Boolean).join(' / '),
    ]),
    String(week.midweek.songMiddle || midweekAny.middleSong || ''),
    ...week.midweek.vidaCristiana.items.flatMap((it) => [
      it.title || '',
      getPubName(it.publisherId),
    ]),
    getPubName(week.midweek.vidaCristiana.estudioBiblico.conductorId),
    getPubName(week.midweek.vidaCristiana.estudioBiblico.lectorId),
    String(week.midweek.songConclude || midweekAny.finalSong || ''),
    getPubName(week.midweek.finalPrayerId),
  ];

  valuesQueue.forEach((val, idx) => {
    if (textFields[idx] && val) {
      safeSetText(textFields[idx], val);
    }
  });

  return await pdfDoc.save();
}

/**
 * Rellena el formato oficial S-13 (Registro de Asignación de Territorio) en local.
 */
export async function fillOfficialS13Pdf(
  templateBytes: Uint8Array,
  territories: Territory[],
  serviceYear: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const textFields = sortPdfFieldsVisually(pdfDoc, form.getFields()).filter(
    (f): f is PDFTextField => f instanceof PDFTextField
  );

  if (textFields.length > 0) {
    safeSetText(textFields[0], serviceYear);
  }

  let cursor = 1;
  for (const t of territories) {
    const tAny = t as any;
    if (cursor >= textFields.length) break;
    safeSetText(textFields[cursor++], String(t.number || ''));
    if (cursor < textFields.length) {
      safeSetText(textFields[cursor++], t.lastCompletedDate || '');
    }
    const history = (t.history || []) as any[];
    for (let i = 0; i < 4; i++) {
      const rec = history[i];
      if (cursor + 2 < textFields.length) {
        safeSetText(
          textFields[cursor++],
          rec?.assignedToName || rec?.publisherName || (i === 0 ? tAny.assignedToName || '' : '')
        );
        safeSetText(
          textFields[cursor++],
          rec?.assignedDate || (i === 0 ? t.assignedDate || '' : '')
        );
        safeSetText(textFields[cursor++], rec?.completedDate || rec?.returnedDate || '');
      }
    }
  }

  return await pdfDoc.save();
}

/**
 * Rellena el formato oficial S-26 (Hoja de Cuentas de la Congregación) sobre el PDF oficial cargado.
 */
export async function fillOfficialS26Pdf(
  templateBytes: Uint8Array,
  monthKey: string,
  transactions: AccountTransaction[],
  settings: CongregationSettings
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const textFields = sortPdfFieldsVisually(pdfDoc, form.getFields()).filter(
    (f): f is PDFTextField => f instanceof PDFTextField
  );

  const s26 = computeMonthlyS26(monthKey, transactions);
  const [yr, mo] = monthKey.split('-');

  if (textFields.length >= 4) {
    safeSetText(textFields[0], settings.congregationName || '');
    safeSetText(textFields[1], settings.city || settings.hallAddress || '');
    safeSetText(textFields[2], s26.monthName || mo || '');
    safeSetText(textFields[3], yr || '');
  }

  let cursor = 4;
  for (const tx of s26.transactions) {
    if (cursor + 4 >= textFields.length) break;
    safeSetText(textFields[cursor++], tx.date);
    safeSetText(textFields[cursor++], tx.description);
    safeSetText(textFields[cursor++], tx.receiptNumber || '');
    safeSetText(textFields[cursor++], tx.type === 'ingreso' ? tx.amount.toFixed(2) : '');
    safeSetText(textFields[cursor++], tx.type === 'gasto' ? tx.amount.toFixed(2) : '');
  }

  // Intentar rellenar campos nombrados de totales si existen
  for (const f of textFields) {
    const n = f.getName().toLowerCase();
    if (n.includes('congrega')) safeSetText(f, settings.congregationName || '');
    else if (n.includes('mes') || n.includes('month')) safeSetText(f, s26.monthName);
    else if (n.includes('saldo_inicial') || n.includes('opening'))
      safeSetText(f, s26.openingBalance.toFixed(2));
    else if (n.includes('total_ingreso') || n.includes('income'))
      safeSetText(f, s26.totalIncome.toFixed(2));
    else if (n.includes('total_gasto') || n.includes('expense'))
      safeSetText(f, s26.totalExpenses.toFixed(2));
    else if (n.includes('saldo_final') || n.includes('closing'))
      safeSetText(f, s26.closingBalance.toFixed(2));
  }

  return await pdfDoc.save();
}

/**
 * Rellena el formato oficial S-30 (Informe Mensual de las Cuentas de la Congregación) sobre el PDF oficial cargado.
 */
export async function fillOfficialS30Pdf(
  templateBytes: Uint8Array,
  monthKey: string,
  transactions: AccountTransaction[],
  settings: CongregationSettings
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const textFields = sortPdfFieldsVisually(pdfDoc, form.getFields()).filter(
    (f): f is PDFTextField => f instanceof PDFTextField
  );

  const s26 = computeMonthlyS26(monthKey, transactions);

  const valuesQueue = [
    settings.congregationName || '',
    s26.monthName,
    s26.openingBalance.toFixed(2),
    s26.totalIncome.toFixed(2),
    s26.totalExpenses.toFixed(2),
    (s26.expensesByFund.obra_mundial || 0).toFixed(2),
    s26.closingBalance.toFixed(2),
    formatCurrency(s26.closingBalance),
  ];

  valuesQueue.forEach((val, idx) => {
    if (textFields[idx]) {
      safeSetText(textFields[idx], val);
    }
  });

  return await pdfDoc.save();
}

/**
 * Rellena el formato oficial S-25 (Informe de la Auditoría de las Cuentas de la Congregación).
 */
export async function fillOfficialS25Pdf(
  templateBytes: Uint8Array,
  audits: QuarterlyAudit[],
  settings: CongregationSettings
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const textFields = sortPdfFieldsVisually(pdfDoc, form.getFields()).filter(
    (f): f is PDFTextField => f instanceof PDFTextField
  );

  const latestAudit = audits[0];
  const valuesQueue = [
    settings.congregationName || '',
    latestAudit?.quarter || 'Trimestre 1',
    latestAudit?.serviceYear || '',
    latestAudit?.auditDate || new Date().toISOString().slice(0, 10),
    latestAudit?.auditorName || '',
    latestAudit?.findingsNotes || 'Registros y comprobantes verificados en orden.',
  ];

  valuesQueue.forEach((val, idx) => {
    if (textFields[idx] && val) {
      safeSetText(textFields[idx], val);
    }
  });

  return await pdfDoc.save();
}

/**
 * Rellena el formato oficial S-28 / S-14 (Inventario de Publicaciones) sobre el PDF oficial cargado.
 */
export async function fillOfficialS28Pdf(
  templateBytes: Uint8Array,
  literatureItems: LiteratureItem[],
  settings: CongregationSettings
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const textFields = sortPdfFieldsVisually(pdfDoc, form.getFields()).filter(
    (f): f is PDFTextField => f instanceof PDFTextField
  );

  if (textFields.length > 0) safeSetText(textFields[0], settings.congregationName || '');
  if (textFields.length > 1) safeSetText(textFields[1], settings.congregationNumber || '');
  if (textFields.length > 2) safeSetText(textFields[2], 'Español');
  if (textFields.length > 3) safeSetText(textFields[3], new Date().toISOString().slice(0, 10));

  // Mapear por nombre de campo si incluye el código de la publicación, o posicionalmente
  for (const item of literatureItems) {
    const codeUpper = (item.code || '').toUpperCase();
    if (!codeUpper) continue;
    for (const f of textFields) {
      if (f.getName().toUpperCase().includes(codeUpper)) {
        safeSetText(f, String(item.currentStock || 0));
      }
    }
  }

  let cursor = 4;
  for (const item of literatureItems) {
    if (cursor + 2 >= textFields.length) break;
    safeSetText(textFields[cursor++], item.code || '');
    safeSetText(textFields[cursor++], item.title || '');
    safeSetText(textFields[cursor++], String(item.currentStock ?? 0));
  }

  return await pdfDoc.save();
}

/**
 * Rellena cualquier archivo PDF con los valores de campo personalizados editados por el usuario en el Inspector Local.
 */
export async function fillCustomOfficialPdf(
  templateBytes: Uint8Array,
  fieldValues: Record<string, string | boolean>
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  for (const f of fields) {
    const name = f.getName();
    if (!(name in fieldValues)) continue;
    const val = fieldValues[name];

    if (f instanceof PDFTextField && typeof val === 'string') {
      safeSetText(f, val);
    } else if (f instanceof PDFCheckBox && typeof val === 'boolean') {
      safeSetCheckBox(f, val);
    } else if (f instanceof PDFDropdown && typeof val === 'string') {
      try {
        f.select(val);
      } catch {}
    } else if (f instanceof PDFRadioGroup && typeof val === 'string') {
      try {
        f.select(val);
      } catch {}
    }
  }

  return await pdfDoc.save();
}

/**
 * Descarga un arreglo de bytes PDF directamente en el navegador del usuario.
 */
export function downloadPdfBytesLocally(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
