'use client';

import Image from 'next/image';
import { useState } from 'react';

interface Props {
  src: string;
  alt: string;
  aspectRatio?: string;
  className?: string;
  priority?: boolean;
}

export function ImageSlot({
  src,
  alt,
  aspectRatio = '4/3',
  className = '',
  priority = false,
}: Props) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative w-full overflow-hidden bg-canvas-elevated border border-ws-border-soft ${className}`}
      style={{ aspectRatio }}
    >
      {!failed && (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
