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