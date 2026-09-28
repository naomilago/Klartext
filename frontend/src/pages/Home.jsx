import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createChat,
  createExercise,
  deleteAllChats,
  deleteAllExercises,
  deleteChat,
  deleteExercise,
  listChats,
  listExercises,
} from "../api";
import { MessageCircleIcon, CheckSquareIcon, TrashIcon, BarChartIcon, BookOpenIcon } from "../components/icons";
import Avatar from "../components/Avatar";
import ThemeToggle from "../components/ThemeToggle";
import ConfirmDialog from "../components/ConfirmDialog";
import Footer from "../components/Footer";

function formatDate(iso) {
  const date = new Date(iso);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) {
    return `Hoje, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Ontem";
  }
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function Home() {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  function askConfirm(message, action) {
    setConfirmState({ message, action });
  }

  function closeConfirm() {
    setConfirmState(null);
  }

  async function runConfirmedAction() {
    if (!confirmState) return;
    await confirmState.action();
    closeConfirm();
  }

  useEffect(() => {
    Promise.all([listChats(), listExercises()])
      .then(([chatList, exerciseList]) => {
        setChats(chatList);
        setExercises(exerciseList);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function startChat() {
    if (starting) return;
    setStarting(true);
    try {
      const { id } = await createChat();
      navigate(`/chat/${id}`);
    } finally {
      setStarting(false);
    }
  }

  async function startExercise() {
    if (starting) return;
    setStarting(true);
    try {
      const { id } = await createExercise();
      navigate(`/exercises/${id}`);
    } finally {
      setStarting(false);
    }
  }

  function handleDeleteChat(event, id) {
    event.preventDefault();
    event.stopPropagation();
    askConfirm("Excluir esta conversa? Essa ação não pode ser desfeita.", async () => {
      await deleteChat(id);
      setChats((prev) => prev.filter((c) => c.id !== id));
    });
  }

  function handleDeleteAllChats() {
    if (chats.length === 0) return;
    askConfirm("Excluir TODAS as conversas? Essa ação não pode ser desfeita.", async () => {
      await deleteAllChats();
      setChats([]);
    });
  }

  function handleDeleteExercise(event, id) {
    event.preventDefault();
    event.stopPropagation();
    askConfirm("Excluir este exercício? Essa ação não pode ser desfeita.", async () => {
      await deleteExercise(id);
      setExercises((prev) => prev.filter((e) => e.id !== id));
    });
  }

  function handleDeleteAllExercises() {
    if (exercises.length === 0) return;
    askConfirm("Excluir TODOS os exercícios? Essa ação não pode ser desfeita.", async () => {
      await deleteAllExercises();
      setExercises([]);
    });
  }

  return (
    <div
      className="fade-in-simple"
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "32px 56px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/" style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>
          Klartext
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            to="/vocabulario"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}
          >
            <BookOpenIcon size={18} />
            Vocabulário
          </Link>
          <Link
            to="/report"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}
          >
            <BarChartIcon size={18} />
            Relatório
          </Link>
          <span style={{ fontSize: 14, color: "var(--ink-2)" }}>Olá, Naomi</span>
          <Avatar size={36} />
          <ThemeToggle />
        </div>
      </div>

      <div style={{ padding: "28px 56px 4px" }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 40, lineHeight: "48px", fontWeight: 600 }}>
          Bom te ver de novo, Naomi.
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 16, lineHeight: "24px", color: "var(--ink-2)" }}>
          Pronta pra praticar seu alemão hoje?
        </p>
      </div>

      <div style={{ padding: "28px 56px", display: "flex", gap: 24, flexWrap: "wrap" }}>
        <button
          onClick={startChat}
          disabled={starting}
          className="mode-card fade-in"
          style={{
            flex: "1 1 320px",
            display: "flex",
            gap: 16,
            alignItems: "flex-start",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 24,
            textAlign: "left",
            font: "inherit",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--accent-tint)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MessageCircleIcon />
          </div>
          <div>
            <strong style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
              Conversa livre
            </strong>
            <p style={{ margin: 0, fontSize: 14, lineHeight: "20px", color: "var(--ink-2)" }}>
              Pratique alemão em conversa aberta, no seu ritmo, com correções quando fizer sentido.
            </p>
          </div>
        </button>

        <button
          onClick={startExercise}
          disabled={starting}
          className="mode-card fade-in"
          style={{
            flex: "1 1 320px",
            display: "flex",
            gap: 16,
            alignItems: "flex-start",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 24,
            textAlign: "left",
            font: "inherit",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--amber-tint)",
              color: "var(--amber-ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CheckSquareIcon />
          </div>
          <div>
            <strong style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
              Exercícios
            </strong>
            <p style={{ margin: 0, fontSize: 14, lineHeight: "20px", color: "var(--ink-2)" }}>
              Uma leva de 10 perguntas variadas — vocabulário, gramática e tradução — com pontuação no final.
            </p>
          </div>
        </button>
      </div>

      <div style={{ flexGrow: 1, minHeight: 0, padding: "4px 56px 32px", display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>
              Conversas recentes
            </h2>
            {chats.length > 0 && (
              <button
                onClick={handleDeleteAllChats}
                style={{ background: "none", border: "none", fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}
              >
                Apagar tudo
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {!loading && chats.length === 0 && (
              <p style={{ fontSize: 14, color: "var(--ink-2)" }}>Nenhuma conversa ainda.</p>
            )}
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="history-row"
                style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}
              >
                <Link to={`/chat/${chat.id}/view`} style={{ display: "block", flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)" }}>{formatDate(chat.updated_at)}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{chat.message_count} mensagens</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14 }}>{chat.title ?? chat.preview}</p>
                </Link>
                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  aria-label="Excluir conversa"
                  title="Excluir conversa"
                  style={{ background: "none", border: "none", color: "var(--ink-2)", padding: 6, flexShrink: 0, display: "flex" }}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>
              Exercícios anteriores
            </h2>
            {exercises.length > 0 && (
              <button
                onClick={handleDeleteAllExercises}
                style={{ background: "none", border: "none", fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}
              >
                Apagar tudo
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {!loading && exercises.length === 0 && (
              <p style={{ fontSize: 14, color: "var(--ink-2)" }}>Nenhum exercício ainda.</p>
            )}
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="history-row"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Link
                  to={exercise.is_finished ? `/exercises/${exercise.id}/review` : `/exercises/${exercise.id}`}
                  style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span style={{ fontSize: 14 }}>{exercise.title ?? formatDate(exercise.started_at)}</span>
                  {exercise.is_finished ? (
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--amber-ink)",
                        background: "var(--amber-tint)",
                        padding: "4px 10px",
                        borderRadius: 999,
                      }}
                    >
                      {exercise.correct_count}/{exercise.total_questions}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>continuar →</span>
                  )}
                </Link>
                <button
                  onClick={(e) => handleDeleteExercise(e, exercise.id)}
                  aria-label="Excluir exercício"
                  title="Excluir exercício"
                  style={{ background: "none", border: "none", color: "var(--ink-2)", padding: 6, flexShrink: 0, display: "flex" }}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />

      <ConfirmDialog
        open={!!confirmState}
        message={confirmState?.message}
        onConfirm={runConfirmedAction}
        onCancel={closeConfirm}
      />
    </div>
  );
}
