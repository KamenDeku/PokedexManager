"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getPokemon, PokemonDetails } from "@/lib/pokeapi";
import { pokemonTypes } from "@/lib/pokemonTypes";
import styles from "./PokemonInfoModal.module.css";

type PokemonInfoModalProps = {
  pokemonName: string;
  onClose: () => void;
  onOwnedChange?: (pokeApiId: number, owned: boolean) => void;
};

const spriteLabels = {
  front_default: "Frente",
  back_default: "Espalda",
  front_shiny: "Shiny frente",
  back_shiny: "Shiny espalda",
};

export default function PokemonInfoModal({pokemonName, onClose, onOwnedChange,}: PokemonInfoModalProps) {
  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [selected, setSelected] = useState("");
  const [hovered, setHovered] = useState("");
  const [error, setError] = useState("");

  const [collectionId, setCollectionId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [actionError, setActionError] = useState("");
  const [loading, setLoading] = useState(false);

  const { status } = useSession();

  const isLoggedIn = status === "authenticated";
  const owned = collectionId !== null;
  const pokeApiId = pokemon?.id;

  useEffect(() => {
    async function loadPokemon() {
      try {
        const data = await getPokemon(pokemonName);

        setPokemon(data);
        setSelected(data.sprites.front_default ?? "");
      } catch (error) {
        console.error(error);

        setError("No se pudo cargar el Pokemon.");
      }
    }

    loadPokemon();
  }, [pokemonName]);

  useEffect(() => {
    if (!isLoggedIn || !pokeApiId) {
      return;
    }

    async function loadCollection() {
      try {
        const response = await fetch("/api/collection");

        if (!response.ok) {
          return;
        }

        const data: { id: number; pokemon: { pokeApiId: number } }[] = await response.json();
        const entry = data.find((item) => item.pokemon.pokeApiId === pokeApiId);

        setCollectionId(entry?.id ?? null);
      } catch (error) {
        console.error(error);
      }
    }

    loadCollection();
  }, [isLoggedIn, pokeApiId]);

  async function handleConfirm() {
    if (!pokemon) {
      return;
    }

    setActionError("");
    setLoading(true);

    try {
      const response = await fetch(
        owned ? `/api/collection/${collectionId}` : "/api/collection",
        {
          method: owned ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            owned ? { status: "RELEASED" } : { pokeApiId: pokemon.id, name: pokemon.name }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setActionError(data.error);
        return;
      }

      setCollectionId(owned ? null : data.id);
      setConfirm(false);

      onOwnedChange?.(pokemon.id, !owned);
    } catch (error) {
      console.error("Error al actualizar coleccion:", error);

      setActionError("Error al actualizar la coleccion.");
    } finally {
      setLoading(false);
    }
  }

  const sprites = pokemon ? (Object.entries(pokemon.sprites) as [keyof typeof spriteLabels, string | null][]) .filter((entry): entry is [keyof typeof spriteLabels, string] => !!entry[1]) : [];

  return (
    <div className={styles.modalOverlay}
      onClick={onClose}
    >
      <div className={styles.pokemonInfoModal}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className={styles.pokemonInfoModalHeader}>
          <h2>
            {pokemon ? `${pokemon.name} #${String(pokemon.id).padStart(3, "0")}` : "Pokemon"}
          </h2>

          <button className={styles.modalClose}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {error && (
          <p className={styles.message}>
            {error}
          </p>
        )}

        {!error && !pokemon && (
          <p className={styles.message}>
            Cargando pokemon...
          </p>
        )}

        {pokemon && (
          <div className={styles.pokemonInfoModalBody}>

            <div className={styles.gallery}>

              <div className={styles.viewer}>
                <img className={styles.viewerImage}
                  src={hovered || selected}
                  alt={pokemon.name}
                />
              </div>

              <div className={styles.thumbnails}>
                {sprites.map(([key, url]) => (
                  <button className={`${styles.thumbnail} ${selected === url ? styles.activeThumbnail : ""}`}
                    key={key}
                    type="button"
                    onClick={() => setSelected(url)}
                    onMouseEnter={() => setHovered(url)}
                    onMouseLeave={() => setHovered("")}
                    aria-label={spriteLabels[key]}
                  >
                    <img
                      src={url}
                      alt={spriteLabels[key]}
                    />
                  </button>
                ))}
              </div>

            </div>

            <div className={styles.pokemonInfo}>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Tipos</span>

                <div className={styles.typeList}>
                  {pokemon.types.map((item) => {
                    const typeInfo = pokemonTypes.find((pokemonType) => pokemonType.value === item.type.name);

                    return (
                      <span className={styles.typeBadge}
                        key={item.slot}
                        style={{ background: typeInfo?.color }}
                      >
                        {typeInfo?.label ?? item.type.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              <p className={styles.infoRow}>
                <span className={styles.infoLabel}>Altura</span>
                {pokemon.height / 10} m
              </p>

              <p className={styles.infoRow}>
                <span className={styles.infoLabel}>Peso</span>
                {pokemon.weight / 10} kg
              </p>

              <p className={styles.infoRow}>
                <span className={styles.infoLabel}>Habilidades</span>
                {pokemon.abilities
                  .map((item) => item.ability.name + (item.is_hidden ? " (oculta)" : ""))
                  .join(", ")}
              </p>

              <p className={styles.infoRow}>
                <span className={styles.infoLabel}>Movimientos</span>
                {pokemon.moves.length}
              </p>

              <p className={styles.infoRow}>
                <span className={styles.infoLabel}>Capturado</span>
                {owned ? "Si" : "No"}
              </p>

              {isLoggedIn && !confirm && (
                <button className={styles.actionButton}
                  type="button"
                  onClick={() => setConfirm(true)}
                >
                  {owned ? "Liberar" : "Capturar"}
                </button>
              )}

              {isLoggedIn && confirm && (
                <>
                  <p className={styles.confirmText}>
                    ¿Seguro que quieres {owned ? "liberar" : "capturar"} a <strong>{pokemon.name}</strong>?
                  </p>

                  {actionError && (
                    <p className={styles.error}>
                      {actionError}
                    </p>
                  )}

                  <button className={styles.actionButton}
                    type="button"
                    onClick={handleConfirm}
                    disabled={loading}
                  >
                    {loading ? "Guardando..." : "Confirmar"}
                  </button>

                  <button className={styles.cancelButton}
                    type="button"
                    onClick={() => setConfirm(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                </>
              )}

            </div>

          </div>
        )}
      </div>
    </div>
  );
}