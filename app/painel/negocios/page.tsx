"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Percent,
  Plus,
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NegociosPage() {
  const { data: session } = useSession();
  const { data: bizData, isLoading, mutate } = useSWR("/api/vendas", fetcher);

  const [isVendaModalOpen, setIsVendaModalOpen] = useState(false);

  const resumo = bizData?.resumo || {
    faturamentoTotal: 0,
    lucroTotal: 0,
    margemMedia: "0%",
    ticketMedio: 0
  };

  const vendas = bizData?.vendas || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Profissional */}
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Business Intelligence
            </h1>
            <p className="text-slate-400 mt-1">Gestão de Vendas e Lucratividade (MEI)</p>
          </div>
          <button 
            onClick={() => setIsVendaModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-emerald-900/20"
          >
            <Plus className="w-5 h-5" />
            Nova Venda
          </button>
        </header>

        {/* Cards de Performance MEI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <BizCard 
            title="Faturamento" 
            value={`R$ ${(resumo.faturamentoTotal / 100).toLocaleString()}`} 
            icon={<DollarSign className="text-blue-400" />}
            subtitle="Dinheiro Novo"
          />
          <BizCard 
            title="Lucro Líquido" 
            value={`R$ ${(resumo.lucroTotal / 100).toLocaleString()}`} 
            icon={<TrendingUp className="text-emerald-400" />}
            subtitle="Ganho Real"
          />
          <BizCard 
            title="Margem Média" 
            value={resumo.margemMedia} 
            icon={<Percent className="text-amber-400" />}
            subtitle="Saúde do Negócio"
          />
          <BizCard 
            title="Vendas" 
            value={vendas.length} 
            icon={<ShoppingBag className="text-purple-400" />}
            subtitle="Volume Mensal"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Listagem de Vendas Recentes */}
          <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              Histórico de Vendas
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800 pb-4">
                    <th className="pb-4 font-medium">Produto</th>
                    <th className="pb-4 font-medium">Data</th>
                    <th className="pb-4 font-medium text-right">Valor</th>
                    <th className="pb-4 font-medium text-right">Lucro</th>
                    <th className="pb-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {vendas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        Nenhuma venda registrada este mês.
                      </td>
                    </tr>
                  ) : (
                    vendas.map((v: any) => (
                      <tr key={v.id} className="group hover:bg-slate-800/30 transition-colors">
                        <td className="py-4">
                          <div className="font-medium text-slate-200">{v.estoque?.nome}</div>
                          <div className="text-xs text-slate-500">x{v.quantidade} unidades</div>
                        </td>
                        <td className="py-4 text-slate-400 text-sm">
                          {format(new Date(v.dataVenda), "dd MMM, HH:mm", { locale: ptBR })}
                        </td>
                        <td className="py-4 text-right font-semibold text-slate-200">
                          R$ {(v.valorVenda / 100).toFixed(2)}
                        </td>
                        <td className="py-4 text-right">
                          <span className="text-emerald-400 font-medium">
                            +R$ {(v.lucro / 100).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button className="text-slate-600 group-hover:text-slate-400 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Área de Destaque / Meta de Vendas */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-emerald-600/20 to-blue-600/20 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden">
               <div className="relative z-10">
                 <h4 className="text-emerald-400 font-bold uppercase tracking-wider text-xs mb-2">Performance Global</h4>
                 <div className="text-4xl font-bold mb-4">
                    {(Number(resumo.margemMedia.replace('%','')) > 30) ? 'Ótima ✨' : 'Em Evolução 🚀'}
                 </div>
                 <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                   Seu lucro médio por venda está excelente. Continue priorizando itens com margem acima de 30%.
                 </p>
                 <div className="w-full bg-slate-950/50 h-2 rounded-full mb-2 overflow-hidden">
                   <div 
                    className="bg-emerald-500 h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                    style={{ width: resumo.margemMedia }}
                   />
                 </div>
                 <div className="flex justify-between text-xs text-slate-500">
                   <span>Margem de Lucro</span>
                   <span>{resumo.margemMedia}</span>
                 </div>
               </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
               <h4 className="font-semibold mb-4">Ação Rápida</h4>
               <ul className="space-y-3">
                 <li className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer text-sm text-slate-400 hover:text-white">
                   <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                     <ShoppingBag className="w-4 h-4" />
                   </div>
                   Ver Itens Mais Vendidos
                   <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100" />
                 </li>
                 <li className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer text-sm text-slate-400 hover:text-white">
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                     <TrendingUp className="w-4 h-4" />
                   </div>
                   Metas de Faturamento
                 </li>
               </ul>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function BizCard({ title, value, icon, subtitle }: { title: string, value: string | number, icon: any, subtitle: string }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl group hover:border-slate-700 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-slate-500">{subtitle}</div>
    </div>
  );
}
