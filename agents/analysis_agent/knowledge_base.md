# Analysis Agent Knowledge Base

## Purpose

This knowledge base provides structured diagnostic knowledge to support the Analysis Agent's root cause hypothesis generation and impact assessment. It contains symptom-cause mappings, cascading failure patterns, and diagnostic heuristics derived from enterprise incident management best practices.

## How to Use This Knowledge Base

When analyzing escalated incidents:
1. Match observed symptoms to known patterns
2. Identify probable root cause categories
3. Assess cascade risk using documented patterns
4. Apply appropriate diagnostic confidence levels
5. Consider impact across documented dimensions

This is reference material for pattern matching and causal reasoning, not a rigid decision tree.

---

## Symptom-Cause Mappings

### Connection Pool Exhaustion Patterns

**Symptoms**:
- `CONN_POOL_EXHAUSTED` or `CONNECTION_POOL_FULL` errors
- Database connection timeout errors
- Thread pool saturation (high utilization %)
- Increasing request queue depth
- Rising CPU and memory utilization
- Error rate spike correlated with connection errors

**Probable Root Causes**:
1. **Connection leak** (confidence: high if sustained over time)
   - Application not releasing connections properly
   - Missing connection close() calls in error paths
   - Evidence: pool exhaustion persists even with low traffic
   
2. **Traffic spike beyond pool capacity** (confidence: medium if request rate elevated)
   - Sudden increase in concurrent requests
   - Pool size inadequate for load
   - Evidence: high request rate, queue buildup
   
3. **Slow queries holding connections** (confidence: high if query latency elevated)
   - Database queries taking excessive time
   - Connections held longer than expected
   - Evidence: database query latency warnings, timeout errors
   
4. **Database server unresponsive** (confidence: medium without direct DB visibility)
   - Backend database degraded or saturated
   - Connections established but queries hang
   - Evidence: database timeout errors, no response from queries

**Cascade Pattern**:
```
Connection pool exhaustion 
  → Request threads accumulate waiting for connections
  → Thread pool saturation
  → CPU/memory pressure from queued threads
  → Request queue buildup
  → Positive feedback loop: more queued requests → more resource pressure → slower processing
  → Potential complete service failure
```

---

### Circuit Breaker Activation Patterns

**Symptoms**:
- `CIRCUIT_OPEN` or `CIRCUIT_BREAKER_OPEN` messages
- Upstream service timeout errors preceding circuit break
- Rapid error accumulation to dependency
- Subsequent requests fail immediately (fail-fast)

**Probable Root Causes**:
1. **Upstream service failure** (confidence: very high)
   - Dependency crashed, unresponsive, or overloaded
   - Circuit breaker protecting caller from cascading failures
   - Evidence: consistent upstream timeouts or connection refused errors
   
2. **Network partition** (confidence: medium without network telemetry)
   - Network connectivity lost to upstream service
   - Circuit breaker interprets as service failure
   - Evidence: multiple upstream services failing simultaneously
   
3. **Upstream resource exhaustion** (confidence: high if upstream metrics available)
   - Upstream service saturated (CPU, memory, connections)
   - Responding slowly or timing out
   - Evidence: upstream latency spikes before circuit break

**Cascade Pattern**:
```
Upstream service failure
  → Timeout errors accumulate
  → Circuit breaker threshold reached
  → Circuit opens (fail-fast mode)
  → Downstream services calling this service also experience failures
  → Potential for cascading circuit breaker openings across service graph
```

**Impact Notes**:
- Circuit breaker OPEN is a *protective mechanism*, not root cause
- True root cause is upstream failure that triggered circuit breaker
- Multiple circuit breakers open simultaneously indicates widespread cascading failure

---

### Database Query Performance Degradation

**Symptoms**:
- Slow query warnings (execution time > threshold)
- Request timeouts at application layer
- Increasing database connection pool utilization
- P95/P99 latency spikes
- Error rate increase (timeouts)
- Low cache hit rate (if cache metrics available)

**Probable Root Causes**:
1. **Missing or ineffective database index** (confidence: high if specific query pattern)
   - Queries performing full table scans
   - Query performance degrades as table grows
   - Evidence: consistent slow queries on specific tables
   
2. **Table growth exceeding optimization thresholds** (confidence: medium)
   - Large tables causing query planner to choose inefficient plans
   - Statistics out of date
   - Evidence: gradual performance degradation over time
   
