"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CabecalhoPagina } from "@/app/painel/_componentes/CabecalhoPagina";
import { Archive, RefreshCw, Trash2, PieChart, Plus } from "lucide-react";
// ✅ IMPORT DO NOVO MODAL FUTURISTA
import ModalNovaCategoria from "./_componentes/ModalNovaCategoria";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/componentes/ui/tooltip";

// Tipo para a categoria
interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  icon: string | null;
  parentId: string | null;
  isActive: boolean;
  isArchived: boolean; // ✅ CAMPO PARA ARQUIVAMENTO
  archivedAt?: string | null;
  createdAt: string;
  _count?: {
    transactions: number;
  };
  parent?: {
    id: string;
    name: string;
  };
}

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "INCOME" | "EXPENSE">(
    "ALL",
  );

  // ✅ NOVO: Toggle para mostrar categorias ativas ou arquivadas
  const [showArchived, setShowArchived] = useState(false);

  // ✅ ESTADOS PARA O MODAL FUTURISTA
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);

  // Buscar categorias ao carregar a página
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      // Construir URL com filtros
      let url = "/api/categorias?";
      const params = new URLSearchParams();

      if (filterType !== "ALL") {
        params.set("type", filterType);
      }
      params.set("showArchived", showArchived.toString());

      url += params.toString();

      const res = await fetch(url, { credentials: "include" });

      if (!res.ok) {
        throw new Error("Erro ao buscar categorias");
      }

      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError("Não foi possível carregar suas categorias");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterType, showArchived]);

  // ✅ BUSCAR CATEGORIAS PRINCIPAIS PARA O MODAL
  const fetchParentCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categorias", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        // Filtrar apenas categorias principais ativas (sem pai)
        setParentCategories(
          Array.isArray(data)
            ? data.filter((c: Category) => !c.parentId && !c.isArchived)
            : [],
        );
      }
    } catch (err) {
      console.error("Erro ao buscar categorias pai:", err);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/entrar");
      return;
    }

    if (status === "authenticated") {
      fetchCategories();
      fetchParentCategories();
    }
  }, [status, router, fetchCategories, fetchParentCategories]);

  // ✅ ARQUIVAR/DESARQUIVAR CATEGORIA
  const handleArchive = async (
    categoryId: string,
    categoryName: string,
    isArchived: boolean,
  ) => {
    const action = isArchived ? "desarquivar" : "arquivar";
    if (!confirm(`Tem certeza que deseja ${action} "${categoryName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/categorias/${categoryId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isArchived: !isArchived }),
      });

      if (res.ok) {
        await fetchCategories(); // Recarregar lista
      } else {
        const data = await res.json();
        if (data.transactionCount > 0) {
          alert(
            `Não é possível ${action} "${categoryName}" porque possui ${data.transactionCount} transações vinculadas.`,
          );
        } else {
          alert(data.error || `Erro ao ${action} categoria`);
        }
      }
    } catch (err) {
      alert(`Erro ao ${action} categoria`);
      console.error(err);
    }
  };

  const handleDeletePermanent = async (categoryId: string) => {
    if (
      !confirm(
        "⚠️ ATENÇÃO: Esta é uma EXCLUSÃO PERMANENTE.\nA categoria será destruída para sempre. Isso pode afetar transações antigas! Deseja prosseguir?",
      )
    )
      return;

    try {
      const response = await fetch(
        `/api/categorias/${categoryId}/exclusao-permanente`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir categoria");
      }

      fetchCategories();
    } catch (err) {
      console.error("Erro ao excluir:", err);
      alert("Erro ao excluir categoria permanentemente");
    }
  };

  // ✅ HANDLERS DO MODAL
  const handleOpenModal = () => {
    setShowNewCategoryModal(true);
  };

  const handleModalClose = () => {
    setShowNewCategoryModal(false);
  };

  const handleModalSuccess = () => {
    setShowNewCategoryModal(false);
    fetchCategories(); // Atualiza a lista após criar
  };

  // Ícones mapeados (Lucide React SVG)
  const getIcon = (iconName: string | null): React.ReactNode => {
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
    };
    return icons[iconName || ""] || icons.wallet;
  };

  // Badge de tipo com cor condicional
  const getTypeBadge = (type: "INCOME" | "EXPENSE") => {
    if (type === "INCOME") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
          Receita
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
        <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
        Despesa
      </span>
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-emerald-400 text-xl animate-pulse">
          Carregando categorias...
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/entrar");
    return null;
  }

  return (
    <TooltipProvider>
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

        {/* ✅ HEADER PADRONIZADO */}
        <CabecalhoPagina
          title="Categorias"
          description="Organize suas receitas e despesas"
          breadcrumbs={[{ label: "Categorias" }]}
        >
            <div className="flex bg-slate-800 rounded-lg p-1 mr-2">
              <button
                onClick={() => setShowArchived(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  !showArchived
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <PieChart className="w-3 h-3" />
                Ativas
              </button>
              <button
                onClick={() => setShowArchived(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  showArchived
                    ? "bg-amber-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Archive className="w-3 h-3" />
                Lixeira
                {categories.filter((c) => c.isArchived).length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-slate-700 rounded-full">
                    {categories.filter((c) => c.isArchived).length}
                  </span>
                )}
              </button>
            </div>
          <button
            onClick={fetchCategories}
            className="p-2 text-slate-400 hover:text-emerald-400 transition-colors hidden sm:block"
            title="Atualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:block">Nova Categoria</span>
          </button>
        </CabecalhoPagina>

        {/* Conteúdo Principal */}
        <main className="relative z-10 p-8">
          <div className="max-w-6xl mx-auto">
            {/* ✅ MENSAGEM DE INFO QUANDO NA LIXEIRA */}
            {showArchived && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                <Archive className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-400">
                    Visualizando categorias arquivadas
                  </p>
                  <p className="text-xs text-amber-300 mt-1">
                    Categorias arquivadas não aparecem nas transações. Você pode
                    restaurá-las.
                  </p>
                </div>
              </div>
            )}

            {/* Filtro por Tipo */}
            {!showArchived && (
              <div className="mb-8 flex justify-end">
                <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setFilterType("ALL")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      filterType === "ALL"
                        ? "bg-emerald-600 text-white shadow-lg"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setFilterType("INCOME")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1 ${
                      filterType === "INCOME"
                        ? "bg-emerald-600 text-white shadow-lg"
                        : "text-emerald-400 hover:text-emerald-300"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                    Receitas
                  </button>
                  <button
                    onClick={() => setFilterType("EXPENSE")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1 ${
                      filterType === "EXPENSE"
                        ? "bg-red-600 text-white shadow-lg"
                        : "text-red-400 hover:text-red-300"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                    Despesas
                  </button>
                </div>
              </div>
            )}

            {/* Mensagem de Erro */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                {error}
                <button
                  onClick={fetchCategories}
                  className="ml-4 underline hover:text-red-300"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* Lista de Categorias */}
            {categories.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  {showArchived ? (
                    <Archive className="w-8 h-8 text-slate-500" />
                  ) : (
                    <svg
                      className="w-8 h-8 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {showArchived
                    ? "Nenhuma categoria arquivada"
                    : "Nenhuma categoria cadastrada"}
                </h3>
                <p className="text-slate-400 mb-6">
                  {showArchived
                    ? "Categorias arquivadas aparecerão aqui"
                    : "Comece adicionando suas primeiras categorias"}
                </p>
                {!showArchived && (
                  <button
                    onClick={handleOpenModal}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Adicionar Categoria
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`group relative p-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl ${
                      category.parentId ? "ml-4 border-l-4" : ""
                    } ${category.isArchived ? "opacity-60" : ""}`}
                    style={{
                      borderColor: category.parentId
                        ? category.color
                        : `${category.color}40`,
                      backgroundColor: category.parentId
                        ? `${category.color}08`
                        : undefined,
                    }}
                  >
                    {/* Cor de destaque lateral */}
                    <div
                      className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
                      style={{ backgroundColor: category.color }}
                    />

                    {/* Badge de Subcategoria */}
                    {category.parentId && category.parent && (
                      <div className="absolute -top-2 -left-2 px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded-full border border-slate-700">
                        Sub: {category.parent.name}
                      </div>
                    )}

                    {/* Badge de Arquivada */}
                    {category.isArchived && (
                      <div className="absolute -top-2 -right-2 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
                        📦 Arquivada
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                        style={{
                          backgroundColor: `${category.color}20`,
                          color: category.color,
                        }}
                      >
                        {getIcon(category.icon)}
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex gap-2">
                        {/* NA LIXEIRA: Restaurar + Excluir Permanente */}
                        {showArchived ? (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() =>
                                    handleArchive(
                                      category.id,
                                      category.name,
                                      true,
                                    )
                                  }
                                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                >
                                  <Archive className="w-5 h-5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Restaurar categoria</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() =>
                                    handleDeletePermanent(category.id)
                                  }
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-red-400">
                                  Excluir Permanentemente
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            {/* NAS ATIVAS: Arquivar + Editar */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() =>
                                    handleArchive(
                                      category.id,
                                      category.name,
                                      false,
                                    )
                                  }
                                  className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                >
                                  <Archive className="w-5 h-5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Enviar para Lixeira</p>
                              </TooltipContent>
                            </Tooltip>

                            <Link
                              href={`/painel/categorias/${category.id}/editar`}
                              className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                              title="Editar categoria"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-1">
                      {category.name}
                    </h3>

                    {/* Badge de Tipo */}
                    <div className="mb-4">{getTypeBadge(category.type)}</div>

                    <div className="space-y-2">
                      {/* Contador de Transações */}
                      {category._count?.transactions !== undefined && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Transações</span>
                          <span className="text-slate-300 font-medium">
                            {category._count.transactions}
                          </span>
                        </div>
                      )}

                      {/* Data de Criação */}
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Criada em</span>
                        <span>
                          {new Date(category.createdAt).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Link para ver transações da categoria */}
                    {!category.isArchived && (
                      <Link
                        href={`/painel/transacoes?categoria=${category.id}`}
                        className="mt-4 block text-center text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Ver transações →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Resumo */}
            {!showArchived && categories.length > 0 && (
              <div className="mt-8 p-6 bg-slate-900/50 rounded-2xl border border-emerald-500/20">
                <div className="flex flex-wrap gap-6 justify-between items-center">
                  <div className="flex gap-8">
                    <div>
                      <span className="text-slate-400 text-sm">
                        Total de Categorias
                      </span>
                      <p className="text-2xl font-bold text-white">
                        {categories.length}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-sm">Receitas</span>
                      <p className="text-2xl font-bold text-emerald-400">
                        {categories.filter((c) => c.type === "INCOME").length}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-sm">Despesas</span>
                      <p className="text-2xl font-bold text-red-400">
                        {categories.filter((c) => c.type === "EXPENSE").length}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={fetchCategories}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ✅ MODAL FUTURISTA PARA NOVA CATEGORIA */}
        <ModalNovaCategoria
          isOpen={showNewCategoryModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          parentCategories={parentCategories}
        />
      </div>
    </TooltipProvider>
  );
}
