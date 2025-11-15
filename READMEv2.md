# Agent-Native Operating System (AN-OS)

> **Single OS. Multiple domains. Agents do the work. You set direction.**

This document describes how to design and run your business as an **agent-native operating system** (AN-OS), where:

- AI agents do most of the repeatable knowledge work  
- Orchestrators coordinate them into flows  
- Humans set goals, constraints, and handle edge cases  

The same OS supports **three domains**:

1. **Product domain** – delivering value to customers  
2. **Operations / GTM domain** – running and growing the business  
3. **Ideas & Validation domain** – discovering and validating what to build next  

All domains share the same 5-layer architecture.

### Code layout (concrete mapping)

In this repo, the layers map to folders like this:

- `prisma/` – **L0 schema & migrations** (entities + events).
- `src/l0/` – **L0 helpers** (`db.ts`, `events.ts`).
- `src/l1/` – **L1 agents** (workers), split by domain (`ops/`, `ideas/`, later `product/`).
- `src/l2/` – **L2 orchestrators** (flows), also split by domain.
- `src/l3/` – **L3 intent** (business + ideas strategy/config).
- `src/app/` – **L4 interfaces** (Next.js app: dashboards, APIs, actions).

When adding new behavior, decide which layer it belongs to first, then put the code in the matching folder.

---

## 1. The 5-Layer Model

### L0 – Identity & Memory (The Brain)

L0 is the **single source of truth**: the structured memory of the system.

It stores:

- **Entities** – users, accounts, leads, vendors, transactions, ideas, experiments, subscriptions, etc.
- **Events** – `EMAILS_INGESTED`, `TRANSACTION_PARSED`, `LEAD_CREATED`, `IDEA_KILLED`, `FOUNDERSUMMARY_GENERATED`, etc.
- **State** – what’s in progress, what’s done, what’s scheduled, health flags, etc.

**Core principles:**

- All agents and orchestrators **read from** and **write to** L0.
- If all agents and UIs were turned off, you should still be able to **reconstruct what happened** from L0.
- All meaningful changes are represented as **events**; state tables are **materialized views** derived from events.
- L0 is logically **one OS**, but is organized into **domain slices** (e.g. `product.*`, `ops.*`, `ideas.*`) for clarity and ownership.
- L0 is **multi-tenant**:
  - Every entity/event is scoped by tenant (company / user / workspace).
  - Cross-tenant reads are controlled and explicit.

**Events vs state:**

- **Events**:
  - Append-only log, e.g. `LEAD_CREATED`, `SUMMARY_PUBLISHED`, `EXPERIMENT_VERDICT_RECORDED`.
  - Include correlation IDs (see Observability section).
- **State**:
  - Tables like `accounts`, `subscriptions`, `ideas`, `founder_summaries`.
  - Can be recomputed from events when needed.

**Ownership:**

- Each domain “owns” a set of entities and event types.
- Other domains can **reference** but not arbitrarily mutate entities they don’t own (e.g., Ideas domain doesn’t directly edit subscriptions).

---

### L1 – Agents (The Workers)

L1 is a pool of **autonomous workers** with narrow, well-defined jobs.

Each agent:

- Takes **structured input** (from L0 and/or external APIs)
- Produces **structured output** (written back to L0)
- Has **no hidden side-effects**: all meaningful work is reflected in L0
- Does **not orchestrate** other agents; it performs a single unit of work

Examples:

- Email Parsing Agent
- Spend Aggregation Agent
- GTM Lead Scoring Agent
- Outbound Email Drafting Agent
- Problem Mapper Agent (for ideas)
- Experiment Designer / Interpreter Agents
- Founder Summary Agent

**L1 vs “tooling”:**

- Some transformations are pure deterministic logic (e.g. a SQL rollup). These can live as **library functions** called by orchestrators.
- L1 agents are used when:
  - You need language understanding, generation, fuzzy reasoning, or complex classification.
  - You want a **job description** and explicit I/O contract for the work.

**L1 design rules:**

- One agent = one “job”:
  - A single call should represent a **single, testable unit of work**.
- Agents **don’t call other agents** and **don’t send emails / notifications** directly.
- All external side effects are handled at L2.

---

### L2 – Orchestrators (The Managers)

L2 orchestrators wire agents and tooling into **flows**.

They:

- Decide **when** to call **which agents**
- Sequence steps and handle branching
- Retry on failure, apply control logic, and manage **human-in-the-loop** steps
- Emit events into L0 for **auditability and observability**
- Own all **external side effects** (emails, webhooks, etc.)

