"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/componentes/ui/skeleton";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Plus,
  RefreshCw,
  Edit2,
  Archive,
  Activity,
  Zap,
  Cpu,
  Shield,
  CreditCard as CardIcon,
  AlertTriangle,
  Eye,
  Trash2,
  ArrowUpRight,
  PiggyBank,
  Banknote,
  Landmark,
  Coins,
  Building2,
  Globe,
  Heart,
  Utensils,
  ShoppingCart,
  Car,
  Plane,
  Smartphone,
  GraduationCap,
  ShieldCheck,
  Home,
  Briefcase,
  Stethoscope,
  Music,
  Gift,
  Coffee,
  Dumbbell,
  Rocket,
  Anchor
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/componentes/ui/tooltip";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import { NeuralLoading } from "@/app/painel/_componentes/NeuralLoading";
// ✅ IMPORT DOS MODAIS FUTURISTAS
import NewAccountModal from "./_componentes/NewAccountModal";
import EditAccountModal from "./_componentes/EditAccountModal";
import { PluggyConnect } from "./_componentes/PluggyConnect";
import { useSearchParams } from "next/navigation";

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
// MAPEAMENTO DE ÍCONES
// ============================================
const getIcon = (iconName: string | null) => {
  const icons: Record<string, any> = {
    wallet: Wallet,
    "piggy-bank": PiggyBank,
    "credit-card": CardIcon,
    banknote: Banknote,
    landmark: Landmark,
    coins: Coins,
    "building-2": Building2,
    globe: Globe,
    zap: Zap,
    heart: Heart,
    utensils: Utensils,
    "shopping-cart": ShoppingCart,
    car: Car,
    plane: Plane,
    smartphone: Smartphone,
    "graduation-cap": GraduationCap,
    "trending-up": TrendingUp,
    "shield-check": ShieldCheck,
    home: Home,
    briefcase: Briefcase,
    stethoscope: Stethoscope,
    music: Music,
    gift: Gift,
    coffee: Coffee,
    dumbbell: Dumbbell,
    cpu: Cpu,
    rocket: Rocket,
    anchor: Anchor,
  };

  const Icon = icons[iconName || "wallet"] || Wallet;
  return <Icon className="w-6 h-6" />;
};

