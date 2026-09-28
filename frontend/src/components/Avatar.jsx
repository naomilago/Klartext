import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "klartext:avatar";

function DefaultAvatar() {
  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%" aria-hidden="true">
      <defs>
        <clipPath id="avatar-circle-clip">
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>
      <circle cx="20" cy="20" r="20" fill="var(--accent-tint)" />
      <g clipPath="url(#avatar-circle-clip)">
        <path d="M4 40 C4 29 10 24 20 24 C30 24 36 29 36 40 Z" fill="var(--accent)" />
        <ellipse cx="12" cy="24" rx="3" ry="7.5" fill="var(--accent)" />
        <ellipse cx="28" cy="24" rx="3" ry="7.5" fill="var(--accent)" />
        <circle cx="20" cy="15" r="9.5" fill="var(--accent)" />
        <circle cx="20" cy="16" r="8" fill="var(--card)" />
      </g>
    </svg>
  );
}

export default function Avatar({ size = 36 }) {
  const [imageSrc, setImageSrc] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setImageSrc(saved);
    } catch {
      // localStorage indisponível (ex.: navegação privada) - segue sem avatar salvo
    }
  }, []);

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

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Alterar foto do perfil"
        title="Alterar foto do perfil"
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
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
    </>
  );
}
