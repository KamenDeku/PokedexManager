"use client";
import { useEffect, useState } from "react";
import { getPokemonByType } from "@/lib/pokeapi";
import { getTotalPages, paginate } from "@/lib/pagination";
import PokemonCard from "./PokemonCard";
import Pagination from "./Pagination";
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
  search: string;
  type: string;
  page: number;
  setPage: (page: number) => void;
};

export default function PokemonCollection({userId, search, type, page, setPage,}: PokemonCollectionProps) {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [typeIds, setTypeIds] = useState<number[] | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const term = search.trim().toLowerCase();
  const isId = /^\d+$/.test(term);

  const filteredPokemon = pokemon.filter((item) => {
    const matchesSearch = !term || item.name.toLowerCase().includes(term) || (isId && item.id === Number(term));
    const matchesType = !typeIds || typeIds.includes(item.id);

    return matchesSearch && matchesType;
  });

  const totalPages = getTotalPages(filteredPokemon.length);
  const visiblePokemon = paginate(filteredPokemon, page);

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
          "No se pudo cargar la coleccion"
        );
      } finally {
        setLoading(false);
      }
    }

    loadCollection();
  }, [userId]);

  useEffect(() => {
    if (!type) {
      setTypeIds(null);
      return;
    }

    async function loadType() {
      try {
        const list = await getPokemonByType(type);

        setTypeIds(list.map((item) => item.id));
      } catch (error) {
        console.error(error);
      }
    }

    loadType();
  }, [type]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages, setPage]);

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

      {filteredPokemon.length === 0 ? (
        <div className={styles.collectionMessage}>
          No hay Pokemon en la coleccion.
        </div>
      ) : (
        <>
          <div className={styles.collectionGrid}>
            {visiblePokemon.map((item) => (
              <PokemonCard
                key={item.id}
                pokemon={item}
                owned
              />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            setPage={setPage}
          />
        </>
      )}
    </>
  );
}