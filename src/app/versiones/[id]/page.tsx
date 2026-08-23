import type { Metadata } from "next";
import { Visor } from "@/components/visor/Visor";

export const metadata: Metadata = {
  title: "Versión",
};

export default async function Page(props: PageProps<"/versiones/[id]">) {
  const { id } = await props.params;
  return <Visor versionId={id} />;
}
