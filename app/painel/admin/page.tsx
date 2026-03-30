"use client";

import { useState } from "react";
import useSWR from "swr";
import { Shield, Users, Trash2, Edit2, ShieldAlert, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/biblioteca/http-client";

const fetcher = (url: string) => api.get<any[]>(url);

export default function AdminDashboardPage() {
  const { data: users, error, mutate } = useSWR("/api/admin/users", fetcher);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

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
    if (!confirm("Tem certeza que deseja apagar este usuário definitivamente? Todo o histórico financeiro dele será perdido!")) return;
    
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

  if (error) return <div className="p-8 text-red-500 font-bold max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">Acesso Negado ou Erro no Servidor Admin.</div>;
  if (!users) return <div className="p-8 text-slate-400 font-bold max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">Carregando Controle Global...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-indigo-500" />
            Central de Comando <span className="text-indigo-500">Global</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Gerencie todos os usuários, planos e permissões do FluxoCerto.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl">
            <Users className="text-indigo-400 w-5 h-5"/>
            <div>
               <p className="text-xs text-slate-500 uppercase font-black">Total de Usuários</p>
               <p className="text-lg text-white font-bold">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-black">Usuário</th>
                <th className="p-4 font-black">Cargo (Role)</th>
                <th className="p-4 font-black">Plano (Plan)</th>
                <th className="p-4 font-black">Data de Cadastro</th>
                <th className="p-4 text-center font-black">Ações Seguras</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-white font-bold">{user.name || "Sem Nome"}</span>
                      <span className="text-xs text-slate-500">{user.email}</span>
                    </div>
                  </td>
                  <td className="p-4">
                     <select 
                       disabled={loadingAction === user.id}
                       value={user.role}
                       onChange={(e) => handleUpdate(user.id, { role: e.target.value })}
                       className={`bg-slate-950 border rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50 ${user.role === 'ADMIN' ? 'border-indigo-500/50 text-indigo-400' : 'border-slate-700 text-slate-300'}`}
                     >
                       <option value="USER">USER</option>
                       <option value="ADMIN">ADMIN</option>
                     </select>
                  </td>
                  <td className="p-4">
                     <select 
                       disabled={loadingAction === user.id}
                       value={user.plan}
                       onChange={(e) => handleUpdate(user.id, { plan: e.target.value })}
                       className={`bg-slate-950 border rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500/50 ${user.plan === 'ENTERPRISE' ? 'border-amber-500/50 text-amber-400' : user.plan === 'PRO' ? 'border-emerald-500/50 text-emerald-400' : 'border-slate-700 text-slate-400'}`}
                     >
                       <option value="FREE">FREE (Limitado)</option>
                       <option value="PRO">PRO (Premium)</option>
                       <option value="ENTERPRISE">ENTERPRISE (Deus)</option>
                     </select>
                  </td>
                  <td className="p-4 text-sm text-slate-400 font-medium">
                     {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="p-4">
                     <div className="flex items-center justify-center gap-2">
                        <button 
                           disabled={loadingAction === user.id}
                           onClick={() => handleDelete(user.id)}
                           className="p-2 border border-red-500/20 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
                           title="Apagar Usuário"
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
      </motion.div>
    </div>
  );
}
