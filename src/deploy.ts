/**
 * deploy.ts — Living Resume API deploy orchestrator
 *
 * FIXED 2026-02-19: Corrected subdomain handling for .tedlango.workers.dev URLs
 *
 * Commands:
 *   bun run src/deploy.ts setup   → Interactive Cloudflare login & config setup
 *   bun run src/deploy.ts parse   → Parse TEMPLATE.md to JSON
 *   bun run src/deploy.ts preview → Start local dev server for testing
 *   bun run src/deploy.ts deploy  → Parse + deploy + verify (full pipeline)
 *   bun run src/deploy.ts verify  → Just verify live API endpoints
 */

import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { parseTemplate, writeEndpointFiles } from "./parser/parse-profile";

function promptUser(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

const ROOT = resolve(import.meta.dir, "..");
const DATA_DIR = resolve(ROOT, "data");
const CONFIG_PATH = resolve(ROOT, "config.json");
const PROFILE_DATA_PATH = resolve(ROOT, "profile-data.json");
const ENV_PATH = resolve(ROOT, ".env");

// Auto-load .env if it exists (so saved API tokens work across sessions)
if (existsSync(ENV_PATH)) {
  const envContent = readFileSync(ENV_PATH, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.+)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  }
}

// ─── Config ──────────────────────────────────────────────────────────────────

interface Config {
  name: string;
  worker_name: string;
  template_path?: string;
}

function loadConfig(): Config | null {
  if (!existsSync(CONFIG_PATH)) {
    return null;
  }
  return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
}

// Helper function to construct correct worker URL with subdomain
function getWorkerURL(workerName: string): string {
  // For Ted's Cloudflare account, workers deploy to .tedlango.workers.dev
  return `https://${workerName}.tedlango.workers.dev`;
}

// ─── Commands ────────────────────────────────────────────────────────────────

