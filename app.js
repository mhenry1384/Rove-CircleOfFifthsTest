/* ──────────────────────────────────────────
   Circle of Fifths Quiz — app.js
   Levels + Major/Minor selection
   ────────────────────────────────────────── */

// ── Signature Data (Major + Relative Minor) ──
const SIGNATURES = [
  { accidentals: [], major: "C Major", minor: "A Minor" },
  { accidentals: ["F♯"], major: "G Major", minor: "E Minor" },
  { accidentals: ["F♯", "C♯"], major: "D Major", minor: "B Minor" },
  { accidentals: ["F♯", "C♯", "G♯"], major: "A Major", minor: "F♯ Minor" },
  {
    accidentals: ["F♯", "C♯", "G♯", "D♯"],
    major: "E Major",
    minor: "C♯ Minor",
  },
  {
    accidentals: ["F♯", "C♯", "G♯", "D♯", "A♯"],
    major: "B Major",
    minor: "G♯ Minor",
  },
  {
    accidentals: ["F♯", "C♯", "G♯", "D♯", "A♯", "E♯"],
    major: "F♯ Major",
    minor: "D♯ Minor",
  },
  {
    accidentals: ["F♯", "C♯", "G♯", "D♯", "A♯", "E♯", "B♯"],
    major: "C♯ Major",
    minor: "A♯ Minor",
  },

  { accidentals: ["B♭"], major: "F Major", minor: "D Minor" },
  { accidentals: ["B♭", "E♭"], major: "B♭ Major", minor: "G Minor" },
  { accidentals: ["B♭", "E♭", "A♭"], major: "E♭ Major", minor: "C Minor" },
  {
    accidentals: ["B♭", "E♭", "A♭", "D♭"],
    major: "A♭ Major",
    minor: "F Minor",
  },
  {
    accidentals: ["B♭", "E♭", "A♭", "D♭", "G♭"],
    major: "D♭ Major",
    minor: "B♭ Minor",
  },
  {
    accidentals: ["B♭", "E♭", "A♭", "D♭", "G♭", "C♭"],
    major: "G♭ Major",
    minor: "E♭ Minor",
  },
  {
    accidentals: ["B♭", "E♭", "A♭", "D♭", "G♭", "C♭", "F♭"],
    major: "C♭ Major",
    minor: "A♭ Minor",
  },
];

// ── Level Definitions (Major key names) ──
const LEVELS = [
  ["C Major", "G Major", "F Major"],
  ["C Major", "G Major", "D Major", "A Major", "F Major", "B♭ Major"],
  [
    "C Major",
    "G Major",
    "D Major",
    "A Major",
    "E Major",
    "F Major",
    "B♭ Major",
    "E♭ Major",
  ],
  [
    "C Major",
    "G Major",
    "D Major",
    "A Major",
    "E Major",
    "B Major",
    "F Major",
    "B♭ Major",
    "E♭ Major",
    "A♭ Major",
  ],
  [
    "C Major",
    "G Major",
    "D Major",
    "A Major",
    "E Major",
    "B Major",
    "F♯ Major",
    "F Major",
    "B♭ Major",
    "E♭ Major",
    "A♭ Major",
    "D♭ Major",
  ],
  [
    "C Major",
    "G Major",
    "D Major",
    "A Major",
    "E Major",
    "B Major",
    "F♯ Major",
    "C♯ Major",
    "F Major",
    "B♭ Major",
    "E♭ Major",
    "A♭ Major",
    "D♭ Major",
    "G♭ Major",
    "C♭ Major",
  ],
];

const signatureByMajor = new Map(SIGNATURES.map((sig) => [sig.major, sig]));

/* ── Y-positions on the staff (SVG coords) ──
   Staff lines sit at y = 50, 65, 80, 95, 110
   Each space / line step = 7.5px

   Note positions (treble clef), from TOP:
     G5  = 42.5   (space above staff)
     F5  = 50     (line 1 — top line)
     E5  = 57.5
     D5  = 65     (line 2)
     C5  = 72.5
     B4  = 80     (line 3 — middle)
     A4  = 87.5
     G4  = 95     (line 4)
     F4  = 102.5
     E4  = 110    (line 5 — bottom line)
*/

// Sharp positions on treble clef (conventional order: F C G D A E B)
const SHARP_Y = {
  "F♯": 50,
  "C♯": 72.5,
  "G♯": 42.5,
  "D♯": 65,
  "A♯": 87.5,
  "E♯": 57.5,
  "B♯": 80,
};

// Flat positions on treble clef (conventional order: B E A D G C F)
const FLAT_Y = {
  "B♭": 80,
  "E♭": 57.5,
  "A♭": 87.5,
  "D♭": 65,
  "G♭": 95,
  "C♭": 72.5,
  "F♭": 102.5,
};

// Ordering for drawing accidentals left to right
const SHARP_ORDER = ["F♯", "C♯", "G♯", "D♯", "A♯", "E♯", "B♯"];
const FLAT_ORDER = ["B♭", "E♭", "A♭", "D♭", "G♭", "C♭", "F♭"];

