# SocialSell AI — Architecture Overview

## System Design

SocialSell AI is composed of **5 core subsystems** that work in a closed loop:

```
[Business Profile] → [Content Generator] → [Publisher] → [Sales Bot] → [Analytics]
                              ↑
                      [Trend Intelligence]
```

---

## Subsystems

### 1. Business Profile Store
- Stores brand config: name, niche, tone, products, pricing, target audience
- Asset library: logos, images, videos
- All AI calls are seeded with this profile for on-brand output
- **DB:** PostgreSQL (`businesses`, `assets` tables)

### 2. AI Content Generator
- Input: user prompt or asset upload
- Output: platform-native post (caption + hashtags + CTA) for Instagram / Facebook / LinkedIn
- Model: **Gemini API** (gemini-2.0-flash)
- Endpoint: `POST /api/content/generate`

### 3. Trend Intelligence Engine
- Scrapes / polls trending audio, formats, and engagement mechanics
- Runs on a cron job (daily)
- Matches trends to the business niche using Gemini
- Stores matched trends in Redis cache (TTL: 24h)
- Endpoint: `GET /api/trends/matched`

### 4. Proactive Scheduling Engine
- Scans content calendar for gaps in the next 7 days
- Triggers trend fetch + auto-suggestion if gap detected
- Pushes notification to user
- Job queue: **Redis + BullMQ**
- Cron: every 12 hours

### 5. One-Tap Publisher
- Publishes to Meta Graph API (Instagram + Facebook) and LinkedIn API
- Adapts format per platform (caption length, image specs, hashtag rules)
- Endpoint: `POST /api/publish`

### 6. AI Sales Bot
- Monitors incoming DMs and comments via **Meta Webhooks**
- Intent classification via Gemini (price inquiry / availability / buy signal / FAQ)
- Responds within seconds using pre-built conversation flows
- Escalates hot leads to human owner
- Endpoint (webhook): `POST /webhooks/meta`

### 7. Unified Analytics Dashboard
- Aggregates: Meta Insights API + LinkedIn Analytics API
- Tracks: Reach → Inquiries → Conversations → Conversions
- Revenue attribution per post
- Endpoint: `GET /api/analytics/dashboard`

---

## Data Flow: Post-to-Sale Loop

```
1. User uploads asset or writes brief
2. Gemini generates platform-specific post
3. User reviews → schedules or publishes immediately
4. Publisher hits Meta Graph API / LinkedIn API
5. Meta Webhook fires on every comment/DM
6. Sales Bot receives event → classifies intent → responds
7. Hot lead? → Owner notified
8. Analytics updated with engagement + conversion data
```

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| AI Engine | Gemini API (gemini-2.0-flash) | Content gen, trend parsing, bot conversations |
| Publishing | Meta Graph API, LinkedIn API | OAuth2 per platform |
| Bot Triggers | Meta Webhooks | Real-time comment/DM events |
| Trend Intel | Web scraping + Gemini extraction | Cron-based, Redis cached |
| Backend | Node.js + Express | REST API |
| Frontend | React + Vite | Dashboard UI |
| Auth | OAuth2 (Meta, LinkedIn) + JWT (app sessions) | |
| Database | PostgreSQL | Users, posts, analytics, leads |
| Queue | Redis + BullMQ | Scheduling jobs, webhook processing |

---

## Environment Variables

```env
# Gemini
GEMINI_API_KEY=

# Meta
META_APP_ID=
META_APP_SECRET=
META_WEBHOOK_VERIFY_TOKEN=

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# App
JWT_SECRET=
PORT=3001
CLIENT_URL=http://localhost:5173
```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/connect/:platform` | OAuth connect (meta / linkedin) |
| GET | `/api/profile` | Get business profile |
| PUT | `/api/profile` | Update business profile |
| POST | `/api/content/generate` | Generate post content |
| GET | `/api/content/drafts` | List drafts |
| POST | `/api/publish` | Publish post |
| GET | `/api/trends/matched` | Get matched trends for business |
| GET | `/api/schedule` | Get content calendar |
| GET | `/api/analytics/dashboard` | Unified analytics |
| GET | `/api/leads` | List qualified leads |
| POST | `/webhooks/meta` | Meta Webhook receiver |
