# Demo Video Outline
## Smart Incident Prevention Agent - 3-Minute Demonstration

---

### 0:00 – 0:30 | Introduction

**Objective**: Establish context and value proposition

**Content**:
- Open with title card: "Smart Incident Prevention Agent - Powered by IBM watsonx Orchestrate"
- Problem statement: "Enterprise operations teams manage hundreds of alerts daily, spending hours on manual incident analysis and response planning."
- Solution overview: "This system demonstrates how multi-agent AI orchestration can automate incident detection, root cause analysis, and response planning while maintaining human oversight."
- Show idle UI interface

**Visuals**: Title card, problem context slide, transition to live demo UI

---

### 0:30 – 1:00 | System Architecture Overview

**Objective**: Explain the three-agent architecture and orchestration flow

**Content**:
- Display architecture diagram showing three agents
- Explain agent sequence:
  - "Monitoring Agent detects anomalies from alerts and logs"
  - "Analysis Agent identifies root causes using historical patterns"
  - "Response Planning Agent generates safety-aware action plans"
- Highlight orchestration layer: "IBM watsonx Orchestrate coordinates sequential execution and data flow between agents"
- Transition to scenario selection

**Visuals**: Architecture diagram, agent flow timeline, UI scenario selector

---

### 1:00 – 2:15 | Agent Execution Demonstration

**Objective**: Show live agent collaboration with explainability

**Content**:
- Select demo scenario: "Database Connection Spike"
- Display input alert JSON preview
- Click "Run Simulation" button
- **Monitoring Agent execution (1:00 – 1:25)**:
  - Show agent activation in timeline
  - Display reasoning summary: "Detected anomalous spike in database connections exceeding threshold by 90%"
  - Highlight confidence score: 85%
  - Expand JSON output to show structured findings
  
- **Analysis Agent execution (1:25 – 1:50)**:
  - Show timeline progression to Analysis Agent
  - Display root cause identification: "Connection pool exhaustion from N+1 query pattern"
  - Show historical correlation: "3 similar incidents in past 30 days"
  - Point out deployment correlation with version 3.2.1
  - Highlight confidence score: 78%
  
- **Response Planning Agent execution (1:50 – 2:15)**:
  - Show final agent activation
  - Display generated action plan with three priority levels
  - Highlight escalation warning: "Human approval required for database configuration change"
  - Show confidence score: 92%
  - Point out escalation rationale and risk assessment

**Visuals**: Live UI showing sequential agent execution, reasoning summaries, confidence scores, expanded JSON details

---

### 2:15 – 2:45 | Response Plan Review

**Objective**: Demonstrate actionable output and safety controls

**Content**:
- Scroll to Final Response Plan section
- Highlight severity badge and timestamp
- Review prioritized actions:
  - "Priority 1: Immediate actions for service restoration"
  - "Priority 2: Short-term fixes addressing root cause"
  - "Priority 3: Long-term preventive measures"
- Show applied playbooks: "Database Performance Degradation Playbook"
- Emphasize Human-in-the-Loop section:
  - "Action requires platform team approval"
  - "Risk level: Medium"
  - "Escalation target: Platform Engineering Team"
  - "SLA: 15 minutes"
- Display safety controls checklist: "Pre-deployment validation enabled, rollback plan prepared, blast radius limited"

**Visuals**: Response plan UI with action priorities, playbooks, escalation workflow, safety controls

---

### 2:45 – 3:00 | Conclusion and Key Takeaways

**Objective**: Reinforce value proposition and capabilities

**Content**:
- Summary statement: "This multi-agent system demonstrates how AI orchestration can transform incident management"
- Key benefits:
  - "Automated anomaly detection in seconds"
  - "Root cause analysis with historical context"
  - "Safety-aware response planning with human oversight"
  - "Complete explainability and reasoning transparency"
- Call to action: "Built with IBM watsonx Orchestrate for enterprise-grade agentic AI"
- Display project repository information or contact details
- Fade to end card with project title and IBM branding

**Visuals**: Summary slide with key benefits, closing title card

---

## Production Notes

- **Recording resolution**: 1920x1080
- **Browser zoom**: 110% for visibility
- **Cursor highlighting**: Enabled for clarity
- **Pacing**: Speak slowly and clearly, pause briefly between agent transitions
- **Audio**: Use professional narration or clear voiceover
- **Editing**: Add subtle transitions between sections, no flashy effects
- **Background music**: Optional light instrumental at low volume during intro/outro only

## Script Tone Guidelines

- Professional and technical but accessible
- Emphasize capabilities without exaggeration
- Focus on "how" and "why" for technical audience
- Maintain steady pacing—avoid rushing through demonstrations
- Allow time for viewers to read on-screen text and JSON outputs