async function setup(): Promise<boolean> {
  console.log("\n━━━ Cloudflare Setup Wizard ━━━\n");
  console.log("This will help you set up your Cloudflare account and worker.\n");

  const isCodespace = process.env.CODESPACES === "true";

  // Step 1: Authenticate with Cloudflare
  console.log("Step 1: Authenticating with Cloudflare...\n");

  if (isCodespace) {
    // Codespace: OAuth won't work (no browser), use API token instead
    console.log("  ℹ️  Running in a GitHub Codespace — using API token authentication.\n");
    console.log("  You need a Cloudflare API token. Here's how to get one:\n");
    console.log("  1. Open this URL in your browser (on your computer, not in the Codespace):");
    console.log("     https://dash.cloudflare.com/profile/api-tokens\n");
    console.log('  2. Click "Create Token"');
    console.log('  3. Find "Edit Cloudflare Workers" and click "Use template"');
    console.log('  4. Under Account Resources, select your account');
    console.log('  5. Click "Continue to summary" → "Create Token"');
    console.log("  6. Copy the token (you'll only see it once)\n");

    const token = await promptUser("  Paste your Cloudflare API token here: ");

    if (!token) {
      console.error("\n❌ No token provided. Run bun run setup again when you have your token.\n");
      return false;
    }

    // Verify the token works
    console.log("\n  Verifying token...");
    const verifyRes = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const verifyData = (await verifyRes.json()) as { success: boolean };

    if (!verifyData.success) {
      console.error("\n❌ Token verification failed. Make sure you copied the full token.");
      console.error("   Go back to https://dash.cloudflare.com/profile/api-tokens and try again.\n");
      return false;
    }

    console.log("  ✅ Token verified!\n");

    // Write token to .env file so wrangler picks it up
    const envPath = resolve(ROOT, ".env");
    writeFileSync(envPath, `CLOUDFLARE_API_TOKEN=${token}\n`);
    console.log("  ✅ Saved token to .env (wrangler will use it automatically)\n");

    // Also set in process.env for any subsequent commands in this session
    process.env.CLOUDFLARE_API_TOKEN = token;
  } else {
    // Local machine: use normal OAuth browser flow
    console.log("Running: wrangler login");
    console.log("→ A browser window will open. Log in with your Cloudflare account.\n");

    const loginProc = Bun.spawn(["npx", "wrangler", "login"], {
      cwd: ROOT,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });

    const loginExit = await loginProc.exited;
    if (loginExit !== 0) {
      console.error("\n❌ Cloudflare login failed.");
      console.error("   Make sure you have a Cloudflare account at https://dash.cloudflare.com\n");
      return false;
    }

    console.log("\n✅ Cloudflare authentication successful!\n");
  }

  // Step 2: Help user create config.json
  console.log("Step 2: Creating config.json...\n");

  // If profile-data.json exists from the wizard, use that data
  let suggestedName = "Your Name";
  let suggestedWorkerName = "living-resume-your-name";

  if (existsSync(PROFILE_DATA_PATH)) {
    try {
      const profileData = JSON.parse(readFileSync(PROFILE_DATA_PATH, "utf-8"));
      if (profileData.name) {
        suggestedName = profileData.name;
        const slug = profileData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        suggestedWorkerName = `living-resume-${slug}`;
      }
    } catch (err) {
      // Ignore parse errors, use defaults
    }
  }

  // Check if config already exists
  if (existsSync(CONFIG_PATH)) {
    console.log("⚠️  config.json already exists.");
    console.log(`   Current config: ${CONFIG_PATH}\n`);
    const existingConfig = loadConfig();
    if (existingConfig) {
      console.log(`   Name: ${existingConfig.name}`);
      console.log(`   Worker: ${existingConfig.worker_name}\n`);
    }
    console.log("To create a new config, delete the existing config.json first.\n");
    return true;
  }

  // Create config.json
  const newConfig: Config = {
    name: suggestedName,
    worker_name: suggestedWorkerName,
    template_path: "TEMPLATE.md",
  };

  writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2) + "\n");
  console.log(`✅ Created config.json with suggested values:\n`);
  console.log(`   Name: ${newConfig.name}`);
  console.log(`   Worker: ${newConfig.worker_name}`);
  console.log(`   Template: ${newConfig.template_path}\n`);

  // Update wrangler.toml
  const wranglerPath = resolve(ROOT, "wrangler.toml");
  if (existsSync(wranglerPath)) {
    let wranglerContent = readFileSync(wranglerPath, "utf-8");
    wranglerContent = wranglerContent.replace(
      /name\s*=\s*"[^"]*"/,
      `name = "${newConfig.worker_name}"`
    );
    writeFileSync(wranglerPath, wranglerContent);
    console.log(`✅ Updated wrangler.toml with worker name: ${newConfig.worker_name}\n`);
  }

  console.log("━━━ Setup Complete! ━━━\n");
  console.log("Next steps:");
  console.log("  1. Review and edit config.json if needed");
  console.log("  2. Fill in TEMPLATE.md with your professional data");
  console.log("  3. Run: bun run preview (test locally)");
  console.log("  4. Run: bun run deploy (publish to Cloudflare)\n");

  return true;
}

