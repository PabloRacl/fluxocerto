"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Check, AlertCircle, TrendingDown, Clock, ShieldCheck } from "lucide-react";
import { AnimatedModal } from "@/app/painel/_componentes/AnimatedModal";
import { NeuralLoading } from "@/app/painel/_componentes/NeuralLoading";

interface AmortizeDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: any;
  onSuccess: () => void;
}

export default function AmortizeDebtModal({
  isOpen,
  onClose,
  debt,
  onSuccess,
}: AmortizeDebtModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Modos: "NORMAL", "PRAZO", "PARCELA"
  const [amortizationMode, setAmortizationMode] = useState<"NORMAL" | "PRAZO" | "PARCELA">("NORMAL");
  const [installmentsToPay, setInstallmentsToPay] = useState(1);
  const [customValue, setCustomValue] = useState("");

  if (!debt) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let bodyData: any = { tipo: "PAGAR_PARCELA", quantidadeParcelas: installmentsToPay };

      if (amortizationMode === "PRAZO") {
        bodyData = { tipo: "AMORTIZAR_PRAZO", quantidadeParcelas: installmentsToPay };
      } else if (amortizationMode === "PARCELA") {
        if (!customValue || parseFloat(customValue.replace(',', '.')) <= 0) {
           throw new Error("Informe um valor maior que 0 para abater da dívida");
        }
        bodyData = { 
           tipo: "AMORTIZAR_PARCELA", 
           valorPago: Math.round(parseFloat(customValue.replace(',', '.')) * 100),
           quantidadeParcelas: 0
        };
      }

      const res = await fetch(`/api/dividas/${debt.id}/pagar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.quitada) {
          alert("🎉 Parabéns! Dívida quitada com sucesso!");
        } else if (data.economia > 0) {
          alert(`💸 Amortização realizada! Você economizou R$ ${(data.economia / 100).toFixed(2).replace('.', ',')} de juros!`);
        }
        onSuccess();
        onClose();
      } else {
        throw new Error(data.error || "Erro ao registrar amortização");
      }
    } catch (err: any) {
      setError(err.message || "Erro interno ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const optionClass = (active: boolean) => 
    `p-4 rounded-xl border-2 transition-all cursor-pointer flex gap-4 ${
      active 
        ? "border-emerald-500 bg-emerald-500/10" 
        : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/80"
    }`;

  const remainingInstallments = debt.installmentTotal - debt.installmentPaid;

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Pagamento e Amortização"
      subtitle={`Opções para o ${debt.name}`}
      icon={<DollarSign className="w-6 h-6 text-white" />}
      theme="emerald"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="space-y-4">
           {/* Opção Normal */}
           <div className={optionClass(amortizationMode === "NORMAL")} onClick={() => setAmortizationMode("NORMAL")}>
              <div className={`mt-1 p-2 rounded-full h-fit ${amortizationMode === "NORMAL" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                 <Check className="w-5 h-5" />
              </div>
              <div>
                 <h4 className={`font-semibold ${amortizationMode === "NORMAL" ? "text-emerald-400" : "text-white"}`}>Pagamento Normal</h4>
                 <p className="text-sm text-slate-400 mt-1">Abater as próximas parcelas da fila mantendo o calendário original.</p>
              </div>
           </div>

           {/* Opção Amortizar Prazo (Onix) */}
           <div className={optionClass(amortizationMode === "PRAZO")} onClick={() => setAmortizationMode("PRAZO")}>
              <div className={`mt-1 p-2 rounded-full h-fit ${amortizationMode === "PRAZO" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                 <Clock className="w-5 h-5" />
              </div>
              <div>
                 <h4 className={`font-semibold ${amortizationMode === "PRAZO" ? "text-emerald-400" : "text-white"}`}>Amortizar no Prazo (De Trás para Frente)</h4>
                 <p className="text-sm text-slate-400 mt-1">Pague as ÚLTIMAS parcelas. Desconta juros e diminui o tempo restante do contrato.</p>
              </div>
           </div>

           {/* Opção Amortizar Parcela (Casa) */}
           <div className={optionClass(amortizationMode === "PARCELA")} onClick={() => setAmortizationMode("PARCELA")}>
              <div className={`mt-1 p-2 rounded-full h-fit ${amortizationMode === "PARCELA" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                 <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                 <h4 className={`font-semibold ${amortizationMode === "PARCELA" ? "text-emerald-400" : "text-white"}`}>Amortizar na Parcela (Abater Saldo)</h4>
                 <p className="text-sm text-slate-400 mt-1">Dê um lance/valor livre hoje. O tempo de contrato continua igual, mas o valor de TODAS as futuras parcelas vai diminuir.</p>
              </div>
           </div>
        </div>

        {/* Dynamic Inputs Based on Selection */}
        <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800">
            {amortizationMode === "NORMAL" && (
                <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2">Quantas parcelas atuais deseja pagar agora?</label>
                   <input 
                      type="number" 
                      min="1" 
                      max={remainingInstallments} 
                      className="w-full px-4 py-3 bg-slate-900 rounded-xl text-white border border-slate-700 outline-none focus:border-emerald-500"
                      value={installmentsToPay}
                      onChange={(e) => setInstallmentsToPay(Number(e.target.value))}
                   />
                </div>
            )}
            {amortizationMode === "PRAZO" && (
                <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2">Quantas das ÚLTIMAS parcelas deseja antecipar?</label>
                   <input 
                      type="number" 
                      min="1" 
                      max={remainingInstallments} 
                      className="w-full px-4 py-3 bg-slate-900 rounded-xl text-white border border-slate-700 outline-none focus:border-emerald-500"
                      value={installmentsToPay}
                      onChange={(e) => setInstallmentsToPay(Number(e.target.value))}
                   />
                </div>
            )}
            {amortizationMode === "PARCELA" && (
                <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2">Qual valor você deseja somar para abater hoje? (R$)</label>
                   <input 
                      type="number" 
                      step="0.01"
                      className="w-full px-4 py-3 bg-slate-900 rounded-xl text-white border border-slate-700 outline-none focus:border-emerald-500"
                      value={customValue}
                      placeholder="Ex: 5000,00"
                      onChange={(e) => setCustomValue(e.target.value)}
                      required
                   />
                </div>
            )}
        </div>

        <div className="flex gap-4 pt-4 border-slate-800 sticky bottom-0 bg-transparent">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-2xl transition-all border border-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <NeuralLoading message="Processando..." variant="inline" />
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Confirmar Pagamento
              </>
            )}
          </button>
        </div>
      </form>
    </AnimatedModal>
  );
}
