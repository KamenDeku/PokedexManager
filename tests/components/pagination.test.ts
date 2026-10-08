import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Pagination from "@/components/Pagination";

describe("Pagination", () => {
  it("renders the current page and disables navigation at the first page", () => {
    const html = renderToStaticMarkup(
      createElement(Pagination, {
        page: 1,
        totalPages: 4,
        setPage: vi.fn(),
      }),
    );

    expect(html).toContain("Pagina 1 de 4");
    expect(html).toContain('disabled="" aria-label="Primera pagina"');
    expect(html).toContain('disabled="" aria-label="Pagina anterior"');
    expect(html).toContain(">3</button>");
  });

  it("omits page controls when there are at most two pages", () => {
    const html = renderToStaticMarkup(
      createElement(Pagination, {
        page: 1,
        totalPages: 2,
        setPage: vi.fn(),
      }),
    );

    expect(html).toContain("Pagina 1 de 2");
    expect(html).not.toContain('aria-label="Pagina anterior"');
  });
});
