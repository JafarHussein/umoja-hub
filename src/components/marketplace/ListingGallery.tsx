'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';

// Listing image gallery (Marketplace Rebuild, Stage 7). Main image + thumbnail
// strip for multi-image listings, and click-to-zoom into a full-screen
// lightbox. Falls back to a produce placeholder when a listing has no photos.

function Placeholder(): React.ReactElement {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <path d="M12 44L28 20L44 44H12Z" fill="currentColor" className="text-app-faint/40" />
        <circle cx="38" cy="17" r="5" fill="currentColor" className="text-app-faint/40" />
      </svg>
    </div>
  );
}

export function ListingGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}): React.ReactElement {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  const current = images[active] ?? null;

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setZoom(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [zoom]);

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-app-card border border-app-hairline bg-app-sunken">
        {current ? (
          <button
            type="button"
            onClick={() => setZoom(true)}
            className="group block h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-app-ring"
            aria-label="Zoom image"
          >
            <Image
              src={current}
              alt={alt}
              fill
              priority
              className="object-cover transition-transform duration-250 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 60vw"
            />
            <span className="app-label absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-app-pill bg-app-card/90 px-2 py-0.5 text-app-body backdrop-blur-sm">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M8 8L10.5 10.5M5 3.5V6.5M3.5 5H6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Zoom
            </span>
          </button>
        ) : (
          <Placeholder />
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={cn(
                'relative aspect-square h-16 w-16 flex-shrink-0 overflow-hidden rounded-app-control border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring',
                i === active ? 'border-app-brand' : 'border-app-hairline hover:border-app-border-strong'
              )}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}

      {/* Zoom lightbox */}
      {zoom && current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Zoomed image"
          className="fixed inset-0 z-50 flex items-center justify-center bg-app-ink/80 p-4"
          onClick={() => setZoom(false)}
        >
          <div className="relative h-full max-h-[90vh] w-full max-w-5xl">
            <Image src={current} alt={alt} fill className="object-contain" sizes="100vw" />
          </div>
          <button
            type="button"
            onClick={() => setZoom(false)}
            aria-label="Close zoom"
            className="absolute right-4 top-4 rounded-app-pill bg-app-card/90 p-2 text-app-ink transition-colors duration-150 hover:bg-app-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
