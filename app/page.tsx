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
  const [types, setTypes] = useState<string[]>([]);
  const [forms, setForms] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<View>("pokedex");
  const [history, setHistory] = useState<Screen[]>([]);
  const [collectionUserId, setCollectionUserId] = useState<number | null>(null);
  const [ownedIds, setOwnedIds] = useState<number[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [collectionSearch, setCollectionSearch] = useState("");
  const [collectionTypes, setCollectionTypes] = useState<string[]>([]);
  const [collectionForms, setCollectionForms] = useState<string[]>([]);
  const [collectionPage, setCollectionPage] = useState(1);

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

  function clearFilters() {
    setSearch("");
    setTypes([]);
    setForms([]);
    setPage(1);

    setUserSearch("");
    setUserRole("");
    setUserPage(1);

    setCollectionSearch("");
    setCollectionTypes([]);
    setCollectionForms([]);
    setCollectionPage(1);
  }

  function navigateTo(nextView: View, nextUserId: number | null) {
    if (nextView === view && nextUserId === collectionUserId) {
      return;
    }

    clearFilters();

    setHistory((previous) => [...previous, { view, userId: collectionUserId }]);
    setView(nextView);
    setCollectionUserId(nextUserId);
    setCollectionPage(1);
  }

  function handleBack() {
    const previous = history[history.length - 1];

    if (!previous) {
      return;
    }

    setHistory((value) => value.slice(0, -1));
    setView(previous.view);
    setCollectionUserId(previous.userId);
    setCollectionPage(1);
  }

  function handleSearchChange(value: string) {
    if (view === "users") {
      setUserSearch(value);
      setUserPage(1);
      return;
    }
  
    if (view === "collection") {
      setCollectionSearch(value);
      setCollectionPage(1);
      return;
    }
  
    setSearch(value);
    setPage(1);
    navigateTo("pokedex", null);
  }
  
  function handleTypesChange(value: string[]) {
    if (view === "users") {
      setUserRole(value[0] ?? "");
      setUserPage(1);
      return;
    }
  
    if (view === "collection") {
      setCollectionTypes(value);
      setCollectionPage(1);
      return;
    }
  
    setTypes(value);
    setPage(1);
    navigateTo("pokedex", null);
  }

  function handleFormsChange(value: string[]) {
    if (view === "users") {
      return;
    }

    if (view === "collection") {
      setCollectionForms(value);
      setCollectionPage(1);
      return;
    }
  
    setForms(value);
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
  const usersMode = view === "users";
  const navbarSearch = view === "users" ? userSearch : view === "collection" ? collectionSearch : search;
  const navbarTypes = view === "users" ? (userRole ? [userRole] : []) : view === "collection" ? collectionTypes : types;
  const navbarForms = view === "collection" ? collectionForms : forms;

  return (
    <main className={styles.landingPage}>
      <Navbar
        search={navbarSearch}
        setSearch={handleSearchChange}
        types={navbarTypes}
        setTypes={handleTypesChange}
        forms={navbarForms}
        setForms={handleFormsChange}
        view={navbarView}
        setView={handleViewChange}
        usersMode={usersMode}
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

        {view === "pokedex" && (
          <div className={styles.sectionHeader}>
            <p>
              Explora Pokemon y descubre tu proximo
              compañero.
            </p>
          </div>
        )}

        {view === "pokedex" && (
          <PokemonGrid
            search={search}
            types={types}
            forms={forms}
            page={page}
            setPage={setPage}
            ownedIds={ownedIds}
            onOwnedChange={handleOwnedChange}
          />
        )}

        {view === "collection" && (
          <PokemonCollection
            userId={collectionUserId}
            search={collectionSearch}
            types={collectionTypes}
            forms={collectionForms}
            page={collectionPage}
            setPage={setCollectionPage}
          />
        )}

        {view === "users" && (
          <UsersInfo
            search={userSearch}
            role={userRole}
            page={userPage}
            setPage={setUserPage}
            onSelectUser={handleSelectUser}
          />
        )}

      </section>

    </main>
  );
}