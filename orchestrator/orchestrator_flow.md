# Smart Incident Prevention Orchestrator - Flow Specification

**System**: IBM watsonx Orchestrate  
**Version**: 1.0  
**Date**: January 30, 2026  
**Classification**: Enterprise Production

---

## Executive Summary

The Smart Incident Prevention Orchestrator is the central coordination engine for a multi-agent incident prevention system. It orchestrates three specialized agents—monitoring, analysis, and response planning—making intelligent routing decisions based on severity, confidence, and safety constraints. This orchestrator demonstrates true agentic behavior through conditional branching, escalation enforcement, and explainable decision-making.

**Key Characteristics**:
- **Agentic, not scripted**: Dynamic routing based on agent outputs, not linear execution
- **Safety-first**: Multiple checkpoints prevent unsafe automation
- **Explainable**: Every routing decision is justified and auditable
- **Deterministic**: Same inputs produce same routing decisions

---

## Orchestration Philosophy

### What This Orchestrator Does
- **Agent Coordination**: Invokes specialized agents in intelligent sequences
- **Decision-Making**: Routes flow based on severity, confidence, and safety criteria
- **Escalation Management**: Enforces human-in-the-loop requirements
- **Safety Enforcement**: Blocks execution when confidence or safety thresholds violated
- **State Management**: Tracks orchestration state across agent invocations

### What This Orchestrator Does NOT Do
- Does NOT perform detection, diagnosis, or response planning (delegated to agents)
- Does NOT execute remediation actions (hands off to execution systems)
- Does NOT bypass safety controls or override agent decisions
- Does NOT operate as a linear pipeline (conditional routing required)

---

## Orchestration Flow

### Phase 1: Entry Point & Monitoring

**Trigger**: System signals (logs, alerts, metrics) arrive from monitoring infrastructure

**Actions**:
1. Receive monitoring inputs via orchestrator entry point
2. Validate input schema (logs, alerts, metrics present)
3. Invoke `monitoring_agent` with complete input payload
4. Wait for monitoring agent response

**Output**: Monitoring assessment with risk classification (NONE, LOW, MEDIUM, HIGH)

**Decision Point**: Evaluate risk level
- **IF** `risk_level = NONE` → **TERMINATE** (no incident detected)
- **IF** `risk_level = LOW` → **TERMINATE** (below escalation threshold)
- **IF** `risk_level = MEDIUM` OR `risk_level = HIGH` → **ESCALATE** to Phase 2

**Justification**: Only escalate signals that cross severity threshold. Avoids unnecessary diagnostic work for routine events.

---

### Phase 2: Diagnostic Escalation & Analysis

**Trigger**: Monitoring agent returned `risk_level ≥ MEDIUM`

**Actions**:
1. Extract escalation payload from monitoring agent output
2. Validate escalation payload schema (escalation_id, signals, risk_level present)
3. Invoke `analysis_agent` with escalation payload
4. Wait for diagnostic response

**Output**: Diagnostic report with root cause hypotheses, refined severity, impact assessment, confidence score

**Decision Point 1**: Validate diagnostic confidence
- **IF** `diagnostic_confidence < 0.50` → **FLAG** uncertainty, **FORCE** human-in-the-loop
- **IF** `diagnostic_confidence ≥ 0.50` → **CONTINUE** to severity evaluation

**Decision Point 2**: Evaluate refined severity
- **IF** `refined_severity = NONE` OR `refined_severity = LOW` → **DOWNGRADE** and **TERMINATE**
  - Justification: Analysis determined signal was false positive or non-actionable
- **IF** `refined_severity = MEDIUM` OR `refined_severity = HIGH` OR `refined_severity = CRITICAL` → **ESCALATE** to Phase 3

**Justification**: Respect analysis agent's severity refinement. Analysis has deeper context than monitoring and may downgrade or upgrade severity. Terminate early if downgraded to avoid unnecessary response planning.

---

### Phase 3: Response Planning

**Trigger**: Analysis agent returned `refined_severity ≥ MEDIUM` with sufficient confidence

**Actions**:
1. Extract diagnostic report from analysis agent output
2. Validate diagnostic schema (diagnosis_id, root_cause_hypotheses, impact_assessment present)
3. Invoke `response_agent` with diagnostic report
4. Wait for response plan

**Output**: Response plan with strategy, selected playbooks, human-in-loop classification, escalation decisions, execution payload

