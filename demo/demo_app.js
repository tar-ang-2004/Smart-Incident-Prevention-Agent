/**
 * Smart Incident Prevention Agent - Demo UI
 * JavaScript Application Logic
 */

// ============================================
// GLOBAL STATE
// ============================================
const appState = {
    scenarios: [],
    currentScenario: null,
    executionStage: 'idle',
    agentOutputs: [],
    startTime: null
};

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
    scenarioDropdown: null,
    jsonInput: null,
    inputPreview: null,
    runBtn: null,
    resetBtn: null,
    copyJsonBtn: null,
    btnSpinner: null,
    systemStatus: null,
    emptyState: null,
    agentOutputs: null,
    responsePlan: null,
    stages: {}
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    initializeElements();
    await loadScenarios();
    attachEventListeners();
});

function initializeElements() {
    elements.scenarioDropdown = document.getElementById('scenarioDropdown');
    elements.jsonInput = document.getElementById('jsonInput');
    elements.inputPreview = document.getElementById('inputPreview');
    elements.runBtn = document.getElementById('runSimulationBtn');
    elements.resetBtn = document.getElementById('resetBtn');
    elements.copyJsonBtn = document.getElementById('copyJsonBtn');
    elements.btnSpinner = document.getElementById('btnSpinner');
    elements.systemStatus = document.getElementById('systemStatus');
    elements.emptyState = document.getElementById('emptyState');
    elements.agentOutputs = document.getElementById('agentOutputs');
    elements.responsePlan = document.getElementById('responsePlan');
    
    // Get stage elements
    const stageElements = document.querySelectorAll('.stage');
    stageElements.forEach(stage => {
        const stageName = stage.dataset.stage;
        elements.stages[stageName] = stage;
    });
}

// ============================================
// DATA LOADING
// ============================================
async function loadScenarios() {
    try {
        const response = await fetch('ui_mock_data.json');
        const data = await response.json();
        appState.scenarios = data.scenarios;
        populateScenarioDropdown();
    } catch (error) {
        console.error('Error loading scenarios:', error);
        alert('Failed to load demo scenarios. Please check that ui_mock_data.json is available.');
    }
}

function populateScenarioDropdown() {
    appState.scenarios.forEach(scenario => {
        const option = document.createElement('option');
        option.value = scenario.id;
        option.textContent = scenario.name;
        elements.scenarioDropdown.appendChild(option);
    });
}

// ============================================
// EVENT LISTENERS
// ============================================
function attachEventListeners() {
    elements.scenarioDropdown.addEventListener('change', handleScenarioSelection);
    elements.runBtn.addEventListener('click', handleRunSimulation);
    elements.resetBtn.addEventListener('click', handleReset);
    elements.copyJsonBtn.addEventListener('click', handleCopyJson);
}

function handleScenarioSelection(event) {
    const scenarioId = event.target.value;
    
    if (!scenarioId) {
        appState.currentScenario = null;
        elements.inputPreview.style.display = 'none';
        elements.runBtn.disabled = true;
        return;
    }
    
    appState.currentScenario = appState.scenarios.find(s => s.id === scenarioId);
    
    if (appState.currentScenario) {
        displayInputPreview(appState.currentScenario.input);
        elements.runBtn.disabled = false;
    }
}

function displayInputPreview(inputData) {
    elements.jsonInput.textContent = JSON.stringify(inputData, null, 2);
    elements.inputPreview.style.display = 'block';
}

function handleCopyJson() {
    const jsonText = elements.jsonInput.textContent;
    navigator.clipboard.writeText(jsonText).then(() => {
        const originalText = elements.copyJsonBtn.textContent;
        elements.copyJsonBtn.textContent = 'Copied!';
        setTimeout(() => {
            elements.copyJsonBtn.textContent = originalText;
        }, 2000);
    });
}

// ============================================
// SIMULATION EXECUTION
// ============================================
async function handleRunSimulation() {
    if (!appState.currentScenario) return;
    
    // Clear previous outputs
    clearAgentOutputs();
    
    // Update UI state
    appState.executionStage = 'processing';
    appState.startTime = new Date();
    updateSystemStatus('Processing');
    
    // Disable controls
    elements.runBtn.disabled = true;
    elements.scenarioDropdown.disabled = true;
    elements.btnSpinner.style.display = 'inline-block';
    
    // Hide empty state
    elements.emptyState.style.display = 'none';
    
    // Sequential execution
    await executeAgent('monitoring', appState.currentScenario.monitoringOutput, 1500);
    await executeAgent('analysis', appState.currentScenario.analysisOutput, 1000);
    await executeAgent('response', appState.currentScenario.responseOutput, 1000);
    
    // Show final response plan
    await new Promise(resolve => setTimeout(resolve, 500));
    displayResponsePlan(appState.currentScenario.responseOutput.data);
    
    // Complete
    appState.executionStage = 'completed';
    updateSystemStatus('Completed');
    elements.btnSpinner.style.display = 'none';
    elements.resetBtn.disabled = false;
}

