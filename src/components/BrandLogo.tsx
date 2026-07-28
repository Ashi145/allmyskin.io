const BASE = import.meta.env.BASE_URL;

const SIZE_MAP = {
  icon:  { src: `${BASE}assets/all-my-skin-logo-circle.png`, f: (s: number) => ({ width: s, height: s }) },
  full:  { src: `${BASE}assets/all-my-skin-logo.png`,        f: (s: number) => ({ width: s * 2, height: s * 0.55 }) },
  card:  { src: `${BASE}assets/all-my-skin-logo-card.png`,   f: (s: number) => ({ width: s * 2.6, height: s }) },
};

type LogoVariant = keyof typeof SIZE_MAP;

type BrandLogoProps = {
  size?: number;
  variant?: LogoVariant;
  className?: string;
};

export function BrandLogo({ size = 38, variant = "icon", className = "" }: BrandLogoProps) {
  const { src, f } = SIZE_MAP[variant];
  const dims = f(size);
  return (
    <img
      src={src}
      alt="All My Skin"
      className={`object-contain ${className}`}
      style={{ width: dims.width, maxWidth: "100%", maxHeight: dims.height }}
      loading="eager"
      decoding="async"
    />
  );
}

export default BrandLogo;
