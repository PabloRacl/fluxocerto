"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
// ✅ IMPORT DO NOVO MODAL FUTURISTA
import NewCategoryModal from "./_components/NewCategoryModal";

// Tipo para a categoria
interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  icon: string | null;
  parentId: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    transactions: number;
  };
  parent?: {
    id: string;
    name: string;
  };
}

// Cores disponíveis (16 cores fixas - mesmo padrão das contas)
const AVAILABLE_COLORS = [
  "#047857", "#10B981", "#059669", "#04957E",
  "#8B5CF6", "#6366F1", "#3B82F6", "#2563EB",
  "#F59E0B", "#D97706", "#DC2626", "#EF4444",
  "#EC4899", "#DB2777", "#14B8A6", "#0D9488",
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

export default function CategoriesPage() {
  console.log("🟢 CategoriasPage carregou!");
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  
  // ✅ ESTADOS PARA O MODAL FUTURISTA
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);

  // Buscar categorias ao carregar a página
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchCategories();
      fetchParentCategories(); // ✅ Buscar categorias pai para o modal
    }
  }, [status, router, filterType]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Construir URL com filtro de tipo
      let url = "/api/categories";
      if (filterType !== "ALL") {
        url += `?type=${filterType}`;
      }
      
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
  };

  // ✅ BUSCAR CATEGORIAS PRINCIPAIS PARA O MODAL
  const fetchParentCategories = async () => {
    try {
      const res = await fetch("/api/categories", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        // Filtrar apenas categorias principais (sem pai)
        setParentCategories(Array.isArray(data) ? data.filter((c: Category) => !c.parentId) : []);
      }
    } catch (err) {
      console.error("Erro ao buscar categorias pai:", err);
    }
  };

  // Função para arquivar categoria
  const handleArchive = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Tem certeza que deseja arquivar "${categoryName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (res.ok) {
        fetchCategories(); // Recarregar lista
      } else {
        const data = await res.json();
        if (data.transactionCount > 0) {
          alert(`Não é possível arquivar "${categoryName}" porque possui ${data.transactionCount} transações vinculadas.`);
        } else {
          alert(data.error || "Erro ao arquivar categoria");
        }
      }
    } catch (err) {
      alert("Erro ao arquivar categoria");
      console.error(err);
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
  const getIcon = (iconName: string | null) => {
    const icons: Record<string, JSX.Element> = {
      wallet: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      "piggy-bank": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      "credit-card": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      banknote: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      "shopping-cart": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      utensils: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      landmark: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      ),
      coins: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        <div className="text-emerald-400 text-xl animate-pulse">Carregando categorias...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(16, 185, 129, 0.2), transparent 70%)" }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full p-6 flex justify-between items-center backdrop-blur-sm bg-slate-950/50 border-b border-emerald-500/20">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              FluxoCerto
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-300 hidden sm:block">{session?.user?.name}</span>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
          >
            Dashboard
          </button>
          
          {/* ✅ BOTÃO QUE ABRE O MODAL FUTURISTA */}
          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-lg hover:shadow-emerald-500/30 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Categoria
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="relative z-10 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Título e Filtros */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Categorias</h1>
              <p className="text-slate-400">Organize suas receitas e despesas</p>
            </div>
            
            {/* Filtro por Tipo */}
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
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Nenhuma categoria cadastrada</h3>
              <p className="text-slate-400 mb-6">Comece adicionando suas primeiras categorias</p>
              {/* ✅ BOTÃO NO EMPTY STATE TAMBÉM ABRE O MODAL */}
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Adicionar Categoria
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`group relative p-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl ${
                    category.parentId ? "ml-4 border-l-4" : ""
                  }`}
                  style={{ 
                    borderColor: category.parentId ? category.color : `${category.color}40`,
                    backgroundColor: category.parentId ? `${category.color}08` : undefined
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
                  
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      {getIcon(category.icon)}
                    </div>
                    
                    {/* Botões de Ação */}
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/categorias/${category.id}/editar`}
                        className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Editar categoria"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleArchive(category.id, category.name)}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        title="Arquivar categoria"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-1">{category.name}</h3>
                  
                  {/* Badge de Tipo */}
                  <div className="mb-4">
                    {getTypeBadge(category.type)}
                  </div>

                  <div className="space-y-2">
                    {/* Contador de Transações */}
                    {category._count?.transactions !== undefined && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Transações</span>
                        <span className="text-slate-300 font-medium">{category._count.transactions}</span>
                      </div>
                    )}
                    
                    {/* Data de Criação */}
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>Criada em</span>
                      <span>{new Date(category.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>

                  {/* Link para ver transações da categoria */}
                  <Link
                    href={`/dashboard/transacoes?categoria=${category.id}`}
                    className="mt-4 block text-center text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Ver transações →
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Resumo */}
          {categories.length > 0 && (
            <div className="mt-8 p-6 bg-slate-900/50 rounded-2xl border border-emerald-500/20">
              <div className="flex flex-wrap gap-6 justify-between items-center">
                <div className="flex gap-8">
                  <div>
                    <span className="text-slate-400 text-sm">Total de Categorias</span>
                    <p className="text-2xl font-bold text-white">{categories.length}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-sm">Receitas</span>
                    <p className="text-2xl font-bold text-emerald-400">
                      {categories.filter(c => c.type === "INCOME").length}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-sm">Despesas</span>
                    <p className="text-2xl font-bold text-red-400">
                      {categories.filter(c => c.type === "EXPENSE").length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchCategories}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Atualizar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ✅ MODAL FUTURISTA PARA NOVA CATEGORIA */}
      <NewCategoryModal 
        isOpen={showNewCategoryModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        parentCategories={parentCategories}
      />
    </div>
  );
}