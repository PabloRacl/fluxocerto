"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

// Cores disponíveis (16 cores fixas)
const AVAILABLE_COLORS = [
  "#047857",
  "#10B981",
  "#059669",
  "#04957E",
  "#06B6D4",
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

// Ícones disponíveis (Lucide React)
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
  { value: "INCOME", label: "Receita", color: "text-emerald-400" },
  { value: "EXPENSE", label: "Despesa", color: "text-red-400" },
];

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  icon: string | null;
  parentId: string | null;
  isActive: boolean;
  parent?: {
    id: string;
    name: string;
  };
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    color: "#047857",
    icon: "",
    parentId: "",
    isActive: true,
  });

  // Buscar dados da categoria ao carregar
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await fetch(`/api/categorias/${categoryId}`);

        if (res.status === 404) {
          setNotFound(true);
          return;
        }

        if (!res.ok) {
          throw new Error("Erro ao buscar categoria");
        }

        const data: Category = await res.json();

        setFormData({
          name: data.name,
          type: data.type,
          color: data.color,
          icon: data.icon || "",
          parentId: data.parentId || "",
          isActive: data.isActive,
        });
      } catch (err) {
        setError("Não foi possível carregar os dados da categoria");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Buscar categorias principais para o select
    const fetchParentCategories = async () => {
      try {
        const res = await fetch("/api/categorias");
        if (res.ok) {
          const data = await res.json();
          setParentCategories(
            data.filter((c: Category) => !c.parentId && c.id !== categoryId),
          );
        }
      } catch (err) {
        console.error("Erro ao buscar categorias:", err);
      }
    };

    if (categoryId) {
      fetchCategory();
      fetchParentCategories();
    }
  }, [categoryId]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/categorias/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar categoria");
      }

      // Sucesso: redirecionar para lista de categorias
      router.push("/painel/categorias");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar categoria");
    } finally {
      setSaving(false);
    }
  };

  // Função para arquivar categoria
  const handleArchive = async () => {
    if (
      !confirm(
        `Tem certeza que deseja arquivar "${formData.name}"? Esta ação não pode ser desfeita facilmente.`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/categorias/${categoryId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/painel/categorias");
        router.refresh();
      } else {
        const data = await res.json();
        if (data.transactionCount > 0) {
          alert(
            `Não é possível arquivar esta categoria porque possui ${data.transactionCount} transações vinculadas.`,
          );
        } else {
          alert(data.error || "Erro ao arquivar categoria");
        }
      }
    } catch (err) {
      alert("Erro ao arquivar categoria");
      console.error(err);
    }
  };

  // Ícone SVG helper
  const renderIcon = (iconId: string) => {
    const icons: Record<string, React.ReactNode> = {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-emerald-400 text-xl animate-pulse">
          Carregando dados...
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">
            Categoria não encontrada
          </h1>
          <Link
            href="/painel/categorias"
            className="text-emerald-400 hover:underline"
          >
            ← Voltar para categorias
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.2), transparent 70%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full p-6 flex justify-between items-center backdrop-blur-sm bg-slate-950/50 border-b border-emerald-500/20">
        <div className="flex items-center gap-3">
          <Link
            href="/painel/categorias"
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
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
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              FluxoCerto
            </span>
          </Link>
        </div>
        <Link
          href="/painel/categorias"
          className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
        >
          ← Voltar
        </Link>
      </header>

      {/* Conteúdo Principal */}
      <main className="relative z-10 p-8">
        <div className="max-w-2xl mx-auto">
          {/* Título */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Editar Categoria
            </h1>
            <p className="text-slate-400">Atualize os dados da categoria</p>
          </div>

          {/* Formulário */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-emerald-500/20 p-8"
          >
            {/* Mensagem de Erro */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
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
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="Ex: Alimentação, Transporte, Salário..."
                required
              />
            </div>

            {/* Tipo de Categoria */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tipo de Categoria *
              </label>
              <div className="grid grid-cols-2 gap-4">
                {CATEGORY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleChange("type", type.value)}
                    className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                      formData.type === type.value
                        ? type.value === "INCOME"
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-red-500 bg-red-500/10"
                        : "border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${type.value === "INCOME" ? "bg-emerald-400" : "bg-red-400"}`}
                    ></span>
                    <span
                      className={`font-medium ${formData.type === type.value ? type.color : "text-slate-400"}`}
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
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      formData.color === color
                        ? "border-white scale-110 shadow-lg"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
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
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      formData.icon === icon.id
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-slate-700 hover:border-emerald-500/50"
                    }`}
                  >
                    <span style={{ color: formData.color }}>
                      {renderIcon(icon.id)}
                    </span>
                    <span className="text-xs text-slate-400">{icon.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Categoria Pai (Subcategoria) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Categoria Pai (Opcional)
              </label>
              <select
                value={formData.parentId}
                onChange={(e) => handleChange("parentId", e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              >
                <option value="">Nenhuma (categoria principal)</option>
                {parentCategories
                  .filter((cat) => cat.type === formData.type)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Deixe em branco para categoria principal, ou selecione uma
                categoria do mesmo tipo para criar subcategoria
              </p>
            </div>

            {/* Status da Categoria */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleChange("isActive", e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-slate-300">Categoria ativa</span>
              </label>
              <p className="text-xs text-slate-500 mt-1 ml-8">
                Desmarque para arquivar a categoria (não exclui permanentemente)
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving || !formData.name}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
              <Link
                href="/painel/categorias"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors border border-slate-700"
              >
                Cancelar
              </Link>
            </div>
          </form>

          {/* Zona de Perigo - Arquivar */}
          <div className="mt-6 p-6 bg-red-500/10 rounded-2xl border border-red-500/20">
            <h3 className="text-lg font-semibold text-red-400 mb-2">
              ⚠️ Zona de Perigo
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Arquivar esta categoria irá ocultá-la da lista principal. Não é
              possível arquivar categorias com transações vinculadas.
            </p>
            <button
              onClick={handleArchive}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
            >
              Arquivar Categoria
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
