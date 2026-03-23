"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Download,
  PieChart,
  RefreshCw,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
};

// Cores para o gráfico
const CHART_COLORS = [
  "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444",
  "#EC4899", "#14B8A6", "#6366F1", "#F97316", "#22C55E",
];

export default function CategoriesReportPage() {
  const { status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("EXPENSE");

  const fetchReport = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: selectedMonth.toString(),
        year: selectedYear.toString(),
        type: typeFilter,
      });
      
      const response = await fetch(
        `/api/reports/by-category?${params.toString()}`,
        { credentials: "include" }
      );

      if (!response.ok) throw new Error("Erro ao buscar relatório");
      const result = await response.json();
      setReport(result);
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [status, selectedMonth, selectedYear, typeFilter]);

  useEffect(() => {
    if (status === "authenticated") fetchReport();
  }, [status, fetchReport]);

  const handleExport = () => {
    const link = document.createElement("a");
    link.href = `/api/reports/export-categories?month=${selectedMonth}&year=${selectedYear}&type=${typeFilter}`;
    link.download = `categorias_${selectedMonth}_${selectedYear}.csv`;
    link.click();
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const chartData = report?.categories?.map((cat: any, index: number) => ({
    name: cat.name,
    value: cat.total,
    color: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-950">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/dashboard/relatorios")}
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <div>
                  <h1 className="text-xl font-bold text-white">Relatório por Categoria</h1>
                  <p className="text-sm text-slate-400">Distribuição de gastos e receitas</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchReport}
                  className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" /> Exportar
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filtros */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800 mb-8">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2024, m - 1).toLocaleDateString("pt-BR", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              >
                <option value="EXPENSE">Despesas</option>
                <option value="INCOME">Receitas</option>
                <option value="ALL">Todos</option>
              </select>

              <button
                onClick={fetchReport}
                className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
              >
                Gerar
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="ml-3 text-slate-400">Carregando...</span>
            </div>
          ) : report?.categories?.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
              <PieChart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Nenhuma transação no período selecionado</p>
            </div>
          ) : (
            <>
              {/* Gráfico Pizza */}
              <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800 mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Distribuição por Categoria
                </h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {chartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #1e293b",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Lista de Categorias */}
              <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Detalhamento
                </h3>
                <div className="space-y-3">
                  {report.categories.map((cat: any, index: number) => (
                    <div
                      key={cat.categoryId}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-white font-medium">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">{formatCurrency(cat.total)}</p>
                        <p className="text-xs text-slate-400">
                          {cat.count} transações • {((cat.total / report.summary.total) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}