// ============================================
// CONTEÚDO DA PÁGINA (WRAPPER PARA SUSPENSE)
// ============================================
function AccountsPageContent() {
  const { status, data } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [hiddenBalances, setHiddenBalances] = useState<Record<string, boolean>>(
    {},
  );

  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPluggy, setShowPluggy] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  // ✅ ESTADO PARA DADOS DE FATURA DOS CARTÕES
  const [cartaoData, setCartaoData] = useState<Record<string, any>>({});

  // ============================================
  // BUSCAR CONTAS (CORRIGIDO)
  // ============================================
  const fetchAccounts = useCallback(async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/contas?includeArchived=${showArchived}`,
        { credentials: "include" },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao buscar contas");
      }

      const result = await response.json();

      // ✅ CORREÇÃO: API retorna array direto, não objeto { accounts: [...] }
      const accountsData = Array.isArray(result)
        ? result
        : result.accounts || [];

      console.log("📊 Contas carregadas:", accountsData.length);
      setAccounts(accountsData);
    } catch (err) {
      console.error("❌ Erro ao buscar contas:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [status, showArchived]);

  // ============================================
  // BUSCAR DADOS DE FATURA DOS CARTÕES
  // ============================================
  const fetchCartaoData = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/cartoes", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, any> = {};
        (data.cartoes || []).forEach((c: any) => {
          map[c.id] = c;
        });
        setCartaoData(map);
      }
    } catch {}
  }, [status]);

  // ============================================
  // EFFECT
  // ============================================
  useEffect(() => {
    if (status === "authenticated") {
      fetchAccounts();
      fetchCartaoData();
    }
  }, [status, fetchAccounts, fetchCartaoData]);

  // Verificar se deve abrir o connect via URL
  useEffect(() => {
    if (searchParams.get("action") === "connect") {
       setShowPluggy(true);
       // Limpar URL sem recarregar
       router.replace("/painel/contas");
    }
  }, [searchParams, router]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleArchive = async (accountId: string) => {
    if (!confirm("Tem certeza que deseja arquivar esta conta?")) return;

    try {
      const response = await fetch(`/api/contas/${accountId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao arquivar conta");
      }

      fetchAccounts();
    } catch (err) {
      console.error("Erro ao arquivar:", err);
      alert("Erro ao arquivar conta");
    }
  };

  const handleDeletePermanent = async (accountId: string) => {
    if (
      !confirm(
        "⚠️ ATENÇÃO: Esta é uma EXCLUSÃO PERMANENTE.\nA conta será destruída para sempre e não poderá ser recuperada. Continuar?",
      )
    )
      return;

    try {
      const response = await fetch(
        `/api/contas/${accountId}/exclusao-permanente`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir conta");
      }

      fetchAccounts();
    } catch (err) {
      console.error("Erro ao excluir:", err);
      alert("Erro ao excluir conta permanentemente");
    }
  };

  const handleRestore = async (accountId: string) => {
    if (!confirm("Deseja restaurar esta conta arquivada?")) return;

    try {
      const response = await fetch(`/api/contas/${accountId}/restaurar`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao restaurar conta");
      }

      fetchAccounts();
    } catch (err) {
      console.error("Erro ao restaurar:", err);
      alert("Erro ao restaurar conta");
    }
  };

  const toggleBalanceVisibility = (accountId: string) => {
    setHiddenBalances((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  const handleEdit = (account: any) => {
    setSelectedAccount(account);
    setShowEditModal(true);
  };

  // ============================================
  // RENDER: LOADING
  // ============================================
  if (status === "loading") {
    return <NeuralLoading message="Sincronizando Nódulos de Contas..." variant="full" />;
  }

  // ============================================
  // RENDER: NÃO AUTENTICADO
  // ============================================
  if (status === "unauthenticated") {
    router.push("/entrar");
    return null;
  }

  // ============================================
  // RENDER: PRINCIPAL
  // ============================================
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-950">
        {/* Header Componentizado com Breadcrumbs Automáticos */}
        <PageHeader 
          title="Contas Bancárias" 
          description="Gerencie suas contas bancárias e cartões"
          breadcrumbs={[ { label: "Contas Bancárias" } ]}
        >
          {/* Toggle: Ativas / Arquivadas */}
          <div className="flex items-center gap-2 mr-2">
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setShowArchived(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!showArchived ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                <Wallet className="w-3 h-3" />
                Ativas
                {accounts.filter((a) => a.isActive).length > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${!showArchived ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300"}`}>
                    {accounts.filter((a) => a.isActive).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowArchived(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${showArchived ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                <Archive className="w-3 h-3" />
                Lixeira
                {accounts.filter((a) => !a.isActive).length > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${showArchived ? "bg-amber-500 text-white" : "bg-slate-700 text-slate-300"}`}>
                    {accounts.filter((a) => !a.isActive).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <button
            onClick={fetchAccounts}
            className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowPluggy(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all"
              >
                <Landmark className="w-4 h-4" />
                <span className="hidden sm:block">Conectar Banco</span>
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl">
              <p>Conectar conta via Open Finance (Pluggy)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowNewAccountModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:block">Nova Conta</span>
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl">
              <p>Cadastrar nova conta bancária</p>
            </TooltipContent>
          </Tooltip>
        </PageHeader>

        {/* Conteúdo Principal */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mensagem de Info */}
          {showArchived && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-400">
                  Visualizando contas arquivadas
                </p>
                <p className="text-xs text-amber-300 mt-1">
                  Contas arquivadas não aparecem no dashboard. Você pode
                  restaurá-las.
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="ml-3 text-slate-400">Carregando contas...</span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-6">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
                <button
                  onClick={fetchAccounts}
                  className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && accounts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Wallet className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {showArchived
                  ? "Nenhuma conta arquivada"
                  : "Nenhuma conta cadastrada"}
              </h3>
              <p className="text-slate-400 text-center mb-4">
                {showArchived
                  ? "Contas arquivadas aparecerão aqui"
                  : "Comece adicionando sua primeira conta bancária"}
              </p>
              {/* ✅ BOTÃO NO EMPTY STATE TAMBÉM ABRE O MODAL */}
              {!showArchived && (
                <button
                  onClick={() => setShowNewAccountModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Nova Conta
                </button>
              )}
            </div>
          )}

          {/* Grid de Cards HUD 2.0 */}
          {!loading && !error && accounts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts
                .filter((account) =>
                  showArchived ? !account.isActive : account.isActive,
                )
                .map((account) => (
                  <div key={account.id} className="relative group">
                    <div
                      className={`relative p-6 bg-slate-950/40 backdrop-blur-2xl rounded-3xl border transition-all duration-500 overflow-hidden ${
                        account.isActive
                          ? "border-white/5 hover:border-emerald-500/30"
                          : "border-amber-500/20 bg-amber-500/5"
                      }`}
                      style={{
                        boxShadow: account.isActive ? `0 0 40px rgba(0,0,0,0.2)` : `0 0 20px rgba(245,158,11,0.1)`
                      }}
                    >
                      {/* Laser Scan Animation */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                        style={{ skewX: -20 }}
                      />

                      {/* Badge de Arquivado */}
                      {!account.isActive && (
                        <div className="absolute top-4 right-4 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)] z-10">
                          Offline
                        </div>
                      )}

                      {/* Header do Card */}
                      <div className="flex items-start justify-between mb-6 relative z-10">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(0,0,0,0.3)] border border-white/5 relative group-hover:scale-110 transition-transform duration-500"
                          style={{
                            backgroundColor: `${account.color}15`,
                            color: account.color,
                            boxShadow: `0 0 20px ${account.color}20`
                          }}
                        >
                          {getIcon(account.icon)}
                          {/* Pulsing Dot */}
                          {account.isActive && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-950" style={{ backgroundColor: account.color }}>
                              <div className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: account.color }} />
                            </div>
                          )}
                        </div>

                        {/* Ações Neural */}
                        <div className="flex items-center gap-1 bg-slate-950/50 backdrop-blur-md p-1 rounded-xl border border-white/5 opacity-40 group-hover:opacity-100 transition-opacity">
                          {account.isActive ? (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleBalanceVisibility(account.id); }}
                                className="p-2 text-slate-500 hover:text-blue-400 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEdit(account); }}
                                className="p-2 text-slate-500 hover:text-emerald-400 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleArchive(account.id); }}
                                className="p-2 text-slate-500 hover:text-amber-500 transition-colors"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRestore(account.id); }}
                                className="p-2 text-slate-500 hover:text-emerald-400 transition-colors"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeletePermanent(account.id); }}
                                className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Identificação */}
                      <div className="mb-6 relative z-10">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors mb-1">
                          {account.name}
                        </h3>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                             {account.type === "CREDIT_CARD" ? "Neural Card" : "Vault Node"}
                           </span>
                           <span className="text-[9px] font-medium text-slate-600 italic">
                             ID: {account.id.slice(0, 8)}
                           </span>
                        </div>
                      </div>

                      {/* Saldo Principal */}
                      <div className="mb-6 p-4 bg-white/[0.02] rounded-2xl border border-white/5 relative z-10 group/balance overflow-hidden transition-all hover:bg-white/[0.04]">
                         <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: account.color }} />
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Poder de Fluxo</p>
                         <div className="flex items-baseline justify-between">
                            <p
                              className={`text-2xl font-black tabular-nums tracking-tighter ${
                                account.balance >= 0 ? "text-emerald-400" : "text-red-500"
                              }`}
                              style={{ textShadow: `0 0 20px ${account.balance >= 0 ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}
                            >
                              {hiddenBalances[account.id] ? "••••••" : formatCurrency(account.balance)}
                            </p>
                            <Link
                              href={`/painel/transacoes?conta=${account.id}`}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-all"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </Link>
                         </div>
                      </div>

                      {/* Info Cartão Premium */}
                      {account.type === "CREDIT_CARD" && cartaoData[account.id] && (
                        <div className="space-y-4 pt-2 relative z-10">
                          {/* Limite Neural */}
                          {cartaoData[account.id].limite?.total > 0 && (
                            <div>
                               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                  <span className="text-slate-500">Capacidade de Crédito</span>
                                  <span className={cartaoData[account.id].limite.percentualUsado > 80 ? "text-red-400" : "text-slate-300"}>
                                    {cartaoData[account.id].limite.percentualUsado}%
                                  </span>
                               </div>
                               <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-[1.5px] border border-white/5">
                                 <motion.div
                                   initial={{ width: 0 }}
                                   animate={{ width: `${Math.min(100, cartaoData[account.id].limite.percentualUsado)}%` }}
                                   transition={{ duration: 1.5, ease: "easeOut" }}
                                   className={`h-full rounded-full shadow-[0_0_10px_currentColor]`}
                                   style={{ 
                                     background: cartaoData[account.id].limite.percentualUsado > 90 ? '#EF4444' : (cartaoData[account.id].limite.percentualUsado > 70 ? '#F59E0B' : account.color),
                                     color: cartaoData[account.id].limite.percentualUsado > 90 ? '#EF4444' : (cartaoData[account.id].limite.percentualUsado > 70 ? '#F59E0B' : account.color)
                                   }}
                                 />
                               </div>
                               <div className="flex justify-between text-[9px] font-black text-slate-600 mt-2 uppercase tracking-widest">
                                  <span>Usado: {formatCurrency(cartaoData[account.id].limite.total - cartaoData[account.id].limite.disponivel)}</span>
                                  <span>Livre: {formatCurrency(cartaoData[account.id].limite.disponivel)}</span>
                               </div>
                            </div>
                          )}

                          {/* Fatura HUD */}
                          <div className="grid grid-cols-2 gap-3">
                             <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Fatura Atual</p>
                                <p className="text-sm font-black text-white">
                                  {hiddenBalances[account.id] ? "•••" : formatCurrency(cartaoData[account.id].faturaAtual?.total || 0)}
                                </p>
                             </div>
                             <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Reset Ciclo</p>
                                <p className="text-sm font-black text-blue-400">
                                  {cartaoData[account.id].faturaAtual?.vencimento ? new Date(cartaoData[account.id].faturaAtual.vencimento).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' }) : "N/D"}
                                </p>
                             </div>
                          </div>
                        </div>
                      )}

                      {/* Footer Metadata */}
                      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-600 relative z-10">
                        <div className="flex items-center gap-1.5 font-medium italic lowercase text-[10px]">
                           <Activity className="w-3 h-3" />
                           last_sync: {new Date(account.updatedAt || account.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                        {account.provider ? (
                           <span className="text-emerald-400 font-bold group-hover:animate-pulse">LINKED: {account.provider}</span>
                        ) : account.isActive ? (
                           <span className="text-emerald-500/50 group-hover:text-emerald-400 transition-colors">Neural_Active</span>
                        ) : (
                           <span className="text-amber-500/50">Node_Offline</span>
                        )}
                      </div>

                      {/* Glow Line Bottom Individual */}
                      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-slate-800/30 overflow-hidden">
                           <motion.div 
                             className="h-full"
                             style={{ backgroundColor: account.color }}
                             initial={{ x: "-100%" }}
                             whileHover={{ x: "0%" }}
                             transition={{ duration: 0.6 }}
                           />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Resumo Neural no Rodapé */}
          {!loading && !error && accounts.length > 0 && !showArchived && (
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="mt-12 p-8 bg-slate-950/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                      <Shield className="w-8 h-8 text-blue-400" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Capacidade Operacional</p>
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">
                        <span className="text-blue-400">{accounts.filter((a) => a.isActive).length}</span> NÓDULOS_SYNC ATIVOS
                      </h4>
                   </div>
                </div>
                
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Poder de Fluxo Total</p>
                  <div className="flex items-baseline gap-3">
                    <span 
                      className={`text-3xl font-black tabular-nums tracking-tighter ${
                        accounts.reduce((sum, a) => sum + (a.isActive ? a.balance : 0), 0) >= 0 ? "text-emerald-400" : "text-red-500"
                      }`}
                      style={{ textShadow: `0 0 30px ${accounts.reduce((sum, a) => sum + (a.isActive ? a.balance : 0), 0) >= 0 ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}
                    >
                      {formatCurrency(accounts.reduce((sum, a) => sum + (a.isActive ? a.balance : 0), 0))}
                    </span>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2 py-1 bg-white/5 rounded-lg">BRL_CORE</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </main>

        <NewAccountModal
          isOpen={showNewAccountModal}
          onClose={() => {
            setShowNewAccountModal(false);
            fetchAccounts();
          }}
        />

        {/* ✅ MODAL FUTURISTA PARA EDITAR CONTA */}
        <EditAccountModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAccount(null);
            fetchAccounts();
          }}
          account={selectedAccount}
        />
      </div>
    </TooltipProvider>
  );
}

// ============================================
// COMPONENTE PRINCIPAL (COM BOUNDARY)
// ============================================
export default function AccountsPage() {
  return (
    <Suspense fallback={<NeuralLoading message="Acessando Nótulos Bancários..." variant="full" />}>
      <AccountsPageContent />
    </Suspense>
  );
}