// ── State ──
let currentKey = null;
let answered = false;
let correct = 0;
let total = 0;
let usedIndices = [];
let selectedNotes = new Set();
let activeKeys = [];

// ── DOM refs ──
const keyNameEl = document.getElementById("key-name");
const scoreEl = document.getElementById("score");
const feedbackEl = document.getElementById("feedback");
const resetBtn = document.getElementById("reset-btn");
const doneBtn = document.getElementById("done-btn");
const accidentalsG = document.getElementById("accidentals-group");
const staffLabel = document.getElementById("staff-label");
const toggleBtns = document.querySelectorAll(".toggle-btn");
const levelSelect = document.getElementById("level-select");
const modeSelect = document.getElementById("mode-select");

// ── Helpers ──

/** Draw a sharp symbol at (x, y) in the SVG accidentals group */
function drawSharp(x, y) {
  // Build a sharp sign with SVG lines
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", `translate(${x}, ${y})`);

  const lines = [
    // Two vertical lines
    { x1: -3, y1: -10, x2: -3, y2: 10, w: 1.4 },
    { x1: 3, y1: -10, x2: 3, y2: 10, w: 1.4 },
    // Two slanted horizontal bars
    { x1: -7, y1: -2, x2: 7, y2: -5, w: 2.2 },
    { x1: -7, y1: 5, x2: 7, y2: 2, w: 2.2 },
  ];

  lines.forEach((l) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", l.x1);
    line.setAttribute("y1", l.y1);
    line.setAttribute("x2", l.x2);
    line.setAttribute("y2", l.y2);
    line.setAttribute("stroke", "#2c3e50");
    line.setAttribute("stroke-width", l.w);
    line.setAttribute("stroke-linecap", "round");
    g.appendChild(line);
  });

  accidentalsG.appendChild(g);
}

/** Draw a flat symbol at (x, y) */
function drawFlat(x, y) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", `translate(${x}, ${y})`);

  // Vertical stem
  const stem = document.createElementNS("http://www.w3.org/2000/svg", "line");
  stem.setAttribute("x1", -3);
  stem.setAttribute("y1", -16);
  stem.setAttribute("x2", -3);
  stem.setAttribute("y2", 6);
  stem.setAttribute("stroke", "#2c3e50");
  stem.setAttribute("stroke-width", 1.6);
  stem.setAttribute("stroke-linecap", "round");
  g.appendChild(stem);

  // Curved belly
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M -3,0 C 4,-2 8,-6 4,-1 C 0,4 -3,6 -3,6");
  path.setAttribute("fill", "#2c3e50");
  path.setAttribute("stroke", "#2c3e50");
  path.setAttribute("stroke-width", 1.2);
  g.appendChild(path);

  accidentalsG.appendChild(g);
}

/** Clear the accidentals from the staff */
function clearStaff() {
  accidentalsG.innerHTML = "";
  staffLabel.textContent = "";
}

/** Render the key signature on the staff */
function renderKeySignature(key) {
  renderAccidentals(key.accidentals);
}

/** Render accidentals on the staff from a list of note names */
function renderAccidentals(notes) {
  clearStaff();

  if (notes.length === 0) {
    staffLabel.textContent = "No sharps or flats";
    return;
  }

  const sharps = notes
    .filter((n) => n.includes("♯"))
    .sort((a, b) => SHARP_ORDER.indexOf(a) - SHARP_ORDER.indexOf(b));
  const flats = notes
    .filter((n) => n.includes("♭"))
    .sort((a, b) => FLAT_ORDER.indexOf(a) - FLAT_ORDER.indexOf(b));

  const startX = 90;
  const spacing = 20;
  let pos = 0;

  sharps.forEach((note) => {
    drawSharp(startX + pos * spacing, SHARP_Y[note]);
    pos++;
  });

  flats.forEach((note) => {
    drawFlat(startX + pos * spacing, FLAT_Y[note]);
    pos++;
  });

  staffLabel.textContent = notes.join("  ");
}

/** Pick a random key we haven't used yet (cycles through all before repeating) */
function pickKey() {
  if (usedIndices.length === activeKeys.length) {
    usedIndices = [];
  }
  const available = activeKeys
    .map((_, i) => i)
    .filter((i) => !usedIndices.includes(i));
  const idx = available[Math.floor(Math.random() * available.length)];
  usedIndices.push(idx);
  return activeKeys[idx];
}

/** Load a new question */
function loadQuestion() {
  answered = false;
  selectedNotes.clear();
  currentKey = pickKey();

  // Update UI
  keyNameEl.textContent = currentKey.name;
  feedbackEl.classList.add("hidden");
  feedbackEl.classList.remove("correct", "incorrect");
  clearStaff();

  // Reset buttons
  toggleBtns.forEach((btn) => {
    btn.disabled = false;
    btn.classList.remove(
      "selected",
      "correct-mark",
      "incorrect-mark",
      "missed-mark",
    );
  });
  doneBtn.disabled = false;
  doneBtn.textContent = "Done";
}

