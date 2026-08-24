import type { Metadata } from "next";
import { ExigeSesion } from "@/components/ui/ExigeSesion";
import { Aportar } from "@/components/aportar/Aportar";

export const metadata: Metadata = { title: "Aportar" };

/**
 * E.3 · Aportar (HU-08, HU-09, HU-10).
 *
 * `?cancion=<id>` decide el destino: con id se aporta una versión a esa
 * canción, sin id se aporta una canción nueva. Se lee aquí, en el servidor, y
 * no con `useSearchParams`, para que el componente no necesite ir detrás de un
 * límite de Suspense.
 */
export default async function Page(props: PageProps<"/aportar">) {
  const { cancion } = await props.searchParams;
  const id = Number(Array.isArray(cancion) ? cancion[0] : cancion);

  return (
    <ExigeSesion>
      <Aportar cancionId={Number.isInteger(id) && id > 0 ? id : null} />
    </ExigeSesion>
  );
}
