// src/utils/excelExport.ts
import { WeekSchedule, Publisher, CongregationSettings } from '../types';
import { sanitizeCsvFormulaInjection } from './theocraticSecurity';

export function exportScheduleToCsvExcel(
  weeks: WeekSchedule[],
  publishersMap: Map<string, Publisher>,
  settings: CongregationSettings
) {
  const headers = [
    'Semana Inicio',
    'Semana Fin',
    'Reunion',
    'Fecha',
    'Seccion',
    'Parte / Asignacion',
    'Sala',
    'Asignado Titular',
    'Ayudante',
    'Estado',
    'Deberes Operativos',
    'Limpieza Salon Grupos',
    'Evento Especial',
  ];

  const rows: string[][] = [];

  const getPubName = (id?: string) => (id ? publishersMap.get(id)?.name || '---' : '---');

  weeks.forEach(w => {
    const special = w.specialEvent?.isSpecial ? w.specialEvent.title : '';
    const cleanGroups = `Grupo(s) #${w.cleaningGroupNumbers.join(', #')}`;

    // --- MIDWEEK ---
    if (!w.specialEvent?.noMeetingMidweek) {
      const midDuties = Object.entries(w.midweek.duties)
        .map(([k, ids]) => `${k.replace('deber_', '').toUpperCase()}: ${ids.map(getPubName).join(', ')}`)
        .filter(s => !s.endsWith(': '))
        .join(' | ');

      // Presidencia y oraciones
      rows.push([
        w.weekStartDate,
        w.weekEndDate,
        'Entre Semana',
        w.midweek.date,
        'Presidencia',
        'Presidente de la reunión',
        'Principal',
        getPubName(w.midweek.presidentId),
        '',
        'Confirmada',
        midDuties,
        cleanGroups,
        special || '',
      ]);

      rows.push([
        w.weekStartDate,
        w.weekEndDate,
        'Entre Semana',
        w.midweek.date,
        'Oración',
        'Oración inicial',
        'Principal',
        getPubName(w.midweek.initialPrayerId),
        '',
        'Confirmada',
        midDuties,
        cleanGroups,
        special || '',
      ]);

      // Tesoros
      rows.push([
        w.weekStartDate,
        w.weekEndDate,
        'Entre Semana',
        w.midweek.date,
        'Tesoros de la Biblia',
        w.midweek.tesoros.discurso.title,
        'Principal',
        getPubName(w.midweek.tesoros.discurso.publisherId),
        '',
        w.midweek.tesoros.discurso.status,
        midDuties,
        cleanGroups,
        special || '',
      ]);

      rows.push([
        w.weekStartDate,
        w.weekEndDate,
        'Entre Semana',
        w.midweek.date,
        'Tesoros de la Biblia',
        w.midweek.tesoros.perlas.title,
        'Principal',
        getPubName(w.midweek.tesoros.perlas.publisherId),
        '',
        w.midweek.tesoros.perlas.status,
        midDuties,
        cleanGroups,
        special || '',
      ]);

      rows.push([
        w.weekStartDate,
        w.weekEndDate,
        'Entre Semana',
        w.midweek.date,
        'Tesoros de la Biblia',
        w.midweek.tesoros.lecturaBiblia.title,
        'Principal',
        getPubName(w.midweek.tesoros.lecturaBiblia.publisherId),
        '',
        w.midweek.tesoros.lecturaBiblia.status,
        midDuties,
        cleanGroups,
        special || '',
      ]);

      // Maestros
      w.midweek.maestros.items.forEach(m => {
        rows.push([
          w.weekStartDate,
          w.weekEndDate,
          'Entre Semana',
          w.midweek.date,
          'Seamos Mejores Maestros',
          m.title,
          m.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal',
          getPubName(m.publisherId),
          getPubName(m.assistantId),
          m.status,
          midDuties,
          cleanGroups,
          special || '',
        ]);
      });

      // Vida Cristiana
      w.midweek.vidaCristiana.items.forEach(v => {
        rows.push([
          w.weekStartDate,
          w.weekEndDate,
          'Entre Semana',
          w.midweek.date,
          'Nuestra Vida Cristiana',
          v.title,
          'Principal',
          getPubName(v.publisherId),
          '',
          v.status,
          midDuties,
          cleanGroups,
          special || '',
        ]);
      });

      rows.push([
        w.weekStartDate,
        w.weekEndDate,
        'Entre Semana',
        w.midweek.date,
        'Nuestra Vida Cristiana',
        'Estudio Bíblico de Congregación (Conductor)',
        'Principal',
        getPubName(w.midweek.vidaCristiana.estudioBiblico.conductorId),
        '',
        'Confirmada',
        midDuties,
        cleanGroups,
        special || '',
      ]);

      rows.push([
        w.weekStartDate,
        w.weekEndDate,
        'Entre Semana',
        w.midweek.date,
        'Nuestra Vida Cristiana',
        'Estudio Bíblico de Congregación (Lector)',
        'Principal',
        getPubName(w.midweek.vidaCristiana.estudioBiblico.lectorId),
        '',
        'Confirmada',
        midDuties,
        cleanGroups,
        special || '',
      ]);

      rows.push([
        w.weekStartDate,
        w.weekEndDate,
        'Entre Semana',
        w.midweek.date,
        'Oración',
        'Oración final',
        'Principal',
        getPubName(w.midweek.finalPrayerId),
        '',
        'Confirmada',
        midDuties,
        cleanGroups,
        special || '',
      ]);
    }

    // --- WEEKEND ---
    if (!w.specialEvent?.noMeetingWeekend) {
      const fdsDuties = Object.entries(w.weekend.duties)
        .map(([k, ids]) => `${k.replace('deber_', '').toUpperCase()}: ${ids.map(getPubName).join(', ')}`)
        .filter(s => !s.endsWith(': '))
        .join(' | ');

      rows.push([
        w.weekStartDate,
        w.weekEndDate,
        'Fin de Semana',
        w.weekend.date,
        'Presidencia',
        'Presidente Fin de Semana',
        'Principal',
        getPubName(w.weekend.presidentId),
        '',
        'Confirmada',
        fdsDuties,
        cleanGroups,
        special || '',
      ]);

      rows.push([
        w.weekStartDate,
        w.weekEndDate,
        'Fin de Semana',
        w.weekend.date,
        'Discurso Público',
        `Tema: ${w.weekend.publicTalkTheme || ''}`,
        'Principal',
        w.weekend.publicTalkSpeaker || '---',
        '',
        'Confirmada',
        fdsDuties,
        cleanGroups,
        special || '',
      ]);

      rows.push([
        w.weekStartDate,
        w.weekEndDate,
        'Fin de Semana',
        w.weekend.date,
        'Estudio de La Atalaya',
        'Conductor de La Atalaya',
        'Principal',
        getPubName(w.weekend.atalayaConductorId),
        '',
        'Confirmada',
        fdsDuties,
        cleanGroups,
        special || '',
      ]);

      rows.push([
        w.weekStartDate,
        w.weekEndDate,
        'Fin de Semana',
        w.weekend.date,
        'Estudio de La Atalaya',
        'Lector de La Atalaya',
        'Principal',
        getPubName(w.weekend.atalayaLectorId),
        '',
        'Confirmada',
        fdsDuties,
        cleanGroups,
        special || '',
      ]);
    }
  });

  const escapeCell = (val: string) => `"${sanitizeCsvFormulaInjection(val || '').replace(/"/g, '""')}"`;

  const csvContent =
    '\uFEFF' + // UTF-8 BOM so Excel opens accents cleanly!
    headers.map(escapeCell).join(',') +
    '\n' +
    rows.map(row => row.map(escapeCell).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Programa_Congregacion_${settings.congregationName.replace(/\s+/g, '_')}_Excel.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
