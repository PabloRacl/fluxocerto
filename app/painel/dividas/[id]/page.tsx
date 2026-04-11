"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import {
  TooltipProvider,
} from "@/componentes/ui/tooltip";
import {
  DollarSign,
  TrendingDown,
  CheckCircle2,
  Calendar,
  CreditCard,
  ArrowDownToLine,
  Percent,
} from "lucide-react";

// ============================================
// TIPOS
// ============================================
interface Parcela {
  numero: number;
  prestacao: number;
  amortizacao: number;
  juros: number;
  saldoDevedor: number;
  paga: boolean;
}

interface DebtDetail {
  id: string;
  name: string;
  totalAmount: number;
  installmentValue: number;
  installmentTotal: number;
  installmentPaid: number;
  interestRate: number | null;
  amortizationType: string | null;
  allowsPrepayment: boolean;
  startDate: string;
  nextDueDate: string;
  endDate: string | null;
  status: string;
  isPaidOff: boolean;
  creditor: string | null;
  account: { id: string; name: string; color: string };
  category: { id: string; name: string; color: string };
}

// ============================================
// HELPERS
// ============================================
function formatCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v / 100);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("pt-BR");
}

// ============================================
// SKELETON
// ============================================
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-800 rounded-xl ${className}`} />;
}

// ============================================
// PÁGINA DE DETALHE
// ============================================
export default function DetalhesDividaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [divida, setDivida] = useState<DebtDetail | null>(null);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDetalhe = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dividas/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Dívida não encontrada");
      const data = await res.json();
      setDivida(data.divida);
      setParcelas(data.parcelas || []);
      setResumo(data.resumo || null);
      setError("");
    } catch (err) {
      setError("Não foi possível carregar os detalhes");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/entrar");
      return;
    }
    if (status === "authenticated" && id) {
      fetchDetalhe();
    }
  }, [status, id, fetchDetalhe, router]);

  const handlePayInstallment = async (qtd: number = 1) => {
    if (!confirm(`Registrar pagamento de ${qtd} parcela(s)?`)) return;
    try {
      const res = await fetch(`/api/dividas/${id}/pagar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tipo: qtd > 1 ? "ANTECIPAR" : "PAGAR_PARCELA", quantidadeParcelas: qtd }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.quitada) alert("🎉 Parabéns! Dívida quitada!");
        if (data.economia > 0) alert(`💰 Economia estimada com antecipação: ${formatCurrency(data.economia)}`);
        fetchDetalhe();
      } else {
        alert(data.error || "Erro ao registrar pagamento");
      }
    } catch { alert("Erro ao pagar"); }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <PageHeader title="Carregando..." subtitle="" onBack={() => router.push("/painel/dividas")} />
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !divida) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <PageHeader title="Erro" subtitle="" onBack={() => router.push("/painel/dividas")} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <p className="text-red-400">{error || "Dívida não encontrada"}</p>
          </div>
        </div>
      </div>
    );
  }

  const progresso = resumo?.progresso || 0;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <PageHeader
          title={divida.name}
          subtitle={divida.creditor ? `Credor: ${divida.creditor}` : "Detalhes da dívida"}
          onBack={() => router.push("/painel/dividas")}
          onRefresh={fetchDetalhe}
          extraActions={
            !divida.isPaidOff ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePayInstallment(1)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg transition-all"
                >
                  <DollarSign className="w-4 h-4" />
                  Pagar Parcela
                </button>
                {divida.allowsPrepayment && (
                  <button
                    onClick={() => {
                      const qtd = prompt("Quantas parcelas deseja antecipar?", "2");
                      if (qtd && parseInt(qtd) > 0) handlePayInstallment(parseInt(qtd));
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg transition-all"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    Antecipar
                  </button>
                )}
              </div>
            ) : undefined
          }
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Cards de Resumo */}
          {resumo && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 mb-1">
                  <Percent className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Progresso</span>
                </div>
                <p className="text-xl font-bold text-white">{progresso}%</p>
                <div className="w-full h-2 mt-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all" style={{ width: `${progresso}%` }} />
                </div>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-400">Total Pago</span>
                </div>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(resumo.totalPago)}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-slate-400">Restante</span>
                </div>
                <p className="text-xl font-bold text-red-400">{formatCurrency(resumo.totalRestante)}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-400">Juros Totais</span>
                </div>
                <p className="text-xl font-bold text-amber-400">{formatCurrency(resumo.totalJuros)}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-slate-400">Parcelas Restantes</span>
                </div>
                <p className="text-xl font-bold text-blue-400">{resumo.parcelasRestantes}</p>
              </div>
            </div>
          )}

          {/* Tabela de Amortização */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">📊 Tabela de Amortização</h2>
              <p className="text-sm text-slate-400">
                {divida.amortizationType ? `Sistema ${divida.amortizationType}` : "Parcelas Fixas"}
                {divida.interestRate ? ` • ${Number(divida.interestRate)}% a.m.` : ""}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Nº</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Prestação</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Amortização</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Juros</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Saldo Devedor</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parcelas.map((p) => (
                    <tr
                      key={p.numero}
                      className={`border-b border-slate-800/50 transition-colors ${
                        p.paga ? "bg-emerald-500/5" : "hover:bg-slate-800/30"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-white font-medium">{p.numero}</td>
                      <td className="px-4 py-3 text-sm text-right text-white">{formatCurrency(p.prestacao)}</td>
                      <td className="px-4 py-3 text-sm text-right text-slate-300">{formatCurrency(p.amortizacao)}</td>
                      <td className="px-4 py-3 text-sm text-right text-amber-400">{formatCurrency(p.juros)}</td>
                      <td className="px-4 py-3 text-sm text-right text-slate-300">{formatCurrency(p.saldoDevedor)}</td>
                      <td className="px-4 py-3 text-center">
                        {p.paga ? (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400">
                            ✅ Paga
                          </span>
                        ) : p.numero === divida.installmentPaid + 1 ? (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400 animate-pulse">
                            ▶ Atual
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-400">
                            Pendente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
