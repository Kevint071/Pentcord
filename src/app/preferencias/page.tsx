import type { Metadata } from "next";
import { ExigeSesion } from "@/components/ui/ExigeSesion";
import { Preferencias } from "@/components/preferencias/Preferencias";

export const metadata: Metadata = { title: "Preferencias" };

export default function Page() {
  return (
    <ExigeSesion>
      <Preferencias />
    </ExigeSesion>
  );
}
