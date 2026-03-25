"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Download,
  RefreshCcw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Filter,
  X,
  Building2,
  Tag,
} from "lucide-react";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ============================================
// TIPOS E INTERFACES
// ============================================
interface Periodo {
  mes: number;
  ano: number;
  nomeMes: string;
  dataInicio: string;
  dataFim: string;
}

interface Resumo {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  quantidadeTransacoes: number;
}

interface Comparativo {
  mesAnterior: {
    receitas: number;
    despesas: number;
    saldo: number;
  };
  variacaoReceitas: number;
  variacaoDespesas: number;
  variacaoSaldo: number;
}

interface Categoria {
  categoriaId: string;
  nome: string;
  total: number;
  quantidade: number;
  cor: string;
  tipo?: string;
}

interface Dia {
  dia: string;
  receitas: number;
  despesas: number;
}

interface Projecao {
  diasRestantes: number;
  mediaDiariaDespesas: number;
  despesaEstimadaFim: number;
  saldoEstimadoFim: number;
}

interface RelatorioData {
  periodo: Periodo;
  resumo: Resumo;
  comparativo: Comparativo;
  porCategoria: Categoria[];
  porDia: Dia[];
  topCategorias: Categoria[];
  projecao: Projecao | null;
  transacoes: any[];
}

interface Conta {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface CategoriaFiltro {
  id: string;
  name: string;
  color: string;
  type: string;
}

type PeriodoPreset =
  | "MES"
  | "ULTIMOS_3_MESES"
  | "SEMESTRAL"
  | "ANUAL"
  | "CUSTOM";
type TipoFiltro = "ALL" | "INCOME" | "EXPENSE";

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function RelatoriosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados - Filtros
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [periodoPreset, setPeriodoPreset] = useState<PeriodoPreset>("MES");
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("ALL");
  const [contaFiltro, setContaFiltro] = useState<string>("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("");
  const [dataInicioCustom, setDataInicioCustom] = useState<string>("");
  const [dataFimCustom, setDataFimCustom] = useState<string>("");

  // Estados - Dados
  const [dados, setDados] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarValores, setMostrarValores] = useState(true);

  // Estados - Filtros Auxiliares
  const [contas, setContas] = useState<Conta[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFiltro[]>([]);
  const [loadingFiltros, setLoadingFiltros] = useState(true);

  // ============================================
  // FUNÇÕES DE FORMATAÇÃO
  // ============================================
  const formatarMoeda = useCallback((valorEmCentavos: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valorEmCentavos / 100);
  }, []);

  const formatarPorcentagem = useCallback((valor: number) => {
    const sinal = valor >= 0 ? "+" : "";
    return `${sinal}${valor.toFixed(1)}%`;
  }, []);

  const formatarDataInput = useCallback((dataIso: string) => {
    if (!dataIso) return "";
    return dataIso.split("T")[0];
  }, []);

  // ============================================
  // BUSCAR CONTAS E CATEGORIAS PARA FILTROS
  // ============================================
  const buscarFiltrosAuxiliares = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      const [contasRes, categoriasRes] = await Promise.all([
        fetch("/api/contas"),
        fetch("/api/categorias"),
      ]);

      if (contasRes.ok) {
        const contasData = await contasRes.json();
        setContas(
          Array.isArray(contasData) ? contasData : contasData.accounts || [],
        );
      }

