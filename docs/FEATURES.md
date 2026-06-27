# Feature Breakdown — SocialSell AI

> Status key: 🔴 Not Started · 🟡 In Progress · 🟢 Done

---

## Feature 1: Business Profile Setup
**Priority:** P0 (everything else depends on this)
**Complexity:** Low

### What it does
User sets up their business once. All AI calls are seeded with this data.

### Fields
- `name` — business name
- `niche` — e.g. "women's fashion", "home decor", "food delivery"
- `products` — list of products/services with prices
- `tone` — e.g. "playful", "professional", "bold"
- `target_audience` — e.g. "women 18-35 in Mumbai"
- `cta_style` — preferred CTA ("DM to order", "Comment PRICE", "Link in bio")

### Implementation
- `GET/PUT /api/profile`
- PostgreSQL: `businesses` table
- React form with live preview

**Status:** 🔴 Not Started

---

## Feature 2: AI Content Generator
**Priority:** P0
**Complexity:** Medium

### What it does
User provides a brief or uploads an asset → AI generates a ready-to-post caption for Instagram, Facebook, and LinkedIn.

### Input
- Text prompt OR asset upload (image/video)
- Target platform(s)
- Optional: override tone

### Output (per platform)
- Caption (platform-length-appropriate)
- Hashtags (trending + niche)
- CTA
- Post timing recommendation

### Implementation
- `POST /api/content/generate`
- Gemini API: system prompt seeded with business profile
- Multimodal: pass image/video URL to Gemini for visual context
- Frontend: prompt input + asset uploader + tabbed preview (Insta / FB / LinkedIn)

**Status:** 🔴 Not Started

---

## Feature 3: Trend Intelligence
**Priority:** P1
**Complexity:** High

### What it does
Surfaces trending audio, content formats, and engagement mechanics relevant to the business niche.

### Data Sources
- Instagram Reels trending sounds (scraped or via unofficial APIs)
- Viral content format patterns extracted by Gemini from web data

### Implementation
- Cron job (daily): fetch raw trend signals
- Gemini: extract + match to business niche
- Redis cache: store results (TTL 24h)
- `GET /api/trends/matched`
- Frontend: "Trending Now" card with suggested post idea

**Status:** 🔴 Not Started

---

## Feature 4: Content Calendar & Scheduler
**Priority:** P1
**Complexity:** Medium

### What it does
Visual calendar of scheduled posts. AI detects 7-day gaps and proactively suggests content.

### Implementation
- PostgreSQL: `posts` table with `scheduled_at`, `status`, `platform`
- BullMQ job: fires at scheduled time, calls Publisher
- Gap detection: cron every 12h, checks if any day in next 7 is empty
- `GET /api/schedule`
- Frontend: weekly calendar grid with drag-to-reschedule

**Status:** 🔴 Not Started

---

## Feature 5: One-Tap Publisher
**Priority:** P0
**Complexity:** High

### What it does
Publish to Instagram, Facebook, and LinkedIn from one action.

### Implementation
- `POST /api/publish`
- Meta Graph API: `/{ig-user-id}/media` + `/{ig-user-id}/media_publish`
- Facebook: `/{page-id}/feed`
- LinkedIn: `POST /v2/ugcPosts`
- OAuth tokens stored per user per platform
- Format adapter: trims caption length, adjusts hashtag count per platform

**Status:** 🔴 Not Started

---

## Feature 6: AI Sales Bot
**Priority:** P0 (hackathon core feature)
**Complexity:** High

### What it does
Monitors every comment and DM on published posts. Classifies intent, responds immediately, escalates hot leads.

### Intent Categories
| Intent | Example Trigger | Bot Action |
|---|---|---|
| Price inquiry | "how much?", "price?" | Reply with product price + order link |
| Availability | "is this available?" | Confirm + guide to purchase |
| Location/shipping | "do you ship to Delhi?" | Answer + soft CTA |
| Buying signal | "I want this" | Send payment/order link |
| FAQ | "what material is this?" | Pull from business profile |
| Unrecognized | anything else | Warm reply + hand to human |

### Implementation
- Meta Webhooks: `POST /webhooks/meta` receives comment/DM events
- Gemini: intent classification + response generation seeded with business profile
- `POST /{object}/comments` or `POST /me/messages` to reply
- Lead scoring: conversations above threshold → push to `leads` table → notify owner
- Frontend: live lead inbox

**Status:** 🔴 Not Started

---

## Feature 7: Unified Analytics Dashboard
**Priority:** P1
**Complexity:** Medium

### What it does
Single view of all platform performance + sales funnel.

### Metrics
- Reach, impressions, engagement (per platform + combined)
- Funnel: Views → Comments/DMs → Bot Conversations → Conversions
- Revenue attribution: which post → how many leads → how many sales
- AI insight card: "Your Reels get 3x more DMs than static posts"

### Implementation
- `GET /api/analytics/dashboard`
- Meta Insights API + LinkedIn Analytics API polling (hourly)
- PostgreSQL: `analytics_snapshots` table
- Frontend: chart library (Recharts), funnel visualization

**Status:** 🔴 Not Started

---

## Build Order (Recommended)

```
Week 1 (Now → July 4):
Day 1-2: Business Profile + Content Generator (P0 core, demoable)
Day 3-4: Sales Bot + Meta Webhooks (hackathon's main feature)
Day 5:   Publisher + OAuth connect flow
Day 6:   Analytics + Calendar (visible polish)
Day 7:   UI polish + demo prep
```
