const state = {
  connectedAccounts: [],
  insights: [
    {
      title: 'Finance approvals pending',
      body: '3 invoices from Acme Corp and Brightline need approval before Friday.',
    },
    {
      title: 'Travel prep for NYC summit',
      body: 'Flights confirmed; hotel block expires tomorrow. Drafted reply to confirm attendance.',
    },
    {
      title: 'Follow up with beta customers',
      body: 'AI suggested tailored recap emails for 5 high-priority testers to retain momentum.',
    },
  ],
  metrics: {
    processed: 1284,
    processedTrend: '+148 today',
    drafts: 12,
    draftsTrend: '5 awaiting approval',
    focus: 6.5,
    focusTrend: '+2h vs. last week',
  },
  emails: [
    {
      id: 'team-sync',
      subject: 'Design system sync & handoff checklist',
      sender: 'Maya from Product',
      time: 'Today • 9:24 AM',
      body: `Hi Alex,\n\nHere\'s what we need to cover in tomorrow\'s design system sync:\n• Tokens rollout timeline\n• Component library QA plan\n• Announcing the new accessibility guardrails\n\nLet me know if the deck draft works or if you\'d like the assistant to polish it.\n\nThanks!`,
      summary:
        'Meeting agenda covers tokens rollout, QA plan, and accessibility guidelines announcement.',
      followUp: 'Schedule 30 min working session with Maya before Thursday.',
    },
    {
      id: 'investor-update',
      subject: 'Investor update: Q3 growth signals',
      sender: 'Lena • Horizon Ventures',
      time: 'Yesterday • 4:05 PM',
      body: `Alex,\n\nAppreciate the latest numbers. Could you share the product roadmap slides ahead of next Monday?\n\nAlso, would love a quick note on the AI assistant adoption metrics for our partners.\n\n— Lena`,
      summary:
        'Investor requests roadmap slides and AI adoption summary before Monday.',
      followUp: 'Draft investor summary and attach roadmap slides by Friday 2 PM.',
    },
  ],
  selectedEmailId: 'team-sync',
  assistantContext: '',
  lastSync: '—',
  counts: {
    indexed: 0,
    insights: 0,
    actions: 0,
  },
};

const connectionForm = document.querySelector('#connection-form');
const accountInput = document.querySelector('#account-email');
const accountsList = document.querySelector('#connected-accounts');
const connectionStatus = document.querySelector('#connection-status');
const lastSyncEl = document.querySelector('#last-sync');
const emailsIndexedEl = document.querySelector('#emails-indexed');
const insightsGeneratedEl = document.querySelector('#insights-generated');
const actionsScheduledEl = document.querySelector('#actions-scheduled');
const metricProcessedEl = document.querySelector('#metric-processed');
const metricProcessedTrendEl = document.querySelector('#metric-processed-trend');
const metricDraftsEl = document.querySelector('#metric-drafts');
const metricDraftsTrendEl = document.querySelector('#metric-drafts-trend');
const metricFocusEl = document.querySelector('#metric-focus');
const metricFocusTrendEl = document.querySelector('#metric-focus-trend');
const insightList = document.querySelector('#insight-list');
const conversation = document.querySelector('#conversation');
const chatForm = document.querySelector('#chat-form');
const chatInput = document.querySelector('#chat-input');
const insertContextBtn = document.querySelector('#insert-context');
const workspaceContent = document.querySelector('#workspace-content');
const tabs = document.querySelectorAll('.workspace-tabs .tab');
const syncButton = document.querySelector('#sync-now');
const newInsightButton = document.querySelector('#new-insight');

function renderAccounts() {
  accountsList.innerHTML = '';
  state.connectedAccounts.forEach((email) => {
    const li = document.createElement('li');
    li.className = 'account-chip';
    li.innerHTML = `
      <span>${email}</span>
      <button class="secondary" data-account="${email}">Disconnect</button>
    `;
    li.querySelector('button').addEventListener('click', () => {
      state.connectedAccounts = state.connectedAccounts.filter((acc) => acc !== email);
      if (state.connectedAccounts.length === 0) {
        connectionStatus.textContent = 'Offline';
        connectionStatus.classList.remove('status-online');
        connectionStatus.classList.add('status-offline');
      }
      renderAccounts();
    });
    accountsList.appendChild(li);
  });
}

