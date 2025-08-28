const W = 'KeyW';
const A = 'KeyA';
const S = 'KeyS';
const D = 'KeyD';
const SHIFT = 'ShiftLeft';
const SPACE = 'Space';
const DIRECTIONS = [W, A, S, D];
const keysPressed = {};

class KeyDisplay {
    constructor(characterControls) {
        this.characterControls = characterControls;
        this.map = new Map();
        const w = {element:document.createElement("div"), display:'w'};
        const a = {element:document.createElement("div"), display:'a'};
        const s = {element:document.createElement("div"), display:'s'};
        const d = {element:document.createElement("div"), display:'d'};
        const shift = {element:document.createElement("button"), display:'run'};
        const space = {element:document.createElement("div"), display:'jump'};
        
        this.map.set(W, w);
        this.map.set(A, a);
        this.map.set(S, s);
        this.map.set(D, d);
        this.map.set(SHIFT, shift);
        this.map.set(SPACE, space);

        this.map.forEach((v, k) => {
            v.element.style.color = 'blue';
            v.element.style.fontSize = 'clamp(1.2rem, 6vw, 3rem)';
            v.element.style.fontWeight = '800';
            v.element.style.position = 'absolute';
            v.element.style.padding = '0.2em 0.5em';
            v.element.style.borderRadius = '0.4em';
            v.element.style.background = 'rgba(0,0,0,0.15)';
            v.element.textContent = v.display;
            v.element.style.boxSizing = 'border-box';
            v.element.style.wordBreak = 'break-word';
            v.element.style.transition = 'font-size 0.2s, background 0.2s';
        });
        shift.element.style.border = '2px solid #007BFF';
        shift.element.style.width = 'auto';
        shift.element.style.height = 'auto';
        shift.element.style.textAlign = 'center';
        shift.element.style.lineHeight = 'normal';
        shift.element.style.cursor = 'pointer';
        shift.element.style.transform = 'scale(0.9)';
        shift.element.style.background = '#3b6cf1ff'; // Green for active
        shift.element.style.color = 'white';

        this.updatePosition();
        this.map.forEach((v, k) => {
            document.body.append(v.element);
            v.element.style.cursor = 'pointer';
            let code = k;
            let intervalId = null;
            let holdTimer;
            const holdDuration = 500; // milliseconds

            const dispatchKeyDown = () => {
                document.dispatchEvent(new KeyboardEvent('keydown', { key: v.display, code: code, bubbles: true }));
            };

            const dispatchKeyUp = () => {
                document.dispatchEvent(new KeyboardEvent('keyup', { key: v.display, code: code, bubbles: true }));
            };

            v.element.addEventListener('mousedown', () => {
                dispatchKeyDown();
            });

            v.element.addEventListener('mouseup', () => {
                dispatchKeyUp();
            });

            v.element.addEventListener('touchstart', (event) => {
                event.preventDefault(); // Prevent default touch behavior
                console.log('touch start');
                dispatchKeyDown();
                holdTimer = setTimeout(() => {
                    // This code executes if the hold duration is met
                    console.log('Button held!');
                    // Add your hold action here
                }, holdDuration);
            });

            v.element.addEventListener('touchend', () => {
                clearTimeout(holdTimer); // Clear the timer if finger is lifted
                dispatchKeyUp();
            });

            v.element.addEventListener('touchcancel', () => {
                clearTimeout(holdTimer); // Clear the timer if touch is cancelled
            });
        });
    }

    updatePosition() {
        this.map.get(W).element.style.top = `${window.innerHeight - 180}px`;
        this.map.get(A).element.style.top = `${window.innerHeight - 100}px`;
        this.map.get(S).element.style.top = `${window.innerHeight - 100}px`;
        this.map.get(D).element.style.top = `${window.innerHeight - 100}px`;
        this.map.get(SHIFT).element.style.top = `${window.innerHeight - 100}px`;
        this.map.get(SPACE).element.style.top = `${window.innerHeight - 100}px`;
        this.map.get(W).element.style.left = `295px`;
        this.map.get(A).element.style.left = `200px`;
        this.map.get(S).element.style.left = `300px`;
        this.map.get(D).element.style.left = `400px`;
        this.map.get(SHIFT).element.style.left = `50px`;
        this.map.get(SPACE).element.style.right = `50px`;
    }

    down(key) {
        console.log('key down in key display ' + key);
        if (this.map.get(key)) {
            this.map.get(key).element.style.color = 'red';
        }
        if (key === SHIFT && this.characterControls) {
                    this.characterControls.switchRunToggle();
                    if(this.characterControls.toggleRun) {
                        const shift = this.map.get(SHIFT);
                        shift.element.style.transform = 'scale(0.9)';
                        shift.element.style.background = '#3b6cf1ff'; // Green for active
                        shift.element.style.color = 'white';
                    } else {
                        const shift = this.map.get(SHIFT);
                        shift.element.style.transform = 'scale(1)';
                        shift.element.style.background = '#807072ff'; // Red for inactive
                        shift.element.style.color = '#cdcdcd70';
                    }
        }
        keysPressed[key] = true;
    }

    up(key) {
        if (key !== SHIFT && this.map.get(key)) {
            this.map.get(key).element.style.color = 'blue';
        }
        
        keysPressed[key] = false;
    }

    getKeysPressed() {
        return keysPressed;
    }
}

export { W, A, S, D, SHIFT, DIRECTIONS, KeyDisplay };