There is **one OS**, but multiple flows, e.g.:

- Product flows (e.g. onboarding, daily sync, report generation)
- Ops/GTM flows (e.g. lead → paid, retention checks, weekly founder summary)
- Ideas flows (e.g. weekly signal ingestion, idea scoring, experiment loops)

In practice:

- Implement a **Business Orchestrator** plus one or more **Product Orchestrators**.
- All orchestrators operate over the same L0 and share the same agent pool (L1).

**L1 vs L2 boundary:**

- **Agents (L1)**:
  - Single, stateless unit of work.
  - Read from L0 / APIs, write back to L0.
  - No orchestration, no direct side effects (e.g. sending emails).
- **Orchestrators (L2)**:
  - Multi-step flows with branching and retries.
  - Call agents and deterministic tools.
  - Perform side effects (send email, trigger webhooks) based on L0 state and L3 intent.

---

### L3 – Intent Layer (Goals & Constraints)

L3 encodes **what “good” looks like** and **what’s allowed**.

It includes:

- **Goals**
  - “Reach $X MRR by [date].”
  - “Target B2B customers with ARPU > $50/month.”
- **Constraints**
  - “No products in heavily regulated medical domains.”
  - “Agents can draft outbound emails but never send without approval.”
- **Preferences**
  - “Bias toward ideas that can be run by ≤ 2 people.”
  - “Prefer recurring workflows over one-off tools.”

**L3 representation:**

- L3 is expressed as structured config, for example:

  - `strategies` (e.g. ICP definition, pricing strategy)
  - `constraints` (e.g. excluded categories, safety rules)
  - `preferences` (e.g. aggressiveness of recommendations, risk appetite)

- Each config object is:
  - **Versioned** (so you can reconstruct decisions under a specific strategy version).
  - Scoped (global vs per-tenant vs per-domain).

**Access from L1/L2:**

- Job descriptions for agents and flows explicitly specify which L3 configs they consult.
- At run-time, agents and orchestrators fetch the **current version** of relevant L3 objects and include those in prompts / logic.

---

### L4 – Interfaces (Value Layer)

L4 is what humans and other systems **touch**:

- Customer-facing UIs (dashboards, apps)
- Founder dashboard (business health, actions)
- Idea pipeline UI (opportunities, experiments)
- APIs, webhooks, reports, notifications

Principles:

- L4 should be **thin**:
  - It shows L0 state.
  - It triggers L2 flows.
  - It lets humans update L3 (goals & preferences).
- Avoid burying core logic in the UI whenever possible.

In practice:

- UI = **view + controls**.
- The real “brain” lives in L0–L2, guided by L3.

---

### Human-in-the-Loop & Safety Patterns

Agents and flows should be designed assuming **humans own the final say** on irreversible or high-risk actions.

Patterns:

- **Approval steps as L2 states**:
  - Flows move items to a `PENDING_APPROVAL` state in L0 (e.g. `summary_state`, `email_state`).
  - L4 surfaces these to humans with clear options (approve, modify, reject).
  - Human decisions are logged as events (e.g. `SUMMARY_APPROVED`, `EMAIL_REJECTED`).

- **Guardrails as L3 constraints**:
  - E.g. “Never auto-send outbound emails without approval.”
  - E.g. “Never propose discounts below X% without explicit override.”

- **Dual control (optional)**:
  - For critical operations, require agreement between:
    - A primary agent and a checker agent, or
    - An agent and a human approver.

---

### Observability

To debug and improve the OS, **every flow and agent action is observable via L0 events**.

Standard event types include:

- `FLOW_STARTED`, `FLOW_STEP_COMPLETED`, `FLOW_FAILED`
- `AGENT_CALLED`, `AGENT_OUTPUT_WRITTEN`
- `HUMAN_APPROVAL_REQUESTED`, `HUMAN_APPROVED`, `HUMAN_REJECTED`
- Domain-specific events (e.g. `LEAD_CREATED`, `SUMMARY_PUBLISHED`)

Every event includes:

- **Correlation IDs**:
  - Flow instance ID
  - Primary entity IDs (e.g. lead ID, idea ID, user ID)
  - Tenant ID
- Minimal **diagnostic context**:
  - Which agent/flow/prompt version was used
  - Which L3 strategy/constraint versions were in effect

This lets you answer questions like:

