import { useNavigate } from "react-router-dom";
import { TutorAvatar, MessageCircleIcon, CheckSquareIcon } from "../components/icons";
import ThemeToggle from "../components/ThemeToggle";

const FEATURES = [
  {
    icon: <MessageCircleIcon size={20} />,
    title: "Conversa livre",
    description: "Pratique alemão em conversa aberta, com correções quando fizer sentido.",
  },
  {
    icon: <CheckSquareIcon size={20} />,
    title: "Exercícios",
    description: "Levas de 10 perguntas variadas, com correção e pontuação na hora.",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div
      className="fade-in-simple"
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        position: "relative",
        textAlign: "center",
      }}
    >
      <div style={{ position: "absolute", top: 24, right: 24 }}>
        <ThemeToggle />
      </div>

      <div className="fade-in" style={{ marginBottom: 20 }}>
        <TutorAvatar size={64} />
      </div>

      <h1
        className="fade-in"
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: "clamp(48px, 9vw, 84px)",
          fontWeight: 700,
          color: "var(--accent)",
          lineHeight: 1,
        }}
      >
        Klartext
      </h1>

      <p
        className="fade-in"
        style={{
          margin: "20px 0 0",
          fontSize: 18,
          lineHeight: "27px",
          color: "var(--ink-2)",
          maxWidth: 480,
        }}
      >
        Seu tutor de alemão para treinar <strong style={{ color: "var(--ink)" }}>conversação de verdade</strong> —
        complementando o que você já aprende no Duolingo.
      </p>

      <button
        onClick={() => navigate("/app")}
        className="fade-in"
        style={{
          marginTop: 32,
          background: "var(--accent)",
          color: "#fff",
          border: "none",
          fontWeight: 600,
          fontSize: 16,
          padding: "14px 36px",
          borderRadius: 999,
          cursor: "pointer",
        }}
      >
        Começar a praticar
      </button>

      <div
        className="fade-in"
        style={{
          marginTop: 56,
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 640,
        }}
      >
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            style={{
              flex: "1 1 240px",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 20,
              textAlign: "left",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--accent-tint)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {feature.icon}
            </div>
            <div>
              <strong style={{ display: "block", fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{feature.title}</strong>
              <p style={{ margin: 0, fontSize: 13, lineHeight: "19px", color: "var(--ink-2)" }}>{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
