const elements = {
    connectionStatus: document.querySelector('#connectionStatus'),
    closeButton: document.querySelector('#closeButton'),
    jobSelect: document.querySelector('#jobSelect'),
    jobDescription: document.querySelector('#jobDescription'),
    certificationBadge: document.querySelector('#certificationBadge'),
    buildOption: document.querySelector('#buildOption'),
    buildFirst: document.querySelector('#buildFirst'),
    runButton: document.querySelector('#runButton'),
    stopButton: document.querySelector('#stopButton'),
    downloadButton: document.querySelector('#downloadButton'),
    actionMessage: document.querySelector('#actionMessage'),
    runStatus: document.querySelector('#runStatus'),
    runName: document.querySelector('#runName'),
    runDuration: document.querySelector('#runDuration'),
    runResult: document.querySelector('#runResult'),
    statusCard: document.querySelector('.status-card'),
    stepCount: document.querySelector('#stepCount'),
    stepList: document.querySelector('#stepList'),
    failureCount: document.querySelector('#failureCount'),
    failureList: document.querySelector('#failureList'),
    logSearch: document.querySelector('#logSearch'),
    errorsOnly: document.querySelector('#errorsOnly'),
    wrapLines: document.querySelector('#wrapLines'),
    autoScroll: document.querySelector('#autoScroll'),
    logOutput: document.querySelector('#logOutput')
};

let jobs = [];
let sessionToken = '';
let state = {
    status: 'idle', steps: [], failures: [], log: [], startedAt: null, finishedAt: null
};
let logRenderPending = false;

function selectedJob() {
    return jobs.find(job => job.id === elements.jobSelect.value) || jobs[0];
}

function statusLabel(status) {
    return ({
        idle: 'Idle', running: 'Running', stopping: 'Stopping…',
        passed: 'Passed', failed: 'Failed', stopped: 'Stopped'
    })[status] || status;
}

function resultLabel() {
    if (state.status === 'passed') return state.certification ? 'Release checks passed' : 'Diagnostic passed';
    if (state.status === 'failed') return 'Checks failed';
    if (state.status === 'stopped') return 'Run stopped';
    if (state.status === 'running' || state.status === 'stopping') return 'Pending';
    return 'Not run';
}

function formatDuration(start, end) {
    if (!start) return '—';
    const milliseconds = Math.max(0, new Date(end || Date.now()).getTime() - new Date(start).getTime());
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

function updateSelection() {
    const job = selectedJob();
    if (!job) return;
    elements.jobDescription.textContent = job.description;
    elements.certificationBadge.textContent = job.certification ? 'Release-certifying' : 'Diagnostic only';
    elements.certificationBadge.className = `badge ${job.certification ? 'certification' : 'diagnostic'}`;
    elements.buildOption.classList.toggle('hidden', job.id !== 'release');
    elements.runButton.textContent = job.id === 'release' ? 'Run comprehensive QA' : `Run ${job.label}`;
}

function renderSteps() {
    elements.stepList.replaceChildren();
    elements.stepCount.textContent = `${state.steps.length} ${state.steps.length === 1 ? 'step' : 'steps'}`;
    if (!state.steps.length) {
        const item = document.createElement('li');
        item.className = 'empty-state';
        item.textContent = 'No run has started.';
        elements.stepList.append(item);
        return;
    }
    const symbols = { passed: '✓', failed: '×', running: '…', stopped: '■', pending: '•' };
    for (const step of state.steps) {
        const item = document.createElement('li');
        item.className = `step-item ${step.status}`;
        const symbol = document.createElement('span');
        symbol.className = 'step-symbol';
        symbol.setAttribute('aria-hidden', 'true');
        symbol.textContent = symbols[step.status] || '•';
        const label = document.createElement('span');
        label.className = 'step-label';
        label.textContent = step.label;
        const status = document.createElement('span');
        status.className = 'step-state';
        status.textContent = statusLabel(step.status);
        item.append(symbol, label, status);
        elements.stepList.append(item);
    }
}

function renderFailures() {
    elements.failureList.replaceChildren();
    const failures = state.failures || [];
    elements.failureCount.textContent = `${failures.length} found`;
    if (!failures.length) {
        const item = document.createElement('li');
        item.className = 'empty-state success-empty';
        item.textContent = 'No failures recorded.';
        elements.failureList.append(item);
        return;
    }
    for (const failure of failures) {
        const item = document.createElement('li');
        item.className = 'failure-item';
        item.textContent = failure;
        elements.failureList.append(item);
    }
}

function renderLog() {
    logRenderPending = false;
    const query = elements.logSearch.value.trim().toLocaleLowerCase();
    const errorsOnly = elements.errorsOnly.checked;
    const matching = (state.log || []).filter(entry => {
        const failure = entry.stream === 'stderr' || /(?:^|\s)(?:ERROR|EXCEPTION|TIMED OUT)(?:\s|:)|(?:assertions?|checks?|tests?|QA) failed\b/i.test(entry.text);
        return (!errorsOnly || failure) && (!query || entry.text.toLocaleLowerCase().includes(query));
    });
    elements.logOutput.replaceChildren();
    if (!matching.length) {
        const placeholder = document.createElement('p');
        placeholder.className = 'log-placeholder';
        placeholder.textContent = state.log?.length ? 'No output matches the current filters.' : 'Output will appear here when a run starts.';
        elements.logOutput.append(placeholder);
        return;
    }
    const fragment = document.createDocumentFragment();
    for (const entry of matching) {
        const line = document.createElement('p');
        const failure = entry.stream === 'stderr' || /(?:^|\s)(?:ERROR|EXCEPTION|TIMED OUT)(?:\s|:)|(?:assertions?|checks?|tests?|QA) failed\b/i.test(entry.text);
        line.className = `log-line ${entry.stream}${failure ? ' failure' : ''}`;
        line.textContent = entry.text || ' ';
        fragment.append(line);
    }
    elements.logOutput.append(fragment);
    if (elements.autoScroll.checked) elements.logOutput.scrollTop = elements.logOutput.scrollHeight;
}

function scheduleLogRender() {
    if (logRenderPending) return;
    logRenderPending = true;
    setTimeout(renderLog, 80);
}

function renderState() {
    const active = state.status === 'running' || state.status === 'stopping';
    elements.runStatus.textContent = statusLabel(state.status);
    elements.runName.textContent = state.label || selectedJob()?.label || 'Comprehensive release QA';
    elements.runDuration.textContent = formatDuration(state.startedAt, state.finishedAt);
    elements.runResult.textContent = resultLabel();
    elements.statusCard.dataset.status = state.status;
    elements.runButton.disabled = active;
    elements.jobSelect.disabled = active;
    elements.buildFirst.disabled = active;
    elements.stopButton.disabled = state.status !== 'running';
    elements.downloadButton.disabled = !state.runId;
    renderSteps();
    renderFailures();
    scheduleLogRender();
}

async function requestJson(url, options) {
    const response = await fetch(url, options);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
    return body;
}

async function startRun() {
    const job = selectedJob();
    if (!job) return;
    elements.actionMessage.textContent = '';
    try {
        await requestJson('/api/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CJ2R-QA-Token': sessionToken },
            body: JSON.stringify({ jobId: job.id, buildFirst: elements.buildFirst.checked })
        });
    } catch (error) {
        elements.actionMessage.textContent = error.message;
    }
}