**Decision Point 1**: Validate response plan completeness
- **IF** response plan missing critical fields → **HALT** orchestration, **FLAG** error
- **IF** response plan complete → **CONTINUE**

**Decision Point 2**: Evaluate human-in-the-loop requirement
- Extract `human_in_loop.classification` from response plan
- **IF** `classification = "automated"` → **ALLOW** downstream automation (subject to safety checks)
- **IF** `classification = "semi-automated"` → **REQUIRE** human approval for specific actions
- **IF** `classification = "human-led"` → **BLOCK** automation, **REQUIRE** full human control

**Decision Point 3**: Evaluate response strategy urgency
- Extract `response_strategy.strategy_type` from response plan
- **IF** `strategy_type = "immediate"` → **SET** priority P0, **ESCALATE** to emergency responders
- **IF** `strategy_type = "urgent"` → **SET** priority P1, **ESCALATE** to on-call teams
- **IF** `strategy_type = "planned"` → **SET** priority P2, **ROUTE** to normal workflow
- **IF** `strategy_type = "monitoring"` → **SET** priority P3, **ROUTE** to watch list

---

### Phase 4: Downstream Handoff

**Trigger**: Response plan generated with execution requirements

**Actions**:
1. Construct handoff payload containing:
   - Complete orchestration trace (monitoring → analysis → response)
   - Response plan execution payload
   - Human-in-the-loop requirements
   - Escalation targets and priority
   - Safety controls and pre-execution checks
   - Monitoring requirements

2. Determine handoff destination:
   - **IF** ticketing required → Route to `ticketing_agent` or ITSM system
   - **IF** automated execution allowed → Route to `action_execution_agent` (with safety controls)
   - **IF** human approval required → Route to approval workflow system

3. Prepare handoff metadata:
   - Orchestration run ID
   - Timestamp and duration
   - Agent invocation trace
   - Decision audit trail

**Output**: Handoff payload ready for downstream consumption

**Safety Checkpoint**:
- Verify all safety controls present in handoff payload
- Verify human-in-the-loop flags preserved
- Verify escalation targets identified
- **IF** any safety control missing → **BLOCK** handoff, **FLAG** orchestration error

---

### Phase 5: Orchestration Termination & Audit

**Trigger**: Handoff complete or early termination condition met

**Actions**:
1. Generate orchestration summary containing:
   - Final orchestration state (TERMINATED_NO_INCIDENT, TERMINATED_DOWNGRADED, COMPLETED_HANDOFF)
   - Agent invocation sequence and timing
   - Decision points and routing justifications
   - Severity progression (monitoring → analysis → response)
   - Confidence scores at each stage
   - Human-in-the-loop requirements
   - Final handoff destination

2. Record orchestration metadata:
   - Orchestration run ID
   - Start and end timestamps
   - Total duration
   - Agent invocation count
   - Decision branch taken at each checkpoint

3. Persist audit trail for compliance and retrospective analysis

4. Terminate orchestration cleanly

**Output**: Complete orchestration audit trail

---

## Decision Matrix

### Monitoring Agent Output → Next Action

| Risk Level | Confidence | Action | Justification |
|-----------|-----------|--------|---------------|
| NONE | Any | TERMINATE | No incident detected |
| LOW | Any | TERMINATE | Below escalation threshold |
| MEDIUM | ≥ 0.60 | ESCALATE to analysis | Warrants diagnostic investigation |
| MEDIUM | < 0.60 | FLAG uncertainty + ESCALATE | Low confidence requires human review |
| HIGH | ≥ 0.60 | ESCALATE to analysis | Requires immediate diagnostic work |
| HIGH | < 0.60 | FLAG uncertainty + ESCALATE | High severity despite low confidence |

### Analysis Agent Output → Next Action

| Refined Severity | Diagnostic Confidence | Action | Justification |
|-----------------|---------------------|--------|---------------|
| NONE or LOW | Any | TERMINATE (downgrade) | False positive or non-actionable |
| MEDIUM | ≥ 0.50 | ESCALATE to response planning | Actionable incident with sufficient confidence |
| MEDIUM | < 0.50 | FLAG uncertainty + ESCALATE | Incident likely but requires human review |
| HIGH | ≥ 0.50 | ESCALATE to response planning | Urgent response required |
| HIGH | < 0.50 | FORCE human-in-loop + ESCALATE | High severity despite diagnostic uncertainty |
| CRITICAL | ≥ 0.50 | ESCALATE to response planning (P0) | Emergency response required |
| CRITICAL | < 0.50 | FORCE human-in-loop + ESCALATE (P0) | Emergency despite uncertainty |

