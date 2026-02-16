/**
 * Living Resume API — Cloudflare Worker
 *
 * Serves your professional profile as a queryable REST API.
 * Reads pre-parsed JSON files from the data/ directory (bundled at deploy time).
 *
 * Endpoints:
 *   GET /           → API directory (available endpoints)
 *   GET /about      → Core identity and positioning
 *   GET /narrative  → Professional story and philosophy
 *   GET /thesis     → Core thesis and implications
 *   GET /accomplishments → Quantified achievements
 *   GET /track-record    → Headline stats
 *   GET /experience      → Role history
 *   GET /seeking         → Target roles and org types
 *   GET /cultural-fit    → Environment preferences
 *   GET /skills          → Capability taxonomy
 */

// ─── Endpoint Data (injected at build time) ──────────────────────────────────
// These are replaced by the deploy script with actual JSON data.
// @ts-ignore
import aboutData from "../../data/about.json";
// @ts-ignore
import narrativeData from "../../data/narrative.json";
// @ts-ignore
import thesisData from "../../data/thesis.json";
// @ts-ignore
import accomplishmentsData from "../../data/accomplishments.json";
// @ts-ignore
import trackRecordData from "../../data/track-record.json";
// @ts-ignore
import experienceData from "../../data/experience.json";
// @ts-ignore
import seekingData from "../../data/seeking.json";
// @ts-ignore
import culturalFitData from "../../data/cultural-fit.json";
// @ts-ignore
import skillsData from "../../data/skills.json";

// ─── Response Helpers ────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

// ─── Endpoint Descriptions ───────────────────────────────────────────────────

const ENDPOINT_DESCRIPTIONS: Record<string, string> = {
  "/about": "Core identity and professional positioning",
  "/narrative": "Professional story and philosophy",
  "/thesis": "Core professional thesis and implications",
  "/accomplishments": "Quantified achievements with evidence",
  "/track-record": "Headline stats with context",
  "/experience": "Role history with contributions",
  "/seeking": "Target roles, org types, what they want",
  "/cultural-fit": "Thrive-in environments and not-right-for signals",
  "/skills": "Expertise: methodologies, technical, domain",
};

// ─── Route Table ─────────────────────────────────────────────────────────────

const routes: Record<string, unknown> = {
  "/about": aboutData,
  "/narrative": narrativeData,
  "/thesis": thesisData,
  "/accomplishments": accomplishmentsData,
  "/track-record": trackRecordData,
  "/experience": experienceData,
  "/seeking": seekingData,
  "/cultural-fit": culturalFitData,
  "/skills": skillsData,
};

// ─── Root Endpoint (auto-discovered) ─────────────────────────────────────────

function buildRootResponse(): unknown {
  const name = (aboutData as any)?.data?.name || "Living Resume";
  const endpoints: Record<string, string> = {};
  for (const path of Object.keys(routes)) {
    endpoints[`GET ${path}`] = ENDPOINT_DESCRIPTIONS[path] || path;
  }
  return {
    name: `${name} Living Resume API`,
    description: "Query this professional profile programmatically",
    version: (aboutData as any)?.meta?.api_version || "1.0.0",
    last_updated: (aboutData as any)?.meta?.last_updated || new Date().toISOString().split("T")[0],
    endpoints,
  };
}

// ─── Worker Entry ────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Only allow GET
    if (request.method !== "GET") {
      return jsonResponse(
        { error: "Method not allowed. This API only supports GET requests." },
        405
      );
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    // Root endpoint — auto-discovered from loaded data
    if (path === "/") {
      return jsonResponse(buildRootResponse());
    }

    const data = routes[path];
    if (data) {
      return jsonResponse(data);
    }

    return jsonResponse(
      {
        error: "Not found",
        message: `No endpoint at ${path}`,
        available_endpoints: Object.keys(routes),
      },
      404
    );
  },
};
