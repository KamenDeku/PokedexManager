"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import PokemonInfoModal from "./PokemonInfoModal";
import { getPokemonTypes } from "@/lib/pokeapi";
import { pokemonTypes } from "@/lib/pokemonTypes";
import styles from "./PokemonCard.module.css";


type Pokemon = {
  id: number;
  name: string;
  sprite: string;
};

type PokemonCardProps = {
  pokemon: Pokemon;
  owned?: boolean;
  onOwnedChange?: (pokeApiId: number, owned: boolean) => void;
};

export default function PokemonCard({ pokemon, owned = false,onOwnedChange, }: PokemonCardProps) {
  const [open, setOpen] = useState(false);
  const [types, setTypes] = useState<string[]>([]);
  const { data: session } = useSession();
  const isProfessor = session?.user?.role === "PROFESSOR";

  useEffect(() => {
    async function loadTypes() {
      try {
        setTypes(await getPokemonTypes(pokemon.id));
      } catch (error) {
        console.error(error);
      }
    }

    loadTypes();
  }, [pokemon.id]);

  const colors = types.map((name) => pokemonTypes.find((pokemonType) => pokemonType.value === name)?.color ?? "#a8a77a");
  
  const background = colors.length > 1 ? `linear-gradient(
          to right,
          ${colors[0]} 0%,
          ${colors[0]} 40%,
          transparent 50%,
          ${colors[1]} 60%,
          ${colors[1]} 100%
        )` : colors[0];
  
  return (
    <>
    <article className={styles.pokemonCard}
      onClick={() => setOpen(true)}
    >

      {owned && (
        <img
          className={styles.ownedBadge}
          src={
            isProfessor
              ? "/svg/ultraball.svg"
              : "/svg/pokeball.svg"
          }
          alt="Mi PC"
        />
      )}

      <div className={styles.pokemonNumber}>
        #{String(pokemon.id).padStart(3, "0")}
      </div>

      <div className={styles.pokemonImageContainer}>
        <img className={styles.pokemonImage}
          src={pokemon.sprite}
          alt={pokemon.name}
        />
      </div>

      <div className={`${styles.pokemonName} ${background ? styles.pokemonNameTyped : ""}`} style={background ? { background } : undefined}>
        {pokemon.name}
      </div>

    </article>
      
    {open && (
      <PokemonInfoModal
        pokemonName={pokemon.name}
        onClose={() => setOpen(false)}
        onOwnedChange={onOwnedChange}
      />
    )}
    </>
  );
}