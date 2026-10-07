"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import LoginModal from "./LoginModal";
import styles from "./Navbar.module.css";

type NavbarProps = {
  search: string;
  setSearch: (value: string) => void;
  type: string;
  setType: (value: string) => void;
};

const pokemonTypes = [
  { value: "normal", label: "Normal" },
  { value: "fire", label: "Fuego" },
  { value: "water", label: "Agua" },
  { value: "electric", label: "Electrico" },
  { value: "grass", label: "Planta" },
  { value: "ice", label: "Hielo" },
  { value: "fighting", label: "Lucha" },
  { value: "poison", label: "Veneno" },
  { value: "ground", label: "Tierra" },
  { value: "flying", label: "Volador" },
  { value: "psychic", label: "Psiquico" },
  { value: "bug", label: "Bicho" },
  { value: "rock", label: "Roca" },
  { value: "ghost", label: "Fantasma" },
  { value: "dragon", label: "Dragon" },
  { value: "dark", label: "Siniestro" },
  { value: "steel", label: "Acero" },
  { value: "fairy", label: "Hada" },
];

export default function Navbar({search, setSearch, type, setType,}: NavbarProps) {

  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  // Cierra el menu al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
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
              placeholder="Buscar por nombre o id..."
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

                  {pokemonTypes.map((pokemonType) => (
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

          <button className={styles.loginButton}
            onClick={() => setLoginOpen(true)}
            aria-label={
              isLoggedIn ? "Usuario" : "Iniciar sesion"
            }
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

        </div>

      </nav>

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
      />
    </>
  );
}