import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "@/components/perfil/Avatar";

describe("Avatar", () => {
  test("con fotoPerfilUrl, muestra la imagen", () => {
    render(<Avatar id={1} username="ana" fotoPerfilUrl="https://x/foto.jpg" />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://x/foto.jpg");
  });

  test("sin fotoPerfilUrl, muestra la inicial en mayúscula sobre un color", () => {
    render(<Avatar id={1} username="ana" fotoPerfilUrl={null} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
