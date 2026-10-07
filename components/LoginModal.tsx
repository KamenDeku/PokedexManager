"use client";
import { FormEvent, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import styles from "./LoginModal.module.css";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LoginModal({isOpen, onClose,}: LoginModalProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { update } = useSession();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        name,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Usuario o contraseña incorrectos.");
        return;
      }

      await update();
      onClose();

      setName("");
      setPassword("");
    } catch (error) {
      console.error("Error al iniciar sesion:", error);

      setError(
        "Error al iniciar sesion."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay}
      onClick={onClose}
    >
      <div className={styles.loginModal}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className={styles.loginModalHeader}>
          <h2>Iniciar sesión</h2>

          <button className={styles.modalClose}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form className={styles.loginForm}
          onSubmit={handleSubmit}
        >
          <label htmlFor="username">
            Usuario
          </label>

          <input
            id="username"
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Usuario"
            required
            disabled={loading}
          />

          <label htmlFor="password">
            Contraseña
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Contraseña"
            required
            disabled={loading}
          />

          {error && (
            <p className={styles.error}>
              {error}
            </p>
          )}

          <button className={styles.loginSubmit}
            type="submit"
            disabled={loading}
          >

            {loading ? "Iniciando sesión..." : "Iniciar sesión"}

          </button>
        </form>
      </div>
    </div>
  );
}