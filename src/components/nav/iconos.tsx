/**
 * Iconos de navegación: los cuatro de siempre (Buscar/Favoritos/Aportar/
 * Perfil, C.2) más los dos nuevos del menú de perfil (Ajustes, Preferencias,
 * 2026-09-05). Centralizados aquí para que `destinos.tsx` y `MenuDePerfil.tsx`
 * compartan el mismo trazo.
 */

const trazo = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function IconoBuscar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="6.2" {...trazo} />
      <path d="m15.6 15.6 4 4" {...trazo} />
    </svg>
  );
}

export function IconoFavoritos({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 16.9l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85z"
        {...trazo}
      />
    </svg>
  );
}

export function IconoAportar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" {...trazo} />
    </svg>
  );
}

export function IconoPerfil({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="8.6" r="3.5" {...trazo} />
      <path d="M4.8 20a7.4 7.4 0 0 1 14.4 0" {...trazo} />
    </svg>
  );
}

export function IconoAjustes({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3" {...trazo} />
      <path
        d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6M17.7 17.7l-1.6-1.6M7.9 7.9 6.3 6.3"
        {...trazo}
      />
    </svg>
  );
}

export function IconoPreferencias({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" {...trazo} />
      <circle cx="13" cy="7" r="2.1" fill="currentColor" stroke="none" />
      <circle cx="7" cy="17" r="2.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
