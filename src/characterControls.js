import * as THREE from 'three';
import { A, D, DIRECTIONS, S, W, SHIFT } from './utils.js';
import {Box} from './Box.js';

class CharacterControls extends Box {
    constructor(model, mixer, animationsMap, orbitControl, camera, initialAction) {
        const box = new THREE.Box3().setFromObject(model);

        // Get the size of the bounding box
        const size = new THREE.Vector3();
        box.getSize(size);
        super({
            width: size.x,
            height: size.y,
            depth: size.z,
            position: model.position
        });
        this.model = model;
        this.mixer = mixer;
        this.animationsMap = animationsMap;
        this.orbitControl = orbitControl;
        this.camera = camera;

        this.currentAction = initialAction;
        this.toggleRun = true;
        this.isJumping = false;
        this.onGround = true;
        this.jumpStrength = 1;

        this.walkDirection = new THREE.Vector3();
        this.rotateAngle = new THREE.Vector3(0, 1, 0);
        this.rotateQuaternion = new THREE.Quaternion();
        this.cameraTarget = new THREE.Vector3();

        this.fadeDuration = 0.2;
        this.runVelocity = 5;
        this.walkVelocity = 2;

        this.playInitialAnimation();
        this.setupCameraTarget();
        
    }

    playInitialAnimation() {
        const initialAnimation = this.animationsMap.get(this.currentAction);
        if (initialAnimation) {
            initialAnimation.play();
        }
    }

    switchRunToggle() {
        this.toggleRun = !this.toggleRun;
    }

    jump() {
        if (this.onGround) {
            this.onGround = false;
            this.velocity.y = this.jumpStrength;
            this.isJumping = true;
            console.log('Jump initiated');
        }
        else {
            // Prevent double jump
            return;
        }
    }

    update(delta, keysPressed, floor, objects=[]) {
        const directionPressed = this.isDirectionPressed(keysPressed);
        const {isJump,isMove,nextAction} = this.determineNextAction(directionPressed);
        console.log(`isJump: ${isJump}, isMove: ${isMove}, nextAction: ${nextAction}`);
        this.updateAnimation(nextAction);
        this.mixer.update(delta);
        const currentPosition = this.model.position.clone();

        if (isMove) {
            this.updateSides(this.model.position);
            this.handleMovement(delta, keysPressed,objects);
        }
        
        this.updateSides(this.model.position);
        let { y, velocity, onGround } =  this.applyGravity(floor);
        this.model.position.y = y;
        if(onGround){
            this.isJumping = false;
        }
        // let isColiitionthis = this.collisionDetection(objects);
        // if (isColiitionthis) {
        //     console.log('Reverting to previous position due to collision');
        //     this.updateSides(this.model.position); // Update sides after reverting position
        //     this.model.position.copy(currentPosition);
        // }

        if(this.isMoving(this.currentAction) || isJump){
            this.updateCameraTarget();
        }
    }

    isDirectionPressed(keysPressed) {
        return DIRECTIONS.some((key) => keysPressed[key] === true);
    }

    determineNextAction(directionPressed) {
        var isJump = false;
        var nextAction = 'Idle';
        var isMove = false;
        if (this.isJumping) {
            isJump = true;
            nextAction = 'Idle';
        }
        if (directionPressed && this.toggleRun) {
            isMove = true;

            if(!isJump){
                nextAction = 'Run';
            }
        } else if (directionPressed) {
            isMove = true;
            if(!isJump){
                nextAction = 'Walk';
            }
        } else {
            if(!isJump){
                nextAction = 'Idle';
            }
        }

        
        return {isJump, isMove, nextAction};
    }

    updateAnimation(nextAction) {
        if (this.currentAction !== nextAction) {
            const toPlay = this.animationsMap.get(nextAction);
            const current = this.animationsMap.get(this.currentAction);

            if (current) current.fadeOut(this.fadeDuration);
            if (toPlay) toPlay.reset().fadeIn(this.fadeDuration).play();

            this.currentAction = nextAction;
        }
    }

