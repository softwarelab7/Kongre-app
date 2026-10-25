// src/utils/accountsHelper.ts
import {
  AccountTransaction,
  AccountFund,
  TransactionCategory,
  QuarterlyAudit,
} from '../types';

export const FUND_LABELS: Record<AccountFund, string> = {
  gastos_locales: 'Gastos de la Congregación Local',
  obra_mundial: 'Obra Mundial (Donaciones)',
  construccion: 'Salones del Reino y Salones de Asambleas',
};

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  donaciones_cajas: 'Donaciones en Cajas de Contribución',
  donaciones_linea: 'Donaciones en Línea (donate.jw.org)',
  servicios_electricidad: 'Suministro Eléctrico',
  servicios_agua_gas: 'Agua Potable y Gas',
  servicios_internet: 'Internet y Transmisión / Teléfono',
  mantenimiento_reparaciones: 'Mantenimiento y Reparaciones',
  articulos_limpieza: 'Artículos de Limpieza y Baño',
  seguro_salon: 'Seguro de Responsabilidad del Salón',
  resolucion_apoyo_circuito: 'Resolución de Apoyo al Circuito',
  resolucion_obra_mundial: 'Resolución de Donación a la Obra Mundial',
  fondos_transferidos_sucursal: 'Fondos Transferidos a la Sucursal',
  otro: 'Otros Gastos / Imprevistos',
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export interface TransactionWithBalance extends AccountTransaction {
  runningBalance: number;
}

export interface MonthlyS26Summary {
  month: string; // YYYY-MM
  monthName: string;
  openingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  closingBalance: number;
  surplusOrDeficit: number;
  incomeByFund: Record<AccountFund, number>;
  expensesByFund: Record<AccountFund, number>;
  transactions: AccountTransaction[];
  transactionsWithRunningBalance: TransactionWithBalance[];
  verifiedCount: number;
  unverifiedCount: number;
  estimatedMonthlyOperatingExpense: number;
  recommendedOperatingReserve: number; // 2 meses de gastos operativos locales
  availableSurplusForBranch: number;
}

const MONTH_NAMES = [
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

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-');
  const idx = parseInt(m, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx > 11) return monthKey;
  return `${MONTH_NAMES[idx]} de ${y}`;
}

export function computeMonthlyS26(
  month: string,
  allTransactions: AccountTransaction[],
  baseOpeningBalance: number = 3250.0
): MonthlyS26Summary {
  // Sort transactions by date ascending, then by id for deterministic order
  const sorted = [...allTransactions].sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    return cmp !== 0 ? cmp : a.id.localeCompare(b.id);
  });

  // Compute opening balance from transactions prior to this month
  let cumulativeBalance = baseOpeningBalance;
  sorted.forEach((tx) => {
    if (tx.month < month) {
      if (tx.type === 'ingreso') cumulativeBalance += tx.amount;
      else cumulativeBalance -= tx.amount;
    }
  });

  const openingBalance = cumulativeBalance;

  // Filter transactions for target month
  const monthTxs = sorted.filter((tx) => tx.month === month);

  let totalIncome = 0;
  let totalExpenses = 0;
  let verifiedCount = 0;
  let unverifiedCount = 0;

  const incomeByFund: Record<AccountFund, number> = {
    gastos_locales: 0,
    obra_mundial: 0,
    construccion: 0,
  };

  const expensesByFund: Record<AccountFund, number> = {
    gastos_locales: 0,
    obra_mundial: 0,
    construccion: 0,
  };

  let running = openingBalance;
  const transactionsWithRunningBalance: TransactionWithBalance[] = monthTxs.map((tx) => {
    if (tx.type === 'ingreso') {
      totalIncome += tx.amount;
      incomeByFund[tx.fund] = (incomeByFund[tx.fund] || 0) + tx.amount;
      running += tx.amount;
    } else {
      totalExpenses += tx.amount;
      expensesByFund[tx.fund] = (expensesByFund[tx.fund] || 0) + tx.amount;
      running -= tx.amount;
    }

    if (tx.verified) verifiedCount++;
    else unverifiedCount++;

    return {
      ...tx,
      runningBalance: running,
    };
  });

  const closingBalance = openingBalance + totalIncome - totalExpenses;
  const surplusOrDeficit = totalIncome - totalExpenses;

  // Compute average monthly operating expenses (excluding branch transfers / resolutions)
  const operatingCategories: TransactionCategory[] = [
    'servicios_electricidad',
    'servicios_agua_gas',
    'servicios_internet',
    'mantenimiento_reparaciones',
    'articulos_limpieza',
    'seguro_salon',
    'otro',
  ];

  const monthOperatingExpenses = monthTxs
    .filter((tx) => tx.type === 'gasto' && operatingCategories.includes(tx.category))
    .reduce((acc, tx) => acc + tx.amount, 0);

  const estimatedMonthlyOperatingExpense =
    monthOperatingExpenses > 0 ? Math.max(monthOperatingExpenses, 420) : 550;
  const recommendedOperatingReserve = estimatedMonthlyOperatingExpense * 2;
  const availableSurplusForBranch = Math.max(
    0,
    closingBalance - recommendedOperatingReserve
  );

  return {
    month,
    monthName: formatMonthLabel(month),
    openingBalance,
    totalIncome,
    totalExpenses,
    closingBalance,
    surplusOrDeficit,
    incomeByFund,
    expensesByFund,
    transactions: monthTxs,
    transactionsWithRunningBalance,
    verifiedCount,
    unverifiedCount,
    estimatedMonthlyOperatingExpense,
    recommendedOperatingReserve,
    availableSurplusForBranch,
  };
}

