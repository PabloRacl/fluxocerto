"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/componentes/ui/skeleton";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ShoppingBag,
  PieChart,
  Settings,
  LogOut,
  Plus,
  RefreshCw,
  ArrowUpRight,
  Info,
  Lightbulb,
  Target,
  AlertCircle,
  PiggyBank,
  BarChart3,
  DollarSign,
  Receipt,
  Shield,
  Clock,
  TrendingUp as TrendingUpIcon,
  Wallet as WalletIcon,
  CreditCard as CreditCardIcon,
  Calculator,
  Landmark,
  Coins,
  Percent,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Gift,
  Heart,
  Star,
  Trophy,
  Zap,
  Flame,
  Moon,
  Sun,
  Cloud,
  Droplet,
  Flower,
  Trees,
  Home,
  Car,
  Bike,
  Bus,
  Plane,
  Train,
  Ship,
  Coffee,
  Beer,
  Pizza,
  Apple,
  Cake,
  IceCream,
  Camera,
  Music,
  Film,
  Gamepad,
  Book,
  Pen,
  Briefcase,
  Medal,
  Award,
  FileText,
  Download,
  Calendar,
  Target as TargetIcon,
  ArrowRight,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/componentes/ui/tooltip";
import { BalanceEvolutionChart } from "@/app/painel/_componentes/BalanceEvolutionChart";
import { ExpensesByCategoryChart } from "@/app/painel/_componentes/ExpensesByCategoryChart";
import { BalanceForecastChart } from "@/app/painel/_componentes/BalanceForecastChart";
import { InsightsPanel } from "@/app/painel/_componentes/InsightsPanel";
import { GamificacaoPanel } from "@/app/painel/_componentes/GamificacaoPanel";

// ============================================
// FORMATADOR DE MOEDA (BRL)
// ============================================
const formatCurrency = (valueInCents: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
};

