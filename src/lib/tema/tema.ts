/**
 * Núcleo de tema, compartido entre el interruptor del encabezado y
 * Preferencias (2026-09-05). El tema real no vive en React: vive en el
 * atributo `data-theme` del documento (lo pone el guion previo al pintado) y
 * en la preferencia del sistema.
 */
import { CLAVE_DE_TEMA } from "@/components/tema/guionDeTema";

export type Tema = "light" | "dark";

export const EVENTO_DE_TEMA = "pentcord:tema";

export function leerTema(): Tema {
  const marcado = document.documentElement.getAttribute("data-theme");
  if (marcado === "light" || marcado === "dark") return marcado;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Aplica el tema al documento y avisa a quien esté suscrito, solo si cambia. */
export function aplicarTema(tema: Tema) {
  if (leerTema() === tema) return;
  document.documentElement.setAttribute("data-theme", tema);
  try {
    localStorage.setItem(CLAVE_DE_TEMA, tema);
  } catch {
    // Modo privado o almacenamiento bloqueado: el tema dura esta sesión.
  }
  window.dispatchEvent(new Event(EVENTO_DE_TEMA));
}
