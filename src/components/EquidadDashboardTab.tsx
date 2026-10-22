// src/components/EquidadDashboardTab.tsx
import React, { useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { computePublisherAssignmentStats } from '../utils/autoAssigner';
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Layers,
  Calendar,
} from 'lucide-react';

export const EquidadDashboardTab: React.FC = () => {
  const { publishers, weeks, preachingGroups, publishersMap } = useCongregation();

  const stats = useMemo(() => computePublisherAssignmentStats(weeks, publishers), [weeks, publishers]);

  // Max assignments among all publishers (for proportional bar charts)
  const maxCount = useMemo(() => {
    let m = 1;
    stats.forEach(s => {
      if (s.total > m) m = s.total;
    });
    return m;
  }, [stats]);

  // Sorted publishers by participations (descending)
  const sortedPublishers = useMemo(() => {
    return [...publishers]
      .filter(p => p.active)
      .sort((a, b) => {
        const countA = stats.get(a.id)?.total || 0;
        const countB = stats.get(b.id)?.total || 0;
        return countB - countA;
      });
  }, [publishers, stats]);

  // Inactive / Resting publishers (no assignments in last 30+ days or never)
  const restingPublishers = useMemo(() => {
    const today = new Date().getTime();
    return publishers
      .filter(p => p.active)
      .map(p => {
        const s = stats.get(p.id);
        let days = 9999;
        if (s?.lastDate) {
          const t = new Date(s.lastDate).getTime();
          days = Math.max(0, Math.floor((today - t) / (1000 * 60 * 60 * 24)));
        }
        return {
          publisher: p,
          daysWithoutAssignment: days,
          lastDate: s?.lastDate,
          total: s?.total || 0,
        };
      })
      .filter(item => item.total === 0 || item.daysWithoutAssignment >= 30)
      .sort((a, b) => b.daysWithoutAssignment - a.daysWithoutAssignment);
  }, [publishers, stats]);

  // Overall Confirmation status ratio
  const statusCounts = useMemo(() => {
    let confirmadas = 0;
    let pendientes = 0;
    let rechazadas = 0;

    weeks.forEach(w => {
      w.midweek.maestros.items.forEach(m => {
        if (m.status === 'confirmada') confirmadas++;
        else if (m.status === 'rechazada') rechazadas++;
        else pendientes++;
      });
      w.midweek.vidaCristiana.items.forEach(v => {
        if (v.status === 'confirmada') confirmadas++;
        else if (v.status === 'rechazada') rechazadas++;
        else pendientes++;
      });
    });

    const total = confirmadas + pendientes + rechazadas || 1;
    return {
      confirmadas,
      pendientes,
      rechazadas,
      total,
      confirmRate: Math.round((confirmadas / total) * 100),
    };
  }, [weeks]);

  // Participations by preaching group
  const groupStats = useMemo(() => {
    return preachingGroups.map(g => {
      const groupPubs = publishers.filter(p => p.groupNumber === g.number);
      const totalPart = groupPubs.reduce((acc, p) => acc + (stats.get(p.id)?.total || 0), 0);
      return {
        group: g,
        memberCount: groupPubs.length,
        totalPart,
      };
    });
  }, [preachingGroups, publishers, stats]);

  return (
    <div className="space-y-6">
      {/* Barra de Acciones de Equidad Teocrática (Opción 1: arranque directo sin banner redundante) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
            Analítica y Equidad
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
            Equilibrio de responsabilidades para evitar sobrecargar y dar oportunidad a todos
          </span>
        </div>

        {/* Global Confirmation Pill */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Tasa Confirmación:</span>
          </div>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{statusCounts.confirmRate}%</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>
      </div>

      {/* Grid: Resting publishers & Group Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resting Brothers (Alert list) - 1 col */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Hermanos en Descanso (+30 días)</span>
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {restingPublishers.length}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Publicadores activos que llevan más tiempo sin recibir una asignación:
          </p>

          <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
            {restingPublishers.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                ¡Excelente! Todos los publicadores han participado recientemente.
              </div>
            ) : (
              restingPublishers.map(item => (
                <div
                  key={item.publisher.id}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{item.publisher.name}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Grupo {item.publisher.groupNumber || 1} • {item.total} participaciones totales
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      {item.daysWithoutAssignment >= 900 ? 'Sin asignar' : `${item.daysWithoutAssignment} días`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Distribution Bars per Publisher - 2 cols */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Equidad: Participaciones Totales por Publicador</span>
            </h3>
            <span className="text-xs text-slate-400">Máximo: {maxCount} participaciones</span>
          </div>

          <p className="text-xs text-slate-500">
            Compara la carga de asignaciones entre todos los publicadores activos del programa:
          </p>

          <div className="space-y-3 overflow-y-auto max-h-[380px] pr-2">
            {sortedPublishers.map(pub => {
              const count = stats.get(pub.id)?.total || 0;
              const percent = Math.round((count / maxCount) * 100);

              return (
                <div key={pub.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {pub.name}{' '}
                      <span className="text-[11px] text-slate-400 font-normal">
                        (G#{pub.groupNumber || 1})
                      </span>
                    </span>
                    <span className="font-bold text-indigo-700">{count} asignaciones</span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percent > 80
                          ? 'bg-amber-500'
                          : percent > 40
                          ? 'bg-indigo-600'
                          : 'bg-indigo-300'
                      }`}
                      style={{ width: `${Math.max(percent, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Group Service Distribution Cards */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          <span>Distribución por Grupos de Predicación</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {groupStats.map(item => (
            <div
              key={item.group.number}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">
                  {item.group.name || `Grupo #${item.group.number}`}
                </span>
                <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                  #{item.group.number}
                </span>
              </div>

              <div className="space-y-1 text-slate-600">
                <p>Integrantes activos: <strong>{item.memberCount}</strong></p>
                <p>Participaciones acumuladas: <strong className="text-indigo-600">{item.totalPart}</strong></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