      if (categoriasRes.ok) {
        const categoriasData = await categoriasRes.json();
        setCategorias(
          Array.isArray(categoriasData)
            ? categoriasData
            : categoriasData.categories || [],
        );
      }
    } catch (err) {
      console.error("Erro ao carregar filtros:", err);
    } finally {
      setLoadingFiltros(false);
    }
  }, [status]);

  // ============================================
  // BUSCAR DADOS DA API DE RELATÓRIOS
  // ============================================
  const buscarRelatorio = useCallback(async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("mes", String(mesAtual));
      params.append("ano", String(anoAtual));

      // Adicionar preset de período
      if (periodoPreset !== "MES" && periodoPreset !== "CUSTOM") {
        params.append("periodo", periodoPreset);
      }

      // Adicionar período customizado
      if (periodoPreset === "CUSTOM" && dataInicioCustom && dataFimCustom) {
        params.append("dataInicio", dataInicioCustom);
        params.append("dataFim", dataFimCustom);
      }

      // Adicionar filtros
      if (tipoFiltro !== "ALL") {
        params.append("tipo", tipoFiltro);
      }
      if (contaFiltro) {
        params.append("contaId", contaFiltro);
      }
      if (categoriaFiltro) {
        params.append("categoriaId", categoriaFiltro);
      }

      // ✅ CORREÇÃO AQUI: Usar params.toString()
      const response = await fetch(
        `/api/relatorios/mensal?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error("Falha ao carregar relatório");
      }

      const data: RelatorioData = await response.json();
      setDados(data);
    } catch (err) {
      console.error("Erro ao buscar relatório:", err);
      setError(
        "Não foi possível carregar os dados do relatório. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    mesAtual,
    anoAtual,
    periodoPreset,
    tipoFiltro,
    contaFiltro,
    categoriaFiltro,
    dataInicioCustom,
    dataFimCustom,
    status,
  ]);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    buscarFiltrosAuxiliares();
  }, [buscarFiltrosAuxiliares]);

  useEffect(() => {
    buscarRelatorio();
  }, [buscarRelatorio]);

  // Carregar filtros da URL ao montar (persistência)
  useEffect(() => {
    const mes = searchParams?.get("mes");
    const ano = searchParams?.get("ano");
    const tipo = searchParams?.get("tipo") as TipoFiltro;
    const conta = searchParams?.get("contaId");
    const categoria = searchParams?.get("categoriaId");

    if (mes) setMesAtual(parseInt(mes));
    if (ano) setAnoAtual(parseInt(ano));
    if (tipo) setTipoFiltro(tipo);
    if (conta) setContaFiltro(conta);
    if (categoria) setCategoriaFiltro(categoria);
  }, [searchParams]);

  // ============================================
  // HANDLERS DE NAVEGAÇÃO E FILTROS
  // ============================================
  const handleMesAnterior = () => {
    if (mesAtual === 1) {
      setMesAtual(12);
      setAnoAtual(anoAtual - 1);
    } else {
      setMesAtual(mesAtual - 1);
    }
    setPeriodoPreset("MES");
  };

  const handleProximoMes = () => {
    if (mesAtual === 12) {
      setMesAtual(1);
      setAnoAtual(anoAtual + 1);
    } else {
      setMesAtual(mesAtual + 1);
    }
    setPeriodoPreset("MES");
  };

  const handleHoje = () => {
    const hoje = new Date();
    setMesAtual(hoje.getMonth() + 1);
    setAnoAtual(hoje.getFullYear());
    setPeriodoPreset("MES");
  };

  const handlePeriodoPreset = (preset: PeriodoPreset) => {
    setPeriodoPreset(preset);
    if (preset !== "CUSTOM") {
      setDataInicioCustom("");
      setDataFimCustom("");
    }
  };

  const handleAplicarFiltros = () => {
    // Atualiza URL com filtros para persistência
    const params = new URLSearchParams();
    params.append("mes", String(mesAtual));
    params.append("ano", String(anoAtual));
    if (tipoFiltro !== "ALL") params.append("tipo", tipoFiltro);
    if (contaFiltro) params.append("contaId", contaFiltro);
    if (categoriaFiltro) params.append("categoriaId", categoriaFiltro);

    router.push(`/painel/relatorios?${params.toString()}`, {
      scroll: false,
    });
    buscarRelatorio();
  };

  const handleLimparFiltros = () => {
    setTipoFiltro("ALL");
    setContaFiltro("");
    setCategoriaFiltro("");
    setPeriodoPreset("MES");
    setDataInicioCustom("");
    setDataFimCustom("");
    router.push("/painel/relatorios", { scroll: false });
    buscarRelatorio();
  };

  const handleExportarCSV = () => {
    const params = new URLSearchParams();
    params.append("mes", String(mesAtual));
    params.append("ano", String(anoAtual));

    if (periodoPreset !== "MES" && periodoPreset !== "CUSTOM") {
      params.append("periodo", periodoPreset);
    }
    if (periodoPreset === "CUSTOM" && dataInicioCustom && dataFimCustom) {
      params.append("dataInicio", dataInicioCustom);
      params.append("dataFim", dataFimCustom);
    }
    if (tipoFiltro !== "ALL") params.append("tipo", tipoFiltro);
    if (contaFiltro) params.append("contaId", contaFiltro);
    if (categoriaFiltro) params.append("categoriaId", categoriaFiltro);

    window.open(`/api/relatorios/exportar?${params.toString()}`, "_blank");
  };

  const handleExportarPDF = () => {
    const params = new URLSearchParams();
    params.append("mes", String(mesAtual));
    params.append("ano", String(anoAtual));

    if (periodoPreset !== "MES" && periodoPreset !== "CUSTOM") {
      params.append("periodo", periodoPreset);
    }
    if (periodoPreset === "CUSTOM" && dataInicioCustom && dataFimCustom) {
      params.append("dataInicio", dataInicioCustom);
      params.append("dataFim", dataFimCustom);
    }
    if (tipoFiltro !== "ALL") params.append("tipo", tipoFiltro);
    if (contaFiltro) params.append("contaId", contaFiltro);
    if (categoriaFiltro) params.append("categoriaId", categoriaFiltro);

    window.open(`/api/relatorios/exportar-pdf?${params.toString()}`, "_blank");
  };

  const handleExportar = () => {
    handleExportarCSV();
  };

  // Contar filtros ativos para badge
  const contarFiltrosAtivos = () => {
    let count = 0;
    if (tipoFiltro !== "ALL") count++;
    if (contaFiltro) count++;
    if (categoriaFiltro) count++;
    if (periodoPreset !== "MES") count++;
    return count;
  };

  // ============================================
  // RENDERIZAÇÃO CONDICIONAL
  // ============================================
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/entrar");
    return null;
  }

  // ============================================
  // DADOS PARA GRÁFICOS
  // ============================================
  const dadosGraficoBarras =
    dados?.porDia.map((dia) => ({
      nome: dia.dia.split("-")[2],
      receitas: dia.receitas / 100,
      despesas: dia.despesas / 100,
    })) || [];

  const dadosGraficoPizza =
    dados?.topCategorias.map((cat) => ({
      nome: cat.nome,
      valor: cat.total / 100,
      cor: cat.cor,
    })) || [];

  const CORES_GRAFICO = [
    "#047857",
    "#10B981",
    "#059669",
    "#04957E",
    "#8B5CF6",
    "#6366F1",
    "#3B82F6",
    "#2563EB",
    "#F59E0B",
    "#D97706",
    "#DC2626",
    "#EF4444",
  ];

  // ============================================
  // RENDERIZAÇÃO PRINCIPAL
  // ============================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* ============================================
          HEADER
      ============================================ */}
      <div className="mb-8">
        <PageHeader
          title="Relatórios Financeiros"
          subtitle="Acompanhe a evolução das suas finanças"
          onBack={() => router.push("/painel")}
          showDashboardLink={false}
          extraActions={
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportarPDF}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                title="Exportar em PDF"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={handleExportar}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                title="Exportar em CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={buscarRelatorio}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                title="Atualizar dados"
              >
                <RefreshCcw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Atualizar</span>
              </button>
            </div>
          }
        />
      </div>

      {/* ============================================
          FILTRO DE PERÍODO E FILTROS AVANÇADOS
      ============================================ */}
      <div className="max-w-7xl mx-auto mb-8 space-y-4">
        {/* Filtro de Período */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleMesAnterior}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                title="Mês anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold capitalize">
                  {dados?.periodo.nomeMes || "Carregando..."} {anoAtual}
                </span>
              </div>

              <button
                onClick={handleProximoMes}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                title="Próximo mês"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleHoje}
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors ml-2"
              >
                Mês atual
              </button>
            </div>

            {/* Presets de Período */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              {[
                { value: "MES", label: "Mês" },
                { value: "ULTIMOS_3_MESES", label: "3 Meses" },
                { value: "SEMESTRAL", label: "6 Meses" },
                { value: "ANUAL", label: "Anual" },
                { value: "CUSTOM", label: "Personalizado" },
              ].map((preset) => (
                <button
                  key={preset.value}
                  onClick={() =>
                    handlePeriodoPreset(preset.value as PeriodoPreset)
                  }
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    periodoPreset === preset.value
                      ? "bg-emerald-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Período Customizado */}
          {periodoPreset === "CUSTOM" && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
              <label className="text-sm text-slate-400">De:</label>
              <input
                type="date"
                value={dataInicioCustom}
                onChange={(e) => setDataInicioCustom(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <label className="text-sm text-slate-400">Até:</label>
              <input
                type="date"
                value={dataFimCustom}
                onChange={(e) => setDataFimCustom(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Filtros Avançados */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-white">Filtros Avançados</h3>
            {contarFiltrosAtivos() > 0 && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                {contarFiltrosAtivos()} ativo(s)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por Tipo */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tipo</label>
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value as TipoFiltro)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Todos os Tipos</option>
                <option value="INCOME">🟢 Apenas Receitas</option>
                <option value="EXPENSE">🔴 Apenas Despesas</option>
              </select>
            </div>

            {/* Filtro por Conta */}
            <div>
              <label className="block text-xs text-slate-400 mb-1 items-center gap-1">
                <Building2 className="w-3 h-3" /> Conta
              </label>
              {loadingFiltros ? (
                <div className="h-9 bg-slate-800 rounded-lg animate-pulse"></div>
              ) : (
                <select
                  value={contaFiltro}
                  onChange={(e) => setContaFiltro(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Todas as Contas</option>
                  {contas.map((conta) => (
                    <option key={conta.id} value={conta.id}>
                      {conta.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Filtro por Categoria */}
            <div>
              <label className="block text-xs text-slate-400 mb-1 items-center gap-1">
                <Tag className="w-3 h-3" /> Categoria
              </label>
              {loadingFiltros ? (
                <div className="h-9 bg-slate-800 rounded-lg animate-pulse"></div>
              ) : (
                <select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Todas as Categorias</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.type === "INCOME" ? "🟢" : "🔴"} {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex items-end gap-2">
              <button
                onClick={handleAplicarFiltros}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Aplicar
              </button>
              <button
                onClick={handleLimparFiltros}
                className="flex items-center justify-center w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                title="Limpar filtros"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Barra de Filtros Ativos */}
          {contarFiltrosAtivos() > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Filtros ativos:</span>
              {tipoFiltro !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                  {tipoFiltro === "INCOME" ? "🟢 Receitas" : "🔴 Despesas"}
                  <button
                    onClick={() => setTipoFiltro("ALL")}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {contaFiltro && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                  {contas.find((c) => c.id === contaFiltro)?.name || "Conta"}
                  <button
                    onClick={() => setContaFiltro("")}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {categoriaFiltro && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                  {categorias.find((c) => c.id === categoriaFiltro)?.name ||
                    "Categoria"}
                  <button
                    onClick={() => setCategoriaFiltro("")}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {periodoPreset !== "MES" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                  {periodoPreset === "ULTIMOS_3_MESES"
                    ? "3 Meses"
                    : periodoPreset === "SEMESTRAL"
                      ? "6 Meses"
                      : "Anual"}
                  <button
                    onClick={() => setPeriodoPreset("MES")}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          CARDS DE RESUMO
      ============================================ */}
      <div className="max-w-7xl mx-auto mb-8">
        {/* Resumo de Resultados */}
        {dados && !loading && (
          <div className="mb-4 text-sm text-slate-400">
            {dados.resumo.quantidadeTransacoes} transação(ões) encontrada(s) no
            período
            {tipoFiltro !== "ALL" &&
              ` • Filtrado por: ${tipoFiltro === "INCOME" ? "Receitas" : "Despesas"}`}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card Receitas */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              {dados?.comparativo.variacaoReceitas !== undefined && (
                <span
                  className={`text-sm font-medium ${
                    dados.comparativo.variacaoReceitas >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {formatarPorcentagem(dados.comparativo.variacaoReceitas)}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-1">Receitas do Período</p>
            <p className="text-2xl font-bold text-white">
              {mostrarValores
                ? formatarMoeda(dados?.resumo.totalReceitas || 0)
                : "R$ ••••••"}
            </p>
          </div>

          {/* Card Despesas */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6 hover:border-red-500/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
              {dados?.comparativo.variacaoDespesas !== undefined && (
                <span
                  className={`text-sm font-medium ${
                    dados.comparativo.variacaoDespesas <= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {formatarPorcentagem(dados.comparativo.variacaoDespesas)}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-1">Despesas do Período</p>
            <p className="text-2xl font-bold text-white">
              {mostrarValores
                ? formatarMoeda(dados?.resumo.totalDespesas || 0)
                : "R$ ••••••"}
            </p>
          </div>

          {/* Card Saldo */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6 hover:border-blue-500/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-400" />
              </div>
              {dados?.comparativo.variacaoSaldo !== undefined && (
                <span
                  className={`text-sm font-medium ${
                    dados.comparativo.variacaoSaldo >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {formatarPorcentagem(dados.comparativo.variacaoSaldo)}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-1">Saldo do Período</p>
            <p
              className={`text-2xl font-bold ${
                (dados?.resumo.saldo || 0) >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {mostrarValores
                ? formatarMoeda(dados?.resumo.saldo || 0)
                : "R$ ••••••"}
            </p>
          </div>

          {/* Card Projeção (só aparece se for mês atual) */}
          {dados?.projecao && periodoPreset === "MES" && (
            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-amber-500/30 p-6 hover:border-amber-500/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
                  {dados.projecao.diasRestantes} dias restantes
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-1">Projeção de Saldo</p>
              <p
                className={`text-2xl font-bold ${
                  (dados.projecao.saldoEstimadoFim || 0) >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {mostrarValores
                  ? formatarMoeda(dados.projecao.saldoEstimadoFim || 0)
                  : "R$ ••••••"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          GRÁFICOS
      ============================================ */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Barras - Receitas vs Despesas por Dia */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              Receitas vs Despesas por Dia
            </h3>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : dadosGraficoBarras.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosGraficoBarras}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="nome"
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `R$ ${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#94a3b8" }}
                    formatter={(value: number) => [
                      formatarMoeda(value * 100),
                      "",
                    ]}
                  />
                  <Bar
                    dataKey="receitas"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    name="Receitas"
                  />
                  <Bar
                    dataKey="despesas"
                    fill="#EF4444"
                    radius={[4, 4, 0, 0]}
                    name="Despesas"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <TrendingUp className="w-12 h-12 mb-2 opacity-50" />
                <p>Sem dados para exibir</p>
              </div>
            )}
          </div>

          {/* Gráfico de Pizza - Top Categorias */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              Top 5 Categorias de Despesas
            </h3>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : dadosGraficoPizza.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dadosGraficoPizza}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="valor"
                    >
                      {dadosGraficoPizza.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.cor ||
                            CORES_GRAFICO[index % CORES_GRAFICO.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [
                        formatarMoeda(value * 100),
                        "Total",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legenda */}
                <div className="flex-1 space-y-2 w-full">
                  {dadosGraficoPizza.map((cat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              cat.cor ||
                              CORES_GRAFICO[index % CORES_GRAFICO.length],
                          }}
                        />
                        <span className="text-sm text-slate-300">
                          {cat.nome}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-white">
                        {formatarMoeda(cat.valor * 100)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <TrendingDown className="w-12 h-12 mb-2 opacity-50" />
                <p>Sem despesas neste período</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================
          TABELA DE TRANSAÇÕES (RESUMO)
      ============================================ */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">
              Resumo de Transações
            </h3>
            <button
              onClick={() => router.push("/painel/transacoes")}
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Ver todas →
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-slate-800 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          ) : dados?.transacoes && dados.transacoes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-400 text-sm border-b border-slate-800">
                    <th className="pb-3 font-medium">Descrição</th>
                    <th className="pb-3 font-medium">Categoria</th>
                    <th className="pb-3 font-medium">Data</th>
                    <th className="pb-3 font-medium text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {dados.transacoes.slice(0, 10).map((transacao: any) => (
                    <tr
                      key={transacao.id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 text-white font-medium">
                        {transacao.description}
                      </td>
                      <td className="py-3 text-slate-400">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: transacao.category?.color,
                            }}
                          />
                          {transacao.category?.name}
                        </div>
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(transacao.occurrenceDate).toLocaleDateString(
                          "pt-BR",
                        )}
                      </td>
                      <td
                        className={`py-3 text-right font-medium ${
                          transacao.type === "INCOME"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {transacao.type === "INCOME" ? "+" : "-"}
                        {formatarMoeda(transacao.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma transação neste período com os filtros aplicados</p>
              {contarFiltrosAtivos() > 0 && (
                <button
                  onClick={handleLimparFiltros}
                  className="mt-2 text-emerald-400 hover:text-emerald-300 text-sm"
                >
                  Limpar filtros para ver todos os resultados
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          BANNER DE ERRO
      ============================================ */}
      {error && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-medium">{error}</p>
              <button
                onClick={buscarRelatorio}
                className="text-sm text-red-300 hover:text-red-200 mt-1"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
