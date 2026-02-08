import { loadMicroPython } from './micropython.mjs';

const term = new window.Terminal({
  cursorBlink: true,
  convertEol: true,
  fontFamily: 'monospace',
});

const fitAddon = new window.FitAddon.FitAddon();
term.loadAddon(fitAddon);

term.open(document.getElementById("term"));
fitAddon.fit();
window.addEventListener('resize', () => fitAddon.fit());

term.writeln("Loading MicroPython...");

try {
  const mp = await loadMicroPython({
    stdout: (data) => {
      term.write(data);
    },
    stderr: (data) => {
      term.write(data);
    },
    linebuffer: false,
  });

  term.writeln("MicroPython ready.");
  mp.replInit();

  term.onData((data) => {
    for (let i = 0; i < data.length; i++) {
      mp.replProcessChar(data.charCodeAt(i));
    }
  });
} catch (e) {
  term.writeln("\r\nError loading MicroPython:");
  term.writeln(e.message);
  console.error(e);
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(reg => {
      console.log('Service Worker registered', reg);
      updateCacheUI();
    })
    .catch(err => console.error('Service Worker registration failed', err));

  // Cache Management UI
  const cacheStatusEl = document.getElementById('cache-status');
  const storageInfoEl = document.getElementById('storage-info');
  const resetBtn = document.getElementById('reset-cache-btn');

  async function updateCacheUI() {
    if (!cacheStatusEl || !resetBtn) return;

    const hasController = !!navigator.serviceWorker.controller;
    const keys = await caches.keys();
    const hasCache = keys.length > 0;

    if (navigator.storage && navigator.storage.estimate && storageInfoEl) {
      try {
        const estimate = await navigator.storage.estimate();
        const usedMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(1);
        const quotaMB = ((estimate.quota || 0) / (1024 * 1024)).toFixed(0);
        storageInfoEl.textContent = `• ${usedMB} MB used (of ~${quotaMB} MB quota)`;
      } catch (e) {
        console.warn('Storage estimate failed:', e);
        storageInfoEl.textContent = '• Storage info unavailable';
      }
    } else {
        console.log('Storage API not supported');
    }

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

