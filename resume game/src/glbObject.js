import * as THREE from 'three';
import {Box} from './Box.js';

class glbObject extends Box {
    constructor(name,model,
        width,
        height,
        depth,
        collisionDetectionEnabled=false,
        gravityEnabled=false,
        showCollisionBox=false,
        updateFunction = null,

    ) {

        // bounding box for collision detect
        const size = new THREE.Vector3(1,1.5,1);
        super({
            name: name,
            width: width,
            height: height,
            depth: depth,
            position: new THREE.Vector3(0, height/2, 0),
        });
        model.add(this.cube);
        this.model = model;
        this.onGround = true;
        this.gravityEnabled = gravityEnabled;
        this.showCollisionBox = showCollisionBox;
        this.collisionDetectionEnabled = collisionDetectionEnabled;    
        this.updateFunction = updateFunction;
    }

    

    setUpdateFunction(updateFunction) {
        this.updateFunction = updateFunction;
    }

    update(delta) {
        this.updateSides();
        if (this.updateFunction) {
            this.updateFunction(delta);
        }
    }
}

export { glbObject };