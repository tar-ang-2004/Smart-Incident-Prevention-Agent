# UI Architecture
## Smart Incident Prevention Agent - Demo Interface

**Version:** 1.0  
**Purpose:** Hackathon demonstration of agentic orchestration  
**Technology Stack:** Pure HTML/CSS/JavaScript (no frameworks)

---

## 1. Page Layout Description

The UI follows a single-page application (SPA) pattern with three main sections arranged vertically:

```
┌─────────────────────────────────────────────────────────┐
│ HEADER: System Title + Status Indicator                │
├─────────────────────────────────────────────────────────┤
│ LEFT PANEL: Incident Input & Controls (30%)            │
│ RIGHT PANEL: Agent Orchestration Flow (70%)            │
├─────────────────────────────────────────────────────────┤
│ FOOTER: System Info + Demo Mode Indicator              │
└─────────────────────────────────────────────────────────┘
```

### Layout Regions

**Header (Fixed Top)**
- System branding: "Smart Incident Prevention Agent"
- Live status indicator (simulated)
- Demo mode badge
- Height: 60px

**Main Content Area (Scrollable)**
- Two-column layout with 30/70 split
- Left: Input and control panel
- Right: Agent flow visualization
- Responsive breakpoint at 768px (stacks vertically on mobile)

**Footer (Fixed Bottom)**
- Powered by IBM watsonx Orchestrate
- Demo disclaimer
- Height: 40px

---

## 2. Component Hierarchy

```
App Root
│
├── Header Component
│   ├── Logo/Title
│   ├── System Status Badge
│   └── Demo Mode Indicator
│
├── Main Container
│   ├── Control Panel (Left)
│   │   ├── Incident Input Viewer
│   │   ├── Scenario Selector
│   │   └── Run Simulation Button
│   │
│   └── Agent Flow Panel (Right)
│       ├── Flow Timeline
│       │   ├── Stage 1: Monitoring Agent
│       │   ├── Stage 2: Analysis Agent
│       │   └── Stage 3: Response Planning Agent
│       │
│       ├── Agent Output Cards (Dynamic)
│       │   ├── Card Header (Agent Name + Status)
│       │   ├── Reasoning Summary
│       │   ├── Confidence Score
│       │   ├── Output Data (Collapsible JSON)
│       │   └── Escalation Indicator
│       │
│       └── Final Response Plan
│           ├── Severity Badge
│           ├── Recommended Actions
│           ├── Human-in-the-Loop Flag
│           └── Safety Controls Summary
│
└── Footer Component
    ├── Attribution Text
    └── Technical Stack Info
```

---

## 3. State Flow Diagram

```
┌─────────────────┐
│  INITIAL STATE  │
│  (Idle)         │
└────────┬────────┘
         │
         │ User selects scenario
         ▼
┌─────────────────┐
│  LOADING STATE  │
│  (Simulating)   │
└────────┬────────┘
         │
         │ Mock delay (1.5s)
         ▼
┌─────────────────┐
│ MONITORING      │ ──────► Display Agent 1 Output
│ AGENT ACTIVE    │         (Anomaly Detection)
└────────┬────────┘
         │
         │ Auto-advance (1s)
         ▼
┌─────────────────┐
│ ANALYSIS        │ ──────► Display Agent 2 Output
│ AGENT ACTIVE    │         (Root Cause Analysis)
└────────┬────────┘
         │
         │ Auto-advance (1s)
         ▼
┌─────────────────┐
│ RESPONSE        │ ──────► Display Agent 3 Output
│ AGENT ACTIVE    │         (Response Plan)
└────────┬────────┘
         │
         │ Complete
         ▼
┌─────────────────┐
│  COMPLETE       │ ──────► Show Final Summary
│  STATE          │         + Reset Option
└─────────────────┘
```

### State Transitions

