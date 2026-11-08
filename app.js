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
// Every distinct question for the current level/mode, and the ones not yet
// asked this round. A question is only asked again after the whole round has
// been used up, unless it was answered wrong (then it goes back in the pile).
let questionPool = [];
let remainingQuestions = [];
let lastQuestionId = null;
let currentQuestion = null;
let selectedNotes = new Set();
let activeKeys = [];
// "signature": shown a key name, pick its sharps/flats.
// "name": shown a key signature, name the key(s).
let questionType = "signature";
let askedQualities = []; // for "name" questions: ["major"], ["minor"] or both
let nameChoices = {}; // quality -> { letter, acc }

// ── DOM refs ──
const keyNameEl = document.getElementById("key-name");
const scoreEl = document.getElementById("score");
const feedbackEl = document.getElementById("feedback");
const resetBtn = document.getElementById("reset-btn");
const doneBtn = document.getElementById("done-btn");
const accidentalsG = document.getElementById("accidentals-group");
const staffLabel = document.getElementById("staff-label");
const toggleBtns = document.querySelectorAll("#accidental-answers .toggle-btn");
const promptTextEl = document.getElementById("prompt-text");
const answerLabelEl = document.getElementById("answer-label");
const accidentalAnswersEl = document.getElementById("accidental-answers");
const nameAnswersEl = document.getElementById("name-answers");
const levelSelect = document.getElementById("level-select");
const modeButtons = document.querySelectorAll(".mode-button[data-mode]");
let mode = "major"; // "major" | "minor" | "both"

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
function renderKeySignature(key, showLabel = true) {
  renderAccidentals(key.accidentals, showLabel);
}

/** Render accidentals on the staff from a list of note names */
function renderAccidentals(notes, showLabel = true) {
  clearStaff();

  if (notes.length === 0) {
    if (showLabel) staffLabel.textContent = "No sharps or flats";
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

  if (showLabel) staffLabel.textContent = notes.join("  ");
}

/** Build every distinct question for the active keys.
 *  "signature" questions: one per key name.
 *  "name" questions: one per key signature (in Both mode, C Major and
 *  A Minor share a signature, so that's a single question). */
function buildQuestionPool() {
  const pool = [];
  const namedSigs = new Set();
  activeKeys.forEach((key) => {
    pool.push({ id: `signature:${key.name}`, type: "signature", key });
    if (!namedSigs.has(key.major)) {
      namedSigs.add(key.major);
      pool.push({ id: `name:${key.major}`, type: "name", key });
    }
  });
  questionPool = pool;
  remainingQuestions = [...pool];
}

/** Draw a random question not yet asked this round (never the one just asked) */
function pickQuestion() {
  if (remainingQuestions.length === 0) remainingQuestions = [...questionPool];
  let choices = remainingQuestions.filter((q) => q.id !== lastQuestionId);
  if (choices.length === 0) choices = remainingQuestions;
  const q = choices[Math.floor(Math.random() * choices.length)];
  remainingQuestions.splice(remainingQuestions.indexOf(q), 1);
  lastQuestionId = q.id;
  return q;
}

/** A missed question goes back in the pile so it comes up again */
function requeueIfWrong(isCorrect) {
  if (isCorrect || !currentQuestion) return;
  if (!remainingQuestions.includes(currentQuestion)) {
    remainingQuestions.push(currentQuestion);
  }
}

/** Load a new question */
function loadQuestion() {
  answered = false;
  selectedNotes.clear();
  currentQuestion = pickQuestion();
  currentKey = currentQuestion.key;
  questionType = currentQuestion.type;

  // Update UI
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
  doneBtn.textContent = "Done";

  if (questionType === "signature") {
    promptTextEl.textContent = "What is the key signature for";
    keyNameEl.textContent = displayKeyName(currentKey.name);
    keyNameEl.classList.remove("hidden");
    answerLabelEl.textContent =
      "Select all sharps/flats in this key, then click Done:";
    accidentalAnswersEl.classList.remove("hidden");
    nameAnswersEl.classList.add("hidden");
    doneBtn.disabled = false;
  } else {
    askedQualities = mode === "both" ? ["major", "minor"] : [mode];
    promptTextEl.textContent =
      askedQualities.length === 2
        ? "Which major and minor keys have this key signature?"
        : `Which ${askedQualities[0]} key has this key signature?`;
    keyNameEl.classList.add("hidden");
    answerLabelEl.textContent = "Pick the key name, then click Done:";
    accidentalAnswersEl.classList.add("hidden");
    nameAnswersEl.classList.remove("hidden");
    buildNamePickers();
    // No note names under the staff: the player has to read it.
    renderKeySignature(currentKey, false);
    updateNameDoneState();
  }
}

// ── Name-the-key question ──
const LETTERS = ["A", "B", "C", "D", "E", "F", "G"];
const ACCS = ["♭", "♮", "♯"];
const QUALITY_LABEL = { major: "Major", minor: "Minor" };

/** Key name as shown to the player: minor keys are all lowercase */
function displayKeyName(keyName) {
  return keyName.endsWith("Minor") ? keyName.toLowerCase() : keyName;
}

/** Tonic of a key name, e.g. "B♭ Major" -> "B♭" */
function tonicOf(keyName) {
  return keyName.split(" ")[0];
}

/** Build the letter + accidental pickers for each asked quality */
function buildNamePickers() {
  nameAnswersEl.innerHTML = "";
  nameChoices = {};

  askedQualities.forEach((quality) => {
    nameChoices[quality] = { letter: null, acc: "♮" };

    const group = document.createElement("div");
    group.className = "btn-group name-picker";
    group.dataset.quality = quality;

    const heading = document.createElement("p");
    heading.className = "group-heading";
    group.appendChild(heading);

    const letterRow = document.createElement("div");
    letterRow.className = "btn-row";
    LETTERS.forEach((letter) => {
      const btn = document.createElement("button");
      btn.className = "toggle-btn";
      btn.dataset.letter = letter;
      btn.textContent = quality === "minor" ? letter.toLowerCase() : letter;
      btn.addEventListener("click", () => chooseName(quality, "letter", letter));
      letterRow.appendChild(btn);
    });
    group.appendChild(letterRow);

    const accRow = document.createElement("div");
    accRow.className = "btn-row acc-row";
    ACCS.forEach((acc) => {
      const btn = document.createElement("button");
      btn.className = "toggle-btn";
      btn.dataset.acc = acc;
      btn.textContent = acc;
      btn.addEventListener("click", () => chooseName(quality, "acc", acc));
      accRow.appendChild(btn);
    });
    group.appendChild(accRow);

    nameAnswersEl.appendChild(group);
    refreshPicker(quality);
  });
}

function pickerFor(quality) {
  return nameAnswersEl.querySelector(`.name-picker[data-quality="${quality}"]`);
}

function chosenTonic(quality) {
  const c = nameChoices[quality];
  if (!c.letter) return null;
  return c.letter + (c.acc === "♮" ? "" : c.acc);
}

/** Sync a picker's selected buttons + heading with nameChoices */
function refreshPicker(quality) {
  const group = pickerFor(quality);
  const c = nameChoices[quality];
  group.querySelectorAll("[data-letter]").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.letter === c.letter);
  });
  group.querySelectorAll("[data-acc]").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.acc === c.acc);
  });
  const tonic = chosenTonic(quality);
  const label = QUALITY_LABEL[quality];
  group.querySelector(".group-heading").textContent =
    `${label} key: ${tonic ? displayKeyName(`${tonic} ${label}`) : "?"}`;
}

