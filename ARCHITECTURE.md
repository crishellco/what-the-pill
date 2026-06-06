# Architecture: Gemini Pill Identification

All identification modes (imprint, describe, photo) use **Gemini**.

## Overview

```
Frontend (Nuxt) → POST /api/identify
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
     imprint       describe        photo
        │             │             │
        └─────────────┴─────────────┘
                      │
              geminiVision.js
                      │
              matches[] (matchSource: gemini)

Supabase: saved_pills (cabinet), identify_cache (7-day TTL), pharma_terms
Anthropic: /api/interact (drug interactions only)
```

## Configuration

| Env Var | Purpose |
|---------|---------|
| `GEMINI_API_KEY` | Required — all identification |
| `GEMINI_MODEL` | Optional — default `gemini-2.5-flash` |
| `ANTHROPIC_API_KEY` | Optional — interaction checks |
| `NUXT_PUBLIC_SUPABASE_*` | Auth + cabinet + cache |

## Database

```bash
npm run db:push    # saved_pills, identify_cache, pharma_terms
```

Migrations drop the old `pill_reference` catalog if it exists from earlier versions.
