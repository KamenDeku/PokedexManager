"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import PokemonGrid from "@/components/PokemonGrid";
import styles from "./page.module.css";

export default function Home() {
  const [search, setSearch] = useState("");
  const [searchVersion, setSearchVersion] = useState(0);

  return (
    <main className={styles.landingPage}>
      <Navbar
        search={search}
        setSearch={setSearch}
      />

      <section className={styles.pokemonSection}>

        <div className={styles.sectionHeader}>

          <p>
            Explora Pokemon y descubre tu próximo
            compañero.
          </p>

        </div>

        <PokemonGrid
          search={search}
        />

      </section>

    </main>
  );
}