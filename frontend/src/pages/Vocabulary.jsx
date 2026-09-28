import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getVocab } from "../api";
import { ChevronLeftIcon, TutorAvatar } from "../components/icons";
import ThemeToggle from "../components/ThemeToggle";
import Footer from "../components/Footer";

const STATUS_LABELS = {
  dominada: "Dominada",
  praticando: "Praticando",
  revisar: "Revisar",
};

const STATUS_STYLES = {
  dominada: { bg: "var(--accent-tint)", color: "var(--accent)" },
  praticando: { bg: "var(--amber-tint)", color: "var(--amber-ink)" },
  revisar: { bg: "var(--correction-tint)", color: "var(--correction-ink)" },
};

const FILTERS = [
  { key: "todas", label: "Todas" },
  { key: "revisar", label: "Revisar" },
  { key: "praticando", label: "Praticando" },
  { key: "dominada", label: "Dominadas" },
];

function formatDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function Vocabulary() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("todas");

  useEffect(() => {
    getVocab()
      .then((data) => setWords(data.words))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c = { todas: words.length, dominada: 0, praticando: 0, revisar: 0 };
    for (const w of words) c[w.status] = (c[w.status] ?? 0) + 1;
    return c;
  }, [words]);

  const filtered = filter === "todas" ? words : words.filter((w) => w.status === filter);

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
          <span style={{ fontSize: 12, color: "var(--ink-2)" }}>Vocabulário</span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <ThemeToggle size={32} />
        </div>
      </div>

      <div style={{ flexGrow: 1, minHeight: 0, overflowY: "auto", padding: "32px 40px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 780, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  background: filter === f.key ? "var(--accent)" : "var(--card)",
                  color: filter === f.key ? "#fff" : "var(--ink)",
                  border: "1px solid var(--border)",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "8px 16px",
                  borderRadius: 999,
                }}
              >
                {f.label} ({counts[f.key] ?? 0})
              </button>
            ))}
          </div>

          {loading && <p style={{ color: "var(--ink-2)", fontSize: 14 }}>Carregando vocabulário...</p>}
          {!loading && error && <p style={{ color: "var(--ink-2)", fontSize: 14 }}>Não foi possível carregar o vocabulário agora.</p>}

          {!loading && !error && words.length === 0 && (
            <div
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: 24,
                textAlign: "center",
                color: "var(--ink-2)",
                fontSize: 14,
              }}
            >
              Nenhuma palavra praticada ainda — faça um exercício para começar a construir seu vocabulário.
            </div>
          )}

          {!loading && !error && words.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((item) => {
                const style = STATUS_STYLES[item.status];
                return (
                  <div
                    key={item.word}
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 14,
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <strong style={{ fontSize: 16 }}>{item.word}</strong>
                        <span style={{ fontSize: 13, color: "var(--ink-2)" }}>— {item.gloss}</span>
                      </div>
                      <span style={{ fontSize: 12, color: "var(--ink-2)", textTransform: "capitalize" }}>{item.theme}</span>
                    </div>

                    <span
                      style={{
                        background: style.bg,
                        color: style.color,
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "5px 12px",
                        borderRadius: 999,
                        flexShrink: 0,
                      }}
                    >
                      {STATUS_LABELS[item.status]}
                    </span>

                    <div style={{ flexShrink: 0, textAlign: "right", minWidth: 96 }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>
                        {item.times_correct}/{item.times_shown}
                      </span>
                      <span style={{ display: "block", fontSize: 11, color: "var(--ink-2)" }}>acertos</span>
                    </div>

                    <div style={{ flexShrink: 0, textAlign: "right", minWidth: 72 }}>
                      <span style={{ display: "block", fontSize: 13, color: "var(--ink-2)" }}>{formatDate(item.last_shown_at)}</span>
                      <span style={{ display: "block", fontSize: 11, color: "var(--ink-2)" }}>última vez</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
