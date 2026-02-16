# Living Resume API

**Turn your professional profile into a machine-readable API in 10 minutes.**

Instead of submitting PDFs into black-hole applicant tracking systems, broadcast structured career data that recruiters, AI agents, and intelligence systems can query directly.

Your Living Resume API runs free on Cloudflare Workers — 9 endpoints, always on, zero monthly cost.

---

## Quick Start (3 Steps)

### 1. Use This Template

Click the green **"Use this template"** button above, then **"Create a new repository"**. Name it whatever you like (e.g., `my-resume-api`).

### 2. Open in Codespace

From your new repo, click **Code → Codespaces → "Create codespace on main"**. Everything installs automatically — Node, Bun, Wrangler, all dependencies. Takes about 60 seconds.

### 3. Run the Wizard

When the terminal opens, run:

```bash
bun run start
```

The interactive wizard walks you through each section of your profile — name, title, professional story, accomplishments, experience, skills, and more. It generates your `TEMPLATE.md` automatically.

Then:

```bash
bun run setup    # Connect your free Cloudflare account
bun run deploy   # Parse, deploy, and verify — one command
```

Your API is live. Share the URL.

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
| `bun run build` | Parse `TEMPLATE.md` into JSON endpoint files |
| `bun run preview` | Start a local dev server to test your API |
| `bun run setup` | Connect your Cloudflare account + configure |
| `bun run deploy` | Full pipeline: parse → deploy → verify |
| `bun run verify` | Check that all live endpoints are responding |

---

## How It Works

```
TEMPLATE.md  →  Parser  →  JSON files  →  Cloudflare Worker  →  Live API
  (your data)   (bun run build)  (data/)    (bun run deploy)    (*.workers.dev)
```

1. **You fill out your profile** — either via the wizard (`bun run start`) or by editing `TEMPLATE.md` directly
2. **The parser** reads your template and generates one JSON file per endpoint in `data/`
3. **The Cloudflare Worker** bundles those JSON files and serves them as a REST API
4. **Deploy** pushes the worker to Cloudflare's edge network — free tier, no credit card required

---

## Manual Editing

Prefer to edit markdown directly instead of using the wizard? Edit `TEMPLATE.md` in the repo root. Each section maps to an API endpoint:

- `## About` → `/about`
- `## Narrative` → `/narrative`
- `## Thesis` → `/thesis`
- `## Accomplishments` → `/accomplishments`
- `## Track Record` → `/track-record`
- `## Experience` → `/experience`
- `## Seeking` → `/seeking`
- `## Cultural Fit` → `/cultural-fit`
- `## Skills` → `/skills`

Follow the field labels exactly (e.g., `**Name:**`, `**Title:**`). The parser reads these markers. Inline comments (`<!-- like this -->`) are stripped automatically.

After editing:

```bash
bun run build     # Re-parse the template
bun run preview   # Test locally
bun run deploy    # Push to production
```

---

## Updating Your API

Changed jobs? Got a new certification? Just:

1. Edit `TEMPLATE.md` (or re-run `bun run start`)
2. Run `bun run deploy`

That's it. Your API updates in seconds.

---

## Cloudflare Setup

You need a **free** Cloudflare account. No credit card required.

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and create an account
2. Run `bun run setup` in your Codespace
3. A browser window opens — log in with your Cloudflare credentials
4. The setup script configures everything automatically

Your worker runs on Cloudflare's free tier (100,000 requests/day). For a personal resume API, you'll never hit that limit.

---

## Troubleshooting

**"Template not found"**
→ Run `bun run start` to generate `TEMPLATE.md` via the wizard, or create it manually.

**"Worker name not configured"**
→ Run `bun run setup` to create `config.json` and set your worker name.

**"Wrangler deploy failed"**
→ Make sure you've logged in: `bun run setup`. Check your Cloudflare dashboard.

**"Config name mismatch"**
→ The `worker_name` in `config.json` must match the `name` in `wrangler.toml`. Run `bun run setup` to sync them.

**Parser generates empty endpoints**
→ Check that your `TEMPLATE.md` has the correct section headings (`## About`, `## Experience`, etc.) and field markers (`**Name:**`, `**Title:**`).

---

## Project Structure

```
├── .devcontainer/         # GitHub Codespace configuration
│   ├── devcontainer.json  # Environment setup (Node, Bun, extensions)
│   └── welcome.sh         # Terminal greeting on startup
├── .vscode/               # VS Code tasks and extensions
├── src/
│   ├── wizard/            # Interactive profile wizard
│   │   └── index.ts       # Wizard entry point
│   ├── parser/            # Template → JSON parser
│   │   └── parse-profile.ts
│   ├── worker/            # Cloudflare Worker API server
│   │   └── index.ts
│   └── deploy.ts          # Build/deploy orchestrator
├── TEMPLATE.md            # Your profile data (generated or hand-edited)
├── config.example.json    # Example configuration
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

**License:** MIT
