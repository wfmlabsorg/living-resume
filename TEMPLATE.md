# Living Resume API — Your Professional Profile

> Fill in each section below. This file becomes your Living Resume API.
> Every section maps directly to an API endpoint that machines, recruiters,
> and AI agents can query about you.
>
> **Tips:**
> - Be specific. "Reduced costs by 20%" is stronger than "drove cost savings."
> - Be honest. The cultural-fit section is where you say what you're NOT right for.
> - Write for machines AND humans. Structured data with context beats prose alone.
> - Leave a section blank if it doesn't apply — the API will skip it gracefully.

---

## About

> **Endpoint:** `GET /about`
> This is your professional identity in structured form. Not a bio paragraph —
> think of it as the answer to "who are you professionally and what do you believe?"

**Name:** <!-- Your full name -->

**Preferred Name:** <!-- What people call you -->

**Title:** <!-- Your current or target professional title -->

**Location:** <!-- City, State -->

**Core Thesis:**
<!-- In 1-3 sentences: what is the big idea that drives your professional work?
     This isn't a mission statement. It's what you've learned about how your
     industry should work. Example: "Organizations don't have to choose between
     cost efficiency and customer experience — they can optimize for both through
     adaptive systems." -->

**The Moment:**
<!-- What specific experience crystallized your professional thesis?
     A concrete story, not an abstraction. Example: "When our ML forecasting model
     predicted a demand surge 72 hours before it happened and we pre-positioned
     staff perfectly, I knew reactive workforce management was obsolete." -->

### What I Offer

<!-- List 2-4 capability areas. Each needs a title and a one-sentence description
     of what you actually deliver, not what you know. -->

- **Title:** <!-- e.g., "Workforce Transformation" -->
  **Description:** <!-- e.g., "Modernize legacy WFM systems from reactive scheduling to AI-driven adaptive operations" -->

- **Title:**
  **Description:**

- **Title:**
  **Description:**

---

## Narrative

> **Endpoint:** `GET /narrative`
> Your professional story as a narrative arc. This is where you connect the dots
> between roles and explain the trajectory. AI agents use this to understand
> your career direction, not just your history.

**Professional Narrative:**
<!-- Write your career story as 1-2 paragraphs. Not a list of jobs — a story of
     how each chapter built on the last. What thread connects everything?
     Example: "My path from frontline operations to strategic consulting follows
     a single thread: every role taught me that the gap between how organizations
     manage workforce and how they could manage workforce is enormous..." -->

**Philosophy:**
<!-- In 1-2 sentences: what's your operating philosophy? How do you approach work?
     Example: "Every operations problem is a prediction problem in disguise." -->

---

## Thesis

> **Endpoint:** `GET /thesis`
> A deeper dive into your professional thesis and its implications.
> This is what separates a professional identity from a job description.

**Core Thesis:**
<!-- Restate your thesis (can be same as /about or expanded) -->

**The Moment:**
<!-- Restate your defining moment (can be same as /about or expanded) -->

### Implications

<!-- What follows from your thesis? List 2-5 concrete implications.
     These aren't goals — they're logical consequences of your worldview. -->

- <!-- e.g., "Traditional Erlang-based forecasting is a 50-year-old solution to a modern problem" -->
- <!-- e.g., "Operations leaders need technical fluency to build, not just buy" -->
-
-

---

## Accomplishments

> **Endpoint:** `GET /accomplishments`
> Quantified results with context. These are the proof points that back up
> your thesis and narrative. An AI agent uses these to evaluate your track record.

### Financial Impact

<!-- List your most significant accomplishments with dollar values.
     Each needs: what you did, where you did it, and the financial result. -->

| Accomplishment | Company | Value |
|----------------|---------|-------|
| <!-- e.g., "Reduced operational costs through workforce optimization" --> | <!-- e.g., "Acme Corp" --> | <!-- e.g., "$5M annual savings" --> |
| | | |
| | | |
| | | |

### Operational Scale

<!-- Bullet points showing the scale you've operated at. Numbers matter. -->

- <!-- e.g., "Managed 5,000 agents across 8 contact centers" -->
- <!-- e.g., "Processed 2.1M customer interactions monthly" -->
-
-

### Recognition & Innovation

<!-- Awards, certifications, patents, publications, speaking engagements.
     Things that demonstrate expertise beyond job performance. -->

- <!-- e.g., "Six Sigma Black Belt Certification" -->
- <!-- e.g., "Published: 'ML Approaches to Workforce Forecasting' — Journal of Healthcare Management" -->
-
-

---

## Track Record

