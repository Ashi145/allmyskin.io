export type Crumb = { label: string; onClick?: () => void };

export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-[11px] uppercase tracking-widest font-semibold text-[var(--color-on-surface-variant)] mb-6">
      {trail.map((c, i) => {
        const isLast = i === trail.length - 1;
        return (
          <span key={c.label} className="flex items-center gap-1.5">
            {i > 0 && <span className="material-symbols-outlined text-[14px] opacity-50">chevron_right</span>}
            {c.onClick && !isLast ? (
              <button onClick={c.onClick} className="hover:text-[var(--color-primary)] transition">{c.label}</button>
            ) : (
              <span className={isLast ? "text-[var(--color-primary)]" : ""}>{c.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
