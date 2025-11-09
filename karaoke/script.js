// Lyrics data format (flexible):
// - Simple array form: [ [text, start], ... ]
// - Object form with word timings: [ { text: "...", start: 1.0, words: [["Hello",1.0],["world",1.5]] }, ... ]
// If 'words' is missing we will split the text and distribute timings evenly across the line's duration.
const lyricsData = {
    lines: [
        { text: "Hello and welcome to JS Karaoke!", start: 1.0, words: [["Hello",1.0],["and",1.5],["welcome",1.9],["to",2.5],["JS",3.0],["Karaoke!",3.5]] },
        { text: "This is the second line showing up after a few seconds.", start: 4.0, words: [["This",4.0],["the",4.5],["second",4.9],["line",5.0],["showing",5.1],["up",5.5],["after",6.0],["a",6.5],["few",7.0],["seconds",7.5]] },
        { text: "And here comes the chorus — sing along!", start: 8.0, words: [["And",8.0],["here",8.5],["comes",8.9],["the",9.5],["sing",10.0],["along!",10.5]] }
    ]
};

const audioPlayer = document.getElementById('audio-player');
const lyricsContainer = document.getElementById('lyrics');
let currentLineIndex = -1;
let currentWordIndex = -1;

// Normalize lines into objects with {text, start, words}
function normalizeLines() {
    if (!lyricsData.lines && lyricsData.words) {
        // Old format: words array -> join into one line
        const text = lyricsData.words.map(w => w[0]).join(' ');
        const start = lyricsData.words.length ? lyricsData.words[0][1] : 0;
        lyricsData.lines = [{ text, start, words: lyricsData.words }];
    }

    lyricsData.lines = lyricsData.lines.map((ln) => {
        if (Array.isArray(ln)) {
            return { text: ln[0], start: ln[1], words: ln[2] || null };
        }
        // assume already object
        return ln;
    });
}

// Generate fallback per-word timings for a line (absolute times)
function generateWordsForLine(index) {
    const line = lyricsData.lines[index];
    if (!line) return [];
    const split = line.text.trim().split(/\s+/).filter(Boolean);
    const start = line.start || 0;
    const nextStart = (lyricsData.lines[index + 1] && lyricsData.lines[index + 1].start) || (start + 3.0);
    const total = Math.max(0.1, nextStart - start);
    const step = total / Math.max(1, split.length);
    return split.map((w, i) => [w, start + i * step]);
}

// Ensure every line has valid per-word timings. This runs at initialization.
function ensureWordTimings() {
    for (let i = 0; i < lyricsData.lines.length; i++) {
        const line = lyricsData.lines[i];
        const split = line.text.trim().split(/\s+/).filter(Boolean);
        let ok = false;
        if (line.words && Array.isArray(line.words) && line.words.length === split.length) {
            // basic validation: timings should be numbers and non-decreasing
            ok = line.words.every((w, idx) => {
                const t = parseFloat(w[1]);
                return !isNaN(t) && (idx === 0 || t >= parseFloat(line.words[idx - 1][1]));
            });
        }
        if (!ok) {
            // generate and persist
            line.words = generateWordsForLine(i);
        }
    }
}

// Create line container elements
function initializeLyrics() {
    normalizeLines();
    lyricsContainer.innerHTML = '';
    lyricsData.lines.forEach((lineData, index) => {
        const lineDiv = document.createElement('div');
        lineDiv.textContent = lineData.text;
        lineDiv.classList.add('line', 'hidden');
        lineDiv.dataset.startTime = lineData.start;
        lineDiv.id = 'line-' + index;
        lyricsContainer.appendChild(lineDiv);

        // Clicking a line jumps to that start time
        lineDiv.addEventListener('click', () => {
            audioPlayer.currentTime = parseFloat(lineDiv.dataset.startTime);
            audioPlayer.play();
        });
    });
}

