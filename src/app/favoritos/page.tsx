import type { Metadata } from "next";
import { ExigeSesion } from "@/components/ui/ExigeSesion";
import { Favoritos } from "@/components/favoritos/Favoritos";

export const metadata: Metadata = { title: "Favoritos" };

export default function Page() {
  return (
    <ExigeSesion>
      <Favoritos />
    </ExigeSesion>
  );
}