| Current State | Event | Next State | Side Effects |
|---------------|-------|------------|--------------|
| Idle | Run Simulation | Loading | Clear previous outputs |
| Loading | Timer Complete | Monitoring Agent Active | Show agent 1 card |
| Agent 1 Active | Timer Complete | Analysis Agent Active | Show agent 2 card |
| Agent 2 Active | Timer Complete | Response Agent Active | Show agent 3 card |
| Agent 3 Active | Timer Complete | Complete | Show final plan |
| Complete | Reset | Idle | Clear all outputs |

---

## 4. Data Flow Between Agents

```
┌──────────────────────┐
│  Incident Input      │
│  (JSON)              │
│  - alertId           │
│  - timestamp         │
│  - metrics           │
│  - metadata          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Monitoring Agent    │
│  Input: Raw alert    │
│  Output:             │
│  - anomalyDetected   │
│  - severity          │
│  - confidence        │
│  - reasoning         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Analysis Agent      │
│  Input: Anomaly data │
│  Output:             │
│  - rootCause         │
│  - impactedServices  │
│  - historicalContext │
│  - reasoning         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Response Agent      │
│  Input: Root cause   │
│  Output:             │
│  - actionPlan        │
│  - playbooks         │
│  - escalationTarget  │
│  - humanApproval     │
│  - reasoning         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Final Response Plan │
│  (User-Facing)       │
└──────────────────────┘
```

### Data Contract

Each agent output follows this structure:

```javascript
{
  "agentName": "string",
  "agentType": "monitoring | analysis | response",
  "status": "success | warning | error",
  "timestamp": "ISO 8601",
  "confidence": 0.0 - 1.0,
  "reasoning": "string",
  "data": {
    // Agent-specific output
  },
  "escalationRequired": boolean,
  "escalationReason": "string | null"
}
```

---

## 5. Mock Data Handling Strategy

### Approach: Pre-loaded Static Scenarios

**Rationale:**
- No backend server required
- Deterministic demo behavior
- Fast execution
- Easy to screen record

**Implementation:**

1. **Scenario Library**
   - 3-5 pre-defined incident scenarios
   - Stored in `ui_mock_data.json`
   - Loaded on page initialization

2. **Simulation Flow**
   - User selects a scenario from dropdown
   - Click "Run Simulation" triggers sequential display
   - Each agent output appears with timed delays
   - Transitions simulate real processing time

3. **Data Storage**
   ```javascript
   // Global state object
   window.demoState = {
     scenarios: [],           // Loaded from JSON
     currentScenario: null,   // Selected scenario
     executionStage: 'idle',  // Current stage
     agentOutputs: [],        // Collected results
     startTime: null
   };
   ```

4. **Timing Strategy**
   - Scenario selection: Immediate
   - Monitoring Agent: 1.5s delay
   - Analysis Agent: 1.0s after previous
   - Response Agent: 1.0s after previous
   - Total demo duration: ~4-5 seconds

5. **Reset Mechanism**
   - "Reset" button clears all outputs
   - Returns to idle state
   - Preserves scenario library

### Mock Data Structure

```javascript
{
  "scenarios": [
    {
      "id": "scenario-001",
      "name": "Database Connection Spike",
      "description": "Sudden increase in database connections",
      "input": { /* incident data */ },
      "monitoringOutput": { /* agent 1 result */ },
      "analysisOutput": { /* agent 2 result */ },
      "responseOutput": { /* agent 3 result */ }
    }
  ]
}
```

---

## 6. Component Communication

### Event-Driven Architecture

```
User Action (Click "Run")
    ↓
App Controller
    ↓
    ├──→ Update State (Loading)
    ├──→ Emit Event: "simulation.started"
    ├──→ Trigger Timer (1.5s)
    ↓
Timer Complete
    ↓
    ├──→ Update State (Agent 1 Active)
    ├──→ Emit Event: "agent.monitoring.complete"
    ├──→ Render Agent Card
    ├──→ Trigger Next Timer
    ↓
... (repeat for each agent)
```

