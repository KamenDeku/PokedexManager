export const ITEMS_PER_PAGE = Number(process.env.NEXT_PUBLIC_ITEMS_PER_PAGE) || 20;

export function getTotalPages(count: number) {
  return Math.max(1, Math.ceil(count / ITEMS_PER_PAGE));
}

export function paginate<T>(items: T[], page: number) {
  return items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
}