    isMoving(action) {
        return action === 'Run' || action === 'Walk';
    }

    handleMovement(delta, keysPressed, objects=[]) {
        const angleYCameraDirection = this.calculateCameraDirectionAngle();
        const directionOffset = this.calculateDirectionOffset(keysPressed);
        const currentPosition = this.model.position.clone();

        this.rotateModel(angleYCameraDirection, directionOffset);
        this.moveModel(delta, directionOffset);
        this.updateSides(this.model.position);
        let isColiitionthis = this.collisionDetection(objects);
        if (isColiitionthis) {
            this.model.position.copy(currentPosition);
            this.updateSides(this.model.position); // Update sides after reverting position
        }
        
    }

    collisionDetection(objects) {
        for (let obj of objects) {
            if (this.boxCollision({ box1: this, box2: obj })) {
                console.log('Collision detected with object at position:', obj.position);
                return true;
            } 
        }
        return false;
    }

    calculateCameraDirectionAngle() {
        return Math.atan2(
            this.camera.position.x - this.model.position.x,
            this.camera.position.z - this.model.position.z
        );
    }

    calculateDirectionOffset(keysPressed) {
        let directionOffset = 0;

        if (keysPressed[W]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4; // W + A
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4; // W + D
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2; // S + A
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2; // S + D
            } else {
                directionOffset = Math.PI; // S
            }
        } else if (keysPressed[A]) {
            directionOffset = Math.PI / 2; // A
        } else if (keysPressed[D]) {
            directionOffset = -Math.PI / 2; // D
        }

        return directionOffset;
    }

    rotateModel(angleYCameraDirection, directionOffset) {
        this.rotateQuaternion.setFromAxisAngle(
            this.rotateAngle,
            angleYCameraDirection + directionOffset
        );
        this.model.quaternion.rotateTowards(this.rotateQuaternion, 0.2);
    }

    moveModel(delta, directionOffset) {
        this.calculateWalkDirection(directionOffset);

        const velocity =
            this.currentAction === 'Run' ? this.runVelocity : this.walkVelocity;
        const moveX = this.walkDirection.x * velocity * delta;
        const moveZ = this.walkDirection.z * velocity * delta;

        this.model.position.x += moveX;
        this.model.position.z += moveZ;
    }

    calculateWalkDirection(directionOffset) {
        this.camera.getWorldDirection(this.walkDirection);
        this.walkDirection.y = 0;
        this.walkDirection.normalize();
        this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);
    }

    updateCameraTarget() {
        const distance = 5; // Desired distance from the model
        const direction = new THREE.Vector3();
        direction.subVectors(this.model.position, this.camera.position);
        const magnitude = direction.length();

        // 2. Normalize the direction vector (set its length to 1)
        direction.normalize();

        // 3. Scale the direction vector by the step size
        direction.multiplyScalar(magnitude - distance);

         // 4. Add the resulting vector to vectorA
        const cameraPosition = this.camera.position.clone().add(direction);

        this.camera.position.lerp(cameraPosition, 0.1); // Smooth transition
        this.camera.position.y = this.model.position.y + 3; // Maintain a height above the model

        // Update camera target
        this.cameraTarget.set(
            this.model.position.x,
            this.model.position.y + 1, // Keep target slightly above the model
            this.model.position.z
        );
        this.orbitControl.target = this.cameraTarget;
    }

    setupCameraTarget() {
        // Set initial camera position for third-person view
        const cameraOffset = new THREE.Vector3(0, 3, -4); // Adjust height and distance
        const initialCameraPosition = this.model.position.clone().add(cameraOffset);

        this.camera.position.copy(initialCameraPosition);

        // Set initial camera target
        this.cameraTarget.set(
            this.model.position.x,
            this.model.position.y + 1, // Keep target slightly above the model
            this.model.position.z
        );
        this.orbitControl.target = this.cameraTarget;
    }
}

export { CharacterControls };