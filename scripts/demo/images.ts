// Image-URL builders. There is no image upload at seed time; images are plain
// URL strings on User.profilePhotoUrl and MarketplaceListing.imageUrls. We use
// deterministic, keyless public sources so a run is reproducible:
//   - faces:   randomuser.me gendered, indexed portraits (stable real photos)
//   - produce: a curated Unsplash set, hand-verified per crop (see below)
//
// WHY THE PRODUCE SET IS PINNED RATHER THAN SEARCHED
//
// This module used to build loremflickr keyword URLs — `carrots,vegetable` — and
// let the host resolve them at request time. That is a keyword match against
// photo tags, not a match against the subject, and it changes under you: a
// listing titled "Fresh Carrots" rendered a ceramic plate. A marketplace whose
// photographs do not show the produce on sale is not credible, and no amount of
// query tuning fixes a source that can return something different tomorrow.
//
// Every id below was pulled from the Unsplash Search API using agricultural
// queries ("tomato harvest", "potato harvest", "milk can dairy" — not "carrot"),
// then REVIEWED BY EYE against the crop it is filed under. Each one shows that
// produce at harvest, in the field, or at market, and each was checked for the
// things that break the illusion: plated food, studio styling on seamless
// backdrops, kitchen worktops, visible brands, watermarks and legible signage.
// Candidates that failed were discarded rather than tidied — roughly a third of
// what the searches returned. Pinning the survivors makes a run reproducible and
// makes that audit permanent instead of something that has to be redone.
//
// WHY THEY ARE VENDORED INTO public/ RATHER THAN HOT-LINKED
//
// The first version of this pointed `imageUrls` at images.unsplash.com and let
// next/image proxy the CDN. Every card came back blank: the optimiser's upstream
// fetch timed out and returned 500 for all 43 images, even though the same URLs
// fetched fine directly. Whatever the cause on a given machine, the shape of the
// dependency is wrong for what this data is for — a demo that renders an empty
// grid because a third-party CDN is slow, rate-limited or unreachable from the
// venue's network is a worse failure than the mismatched photographs this whole
// audit set out to fix. next/image also fails hard rather than degrading, so
// there is no graceful fallback to rely on.
//
// The audited set therefore lives in the repository at public/images/produce/,
// downsized to card dimensions (1200x800, ~5 MB for all 43). The demo now
// renders identically offline, and the photographs cannot change under us.
// They are used under the Unsplash License, which permits exactly this.

import type { SeedCropId } from './dictionaries';

// 0..99 portraits available per gender.
export function faceUrl(gender: 'm' | 'f', index: number): string {
  const bucket = gender === 'f' ? 'women' : 'men';
  return `https://randomuser.me/api/portraits/${bucket}/${index % 100}.jpg`;
}

// Typed against SeedCropId, so adding produce to the catalogue without first
// auditing photographs for it is a compile error rather than a broken card.
const CROP_PHOTOS: Readonly<Record<SeedCropId, readonly string[]>> = {
  // Loose red tomatoes in bulk, a filled crate, and vine tomatoes at market.
  tomatoes: ['photo-1671528443617-26b1ecebb66f', 'photo-1561136594-7f68413baa99', 'photo-1524593166156-312f362cada0'],
  // Cured brown bulbs, red onions in a wooden crate, red onions in bulk.
  onions: ['photo-1580201092675-a0a6a6cafbb1', 'photo-1605197378298-02bf0af1c896', 'photo-1508747703725-719777637510'],
  // Graded ware potatoes, freshly lifted and still soiled, and a bulk heap.
  potatoes: ['photo-1675501344642-92d35d90fe51', 'photo-1644439017477-befade11bd83', 'photo-1599403417231-8387b0a3b7ad'],
  // Topped carrots in bulk, a full field crate, and a handful lifted from soil.
  carrots: ['photo-1601493700750-58796129ebb5', 'photo-1582515073490-39981397c445', 'photo-1532509774891-141d37f25ae9'],
  // Heads stacked in a market crate, cut heads in bulk, and a picker carrying
  // filled baskets off a hillside plot. The wide terraced-field shots the first
  // pass chose were rejected on review: at card size the cabbages were scenery.
  cabbages: ['photo-1652860213441-6622f9fec77f', 'photo-1668120082831-e83f387e3461', 'photo-1766409162993-6f054b7fe9c1'],
  // Cut curly leaf, kale being picked by hand, and a close leaf.
  kale: ['photo-1586288415925-d7affaf2d1f0', 'photo-1598764741840-154c420a4512', 'photo-1697422835421-1229b80e9b76'],
  // Picked green beans in bulk, sorted dark green pods, and a filled bowl.
  'french-beans': ['photo-1574963835594-61eede2070dc', 'photo-1508900173264-bb171fa617e4', 'photo-1658851038497-9cc26199ffb8'],
  // Mixed peppers in bulk, capsicum on the plant, and sorted red fruit.
  capsicum: ['photo-1601648764658-cf37e8c89b70', 'photo-1604488943825-f95dc6796ca5', 'photo-1614260025937-b4ecb6eb9165'],
  // Shelled dry grain, dried cobs in a heap, and clean winnowed grain.
  maize: ['photo-1623066798929-946425dbe1b0', 'photo-1559631526-5716df3cfacd', 'photo-1553518422-04336627b33e'],
  // Mixed dry beans, rosecoco-type grain, and an open bean sack.
  beans: ['photo-1564894809611-1742fc40ed80', 'photo-1513868853742-e7fb786265db', 'photo-1646552807870-680e775c27b8'],
  // Cleaned mung grain and a filled bowl. Two, not three: the only other
  // candidate was a stall of assorted pulses in which the green grams were one
  // bowl among four, which is a picture of a pulse market, not of this crop.
  'green-grams': ['photo-1594900799266-0e56587ba586', 'photo-1674640993154-264a42e636c6'],
  // Grain being winnowed by hand, and a filled winnowing tray. The third
  // candidate — sacks on a market floor — carried a legible variety tag in a
  // foreign script, which places the photograph somewhere Mwea is not.
  rice: ['photo-1711060221380-acfa2c82cc99', 'photo-1711060266983-92bd378c850c'],
  // A picker carrying a harvest basket through the orchard, a filled basket,
  // and green fruit in bulk.
  avocados: ['photo-1550825488-17306e3f30c2', 'photo-1691657915865-d7b9a6a54e6f', 'photo-1583029901628-8039767c7ad0'],
  // Bunches bulked at market, a bunch still on the plant, and ripe fruit in bulk.
  bananas: ['photo-1668968554885-c08ad72c2133', 'photo-1528279335935-f486951a6adf', 'photo-1668762924684-a9753a0a887c'],
  // Aluminium milk cans, a Friesian herd at grass, and cows at close range.
  dairy: ['photo-1596793393770-82081fca1471', 'photo-1580570598977-4b2412d01bbc', 'photo-1594731884638-8197c3102d1d'],
};

/**
 * Every audited photograph of `cropId`, as app-relative paths.
 *
 * The Unsplash id each file came from is recorded in CROP_PHOTOS above so the
 * provenance of any image can still be traced back and re-downloaded.
 */
export function cropImageUrls(cropId: SeedCropId): string[] {
  return CROP_PHOTOS[cropId].map((_, i) => `/images/produce/${cropId}-${i + 1}.jpg`);
}

/** A verified photograph of `cropId`. `index` selects between them, stably. */
export function cropImageUrl(cropId: SeedCropId, index: number): string {
  const urls = cropImageUrls(cropId);
  return urls[Math.abs(index) % urls.length] as string;
}
