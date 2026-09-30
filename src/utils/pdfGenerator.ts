// src/utils/pdfGenerator.ts
import { jsPDF } from 'jspdf';
import { WeekSchedule, Publisher, CongregationSettings } from '../types';

export function generateS89Pdf(
  week: WeekSchedule,
  publishersMap: Map<string, Publisher>,
  congregationName: string,
  pageSize: 'letter' | 'a4' = 'letter'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: pageSize === 'letter' ? 'letter' : 'a4',
  });

  const slips = week.midweek.maestros.items.filter(item => item.publisherId);
  if (slips.length === 0) {
    // Also include bible reading
    if (week.midweek.tesoros.lecturaBiblia.publisherId) {
      slips.unshift(week.midweek.tesoros.lecturaBiblia);
    }
  } else if (week.midweek.tesoros.lecturaBiblia.publisherId) {
    slips.unshift(week.midweek.tesoros.lecturaBiblia);
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 4 slips per page (2x2 grid)
  const slipW = (pageWidth - 20) / 2;
  const slipH = (pageHeight - 25) / 2;

  slips.forEach((item, index) => {
    if (index > 0 && index % 4 === 0) {
      doc.addPage();
    }

    const col = index % 2;
    const row = Math.floor((index % 4) / 2);
    const x = 7 + col * (slipW + 6);
    const y = 8 + row * (slipH + 6);

    const student = publishersMap.get(item.publisherId || '')?.name || 'Estudiante asignado';
    const assistant = item.assistantId ? publishersMap.get(item.assistantId)?.name || 'Ayudante asignado' : '---';

    // Outer border of S-89
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.4);
    doc.rect(x, y, slipW, slipH);

    // Header box
    doc.setFillColor(243, 244, 246);
    doc.rect(x, y, slipW, 14, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.line(x, y + 14, x + slipW, y + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('ASIGNACIÓN PARA LA REUNIÓN', x + slipW / 2, y + 6, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('VIDA Y MINISTERIO CRISTIANOS (S-89)', x + slipW / 2, y + 11, { align: 'center' });

    // Details body
    let curY = y + 21;
    doc.setFontSize(9);

    // Congregation & Date
    doc.setFont('helvetica', 'bold');
    doc.text('Congregación:', x + 4, curY);
    doc.setFont('helvetica', 'normal');
    doc.text(congregationName || 'Congregación local', x + 28, curY);

    curY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', x + 4, curY);
    doc.setFont('helvetica', 'normal');
    doc.text(week.midweek.date, x + 28, curY);

    curY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Estudiante:', x + 4, curY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(student, x + 28, curY);

    curY += 7;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Ayudante:', x + 4, curY);
    doc.setFont('helvetica', 'normal');
    doc.text(assistant, x + 28, curY);

    curY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Asignación:', x + 4, curY);
    doc.setFont('helvetica', 'normal');
    doc.text(item.title.substring(0, 32), x + 28, curY);

    curY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Sala:', x + 4, curY);
    doc.setFont('helvetica', 'normal');
    const roomText = item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal';
    doc.text(roomText, x + 28, curY);

    // Footer note
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Presente esta hoja a su consejero con su libro Guía.', x + slipW / 2, y + slipH - 4, { align: 'center' });
  });

  doc.save(`Hojas_S89_${week.weekStartDate}.pdf`);
}

export function generateProgramPdf(
  weeks: WeekSchedule[],
  publishersMap: Map<string, Publisher>,
  settings: CongregationSettings
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: settings.pdfPageSize === 'letter' ? 'letter' : 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(settings.congregationName || 'PROGRAMA DE ASIGNACIONES', pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Programa Mensual de Reuniones y Deberes - Generado el ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, 20, { align: 'center' });

  let curY = 28;

  weeks.forEach((week, wIdx) => {
    if (curY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      curY = 16;
    }

    // Week header bar
    doc.setFillColor(49, 46, 129); // Indigo 900
    doc.rect(10, curY, pageWidth - 20, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`SEMANA DEL ${week.weekStartDate} AL ${week.weekEndDate} ${week.specialEvent?.isSpecial ? `[${week.specialEvent.title}]` : ''}`, 14, curY + 5);

    curY += 10;

    // Check special event
    if (week.specialEvent?.isSpecial && week.specialEvent.noMeetingMidweek && week.specialEvent.noMeetingWeekend) {
      doc.setTextColor(180, 83, 9);
      doc.setFont('helvetica', 'bold');
      doc.text(`* Sin reuniones ordinarias esta semana: ${week.specialEvent.title}`, 14, curY + 2);
      curY += 8;
      return;
    }

    // Midweek block
    const midPres = publishersMap.get(week.midweek.presidentId || '')?.name || '---';
    const midDisc = publishersMap.get(week.midweek.tesoros.discurso.publisherId || '')?.name || '---';
    const midPerl = publishersMap.get(week.midweek.tesoros.perlas.publisherId || '')?.name || '---';
    const midLect = publishersMap.get(week.midweek.tesoros.lecturaBiblia.publisherId || '')?.name || '---';
    const audio = (week.midweek.duties.deber_audio || []).map(id => publishersMap.get(id)?.name).filter(Boolean).join(', ') || '---';
    const mics = (week.midweek.duties.deber_microfonos || []).map(id => publishersMap.get(id)?.name).filter(Boolean).join(', ') || '---';

    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    doc.setFont('helvetica', 'bold');
    doc.text(`Entre Semana (${week.midweek.date}):`, 12, curY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Pres: ${midPres} | Disc: ${midDisc} | Perlas: ${midPerl} | Lect: ${midLect} | Audio: ${audio} | Mics: ${mics}`, 58, curY);

    curY += 6;

    // Weekend block
    const fdsPres = publishersMap.get(week.weekend.presidentId || '')?.name || '---';
    const fdsLector = publishersMap.get(week.weekend.atalayaLectorId || '')?.name || '---';
    const fdsAudio = (week.weekend.duties.deber_audio || []).map(id => publishersMap.get(id)?.name).filter(Boolean).join(', ') || '---';
    const fdsMics = (week.weekend.duties.deber_microfonos || []).map(id => publishersMap.get(id)?.name).filter(Boolean).join(', ') || '---';

    doc.setFont('helvetica', 'bold');
    doc.text(`Fin de Semana (${week.weekend.date}):`, 12, curY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Pres: ${fdsPres} | Lector Atalaya: ${fdsLector} | Discurso: ${week.weekend.publicTalkSpeaker || '---'} | Audio: ${fdsAudio} | Mics: ${fdsMics}`, 58, curY);

    curY += 6;

    // Cleaning group
    const cleanGroups = week.cleaningGroupNumbers.join(', ');
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(75, 85, 99);
    doc.text(`Limpieza Salón del Reino: Grupo(s) #${cleanGroups}`, 12, curY);

    curY += 9;
  });

  doc.save(`Programa_Congregacion_${settings.congregationName.replace(/\s+/g, '_')}.pdf`);
}
