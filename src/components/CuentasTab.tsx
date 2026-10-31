// src/components/CuentasTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import {
  AccountTransaction,
  AccountFund,
  TransactionCategory,
  TransactionType,
  QuarterlyAudit,
} from '../types';
import {
  formatCurrency,
  computeMonthlyS26,
  computeQuarterAuditMetrics,
  generateS30AnnouncementText,
  openSafeWhatsAppUrl,
  printMonthlyAccountsS26S30A4,
  printQuarterlyAuditS25A4,
  FUND_LABELS,
  CATEGORY_LABELS,
} from '../utils/accountsHelper';
import {
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  FileSpreadsheet,
  Check,
  Calendar,
  MessageCircle,
  Search,
  FileCheck,
  ShieldCheck,
  Calculator,
  Send,
  Upload,
} from 'lucide-react';
import { SplashCheckbox } from './SplashCheckbox';
import { LocalOfficialFormsModal } from './LocalOfficialFormsCenter';
import {
  OfficialFormCode,
  getLocalOfficialFormBytes,
  fillOfficialS26Pdf,
  fillOfficialS30Pdf,
  fillOfficialS25Pdf,
  downloadPdfBytesLocally,
} from '../services/localOfficialFormsService';

export const CuentasTab: React.FC = () => {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    quarterlyAudits,
    updateQuarterlyAudit,
    settings,
  } = useCongregation();

  // Selected Month (Default to latest transaction month or '2026-09')
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (transactions.length > 0) {
      const months = Array.from(new Set(transactions.map((t) => t.month))).sort();
      return months[months.length - 1] || '2026-09';
    }
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  // Active sub-tab: 's26' | 's30' | 'auditorias'
  const [activeSubTab, setActiveSubTab] = useState<'s26' | 's30' | 'auditorias'>('s26');

  // Filters for S-26 table
  const [filterFund, setFilterFund] = useState<AccountFund | 'todos'>('todos');
  const [filterType, setFilterType] = useState<TransactionType | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & UI feedback
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<AccountTransaction | null>(null);
  const [copiedS30, setCopiedS30] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmDeleteTxId, setConfirmDeleteTxId] = useState<string | null>(null);

  // Bank & Cash reconciliation inputs
  const [bankStatementBalance, setBankStatementBalance] = useState<string>('');
  const [cashInBoxBalance, setCashInBoxBalance] = useState<string>('0');

  // Form for transaction
  const [txForm, setTxForm] = useState<{
    date: string;
    type: TransactionType;
    fund: AccountFund;
    category: TransactionCategory;
    description: string;
    amount: string;
    receiptNumber: string;
    payerOrPayee: string;
    paymentMethod: 'efectivo' | 'transferencia' | 'cheque';
    verified: boolean;
    notes: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    type: 'ingreso',
    fund: 'gastos_locales',
    category: 'donaciones_cajas',
    description: '',
    amount: '',
    receiptNumber: '',
    payerOrPayee: '',
    paymentMethod: 'efectivo',
    verified: true,
    notes: '',
  });

  // Audit edit modal state
  const [editingAudit, setEditingAudit] = useState<QuarterlyAudit | null>(null);
  const [officialFormModalCode, setOfficialFormModalCode] = useState<OfficialFormCode | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Computed S-26 for selected month
  const s26 = useMemo(() => {
    return computeMonthlyS26(selectedMonth, transactions);
  }, [selectedMonth, transactions]);

  // Filtered transactions in selected month (preserving runningBalance from s26)
  const filteredTransactions = useMemo(() => {
    return s26.transactionsWithRunningBalance.filter((tx) => {
      const matchesFund = filterFund === 'todos' || tx.fund === filterFund;
      const matchesType = filterType === 'todos' || tx.type === filterType;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        tx.description.toLowerCase().includes(q) ||
        (tx.receiptNumber && tx.receiptNumber.toLowerCase().includes(q)) ||
        (tx.payerOrPayee && tx.payerOrPayee.toLowerCase().includes(q));

      return matchesFund && matchesType && matchesQuery;
    });
  }, [s26.transactionsWithRunningBalance, filterFund, filterType, searchQuery]);

  // Bank + Cash reconciliation calculation
  const parsedBank = parseFloat(bankStatementBalance);
  const parsedCash = parseFloat(cashInBoxBalance) || 0;
  const totalReconciledFunds = !isNaN(parsedBank) ? parsedBank + parsedCash : null;
  const reconciliationDiff =
    totalReconciledFunds !== null ? totalReconciledFunds - s26.closingBalance : null;

  // Handlers for Transaction Form
  const handleOpenAddTx = (type: TransactionType = 'ingreso') => {
    setEditingTx(null);
    setFormError(null);
    setTxForm({
      date: `${selectedMonth}-15`,
      type,
      fund: 'gastos_locales',
      category: type === 'ingreso' ? 'donaciones_cajas' : 'servicios_electricidad',
      description: '',
      amount: '',
      receiptNumber: '',
      payerOrPayee: '',
      paymentMethod: type === 'ingreso' ? 'efectivo' : 'transferencia',
      verified: true,
      notes: '',
    });
    setIsTxModalOpen(true);
  };

  const handleOpenSurplusResolutionTx = () => {
    const suggested = Math.round(s26.availableSurplusForBranch * 100) / 100;
    setEditingTx(null);
    setFormError(null);
    setTxForm({
      date: `${selectedMonth}-28`,
      type: 'gasto',
      fund: 'gastos_locales',
      category: 'resolucion_obra_mundial',
      description: `Resolución mensual de excedente de fondos remitido a la Obra Mundial (${s26.monthName})`,
      amount: suggested > 0 ? String(suggested) : '',
      receiptNumber: `RES-${selectedMonth}`,
      payerOrPayee: 'Sucursal / Obra Mundial',
      paymentMethod: 'transferencia',
      verified: true,
      notes: 'Aprobado mediante resolución de la congregación',
    });
    setIsTxModalOpen(true);
  };

  const handleOpenEditTx = (tx: AccountTransaction) => {
    setEditingTx(tx);
    setFormError(null);
    setTxForm({
      date: tx.date,
      type: tx.type,
      fund: tx.fund,
      category: tx.category,
      description: tx.description,
      amount: String(tx.amount),
      receiptNumber: tx.receiptNumber || '',
      payerOrPayee: tx.payerOrPayee || '',
      paymentMethod: tx.paymentMethod,
      verified: tx.verified,
      notes: tx.notes || '',
    });
    setIsTxModalOpen(true);
  };

  const handleSaveTx = () => {
    const parsedAmount = parseFloat(txForm.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Por favor ingrese un monto válido mayor a € 0,00.');
      return;
    }
    if (!txForm.description.trim()) {
      setFormError('Por favor describa el concepto o motivo del movimiento contable.');
      return;
    }

    const txMonth = txForm.date.slice(0, 7);

    if (editingTx) {
      updateTransaction({
        ...editingTx,
        date: txForm.date,
        month: txMonth,
        type: txForm.type,
        fund: txForm.fund,
        category: txForm.category,
        description: txForm.description.trim(),
        amount: parsedAmount,
        receiptNumber: txForm.receiptNumber.trim() || undefined,
        payerOrPayee: txForm.payerOrPayee.trim() || undefined,
        paymentMethod: txForm.paymentMethod,
        verified: txForm.verified,
        notes: txForm.notes.trim() || undefined,
      });
      showToast('Movimiento contable actualizado en la Hoja S-26.');
    } else {
      addTransaction({
        date: txForm.date,
        month: txMonth,
        type: txForm.type,
        fund: txForm.fund,
        category: txForm.category,
        description: txForm.description.trim(),
        amount: parsedAmount,
        receiptNumber: txForm.receiptNumber.trim() || undefined,
        payerOrPayee: txForm.payerOrPayee.trim() || undefined,
        paymentMethod: txForm.paymentMethod,
        verified: txForm.verified,
        notes: txForm.notes.trim() || undefined,
      });
      showToast('Nuevo movimiento registrado en la Hoja S-26.');
    }

    setFormError(null);
    setIsTxModalOpen(false);
  };

  const handleToggleVerified = (tx: AccountTransaction) => {
    updateTransaction({
      ...tx,
      verified: !tx.verified,
    });
    showToast(
      !tx.verified
        ? `Comprobante verificado: ${tx.receiptNumber || tx.description}`
        : `Comprobante marcado como pendiente: ${tx.receiptNumber || tx.description}`
    );
  };

  const handleVerifyAllMonthVouchers = () => {
    s26.transactions.forEach((tx) => {
      if (!tx.verified) {
        updateTransaction({ ...tx, verified: true });
      }
    });
    showToast(`Todos los comprobantes de ${s26.monthName} han sido marcados como verificados.`);
  };

  // Copy S-30 announcement text
  const handleCopyS30 = () => {
    const text = generateS30AnnouncementText(settings.congregationName, s26);
    navigator.clipboard.writeText(text);
    setCopiedS30(true);
    showToast('Texto oficial del anuncio S-30 copiado al portapapeles.');
    setTimeout(() => setCopiedS30(false), 2500);
  };

  const handleShareWhatsAppS30 = () => {
    const text = generateS30AnnouncementText(settings.congregationName, s26);
    openSafeWhatsAppUrl(text);
  };

  const handleDownloadOfficialAccountsPdf = async (code: 'S-26' | 'S-30' | 'S-25') => {
    try {
      const stored = await getLocalOfficialFormBytes(code);
      if (!stored) {
        setOfficialFormModalCode(code);
        return;
      }
      if (code === 'S-26') {
        const filledBytes = await fillOfficialS26Pdf(stored.bytes, selectedMonth, transactions, settings);
        downloadPdfBytesLocally(
          filledBytes,
          `S-26_Oficial_Relleno_${selectedMonth}_${settings.congregationName.replace(/\s+/g, '_')}.pdf`
        );
      } else if (code === 'S-30') {
        const filledBytes = await fillOfficialS30Pdf(stored.bytes, selectedMonth, transactions, settings);
        downloadPdfBytesLocally(
          filledBytes,
          `S-30_Oficial_Relleno_${selectedMonth}_${settings.congregationName.replace(/\s+/g, '_')}.pdf`
        );
      } else {
        const filledBytes = await fillOfficialS25Pdf(stored.bytes, quarterlyAudits, settings);
        downloadPdfBytesLocally(
          filledBytes,
          `S-25_Oficial_Relleno_${settings.congregationName.replace(/\s+/g, '_')}.pdf`
        );
      }
      showToast(`PDF Oficial ${code} rellenado y descargado con los datos contables.`);
    } catch {
      setOfficialFormModalCode(code);
    }
  };

  const handleSaveAuditModal = () => {
    if (!editingAudit) return;
    updateQuarterlyAudit(editingAudit);
    showToast(`Auditoría ${editingAudit.quarter} (${editingAudit.serviceYear}) actualizada.`);
    setEditingAudit(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="bg-emerald-950 text-emerald-100 border border-emerald-700/60 px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between text-xs font-semibold animate-fadeIn no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-emerald-300 hover:text-white text-xs font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra Unificada de Sub-pestañas y Acciones de Cuentas */}
      <div className="bg-white dark:bg-[#121216] p-3.5 sm:p-4 rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-2xs flex flex-col gap-3 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Sub-tab Navigation - 3 columns on mobile so nothing is cut off */}
          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 bg-zinc-100 dark:bg-[#18181F] p-1.5 rounded-xl border border-zinc-200/70 dark:border-[#27272A]">
            <button
              onClick={() => setActiveSubTab('s26')}
              className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSubTab === 's26'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#27272A]'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Hoja S-26</span>
            </button>

            <button
              onClick={() => setActiveSubTab('s30')}
              className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSubTab === 's30'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#27272A]'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Anuncio S-30</span>
            </button>

            <button
              onClick={() => setActiveSubTab('auditorias')}
              className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSubTab === 'auditorias'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#27272A]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Auditoría S-25</span>
            </button>
          </div>

          {/* Month Selector & Action Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <div className="flex items-center justify-center gap-1.5 bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl px-3 py-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA]">Mes:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 focus:outline-hidden cursor-pointer"
              />
            </div>

            <button
              onClick={() =>
                handleDownloadOfficialAccountsPdf(
                  activeSubTab === 's30' ? 'S-30' : activeSubTab === 'auditorias' ? 'S-25' : 'S-26'
                )
              }
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-zinc-200/80 dark:border-[#27272A] rounded-xl bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] text-xs font-bold transition cursor-pointer active:scale-95"
              title="Cargar el PDF oficial (S-26, S-30 o S-25) para que la app lo rellene y descargue"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate">
                PDF {activeSubTab === 's30' ? 'S-30' : activeSubTab === 'auditorias' ? 'S-25' : 'S-26'} Oficial
              </span>
            </button>

            <button
              onClick={() => handleOpenAddTx('ingreso')}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Ingreso</span>
            </button>

            <button
              onClick={() => handleOpenAddTx('gasto')}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Gasto</span>
            </button>
          </div>
        </div>

        {/* Voucher verification status bar */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-[#27272A] text-xs">
          <span className="text-zinc-500 dark:text-[#A1A1AA] font-medium">Estado de comprobantes del mes:</span>
          {s26.unverifiedCount > 0 ? (
            <button
              onClick={handleVerifyAllMonthVouchers}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-zinc-800 dark:text-zinc-200 font-bold transition cursor-pointer"
              title="Marcar todos los recibos y facturas del mes como verificados"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span><span className="font-mono tabular-nums">{s26.unverifiedCount}</span> sin verificar • Verificar todos</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-zinc-300 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Al día (<span className="font-mono tabular-nums">{s26.verifiedCount}/{s26.transactions.length}</span>)</span>
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards (Financial Balance) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 no-print">
        <div className="bg-white dark:bg-[#121216] p-4 rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-2xs">
          <span className="text-[10px] sm:text-xs font-bold text-zinc-500 dark:text-[#A1A1AA] block uppercase truncate">
            Saldo Inicial ({s26.monthName})
          </span>
          <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
            {formatCurrency(s26.openingBalance)}
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block mt-0.5">Al primer día del mes</span>
        </div>

        <div className="bg-white dark:bg-[#121216] p-4 rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-2xs">
          <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 block uppercase flex items-center justify-between">
            <span>Ingresos del Mes</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </span>
          <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(s26.totalIncome)}
          </span>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-500 block mt-0.5">
            Cajas y donate.jw.org
          </span>
        </div>

        <div className="bg-white dark:bg-[#121216] p-4 rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-2xs">
          <span className="text-[10px] sm:text-xs font-bold text-rose-600 dark:text-rose-400 block uppercase flex items-center justify-between">
            <span>Egresos del Mes</span>
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
          </span>
          <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-rose-600 dark:text-rose-400">
            -{formatCurrency(s26.totalExpenses)}
          </span>
          <span className="text-[11px] text-rose-700 dark:text-rose-500 block mt-0.5">
            Servicios y mantenimiento
          </span>
        </div>

        <div className="bg-white dark:bg-[#121216] p-4 rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-2xs">
          <span className="text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 block uppercase">
            Saldo Final Disponible
          </span>
          <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
            {formatCurrency(s26.closingBalance)}
          </span>
          <span className="text-[11px] text-indigo-700 dark:text-indigo-400 block mt-0.5 font-semibold font-mono tabular-nums">
            {s26.surplusOrDeficit >= 0
              ? `+${formatCurrency(s26.surplusOrDeficit)} neto`
              : `${formatCurrency(s26.surplusOrDeficit)} déficit`}
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: HOJA MENSUAL DE CUENTAS (FORMULARIO S-26)           */}
      {/* ============================================================== */}
      {activeSubTab === 's26' && (
        <div className="space-y-6">
          {/* Fund Breakdown & Surplus Resolution Calculator */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 no-print">
            {/* Breakdown by Fund */}
            <div className="lg:col-span-2 bg-white dark:bg-[#121216] p-4 rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-[#A1A1AA]">
                  Desglose Mensual por Fondos Teocráticos (S-26)
                </h3>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                  Ingresos vs Egresos por destino
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {(['gastos_locales', 'obra_mundial', 'construccion'] as AccountFund[]).map(
                  (fundKey) => {
                    const inc = s26.incomeByFund[fundKey] || 0;
                    const exp = s26.expensesByFund[fundKey] || 0;
                    return (
                      <div
                        key={fundKey}
                        className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] space-y-1.5"
                      >
                        <span className="font-bold text-zinc-800 dark:text-[#F4F4F5] block text-[11px] truncate">
                          {FUND_LABELS[fundKey]}
                        </span>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500 dark:text-[#A1A1AA]">Recibido (+):</span>
                          <span className="font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(inc)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500 dark:text-[#A1A1AA]">Remitido / Gasto (-):</span>
                          <span className="font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">{formatCurrency(exp)}</span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Surplus & Resolution Calculator */}
            <div className="bg-indigo-950 dark:bg-indigo-950/70 text-white p-4 rounded-2xl border border-indigo-800 dark:border-indigo-800/80 shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Reserva y Excedente (S-26)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-900 text-indigo-200 font-semibold">
                    Reserva 2 meses
                  </span>
                </div>
                <div className="pt-1 flex items-baseline justify-between">
                  <span className="text-xs text-indigo-200">Reserva recomendada:</span>
                  <span className="text-sm font-bold font-mono tabular-nums text-white">
                    {formatCurrency(s26.recommendedOperatingReserve)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-indigo-200">Excedente disponible:</span>
                  <span className="text-lg font-black font-mono tabular-nums text-emerald-400">
                    {formatCurrency(s26.availableSurplusForBranch)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleOpenSurplusResolutionTx}
                className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Registrar Resolución de Excedente</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white dark:bg-[#121216] p-3.5 rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 no-print">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por concepto, factura, proveedor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-[#18181F] focus:bg-white dark:focus:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl text-zinc-900 dark:text-[#F4F4F5] placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <select
                value={filterFund}
                onChange={(e) => setFilterFund(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl font-bold text-zinc-700 dark:text-[#F4F4F5] cursor-pointer focus:outline-hidden"
              >
                <option value="todos">Todos los Fondos</option>
                <option value="gastos_locales">Gastos Locales</option>
                <option value="obra_mundial">Obra Mundial</option>
                <option value="construccion">Salones del Reino</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl font-bold text-zinc-700 dark:text-[#F4F4F5] cursor-pointer focus:outline-hidden"
              >
                <option value="todos">Ingresos y Gastos</option>
                <option value="ingreso">Solo Ingresos (+)</option>
                <option value="gasto">Solo Gastos (-)</option>
              </select>
            </div>
          </div>

          {/* Transactions Table (Official S-26 Format) */}
          <div className="bg-white dark:bg-[#121216] border border-zinc-300 dark:border-[#27272A] rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 bg-zinc-800 dark:bg-[#18181F] text-white flex items-center justify-between border-b border-zinc-700 dark:border-[#27272A]">
              <div>
                <h3 className="font-bold text-sm tracking-wide uppercase">
                  Hoja de Cuentas S-26 • {s26.monthName}
                </h3>
                <p className="text-xs text-zinc-300 dark:text-[#A1A1AA] font-medium">
                  <span className="font-mono tabular-nums">{filteredTransactions.length}</span> movimientos registrados en el período
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block uppercase font-bold">
                  Saldo al Cierre
                </span>
                <span className="text-base font-black font-mono tabular-nums text-emerald-400">
                  {formatCurrency(s26.closingBalance)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#A1A1AA] uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-[#27272A]">
                    <th className="p-3 font-bold w-24">Fecha</th>
                    <th className="p-3 font-bold">Concepto / Descripción</th>
                    <th className="p-3 font-bold w-36">Fondo Teocrático</th>
                    <th className="p-3 font-bold w-32">Recibo / Verif.</th>
                    <th className="p-3 font-bold w-28 text-right">Monto</th>
                    <th className="p-3 font-bold w-28 text-right">Saldo Acum.</th>
                    <th className="p-3 font-bold w-24 text-right no-print">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-[#27272A]">
                  {/* Opening Balance Row */}
                  <tr className="bg-zinc-50/70 dark:bg-[#18181F]/40 text-zinc-600 dark:text-[#A1A1AA]">
                    <td className="p-3 font-mono tabular-nums text-[11px] font-bold">{selectedMonth}-01</td>
                    <td className="p-3 font-bold text-zinc-700 dark:text-[#F4F4F5]" colSpan={4}>
                      Saldo arrastrado al inicio de {s26.monthName}
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums font-bold text-zinc-800 dark:text-[#F4F4F5]">
                      {formatCurrency(s26.openingBalance)}
                    </td>
                    <td className="no-print"></td>
                  </tr>

                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                        No hay movimientos registrados para este mes con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-[#18181F]/70 transition">
                        <td className="p-3 font-mono tabular-nums text-zinc-700 dark:text-[#A1A1AA] font-bold whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-zinc-900 dark:text-[#F4F4F5]">{tx.description}</p>
                          <p className="text-[11px] text-zinc-500 dark:text-[#71717A]">
                            {CATEGORY_LABELS[tx.category] || tx.category}
                            {tx.payerOrPayee ? ` • ${tx.payerOrPayee}` : ''} •{' '}
                            <span className="capitalize">{tx.paymentMethod}</span>
                          </p>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]">
                            {FUND_LABELS[tx.fund]}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleVerified(tx)}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A] transition cursor-pointer"
                              title={
                                tx.verified
                                  ? 'Comprobante verificado (clic para cambiar)'
                                  : 'Pendiente de verificar (clic para verificar)'
                              }
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${tx.verified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <span className="font-mono tabular-nums">{tx.receiptNumber || (tx.verified ? 'Verif.' : 'Pend.')}</span>
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-right font-extrabold whitespace-nowrap">
                          <span
                            className={`font-mono tabular-nums ${
                              tx.type === 'ingreso'
                                ? 'text-emerald-600 dark:text-emerald-400 font-black'
                                : 'text-rose-600 dark:text-rose-400 font-black'
                            }`}
                          >
                            {tx.type === 'ingreso' ? '+' : '-'} {formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono tabular-nums font-bold text-zinc-700 dark:text-[#A1A1AA] whitespace-nowrap">
                          {formatCurrency(tx.runningBalance)}
                        </td>
                        <td className="p-3 text-right no-print">
                          {confirmDeleteTxId === tx.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  deleteTransaction(tx.id);
                                  setConfirmDeleteTxId(null);
                                  showToast('Movimiento eliminado de la Hoja S-26.');
                                }}
                                className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                              >
                                Sí
                              </button>
                              <button
                                onClick={() => setConfirmDeleteTxId(null)}
                                className="px-1.5 py-0.5 bg-zinc-200 dark:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] rounded text-[10px] font-bold hover:bg-zinc-300 cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditTx(tx)}
                                className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                                title="Editar movimiento"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteTxId(tx.id)}
                                className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                                title="Eliminar movimiento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* S-26 Month Footer */}
                <tfoot>
                  <tr className="bg-zinc-100 dark:bg-[#18181F] font-extrabold text-zinc-900 dark:text-[#F4F4F5] border-t-2 border-zinc-300 dark:border-[#27272A]">
                    <td colSpan={4} className="p-3 uppercase tracking-wider text-right">
                      Total Ingresos (+) / Total Egresos (-) / Saldo al Cierre
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums text-xs">
                      <div className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(s26.totalIncome)}</div>
                      <div className="text-rose-600 dark:text-rose-400">-{formatCurrency(s26.totalExpenses)}</div>
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums text-sm font-black text-indigo-700 dark:text-indigo-400">
                      {formatCurrency(s26.closingBalance)}
                    </td>
                    <td className="no-print"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Bank & Cash Reconciliation Card */}
          <div className="bg-white dark:bg-[#121216] p-5 rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-4 no-print">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm flex items-center gap-2">
                <Landmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Conciliación de Extracto Bancario y Caja ({s26.monthName})</span>
              </h3>
              <span className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Verificación oficial del saldo en libros S-26 frente a banco y efectivo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 bg-zinc-50 dark:bg-[#18181F] rounded-xl border border-zinc-200 dark:border-[#27272A] space-y-1">
                <span className="text-[10px] text-zinc-400 dark:text-[#A1A1AA] uppercase font-bold block">
                  1. Saldo en Libros S-26
                </span>
                <p className="text-lg font-black font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                  {formatCurrency(s26.closingBalance)}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-500">Calculado según movimientos</p>
              </div>

              <div className="p-3.5 bg-zinc-50 dark:bg-[#18181F] rounded-xl border border-zinc-200 dark:border-[#27272A] space-y-1">
                <span className="text-[10px] text-zinc-600 dark:text-[#A1A1AA] uppercase font-bold block">
                  2. Extracto Bancario (€):
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej. 3500.00"
                    value={bankStatementBalance}
                    onChange={(e) => setBankStatementBalance(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white dark:bg-[#121216] border border-zinc-300 dark:border-[#27272A] rounded-lg text-xs font-bold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5] focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-500">Saldo final cuenta bancaria</p>
              </div>

              <div className="p-3.5 bg-zinc-50 dark:bg-[#18181F] rounded-xl border border-zinc-200 dark:border-[#27272A] space-y-1">
                <span className="text-[10px] text-zinc-600 dark:text-[#A1A1AA] uppercase font-bold block">
                  3. Efectivo en Caja / Tránsito (€):
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cashInBoxBalance}
                    onChange={(e) => setCashInBoxBalance(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white dark:bg-[#121216] border border-zinc-300 dark:border-[#27272A] rounded-lg text-xs font-bold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5] focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-500">Depósitos en tránsito o caja</p>
              </div>

              <div
                className={`p-3.5 rounded-xl border space-y-1 ${
                  reconciliationDiff === null
                    ? 'bg-zinc-50 dark:bg-[#18181F] border-zinc-200 dark:border-[#27272A] text-zinc-500 dark:text-[#A1A1AA]'
                    : Math.abs(reconciliationDiff) < 0.01
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/50 text-rose-900 dark:text-rose-300'
                }`}
              >
                <span className="text-[10px] uppercase font-bold block">
                  4. Estado de Conciliación
                </span>
                {reconciliationDiff === null ? (
                  <p className="text-xs font-medium">
                    Ingrese el extracto bancario (<span className="font-mono tabular-nums">{formatCurrency(s26.closingBalance)}</span> esperado)
                  </p>
                ) : Math.abs(reconciliationDiff) < 0.01 ? (
                  <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>¡Conciliación Exacta (€ 0,00)!</span>
                  </div>
                ) : (
                  <div className="space-y-0.5 text-rose-700 dark:text-rose-400 font-bold">
                    <p className="flex items-center gap-1 text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Diferencia detectada:</span>
                    </p>
                    <p className="text-base font-black font-mono tabular-nums">
                      {formatCurrency(reconciliationDiff)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: INFORME PARA LA CONGREGACIÓN (FORMULARIO S-30)       */}
      {/* ============================================================== */}
      {activeSubTab === 's30' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between no-print flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5]">
                Informe Mensual de Cuentas para la Congregación (S-30)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Texto oficial que se lee a la congregación en la reunión de entre semana correspondiente a {s26.monthName}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyS30}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 dark:bg-[#18181F] hover:bg-zinc-800 dark:hover:bg-[#27272A] text-white rounded-xl text-xs font-bold border border-transparent dark:border-[#27272A] shadow-xs transition cursor-pointer"
              >
                {copiedS30 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Texto S-30</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShareWhatsAppS30}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </button>

              <button
                onClick={() => handleDownloadOfficialAccountsPdf('S-30')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Cargar / Rellenar S-30 Oficial (PDF)</span>
              </button>
            </div>
          </div>

          {/* S-30 Printable Formal Card */}
          <div className="bg-white dark:bg-[#121216] border-2 border-zinc-800 dark:border-[#27272A] print:bg-white print:border-zinc-800 p-6 sm:p-8 rounded-2xl shadow-lg max-w-3xl mx-auto space-y-6">
            <div className="border-b-2 border-zinc-800 dark:border-[#27272A] print:border-zinc-800 pb-4 text-center space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-[#A1A1AA] font-bold block">
                Formulario Oficial S-30
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] print:text-zinc-900 tracking-wider uppercase font-serif">
                INFORME DE CUENTAS PARA LA CONGREGACIÓN
              </h2>
              <p className="text-xs font-semibold text-zinc-700 dark:text-[#A1A1AA] print:text-zinc-700">
                Congregación: <strong className="text-zinc-900 dark:text-[#F4F4F5] print:text-zinc-900">{settings.congregationName}</strong> • Mes:{' '}
                <strong className="text-zinc-900 dark:text-[#F4F4F5] print:text-zinc-900">{s26.monthName}</strong>
              </p>
            </div>

            <div className="space-y-4 text-xs text-zinc-800 dark:text-zinc-200 print:text-zinc-800 leading-relaxed font-sans">
              <p className="italic text-zinc-600 dark:text-[#A1A1AA] print:text-zinc-600">
                (Nota para el hermano que lee el informe: Lea este anuncio durante la reunión de entre semana en el tiempo asignado para anuncios locales y luego fíjelo en el tablero de anuncios).
              </p>

              <div className="p-4 bg-zinc-50 dark:bg-[#18181F] border border-zinc-300 dark:border-[#27272A] print:bg-zinc-50 print:border-zinc-300 rounded-xl space-y-3 font-serif text-sm text-zinc-900 dark:text-[#F4F4F5] print:text-zinc-900">
                <p>
                  Queridos hermanos: Nos complace presentarles el informe de las cuentas de la congregación correspondiente al mes de <strong>{s26.monthName}</strong>:
                </p>

                <div className="space-y-2 border-l-2 border-zinc-400 dark:border-[#3F3F46] print:border-zinc-400 pl-4 my-3 text-xs font-sans">
                  <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-[#27272A] print:border-zinc-200">
                    <span className="text-zinc-600 dark:text-[#A1A1AA] print:text-zinc-600">1. Saldo al inicio del mes:</span>
                    <strong className="text-zinc-900 dark:text-[#F4F4F5] print:text-zinc-900 font-mono tabular-nums">{formatCurrency(s26.openingBalance)}</strong>
                  </div>

                  <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-[#27272A] print:border-zinc-200">
                    <span className="text-zinc-600 dark:text-[#A1A1AA] print:text-zinc-600">
                      2. Contribuciones recibidas (Cajas y en línea):
                    </span>
                    <strong className="text-emerald-700 dark:text-emerald-400 print:text-emerald-700 font-mono tabular-nums">+{formatCurrency(s26.totalIncome)}</strong>
                  </div>

                  <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-[#27272A] print:border-zinc-200">
                    <span className="text-zinc-600 dark:text-[#A1A1AA] print:text-zinc-600">
                      3. Gastos efectuados (Servicios, mantenimiento y resoluciones):
                    </span>
                    <strong className="text-rose-700 dark:text-rose-400 print:text-rose-700 font-mono tabular-nums">-{formatCurrency(s26.totalExpenses)}</strong>
                  </div>

                  <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-[#27272A] print:border-zinc-200">
                    <span className="text-zinc-600 dark:text-[#A1A1AA] print:text-zinc-600">4. Balance neto del período:</span>
                    <strong
                      className={`font-mono tabular-nums ${
                        s26.surplusOrDeficit >= 0 ? 'text-emerald-700 dark:text-emerald-400 print:text-emerald-700' : 'text-rose-700 dark:text-rose-400 print:text-rose-700'
                      }`}
                    >
                      {s26.surplusOrDeficit >= 0 ? 'Superávit de ' : 'Déficit de '}
                      {formatCurrency(Math.abs(s26.surplusOrDeficit))}
                    </strong>
                  </div>

                  <div className="flex justify-between py-1.5 pt-2 text-sm font-bold bg-zinc-100 dark:bg-[#27272A] print:bg-zinc-100 px-2 rounded">
                    <span className="text-zinc-900 dark:text-[#F4F4F5] print:text-zinc-900">5. Saldo disponible al cierre del mes:</span>
                    <span className="text-indigo-800 dark:text-indigo-300 print:text-indigo-800 font-mono tabular-nums">{formatCurrency(s26.closingBalance)}</span>
                  </div>
                </div>

                <p className="text-zinc-700 dark:text-zinc-300 print:text-zinc-700">
                  El cuerpo de ancianos desea expresar su sincero agradecimiento a toda la congregación por su espíritu generoso y su fiel apoyo material, el cual permite cubrir los gastos del Salón del Reino y promover la predicación mundial de las buenas noticias.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-300 dark:border-[#27272A] print:border-zinc-300 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-zinc-400 dark:border-[#3F3F46] print:border-zinc-400 pt-2 space-y-0.5">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold block">
                    Preparado por:
                  </span>
                  <p className="font-semibold text-zinc-700 dark:text-zinc-200 print:text-zinc-700">Siervo de Cuentas</p>
                </div>
                <div className="border-t border-zinc-400 dark:border-[#3F3F46] print:border-zinc-400 pt-2 space-y-0.5">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold block">
                    Aprobado por:
                  </span>
                  <p className="font-semibold text-zinc-700 dark:text-zinc-200 print:text-zinc-700">
                    Coordinador del Cuerpo de Ancianos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 3: AUDITORÍAS TRIMESTRALES (FORMULARIO S-25)           */}
      {/* ============================================================== */}
      {activeSubTab === 'auditorias' && (
        <div className="space-y-6 no-print">
          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 p-4 rounded-2xl space-y-1">
            <h3 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
              <span>Asistente de Auditoría Trimestral de Cuentas (Formulario S-25)</span>
            </h3>
            <p className="text-xs text-indigo-800 dark:text-indigo-300/80">
              Cada 3 meses, el Coordinador del Cuerpo de Ancianos organiza una auditoría de los registros financieros (Sep–Nov, Dic–Feb, Mar–May, Jun–Ago). El asistente cruza automáticamente los saldos e ingresos/egresos de las Hojas S-26 de cada trimestre.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quarterlyAudits.map((audit) => {
              const metrics = computeQuarterAuditMetrics(audit, transactions);
              const allChecked =
                audit.reviewedReceipts &&
                audit.verifiedBankStatements &&
                audit.checkedS30Announcements;

              return (
                <div
                  key={audit.id}
                  className="bg-white dark:bg-[#121216] p-5 rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg font-mono font-black text-xs bg-zinc-900 dark:bg-[#27272A] text-white">
                          {audit.quarter}
                        </span>
                        <div>
                          <h4 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm">
                            {metrics.quarterTitle}
                          </h4>
                          <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">
                            Año de Servicio {audit.serviceYear}
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]">
                        <span className={`w-1.5 h-1.5 rounded-full ${audit.isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {audit.isCompleted ? 'Firmada y Completada' : 'En Revisión'}
                      </span>
                    </div>

                    {/* Auditor Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-[#18181F] p-3 rounded-xl border border-zinc-200 dark:border-[#27272A]">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block">
                          Hermano Auditor:
                        </span>
                        <strong className="text-zinc-800 dark:text-zinc-200">{audit.auditorName}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block">
                          Fecha de Cierre S-25:
                        </span>
                        <strong className="text-zinc-800 dark:text-zinc-200 font-mono tabular-nums">
                          {audit.auditDate || 'Pendiente de firma'}
                        </strong>
                      </div>
                    </div>

                    {/* Automatic Quarter S-26 Financial Cross-Check */}
                    <div className="border border-zinc-200 dark:border-[#27272A] rounded-xl overflow-hidden text-[11px]">
                      <div className="bg-zinc-100 dark:bg-[#18181F] px-3 py-1.5 font-bold text-zinc-700 dark:text-[#A1A1AA] flex items-center justify-between border-b border-zinc-200 dark:border-[#27272A]">
                        <span>Consolidado Contable del Trimestre (S-26)</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-500 font-mono tabular-nums">
                          {metrics.verifiedTransactions}/{metrics.totalTransactions} comprobantes verif.
                        </span>
                      </div>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-[#27272A] text-[10px] text-zinc-500 dark:text-zinc-500 uppercase">
                            <th className="py-1.5 px-2.5">Mes</th>
                            <th className="py-1.5 px-2 text-right">Ingresos</th>
                            <th className="py-1.5 px-2 text-right">Egresos</th>
                            <th className="py-1.5 px-2.5 text-right">Cierre</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-[#27272A]">
                          {metrics.monthlyBreakdown.map((m) => (
                            <tr key={m.monthKey} className="hover:bg-zinc-50/50 dark:hover:bg-[#18181F]/50">
                              <td className="py-1.5 px-2.5 font-medium text-zinc-700 dark:text-zinc-300">
                                {m.monthName}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                                +{formatCurrency(m.totalIncome)}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono tabular-nums text-rose-700 dark:text-rose-400">
                                -{formatCurrency(m.totalExpenses)}
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-mono tabular-nums font-bold text-zinc-800 dark:text-[#F4F4F5]">
                                {formatCurrency(m.closingBalance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Audit Checklist Items */}
                    <div className="flex flex-col gap-2 pt-1 text-xs text-zinc-700 dark:text-[#A1A1AA]">
                      <SplashCheckbox
                        size="sm"
                        checked={audit.reviewedReceipts}
                        onChange={(e) =>
                          updateQuarterlyAudit({ ...audit, reviewedReceipts: e.target.checked })
                        }
                        label="Facturas, autorizaciones y recibos de donación comprobados"
                      />

                      <SplashCheckbox
                        size="sm"
                        checked={audit.verifiedBankStatements}
                        onChange={(e) =>
                          updateQuarterlyAudit({
                            ...audit,
                            verifiedBankStatements: e.target.checked,
                          })
                        }
                        label="Extractos bancarios y conciliación mensual cotejados"
                      />

                      <SplashCheckbox
                        size="sm"
                        checked={audit.checkedS30Announcements}
                        onChange={(e) =>
                          updateQuarterlyAudit({
                            ...audit,
                            checkedS30Announcements: e.target.checked,
                          })
                        }
                        label="Informes S-30 leídos y fijados en el tablero verificados"
                      />
                    </div>

                    {audit.findingsNotes && (
                      <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-200 italic">
                        "{audit.findingsNotes}"
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between gap-2">
                    <button
                      onClick={() => setEditingAudit(audit)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] font-bold text-xs border border-zinc-200/80 dark:border-[#27272A] transition inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar / Firmar S-25</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {!audit.isCompleted && allChecked && (
                        <button
                          onClick={() => {
                            updateQuarterlyAudit({
                              ...audit,
                              isCompleted: true,
                              auditDate:
                                audit.auditDate || new Date().toISOString().split('T')[0],
                            });
                            showToast(`Auditoría ${audit.quarter} marcada como completada.`);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Cerrar S-25</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDownloadOfficialAccountsPdf('S-25')}
                        className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                        title="Cargar el PDF oficial S-25 para que la app lo rellene y descargue"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>PDF S-25 Oficial</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* AUDIT EDIT / SIGN MODAL (FORMULARIO S-25)                      */}
      {/* ============================================================== */}
      {editingAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#121216] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 dark:border-[#27272A] space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#27272A] pb-3">
              <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>
                  Configurar y Firmar Auditoría {editingAudit.quarter} ({editingAudit.serviceYear})
                </span>
              </h3>
              <button
                onClick={() => setEditingAudit(null)}
                className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-[#F4F4F5] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">
                  Hermano Auditor Designado:
                </label>
                <input
                  type="text"
                  value={editingAudit.auditorName}
                  onChange={(e) =>
                    setEditingAudit({ ...editingAudit, auditorName: e.target.value })
                  }
                  placeholder="Nombre del anciano o siervo ministerial auditor"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] placeholder-zinc-400 dark:placeholder-zinc-500 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">
                    Fecha de Auditoría:
                  </label>
                  <input
                    type="date"
                    value={editingAudit.auditDate || ''}
                    onChange={(e) =>
                      setEditingAudit({ ...editingAudit, auditDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs font-semibold font-mono tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">
                    Estado del Informe S-25:
                  </label>
                  <select
                    value={editingAudit.isCompleted ? 'completada' : 'pendiente'}
                    onChange={(e) =>
                      setEditingAudit({
                        ...editingAudit,
                        isCompleted: e.target.value === 'completada',
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="pendiente">En Revisión / Pendiente</option>
                    <option value="completada">Firmada y Completada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">
                  Observaciones y Conclusiones del Auditor:
                </label>
                <textarea
                  rows={3}
                  value={editingAudit.findingsNotes || ''}
                  onChange={(e) =>
                    setEditingAudit({ ...editingAudit, findingsNotes: e.target.value })
                  }
                  placeholder="Ej. Se revisaron todas las boletas de depósito y facturas sin encontrar discrepancias..."
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] placeholder-zinc-400 dark:placeholder-zinc-500 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-[#27272A]">
              <button
                onClick={() => setEditingAudit(null)}
                className="px-3.5 py-2 text-xs text-zinc-600 dark:text-[#A1A1AA] font-semibold rounded-xl border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-100 dark:hover:bg-[#18181F] cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAuditModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
              >
                Guardar Auditoría S-25
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TRANSACTION MODAL (ADD / EDIT)                                 */}
      {/* ============================================================== */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#121216] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 dark:border-[#27272A] space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#27272A] pb-3">
              <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {editingTx ? 'Editar Movimiento Contable' : 'Registrar Nuevo Movimiento'}
                </span>
              </h3>
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-[#F4F4F5] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">Tipo:</label>
                  <select
                    value={txForm.type}
                    onChange={(e) => setTxForm({ ...txForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="ingreso">Ingreso (+)</option>
                    <option value="gasto">Gasto (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">Fecha:</label>
                  <input
                    type="date"
                    value={txForm.date}
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs font-semibold font-mono tabular-nums focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">
                  Fondo Teocrático:
                </label>
                <select
                  value={txForm.fund}
                  onChange={(e) => setTxForm({ ...txForm, fund: e.target.value as any })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="gastos_locales">Gastos de la Congregación Local</option>
                  <option value="obra_mundial">Obra Mundial (Donaciones)</option>
                  <option value="construccion">Salones del Reino y Salones de Asambleas</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">
                  Categoría:
                </label>
                <select
                  value={txForm.category}
                  onChange={(e) => setTxForm({ ...txForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="donaciones_cajas">Donaciones en Cajas de Contribución</option>
                  <option value="donaciones_linea">Donaciones en Línea (donate.jw.org)</option>
                  <option value="servicios_electricidad">Suministro Eléctrico</option>
                  <option value="servicios_agua_gas">Agua Potable y Gas</option>
                  <option value="servicios_internet">Internet y Transmisión</option>
                  <option value="mantenimiento_reparaciones">Mantenimiento y Reparaciones</option>
                  <option value="articulos_limpieza">Artículos de Limpieza y Baño</option>
                  <option value="seguro_salon">Seguro del Salón</option>
                  <option value="resolucion_apoyo_circuito">Resolución de Apoyo al Circuito</option>
                  <option value="resolucion_obra_mundial">
                    Resolución de Donación Obra Mundial
                  </option>
                  <option value="fondos_transferidos_sucursal">
                    Fondos Transferidos a Sucursal
                  </option>
                  <option value="otro">Otros</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">
                  Descripción / Concepto:
                </label>
                <input
                  type="text"
                  placeholder="Ej. Pago de factura eléctrica del mes..."
                  value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] placeholder-zinc-400 dark:placeholder-zinc-500 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">
                    Monto (€):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej. 145.50"
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] rounded-xl text-xs font-extrabold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5] focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">
                    Método de Pago:
                  </label>
                  <select
                    value={txForm.paymentMethod}
                    onChange={(e) => setTxForm({ ...txForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">
                    Nº Recibo / Factura:
                  </label>
                  <input
                    type="text"
                    placeholder="FAC-2026-..."
                    value={txForm.receiptNumber}
                    onChange={(e) => setTxForm({ ...txForm, receiptNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] placeholder-zinc-400 dark:placeholder-zinc-500 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">
                    Beneficiario / Proveedor:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Compañía Eléctrica..."
                    value={txForm.payerOrPayee}
                    onChange={(e) => setTxForm({ ...txForm, payerOrPayee: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] placeholder-zinc-400 dark:placeholder-zinc-500 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-1 text-zinc-700 dark:text-[#A1A1AA]">
                <SplashCheckbox
                  size="sm"
                  checked={txForm.verified}
                  onChange={(e) => setTxForm({ ...txForm, verified: e.target.checked })}
                  label="Comprobante / factura física o digital verificada y archivada"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-[#27272A]">
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="px-3.5 py-2 text-xs text-zinc-600 dark:text-[#A1A1AA] font-semibold rounded-xl border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-100 dark:hover:bg-[#18181F] cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTx}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
              >
                {editingTx ? 'Guardar Cambios' : 'Registrar Movimiento'}
              </button>
            </div>
          </div>
        </div>
      )}

      <LocalOfficialFormsModal
        isOpen={!!officialFormModalCode}
        onClose={() => setOfficialFormModalCode(null)}
        initialFormCode={officialFormModalCode || 'S-26'}
      />
    </div>
  );
};
