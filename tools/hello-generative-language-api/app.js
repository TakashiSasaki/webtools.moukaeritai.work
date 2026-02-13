let config = {
    apiKey: localStorage.getItem('playground_v6_api_key') || "",
    model: localStorage.getItem('playground_v6_model') || "gemini-2.5-flash-preview-09-2025"
};

let currentSidebarTab = 'v25';
const modelStats = JSON.parse(localStorage.getItem('playground_v6_stats') || "{}");

const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const modelSelect = document.getElementById('model-select');
const modelListContainer = document.getElementById('model-list');
const loadingIndicator = document.getElementById('loading-indicator');
const statusBadge = document.getElementById('status-badge');
const setupNotice = document.getElementById('setup-notice');
const settingsModal = document.getElementById('settings-modal');
const apiKeyInput = document.getElementById('api-key-input');
const toast = document.getElementById('toast');
const toastText = document.getElementById('toast-text');
const copyChatModelsBtn = document.getElementById('copy-chat-models-btn');

// --- UI Logic ---

function setSidebarTab(tab) {
    currentSidebarTab = tab;
    initSidebar();
    refreshSidebar();
}

function refreshSidebarTabsUI() {
    const tabs = ['v3', 'v25', 'v20', 'gemma', 'others'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (!btn) return;
        if (t === currentSidebarTab) {
            btn.className = "py-1.5 text-[9px] font-bold rounded-lg bg-amber-600 text-white shadow-sm";
        } else {
            btn.className = "py-1.5 text-[9px] font-bold rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200";
        }
    });
}

function initSidebar() {
    refreshSidebarTabsUI();
    modelListContainer.innerHTML = '';

    const allOptions = Array.from(modelSelect.querySelectorAll('option'));
    const filtered = allOptions.filter(opt => {
        const val = opt.value.toLowerCase();
        if (currentSidebarTab === 'v3') return val.includes('gemini-3') || val.includes('nano-banana');
        if (currentSidebarTab === 'v25') return val.includes('gemini-2.5');
        if (currentSidebarTab === 'v20') return val.includes('gemini-2.0');
        if (currentSidebarTab === 'gemma') return val.includes('gemma');
        if (currentSidebarTab === 'others') {
            return !val.includes('gemini-3') && !val.includes('nano-banana') &&
                !val.includes('gemini-2.5') && !val.includes('gemini-2.0') &&
                !val.includes('gemma');
        }
        return false;
    });

    if (filtered.length === 0) {
        modelListContainer.innerHTML = '<div class="text-[10px] text-slate-400 text-center py-12">No models found</div>';
        return;
    }

    filtered.forEach(opt => {
        const item = document.createElement('div');
        item.id = `sidebar-item-${opt.value}`;
        item.className = `sidebar-item p-3 rounded-xl cursor-pointer hover:bg-slate-100 border border-transparent mb-1 ${config.model === opt.value ? 'active' : ''}`;
        item.onclick = () => {
            config.model = opt.value;
            modelSelect.value = opt.value;
            localStorage.setItem('playground_v6_model', opt.value);
            refreshSidebar();
            showToast(`Model: ${opt.value}`, "⚙️");
        };

        const lastResponse = modelStats[opt.value];
        const statusColor = lastResponse ? (lastResponse.error ? 'bg-rose-500' : 'bg-emerald-500') : 'bg-slate-300';
        const previewText = lastResponse ? lastResponse.text : "No interactions yet.";

        item.innerHTML = `
            <div class="flex items-center justify-between gap-2 mb-1">
                <div class="flex items-center gap-2 overflow-hidden">
                    <div class="status-dot w-1.5 h-1.5 rounded-full ${statusColor}"></div>
                    <span class="text-[11px] font-bold text-slate-700 truncate">${opt.text}</span>
                </div>
                <button class="copy-id-btn p-1 text-slate-400 hover:text-amber-600 rounded-md hover:bg-white/50 transition-colors" title="Copy Model ID">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                </button>
            </div>
            <p class="text-[10px] text-slate-400 last-output-preview italic leading-tight">
                ${previewText}
            </p>
        `;

        const copyBtn = item.querySelector('.copy-id-btn');
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(opt.value).then(() => {
                showToast(`ID Copied: ${opt.value}`, "📋");
            });
        };

        modelListContainer.appendChild(item);
    });
}