/** Build the active key pool based on level + mode */
function buildActiveKeys() {
  const levelIdx = Number(levelSelect.value);
  const mode = modeSelect.value;
  const majors = LEVELS[levelIdx] || LEVELS[0];

  const pool = [];
  majors.forEach((majorName) => {
    const sig = signatureByMajor.get(majorName);
    if (!sig) return;

    if (mode === "major" || mode === "both") {
      pool.push({
        name: sig.major,
        accidentals: sig.accidentals,
        type:
          sig.accidentals.length === 0
            ? "none"
            : sig.accidentals[0].includes("♯")
              ? "sharp"
              : "flat",
      });
    }

    if (mode === "minor" || mode === "both") {
      pool.push({
        name: sig.minor,
        accidentals: sig.accidentals,
        type:
          sig.accidentals.length === 0
            ? "none"
            : sig.accidentals[0].includes("♯")
              ? "sharp"
              : "flat",
      });
    }
  });

  activeKeys = pool;
}

function resetQuestionCycle() {
  usedIndices = [];
  buildActiveKeys();
  loadQuestion();
}

/** Handle toggle button click */
function handleToggle(e) {
  if (answered) return;

  const btn = e.target;
  const note = btn.dataset.note;

  if (selectedNotes.has(note)) {
    selectedNotes.delete(note);
    btn.classList.remove("selected");
  } else {
    selectedNotes.add(note);
    btn.classList.add("selected");
  }

  // Live preview on staff
  renderAccidentals([...selectedNotes]);
}

/** Handle Done button click */
function handleDone() {
  if (answered) return;
  answered = true;
  total++;

  const correctSet = new Set(currentKey.accidentals);
  const correctArr = [...correctSet];

  // Check if answer is exactly right
  const isCorrect =
    correctSet.size === selectedNotes.size &&
    correctArr.every((n) => selectedNotes.has(n));

  // Disable all buttons and show results
  toggleBtns.forEach((btn) => {
    btn.disabled = true;
    const note = btn.dataset.note;
    const wasSelected = selectedNotes.has(note);
    const shouldBeSelected = correctSet.has(note);

    if (wasSelected && shouldBeSelected) {
      btn.classList.remove("selected");
      btn.classList.add("correct-mark");
    } else if (wasSelected && !shouldBeSelected) {
      btn.classList.remove("selected");
      btn.classList.add("incorrect-mark");
    } else if (!wasSelected && shouldBeSelected) {
      btn.classList.add("missed-mark");
    }
  });
  doneBtn.disabled = false;
  doneBtn.textContent = "Next Question →";

  if (isCorrect) {
    correct++;
  }

  // Render the correct key signature on the staff
  renderKeySignature(currentKey);

  // Show feedback
  feedbackEl.classList.remove("hidden");
  if (isCorrect) {
    feedbackEl.classList.add("correct");
    feedbackEl.textContent = "✅  Correct!";
  } else {
    feedbackEl.classList.add("incorrect");
    if (correctArr.length === 0) {
      feedbackEl.textContent = `❌  Not quite — ${currentKey.name} has no sharps or flats.`;
    } else {
      feedbackEl.textContent = `❌  Not quite — ${currentKey.name} has ${correctArr.join(", ")}.`;
    }
  }

  // Update score
  scoreEl.textContent = `Score: ${correct} / ${total}`;

}

// ── Event Listeners ──
toggleBtns.forEach((btn) => btn.addEventListener("click", handleToggle));
doneBtn.addEventListener("click", () => {
  if (answered) {
    loadQuestion();
    return;
  }

  handleDone();
});
resetBtn.addEventListener("click", () => {
  correct = 0;
  total = 0;
  usedIndices = [];
  scoreEl.textContent = "Score: 0 / 0";
  resetQuestionCycle();
});

levelSelect.addEventListener("change", () => {
  resetQuestionCycle();
});

modeSelect.addEventListener("change", () => {
  resetQuestionCycle();
});

// ── Treble clef sizing ──
// The 𝄞 glyph comes from whatever font each device has, and those fonts draw
// it at wildly different sizes and heights. Measure the actual ink of the
// glyph and scale/position it so it always spans the same box on the staff.
const CLEF_BOX = { left: 24, top: 33, bottom: 132 };

function fitClef() {
  const clef = document.getElementById("treble-clef");
  if (!clef) return;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return;
  const size = 100;
  ctx.font = `${size}px ${clef.getAttribute("font-family")}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const m = ctx.measureText("𝄞");
  const ascent = m.actualBoundingBoxAscent;
  const descent = m.actualBoundingBoxDescent;
  if (!(ascent + descent > 0)) return; // browser lacks ink metrics; leave as-is
  const scale = (CLEF_BOX.bottom - CLEF_BOX.top) / (ascent + descent);
  clef.setAttribute("font-size", (size * scale).toFixed(2));
  clef.setAttribute("text-anchor", "start");
  clef.setAttribute("x", (CLEF_BOX.left + (m.actualBoundingBoxLeft || 0) * scale).toFixed(2));
  clef.setAttribute("y", (CLEF_BOX.top + ascent * scale).toFixed(2));
  clef.textContent = "𝄞";
}

fitClef();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitClef);

// ── Start ──
buildActiveKeys();
loadQuestion();