// Render words for the active line as individual spans with timings
function renderLineWords(lineIndex) {
    if (lineIndex < 0 || lineIndex >= lyricsData.lines.length) return;
    const line = lyricsData.lines[lineIndex];
    const el = document.getElementById('line-' + lineIndex);
    if (!el) return;

    // If already rendered as words, skip
    if (el.dataset.rendered === 'true') return;

    let words = null; // array of [wordText, absoluteStart]
    if (line.words && Array.isArray(line.words)) {
        words = line.words.slice();
    } else {
        // Fallback: distribute timings evenly until the next line start (or +3s if none)
        const split = line.text.trim().split(/\s+/).filter(Boolean);
        const start = line.start || 0;
        const nextStart = (lyricsData.lines[lineIndex + 1] && lyricsData.lines[lineIndex + 1].start) || (start + 3.0);
        const total = Math.max(0.1, nextStart - start);
        const step = total / Math.max(1, split.length);
        words = split.map((w, i) => [w, start + i * step]);
        // Persist generated word timings back to the line object so they are visible later
        line.words = words.slice();
    }

    // Build spans
    el.innerHTML = '';
    words.forEach((w, wi) => {
        const span = document.createElement('span');
        // Always include a trailing space inside the span so the highlight covers the gap after the word
        span.textContent = w[0] + ' ';
        span.classList.add('karaoke-word');
        span.dataset.startTime = w[1];
        span.id = `line-${lineIndex}-word-${wi}`;
        el.appendChild(span);
    });
    el.dataset.rendered = 'true';
    // reset currentWordIndex when a new line is rendered
    currentWordIndex = -1;
}

// Update which line is visible and highlight current word inside it
function updateHighlight() {
    const currentTime = audioPlayer.currentTime;
    // Find the last line whose start time is <= currentTime
    let nextLineIndex = -1;
    for (let i = 0; i < lyricsData.lines.length; i++) {
        if (lyricsData.lines[i].start <= currentTime) nextLineIndex = i;
        else break;
    }

    // If we've passed the final line start, ensure it's selected
    if (nextLineIndex < 0 && currentTime >= lyricsData.lines[lyricsData.lines.length - 1].start) {
        nextLineIndex = lyricsData.lines.length - 1;
    }

    if (nextLineIndex !== currentLineIndex) {
        // Hide all except the current line
        lyricsData.lines.forEach((_, i) => {
            const el = document.getElementById('line-' + i);
            if (!el) return;
            if (i === nextLineIndex) {
                el.classList.remove('hidden');
                el.classList.add('highlighted');
                renderLineWords(i);
            } else {
                el.classList.add('hidden');
                el.classList.remove('highlighted');
            }
        });
        currentLineIndex = nextLineIndex;
    }

    // Update word highlighting for the current line only
    if (currentLineIndex > -1) {
        updateCurrentWord(currentTime);
    }
}

function updateCurrentWord(currentTime) {
    const lineEl = document.getElementById('line-' + currentLineIndex);
    if (!lineEl) return;
    const wordEls = Array.from(lineEl.querySelectorAll('.karaoke-word'));
    if (!wordEls.length) return;

    // Find current word index
    let nextWordIndex = -1;
    for (let i = 0; i < wordEls.length; i++) {
        const t = parseFloat(wordEls[i].dataset.startTime);
        if (t <= currentTime) nextWordIndex = i;
        else break;
    }

    if (nextWordIndex !== currentWordIndex) {
        if (currentWordIndex > -1 && wordEls[currentWordIndex]) wordEls[currentWordIndex].classList.remove('marked');
        if (nextWordIndex > -1 && wordEls[nextWordIndex]) wordEls[nextWordIndex].classList.add('marked');
        currentWordIndex = nextWordIndex;
    }
}

// Attach timeupdate listener and initialize
audioPlayer.addEventListener('timeupdate', updateHighlight);
initializeLyrics();