function refreshSidebar() {
    document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.getElementById(`sidebar-item-${config.model}`);
    if (activeItem) {
        activeItem.classList.add('active');
    }

    // Update previews
    for (const [mId, stat] of Object.entries(modelStats)) {
        const item = document.getElementById(`sidebar-item-${mId}`);
        if (item) {
            const dot = item.querySelector('.status-dot');
            const preview = item.querySelector('.last-output-preview');
            dot.className = `status-dot w-1.5 h-1.5 rounded-full ${stat.error ? 'bg-rose-500' : 'bg-emerald-500'}`;
            preview.innerText = stat.text;
            if (stat.error) {
                preview.classList.add('text-rose-400');
            } else {
                preview.classList.remove('text-rose-400');
            }
        }
    }
}

function showToast(msg, icon = "🤖") {
    toastText.innerText = msg;
    document.getElementById('toast-icon').innerText = icon;
    toast.classList.replace('opacity-0', 'opacity-100');
    toast.style.transform = 'translate(-50%, -10px)';
    setTimeout(() => {
        toast.classList.replace('opacity-100', 'opacity-0');
        toast.style.transform = 'translate(-50%, 0px)';
    }, 3000);
}

function refreshUIState() {
    if (!config.apiKey) {
        setupNotice.classList.remove('hidden');
        sendBtn.disabled = true;
    } else {
        setupNotice.classList.add('hidden');
        sendBtn.disabled = false;
    }
    apiKeyInput.value = config.apiKey;
    modelSelect.value = config.model;
    refreshSidebar();
}

function appendMessage(role, text, modelId) {
    const container = document.createElement('div');
    container.className = `flex flex-col ${role === 'user' ? 'items-end' : 'items-start'} space-y-1`;

    if (role === 'ai' && modelId) {
        const attribution = document.createElement('div');
        attribution.className = "text-[9px] font-black uppercase tracking-tighter text-slate-400 ml-2";
        attribution.innerText = modelId;
        container.appendChild(attribution);
    }

    const bubble = document.createElement('div');
    bubble.className = `message-bubble p-4 shadow-sm text-sm leading-relaxed ${role === 'user'
        ? 'bg-amber-600 text-white rounded-2xl rounded-tr-none'
        : 'bg-white border border-slate-200 rounded-2xl rounded-tl-none text-slate-700'
        }`;
    bubble.innerText = text;

    container.appendChild(bubble);
    chatWindow.appendChild(container);
    chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' });
}

// --- API & Engine ---

async function fetchAIResponse(prompt, retryCount = 0) {
    const maxRetries = 5;
    const backoffTimes = [1000, 2000, 4000, 8000, 16000];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errorJson = await response.json().catch(() => ({}));
            const msg = errorJson.error?.message || `Status: ${response.status}`;

            if ((response.status >= 500 || response.status === 429) && retryCount < maxRetries) {
                await new Promise(r => setTimeout(r, backoffTimes[retryCount]));
                return fetchAIResponse(prompt, retryCount + 1);
            }
            throw new Error(msg);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
    } catch (err) {
        if (retryCount < maxRetries && (err.name === 'TypeError' || err.message.includes('fetch'))) {
            await new Promise(r => setTimeout(r, backoffTimes[retryCount]));
            return fetchAIResponse(prompt, retryCount + 1);
        }
        throw err;
    }
}

async function handleSubmission() {
    const text = userInput.value.trim();
    if (!text || sendBtn.disabled || !config.apiKey) return;

    const usedModel = config.model;

    appendMessage('user', text);
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;
    loadingIndicator.classList.remove('hidden');
    statusBadge.innerText = "Embodying...";
    statusBadge.className = "hidden sm:block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200";

    try {
        const responseText = await fetchAIResponse(text);
        appendMessage('ai', responseText, usedModel);
        modelStats[usedModel] = { text: responseText, error: false };
        localStorage.setItem('playground_v6_stats', JSON.stringify(modelStats));
        refreshSidebar();
    } catch (err) {
        const errMsg = `❌ Integration Error: ${err.message}`;
        appendMessage('ai', errMsg, usedModel);
        modelStats[usedModel] = { text: errMsg, error: true };
        localStorage.setItem('playground_v6_stats', JSON.stringify(modelStats));
        refreshSidebar();
    } finally {
        sendBtn.disabled = false;
        loadingIndicator.classList.add('hidden');
        statusBadge.innerText = "Ready";
        statusBadge.className = "hidden sm:block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200";
    }
}

