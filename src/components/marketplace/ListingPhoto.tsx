'use client';

import React, { useState } from 'react';
import Image from 'next/image';

// ---------------------------------------------------------------------------
// One listing photograph, with an honest failure.
//
// Both the feed card and the detail gallery already drew a produce placeholder
// when a listing had *no* photo. Neither handled the photo that is there and
// does not load — a deleted Cloudinary asset, a mistyped URL, a request that
// times out on a weak connection — and `next/image` answers 404 for those, so
// the buyer got the browser's broken-image glyph on the card they are meant to
// judge the produce from. Observed on the live marketplace during the
// 2026-08-23 audit.
//
// This is a client component so it can hear `onError`, and it is deliberately
// only the image: the card around it stays a server component, because the
// marketplace feed is built for low-bandwidth users and hydrating twenty whole
// cards to catch a rare 404 would cost far more than the defect.
// ---------------------------------------------------------------------------

export interface IListingPhotoProps {
  src: string;
  alt: string;
  priority?: boolean | undefined;
  sizes: string;
  className?: string | undefined;
  /** Drawn when there is no photo, or when the photo fails to load. */
  fallback: React.ReactNode;
}

export function ListingPhoto({
  src,
  alt,
  priority,
  sizes,
  className,
  fallback,
}: IListingPhotoProps): React.ReactElement {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback}</>;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority ?? false}
      sizes={sizes}
      {...(className ? { className } : {})}
      onError={() => setFailed(true)}
    />
  );
}