### No Framework - Pure Events

```javascript
// Custom event dispatcher
function emitAgentEvent(eventName, data) {
  const event = new CustomEvent(eventName, { detail: data });
  document.dispatchEvent(event);
}

// Listener example
document.addEventListener('agent.monitoring.complete', (e) => {
  renderAgentCard('monitoring', e.detail);
});
```

---

## 7. Rendering Strategy

### Progressive Disclosure

1. **Initial Load**
   - Show only input panel and empty flow timeline
   - All agent cards hidden

2. **During Simulation**
   - Agent cards appear sequentially from top to bottom
   - Each card slides in with subtle fade
   - Previous cards remain visible

3. **Completion**
   - All three agent cards visible
   - Final response plan highlights at bottom
   - Reset button enabled

### Visual Feedback

- **Loading state:** Spinner in "Run Simulation" button
- **Active agent:** Pulsing border on current card
- **Completed agent:** Green checkmark icon
- **Error state:** Red border + error message

---

## 8. Explainability Integration

Each agent output card includes:

1. **Reasoning Summary Section**
   - Plain text explanation of decision
   - Visible by default
   - 2-3 sentences maximum

2. **Confidence Score**
   - Visual progress bar (0-100%)
   - Color-coded: Red (<60%), Yellow (60-80%), Green (>80%)

3. **Expandable Details**
   - Collapsed by default
   - Click to expand full JSON output
   - Syntax-highlighted for readability

4. **Escalation Rationale**
   - Shown only if escalation triggered
   - Highlighted in orange/red box
   - Explains why human review needed

---

## 9. Accessibility Considerations

- **Keyboard Navigation:** All interactive elements focusable via Tab
- **ARIA Labels:** Descriptive labels for screen readers
- **Color Contrast:** WCAG AA compliant (4.5:1 minimum)
- **Focus Indicators:** Visible blue outline on focus
- **Semantic HTML:** Proper heading hierarchy (h1 → h2 → h3)

---

## 10. Performance Characteristics

**Target Metrics:**
- Initial Load: < 500ms
- Simulation Execution: 4-5 seconds
- UI Interaction Response: < 100ms
- Memory Footprint: < 5MB
- Browser Support: Chrome 90+, Firefox 88+, Safari 14+

**Optimization Techniques:**
- Inline critical CSS
- Minimal DOM manipulation
- No external dependencies
- Pre-loaded mock data
- CSS transitions instead of JavaScript animations

---

## 11. File Structure

```
ui/
├── demo_index.html              # Main HTML structure
├── demo_styles.css              # All styling (no preprocessor)
├── demo_app.js                  # Application logic
├── ui_mock_data.json            # Demo scenarios
├── ui_architecture.md           # This file
├── ui_wireframe.md              # Visual layouts
```

---

## 12. Security & Privacy Notes

**Demo-Specific Considerations:**
- No sensitive data transmitted (all mock)
- No authentication required
- No cookies or local storage
- No external API calls
- Safe to share publicly

**Production Considerations (Not Implemented):**
- Would require authentication
- Would need data encryption
- Would implement RBAC
- Would add audit logging

---

## 13. Demo Workflow

**Recommended Presentation Flow:**

1. **Intro (30s)**
   - Show idle UI
   - Explain three-agent architecture

2. **Scenario Selection (15s)**
   - Select scenario from dropdown
   - Show input JSON

3. **Execution (4-5s)**
   - Click "Run Simulation"
   - Watch agents execute sequentially

4. **Explainability (60s)**
   - Expand reasoning for each agent
   - Highlight confidence scores
   - Show escalation logic

5. **Final Plan (30s)**
   - Review recommended actions
   - Discuss human-in-the-loop

6. **Reset & Q&A (30s)**
   - Reset simulation
   - Show different scenario if time permits

**Total Demo Duration:** ~3 minutes