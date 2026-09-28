import { TrashIcon } from "./icons";

export default function ConfirmDialog({ open, title = "Tem certeza?", message, confirmLabel = "Excluir", onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 20, 18, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 24,
      }}
      className="fade-in-simple"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-pop"
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 28,
          boxShadow: "0 20px 50px rgba(15, 20, 18, 0.25)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            background: "var(--correction-tint)",
            color: "var(--correction-ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TrashIcon size={20} />
        </div>
        <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600 }}>{title}</h3>
        <p style={{ margin: 0, fontSize: 14, lineHeight: "21px", color: "var(--ink-2)" }}>{message}</p>
        <div style={{ display: "flex", gap: 10, marginTop: 8, width: "100%" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              background: "none",
              border: "1px solid var(--border)",
              color: "var(--ink)",
              fontWeight: 600,
              fontSize: 14,
              padding: "11px 0",
              borderRadius: 999,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              background: "var(--correction-border)",
              border: "none",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              padding: "11px 0",
              borderRadius: 999,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
