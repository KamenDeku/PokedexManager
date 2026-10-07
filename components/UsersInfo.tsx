"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import UserInfoModal from "./UserInfoModal";
import cardStyles from "./PokemonCard.module.css";
import styles from "./UsersInfo.module.css";

type User = {
  id: number;
  name: string;
  role: "PROFESSOR" | "TRAINER";
  createdAt: string;
};

type UsersInfoProps = {
  onSelectUser: (userId: number) => void;
};

export default function UsersInfo({onSelectUser,}: UsersInfoProps) {
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [menuUserId, setMenuUserId] = useState<number | null>(null);
  const [selected, setSelected] = useState<{ user: User; mode: "edit" | "delete" } | null>(null);

  const { data: session } = useSession();

  const isProfessor = session?.user?.role === "PROFESSOR";

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/user");

        if (!response.ok) {
          throw new Error(
            "No se pudieron cargar los usuarios"
          );
        }

        const data: User[] = await response.json();

        setUsers(data);
      } catch (error) {
        console.error(error);

        setError(
          "No se pudieron cargar los usuarios."
        );
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target as Element).closest("[data-user-menu]")) {
        setMenuUserId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleOption(user: User, mode: "edit" | "delete") {
    setMenuUserId(null);
    setSelected({ user, mode });
  }

  function handleDone(updated: User | null) {
    setUsers((previous) =>
      updated
        ? previous.map((user) => (user.id === updated.id ? updated : user))
        : previous.filter((user) => user.id !== selected?.user.id)
    );
  }

  if (loading) {
    return (
      <div className={styles.usersMessage}>
        Cargando usuarios...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${styles.usersMessage} ${styles.error}`}
      >
        {error}
      </div>
    );
  }

  return (
    <>
      <div className={styles.usersGrid}>
        {users.map((user) => (
          <article className={`${cardStyles.pokemonCard} ${styles.userCard}`}
            key={user.id}
            onClick={() => onSelectUser(user.id)}
          >

            <div className={cardStyles.pokemonNumber}>
              #{String(user.id).padStart(3, "0")}
            </div>

            <div className={cardStyles.pokemonImageContainer}>
              <img className={cardStyles.pokemonImage}
                src="/svg/pokeball.svg"
                alt={user.name}
              />
            </div>

            <div className={cardStyles.pokemonName}>
              {user.name}
            </div>

            <span className={`${styles.userRole} ${user.role === "PROFESSOR" ? styles.professor : ""}`}>
              {user.role === "PROFESSOR" ? "Profesor" : "Entrenador"}
            </span>

            {isProfessor && (
              <div className={styles.gearWrapper}
                data-user-menu
                onClick={(event) => event.stopPropagation()}
              >
                <button className={styles.gearButton}
                  type="button"
                  onClick={() => setMenuUserId(menuUserId === user.id ? null : user.id)}
                  aria-label="Opciones"
                  aria-expanded={menuUserId === user.id}
                >
                  <img
                    src="/svg/modificar.svg"
                    alt="Opciones"
                  />
                </button>

                {menuUserId === user.id && (
                  <div className={styles.userMenu}>

                    <button className={styles.menuOption}
                      type="button"
                      onClick={() => handleOption(user, "edit")}
                    >
                      Modificar
                    </button>

                    <button className={styles.menuOption}
                      type="button"
                      onClick={() => handleOption(user, "delete")}
                    >
                      Borrar
                    </button>

                  </div>
                )}
              </div>
            )}

          </article>
        ))}
      </div>

      {selected && (
        <UserInfoModal
          key={`${selected.user.id}-${selected.mode}`}
          user={selected.user}
          mode={selected.mode}
          onClose={() => setSelected(null)}
          onDone={handleDone}
        />
      )}
    </>
  );
}