function renderMetrics() {
  metricProcessedEl.textContent = state.metrics.processed.toLocaleString();
  metricProcessedTrendEl.textContent = state.metrics.processedTrend;
  metricDraftsEl.textContent = state.metrics.drafts;
  metricDraftsTrendEl.textContent = state.metrics.draftsTrend;
  metricFocusEl.textContent = `${state.metrics.focus}h`;
  metricFocusTrendEl.textContent = state.metrics.focusTrend;
}

function renderInsights() {
  insightList.innerHTML = '';
  state.insights.forEach((insight) => {
    const li = document.createElement('li');
    li.className = 'insight-item';
    li.innerHTML = `
      <h4>${insight.title}</h4>
      <p>${insight.body}</p>
    `;
    li.addEventListener('click', () => {
      state.assistantContext = `${insight.title}: ${insight.body}`;
      insertContextBtn.classList.add('highlighted');
      insertContextBtn.textContent = 'Context ready';
      setTimeout(() => {
        insertContextBtn.classList.remove('highlighted');
        insertContextBtn.textContent = 'Insert Latest Insight';
      }, 1200);
    });
    insightList.appendChild(li);
  });
}

function createMessage(role, content) {
  const wrapper = document.createElement('div');
  wrapper.className = 'message';
  wrapper.dataset.role = role;

  const header = document.createElement('header');
  header.textContent = role === 'user' ? 'You' : 'Inbox CoPilot';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = content;

  wrapper.append(header, bubble);
  return wrapper;
}

function renderConversation(initial = false) {
  if (initial) {
    conversation.innerHTML = '';
    const welcome = createMessage(
      'assistant',
      `Good morning! I\'ve prepared summaries for your priority threads and drafted two replies. Ask for a plan and I\'ll orchestrate it.`
    );
    conversation.appendChild(welcome);
  }
  conversation.scrollTop = conversation.scrollHeight;
}

function renderWorkspace(tab = 'preview') {
  workspaceContent.innerHTML = '';
  const email = state.emails.find((item) => item.id === state.selectedEmailId);

  if (tab === 'preview') {
    const template = document.querySelector('#email-template');
    const clone = template.content.cloneNode(true);
    clone.querySelector('#email-subject').textContent = email.subject;
    clone.querySelector('#email-sender').textContent = email.sender;
    clone.querySelector('#email-time').textContent = email.time;
    clone.querySelector('#email-body').innerHTML = email.body
      .split('\n')
      .map((line) => `<p>${line}</p>`)
      .join('');

    clone.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', (event) => {
        const action = event.currentTarget.dataset.action;
        if (action === 'snippet') {
          chatInput.value = `${chatInput.value}\n${email.summary}`.trim();
          chatInput.focus();
        } else if (action === 'todo') {
          addTask(email.followUp);
        } else if (action === 'reply') {
          activateTab('reply');
        }
      });
    });

    workspaceContent.appendChild(clone);
  }

  if (tab === 'reply') {
    const form = document.createElement('form');
    form.className = 'reply-form';
    form.innerHTML = `
      <header>
        <h3>Smart Reply Composer</h3>
        <p>Inbox CoPilot has drafted a response using the latest tone guide.</p>
      </header>
      <textarea id="reply-draft" required></textarea>
      <div class="chat-actions">
        <button type="button" class="secondary" id="tone-button">Polish tone</button>
        <button type="submit" class="primary">Send via Gmail</button>
      </div>
    `;

    const replyDraft = form.querySelector('#reply-draft');
    replyDraft.value = `Hi ${email.sender.split(' ')[0]},\n\nThanks for the update! I\'ll share the requested materials and keep you posted.\n\nBest,\nAlex`;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      addTask(`Confirm reply sent to ${email.sender}`);
      appendAssistantMessage(
        'Reply scheduled to send after your review. I\'ll nudge you if we hit the deadline.'
      );
    });

    form.querySelector('#tone-button').addEventListener('click', () => {
      replyDraft.value = `${replyDraft.value}\n\nPS: Added a warm closing per your preference.`;
    });

    workspaceContent.appendChild(form);
  }

  if (tab === 'calendar') {
    const wrapper = document.createElement('div');
    wrapper.className = 'calendar-view';
    wrapper.innerHTML = `
      <section class="calendar-card">
        <h3>Agenda Planner</h3>
        <p>Drag from insights into your schedule. Inbox CoPilot keeps your workload balanced.</p>
        <ul class="task-list" id="agenda-list"></ul>
      </section>
      <section class="calendar-card">
        <h3>Upcoming Highlights</h3>
        <ul class="task-list">
          <li><span>Strategy sync</span><span>Tomorrow • 10:30 AM</span></li>
          <li><span>Investor briefing</span><span>Friday • 1:00 PM</span></li>
          <li><span>Beta cohort retro</span><span>Monday • 9:00 AM</span></li>
        </ul>
      </section>
    `;

    workspaceContent.appendChild(wrapper);
    renderAgenda();
  }
}

