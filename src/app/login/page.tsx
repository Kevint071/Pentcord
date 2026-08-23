import type { Metadata } from "next";
import { Suspense } from "react";
import { PantallaDeLogin } from "@/components/sesion/PantallaDeLogin";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PantallaDeLogin />
    </Suspense>
  );
}
