// Añade los matchers de jest-dom (toBeInTheDocument, toHaveTextContent, ...)
// al `expect` de Vitest, con sus tipos.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
