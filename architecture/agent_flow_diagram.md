# Agent Flow Diagram
## Sequential Multi-Agent Workflow

### Overview

This document describes the sequential flow of data and decision-making through the multi-agent system. Each agent processes input from its predecessor, applies domain-specific logic, and produces structured output for the next stage in the pipeline.

### Agent Execution Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│                    INCIDENT ALERT RECEIVED                      │
│              (from monitoring systems / log streams)            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  MONITORING AGENT    │
                  │                      │
                  │ • Anomaly Detection  │
                  │ • Severity Scoring   │
                  │ • Confidence Rating  │
                  └──────────┬───────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Anomaly       │ YES
                    │  Detected?     │────────┐
                    └────────┬───────┘        │
                             │ NO             │
                             ▼                │
                    ┌────────────────┐        │
                    │  Log & Ignore  │        │
                    │  (No Action)   │        │
                    └────────────────┘        │
                                              │
                             ┌────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   ANALYSIS AGENT     │
                  │                      │
                  │ • Root Cause Lookup  │
                  │ • Pattern Matching   │
                  │ • Severity Refine    │
                  └──────────┬───────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Root Cause    │ YES
                    │  Identified?   │────────┐
                    └────────┬───────┘        │
                             │ NO             │
                             ▼                │
                    ┌────────────────┐        │
                    │ Escalate to    │        │
                    │ Manual Triage  │        │
                    └────────────────┘        │
                                              │
                             ┌────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ RESPONSE PLANNING    │
                  │       AGENT          │
                  │ • Generate Actions   │
                  │ • Risk Assessment    │
                  │ • Escalation Logic   │
                  └──────────┬───────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  High Risk     │ YES
                    │  Action?       │────────┐
                    └────────┬───────┘        │
                             │ NO             │
                             │                │
                             ▼                ▼
                    ┌────────────────┐  ┌──────────────────┐
                    │  Automated     │  │ Human Approval   │
                    │  Execution     │  │    Required      │
                    │  Approved      │  │                  │
                    └────────┬───────┘  └────────┬─────────┘
                             │                   │
                             │                   ▼
                             │          ┌────────────────┐
                             │          │  Await Human   │
                             │          │  Decision      │
                             │          └────────┬───────┘
                             │                   │
                             │          ┌────────┴────────┐
                             │          │                 │
                             │      APPROVED          REJECTED
                             │          │                 │
                             └──────────┼─────────────────┘
                                        │                 │
                                        ▼                 ▼
                             ┌──────────────────┐  ┌────────────┐
                             │ TICKETING AGENT  │  │  Log &     │
                             │   (Optional)     │  │  Archive   │
                             │                  │  └────────────┘
                             │ • Create Ticket  │
                             │ • Trigger Action │
                             │ • Update Status  │
                             └──────────────────┘
                                        │
                                        ▼
                             ┌──────────────────┐
                             │  REMEDIATION     │
                             │  EXECUTED        │
                             └──────────────────┘
