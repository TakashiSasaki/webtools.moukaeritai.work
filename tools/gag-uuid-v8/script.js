const STORAGE_KEY = 'uuidv8_builder_state';

let currentBytes = new Uint8Array(16);
let step2P3Bits = [0, 0, 0, 0];
let step2P4Bits = [0, 0, 0, 0, 0, 0];
let step4Hex = "";

const uuidContainer = document.getElementById('uuid-html-container');
const binaryDisplay = document.getElementById('binary-display');
const modeV4Btn = document.getElementById('mode-v4-btn');
const modeV7Btn = document.getElementById('mode-v7-btn');
const customInputContainer = document.getElementById('custom-input-container');
const customHexInput = document.getElementById('custom-hex-input');
const customHexPreview = document.getElementById('custom-hex-preview');
const applyP1P2Btn = document.getElementById('apply-p1p2-btn');
const applyAllBtn = document.getElementById('apply-all-btn');
const applyP5Btn = document.getElementById('apply-p5-btn');
const resetBtn = document.getElementById('reset-btn');
const p3BitsContainer = document.getElementById('p3-bits-container');
const p4BitsContainer = document.getElementById('p4-bits-container');

const p3Mode = document.getElementById('p3-mode');
const p3Val = document.getElementById('p3-val');
const p4Mode = document.getElementById('p4-mode');
const p4Val = document.getElementById('p4-val');

const p5Val = document.getElementById('p5-val');

function initV8FixedBits(bytes) {
    bytes[6] = (bytes[6] & 0x0f) | 0x80; // Version 8
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
}

// --- Persistence Logic ---
function saveState() {
    const state = {
        currentBytes: Array.from(currentBytes),
        customHexVal: customHexInput.value,
        step2P3Bits,
        step2P4Bits,
        p3Mode: p3Mode.value,
        p3Val: p3Val.value,
        p4Mode: p4Mode.value,
        p4Val: p4Val.value,
        step4Hex: p5Val.value
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
        const state = JSON.parse(saved);
        currentBytes = new Uint8Array(state.currentBytes);
        customHexInput.value = state.customHexVal || '';
        step2P3Bits = state.step2P3Bits || [0, 0, 0, 0];
        step2P4Bits = state.step2P4Bits || [0, 0, 0, 0, 0, 0];
        p3Mode.value = state.p3Mode || 'hex';
        p3Val.value = state.p3Val || '';
        p4Mode.value = state.p4Mode || 'hex';
        p4Val.value = state.p4Val || '';
        p5Val.value = state.step4Hex || '';

        validateCustomInput();
    } catch (e) {
        console.error("Failed to load state", e);
    }
}

function validateCustomInput() {
    // Check always as input is always visible
    const rawVal = customHexInput.value;
    const hexOnly = rawVal.replace(/[^0-9a-fA-F]/g, '');

    // Build visualization
    let previewHtml = "";

    // Find where the first 12 valid hex digits end in the raw string
    let hexCount = 0;
    let splitIdx = 0;
    for (let i = 0; i < rawVal.length; i++) {
        if (/[0-9a-fA-F]/.test(rawVal[i])) {
            hexCount++;
        }
        if (hexCount === 12) {
            splitIdx = i + 1;
            break;
        }
    }

    if (hexOnly.length >= 12) {
        const part1 = rawVal.substring(0, splitIdx);
        const remainder = rawVal.substring(splitIdx);
        previewHtml = `<span class="text-indigo-600 font-bold bg-indigo-50 px-1 rounded border border-indigo-200">${part1}</span><span class="text-slate-400 opacity-50 ml-1">${remainder}</span>`;

        applyP1P2Btn.disabled = false;
        applyAllBtn.disabled = false;
        applyP5Btn.disabled = false;
        customHexInput.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-200');
        customHexInput.classList.add('border-indigo-300', 'focus:border-indigo-500', 'focus:ring-indigo-200');
    } else {
        previewHtml = `<span class="text-slate-400">${rawVal}</span>`;
        if (hexOnly.length > 0) {
            previewHtml += ` <span class="text-red-500 text-[10px] font-bold ml-2">Need ${12 - hexOnly.length} more hex digits</span>`;
        }
        applyP1P2Btn.disabled = true;
        applyAllBtn.disabled = true;
        applyP5Btn.disabled = true;
        if (rawVal.length > 0) {
            customHexInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-200');
            customHexInput.classList.remove('border-indigo-300', 'focus:border-indigo-500', 'focus:ring-indigo-200');
        } else {
            customHexInput.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-200');
            customHexInput.classList.add('border-slate-300', 'focus:border-slate-500', 'focus:ring-slate-200');
        }
    }
    customHexPreview.innerHTML = previewHtml;
}

