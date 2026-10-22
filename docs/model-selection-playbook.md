# Model Selection Playbook

> Guidance for choosing models by phase and task type.
> 
> **No model is required.** These are recommendations, not requirements.

---

## Selection by Phase

### Planning & Architecture

**Recommended capabilities:**
- Extended reasoning / thinking mode
- Large context window (analyze multiple files)
- Strong at structured output (specs, plans)

**Why:** Planning requires understanding full system context and making architectural decisions.

**Examples:** Models with "thinking" or "reasoning" modes, larger context variants.

---

### Code Implementation

**Recommended capabilities:**
- Fast iteration speed
- Good at code completion
- Tool/function calling (for verification commands)

**Why:** Implementation involves many small changes with frequent verification cycles.

**Examples:** Speed-tier models, code-specialized variants.

---

### Refactoring

**Recommended capabilities:**
- Large context window (see before/after)
- Pattern recognition
- Consistent style application

**Why:** Refactoring requires maintaining consistency across large code changes.

**Examples:** Standard or long-context variants.

---

### Debugging

**Recommended capabilities:**
- Extended reasoning (hypothesis generation)
- Good at reading stack traces
- Context for error patterns

**Why:** Debugging requires hypothesis testing and pattern matching.

**Examples:** Reasoning-focused models.

---

### Code Review

**Recommended capabilities:**
- Large context (review full PR diff)
- Security pattern knowledge
- Style consistency checking

**Why:** Review requires seeing both code and context together.

**Examples:** Long-context variants.

---

## Capability Tiers

| Tier | Characteristics | Best For |
|------|-----------------|----------|
| **Fast** | Quick responses, lower cost | Implementation, iteration |
| **Standard** | Balanced speed/quality | Most tasks |
| **Reasoning** | Extended thinking, slower | Planning, debugging, architecture |
| **Long-context** | >100k tokens | Review, refactoring |

---

## Selection by ERP Service & Module (Futane Agro Domain)

For the Futane Agro ERP codebase, task demands vary heavily by service. Choose models according to this domain-specific matrix:

### 1. Financial & GST Invoicing Engine
*Files: `InvoiceService.java`, `GstLedger.java`, `Payment.java`, `GSTCalculationUtil.java`*
- **Recommended Tier**: **Reasoning / High-Precision** (e.g., Claude 3.5 Sonnet, GPT-4o, o3-mini)
- **Why**: Zero-tolerance on modifying GST algorithms (CGST, SGST, IGST) or invoice numbering. Requires exact arithmetic verification and absolute consistency with Indian tax guidelines.
- **Rule**: Never use low-parameter or speed-tier models when touching financial ledgers.

### 2. AI Agricultural Advisory & Farmer Research
*Files: `AiResearchAgentService.java`, Google ADK LLM Agents*
- **Recommended Tier**: **Fast Multimodal** (e.g., Gemini 1.5 Flash, Gemini 2.0 Flash)
- **Why**: Fast interactive latency (< 1s), cost-effective streaming tokens, and multilingual capability (Marathi, Hindi, English) for agricultural domain queries.

### 3. Angular 17+ Frontend & UI/UX Design System
*Files: `frontend/src/app/components/**`, `header.component.ts`, `dashboard.component.html`*
- **Recommended Tier**: **Aesthetic & Frontend-Specialized** (e.g., Claude 3.5 Sonnet, GPT-4o)
- **Why**: Enforces rich CSS design tokens, glassmorphism, responsive grid layouts, and strict RxJS memory hygiene (`takeUntil(this.destroy$)`, `shareReplay({ bufferSize: 1, refCount: true })`).

### 4. Database & ORM (PostgreSQL 16 Enterprise)
*Files: `schema.sql`, JPA Entities (`@Table(name = "t_core_...")`), Liquibase changelogs*
- **Recommended Tier**: **Long-Context / Schema-Strict** (e.g., Claude 3.5 Sonnet, Gemini 1.5 Pro)
- **Why**: The database contains 41+ tables with strict foreign key constraints, soft-delete clauses (`@Where(clause = "is_active = true")`), and multi-tenant customization columns. Requires seeing the full entity relational graph.

### 5. Authentication, MFA & Security Gateway
*Files: `JwtRequestFilter.java`, `FirebaseMfaService.java`, `SecurityConfig.java`*
- **Recommended Tier**: **Reasoning / Security-Focused** (e.g., Claude 3.5 Sonnet, o1 / o3-mini)
- **Why**: Handles OWASP compliance, token replay attack prevention (`t_mfa_used_tokens`), single-use backup recovery codes, and BCrypt salted hashing.

### 6. Production & Shift Planning (PPD / PPM)
*Files: `ProductionService.java`, `MachineMaster.java`, `CrateRejectLog.java`*
- **Recommended Tier**: **Standard Logic** (e.g., GPT-4o, Claude 3.5 Sonnet)
- **Why**: Involves batch capacity tracking, operator shift allocations, and material reconciliation formulas.

### 7. DevOps & Observability
*Files: `docker-compose.uat.yml`, `prometheus.yml`, Grafana dashboard JSONs*
- **Recommended Tier**: **Fast / Standard** (e.g., Claude 3.5 Haiku, Gemini Flash, GPT-4o-mini)
- **Why**: Configuration syntax (YAML, PromQL, Dockerfile) is standardized and does not require complex multi-step reasoning.

---

## Anti-Patterns

❌ **Using reasoning models for simple edits** — Overkill, slow, expensive

❌ **Using fast models for architecture** — Insufficient depth for complex decisions

❌ **Ignoring context limits** — Leads to quality degradation

❌ **Forcing a specific model** — Breaks model-agnosticism

---

## Model Switching Mid-Session

**When to switch:**
- Context is getting polluted (approaching 50%)
- Task type changes significantly (planning → implementation)
- Current model struggling with task type

**How to switch:**
1. Create state snapshot
2. Update STATE.md with current position
3. Start fresh session with appropriate model
4. Load STATE.md to resume

---

## GSD Model-Agnostic Principle

GSD works with any capable LLM. The methodology compensates for model differences through:

1. **Structured plans** — Reduce ambiguity
2. **Explicit verification** — Catch errors regardless of model
3. **State persistence** — Enable model switching
4. **Fresh context** — Prevent accumulation issues

Choose models based on task needs, not methodology requirements.

---

*See PROJECT_RULES.md for canonical rules.*
*See docs/runbook.md for operational procedures.*
