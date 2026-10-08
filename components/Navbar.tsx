"use client";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import LoginModal from "./LoginModal";
import { pokemonTypes } from "@/lib/pokemonTypes";
import { pokemonForms } from "@/lib/pokemonForms";
import styles from "./Navbar.module.css";

type NavbarProps = {
  search: string;
  setSearch: (value: string) => void;
  types: string[];
  setTypes: (value: string[]) => void;
  forms: string[];
  setForms: (value: string[]) => void;
  view: "pokedex" | "collection" | "users";
  setView: (value: "pokedex" | "collection" | "users") => void;
  usersMode: boolean;
};

const userRoles = [
  { value: "PROFESSOR", label: "Profesor", color: "#cc0000" },
  { value: "TRAINER", label: "Entrenador", color: "#3b4cca" },
];

const MAX_TYPES = 2;

function getTextColor(background: string) {
  const red = parseInt(background.slice(1, 3), 16);
  const green = parseInt(background.slice(3, 5), 16);
  const blue = parseInt(background.slice(5, 7), 16);

  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 150 ? "#1a1a1a" : "#ffffff";
}

export default function Navbar({search, setSearch, types, setTypes, forms, setForms, view, setView, usersMode,}: NavbarProps) {

  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [typesOpen, setTypesOpen] = useState(false);
  const [formsOpen, setFormsOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const userWrapperRef = useRef<HTMLDivElement>(null);

  const { data: session } = useSession();

  const isLoggedIn = !!session?.user;
  const isProfessor = session?.user?.role === "PROFESSOR";
  const filters = usersMode ? userRoles : pokemonTypes;
  const maxTypes = usersMode ? 1 : MAX_TYPES;

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
    if (types.includes(selectedType)) {
      setTypes(types.filter((item) => item !== selectedType));
      return;
    }

    if (maxTypes === 1) {
      setTypes([selectedType]);
      return;
    }

    if (types.length >= maxTypes) {
      return;
    }

    setTypes([...types, selectedType]);
  }

  function handleFormSelect(selectedForm: string) {
    if (forms.includes(selectedForm)) {
      setForms(forms.filter((item) => item !== selectedForm));
      return;
    }

    setForms([...forms, selectedForm]);
  }

  function handleToggleMenu() {
    setMenuOpen((value) => !value);

    setTypesOpen(false);
    setFormsOpen(false);
  }

  function handleToggleTypes() {
    setTypesOpen((value) => !value);
  }

  function handleToggleForms() {
    setFormsOpen((value) => !value);
  }

  function handleClearFilters() {
    setTypes([]);
    setForms([]);

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
                onClick={handleToggleMenu}
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

                  <button className={`${styles.typeButton} ${types.length === 0 && forms.length === 0 ? styles.activeType : ""}`}
                    type="button"
                    onClick={handleClearFilters}
                  >
                    Todos
                  </button>

                  <button className={`${styles.typeButton} ${styles.sectionButton}`}
                    type="button"
                    onClick={handleToggleTypes}
                    aria-expanded={typesOpen}
                  >
                    {usersMode ? "Rol" : "Tipos"}

                    <span className={styles.sectionCount}>
                      {types.length > 0 ? `(${types.length}/${maxTypes})` : ""}
                    </span>

                    <span className={`${styles.arrow} ${typesOpen ? styles.arrowOpen : ""}`}>
                      ▾
                    </span>
                  </button>

                  {typesOpen && filters.map((filter) => {
                    const active = types.includes(filter.value);

                    return (
                      <button className={`${styles.typeButton} ${styles.optionButton} ${active ? styles.activeType : ""}`}
                        key={filter.value}
                        type="button"
                        style={active ? { background: filter.color, color: getTextColor(filter.color) } : undefined}
                        disabled={!active && maxTypes > 1 && types.length >= maxTypes}
                        onClick={() => handleTypeSelect(filter.value)}
                      >
                        {filter.label}
                      </button>
                    );
                  })}

                  {!usersMode && (
                    <>
                      <button className={`${styles.typeButton} ${styles.sectionButton}`}
                        type="button"
                        onClick={handleToggleForms}
                        aria-expanded={formsOpen}
                      >
                        Formas especiales

                        <span className={styles.sectionCount}>
                          {forms.length > 0 ? `(${forms.length})` : ""}
                        </span>

                        <span className={`${styles.arrow} ${formsOpen ? styles.arrowOpen : ""}`}>
                          ▾
                        </span>
                      </button>

                      {formsOpen && pokemonForms.map((form) => {
                        const active = forms.includes(form.value);

                        return (
                          <button className={`${styles.typeButton} ${styles.optionButton} ${active ? styles.activeType : ""}`}
                            key={form.value}
                            type="button"
                            style={active ? { background: form.color, color: getTextColor(form.color) } : undefined}
                            onClick={() => handleFormSelect(form.value)}
                          >
                            {form.label}
                          </button>
                        );
                      })}
                    </>
                  )}

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
                src={ !isLoggedIn
                  ? "/svg/pokeball-shadow.svg"
                  : isProfessor
                      ? "/svg/ultraball.svg"
                      : "/svg/pokeball.svg"
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
                  <img
                    className={styles.signOutIcon}
                    src="/svg/pokedex.svg"
                    alt=""
                  />
                  Pokedex
                </button>

                <button className={`${styles.typeButton} ${view === "collection" ? styles.activeType : ""}`}
                  type="button"
                  onClick={() => handleNavigate("collection")}
                >
                  <img
                    className={styles.signOutIcon}
                    src="/svg/pc.svg"
                    alt=""
                  />
                  PC
                </button>

                {isProfessor && (
                  <button className={`${styles.typeButton} ${view === "users" ? styles.activeType : ""}`}
                    type="button"
                    onClick={() => handleNavigate("users")}
                  >
                    <img
                      className={styles.signOutIcon}
                      src="/svg/usuarios.svg"
                      alt=""
                    />
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