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

  next: string | null;

  previous: string | null;

  results: {
    id: number;
    name: string;
  }[];
};

type PokemonGridProps = {
  search: string;
};

export default function PokemonGrid({search,}: PokemonGridProps) {

  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPokemon() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        params.set("limit", "20");
        params.set("offset", "0");

        if (search.trim()) {
          params.set("name", search.trim().toLowerCase());
        }

        const response = await fetch(`/api/pokemon?${params.toString()}`);

        if (!response.ok) {
          throw new Error("No se pudieron cargar los Pokémon");
        }

        const data: PokemonApiResponse = await response.json();
        const formattedPokemon = data.results.map((item) => {

            return {
              id: item.id,
              name: item.name,
              sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.id}.png`,
            };

          });

        setPokemon(formattedPokemon);

      } catch (error) {

        console.error(error);

        setError(
          "No se pudieron cargar los Pokémon."
        );

      } finally {

        setLoading(false);

      }

    }

    loadPokemon();

  }, [search]);

  if (loading) {
    return (
      <div className={styles.pokemonMessage}>
        Cargando Pokémon...
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pokemonMessage + " " + styles.error}>
        {error}
      </div>
    );
  }

  if (pokemon.length === 0) {
    return (
      <div className={styles.pokemonMessage}>
        No se encontraron Pokémon.
      </div>
    );
  }

  return (
    <div className={styles.pokemonGrid}>

      {pokemon.map((item) => (
        <PokemonCard
          key={item.id}
          pokemon={item}
        />

      ))}

    </div>
  );
}