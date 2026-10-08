import styles from "./PokemonGrid.module.css";

type PaginationProps = {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
};

export default function Pagination({page, totalPages, setPage,}: PaginationProps) {

  function handlePreviousPage() {
    if (page > 1) {
      setPage(page - 1);
    }
  }

  function handleNextPage() {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }

  function handleFirstPage() {
    setPage(1);
  }

  function handleLastPage() {
    setPage(totalPages);
  }

  function getPageNumbers() {
    const pages: number[] = [];

    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);

    for (let currentPage = startPage; currentPage <= endPage; currentPage++) {
      pages.push(currentPage);
    }

    return pages;
  }

  return (
    <div className={styles.pagination}>

      <span className={styles.pageNumber}>
        Pagina {page} de {totalPages}
      </span>

      {totalPages > 2 && (
        <div className={styles.pageControls}>

          <button
            className={styles.paginationButton}
            onClick={handleFirstPage}
            disabled={page === 1}
            aria-label="Primera pagina"
          >
            <img
              src="/svg/principio.svg"
              alt="Primera pagina"
            />
          </button>

          <button
            className={styles.paginationButton}
            onClick={handlePreviousPage}
            disabled={page === 1}
            aria-label="Pagina anterior"
          >
            <img
              src="/svg/anterior.svg"
              alt="Pagina anterior"
            />
          </button>

          <div className={styles.pageNumbers}>
            {getPageNumbers().map((pageNumber) => (
              <button
                className={`${styles.paginationButton} ${pageNumber === page ? styles.activePage : ""}`}
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
          </div>

          <button
            className={styles.paginationButton}
            onClick={handleNextPage}
            disabled={page >= totalPages}
            aria-label="Pagina siguiente"
          >
            <img
              src="/svg/siguiente.svg"
              alt="Pagina siguiente"
            />
          </button>

          <button
            className={styles.paginationButton}
            onClick={handleLastPage}
            disabled={page >= totalPages}
            aria-label="Ultima pagina"
          >
            <img
              src="/svg/final.svg"
              alt="Ultima pagina"
            />
          </button>

        </div>
      )}

    </div>
  );
}

export const ITEMS_PER_PAGE = Number(process.env.NEXT_PUBLIC_ITEMS_PER_PAGE) || 20;

export function getTotalPages(count: number) {
  return Math.max(1, Math.ceil(count / ITEMS_PER_PAGE));
}

export function paginate<T>(items: T[], page: number) {
  return items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
}