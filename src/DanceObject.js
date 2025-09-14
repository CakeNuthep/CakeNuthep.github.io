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
        return cube;
    } 

    update() {
        this.updateSides();
    }
}

export { Object };