"use client";

import { useState } from "react";
import useSWR from "swr";
import { Users, Trash2, ShieldAlert, ChevronLeft, Search, Info, X } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/biblioteca/http-client";
import Link from "next/link";
import { BrandLogo } from "@/app/_componentes/BrandLogo";

const fetcher = (url: string) => api.get<any[]>(url);

export default function AdminDashboardPage() {
  const { data: users, error, mutate } = useSWR("/api/admin/users", fetcher);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showPlanInfo, setShowPlanInfo] = useState(false);

  const handleUpdate = async (userId: string, changes: { role?: string, plan?: string }) => {
    setLoadingAction(userId);
    try {
      await api.patch('/api/admin/users', { userId, ...changes });
      await mutate();
    } catch (err) {
      alert("Erro ao atualizar usuário");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("⚠️ Tem certeza que deseja apagar este usuário DEFINITIVAMENTE?\n\nTodo o controle financeiro dele será apagado do banco de dados e isso não pode ser desfeito.")) return;
    
    setLoadingAction(userId);
    try {
      await api.delete(`/api/admin/users?userId=${userId}`);
      await mutate();
    } catch (err) {
      alert("Erro ao remover usuário");
    } finally {
      setLoadingAction(null);
    }
  };

  if (error) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4 animate-pulse" />
      <h2 className="text-2xl font-black text-white tracking-widest uppercase">Acesso Bloqueado</h2>
      <p className="text-slate-400 mt-2">Você precisa ser um Administrador Supremo.</p>
      <Link href="/painel" className="mt-8 text-emerald-400 font-bold hover:underline">Voltar para o Painel</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-x-hidden pb-12">
      {/* Glow Neural no Fundo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Header Minimalista Admin */}
      <header className="relative z-10 w-full p-4 border-b border-indigo-500/20 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              href="/painel" 
              className="group flex items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
            </Link>
            <BrandLogo size="md" />
          </div>
          <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30">
            <span className="text-xs font-black text-indigo-400 tracking-widest uppercase">Admin Terminal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 p-4 sm:p-8 max-w-7xl mx-auto space-y-8 mt-4">
        
        {/* Superior: Título & Cards Stat */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3 justify-center md:justify-start">
              Controle <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-500">Global</span>
            </h1>
            <p className="text-sm font-medium text-slate-400 mt-2 max-w-lg">
              Painel de superusuário para gestão de identidades, alteração de planos e moderação do FluxoCerto.
            </p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <button 
              onClick={() => setShowPlanInfo(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 transition-all font-bold text-xs uppercase"
            >
              <Info className="w-4 h-4" /> Entender Planos
            </button>
            <div className="flex-1 md:flex-none bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 flex items-center gap-4 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              <div className="p-3 bg-indigo-500/20 rounded-2xl">
                <Users className="text-indigo-400 w-6 h-6"/>
              </div>
              <div>
                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest border-b border-slate-800 pb-1 mb-1">Cidadãos</p>
                 {!users ? (
                   <div className="h-6 w-12 bg-slate-800 rounded animate-pulse" />
                 ) : (
                   <p className="text-2xl text-white font-black leading-none">{users.length}</p>
                 )}
              </div>
            </div>
          </div>
        </div>

        {/* Neural Table Container */}
        {!users ? (
          <div className="w-full flex justify-center py-20">
            <div className="flex flex-col items-center gap-4">
               <ShieldAlert className="w-12 h-12 text-indigo-500 animate-pulse" />
               <span className="text-sm font-bold text-indigo-400 tracking-widest uppercase animate-pulse">Estabelecendo Conexão Neural...</span>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl relative"
          >
            {/* Top Bar Fixa de Estética da Tabela */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
               <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wide">
                 <ShieldAlert className="w-4 h-4 text-indigo-400" /> Malha de Usuários
               </h3>
               {/* Search Fakezinho so pra estética */}
               <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
                 <Search className="w-3.5 h-3.5 text-slate-500" />
                 <span className="text-xs text-slate-500 font-medium font-mono">/buscar</span>
               </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                    <th className="p-5 pl-6">Registro de Identidade</th>
                    <th className="p-5">Patente (Role)</th>
                    <th className="p-5">Licença (Plan)</th>
                    <th className="p-5">Inicialização</th>
                    <th className="p-5 text-center">Intervenção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 align-middle">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-indigo-500/5 transition-all group">
                      <td className="p-5 pl-6">
                        <div className="flex flex-col">
                          <span className="text-white font-black tracking-tight flex items-center gap-2">
                             {user.name || "Identidade Oculta"}
                             {user.role === 'ADMIN' && <ShieldAlert className="w-3 h-3 text-indigo-500" />}
                          </span>
                          <span className="text-xs text-slate-400 mt-0.5">{user.email}</span>
                        </div>
                      </td>
                      <td className="p-5">
                         <select 
                           disabled={loadingAction === user.id}
                           value={user.role}
                           onChange={(e) => handleUpdate(user.id, { role: e.target.value })}
                           className={`bg-slate-950 border rounded-xl px-3 py-1.5 text-xs font-black transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none shadow-inner ${user.role === 'ADMIN' ? 'border-indigo-500/50 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)] bg-indigo-500/5' : 'border-slate-800 text-slate-300 hover:border-slate-600'}`}
                         >
                           <option value="USER">Comum (USER)</option>
                           <option value="ADMIN">Mestre (ADMIN)</option>
                         </select>
                      </td>
                      <td className="p-5">
                         <select 
                           disabled={loadingAction === user.id}
                           value={user.plan}
                           onChange={(e) => handleUpdate(user.id, { plan: e.target.value })}
                           className={`bg-slate-950 border rounded-xl px-3 py-1.5 text-xs font-black transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none shadow-inner ${user.plan === 'ENTERPRISE' ? 'border-amber-500/50 text-amber-400 bg-amber-500/5' : user.plan === 'PRO' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5' : 'border-slate-800 text-slate-400 hover:border-slate-600'}`}
                         >
                           <option value="FREE">Limiar (FREE)</option>
                           <option value="PRO">Elite (PRO)</option>
                           <option value="ENTERPRISE">Supremo (ENTERPRISE)</option>
                         </select>
                      </td>
                      <td className="p-5">
                         <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_currentColor]"></div>
                            <span className="text-xs text-slate-400 font-medium font-mono">
                              {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                         </div>
                      </td>
                      <td className="p-5">
                         <div className="flex items-center justify-center">
                            <button 
                               disabled={loadingAction === user.id}
                               onClick={() => handleDelete(user.id)}
                               className="p-2 border border-slate-800 bg-slate-900 text-slate-500 rounded-xl hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all flex items-center gap-2"
                               title="Excluir Usuário Globalmente"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                   Modificações são aplicadas nos bancos neurais instantaneamente.
                </p>
            </div>
          </motion.div>
        )}
      </main>

      {/* Modal Embutido de Explicação de Planos (Para o Admin) */}
      {showPlanInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Info className="w-6 h-6 text-emerald-500" /> Matriz de Inteligência: Planos & Recursos
              </h2>
              <button onClick={() => setShowPlanInfo(false)} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-red-500/20 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800">
                <h3 className="text-lg font-bold text-slate-300 mb-2">FREE (Plano Limiar)</h3>
                <ul className="text-sm text-slate-500 space-y-2 list-disc list-inside">
                  <li>Incentivo para conhecer o app com limite de 2 carteiras.</li>
                  <li>Gráficos básicos; Mascot sem voz neural (mudo).</li>
                  <li>Previsões de fluxo de caixa limitadas a apenas 1 mês.</li>
                </ul>
              </div>
              <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                <h3 className="text-lg font-bold text-emerald-400 mb-2">PRO (Plano Elite) ⭐️</h3>
                <ul className="text-sm text-emerald-500/70 space-y-2 list-disc list-inside">
                  <li>Todas as restrições de contas e despesas removidas.</li>
                  <li>Mascot ativado na totalidade com Gatilhos Auditivos (+Voz Neural).</li>
                  <li>Liberado Dashboard de Patrimônios Fixos (Imóveis, Veículos).</li>
                  <li>Previsões de caixa para até 12 meses do ano.</li>
                </ul>
              </div>
              <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                <h3 className="text-lg font-bold text-amber-500 mb-2">ENTERPRISE (Plano Supremo) 🏢</h3>
                <ul className="text-sm text-amber-500/70 space-y-2 list-disc list-inside">
                  <li>Tudo do Plano Pro + Funcionalidades exclusivas para autônomos B2B.</li>
                  <li>Liberação do Módulo de Estoque e Vendas (Atacarejo).</li>
                  <li>Aviso Inteligente do Mascote para escassez de produtos e precificação de lucros.</li>
                </ul>
              </div>
            </div>
            <div className="p-4 bg-slate-950/50 text-center text-xs font-bold uppercase tracking-widest text-slate-500 border-t border-slate-800">
              Só você como Admin pode atribuir e contornar a assinatura manualmente na tabela matriz.
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
