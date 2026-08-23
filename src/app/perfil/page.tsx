import type { Metadata } from "next";
import { ExigeSesion } from "@/components/ui/ExigeSesion";
import { Perfil } from "@/components/perfil/Perfil";

export const metadata: Metadata = { title: "Perfil" };

export default function Page() {
  return (
    <ExigeSesion>
      <Perfil />
    </ExigeSesion>
  );
}
