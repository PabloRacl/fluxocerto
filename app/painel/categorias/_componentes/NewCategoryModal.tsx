"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, PieChart, Check, Tag, Layers } from "lucide-react";
import { AnimatedModal } from "@/app/painel/_componentes/AnimatedModal";

// Cores disponíveis (16 cores fixas - mesmo padrão das contas)
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

// Ícones disponíveis
const AVAILABLE_ICONS = [
  { id: "wallet", label: "Carteira" },
  { id: "piggy-bank", label: "Poupança" },
  { id: "credit-card", label: "Cartão" },
  { id: "banknote", label: "Dinheiro" },
  { id: "landmark", label: "Banco" },
  { id: "coins", label: "Moedas" },
  { id: "shopping-cart", label: "Compras" },
  { id: "utensils", label: "Alimentação" },
];

// Tipos de categoria
const CATEGORY_TYPES = [
  {
    value: "INCOME",
    label: "💰 Receita",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    value: "EXPENSE",
    label: "💸 Despesa",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
];

interface NewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  parentCategories?: any[];
}

export default function NewCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  parentCategories = [],
}: NewCategoryModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    color: "#F59E0B",
    icon: "shopping-cart",
    parentId: "",
  });

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
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar categoria");
      }

      // ✅ CHAMA onSuccess SE EXISTIR
      if (onSuccess) {
        onSuccess();
      }

      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao criar categoria");
    } finally {
      setLoading(false);
    }
  };

  // Ícone SVG helper
  const renderIcon = (iconId: string) => {
    const icons: Record<string, JSX.Element> = {
      wallet: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      "piggy-bank": (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      "credit-card": (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      banknote: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      landmark: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
          />
        </svg>
      ),
      coins: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      "shopping-cart": (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      utensils: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      ),
    };
    return icons[iconId] || icons.wallet;
  };

  // Filtrar categorias pai pelo tipo selecionado
  const filteredParents = parentCategories.filter(
    (cat: any) => cat.type === formData.type,
  );

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Categoria"
      subtitle="Cadastre uma nova categoria de receita ou despesa"
      icon={<PieChart className="w-6 h-6 text-white" />}
      theme={formData.type === "INCOME" ? "emerald" : "red"}
      maxWidth="2xl"
    >
            {/* Formulário */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5 max-h-[70vh] overflow-y-auto"
            >
              {/* Mensagem de Erro */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 animate-pulse">
                  {error}
                </div>
              )}

              {/* Nome da Categoria */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="Ex: Alimentação, Transporte, Salário..."
                  required
                />
              </div>

              {/* Tipo de Categoria */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tipo *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORY_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleChange("type", type.value)}
                      className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all duration-200 ${
                        formData.type === type.value
                          ? `border-emerald-500 ${type.bgColor} shadow-lg`
                          : "border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/50"
                      }`}
                    >
                      <span
                        className={
                          formData.type === type.value
                            ? type.color
                            : "text-slate-400"
                        }
                      >
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cor da Categoria */}
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

              {/* Ícone da Categoria */}
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

              {/* Categoria Pai (Subcategoria) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Layers className="w-4 h-4 inline mr-1" />
                  Categoria Pai (Opcional)
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => handleChange("parentId", e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                >
                  <option value="">Nenhuma (categoria principal)</option>
                  {filteredParents.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  Deixe em branco para criar uma categoria principal, ou
                  selecione uma categoria existente do mesmo tipo para criar uma
                  subcategoria
                </p>
              </div>

              {/* Dicas */}
              <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700">
                <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Dicas:
                </h4>
                <ul className="space-y-1 text-xs text-slate-400">
                  <li>
                    • Categorias de{" "}
                    <strong className="text-emerald-400">Receita</strong> são
                    para entradas de dinheiro
                  </li>
                  <li>
                    • Categorias de{" "}
                    <strong className="text-red-400">Despesa</strong> são para
                    saídas de dinheiro
                  </li>
                  <li>
                    • Use subcategorias para organizar melhor (ex: Alimentação →
                    Restaurante)
                  </li>
                </ul>
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
                  disabled={loading || !formData.name}
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
                      Criar Categoria
                    </>
                  )}
                </button>
              </div>
            </form>
    </AnimatedModal>
  );
}
