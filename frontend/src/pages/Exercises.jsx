import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { answerExercise, getExercise } from "../api";
import { ChevronLeftIcon } from "../components/icons";
import Markdown from "../components/Markdown";

const CATEGORY_LABELS = {
  vocabulario: "Vocabulário",
  gramatica: "Gramática",
  traducao: "Tradução",
  completar_frase: "Completar frase",
};

function OptionCard({ label, state, disabled, onClick }) {
  const palette = {
    idle: { border: "var(--border)", bg: "var(--card)", color: "var(--ink)" },
    selected: { border: "var(--accent)", bg: "var(--accent-tint)", color: "var(--accent)" },
    correct: { border: "var(--accent)", bg: "var(--accent-tint)", color: "var(--accent)" },
    incorrect: { border: "var(--correction-border)", bg: "var(--correction-tint)", color: "var(--correction-ink)" },
    muted: { border: "var(--border)", bg: "var(--card)", color: "var(--ink-2)" },
  }[state];

  return (
    <button
      type="button"
      className="option-card"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        textAlign: "left",
        padding: "14px 16px",
        border: `1.5px solid ${palette.border}`,
        background: palette.bg,
        color: palette.color,
        borderRadius: 12,
        fontSize: 15,
        fontWeight: state === "idle" || state === "muted" ? 500 : 600,
        opacity: disabled && state === "muted" ? 0.6 : 1,
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: 999,
          border: `1.5px solid ${palette.border}`,
          background: state === "idle" || state === "muted" ? "transparent" : palette.border,
          color: "#fff",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {state === "correct" && "✓"}
        {state === "incorrect" && "✕"}
        {state === "selected" && "●"}
      </span>
      {label}
    </button>
  );
}

export default function Exercises() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(10);
  const [correctCount, setCorrectCount] = useState(0);
  const [current, setCurrent] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    getExercise(id).then((data) => {
      if (data.is_finished) {
        navigate(`/exercises/${id}/review`, { replace: true });
        return;
      }
      setTotal(data.total_questions);
      setCorrectCount(data.correct_count);
      const pending = data.items.find((item) => item.user_answer === null);
      if (pending) {
        setCurrent({
          position: pending.position,
          category: pending.category,
          type: pending.type,
          question: pending.question,
          options: pending.options,
        });
      }
      setLoading(false);
    });
  }, [id, navigate]);

  async function submitAnswer(value) {
    if (!value || !value.trim() || submitting) return;
    setSubmitting(true);
    try {
      const result = await answerExercise(id, value.trim());
      setFeedback(result);
      if (result.is_correct) setCorrectCount((c) => c + 1);
    } finally {
      setSubmitting(false);
    }
  }

  function handleTextSubmit(event) {
    event.preventDefault();
    submitAnswer(answerText);
  }

  function handleContinue() {
    if (feedback.is_finished) {
      navigate(`/exercises/${id}/review`);
      return;
    }
    setCurrent({
      position: feedback.position + 1,
      category: feedback.next_question.category,
      type: feedback.next_question.type,
      question: feedback.next_question.question,
      options: feedback.next_question.options,
    });
    setFeedback(null);
    setAnswerText("");
    setSelectedOption(null);
  }

  if (loading || !current) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--ink-2)" }}>Preparando exercício...</p>
      </div>
    );
  }

  const isMultipleChoice = current.type === "multipla_escolha" && current.options?.length > 0;
  const progressPct = Math.min(100, Math.round(((current.position - 1) / total) * 100));

  function optionState(option) {
    if (!feedback) return option === selectedOption ? "selected" : "idle";
    if (option === selectedOption) return feedback.is_correct ? "correct" : "incorrect";
    if (!feedback.is_correct && option === feedback.corrected_answer) return "correct";
    return "muted";
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
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15 }}>Exercícios</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 600 }}>
            Pergunta {current.position} de {total}
          </span>
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
            {correctCount} corretas
          </span>
        </div>
      </div>

      <div style={{ flexShrink: 0, height: 6, background: "#efe7da" }}>
        <div style={{ width: `${progressPct}%`, height: 6, background: "var(--amber-fill)", transition: "width 0.3s" }} />
      </div>

      <div style={{ flexGrow: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, overflow: "auto" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 620,
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: 40,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            boxShadow: "0 1px 2px rgba(35,32,28,0.04), 0 12px 28px rgba(35,32,28,0.06)",
          }}
        >
          <span
            style={{
              alignSelf: "flex-start",
              background: "var(--accent-tint)",
              color: "var(--accent)",
              fontSize: 12,
              fontWeight: 700,
              padding: "6px 12px",
              borderRadius: 999,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            {CATEGORY_LABELS[current.category] ?? current.category}
          </span>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 24, lineHeight: "32px", fontWeight: 600 }}>
            {current.question}
          </h2>

          {!feedback && isMultipleChoice && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {current.options.map((option) => (
                <OptionCard
                  key={option}
                  label={option}
                  state={optionState(option)}
                  disabled={submitting}
                  onClick={() => setSelectedOption(option)}
                />
              ))}
            </div>
          )}

          {!feedback && !isMultipleChoice && (
            <form onSubmit={handleTextSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <label className="sr-only" htmlFor="answer-input">
                Sua resposta
              </label>
              <input
                id="answer-input"
                type="text"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Digite sua resposta em alemão..."
                disabled={submitting}
                autoFocus
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 15,
                  outline: "none",
                }}
              />
            </form>
          )}

          {feedback && isMultipleChoice && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {current.options.map((option) => (
                <OptionCard key={option} label={option} state={optionState(option)} disabled onClick={() => {}} />
              ))}
            </div>
          )}

          {!feedback && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => submitAnswer(isMultipleChoice ? selectedOption : answerText)}
                disabled={submitting || (isMultipleChoice ? !selectedOption : !answerText.trim())}
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  padding: "12px 28px",
                  borderRadius: 999,
                  opacity: submitting || (isMultipleChoice ? !selectedOption : !answerText.trim()) ? 0.6 : 1,
                }}
              >
                {submitting ? "Avaliando..." : "Responder"}
              </button>
            </div>
          )}

          {feedback && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  background: feedback.is_correct ? "var(--accent-tint)" : "var(--correction-tint)",
                  borderLeft: `3px solid ${feedback.is_correct ? "var(--accent)" : "var(--correction-border)"}`,
                  borderRadius: 8,
                  padding: "14px 16px",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: feedback.is_correct ? "var(--accent)" : "var(--correction-ink)",
                    marginBottom: 4,
                  }}
                >
                  {feedback.is_correct ? "Certinho!" : "Quase lá"}
                </span>
                <div style={{ fontSize: 14, lineHeight: "21px", color: "var(--correction-text)" }}>
                  <Markdown>{feedback.feedback}</Markdown>
                </div>
                {!isMultipleChoice && feedback.corrected_answer && (
                  <p style={{ margin: "8px 0 0", fontSize: 14, fontWeight: 600 }}>Resposta: {feedback.corrected_answer}</p>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleContinue}
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 600,
                    fontSize: 14,
                    padding: "12px 28px",
                    borderRadius: 999,
                  }}
                >
                  {feedback.is_finished ? "Ver resumo" : "Próxima pergunta"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
