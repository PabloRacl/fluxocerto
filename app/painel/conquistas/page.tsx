"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CabecalhoPainel } from "@/app/painel/_componentes/CabecalhoPainel";
import { CabecalhoPagina } from "@/app/painel/_componentes/CabecalhoPagina";
import { PainelGamificacao } from "@/app/painel/_componentes/PainelGamificacao";
import { Trophy } from "lucide-react";

export default function ConquistasPage() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <CabecalhoPagina
        title="Minhas Conquistas"
        description="Central de progressão do seu perfil de Mestre Financeiro."
        breadcrumbs={[{ label: "Minhas Conquistas" }]}
      />

      <main className="p-8 max-w-7xl mx-auto">

        <div className="mt-8">
          <PainelGamificacao userId={session.user.id as string} />
        </div>
      </main>
    </div>
  );
}
