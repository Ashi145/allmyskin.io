import { useState } from "react";

export function SafeImage({
  src,
  alt,
  className = "",
  initials,
  loading,
  fetchPriority,
}: {
  src: string;
  alt: string;
  className?: string;
  initials?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
}) {
  const [errored, setErrored] = useState(false);

  const fallbackInitials = initials
    ? initials
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  if (errored || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] font-semibold select-none ${className}`}
        aria-label={alt}
      >
        <span className="text-2xl">{fallbackInitials}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      onError={() => setErrored(true)}
    />
  );
}
