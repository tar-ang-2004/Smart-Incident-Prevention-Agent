# Decision Logic Specification
## Smart Incident Prevention Agent

### Overview

This document defines the decision rules, thresholds, and logic applied by each agent in the workflow. All decision criteria are deterministic and configurable to ensure predictable system behavior and facilitate audit compliance.

---

## Monitoring Agent Decision Logic

### Anomaly Detection Thresholds

The Monitoring Agent evaluates incoming metrics against defined thresholds to determine anomaly status.

| Metric Type | Normal Range | Warning Threshold | Critical Threshold | Evaluation Method |
|-------------|--------------|-------------------|--------------------|-----------------|
| CPU Utilization | 0-70% | 70-85% | >85% | Current value vs. threshold |
| Memory Usage | 0-75% | 75-90% | >90% | Current value vs. threshold |
| Disk Space | 0-80% | 80-90% | >90% | Current value vs. threshold |
| API Latency | 0-500ms | 500-2000ms | >2000ms | p95 percentile vs. baseline |
| Error Rate | 0-2% | 2-5% | >5% | Rolling 5-minute average |
| Database Connections | 0-70% of max | 70-90% of max | >90% of max | Current count vs. pool size |
| Network Throughput | Baseline ±20% | Baseline ±50% | Baseline >100% | Statistical deviation |

### Severity Classification Rules

Severity scores range from 0 (informational) to 10 (critical). Initial severity is calculated based on threshold exceedance and metric type.

| Condition | Base Severity | Severity Modifier | Final Range |
|-----------|---------------|-------------------|-------------|
| Metric in normal range | 0 | N/A | 0 |
| Warning threshold exceeded | 4 | +1 if production environment | 4-5 |
| Critical threshold exceeded | 7 | +1 if customer-facing service | 7-8 |
| Multiple metrics critical | 8 | +2 if cascading failures detected | 8-10 |
| Service unavailable | 9 | +1 if payment/auth service | 9-10 |

### Confidence Scoring Methodology

Confidence scores reflect the agent's certainty in its anomaly assessment.

| Factor | Confidence Impact | Calculation |
|--------|-------------------|-------------|
| Clear threshold exceedance | High (0.85-0.95) | Deviation magnitude / threshold |
| Historical pattern match | Medium (0.70-0.85) | Similarity score to known patterns |
| Borderline threshold | Low (0.60-0.70) | Proximity to threshold boundary |
| Data quality issues | Penalty (-0.10 to -0.20) | Missing data points, stale metrics |
| Corroborating signals | Bonus (+0.05 to +0.10) | Multiple related metrics abnormal |

### Noise Filtering Rules

Events matching the following criteria are classified as non-actionable noise:

- Metric fluctuation within 10% of threshold for less than 2 minutes
- Known maintenance window in progress
- Single isolated spike with immediate return to normal
- Staging or development environment alerts (severity automatically reduced by 3 points)
- Metrics from decommissioned services (flagged in service registry)

---

## Analysis Agent Decision Logic

### Root Cause Hypothesis Ranking

The Analysis Agent generates multiple root cause hypotheses and ranks them by likelihood.

| Ranking Factor | Weight | Scoring Method |
|----------------|--------|----------------|
| Historical incident match | 40% | Cosine similarity of symptom vectors |
| Deployment correlation | 25% | Time proximity to recent deployments |
| Service dependency impact | 20% | Graph distance in dependency map |
| Metric pattern alignment | 10% | Statistical correlation coefficient |
| Manual ticket tagging | 5% | Explicit cause labels from past incidents |

**Hypothesis Selection Threshold**: Top-ranked hypothesis must score ≥0.60 confidence to be selected. If no hypothesis meets threshold, escalate to manual triage.

### Severity Refinement Logic

The Analysis Agent adjusts initial severity based on historical context and impact assessment.