async function executeAgent(agentType, agentData, delay) {
    // Update timeline
    updateStageStatus(agentType, 'active');
    
    // Wait for delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Render agent card
    renderAgentCard(agentData);
    
    // Update timeline
    updateStageStatus(agentType, 'completed');
}

function updateStageStatus(stageName, status) {
    const stage = elements.stages[stageName];
    if (stage) {
        stage.dataset.status = status;
        
        const icon = stage.querySelector('.stage-status-icon');
        if (status === 'pending') {
            icon.textContent = '○';
        } else if (status === 'active') {
            icon.textContent = '●';
        } else if (status === 'completed') {
            icon.textContent = '✓';
        }
    }
}

function updateSystemStatus(status) {
    elements.systemStatus.textContent = status;
    const indicator = document.querySelector('.status-indicator');
    
    if (status === 'Idle') {
        indicator.dataset.status = 'idle';
    } else if (status === 'Processing') {
        indicator.dataset.status = 'processing';
    } else if (status === 'Completed') {
        indicator.dataset.status = 'completed';
    }
}

// ============================================
// AGENT CARD RENDERING
// ============================================
function renderAgentCard(agentData) {
    const template = document.getElementById('agentCardTemplate');
    const card = template.content.cloneNode(true);
    
    // Set agent type
    const cardElement = card.querySelector('.agent-card');
    cardElement.dataset.agent = agentData.agentType;
    
    // Populate header
    card.querySelector('.card-agent-name').textContent = agentData.agentName;
    
    const statusBadge = card.querySelector('.status-badge');
    statusBadge.textContent = agentData.status === 'success' ? 'Completed ✓' : agentData.status.toUpperCase();
    statusBadge.classList.add(agentData.status);
    
    const timestamp = new Date(agentData.timestamp).toLocaleTimeString();
    card.querySelector('.card-timestamp').textContent = timestamp;
    
    // Populate reasoning
    card.querySelector('.reasoning-text').textContent = agentData.reasoning;
    
    // Populate confidence
    const confidencePercent = Math.round(agentData.confidence * 100);
    card.querySelector('.confidence-value').textContent = `${confidencePercent}%`;
    
    const confidenceFill = card.querySelector('.confidence-fill');
    confidenceFill.style.width = `${confidencePercent}%`;
    
    // Set confidence color
    if (confidencePercent > 80) {
        confidenceFill.classList.add('high');
    } else if (confidencePercent >= 60) {
        confidenceFill.classList.add('medium');
    } else {
        confidenceFill.classList.add('low');
    }
    
    // Show escalation warning if needed
    if (agentData.escalationRequired) {
        const escalationWarning = card.querySelector('.escalation-warning');
        escalationWarning.style.display = 'flex';
        escalationWarning.querySelector('.escalation-reason').textContent = agentData.escalationReason;
    }
    
    // Populate JSON output
    card.querySelector('.json-output').textContent = JSON.stringify(agentData, null, 2);
    
    // Attach toggle event
    const toggleBtn = card.querySelector('.toggle-details-btn');
    const detailsSection = cardElement.querySelector('.details-section');
    const detailsContent = card.querySelector('.details-content');
    
    toggleBtn.addEventListener('click', () => {
        const isExpanded = detailsSection.classList.contains('collapsed');
        
        if (isExpanded) {
            detailsSection.classList.remove('collapsed');
            detailsContent.style.display = 'block';
            toggleBtn.innerHTML = '<span class="toggle-icon">▼</span> Hide Details';
        } else {
            detailsSection.classList.add('collapsed');
            detailsContent.style.display = 'none';
            toggleBtn.innerHTML = '<span class="toggle-icon">▼</span> View Details';
        }
    });
    
    // Attach copy JSON event
    const copyBtn = card.querySelector('.copy-json-btn');
    copyBtn.addEventListener('click', () => {
        const jsonText = card.querySelector('.json-output').textContent;
        navigator.clipboard.writeText(jsonText).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        });
    });
    
    // Append to container
    elements.agentOutputs.appendChild(card);
}

