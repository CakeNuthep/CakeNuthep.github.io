const W = 'KeyW';
const A = 'KeyA';
const S = 'KeyS';
const D = 'KeyD';
const E = 'KeyE';
const SHIFT = 'ShiftLeft';
const SPACE = 'Space';
const DIRECTIONS = [W, A, S, D];
const keysPressed = {};

class KeyDisplay {
    constructor(characterControls) {
        this.characterControls = characterControls;
        this.map = this.initializeKeyMap();
        this.setupKeyElements();
        this.updatePosition();
        this.attachEventListeners();
        this.holdInterval = null;
        this.startTime = Date.now();
    }

    initializeKeyMap() {
        return new Map([
            [W, { element: document.createElement("div"), display: 'w' }],
            [A, { element: document.createElement("div"), display: 'a' }],
            [S, { element: document.createElement("div"), display: 's' }],
            [D, { element: document.createElement("div"), display: 'd' }],
            [E, { element: document.createElement("div"), display: 'e' }],
            [SHIFT, { element: document.createElement("button"), display: 'run' }],
            [SPACE, { element: document.createElement("div"), display: 'jump' }],
        ]);
    }

    setupKeyElements() {
        this.map.forEach((v, k) => {
            Object.assign(v.element.style, {
                color: 'blue',
                fontSize: 'clamp(1.2rem, 6vw, 3rem)',
                fontWeight: '800',
                position: 'absolute',
                padding: '0.2em 0.5em',
                borderRadius: '0.4em',
                background: 'rgba(0,0,0,0.15)',
                boxSizing: 'border-box',
                wordBreak: 'break-word',
                transition: 'font-size 0.2s, background 0.2s',
            });
            v.element.textContent = v.display;
        });

        const shift = this.map.get(SHIFT).element;
        Object.assign(shift.style, {
            border: '2px solid #007BFF',
            width: 'auto',
            height: 'auto',
            textAlign: 'center',
            lineHeight: 'normal',
            cursor: 'pointer',
            transform: 'scale(0.9)',
            background: '#3b6cf1ff',
            color: 'white',
        });
    }

    attachEventListeners() {
        this.map.forEach((v, k) => {
            document.body.append(v.element);
            v.element.style.cursor = 'pointer';

            const dispatchKeyDown = () => {
                document.dispatchEvent(new KeyboardEvent('keydown', { key: v.display, code: k, bubbles: true }));
            };

            const dispatchKeyUp = () => {
                document.dispatchEvent(new KeyboardEvent('keyup', { key: v.display, code: k, bubbles: true }));
            };

            v.element.addEventListener('mousedown', dispatchKeyDown);
            v.element.addEventListener('mouseup', dispatchKeyUp);

            let holdTimer;
            const holdDuration = 500;

            v.element.addEventListener('touchstart', (event) => {
                event.preventDefault();
                dispatchKeyDown();
                holdTimer = setTimeout(() => {
                    console.log('Button held!');
                }, holdDuration);
            });

            v.element.addEventListener('touchend', () => {
                clearTimeout(holdTimer);
                dispatchKeyUp();
            });

            v.element.addEventListener('touchcancel', () => {
                clearTimeout(holdTimer);
            });
        });
    }

    updatePosition() {
        const positions = {
            [W]: { top: `${window.innerHeight - 180}px`, left: '295px' },
            [A]: { top: `${window.innerHeight - 100}px`, left: '200px' },
            [S]: { top: `${window.innerHeight - 100}px`, left: '300px' },
            [D]: { top: `${window.innerHeight - 100}px`, left: '400px' },
            [E]: { top: `${window.innerHeight - 100}px`, right: '230px' },
            [SHIFT]: { top: `${window.innerHeight - 100}px`, left: '50px' },
            [SPACE]: { top: `${window.innerHeight - 100}px`, right: '50px' },
        };

        this.map.forEach((v, k) => {
            Object.assign(v.element.style, positions[k]);
        });
    }

    down(key, callbackFuntion=null) {
        // console.log('key down in key display ' + key);
        if (this.map.get(key)) {
            this.map.get(key).element.style.color = 'red';
        }
        if (key === SHIFT && this.characterControls) {
            this.toggleShiftKey();
        }
        if (key === SPACE && this.characterControls) {
            this.characterControls.jump();
        }

        if(key == E && this.characterControls && !this.holdInterval){
            this.startTime = Date.now();
            this.holdInterval = setInterval(() => {
                console.log('E is still held...');
                if(this.characterControls)
                {
                    this.characterControls.updateIdleAction();
                    const object = this.characterControls.getFirstObjecHasCollision();
                    const elapsedTime = Date.now() - this.startTime;
                    object.playAnimateHtml(elapsedTime);
                }
            }, 30); // Repeat every 500 milliseconds
            console.log(this.holdInterval);
        }
        keysPressed[key] = true;

        if(callbackFuntion)
        {
            callbackFuntion();
        }
    }

    toggleShiftKey() {
        this.characterControls.switchRunToggle();
        const shift = this.map.get(SHIFT);
        if (this.characterControls.toggleRun) {
            Object.assign(shift.element.style, {
                transform: 'scale(0.9)',
                background: '#3b6cf1ff',
                color: 'white',
            });
        } else {
            Object.assign(shift.element.style, {
                transform: 'scale(1)',
                background: '#807072ff',
                color: '#cdcdcd70',
            });
        }
    }

    up(key) {
        if (key !== SHIFT && this.map.get(key)) {
            this.map.get(key).element.style.color = 'blue';
        }
        if (key == E && this.holdInterval){
            this.characterControls.setDefaultIdleAction();
            console.log("Stop Interval")
            console.log(this.holdInterval);
            // Stop the continuous action
            clearInterval(this.holdInterval);
            this.holdInterval = null;

            const object = this.characterControls.getFirstObjecHasCollision();
            object.stopAnimateHtml();
        }
        keysPressed[key] = false;
    }

    getKeysPressed() {
        return keysPressed;
    }
}

export { W, A, S, D,E, SHIFT, DIRECTIONS, KeyDisplay };