function syncStep2() {
    let byte6Val = (currentBytes[6] & 0xf0) | (step2P3Bits[0] << 3) | (step2P3Bits[1] << 2) | (step2P3Bits[2] << 1) | step2P3Bits[3];
    currentBytes[6] = byte6Val;
    let byte8Val = (currentBytes[8] & 0xc0) | (step2P4Bits[0] << 5) | (step2P4Bits[1] << 4) | (step2P4Bits[2] << 3) | (step2P4Bits[3] << 2) | (step2P4Bits[4] << 1) | step2P4Bits[5];
    currentBytes[8] = byte8Val;
    updateDisplay();
    saveState();
}

function syncStep3() {
    currentBytes[7] = parseByteInput(p3Mode.value, p3Val.value);
    currentBytes[9] = parseByteInput(p4Mode.value, p4Val.value);
    updateDisplay();
    saveState();
}

function syncStep4() {
    const val = p5Val.value.replace(/[^0-9a-fA-F]/g, '');
    if (val.length === 12) {
        const hexVal = val.padEnd(12, '0');
        for (let i = 0; i < 6; i++) {
            const byteHex = hexVal.substring(i * 2, i * 2 + 2);
            currentBytes[10 + i] = parseInt(byteHex, 16) || 0;
        }
        p5Val.classList.remove('border-slate-300', 'focus:border-fuchsia-500');
        p5Val.classList.add('border-fuchsia-500', 'bg-fuchsia-50');
    } else {
        p5Val.classList.add('border-slate-300', 'focus:border-fuchsia-500');
        p5Val.classList.remove('border-fuchsia-500', 'bg-fuchsia-50');
    }
    updateDisplay();
    saveState();
}

function parseByteInput(mode, val) {
    if (!val) return 0;
    if (mode === 'hex') return parseInt(val, 16) || 0;
    return val.charCodeAt(0) || 0;
}

function renderBitButtons() {
    p3BitsContainer.innerHTML = '';
    step2P3Bits.forEach((bit, i) => {
        const btn = document.createElement('button');
        btn.className = `bit-btn ${bit ? 'active' : 'inactive'}`;
        btn.textContent = bit;
        btn.onclick = () => { step2P3Bits[i] = bit ? 0 : 1; renderBitButtons(); syncStep2(); };
        p3BitsContainer.appendChild(btn);
    });
    p4BitsContainer.innerHTML = '';
    step2P4Bits.forEach((bit, i) => {
        const btn = document.createElement('button');
        btn.className = `bit-btn ${bit ? 'active' : 'inactive'}`;
        btn.textContent = bit;
        btn.onclick = () => { step2P4Bits[i] = bit ? 0 : 1; renderBitButtons(); syncStep2(); };
        p4BitsContainer.appendChild(btn);
    });
}

