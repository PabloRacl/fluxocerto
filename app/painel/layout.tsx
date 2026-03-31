"use client";

import { useState, useEffect } from "react";
import { NeuroLauncher } from "./_componentes/NeuroLauncher";

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsLauncherOpen(true);
    window.addEventListener("open-neuro-launcher", handleOpen);
    return () => window.removeEventListener("open-neuro-launcher", handleOpen);
  }, []);

  return (
    <>
      <NeuroLauncher isOpen={isLauncherOpen} onClose={() => setIsLauncherOpen(false)} />
      {children}
    </>
  );
}