- “Why did we send this email to this lead?”
- “Why did this idea get killed?”
- “What changed in the business since last week’s summary?”

---

## 2. Domains on the Shared OS

The same 5-layer OS supports three major domains. Each has a **slice of L0**, a set of **L1 agents**, **L2 flows**, **L3 intent**, and **L4 interfaces**.

### 2.1 Product Domain – Delivering Value

**Example product:** “Inbox Spend Guardian”  
Connect inbox → parse invoices/receipts → show recurring spend → recommend savings.

- **L0 (product slice)**  
  - Domain tables: `product.users`, `product.email_messages`, `product.vendors`, `product.transactions`, `product.recommendations`, plus shared `events`.
- **L1 agents**
  - Inbox Ingestion Agent (pull candidate emails)
  - Email Parsing Agent (extract vendor, amount, frequency, etc.)
  - Spend Aggregation Agent (compute monthly/annual spend, rollups)
  - Recommendation Agent (flag waste, renewals, redundancies)
  - Narrative Agent (generate human-readable summary)
- **L2 flows**
  - *Initial scan* (on inbox connect)
  - *Daily sync* (new emails → parse → recompute insights → alerts if needed)
- **L3 intent (product-specific)**
  - Scan depth (3/6/12 months)
  - Definition of “high value” or “wasteful” spend
  - User preferences for alerts and aggressiveness of recommendations
- **L4 interfaces**
  - Customer dashboard (spend, vendors, renewals, recommendations)
  - “Show which emails we used” trust/transparency view
  - Settings for connection + notifications

---

### 2.2 Operations / GTM Domain – Running the Business

Internal OS for running and growing the company.

- **L0 (ops slice)**  
  - Domain tables: `ops.leads`, `ops.accounts`, `ops.subscriptions`, `ops.billing`, `ops.gtm_events`, `ops.support_tickets`, plus shared `events`.
- **L1 agents**
  - Lead Enrichment & Scoring Agent
  - Outbound Email Drafting Agent
  - Customer Health / Retention Agent
  - Finance Rollup Agent (MRR, churn, runway)
  - Founder Summary Agent (turns metrics/events into a narrative + actions)
- **L2 flows**
  - *Lead → Paid*:
    - New lead → enrich → score → draft outreach → human approval → send
  - *Retention Watch*:
    - Daily/weekly → scan usage/churn risk → propose CS actions → approval
  - *Weekly Founder Summary* (see Minimal Slice section for full detail):
    - On schedule → gather metrics + events → generate summary + recommended actions → human review → publish
- **L3 intent (ops/GTM)**
  - ICP definition and disqualifiers
  - Pricing bounds and acceptable discounting
  - Time constraints (e.g. founder only wants to spend N hours/week on GTM)
- **L4 interfaces**
  - **Founder Dashboard – Business tab**:
    - Topline metrics (MRR, active customers, churn, runway)
    - “What changed this week”
    - “This week’s recommended moves”
    - Problems & opportunities list
    - “Weekly Founder Summary” cards with approval/status

---

### 2.3 Ideas & Validation Domain – What to Build Next

Runs on the same OS; just a different slice of L0 and a few specialized agents.

- **L0 (ideas slice)**  
  - Domain tables:
    - `ideas.signals` (market/user signals)
    - `ideas.ideas` (problem statements, ICP, scores, state)
    - `ideas.experiments` (test definitions, results, verdicts)
- **L1 agents**
  - Signal Ingestion Agent (pulls from feeds, job posts, social, internal feedback)
  - Clustering / Theme Agent (groups related signals)
  - Problem Mapper Agent (turns themes into clear problems)
  - Opportunity Scoring Agent (pain × agent-fit × founder-fit)
  - Experiment Designer Agent (cheap tests)
  - Experiment Interpreter Agent (pass/fail/inconclusive)
- **L2 flows** (inside the Business Orchestrator)
  - **Weekly Discover & Compress**:
    - Trigger: `IDEA_DISCOVERY_DUE`
    - Steps: ingest signals → cluster → map problems → score ideas
  - **Experiment Loop**:
    - Trigger: `IDEA_EXPERIMENT_REVIEW_DUE` or manual
    - Steps: choose top ideas (within constraints) → design & run tests → interpret → mark ideas as Killed / Parked / Greenlit
- **L3 intent (ideas)**
  - Strategy constraints: B2B-only, ARPU thresholds, avoid regulated industries, max 1–2 active experiments, etc.
  - Personal constraints: categories you don’t want to work in, team-size limits.