function chooseName(quality, field, value) {
  if (answered) return;
  nameChoices[quality][field] = value;
  refreshPicker(quality);
  updateNameDoneState();
}

function updateNameDoneState() {
  doneBtn.disabled = askedQualities.some((q) => !nameChoices[q].letter);
}

function correctNameFor(quality) {
  return signatureByMajor.get(currentKey.major)[quality];
}

/** Grade a name-the-key question; returns true if every asked key is right */
function gradeName() {
  let allRight = true;

  askedQualities.forEach((quality) => {
    const group = pickerFor(quality);
    const c = nameChoices[quality];
    const answer = tonicOf(correctNameFor(quality));
    const ansLetter = answer[0];
    const ansAcc = answer[1] || "♮";
    if (c.letter !== ansLetter || c.acc !== ansAcc) allRight = false;

    const mark = (btns, chosen, right) => {
      btns.forEach((btn) => {
        const v = btn.dataset.letter || btn.dataset.acc;
        btn.disabled = true;
        btn.classList.remove("selected");
        if (v === chosen && v === right) btn.classList.add("correct-mark");
        else if (v === chosen) btn.classList.add("incorrect-mark");
        else if (v === right) btn.classList.add("missed-mark");
      });
    };
    mark(group.querySelectorAll("[data-letter]"), c.letter, ansLetter);
    mark(group.querySelectorAll("[data-acc]"), c.acc, ansAcc);
  });

  return allRight;
}

