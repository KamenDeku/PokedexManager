import styles from "./PokemonCard.module.css";


type Pokemon = {
  id: number;
  name: string;
  sprite: string;
};

type PokemonCardProps = {
  pokemon: Pokemon;
};

export default function PokemonCard({pokemon,}: PokemonCardProps) {
  return (
    <article className={styles.pokemonCard}>

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
  );
}
