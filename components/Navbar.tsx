"use client";
import { useState } from "react";
import LoginModal from "./LoginModal";
import styles from "./Navbar.module.css";

type NavbarProps = { search: string; setSearch: (value: string) => void;};

export default function Navbar({search, setSearch,}: NavbarProps) {

  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <>
      <nav className={styles.navbar}>

        <div className={styles.navbarLeft}>

          <h1 className={styles.navbarTitle}>
            PokeDex Manager
          </h1>

        </div>

        <div className={styles.navbarCenter}>

          <div className={styles.searchContainer}>

            <span className={styles.searchIcon}>
              <img
                src="/svg/lupa.svg"
                alt="Iniciar sesión"
              />
            </span>

            <input
              type="search"
              placeholder="Buscar Pokémon..."
              value={search}
              onChange={(event) => setSearch(event.target.value)
              }
            />

          </div>

        </div>

        <div className={styles.navbarRight}>

          <button
            className={styles.loginButton}
            onClick={() => setLoginOpen(true)}
            aria-label="Iniciar sesión"
          >

            <img
              src="/svg/pokeball.svg"
              alt="Iniciar sesión"
            />

          </button>

        </div>

      </nav>

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
      />
    </>
  );
}