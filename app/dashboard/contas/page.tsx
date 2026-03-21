"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

// Tipo para a conta (vamos mover para um arquivo types/ depois)
interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  balanceFormatted: number;
  color: string;
  icon: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    transactions: number;
  };
}

export default function AccountsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Buscar contas ao carregar a página
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchAccounts();
    }
  }, [status, router]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/accounts");
      
      if (!res.ok) {
        throw new Error("Erro ao buscar contas");
      }
      
      const data = await res.json();
      setAccounts(data);
      setError("");
    } catch (err) {
      setError("Não foi possível carregar suas contas");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Formatar moeda para BRL
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Ícones mapeados (Lucide React)
  const getIcon = (iconName: string | null) => {
    const icons: Record<string, JSX.Element> = {
      wallet: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      "piggy-bank": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      "credit-card": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      banknote: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    };
    return icons[iconName || ""] || icons.wallet;
  };

  // Função para arquivar conta
  const handleArchive = async (accountId: string, accountName: string) => {
    if (!confirm(`Tem certeza que deseja arquivar "${accountName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        // Recarregar lista
        fetchAccounts();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao arquivar conta");
      }
    } catch (err) {
      alert("Erro ao arquivar conta");
      console.error(err);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-emerald-400 text-xl animate-pulse">Carregando contas...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // Redirecionamento em andamento
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(16, 185, 129, 0.2), transparent 70%)" }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full p-6 flex justify-between items-center backdrop-blur-sm bg-slate-950/50 border-b border-emerald-500/20">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              FluxoCerto
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-300 hidden sm:block">{session?.user?.name}</span>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
          >
            Dashboard
          </button>
          <Link
            href="/dashboard/contas/nova"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-lg hover:shadow-emerald-500/30"
          >
            + Nova Conta
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="relative z-10 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Título */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Minhas Contas</h1>
            <p className="text-slate-400">Gerencie suas contas bancárias e cartões</p>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              {error}
              <button 
                onClick={fetchAccounts}
                className="ml-4 underline hover:text-red-300"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Lista de Contas */}
          {accounts.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Nenhuma conta cadastrada</h3>
              <p className="text-slate-400 mb-6">Comece adicionando sua primeira conta bancária</p>
              <Link
                href="/dashboard/contas/nova"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Adicionar Conta
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="group relative p-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl"
                  style={{ borderColor: `${account.color}40` }}
                >
                  {/* Cor de destaque */}
                  <div 
                    className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
                    style={{ backgroundColor: account.color }}
                  />
                  
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: `${account.color}20`, color: account.color }}
                    >
                      {getIcon(account.icon)}
                    </div>
                    
                    {/* Botões de Ação - ATUALIZADOS */}
                    <div className="flex gap-2">
                      {/* Botão Editar - Link para página de edição */}
                      <Link
                        href={`/dashboard/contas/${account.id}/editar`}
                        className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Editar conta"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      
                      {/* Botão Arquivar - Chama função de delete */}
                      <button
                        onClick={() => handleArchive(account.id, account.name)}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        title="Arquivar conta"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-1">{account.name}</h3>
                  <p className="text-sm text-slate-400 mb-4 capitalize">
                    {account.type.replace("_", " ").toLowerCase()}
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Saldo</span>
                      <span className={`text-xl font-bold ${account.balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {formatCurrency(account.balanceFormatted)}
                      </span>
                    </div>
                    
                    {account._count?.transactions !== undefined && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Transações</span>
                        <span className="text-slate-300">{account._count.transactions}</span>
                      </div>
                    )}
                  </div>

                  {/* Link para ver transações da conta */}
                  <Link
                    href={`/dashboard/transacoes?conta=${account.id}`}
                    className="mt-4 block text-center text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Ver transações →
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Total Geral */}
          {accounts.length > 0 && (
            <div className="mt-8 p-6 bg-slate-900/50 rounded-2xl border border-emerald-500/20">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Saldo Total</span>
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(
                    accounts.reduce((sum, acc) => sum + acc.balanceFormatted, 0)
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}