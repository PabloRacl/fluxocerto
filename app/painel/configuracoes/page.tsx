"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CabecalhoPagina } from "@/app/painel/_componentes/CabecalhoPagina";
import { Settings, Save, RefreshCw, ShieldCheck, ChevronRight, Trash2, Database, AlertCircle, Skull, User, Lock, Sliders, Fingerprint, Activity, ShieldAlert } from "lucide-react";
import { signOut } from "next-auth/react";

export default function ConfiguracoesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("perfil");

  // Estado Geral
  const [form, setForm] = useState({
    name: "",
    email: "",
    sessionDuration: "7",
    autoLogoutMinutes: "30",
    darkMode: false,
    currency: "BRL",
    timezone: "America/Sao_Paulo",
  });

  // Estado de Senha
  const [senhaForm, setSenhaForm] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: ""
  });
  const [senhaLoading, setSenhaLoading] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const res = await fetch("/api/configuracoes", { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const u = data.usuario;
      setForm({
        name: u.name || "",
        email: u.email || "",
        sessionDuration: String(u.sessionDuration || 7),
        autoLogoutMinutes: String(u.autoLogoutMinutes || 30),
        darkMode: u.darkMode || false,
        currency: u.currency || "BRL",
        timezone: u.timezone || "America/Sao_Paulo",
      });
    } catch {
      console.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") fetchConfig();
  }, [status, fetchConfig]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/entrar");
    return null;
  }

  const handleDataReset = async (type: string, label: string) => {
    const confirmMessage = type === "full_account_delete" 
      ? `ATENÇÃO: Isso excluirá sua conta e TODOS os seus dados permanentemente. Reservado apenas para casos críticos. Digite "EXCLUIR" para confirmar:` 
      : `Deseja realmente limpar seus dados de ${label}? Esta ação é irreversível.`;
    
    if (type === "full_account_delete") {
      const input = prompt(confirmMessage);
      if (input !== "EXCLUIR") return;
    } else {
      if (!confirm(confirmMessage)) return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/usuario/reset-data", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        alert("Dados processados com sucesso no servidor neural.");
        if (type === "full_account_delete") {
          signOut({ callbackUrl: "/entrar" });
        } else {
          window.location.reload();
        }
      } else {
        alert("Erro na conexão com os protocolos de limpeza.");
      }
    } catch {
      alert("Falha crítica no motor de limpeza.");
    } finally {
      setSaving(false);
    }
  };

  const salvar = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/configuracoes", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sessionDuration: parseInt(form.sessionDuration),
          autoLogoutMinutes: parseInt(form.autoLogoutMinutes),
          darkMode: form.darkMode,
          currency: form.currency,
          timezone: form.timezone,
        }),
      });
      if (res.ok) alert("Módulos salvos com sucesso.");
    } catch {
      console.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const alterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if(senhaForm.novaSenha !== senhaForm.confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }
    if(senhaForm.novaSenha.length < 6) {
      alert("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setSenhaLoading(true);
    try {
      const res = await fetch("/api/usuario/senha", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senhaAtual: senhaForm.senhaAtual,
          novaSenha: senhaForm.novaSenha
        })
      });
      const data = await res.json();
      if(!res.ok) {
        alert(data.error || "Erro ao alterar credenciais.");
      } else {
        alert("Protocolo de segurança atualizado. Senha alterada!");
        setSenhaForm({ senhaAtual: "", novaSenha: "", confirmarSenha: "" });
      }
    } catch (err) {
      alert("Erro na matriz de segurança. Tente novamente.");
    } finally {
      setSenhaLoading(false);
    }
  };

  const TABS = [
    { id: "perfil", label: "Perfil", icon: User },
    { id: "seguranca", label: "Segurança", icon: Lock },
    { id: "preferencias", label: "Preferências", icon: Sliders },
    { id: "danger", label: "Zona de Risco", icon: Skull },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <CabecalhoPagina
        title="Painel de Controle"
        description="Parâmetros de sistema e segurança cognitiva"
        breadcrumbs={[ { label: "Configurações" } ]}
      >
        <button
          onClick={fetchConfig}
          className="p-2 text-slate-400 hover:text-blue-400 transition-colors bg-white/5 border border-white/5 rounded-xl mr-2"
          title="Sincronizar"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </CabecalhoPagina>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-800 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Sincronizando Módulos...</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Sidebar Tabs */}
            <aside className="w-full md:w-64 shrink-0">
              <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest whitespace-nowrap min-w-40 md:min-w-0 ${
                        isActive
                          ? tab.id === "danger" 
                            ? "bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                          : "bg-slate-900/50 text-slate-500 border border-white/5 hover:bg-slate-900 hover:text-slate-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-8 p-4 bg-slate-900/40 border border-white/5 rounded-2xl hidden md:block">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status do Motor</span>
                </div>
                <p className="text-xs text-slate-500">
                  Todas as conexões criptografadas de ponta a ponta. 
                  Sistemas operando na versão v24.2.
                </p>
              </div>
            </aside>

            {/* Content Area */}
            <div className="flex-1 min-w-0 pb-24">
              
              {/* TAB: PERFIL */}
              {activeTab === "perfil" && (
                <div className="bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-500 relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                  {/* Decorator */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]" />
                  
                  <div className="mb-8 relative z-10">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                      <User className="w-6 h-6 text-blue-500" />
                      Identidade Neural
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">Gerencie como você é identificado dentro do sistema.</p>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Apelido / Nome</label>
                        <input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                          placeholder="Como quer ser chamado?"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Via de Contato (E-mail)</label>
                        <input
                          value={form.email}
                          disabled
                          className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-xl text-slate-500 cursor-not-allowed"
                        />
                        <p className="text-[10px] text-slate-600 mt-1">*Vínculo principal imutável.</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                      <button
                        onClick={salvar}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" /> 
                        {saving ? "Registrando..." : "Registrar Alterações"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SEGURANÇA */}
              {activeTab === "seguranca" && (
                <div className="bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-500 relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px]" />
                  
                  <div className="mb-8 relative z-10">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                      <ShieldCheck className="w-6 h-6 text-emerald-500" />
                      Núcleo de Segurança
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">Acesso, credenciais e tempo de duração das suas chaves.</p>
                  </div>

                  <div className="space-y-8 relative z-10">
                    
                    {/* Alerta de Google */}
                    {!form.email ? null : (
                      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Fingerprint className="w-4 h-4 text-slate-500" />
                          Alterar Chave Mestra (Senha)
                        </h3>
                        <form onSubmit={alterarSenha} className="space-y-4 max-w-md">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha Atual</label>
                            <input
                              type="password"
                              value={senhaForm.senhaAtual}
                              onChange={e => setSenhaForm({...senhaForm, senhaAtual: e.target.value})}
                              className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none transition-colors"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nova Senha</label>
                            <input
                              type="password"
                              value={senhaForm.novaSenha}
                              onChange={e => setSenhaForm({...senhaForm, novaSenha: e.target.value})}
                              className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none transition-colors"
                              required
                              minLength={6}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirmar Nova Senha</label>
                            <input
                              type="password"
                              value={senhaForm.confirmarSenha}
                              onChange={e => setSenhaForm({...senhaForm, confirmarSenha: e.target.value})}
                              className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none transition-colors"
                              required
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={senhaLoading}
                            className="bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-500 py-2.5 px-6 rounded-xl font-black uppercase tracking-widest text-xs transition-all w-full mt-2"
                          >
                            {senhaLoading ? "Criptografando..." : "ATUALIZAR SENHA"}
                          </button>
                        </form>
                      </div>
                    )}

                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-500" />
                        Tempo Limite de Sessão
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Duração da sessão (dias)</label>
                          <input
                            type="number"
                            value={form.sessionDuration}
                            onChange={(e) => setForm({ ...form, sessionDuration: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Auto logout (minutos)</label>
                          <input
                            type="number"
                            value={form.autoLogoutMinutes}
                            onChange={(e) => setForm({ ...form, autoLogoutMinutes: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors"
                          />
                        </div>
                      </div>
                      <div className="mt-6 flex gap-4">
                        <button
                          onClick={salvar}
                          disabled={saving}
                          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all"
                        >
                          Salvar Sessão
                        </button>
                      </div>
                    </div>
                    
                  </div>
                </div>
              )}

              {/* TAB: PREFERENCIAS */}
              {activeTab === "preferencias" && (
                <div className="bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-500 relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px]" />
                  
                  <div className="mb-8 relative z-10">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                      <Sliders className="w-6 h-6 text-cyan-500" />
                      Matrix Sensorial (Preferências)
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">Ajuste como os dados e as interfaces são apresentados a você.</p>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Financeira</label>
                        <select
                          value={form.currency}
                          onChange={(e) => setForm({ ...form, currency: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white outline-none cursor-pointer"
                        >
                          <option value="BRL">BRL - Real Brasileiro</option>
                          <option value="USD">USD - Dólar Americano</option>
                          <option value="EUR">EUR - Euro</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Localização/Fuso Horário</label>
                        <select
                          value={form.timezone}
                          onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white outline-none cursor-pointer"
                        >
                          <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                          <option value="America/Manaus">Manaus (GMT-4)</option>
                          <option value="America/Belem">Belém (GMT-3)</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-6">
                      <label className="flex items-center gap-4 cursor-pointer p-4 bg-slate-900/50 border border-white/5 rounded-xl hover:bg-slate-900 transition-colors">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={form.darkMode}
                            onChange={(e) => setForm({ ...form, darkMode: e.target.checked })}
                            className="sr-only"
                          />
                          <div className={`w-12 h-6 rounded-full transition-colors ${form.darkMode ? "bg-cyan-500" : "bg-slate-700"}`} />
                          <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${form.darkMode ? "translate-x-6" : ""}`} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-widest">Tema Obscuro Ativo</p>
                          <p className="text-[10px] text-slate-500 uppercase">Forçar modo noturno na interface principal</p>
                        </div>
                      </label>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                      <button
                        onClick={salvar}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" /> Registrar Preferências
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: DANGER ZONE */}
              {activeTab === "danger" && (
                <div className="bg-red-500/5 backdrop-blur-2xl rounded-3xl border border-red-500/20 p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-500 relative overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.15)]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] pointer-events-none" />
                  
                  <div className="absolute top-4 right-4 animate-pulse opacity-50 pointer-events-none">
                    <ShieldAlert className="w-32 h-32 text-red-500/20" />
                  </div>

                  <div className="mb-8 relative z-10">
                    <h2 className="text-xl font-black text-red-500 uppercase tracking-tight flex items-center gap-3">
                      <Skull className="w-6 h-6" />
                      Protocolos Destrutivos
                    </h2>
                    <p className="text-sm text-red-400 mt-1">Atenção: Ações tomadas nesta área não poderão ser desfeitas e os dados serão obliterados.</p>
                  </div>

                  <div className="space-y-4 relative z-10 max-w-xl">
                    <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-red-500/10 rounded-xl">
                          <RefreshCw className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white tracking-widest uppercase">Resetar Mapeamentos</h4>
                          <p className="text-[10px] text-slate-500 uppercase">Apaga configurações locais de exibição de dados.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDataReset("mappings", "Mapeamentos de Notas")}
                        className="w-full py-2 bg-slate-900 hover:bg-red-500/20 border border-slate-800 hover:border-red-500/50 text-slate-400 hover:text-red-400 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                      >
                        Executar Reset
                      </button>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-red-500/10 rounded-xl">
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white tracking-widest uppercase">Eradicar Transações</h4>
                          <p className="text-[10px] text-slate-500 uppercase">Elimina todas as movimentações financeiras da conta.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDataReset("transactions", "Transações")}
                        className="w-full py-2 bg-slate-900 hover:bg-red-500/20 border border-slate-800 hover:border-red-500/50 text-slate-400 hover:text-red-400 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                      >
                        Executar Apagamento
                      </button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-red-500/20">
                      <button
                        onClick={() => handleDataReset("full_account_delete", "MINHA CONTA")}
                        className="w-full flex items-center justify-center gap-3 p-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)] animate-pulse hover:animate-none"
                      >
                        <AlertCircle className="w-5 h-5" /> AUTO-DESTRUIÇÃO MANTÉM OS DADOS SEGUROS
                      </button>
                      <p className="text-center text-[9px] text-red-500/50 uppercase mt-3 tracking-widest">
                        Aviso: Esta ação encerra o painel imediatamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

