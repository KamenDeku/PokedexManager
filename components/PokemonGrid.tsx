"use client";
import { useEffect, useState } from "react";
import PokemonCard from "./PokemonCard";
import styles from "./PokemonGrid.module.css";

type Pokemon = {
  id: number;
  name: string;
  sprite: string;
};

type PokemonApiResponse = {
  count: number;
  next: string | boolean | null;
  previous: string | boolean | null;
  results: {
    id: number;
    name: string;
  }[];
};

type PokemonGridProps = {
  search: string;
  type: string;
  page: number;
  setPage: (page: number) => void;
};

const POKEMON_PER_PAGE = 20;

export default function PokemonGrid({search, type, page, setPage,}: PokemonGridProps) {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [totalPokemon, setTotalPokemon] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPokemon() {
      try {
        setLoading(true);
        setError("");

        const offset = (page - 1) * POKEMON_PER_PAGE;
        const params = new URLSearchParams();

        params.set( "limit", POKEMON_PER_PAGE.toString());

        params.set("offset", offset.toString());

        if (search.trim()) {
          params.set("name", search.trim().toLowerCase());
        }

        if (type) {
          params.set("type", type);
        }

        const response = await fetch(`/api/pokemon?${params.toString()}`);

        if (!response.ok) {
          throw new Error(
            "No se pudieron cargar los Pokemon"
          );
        }

        const data: PokemonApiResponse = await response.json();

        setTotalPokemon(data.count);

        const formattedPokemon =
          data.results.map((item) => {
            return {
              id: item.id,
              name: item.name,
              sprite:
                `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.id}.png`,
            };
          });

        setPokemon(formattedPokemon);
      } catch (error) {
        console.error(error);

        setError(
          "No se pudieron cargar los Pokemon."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPokemon();
  }, [search, type, page]);

  const totalPages = Math.ceil(totalPokemon / POKEMON_PER_PAGE);

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

  if (loading) {
    return (
      <div className={styles.pokemonMessage}>
        Cargando Pokemon...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${styles.pokemonMessage} ${styles.error}`}
      >
        {error}
      </div>
    );
  }

  if (pokemon.length === 0) {
    return (
      <div className={styles.pokemonMessage}>
        No se encontraron Pokemon.
      </div>
    );
  }

  return (
    <>
      <div className={styles.pokemonGrid}>
        {pokemon.map((item) => (
          <PokemonCard
            key={item.id}
            pokemon={item}
          />
        ))}
      </div>

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
          disabled={page === totalPages}
        >
          Siguiente →
        </button>
      </div>
    </>
  );
}