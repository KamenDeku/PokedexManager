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

  return (
    <div className={styles.pagination}>
      <button
        className={styles.paginationButton}
        onClick={handlePreviousPage}
        disabled={page === 1}
      >
        ← Anterior
      </button>

      <span className={styles.pageNumber}>
        Pagina {page} de {totalPages}
      </span>

      <button
        className={styles.paginationButton}
        onClick={handleNextPage}
        disabled={page >= totalPages}
      >
        Siguiente →
      </button>
    </div>
  );
}