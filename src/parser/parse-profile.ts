/**
 * parse-profile.ts
 *
 * Reads a filled-in TEMPLATE.md and outputs structured JSON files
 * for each Living Resume API endpoint.
 *
 * Usage: bun run src/parser/parse-profile.ts [path-to-template]
 * Defaults to ./TEMPLATE.md if no path given.
 * Outputs to ./data/ directory.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileData {
  about: AboutData;
  narrative: NarrativeData;
  thesis: ThesisData;
  accomplishments: AccomplishmentsData;
  "track-record": TrackRecordData;
  experience: ExperienceData;
  seeking: SeekingData;
  "cultural-fit": CulturalFitData;
  skills: SkillsData;
}

interface AboutData {
  name: string;
  preferred_name: string;
  title: string;
  location: string;
  core_thesis: string;
  the_moment: string;
  what_i_offer: Array<{ title: string; description: string }>;
}

interface NarrativeData {
  professional_narrative: string;
  philosophy: string;
}

interface ThesisData {
  core_thesis: string;
  the_moment: string;
  implications: string[];
}

interface AccomplishmentsData {
  financial_impact: Array<{
    accomplishment: string;
    company: string;
    value: string;
  }>;
  operational_scale: string[];
  recognition_innovation: string[];
}

interface TrackRecordData {
  headline_stats: Array<{ stat: string; context: string }>;
  financial_impact: Array<{
    accomplishment: string;
    company: string;
    value: string;
  }>;
}

interface ExperienceEntry {
  title: string;
  company: string;
  dates: string;
  location: string;
  description: string;
  contributions: string[];
}

interface ExperienceData {
  experience: ExperienceEntry[];
}

interface SeekingData {
  target_roles: string[];
  reporting_relationship: string;
  organization_types: Array<{ type: string; what_i_bring: string }>;
  industry: string;
}

interface CulturalFitData {
  thrive_in: string[];
  not_right_for: string[];
}

interface SkillsData {
  what_i_offer: Array<{ title: string; description: string }>;
  expertise: {
    methodologies: string[];
    technical: string[];
    domain: string[];
  };
}

// ─── Parsing Helpers ─────────────────────────────────────────────────────────

/** Extract text between a markdown field label and the next field/section */
function extractField(content: string, label: string): string {
  const marker = `**${label}:**`;
  const idx = content.indexOf(marker);
  if (idx === -1) return "";

  const afterMarker = content.slice(idx + marker.length);

  // Find the end: next **Label:** field (paragraph or list style), ### heading, ---, or end of content
  let endIdx = afterMarker.length;
  for (const delimiter of ["\n**", "\n- **"]) {
    const pos = afterMarker.indexOf(delimiter);
    if (pos !== -1 && pos < endIdx) endIdx = pos;
  }
  // Also check for ### and --- boundaries
  const headingPos = afterMarker.search(/\n###\s/);
  if (headingPos !== -1 && headingPos < endIdx) endIdx = headingPos;
  const hrPos = afterMarker.indexOf("\n---");
  if (hrPos !== -1 && hrPos < endIdx) endIdx = hrPos;

  return cleanValue(afterMarker.slice(0, endIdx));
}

/** Extract bullet list items under a heading or label */
function extractBulletList(content: string, afterMarker: string): string[] {
  const idx = content.indexOf(afterMarker);
  if (idx === -1) return [];

  const afterContent = content.slice(idx + afterMarker.length);
  const items: string[] = [];

  for (const line of afterContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const val = cleanValue(trimmed.slice(2));
      if (val && !val.startsWith("<!--")) items.push(val);
    } else if (trimmed === "" || trimmed.startsWith("#") || trimmed.startsWith("---")) {
      if (items.length > 0) break;
    }
  }

  return items;
}

/** Extract a markdown table as array of row objects */
function extractTable(
  content: string,
  afterMarker: string
): Array<Record<string, string>> {
  const idx = content.indexOf(afterMarker);
  if (idx === -1) return [];

  const afterContent = content.slice(idx + afterMarker.length);
  const lines = afterContent.split("\n").map((l) => l.trim());

  // Find header row (first line with |)
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("|") && lines[i].includes("|")) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) return [];

  const headers = parseTableRow(lines[headerIdx]);
  if (headers.length === 0) return [];

  // Skip separator row (|---|---|)
  const dataStart = headerIdx + 2;
  const rows: Array<Record<string, string>> = [];

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("|")) break;

    const cells = parseTableRow(line);
    if (cells.every((c) => !c || c.startsWith("<!--"))) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.toLowerCase().replace(/\s+/g, "_")] = cells[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

function parseTableRow(line: string): string[] {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cleanValue(cell));
}

