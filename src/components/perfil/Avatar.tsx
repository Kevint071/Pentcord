import { colorDeAvatar } from "@/lib/avatar/colorDeAvatar";

type Tamano = "sm" | "md" | "lg";

const TAMANOS: Record<Tamano, string> = {
  sm: "size-8 text-sm",
  md: "size-11 text-base",
  lg: "size-20 text-2xl",
};

export function Avatar({
  id,
  username,
  fotoPerfilUrl,
  tamano = "md",
}: {
  id: number;
  username: string;
  fotoPerfilUrl: string | null;
  tamano?: Tamano;
}) {
  const base = `shrink-0 overflow-hidden rounded-full border border-pauta ${TAMANOS[tamano]}`;

  if (fotoPerfilUrl) {
    return (
      <div className={`${base} bg-hoja`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- viene de Cloudinary, no del build local. */}
        <img
          src={fotoPerfilUrl}
          alt=""
          role="img"
          className="size-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`rotulo grid place-items-center text-papel ${base}`}
      style={{ backgroundColor: colorDeAvatar(id) }}
    >
      {username.charAt(0).toUpperCase()}
    </div>
  );
}