### Response Agent Output → Next Action

| Strategy Type | Human-in-Loop | Automation Allowed | Handoff Destination |
|--------------|---------------|-------------------|---------------------|
| immediate | automated | Yes (with safety checks) | Action execution agent |
| immediate | semi-automated | Partial (approval required) | Approval workflow → execution |
| immediate | human-led | No | Ticketing + human responders |
| urgent | automated | Yes (with safety checks) | Action execution agent |
| urgent | semi-automated | Partial (approval required) | Approval workflow → execution |
| urgent | human-led | No | Ticketing + human responders |
| planned | Any | Workflow-based | Ticketing + scheduled actions |
| monitoring | Any | No (monitoring only) | Watch list + alerting |

---

## Error Handling & Recovery

### Agent Invocation Failures

**Scenario**: Agent fails to respond or returns error

**Orchestrator Actions**:
1. Log agent invocation failure with timestamp and error details
2. Attempt retry (max 2 retries with exponential backoff)
3. If retries exhausted:
   - HALT orchestration
   - FLAG orchestration error
   - ESCALATE to on-call SRE with error context
   - DO NOT proceed to next phase

**Justification**: Cannot make routing decisions without agent outputs. Fail safely with human escalation.

### Invalid Agent Output

**Scenario**: Agent returns response but schema validation fails

**Orchestrator Actions**:
1. Log schema validation error with details
2. Flag which required fields are missing
3. HALT orchestration
4. ESCALATE to agent development team for investigation
5. DO NOT attempt to infer missing data or proceed with incomplete information

**Justification**: Invalid outputs indicate agent malfunction. Operating on incomplete data risks unsafe decisions.

### Confidence Threshold Violations

**Scenario**: Agent returns low confidence score below safety threshold

**Orchestrator Actions**:
1. FLAG confidence violation
2. FORCE human-in-the-loop for all downstream decisions
3. CONTINUE orchestration but mark all automation as blocked
4. Escalate with clear uncertainty markers

**Justification**: Low confidence should not block orchestration but must prevent automated execution.

### Timeout Scenarios

**Scenario**: Agent does not respond within timeout window

**Orchestrator Actions**:
1. Log timeout event
2. Attempt graceful cancellation of agent invocation
3. HALT orchestration
4. ESCALATE to on-call with timeout context
5. Provide partial orchestration state for manual investigation

**Justification**: Timeouts indicate infrastructure issues. Cannot wait indefinitely; escalate for manual intervention.

---

## Safety Controls & Guardrails

### Pre-Execution Safety Checks

Before invoking any agent:
1. Validate input payload schema
2. Verify agent availability and health status
3. Check for concurrent orchestration runs (prevent duplicate processing)
4. Verify orchestration run ID uniqueness

### Inter-Agent Safety Checks

Between agent invocations:
1. Validate previous agent output schema
2. Verify confidence scores meet thresholds
3. Check for safety flags or error conditions
4. Validate routing decision against rules

### Pre-Handoff Safety Checks

Before downstream handoff:
1. Verify all required safety controls present in execution payload
2. Confirm human-in-the-loop requirements preserved
3. Validate escalation targets identified
4. Check for conflicting automation flags
5. Verify audit trail completeness

### Safety Invariants (Never Violated)

1. **Never skip diagnostic phase** for MEDIUM+ severity
2. **Never allow automation** when human-in-loop = "human-led"
3. **Never proceed** with invalid or incomplete agent outputs
4. **Never bypass** confidence threshold checks
5. **Never escalate** without clear justification in audit trail

---

## Observability & Monitoring

### Orchestration Metrics

Track and expose:
- Orchestration run count (total, per terminal state)
- Agent invocation count (per agent, per orchestration run)
- Decision branch distribution (terminate early vs complete handoff)
- Average orchestration duration (per terminal state)
- Error rate (agent failures, schema violations, timeouts)
- Safety checkpoint activation rate

### Orchestration Tracing

Each orchestration run must maintain:
- Unique orchestration run ID
- Start and end timestamps
- Agent invocation sequence with timing
- Decision point trace (which branch taken, why)
- Confidence score progression
- Severity progression
- Human-in-loop flag changes
- Error events and recovery actions

### Alerting Conditions

Alert on:
- Orchestration error rate > 5%
- Agent timeout rate > 2%
- Schema validation failure rate > 1%
- Safety checkpoint violations
- Confidence threshold violations in CRITICAL incidents
- Orchestration duration > expected threshold