/** Build the active key pool based on level + mode */
function buildActiveKeys() {
  const levelIdx = Number(levelSelect.value);
  const majors = LEVELS[levelIdx] || LEVELS[0];

  const pool = [];
  majors.forEach((majorName) => {
    const sig = signatureByMajor.get(majorName);
    if (!sig) return;

    if (mode === "major" || mode === "both") {
      pool.push({
        name: sig.major,
        major: sig.major,
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
        major: sig.major,
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
  buildQuestionPool();
}

function resetQuestionCycle() {
  lastQuestionId = null;
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
  if (questionType === "name") {
    handleNameDone();
    return;
  }
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
  requeueIfWrong(isCorrect);

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
      feedbackEl.textContent = `❌  Not quite — ${displayKeyName(currentKey.name)} has no sharps or flats.`;
    } else {
      feedbackEl.textContent = `❌  Not quite — ${displayKeyName(currentKey.name)} has ${correctArr.join(", ")}.`;
    }
  }

  // Update score
  scoreEl.textContent = `Score: ${correct} / ${total}`;

}

/** Handle Done for a name-the-key question */
function handleNameDone() {
  answered = true;
  total++;

  const isCorrect = gradeName();
  renderKeySignature(currentKey); // now reveal the note names
  if (isCorrect) correct++;
  requeueIfWrong(isCorrect);

  doneBtn.disabled = false;
  doneBtn.textContent = "Next Question →";

  const answers = askedQualities
    .map((quality) => displayKeyName(correctNameFor(quality)))
    .join(" / ");
  const sigText =
    currentKey.accidentals.length === 0
      ? "No sharps or flats"
      : currentKey.accidentals.join(", ");

  feedbackEl.classList.remove("hidden");
  if (isCorrect) {
    feedbackEl.classList.add("correct");
    feedbackEl.textContent = `✅  Correct! ${answers}`;
  } else {
    feedbackEl.classList.add("incorrect");
    feedbackEl.textContent = `❌  Not quite — ${sigText} is ${answers}.`;
  }

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
  scoreEl.textContent = "Score: 0 / 0";
  resetQuestionCycle();
});

// ── Saved settings (persist Level + Mode across visits) ──
const SETTINGS_KEY = "fifths-quiz-settings";

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    const apply = (select, value) => {
      if (value != null && [...select.options].some((o) => o.value === String(value))) {
        select.value = String(value);
      }
    };
    apply(levelSelect, saved.level);
    if (["major", "minor", "both"].includes(saved.mode)) setMode(saved.mode);
  } catch (e) {
    // Storage unavailable or corrupt; keep defaults.
  }
}

function saveSettings() {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ level: levelSelect.value, mode }),
    );
  } catch (e) {
    // Storage unavailable (e.g. private mode); settings just won't persist.
  }
}

levelSelect.addEventListener("change", () => {
  saveSettings();
  resetQuestionCycle();
});

function setMode(value) {
  mode = value;
  modeButtons.forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.mode === mode));
  });
}

modeButtons.forEach((btn) =>
  btn.addEventListener("click", () => {
    if (btn.dataset.mode === mode) return;
    setMode(btn.dataset.mode);
    saveSettings();
    resetQuestionCycle();
  }),
);

// ── Stopwatch ──
// Elapsed time is added up tick by tick and saved as it goes, so it survives a
// refresh, and time while the app is closed doesn't count.
const STOPWATCH_KEY = "fifths-quiz-stopwatch";
const stopwatchTimeEl = document.getElementById("stopwatch-time");
const stopwatchToggleBtn = document.getElementById("stopwatch-toggle");
const stopwatchResetBtn = document.getElementById("stopwatch-reset");
let stopwatchElapsed = 0; // ms
let stopwatchRunning = false;
let stopwatchLastTick = 0;
let stopwatchTimer = null;

function formatStopwatch(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}

function updateStopwatch() {
  stopwatchTimeEl.textContent = formatStopwatch(stopwatchElapsed);
  stopwatchToggleBtn.textContent = stopwatchRunning ? "Pause" : "Start";
  try {
    localStorage.setItem(
      STOPWATCH_KEY,
      JSON.stringify({ elapsed: stopwatchElapsed, running: stopwatchRunning }),
    );
  } catch (e) {
    // Storage unavailable; the stopwatch just won't persist.
  }
}

function tickStopwatch() {
  const now = Date.now();
  stopwatchElapsed += Math.max(0, now - stopwatchLastTick);
  stopwatchLastTick = now;
  updateStopwatch();
}

function setStopwatchRunning(running) {
  stopwatchRunning = running;
  clearInterval(stopwatchTimer);
  if (running) {
    stopwatchLastTick = Date.now();
    stopwatchTimer = setInterval(tickStopwatch, 250);
  }
  updateStopwatch();
}

function loadStopwatch() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(STOPWATCH_KEY) || "{}") || {};
  } catch (e) {
    // Storage unavailable or corrupt; start from zero.
  }
  if (Number.isFinite(saved.elapsed) && saved.elapsed > 0) {
    stopwatchElapsed = saved.elapsed;
  }
  setStopwatchRunning(saved.running === true);
}

stopwatchToggleBtn.addEventListener("click", () => {
  if (stopwatchRunning) tickStopwatch(); // count the time since the last tick
  setStopwatchRunning(!stopwatchRunning);
});

stopwatchResetBtn.addEventListener("click", () => {
  stopwatchElapsed = 0;
  setStopwatchRunning(false);
});

loadStopwatch();

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
loadSettings();
buildActiveKeys();
loadQuestion();
