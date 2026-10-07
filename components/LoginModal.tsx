"use client";
import { FormEvent, useState } from "react";
import styles from "./LoginModal.module.css";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LoginModal({isOpen, onClose,}: LoginModalProps) {

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {

    event.preventDefault();

    console.log({
      name,
      password,
    });
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
    >

      <div
        className={styles.loginModal}
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        <div className={styles.loginModalHeader}>

          <h2>
            Iniciar sesión
          </h2>

          <button
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>

        </div>

        <form
          onSubmit={handleSubmit}
          className={styles.loginForm}
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
            placeholder="Tu usuario"
            required
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
            placeholder="Tu contraseña"
            required
          />

          <button
            type="submit"
            className={styles.loginSubmit}
          >
            Iniciar sesión
          </button>

        </form>

      </div>

    </div>
  );
}