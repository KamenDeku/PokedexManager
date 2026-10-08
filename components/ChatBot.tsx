"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./ChatBot.module.css";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const welcomeMessage: ChatMessage = {
  role: "assistant",
  content:
    "¡Hola! Soy Rotom, tu asistente Pokemon. Preguntame por un Pokemon o pideme recomendaciones para tu coleccion.",
};

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);

  const bottomRef = useRef<HTMLDivElement>(null);

  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      setOpen(false);
      setInput("");
      setMessages([welcomeMessage]);
    }
  }, [status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  async function sendMessage() {
    const text = input.trim();

    if (!text || loading) {
      return;
    }

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];

    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.slice(1) }),
      });

      const data = await response.json();

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: response.ok ? data.reply : data.error ?? "Ocurrio un error",
        },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "No se pudo conectar con el asistente" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (status !== "authenticated") {
    return null;
  }

  return (
    <>
      {open && (
        <div className={styles.chatWindow}>

          <div className={styles.chatHeader}>

            <span className={styles.chatTitle}>
              Rotom
            </span>

            <button className={styles.closeButton}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
            >
              ✕
            </button>

          </div>

          <div className={styles.chatMessages}>

            {messages.map((message, index) => (
              <div className={`${styles.message} ${message.role === "user" ? styles.userMessage : styles.botMessage}`}
                key={index}
              >
                {message.role === "assistant" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            ))}

            {loading && (
              <div className={`${styles.message} ${styles.botMessage}`}>
                Pensando...
              </div>
            )}

            <div ref={bottomRef} />

          </div>

          <div className={styles.chatInputRow}>

            <input
              type="text"
              placeholder="Pregunta algo..."
              value={input}
              maxLength={1000}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && sendMessage()}
            />

            <button className={styles.sendButton}
              type="button"
              onClick={sendMessage}
              disabled={loading}
            >
              Enviar
            </button>

          </div>

        </div>
      )}

      <button className={styles.chatButton}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        aria-expanded={open}
      >
        <img
          src="/img/rotom.png"
          alt="Rotom"
        />
      </button>
    </>
  );
}