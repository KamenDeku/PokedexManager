"use client";
import { FormEvent, useState } from "react";
import { getUserRoleLabel } from "@/lib/userRoles";
import styles from "./CreateUserModal.module.css";

type User = {
  id: number;
  name: string;
  role: "PROFESSOR" | "TRAINER";
  createdAt: string;
};

type CreateUserModalProps = {
  onClose: () => void;
  onDone: (user: User) => void;
};

export default function CreateUserModal({onClose, onDone,}: CreateUserModalProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<User["role"]>("TRAINER");

  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setConfirm(true);
  }

  async function handleCreate() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        setConfirm(false);
        return;
      }

      onDone(data);
      onClose();
    } catch (error) {
      console.error("Error al crear usuario:", error);

      setError("Error al crear usuario.");
      setConfirm(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.modalOverlay}
      onClick={onClose}
    >
      <div className={styles.createUserModal}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className={styles.createUserModalHeader}>
          <h2>Crear usuario</h2>

          <button className={styles.modalClose}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {!confirm && (
          <form className={styles.userForm}
            onSubmit={handleSubmit}
          >
            <label htmlFor="newUserName">
              Usuario
            </label>

            <input
              id="newUserName"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Usuario"
              required
            />

            <label htmlFor="newUserPassword">
              Contraseña
            </label>

            <input
              id="newUserPassword"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Contraseña"
              required
            />

            <label htmlFor="newUserRole">
              Rol
            </label>

            <select
              id="newUserRole"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as User["role"])
              }
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
            >
              Crear usuario
            </button>
          </form>
        )}

        {confirm && (
          <div className={styles.userForm}>
            <p>
              ¿Seguro que quieres crear a <strong>{name}</strong> como {getUserRoleLabel(role)}?
            </p>

            {error && (
              <p className={styles.error}>
                {error}
              </p>
            )}

            <button className={styles.userSubmit}
              type="button"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? "Creando..." : "Confirmar"}
            </button>

            <button className={styles.userCancel}
              type="button"
              onClick={() => setConfirm(false)}
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