"use client";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import LoginModal from "./LoginModal";
import { pokemonTypes } from "@/lib/pokemonTypes";
import styles from "./Navbar.module.css";

type NavbarProps = {
  search: string;
  setSearch: (value: string) => void;
  type: string;
  setType: (value: string) => void;
  view: "pokedex" | "collection" | "users";
  setView: (value: "pokedex" | "collection" | "users") => void;
  usersMode: boolean;
};

const userRoles = [
  { value: "PROFESSOR", label: "Profesor" },
  { value: "TRAINER", label: "Entrenador" },
];

export default function Navbar({search, setSearch, type, setType, view, setView, usersMode,}: NavbarProps) {

  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const userWrapperRef = useRef<HTMLDivElement>(null);

  const { data: session } = useSession();

  const isLoggedIn = !!session?.user;
  const isProfessor = session?.user?.role === "PROFESSOR";
  const filters = usersMode ? userRoles : pokemonTypes;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }

      if (!userWrapperRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleTypeSelect(selectedType: string) {
    setType(selectedType);

    setMenuOpen(false);
  }

  function handleLoginClick() {
    if (!isLoggedIn) {
      setLoginOpen(true);
      return;
    }
  
    setUserMenuOpen((value) => !value);
  }
  
  function handleNavigate(value: "pokedex" | "collection" | "users") {
    setView(value);
  
    setUserMenuOpen(false);
  }
  
  function handleSignOut() {
    setUserMenuOpen(false);
  
    signOut({ callbackUrl: "/" });
  }

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
                alt="Buscador"
              />
            </span>

            <input
              type="search"
              placeholder="Buscar por nombre o id"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <div className={styles.menuWrapper} ref={wrapperRef}>

              <button className={styles.menuButton}
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                aria-label="Abrir menu"
                aria-expanded={menuOpen}
              >
                <img
                  src="/svg/menu.svg"
                  alt="Menu"
                />
              </button>

              {menuOpen && (
                <div className={styles.typeMenu}>

                  <button className={`${styles.typeButton} ${type === "" ? styles.activeType : ""}`}
                    type="button"
                    onClick={() => handleTypeSelect("")}
                  >
                    Todos
                  </button>

                  {filters.map((pokemonType) => (
                    <button className={`${styles.typeButton} ${type === pokemonType.value ? styles.activeType : ""}`}
                      key={pokemonType.value}
                      type="button"
                      onClick={() => handleTypeSelect(pokemonType.value)}
                    >
                      {pokemonType.label}
                    </button>
                  ))}

                </div>
              )}

            </div>

          </div>

        </div>

        <div className={styles.navbarRight}>

          <div className={styles.userWrapper} ref={userWrapperRef}>

            <button className={styles.loginButton}
              type="button"
              onClick={handleLoginClick}
              aria-label={
                isLoggedIn ? "Usuario" : "Iniciar sesion"
              }
              aria-expanded={userMenuOpen}
            >
              <img
                src={
                  isLoggedIn ? "/svg/pokeball.svg" : "/svg/pokeball-shadow.svg"
                }
                alt={
                  isLoggedIn ? "Usuario" : "Iniciar sesion"
                }
              />
            </button>

            {isLoggedIn && userMenuOpen && (
              <div className={styles.userMenu}>

                <span className={styles.userName}>
                  {session?.user?.name}
                </span>

                <button className={`${styles.typeButton} ${view === "pokedex" ? styles.activeType : ""}`}
                  type="button"
                  onClick={() => handleNavigate("pokedex")}
                >
                  Pokedex
                </button>

                <button className={`${styles.typeButton} ${view === "collection" ? styles.activeType : ""}`}
                  type="button"
                  onClick={() => handleNavigate("collection")}
                >
                  Mi coleccion
                </button>

                {isProfessor && (
                  <button className={`${styles.typeButton} ${view === "users" ? styles.activeType : ""}`}
                    type="button"
                    onClick={() => handleNavigate("users")}
                  >
                    Usuarios
                  </button>
                )}

                <button className={`${styles.typeButton} ${styles.signOutButton}`}
                  type="button"
                  onClick={handleSignOut}
                >
                  <img
                    className={styles.signOutIcon}
                    src="/svg/salir.svg"
                    alt=""
                  />
                    Cerrar sesion
                  </button>

              </div>
            )}

          </div>

        </div>

      </nav>

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
      />
    </>
  );
}