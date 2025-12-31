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
    }
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

