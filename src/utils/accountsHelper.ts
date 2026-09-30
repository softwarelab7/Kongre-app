// src/utils/accountsHelper.ts
import { AccountTransaction, AccountFund, TransactionCategory } from '../types';

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
}

export function computeMonthlyS26(
  month: string,
  allTransactions: AccountTransaction[],
  baseOpeningBalance: number = 3250.0
): MonthlyS26Summary {
  // Sort transactions by date ascending
  const sorted = [...allTransactions].sort((a, b) => a.date.localeCompare(b.date));

  // Find all transactions prior to this month to compute actual opening balance
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

  monthTxs.forEach((tx) => {
    if (tx.type === 'ingreso') {
      totalIncome += tx.amount;
      incomeByFund[tx.fund] = (incomeByFund[tx.fund] || 0) + tx.amount;
    } else {
      totalExpenses += tx.amount;
      expensesByFund[tx.fund] = (expensesByFund[tx.fund] || 0) + tx.amount;
    }
  });

  const closingBalance = openingBalance + totalIncome - totalExpenses;
  const surplusOrDeficit = totalIncome - totalExpenses;

  const [y, m] = month.split('-');
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const monthName = `${monthNames[parseInt(m, 10) - 1]} de ${y}`;

  return {
    month,
    monthName,
    openingBalance,
    totalIncome,
    totalExpenses,
    closingBalance,
    surplusOrDeficit,
    incomeByFund,
    expensesByFund,
    transactions: monthTxs,
  };
}

/**
 * Generates the official Form S-30 announcement text read from the platform to the congregation.
 */
export function generateS30AnnouncementText(
  congregationName: string,
  summary: MonthlyS26Summary
): string {
  const surplusText = summary.surplusOrDeficit >= 0
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
