"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
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
  Activity,
  Lightbulb,
  Zap,
} from "lucide-react";
import { CabecalhoPagina } from "@/app/painel/_componentes/CabecalhoPagina";
import { CarregamentoNeural } from "@/app/painel/_componentes/CarregamentoNeural";
import { MascoteNeural } from "@/app/painel/_componentes/MascoteNeural";
import { neuralVoice } from "@/biblioteca/NeuralVoiceService";
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
  Legend,
} from "recharts";
import { HistoricoRelatorios } from "./_componentes/HistoricoRelatorios";

// tipos e interfaces
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

// conteúdo da página (wrapper para suspense)
function RelatoriosPageContent() {
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
  const [activeTab, setActiveTab] = useState<"gerencial" | "historico">(
    "gerencial"
  );

  // Efeito para lidar com o parâmetro de query ?tab=historico
  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (tab === "historico") {
      setActiveTab("historico");
    } else if (tab === "gerencial") {
      setActiveTab("gerencial");
    }
  }, [searchParams]);

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

  // ============================================
  // buscar contas e categorias para filtros
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

      const response = await fetch(
        `/api/relatorios/mensal?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error("Falha ao carregar relatório");
      }

      const data: RelatorioData = await response.json();
      setDados(data);

      // --- INSIGHT DO MASCOTE PARA O RELATÓRIO (VOZ ANIME) ---
      if (data && data.resumo) {
        const saldo = data.resumo.saldo / 100;
        let insightMsg = "";
        
        const audioId = saldo > 0 ? "report_positivo" : "report_alert";
        neuralVoice.speak(insightMsg, audioId);
      }
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
  // efeitos
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
  // handlers DE NAVEGAÇÃO E FILTROS
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
    return <CarregamentoNeural message="Gerando Matriz de Relatórios..." variant="full" />;
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
    "#06B6D4",
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
    <div className="min-h-screen bg-slate-950">
      <CabecalhoPagina
        title="Relatórios e Análises"
        description="Analise seu desempenho financeiro com dados detalhados"
        breadcrumbs={[{ label: "Relatórios" }]}
      >
        <div className="flex items-center bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("gerencial")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === "gerencial"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            Gerencial
          </button>
          <button
            onClick={() => setActiveTab("historico")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === "historico"
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-3 h-3" />
            Histórico
          </button>
        </div>

        <button
          onClick={buscarRelatorio}
          className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
          title="Atualizar"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </CabecalhoPagina>

      {activeTab === "gerencial" ? (
        <>
          <div className="max-w-7xl mx-auto mb-8 space-y-4">
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
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
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

      <div className="max-w-7xl mx-auto mb-8">
        {dados && !loading && (
          <div className="mb-4 text-sm text-slate-400">
            {dados.resumo.quantidadeTransacoes} transação(ões) encontrada(s) no
            período
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {dados && (
            <div className="mt-8 p-6 bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
                
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="p-4 bg-slate-900/60 rounded-full border border-white/5 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                        <MascoteNeural size="lg" mood={dados.resumo.saldo >= 0 ? "HAPPY" : "WORRIED"} level={40} showScan={true} />
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                                <Lightbulb className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Conclusão do Guardião Neural</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Análise de Fluxo Mensal</p>
                            </div>
                        </div>

                        <div className="p-5 bg-slate-950/60 rounded-2xl border border-white/5 italic text-slate-300 font-medium leading-relaxed">
                            &quot;{dados.resumo.saldo >= 0 
                                ? `Ótimo trabalho, ${session?.user?.name?.split(' ')[0] || "Mestre"}! Seu fluxo de ${formatarMoeda(dados.resumo.saldo)} é combustível puro para seus objetivos. Sua eficiência de gastos está operando em parâmetros ideais.` 
                                : `${session?.user?.name?.split(' ')[0] || "Mestre"}, detectamos uma anomalia produtiva. Você operou em déficit de ${formatarMoeda(Math.abs(dados.resumo.saldo))}. Meus algoritmos sugerem revisão imediata das categorias de maior peso.`
                            }&quot;
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/40 rounded-xl border border-white/5">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-black text-white uppercase tracking-tight">Status: {dados.resumo.saldo >= 0 ? "OTIMIZADO" : "CRÍTICO"}</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/40 rounded-xl border border-white/5">
                                <Activity className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-black text-white uppercase tracking-tight">Saúde: {(dados as any).saude?.status || "Estável"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 relative overflow-hidden group">
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
            
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tighter flex items-center gap-2 relative z-10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Fluxo Diário: Receitas vs Despesas
            </h3>

            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <CarregamentoNeural message="Sincronizando Séries Temporais..." variant="card" />
              </div>
            ) : dadosGraficoBarras.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosGraficoBarras} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <filter id="neonGlowBar" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="nome"
                    stroke="#475569"
                    tick={{ fontSize: 10, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#475569"
                    tick={{ fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(value) => `R$ ${value}`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-2">Dia {label}</p>
                            <div className="space-y-1.5 relative z-10">
                              <div className="flex justify-between gap-6">
                                <span className="text-xs text-slate-400">Receitas:</span>
                                <span className="text-xs font-bold text-emerald-400">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value as number)}
                                </span>
                              </div>
                              <div className="flex justify-between gap-6">
                                <span className="text-xs text-slate-400">Despesas:</span>
                                <span className="text-xs font-bold text-red-400">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[1].value as number)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{value}</span>}
                  />
                  <Bar 
                    dataKey="receitas" 
                    fill="#10B981" 
                    radius={[4, 4, 0, 0]} 
                    name="Receitas" 
                    style={{ filter: "url(#neonGlowBar)" }}
                  />
                  <Bar 
                    dataKey="despesas" 
                    fill="#EF4444" 
                    radius={[4, 4, 0, 0]} 
                    name="Despesas" 
                    style={{ filter: "url(#neonGlowBar)" }}
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

          <div className="bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 relative overflow-hidden group">
             <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
             
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tighter flex items-center gap-2 relative z-10">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Categorias Críticas: Volume de Gastos
            </h3>

            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <CarregamentoNeural message="Processando Mix de Categorias..." variant="card" />
              </div>
            ) : dadosGraficoPizza.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <filter id="neonGlowPie" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <Pie
                      data={dadosGraficoPizza}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="valor"
                      stroke="none"
                    >
                      {dadosGraficoPizza.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.cor || CORES_GRAFICO[index % CORES_GRAFICO.length]}
                          style={{ filter: "url(#neonGlowPie)" }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent pointer-events-none" />
                              <div className="flex items-center gap-2 mb-2 relative z-10">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.cor }} />
                                <p className="text-xs font-black text-white uppercase tracking-widest">{item.name}</p>
                              </div>
                              <p className="text-sm font-black text-white relative z-10">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex-1 space-y-2 w-full max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {dadosGraficoPizza.map((cat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                          style={{
                            backgroundColor:
                              cat.cor ||
                              CORES_GRAFICO[index % CORES_GRAFICO.length],
                            color: cat.cor || CORES_GRAFICO[index % CORES_GRAFICO.length]
                          }}
                        />
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-tighter">
                          {cat.nome}
                        </span>
                      </div>
                      <span className="text-[11px] font-black text-white tracking-widest leading-none">
                        {formatarMoeda(cat.valor * 100)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <TrendingDown className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm font-medium italic">Sem despesas registradas nesta janela temporal</p>
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
        </>
      ) : (
        <HistoricoRelatorios />
      )}
    </div>
  );
}

// componente principal (com boundary)
export default function RelatoriosPage() {
  return (
    <Suspense fallback={<CarregamentoNeural message="Sincronizando Matriz de Dados..." variant="full" />}>
      <RelatoriosPageContent />
    </Suspense>
  );
}
