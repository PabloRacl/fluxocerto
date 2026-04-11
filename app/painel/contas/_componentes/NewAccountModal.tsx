"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  X, Wallet, Check, PiggyBank, CreditCard, Banknote, 
  Landmark, Coins, Building2, Globe, Zap, Heart, 
  Utensils, ShoppingCart, Car, Plane, Smartphone, 
  GraduationCap, TrendingUp, ShieldCheck, Home, 
  Briefcase, Stethoscope, Music, Gift, 
  Trash2, Settings, Lock, FileText, BarChart3, 
  MessageSquare, Star, Users, MapPin, Camera, 
  Monitor, Headphones, Coffee, Brush, Dumbbell, 
  Binary, Cpu, Code2, Database, Rocket, Link2, 
  Anchor, Compass, Cloud, Sun, Moon, Wind, 
  Droplets, Flame, Microscope, FlaskConical, Scale, 
  Hammer, Key, Search, Bell, Mail, Eye, 
  ExternalLink, ChevronRight, Download, Filter, Share2, 
  Plus, Minus, RotateCcw, Save, Trash, Pencil
} from "lucide-react";
import { AnimatedModal } from "@/app/painel/_componentes/AnimatedModal";

// Cores disponíveis
const AVAILABLE_COLORS = [
  "#047857",
  "#10B981",
  "#059669",
  "#04957E",
  "#8B5CF6",
  "#6366F1",
  "#3B82F6",
  "#2563EB",
  "#F59E0B",
  "#D97706",
  "#DC2626",
  "#EF4444",
  "#EC4899",
  "#DB2777",
  "#14B8A6",
  "#0D9488",
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

interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewAccountModal({
  isOpen,
  onClose,
}: NewAccountModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    type: "CHECKING",
    balance: "",
    color: "#047857",
    icon: "wallet",
  });

  const [showOtherType, setShowOtherType] = useState(false);
  const [customType, setCustomType] = useState("");

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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleTypeChange = (value: string) => {
    if (value === "OTHER") {
      setShowOtherType(true);
      setFormData((prev) => ({ ...prev, type: "" }));
    } else {
      setShowOtherType(false);
      setFormData((prev) => ({ ...prev, type: value }));
      setCustomType("");
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const finalType = showOtherType ? "OTHER" : formData.type;

      if (!formData.name || !finalType) {
        throw new Error("Nome e tipo são obrigatórios");
      }

      const res = await fetch("/api/contas", {
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
        if (data.error && data.error.includes("PLAN_LIMIT_REACHED")) {
          window.dispatchEvent(new Event("open-upgrade-modal"));
          onClose();
          return;
        }
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
    const iconObj = AVAILABLE_ICONS.find((i) => i.id === iconId) || AVAILABLE_ICONS[0];
    const IconComponent = iconObj.icon;
    return <IconComponent className="w-6 h-6" />;
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Conta"
      subtitle="Cadastre uma nova conta bancária"
      icon={<Wallet className="w-6 h-6 text-white" />}
      theme="emerald"
      maxWidth="2xl"
    >
            {/* Formulário */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-6 max-h-[70vh] overflow-y-auto"
            >
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
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-600 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all relative z-10"
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
                <div className="grid grid-cols-5 gap-3">
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
                      <span style={{ color: formData.color }}>
                        {renderIcon(icon.id)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {icon.label}
                      </span>
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
                  disabled={
                    loading ||
                    !formData.name ||
                    (showOtherType && !customType.trim())
                  }
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
    </AnimatedModal>
  );
}
