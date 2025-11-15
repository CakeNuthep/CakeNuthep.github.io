// Lyrics data format (flexible):
// - Simple array form: [ [text, start], ... ]
// - Object form with word timings: [ { text: "...", start: 1.0, words: [["Hello",1.0],["world",1.5]] }, ... ]
// If 'words' is missing we will split the text and distribute timings evenly across the line's duration.
const lyricsData = {
    lines: [
        { text: "เพราะกลิ่นหอมจางจางๆ ที่ลอยตามลมมา", start: 25.0 },
        { text: "หวนให้ใจคำนึงนึกถึงคราเราต้องไกล", start: 29.0 },
        { text: "กลิ่นสุคนธ์ปนหวานใยทำให้ใจต้องขืนข่ม", start: 36.0 },
        { text: "ทุกข์ระทมตรอมตรม ทำให้ใจหวั่นไหว", start: 41.0 },
        { text: "หากการพบ รักจะต้องเคียงคู่ข้างเคียงกับการร่ำลา", start: 48.0 },
        { text: "จะสุขสมหวังได้นานเพียงใดก็แล้วแต่โชคชะตา", start: 54.0 },
        { text: "ฟ้าให้เวลามาเท่าไหร่", start: 60.0 },
        { text: "และมันจะยาวนานเท่าใด", start: 65.0 },
        { text: "กลิ่นดอกไม้ลั่นทมเจ้าหอมรื่นรมย์", start: 71.0 },
        { text: "เคยชื่นเคยชมดอมดม ให้ชื่นใจ", start: 75.0 },
        { text: "มาบัดนี้ตัวเจ้า ร่วงโรยไม่โชยกลิ่นหอม", start: 82.0 },
        { text: "กลีบขาวมัวหมอง ตรมตรอม เหี่ยวโรยร่วงไป", start: 88.0 },
        { text: "จากเคยงาม กลายเป็นความทราม ที่ไม่จีรังหรือไร", start: 95.0 },
        { text: "และความรักของฉันต้องเป็นดังเช่นเจ้าลั่นทมไหม", start: 101.0 },
        { text: "หากขัดขืนไม่ให้เวลาพัดพาสิ่งแปรผันไป", start: 107.0 },
        { text: "ฉันจะทำได้นานเท่าไหร่", start: 112.0 },
        { text: "ถ้าฉันต้องการแค่ตลอดไป", start: 118.0 },
        { text: "เพราะรักของฉันจะนานกว่านั้น นานชั่วกัลป์กัป นานนิรันดร์", start: 124.0 },
        { text: "จะไม่มีสิ่งไหนลบเลือนให้หายสิ้นกัน", start: 133.5 },
        { text: "ดอกไม้ใดจะหอมนานเกินกว่านั้น ไม่มี", start: 140.0 },
        { text: "เพราะรักของฉันคงอยู่เสมอ อยู่เพื่อเธอ และ เป็นของเธอ", start: 146.0 },
        { text: "กลิ่นหอมของความรักฉันจะติดตามพบเจอ", start: 157.0 },
        { text: "ตามพบเธอไม่มีโรยรา ไม่มีวันจาง", start: 163.5 },
        { text: "", start: 176.0 },
        { text: "หากขัดขืนไม่ให้เวลาพัดพาสิ่งแปรผันไป", start: 194.0 },
        { text: "ฉันจะทำได้นานเท่าไร", start: 200.0 },
        { text: "เพราะรักของฉันจะนานกว่านั้น นานชั่วกัลป์กัป นานนิรันดร์", start: 206.0 },
        { text: "จะไม่มีสิ่งไหนลบเลือนให้หายสิ้นกัน", start: 215.5 },   //9.5
        { text: "ดอกไม้ใดจะหอมนานเกินกว่านั้น ไม่มี", start: 222.0 },  //6.5
        { text: "เพราะรักของฉันคงอยู่เสมอ อยู่เพื่อเธอ และ เป็นของเธอ", start: 228.0 },  //6.0
        { text: "กลิ่นหอมของความรักฉันจะติดตามพบเจอ", start: 239.0 },  //11.0
        { text: "ตามพบเธอไม่มีโรยรา ไม่มีวันจาง", start: 245.5 },  //6.5
        { text: " ", start: 255.5 },
        { text: "กลิ่นดอกไม้ลั่นทมเจ้าหอมรื่นรมย์", start: 264.0 },
        { text: "เคยชื่นเคยชมดอมดมให้ชื่นใจ", start: 269.0 },
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

    // Render the line as plain text (no per-word spans) since we don't want to mark words
    el.textContent = line.text;
    el.dataset.rendered = 'true';
    // reset currentWordIndex in case other code relies on it
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

    // Word-level marking disabled: we only show the line text, no per-word highlighting.
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
