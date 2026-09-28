export default function Footer({ style }) {
  return (
    <footer
      style={{
        flexShrink: 0,
        textAlign: "center",
        padding: "12px 0 20px",
        fontSize: 12,
        color: "var(--ink-2)",
        ...style,
      }}
    >
      Feito com 💚 por Naomi
    </footer>
  );
}
