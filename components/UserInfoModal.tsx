"use client";
import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { getUserRoleLabel } from "@/lib/userRoles";
import styles from "./UserInfoModal.module.css";

type User = {
  id: number;
  name: string;
  role: "PROFESSOR" | "TRAINER";
  createdAt: string;
};

type UserInfoModalProps = {
  user: User;
  mode: "edit" | "delete";
  onClose: () => void;
  onDone: (user: User | null) => void;
};

export default function UserInfoModal({user, mode, onClose, onDone,}: UserInfoModalProps) {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user.role);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: session } = useSession();

  const isProfessor = session?.user?.role === "PROFESSOR";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/user/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ...(password && { password }),
          ...(role !== user.role && { role }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      onDone(data);
      onClose();
    } catch (error) {
      console.error("Error al modificar usuario:", error);

      setError("Error al modificar usuario.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/user/${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();

        setError(data.error);
        return;
      }

      onDone(null);
      onClose();
    } catch (error) {
      console.error("Error al borrar usuario:", error);

      setError("Error al borrar usuario.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.modalOverlay}
      onClick={onClose}
    >
      <div className={styles.userInfoModal}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className={styles.userInfoModalHeader}>
          <h2>
            {!isProfessor ? "Informacion del usuario" : mode === "edit" ? "Modificar usuario" : "Borrar usuario"}
          </h2>

          <button className={styles.modalClose}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {!isProfessor && (
          <div className={styles.userInfo}>
            <p><strong>ID:</strong> #{String(user.id).padStart(3, "0")}</p>
            <p><strong>Usuario:</strong> {user.name}</p>
            <p><strong>Rol:</strong> {getUserRoleLabel(user.role)}</p>
            <p><strong>Creado:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        )}

        {isProfessor && mode === "edit" && (
          <form className={styles.userForm}
            onSubmit={handleSubmit}
          >
            <label htmlFor="userName">
              Usuario
            </label>

            <input
              id="userName"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              required
              disabled={loading}
            />

            <label htmlFor="userPassword">
              Contraseña
            </label>

            <input
              id="userPassword"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Dejar vacio para no cambiarla"
              disabled={loading}
            />

            <label htmlFor="userRole">
              Rol
            </label>

            <select
              id="userRole"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as User["role"])
              }
              disabled={loading}
            >
              <option value="TRAINER">Entrenador</option>
              <option value="PROFESSOR">Profesor</option>
            </select>

            {error && (
              <p className={styles.error}>
                {error}
              </p>
            )}

            <button className={styles.userSubmit}
              type="submit"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        )}

        {isProfessor && mode === "delete" && (
          <div className={styles.userForm}>
            <p>
              ¿Seguro que quieres borrar a <strong>{user.name}</strong>? Esta accion no se puede deshacer.
            </p>

            {error && (
              <p className={styles.error}>
                {error}
              </p>
            )}

            <button className={styles.userSubmit}
              type="button"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Borrando..." : "Borrar"}
            </button>

            <button className={styles.userCancel}
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}