export interface QuarterMonthBreakdown {
  monthKey: string;
  monthName: string;
  openingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  closingBalance: number;
  txCount: number;
  unverifiedCount: number;
}

export interface QuarterAuditMetrics {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  quarterTitle: string;
  effectiveMonths: string[];
  openingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  closingBalance: number;
  totalTransactions: number;
  verifiedTransactions: number;
  unverifiedTransactions: AccountTransaction[];
  monthlyBreakdown: QuarterMonthBreakdown[];
}

const QUARTER_TITLES: Record<'Q1' | 'Q2' | 'Q3' | 'Q4', string> = {
  Q1: '1.er Trimestre (Septiembre – Noviembre)',
  Q2: '2.º Trimestre (Diciembre – Febrero)',
  Q3: '3.er Trimestre (Marzo – Mayo)',
  Q4: '4.º Trimestre (Junio – Agosto)',
};

export function computeQuarterAuditMetrics(
  audit: QuarterlyAudit,
  allTransactions: AccountTransaction[],
  baseOpeningBalance: number = 3250.0
): QuarterAuditMetrics {
  // Determine effective months: if audit.monthsCovered has transactions, use it;
  // otherwise also check if transactions exist in matching MM suffixes
  const covered = audit.monthsCovered && audit.monthsCovered.length === 3
    ? audit.monthsCovered
    : ['2026-09', '2026-10', '2026-11'];

  const directMatches = allTransactions.filter((tx) => covered.includes(tx.month));
  let effectiveMonths = covered;

  if (directMatches.length === 0 && allTransactions.length > 0) {
    // Try matching month numbers (-09, -10, -11) with existing transaction years
    const suffixes = covered.map((m) => m.slice(5, 7));
    const remapped = suffixes.map((mm) => {
      const found = allTransactions.find((tx) => tx.month.endsWith(`-${mm}`));
      return found ? found.month : covered[suffixes.indexOf(mm)];
    });
    effectiveMonths = remapped;
  }

  const monthlyBreakdown: QuarterMonthBreakdown[] = effectiveMonths.map((mKey) => {
    const s = computeMonthlyS26(mKey, allTransactions, baseOpeningBalance);
    return {
      monthKey: mKey,
      monthName: s.monthName,
      openingBalance: s.openingBalance,
      totalIncome: s.totalIncome,
      totalExpenses: s.totalExpenses,
      closingBalance: s.closingBalance,
      txCount: s.transactions.length,
      unverifiedCount: s.unverifiedCount,
    };
  });

  const openingBalance =
    monthlyBreakdown.length > 0 ? monthlyBreakdown[0].openingBalance : baseOpeningBalance;
  const totalIncome = monthlyBreakdown.reduce((acc, m) => acc + m.totalIncome, 0);
  const totalExpenses = monthlyBreakdown.reduce((acc, m) => acc + m.totalExpenses, 0);
  const closingBalance = openingBalance + totalIncome - totalExpenses;

  const quarterTxs = allTransactions.filter((tx) => effectiveMonths.includes(tx.month));
  const verifiedTransactions = quarterTxs.filter((tx) => tx.verified).length;
  const unverifiedTransactions = quarterTxs.filter((tx) => !tx.verified);

  return {
    quarter: audit.quarter,
    quarterTitle: QUARTER_TITLES[audit.quarter] || audit.quarter,
    effectiveMonths,
    openingBalance,
    totalIncome,
    totalExpenses,
    closingBalance,
    totalTransactions: quarterTxs.length,
    verifiedTransactions,
    unverifiedTransactions,
    monthlyBreakdown,
  };
}

