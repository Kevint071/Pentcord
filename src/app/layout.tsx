import type { Metadata, Viewport } from "next";
import { Big_Shoulders, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { Encabezado } from "@/components/nav/Encabezado";
import { BarraNavegacion } from "@/components/nav/BarraNavegacion";
import { SesionProvider } from "@/lib/sesion/SesionProvider";
import { GUION_DE_TEMA } from "@/components/tema/guionDeTema";

/* Tres voces tipográficas, cada una con un trabajo:
 * - Rótulo: condensada y alta, como un cartel de sala de ensayo. Se usa poco:
 *   la marca, los títulos y las letras del selector de tono.
 * - Interfaz: legible y neutra, con buenas tildes y eñes.
 * - Monoespaciada: el sustrato del cifrado. La alineación entre la línea de
 *   acordes y la letra depende de que todos los caracteres midan igual (C.1). */
const fuenteRotulo = Big_Shoulders({
  variable: "--fuente-rotulo",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const fuenteUi = IBM_Plex_Sans({
  variable: "--fuente-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const fuenteMono = IBM_Plex_Mono({
  variable: "--fuente-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PentCord",
    template: "%s · PentCord",
  },
  description:
    "Letras y acordes para músicos: busca una canción, ábrela y transpórtala al tono que necesites.",
};

export const viewport: Viewport = {
  // El tema real lo fija `data-theme`; esto solo pinta la barra del navegador
  // del color correcto en cada modo.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eaebe4" },
    { media: "(prefers-color-scheme: dark)", color: "#101311" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${fuenteRotulo.variable} ${fuenteUi.variable} ${fuenteMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: GUION_DE_TEMA }} />
      </head>
      <body className="flex min-h-full flex-col">
        <SesionProvider>
          <a
            href="#contenido"
            className="salto-contenido rounded-full bg-tinta px-4 py-2 text-sm font-medium text-papel"
          >
            Saltar al contenido
          </a>

          <Encabezado />

          {/* El espacio inferior deja sitio a la barra fija de móvil. */}
          <main id="contenido" className="flex flex-1 flex-col pb-24 md:pb-10">
            {children}
          </main>

          <BarraNavegacion />
        </SesionProvider>
      </body>
    </html>
  );
}
