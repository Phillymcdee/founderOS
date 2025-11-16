# Founder Portfolio Strategy on FounderOS

This document describes how to use FounderOS as a personal operating system for running a small portfolio of agent‑native products with high profit and minimal ongoing human time.

The concrete target:

- **Profit goal**: ~$1M+ per year  
- **Time budget**: ~\<15 hours/week of mandatory work, no standing meetings  
- **Approach**: A small, capped portfolio of agent‑native products running on a shared OS

---

## 1. Economic Target and Implied Scale

- **Net profit target**: \$1M+/year  
- **Assumed net margin**: ~80–85% (no employees, very low variable costs)  
- **Implied ARR**: roughly \$1.2–\$1.4M/year

A few example mixes that hit this scale:

- One flagship B2B product at \$600–\$900k ARR  
- 1–3 supporting products at \$100–\$300k ARR each  
- Total active customers across the portfolio on the order of:
  - ~350–400 customers at \$300 MRR, or  
  - ~150–250 customers at \$500–\$800 MRR

The key is not the exact mix, but that **most revenue comes from high‑ARPU, agent‑native products** instead of low‑margin services.

---

## 2. Portfolio Shape and Constraints

To preserve time ownership and simplicity, the portfolio has hard constraints:

- **Max active products**: ≤ 4 at any given time  
- **No services**:
  - No consulting or bespoke projects
  - No products whose success requires live calls or ongoing manual work
- **Low‑touch GTM**:
  - Self‑serve or async sales (email, content, light outbound)
  - No enterprise sales cycles that depend on you being “in the loop”
- **Automation first**:
  - Each product must be able to reach “steady state” where **agents own ≥70% of recurring work**
  - Human involvement is mainly approvals, edge cases, and strategy

---

## 3. Product Selection Criteria (Agent‑Native Fit)

New product ideas must pass strict filters before they graduate into the Product domain. These refine the framework in `READMEv2.md` for this portfolio goal.

**Must‑have filters:**

- **Market & ARPU**:
  - B2B or clearly monetizable niche
  - Target ARPU **≥ \$150/month** (higher is better)
- **Agent‑Suitable Work**:
  - Majority of the value comes from digital, recurring workflows over text / structured data / APIs
  - Clear path to agents owning ~70%+ of the ongoing workflow
- **Time Ownership**:
  - Once stable, each product must be operable in **≈1 hour/week or less** of your attention
  - No critical paths that depend on you responding in real time
- **Founder Fit**:
  - Uses existing strengths and interests
  - You are okay thinking about it for years, but not *personally* doing the work

**Never build:**

- Heavily regulated, catastrophic‑error domains (medical, securities, etc.)  
- Products that require high‑touch onboarding, custom integrations, or white‑glove support  
- Anything where the “product” is really your personal labor packaged as a service

These map directly into **L3 intent** (see `businessIntent` and `ideaIntent` configs in `src/l3/`):

- ARPU floors and disallowed categories  
- Maximum human hours per product  
- Guardrails on autonomy and side effects (e.g. when agents may act without approval)

---

## 4. Operating Model on FounderOS

FounderOS is both the substrate and the control surface for the portfolio.

### 4.1 Domains per Product

For each product in the portfolio:

- **Product domain (L0/L1/L2/L4)**:
  - Product‑specific entities (e.g. users, vendors, orders, interviews)
  - Product agents (parsing, monitoring, recommendations, content, etc.)
  - Product orchestrators (onboarding, daily sync, reporting)
  - Product UI (customer dashboard, settings, trust views)
- **Ops domain slice**:
  - Accounts, subscriptions, billing, core metrics
  - Events feeding into the weekly founder summary
- **Intent (L3)**:
  - Product‑specific ICP, pricing ranges, safety/autonomy rules
  - Per‑product preferences (tone, aggressiveness, SLAs)

All products share:

- The same **L0** (single, multi‑tenant memory)  
- A common pool of **L1 agents** where possible  
- Reusable **L2 flow patterns** (onboarding, sync, summary, alerts)  
- A single **Ops / Founder dashboard** that spans the whole portfolio

### 4.2 Your Weekly Job

Once flows are in place, your recurring work collapses to:

- Reviewing the **Weekly Founder Summary** (per tenant / portfolio)
- Approving or editing important actions (where L3 requires human approval)
- Adjusting **L3 intent**:
  - Pricing bands, ARPU targets
  - ICP definitions and exclusions
  - Autonomy and safety rules for agents
- Deciding **which ideas to graduate** from the Ideas domain into full products

If the system works, almost all other work is:

- Done by agents, or  
- Triggered asynchronously by you when you feel like it (not on a schedule)

---

## 5. Phased Execution Plan

This is a high‑level sequence for reaching the portfolio goal.

### Phase 1 – Nail One Flagship Product

- Choose a high‑ARPU, agent‑native B2B product (e.g. Inbox Spend Guardian / Founder Ops Copilot style)
- Use the Ideas domain to refine ICP and validate the opportunity
- Build the full L0–L4 slice for this product
- Drive it toward **\$500k–\$800k ARR** while:
  - Incrementally increasing agent ownership of workflows
  - Reducing required founder hours to ~5–8 hours/week

### Phase 2 – Harden FounderOS as a Portfolio OS

- Make sure:
  - Weekly founder summary is reliable and useful
  - Events and metrics give you portfolio‑level visibility
  - Business and idea intent configs reflect your real constraints
- Tighten automation around:
  - Billing and subscriptions across products
  - Support triage and response
  - Basic GTM loops (outreach, follow‑ups, content)

### Phase 3 – Add One Product at a Time

- Use the Ideas domain to continuously ingest signals and generate candidates
- For each new idea:
  - Apply the hard filters and scoring from `READMEv2.md` and this document
  - Run signal / workflow / agent‑ownership tests
  - Only promote to Product domain if:
    - It can be high‑margin and agent‑native
    - It can be run with ≈1 hour/week of your time in steady state
- Grow to **2–4 products**, pruning or merging underperformers

### Phase 4 – Optimize and Simplify

- Continually:
  - Raise ARPU where justified
  - Increase agent ownership of workflows
  - Remove features and obligations that re‑introduce manual work
- Use events and summaries to decide:
  - Which products to double down on
  - Which to sunset or sell
  - Where to adjust L3 intent to better protect your time

---

## 6. Definition of Success

This portfolio strategy is “working” when:

- Combined products generate **\$1M+ in annual profit** at ~80–85% margins  
- You spend **\<15 hours/week** on:
  - Reviewing summaries
  - Adjusting intent and strategy
  - Occasionally building or refactoring flows
- No single product depends on your ongoing manual labor to survive
- FounderOS itself feels like your **personal operating system for capital allocation and intent**, not another app that needs babysitting.