/**
 * Generates the official Form S-30 announcement text read from the platform to the congregation.
 */
export function generateS30AnnouncementText(
  congregationName: string,
  summary: MonthlyS26Summary
): string {
  const surplusText =
    summary.surplusOrDeficit >= 0
      ? `superávit neto de ${formatCurrency(summary.surplusOrDeficit)}`
      : `déficit de ${formatCurrency(Math.abs(summary.surplusOrDeficit))}`;

  return (
    `*INFORME DE CUENTAS DE LA CONGREGACIÓN (FORMULARIO S-30)*\n` +
    `Congregación: ${congregationName}\n` +
    `Mes correspondiente: ${summary.monthName}\n\n` +
    `Queridos hermanos, a continuación les presentamos el informe mensual de cuentas de la congregación:\n\n` +
    `1. *Saldo al inicio del mes:* ${formatCurrency(summary.openingBalance)}\n` +
    `2. *Contribuciones recibidas durante el mes:* ${formatCurrency(summary.totalIncome)}\n` +
    `   • Cajas de contribuciones y donaciones en línea.\n` +
    `3. *Gastos efectuados durante el mes:* ${formatCurrency(summary.totalExpenses)}\n` +
    `   • Servicios de electricidad, agua, internet, artículos de aseo y mantenimiento.\n` +
    `   • Resoluciones aprobadas de apoyo al circuito y a la obra mundial.\n` +
    `4. *Balance del mes:* Resultó en un ${surplusText}.\n` +
    `5. *Saldo disponible al cierre del mes:* ${formatCurrency(summary.closingBalance)}\n\n` +
    `El cuerpo de ancianos agradece sinceramente a la congregación por sus generosas contribuciones que permiten sostener el Salón del Reino y promover la adoración pura.`
  );
}

/**
 * Safe WhatsApp link dispatcher that avoids window.open to comply with iframe constraints.
 */
export function openSafeWhatsAppUrl(text: string, phone?: string): void {
  const cleanPhone = phone ? phone.replace(/[^\d+]/g, '').replace(/^\+/, '') : '';
  const encoded = encodeURIComponent(text);
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function triggerHiddenIframePrint(htmlContent: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  }, 300);
}

/**
 * Prints the Official Monthly Accounts Sheet (S-26) and Monthly Congregation Report (S-30) in A4 format.
 */
