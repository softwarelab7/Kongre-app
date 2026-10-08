// src/utils/clmBillboardPdf.ts
import { jsPDF } from 'jspdf';
import type { ClmPrograma, Publisher, ClmParte } from '../types';

export interface BillboardPdfOptions {
  congregationName: string;
  year: number;
  month: number; // 0-indexed (0 = Enero, 11 = Diciembre)
  programas: ClmPrograma[];
  publishersMap?: Map<string, Publisher>;
}

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/**
 * Obtiene las fechas (formato YYYY-MM-DD) de todos los lunes de un mes
 */
export function getMondaysInMonth(year: number, month: number): string[] {
  const mondays: string[] = [];
  const date = new Date(year, month, 1);

  // Buscar primer lunes
  while (date.getDay() !== 1) {
    date.setDate(date.getDate() + 1);
  }

  // Avanzar de 7 en 7 días mientras siga en el mes o comience esa semana
  while (date.getMonth() === month) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    mondays.push(`${y}-${m}-${d}`);
    date.setDate(date.getDate() + 7);
  }

  return mondays;
}

/**
 * Genera el documento PDF horizontal (Landscape) oficial para la Cartelera de Anuncios
 * del Salón del Reino con todas las semanas del mes.
 */
export function generateMonthlyBillboardPdf(options: BillboardPdfOptions): void {
  const { congregationName, year, month, programas } = options;
  const monthName = MONTH_NAMES_ES[month];

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 8;
  const contentWidth = pageWidth - margin * 2; // ~281mm

  // ── CABECERA GENERAL DEL CARTEL ──
  // Fondo barra superior
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, margin, contentWidth, 16, 'F');

  // Textos cabecera
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(
    `PROGRAMA DE LA REUNIÓN VIDA Y MINISTERIO CRISTIANOS`,
    margin + contentWidth / 2,
    margin + 6.5,
    { align: 'center' }
  );

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `CONGREGACIÓN ${congregationName.toUpperCase()} — ${monthName.toUpperCase()} DE ${year}`,
    margin + contentWidth / 2,
    margin + 12,
    { align: 'center' }
  );

  // ── COLUMNAS DE LAS SEMANAS (4 o 5 SEMANAS) ──
  const numWeeks = Math.max(1, Math.min(5, programas.length));
  const colGap = 3;
  const colWidth = (contentWidth - colGap * (numWeeks - 1)) / numWeeks;
  const topY = margin + 18;
  const colHeight = pageHeight - topY - margin - 5; // ~179mm

  programas.slice(0, numWeeks).forEach((prog, colIndex) => {
    const colX = margin + colIndex * (colWidth + colGap);

    // Contorno columna de semana
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);
    doc.roundedRect(colX, topY, colWidth, colHeight, 2, 2);

    // Cabecera de la semana (Fondo gris)
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(colX, topY, colWidth, 12, 2, 2, 'F');
    doc.rect(colX, topY + 6, colWidth, 6, 'F');

    // Título de la semana
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const dateLabel = prog.rango_semana || `Semana ${prog.semana_fecha}`;
    doc.text(dateLabel, colX + colWidth / 2, topY + 5, {
      align: 'center',
      maxWidth: colWidth - 2,
    });

    // Marco de la reunión: Presidente y Oración
    const presPart = prog.partes.find((p) => p.tipo === 'presidente');
    const presName = presPart?.asignado_nombre || '---';

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Pres: ${presName}`, colX + colWidth / 2, topY + 9.5, {
      align: 'center',
      maxWidth: colWidth - 2,
    });

    let currentY = topY + 14;

    // Helper para dibujar bloque de sección
    const renderSectionHeader = (
      title: string,
      bgColor: [number, number, number]
    ) => {
      doc.setFillColor(...bgColor);
      doc.rect(colX + 1, currentY, colWidth - 2, 4.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text(title, colX + colWidth / 2, currentY + 3.2, { align: 'center' });
      currentY += 5.5;
    };

    // Helper para dibujar fila de asignación
    const renderPartRow = (
      label: string,
      assignedName: string,
      detail?: string,
      isAuxRoom: boolean = false
    ) => {
      if (currentY > topY + colHeight - 8) return; // Evitar desborde

      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);

      const displayLabel = isAuxRoom ? `[Aux] ${label}` : label;
      const cleanLabel = doc.splitTextToSize(displayLabel, colWidth - 4)[0];
      doc.text(cleanLabel, colX + 2, currentY + 2.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(15, 23, 42);

      const nameText = assignedName ? `• ${assignedName}` : '• (Sin asignar)';
      doc.text(nameText, colX + 3, currentY + 5.5);

      if (detail) {
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(5.5);
        const detailShort = doc.splitTextToSize(detail, colWidth - 5)[0];
        doc.text(detailShort, colX + 3, currentY + 8.2);
        currentY += 9.5;
      } else {
        currentY += 7;
      }
    };

    // ── 1. TESOROS DE LA BIBLIA ──
    renderSectionHeader('TESOROS DE LA BIBLIA', [42, 107, 119]); // #2a6b77

    const tesorosParts = prog.partes.filter((p) => p.seccion === 'tesoros');
    tesorosParts.forEach((tp) => {
      const shortTitle = tp.tipo === 'discurso_tesoros'
        ? 'Discurso (10 min)'
        : tp.tipo === 'busquemos_perlas'
        ? 'Perlas escondidas (10 min)'
        : 'Lectura de la Biblia (4 min)';
      renderPartRow(shortTitle, tp.asignado_nombre || '', undefined, tp.es_clase_auxiliar);
    });

    currentY += 1.5;

    // ── 2. SEAMOS MEJORES MAESTROS ──
    renderSectionHeader('SEAMOS MEJORES MAESTROS', [155, 109, 23]); // #9b6d17

    const maestrosParts = prog.partes.filter((p) => p.seccion === 'maestros');
    maestrosParts.forEach((mp) => {
      let label = mp.titulo;
      if (label.length > 28) label = label.substring(0, 26) + '...';

      let assignedString = mp.asignado_nombre || '(Sin asignar)';
      if (mp.asignado_auxiliar_nombre) {
        assignedString += ` / ${mp.asignado_auxiliar_nombre}`;
      }

      const lessonNote = mp.leccion_numero ? `Lección #${mp.leccion_numero}` : undefined;
      renderPartRow(label, assignedString, lessonNote, mp.es_clase_auxiliar);
    });

    currentY += 1.5;

    // ── 3. NUESTRA VIDA CRISTIANA ──
    renderSectionHeader('NUESTRA VIDA CRISTIANA', [148, 41, 38]); // #942926

    const vidaParts = prog.partes.filter(
      (p) => p.seccion === 'vida_cristiana' && p.tipo !== 'canto'
    );
    vidaParts.forEach((vp) => {
      let label = vp.titulo;
      if (label.length > 28) label = label.substring(0, 26) + '...';
      renderPartRow(label, vp.asignado_nombre || '');
    });

    // Consejero Sala Auxiliar si existe
    const auxCounselor = prog.partes.find((p) => p.tipo === 'conductor_auxiliar');
    if (auxCounselor?.asignado_nombre) {
      currentY += 1.5;
      doc.setFillColor(254, 243, 199); // amber-100
      doc.rect(colX + 1, currentY, colWidth - 2, 6, 'F');
      doc.setTextColor(146, 64, 14); // amber-800
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.text('Consejero Sala Auxiliar:', colX + 2, currentY + 2.5);
      doc.setFont('helvetica', 'normal');
      doc.text(auxCounselor.asignado_nombre, colX + 2, currentY + 4.8);
    }
  });

  // ── PIE DE PÁGINA ──
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(
    `Tablero Oficial de Anuncios del Salón del Reino • Vida y Ministerio Cristianos • Generado el ${new Date().toLocaleDateString('es-ES')}`,
    margin,
    pageHeight - 3.5
  );
  doc.text(
    `Página 1 de 1 • Cartelera Oficial`,
    pageWidth - margin,
    pageHeight - 3.5,
    { align: 'right' }
  );

  // Descarga directa
  const fileName = `Cartelera_VMC_${monthName}_${year}.pdf`;
  doc.save(fileName);
}
