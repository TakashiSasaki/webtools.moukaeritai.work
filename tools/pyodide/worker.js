import { loadPyodide } from "./pyodide/pyodide.mjs";

let pyodide = null;

function post(type, data) {
  self.postMessage({ type, data });
}

self.onmessage = async (e) => {
  const msg = e.data;

  if (msg.type === "init") {
    pyodide = await loadPyodide({
      indexURL: msg.indexURL,
      stdout: (text) => post("stdout", text),
      stderr: (text) => post("stderr", text),
    });
    post("ready", null);
    return;
  }

  if (msg.type === "exec") {
    const code = msg.code ?? "";
    try {
      await pyodide.loadPackagesFromImports(code);

      // Pass code via globals to avoid string escaping issues
      const globals = pyodide.toPy({ code_to_run: code });
      
      const result = await pyodide.runPythonAsync(`
import ast
import sys

# Get code from the passed globals
_src = code_to_run

try:
    # Try to parse as an expression (eval mode)
    node = ast.parse(_src, mode="eval")
    # If successful, compile and evaluate
    _v = eval(compile(node, "<repl>", "eval"), globals(), globals())
    _v
except SyntaxError:
    # If it's not an expression (e.g. assignment, def), run as exec
    exec(compile(ast.parse(_src, mode="exec"), "<repl>", "exec"), globals(), globals())
    "" # Return empty string for statements
`, { globals });
      
      globals.destroy(); // Clean up the proxy
      post("result", result);
    } catch (err) {
      post("error", err?.toString?.() ?? String(err));
    }
  }
};