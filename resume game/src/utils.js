
const A = 'KeyA';
const D = 'KeyD';
const E = 'KeyE';
const SPACE = 'Space';
const DIRECTIONS = [A, D];
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
            [A, { element: document.createElement("div"), display: 'a' }],
            [D, { element: document.createElement("div"), display: 'd' }],
            [E, { element: document.createElement("div"), display: 'e' }],
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
            [A]: { top: `${window.innerHeight - 100}px`, left: '50px' },
            [D]: { top: `${window.innerHeight - 100}px`, left: '150px' },
            [E]: { top: `${window.innerHeight - 100}px`, right: '230px' },
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
        if (key === SPACE && this.characterControls) {
            this.characterControls.jump();
        }

        if(key == E && this.characterControls && !this.holdInterval){
            this.startTime = Date.now();
            if(!this.characterControls.isDancing()){
                this.holdInterval = setInterval(() => {
                    console.log('E is still held...');
                    if(this.characterControls)
                    {
                        this.characterControls.updateIdleAction();
                        const object = this.characterControls.getFirstObjecHasCollision();
                        if(object)
                        {
                            const elapsedTime = Date.now() - this.startTime;
                            object.playAnimateHtml(elapsedTime);
                        }
                    }
                }, 30); // Repeat every 500 milliseconds
                console.log(this.holdInterval);
            }
        }
        keysPressed[key] = true;

        if(callbackFuntion)
        {
            callbackFuntion();
        }
    }

    up(key) {
        if (this.map.get(key)) {
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

            if(object)
            {
                object.stopAnimateHtml();
            }
        }
        keysPressed[key] = false;
    }

    getKeysPressed() {
        return keysPressed;
    }
}

export { A, D,E, DIRECTIONS, KeyDisplay };