// --- Listeners ---

modelSelect.onchange = (e) => {
    config.model = e.target.value;
    localStorage.setItem('playground_v6_model', config.model);
    showToast(`Model: ${config.model}`, "⚙️");
};

document.getElementById('settings-btn').onclick = () => settingsModal.classList.remove('hidden');
document.getElementById('close-settings').onclick = () => settingsModal.classList.add('hidden');

document.getElementById('save-key-btn').onclick = () => {
    const val = apiKeyInput.value.trim();
    if (val) {
        config.apiKey = val;
        localStorage.setItem('playground_v6_api_key', val);
        showToast("Key Integrated", "🔑");
        settingsModal.classList.add('hidden');
        refreshUIState();
    }
};

document.getElementById('clear-key-btn').onclick = () => {
    if (confirm("Clear integration data?")) {
        config.apiKey = "";
        localStorage.removeItem('playground_v6_api_key');
        apiKeyInput.value = "";
        showToast("Cleared", "🗑️");
        refreshUIState();
    }
};

document.getElementById('list-models-btn').onclick = async () => {
    if (!config.apiKey) {
        showToast("Set API Key first", "⚠️");
        return;
    }

    const modal = document.getElementById('models-modal');
    const loading = document.getElementById('models-loading');
    const content = document.getElementById('models-content');
    const listInner = document.getElementById('models-list-inner');

    modal.classList.remove('hidden');
    loading.classList.remove('hidden');
    content.classList.add('hidden');
    listInner.innerHTML = '';

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (data.models) {
            const chatModelIds = data.models
                .filter(m => m.supportedGenerationMethods.includes('generateContent'))
                .map(m => m.name.replace('models/', ''));

            if (chatModelIds.length > 0) {
                copyChatModelsBtn.classList.remove('hidden');
                copyChatModelsBtn.onclick = () => {
                    navigator.clipboard.writeText(chatModelIds.join('\n')).then(() => {
                        showToast("Chat IDs Copied", "📋");
                    });
                };
            } else {
                copyChatModelsBtn.classList.add('hidden');
            }

            data.models.forEach(model => {
                const isInteractive = model.supportedGenerationMethods.includes('generateContent');
                const card = document.createElement('div');
                card.className = `bg-slate-50 border ${isInteractive ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'} rounded-xl p-4 flex flex-col gap-1 relative overflow-hidden`;

                card.innerHTML = `
                    ${isInteractive ? '<div class="absolute -right-6 top-2 rotate-45 bg-amber-500 text-white text-[8px] font-black px-8 py-0.5 shadow-sm">CHAT</div>' : ''}
                    <div class="flex justify-between items-start">
                        <span class="text-xs font-black text-amber-600 font-mono">${model.name.replace('models/', '')}</span>
                        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter bg-white px-1.5 py-0.5 rounded border border-slate-100">${model.version || 'v?'}</span>
                    </div>
                    <h4 class="text-sm font-bold text-slate-800 leading-tight">${model.displayName}</h4>
                    <p class="text-[11px] text-slate-500 leading-relaxed mt-1">${model.description || 'No description available.'}</p>
                    <div class="flex flex-wrap gap-2 mt-2">
                        ${(model.supportedGenerationMethods || []).map(m => {
                    const isTarget = m === 'generateContent';
                    return `<span class="text-[9px] font-bold ${isTarget ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'} px-1.5 py-0.5 rounded">${m}</span>`;
                }).join('')}
                    </div>
                `;
                listInner.appendChild(card);
            });
        }
        loading.classList.add('hidden');
        content.classList.remove('hidden');
    } catch (err) {
        loading.classList.add('hidden');
        showToast(`Fetch Error: ${err.message}`, "❌");
        modal.classList.add('hidden');
    }
};

document.getElementById('close-models').onclick = () => {
    document.getElementById('models-modal').classList.add('hidden');
};

document.getElementById('copy-models-btn').onclick = () => {
    const ids = Array.from(modelSelect.querySelectorAll('option')).map(opt => opt.value).join('\n');
    navigator.clipboard.writeText(ids).then(() => {
        showToast("IDs Copied to Clipboard", "📋");
    });
};

sendBtn.onclick = handleSubmission;
userInput.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmission();
    }
};

window.onload = () => {
    initSidebar();
    refreshUIState();
};