3. **Database resource contention** (confidence: high if DB metrics available)
   - CPU, memory, or I/O saturation on database server
   - Competing queries causing locks or resource contention
   - Evidence: database server resource metrics elevated
   
4. **Lock contention** (confidence: medium without lock metrics)
   - Queries waiting on locks held by other transactions
   - Long-running transactions blocking others
   - Evidence: query wait time high, inconsistent latency
   
5. **Cache invalidation or degradation** (confidence: medium if cache hit rate low)
   - Application cache ineffective or invalidated
   - More queries hitting database than expected
   - Evidence: low cache hit rate, increased query volume

**Cascade Pattern**:
```
Database query slowdown
  → Application request latency increases
  → Requests timeout at API layer
  → Connection pool pressure (connections held longer)
  → Potential connection pool exhaustion
  → Service degradation or failure
```

---

### Resource Saturation (CPU/Memory)

**Symptoms**:
- CPU utilization > 85-90% sustained
- Memory utilization > 90-95% sustained
- GC (garbage collection) warnings or pauses
- Thread pool saturation
- Request latency spikes
- Error rate increase
- System alerts for resource thresholds

**Probable Root Causes**:
1. **Traffic spike** (confidence: high if request rate elevated)
   - Sudden increase in load beyond capacity
   - Autoscaling not keeping pace
   - Evidence: request rate significantly above baseline
   
2. **Resource leak** (confidence: high if sustained over time)
   - Memory leak causing gradual memory exhaustion
   - Thread leak causing thread accumulation
   - Evidence: resource usage grows over time regardless of load
   
3. **Inefficient algorithm or processing** (confidence: medium)
   - CPU-intensive operations consuming resources
   - Inefficient code paths under certain conditions
   - Evidence: CPU spike with specific request types
   
4. **Cascading failure accumulation** (confidence: high if correlated with other failures)
   - Failures causing request accumulation
   - Accumulated threads/requests consuming resources
   - Evidence: queue buildup, connection pool saturation, error spike

**Cascade Pattern**:
```
Resource saturation
  → Request processing slows
  → Request queue builds
  → More resources consumed by queued requests
  → Positive feedback loop
  → Potential GC thrashing (memory) or CPU starvation
  → Complete service unresponsiveness
```

---

### Upstream Dependency Failures

**Symptoms**:
- `CONNECTION_REFUSED` errors to upstream service
- `SERVICE_UNAVAILABLE` or `UPSTREAM_TIMEOUT` errors
- Consistent failure pattern (100% failure rate to dependency)
- No intermittent successes

**Probable Root Causes**:
1. **Upstream service crash** (confidence: very high if 100% failure)
   - Service process terminated or crashed
   - Not listening on expected port
   - Evidence: immediate consistent failures, no recovery
   
2. **Upstream deployment or restart** (confidence: high if time-bound)
   - Service redeployed or restarted
   - Temporary unavailability during startup
   - Evidence: failure duration matches typical startup time
   
3. **Upstream resource exhaustion** (confidence: medium without upstream metrics)
   - Upstream service saturated and rejecting connections
   - Load shedding or overload protection active
   - Evidence: error messages indicating overload
   
4. **Network partition** (confidence: medium without network telemetry)
   - Network connectivity lost between services
   - Routing failure or firewall issue
   - Evidence: multiple upstream services failing simultaneously

**Impact Consideration**:
- Severity depends on criticality of upstream service
- If upstream handles critical business function, impact may be severe even with moderate error rate
- Assess blast radius: which features depend on failed upstream service?

---

## Cascading Failure Patterns

### Pattern 1: Connection Pool → Thread Pool → Resource Saturation

**Sequence**:
1. Database connection pool exhaustion (root cause varies)
2. Application threads wait for available connections
3. Thread pool fills with waiting threads
4. CPU/memory pressure from accumulated threads
5. Request queue builds
6. Overall service degradation

**Detection Signals**:
- Connection pool errors + thread pool utilization + CPU/memory elevation
- Temporal correlation: connection errors appear first, resource saturation follows

**Severity**: HIGH to CRITICAL
**Cascade Risk**: HIGH

---

### Pattern 2: Service Failure → Circuit Breaker → Cascading Circuit Breaks