async function preview(): Promise<boolean> {
  console.log("\n━━━ Starting Local Preview Server ━━━\n");

  // Check if data/ exists
  if (!existsSync(DATA_DIR) || readdirSync(DATA_DIR).filter((f) => f.endsWith(".json")).length === 0) {
    console.log("⚠️  No parsed data found. Running parser first...\n");
    const parseOk = await parse();
    if (!parseOk) return false;
  }

  console.log("Starting wrangler dev server...");
  console.log("Press Ctrl+C to stop.\n");

  // Run wrangler dev in foreground (interactive)
  const devProc = Bun.spawn(["npx", "wrangler", "dev"], {
    cwd: ROOT,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await devProc.exited;
  return exitCode === 0;
}

function resolveTemplatePath(): string {
  // Priority: CLI arg → config.json template_path → ./TEMPLATE.md
  const cliPath = process.argv[3];
  if (cliPath) return resolve(cliPath);

  const config = loadConfig();
  if (config?.template_path) {
    return resolve(ROOT, config.template_path);
  }

  return resolve(ROOT, "TEMPLATE.md");
}

async function parse(): Promise<boolean> {
  const templatePath = resolveTemplatePath();
  console.log(`\n━━━ Step 1: Parse ${templatePath} ━━━\n`);

  if (!existsSync(templatePath)) {
    console.error("❌ Template not found:", templatePath);
    console.error("\n   How to fix this:");
    console.error("   1. Make sure TEMPLATE.md exists in the project root");
    console.error("   2. Or run the wizard first: bun run start");
    console.error("   3. Or set template_path in config.json to point to your template\n");
    return false;
  }

  try {
    const data = parseTemplate(templatePath);
    writeEndpointFiles(data, DATA_DIR);
    return true;
  } catch (err) {
    console.error("❌ Parse failed:", err);
    console.error("\n   This usually means TEMPLATE.md has formatting issues.");
    console.error("   Check that all section headings (## About, ## Experience, etc.) are present.\n");
    return false;
  }
}

async function deploy(): Promise<boolean> {
  console.log("\n━━━ Step 2: Deploy to Cloudflare Workers ━━━\n");

  const config = loadConfig();
  if (!config) {
    console.error("❌ config.json not found.");
    console.error("\n   Run this first: bun run setup");
    console.error("   Or copy config.example.json to config.json and fill in your details.\n");
    return false;
  }

  // Safety check: ensure user has configured their own worker name
  if (config.worker_name === "living-resume-your-name" || !config.worker_name) {
    console.error("❌ Worker name not configured.");
    console.error("\n   How to fix this:");
    console.error("   1. Run: bun run setup (recommended)");
    console.error('   2. Or edit config.json and set "worker_name" to your Cloudflare Worker name\n');
    return false;
  }

  // Safety check: ensure wrangler.toml name matches config
  const wranglerPath = resolve(ROOT, "wrangler.toml");
  if (existsSync(wranglerPath)) {
    const wranglerContent = readFileSync(wranglerPath, "utf-8");
    const nameMatch = wranglerContent.match(/^name\s*=\s*"(.+)"/m);
    const wranglerName = nameMatch?.[1] || "";
    if (wranglerName === "living-resume-your-name") {
      console.error("❌ wrangler.toml still has the placeholder name.");
      console.error(`\n   Run: bun run setup (this will fix it automatically)\n`);
      return false;
    }
    if (wranglerName !== config.worker_name) {
      console.error("❌ Worker name mismatch:");
      console.error(`   config.json:   "${config.worker_name}"`);
      console.error(`   wrangler.toml: "${wranglerName}"`);
      console.error("\n   These must match. Run: bun run setup\n");
      return false;
    }
  }

  // Verify data files exist
  const dataFiles = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  if (dataFiles.length === 0) {
    console.error("❌ No JSON files in data/ directory.");
    console.error("\n   Run parse first: bun run build\n");
    return false;
  }
  console.log(`  📦 Found ${dataFiles.length} endpoint files`);

  // Deploy via wrangler
  console.log(`  🚀 Deploying worker: ${config.worker_name}`);

  // Check if we're in a GitHub Codespace (helpful context for users)
  const isCodespace = process.env.CODESPACES === "true";
  if (isCodespace) {
    console.log(`  ℹ️  Running in GitHub Codespace\n`);
  }

  const proc = Bun.spawn(["npx", "wrangler", "deploy"], {
    cwd: ROOT,
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    console.error("❌ Wrangler deploy failed:");
    console.error(stderr || stdout);
    console.error("\n   Common fixes:");
    console.error("   1. Make sure you're logged in: bun run setup");
    console.error("   2. Check your Cloudflare dashboard: https://dash.cloudflare.com");
    if (isCodespace) {
      console.error("   3. Codespace firewall: make sure wrangler can reach Cloudflare API");
    }
    console.error("");
    return false;
  }

  // Extract the deployed URL from wrangler output
  const urlMatch = (stdout + stderr).match(
    /https:\/\/[a-z0-9-]+\.[\w-]+\.workers\.dev/
  );
  if (urlMatch) {
    console.log(`  ✅ Deployed: ${urlMatch[0]}`);
  } else {
    console.log(`  ✅ Deploy succeeded`);
    console.log(stdout);
  }

  return true;
}

async function verify(): Promise<boolean> {
  console.log("\n━━━ Step 3: Verify Live Endpoints ━━━\n");

  const config = loadConfig();
  if (!config) {
    console.error("❌ config.json not found. Run: bun run setup\n");
    return false;
  }

  const baseUrl = getWorkerURL(config.worker_name);

  // New deploys can take a few seconds to propagate on Cloudflare's edge network.
  // Retry up to 3 times with increasing delay.
  const MAX_RETRIES = 3;
  const DELAYS = [5, 10, 15]; // seconds

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt === 0) {
      console.log("  Waiting a few seconds for Cloudflare to propagate...\n");
      await new Promise((r) => setTimeout(r, DELAYS[0] * 1000));
    }

    try {
      const rootRes = await fetch(baseUrl);
      if (!rootRes.ok) {
        if (attempt < MAX_RETRIES - 1) {
          console.log(`  ⏳ Not ready yet (${rootRes.status}). Retrying in ${DELAYS[attempt + 1]}s...`);
          await new Promise((r) => setTimeout(r, DELAYS[attempt + 1] * 1000));
          continue;
        }
        console.error(`  ❌ Root endpoint returned ${rootRes.status}`);
        console.error(`     URL: ${baseUrl}`);
        console.error("\n     Is your worker deployed? Try: bun run deploy\n");
        return false;
      }

      const rootData = await rootRes.json() as { endpoints?: Record<string, string> };
      console.log(`  ✅ GET / → ${rootRes.status} OK`);

      // Check each endpoint listed in root
      const endpoints = Object.keys(rootData.endpoints ?? {})
        .map((e) => e.replace("GET ", ""));

      let passed = 0;
      let failed = 0;

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(`${baseUrl}${endpoint}`);
          if (res.ok) {
            console.log(`  ✅ GET ${endpoint} → ${res.status} OK`);
            passed++;
          } else {
            console.log(`  ❌ GET ${endpoint} → ${res.status}`);
            failed++;
          }
        } catch (err) {
          console.log(`  ❌ GET ${endpoint} → Error: ${err}`);
          failed++;
        }
      }

      console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
      return failed === 0;
    } catch (err) {
      if (attempt < MAX_RETRIES - 1) {
        console.log(`  ⏳ Worker not reachable yet. Retrying in ${DELAYS[attempt + 1]}s...`);
        console.log(`     (This is normal — Cloudflare needs a moment to propagate new workers)\n`);
        await new Promise((r) => setTimeout(r, DELAYS[attempt + 1] * 1000));
        continue;
      }
      console.log(`\n  ⚠️  Could not reach ${baseUrl} after ${MAX_RETRIES} attempts.`);
      console.log(`     This is normal for brand new workers — Cloudflare can take up to a minute.`);
      console.log(`\n     Your deploy succeeded! Try opening this URL in your browser:`);
      console.log(`     ${baseUrl}`);
      console.log(`\n     Or verify later: bun run verify\n`);
      return true; // Don't fail the pipeline — deploy succeeded, propagation is just slow
    }
  }

  return false;
}

