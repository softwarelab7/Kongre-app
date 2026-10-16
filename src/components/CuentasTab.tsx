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
  generateS30AnnouncementText,
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
  Share2,
  MessageCircle,
  HelpCircle,
  Filter,
  Search,
  FileCheck,
  ShieldCheck,
  PieChart,
} from 'lucide-react';
import { SplashCheckbox } from './SplashCheckbox';

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

  // Selected Month (Default '2026-09' or current)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
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

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<AccountTransaction | null>(null);
  const [copiedS30, setCopiedS30] = useState(false);

  // Bank reconciliation input
  const [bankStatementBalance, setBankStatementBalance] = useState<string>('');

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

  // Audit modal
  const [editingAudit, setEditingAudit] = useState<QuarterlyAudit | null>(null);

  // Computed S-26 for selected month
  const s26 = useMemo(() => {
    return computeMonthlyS26(selectedMonth, transactions);
  }, [selectedMonth, transactions]);

  // Filtered transactions in selected month
  const filteredTransactions = useMemo(() => {
    return s26.transactions.filter((tx) => {
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
  }, [s26.transactions, filterFund, filterType, searchQuery]);

  // Bank reconciliation calculation
  const parsedBank = parseFloat(bankStatementBalance);
  const reconciliationDiff = !isNaN(parsedBank) ? parsedBank - s26.closingBalance : null;

  // Handlers for Transaction Form
  const handleOpenAddTx = (type: TransactionType = 'ingreso') => {
    setEditingTx(null);
    setTxForm({
      date: `${selectedMonth}-15`,
      type,
      fund: type === 'ingreso' ? 'gastos_locales' : 'gastos_locales',
      category: type === 'ingreso' ? 'donaciones_cajas' : 'servicios_electricidad',
      description: '',
      amount: '',
      receiptNumber: '',
      payerOrPayee: '',
      paymentMethod: 'efectivo',
      verified: true,
      notes: '',
    });
    setIsTxModalOpen(true);
  };

  const handleOpenEditTx = (tx: AccountTransaction) => {
    setEditingTx(tx);
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
      alert('Por favor ingrese un monto válido mayor a 0');
      return;
    }
    if (!txForm.description.trim()) {
      alert('Por favor describa el concepto o motivo del movimiento');
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
    }

    setIsTxModalOpen(false);
  };

  // Copy S-30 announcement text
  const handleCopyS30 = () => {
    const text = generateS30AnnouncementText(settings.congregationName, s26);
    navigator.clipboard.writeText(text);
    setCopiedS30(true);
    setTimeout(() => setCopiedS30(false), 2500);
  };

  const handleShareWhatsAppS30 = () => {
    const text = encodeURIComponent(generateS30AnnouncementText(settings.congregationName, s26));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Formularios Oficiales S-26 / S-30
            </span>
            <span className="text-xs text-slate-500 font-medium">Contabilidad Teocrática</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-emerald-600" />
            <span>Cuentas de la Congregación</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registro mensual de ingresos y gastos, conciliación bancaria (S-26), anuncio oficial para la congregación (S-30) y auditorías trimestrales (S-25).
          </p>
        </div>

        {/* Month Selector & New Action */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">Mes:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-emerald-700 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => handleOpenAddTx('ingreso')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Ingreso</span>
          </button>

          <button
            onClick={() => handleOpenAddTx('gasto')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Gasto</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
            title="Imprimir informe oficial"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards (Financial Balance) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 no-print">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 block uppercase">
            Saldo Inicial ({s26.monthName})
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-800">
            {formatCurrency(s26.openingBalance)}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Al primer día del mes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-xs font-bold text-emerald-600 block uppercase flex items-center justify-between">
            <span>Ingresos del Mes</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600">
            +{formatCurrency(s26.totalIncome)}
          </span>
          <span className="text-[11px] text-emerald-700 block mt-0.5">
            Cajas y donate.jw.org
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-xs font-bold text-rose-600 block uppercase flex items-center justify-between">
            <span>Egresos del Mes</span>
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
          </span>
          <span className="text-xl sm:text-2xl font-black text-rose-600">
            -{formatCurrency(s26.totalExpenses)}
          </span>
          <span className="text-[11px] text-rose-700 block mt-0.5">
            Servicios, apoyo y mantenimiento
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-xs font-bold text-indigo-600 block uppercase">
            Saldo Final Disponible
          </span>
          <span className="text-xl sm:text-2xl font-black text-indigo-600">
            {formatCurrency(s26.closingBalance)}
          </span>
          <span className="text-[11px] text-indigo-700 block mt-0.5 font-semibold">
            {s26.surplusOrDeficit >= 0 ? `+${formatCurrency(s26.surplusOrDeficit)} neto` : `${formatCurrency(s26.surplusOrDeficit)} déficit`}
          </span>
        </div>
      </div>

      {/* Sub-tab Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 no-print overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('s26')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 's26'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Hoja Mensual de Cuentas (S-26)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('s30')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 's30'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Anuncio para la Congregación (S-30)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('auditorias')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'auditorias'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Auditorías Trimestrales (S-25)</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: HOJA MENSUAL DE CUENTAS (FORMULARIO S-26)           */}
      {/* ============================================================== */}
      {activeSubTab === 's26' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 no-print">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por concepto, factura, proveedor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <select
                value={filterFund}
                onChange={(e) => setFilterFund(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer"
              >
                <option value="todos">Todos los Fondos</option>
                <option value="gastos_locales">Gastos Locales</option>
                <option value="obra_mundial">Obra Mundial</option>
                <option value="construccion">Salones del Reino</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer"
              >
                <option value="todos">Ingresos y Gastos</option>
                <option value="ingreso">Solo Ingresos (+)</option>
                <option value="gasto">Solo Gastos (-)</option>
              </select>
            </div>
          </div>

          {/* Transactions Table (Official S-26 Format) */}
          <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-wide uppercase">
                  Hoja de Cuentas S-26 • {s26.monthName}
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  {filteredTransactions.length} movimientos registrados en el período
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Saldo al Cierre</span>
                <span className="text-base font-black text-emerald-400">
                  {formatCurrency(s26.closingBalance)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="p-3 font-bold w-24">Fecha</th>
                    <th className="p-3 font-bold">Concepto / Descripción</th>
                    <th className="p-3 font-bold w-36">Fondo Teocrático</th>
                    <th className="p-3 font-bold w-28">Factura/Recibo</th>
                    <th className="p-3 font-bold w-24 text-center">Método</th>
                    <th className="p-3 font-bold w-28 text-right">Monto</th>
                    <th className="p-3 font-bold w-16 text-right no-print">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                        No hay movimientos registrados para este mes con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono text-slate-700 font-bold whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{tx.description}</p>
                          <p className="text-[11px] text-slate-500">
                            {CATEGORY_LABELS[tx.category] || tx.category}
                            {tx.payerOrPayee ? ` • ${tx.payerOrPayee}` : ''}
                          </p>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.fund === 'gastos_locales'
                                ? 'bg-blue-100 text-blue-800'
                                : tx.fund === 'obra_mundial'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {FUND_LABELS[tx.fund]}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 font-mono text-[11px]">
                          {tx.receiptNumber || '—'}
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-[11px] capitalize text-slate-600 font-medium">
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 text-right font-extrabold whitespace-nowrap">
                          <span
                            className={tx.type === 'ingreso' ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}
                          >
                            {tx.type === 'ingreso' ? '+' : '-'} {formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="p-3 text-right no-print">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditTx(tx)}
                              className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-indigo-600 transition"
                              title="Editar movimiento"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar movimiento: "${tx.description}"?`)) {
                                  deleteTransaction(tx.id);
                                }
                              }}
                              className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                              title="Eliminar movimiento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* S-26 Month Footer */}
                <tfoot>
                  <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={5} className="p-3 uppercase tracking-wider text-right">
                      Total Ingresos del Mes (+) / Total Gastos (-)
                    </td>
                    <td className="p-3 text-right font-mono text-xs">
                      <div className="text-emerald-600">+{formatCurrency(s26.totalIncome)}</div>
                      <div className="text-rose-600">-{formatCurrency(s26.totalExpenses)}</div>
                    </td>
                    <td className="no-print"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Bank Reconciliation Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 no-print">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Landmark className="w-4 h-4 text-indigo-600" />
                <span>Conciliación Bancaria Mensual (Cierre de {s26.monthName})</span>
              </h3>
              <span className="text-xs text-slate-500">
                Comparación del saldo en libros vs extracto bancario oficial
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Saldo en Libros S-26
                </span>
                <p className="text-lg font-black text-slate-900">
                  {formatCurrency(s26.closingBalance)}
                </p>
                <p className="text-[11px] text-slate-500">Calculado según movimientos</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-600 uppercase font-bold block">
                  Saldo según Extracto Bancario:
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-slate-400 font-bold">€</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Monto en extracto"
                    value={bankStatementBalance}
                    onChange={(e) => setBankStatementBalance(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500">Ingrese el saldo final del banco</p>
              </div>

              <div
                className={`p-3.5 rounded-xl border space-y-1 ${
                  reconciliationDiff === null
                    ? 'bg-slate-50 border-slate-200 text-slate-500'
                    : Math.abs(reconciliationDiff) < 0.01
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                <span className="text-[10px] uppercase font-bold block">
                  Estado de Conciliación
                </span>
                {reconciliationDiff === null ? (
                  <p className="text-xs font-medium">Pendiente de cotejar con extracto</p>
                ) : Math.abs(reconciliationDiff) < 0.01 ? (
                  <div className="flex items-center gap-1 text-emerald-700 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Conciliación Exacta (€ 0,00)!</span>
                  </div>
                ) : (
                  <div className="space-y-0.5 text-rose-700 font-bold">
                    <p className="flex items-center gap-1 text-xs">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Diferencia detectada:</span>
                    </p>
                    <p className="text-base font-black font-mono">
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
              <h2 className="text-base font-bold text-slate-800">
                Informe Mensual de Cuentas para la Congregación (S-30)
              </h2>
              <p className="text-xs text-slate-500">
                Texto oficial que se lee a la congregación en la reunión de entre semana correspondiente a {s26.monthName}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyS30}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Hoja S-30</span>
              </button>
            </div>
          </div>

          {/* S-30 Printable Formal Card */}
          <div className="bg-white border-2 border-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg max-w-3xl mx-auto space-y-6 print:border print:shadow-none print:m-0 print:p-4">
            <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">
                Formulario Oficial S-30
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wider uppercase font-serif">
                INFORME DE CUENTAS PARA LA CONGREGACIÓN
              </h2>
              <p className="text-xs font-semibold text-slate-700">
                Congregación: <strong>{settings.congregationName}</strong> • Mes: <strong>{s26.monthName}</strong>
              </p>
            </div>

            <div className="space-y-4 text-xs text-slate-800 leading-relaxed font-sans">
              <p className="italic text-slate-600">
                (Nota para el hermano que lee el informe: Lea este anuncio durante la reunión de entre semana en el tiempo asignado para anuncios locales).
              </p>

              <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3 font-serif text-sm">
                <p>
                  Queridos hermanos: Nos complace presentarles el informe de las cuentas de la congregación correspondiente al mes de <strong>{s26.monthName}</strong>:
                </p>

                <div className="space-y-2 border-l-2 border-slate-400 pl-4 my-3 text-xs font-sans">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">1. Saldo al inicio del mes:</span>
                    <strong className="text-slate-900">{formatCurrency(s26.openingBalance)}</strong>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">2. Contribuciones recibidas (Cajas y en línea):</span>
                    <strong className="text-emerald-700">+{formatCurrency(s26.totalIncome)}</strong>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">3. Gastos efectuados (Servicios y mantenimiento):</span>
                    <strong className="text-rose-700">-{formatCurrency(s26.totalExpenses)}</strong>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">4. Balance neto del período:</span>
                    <strong className={s26.surplusOrDeficit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                      {s26.surplusOrDeficit >= 0 ? 'Superávit de ' : 'Déficit de '}
                      {formatCurrency(Math.abs(s26.surplusOrDeficit))}
                    </strong>
                  </div>

                  <div className="flex justify-between py-1.5 pt-2 text-sm font-bold bg-slate-100 px-2 rounded">
                    <span className="text-slate-900">5. Saldo disponible al cierre del mes:</span>
                    <span className="text-indigo-800">{formatCurrency(s26.closingBalance)}</span>
                  </div>
                </div>

                <p>
                  El cuerpo de ancianos desea expresar su sincero agradecimiento a toda la congregación por su espíritu generoso y su fiel apoyo material, el cual permite cubrir los gastos del Salón del Reino y promover la predicación mundial de las buenas noticias.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-slate-400 pt-2 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Preparado por:</span>
                  <p className="font-semibold text-slate-700">Siervo de Cuentas</p>
                </div>
                <div className="border-t border-slate-400 pt-2 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Aprobado por:</span>
                  <p className="font-semibold text-slate-700">Coordinador del Cuerpo de Ancianos</p>
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
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl space-y-1">
            <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-700" />
              <span>Instrucciones Oficiales sobre la Auditoría de Cuentas (S-25)</span>
            </h3>
            <p className="text-xs text-indigo-800">
              Cada 3 meses, el cuerpo de ancianos nombra a un hermano capacitado (que no sea el siervo de cuentas) para auditar los registros financieros de la congregación. El auditor revisa las facturas, los recibos de donaciones, las conciliaciones bancarias y los anuncios S-30.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quarterlyAudits.map((audit) => (
              <div
                key={audit.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg font-black text-xs bg-slate-900 text-white">
                      {audit.quarter}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Año de Servicio {audit.serviceYear}
                    </h4>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      audit.isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {audit.isCompleted ? 'Auditoría Completada' : 'Pendiente de Revisión'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p>
                    <strong>Meses auditados:</strong> {audit.monthsCovered.join(', ')}
                  </p>
                  <p>
                    <strong>Hermano auditor:</strong> {audit.auditorName}
                  </p>
                  {audit.auditDate && (
                    <p>
                      <strong>Fecha de auditoría:</strong> {audit.auditDate}
                    </p>
                  )}
                </div>

                {/* Audit Checklist Items */}
                <div className="flex flex-col gap-2 pt-1 text-xs">
                  <SplashCheckbox
                    size="sm"
                    checked={audit.reviewedReceipts}
                    onChange={(e) =>
                      updateQuarterlyAudit({ ...audit, reviewedReceipts: e.target.checked })
                    }
                    label="Facturas y recibos de gastos comprobados"
                  />

                  <SplashCheckbox
                    size="sm"
                    checked={audit.verifiedBankStatements}
                    onChange={(e) =>
                      updateQuarterlyAudit({ ...audit, verifiedBankStatements: e.target.checked })
                    }
                    label="Extractos bancarios y conciliación cotejados"
                  />

                  <SplashCheckbox
                    size="sm"
                    checked={audit.checkedS30Announcements}
                    onChange={(e) =>
                      updateQuarterlyAudit({ ...audit, checkedS30Announcements: e.target.checked })
                    }
                    label="Informes S-30 leídos a la congregación verificados"
                  />
                </div>

                {audit.findingsNotes && (
                  <div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100 text-[11px] text-indigo-900 italic">
                    "{audit.findingsNotes}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TRANSACTION MODAL (ADD / EDIT)                                 */}
      {/* ============================================================== */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>
                  {editingTx ? 'Editar Movimiento Contable' : 'Registrar Nuevo Movimiento'}
                </span>
              </h3>
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Tipo:</label>
                  <select
                    value={txForm.type}
                    onChange={(e) => setTxForm({ ...txForm, type: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="ingreso">Ingreso (+)</option>
                    <option value="gasto">Gasto (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Fecha:</label>
                  <input
                    type="date"
                    value={txForm.date}
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Fondo Teocrático:</label>
                <select
                  value={txForm.fund}
                  onChange={(e) => setTxForm({ ...txForm, fund: e.target.value as any })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700"
                >
                  <option value="gastos_locales">Gastos de la Congregación Local</option>
                  <option value="obra_mundial">Obra Mundial (Donaciones)</option>
                  <option value="construccion">Salones del Reino y Salones de Asambleas</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Categoría:</label>
                <select
                  value={txForm.category}
                  onChange={(e) => setTxForm({ ...txForm, category: e.target.value as any })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium"
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
                  <option value="resolucion_obra_mundial">Resolución de Donación Obra Mundial</option>
                  <option value="fondos_transferidos_sucursal">Fondos Transferidos a Sucursal</option>
                  <option value="otro">Otros</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Descripción / Concepto:</label>
                <input
                  type="text"
                  placeholder="Ej. Pago de factura eléctrica del mes de septiembre..."
                  value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Monto (€):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej. 145.50"
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Método de Pago:</label>
                  <select
                    value={txForm.paymentMethod}
                    onChange={(e) => setTxForm({ ...txForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nº Recibo / Factura:</label>
                  <input
                    type="text"
                    placeholder="FAC-2026-..."
                    value={txForm.receiptNumber}
                    onChange={(e) => setTxForm({ ...txForm, receiptNumber: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Beneficiario / Proveedor:</label>
                  <input
                    type="text"
                    placeholder="Ej. Compañía Eléctrica..."
                    value={txForm.payerOrPayee}
                    onChange={(e) => setTxForm({ ...txForm, payerOrPayee: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 font-semibold rounded-xl hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTx}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                {editingTx ? 'Guardar Cambios' : 'Registrar Movimiento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