**Sequence**:
1. Initial service (Service A) fails or becomes unresponsive
2. Service B calling Service A experiences timeouts
3. Circuit breaker in Service B opens for calls to Service A
4. Service C calling Service B now experiences failures (Service B can't complete without Service A)
5. Circuit breaker in Service C opens
6. Cascade propagates through dependency graph

**Detection Signals**:
- Multiple `CIRCUIT_OPEN` messages
- Temporal sequence: circuit breaks occur in dependency order
- Increasing error rate across multiple services

**Severity**: HIGH to CRITICAL (depending on scope)
**Cascade Risk**: VERY HIGH

---

### Pattern 3: Slow Queries → Connection Hold → Pool Exhaustion

**Sequence**:
1. Database queries become slow (missing index, resource contention, etc.)
2. Slow queries hold database connections longer than expected
3. Connection pool drains as connections held
4. New requests cannot acquire connections
5. Connection pool exhaustion
6. Service degradation

**Detection Signals**:
- Slow query warnings preceding connection pool errors
- Database connection pool utilization rising
- Request latency increasing before connection errors appear

**Severity**: MEDIUM to HIGH
**Cascade Risk**: MEDIUM

---

### Pattern 4: Cache Degradation → Database Overload → Service Failure

**Sequence**:
1. Application cache fails, degrades, or is invalidated
2. Cache miss rate increases dramatically
3. Database receives significantly higher query load
4. Database saturates (CPU, memory, I/O)
5. Database queries slow down or timeout
6. Application degradation or failure

**Detection Signals**:
- Low cache hit rate (if metrics available)
- Sudden increase in database query volume
- Database resource saturation metrics
- Application latency spikes

**Severity**: MEDIUM to HIGH
**Cascade Risk**: MEDIUM

---

### Pattern 5: Traffic Spike → Capacity Limit → Resource Exhaustion

**Sequence**:
1. Sudden increase in request volume (viral event, marketing campaign, DDoS)
2. Service reaches capacity limits
3. Request queue builds
4. Resource saturation (CPU, memory, connections)
5. Service degradation or failure
6. Potential cascade if autoscaling doesn't engage

**Detection Signals**:
- Elevated request rate significantly above baseline
- Resource utilization rising with request rate
- Queue depth increasing
- Error rate increasing under load

**Severity**: MEDIUM to HIGH (depends on autoscaling response)
**Cascade Risk**: MEDIUM

---

## Impact Assessment Framework

### User Experience Impact Levels

**CRITICAL**:
- Complete service unavailability (100% error rate)
- Core user-facing functionality completely broken
- Data loss affecting users
- Security breach affecting user data

**SEVERE**:
- Major functionality unavailable or severely degraded
- >25% of users unable to complete primary workflows
- Significant performance degradation (>5x normal latency)
- Partial outage of critical features

**MODERATE**:
- Noticeable degradation in user experience
- 10-25% of users affected
- 2-5x latency increase
- Secondary features unavailable, core features functional

**MINOR**:
- Minimal user-facing impact
- <10% of users affected
- Slight performance degradation (<2x latency)
- Edge cases or non-critical features affected

**NONE**:
- No user-facing impact
- Backend or internal systems only

---

### Business Operations Impact Levels

**CRITICAL**:
- Revenue-generating process completely stopped
- Regulatory compliance violation in progress
- Contractual SLA breach with severe financial penalties
- Brand reputation severely damaged

**SEVERE**:
- Revenue-generating process severely impaired
- Key business operations significantly degraded
- Partner or customer-facing commitments at risk
- Significant financial impact

**MODERATE**:
- Business operations degraded but continuing
- Operational efficiency reduced
- Internal workflow disruption
- Potential for escalation if sustained

**MINOR**:
- Minimal business impact
- Workarounds available
- Non-critical processes affected

**NONE**:
- No business impact

---

### SLA/SLO Impact Assessment

**Common SLA Thresholds**:
- **Availability**: Typically 99.5% - 99.99% depending on tier
- **Error Rate**: Typically < 0.1% - 1%
- **Latency**: Varies by service (API: <500ms, batch: minutes/hours)

**SLA Breach Severity**:
- **Severe Breach**: >10 percentage points below SLA (e.g., 89% vs 99%)
- **Significant Breach**: 5-10 percentage points below SLA
- **Minor Breach**: 1-5 percentage points below SLA
- **At Risk**: Within 1 percentage point of SLA threshold

**Time Dimension**:
- SLA typically measured over rolling windows (day, week, month)
- Short-duration incidents may not breach monthly SLA
- Sustained incidents (>1 hour) likely to cause SLA breach

---

## Diagnostic Confidence Calibration

### High Confidence (0.8 - 1.0)

**When to Assign**:
- Clear causal chain from evidence to hypothesis
- Multiple independent signals corroborate hypothesis
- Strong pattern match with known incident types
- Temporal sequence supports causal relationship
- Minimal conflicting evidence

**Example**: Connection pool exhaustion evidenced by explicit error codes, resource saturation, and temporal sequence

---

### Medium Confidence (0.6 - 0.8)

**When to Assign**:
- Plausible causal relationship with some ambiguity
- Partial signal corroboration
- Some conflicting or missing data
- Pattern match is approximate
- Alternative hypotheses possible but less likely

**Example**: Database query performance degradation suspected based on slow query warnings and latency, but no direct database metrics available

---

### Low Confidence (0.4 - 0.6)

**When to Assign**:
- Weak or unclear causal relationship
- Limited supporting evidence
- Significant data gaps
- Multiple equally plausible hypotheses
- High uncertainty about true root cause

**Example**: Upstream service failure suspected from connection refused errors, but no visibility into upstream health, could be network issue

---

### Very Low Confidence (< 0.4)

**When to Assign**:
- Insufficient evidence for meaningful diagnosis
- Highly speculative hypothesis
- Conflicting signals dominate
- Should be accompanied by explicit uncertainty acknowledgment

**Example**: Generic error messages with no pattern, no metrics, minimal log data

---

## Common Diagnostic Pitfalls to Avoid

### 1. Correlation vs. Causation

**Pitfall**: Assuming temporal correlation implies causation.

**Example**: CPU spike occurs at same time as error rate increase. Don't assume CPU caused errors without causal mechanism.

**Correct Approach**: Identify plausible causal pathway. CPU spike may be *effect* of errors (accumulated threads), not cause.

---

### 2. Confirmation Bias

**Pitfall**: Focusing only on evidence supporting initial hypothesis, ignoring contradictory signals.

**Correct Approach**: Actively seek alternative explanations. Consider evidence against primary hypothesis.

---

### 3. Overconfidence with Limited Data

**Pitfall**: Stating high confidence diagnosis when visibility is limited.

**Example**: Diagnosing database issue with high confidence when no database metrics available.

**Correct Approach**: Calibrate confidence to available evidence. Acknowledge data gaps explicitly.

---

### 4. Confusing Symptoms with Root Cause

**Pitfall**: Identifying a symptom as root cause without deeper analysis.

**Example**: "Root cause is high CPU." (CPU is symptom, not cause)

**Correct Approach**: Ask "why?" repeatedly. What caused the CPU spike?

---

### 5. Ignoring Blast Radius

**Pitfall**: Focusing only on directly affected service, missing cascade risk.

**Correct Approach**: Map dependencies. Identify downstream services at risk.

---

## Root Cause Categories Reference

### Resource Exhaustion
- Connection pools, thread pools, file handles, memory, CPU, disk I/O
- Typically results from leaks, traffic spikes, or cascade effects

### Configuration Error
- Incorrect settings, thresholds too low, missing parameters
- Often discovered after deployments or configuration changes

### Dependency Failure
- Upstream services down, third-party APIs unavailable, database unreachable
- Impact severity depends on dependency criticality

### Capacity Limit
- System hitting designed capacity ceiling
- Autoscaling not keeping pace with demand

### Data Corruption
- Invalid data causing processing failures
- Schema mismatches, encoding issues

### Network Issue
- Connectivity loss, routing failures, firewall changes
- Typically affects multiple services if infrastructure-level

### Software Bug
- Logic errors, race conditions, memory leaks, null pointer exceptions
- Often triggered by specific input patterns or edge cases

### External Service Degradation
- Third-party API slowdowns, cloud provider issues
- Outside direct control, requires failover or degraded mode

### Infrastructure Failure
- Hardware failures, cloud availability zone issues, orchestrator problems
- Typically requires infrastructure team intervention

---

## Knowledge Base Maintenance

**Version**: 1.0.0  
**Last Updated**: 2026-01-30  
**Maintenance Cycle**: Quarterly review recommended  

**Continuous Improvement**:
- Add new symptom-cause mappings from validated incidents
- Update confidence calibration based on diagnostic accuracy tracking
- Expand cascade patterns as new patterns discovered
- Refine impact assessment thresholds based on organizational SLAs

**Sources**:
- Enterprise incident post-mortems
- Industry best practices (Google SRE, AWS Well-Architected, Azure reliability)
- Production incident pattern analysis
- Service dependency mapping
