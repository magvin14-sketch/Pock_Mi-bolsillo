import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Movement, LanguageCode } from '../types';
import { CATEGORIA_COLOR, TEXTOS } from '../config';
import { formatColones, getCategoryLabel } from '../utils';

interface FinanceChartsProps {
  historial: Movement[];
  presupuestos?: Record<string, number>;
  lang: LanguageCode;
}

export const FinanceCharts: React.FC<FinanceChartsProps> = ({
  historial,
  presupuestos = {},
  lang,
}) => {
  const t = (key: keyof typeof TEXTOS['es']) => TEXTOS[lang][key] || key;

  // 1. Group expenses by date (chronological)
  const dailyData = useMemo(() => {
    const expensesByDate: Record<string, { total: number; count: number }> = {};

    // Get all 'gasto' movements
    for (const mov of historial) {
      if (mov.tipo === 'gasto' && mov.fecha) {
        if (!expensesByDate[mov.fecha]) {
          expensesByDate[mov.fecha] = { total: 0, count: 0 };
        }
        expensesByDate[mov.fecha].total += mov.monto;
        expensesByDate[mov.fecha].count += 1;
      }
    }

    // Sort dates (DD/MM/YYYY)
    const sortedDates = Object.keys(expensesByDate).sort((a, b) => {
      const [d1, m1, y1] = a.split('/').map(Number);
      const [d2, m2, y2] = b.split('/').map(Number);
      return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
    });

    return sortedDates.map((fecha) => {
      // Shorter label for display: "04 Sep" or "04/09"
      const parts = fecha.split('/');
      const shortLabel = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : fecha;
      return {
        fecha,
        shortLabel,
        total: expensesByDate[fecha].total,
        count: expensesByDate[fecha].count,
      };
    });
  }, [historial]);

  // 2. Group expenses by category and compare with budget caps
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};

    for (const mov of historial) {
      if (mov.tipo === 'gasto') {
        const cat = mov.categoria || 'otros';
        catMap[cat] = (catMap[cat] || 0) + mov.monto;
      }
    }

    // Include any categories with expenses or defined budget
    const allKeys = new Set([...Object.keys(catMap), ...Object.keys(presupuestos)]);

    return Array.from(allKeys)
      .map((catKey) => {
        const name = getCategoryLabel(catKey, lang, true);
        const gasto = catMap[catKey] || 0;
        const presupuesto = presupuestos[catKey] || 0;
        return {
          id: catKey,
          name,
          color: CATEGORIA_COLOR[catKey] || '#9AA3AD',
          gasto,
          presupuesto,
        };
      })
      .filter((item) => item.gasto > 0 || item.presupuesto > 0)
      .sort((a, b) => b.gasto - a.gasto);
  }, [historial, presupuestos, lang]);

  if (dailyData.length === 0 && categoryData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Daily Evolution Chart */}
      {dailyData.length > 0 && (
        <section
          id="card-grafico-diario"
          className="bg-[#202328] border border-[#30353B] rounded-xl p-5 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F4F6F8] flex items-center gap-2">
                <span>📈</span>
                <span>{t('grafico_evolucion_tit')}</span>
              </h3>
              <p className="text-xs text-[#9AA3AD]">
                {t('grafico_evolucion_sub')}
              </p>
            </div>
            <span className="text-xs font-mono text-[#35D0BA] font-bold">
              {dailyData.length} {dailyData.length === 1 ? 'día activo' : 'días activos'}
            </span>
          </div>

          <div className="h-60 w-full pt-2 outline-none focus:outline-none select-none" tabIndex={-1}>
            <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none">
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} style={{ outline: 'none' }}>
                <defs>
                  <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#35D0BA" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#35D0BA" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#30353B" vertical={false} />
                <XAxis
                  dataKey="shortLabel"
                  stroke="#9AA3AD"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#30353B' }}
                />
                <YAxis
                  stroke="#9AA3AD"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₡${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  cursor={{ stroke: '#35D0BA', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#17191C] border border-[#30353B] p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="text-[#9AA3AD] font-semibold">{data.fecha}</p>
                          <p className="text-sm font-bold font-mono text-[#35D0BA]">
                            {formatColones(data.total)}
                          </p>
                          <p className="text-[11px] text-[#9AA3AD]">
                            {data.count} {data.count === 1 ? 'gasto registrado' : 'gastos registrados'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#35D0BA"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorGasto)"
                  activeDot={{ r: 5, fill: '#35D0BA', stroke: '#121316', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Category Spending vs Budget Chart */}
      {categoryData.length > 0 && (
        <section
          id="card-grafico-categorias"
          className="bg-[#202328] border border-[#30353B] rounded-xl p-5 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F4F6F8] flex items-center gap-2">
                <span>📊</span>
                <span>{lang === 'es' ? 'Comparativo de Gastos por Categoría' : 'Category Spending Comparison'}</span>
              </h3>
              <p className="text-xs text-[#9AA3AD]">
                {lang === 'es'
                  ? 'Gasto real vs. Tope presupuestado configurado'
                  : 'Actual expense vs. configured monthly budget cap'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-[#35D0BA]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#35D0BA]" /> Gasto Real
              </span>
              <span className="flex items-center gap-1 text-[#9AA3AD]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#4D9DE0]" /> Presupuesto
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2 outline-none focus:outline-none select-none" tabIndex={-1}>
            <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} style={{ outline: 'none' }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30353B" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#9AA3AD"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#30353B' }}
                />
                <YAxis
                  stroke="#9AA3AD"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₡${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(53, 208, 186, 0.08)', radius: 6 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#17191C] border border-[#30353B] p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-bold text-[#F4F6F8]">{data.name}</p>
                          <p className="text-[#35D0BA] font-mono font-semibold">
                            Gasto: {formatColones(data.gasto)}
                          </p>
                          {data.presupuesto > 0 && (
                            <p className="text-[#4D9DE0] font-mono font-semibold">
                              Tope: {formatColones(data.presupuesto)}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="gasto" fill="#35D0BA" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar dataKey="presupuesto" fill="#4D9DE0" radius={[4, 4, 0, 0]} maxBarSize={36} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
};
