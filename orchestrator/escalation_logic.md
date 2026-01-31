# Smart Incident Prevention Orchestrator - Escalation Logic

**System**: IBM watsonx Orchestrate  
**Version**: 1.0  
**Date**: January 30, 2026  
**Classification**: Enterprise Production

---

## Escalation Philosophy

### Core Principle: Safety First, Speed Second

The escalation logic for the Smart Incident Prevention Orchestrator is designed around a fundamental principle: **it is better to involve humans unnecessarily than to automate incorrectly**. This philosophy manifests in three core tenets:

1. **Confidence-Aware Escalation**: Low diagnostic confidence always triggers human oversight, regardless of severity
2. **Severity-Proportional Response**: Escalation urgency and approval requirements scale with incident severity
3. **Defense in Depth**: Multiple escalation checkpoints prevent unsafe automation at each orchestration phase

### Escalation vs Automation

**Escalation** and **automation** exist on a spectrum, not as binary choices:

```
┌────────────────────────────────────────────────────────────┐
│  Escalation Spectrum (by human involvement required)      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [Fully Automated] ──────────────────── [Human-Led]       │
│         │                  │                  │            │
│         │                  │                  │            │
│    No human         Human approval      Human control     │
│    involvement      for key actions     required          │
│                                                            │
│    ├─ Low severity, high confidence                       │
│    ├─ Well-understood failure modes                       │
│    ├─ Tested playbooks with low risk                      │
│                                                            │
│                     ├─ Medium severity                     │
│                     ├─ Database changes                    │
│                     ├─ Circuit breaker resets             │
│                                                            │
│                                 ├─ High/critical severity  │
│                                 ├─ Low confidence          │
│                                 ├─ Revenue-impacting       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### When to Escalate

Escalation is **required** when any of the following conditions are met:

1. **Severity Threshold Met**: Incident severity ≥ MEDIUM (refined by analysis agent)
2. **Confidence Below Threshold**: Diagnostic confidence < 0.50
3. **Safety Risk Present**: Response plan includes high-risk actions (database changes, traffic diversion, etc.)
4. **Human-in-Loop Required**: Response agent classifies as "semi-automated" or "human-led"
5. **Revenue Impact Detected**: Business operations or revenue at risk
6. **Blast Radius Uncertain**: Potential cascade effects not fully understood
7. **SLA Breach Occurred**: Service level agreements violated or imminent breach

### Who Gets Escalated

Escalation targets depend on:
- **Severity level**: P0/P1/P2/P3 determines escalation urgency
- **Root cause category**: Database issues → DBA, network issues → NetOps, etc.
- **Response strategy**: Immediate/urgent strategies escalate to on-call responders
- **Approval requirements**: Semi-automated responses escalate to approvers

---

## Escalation Decision Matrix

### Severity-Based Escalation Rules

| Severity | Confidence | Escalation Required? | Escalation Targets | Notification Method | Max Response Time |
|----------|-----------|---------------------|-------------------|-------------------|------------------|
| CRITICAL | ≥ 0.50 | **YES** (P0) | On-call SRE, Incident Commander, DBA, Engineering Leadership | **Page** | **5 minutes** |
| CRITICAL | < 0.50 | **YES** (P0) + FORCE human-in-loop | On-call SRE, Incident Commander, Subject Matter Expert | **Page** | **5 minutes** |
| HIGH | ≥ 0.50 | **YES** (P1) | On-call SRE, Service Owner, DBA/NetOps (as needed) | **Page** | **30 minutes** |
| HIGH | < 0.50 | **YES** (P1) + FORCE human-in-loop | On-call SRE, Service Owner, Subject Matter Expert | **Page** | **30 minutes** |
| MEDIUM | ≥ 0.50 | **YES** (P2) | On-call SRE, Service Owner | **Slack** | **4 hours** |
| MEDIUM | < 0.50 | **YES** (P2) + FORCE human-in-loop | On-call SRE, Service Owner, Subject Matter Expert | **Slack** | **4 hours** |
| LOW | Any | NO (monitoring only) | Service Owner (informational) | **Email** | **24 hours** |
| NONE | Any | NO | None | None | N/A |

### Response Strategy-Based Escalation

| Strategy Type | Escalation Urgency | Approval Required? | Escalation Method | Escalation Timeout |
|--------------|-------------------|-------------------|------------------|-------------------|
| **immediate** | **Emergency** | YES (for risky actions) | **Page** | **3 minutes** |
| **urgent** | High | YES (for risky actions) | **Page** | **10 minutes** |
| **planned** | Normal | YES (for risky actions) | **Slack** | **60 minutes** |
| **monitoring** | Low | NO | **Email** | **24 hours** |

### Human-in-Loop Classification Escalation

| Classification | Automation Allowed? | Approval Required? | Escalation Targets | Justification |
|---------------|-------------------|-------------------|-------------------|---------------|
| **automated** | YES (with safety checks) | NO | None (unless flagged) | High confidence, low risk, tested playbooks |
| **semi-automated** | **PARTIAL** | **YES** (for specific actions) | Approvers for risky actions | Medium risk actions require human approval |
| **human-led** | **NO** | **YES** (full control) | On-call responders + subject matter experts | High risk, low confidence, or safety-critical |

---

## Escalation Trigger Conditions

### Automatic Escalation Triggers

The orchestrator **automatically escalates** when:

1. **Monitoring Agent Output**:
   - `risk_level = MEDIUM` → Escalate to analysis (P2)
   - `risk_level = HIGH` → Escalate to analysis (P1)

2. **Analysis Agent Output**:
   - `refined_severity = MEDIUM, HIGH, or CRITICAL` → Escalate to response planning
   - `diagnostic_confidence < 0.50` → Escalate WITH "FORCE_HUMAN_IN_LOOP" flag

3. **Response Agent Output**:
   - `human_in_loop.classification = semi-automated or human-led` → Escalate to approvers
   - `response_strategy.strategy_type = immediate or urgent` → Escalate to on-call responders

4. **Safety Violations**:
   - Safety control missing from execution payload → HALT and escalate (P0)
   - Human-in-loop requirement bypassed → HALT and escalate to security (P0)

5. **Error Conditions**:
   - Agent invocation failure → Escalate to on-call SRE (P1)
   - Schema validation failure → Escalate to agent development team (P1)
   - Orchestration timeout → Escalate to platform team (P1)

### Manual Escalation Override

Operators can **manually override** escalation decisions:
- **Upgrade severity**: If monitoring or analysis underestimated severity
- **Downgrade severity**: If false positive confirmed by human analysis
- **Force human-in-loop**: Add FORCE_HUMAN_IN_LOOP flag to any orchestration run
- **Block automation**: Override automated classification to human-led

Manual overrides are logged in audit trail with justification required.

---

## Escalation Targets & Responsibilities

### On-Call SRE
**When Escalated**: P0 (CRITICAL), P1 (HIGH), P2 (MEDIUM)  
**Responsibilities**:
- Coordinate incident response
- Approve semi-automated playbook execution
- Monitor orchestration progress and recovery
- Escalate further if response unsuccessful

**Escalation Method**: Page (P0/P1), Slack (P2)

### Incident Commander
**When Escalated**: P0 (CRITICAL severity only)  
**Responsibilities**:
- Lead multi-service cascading failure response
- Coordinate cross-team communication
- Make business impact decisions (e.g., traffic diversion, graceful degradation)
- Interface with leadership on status

**Escalation Method**: Page

### Database Administrator (DBA)
**When Escalated**: Database-related root causes (connection pool, query performance, etc.)  
**Responsibilities**:
- Review and approve database parameter changes
- Execute database recovery playbooks
- Analyze slow queries and recommend index optimizations
- Monitor database server health during recovery

**Escalation Method**: Page (P0/P1), Slack (P2)

### Service Owner / Tech Lead
**When Escalated**: All severities (P0/P1/P2/P3)  
**Responsibilities**:
- Provide service-specific context and expertise
- Approve configuration changes to owned services
- Review and validate response plans
- Post-incident review and remediation

**Escalation Method**: Page (P0/P1), Slack (P2), Email (P3)

### Engineering Leadership
**When Escalated**: P0 (CRITICAL) with revenue impact  
**Responsibilities**:
- Business impact awareness
- Resource allocation decisions (if escalation to regional failover required)
- Communication to executive stakeholders
- Post-incident review sponsorship

**Escalation Method**: Page (P0), Email (informational)

### Security Team
**When Escalated**: Safety violations, security-related incidents  
**Responsibilities**:
- Investigate safety control bypass attempts
- Review security implications of response plans
- Audit orchestration decision logic for security risks

**Escalation Method**: Page (safety violations), Slack (security incidents)

---

## Human-in-the-Loop Rules

### Rule 1: Low Confidence Forces Human Oversight

**Condition**: `diagnostic_confidence < 0.50`  
**Action**: Set `FORCE_HUMAN_IN_LOOP` flag  
**Effect**:
- Response agent's automated classification is **overridden** to human-led
- All downstream execution requires human approval
- Approval timeout is **shortened** to ensure timely human review

**Rationale**: Low diagnostic confidence indicates uncertainty about root cause. Automating responses to uncertain diagnoses risks incorrect or harmful actions.

**Example**:
- Analysis agent diagnoses "possible database connection pool exhaustion" with 45% confidence
- Orchestrator sets FORCE_HUMAN_IN_LOOP flag
- Response plan includes automated connection pool scaling
- **Orchestrator overrides**: Changes classification to human-led, blocks automation
- DBA must review diagnosis and manually approve/execute playbook

---

### Rule 2: High-Risk Actions Require Approval

**High-risk actions** include:
- Database schema changes (index creation, table modifications)
- Connection pool parameter changes
- Circuit breaker resets
- Traffic diversion or regional failover
- Service restarts affecting active transactions
- Rate limiting that may impact legitimate users

**Condition**: Response plan includes high-risk action  
**Action**: Require human approval even if classification = automated  
**Effect**:
- Semi-automated workflow activated
- Approver identified based on action type (DBA for database, SRE for infrastructure)
- Approval timeout enforced (3-60 minutes depending on urgency)
- If approval not received within timeout, escalate to higher authority

**Rationale**: High-risk actions have potential for unintended consequences (data loss, service disruption, cascade failures). Human review provides safety checkpoint.

---

### Rule 3: Severity ≥ HIGH Requires Human Coordination

**Condition**: `refined_severity = HIGH or CRITICAL`  
**Action**: Escalate to on-call SRE and service owner  
**Effect**:
- Human responders paged immediately
- Orchestrator provides response plan as recommendation, not directive
- Humans may modify, delay, or reject response plan
- Coordination required for multi-service incidents

**Rationale**: High and critical severity incidents have significant business impact and may require real-time decision-making that adapts to changing conditions. Humans provide adaptability and business judgment.

---

### Rule 4: Revenue Impact Requires Business Approval

**Condition**: `impact_assessment.business_operations.revenue_at_risk = true`  
**Action**: Escalate to service owner and (for CRITICAL) engineering leadership  
**Effect**:
- Response plan must be reviewed for revenue impact trade-offs
- Graceful degradation or traffic diversion requires business approval
- Leadership awareness for customer-facing impact

**Rationale**: Revenue-impacting decisions require business judgment, not purely technical assessment.

---

### Rule 5: Cascading Failures Require Incident Commander

**Condition**: `blast_radius.cascade_risk = high or widespread impact detected`  
**Action**: Escalate to incident commander (P0/P1 only)  
**Effect**:
- Incident commander coordinates multi-team response
- Response playbooks may need sequencing across services
- Communication and status updates centralized

**Rationale**: Cascading failures require coordinated response across multiple teams. Incident commander prevents conflicting actions and ensures holistic recovery strategy.

---

## Approval Workflows

### Semi-Automated Approval Flow

**Scenario**: Response plan classified as "semi-automated"

**Workflow**:
1. Orchestrator prepares execution payload with **approval-required actions** flagged
2. Approval request sent to designated approvers (based on action type)
3. Approvers have **limited time window** to review and approve/reject:
   - Immediate strategy: **3 minutes**
   - Urgent strategy: **10 minutes**
   - Planned strategy: **60 minutes**
4. **If approved**: Orchestrator proceeds with flagged actions
5. **If rejected**: Orchestrator escalates to higher authority with rejection reason
6. **If timeout**: Orchestrator escalates to on-call SRE and incident commander (for P0/P1)

**Approval Context Provided**:
- Diagnostic summary (root cause, confidence, severity)
- Recommended action (playbook, parameters, risk assessment)
- Impact if action not taken (continuing degradation, SLA breach, etc.)
- Safety controls and rollback plan
- Estimated execution time

---

### Human-Led Approval Flow

**Scenario**: Response plan classified as "human-led"

**Workflow**:
1. Orchestrator prepares **handoff payload** with complete context
2. Handoff to ticketing system (ServiceNow, Jira, etc.)
3. On-call responders paged with incident details
4. Humans review diagnostic report and response plan
5. Humans decide:
   - Execute recommended playbooks
   - Modify response plan
   - Investigate further before acting
   - Reject response plan and pursue alternative approach
6. Orchestrator provides **monitoring and context** but does not execute actions

**No Automation**: All actions require explicit human execution or approval.

---

## Escalation Timing & SLAs

### Response Time Expectations

| Priority | Max Response Time | Max Resolution Time | Escalation If Exceeded |
|---------|------------------|--------------------|-----------------------|
| **P0 (CRITICAL)** | **5 minutes** | **30 minutes** | Escalate to incident commander + engineering VP |
| **P1 (HIGH)** | **30 minutes** | **4 hours** | Escalate to engineering leadership |
| **P2 (MEDIUM)** | **4 hours** | **24 hours** | Escalate to service owner manager |
| **P3 (LOW)** | **24 hours** | **1 week** | Backlog prioritization |

**Response Time**: Time from orchestration handoff to human acknowledgment  
**Resolution Time**: Time from orchestration handoff to incident resolved

---

### Approval Timeout Handling

**Scenario**: Approval request times out without response

**Actions**:
1. Log approval timeout event
2. Escalate to **next level authority**:
   - On-call SRE → Senior SRE → Engineering Manager
   - Service Owner → Tech Lead → Engineering Manager
3. For **P0 (immediate strategy)**: Auto-escalate to incident commander after 3 minutes
4. For **P1 (urgent strategy)**: Auto-escalate to engineering leadership after 10 minutes
5. For **P2 (planned strategy)**: Convert to human-led workflow, continue escalation

**Fallback**: If all escalation targets unresponsive (critical failure scenario):
- P0/P1: Execute **safe subset** of automated playbooks (monitoring, data collection, safe rollbacks)
- P0/P1: Page backup on-call rotation
- All priorities: Create high-priority ticket with full context

---

## Confidence-Based Escalation Adjustments

### High Confidence (≥ 0.80)

**Escalation Adjustments**:
- Approval requirements **relaxed** for low-risk actions
- Automated execution **allowed** for MEDIUM severity with tested playbooks
- Response time expectations **faster** (high confidence = clearer action path)

**Example**:
- MEDIUM severity, 0.92 diagnostic confidence, low-risk playbook (cache configuration)
- Orchestrator allows automated execution with post-execution verification
- On-call SRE notified (Slack) but approval not required

---

### Medium Confidence (0.50 - 0.79)

**Escalation Adjustments**:
- Standard approval requirements apply
- Semi-automated classification enforced for risky actions
- Human review recommended but not blocking for low-risk actions

**Example**:
- HIGH severity, 0.65 diagnostic confidence, medium-risk playbook (horizontal scaling)
- Orchestrator requires semi-automated workflow
- On-call SRE must approve scaling parameters but execution proceeds automatically after approval

---

### Low Confidence (< 0.50)

**Escalation Adjustments**:
- **Force human-in-loop** flag set automatically
- Automated classification **overridden** to human-led
- All actions require explicit human execution
- Diagnostic investigation recommended before action

**Example**:
- HIGH severity, 0.42 diagnostic confidence, high-risk playbook (database failover)
- Orchestrator forces human-in-loop despite HIGH severity urgency
- On-call SRE and DBA paged
- Response plan provided as **recommendation only**
- Humans must validate diagnosis before executing any actions

---

## Safety Constraints & Guardrails

### Escalation Safety Invariants

These rules are **never violated**:

1. **CRITICAL severity always escalates to on-call responders** (even if confidence high)
2. **Low confidence always forces human-in-loop** (even if severity low)
3. **High-risk actions always require approval** (even if confidence high)
4. **Revenue-impacting incidents always escalate to service owners** (even if automated playbook available)
5. **Cascading failures always escalate to incident commander** (P0/P1 only)
6. **Safety violations immediately halt orchestration** and escalate to security team

### Escalation Safeguards

Before escalating:
1. **Validate escalation context complete**: Severity, confidence, root cause, impact, recommended actions
2. **Identify correct escalation targets**: Based on root cause category and severity
3. **Set appropriate urgency**: Page for P0/P1, Slack for P2, Email for P3
4. **Prepare actionable handoff**: Include diagnostic summary, response plan, context, monitoring links

If escalation context incomplete:
- HALT orchestration
- Flag orchestration error
- Escalate to on-call SRE with partial context and error details

---

## Escalation Examples

### Example 1: CRITICAL Severity, High Confidence

**Scenario**: Checkout service cascading failure  
**Diagnostic Confidence**: 0.95  
**Refined Severity**: CRITICAL  
**Root Cause**: Database connection pool exhaustion  
**Revenue Impact**: YES (47.8% transaction failures)

**Escalation Actions**:
1. **Escalate to**: On-call SRE, Incident Commander, DBA, Engineering Leadership
2. **Notification**: **Page** (P0 emergency)
3. **Human-in-Loop**: Semi-automated (despite high confidence, CRITICAL severity requires oversight)
4. **Approval Required**: YES (for database connection pool parameter changes)
5. **Approval Timeout**: 3 minutes (immediate strategy)
6. **Fallback**: If no approval in 3 minutes, escalate to incident commander for emergency decision

**Justification**: CRITICAL severity with revenue impact requires coordinated emergency response despite high diagnostic confidence. Database changes require DBA approval for safety.

---

### Example 2: HIGH Severity, Low Confidence

**Scenario**: Payment gateway resource exhaustion  
**Diagnostic Confidence**: 0.42  
**Refined Severity**: HIGH  
**Root Cause Hypothesis**: Possible connection pool exhaustion OR traffic spike (uncertain)

**Escalation Actions**:
1. **Escalate to**: On-call SRE, Service Owner, DBA
2. **Notification**: **Page** (P1 urgent)
3. **Human-in-Loop**: **Human-led** (FORCED due to low confidence, overrides any automated classification)
4. **Approval Required**: YES (all actions, diagnosis uncertain)
5. **Recommended Action**: Investigate further before executing recovery playbooks

**Justification**: Low confidence prevents automated response despite HIGH severity. Humans must validate diagnosis before acting to avoid incorrect remediation.

---

### Example 3: MEDIUM Severity, High Confidence, Low Risk

**Scenario**: Inventory service query performance degradation  
**Diagnostic Confidence**: 0.78  
**Refined Severity**: MEDIUM  
**Root Cause**: Database query performance (missing index likely)  
**Risk**: Low (temporary rate limiting), Medium (index creation)

**Escalation Actions**:
1. **Escalate to**: On-call SRE (notification), DBA (approval for index creation)
2. **Notification**: **Slack** (P2 normal urgency)
3. **Human-in-Loop**: Semi-automated
4. **Automated Actions Allowed**: Temporary rate limiting (low risk)
5. **Approval Required**: Database index creation (medium risk)
6. **Approval Timeout**: 60 minutes (planned strategy)

**Justification**: MEDIUM severity with good confidence allows partial automation. Rate limiting proceeds automatically for immediate relief. Index creation requires DBA review and approval due to schema change risk.

---

### Example 4: MEDIUM Severity, Confidence Below Threshold

**Scenario**: API gateway upstream connection failures  
**Diagnostic Confidence**: 0.62 (borderline)  
**Refined Severity**: MEDIUM  
**Root Cause**: Upstream service failure (75% confidence) OR network issue (48% confidence)  
**Uncertainty**: Upstream service identity unknown

**Escalation Actions**:
1. **Escalate to**: On-call SRE, API Gateway Team
2. **Notification**: **Slack** (P2)
3. **Human-in-Loop**: Semi-automated (confidence borderline, investigation needed)
4. **Approval Required**: YES (for circuit breaker reset or graceful degradation)
5. **Recommended Action**: Investigate upstream service identity and health before acting

**Justification**: Confidence above 0.50 threshold allows semi-automated workflow, but significant uncertainties (unknown upstream service) require investigation before action. Playbook selection conditional on investigation findings.

---

## Post-Escalation Monitoring

### Escalation Effectiveness Tracking

After escalation, orchestrator monitors:
- **Response time**: Time from escalation to human acknowledgment
- **Resolution time**: Time from escalation to incident resolved
- **Escalation path**: Which escalation targets responded, in what order
- **Override decisions**: Did humans modify/reject orchestrator's response plan?
- **Outcome**: Was recommended response plan effective?

### Continuous Improvement

Post-incident reviews analyze:
1. **Was escalation timely?** (Did we escalate early enough to prevent severity increase?)
2. **Were escalation targets appropriate?** (Right expertise involved?)
3. **Were approval timeouts reasonable?** (Too short? Too long?)
4. **Was human-in-loop classification correct?** (Too restrictive? Too permissive?)
5. **Did confidence thresholds work?** (False positives? False negatives?)

Findings feed back into:
- Routing rule adjustments
- Confidence threshold tuning
- Escalation target mappings
- Approval timeout configurations

---

## Escalation Anti-Patterns (Avoid)

### Anti-Pattern 1: Escalation Fatigue

**Problem**: Over-escalating low-severity or low-confidence incidents  
**Impact**: On-call responders desensitized, ignore legitimate escalations  
**Mitigation**: 
- Strict severity thresholds (only MEDIUM+ escalates)
- Confidence-based filtering (monitoring-only for low-confidence MEDIUM)
- Auto-downgrade false positives to reduce escalation volume

### Anti-Pattern 2: Approval Bottlenecks

**Problem**: Requiring approval for every action, slowing emergency response  
**Impact**: Delayed response to CRITICAL incidents, SLA breaches  
**Mitigation**:
- Allow partial automation for well-tested, low-risk playbooks
- Shorten approval timeouts for P0/P1
- Fallback to safe automated actions if approval times out

### Anti-Pattern 3: Escalation Without Context

**Problem**: Escalating to responders without sufficient diagnostic context  
**Impact**: Humans must re-investigate, wasting time  
**Mitigation**:
- Always include: diagnostic summary, root cause, recommended actions, impact assessment
- Provide monitoring links and quick access to logs
- Prepare actionable handoff, not just "something is wrong"

### Anti-Pattern 4: Ignoring Confidence Scores

**Problem**: Automating responses despite low diagnostic confidence  
**Impact**: Incorrect remediation, potentially worsening incident  
**Mitigation**:
- Enforce FORCE_HUMAN_IN_LOOP for confidence < 0.50
- Use confidence to determine human-in-loop level
- Recommend investigation playbooks for low-confidence scenarios

### Anti-Pattern 5: Escalation Hierarchy Violations

**Problem**: Skipping escalation levels (e.g., escalating directly to VP without on-call SRE)  
**Impact**: Inefficient use of leadership time, bypassing responders with context  
**Mitigation**:
- Follow escalation hierarchy: On-call SRE → Senior SRE → Manager → Leadership
- Escalate to leadership only after on-call responders engaged
- Exception: P0 with revenue impact may page leadership immediately alongside SRE

---

## Document Control

**Owner**: Orchestration Architecture Team  
**Reviewers**: SRE Team, Engineering Leadership, Incident Management Team  
**Approval**: Enterprise Architecture Review Board  
**Next Review**: Quarterly or upon major incident retrospective findings
