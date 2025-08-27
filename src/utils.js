const W = 'KeyW';
const A = 'KeyA';
const S = 'KeyS';
const D = 'KeyD';
const SHIFT = 'ShiftLeft';
const DIRECTIONS = [W, A, S, D];

class KeyDisplay {
    constructor() {
        this.map = new Map();
        const w = {element:document.createElement("div"), display:'w'};
        const a = {element:document.createElement("div"), display:'a'};
        const s = {element:document.createElement("div"), display:'s'};
        const d = {element:document.createElement("div"), display:'d'};
        const shift = {element:document.createElement("div"), display:'shift'};
        this.map.set(W, w);
        this.map.set(A, a);
        this.map.set(S, s);
        this.map.set(D, d);
        this.map.set(SHIFT, shift);
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
        this.updatePosition();
        this.map.forEach((v, _) => {
            document.body.append(v.element);
        });
    }

    updatePosition() {
        this.map.get(W).element.style.top = `${window.innerHeight - 150}px`;
        this.map.get(A).element.style.top = `${window.innerHeight - 100}px`;
        this.map.get(S).element.style.top = `${window.innerHeight - 100}px`;
        this.map.get(D).element.style.top = `${window.innerHeight - 100}px`;
        this.map.get(SHIFT).element.style.top = `${window.innerHeight - 100}px`;
        this.map.get(W).element.style.left = `300px`;
        this.map.get(A).element.style.left = `200px`;
        this.map.get(S).element.style.left = `300px`;
        this.map.get(D).element.style.left = `400px`;
        this.map.get(SHIFT).element.style.left = `50px`;
    }

    down(key) {
        if (this.map.get(key)) {
            this.map.get(key).element.style.color = 'red';
        }
    }

    up(key) {
        if (this.map.get(key)) {
            this.map.get(key).element.style.color = 'blue';
        }
    }
}

export { W, A, S, D, SHIFT, DIRECTIONS, KeyDisplay };