function renderAgenda() {
  const agendaList = document.querySelector('#agenda-list');
  if (!agendaList) return;
  agendaList.innerHTML = '';

  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${task.title}</span><span>${task.time}</span>`;
    agendaList.appendChild(li);
  });
}

const tasks = [
  { title: 'Review design system deck', time: 'Today • 3:30 PM' },
  { title: 'Send roadmap slides to Lena', time: 'Friday • 1:30 PM' },
];

function addTask(title) {
  tasks.unshift({ title, time: 'To schedule' });
  renderAgenda();
  appendAssistantMessage(
    `Added to your task queue: <strong>${title}</strong>. Drag it to your calendar to lock in a time.`
  );
}

function appendAssistantMessage(message) {
  const msg = createMessage('assistant', message);
  conversation.appendChild(msg);
  renderConversation();
}

connectionForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = accountInput.value.trim();
  if (!email) return;

  if (!state.connectedAccounts.includes(email)) {
    state.connectedAccounts.push(email);
    connectionStatus.textContent = 'Online';
    connectionStatus.classList.add('status-online');
    connectionStatus.classList.remove('status-offline');
    state.lastSync = new Date().toLocaleString();
    state.counts.indexed += Math.floor(Math.random() * 200 + 50);
    state.counts.insights += Math.floor(Math.random() * 5 + 1);
    state.counts.actions += Math.floor(Math.random() * 3 + 1);
    updateStatusFooter();
    renderAccounts();
    appendAssistantMessage(
      `Connected <strong>${email}</strong>. I\'ll start indexing and surface insights here.`
    );
  }

  accountInput.value = '';
});

function updateStatusFooter() {
  lastSyncEl.textContent = state.lastSync;
  emailsIndexedEl.textContent = state.counts.indexed.toLocaleString();
  insightsGeneratedEl.textContent = state.counts.insights.toLocaleString();
  actionsScheduledEl.textContent = state.counts.actions.toLocaleString();
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const prompt = chatInput.value.trim();
  if (!prompt) return;

  const userMsg = createMessage('user', prompt);
  conversation.appendChild(userMsg);
  renderConversation();
  chatInput.value = '';

  setTimeout(() => {
    const insightContext = state.assistantContext
      ? `<p><em>Context used:</em> ${state.assistantContext}</p>`
      : '';
    const response = `
      <p>Here\'s what I recommend:</p>
      <ul>
        <li>Surface the investor update thread for a quick reply.</li>
        <li>Schedule a 25 min prep block before tomorrow\'s sync.</li>
        <li>Auto-tag incoming vendor emails under <strong>Finance</strong>.</li>
      </ul>
      ${insightContext}
    `;
    appendAssistantMessage(response);
    state.assistantContext = '';
    insertContextBtn.textContent = 'Insert Latest Insight';
  }, 600);
});

insertContextBtn.addEventListener('click', () => {
  const latestInsight = state.insights[0];
  if (!latestInsight) return;
  chatInput.value = `${chatInput.value}\n${latestInsight.title}: ${latestInsight.body}`.trim();
  chatInput.focus();
});

syncButton.addEventListener('click', () => {
  state.metrics.processed += Math.floor(Math.random() * 120 + 40);
  state.metrics.drafts += Math.floor(Math.random() * 3 + 1);
  state.metrics.focus += 0.5;
  state.lastSync = new Date().toLocaleTimeString();
  state.counts.indexed += Math.floor(Math.random() * 80 + 20);
  updateStatusFooter();
  renderMetrics();
  appendAssistantMessage('Sync complete. Highlights refreshed with today\'s activity.');
});

newInsightButton.addEventListener('click', () => {
  const newInsight = {
    title: 'AI spotted a scheduling conflict',
    body: 'Prep session overlaps with customer interview. Suggest moving the interview to 4:30 PM.',
  };
  state.insights.unshift(newInsight);
  renderInsights();
  appendAssistantMessage(
    'New insight pinned: prep session conflicts with customer interview. Shall I resolve it?'
  );
});

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    activateTab(tab.dataset.tab);
  });
});

function activateTab(tab) {
  tabs.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tab);
  });
  renderWorkspace(tab);
}

renderAccounts();
renderMetrics();
renderInsights();
renderConversation(true);
renderWorkspace('preview');
updateStatusFooter();
renderAgenda();
