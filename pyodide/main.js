const term = new window.Terminal({
  cursorBlink: true,
  convertEol: true,
  fontFamily: 'monospace',
});

let fitAddon;
if (window.FitAddon) {
  fitAddon = new window.FitAddon.FitAddon();
  term.loadAddon(fitAddon);
}

term.open(document.getElementById("term"));

if (fitAddon) {
  fitAddon.fit();
  window.addEventListener('resize', () => fitAddon.fit());
}

function writeln(s) { term.writeln(s); }
function write(s) { term.write(s); }

const worker = new Worker("./worker.js", { type: "module" });

worker.onmessage = (e) => {
  const { type, data } = e.data;
  if (type === "ready") {
    writeln("Pyodide ready.");
    prompt();
  } else if (type === "stdout") {
    write(data);
  } else if (type === "stderr") {
    write(data);
  } else if (type === "result") {
    if (data !== null && data !== undefined && data !== "") writeln(String(data));
    prompt();
  } else if (type === "error") {
    writeln(String(data));
    prompt();
  }
};

worker.postMessage({ type: "init", indexURL: "./pyodide/" });

let line = "";
const history = [];
let historyIndex = -1;

function prompt() {
  write("\r\n>>> ");
  line = "";
}

function clearLine() {
  // Move cursor to beginning of line, clear to end
  write("\r\x1b[K>>> ");
  line = "";
}

function setLine(newLine) {
  clearLine();
  line = newLine;
  write(line);
}

term.onData((s) => {
  if (s === "\r") { // Enter
    write("\r\n");
    if (line.trim().length > 0) {
      history.push(line);
      historyIndex = history.length;
    }
    worker.postMessage({ type: "exec", code: line });
  } else if (s === "\u007F") { // Backspace
    if (line.length > 0) {
      line = line.slice(0, -1);
      write("\b \b");
    }
  } else if (s === "\x1b[A") { // Up Arrow
    if (historyIndex > 0) {
      historyIndex--;
      setLine(history[historyIndex]);
    }
  } else if (s === "\x1b[B") { // Down Arrow
    if (historyIndex < history.length - 1) {
      historyIndex++;
      setLine(history[historyIndex]);
    } else {
      historyIndex = history.length;
      setLine("");
    }
  } else if (s >= " ") { // Printable characters
    line += s;
    write(s);
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(reg => {
      console.log('Service Worker registered', reg);
      updateCacheUI();
    })
    .catch(err => console.error('Service Worker registration failed', err));

  // Cache Management UI
  const cacheStatusEl = document.getElementById('cache-status');
  const resetBtn = document.getElementById('reset-cache-btn');

  async function updateCacheUI() {
    if (!cacheStatusEl || !resetBtn) return;

    const hasController = !!navigator.serviceWorker.controller;
    const keys = await caches.keys();
    const hasCache = keys.length > 0;

    if (hasController || hasCache) {
      cacheStatusEl.textContent = `App Cache: Active (${keys.length} caches)`;
      cacheStatusEl.classList.add('text-green-400');
      resetBtn.classList.remove('hidden');
    } else {
      cacheStatusEl.textContent = 'App Cache: Inactive';
      cacheStatusEl.classList.remove('text-green-400');
      resetBtn.classList.add('hidden');
    }
  }

  resetBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to reset the application cache? This will clear all offline data and reload the page.')) return;
    
    cacheStatusEl.textContent = 'Clearing cache...';
    resetBtn.disabled = true;

    // Unregister Service Workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
    }

    // Delete Caches
    const keys = await caches.keys();
    for (const key of keys) {
      await caches.delete(key);
    }

    // Reload
    window.location.reload();
  });

  // Initial check
  updateCacheUI();
} else {
  const cacheStatusEl = document.getElementById('cache-status');
  if (cacheStatusEl) {
    cacheStatusEl.textContent = 'App Cache: Not Supported';
  }
}