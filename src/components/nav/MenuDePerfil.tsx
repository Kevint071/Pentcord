"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSesion } from "@/lib/sesion/SesionProvider";
import { Avatar } from "@/components/perfil/Avatar";
import {
  IconoAjustes,
  IconoFavoritos,
  IconoPerfil,
  IconoPreferencias,
} from "./iconos";

const ITEMS = [
  { href: "/favoritos", etiqueta: "Favoritos", icono: IconoFavoritos },
  { href: "/perfil", etiqueta: "Perfil", icono: IconoPerfil },
] as const;

const ITEMS_CUENTA = [
  { href: "/cuenta", etiqueta: "Ajustes", icono: IconoAjustes },
  { href: "/preferencias", etiqueta: "Preferencias", icono: IconoPreferencias },
] as const;

/**
 * D · Menú de perfil (2026-09-05). Sustituye al ítem "Perfil" del riel: un
 * avatar que abre Favoritos/Perfil/Ajustes/Preferencias. Solo se monta con
 * sesión (`Encabezado` lo condiciona), pero además se protege sola por si se
 * usa en otro lado.
 */
export function MenuDePerfil() {
  const { usuario } = useSesion();
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const primerItemRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (abierto) primerItemRef.current?.focus();
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    function alClicFuera(evento: MouseEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    function alEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setAbierto(false);
        botonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", alEscape);
    return () => document.removeEventListener("keydown", alEscape);
  }, [abierto]);

  useEffect(() => {
    setAbierto(false);
    // Se quiere disparar solo cuando cambia la ruta, no en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruta]);

  if (!usuario) return null;

  return (
    <div ref={contenedorRef} className="relative">
      <button
        ref={botonRef}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Menú de perfil"
        className="flex items-center gap-1 rounded-full p-0.5 transition-colors hover:bg-hoja"
      >
        <Avatar
          id={usuario.id}
          username={usuario.username}
          fotoPerfilUrl={usuario.fotoPerfilUrl}
          tamano="sm"
        />
        <svg viewBox="0 0 24 24" className="size-3.5 text-tinta-suave" aria-hidden="true">
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {abierto ? (
        <div
          role="menu"
          aria-label="Menú de perfil"
          className="absolute right-0 top-full z-40 mt-2 w-52 rounded-xl border border-pauta bg-hoja-alta py-1.5 shadow-hoja"
        >
          {ITEMS.map(({ href, etiqueta, icono: Icono }, indice) => (
            <Link
              key={href}
              ref={indice === 0 ? primerItemRef : undefined}
              href={href}
              role="menuitem"
              className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-tinta transition-colors hover:bg-hoja"
            >
              <Icono className="size-4.5 text-tinta-suave" />
              {etiqueta}
            </Link>
          ))}
          <div className="my-1.5 border-t border-pauta" />
          {ITEMS_CUENTA.map(({ href, etiqueta, icono: Icono }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-tinta transition-colors hover:bg-hoja"
            >
              <Icono className="size-4.5 text-tinta-suave" />
              {etiqueta}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