- **L4 interfaces**
  - **Founder Dashboard – Ideas tab**:
    - Kanban: Backlog → Exploring → Experimenting → Validated → Killed
    - Idea cards: problem statement, who it’s for, scores, state, link to evidence
    - Side panel: underlying signals, active experiments, results

#### Simple Idea Selection Framework (Agent-Native Fit)

For new product ideas, the Ideas domain applies a simple 4-step check:

1. **Transformation Check (fast gate)**  
   “We take **[inputs]**, apply **[capabilities]**, and deliver **[valuable outcomes]** for **[who]**.”  
   If this can’t be written crisply in one sentence, the idea stays in rough notes.

2. **Hard Filters (pass/fail only)**  
   The idea must pass all of:
   - **Market & ARPU**: B2B, with realistic ARPU ≥ a target floor (e.g. $50–$100+/month).  
   - **Regulation & Safety**: no heavily regulated, catastrophic-error domains; mistakes should be reversible.  
   - **Agent-Suitable Work**: majority of work is digital, recurring, and agent-suitable (text/structured data, coordination).  
   - **Founder Fit**: uses some existing strengths; you’re okay thinking about it for a few years.  
   Failing any of these means the idea is not pursued.

3. **Core Scoring (just 4 axes, 1–3 each)**  
   For ideas that pass filters, score each 1–3 (low/medium/high):
   - **Pain & Frequency** – how painful and how often (1 = mild/rare, 3 = brutal and weekly/daily).  
   - **Agent Leverage** – how much of the recurring workflow agents can own with today’s models  
     (1 ≈ <30%, 2 ≈ 30–70%, 3 ≈ 70%+).  
   - **Data Surface & Access** – how easily agents can reach the data (1 = messy/manual uploads,  
     3 = clean, stable, API-accessible systems like Gmail/Stripe/HubSpot/Notion).  
   - **Repeatability & Compounding** – is this a recurring workflow across accounts (1 = one-offs,  
     3 = repeated weekly/daily with cross-account learning potential).  
   Sum the scores (max 12). Ideas with **9–12** are strong candidates; **≤7** usually don’t move forward.

   Trust/risk, GTM practicality, and founder advantage can be captured as freeform notes rather than extra scores.

4. **Minimal Validation Path**  
   For ideas that score well:
   - **Signal test** – landing page or targeted outreach; look for real “that’s me” responses, not just polite interest.  
   - **Workflow test** – manually or semi-automate the core workflow for 5–10 real users and confirm the end-to-end transformation is valuable.  
   - **Agent ownership test** – gradually move steps from human → agent, aiming for ~70% of recurring work handled by agents with acceptable quality and manageable errors.  

Only ideas that **pass filters**, **score well**, and **survive validation** graduate into the Product domain to be fully built on the agent-native OS.

When an idea reaches **Validated / Greenlit**, it hands off to the **Product Domain** to spin up a product-level L0/L1/L2/L4 within the same OS.

---

## 3. Minimal Slice: Weekly Founder Summary (Walking Skeleton)

To keep the initial implementation simple and high-value, the first slice of the OS is the **Weekly Founder Summary** flow in the Ops/GTM domain.

**Why this slice:**

- Immediately useful to the founder (business situational awareness).
- Exercises **all five layers** end-to-end.
- Can start with a small set of entities and agents.
- Doesn’t require external customer-facing UI to deliver value.

### 3.1 L0 for the Minimal Slice

Entities:

- `ops.accounts` (basic customer records; can start minimal)
- `ops.subscriptions` (MRR, plan, status)
- `ops.metrics_snapshots`:
  - Aggregate metrics (MRR, new MRR, churned MRR, active customers, runway, etc.) at a point in time.
- `ops.founder_summaries`:
  - Weekly summary records:
    - Period (e.g. week ending date)
    - Narrative text
    - Key metrics
    - Recommended actions
    - State (`DRAFT`, `PENDING_APPROVAL`, `PUBLISHED`, `ARCHIVED`)
- Shared `events`:
  - `METRICS_SNAPSHOT_CREATED`
  - `FOUNDERSUMMARY_GENERATED`
  - `FOUNDERSUMMARY_APPROVAL_REQUESTED`
  - `FOUNDERSUMMARY_APPROVED`
  - `FOUNDERSUMMARY_PUBLISHED`

The raw data backing `metrics_snapshots` (e.g. `subscriptions`) can be manually populated or later fed by other flows.

