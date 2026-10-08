// src/utils/clmCounselorPdf.ts
import { jsPDF } from 'jspdf';
import type { ClmPrograma, Publisher, ClmParte } from '../types';
import { OFFICIAL_STUDENT_LESSONS } from './theocraticData';

export interface CounselorPdfOptions {
  congregationName?: string;
  programa: ClmPrograma;
  counselorName?: string;
  publishers?: Publisher[];
}

/**
 * Genera la Hoja de Trabajo y Evaluación para el Consejero de la Sala Auxiliar.
 * Incluye lista de estudiantes, ayudantes, lecciones del folleto Maestros,
 * espacio para observaciones teocráticas y casillas de evaluación.
 */
export function generateCounselorSheetPdf(options: CounselorPdfOptions) {
  const { congregationName = 'Congregación', programa, counselorName, publishers = [] } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Filtrar partes de la sala auxiliar
  const auxParts = (programa.partes || []).filter((p) => p.es_clase_auxiliar);
  const studentParts = auxParts.filter(
    (p) => p.seccion === 'maestros' || p.tipo === 'lectura_biblica'
  );

  // Consejero
  const counselorPart = auxParts.find((p) => p.tipo === 'conductor_auxiliar');
  const resolvedCounselorName =
    counselorName ||
    counselorPart?.asignado_nombre ||
    'Sin asignar';

  // ── CABECERA ──
  // Franja superior azul petróleo elegante
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, margin, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('VIDA Y MINISTERIO CRISTIANOS — SALA AUXILIAR', margin + 6, margin + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Congregación: ${congregationName}  |  Semana: ${programa.rango_semana || programa.semana_fecha}  |  Lectura: ${
      programa.lectura_semana || 'Biblia'
    }`,
    margin + 6,
    margin + 15
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(245, 158, 11); // amber-400
  doc.text(`CONSEJERO DE LA SALA AUXILIAR: ${resolvedCounselorName.toUpperCase()}`, margin + 6, margin + 21);

  // ── INSTRUCCIONES BREVES DE EVALUACIÓN S-38 ──
  let y = margin + 30;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('PAUTAS PARA EL CONSEJERO (S-38 / Folleto Maestros):', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Felicite calurosamente al estudiante por un aspecto positivo. Dé consejo constructivo en privado basado en el punto de oratoria.',
    margin + 4,
    y + 9.5
  );
  doc.text(
    'Al finalizar la reunión, indique al encargado si el estudiante completó la lección o debe repetirla, para actualizar la ficha S-38.',
    margin + 4,
    y + 13
  );

  y += 19;

  // ── LISTADO DE ESTUDIANTES / HOJAS DE CONSEJO ──
  if (studentParts.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('No hay asignaciones de estudiantes programadas en la Sala Auxiliar para esta semana.', margin + 4, y + 10);
  } else {
    studentParts.forEach((part, index) => {
      // Bloque para cada estudiante
      const blockHeight = 44;

      // Verificar si cabe en la página
      if (y + blockHeight > pageHeight - margin - 15) {
        doc.addPage();
        y = margin + 5;
      }

      // Caja de la parte
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.roundedRect(margin, y, contentWidth, blockHeight, 2, 2, 'FD');

      // Tira lateral de color según tipo
      const isReading = part.tipo === 'lectura_biblica';
      doc.setFillColor(isReading ? 202 : 99, isReading ? 138 : 102, isReading ? 4 : 241); // amber or indigo
      doc.rect(margin, y, 4, blockHeight, 'F');

      // Título y detalles
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${index + 1}. ${part.titulo} (${part.duracion_min} min)`, margin + 8, y + 6);

      // Lección asignada
      let lessonText = 'Sin lección asignada';
      if (part.leccion_numero) {
        const foundLesson = OFFICIAL_STUDENT_LESSONS.find((l) => l.number === part.leccion_numero);
        lessonText = `Lección ${part.leccion_numero}: ${foundLesson ? foundLesson.title : part.leccion_titulo || ''}`;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(180, 83, 9); // amber-700
      doc.text(`Punto de oratoria: ${lessonText}`, margin + 8, y + 11.5);

      // Estudiante y Ayudante
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`Estudiante: ${part.asignado_nombre || '_________________________________'}`, margin + 8, y + 17);

      if (part.asignado_auxiliar_nombre || part.seccion === 'maestros') {
        doc.text(
          `Ayudante: ${part.asignado_auxiliar_nombre || '_________________________________'}`,
          margin + 95,
          y + 17
        );
      }

      // Cuadrícula de apuntes para el consejo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Notas y observaciones para el consejo privado:', margin + 8, y + 23);

      doc.setDrawColor(226, 232, 240);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(margin + 8, y + 28, margin + contentWidth - 45, y + 28);
      doc.line(margin + 8, y + 34, margin + contentWidth - 45, y + 34);
      doc.line(margin + 8, y + 40, margin + contentWidth - 45, y + 40);
      doc.setLineDashPattern([], 0); // reset dash

      // Recuadro de resolución al final a la derecha
      const resX = margin + contentWidth - 42;
      const resY = y + 20;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(resX, resY, 38, 20, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text('EVALUACIÓN S-38:', resX + 2, resY + 4.5);

      // Casilla Completada
      doc.rect(resX + 3, resY + 7.5, 3.5, 3.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('Completada', resX + 8.5, resY + 10.2);

      // Casilla Repetir
      doc.rect(resX + 3, resY + 13.5, 3.5, 3.5);
      doc.text('Repetir lección', resX + 8.5, resY + 16.2);

      y += blockHeight + 4;
    });
  }

  // ── PIE DE PÁGINA Y FIRMA ──
  const footerY = pageHeight - margin - 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, margin + contentWidth, footerY);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Generado por Sistema de Gestión Teocrática VMC • Organizado', margin, footerY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Firma del Consejero Auxiliar: _________________________________', margin + contentWidth - 85, footerY + 5);

  // Descarga del PDF
  const filename = `Hoja_Consejero_Sala_Auxiliar_${programa.semana_fecha}.pdf`;
  doc.save(filename);
}
