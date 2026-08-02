// Curated Knowledge Hub articles — real Kenyan agricultural guidance sourced from
// KEBS, KALRO, the Pest Control Products Board and the Ministry of Agriculture.
// Hand-written reference content, carried over verbatim from the retired
// scripts/seed.ts. This is the Knowledge Hub's entire library: it is authored,
// not generated, so it lives as data rather than coming out of the RNG.

import type mongoose from 'mongoose';
import { KnowledgeCategory } from '../../../src/types';

export function knowledgeArticles(
  adminId: mongoose.Types.ObjectId,
  publishedAt: Date
): Record<string, unknown>[] {
  return [
    {
      slug: 'identify-genuine-can-fertilizer',
      title: 'How to Identify Genuine CAN Fertilizer Before You Buy',
      category: KnowledgeCategory.FERTILIZER_VERIFICATION,
      sourceInstitution: 'KEBS',
      sourceUrl: 'https://www.kebs.org/index.php/services/standards/fertilizer-standards',
      cropTags: ['maize', 'wheat', 'potatoes', 'vegetables'],
      summary:
        'Counterfeit Calcium Ammonium Nitrate (CAN) fertilizer is a documented problem in Kenya. This guide explains the KEBS-certified verification steps any farmer can perform before purchase to protect their investment and crops.',
      content: `## Why Counterfeit CAN Fertilizer Is a Crisis

  Every planting season, Kenyan farmers lose millions of shillings to counterfeit Calcium Ammonium Nitrate (CAN) fertilizer. In genuine CAN, the nitrogen content is 26%. In counterfeits, the content may be 0%. Your crops will germinate but fail to yield.

  ## The KEBS Certification Mark

  Genuine CAN manufactured or imported into Kenya must carry the KEBS Diamond Mark (the Kenya Standard Mark). This is a diamond-shaped symbol with the letters "KS" inside and a certification number.

  **What to look for on the bag:**
  - Diamond Mark printed clearly on the packaging
  - Batch number and manufacturer details
  - Net weight and nitrogen percentage (26% N)
  - KEBS approval reference number

  ## Field Test — The Water Test

  1. Fill a clean glass with water
  2. Add a tablespoon of the fertilizer granules
  3. Stir and observe

  **Genuine CAN:** Dissolves slowly with a slight fizzing. Water becomes slightly milky.
  **Counterfeit/diluted:** Dissolves immediately and completely without reaction, or leaves a heavy residue that doesn't dissolve.

  ## The Touch Test

  Genuine CAN granules are:
  - Slightly rough to the touch
  - Off-white to beige in colour
  - Similar in size (uniform granulation)

  Counterfeit products often use ground limestone or rock salt as filler. These feel powdery rather than granular and may smell different.

  ## Buying from Verified Suppliers

  The safest way to avoid counterfeit inputs is to purchase only from KEBS-licensed agro-dealers. UmojaHub maintains a verified supplier directory — use it before every purchase.

  ## What to Do If You Suspect Counterfeit

  Report immediately to KEBS Consumer Affairs: 0722 201 211, or to the nearest KEBS regional office. Take photographs of the bag including the Diamond Mark (or lack thereof). Your report protects other farmers.`,
      isPublished: true,
      publishedAt,
      createdBy: adminId,
    },
    {
      slug: 'long-rains-planting-calendar-2024',
      title: 'Long Rains Planting Calendar 2024: What to Plant and When by County',
      category: KnowledgeCategory.SEASONAL_CALENDAR,
      sourceInstitution: 'KALRO',
      sourceUrl: 'https://www.kalro.org/crop-farming/seasonal-calendar',
      cropTags: ['maize', 'beans', 'tomatoes', 'potatoes', 'kale'],
      summary:
        'KALRO county-by-county planting recommendations for the long rains season. Includes optimal planting windows, spacing recommendations, and early warning signs of seasonal stress for the major Kenyan food crops.',
      content: `## Long Rains 2024 — Season Overview

  The long rains season (March–May) is Kenya's primary agricultural season, accounting for approximately 60% of annual food production. KALRO's 2024 county-specific advisories reflect updated variety recommendations and adjusted planting windows based on shifting rainfall patterns.

  ## Planting Windows by Zone

  ### Central Highlands (Kiambu, Murang'a, Nyeri, Kirinyaga)
  - **Onset:** 3rd week of March
  - **Maize:** Plant by April 5th for full season. Use H614D or DH04.
  - **Beans:** Rose coco, plant late March. Spacing 30cm × 60cm.
  - **Potatoes:** Shangi or Tigoni, plant early April in well-drained soils.

  ### Rift Valley (Nakuru, Nyandarua, Laikipia, Uasin Gishu)
  - **Onset:** 1st week of April
  - **Maize:** H614D recommended. Plant April 1–15 window.
  - **Wheat:** Fahari variety, plant same window.
  - **Potatoes:** Excellent zone. Nyandarua highlands — target 2nd week of April.

  ### Western Kenya (Kakamega, Bungoma, Trans Nzoia)
  - **Onset:** 2nd week of March
  - **Maize:** H614D, H629 recommended. Long-season varieties perform well.
  - **Beans:** High potential area. Multiple planting windows available.

  ### Nyanza (Kisumu, Siaya, Homa Bay, Migori)
  - **Onset:** 2nd week of March
  - **Maize:** DH04, H614D recommended for wet lowlands.
  - **Sorghum:** Strongly recommended for areas with bimodal stress (flood/drought cycling).
  - **Sweet Potatoes:** Orange-fleshed varieties in program areas.

  ## Early Season Warning Signs

  Watch for these indicators that your season may be stressed:

  1. **Staggered germination** (>30% variation in emergence timing) — may indicate seed quality issue or uneven soil moisture
  2. **Yellowing in V3 stage** — check nitrogen availability; may need top-dressing
  3. **Insect pressure in first 2 weeks** — armyworm is highest risk during this period; scout daily

  ## KALRO Advisory Lines

  For county-specific advisories: 0800 720 222 (toll-free)`,
      isPublished: true,
      publishedAt,
      createdBy: adminId,
    },
    {
      slug: 'spot-counterfeit-veterinary-drugs',
      title: 'Protecting Your Livestock: How to Spot Counterfeit Veterinary Drugs',
      category: KnowledgeCategory.ANIMAL_HEALTH,
      sourceInstitution: 'Kenya Veterinary Board',
      sourceUrl: 'https://www.kvb.go.ke/',
      cropTags: ['dairy cows', 'goats', 'poultry'],
      summary:
        "Counterfeit veterinary drugs cause livestock deaths and economic loss for Kenyan farmers every year. This article explains how to verify a drug's authenticity, what to look for on packaging, and how to report suspected fakes to the Kenya Veterinary Board.",
      content: `## The Scale of the Problem

  Kenya Veterinary Board investigations have identified counterfeit veterinary drugs in markets across 18 counties. The most commonly counterfeited products are: broad-spectrum antibiotics (oxytetracycline, penicillin), dewormers (albendazole, levamisole), and acaricides (amitraz-based tick treatments).

  ## The KVB Registration Mark

  Every veterinary drug sold legally in Kenya must be registered with the Kenya Veterinary Board (KVB). Look for:

  - **KVB Registration Number** printed on the label (format: KVB/VDR/XXXX/XXXX)
  - **Batch number and expiry date** — clearly printed, not handwritten
  - **Manufacturer and importer details** — with physical address
  - **Storage instructions** — cold-chain products should be refrigerated upon receipt

  ## How to Verify Registration

  Visit kvb.go.ke or call +254 020 2731028 to verify a KVB registration number before purchase. This takes 2 minutes and can save your herd.

  ## Packaging Red Flags

  **Reject immediately if you see:**
  - Blurry or smudged printing on the label
  - Inconsistent font sizes or colours across the label
  - Batch numbers or expiry dates that appear to be stickers placed over original text
  - Spelling errors in the drug name or instructions
  - Vials that have been resealed (broken then re-crimped aluminium caps)
  - Injections that are discoloured, cloudy, or have visible particles

  ## After Treatment — What to Watch For

  If you administer a drug and the animal shows no improvement within the expected clinical window (24–72 hours for bacterial infections), or worsens rapidly, suspect substandard medication. Document this and report to KVB.

  ## Reporting Counterfeit Products

  KVB Complaints Line: +254 020 2731028
  Email: info@kvb.go.ke
  You may also report to the Kenya Anti-Counterfeit Agency (ACA): +254 020 6950000`,
      isPublished: true,
      publishedAt,
      createdBy: adminId,
    },
    {
      slug: 'reducing-post-harvest-tomato-losses',
      title: 'Reducing Post-Harvest Tomato Losses: Storage, Handling, and Timing',
      category: KnowledgeCategory.POST_HARVEST,
      sourceInstitution: 'FAO Kenya',
      sourceUrl: 'https://www.fao.org/kenya/en/',
      cropTags: ['tomatoes', 'capsicum'],
      summary:
        'Post-harvest losses account for up to 40% of tomato production in Kenya. This guide covers the critical handling decisions made in the 24 hours after harvest that determine whether a farmer captures full value or loses their crop to spoilage.',
      content: `## Understanding the 40% Loss Problem

  FAO Kenya estimates that 30–40% of fresh tomatoes grown in Kenya are lost before reaching the consumer. Most of this loss occurs in the first 48 hours after harvest — during handling, transport, and storage. This is not inevitable.

  ## Harvest Timing Is Everything

  Tomatoes harvested at the correct maturity stage last significantly longer:

  - **Breaker stage** (first signs of colour change): 7–10 days shelf life at ambient temperature
  - **Pink stage** (25–75% colour change): 4–6 days shelf life
  - **Red ripe stage** (fully coloured): 1–3 days shelf life

  For transport to Nairobi or Mombasa, harvest at breaker or turning stage. For local market same-day, harvest at pink or early red.

  ## The Handling Chain

  ### At Harvest
  - Harvest in the early morning when temperatures are lowest
  - Use clean, dry harvesting containers — no metal buckets
  - Place fruit gently — no dropping or throwing into containers
  - Remove and dispose of damaged, diseased, and pest-affected fruit at harvest

  ### At Packing
  - Sort by size and maturity before packing
  - Use wooden crates or ventilated plastic crates lined with clean paper
  - Do not pack more than 15kg per crate — deep stacking crushes lower layers
  - Leave 3–5cm of airspace at the top of each crate for ventilation

  ### At Storage
  - Store in a well-ventilated, shaded space (never in direct sunlight)
  - Target temperature: 12–15°C if possible (cool room, shade structure, or elevated floor)
  - Separate tomatoes from onions and garlic — ethylene from tomatoes accelerates onion sprouting

  ## The Platform Advantage

  Listing your tomatoes on UmojaHub at breaker stage, before they are fully ripe, allows you to sell at full price to buyers who want to transport them. Waiting until they are red risks losses if they are not sold within 48 hours.`,
      isPublished: true,
      publishedAt,
      createdBy: adminId,
    },
    {
      slug: 'when-to-sell-your-maize',
      title: "When to Sell Your Maize: Understanding Kenya's Seasonal Price Cycle",
      category: KnowledgeCategory.MARKET_DYNAMICS,
      sourceInstitution: 'Kenya Markets Trust',
      sourceUrl: 'https://kenyamarketstrust.org/',
      cropTags: ['maize', 'beans'],
      summary:
        "Maize prices in Kenya follow a predictable seasonal cycle driven by harvest timing and post-harvest glut. This analysis of 5 years of Wakulima Market data shows farmers the optimal holding periods and the price recovery windows that make the difference between profit and loss.",
      content: `## The Seasonal Price Pattern

  Kenya's maize price follows a predictable annual cycle that most farmers know but many do not have the data to navigate precisely. Understanding this cycle is the difference between selling at 2,800 KES/bag and selling at 4,500 KES/bag — from the same harvest.

  ## The Harvest Glut (April–June)

  When the long rains harvest comes in (typically May–June for Rift Valley, June–July for Central), prices fall sharply. In the Wakulima Market Nairobi data from 2019–2023:

  - Average price at harvest season: **3,100–3,400 KES per 90kg bag**
  - Lowest point: typically 2,600–2,900 KES per 90kg bag (July–August for Rift Valley harvest)
  - Duration of low prices: 8–12 weeks

  Farmers who sell immediately at harvest lock in these low prices. Farmers who can store and wait recover significantly.

  ## The Price Recovery Window

  From September onward, as post-harvest stocks are consumed, prices recover:

  - **September–October:** 3,600–4,000 KES per bag (early recovery)
  - **November–December:** 4,200–4,600 KES per bag (peak season)
  - **January–February:** 4,400–5,000 KES per bag (planting season, low stocks)

  The premium for holding 4–6 months is typically **40–60% over harvest price**.

  ## The Break-Even Calculation

  Before deciding to hold, calculate your break-even:

  **Storage costs include:**
  - Certified grain store rental: ~150 KES/bag/month (or opportunity cost of your own store)
  - Grain protectant (Actellic Super): ~30 KES/bag applied at storage
  - Moisture loss: ~1% per month

  For a 4-month hold: storage cost ≈ 650 KES/bag. This means you need the price to rise by at least 650 KES/bag to break even.

  ## Using the UmojaHub Price Alert

  Set a UmojaHub Price Alert for your target sell price. When the Nairobi benchmark crosses your threshold, you will receive an SMS and can list immediately on the marketplace while prices are favourable.`,
      isPublished: true,
      publishedAt,
      createdBy: adminId,
    },
  ];
}
