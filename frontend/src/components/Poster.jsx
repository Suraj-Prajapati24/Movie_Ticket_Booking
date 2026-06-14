import { useState } from "react";

function hueFromTitle(title = "") {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export default function Poster({ url, title, className = "" }) {
  const [failed, setFailed] = useState(false);
  const showImage = url && !failed;

  if (showImage) {
    return (
      <img
        src={url}
        alt={`${title} poster`}
        className={`poster ${className}`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  const hue = hueFromTitle(title);
  return (
    <div
      className={`poster poster-fallback ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 55%, 32%), hsl(${(hue + 40) % 360}, 60%, 18%))`,
      }}
      aria-label={`${title} poster`}
    >
      <span className="poster-initial">
        {(title || "?").charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
