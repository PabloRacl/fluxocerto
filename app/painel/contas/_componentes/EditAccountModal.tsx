"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  X, Wallet, Check, AlertCircle, PiggyBank, CreditCard, 
  Banknote, Landmark, Coins, Building2, Globe, Zap, 
  Heart, Utensils, ShoppingCart, Car, Plane, Smartphone, 
  GraduationCap, TrendingUp, ShieldCheck, Home, 
  Briefcase, Stethoscope, Music, Gift, Coffee, Dumbbell, 
  Cpu, Rocket, Anchor
} from "lucide-react";
import { AnimatedModal } from "@/app/painel/_componentes/AnimatedModal";

// Cores disponíveis (mesmo padrão do NewAccountModal)
const AVAILABLE_COLORS = [
  "#047857", "#10B981", "#059669", "#04957E",
  "#06B6D4", "#6366F1", "#3B82F6", "#2563EB",
  "#F59E0B", "#D97706", "#DC2626", "#EF4444",
  "#EC4899", "#DB2777", "#14B8A6", "#0D9488",
];

// Ícones disponíveis para as contas (mais variados e modernos)
const AVAILABLE_ICONS = [
  { id: "wallet", label: "Finanças", icon: Wallet },
  { id: "piggy-bank", label: "Poupança", icon: PiggyBank },
  { id: "credit-card", label: "Cartão", icon: CreditCard },
  { id: "banknote", label: "Dinheiro", icon: Banknote },
  { id: "landmark", label: "Banco", icon: Landmark },
  { id: "coins", label: "Moedas", icon: Coins },
  { id: "building-2", label: "Empresa", icon: Building2 },
  { id: "globe", label: "Global", icon: Globe },
  { id: "zap", label: "Essenciais", icon: Zap },
  { id: "heart", label: "Saúde", icon: Heart },
  { id: "utensils", label: "Comida", icon: Utensils },
  { id: "shopping-cart", label: "Compras", icon: ShoppingCart },
  { id: "car", label: "Veículo", icon: Car },
  { id: "plane", label: "Viagem", icon: Plane },
  { id: "smartphone", label: "Digital", icon: Smartphone },
  { id: "graduation-cap", label: "Educação", icon: GraduationCap },
  { id: "trending-up", label: "Ações", icon: TrendingUp },
  { id: "shield-check", label: "Seguro", icon: ShieldCheck },
  { id: "home", label: "Imóvel", icon: Home },
  { id: "briefcase", label: "Profissão", icon: Briefcase },
  { id: "stethoscope", label: "Emergência", icon: Stethoscope },
  { id: "music", label: "Lazer", icon: Music },
  { id: "gift", label: "Presente", icon: Gift },
  { id: "coffee", label: "Café", icon: Coffee },
  { id: "dumbbell", label: "Academia", icon: Dumbbell },
  { id: "cpu", label: "Hardware", icon: Cpu },
  { id: "rocket", label: "Pagar", icon: Rocket },
  { id: "anchor", label: "Previsão", icon: Anchor },
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

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: any;
}

export default function EditAccountModal({
  isOpen,
  onClose,
  account,
}: EditAccountModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    balance: "",
    color: "#047857",
    icon: "wallet",
  });

  const [showOtherType, setShowOtherType] = useState(false);
  const [customType, setCustomType] = useState("");

  // Inicializar formulário com dados da conta
  useEffect(() => {
    if (account && isOpen) {
      const knownType = ACCOUNT_TYPES.find(t => t.value === account.type);
      
      setFormData({
        name: account.name || "",
        type: knownType ? account.type : "OTHER",
        balance: (account.balance / 100).toString(),
        color: account.color || "#047857",
        icon: account.icon || "wallet",
      });

      if (!knownType && account.type) {
        setShowOtherType(true);
        setCustomType(account.type);
      } else {
        setShowOtherType(false);
        setCustomType("");
      }
    }
  }, [account, isOpen]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleTypeChange = (value: string) => {
    if (value === "OTHER") {
      setShowOtherType(true);
      setFormData((prev) => ({ ...prev, type: "OTHER" }));
    } else {
      setShowOtherType(false);
      setFormData((prev) => ({ ...prev, type: value }));
      setCustomType("");
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account?.id) return;
    
    setLoading(true);
    setError("");

    try {
      const finalType = showOtherType ? "OTHER" : formData.type;

      if (!formData.name || !finalType) {
        throw new Error("Nome e tipo são obrigatórios");
      }

      const res = await fetch(`/api/contas/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          type: finalType,
          balance: formData.balance ? parseFloat(formData.balance) : 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar conta");
      }

      onClose();
      router.refresh();
      // Forçar atualização local se necessário através de um re-fetch na página pai
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar conta");
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = (iconId: string) => {
    const iconObj = AVAILABLE_ICONS.find((i) => i.id === iconId) || AVAILABLE_ICONS[0];
    const IconComponent = iconObj.icon;
    return <IconComponent className="w-6 h-6" />;
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Conta"
      subtitle="Atualize as informações da sua conta"
      icon={<Wallet className="w-6 h-6 text-white" />}
      theme="blue"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Nome da Conta
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              placeholder="Ex: Nubank, Itaú Personalité..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Tipo
              </label>
              <select
                value={showOtherType ? "OTHER" : formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Saldo Atual (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => handleChange("balance", e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
              />
            </div>
          </div>

          {showOtherType && (
            <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Especifique o tipo
              </label>
              <input
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/30 border border-slate-700 rounded-2xl text-white"
                placeholder="Ex: Conta Salário"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Personalização
          </label>
          
          <div className="flex flex-wrap gap-3">
            {AVAILABLE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleChange("color", color)}
                className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                  formData.color === color
                    ? "border-white scale-110 shadow-lg shadow-blue-500/30"
                    : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="grid grid-cols-5 gap-3">
            {AVAILABLE_ICONS.map((icon) => (
              <button
                key={icon.id}
                type="button"
                onClick={() => handleChange("icon", icon.id)}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all duration-200 ${
                  formData.icon === icon.id
                    ? "border-blue-500 bg-blue-500/10 shadow-lg"
                    : "border-slate-700 hover:border-slate-600 bg-slate-800/30"
                }`}
              >
                <div style={{ color: formData.color }}>
                  {renderIcon(icon.id)}
                </div>
                <span className="text-[10px] text-slate-400 font-medium truncate w-full text-center">
                  {icon.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4 sticky bottom-0 bg-slate-900/80 backdrop-blur-sm -mx-2 px-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-2xl transition-all border border-slate-700 hover:border-slate-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </AnimatedModal>
  );
}
