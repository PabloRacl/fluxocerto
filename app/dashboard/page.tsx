"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-emerald-400 text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background com gradiente */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-30 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(16, 185, 129, 0.3), transparent 70%)" }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full p-6 flex justify-between items-center backdrop-blur-sm bg-slate-950/50 border-b border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            FluxoCerto
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-white font-medium">{session?.user?.name || "Usuário"}</p>
            <p className="text-slate-400 text-sm">{session?.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="relative z-10 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Boas-vindas */}
          <div className="text-center space-y-4 py-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Bem-vindo ao seu{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>
            <p className="text-xl text-slate-400">
              Seu controle financeiro começa aqui
            </p>
          </div>

          {/* Cards de Navegação */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 - Transações */}
            <Link href="/dashboard/transacoes" className="group p-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-emerald-500/20 hover:border-emerald-500/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 3.666V14m-6.118 4.134l.692-2.768a2 2 0 011.94-1.516h2.972a2 2 0 011.94 1.516l.692 2.768M3.056 13h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Transações</h3>
              <p className="text-slate-400">Gerencie receitas e despesas</p>
            </Link>

            {/* Card 2 - Compras */}
            <Link href="/dashboard/compras" className="group p-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-teal-500/20 hover:border-teal-500/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/20">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Compras</h3>
              <p className="text-slate-400">Registre compras com itens</p>
            </Link>

            {/* Card 3 - Dívidas */}
            <Link href="/dashboard/dividas" className="group p-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-green-500/20 hover:border-green-500/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-green-500/20">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM6.506 19.192a7.5 7.5 0 1110.606-10.606 7.5 7.5 0 01-10.606 10.606z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Dívidas</h3>
              <p className="text-slate-400">Controle parcelas e amortização</p>
            </Link>

            {/* Card 4 - Budget */}
            <Link href="/dashboard/budget" className="group p-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-emerald-500/20 hover:border-emerald-500/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Orçamento</h3>
              <p className="text-slate-400">Acompanhe seu budget mensal</p>
            </Link>

            {/* Card 5 - Dashboard */}
            <Link href="/dashboard/relatorios" className="group p-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-teal-500/20 hover:border-teal-500/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/20">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Relatórios</h3>
              <p className="text-slate-400">Gráficos e indicadores</p>
            </Link>

            {/* Card 6 - Configurações */}
            <Link href="/dashboard/configuracoes" className="group p-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-500/20 hover:border-slate-500/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-500/20">
              <div className="w-14 h-14 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Configurações</h3>
              <p className="text-slate-400">Ajustes da sua conta</p>
            </Link>
          </div>

          {/* Status da Sessão */}
          <div className="p-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-emerald-500/20">
            <h3 className="text-lg font-bold text-white mb-4">Informações da Sessão</h3>
            <div className="space-y-2 text-sm">
              <p className="text-slate-400">
                <span className="text-emerald-400">Usuário:</span> {session?.user?.name || "N/A"}
              </p>
              <p className="text-slate-400">
                <span className="text-emerald-400">Email:</span> {session?.user?.email || "N/A"}
              </p>
              <p className="text-slate-400">
                <span className="text-emerald-400">Status:</span>{" "}
                <span className="text-green-400">● Autenticado</span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}