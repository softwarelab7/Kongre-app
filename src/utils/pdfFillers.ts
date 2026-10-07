// src/utils/pdfFillers.ts
import { jsPDF } from 'jspdf';
import type { ClmPrograma, Publisher, ClmParte } from '../types';

/**
 * Genera el documento PDF con las hojas oficiales de asignación S-89 (4 por página)
 * para todas las partes de estudiantes asignadas en el programa VMC.
 */
export async function generateS89Pdf(programa: ClmPrograma, publishers: Publisher[]): Promise<void> {
  const studentParts = programa.partes.filter(
    (p) => p.seccion === 'maestros' && p.asignado_nombre
  );

  if (studentParts.length === 0) {
    alert('No hay asignaciones de estudiantes con publicador titular para generar hojas S-89.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const colWidth = (pageWidth - margin * 3) / 2; // ~90mm
  const rowHeight = (pageHeight - margin * 3) / 2; // ~133mm

  studentParts.forEach((part, index) => {
    const pageIndex = Math.floor(index / 4);
    const itemOnPage = index % 4;

    if (itemOnPage === 0 && pageIndex > 0) {
      doc.addPage();
    }

    const col = itemOnPage % 2;
    const row = Math.floor(itemOnPage / 2);

    const x = margin + col * (colWidth + margin);
    const y = margin + row * (rowHeight + margin);

    // Draw S-89 Slip Border
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, colWidth, rowHeight, 3, 3);

    // Header badge
    doc.setFillColor(155, 109, 23); // #9b6d17 ocre dorado de la sección maestros
    doc.roundedRect(x, y, colWidth, 12, 3, 3, 'F');
    doc.rect(x, y + 6, colWidth, 6, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('ASIGNACIÓN PARA LA REUNIÓN', x + colWidth / 2, y + 5.5, { align: 'center' });
    doc.setFontSize(8);
    doc.text('VIDA Y MINISTERIO CRISTIANOS (S-89)', x + colWidth / 2, y + 9.5, { align: 'center' });

    // Details box
    doc.setTextColor(30, 41, 59);
    let curY = y + 18;

    // Nombre
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Nombre:', x + 4, curY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(part.asignado_nombre || '—', x + 25, curY);
    doc.setDrawColor(220, 220, 220);
    doc.line(x + 24, curY + 1, x + colWidth - 4, curY + 1);

    // Ayudante
    curY += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Ayudante:', x + 4, curY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(part.asignado_auxiliar_nombre || '—', x + 25, curY);
    doc.setDrawColor(220, 220, 220);
    doc.line(x + 24, curY + 1, x + colWidth - 4, curY + 1);

    // Fecha
    curY += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Fecha:', x + 4, curY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(programa.rango_semana || programa.semana_fecha, x + 25, curY);
    doc.line(x + 24, curY + 1, x + colWidth - 4, curY + 1);

    // Intervención asignada
    curY += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Intervención asignada:', x + 4, curY);

    const partTypes = [
      { id: 'lectura_biblica', label: 'Lectura de la Biblia' },
      { id: 'empiece_conversaciones', label: 'Empiece conversaciones' },
      { id: 'haga_revisitas', label: 'Haga revisitas' },
      { id: 'haga_discipulos', label: 'Haga discípulos' },
      { id: 'explique_sus_creencias', label: 'Explique sus creencias' },
      { id: 'discurso_estudiante', label: 'Discurso' },
    ];

    curY += 5;
    for (const item of partTypes) {
      const isSelected =
        part.tipo === item.id ||
        (item.id === 'empiece_conversaciones' && part.tipo === 'empiece_conversaciones_aux') ||
        (item.id === 'haga_revisitas' && part.tipo === 'haga_revisitas_aux');

      // Checkbox
      doc.setDrawColor(120, 120, 120);
      doc.rect(x + 6, curY - 2.5, 3, 3);
      if (isSelected) {
        doc.setFillColor(155, 109, 23);
        doc.rect(x + 6.5, curY - 2, 2, 2, 'F');
      }

      doc.setFont('helvetica', isSelected ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(isSelected ? 0 : 70);
      doc.text(item.label, x + 12, curY);
      curY += 4.5;
    }

    // Sala
    curY += 3;
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Sala:', x + 4, curY);

    const isAux = Boolean(part.es_clase_auxiliar);
    // Principal box
    doc.rect(x + 20, curY - 2.5, 3, 3);
    if (!isAux) {
      doc.setFillColor(155, 109, 23);
      doc.rect(x + 20.5, curY - 2, 2, 2, 'F');
    }
    doc.setFont('helvetica', !isAux ? 'bold' : 'normal');
    doc.setFontSize(7.5);
    doc.text('Auditorio principal', x + 25, curY);

    // Auxiliar box
    doc.rect(x + 56, curY - 2.5, 3, 3);
    if (isAux) {
      doc.setFillColor(155, 109, 23);
      doc.rect(x + 56.5, curY - 2, 2, 2, 'F');
    }
    doc.setFont('helvetica', isAux ? 'bold' : 'normal');
    doc.setFontSize(7.5);
    doc.text('Sala auxiliar', x + 61, curY);

    // Título de la parte
    curY += 9;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text('DETALLES / TEMA:', x + 4, curY);
    curY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    const splitTitle = doc.splitTextToSize(part.titulo, colWidth - 8);
    doc.text(splitTitle, x + 4, curY);

    // Footer note
    doc.setFontSize(6);
    doc.setTextColor(140, 140, 140);
    doc.text(
      'Nota: Por favor avise con antelación si no puede atender su asignación.',
      x + colWidth / 2,
      y + rowHeight - 3,
      { align: 'center' }
    );
  });

  const fileName = `S-89_Semana_${programa.semana_fecha || 'VMC'}.pdf`;
  doc.save(fileName);
}
