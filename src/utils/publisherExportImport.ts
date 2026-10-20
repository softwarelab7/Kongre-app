// src/utils/publisherExportImport.ts
import { Publisher } from '../types';
import { sanitizeCsvFormulaInjection, sanitizeImportedCsvText } from './theocraticSecurity';
import { ensureImmutablePublisherCode } from './publisherDeduplication';

export interface ExportPublisherOptions {
  congregationName?: string;
  groupNameMap?: Record<string, string>;
  includeConfidentialNotes?: boolean;
}

const escapeCell = (val: string | number | undefined | null) => {
  if (val === undefined || val === null) return '""';
  const safeStr = sanitizeCsvFormulaInjection(val);
  return `"${safeStr.replace(/"/g, '""')}"`;
};

export function exportPublishersToCsv(
  publishers: Publisher[],
  options: ExportPublisherOptions = {}
): void {
  const headers = [
    'ID',
    'Nombre Completo',
    'Primer Nombre',
    'Segundo Nombre',
    'Primer Apellido',
    'Segundo Apellido',
    'ID Único Publicador',
    'Género',
    'Teléfono',
    'Teléfono Fijo',
    'Correo Electrónico',
    'Dirección',
    'Grupo Número',
    'Grupo Nombre',
    'Privilegio Teocrático',
    'Rol',
    'Tipo Precursor',
    'Estado',
    'Activo',
    'Fecha Nacimiento',
    'Fecha Bautismo',
    'Fecha Publicador',
    'Ungido',
    'Llave del Salón',
    'Informes a Sucursal',
    'Notas Espirituales',
    'Notas Generales'
  ];

  const rows: string[][] = publishers.map((p) => {
    const isFemale = p.gender === 'female' || p.gender === 'hermana';
    const groupNum = p.groupNumber ?? (p.id_grupo ? parseInt(p.id_grupo, 10) : '');
    const groupStr = groupNum ? String(groupNum) : '';
    const groupName = groupStr
      ? options.groupNameMap?.[groupStr] || `Grupo ${groupStr}`
      : 'Sin asignar';
    const immutableCode = ensureImmutablePublisherCode(p);

    return [
      p.id || immutableCode,
      p.full_name || p.name || '',
      p.first_name || '',
      p.middle_name || '',
      p.last_name || '',
      p.second_last_name || '',
      immutableCode,
      isFemale ? 'Hermana' : 'Hermano',
      p.phone || '',
      p.home_phone || '',
      p.email || '',
      p.address || '',
      groupStr,
      groupName,
      p.privilege || p.theocraticRole || p.spiritualStatus || '',
      p.role || '',
      p.pioneer_type || p.pioneerStatus || 'none',
      p.status || (p.active ? 'active' : 'inactive'),
      p.active || p.is_active ? 'Sí' : 'No',
      p.birth_date || p.birthDate || '',
      p.baptism_date || p.baptismDate || '',
      p.publisher_date || '',
      p.is_anointed ? 'Sí' : 'No',
      p.has_key ? 'Sí' : 'No',
      p.reports_to_branch ? 'Sí' : 'No',
      options.includeConfidentialNotes ? (p.spiritual_notes || '') : '',
      options.includeConfidentialNotes ? (p.notes || '') : ''
    ];
  });

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for clean accented characters in Microsoft Excel
    headers.map(escapeCell).join(',') +
    '\n' +
    rows.map((row) => row.map(escapeCell).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = (options.congregationName || 'Congregacion').replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `Directorio_Publicadores_${safeName}_${dateStr}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function parsePublishersCsv(csvText: string): Partial<Publisher>[] {
  const lines = csvText.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/["']/g, '').trim());
  const publishers: Partial<Publisher>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    if (values.length < 2 || !values.some((v) => v.length > 0)) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = sanitizeImportedCsvText(values[idx] || '');
    });

    const fullName =
      rowObj['nombre completo'] ||
      rowObj['nombre'] ||
      [rowObj['primer nombre'], rowObj['primer apellido']].filter(Boolean).join(' ') ||
      '';

    if (!fullName) continue;

    const genderRaw = (rowObj['género'] || rowObj['genero'] || '').toLowerCase();
    const isFemale = genderRaw.includes('hermana') || genderRaw.includes('mujer') || genderRaw.includes('female');

    const groupNumRaw = rowObj['grupo número'] || rowObj['grupo numero'] || rowObj['grupo'] || '';
    const groupNum = parseInt(groupNumRaw.replace(/\D/g, ''), 10) || 1;

    const privRaw = (rowObj['privilegio teocrático'] || rowObj['privilegio'] || rowObj['rol'] || '').toLowerCase();
    let privilege = 'publicador_bautizado';
    let role = 'publisher';
    if (privRaw.includes('anciano') || privRaw.includes('elder')) {
      privilege = 'anciano';
      role = 'elder';
    } else if (privRaw.includes('siervo') || privRaw.includes('servant')) {
      privilege = 'siervo_ministerial';
      role = 'servant';
    } else if (privRaw.includes('no bautizado') || privRaw.includes('unbaptized')) {
      privilege = 'publicador_no_bautizado';
      role = 'unbaptized';
    }

    const pioneerRaw = (rowObj['tipo precursor'] || rowObj['precursor'] || '').toLowerCase();
    let pioneer_type = 'none';
    if (pioneerRaw.includes('regular')) pioneer_type = 'regular';
    else if (pioneerRaw.includes('auxiliar')) pioneer_type = 'auxiliary';
    else if (pioneerRaw.includes('especial')) pioneer_type = 'special';

    const pId = rowObj['id'] || `pub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    publishers.push({
      id: pId,
      name: fullName,
      full_name: fullName,
      first_name: rowObj['primer nombre'] || undefined,
      middle_name: rowObj['segundo nombre'] || undefined,
      last_name: rowObj['primer apellido'] || undefined,
      second_last_name: rowObj['segundo apellido'] || undefined,
      nid: rowObj['nid / documento'] || rowObj['nid'] || undefined,
      gender: isFemale ? 'hermana' : 'hermano',
      phone: rowObj['teléfono'] || rowObj['telefono'] || rowObj['celular'] || '',
      home_phone: rowObj['teléfono fijo'] || rowObj['telefono fijo'] || '',
      email: rowObj['correo electrónico'] || rowObj['correo electronico'] || rowObj['email'] || '',
      address: rowObj['dirección'] || rowObj['direccion'] || '',
      groupNumber: groupNum,
      id_grupo: String(groupNum),
      privilege: privilege as any,
      role: role as any,
      pioneer_type: pioneer_type as any,
      status: rowObj['estado']?.toLowerCase().includes('inact') ? 'inactive' : 'active',
      active: !rowObj['activo']?.toLowerCase().includes('no'),
      is_active: !rowObj['activo']?.toLowerCase().includes('no'),
      birth_date: rowObj['fecha nacimiento'] || undefined,
      baptism_date: rowObj['fecha bautismo'] || undefined,
      notes: rowObj['notas generales'] || undefined,
      spiritual_notes: rowObj['notas espirituales'] || undefined,
      assignments: {},
      absences: [],
      ausencias: [],
      emergency_contacts: [],
      roles: {
        vym_presidente: false,
        vym_oracion: false,
        vym_tesoros_discurso: false,
        vym_tesoros_perlas: false,
        vym_tesoros_lectura: false,
        vym_maestros_titular: true,
        vym_maestros_ayudante: true,
        vym_vida_partes: false,
        vym_estudio_conductor: false,
        vym_estudio_lector: false,
        fds_presidente: false,
        fds_atalaya_lector: false,
        fds_oracion: false,
        deber_acomodador: false,
        deber_seguridad: false,
        deber_audio: false,
        deber_video: false,
        deber_microfonos: false,
        deber_plataforma: false,
        deber_zoom: false,
      }
    });
  }

  return publishers;
}