async function stopRun() {
    elements.actionMessage.textContent = '';
    try { await requestJson('/api/stop', { method: 'POST', headers: { 'X-CJ2R-QA-Token': sessionToken } }); }
    catch (error) { elements.actionMessage.textContent = error.message; }
}

async function closeDashboard() {
    const active = state.status === 'running' || state.status === 'stopping';
    if (active && !window.confirm('A QA scan is active. Stop it and close the dashboard?')) return;
    elements.actionMessage.textContent = '';
    try {
        await requestJson('/api/shutdown', { method: 'POST', headers: { 'X-CJ2R-QA-Token': sessionToken } });
        elements.connectionStatus.textContent = 'Dashboard closed';
        elements.connectionStatus.className = 'connection-status disconnected';
        elements.closeButton.disabled = true;
    } catch (error) {
        elements.actionMessage.textContent = error.message;
    }
}

function downloadReport() {
    const timestamp = (state.finishedAt || new Date().toISOString()).replace(/[:.]/g, '-');
    const blob = new Blob([`${JSON.stringify(state, null, 2)}\n`], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cj2r-qa-${state.jobId || 'report'}-${timestamp}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
}

async function initialise() {
    try {
        sessionToken = (await requestJson('/api/session')).token;
        jobs = await requestJson('/api/jobs');
        const groups = new Map();
        for (const job of jobs) {
            const groupName = job.group || 'Other scans';
            if (!groups.has(groupName)) {
                const group = document.createElement('optgroup');
                group.label = groupName;
                groups.set(groupName, group);
                elements.jobSelect.append(group);
            }
            const option = document.createElement('option');
            option.value = job.id;
            option.textContent = `${job.label}${job.certification ? ' — release certification' : ''}`;
            groups.get(groupName).append(option);
        }
        state = await requestJson('/api/state');
        updateSelection();
        renderState();
    } catch (error) {
        elements.actionMessage.textContent = error.message;
    }

    const events = new EventSource('/api/events');
    events.addEventListener('open', () => {
        elements.connectionStatus.textContent = 'Connected locally';
        elements.connectionStatus.className = 'connection-status connected';
    });
    events.addEventListener('error', () => {
        elements.connectionStatus.textContent = 'Connection interrupted';
        elements.connectionStatus.className = 'connection-status disconnected';
    });
    events.addEventListener('state', event => {
        const incoming = JSON.parse(event.data);
        state = { ...state, ...incoming, log: state.log || [] };
        renderState();
    });
    events.addEventListener('reset', event => {
        state = JSON.parse(event.data);
        elements.logSearch.value = '';
        elements.errorsOnly.checked = false;
        renderState();
    });
    events.addEventListener('log', event => {
        state.log = state.log || [];
        state.log.push(JSON.parse(event.data));
        if (state.log.length > 12000) state.log.splice(0, state.log.length - 12000);
        scheduleLogRender();
    });
}

elements.jobSelect.addEventListener('change', updateSelection);
elements.runButton.addEventListener('click', startRun);
elements.stopButton.addEventListener('click', stopRun);
elements.closeButton.addEventListener('click', closeDashboard);
elements.downloadButton.addEventListener('click', downloadReport);
elements.logSearch.addEventListener('input', scheduleLogRender);
elements.errorsOnly.addEventListener('change', scheduleLogRender);
elements.wrapLines.addEventListener('change', () => elements.logOutput.classList.toggle('wrap', elements.wrapLines.checked));

setInterval(() => {
    if (state.status === 'running' || state.status === 'stopping') elements.runDuration.textContent = formatDuration(state.startedAt, null);
}, 1000);

void initialise();
