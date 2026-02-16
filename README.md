# Living Resume API

**Turn your professional profile into a machine-readable API in 10 minutes.**

Instead of submitting PDFs into black-hole applicant tracking systems, broadcast structured career data that recruiters, AI agents, and intelligence systems can query directly.

Your Living Resume API runs free on Cloudflare Workers — 9 endpoints, always on, zero monthly cost.

---

## 👉 You're Here — Two Commands to Go Live

> **Coming from the [step-by-step walkthrough](https://living-resume-api.netlify.app)?** Great — you've already created your copy and opened this Codespace. You're at **Step 4**. The terminal at the bottom of the screen is ready.

### Step 1: Build your profile

```bash
bun run start
```

The interactive wizard walks you through each section — name, title, professional story, accomplishments, experience, skills. You can complete the whole thing in the wizard, or **break out at any checkpoint** and edit `TEMPLATE.md` directly in the sidebar.

### Step 2: Deploy your API

```bash
bun run deploy
```

This single command handles everything:
- **First time?** It walks you through connecting your free Cloudflare account (you'll paste an API token — [instructions appear inline](https://living-resume-api.netlify.app/#walkthrough))
- Parses your `TEMPLATE.md` into structured JSON
- Deploys to Cloudflare Workers
- Verifies all endpoints are live

When it finishes, you'll see your live URL:

```
🎉 Your Living Resume API is live!
   https://living-resume-your-name.workers.dev
```

**That's it. Share the URL.**

---

## What You Get

Your Living Resume API serves 9 structured endpoints:

| Endpoint | What It Returns |
|----------|----------------|
| `GET /` | API directory — lists all available endpoints |
| `GET /about` | Name, title, thesis, what you offer |
| `GET /narrative` | Your career story and philosophy |
| `GET /thesis` | Core professional thesis and implications |
| `GET /accomplishments` | Quantified results with dollar figures |
| `GET /track-record` | Headline stats with context |
| `GET /experience` | Role history with specific contributions |
| `GET /seeking` | Target roles, org types, industry |
| `GET /cultural-fit` | Where you thrive and where you don't |
| `GET /skills` | Methodologies, technical skills, domain expertise |

Example response (`GET /about`):

```json
{
  "meta": {
    "api_version": "1.0.0",
    "last_updated": "2026-02-16",
    "endpoint": "/about"
  },
  "data": {
    "name": "Jane Smith",
    "title": "VP, Workforce Transformation",
    "core_thesis": "Organizations don't have to choose between cost efficiency and customer experience.",
    "what_i_offer": [
      {
        "title": "Workforce Transformation",
        "description": "Modernize legacy systems from reactive scheduling to AI-driven operations"
      }
    ]
  }
}
```

---

## All Commands

| Command | What It Does |
|---------|-------------|
| `bun run start` | Launch the interactive profile wizard |
| `bun run deploy` | Full pipeline: setup + parse + deploy + verify |
| `bun run preview` | Start a local dev server to test your API |
| `bun run build` | Parse `TEMPLATE.md` into JSON (without deploying) |
| `bun run setup` | Connect Cloudflare account (deploy does this automatically) |
| `bun run verify` | Check that all live endpoints are responding |

---

## Editing Your Profile Directly

Prefer markdown over the wizard? Edit `TEMPLATE.md` in the sidebar. Each section maps to an API endpoint:

- `## About` → `/about`
- `## Narrative` → `/narrative`
- `## Thesis` → `/thesis`
- `## Accomplishments` → `/accomplishments`
- `## Track Record` → `/track-record`
- `## Experience` → `/experience`
- `## Seeking` → `/seeking`
- `## Cultural Fit` → `/cultural-fit`
- `## Skills` → `/skills`

Follow the field labels exactly (e.g., `**Name:**`, `**Title:**`). The parser reads these markers.

After editing, just run `bun run deploy`.

---

## Updating Your API

Changed jobs? Got a new certification? Just:

1. Edit `TEMPLATE.md` (or re-run `bun run start`)
2. Run `bun run deploy`

That's it. Your API updates in seconds.

---

## Cloudflare Setup (for reference)

`bun run deploy` handles this automatically on first run. But if you need to set it up manually:

1. Go to [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **"Create Token"**
3. Use the **"Edit Cloudflare Workers"** template
4. Select your account, click **"Continue to summary"** → **"Create Token"**
5. Run `bun run setup` and paste your token when asked

Your worker runs on Cloudflare's free tier (100,000 requests/day). For a personal resume API, you'll never hit that limit.

---

## Troubleshooting

**"Template not found"**
→ Run `bun run start` to generate `TEMPLATE.md` via the wizard, or create it manually.

**"Worker name not configured"**
→ Run `bun run deploy` — it will walk you through setup automatically.

**"Cannot reach" after deploy**
→ Normal for brand new workers. Cloudflare can take up to a minute to propagate. Wait a moment and run `bun run verify`.

**"Wrangler deploy failed"**
→ Your API token may have expired. Run `bun run setup` to re-authenticate.

**Parser generates empty endpoints**
→ Check that your `TEMPLATE.md` has the correct section headings (`## About`, `## Experience`, etc.) and field markers (`**Name:**`, `**Title:**`).

---

## Project Structure

```
├── .devcontainer/         # GitHub Codespace configuration
│   ├── devcontainer.json  # Environment setup (Node, Bun, extensions)
│   └── welcome.sh         # Terminal greeting on startup
├── src/
│   ├── wizard/            # Interactive profile wizard
│   │   └── index.ts
│   ├── parser/            # Template → JSON parser
│   │   └── parse-profile.ts
│   ├── worker/            # Cloudflare Worker API server
│   │   └── index.ts
│   └── deploy.ts          # Build/deploy orchestrator
├── TEMPLATE.md            # Your profile data (generated or hand-edited)
├── wrangler.toml          # Cloudflare Worker config
└── package.json           # Scripts and dependencies
```

---

## Why a Living Resume API?

Traditional resumes are static PDFs designed in the 1950s. They get fed into Applicant Tracking Systems that do keyword matching — and **88% of employers believe qualified candidates are regularly filtered out**.

A Living Resume API is:
- **Machine-readable** — AI agents and recruiting tools can query your data directly
- **Structured** — 9 endpoints organized by purpose, not crammed into one page
- **Always current** — update and redeploy in seconds
- **Yours** — runs on your own Cloudflare account, no platform lock-in
- **Free** — Cloudflare Workers free tier handles 100K requests/day

Learn more: [The Front Door is Broken](https://talentintel.wfmlabs.com) — an interactive demo of intelligence-driven recruiting vs. traditional ATS.

---

## Credits

Built by [WFM Labs](https://wfmlabs.com). Based on the Living Resume API concept from Contact Center Compass Issue 21: "The Front Door is Broken."

Full walkthrough: [living-resume-api.netlify.app](https://living-resume-api.netlify.app)

**License:** MIT
