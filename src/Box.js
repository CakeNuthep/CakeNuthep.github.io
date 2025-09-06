import * as THREE from 'three';

class Box {
    constructor({
            width,
            height,
            depth,
            position,
            velocity = new THREE.Vector3(0, 0, 0),
            gravity = 0.1
            
        }) {
        this.GRAVITY = gravity;
        this.width = width;
        this.height = height;
        this.depth = depth
        this.onGround = false;

        this.position = position;
        this.velocity = velocity;

        this.right = this.position.x + this.width / 2;
        this.left = this.position.x - this.width / 2;

        this.bottom = this.position.y - this.height / 2;
        this.top = this.position.y + this.height / 2;

        this.front = this.position.z + this.depth / 2;
        this.back = this.position.z - this.depth / 2;
        this.raycaster = new THREE.Raycaster();

        this.cube = this.createBox();
        this.showCollisionBox = false;
        this.collisionDetectionEnabled = false;
    }

    updateSides(position) {
        this.position.set(position.x, position.y, position.z);
        this.right = this.position.x + this.width / 2
        this.left = this.position.x - this.width / 2

        this.bottom = this.position.y - this.height / 2
        this.top = this.position.y + this.height / 2

        this.front = this.position.z + this.depth / 2
        this.back = this.position.z - this.depth / 2
        this.updateBox();
        this.cube.visible = this.showCollisionBox;
    }

    describe() {
        return `Box: width=${this.width}, height=${this.height}, area=${this.area()}, perimeter=${this.perimeter()}`;
    }  

    boxCollision({ box1, box2 }) {
        if(this.collisionDetectionEnabled){
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
        this.velocity.y -= this.GRAVITY;
        this.position.y += this.velocity.y;
    
        const rayOrigin = new THREE.Vector3(this.position.x, this.position.y + 10, this.position.z);
        this.raycaster.set(rayOrigin, down);
        const intersects = this.raycaster.intersectObject(floor);
        if (intersects.length > 0) {
            const terrainHeight = intersects[0].point.y;
            if (this.position.y < terrainHeight) {
                this.position.y = terrainHeight;
                this.velocity.y = 0;
                this.onGround = true;
                
            }
        }
        return { 
                y: this.position.y, 
                velocity: this.velocity.y, 
                onGround: this.onGround 
            };
    }

    createBox() {
        const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(this.position.x, this.position.y, this.position.z);
        return cube;
    }

    updateBox() {
        this.cube.position.set(this.position.x, this.position.y, this.position.z);
        this.cube.scale.set(this.width, this.height, this.depth);
    }
}

export { Box };