### 3.2 L1 Agents for the Minimal Slice

- **Metrics Aggregation Agent**:
  - **Reads**: `ops.accounts`, `ops.subscriptions`, relevant `ops.gtm_events`.
  - **Does**: compute a summary of key business metrics for the week.
  - **Writes**: `ops.metrics_snapshots` + `METRICS_SNAPSHOT_CREATED` event.

- **Founder Summary Agent**:
  - **Reads**: latest `ops.metrics_snapshots`, recent `events` (notable changes), L3 intent (targets, thresholds).
  - **Does**: generate a narrative summary + list of recommended actions.
  - **Writes**: a new `ops.founder_summaries` row in `DRAFT` state + `FOUNDERSUMMARY_GENERATED` event.

The aggregation logic can be partly deterministic; the agent is mainly used for explanation and prioritization.

### 3.3 L2 Flow: Weekly Founder Summary

Flow: `weeklyFounderSummaryFlow`

- **Trigger**:
  - Time-based: once per week (e.g. Monday at 9am).
- **Steps**:
  1. Fetch L3 intent for business KPIs (targets, thresholds, what “good” looks like).
  2. Call **Metrics Aggregation Agent** → write `metrics_snapshots` + event.
  3. Call **Founder Summary Agent** → write `founder_summaries` in `DRAFT`.
  4. Transition summary to `PENDING_APPROVAL` and emit `FOUNDERSUMMARY_APPROVAL_REQUESTED`.
  5. Wait for human approval via UI:
     - On **approve**:
       - Update summary state to `PUBLISHED`.
       - Emit `FOUNDERSUMMARY_APPROVED` + `FOUNDERSUMMARY_PUBLISHED`.
       - Optionally dispatch notifications (email, Slack).
     - On **reject or edit**:
       - Write updated content, log `FOUNDERSUMMARY_REVISED` or `FOUNDERSUMMARY_REJECTED`.

All steps are logged via standard `FLOW_*` and `AGENT_*` events with correlation IDs.

### 3.4 L3 Intent for the Minimal Slice

Config objects (scoped to the founder’s tenant):

- `businessTargets`:
  - Target MRR, growth rate, acceptable churn.
- `businessAlerts`:
  - Rules for what counts as “red/yellow/green” for each metric.
- `summaryPreferences`:
  - Level of detail (high-level vs deep dive).
  - Tone (concise, more narrative).
  - Maximum number of recommended actions per week.

Agents and the flow read these configs on each run, and the versions are recorded in the events (so you can reconstruct decisions under a particular strategy).

### 3.5 L4 Interface for the Minimal Slice

Minimal **Founder Dashboard – Business tab**:

- Shows:
  - Latest `metrics_snapshot` (MRR, new MRR, churn, active customers, runway).
  - Latest `founder_summary`:
    - Narrative.
    - Recommended actions.
    - State (`DRAFT`, `PENDING_APPROVAL`, `PUBLISHED`).
- Allows:
  - Approving or editing the summary (human-in-the-loop).
  - Marking actions as done (later could be another flow).

No need for complex navigation or multi-user workflows in v1; this is a single-founder control surface.

---

## 4. Implementation Playbook

Use this section while actually building.

### Step 0 – Implement the Minimal Slice First

1. Implement L0 entities and events for the Weekly Founder Summary.
2. Implement the two core agents:
   - Metrics Aggregation Agent
   - Founder Summary Agent
3. Implement the `weeklyFounderSummaryFlow` orchestrator.
4. Implement minimal L3 configs (`businessTargets`, `businessAlerts`, `summaryPreferences`).
5. Implement the thin L4 founder dashboard for:
   - Viewing the latest summary + metrics
   - Approving/editing the summary

Only after this loop is working end-to-end, expand to other flows/domains.

---

### Step 1 – Define the Core Transformations

Phrase the system’s purpose:

> “We take **[inputs]**, apply **[capabilities]**, and deliver **[valuable outcomes]** for **[who]**.”

Do this for:

- The main product
- The overall business
- The ideas/validation pipeline

For the **minimal slice**:

- Inputs: subscription data, account list, recent GTM events.
- Capabilities: metric aggregation, change detection, narrative generation, prioritization.
- Outcomes: a weekly founder summary with metrics + prioritized actions for the founder.

If this is fuzzy, stop and clarify before you build.

---

### Step 2 – Design L0 (Memory) First