> **Endpoint:** `GET /track-record`
> Your headline stats — the numbers that define your professional impact.
> Think of these as the stats on the back of your baseball card.

### Headline Stats

<!-- 3-5 of your most impressive numbers with context -->

| Stat | Context |
|------|---------|
| <!-- e.g., "$50M+" --> | <!-- e.g., "Total documented cost savings across career" --> |
| <!-- e.g., "300%" --> | <!-- e.g., "ROI on workforce technology investments at MetLife" --> |
| | |
| | |

---

## Experience

> **Endpoint:** `GET /experience`
> Your role history with specific contributions. This is structured career data,
> not a resume paragraph. Each role should make clear: what was the scope,
> and what did YOU specifically accomplish?

### Role 1 (Most Recent)

- **Title:** <!-- e.g., "Vice President, Business Transformation" -->
- **Company:** <!-- e.g., "Lakeshore Health System" -->
- **Dates:** <!-- e.g., "2021 - Present" -->
- **Location:** <!-- e.g., "Chicago, IL" -->
- **Description:** <!-- 1-2 sentences on the role scope -->
- **Key Contributions:**
  - <!-- Specific accomplishment with numbers -->
  - <!-- Specific accomplishment with numbers -->
  -
  -

### Role 2

- **Title:**
- **Company:**
- **Dates:**
- **Location:**
- **Description:**
- **Key Contributions:**
  -
  -
  -

### Role 3

- **Title:**
- **Company:**
- **Dates:**
- **Location:**
- **Description:**
- **Key Contributions:**
  -
  -
  -

### Role 4

- **Title:**
- **Company:**
- **Dates:**
- **Location:**
- **Description:**
- **Key Contributions:**
  -
  -

<!-- Add more roles by copying the pattern above -->

---

## Seeking

> **Endpoint:** `GET /seeking`
> What you're looking for. This tells AI agents and recruiters whether there's
> a potential match before anyone wastes time. Be specific about what you want
> AND what kind of organization would benefit from you.

**Target Roles:**
<!-- List 2-5 titles you'd respond to -->
- <!-- e.g., "VP, Workforce Transformation" -->
- <!-- e.g., "SVP, Operations" -->
-
-

**Reporting Relationship:**
<!-- Who do you expect to report to? -->
<!-- e.g., "Reports to COO, CTO, or CEO in transformation-focused organization" -->

### Organization Types

<!-- What kinds of organizations are a match? For each, explain what you bring. -->

| Organization Type | What I Bring |
|-------------------|--------------|
| <!-- e.g., "Fortune 500 with transformation mandate" --> | <!-- e.g., "Proven ability to drive $50M+ in operational savings at enterprise scale" --> |
| <!-- e.g., "Growth-stage technology company" --> | <!-- e.g., "Bridge between technical innovation and operational execution" --> |
| | |

**Industry:**
<!-- What industries are you targeting? -->
<!-- e.g., "Financial Services, Healthcare, Technology — any industry ready to modernize operations" -->

---

## Cultural Fit

> **Endpoint:** `GET /cultural-fit`
> This is the most important section for honest matching. The "thrive in" list
> tells agents what kind of environment you need. The "not right for" list is
> where you self-select OUT of bad matches. Being honest here saves everyone time.

### I Thrive In

<!-- What environments bring out your best work? Be specific. -->

- <!-- e.g., "Innovation-oriented cultures that encourage experimentation" -->
- <!-- e.g., "Data-driven organizations that value evidence over intuition" -->
-
-
-

### Not Right For

<!-- What environments would be a bad match? This is where you're brutally honest.
     A strong "not right for" list is a sign of self-awareness, not weakness. -->

- <!-- e.g., "Organizations that want to maintain status quo with incremental improvements" -->
- <!-- e.g., "Companies that rely exclusively on vendor solutions without internal capability" -->
-
-
-

---

## Skills

> **Endpoint:** `GET /skills`
> Your capability inventory, organized by category. This gives AI agents
> a structured taxonomy of what you can do.

### Methodologies

<!-- Frameworks, processes, and approaches you use -->

- <!-- e.g., "Six Sigma (Black Belt)" -->
- <!-- e.g., "Agile/Scrum" -->
-
-
-

### Technical

<!-- Tools, platforms, and technical skills -->

- <!-- e.g., "Python (scikit-learn, TensorFlow)" -->
- <!-- e.g., "Verint WFM" -->
-
-
-

### Domain Expertise

<!-- Industry-specific knowledge areas -->

- <!-- e.g., "Demand Forecasting" -->
- <!-- e.g., "Workforce Optimization" -->
-
-
-