| Refinement Condition | Severity Adjustment | Rationale |
|---------------------|---------------------|----------|
| Recurring incident (3+ occurrences in 30 days) | +1 | Indicates systemic issue requiring priority attention |
| Recent similar resolution successful | -1 | Known fix available, lower urgency |
| Multi-service cascade detected | +2 | Broader blast radius than initially assessed |
| Peak traffic hours (10am-2pm, 6pm-9pm) | +1 | Customer impact amplified during high usage |
| Canary deployment detected | -1 | Blast radius limited to subset of instances |
| Payment/authentication service impacted | +2 | Critical business function affected |

### Impacted Service Identification

Services are classified as impacted based on dependency analysis:

| Impact Level | Definition | Response Priority |
|--------------|------------|------------------|
| Direct Impact | Service where anomaly originated | Immediate remediation |
| Downstream Impact | Services depending on affected service | Proactive monitoring, prepare fallback |
| Upstream Impact | Services that provide data to affected service | Assess if cascade possible, monitor closely |
| Indirect Impact | Services in same failure domain | Increase alerting sensitivity |

---

## Response Planning Agent Decision Logic

### Response Strategy Mapping

Root causes are mapped to remediation strategies based on operational runbooks.

| Root Cause Category | Primary Strategy | Secondary Strategy | Estimated Time |
|---------------------|------------------|--------------------|--------------|
| Memory Leak | Service restart + hotfix deployment | Increase instance memory temporarily | 30-60 min |
| Cache Exhaustion | Scale cache cluster + apply TTL | Flush stale entries, optimize keys | 15-30 min |
| Database Connection Pool | Increase pool size + query optimization | Add read replicas, enable connection pooling | 20-45 min |
| Configuration Error | Rollback to previous config + validation | Manual config correction with review | 10-20 min |
| Disk Space Exhaustion | Log compression + old file deletion | Expand volume, enable log rotation | 15-25 min |
| API Rate Limiting | Increase rate limits + add caching | Deploy CDN, optimize queries | 25-40 min |
| Deployment Regression | Automated rollback to previous version | Canary rollout of hotfix | 15-30 min |

### Action Priority Classification

All recommended actions are assigned priority levels:

| Priority | Timing | Examples | Approval Required |
|----------|--------|----------|------------------|
| P1 - Immediate | Execute within 5 minutes | Increase resource limits, enable caching, restart service | Conditional (see risk assessment) |
| P2 - Short-term | Execute within 1-2 hours | Apply query optimization, deploy hotfix, scale infrastructure | Yes (for production changes) |
| P3 - Preventive | Schedule within 1-7 days | Implement monitoring improvements, update documentation, conduct load testing | No (standard change process) |

### Risk Assessment Matrix

Each proposed action is evaluated for risk level:

| Risk Factor | Low Risk | Medium Risk | High Risk |
|-------------|----------|-------------|----------|
| **Environment** | Staging, Dev | Pre-production | Production |
| **Change Type** | Read-only query, Monitoring config | Application restart, Cache flush | Database schema, Infrastructure config |
| **Blast Radius** | Single instance | Single service | Multi-service, Customer-facing |
| **Reversibility** | Instant rollback | Manual rollback (<5 min) | Complex rollback (>15 min) |
| **Testing Status** | Validated in staging | Partial staging validation | Unvalidated emergency fix |

**Overall Risk Calculation**: Risk level is determined by the highest-risk factor. Any single "High Risk" factor classifies the entire action as high-risk.

---

## Escalation and Approval Logic

### Human Approval Requirements

Approval is required when any of the following conditions are met:

| Condition | Approval Authority | SLA |
|-----------|-------------------|-----|
| Overall action risk: High | Platform Engineering Lead | 15 minutes |
| Overall action risk: Critical | VP Engineering + On-call Incident Commander | 5 minutes |
| Database schema or data modification | Database Administrator + Engineering Lead | 30 minutes |
| Production deployment outside maintenance window | Release Manager + Service Owner | 20 minutes |
| Multi-service remediation required | Site Reliability Engineering Manager | 15 minutes |
| Customer data access required | Security Officer + Legal (if applicable) | 60 minutes |
| Estimated downtime >5 minutes | Service Owner + Customer Success (notification) | 10 minutes |

