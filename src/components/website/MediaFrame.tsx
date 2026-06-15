import Image from 'next/image';

interface MediaFrameProps {
  /** When provided, the optimized image renders. When omitted, a labeled
   *  placeholder reserves the exact space so real photography drops in later
   *  with zero layout change. */
  src?: string;
  alt: string;
  /** Short label shown on the placeholder (e.g. "Farmer at harvest"). */
  label: string;
  /** Tailwind aspect-ratio utility, e.g. "aspect-[4/5]" or "aspect-video". */
  aspect?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Image-ready media slot. Type-forward interim: renders a tasteful, on-theme
 * placeholder (NOT a fake screenshot, NOT decorative SVG) that names the
 * intended shot. Pass `src` to render the real image.
 */
export function MediaFrame({
  src,
  alt,
  label,
  aspect = 'aspect-[4/5]',
  priority = false,
  className = '',
}: MediaFrameProps) {
  return (
    <div
      className={`relative ${aspect} w-full overflow-hidden rounded border border-border bg-surface-sunken ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
          className="object-cover object-center"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center"
        >
          <span className="font-ibm-mono text-xs uppercase tracking-widest text-fg-subtle">
            {label}
          </span>
          <span className="h-px w-8 bg-border-strong" />
        </div>
      )}
    </div>
  );
}
