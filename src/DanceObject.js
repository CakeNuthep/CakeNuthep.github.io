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
        return cube;
    } 

    update() {
        this.updateSides();
    }
}

export { DanceObject };