---

## Orchestration State Model

### Terminal States

An orchestration run terminates in one of these states:

1. **TERMINATED_NO_INCIDENT**
   - Monitoring agent returned NONE or LOW risk
   - No further action required
   - Expected for majority of inputs

2. **TERMINATED_DOWNGRADED**
   - Analysis agent downgraded severity to NONE or LOW
   - False positive or non-actionable signal
   - Normal and expected outcome

3. **COMPLETED_HANDOFF**
   - Full orchestration complete
   - Response plan generated
   - Handoff to downstream systems successful
   - Expected for actionable incidents

4. **HALTED_ERROR**
   - Agent failure, timeout, or schema violation
   - Orchestration cannot continue safely
   - Human intervention required
   - Abnormal terminal state

5. **HALTED_SAFETY_VIOLATION**
   - Safety control check failed
   - Orchestration blocked to prevent unsafe operation
   - Requires investigation and remediation
   - Abnormal terminal state

### State Transitions

```
[START]
  ↓
[MONITORING_PHASE]
  ↓
[MONITORING_EVALUATION] → [TERMINATED_NO_INCIDENT] (if risk_level < MEDIUM)
  ↓
[DIAGNOSTIC_PHASE]
  ↓
[DIAGNOSTIC_EVALUATION] → [TERMINATED_DOWNGRADED] (if refined_severity < MEDIUM)
  ↓
[RESPONSE_PLANNING_PHASE]
  ↓
[RESPONSE_EVALUATION]
  ↓
[DOWNSTREAM_HANDOFF]
  ↓
[COMPLETED_HANDOFF]

(Any phase can transition to [HALTED_ERROR] or [HALTED_SAFETY_VIOLATION] on failure)
```

---

## Orchestration Example (High-Level)

**Input**: Database connection pool exhaustion signals

**Flow**:
1. **Monitoring Phase**: Risk classified as HIGH
   - Decision: ESCALATE to analysis (risk ≥ MEDIUM)

2. **Diagnostic Phase**: Root cause identified, severity confirmed HIGH
   - Diagnostic confidence: 0.92
   - Decision: ESCALATE to response planning (severity HIGH, confidence > 0.50)

3. **Response Planning Phase**: Urgent response strategy selected
   - Human-in-loop: semi-automated
   - Strategy: urgent (30-minute response window)
   - Decision: HANDOFF to approval workflow then execution

4. **Handoff Phase**: Execution payload prepared
   - Safety checks passed
   - Human approval required for database changes
   - Horizontal scaling can proceed automatically
   - Decision: HANDOFF COMPLETE

5. **Termination**: State = COMPLETED_HANDOFF
   - Audit trail persisted
   - Monitoring enabled
   - Orchestration complete

**Terminal State**: COMPLETED_HANDOFF  
**Duration**: 47 seconds  
**Agent Invocations**: 3 (monitoring, analysis, response)  
**Routing Decisions**: 5  
**Safety Checkpoints**: 8 (all passed)

---

## Integration Points

### Input Integration
- **Source**: Monitoring infrastructure (Prometheus, Datadog, Splunk, CloudWatch, etc.)
- **Format**: JSON payload with logs, alerts, metrics
- **Protocol**: REST API, webhook, or message queue
- **Schema**: Defined by monitoring_agent input schema

### Output Integration
- **Ticketing Systems**: ServiceNow, Jira, PagerDuty
- **Execution Agents**: Action execution agents, runbook automation
- **Approval Workflows**: IBM watsonx Orchestrate approval flows
- **Notification Systems**: Slack, email, SMS

### Observability Integration
- **Tracing**: OpenTelemetry-compatible distributed tracing
- **Metrics**: Prometheus-compatible metrics export
- **Logging**: Structured JSON logs with correlation IDs

---

## Configuration Management

### Orchestrator Configuration Parameters

- **Agent Endpoints**: URLs or service identifiers for each agent
- **Timeout Values**: Per-agent timeout thresholds
- **Retry Policies**: Retry count and backoff strategies
- **Confidence Thresholds**: Minimum confidence scores per severity level
- **Safety Controls**: Enabled/disabled safety checkpoints (production: all enabled)

### Routing Rules Configuration

- Stored in `routing_rules.yaml`
- Version-controlled
- Validated on deployment
- Hot-reloadable (where supported by platform)

### Escalation Rules Configuration

