import { redirect } from "next/navigation";
import { Inicio } from "@/components/inicio/Inicio";

/**
 * Inicio. Hasta el 2026-09-11 esta ruta era el buscador; desde entonces el
 * buscador vive en `/buscar` y aquí se elige entre buscar y aportar.
 *
 * Las búsquedas de antes se compartían como `/?q=…`, así que una URL con
 * parámetros de búsqueda se reenvía a su sitio nuevo en vez de aterrizar en
 * una portada que ignora lo que se pedía.
 */
export default async function Home(props: PageProps<"/">) {
  const parametros = await props.searchParams;

  const busqueda = new URLSearchParams();
  for (const clave of ["q", "autor", "page"] as const) {
    const valor = parametros[clave];
    const texto = Array.isArray(valor) ? valor[0] : valor;
    if (texto) busqueda.set(clave, texto);
  }

  const cadena = busqueda.toString();
  if (cadena) redirect(`/buscar?${cadena}`);

  return <Inicio />;
}
