// Image-URL builders. There is no Unsplash integration in the platform; images
// are plain URL strings on User.profilePhotoUrl and MarketplaceListing.imageUrls.
// We use deterministic, keyless public image sources so a run is reproducible:
//   - faces: randomuser.me gendered, indexed portraits (stable real photos)
//   - produce: loremflickr keyword images, locked by an index for stability
// The UI degrades gracefully when an image fails to load, so these are
// best-effort enrichment, not a hard dependency.

// 0..99 portraits available per gender.
export function faceUrl(gender: 'm' | 'f', index: number): string {
  const bucket = gender === 'f' ? 'women' : 'men';
  return `https://randomuser.me/api/portraits/${bucket}/${index % 100}.jpg`;
}

const CROP_KEYWORDS: Record<string, string> = {
  tomatoes: 'tomatoes,farm',
  maize: 'maize,corn',
  potatoes: 'potatoes,harvest',
  kale: 'kale,greens',
  onions: 'onions,market',
  cabbage: 'cabbage,vegetable',
  beans: 'green-beans,vegetable',
  avocado: 'avocado,fruit',
  banana: 'bananas,fruit',
  carrots: 'carrots,vegetable',
  grains: 'grains,legumes',
  milk: 'milk,dairy',
};

export function cropImageUrl(imageKey: string, lock: number): string {
  const kw = CROP_KEYWORDS[imageKey] ?? 'vegetables,farm';
  return `https://loremflickr.com/600/400/${kw}?lock=${lock}`;
}
