import { describe, expect, it } from "vitest";
import { getTotalPages, ITEMS_PER_PAGE, paginate } from "@/lib/pagination";

describe("pagination helpers", () => {
  it("keeps at least one page for empty and nonpositive counts", () => {
    expect(getTotalPages(0)).toBe(1);
    expect(getTotalPages(-10)).toBe(1);
  });

  it("calculates a ceiling page count at the configured page size", () => {
    expect(getTotalPages(ITEMS_PER_PAGE)).toBe(1);
    expect(getTotalPages(ITEMS_PER_PAGE + 1)).toBe(2);
  });

  it("returns the requested page slice", () => {
    const items = Array.from({ length: ITEMS_PER_PAGE * 2 + 2 }, (_, index) => index);

    expect(paginate(items, 1)).toEqual(items.slice(0, ITEMS_PER_PAGE));
    expect(paginate(items, 2)).toEqual(
      items.slice(ITEMS_PER_PAGE, ITEMS_PER_PAGE * 2),
    );
    expect(paginate(items, 3)).toEqual(items.slice(ITEMS_PER_PAGE * 2));
  });

  it("returns an empty slice for a page outside the list", () => {
    expect(paginate([1, 2, 3], 5)).toEqual([]);
  });
});
