"use client";
import { useEffect, useState } from "react";
import PokemonCard from "./PokemonCard";
import styles from "./PokemonCollection.module.css";

type Pokemon = {
  id: number;
  name: string;
  sprite: string;
};

type CollectionApiItem = {
  id: number;
  pokemon: {
    pokeApiId: number;
    name: string;
  };
};

type PokemonCollectionProps = {
  userId: number | null;
};

export default function PokemonCollection({userId,}: PokemonCollectionProps) {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCollection() {
      try {
        setLoading(true);
        setError("");

        const url = userId ? `/api/collection?userId=${userId}` : "/api/collection";
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            "No se pudo cargar la coleccion"
          );
        }

        const data: CollectionApiItem[] = await response.json();

        const formattedPokemon =
          data.map((item) => {
            return {
              id: item.pokemon.pokeApiId,
              name: item.pokemon.name,
              sprite:
                `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.pokemon.pokeApiId}.png`,
            };
          });

        setPokemon(formattedPokemon);
      } catch (error) {
        console.error(error);

        setError(
          "No se pudo cargar la coleccion."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCollection();
  }, [userId]);

  if (loading) {
    return (
      <div className={styles.collectionMessage}>
        Cargando coleccion...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${styles.collectionMessage} ${styles.error}`}
      >
        {error}
      </div>
    );
  }

  return (
    <>
      <h2 className={styles.collectionTitle}>
        {userId ? `Coleccion del usuario #${userId}` : "Mi coleccion"}
      </h2>

      {pokemon.length === 0 ? (
        <div className={styles.collectionMessage}>
          No hay Pokemon en la coleccion.
        </div>
      ) : (
        <div className={styles.collectionGrid}>
          {pokemon.map((item) => (
            <PokemonCard
              key={item.id}
              pokemon={item}
              owned
            />
          ))}
        </div>
      )}
    </>
  );
}