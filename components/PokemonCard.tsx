"use client";
import { useState } from "react";
import PokemonInfoModal from "./PokemonInfoModal";
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
  
  return (
    <>
    <article className={styles.pokemonCard}
      onClick={() => setOpen(true)}
    >

      {owned && (
        <img className={styles.ownedBadge}
          src="/svg/pokeball.svg"
          alt="Mi coleccion"
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

      <div className={styles.pokemonName}>
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