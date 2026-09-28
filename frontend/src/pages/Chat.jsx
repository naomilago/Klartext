import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getChat, sendMessage } from "../api";
import { ChevronLeftIcon, SendIcon, TutorAvatar } from "../components/icons";
import Markdown from "../components/Markdown";

function TypingDots() {
  return (
    <span className="typing-dots">
      <span></span>
      <span></span>
      <span></span>
    </span>
  );
}

function Bubble({ role, content, isStreaming }) {
  const isUser = role === "user";
  const isEmptyStreaming = isStreaming && content === "";
  return (
    <div
      style={{
        maxWidth: 560,
        alignSelf: isUser ? "flex-end" : "flex-start",
        background: isUser ? "var(--accent)" : "var(--card)",
        color: isUser ? "#ffffff" : "var(--ink)",
        border: isUser ? "none" : "1px solid var(--border)",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: isEmptyStreaming ? "12px 18px" : "14px 18px",
        fontSize: 15,
        lineHeight: "23px",
        minWidth: isEmptyStreaming ? 56 : undefined,
      }}
    >
      {isEmptyStreaming ? <TypingDots /> : <Markdown>{content}</Markdown>}
    </div>
  );
}

export default function Chat({ readOnly = false }) {
  const { id } = useParams();
  const [title, setTitle] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    getChat(id)
      .then((data) => {
        setTitle(data.title);
        setMessages(data.messages);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(event) {
    event.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content }, { role: "assistant", content: "" }]);

    try {
      await sendMessage(id, content, (chunk) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + chunk };
          return next;
        });
      });
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "Ops, algo deu errado ao falar com o tutor. Tenta de novo?",
        };
        return next;
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          flexShrink: 0,
          padding: "18px 40px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          borderBottom: "1px solid var(--border)",
          background: "var(--card)",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-2)", fontSize: 14, fontWeight: 600 }}>
          <ChevronLeftIcon />
          Início
        </Link>
        <div style={{ width: 1, height: 24, background: "var(--border)" }} />
        <TutorAvatar size={36} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15 }}>Klartext</span>
          <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{title ?? "Conversa livre"}</span>
        </div>
        <span
          style={{
            marginLeft: "auto",
            background: readOnly ? "var(--amber-tint)" : "var(--accent-tint)",
            color: readOnly ? "var(--amber-ink)" : "var(--accent)",
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 12px",
            borderRadius: 999,
          }}
        >
          {readOnly ? "Somente leitura" : "Nível A1"}
        </span>
      </div>

      <div style={{ flexGrow: 1, minHeight: 0, overflowY: "auto", padding: "32px 96px", display: "flex", flexDirection: "column", gap: 16 }}>
        {!loading && messages.length === 0 && (
          <p style={{ color: "var(--ink-2)", fontSize: 14 }}>
            {readOnly ? "Esta conversa não tem mensagens." : "Manda a primeira mensagem pra começar a conversar em alemão."}
          </p>
        )}
        {messages.map((message, i) => (
          <Bubble
            key={i}
            role={message.role}
            content={message.content}
            isStreaming={sending && i === messages.length - 1 && message.role === "assistant"}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {readOnly && (
        <div
          style={{
            flexShrink: 0,
            borderTop: "1px solid var(--border)",
            background: "var(--card)",
            padding: "16px 96px",
            textAlign: "center",
            fontSize: 13,
            color: "var(--ink-2)",
          }}
        >
          Esta é uma conversa antiga — abra "Conversa livre" no início para começar uma nova.
        </div>
      )}

      {!readOnly && (
      <form
        onSubmit={handleSend}
        style={{
          flexShrink: 0,
          borderTop: "1px solid var(--border)",
          background: "var(--card)",
          padding: "16px 96px",
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <label className="sr-only" htmlFor="chat-input">
          Escreva sua mensagem em alemão
        </label>
        <input
          id="chat-input"
          type="text"
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreva em alemão (ou português, se travar)..."
          disabled={sending}
          style={{
            flexGrow: 1,
            padding: "12px 16px",
            border: "1px solid var(--border)",
            borderRadius: 999,
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          type="submit"
          aria-label="Enviar mensagem"
          disabled={sending || !input.trim()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            opacity: sending || !input.trim() ? 0.6 : 1,
          }}
        >
          <SendIcon />
        </button>
      </form>
      )}
    </div>
  );
}