### Escalation Path Selection

| Incident Severity | Initial Escalation Target | Secondary Escalation | Escalation Timeline |
|-------------------|---------------------------|----------------------|--------------------|
| Low (0-3) | Service owner via email | Engineering team Slack channel | 4 hours |
| Medium (4-6) | On-call SRE via PagerDuty | Service owner + Engineering lead | 1 hour |
| High (7-8) | On-call SRE + Engineering lead | Incident Commander + VP Engineering | 15 minutes |
| Critical (9-10) | Incident Commander + All engineering leads | CEO + Customer Success leadership | Immediate |

### Automated vs. Manual Execution Decision

The system determines execution mode based on combined risk and confidence assessment:

```
Decision Matrix:

IF (action_risk == "Low" OR action_risk == "Medium") 
   AND confidence_score >= 0.80 
   AND NOT in_business_hours
THEN
   execution_mode = "Automated"
   approval_required = False
   
ELSE IF (action_risk == "Medium") 
   AND confidence_score >= 0.85 
   AND in_business_hours
THEN
   execution_mode = "Automated with notification"
   approval_required = False
   post_execution_review = True
   
ELSE IF (action_risk == "High" OR action_risk == "Critical")
   OR confidence_score < 0.80
THEN
   execution_mode = "Manual approval required"
   approval_required = True
   provide_approval_context = True
```

---

## Safety and Validation Rules

### Pre-Execution Safety Checks

All actions must pass these validation gates before execution:

| Safety Check | Validation Criteria | Failure Action |
|--------------|---------------------|----------------|
| Rollback Plan Exists | Documented rollback procedure available | Block execution, require manual plan |
| Backup Verified | Recent backup within defined RPO (1-24 hours) | Block execution, trigger backup |
| Monitoring Active | Target service has active health checks | Proceed with warning, enhance monitoring |
| Change Window Valid | Current time within approved change window OR emergency override granted | Block execution, request approval |
| Dependencies Healthy | All upstream services operational | Proceed with warning, prepare fallback |
| Resource Capacity | Sufficient compute/memory/storage for proposed change | Block execution, scale resources first |

### Post-Execution Validation

After action execution, the system validates success:

| Validation Check | Success Criteria | Failure Response |
|------------------|------------------|------------------|
| Metric Normalization | Target metric returns to normal range within expected time | Initiate rollback, escalate to manual intervention |
| Service Health | All health checks passing for 5 consecutive minutes | Investigate health check failure, consider rollback |
| Error Rate Stable | Error rate remains below threshold for 10 minutes | Assess if action caused new issues, rollback if error spike |
| Dependency Impact | No downstream service degradation detected | Isolate affected service, assess cascade risk |
| Customer Impact | No increase in customer support tickets or SLA violations | Communicate with customers, prepare mitigation |

### Emergency Override Conditions

Normal approval and safety gates can be bypassed under these circumstances:

- **Active Production Outage**: Complete service unavailability affecting customers
- **Security Incident**: Active security breach or data exposure detected
- **Data Loss Risk**: Imminent risk of data corruption or permanent loss
- **Legal/Compliance**: Regulatory requirement for immediate action

**Override Authority**: Only Incident Commander or VP Engineering can authorize emergency overrides. All overrides are logged and require post-incident review.

---

## Confidence Threshold Summary

Minimum confidence requirements for autonomous decision-making:

| Decision Type | Minimum Confidence | Action if Below Threshold |
|---------------|-------------------|---------------------------|
| Anomaly Detection | 0.70 | Log as "potential anomaly", continue monitoring |
| Root Cause Hypothesis | 0.60 | Escalate to manual triage |
| Severity Classification | 0.75 | Default to next higher severity level |
| Response Strategy Selection | 0.80 | Present multiple options to human approver |
| Automated Execution Approval | 0.85 | Require explicit human approval |

These thresholds balance automation efficiency with safety and accuracy requirements. Values are configurable based on organizational risk tolerance and historical system performance.