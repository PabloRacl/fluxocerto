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
  ChevronRight,
  RefreshCw,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import { NeuralLoading } from "@/app/painel/_componentes/NeuralLoading";
import { motion, AnimatePresence } from "framer-motion";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((res) => res.json());

export default function NegociosPage() {
  const { data: session } = useSession();
  const { data: bizData, isLoading, mutate } = useSWR("/api/vendas", fetcher);

  const [isVendaModalOpen, setIsVendaModalOpen] = useState(false);

  if (isLoading) {
    return (
      <NeuralLoading
        message="Sincronizando Business Intelligence..."
        variant="full"
      />
    );
  }

  const resumo = bizData?.resumo || {
    faturamentoTotal: 0,
    lucroTotal: 0,
    margemMedia: "0%",
    ticketMedio: 0,
  };

  const vendas = bizData?.vendas || [];

  return (
    <div className="min-h-screen relative bg-slate-950 overflow-hidden">
      {/* Glow Orbs Neural HUD */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        <PageHeader
          title="Business Intelligence"
          description="Gestão avançada de vendas e lucratividade estratégica (MEI)"
          breadcrumbs={[{ label: "Negócios" }]}
        >
          <div className="flex gap-2">
            <button
              onClick={() => mutate()}
              className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
              title="Sincronizar Dados"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsVendaModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Venda</span>
            </button>
          </div>
        </PageHeader>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Cards de Performance MEI */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <BizCard
              title="Faturamento"
              value={`R$ ${(resumo.faturamentoTotal / 100).toLocaleString()}`}
              icon={<DollarSign className="text-blue-400" />}
              subtitle="Capital Entrante"
              color="blue"
            />
            <BizCard
              title="Lucro Líquido"
              value={`R$ ${(resumo.lucroTotal / 100).toLocaleString()}`}
              icon={<TrendingUp className="text-emerald-400" />}
              subtitle="Ganho Efetivo"
              color="emerald"
            />
            <BizCard
              title="Margem Média"
              value={resumo.margemMedia}
              icon={<Percent className="text-amber-400" />}
              subtitle="Performance de Preço"
              color="amber"
            />
            <BizCard
              title="Vendas"
              value={vendas.length}
              icon={<ShoppingBag className="text-cyan-400" />}
              subtitle="Ciclo Mensal"
              color="cyan"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Listagem de Vendas Recentes */}
            <div className="lg:col-span-2 bg-slate-950/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
              {/* Laser Scan Animation */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                style={{ skewX: -20 }}
              />

              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                Histórico de Operações
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5 pb-4">
                      <th className="pb-4">Estrutura / Item</th>
                      <th className="pb-4">Data / Hora</th>
                      <th className="pb-4 text-right">Valor Bruto</th>
                      <th className="pb-4 text-right">Lucratividade</th>
                      <th className="pb-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {vendas.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-20 text-center text-slate-600 italic text-sm"
                        >
                          Sistemas aguardando primeira operação...
                        </td>
                      </tr>
                    ) : (
                      vendas.map((v: any) => (
                        <tr
                          key={v.id}
                          className="group hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-5">
                            <div className="font-black text-white text-sm uppercase tracking-tight">
                              {v.estoque?.nome}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                              Lote x{v.quantidade}
                            </div>
                          </td>
                          <td className="py-4 text-slate-400 text-sm">
                            {format(new Date(v.dataVenda), "dd MMM, HH:mm", {
                              locale: ptBR,
                            })}
                          </td>
                          <td className="py-5 text-right">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                              Bruto
                            </span>
                            <span className="font-black text-white text-sm">
                              R$ {(v.valorVenda / 100).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-5 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-500/50 mb-1">
                                Net Profit
                              </span>
                              <span className="text-emerald-400 font-black text-sm">
                                +R$ {(v.lucro / 100).toFixed(2)}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 text-right">
                            <button className="p-2 text-slate-700 group-hover:text-emerald-400 transition-all hover:bg-emerald-500/10 rounded-xl">
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

            {/* Lado Direito: Neural Insights & Mascot */}
            <div className="space-y-6">
              {/* Card de Performance Neural */}
              <div className="bg-slate-950/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 relative overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">
                      Neural Performance
                    </span>
                  </div>

                  <div className="text-3xl font-black text-white mb-4">
                    {Number(resumo.margemMedia.replace("%", "")) > 30
                      ? "Ótima ✨"
                      : "Otimizando 🚀"}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-6 font-medium italic">
                    &quot;Sua margem de lucratividade comercial está operando em
                    níveis de alta performance. Recomendo manter o foco nos
                    itens de alto giro.&quot;
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <span>Eficiência de Margem</span>
                      <span className="text-emerald-400">
                        {resumo.margemMedia}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden p-[1px] border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: resumo.margemMedia }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="bg-gradient-to-r from-emerald-600 to-cyan-400 h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mascot Panel */}
              <div className="bg-slate-950/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-500/5 pointer-events-none" />
                <NeuralMascot
                  size="lg"
                  className="hover:scale-105 transition-transform duration-500 drop-shadow-2xl mb-4"
                />
                <div className="text-center">
                  <span className="text-[9px] uppercase font-black text-blue-400 tracking-[0.2em] block mb-2">
                    Comercial Specialist
                  </span>
                  <p className="text-[11px] text-slate-400 italic font-medium">
                    &quot;Vender é uma arte, mas o lucro é uma ciência. Vamos
                    escalar esses números!&quot;
                  </p>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="bg-slate-950/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 shadow-2xl">
                <h4 className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-4">
                  Protocolos Rápidos
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.03] transition-all cursor-pointer group border border-transparent hover:border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
                      Curva ABC de Vendas
                    </span>
                    <ArrowRight className="w-4 h-4 ml-auto text-slate-700 group-hover:text-emerald-400 transition-all group-hover:translate-x-1" />
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Nova Venda */}
      {isVendaModalOpen && (
        <NovaVendaModal
          onClose={() => setIsVendaModalOpen(false)}
          onSuccess={() => {
            mutate();
            setIsVendaModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------
// card de business intelligence
// ----------------------------------------------------
function BizCard({
  title,
  value,
  icon,
  subtitle,
  color = "emerald",
}: {
  title: string;
  value: string | number;
  icon: any;
  subtitle: string;
  color?: string;
}) {
  const colorMap: any = {
    emerald:
      "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/10",
    amber:
      "text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/10",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-cyan-500/10",
  };

  return (
    <div className="bg-slate-950/40 backdrop-blur-2xl border border-white/5 p-6 rounded-3xl shadow-2xl group hover:border-white/10 transition-all relative overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
        style={{ skewX: -20 }}
      />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 border ${colorMap[color]}`}
        >
          {icon}
        </div>
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
          {title}
        </span>
      </div>
      <div className="text-2xl font-black text-white mb-1 tracking-tight relative z-10">
        {value}
      </div>
      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter relative z-10">
        {subtitle}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MODAL: REGISTRAR NOVA VENDA (INTERNAL COMPONENT)
// ----------------------------------------------------
import { AnimatedModal } from "@/app/painel/_componentes/AnimatedModal";
import { NeuralMascot } from "@/app/painel/_componentes/NeuralMascot";

function NovaVendaModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    estoqueId: "",
    quantidade: 1,
    valorVenda: "",
    contaId: "",
    categoriaId: "",
  });
  const [loading, setLoading] = useState(false);

  // Buscar itens de estoque e contas/categorias
  const { data: stockItems } = useSWR("/api/estoque", fetcher);
  const { data: accounts } = useSWR("/api/contas", fetcher);
  const { data: categories } = useSWR("/api/categorias", fetcher);

  // Filtrar apenas estoque COMERCIAL
  const comercialItems =
    stockItems?.filter((i: any) => i.tipo === "COMERCIAL") || [];
  const activeAccounts = accounts || [];
  const salesCategory =
    categories?.find((c: any) => c.name.toLowerCase().includes("venda")) ||
    categories?.[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          valorVenda: Math.round(Number(form.valorVenda) * 100),
          categoriaId: form.categoriaId || salesCategory?.id,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao registrar venda");
      }
    } catch (error) {
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedModal
      isOpen={true}
      onClose={onClose}
      title="Nova Transação Comercial"
      subtitle="Registre liquidez e baixe estoque em tempo real"
      theme="emerald"
      icon={<ShoppingBag className="w-5 h-5" />}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label
              htmlFor="estoqueId"
              className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest"
            >
              Produto em Lote
            </label>
            <select
              id="estoqueId"
              required
              className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
              value={form.estoqueId}
              onChange={(e) => setForm({ ...form, estoqueId: e.target.value })}
            >
              <option value="">Selecione o Item...</option>
              {comercialItems.map((i: any) => (
                <option key={i.id} value={i.id}>
                  {i.nome} (Saldos: {i.quantidade})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="quantidade"
              className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest"
            >
              Quantidade
            </label>
            <input
              id="quantidade"
              type="number"
              required
              min="1"
              className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
              value={form.quantidade}
              onChange={(e) =>
                setForm({ ...form, quantidade: Number(e.target.value) })
              }
            />
          </div>

          <div>
            <label
              htmlFor="valorVenda"
              className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest"
            >
              PVP Unid. (R$)
            </label>
            <input
              id="valorVenda"
              type="number"
              step="0.01"
              required
              className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
              placeholder="0.00"
              value={form.valorVenda}
              onChange={(e) => setForm({ ...form, valorVenda: e.target.value })}
            />
          </div>

          <div className="col-span-2">
            <label
              htmlFor="contaId"
              className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest"
            >
              Destino do Fluxo (Conta)
            </label>
            <select
              id="contaId"
              required
              className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
              value={form.contaId}
              onChange={(e) => setForm({ ...form, contaId: e.target.value })}
            >
              <option value="">Selecione a Conta de Recebimento...</option>
              {activeAccounts.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.name} (R$ {(a.balance / 100).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
          >
            Abortar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
          >
            {loading ? "Sincronizando..." : "Executar Venda"}
          </button>
        </div>
      </form>
    </AnimatedModal>
  );
}