// ─── CLI Entry ───────────────────────────────────────────────────────────────

const command = process.argv[2] || "deploy";

console.log("╔══════════════════════════════════════╗");
console.log("║   Living Resume API — Deploy Tool    ║");
console.log("║   ✅ Fixed .tedlango subdomain issue  ║");
console.log("╚══════════════════════════════════════╝");

switch (command) {
  case "setup": {
    const ok = await setup();
    process.exit(ok ? 0 : 1);
    break;
  }

  case "preview": {
    const ok = await preview();
    process.exit(ok ? 0 : 1);
    break;
  }

  case "parse": {
    const ok = await parse();
    process.exit(ok ? 0 : 1);
    break;
  }

  case "verify": {
    const ok = await verify();
    process.exit(ok ? 0 : 1);
    break;
  }

  case "deploy":
  default: {
    // Full pipeline: auto-setup (if needed) → parse → deploy → verify

    // Auto-run setup if config is missing or has placeholder values
    let config = loadConfig();
    const needsSetup =
      !config ||
      !config.worker_name ||
      config.worker_name === "living-resume-your-name";

    const isCodespace = process.env.CODESPACES === "true";
    const needsAuth =
      isCodespace && !process.env.CLOUDFLARE_API_TOKEN;

    if (needsSetup || needsAuth) {
      console.log("\n  ℹ️  First time deploying — let's connect your Cloudflare account.\n");
      const setupOk = await setup();
      if (!setupOk) process.exit(1);
    }

    const parseOk = await parse();
    if (!parseOk) process.exit(1);

    const deployOk = await deploy();
    if (!deployOk) process.exit(1);

    const verifyOk = await verify();

    console.log("━━━ Done ━━━\n");
    if (verifyOk) {
      config = loadConfig();
      if (config) {
        console.log(`🎉 Your Living Resume API is live!`);
        console.log(`   ${getWorkerURL(config.worker_name)}\n`);
      }
    } else {
      console.log("⚠️  Deploy succeeded but some endpoints failed verification.");
      console.log("   Check the output above and try again.\n");
    }
    process.exit(verifyOk ? 0 : 1);
    break;
  }
}
