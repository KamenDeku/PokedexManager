"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import UserInfoModal from "./UserInfoModal";
import CreateUserModal from "./CreateUserModal";
import Pagination from "./Pagination";
import { getTotalPages, paginate } from "@/lib/pagination";
import cardStyles from "./PokemonCard.module.css";
import { getUserRoleLabel } from "@/lib/userRoles";
import styles from "./UsersInfo.module.css";

type User = {
  id: number;
  name: string;
  role: "PROFESSOR" | "TRAINER";
  createdAt: string;
};

type UsersInfoProps = {
  search: string;
  role: string;
  page: number;
  setPage: (page: number) => void;
  onSelectUser: (userId: number) => void;
};

export default function UsersInfo({search, role, page, setPage, onSelectUser,}: UsersInfoProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [menuUserId, setMenuUserId] = useState<number | null>(null);
  const [selected, setSelected] = useState<{ user: User; mode: "edit" | "delete" } | null>(null);

  const { data: session } = useSession();

  const isProfessor = session?.user?.role === "PROFESSOR";

  const term = search.trim().toLowerCase();
  const isId = /^\d+$/.test(term);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = !term || user.name.toLowerCase().includes(term) || (isId && user.id === Number(term));
    const matchesRole = !role || user.role === role;

    return matchesSearch && matchesRole;
  });

  const totalPages = getTotalPages(filteredUsers.length);
  const visibleUsers = paginate(filteredUsers, page);

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

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages, setPage]);

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

  function handleCreated(created: User) {
    setUsers((previous) => [...previous, created]);
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
      <h2 className={styles.usersTitle}>
        Usuarios
      </h2>
      <div className={styles.usersGrid}>

        {page === 1 && (
          <article className={`${cardStyles.pokemonCard} ${styles.userCard}`}
            onClick={() => setCreateOpen(true)}
          >

            <div className={cardStyles.pokemonNumber}>
              Nuevo
            </div>

            <div className={cardStyles.pokemonImageContainer}>
              <img className={cardStyles.pokemonImage}
                src="/svg/agregar-usuario.svg"
                alt="Agregar usuario"
              />
            </div>

            <div className={cardStyles.pokemonName}>
              Agregar usuario
            </div>

          </article>
        )}

        {visibleUsers.map((user) => (
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
              {getUserRoleLabel(user.role)}
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
                    src="/svg/editar.svg"
                    alt="Opciones"
                  />
                </button>

                {menuUserId === user.id && (
                  <div className={styles.userMenu}>

                    <button className={styles.menuOption}
                      type="button"
                      onClick={() => handleOption(user, "edit")}
                    >
                      <img
                        src="/svg/actualizar.svg"
                        alt=""
                      />
                      Editar
                    </button>

                    <button className={styles.menuOption}
                      type="button"
                      onClick={() => handleOption(user, "delete")}
                    >
                      <img
                        src="/svg/borrar.svg"
                        alt=""
                      />
                      Borrar
                    </button>

                  </div>
                )}
              </div>
            )}

          </article>
        ))}

      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        setPage={setPage}
      />

      {selected && (
        <UserInfoModal
          key={`${selected.user.id}-${selected.mode}`}
          user={selected.user}
          mode={selected.mode}
          onClose={() => setSelected(null)}
          onDone={handleDone}
        />
      )}

      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onDone={handleCreated}
        />
      )}
    </>
  );
}