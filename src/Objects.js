import {Box} from './Box.js';
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

class Object extends Box {
    constructor({
            width,
            height,
            depth,
            position
            
        }) {
        super({
            width,
            height,
            depth,
            position: new THREE.Vector3(0, 0, 0),
            isCollition: true,
        });
        this.model = this.setupInteractiveCube(position);
        this.model.add(this.cube);
    }

    setupInteractiveCube(position) {
        const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff5733,
            metalness: 0.5,
            roughness: 0.7,
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(position.x, position.y, position.z);
        cube.userData.link = 'https://threejs.org/';
        cube.userData.label = 'Click Me!';
    
        const labelDiv = document.createElement('a');
        labelDiv.className = 'link-label';
        labelDiv.textContent = cube.userData.label;
        labelDiv.href = cube.userData.link;
        labelDiv.target = '_blank';
    
        const label = new CSS2DObject(labelDiv);
        label.position.set(0, 1, 0);
        cube.add(label);
        return cube;
    } 

    update() {
        this.updateSides();
    }
}

export { Object };