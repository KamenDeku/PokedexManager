"use client";
import { useEffect, useState } from "react";
import PokemonCard from "./PokemonCard";
import Pagination from "./Pagination";
import { ITEMS_PER_PAGE, getTotalPages } from "@/lib/pagination";
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
  types: string[];
  forms: string[];
  page: number;
  setPage: (page: number) => void;
  ownedIds: number[];
  onOwnedChange: (pokeApiId: number, owned: boolean) => void;
};

export default function PokemonGrid({search, types, forms, page, setPage, ownedIds, onOwnedChange,}: PokemonGridProps) {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [totalPokemon, setTotalPokemon] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const typesKey = types.join(",");
  const formsKey = forms.join(",");

  useEffect(() => {
    async function loadPokemon() {
      try {
        setLoading(true);
        setError("");

        const offset = (page - 1) * ITEMS_PER_PAGE;
        const params = new URLSearchParams();

        params.set( "limit", ITEMS_PER_PAGE.toString());
        params.set("offset", offset.toString());

        if (search.trim()) {
          params.set("name", search.trim().toLowerCase());
        }

        if (typesKey) {
          params.set("types", typesKey);
        }

        if (formsKey) {
          params.set("forms", formsKey);
        }

        const response = await fetch(`/api/pokemon?${params.toString()}`);

        if (!response.ok) {
          throw new Error(
            "No se pudieron cargar los Pokemones"
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
          "No se pudieron cargar los Pokemones"
        );
      } finally {
        setLoading(false);
      }
    }

    loadPokemon();
  }, [search, typesKey, formsKey, page]);

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
            owned={ownedIds.includes(item.id)}
            onOwnedChange={onOwnedChange}
          />
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={getTotalPages(totalPokemon)}
        setPage={setPage}
      />
    </>
  );
}