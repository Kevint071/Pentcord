import type { Metadata } from "next";
import { ExigeSesion } from "@/components/ui/ExigeSesion";
import { Ajustes } from "@/components/cuenta/Ajustes";

export const metadata: Metadata = { title: "Ajustes" };

export default function Page() {
  return (
    <ExigeSesion>
      <Ajustes />
    </ExigeSesion>
  );
}