Before prompts, before screens:

1. List the **entities** you need in each domain (users, vendors, leads, ideas, experiments, etc.).
2. Decide which **events** to log (signups, scans, emails, tests, decisions).
3. Sketch a schema: tables/objects and relationships.
4. Define **domain slices**, **multi-tenancy**, and **ownership** for each entity and event.

Litmus test:

> “If all agents and UIs were turned off, could I still reconstruct what’s going on from L0?”

If yes → your L0 is viable.

---

### Step 3 – Define L1 Agents as Job Descriptions

For each agent:

- **Role:** “You are a ___.”
- **Reads:** which L0 entities/fields, which external APIs?
- **Does:** summarize, classify, extract, compute, generate, etc.
- **Writes:** which new or updated records, which events?
- **Constraints:** which L3 configs / boundaries must be respected?

Example:

> “You are a Founder Summary Agent.  
> You read the latest business metrics snapshot and notable events, along with business targets and alert thresholds from L3.  
> You generate a concise weekly summary and 3–7 recommended actions, and write a `founder_summary` record into L0.”

Keep agents narrow, testable, and composable. Do not let them orchestrate other agents.

---

### Step 4 – Wire Flows in L2 (Orchestrators)

Identify essential flows:

- Product: onboarding, initial data ingestion, daily sync, reporting.
- Ops: lead → paid, retention checks, weekly founder summary.
- Ideas: weekly discovery, experiment execution/review.

For each flow, define:

- Trigger (time-based, event-based, user action).
- Sequence of agent calls.
- Data written at each step (updates to L0).
- Where human review/approval occurs.
- Which events are emitted.

Implement flows in dedicated orchestrator modules (e.g. `spendOrchestrator`, `businessOrchestrator`), not scattered across controllers.

---

### Step 5 – Encode L3 Intent Explicitly

Turn your strategy and preferences into configuration and rules:

- ICPs, pricing bands, exclusion criteria.
- Desired business model (ARPU, frequency, headcount limits).
- Safety and autonomy boundaries for agents.

Expose these as:

- Config objects / environment variables.
- Simple “strategy docs” that agents can read.
- Settings screens for you (and later, customers) to update preferences.

Agents and orchestrators should always consult these when scoring ideas, picking leads, or suggesting actions. Record the **intent version** in events for traceability.

---

### Step 6 – Build Thin L4 Interfaces

Start with three core surfaces (after the minimal slice works):

1. **Customer Dashboard** for the main product.
2. **Founder Dashboard – Business tab**
   - MRR, customers, churn, runway.
   - “What changed this week.”
   - “This week’s recommended moves.”
   - Problems & opportunities.
3. **Founder Dashboard – Ideas tab**
   - Idea pipeline.
   - New signals & top candidates.
   - Active experiments and their status.

Principle: UI = **view + controls**, not the real “brain.”  
The real work happens in L0–L2.

---

### Step 7 – Run, Observe, and Evolve

Once the OS is live:

- Use **event logs** to see where flows break or stall.
- Tighten L1 prompts/logic where agents misinterpret or hallucinate.
- Adjust L2 flows (order, branching, retries) based on real behavior.
- Update L3 goals/constraints as your strategy shifts.
- Extend L4 only when you need new levers or visibility.
- Expand beyond the minimal slice to additional flows/domains **only when** the core loop is stable.

Evolve layer-by-layer instead of bolting random features on top.

---

## 5. Quick Glossary

- **L0 – Identity & Memory**: database + event log; the brain.
- **L1 – Agents**: autonomous workers performing narrow tasks with clear I/O.
- **L2 – Orchestrators**: managers running multi-step workflows and handling side effects.
- **L3 – Intent Layer**: encoded goals, constraints, and preferences, with versions.
- **L4 – Interfaces**: dashboards, apps, and APIs that expose and steer the system.
- **Product Domain**: everything directly delivering value to customers.
- **Ops/GTM Domain**: internal workflows to sell, support, and retain.
- **Ideas Domain**: discovery and validation of new products/opportunities.
- **Minimal Slice**: the first, smallest end-to-end implementation (Weekly Founder Summary) that exercises all five layers.

This README should give any new collaborator enough context to:

- Understand how the system is structured.  
- Know where agents, flows, and intent fit in.  
- See how product, ops, and idea generation all run on one shared OS.  
- Contribute without accidentally working “against” the architecture.  
- Extend the system beyond the minimal slice in a controlled, observable way.