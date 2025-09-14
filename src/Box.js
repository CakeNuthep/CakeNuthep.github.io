import * as THREE from 'three';

class Box {
    constructor({
            width,
            height,
            depth,
            position,
            velocity = new THREE.Vector3(0, 0, 0),
            gravity = 0.1,
            isCollition = true,
            passThroughWhenCollision = true,
            
        }) {
        this.GRAVITY = gravity;
        this.onGround = false;
        this.velocity = velocity;

       
        this.raycaster = new THREE.Raycaster();

        this.cube = this.createBox(width, height, depth, position);
        this.cube.name = 'CollisionBox';
        this.showCollisionBox = false;
        this.collisionDetectionEnabled = isCollition;
        this.passThroughWhenCollision = passThroughWhenCollision;
        this.updateSides();
    }

    updateSides() {
        if(!this.cube) return;
        let position = new THREE.Vector3();
        this.cube.getWorldPosition(position);
        this.right = position.x + this.cube.scale.x / 2
        this.left = position.x - this.cube.scale.x / 2

        this.bottom = position.y - this.cube.scale.y / 2
        this.top = position.y + this.cube.scale.y / 2

        this.front = position.z + this.cube.scale.z / 2
        this.back = position.z - this.cube.scale.z / 2
        this.cube.visible = this.showCollisionBox;
    }

    describe() {
        return `Box: width=${this.cube.x}, height=${this.cube.y}, depth=${this.cube.z}`;
    }  

    boxCollision({ box1, box2 }) {
        if(box1.collisionDetectionEnabled && box2.collisionDetectionEnabled){
            const xCollision = box1.right >= box2.left && box1.left <= box2.right
            const yCollision =
                box1.bottom <= box2.top && box1.top >= box2.bottom
            const zCollision = box1.front >= box2.back && box1.back <= box2.front

            return xCollision && yCollision && zCollision
        }
        return false;
    }

    applyGravity(floor) {
        // const player = characterControls.model;
        const down = new THREE.Vector3(0, -1, 0); // Ray points straight down
        let position = new THREE.Vector3();
        this.cube.getWorldPosition(position);
        position.y = position.y - this.cube.position.y; 
        this.velocity.y -= this.GRAVITY;
        
    
        const rayOrigin = new THREE.Vector3(position.x, position.y + 10, position.z);
        this.raycaster.set(rayOrigin, down);
        const intersects = this.raycaster.intersectObject(floor);
        if (intersects.length > 0) {
            position.y += this.velocity.y;
            const terrainHeight = intersects[0].point.y;
            if (position.y < terrainHeight) {
                position.y = terrainHeight;
                this.velocity.y = 0;
                this.onGround = true;
                
            }
        }
        return { 
                y: position.y, 
                velocity: this.velocity.y, 
                onGround: this.onGround 
            };
    }

    createBox(width, height, depth,position) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshBasicMaterial({
            color: 0x0000ff,
            wireframe: true,
            wireframeLinewidth:10,
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(position.x, position.y, position.z);
        return cube;
    }
}

export { Box };