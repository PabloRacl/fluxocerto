"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Wallet, Check } from "lucide-react";

// Cores disponíveis
const AVAILABLE_COLORS = [
  "#047857", "#10B981", "#059669", "#04957E",
  "#8B5CF6", "#6366F1", "#3B82F6", "#2563EB",
  "#F59E0B", "#D97706", "#DC2626", "#EF4444",
  "#EC4899", "#DB2777", "#14B8A6", "#0D9488",
];

// Ícones disponíveis
const AVAILABLE_ICONS = [
  { id: "wallet", label: "Carteira" },
  { id: "piggy-bank", label: "Poupança" },
  { id: "credit-card", label: "Cartão" },
  { id: "banknote", label: "Dinheiro" },
  { id: "landmark", label: "Banco" },
  { id: "coins", label: "Moedas" },
];

// Tipos de conta
const ACCOUNT_TYPES = [
  { value: "CHECKING", label: "Conta Corrente" },
  { value: "SAVINGS", label: "Poupança" },
  { value: "CREDIT_CARD", label: "Cartão de Crédito" },
  { value: "DEBIT_CARD", label: "Cartão de Débito" },
  { value: "CASH", label: "Dinheiro em Espécie" },
  { value: "INVESTMENT", label: "Investimento" },
  { value: "PIX", label: "Conta PIX" },
  { value: "OTHER", label: "Outra" },
];

interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewAccountModal({ isOpen, onClose }: NewAccountModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "CHECKING",
    balance: "",
    color: "#047857",
    icon: "wallet",
  });

  const [showOtherType, setShowOtherType] = useState(false);
  const [customType, setCustomType] = useState("");

  // Animação de entrada/saída
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = "";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isVisible) return null;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleTypeChange = (value: string) => {
    if (value === "OTHER") {
      setShowOtherType(true);
      setFormData(prev => ({ ...prev, type: "" }));
    } else {
      setShowOtherType(false);
      setFormData(prev => ({ ...prev, type: value }));
      setCustomType("");
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const finalType = showOtherType && customType.trim() 
        ? customType.trim().toUpperCase().replace(/\s+/g, "_") 
        : formData.type;

      if (!formData.name || !finalType) {
        throw new Error("Nome e tipo são obrigatórios");
      }

      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          type: finalType,
          balance: formData.balance ? parseFloat(formData.balance) : 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar conta");
      }

      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = (iconId: string) => {
    const icons: Record<string, JSX.Element> = {
      wallet: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
      "piggy-bank": <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      "credit-card": <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
      banknote: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      landmark: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>,
      coins: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    };
    return icons[iconId] || icons.wallet;
  };

  return (
    <>
      {/* Backdrop com blur e animação */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: "rgba(2, 6, 23, 0.8)",
          backdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      >
        {/* Modal com animação de escala */}
        <div 
          className={`relative w-full max-w-2xl transform transition-all duration-300 ${
            isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradiente de fundo sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-slate-900/10 rounded-3xl blur-xl" />
          
          {/* Conteúdo do Modal */}
          <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-emerald-500/20 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    Nova Conta
                  </h2>
                  <p className="text-sm text-slate-400">Cadastre uma nova conta bancária</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Mensagem de Erro */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 animate-pulse">
                  {error}
                </div>
              )}

              {/* Nome da Conta */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome da Conta *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="Ex: Conta Corrente Banco X"
                  required
                />
              </div>

              {/* Tipo de Conta */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tipo de Conta *
                </label>
                <select
                  value={showOtherType ? "OTHER" : formData.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                {/* Campo personalizado para "Outro" */}
                {showOtherType && (
                  <div className="mt-4 p-4 bg-slate-800/30 border border-slate-700 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Especifique o tipo:
                    </label>
                    <input
                      type="text"
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      placeholder="Ex: Conta Salário, Conta Digital, etc."
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      autoFocus
                      required
                    />
                  </div>
                )}
              </div>

              {/* Saldo Inicial */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Saldo Inicial (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => handleChange("balance", e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="0,00"
                />
              </div>

              {/* Cor da Conta */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Cor de Destaque
                </label>
                <div className="flex flex-wrap gap-3">
                  {AVAILABLE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleChange("color", color)}
                      className={`w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                        formData.color === color 
                          ? "border-white scale-110 shadow-lg shadow-emerald-500/30" 
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Ícone da Conta */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Ícone
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {AVAILABLE_ICONS.map((icon) => (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => handleChange("icon", icon.id)}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all duration-200 ${
                        formData.icon === icon.id
                          ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                          : "border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/50"
                      }`}
                    >
                      <span style={{ color: formData.color }}>{renderIcon(icon.id)}</span>
                      <span className="text-xs text-slate-400">{icon.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-2xl transition-all border border-slate-700 hover:border-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.name || (showOtherType && !customType.trim())}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Criar Conta
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}