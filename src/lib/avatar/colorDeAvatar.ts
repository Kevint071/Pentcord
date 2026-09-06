/**
 * Color determinista del avatar por `id` numérico de usuario (no `username`:
 * es estable aunque cambie de nombre). Los ocho tonos son "tinta sobre papel"
 * emparentados con `--color-acorde` pero de matiz distinto, todos con
 * contraste ≥ 4.5:1 contra blanco (la inicial se pinta en blanco encima).
 */
const PALETA_AVATAR: readonly string[] = [
  "#2a4b8d", // índigo
  "#1f6f5c", // verde azulado
  "#6b4fa0", // violeta
  "#a13d63", // vino
  "#9c3c1a", // óxido
  "#4a5568", // pizarra
  "#7a4419", // marrón
  "#2f6b3a", // verde bosque
];

export function colorDeAvatar(id: number): string {
  const suma = Math.abs(Math.trunc(id))
    .toString()
    .split("")
    .reduce((total, digito) => total + Number(digito), 0);
  return PALETA_AVATAR[suma % PALETA_AVATAR.length];
}