function updateDisplay() {
    const hex = Array.from(currentBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const parts = [
        { text: hex.substring(0, 8), cls: 'part-1', len: 8 },
        { text: hex.substring(8, 12), cls: 'part-2', len: 4 },
        { text: hex.substring(12, 16), cls: 'part-3', len: 4 },
        { text: hex.substring(16, 20), cls: 'part-4', len: 4 },
        { text: hex.substring(20, 32), cls: 'part-5', len: 12 }
    ];
    uuidContainer.innerHTML = parts.map((p, idx) => {
        const isPartZero = (idx === 0 || idx === 1 || idx === 4) && p.text === '0'.repeat(p.len);
        if (isPartZero) return `<span class="text-slate-700 opacity-40">${p.text}</span>`;
        return `<span class="${p.cls}">${p.text}</span>`;
    }).join('<span class="text-slate-800">-</span>');

    let binaryStr = Array.from(currentBytes).map(b => b.toString(2).padStart(8, '0')).join('');
    const segments = [32, 16, 16, 16, 48];
    const colors = ['part-1', 'part-2', 'part-3', 'part-4', 'part-5'];
    let offset = 0;
    let binHtml = "";

    segments.forEach((len, idx) => {
        let segmentBits = binaryStr.substring(offset, offset + len);
        let formatted = `<span class="${colors[idx]}">`;
        for (let i = 0; i < segmentBits.length; i++) {
            const globalPos = offset + i;
            const isVersion = (globalPos >= 48 && globalPos <= 51);
            const isVariant = (globalPos >= 64 && globalPos <= 65);
            const isBitZero = segmentBits[i] === '0';
            let bitHtml = segmentBits[i];
            if (isVersion) bitHtml = `<span class="bit-highlight-v">${bitHtml}</span>`;
            else if (isVariant) bitHtml = `<span class="bit-highlight-var">${bitHtml}</span>`;
            else if (isBitZero) bitHtml = `<span class="opacity-20">${bitHtml}</span>`;
            formatted += bitHtml;
            if ((i + 1) % 8 === 0 && (i + 1) < segmentBits.length) formatted += " ";
        }
        formatted += `</span>`;
        binHtml += formatted + (idx < segments.length - 1 ? "\n" : "");
        offset += len;
    });
    binaryDisplay.innerHTML = binHtml;
}

// --- Handlers ---
modeV4Btn.onclick = () => {
    // Generate valid UUIDv4 string
    const uuid = crypto.randomUUID();
    customHexInput.value = uuid.toUpperCase();
    validateCustomInput();
    saveState();
};

modeV7Btn.onclick = () => {
    // Generate valid UUIDv7 string
    // Part 1: unix_ts_ms (48 bits)
    const now = Date.now();
    const tsHex = now.toString(16).padStart(12, '0');

    // Part 2: ver (4 bits) - '7'
    // Part 3: rand_a (12 bits)
    const randA = Math.floor(Math.random() * 4096).toString(16).padStart(3, '0');

    // Part 4: var (2 bits) - '10' -> '8', '9', 'a', 'b'
    // Part 5: rand_b (62 bits)
    // Just generate random for the rest
    const randB = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');

    // We only really care about the first 48 bits (Part 1) for this tool's Step 1,
    // but for a full valid v7 string we construct:
    // xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
    // where y is 8,9,a,b

    const p1 = tsHex.substring(0, 8);
    const p2 = tsHex.substring(8, 12);
    const p3 = '7' + randA;
    const p4 = ((Math.floor(Math.random() * 4) + 8).toString(16)) + randB.substring(0, 3);
    const p5 = randB.substring(3, 15); // taking 12 hex chars

    const uuid = `${p1}-${p2}-${p3}-${p4}-${p5}`;
    customHexInput.value = uuid.toUpperCase();
    validateCustomInput();
    saveState();
};

customHexInput.oninput = (e) => {
    validateCustomInput();
    saveState();
};

p5Val.oninput = (e) => {
    let v = p5Val.value.replace(/[^0-9a-fA-F]/g, '');
    if (v.length > 12) v = v.substring(0, 12);
    p5Val.value = v.toUpperCase();
    syncStep4();
}

applyP1P2Btn.onclick = () => {
    // Apply Part 1 & 2 ONLY
    const hexOnly = customHexInput.value.replace(/[^0-9a-fA-F]/g, '');
    const part1Hex = hexOnly.substring(0, 12).padEnd(12, '0');

    // Set Part 1 & 2 (Bytes 0-5)
    for (let i = 0; i < 6; i++) {
        const byteHex = part1Hex.substring(i * 2, i * 2 + 2);
        currentBytes[i] = parseInt(byteHex, 16) || 0;
    }

    initV8FixedBits(currentBytes);
    syncStep2();
    syncStep3();
    saveState();
};

applyAllBtn.onclick = () => {
    // Apply Part 1 & 2 AND Part 5
    const hexOnly = customHexInput.value.replace(/[^0-9a-fA-F]/g, '');

    // Part 1 & 2
    const part1Hex = hexOnly.substring(0, 12).padEnd(12, '0');
    for (let i = 0; i < 6; i++) {
        const byteHex = part1Hex.substring(i * 2, i * 2 + 2);
        currentBytes[i] = parseInt(byteHex, 16) || 0;
    }

    // Part 5 (last 12 hex chars if available)
    if (hexOnly.length >= 20) {
        // Just take the last 12 chars if the string is reasonably long (20+)
        // This covers standard UUIDs (32 chars) and partials that are long enough
        let p5 = hexOnly.substring(hexOnly.length - 12);
        // Pad with random chars if short but we want full UUID
        if (p5.length < 12) {
            const randB = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');
            p5 = (p5 + randB).substring(0, 12);
        }
        p5Val.value = p5.toUpperCase();
        syncStep4();
    }

    initV8FixedBits(currentBytes);
    syncStep2();
    syncStep3();
    saveState();
};

applyP5Btn.onclick = () => {
    // Apply Part 5 ONLY
    const hexOnly = customHexInput.value.replace(/[^0-9a-fA-F]/g, '');

    // If they want to use the last 12 chars of the input string as Node:
    if (hexOnly.length >= 12) {
        const p5 = hexOnly.substring(hexOnly.length - 12);
        p5Val.value = p5.toUpperCase();
        syncStep4();
        saveState();
    }
};

resetBtn.onclick = () => {
    currentBytes.fill(0);
    initV8FixedBits(currentBytes);
    applyP1P2Btn.disabled = true;
    applyAllBtn.disabled = true;
    applyP5Btn.disabled = true;
    step2P3Bits = [0, 0, 0, 0];
    step2P4Bits = [0, 0, 0, 0, 0, 0];
    p3Val.value = '';
    p4Val.value = '';
    customHexInput.value = '';
    customHexPreview.innerHTML = '';
    p5Val.value = '';
    p5Val.classList.remove('border-fuchsia-500', 'bg-fuchsia-50');

    localStorage.removeItem(STORAGE_KEY);
    validateCustomInput();
    renderBitButtons();
    updateDisplay();
};

function updateModeUI(modeEl, valEl) {
    const isHex = modeEl.value === 'hex';
    valEl.maxLength = isHex ? 2 : 1;
    if (isHex) {
        valEl.classList.add('uppercase');
        valEl.placeholder = 'HEX';
    } else {
        valEl.classList.remove('uppercase');
        valEl.placeholder = 'Char';
    }
    if (valEl.value.length > valEl.maxLength) {
        valEl.value = valEl.value.substring(0, valEl.maxLength);
    }
}

p3Mode.onchange = () => { updateModeUI(p3Mode, p3Val); syncStep3(); };
p4Mode.onchange = () => { updateModeUI(p4Mode, p4Val); syncStep3(); };
[p3Val, p4Val].forEach(el => el.oninput = syncStep3);

// --- Init ---
initV8FixedBits(currentBytes);
loadState();
updateModeUI(p3Mode, p3Val);
updateModeUI(p4Mode, p4Val);
renderBitButtons();
updateDisplay();
syncStep4(); // Load Part 5
