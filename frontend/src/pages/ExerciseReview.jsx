import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createExercise, getExercise } from "../api";
import { AwardIcon, ChevronLeftIcon, TutorAvatar } from "../components/icons";
import Markdown from "../components/Markdown";
import ThemeToggle from "../components/ThemeToggle";

const CATEGORY_LABELS = {
  vocabulario: "Vocabulário",
  gramatica: "Gramática",
  traducao: "Tradução",
  completar_frase: "Completar frase",
};

function ItemCard({ item }) {
  const answered = item.user_answer !== null;
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)" }}>Pergunta {item.position}</span>
        <span
          style={{
            background: "var(--accent-tint)",
            color: "var(--accent)",
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 999,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          {CATEGORY_LABELS[item.category] ?? item.category}
        </span>
        {answered && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 12,
              fontWeight: 700,
              color: item.is_correct ? "var(--accent)" : "var(--correction-ink)",
            }}
          >
            {item.is_correct ? "✓ Correto" : "✕ Incorreto"}
          </span>
        )}
      </div>

      <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, lineHeight: "22px" }}>{item.question}</p>

      {answered ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ margin: 0, fontSize: 14 }}>
            <span style={{ color: "var(--ink-2)" }}>Sua resposta: </span>
            <strong>{item.user_answer}</strong>
          </p>
          {item.feedback && (
            <div
              style={{
                background: item.is_correct ? "var(--accent-tint)" : "var(--correction-tint)",
                borderLeft: `3px solid ${item.is_correct ? "var(--accent)" : "var(--correction-border)"}`,
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                lineHeight: "19px",
                color: "var(--correction-text)",
              }}
            >
              <Markdown>{item.feedback}</Markdown>
              {!item.is_correct && item.corrected_answer && (
                <p style={{ margin: "6px 0 0", fontWeight: 600 }}>Resposta esperada: {item.corrected_answer}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)", fontStyle: "italic" }}>Ainda não respondida.</p>
      )}
    </div>
  );
}

export default function ExerciseReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [startingNew, setStartingNew] = useState(false);

  useEffect(() => {
    getExercise(id).then(setData);
  }, [id]);

  async function handleNewExercise() {
    if (startingNew) return;
    setStartingNew(true);
    try {
      const { id: newId } = await createExercise();
      navigate(`/exercises/${newId}`);
    } finally {
      setStartingNew(false);
    }
  }

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--ink-2)" }}>Carregando exercício...</p>
      </div>
    );
  }

  const stats = Object.entries(data.breakdown ?? {}).map(([category, values]) => ({
    label: CATEGORY_LABELS[category] ?? category,
    value: `${values.correct}/${values.total}`,
  }));

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
        <Link to="/app" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-2)", fontSize: 14, fontWeight: 600 }}>
          <ChevronLeftIcon />
          Início
        </Link>
        <div style={{ width: 1, height: 24, background: "var(--border)" }} />
        <TutorAvatar size={36} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Link to="/app" style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>
            Klartext
          </Link>
          <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{data.title ?? "Exercício"}</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          {!data.is_finished && (
            <span
              style={{
                background: "var(--amber-tint)",
                color: "var(--amber-ink)",
                fontSize: 12,
                fontWeight: 700,
                padding: "6px 12px",
                borderRadius: 999,
              }}
            >
              Em andamento
            </span>
          )}
          <ThemeToggle size={32} />
        </div>
      </div>

      <div style={{ flexGrow: 1, minHeight: 0, overflowY: "auto", padding: "32px 40px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 680, display: "flex", flexDirection: "column", gap: 24 }}>
          {data.is_finished && (
            <div
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: 40,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  background: "var(--amber-tint)",
                  color: "var(--amber-ink)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AwardIcon size={26} />
              </div>
              <div>
                <span style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 700, color: "var(--accent)" }}>
                  {data.correct_count}/{data.total_questions}
                </span>
                <p style={{ margin: "4px 0 0", fontSize: 16, fontWeight: 600 }}>Rodada concluída, Naomi! 👏</p>
              </div>
              {data.closing_message && (
                <div style={{ fontSize: 14, lineHeight: "21px", color: "var(--ink-2)", maxWidth: 440 }}>
                  <Markdown>{data.closing_message}</Markdown>
                </div>
              )}
              {stats.length > 0 && (
                <div style={{ display: "flex", gap: 12, width: "100%", flexWrap: "wrap" }}>
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      style={{ flex: "1 1 120px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}
                    >
                      <span style={{ display: "block", fontSize: 12, color: "var(--ink-2)", marginBottom: 4 }}>{stat.label}</span>
                      <span style={{ display: "block", fontSize: 16, fontWeight: 700 }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                <Link
                  to="/app"
                  style={{ background: "var(--accent)", color: "#fff", fontWeight: 600, fontSize: 14, padding: "12px 28px", borderRadius: 999 }}
                >
                  Voltar ao início
                </Link>
                <button
                  onClick={handleNewExercise}
                  disabled={startingNew}
                  style={{
                    background: "none",
                    border: "1px solid var(--border)",
                    color: "var(--ink)",
                    fontWeight: 600,
                    fontSize: 14,
                    padding: "12px 28px",
                    borderRadius: 999,
                    opacity: startingNew ? 0.6 : 1,
                  }}
                >
                  Novo exercício
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {data.items.map((item) => (
              <ItemCard key={item.position} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
