"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import PokemonGrid from "@/components/PokemonGrid";
import styles from "./page.module.css";

export default function Home() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleTypeChange(value: string) {
    setType(value);
    setPage(1);
  }

  return (
    <main className={styles.landingPage}>
      <Navbar
        search={search}
        setSearch={handleSearchChange}
        type={type}
        setType={handleTypeChange}
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
          type={type}
          page={page}
          setPage={setPage}
        />

      </section>

    </main>
  );
}