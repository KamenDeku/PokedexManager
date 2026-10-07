"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import PokemonGrid from "@/components/PokemonGrid";
import styles from "./page.module.css";

export default function Home() {
  const [search, setSearch] = useState("");

  return (
    <main className={styles.landingPage}>
      <Navbar
        search={search}
        setSearch={setSearch}
      />

      <section className={styles.pokemonSection}>

        <div className={styles.sectionHeader}>

          <p>
            Explora Pokémon y descubre tu próximo
            compañero.
          </p>

        </div>

        <PokemonGrid
          search={search}
        />

        <div className={styles.pagination}>

          <button
            className={styles.paginationButton}
            disabled
          >
            ← Anterior
          </button>

          <span className={styles.pageNumber}>
            Página 1
          </span>

          <button
            className={styles.paginationButton}
          >
            Siguiente →
          </button>

        </div>

      </section>

    </main>
  );
}