- Stored in `escalation_logic.md` and `routing_rules.yaml`
- Defines human-in-loop thresholds
- Maps severity to escalation targets
- Defines approval requirements

---

## Design Rationale

### Why Agentic vs Linear Pipeline?

**Linear Pipeline Approach** (rejected):
- Fixed sequence: always monitoring → analysis → response
- No decision points
- Cannot terminate early
- Wastes resources on false positives
- No adaptability to confidence or severity changes

**Agentic Orchestration Approach** (selected):
- Conditional routing based on agent outputs
- Early termination when appropriate
- Severity-aware escalation
- Confidence-aware safety controls
- Explainable decision-making at each junction

### Why Multiple Decision Checkpoints?

Each checkpoint serves a specific purpose:
- **Post-Monitoring**: Filter out routine events (NONE/LOW risk)
- **Post-Analysis**: Catch false positives and severity downgrades
- **Post-Response Planning**: Enforce human-in-loop and safety requirements
- **Pre-Handoff**: Final safety validation before execution

Multiple checkpoints provide defense-in-depth against unsafe automation.

### Why Strict Schema Validation?

Agent outputs must be validated because:
- Invalid outputs indicate agent malfunction
- Missing fields prevent safe routing decisions
- Schema violations could cause downstream errors
- Fail-fast approach prevents cascading failures

### Why Confidence-Based Routing?

Confidence scores indicate diagnostic uncertainty:
- High confidence → automation may be safe
- Low confidence → human oversight required
- Confidence thresholds prevent blind automation of uncertain diagnoses

---

## Versioning & Evolution

**Current Version**: 1.0  
**Compatibility**: Designed for monitoring_agent v1.0, analysis_agent v1.0, response_agent v1.0

**Backward Compatibility**:
- Schema versioning in agent contracts
- Graceful degradation if optional fields missing
- Version negotiation in agent invocations

**Future Extensions**:
- Multi-region orchestration coordination
- Federated agent execution
- ML-based routing optimization
- Adaptive confidence thresholds

---

## Appendix: Orchestration Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATOR START                        │
│                 (Receive monitoring signals)                     │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
                   ┌──────────────────┐
                   │ Invoke Monitoring │
                   │      Agent        │
                   └─────────┬─────────┘
                             ▼
                   ┌──────────────────┐
                   │  Risk Level?     │
                   └─────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        [NONE/LOW]      [MEDIUM]        [HIGH]
              │              │              │
              ▼              └──────┬───────┘
      ┌──────────┐                 ▼
      │TERMINATE │          ┌──────────────┐
      │(No Inc.) │          │Invoke Analysis│
      └──────────┘          │    Agent      │
                            └──────┬────────┘
                                   ▼
                          ┌────────────────┐
                          │Refined Severity│
                          └───────┬────────┘
                                  │
                     ┌────────────┼────────────┐
                     ▼            ▼            ▼
               [NONE/LOW]    [MEDIUM]    [HIGH/CRITICAL]
                     │            │            │
                     ▼            └─────┬──────┘
              ┌──────────┐             ▼
              │TERMINATE │      ┌──────────────┐
              │(Downgrade)│     │Invoke Response│
              └──────────┘      │    Agent      │
                                └──────┬────────┘
                                       ▼
                              ┌─────────────────┐
                              │Human-in-Loop?   │
                              └────────┬─────────┘
                                       │
                   ┌───────────────────┼───────────────┐
                   ▼                   ▼               ▼
             [AUTOMATED]         [SEMI-AUTO]     [HUMAN-LED]
                   │                   │               │
                   └───────────┬───────┴───────────────┘
                               ▼
                      ┌─────────────────┐
                      │ Prepare Handoff  │
                      │  Payload         │
                      └────────┬─────────┘
                               ▼
                      ┌─────────────────┐
                      │Safety Checks OK?│
                      └────────┬─────────┘
                               │
                         ┌─────┴─────┐
                         ▼           ▼
                      [PASS]      [FAIL]
                         │           │
                         ▼           ▼
                  ┌──────────┐  ┌─────────┐
                  │ HANDOFF  │  │  HALT   │
                  │ COMPLETE │  │ (Error) │
                  └──────────┘  └─────────┘
```

---

## Document Control

**Owner**: Orchestration Architecture Team  
**Reviewers**: SRE Team, Security Team, Agent Development Teams  
**Approval**: Enterprise Architecture Review Board  
**Next Review**: Quarterly or upon major version change