/** Extract a section between two ## headings */
function extractSection(content: string, heading: string): string {
  const marker = `## ${heading}`;
  const idx = content.indexOf(`\n${marker}`);
  // Also check if it starts at position 0
  const startIdx = idx !== -1 ? idx + 1 : content.startsWith(marker) ? 0 : -1;
  if (startIdx === -1) return "";

  // Skip past the heading line
  const afterHeading = content.slice(startIdx + marker.length);
  const newlinePos = afterHeading.indexOf("\n");
  if (newlinePos === -1) return "";
  const sectionContent = afterHeading.slice(newlinePos + 1);

  // Find the next ## heading
  const nextSection = sectionContent.indexOf("\n## ");
  if (nextSection === -1) return sectionContent.trim();
  return sectionContent.slice(0, nextSection).trim();
}

/** Extract what_i_offer items from "### What I Offer" subsection */
function extractWhatIOffer(section: string): Array<{ title: string; description: string }> {
  const items: Array<{ title: string; description: string }> = [];
  const blocks = section.split(/^- \*\*Title:\*\*/m);

  for (const block of blocks.slice(1)) {
    const title = cleanValue(block.split("\n")[0]);
    const descMatch = block.match(/\*\*Description:\*\*\s*(.+)/);
    const description = descMatch ? cleanValue(descMatch[1]) : "";
    if (title && !title.startsWith("<!--")) {
      items.push({ title, description });
    }
  }

  return items;
}

