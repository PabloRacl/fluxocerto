"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Package, 
  AlertTriangle, 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  ShoppingCart,
  ArrowRight,
  ChevronDown,
  Trash2,
  CheckCircle2,
  MoreVertical,
  History
} from "lucide-react";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EstoqueItem {
  id: string;
  nome: string;
  categoria?: string;
  quantidade: number;
  unidade: string;
  precoMedio: number;
  validade?: string;
  estoqueMinimo: number;
  ativo: boolean;
}

export default function EstoquePage() {
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState<'PESSOAL' | 'COMERCIAL'>('PESSOAL');
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchEstoque = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/estoque?tipo=${tipo}`);
      if (res.ok) {
        const data = await res.json();
        setEstoque(data.estoque || []);
        setResumo(data.resumo);
      }
    } catch (err) {
      console.error("Erro estoque:", err);
    } finally {
      setLoading(false);
    }
  }, [tipo]);

  useEffect(() => {
    fetchEstoque();
  }, [fetchEstoque]);
  const handleUpdateQuantity = async (id: string, newQty: number) => {
    if (newQty < 0) return;
    try {
      const res = await fetch(`/api/estoque/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantidade: newQty })
      });
      if (res.ok) fetchEstoque();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEstoque = estoque.filter(item => 
    item.nome.toLowerCase().includes(search.toLowerCase()) ||
    item.categoria?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <PageHeader 
        title="Despensa & Suprimentos"
        subtitle="Controle inteligente de estoque para economia no Atacarejo"
        onNew={() => {}} // Abriria o modal
      />

      <div className="max-w-7xl mx-auto mt-8 space-y-8">
        
        {/* Tab Switcher P13 */}
        <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit mb-8">
          <button 
            onClick={() => setTipo('PESSOAL')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${tipo === 'PESSOAL' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Pessoal (Despensa)
          </button>
          <button 
            onClick={() => setTipo('COMERCIAL')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${tipo === 'COMERCIAL' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Comercial (Revenda)
          </button>
        </div>

        {/* Stats Section */}
        {resumo && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                   <Package className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-xs text-slate-500">Total de Itens</p>
                   <p className="text-xl font-bold text-white">{resumo.totalItens}</p>
                </div>
             </div>
             
             <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                   <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-xs text-slate-500">Reposição Necessária</p>
                   <p className="text-xl font-bold text-white">{resumo.alertasEstoque}</p>
                </div>
             </div>

             <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                   <Calendar className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-xs text-slate-500">Vencendo Logo</p>
                   <p className="text-xl font-bold text-white">{resumo.alertasValidade}</p>
                </div>
             </div>

             <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-2xl flex items-center gap-4 shadow-lg shadow-emerald-500/10">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white">
                   <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-xs text-white/70">Saúde da Despensa</p>
                   <p className="text-xl font-bold text-white">Excelente</p>
                </div>
             </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
             <input 
               type="text"
               placeholder="Buscar item ou categoria..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
             />
          </div>
          <button className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white flex items-center gap-2 transition-all">
             <Filter className="w-4 h-4" /> Filtros
          </button>
          <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
             <Plus className="w-5 h-5" /> Novo Item
          </button>
        </div>

        {/* Stock List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {loading ? (
             [1,2,3,4,5,6].map(n => (
               <div key={n} className="h-40 bg-slate-900 animate-pulse rounded-2xl border border-slate-800" />
             ))
           ) : filteredEstoque.map(item => (
             <div key={item.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all group relative overflow-hidden">
                {/* Alerta de Estoque Baixo Badge */}
                {item.quantidade <= item.estoqueMinimo && (
                   <div className="absolute top-0 right-0 p-3">
                      <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-500/20 uppercase tracking-wider">
                         <AlertTriangle className="w-3 h-3" /> Baixo
                      </div>
                   </div>
                )}

                <div className="flex items-start gap-4 mb-6">
                   <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors shrink-0">
                      <Package className="w-6 h-6" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold truncate pr-16">{item.nome}</h4>
                      <p className="text-xs text-slate-500 mt-1">{item.categoria || "Sem categoria"}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-600 uppercase font-bold mb-1">Qtd Atual</p>
                      <div className="flex items-center justify-between">
                         <p className="text-lg font-bold text-white leading-none">
                            {Number(item.quantidade)} <span className="text-xs font-normal text-slate-500">{item.unidade}</span>
                         </p>
                      </div>
                   </div>
                   <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-600 uppercase font-bold mb-1">Validade</p>
                      <p className="text-xs font-medium text-slate-300">
                         {item.validade ? format(new Date(item.validade), "dd/MM/yy") : "Não inf."}
                      </p>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                   <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, Number(item.quantidade) - 1)}
                        className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all"
                      >-</button>
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, Number(item.quantidade) + 1)}
                        className="w-10 h-10 rounded-lg bg-emerald-600/10 border border-emerald-600/20 hover:bg-emerald-600/20 text-emerald-400 flex items-center justify-center transition-all"
                      >+</button>
                   </div>
                   <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-600 hover:text-slate-400 transition-colors">
                         <History className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-slate-600 hover:text-red-500 transition-colors">
                         <Trash2 className="w-5 h-5" />
                      </button>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
