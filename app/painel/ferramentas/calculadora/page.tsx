"use client";

import { useState } from "react";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import { Calculator, DollarSign, TrendingUp, BarChart, Percent } from "lucide-react";
import { useRouter } from "next/navigation";

// Formatador 
const formatCur = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

export default function CalculadoraFinanceira() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"JUROS" | "AMORTIZACAO">("JUROS");

  // Estados Juros Compostos
  const [jPrincipal, setJPrincipal] = useState(10000);
  const [jMensal, setJMensal] = useState(500);
  const [jTaxa, setJTaxa] = useState(1);
  const [jPeriodo, setJPeriodo] = useState(12);

  // Estados Amortização (SAC)
  const [aValor, setAValor] = useState(50000);
  const [aTaxa, setATaxa] = useState(1.5);
  const [aPrazo, setAPrazo] = useState(48);

  // === CÁLCULO DE JUROS COMPOSTOS ===
  const calcJuros = () => {
    let montante = jPrincipal;
    const taxaDecimal = jTaxa / 100;
    for (let i = 1; i <= jPeriodo; i++) {
      montante = montante * (1 + taxaDecimal) + jMensal;
    }
    const totalInvestido = jPrincipal + jMensal * jPeriodo;
    const totalRendimento = montante - totalInvestido;
    return { montante, totalInvestido, totalRendimento };
  };
  const resultJuros = calcJuros();

  // === CÁLCULO DE AMORTIZAÇÃO (SAC) ===
  const calcSAC = () => {
    const amortizacaoConstante = aValor / aPrazo;
    let saldoDevedor = aValor;
    const taxaDecimal = aTaxa / 100;
    
    const parcelas = [];
    let totalJuros = 0;

    for (let i = 1; i <= Math.min(aPrazo, 360); i++) {
      const jurosDaParcela = saldoDevedor * taxaDecimal;
      const valorDaParcela = amortizacaoConstante + jurosDaParcela;
      totalJuros += jurosDaParcela;
      saldoDevedor -= amortizacaoConstante;

      parcelas.push({
        numero: i,
        amortizacao: amortizacaoConstante,
        juros: jurosDaParcela,
        prestacao: valorDaParcela,
        saldo: Math.max(0, saldoDevedor)
      });
    }
    return { parcelas, totalJuros, totalPago: aValor + totalJuros };
  };
  const resultSAC = calcSAC();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <PageHeader
        title="Calculadoras Financeiras"
        subtitle="Simule rendimentos e projete suas amortizações de dívidas"
        onBack={() => router.push("/painel")}
        showDashboardLink={true}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TABS CONTROLS */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab("JUROS")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "JUROS"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                : "bg-slate-900/50 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Juros Compostos (ROI)
          </button>
          <button
            onClick={() => setActiveTab("AMORTIZACAO")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "AMORTIZACAO"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                : "bg-slate-900/50 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Calculator className="w-5 h-5" />
            Amortização (SAC)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* PAINEL DE CONTROLE LATERAL */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Percent className="w-5 h-5 text-emerald-500" />
                Parâmetros
              </h2>

              {activeTab === "JUROS" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400">Valor Inicial (R$)</label>
                    <input type="number" value={jPrincipal} onChange={e => setJPrincipal(Number(e.target.value))} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Aporte Mensal (R$)</label>
                    <input type="number" value={jMensal} onChange={e => setJMensal(Number(e.target.value))} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Taxa de Juros Mensal (%)</label>
                    <input type="number" step="0.1" value={jTaxa} onChange={e => setJTaxa(Number(e.target.value))} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Período (Meses)</label>
                    <input type="number" value={jPeriodo} onChange={e => setJPeriodo(Number(e.target.value))} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
              )}

              {activeTab === "AMORTIZACAO" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400">Valor Financiado / Dívida (R$)</label>
                    <input type="number" value={aValor} onChange={e => setAValor(Number(e.target.value))} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Taxa de Juros Mensal (%)</label>
                    <input type="number" step="0.1" value={aTaxa} onChange={e => setATaxa(Number(e.target.value))} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Prazo (Meses)</label>
                    <input type="number" value={aPrazo} onChange={e => setAPrazo(Number(e.target.value))} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PAINEL DE RESULTADOS MAIN */}
          <div className="lg:col-span-8 space-y-6">
            
            {activeTab === "JUROS" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                    <p className="text-sm text-slate-400 mb-2">Total Investido</p>
                    <p className="text-2xl font-bold text-white">{formatCur(resultJuros.totalInvestido)}</p>
                  </div>
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-emerald-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-12 -mt-12" />
                    <p className="text-sm text-emerald-400 mb-2">Rendimento (Juros)</p>
                    <p className="text-2xl font-bold text-emerald-400">+{formatCur(resultJuros.totalRendimento)}</p>
                  </div>
                  <div className="bg-emerald-600/10 p-6 rounded-2xl border border-emerald-500/30">
                    <p className="text-sm text-white mb-2">Valor Acumulado</p>
                    <p className="text-3xl font-black text-emerald-400">{formatCur(resultJuros.montante)}</p>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                   <BarChart className="w-16 h-16 text-emerald-500/40 mb-4" />
                   <h3 className="text-lg font-semibold text-white">Projeção Dinâmica</h3>
                   <p className="text-slate-400 max-w-sm mt-2">No período de {jPeriodo} meses, {((resultJuros.totalRendimento / resultJuros.totalInvestido)*100).toFixed(2)}% do seu capital será composto exclusivamente de lucro financeiro passivo.</p>
                </div>
              </>
            )}

            {activeTab === "AMORTIZACAO" && (
              <>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                    <p className="text-sm text-slate-400 mb-2">Total Pego Emprestado</p>
                    <p className="text-2xl font-bold text-white">{formatCur(aValor)}</p>
                  </div>
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-red-500/20">
                    <p className="text-sm text-red-400 mb-2">Juros Pagos ao Banco</p>
                    <p className="text-2xl font-bold text-red-400">{formatCur(resultSAC.totalJuros)}</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <p className="text-sm text-white mb-2">Custo Total Final</p>
                    <p className="text-3xl font-black text-slate-100">{formatCur(resultSAC.totalPago)}</p>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                       <DollarSign className="w-5 h-5 text-amber-500" />
                       Evolução das Parcelas (SAC)
                    </h3>
                  </div>
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-950/50 text-slate-400 sticky top-0">
                        <tr>
                          <th className="px-6 py-3">Mês</th>
                          <th className="px-6 py-3">Prestação</th>
                          <th className="px-6 py-3">Amortização</th>
                          <th className="px-6 py-3">Juros</th>
                          <th className="px-6 py-3">Saldo Devedor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {resultSAC.parcelas.slice(0, 150).map((p) => (
                          <tr key={p.numero} className="hover:bg-slate-800/30">
                            <td className="px-6 py-4 font-medium text-slate-300">{p.numero}</td>
                            <td className="px-6 py-4 text-amber-400 font-semibold">{formatCur(p.prestacao)}</td>
                            <td className="px-6 py-4 text-emerald-400">{formatCur(p.amortizacao)}</td>
                            <td className="px-6 py-4 text-red-400">{formatCur(p.juros)}</td>
                            <td className="px-6 py-4 text-slate-300">{formatCur(p.saldo)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
