import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "klartext:avatar";

function DefaultAvatar() {
  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%" aria-hidden="true">
      <defs>
        <clipPath id="avatar-circle-clip">
          <circle cx="20" cy="20" r="20" />
        </clipPath>
        <linearGradient id="avatar-hair-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
        <linearGradient id="avatar-bg-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-tint)" />
          <stop offset="100%" stopColor="var(--accent-tint)" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill="url(#avatar-bg-grad)" />
      <g clipPath="url(#avatar-circle-clip)">
        <path d="M3 41 C3 28.5 10 23 20 23 C30 23 37 28.5 37 41 Z" fill="url(#avatar-hair-grad)" />
        <path
          d="M10.5 21 C9.5 12.5 13.5 6 20 6 C26.5 6 30.5 12.5 29.5 21 C29.2 15 25.2 10.5 20 10.5 C14.8 10.5 10.8 15 10.5 21 Z"
          fill="url(#avatar-hair-grad)"
        />
        <circle cx="20" cy="16.5" r="8.2" fill="var(--card)" />
        <path d="M12.5 16 C13 11.5 16 8.5 20 8.5 C24 8.5 27 11.5 27.5 16" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" opacity="0.35" />
      </g>
    </svg>
  );
}

export default function Avatar({ size = 36 }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setImageSrc(saved);
    } catch {
      // localStorage indisponível (ex.: navegação privada) - segue sem avatar salvo
    }
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutsideClick(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen]);

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setImageSrc(dataUrl);
      try {
        localStorage.setItem(STORAGE_KEY, dataUrl);
      } catch {
        // sem espaço/permissão de storage - o avatar ainda aparece nesta sessão
      }
    };
    reader.readAsDataURL(file);
  }

  function handleAvatarClick() {
    if (imageSrc) {
      setMenuOpen((open) => !open);
    } else {
      inputRef.current?.click();
    }
  }

  function handleChoosePhoto() {
    setMenuOpen(false);
    inputRef.current?.click();
  }

  function handleRemovePhoto() {
    setMenuOpen(false);
    setImageSrc(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // sem acesso ao storage - a remoção ainda vale para esta sessão
    }
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        onClick={handleAvatarClick}
        aria-label={imageSrc ? "Opções da foto do perfil" : "Adicionar foto do perfil"}
        title={imageSrc ? "Opções da foto do perfil" : "Adicionar foto do perfil"}
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          border: "none",
          padding: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {imageSrc ? (
          <img src={imageSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <DefaultAvatar />
        )}
      </button>

      {menuOpen && (
        <div
          style={{
            position: "absolute",
            top: size + 6,
            right: 0,
            zIndex: 20,
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 4px 16px rgba(35,32,28,0.12)",
            overflow: "hidden",
            minWidth: 160,
          }}
        >
          <button
            type="button"
            onClick={handleChoosePhoto}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--ink)",
              background: "none",
              border: "none",
            }}
          >
            Alterar foto
          </button>
          <button
            type="button"
            onClick={handleRemovePhoto}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--correction-ink)",
              background: "none",
              border: "none",
              borderTop: "1px solid var(--border)",
            }}
          >
            Remover foto
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
