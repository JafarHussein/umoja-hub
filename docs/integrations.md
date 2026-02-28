# UmojaHub — External Integrations

> All 8 external services, their purpose, failure modes, and where to obtain credentials.

---

## Overview

| Service | Used for | Env variable(s) | Free tier |
|---|---|---|---|
| Safaricom Daraja | M-Pesa STK Push payments | `MPESA_*` (5 vars) | Sandbox ✓ |
| Groq | Farm Assistant + AI Mentor | `GROQ_API_KEY` | Yes |
| OpenAI | Brief generation + content moderation | `OPENAI_API_KEY` | No (pay-per-use) |
| GitHub App | Open-source project matching | `GITHUB_APP_*` (3 vars) | Yes |
| OpenWeatherMap | Farmer weather context | `OPEN_WEATHER_MAP_API_KEY` | Yes (1000 calls/day) |
| Cloudinary | Image upload, transform, CDN | `CLOUDINARY_*` (3 vars) | Yes (25 credits/month) |
| SendGrid | Transactional email | `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` | Yes (100/day) |
| Africa's Talking | SMS to farmers | `AFRICASTALKING_API_KEY`, `AFRICASTALKING_USERNAME` | Sandbox ✓ |

---

## 1. Safaricom Daraja (M-Pesa)

**Purpose:** STK Push payment initiation for marketplace orders and group order contributions.

**Implementation:** `src/lib/integrations/darajaService.ts`

**Flow:**
1. `POST /api/orders` calls `initiateStkPush()` with buyer phone and amount
2. Daraja sends STK prompt to buyer's phone
3. On payment completion, Daraja calls `POST /api/webhooks/daraja`
4. Webhook verifies HMAC-SHA256 signature before updating Order status

**Failure mode:** If STK push fails, order is created as `PENDING_PAYMENT` but never transitions. Idempotency check on `mpesaTransactionId` prevents duplicate processing.

**Credentials:**
- Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke/)
- Create an app → get Consumer Key and Consumer Secret
- Use shortcode `174379` and passkey `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919` for sandbox
- `MPESA_CALLBACK_URL` must be publicly accessible (use ngrok in local dev)

```env
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=174379
MPESA_PASSKEY=...
MPESA_CALLBACK_URL=https://your-domain.vercel.app/api/webhooks/daraja
```

---

## 2. Groq API (Llama 3)

**Purpose:**
- **Farm Assistant** (`/api/assistant`): Contextualised farming Q&A with county, crops, weather
- **AI Mentor** (`/api/education/mentor`): Socratic guidance — never writes code

**Implementation:** `src/lib/integrations/groqService.ts`

**Model:** `llama-3.3-70b-versatile` (free tier, ~500ms typical latency)

**Failure mode:** Graceful degradation — returns service unavailable message without crashing the request.