// ============================================
// 60 DICAS FINANCEIRAS (EXPANDIDO) - ✅ RESTAURADO
// ============================================
const financialTips = [
  {
    icon: PiggyBank,
    title: "Reserva",
    content: "Mantenha 3-6 meses de despesas em reserva",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Target,
    title: "Regra 50-30-20",
    content: "50% necessidades, 30% desejos, 20% economia",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: AlertCircle,
    title: "Dívidas",
    content: "Pague o cartão integralmente todo mês",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
  {
    icon: Lightbulb,
    title: "Automação",
    content: "Automatize transferências para investimentos",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: BarChart3,
    title: "Acompanhe",
    content: "Revise suas finanças semanalmente",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: DollarSign,
    title: "Renda Extra",
    content: "Busque fontes adicionais de renda",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Receipt,
    title: "Controle",
    content: "Anote todos os gastos, mesmo pequenos",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: Shield,
    title: "Seguros",
    content: "Proteja seu patrimônio com seguros",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: Clock,
    title: "Juros",
    content: "Comece cedo para aproveitar juros compostos",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
  },
  {
    icon: TrendingUpIcon,
    title: "Invista",
    content: "Diversifique para reduzir riscos",
    color: "text-lime-400",
    bgColor: "bg-lime-500/10",
  },
  {
    icon: WalletIcon,
    title: "Orçamento",
    content: "Planeje gastos antes do mês começar",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: CreditCardIcon,
    title: "Cartão",
    content: "Use no máximo 30% do limite",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
  },
  {
    icon: Calculator,
    title: "Financiamento",
    content: "Calcule juros antes de financiar",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
  },
  {
    icon: Landmark,
    title: "Impostos",
    content: "Separe dinheiro para impostos anuais",
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
  },
  {
    icon: Coins,
    title: "Moeda Forte",
    content: "Considere investir em dólar/euro",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: Percent,
    title: "Taxas",
    content: "Evite taxas com contas digitais",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
  },
  {
    icon: AlertTriangle,
    title: "Golpes",
    content: "Desconfie de ganhos fáceis",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
  {
    icon: CheckCircle,
    title: "Metas",
    content: "Defina metas específicas",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Sparkles,
    title: "Educação",
    content: "Invista em conhecimento financeiro",
    color: "text-fuchsia-400",
    bgColor: "bg-fuchsia-500/10",
  },
  {
    icon: PiggyBank,
    title: "Cofrinho",
    content: "Guarde moedas digitalmente",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Target,
    title: "Priorize",
    content: "Pague dívidas com juros altos primeiro",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Lightbulb,
    title: "Despesas Fixas",
    content: "Mantenha abaixo de 50% da renda",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: BarChart3,
    title: "Pesquise",
    content: "Sempre compare preços",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: DollarSign,
    title: "Aposentadoria",
    content: "Planeje sua aposentadoria agora",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Receipt,
    title: "Notas",
    content: "Guarde notas fiscais importantes",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: Shield,
    title: "Dados",
    content: "Proteja informações bancárias",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
  },
  {
    icon: Clock,
    title: "Prazos",
    content: "Pague contas antes do vencimento",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: TrendingUpIcon,
    title: "Renda",
    content: "Busque aumentos/promoções",
    color: "text-lime-400",
    bgColor: "bg-lime-500/10",
  },
  {
    icon: WalletIcon,
    title: "Cartões",
    content: "Tenha controle de todos",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
  },
  {
    icon: CreditCardIcon,
    title: "Cashback",
    content: "Use cartões com cashback",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
  },
  {
    icon: Calculator,
    title: "Custo de Vida",
    content: "Calcule seu custo exato",
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
  },
  {
    icon: Landmark,
    title: "Banco Digital",
    content: "Use bancos sem taxas",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
  },
  {
    icon: Coins,
    title: "Invista",
    content: "Comece mesmo com pouco",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: Percent,
    title: "CDI vs Selic",
    content: "Entenda a diferença",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: AlertTriangle,
    title: "Cheque Especial",
    content: "Evite (juros altos)",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
  {
    icon: CheckCircle,
    title: "Revisão",
    content: "Revista investimentos anualmente",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Sparkles,
    title: "Liberdade",
    content: "Trabalhe pela liberdade financeira",
    color: "text-fuchsia-400",
    bgColor: "bg-fuchsia-500/10",
  },
  {
    icon: PiggyBank,
    title: "Economia",
    content: "Economize em contas (luz/água)",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Target,
    title: "Emergência",
    content: "Tenha fundo para imprevistos",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: Lightbulb,
    title: "Consumo",
    content: "Pense: preciso mesmo?",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Gift,
    title: "Presentes",
    content: "Planeje gastos com presentes antecipadamente",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: Heart,
    title: "Saúde",
    content: "Invista em prevenção e plano de saúde",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
  {
    icon: Star,
    title: "Qualidade",
    content: "Invista em qualidade, não quantidade",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: Trophy,
    title: "Conquistas",
    content: "Comemore metas alcançadas",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Zap,
    title: "Energia",
    content: "Reduza contas de energia com hábitos simples",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: Flame,
    title: "Combustível",
    content: "Use apps para achar combustível barato",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: Moon,
    title: "Sono",
    content: "Durma bem para tomar decisões financeiras melhores",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
  },
  {
    icon: Sun,
    title: "Otimismo",
    content: "Mantenha perspectiva positiva mas realista",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Cloud,
    title: "Nuvem",
    content: "Faça backup dos seus dados financeiros",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
  },
  {
    icon: Droplet,
    title: "Água",
    content: "Economize água e reduza a conta",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: Flower,
    title: "Jardim",
    content: "Cultive hobbies que não custem caro",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: Trees,
    title: "Futuro",
    content: "Plante sementes financeiras hoje",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Home,
    title: "Moradia",
    content: "Mantenha custos de moradia abaixo de 30%",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Car,
    title: "Carro",
    content: "Considere custo total de propriedade",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
  {
    icon: Bike,
    title: "Transporte",
    content: "Bicicleta pode economizar muito",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Bus,
    title: "Transporte Público",
    content: "Use quando possível para economizar",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Plane,
    title: "Viagens",
    content: "Planeje viagens com antecedência",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
  },
  {
    icon: Train,
    title: "Mobilidade",
    content: "Compare meios de transporte",
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
  },
  {
    icon: Ship,
    title: "Importação",
    content: "Cuidado com taxas de importação",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Coffee,
    title: "Café",
    content: "Fazer em casa economiza muito no mês",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Beer,
    title: "Lazer",
    content: "Equilibre diversão e economia",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: Pizza,
    title: "Alimentação",
    content: "Cozinhar em casa é mais saudável e barato",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: Apple,
    title: "Saúde",
    content: "Alimentação saudável previne gastos médicos",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
  {
    icon: Cake,
    title: "Comemorações",
    content: "Celebre de forma simples e significativa",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: IceCream,
    title: "Pequenos Prazeres",
    content: "Permita-se com moderação",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Camera,
    title: "Fotografia",
    content: "Use o celular antes de comprar câmera",
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
  },
  {
    icon: Music,
    title: "Entretenimento",
    content: "Assinaturas: avalie se usa mesmo",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Film,
    title: "Cinema",
    content: "Espere sair do streaming",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
  {
    icon: Gamepad,
    title: "Games",
    content: "Espere promoções para comprar jogos",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
  },
  {
    icon: Book,
    title: "Leitura",
    content: "Bibliotecas são gratuitas",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Pen,
    title: "Escrita",
    content: "Anote objetivos financeiros",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Briefcase,
    title: "Trabalho",
    content: "Negocie salário periodicamente",
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
  },
  {
    icon: Medal,
    title: "Reconhecimento",
    content: "Valorize suas conquistas",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: Award,
    title: "Excelência",
    content: "Busque melhorar constantemente",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function DashboardPage() {
  const { status, data } = useSession();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const [summary, setSummary] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    accountCount: 0,
    monthlyBalance: 0, // ✅ NOVO: Saldo do mês (receitas - despesas)
  });
  const [loading, setLoading] = useState(true);

  // Rotacionar dicas a cada 7 segundos - ✅ RESTAURADO
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % financialTips.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // Efeito de mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePosition({ x: x * 30, y: y * 30 });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Buscar resumo
  const fetchSummary = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const accountsRes = await fetch("/api/contas", {
        credentials: "include",
      });
      if (accountsRes.ok) {
        const accounts = await accountsRes.json();
        const totalBalance = Array.isArray(accounts)
          ? accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0)
          : 0;
        setSummary((prev) => ({
          ...prev,
          totalBalance,
          accountCount: Array.isArray(accounts) ? accounts.length : 0,
        }));
      }

      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const transactionsRes = await fetch(
        `/api/transacoes?startDate=${firstDay.toISOString()}&endDate=${lastDay.toISOString()}`,
        { credentials: "include" },
      );
      if (transactionsRes.ok) {
        const result = await transactionsRes.json();
        const transactions = Array.isArray(result)
          ? result
          : result.transactions || [];
        const income = transactions
          .filter((t: any) => t.type === "INCOME" && t.status === "PAID")
          .reduce((sum: number, t: any) => sum + t.amount, 0);
        const expense = transactions
          .filter((t: any) => t.type === "EXPENSE" && t.status === "PAID")
          .reduce((sum: number, t: any) => sum + t.amount, 0);

        // ✅ CALCULAR SALDO DO MÊS
        const monthlyBalance = income - expense;

        setSummary((prev) => ({
          ...prev,
          totalIncome: income,
          totalExpense: expense,
          monthlyBalance,
        }));
      }
    } catch (err) {
      console.error("Erro ao buscar resumo:", err);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSummary();
    }
  }, [status, fetchSummary]);

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/entrar");
    router.refresh();
  };

  const handleNewTransaction = () => {
    router.push("/painel/transacoes?drawer=open");
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
    router.push("/entrar");
    return null;
  }

  const currentTip = financialTips[currentTipIndex];
  const TipIcon = currentTip.icon;

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className="min-h-screen bg-slate-950 overflow-hidden relative"
      >
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-30 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(16, 185, 129, 0.3), transparent 70%)",
              transform: `translate(calc(-50% + ${mousePosition.x}px), calc(-50% + ${mousePosition.y}px))`,
              transition: "transform 0.5s ease-out",
            }}
          />
        </div>

        {/* HEADER - ✅ COM BANNER DE DICAS RESTAURADO */}
        <header className="w-full p-4 border-b border-emerald-500/20 bg-slate-950/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            {/* Linha 1: Logo, Dicas e Botões */}
            <div className="flex items-center justify-between gap-4">
              {/* Logo + Usuário */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    FluxoCerto
                  </h1>
                  <p className="text-xs text-slate-400">
                    Bem-vindo, {data?.user?.name?.split(" ")[0] || "Usuário"}
                  </p>
                </div>
              </div>

              {/* Banner de Dicas - ✅ RESTAURADO E CENTRALIZADO */}
              <div className="flex-1 max-w-3xl mx-auto">
                <div
                  className={`relative p-3 rounded-xl border transition-all duration-700 min-h-[80px] flex items-center ${currentTip.bgColor} ${
                    currentTip.color === "text-amber-400"
                      ? "border-amber-500/30"
                      : currentTip.color === "text-emerald-400"
                        ? "border-emerald-500/30"
                        : currentTip.color === "text-red-400"
                          ? "border-red-500/30"
                          : "border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className={`p-2 rounded-lg bg-slate-900/50 ${currentTip.color} flex-shrink-0`}
                    >
                      <TipIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3
                          className={`font-semibold text-sm ${currentTip.color} flex-shrink-0`}
                        >
                          {currentTip.title}
                        </h3>
                        <div className="flex gap-1 flex-shrink-0">
                          {financialTips.slice(0, 5).map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentTipIndex(index)}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                index === currentTipIndex % 5
                                  ? "bg-emerald-500 w-3"
                                  : "bg-slate-600 hover:bg-slate-500"
                              }`}
                              aria-label={`Ver dica ${index + 1}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 truncate">
                        {currentTip.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={fetchSummary}
                  className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                  title="Atualizar"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:block">Sair</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="relative z-10 p-8">
          <div className="max-w-7xl mx-auto">
            {/* ✅ CARDS DE RESUMO OTIMIZADOS (4 cards - sem "Contas") */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Saldo Total */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800 cursor-help">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">
                        Saldo Total
                      </span>
                      <Wallet className="w-5 h-5 text-emerald-500" />
                    </div>
                    {loading ? (
                      <Skeleton className="h-8 w-full" />
                    ) : (
                      <p
                        className={`text-2xl font-bold ${summary.totalBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {formatCurrency(summary.totalBalance)}
                      </p>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl">
                  <p>Saldo total de todas as contas</p>
                </TooltipContent>
              </Tooltip>

              {/* Receitas do Mês */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800 cursor-help">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">
                        Receitas do Mês
                      </span>
                      <ArrowUpCircle className="w-5 h-5 text-blue-500" />
                    </div>
                    {loading ? (
                      <Skeleton className="h-8 w-full" />
                    ) : (
                      <p className="text-2xl font-bold text-blue-400">
                        {formatCurrency(summary.totalIncome)}
                      </p>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl">
                  <p>Total de receitas este mês</p>
                </TooltipContent>
              </Tooltip>

              {/* Despesas do Mês */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800 cursor-help">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">
                        Despesas do Mês
                      </span>
                      <ArrowDownCircle className="w-5 h-5 text-red-500" />
                    </div>
                    {loading ? (
                      <Skeleton className="h-8 w-full" />
                    ) : (
                      <p className="text-2xl font-bold text-red-400">
                        {formatCurrency(summary.totalExpense)}
                      </p>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl">
                  <p>Total de despesas este mês</p>
                </TooltipContent>
              </Tooltip>

              {/* ✅ NOVO: Saldo do Mês */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800 cursor-help">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">
                        Saldo do Mês
                      </span>
                      {summary.monthlyBalance >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    {loading ? (
                      <Skeleton className="h-8 w-full" />
                    ) : (
                      <p
                        className={`text-2xl font-bold ${summary.monthlyBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {formatCurrency(summary.monthlyBalance)}
                      </p>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl">
                  <p>Diferença entre receitas e despesas do mês</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <BalanceEvolutionChart userId={data?.user?.email || ""} />
              <ExpensesByCategoryChart userId={data?.user?.email || ""} />
            </div>

            {/* Previsão de Saldo */}
            <div className="mb-8">
              <BalanceForecastChart userId={data?.user?.email || ""} />
            </div>

            {/* Insights Automáticos */}
            <div className="mb-8">
              <InsightsPanel userId={data?.user?.email || ""} />
            </div>

            {/* Gamificação */}
            <div className="mb-8">
              <GamificacaoPanel userId={data?.user?.email || ""} />
            </div>

            {/* Atalhos Rápidos - ✅ MANTIDOS INTACTOS (NÃO MEXER) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Transações - ✅ TOOLTIP DESCRITIVO COMPLETO */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/painel/transacoes"
                    className="group p-6 bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all relative block"
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNewTransaction();
                      }}
                      className="absolute top-4 right-4 p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors z-10"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4 mb-4 pr-12">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        Transações
                      </h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      Gerencie receitas e despesas
                    </p>
                    <span className="inline-flex items-center text-sm text-emerald-400 group-hover:translate-x-1 transition-transform">
                      Acessar <ArrowUpRight className="w-4 h-4 ml-1" />
                    </span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl max-w-xs">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-300 mb-1">
                        Gerenciador de Transações
                      </p>
                      <p className="text-sm text-slate-300">
                        Crie, edite e acompanhe todas as suas receitas e
                        despesas com filtros avançados
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Contas - ✅ TOOLTIP DESCRITIVO COMPLETO */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/painel/contas"
                    className="group p-6 bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all relative block"
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push("/painel/contas/nova");
                      }}
                      className="absolute top-4 right-4 p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors z-10"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4 mb-4 pr-12">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                        <Wallet className="w-6 h-6 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        Contas
                      </h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      Contas, cartões e faturas
                    </p>
                    <span className="inline-flex items-center text-sm text-blue-400 group-hover:translate-x-1 transition-transform">
                      Acessar <ArrowUpRight className="w-4 h-4 ml-1" />
                    </span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl max-w-xs">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-300 mb-1">
                        Contas Bancárias
                      </p>
                      <p className="text-sm text-slate-300">
                        Cadastre contas bancárias e cartões de crédito.
                        Acompanhe saldos, faturas, limites e alertas de
                        vencimento
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Categorias - ✅ TOOLTIP DESCRITIVO COMPLETO */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/painel/categorias"
                    className="group p-6 bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all relative block"
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push("/painel/categorias/nova");
                      }}
                      className="absolute top-4 right-4 p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors z-10"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4 mb-4 pr-12">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                        <PieChart className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        Categorias
                      </h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      Organize suas transações
                    </p>
                    <span className="inline-flex items-center text-sm text-purple-400 group-hover:translate-x-1 transition-transform">
                      Acessar <ArrowUpRight className="w-4 h-4 ml-1" />
                    </span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl max-w-xs">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-purple-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-purple-300 mb-1">
                        Categorias Personalizadas
                      </p>
                      <p className="text-sm text-slate-300">
                        Crie e organize categorias para classificar suas
                        receitas e despesas
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* ✅ Card de Dívidas Parceladas - NOVO */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/painel/dividas"
                    className="group p-6 bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10 transition-all relative block"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CreditCard className="w-6 h-6 text-red-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        Dívidas
                      </h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">
                      Financiamentos, empréstimos e parcelamentos
                    </p>
                    <div className="flex items-center gap-2 text-xs text-red-400">
                      <TrendingDown className="w-3 h-3" />
                      <span>Amortização SAC, PRICE e Fixa</span>
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl max-w-xs">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-red-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-300 mb-1">
                        Dívidas Parceladas
                      </p>
                      <p className="text-sm text-slate-300">
                        Gerencie financiamentos e empréstimos com barra de
                        progresso, tabela de amortização e antecipação de
                        parcelas
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* ✅ Card de Compras / Mercado */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/painel/compras"
                    className="group p-6 bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all relative block"
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push("/painel/compras");
                      }}
                      className="absolute top-4 right-4 p-2 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors z-10"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4 mb-4 pr-12">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                        <ShoppingBag className="w-6 h-6 text-orange-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        Compras
                      </h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      Mercado, feira e lista de compras
                    </p>
                    <div className="flex items-center gap-2 text-xs text-orange-400">
                      <ShoppingBag className="w-3 h-3" />
                      <span>Controle de estoque e preços</span>
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl max-w-xs">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-orange-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-300 mb-1">
                        Controle de Compras
                      </p>
                      <p className="text-sm text-slate-300">
                        Registre compras de mercado, feira e supermercado.
                        Controle estoque, compare preços e monte listas
                        inteligentes baseadas no que falta em casa
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* ✅ Card de Metas Financeiras (Dedicado) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/painel/metas"
                    className="group p-6 bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all relative block"
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push("/painel/metas");
                      }}
                      className="absolute top-4 right-4 p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors z-10"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4 mb-4 pr-12">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                        <Target className="w-6 h-6 text-amber-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        Metas
                      </h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      Objetivos e reservas financeiras
                    </p>
                    <div className="flex items-center gap-2 text-xs text-amber-400">
                      <Target className="w-3 h-3" />
                      <span>Progresso e projeção de atingimento</span>
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl max-w-xs">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-300 mb-1">
                        Metas Financeiras
                      </p>
                      <p className="text-sm text-slate-300">
                        Defina objetivos como reserva de emergência, viagem ou
                        investimento. Acompanhe progresso com barra animada,
                        projeção de atingimento e confetti ao conquistar
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* ✅ Card de Relatórios - TOOLTIP DESCRITIVO + LINKS CORRIGIDOS */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="group p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-md rounded-xl border border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/10 transition-all relative">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        Relatórios
                      </h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">
                      Analise seus dados financeiros
                    </p>
                    {/* Links de Relatórios */}
                    <div className="space-y-2">
                      <Link
                        href="/painel/relatorios"
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors group/link"
                      >
                        <div className="flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm text-slate-300">
                            Gerar Relatórios PDF/CSV
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                      <Link
                        href="/painel/metas"
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors group/link"
                      >
                        <div className="flex items-center gap-2">
                          <TargetIcon className="w-4 h-4 text-amber-400" />
                          <span className="text-sm text-slate-300">
                            Metas Financeiras
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl max-w-xs">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-300 mb-1">
                        Relatórios e Análises
                      </p>
                      <p className="text-sm text-slate-300">
                        Acesse relatórios mensais, por categoria, exporte dados
                        e acompanhe metas financeiras
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* ✅ Calculadora Financeira */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/painel/ferramentas/calculadora"
                    className="group p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-md rounded-xl border border-indigo-500/30 hover:border-indigo-500/60 hover:shadow-lg hover:shadow-indigo-500/10 transition-all relative block"
                  >
                    <div className="absolute top-3 right-3 px-2 py-1 text-xs rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium">
                      Enterprise
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Calculator className="w-6 h-6 text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        Calculadora Financeira
                      </h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      Simulador de Juros e Amortização SAC
                    </p>
                    <span className="inline-flex items-center text-sm text-indigo-400 group-hover:translate-x-1 transition-transform">
                      Acessar Ferramenta{" "}
                      <ArrowUpRight className="w-4 h-4 ml-1" />
                    </span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl max-w-xs">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-indigo-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-indigo-300 mb-1">
                        Calculadora Financeira
                      </p>
                      <p className="text-sm text-slate-300">
                        Simule juros compostos e visualize tabelas de
                        amortização SAC, PRICE e Fixa para planejar seus
                        investimentos
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* ✅ Meus Relatórios */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/painel/relatorios/historico"
                    className="group p-6 bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 hover:border-slate-500/50 hover:shadow-lg transition-all relative block"
                  >
                    <div className="flex items-center gap-4 mb-4 pr-12">
                      <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                        <Clock className="w-6 h-6 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        Meus Relatórios
                      </h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      Acesse PDFs e CSVs extraídos
                    </p>
                    <span className="inline-flex items-center text-sm text-slate-400 group-hover:translate-x-1 transition-transform">
                      Ver Histórico <ArrowUpRight className="w-4 h-4 ml-1" />
                    </span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl max-w-xs">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-300 mb-1">
                        Histórico de Relatórios
                      </p>
                      <p className="text-sm text-slate-300">
                        Acesse todos os relatórios já gerados em PDF e CSV, com
                        filtros por período e tipo
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* ✅ Card de Assinaturas */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/painel/assinaturas"
                    className="group p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-md rounded-xl border border-cyan-500/30 hover:border-cyan-500/60 hover:shadow-lg hover:shadow-cyan-500/10 transition-all relative block"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CreditCard className="w-6 h-6 text-cyan-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        Assinaturas
                      </h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      Controle gastos recorrentes
                    </p>
                    <div className="flex items-center gap-2 text-xs text-cyan-400">
                      <Zap className="w-3 h-3" />
                      <span>Alertas de renovação automáticos</span>
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl max-w-xs">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-cyan-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-cyan-300 mb-1">
                        Gerenciador de Assinaturas
                      </p>
                      <p className="text-sm text-slate-300">
                        Cadastre e acompanhe suas assinaturas recorrentes com
                        alertas de renovação e comparativo de gastos mensal vs
                        anual
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* ✅ Card de Patrimônio */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/painel/patrimonio"
                    className="group p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-md rounded-xl border border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/10 transition-all relative block"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <WalletIcon className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        Patrimônio
                      </h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      Ativos - Passivos = Patrimônio Líquido
                    </p>
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <TrendingUpIcon className="w-3 h-3" />
                      <span>Visão completa das suas finanças</span>
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl max-w-xs">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-300 mb-1">
                        Patrimônio Líquido
                      </p>
                      <p className="text-sm text-slate-300">
                        Visualize seus ativos menos passivos com breakdown por
                        tipo de conta e gráfico de composição
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