export function printMonthlyAccountsS26S30A4(
  congregationName: string,
  summary: MonthlyS26Summary,
  bankStatementBalance?: number | null,
  cashInBoxBalance: number = 0
): void {
  const rowsHtml =
    summary.transactionsWithRunningBalance.length === 0
      ? `<tr><td colspan="7" style="text-align:center;padding:14px;color:#64748b;">Sin movimientos registrados en este período.</td></tr>`
      : summary.transactionsWithRunningBalance
          .map(
            (tx) => `
        <tr>
          <td style="font-family:monospace;white-space:nowrap;">${tx.date}</td>
          <td>
            <strong>${tx.description}</strong>
            <div style="font-size:9px;color:#475569;">${CATEGORY_LABELS[tx.category] || tx.category}${
              tx.payerOrPayee ? ` • ${tx.payerOrPayee}` : ''
            }</div>
          </td>
          <td>${FUND_LABELS[tx.fund]}</td>
          <td style="font-family:monospace;">${tx.receiptNumber || '—'} ${
            tx.verified ? '✓' : '(Pend.)'
          }</td>
          <td style="text-align:right;color:#047857;font-weight:700;">
            ${tx.type === 'ingreso' ? formatCurrency(tx.amount) : ''}
          </td>
          <td style="text-align:right;color:#be123c;font-weight:700;">
            ${tx.type === 'gasto' ? formatCurrency(tx.amount) : ''}
          </td>
          <td style="text-align:right;font-weight:700;font-family:monospace;">
            ${formatCurrency(tx.runningBalance)}
          </td>
        </tr>`
          )
          .join('');

  const reconciledActual =
    typeof bankStatementBalance === 'number' && !isNaN(bankStatementBalance)
      ? bankStatementBalance + cashInBoxBalance
      : summary.closingBalance;
  const diff = reconciledActual - summary.closingBalance;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Hoja de Cuentas S-26 y S-30 - ${summary.monthName}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 0;
      font-size: 11px;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .subtitle { font-size: 11px; color: #334155; margin-top: 2px; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    .kpi-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px;
      background: #f8fafc;
    }
    .kpi-label { font-size: 9px; text-transform: uppercase; color: #475569; font-weight: 700; }
    .kpi-val { font-size: 14px; font-weight: 800; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 10px; }
    th, td { border: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; }
    th { background: #e2e8f0; font-size: 9px; text-transform: uppercase; letter-spacing: 0.4px; }
    .s30-box {
      border: 2px solid #0f172a;
      border-radius: 8px;
      padding: 12px 14px;
      margin-top: 14px;
      background: #ffffff;
    }
    .sig-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 32px;
      margin-top: 26px;
      text-align: center;
    }
    .sig-line {
      border-top: 1px solid #334155;
      padding-top: 4px;
      font-size: 10px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">HOJA DE CUENTAS DE LA CONGREGACIÓN (S-26)</div>
      <div class="subtitle">Congregación: <strong>${congregationName}</strong> • Período: <strong>${summary.monthName}</strong></div>
    </div>
    <div style="text-align:right;font-size:10px;color:#475569;">
      Comprobantes verificados: <strong>${summary.verifiedCount}/${summary.transactions.length}</strong>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-box">
      <div class="kpi-label">Saldo Inicial</div>
      <div class="kpi-val">${formatCurrency(summary.openingBalance)}</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Total Ingresos (+)</div>
      <div class="kpi-val" style="color:#047857;">+${formatCurrency(summary.totalIncome)}</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Total Egresos (-)</div>
      <div class="kpi-val" style="color:#be123c;">-${formatCurrency(summary.totalExpenses)}</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Saldo al Cierre</div>
      <div class="kpi-val" style="color:#1e40af;">${formatCurrency(summary.closingBalance)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:68px;">Fecha</th>
        <th>Concepto / Descripción</th>
        <th style="width:125px;">Fondo Teocrático</th>
        <th style="width:85px;">Recibo / Fact.</th>
        <th style="width:72px;text-align:right;">Ingreso (+)</th>
        <th style="width:72px;text-align:right;">Gasto (-)</th>
        <th style="width:80px;text-align:right;">Saldo Acum.</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-family:monospace;">${summary.month}-01</td>
        <td colspan="5"><strong>Saldo arrastrado al inicio del mes</strong></td>
        <td style="text-align:right;font-weight:700;font-family:monospace;">${formatCurrency(summary.openingBalance)}</td>
      </tr>
      ${rowsHtml}
    </tbody>
    <tfoot>
      <tr style="background:#f1f5f9;font-weight:800;">
        <td colspan="4" style="text-align:right;text-transform:uppercase;">Totales y Saldo Final del Mes:</td>
        <td style="text-align:right;color:#047857;">+${formatCurrency(summary.totalIncome)}</td>
        <td style="text-align:right;color:#be123c;">-${formatCurrency(summary.totalExpenses)}</td>
        <td style="text-align:right;color:#1e40af;font-family:monospace;">${formatCurrency(summary.closingBalance)}</td>
      </tr>
    </tfoot>
  </table>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
    <div style="border:1px solid #cbd5e1;border-radius:6px;padding:8px;">
      <div style="font-weight:800;font-size:10px;text-transform:uppercase;margin-bottom:4px;">Conciliación al Cierre del Mes</div>
      <div>Saldo en Libros (S-26): <strong>${formatCurrency(summary.closingBalance)}</strong></div>
      <div>Fondos Conciliados (Banco + Caja): <strong>${formatCurrency(reconciledActual)}</strong></div>
      <div>Diferencia: <strong>${formatCurrency(diff)}</strong></div>
    </div>
    <div style="border:1px solid #cbd5e1;border-radius:6px;padding:8px;">
      <div style="font-weight:800;font-size:10px;text-transform:uppercase;margin-bottom:4px;">Reserva Operativa y Excedente</div>
      <div>Reserva recomendada (2 meses): <strong>${formatCurrency(summary.recommendedOperatingReserve)}</strong></div>
      <div>Excedente sugerido para remitir: <strong>${formatCurrency(summary.availableSurplusForBranch)}</strong></div>
    </div>
  </div>

  <div class="s30-box">
    <div style="text-align:center;border-bottom:1px solid #94a3b8;padding-bottom:6px;margin-bottom:8px;">
      <div style="font-size:9px;text-transform:uppercase;color:#475569;font-weight:700;">Formulario S-30 • Tablero de Anuncios y Lectura a la Congregación</div>
      <div style="font-size:13px;font-weight:900;">INFORME MENSUAL DE CUENTAS DE LA CONGREGACIÓN (${summary.monthName.toUpperCase()})</div>
    </div>
    <p style="margin:4px 0;">Queridos hermanos: Nos complace presentarles el informe de las cuentas de la congregación correspondiente a <strong>${summary.monthName}</strong>:</p>
    <div style="margin:6px 0;padding-left:10px;border-left:2px solid #475569;">
      <div>1. Saldo al inicio del mes: <strong>${formatCurrency(summary.openingBalance)}</strong></div>
      <div>2. Contribuciones recibidas en el mes: <strong>+${formatCurrency(summary.totalIncome)}</strong></div>
      <div>3. Gastos y resoluciones efectuados: <strong>-${formatCurrency(summary.totalExpenses)}</strong></div>
      <div>4. Saldo disponible al cierre del mes: <strong>${formatCurrency(summary.closingBalance)}</strong></div>
    </div>
    <div class="sig-grid">
      <div class="sig-line">Firma del Siervo de Cuentas</div>
      <div class="sig-line">Firma del Coordinador del Cuerpo de Ancianos</div>
    </div>
  </div>
</body>
</html>`;

  triggerHiddenIframePrint(html);
}

/**
 * Prints the Official Quarterly Audit Report (Form S-25) in A4 format.
 */
export function printQuarterlyAuditS25A4(
  congregationName: string,
  audit: QuarterlyAudit,
  metrics: QuarterAuditMetrics
): void {
  const monthRows = metrics.monthlyBreakdown
    .map(
      (m) => `
      <tr>
        <td><strong>${m.monthName}</strong></td>
        <td style="text-align:right;font-family:monospace;">${formatCurrency(m.openingBalance)}</td>
        <td style="text-align:right;font-family:monospace;color:#047857;">+${formatCurrency(m.totalIncome)}</td>
        <td style="text-align:right;font-family:monospace;color:#be123c;">-${formatCurrency(m.totalExpenses)}</td>
        <td style="text-align:right;font-family:monospace;font-weight:700;">${formatCurrency(m.closingBalance)}</td>
        <td style="text-align:center;">${m.txCount} (${m.unverifiedCount === 0 ? '100% verif.' : `${m.unverifiedCount} pend.`})</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Informe de Auditoría de Cuentas S-25 - ${audit.quarter}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 0;
      font-size: 11px;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title { font-size: 17px; font-weight: 900; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10.5px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
    th { background: #e2e8f0; font-size: 9.5px; text-transform: uppercase; }
    .check-item {
      padding: 7px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      margin-bottom: 6px;
      background: #f8fafc;
    }
    .sig-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 38px;
      text-align: center;
    }
    .sig-line {
      border-top: 1px solid #334155;
      padding-top: 5px;
      font-size: 10px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">INFORME DE AUDITORÍA DE CUENTAS (FORMULARIO S-25)</div>
      <div style="margin-top:3px;color:#334155;">
        Congregación: <strong>${congregationName}</strong> • Año de Servicio: <strong>${audit.serviceYear}</strong> • Trimestre: <strong>${metrics.quarterTitle}</strong>
      </div>
    </div>
    <div style="text-align:right;font-size:10px;">
      Estado: <strong>${audit.isCompleted ? 'COMPLETADA Y FIRMADA' : 'EN REVISIÓN'}</strong><br/>
      Fecha: <strong>${audit.auditDate || 'Pendiente'}</strong>
    </div>
  </div>

  <div style="margin-bottom:12px;">
    <strong>Hermano Auditor Designado:</strong> ${audit.auditorName || 'Por asignar'}
  </div>

  <div style="font-weight:800;text-transform:uppercase;font-size:10px;margin-bottom:4px;">
    1. Resumen Contable de los Tres Meses Auditados (Hojas S-26)
  </div>
  <table>
    <thead>
      <tr>
        <th>Mes Auditado</th>
        <th style="text-align:right;">Saldo Inicial</th>
        <th style="text-align:right;">Ingresos (+)</th>
        <th style="text-align:right;">Egresos (-)</th>
        <th style="text-align:right;">Saldo Final</th>
        <th style="text-align:center;">Comprobantes</th>
      </tr>
    </thead>
    <tbody>
      ${monthRows}
    </tbody>
    <tfoot>
      <tr style="background:#f1f5f9;font-weight:800;">
        <td>Consolidado Trimestral (${audit.quarter})</td>
        <td style="text-align:right;font-family:monospace;">${formatCurrency(metrics.openingBalance)}</td>
        <td style="text-align:right;font-family:monospace;color:#047857;">+${formatCurrency(metrics.totalIncome)}</td>
        <td style="text-align:right;font-family:monospace;color:#be123c;">-${formatCurrency(metrics.totalExpenses)}</td>
        <td style="text-align:right;font-family:monospace;color:#1e40af;">${formatCurrency(metrics.closingBalance)}</td>
        <td style="text-align:center;">${metrics.verifiedTransactions}/${metrics.totalTransactions} verif.</td>
      </tr>
    </tfoot>
  </table>

  <div style="font-weight:800;text-transform:uppercase;font-size:10px;margin:14px 0 6px;">
    2. Lista de Verificación Oficial del Auditor (S-25)
  </div>
  <div class="check-item">
    <strong>[${audit.reviewedReceipts ? '✓' : ' '}]</strong> Se comprobaron todas las boletas de depósito, recibos de contribuciones, facturas de gastos y autorizaciones de pago de los tres meses.
  </div>
  <div class="check-item">
    <strong>[${audit.verifiedBankStatements ? '✓' : ' '}]</strong> Se cotejaron los extractos bancarios y el efectivo en caja con el saldo final registrado en cada Hoja de Cuentas S-26.
  </div>
  <div class="check-item">
    <strong>[${audit.checkedS30Announcements ? '✓' : ' '}]</strong> Se verificó que los informes mensuales S-30 fueron leídos a la congregación y fijados en el tablero de anuncios.
  </div>

  <div style="font-weight:800;text-transform:uppercase;font-size:10px;margin:14px 0 6px;">
    3. Observaciones y Conclusión del Auditor
  </div>
  <div style="border:1px solid #cbd5e1;border-radius:6px;padding:10px;min-height:48px;background:#f8fafc;">
    ${audit.findingsNotes || 'Los registros contables de la congregación se encuentran completos, exactos y debidamente respaldados por sus comprobantes.'}
  </div>

  <div class="sig-grid">
    <div class="sig-line">Firma del Auditor (${audit.auditorName || 'Auditor'})</div>
    <div class="sig-line">Firma del Siervo de Cuentas</div>
    <div class="sig-line">Coordinador del Cuerpo de Ancianos</div>
  </div>
</body>
</html>`;

  triggerHiddenIframePrint(html);
}