```

### Flow Transition Details

#### Stage 1: Alert Ingestion → Monitoring Agent

**Input**: Raw alert data from monitoring systems, including metric values, thresholds, timestamps, and source identifiers.

**Processing**:
- Apply statistical anomaly detection algorithms
- Compare metric values against defined thresholds
- Calculate confidence scores based on deviation magnitude
- Filter noise and false positives

**Output**: Structured anomaly report with severity classification, confidence rating, and reasoning explanation.

**Decision Gate**: If no genuine anomaly detected, log the event and terminate workflow. Otherwise, proceed to Analysis Agent.

---

#### Stage 2: Monitoring Agent → Analysis Agent

**Input**: Anomaly report from Monitoring Agent containing anomaly type, severity, affected resources, and initial assessment.

**Processing**:
- Query historical incident database for similar patterns
- Correlate with recent deployment events and configuration changes
- Identify impacted services based on dependency mapping
- Rank root cause hypotheses by confidence level
- Refine severity based on historical impact and blast radius

**Output**: Root cause hypothesis with supporting evidence, impacted service list, refined severity, and confidence score.

**Decision Gate**: If root cause cannot be determined with sufficient confidence (threshold: 60%), escalate to manual triage team. Otherwise, proceed to Response Planning Agent.

---

#### Stage 3: Analysis Agent → Response Planning Agent

**Input**: Root cause analysis report including identified cause, severity level, impacted services, and historical context.

**Processing**:
- Map root cause to operational runbook procedures
- Generate prioritized action list (immediate, short-term, preventive)
- Evaluate risk level for each proposed action
- Apply escalation rules based on change management policy
- Identify required safety controls and validation steps
- Calculate estimated resolution time

**Output**: Comprehensive response plan with action priorities, playbook references, risk assessments, and approval requirements.

**Decision Gate**: If any action is classified as high-risk (database changes, production deployments, infrastructure modifications), trigger human approval workflow. Low-risk actions proceed to automated execution.

---

#### Stage 4: Response Planning Agent → Human Approval (Conditional)

**Conditions Triggering Human Approval**:
- Action risk level: High or Critical
- Estimated blast radius: Multi-service or customer-facing impact
- Change type: Database schema, production configuration, infrastructure
- Compliance requirement: Change management policy mandate

**Approval Context Provided**:
- Complete reasoning chain from alert to proposed action
- Confidence scores at each decision point
- Blast radius assessment and affected services
- Rollback plan and safety control checklist
- Historical precedent and success rate of similar actions

**Outcomes**:
- **Approved**: Proceed to Ticketing Agent or direct execution
- **Rejected**: Log decision, archive incident, notify operations team
- **Modified**: Return to Response Planning Agent with human-specified constraints

---

#### Stage 5: Response Planning Agent → Ticketing Agent (Optional)

**Input**: Approved response plan with action details and execution parameters.

**Processing**:
- Create incident ticket in external tracking system
- Generate workflow tasks for remediation steps
- Update service status dashboards
- Trigger automation scripts for approved low-risk actions
- Schedule follow-up validation checks

**Output**: Ticket identifier, workflow status, and execution confirmation.

---

### Severity Escalation Path

```
Severity Level         Monitoring Agent   Analysis Agent   Response Planning
─────────────────────────────────────────────────────────────────────────────
LOW (Score: 0-3)      │ Log + Monitor   │ No Immediate   │ Schedule Review
                      │                 │ Analysis       │
─────────────────────────────────────────────────────────────────────────────
MEDIUM (Score: 4-6)   │ Alert + Analyze │ Root Cause     │ Automated Action
                      │                 │ Required       │ (if low risk)
─────────────────────────────────────────────────────────────────────────────
HIGH (Score: 7-8)     │ Urgent Alert    │ Priority       │ Human Approval
                      │                 │ Analysis       │ Required
─────────────────────────────────────────────────────────────────────────────
CRITICAL (Score: 9-10)│ Emergency Page  │ Immediate      │ Emergency
                      │                 │ Analysis       │ Response Team
```

### Human-in-the-Loop Checkpoints

**Checkpoint 1: Manual Triage Gate**

*Location*: After Analysis Agent

*Trigger Condition*: Root cause confidence < 60%

*Action*: Escalate to operations team for manual investigation. Provide all collected context and initial hypotheses.

**Checkpoint 2: High-Risk Action Approval**

*Location*: After Response Planning Agent

*Trigger Condition*: Any action classified as high-risk or critical impact

*Action*: Present complete reasoning chain, risk assessment, and proposed actions to authorized approver. Require explicit approval before execution.

**Checkpoint 3: Emergency Override**

*Location*: Any stage

*Trigger Condition*: Critical severity (9-10) or multi-service outage detected

*Action*: Bypass normal workflow, immediately notify incident commander, provide all available context for rapid decision-making.

### Orchestration Coordination Points

IBM watsonx Orchestrate manages transitions between agents:

1. **Data Validation**: Ensures output from Agent N matches input schema of Agent N+1
2. **State Persistence**: Maintains complete workflow context across agent boundaries
3. **Error Handling**: Captures agent failures and routes to fallback procedures
4. **Timing Enforcement**: Applies timeout limits to prevent workflow stalls
5. **Audit Logging**: Records all transitions, decisions, and data transformations

This orchestration ensures deterministic workflow execution and enables complete incident traceability from initial alert to final resolution.