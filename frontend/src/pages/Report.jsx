import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getReport } from "../api";
import { AwardIcon, ChevronLeftIcon, TutorAvatar } from "../components/icons";
import Markdown from "../components/Markdown";
import ThemeToggle from "../components/ThemeToggle";
import Footer from "../components/Footer";

const CATEGORY_LABELS = {
  vocabulario: "Vocabulário",
  gramatica: "Gramática",
  traducao: "Tradução",
  completar_frase: "Completar frase",
};

function scoreColor(score) {
  if (score >= 70) return "var(--accent)";
  if (score >= 40) return "var(--amber-ink)";
  return "var(--correction-ink)";
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 24,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function Report() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getReport()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--ink-2)" }}>Preparando seu relatório...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ color: "var(--ink-2)" }}>Não foi possível carregar o relatório agora.</p>
        <Link to="/app" style={{ color: "var(--accent)", fontWeight: 600 }}>Voltar ao início</Link>
      </div>
    );
  }

  const categoryEntries = Object.entries(data.category_breakdown ?? {});

  return (
    <div style={{ height: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
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
          <Link to="/" style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>
            Klartext
          </Link>
          <span style={{ fontSize: 12, color: "var(--ink-2)" }}>Relatório de progresso</span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <ThemeToggle size={32} />
        </div>
      </div>

      <div style={{ flexGrow: 1, minHeight: 0, overflowY: "auto", padding: "32px 40px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 720, display: "flex", flexDirection: "column", gap: 20 }}>
          <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12 }}>
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
            {data.overall_score !== null && data.overall_score !== undefined ? (
              <>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 56, fontWeight: 700, color: scoreColor(data.overall_score) }}>
                  {data.overall_score}
                </span>
                <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Nota geral de progresso (0 a 100)</span>
              </>
            ) : (
              <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 600 }}>Ainda sem contexto suficiente</span>
            )}
            {data.summary && (
              <div style={{ fontSize: 14, lineHeight: "21px", color: "var(--ink-2)", maxWidth: 520 }}>
                <Markdown>{data.summary}</Markdown>
              </div>
            )}
          </Card>

          {(data.strengths?.length > 0 || data.improvements?.length > 0) && (
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {data.strengths?.length > 0 && (
                <Card style={{ flex: "1 1 280px" }}>
                  <h2 style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, color: "var(--accent)" }}>
                    Pontos fortes
                  </h2>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.strengths.map((item, i) => (
                      <li key={i} style={{ fontSize: 14, lineHeight: "20px" }}>{item}</li>
                    ))}
                  </ul>
                </Card>
              )}
              {data.improvements?.length > 0 && (
                <Card style={{ flex: "1 1 280px" }}>
                  <h2 style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, color: "var(--amber-ink)" }}>
                    A melhorar
                  </h2>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.improvements.map((item, i) => (
                      <li key={i} style={{ fontSize: 14, lineHeight: "20px" }}>{item}</li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}

          <Card>
            <h2 style={{ margin: "0 0 16px", fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600 }}>
              Exercícios
            </h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: categoryEntries.length ? 16 : 0 }}>
              <div style={{ flex: "1 1 140px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <span style={{ display: "block", fontSize: 12, color: "var(--ink-2)", marginBottom: 4 }}>Rodadas concluídas</span>
                <span style={{ display: "block", fontSize: 20, fontWeight: 700 }}>{data.exercise_count}</span>
              </div>
              <div style={{ flex: "1 1 140px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <span style={{ display: "block", fontSize: 12, color: "var(--ink-2)", marginBottom: 4 }}>Média de acerto</span>
                <span style={{ display: "block", fontSize: 20, fontWeight: 700 }}>
                  {data.average_score_pct !== null ? `${data.average_score_pct}%` : "—"}
                </span>
              </div>
            </div>
            {categoryEntries.length > 0 && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {categoryEntries.map(([category, values]) => (
                  <div
                    key={category}
                    style={{ flex: "1 1 140px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}
                  >
                    <span style={{ display: "block", fontSize: 12, color: "var(--ink-2)", marginBottom: 4 }}>
                      {CATEGORY_LABELS[category] ?? category}
                    </span>
                    <span style={{ display: "block", fontSize: 16, fontWeight: 700 }}>
                      {values.correct}/{values.total}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 style={{ margin: "0 0 16px", fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600 }}>
              Vocabulário
            </h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: data.needs_review?.length ? 16 : 0 }}>
              <div style={{ flex: "1 1 140px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <span style={{ display: "block", fontSize: 12, color: "var(--ink-2)", marginBottom: 4 }}>Palavras praticadas</span>
                <span style={{ display: "block", fontSize: 20, fontWeight: 700 }}>{data.words_total_seen}</span>
              </div>
              <div style={{ flex: "1 1 140px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <span style={{ display: "block", fontSize: 12, color: "var(--ink-2)", marginBottom: 4 }}>Dominadas</span>
                <span style={{ display: "block", fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>{data.words_mastered}</span>
              </div>
            </div>
            {data.needs_review?.length > 0 && (
              <div>
                <span style={{ display: "block", fontSize: 12, color: "var(--ink-2)", marginBottom: 8 }}>
                  Ainda precisa revisar:
                </span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {data.needs_review.map((item) => (
                    <span
                      key={item.word}
                      title={item.gloss}
                      style={{
                        background: "var(--correction-tint)",
                        color: "var(--correction-ink)",
                        fontSize: 13,
                        fontWeight: 600,
                        padding: "6px 12px",
                        borderRadius: 999,
                      }}
                    >
                      {item.word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h2 style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600 }}>
              Conversas
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: "var(--ink-2)" }}>
              {data.chat_count} conversa(s) livre(s), {data.message_count} mensagens no total.
            </p>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
