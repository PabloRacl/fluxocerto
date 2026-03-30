"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/app/painel/_componentes/DashboardHeader";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import { GamificacaoPanel } from "@/app/painel/_componentes/GamificacaoPanel";
import { Trophy } from "lucide-react";

export default function ConquistasPage() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <DashboardHeader 
        user={session.user} 
        onSignOut={async () => {
          await fetch("/api/auth/signout", { method: "POST" });
          router.push("/entrar");
        }} 
      />
      
      <main className="p-8 max-w-7xl mx-auto">
        <PageHeader
          title="Minhas Conquistas"
          description="Acompanhe seu nível, metas e medalhas conquistadas."
        />

        <div className="mt-8">
          <GamificacaoPanel userId={session.user.id as string} />
        </div>
      </main>
    </div>
  );
}