/** Extract experience roles from "### Role N" subsections */
function extractRoles(section: string): ExperienceEntry[] {
  const roles: ExperienceEntry[] = [];
  const roleBlocks = section.split(/^### Role \d+[^\n]*/m);

  for (const block of roleBlocks.slice(1)) {
    const title = extractField(block, "Title");
    const company = extractField(block, "Company");
    const dates = extractField(block, "Dates");
    const location = extractField(block, "Location");
    const description = extractField(block, "Description");
    const contributions = extractBulletList(block, "**Key Contributions:**");

    if (title || company) {
      roles.push({
        title,
        company,
        dates,
        location,
        description,
        contributions: contributions.filter(Boolean),
      });
    }
  }

  return roles;
}

function cleanValue(s: string): string {
  return s
    .replace(/<!--.*?-->/gs, "")
    .replace(/^\s+|\s+$/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Main Parser ─────────────────────────────────────────────────────────────

export function parseTemplate(templatePath: string): ProfileData {
  const raw = readFileSync(templatePath, "utf-8");

  // Extract major sections
  const aboutSection = extractSection(raw, "About");
  const narrativeSection = extractSection(raw, "Narrative");
  const thesisSection = extractSection(raw, "Thesis");
  const accomplishmentsSection = extractSection(raw, "Accomplishments");
  const trackRecordSection = extractSection(raw, "Track Record");
  const experienceSection = extractSection(raw, "Experience");
  const seekingSection = extractSection(raw, "Seeking");
  const culturalFitSection = extractSection(raw, "Cultural Fit");
  const skillsSection = extractSection(raw, "Skills");

  // Parse /about
  const whatIOffer = extractWhatIOffer(aboutSection);
  const about: AboutData = {
    name: extractField(aboutSection, "Name"),
    preferred_name: extractField(aboutSection, "Preferred Name"),
    title: extractField(aboutSection, "Title"),
    location: extractField(aboutSection, "Location"),
    core_thesis: extractField(aboutSection, "Core Thesis"),
    the_moment: extractField(aboutSection, "The Moment"),
    what_i_offer: whatIOffer,
  };

  // Parse /narrative
  const narrative: NarrativeData = {
    professional_narrative: extractField(narrativeSection, "Professional Narrative"),
    philosophy: extractField(narrativeSection, "Philosophy"),
  };

  // Parse /thesis
  const thesis: ThesisData = {
    core_thesis: extractField(thesisSection, "Core Thesis"),
    the_moment: extractField(thesisSection, "The Moment"),
    implications: extractBulletList(thesisSection, "### Implications"),
  };

  // Parse /accomplishments
  const financialImpactTable = extractTable(
    accomplishmentsSection,
    "### Financial Impact"
  );
  const accomplishments: AccomplishmentsData = {
    financial_impact: financialImpactTable
      .filter((r) => r.accomplishment)
      .map((r) => ({
        accomplishment: r.accomplishment,
        company: r.company,
        value: r.value,
      })),
    operational_scale: extractBulletList(
      accomplishmentsSection,
      "### Operational Scale"
    ),
    recognition_innovation: extractBulletList(
      accomplishmentsSection,
      "### Recognition & Innovation"
    ),
  };

  // Parse /track-record
  const headlineTable = extractTable(trackRecordSection, "### Headline Stats");
  const trackRecord: TrackRecordData = {
    headline_stats: headlineTable
      .filter((r) => r.stat)
      .map((r) => ({ stat: r.stat, context: r.context })),
    financial_impact: accomplishments.financial_impact,
  };

  // Parse /experience
  const experience: ExperienceData = {
    experience: extractRoles(experienceSection),
  };

  // Parse /seeking
  const orgTypesTable = extractTable(seekingSection, "### Organization Types");
  const seeking: SeekingData = {
    target_roles: extractBulletList(seekingSection, "**Target Roles:**"),
    reporting_relationship: extractField(seekingSection, "Reporting Relationship"),
    organization_types: orgTypesTable
      .filter((r) => r.organization_type)
      .map((r) => ({
        type: r.organization_type,
        what_i_bring: r.what_i_bring,
      })),
    industry: extractField(seekingSection, "Industry"),
  };

  // Parse /cultural-fit
  const culturalFit: CulturalFitData = {
    thrive_in: extractBulletList(culturalFitSection, "### I Thrive In"),
    not_right_for: extractBulletList(culturalFitSection, "### Not Right For"),
  };

  // Parse /skills
  const skills: SkillsData = {
    what_i_offer: whatIOffer,
    expertise: {
      methodologies: extractBulletList(skillsSection, "### Methodologies"),
      technical: extractBulletList(skillsSection, "### Technical"),
      domain: extractBulletList(skillsSection, "### Domain Expertise"),
    },
  };

  return {
    about,
    narrative,
    thesis,
    accomplishments,
    "track-record": trackRecord,
    experience,
    seeking,
    "cultural-fit": culturalFit,
    skills,
  };
}

// ─── File Output ─────────────────────────────────────────────────────────────

export function writeEndpointFiles(
  data: ProfileData,
  outputDir: string,
  version = "1.0.0"
): void {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const meta = {
    api_version: version,
    last_updated: new Date().toISOString().split("T")[0],
    source: "Living Resume API",
    note: "Machine-readable professional profile",
  };

  const endpoints = Object.keys(data) as (keyof ProfileData)[];

  for (const endpoint of endpoints) {
    const endpointData = data[endpoint];

    // Skip endpoints where all values are empty
    if (isEmptyData(endpointData)) {
      console.log(`  ⏭  Skipping /${endpoint} (no data)`);
      continue;
    }

    const filePath = resolve(outputDir, `${endpoint}.json`);
    const payload = { meta: { ...meta, endpoint: `/${endpoint}` }, data: endpointData };
    writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n");
    console.log(`  ✓  /${endpoint} → ${endpoint}.json`);
  }

  // Write root directory file
  const availableEndpoints = endpoints.filter(
    (e) => !isEmptyData(data[e])
  );
  const rootPayload = {
    name: `${data.about.name || "Unknown"} Living Resume API`,
    description: "Query this professional profile programmatically",
    version,
    last_updated: meta.last_updated,
    endpoints: Object.fromEntries(
      availableEndpoints.map((e) => [`GET /${e}`, endpointDescription(e)])
    ),
  };
  writeFileSync(
    resolve(outputDir, "root.json"),
    JSON.stringify(rootPayload, null, 2) + "\n"
  );
  console.log(`  ✓  / → root.json (directory)`);
}

function endpointDescription(endpoint: string): string {
  const descriptions: Record<string, string> = {
    about: "Core identity and professional positioning",
    narrative: "Professional story and philosophy",
    thesis: "Core professional thesis and implications",
    accomplishments: "Quantified achievements with evidence",
    "track-record": "Headline stats with context",
    experience: "Role history with contributions",
    seeking: "Target roles, org types, what they want",
    "cultural-fit": "Thrive-in environments and not-right-for signals",
    skills: "Expertise: methodologies, technical, domain",
  };
  return descriptions[endpoint] ?? endpoint;
}

function isEmptyData(data: unknown): boolean {
  if (data === null || data === undefined) return true;
  if (typeof data === "string") return data.trim() === "";
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === "object") {
    return Object.values(data as Record<string, unknown>).every(isEmptyData);
  }
  return false;
}

// ─── CLI Entry Point ─────────────────────────────────────────────────────────

if (import.meta.main) {
  const templatePath = resolve(process.argv[2] || "TEMPLATE.md");
  const outputDir = resolve("data");

  console.log(`\n📄 Parsing: ${templatePath}`);

  if (!existsSync(templatePath)) {
    console.error(`\n❌ Template not found: ${templatePath}`);
    console.error(`   Fill in TEMPLATE.md first, then run this parser.\n`);
    process.exit(1);
  }

  const data = parseTemplate(templatePath);

  console.log(`\n📦 Writing endpoint JSON files to: ${outputDir}\n`);
  writeEndpointFiles(data, outputDir);

  console.log(`\n✅ Done! ${Object.keys(data).length + 1} files generated.\n`);
}
