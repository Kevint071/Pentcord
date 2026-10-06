/**
 * C.2 · Los destinos de la barra fija (Fase 7 §1), recortados el 2026-09-05:
 * Favoritos y Perfil se mudaron al menú del avatar (`MenuDePerfil.tsx`) y ya
 * no viven en el riel. Sus iconos se conservan en `iconos.tsx` para ese menú.
 *
 * El panel de administración NO está aquí a propósito: vive dentro de Perfil y
 * solo aparece si el rol es `administrador`.
 */
import { IconoAportar, IconoBuscar } from "./iconos";

export type Destino = {
  href: string;
  etiqueta: string;
  /** Redirige a login si no hay sesión, recordando a dónde iba. */
  exigeSesion: boolean;
  icono: (props: { className?: string }) => React.ReactElement;
};

export const DESTINOS: Destino[] = [
  { href: "/buscar", etiqueta: "Buscar", exigeSesion: false, icono: IconoBuscar },
  { href: "/aportar", etiqueta: "Aportar", exigeSesion: true, icono: IconoAportar },
];

/** El destino activo es el de la ruta más específica que coincide. */
export function esDestinoActivo(href: string, ruta: string) {
  if (href === "/buscar") {
    // Buscar también manda mientras se navega el catálogo público. El inicio
    // (`/`) queda fuera a propósito: desde el 2026-09-11 es una pantalla
    // propia, no la de buscar, y no debe subrayar ninguna pestaña del riel.
    return (
      ruta === "/buscar" ||
      ruta.startsWith("/canciones") ||
      ruta.startsWith("/versiones")
    );
  }
  return ruta === href || ruta.startsWith(`${href}/`);
}