**Credentials:**
- Register at [console.groq.com](https://console.groq.com/)
- Generate API key under "API Keys"

```env
GROQ_API_KEY=gsk_...
```

---

## 3. OpenAI

**Purpose:**
- **Brief generation** (`/api/education/briefs`): Structured JSON project brief using GPT-4o with `response_format: { type: "json_object" }`
- **Content moderation** (`/api/marketplace` POST): `moderateContent()` checks descriptions before DB write. Fail-open — returns `false` on API error so user requests always succeed.

**Implementation:** `src/lib/integrations/openaiService.ts`

**Failure mode:** Moderation fails open (listing is allowed). Brief generation returns `AI_RATE_LIMITED` or `EDUCATION_BRIEF_GENERATION_FAILED` on error.

**Credentials:**
- [platform.openai.com](https://platform.openai.com/) → API keys

```env
OPENAI_API_KEY=sk-...
```

---

## 4. GitHub App

**Purpose:** Discover and match students with real open-source issues tagged `good first issue` or `help wanted`. Repository metadata fetched via Octokit REST API.

**Implementation:** `src/lib/integrations/githubService.ts`

**Rate limits:** 5,000 authenticated requests/hour per installation. Search results cached in MongoDB.

**Setup:**
1. Go to GitHub Settings → Developer settings → GitHub Apps
2. Create a new GitHub App with "Read-only" permissions on Issues and Code
3. Install the app on your org or target repos
4. Download the private key (PEM format)

```env
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
GITHUB_APP_INSTALLATION_ID=78901234
```

---

## 5. OpenWeatherMap

**Purpose:** 7-day county-level weather forecast injected into Farm Assistant system prompt. Displayed on farmer dashboard.

**Implementation:** `src/lib/integrations/weatherService.ts`

**API call:** `GET /data/2.5/forecast?q={county},KE&appid={key}&units=metric&cnt=7`

**Failure mode:** Returns empty weather context. Farm Assistant still works without it.

**Credentials:**
- Register at [openweathermap.org](https://openweathermap.org/api) → free tier (1,000 calls/day)

```env
OPEN_WEATHER_MAP_API_KEY=...
```

---

## 6. Cloudinary

**Purpose:** Image upload for marketplace listings and farmer verification documents. Auto-converts to WebP, serves via CDN.

**Implementation:** `src/lib/integrations/cloudinaryService.ts`

**Validation before upload:**
- MIME type must be `image/jpeg`, `image/png`, or `image/webp`
- Max size: 5MB
- Returns error code `EXT_CLOUDINARY_INVALID_TYPE` or `EXT_CLOUDINARY_FILE_TOO_LARGE`

**Setup:**
- Register at [cloudinary.com](https://cloudinary.com/)
- Dashboard → Settings → Access Keys

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 7. SendGrid

**Purpose:** Transactional emails:
- Farmer verification approved/rejected notification
- Order confirmed email to buyer
- Lecturer review notification

**Implementation:** `src/lib/integrations/smsService.ts` (combined with AT notifications)

**Failure mode:** Email failure is logged but does not fail the API request. SMS is the primary notification channel for farmers.

**Credentials:**
- Register at [sendgrid.com](https://sendgrid.com/) → free tier (100/day)
- Verify sender domain/email

```env
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@umojahub.co.ke
```

---

## 8. Africa's Talking

**Purpose:** SMS notifications to farmers (primary communication channel):
- Farmer verification approved/rejected
- Order confirmed by buyer
- Price alert triggered
- Group order deadline reminder

**Implementation:** `src/lib/integrations/smsService.ts`

**Why Africa's Talking over Twilio:** Better Kenyan network routing, lower per-SMS cost on Safaricom/Airtel, local company with Kenyan support.

**Failure mode:** Returns `EXT_SMS_FAILED` error code. SMS failure never fails the primary request.

**Credentials:**
- Register at [africastalking.com](https://africastalking.com/)
- Sandbox username: `sandbox`, API key from sandbox settings
- Production: register, verify identity, add airtime credit

```env
AFRICASTALKING_API_KEY=...
AFRICASTALKING_USERNAME=sandbox   # or your production username
```

---

## Cron Secret

All cron job routes (`/api/cron/*`) validate the `Authorization: Bearer {CRON_SECRET}` header before executing. Set in Vercel as an environment variable and in the Vercel Cron Job configuration.

```env
CRON_SECRET=your_random_256bit_secret
```

---

## Testing with Mocked Services

In Jest unit tests, all external services are mocked:
```typescript
jest.mock('@/lib/integrations/openaiService', () => ({
  moderateContent: jest.fn().mockResolvedValue(false),
  generateBrief: jest.fn(),
}));
```

In Playwright E2E tests, network interception is used:
```typescript
await page.route('**/api/orders', async (route) => {
  await route.fulfill({ status: 201, body: JSON.stringify({ data: { orderId: 'test' } }) });
});
```

Never use real API keys in tests. Never commit API keys to the repository.
