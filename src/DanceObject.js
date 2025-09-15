import {Box} from './Box.js';
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

class DanceObject extends Box {
    constructor({
            name,
            width,
            height,
            depth,
            position
            
        }) {
        super({
            name,
            width,
            height,
            depth,
            position: new THREE.Vector3(0, 0, 0),
            isCollition: true,
            passThroughWhenCollision: true,
        });
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.model = this.setupInteractiveCube(position);
        this.model.add(this.cube);
    }

    setupInteractiveCube(position) {
        const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        const material = new THREE.MeshStandardMaterial({
            color: 0x005733,
            metalness: 0.5,
            roughness: 0.7,
            transparent: true,
            opacity: 0.5
        });
        const cube = new THREE.Mesh(geometry, material);


        cube.position.set(position.x, position.y, position.z);
    
        // Create the top-level container div
        const holdContainer = document.createElement('div');
        holdContainer.classList.add('hold-container');

        // Create the button element
        const holdButton = document.createElement('button');
        holdButton.id = 'hold-button';
        holdButton.style.display  = 'none';

        // Create the progress circle div
        const progressCircle = document.createElement('div');
        progressCircle.classList.add('progress-circle');

        // Create the span for the button text
        const buttonText = document.createElement('span');
        buttonText.classList.add('button-text');
        buttonText.textContent = 'Hold E';

        // Append the inner elements to the button
        holdButton.append(progressCircle, buttonText);

        // Append the button to the main container
        holdContainer.append(holdButton);

        // // Append the final element to the document body or another container
        this.setHtmlElement(holdButton)
    
        const label = new CSS2DObject(holdContainer);
        label.position.set(0, 1.5, 0);
        cube.add(label);

        cube.position.set(position.x, position.y, position.z);
        return cube;
    } 

    update() {
        this.updateSides();
    }
}

export { DanceObject };