// ============================================
// RESPONSE PLAN RENDERING
// ============================================
function displayResponsePlan(planData) {
    elements.responsePlan.innerHTML = '';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'plan-header';
    header.innerHTML = `
        <h2>Final Response Plan</h2>
        <div class="plan-meta">
            <span class="severity-badge ${planData.severity}">${planData.severity.toUpperCase()}</span>
            <span class="timestamp">${new Date().toLocaleString()}</span>
        </div>
    `;
    elements.responsePlan.appendChild(header);
    
    // Summary
    const summary = document.createElement('div');
    summary.className = 'plan-summary';
    summary.innerHTML = `
        <h3>Incident Summary</h3>
        <p class="summary-text">${planData.summary}</p>
    `;
    elements.responsePlan.appendChild(summary);
    
    // Recommended Actions
    const actionsSection = document.createElement('div');
    actionsSection.className = 'recommended-actions';
    actionsSection.innerHTML = '<h3>Recommended Actions</h3>';
    
    ['priority1', 'priority2', 'priority3'].forEach((priority, index) => {
        const actions = planData.actionPlan[priority];
        if (actions && actions.length > 0) {
            const actionGroup = document.createElement('div');
            actionGroup.className = 'action-group';
            actionGroup.dataset.priority = index + 1;
            
            let priorityLabel = 'Preventive';
            if (index === 0) priorityLabel = 'Immediate';
            else if (index === 1) priorityLabel = 'Short-term';
            
            actionGroup.innerHTML = `<h4>Priority ${index + 1} (${priorityLabel})</h4>`;
            
            const actionList = document.createElement('ul');
            actionList.className = 'action-list';
            
            actions.forEach(action => {
                const li = document.createElement('li');
                li.textContent = action.action || action.text || action;
                actionList.appendChild(li);
            });
            
            actionGroup.appendChild(actionList);
            actionsSection.appendChild(actionGroup);
        }
    });
    
    elements.responsePlan.appendChild(actionsSection);
    
    // Playbooks
    if (planData.playbooks && planData.playbooks.length > 0) {
        const playbooksSection = document.createElement('div');
        playbooksSection.className = 'playbooks-section';
        playbooksSection.innerHTML = '<h3>Playbooks Applied</h3>';
        
        const playbookList = document.createElement('ul');
        playbookList.className = 'playbook-list';
        
        planData.playbooks.forEach(playbook => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${playbook.name}</strong><br>Source: ${playbook.source}`;
            playbookList.appendChild(li);
        });
        
        playbooksSection.appendChild(playbookList);
        elements.responsePlan.appendChild(playbooksSection);
    }
    
    // Human in the Loop
    if (planData.humanInTheLoop && planData.humanInTheLoop.required) {
        const humanLoop = planData.humanInTheLoop;
        const humanLoopSection = document.createElement('div');
        humanLoopSection.className = 'human-loop-section';
        humanLoopSection.innerHTML = `
            <h3><span class="loop-icon">⚠</span> HUMAN-IN-THE-LOOP REQUIRED</h3>
            <div class="loop-details">
                <p><strong>Action:</strong> ${humanLoop.action}</p>
                <p><strong>Risk Level:</strong> ${humanLoop.riskLevel.toUpperCase()}</p>
                <p><strong>Reason:</strong> ${humanLoop.reason}</p>
                <p><strong>Escalation Target:</strong> ${humanLoop.escalationTarget}</p>
                <p><strong>SLA:</strong> ${humanLoop.sla}</p>
            </div>
            <div class="loop-actions">
                <button class="btn-success">Approve</button>
                <button class="btn-warning">Request Changes</button>
                <button class="btn-danger">Escalate Further</button>
            </div>
        `;
        elements.responsePlan.appendChild(humanLoopSection);
    }
    
    // Safety Controls
    if (planData.safetyControls && planData.safetyControls.length > 0) {
        const safetySection = document.createElement('div');
        safetySection.className = 'safety-controls';
        safetySection.innerHTML = '<h3>Safety Controls</h3>';
        
        const controlsList = document.createElement('ul');
        controlsList.className = 'controls-list';
        
        planData.safetyControls.forEach(control => {
            const li = document.createElement('li');
            li.textContent = control;
            controlsList.appendChild(li);
        });
        
        safetySection.appendChild(controlsList);
        elements.responsePlan.appendChild(safetySection);
    }
    
    // Show the plan
    elements.responsePlan.style.display = 'block';
}

// ============================================
// RESET FUNCTIONALITY
// ============================================
function handleReset() {
    // Reset state
    appState.executionStage = 'idle';
    appState.currentScenario = null;
    appState.agentOutputs = [];
    appState.startTime = null;
    
    // Reset UI
    elements.scenarioDropdown.value = '';
    elements.scenarioDropdown.disabled = false;
    elements.inputPreview.style.display = 'none';
    elements.runBtn.disabled = true;
    elements.resetBtn.disabled = true;
    
    // Clear outputs
    clearAgentOutputs();
    
    // Show empty state
    elements.emptyState.style.display = 'block';
    
    // Hide response plan
    elements.responsePlan.style.display = 'none';
    
    // Reset timeline
    Object.keys(elements.stages).forEach(stageName => {
        updateStageStatus(stageName, 'pending');
    });
    
    // Reset status
    updateSystemStatus('Idle');
}

function clearAgentOutputs() {
    // Remove all agent cards except empty state
    const cards = elements.agentOutputs.querySelectorAll('.agent-card');
    cards.forEach(card => card.remove());
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatTimestamp(isoString) {
    return new Date(isoString).toLocaleTimeString();
}

function syntaxHighlight(json) {
    if (typeof json !== 'string') {
        json = JSON.stringify(json, null, 2);
    }
    
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
        function (match) {
            let cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        }
    );
}

// ============================================
// ERROR HANDLING
// ============================================
window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
