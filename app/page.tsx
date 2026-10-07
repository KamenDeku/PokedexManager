"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import PokemonGrid from "@/components/PokemonGrid";
import PokemonCollection from "@/components/PokemonCollection";
import UsersInfo from "@/components/UsersInfo";
import styles from "./page.module.css";

type View = "pokedex" | "collection" | "users";

type Screen = {
  view: View;
  userId: number | null;
};

export default function Home() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<View>("pokedex");
  const [history, setHistory] = useState<Screen[]>([]);
  const [collectionUserId, setCollectionUserId] = useState<number | null>(null);
  const [ownedIds, setOwnedIds] = useState<number[]>([]);

  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      setView("pokedex");
      setCollectionUserId(null);
      setHistory([]);
      setOwnedIds([]);
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
  
    async function loadOwned() {
      try {
        const response = await fetch("/api/collection");
  
        if (!response.ok) {
          return;
        }
  
        const data: { pokemon: { pokeApiId: number } }[] = await response.json();
  
        setOwnedIds(data.map((item) => item.pokemon.pokeApiId));
      } catch (error) {
        console.error(error);
      }
    }
  
    loadOwned();
  }, [status]);

  function navigateTo(nextView: View, nextUserId: number | null) {
    if (nextView === view && nextUserId === collectionUserId) {
      return;
    }

    setHistory((previous) => [...previous, { view, userId: collectionUserId }]);
    setView(nextView);
    setCollectionUserId(nextUserId);
  }

  function handleBack() {
    const previous = history[history.length - 1];

    if (!previous) {
      return;
    }

    setHistory((value) => value.slice(0, -1));
    setView(previous.view);
    setCollectionUserId(previous.userId);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    navigateTo("pokedex", null);
  }

  function handleTypeChange(value: string) {
    setType(value);
    setPage(1);
    navigateTo("pokedex", null);
  }

  function handleViewChange(value: View) {
    if (value === view && collectionUserId === null && value !== "pokedex") {
      navigateTo("pokedex", null);
      return;
    }

    navigateTo(value, null);
  }

  function handleSelectUser(userId: number) {
    navigateTo("collection", userId);
  }

  function handleOwnedChange(pokeApiId: number, owned: boolean) {
    setOwnedIds((previous) => {
      const rest = previous.filter((id) => id !== pokeApiId);
  
      return owned ? [...rest, pokeApiId] : rest;
    });
  }

  const navbarView = view === "collection" && collectionUserId ? "users" : view;

  return (
    <main className={styles.landingPage}>
      <Navbar
        search={search}
        setSearch={handleSearchChange}
        type={type}
        setType={handleTypeChange}
        view={navbarView}
        setView={handleViewChange}
      />

      <section className={styles.pokemonSection}>

      {view !== "pokedex" && history.length > 0 && (
          <button className={styles.backButton}
            type="button"
            onClick={handleBack}
            aria-label="Volver"
          >
            <img
              src="/svg/volver.svg"
              alt="Volver"
            />
          </button>
        )}

        <div className={styles.sectionHeader}>
          <p>
            Explora Pokemon y descubre tu próximo
            compañero.
          </p>
        </div>

        {view === "pokedex" && (
          <PokemonGrid
            search={search}
            type={type}
            page={page}
            setPage={setPage}
            ownedIds={ownedIds}
            onOwnedChange={handleOwnedChange}
          />
        )}

        {view === "collection" && (
          <PokemonCollection userId={collectionUserId} />
        )}

        {view === "users" && (
          <UsersInfo onSelectUser={handleSelectUser} />
        )}

      </section>

    </main>
  );
}