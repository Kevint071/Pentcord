/**
 * C.2 · Los cuatro destinos de la barra fija (Fase 7 §1).
 *
 * Se definen una sola vez para que la barra inferior de móvil y el riel del
 * encabezado en escritorio no se puedan desincronizar.
 *
 * El panel de administración NO está aquí a propósito: vive dentro de Perfil y
 * solo aparece si el rol es `administrador`.
 */

export type Destino = {
  href: string;
  etiqueta: string;
  /** Redirige a login si no hay sesión, recordando a dónde iba. */
  exigeSesion: boolean;
  icono: (props: { className?: string }) => React.ReactElement;
};

const trazo = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export const DESTINOS: Destino[] = [
  {
    href: "/",
    etiqueta: "Buscar",
    exigeSesion: false,
    icono: ({ className }) => (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <circle cx="11" cy="11" r="6.2" {...trazo} />
        <path d="m15.6 15.6 4 4" {...trazo} />
      </svg>
    ),
  },
  {
    href: "/favoritos",
    etiqueta: "Favoritos",
    exigeSesion: true,
    icono: ({ className }) => (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 16.9l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85z"
          {...trazo}
        />
      </svg>
    ),
  },
  {
    href: "/aportar",
    etiqueta: "Aportar",
    exigeSesion: true,
    icono: ({ className }) => (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path d="M12 5v14M5 12h14" {...trazo} />
      </svg>
    ),
  },
  {
    href: "/perfil",
    etiqueta: "Perfil",
    exigeSesion: true,
    icono: ({ className }) => (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <circle cx="12" cy="8.6" r="3.5" {...trazo} />
        <path d="M4.8 20a7.4 7.4 0 0 1 14.4 0" {...trazo} />
      </svg>
    ),
  },
];

/** El destino activo es el de la ruta más específica que coincide. */
export function esDestinoActivo(href: string, ruta: string) {
  if (href === "/") {
    // Buscar también manda mientras se navega el catálogo público.
    return (
      ruta === "/" ||
      ruta.startsWith("/canciones") ||
      ruta.startsWith("/versiones")
    );
  }
  return ruta === href || ruta.startsWith(`${href}/`);
}
