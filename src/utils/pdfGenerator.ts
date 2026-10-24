// src/utils/pdfGenerator.ts
import { jsPDF } from 'jspdf';
import { WeekSchedule, Publisher, CongregationSettings, MonthlyServiceReport } from '../types';
import { buildS21CardForPublisher } from './s21Helper';

export function buildS89PdfDoc(
  week: WeekSchedule,
  publishersMap: Map<string, Publisher>,
  congregationName: string,
  pageSize: 'letter' | 'a4' = 'letter',
  orientation: 'portrait' | 'landscape' = 'portrait'
): jsPDF {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize === 'letter' ? 'letter' : 'a4',
  });

  const slips = [...week.midweek.maestros.items.filter(item => item.publisherId)];
  if (week.midweek.tesoros.lecturaBiblia.publisherId) {
    slips.unshift(week.midweek.tesoros.lecturaBiblia);
  }
  if (slips.length === 0) {
    // Fallback to all items so preview/download is never blank
    slips.push(...week.midweek.maestros.items);
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 4 slips per page (2x2 grid) adapted to portrait or landscape dimensions
  const marginX = 8;
  const marginY = 8;
  const gapX = 6;
  const gapY = 6;
  const slipW = (pageWidth - marginX * 2 - gapX) / 2;
  const slipH = (pageHeight - marginY * 2 - gapY) / 2;

  slips.forEach((item, index) => {
    if (index > 0 && index % 4 === 0) {
      doc.addPage(pageSize === 'letter' ? 'letter' : 'a4', orientation);
    }

    const col = index % 2;
    const row = Math.floor((index % 4) / 2);
    const x = marginX + col * (slipW + gapX);
    const y = marginY + row * (slipH + gapY);

    const student = publishersMap.get(item.publisherId || '')?.name || 'Estudiante asignado';
    const assistant = item.assistantId ? publishersMap.get(item.assistantId)?.name || 'Ayudante asignado' : '---';

    // Outer border of S-89
    doc.setDrawColor(76, 58, 237);
    doc.setLineWidth(0.35);
    doc.rect(x, y, slipW, slipH);

    // Header box
    doc.setFillColor(243, 244, 246);
    doc.rect(x, y, slipW, 13, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(x, y + 13, x + slipW, y + 13);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('ASIGNACIÓN PARA LA REUNIÓN', x + slipW / 2, y + 5.5, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('VIDA Y MINISTERIO CRISTIANOS (S-89)', x + slipW / 2, y + 10.2, { align: 'center' });

    // Details body
    const rowStep = orientation === 'landscape' ? 5.8 : 6.8;
    let curY = y + 19;
    doc.setFontSize(8.5);

    // Congregation & Date
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Congregación:', x + 4, curY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text((congregationName || 'Congregación local').substring(0, 34), x + 28, curY);

    curY += rowStep;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Fecha:', x + 4, curY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(week.midweek.date, x + 28, curY);

    curY += rowStep;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Estudiante:', x + 4, curY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(76, 58, 237);
    doc.text(student.substring(0, 34), x + 28, curY);

    curY += rowStep;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Ayudante:', x + 4, curY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(assistant.substring(0, 34), x + 28, curY);

    curY += rowStep;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Asignación:', x + 4, curY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const maxTitleLen = orientation === 'landscape' ? 45 : 32;
    doc.text(item.title.substring(0, maxTitleLen), x + 28, curY);

    curY += rowStep;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Sala:', x + 4, curY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const roomText = item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal';
    doc.text(roomText, x + 28, curY);

    // Footer note
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Presente esta hoja a su consejero con su libro Guía.', x + slipW / 2, y + slipH - 3.5, { align: 'center' });
  });

  return doc;
}

export function generateS89Pdf(
  week: WeekSchedule,
  publishersMap: Map<string, Publisher>,
  congregationName: string,
  pageSize: 'letter' | 'a4' = 'letter',
  orientation: 'portrait' | 'landscape' = 'portrait'
) {
  const doc = buildS89PdfDoc(week, publishersMap, congregationName, pageSize, orientation);
  doc.save(`Hojas_S89_${week.weekStartDate}.pdf`);
}

export function generateS89PdfBlobUrl(
  week: WeekSchedule,
  publishersMap: Map<string, Publisher>,
  congregationName: string,
  pageSize: 'letter' | 'a4' = 'letter',
  orientation: 'portrait' | 'landscape' = 'portrait'
): string {
  const doc = buildS89PdfDoc(week, publishersMap, congregationName, pageSize, orientation);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

export function buildProgramPdfDoc(
  weeks: WeekSchedule[],
  publishersMap: Map<string, Publisher>,
  settings: CongregationSettings
): jsPDF {
  const orientation = settings.pdfOrientation || 'portrait';
  const format = settings.pdfPageSize === 'letter' ? 'letter' : 'a4';
  const template = settings.pdfTemplate || 'oficial';
  const sections = settings.pdfSections || {
    midweek: true,
    weekend: true,
    duties: true,
    cleaning: true,
  };

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 10;
  const contentWidth = pageWidth - marginX * 2;
  const fontFamily = template === 'clasica' ? 'times' : 'helvetica';

  // Header Accent Bar based on Template
  if (template === 'minimalista') {
    doc.setFillColor(15, 23, 42);
    doc.rect(marginX, 8, contentWidth, 1.2, 'F');
  } else if (template === 'clasica') {
    doc.setFillColor(30, 41, 59);
    doc.rect(marginX, 8, contentWidth, 2, 'F');
  } else if (template === 'color') {
    doc.setFillColor(76, 58, 237);
    doc.rect(marginX, 8, contentWidth, 2.5, 'F');
  } else {
    doc.setFillColor(49, 46, 129);
    doc.rect(marginX, 8, contentWidth, 2.2, 'F');
  }

  // Document Header Title
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(
    (settings.congregationName || 'CONGREGACIÓN LOCAL').toUpperCase(),
    pageWidth / 2,
    16,
    { align: 'center' }
  );

  doc.setFontSize(9.5);
  doc.setFont(fontFamily, 'bold');
  doc.setTextColor(76, 58, 237);
  doc.text('PROGRAMA DE ASIGNACIONES TEOCRÁTICAS', pageWidth / 2, 21, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont(fontFamily, 'normal');
  doc.setTextColor(100, 116, 139);
  const scheduleMeta = `${settings.midweekMeetingDay || 'Entre Semana'} ${settings.midweekMeetingTime || ''} • ${settings.weekendMeetingDay || 'Fin de Semana'} ${settings.weekendMeetingTime || ''} • Formato ${format.toUpperCase()} (${orientation === 'landscape' ? 'Horizontal' : 'Vertical'})`;
  doc.text(scheduleMeta, pageWidth / 2, 25.5, { align: 'center' });

  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, 28, pageWidth - marginX, 28);

  let curY = 32;

  const getPub = (id?: string) => (id ? publishersMap.get(id)?.name || '---' : '---');

  weeks.forEach((week) => {
    const estimatedBlockHeight = orientation === 'landscape' ? 32 : 42;
    if (curY + estimatedBlockHeight > pageHeight - 14) {
      doc.addPage(format, orientation);
      curY = 14;
    }

    // Week Header Bar
    if (template === 'minimalista') {
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.35);
      doc.rect(marginX, curY, contentWidth, 6.5);
      doc.setTextColor(15, 23, 42);
    } else if (template === 'clasica') {
      doc.setFillColor(51, 65, 85);
      doc.rect(marginX, curY, contentWidth, 6.8, 'F');
      doc.setTextColor(255, 255, 255);
    } else if (template === 'color') {
      doc.setFillColor(76, 58, 237);
      doc.rect(marginX, curY, contentWidth, 6.8, 'F');
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(30, 27, 75);
      doc.rect(marginX, curY, contentWidth, 6.8, 'F');
      doc.setTextColor(255, 255, 255);
    }

    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(9);
    const weekTitle = `SEMANA DEL ${week.weekStartDate} AL ${week.weekEndDate}${
      week.specialEvent?.isSpecial ? `  •  [${week.specialEvent.title}]` : ''
    }`;
    doc.text(weekTitle, marginX + 3, curY + 4.7);

    curY += 9.5;

    // Check Special Event (no meetings at all)
    if (
      week.specialEvent?.isSpecial &&
      week.specialEvent.noMeetingMidweek &&
      week.specialEvent.noMeetingWeekend
    ) {
      doc.setTextColor(180, 83, 9);
      doc.setFont(fontFamily, 'bolditalic');
      doc.setFontSize(8.5);
      doc.text(
        `* Sin reuniones regulares en el Salón del Reino con motivo de ${week.specialEvent.title}.`,
        marginX + 3,
        curY + 2
      );
      curY += 8;
      return;
    }

    const printWrappedLine = (label: string, body: string, labelR = 30, labelG = 41, labelB = 59) => {
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(labelR, labelG, labelB);
      doc.text(label, marginX + 2, curY);

      const labelWidth = doc.getTextWidth(label) + 2;
      doc.setFont(fontFamily, 'normal');
      doc.setTextColor(51, 65, 85);
      const wrapped = doc.splitTextToSize(body, contentWidth - labelWidth - 4);
      doc.text(wrapped, marginX + 2 + labelWidth, curY);
      curY += Math.max(1, wrapped.length) * 4.2 + 0.8;
    };

    // 1. Midweek Section
    if (sections.midweek && !week.specialEvent?.noMeetingMidweek) {
      const midPres = getPub(week.midweek.presidentId);
      const midPrayers = `${getPub(week.midweek.initialPrayerId)} / ${getPub(week.midweek.finalPrayerId)}`;
      const midDisc = `${week.midweek.tesoros.discurso.title} (${getPub(week.midweek.tesoros.discurso.publisherId)})`;
      const midPerl = getPub(week.midweek.tesoros.perlas.publisherId);
      const midLect = getPub(week.midweek.tesoros.lecturaBiblia.publisherId);
      const maestrosSummary = week.midweek.maestros.items
        .map(
          m =>
            `${m.title}: ${getPub(m.publisherId)}${
              m.assistantId ? ` (Ayud: ${getPub(m.assistantId)})` : ''
            }`
        )
        .join(' • ');
      const cbsSummary = `Conductor: ${getPub(
        week.midweek.vidaCristiana.estudioBiblico.conductorId
      )} | Lector: ${getPub(week.midweek.vidaCristiana.estudioBiblico.lectorId)}`;

      printWrappedLine(
        `Vida y Ministerio (${week.midweek.date}):`,
        `Presidente: ${midPres} | Oración: ${midPrayers} | Tesoros: ${midDisc} | Perlas: ${midPerl} | Lectura: ${midLect}`,
        49,
        46,
        129
      );

      if (maestrosSummary) {
        printWrappedLine('Seamos Mejores Maestros:', `${maestrosSummary} | Estudio Bíblico: ${cbsSummary}`, 180, 83, 9);
      }
    }

    // 2. Weekend Section
    if (sections.weekend && !week.specialEvent?.noMeetingWeekend) {
      const fdsPres = getPub(week.weekend.presidentId);
      const speakerName = week.weekend.isVisitingSpeaker
        ? `${week.weekend.publicTalkSpeaker || '---'} (${week.weekend.visitingSpeakerCongregation || 'Visitante'})`
        : publishersMap.get(week.weekend.publicTalkSpeaker || '')?.name ||
          week.weekend.publicTalkSpeaker ||
          '---';
      const talkTitle = week.weekend.publicTalkTheme ? `"${week.weekend.publicTalkTheme}"` : '';
      const fdsCond = getPub(week.weekend.atalayaConductorId);
      const fdsLect = getPub(week.weekend.atalayaLectorId);

      printWrappedLine(
        `Fin de Semana (${week.weekend.date}):`,
        `Presidente: ${fdsPres} | Discurso: ${talkTitle} (${speakerName}) | Estudio La Atalaya: Conductor: ${fdsCond} / Lector: ${fdsLect}`,
        6,
        95,
        70
      );
    }

    // 3. Operational Duties Section
    if (sections.duties) {
      const audioVideo =
        Array.from(
          new Set([
            ...(week.midweek.duties.deber_audio || []),
            ...(week.midweek.duties.deber_video || []),
          ])
        )
          .map(id => publishersMap.get(id)?.name)
          .filter(Boolean)
          .join(', ') || '---';
      const mics =
        (week.midweek.duties.deber_microfonos || [])
          .map(id => publishersMap.get(id)?.name)
          .filter(Boolean)
          .join(', ') || '---';
      const attendants =
        (week.midweek.duties.deber_acomodador || [])
          .map(id => publishersMap.get(id)?.name)
          .filter(Boolean)
          .join(', ') || '---';

      printWrappedLine(
        'Deberes Operativos:',
        `Audio/Video: ${audioVideo} | Micrófonos: ${mics} | Acomodadores: ${attendants}`,
        71,
        85,
        105
      );
    }

    // 4. Cleaning Section
    if (sections.cleaning) {
      const cleanGroups = week.cleaningGroupNumbers.join(', #');
      doc.setFont(fontFamily, 'italic');
      doc.setFontSize(7.8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Limpieza del Salón del Reino: Grupo(s) #${cleanGroups}`, marginX + 2, curY);
      curY += 4.5;
    }

    // Subtle divider between weeks
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginX, curY, pageWidth - marginX, curY);
    curY += 4.5;
  });

  // Page numbering footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Kongre • ${settings.congregationName || 'Congregación'} • Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
}

export function generateProgramPdf(
  weeks: WeekSchedule[],
  publishersMap: Map<string, Publisher>,
  settings: CongregationSettings
) {
  const doc = buildProgramPdfDoc(weeks, publishersMap, settings);
  const safeName = (settings.congregationName || 'Congregacion').replace(/\s+/g, '_');
  const orientSuffix = settings.pdfOrientation === 'landscape' ? 'Horizontal' : 'Vertical';
  doc.save(`Programa_${safeName}_${orientSuffix}.pdf`);
}

export function generateProgramPdfBlobUrl(
  weeks: WeekSchedule[],
  publishersMap: Map<string, Publisher>,
  settings: CongregationSettings
): string {
  const doc = buildProgramPdfDoc(weeks, publishersMap, settings);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

export function buildS21PdfDoc(
  publisher: Publisher,
  serviceYear: string,
  monthlyReports: MonthlyServiceReport[],
  congregationName: string = 'Congregación',
  pageSize: 'letter' | 'a4' = 'letter',
  orientation: 'portrait' | 'landscape' = 'portrait'
): jsPDF {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize === 'letter' ? 'letter' : 'a4',
  });

  const card = buildS21CardForPublisher(publisher, serviceYear, monthlyReports);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 12;
  const contentW = pageWidth - marginX * 2;
  let curY = 10;

  // Header Box
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(marginX, curY, contentW, 15, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text(
    'REGISTRO DE PUBLICADOR DE LA CONGREGACIÓN (S-21)',
    marginX + contentW / 2,
    curY + 6.5,
    { align: 'center' }
  );
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${congregationName.toUpperCase()} • AÑO DE SERVICIO ${serviceYear} • FORMATO OFICIAL S-21`,
    marginX + contentW / 2,
    curY + 11.5,
    { align: 'center' }
  );
  curY += 19;

  // Personal Info Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, curY, contentW, 26, 2, 2, 'FD');

  const col1 = marginX + 4;
  const col2 = marginX + contentW * 0.52;

  // Row 1: Name & Service Group
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Nombre:', col1, curY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text((publisher.name || '---').substring(0, 36), col1 + 18, curY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Grupo de servicio:', col2, curY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(
    publisher.groupNumber ? `Grupo #${publisher.groupNumber}` : 'Sin grupo asignado',
    col2 + 30,
    curY + 5.5
  );

  // Row 2: Birth Date & Baptism Date
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Fec. nacimiento:', col1, curY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(publisher.birthDate || 'No registrada', col1 + 26, curY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Fec. bautismo:', col2, curY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(publisher.baptismDate || 'No registrado', col2 + 25, curY + 12);

  // Row 3: Hope / Gender & Privilege / Status
  const esperanza = publisher.hope === 'ungido' ? 'Ungido' : 'Otras ovejas';
  const genero = publisher.gender === 'female' ? 'Mujer' : 'Hombre';
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Esperanza / Sexo:', col1, curY + 18.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${esperanza} • ${genero}`, col1 + 28, curY + 18.5);

  const privilegio =
    publisher.pioneerStatus === 'especial'
      ? 'Precursor Especial'
      : publisher.pioneerStatus === 'regular'
      ? 'Precursor Regular'
      : publisher.spiritualStatus === 'anciano'
      ? 'Anciano'
      : publisher.spiritualStatus === 'siervo_ministerial'
      ? 'Siervo Ministerial'
      : 'Publicador';

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Condición / Privilegio:', col2, curY + 18.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text(privilegio, col2 + 34, curY + 18.5);

  curY += 30;

  // Monthly Table
  const thY = curY;
  const thH = 7.5;
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, thY, contentW, thH, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(marginX, thY, contentW, thH, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  const cMes = marginX + 3;
  const cPart = marginX + contentW * 0.22;
  const cHoras = marginX + contentW * 0.40;
  const cEst = marginX + contentW * 0.54;
  const cPrec = marginX + contentW * 0.68;
  const cNotas = marginX + contentW * 0.82;

  doc.text('Mes', cMes, thY + 5.2);
  doc.text('Participó', cPart, thY + 5.2);
  doc.text('Horas', cHoras, thY + 5.2);
  doc.text('Estudios', cEst, thY + 5.2);
  doc.text('P. Auxiliar', cPrec, thY + 5.2);
  doc.text('Notas / Observaciones', cNotas, thY + 5.2);

  curY += thH;

  // 12 Months Rows
  const rowH = orientation === 'landscape' ? 6.5 : 7.2;
  card.months.forEach((m, idx) => {
    const rY = curY + idx * rowH;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, rY, contentW, rowH, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, rY + rowH, marginX + contentW, rY + rowH);

    doc.setFontSize(7.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(m.monthName, cMes, rY + 4.8);

    doc.setFont('helvetica', 'normal');
    if (m.hasReport) {
      if (m.participated) {
        doc.setTextColor(16, 185, 129);
        doc.text('✓ Sí', cPart, rY + 4.8);
      } else {
        doc.setTextColor(239, 68, 68);
        doc.text('✗ No', cPart, rY + 4.8);
      }
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text('---', cPart, rY + 4.8);
    }

    doc.setTextColor(15, 23, 42);
    doc.text(
      m.hours !== undefined && m.hours > 0 ? String(m.hours) : m.participated ? '✓' : '---',
      cHoras,
      rY + 4.8
    );
    doc.text(m.bibleStudies > 0 ? String(m.bibleStudies) : m.hasReport ? '0' : '---', cEst, rY + 4.8);

    if (m.isAuxiliaryPioneer) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text('Sí', cPrec, rY + 4.8);
      doc.setFont('helvetica', 'normal');
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text('-', cPrec, rY + 4.8);
    }

    doc.setTextColor(71, 85, 105);
    const maxNoteLen = orientation === 'landscape' ? 40 : 25;
    const noteText = (m.notes || '').substring(0, maxNoteLen);
    doc.text(noteText, cNotas, rY + 4.8);
  });

  curY += card.months.length * rowH;

  // Totals Row
  doc.setFillColor(238, 242, 255);
  doc.rect(marginX, curY, contentW, 8.5, 'F');
  doc.setDrawColor(199, 210, 254);
  doc.rect(marginX, curY, contentW, 8.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(67, 56, 202);
  doc.text('TOTAL / PROMEDIO ANUAL', cMes, curY + 5.6);

  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`${card.totalMonthsActive} meses`, cPart, curY + 5.6);
  doc.text(card.totalHours > 0 ? `${card.totalHours} hrs` : '---', cHoras, curY + 5.6);
  doc.text(`Prom: ${card.avgStudiesPerMonth}`, cEst, curY + 5.6);
  doc.text(`${card.auxiliaryPioneerMonthsCount} m.`, cPrec, curY + 5.6);

  curY += 13;

  // Footer notes & status
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(marginX, curY, contentW, 20, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('NOTAS Y DISPOSICIONES ADICIONALES (SECRETARIO):', marginX + 3, curY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const contactInfo = publisher.phone ? `Tel: ${publisher.phone}` : 'Sin teléfono';
  const addressInfo = publisher.address ? ` • Dir: ${publisher.address}` : '';
  const emergencyInfo = publisher.emergencyContactName
    ? ` • Emergencia: ${publisher.emergencyContactName} (${publisher.emergencyContactPhone || 'sin tel'})`
    : '';
  doc.text(`${contactInfo}${addressInfo}${emergencyInfo}`.substring(0, 105), marginX + 3, curY + 10);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Formulario oficial S-21 para uso exclusivo de la congregación local. Información estrictamente confidencial.',
    marginX + 3,
    curY + 15
  );

  return doc;
}

export function generateS21Pdf(
  publisher: Publisher,
  serviceYear: string,
  monthlyReports: MonthlyServiceReport[],
  congregationName: string = 'Congregación',
  pageSize: 'letter' | 'a4' = 'letter',
  orientation: 'portrait' | 'landscape' = 'portrait'
) {
  const doc = buildS21PdfDoc(
    publisher,
    serviceYear,
    monthlyReports,
    congregationName,
    pageSize,
    orientation
  );
  const cleanName = (publisher.name || 'Publicador').replace(/[^a-zA-Z0-9ÁÉÍÓÚáéíóúÑñ_-]/g, '_');
  doc.save(`S21_${cleanName}_${serviceYear}.pdf`);
}

export function generateS21PdfBlobUrl(
  publisher: Publisher,
  serviceYear: string,
  monthlyReports: MonthlyServiceReport[],
  congregationName: string = 'Congregación',
  pageSize: 'letter' | 'a4' = 'letter',
  orientation: 'portrait' | 'landscape' = 'portrait'
): string {
  const doc = buildS21PdfDoc(
    publisher,
    serviceYear,
    monthlyReports,
    congregationName,
    pageSize,
    orientation
  );
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

