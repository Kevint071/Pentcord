import type { Metadata } from "next";
import { DetalleDeCancion } from "@/components/cancion/DetalleDeCancion";

export const metadata: Metadata = {
  title: "Canción",
};

export default async function Page(props: PageProps<"/canciones/[id]">) {
  const { id } = await props.params;
  return <DetalleDeCancion id={id} />;
}
